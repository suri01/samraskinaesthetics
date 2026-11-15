import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPence: number;
};

export type InvoiceSource = "custom" | "auto";

export function totalsFromLines(lines: InvoiceLineItem[], taxPence = 0) {
  const subtotalPence = lines.reduce((sum, li) => sum + li.quantity * li.unitPence, 0);
  return {
    subtotalPence,
    taxPence,
    totalPence: subtotalPence + taxPence,
  };
}

/** Next clinic invoice number like SSA-1001, SSA-1002, … */
export async function nextInvoiceNumber(clinicId: string): Promise<string> {
  const rows = await db
    .select({ number: invoices.number })
    .from(invoices)
    .where(eq(invoices.clinicId, clinicId))
    .orderBy(desc(invoices.createdAt))
    .limit(50);

  let max = 1000;
  for (const row of rows) {
    const match = /^SSA-(\d+)$/i.exec(row.number.trim());
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `SSA-${max + 1}`;
}

export async function createInvoice(input: {
  clinicId: string;
  customerId: string;
  appointmentId?: string | null;
  source: InvoiceSource;
  status?: "draft" | "open";
  lineItems: InvoiceLineItem[];
  taxPence?: number;
  notes?: string | null;
  number?: string;
}) {
  if (!input.lineItems.length) {
    throw new Error("At least one line item is required");
  }
  for (const li of input.lineItems) {
    if (!li.description.trim()) throw new Error("Line description required");
    if (!Number.isFinite(li.quantity) || li.quantity <= 0) throw new Error("Invalid quantity");
    if (!Number.isFinite(li.unitPence) || li.unitPence < 0) throw new Error("Invalid unit price");
  }

  const lines = input.lineItems.map((li) => ({
    description: li.description.trim(),
    quantity: Math.round(li.quantity),
    unitPence: Math.round(li.unitPence),
  }));
  const taxPence = Math.max(0, Math.round(input.taxPence ?? 0));
  const totals = totalsFromLines(lines, taxPence);
  const number = input.number ?? (await nextInvoiceNumber(input.clinicId));
  const status = input.status ?? "open";

  const [row] = await db
    .insert(invoices)
    .values({
      clinicId: input.clinicId,
      customerId: input.customerId,
      appointmentId: input.appointmentId ?? null,
      number,
      source: input.source,
      status,
      currency: "GBP",
      ...totals,
      lineItemsJson: lines,
      notes: input.notes?.trim() || null,
      issuedAt: status === "open" ? new Date() : null,
    })
    .returning();

  return row;
}

export async function countInvoicesBySource(clinicId: string) {
  const rows = await db
    .select({
      source: invoices.source,
      count: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(eq(invoices.clinicId, clinicId))
    .groupBy(invoices.source);
  const out = { custom: 0, auto: 0, all: 0 };
  for (const row of rows) {
    const n = Number(row.count) || 0;
    out.all += n;
    if (row.source === "auto") out.auto += n;
    else out.custom += n;
  }
  return out;
}

export async function findOpenAutoInvoiceForAppointment(
  clinicId: string,
  appointmentId: string,
) {
  const rows = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.clinicId, clinicId),
        eq(invoices.appointmentId, appointmentId),
        eq(invoices.source, "auto"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
