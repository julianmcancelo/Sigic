import crypto from 'crypto';

type PaseCeremonia = {
  graduadoId: string;
  token: string;
  nombre: string;
  ceremoniaId: string;
  ceremonia: string;
  fecha?: string | null;
  lugar?: string | null;
  asiento?: string | null;
  acceso: string;
};

type CuentaServicio = {
  client_email: string;
  private_key: string;
};

const BASE_URL = 'https://walletobjects.googleapis.com/walletobjects/v1';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';

function codificarBase64Url(valor: string | Buffer) {
  return Buffer.from(valor).toString('base64url');
}

function obtenerConfiguracion() {
  const credenciales = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON;
  const classId = process.env.GOOGLE_WALLET_CLASS_ID;
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;

  if (!credenciales || !classId || !issuerId) return null;

  try {
    const cuenta = JSON.parse(credenciales) as CuentaServicio;
    if (!cuenta.client_email || !cuenta.private_key) return null;
    return { cuenta, classId, issuerId };
  } catch {
    console.error('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON no contiene JSON válido.');
    return null;
  }
}

function firmarJwt(cuenta: CuentaServicio, payload: Record<string, unknown>) {
  const cabecera = codificarBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const cuerpo = codificarBase64Url(JSON.stringify(payload));
  const contenido = `${cabecera}.${cuerpo}`;
  const firma = crypto.createSign('RSA-SHA256').update(contenido).end().sign(cuenta.private_key).toString('base64url');
  return `${contenido}.${firma}`;
}

async function obtenerToken(cuenta: CuentaServicio) {
  const ahora = Math.floor(Date.now() / 1000);
  const assertion = firmarJwt(cuenta, {
    iss: cuenta.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: ahora,
    exp: ahora + 3600,
  });
  const respuesta = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!respuesta.ok) throw new Error(`Google OAuth rechazó la cuenta de servicio (${respuesta.status}).`);
  const datos = await respuesta.json() as { access_token?: string };
  if (!datos.access_token) throw new Error('Google OAuth no devolvió un token de acceso.');
  return datos.access_token;
}

function idSeguro(valor: string) {
  return valor.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 100);
}

function textoLocalizado(valor: string) {
  return { defaultValue: { language: 'es-419', value: valor } };
}

function capitalizar(valor: string) {
  const limpio = valor.replace(/[_]+/g, ' ').trim();
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase() : limpio;
}

function desglosarAsiento(valor?: string | null) {
  if (!valor) return undefined;

  const partes = valor.split('-').map(parte => parte.trim()).filter(Boolean);
  if (partes.length < 3) return { seat: textoLocalizado(valor) };

  const seat = partes.pop()!;
  const row = partes.pop()!;
  const section = partes.map(capitalizar).join(' ');
  return {
    section: textoLocalizado(section),
    row: textoLocalizado(row.toUpperCase()),
    seat: textoLocalizado(seat),
  };
}

function imagen(uri: string, descripcion: string) {
  return {
    sourceUri: { uri },
    contentDescription: textoLocalizado(descripcion),
  };
}

/** Crea o actualiza un Event Ticket y devuelve una URL firmada para Google Wallet. */
export async function generarPaseGoogleWallet(pase: PaseCeremonia) {
  const configuracion = obtenerConfiguracion();
  if (!configuracion) return null;

  const { cuenta, classId, issuerId } = configuracion;
  const objectId = `${issuerId}.sigic-${idSeguro(pase.ceremoniaId)}-${idSeguro(pase.token)}`;
  const heroUrl = new URL('/google-wallet-hero-credencial.jpg', pase.acceso).toString();
  const enlaceMapa = pase.lugar
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pase.lugar)}`
    : null;
  const enlaces = [
    { uri: pase.acceso, description: 'Abrir mi credencial SiGIC', id: 'portal-sigic' },
    ...(enlaceMapa ? [{ uri: enlaceMapa, description: 'Cómo llegar a la ceremonia', id: 'mapa-ceremonia' }] : []),
  ];
  const objeto = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    hexBackgroundColor: '#071b34',
    heroImage: imagen(heroUrl, 'Identidad visual de la ceremonia SiGIC'),
    ticketHolderName: pase.nombre,
    ticketNumber: pase.token,
    ticketType: textoLocalizado('Graduado'),
    reservationInfo: { confirmationCode: pase.token },
    barcode: { type: 'QR_CODE', value: `SIGIC:${pase.token}`, alternateText: `Acceso ${pase.token}` },
    groupingInfo: { groupingId: pase.ceremoniaId },
    seatInfo: desglosarAsiento(pase.asiento),
    textModulesData: [
      {
        id: 'indicaciones-acceso',
        header: 'Ingreso a la ceremonia',
        body: 'Presentá el código QR al personal de acreditación. Esta credencial es personal.',
      },
      {
        id: 'datos-ceremonia',
        header: pase.ceremonia,
        body: [pase.fecha, pase.lugar].filter(Boolean).join(' · ') || 'Consultá el portal para ver la información actualizada.',
      },
    ],
    linksModuleData: { uris: enlaces },
  };

  const token = await obtenerToken(cuenta);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const existente = await fetch(`${BASE_URL}/eventTicketObject/${encodeURIComponent(objectId)}`, { headers });
  const respuesta = existente.status === 404
    ? await fetch(`${BASE_URL}/eventTicketObject`, { method: 'POST', headers, body: JSON.stringify(objeto) })
    : await fetch(`${BASE_URL}/eventTicketObject/${encodeURIComponent(objectId)}`, { method: 'PATCH', headers, body: JSON.stringify(objeto) });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`Google Wallet no pudo emitir el pase (${respuesta.status}): ${detalle.slice(0, 280)}`);
  }

  const ahora = Math.floor(Date.now() / 1000);
  const jwtGuardar = firmarJwt(cuenta, {
    iss: cuenta.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: ahora,
    origins: [new URL(pase.acceso).origin],
    payload: { eventTicketObjects: [objeto] },
  });
  return {
    objectId,
    url: `https://pay.google.com/gp/v/save/${jwtGuardar}`,
  };
}
