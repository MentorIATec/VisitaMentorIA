import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { E2E_MOCKS, mocks } from '@/lib/test-mocks';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const communityId = searchParams.get('communityId');
  const mentorId = searchParams.get('mentorId');
  const startDate = searchParams.get('startDate'); // YYYY-MM-DD
  const endDate = searchParams.get('endDate'); // YYYY-MM-DD
  const format = searchParams.get('format'); // 'simple' para compatibilidad, 'full' (default)

  // Construir WHERE clause
  const where: string[] = [];
  const params: unknown[] = [];

  if (communityId) {
    params.push(Number(communityId));
    where.push(`s.community_id = $${params.length}`);
  }
  if (mentorId) {
    params.push(mentorId);
    where.push(`s.mentor_id = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    where.push(`DATE(s.created_at) >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    where.push(`DATE(s.created_at) <= $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Modo simple: mantener compatibilidad con código existente
  if (format === 'simple') {
    // Para modo simple, solo filtrar por communityId si está presente
    const simpleWhere: string[] = [];
    const simpleParams: unknown[] = [];
    
    if (communityId) {
      simpleParams.push(Number(communityId));
      simpleWhere.push(`s.community_id = $${simpleParams.length}`);
    }
    
    const simpleWhereSql = simpleWhere.length ? `WHERE ${simpleWhere.join(' AND ')}` : '';
    
    const sql = `
      SELECT c.id, c.code, c.name, c.color, COUNT(s.id) AS sessions_count
      FROM public.communities c
      LEFT JOIN public.sessions s ON s.community_id = c.id
      ${simpleWhereSql}
      GROUP BY c.id, c.code, c.name, c.color
      ORDER BY c.name
    `;
    
    if (E2E_MOCKS) {
      type Community = { id: number; code: string; name: string; color: string };
      type SessionMock = { communityId?: number };
      const comms = mocks.communities as Array<Community>;
      const rows = comms
        .filter((c) => (!communityId ? true : String(c.id) === String(communityId)))
        .map((c) => {
          let count = 0;
          for (const [, s] of mocks.sessions as Map<string, SessionMock>) {
            if (s.communityId === c.id) count += 1;
          }
          return { id: c.id, code: c.code, name: c.name, color: c.color, sessions_count: String(count) };
        });
      return NextResponse.json(rows);
    }
    
    const res = await query<{ id: number; code: string; name: string; color: string; sessions_count: string }>(sql, simpleParams);
    return NextResponse.json(res.rows);
  }

  // Modo completo: KPIs y datos avanzados
  if (E2E_MOCKS) {
    // Mock completo para tests
    const mockKpis = {
      today: 0,
      week: 0,
      median_duration: 0,
      avg_delta_valence: 0,
      avg_delta_energy: 0,
      after_response_rate: 0
    };
    const mockTimeSeries: Array<{ date: string; count: number }> = [];
    const mockReasons: Array<{ reason_id: number | null; reason_code: string | null; reason_label: string | null; count: number }> = [];
    const mockQuadrants: Array<{ moment: string; quadrant: string | null; count: number }> = [];
    const mockCommunities: Array<{ id: number; code: string; name: string; color: string; sessions_count: string }> = [];

    return NextResponse.json({
      kpis: mockKpis,
      timeSeries: mockTimeSeries,
      reasonsDistribution: mockReasons,
      quadrants: mockQuadrants,
      communities: mockCommunities
    });
  }

  // KPIs
  const kpisQuery = `
    WITH filtered_sessions AS (
      SELECT s.* FROM public.sessions s ${whereSql}
    ),
    sessions_with_after AS (
      SELECT 
        s.id,
        s.created_at,
        s.duration_min,
        s.followup_completed_at,
        me_before.valence AS valence_before,
        me_before.energy AS energy_before,
        me_after.valence AS valence_after,
        me_after.energy AS energy_after
      FROM filtered_sessions s
      LEFT JOIN public.mood_events me_before ON me_before.session_id = s.id AND me_before.moment = 'before'
      LEFT JOIN public.mood_events me_after ON me_after.session_id = s.id AND me_after.moment = 'after'
    )
    SELECT 
      COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS today,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS week,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_min) AS median_duration,
      AVG((valence_after - valence_before)) FILTER (WHERE valence_after IS NOT NULL AND valence_before IS NOT NULL) AS avg_delta_valence,
      AVG((energy_after - energy_before)) FILTER (WHERE energy_after IS NOT NULL AND energy_before IS NOT NULL) AS avg_delta_energy,
      COUNT(*) FILTER (WHERE followup_completed_at IS NOT NULL)::float / NULLIF(COUNT(*), 0) AS after_response_rate
    FROM sessions_with_after
  `;

  const kpisRes = await query<{
    today: number;
    week: number;
    median_duration: number;
    avg_delta_valence: number | null;
    avg_delta_energy: number | null;
    after_response_rate: number | null;
  }>(kpisQuery, params);

  const kpis = {
    today: Number(kpisRes.rows[0]?.today || 0),
    week: Number(kpisRes.rows[0]?.week || 0),
    median_duration: Math.round(Number(kpisRes.rows[0]?.median_duration || 0)),
    avg_delta_valence: Number(kpisRes.rows[0]?.avg_delta_valence || 0),
    avg_delta_energy: Number(kpisRes.rows[0]?.avg_delta_energy || 0),
    after_response_rate: Number(kpisRes.rows[0]?.after_response_rate || 0)
  };

  // Time series: sesiones por día
  const timeSeriesQuery = `
    SELECT 
      DATE(created_at) AS date,
      COUNT(*)::integer AS count
    FROM public.sessions s
    ${whereSql}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  const timeSeriesRes = await query<{ date: string; count: number }>(timeSeriesQuery, params);
  const timeSeries = timeSeriesRes.rows.map(r => ({
    date: r.date,
    count: Number(r.count)
  }));

  // Reasons distribution
  const reasonsQuery = `
    SELECT 
      s.reason_id,
      r.code AS reason_code,
      r.label AS reason_label,
      COUNT(*)::integer AS count
    FROM public.sessions s
    LEFT JOIN public.reasons r ON r.id = s.reason_id
    ${whereSql}
    GROUP BY s.reason_id, r.code, r.label
    ORDER BY count DESC
    LIMIT 10
  `;

  const reasonsRes = await query<{
    reason_id: number | null;
    reason_code: string | null;
    reason_label: string | null;
    count: number;
  }>(reasonsQuery, params);

  const reasonsDistribution = reasonsRes.rows.map(r => ({
    reason_id: r.reason_id,
    reason_code: r.reason_code,
    reason_label: r.reason_label,
    count: Number(r.count)
  }));

  // Quadrants distribution (BEFORE/AFTER)
  const quadrantsQuery = `
    SELECT 
      me.moment,
      me.quadrant,
      COUNT(*)::integer AS count
    FROM public.mood_events me
    JOIN public.sessions s ON s.id = me.session_id
    ${whereSql}
    WHERE me.quadrant IS NOT NULL
    GROUP BY me.moment, me.quadrant
    ORDER BY me.moment, me.quadrant
  `;

  const quadrantsRes = await query<{ moment: string; quadrant: string; count: number }>(quadrantsQuery, params);
  const quadrants = quadrantsRes.rows.map(r => ({
    moment: r.moment,
    quadrant: r.quadrant,
    count: Number(r.count)
  }));

  // Communities (mantener compatibilidad)
  // Construir subquery para sesiones filtradas
  const communitiesWhereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const communitiesQuery = `
    SELECT c.id, c.code, c.name, c.color, COUNT(s.id) AS sessions_count
    FROM public.communities c
    LEFT JOIN public.sessions s ON s.community_id = c.id ${communitiesWhereSql ? `AND s.id IN (SELECT id FROM public.sessions ${communitiesWhereSql})` : ''}
    GROUP BY c.id, c.code, c.name, c.color
    ORDER BY c.name
  `;

  const communitiesRes = await query<{ id: number; code: string; name: string; color: string; sessions_count: string }>(
    communitiesQuery,
    where.length ? params : []
  );

  const communities = communitiesRes.rows;

  return NextResponse.json({
    kpis,
    timeSeries,
    reasonsDistribution,
    quadrants,
    communities
  });
}
