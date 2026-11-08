import { useEffect, useState } from "react";

type Member = { name: string | null; email: string; status: string };

const api = (path: string, opts: RequestInit = {}) =>
  fetch(`/api${path}`, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opts });

// DRAFT membership agreement — have an attorney review before launch.
const WAIVER = `PEPTIDES 4 POWER — COACHING MEMBERSHIP AGREEMENT & RELEASE (DRAFT)

1. Educational purpose only. This membership provides general health, fitness, and wellness coaching, education, and community. It is NOT medical advice, diagnosis, or treatment, and is not a substitute for care from a licensed physician.

2. Not medical care. David Furka and Peptides 4 Power are not acting as your doctor. Nothing here is a prescription or a recommendation to use any specific substance, dose, or protocol. Consult a qualified, licensed healthcare provider before starting any supplement, peptide, diet, or exercise program.

3. Peptides. Any peptide information is for research and educational purposes only. Products referenced may not be evaluated or approved for human use. You are solely responsible for complying with all laws and for any decision you make about purchasing or using any product.

4. Assumption of risk. Exercise, nutrition changes, and health decisions carry inherent risks. You voluntarily accept all risks of participating.

5. Release of liability. To the fullest extent permitted by law, you release and hold harmless David Furka, Peptides 4 Power, and its affiliates from any claims, damages, or liabilities arising from your participation, except for willful misconduct.

6. No guarantees. No specific results, health outcomes, or earnings are promised.

7. Member discount. Your membership includes a discount code for the affiliated peptide company. Codes are for personal use and may change or end at any time.

By checking the box, you confirm you are 18+, have read and agree to this Agreement.`;

export default function CommunityPage() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [member, setMember] = useState<Member | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const load = () =>
    api("/member/me").then(async (r) => {
      if (r.ok) { const d = await r.json(); setMember(d.member); setCode(d.discountCode); setAuth("in"); }
      else setAuth("out");
    }).catch(() => setAuth("out"));
  useEffect(() => { load(); }, []);

  if (auth === "checking")
    return <Wrap><p className="text-muted">Loading…</p></Wrap>;
  if (auth === "in" && member) return <MembersArea member={member} code={code} onOut={() => { setMember(null); setAuth("out"); }} />;
  return <JoinLogin onIn={load} />;
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="pt-16 md:pt-20"><section className="py-16"><div className="container-p4p">{children}</div></section></div>;
}

/* ---------- logged out: pitch + join/login ---------- */
function JoinLogin({ onIn }: { onIn: () => void }) {
  const [mode, setMode] = useState<"join" | "login">("join");
  return (
    <Wrap>
      <div className="mx-auto max-w-5xl grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="section-eyebrow">The Inner Circle</span>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
            Dave's coaching <span className="gradient-text">community</span>
          </h1>
          <p className="mt-4 text-muted">
            Build muscle, gain weight, and optimize your health — with Dave's guidance, a private
            community, and <strong className="text-ink">25% off</strong> the peptide company for members.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {["Private members community & coaching", "Workouts, protocols & plain-English education", "Members-only 25% discount code", "Weekly content and Q&A"].map((f) => (
              <li key={f} className="flex items-center gap-2"><span className="text-accent">✓</span>{f}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-6 shadow-card">
          <div className="mb-4 flex gap-2">
            {(["join", "login"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-bold capitalize ${mode === m ? "cta" : "border border-line text-muted"}`}>
                {m === "join" ? "Join" : "Log in"}
              </button>
            ))}
          </div>
          {mode === "join" ? <JoinForm onIn={onIn} /> : <LoginForm onIn={onIn} />}
        </div>
      </div>
    </Wrap>
  );
}

const inp = "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-gold";

function JoinForm({ onIn }: { onIn: () => void }) {
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [waiver, setWaiver] = useState(false);
  const [showW, setShowW] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await api("/member/register", { method: "POST", body: JSON.stringify({ ...f, waiver }) });
      const d = await r.json();
      if (r.ok) onIn(); else setErr(d.error || "Could not create account");
    } catch { setErr("Network error"); }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inp} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className={inp} type="email" required placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className={inp} type="password" required placeholder="Password (8+ characters)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <div className="rounded-xl border border-line bg-bg p-3 text-xs text-muted">
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-0.5" />
          <span>I am 18+ and I agree to the <button type="button" onClick={() => setShowW((v) => !v)} className="font-semibold text-accent underline">Membership Agreement</button> (not medical advice; I release Peptides 4 Power from liability).</span>
        </label>
        {showW && <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap border-t border-line pt-3 text-[11px] leading-relaxed">{WAIVER}</pre>}
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
      <button type="submit" disabled={busy || !waiver} className="cta w-full rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60">
        {busy ? "Creating…" : "Create my account"}
      </button>
    </form>
  );
}

function LoginForm({ onIn }: { onIn: () => void }) {
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await api("/member/login", { method: "POST", body: JSON.stringify(f) });
      if (r.ok) onIn(); else setErr((await r.json().catch(() => ({})))?.error || "Login failed");
    } catch { setErr("Network error"); }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inp} type="email" required placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className={inp} type="password" required placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <p className="text-sm text-red-500">{err}</p>}
      <button type="submit" disabled={busy} className="cta w-full rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60">{busy ? "…" : "Log in"}</button>
    </form>
  );
}

/* ---------- logged in: members area ---------- */
function MembersArea({ member, code, onOut }: { member: Member; code: string | null; onOut: () => void }) {
  async function logout() { await api("/member/logout", { method: "POST" }); onOut(); }
  const active = member.status === "active";
  return (
    <Wrap>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="section-eyebrow">Members area</span>
            <h1 className="mt-2 font-display text-3xl font-bold">Welcome{member.name ? `, ${member.name.split(" ")[0]}` : ""} 👋</h1>
          </div>
          <button onClick={logout} className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-ink">Log out</button>
        </div>

        {active ? (
          <>
            <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-6 text-center">
              <p className="text-sm font-semibold text-muted">Your members-only discount</p>
              <p className="mt-2 font-display text-4xl font-bold tracking-wide text-accent">{code}</p>
              <p className="mt-2 text-sm text-muted">25% off at the peptide company. Use at checkout.</p>
            </div>
            <div className="mt-6 rounded-2xl border border-line bg-panel p-8 text-center text-muted">
              <p className="font-display text-lg font-bold text-ink">The community feed is coming next</p>
              <p className="mt-1 text-sm">Posts, Q&A, workouts, and Dave's weekly content will live right here.</p>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-line bg-panel p-8 text-center">
            <p className="font-display text-lg font-bold">Your membership is almost ready</p>
            <p className="mt-2 text-sm text-muted">Paid membership checkout is being set up. You'll get access to the 25% code and the community as soon as it's live.</p>
          </div>
        )}
      </div>
    </Wrap>
  );
}
