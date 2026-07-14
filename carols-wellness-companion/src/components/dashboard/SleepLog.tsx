'use client';

import { useState } from 'react';
import { Moon } from 'lucide-react';
import { apiPost } from '@/lib/http';
import { cn } from '@/lib/utils';

const OPTIONS = [4, 5, 6, 7, 8, 9, 10];

export default function SleepLog({
  todayISO,
  initialHours,
}: {
  todayISO: string;
  initialHours: number | null;
}) {
  const [hours, setHours] = useState<number | null>(initialHours);
  const [saved, setSaved] = useState(false);

  async function pick(h: number) {
    setHours(h);
    try {
      await apiPost('/api/sleep', { date: todayISO, hours: h });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Moon className="h-5 w-5 text-blush-500" /> Sleep last night
        </h2>
        {saved && <span className="text-xs font-medium text-blush-600">Saved ✓</span>}
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {OPTIONS.map((h) => (
          <button
            key={h}
            onClick={() => pick(h)}
            className={cn(
              'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-sm font-medium transition',
              hours === h ? 'bg-blush-500 text-white' : 'bg-cream text-charcoal-soft hover:bg-blush-50',
            )}
          >
            <span className="text-base font-semibold">{h}</span>
            <span className="text-[10px] opacity-80">hrs</span>
          </button>
        ))}
      </div>
    </div>
  );
}
