'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, TrendingUp, MessageCircleHeart, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/chat', label: 'Companion', icon: MessageCircleHeart },
  { href: '/journal', label: 'Journal', icon: NotebookPen },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between rounded-3xl border border-blush-100 bg-white/90 px-2 py-2 shadow-soft backdrop-blur-md">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition',
                  active ? 'text-blush-700' : 'text-charcoal-muted hover:text-blush-500',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full transition',
                    active ? 'bg-blush-100' : 'bg-transparent',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
