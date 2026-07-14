'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Lock } from 'lucide-react';
import { apiPost } from '@/lib/http';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost('/api/auth/login', { passcode });
      const from = params.get('from');
      router.replace(from && from.startsWith('/') ? from : '/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6">
      <div className="animate-fade-in w-full">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blush-400 to-blush-600 shadow-soft">
            <Heart className="h-8 w-8 text-white" fill="white" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Carol&apos;s Wellness</h1>
          <p className="mt-2 text-charcoal-muted">Your private companion. Welcome back. 💗</p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="passcode">
              Enter your passcode
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blush-400" />
              <input
                id="passcode"
                type="password"
                inputMode="text"
                autoComplete="current-password"
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="input pl-11"
                placeholder="••••••"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700">{error}</p>
          )}

          <button type="submit" disabled={loading || !passcode} className="btn-primary w-full py-3.5">
            {loading ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-charcoal-muted">
          For personal tracking and encouragement only — not medical advice.
        </p>
      </div>
    </div>
  );
}
