/**
 * Customer-facing consultation / consent / aftercare content
 * adapted from docs/forms/consultation-consent-aftercare.pdf
 * (clinician examination & treatment-record pages stay staff-only).
 */

export type YnAnswer = {
  answer: "" | "Y" | "N";
  comments: string;
};

export function emptyYn(): YnAnswer {
  return { answer: "", comments: "" };
}

export type ConsultationAnswers = {
  details: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    line1: string;
    city: string;
    postcode: string;
    gpName: string;
    gpAddress: string;
    contactGp: "" | "Y" | "N";
    emergencyName: string;
    emergencyPhone: string;
    whatsappOptIn: boolean;
    emailOptIn: boolean;
  };
  concerns: {
    mainConcerns: string;
    desiredResults: string;
  };
  skinHealth: Record<string, YnAnswer>;
  routine: Record<string, YnAnswer>;
  skinType: {
    selfAssessment: string;
    ethnicity: string;
    fitzpatrick: string;
  };
  sunLifestyle: Record<string, YnAnswer>;
  aestheticHistory: Record<string, YnAnswer>;
  aestheticNotes: {
    adverseReactions: string;
    disappointingResults: string;
  };
  medical: {
    receivingTreatment: YnAnswer;
    medications: string;
    allergies: string;
    pregnantBreastfeeding: string;
    pastHistory: string;
    precautions: Record<string, YnAnswer>;
  };
  consentChecks: Record<string, boolean>;
  aftercareAcknowledged: boolean;
};

export const SKIN_HEALTH_ITEMS: Array<{ id: string; label: string }> = [
  { id: "dermatologist", label: "Currently seeing a dermatologist" },
  { id: "acne", label: "Acne" },
  { id: "rosacea", label: "Rosacea" },
  { id: "pigmentation", label: "Photodamage / pigmentation / melasma / PIH" },
  { id: "eczema", label: "Eczema / dermatitis / psoriasis" },
  { id: "skinCancer", label: "Skin cancer / mole removal" },
  { id: "otherSkin", label: "Other skin condition" },
];

export const ROUTINE_ITEMS: Array<{ id: string; label: string }> = [
  { id: "cleanser", label: "Cleanser" },
  { id: "toner", label: "Toner" },
  { id: "antioxidant", label: "Antioxidant" },
  { id: "exfoliation", label: "Exfoliation (physical / chemical)" },
  { id: "moisturiser", label: "Moisturiser" },
  { id: "spf", label: "SPF" },
  { id: "retinoids", label: "Retinoids" },
  { id: "prescriptionTopicals", label: "Prescription topicals (e.g. hydrocortisone, BPO, tretinoin)" },
  { id: "fakeTan", label: "Fake tan / self-tanning products" },
  { id: "otherRoutine", label: "Other products" },
];

export const SKIN_TYPE_OPTIONS = [
  "Normal",
  "Oily",
  "Dry",
  "Combination",
  "Sensitive",
  "Blemish-prone / acne",
] as const;

export const FITZPATRICK_OPTIONS: Array<{ id: string; title: string; blurb: string }> = [
  { id: "1", title: "Type 1 · Very fair", blurb: "Always burns, cannot tan" },
  { id: "2", title: "Type 2 · Fair", blurb: "Usually burns, sometimes tans" },
  { id: "3", title: "Type 3 · Medium", blurb: "Sometimes burns, usually tans" },
  { id: "4", title: "Type 4 · Olive", blurb: "Rarely burns, always tans" },
  { id: "5", title: "Type 5 · Brown", blurb: "Never burns, always tans" },
  { id: "6", title: "Type 6 · Black", blurb: "Never burns, always tans" },
];

export const SUN_LIFESTYLE_ITEMS: Array<{ id: string; label: string }> = [
  { id: "indoorOutdoor", label: "Mostly outdoor work / lifestyle" },
  { id: "recentSun", label: "Recent sun exposure" },
  { id: "plannedSun", label: "Planned sun exposure / holiday soon" },
  { id: "sunbeds", label: "Sunbeds" },
  { id: "exercise", label: "Regular exercise" },
  { id: "smoking", label: "Smoking / vaping" },
  { id: "alcohol", label: "Regular alcohol" },
  { id: "contactLenses", label: "Contact lens use" },
];

