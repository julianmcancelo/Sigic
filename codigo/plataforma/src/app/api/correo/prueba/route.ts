import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioAutenticado, ROLES_GESTION } from '@/lib/auth-middleware';
import { enviarCorreo } from '@/lib/email';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const auth = obtenerUsuarioAutenticado(req, ROLES_GESTION);
  if (!auth.valido) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  const { destinatario } = await req.json().catch(() => ({ destinatario: '' }));
  const correo = String(destinatario || '').trim().toLowerCase();

  if (!EMAIL_VALIDO.test(correo)) {
    return NextResponse.json({ error: 'Ingresá un correo electrónico válido.' }, { status: 400 });
  }

  try {
    const resultado = await enviarCorreo(
      correo,
      'Prueba de correo de la demo · SiGIC',
      `
        <div style="background:#f8fafc;padding:32px;font-family:Arial,sans-serif;color:#1e293b">
          <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden">
            <div style="background:#2A3448;padding:26px;text-align:center">
              <img src="${new URL('/logo-oficial.png', req.url)}" alt="SiGIC" width="100" />
            </div>
            <div style="padding:34px">
              <p style="margin:0 0 8px;color:#0ea5e9;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">Prueba de funcionamiento</p>
              <h1 style="font-size:24px;margin:0 0 16px">El correo de SiGIC funciona correctamente</h1>
              <p style="font-size:15px;line-height:1.6;color:#475569">Este mensaje fue enviado desde la demo administrativa mediante Resend.</p>
              <p style="font-size:12px;color:#94a3b8;margin-top:28px">Fecha: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
            </div>
          </div>
        </div>
      `
    );

    return NextResponse.json({
      ok: true,
      mensaje: 'Resend aceptó el correo para su entrega.',
      proveedor: resultado.proveedor || 'smtp',
      id: resultado.id,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'No se pudo enviar el correo.';
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}
