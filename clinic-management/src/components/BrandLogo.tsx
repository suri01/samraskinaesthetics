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
 * Full gold lockup (face + Samra + SKIN & AESTHETICS) as a transparent PNG,
 * styled after the open welcome brand mock.
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
        width={placement === "rail" ? 640 : 1600}
        height={placement === "rail" ? 508 : 1271}
        priority={priority}
        className="brand-mark__img"
        unoptimized
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