export const AESTHETIC_HISTORY_ITEMS: Array<{ id: string; label: string }> = [
  { id: "surgery", label: "Surgery" },
  { id: "injectables", label: "Injectable treatments" },
  { id: "threadLift", label: "Thread lift" },
  { id: "microneedling", label: "Microneedling" },
  { id: "chemicalPeels", label: "Chemical peels" },
  { id: "laserIpl", label: "Laser / IPL / RF / HIFU" },
  { id: "permanentMakeup", label: "Permanent makeup / microblading" },
  { id: "hairRemoval", label: "Hair removal (waxing / threading)" },
  { id: "otherAesthetic", label: "Other aesthetic treatments" },
];

export const MEDICAL_PRECAUTION_ITEMS: Array<{ id: string; label: string }> = [
  { id: "antibiotics4w", label: "Antibiotics in the past 4 weeks" },
  { id: "isotretinoin6m", label: "Isotretinoin (Roaccutane) in the past 6 months" },
  { id: "hrtContraception", label: "Hormonal contraception / HRT" },
  { id: "bloodThinners", label: "Aspirin / other blood thinners" },
  { id: "autoimmune", label: "Autoimmune disorder" },
  { id: "bleedingDisorder", label: "Blood clotting disorder / increased bleeding risk" },
  { id: "hiv", label: "HIV" },
  { id: "hepatitis", label: "Hepatitis B or C" },
  { id: "epilepsy", label: "Epilepsy" },
  { id: "psychiatric", label: "Depression / anxiety (relevant to treatment)" },
  { id: "pcos", label: "PCOS" },
  { id: "coldSores", label: "Cold sores" },
  { id: "keloid", label: "Keloid scars" },
];

/** Consent statements customers tick before signing */
export const CONSENT_STATEMENTS: Array<{ id: string; label: string }> = [
  {
    id: "discussedHistory",
    label:
      "I have discussed my medical history fully with my practitioner, including side effects or complications relating to these conditions.",
  },
  {
    id: "discussedExpectations",
    label: "I have discussed realistic aesthetic expectations with my practitioner.",
  },
  {
    id: "resultsVary",
    label: "I understand that the effect of skin rejuvenation treatments can vary from person to person.",
  },
  {
    id: "aftercareExplained",
    label:
      "I have discussed preparation and aftercare instructions with my practitioner to help achieve the best results.",
  },
  {
    id: "noGuarantee",
    label: "I understand results cannot be guaranteed and my practitioner will use their best judgement.",
  },
  {
    id: "productsExplained",
    label: "My practitioner has explained the use of, and indications for, the products I will be treated with.",
  },
  {
    id: "commonReactions",
    label:
      "I have been informed of common reactions such as redness, swelling, pain, itching, bruising and tenderness, which are usually mild to moderate and settle within a few days.",
  },
  {
    id: "potentialSideEffects",
    label:
      "I understand potential side effects can include peeling, blistering, skin shedding and changes in pigmentation.",
  },
  {
    id: "repeatTreatment",
    label: "I understand repeat treatment may help maintain the desired correction long term.",
  },
  {
    id: "durationVaries",
    label: "I am aware the duration of results can be shorter or longer than expected for an individual.",
  },
  {
    id: "rareRisks",
    label:
      "I understand rare risks can include pain, allergy (including anaphylaxis), scarring, hypopigmentation, infection and skin necrosis.",
  },
  {
    id: "recordsImages",
    label:
      "I am aware the treatment, my personal details, any images taken, and clinical notes will form part of my medical records.",
  },
  {
    id: "costsExplained",
    label:
      "My practitioner has advised me of the amount of product required and the cost of treatment, which I have paid or will pay as agreed.",
  },
  {
    id: "infoCorrect",
    label: "The information I have given is correct to the best of my knowledge, and my questionnaire is up to date.",
  },
  {
    id: "consentToday",
    label: "I have had enough time to discuss treatment and hereby consent to treatment today.",
  },
];

