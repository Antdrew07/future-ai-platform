import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'carol_session';
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

/** Constant-time comparison of the submitted passcode against APP_PASSCODE. */
export function checkPasscode(input: string): boolean {
  const expected = process.env.APP_PASSCODE || '';
  if (!expected) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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
