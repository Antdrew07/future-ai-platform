/**
 * Creates an admin user account for testing.
 * Run with: node scripts/create-admin.mjs
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
config({ path: resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const email = "admin@futureos.io";
const password = "FutureAdmin2026!";
const name = "Future Admin";
const openId = "admin-local-001";

const passwordHash = bcrypt.hashSync(password, 12);

const conn = await createConnection(DATABASE_URL);

try {
  // Check if admin already exists
  const [existing] = await conn.execute(
    "SELECT id, email, role FROM users WHERE email = ? OR openId = ?",
    [email, openId]
  );

  if (existing.length > 0) {
    const user = existing[0];
    console.log(`\n✓ Admin user already exists (id=${user.id})`);
    // Update role to admin and set password hash just in case
    await conn.execute(
      "UPDATE users SET role = 'admin', passwordHash = ?, creditBalance = 10000, name = ? WHERE id = ?",
      [passwordHash, name, user.id]
    );
    console.log("✓ Updated to admin role + refreshed password + set 10,000 credits");
  } else {
    // Insert new admin user
    const [result] = await conn.execute(
      `INSERT INTO users (openId, name, email, loginMethod, passwordHash, role, creditBalance, apiQuota)
       VALUES (?, ?, ?, 'email', ?, 'admin', 10000, 9999)`,
      [openId, name, email, passwordHash]
    );
    console.log(`\n✓ Admin user created (id=${result.insertId})`);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  ADMIN LOGIN CREDENTIALS");
  console.log("═══════════════════════════════════════");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role:     admin`);
  console.log(`  Credits:  10,000`);
  console.log("═══════════════════════════════════════\n");

} finally {
  await conn.end();
}
