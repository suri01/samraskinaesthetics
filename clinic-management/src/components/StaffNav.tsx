"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

const links = [
  { href: "/staff", label: "Dashboard", exact: true },
  { href: "/staff/customers", label: "Customers" },
  { href: "/staff/appointments", label: "Appointments" },
  { href: "/staff/calendar", label: "Calendar" },
  { href: "/staff/treatments", label: "Treatments" },
  { href: "/staff/invoices", label: "Invoices" },
  { href: "/staff/tasks", label: "Tasks" },
  { href: "/staff/messages", label: "Messages" },
  { href: "/staff/audit", label: "Audit" },
  { href: "/staff/settings", label: "Settings" },
];

export function StaffNav({ staffName, role }: { staffName: string; role: string }) {
  const pathname = usePathname();

  return (
    <aside className="staff-nav">
      <div className="staff-nav__brand">
        <BrandLogo href="/staff" placement="rail" />
        <p className="staff-nav__sub">Clinic</p>
      </div>
      <nav className="staff-nav__links" aria-label="Staff">
        <ul>
          {links.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link href={l.href} className={active ? "is-active" : undefined}>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="staff-nav__footer">
        <div className="staff-nav__who">
          <strong>{staffName}</strong>
          <span>{role}</span>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="btn btn--ghost btn--nav" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
