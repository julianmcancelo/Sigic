/**
 * Ejemplo 03: Crear una Tarjeta de Fidelidad / Puntos para Comercios o Cafés
 */

import { BilleteraGoogle } from '../src/index.js';

const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000022289454',
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL || 'mi-cuenta@mi-proyecto.iam.gserviceaccount.com',
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEv...'
});

const resultado = wallet.crearPaseFidelidad({
  clase: {
    id: 'cafe_roma_puntos',
    nombrePrograma: 'Club Café Roma',
    nombreEmisor: 'Café Roma & Bakery',
    colorFondoHex: '#78350F',
    logoUrl: 'https://ejemplo.com/cafe-logo.png'
  },
  pase: {
    idObjeto: 'cliente_9912',
    nombreTitular: 'Camila Torres',
    categoriaSocio: 'Miembro Gold ★',
    puntosTexto: '350 Puntos',
    numeroCuenta: 'CR-9912',
    codigoBarras: 'PUNTOS:CR-9912',
    campos: [
      { etiqueta: 'Próximo Beneficio', valor: 'Café gratis a los 400 pts' },
      { etiqueta: 'Descuento en Pastelería', valor: '15% OFF' }
    ]
  }
});

console.log('✨ Tarjeta de puntos generada exitosamente:');
console.log(resultado.urlGuardar);
