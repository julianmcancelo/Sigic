import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { firmar } from '@/lib/tokens';
import bcrypt from 'bcryptjs';
import { inicializarBaseDatos } from '@/lib/schema';

// Limitador de intentos en memoria para evitar fuerza bruta
const registros = new Map<string, { contador: number; reinicio: number }>();
const VENTANA_MS = 10 * 60 * 1000; // 10 minutos
const MAX_INTENTOS = 8;
const MAX_INTENTOS_CUENTA = 5;

function verificarLimite(clave: string, maximo = MAX_INTENTOS): { permitido: boolean; segundosRestantes: number } {
  const ahora = Date.now();
  let registro = registros.get(clave);

  if (!registro || ahora > registro.reinicio) {
    registro = { contador: 0, reinicio: ahora + VENTANA_MS };
    registros.set(clave, registro);
  }

  registro.contador++;
  if (registro.contador > maximo) {
    const segundosRestantes = Math.ceil((registro.reinicio - ahora) / 1000);
    return { permitido: false, segundosRestantes };
  }

  return { permitido: true, segundosRestantes: 0 };
}

/**
 * POST /api/auth/login
 * Autentica un usuario del sistema (SUPER_ADMIN, ADMIN, ADMINISTRATIVO, PORTERIA, AUDITOR)
 */
export async function POST(req: NextRequest) {
  await inicializarBaseDatos();
  // Obtener IP del cliente de forma segura en Next.js
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1').split(',')[0].trim();

  // Verificar rate limit
  const control = verificarLimite(`ip:${ip}`);
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

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const emailLimpio = String(email).toLowerCase().trim();
    const controlCuenta = verificarLimite(`cuenta:${emailLimpio}`, MAX_INTENTOS_CUENTA);
    if (!controlCuenta.permitido) {
      return NextResponse.json(
        { error: 'Demasiados intentos de inicio de sesión. Esperá unos minutos y volvé a intentar.', segundosRestantes: controlCuenta.segundosRestantes },
        { status: 429, headers: { 'Retry-After': String(controlCuenta.segundosRestantes) } }
      );
    }

    // 1. Buscar usuario en base de datos PostgreSQL
    const result = await query(
      'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios_sistema WHERE email = $1 AND activo = 1',
      [emailLimpio]
    );
    const usuario = result.rows[0];

    if (!usuario) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // 2. Validar contraseña hasheada
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Un acceso válido corta el bloqueo acumulado de esa cuenta.
    registros.delete(`cuenta:${emailLimpio}`);

    // El personal de portería puede iniciar sesión si tiene al menos una ceremonia
    // asignada. Las operaciones de acreditación validan aparte la ceremonia activa.
    if (usuario.rol === 'PORTERIA') {
      const authCheck = await query(
        'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE usuario_id = $1 LIMIT 1',
        [usuario.id]
      );
      if (authCheck.rows.length === 0) {
        const cerActiva = await query('SELECT id FROM ceremonias WHERE activa = 1 LIMIT 1');
        if (cerActiva.rows.length > 0) {
          await query(
            'INSERT INTO ceremonias_usuarios_autorizados (ceremonia_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [cerActiva.rows[0].id, usuario.id]
          );
        }
      }
    }

    // 3. Actualizar fecha del último login
    await query('UPDATE usuarios_sistema SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [usuario.id]);

    // 4. Firmar token JWT de sesión (8 horas de vida)
    const token = firmar({
      tipo: 'personal',
      id: usuario.id,
      rol: usuario.rol,
      nombre: usuario.nombre
    }, 8 * 60 * 60);

    const respuesta = NextResponse.json({
      ok: true,
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
