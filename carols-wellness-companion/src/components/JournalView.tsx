'use client';

import { useState } from 'react';
import { Plus, NotebookPen, X, Trash2, Pencil } from 'lucide-react';
import { apiPost, apiPut, apiDelete } from '@/lib/http';

type Entry = { id: string; date: string; title: string | null; content: string };

export default function JournalView({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [editing, setEditing] = useState<Entry | 'new' | null>(null);

  async function remove(id: string) {
    setEntries((cur) => cur.filter((e) => e.id !== id));
    try {
      await apiDelete('/api/journal', { id });
    } catch {
      /* ignore */
    }
  }

  function upsertLocal(entry: Entry) {
    setEntries((cur) => {
      const exists = cur.some((e) => e.id === entry.id);
      const next = exists ? cur.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...cur];
      return next.sort((a, b) => b.date.localeCompare(a.date));
    });
  }

  return (
    <div className="space-y-4">
      <header className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Journal</h1>
          <p className="text-sm text-charcoal-muted">Notes & reflections, just for you</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary !px-4">
          <Plus className="h-4 w-4" /> New
        </button>
      </header>

      {entries.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blush-50 text-blush-400">
            <NotebookPen className="h-7 w-7" />
          </div>
          <p className="font-display text-lg text-blush-700">Your story starts here</p>
          <p className="mt-1 max-w-[18rem] text-sm text-charcoal-muted">
            Capture a thought, a win, or how today felt. Your first entry begins the journey. 🌸
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <article key={e.id} className="card">
              <div className="mb-1 flex items-start justify-between">
                <div>
                  {e.title && <h3 className="font-display text-lg font-semibold">{e.title}</h3>}
                  <p className="text-xs text-charcoal-muted">
                    {new Date(`${e.date}T00:00:00Z`).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(e)} className="rounded-full p-2 text-charcoal-muted hover:bg-blush-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(e.id)} className="rounded-full p-2 text-charcoal-muted hover:bg-blush-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-charcoal-soft">{e.content}</p>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <EntryEditor
          entry={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(entry) => {
            upsertLocal(entry);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EntryEditor({
  entry,
  onClose,
  onSaved,
}: {
  entry: Entry | null;
  onClose: () => void;
  onSaved: (e: Entry) => void;
}) {
  const [title, setTitle] = useState(entry?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!content.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (entry) {
        const updated = await apiPut<Entry>('/api/journal', {
          id: entry.id,
          title: title.trim() || null,
          content: content.trim(),
        });
        onSaved({ ...updated, date: entry.date });
      } else {
        const created = await apiPost<Entry>('/api/journal', {
          date,
          title: title.trim() || null,
          content: content.trim(),
        });
        onSaved({ ...created, date });
      }
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
          <h3 className="font-display text-xl font-semibold">{entry ? 'Edit entry' : 'New entry'}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-charcoal-muted hover:bg-blush-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          {!entry && (
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Title (optional)</label>
            <input
              className="input"
              placeholder="A little heading…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Your thoughts</label>
            <textarea
              className="input min-h-[9rem] resize-none"
              placeholder="Write freely…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700">{error}</p>}
          <button onClick={save} disabled={saving || !content.trim()} className="btn-primary w-full py-3.5">
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
