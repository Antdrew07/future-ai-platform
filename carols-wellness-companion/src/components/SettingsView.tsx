'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Syringe,
  Bell,
  Download,
  LogOut,
  Plus,
  Check,
  Pencil,
  Trash2,
  Power,
  Database,
} from 'lucide-react';
import { apiPost, apiPut, apiDelete } from '@/lib/http';
import { cn } from '@/lib/utils';
import { HEALTH_GOALS } from '@/lib/validation';
import { scheduleLabel } from '@/lib/schedule';
import PeptideForm, { emptyPeptide, type PeptideFormValue } from '@/components/PeptideForm';
import NotificationSettings from '@/components/NotificationSettings';

type ProfileState = {
  name: string;
  heightIn: number | null;
  startingWeight: number | null;
  goalWeight: number | null;
  targetDate: string | null;
  goals: string[];
  waterGoalOz: number;
};

type PeptideItem = PeptideFormValue & { id: string; active: boolean };

export default function SettingsView({
  profile,
  initialPeptides,
  demoMode,
}: {
  profile: ProfileState;
  initialPeptides: PeptideItem[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const [p, setP] = useState<ProfileState>(profile);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [peptides, setPeptides] = useState<PeptideItem[]>(initialPeptides);
  const [editing, setEditing] = useState<PeptideItem | 'new' | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  const num = (v: string) => (v === '' ? null : Number(v));

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await apiPut('/api/profile', {
        name: p.name,
        heightIn: p.heightIn,
        startingWeight: p.startingWeight,
        goalWeight: p.goalWeight,
        targetDate: p.targetDate,
        goals: p.goals,
        waterGoalOz: p.waterGoalOz,
      });
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 1500);
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setSavingProfile(false);
    }
  }

  const toggleGoal = (g: string) =>
    setP((cur) => ({
      ...cur,
      goals: cur.goals.includes(g) ? cur.goals.filter((x) => x !== g) : [...cur.goals, g],
    }));

  async function toggleActive(pep: PeptideItem) {
    const next = !pep.active;
    setPeptides((cur) => cur.map((x) => (x.id === pep.id ? { ...x, active: next } : x)));
    try {
      await apiPut(`/api/peptides/${pep.id}`, { active: next });
    } catch {
      setPeptides((cur) => cur.map((x) => (x.id === pep.id ? { ...x, active: !next } : x)));
    }
  }

  async function deletePeptide(id: string) {
    setPeptides((cur) => cur.filter((x) => x.id !== id));
    try {
      await apiDelete(`/api/peptides/${id}`);
    } catch {
      /* ignore */
    }
  }

  async function logout() {
    try {
      await apiPost('/api/auth/logout');
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  async function runDemo(action: 'seed' | 'clear') {
    setDemoBusy(true);
    try {
      await apiPost('/api/demo', { action });
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setDemoBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="animate-fade-in">
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-charcoal-muted">Make it yours, {p.name}</p>
      </header>

      {/* Profile */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <User className="h-5 w-5 text-blush-500" /> Profile
          </h2>
          {savedProfile && <span className="text-xs font-medium text-blush-600">Saved ✓</span>}
        </div>
        <div>
          <label className="label">Name</label>
          <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Height (in)</label>
            <input
              type="number"
              className="input"
              value={p.heightIn ?? ''}
              onChange={(e) => setP({ ...p, heightIn: num(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Water goal (oz)</label>
            <input
              type="number"
              className="input"
              value={p.waterGoalOz}
              onChange={(e) => setP({ ...p, waterGoalOz: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label">Starting (lbs)</label>
            <input
              type="number"
              className="input"
              value={p.startingWeight ?? ''}
              onChange={(e) => setP({ ...p, startingWeight: num(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Goal (lbs)</label>
            <input
              type="number"
              className="input"
              value={p.goalWeight ?? ''}
              onChange={(e) => setP({ ...p, goalWeight: num(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <label className="label">Target date</label>
          <input
            type="date"
            className="input"
            value={p.targetDate ?? ''}
            onChange={(e) => setP({ ...p, targetDate: e.target.value || null })}
          />
        </div>
        <div>
          <label className="label">Goals</label>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set([...HEALTH_GOALS, ...p.goals])).map((g) => (
              <button
                key={g}
                onClick={() => toggleGoal(g)}
                className={cn('chip', p.goals.includes(g) ? 'bg-blush-500 text-white' : 'bg-blush-50 text-blush-700')}
              >
                {p.goals.includes(g) && <Check className="h-3.5 w-3.5" />}
                {g}
              </button>
            ))}
          </div>
        </div>
        <button onClick={saveProfile} disabled={savingProfile} className="btn-primary w-full">
          {savingProfile ? 'Saving…' : 'Save profile'}
        </button>
      </section>

      {/* Peptides */}
      <section className="card space-y-3">
        <h2 className="section-title flex items-center gap-2">
          <Syringe className="h-5 w-5 text-blush-500" /> Peptides
        </h2>
        {peptides.length === 0 && (
          <p className="text-sm text-charcoal-muted">No peptides yet — add your first below.</p>
        )}
        {peptides.map((pep) => (
          <div
            key={pep.id}
            className={cn(
              'flex items-center gap-3 rounded-2xl border border-blush-100 bg-white p-3',
              !pep.active && 'opacity-60',
            )}
          >
            <div className="flex-1">
              <p className="font-medium">
                {pep.name} <span className="text-xs text-charcoal-muted">{pep.dose}</span>
              </p>
              <p className="text-xs text-charcoal-muted">
                {scheduleLabel(pep as never)} · {pep.route} · {pep.timeOfDay}
                {!pep.active && ' · paused'}
              </p>
            </div>
            <button
              onClick={() => toggleActive(pep)}
              aria-label="Toggle active"
              className={cn('rounded-full p-2', pep.active ? 'text-blush-600' : 'text-charcoal-muted')}
            >
              <Power className="h-4 w-4" />
            </button>
            <button onClick={() => setEditing(pep)} className="rounded-full p-2 text-charcoal-muted hover:bg-blush-50">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => deletePeptide(pep.id)} className="rounded-full p-2 text-charcoal-muted hover:bg-blush-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button onClick={() => setEditing('new')} className="btn-outline w-full">
          <Plus className="h-4 w-4" /> Add a peptide
        </button>
      </section>

      {/* Notifications */}
      <section className="card space-y-3">
        <h2 className="section-title flex items-center gap-2">
          <Bell className="h-5 w-5 text-blush-500" /> Reminders
        </h2>
        <NotificationSettings />
      </section>

      {/* Data */}
      <section className="card space-y-3">
        <h2 className="section-title flex items-center gap-2">
          <Download className="h-5 w-5 text-blush-500" /> Your data
        </h2>
        <a href="/api/export" className="btn-outline w-full">
          <Download className="h-4 w-4" /> Export everything (CSV)
        </a>
        {demoMode && (
          <div className="rounded-2xl bg-blush-50 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-blush-700">
              <Database className="h-4 w-4" /> Demo mode
            </p>
            <div className="flex gap-2">
              <button onClick={() => runDemo('seed')} disabled={demoBusy} className="btn-ghost flex-1 text-xs">
                Load sample data
              </button>
              <button onClick={() => runDemo('clear')} disabled={demoBusy} className="btn-outline flex-1 text-xs">
                Clear all data
              </button>
            </div>
          </div>
        )}
      </section>

      <button onClick={logout} className="btn-outline w-full !text-blush-700">
        <LogOut className="h-4 w-4" /> Log out
      </button>

      <p className="px-2 pb-2 text-center text-xs text-charcoal-muted">
        For personal tracking and encouragement only — not medical advice.
      </p>

      {editing && (
        <PeptideEditor
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(item) => {
            setPeptides((cur) => {
              const exists = cur.some((x) => x.id === item.id);
              return exists ? cur.map((x) => (x.id === item.id ? item : x)) : [...cur, item];
            });
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function PeptideEditor({
  item,
  onClose,
  onSaved,
}: {
  item: PeptideItem | null;
  onClose: () => void;
  onSaved: (item: PeptideItem) => void;
}) {
  const [value, setValue] = useState<PeptideFormValue>(
    item
      ? {
          name: item.name,
          dose: item.dose,
          route: item.route,
          scheduleType: item.scheduleType,
          weekdays: item.weekdays,
          cycleOnDays: item.cycleOnDays,
          cycleOffDays: item.cycleOffDays,
          timeOfDay: item.timeOfDay,
        }
      : emptyPeptide(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!value.name.trim() || !value.dose.trim()) {
      setError('Please add a name and dose.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      ...value,
      cycleAnchor: value.scheduleType === 'cycle' ? new Date().toISOString().slice(0, 10) : null,
    };
    try {
      if (item) {
        const updated = await apiPut<PeptideItem>(`/api/peptides/${item.id}`, payload);
        onSaved({ ...(updated as PeptideItem), active: item.active });
      } else {
        const created = await apiPost<PeptideItem>('/api/peptides', payload);
        onSaved(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fade-in relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-4xl bg-cream p-5 pb-8 shadow-soft">
        <h3 className="mb-4 font-display text-xl font-semibold">{item ? 'Edit peptide' : 'Add peptide'}</h3>
        <PeptideForm value={value} onChange={setValue} />
        {error && <p className="mt-3 rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
