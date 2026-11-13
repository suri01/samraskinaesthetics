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
      <div className="staff-nav__brand-wrap">
        <BrandLogo href="/staff" size="nav" />
      </div>
      <p className="staff-nav__sub">Clinic</p>
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
      <div style={{ marginTop: "1.5rem" }} className="muted">
        <div>{staffName}</div>
        <div style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>{role}</div>
        <form action="/api/auth/logout" method="post" style={{ marginTop: "0.75rem" }}>
          <button className="btn btn--ghost" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
