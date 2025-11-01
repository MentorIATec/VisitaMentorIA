import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendFollowupEmail } from '@/lib/email';
import { E2E_MOCKS, mocks } from '@/lib/test-mocks';
import { auth } from '@/lib/auth';

/**
 * Endpoint cron para enviar correos de follow-up
 * 
 * Autenticación:
 * - Header X-Cron-Key (para llamadas externas como Vercel Cron)
 * - O sesión admin válida
 * 
 * Filtros de tiempo:
 * - T+24h: sesiones creadas entre hace 25h y 24h
 * - T+72h: sesiones creadas entre hace 73h y 72h (opcional, deshabilitado por defecto)
 */
export async function GET(req: NextRequest) {
  // Autenticación: cron key o admin
  const cronKey = req.headers.get('X-Cron-Key');
  const expectedCronKey = process.env.CRON_SECRET_KEY;
  
  if (!cronKey || cronKey !== expectedCronKey) {
    // Verificar sesión admin como fallback
    const session = await auth();
    const role = (session as any)?.role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const include72h = searchParams.get('include72h') === 'true';

  if (E2E_MOCKS) {
    // Simular envío en modo mocks
    const now = Date.now();
    const pendingSessions: Array<{ sessionId: string; email: string; token: string; variant: string; communityColor?: string }> = [];
    
    for (const [sessionId, session] of mocks.sessions.entries()) {
      const consent = session.consentFollowup === true;
      const variant = session.followup_variant as string;
      const sent = session.followup_sent_at;
      const email = session.email as string;
      const token = session.followupToken as string;
      
      if (consent && variant && !sent && email && token) {
        // Simular check de tiempo (en mocks esto es simplificado)
        pendingSessions.push({
          sessionId,
          email,
          token,
          variant,
          communityColor: '#EC008C' // default para mocks
        });
      }
    }

    const results = await Promise.allSettled(
      pendingSessions.map(async (s) => {
        await sendFollowupEmail(s.email, s.token, s.variant as 'A' | 'B', s.communityColor);
        const mockSession = mocks.sessions.get(s.sessionId);
        if (mockSession) {
          mockSession.followup_sent_at = new Date().toISOString();
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const errors = results.filter(r => r.status === 'rejected').length;
    
    return NextResponse.json({ 
      ok: true, 
      sent, 
      errors,
      total: pendingSessions.length 
    });
  }

  // Query real: T+24h y opcionalmente T+72h
  const timeFilters: string[] = [];
  
  // T+24h: entre 25h y 24h atrás
  timeFilters.push(`
    s.created_at >= now() - interval '25 hours'
    AND s.created_at <= now() - interval '24 hours'
  `);
  
  if (include72h) {
    // T+72h: entre 73h y 72h atrás
    timeFilters.push(`
      s.created_at >= now() - interval '73 hours'
      AND s.created_at <= now() - interval '72 hours'
    `);
  }

  const timeFilterSql = timeFilters.map(t => `(${t})`).join(' OR ');

  const sessions = await query<{
    id: string;
    email: string | null;
    followup_token: string;
    followup_variant: string;
    community_id: number;
    created_at: string;
  }>(
    `SELECT s.id, s.email, s.followup_token, s.followup_variant, s.community_id, s.created_at
     FROM public.sessions s
     WHERE s.consent_followup = true
       AND s.followup_variant IS NOT NULL
       AND s.followup_sent_at IS NULL
       AND s.email IS NOT NULL
       AND s.followup_token IS NOT NULL
       AND (${timeFilterSql})
     ORDER BY s.created_at ASC
     LIMIT 100`,
    []
  );

  if (sessions.rows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, errors: 0, total: 0 });
  }

  // Obtener colores de comunidades
  const communityIds = [...new Set(sessions.rows.map(s => s.community_id))];
  const communities = await query<{ id: number; color: string }>(
    `SELECT id, color FROM public.communities WHERE id = ANY($1)`,
    [communityIds]
  );
  const colorMap = new Map(communities.rows.map(c => [c.id, c.color]));

  // Enviar correos
  const results = await Promise.allSettled(
    sessions.rows.map(async (session) => {
      const color = colorMap.get(session.community_id) || '#000000';
      await sendFollowupEmail(
        session.email!,
        session.followup_token,
        session.followup_variant as 'A' | 'B',
        color
      );
      
      // Marcar como enviado
      await query(
        `UPDATE public.sessions SET followup_sent_at = now() WHERE id = $1`,
        [session.id]
      );
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const errors = results.filter(r => r.status === 'rejected').length;

  if (errors > 0) {
    const errorDetails = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason?.message || String(r.reason));
    console.error('[CRON FOLLOWUP] Errores:', errorDetails);
  }

  return NextResponse.json({
    ok: true,
    sent,
    errors,
    total: sessions.rows.length
  });
}

