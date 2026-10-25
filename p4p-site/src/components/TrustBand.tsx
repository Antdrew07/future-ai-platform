import { PARTNERS } from "@/data/partners";
import { CATALOG } from "@/data/catalog";
import { VIDEO_CATEGORIES } from "@/data/videos";
import CountUp from "./CountUp";

const NUMBER_GRADIENT = {
  backgroundImage: "linear-gradient(100deg, #38bdf8, #818cf8)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as const;

const videoCount = VIDEO_CATEGORIES.reduce((n, c) => n + c.videos.length, 0);

const STATS = [
  { value: PARTNERS.length, suffix: "", label: "Vetted vendors" },
  { value: CATALOG.productCount, suffix: "+", label: "Live-priced products" },
  { value: videoCount, suffix: "", label: "Video breakdowns" },
  { value: 100, suffix: "%", label: "Plain English" },
];

export default function TrustBand() {
  return (
    <section className="band-dark">
      <div className="container-p4p py-14 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow" style={{ color: "#7dd3fc" }}>
            Why start here
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold text-white md:text-3xl">
            One trusted list — the homework's done for you
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl font-bold md:text-5xl" style={NUMBER_GRADIENT}>
                <CountUp end={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-sm text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
