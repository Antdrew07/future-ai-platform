import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Beaker,
  Calculator as CalculatorIcon,
  Droplets,
  FlaskConical,
  Info,
  Layers,
  Search,
  Syringe,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  PEPTIDES,
  RECON_NOTES,
  RULES,
  STACKS,
  type DoseUnit,
  type Peptide,
} from "@/lib/peptides";

/**
 * Display name for the app. Placeholder until a final brand is chosen —
 * change this one constant to rebrand the calculator header.
 */
const APP_NAME = "Peptide Calculator";

/* ------------------------------------------------------------------ */
/*  Calculation helpers                                                */
/* ------------------------------------------------------------------ */

interface CalcResult {
  concentration: number; // strength unit per ml
  perUnit: number; // strength unit per single insulin unit
  volumeMl: number; // ml to draw per dose
  units: number; // insulin units to draw per dose
  dosesPerVial: number;
  valid: boolean;
}

/** Convert a dose expressed in `unit` into the peptide's base strength unit. */
function doseToBase(value: number, unit: DoseUnit): number {
  if (unit === "mcg") return value / 1000; // mcg -> mg
  return value; // mg or iu -> base
}

function calculate(
  vialSize: number,
  bacMl: number,
  dose: number,
  doseUnit: DoseUnit,
): CalcResult {
  const doseBase = doseToBase(dose, doseUnit);
  const valid =
    vialSize > 0 && bacMl > 0 && doseBase > 0 && Number.isFinite(doseBase);

  const concentration = valid ? vialSize / bacMl : 0; // per ml
  const perUnit = concentration / 100; // per insulin unit (1ml = 100u)
  const volumeMl = valid ? doseBase / concentration : 0;
  const units = volumeMl * 100;
  const dosesPerVial = valid ? vialSize / doseBase : 0;

  return { concentration, perUnit, volumeMl, units, dosesPerVial, valid };
}

/** Format a strength value nicely (mcg when small, mg otherwise). */
function fmtStrength(mg: number, unit: "mg" | "iu"): string {
  if (unit === "iu") return `${round(mg, 1)} IU`;
  if (mg < 1) return `${round(mg * 1000, 1)} mcg`;
  return `${round(mg, 3)} mg`;
}

