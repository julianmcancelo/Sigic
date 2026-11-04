import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    servicio: 'sigic',
    nombre: 'SiGIC Accesos',
    hora: new Date().toISOString()
  });
}
