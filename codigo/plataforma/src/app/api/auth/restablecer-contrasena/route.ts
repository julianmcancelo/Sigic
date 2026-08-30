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
      const resultado = await cliente.query<{ id: string; usado_en: any; expira_en: any; activo: number }>(
        `SELECT u.id, t.usado_en, t.expira_en, u.activo
         FROM tokens_recuperacion_contrasena t
         JOIN usuarios_sistema u ON u.id = t.usuario_id
         WHERE t.token_hash = $1
         FOR UPDATE`,
        [tokenHash]
      );
      const tokenInfo = resultado.rows[0];
      if (!tokenInfo) {
        await cliente.query('ROLLBACK');
        return NextResponse.json({ 
          error: 'El enlace no es válido o fue reemplazado por uno más reciente. Verificá el último correo recibido.' 
        }, { status: 400 });
      }

      if (tokenInfo.usado_en) {
        await cliente.query('ROLLBACK');
        return NextResponse.json({ 
          error: 'Este enlace ya fue utilizado anteriormente. Si ya creaste tu contraseña, podés iniciar sesión directamente.' 
        }, { status: 400 });
      }

      if (new Date(tokenInfo.expira_en) <= new Date()) {
        await cliente.query('ROLLBACK');
        return NextResponse.json({ 
          error: 'Este enlace ha vencido (validez de 48 horas). Solicitá un nuevo enlace desde la plataforma.' 
        }, { status: 400 });
      }

      if (tokenInfo.activo !== 1) {
        await cliente.query('ROLLBACK');
        return NextResponse.json({ 
          error: 'La cuenta de usuario se encuentra temporalmente bloqueada.' 
        }, { status: 400 });
      }

      const usuario = { id: tokenInfo.id };

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
