import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blush-400 to-blush-600 shadow-soft">
        <Heart className="h-8 w-8 text-white" fill="white" />
      </div>
      <h1 className="font-display text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-charcoal-muted">This little corner doesn&apos;t exist yet.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to your dashboard
      </Link>
    </div>
  );
}
