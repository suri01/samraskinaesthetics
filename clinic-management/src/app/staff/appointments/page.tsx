import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { RegisterBookingForm } from "@/components/RegisterBookingForm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { appointments, customers } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";
import { bookingServiceOptions, listClinicTreatments } from "@/lib/treatments";

export default async function AppointmentsPage() {
  const ctx = await requireStaffPage("appointments");
  const rows = await db
    .select({
      appointment: appointments,
      customer: customers,
    })
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(eq(appointments.clinicId, ctx.clinicId))
    .orderBy(desc(appointments.startsAt));
  const treatments = await listClinicTreatments(ctx.clinicId);
  const serviceOptions = bookingServiceOptions(treatments);

  return (
    <StaffShell>
      <h1 className="page-title">Appointments</h1>
      <p className="page-lede">
        Bookings register the customer. New customers get a full iPad intake on arrival; unlock codes
        still open a short-lived visit session.
      </p>
      <div className="stack">
        <div className="panel">
          <RegisterBookingForm serviceOptions={serviceOptions} />
        </div>
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ appointment: a, customer: c }) => (
                <tr key={a.id}>
                  <td>{a.startsAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</td>
                  <td>
                    {c.firstName} {c.lastName}{" "}
                    {!c.intakeCompletedAt ? <span className="badge badge--gold">new intake</span> : null}
                  </td>
                  <td>{a.serviceName}</td>
                  <td>
                    <span className="badge">{a.status.replaceAll("_", " ")}</span>
                  </td>
                  <td>
                    <Link href={`/staff/appointments/${a.id}`}>Open</Link>
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
