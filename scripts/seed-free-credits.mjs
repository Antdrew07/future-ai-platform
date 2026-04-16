/**
 * One-time script: grant 100 free starter credits to every existing user
 * who currently has 0 credits. Safe to run multiple times (idempotent).
 */
import { createRequire } from "module";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const mysql2 = createRequire(import.meta.url)("mysql2/promise");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql2.createConnection(DATABASE_URL);

// Find all users with 0 credit balance
const [users] = await conn.execute(
  "SELECT id, name, email FROM users WHERE creditBalance = 0 OR creditBalance IS NULL"
);
console.log(`Found ${users.length} user(s) with 0 credits`);

for (const user of users) {
  await conn.execute(
    "UPDATE users SET creditBalance = creditBalance + 100 WHERE id = ?",
    [user.id]
  );
  await conn.execute(
    "INSERT INTO credit_transactions (userId, amount, type, description, balanceAfter) VALUES (?, ?, ?, ?, ?)",
    [user.id, 100, "bonus", "Welcome gift — 100 free credits to get you started", 100]
  );
  console.log(`  ✓ Granted 100 credits to ${user.name || user.email} (id=${user.id})`);
}

await conn.end();
console.log("Done.");
