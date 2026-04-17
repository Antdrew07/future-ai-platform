/**
 * Fix billing data: deduplicate credit_packs and subscription_plans tables,
 * then re-seed with the correct tiered subscription plans and top-up packs.
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await createConnection(url);

console.log("🔧 Cleaning up duplicate credit_packs...");
await conn.execute("DELETE FROM credit_packs");

console.log("🔧 Cleaning up duplicate subscription_plans...");
await conn.execute("DELETE FROM subscription_plans");

console.log("✅ Seeding subscription plans (tiered)...");
await conn.execute(`
  INSERT INTO subscription_plans (name, slug, monthlyCredits, priceUsd, maxAgents, maxTeamMembers, features, isActive)
  VALUES
    ('Free',       'free',       500,    0,   1,  1,  '["1 project","500 credits/month","Basic AI tasks","Community support"]',          1),
    ('Starter',    'starter',    5000,   9,   5,  1,  '["5 projects","5,000 credits/month","All task types","Email support"]',            1),
    ('Pro',        'pro',        25000,  29,  20, 5,  '["Unlimited projects","25,000 credits/month","Team collaboration","API access","Priority support"]', 1),
    ('Business',   'business',   100000, 99,  100,25, '["Everything in Pro","100,000 credits/month","Advanced analytics","Custom models","Dedicated support","SLA guarantee"]', 1)
`);

console.log("✅ Seeding top-up credit packs...");
await conn.execute(`
  INSERT INTO credit_packs (name, credits, priceUsd, isPopular, isActive)
  VALUES
    ('Small Top-up',  1000,  5,  0, 1),
    ('Medium Top-up', 5000,  19, 1, 1),
    ('Large Top-up',  15000, 49, 0, 1)
`);

console.log("✅ Done! Billing data is clean.");
await conn.end();
