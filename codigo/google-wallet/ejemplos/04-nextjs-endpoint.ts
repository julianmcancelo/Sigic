/**
 * Ejemplo 04: Endpoint API en Next.js (App Router) para generar pases
 * Archivo: app/api/wallet/route.ts
 */

import { NextResponse } from 'next/server';
import { BilleteraGoogle } from '@jcancelo/google-wallet';

const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID!,
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL!,
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY!
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { usuarioId, nombre, email, ticketId } = body;

    // Generar el pase para el usuario
    const resultado = wallet.crearPaseEvento({
      clase: {
        id: 'evento_principal',
        nombreEvento: 'Mi Evento 2026',
        nombreOrganizador: 'Mi Empresa',
        colorFondoHex: '#0F172A'
      },
      pase: {
        idObjeto: `ticket_${ticketId}`,
        nombreTitular: nombre,
        codigoBarras: `TICKET:${ticketId}`,
        campos: [
          { etiqueta: 'Asistente', valor: nombre },
          { etiqueta: 'Email', valor: email }
        ]
      }
    });

    return NextResponse.json({
      ok: true,
      url: resultado.urlGuardar,
      objetoId: resultado.idObjetoCompleto
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
