import Link from "next/link";
import { site, treatments } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-label="Introduction">
        <div className="hero__atmosphere" aria-hidden="true" />
        <div className="hero__content">
          <p className="hero__brand">{site.name}</p>
          <h1 className="hero__headline">{site.tagline}</h1>
          <p className="hero__lede">{site.description}</p>
          <div className="hero__actions">
            <Link href={site.bookingUrl} className="btn btn--primary">
              Book a consultation
            </Link>
            <Link href="/treatments" className="btn btn--ghost">
              View treatments
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <p className="section__eyebrow">Treatments</p>
          <h2 className="section__title">Care shaped around your skin</h2>
          <p className="section__lede">
            Start with a consultation. These are placeholder categories for the
            MVP — Samra’s final offer list will replace them.
          </p>

          <div className="treatment-list">
            {treatments.slice(0, 4).map((item) => (
              <Link
                key={item.slug}
                href="/treatments"
                className="treatment-item"
              >
                <h3>{item.name}</h3>
                <p>{item.blurb}</p>
                <span>Explore</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell">
          <p className="section__eyebrow">Trust</p>
          <h2 className="section__title">Quiet confidence, not hard sell</h2>
          <div className="quote-strip">
            {site.quotes.map((item) => (
              <blockquote key={item.quote} className="quote">
                <p>“{item.quote}”</p>
                <footer>— {item.attribution}</footer>
              </blockquote>
            ))}
          </div>
          <p className="section__lede" style={{ marginTop: "2rem" }}>
            Replace these with real Google reviews or patient quotes before
            launch.{" "}
            <Link href="/about" style={{ textDecoration: "underline" }}>
              Meet the clinic
            </Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell split">
          <div>
            <p className="section__eyebrow">Visit</p>
            <h2 className="section__title">Ready when you are</h2>
            <p className="section__lede">
              Call, email, or send a short note. Online booking can plug in
              later (Cal.com, Jane, or clinic software).
            </p>
            <div className="hero__actions" style={{ marginTop: "1.75rem" }}>
              <Link href="/contact" className="btn btn--primary">
                Contact / Book
              </Link>
              <a href={site.phoneHref} className="btn btn--ghost">
                {site.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="panel">
            <h3>Clinic essentials</h3>
            <ul className="contact-details">
              <li>
                <strong>Email</strong>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li>
                <strong>Location</strong>
                {site.addressLines.join(", ")}
              </li>
              <li>
                <strong>Hours</strong>
                By appointment — full schedule coming soon
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
