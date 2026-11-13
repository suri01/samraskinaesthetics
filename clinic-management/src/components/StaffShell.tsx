import { redirect } from "next/navigation";
import { IdleLockGate } from "@/components/IdleLockGate";
import { StaffNav } from "@/components/StaffNav";
import { getStaffContext } from "@/lib/auth/staff";

export async function StaffShell({ children }: { children: React.ReactNode }) {
  const ctx = await getStaffContext();
  if (!ctx) redirect("/staff/login");
  if (ctx.idleLocked) return <IdleLockGate name={ctx.name} />;

  return (
    <div className="staff-shell">
      <StaffNav staffName={ctx.name} role={ctx.role} />
      <div className="staff-main">{children}</div>
    </div>
  );
}
