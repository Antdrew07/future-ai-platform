import { cookies } from 'next/headers';
import { z } from 'zod';
import { ok, fail, parseBody, handle } from '@/lib/api';
import { checkCredentials, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({
  username: z.string().min(1),
  passcode: z.string().min(1),
});

export async function POST(req: Request) {
  return handle(async () => {
    const { username, passcode } = await parseBody(req, schema);
    if (!checkCredentials(username, passcode)) {
      return fail('That username or password is incorrect. Try again.', 401);
    }
    cookies().set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
    return ok({ success: true });
  });
}
