import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants";

type BrandLogoProps = {
  /** Link target; pass null for a non-clickable mark. */
  href?: string | null;
  /** Where the mark lives — drives size and framing. */
  placement?: "rail" | "gate" | "masthead";
  priority?: boolean;
  className?: string;
};

/**
 * Brand mark only — no duplicate wordmark text.
 * Designed to sit on a champagne/taupe plane that matches the artwork
 * background so the PNG does not read as a floating photo.
 */
export function BrandLogo({
  href = "/",
  placement = "gate",
  priority = false,
  className = "",
}: BrandLogoProps) {
  const image = (
    <span className={`brand-mark brand-mark--${placement} ${className}`.trim()}>
      <Image
        src={placement === "rail" ? "/brand/samra-logo-320.png" : "/brand/samra-logo.png"}
        alt={BRAND.name}
        width={placement === "rail" ? 280 : 800}
        height={placement === "rail" ? 187 : 533}
        priority={priority}
        className="brand-mark__img"
      />
    </span>
  );

  if (!href) return image;
  return (
    <Link href={href} className="brand-mark-link" aria-label={BRAND.name}>
      {image}
    </Link>
  );
}
