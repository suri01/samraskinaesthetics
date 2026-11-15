import { desc, eq } from "drizzle-orm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";

export default async function TasksPage() {
  const ctx = await requireStaffPage("tasks");
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.clinicId, ctx.clinicId))
    .orderBy(desc(tasks.createdAt));

  return (
    <StaffShell>
      <h1 className="page-title">Follow-ups & tasks</h1>
      <p className="page-lede">Light task list for reception and practitioners.</p>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>
                  {t.dueAt
                    ? t.dueAt.toLocaleString("en-GB", { timeZone: "Europe/London" })
                    : "—"}
                </td>
                <td>
                  <span className="badge">{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
