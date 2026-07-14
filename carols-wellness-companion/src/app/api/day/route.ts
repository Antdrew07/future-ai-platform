import { ok, fail, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate, dateOnly } from '@/lib/date';
import { isPeptideDueOn } from '@/lib/schedule';

export const dynamic = 'force-dynamic';

// Detailed logs for a single calendar day (used by the calendar day drawer).
export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    if (!dateStr) return fail('Missing date.', 400);
    const day = fromISODate(dateStr);

    const [peptides, doseLogs, water, mood, sleep, meals, weighIn, journal] = await Promise.all([
      prisma.peptide.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.doseLog.findMany({ where: { date: day } }),
      prisma.waterLog.aggregate({ where: { date: day }, _sum: { amountOz: true } }),
      prisma.moodEnergyLog.findUnique({ where: { date: day } }),
      prisma.sleepLog.findUnique({ where: { date: day } }),
      prisma.mealLog.findMany({ where: { date: day }, orderBy: { createdAt: 'asc' } }),
      prisma.weighIn.findUnique({ where: { date: day } }),
      prisma.journalEntry.findMany({ where: { date: day }, orderBy: { createdAt: 'asc' } }),
    ]);

    const logByPeptide = new Map(doseLogs.map((l) => [l.peptideId, l]));
    const peptideStatus = peptides
      .filter((p) => p.active && isPeptideDueOn(p, day))
      .map((p) => {
        const log = logByPeptide.get(p.id);
        return {
          id: p.id,
          name: p.name,
          dose: p.dose,
          route: p.route,
          logged: Boolean(log),
          injectionSite: log?.injectionSite ?? null,
        };
      });

    return ok({
      date: dateStr,
      peptides: peptideStatus,
      waterOz: water._sum.amountOz ?? 0,
      mood: mood?.mood ?? null,
      energy: mood?.energy ?? null,
      sleepHours: sleep?.hours ?? null,
      meals: meals.map((m) => ({ id: m.id, mealType: m.mealType, description: m.description })),
      weighIn: weighIn
        ? { weight: weighIn.weight, waist: weighIn.waist, hips: weighIn.hips, photoUrl: weighIn.photoUrl }
        : null,
      journal: journal.map((j) => ({ id: j.id, title: j.title, content: j.content })),
    });
  });
}
