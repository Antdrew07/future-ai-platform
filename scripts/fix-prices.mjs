import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

// Fix subscription plan prices (stored incorrectly in cents for some)
await conn.execute(`UPDATE subscription_plans SET priceUsd = 19 WHERE name = 'Starter'`);
await conn.execute(`UPDATE subscription_plans SET priceUsd = 49 WHERE name = 'Pro'`);
await conn.execute(`UPDATE subscription_plans SET priceUsd = 99 WHERE name = 'Business'`);
await conn.execute(`UPDATE subscription_plans SET priceUsd = 199 WHERE name = 'Enterprise'`);

// Fix credit pack prices (stored incorrectly in cents for some)
await conn.execute(`UPDATE credit_packs SET priceUsd = 9.99  WHERE name = 'Starter Pack'`);
await conn.execute(`UPDATE credit_packs SET priceUsd = 39.99 WHERE name = 'Growth Pack'`);
await conn.execute(`UPDATE credit_packs SET priceUsd = 99.99 WHERE name = 'Pro Pack'`);
await conn.execute(`UPDATE credit_packs SET priceUsd = 299.99 WHERE name = 'Enterprise Pack'`);

// Also fix the Free plan monthly credits to match the fallback (100 → 500)
await conn.execute(`UPDATE subscription_plans SET monthlyCredits = 500 WHERE name = 'Free'`);

// Verify
const [plans] = await conn.execute('SELECT name, priceUsd, monthlyCredits FROM subscription_plans WHERE isActive = 1');
console.log('✅ Fixed Subscription Plans:');
console.table(plans);

const [packs] = await conn.execute('SELECT name, priceUsd, credits FROM credit_packs WHERE isActive = 1');
console.log('✅ Fixed Credit Packs:');
console.table(packs);

await conn.end();
console.log('Done!');
