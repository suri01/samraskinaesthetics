import Link from "next/link";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__name">{site.name}</p>
          <p className="site-footer__tagline">{site.tagline}</p>
        </div>

        <div className="site-footer__cols">
          <div>
            <p className="site-footer__label">Explore</p>
            <ul>
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link href={site.bookingUrl}>Book</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer__label">Contact</p>
            <ul>
              <li>
                <a href={site.phoneHref}>{site.phoneDisplay}</a>
              </li>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              {site.addressLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="site-footer__legal">
        <p>
          © 2026 {site.name}. Domain planned:{" "}
          {site.domain}.
        </p>
        <p>
          Privacy note: messages sent via the contact form are used only to
          respond to your enquiry. A full privacy policy will follow before
          launch.
        </p>
      </div>
    </footer>
  );
}
