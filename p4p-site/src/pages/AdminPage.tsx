import { useEffect, useState, useCallback } from "react";

/* ---------- types ---------- */
type Contact = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  status: string;
  tags: string[];
  source: string | null;
  subscribed: boolean;
  message: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
type Stats = { total: number; subscribers: number; leads: number; customers: number; new_7d: number };

const api = (path: string, opts: RequestInit = {}) =>
  fetch(`/api${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });

const STATUSES = ["subscriber", "lead", "customer", "unsubscribed"];

/* ================================================================= */
export default function AdminPage() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");

  useEffect(() => {
    api("/admin/me").then((r) => setAuth(r.ok ? "in" : "out")).catch(() => setAuth("out"));
  }, []);

  if (auth === "checking") return <Shell><p className="text-muted">Loading…</p></Shell>;
  if (auth === "out") return <Login onIn={() => setAuth("in")} />;
  return <Dashboard onOut={() => setAuth("out")} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
    </div>
  );
}

/* ---------- login ---------- */
function Login({ onIn }: { onIn: () => void }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await api("/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      if (r.ok) onIn();
      else setErr((await r.json().catch(() => ({})))?.error || "Login failed");
    } catch { setErr("Network error"); }
    setBusy(false);
  }
  return (
    <Shell>
      <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-line bg-panel p-8 shadow-card">
        <h1 className="font-display text-2xl font-bold">Peptides 4 Power</h1>
        <p className="mt-1 text-sm text-muted">Admin dashboard</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password" aria-label="Admin password"
            className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-gold"
          />
          <button type="submit" disabled={busy} className="cta w-full rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          {err && <p className="text-sm text-red-500">{err}</p>}
        </form>
      </div>
    </Shell>
  );
}

/* ---------- dashboard ---------- */
function Dashboard({ onOut }: { onOut: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [tab, setTab] = useState<"contacts" | "broadcast">("contacts");
  const [selected, setSelected] = useState<Contact | null>(null);

  const loadStats = useCallback(() => { api("/admin/stats").then((r) => r.json()).then((d) => d.ok && setStats(d.stats)).catch(() => {}); }, []);
  const loadContacts = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status !== "all") p.set("status", status);
    api(`/admin/contacts?${p}`).then((r) => r.json()).then((d) => d.ok && setContacts(d.contacts)).catch(() => {});
  }, [q, status]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { const t = setTimeout(loadContacts, 200); return () => clearTimeout(t); }, [loadContacts]);

  async function logout() { await api("/admin/logout", { method: "POST" }); onOut(); }
  function refresh() { loadStats(); loadContacts(); }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted">Peptides 4 Power · CRM</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://stats.peptides4power.com" target="_blank" rel="noreferrer"
             className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-gold hover:text-accent">Analytics ↗</a>
          <button onClick={logout} className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-ink">Log out</button>
        </div>
      </div>

      {/* stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Tile label="Contacts" value={stats?.total} />
        <Tile label="Subscribers" value={stats?.subscribers} />
        <Tile label="Leads" value={stats?.leads} />
        <Tile label="Customers" value={stats?.customers} />
        <Tile label="New · 7d" value={stats?.new_7d} />
      </div>

      {/* tabs */}
      <div className="mt-8 flex gap-2 border-b border-line">
        {(["contacts", "broadcast"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold capitalize ${tab === t ? "border-gold text-accent" : "border-transparent text-muted hover:text-ink"}`}>
            {t === "broadcast" ? "Send broadcast" : "Contacts"}
          </button>
        ))}
      </div>

      {tab === "contacts" ? (
        <Contacts
          contacts={contacts} q={q} setQ={setQ} status={status} setStatus={setStatus}
          onOpen={setSelected} onAdded={refresh}
        />
      ) : (
        <Broadcast subscribers={stats?.subscribers ?? 0} />
      )}

      {selected && (
        <ContactDrawer contact={selected} onClose={() => setSelected(null)} onChanged={() => { refresh(); setSelected(null); }} />
      )}
    </Shell>
  );
}

