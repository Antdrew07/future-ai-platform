import AppShell from '@/components/AppShell';
import SettingsView from '@/components/SettingsView';
import { getOrCreateProfile } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { toISODate, dateOnly } from '@/lib/date';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [profile, peptides] = await Promise.all([
    getOrCreateProfile(),
    prisma.peptide.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);

  return (
    <AppShell>
      <SettingsView
        demoMode={process.env.DEMO_MODE === 'true'}
        profile={{
          name: profile.name,
          heightIn: profile.heightIn,
          startingWeight: profile.startingWeight,
          goalWeight: profile.goalWeight,
          targetDate: profile.targetDate ? toISODate(dateOnly(profile.targetDate)) : null,
          goals: profile.goals,
          waterGoalOz: profile.waterGoalOz,
        }}
        initialPeptides={peptides.map((p) => ({
          id: p.id,
          name: p.name,
          dose: p.dose,
          route: p.route as 'injection' | 'oral',
          scheduleType: p.scheduleType as 'daily' | 'weekdays' | 'cycle',
          weekdays: p.weekdays,
          cycleOnDays: p.cycleOnDays,
          cycleOffDays: p.cycleOffDays,
          timeOfDay: p.timeOfDay,
          active: p.active,
        }))}
      />
    </AppShell>
  );
}
