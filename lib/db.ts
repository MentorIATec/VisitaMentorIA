import { Pool, PoolClient, QueryConfig, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Allow build, but runtime will fail fast
  console.warn('DATABASE_URL no configurado.');
}

export const pool = new Pool({ connectionString });

export type UserRole = 'admin' | 'mentor' | 'anonymous';

export async function withRlsContext<T>(
  context: { email?: string | null; role?: UserRole; hashSalt?: string },
  handler: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (context.hashSalt) {
      await client.query('SET app.hash_salt = $1', [context.hashSalt]);
    }
    if (context.email) {
      await client.query('SET app.user_email = $1', [context.email]);
    }
    await client.query('SET app.user_role = $1', [context.role ?? 'anonymous']);
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string | QueryConfig<unknown[]>,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text as string, params as unknown[]);
}


