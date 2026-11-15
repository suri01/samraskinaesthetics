import { desc, eq } from "drizzle-orm";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { messageOutbox } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";

export default async function MessagesPage() {
  const ctx = await requireStaffPage("messages");
  const rows = await db
    .select()
    .from(messageOutbox)
    .where(eq(messageOutbox.clinicId, ctx.clinicId))
    .orderBy(desc(messageOutbox.createdAt))
    .limit(50);

  return (
    <StaffShell>
      <h1 className="page-title">Messages</h1>
      <p className="page-lede">Appointment reminders and customer messages.</p>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>To</th>
              <th>Preview</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.createdAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</td>
                <td>{m.toAddress}</td>
                <td>{m.preview}</td>
                <td>
                  <span className="badge">{m.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
