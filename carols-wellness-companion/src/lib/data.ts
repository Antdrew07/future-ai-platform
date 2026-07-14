import type { Peptide } from '@prisma/client';
import { prisma } from './prisma';
import { today, addDays, dateOnly, toISODate, utcDate, daysBetween } from './date';
import { isPeptideDueOn } from './schedule';

/** Fetch the single profile, creating a default one if none exists. */
export async function getOrCreateProfile() {
  const existing = await prisma.profile.findFirst({ orderBy: { createdAt: 'asc' } });
  if (existing) return existing;
  return prisma.profile.create({ data: { name: 'Carol' } });
}

export type DuePeptide = {
  peptide: Peptide;
  logged: boolean;
  injectionSite: string | null;
  checkedAt: Date | null;
};

export type DashboardData = {
  date: Date;
  duePeptides: DuePeptide[];
  waterOz: number;
  waterGoalOz: number;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  meals: { id: string; mealType: string; description: string }[];
  streak: number;
  lastInjectionSite: string | null;
};

/**
 * Assemble everything the dashboard (and the AI context) needs for a given day.
 */
export async function getDashboard(date: Date = today()): Promise<DashboardData> {
  const day = dateOnly(date);
  const windowStart = addDays(day, -60);

  const [profile, peptides, doseLogsWindow, waterAgg, mood, sleep, meals, lastDose] =
    await Promise.all([
      getOrCreateProfile(),
      prisma.peptide.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }),
      prisma.doseLog.findMany({
        where: { date: { gte: windowStart, lte: day } },
      }),
      prisma.waterLog.aggregate({ where: { date: day }, _sum: { amountOz: true } }),
      prisma.moodEnergyLog.findUnique({ where: { date: day } }),
      prisma.sleepLog.findUnique({ where: { date: day } }),
      prisma.mealLog.findMany({ where: { date: day }, orderBy: { createdAt: 'asc' } }),
      prisma.doseLog.findFirst({
        where: { injectionSite: { not: null } },
        orderBy: { checkedAt: 'desc' },
      }),
    ]);

  // Index dose logs by "peptideId|iso"
  const logMap = new Map<string, { site: string | null; checkedAt: Date }>();
  for (const log of doseLogsWindow) {
    logMap.set(`${log.peptideId}|${toISODate(dateOnly(log.date))}`, {
      site: log.injectionSite,
      checkedAt: log.checkedAt,
    });
  }

  const dueToday = peptides.filter((p) => isPeptideDueOn(p, day));
  const duePeptides: DuePeptide[] = dueToday.map((peptide) => {
    const hit = logMap.get(`${peptide.id}|${toISODate(day)}`);
    return {
      peptide,
      logged: Boolean(hit),
      injectionSite: hit?.site ?? null,
      checkedAt: hit?.checkedAt ?? null,
    };
  });

  // Streak: consecutive days (ending today) where all due peptides were logged.
  // An in-progress today does not break the streak; days with no due peptides
  // are transparent (they neither add to nor break the streak).
  let streak = 0;
  let cursor = day;
  for (let i = 0; i < 60; i++) {
    const iso = toISODate(cursor);
    const due = peptides.filter((p) => isPeptideDueOn(p, cursor));
    if (due.length > 0) {
      const allLogged = due.every((p) => logMap.has(`${p.id}|${iso}`));
      if (allLogged) {
        streak++;
      } else if (i === 0) {
        // today still in progress — skip without breaking
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
  }

  return {
    date: day,
    duePeptides,
    waterOz: waterAgg._sum.amountOz ?? 0,
    waterGoalOz: profile.waterGoalOz,
    mood: mood?.mood ?? null,
    energy: mood?.energy ?? null,
    sleepHours: sleep?.hours ?? null,
    meals: meals.map((m) => ({ id: m.id, mealType: m.mealType, description: m.description })),
    streak,
    lastInjectionSite: lastDose?.injectionSite ?? null,
  };
}

/** Recent weigh-ins ascending by date. */
export async function getWeighIns() {
  return prisma.weighIn.findMany({ orderBy: { date: 'asc' } });
}

export type DayStatus = 'full' | 'partial' | 'missed' | 'off' | 'future' | 'empty';

export type CalendarDay = {
  iso: string;
  day: number;
  status: DayStatus;
  dueCount: number;
  loggedCount: number;
  hasWeighIn: boolean;
};

/**
 * Compute per-day dosing status for a month grid. Off-days (peptide not
 * scheduled) are never shown as missed; future days are neutral.
 */
export async function getMonthStatus(year: number, month: number): Promise<CalendarDay[]> {
  const first = utcDate(year, month, 1);
  const nextMonth = utcDate(year, month + 1, 1);
  const daysInMonth = daysBetween(first, nextMonth);
  const now = today();

  const [peptides, doseLogs, weighIns] = await Promise.all([
    prisma.peptide.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.doseLog.findMany({ where: { date: { gte: first, lt: nextMonth } } }),
    prisma.weighIn.findMany({ where: { date: { gte: first, lt: nextMonth } } }),
  ]);

  const loggedByDay = new Map<string, Set<string>>();
  for (const log of doseLogs) {
    const iso = toISODate(dateOnly(log.date));
    if (!loggedByDay.has(iso)) loggedByDay.set(iso, new Set());
    loggedByDay.get(iso)!.add(log.peptideId);
  }
  const weighInDays = new Set(weighIns.map((w) => toISODate(dateOnly(w.date))));

  const result: CalendarDay[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const d = addDays(first, i);
    const iso = toISODate(d);
    const due = peptides.filter((p) => p.active && isPeptideDueOn(p, d));
    const loggedSet = loggedByDay.get(iso) ?? new Set<string>();
    const loggedCount = due.filter((p) => loggedSet.has(p.id)).length;

    let status: DayStatus;
    if (due.length === 0) {
      status = 'off';
    } else if (d.getTime() > now.getTime()) {
      status = 'future';
    } else if (loggedCount === due.length) {
      status = 'full';
    } else if (loggedCount > 0) {
      status = 'partial';
    } else {
      status = 'missed';
    }

    result.push({
      iso,
      day: d.getUTCDate(),
      status,
      dueCount: due.length,
      loggedCount,
      hasWeighIn: weighInDays.has(iso),
    });
  }
  return result;
}
