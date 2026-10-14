import { Link } from "react-router-dom";
import { NAV_LINKS, SITE } from "@/data/content";
import { P4P_LOGO } from "@/assets/logo";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-bg-2/60 py-12">
      <div className="container-p4p">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            <img src={P4P_LOGO} alt="Peptides 4 Power" className="h-10 w-auto" />
            <span className="text-xs text-muted">{SITE.owner}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} to={`/${l.href}`} className="text-sm text-muted hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-muted/70">
          © {year} {SITE.name}. For research & educational purposes only. Content on this site is
          not medical advice and products referenced are not intended to diagnose, treat, cure, or
          prevent any disease. Peptides 4 Power may earn affiliate commissions on purchases made
          through vendor links.
        </p>
      </div>
    </footer>
  );
}
