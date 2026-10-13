import { useEffect, useState } from "react";
import { NAV_LINKS, SITE } from "@/data/content";

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
        <a href="#home" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-gold to-gold-bright font-display text-sm font-bold text-bg">
            P4P
          </span>
          <span className="font-display text-base font-bold tracking-tight">
            Peptides&nbsp;4&nbsp;Power
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#deals"
            className="rounded-full bg-gold px-4 py-2 text-sm font-bold text-bg transition hover:brightness-110"
          >
            See Deals
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden grid h-10 w-10 place-items-center rounded-lg border border-line text-ink"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-line bg-bg/95 backdrop-blur">
          <div className="container-p4p flex flex-col py-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="py-3 text-sm text-muted hover:text-ink"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#deals"
              className="my-2 rounded-full bg-gold px-4 py-2.5 text-center text-sm font-bold text-bg"
              onClick={() => setOpen(false)}
            >
              See Deals
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
