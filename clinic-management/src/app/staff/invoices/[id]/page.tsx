import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CollectPaymentButton } from "@/components/CollectPaymentButton";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { customers, invoices, payments } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";
import { formatGbp } from "@/lib/money";
import { stripeMode } from "@/lib/stripe";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireStaffPage("invoices");
  const rows = await db
    .select({ invoice: invoices, customer: customers })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(and(eq(invoices.id, id), eq(invoices.clinicId, ctx.clinicId)))
    .limit(1);
  const row = rows[0];
  if (!row) notFound();
  const pays = await db.select().from(payments).where(eq(payments.invoiceId, id));

  return (
    <StaffShell>
      <p className="muted">
        <Link href="/staff/invoices">← Invoices</Link>
      </p>
      <h1 className="page-title">{row.invoice.number}</h1>
      <p className="page-lede">
        {row.customer.firstName} {row.customer.lastName} · {formatGbp(row.invoice.totalPence)} ·{" "}
        <span className="badge">{row.invoice.status}</span> · Stripe mode{" "}
        <span className="badge badge--mock">{stripeMode()}</span>
      </p>
      <div className="stack">
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {row.invoice.lineItemsJson.map((li, idx) => (
                <tr key={idx}>
                  <td>{li.description}</td>
                  <td>{li.quantity}</td>
                  <td>{formatGbp(li.unitPence * li.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {row.invoice.status === "open" ? (
          <div className="panel stack">
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Payment</h2>
            <p className="muted" style={{ margin: 0 }}>
              Never stores PAN/CVC. Mock path records a succeeded payment locally.
            </p>
            <CollectPaymentButton invoiceId={row.invoice.id} />
          </div>
        ) : null}
        <div className="panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Payments</h2>
          <table className="table">
            <tbody>
              {pays.map((p) => (
                <tr key={p.id}>
                  <td>{formatGbp(p.amountPence)}</td>
                  <td>
                    <span className="badge">{p.status}</span>
                  </td>
                  <td>
                    {p.provider} {p.mocked ? <span className="badge badge--mock">mocked</span> : null}
                  </td>
                  <td className="muted">{p.providerRef}</td>
                </tr>
              ))}
              {pays.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No payments yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </StaffShell>
  );
}
