/**
 * Evidence layer — ties each peptide to real clinical-trial and published-research
 * data, plus an at-a-glance "how proven is this?" level.
 *
 * Two parts:
 *  1. EVIDENCE_LEVELS — a curated maturity tag per peptide (no network needed).
 *  2. Live lookups against two free public APIs, called from the browser:
 *       - ClinicalTrials.gov API v2  (https://clinicaltrials.gov/data-api/api)
 *       - NCBI PubMed E-utilities    (https://www.ncbi.nlm.nih.gov/books/NBK25501/)
 *
 * The UI always renders working links to both sources; the live fetch just
 * enriches those links with inline results when the browser allows it (CORS).
 *
 * FOR RESEARCH USE ONLY. Not medical advice. Not for human consumption.
 */

export type EvidenceLevel =
  | "fda"
  | "intl"
  | "trials"
  | "preclinical"
  | "research";

export interface EvidenceMeta {
  label: string;
  short: string;
  description: string;
  /** Tailwind classes for the badge (light + dark aware). */
  className: string;
}

export const EVIDENCE_META: Record<EvidenceLevel, EvidenceMeta> = {
  fda: {
    label: "FDA-approved",
    short: "FDA",
    description: "Approved by the US FDA for at least one indication.",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  intl: {
    label: "Approved abroad",
    short: "Approved abroad",
    description:
      "Approved or in established clinical use outside the US (not FDA-approved).",
    className:
      "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400",
  },
  trials: {
    label: "In clinical trials",
    short: "Clinical trials",
    description: "Being evaluated in human clinical trials.",
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  preclinical: {
    label: "Preclinical",
    short: "Preclinical",
    description:
      "Evidence limited to cell or animal studies; little or no human data.",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-500",
  },
  research: {
    label: "Research only",
    short: "Research only",
    description:
      "Experimental / research-chemical status with minimal published evidence.",
    className:
      "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
};

/** Curated maturity level per peptide (keyed by encyclopedia name). */
export const EVIDENCE_LEVELS: Record<string, EvidenceLevel> = {
  // Fat Loss & Metabolism
  "5-Amino 1MQ": "preclinical",
  AICAR: "preclinical",
  "AOD-9604": "trials",
  Adipotide: "preclinical",
  Cagrilintide: "trials",
  Eloralintide: "trials",
  "MOTS-C": "preclinical",
  Retatrutide: "trials",
  "SLU-PP-332": "preclinical",
  // Healing & Recovery
  Abaloparatide: "fda",
  "BPC-157": "preclinical",
  GLOW: "research",
  KLOW: "research",
  "TB-500": "preclinical",
  Teriparatide: "fda",
  "Tri-Heal Max": "research",
  // GH & Muscle Support
  "ACE-031": "trials",
  "CJC-1295": "preclinical",
  "Follistatin 344": "preclinical",
  "GHRP-2": "preclinical",
  Hexarelin: "preclinical",
  "IGF-1 LR3": "research",
  Ipamorelin: "preclinical",
  MGF: "research",
  "Peg-MGF": "research",
  Sermorelin: "fda",
  Tesamorelin: "fda",
  // Cognitive & Mood
  Adamax: "research",
  Cerebrolysin: "intl",
  "NA-Selank": "research",
  "NA-Semax": "research",
  Oxytocin: "fda",
  "P-21": "preclinical",
  "PE-22-28": "preclinical",
  Selank: "intl",
  Semax: "intl",
  VIP: "trials",
  // Longevity & Mitochondrial
  Epitalon: "trials",
  "FOXO4-DRI": "research",
  Humanin: "preclinical",
  "Mito-Prime": "research",
  "NA-Epitalon": "research",
  "NAD+": "trials",
  "PNC-27": "preclinical",
  "SS-31": "trials",
  // Immunity & Inflammation
  Glutathione: "intl",
  KPV: "preclinical",
  "LL-37": "preclinical",
  Thymalin: "intl",
  "Thymosin Alpha-1": "intl",
  // Hair, Skin & Cosmetic
  "AHK-Cu": "preclinical",
  "GHK-Cu": "preclinical",
  "Melanotan I": "fda",
  "Melanotan II": "research",
  "SNAP-8": "research",
  // Bioregulators (registered / clinical use in Russia)
  Bronchagen: "intl",
  Cardiogen: "intl",
  Cartalax: "intl",
  Chronluten: "intl",
  Cortagen: "intl",
  Crystagen: "intl",
  Liveagen: "intl",
  Ovagen: "intl",
  Pancragen: "intl",
  Pinealon: "intl",
  Prostamax: "intl",
  Testagen: "intl",
  Thymogen: "intl",
  Vesilute: "intl",
  Vesugen: "intl",
  Vilon: "intl",
  // HGH
  HGH: "fda",
  // Amino Blends
  B12: "fda",
  "L-Carnitine": "intl",
};

export function evidenceLevelFor(name: string): EvidenceLevel {
  return EVIDENCE_LEVELS[name] ?? "research";
}

/**
 * Best search term for the public databases. Some peptides are indexed under a
 * generic/scientific name; proprietary P4P blends have no meaningful literature
 * of their own, so we return null to skip the live search for those.
 */
const SEARCH_TERMS: Record<string, string | null> = {
  "SS-31": "Elamipretide",
  "TB-500": "Thymosin Beta-4",
  HGH: "Somatropin",
  "Melanotan I": "Afamelanotide",
  "PE-22-28": "Spadin",
  "NAD+": "Nicotinamide adenine dinucleotide",
  B12: "Methylcobalamin",
  "IGF-1 LR3": "IGF-1 LR3",
  "Peg-MGF": "PEG mechano growth factor",
  MGF: "Mechano growth factor",
  // Proprietary blends — no standalone literature
  GLOW: null,
  KLOW: null,
  "Tri-Heal Max": null,
  "Mito-Prime": null,
};

export function searchTermFor(name: string): string | null {
  if (name in SEARCH_TERMS) return SEARCH_TERMS[name];
  return name;
}

export function clinicalTrialsSearchUrl(term: string): string {
  return `https://clinicaltrials.gov/search?term=${encodeURIComponent(term)}`;
}

export function pubmedSearchUrl(term: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(term)}`;
}

/* ------------------------------- Clinical trials ------------------------------- */

export interface CtStudy {
  nctId: string;
  title: string;
  status: string;
  phase: string;
}
export interface CtResult {
  total: number;
  studies: CtStudy[];
}

const ctCache = new Map<string, Promise<CtResult>>();

export function fetchClinicalTrials(
  term: string,
  signal?: AbortSignal,
): Promise<CtResult> {
  const cached = ctCache.get(term);
  if (cached) return cached;

  const p = (async (): Promise<CtResult> => {
    const url =
      `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(term)}` +
      `&pageSize=5&countTotal=true`;
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`ClinicalTrials.gov ${res.status}`);
    const data = await res.json();
    const studies: CtStudy[] = (data.studies ?? []).map((s: any) => {
      const ps = s.protocolSection ?? {};
      const id = ps.identificationModule ?? {};
      const st = ps.statusModule ?? {};
      const de = ps.designModule ?? {};
      return {
        nctId: id.nctId ?? "",
        title: id.briefTitle ?? "",
        status: String(st.overallStatus ?? "").replace(/_/g, " ").toLowerCase(),
        phase: Array.isArray(de.phases) && de.phases.length
          ? de.phases.map((x: string) => x.replace(/_/g, " ")).join(", ")
          : "N/A",
      };
    });
    return { total: Number(data.totalCount ?? studies.length), studies };
  })();

  // Don't permanently cache failures.
  p.catch(() => ctCache.delete(term));
  ctCache.set(term, p);
  return p;
}

/* ------------------------------- PubMed research ------------------------------- */

export interface PubmedArticle {
  pmid: string;
  title: string;
  journal: string;
  year: string;
}
export interface PubmedResult {
  total: number;
  articles: PubmedArticle[];
}

const pmCache = new Map<string, Promise<PubmedResult>>();
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export function fetchPubMed(
  term: string,
  signal?: AbortSignal,
): Promise<PubmedResult> {
  const cached = pmCache.get(term);
  if (cached) return cached;

  const p = (async (): Promise<PubmedResult> => {
    const esearch =
      `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=relevance` +
      `&term=${encodeURIComponent(term)}`;
    const r1 = await fetch(esearch, { signal });
    if (!r1.ok) throw new Error(`PubMed esearch ${r1.status}`);
    const d1 = await r1.json();
    const ids: string[] = d1.esearchresult?.idlist ?? [];
    const total = Number(d1.esearchresult?.count ?? 0);
    if (!ids.length) return { total, articles: [] };

    const esummary = `${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
    const r2 = await fetch(esummary, { signal });
    if (!r2.ok) throw new Error(`PubMed esummary ${r2.status}`);
    const d2 = await r2.json();
    const result = d2.result ?? {};
    const articles: PubmedArticle[] = ids.map((id) => {
      const a = result[id] ?? {};
      return {
        pmid: id,
        title: a.title ?? "",
        journal: a.fulljournalname || a.source || "",
        year: String(a.pubdate ?? "").split(" ")[0] ?? "",
      };
    });
    return { total, articles };
  })();

  p.catch(() => pmCache.delete(term));
  pmCache.set(term, p);
  return p;
}
