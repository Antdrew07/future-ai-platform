import AppShell from '@/components/AppShell';
import CalendarView from '@/components/CalendarView';
import { getMonthStatus } from '@/lib/data';
import { today } from '@/lib/date';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const now = today();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const days = await getMonthStatus(year, month);

  return (
    <AppShell>
      <CalendarView initialYear={year} initialMonth={month} initialDays={days} todayISO={now.toISOString().slice(0, 10)} />
    </AppShell>
  );
}
