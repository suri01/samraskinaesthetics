/**
 * Marketing catalogue synced from clinic-management DEFAULT_TREATMENTS
 * (`clinic-management/src/lib/treatments-shared.ts`). Static for MVP —
 * no live DB dependency.
 */

export type TreatmentCategory =
  | "consultations"
  | "microneedling"
  | "peels"
  | "hydration";

export type Treatment = {
  sku: string;
  category: TreatmentCategory;
  /** Short label within a category (e.g. "Face") */
  name: string;
  /** Full service name for display */
  serviceName: string;
  /** List price in pence; null = as clinically indicated */
  pricePence: number | null;
  fromPrice?: boolean;
  priceNote?: string;
  blurb: string;
  sortOrder: number;
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

/** Home / nav highlight order — clinical menu order, consultations last. */
export const CATEGORY_ORDER: TreatmentCategory[] = [
  "microneedling",
  "peels",
  "hydration",
  "consultations",
];

/** Short category blurbs for home highlights (marketing copy; not in clinic seed). */
export const CATEGORY_BLURBS: Record<TreatmentCategory, string> = {
  microneedling:
    "Dermapen 4 for texture, tone, and refined skin quality — face, or face and neck.",
  peels:
    "NeoStrata professional peels selected after consultation for clarity and renewal.",
  hydration:
    "Profhilo H+L and Croma PolyPhil to support hydration and skin quality from within.",
  consultations:
    "An initial skin consultation to map your goals, then review appointments as needed.",
};

/**
 * Canonical list from clinic seed. Where clinic had no blurb, a short
 * marketing line was added for the website (see comments on those rows).
 */
export const treatments: Treatment[] = [
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
    // Clinic seed had no blurb — website marketing line.
    blurb: "Precision microneedling across the face to support texture and tone.",
    sortOrder: 30,
  },
  {
    sku: "dermapen-face-neck",
    category: "microneedling",
    name: "Face and neck",
    serviceName: "Dermapen 4 microneedling — Face and neck",
    pricePence: 18000,
    // Clinic seed had no blurb — website marketing line.
    blurb: "Face treatment extended to the neck for continuous refinement.",
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
    // Clinic seed had no blurb — website marketing line.
    blurb: "Bio-remodelling injectable for hydration and skin quality.",
    sortOrder: 60,
  },
  {
    sku: "polyphil",
    category: "hydration",
    name: "Croma PolyPhil",
    serviceName: "Croma PolyPhil",
    pricePence: 18000,
    priceNote: "per session",
    // Clinic seed had no blurb — website marketing line.
    blurb: "Polynucleotide treatment to support skin quality and recovery.",
    sortOrder: 70,
  },
];

export function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

export function formatTreatmentPrice(
  t: Pick<Treatment, "pricePence" | "fromPrice" | "priceNote">,
): string {
  if (t.pricePence == null) return "As clinically indicated";
  const base = formatGbp(t.pricePence);
  const priced = t.fromPrice ? `from ${base}` : base;
  return t.priceNote ? `${priced} ${t.priceNote}` : priced;
}

export function treatmentsByCategory(): Array<{
  category: TreatmentCategory;
  label: string;
  blurb: string;
  items: Treatment[];
}> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    blurb: CATEGORY_BLURBS[category],
    items: treatments
      .filter((t) => t.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

/** Category cards for the home page (no individual SKUs). */
export function treatmentCategoryHighlights() {
  return treatmentsByCategory().map(({ category, label, blurb }) => ({
    slug: category,
    name: label,
    blurb,
  }));
}
