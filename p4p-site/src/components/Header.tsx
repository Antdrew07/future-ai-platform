import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NAV_LINKS, SITE } from "@/data/content";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${
        scrolled ? "bg-bg/90 backdrop-blur border-b border-line" : "bg-transparent"
      }`}
    >
      <div className="container-p4p flex h-[64px] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-gold to-gold-bright font-display text-sm font-bold text-ongold">
            P4P
          </span>
          <span className="font-display text-base font-bold tracking-tight">
            Peptides&nbsp;4&nbsp;Power
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              to={`/${l.href}`}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link
            to="/#deals"
            className="rounded-full bg-gold px-4 py-2 text-sm font-bold text-ongold transition hover:brightness-110"
          >
            See Deals
          </Link>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-line text-ink"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-line bg-bg/95 backdrop-blur">
          <div className="container-p4p flex flex-col py-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                to={`/${l.href}`}
                className="py-3 text-sm text-muted hover:text-ink"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/#deals"
              className="my-2 rounded-full bg-gold px-4 py-2.5 text-center text-sm font-bold text-ongold"
              onClick={() => setOpen(false)}
            >
              See Deals
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
