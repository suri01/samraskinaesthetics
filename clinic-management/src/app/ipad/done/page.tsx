import Link from "next/link";
import { GateShell } from "@/components/GateShell";

export default function IpadDonePage() {
  return (
    <GateShell eyebrow="Visit complete" logoHref={null}>
      <h1>Thank you</h1>
      <p className="gate__lede">
        Your consultation answers, consent, and aftercare acknowledgement are saved. Please return
        the iPad to reception — this session has ended.
      </p>
      <div className="gate__actions">
        <Link className="btn btn--ghost" href="/ipad">
          Start next customer
        </Link>
      </div>
    </GateShell>
  );
}
