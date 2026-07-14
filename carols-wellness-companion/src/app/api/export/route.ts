import { handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { toISODate, dateOnly } from '@/lib/date';

export const dynamic = 'force-dynamic';

function csvField(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const header = columns.join(',');
  const lines = rows.map((r) => columns.map((c) => csvField(r[c])).join(','));
  return [header, ...lines].join('\n');
}

function section(title: string, csv: string): string {
  return `# ${title}\n${csv}\n`;
}

// Exports every table as a single multi-section CSV file.
export async function GET() {
  return handle(async () => {
    const [profile, peptides, doseLogs, weighIns, water, meals, mood, sleep, journal, chat] =
      await Promise.all([
        prisma.profile.findFirst(),
        prisma.peptide.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.doseLog.findMany({ include: { peptide: true }, orderBy: { date: 'asc' } }),
        prisma.weighIn.findMany({ orderBy: { date: 'asc' } }),
        prisma.waterLog.findMany({ orderBy: { date: 'asc' } }),
        prisma.mealLog.findMany({ orderBy: { date: 'asc' } }),
        prisma.moodEnergyLog.findMany({ orderBy: { date: 'asc' } }),
        prisma.sleepLog.findMany({ orderBy: { date: 'asc' } }),
        prisma.journalEntry.findMany({ orderBy: { date: 'asc' } }),
        prisma.chatMessage.findMany({ orderBy: { createdAt: 'asc' } }),
      ]);

    const parts: string[] = [];

    if (profile) {
      parts.push(
        section(
          'Profile',
          toCsv(
            [
              {
                name: profile.name,
                heightIn: profile.heightIn,
                startingWeight: profile.startingWeight,
                goalWeight: profile.goalWeight,
                targetDate: profile.targetDate ? toISODate(dateOnly(profile.targetDate)) : '',
                goals: profile.goals.join('; '),
                waterGoalOz: profile.waterGoalOz,
              },
            ],
            ['name', 'heightIn', 'startingWeight', 'goalWeight', 'targetDate', 'goals', 'waterGoalOz'],
          ),
        ),
      );
    }

    parts.push(
      section(
        'Peptides',
        toCsv(
          peptides.map((p) => ({
            name: p.name,
            dose: p.dose,
            route: p.route,
            scheduleType: p.scheduleType,
            weekdays: p.weekdays.join(' '),
            cycleOnDays: p.cycleOnDays,
            cycleOffDays: p.cycleOffDays,
            timeOfDay: p.timeOfDay,
            active: p.active,
          })),
          ['name', 'dose', 'route', 'scheduleType', 'weekdays', 'cycleOnDays', 'cycleOffDays', 'timeOfDay', 'active'],
        ),
      ),
    );

    parts.push(
      section(
        'Dose Logs',
        toCsv(
          doseLogs.map((d) => ({
            date: toISODate(dateOnly(d.date)),
            peptide: d.peptide.name,
            injectionSite: d.injectionSite,
            checkedAt: d.checkedAt.toISOString(),
          })),
          ['date', 'peptide', 'injectionSite', 'checkedAt'],
        ),
      ),
    );

    parts.push(
      section(
        'Weigh-Ins',
        toCsv(
          weighIns.map((w) => ({
            date: toISODate(dateOnly(w.date)),
            weight: w.weight,
            waist: w.waist,
            hips: w.hips,
            hasPhoto: w.photoUrl ? 'yes' : '',
          })),
          ['date', 'weight', 'waist', 'hips', 'hasPhoto'],
        ),
      ),
    );

    parts.push(
      section(
        'Water Logs',
        toCsv(
          water.map((w) => ({ date: toISODate(dateOnly(w.date)), amountOz: w.amountOz })),
          ['date', 'amountOz'],
        ),
      ),
    );

    parts.push(
      section(
        'Meals',
        toCsv(
          meals.map((m) => ({ date: toISODate(dateOnly(m.date)), mealType: m.mealType, description: m.description })),
          ['date', 'mealType', 'description'],
        ),
      ),
    );

    parts.push(
      section(
        'Mood & Energy',
        toCsv(
          mood.map((m) => ({ date: toISODate(dateOnly(m.date)), mood: m.mood, energy: m.energy, note: m.note })),
          ['date', 'mood', 'energy', 'note'],
        ),
      ),
    );

    parts.push(
      section(
        'Sleep',
        toCsv(
          sleep.map((s) => ({ date: toISODate(dateOnly(s.date)), hours: s.hours })),
          ['date', 'hours'],
        ),
      ),
    );

    parts.push(
      section(
        'Journal',
        toCsv(
          journal.map((j) => ({ date: toISODate(dateOnly(j.date)), title: j.title, content: j.content })),
          ['date', 'title', 'content'],
        ),
      ),
    );

    parts.push(
      section(
        'Chat',
        toCsv(
          chat.map((c) => ({ createdAt: c.createdAt.toISOString(), role: c.role, content: c.content })),
          ['createdAt', 'role', 'content'],
        ),
      ),
    );

    const body = parts.join('\n');
    const filename = `carol-wellness-export-${toISODate(new Date())}.csv`;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  });
}
