import { Link } from "react-router-dom";
import { CATALOG, formatPrice, getVendor } from "@/data/catalog";
import Logo from "./Logo";
import { ArrowRightIcon } from "./icons";

export default function SaleOfWeek() {
  const sale = CATALOG.saleOfWeek;
  if (!sale) return null;
  const vendor = getVendor(sale.vendorSlug);
  const p = sale.product;
  const runners = CATALOG.topDeals.filter((d) => d.product.id !== p.id).slice(0, 3);

  return (
    <section id="sale" className="scroll-mt-20 py-14 md:py-16">
      <div className="container-p4p">
        <div className="relative overflow-hidden rounded-3xl border border-gold/35 bg-gradient-to-br from-feature to-panel shadow-cardlg p-6 md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 120% at 100% 0%, rgba(30,154,224,.2), transparent 55%)",
            }}
          />
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center">
            <div className="min-w-0">
              <span className="section-eyebrow">🔥 Sale of the Week</span>
              <div className="mt-3 flex items-center gap-3">
                {vendor && <Logo name={vendor.name} website={vendor.website} size={44} />}
                <span className="text-sm font-semibold text-muted">{sale.vendorName}</span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold leading-tight break-words md:text-3xl">
                {p.compound}
                {p.size ? <span className="text-muted"> · {p.size}</span> : null}
              </h2>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <span className="font-display text-4xl font-bold text-accent">
                  {formatPrice(p.price, p.currency)}
                </span>
                {p.regularPrice && (
                  <span className="pb-1 text-lg text-muted line-through">
                    {formatPrice(p.regularPrice, p.currency)}
                  </span>
                )}
                {p.discountPct && (
                  <span className="mb-1 rounded-full bg-gold px-2.5 py-1 text-sm font-extrabold text-ongold">
                    −{p.discountPct}%
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={p.url}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="cta inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-bold"
                >
                  Grab this deal <ArrowRightIcon size={16} />
                </a>
                {sale.code && (
                  <span className="text-sm text-muted">
                    Code <b className="text-ink">{sale.code}</b> baked into the link
                  </span>
                )}
                <Link
                  to={`/vendor/${sale.vendorSlug}`}
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  See all {sale.vendorName} prices →
                </Link>
              </div>
            </div>

            {runners.length > 0 && (
              <div className="min-w-0 rounded-2xl border border-line bg-bg/40 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  More deals this week
                </p>
                <ul className="space-y-2.5">
                  {runners.map((d) => (
                    <li key={d.product.id}>
                      <a
                        href={d.product.url}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 transition hover:bg-panel shadow-card"
                      >
                        <span className="min-w-0 truncate text-sm">
                          <b>{d.product.compound}</b>{" "}
                          <span className="text-muted">{d.product.size}</span>
                          <span className="text-muted"> · {d.vendorName}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-bold">
                            {formatPrice(d.product.price, d.product.currency)}
                          </span>
                          {d.product.discountPct && (
                            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-accent">
                              −{d.product.discountPct}%
                            </span>
                          )}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
