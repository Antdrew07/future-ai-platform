import AppShell from '@/components/AppShell';
import JournalView from '@/components/JournalView';
import { prisma } from '@/lib/prisma';
import { toISODate, dateOnly } from '@/lib/date';

export const dynamic = 'force-dynamic';

export default async function JournalPage() {
  const entries = await prisma.journalEntry.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <AppShell>
      <JournalView
        initialEntries={entries.map((e) => ({
          id: e.id,
          date: toISODate(dateOnly(e.date)),
          title: e.title,
          content: e.content,
        }))}
      />
    </AppShell>
  );
}
