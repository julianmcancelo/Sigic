/**
 * Script de Respaldo: Neon PostgreSQL -> datos/backup_postgres.sql
 * Este script genera un respaldo autónomo físico de tu base de datos en la nube.
 * Para no depender de herramientas externas del sistema (como pg_dump que puede no estar
 * instalado), este script se conecta mediante Node.js, recupera la estructura y vuelca
 * todos los datos en sentencias SQL listas para importar.
 * 
 * Ejecución: node scripts/respaldar_postgres.js
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('✘ Error: DATABASE_URL no definida en backend/.env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Función de escape para valores en sentencias SQL
function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') {
    // Si es un objeto (JSONB), lo stringificamos y escapamos las comillas simples
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  // Escapa comillas simples duplicándolas (estándar SQL)
  return `'${val.toString().replace(/'/g, "''")}'`;
}

async function respaldar() {
  console.log('🔌 Conectando a Neon PostgreSQL para generar respaldo...');
  const client = await pool.connect();

  try {
    const backupFilePath = path.resolve(__dirname, '..', 'datos', 'backup_postgres.sql');
    console.log(`📂 Archivo de respaldo de destino: datos/backup_postgres.sql`);

    // Cabecera del respaldo
    let sqlDump = `-- ============================================================
-- COPIA DE SEGURIDAD SiGIC — Neon PostgreSQL Cloud
-- Generado Automáticamente: ${new Date().toLocaleString()}
-- ============================================================

-- Configuración de sesión para importar de forma segura
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

`;

    // 1. Añadimos el esquema original de creación de tablas
    console.log('📜 Integrando el esquema de base de datos...');
    const schemaPath = path.resolve(__dirname, '..', 'datos', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      sqlDump += `-- ------------------------------------------------------------\n`;
      sqlDump += `-- ESQUEMA DE TABLAS Y ESTRUCTURA\n`;
      sqlDump += `-- ------------------------------------------------------------\n\n`;
      sqlDump += schemaSql;
      sqlDump += `\n\n-- ------------------------------------------------------------\n`;
      sqlDump += `-- VOLCADO DE DATOS OPERATIVOS\n`;
      sqlDump += `-- ------------------------------------------------------------\n\n`;
      sqlDump += `BEGIN;\n\n`;
    } else {
      console.warn('⚠ Advertencia: schema.sql no encontrado. El backup solo contendrá sentencias de inserción.');
      sqlDump += `BEGIN;\n\n`;
    }

    // Listado de tablas en orden lógico de dependencias (llaves foráneas primero)
    const tablas = [
      'usuarios_sistema',
      'ceremonias',
      'egresados',
      'otp_historial',
      'invitados',
      'configuracion_anfiteatro',
      'logs_auditoria',
      'configuracion_sistema'
    ];

    for (const tabla of tablas) {
      console.log(`📦 Volcando datos de la tabla: ${tabla}...`);
      sqlDump += `-- Volcado de tabla: ${tabla}\n`;

      // Consultamos los datos
      const res = await client.query(`SELECT * FROM ${tabla}`);

      if (res.rows.length === 0) {
        sqlDump += `-- (Tabla sin registros)\n\n`;
        console.log(`  (Sin registros en ${tabla})`);
        continue;
      }

      // Obtenemos los nombres de las columnas
      const campos = Object.keys(res.rows[0]);
      const camposStr = campos.map(c => `"${c}"`).join(', ');

      for (const row of res.rows) {
        const valores = campos.map(c => escapeSqlValue(row[c])).join(', ');
        sqlDump += `INSERT INTO ${tabla} (${camposStr}) VALUES (${valores}) ON CONFLICT DO NOTHING;\n`;
      }
      sqlDump += `\n`;
      console.log(`  ✔ Volcados ${res.rows.length} registros de ${tabla}.`);
    }

    sqlDump += `COMMIT;\n`;
    sqlDump += `-- Fin del Respaldo de Seguridad\n`;

    // Escribimos el archivo físico
    fs.writeFileSync(backupFilePath, sqlDump, 'utf8');
    console.log('🎉 --- ¡COPIA DE SEGURIDAD GENERADA CON ÉXITO! ---');
    console.log(`✔ Archivo guardado correctamente en: datos/backup_postgres.sql`);

  } catch (error) {
    console.error('✘ Error grave al generar el respaldo de PostgreSQL:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

respaldar();
