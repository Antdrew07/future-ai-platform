# Peptide Calculator (standalone)

A self-contained peptide **reconstitution calculator** web app. It works out
exactly how many insulin-syringe units to draw for any dose, backed by a
searchable peptide library, popular stacks, and a reconstitution guide.

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
