import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="shell" style={{ padding: "4rem 0" }}>
      <BrandLogo href={null} size="hero" priority />
      <p className="badge badge--gold">Clinic management</p>
      <h1 className="page-title" style={{ marginTop: "1rem" }}>
        {BRAND.name}
      </h1>
      <p className="page-lede">
        Appointments, customers, iPad intake, treatments, photos, and invoices.
      </p>
      <div className="row" style={{ marginBottom: "2rem" }}>
        <Link className="btn btn--primary" href="/staff/login">
          Staff sign in
        </Link>
        <Link className="btn btn--ghost" href="/ipad">
          Customer iPad
        </Link>
      </div>
    </main>
  );
}
