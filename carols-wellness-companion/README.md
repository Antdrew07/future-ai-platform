# Carol's Wellness Companion 💗

A premium, mobile-first personal health & peptide-tracking web app, custom-built for a single
user named **Carol**. It feels like a boutique wellness app: blush-pink branding, personalized
greetings, dose tracking, water & mood logging, weekly weigh-ins with charts, and a warm AI
companion powered by **Venice AI**.

> For personal tracking and encouragement only — **not medical advice**.

---

## ✨ Features

- **Onboarding wizard** — name, body basics, health goals, peptide schedules, and daily water goal (all editable later in Settings).
- **Daily dashboard** — personalized greeting, AI encouragement line, peptide dosing checklist with streak counter, tap-to-add water tracker with a progress ring, rotating food suggestions + meal log, and quick mood / energy / sleep check-ins.
- **Calendar & dose history** — monthly calendar (pink heart = all doses, partial, missed; rest days respected), tap any day for full details, and injection-site rotation suggestions.
- **Progress** — weekly weigh-in flow (weight + optional measurements + progress photo), weight chart with a trend line (Recharts), pounds lost, % to goal, auto BMI, and confetti at every 5 lb milestone and when the goal is reached.
- **AI companion chat** — persisted history, server-assembled context (profile, goals, today's status, weight trend), streamed into a warm system prompt. The Venice key stays **server-side only**.
- **Journal & notes**, **CSV export** of all data, and **PWA** support (installable, pink icon, service worker, local reminders where supported).

## 🧱 Tech stack

- **Next.js 14** (App Router) + **TypeScript** — frontend and API routes in one deployable app
- **PostgreSQL** via **Prisma ORM**
- **Tailwind CSS** for styling
- **Recharts** for progress charts, **canvas-confetti** for milestones
- **Venice AI** (`/api/chat` proxy) for the companion

---

## 🔐 Environment variables

Copy `.env.example` to `.env` and fill these in:

| Variable          | Required | Description                                                                                  |
| ----------------- | :------: | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    |    ✅    | PostgreSQL connection string. On Railway, reference the Postgres plugin's `DATABASE_URL`.    |
| `VENICE_API_KEY`  |    ✅    | Server-side Venice AI key. **Never exposed to the browser.** Used only by `/api/chat`.        |
| `VENICE_MODEL`    |          | Venice model id. Defaults to `venice-uncensored` (won't refuse peptide/wellness topics). Other options: `llama-3.3-70b`, `mistral-31-24b`. |
| `APP_USERNAME`    |          | Login username (case-insensitive). Defaults to `carol` if unset.                              |
| `APP_PASSCODE`    |    ✅    | The password Carol uses to log in (paired with the username).                                 |
| `SESSION_SECRET`  |          | Long random string used to sign the session cookie. Falls back to `APP_PASSCODE` if unset.    |
| `DEMO_MODE`       |          | Set to `true` to enable the Settings → Demo Mode seed/clear buttons.                           |

---

## 💻 Local setup

**Prerequisites:** Node.js ≥ 18.18 and a local (or hosted) PostgreSQL database.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    → set DATABASE_URL, APP_PASSCODE, and VENICE_API_KEY

# 3. Create the database schema
npx prisma migrate deploy      # applies the committed migration
#    (for iterative schema changes during development, use: npx prisma migrate dev)

# 4. (Optional) load demo data — requires DEMO_MODE=true, or just run:
npm run db:seed

# 5. Start the dev server
npm run dev
#    → open http://localhost:3000 and log in with your APP_PASSCODE
```

The app auto-creates a default profile on first load and sends you into the onboarding wizard.

---

## 🚂 Deploy to Railway

This app is built to deploy to [Railway](https://railway.app). Prisma migrations run
automatically on every deploy (`prisma migrate deploy` is part of the `start` command), so the
database schema stays in sync.

1. **Create a project** — In Railway, click **New Project → Deploy from GitHub repo** and select this
   repository. If the app lives in a subdirectory (e.g. `carols-wellness-companion`), open the
   service's **Settings → Root Directory** and set it to that folder.
2. **Add the Postgres plugin** — In the project, click **New → Database → Add PostgreSQL**. Railway
   provisions a `DATABASE_URL` for you.
3. **Set environment variables** — On the app service, open **Variables** and add:
   - `DATABASE_URL` → reference the Postgres plugin: `${{Postgres.DATABASE_URL}}`
   - `VENICE_API_KEY` → your Venice AI key
   - `APP_PASSCODE` → the passcode Carol will use
   - `SESSION_SECRET` → a long random string (recommended)
   - _(optional)_ `VENICE_MODEL`, `DEMO_MODE`
4. **Deploy from GitHub** — Railway builds with `npm run build` and starts with `npm run start`, which
   runs `prisma migrate deploy` before booting Next.js. Push to your default branch to trigger deploys.

The build/start commands are also declared in [`railway.json`](./railway.json). A health check is
exposed at `/api/health`.

### Updating the Venice API key

The key is read from the `VENICE_API_KEY` environment variable — it is **never** hard-coded or sent
to the browser. To rotate it:

- **On Railway:** open the app service → **Variables** → edit `VENICE_API_KEY` → save. Railway
  redeploys automatically.
- **Locally:** edit `VENICE_API_KEY` in your `.env` and restart `npm run dev`.

To change the model, set `VENICE_MODEL`. The default is `venice-uncensored` (so the companion
engages with peptide/hormone/weight-loss questions instead of refusing); alternatives include
`llama-3.3-70b` and `mistral-31-24b`.

---

## 🧪 Demo mode

Set `DEMO_MODE=true` to reveal **Settings → Demo Mode**, where you can load ~8 weeks of realistic
sample data (peptides, dose history, weigh-ins, water, mood, journal) or clear everything. You can
also seed from the CLI with `npm run db:seed`.

## 📦 Scripts

| Script            | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Start the dev server                                    |
| `npm run build`   | Generate Prisma client + build for production           |
| `npm run start`   | Run `prisma migrate deploy` then start the server       |
| `npm run db:seed` | Seed demo data                                          |
| `npm run prisma:studio` | Open Prisma Studio to inspect the database        |

---

Made with care, so every day Carol opens it, it says: _“Good morning, Carol.”_ 🌸
