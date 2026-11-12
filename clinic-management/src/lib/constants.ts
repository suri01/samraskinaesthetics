export const STAFF_COOKIE = "ssa_staff";
export const IPAD_COOKIE = "ssa_ipad";

export const IDLE_LOCK_MS = 15 * 60 * 1000;
export const MAX_SESSION_MS = 12 * 60 * 60 * 1000;
export const IPAD_SESSION_MS = 2 * 60 * 60 * 1000;
export const REAUTH_WINDOW_MS = 10 * 60 * 1000;

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = 8;
export const LOCKOUT_MS = 15 * 60 * 1000;

export const BRAND = {
  name: "Samra Skin & Aesthetics",
  shortName: "Samra",
  currency: "GBP",
  country: "GB",
} as const;

export type StaffRole = "owner" | "practitioner" | "receptionist" | "finance";

export const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  owner: ["*"],
  practitioner: ["customers", "appointments", "treatments", "photos", "forms", "tasks", "dashboard"],
  receptionist: ["customers", "appointments", "forms", "tasks", "dashboard", "messages"],
  finance: ["customers", "invoices", "payments", "dashboard"],
};

export function roleCan(role: StaffRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}
