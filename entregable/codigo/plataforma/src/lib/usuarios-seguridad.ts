import { pool } from './db';

export async function cambiarAccesoUsuario(id: string, cambio: { rol?: string; activo?: number; eliminar?: boolean }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serializa bajas y cambios para proteger al último administrativo también
    // cuando dos solicitudes llegan al mismo tiempo.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('sigic-usuarios-seguridad'))");
    const actual = (await client.query('SELECT rol, activo FROM usuarios_sistema WHERE id = $1 FOR UPDATE', [id])).rows[0];
    if (!actual) {
      await client.query('ROLLBACK');
      return { error: 'Usuario no encontrado', status: 404 };
    }
    const pierdeAdministracion = cambio.eliminar || cambio.activo === 0 || (cambio.rol && cambio.rol !== 'ADMINISTRATIVO');
    if (actual.rol === 'ADMINISTRATIVO' && Number(actual.activo) === 1 && pierdeAdministracion) {
      const otros = await client.query("SELECT 1 FROM usuarios_sistema WHERE rol = 'ADMINISTRATIVO' AND activo = 1 AND id <> $1 LIMIT 1", [id]);
      if (!otros.rows.length) {
        await client.query('ROLLBACK');
        return { error: 'No podés quitar el acceso al último administrativo activo.', status: 409 };
      }
    }
    if (cambio.eliminar) {
      await client.query('DELETE FROM ceremonias_usuarios_autorizados WHERE usuario_id = $1', [id]);
      await client.query('DELETE FROM tokens_recuperacion_contrasena WHERE usuario_id = $1', [id]);
      await client.query('DELETE FROM sesiones_porteria WHERE usuario_id = $1', [id]);
      await client.query('DELETE FROM dispositivos_moviles WHERE usuario_id = $1', [id]);
      await client.query('DELETE FROM usuarios_sistema WHERE id = $1', [id]);
    } else {
      await client.query(
        'UPDATE usuarios_sistema SET rol = COALESCE($1, rol), activo = COALESCE($2, activo), session_version = session_version + 1 WHERE id = $3',
        [cambio.rol ?? null, cambio.activo ?? null, id]
      );
    }
    await client.query('COMMIT');
    return { ok: true, status: 200 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
