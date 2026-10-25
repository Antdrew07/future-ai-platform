import { useState, type FormEvent } from "react";
import { CONTACT } from "@/data/content";

/**
 * Paste a form endpoint here to enable live submissions without a backend.
 * Works with Formspree (https://formspree.io/f/xxxx) or Basin / Getform, etc.
 * While empty, the form falls back to a mailto: (if CONTACT.email is set).
 */
const FORM_ENDPOINT = "";

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (!FORM_ENDPOINT) {
      // Fallback: compose an email the visitor can send.
      if (CONTACT.email) {
        const subject = encodeURIComponent(`Peptides 4 Power — message from ${data.get("name")}`);
        const body = encodeURIComponent(
          `${data.get("message")}\n\nReply to: ${data.get("email")}`,
        );
        window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
        return;
      }
      setStatus("error");
      return;
    }

    try {
      setStatus("sending");
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (res.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="py-16 md:py-20">
      <div className="container-p4p">
        <div className="mx-auto max-w-xl">
          <div className="text-center">
            <span className="section-eyebrow">Contact</span>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">Get in touch</h2>
            <p className="mt-3 text-muted">{CONTACT.blurb}</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="name"
                required
                placeholder="Your name"
                className="rounded-xl border border-line bg-panel px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Your email"
                className="rounded-xl border border-line bg-panel px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none"
              />
            </div>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="How can we help?"
              className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="cta w-full rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>

            {status === "sent" && (
              <p className="text-center text-sm text-emerald-400">
                Thanks — your message is on its way.
              </p>
            )}
            {status === "error" && (
              <p className="text-center text-sm text-rose-400">
                Messaging isn't wired up yet. Reach out on social for now.
              </p>
            )}
          </form>

          {CONTACT.socials.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              {CONTACT.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted transition hover:text-accent"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
