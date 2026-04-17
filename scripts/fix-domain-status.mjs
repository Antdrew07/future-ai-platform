import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Dynadot expiry timestamp: 1807981163000 ms = April 2027
const expiresAt = new Date(1807981163000);
const now = new Date();

const [result] = await conn.execute(
  `UPDATE domain_purchases SET status = 'active', expiresAt = ?, updatedAt = ? WHERE domain = ?`,
  [expiresAt, now, "futureaiplatform2026test.com"]
);

console.log("Rows updated:", result.affectedRows);

const [rows] = await conn.execute(
  `SELECT domain, status, expiresAt FROM domain_purchases WHERE domain = ?`,
  ["futureaiplatform2026test.com"]
);
console.log("Current record:", rows[0]);

await conn.end();
