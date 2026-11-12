import { desc, eq } from "drizzle-orm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";

export default async function AuditPage() {
  const ctx = await requireStaffPage();
  if (ctx.role !== "owner") {
    return (
      <StaffShell>
        <h1 className="page-title">Audit log</h1>
        <p className="error">Owner role required.</p>
      </StaffShell>
    );
  }

  const rows = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.clinicId, ctx.clinicId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return (
    <StaffShell>
      <h1 className="page-title">Audit log</h1>
      <p className="page-lede">Auth, payments, and sensitive actions (stub viewer).</p>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.createdAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</td>
                <td>
                  {r.actorType}
                  {r.actorId ? ` · ${r.actorId.slice(0, 8)}` : ""}
                </td>
                <td>{r.action}</td>
                <td className="muted">
                  {r.entityType ?? "—"} {r.entityId ? r.entityId.slice(0, 8) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
