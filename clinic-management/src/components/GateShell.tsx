import { BrandLogo } from "@/components/BrandLogo";

type GateShellProps = {
  children: React.ReactNode;
  /** Quiet label under the mark, e.g. Staff · Clinic check-in */
  eyebrow?: string;
  /** Wider content pane for forms */
  wide?: boolean;
  logoHref?: string | null;
  /** open = public welcome (mock theme); card = staff/iPad entry */
  variant?: "open" | "card";
};

/**
 * Entry compositions. Public home uses the champagne→sage open welcome theme;
 * staff/iPad keep a soft framed card on the same palette.
 */
export function GateShell({
  children,
  eyebrow,
  wide = false,
  logoHref = null,
  variant = "card",
}: GateShellProps) {
  const open = variant === "open";
  return (
    <main className={`gate${open ? " gate--open" : ""}`}>
      <div
        className={`gate__frame${wide ? " gate__frame--wide" : ""}${open ? " gate__frame--open" : ""}`}
      >
        <header className="gate__brand">
          <BrandLogo href={logoHref} placement="gate" priority />
          {eyebrow ? <p className="gate__eyebrow">{eyebrow}</p> : null}
        </header>
        <section className="gate__body">{children}</section>
      </div>
    </main>
  );
}