function round(n: number, dp = 2): number {
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/* ------------------------------------------------------------------ */
/*  Syringe visual                                                     */
/* ------------------------------------------------------------------ */

function SyringeVisual({ units }: { units: number }) {
  const capped = Math.min(units, 100);
  const pct = Math.max(0, Math.min(100, capped));
  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="w-full">
      <div className="relative h-16 w-full">
        {/* barrel */}
        <div className="absolute inset-y-3 left-0 right-6 rounded-md border-2 border-border bg-muted/40 overflow-hidden">
          {/* fill */}
          <div
            className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
          {/* ticks */}
          <div className="absolute inset-0 flex justify-between px-[1px]">
            {ticks.map((t) => (
              <div
                key={t}
                className="relative flex-1 border-r border-border/40 last:border-r-0"
              >
                <span className="absolute -top-[2px] left-0 h-2 w-px bg-border/60" />
              </div>
            ))}
          </div>
        </div>
        {/* plunger / needle */}
        <div className="absolute right-0 inset-y-6 w-6 rounded-r-md bg-border" />
        <div className="absolute -right-3 inset-y-[30px] w-3 bg-border" />
      </div>
      {/* scale labels */}
      <div className="mt-1 flex justify-between pr-6 text-[10px] text-muted-foreground">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Draw to <span className="font-semibold text-foreground">{round(units, 1)}</span>{" "}
        units on a U-100 (1&nbsp;ml) insulin syringe
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calculator tab                                                     */
/* ------------------------------------------------------------------ */

function CalculatorTab() {
  const [selectedName, setSelectedName] = useState<string>(PEPTIDES[0].name);
  const selected = useMemo(
    () => PEPTIDES.find((p) => p.name === selectedName) ?? PEPTIDES[0],
    [selectedName],
  );

  const [vialSize, setVialSize] = useState<string>(String(selected.vialSizes[0]));
  const [bacMl, setBacMl] = useState<string>(String(selected.defaultBacMl || 2));
  const [dose, setDose] = useState<string>(String(selected.defaultDose));
  const [doseUnit, setDoseUnit] = useState<DoseUnit>(selected.defaultDoseUnit);

  function applyPeptide(name: string) {
    const p = PEPTIDES.find((x) => x.name === name);
    if (!p) return;
    setSelectedName(name);
    setVialSize(String(p.vialSizes[0]));
    setBacMl(String(p.defaultBacMl || 2));
    setDose(String(p.defaultDose));
    setDoseUnit(p.defaultDoseUnit);
  }

  const isIu = selected.strengthUnit === "iu";
  const strengthLabel = isIu ? "IU" : "mg";

  const result = useMemo(
    () =>
      calculate(
        parseFloat(vialSize),
        parseFloat(bacMl),
        parseFloat(dose),
        isIu ? "iu" : doseUnit,
      ),
    [vialSize, bacMl, dose, doseUnit, isIu],
  );

  const doseUnitOptions: DoseUnit[] = isIu ? ["iu"] : ["mcg", "mg"];
  const overOneMl = result.units > 100;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Beaker className="h-5 w-5 text-primary" />
            Reconstitution inputs
          </CardTitle>
          <CardDescription>
            Pick a peptide to auto-fill the document's guidance, then adjust to
            your vial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Peptide</Label>
            <Select value={selectedName} onValueChange={applyPeptide}>
              <SelectTrigger>
                <SelectValue placeholder="Select a peptide" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {CATEGORIES.map((cat) => {
                  const inCat = PEPTIDES.filter((p) => p.category === cat);
                  if (!inCat.length) return null;
                  return (
                    <SelectGroup key={cat}>
                      <SelectLabel>{cat}</SelectLabel>
                      {inCat.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vial">Vial size ({strengthLabel})</Label>
            <div className="flex flex-wrap gap-1.5">
              {selected.vialSizes.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVialSize(String(v))}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    parseFloat(vialSize) === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {v}
                  {strengthLabel}
                </button>
              ))}
            </div>
            <Input
              id="vial"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={vialSize}
              onChange={(e) => setVialSize(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bac">BAC / solvent water (ml)</Label>
            <div className="flex flex-wrap gap-1.5">
              {[1, 1.5, 2, 2.5, 3].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBacMl(String(v))}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    parseFloat(bacMl) === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {v}ml
                </button>
              ))}
            </div>
            <Input
              id="bac"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={bacMl}
              onChange={(e) => setBacMl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dose">Desired dose</Label>
            <div className="flex gap-2">
              <Input
                id="dose"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="flex-1"
              />
              <Select
                value={doseUnit}
                onValueChange={(v) => setDoseUnit(v as DoseUnit)}
                disabled={isIu}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {doseUnitOptions.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u === "iu" ? "IU" : u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Document guidance: {selected.doseText}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Syringe className="h-5 w-5 text-primary" />
              Draw {selected.name}
            </CardTitle>
            <CardDescription>
              {selected.frequency} · {selected.route} · {selected.cycle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.valid ? (
              <>
                <div className="rounded-xl border bg-primary/5 p-5 text-center">
                  <p className="text-sm text-muted-foreground">Draw per dose</p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-primary">
                    {round(result.units, 1)}
                    <span className="ml-1 text-lg font-medium text-muted-foreground">
                      units
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    = {round(result.volumeMl, 3)} ml
                  </p>
                </div>

                <SyringeVisual units={result.units} />

                {overOneMl && (
                  <Alert variant="destructive">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertTitle>Over one syringe</AlertTitle>
                    <AlertDescription>
                      This dose needs more than 100 units (1&nbsp;ml). Use more
                      BAC water to lower the concentration, or split into
                      multiple draws.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Stat
                    label="Concentration"
                    value={`${round(result.concentration, 3)} ${strengthLabel}/ml`}
                  />
                  <Stat
                    label="Per insulin unit"
                    value={fmtStrength(result.perUnit, selected.strengthUnit)}
                  />
                  <Stat
                    label="Doses per vial"
                    value={`~${round(result.dosesPerVial, 1)}`}
                  />
                </div>
              </>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Enter a vial size, solvent volume and dose to see the draw.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {(selected.notes || selected.solvent !== "BAC water") && (
          <Alert>
            <Droplets className="h-4 w-4" />
            <AlertTitle>
              Reconstitute with: {selected.solvent}
            </AlertTitle>
            {selected.notes && (
              <AlertDescription>{selected.notes}</AlertDescription>
            )}
          </Alert>
        )}

        {selected.stacksWith && selected.stacksWith.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Commonly stacked with:</span>
            {selected.stacksWith.map((s) => {
              const exists = PEPTIDES.some((p) => p.name === s);
              return exists ? (
                <button
                  key={s}
                  onClick={() => applyPeptide(s)}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/70"
                >
                  {s}
                </button>
              ) : (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Library tab                                                        */
/* ------------------------------------------------------------------ */

function LibraryTab() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PEPTIDES.filter((p) => {
      const matchCat = category === "all" || p.category === category;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.purpose.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search peptides or purposes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} peptide{filtered.length === 1 ? "" : "s"}
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-40">Peptide</TableHead>
              <TableHead>Vial</TableHead>
              <TableHead>Dose</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead className="min-w-48">Purpose</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.name}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {p.name}
                    {p.blend && (
                      <Badge variant="outline" className="text-[10px]">
                        blend
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {p.vialSizes.join(" / ")}
                  {p.strengthUnit === "iu" ? " IU" : " mg"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.doseText}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {p.frequency}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {p.route}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {p.cycle}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.purpose}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No peptides match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stacks tab                                                         */
/* ------------------------------------------------------------------ */

function StacksTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {STACKS.map((s, i) => (
          <Card key={`${s.name}-${i}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{s.name}</CardTitle>
                {s.level && <Badge variant="secondary">{s.level}</Badge>}
              </div>
              <CardDescription>{s.goal}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {s.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-primary" />
            Stacking &amp; safety rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {RULES.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Guide tab                                                          */
/* ------------------------------------------------------------------ */

function GuideTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4 text-primary" />
            How reconstitution works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {RECON_NOTES.map((n) => (
              <li key={n} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4 text-primary" />
            BAC water vs. acetic acid
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Bacteriostatic (BAC) water</p>
            <p>
              Used for most peptides. Preserves reconstituted product for
              ~30–60 days refrigerated.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-medium text-foreground">Acetic acid (0.6%)</p>
            <p>
              For peptides that gel or precipitate in BAC water — IGF-1 LR3,
              AOD-9604, Follistatin 344 and Kisspeptin. Do NOT use for most
              peptides.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-medium text-foreground">Special cases</p>
            <ul className="mt-1 space-y-1">
              <li>• AOD-9604: 1.6ml BAC + 0.4ml acetic acid</li>
              <li>• IGF-1 LR3: 1.5ml BAC + 0.5ml acetic acid</li>
              <li>• SLU-PP-332: may need DMSO / saline</li>
              <li>• HCG: 5000iu vial + 1ml BAC → 10u = 500 IU</li>
              <li>• L-Carnitine: pre-mixed, no reconstitution</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Calculator() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalculatorIcon className="h-4 w-4" />
            </div>
            <span className="font-semibold">{APP_NAME}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Peptide Reconstitution Calculator
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Work out exactly how many insulin-syringe units to draw for any dose,
            with vial sizes, solvent volumes and dosing pulled from the
            protocol cheat sheet.
          </p>
        </div>

        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
            <TabsTrigger value="calculator" className="gap-1.5">
              <Syringe className="h-4 w-4" />
              <span className="hidden sm:inline">Calculator</span>
              <span className="sm:hidden">Calc</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-1.5">
              <Search className="h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="stacks" className="gap-1.5">
              <Layers className="h-4 w-4" />
              Stacks
            </TabsTrigger>
            <TabsTrigger value="guide" className="gap-1.5">
              <Info className="h-4 w-4" />
              Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <CalculatorTab />
          </TabsContent>
          <TabsContent value="library">
            <LibraryTab />
          </TabsContent>
          <TabsContent value="stacks">
            <StacksTab />
          </TabsContent>
          <TabsContent value="guide">
            <GuideTab />
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <Alert className="mt-10 border-amber-500/40 bg-amber-500/5">
          <TriangleAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700 dark:text-amber-500">
            For research use only
          </AlertTitle>
          <AlertDescription>
            This tool reproduces reference figures from the source protocol
            document for informational and research purposes only. It is not medical
            advice and nothing here is intended for human consumption. Always
            consult a qualified healthcare professional.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}
