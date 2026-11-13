import { formatGbp } from "@/lib/money";

/**
 * Samra Skin & Aesthetics treatment menu types + defaults.
 * Live catalogue is stored in `clinic_treatments` and edited in Settings.
 * This module is safe for client components (no DB imports).
 */

export type TreatmentCategory =
  | "consultations"
  | "microneedling"
  | "peels"
  | "hydration";

export type Treatment = {
  id?: string;
  sku: string;
  category: TreatmentCategory;
  name: string;
  /** Display name used on appointments / booking */
  serviceName: string;
  /** List price in pence; null = confirm clinically / as indicated */
  pricePence: number | null;
  /** When true, UI shows “from £X” */
  fromPrice?: boolean;
  /** Appended after price, e.g. “per session” */
  priceNote?: string;
  blurb?: string;
  sortOrder?: number;
  active?: boolean;
};

export const TREATMENT_MENU_TAGLINE =
  "Thoughtful skin treatments. Personalised care. A focus on skin quality.";

export const TREATMENT_MENU_DISCLAIMER =
  "All treatments are subject to consultation, medical history and suitability assessment. Individual treatment recommendations and costs will be confirmed before proceeding.";

export const CATEGORY_LABELS: Record<TreatmentCategory, string> = {
  consultations: "Consultations",
  microneedling: "Dermapen 4 microneedling",
  peels: "Professional chemical peels",
  hydration: "Skin hydration and quality",
};

export const CATEGORY_ORDER: TreatmentCategory[] = [
  "microneedling",
  "peels",
  "hydration",
  "consultations",
];

/** Default catalogue seeded into the DB when a clinic has no rows yet. */
export const DEFAULT_TREATMENTS: Treatment[] = [
  {
    sku: "consult-initial",
    category: "consultations",
    name: "Initial skin consultation",
    serviceName: "Initial skin consultation",
    pricePence: 2500,
    blurb: "First visit assessment and personalised plan.",
    sortOrder: 10,
  },
  {
    sku: "consult-review",
    category: "consultations",
    name: "Review appointment",
    serviceName: "Review appointment",
    pricePence: null,
    blurb: "As clinically indicated.",
    sortOrder: 20,
  },
  {
    sku: "dermapen-face",
    category: "microneedling",
    name: "Face",
    serviceName: "Dermapen 4 microneedling — Face",
    pricePence: 15000,
    sortOrder: 30,
  },
  {
    sku: "dermapen-face-neck",
    category: "microneedling",
    name: "Face and neck",
    serviceName: "Dermapen 4 microneedling — Face and neck",
    pricePence: 18000,
    sortOrder: 40,
  },
  {
    sku: "peel-neostrata",
    category: "peels",
    name: "NeoStrata professional peel",
    serviceName: "NeoStrata professional peel",
    pricePence: 8500,
    fromPrice: true,
    blurb: "Treatment selection following skin consultation.",
    sortOrder: 50,
  },
  {
    sku: "profhilo",
    category: "hydration",
    name: "Profhilo H+L",
    serviceName: "Profhilo H+L",
    pricePence: 23000,
    priceNote: "per session",
    sortOrder: 60,
  },
  {
    sku: "polyphil",
    category: "hydration",
    name: "Croma PolyPhil",
    serviceName: "Croma PolyPhil",
    pricePence: 18000,
    priceNote: "per session",
    sortOrder: 70,
  },
];

export function isTreatmentCategory(value: string): value is TreatmentCategory {
  return value in CATEGORY_LABELS;
}

export function formatTreatmentPrice(
  t: Pick<Treatment, "pricePence" | "fromPrice" | "priceNote">,
): string {
  if (t.pricePence == null) return "As clinically indicated";
  const base = formatGbp(t.pricePence);
  const priced = t.fromPrice ? `from ${base}` : base;
  return t.priceNote ? `${priced} ${t.priceNote}` : priced;
}

export function treatmentsByCategory(items: Treatment[]): Array<{
  category: TreatmentCategory;
  label: string;
  items: Treatment[];
}> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: items.filter((t) => t.category === category),
  })).filter((g) => g.items.length > 0);
}

/** Options for booking / appointment service select */
export function bookingServiceOptions(
  items: Treatment[],
): Array<{ value: string; label: string }> {
  return items.map((t) => ({
    value: t.serviceName,
    label: `${t.serviceName} · ${formatTreatmentPrice(t)}`,
  }));
}

export function findTreatmentByServiceName(
  items: Treatment[],
  serviceName: string,
): Treatment | undefined {
  const needle = serviceName.trim().toLowerCase();
  return items.find((t) => t.serviceName.toLowerCase() === needle);
}

/** Related treatments to suggest (exclude the booked one). */
export function relatedTreatmentsForService(
  items: Treatment[],
  serviceName: string,
): Treatment[] {
  const booked = findTreatmentByServiceName(items, serviceName);
  const others = items.filter((t) => t.sku !== booked?.sku);

  if (booked?.category === "consultations") {
    return others.filter((t) => t.category !== "consultations");
  }
  if (booked?.category === "microneedling") {
    return others.filter((t) =>
      ["peels", "hydration", "consultations"].includes(t.category),
    );
  }
  if (booked?.category === "peels") {
    return others.filter((t) =>
      ["microneedling", "hydration", "consultations"].includes(t.category),
    );
  }
  if (booked?.category === "hydration") {
    return others.filter((t) =>
      ["microneedling", "peels", "consultations"].includes(t.category),
    );
  }
  return others.slice(0, 4);
}

export function poundsToPence(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/£/g, "").replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function penceToPoundsInput(pence: number | null | undefined): string {
  if (pence == null) return "";
  return (pence / 100).toFixed(pence % 100 === 0 ? 0 : 2);
}
