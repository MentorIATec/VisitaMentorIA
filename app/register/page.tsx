"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
import Footer from '@/components/Footer';
import { mocks } from '@/lib/test-mocks';

// Validación de matrícula: A00123456 o A01234567 (A seguido de 8 o 9 dígitos)
const matriculaRegex = /^A\d{8,9}$/;

const Step1Schema = z.object({
  matricula: z.string().regex(matriculaRegex, 'Formato inválido. Debe ser A seguido de 8 o 9 dígitos (ej: A00123456 o A01234567)'),
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

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const matriculaParam = searchParams.get('matricula') || '';
  const isLinkMode = searchParams.get('link') === '1';
  const [step, setStep] = useState<1 | 2>(1);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moodBefore, setMoodBefore] = useState<MoodFlowValue | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [linkingMatricula, setLinkingMatricula] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [step1, setStep1] = useState<{
    matricula: string;
    mentorId: string;
    communityId: number | '';
    campus: string | '';
    email: string | '';
  }>({
    matricula: matriculaParam,
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
    if (!isLinkMode) {
      loadCatalogs();
    } else {
      setLoading(false);
    }
  }, [isLinkMode]);

  // Autoselección cuando hay un único mentor/comunidad
  useEffect(() => {
    if (mentors.length === 1 && !step1.mentorId) {
      setStep1((s) => ({ ...s, mentorId: mentors[0].id }));
    }
    if (communities.length === 1 && typeof step1.communityId !== 'number') {
      setStep1((s) => ({ ...s, communityId: communities[0].id }));
    }
  }, [mentors, communities, step1.mentorId, step1.communityId]);

  // Auto-seleccionar comunidad cuando se selecciona un mentor
  useEffect(() => {
    if (step1.mentorId && mentors.length > 0 && communities.length > 0) {
      const selectedMentor = mentors.find((m) => m.id === step1.mentorId);
      if (selectedMentor && selectedMentor.comunidad_id) {
        const mentorCommunity = communities.find(
          (c) => c.code.toLowerCase() === selectedMentor.comunidad_id?.toLowerCase()
        );
        if (mentorCommunity && step1.communityId !== mentorCommunity.id) {
          setStep1((s) => ({ ...s, communityId: mentorCommunity.id }));
        }
      }
    }
  }, [step1.mentorId, mentors, communities]);

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

  // Mensajes de validación para mostrar al usuario
  const step1ValidationMessage = useMemo(() => {
    if (step1Parse.ok) return null;
    if (!matriculaRegex.test(step1.matricula)) {
      return 'Ingresa una matrícula válida (A seguido de 8 o 9 dígitos)';
    }
    if (!step1.mentorId) {
      return 'Selecciona una mentora o mentor';
    }
    if (typeof step1.communityId !== 'number') {
      return 'Selecciona una comunidad';
    }
    return 'Completa todos los campos requeridos';
  }, [step1, step1Parse]);

  // Convertir touchedFields a string para usar como dependencia estable
  const touchedFieldsKey = useMemo(() => {
    return Array.from(touchedFields).sort().join(',');
  }, [touchedFields]);

  // Errores por campo para mostrar inline - solo si se intentó enviar o el campo fue tocado
  const step1FieldErrors = useMemo(() => {
    const errors: { matricula?: string; mentorId?: string; communityId?: string } = {};
    // Reconstruir array desde la key para mantener consistencia
    const touchedArray = touchedFieldsKey ? touchedFieldsKey.split(',') : [];
    const shouldShowErrors = hasAttemptedSubmit || touchedArray.length > 0;
    
    if (!step1Parse.ok && shouldShowErrors) {
      if (!matriculaRegex.test(step1.matricula) && (hasAttemptedSubmit || touchedArray.includes('matricula'))) {
        errors.matricula = 'Formato inválido. Debe ser A seguido de 8 o 9 dígitos (ej: A00123456 o A01234567)';
      }
      if (!step1.mentorId && mentors.length > 1 && (hasAttemptedSubmit || touchedArray.includes('mentorId'))) {
        errors.mentorId = 'Selecciona una mentora o mentor';
      }
      if (typeof step1.communityId !== 'number' && communities.length > 1 && (hasAttemptedSubmit || touchedArray.includes('communityId'))) {
        errors.communityId = 'Selecciona una comunidad';
      }
    }
    return errors;
  }, [step1, step1Parse, mentors.length, communities.length, hasAttemptedSubmit, touchedFieldsKey]);

  // Lista de errores para summary - solo si se intentó enviar
  const step1ErrorList = useMemo(() => {
    if (!hasAttemptedSubmit) return [];
    return Object.values(step1FieldErrors);
  }, [step1FieldErrors, hasAttemptedSubmit]);

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLinkMatricula = useCallback(async () => {
    if (!matriculaRegex.test(linkingMatricula)) {
      setLinkError('Formato inválido. Debe ser A seguido de 8 o 9 dígitos (ej: A00123456 o A01234567)');
      return;
    }
    
    setIsLinking(true);
    setLinkError(null);
    
    try {
      const res = await fetch('/api/users-map/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula: linkingMatricula })
      });
      
      if (!res.ok) {
        const data = await res.json();
        setLinkError(data.error || 'Error al vincular matrícula');
        return;
      }
      
      // Vincular exitosamente, continuar con flujo normal sin link=1
      router.push(`/register?matricula=${encodeURIComponent(linkingMatricula)}`);
    } catch (err) {
      console.error('Error linking matricula:', err);
      setLinkError('Error al vincular matrícula. Por favor intenta de nuevo.');
    } finally {
      setIsLinking(false);
    }
  }, [linkingMatricula, router]);

  const handleSubmit = useCallback(async () => {
    if (!step1Parse.ok || !step2Parse.ok) return;
    setIsSubmitting(true);
    
    try {
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
    } finally {
      setIsSubmitting(false);
    }
  }, [step1Parse, step2Parse, moodBefore, router]);

  // Teclado de acceso rápido: Cmd/Ctrl+Enter para avanzar/enviar, Escape para volver
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // No hacer nada si el usuario está escribiendo en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Solo manejar Escape si está en textarea del paso 2
        if (e.key === 'Escape' && step === 2 && target.tagName === 'TEXTAREA') {
          setStep(1);
        }
        return;
      }
      
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (step === 1 && step1Parse.ok) {
          setStep(2);
        } else if (step === 2 && step2Parse.ok && !isSubmitting) {
          handleSubmit();
        }
      }
      
      if (e.key === 'Escape' && step === 2) {
        e.preventDefault();
        setStep(1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, step1Parse, step2Parse, isSubmitting, handleSubmit]);

  const selectedCommunity = communities.find((c) => c.id === step1.communityId);

  // Modo vinculación: mostrar solo campo de matrícula
  if (isLinkMode) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-2xl p-6 pb-24">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Vincula tu matrícula</h1>
            <p className="text-sm text-slate-600">
              Para continuar, necesitas vincular tu matrícula a tu cuenta de Microsoft.
            </p>
          </header>

          <section className="space-y-4">
            {linkError && (
              <Alert variant="error" className="mb-6" role="alert" aria-live="assertive">
                {linkError}
              </Alert>
            )}

            <Field label="Matrícula" htmlFor="linking-matricula">
              <Input
                id="linking-matricula"
                value={linkingMatricula}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  if (value === '' || (value.startsWith('A') && /^A\d*$/.test(value) && value.length <= 10)) {
                    setLinkingMatricula(value);
                    setLinkError(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && matriculaRegex.test(linkingMatricula)) {
                    handleLinkMatricula();
                  }
                }}
                inputMode="text"
                autoComplete="off"
                aria-label="Matrícula"
                aria-required="true"
                aria-invalid={!matriculaRegex.test(linkingMatricula) && linkingMatricula.length > 0}
                error={!matriculaRegex.test(linkingMatricula) && linkingMatricula.length > 0}
                placeholder="A00123456 o A01234567"
                maxLength={10}
              />
              {linkingMatricula.length === 0 && (
                <p className="mt-2 text-sm text-slate-600">
                  Formato: A seguido de 8 o 9 dígitos (ej: A00123456)
                </p>
              )}
              {!matriculaRegex.test(linkingMatricula) && linkingMatricula.length > 0 && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  Formato inválido. Debe ser A seguido de 8 o 9 dígitos (ej: A00123456 o A01234567)
                </p>
              )}
            </Field>

            <Button
              variant="primary"
              onClick={handleLinkMatricula}
              disabled={!matriculaRegex.test(linkingMatricula) || isLinking}
              className="w-full"
            >
              {isLinking ? 'Vinculando...' : 'Vincular y continuar'}
            </Button>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Barra de progreso sticky */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm mb-6">
        <div className="mx-auto max-w-2xl px-6 pt-6 pb-4">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <span className="text-emerald-600" aria-label="Completado">✓</span>
              )}
              <span className={step === 1 ? 'font-semibold text-slate-900' : 'text-slate-600'}>
                Paso 1 de 2: Información básica
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={step === 2 ? 'font-semibold text-slate-900' : 'text-slate-600'}>
                Paso 2 de 2: Emociones
              </span>
            </div>
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
      </div>

      <main className="mx-auto max-w-2xl p-6 pb-32">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Registro 1:1</h1>
          <p className="text-sm text-slate-600">
            Tus datos son privados y se manejan de forma anónima.
          </p>
        </header>

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

        {/* Step 1 - Simplificado: solo matrícula, mentor/comunidad se seleccionan automáticamente o se muestran si hay múltiples */}
        {step === 1 && (
          <section className="space-y-5" aria-label="Paso 1: Información básica">
            {/* Summary de errores */}
            {step1ErrorList.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4" role="alert" aria-live="assertive">
                <h2 className="text-sm font-semibold text-red-900 mb-2">Por favor corrige los siguientes errores:</h2>
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  {step1ErrorList.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Field label="Matrícula" htmlFor="matricula">
              {loading ? (
                <Skeleton />
              ) : (
                <>
                  <Input
                    id="matricula"
                    value={step1.matricula}
                    onChange={(e) => {
                      // Permitir solo letra A seguida de números
                      const value = e.target.value.toUpperCase();
                      if (value === '' || (value.startsWith('A') && /^A\d*$/.test(value) && value.length <= 10)) {
                        setStep1((s) => ({ ...s, matricula: value }));
                      }
                    }}
                    onBlur={() => {
                      setTouchedFields(prev => new Set(prev).add('matricula'));
                    }}
                    inputMode="text"
                    autoComplete="off"
                    aria-label="Matrícula"
                    aria-required="true"
                    aria-describedby={step1FieldErrors.matricula ? 'matricula-error' : undefined}
                    aria-invalid={!!step1FieldErrors.matricula}
                    error={!!step1FieldErrors.matricula}
                    placeholder="A00123456 o A01234567"
                    maxLength={10}
                  />
                  {step1FieldErrors.matricula && (
                    <p id="matricula-error" className="mt-2 text-sm text-red-600" role="alert">
                      {step1FieldErrors.matricula}
                    </p>
                  )}
                </>
              )}
            </Field>

            {/* Mostrar mentor solo si hay múltiples opciones */}
            {!loading && mentors.length > 1 && (
              <Field label="Mentora o mentor" htmlFor="mentorId">
                <Select
                  id="mentorId"
                  value={step1.mentorId}
                  onChange={(e) => {
                    setStep1((s) => ({ ...s, mentorId: e.target.value }));
                    setTouchedFields(prev => new Set(prev).add('mentorId'));
                  }}
                  onBlur={() => {
                    setTouchedFields(prev => new Set(prev).add('mentorId'));
                  }}
                  aria-label="Mentora o mentor"
                  aria-required="true"
                  aria-describedby={step1FieldErrors.mentorId ? 'mentorId-error' : undefined}
                  aria-invalid={!!step1FieldErrors.mentorId}
                >
                  <option value="">Selecciona una mentora o mentor…</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name || m.email}
                    </option>
                  ))}
                </Select>
                {step1FieldErrors.mentorId && (
                  <p id="mentorId-error" className="mt-2 text-sm text-red-600" role="alert">
                    {step1FieldErrors.mentorId}
                  </p>
                )}
              </Field>
            )}

            {/* Mostrar comunidad solo si hay múltiples opciones - ahora es readonly/automático basado en mentor */}
            {!loading && communities.length > 1 && (
              <Field label="Comunidad" htmlFor="communityId">
                {selectedCommunity ? (
                  <div className="space-y-2">
                    <div className="px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-sm text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>{selectedCommunity.name}</span>
                        <span className="text-xs text-slate-600 italic font-medium">
                          Seleccionada automáticamente
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Chip
                        color={selectedCommunity.color}
                        selected
                        variant="outline"
                        disabled
                        className="text-sm transition-all"
                      >
                        {selectedCommunity.name}
                      </Chip>
                    </div>
                  </div>
                ) : (
                  <>
                    <Select
                      id="communityId"
                      value={step1.communityId}
                      onChange={(e) => {
                        setStep1((s) => ({ ...s, communityId: e.target.value ? Number(e.target.value) : '' }));
                        setTouchedFields(prev => new Set(prev).add('communityId'));
                      }}
                      onBlur={() => {
                        setTouchedFields(prev => new Set(prev).add('communityId'));
                      }}
                      aria-label="Comunidad"
                      aria-required="true"
                      aria-describedby={step1FieldErrors.communityId ? 'communityId-error' : undefined}
                      aria-invalid={!!step1FieldErrors.communityId}
                      disabled
                    >
                      <option value="">Selecciona una mentora o mentor primero…</option>
                      {communities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    {step1FieldErrors.communityId && (
                      <p id="communityId-error" className="mt-2 text-sm text-red-600" role="alert">
                        {step1FieldErrors.communityId}
                      </p>
                    )}
                  </>
                )}
              </Field>
            )}

            {/* Mostrar comunidad seleccionada si hay una sola opción */}
            {!loading && communities.length === 1 && selectedCommunity && (
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Comunidad:</span>
                  <Chip
                    color={selectedCommunity.color}
                    selected
                    variant="outline"
                    disabled
                    className="text-sm"
                  >
                    {selectedCommunity.name}
                  </Chip>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 2 - Versión simplificada: solo emociones */}
        {step === 2 && (
          <section className="space-y-4" aria-label="Paso 2: Registro de emociones">
            <MoodFlow value={moodBefore} onChange={setMoodBefore} />
          </section>
        )}

      </main>
      
      {/* Botonera sticky - se mantiene visible pero respeta el flujo del documento */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg p-4 z-10 mt-8">
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
            <div className="ml-auto flex flex-col items-end gap-2">
              {step1ValidationMessage && hasAttemptedSubmit && (
                <span className="text-xs text-slate-600 text-right max-w-xs">
                  {step1ValidationMessage}
                </span>
              )}
              <Button
                variant="primary"
                disabled={!step1Parse.ok || loading}
                onClick={() => {
                  if (!step1Parse.ok) {
                    setHasAttemptedSubmit(true);
                    // Marcar todos los campos como tocados
                    setTouchedFields(new Set(['matricula', 'mentorId', 'communityId']));
                  } else {
                    setStep(2);
                  }
                }}
                className="transition-all hover:shadow-md active:scale-[0.98]"
                style={selectedCommunity ? { backgroundColor: selectedCommunity.color } : undefined}
              >
                Siguiente
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              disabled={!step2Parse.ok || isSubmitting}
              onClick={handleSubmit}
              className="transition-all hover:shadow-md active:scale-[0.98]"
              style={selectedCommunity ? { backgroundColor: selectedCommunity.color } : undefined}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Footer - aparece DESPUÉS del botón en el flujo */}
      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
