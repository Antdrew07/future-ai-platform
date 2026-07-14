// Client-side local notification helpers. Real background push requires a push
// server + VAPID keys; here we provide install-friendly local reminders that
// fire while the app is open (best-effort, "where supported").

export type ReminderPrefs = {
  doses: boolean;
  water: boolean;
  weighIn: boolean;
};

const KEY = 'carol.reminders';

export function getPrefs(): ReminderPrefs {
  if (typeof window === 'undefined') return { doses: false, water: false, weighIn: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { doses: false, water: false, weighIn: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { doses: false, water: false, weighIn: false };
}

export function setPrefs(prefs: ReminderPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function permissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

export async function showNotification(title: string, body: string) {
  if (permissionState() !== 'granted') return;
  const options: NotificationOptions = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fall through to plain Notification */
  }
  new Notification(title, options);
}

const timers: number[] = [];

function scheduleAt(hour: number, minute: number, cb: () => void) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return; // already passed today
  timers.push(window.setTimeout(cb, ms));
}

/** (Re)schedule today's reminders based on prefs. Fires only while app open. */
export function scheduleTodayReminders(prefs: ReminderPrefs) {
  timers.forEach((t) => clearTimeout(t));
  timers.length = 0;
  if (permissionState() !== 'granted') return;

  if (prefs.doses) {
    scheduleAt(9, 0, () => showNotification('Morning dose 💉', "Time for your morning peptides, Carol."));
    scheduleAt(20, 0, () => showNotification('Evening dose 🌙', "Don't forget tonight's dose."));
  }
  if (prefs.water) {
    scheduleAt(14, 0, () => showNotification('Water break 💧', 'A little midday hydration goes a long way!'));
  }
  if (prefs.weighIn && new Date().getDay() === 0) {
    scheduleAt(9, 30, () => showNotification('Weigh-in day 🌸', 'A gentle Sunday check-in when you’re ready.'));
  }
}
