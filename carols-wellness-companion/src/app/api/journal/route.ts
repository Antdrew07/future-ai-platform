import { z } from 'zod';
import { ok, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { fromISODate, today } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const entries = await prisma.journalEntry.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return ok(entries);
  });
}

const createSchema = z.object({
  date: z.string().optional(),
  title: z.string().max(120).nullable().optional(),
  content: z.string().min(1).max(10000),
});

export async function POST(req: Request) {
  return handle(async () => {
    const { date, title, content } = await parseBody(req, createSchema);
    const entry = await prisma.journalEntry.create({
      data: { date: date ? fromISODate(date) : today(), title: title ?? null, content },
    });
    return ok(entry, 201);
  });
}

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(120).nullable().optional(),
  content: z.string().min(1).max(10000),
});

export async function PUT(req: Request) {
  return handle(async () => {
    const { id, title, content } = await parseBody(req, updateSchema);
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: { title: title ?? null, content },
    });
    return ok(entry);
  });
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  return handle(async () => {
    const { id } = await parseBody(req, deleteSchema);
    await prisma.journalEntry.delete({ where: { id } });
    return ok({ success: true });
  });
}
