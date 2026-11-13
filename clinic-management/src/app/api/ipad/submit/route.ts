import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { consentRecords, customers, formSubmissions, formTemplates } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { completeIpadSession, requireIpad } from "@/lib/auth/ipad";
import { AuthError } from "@/lib/auth/staff";
import { upsellsForService } from "@/lib/upsells";

export async function POST(req: Request) {
  try {
    const ctx = await requireIpad();
    const body = await req.json();
    const details = body.details ?? {};
    const medical = body.medical ?? {};
    const consultation = body.consultation ?? null;
    const signedName = String(body.signedName ?? "").trim();
    if (!signedName) {
      return NextResponse.json({ error: "Signature required" }, { status: 400 });
    }

    const firstName = String(details.firstName ?? ctx.firstName).trim();
    const lastName = String(details.lastName ?? ctx.lastName).trim();
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const upsellSkus: string[] = Array.isArray(body.upsellSkus)
      ? body.upsellSkus.map(String)
      : [];
    const catalogue = upsellsForService(ctx.serviceName);
    const chosen = catalogue.filter((o) => upsellSkus.includes(o.sku));
    const notedAt = new Date().toISOString();

    await db
      .update(customers)
      .set({
        firstName,
        lastName,
        email: details.email ? String(details.email).trim() : null,
        phone: details.phone ? String(details.phone).trim() : null,
        dateOfBirth: details.dateOfBirth ? String(details.dateOfBirth) : null,
        addressJson: {
          line1: String(details.line1 ?? ""),
          city: String(details.city ?? ""),
          postcode: String(details.postcode ?? ""),
          country: "United Kingdom",
        },
        allergies: medical.allergies ? String(medical.allergies) : null,
        medicalNotes: medical.skinGoals ? String(medical.skinGoals) : null,
        medicalHistoryJson: {
          medications: String(medical.medications ?? ""),
          allergies: String(medical.allergies ?? ""),
          conditions: String(medical.conditions ?? ""),
          previousTreatments: String(medical.previousTreatments ?? ""),
          pregnantBreastfeeding: String(medical.pregnantBreastfeeding ?? ""),
          smoking: String(medical.smoking ?? ""),
          skinGoals: String(medical.skinGoals ?? ""),
          emergencyName: String(medical.emergencyName ?? ""),
          emergencyPhone: String(medical.emergencyPhone ?? ""),
          receivingTreatment: medical.receivingTreatment ?? null,
          precautions: medical.precautions ?? null,
          consultation,
          aftercareAcknowledged: Boolean(body.aftercareAcknowledged),
        },
        whatsappOptIn: Boolean(details.whatsappOptIn),
        emailOptIn: Boolean(details.emailOptIn),
        intakeCompletedAt: new Date(),
        upsellInterestJson: chosen.map((o) => ({
          sku: o.sku,
          title: o.title,
          bookedService: ctx.serviceName,
          notedAt,
        })),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, ctx.customerId));

    const templates = await db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.clinicId, ctx.clinicId))
      .limit(1);
    const templateId = templates[0]?.id;
    if (templateId) {
      await db.insert(formSubmissions).values({
        clinicId: ctx.clinicId,
        templateId,
        appointmentId: ctx.appointmentId,
        customerId: ctx.customerId,
        answersJson: {
          flow: ctx.isNewCustomer ? "consultation_new" : "consultation_returning",
          template: "consultation_consent_aftercare_v1",
          details,
          medical,
          consultation,
          aftercareAcknowledged: Boolean(body.aftercareAcknowledged),
          upsellSkus,
        },
        signedName,
        signedAt: new Date(),
      });
    }

    await db.insert(consentRecords).values({
      clinicId: ctx.clinicId,
      customerId: ctx.customerId,
      appointmentId: ctx.appointmentId,
      title: String(body.consentTitle ?? "Consent"),
      body: String(body.consentBody ?? ""),
      signedName,
      signedAt: new Date(),
    });

    await writeAudit({
      clinicId: ctx.clinicId,
      actorType: "ipad",
      actorId: ctx.sessionId,
      action: ctx.isNewCustomer
        ? "ipad.consultation_intake_completed"
        : "ipad.consultation_returning_completed",
      entityType: "customer",
      entityId: ctx.customerId,
      meta: {
        appointmentId: ctx.appointmentId,
        upsellCount: chosen.length,
        upsellSkus: chosen.map((o) => o.sku),
        aftercareAcknowledged: Boolean(body.aftercareAcknowledged),
      },
    });

    await completeIpadSession();
    return NextResponse.json({ ok: true, upsellNoted: chosen.length });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
