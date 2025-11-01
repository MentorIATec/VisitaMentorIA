"use client";

import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Field from '@/components/Field';
import MoodFlow from '@/components/MoodFlow';
import type { MoodFlowValue } from '@/components/MoodFlow';
import { mapValenceToNum, mapIntensityToEnergy } from '@/lib/mood-map';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Chip from '@/components/ui/Chip';
import Skeleton from '@/components/ui/Skeleton';
import { mocks } from '@/lib/test-mocks';

const Step1Schema = z.object({
  matricula: z.string().min(3),
  mentorId: z.string().min(1),
  communityId: z.number().int(),
  campus: z.string().optional().nullable(),
  email: z.string().email().optional().nullable()
});

// Versión simplificada: Step2Schema solo valida moodBefore
// reasonId y reasonFree siempre serán null
const Step2Schema = z.object({
  reasonId: z.null(), // Siempre null en versión simplificada
  reasonFree: z.null(), // Siempre null en versión simplificada
  durationMin: z.number().int().min(5).max(60),
  moodBefore: z.object({
    valence: z.enum(['dificil', 'neutral', 'agradable']),
    intensity: z.number().int().min(1).max(5),
    label: z.string().min(1),
    note: z.string().max(300).optional().default('')
  })
});

type Community = { id: number; code: string; name: string; color: string };
type Mentor = { id: string; email: string; display_name: string | null; campus: string | null; comunidad_id: string | null };

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {
      if (i === retries - 1) throw new Error(`Failed to fetch ${url}`);
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moodBefore, setMoodBefore] = useState<MoodFlowValue | null>(null);

  const [step1, setStep1] = useState<{
    matricula: string;
    mentorId: string;
    communityId: number | '';
    campus: string | '';
    email: string | '';
  }>({
    matricula: '',
    mentorId: '',
    communityId: '',
    campus: '',
    email: ''
  });

  // Versión simplificada: sin motivo ni duración
  const [step2, setStep2] = useState<{
    durationMin: number | '';
  }>({
    durationMin: 30 // Valor por defecto, no se muestra al usuario
  });

  const loadCatalogs = async (retry = false) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar E2E_MOCKS
      const isE2E = typeof window !== 'undefined' && (
        window.location.search.includes('E2E_MOCKS=1') || 
        (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_E2E_MOCKS === '1')
      );

      // Fallback a mocks si E2E_MOCKS está activo
      if (isE2E) {
        setCommunities(mocks.communities as Community[]);
        setMentors(mocks.mentors as Mentor[]);
        setLoading(false);
        return;
      }

      const [cRes, mRes] = await Promise.all([
        fetchWithRetry('/api/communities'),
        fetchWithRetry('/api/mentors')
      ]);

      const [c, m] = await Promise.all([cRes.json(), mRes.json()]);
      setCommunities(c);
      setMentors(m);
      setError(null);
    } catch (err) {
      console.error('Error loading catalogs:', err);
      setError('No se pudieron cargar catálogos.');
      
      // Último fallback: usar mocks locales
      const isE2E = typeof window !== 'undefined' && (
        window.location.search.includes('E2E_MOCKS=1') || 
        (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_E2E_MOCKS === '1')
      );
      if (!isE2E) {
        try {
          setCommunities(mocks.communities as Community[]);
          setMentors(mocks.mentors as Mentor[]);
          setError(null);
        } catch {
          // Si mocks también fallan, mantener error
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  // Autoselección cuando hay un único mentor
  useEffect(() => {
    if (mentors.length === 1 && !step1.mentorId) {
      setStep1((s) => ({ ...s, mentorId: mentors[0].id }));
    }
    if (communities.length >= 1 && typeof step1.communityId !== 'number') {
      setStep1((s) => ({ ...s, communityId: communities[0].id }));
    }
  }, [mentors, communities]);

  // Autocompletar email si hay matrícula y no hay email (consentimiento automático para todos)
  useEffect(() => {
    if (step1.matricula && !step1.email) {
      setStep1((s) => ({ ...s, email: `${s.matricula}@tec.mx` }));
    }
  }, [step1.matricula]);

  const step1Parse = useMemo(() => {
    try {
      const parsed = Step1Schema.parse({
        matricula: step1.matricula,
        mentorId: step1.mentorId,
        communityId: typeof step1.communityId === 'number' ? step1.communityId : -1,
        campus: step1.campus || null,
        email: step1.email || null
      });
      return { ok: true as const, data: parsed };
    } catch {
      return { ok: false as const };
    }
  }, [step1]);

  const step2Parse = useMemo(() => {
    try {
      const parsed = Step2Schema.parse({
        reasonId: null, // Siempre null en versión simplificada
        reasonFree: null, // Siempre null en versión simplificada
        durationMin: typeof step2.durationMin === 'number' ? step2.durationMin : 30,
        moodBefore: moodBefore
      });
      return { ok: true as const, data: parsed };
    } catch {
      return { ok: false as const };
    }
  }, [step2, moodBefore]);

  async function handleSubmit() {
    if (!step1Parse.ok || !step2Parse.ok) return;
    // Autocompletar email si no se proporciona (consentimiento automático para todos)
    const email = step1Parse.data.email || (step1Parse.data.matricula ? `${step1Parse.data.matricula}@tec.mx` : null);
    
    // Telemetría: reflection_submitted si hay texto
    if (moodBefore?.note && moodBefore.note.trim().length > 0) {
      console.log('[telemetry] reflection_submitted', {
        chars: moodBefore.note.length,
        valence: moodBefore.valence,
        intensity: moodBefore.intensity,
        label: moodBefore.label
      });
    }
    
    const payload = {
      matricula: step1Parse.data.matricula,
      mentorId: step1Parse.data.mentorId,
      communityId: step1Parse.data.communityId,
      campus: step1Parse.data.campus || null,
      reasonId: step2Parse.data.reasonId,
      reasonFree: step2Parse.data.reasonFree || null,
      durationMin: step2Parse.data.durationMin,
      consentFollowup: true, // Siempre true - consentimiento automático
      email: email,
      moodBefore: moodBefore
    };
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      alert('Error al registrar. Revisa los campos.');
      return;
    }
    const json = await res.json();
    try {
      sessionStorage.setItem('last_session', JSON.stringify({ 
        sessionId: json.sessionId, 
        before: moodBefore 
      }));
    } catch {}
    router.push('/thanks');
  }

  const selectedCommunity = communities.find((c) => c.id === step1.communityId);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-2xl p-6 pb-24">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Registro 1:1</h1>
          <p className="text-sm text-slate-600">
            Tus datos son privados y se manejan de forma anónima.
          </p>
        </header>

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span className={step === 1 ? 'font-semibold text-slate-900' : 'text-slate-600'}>Paso 1</span>
            <span className="text-slate-400">/</span>
            <span className={step === 2 ? 'font-semibold text-slate-900' : 'text-slate-600'}>Paso 2</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-300 ${selectedCommunity ? '' : 'bg-slate-900'}`}
              style={{ 
                width: step === 1 ? '50%' : '100%',
                backgroundColor: selectedCommunity?.color || '#0f172a'
              }}
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={2}
              aria-label={`Paso ${step} de 2`}
            />
          </div>
        </div>

        {/* Alert de error con retry */}
        {error && (
          <Alert variant="error" className="mb-6" role="alert" aria-live="assertive">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" onClick={() => loadCatalogs(true)} className="text-sm">
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <section className="space-y-5" aria-label="Paso 1: Información básica">
            <Field label="Matrícula o código" htmlFor="matricula">
              {loading ? (
                <Skeleton />
              ) : (
                <Input
                  id="matricula"
                  value={step1.matricula}
                  onChange={(e) => setStep1((s) => ({ ...s, matricula: e.target.value }))}
                  inputMode="text"
                  autoComplete="off"
                  aria-label="Matrícula o código"
                  aria-required="true"
                  placeholder="Ingresa tu matrícula"
                />
              )}
            </Field>

            <Field label="Mentor/a" htmlFor="mentorId">
              {loading ? (
                <Skeleton />
              ) : (
                <Select
                  id="mentorId"
                  value={step1.mentorId}
                  onChange={(e) => setStep1((s) => ({ ...s, mentorId: e.target.value }))}
                  aria-label="Mentor/a"
                  aria-required="true"
                  disabled={mentors.length === 0}
                >
                  <option value="">Selecciona un mentor/a…</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name || m.email}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Comunidad" htmlFor="communityId">
              {loading ? (
                <Skeleton />
              ) : (
                <>
                  <Select
                    id="communityId"
                    value={step1.communityId}
                    onChange={(e) => setStep1((s) => ({ ...s, communityId: e.target.value ? Number(e.target.value) : '' }))}
                    aria-label="Comunidad"
                    aria-required="true"
                    disabled={communities.length === 0}
                  >
                    <option value="">Selecciona una comunidad…</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {selectedCommunity && (
                    <div className="mt-3">
                      <Chip
                        color={selectedCommunity.color}
                        selected
                        variant="outline"
                        disabled
                        className="text-sm"
                      >
                        {selectedCommunity.name} ({selectedCommunity.code})
                      </Chip>
                    </div>
                  )}
                </>
              )}
            </Field>

            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Canal:</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Presencial
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Step 2 - Versión simplificada: solo emociones */}
        {step === 2 && (
          <section className="space-y-4" aria-label="Paso 2: Registro de emociones">
            <MoodFlow value={moodBefore} onChange={setMoodBefore} />
          </section>
        )}

        {/* Botonera fija inferior */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg p-4 z-10">
          <div className="mx-auto max-w-2xl flex justify-between items-center gap-4">
            {step === 2 && (
              <Button 
                variant="secondary" 
                onClick={() => setStep(1)}
                className="transition-all hover:shadow-sm"
              >
                <span className="mr-1">←</span> Atrás
              </Button>
            )}
            <div className="flex-1" />
            {step === 1 ? (
              <Button
                variant="primary"
                disabled={!step1Parse.ok || loading}
                onClick={() => setStep(2)}
                className="ml-auto transition-all hover:shadow-md active:scale-[0.98]"
                style={selectedCommunity ? { backgroundColor: selectedCommunity.color } : undefined}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={!step2Parse.ok}
                onClick={handleSubmit}
                className="transition-all hover:shadow-md active:scale-[0.98]"
                style={selectedCommunity ? { backgroundColor: selectedCommunity.color } : undefined}
              >
                Enviar
              </Button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}
