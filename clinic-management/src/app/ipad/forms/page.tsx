import { redirect } from "next/navigation";
import { IpadCustomerFlow } from "@/components/IpadCustomerFlow";
import { getIpadContext } from "@/lib/auth/ipad";

export default async function IpadFormsPage() {
  const ctx = await getIpadContext();
  if (!ctx) redirect("/ipad");

  const mh = ctx.medicalHistory ?? {};
  const address = ctx.addressJson ?? {};

  return (
    <main className="ipad-shell">
      <div className="ipad-card stack" style={{ width: "min(720px, 100%)", overflow: "hidden", padding: 0 }}>
        <div className="ipad-card__brand-rail" aria-hidden>
          <span>Samra</span>
          <span>Check-in</span>
        </div>
        <div className="stack" style={{ padding: "1.5rem 1.75rem 1.75rem" }}>
        <p className="badge badge--gold">Consultation check-in</p>
        <h1>{ctx.isNewCustomer ? `Welcome, ${ctx.firstName || "there"}` : `Welcome back, ${ctx.firstName}`}</h1>
        <p className="muted">
          Booked for <strong>{ctx.serviceName}</strong> ·{" "}
          {ctx.startsAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}.
          {ctx.isNewCustomer
            ? " We’ll walk through your details, skin health, skin type, photos, consent, and aftercare — one short screen at a time. Your clinician completes routine and medical history in clinic."
            : " Confirm your details, then consent and aftercare. Your clinician updates consultation notes in clinic."}{" "}
          Take your time; you can go back if you need to.
        </p>
        <IpadCustomerFlow
          isNewCustomer={ctx.isNewCustomer}
          serviceName={ctx.serviceName}
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
            emergencyName: mh.emergencyName ?? "",
            emergencyPhone: mh.emergencyPhone ?? "",
          }}
        />
        </div>
      </div>
    </main>
  );
}
