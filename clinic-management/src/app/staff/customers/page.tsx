import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";

export default async function CustomersPage() {
  const ctx = await requireStaffPage("customers");
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.clinicId, ctx.clinicId))
    .orderBy(desc(customers.updatedAt));

  return (
    <StaffShell>
      <h1 className="page-title">Customers</h1>
      <p className="page-lede">Fictional sample records only.</p>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>WhatsApp</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.firstName} {c.lastName}
                </td>
                <td>
                  <div>{c.email}</div>
                  <div className="muted">{c.phone}</div>
                </td>
                <td>{c.whatsappOptIn ? <span className="badge">opted in</span> : <span className="muted">no</span>}</td>
                <td>
                  <Link href={`/staff/customers/${c.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