export const AFTERCARE_SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: "What to expect",
    items: [
      "You may notice discomfort, swelling, redness, peeling, or bruising around the treatment area(s); this usually settles within a few days.",
      "If skin becomes blistered, broken, pale or grey, or pain/swelling keeps worsening, seek advice straight away — this could be an adverse reaction.",
    ],
  },
  {
    title: "For 24 hours",
    items: [
      "No touching or rubbing the skin (including facials and facial massage)",
      "No makeup",
      "No excessive exercise or alcohol",
      "No saunas, steam rooms or swimming pools",
      "Use fresh, clean pillowcases and towels",
      "Clean your mobile phone",
    ],
  },
  {
    title: "For 7 days",
    items: ["No exfoliating actives such as acid-based products, retinol or scrubs"],
  },
  {
    title: "For 2 weeks",
    items: [
      "No botulinum toxin treatments",
      "No prescription skin actives such as benzoyl peroxide, retinoids or topical medications",
      "No fake tan",
    ],
  },
  {
    title: "For 4 weeks",
    items: ["No filler treatments", "No laser treatments", "No extreme sun exposure"],
  },
  {
    title: "Continue",
    items: ["Gentle cleanser", "Moisturiser", "Tyrosinase inhibitors (if advised)", "SPF every day"],
  },
];

export function ynMap(ids: Array<{ id: string }>): Record<string, YnAnswer> {
  return Object.fromEntries(ids.map((i) => [i.id, emptyYn()]));
}

export function consentChecksMap(): Record<string, boolean> {
  return Object.fromEntries(CONSENT_STATEMENTS.map((s) => [s.id, false]));
}

export function buildConsentBody(checks: Record<string, boolean>): string {
  const lines = CONSENT_STATEMENTS.filter((s) => checks[s.id]).map((s) => `• ${s.label}`);
  return [
    "Patient consent (consultation / treatment)",
    "",
    ...lines,
    "",
    "Signed on clinic iPad as part of the customer journey.",
  ].join("\n");
}

export function createEmptyConsultation(partial?: {
  details?: Partial<ConsultationAnswers["details"]>;
  medicalExtras?: Partial<{
    allergies: string;
    medications: string;
    gpName: string;
    emergencyName: string;
    emergencyPhone: string;
    pregnantBreastfeeding: string;
    skinGoals: string;
  }>;
}): ConsultationAnswers {
  const m = partial?.medicalExtras ?? {};
  return {
    details: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      line1: "",
      city: "",
      postcode: "",
      gpName: m.gpName ?? "",
      gpAddress: "",
      contactGp: "",
      emergencyName: m.emergencyName ?? "",
      emergencyPhone: m.emergencyPhone ?? "",
      whatsappOptIn: false,
      emailOptIn: false,
      ...partial?.details,
    },
    concerns: {
      mainConcerns: m.skinGoals ?? "",
      desiredResults: "",
    },
    skinHealth: ynMap(SKIN_HEALTH_ITEMS),
    routine: ynMap(ROUTINE_ITEMS),
    skinType: { selfAssessment: "", ethnicity: "", fitzpatrick: "" },
    sunLifestyle: ynMap(SUN_LIFESTYLE_ITEMS),
    aestheticHistory: ynMap(AESTHETIC_HISTORY_ITEMS),
    aestheticNotes: { adverseReactions: "", disappointingResults: "" },
    medical: {
      receivingTreatment: emptyYn(),
      medications: m.medications ?? "",
      allergies: m.allergies ?? "",
      pregnantBreastfeeding: m.pregnantBreastfeeding ?? "",
      pastHistory: "",
      precautions: ynMap(MEDICAL_PRECAUTION_ITEMS),
    },
    consentChecks: consentChecksMap(),
    aftercareAcknowledged: false,
  };
}
