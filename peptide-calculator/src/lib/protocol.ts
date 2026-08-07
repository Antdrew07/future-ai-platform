/**
 * Protocol engine — turns an intake (weight, height, goals, health conditions)
 * into a personalized, rules-based peptide protocol.
 *
 * The decision logic mirrors the P4P master document's goal-mapping and safety
 * rules, plus explicit business rules:
 *   - Fat loss → Retatrutide (Reta) first-line.
 *   - Diabetes → Tirzepatide (Tirz) instead (FDA-approved for type 2 diabetes).
 *   - GHRP (Ipamorelin) is always paired with a GHRH (CJC-1295).
 *   - Max 4–5 peptides per protocol.
 *
 * Runs entirely client-side — deterministic, no network, no API key.
 *
 * EDUCATIONAL / RESEARCH USE ONLY. Not medical advice. Not a substitute for a
 * licensed clinician. Peptides referenced are largely not approved for human use.
 */

import { PEPTIDES, type Peptide } from "./peptides";

export type Goal =
  | "fat_loss"
  | "muscle"
  | "healing"
  | "longevity"
  | "cognitive"
  | "immune"
  | "sexual"
  | "skin_hair";

export type Condition =
  | "diabetes"
  | "hypertension"
  | "cardiovascular"
  | "kidney"
  | "liver"
  | "thyroid"
  | "cancer_history"
  | "pregnant";

export const GOAL_OPTIONS: { value: Goal; label: string; hint: string }[] = [
  { value: "fat_loss", label: "Fat loss", hint: "Lose weight / body fat" },
  { value: "muscle", label: "Muscle & GH", hint: "Build muscle, growth hormone" },
  { value: "healing", label: "Healing & recovery", hint: "Injury, joints, tendons" },
  { value: "longevity", label: "Anti-aging & longevity", hint: "Cellular / mitochondrial" },
  { value: "cognitive", label: "Cognitive & mood", hint: "Focus, memory, anxiety" },
  { value: "immune", label: "Immune support", hint: "Immunity, inflammation" },
  { value: "sexual", label: "Sexual health", hint: "Libido, hormonal" },
  { value: "skin_hair", label: "Skin & hair", hint: "Skin quality, hair growth" },
];

export const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: "diabetes", label: "Diabetes / insulin resistance" },
  { value: "hypertension", label: "High blood pressure" },
  { value: "cardiovascular", label: "Heart / cardiovascular disease" },
  { value: "kidney", label: "Kidney issues" },
  { value: "liver", label: "Liver issues" },
  { value: "thyroid", label: "Thyroid condition" },
  { value: "cancer_history", label: "Cancer / history of cancer" },
  { value: "pregnant", label: "Pregnant or breastfeeding" },
];

export const GOAL_LABELS: Record<Goal, string> = Object.fromEntries(
  GOAL_OPTIONS.map((g) => [g.value, g.label]),
) as Record<Goal, string>;

export interface Intake {
  sex?: "male" | "female" | "other";
  age?: number;
  weightKg: number;
  heightCm: number;
  goals: Goal[];
  conditions: Condition[];
  experience: "beginner" | "advanced";
  hairLoss?: boolean;
}

export interface ProtocolItem {
  name: string;
  why: string;
  dose: string;
  frequency: string;
  route: string;
  timing: string;
  reconstitution: string;
  cycle: string;
  cautions: string[];
}

export interface Protocol {
  blocked: boolean;
  blockedReason?: string;
  bmi: number | null;
  bmiCategory: string;
  summary: string;
  items: ProtocolItem[];
  warnings: string[];
  cycleStructure: string[];
  tips: string[];
}

const MAX_PEPTIDES = 5;
const GH_PAIR = ["CJC-1295 (No DAC)", "Ipamorelin"];
/** GH-axis peptides excluded when there is a cancer history. */
const GH_AXIS = [
  "CJC-1295 (No DAC)",
  "CJC-1295 (DAC)",
  "Ipamorelin",
  "IGF-1 LR3",
  "Tesamorelin",
  "GHRP-2",
  "Sermorelin",
  "HGH",
];

const byName = new Map(PEPTIDES.map((p) => [p.name, p]));

/* ------------------------------- helpers ------------------------------- */

