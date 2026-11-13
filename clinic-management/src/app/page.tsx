import Link from "next/link";
import { GateShell } from "@/components/GateShell";

export default function HomePage() {
  return (
    <GateShell eyebrow="Clinic management" logoHref={null}>
      <h1>Welcome</h1>
      <p className="gate__lede">
        Appointments, customers, iPad intake, treatments, and invoices — in one calm workspace.
      </p>
      <div className="gate__actions">
        <Link className="btn btn--primary" href="/staff/login">
          Staff sign in
        </Link>
        <Link className="btn btn--ghost" href="/ipad">
          Customer iPad
        </Link>
      </div>
    </GateShell>
  );
}
