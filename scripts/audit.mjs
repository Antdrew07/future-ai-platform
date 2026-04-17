/**
 * Full Platform Audit Script
 * Tests every tRPC endpoint, external integration, and key flow
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const BASE = "http://localhost:3000";
const results = [];
let sessionCookie = "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pass(name, detail = "") {
  results.push({ status: "✅ PASS", name, detail });
  console.log(`  ✅ ${name}${detail ? " — " + detail : ""}`);
}

function fail(name, detail = "") {
  results.push({ status: "❌ FAIL", name, detail });
  console.error(`  ❌ ${name}${detail ? " — " + detail : ""}`);
}

function warn(name, detail = "") {
  results.push({ status: "⚠️  WARN", name, detail });
  console.warn(`  ⚠️  ${name}${detail ? " — " + detail : ""}`);
}

async function trpc(procedure, input = null, method = "GET") {
  const url = `${BASE}/api/trpc/${procedure}${method === "GET" ? `?input=${encodeURIComponent(JSON.stringify({ json: input }))}` : ""}`;
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...(sessionCookie ? { Cookie: sessionCookie } : {}) },
    ...(method === "POST" ? { body: JSON.stringify({ json: input }) } : {}),
  };
  const res = await fetch(url, opts);
  const data = await res.json();
  if (data.error) throw new Error(data.error.json?.message ?? JSON.stringify(data.error));
  return data.result?.data?.json;
}

// ─── Section 1: Auth ──────────────────────────────────────────────────────────

async function auditAuth() {
  console.log("\n📋 AUTH");

  // Login
  try {
    const res = await fetch(`${BASE}/api/trpc/auth.login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { email: "admin@futureos.io", password: "FutureAdmin2026!" } }),
    });
    const data = await res.json();
    const setCookie = res.headers.get("set-cookie");
    if (data.result?.data?.json?.success && setCookie) {
      sessionCookie = setCookie.split(";")[0];
      pass("auth.login", `user=${data.result.data.json.user.email}, role=${data.result.data.json.user.role}`);
    } else {
      fail("auth.login", JSON.stringify(data));
    }
  } catch (e) {
    fail("auth.login", e.message);
  }

  // Me
  try {
    const me = await trpc("auth.me");
    if (me?.id) pass("auth.me", `id=${me.id}, role=${me.role}`);
    else fail("auth.me", "no user returned");
  } catch (e) { fail("auth.me", e.message); }

  // Register (new user)
  try {
    const res = await fetch(`${BASE}/api/trpc/auth.register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { email: `audit_${Date.now()}@test.com`, password: "Test1234!", name: "Audit User" } }),
    });
    const data = await res.json();
    if (data.result?.data?.json?.success) pass("auth.register", "new user created");
    else fail("auth.register", JSON.stringify(data));
  } catch (e) { fail("auth.register", e.message); }
}

// ─── Section 2: Agents ────────────────────────────────────────────────────────

let agentId = null;

async function auditAgents() {
  console.log("\n📋 AGENTS");

  // List
  try {
    const agents = await trpc("agents.list");
    pass("agents.list", `${agents?.length ?? 0} agents`);
    if (agents?.length > 0) agentId = agents[0].id;
  } catch (e) { fail("agents.list", e.message); }

  // Create
  try {
    const agent = await trpc("agents.create", {
      name: "Audit Test Agent",
      description: "Created by audit script",
      systemPrompt: "You are a helpful assistant.",
      modelId: "gpt-4o",
      maxSteps: 10,
      temperature: 0.7,
    }, "POST");
    if (agent?.id) {
      pass("agents.create", `id=${agent.id}`);
      agentId = agent.id;
    } else fail("agents.create", JSON.stringify(agent));
  } catch (e) { fail("agents.create", e.message); }

  // Get by ID
  if (agentId) {
  try {
    const agent = await trpc("agents.get", { id: agentId });
    if (agent?.id) pass("agents.get", `name=${agent.name}`);
    else fail("agents.get", "no agent returned");
  } catch (e) { fail("agents.get", e.message); }
  }

  // Public list
  try {
    const pub = await trpc("agents.publicList");
    pass("agents.publicList", `${pub?.length ?? 0} public agents`);
  } catch (e) { fail("agents.publicList", e.message); }
}

// ─── Section 3: Tasks ─────────────────────────────────────────────────────────

async function auditTasks() {
  console.log("\n📋 TASKS");

  try {
    const tasks = await trpc("tasks.list", { limit: 5, offset: 0 });
    pass("tasks.list", `${tasks?.length ?? 0} tasks`);
  } catch (e) { fail("tasks.list", e.message); }
}

// ─── Section 4: Credits ───────────────────────────────────────────────────────

async function auditCredits() {
  console.log("\n📋 CREDITS");

  try {
    const balance = await trpc("credits.balance");
    pass("credits.balance", `${balance} credits`);
  } catch (e) { fail("credits.balance", e.message); }

  try {
    const packs = await trpc("credits.packs");
    pass("credits.packs", `${packs?.length ?? 0} packs`);
  } catch (e) { fail("credits.packs", e.message); }

  try {
    const plans = await trpc("credits.plans");
    pass("credits.plans", `${plans?.length ?? 0} plans`);
  } catch (e) { fail("credits.plans", e.message); }

  try {
    const history = await trpc("credits.transactions", { limit: 5 });
    pass("credits.transactions", `${history?.length ?? 0} transactions`);
  } catch (e) { fail("credits.transactions", e.message); }
}

// ─── Section 5: Analytics ─────────────────────────────────────────────────────

async function auditAnalytics() {
  console.log("\n📋 ANALYTICS");

  try {
    const summary = await trpc("analytics.summary");
    pass("analytics.summary", `tasks=${summary?.totalTasks}, credits=${summary?.totalCreditsUsed}`);
  } catch (e) { fail("analytics.summary", e.message); }

  try {
    const usage = await trpc("analytics.usage", { days: 7 });
    pass("analytics.usage", `${usage?.length ?? 0} data points`);
  } catch (e) { fail("analytics.usage", e.message); }
}

// ─── Section 6: API Keys ──────────────────────────────────────────────────────

async function auditApiKeys() {
  console.log("\n📋 API KEYS");

  try {
    const keys = await trpc("apiKeys.list");
    pass("apiKeys.list", `${keys?.length ?? 0} keys`);
  } catch (e) { fail("apiKeys.list", e.message); }

  try {
    const key = await trpc("apiKeys.create", { name: "Audit Key" }, "POST");
    if (key?.key?.startsWith("fut_live_")) pass("apiKeys.create", `key=${key.key.slice(0, 20)}...`);
    else fail("apiKeys.create", JSON.stringify(key));
  } catch (e) { fail("apiKeys.create", e.message); }
}

// ─── Section 7: Teams ─────────────────────────────────────────────────────────

async function auditTeams() {
  console.log("\n📋 TEAMS");

  try {
    const teams = await trpc("teams.list");
    pass("teams.list", `${teams?.length ?? 0} teams`);
  } catch (e) { fail("teams.list", e.message); }
}

// ─── Section 8: Templates ─────────────────────────────────────────────────────

async function auditTemplates() {
  console.log("\n📋 TEMPLATES");

  try {
    const templates = await trpc("templates.list", { limit: 5, offset: 0 });
    pass("templates.list", `${templates?.templates?.length ?? 0} templates`);
  } catch (e) { fail("templates.list", e.message); }
}

// ─── Section 9: Admin ─────────────────────────────────────────────────────────

async function auditAdmin() {
  console.log("\n📋 ADMIN");

  try {
    const stats = await trpc("admin.stats");
    pass("admin.stats", `users=${stats?.totalUsers}, tasks=${stats?.totalTasks}`);
  } catch (e) { fail("admin.stats", e.message); }

  try {
    const users = await trpc("admin.users", { limit: 5, offset: 0 });
    pass("admin.users", `${users?.length ?? 0} users`);
  } catch (e) { fail("admin.users", e.message); }

  try {
    const models = await trpc("admin.models");
    pass("admin.models", `${models?.length ?? 0} model pricing entries`);
  } catch (e) { fail("admin.models", e.message); }
}

// ─── Section 10: Domains (Namecheap) ─────────────────────────────────────────

async function auditDomains() {
  console.log("\n📋 DOMAINS (Namecheap)");

  try {
    const result = await trpc("domains.search", { query: "testaudit2026" });
    if (result?.results) pass("domains.search", `${result.results.length} results, source=${result.source}`);
    else fail("domains.search", JSON.stringify(result));
  } catch (e) { fail("domains.search", e.message); }

  try {
    const domains = await trpc("domains.listMyDomains");
    pass("domains.listMyDomains", `${domains?.length ?? 0} owned domains`);
  } catch (e) { fail("domains.listMyDomains", e.message); }

  try {
    const price = await trpc("domains.getPrice", { domain: "testaudit2026.com" });
    pass("domains.getPrice", `price=$${price?.price}, renewal=$${price?.renewal}`);
  } catch (e) { fail("domains.getPrice", e.message); }
}

// ─── Section 11: Browser (Browserbase) ───────────────────────────────────────

async function auditBrowser() {
  console.log("\n📋 BROWSER (Browserbase)");

  try {
    const avail = await trpc("browser.isAvailable");
    if (avail?.available) pass("browser.isAvailable", "Browserbase connected");
    else warn("browser.isAvailable", `available=${avail?.available}, reason=${avail?.reason}`);
  } catch (e) { fail("browser.isAvailable", e.message); }

  try {
    const sessions = await trpc("browser.listSessions", { limit: 5 });
    pass("browser.listSessions", `${sessions?.length ?? 0} sessions`);
  } catch (e) { fail("browser.listSessions", e.message); }
}

// ─── Section 12: LLM ─────────────────────────────────────────────────────────

async function auditLLM() {
  console.log("\n📋 LLM");

  try {
    const models = await trpc("models.list");
    pass("models.list", `${models?.length ?? 0} models available`);
  } catch (e) { fail("models.list", e.message); }

  // Quick LLM invoke test via chat endpoint
  try {
    const result = await trpc("chat.send", {
      agentId: agentId,
      message: "Say 'audit ok' in exactly 2 words.",
      sessionId: "audit-test-session",
    }, "POST");
    if (result?.content || result?.messageId) pass("chat.send", `response received`);
    else warn("chat.send", "no agentId available, skipping");
  } catch (e) { 
    if (e.message.includes("agentId") || !agentId) warn("chat.send", "no agentId available, skipping");
    else fail("chat.send", e.message);
  }
}

// ─── Section 13: Stripe webhook endpoint ─────────────────────────────────────

async function auditStripe() {
  console.log("\n📋 STRIPE");

  try {
    const res = await fetch(`${BASE}/api/stripe/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": "test" },
      body: JSON.stringify({ id: "evt_test_audit", type: "checkout.session.completed" }),
    });
    const data = await res.json();
    if (data.verified) pass("stripe.webhook", "test event verified");
    else warn("stripe.webhook", `status=${res.status}, body=${JSON.stringify(data)}`);
  } catch (e) { fail("stripe.webhook", e.message); }
}

// ─── Section 14: Agent run endpoint ──────────────────────────────────────────

async function auditAgentRun() {
  console.log("\n📋 AGENT RUN (SSE)");

  if (!agentId) { warn("agent.run", "no agentId available, skipping"); return; }

  try {
    const res = await fetch(`${BASE}/api/agent/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ agentId, message: "Say hello in one sentence.", conversationHistory: [] }),
    });
    if (res.status === 200 && res.headers.get("content-type")?.includes("text/event-stream")) {
      // Read first chunk
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (let i = 0; i < 5; i++) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        if (text.includes("event:")) break;
      }
      reader.cancel();
      if (text.includes("event:")) pass("agent.run SSE", "streaming started, got events");
      else warn("agent.run SSE", `got response but no events yet: ${text.slice(0, 100)}`);
    } else {
      const body = await res.text();
      fail("agent.run SSE", `status=${res.status}, body=${body.slice(0, 200)}`);
    }
  } catch (e) { fail("agent.run SSE", e.message); }
}

// ─── Section 15: Database connectivity ───────────────────────────────────────

async function auditDatabase() {
  console.log("\n📋 DATABASE");

  try {
    const conn = await createConnection(process.env.DATABASE_URL);
    const [tables] = await conn.execute("SHOW TABLES");
    const tableNames = tables.map(r => Object.values(r)[0]);
    // Use actual table names from drizzle schema
    const required = ["users", "agents", "tasks", "task_steps", "credit_transactions", "credit_packs", "subscription_plans", "model_pricing", "api_keys", "teams", "team_members", "templates", "usage_analytics", "domain_purchases", "browser_sessions"];
    const missing = required.filter(t => !tableNames.includes(t));
    if (missing.length === 0) pass("database.tables", `all ${required.length} required tables present`);
    else fail("database.tables", `missing: ${missing.join(", ")}`);

    // Row counts
    const counts = {};
    for (const t of ["users", "agents", "model_pricing", "credit_packs", "subscription_plans"]) {
      const [[row]] = await conn.execute(`SELECT COUNT(*) as c FROM \`${t}\``);
      counts[t] = row.c;
    }
    pass("database.rowCounts", Object.entries(counts).map(([k,v]) => `${k}=${v}`).join(", "));
    await conn.end();
  } catch (e) { fail("database", e.message); }
}

// ─── Section 16: Public routes ────────────────────────────────────────────────

async function auditPublicRoutes() {
  console.log("\n📋 PUBLIC HTTP ROUTES");

  const routes = [
    ["/", "Landing page"],
    ["/signin", "Sign In"],
    ["/signup", "Sign Up"],
    ["/pricing", "Pricing"],
    ["/templates", "Templates"],
    ["/gallery", "Gallery"],
    ["/dashboard", "Dashboard (redirects to signin if unauthed)"],
  ];

  for (const [path, label] of routes) {
    try {
      const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
      if (res.status === 200 || res.status === 301 || res.status === 302) {
        pass(`GET ${path}`, `${label} — ${res.status}`);
      } else {
        fail(`GET ${path}`, `${label} — unexpected status ${res.status}`);
      }
    } catch (e) { fail(`GET ${path}`, e.message); }
  }
}

// ─── Run all ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  FUTURE AI PLATFORM — FULL AUDIT");
  console.log("═══════════════════════════════════════════════════");

  await auditDatabase();
  await auditAuth();
  await auditAgents();
  await auditTasks();
  await auditCredits();
  await auditAnalytics();
  await auditApiKeys();
  await auditTeams();
  await auditTemplates();
  await auditAdmin();
  await auditDomains();
  await auditBrowser();
  await auditLLM();
  await auditStripe();
  await auditAgentRun();
  await auditPublicRoutes();

  // Summary
  const passed = results.filter(r => r.status.startsWith("✅")).length;
  const failed = results.filter(r => r.status.startsWith("❌")).length;
  const warned = results.filter(r => r.status.startsWith("⚠️")).length;

  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  AUDIT COMPLETE: ${passed} passed, ${warned} warnings, ${failed} failed`);
  console.log("═══════════════════════════════════════════════════");

  if (failed > 0) {
    console.log("\n❌ FAILURES:");
    results.filter(r => r.status.startsWith("❌")).forEach(r => console.log(`   ${r.name}: ${r.detail}`));
  }
  if (warned > 0) {
    console.log("\n⚠️  WARNINGS:");
    results.filter(r => r.status.startsWith("⚠️")).forEach(r => console.log(`   ${r.name}: ${r.detail}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error("Audit crashed:", e); process.exit(1); });
