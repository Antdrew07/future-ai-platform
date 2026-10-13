/**
 * Static site copy for Peptides 4 Power.
 * Kept in one place so Dave (or the team) can tweak wording without touching
 * component code.
 */

export const SITE = {
  name: "Peptides 4 Power",
  owner: "David Furka",
  domain: "peptides4power.com",
  tagline: "Peptide education you can actually understand — plus the codes that save you money.",
};

/** Sticky-nav links (single-page smooth scroll). */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "#home" },
  { label: "Videos", href: "#videos" },
  { label: "Peptide of the Week", href: "#featured" },
  { label: "Vendor Deals", href: "#deals" },
  { label: "Poetry", href: "#poetry" },
  { label: "Contact", href: "#contact" },
];

/** Hero stats strip. */
export const HERO_STATS: { value: string; label: string }[] = [
  { value: "16+", label: "Vetted vendors" },
  { value: "25%", label: "Top discount" },
  { value: "100%", label: "Plain-English" },
];

/**
 * "Peptide of the Week" feature. Editable each week.
 * Mirrors the format Dave ran on the old site (e.g. SLU-PP-332).
 */
export const FEATURED_PEPTIDE = {
  name: "SLU-PP-332",
  nickname: "“Exercise in a bottle”",
  bullets: [
    "Increased metabolic function",
    "Increased fat burning",
    "Premixed, caps, liquid, transdermal & powder options",
  ],
  disclaimer: "For research purposes only. Not medical advice.",
};

/** Peptide Poetry — Dave's signature segment. Placeholder verses until supplied. */
export const POETRY: { title: string; body: string }[] = [
  {
    title: "Ode to Recovery",
    body:
      "Add Dave's poem here. This section keeps the personality that made the\noriginal site his — we'll drop in the real verses once you send them over.",
  },
  {
    title: "The Protocol",
    body:
      "A second verse slot, ready for Dave's words. Short or long, it renders\ncleanly in this card.",
  },
];

/** Contact details. Update with Dave's real handles/email. */
export const CONTACT = {
  blurb:
    "Questions about a protocol, a product, or a discount code? Send a message and Dave's team will get back to you.",
  email: "", // e.g. "dave@peptides4power.com" — leave "" to hide the email line
  socials: [
    // { label: "Instagram", url: "https://instagram.com/..." },
    // { label: "YouTube", url: "https://youtube.com/@..." },
  ] as { label: string; url: string }[],
};
