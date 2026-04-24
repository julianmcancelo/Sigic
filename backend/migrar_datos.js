/**
 * Script de Migración: JSON -> PostgreSQL
 * Ejecución: node migrar_datos.js
 */
const fs = require('fs');
const path = require('path');
const db = require('./db');

const ARCHIVO_EGR = path.join(__dirname, 'datos/egresados.json');
const ARCHIVO_INV = path.join(__dirname, 'datos/invitados.json');
const ARCHIVO_ANF = path.join(__dirname, 'datos/anfiteatro.json');

async function migrar() {
  console.log('--- Iniciando Migración a PostgreSQL ---');
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Limpiar tablas previas (Opcional, para evitar duplicados en pruebas)
    await client.query('TRUNCATE egresados, invitados, configuracion_anfiteatro RESTART IDENTITY CASCADE');
    console.log('✔ Tablas limpiadas.');

    // 2. Migrar Egresados
    if (fs.existsSync(ARCHIVO_EGR)) {
      const egresados = JSON.parse(fs.readFileSync(ARCHIVO_EGR, 'utf8'));
      for (const e of egresados) {
        await client.query(
          `INSERT INTO egresados (id, token, nombre, legajo, dni, correo, creado_en)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [e.id, e.token, e.nombre, e.legajo, e.dni, e.correo, e.creadoEn]
        );
      }
      console.log(`✔ ${egresados.length} egresados migrados.`);
    }

    // 3. Migrar Invitados
    if (fs.existsSync(ARCHIVO_INV)) {
      const invitados = JSON.parse(fs.readFileSync(ARCHIVO_INV, 'utf8'));
      for (const i of invitados) {
        await client.query(
          `INSERT INTO invitados (id, egresado_id, nombre, dni, telefono, correo, relacion, presente, fecha_presente, creado_en)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [i.id, i.egresadoId, i.nombre, i.dni, i.telefono, i.correo, i.relacion, i.presente, i.fechaPresente, i.creadoEn]
        );
      }
      console.log(`✔ ${invitados.length} invitados migrados.`);
    }

    // 4. Migrar Configuración Anfiteatro
    if (fs.existsSync(ARCHIVO_ANF)) {
      const config = JSON.parse(fs.readFileSync(ARCHIVO_ANF, 'utf8'));
      await client.query(
        'INSERT INTO configuracion_anfiteatro (estructura, mapa_roles) VALUES ($1, $2)',
        [config.estructura, config.mapaRoles]
      );
      console.log('✔ Configuración del anfiteatro migrada.');
    }

    await client.query('COMMIT');
    console.log('--- Migración Completada con Éxito ---');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✘ Error durante la migración:', error);
  } finally {
    client.release();
    process.exit();
  }
}

migrar();
