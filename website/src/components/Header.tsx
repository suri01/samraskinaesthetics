"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link
          href="/"
          className="site-logo"
          aria-label={site.name}
          onClick={() => setOpen(false)}
        >
          <Image
            src="/brand/samra-logo-320.png"
            alt={site.name}
            width={640}
            height={498}
            priority
            unoptimized
            className="site-logo__img"
          />
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
        </button>

        <nav
          id="primary-nav"
          className={`primary-nav ${open ? "is-open" : ""}`}
          aria-label="Primary"
        >
          <ul>
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={active ? "is-active" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={site.bookingUrl}
            className="btn btn--primary btn--compact"
            onClick={() => setOpen(false)}
          >
            Book
          </Link>
        </nav>
      </div>
    </header>
  );
}
