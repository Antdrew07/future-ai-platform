import { ok, fail, handle } from '@/lib/api';
import { getMonthStatus } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get('year'));
    const month = Number(searchParams.get('month')); // 0-11
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
      return fail('Invalid year/month.', 400);
    }
    const days = await getMonthStatus(year, month);
    return ok({ year, month, days });
  });
}
