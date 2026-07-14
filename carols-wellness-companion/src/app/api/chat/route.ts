import { z } from 'zod';
import { ok, fail, parseBody, handle } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { SYSTEM_PROMPT, buildContextBlock, callVenice, type ChatMsg } from '@/lib/venice';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HISTORY_LIMIT = 40;

export async function GET() {
  return handle(async () => {
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return ok(messages);
  });
}

const schema = z.object({ message: z.string().min(1).max(4000) });

export async function POST(req: Request) {
  return handle(async () => {
    const { message } = await parseBody(req, schema);

    // Persist the user's message first.
    await prisma.chatMessage.create({ data: { role: 'user', content: message } });

    // Assemble context + recent history for the model.
    const [contextBlock, recent] = await Promise.all([
      buildContextBlock(),
      prisma.chatMessage.findMany({ orderBy: { createdAt: 'desc' }, take: HISTORY_LIMIT }),
    ]);
    const history = recent.reverse();

    const messages: ChatMsg[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
      ...history.map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as ChatMsg['role'],
        content: m.content,
      })),
    ];

    const result = await callVenice(messages);
    if (!result.ok || !result.content) {
      // Surface a friendly error; the user's message stays saved so they can retry.
      return fail(result.error ?? 'The AI companion is unavailable right now.', 502);
    }

    const assistant = await prisma.chatMessage.create({
      data: { role: 'assistant', content: result.content },
    });

    return ok({ reply: assistant.content, id: assistant.id });
  });
}

const deleteSchema = z.object({ all: z.literal(true) });

export async function DELETE(req: Request) {
  return handle(async () => {
    await parseBody(req, deleteSchema);
    await prisma.chatMessage.deleteMany({});
    return ok({ success: true });
  });
}
