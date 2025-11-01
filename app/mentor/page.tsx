"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Chip from '@/components/ui/Chip';

type Community = { id: number; code: string; name: string; color: string };
type DashboardData = {
  kpis: {
    today: number;
    week: number;
    median_duration: number;
    avg_delta_valence: number;
    avg_delta_energy: number;
    after_response_rate: number;
  };
  timeSeries: Array<{ date: string; count: number }>;
  reasonsDistribution: Array<{ reason_id: number | null; reason_code: string | null; reason_label: string | null; count: number }>;
  quadrants: Array<{ moment: string; quadrant: string | null; count: number }>;
  communities: Array<{ id: number; code: string; name: string; color: string; sessions_count: string }>;
};

async function fetchDashboard(communityId?: number, mentorId?: string, startDate?: string, endDate?: string): Promise<DashboardData> {
  const url = new URL('/api/dashboard', window.location.origin);
  if (communityId) url.searchParams.set('communityId', String(communityId));
  if (mentorId) url.searchParams.set('mentorId', mentorId);
  if (startDate) url.searchParams.set('startDate', startDate);
  if (endDate) url.searchParams.set('endDate', endDate);
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Error cargando dashboard');
  return res.json();
}

async function fetchCommunities(): Promise<Community[]> {
  const res = await fetch('/api/communities');
  return res.json();
}

export default function MentorDashboard() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboard(
        selectedCommunity || undefined,
        undefined,
        startDate || undefined,
        endDate || undefined
      );
      setDashboard(data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const comms = await fetchCommunities();
      setCommunities(comms);
    })();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [selectedCommunity, startDate, endDate]);

  if (loading || !dashboard) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Dashboard Mentor</h1>
        <div className="text-gray-500">Cargando...</div>
      </main>
    );
  }

  // Preparar datos para scatter plot (BEFORE vs AFTER)
  const scatterData = dashboard.quadrants
    .reduce((acc, q) => {
      const key = q.quadrant || 'unknown';
      if (!acc[key]) {
        acc[key] = { before: 0, after: 0, quadrant: key };
      }
      if (q.moment === 'before') acc[key].before = q.count;
      if (q.moment === 'after') acc[key].after = q.count;
      return acc;
    }, {} as Record<string, { before: number; after: number; quadrant: string }>);

  const scatterPlotData = Object.values(scatterData).map(q => ({
    name: q.quadrant,
    before: q.before,
    after: q.after
  }));

  // Formatear porcentaje
  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard Mentor</h1>

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700">Filtrar por comunidad</label>
          <div className="flex gap-2 flex-wrap">
            <Chip
              selected={selectedCommunity === ''}
              onClick={() => setSelectedCommunity('')}
            >
              Todas
            </Chip>
            {communities.map((c) => (
              <Chip
                key={c.id}
                color={c.color}
                selected={selectedCommunity === c.id}
                onClick={() => setSelectedCommunity(c.id)}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-600 mb-1">Sesiones hoy</div>
          <div className="text-3xl font-bold text-slate-900">{dashboard.kpis.today}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-600 mb-1">Sesiones semana</div>
          <div className="text-3xl font-bold text-slate-900">{dashboard.kpis.week}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-600 mb-1">Mediana duración</div>
          <div className="text-3xl font-bold text-slate-900">{dashboard.kpis.median_duration} min</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-600 mb-1">Δ Valence promedio</div>
          <div className="text-3xl font-bold text-slate-900">{dashboard.kpis.avg_delta_valence.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-600 mb-1">Δ Energy promedio</div>
          <div className="text-3xl font-bold text-slate-900">{dashboard.kpis.avg_delta_energy.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-600 mb-1">Tasa respuesta AFTER</div>
          <div className="text-3xl font-bold text-slate-900">{formatPercent(dashboard.kpis.after_response_rate)}</div>
        </div>
      </div>

      {/* Gráfico de línea: Sesiones por día */}
      <div className="rounded-2xl border p-4 shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Sesiones por día</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dashboard.timeSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" name="Sesiones" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de barras: Motivos más frecuentes */}
      <div className="rounded-2xl border p-4 shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Motivos más frecuentes</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboard.reasonsDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="reason_label" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" name="Cantidad" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de dispersión: Quadrantes BEFORE vs AFTER */}
      {scatterPlotData.length > 0 && (
        <div className="rounded-2xl border p-4 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Distribución de cuadrantes: BEFORE vs AFTER</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={scatterPlotData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="before" name="BEFORE" />
              <YAxis dataKey="after" name="AFTER" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter dataKey="after" fill="#8884d8" name="AFTER" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comunidades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {dashboard.communities.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} aria-hidden="true" />
              <span className="font-semibold text-slate-900">{r.name}</span>
            </div>
            <div className="text-sm text-slate-600">Sesiones: <span className="font-medium text-slate-900">{r.sessions_count}</span></div>
          </div>
        ))}
      </div>
    </main>
  );
}
