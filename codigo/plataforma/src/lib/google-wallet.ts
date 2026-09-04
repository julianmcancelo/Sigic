import { BilleteraGoogle } from '@jcancelo/google-wallet';

export type PaseCeremonia = {
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

function idSeguro(valor: string) {
  return valor.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 100);
}

function capitalizar(valor: string) {
  const limpio = valor.replace(/[_]+/g, ' ').trim();
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase() : limpio;
}

function desglosarAsiento(valor?: string | null) {
  if (!valor) return undefined;

  const partes = valor.split('-').map(parte => parte.trim()).filter(Boolean);
  if (partes.length < 3) {
    return { asiento: valor };
  }

  const seat = partes.pop()!;
  const row = partes.pop()!;
  const section = partes.map(capitalizar).join(' ');
  return {
    sector: section,
    fila: row.toUpperCase(),
    asiento: seat,
  };
}

function obtenerFechaYMD(fecha?: string | null): string {
  if (!fecha) return '2026-08-27';
  const fechaTrim = String(fecha).trim();
  const match = fechaTrim.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  try {
    const d = new Date(fechaTrim);
    if (!isNaN(d.getTime())) {
      const anio = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      return `${anio}-${mes}-${dia}`;
    }
  } catch {}
  return '2026-08-27';
}

function formatearFechaEspanol(fecha?: string | null): string {
  if (!fecha) return '27 de agosto de 2026';
  try {
    const raw = String(fecha).includes('T') ? String(fecha) : `${String(fecha).trim()}T12:00:00`;
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    }
  } catch {}
  return String(fecha);
}

function obtenerBilletera(origen?: string) {
  const credenciales = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON;
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;

  let correoCliente = clientEmail;
  let clavePrivada = privateKey;

  if (credenciales) {
    try {
      const cuenta = JSON.parse(credenciales) as CuentaServicio;
      correoCliente = cuenta.client_email || correoCliente;
      clavePrivada = cuenta.private_key || clavePrivada;
    } catch {
      console.error('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON no contiene un JSON válido.');
    }
  }

  if (!issuerId || !correoCliente || !clavePrivada) {
    return null;
  }

  const origenes = origen ? [new URL(origen).origin] : undefined;

  return new BilleteraGoogle({
    emisorId: issuerId,
    correoCliente,
    clavePrivada,
    origenesPermitidos: origenes,
    idioma: 'es-419',
  });
}

/**
 * Crea un Event Ticket y devuelve la URL firmada para Google Wallet
 * utilizando la librería oficial @jcancelo/google-wallet.
 */
export async function generarPaseGoogleWallet(pase: PaseCeremonia) {
  const wallet = obtenerBilletera(pase.acceso);
  if (!wallet) return null;

  const classIdCorto = `sigic_class_${idSeguro(pase.ceremoniaId || 'agosto_2026')}`;
  const objectIdCorto = `sigic_${idSeguro(pase.ceremoniaId || 'agosto_2026')}_${idSeguro(pase.token)}`;
  const heroUrl = new URL('/google-wallet-hero-credencial.jpg', pase.acceso).toString();
  const enlaceMapa = pase.lugar
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pase.lugar)}`
    : null;

  const fechaYMD = obtenerFechaYMD(pase.fecha);
  const doorsOpenIso = `${fechaYMD}T17:00:00-03:00`;
  const fechaLegible = formatearFechaEspanol(pase.fecha);

  const resultado = wallet.crearPaseEvento({
    clase: {
      id: classIdCorto,
      nombreEvento: pase.ceremonia || 'Ceremonia de Graduación 2026',
      nombreOrganizador: 'Instituto Tecnológico Beltrán',
      logoUrl: 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/logo-oficial.png',
      bannerUrl: heroUrl || 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/google-wallet-hero-credencial.jpg',
      colorFondoHex: '#071b34',
      fechaInicio: doorsOpenIso,
      nombreLugar: pase.lugar || 'Auditorio Instituto Tecnológico Beltrán',
      direccionLugar: pase.lugar || 'Av. Manuel Belgrano 1191, Avellaneda, Buenos Aires, Argentina',
      mensajes: [
        {
          encabezado: 'Ceremonia Oficial de Colación',
          cuerpo: 'Se solicita presentarse 45 minutos antes para acreditación y asignación protocolar.'
        }
      ]
    },
    pase: {
      idObjeto: objectIdCorto,
      nombreTitular: pase.nombre,
      tipoEntrada: 'Graduado',
      codigoReserva: pase.token,
      codigoBarras: {
        tipo: 'QR_CODE',
        valor: `SIGIC:${pase.token}`,
        textoAlternativo: `Acceso ${pase.token}`,
      },
      ubicacion: desglosarAsiento(pase.asiento),
      mensajes: [
        {
          encabezado: 'Acreditación en Portería',
          cuerpo: 'Presentá este código QR en el acceso. Habilita tu ingreso y el de tus acompañantes asignados.'
        }
      ],
      campos: [
        {
          clave: 'indicaciones-acceso',
          etiqueta: 'Ingreso a la ceremonia',
          valor: 'Presentá el código QR al personal de acreditación. Esta credencial es personal.',
        },
        {
          clave: 'datos-ceremonia',
          etiqueta: pase.ceremonia || 'Ceremonia de Graduación SiGIC 2026',
          valor: [fechaLegible, pase.lugar || 'Auditorio Instituto Beltrán'].filter(Boolean).join(' · '),
        },
      ],
      enlaces: [
        { url: pase.acceso, texto: 'Abrir mi credencial SiGIC' },
        ...(enlaceMapa ? [{ url: enlaceMapa, texto: 'Cómo llegar a la ceremonia' }] : []),
      ],
    },
  });

  return {
    objectId: resultado.idObjetoCompleto,
    url: resultado.urlGuardar,
  };
}
