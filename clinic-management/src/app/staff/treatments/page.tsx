import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { customers, treatmentRecords } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";

export default async function TreatmentsPage() {
  const ctx = await requireStaffPage("treatments");
  const rows = await db
    .select({ treatment: treatmentRecords, customer: customers })
    .from(treatmentRecords)
    .innerJoin(customers, eq(customers.id, treatmentRecords.customerId))
    .where(eq(treatmentRecords.clinicId, ctx.clinicId))
    .orderBy(desc(treatmentRecords.createdAt));

  return (
    <StaffShell>
      <h1 className="page-title">Treatment records</h1>
      <p className="page-lede">Clinical notes for completed / in-progress visits (sample).</p>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Customer</th>
              <th>Title</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ treatment: t, customer: c }) => (
              <tr key={t.id}>
                <td>{t.createdAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</td>
                <td>
                  {c.firstName} {c.lastName}
                </td>
                <td>{t.title}</td>
                <td>
                  <Link href={`/staff/customers/${c.id}`}>Customer</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
