import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Lightweight health check for Railway. Does not touch the database so it stays
// green during cold starts / migrations.
export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'carols-wellness-companion' });
}
