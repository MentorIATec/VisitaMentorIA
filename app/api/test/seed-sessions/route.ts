import { NextRequest, NextResponse } from 'next/server';
import { E2E_MOCKS, mocks } from '@/lib/test-mocks';
import crypto from 'node:crypto';

export async function POST(req: NextRequest) {
  if (!E2E_MOCKS) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { sessions?: Array<Record<string, unknown>> };
  const sessions = Array.isArray(body.sessions) ? body.sessions : [];
  const created: Array<{ sessionId: string; token?: string | null }> = [];
  for (const s of sessions) {
    const sessionId = `s_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    let followupToken: string | null = null;
    if (s.consentFollowup) {
      followupToken = crypto.randomUUID();
      mocks.followupTokens.set(followupToken, { sessionId, usedAt: null, expiresAt: new Date(Date.now() + 7*24*60*60*1000).toISOString() });
    }
    mocks.sessions.set(sessionId, { ...s, followupToken, followupVariant: 'A' });
    created.push({ sessionId, token: followupToken });
  }
  return NextResponse.json({ ok: true, created });
}


