import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PARTNERS, HOUSE_BRAND, VENDOR_COLORS, type Partner } from "@/data/partners";
import { getVendor } from "@/data/catalog";
import { P4P_LOGO } from "@/assets/logo";
import Logo from "./Logo";
import Reveal from "./Reveal";
import { ArrowRightIcon } from "./icons";

const BRAND_BLUE = "#1e9ae0";

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
  const color = VENDOR_COLORS[p.slug] ?? BRAND_BLUE;

  // Vendors we have a live product catalog for open their on-site page;
  // the rest go straight to the store through the affiliate link.
  const vendor = getVendor(p.slug);
  const hasProducts = (vendor?.products.length ?? 0) > 0;
  const shopHref = p.affiliateUrl || p.websiteUrl || "#";
  const badge = p.savingsPct != null ? `${p.savings} off` : p.savings;
  const artClass = "relative block aspect-[4/5] overflow-hidden";
  const artStyle = {
    background: `linear-gradient(150deg, ${color}2e 0%, ${color}0f 55%, ${color}05 100%)`,
  };
  const art = (
    <>
      {p.productImage ? (
        <img
          src={p.productImage}
          alt={`${p.name} product`}
          loading="lazy"
          className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <Logo name={p.name} website={p.websiteUrl} size={120} rounded="rounded-2xl" />
        </div>
      )}
      <span
        className="absolute right-3 top-3 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold text-white shadow-card"
        style={{ background: color }}
      >
        {badge}
      </span>
    </>
  );
  const btnClass =
    "cta mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold";

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-card transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-cardlg">
      {/* Product photo — links to the on-site page, or straight to the store. */}
      {hasProducts ? (
        <Link to={to} aria-label={`View ${p.name}`} className={artClass} style={artStyle}>
          {art}
        </Link>
      ) : (
        <a
          href={shopHref}
          target="_blank"
          rel="sponsored noopener noreferrer"
          aria-label={`Shop ${p.name}`}
          className={artClass}
          style={artStyle}
        >
          {art}
        </a>
      )}

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

        {hasProducts ? (
          <Link to={to} className={btnClass}>
            View {p.name} <ArrowRightIcon size={16} />
          </Link>
        ) : (
          <a href={shopHref} target="_blank" rel="sponsored noopener noreferrer" className={btnClass}>
            Shop {p.name} <ArrowRightIcon size={16} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function DealsGrid() {
  const { copied, copy } = useCopy();
  const h = HOUSE_BRAND;

  return (
    <section id="deals" className="scroll-mt-20 pt-8 pb-16 md:pt-12 md:pb-20">
      <div className="container-p4p">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Where to buy</span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            So many places out there — <span className="gradient-text">here's where to start</span>
          </h2>
          <p className="mt-3 text-muted">
            Dave's hand-picked peptide companies, all in one spot. Tap a code to copy it, then shop and save.
          </p>
        </Reveal>

        {/* House brand */}
        <Reveal className="mt-10">
        <div className="relative overflow-hidden rounded-3xl border border-gold/35 bg-gradient-to-br from-feature to-panel shadow-cardlg p-6 md:p-7">
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
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-white p-2 shadow-card">
                <img
                  src={P4P_LOGO}
                  alt="Peptides 4 Power"
                  className="h-full w-full object-contain"
                />
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
                className="cta inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                Shop &amp; Save <ArrowRightIcon size={16} />
              </a>
            </div>
          </div>
        </div>
        </Reveal>

        {/* Partner grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNERS.map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i, 7) * 60}>
              <PartnerCard p={p} copied={copied} onCopy={copy} />
            </Reveal>
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
