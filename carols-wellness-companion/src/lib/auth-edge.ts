// Edge-runtime-safe session verification using the Web Crypto API.
// Mirrors the HMAC scheme in lib/auth.ts (which uses Node's crypto) so tokens
// issued by the login route validate in middleware.

// Defined here (an edge-safe module) so middleware can import it without
// pulling in Node's `crypto`.
export const SESSION_COOKIE = 'carol_session';

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.APP_PASSCODE ||
    'carol-wellness-dev-secret'
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacHex(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toHex(sig);
}

export async function verifySessionTokenEdge(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = await hmacHex(payload);
  if (sig.length !== expected.length) return false;
  // constant-time-ish compare
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
