import NextAuth, { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { pool } from './db';

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function resolveRoleAndMentor(email: string | null | undefined) {
  if (!email) return { role: 'anonymous' as const, mentorId: null as string | null };
  if (isAdminEmail(email)) return { role: 'admin' as const, mentorId: null };
  const res = await pool.query<{ id: string }>('SELECT id FROM public.mentors WHERE email = $1', [email]);
  if (res.rowCount && res.rows[0]?.id) {
    return { role: 'mentor' as const, mentorId: res.rows[0].id };
  }
  // Default: non-admin non-mentor is anonymous
  return { role: 'anonymous' as const, mentorId: null };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Email login',
      credentials: {
        email: { label: 'Email', type: 'email' }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        if (!email) return null;
        // Accept any email for MVP; role is determined by DB/ENV
        const user: User = { id: email, name: email, email };
        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      const email = user?.email || token.email || null;
      const { role, mentorId } = await resolveRoleAndMentor(email);
      token.role = role;
      token.mentorId = mentorId;
      return token;
    },
    async session({ session, token }) {
      const extended = session as unknown as Record<string, unknown> & { role?: 'admin'|'mentor'|'anonymous'; mentorId?: string | null };
      extended.role = token.role as 'admin'|'mentor'|'anonymous';
      extended.mentorId = (token as Record<string, unknown>).mentorId as string | null;
      return extended as unknown as typeof session;
    }
  }
};

export const { handlers, auth } = NextAuth(authOptions);


