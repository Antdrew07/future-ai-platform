import { z } from 'zod';
import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate } from '@/lib/date';
import { peptideInput } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const updateSchema = peptideInput.partial().extend({
  active: z.boolean().optional(),
});

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  return handle(async () => {
    const p = await parseBody(req, updateSchema);
    const updated = await prisma.peptide.update({
      where: { id: params.id },
      data: {
        ...(p.name !== undefined ? { name: p.name } : {}),
        ...(p.dose !== undefined ? { dose: p.dose } : {}),
        ...(p.route !== undefined ? { route: p.route } : {}),
        ...(p.scheduleType !== undefined ? { scheduleType: p.scheduleType } : {}),
        ...(p.weekdays !== undefined ? { weekdays: p.weekdays } : {}),
        ...(p.cycleOnDays !== undefined ? { cycleOnDays: p.cycleOnDays ?? null } : {}),
        ...(p.cycleOffDays !== undefined ? { cycleOffDays: p.cycleOffDays ?? null } : {}),
        ...(p.cycleAnchor !== undefined
          ? { cycleAnchor: p.cycleAnchor ? fromISODate(p.cycleAnchor) : null }
          : {}),
        ...(p.timeOfDay !== undefined ? { timeOfDay: p.timeOfDay } : {}),
        ...(p.active !== undefined ? { active: p.active } : {}),
      },
    });
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    await prisma.peptide.delete({ where: { id: params.id } });
    return ok({ success: true });
  });
}
