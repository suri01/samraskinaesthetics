import Link from "next/link";
import Image from "next/image";

/**
 * Public home — pixel-match docs/brand-samples/welcome-screen-target.jpg
 * with hotspots over the two CTA buttons.
 */
export default function HomePage() {
  return (
    <main className="welcome-target">
      <div className="welcome-target__stage">
        <Image
          src="/brand/welcome-screen-target.jpg"
          alt="Samra Skin & Aesthetics — Thoughtful skin care, quietly refined."
          width={864}
          height={1152}
          priority
          unoptimized
          className="welcome-target__art"
        />
        <Link
          href="/staff/login"
          className="welcome-target__hit welcome-target__hit--staff"
          aria-label="Staff sign in"
        />
        <Link
          href="/ipad"
          className="welcome-target__hit welcome-target__hit--checkin"
          aria-label="Clinic check-in"
        />
      </div>
    </main>
  );
}
