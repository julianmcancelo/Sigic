import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { inicializarBaseDatos } from '@/lib/schema';
import { enviarCorreo, generarPlantillaRecuperacionContrasena } from '@/lib/email';
import { obtenerOrigenPublico } from '@/lib/public-origin';

const VENTANA_MS = 60 * 60 * 1000;
const MAX_SOLICITUDES = 5;
const solicitudes = new Map<string, { cantidad: number; vence: number }>();

function permitirSolicitud(ip: string) {
  const ahora = Date.now();
  const registro = solicitudes.get(ip);
  if (!registro || registro.vence < ahora) {
    solicitudes.set(ip, { cantidad: 1, vence: ahora + VENTANA_MS });
    return true;
  }
  registro.cantidad += 1;
  return registro.cantidad <= MAX_SOLICITUDES;
}

export async function POST(req: NextRequest) {
  try {
    await inicializarBaseDatos();
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'desconocida').split(',')[0].trim();
    if (!permitirSolicitud(ip)) {
      return NextResponse.json({ error: 'Esperá unos minutos antes de solicitar otro enlace.' }, { status: 429 });
    }
    const { email } = await req.json();
    const correo = String(email || '').trim().toLowerCase();
    if (!correo || !correo.includes('@')) {
      return NextResponse.json({ error: 'Ingresá un correo electrónico válido.' }, { status: 400 });
    }

    const resultado = await query<{ id: string; nombre: string; email: string }>(
      'SELECT id, nombre, email FROM usuarios_sistema WHERE email = $1 AND activo = 1',
      [correo]
    );
    const usuario = resultado.rows[0];

    // La respuesta no revela si una cuenta administrativa existe.
    if (!usuario) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await query('DELETE FROM tokens_recuperacion_contrasena WHERE usuario_id = $1 OR expira_en < CURRENT_TIMESTAMP', [usuario.id]);
    await query(
      `INSERT INTO tokens_recuperacion_contrasena (usuario_id, token_hash, expira_en, solicitado_ip)
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 minutes', $3)`,
      [usuario.id, tokenHash, ip]
    );

    const origen = obtenerOrigenPublico(req);
    const enlace = `${origen}/restablecer-contrasena?token=${token}`;
    await enviarCorreo(usuario.email, 'SiGIC · Restablecé tu contraseña', generarPlantillaRecuperacionContrasena(usuario.nombre, enlace, origen));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error solicitando recuperación de contraseña:', error);
    return NextResponse.json({ error: 'No pudimos enviar el enlace. Intentá nuevamente.' }, { status: 500 });
  }
}
