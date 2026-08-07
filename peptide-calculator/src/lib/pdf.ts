/**
 * Client-side PDF export for a generated protocol (jsPDF, no backend).
 */
import { jsPDF } from "jspdf";

import {
  CONDITION_OPTIONS,
  GOAL_LABELS,
  type Condition,
  type Intake,
  type Protocol,
} from "./protocol";

const MARGIN = 42;
const PAGE_W = 595.28; // A4 portrait, pt
const PAGE_H = 841.89;
const MAX_W = PAGE_W - MARGIN * 2;

const VIOLET: [number, number, number] = [124, 58, 237];
const INK: [number, number, number] = [24, 24, 30];
const MUTE: [number, number, number] = [110, 110, 120];
const AMBER: [number, number, number] = [180, 120, 20];

const condLabel = (c: Condition) =>
  CONDITION_OPTIONS.find((o) => o.value === c)?.label ?? c;

function heightToImperial(cm: number): string {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return `${ft}'${inch}"`;
}

export function buildProtocolPdf(protocol: Protocol, intake: Intake): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  const ensure = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const text = (
    str: string,
    opts: {
      size?: number;
      color?: [number, number, number];
      bold?: boolean;
      gap?: number;
      indent?: number;
    } = {},
  ) => {
    const size = opts.size ?? 10;
    const color = opts.color ?? INK;
    const indent = opts.indent ?? 0;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(str, MAX_W - indent) as string[];
    const lh = size * 1.4;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, MARGIN + indent, y);
      y += lh;
    }
    if (opts.gap) y += opts.gap;
  };

  const rule = (gap = 8) => {
    ensure(gap);
    doc.setDrawColor(225, 225, 230);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += gap;
  };

  const labelValue = (label: string, value: string) => {
    const size = 10;
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    const labelW = doc.getTextWidth(`${label}: `);
    ensure(size * 1.4);
    doc.text(`${label}: `, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTE);
    const lines = doc.splitTextToSize(value, MAX_W - labelW) as string[];
    doc.text(lines[0] ?? "", MARGIN + labelW, y);
    y += size * 1.4;
    for (let i = 1; i < lines.length; i++) {
      ensure(size * 1.4);
      doc.text(lines[i], MARGIN + labelW, y);
      y += size * 1.4;
    }
  };

  // ── Header ──
  text("Custom Peptide Protocol", { size: 20, bold: true, color: VIOLET });
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  text(`Generated ${date}  ·  Educational / research use only`, {
    size: 9,
    color: MUTE,
    gap: 6,
  });
  rule(10);

  // ── Profile ──
  text("Your profile", { size: 12, bold: true, gap: 4 });
  if (intake.sex) labelValue("Sex", intake.sex);
  if (intake.age) labelValue("Age", String(intake.age));
  labelValue(
    "Weight",
    `${Math.round(intake.weightKg)} kg (${Math.round(intake.weightKg * 2.20462)} lb)`,
  );
  labelValue(
    "Height",
    `${Math.round(intake.heightCm)} cm (${heightToImperial(intake.heightCm)})`,
  );
  if (protocol.bmi !== null)
    labelValue("BMI", `${protocol.bmi.toFixed(1)} — ${protocol.bmiCategory}`);
  labelValue("Goals", intake.goals.map((g) => GOAL_LABELS[g]).join(", "));
  labelValue(
    "Health conditions",
    intake.conditions.length ? intake.conditions.map(condLabel).join(", ") : "None reported",
  );
  labelValue("Experience", intake.experience);
  y += 6;

  if (protocol.blocked) {
    rule(10);
    text("Protocol not generated", { size: 12, bold: true, color: AMBER, gap: 4 });
    text(protocol.blockedReason ?? "", { size: 10, color: INK, gap: 6 });
    disclaimer(doc, y, ensure, text, rule);
    return doc;
  }

  rule(10);

  // ── Safety ──
  if (protocol.warnings.length) {
    text("Safety flags", { size: 12, bold: true, color: AMBER, gap: 4 });
    for (const w of protocol.warnings) text(`•  ${w}`, { size: 10, gap: 2 });
    y += 4;
    rule(10);
  }

  // ── Summary ──
  text("Executive summary", { size: 12, bold: true, gap: 4 });
  text(protocol.summary, { size: 10, color: INK, gap: 6 });
  rule(10);

  // ── Stack ──
  text("Your recommended stack", { size: 12, bold: true, gap: 6 });
  protocol.items.forEach((item, i) => {
    ensure(70);
    text(`${i + 1}.  ${item.name}`, { size: 13, bold: true, color: VIOLET, gap: 2 });
    labelValue("Dose", item.dose);
    labelValue("Frequency", item.frequency);
    labelValue("Route", item.route);
    if (item.timing) labelValue("Timing", item.timing);
    labelValue("How to mix", item.reconstitution);
    labelValue("Cycle", item.cycle);
    labelValue("Why", item.why);
    if (item.cautions.length)
      labelValue("Cautions", item.cautions.join("  "));
    y += 8;
  });

  rule(10);

  // ── Cycle structure ──
  text("Cycle structure", { size: 12, bold: true, gap: 4 });
  for (const line of protocol.cycleStructure) text(`•  ${line}`, { size: 10, gap: 2 });
  y += 4;
  rule(10);

  // ── Tips ──
  text("Optimization tips", { size: 12, bold: true, gap: 4 });
  for (const tip of protocol.tips) text(`•  ${tip}`, { size: 10, gap: 2 });
  y += 6;
  rule(10);

  disclaimer(doc, y, ensure, text, rule);
  return doc;
}

function disclaimer(
  _doc: jsPDF,
  _y: number,
  _ensure: (n: number) => void,
  text: (s: string, o?: any) => void,
  _rule: (g?: number) => void,
) {
  text(
    "Research / educational use only. This protocol is generated from a fixed rule set and is not medical advice, a diagnosis, or a prescription. The peptides referenced are largely not approved for human use. Consult a licensed healthcare professional before starting anything.",
    { size: 8, color: MUTE },
  );
}
