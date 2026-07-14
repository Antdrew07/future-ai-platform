'use client';

import { Settings } from 'lucide-react';
import Link from 'next/link';
import type { DashboardDTO } from './dashboard/types';
import Encouragement from './dashboard/Encouragement';
import PeptideChecklist from './dashboard/PeptideChecklist';
import WaterTracker from './dashboard/WaterTracker';
import FoodGuidance from './dashboard/FoodGuidance';
import MoodEnergy from './dashboard/MoodEnergy';
import SleepLog from './dashboard/SleepLog';

function greetingWord(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard({ data, longDate }: { data: DashboardDTO; longDate: string }) {
  return (
    <div className="space-y-4">
      <header className="animate-fade-in flex items-start justify-between">
        <div>
          <p className="text-sm text-charcoal-muted">{longDate}</p>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            {greetingWord()}, {data.name}
          </h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="mt-1 rounded-full bg-white/70 p-2.5 text-blush-600 shadow-card"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      <Encouragement />

      <PeptideChecklist
        todayISO={data.todayISO}
        initial={data.duePeptides}
        streak={data.streak}
        lastInjectionSite={data.lastInjectionSite}
      />

      <WaterTracker todayISO={data.todayISO} initialOz={data.waterOz} goalOz={data.waterGoalOz} />

      <FoodGuidance todayISO={data.todayISO} foods={data.foods} initialMeals={data.meals} />

      <div className="grid grid-cols-1 gap-4">
        <MoodEnergy todayISO={data.todayISO} initialMood={data.mood} initialEnergy={data.energy} />
        <SleepLog todayISO={data.todayISO} initialHours={data.sleepHours} />
      </div>

      <p className="px-2 pt-2 text-center text-xs text-charcoal-muted">
        For personal tracking and encouragement only — not medical advice.
      </p>
    </div>
  );
}
