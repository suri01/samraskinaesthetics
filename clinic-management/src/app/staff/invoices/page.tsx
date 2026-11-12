import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { customers, invoices } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";
import { formatGbp } from "@/lib/money";

export default async function InvoicesPage() {
  const ctx = await requireStaffPage("invoices");
  const rows = await db
    .select({ invoice: invoices, customer: customers })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(eq(invoices.clinicId, ctx.clinicId))
    .orderBy(desc(invoices.createdAt));

  return (
    <StaffShell>
      <h1 className="page-title">Invoices</h1>
      <p className="page-lede">GBP amounts · Stripe mocked unless test keys are set.</p>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ invoice: i, customer: c }) => (
              <tr key={i.id}>
                <td>{i.number}</td>
                <td>
                  {c.firstName} {c.lastName}
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
    </StaffShell>
  );
}
