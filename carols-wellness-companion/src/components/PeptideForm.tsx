'use client';

import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WEEKDAY_LABELS } from '@/lib/date';

export type PeptideFormValue = {
  name: string;
  dose: string;
  route: 'injection' | 'oral';
  scheduleType: 'daily' | 'weekdays' | 'cycle';
  weekdays: number[];
  cycleOnDays: number | null;
  cycleOffDays: number | null;
  timeOfDay: string;
};

export function emptyPeptide(): PeptideFormValue {
  return {
    name: '',
    dose: '',
    route: 'injection',
    scheduleType: 'daily',
    weekdays: [],
    cycleOnDays: 5,
    cycleOffDays: 2,
    timeOfDay: 'morning',
  };
}

export default function PeptideForm({
  value,
  onChange,
  onRemove,
}: {
  value: PeptideFormValue;
  onChange: (v: PeptideFormValue) => void;
  onRemove?: () => void;
}) {
  const set = (patch: Partial<PeptideFormValue>) => onChange({ ...value, ...patch });

  const toggleDay = (d: number) =>
    set({
      weekdays: value.weekdays.includes(d)
        ? value.weekdays.filter((x) => x !== d)
        : [...value.weekdays, d].sort(),
    });

  return (
    <div className="rounded-3xl border border-blush-100 bg-white/70 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <label className="label">Peptide / medication name</label>
          <input
            className="input"
            placeholder="e.g. Semaglutide"
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove peptide"
            className="mt-7 rounded-full p-2 text-blush-500 hover:bg-blush-50"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Dose</label>
          <input
            className="input"
            placeholder="0.25 mg"
            value={value.dose}
            onChange={(e) => set({ dose: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Route</label>
          <div className="flex gap-2">
            {(['injection', 'oral'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set({ route: r })}
                className={cn(
                  'chip flex-1 justify-center capitalize',
                  value.route === r ? 'bg-blush-500 text-white' : 'bg-blush-50 text-blush-700',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="label">Schedule</label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['daily', 'Daily'],
              ['weekdays', 'Specific days'],
              ['cycle', 'Cycle on/off'],
            ] as const
          ).map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              onClick={() => set({ scheduleType: val })}
              className={cn(
                'chip',
                value.scheduleType === val ? 'bg-blush-500 text-white' : 'bg-blush-50 text-blush-700',
              )}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {value.scheduleType === 'weekdays' && (
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((lbl, d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={cn(
                'h-10 w-10 rounded-full text-sm font-medium transition',
                value.weekdays.includes(d)
                  ? 'bg-blush-500 text-white'
                  : 'bg-blush-50 text-charcoal-soft',
              )}
            >
              {lbl[0]}
            </button>
          ))}
        </div>
      )}

      {value.scheduleType === 'cycle' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Days on</label>
            <input
              type="number"
              min={1}
              className="input"
              value={value.cycleOnDays ?? ''}
              onChange={(e) => set({ cycleOnDays: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div>
            <label className="label">Days off</label>
            <input
              type="number"
              min={0}
              className="input"
              value={value.cycleOffDays ?? ''}
              onChange={(e) => set({ cycleOffDays: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </div>
      )}

      <div>
        <label className="label">Time of day</label>
        <div className="flex flex-wrap gap-2">
          {['morning', 'midday', 'evening'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set({ timeOfDay: t })}
              className={cn(
                'chip capitalize',
                value.timeOfDay === t ? 'bg-blush-500 text-white' : 'bg-blush-50 text-blush-700',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
