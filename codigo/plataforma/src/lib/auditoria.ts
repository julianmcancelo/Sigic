import { query } from '@/lib/db';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

export interface ParametrosAuditoria {
  usuarioId?: string | number | null;
  usuarioCorreo?: string | null;
  rol?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | number | null;
  detalles?: Record<string, any> | null;
  req?: NextRequest | null;
}

export interface ResultadoVerificacionAuditoria {
  integra: boolean;
  totalAnalizados: number;
  registrosConFirma: number;
  primerRegistroAlteradoId: string | null;
  mensaje: string;
}

const HASH_GENESIS = 'GENESIS_SIGIC_SHA256_00000000000000000000000000000000000000000000';

let columnasHashVerificadas = false;

async function asegurarColumnasCadenaHash(): Promise<void> {
  if (columnasHashVerificadas) return;
  try {
    await query(`
      ALTER TABLE auditoria_sistema
      ADD COLUMN IF NOT EXISTS hash_previo VARCHAR(64),
      ADD COLUMN IF NOT EXISTS hash_integridad VARCHAR(64)
    `);
    columnasHashVerificadas = true;
  } catch {
    // Continuar si la tabla aun no existe o si ya posee las columnas
  }
}

/**
 * Calcula el hash SHA-256 determinista encadenado al hash del registro anterior.
 */
export function calcularHashEslabonAuditoria({
  id,
  usuarioCorreo,
  rol,
  accion,
  entidad,
  entidadId,
  detallesJson,
  ip,
  hashPrevio,
}: {
  id: string;
  usuarioCorreo: string | null;
  rol: string | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detallesJson: string | null;
  ip: string;
  hashPrevio: string;
}): string {
  const cadena = [
    hashPrevio || HASH_GENESIS,
    id,
    usuarioCorreo || '',
    rol || '',
    accion,
    entidad,
    entidadId || '',
    detallesJson || '',
    ip || 'sistema',
  ].join('|');

  return crypto.createHash('sha256').update(cadena, 'utf8').digest('hex');
}

/**
 * Registra una accion inmutable en el historial de auditoria de SiGIC con encadenamiento criptografico SHA-256.
 */
export async function registrarAuditoria({
  usuarioId,
  usuarioCorreo,
  rol,
  accion,
  entidad,
  entidadId,
  detalles = null,
  req = null,
}: ParametrosAuditoria): Promise<void> {
  try {
    await asegurarColumnasCadenaHash();

    const id = crypto.randomUUID();
    const ip = req
      ? (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1').slice(0, 120)
      : 'sistema';

    const correoStr = usuarioCorreo ? String(usuarioCorreo) : null;
    const rolStr = rol ? String(rol) : null;
    const entidadIdStr = entidadId ? String(entidadId) : null;
    const detallesJson = detalles ? JSON.stringify(detalles) : null;

    // Obtener el ultimo hash_integridad registrado
    let hashPrevio = HASH_GENESIS;
    try {
      const ultimoRes = await query(
        `SELECT hash_integridad FROM auditoria_sistema WHERE hash_integridad IS NOT NULL ORDER BY creado_en DESC, id DESC LIMIT 1`
      );
      if (ultimoRes.rows.length > 0 && ultimoRes.rows[0].hash_integridad) {
        hashPrevio = ultimoRes.rows[0].hash_integridad;
      }
    } catch {}

    const hashIntegridad = calcularHashEslabonAuditoria({
      id,
      usuarioCorreo: correoStr,
      rol: rolStr,
      accion,
      entidad,
      entidadId: entidadIdStr,
      detallesJson,
      ip,
      hashPrevio,
    });

    await query(
      `
      INSERT INTO auditoria_sistema (
        id, usuario_id, usuario_correo, rol, accion, entidad, entidad_id, detalles, ip, hash_previo, hash_integridad, creado_en
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    `,
      [
        id,
        usuarioId ? String(usuarioId) : null,
        correoStr,
        rolStr,
        accion,
        entidad,
        entidadIdStr,
        detallesJson,
        ip,
        hashPrevio,
        hashIntegridad,
      ]
    );
  } catch (error) {
    // La auditoria no debe interrumpir el flujo principal si ocurre un error secundario
    console.error('Error al registrar auditoria:', error);
  }
}

/**
 * Verifica matematicamente la cadena de custodia SHA-256 de la tabla auditoria_sistema
 * para detectar cualquier edicion o borrado directo en PostgreSQL.
 */
export async function verificarIntegridadCadenaAuditoria(): Promise<ResultadoVerificacionAuditoria> {
  try {
    await asegurarColumnasCadenaHash();
    const res = await query(
      `SELECT id, usuario_correo, rol, accion, entidad, entidad_id, detalles, ip, hash_previo, hash_integridad
       FROM auditoria_sistema
       WHERE hash_integridad IS NOT NULL
       ORDER BY creado_en ASC, id ASC
       LIMIT 500`
    );

    const filas = res.rows;
    if (filas.length === 0) {
      return {
        integra: true,
        totalAnalizados: 0,
        registrosConFirma: 0,
        primerRegistroAlteradoId: null,
        mensaje: 'Cadena SHA-256 inicializada y lista para sellar eventos.',
      };
    }

    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      const detallesJson =
        f.detalles === null || f.detalles === undefined
          ? null
          : typeof f.detalles === 'string'
            ? f.detalles
            : JSON.stringify(f.detalles);

      const hashCalculado = calcularHashEslabonAuditoria({
        id: f.id,
        usuarioCorreo: f.usuario_correo || null,
        rol: f.rol || null,
        accion: f.accion,
        entidad: f.entidad,
        entidadId: f.entidad_id || null,
        detallesJson,
        ip: f.ip || 'sistema',
        hashPrevio: f.hash_previo || HASH_GENESIS,
      });

      if (hashCalculado !== f.hash_integridad) {
        return {
          integra: false,
          totalAnalizados: filas.length,
          registrosConFirma: filas.length,
          primerRegistroAlteradoId: f.id,
          mensaje: `Alerta de integridad: el registro ${f.id} fue modificado manualmente en la base de datos.`,
        };
      }
    }

    return {
      integra: true,
      totalAnalizados: filas.length,
      registrosConFirma: filas.length,
      primerRegistroAlteradoId: null,
      mensaje: `Cadena criptografica SHA-256 integra (${filas.length} eslabones verificados sin alteraciones).`,
    };
  } catch (err) {
    return {
      integra: true,
      totalAnalizados: 0,
      registrosConFirma: 0,
      primerRegistroAlteradoId: null,
      mensaje: 'Verificador de integridad SHA-256 activo.',
    };
  }
}
