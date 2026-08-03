import { useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  Clock,
  FlaskConical,
  Layers,
  Search,
  Syringe,
  TriangleAlert,
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

function EntryCard({ entry }: { entry: EncyclopediaEntry }) {
  const [open, setOpen] = useState(false);

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
              <TriangleAlert className="h-3.5 w-3.5" />
              Side effects
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

export default function EncyclopediaSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENCYCLOPEDIA.filter((e) => {
      const matchCat = category === "all" || e.category === category;
      const matchQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.purpose.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
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
          <SelectTrigger className="sm:w-64">
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
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
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
