import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PARTNERS, HOUSE_BRAND, type Partner } from "@/data/partners";
import Logo from "./Logo";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const copy = useCallback((code: string) => {
    const done = () => {
      setCopied(code);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), 1600);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(done).catch(done);
    } else {
      const t = document.createElement("textarea");
      t.value = code;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(t);
      done();
    }
  }, []);
  return { copied, copy };
}

function CodePill({
  code,
  onCopy,
  copied,
}: {
  code: string;
  onCopy: (c: string) => void;
  copied: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(code)}
      className="flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-ink/20 bg-panel-2 px-3 py-2.5 text-left transition hover:border-gold hover:bg-gold/10"
      aria-label={`Copy code ${code}`}
    >
      <span className="font-semibold tracking-wide text-ink">{code}</span>
      <span className="text-[11px] text-muted">{copied ? "copied ✓" : "tap to copy"}</span>
    </button>
  );
}

function PartnerCard({
  p,
  copied,
  onCopy,
}: {
  p: Partner;
  copied: string | null;
  onCopy: (c: string) => void;
}) {
  const to = `/vendor/${p.slug}`;

  if (p.comingSoon) {
    return (
      <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-card opacity-80">
        <div className="relative grid aspect-[4/5] place-items-center bg-gradient-to-br from-bg-2 to-panel">
          <Logo name={p.name} website={p.websiteUrl} size={96} />
          <span className="absolute right-3 top-3 rounded-full border border-line bg-panel px-2.5 py-1 text-[11px] font-semibold text-muted">
            Coming soon
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide">{p.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {p.region === "Europe" ? "Europe only — launching soon." : "Launching soon."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-card transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-cardlg">
      {/* Big product photo */}
      <Link
        to={to}
        aria-label={`View ${p.name}`}
        className="relative block aspect-[4/5] overflow-hidden bg-gradient-to-br from-feature to-panel"
      >
        {p.productImage ? (
          <img
            src={p.productImage}
            alt={`${p.name} product`}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Logo name={p.name} website={p.websiteUrl} size={112} />
          </div>
        )}
        <span className="absolute right-3 top-3 whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-xs font-extrabold text-ongold shadow-card">
          {p.savings} off
        </span>
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-wide">
          {p.name}
        </h3>

        {p.code ? (
          <button
            type="button"
            onClick={() => onCopy(p.code!)}
            className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-ink/20 bg-panel-2 px-3 py-2 text-left text-sm transition hover:border-gold hover:bg-gold/10"
            aria-label={`Copy discount code ${p.code}`}
          >
            <span className="text-muted">
              Code <b className="tracking-wide text-ink">{p.code}</b>
            </span>
            <span className="text-[11px] text-muted">
              {copied === p.code ? "copied ✓" : "tap to copy"}
            </span>
          </button>
        ) : (
          <p className="text-sm text-muted">Discount applied at the link</p>
        )}

        <Link
          to={to}
          className="mt-auto inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ongold transition hover:brightness-110"
        >
          View {p.name} →
        </Link>
      </div>
    </div>
  );
}

export default function DealsGrid() {
  const { copied, copy } = useCopy();
  const h = HOUSE_BRAND;

  return (
    <section id="deals" className="scroll-mt-20 py-16 md:py-20">
      <div className="container-p4p">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Purchase From Me Directly</span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            Vetted vendors, <span className="gold-text">verified codes</span>
          </h2>
          <p className="mt-3 text-muted">
            Tap any code to copy it, then shop and save. Dave only lists vendors he stands behind.
          </p>
        </div>

        {/* House brand */}
        <div className="relative mt-10 overflow-hidden rounded-3xl border border-gold/35 bg-gradient-to-br from-feature to-panel shadow-cardlg p-6 md:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 140% at 0% 0%, rgba(30,154,224,.18), transparent 55%)",
            }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-gold to-[#fff0c2] font-bold text-ongold">
                P4P
              </div>
              <div>
                <span className="inline-block rounded-full bg-gold px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-ongold">
                  House Brand
                </span>
                <h3 className="mt-1.5 font-display text-xl font-bold">{h.name}</h3>
                <p className="text-sm text-muted">
                  Save {h.savings} with code <b className="text-ink">{h.code}</b>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {h.code && (
                <div className="w-40">
                  <CodePill code={h.code} onCopy={copy} copied={copied === h.code} />
                </div>
              )}
              <a
                href={h.affiliateUrl || h.websiteUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-ongold transition hover:brightness-110"
              >
                Shop &amp; Save →
              </a>
            </div>
          </div>
        </div>

        {/* Partner grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PARTNERS.map((p) => (
            <PartnerCard key={p.slug} p={p} copied={copied} onCopy={copy} />
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-muted/80">
          Affiliate disclosure: Peptides 4 Power may earn a commission on purchases made through
          these links, at no extra cost to you. Products referenced are for research purposes only.
          This is not medical advice.
        </p>
      </div>
    </section>
  );
}
