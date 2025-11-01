"use client";

import { useEffect, useMemo, useState } from 'react';
import type { MoodValence } from '@/lib/mood-map';

type MoodConfig = {
  quadrants: Array<{
    id: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    micro_tips: { conversation: string[]; selfcare: string[] };
  }>;
};

type MoodFlowValue = {
  valence: MoodValence;
  intensity: number;
  intensityBand: 'baja' | 'media' | 'alta';
  label: string;
  note?: string;
};

type LegacyMoodValue = {
  quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
};

export default function ThanksPage() {
  const [last] = useState<{ 
    sessionId?: string; 
    before?: MoodFlowValue | LegacyMoodValue;
  } | null>(() => {
    try {
      const raw = sessionStorage.getItem('last_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Determinar si es nuevo formato (MoodFlow) o antiguo
  const isMoodFlow = last?.before && 'intensity' in (last.before as MoodFlowValue);
  const moodFlow = isMoodFlow ? (last?.before as MoodFlowValue) : null;
  const legacyQuadrant = !isMoodFlow ? (last?.before as LegacyMoodValue)?.quadrant ?? null : null;

  const [config, setConfig] = useState<MoodConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/config/mood.json');
        setConfig(await res.json());
      } catch (err) {
        console.error('Error loading mood config:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Mapear valence+intensity a cuadrante para obtener tips
  const getQuadrantFromMoodFlow = (valence: MoodValence, intensityBand: 'baja' | 'media' | 'alta'): 'Q1' | 'Q2' | 'Q3' | 'Q4' | null => {
    if (valence === 'agradable') {
      return intensityBand === 'alta' ? 'Q1' : intensityBand === 'baja' ? 'Q4' : 'Q1'; // media → Q1
    }
    if (valence === 'dificil') {
      return intensityBand === 'alta' ? 'Q2' : intensityBand === 'baja' ? 'Q3' : 'Q2'; // media → Q2
    }
    // neutral: usar Q1 como default
    return 'Q1';
  };

  const tips = useMemo(() => {
    if (!config) return null;

    let quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null = null;
    
    if (isMoodFlow && moodFlow) {
      quadrant = getQuadrantFromMoodFlow(moodFlow.valence, moodFlow.intensityBand);
    } else {
      quadrant = legacyQuadrant;
    }

    if (!quadrant) return null;
    
    const q = config.quadrants.find((x) => x.id === quadrant);
    if (!q) return null;
    
    const sid = last?.sessionId || 'seed';
    const hash = Array.from(sid).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const pickAt = (arr: string[]) => (arr.length ? arr[hash % arr.length] : '');
    
    return { 
      conversation: pickAt(q.micro_tips.conversation), 
      selfcare: pickAt(q.micro_tips.selfcare) 
    };
  }, [config, isMoodFlow, moodFlow, legacyQuadrant, last]);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-2xl p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">¡Gracias!</h1>
          <p className="text-slate-600">Tu registro se ha enviado correctamente.</p>
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-sm text-slate-600">Preparando recomendaciones…</div>
          </div>
        )}

        {!loading && !tips && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-sm text-slate-600">No hay recomendaciones disponibles en este momento.</div>
          </div>
        )}

        {!loading && tips && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Sugerencias para tu sesión</h2>
            
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900 mb-1">Para conversar</div>
                  <div className="text-sm text-slate-700 leading-relaxed">{tips.conversation}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900 mb-1">Para cuidarte</div>
                  <div className="text-sm text-slate-700 leading-relaxed">{tips.selfcare}</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
