'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Plus, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { apiPost } from '@/lib/http';
import { cn } from '@/lib/utils';
import { HEALTH_GOALS } from '@/lib/validation';
import PeptideForm, { emptyPeptide, type PeptideFormValue } from '@/components/PeptideForm';

const STEPS = ['Welcome', 'Body', 'Goals', 'Peptides', 'Water'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('Carol');
  const [heightIn, setHeightIn] = useState('');
  const [startingWeight, setStartingWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [peptides, setPeptides] = useState<PeptideFormValue[]>([]);
  const [waterGoalOz, setWaterGoalOz] = useState('64');

  const toggleGoal = (g: string) =>
    setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const cleanedPeptides = peptides
        .filter((p) => p.name.trim() && p.dose.trim())
        .map((p) => ({
          ...p,
          cycleAnchor: p.scheduleType === 'cycle' ? new Date().toISOString().slice(0, 10) : null,
        }));
      await apiPost('/api/onboarding', {
        name: name.trim() || 'Carol',
        heightIn: heightIn ? Number(heightIn) : null,
        startingWeight: startingWeight ? Number(startingWeight) : null,
        goalWeight: goalWeight ? Number(goalWeight) : null,
        targetDate: targetDate || null,
        goals,
        waterGoalOz: waterGoalOz ? Number(waterGoalOz) : 64,
        peptides: cleanedPeptides,
      });
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.');
      setSaving(false);
    }
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 py-8">
      {/* progress dots */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-2 rounded-full transition-all',
              i === step ? 'w-8 bg-blush-500' : i < step ? 'w-2 bg-blush-300' : 'w-2 bg-blush-100',
            )}
          />
        ))}
      </div>

      <div key={step} className="animate-fade-in">
        {step === 0 && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blush-400 to-blush-600 shadow-soft">
              <Heart className="h-8 w-8 text-white" fill="white" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Welcome, lovely</h1>
            <p className="mt-3 text-charcoal-muted">
              Let&apos;s set up your wellness companion. This takes just a minute — everything is
              editable later.
            </p>
            <div className="mt-6 text-left">
              <label className="label">What should I call you?</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="section-title mb-1 text-2xl">A few basics</h2>
            <p className="mb-5 text-sm text-charcoal-muted">Used for BMI and progress — all optional.</p>
            <div className="space-y-4">
              <div>
                <label className="label">Height (inches)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="65"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Starting weight (lbs)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="180"
                    value={startingWeight}
                    onChange={(e) => setStartingWeight(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Goal weight (lbs)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="150"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Target date</label>
                <input
                  type="date"
                  className="input"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="section-title mb-1 text-2xl">Your goals</h2>
            <p className="mb-5 text-sm text-charcoal-muted">Pick everything that feels right.</p>
            <div className="flex flex-wrap gap-2">
              {HEALTH_GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGoal(g)}
                  className={cn(
                    'chip',
                    goals.includes(g) ? 'bg-blush-500 text-white' : 'bg-blush-50 text-blush-700',
                  )}
                >
                  {goals.includes(g) && <Check className="h-3.5 w-3.5" />}
                  {g}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                className="input"
                placeholder="Add your own…"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customGoal.trim()) {
                    toggleGoal(customGoal.trim());
                    setCustomGoal('');
                  }
                }}
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  if (customGoal.trim()) {
                    toggleGoal(customGoal.trim());
                    setCustomGoal('');
                  }
                }}
              >
                Add
              </button>
            </div>
            {goals.filter((g) => !HEALTH_GOALS.includes(g)).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {goals
                  .filter((g) => !HEALTH_GOALS.includes(g))
                  .map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleGoal(g)}
                      className="chip bg-blush-500 text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {g}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="section-title mb-1 text-2xl">Peptide setup</h2>
            <p className="mb-5 text-sm text-charcoal-muted">
              Add what you&apos;re tracking. You can skip and add these later.
            </p>
            <div className="space-y-4">
              {peptides.map((p, i) => (
                <PeptideForm
                  key={i}
                  value={p}
                  onChange={(v) => setPeptides((cur) => cur.map((x, idx) => (idx === i ? v : x)))}
                  onRemove={() => setPeptides((cur) => cur.filter((_, idx) => idx !== i))}
                />
              ))}
              <button
                type="button"
                onClick={() => setPeptides((cur) => [...cur, emptyPeptide()])}
                className="btn-outline w-full"
              >
                <Plus className="h-4 w-4" /> Add a peptide
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="section-title mb-1 text-2xl">Daily water goal</h2>
            <p className="mb-5 text-sm text-charcoal-muted">How much water feels good for you?</p>
            <div className="flex items-end gap-2">
              <input
                type="number"
                className="input text-2xl"
                value={waterGoalOz}
                onChange={(e) => setWaterGoalOz(e.target.value)}
              />
              <span className="pb-3 text-charcoal-muted">oz / day</span>
            </div>
            <div className="mt-3 flex gap-2">
              {[48, 64, 80, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setWaterGoalOz(String(v))}
                  className={cn(
                    'chip',
                    Number(waterGoalOz) === v ? 'bg-blush-500 text-white' : 'bg-blush-50 text-blush-700',
                  )}
                >
                  {v} oz
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-3xl bg-blush-50 p-5 text-center">
              <p className="font-display text-lg text-blush-800">You&apos;re all set, {name || 'Carol'}! ✨</p>
              <p className="mt-1 text-sm text-charcoal-muted">
                Your companion is ready to cheer you on every day.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700">{error}</p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button onClick={back} className="btn-outline">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={next} className="btn-primary">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={finish} disabled={saving} className="btn-primary">
            {saving ? 'Setting up…' : 'Start my journey'} <Heart className="h-4 w-4" fill="white" />
          </button>
        )}
      </div>
    </div>
  );
}
