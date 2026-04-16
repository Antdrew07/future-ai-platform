/**
 * Seed all Future AI models into the model_pricing table.
 * Run with: node scripts/seed-models.mjs
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

// tier enum: "standard" | "premium" | "ultra"
const models = [
  // ── Future Agent (Built-in Forge) ──
  { modelId: "future-agent-1", displayName: "Future-1 Ultra", provider: "future", contextWindow: 128000, creditsPerInputToken: 1, creditsPerOutputToken: 2, creditsPerToolCall: 1, isActive: 1, tier: "standard" },
  // ── OpenAI ──
  { modelId: "gpt-4o", displayName: "Future-1 Pro", provider: "openai", contextWindow: 128000, creditsPerInputToken: 2, creditsPerOutputToken: 4, creditsPerToolCall: 1, isActive: 1, tier: "premium" },
  { modelId: "gpt-4o-mini", displayName: "Future-1 Mini", provider: "openai", contextWindow: 128000, creditsPerInputToken: 1, creditsPerOutputToken: 1, creditsPerToolCall: 0, isActive: 1, tier: "standard" },
  // ── Anthropic ──
  { modelId: "claude-3-5-sonnet-20241022", displayName: "Future-1 Code", provider: "anthropic", contextWindow: 200000, creditsPerInputToken: 3, creditsPerOutputToken: 6, creditsPerToolCall: 1, isActive: 1, tier: "premium" },
  { modelId: "claude-3-haiku-20240307", displayName: "Future-1 Fast", provider: "anthropic", contextWindow: 200000, creditsPerInputToken: 1, creditsPerOutputToken: 1, creditsPerToolCall: 0, isActive: 1, tier: "standard" },
  { modelId: "claude-opus-4-5", displayName: "Future-1 Opus", provider: "anthropic", contextWindow: 200000, creditsPerInputToken: 15, creditsPerOutputToken: 30, creditsPerToolCall: 2, isActive: 1, tier: "ultra" },
  // ── Perplexity ──
  { modelId: "sonar-pro", displayName: "Future Search Pro", provider: "perplexity", contextWindow: 200000, creditsPerInputToken: 3, creditsPerOutputToken: 6, creditsPerToolCall: 0, isActive: 1, tier: "premium" },
  { modelId: "sonar", displayName: "Future Search", provider: "perplexity", contextWindow: 128000, creditsPerInputToken: 1, creditsPerOutputToken: 2, creditsPerToolCall: 0, isActive: 1, tier: "standard" },
  // ── Google Gemini ──
  { modelId: "gemini-1.5-pro", displayName: "Future-1 Long", provider: "gemini", contextWindow: 1000000, creditsPerInputToken: 3, creditsPerOutputToken: 6, creditsPerToolCall: 1, isActive: 1, tier: "premium" },
  { modelId: "gemini-2.0-flash", displayName: "Future-1 Flash", provider: "gemini", contextWindow: 1000000, creditsPerInputToken: 1, creditsPerOutputToken: 2, creditsPerToolCall: 0, isActive: 1, tier: "standard" },
  // ── Groq ──
  { modelId: "llama-3.3-70b-versatile", displayName: "Future-1 Speed", provider: "groq", contextWindow: 128000, creditsPerInputToken: 1, creditsPerOutputToken: 1, creditsPerToolCall: 0, isActive: 1, tier: "standard" },
  { modelId: "llama-3.1-8b-instant", displayName: "Future-1 Instant", provider: "groq", contextWindow: 128000, creditsPerInputToken: 0, creditsPerOutputToken: 1, creditsPerToolCall: 0, isActive: 1, tier: "standard" },
];

let inserted = 0;
let updated = 0;

for (const model of models) {
  const [existing] = await db.execute("SELECT modelId FROM model_pricing WHERE modelId = ?", [model.modelId]);
  if (existing.length > 0) {
    await db.execute(
      `UPDATE model_pricing SET
        displayName = ?, provider = ?, contextWindow = ?,
        creditsPerInputToken = ?, creditsPerOutputToken = ?, creditsPerToolCall = ?,
        isActive = ?, tier = ?
       WHERE modelId = ?`,
      [
        model.displayName, model.provider, model.contextWindow,
        model.creditsPerInputToken, model.creditsPerOutputToken, model.creditsPerToolCall,
        model.isActive, model.tier,
        model.modelId,
      ]
    );
    updated++;
  } else {
    await db.execute(
      `INSERT INTO model_pricing
        (modelId, displayName, provider, contextWindow, creditsPerInputToken, creditsPerOutputToken, creditsPerToolCall, isActive, tier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        model.modelId, model.displayName, model.provider, model.contextWindow,
        model.creditsPerInputToken, model.creditsPerOutputToken, model.creditsPerToolCall,
        model.isActive, model.tier,
      ]
    );
    inserted++;
  }
}

console.log(`✅ Models seeded: ${inserted} inserted, ${updated} updated`);
await db.end();
