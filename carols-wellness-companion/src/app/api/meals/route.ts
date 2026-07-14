import { z } from 'zod';
import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate, today } from '@/lib/date';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  date: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  description: z.string().min(1).max(300),
});

export async function POST(req: Request) {
  return handle(async () => {
    const { date, mealType, description } = await parseBody(req, createSchema);
    const meal = await prisma.mealLog.create({
      data: { date: date ? fromISODate(date) : today(), mealType, description },
    });
    return ok(meal, 201);
  });
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  return handle(async () => {
    const { id } = await parseBody(req, deleteSchema);
    await prisma.mealLog.delete({ where: { id } });
    return ok({ success: true });
  });
}
