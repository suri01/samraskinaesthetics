import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Public welcome — composed to match docs/brand-samples/welcome-screen-target.jpg
 */
export default function HomePage() {
  return (
    <main className="welcome">
      <div className="welcome__inner">
        <BrandLogo href={null} placement="gate" priority />
        <div className="welcome__copy">
          <h1>
            Thoughtful skin care,
            <br />
            quietly refined.
          </h1>
          <p>
            Experience tranquility and expert care tailored to your skin&apos;s natural beauty.
          </p>
        </div>
        <div className="welcome__actions">
          <Link className="btn btn--primary" href="/staff/login">
            Staff sign in
          </Link>
          <Link className="btn btn--ghost" href="/ipad">
            Clinic check-in
          </Link>
        </div>
      </div>
    </main>
  );
}
