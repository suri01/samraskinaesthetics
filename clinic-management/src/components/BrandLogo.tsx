import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants";

type BrandLogoProps = {
  href?: string | null;
  size?: "nav" | "hero" | "card";
  priority?: boolean;
  className?: string;
};

const sizes = {
  nav: { width: 160, height: 107, src: "/brand/samra-logo-320.png" },
  card: { width: 220, height: 147, src: "/brand/samra-logo-320.png" },
  hero: { width: 360, height: 240, src: "/brand/samra-logo.png" },
} as const;

export function BrandLogo({
  href = "/",
  size = "card",
  priority = false,
  className = "",
}: BrandLogoProps) {
  const dim = sizes[size];
  const image = (
    <Image
      src={dim.src}
      alt={BRAND.name}
      width={dim.width}
      height={dim.height}
      priority={priority}
      className={`brand-logo brand-logo--${size} ${className}`.trim()}
    />
  );

  if (!href) return image;
  return (
    <Link href={href} className="brand-logo-link" aria-label={BRAND.name}>
      {image}
    </Link>
  );
}
