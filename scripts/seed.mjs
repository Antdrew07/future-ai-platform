/**
 * Future AI Platform — Database Seed Script
 * Seeds model pricing, credit packs, and subscription plans.
 * Run: node scripts/seed.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// ─── Model Pricing ────────────────────────────────────────────────────────────
const models = [
  {
    id: "future-agent-1",
    displayName: "Future Agent",
    provider: "manus",
    tier: "ultra",
    creditsPerInputToken: 0.008,   // 8 credits per 1K input tokens
    creditsPerOutputToken: 0.024,  // 24 credits per 1K output tokens
    creditsPerToolCall: 0.5,       // 0.5 credits per tool call
    isActive: true,
    description: "The most powerful autonomous agent on the Future platform. Browses the web, executes code, manages files, and completes complex multi-step tasks end-to-end.",
    maxTokens: 32768,
    supportsTools: true,
    supportsVision: true,
  },
  {
    id: "gpt-4o",
    displayName: "GPT-4o",
    provider: "openai",
    tier: "premium",
    creditsPerInputToken: 0.005,
    creditsPerOutputToken: 0.015,
    creditsPerToolCall: 0.3,
    isActive: true,
    description: "OpenAI's most capable multimodal model. Excellent for complex reasoning and analysis.",
    maxTokens: 128000,
    supportsTools: true,
    supportsVision: true,
  },
  {
    id: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    provider: "openai",
    tier: "standard",
    creditsPerInputToken: 0.00015,
    creditsPerOutputToken: 0.0006,
    creditsPerToolCall: 0.05,
    isActive: true,
    description: "Fast and affordable OpenAI model. Great for simple tasks and high-volume use cases.",
    maxTokens: 128000,
    supportsTools: true,
    supportsVision: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    displayName: "Claude 3.5 Sonnet",
    provider: "anthropic",
    tier: "premium",
    creditsPerInputToken: 0.003,
    creditsPerOutputToken: 0.015,
    creditsPerToolCall: 0.3,
    isActive: true,
    description: "Anthropic's most intelligent model. Exceptional at coding, analysis, and nuanced tasks.",
    maxTokens: 200000,
    supportsTools: true,
    supportsVision: true,
  },
  {
    id: "claude-3-haiku-20240307",
    displayName: "Claude 3 Haiku",
    provider: "anthropic",
    tier: "standard",
    creditsPerInputToken: 0.00025,
    creditsPerOutputToken: 0.00125,
    creditsPerToolCall: 0.05,
    isActive: true,
    description: "Anthropic's fastest and most compact model. Ideal for quick responses and simple tasks.",
    maxTokens: 200000,
    supportsTools: true,
    supportsVision: true,
  },
];

// ─── Credit Packs ─────────────────────────────────────────────────────────────
const creditPacks = [
  {
    name: "Starter Pack",
    credits: 1000,
    price: 999,       // $9.99
    currency: "usd",
    stripePriceId: "price_starter",
    isPopular: false,
    description: "Perfect for trying out the platform",
  },
  {
    name: "Growth Pack",
    credits: 5000,
    price: 3999,      // $39.99
    currency: "usd",
    stripePriceId: "price_growth",
    isPopular: true,
    description: "Best value for regular users",
  },
  {
    name: "Pro Pack",
    credits: 15000,
    price: 9999,      // $99.99
    currency: "usd",
    stripePriceId: "price_pro",
    isPopular: false,
    description: "For power users and teams",
  },
  {
    name: "Enterprise Pack",
    credits: 50000,
    price: 29999,     // $299.99
    currency: "usd",
    stripePriceId: "price_enterprise",
    isPopular: false,
    description: "Maximum credits for large-scale usage",
  },
];

// ─── Subscription Plans ───────────────────────────────────────────────────────
const subscriptionPlans = [
  {
    name: "Free",
    price: 0,
    currency: "usd",
    interval: "month",
    creditsIncluded: 100,
    features: JSON.stringify(["100 credits/month", "3 agents", "Community support", "Basic analytics"]),
    stripePriceId: null,
    isActive: true,
  },
  {
    name: "Starter",
    price: 1900,      // $19/month
    currency: "usd",
    interval: "month",
    creditsIncluded: 2000,
    features: JSON.stringify(["2,000 credits/month", "10 agents", "Email support", "Full analytics", "API access"]),
    stripePriceId: "price_starter_monthly",
    isActive: true,
  },
  {
    name: "Pro",
    price: 4900,      // $49/month
    currency: "usd",
    interval: "month",
    creditsIncluded: 8000,
    features: JSON.stringify(["8,000 credits/month", "Unlimited agents", "Priority support", "Advanced analytics", "API access", "Team collaboration"]),
    stripePriceId: "price_pro_monthly",
    isActive: true,
  },
  {
    name: "Enterprise",
    price: 19900,     // $199/month
    currency: "usd",
    interval: "month",
    creditsIncluded: 50000,
    features: JSON.stringify(["50,000 credits/month", "Unlimited everything", "Dedicated support", "Custom integrations", "SLA guarantee", "White-label options"]),
    stripePriceId: "price_enterprise_monthly",
    isActive: true,
  },
];

console.log("🌱 Seeding database...\n");

// Insert models
console.log("📦 Seeding model pricing...");
for (const model of models) {
  try {
    await connection.execute(
      `INSERT INTO model_pricing (modelId, displayName, provider, tier, creditsPerInputToken, creditsPerOutputToken, creditsPerToolCall, isActive, contextWindow)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         displayName = VALUES(displayName),
         creditsPerInputToken = VALUES(creditsPerInputToken),
         creditsPerOutputToken = VALUES(creditsPerOutputToken),
         creditsPerToolCall = VALUES(creditsPerToolCall),
         isActive = VALUES(isActive)`,
      [
        model.id, model.displayName, model.provider, model.tier,
        model.creditsPerInputToken, model.creditsPerOutputToken, model.creditsPerToolCall,
        model.isActive ? 1 : 0, model.maxTokens,
      ]
    );
    console.log(`  ✓ ${model.displayName}`);
  } catch (err) {
    console.error(`  ✗ ${model.displayName}: ${err.message}`);
  }
}

// Insert credit packs
console.log("\n💳 Seeding credit packs...");
for (const pack of creditPacks) {
  try {
    await connection.execute(
      `INSERT INTO credit_packs (name, credits, priceUsd, stripePriceId, isPopular)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         credits = VALUES(credits),
         priceUsd = VALUES(priceUsd),
         isPopular = VALUES(isPopular)`,
      [pack.name, pack.credits, pack.price, pack.stripePriceId, pack.isPopular ? 1 : 0]
    );
    console.log(`  ✓ ${pack.name} (${pack.credits} credits @ $${(pack.price / 100).toFixed(2)})`);
  } catch (err) {
    console.error(`  ✗ ${pack.name}: ${err.message}`);
  }
}

// Insert subscription plans
console.log("\n📋 Seeding subscription plans...");
const planSlugs = { Free: "free", Starter: "starter", Pro: "pro", Enterprise: "enterprise" };
for (const plan of subscriptionPlans) {
  try {
    await connection.execute(
      `INSERT INTO subscription_plans (name, slug, priceUsd, monthlyCredits, stripePriceId, isActive, features)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         priceUsd = VALUES(priceUsd),
         monthlyCredits = VALUES(monthlyCredits),
         features = VALUES(features),
         isActive = VALUES(isActive)`,
      [plan.name, planSlugs[plan.name] ?? plan.name.toLowerCase(), plan.price, plan.creditsIncluded, plan.stripePriceId, plan.isActive ? 1 : 0, plan.features]
    );
    console.log(`  ✓ ${plan.name} ($${(plan.price / 100).toFixed(0)}/mo, ${plan.creditsIncluded} credits)`);
  } catch (err) {
    console.error(`  ✗ ${plan.name}: ${err.message}`);
  }
}

console.log("\n✅ Database seeded successfully!");
await connection.end();
