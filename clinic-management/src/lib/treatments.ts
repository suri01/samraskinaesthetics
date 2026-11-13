import { formatGbp } from "@/lib/money";

/**
 * Samra Skin & Aesthetics treatment menu (list prices).
 * All treatments subject to consultation, medical history and suitability.
 */

export type TreatmentCategory =
  | "consultations"
  | "microneedling"
  | "peels"
  | "hydration";

export type Treatment = {
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

export const TREATMENTS: Treatment[] = [
  {
    sku: "consult-initial",
    category: "consultations",
    name: "Initial skin consultation",
    serviceName: "Initial skin consultation",
    pricePence: 2500,
    blurb: "First visit assessment and personalised plan.",
  },
  {
    sku: "consult-review",
    category: "consultations",
    name: "Review appointment",
    serviceName: "Review appointment",
    pricePence: null,
    blurb: "As clinically indicated.",
  },
  {
    sku: "dermapen-face",
    category: "microneedling",
    name: "Face",
    serviceName: "Dermapen 4 microneedling — Face",
    pricePence: 15000,
  },
  {
    sku: "dermapen-face-neck",
    category: "microneedling",
    name: "Face and neck",
    serviceName: "Dermapen 4 microneedling — Face and neck",
    pricePence: 18000,
  },
  {
    sku: "peel-neostrata",
    category: "peels",
    name: "NeoStrata professional peel",
    serviceName: "NeoStrata professional peel",
    pricePence: 8500,
    fromPrice: true,
    blurb: "Treatment selection following skin consultation.",
  },
  {
    sku: "profhilo",
    category: "hydration",
    name: "Profhilo H+L",
    serviceName: "Profhilo H+L",
    pricePence: 23000,
    priceNote: "per session",
  },
  {
    sku: "polyphil",
    category: "hydration",
    name: "Croma PolyPhil",
    serviceName: "Croma PolyPhil",
    pricePence: 18000,
    priceNote: "per session",
  },
];

export function formatTreatmentPrice(t: Treatment): string {
  if (t.pricePence == null) return "As clinically indicated";
  const base = formatGbp(t.pricePence);
  const priced = t.fromPrice ? `from ${base}` : base;
  return t.priceNote ? `${priced} ${t.priceNote}` : priced;
}

export function treatmentsByCategory(): Array<{
  category: TreatmentCategory;
  label: string;
  items: Treatment[];
}> {
  const order: TreatmentCategory[] = [
    "microneedling",
    "peels",
    "hydration",
    "consultations",
  ];
  return order.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: TREATMENTS.filter((t) => t.category === category),
  }));
}

/** Options for booking / appointment service select */
export function bookingServiceOptions(): Array<{ value: string; label: string }> {
  return TREATMENTS.map((t) => ({
    value: t.serviceName,
    label: `${t.serviceName} · ${formatTreatmentPrice(t)}`,
  }));
}

export function findTreatmentByServiceName(serviceName: string): Treatment | undefined {
  const needle = serviceName.trim().toLowerCase();
  return TREATMENTS.find((t) => t.serviceName.toLowerCase() === needle);
}

/** Related treatments to suggest as iPad interest (exclude the booked one). */
export function relatedTreatmentsForService(serviceName: string): Treatment[] {
  const booked = findTreatmentByServiceName(serviceName);
  const others = TREATMENTS.filter((t) => t.sku !== booked?.sku);

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
