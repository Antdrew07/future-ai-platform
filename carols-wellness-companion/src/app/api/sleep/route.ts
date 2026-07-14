import { z } from 'zod';
import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate, today } from '@/lib/date';

export const dynamic = 'force-dynamic';

const schema = z.object({
  date: z.string().optional(),
  hours: z.number().min(0).max(24),
});

export async function POST(req: Request) {
  return handle(async () => {
    const { date, hours } = await parseBody(req, schema);
    const day = date ? fromISODate(date) : today();
    const log = await prisma.sleepLog.upsert({
      where: { date: day },
      create: { date: day, hours },
      update: { hours },
    });
    return ok(log);
  });
}
