'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/http';
import { cn, MOOD_EMOJI, ENERGY_EMOJI } from '@/lib/utils';

export default function MoodEnergy({
  todayISO,
  initialMood,
  initialEnergy,
}: {
  todayISO: string;
  initialMood: number | null;
  initialEnergy: number | null;
}) {
  const [mood, setMood] = useState<number | null>(initialMood);
  const [energy, setEnergy] = useState<number | null>(initialEnergy);
  const [saved, setSaved] = useState(false);

  async function save(nextMood: number | null, nextEnergy: number | null) {
    if (nextMood == null || nextEnergy == null) return;
    try {
      await apiPost('/api/mood', { date: todayISO, mood: nextMood, energy: nextEnergy });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const Row = ({
    label,
    emojis,
    value,
    onPick,
  }: {
    label: string;
    emojis: string[];
    value: number | null;
    onPick: (v: number) => void;
  }) => (
    <div>
      <p className="mb-1.5 text-sm font-medium text-charcoal-soft">{label}</p>
      <div className="flex justify-between">
        {emojis.map((e, i) => {
          const v = i + 1;
          return (
            <button
              key={v}
              onClick={() => onPick(v)}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full text-xl transition',
                value === v ? 'scale-110 bg-blush-100 ring-2 ring-blush-400' : 'bg-cream hover:bg-blush-50',
              )}
            >
              {e}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">How are you feeling?</h2>
        {saved && <span className="text-xs font-medium text-blush-600">Saved ✓</span>}
      </div>
      <Row
        label="Mood"
        emojis={MOOD_EMOJI}
        value={mood}
        onPick={(v) => {
          setMood(v);
          void save(v, energy);
        }}
      />
      <Row
        label="Energy"
        emojis={ENERGY_EMOJI}
        value={energy}
        onPick={(v) => {
          setEnergy(v);
          void save(mood, v);
        }}
      />
    </div>
  );
}
