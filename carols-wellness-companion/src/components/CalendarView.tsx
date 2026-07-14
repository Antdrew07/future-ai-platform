'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, X, Droplet, Moon, Scale } from 'lucide-react';
import { apiGet } from '@/lib/http';
import { cn } from '@/lib/utils';
import type { CalendarDay } from '@/lib/data';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DayDetail = {
  date: string;
  peptides: { id: string; name: string; dose: string; route: string; logged: boolean; injectionSite: string | null }[];
  waterOz: number;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  meals: { id: string; mealType: string; description: string }[];
  weighIn: { weight: number; waist: number | null; hips: number | null; photoUrl: string | null } | null;
  journal: { id: string; title: string | null; content: string }[];
};

const STATUS_STYLE: Record<CalendarDay['status'], string> = {
  full: 'bg-blush-500 text-white',
  partial: 'bg-blush-200 text-blush-800',
  missed: 'bg-white text-charcoal-muted ring-1 ring-inset ring-rosegold-light',
  off: 'bg-cream text-charcoal-muted',
  future: 'bg-white text-charcoal-muted',
  empty: 'bg-cream text-charcoal-muted',
};

export default function CalendarView({
  initialYear,
  initialMonth,
  initialDays,
  todayISO,
}: {
  initialYear: number;
  initialMonth: number;
  initialDays: CalendarDay[];
  todayISO: string;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [days, setDays] = useState(initialDays);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadMonth(y: number, m: number) {
    setLoading(true);
    try {
      const r = await apiGet<{ days: CalendarDay[] }>(`/api/calendar?year=${y}&month=${m}`);
      setDays(r.days);
      setYear(y);
      setMonth(m);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    void loadMonth(y, m);
  }

  async function openDay(iso: string) {
    setSelected(iso);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await apiGet<DayDetail>(`/api/day?date=${iso}`);
      setDetail(d);
    } catch {
      /* ignore */
    } finally {
      setDetailLoading(false);
    }
  }

  const leadingBlanks = days.length ? new Date(`${days[0].iso}T00:00:00Z`).getUTCDay() : 0;

  return (
    <div className="space-y-4">
      <header className="animate-fade-in">
        <h1 className="font-display text-3xl font-semibold">Calendar</h1>
        <p className="text-sm text-charcoal-muted">Your dosing history at a glance</p>
      </header>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => shift(-1)} className="rounded-full p-2 text-blush-600 hover:bg-blush-50">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-lg font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={() => shift(1)} className="rounded-full p-2 text-blush-600 hover:bg-blush-50">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {DOW.map((d, i) => (
            <div key={i} className="py-1 text-center text-xs font-medium text-charcoal-muted">
              {d}
            </div>
          ))}
        </div>

        <div className={cn('grid grid-cols-7 gap-1 transition-opacity', loading && 'opacity-40')}>
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {days.map((d) => {
            const isToday = d.iso === todayISO;
            return (
              <button
                key={d.iso}
                onClick={() => openDay(d.iso)}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-medium transition',
                  STATUS_STYLE[d.status],
                  isToday && 'ring-2 ring-blush-400 ring-offset-1',
                )}
              >
                {d.status === 'full' ? (
                  <Heart className="h-4 w-4" fill="currentColor" />
                ) : (
                  <span>{d.day}</span>
                )}
                {d.hasWeighIn && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-rosegold" />
                )}
              </button>
            );
          })}
        </div>

        <Legend />
      </div>

      {selected && (
        <DayDrawer
          iso={selected}
          detail={detail}
          loading={detailLoading}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Legend() {
  const items: { label: string; className: string; heart?: boolean }[] = [
    { label: 'All doses', className: 'bg-blush-500 text-white', heart: true },
    { label: 'Partial', className: 'bg-blush-200' },
    { label: 'Missed', className: 'bg-white ring-1 ring-inset ring-rosegold-light' },
    { label: 'Rest day', className: 'bg-cream' },
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-blush-100 pt-3 text-xs text-charcoal-muted">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className={cn('flex h-4 w-4 items-center justify-center rounded-md', it.className)}>
            {it.heart && <Heart className="h-2.5 w-2.5 text-white" fill="currentColor" />}
          </span>
          {it.label}
        </span>
      ))}
    </div>
  );
}

function DayDrawer({
  iso,
  detail,
  loading,
  onClose,
}: {
  iso: string;
  detail: DayDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const nice = new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fade-in relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-4xl bg-cream p-5 pb-8 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">{nice}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-charcoal-muted hover:bg-blush-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && <p className="py-8 text-center text-charcoal-muted">Loading…</p>}

        {!loading && detail && (
          <div className="space-y-4">
            <section>
              <h4 className="mb-2 text-sm font-semibold text-charcoal-soft">Doses</h4>
              {detail.peptides.length === 0 ? (
                <p className="text-sm text-charcoal-muted">No peptides scheduled — a rest day.</p>
              ) : (
                <ul className="space-y-1.5">
                  {detail.peptides.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                    >
                      <span>
                        {p.name} <span className="text-xs text-charcoal-muted">{p.dose}</span>
                        {p.injectionSite && (
                          <span className="ml-1 text-xs text-blush-600">· {p.injectionSite}</span>
                        )}
                      </span>
                      <span className={p.logged ? 'text-blush-600' : 'text-charcoal-muted'}>
                        {p.logged ? 'Done ✓' : 'Missed'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <Stat icon={<Droplet className="h-4 w-4" />} value={`${detail.waterOz} oz`} label="Water" />
              <Stat
                icon={<Moon className="h-4 w-4" />}
                value={detail.sleepHours != null ? `${detail.sleepHours} h` : '—'}
                label="Sleep"
              />
              <Stat
                icon={<span className="text-base leading-none">🙂</span>}
                value={detail.mood != null ? `${detail.mood}/5` : '—'}
                label="Mood"
              />
            </div>

            {detail.weighIn && (
              <section className="rounded-2xl bg-white p-3">
                <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft">
                  <Scale className="h-4 w-4 text-blush-500" /> Weigh-in
                </h4>
                <p className="text-sm">
                  {detail.weighIn.weight} lbs
                  {detail.weighIn.waist ? ` · waist ${detail.weighIn.waist}"` : ''}
                  {detail.weighIn.hips ? ` · hips ${detail.weighIn.hips}"` : ''}
                </p>
                {detail.weighIn.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.weighIn.photoUrl}
                    alt="Progress"
                    className="mt-2 max-h-48 rounded-xl object-cover"
                  />
                )}
              </section>
            )}

            {detail.meals.length > 0 && (
              <section>
                <h4 className="mb-2 text-sm font-semibold text-charcoal-soft">Meals</h4>
                <ul className="space-y-1">
                  {detail.meals.map((m) => (
                    <li key={m.id} className="rounded-xl bg-white px-3 py-2 text-sm">
                      <span className="mr-2 text-xs font-medium capitalize text-blush-600">{m.mealType}</span>
                      {m.description}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {detail.journal.length > 0 && (
              <section>
                <h4 className="mb-2 text-sm font-semibold text-charcoal-soft">Journal</h4>
                {detail.journal.map((j) => (
                  <div key={j.id} className="rounded-xl bg-white px-3 py-2 text-sm">
                    {j.title && <p className="font-medium">{j.title}</p>}
                    <p className="whitespace-pre-wrap text-charcoal-soft">{j.content}</p>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="flex justify-center text-blush-500">{icon}</div>
      <div className="mt-1 font-semibold text-charcoal">{value}</div>
      <div className="text-[11px] text-charcoal-muted">{label}</div>
    </div>
  );
}
