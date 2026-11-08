/**
 * merge-woo-live.mjs — build-time live pricing for WooCommerce vendors.
 *
 * For each vendor whose WooCommerce API keys are present in the environment,
 * fetch its live product catalog and merge the products into
 * src/data/catalog.json (so the shipped site shows live prices).
 *
 * SECURITY: the API keys are read from env vars ONLY. They are never written
 * to the catalog, committed to git, or shipped to the browser — only the
 * resulting product data (names/prices/urls, all public) is baked in.
 *
 * FAIL-SOFT: any missing key / network error / bad response leaves the
 * committed catalog untouched and never fails the build. Runs in the Railway
 * build (which has outbound network); a no-op locally where keys are absent.
 *
 * Env vars (set as protected Railway variables, not in the repo):
 *   WOO_FLAWLESS_KEY / WOO_FLAWLESS_SECRET
 *   WOO_GLOW_KEY     / WOO_GLOW_SECRET
 *   WOO_IRON_KEY     / WOO_IRON_SECRET
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG = path.resolve(__dirname, "../src/data/catalog.json");

/** curated slug -> WooCommerce store base + which env vars hold its keys. */
const WOO_VENDORS = [
  { slug: "flawless-compounds", base: "https://flawlesscompounds.com", keyEnv: "WOO_FLAWLESS_KEY", secretEnv: "WOO_FLAWLESS_SECRET" },
  { slug: "glow-aminos", base: "https://glowaminos.com", keyEnv: "WOO_GLOW_KEY", secretEnv: "WOO_GLOW_SECRET" },
  { slug: "iron-protocol", base: "https://ironprotocol.com", keyEnv: "WOO_IRON_KEY", secretEnv: "WOO_IRON_SECRET" },
];

const MAX_PRODUCTS = 60;
const JUNK = /^(offer|credit|store credit|gift\s*card|e-?gift|test product|sample|deposit|balance|donation|wallet)\b/i;

function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/[\s–—-]+$/, "").trim();
}

function splitNameSize(raw) {
  const name = decodeEntities(raw);
  const m = name.match(/^(.*?)[\s–—-]+(\d[\d.,]*\s?(?:mg|mcg|ml|iu|g)\b.*)$/i);
  return m ? { compound: m[1].trim(), size: m[2].trim() } : { compound: name, size: "" };
}

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Copy query params from the vendor's tracked affiliate URL onto a product URL. */
function withAffiliateRef(productUrl, affiliateUrl) {
  try {
    const pu = new URL(productUrl);
    const au = new URL(affiliateUrl);
    if ([...au.searchParams.keys()].length) {
      for (const [k, v] of au.searchParams) pu.searchParams.set(k, v);
      return pu.toString();
    }
    return productUrl;
  } catch {
    return productUrl || affiliateUrl;
  }
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchWooProducts(v) {
  const key = process.env[v.keyEnv];
  const secret = process.env[v.secretEnv];
  if (!key || !secret) return null; // not configured -> skip
  const auth = `consumer_key=${encodeURIComponent(key)}&consumer_secret=${encodeURIComponent(secret)}`;
  const all = [];
  for (let page = 1; page <= 3; page++) {
    const url = `${v.base}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish&${auth}`;
    const batch = await fetchJson(url);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

function toProduct(p, affiliateUrl, base) {
  const price = num(p.price) ?? num(p.sale_price) ?? num(p.regular_price);
  if (price === null || price < 2) return null;
  const { compound, size } = splitNameSize(p.name || "Product");
  if (!compound || JUNK.test(compound)) return null;
  const regular = num(p.regular_price);
  const inStock = p.stock_status ? p.stock_status === "instock" : true;
  const onSale = !!(p.on_sale && regular !== null && regular > price && inStock);
  const discountPct = onSale && regular ? Math.round(((regular - price) / regular) * 100) : null;
  const url = withAffiliateRef(p.permalink || base, affiliateUrl);
  return {
    id: Number(p.id) || 0,
    compound,
    category: (p.categories && p.categories[0] && decodeEntities(p.categories[0].name)) || null,
    size,
    mg: null,
    form: null,
    price,
    regularPrice: regular,
    onSale,
    discountPct,
    inStock,
    currency: "USD",
    url,
    observedAt: new Date().toISOString(),
  };
}

async function main() {
  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  } catch (e) {
    console.warn(`[woo] cannot read catalog.json, skipping: ${e.message}`);
    return;
  }

  let changed = false;
  for (const v of WOO_VENDORS) {
    try {
      const raw = await fetchWooProducts(v);
      if (!raw) {
        console.log(`[woo] ${v.slug}: no API keys set, skipping`);
        continue;
      }
      const vendor = catalog.vendors.find((x) => x.slug === v.slug);
      if (!vendor) {
        console.warn(`[woo] ${v.slug}: not found in catalog, skipping`);
        continue;
      }
      let products = raw.map((p) => toProduct(p, vendor.affiliateUrl || v.base, v.base)).filter(Boolean);
      products.sort((a, b) => {
        if (a.onSale !== b.onSale) return a.onSale ? -1 : 1;
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        return (a.price ?? Infinity) - (b.price ?? Infinity);
      });
      products = products.slice(0, MAX_PRODUCTS);
      if (products.length === 0) {
        console.warn(`[woo] ${v.slug}: fetched but 0 usable products, keeping existing`);
        continue;
      }
      vendor.products = products;
      vendor.productCount = products.length;
      vendor.onSaleCount = products.filter((p) => p.onSale).length;
      const inStockPrices = products.filter((p) => p.inStock && p.price != null).map((p) => p.price);
      vendor.cheapest = inStockPrices.length ? Math.min(...inStockPrices) : null;
      vendor.comingSoon = false;
      changed = true;
      console.log(`[woo] ${v.slug}: ${products.length} products (${vendor.onSaleCount} on sale)`);
    } catch (e) {
      console.warn(`[woo] ${v.slug}: fetch failed, keeping existing — ${e.message}`);
    }
  }

  if (!changed) {
    console.log("[woo] no live vendors merged (no keys or all failed) — catalog unchanged");
    return;
  }

  // Recompute Sale of the Week + top deals + totals across all vendors.
  const deals = [];
  for (const vd of catalog.vendors) {
    for (const pr of vd.products || []) {
      if (pr.onSale && pr.inStock && pr.discountPct != null) {
        deals.push({ vendorSlug: vd.slug, vendorName: vd.name, code: vd.code, product: pr });
      }
    }
  }
  deals.sort(
    (a, b) =>
      (b.product.discountPct ?? 0) - (a.product.discountPct ?? 0) ||
      ((b.product.regularPrice ?? 0) - (b.product.price ?? 0)) -
        ((a.product.regularPrice ?? 0) - (a.product.price ?? 0)),
  );
  catalog.saleOfWeek = deals[0] ?? catalog.saleOfWeek ?? null;
  catalog.topDeals = deals.slice(0, 8);
  catalog.productCount = catalog.vendors.reduce((n, v) => n + (v.productCount || 0), 0);
  catalog.bakedAt = new Date().toISOString();

  fs.writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log("[woo] catalog.json updated with live WooCommerce pricing");
}

main().catch((e) => console.warn(`[woo] unexpected error, skipping: ${e?.message || e}`));
