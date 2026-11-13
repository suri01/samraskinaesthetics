import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { GenerateInvoiceButton } from "@/components/GenerateInvoiceButton";
import { IssueIpadCodeButton } from "@/components/IssueIpadCodeButton";
import { SendReminderButton } from "@/components/SendReminderButton";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { appointments, customers, invoices } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";
import { formatGbp } from "@/lib/money";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireStaffPage("appointments");
  const rows = await db
    .select({ appointment: appointments, customer: customers })
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(and(eq(appointments.id, id), eq(appointments.clinicId, ctx.clinicId)))
    .limit(1);
  const row = rows[0];
  if (!row) notFound();
  const { appointment: a, customer: c } = row;

  const linkedInvoices = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      source: invoices.source,
      status: invoices.status,
      totalPence: invoices.totalPence,
    })
    .from(invoices)
    .where(and(eq(invoices.appointmentId, a.id), eq(invoices.clinicId, ctx.clinicId)));

  return (
    <StaffShell>
      <p className="muted">
        <Link href="/staff/appointments">← Appointments</Link>
      </p>
      <h1 className="page-title">{a.serviceName}</h1>
      <p className="page-lede">
        {c.firstName} {c.lastName} ·{" "}
        {a.startsAt.toLocaleString("en-GB", { timeZone: "Europe/London" })} ·{" "}
        <span className="badge">{a.status.replaceAll("_", " ")}</span>{" "}
        {!c.intakeCompletedAt ? (
          <span className="badge badge--gold">new customer · full iPad intake</span>
        ) : (
          <span className="badge">returning · quick check-in</span>
        )}
      </p>
      <div className="stack">
        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
            Hand over to customer
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            The clinic iPad must already be device-authenticated with its passkey (keeps backend
            access on trusted hardware only). When you hand the iPad over, generate a passcode here —
            the customer enters it to open <strong>only their profile</strong>
            {!c.intakeCompletedAt
              ? " (new-customer iPad: details, skin health, skin type, photos, consent, aftercare)."
              : " (returning iPad: confirm details, consent, aftercare)."}{" "}
            Skin goals, skincare routine, lifestyle/treatment history, and medical history are
            completed by staff on the customer record.
          </p>
          <IssueIpadCodeButton appointmentId={a.id} />
        </div>
        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>WhatsApp reminder</h2>
          <SendReminderButton appointmentId={a.id} />
        </div>
        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Invoice</h2>
          <p className="muted" style={{ margin: 0 }}>
            Generate an auto invoice from this appointment&apos;s service, or create a custom invoice
            from the Invoices menu.
          </p>
          {linkedInvoices.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {linkedInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link href={`/staff/invoices/${inv.id}`}>
                    {inv.number}
                  </Link>{" "}
                  <span className={`badge${inv.source === "auto" ? " badge--gold" : ""}`}>
                    {inv.source === "auto" ? "Auto" : "Custom"}
                  </span>{" "}
                  <span className="badge">{inv.status}</span> · {formatGbp(inv.totalPence)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              No invoice linked yet.
            </p>
          )}
          <GenerateInvoiceButton appointmentId={a.id} />
          <Link className="btn btn--ghost" href="/staff/invoices?create=1">
            Create custom invoice
          </Link>
        </div>
        <div className="panel">
          <p>
            <Link href={`/staff/customers/${c.id}#patient-consultation`}>
              Open patient consultation on customer record
            </Link>
          </p>
          {a.notes ? <p>{a.notes}</p> : <p className="muted">No staff notes.</p>}
        </div>
      </div>
    </StaffShell>
  );
}
