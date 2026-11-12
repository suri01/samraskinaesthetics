import { db } from "@/db";
import { messageOutbox } from "@/db/schema";

export function whatsappMode(): "meta" | "twilio" | "mocked" {
  if (process.env.WHATSAPP_PROVIDER === "meta" && process.env.WHATSAPP_ACCESS_TOKEN) return "meta";
  if (process.env.WHATSAPP_PROVIDER === "twilio" && process.env.TWILIO_ACCOUNT_SID) return "twilio";
  return "mocked";
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
}): Promise<{ mocked: boolean; status: string }> {
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

  const mode = whatsappMode();
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

  // Real provider hooks (credentials present)
  let providerRef: string | undefined;
  if (mode === "meta") {
    // Placeholder: POST to Graph API when phone number id + token configured.
    providerRef = `meta_pending_${Date.now()}`;
  } else if (mode === "twilio") {
    providerRef = `twilio_pending_${Date.now()}`;
  }

  await db.insert(messageOutbox).values({
    clinicId: input.clinicId,
    customerId: input.customerId,
    appointmentId: input.appointmentId,
    channel: "whatsapp",
    toAddress: input.toPhone,
    preview,
    body,
    status: "queued",
    mocked: false,
    providerRef,
  });

  return { mocked: false, status: "queued" };
}
