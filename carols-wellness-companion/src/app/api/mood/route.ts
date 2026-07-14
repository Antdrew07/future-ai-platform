import { z } from 'zod';
import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate, today } from '@/lib/date';

export const dynamic = 'force-dynamic';

const schema = z.object({
  date: z.string().optional(),
  mood: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  note: z.string().max(300).nullable().optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const { date, mood, energy, note } = await parseBody(req, schema);
    const day = date ? fromISODate(date) : today();
    const log = await prisma.moodEnergyLog.upsert({
      where: { date: day },
      create: { date: day, mood, energy, note: note ?? null },
      update: { mood, energy, note: note ?? null },
    });
    return ok(log);
  });
}
