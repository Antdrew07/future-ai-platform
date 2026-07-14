'use client';

import { useState } from 'react';
import { Check, Syringe, Pill, Flame, Sparkles } from 'lucide-react';
import { apiPost } from '@/lib/http';
import { cn } from '@/lib/utils';
import { INJECTION_SITES, suggestNextSite } from '@/lib/schedule';
import type { PeptideDTO } from './types';

export default function PeptideChecklist({
  todayISO,
  initial,
  streak,
  lastInjectionSite,
}: {
  todayISO: string;
  initial: PeptideDTO[];
  streak: number;
  lastInjectionSite: string | null;
}) {
  const [items, setItems] = useState(initial);
  const [sitePickerFor, setSitePickerFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const doneCount = items.filter((i) => i.logged).length;

  async function setLogged(p: PeptideDTO, logged: boolean, injectionSite: string | null) {
    setBusyId(p.id);
    setItems((cur) =>
      cur.map((x) => (x.id === p.id ? { ...x, logged, injectionSite: logged ? injectionSite : null } : x)),
    );
    try {
      await apiPost('/api/dose-logs', { peptideId: p.id, date: todayISO, logged, injectionSite });
    } catch {
      // revert
      setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, logged: !logged } : x)));
    } finally {
      setBusyId(null);
      setSitePickerFor(null);
    }
  }

  function onToggle(p: PeptideDTO) {
    if (p.logged) {
      void setLogged(p, false, null);
      return;
    }
    if (p.route === 'injection') {
      setSitePickerFor(sitePickerFor === p.id ? null : p.id);
    } else {
      void setLogged(p, true, null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="card">
        <h2 className="section-title mb-2">Today&apos;s doses</h2>
        <p className="text-sm text-charcoal-muted">
          No peptides scheduled today — enjoy your rest day. You can manage your schedule in Settings.
        </p>
      </div>
    );
  }

  const suggested = suggestNextSite(lastInjectionSite);

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">Today&apos;s doses</h2>
        {streak > 0 && (
          <span className="chip bg-gradient-to-br from-rosegold-light to-rosegold text-white">
            <Flame className="h-3.5 w-3.5" /> {streak} day{streak > 1 ? 's' : ''} in a row
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {items.map((p) => (
          <div key={p.id}>
            <button
              onClick={() => onToggle(p)}
              disabled={busyId === p.id}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition',
                p.logged
                  ? 'border-blush-200 bg-blush-50'
                  : 'border-blush-100 bg-white hover:border-blush-300',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition',
                  p.logged ? 'bg-blush-500 text-white' : 'border-2 border-blush-200 text-transparent',
                )}
              >
                <Check className="h-5 w-5" strokeWidth={3} />
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-1.5 font-medium text-charcoal">
                  {p.route === 'injection' ? (
                    <Syringe className="h-3.5 w-3.5 text-blush-400" />
                  ) : (
                    <Pill className="h-3.5 w-3.5 text-blush-400" />
                  )}
                  {p.name}
                </span>
                <span className="text-xs text-charcoal-muted">
                  {p.dose} · {p.timeOfDay}
                  {p.logged && p.injectionSite ? ` · ${p.injectionSite}` : ''}
                </span>
              </span>
              {p.logged && <span className="text-xs font-medium text-blush-600">Done ✓</span>}
            </button>

            {sitePickerFor === p.id && !p.logged && (
              <div className="animate-fade-in mt-2 rounded-2xl border border-blush-100 bg-white p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs text-charcoal-muted">
                  <Sparkles className="h-3.5 w-3.5 text-blush-400" />
                  Suggested next site: <span className="font-medium text-blush-700">{suggested}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {INJECTION_SITES.map((site) => (
                    <button
                      key={site}
                      onClick={() => setLogged(p, true, site)}
                      className={cn(
                        'chip text-xs',
                        site === suggested ? 'bg-blush-500 text-white' : 'bg-blush-50 text-blush-700',
                      )}
                    >
                      {site}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-charcoal-muted">
        {doneCount === items.length
          ? 'All done for today — you showed up for yourself! 🌸'
          : `${doneCount} of ${items.length} logged`}
      </p>
    </div>
  );
}
