import { cookies } from 'next/headers';
import { z } from 'zod';
import { ok, fail, parseBody, handle } from '@/lib/api';
import { checkPasscode, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({ passcode: z.string().min(1) });

export async function POST(req: Request) {
  return handle(async () => {
    const { passcode } = await parseBody(req, schema);
    if (!process.env.APP_PASSCODE) {
      return fail('Server passcode is not configured. Set APP_PASSCODE.', 500);
    }
    if (!checkPasscode(passcode)) {
      return fail('That passcode does not match. Try again.', 401);
    }
    cookies().set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
    return ok({ success: true });
  });
}
