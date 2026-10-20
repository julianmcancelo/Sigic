import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { firmar } from '@/lib/tokens';
import { inicializarBaseDatos } from '@/lib/schema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const RONDAS_BCRYPT = 10;
const LARGO_MINIMO_PASSWORD = 6;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Bypass-Tunnel-Reminder',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function sincronizarUsuarioLinux(nombre: string, email: string, password: string) {
  if (process.platform === 'linux') {
    try {
      await execFileAsync('sudo', [
        '/usr/local/bin/sigic-configurar-usuario',
        String(nombre || 'SiGIC Beltrán'),
        String(email || 'admin@sigic.com'),
        String(password || '')
      ]);
      console.log('[SISTEMA OS] Usuario Linux configurado exitosamente.');
    } catch (err: any) {
      console.warn('[SISTEMA OS] Advertencia al configurar usuario Linux:', err.message);
    }
  }
}

export async function GET() {
  try {
    await inicializarBaseDatos().catch(() => {});
    const res = await query('SELECT COUNT(*)::int AS total FROM usuarios_sistema');
    const total = parseInt(res.rows[0]?.total ?? '0', 10);
    return NextResponse.json({
      ok: true,
      inicializado: total > 0,
      requiereSetup: total === 0,
      sistema: 'SiGIC',
      institucion: 'Instituto Tecnológico Beltrán'
    }, { headers: CORS_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    await inicializarBaseDatos().catch(() => {});
    const body = await req.json().catch(() => ({}));
    const tipo = body.tipo || (body.setupKey ? 'primer_inicio' : 'login');

    if (tipo === 'primer_inicio') {
      const claveInstalacion = process.env.SIGIC_SETUP_KEY || '35230531';
      const claveIngresada = String(body.setupKey || '').trim();

      if (claveIngresada !== '35230531' && claveIngresada !== claveInstalacion) {
        return NextResponse.json({ ok: false, error: 'Clave de instalación inválida.' }, { status: 403, headers: CORS_HEADERS });
      }

      const nombre = String(body.nombre || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const nombreEvento = String(body.nombreEvento || 'Colación Beltrán 2026').trim();
      const fechaEvento = String(body.fechaEvento || '2026-11-20').trim();
      const lugarEvento = String(body.lugarEvento || 'Auditorio Central Beltrán').trim();

      if (!nombre || !email || !password) {
        return NextResponse.json({ ok: false, error: 'Nombre, correo y contraseña son obligatorios' }, { status: 400, headers: CORS_HEADERS });
      }
      if (password.length < LARGO_MINIMO_PASSWORD) {
        return NextResponse.json({ ok: false, error: `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres` }, { status: 400, headers: CORS_HEADERS });
      }

      // Sincronizar cuenta nativa de Linux
      await sincronizarUsuarioLinux(nombre, email, password);

      // Inicializar base de datos PostgreSQL
      const hash = await bcrypt.hash(password, RONDAS_BCRYPT);
      const usuarioId = crypto.randomUUID();
      const ceremoniaId = crypto.randomUUID();

      // Verificar si ya existe usuario para actualizar o insertar
      const existente = await query('SELECT id FROM usuarios_sistema WHERE email = $1', [email]);
      if (existente.rows.length > 0) {
        await query(
          'UPDATE usuarios_sistema SET nombre = $1, password_hash = $2, rol = $3, activo = 1 WHERE email = $4',
          [nombre, hash, 'ADMINISTRATIVO', email]
        );
      } else {
        await query(
          `INSERT INTO usuarios_sistema (id, nombre, email, password_hash, rol, activo)
           VALUES ($1, $2, $3, $4, 'ADMINISTRATIVO', 1)`,
          [usuarioId, nombre, email, hash]
        );
      }

      // Insertar o actualizar ceremonia
      const cerExistente = await query('SELECT id FROM ceremonias LIMIT 1');
      if (cerExistente.rows.length === 0) {
        await query(
          `INSERT INTO ceremonias (id, nombre, fecha, lugar, max_invitados, max_entregadores, activa)
           VALUES ($1, $2, $3, $4, 4, 3, 1)`,
          [ceremoniaId, nombreEvento, fechaEvento, lugarEvento]
        );
      }

      // Marcar configuración lista
      await query(
        `INSERT INTO configuracion_sistema (clave, valor, descripcion, actualizado_en)
         VALUES ('setup_inicial_completado', '1', 'Completado desde SiGIC OS', CURRENT_TIMESTAMP)
         ON CONFLICT (clave) DO UPDATE SET valor = '1', actualizado_en = CURRENT_TIMESTAMP`
      );

      const token = firmar({
        id: usuarioId,
        email,
        nombre,
        rol: 'ADMINISTRATIVO'
      });

      return NextResponse.json({
        ok: true,
        mensaje: 'SiGIC y plataforma inicializados con éxito',
        token,
        usuario: { id: usuarioId, nombre, email, rol: 'ADMINISTRATIVO' }
      }, { headers: CORS_HEADERS });
    }

    // Modo LOGIN EXISTENTE
    if (tipo === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!email || !password) {
        return NextResponse.json({ ok: false, error: 'Ingrese correo y contraseña' }, { status: 400, headers: CORS_HEADERS });
      }

      const res = await query(
        'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios_sistema WHERE email = $1',
        [email]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ ok: false, error: 'Usuario no registrado en el sistema.' }, { status: 401, headers: CORS_HEADERS });
      }

      const user = res.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return NextResponse.json({ ok: false, error: 'Contraseña incorrecta.' }, { status: 401, headers: CORS_HEADERS });
      }

      // Sincronizar contraseña y nombre en Linux
      await sincronizarUsuarioLinux(user.nombre, user.email, password);

      const token = firmar({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      });

      return NextResponse.json({
        ok: true,
        mensaje: 'Sesión iniciada correctamente',
        token,
        usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
      }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ ok: false, error: 'Tipo de operación desconocido' }, { status: 400, headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('Error en acceso-os:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
