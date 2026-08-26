#!/usr/bin/env node

/**
 * @file bin/cli.js
 * @description Asistente interactivo en linea de comandos para configurar Google Wallet en cualquier proyecto.
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const preguntar = (pregunta, defecto = '') => {
  return new Promise(resolver => {
    const texto = defecto ? `${pregunta} [${defecto}]: ` : `${pregunta}: `;
    rl.question(texto, respuesta => {
      resolver(respuesta.trim() || defecto);
    });
  });
};

async function iniciarAsistente() {
  console.log('\n============================================================');
  console.log('       ASISTENTE DE CONFIGURACION DE GOOGLE WALLET          ');
  console.log('       Libreria oficial por Julian Cancelo                  ');
  console.log('============================================================\n');
  console.log('Este asistente generara la configuracion y un archivo de ejemplo para tu proyecto.\n');

  const nombreProyecto = await preguntar('1. Nombre de tu proyecto, empresa o institucion', 'Mi Empresa');
  const emisorId = await preguntar('2. Issuer ID de Google Wallet (ej: 33880000000...)', '3388000000022289454');
  const correoCliente = await preguntar('3. Correo de la Service Account (client_email)', `google-wallet@${nombreProyecto.toLowerCase().replace(/[^a-z0-9]/g, '-')}.iam.gserviceaccount.com`);
  
  console.log('\n4. Selecciona el tipo de pase principal a emitir:');
  console.log('   [1] Entradas de Eventos / Recitales / Actos (EventTicket)');
  console.log('   [2] Credenciales / Carnets de Socio / Empleados (GenericPass)');
  console.log('   [3] Tarjetas de Fidelidad / Puntos / Comercios (LoyaltyCard)');
  const tipoOpcion = await preguntar('Opcion seleccionada', '1');

  const tipoPase = tipoOpcion === '2' ? 'generico' : tipoOpcion === '3' ? 'fidelidad' : 'evento';

  console.log('\nGenerando archivos en el directorio actual...');

  // 1. Archivo .env.wallet
  const contenidoEnv = `# Variables de entorno para Google Wallet
GOOGLE_WALLET_ISSUER_ID="${emisorId}"
GOOGLE_WALLET_CLIENT_EMAIL="${correoCliente}"
GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nPEGA_AQUI_TU_CLAVE_PRIVADA_PEM\\n-----END PRIVATE KEY-----"
`;

  fs.writeFileSync(path.join(process.cwd(), '.env.wallet'), contenidoEnv, 'utf-8');
  console.log('  [OK] Creado: .env.wallet');

  // 2. Archivo de ejemplo en TypeScript
  let contenidoCodigo = '';

  if (tipoPase === 'evento') {
    contenidoCodigo = `import { BilleteraGoogle } from '@jcancelo/google-wallet';

const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID || '${emisorId}',
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL || '${correoCliente}',
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\\n...'
});

const pase = wallet.crearPaseEvento({
  clase: {
    id: 'evento_principal',
    nombreEvento: '${nombreProyecto} 2026',
    nombreOrganizador: '${nombreProyecto}',
    colorFondoHex: '#0F172A',
    nombreLugar: 'Auditorio Principal',
    fechaInicio: new Date().toISOString()
  },
  pase: {
    idObjeto: 'ticket_001',
    nombreTitular: 'Juan Perez',
    codigoBarras: 'TICKET:001',
    ubicacion: {
      sector: 'Platea A',
      fila: 'Fila 3',
      asiento: '12'
    },
    campos: [
      { etiqueta: 'Categoria', valor: 'Acceso General' }
    ]
  }
});

console.log('URL de Google Wallet generada:');
console.log(pase.urlGuardar);
`;
  } else if (tipoPase === 'generico') {
    contenidoCodigo = `import { BilleteraGoogle } from '@jcancelo/google-wallet';

const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID || '${emisorId}',
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL || '${correoCliente}',
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\\n...'
});

const credencial = wallet.crearPaseGenerico({
  clase: {
    id: 'credencial_oficial',
    nombreEmisor: '${nombreProyecto}',
    colorFondoHex: '#0284C7'
  },
  pase: {
    idObjeto: 'socio_101',
    tituloTarjeta: 'Credencial Oficial',
    encabezado: 'Juan Perez',
    subencabezado: 'Miembro Activo',
    codigoBarras: 'SOCIO:101',
    campos: [
      { etiqueta: 'ID', valor: '101' },
      { etiqueta: 'Estado', valor: 'Habilitado' }
    ]
  }
});

console.log('Credencial digital generada:');
console.log(credencial.urlGuardar);
`;
  } else {
    contenidoCodigo = `import { BilleteraGoogle } from '@jcancelo/google-wallet';

const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID || '${emisorId}',
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL || '${correoCliente}',
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\\n...'
});

const tarjeta = wallet.crearPaseFidelidad({
  clase: {
    id: 'programa_puntos',
    nombrePrograma: 'Club ${nombreProyecto}',
    nombreEmisor: '${nombreProyecto}',
    colorFondoHex: '#B45309'
  },
  pase: {
    idObjeto: 'cliente_501',
    nombreTitular: 'Juan Perez',
    categoriaSocio: 'Miembro Gold',
    puntosTexto: '500 Pts',
    codigoBarras: 'PUNTOS:501'
  }
});

console.log('Tarjeta de puntos generada:');
console.log(tarjeta.urlGuardar);
`;
  }

  fs.writeFileSync(path.join(process.cwd(), 'ejemplo-wallet.ts'), contenidoCodigo, 'utf-8');
  console.log('  [OK] Creado: ejemplo-wallet.ts\n');

  console.log('Configuracion completada.');
  console.log('Copia tu clave privada PEM en .env.wallet y ejecuta:');
  console.log('  npx tsx ejemplo-wallet.ts\n');

  rl.close();
}

iniciarAsistente().catch(console.error);
