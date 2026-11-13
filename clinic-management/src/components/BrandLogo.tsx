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
  /** Show crisp HTML tagline under the mark (avoids pixelated raster caps). */
  showTagline?: boolean;
};

/**
 * Transparent gold mark (face + Samra script). Fine “SKIN & AESTHETICS”
 * caps are HTML type so they stay sharp at any size.
 */
export function BrandLogo({
  href = "/",
  placement = "gate",
  priority = false,
  className = "",
  showTagline = true,
}: BrandLogoProps) {
  const image = (
    <span className={`brand-mark brand-mark--${placement} ${className}`.trim()}>
      <Image
        src={placement === "rail" ? "/brand/samra-logo-320.png" : "/brand/samra-logo.png"}
        alt=""
        width={placement === "rail" ? 640 : 1600}
        height={placement === "rail" ? 439 : 1097}
        priority={priority}
        className="brand-mark__img"
        unoptimized
      />
      {showTagline ? (
        <span className="brand-mark__tagline" aria-hidden="true">
          Skin &amp; Aesthetics
        </span>
      ) : null}
      <span className="sr-only">{BRAND.name}</span>
    </span>
  );

  if (!href) return image;
  return (
    <Link href={href} className="brand-mark-link" aria-label={BRAND.name}>
      {image}
    </Link>
  );
}
