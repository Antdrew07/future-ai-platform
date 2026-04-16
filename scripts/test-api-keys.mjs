/**
 * Quick API key validation script — tests each provider with a minimal call
 */
import dotenv from "dotenv";
dotenv.config();

const results = [];

// ── Perplexity ──
try {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
  });
  const data = await res.json();
  results.push({ provider: "Perplexity", status: res.ok ? "✅ OK" : `❌ ${data.error?.message ?? res.status}` });
} catch (e) {
  results.push({ provider: "Perplexity", status: `❌ ${e.message}` });
}

// ── Anthropic ──
try {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "claude-haiku-4-5", max_tokens: 5, messages: [{ role: "user", content: "Say OK" }] }),
  });
  const data = await res.json();
  results.push({ provider: "Anthropic", status: res.ok ? "✅ OK" : `❌ ${data.error?.message ?? res.status}` });
} catch (e) {
  results.push({ provider: "Anthropic", status: `❌ ${e.message}` });
}

// ── Google Gemini ──
try {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Say OK" }] }], generationConfig: { maxOutputTokens: 5 } }),
  });
  const data = await res.json();
  results.push({ provider: "Google Gemini", status: res.ok ? "✅ OK" : `❌ ${data.error?.message ?? res.status}` });
} catch (e) {
  results.push({ provider: "Google Gemini", status: `❌ ${e.message}` });
}

// ── Groq ──
try {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
  });
  const data = await res.json();
  results.push({ provider: "Groq", status: res.ok ? "✅ OK" : `❌ ${data.error?.message ?? res.status}` });
} catch (e) {
  results.push({ provider: "Groq", status: `❌ ${e.message}` });
}

console.log("\n=== API Key Validation Results ===");
for (const r of results) {
  console.log(`  ${r.provider.padEnd(16)} ${r.status}`);
}
console.log("==================================\n");
