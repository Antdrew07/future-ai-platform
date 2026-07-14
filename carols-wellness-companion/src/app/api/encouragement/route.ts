import { ok, handle } from '@/lib/api';
import { buildContextBlock, callVenice, SYSTEM_PROMPT } from '@/lib/venice';
import { getOrCreateProfile } from '@/lib/data';
import { today, toISODate } from '@/lib/date';

export const dynamic = 'force-dynamic';

// In-memory cache so we generate at most one encouragement line per day per
// running instance (keeps Venice usage light).
let cache: { iso: string; line: string } | null = null;

const FALLBACKS = [
  'One kind choice at a time — you are doing beautifully, Carol. 💗',
  'Small steps still move you forward. Proud of you today, Carol.',
  'Your future self is cheering for the care you give yourself right now.',
  'Gentle reminder: consistency, not perfection. You’ve got this, Carol.',
  'Drink your water, breathe deep, and be proud of how far you’ve come.',
];

function fallback(iso: string): string {
  const idx = Math.abs(iso.split('-').reduce((a, s) => a + Number(s), 0)) % FALLBACKS.length;
  return FALLBACKS[idx];
}

export async function GET() {
  return handle(async () => {
    const iso = toISODate(today());
    if (cache && cache.iso === iso) return ok({ line: cache.line });

    const profile = await getOrCreateProfile();
    if (!process.env.VENICE_API_KEY) {
      const line = fallback(iso);
      cache = { iso, line };
      return ok({ line });
    }

    const context = await buildContextBlock();
    const result = await callVenice(
      [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` },
        {
          role: 'user',
          content:
            'In ONE short warm sentence (max ~20 words, no quotation marks), give me a personalized encouragement for today. Speak directly to me.',
        },
      ],
      { temperature: 0.9, maxTokens: 80 },
    );

    const line = result.ok && result.content ? result.content.replace(/^["']|["']$/g, '') : fallback(iso);
    cache = { iso, line };
    return ok({ line, name: profile.name });
  });
}
