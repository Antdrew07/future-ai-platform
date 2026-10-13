import { HERO_STATS, SITE } from "@/data/content";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-[112px] pb-20 md:pt-[150px] md:pb-28">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(231,184,75,.14), transparent 60%), radial-gradient(40% 40% at 85% 10%, rgba(124,92,255,.12), transparent 60%)",
        }}
      />
      <div className="container-p4p relative text-center">
        <span className="section-eyebrow">David Furka · Peptides 4 Power</span>
        <h1 className="mx-auto mt-4 max-w-4xl font-display text-4xl font-bold leading-[1.05] md:text-6xl">
          Peptide knowledge that{" "}
          <span className="gold-text">actually makes sense</span> — plus the codes that save you money.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          {SITE.tagline} Watch Dave break it down, then shop his vetted vendor list with
          verified discount codes.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#deals"
            className="rounded-full bg-gold px-6 py-3 text-sm font-bold text-bg transition hover:brightness-110"
          >
            Shop the Deals →
          </a>
          <a
            href="#videos"
            className="rounded-full border border-line px-6 py-3 text-sm font-bold text-ink transition hover:border-gold hover:text-gold"
          >
            Watch Dave's Videos
          </a>
        </div>

        {/* stats */}
        <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-3">
          {HERO_STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-line bg-panel/60 px-3 py-4"
            >
              <div className="font-display text-2xl font-bold text-gold md:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-muted md:text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-xs leading-relaxed text-muted/80">
          For research & educational purposes only. Nothing here is medical advice.
        </p>
      </div>
    </section>
  );
}
