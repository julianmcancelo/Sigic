import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { firmar } from '@/lib/tokens';
import bcrypt from 'bcryptjs';

// Limitador de intentos en memoria para evitar fuerza bruta
const registros = new Map<string, { contador: number; reinicio: number }>();
const VENTANA_MS = 10 * 60 * 1000; // 10 minutos
const MAX_INTENTOS = 8;

function verificarLimite(ip: string): { permitido: boolean; segundosRestantes: number } {
  const ahora = Date.now();
  let registro = registros.get(ip);

  if (!registro || ahora > registro.reinicio) {
    registro = { contador: 0, reinicio: ahora + VENTANA_MS };
    registros.set(ip, registro);
  }

  registro.contador++;
  if (registro.contador > MAX_INTENTOS) {
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
  // Obtener IP del cliente de forma segura en Next.js
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

  // Verificar rate limit
  const control = verificarLimite(ip);
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

    // El personal de portería puede iniciar sesión si tiene al menos una ceremonia
    // asignada. Las operaciones de acreditación validan aparte la ceremonia activa.
    if (usuario.rol === 'PORTERIA') {
      const authCheck = await query(
        'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE usuario_id = $1 LIMIT 1',
        [usuario.id]
      );
      if (authCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Tu cuenta todavía no tiene ceremonias asignadas.' }, { status: 403 });
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

    return NextResponse.json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en API Login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor durante la autenticación' },
      { status: 500 }
    );
  }
}
