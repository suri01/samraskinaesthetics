export const site = {
  name: "Samra Skin & Aesthetics",
  shortName: "Samra",
  tagline: "Thoughtful skin care, quietly refined.",
  description:
    "A calm aesthetics clinic focused on natural-looking results, clear advice, and care that respects your skin.",
  domain: "samraskinaesthetics.com",
  phoneDisplay: "Phone number coming soon",
  phoneHref: "tel:+440000000000",
  email: "hello@samraskinaesthetics.com",
  addressLines: [
    "Clinic address to be confirmed",
    "Town / postcode placeholder",
    "United Kingdom",
  ],
  hours: [
    { day: "Monday – Friday", time: "By appointment" },
    { day: "Saturday", time: "By appointment" },
    { day: "Sunday", time: "Closed" },
  ],
  mapUrl: "https://maps.google.com",
  bookingUrl: "/contact#book",
  social: {
    instagram: "",
    facebook: "",
  },
  quotes: [
    {
      quote: "I left feeling listened to, not sold to.",
      attribution: "Placeholder review",
    },
    {
      quote: "Results looked natural — exactly what I wanted.",
      attribution: "Placeholder review",
    },
    {
      quote: "The clinic feels calm and unhurried.",
      attribution: "Placeholder review",
    },
  ],
} as const;

export const treatments = [
  {
    slug: "skin-consultations",
    name: "Skin consultations",
    blurb:
      "A considered assessment of your skin, goals, and the safest next steps — with clear recommendations, not pressure.",
  },
  {
    slug: "facials-and-peels",
    name: "Facials & peels",
    blurb:
      "Treatment facial protocols and peels tailored to texture, glow, and calm — paced for your skin’s tolerance.",
  },
  {
    slug: "injectables",
    name: "Injectables",
    blurb:
      "Subtle anti-wrinkle and contour work where appropriate, with a preference for soft, balanced results.",
  },
  {
    slug: "skin-boosters",
    name: "Skin boosters & regeneration",
    blurb:
      "Hydration and quality-focused treatments that support skin from within — discussed carefully at consultation.",
  },
  {
    slug: "medical-skincare",
    name: "Medical-grade skincare",
    blurb:
      "Home-care routines guided by what your skin actually needs, with products introduced gradually.",
  },
] as const;

export const about = {
  practitionerName: "Samra Suri",
  role: "Aesthetic practitioner · placeholder title",
  story:
    "Samra Skin & Aesthetics is being built as a calm, clinical space for people who want honest advice and natural-looking outcomes. Full clinic story and philosophy will replace this placeholder.",
  philosophy:
    "Less hurry, more clarity. We favour treatments that suit your skin and lifestyle — and we will say so when something is not the right fit.",
  credentials: [
    {
      title: "Professional registration",
      detail: "Placeholder — add NMC / GMC / relevant register numbers",
    },
    {
      title: "Prescribing / clinical training",
      detail: "Placeholder — add independent prescribing and aesthetics qualifications",
    },
    {
      title: "Insurance & indemnity",
      detail: "Placeholder — confirm cover details for clinic services",
    },
    {
      title: "Years in practice",
      detail: "Placeholder — years of clinical / aesthetics experience",
    },
  ],
  trustPoints: [
    "Consultation-led recommendations",
    "Natural-looking treatment ethos",
    "Clear aftercare and follow-up",
    "Privacy-first clinic experience",
  ],
} as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/treatments", label: "Treatments" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
