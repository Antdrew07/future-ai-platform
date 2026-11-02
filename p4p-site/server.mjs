// Peptides 4 Power — production server.
// Serves the built static site (dist/) AND a small API for newsletter signups.
// The marketing site is served even if the database is unavailable, so a DB
// hiccup can never take the public site down.

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

/* ------------------------------------------------------------------ */
/* Database (own subscriber store — the CRM foundation)                */
/* ------------------------------------------------------------------ */
const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  : null;
// Never let an idle-client error (e.g. Postgres restart) crash the process and
// take the public site down — log it and let the pool recover.
if (pool) pool.on("error", (err) => console.error("[pg pool]", err?.message));

async function initDb() {
  if (!pool) {
    console.warn("[db] DATABASE_URL not set — signups are disabled until it is.");
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id         SERIAL PRIMARY KEY,
      email      TEXT NOT NULL UNIQUE,
      name       TEXT,
      source     TEXT,
      status     TEXT NOT NULL DEFAULT 'subscribed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("[db] ready");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------------ */
/* API: newsletter signup                                             */
/* ------------------------------------------------------------------ */
app.post("/api/subscribe", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const name = req.body?.name ? String(req.body.name).trim().slice(0, 120) : null;
    const source = req.body?.source ? String(req.body.source).trim().slice(0, 60) : "website";

    if (!EMAIL_RE.test(email) || email.length > 200) {
      return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    }
    if (!pool) {
      return res.status(503).json({ ok: false, error: "Signups are temporarily unavailable." });
    }

    const result = await pool.query(
      `INSERT INTO subscribers (email, name, source)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET status = 'subscribed'
       RETURNING (xmax = 0) AS inserted;`,
      [email, name, source]
    );
    const isNew = !!result.rows[0]?.inserted;

    // Welcome email is fire-and-forget — it never blocks or fails the signup.
    if (isNew) sendWelcome(email).catch((e) => console.error("[welcome]", e?.message));

    return res.json({ ok: true, newSubscriber: isNew });
  } catch (err) {
    console.error("[subscribe]", err?.message);
    return res.status(500).json({ ok: false, error: "Something went wrong — please try again." });
  }
});

async function sendWelcome(email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const from = process.env.RESEND_FROM || "Peptides 4 Power <dave@peptides4power.com>";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1a2430">
      <h2 style="color:#0b2239;margin:0 0 8px">You're on the list 🎉</h2>
      <p style="line-height:1.6;color:#5b6b7b">
        Thanks for subscribing to <strong>Peptides 4 Power</strong>. You'll be the first to hear
        about new discount codes, sales, and Dave's Peptide of the Week.
      </p>
      <p style="line-height:1.6;color:#5b6b7b">— Dave</p>
      <hr style="border:0;border-top:1px solid #e4e9ef;margin:18px 0" />
      <p style="font-size:12px;color:#9aa7b3">
        Peptides 4 Power · peptides4power.com · For research &amp; educational purposes only.
      </p>
    </div>`;
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: email, subject: "You're in — Peptides 4 Power", html }),
  });
  if (!resp.ok) throw new Error(`resend ${resp.status}: ${await resp.text()}`);
}

/* ------------------------------------------------------------------ */
/* Static site + SPA fallback                                         */
/* ------------------------------------------------------------------ */
app.use("/api", (_req, res) => res.status(404).json({ ok: false, error: "Not found" }));
// redirect:false so a page route that shares a name with an asset folder
// (e.g. /vendors ↔ dist/vendors/, /about ↔ dist/about/) falls through to the
// SPA instead of 301-redirecting to a trailing slash.
app.use(express.static(DIST, { maxAge: "1h", redirect: false }));
app.get("*", (_req, res) => res.sendFile(path.join(DIST, "index.html")));

app.listen(PORT, () => console.log(`[p4p] listening on :${PORT}`));
initDb().catch((e) => console.error("[db] init failed:", e?.message));
