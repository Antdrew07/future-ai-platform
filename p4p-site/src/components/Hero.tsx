import { Link } from "react-router-dom";
import { PARTNERS } from "@/data/partners";
import { CATALOG } from "@/data/catalog";
import { VIDEO_CATEGORIES } from "@/data/videos";
import { ArrowRightIcon, ShieldCheckIcon } from "./icons";

const videoCount = VIDEO_CATEGORIES.reduce((n, c) => n + c.videos.length, 0);

const CHIPS = [
  `${PARTNERS.length} vetted vendors`,
  `${CATALOG.productCount}+ live prices`,
  `${videoCount} videos`,
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-[84px] pb-6 md:pt-28 md:pb-10">
      {/* ambient gradient mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 60% at 12% 0%, rgba(30,154,224,.16), transparent 60%), radial-gradient(45% 55% at 95% 25%, rgba(2,132,199,.14), transparent 60%)",
        }}
      />
      <div className="container-p4p relative grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Copy */}
        <div className="text-center md:text-left">
          <span className="section-eyebrow">David Furka · Peptides 4 Power</span>
          <h1 className="mx-auto mt-4 max-w-xl font-display text-5xl font-bold leading-[0.95] tracking-tight md:mx-0 md:text-7xl">
            So many peptide sites.{" "}
            <span className="gradient-text">Start here.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted md:mx-0 md:text-lg">
            One trusted list of the best peptide companies — each with a discount code.
            Shop smart, then dig into Dave's breakdowns.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link to="/vendors" className="cta inline-flex items-center gap-1.5 rounded-full px-6 py-3.5 text-sm font-bold">
              Browse the vendors <ArrowRightIcon size={16} />
            </Link>
            <Link
              to="/videos"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel/60 px-6 py-3.5 text-sm font-bold text-ink backdrop-blur transition hover:border-gold hover:text-accent"
            >
              Watch the videos
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted md:justify-start">
            {CHIPS.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <ShieldCheckIcon size={15} className="text-accent" />
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div className="relative mx-auto w-full max-w-sm md:max-w-none">
          <div
            aria-hidden
            className="anim-glow pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-70 blur-2xl"
            style={{ background: "radial-gradient(60% 60% at 50% 30%, rgba(30,154,224,.35), transparent 70%)" }}
          />
          <img
            src="/about/david-gym.jpg"
            alt="David Furka"
            className="relative aspect-[4/5] w-full rounded-[2rem] border border-white/40 object-cover object-top shadow-cardlg"
          />
          <div className="absolute -bottom-4 left-4 flex items-center gap-2.5 rounded-2xl border border-line bg-panel/80 px-4 py-3 shadow-cardlg backdrop-blur md:-left-6">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-accent">
              <ShieldCheckIcon size={18} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold">Verified codes</div>
              <div className="text-xs text-muted">Hand-picked by Dave</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
