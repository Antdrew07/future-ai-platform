import type { Peptide } from '@prisma/client';
import { dateOnly, daysBetween } from './date';

/**
 * Determine whether a peptide is scheduled on a given calendar date.
 * - "daily"    → every day
 * - "weekdays" → only on the selected weekdays (0=Sun..6=Sat)
 * - "cycle"    → repeating on/off pattern anchored at cycleAnchor
 * Days before the cycle anchor are considered not scheduled.
 */
export function isPeptideDueOn(peptide: Peptide, date: Date): boolean {
  if (!peptide.active) return false;
  const day = dateOnly(date);

  switch (peptide.scheduleType) {
    case 'daily':
      return true;

    case 'weekdays': {
      const dow = day.getUTCDay();
      return peptide.weekdays.includes(dow);
    }

    case 'cycle': {
      const on = peptide.cycleOnDays ?? 0;
      const off = peptide.cycleOffDays ?? 0;
      const period = on + off;
      if (period <= 0 || on <= 0) return false;
      const anchor = peptide.cycleAnchor ? dateOnly(peptide.cycleAnchor) : day;
      const diff = daysBetween(anchor, day);
      if (diff < 0) return false;
      return diff % period < on;
    }

    default:
      return true;
  }
}

export function scheduleLabel(peptide: Peptide): string {
  switch (peptide.scheduleType) {
    case 'daily':
      return 'Every day';
    case 'weekdays': {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = [...peptide.weekdays].sort().map((d) => names[d]);
      return days.length ? days.join(', ') : 'No days selected';
    }
    case 'cycle':
      return `${peptide.cycleOnDays ?? 0} on / ${peptide.cycleOffDays ?? 0} off`;
    default:
      return peptide.scheduleType;
  }
}

/** Injection sites for rotation suggestions. */
export const INJECTION_SITES = [
  'Abdomen (L)',
  'Abdomen (R)',
  'Thigh (L)',
  'Thigh (R)',
  'Upper arm (L)',
  'Upper arm (R)',
  'Glute (L)',
  'Glute (R)',
];

/**
 * Suggest the next injection site given the most recently used one, rotating
 * through INJECTION_SITES in order.
 */
export function suggestNextSite(lastSite: string | null | undefined): string {
  if (!lastSite) return INJECTION_SITES[0];
  const idx = INJECTION_SITES.indexOf(lastSite);
  if (idx < 0) return INJECTION_SITES[0];
  return INJECTION_SITES[(idx + 1) % INJECTION_SITES.length];
}
