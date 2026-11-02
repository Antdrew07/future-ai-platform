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

          {/* Hero photo */}
          {ABOUT.photoTop ? (
            <img
              src={ABOUT.photoTop}
              alt={ABOUT.name}
              className="mx-auto mt-5 aspect-[4/5] w-full max-w-sm rounded-3xl object-cover object-top shadow-cardlg"
            />
          ) : (
            <div className="mx-auto mt-5 grid h-28 w-28 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold-bright text-3xl font-bold text-ongold shadow-cardlg">
              {initials(ABOUT.name)}
            </div>
          )}

          <div className="mt-6 text-center">
            <h1 className="font-display text-3xl font-bold md:text-4xl">{ABOUT.name}</h1>
            <p className="mt-1 text-accent">{ABOUT.role}</p>
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

          {/* Second photo */}
          {ABOUT.photoBottom && (
            <img
              src={ABOUT.photoBottom}
              alt={ABOUT.name}
              loading="lazy"
              className="mx-auto mt-8 aspect-[4/5] w-full max-w-sm rounded-3xl object-cover object-top shadow-cardlg"
            />
          )}

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/#deals" className="cta rounded-full px-6 py-3 text-sm font-bold">
              Shop Dave's vendors →
            </Link>
            <Link
              to="/videos"
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
