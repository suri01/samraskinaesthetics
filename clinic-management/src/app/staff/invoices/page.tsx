import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { CreateInvoiceForm } from "@/components/CreateInvoiceForm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { customers, invoices } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";
import { countInvoicesBySource } from "@/lib/invoices";
import { formatGbp } from "@/lib/money";

type Filter = "all" | "custom" | "auto";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; create?: string }>;
}) {
  const ctx = await requireStaffPage("invoices");
  const params = await searchParams;
  const filter: Filter =
    params.filter === "custom" || params.filter === "auto" ? params.filter : "all";
  const showCreate = params.create === "1";

  const where =
    filter === "all"
      ? eq(invoices.clinicId, ctx.clinicId)
      : and(eq(invoices.clinicId, ctx.clinicId), eq(invoices.source, filter));

  const rows = await db
    .select({ invoice: invoices, customer: customers })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(where)
    .orderBy(desc(invoices.createdAt));

  const counts = await countInvoicesBySource(ctx.clinicId);
  const customerOptions = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
    })
    .from(customers)
    .where(eq(customers.clinicId, ctx.clinicId))
    .orderBy(asc(customers.lastName), asc(customers.firstName));

  return (
    <StaffShell>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-lede">
            Custom invoices you create, plus auto-generated invoices from appointments.
          </p>
        </div>
        <Link
          className="btn btn--primary"
          href={showCreate ? "/staff/invoices" : "/staff/invoices?create=1"}
        >
          {showCreate ? "Close form" : "Create custom invoice"}
        </Link>
      </div>

      <div className="stack">
        {showCreate ? (
          <div className="panel">
            <CreateInvoiceForm customers={customerOptions} />
          </div>
        ) : null}

        <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
          <Link
            className={`btn ${filter === "all" ? "btn--primary" : "btn--ghost"}`}
            href="/staff/invoices"
          >
            All ({counts.all})
          </Link>
          <Link
            className={`btn ${filter === "custom" ? "btn--primary" : "btn--ghost"}`}
            href="/staff/invoices?filter=custom"
          >
            Custom ({counts.custom})
          </Link>
          <Link
            className={`btn ${filter === "auto" ? "btn--primary" : "btn--ghost"}`}
            href="/staff/invoices?filter=auto"
          >
            Auto-generated ({counts.auto})
          </Link>
        </div>

        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ invoice: i, customer: c }) => (
                <tr key={i.id}>
                  <td>{i.number}</td>
                  <td>
                    <span className={`badge${i.source === "auto" ? " badge--gold" : ""}`}>
                      {i.source === "auto" ? "Auto" : "Custom"}
                    </span>
                  </td>
                  <td>
                    {c.firstName} {c.lastName}
                  </td>
                  <td>{formatGbp(i.totalPence)}</td>
                  <td>
                    <span className="badge">{i.status}</span>
                  </td>
                  <td className="muted">
                    {i.createdAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}
                  </td>
                  <td>
                    <Link href={`/staff/invoices/${i.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    {filter === "auto"
                      ? "No auto-generated invoices yet. Open an appointment and generate one, or complete a visit with a priced treatment."
                      : filter === "custom"
                        ? "No custom invoices yet. Use Create custom invoice."
                        : "No invoices yet."}
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
