import { useState } from "react";
import {
  Beaker,
  ChevronRight,
  Clock,
  Download,
  HeartPulse,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Syringe,
  Target,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  bmiCategory,
  bmiValue,
  CONDITION_OPTIONS,
  generateProtocol,
  GOAL_OPTIONS,
  type Condition,
  type Goal,
  type Intake,
  type Protocol,
} from "@/lib/protocol";
import { buildProtocolPdf } from "@/lib/pdf";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

export default function ProtocolBuilder() {
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("lb");
  const [heightMode, setHeightMode] = useState<"ftin" | "cm">("ftin");
  const [cm, setCm] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [goals, setGoals] = useState<Set<Goal>>(new Set());
  const [conditions, setConditions] = useState<Set<Condition>>(new Set());
  const [experience, setExperience] = useState<"beginner" | "advanced">("beginner");
  const [hairLoss, setHairLoss] = useState(false);

  const [result, setResult] = useState<{ plan: Protocol; intake: Intake } | null>(null);
  const [error, setError] = useState("");

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function normalizedWeightKg(): number {
    const w = parseFloat(weight);
    if (!w) return 0;
    return weightUnit === "kg" ? w : w / 2.20462;
  }
  function normalizedHeightCm(): number {
    if (heightMode === "cm") return parseFloat(cm) || 0;
    const ft = parseFloat(feet) || 0;
    const inch = parseFloat(inches) || 0;
    return (ft * 12 + inch) * 2.54;
  }

  const liveBmi = bmiValue(normalizedWeightKg(), normalizedHeightCm());

  function generate() {
    const weightKg = normalizedWeightKg();
    const heightCm = normalizedHeightCm();
    if (!weightKg) return setError("Please enter your weight.");
    if (!heightCm) return setError("Please enter your height.");
    if (goals.size === 0) return setError("Please pick at least one goal.");
    setError("");
    const intake: Intake = {
      sex: sex || undefined,
      age: age ? parseInt(age) : undefined,
      weightKg,
      heightCm,
      goals: [...goals],
      conditions: [...conditions],
      experience,
      hairLoss,
    };
    setResult({ plan: generateProtocol(intake), intake });
    setTimeout(
      () => document.getElementById("protocol-result")?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  function reset() {
    setResult(null);
    setError("");
  }

  function downloadPdf() {
    if (!result) return;
    buildProtocolPdf(result.plan, result.intake).save("peptide-protocol.pdf");
  }

  const showHairLoss = goals.has("skin_hair");

  return (
    <div className="space-y-6">
      {/* Intro */}
      <Alert>
        <Stethoscope className="h-4 w-4" />
        <AlertTitle>Build your personalized protocol</AlertTitle>
        <AlertDescription>
          Answer a few questions and the builder maps your goals and health profile
          to a coordinated peptide stack — with dosing, mixing, timing and cycling —
          that you can download as a PDF. Educational only; not medical advice.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Your details
          </CardTitle>
          <CardDescription>The more you share, the safer the recommendation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basics */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sex</Label>
              <div className="flex gap-2">
                {(["male", "female", "other"] as const).map((s) => (
                  <Chip key={s} active={sex === s} onClick={() => setSex(s)}>
                    <span className="capitalize">{s}</span>
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 38"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  placeholder={weightUnit === "lb" ? "e.g. 190" : "e.g. 86"}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1"
                />
                <div className="flex overflow-hidden rounded-md border">
                  {(["lb", "kg"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setWeightUnit(u)}
                      className={cn(
                        "px-3 text-sm font-medium transition-colors",
                        weightUnit === u
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Height</Label>
                <button
                  type="button"
                  onClick={() => setHeightMode(heightMode === "ftin" ? "cm" : "ftin")}
                  className="text-xs text-primary hover:underline"
                >
                  {heightMode === "ftin" ? "Use cm" : "Use ft/in"}
                </button>
              </div>
              {heightMode === "ftin" ? (
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="5"
                      value={feet}
                      onChange={(e) => setFeet(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">ft</span>
                  </div>
                  <div className="flex flex-1 items-center gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="10"
                      value={inches}
                      onChange={(e) => setInches(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">in</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="178"
                    value={cm}
                    onChange={(e) => setCm(e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">cm</span>
                </div>
              )}
            </div>
          </div>

          {liveBmi !== null && (
            <p className="text-sm text-muted-foreground">
              BMI: <span className="font-semibold text-foreground">{liveBmi.toFixed(1)}</span> ·{" "}
              {bmiCategory(liveBmi)}
            </p>
          )}

          <Separator />

          {/* Goals */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              What are your goals? <span className="text-muted-foreground">(pick one or more)</span>
            </Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {GOAL_OPTIONS.map((g) => (
                <Chip
                  key={g.value}
                  active={goals.has(g.value)}
                  onClick={() => setGoals((s) => toggle(s, g.value))}
                >
                  <span className="block">{g.label}</span>
                  <span className="block text-xs font-normal opacity-70">{g.hint}</span>
                </Chip>
              ))}
            </div>
          </div>

          {showHairLoss && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hairLoss}
                onChange={(e) => setHairLoss(e.target.checked)}
                className="h-4 w-4 accent-[oklch(0.55_0.27_285)]"
              />
              I'm specifically targeting hair loss
            </label>
          )}

          {/* Conditions */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <HeartPulse className="h-4 w-4 text-primary" />
              Any health conditions?{" "}
              <span className="text-muted-foreground">(select any that apply)</span>
            </Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CONDITION_OPTIONS.map((c) => (
                <Chip
                  key={c.value}
                  active={conditions.has(c.value)}
                  onClick={() => setConditions((s) => toggle(s, c.value))}
                >
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label>Experience with peptides</Label>
            <div className="flex gap-2">
              {(["beginner", "advanced"] as const).map((x) => (
                <Chip key={x} active={experience === x} onClick={() => setExperience(x)}>
                  <span className="capitalize">{x}</span>
                </Chip>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={generate} size="lg" className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Generate my protocol
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <div id="protocol-result" className="space-y-6 scroll-mt-4">
          <ProtocolResult plan={result.plan} onDownload={downloadPdf} onReset={reset} />
        </div>
      )}
    </div>
  );
}

function ProtocolResult({
  plan,
  onDownload,
  onReset,
}: {
  plan: Protocol;
  onDownload: () => void;
  onReset: () => void;
}) {
  if (plan.blocked) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Protocol not generated</AlertTitle>
        <AlertDescription>
          {plan.blockedReason}
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Your custom protocol</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Start over
          </Button>
          <Button size="sm" onClick={onDownload} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Safety */}
      {plan.warnings.map((w, i) => (
        <Alert key={i} className="border-amber-500/40 bg-amber-500/5">
          <TriangleAlert className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">{w}</AlertDescription>
        </Alert>
      ))}

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Executive summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{plan.summary}</p>
        </CardContent>
      </Card>

      {/* Stack */}
      <div className="space-y-4">
        {plan.items.map((item, i) => (
          <Card key={item.name}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {item.name}
              </CardTitle>
              <CardDescription>{item.why}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row icon={<Syringe className="h-4 w-4" />} label="Dose" value={item.dose} />
              <Row icon={<Clock className="h-4 w-4" />} label="Frequency" value={item.frequency} />
              <Row icon={<ChevronRight className="h-4 w-4" />} label="Route" value={item.route} />
              {item.timing && (
                <Row icon={<Clock className="h-4 w-4" />} label="Timing" value={item.timing} />
              )}
              <Row
                icon={<Beaker className="h-4 w-4" />}
                label="How to mix"
                value={item.reconstitution}
              />
              <Row icon={<RotateCcw className="h-4 w-4" />} label="Cycle" value={item.cycle} />
              {item.cautions.length > 0 && (
                <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                  {item.cautions.map((c) => (
                    <p
                      key={c}
                      className="flex gap-1.5 text-xs text-amber-800 dark:text-amber-300"
                    >
                      <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                      {c}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cycle structure */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cycle structure</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {plan.cycleStructure.map((c) => (
              <li key={c} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{c}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Optimization tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {plan.tips.map((t) => (
              <li key={t} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={onDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download protocol as PDF
        </Button>
      </div>

      <Alert className="border-amber-500/40 bg-amber-500/5">
        <TriangleAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-700 dark:text-amber-500">Not medical advice</AlertTitle>
        <AlertDescription>
          This protocol is generated from a fixed rule set for educational and research
          purposes only. It is not a diagnosis or prescription, and the peptides referenced
          are largely not approved for human use. Consult a licensed healthcare professional
          before starting anything.
        </AlertDescription>
      </Alert>
    </>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="w-24 shrink-0 font-medium">{label}</span>
      <span className="flex-1 text-muted-foreground">{value}</span>
    </div>
  );
}
