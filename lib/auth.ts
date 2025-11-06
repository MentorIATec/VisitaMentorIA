import NextAuth, { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
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

async function checkUserHasMatricula(userId: string): Promise<boolean> {
  const res = await pool.query<{ matricula_hash: string }>(
    'SELECT matricula_hash FROM public.users_map WHERE user_id = $1',
    [userId]
  );
  return res.rowCount !== null && res.rowCount > 0 && res.rows[0]?.matricula_hash !== null;
}

const isSSOEnabled = process.env.SSO_ENABLED === 'true';

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
    }),
    ...(isSSOEnabled ? [
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID || '',
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
        tenantId: process.env.AZURE_AD_TENANT_ID,
        authorization: {
          params: {
            scope: 'openid profile email',
          },
        },
      })
    ] : [])
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Si es login de Azure AD, usar el sub como user_id
      if (account?.provider === 'azure-ad' && user?.id) {
        token.userId = user.id; // sub de Azure AD
        token.email = user.email || null;
        token.name = user.name || null;
        
        // Verificar si tiene matrícula vinculada
        const hasMatricula = await checkUserHasMatricula(user.id);
        token.needsLink = !hasMatricula;
      } else {
        // Flujo de credenciales (email)
        const email = user?.email || token.email || null;
        token.userId = null;
        token.needsLink = false;
      }
      
      const email = token.email || null;
      const { role, mentorId } = await resolveRoleAndMentor(email);
      token.role = role;
      token.mentorId = mentorId;
      
      return token;
    },
    async session({ session, token }) {
      const extended = session as unknown as Record<string, unknown> & { 
        role?: 'admin'|'mentor'|'anonymous'; 
        mentorId?: string | null;
        userId?: string | null;
        needsLink?: boolean;
      };
      extended.role = token.role as 'admin'|'mentor'|'anonymous';
      extended.mentorId = (token as Record<string, unknown>).mentorId as string | null;
      extended.userId = (token as Record<string, unknown>).userId as string | null | undefined;
      extended.needsLink = (token as Record<string, unknown>).needsLink as boolean | undefined;
      return extended as unknown as typeof session;
    }
  }
};

export const { handlers, auth } = NextAuth(authOptions);


