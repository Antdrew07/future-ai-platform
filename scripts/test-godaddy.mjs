import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const key = process.env.GODADDY_API_KEY;
const secret = process.env.GODADDY_API_SECRET;

console.log('GoDaddy API Key:', key ? key.substring(0, 10) + '...' : 'MISSING');
console.log('GoDaddy Secret:', secret ? '***present***' : 'MISSING');

if (!key || !secret) {
  console.error('Missing GoDaddy credentials');
  process.exit(1);
}

const headers = {
  'Authorization': `sso-key ${key}:${secret}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Test 1: Domain availability check
console.log('\n--- Test 1: Domain Availability ---');
try {
  const res = await fetch('https://api.godaddy.com/v1/domains/available?domain=futureaitest2026xyz.com', { headers });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
} catch (e) {
  console.error('Error:', e.message);
}

// Test 2: Get pricing
console.log('\n--- Test 2: Domain Pricing ---');
try {
  const res = await fetch('https://api.godaddy.com/v1/domains/tlds', { headers });
  const data = await res.json();
  console.log('Status:', res.status);
  if (Array.isArray(data)) {
    const comTld = data.find(t => t.name === 'COM');
    console.log('.COM TLD info:', JSON.stringify(comTld, null, 2));
  } else {
    console.log('Response:', JSON.stringify(data).substring(0, 300));
  }
} catch (e) {
  console.error('Error:', e.message);
}

// Test 3: Check account balance
console.log('\n--- Test 3: Account Info ---');
try {
  const res = await fetch('https://api.godaddy.com/v1/shoppers/me', { headers });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Account:', JSON.stringify(data, null, 2).substring(0, 500));
} catch (e) {
  console.error('Error:', e.message);
}
