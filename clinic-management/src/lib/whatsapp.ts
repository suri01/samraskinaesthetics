import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clinicSettings, messageOutbox } from "@/db/schema";
import { decryptSecret } from "@/lib/crypto";

export type WhatsAppProvider = "meta" | "twilio" | "mocked";

export type WhatsAppRuntimeConfig = {
  enabled: boolean;
  provider: WhatsAppProvider;
  phoneNumberId: string | null;
  accessToken: string | null;
  templateName: string | null;
  templateLanguage: string;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioWhatsappFrom: string | null;
};

function asProvider(value: string | null | undefined): WhatsAppProvider {
  if (value === "meta" || value === "twilio" || value === "mocked") return value;
  return "mocked";
}

/** Digits-only E.164 without leading +. */
export function normalizeWhatsAppTo(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits;
}

export async function loadWhatsAppConfig(clinicId: string): Promise<WhatsAppRuntimeConfig> {
  const [row] = await db
    .select()
    .from(clinicSettings)
    .where(eq(clinicSettings.clinicId, clinicId))
    .limit(1);

  const envProvider = asProvider(process.env.WHATSAPP_PROVIDER);
  const provider = asProvider(row?.whatsappProvider ?? envProvider);

  let accessToken: string | null = null;
  if (row?.whatsappAccessTokenEnc) {
    try {
      accessToken = decryptSecret(row.whatsappAccessTokenEnc);
    } catch {
      accessToken = null;
    }
  }
  if (!accessToken) accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || null;

  let twilioAuthToken: string | null = null;
  if (row?.twilioAuthTokenEnc) {
    try {
      twilioAuthToken = decryptSecret(row.twilioAuthTokenEnc);
    } catch {
      twilioAuthToken = null;
    }
  }
  if (!twilioAuthToken) twilioAuthToken = process.env.TWILIO_AUTH_TOKEN?.trim() || null;

  return {
    enabled: Boolean(row?.whatsappEnabled),
    provider,
    phoneNumberId:
      row?.whatsappPhoneNumberId?.trim() ||
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ||
      null,
    accessToken,
    templateName:
      row?.whatsappTemplateName?.trim() ||
      process.env.WHATSAPP_TEMPLATE_NAME?.trim() ||
      null,
    templateLanguage:
      row?.whatsappTemplateLanguage?.trim() ||
      process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() ||
      "en_GB",
    twilioAccountSid:
      row?.twilioAccountSid?.trim() || process.env.TWILIO_ACCOUNT_SID?.trim() || null,
    twilioAuthToken,
    twilioWhatsappFrom:
      row?.twilioWhatsappFrom?.trim() || process.env.TWILIO_WHATSAPP_FROM?.trim() || null,
  };
}

export function resolveWhatsAppMode(config: WhatsAppRuntimeConfig): WhatsAppProvider {
  if (!config.enabled) return "mocked";
  if (config.provider === "meta" && config.accessToken && config.phoneNumberId) return "meta";
  if (
    config.provider === "twilio" &&
    config.twilioAccountSid &&
    config.twilioAuthToken &&
    config.twilioWhatsappFrom
  ) {
    return "twilio";
  }
  return "mocked";
}

/** Back-compat helper used by older call sites. */
export function whatsappMode(): WhatsAppProvider {
  if (process.env.WHATSAPP_PROVIDER === "meta" && process.env.WHATSAPP_ACCESS_TOKEN) return "meta";
  if (process.env.WHATSAPP_PROVIDER === "twilio" && process.env.TWILIO_ACCOUNT_SID) return "twilio";
  return "mocked";
}

async function sendViaMeta(
  config: WhatsAppRuntimeConfig,
  toPhone: string,
  bodyText: string,
  templateParams: string[],
): Promise<{ providerRef: string }> {
  const to = normalizeWhatsAppTo(toPhone);
  const url = `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;

  const payload = config.templateName
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: config.templateName,
          language: { code: config.templateLanguage || "en_GB" },
          components: [
            {
              type: "body",
              parameters: templateParams.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: bodyText },
      };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Meta WhatsApp error (${res.status})`);
  }
  const id = data.messages?.[0]?.id;
  if (!id) throw new Error("Meta WhatsApp response missing message id");
  return { providerRef: id };
}

