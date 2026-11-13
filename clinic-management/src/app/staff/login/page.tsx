import Link from "next/link";
import { redirect } from "next/navigation";
import { GateShell } from "@/components/GateShell";
import { LoginForm } from "@/components/LoginForm";
import { getStaffContext } from "@/lib/auth/staff";

export default async function StaffLoginPage() {
  const ctx = await getStaffContext();
  if (ctx && !ctx.idleLocked) redirect("/staff");

  return (
    <GateShell eyebrow="Staff sign in" logoHref="/">
      <h1>Sign in</h1>
      <p className="gate__lede">Use your clinic email and password.</p>
      <LoginForm />
      <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
        <Link href="/">← Back</Link>
      </p>
    </GateShell>
  );
}
