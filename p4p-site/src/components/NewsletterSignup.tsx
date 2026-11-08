import { useState } from "react";

type State = "idle" | "loading" | "ok" | "error";

export default function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setState("ok");
        setMsg("You're on the list! Check your inbox. 🎉");
        setEmail("");
      } else {
        setState("error");
        setMsg(data.error || "Something went wrong — please try again.");
      }
    } catch {
      setState("error");
      setMsg("Network error — please try again.");
    }
  }

  return (
    <div className="w-full max-w-md">
      <h3 className="font-display text-lg font-bold text-ink">Get the deals first</h3>
      <p className="mt-1 text-sm text-muted">
        New discount codes, sales, and Dave's Peptide of the Week — straight to your inbox.
      </p>

      {state === "ok" ? (
        <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-semibold text-accent">
          {msg}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            className="min-w-0 flex-1 rounded-full border border-line bg-panel px-4 py-3 text-sm text-ink outline-none transition focus:border-gold"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="cta inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold disabled:opacity-60"
          >
            {state === "loading" ? "Joining…" : "Notify me"}
          </button>
        </form>
      )}

      {state === "error" && <p className="mt-2 text-sm text-red-500">{msg}</p>}
    </div>
  );
}
