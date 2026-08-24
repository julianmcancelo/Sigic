import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { inicializarBaseDatos } from '@/lib/schema';

const LARGO_MINIMO = 8;

export async function POST(req: NextRequest) {
  try {
    await inicializarBaseDatos();
    const { token, password } = await req.json();
    const clave = String(password || '');
    if (!token || clave.length < LARGO_MINIMO) {
      return NextResponse.json({ error: `La contraseña debe tener al menos ${LARGO_MINIMO} caracteres.` }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const resultado = await cliente.query<{ id: string }>(
        `SELECT u.id FROM tokens_recuperacion_contrasena t
         JOIN usuarios_sistema u ON u.id = t.usuario_id
         WHERE t.token_hash = $1 AND t.usado_en IS NULL AND t.expira_en > CURRENT_TIMESTAMP AND u.activo = 1
         FOR UPDATE`,
        [tokenHash]
      );
      const usuario = resultado.rows[0];
      if (!usuario) {
        await cliente.query('ROLLBACK');
        return NextResponse.json({ error: 'El enlace venció, ya fue utilizado o no es válido.' }, { status: 400 });
      }

      const hash = await bcrypt.hash(clave, 12);
      await cliente.query('UPDATE usuarios_sistema SET password_hash = $1 WHERE id = $2', [hash, usuario.id]);
      await cliente.query('UPDATE tokens_recuperacion_contrasena SET usado_en = CURRENT_TIMESTAMP WHERE token_hash = $1', [tokenHash]);
      await cliente.query('DELETE FROM tokens_recuperacion_contrasena WHERE usuario_id = $1 AND token_hash <> $2', [usuario.id, tokenHash]);
      await cliente.query('COMMIT');
      return NextResponse.json({ ok: true });
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    return NextResponse.json({ error: 'No pudimos actualizar la contraseña.' }, { status: 500 });
  }
}