async function sendViaTwilio(
  config: WhatsAppRuntimeConfig,
  toPhone: string,
  bodyText: string,
): Promise<{ providerRef: string }> {
  const to = `whatsapp:+${normalizeWhatsAppTo(toPhone)}`;
  const from = config.twilioWhatsappFrom!.startsWith("whatsapp:")
    ? config.twilioWhatsappFrom!
    : `whatsapp:${config.twilioWhatsappFrom}`;
  const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString(
    "base64",
  );
  const params = new URLSearchParams({
    To: to,
    From: from,
    Body: bodyText,
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    sid?: string;
    message?: string;
    error_message?: string;
  };
  if (!res.ok) {
    throw new Error(data.error_message ?? data.message ?? `Twilio error (${res.status})`);
  }
  if (!data.sid) throw new Error("Twilio response missing SID");
  return { providerRef: data.sid };
}

/** Previews must never include clinical detail. */
export async function sendAppointmentReminder(input: {
  clinicId: string;
  customerId: string;
  appointmentId: string;
  toPhone: string;
  customerFirstName: string;
  startsAt: Date;
  serviceName: string;
  whatsappOptIn: boolean;
}): Promise<{ mocked: boolean; status: string; error?: string }> {
  if (!input.whatsappOptIn) {
    return { mocked: true, status: "skipped_no_opt_in" };
  }

  const when = input.startsAt.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const preview = `Reminder: appointment on ${when}`;
  const body = `Hi ${input.customerFirstName}, this is a reminder of your ${input.serviceName} appointment at Samra Skin & Aesthetics on ${when}. Reply STOP to opt out of reminders.`;

  const config = await loadWhatsAppConfig(input.clinicId);
  const mode = resolveWhatsAppMode(config);

  if (mode === "mocked") {
    await db.insert(messageOutbox).values({
      clinicId: input.clinicId,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      channel: "whatsapp",
      toAddress: input.toPhone,
      preview,
      body,
      status: "mocked",
      mocked: true,
    });
    return { mocked: true, status: "mocked" };
  }

  try {
    const sent =
      mode === "meta"
        ? await sendViaMeta(config, input.toPhone, body, [
            input.customerFirstName,
            input.serviceName,
            when,
          ])
        : await sendViaTwilio(config, input.toPhone, body);

    await db.insert(messageOutbox).values({
      clinicId: input.clinicId,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      channel: "whatsapp",
      toAddress: input.toPhone,
      preview,
      body,
      status: "sent",
      mocked: false,
      providerRef: sent.providerRef,
    });
    return { mocked: false, status: "sent" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "WhatsApp send failed";
    await db.insert(messageOutbox).values({
      clinicId: input.clinicId,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      channel: "whatsapp",
      toAddress: input.toPhone,
      preview,
      body,
      status: "failed",
      mocked: false,
      providerRef: message.slice(0, 240),
    });
    return { mocked: false, status: "failed", error: message };
  }
}

export function publicWhatsAppStatus(config: WhatsAppRuntimeConfig) {
  const mode = resolveWhatsAppMode(config);
  return {
    enabled: config.enabled,
    provider: config.provider,
    mode,
    ready: mode !== "mocked" && config.enabled,
    hasAccessToken: Boolean(config.accessToken),
    hasTwilioAuthToken: Boolean(config.twilioAuthToken),
    phoneNumberId: config.phoneNumberId,
    templateName: config.templateName,
    templateLanguage: config.templateLanguage,
    twilioAccountSid: config.twilioAccountSid,
    twilioWhatsappFrom: config.twilioWhatsappFrom,
  };
}
