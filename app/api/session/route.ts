import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runWithUserContext } from '@/lib/roles';
import { auth } from '@/lib/auth';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { E2E_MOCKS, mocks } from '@/lib/test-mocks';
import { mapValenceToNum, mapIntensityToEnergy } from '@/lib/mood-map';

// Nuevo formato MoodFlow
const MoodFlowSchema = z.object({
  valence: z.enum(['dificil', 'neutral', 'agradable']),
  intensity: z.number().int().min(1).max(5),
  intensityBand: z.enum(['baja', 'media', 'alta']),
  label: z.string().min(1),
  note: z.string().max(300).optional().default('')
});

// Formato antiguo (compatibilidad)
const MoodLegacySchema = z.object({
  valence: z.number().int().min(-5).max(5),
  energy: z.number().int().min(-5).max(5),
  label: z.string().optional().nullable(),
  quadrant: z.string().optional().nullable()
});

// Esquema local (expuesto para tests)
const BaseSessionSchema = {
  matricula: z.string().min(3),
  communityId: z.number().int(),
  channel: z.never().optional(),
  campus: z.string().optional().nullable(),
  reasonId: z.number().int().optional().nullable(),
  reasonFree: z.string().optional().nullable(),
  durationMin: z.number().int().min(0).max(600),
  consentFollowup: z.boolean().default(false),
  email: z.string().email().optional().nullable(),
  moodBefore: z.union([MoodFlowSchema, MoodLegacySchema])
} as const;

export const SessionSchema = z.object(
  E2E_MOCKS
    ? { ...BaseSessionSchema, mentorId: z.string().min(1) }
    : { ...BaseSessionSchema, mentorId: z.string().uuid() }
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }
  const data = parsed.data;

  if (E2E_MOCKS) {
    const sessionId = `s_${Date.now()}`;
    let followupToken: string | null = null;
    let followupVariant: string | null = null;
    if (data.consentFollowup) {
      followupToken = crypto.randomUUID();
      followupVariant = 'A';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      mocks.followupTokens.set(followupToken, { sessionId, usedAt: null, expiresAt });
    }
    mocks.sessions.set(sessionId, { ...data, followupToken, followupVariant, email: data.email || null, followup_sent_at: null });
    return NextResponse.json({ ok: true, sessionId, followupToken });
  }

  // Role/email come from auth cookie (middleware enforces mentor/admin for dashboards; registro es público)
  const email = null; // registro es anónimo
  const role = 'anonymous' as const;
  
  // Verificar si hay sesión SSO
  const session = await auth();
  const extendedSession = session as unknown as { userId?: string | null; email?: string | null } | null;
  const userId = extendedSession?.userId || null;
  const sessionEmail = extendedSession?.email || null;

  // Calcular email_hash si hay email de sesión SSO
  let emailHash: string | null = null;
  if (sessionEmail) {
    const emailHashRes = await runWithUserContext(email, role, async (client) => {
      return await client.query<{ hash: string }>(
        'SELECT encode(digest($1 || current_setting(\'app.hash_salt\', true), \'sha256\'), \'hex\') AS hash',
        [sessionEmail.toLowerCase()]
      );
    });
    emailHash = emailHashRes.rows[0]?.hash || null;
  }

  const result = await runWithUserContext(email, role, async (client) => {
    // Compute salted hash via DB function using configured app.hash_salt
    const hashRes = await client.query<{ hash: string }>('SELECT public.hash_matricula($1) AS hash', [data.matricula]);
    const hash = hashRes.rows[0].hash;

    // Upsert keyring
    await client.query(
      `INSERT INTO public.students_keyring (hash_matricula) VALUES ($1)
       ON CONFLICT (hash_matricula) DO NOTHING`,
      [hash]
    );

    // Follow-up token only if consent; variante leída desde flags.json (default 'A')
    const followupToken = data.consentFollowup ? crypto.randomUUID() : null;
    let followupVariant: string | null = null;
    if (followupToken) {
      try {
        const flagsPath = path.join(process.cwd(), 'public', 'config', 'flags.json');
        const raw = fs.readFileSync(flagsPath, 'utf-8');
        const flags = JSON.parse(raw) as { ab_test_after?: string };
        followupVariant = (flags.ab_test_after || 'A').toString();
      } catch {
        followupVariant = 'A';
      }
    }

    const sessionRes = await client.query<{ id: string }>(
      `INSERT INTO public.sessions (
        hash_matricula, mentor_id, community_id, duration_min, reason_id, reason_free, channel, campus, consent_followup, followup_token, followup_variant, email, user_id, email_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id`,
      [
        hash,
        data.mentorId,
        data.communityId,
        data.durationMin,
        data.reasonId || null,
        data.reasonFree || null,
        'presencial',
        data.campus || null,
        data.consentFollowup,
        followupToken,
        followupVariant,
        data.email || null,
        userId,
        emailHash
      ]
    );
    const sessionId = sessionRes.rows[0].id;

    // Determinar si es nuevo formato (MoodFlow) o antiguo
    const isMoodFlow = 'intensity' in data.moodBefore;
    
    let valenceNum: number;
    let energyNum: number;
    let label: string | null;
    let intensity: number | null = null;
    let note: string | null = null;
    let quadrant: string | null = null;

    if (isMoodFlow) {
      // Nuevo formato: mapear a numéricos
      const moodFlow = data.moodBefore as z.infer<typeof MoodFlowSchema>;
      valenceNum = mapValenceToNum(moodFlow.valence);
      energyNum = mapIntensityToEnergy(moodFlow.intensity);
      label = moodFlow.label;
      intensity = moodFlow.intensity;
      note = moodFlow.note || null;
      quadrant = null; // No se usa en el nuevo formato
    } else {
      // Formato antiguo: usar valores directos
      const moodLegacy = data.moodBefore as z.infer<typeof MoodLegacySchema>;
      valenceNum = moodLegacy.valence;
      energyNum = moodLegacy.energy;
      label = moodLegacy.label || null;
      intensity = null;
      note = null;
      quadrant = moodLegacy.quadrant || null;
    }

    // Insertar en mood_events (con nuevos campos si existen)
    await client.query(
      `INSERT INTO public.mood_events (session_id, moment, valence, energy, label, quadrant, intensity, note)
       VALUES ($1,'before',$2,$3,$4,$5,$6,$7)`,
      [sessionId, valenceNum, energyNum, label, quadrant, intensity, note]
    );

    return { sessionId, followupToken };
  }, userId);

  return NextResponse.json({ ok: true, sessionId: result.sessionId, followupToken: result.followupToken });
}


