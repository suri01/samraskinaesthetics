import Link from "next/link";
import { GateShell } from "@/components/GateShell";

/**
 * Public welcome — real HTML composition matching welcome-screen-target:
 * floating gold lockup, serif headline, lede, and pill CTAs (no full-bleed image hotspots).
 */
export default function HomePage() {
  return (
    <GateShell variant="open" logoHref={null}>
      <h1>
        Thoughtful skin
        <br />
        care, quietly refined.
      </h1>
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
