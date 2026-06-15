import { Pool, QueryResult, QueryResultRow, types } from 'pg';

// Configuración de parsers de tipo para pg (PostgreSQL)
// El OID 1114 representa el tipo TIMESTAMP sin zona horaria en PostgreSQL.
// Forzamos a interpretarlo siempre como UTC, ya que los guardamos con toISOString().
types.setTypeParser(1114, function(stringValue: string | null) {
  if (!stringValue) return null;
  const formateado = stringValue.replace(' ', 'T') + (stringValue.includes('Z') || stringValue.includes('+') ? '' : 'Z');
  return new Date(formateado);
});

let pool: Pool;

if (!global.pgPool) {
  const sslInseguro = process.env.DB_SSL_INSECURE === '1';
  global.pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') 
      ? false 
      : {
          rejectUnauthorized: !sslInseguro
        }
  });
}

pool = global.pgPool;

/**
 * Orquestador principal de consultas SQL para PostgreSQL
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export { pool };

// Declaración global para evitar múltiples instancias del Pool en desarrollo de Next.js (Fast Refresh)
declare global {
  var pgPool: Pool | undefined;
}
