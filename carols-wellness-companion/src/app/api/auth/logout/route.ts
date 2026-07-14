import { cookies } from 'next/headers';
import { ok, handle } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  return handle(async () => {
    cookies().delete(SESSION_COOKIE);
    return ok({ success: true });
  });
}
