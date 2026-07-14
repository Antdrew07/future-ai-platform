'use client';

import { useState } from 'react';
import { Apple, Plus, X } from 'lucide-react';
import { apiPost, apiDelete } from '@/lib/http';
import { cn } from '@/lib/utils';
import type { MealDTO } from './types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function FoodGuidance({
  todayISO,
  foods,
  initialMeals,
}: {
  todayISO: string;
  foods: string[];
  initialMeals: MealDTO[];
}) {
  const [meals, setMeals] = useState(initialMeals);
  const [mealType, setMealType] = useState<(typeof MEAL_TYPES)[number]>('breakfast');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  async function addMeal() {
    if (!desc.trim() || busy) return;
    setBusy(true);
    try {
      const meal = await apiPost<MealDTO>('/api/meals', {
        date: todayISO,
        mealType,
        description: desc.trim(),
      });
      setMeals((cur) => [...cur, meal]);
      setDesc('');
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setMeals((cur) => cur.filter((m) => m.id !== id));
    try {
      await apiDelete('/api/meals', { id });
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="card">
      <h2 className="section-title mb-3 flex items-center gap-2">
        <Apple className="h-5 w-5 text-blush-500" /> Foods that support you today
      </h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {foods.map((f) => (
          <span key={f} className="chip bg-blush-50 text-blush-700">
            {f}
          </span>
        ))}
      </div>

      <div className="rounded-2xl bg-cream p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {MEAL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setMealType(t)}
              className={cn(
                'chip text-xs capitalize',
                mealType === t ? 'bg-blush-500 text-white' : 'bg-white text-blush-700',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input !py-2.5"
            placeholder={`Log your ${mealType}…`}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMeal()}
          />
          <button onClick={addMeal} disabled={busy || !desc.trim()} className="btn-primary !px-4 !py-2.5">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {meals.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {meals.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
            >
              <span>
                <span className="mr-2 text-xs font-medium capitalize text-blush-600">{m.mealType}</span>
                {m.description}
              </span>
              <button onClick={() => remove(m.id)} aria-label="Remove" className="text-charcoal-muted hover:text-blush-500">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