export function bmiValue(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number | null): string {
  if (bmi === null) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obese (class I)";
  if (bmi < 40) return "Obese (class II)";
  return "Obese (class III)";
}

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function reconstitution(p: Peptide): string {
  if (!p.defaultBacMl || p.solvent === "Pre-mixed" || p.solvent === "None (oral)") {
    return p.solvent === "None (oral)"
      ? "Oral — no reconstitution needed."
      : "Pre-mixed — no reconstitution needed.";
  }
  const vial = p.vialSizes[0];
  const bac = p.defaultBacMl;
  const doseBase = p.defaultDoseUnit === "mcg" ? p.defaultDose / 1000 : p.defaultDose;
  const conc = vial / bac;
  const units = round((doseBase / conc) * 100, 1);
  const unit = p.strengthUnit === "iu" ? "IU" : "mg";
  const solvent = p.solvent.includes("Acetic")
    ? "bacteriostatic water + a little acetic acid"
    : "bacteriostatic (BAC) water";
  return `Add ${bac} ml ${solvent} to the ${vial}${unit} vial, then draw ~${units} units (${p.doseText}) per dose on a U-100 insulin syringe.`;
}

function timingHint(p: Peptide): string {
  const f = p.frequency.toLowerCase();
  if (
    f.includes("weekly") &&
    (p.name.includes("Reta") || p.name.includes("Tirz") || p.name.includes("Cagri"))
  ) {
    return "Inject the same day each week; start at the lowest dose and titrate up slowly.";
  }
  const bits: string[] = [];
  if (f.includes("fasted")) bits.push("on an empty stomach");
  if (f.includes("pm")) bits.push("in the evening / before bed");
  else if (f.includes("am")) bits.push("in the morning");
  return bits.length ? `Best taken ${bits.join(", ")}.` : "";
}

/* ------------------------------- goal recipes ------------------------------- */

interface Rec {
  name: string;
  why: string;
  cautions?: string[];
}

function goalRecs(goal: Goal, intake: Intake): Rec[] {
  const advanced = intake.experience === "advanced";
  const diabetic = intake.conditions.includes("diabetes");

  switch (goal) {
    case "fat_loss": {
      const glp1: Rec = diabetic
        ? {
            name: "Tirzepatide (Tirz)",
            why: "Dual GLP-1/GIP agonist, FDA-approved for type 2 diabetes and weight loss — preferred over Reta when blood sugar is a factor.",
            cautions: [
              "Weekly injection only — never daily. Titrate up slowly (start 2.5 mg).",
              "With diabetes: coordinate with your physician; risk of low blood sugar alongside insulin or sulfonylureas.",
            ],
          }
        : {
            name: "Retatrutide (Reta)",
            why: "Triple agonist (GLP-1/GIP/glucagon) — the most potent weight-loss compound in the protocol; strong first-line for fat loss.",
            cautions: [
              "Weekly injection only — never daily. Start 2 mg and increase 1 mg/week only when you plateau.",
            ],
          };
      const recs: Rec[] = [
        glp1,
        {
          name: "AOD-9604",
          why: "Targets fat metabolism (stimulates lipolysis, blocks fat storage) without affecting blood sugar — pairs cleanly with a GLP-1.",
        },
        {
          name: "CJC-1295 (No DAC)",
          why: "GHRH that raises growth hormone to preserve lean muscle and improve body composition while losing fat.",
        },
        {
          name: "Ipamorelin",
          why: "Clean GHRP paired with CJC-1295 for synergistic, cortisol-free growth-hormone release.",
        },
      ];
      if (advanced)
        recs.push({
          name: "5-Amino 1MQ",
          why: "NNMT inhibitor that boosts NAD+ and fat burning at the cellular level; optional advanced add-on.",
        });
      return recs;
    }
    case "muscle": {
      const recs: Rec[] = [
        {
          name: "CJC-1295 (No DAC)",
          why: "GHRH analogue that drives sustained growth-hormone and IGF-1 release for lean mass.",
        },
        {
          name: "Ipamorelin",
          why: "Selective GHRP paired with CJC-1295 — the gold-standard GH stack for muscle and recovery.",
        },
      ];
      if (advanced)
        recs.push({
          name: "IGF-1 LR3",
          why: "Long-acting IGF-1 for muscle cell growth and recovery — advanced users only, run post-workout.",
        });
      return recs;
    }
    case "healing":
      return [
        {
          name: "BPC-157",
          why: "Pentadecapeptide that heals tendons, ligaments, gut and muscle — the backbone of any recovery protocol.",
        },
        {
          name: "TB-500",
          why: "Systemic healing and reduced inflammation; the classic partner to BPC-157.",
        },
        {
          name: "GHK-Cu / AHK-Cu",
          why: "Copper peptide that drives collagen, tissue repair and skin quality alongside the healing stack.",
        },
      ];
    case "longevity":
      return [
        {
          name: "Epitalon",
          why: "Telomerase activator — the most-studied anti-aging peptide; run in short cycles 1–2x/year.",
        },
        {
          name: "SS-31",
          why: "Mitochondria-targeted peptide that cuts oxidative stress and boosts cellular energy.",
        },
        {
          name: "NAD+ (Buffered)",
          why: "Restores NAD+ that declines with age — DNA repair, energy and sirtuin activation.",
        },
        {
          name: "MOTS-C",
          why: "Mitochondrial peptide improving insulin sensitivity and metabolic health.",
        },
      ];
    case "cognitive":
      return [
        {
          name: "Semax",
          why: "Raises BDNF for focus, memory and neuroprotection.",
        },
        {
          name: "Selank",
          why: "Anxiolytic nootropic — pairs with Semax for calm, clear cognition without sedation.",
        },
      ];
    case "immune":
      return [
        {
          name: "Thymosin Alpha-1",
          why: "Modulates immunity and boosts T-cell activity; strong antiviral evidence base.",
        },
        {
          name: "Glutathione",
          why: "Master antioxidant supporting immune function, liver detox and recovery.",
        },
      ];
    case "sexual": {
      const recs: Rec[] = [
        {
          name: "PT-141 (Bremelanotide)",
          why: "Melanocortin agonist for libido in men and women — used as needed before activity.",
        },
      ];
      if (intake.sex === "male")
        recs.push({
          name: "HCG",
          why: "LH mimetic supporting natural testosterone and fertility.",
        });
      return recs;
    }
    case "skin_hair": {
      const recs: Rec[] = [
        {
          name: "GHK-Cu / AHK-Cu",
          why: "Copper peptide that rebuilds collagen and elastin for skin and supports hair follicles.",
        },
      ];
      if (intake.hairLoss)
        recs.push({
          name: "PTD-BDM",
          why: "Targeted hair-growth peptide for hair-loss goals (not for fat loss).",
        });
      return recs;
    }
  }
}

