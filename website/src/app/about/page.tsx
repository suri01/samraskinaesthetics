import type { Metadata } from "next";
import Link from "next/link";
import { about, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Samra Skin & Aesthetics — clinic story, practitioner credentials, and care philosophy.",
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="section__eyebrow">About</p>
          <h1>{about.practitionerName}</h1>
          <p>
            {about.role}. {about.story}
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell split">
          <div>
            <p className="section__eyebrow">Philosophy</p>
            <h2 className="section__title">Clarity over trends</h2>
            <p className="section__lede">{about.philosophy}</p>
            <ul className="trust-list">
              {about.trustPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="hero__actions" style={{ marginTop: "2rem" }}>
              <Link href={site.bookingUrl} className="btn btn--primary">
                Book
              </Link>
              <Link href="/treatments" className="btn btn--ghost">
                Treatments
              </Link>
            </div>
          </div>

          <div>
            <p className="section__eyebrow">Credentials</p>
            <h2 className="section__title">Trust signals</h2>
            <p className="section__lede">
              Replace each placeholder with real registrations, training, and
              years of practice before launch.
            </p>
            <ul className="credential-list">
              {about.credentials.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  {item.detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
