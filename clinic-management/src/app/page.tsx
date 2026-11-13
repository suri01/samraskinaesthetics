import Link from "next/link";
import { GateShell } from "@/components/GateShell";

export default function HomePage() {
  return (
    <GateShell logoHref={null} variant="open">
      <h1>Thoughtful skin care, quietly refined.</h1>
      <p className="gate__lede">
        Experience tranquility and expert care tailored to your skin&apos;s natural beauty.
      </p>
      <div className="gate__actions">
        <Link className="btn btn--primary" href="/staff/login">
          Staff sign in
        </Link>
        <Link className="btn btn--ghost" href="/ipad">
          Clinic check-in
        </Link>
      </div>
    </GateShell>
  );
}
