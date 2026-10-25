import { FEATURED_PEPTIDE } from "@/data/content";
import { CheckIcon } from "./icons";

export default function FeaturedPeptide() {
  const p = FEATURED_PEPTIDE;
  return (
    <section id="featured" className="py-16 md:py-20">
      <div className="container-p4p">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-feature to-panel shadow-cardlg p-8 md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 120% at 100% 0%, rgba(30,154,224,.18), transparent 55%)",
            }}
          />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="section-eyebrow">Peptide of the Week</span>
              <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
                {p.name}
              </h2>
              <p className="mt-1 text-lg italic text-accent">{p.nickname}</p>
              <ul className="mt-6 space-y-2.5">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-ink">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-accent">
                      <CheckIcon size={13} />
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-muted">{p.disclaimer}</p>
            </div>

            <div className="w-full shrink-0 md:w-80">
              <p className="mb-3 text-sm font-semibold text-ink">{p.carriedByNote}</p>
              <div className="space-y-3">
                {p.buyOptions.map((opt) => (
                  <a
                    key={opt.vendor}
                    href={opt.url}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel p-4 shadow-card transition hover:-translate-y-0.5 hover:border-gold/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display font-bold">{opt.vendor}</span>
                        {opt.houseBrand && (
                          <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ongold">
                            House
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-sm text-muted">
                        {opt.price != null ? (
                          <span className="font-bold text-accent">${opt.price.toFixed(2)}</span>
                        ) : (
                          <span>{opt.priceNote}</span>
                        )}
                        {opt.code && (
                          <>
                            {" · code "}
                            <b className="text-ink">{opt.code}</b>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-ongold">
                      Shop →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
