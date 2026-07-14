import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Parse and validate a JSON request body against a Zod schema. */
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ZodError([]);
  }
  return schema.parse(json);
}

/** Standard try/catch wrapper for route handlers. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      return fail('Invalid request data.', 422);
    }
    console.error('[api error]', err);
    return fail('Something went wrong. Please try again.', 500);
  }
}
