/** Display helpers for UK (Europe/London) dates. Storage stays ISO where needed. */

const LONDON = "Europe/London";

/** Format YYYY-MM-DD (or Date) as DD/MM/YYYY. */
export function formatUkDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  if (typeof value === "string") {
    const isoDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (isoDay) return `${isoDay[3]}/${isoDay[2]}/${isoDay[1]}`;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-GB", { timeZone: LONDON });
  }
  return value.toLocaleDateString("en-GB", { timeZone: LONDON });
}

export function formatUkDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { timeZone: LONDON });
}
