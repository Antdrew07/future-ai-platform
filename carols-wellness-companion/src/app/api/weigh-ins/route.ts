import { z } from 'zod';
import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate, today } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const weighIns = await prisma.weighIn.findMany({ orderBy: { date: 'asc' } });
    return ok(weighIns);
  });
}

const schema = z.object({
  date: z.string().optional(),
  weight: z.number().positive().max(1500),
  waist: z.number().positive().max(120).nullable().optional(),
  hips: z.number().positive().max(120).nullable().optional(),
  // Data URL for a progress photo (kept small — validated by length).
  photoUrl: z.string().max(3_500_000).nullable().optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const { date, weight, waist, hips, photoUrl } = await parseBody(req, schema);
    const day = date ? fromISODate(date) : today();
    const weighIn = await prisma.weighIn.upsert({
      where: { date: day },
      create: { date: day, weight, waist: waist ?? null, hips: hips ?? null, photoUrl: photoUrl ?? null },
      update: { weight, waist: waist ?? null, hips: hips ?? null, photoUrl: photoUrl ?? null },
    });
    return ok(weighIn, 201);
  });
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  return handle(async () => {
    const { id } = await parseBody(req, deleteSchema);
    await prisma.weighIn.delete({ where: { id } });
    return ok({ success: true });
  });
}
