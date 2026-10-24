/**
 * Peptides 4 Power — affiliate directory data.
 *
 * Source of truth: the owner-supplied partner records in the `longevity-signal`
 * project (shared/ownerSuppliedPartners.ts), merged with the two vendors the
 * client added (Aminos Research, Evolve Peptides) and ordered exactly per the
 * client's layout. "Sunrise Bioresearch" is intentionally excluded.
 *
 * The affiliate link is the primary CTA — tapping a card sends the visitor
 * straight to the vendor's product with the discount applied.
 */

export interface Partner {
  slug: string;
  name: string;
  /** Plain site URL (fallback / "visit site"). */
  websiteUrl: string;
  /** Affiliate destination — the primary CTA. */
  affiliateUrl: string;
  /** Discount code to enter at checkout (null = none / applied via link). */
  code: string | null;
  /**
   * Product-vial photo shown big on the home-page vendor card.
   * A full image URL, or a Google Drive image:
   *   "https://lh3.googleusercontent.com/d/<FILE_ID>"
   * Leave undefined to fall back to the vendor's logo tile.
   */
  productImage?: string;
  /** Short human savings label, e.g. "15%" or "15% or more". */
  savings: string;
  /** Numeric percent for badges/sorting when applicable (null for non-%). */
  savingsPct: number | null;
  /** Region restriction, if any. */
  region?: "US" | "Europe";
  /** True for the house brand (featured separately). */
  houseBrand?: boolean;
  /** Launch placeholder — details still to come. */
  comingSoon?: boolean;
  /** Internal note / condition to confirm (not necessarily shown). */
  note?: string;
}

