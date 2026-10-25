import { Link } from "react-router-dom";
import { NAV_LINKS, SITE } from "@/data/content";
import { P4P_LOGO } from "@/assets/logo";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-bg-2/60 py-12">
      <div className="container-p4p">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="max-w-xs">
            <img src={P4P_LOGO} alt="Peptides 4 Power" className="mx-auto h-10 w-auto md:mx-0" />
            <p className="mt-3 text-sm leading-relaxed text-muted">{SITE.tagline}</p>
            <p className="mt-2 text-xs text-muted/70">{SITE.owner}</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-left sm:grid-cols-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                to={`/${l.href}`}
                className="text-sm text-muted transition-colors hover:text-accent"
              >
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
