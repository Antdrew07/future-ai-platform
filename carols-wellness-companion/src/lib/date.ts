// Date helpers. Calendar "dates" (weigh-ins, dose logs, etc.) are stored at
// UTC midnight so a given calendar day maps to exactly one Date value,
// independent of the server timezone.

/** Return a Date at UTC midnight for the given year/month(0-11)/day. */
export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

/** Normalize any Date to UTC midnight of the same calendar day. */
export function dateOnly(d: Date): Date {
  return utcDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Today's calendar date at UTC midnight (based on server local wall clock). */
export function today(): Date {
  const now = new Date();
  return utcDate(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Format a Date as an ISO calendar date string (YYYY-MM-DD). */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse a YYYY-MM-DD string to a Date at UTC midnight. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return utcDate(y, (m ?? 1) - 1, d ?? 1);
}

/** Whole-day difference b - a (a and b normalized to UTC midnight). */
export function daysBetween(a: Date, b: Date): number {
  const ms = dateOnly(b).getTime() - dateOnly(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Human-friendly long date, e.g. "Tuesday, July 14". */
export function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Time-of-day aware greeting based on the server local hour. */
export function greeting(name = 'Carol'): string {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name}`;
}
