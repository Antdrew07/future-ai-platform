'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  getPrefs,
  setPrefs,
  permissionState,
  requestPermission,
  showNotification,
  scheduleTodayReminders,
  type ReminderPrefs,
} from '@/lib/notifications';

const ITEMS: { key: keyof ReminderPrefs; label: string; desc: string }[] = [
  { key: 'doses', label: 'Dose reminders', desc: 'Morning & evening nudges' },
  { key: 'water', label: 'Water nudge', desc: 'A midday hydration reminder' },
  { key: 'weighIn', label: 'Weigh-in day', desc: 'Gentle Sunday check-in' },
];

export default function NotificationSettings() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [prefs, setLocalPrefs] = useState<ReminderPrefs>({ doses: false, water: false, weighIn: false });

  useEffect(() => {
    setSupported('Notification' in window);
    setPermission(permissionState());
    setLocalPrefs(getPrefs());
  }, []);

  function persist(next: ReminderPrefs) {
    setLocalPrefs(next);
    setPrefs(next);
    scheduleTodayReminders(next);
  }

  async function enable() {
    const result = await requestPermission();
    setPermission(result);
    if (result === 'granted') {
      const next = { doses: true, water: true, weighIn: true };
      persist(next);
      void showNotification("You're all set! 🌸", "I'll gently remind you throughout the day, Carol.");
    }
  }

  if (!supported) {
    return <p className="text-sm text-charcoal-muted">Notifications aren&apos;t supported on this device.</p>;
  }

  if (permission !== 'granted') {
    return (
      <div>
        <p className="mb-3 text-sm text-charcoal-muted">
          Turn on gentle reminders for doses, water, and weigh-ins. Add this app to your home screen
          for the best experience.
        </p>
        <button onClick={enable} className="btn-primary w-full">
          {permission === 'denied' ? 'Notifications blocked — enable in browser settings' : 'Enable reminders'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ITEMS.map((it) => (
        <label
          key={it.key}
          className="flex cursor-pointer items-center justify-between rounded-2xl bg-white px-3 py-2.5"
        >
          <span>
            <span className="block text-sm font-medium text-charcoal">{it.label}</span>
            <span className="block text-xs text-charcoal-muted">{it.desc}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs[it.key]}
            onClick={() => persist({ ...prefs, [it.key]: !prefs[it.key] })}
            className={cn(
              'relative h-6 w-11 rounded-full transition',
              prefs[it.key] ? 'bg-blush-500' : 'bg-blush-100',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                prefs[it.key] ? 'left-[1.375rem]' : 'left-0.5',
              )}
            />
          </button>
        </label>
      ))}
      <button
        onClick={() => showNotification('Test reminder 💗', 'This is how your reminders will look, Carol.')}
        className="btn-outline w-full text-xs"
      >
        Send a test notification
      </button>
    </div>
  );
}
