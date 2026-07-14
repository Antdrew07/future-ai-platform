import AppShell from '@/components/AppShell';
import ProgressView from '@/components/ProgressView';
import { getOrCreateProfile, getWeighIns } from '@/lib/data';
import { toISODate, dateOnly } from '@/lib/date';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const [profile, weighIns] = await Promise.all([getOrCreateProfile(), getWeighIns()]);

  return (
    <AppShell>
      <ProgressView
        profile={{
          name: profile.name,
          startingWeight: profile.startingWeight,
          goalWeight: profile.goalWeight,
          heightIn: profile.heightIn,
        }}
        initialWeighIns={weighIns.map((w) => ({
          id: w.id,
          date: toISODate(dateOnly(w.date)),
          weight: w.weight,
          waist: w.waist,
          hips: w.hips,
          photoUrl: w.photoUrl,
        }))}
      />
    </AppShell>
  );
}
