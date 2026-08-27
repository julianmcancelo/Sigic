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

/**
 * Registra una acción inmutable en el historial de auditoría de SiGIC.
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
    const id = crypto.randomUUID();
    const ip = req ? (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1').slice(0, 120) : 'sistema';
    
    await query(`
      INSERT INTO auditoria_sistema (
        id, usuario_id, usuario_correo, rol, accion, entidad, entidad_id, detalles, ip, creado_en
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
    `, [
      id,
      usuarioId ? String(usuarioId) : null,
      usuarioCorreo ? String(usuarioCorreo) : null,
      rol ? String(rol) : null,
      accion,
      entidad,
      entidadId ? String(entidadId) : null,
      detalles ? JSON.stringify(detalles) : null,
      ip,
    ]);
  } catch (error) {
    // La auditoría no debe interrumpir el flujo principal si ocurre un error secundario
    console.error('Error al registrar auditoría:', error);
  }
}
