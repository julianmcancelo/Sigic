import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Bypass-Tunnel-Reminder',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password } = await req.json().catch(() => ({}));

    if (process.platform === 'linux') {
      try {
        await execFileAsync('sudo', [
          '/usr/local/bin/sigic-configurar-usuario',
          String(nombre || 'SiGIC Beltrán'),
          String(email || 'admin@sigic.com'),
          String(password || '')
        ]);
        console.log('[SISTEMA] Usuario de Linux actualizado exitosamente.');
      } catch (err: any) {
        console.warn('[SISTEMA] No se pudo ejecutar sigic-configurar-usuario:', err.message);
      }
    }

    return NextResponse.json({ ok: true, mensaje: 'Usuario del sistema configurado correctamente' }, { headers: CORS_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
