import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { stripeMode } from "@/lib/stripe";
import { whatsappMode } from "@/lib/whatsapp";
import { storageMode } from "@/lib/storage";

export default function HomePage() {
  return (
    <main className="shell" style={{ padding: "4rem 0" }}>
      <p className="badge badge--gold">Internal · sample data only</p>
      <h1 className="page-title" style={{ marginTop: "1rem" }}>
        {BRAND.name}
      </h1>
      <p className="page-lede">
        Clinic management v1 — appointments, customers, iPad intake, treatments, photos, and
        invoices. Not for real patient data until adviser review.
      </p>
      <div className="row" style={{ marginBottom: "2rem" }}>
        <Link className="btn btn--primary" href="/staff/login">
          Staff sign in
        </Link>
        <Link className="btn btn--ghost" href="/ipad">
          Customer iPad
        </Link>
      </div>
      <div className="panel stack">
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Integration flags</h2>
        <p className="muted" style={{ margin: 0 }}>
          Stripe: <span className="badge badge--mock">{stripeMode()}</span>{" "}
          WhatsApp: <span className="badge badge--mock">{whatsappMode()}</span>{" "}
          Storage: <span className="badge badge--mock">{storageMode()}</span>
        </p>
      </div>
    </main>
  );
}
