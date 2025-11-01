import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { E2E_MOCKS, mocks } from '@/lib/test-mocks';

export async function GET() {
  if (E2E_MOCKS) {
    return NextResponse.json(mocks.mentors);
  }
  const res = await query<{ id: string; email: string; display_name: string | null; campus: string | null; comunidad_id: string | null }>(
    `SELECT id, email, display_name, campus, comunidad_id FROM public.mentors ORDER BY display_name NULLS LAST, email`
  );
  return NextResponse.json(res.rows);
}


