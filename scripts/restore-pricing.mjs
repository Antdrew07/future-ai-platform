import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

// Restore original pricing from Pricing.tsx strategy
// Starter: $49, Pro: $100, Business: $199, Enterprise: $500
await conn.execute(`UPDATE subscription_plans SET priceUsd = 0,   monthlyCredits = 500    WHERE name = 'Free'`);
await conn.execute(`UPDATE subscription_plans SET priceUsd = 49,  monthlyCredits = 2000   WHERE name = 'Starter'`);
await conn.execute(`UPDATE subscription_plans SET priceUsd = 100, monthlyCredits = 8000   WHERE name = 'Pro'`);
await conn.execute(`UPDATE subscription_plans SET priceUsd = 199, monthlyCredits = 100000 WHERE name = 'Business'`);
await conn.execute(`UPDATE subscription_plans SET priceUsd = 500, monthlyCredits = 50000  WHERE name = 'Enterprise'`);

// Verify
const [plans] = await conn.execute('SELECT name, priceUsd, monthlyCredits FROM subscription_plans WHERE isActive = 1 ORDER BY priceUsd ASC');
console.log('✅ Restored Subscription Plans:');
console.table(plans);

await conn.end();
console.log('Done!');
