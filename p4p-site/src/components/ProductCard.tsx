import { formatPrice, type CatalogProduct } from "@/data/catalog";

export default function ProductCard({
  product,
  code,
}: {
  product: CatalogProduct;
  code?: string | null;
}) {
  const p = product;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel shadow-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-display text-base font-bold leading-tight">{p.compound}</h4>
          <p className="mt-0.5 text-xs text-muted">
            {p.size}
            {p.category ? ` · ${p.category}` : ""}
          </p>
        </div>
        {p.onSale && p.discountPct ? (
          <span className="whitespace-nowrap rounded-full border border-gold/35 bg-gold/15 px-2 py-0.5 text-xs font-bold text-accent">
            −{p.discountPct}%
          </span>
        ) : !p.inStock ? (
          <span className="whitespace-nowrap rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-muted">
            Out of stock
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-end gap-2">
        <span className="font-display text-xl font-bold">
          {formatPrice(p.price, p.currency)}
        </span>
        {p.onSale && p.regularPrice ? (
          <span className="pb-0.5 text-sm text-muted line-through">
            {formatPrice(p.regularPrice, p.currency)}
          </span>
        ) : null}
      </div>

      <a
        href={p.url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ongold transition hover:brightness-110"
      >
        Shop{code ? ` · ${code}` : ""} →
      </a>
    </div>
  );
}
