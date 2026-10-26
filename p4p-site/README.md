# Peptides 4 Power — website

The rebuilt **peptides4power.com** (David Furka). Migrated off Wix to a fast,
fully-owned custom site. Vite + React + TypeScript + Tailwind, deployed on
Railway as a static build.

## What's here

A single-scroll conversion-focused landing page:

- **Hero** + rotating **Peptide of the Week** feature
- **Video library** — Dave's three categories (Dave Dumbs It Down, Peptide
  Informational, Informational Continued), embedded from YouTube/Vimeo
- **Vendor Deals** — the 16 vetted vendors in the client's exact order, with
  tap-to-copy discount codes and affiliate links (Sunrise removed), plus the
  **Peptides 4 Power** house brand (GLP10) featured on top
- **Peptide Poetry**, **Contact** form, footer with disclaimers

## Editing content (no code needed for most changes)

| Want to change…           | Edit…                     |
| ------------------------- | ------------------------- |
| Vendors / codes / savings | `src/data/partners.ts`    |
| Videos (YouTube/Vimeo IDs)| `src/data/videos.ts`      |
| Hero, Peptide of the Week, nav, poetry, contact | `src/data/content.ts` |
| Colors / fonts            | `src/index.css` (`@theme`)|

### Wiring a video

In `src/data/videos.ts`, set `provider` + `videoId`:

- YouTube: the id after `v=` or `youtu.be/` → e.g. `dQw4w9WgXcQ`
- Vimeo: the numeric id → e.g. `76979871`

Empty `videoId` renders a "coming soon" placeholder tile.

### Wiring the contact form

In `src/components/Contact.tsx`, paste a form endpoint into `FORM_ENDPOINT`
(Formspree / Basin / Getform). Until then it falls back to a `mailto:` using
`CONTACT.email` from `content.ts`.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
npm run start    # serve dist/ (what Railway runs)
```

## Deploy (Railway)

Separate Railway project. Service **Root Directory = `p4p-site`**. Nixpacks
builds via `nixpacks.toml` and serves the static `dist/` on `$PORT`.

Point `peptides4power.com` at the Railway domain (DNS at the registrar) once the
deploy looks good.

---

For research & educational purposes only. Not medical advice.
