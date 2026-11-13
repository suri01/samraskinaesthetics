import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { IpadCustomerFlow } from "@/components/IpadCustomerFlow";
import { db } from "@/db";
import { clinicSettings } from "@/db/schema";
import { getIpadContext } from "@/lib/auth/ipad";
import { upsellsForService } from "@/lib/upsells";

export default async function IpadFormsPage() {
  const ctx = await getIpadContext();
  if (!ctx) redirect("/ipad");

  const [settings] = await db
    .select()
    .from(clinicSettings)
    .where(eq(clinicSettings.clinicId, ctx.clinicId))
    .limit(1);

  const mh = ctx.medicalHistory ?? {};
  const address = ctx.addressJson ?? {};

  return (
    <main className="ipad-shell">
      <div className="ipad-card stack" style={{ width: "min(680px, 100%)" }}>
        <p className="badge badge--gold">Customer check-in</p>
        <h1>{ctx.isNewCustomer ? `Welcome, ${ctx.firstName || "there"}` : `Welcome back, ${ctx.firstName}`}</h1>
        <p className="muted">
          Booked for <strong>{ctx.serviceName}</strong> ·{" "}
          {ctx.startsAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}.
          {ctx.isNewCustomer
            ? " You’re a new customer — we’ll capture your full details, medical history, consent, and optional add-ons."
            : " Quick confirm of your details, today’s consent, and optional add-ons."}{" "}
          This session only covers your record for this visit.
        </p>
        <IpadCustomerFlow
          isNewCustomer={ctx.isNewCustomer}
          serviceName={ctx.serviceName}
          consentTitle="Treatment consent"
          consentBody={settings?.consentTemplate ?? ""}
          upsells={upsellsForService(ctx.serviceName)}
          initialDetails={{
            firstName: ctx.firstName,
            lastName: ctx.lastName,
            email: ctx.email ?? "",
            phone: ctx.phone ?? "",
            dateOfBirth: ctx.dateOfBirth ?? "",
            line1: address.line1 ?? "",
            city: address.city ?? "",
            postcode: address.postcode ?? "",
            whatsappOptIn: ctx.whatsappOptIn,
            emailOptIn: ctx.emailOptIn,
          }}
          initialMedical={{
            gpName: mh.gpName ?? "",
            medications: mh.medications ?? "",
            allergies: mh.allergies ?? ctx.allergies ?? "",
            conditions: mh.conditions ?? "",
            previousTreatments: mh.previousTreatments ?? "",
            pregnantBreastfeeding: mh.pregnantBreastfeeding ?? "",
            smoking: mh.smoking ?? "",
            skinGoals: mh.skinGoals ?? ctx.medicalNotes ?? "",
            emergencyName: mh.emergencyName ?? "",
            emergencyPhone: mh.emergencyPhone ?? "",
          }}
        />
      </div>
    </main>
  );
}
