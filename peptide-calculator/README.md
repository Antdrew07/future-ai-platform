# Peptide Calculator (standalone)

A self-contained peptide **calculator and encyclopedia** web app:

- **Calculator** — works out exactly how many insulin-syringe units to draw for
  any dose, with a live syringe visual.
- **Encyclopedia** — 74 peptides with dosing, half-life, benefits, side effects,
  research notes, an evidence-level badge (FDA-approved → research-only), and
  **live clinical-trial + published-research** lookups from ClinicalTrials.gov
  (API v2) and PubMed (E-utilities), fetched in the browser with graceful
  fallback links.
- **Library / Stacks / Guide** — quick-reference dosing table, popular stacks,
  and a reconstitution guide.

> Placeholder name — set the final brand in one place: `APP_NAME` in
> `src/pages/Calculator.tsx`.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + Radix UI primitives
- No backend / database — everything is client-side. Data lives in
  `src/lib/peptides.ts`.

## Develop

```bash
npm install
npm run dev
```

## Production

```bash
npm run build   # → dist/
npm run start   # zero-dependency static server on $PORT (default 3000)
```

## Deploy (Railway)

This folder is a standalone Railway service (root directory
`peptide-calculator`). Railway runs `npm run build` then `npm run start`;
`serve.mjs` binds to `0.0.0.0:$PORT`.

---

**For research use only.** Reproduces reference figures from the source
protocol document for informational purposes. Not medical advice; not for human
consumption.
