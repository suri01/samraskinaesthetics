import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clinicSettings } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import { isAdmin } from "@/lib/constants";
import { encryptSecret } from "@/lib/crypto";
import {
  loadWhatsAppConfig,
  publicWhatsAppStatus,
  type WhatsAppProvider,
} from "@/lib/whatsapp";

export async function GET() {
  try {
    const staff = await requireStaff();
    if (!isAdmin(staff.role) && staff.role !== "receptionist") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const config = await loadWhatsAppConfig(staff.clinicId);
    return NextResponse.json({
      settings: publicWhatsAppStatus(config),
      canEdit: isAdmin(staff.role),
    });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const staff = await requireStaff();
    if (!isAdmin(staff.role)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const providerRaw = String(body.provider ?? "mocked");
    const provider: WhatsAppProvider =
      providerRaw === "meta" || providerRaw === "twilio" || providerRaw === "mocked"
        ? providerRaw
        : "mocked";

    const [existing] = await db
      .select()
      .from(clinicSettings)
      .where(eq(clinicSettings.clinicId, staff.clinicId))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Clinic settings missing" }, { status: 404 });
    }

    const patch: Partial<typeof clinicSettings.$inferInsert> = {
      whatsappEnabled: Boolean(body.enabled),
      whatsappProvider: provider,
      whatsappPhoneNumberId: body.phoneNumberId
        ? String(body.phoneNumberId).trim()
        : null,
      whatsappTemplateName: body.templateName ? String(body.templateName).trim() : null,
      whatsappTemplateLanguage: body.templateLanguage
        ? String(body.templateLanguage).trim()
        : "en_GB",
      twilioAccountSid: body.twilioAccountSid ? String(body.twilioAccountSid).trim() : null,
      twilioWhatsappFrom: body.twilioWhatsappFrom
        ? String(body.twilioWhatsappFrom).trim()
        : null,
      updatedAt: new Date(),
    };

    const accessToken = String(body.accessToken ?? "").trim();
    if (accessToken) {
      patch.whatsappAccessTokenEnc = encryptSecret(accessToken);
    } else if (body.clearAccessToken) {
      patch.whatsappAccessTokenEnc = null;
    }

    const twilioAuthToken = String(body.twilioAuthToken ?? "").trim();
    if (twilioAuthToken) {
      patch.twilioAuthTokenEnc = encryptSecret(twilioAuthToken);
    } else if (body.clearTwilioAuthToken) {
      patch.twilioAuthTokenEnc = null;
    }

    await db
      .update(clinicSettings)
      .set(patch)
      .where(eq(clinicSettings.clinicId, staff.clinicId));

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "clinic_settings.whatsapp_updated",
      entityType: "clinic_settings",
      entityId: existing.id,
      meta: {
        provider,
        enabled: Boolean(body.enabled),
        tokenUpdated: Boolean(accessToken) || Boolean(body.clearAccessToken),
        twilioTokenUpdated: Boolean(twilioAuthToken) || Boolean(body.clearTwilioAuthToken),
      },
    });

    const config = await loadWhatsAppConfig(staff.clinicId);
    return NextResponse.json({ ok: true, settings: publicWhatsAppStatus(config) });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
