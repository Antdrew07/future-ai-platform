import { FEATURED_PEPTIDE } from "@/data/content";

export default function FeaturedPeptide() {
  const p = FEATURED_PEPTIDE;
  return (
    <section id="featured" className="py-16 md:py-20">
      <div className="container-p4p">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-[#1c160a] to-panel p-8 md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 120% at 100% 0%, rgba(231,184,75,.18), transparent 55%)",
            }}
          />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="section-eyebrow">Peptide of the Week</span>
              <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
                {p.name}
              </h2>
              <p className="mt-1 text-lg italic text-gold">{p.nickname}</p>
              <ul className="mt-6 space-y-2.5">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-ink">
                    <span className="mt-1 text-gold">▸</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-muted">{p.disclaimer}</p>
            </div>

            <div className="shrink-0">
              <a
                href="#deals"
                className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-bg transition hover:brightness-110"
              >
                Find it from a vetted vendor →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
