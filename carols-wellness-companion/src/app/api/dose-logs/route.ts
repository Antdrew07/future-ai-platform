import { z } from 'zod';
import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate } from '@/lib/date';

export const dynamic = 'force-dynamic';

const schema = z.object({
  peptideId: z.string().min(1),
  date: z.string(), // YYYY-MM-DD
  logged: z.boolean(),
  injectionSite: z.string().max(60).nullable().optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const { peptideId, date, logged, injectionSite } = await parseBody(req, schema);
    const day = fromISODate(date);

    if (logged) {
      await prisma.doseLog.upsert({
        where: { peptideId_date: { peptideId, date: day } },
        create: { peptideId, date: day, injectionSite: injectionSite ?? null },
        update: { injectionSite: injectionSite ?? null, checkedAt: new Date() },
      });
    } else {
      await prisma.doseLog.deleteMany({ where: { peptideId, date: day } });
    }

    return ok({ logged });
  });
}
