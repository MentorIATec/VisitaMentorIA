import { NextResponse } from 'next/server';
import { E2E_MOCKS, mocks } from '@/lib/test-mocks';

export async function GET() {
  if (!E2E_MOCKS) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const tokens = Array.from(mocks.followupTokens.entries());
  const last = tokens[tokens.length - 1];
  return NextResponse.json({ token: last?.[0] || null });
}


