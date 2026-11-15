import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact / Book",
  description:
    "Contact Samra Skin & Aesthetics in Maidenhead — send an enquiry, email, or find us at Marlow House, Windsor Road.",
};

export default function ContactPage() {
  const hasPhone = Boolean(site.phoneDisplay && site.phoneHref);

  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="section__eyebrow">Contact / Book</p>
          <h1>Say hello, or reserve a consultation</h1>
          <p>
            Send an enquiry or email us directly. We’re at Marlow House in
            Maidenhead, by appointment.
          </p>
        </div>
      </section>

      <section className="section section--tight" id="book">
        <div className="shell split">
          <div>
            <p className="section__eyebrow">Message</p>
            <h2 className="section__title">Send an enquiry</h2>
            <p className="section__lede" style={{ marginBottom: "1.5rem" }}>
              Tell us what you’re looking for. Required: name, email, message,
              and consent. We’ll reply by email.
            </p>
            <ContactForm />
          </div>

          <div>
            <p className="section__eyebrow">Visit</p>
            <h2 className="section__title">Clinic details</h2>
            <ul className="contact-details">
              {hasPhone ? (
                <li>
                  <strong>Phone</strong>
                  <a href={site.phoneHref}>{site.phoneDisplay}</a>
                </li>
              ) : null}
              <li>
                <strong>Email</strong>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li>
                <strong>Address</strong>
                {site.addressLines.map((line) => (
                  <span key={line} style={{ display: "block" }}>
                    {line}
                  </span>
                ))}
              </li>
            </ul>

            <ul className="hours-list" style={{ marginTop: "1.5rem" }}>
              {site.hours.map((row) => (
                <li key={row.day}>
                  <strong>{row.day}</strong>
                  {row.time}
                </li>
              ))}
            </ul>

            <div className="map-frame" style={{ marginTop: "1.75rem" }}>
              <iframe
                title="Map — Samra Skin & Aesthetics, Marlow House, Maidenhead"
                src={site.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <a
                className="btn btn--ghost btn--compact"
                href={site.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>

            <div className="panel" style={{ marginTop: "1.5rem" }}>
              <h3>Book a consultation</h3>
              <p>
                Prefer email? Write to us or use the form — we’ll help you find
                a suitable appointment time.
              </p>
              <a href={`mailto:${site.email}`} className="btn btn--primary">
                Email {site.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
