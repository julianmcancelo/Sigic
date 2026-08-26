/**
 * Ejemplo 01: Crear una Entrada de Evento / Colación para Google Wallet
 * Ejecutar con: npx tsx ejemplos/01-pase-evento.ts
 */

import { BilleteraGoogle } from '../src/index.js';

// 1. Inicializar la billetera con tus credenciales
const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000022289454',
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL || 'sigic-wallet@sigic.iam.gserviceaccount.com',
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...'
});

// 2. Generar el pase para el usuario
const resultado = wallet.crearPaseEvento({
  // Definición de la clase (plantilla del evento)
  clase: {
    id: 'colacion_2026',
    nombreEvento: 'Colación de Grados 2026',
    nombreEmisor: 'Instituto Superior Beltrán',
    logoUrl: 'https://sigic-one.vercel.app/logo.png',
    colorFondoHex: '#0F172A',
    fechaInicio: '2026-12-18T18:30:00Z',
    nombreLugar: 'Anfiteatro Beltrán',
    direccionLugar: 'Av. Beltrán 1234, Avellaneda'
  },
  // Datos específicos del pase para este graduado
  pase: {
    idObjeto: 'egresado_9842',
    nombreTitular: 'Julián Cancelo',
    codigoBarras: 'SIGIC:ABC1234',
    asiento: {
      sector: 'Platea Baja (Central)',
      fila: 'Fila 4',
      numero: 'Butaca 12',
      puertaAcceso: 'Puerta Principal'
    },
    campos: [
      { etiqueta: 'Carrera', valor: 'Técnico Superior en Programación' },
      { etiqueta: 'Legajo', valor: 'L-9842' },
      { etiqueta: 'Acompañantes', valor: '2 Personas' }
    ],
    enlaces: [
      { uri: 'https://sigic-one.vercel.app', descripcion: 'Portal del Graduado' }
    ]
  }
});

console.log('✅ Pase de Google Wallet generado con éxito!');
console.log('👉 URL para guardar en Google Wallet:');
console.log(resultado.urlGuardar);
