export type UpsellOffer = {
  sku: string;
  title: string;
  blurb: string;
  pricePence: number;
};

/** Lightweight catalogue keyed by booked service name (case-insensitive contains). */
const CATALOGUE: Array<{ match: RegExp; offers: UpsellOffer[] }> = [
  {
    match: /consult/i,
    offers: [
      {
        sku: "facial-intro",
        title: "Introductory treatment facial",
        blurb: "A calm first facial tailored after your consultation findings.",
        pricePence: 9500,
      },
      {
        sku: "skin-analysis-pack",
        title: "Home-care starter pack advice",
        blurb: "Practitioner-guided routine (products discussed separately).",
        pricePence: 0,
      },
    ],
  },
  {
    match: /facial|peel/i,
    offers: [
      {
        sku: "add-led",
        title: "LED add-on",
        blurb: "Soothing light therapy after your facial.",
        pricePence: 3500,
      },
      {
        sku: "followup-facial",
        title: "Follow-up facial (2–3 weeks)",
        blurb: "Book a review facial to build on today’s results.",
        pricePence: 11000,
      },
    ],
  },
  {
    match: /inject|toxin|filler/i,
    offers: [
      {
        sku: "review-2w",
        title: "2-week review appointment",
        blurb: "Complimentary review slot after injectable treatment.",
        pricePence: 0,
      },
      {
        sku: "skin-booster",
        title: "Skin booster series consult",
        blurb: "Discuss hydration-focused boosters if suitable.",
        pricePence: 0,
      },
    ],
  },
  {
    match: /follow-?up|review/i,
    offers: [
      {
        sku: "maintenance-plan",
        title: "Maintenance plan chat",
        blurb: "Agree a gentle schedule for ongoing skin goals.",
        pricePence: 0,
      },
    ],
  },
];

const DEFAULT_OFFERS: UpsellOffer[] = [
  {
    sku: "skincare-review",
    title: "Medical-grade skincare review",
    blurb: "Short add-on chat about products that suit your skin.",
    pricePence: 0,
  },
  {
    sku: "next-treatment",
    title: "Plan your next treatment",
    blurb: "Reserve a preferred follow-up window with reception.",
    pricePence: 0,
  },
];

export function upsellsForService(serviceName: string): UpsellOffer[] {
  for (const row of CATALOGUE) {
    if (row.match.test(serviceName)) return row.offers;
  }
  return DEFAULT_OFFERS;
}