function Tile({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="text-2xl font-bold tabular-nums">{value ?? "—"}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

/* ---------- contacts ---------- */
function Contacts({ contacts, q, setQ, status, setStatus, onOpen, onAdded }: {
  contacts: Contact[]; q: string; setQ: (s: string) => void; status: string; setStatus: (s: string) => void;
  onOpen: (c: Contact) => void; onAdded: () => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…"
          className="min-w-0 flex-1 rounded-full border border-line bg-panel px-4 py-2.5 text-sm outline-none focus:border-gold" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-full border border-line bg-panel px-3 py-2.5 text-sm">
          <option value="all">All</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <button onClick={() => setAdding(true)} className="cta rounded-full px-4 py-2.5 text-sm font-bold">+ Add</button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-panel text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-2.5">Contact</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 hidden sm:table-cell">Source</th><th className="px-4 py-2.5">Sub?</th></tr>
          </thead>
          <tbody>
            {contacts.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No contacts yet.</td></tr>}
            {contacts.map((c) => (
              <tr key={c.id} onClick={() => onOpen(c)} className="cursor-pointer border-t border-line hover:bg-panel/60">
                <td className="px-4 py-3">
                  <div className="font-semibold">{c.name || "—"}</div>
                  <div className="text-xs text-muted">{c.email}</div>
                </td>
                <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted">{c.source || "—"}</td>
                <td className="px-4 py-3">{c.subscribed ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding && <AddContact onClose={() => setAdding(false)} onAdded={() => { setAdding(false); onAdded(); }} />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    subscriber: "bg-blue-500/10 text-accent",
    lead: "bg-gold/15 text-gold",
    customer: "bg-green-500/10 text-green-600",
    unsubscribed: "bg-line text-muted",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] || "bg-line text-muted"}`}>{status}</span>;
}

function AddContact({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [f, setF] = useState({ email: "", name: "", phone: "", status: "lead" });
  const [err, setErr] = useState("");
  async function save() {
    const r = await api("/admin/contacts", { method: "POST", body: JSON.stringify(f) });
    if (r.ok) onAdded(); else setErr((await r.json().catch(() => ({})))?.error || "Failed");
  }
  return (
    <Modal onClose={onClose} title="Add contact">
      <div className="space-y-3">
        <Field label="Email"><input className={inp} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Name"><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Phone"><input className={inp} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Status">
          <select className={inp} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <button onClick={save} className="cta w-full rounded-xl px-4 py-3 text-sm font-bold">Save contact</button>
      </div>
    </Modal>
  );
}

function ContactDrawer({ contact, onClose, onChanged }: { contact: Contact; onClose: () => void; onChanged: () => void }) {
  const [c, setC] = useState(contact);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    await api(`/admin/contacts/${c.id}`, { method: "PATCH", body: JSON.stringify({ name: c.name, phone: c.phone, status: c.status, notes: c.notes, subscribed: c.subscribed }) });
    setSaving(false); onChanged();
  }
  async function del() {
    if (!confirm(`Delete ${c.email}?`)) return;
    await api(`/admin/contacts/${c.id}`, { method: "DELETE" });
    onChanged();
  }
  return (
    <Modal onClose={onClose} title={c.email}>
      <div className="space-y-3">
        <Field label="Name"><input className={inp} value={c.name || ""} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
        <Field label="Phone"><input className={inp} value={c.phone || ""} onChange={(e) => setC({ ...c, phone: e.target.value })} /></Field>
        <Field label="Status">
          <select className={inp} value={c.status} onChange={(e) => setC({ ...c, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={c.subscribed} onChange={(e) => setC({ ...c, subscribed: e.target.checked })} /> Subscribed to newsletter
        </label>
        {c.message && <Field label="Their message"><p className="rounded-lg bg-panel p-3 text-sm text-muted">{c.message}</p></Field>}
        <Field label="Notes"><textarea className={inp} rows={3} value={c.notes || ""} onChange={(e) => setC({ ...c, notes: e.target.value })} /></Field>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="cta flex-1 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          <button onClick={del} className="rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- broadcast ---------- */
function Broadcast({ subscribers }: { subscribers: number }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!confirm(`Send this to ${subscribers} subscriber${subscribers === 1 ? "" : "s"}?`)) return;
    setBusy(true); setResult("");
    try {
      const r = await api("/admin/broadcast", { method: "POST", body: JSON.stringify({ subject, body }) });
      const d = await r.json();
      setResult(r.ok ? `✓ Sent to ${d.sent} subscriber${d.sent === 1 ? "" : "s"}.` : `Error: ${d.error}`);
      if (r.ok) { setSubject(""); setBody(""); }
    } catch { setResult("Network error"); }
    setBusy(false);
  }
  return (
    <div className="mt-5 max-w-xl space-y-3">
      <p className="text-sm text-muted">Send an email to all <strong className="text-ink">{subscribers}</strong> subscribed contacts. It goes out from dave@peptides4power.com with an unsubscribe link.</p>
      <Field label="Subject"><input className={inp} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Flash sale: 25% off this week" /></Field>
      <Field label="Message"><textarea className={inp} rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement… (plain text, line breaks become paragraphs)" /></Field>
      <button onClick={send} disabled={busy || !subject || !body} className="cta rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-60">{busy ? "Sending…" : `Send to ${subscribers}`}</button>
      {result && <p className="text-sm font-semibold text-accent">{result}</p>}
    </div>
  );
}

/* ---------- shared bits ---------- */
const inp = "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none focus:border-gold";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>{children}</div>;
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg p-6 shadow-cardlg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="truncate font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-xl leading-none text-muted hover:text-ink">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
