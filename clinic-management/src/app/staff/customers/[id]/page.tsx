import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { StaffConsultationForm } from "@/components/StaffConsultationForm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import {
  appointments,
  consentRecords,
  customers,
  formSubmissions,
  invoices,
  photos,
  treatmentRecords,
} from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";
import { formatGbp } from "@/lib/money";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireStaffPage("customers");
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.clinicId, ctx.clinicId)))
    .limit(1);
  if (!customer) notFound();

  const appts = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.customerId, id), eq(appointments.clinicId, ctx.clinicId)))
    .orderBy(desc(appointments.startsAt));
  const treatments = await db
    .select()
    .from(treatmentRecords)
    .where(and(eq(treatmentRecords.customerId, id), eq(treatmentRecords.clinicId, ctx.clinicId)))
    .orderBy(desc(treatmentRecords.createdAt));
  const photoRows = await db
    .select()
    .from(photos)
    .where(and(eq(photos.customerId, id), eq(photos.clinicId, ctx.clinicId)))
    .orderBy(desc(photos.createdAt));
  const inv = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.customerId, id), eq(invoices.clinicId, ctx.clinicId)));
  const consents = await db
    .select()
    .from(consentRecords)
    .where(and(eq(consentRecords.customerId, id), eq(consentRecords.clinicId, ctx.clinicId)));
  const forms = await db
    .select()
    .from(formSubmissions)
    .where(and(eq(formSubmissions.customerId, id), eq(formSubmissions.clinicId, ctx.clinicId)));

  return (
    <StaffShell>
      <p className="muted">
        <Link href="/staff/customers">← Customers</Link>
      </p>
      <h1 className="page-title">
        {customer.firstName} {customer.lastName}
      </h1>
      <p className="page-lede">
        {customer.email} · {customer.phone} · DOB {customer.dateOfBirth ?? "—"} ·{" "}
        {customer.intakeCompletedAt ? (
          <span className="badge">Intake complete</span>
        ) : (
          <span className="badge badge--gold">New · full iPad intake pending</span>
        )}
      </p>
      <div className="stack">
        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Clinical summary</h2>
          <p style={{ margin: 0 }}>
            <strong>Allergies:</strong> {customer.allergies ?? "—"}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Notes / goals:</strong> {customer.medicalNotes ?? "—"}
          </p>
          {customer.medicalHistoryJson ? (
            <p className="muted" style={{ margin: 0 }}>
              History on file: Meds {customer.medicalHistoryJson.medications || "—"} · Conditions{" "}
              {customer.medicalHistoryJson.conditions || "—"} · Emergency{" "}
              {customer.medicalHistoryJson.emergencyName || "—"}
            </p>
          ) : null}
          {customer.upsellInterestJson && customer.upsellInterestJson.length > 0 ? (
            <p style={{ margin: 0 }}>
              <strong>iPad upsell interest:</strong>{" "}
              {customer.upsellInterestJson.map((u) => u.title).join("; ")}
            </p>
          ) : null}
          <p className="muted" style={{ margin: 0 }}>
            Registered via {customer.registeredVia} · Comms: WhatsApp{" "}
            {customer.whatsappOptIn ? "yes" : "no"} · Email {customer.emailOptIn ? "yes" : "no"} · Marketing{" "}
            {customer.marketingOptIn ? "yes" : "no"} (no marketing without opt-in)
          </p>
        </div>

        <div className="panel stack" id="patient-consultation">
          <StaffConsultationForm
            customerId={customer.id}
            initial={customer.medicalHistoryJson ?? null}
          />
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Appointments</h2>
          <table className="table">
            <tbody>
              {appts.map((a) => (
                <tr key={a.id}>
                  <td>{a.startsAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</td>
                  <td>{a.serviceName}</td>
                  <td>
                    <span className="badge">{a.status}</span>
                  </td>
                  <td>
                    <Link href={`/staff/appointments/${a.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Treatments</h2>
          {treatments.map((t) => (
            <div key={t.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--line)" }}>
              <strong>{t.title}</strong>
              <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                {t.notes}
              </p>
            </div>
          ))}
          {treatments.length === 0 ? <p className="muted">No treatments yet.</p> : null}
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Photos</h2>
          <ul>
            {photoRows.map((p) => (
              <li key={p.id}>
                {p.stage}: {p.caption ?? p.storageKey}{" "}
                <span className="badge">{p.contentType}</span>
              </li>
            ))}
          </ul>
          {photoRows.length === 0 ? <p className="muted">No photos.</p> : null}
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Forms & consent</h2>
          <p>
            Forms: {forms.length} · Consents: {consents.length}
          </p>
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Invoices</h2>
          <table className="table">
            <tbody>
              {inv.map((i) => (
                <tr key={i.id}>
                  <td>{i.number}</td>
                  <td>
                    <span className={`badge${i.source === "auto" ? " badge--gold" : ""}`}>
                      {i.source === "auto" ? "Auto" : "Custom"}
                    </span>
                  </td>
                  <td>{formatGbp(i.totalPence)}</td>
                  <td>
                    <span className="badge">{i.status}</span>
                  </td>
                  <td>
                    <Link href={`/staff/invoices/${i.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </StaffShell>
  );
}
