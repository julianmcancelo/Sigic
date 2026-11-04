import crypto from 'crypto';
import { query } from './db';

// Contador atómico compartido entre todas las instancias serverless.
export async function verificarRateLimit(key: string, limit: number, windowMs: number) {
  const clave = crypto.createHash('sha256').update(key).digest('hex');
  const resultado = await query(
    `INSERT INTO auth_rate_limits (clave, contador, reinicio)
     VALUES ($1, 1, CURRENT_TIMESTAMP + $2 * INTERVAL '1 millisecond')
     ON CONFLICT (clave) DO UPDATE SET
       contador = CASE WHEN auth_rate_limits.reinicio <= CURRENT_TIMESTAMP THEN 1 ELSE auth_rate_limits.contador + 1 END,
       reinicio = CASE WHEN auth_rate_limits.reinicio <= CURRENT_TIMESTAMP
         THEN CURRENT_TIMESTAMP + $2 * INTERVAL '1 millisecond' ELSE auth_rate_limits.reinicio END
     RETURNING contador, GREATEST(1, CEIL(EXTRACT(EPOCH FROM reinicio - CURRENT_TIMESTAMP))) AS espera`,
    [clave, windowMs]
  );
  const registro = resultado.rows[0];
  const permitido = Number(registro.contador) <= limit;
  return { permitido, segundosRestantes: permitido ? 0 : Number(registro.espera) };
}
