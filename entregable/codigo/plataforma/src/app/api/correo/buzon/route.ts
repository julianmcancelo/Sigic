import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioAutenticado, ROLES_LECTURA } from '@/lib/auth-middleware';
import { obtenerBuzonVirtual, limpiarBuzonVirtual } from '@/lib/email';

export async function GET(req: NextRequest) {
  const auth = await obtenerUsuarioAutenticado(req, ROLES_LECTURA);
  if (!auth.valido) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  const correos = obtenerBuzonVirtual();
  return NextResponse.json({
    ok: true,
    total: correos.length,
    correos,
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await obtenerUsuarioAutenticado(req, ROLES_LECTURA);
  if (!auth.valido) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  limpiarBuzonVirtual();
  return NextResponse.json({ ok: true, mensaje: 'Buzón virtual vaciado' });
}