/* ------------------------------- engine ------------------------------- */

export function generateProtocol(intake: Intake): Protocol {
  const bmi = bmiValue(intake.weightKg, intake.heightCm);
  const category = bmiCategory(bmi);
  const warnings: string[] = [];

  // Hard stop — pregnancy / breastfeeding.
  if (intake.conditions.includes("pregnant")) {
    return {
      blocked: true,
      blockedReason:
        "Peptides are not recommended during pregnancy or breastfeeding, and safety data is lacking. This tool won't generate a protocol — please speak with your doctor.",
      bmi,
      bmiCategory: category,
      summary: "",
      items: [],
      warnings: [],
      cycleStructure: [],
      tips: [],
    };
  }

  const excluded = new Set<string>();
  if (intake.conditions.includes("cancer_history")) {
    GH_AXIS.forEach((n) => excluded.add(n));
  }

  const chosen: Rec[] = [];
  const names = new Set<string>();
  let excludedHit = false;

  const add = (rec: Rec) => {
    if (names.has(rec.name) || chosen.length >= MAX_PEPTIDES) return;
    if (excluded.has(rec.name)) {
      excludedHit = true;
      return;
    }
    // Keep the GHRH+GHRP pair atomic.
    if (GH_PAIR.includes(rec.name)) {
      const missing = GH_PAIR.filter((n) => !names.has(n) && !excluded.has(n));
      if (missing.length === 0) return;
      if (chosen.length + missing.length > MAX_PEPTIDES) return;
      for (const n of GH_PAIR) {
        if (names.has(n) || excluded.has(n)) continue;
        names.add(n);
        chosen.push(
          n === rec.name
            ? rec
            : {
                name: n,
                why: "Paired with its partner — a GHRH and GHRP must always be run together for clean, synergistic growth-hormone release.",
              },
        );
      }
      return;
    }
    names.add(rec.name);
    chosen.push(rec);
  };

  for (const goal of intake.goals) {
    for (const rec of goalRecs(goal, intake)) add(rec);
  }

  if (excludedHit) {
    warnings.push(
      "Growth-hormone–stimulating peptides were left out because you noted a cancer history — they can promote cell growth. Discuss any GH peptides with your oncologist first.",
    );
  }

  // Build protocol items from the peptide database.
  const items: ProtocolItem[] = chosen
    .map((rec) => {
      const p = byName.get(rec.name);
      if (!p) return null;
      const cautions = [...(rec.cautions ?? [])];
      if (p.solvent.includes("Acetic"))
        cautions.push("Reconstitute with acetic acid, not plain BAC water.");
      return {
        name: p.name,
        why: rec.why,
        dose: p.doseText,
        frequency: p.frequency,
        route: p.route,
        timing: timingHint(p),
        reconstitution: reconstitution(p),
        cycle: p.cycle,
        cautions,
      } satisfies ProtocolItem;
    })
    .filter((x): x is ProtocolItem => x !== null);

  // Condition-based warnings.
  if (intake.conditions.includes("diabetes")) {
    warnings.push(
      "You noted diabetes: any GLP-1 (Tirzepatide here) must be dosed under physician supervision — combined with insulin or sulfonylureas it can cause low blood sugar. Monitor your glucose closely.",
    );
  }
  if (
    intake.conditions.includes("cardiovascular") ||
    intake.conditions.includes("hypertension")
  ) {
    warnings.push(
      "With heart / blood-pressure concerns, review any stimulatory peptides with your cardiologist and monitor your blood pressure.",
    );
  }
  if (intake.conditions.includes("kidney")) {
    warnings.push("Stay well hydrated and have kidney function monitored during use.");
  }
  if (intake.conditions.includes("liver")) {
    warnings.push("Discuss liver-metabolized compounds with your doctor and monitor liver enzymes.");
  }
  if (intake.conditions.includes("thyroid")) {
    warnings.push("Have thyroid and metabolic markers monitored, especially with GH or GLP-1 peptides.");
  }
  if (bmi !== null && bmi < 18.5 && intake.goals.includes("fat_loss")) {
    warnings.push(
      "Your BMI is in the underweight range — a fat-loss protocol isn't appropriate. Focus on a different goal and consult a clinician.",
    );
  }

  // Executive summary.
  const goalText = intake.goals.map((g) => GOAL_LABELS[g].toLowerCase()).join(", ");
  const bmiText = bmi !== null ? `a BMI of ${round(bmi, 1)} (${category.toLowerCase()})` : "your profile";
  const summary =
    items.length > 0
      ? `Based on ${bmiText} and your goal of ${goalText}, this protocol pairs ${items.length} research peptide${items.length === 1 ? "" : "s"} into a coordinated stack — kept within the 4–5 peptide maximum and paired per the standard stacking rules. Expected changes build over the first 4–12 weeks.`
      : "No peptides could be recommended from the information provided. Try selecting at least one goal.";

  // Cycle structure (generic scaffold personalized by presence of GLP-1 / GH).
  const hasGlp1 = items.some((i) => /Reta|Tirz/.test(i.name));
  const hasGh = items.some((i) => GH_PAIR.includes(i.name));
  const cycleStructure = [
    hasGlp1
      ? "Weeks 1–4: Start every GLP-1 at its lowest dose. Expect appetite suppression; manage nausea with smaller meals and electrolytes."
      : "Weeks 1–4: Ease in at the low end of each dose range and assess tolerance.",
    hasGh
      ? "Weeks 5–8: Hold or step GLP-1 up only if you plateau. Run CJC-1295 + Ipamorelin 2–3x daily fasted; best results on an empty stomach and before bed."
      : "Weeks 5–8: Continue at your working dose; adjust one variable at a time.",
    "Weeks 9–12: Reassess progress and bloodwork. Most stacks run 8–12 weeks on.",
    "Post-cycle: Take the built-in time off (e.g. 8 weeks off for GH peptides) before repeating. Re-evaluate goals each cycle.",
  ];

  // Tips.
  const tips: string[] = [];
  if (hasGlp1)
    tips.push("On GLP-1s, prioritise protein and hydration, and supplement electrolytes to blunt nausea and preserve muscle.");
  if (intake.goals.includes("fat_loss") || intake.goals.includes("muscle"))
    tips.push("Pair the protocol with resistance training 3–4x/week to keep lean mass while the peptides do their work.");
  if (hasGh) tips.push("GH peptides work best injected fasted and before bed, when natural GH release peaks.");
  tips.push("Store reconstituted vials refrigerated and use within ~30–60 days; rotate injection sites.");
  if (intake.age && intake.age >= 45)
    tips.push("At your age, recovery and sleep quality compound results — keep a consistent sleep schedule through the cycle.");

  return {
    blocked: false,
    bmi,
    bmiCategory: category,
    summary,
    items,
    warnings,
    cycleStructure,
    tips: tips.slice(0, 4),
  };
}
