import {
  formatTreatmentPrice,
  relatedTreatmentsForService,
  type Treatment,
} from "@/lib/treatments";

export type UpsellOffer = {
  sku: string;
  title: string;
  blurb: string;
  pricePence: number;
};

function toOffer(t: Treatment): UpsellOffer {
  return {
    sku: t.sku,
    title: t.serviceName,
    blurb: [t.blurb, formatTreatmentPrice(t)].filter(Boolean).join(" · "),
    pricePence: t.pricePence ?? 0,
  };
}

/**
 * iPad “enhance today’s visit” options drawn from the live treatment menu,
 * excluding the service already booked.
 */
export function upsellsForService(serviceName: string): UpsellOffer[] {
  const related = relatedTreatmentsForService(serviceName).map(toOffer);
  if (related.length > 0) return related;
  return [
    {
      sku: "next-treatment",
      title: "Plan your next treatment",
      blurb: "Reserve a preferred follow-up with reception.",
      pricePence: 0,
    },
  ];
}
