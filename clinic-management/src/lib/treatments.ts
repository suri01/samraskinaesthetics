import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clinicTreatments } from "@/db/schema";
import {
  DEFAULT_TREATMENTS,
  isTreatmentCategory,
  type Treatment,
} from "@/lib/treatments-shared";

export * from "@/lib/treatments-shared";

export function rowToTreatment(row: typeof clinicTreatments.$inferSelect): Treatment {
  return {
    id: row.id,
    sku: row.sku,
    category: isTreatmentCategory(row.category) ? row.category : "consultations",
    name: row.name,
    serviceName: row.serviceName,
    pricePence: row.pricePence,
    fromPrice: row.fromPrice,
    priceNote: row.priceNote ?? undefined,
    blurb: row.blurb ?? undefined,
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

export async function ensureDefaultTreatments(clinicId: string) {
  const existing = await db
    .select({ id: clinicTreatments.id })
    .from(clinicTreatments)
    .where(eq(clinicTreatments.clinicId, clinicId))
    .limit(1);
  if (existing[0]) return;

  await db.insert(clinicTreatments).values(
    DEFAULT_TREATMENTS.map((t) => ({
      clinicId,
      sku: t.sku,
      category: t.category,
      name: t.name,
      serviceName: t.serviceName,
      pricePence: t.pricePence,
      fromPrice: Boolean(t.fromPrice),
      priceNote: t.priceNote ?? null,
      blurb: t.blurb ?? null,
      sortOrder: t.sortOrder ?? 0,
      active: true,
    })),
  );
}

export async function listClinicTreatments(
  clinicId: string,
  opts?: { includeInactive?: boolean },
): Promise<Treatment[]> {
  await ensureDefaultTreatments(clinicId);
  const rows = await db
    .select()
    .from(clinicTreatments)
    .where(
      opts?.includeInactive
        ? eq(clinicTreatments.clinicId, clinicId)
        : and(eq(clinicTreatments.clinicId, clinicId), eq(clinicTreatments.active, true)),
    )
    .orderBy(asc(clinicTreatments.sortOrder), asc(clinicTreatments.name));
  return rows.map(rowToTreatment);
}
