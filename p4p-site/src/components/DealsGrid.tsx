import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PARTNERS, HOUSE_BRAND, type Partner } from "@/data/partners";
import { getVendor } from "@/data/catalog";
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
  const vendor = getVendor(p.slug);

  if (p.comingSoon) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-panel shadow-card p-5 opacity-75">
        <div className="flex items-center gap-3">
          <Logo name={p.name} website={p.websiteUrl} size={44} />
          <h4 className="text-base font-bold leading-tight">{p.name}</h4>
          <span className="ml-auto whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted">
            Coming soon
          </span>
        </div>
        <p className="mt-auto text-sm text-muted">
          {p.region === "Europe" ? "Europe only — launching soon." : "Launching soon."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-panel shadow-card p-5 transition hover:-translate-y-0.5 hover:border-gold/40 hover:bg-panel-2">
      <div className="flex items-center gap-3">
        <Logo name={p.name} website={p.websiteUrl} size={44} />
        <h4 className="text-base font-bold leading-tight">{p.name}</h4>
        <span className="ml-auto whitespace-nowrap rounded-full border border-gold/35 bg-gold/15 px-2.5 py-1 text-xs font-bold text-accent">
          {p.savings}
        </span>
      </div>

      {p.code && (
        <CodePill code={p.code} onCopy={onCopy} copied={copied === p.code} />
      )}

      <a
        href={p.affiliateUrl || p.websiteUrl || "#"}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="mt-auto inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ongold transition hover:brightness-110"
      >
        Shop &amp; Save →
      </a>

      {vendor && vendor.productCount > 0 && (
        <Link
          to={`/vendor/${p.slug}`}
          className="-mt-1 inline-flex items-center justify-center gap-1 text-sm font-semibold text-accent hover:underline"
        >
          View {vendor.productCount} products
          {vendor.onSaleCount > 0 ? ` · ${vendor.onSaleCount} on sale` : ""} →
        </Link>
      )}
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
                "radial-gradient(120% 140% at 0% 0%, rgba(231,184,75,.18), transparent 55%)",
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
