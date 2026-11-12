import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { IssueIpadCodeButton } from "@/components/IssueIpadCodeButton";
import { SendReminderButton } from "@/components/SendReminderButton";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { appointments, customers } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";

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

  return (
    <StaffShell>
      <p className="muted">
        <Link href="/staff/appointments">← Appointments</Link>
      </p>
      <h1 className="page-title">{a.serviceName}</h1>
      <p className="page-lede">
        {c.firstName} {c.lastName} ·{" "}
        {a.startsAt.toLocaleString("en-GB", { timeZone: "Europe/London" })} ·{" "}
        <span className="badge">{a.status.replaceAll("_", " ")}</span>
      </p>
      <div className="stack">
        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Customer iPad</h2>
          <p className="muted" style={{ margin: 0 }}>
            Issues a short-lived code for the kiosk. iPad sessions are appointment-scoped and never share
            the staff cookie.
          </p>
          <IssueIpadCodeButton appointmentId={a.id} />
        </div>
        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>WhatsApp reminder</h2>
          <SendReminderButton appointmentId={a.id} />
        </div>
        <div className="panel">
          <p>
            <Link href={`/staff/customers/${c.id}`}>Open customer record</Link>
          </p>
          {a.notes ? <p>{a.notes}</p> : <p className="muted">No staff notes.</p>}
        </div>
      </div>
    </StaffShell>
  );
}
