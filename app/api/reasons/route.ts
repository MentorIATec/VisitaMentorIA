import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { E2E_MOCKS, mocks } from '@/lib/test-mocks';

export async function GET() {
  if (E2E_MOCKS) {
    return NextResponse.json(mocks.reasons);
  }
  const res = await query<{ id: number; code: string; label: string }>(
    `SELECT id, code, label FROM public.reasons WHERE active = true ORDER BY id`
  );
  return NextResponse.json(res.rows);
}


