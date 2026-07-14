'use client';

import { useEffect } from 'react';
import { getPrefs, scheduleTodayReminders } from '@/lib/notifications';

/** Registers the service worker and schedules local reminders on app load. */
export default function ClientBoot() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* ignore registration errors */
      });
    }
    scheduleTodayReminders(getPrefs());
  }, []);

  return null;
}
