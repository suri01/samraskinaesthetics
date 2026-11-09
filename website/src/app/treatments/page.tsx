import type { Metadata } from "next";
import Link from "next/link";
import { site, treatments } from "@/lib/site";

export const metadata: Metadata = {
  title: "Treatments",
  description:
    "Placeholder treatment categories for Samra Skin & Aesthetics — consultations, facials, injectables, skin boosters, and medical-grade skincare.",
};

export default function TreatmentsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="section__eyebrow">Treatments</p>
          <h1>A considered menu, not a hard sell</h1>
          <p>
            These categories are MVP placeholders. Swap in Samra’s real
            treatment names, blurbs, and optional starting prices when ready.
            Deep per-treatment pages come later.
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell">
          <div className="treatment-list">
            {treatments.map((item, index) => (
              <article key={item.slug} className="treatment-item">
                <h2>
                  <span style={{ color: "var(--sage)", marginRight: "0.55rem" }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.name}
                </h2>
                <p>{item.blurb}</p>
                <Link href={site.bookingUrl}>Book</Link>
              </article>
            ))}
          </div>

          <div className="hero__actions" style={{ marginTop: "2.5rem" }}>
            <Link href={site.bookingUrl} className="btn btn--primary">
              Book a consultation
            </Link>
            <Link href="/about" className="btn btn--ghost">
              About the clinic
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
