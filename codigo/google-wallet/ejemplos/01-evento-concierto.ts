/**
 * Ejemplo 01: Crear una Entrada a un Evento / Concierto para Google Wallet
 * Ejecutar con: npx tsx ejemplos/01-evento-concierto.ts
 */

import { BilleteraGoogle } from '../src/index.js';

// 1. Instanciar la billetera con las credenciales de tu proyecto
const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000022289454',
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL || 'mi-cuenta@mi-proyecto.iam.gserviceaccount.com',
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEv...'
});

// 2. Generar el pase para el asistente
const resultado = wallet.crearPaseEvento({
  clase: {
    id: 'rock_fest_2026',
    nombreEvento: 'Rock Fest 2026',
    nombreOrganizador: 'Mi Productora',
    logoUrl: 'https://ejemplo.com/logo.png',
    bannerUrl: 'https://ejemplo.com/banner.png',
    colorFondoHex: '#1E1B4B',
    fechaInicio: '2026-11-20T21:00:00Z',
    nombreLugar: 'Estadio Obras',
    direccionLugar: 'Av. del Libertador 7395, CABA'
  },
  pase: {
    idObjeto: 'ticket_usr_882',
    nombreTitular: 'Martina Rodríguez',
    codigoBarras: 'TICKET-ROCK-882194',
    ubicacion: {
      sector: 'Campo VIP',
      puertaAcceso: 'Acceso Puerta 2'
    },
    campos: [
      { etiqueta: 'Tipo de Entrada', valor: 'Pase General 2 Días' },
      { etiqueta: 'N° de Orden', valor: '#882194' }
    ],
    enlaces: [
      { url: 'https://miproductora.com/lineup', texto: 'Ver Horarios del Festival' }
    ]
  }
});

console.log('✨ Pase de Evento generado exitosamente!');
console.log('👉 URL para abrir y guardar en Google Wallet:');
console.log(resultado.urlGuardar);
