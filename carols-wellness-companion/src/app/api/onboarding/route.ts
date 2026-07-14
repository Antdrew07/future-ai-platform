import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { getOrCreateProfile } from '@/lib/data';
import { fromISODate } from '@/lib/date';
import { onboardingSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    const body = await parseBody(req, onboardingSchema);
    const profile = await getOrCreateProfile();

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        name: body.name,
        heightIn: body.heightIn ?? null,
        startingWeight: body.startingWeight ?? null,
        goalWeight: body.goalWeight ?? null,
        targetDate: body.targetDate ? fromISODate(body.targetDate) : null,
        goals: body.goals,
        waterGoalOz: body.waterGoalOz,
        onboarded: true,
      },
    });

    const peptides = body.peptides ?? [];
    if (peptides.length > 0) {
      await prisma.peptide.createMany({
        data: peptides.map((p) => ({
          name: p.name,
          dose: p.dose,
          route: p.route,
          scheduleType: p.scheduleType,
          weekdays: p.weekdays,
          cycleOnDays: p.cycleOnDays ?? null,
          cycleOffDays: p.cycleOffDays ?? null,
          cycleAnchor: p.cycleAnchor ? fromISODate(p.cycleAnchor) : null,
          timeOfDay: p.timeOfDay,
        })),
      });
    }

    return ok({ success: true });
  });
}
