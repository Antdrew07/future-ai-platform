import { z } from 'zod';
import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate, today, toISODate } from '@/lib/date';

export const dynamic = 'force-dynamic';

const schema = z.object({
  date: z.string().optional(),
  amountOz: z.number().int(), // positive to add, negative to remove
});

export async function POST(req: Request) {
  return handle(async () => {
    const { date, amountOz } = await parseBody(req, schema);
    const day = date ? fromISODate(date) : today();

    if (amountOz < 0) {
      // Remove the most recent increment(s) worth of water, floor at 0.
      const logs = await prisma.waterLog.findMany({
        where: { date: day },
        orderBy: { createdAt: 'desc' },
      });
      let toRemove = -amountOz;
      for (const log of logs) {
        if (toRemove <= 0) break;
        if (log.amountOz <= toRemove) {
          await prisma.waterLog.delete({ where: { id: log.id } });
          toRemove -= log.amountOz;
        } else {
          await prisma.waterLog.update({
            where: { id: log.id },
            data: { amountOz: log.amountOz - toRemove },
          });
          toRemove = 0;
        }
      }
    } else if (amountOz > 0) {
      await prisma.waterLog.create({ data: { date: day, amountOz } });
    }

    const agg = await prisma.waterLog.aggregate({
      where: { date: day },
      _sum: { amountOz: true },
    });
    return ok({ date: toISODate(day), totalOz: agg._sum.amountOz ?? 0 });
  });
}
