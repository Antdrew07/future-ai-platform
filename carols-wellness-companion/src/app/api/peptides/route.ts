import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate } from '@/lib/date';
import { peptideInput } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const peptides = await prisma.peptide.findMany({ orderBy: { createdAt: 'asc' } });
    return ok(peptides);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const p = await parseBody(req, peptideInput);
    const created = await prisma.peptide.create({
      data: {
        name: p.name,
        dose: p.dose,
        route: p.route,
        scheduleType: p.scheduleType,
        weekdays: p.weekdays,
        cycleOnDays: p.cycleOnDays ?? null,
        cycleOffDays: p.cycleOffDays ?? null,
        cycleAnchor: p.cycleAnchor ? fromISODate(p.cycleAnchor) : null,
        timeOfDay: p.timeOfDay,
      },
    });
    return ok(created, 201);
  });
}
