import { HERO_STATS } from "@/data/content";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-[104px] pb-10 md:pt-[132px] md:pb-14">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(30,154,224,.14), transparent 60%), radial-gradient(40% 40% at 85% 10%, rgba(2,132,199,.12), transparent 60%)",
        }}
      />
      <div className="container-p4p relative text-center">
        <span className="section-eyebrow">David Furka · Peptides 4 Power</span>
        <h1 className="mx-auto mt-4 max-w-4xl font-display text-4xl font-bold leading-[1.05] md:text-6xl">
          So many peptide sites.{" "}
          <span className="gold-text">Start here.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          David's hand-picked list of trusted peptide companies — each with a discount code.
          One page, no guesswork. Then dig into the videos.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#deals"
            className="rounded-full bg-gold px-6 py-3 text-sm font-bold text-ongold transition hover:brightness-110"
          >
            See where to buy →
          </a>
          <a
            href="#videos"
            className="rounded-full border border-line px-6 py-3 text-sm font-bold text-ink transition hover:border-gold hover:text-accent"
          >
            Watch the videos
          </a>
        </div>

        {/* stats */}
        <div className="mx-auto mt-9 grid max-w-xl grid-cols-3 gap-3">
          {HERO_STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-line bg-panel/60 px-3 py-4"
            >
              <div className="font-display text-2xl font-bold text-accent md:text-3xl">{s.value}</div>
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
