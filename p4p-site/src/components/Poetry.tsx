import { POETRY } from "@/data/content";
import Reveal from "./Reveal";

export default function Poetry() {
  if (!POETRY.length) return null;
  return (
    <section id="poetry" className="border-t border-line bg-bg-2/40 py-16 md:py-20">
      <div className="container-p4p">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Peptide Poetry</span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            Dave's signature segment
          </h2>
          <p className="mt-2 text-sm font-semibold text-accent">By Dr. David Furka</p>
          <p className="mt-3 text-muted">The personality that made the original site his.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          {POETRY.map((poem, i) => (
            <Reveal key={poem.title} delay={Math.min(i, 6) * 60}>
              <blockquote className="h-full rounded-2xl border border-line bg-panel shadow-card p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-cardlg">
                <h3 className="font-display text-lg font-bold text-accent">{poem.title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {poem.body}
                </p>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
