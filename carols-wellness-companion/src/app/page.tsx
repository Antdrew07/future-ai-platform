import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Dashboard from '@/components/Dashboard';
import { getOrCreateProfile, getDashboard } from '@/lib/data';
import { today, toISODate, formatLongDate } from '@/lib/date';
import { foodsForDate } from '@/lib/utils';
import type { DashboardDTO } from '@/components/dashboard/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const profile = await getOrCreateProfile();
  if (!profile.onboarded) redirect('/onboarding');

  const day = today();
  const dash = await getDashboard(day);

  const dto: DashboardDTO = {
    todayISO: toISODate(day),
    name: profile.name,
    duePeptides: dash.duePeptides.map((d) => ({
      id: d.peptide.id,
      name: d.peptide.name,
      dose: d.peptide.dose,
      route: d.peptide.route,
      timeOfDay: d.peptide.timeOfDay,
      logged: d.logged,
      injectionSite: d.injectionSite,
    })),
    waterOz: dash.waterOz,
    waterGoalOz: dash.waterGoalOz,
    mood: dash.mood,
    energy: dash.energy,
    sleepHours: dash.sleepHours,
    meals: dash.meals,
    streak: dash.streak,
    lastInjectionSite: dash.lastInjectionSite,
    foods: foodsForDate(day),
  };

  return (
    <AppShell>
      <Dashboard data={dto} longDate={formatLongDate(day)} />
    </AppShell>
  );
}
