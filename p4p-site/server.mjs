// Peptides 4 Power — production server.
// Serves the built static site (dist/) AND the API: public newsletter/contact
// endpoints plus a password-protected admin CRM (contacts, stats, broadcasts).
// The marketing site is served even if the database is unavailable, so a DB
// hiccup can never take the public site down.

import express from "express";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL || "https://peptides4power.com";
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(16).toString("hex");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const WAIVER_VERSION = process.env.WAIVER_VERSION || "2026-11-v1";
const MEMBER_DISCOUNT_CODE = process.env.MEMBER_DISCOUNT_CODE || "POWER25";
// During soft-launch (before Stripe is wired) new members are active immediately.
const FREE_BETA = String(process.env.FREE_BETA || "").toLowerCase() === "true";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

/* ================================================================== */
/* Database                                                           */
/* ================================================================== */
const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 6 })
  : null;
if (pool) pool.on("error", (err) => console.error("[pg pool]", err?.message));

async function initDb() {
  if (!pool) {
    console.warn("[db] DATABASE_URL not set — API storage is disabled.");
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id          SERIAL PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      name        TEXT,
      phone       TEXT,
      status      TEXT NOT NULL DEFAULT 'subscriber',
      tags        TEXT[] NOT NULL DEFAULT '{}',
      source      TEXT,
      subscribed  BOOLEAN NOT NULL DEFAULT TRUE,
      message     TEXT,
      notes       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS contacts_created_idx ON contacts (created_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketing_log (
      id          SERIAL PRIMARY KEY,
      type        TEXT NOT NULL DEFAULT 'note',
      title       TEXT,
      body        TEXT,
      meta        JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS marketing_log_created_idx ON marketing_log (created_at DESC);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id                     SERIAL PRIMARY KEY,
      email                  TEXT NOT NULL UNIQUE,
      password_hash          TEXT NOT NULL,
      name                   TEXT,
      status                 TEXT NOT NULL DEFAULT 'pending',
      waiver_version         TEXT,
      waiver_signed_at       TIMESTAMPTZ,
      stripe_customer_id     TEXT,
      stripe_subscription_id TEXT,
      created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // One-time migration from the original subscribers table, if it exists.
  try {
    await pool.query(`
      INSERT INTO contacts (email, name, source, subscribed, status, created_at)
      SELECT email, name, source, TRUE, 'subscriber', created_at FROM subscribers
      ON CONFLICT (email) DO NOTHING;
    `);
  } catch {
    /* subscribers table doesn't exist — fine */
  }
  console.log("[db] ready");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v, n = 200) => (v == null ? null : String(v).trim().slice(0, n) || null);

// Marketing activity log — the AI Marketing Manager's memory.
async function logMarketing(type, title, body, meta) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO marketing_log (type, title, body, meta) VALUES ($1,$2,$3,$4)`,
    [type, title ? String(title).slice(0, 200) : null, body ? String(body).slice(0, 50000) : null, meta ? JSON.stringify(meta) : null]
  );
}

/* ================================================================== */
/* Email (Resend)                                                     */
/* ================================================================== */
async function resendSend(payloads) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const batch = Array.isArray(payloads);
  const url = batch ? "https://api.resend.com/emails/batch" : "https://api.resend.com/emails";
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payloads),
  });
  if (!resp.ok) throw new Error(`resend ${resp.status}: ${await resp.text()}`);
  return resp.json();
}
const FROM = () => process.env.RESEND_FROM || "Peptides 4 Power <dave@peptides4power.com>";

function unsubToken(email) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(`unsub:${email}`).digest("hex").slice(0, 32);
}
function unsubUrl(email) {
  return `${PUBLIC_URL}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;
}

async function sendWelcome(email) {
  if (!process.env.RESEND_API_KEY) return;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1a2430">
      <h2 style="color:#0b2239;margin:0 0 8px">You're on the list 🎉</h2>
      <p style="line-height:1.6;color:#5b6b7b">Thanks for subscribing to <strong>Peptides 4 Power</strong>.
        You'll be first to hear about new discount codes, sales, and Dave's Peptide of the Week.</p>
      <p style="line-height:1.6;color:#5b6b7b">— Dave</p>
      <hr style="border:0;border-top:1px solid #e4e9ef;margin:18px 0" />
      <p style="font-size:12px;color:#9aa7b3">Peptides 4 Power · peptides4power.com · For research &amp; educational purposes only.<br/>
        <a href="${unsubUrl(email)}" style="color:#9aa7b3">Unsubscribe</a></p>
    </div>`;
  await resendSend({ from: FROM(), to: email, subject: "You're in — Peptides 4 Power", html });
}

/* ================================================================== */
/* Public API: subscribe, contact, unsubscribe                        */
/* ================================================================== */
app.post("/api/subscribe", async (req, res) => {
  try {
    const email = clean(req.body?.email, 200)?.toLowerCase();
    const name = clean(req.body?.name, 120);
    const source = clean(req.body?.source, 60) || "website";
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    if (!pool) return res.status(503).json({ ok: false, error: "Signups are temporarily unavailable." });

    const r = await pool.query(
      `INSERT INTO contacts (email, name, source, subscribed, status)
       VALUES ($1,$2,$3,TRUE,'subscriber')
       ON CONFLICT (email) DO UPDATE SET subscribed = TRUE, updated_at = now()
       RETURNING (xmax = 0) AS inserted;`,
      [email, name, source]
    );
    const isNew = !!r.rows[0]?.inserted;
    if (isNew) sendWelcome(email).catch((e) => console.error("[welcome]", e?.message));
    return res.json({ ok: true, newSubscriber: isNew });
  } catch (err) {
    console.error("[subscribe]", err?.message);
    return res.status(500).json({ ok: false, error: "Something went wrong — please try again." });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const email = clean(req.body?.email, 200)?.toLowerCase();
    const name = clean(req.body?.name, 120);
    const message = clean(req.body?.message, 4000);
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    if (!message) return res.status(400).json({ ok: false, error: "Please enter a message." });
    if (pool) {
      await pool.query(
        `INSERT INTO contacts (email, name, source, message, status)
         VALUES ($1,$2,'contact-form',$3,'lead')
         ON CONFLICT (email) DO UPDATE SET message = EXCLUDED.message,
           name = COALESCE(contacts.name, EXCLUDED.name), updated_at = now();`,
        [email, name, message]
      );
    }
    // Notify Dave (fire-and-forget)
    if (process.env.RESEND_API_KEY) {
      resendSend({
        from: FROM(),
        to: process.env.CONTACT_TO || "dave@peptides4power.com",
        reply_to: email,
        subject: `New message from ${name || email}`,
        html: `<p><strong>${name || "Someone"}</strong> (${email}) wrote:</p><p>${String(message).replace(/</g, "&lt;")}</p>`,
      }).catch((e) => console.error("[contact-notify]", e?.message));
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err?.message);
    return res.status(500).json({ ok: false, error: "Something went wrong — please try again." });
  }
});

app.get("/api/unsubscribe", async (req, res) => {
  const email = clean(req.query?.e, 200)?.toLowerCase();
  const token = clean(req.query?.t, 64);
  const page = (msg) =>
    `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
     <div style="font-family:Arial,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#1a2430">
     <h2 style="color:#0b2239">${msg}</h2><p><a href="${PUBLIC_URL}" style="color:#1e9ae0">Back to Peptides 4 Power</a></p></div>`;
  try {
    if (!email || !token || token !== unsubToken(email)) return res.status(400).send(page("Invalid unsubscribe link."));
    if (pool) await pool.query(`UPDATE contacts SET subscribed = FALSE, updated_at = now() WHERE email = $1`, [email]);
    return res.send(page("You've been unsubscribed. 👋"));
  } catch {
    return res.status(500).send(page("Something went wrong."));
  }
});

/* ================================================================== */
/* Admin auth                                                         */
/* ================================================================== */
function makeToken() {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}
function tokenValid(tok) {
  if (!tok || !tok.includes(".")) return false;
  const [exp, sig] = tok.split(".");
  const expect = crypto.createHmac("sha256", SESSION_SECRET).update(String(exp)).digest("hex");
  try {
    if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return false;
  } catch {
    return false;
  }
  return Date.now() < Number(exp);
}
function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}
function requireAdmin(req, res, next) {
  if (tokenValid(readCookie(req, "p4p_admin"))) return next();
  return res.status(401).json({ ok: false, error: "Not authorized" });
}

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body?.password || "");
  if (!ADMIN_PASSWORD) return res.status(500).json({ ok: false, error: "Admin password not configured." });
  const a = Buffer.from(password);
  const b = Buffer.from(ADMIN_PASSWORD);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return res.status(401).json({ ok: false, error: "Incorrect password." });
  res.setHeader(
    "Set-Cookie",
    `p4p_admin=${makeToken()}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
  );
  return res.json({ ok: true });
});
app.post("/api/admin/logout", (_req, res) => {
  res.setHeader("Set-Cookie", "p4p_admin=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  return res.json({ ok: true });
});
app.get("/api/admin/me", requireAdmin, (_req, res) => res.json({ ok: true }));

/* ================================================================== */
/* Admin CRM                                                          */
/* ================================================================== */
app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const q = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE subscribed)::int AS subscribers,
        COUNT(*) FILTER (WHERE status = 'lead')::int AS leads,
        COUNT(*) FILTER (WHERE status = 'customer')::int AS customers,
        COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS new_7d
      FROM contacts;`);
    return res.json({ ok: true, stats: q.rows[0] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/admin/contacts", requireAdmin, async (req, res) => {
  try {
    const search = clean(req.query?.q, 120);
    const status = clean(req.query?.status, 30);
    const where = [];
    const params = [];
    if (search) { params.push(`%${search.toLowerCase()}%`); where.push(`(LOWER(email) LIKE $${params.length} OR LOWER(COALESCE(name,'')) LIKE $${params.length})`); }
    if (status && status !== "all") { params.push(status); where.push(`status = $${params.length}`); }
    const sql = `SELECT id,email,name,phone,status,tags,source,subscribed,message,notes,created_at,updated_at
      FROM contacts ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY created_at DESC LIMIT 500;`;
    const q = await pool.query(sql, params);
    return res.json({ ok: true, contacts: q.rows });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/admin/contacts", requireAdmin, async (req, res) => {
  try {
    const email = clean(req.body?.email, 200)?.toLowerCase();
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: "Valid email required." });
    const q = await pool.query(
      `INSERT INTO contacts (email, name, phone, status, source, subscribed, notes)
       VALUES ($1,$2,$3,COALESCE($4,'lead'),'manual',COALESCE($5,TRUE),$6)
       ON CONFLICT (email) DO UPDATE SET name = COALESCE(EXCLUDED.name, contacts.name), updated_at = now()
       RETURNING *;`,
      [email, clean(req.body?.name, 120), clean(req.body?.phone, 40), clean(req.body?.status, 30), req.body?.subscribed, clean(req.body?.notes, 4000)]
    );
    return res.json({ ok: true, contact: q.rows[0] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch("/api/admin/contacts/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ ok: false, error: "Bad id" });
    const fields = [];
    const params = [];
    const set = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };
    if ("name" in req.body) set("name", clean(req.body.name, 120));
    if ("phone" in req.body) set("phone", clean(req.body.phone, 40));
    if ("status" in req.body) set("status", clean(req.body.status, 30));
    if ("notes" in req.body) set("notes", clean(req.body.notes, 4000));
    if ("subscribed" in req.body) set("subscribed", !!req.body.subscribed);
    if ("tags" in req.body && Array.isArray(req.body.tags)) set("tags", req.body.tags.map((t) => String(t).slice(0, 40)).slice(0, 20));
    if (!fields.length) return res.status(400).json({ ok: false, error: "Nothing to update" });
    params.push(id);
    const q = await pool.query(`UPDATE contacts SET ${fields.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING *;`, params);
    if (!q.rows[0]) return res.status(404).json({ ok: false, error: "Not found" });
    return res.json({ ok: true, contact: q.rows[0] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete("/api/admin/contacts/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query(`DELETE FROM contacts WHERE id = $1`, [id]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Send a broadcast to all subscribed contacts.
app.post("/api/admin/broadcast", requireAdmin, async (req, res) => {
  try {
    const subject = clean(req.body?.subject, 200);
    const body = clean(req.body?.body, 50000);
    if (!subject || !body) return res.status(400).json({ ok: false, error: "Subject and message are required." });
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Email sending not configured." });

    const q = await pool.query(`SELECT email FROM contacts WHERE subscribed = TRUE`);
    const emails = q.rows.map((r) => r.email);
    if (!emails.length) return res.json({ ok: true, sent: 0, note: "No subscribers yet." });

    const bodyHtml = String(body).replace(/\n/g, "<br/>");
    let sent = 0;
    for (let i = 0; i < emails.length; i += 100) {
      const chunk = emails.slice(i, i + 100).map((email) => ({
        from: FROM(),
        to: email,
        subject,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2430;line-height:1.6">
            ${bodyHtml}
            <hr style="border:0;border-top:1px solid #e4e9ef;margin:22px 0" />
            <p style="font-size:12px;color:#9aa7b3">Peptides 4 Power · <a href="${PUBLIC_URL}" style="color:#9aa7b3">peptides4power.com</a><br/>
            <a href="${unsubUrl(email)}" style="color:#9aa7b3">Unsubscribe</a></p>
          </div>`,
      }));
      await resendSend(chunk);
      sent += chunk.length;
    }
    await logMarketing("broadcast", subject, body, { sent }).catch(() => {});
    return res.json({ ok: true, sent });
  } catch (err) {
    console.error("[broadcast]", err?.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ================================================================== */
/* AI Marketing Manager                                               */
/* ================================================================== */
const SYSTEM_MARKETING = `You are the AI Marketing Manager for Peptides 4 Power (peptides4power.com), David Furka's ("Dave") peptide-education and affiliate business.

Business model: Dave teaches peptides in plain English (videos, a weekly "Peptide of the Week", poetry) and earns affiliate commissions when people buy through his vetted-vendor discount codes. Vendors include AIO, Kimera, Flawless Compounds, Glow Aminos, Iron Protocol, and RefillPen; codes like POWER25 and POWER15. His audience: people overwhelmed by "so many peptide sites — I don't know where to start," who want one trusted guide.

Your job: be his hands-on marketing manager. Give sharp, specific, actionable ideas and ready-to-use copy — email campaigns and subject lines, sale angles, social and ad hooks, Peptide of the Week themes, content ideas, and audience strategy. Use the live context provided. Be concrete and concise; when asked for copy, write it ready to send, in Dave's plain, confident voice — no hype, no fluff.

Compliance: everything is for research & educational purposes only. Never make medical or disease-treatment claims or promise health outcomes.`;

app.get("/api/admin/marketing/log", requireAdmin, async (_req, res) => {
  try {
    const q = await pool.query(`SELECT id,type,title,body,meta,created_at FROM marketing_log ORDER BY created_at DESC LIMIT 200`);
    return res.json({ ok: true, log: q.rows });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});
app.post("/api/admin/marketing/log", requireAdmin, async (req, res) => {
  try {
    await logMarketing(clean(req.body?.type, 30) || "note", clean(req.body?.title, 200), clean(req.body?.body, 50000), req.body?.meta || null);
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});
app.delete("/api/admin/marketing/log/:id", requireAdmin, async (req, res) => {
  try { await pool.query(`DELETE FROM marketing_log WHERE id = $1`, [parseInt(req.params.id, 10)]); return res.json({ ok: true }); }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

app.post("/api/admin/marketing/ai", requireAdmin, async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ ok: false, error: "The AI Marketing Manager isn't switched on yet — add your Anthropic API key to enable it." });
    }
    const message = clean(req.body?.message, 6000);
    if (!message) return res.status(400).json({ ok: false, error: "What would you like ideas on?" });

    let subs = 0, recent = [];
    if (pool) {
      const s = await pool.query(`SELECT COUNT(*) FILTER (WHERE subscribed)::int AS subs FROM contacts`);
      subs = s.rows[0]?.subs || 0;
      const r = await pool.query(`SELECT type,title,created_at FROM marketing_log ORDER BY created_at DESC LIMIT 15`);
      recent = r.rows;
    }
    const ctx = `Live context:
- Newsletter subscribers: ${subs}
- Recent marketing activity (most recent first):
${recent.length ? recent.map((e) => `  • ${new Date(e.created_at).toISOString().slice(0, 10)} [${e.type}] ${e.title || ""}`).join("\n") : "  (nothing logged yet)"}`;

    const anthropic = new Anthropic();
    const out = await anthropic.messages.create({
      model: process.env.AI_MODEL || "claude-opus-5-5",
      max_tokens: 2000,
      system: SYSTEM_MARKETING,
      messages: [{ role: "user", content: `${ctx}\n\nMy request: ${message}` }],
    });
    const reply = out.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return res.json({ ok: true, reply });
  } catch (err) {
    console.error("[ai]", err?.message);
    return res.status(500).json({ ok: false, error: "The AI had a problem — please try again." });
  }
});

/* ================================================================== */
/* Membership — the coaching community                                */
/* ================================================================== */
function hmac(s) { return crypto.createHmac("sha256", SESSION_SECRET).update(s).digest("hex"); }
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  try { return crypto.timingSafeEqual(crypto.scryptSync(pw, salt, 64), Buffer.from(hash, "hex")); } catch { return false; }
}
function makeMemberToken(id) {
  const body = `${id}.${Date.now() + 30 * 24 * 60 * 60 * 1000}`;
  return `${body}.${hmac(body)}`;
}
function memberIdFromToken(tok) {
  if (!tok) return null;
  const [id, exp, sig] = String(tok).split(".");
  if (!id || !exp || !sig) return null;
  const expect = hmac(`${id}.${exp}`);
  try { if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null; } catch { return null; }
  return Date.now() < Number(exp) ? (parseInt(id, 10) || null) : null;
}
function setMemberCookie(res, id) {
  res.setHeader("Set-Cookie", `p4p_member=${makeMemberToken(id)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`);
}
async function currentMember(req) {
  const id = memberIdFromToken(readCookie(req, "p4p_member"));
  if (!id || !pool) return null;
  const q = await pool.query(`SELECT id,email,name,status FROM members WHERE id = $1`, [id]);
  return q.rows[0] || null;
}

