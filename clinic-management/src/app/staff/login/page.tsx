import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { LoginForm } from "@/components/LoginForm";
import { getStaffContext } from "@/lib/auth/staff";

export default async function StaffLoginPage() {
  const ctx = await getStaffContext();
  if (ctx && !ctx.idleLocked) redirect("/staff");

  return (
    <main className="ipad-shell">
      <div className="ipad-card stack" style={{ textAlign: "center" }}>
        <BrandLogo href="/" size="card" priority />
        <p className="badge badge--gold">Staff</p>
        <h1>Sign in</h1>
        <p className="muted">Samra Skin &amp; Aesthetics clinic management</p>
        <div style={{ textAlign: "left" }}>
          <LoginForm />
        </div>
        <p className="muted" style={{ margin: 0 }}>
          <Link href="/">← Back</Link>
        </p>
      </div>
    </main>
  );
}
