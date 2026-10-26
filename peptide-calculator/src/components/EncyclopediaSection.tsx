import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChevronDown,
  Clock,
  ExternalLink,
  FlaskConical,
  Layers,
  Loader2,
  Microscope,
  Search,
  ShieldAlert,
  Syringe,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ENCYCLOPEDIA,
  ENCYCLOPEDIA_CATEGORIES,
  type EncyclopediaEntry,
} from "@/lib/encyclopedia";
import {
  clinicalTrialsSearchUrl,
  EVIDENCE_META,
  evidenceLevelFor,
  fetchClinicalTrials,
  fetchPubMed,
  pubmedSearchUrl,
  searchTermFor,
  type CtResult,
  type EvidenceLevel,
  type PubmedResult,
} from "@/lib/evidence";

/* ------------------------------- Live evidence ------------------------------- */

type LoadState = "loading" | "done" | "error";

function LiveEvidence({ name }: { name: string }) {
  const term = searchTermFor(name);
  const [ct, setCt] = useState<CtResult | null>(null);
  const [ctState, setCtState] = useState<LoadState>("loading");
  const [pm, setPm] = useState<PubmedResult | null>(null);
  const [pmState, setPmState] = useState<LoadState>("loading");
  const started = useRef(false);

  useEffect(() => {
    if (term === null || started.current) return;
    started.current = true;
    const ctrl = new AbortController();

    fetchClinicalTrials(term, ctrl.signal)
      .then((r) => {
        setCt(r);
        setCtState("done");
      })
      .catch(() => setCtState("error"));

    fetchPubMed(term, ctrl.signal)
      .then((r) => {
        setPm(r);
        setPmState("done");
      })
      .catch(() => setPmState("error"));

    return () => ctrl.abort();
  }, [term]);

  if (term === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Proprietary blend — search the component peptides individually for clinical
        evidence.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Clinical trials */}
      <div className="rounded-lg border bg-background p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Microscope className="h-3.5 w-3.5" />
            Clinical trials
          </p>
          {ctState === "done" && ct && (
            <Badge variant="secondary" className="text-[10px]">
              {ct.total} on record
            </Badge>
          )}
        </div>

        {ctState === "loading" && <Loading />}
        {ctState === "done" && ct && ct.studies.length > 0 && (
          <ul className="space-y-2">
            {ct.studies.slice(0, 3).map((s) => (
              <li key={s.nctId} className="text-sm">
                <a
                  href={`https://clinicaltrials.gov/study/${s.nctId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {s.title || s.nctId}
                </a>
                <span className="mt-0.5 block text-xs capitalize text-muted-foreground">
                  {s.phase !== "N/A" ? `${s.phase} · ` : ""}
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        {ctState === "done" && ct && ct.studies.length === 0 && (
          <p className="text-sm text-muted-foreground">No registered trials found.</p>
        )}
        {ctState === "error" && (
          <p className="text-sm text-muted-foreground">
            Couldn't load live results.
          </p>
        )}

        <a
          href={clinicalTrialsSearchUrl(term)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View on ClinicalTrials.gov
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Published research */}
      <div className="rounded-lg border bg-background p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5" />
            Published research
          </p>
          {pmState === "done" && pm && (
            <Badge variant="secondary" className="text-[10px]">
              {pm.total.toLocaleString()} papers
            </Badge>
          )}
        </div>

        {pmState === "loading" && <Loading />}
        {pmState === "done" && pm && pm.articles.length > 0 && (
          <ul className="space-y-2">
            {pm.articles.slice(0, 3).map((a) => (
              <li key={a.pmid} className="text-sm">
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {a.title}
                </a>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {[a.journal, a.year].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
        {pmState === "done" && pm && pm.articles.length === 0 && (
          <p className="text-sm text-muted-foreground">No papers found.</p>
        )}
        {pmState === "error" && (
          <p className="text-sm text-muted-foreground">
            Couldn't load live results.
          </p>
        )}

        <a
          href={pubmedSearchUrl(term)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Search PubMed
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Loading…
    </div>
  );
}

/* ------------------------------- Entry card ------------------------------- */

function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  const meta = EVIDENCE_META[level];
  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
        meta.className,
      )}
    >
      {meta.short}
    </span>
  );
}

function EntryCard({ entry }: { entry: EncyclopediaEntry }) {
  const [open, setOpen] = useState(false);
  const level = evidenceLevelFor(entry.name);

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{entry.name}</span>
            <EvidenceBadge level={level} />
            <Badge variant="secondary" className="text-[10px]">
              {entry.category}
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-primary">{entry.purpose}</p>
          {!open && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {entry.description}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          <p className="text-sm text-muted-foreground">{entry.description}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <Fact icon={<Syringe className="h-4 w-4" />} label="Dosage" value={entry.dosage} />
            <Fact icon={<Clock className="h-4 w-4" />} label="Half-life" value={entry.halfLife} />
            <Fact
              icon={<Activity className="h-4 w-4" />}
              label="Administration"
              value={entry.administration}
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Benefits
            </p>
            <ul className="space-y-1">
              {entry.benefits.map((b) => (
                <li key={b} className="flex gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-500">
              <ShieldAlert className="h-3.5 w-3.5" />
              Safety &amp; side effects
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{entry.sideEffects}</p>
          </div>

          {entry.researchNotes && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FlaskConical className="h-3.5 w-3.5" />
                Research notes
              </p>
              <p className="text-sm text-muted-foreground">{entry.researchNotes}</p>
            </div>
          )}

          {/* Live clinical evidence */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Microscope className="h-3.5 w-3.5" />
              Clinical evidence
              <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-muted-foreground">
                live
              </span>
            </p>
            <LiveEvidence name={entry.name} />
          </div>

          {entry.stacksWith.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Stacks well with
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.stacksWith.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

/* ------------------------------- Section ------------------------------- */

const EVIDENCE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All evidence levels" },
  { value: "fda", label: "FDA-approved" },
  { value: "intl", label: "Approved abroad" },
  { value: "trials", label: "In clinical trials" },
  { value: "preclinical", label: "Preclinical" },
  { value: "research", label: "Research only" },
];

export default function EncyclopediaSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [evidence, setEvidence] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENCYCLOPEDIA.filter((e) => {
      const matchCat = category === "all" || e.category === category;
      const matchEv = evidence === "all" || evidenceLevelFor(e.name) === evidence;
      const matchQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.purpose.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q);
      return matchCat && matchEv && matchQ;
    });
  }, [query, category, evidence]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search peptides, purposes or descriptions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="lg:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {ENCYCLOPEDIA_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={evidence} onValueChange={setEvidence}>
          <SelectTrigger className="lg:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVIDENCE_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} · trial &amp;
        research data from ClinicalTrials.gov and PubMed
      </p>

      <div className="space-y-3">
        {filtered.map((e) => (
          <EntryCard key={e.name} entry={e} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-lg border py-10 text-center text-muted-foreground">
            No peptides match your search.
          </div>
        )}
      </div>
    </div>
  );
}
