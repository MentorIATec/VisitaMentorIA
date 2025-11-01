import { pool, withRlsContext, UserRole } from './db';

export async function getUserRole(email?: string | null): Promise<UserRole> {
  if (!email) return 'anonymous';
  const adminList = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (adminList.includes(email.toLowerCase())) return 'admin';
  const res = await pool.query('SELECT 1 FROM public.mentors WHERE email = $1', [email]);
  return res.rowCount ? 'mentor' : 'anonymous';
}

export async function getMentorIdByEmail(email: string): Promise<string | null> {
  const res = await pool.query<{ id: string }>('SELECT id FROM public.mentors WHERE email = $1', [email]);
  return res.rowCount ? res.rows[0].id : null;
}

export async function runWithUserContext<T>(
  email: string | null | undefined,
  role: UserRole,
  fn: Parameters<typeof withRlsContext<T>>[1]
) {
  const hashSalt = process.env.HASH_SALT || '';
  return withRlsContext({ email: email || undefined, role, hashSalt }, fn);
}