app.post("/api/member/register", async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ ok: false, error: "Signups are temporarily unavailable." });
    const email = clean(req.body?.email, 200)?.toLowerCase();
    const name = clean(req.body?.name, 120);
    const password = String(req.body?.password || "");
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: "Enter a valid email." });
    if (password.length < 8) return res.status(400).json({ ok: false, error: "Password must be at least 8 characters." });
    if (req.body?.waiver !== true) return res.status(400).json({ ok: false, error: "You must accept the membership agreement." });
    if ((await pool.query(`SELECT 1 FROM members WHERE email = $1`, [email])).rows[0])
      return res.status(409).json({ ok: false, error: "An account with that email already exists — try logging in." });

    const status = FREE_BETA ? "active" : "pending";
    const m = (await pool.query(
      `INSERT INTO members (email, password_hash, name, status, waiver_version, waiver_signed_at)
       VALUES ($1,$2,$3,$4,$5, now()) RETURNING id,email,name,status`,
      [email, hashPassword(password), name, status, WAIVER_VERSION]
    )).rows[0];
    await pool.query(
      `INSERT INTO contacts (email, name, source, status, subscribed, tags)
       VALUES ($1,$2,'coaching-member','customer',TRUE,ARRAY['member'])
       ON CONFLICT (email) DO UPDATE SET status='customer',
         tags=ARRAY(SELECT DISTINCT unnest(contacts.tags || ARRAY['member'])), updated_at=now()`,
      [email, name]
    ).catch(() => {});
    setMemberCookie(res, m.id);
    return res.json({ ok: true, member: { name: m.name, email: m.email, status: m.status } });
  } catch (err) {
    console.error("[member register]", err?.message);
    return res.status(500).json({ ok: false, error: "Something went wrong — please try again." });
  }
});

