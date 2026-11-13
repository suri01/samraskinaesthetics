import { BrandLogo } from "@/components/BrandLogo";

type GateShellProps = {
  children: React.ReactNode;
  /** Quiet label under the mark, e.g. Staff · Clinic iPad */
  eyebrow?: string;
  /** Wider content pane for forms */
  wide?: boolean;
  logoHref?: string | null;
};

/**
 * Entry compositions (home, login, iPad unlock): champagne brand plane +
 * calm content plane. Logo is the hero signal; copy stays secondary.
 */
export function GateShell({
  children,
  eyebrow,
  wide = false,
  logoHref = null,
}: GateShellProps) {
  return (
    <main className="gate">
      <div className={`gate__frame${wide ? " gate__frame--wide" : ""}`}>
        <header className="gate__brand">
          <BrandLogo href={logoHref} placement="gate" priority />
          {eyebrow ? <p className="gate__eyebrow">{eyebrow}</p> : null}
        </header>
        <section className="gate__body">{children}</section>
      </div>
    </main>
  );
}
