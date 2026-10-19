import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ABOUT, SITE } from "@/data/content";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `About ${ABOUT.name} | ${SITE.name}`;
    return () => {
      document.title = "Peptides 4 Power | David Furka";
    };
  }, []);

  return (
    <div className="pt-24 pb-20 md:pt-28">
      <div className="container-p4p">
        <div className="mx-auto max-w-3xl">
          <span className="section-eyebrow">About</span>

          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            {/* Headshot (or initials until one is added) */}
            <div className="shrink-0">
              {ABOUT.photo ? (
                <img
                  src={ABOUT.photo}
                  alt={ABOUT.name}
                  className="h-28 w-28 rounded-2xl object-cover shadow-cardlg md:h-32 md:w-32"
                />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold-bright text-3xl font-bold text-ongold shadow-cardlg md:h-32 md:w-32">
                  {initials(ABOUT.name)}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h1 className="font-display text-3xl font-bold md:text-4xl">{ABOUT.name}</h1>
              <p className="mt-1 text-accent">{ABOUT.role}</p>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-8 rounded-3xl border border-line bg-panel shadow-card p-6 md:p-8">
            <p className="text-lg font-medium leading-relaxed text-ink">{ABOUT.intro}</p>
            <div className="mt-5 space-y-4 leading-relaxed text-muted">
              {ABOUT.paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <p className="mt-6 border-t border-line pt-5 text-sm leading-relaxed text-muted/80">
              {ABOUT.closing}
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
            <Link
              to="/#deals"
              className="rounded-full bg-gold px-6 py-3 text-sm font-bold text-ongold transition hover:brightness-110"
            >
              Shop Dave's vendors →
            </Link>
            <Link
              to="/#videos"
              className="rounded-full border border-line px-6 py-3 text-sm font-bold text-ink transition hover:border-gold hover:text-accent"
            >
              Watch the videos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
