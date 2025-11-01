import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runWithUserContext } from '@/lib/roles';
import { E2E_MOCKS, mocks } from '@/lib/test-mocks';

const AfterSchema = z.object({
  token: z.string().uuid(),
  moodAfter: z.object({
    valence: z.number().int().min(-5).max(5),
    energy: z.number().int().min(-5).max(5),
    label: z.string().optional().nullable(),
    quadrant: z.string().optional().nullable()
  })
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = AfterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }
  const { token, moodAfter } = parsed.data;

  if (E2E_MOCKS) {
    let entry = mocks.followupTokens.get(token);
    if (!entry) {
      const sessionId = `s_${Date.now()}`;
      entry = { sessionId, usedAt: null, expiresAt: new Date(Date.now() + 7*24*60*60*1000).toISOString() };
      mocks.followupTokens.set(token, entry);
      mocks.sessions.set(sessionId, { consentFollowup: true });
    }
    if (entry.usedAt) {
      return NextResponse.json({ error: 'Token ya utilizado' }, { status: 409 });
    }
    entry.usedAt = new Date().toISOString();
    mocks.followupTokens.set(token, entry);
    const s = mocks.sessions.get(entry.sessionId) || {};
    mocks.sessions.set(entry.sessionId, { ...s, moodAfter });
    return NextResponse.json({ ok: true });
  }

  const email = null;
  const role = 'anonymous' as const;

  const result = await runWithUserContext(email, role, async (client) => {
    // Find session by token, ensure within 7 days, unused and consented
    const s = await client.query<{
      id: string;
      created_at: string;
      followup_completed_at: string | null;
      consent_followup: boolean | null;
    }>(
      `SELECT id, created_at, followup_completed_at, consent_followup
       FROM public.sessions
       WHERE followup_token = $1
         AND created_at > now() - interval '7 days'`,
      [token]
    );
    if (s.rowCount === 0) {
      return { status: 404 as const, body: { error: 'Token inválido o expirado' } };
    }
    const row = s.rows[0];
    if (row.followup_completed_at) {
      return { status: 409 as const, body: { error: 'Token ya utilizado' } };
    }
    if (!row.consent_followup) {
      return { status: 403 as const, body: { error: 'Sin consentimiento' } };
    }

    await client.query(
      `INSERT INTO public.mood_events (session_id, moment, valence, energy, label, quadrant)
       VALUES ($1,'after',$2,$3,$4,$5)
       ON CONFLICT (session_id, moment) DO NOTHING`,
      [row.id, moodAfter.valence, moodAfter.energy, moodAfter.label || null, moodAfter.quadrant || null]
    );

    await client.query(
      `UPDATE public.sessions
       SET followup_completed_at = now(), followup_token = NULL
       WHERE id = $1`,
      [row.id]
    );

    return { status: 200 as const, body: { ok: true } };
  });

  return NextResponse.json(result.body, { status: result.status });
}


