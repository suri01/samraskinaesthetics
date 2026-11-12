import Link from "next/link";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { appointments, customers } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";

export default async function CalendarPage() {
  const ctx = await requireStaffPage("appointments");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const rows = await db
    .select({ appointment: appointments, customer: customers })
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(
      and(
        eq(appointments.clinicId, ctx.clinicId),
        gte(appointments.startsAt, start),
        lt(appointments.startsAt, end),
      ),
    )
    .orderBy(asc(appointments.startsAt));

  return (
    <StaffShell>
      <h1 className="page-title">Calendar</h1>
      <p className="page-lede">Light 7-day list view (full calendar UI later).</p>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Customer</th>
              <th>Service</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ appointment: a, customer: c }) => (
              <tr key={a.id}>
                <td>
                  {a.startsAt.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "Europe/London",
                  })}
                </td>
                <td>
                  {a.startsAt.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/London",
                  })}
                </td>
                <td>
                  {c.firstName} {c.lastName}
                </td>
                <td>{a.serviceName}</td>
                <td>
                  <Link href={`/staff/appointments/${a.id}`}>Open</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  Nothing in the next 7 days.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
