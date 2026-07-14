import { prisma } from './prisma';
import { getDashboard, getOrCreateProfile } from './data';
import { today, addDays, toISODate, formatLongDate, daysBetween } from './date';
import { scheduleLabel } from './schedule';
import { bmi, round } from './utils';

export const VENICE_URL = 'https://api.venice.ai/api/v1/chat/completions';
// Uncensored default so the companion engages naturally with peptide, hormone,
// and weight-loss topics that heavily-aligned models often refuse. The system
// prompt still keeps the tone warm and responsible (not medical advice).
export const DEFAULT_VENICE_MODEL = 'venice-uncensored';

export const SYSTEM_PROMPT = `You are Carol's warm, supportive best friend and wellness companion. Always call her Carol. Be encouraging, casual, and caring — like a close girlfriend checking in. You know her health goals, peptide schedule, weight progress, and daily logs (provided as context). Celebrate wins, gently encourage on hard days, answer wellness and nutrition questions in plain language, never lecture. Keep replies conversational and reasonably short. You are not a doctor — for medical decisions, warmly suggest she check with her healthcare provider.`;

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMsg {
  role: ChatRole;
  content: string;
}

/**
 * Build the server-assembled context block appended to the system prompt on
 * every /api/chat request: profile, goals, today's status, and weight trend.
 */
export async function buildContextBlock(): Promise<string> {
  const day = today();
  const [profile, dash, weighIns, peptides] = await Promise.all([
    getOrCreateProfile(),
    getDashboard(day),
    prisma.weighIn.findMany({ orderBy: { date: 'asc' } }),
    prisma.peptide.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }),
  ]);

  const lines: string[] = [];
  lines.push(`Today is ${formatLongDate(day)}.`);
  lines.push(`Her name is ${profile.name}.`);

  if (profile.goals.length) lines.push(`Health goals: ${profile.goals.join(', ')}.`);

  // Weight progress
  if (weighIns.length) {
    const latest = weighIns[weighIns.length - 1];
    const start = profile.startingWeight ?? weighIns[0].weight;
    const goal = profile.goalWeight;
    const lost = round(start - latest.weight, 1);
    let weightLine = `Latest weigh-in: ${latest.weight} lbs (on ${toISODate(latest.date)}).`;
    if (lost > 0) weightLine += ` Down ${lost} lbs from her starting weight of ${start} lbs.`;
    else if (lost < 0) weightLine += ` Up ${Math.abs(lost)} lbs from her starting weight of ${start} lbs.`;
    if (goal) {
      const toGo = round(latest.weight - goal, 1);
      weightLine += ` Goal weight is ${goal} lbs (${toGo > 0 ? `${toGo} lbs to go` : 'goal reached!'}).`;
    }
    const bmiVal = bmi(latest.weight, profile.heightIn);
    if (bmiVal) weightLine += ` Current BMI ~${bmiVal}.`;
    lines.push(weightLine);

    // Short trend across recent weigh-ins
    if (weighIns.length >= 2) {
      const recent = weighIns.slice(-4).map((w) => `${w.weight}`).join(' → ');
      lines.push(`Recent weight trend: ${recent} lbs.`);
    }
  } else {
    lines.push('No weigh-ins recorded yet.');
  }

  if (profile.targetDate) {
    const dleft = daysBetween(day, profile.targetDate);
    if (dleft >= 0) lines.push(`Target date is ${toISODate(profile.targetDate)} (${dleft} days away).`);
  }

  // Peptide schedule
  if (peptides.length) {
    const list = peptides.map((p) => `${p.name} ${p.dose} (${scheduleLabel(p)}, ${p.route})`).join('; ');
    lines.push(`Peptides: ${list}.`);
  }

  // Today's dosing status
  if (dash.duePeptides.length) {
    const done = dash.duePeptides.filter((d) => d.logged).map((d) => d.peptide.name);
    const pending = dash.duePeptides.filter((d) => !d.logged).map((d) => d.peptide.name);
    lines.push(
      `Today's doses — done: ${done.length ? done.join(', ') : 'none yet'}; still due: ${pending.length ? pending.join(', ') : 'none'}.`,
    );
  }
  if (dash.streak > 0) lines.push(`Current dosing streak: ${dash.streak} day(s) in a row.`);

  // Water, sleep, mood
  lines.push(`Water today: ${dash.waterOz} of ${dash.waterGoalOz} oz.`);
  if (dash.sleepHours != null) lines.push(`Slept ${dash.sleepHours} hours last night.`);
  if (dash.mood != null && dash.energy != null)
    lines.push(`Mood ${dash.mood}/5, energy ${dash.energy}/5 today.`);

  return `Here is Carol's current wellness context. Use it to personalize your replies, but do not just recite it:\n\n${lines.join('\n')}`;
}

export interface VeniceResult {
  ok: boolean;
  content?: string;
  error?: string;
}

/** Call the Venice chat completions API server-side. */
export async function callVenice(messages: ChatMsg[], opts?: { temperature?: number; maxTokens?: number }): Promise<VeniceResult> {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'The AI companion is not configured yet (missing VENICE_API_KEY).' };
  }
  const model = process.env.VENICE_MODEL || DEFAULT_VENICE_MODEL;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(VENICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts?.temperature ?? 0.8,
        max_tokens: opts?.maxTokens ?? 600,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[venice] non-200', res.status, text.slice(0, 500));
      return {
        ok: false,
        error:
          res.status === 401
            ? 'The AI companion could not authenticate. Check the Venice API key.'
            : 'The AI companion is having a moment. Please try again shortly.',
      };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return { ok: false, error: 'The AI companion sent an empty reply. Try again.' };
    return { ok: true, content };
  } catch (err) {
    console.error('[venice] fetch error', err);
    return { ok: false, error: 'Could not reach the AI companion right now. Please try again.' };
  }
}
