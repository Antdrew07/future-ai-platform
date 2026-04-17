import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);
const [plans] = await conn.execute('SELECT name, priceUsd, monthlyCredits FROM subscription_plans WHERE isActive = 1');
console.log('Subscription Plans in DB:');
console.table(plans);
const [packs] = await conn.execute('SELECT name, priceUsd, credits FROM credit_packs WHERE isActive = 1');
console.log('Credit Packs in DB:');
console.table(packs);
await conn.end();
