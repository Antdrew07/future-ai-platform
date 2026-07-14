'use client';

import { useState } from 'react';
import { Droplet, Plus, Minus } from 'lucide-react';
import { apiPost } from '@/lib/http';
import ProgressRing from '@/components/ProgressRing';

export default function WaterTracker({
  todayISO,
  initialOz,
  goalOz,
}: {
  todayISO: string;
  initialOz: number;
  goalOz: number;
}) {
  const [oz, setOz] = useState(initialOz);
  const [busy, setBusy] = useState(false);

  async function change(delta: number) {
    if (busy) return;
    const optimistic = Math.max(0, oz + delta);
    setOz(optimistic);
    setBusy(true);
    try {
      const r = await apiPost<{ totalOz: number }>('/api/water', { date: todayISO, amountOz: delta });
      setOz(r.totalOz);
    } catch {
      setOz(oz); // revert
    } finally {
      setBusy(false);
    }
  }

  const pct = goalOz > 0 ? oz / goalOz : 0;
  const reached = oz >= goalOz && goalOz > 0;

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Droplet className="h-5 w-5 text-blush-500" /> Water
        </h2>
        <span className="text-sm text-charcoal-muted">
          {oz} / {goalOz} oz
        </span>
      </div>

      <div className="flex items-center gap-5">
        <ProgressRing value={pct} size={104}>
          <div className="text-center">
            <div className="text-xl font-semibold text-blush-700">{Math.round(pct * 100)}%</div>
            <div className="text-[10px] uppercase tracking-wide text-charcoal-muted">
              {reached ? 'Goal!' : 'of goal'}
            </div>
          </div>
        </ProgressRing>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            {[8, 16, 24].map((amt) => (
              <button
                key={amt}
                onClick={() => change(amt)}
                disabled={busy}
                className="btn-ghost flex-1 flex-col !px-2 !py-2.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />+{amt}oz
              </button>
            ))}
          </div>
          <button
            onClick={() => change(-8)}
            disabled={busy || oz <= 0}
            className="btn-outline w-full !py-2 text-xs"
          >
            <Minus className="h-3.5 w-3.5" /> Undo 8 oz
          </button>
        </div>
      </div>
      {reached && (
        <p className="mt-3 text-center text-sm font-medium text-blush-700">
          Hydrated and glowing — amazing! 💧
        </p>
      )}
    </div>
  );
}
