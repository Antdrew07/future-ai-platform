'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import confetti from 'canvas-confetti';
import { Plus, Camera, TrendingDown, Target, Activity, X } from 'lucide-react';
import { apiPost } from '@/lib/http';
import { compressImage } from '@/lib/image';
import { bmi, round } from '@/lib/utils';

type WeighIn = {
  id: string;
  date: string;
  weight: number;
  waist: number | null;
  hips: number | null;
  photoUrl: string | null;
};

type Profile = {
  name: string;
  startingWeight: number | null;
  goalWeight: number | null;
  heightIn: number | null;
};

function celebrate(big = false) {
  const pink = ['#F7A8C4', '#F084B0', '#E15C93', '#B76E79', '#FDE7EF'];
  confetti({
    particleCount: big ? 180 : 90,
    spread: big ? 100 : 70,
    origin: { y: 0.6 },
    colors: pink,
  });
  if (big) {
    setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { y: 0.5 }, colors: pink }), 250);
  }
}

export default function ProgressView({
  profile,
  initialWeighIns,
}: {
  profile: Profile;
  initialWeighIns: WeighIn[];
}) {
  const [weighIns, setWeighIns] = useState<WeighIn[]>(initialWeighIns);
  const [showForm, setShowForm] = useState(false);

  const sorted = useMemo(() => [...weighIns].sort((a, b) => a.date.localeCompare(b.date)), [weighIns]);
  const latest = sorted[sorted.length - 1];
  const start = profile.startingWeight ?? sorted[0]?.weight ?? null;

  const lost = start != null && latest ? round(start - latest.weight, 1) : null;
  const toGoal = profile.goalWeight != null && latest ? round(latest.weight - profile.goalWeight, 1) : null;
  const pctToGoal =
    start != null && profile.goalWeight != null && latest && start !== profile.goalWeight
      ? Math.max(0, Math.min(100, Math.round(((start - latest.weight) / (start - profile.goalWeight)) * 100)))
      : null;
  const currentBmi = latest ? bmi(latest.weight, profile.heightIn) : null;

  // Chart data with a linear-regression trend line.
  const chartData = useMemo(() => {
    if (sorted.length === 0) return [];
    const n = sorted.length;
    const xs = sorted.map((_, i) => i);
    const ys = sorted.map((w) => w.weight);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      den += (xs[i] - meanX) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;
    return sorted.map((w, i) => ({
      date: w.date.slice(5), // MM-DD
      weight: w.weight,
      trend: round(intercept + slope * i, 1),
    }));
  }, [sorted]);

  async function onSaved(newWeighIn: WeighIn) {
    const prevLatest = latest;
    setWeighIns((cur) => {
      const withoutSameDay = cur.filter((w) => w.date !== newWeighIn.date);
      return [...withoutSameDay, newWeighIn];
    });
    setShowForm(false);

    // Milestone celebrations
    if (start != null) {
      const prevLost = prevLatest ? start - prevLatest.weight : 0;
      const newLost = start - newWeighIn.weight;
      const goalReached = profile.goalWeight != null && newWeighIn.weight <= profile.goalWeight;
      const crossed5 = Math.floor(newLost / 5) > Math.floor(prevLost / 5) && newLost > 0;
      if (goalReached && (!prevLatest || prevLatest.weight > (profile.goalWeight ?? -Infinity))) {
        celebrate(true);
      } else if (crossed5) {
        celebrate(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      <header className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Progress</h1>
          <p className="text-sm text-charcoal-muted">Look how far you&apos;ve come, {profile.name}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary !px-4">
          <Plus className="h-4 w-4" /> Weigh-in
        </button>
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<TrendingDown className="h-4 w-4" />}
          value={lost != null ? `${lost > 0 ? '' : '+'}${Math.abs(lost)}` : '—'}
          unit="lbs"
          label={lost != null && lost < 0 ? 'gained' : 'lost'}
        />
        <StatTile
          icon={<Target className="h-4 w-4" />}
          value={pctToGoal != null ? `${pctToGoal}` : '—'}
          unit="%"
          label="to goal"
        />
        <StatTile
          icon={<Activity className="h-4 w-4" />}
          value={currentBmi != null ? `${currentBmi}` : '—'}
          unit="BMI"
          label="current"
        />
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="section-title mb-3">Weight over time</h2>
        {chartData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FBD0E0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8A8290' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8A8290' }}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 3', 'dataMax + 3']}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid #FBD0E0',
                    boxShadow: '0 8px 30px -12px rgba(193,62,116,0.25)',
                  }}
                />
                {profile.goalWeight != null && (
                  <ReferenceLine
                    y={profile.goalWeight}
                    stroke="#B76E79"
                    strokeDasharray="5 4"
                    label={{ value: 'Goal', fontSize: 11, fill: '#B76E79', position: 'insideTopRight' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#EFC9B7"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                  name="Trend"
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#E15C93"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#E15C93' }}
                  activeDot={{ r: 6 }}
                  name="Weight"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* History list */}
      {sorted.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-3">History</h2>
          <ul className="space-y-2">
            {[...sorted].reverse().map((w, i, arr) => {
              const prev = arr[i + 1];
              const delta = prev ? round(w.weight - prev.weight, 1) : null;
              return (
                <li key={w.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5">
                  {w.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.photoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blush-50 text-blush-400">
                      <Camera className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{w.weight} lbs</div>
                    <div className="text-xs text-charcoal-muted">
                      {new Date(`${w.date}T00:00:00Z`).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone: 'UTC',
                      })}
                      {(w.waist || w.hips) && ' · '}
                      {w.waist ? `waist ${w.waist}"` : ''}
                      {w.waist && w.hips ? ', ' : ''}
                      {w.hips ? `hips ${w.hips}"` : ''}
                    </div>
                  </div>
                  {delta != null && (
                    <span className={delta <= 0 ? 'text-sm font-medium text-blush-600' : 'text-sm text-charcoal-muted'}>
                      {delta > 0 ? '+' : ''}
                      {delta}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showForm && <WeighInForm onClose={() => setShowForm(false)} onSaved={onSaved} />}
    </div>
  );
}

function StatTile({
  icon,
  value,
  unit,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <div className="card !p-4 text-center">
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-blush-50 text-blush-500">
        {icon}
      </div>
      <div className="font-display text-2xl font-semibold text-charcoal">
        {value}
        <span className="ml-0.5 text-xs font-sans text-charcoal-muted">{unit}</span>
      </div>
      <div className="text-[11px] text-charcoal-muted">{label}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-56 flex-col items-center justify-center rounded-2xl bg-blush-50/50 text-center">
      <p className="font-display text-lg text-blush-700">No weigh-ins yet</p>
      <p className="mt-1 max-w-[16rem] text-sm text-charcoal-muted">
        Your first one starts your journey. Tap “Weigh-in” to begin. 🌸
      </p>
    </div>
  );
}

function WeighInForm({ onClose, onSaved }: { onClose: () => void; onSaved: (w: WeighIn) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
    } catch {
      setError('Could not process that image.');
    }
  }

  async function save() {
    if (!weight || saving) return;
    setSaving(true);
    setError(null);
    try {
      const w = await apiPost<WeighIn>('/api/weigh-ins', {
        date,
        weight: Number(weight),
        waist: waist ? Number(waist) : null,
        hips: hips ? Number(hips) : null,
        photoUrl: photo,
      });
      onSaved({ ...w, date });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fade-in relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-4xl bg-cream p-5 pb-8 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">New weigh-in</h3>
          <button onClick={onClose} className="rounded-full p-2 text-charcoal-muted hover:bg-blush-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Weight (lbs)</label>
            <input
              type="number"
              inputMode="decimal"
              className="input text-2xl"
              placeholder="165"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Waist (in)</label>
              <input
                type="number"
                inputMode="decimal"
                className="input"
                placeholder="optional"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Hips (in)</label>
              <input
                type="number"
                inputMode="decimal"
                className="input"
                placeholder="optional"
                value={hips}
                onChange={(e) => setHips(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Progress photo (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            {photo ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="Preview" className="max-h-40 rounded-2xl object-cover" />
                <button
                  onClick={() => setPhoto(null)}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-card"
                >
                  <X className="h-4 w-4 text-blush-600" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="btn-outline w-full">
                <Camera className="h-4 w-4" /> Add a photo
              </button>
            )}
          </div>

          {error && <p className="rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700">{error}</p>}

          <button onClick={save} disabled={saving || !weight} className="btn-primary w-full py-3.5">
            {saving ? 'Saving…' : 'Save weigh-in'}
          </button>
        </div>
      </div>
    </div>
  );
}
