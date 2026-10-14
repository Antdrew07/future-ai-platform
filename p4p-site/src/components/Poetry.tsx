import { POETRY } from "@/data/content";

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
          <p className="mt-3 text-muted">The personality that made the original site his.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          {POETRY.map((poem) => (
            <blockquote
              key={poem.title}
              className="rounded-2xl border border-line bg-panel shadow-card p-6"
            >
              <h3 className="font-display text-lg font-bold text-accent">{poem.title}</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                {poem.body}
              </p>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
