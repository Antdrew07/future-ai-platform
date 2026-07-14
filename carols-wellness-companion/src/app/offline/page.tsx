import { HeartCrack } from 'lucide-react';

export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blush-100 text-blush-500">
        <HeartCrack className="h-8 w-8" />
      </div>
      <h1 className="font-display text-2xl font-semibold">You&apos;re offline</h1>
      <p className="mt-2 text-charcoal-muted">
        Your companion needs a connection to load your latest data. Reconnect and you&apos;ll be right
        back. 💗
      </p>
    </div>
  );
}
