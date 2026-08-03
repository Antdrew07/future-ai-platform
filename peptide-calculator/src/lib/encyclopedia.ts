/**
 * Peptide encyclopedia — transcribed from the
 * "Peptides 4 Power — Complete Peptide Encyclopedia".
 *
 * FOR RESEARCH USE ONLY. Not medical advice. Not for human consumption.
 */

export interface EncyclopediaEntry {
  name: string;
  category: string;
  purpose: string;
  description: string;
  dosage: string;
  halfLife: string;
  administration: string;
  benefits: string[];
  sideEffects: string;
  researchNotes?: string;
  stacksWith: string[];
}

export const ENCYCLOPEDIA_CATEGORIES: string[] = [
  "Fat Loss & Metabolism",
  "Healing & Recovery",
  "GH & Muscle Support",
  "Cognitive & Mood",
  "Longevity & Mitochondrial",
  "Immunity & Inflammation",
  "Hair, Skin & Cosmetic",
  "Bioregulators",
  "HGH",
  "Amino Blends",
];

export const ENCYCLOPEDIA: EncyclopediaEntry[] = [
  // ───────────────── Fat Loss & Metabolism ─────────────────
  {
    name: "5-Amino 1MQ",
    category: "Fat Loss & Metabolism",
    purpose: "Fat Loss",
    description:
      "NNMT inhibitor that activates NAD+ pathways and promotes fat burning at the cellular level by blocking the enzyme that regulates fat cell metabolism.",
    dosage: "10–50mg per day, oral or injectable",
    halfLife: "4–6 hours",
    administration: "Oral or subcutaneous injection",
    benefits: [
      "Inhibits NNMT to promote fat loss",
      "Activates NAD+ metabolism",
      "Reduces fat cell size",
      "Preserves lean muscle mass",
      "Improves insulin sensitivity",
    ],
    sideEffects:
      "Generally well tolerated. Mild GI discomfort possible at higher doses.",
    researchNotes:
      "Preclinical studies show significant fat mass reduction without changes in food intake. Synergizes with GLP-1 agonists.",
    stacksWith: ["Retatrutide", "AOD-9604", "MOTS-C"],
  },
  {
    name: "AICAR",
    category: "Fat Loss & Metabolism",
    purpose: "Metabolic Enhancement",
    description:
      "AMPK activator that mimics the effects of exercise at the cellular level, improving metabolic efficiency and endurance.",
    dosage: "10–50mg per day, subcutaneous injection",
    halfLife: "2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Activates AMPK (exercise mimetic)",
      "Improves insulin sensitivity",
      "Enhances fat oxidation",
      "Increases endurance and stamina",
      "Supports mitochondrial biogenesis",
    ],
    sideEffects: "Hypoglycemia risk at high doses. Monitor blood sugar.",
    researchNotes:
      "Increases running endurance by 44% in animal models without training. Known as the “exercise in a bottle” compound.",
    stacksWith: ["MOTS-C", "SLU-PP-332", "SS-31"],
  },
  {
    name: "AOD-9604",
    category: "Fat Loss & Metabolism",
    purpose: "Fat Loss",
    description:
      "Modified fragment of human growth hormone (hGH 176-191) that specifically targets fat metabolism without the growth-promoting effects of full HGH. Stimulates lipolysis and inhibits lipogenesis.",
    dosage: "300–500mcg per day, subcutaneous injection",
    halfLife: "~30 minutes",
    administration: "Subcutaneous injection",
    benefits: [
      "Stimulates fat burning (lipolysis)",
      "Inhibits fat storage (lipogenesis)",
      "No effect on blood sugar or IGF-1",
      "Supports cartilage and bone repair",
      "Improves metabolic rate",
    ],
    sideEffects: "Mild injection site reactions. Very well tolerated.",
    researchNotes:
      "FDA-approved GRAS status. Studied extensively for obesity treatment. Shown to reduce body fat by up to 50% in animal models.",
    stacksWith: ["Ipamorelin", "CJC-1295", "MOTS-C"],
  },
  {
    name: "Adipotide",
    category: "Fat Loss & Metabolism",
    purpose: "Fat Loss",
    description:
      "Peptidomimetic that targets and destroys the blood vessels feeding white adipose tissue, causing programmed cell death of fat cells.",
    dosage: "100–500mcg per day, subcutaneous injection",
    halfLife: "2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Directly destroys fat cell vasculature",
      "Rapid reduction in visceral fat",
      "Improves insulin sensitivity",
      "Reduces waist circumference",
      "Targets hard-to-lose fat deposits",
    ],
    sideEffects:
      "Kidney stress at high doses — hydration is critical. Monitor kidney function.",
    researchNotes:
      "Primate studies showed 11% reduction in body weight and 27% reduction in waist circumference over 4 weeks.",
    stacksWith: ["AOD-9604", "Retatrutide"],
  },
  {
    name: "Cagrilintide",
    category: "Fat Loss & Metabolism",
    purpose: "Weight Loss",
    description:
      "Long-acting amylin analogue that reduces appetite, slows gastric emptying, and promotes satiety. Being studied in combination with semaglutide for obesity treatment.",
    dosage: "0.3–2.4mg weekly, subcutaneous injection",
    halfLife: "~7 days",
    administration: "Subcutaneous injection (weekly)",
    benefits: [
      "Reduces appetite and caloric intake",
      "Slows gastric emptying for prolonged satiety",
      "Lowers body weight",
      "Improves glycemic control",
      "Synergizes powerfully with GLP-1 agonists",
    ],
    sideEffects:
      "Nausea, vomiting, decreased appetite especially when starting. Titrate slowly.",
    researchNotes:
      "Phase 3 trials show up to 22% weight loss when combined with semaglutide.",
    stacksWith: ["Retatrutide", "Tirzepatide"],
  },
  {
    name: "Eloralintide",
    category: "Fat Loss & Metabolism",
    purpose: "Weight Loss",
    description:
      "Next-generation amylin receptor agonist designed for once-weekly dosing with improved tolerability over earlier amylin analogues.",
    dosage: "10mg weekly, subcutaneous injection",
    halfLife: "~7 days",
    administration: "Subcutaneous injection (weekly)",
    benefits: [
      "Reduces food intake and body weight",
      "Improves metabolic markers",
      "Once-weekly dosing convenience",
      "Synergizes with GLP-1 agonists",
      "Reduces visceral fat",
    ],
    sideEffects: "Nausea, reduced appetite. Generally well tolerated.",
    researchNotes:
      "Shows additive weight loss effects when combined with GLP-1 receptor agonists.",
    stacksWith: ["Retatrutide", "Tirzepatide", "Cagrilintide"],
  },
  {
    name: "MOTS-C",
    category: "Fat Loss & Metabolism",
    purpose: "Metabolic Enhancement",
    description:
      "Mitochondria-derived peptide that acts as a metabolic regulator, activating AMPK and improving insulin sensitivity. Often called a “mitochondrial hormone.”",
    dosage: "5–10mg per day, subcutaneous injection",
    halfLife: "~2 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Activates AMPK signaling",
      "Improves insulin sensitivity",
      "Promotes fat oxidation",
      "Enhances exercise performance",
      "Anti-aging mitochondrial support",
    ],
    sideEffects: "Very well tolerated. Mild injection site reactions.",
    researchNotes:
      "Reverses diet-induced insulin resistance in animal models. Levels naturally decline with age.",
    stacksWith: ["AICAR", "SS-31", "NAD+", "Mito-Prime"],
  },
  {
    name: "Retatrutide",
    category: "Fat Loss & Metabolism",
    purpose: "Weight Loss",
    description:
      "Triple agonist targeting GLP-1, GIP, and glucagon receptors simultaneously — one of the most potent weight loss compounds in development, showing up to 24% body weight reduction in trials.",
    dosage: "1–12mg weekly, subcutaneous injection (titrate slowly)",
    halfLife: "~6 days",
    administration: "Subcutaneous injection (weekly)",
    benefits: [
      "Triple receptor agonism (GLP-1/GIP/glucagon)",
      "Up to 24% body weight reduction in trials",
      "Reduces visceral and subcutaneous fat",
      "Improves cardiovascular markers",
      "Reduces liver fat (NAFLD)",
    ],
    sideEffects:
      "Nausea, vomiting, diarrhea especially when starting. Titrate dose slowly over weeks.",
    researchNotes:
      "Phase 2 trials: 24.2% weight loss at 48 weeks — highest ever recorded for a weight loss drug at that point.",
    stacksWith: ["Cagrilintide", "5-Amino 1MQ"],
  },
  {
    name: "SLU-PP-332",
    category: "Fat Loss & Metabolism",
    purpose: "Metabolic Enhancement",
    description:
      "ERR agonist that activates metabolic gene programs similar to endurance exercise, improving mitochondrial function and fat oxidation.",
    dosage: "5mg per day, subcutaneous injection",
    halfLife: "4–6 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Activates exercise-mimicking gene programs",
      "Enhances fat oxidation",
      "Improves mitochondrial biogenesis",
      "Increases endurance capacity",
      "Supports metabolic health",
    ],
    sideEffects: "Limited human data. Well tolerated in preclinical studies.",
    researchNotes:
      "Preclinical studies show significant improvements in running endurance and metabolic markers. Synergizes with AICAR.",
    stacksWith: ["AICAR", "MOTS-C", "SS-31"],
  },

  // ───────────────── Healing & Recovery ─────────────────
  {
    name: "Abaloparatide",
    category: "Healing & Recovery",
    purpose: "Bone Health",
    description:
      "PTHrP analogue that stimulates bone formation and increases bone mineral density. FDA-approved for osteoporosis treatment.",
    dosage: "80mcg per day, subcutaneous injection",
    halfLife: "~1.7 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Increases bone mineral density",
      "Stimulates osteoblast activity (bone formation)",
      "Reduces fracture risk",
      "Faster bone density gains than teriparatide",
      "Supports joint and skeletal health",
    ],
    sideEffects:
      "Injection site reactions, dizziness, nausea. Monitor calcium levels.",
    researchNotes:
      "FDA-approved. Clinical trials showed 86% reduction in vertebral fracture risk. Faster onset of bone density gains vs teriparatide.",
    stacksWith: ["BPC-157", "Teriparatide"],
  },
  {
    name: "BPC-157",
    category: "Healing & Recovery",
    purpose: "Healing & Recovery",
    description:
      "Synthetic pentadecapeptide derived from gastric juice with remarkable tissue repair properties across virtually every tissue type in the body.",
    dosage:
      "250–500mcg per day, subcutaneous or intramuscular injection near injury site",
    halfLife: "~4 hours",
    administration: "Subcutaneous or intramuscular injection",
    benefits: [
      "Accelerates tendon and ligament healing",
      "Heals gut lining and reduces inflammation",
      "Promotes angiogenesis (new blood vessel growth)",
      "Protects and heals muscle tissue",
      "Reduces pain and inflammation",
      "Neuroprotective effects",
    ],
    sideEffects:
      "Extremely well tolerated. No significant side effects reported in studies.",
    researchNotes:
      "Hundreds of published studies. Heals tendons, ligaments, muscles, gut, bone, and nerves. One of the safest healing peptides known.",
    stacksWith: ["TB-500", "BPC/TB-500 Blend", "GHK-Cu"],
  },
  {
    name: "GLOW",
    category: "Healing & Recovery",
    purpose: "Healing & Recovery",
    description:
      "Proprietary healing blend combining BPC-157, GHK-Cu, and synergistic peptides for accelerated recovery, improved skin quality, and reduced systemic inflammation.",
    dosage: "As directed on product label",
    halfLife: "Varies by component",
    administration: "Subcutaneous injection",
    benefits: [
      "Comprehensive healing support",
      "Reduces systemic inflammation",
      "Improves skin and connective tissue",
      "Accelerates injury recovery",
      "Antioxidant and anti-aging effects",
    ],
    sideEffects: "Generally well tolerated.",
    researchNotes:
      "Proprietary P4P blend combining synergistic healing peptides for comprehensive recovery support.",
    stacksWith: ["BPC-157", "TB-500", "GHK-Cu"],
  },
  {
    name: "KLOW",
    category: "Healing & Recovery",
    purpose: "Joint Health",
    description:
      "Proprietary blend targeting joint health, cartilage repair, and inflammation reduction for musculoskeletal recovery.",
    dosage: "As directed on product label",
    halfLife: "Varies by component",
    administration: "Subcutaneous injection",
    benefits: [
      "Joint and cartilage repair",
      "Reduces joint inflammation",
      "Improves mobility and flexibility",
      "Supports connective tissue health",
      "Reduces chronic pain",
    ],
    sideEffects: "Generally well tolerated.",
    researchNotes:
      "Proprietary P4P blend targeting musculoskeletal health and joint recovery.",
    stacksWith: ["BPC-157", "TB-500", "Cartalax"],
  },
  {
    name: "TB-500",
    category: "Healing & Recovery",
    purpose: "Healing & Recovery",
    description:
      "Thymosin Beta-4 — naturally occurring peptide found in virtually all human and animal cells. Promotes healing, reduces inflammation, and supports new blood vessel and muscle fiber growth.",
    dosage:
      "2–2.5mg twice weekly for loading, then 1–2mg weekly for maintenance",
    halfLife: "~2 days",
    administration: "Subcutaneous or intramuscular injection",
    benefits: [
      "Promotes systemic healing throughout the body",
      "Reduces acute and chronic inflammation",
      "Accelerates muscle fiber repair",
      "Promotes angiogenesis",
      "Improves flexibility and reduces scar tissue",
      "Neuroprotective and cardioprotective",
    ],
    sideEffects:
      "Mild fatigue or head rush immediately after injection. Generally very well tolerated.",
    researchNotes:
      "Shown to promote healing of heart tissue after myocardial infarction. Widely used in equine medicine for injury recovery.",
    stacksWith: ["BPC-157", "BPC/TB-500 Blend", "GHK-Cu"],
  },
  {
    name: "Teriparatide",
    category: "Healing & Recovery",
    purpose: "Bone Health",
    description:
      "Recombinant form of PTH (1-34) that stimulates bone formation. FDA-approved for osteoporosis — one of the few anabolic bone-building agents available.",
    dosage: "20mcg per day, subcutaneous injection",
    halfLife: "~1 hour",
    administration: "Subcutaneous injection",
    benefits: [
      "Stimulates new bone formation",
      "Increases bone mineral density",
      "Reduces vertebral and non-vertebral fractures",
      "Supports fracture healing",
      "Improves bone microarchitecture",
    ],
    sideEffects:
      "Nausea, leg cramps, dizziness. Limit use to 2 years. Monitor calcium.",
    researchNotes:
      "FDA-approved. Reduces vertebral fracture risk by 65% and non-vertebral fracture risk by 53%.",
    stacksWith: ["BPC-157", "Abaloparatide"],
  },
  {
    name: "Tri-Heal Max",
    category: "Healing & Recovery",
    purpose: "Healing & Recovery",
    description:
      "Triple-peptide healing blend combining BPC-157, TB-500, and GHK-Cu for maximum tissue repair, inflammation control, and regenerative support.",
    dosage: "As directed on product label",
    halfLife: "Varies by component",
    administration: "Subcutaneous injection",
    benefits: [
      "Triple-action healing support",
      "Accelerates tissue repair",
      "Reduces inflammation",
      "Promotes angiogenesis",
      "Improves skin and connective tissue quality",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Proprietary P4P blend combining the three most studied healing peptides for synergistic recovery.",
    stacksWith: ["BPC-157", "TB-500", "GHK-Cu"],
  },

  // ───────────────── GH & Muscle Support ─────────────────
  {
    name: "ACE-031",
    category: "GH & Muscle Support",
    purpose: "Muscle Growth",
    description:
      "Fusion protein that inhibits myostatin and other negative regulators of muscle growth by binding activin type IIB receptor.",
    dosage: "1mg subcutaneous injection, frequency as directed",
    halfLife: "~10 days",
    administration: "Subcutaneous injection",
    benefits: [
      "Inhibits myostatin (muscle growth suppressor)",
      "Significantly increases lean muscle mass",
      "Improves muscle strength",
      "May support bone density",
      "Reduces fat mass",
    ],
    sideEffects:
      "Nosebleeds, gum bleeding, dilated blood vessels. Monitor carefully.",
    researchNotes:
      "Clinical trials showed significant increases in lean body mass. Development paused due to vascular side effects at high doses.",
    stacksWith: ["Follistatin 344", "IGF-1 LR3", "Ipamorelin"],
  },
  {
    name: "CJC-1295",
    category: "GH & Muscle Support",
    purpose: "GH Stimulation",
    description:
      "GHRH analogue that stimulates the pituitary gland to release growth hormone. The DAC version has an extended half-life of 1–2 weeks.",
    dosage: "No DAC: 100–200mcg 2–3x daily. DAC: 1–2mg weekly",
    halfLife: "No DAC: ~30 min. DAC: 6–8 days",
    administration: "Subcutaneous injection",
    benefits: [
      "Stimulates GH release from pituitary",
      "Increases IGF-1 levels",
      "Promotes lean muscle growth",
      "Reduces body fat",
      "Improves sleep quality and recovery",
    ],
    sideEffects: "Water retention, tingling, flushing. Well tolerated.",
    researchNotes:
      "Most widely used GHRH analogue. Commonly stacked with Ipamorelin for synergistic GH release.",
    stacksWith: ["Ipamorelin", "GHRP-2", "Hexarelin"],
  },
  {
    name: "Follistatin 344",
    category: "GH & Muscle Support",
    purpose: "Muscle Growth",
    description:
      "Naturally occurring protein that inhibits myostatin and activin — two primary suppressors of muscle growth. One of the most potent muscle-building peptides available.",
    dosage: "100mcg per day for 10 days, then cycle off",
    halfLife: "~2 hours",
    administration: "Subcutaneous or intramuscular injection",
    benefits: [
      "Inhibits myostatin and activin",
      "Dramatically increases muscle mass",
      "Improves muscle strength and endurance",
      "Reduces body fat",
      "Supports fertility in women",
    ],
    sideEffects:
      "Potential for excessive muscle growth if overused. Cycle carefully.",
    researchNotes:
      "Dramatic muscle growth in animal models. Used in gene therapy research for muscular dystrophy.",
    stacksWith: ["ACE-031", "IGF-1 LR3", "Ipamorelin"],
  },
  {
    name: "GHRP-2",
    category: "GH & Muscle Support",
    purpose: "GH Stimulation",
    description:
      "Potent GH secretagogue that stimulates the pituitary to release growth hormone while also stimulating ghrelin receptors to increase appetite.",
    dosage: "100–300mcg per injection, 2–3x daily",
    halfLife: "~15–60 minutes",
    administration: "Subcutaneous injection",
    benefits: [
      "Potent GH release stimulation",
      "Increases IGF-1 levels",
      "Stimulates appetite (useful for bulking)",
      "Improves muscle mass and recovery",
      "Anti-inflammatory effects",
    ],
    sideEffects:
      "Increased hunger, water retention, cortisol increase at high doses.",
    researchNotes:
      "Stimulates ~7x more GH release than GHRP-6 with less hunger stimulation.",
    stacksWith: ["CJC-1295", "Ipamorelin", "Hexarelin"],
  },
  {
    name: "Hexarelin",
    category: "GH & Muscle Support",
    purpose: "GH Stimulation",
    description:
      "One of the most potent GH secretagogues available, stimulating significant GH release through both pituitary and hypothalamic pathways. Also has direct cardioprotective effects.",
    dosage: "100–200mcg per injection, 2x daily",
    halfLife: "~30–60 minutes",
    administration: "Subcutaneous injection",
    benefits: [
      "Most potent GH secretagogue peptide",
      "Cardioprotective effects",
      "Increases IGF-1",
      "Promotes muscle growth",
      "Reduces body fat",
    ],
    sideEffects:
      "Cortisol and prolactin increase, water retention. Cycle 4–6 weeks on, 4 weeks off.",
    researchNotes:
      "Shown to protect heart tissue from ischemic damage. Requires cycling to avoid desensitization.",
    stacksWith: ["CJC-1295", "GHRP-2", "Ipamorelin"],
  },
  {
    name: "IGF-1 LR3",
    category: "GH & Muscle Support",
    purpose: "Muscle Growth",
    description:
      "Modified form of IGF-1 with 70-80x longer half-life. Promotes muscle cell growth, protein synthesis, and satellite cell activation.",
    dosage: "20–120mcg per day, intramuscular injection post-workout",
    halfLife: "20–30 hours",
    administration: "Intramuscular injection (into worked muscle)",
    benefits: [
      "Promotes muscle hyperplasia (new muscle cells)",
      "Increases protein synthesis",
      "Activates satellite cells for repair",
      "Reduces fat mass",
      "Improves recovery time",
    ],
    sideEffects:
      "Hypoglycemia, joint pain, acromegaly risk with long-term high-dose use.",
    researchNotes:
      "Unlike regular IGF-1, LR3 does not bind to IGF binding proteins, allowing much longer activity in the body.",
    stacksWith: ["Ipamorelin", "CJC-1295", "Follistatin 344"],
  },
  {
    name: "Ipamorelin",
    category: "GH & Muscle Support",
    purpose: "GH Stimulation",
    description:
      "Selective GH secretagogue that stimulates GH release without significantly raising cortisol, prolactin, or ACTH — considered the cleanest GH-releasing peptide available.",
    dosage: "200–300mcg per injection, 2–3x daily (best at bedtime)",
    halfLife: "~2 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Selective GH release without cortisol spike",
      "Improves lean muscle mass",
      "Reduces body fat",
      "Improves sleep quality and recovery",
      "Anti-aging effects on skin and joints",
    ],
    sideEffects: "Mild water retention, flushing. Extremely well tolerated.",
    researchNotes:
      "Gold standard GH-releasing peptide due to selectivity. Commonly stacked with CJC-1295 for synergistic effects.",
    stacksWith: ["CJC-1295", "GHRP-2", "Tesamorelin"],
  },
  {
    name: "MGF",
    category: "GH & Muscle Support",
    purpose: "Muscle Growth",
    description:
      "Splice variant of IGF-1 produced locally in muscle tissue in response to mechanical stress. Activates satellite cells and initiates muscle repair.",
    dosage: "200–400mcg per injection, post-workout into worked muscle",
    halfLife: "~5–7 minutes (very short)",
    administration: "Intramuscular injection (immediately post-workout)",
    benefits: [
      "Activates muscle satellite cells",
      "Initiates local muscle repair",
      "Increases muscle fiber size",
      "Promotes muscle hypertrophy",
      "Synergizes with IGF-1 LR3",
    ],
    sideEffects: "Very short half-life limits systemic effects. Well tolerated.",
    researchNotes:
      "Must be injected immediately post-workout for maximum effect. PEG-MGF has a longer half-life for more convenient dosing.",
    stacksWith: ["Peg-MGF", "IGF-1 LR3", "Ipamorelin"],
  },
  {
    name: "Peg-MGF",
    category: "GH & Muscle Support",
    purpose: "Muscle Growth",
    description:
      "PEGylated Mechano Growth Factor with dramatically extended half-life from minutes to days, allowing convenient subcutaneous injection rather than immediate post-workout intramuscular injection.",
    dosage: "200–400mcg 2x weekly, subcutaneous injection",
    halfLife: "~2–3 days",
    administration: "Subcutaneous injection",
    benefits: [
      "Extended half-life vs standard MGF",
      "Activates satellite cells for muscle repair",
      "Promotes muscle hypertrophy",
      "Systemic muscle growth support",
      "Convenient 2x weekly dosing",
    ],
    sideEffects: "Generally well tolerated. Mild injection site reactions.",
    researchNotes:
      "PEGylation extends the half-life from minutes to days, allowing subcutaneous vs intramuscular injection.",
    stacksWith: ["MGF", "IGF-1 LR3", "Ipamorelin"],
  },
  {
    name: "Sermorelin",
    category: "GH & Muscle Support",
    purpose: "GH Stimulation",
    description:
      "Synthetic analogue of GHRH (first 29 amino acids) that stimulates the pituitary to naturally produce and release growth hormone. FDA-approved for GH deficiency.",
    dosage: "200–500mcg at bedtime, subcutaneous injection",
    halfLife: "~11–12 minutes",
    administration: "Subcutaneous injection",
    benefits: [
      "Stimulates natural GH production",
      "Improves body composition",
      "Enhances sleep quality",
      "Increases bone density",
      "Improves skin elasticity and energy",
    ],
    sideEffects: "Injection site reactions, flushing, headache. Well tolerated.",
    researchNotes:
      "FDA-approved for GH deficiency. Considered a safer alternative to exogenous HGH as it works through natural feedback mechanisms.",
    stacksWith: ["Ipamorelin", "CJC-1295", "GHRP-2"],
  },
  {
    name: "Tesamorelin",
    category: "GH & Muscle Support",
    purpose: "Fat Loss & GH Stimulation",
    description:
      "GHRH analogue FDA-approved for reducing visceral adiposity. Selectively reduces visceral fat while preserving lean mass. Also being studied for cognitive benefits.",
    dosage: "1–2mg per day, subcutaneous injection",
    halfLife: "~26 minutes",
    administration: "Subcutaneous injection",
    benefits: [
      "FDA-approved for visceral fat reduction",
      "Selectively targets abdominal fat",
      "Increases IGF-1 levels",
      "Improves cognitive function",
      "Preserves lean muscle mass",
    ],
    sideEffects:
      "Joint pain, water retention, glucose intolerance. Monitor blood sugar.",
    stacksWith: ["Ipamorelin", "CJC-1295", "AOD-9604"],
  },

  // ───────────────── Cognitive & Mood ─────────────────
  {
    name: "Adamax",
    category: "Cognitive & Mood",
    purpose: "Cognitive Enhancement",
    description:
      "Nootropic peptide blend combining Semax and Selank analogues for synergistic cognitive enhancement, anxiety reduction, and neuroprotection.",
    dosage: "300–600mcg per day, intranasal or subcutaneous",
    halfLife: "~2–4 hours",
    administration: "Intranasal spray or subcutaneous injection",
    benefits: [
      "Enhances cognitive function and memory",
      "Reduces anxiety and stress",
      "Neuroprotective effects",
      "Improves focus and mental clarity",
      "Mood stabilization",
    ],
    sideEffects: "Generally very well tolerated. Mild fatigue initially.",
    researchNotes:
      "Proprietary blend combining the cognitive benefits of Semax with the anxiolytic effects of Selank.",
    stacksWith: ["Selank", "Semax", "P-21"],
  },
  {
    name: "Cerebrolysin",
    category: "Cognitive & Mood",
    purpose: "Neuroprotection",
    description:
      "Neuropeptide preparation derived from porcine brain tissue containing neurotrophic factors including BDNF, NGF, CNTF, and GDNF. Promotes neuronal survival and neuroplasticity.",
    dosage: "5–30mL per injection, intramuscular or IV",
    halfLife: "Variable (complex mixture)",
    administration: "Intramuscular or intravenous injection",
    benefits: [
      "Contains multiple neurotrophic factors (BDNF, NGF)",
      "Promotes neuroplasticity and neurogenesis",
      "Neuroprotective against stroke and TBI",
      "Improves memory and learning",
      "May slow neurodegenerative progression",
    ],
    sideEffects:
      "Injection site reactions, mild dizziness. Rare allergic reactions.",
    stacksWith: ["Semax", "Selank", "P-21"],
  },
  {
    name: "NA-Selank",
    category: "Cognitive & Mood",
    purpose: "Anxiety & Cognitive Enhancement",
    description:
      "N-Acetyl Selank with improved bioavailability and potency. Provides anxiolytic, nootropic, and immunomodulatory effects with enhanced CNS penetration.",
    dosage: "250–500mcg per day, intranasal or subcutaneous",
    halfLife: "~4–6 hours",
    administration: "Intranasal spray or subcutaneous injection",
    benefits: [
      "Enhanced anxiolytic effects vs standard Selank",
      "Improves memory and learning",
      "Immunomodulatory effects",
      "Antidepressant properties",
      "Improves sleep quality",
    ],
    sideEffects: "Very well tolerated. Mild sedation at high doses.",
    researchNotes:
      "N-acetylation improves CNS penetration and duration of action compared to standard Selank.",
    stacksWith: ["Selank", "Semax", "NA-Semax"],
  },
  {
    name: "NA-Semax",
    category: "Cognitive & Mood",
    purpose: "Cognitive Enhancement",
    description:
      "N-Acetyl Semax with enhanced bioavailability and longer duration of action. Provides potent cognitive enhancement and neuroprotection.",
    dosage: "300–600mcg per day, intranasal or subcutaneous",
    halfLife: "~6–8 hours",
    administration: "Intranasal spray or subcutaneous injection",
    benefits: [
      "Potent cognitive enhancement",
      "Increases BDNF production",
      "Neuroprotective effects",
      "Improves focus and memory",
      "Mood enhancement",
    ],
    sideEffects: "Very well tolerated. Mild stimulation.",
    researchNotes:
      "N-acetylation provides longer duration of action and improved CNS penetration vs standard Semax.",
    stacksWith: ["Semax", "Selank", "NA-Selank"],
  },
  {
    name: "Oxytocin",
    category: "Cognitive & Mood",
    purpose: "Mood & Social",
    description:
      "The “bonding hormone” that plays a crucial role in social bonding, trust, empathy, and emotional regulation. Research use focuses on social anxiety, autism spectrum, and mood disorders.",
    dosage: "10–40 IU intranasal, or 1–5mg subcutaneous",
    halfLife: "~1–6 minutes (IV), longer intranasal",
    administration: "Intranasal spray or subcutaneous injection",
    benefits: [
      "Promotes social bonding and trust",
      "Reduces social anxiety",
      "Improves emotional regulation",
      "Anti-stress effects",
      "May improve autism spectrum symptoms",
    ],
    sideEffects:
      "Nausea, headache at high doses. Potential for emotional sensitivity.",
    researchNotes:
      "Extensive research in social anxiety, autism, and PTSD. Intranasal delivery provides CNS effects without systemic side effects.",
    stacksWith: ["Selank", "Semax", "PE-22-28"],
  },
  {
    name: "P-21",
    category: "Cognitive & Mood",
    purpose: "Neurogenesis & Memory",
    description:
      "CNTF analogue that promotes neurogenesis, improves memory consolidation, and has shown remarkable effects on cognitive function and mood.",
    dosage: "5–10mg per day, subcutaneous injection",
    halfLife: "~4–6 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Promotes neurogenesis (new brain cells)",
      "Improves long-term memory consolidation",
      "Antidepressant effects",
      "Neuroprotective",
      "May improve learning capacity",
    ],
    sideEffects: "Generally well tolerated. Mild fatigue initially.",
    researchNotes:
      "Animal studies show significant improvements in memory and neurogenesis. Considered one of the most promising nootropic peptides.",
    stacksWith: ["Semax", "Cerebrolysin", "PE-22-28"],
  },
  {
    name: "PE-22-28",
    category: "Cognitive & Mood",
    purpose: "Antidepressant",
    description:
      "Synthetic peptide derived from spadin with rapid antidepressant effects. Acts as a TREK-1 potassium channel blocker.",
    dosage: "5–10mg per day, subcutaneous injection",
    halfLife: "~4–6 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Rapid antidepressant effects",
      "TREK-1 potassium channel blocker",
      "Anxiolytic properties",
      "Neuroprotective",
      "May improve treatment-resistant depression",
    ],
    sideEffects: "Limited human data. Well tolerated in preclinical studies.",
    researchNotes:
      "Derived from spadin, a natural antidepressant peptide. Shows rapid onset of action compared to traditional antidepressants.",
    stacksWith: ["Selank", "Oxytocin", "P-21"],
  },
  {
    name: "Selank",
    category: "Cognitive & Mood",
    purpose: "Anxiety & Cognitive Enhancement",
    description:
      "Synthetic heptapeptide analogue of tuftsin developed in Russia with potent anxiolytic, nootropic, and immunomodulatory effects and an excellent safety profile.",
    dosage: "250–500mcg per day, intranasal or subcutaneous",
    halfLife: "~2–4 hours",
    administration: "Intranasal spray or subcutaneous injection",
    benefits: [
      "Potent anxiolytic without sedation",
      "Improves memory and learning",
      "Immunomodulatory effects",
      "Antidepressant properties",
      "Reduces stress response",
    ],
    sideEffects:
      "Extremely well tolerated. No addiction potential. No withdrawal.",
    researchNotes:
      "Approved in Russia for anxiety and cognitive disorders. Extensive clinical use with excellent safety record.",
    stacksWith: ["Semax", "NA-Selank", "Oxytocin"],
  },
  {
    name: "Semax",
    category: "Cognitive & Mood",
    purpose: "Cognitive Enhancement",
    description:
      "Synthetic analogue of ACTH (4-7) developed in Russia. Potent nootropic that increases BDNF, improves cognitive function, and has neuroprotective effects.",
    dosage: "300–600mcg per day, intranasal or subcutaneous",
    halfLife: "~20 minutes (intranasal), longer subcutaneous",
    administration: "Intranasal spray or subcutaneous injection",
    benefits: [
      "Increases BDNF production",
      "Potent cognitive enhancement",
      "Neuroprotective effects",
      "Improves focus and memory",
      "Used clinically for stroke recovery",
    ],
    sideEffects: "Very well tolerated. Mild stimulation at high doses.",
    researchNotes:
      "Approved in Russia for stroke, TBI, and cognitive disorders. Shown to increase BDNF by up to 800% in some studies.",
    stacksWith: ["Selank", "NA-Semax", "Cerebrolysin"],
  },
  {
    name: "VIP",
    category: "Cognitive & Mood",
    purpose: "Anti-Inflammatory",
    description:
      "Vasoactive Intestinal Peptide with potent anti-inflammatory, vasodilatory, and immunomodulatory effects. Studied for CIRS and mast cell activation syndrome.",
    dosage: "50 IU intranasal 4x daily",
    halfLife: "~1–2 minutes",
    administration: "Intranasal spray",
    benefits: [
      "Potent anti-inflammatory effects",
      "Vasodilatory (improves blood flow)",
      "Immunomodulatory",
      "Neuroprotective",
      "May help CIRS and mast cell disorders",
    ],
    sideEffects: "Facial flushing, low blood pressure at high doses.",
    researchNotes:
      "Used by Dr. Ritchie Shoemaker for CIRS treatment. Reduces neuroinflammation and improves cognitive function in CIRS patients.",
    stacksWith: ["Selank", "KPV", "Thymosin Alpha-1"],
  },

  // ───────────────── Longevity & Mitochondrial ─────────────────
  {
    name: "Epitalon",
    category: "Longevity & Mitochondrial",
    purpose: "Anti-Aging & Longevity",
    description:
      "Tetrapeptide derived from the pineal gland that activates telomerase, lengthens telomeres, and has shown remarkable anti-aging effects in both animal and human studies.",
    dosage: "5–10mg per day for 10–20 days, 2–3x per year",
    halfLife: "~2 hours",
    administration: "Subcutaneous injection or intranasal",
    benefits: [
      "Activates telomerase enzyme",
      "Lengthens telomeres (anti-aging)",
      "Regulates circadian rhythms",
      "Antioxidant effects",
      "May extend lifespan",
    ],
    sideEffects:
      "Extremely well tolerated. No significant side effects in studies.",
    researchNotes:
      "Human studies by Dr. Khavinson show increased lifespan by 20-30% and reduced cancer incidence. Most studied anti-aging peptide.",
    stacksWith: ["NA-Epitalon", "Pinealon", "NAD+"],
  },
  {
    name: "FOXO4-DRI",
    category: "Longevity & Mitochondrial",
    purpose: "Senolytics",
    description:
      "D-retro-inverso peptide that selectively induces apoptosis in senescent cells (zombie cells) without harming healthy cells — a true senolytics agent.",
    dosage: "5–10mg per injection, 3x weekly for 3 weeks",
    halfLife: "~4–6 hours",
    administration: "Subcutaneous or intraperitoneal injection",
    benefits: [
      "Selectively eliminates senescent cells",
      "Reduces SASP (senescence-associated secretory phenotype)",
      "Improves tissue regeneration",
      "Reduces chronic inflammation",
      "Potential lifespan extension",
    ],
    sideEffects:
      "Temporary fatigue as senescent cells are cleared. Generally well tolerated.",
    researchNotes:
      "Landmark 2017 Cell paper showed FOXO4-DRI restored fitness, fur density, and kidney function in fast-aging mice.",
    stacksWith: ["Epitalon", "NAD+", "SS-31"],
  },
  {
    name: "Humanin",
    category: "Longevity & Mitochondrial",
    purpose: "Longevity & Neuroprotection",
    description:
      "Mitochondria-derived peptide with potent cytoprotective, anti-apoptotic, and anti-inflammatory effects. Levels decline with age and are associated with longevity in centenarians.",
    dosage: "2–10mg per day, subcutaneous injection",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Cytoprotective against cell death",
      "Anti-inflammatory effects",
      "Neuroprotective (Alzheimer's research)",
      "Improves insulin sensitivity",
      "Associated with longevity",
    ],
    sideEffects: "Generally very well tolerated.",
    stacksWith: ["MOTS-C", "SS-31", "NAD+", "Mito-Prime"],
  },
  {
    name: "Mito-Prime",
    category: "Longevity & Mitochondrial",
    purpose: "Mitochondrial Health",
    description:
      "Proprietary mitochondrial support blend combining 5-Amino 1MQ, MOTS-C, and NAD+ precursors for comprehensive mitochondrial health and metabolic optimization.",
    dosage: "As directed on product label",
    halfLife: "Varies by component",
    administration: "Subcutaneous injection",
    benefits: [
      "Comprehensive mitochondrial support",
      "Activates AMPK and NAD+ pathways",
      "Improves cellular energy production",
      "Anti-aging effects",
      "Metabolic optimization",
    ],
    sideEffects: "Generally well tolerated.",
    researchNotes:
      "Proprietary P4P blend targeting mitochondrial health through multiple synergistic pathways.",
    stacksWith: ["MOTS-C", "SS-31", "Humanin", "NAD+"],
  },
  {
    name: "NA-Epitalon",
    category: "Longevity & Mitochondrial",
    purpose: "Anti-Aging & Longevity",
    description:
      "N-Acetyl Epitalon with enhanced bioavailability and improved CNS penetration for more potent anti-aging effects.",
    dosage: "5–10mg per day for 10–20 days, 2–3x per year",
    halfLife: "~3–4 hours",
    administration: "Subcutaneous injection or intranasal",
    benefits: [
      "Enhanced bioavailability vs standard Epitalon",
      "Activates telomerase",
      "Improved CNS penetration",
      "Regulates melatonin production",
      "Anti-aging effects",
    ],
    sideEffects: "Extremely well tolerated.",
    researchNotes:
      "N-acetylation improves lipophilicity and CNS penetration compared to standard Epitalon.",
    stacksWith: ["Epitalon", "Pinealon", "NAD+"],
  },
  {
    name: "NAD+",
    category: "Longevity & Mitochondrial",
    purpose: "Anti-Aging & Metabolic Health",
    description:
      "Critical coenzyme involved in hundreds of metabolic reactions. Levels decline significantly with age, and supplementation has shown remarkable anti-aging, metabolic, and neuroprotective effects.",
    dosage: "100–500mg per day, subcutaneous injection or IV",
    halfLife: "~1–2 hours",
    administration: "Subcutaneous injection or intravenous infusion",
    benefits: [
      "Restores NAD+ levels that decline with age",
      "Activates sirtuins (longevity genes)",
      "Improves mitochondrial function",
      "Enhances DNA repair",
      "Improves energy, cognition, and metabolism",
    ],
    sideEffects:
      "Flushing, nausea with rapid IV infusion. Subcutaneous injection generally well tolerated.",
    researchNotes:
      "Extensive research showing NAD+ supplementation reverses multiple hallmarks of aging in animal models. Human trials ongoing.",
    stacksWith: ["MOTS-C", "SS-31", "Epitalon", "Mito-Prime"],
  },
  {
    name: "PNC-27",
    category: "Longevity & Mitochondrial",
    purpose: "Anti-Cancer Research",
    description:
      "p53-derived peptide that selectively induces apoptosis in cancer cells by targeting HDM-2 and inserting into cancer cell membranes, without harming normal cells.",
    dosage: "10–30mg per injection, as directed",
    halfLife: "~4–6 hours",
    administration: "Subcutaneous or intratumoral injection",
    benefits: [
      "Selectively targets cancer cells",
      "Induces apoptosis in tumor cells",
      "Does not harm normal cells",
      "Anti-tumor effects",
      "May work synergistically with conventional therapies",
    ],
    sideEffects:
      "Generally well tolerated. Tumor lysis syndrome possible with large tumor burden.",
    researchNotes:
      "Preclinical studies show selective destruction of cancer cells including pancreatic, breast, and melanoma cells.",
    stacksWith: ["FOXO4-DRI", "Thymosin Alpha-1"],
  },
  {
    name: "SS-31",
    category: "Longevity & Mitochondrial",
    purpose: "Mitochondrial Health",
    description:
      "Mitochondria-targeted peptide (Elamipretide) that concentrates in the inner mitochondrial membrane, reduces oxidative stress, and improves mitochondrial function.",
    dosage: "1–10mg per day, subcutaneous injection",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Concentrates in mitochondrial inner membrane",
      "Reduces mitochondrial oxidative stress",
      "Improves ATP production",
      "Cardioprotective effects",
      "Anti-aging mitochondrial support",
    ],
    sideEffects: "Generally very well tolerated. Mild injection site reactions.",
    researchNotes:
      "Phase 2 clinical trials for heart failure (Stealth BioTherapeutics). Shown to improve exercise tolerance and reduce cardiac dysfunction.",
    stacksWith: ["MOTS-C", "NAD+", "Humanin", "Mito-Prime"],
  },

  // ───────────────── Immunity & Inflammation ─────────────────
  {
    name: "Glutathione",
    category: "Immunity & Inflammation",
    purpose: "Antioxidant & Immune Support",
    description:
      "The body's master antioxidant, critical for detoxification, immune function, and cellular protection.",
    dosage: "600–1500mg per injection, subcutaneous or IV",
    halfLife: "~2–3 hours",
    administration: "Subcutaneous injection or intravenous",
    benefits: [
      "Master antioxidant protection",
      "Supports liver detoxification",
      "Immune system enhancement",
      "Skin brightening effects",
      "Anti-aging cellular protection",
    ],
    sideEffects: "Very well tolerated. Rare allergic reactions.",
    researchNotes:
      "Levels decline with age, disease, and stress. IV glutathione widely used in anti-aging clinics. Improves skin tone and reduces oxidative stress markers.",
    stacksWith: ["Thymosin Alpha-1", "KPV", "NAD+"],
  },
  {
    name: "KPV",
    category: "Immunity & Inflammation",
    purpose: "Anti-Inflammatory",
    description:
      "Anti-inflammatory tripeptide (a fragment of alpha-MSH) with potent effects on gut inflammation and immune modulation.",
    dosage: "500mcg–1mg per day, subcutaneous injection or oral",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection or oral (for gut effects)",
    benefits: [
      "Potent gut anti-inflammatory effects",
      "Reduces IBD and Crohn's symptoms",
      "Promotes wound healing",
      "Antimicrobial properties",
      "Mast cell stabilization",
    ],
    sideEffects:
      "Extremely well tolerated. No significant side effects reported.",
    researchNotes:
      "Shown to reduce intestinal inflammation in colitis models. Oral administration provides direct gut anti-inflammatory effects.",
    stacksWith: ["BPC-157", "Thymosin Alpha-1", "LL-37"],
  },
  {
    name: "LL-37",
    category: "Immunity & Inflammation",
    purpose: "Antimicrobial & Immune",
    description:
      "The only known human cathelicidin antimicrobial peptide with broad-spectrum antimicrobial activity, immunomodulatory effects, and wound healing promotion.",
    dosage: "100–500mcg per day, subcutaneous injection",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection or topical",
    benefits: [
      "Broad-spectrum antimicrobial activity",
      "Immunomodulatory effects",
      "Promotes wound healing",
      "Anti-biofilm activity",
      "Anti-inflammatory in chronic conditions",
    ],
    sideEffects:
      "Injection site reactions. Pro-inflammatory at very high doses.",
    researchNotes:
      "Critical component of innate immunity. Deficiency linked to increased susceptibility to infections. Being studied for chronic wound healing.",
    stacksWith: ["Thymosin Alpha-1", "KPV", "BPC-157"],
  },
  {
    name: "Thymalin",
    category: "Immunity & Inflammation",
    purpose: "Immune Restoration",
    description:
      "Peptide bioregulator derived from the thymus gland that restores thymic function and immune competence, particularly in aging individuals.",
    dosage: "5–20mg per day for 5–10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Restores thymic function",
      "Improves immune competence",
      "Anti-aging immune support",
      "Reduces susceptibility to infections",
      "Synergizes with other bioregulators",
    ],
    sideEffects: "Generally very well tolerated.",
    stacksWith: ["Thymosin Alpha-1", "Crystagen", "Epitalon"],
  },
  {
    name: "Thymosin Alpha-1",
    category: "Immunity & Inflammation",
    purpose: "Immune Modulation",
    description:
      "Naturally occurring thymic peptide that modulates immune function, enhances T-cell activity, and has been used clinically for viral infections, cancer, and immunodeficiency.",
    dosage: "1.6mg subcutaneous injection, 2x weekly",
    halfLife: "~2 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Enhances T-cell and NK cell activity",
      "Antiviral effects (hepatitis B, C, COVID-19)",
      "Adjuvant for cancer treatment",
      "Reduces immunodeficiency",
      "Anti-inflammatory in autoimmune conditions",
    ],
    sideEffects: "Extremely well tolerated. Approved in 37 countries.",
    researchNotes:
      "FDA-approved orphan drug. Used in 37+ countries for hepatitis, cancer, and immunodeficiency. Extensive clinical evidence base.",
    stacksWith: ["LL-37", "KPV", "Thymalin"],
  },

  // ───────────────── Hair, Skin & Cosmetic ─────────────────
  {
    name: "AHK-Cu",
    category: "Hair, Skin & Cosmetic",
    purpose: "Hair Growth & Skin",
    description:
      "Copper peptide complex that promotes hair follicle growth, increases hair density, and has potent skin regenerative effects.",
    dosage: "1–5mg per day, subcutaneous injection or topical",
    halfLife: "~4–6 hours",
    administration: "Subcutaneous injection or topical application",
    benefits: [
      "Promotes hair follicle growth",
      "Increases hair density and thickness",
      "Stimulates collagen and elastin production",
      "Wound healing effects",
      "Anti-aging skin effects",
    ],
    sideEffects: "Very well tolerated. Topical may cause mild irritation.",
    researchNotes:
      "Shown to be more potent than minoxidil for hair growth in some studies. Stimulates hair follicle stem cells.",
    stacksWith: ["GHK-Cu", "Melanotan I", "BPC-157"],
  },
  {
    name: "GHK-Cu",
    category: "Hair, Skin & Cosmetic",
    purpose: "Skin Regeneration & Anti-Aging",
    description:
      "Naturally occurring copper peptide with remarkable wound healing, anti-aging, and regenerative properties. Activates over 4,000 genes involved in tissue repair.",
    dosage: "1–5mg per day, subcutaneous injection or topical",
    halfLife: "~4–6 hours",
    administration: "Subcutaneous injection or topical",
    benefits: [
      "Activates 4,000+ repair genes",
      "Stimulates collagen and elastin production",
      "Wound healing and tissue repair",
      "Anti-aging skin effects",
      "Hair growth promotion",
      "Anti-inflammatory",
    ],
    sideEffects: "Extremely well tolerated. One of the safest peptides known.",
    researchNotes:
      "Discovered by Dr. Loren Pickart. Activates more genes than any other known compound. Shown to reverse skin aging and promote wound healing.",
    stacksWith: ["AHK-Cu", "BPC-157", "TB-500"],
  },
  {
    name: "Melanotan I",
    category: "Hair, Skin & Cosmetic",
    purpose: "Skin Tanning & Photoprotection",
    description:
      "Synthetic alpha-MSH analogue that stimulates melanin production for photoprotection. FDA-approved for erythropoietic protoporphyria.",
    dosage: "0.5–1mg per day, subcutaneous injection",
    halfLife: "~2 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Stimulates melanin production",
      "Photoprotection (reduces UV damage)",
      "FDA-approved for EPP",
      "Reduces sunburn risk",
      "Skin tanning effects",
    ],
    sideEffects: "Nausea, flushing. Less side effects than Melanotan II. Mole darkening.",
    researchNotes:
      "FDA-approved (Scenesse) for erythropoietic protoporphyria. More selective than Melanotan II with fewer side effects.",
    stacksWith: ["Melanotan II", "GHK-Cu", "AHK-Cu"],
  },
  {
    name: "Melanotan II",
    category: "Hair, Skin & Cosmetic",
    purpose: "Skin Tanning & Libido",
    description:
      "Synthetic alpha-MSH analogue that stimulates melanin production, reduces appetite, and has aphrodisiac effects through MC3R and MC4R receptor activation.",
    dosage: "0.25–1mg per day, subcutaneous injection",
    halfLife: "~30 minutes",
    administration: "Subcutaneous injection",
    benefits: [
      "Potent melanin stimulation for tanning",
      "Appetite suppression",
      "Aphrodisiac effects (libido enhancement)",
      "Photoprotection",
      "Fat loss support",
    ],
    sideEffects:
      "Nausea, flushing, spontaneous erections, yawning. Monitor existing moles carefully.",
    researchNotes:
      "Originally developed at University of Arizona. Potent tanning and libido effects. Monitor moles carefully during use.",
    stacksWith: ["Melanotan I", "GHK-Cu"],
  },
  {
    name: "SNAP-8",
    category: "Hair, Skin & Cosmetic",
    purpose: "Anti-Wrinkle",
    description:
      "Cosmetic peptide (Acetyl Octapeptide-3) that reduces expression lines by inhibiting the SNARE complex involved in muscle contraction — a topical alternative to Botox.",
    dosage: "10mg per application, topical cream or serum",
    halfLife: "N/A (topical)",
    administration: "Topical application",
    benefits: [
      "Reduces expression lines and wrinkles",
      "Inhibits SNARE complex (Botox-like)",
      "Smooths forehead and eye area",
      "Non-invasive anti-aging",
      "Improves skin texture",
    ],
    sideEffects: "Very well tolerated topically.",
    researchNotes:
      "Clinical studies show 63% reduction in wrinkle depth with regular use. Reduces neuromuscular junction activity at the skin level.",
    stacksWith: ["GHK-Cu", "AHK-Cu"],
  },

  // ───────────────── Bioregulators ─────────────────
  {
    name: "Bronchagen",
    category: "Bioregulators",
    purpose: "Lung Health",
    description:
      "Peptide bioregulator derived from lung tissue that supports bronchial and pulmonary health, improving respiratory function and reducing airway inflammation.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Supports lung and bronchial health",
      "Reduces airway inflammation",
      "Improves respiratory function",
      "Antioxidant effects in lung tissue",
      "May help COPD and asthma",
    ],
    sideEffects: "Very well tolerated.",
    stacksWith: ["Thymosin Alpha-1", "Chronluten", "Thymalin"],
  },
  {
    name: "Cardiogen",
    category: "Bioregulators",
    purpose: "Cardiac Health",
    description:
      "Cardiac peptide bioregulator that supports heart muscle function, improves cardiac cell regeneration, and has shown benefits for heart failure and post-cardiac event recovery.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Supports cardiac muscle function",
      "Improves heart cell regeneration",
      "Reduces cardiac inflammation",
      "Post-cardiac event recovery",
      "Anti-aging heart support",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Clinical studies in Russia show improved cardiac function and reduced mortality in heart failure patients.",
    stacksWith: ["SS-31", "Humanin", "Epitalon"],
  },
  {
    name: "Cartalax",
    category: "Bioregulators",
    purpose: "Joint & Cartilage Health",
    description:
      "Cartilage peptide bioregulator that promotes chondrocyte regeneration, reduces joint inflammation, and supports cartilage repair and maintenance.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Promotes chondrocyte regeneration",
      "Reduces joint inflammation",
      "Supports cartilage repair",
      "Improves joint mobility",
      "Anti-aging joint support",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Tissue-specific bioregulator targeting cartilage cells. Part of the Khavinson bioregulator system.",
    stacksWith: ["BPC-157", "TB-500", "KLOW"],
  },
  {
    name: "Chronluten",
    category: "Bioregulators",
    purpose: "Lung Health",
    description:
      "Lung bioregulator peptide targeting bronchial epithelial cells to restore normal lung function and reduce chronic respiratory inflammation.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Restores bronchial epithelial function",
      "Reduces chronic respiratory inflammation",
      "Supports lung tissue regeneration",
      "Improves breathing capacity",
      "Anti-aging lung support",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Tissue-specific bioregulator for bronchial epithelial cells. Developed by the St. Petersburg Institute of Bioregulation.",
    stacksWith: ["Bronchagen", "Thymosin Alpha-1"],
  },
  {
    name: "Cortagen",
    category: "Bioregulators",
    purpose: "Cognitive & Brain Health",
    description:
      "Cortex-derived peptide bioregulator that supports brain cortex function, improves cognitive performance, and has neuroprotective effects against age-related cognitive decline.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Supports brain cortex function",
      "Improves cognitive performance",
      "Neuroprotective effects",
      "Anti-aging brain support",
      "May help age-related cognitive decline",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Tissue-specific bioregulator targeting cerebral cortex cells. Part of the comprehensive bioregulator anti-aging protocol.",
    stacksWith: ["Pinealon", "Epitalon", "Semax"],
  },
  {
    name: "Crystagen",
    category: "Bioregulators",
    purpose: "Immune Restoration",
    description:
      "Immune system bioregulator that targets thymus and immune cells to restore immune competence and reduce chronic inflammation associated with aging.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Restores immune cell function",
      "Reduces chronic inflammation",
      "Anti-aging immune support",
      "Improves immune response",
      "Synergizes with Thymalin",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Immune system bioregulator developed by the St. Petersburg Institute of Bioregulation.",
    stacksWith: ["Thymalin", "Thymosin Alpha-1", "Epitalon"],
  },
  {
    name: "Liveagen",
    category: "Bioregulators",
    purpose: "Liver Health",
    description:
      "Liver bioregulator peptide that supports hepatocyte function, promotes liver cell regeneration, and reduces liver inflammation and fibrosis.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Supports hepatocyte (liver cell) function",
      "Promotes liver regeneration",
      "Reduces liver inflammation",
      "Hepatoprotective effects",
      "Anti-aging liver support",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Tissue-specific bioregulator for liver cells. Shown to improve liver function markers in clinical studies.",
    stacksWith: ["Glutathione", "NAD+", "Epitalon"],
  },
  {
    name: "Ovagen",
    category: "Bioregulators",
    purpose: "GI & Liver Health",
    description:
      "Liver and gastrointestinal bioregulator that supports digestive enzyme production, gut lining integrity, and overall GI tract health.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Supports GI tract function",
      "Promotes digestive enzyme production",
      "Gut lining integrity",
      "Anti-inflammatory GI effects",
      "Liver support",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "GI and liver bioregulator from the Khavinson bioregulator system.",
    stacksWith: ["BPC-157", "KPV", "Liveagen"],
  },
  {
    name: "Pancragen",
    category: "Bioregulators",
    purpose: "Metabolic & Pancreatic Health",
    description:
      "Pancreatic bioregulator that supports insulin-producing beta cell function, improves glucose metabolism, and has shown benefits for type 2 diabetes management.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Supports pancreatic beta cell function",
      "Improves insulin production",
      "Improves glucose metabolism",
      "May help type 2 diabetes",
      "Anti-aging pancreatic support",
    ],
    sideEffects: "Very well tolerated. Monitor blood sugar.",
    researchNotes:
      "Clinical studies show improved insulin secretion and glucose tolerance in type 2 diabetic patients.",
    stacksWith: ["MOTS-C", "NAD+", "Epitalon"],
  },
  {
    name: "Pinealon",
    category: "Bioregulators",
    purpose: "Sleep & Neuroprotection",
    description:
      "Pineal gland bioregulator that regulates circadian rhythms, improves sleep quality, and has neuroprotective and anti-aging effects through melatonin pathway modulation.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Regulates circadian rhythms",
      "Improves sleep quality and depth",
      "Neuroprotective effects",
      "Anti-aging brain support",
      "Antioxidant effects",
    ],
    sideEffects: "Very well tolerated. May cause drowsiness.",
    researchNotes:
      "Pineal gland bioregulator. Shown to improve sleep architecture and reduce age-related neurodegeneration.",
    stacksWith: ["Epitalon", "NA-Epitalon", "Cortagen"],
  },
  {
    name: "Prostamax",
    category: "Bioregulators",
    purpose: "Prostate Health",
    description:
      "Prostate bioregulator that supports prostate cell function, reduces prostate inflammation, and may help benign prostatic hyperplasia (BPH) and prostate health.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Supports prostate cell function",
      "Reduces prostate inflammation",
      "May help BPH symptoms",
      "Anti-aging prostate support",
      "Improves urinary function",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Prostate-specific bioregulator. Clinical studies show improvement in BPH symptoms and prostate function markers.",
    stacksWith: ["Testagen", "Epitalon"],
  },
  {
    name: "Testagen",
    category: "Bioregulators",
    purpose: "Male Hormone Health",
    description:
      "Testicular bioregulator that supports Leydig cell function, promotes testosterone production, and supports male reproductive health and fertility.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Supports testosterone production",
      "Improves Leydig cell function",
      "Male reproductive health",
      "Fertility support",
      "Anti-aging male hormone support",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Testicular bioregulator shown to improve testosterone levels and sperm quality in clinical studies.",
    stacksWith: ["Epitalon", "Prostamax", "Ipamorelin"],
  },
  {
    name: "Thymogen",
    category: "Bioregulators",
    purpose: "Immune Modulation",
    description:
      "Synthetic dipeptide (Glu-Trp) derived from thymopoietin that modulates T-cell function and immune response, improving immune competence in immunodeficient states.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Modulates T-cell function",
      "Improves immune competence",
      "Reduces immunodeficiency",
      "Anti-inflammatory effects",
      "Synergizes with Thymalin",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Synthetic thymic peptide with immunomodulatory effects. Used clinically in Russia for immune disorders.",
    stacksWith: ["Thymalin", "Crystagen", "Thymosin Alpha-1"],
  },
  {
    name: "Vesilute",
    category: "Bioregulators",
    purpose: "Vascular Health",
    description:
      "Vascular bioregulator that supports blood vessel wall integrity, improves endothelial function, and reduces vascular inflammation associated with aging.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Supports blood vessel wall integrity",
      "Improves endothelial function",
      "Reduces vascular inflammation",
      "Anti-aging vascular support",
      "May improve circulation",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Vascular bioregulator targeting endothelial cells. Part of the comprehensive anti-aging bioregulator protocol.",
    stacksWith: ["Cardiogen", "SS-31", "Epitalon"],
  },
  {
    name: "Vesugen",
    category: "Bioregulators",
    purpose: "Vascular Health",
    description:
      "Vascular bioregulator specifically targeting smooth muscle cells in blood vessel walls, improving vascular tone and reducing age-related arterial stiffness.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Targets vascular smooth muscle cells",
      "Reduces arterial stiffness",
      "Improves vascular tone",
      "Anti-aging cardiovascular support",
      "Reduces blood pressure",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "Vascular smooth muscle bioregulator. Clinical studies show reduction in arterial stiffness markers.",
    stacksWith: ["Vesilute", "Cardiogen", "SS-31"],
  },
  {
    name: "Vilon",
    category: "Bioregulators",
    purpose: "Anti-Aging & Longevity",
    description:
      "Dipeptide (Lys-Glu) bioregulator with broad anti-aging effects, improving immune function, reducing inflammation, and extending lifespan in animal studies.",
    dosage: "20mg per day for 10 days, 2x per year",
    halfLife: "~2–4 hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Broad anti-aging effects",
      "Improves immune function",
      "Reduces chronic inflammation",
      "May extend lifespan",
      "Antioxidant effects",
    ],
    sideEffects: "Very well tolerated.",
    researchNotes:
      "One of the original Khavinson bioregulators. Animal studies show 25-30% lifespan extension. Often stacked with Epitalon.",
    stacksWith: ["Epitalon", "Thymalin", "Crystagen"],
  },

  // ───────────────── HGH ─────────────────
  {
    name: "HGH",
    category: "HGH",
    purpose: "Growth Hormone",
    description:
      "Human Growth Hormone (Somatropin) — 191-amino acid peptide hormone that regulates growth, body composition, metabolism, and cellular repair.",
    dosage: "1–4 IU per day, subcutaneous injection (split doses)",
    halfLife: "~15–20 minutes (half-life), effects last hours",
    administration: "Subcutaneous injection",
    benefits: [
      "Increases lean muscle mass",
      "Reduces body fat",
      "Improves bone density",
      "Enhances recovery and repair",
      "Anti-aging effects on skin and organs",
      "Improves energy and sleep quality",
    ],
    sideEffects:
      "Water retention, joint pain, carpal tunnel, insulin resistance at high doses. Monitor IGF-1 levels.",
    researchNotes:
      "FDA-approved for GH deficiency. Extensive research base. Anti-aging effects well documented.",
    stacksWith: ["Ipamorelin", "CJC-1295", "IGF-1 LR3"],
  },

  // ───────────────── Amino Blends ─────────────────
  {
    name: "B12",
    category: "Amino Blends",
    purpose: "Energy & Neurological Support",
    description:
      "Vitamin B12 (Methylcobalamin) — essential vitamin critical for neurological function, red blood cell formation, DNA synthesis, and energy metabolism. Injectable B12 bypasses GI absorption issues.",
    dosage: "1000mcg per injection, 1–3x weekly",
    halfLife: "~6 days",
    administration: "Subcutaneous or intramuscular injection",
    benefits: [
      "Supports neurological function",
      "Improves energy levels",
      "Supports red blood cell formation",
      "DNA synthesis support",
      "Mood and cognitive enhancement",
    ],
    sideEffects: "Extremely well tolerated. Excess excreted in urine.",
    researchNotes:
      "Injectable B12 achieves much higher serum levels than oral supplementation. Essential for those with absorption issues or vegan diets.",
    stacksWith: ["Lipo-B", "Lipo-C MIC-B12", "NAD+"],
  },
  {
    name: "L-Carnitine",
    category: "Amino Blends",
    purpose: "Fat Burning & Energy",
    description:
      "Amino acid derivative that transports long-chain fatty acids into mitochondria for beta-oxidation, improving fat burning, energy production, and exercise performance.",
    dosage: "500–2000mg per day, subcutaneous injection or oral",
    halfLife: "~17 hours",
    administration: "Subcutaneous injection or oral",
    benefits: [
      "Transports fatty acids into mitochondria",
      "Improves fat burning and energy",
      "Enhances exercise performance",
      "Reduces muscle damage and soreness",
      "Cardiovascular health support",
    ],
    sideEffects: "Very well tolerated. Fishy body odor at high oral doses.",
    researchNotes:
      "Injectable L-Carnitine has significantly higher bioavailability than oral forms. Shown to improve fat oxidation and reduce exercise-induced muscle damage.",
    stacksWith: ["AOD-9604", "MOTS-C", "Lipo-B"],
  },
];
