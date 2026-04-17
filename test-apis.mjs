// Test GoDaddy and Browserbase API connectivity
const GODADDY_KEY = process.env.GODADDY_API_KEY;
const GODADDY_SECRET = process.env.GODADDY_API_SECRET;
const BB_KEY = process.env.BROWSERBASE_API_KEY;
const BB_PROJECT = process.env.BROWSERBASE_PROJECT_ID;

console.log("=== API Key Validation ===");
console.log("GoDaddy Key:", GODADDY_KEY ? `SET (${GODADDY_KEY.length} chars)` : "NOT SET");
console.log("GoDaddy Secret:", GODADDY_SECRET ? `SET (${GODADDY_SECRET.length} chars)` : "NOT SET");
console.log("Browserbase Key:", BB_KEY ? `SET (${BB_KEY.length} chars)` : "NOT SET");
console.log("Browserbase Project:", BB_PROJECT ? `SET` : "NOT SET");

// Test GoDaddy
console.log("\n--- Testing GoDaddy API ---");
try {
  const r = await fetch("https://api.godaddy.com/v1/domains/available?domain=happypawsdogwalking.com", {
    headers: {
      "Authorization": `sso-key ${GODADDY_KEY}:${GODADDY_SECRET}`,
      "Accept": "application/json"
    }
  });
  const d = await r.json();
  if (r.ok) {
    console.log("✅ GoDaddy API: CONNECTED");
    console.log("   Domain:", d.domain, "| Available:", d.available, "| Price:", d.price ? `$${(d.price/1000000).toFixed(2)}/yr` : "N/A");
  } else {
    console.log("❌ GoDaddy API: FAILED -", JSON.stringify(d));
  }
} catch (e) {
  console.log("❌ GoDaddy API: ERROR -", e.message);
}

// Test Browserbase
console.log("\n--- Testing Browserbase API ---");
try {
  const r = await fetch("https://www.browserbase.com/v1/sessions", {
    method: "GET",
    headers: {
      "x-bb-api-key": BB_KEY,
      "Content-Type": "application/json"
    }
  });
  if (r.ok) {
    const d = await r.json();
    console.log("✅ Browserbase API: CONNECTED");
    console.log("   Sessions found:", Array.isArray(d) ? d.length : JSON.stringify(d).substring(0, 100));
  } else {
    const d = await r.text();
    console.log("❌ Browserbase API: FAILED - HTTP", r.status, d.substring(0, 200));
  }
} catch (e) {
  console.log("❌ Browserbase API: ERROR -", e.message);
}
