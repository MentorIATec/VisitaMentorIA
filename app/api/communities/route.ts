import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { E2E_MOCKS, mocks } from '@/lib/test-mocks';

export async function GET() {
  if (E2E_MOCKS) {
    return NextResponse.json(mocks.communities);
  }
  const res = await query<{ id: number; code: string; name: string; color: string }>(
    `SELECT id, code, name, color FROM public.communities WHERE active = true ORDER BY name`
  );
  return NextResponse.json(res.rows);
}


