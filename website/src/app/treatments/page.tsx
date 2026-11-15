import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import {
  TREATMENT_MENU_DISCLAIMER,
  TREATMENT_MENU_TAGLINE,
  formatTreatmentPrice,
  treatmentsByCategory,
} from "@/lib/treatments";

export const metadata: Metadata = {
  title: "Treatments",
  description:
    "Samra Skin & Aesthetics treatment menu — Dermapen 4 microneedling, NeoStrata peels, Profhilo, PolyPhil, and skin consultations.",
};

export default function TreatmentsPage() {
  const groups = treatmentsByCategory();

  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="section__eyebrow">Treatments</p>
          <h1>A considered menu, not a hard sell</h1>
          <p>{TREATMENT_MENU_TAGLINE}</p>
        </div>
      </section>

      {groups.map((group) => (
        <section
          key={group.category}
          className="section section--tight"
          aria-labelledby={`treatment-${group.category}`}
        >
          <div className="shell">
            <h2
              id={`treatment-${group.category}`}
              className="section__title"
            >
              {group.label}
            </h2>
            <p className="section__lede">{group.blurb}</p>

            <div className="treatment-list">
              {group.items.map((item) => (
                <article key={item.sku} className="treatment-item">
                  <h3>{item.name}</h3>
                  <p>{item.blurb}</p>
                  <span className="treatment-item__price">
                    {formatTreatmentPrice(item)}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="section section--tight">
        <div className="shell">
          <p className="section__lede">{TREATMENT_MENU_DISCLAIMER}</p>
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
