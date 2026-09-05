import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { firmar } from '@/lib/tokens';
import bcrypt from 'bcryptjs';
import { inicializarBaseDatos } from '@/lib/schema';

import { verificarRateLimit } from '@/lib/rate-limit';
import { ROLES_OPERACION } from '@/lib/auth-middleware';

/**
 * POST /api/auth/login
 * Autentica un usuario del sistema (ADMINISTRATIVO, PORTERIA)
 */
export async function POST(req: NextRequest) {
  try {
    await inicializarBaseDatos();
    // Obtener IP del cliente de forma segura en Next.js
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1').split(',')[0].trim();

    // Verificar rate limit
    const control = await verificarRateLimit(`login-ip:${ip}`, 8, 10 * 60 * 1000);
    if (!control.permitido) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos de inicio de sesión. Esperá unos minutos y volvé a intentar.',
          segundosRestantes: control.segundosRestantes
        },
        {
          status: 429,
          headers: { 'Retry-After': String(control.segundosRestantes) }
        }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 1024) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const emailLimpio = String(email).toLowerCase().trim();
    const controlCuenta = await verificarRateLimit(`login-cuenta:${emailLimpio}`, 5, 10 * 60 * 1000);
    if (!controlCuenta.permitido) {
      return NextResponse.json(
        { error: 'Demasiados intentos de inicio de sesión. Esperá unos minutos y volvé a intentar.', segundosRestantes: controlCuenta.segundosRestantes },
        { status: 429, headers: { 'Retry-After': String(controlCuenta.segundosRestantes) } }
      );
    }

    // 1. Buscar usuario en base de datos PostgreSQL
    const result = await query(
      'SELECT id, nombre, email, password_hash, rol, activo, session_version FROM usuarios_sistema WHERE email = $1 AND activo = 1',
      [emailLimpio]
    );
    const usuario = result.rows[0];

    if (!usuario || !ROLES_OPERACION.includes(usuario.rol)) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // 2. Validar contraseña hasheada
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }



    // El personal de portería puede iniciar sesión si tiene al menos una ceremonia
    // asignada. Las operaciones de acreditación validan aparte la ceremonia activa.
    if (usuario.rol === 'PORTERIA') {
      const authCheck = await query(
        'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE usuario_id = $1 LIMIT 1',
        [usuario.id]
      );
      if (authCheck.rows.length === 0) {
        return NextResponse.json({ error: 'No tenés ceremonias autorizadas. Contactá a administración.' }, { status: 403 });
      }
    }

    // 3. Actualizar fecha del último login
    await query('UPDATE usuarios_sistema SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [usuario.id]);

    // 4. Firmar token JWT de sesión (8 horas de vida)
    const token = firmar({
      tipo: 'personal',
      id: usuario.id,
      rol: usuario.rol,
      sessionVersion: Number(usuario.session_version),
      nombre: usuario.nombre
    }, 8 * 60 * 60);

    const respuesta = NextResponse.json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });

    respuesta.cookies.set('sigic_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60
    });
    respuesta.headers.set('Cache-Control', 'no-store');
    return respuesta;

  } catch (error) {
    console.error('Error en API Login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor durante la autenticación' },
      { status: 500 }
    );
  }
}
