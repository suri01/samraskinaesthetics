import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact / Book",
  description:
    "Contact Samra Skin & Aesthetics — send a message, call, or book a consultation.",
};

export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="section__eyebrow">Contact / Book</p>
          <h1>Say hello, or reserve a consultation</h1>
          <p>
            Use the form, email, or phone. A live booking link or embed can
            replace the phone CTA once Samra chooses a tool.
          </p>
        </div>
      </section>

      <section className="section section--tight" id="book">
        <div className="shell split">
          <div>
            <p className="section__eyebrow">Message</p>
            <h2 className="section__title">Send an enquiry</h2>
            <p className="section__lede" style={{ marginBottom: "1.5rem" }}>
              Form delivery is placeholder for MVP — Resend or Formspree can be
              wired next. Required fields: name, email, message, consent.
            </p>
            <ContactForm />
          </div>

          <div>
            <p className="section__eyebrow">Visit</p>
            <h2 className="section__title">Clinic details</h2>
            <ul className="contact-details">
              <li>
                <strong>Phone</strong>
                <a href={site.phoneHref}>{site.phoneDisplay}</a>
              </li>
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

            <div className="map-placeholder" style={{ marginTop: "1.75rem" }}>
              <div>
                <p style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-display)" }}>
                  Map placeholder
                </p>
                <p style={{ margin: "0 0 1rem" }}>
                  Embed Google Maps once the clinic address is confirmed.
                </p>
                <a
                  className="btn btn--ghost btn--compact"
                  href={site.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open maps link
                </a>
              </div>
            </div>

            <div className="panel" style={{ marginTop: "1.5rem" }}>
              <h3>Book now</h3>
              <p>
                For MVP, booking is phone / enquiry. Point this CTA at Cal.com,
                Jane, or clinic software when ready.
              </p>
              <a href={site.phoneHref} className="btn btn--primary">
                Call to book
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
