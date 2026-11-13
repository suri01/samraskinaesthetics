import Link from "next/link";

export default function IpadDonePage() {
  return (
    <main className="ipad-shell">
      <div className="ipad-card stack">
        <p className="badge">Done</p>
        <h1>Thank you</h1>
        <p className="muted">
          Your details are saved on your customer record. Please return the iPad to reception. This
          session has ended.
        </p>
        <Link className="btn btn--ghost" href="/ipad">
          Start next customer
        </Link>
      </div>
    </main>
  );
}
