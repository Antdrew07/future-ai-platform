import AppShell from '@/components/AppShell';
import ChatView from '@/components/ChatView';
import { prisma } from '@/lib/prisma';
import { getOrCreateProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const [profile, messages] = await Promise.all([
    getOrCreateProfile(),
    prisma.chatMessage.findMany({ orderBy: { createdAt: 'asc' }, take: 200 }),
  ]);

  return (
    <AppShell>
      <ChatView
        name={profile.name}
        initialMessages={messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
      />
    </AppShell>
  );
}
