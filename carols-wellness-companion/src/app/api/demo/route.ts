import { z } from 'zod';
import { ok, fail, parseBody, handle } from '@/lib/api';
import { seedDemoData, clearAllData } from '@/lib/demo';

export const dynamic = 'force-dynamic';

const schema = z.object({ action: z.enum(['seed', 'clear']) });

export async function POST(req: Request) {
  return handle(async () => {
    if (process.env.DEMO_MODE !== 'true') {
      return fail('Demo mode is disabled. Set DEMO_MODE=true to enable.', 403);
    }
    const { action } = await parseBody(req, schema);
    if (action === 'seed') {
      await seedDemoData();
    } else {
      await clearAllData();
    }
    return ok({ success: true });
  });
}
