'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Heart, RefreshCw } from 'lucide-react';
import { apiPost } from '@/lib/http';
import { cn } from '@/lib/utils';

type Msg = { id: string; role: string; content: string };

const SUGGESTIONS = [
  'How am I doing this week?',
  'What should I eat today?',
  'I had a hard day 💛',
  'Any tips to hit my water goal?',
];

export default function ChatView({ name, initialMessages }: { name: string; initialMessages: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    setInput('');
    const optimistic: Msg = { id: `tmp-${Date.now()}`, role: 'user', content: trimmed };
    setMessages((cur) => [...cur, optimistic]);
    setSending(true);
    try {
      const r = await apiPost<{ reply: string; id: string }>('/api/chat', { message: trimmed });
      setMessages((cur) => [...cur, { id: r.id, role: 'assistant', content: r.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message failed.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <header className="animate-fade-in mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-400 to-blush-600 shadow-soft">
          <Heart className="h-5 w-5 text-white" fill="white" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold leading-tight">Your Companion</h1>
          <p className="text-xs text-charcoal-muted">Always here for you, {name} 💗</p>
        </div>
      </header>

      <div ref={scrollRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto pb-2">
        {messages.length === 0 && (
          <div className="mt-6 rounded-3xl bg-white/70 p-5 text-center">
            <p className="font-display text-lg text-blush-700">Hi {name}! 🌸</p>
            <p className="mt-1 text-sm text-charcoal-muted">
              I&apos;m your wellness companion. Ask me anything, share how you&apos;re feeling, or just
              say hello.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[82%] whitespace-pre-wrap rounded-3xl px-4 py-2.5 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'rounded-br-lg bg-gradient-to-br from-blush-400 to-blush-600 text-white'
                  : 'rounded-bl-lg bg-white text-charcoal shadow-card',
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-3xl rounded-bl-lg bg-white px-4 py-3 shadow-card">
              <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[82%] rounded-3xl bg-blush-50 px-4 py-2.5 text-sm text-blush-700">
              {error}{' '}
              <button
                onClick={() => {
                  const last = [...messages].reverse().find((m) => m.role === 'user');
                  if (last) send(last.content);
                }}
                className="inline-flex items-center gap-1 font-medium underline"
              >
                <RefreshCw className="h-3 w-3" /> retry
              </button>
            </div>
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="chip shrink-0 bg-blush-50 text-blush-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          className="input !py-3"
          placeholder="Message your companion…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={sending || !input.trim()} className="btn-primary !px-4 !py-3">
          <Send className="h-5 w-5" />
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-charcoal-muted">
        Not medical advice · for encouragement & tracking only
      </p>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-blush-300"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}
