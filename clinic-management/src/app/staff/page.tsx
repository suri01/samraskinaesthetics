import Link from "next/link";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { appointments, customers, invoices, tasks } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";
import { formatGbp } from "@/lib/money";

export default async function StaffDashboardPage() {
  const ctx = await requireStaffPage("dashboard");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [apptToday] = await db
    .select({ c: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicId, ctx.clinicId),
        gte(appointments.startsAt, start),
        lt(appointments.startsAt, end),
      ),
    );
  const [custCount] = await db
    .select({ c: count() })
    .from(customers)
    .where(eq(customers.clinicId, ctx.clinicId));
  const [openTasks] = await db
    .select({ c: count() })
    .from(tasks)
    .where(and(eq(tasks.clinicId, ctx.clinicId), eq(tasks.status, "open")));
  const openInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.clinicId, ctx.clinicId), eq(invoices.status, "open")));
  const openTotal = openInvoices.reduce((s, i) => s + i.totalPence, 0);

  const todayAppts = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.clinicId, ctx.clinicId),
        gte(appointments.startsAt, start),
        lt(appointments.startsAt, end),
      ),
    )
    .orderBy(appointments.startsAt);

  return (
    <StaffShell>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-lede">Today at Samra Skin &amp; Aesthetics.</p>
      <div className="grid-cards">
        <div className="panel stat">
          <strong>{apptToday?.c ?? 0}</strong>
          <span>Appointments today</span>
        </div>
        <div className="panel stat">
          <strong>{custCount?.c ?? 0}</strong>
          <span>Customers</span>
        </div>
        <div className="panel stat">
          <strong>{openTasks?.c ?? 0}</strong>
          <span>Open tasks</span>
        </div>
        <div className="panel stat">
          <strong>{formatGbp(openTotal)}</strong>
          <span>Open invoices</span>
        </div>
      </div>
      <div className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Today</h2>
          <Link className="btn btn--ghost" href="/staff/appointments">
            All appointments
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Service</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {todayAppts.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.startsAt.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/London",
                  })}
                </td>
                <td>{a.serviceName}</td>
                <td>
                  <span className="badge">{a.status.replace("_", " ")}</span>
                </td>
                <td>
                  <Link href={`/staff/appointments/${a.id}`}>Open</Link>
                </td>
              </tr>
            ))}
            {todayAppts.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No appointments today.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
