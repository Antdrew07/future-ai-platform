import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getVendor, formatPrice } from "@/data/catalog";
import Logo from "@/components/Logo";
import ProductCard from "@/components/ProductCard";

export default function VendorPage() {
  const { slug = "" } = useParams();
  const vendor = getVendor(slug);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (vendor) document.title = `${vendor.name} — prices & code | Peptides 4 Power`;
    return () => {
      document.title = "Peptides 4 Power | David Furka";
    };
  }, [vendor]);

  if (!vendor) {
    return (
      <div className="container-p4p pt-32 pb-24 text-center">
        <h1 className="font-display text-3xl font-bold">Vendor not found</h1>
        <Link to="/#deals" className="mt-4 inline-block text-gold hover:underline">
          ← Back to all vendors
        </Link>
      </div>
    );
  }

  function copyCode() {
    if (!vendor!.code) return;
    navigator.clipboard?.writeText(vendor!.code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  }

  const hasProducts = vendor.products.length > 0;

  return (
    <div className="pt-24 pb-20 md:pt-28">
      <div className="container-p4p">
        <Link to="/#deals" className="text-sm text-muted hover:text-ink">
          ← All vendors
        </Link>

        {/* Vendor header */}
        <div className="mt-5 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-[#14120c] to-panel p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Logo name={vendor.name} website={vendor.website} size={64} />
              <div>
                {vendor.houseBrand && (
                  <span className="mb-1 inline-block rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-bg">
                    House Brand
                  </span>
                )}
                <h1 className="font-display text-3xl font-bold md:text-4xl">{vendor.name}</h1>
                <p className="mt-1 text-sm text-muted">
                  Save {vendor.savings}
                  {vendor.region ? ` · ${vendor.region} only` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {vendor.code && (
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-white/25 bg-white/[0.03] px-4 py-2.5 transition hover:border-gold hover:bg-gold/10"
                  aria-label={`Copy code ${vendor.code}`}
                >
                  <span className="font-semibold tracking-wide">{vendor.code}</span>
                  <span className="text-[11px] text-muted">{copied ? "copied ✓" : "tap to copy"}</span>
                </button>
              )}
              <a
                href={vendor.affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-bg transition hover:brightness-110"
              >
                Visit {vendor.name} →
              </a>
            </div>
          </div>

          {hasProducts && (
            <div className="mt-6 flex flex-wrap gap-6 border-t border-line pt-5 text-sm">
              <span className="text-muted">
                <b className="text-ink">{vendor.productCount}</b> products tracked
              </span>
              {vendor.onSaleCount > 0 && (
                <span className="text-muted">
                  <b className="text-gold">{vendor.onSaleCount}</b> on sale now
                </span>
              )}
              {vendor.cheapest !== null && (
                <span className="text-muted">
                  From <b className="text-ink">{formatPrice(vendor.cheapest)}</b>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Products */}
        {hasProducts ? (
          <>
            <h2 className="mt-10 mb-5 font-display text-2xl font-bold">
              Products{" "}
              <span className="text-base font-normal text-muted">
                — live prices, affiliate links baked in
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vendor.products.map((p) => (
                <ProductCard key={p.id} product={p} code={vendor.code} />
              ))}
            </div>
            <p className="mt-8 text-xs text-muted/80">
              Prices are the latest observed from the vendor's public catalog and may change.
              Every "Shop" link carries Dave's affiliate code. For research purposes only — not
              medical advice.
            </p>
          </>
        ) : (
          <div className="mt-10 rounded-3xl border border-line bg-panel p-8 text-center">
            <h2 className="font-display text-xl font-bold">Product pricing coming soon</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              We're still pulling {vendor.name}'s live catalog. In the meantime, your discount
              code <b className="text-ink">{vendor.code ?? ""}</b> is ready to use.
            </p>
            <a
              href={vendor.affiliateUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="mt-5 inline-flex rounded-xl bg-gold px-6 py-3 text-sm font-bold text-bg transition hover:brightness-110"
            >
              Shop {vendor.name} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
