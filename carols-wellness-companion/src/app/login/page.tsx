'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Lock, User, Eye, EyeOff } from 'lucide-react';
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
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost('/api/auth/login', { username, passcode });
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
            <label className="label" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blush-400" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input pl-11"
                placeholder="carol"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="passcode">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blush-400" />
              <input
                id="passcode"
                type={showPw ? 'text' : 'password'}
                inputMode="text"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="input pl-11 pr-11"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-blush-400 hover:bg-blush-50"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !passcode}
            className="btn-primary w-full py-3.5"
          >
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