/** The client's affiliate directory, in the exact requested order. */
export const PARTNERS: Partner[] = [
  {
    slug: "aio-peptides",
    name: "AIO Peptides",
    websiteUrl: "https://aiopeptides.com/",
    affiliateUrl: "https://aiopeptides.com/?coupon=power25",
    code: "POWER25",
    savings: "25%",
    savingsPct: 25,
  },
  {
    slug: "treasure-coast",
    name: "Treasure Coast Peptide",
    websiteUrl: "https://treasurecoastpeptide.com/",
    affiliateUrl: "https://treasurecoastpeptide.com/",
    code: "POWER15",
    savings: "15%",
    savingsPct: 15,
  },
  {
    slug: "kimera-chems",
    name: "Kimera Chems",
    websiteUrl: "https://kimerachems.co/",
    affiliateUrl: "https://kimerachems.co/",
    code: "POWER15",
    savings: "15%",
    savingsPct: 15,
    note: "Code/link to confirm (supplied destination used a different coupon param).",
  },
  {
    slug: "glow-aminos",
    name: "Glow Aminos",
    websiteUrl: "https://glowaminos.com/",
    affiliateUrl: "https://glowaminos.com/",
    code: "POWER15",
    savings: "15%",
    savingsPct: 15,
  },
  {
    slug: "flawless-compounds",
    name: "Flawless Compounds",
    websiteUrl: "https://flawlesscompounds.com/",
    affiliateUrl: "https://flawlesscompounds.com/",
    code: "POWER15",
    savings: "15%",
    savingsPct: 15,
  },
  {
    slug: "iron-protocol",
    name: "Iron Protocol",
    websiteUrl: "https://ironprotocol.com/",
    affiliateUrl: "https://ironprotocol.com/ref/dfurka08/",
    code: "POWER15",
    savings: "15%",
    savingsPct: 15,
  },
  {
    slug: "atomik-labz",
    name: "Atomik Labz",
    websiteUrl: "https://atomiklabz.com/",
    affiliateUrl: "https://atomiklabz.com/aff/565/",
    code: "POWER",
    savings: "15% or more",
    savingsPct: 15,
    note: "Savings may vary with active sale terms.",
  },
  {
    slug: "aminos-research",
    name: "Aminos Research",
    websiteUrl: "https://aminosresearch.com/",
    affiliateUrl: "https://aminosresearch.com/ref/15/",
    code: "POWER15",
    savings: "15%",
    savingsPct: 15,
  },
  {
    slug: "evolve-peptides",
    name: "Evolve Peptides",
    websiteUrl: "https://evolvepeptides.com/",
    affiliateUrl: "https://evolvepeptides.com/?ref=Power20",
    code: "POWER20",
    savings: "20%",
    savingsPct: 20,
  },
  {
    slug: "swiss-chems",
    name: "Swiss Chems",
    websiteUrl: "https://swisschems.is/",
    affiliateUrl: "https://swisschems.is/",
    code: "DAVID10",
    savings: "10%",
    savingsPct: 10,
  },
  {
    slug: "bio-longevity-labs",
    name: "Bio Longevity Labs",
    websiteUrl: "https://biolongevitylabs.com/",
    affiliateUrl: "https://biolongevitylabs.com/",
    code: "DAVID15",
    savings: "15%",
    savingsPct: 15,
  },
  {
    slug: "solution-peptides",
    name: "Solution Peptides",
    websiteUrl: "https://solutionpeptides.net/",
    affiliateUrl: "https://solutionpeptides.net/aff/450/",
    code: "POWER15",
    savings: "15%",
    savingsPct: 15,
  },
  {
    slug: "nano-blue-labs",
    name: "Nano Blue Labs",
    websiteUrl: "https://nanobluelabs.com/",
    affiliateUrl: "https://nanobluelabs.com/aff/58/",
    code: "POWER10",
    savings: "10%",
    savingsPct: 10,
  },
  {
    slug: "certia-peptide",
    name: "Certia Peptide",
    websiteUrl: "https://certapeptides.com/",
    affiliateUrl: "https://certapeptides.com/",
    code: null,
    savings: "Europe",
    savingsPct: null,
    region: "Europe",
    note: "Europe only — affiliate code to be supplied.",
  },
  {
    slug: "refillpen",
    name: "RefillPen",
    websiteUrl: "https://www.refillpen.com/",
    affiliateUrl: "https://www.refillpen.com/?ref=Power10",
    code: "POWER10",
    savings: "10%",
    savingsPct: 10,
    productImage: "/vendors/refillpen.webp",
  },
  {
    slug: "get-melts",
    name: "GetMelts",
    websiteUrl: "https://getmelts.com/",
    affiliateUrl: "https://getmelts.com/",
    code: "POWER15",
    savings: "15%",
    savingsPct: 15,
  },
];

/**
 * Accent color per vendor (hex). Drives the colorful home-page tiles so the
 * vendor wall reads bright and scannable at a glance. Roughly keyed to each
 * brand's own look; tweak freely.
 */
export const VENDOR_COLORS: Record<string, string> = {
  "aio-peptides": "#7c3aed",
  "treasure-coast": "#0d9488",
  "kimera-chems": "#dc2626",
  "glow-aminos": "#db2777",
  "flawless-compounds": "#d97706",
  "iron-protocol": "#475569",
  "atomik-labz": "#ef4444",
  "aminos-research": "#16a34a",
  "evolve-peptides": "#4f46e5",
  "swiss-chems": "#e11d48",
  "bio-longevity-labs": "#2563eb",
  "solution-peptides": "#0891b2",
  "nano-blue-labs": "#1d4ed8",
  "certia-peptide": "#64748b",
  refillpen: "#f97316",
  "get-melts": "#be123c",
};

/** House brand — featured above the affiliate grid. */
export const HOUSE_BRAND: Partner = {
  slug: "peptides-4-power",
  name: "Peptides 4 Power",
  websiteUrl: "https://www.peptides4power.us/",
  affiliateUrl: "https://www.peptides4power.us/",
  code: "GLP10",
  savings: "$5–$10 on GLPs",
  savingsPct: null,
  houseBrand: true,
  note: "Owner's own store. GLP10 applies to eligible GLP products.",
};
