/**
 * Ejemplo 02: Crear una Credencial Digital o Carnet de Socio
 */

import { BilleteraGoogle } from '../src/index.js';

const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000022289454',
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL || 'mi-cuenta@mi-proyecto.iam.gserviceaccount.com',
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEv...'
});

const resultado = wallet.crearPaseGenerico({
  clase: {
    id: 'carnet_socio_club',
    nombreEmisor: 'Club Deportivo Central',
    colorFondoHex: '#047857',
    logoUrl: 'https://ejemplo.com/club-logo.png'
  },
  pase: {
    idObjeto: 'socio_4812',
    tituloTarjeta: 'Carnet de Socio',
    encabezado: 'Santiago Méndez',
    subencabezado: 'Socio Activo · Fútbol & Gimnasio',
    codigoBarras: 'SOCIO:4812',
    campos: [
      { etiqueta: 'N° de Socio', valor: '4812' },
      { etiqueta: 'Categoría', valor: 'Pleno' },
      { etiqueta: 'Vencimiento Cuota', valor: '30/11/2026' }
    ],
    enlaces: [
      { url: 'https://clubcentral.com/reservas', texto: 'Reservar Cancha' }
    ]
  }
});

console.log('✨ Carnet digital generado exitosamente:');
console.log(resultado.urlGuardar);
