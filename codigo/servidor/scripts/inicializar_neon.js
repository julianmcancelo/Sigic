/**
 * Script de Inicialización de Esquema en Neon PostgreSQL
 * Borra tablas viejas y crea la estructura definitiva alineada a la lógica del backend.
 * Ejecución: node scripts/inicializar_neon.js
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('✘ Error: La variable de entorno DATABASE_URL no está definida en backend/.env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function inicializar() {
  console.log('🔌 Conectando a Neon para recrear esquema...');
  const client = await pool.connect();

  try {
    console.log('🧹 Eliminando tablas existentes (CASCADE) para limpiar estructuras antiguas...');
    const dropQuery = `
      DROP TABLE IF EXISTS logs_auditoria CASCADE;
      DROP TABLE IF EXISTS configuracion_anfiteatro CASCADE;
      DROP TABLE IF EXISTS invitados CASCADE;
      DROP TABLE IF EXISTS otp_historial CASCADE;
      DROP TABLE IF EXISTS egresados CASCADE;
      DROP TABLE IF EXISTS ceremonias CASCADE;
      DROP TABLE IF EXISTS usuarios_sistema CASCADE;
      DROP TABLE IF EXISTS configuracion_sistema CASCADE;
    `;
    await client.query(dropQuery);
    console.log('✓ Tablas eliminadas con éxito.');

    console.log('📜 Leyendo archivo de esquema datos/schema.sql...');
    const schemaPath = path.resolve(__dirname, '..', 'datos', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⚡ Ejecutando schema.sql en Neon PostgreSQL...');
    await client.query(schemaSql);
    console.log('✓ ¡Esquema de base de datos PostgreSQL recreado con éxito!');

  } catch (error) {
    console.error('✘ Error grave durante la inicialización:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

inicializar();
