"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Field from '@/components/Field';
import Chip from '@/components/ui/Chip';
import Footer from '@/components/Footer';

const matriculaRegex = /^A\d{8,9}$/;
const isSSOEnabled = process.env.NEXT_PUBLIC_SSO_ENABLED === 'true';

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [matricula, setMatricula] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const matriculaInputRef = useRef<HTMLInputElement>(null);

  // Verificar si usuario SSO necesita vincular matrícula
  useEffect(() => {
    if (session) {
      const extendedSession = session as unknown as { needsLink?: boolean; userId?: string | null };
      if (extendedSession.needsLink && extendedSession.userId) {
        router.push('/register?link=1');
      }
    }
  }, [session, router]);

  // Autofocus en matrícula al cargar (solo si no hay sesión SSO)
  useEffect(() => {
    if (!session) {
      matriculaInputRef.current?.focus();
    }
  }, [session]);

  const isValid = matriculaRegex.test(matricula);
  const shouldShowError = hasBlurred && !isValid && matricula.length > 0;

  const handleMatriculaSubmit = async () => {
    if (!matriculaRegex.test(matricula)) {
      setError('Formato inválido. Debe ser A seguido de 8 o 9 dígitos (ej: A00123456 o A01234567)');
      setHasBlurred(true);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    // Pequeña pausa para mostrar feedback visual
    await new Promise(resolve => setTimeout(resolve, 300));
    // Redirigir a registro con matrícula en query params
    router.push(`/register?matricula=${encodeURIComponent(matricula)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMatriculaSubmit();
    }
  };

  const handleBlur = () => {
    setHasBlurred(true);
    if (!isValid && matricula.length > 0) {
      setError('Formato inválido. Debe ser A seguido de 8 o 9 dígitos (ej: A00123456 o A01234567)');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    if (value === '' || (value.startsWith('A') && /^A\d*$/.test(value) && value.length <= 10)) {
      setMatricula(value);
      // Limpiar error al escribir si el formato es válido
      if (matriculaRegex.test(value)) {
        setError(null);
      }
    }
  };

  // Generar IDs únicos para aria-describedby
  const helperId = 'matricula-helper';
  const errorId = 'matricula-error';
  const describedBy = shouldShowError ? errorId : (matricula.length === 0 ? helperId : undefined);

  const handleSSOSignIn = () => {
    signIn('azure-ad', { callbackUrl: '/register' });
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-2xl p-6 pb-24">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Visita a Mentoría Estudiantil</h1>
          <p className="text-sm text-slate-600">
            Bienvenidos/as a Mentoría Estudiantil
          </p>
        </header>

        <div className="space-y-6">
          {/* Opción SSO si está habilitado */}
          {isSSOEnabled && (
            <section className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-slate-300"></div>
                <span className="text-sm text-slate-500">o</span>
                <div className="flex-1 border-t border-slate-300"></div>
              </div>
              <Button
                variant="primary"
                onClick={handleSSOSignIn}
                className="w-full"
                aria-label="Continuar con Microsoft"
              >
                Continuar con Microsoft
              </Button>
            </section>
          )}

          {/* Campo de matrícula */}
          <section className="space-y-4">
            {isSSOEnabled && (
              <p className="text-sm text-slate-600 text-center">
                O usa tu matrícula
              </p>
            )}
            <Field label="Matrícula" htmlFor="matricula">
              <Input
                ref={matriculaInputRef}
                id="matricula"
                value={matricula}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                inputMode="text"
                autoComplete="off"
                aria-label="Matrícula"
                aria-required="true"
                aria-describedby={describedBy}
                aria-invalid={shouldShowError}
                error={shouldShowError}
                placeholder="A00123456 o A01234567"
                maxLength={10}
              />
              {matricula.length === 0 && (
                <p id={helperId} className="mt-2 text-sm text-slate-600">
                  Formato: A seguido de 8 o 9 dígitos (ej: A00123456)
                </p>
              )}
              {shouldShowError && (
                <p id={errorId} className="mt-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </Field>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleMatriculaSubmit}
                disabled={!matriculaRegex.test(matricula) || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Redirigiendo...' : 'Registrar una sesión'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/find')}
                className="flex-1"
              >
                Contactar a mi mentora o mentor
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