app.post("/api/member/login", async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ ok: false, error: "Login is temporarily unavailable." });
    const email = clean(req.body?.email, 200)?.toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) return res.status(400).json({ ok: false, error: "Enter your email and password." });
    const row = (await pool.query(`SELECT id,password_hash FROM members WHERE email = $1`, [email])).rows[0];
    if (!row || !verifyPassword(password, row.password_hash)) return res.status(401).json({ ok: false, error: "Incorrect email or password." });
    setMemberCookie(res, row.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Something went wrong — please try again." });
  }
});

app.post("/api/member/logout", (_req, res) => {
  res.setHeader("Set-Cookie", "p4p_member=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  return res.json({ ok: true });
});

app.get("/api/member/me", async (req, res) => {
  const m = await currentMember(req).catch(() => null);
  if (!m) return res.status(401).json({ ok: false });
  return res.json({
    ok: true,
    member: { name: m.name, email: m.email, status: m.status },
    discountCode: m.status === "active" ? MEMBER_DISCOUNT_CODE : null,
  });
});

/* ================================================================== */
/* Static site + SPA fallback                                         */
/* ================================================================== */
app.use("/api", (_req, res) => res.status(404).json({ ok: false, error: "Not found" }));
app.use(express.static(DIST, { maxAge: "1h", redirect: false }));
app.get("*", (_req, res) => res.sendFile(path.join(DIST, "index.html")));

app.listen(PORT, () => console.log(`[p4p] listening on :${PORT}`));
initDb().catch((e) => console.error("[db] init failed:", e?.message));
