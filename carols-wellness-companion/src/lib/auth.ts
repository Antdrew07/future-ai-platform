import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from './auth-edge';

export { SESSION_COOKIE };
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.APP_PASSCODE ||
    'carol-wellness-dev-secret'
  );
}

/**
 * Create a signed session token. The payload is a fixed marker + issued-at
 * timestamp; the signature proves the server (which holds the secret) issued it.
 */
export function createSessionToken(): string {
  const payload = `carol.${Date.now()}`;
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/** Constant-time verification of a session token. */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac('sha256', getSecret()).update(payload).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Built-in default passcode. Always accepted so the app is usable even if
 * APP_PASSCODE was left blank or set to an unexpected value on the host. */
export const DEFAULT_PASSCODE = 'carolwellness';

function safeEqual(a: string, b: string): boolean {
  if (!b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Accept the submitted passcode if it matches the configured APP_PASSCODE
 * (trimmed) OR the built-in DEFAULT_PASSCODE. Both sides are trimmed so a stray
 * space/newline can't cause a lockout. */
export function checkPasscode(input: string): boolean {
  const trimmed = String(input).trim();
  const configured = (process.env.APP_PASSCODE || '').trim();
  return safeEqual(trimmed, configured) || safeEqual(trimmed, DEFAULT_PASSCODE);
}

/** Case-insensitive check of the submitted username against APP_USERNAME. */
export function checkUsername(input: string): boolean {
  const expected = (process.env.APP_USERNAME || 'carol').trim().toLowerCase();
  return String(input).trim().toLowerCase() === expected;
}

/** Validate both username and passcode together. */
export function checkCredentials(username: string, passcode: string): boolean {
  // Evaluate both sides regardless of the username result to keep timing stable.
  const passOk = checkPasscode(passcode);
  const userOk = checkUsername(username);
  return userOk && passOk;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

/** Server-component/route helper: is the current request authenticated? */
export function isAuthenticated(): boolean {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
