import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { runWithUserContext } from '@/lib/roles';
import crypto from 'node:crypto';

const matriculaRegex = /^A\d{8,9}$/;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const extendedSession = session as unknown as { userId?: string | null; needsLink?: boolean };
    const userId = extendedSession.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Sesión SSO requerida' }, { status: 403 });
    }

    const body = await req.json();
    const { matricula } = body;

    if (!matricula || typeof matricula !== 'string') {
      return NextResponse.json({ error: 'Matrícula requerida' }, { status: 400 });
    }

    if (!matriculaRegex.test(matricula)) {
      return NextResponse.json({ 
        error: 'Formato inválido. Debe ser A seguido de 8 o 9 dígitos (ej: A00123456 o A01234567)' 
      }, { status: 400 });
    }

    // Verificar si el usuario ya tiene matrícula vinculada
    const checkRes = await runWithUserContext(null, 'anonymous', async (client) => {
      return await client.query<{ matricula_hash: string }>(
        'SELECT matricula_hash FROM public.users_map WHERE user_id = $1',
        [userId]
      );
    });

    if (checkRes.rowCount && checkRes.rowCount > 0) {
      return NextResponse.json({ error: 'Ya tienes una matrícula vinculada' }, { status: 409 });
    }

    // Vincular matrícula
    const result = await runWithUserContext(null, 'anonymous', async (client) => {
      // Calcular hash de matrícula usando función de DB
      const hashRes = await client.query<{ hash: string }>(
        'SELECT public.hash_matricula($1) AS hash',
        [matricula]
      );
      const matriculaHash = hashRes.rows[0].hash;

      // Verificar si la matrícula ya está vinculada a otro usuario
      const existingRes = await client.query<{ user_id: string }>(
        'SELECT user_id FROM public.users_map WHERE matricula_hash = $1',
        [matriculaHash]
      );

      if (existingRes.rowCount && existingRes.rowCount > 0) {
        throw new Error('MATRICULA_ALREADY_LINKED');
      }

      // Insertar vinculación
      await client.query(
        `INSERT INTO public.users_map (user_id, matricula_hash)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET matricula_hash = EXCLUDED.matricula_hash, updated_at = NOW()`,
        [userId, matriculaHash]
      );

      return { success: true };
    });

    return NextResponse.json({ ok: true, message: 'Matrícula vinculada correctamente' });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'MATRICULA_ALREADY_LINKED') {
      return NextResponse.json({ 
        error: 'Esta matrícula ya está vinculada a otra cuenta' 
      }, { status: 409 });
    }
    console.error('Error linking matricula:', error);
    return NextResponse.json({ error: 'Error al vincular matrícula' }, { status: 500 });
  }
}

