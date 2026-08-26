/**
 * Ejemplo 02: Crear una Credencial Digital / Identificación para Google Wallet
 */

import { BilleteraGoogle } from '../src/index.js';

const wallet = new BilleteraGoogle({
  emisorId: '3388000000022289454',
  correoCliente: 'mi-cuenta@mi-proyecto.iam.gserviceaccount.com',
  clavePrivada: '-----BEGIN PRIVATE KEY-----\nMIIEv...'
});

const credencial = wallet.crearPaseGenerico({
  clase: {
    id: 'credencial_alumno',
    titulo: 'Credencial Estudiantil',
    nombreEmisor: 'Instituto Beltrán',
    colorFondoHex: '#0284C7',
    logoUrl: 'https://sigic-one.vercel.app/logo.png'
  },
  pase: {
    idObjeto: 'alumno_1044',
    tituloTarjeta: 'Alumno Regular',
    encabezado: 'Julián Cancelo',
    subencabezado: 'Desarrollo de Software',
    codigoBarras: 'ALUMNO:1044',
    campos: [
      { etiqueta: 'DNI', valor: '42.123.456' },
      { etiqueta: 'Condición', valor: 'Regular' },
      { etiqueta: 'Vigencia', valor: 'Diciembre 2026' }
    ]
  }
});

console.log('✅ Credencial digital generada:');
console.log(credencial.urlGuardar);
