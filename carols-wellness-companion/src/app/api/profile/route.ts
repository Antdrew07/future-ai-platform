import { z } from 'zod';
import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { getOrCreateProfile } from '@/lib/data';
import { fromISODate } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const profile = await getOrCreateProfile();
    return ok(profile);
  });
}

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  heightIn: z.number().positive().max(100).nullable().optional(),
  startingWeight: z.number().positive().max(1500).nullable().optional(),
  goalWeight: z.number().positive().max(1500).nullable().optional(),
  targetDate: z.string().nullable().optional(),
  goals: z.array(z.string()).optional(),
  waterGoalOz: z.number().int().positive().max(500).optional(),
});

export async function PUT(req: Request) {
  return handle(async () => {
    const body = await parseBody(req, updateSchema);
    const profile = await getOrCreateProfile();
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.heightIn !== undefined ? { heightIn: body.heightIn } : {}),
        ...(body.startingWeight !== undefined ? { startingWeight: body.startingWeight } : {}),
        ...(body.goalWeight !== undefined ? { goalWeight: body.goalWeight } : {}),
        ...(body.targetDate !== undefined
          ? { targetDate: body.targetDate ? fromISODate(body.targetDate) : null }
          : {}),
        ...(body.goals !== undefined ? { goals: body.goals } : {}),
        ...(body.waterGoalOz !== undefined ? { waterGoalOz: body.waterGoalOz } : {}),
      },
    });
    return ok(updated);
  });
}
