/**
 * Script de Migración Definitivo: SQLite (datos/sigic.db) -> Neon PostgreSQL
 * ¡Hola! Con este script vamos a pasar toda la data real que ya tenés cargada en SQLite
 * directamente a la nube de Neon, de forma transaccional y sin perder absolutamente nada.
 * 
 * Ejecución: node scripts/migrar_datos.js
 */
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Rutas de archivos
const dbSqlitePath = path.resolve(__dirname, '..', 'datos', 'sigic.db');

// Validación rápida para no hacer desastres
if (!process.env.DATABASE_URL) {
  console.error('✘ Che, te falta configurar la DATABASE_URL en el archivo backend/.env. ¡Ponela y volvé a intentar!');
  process.exit(1);
}

// Armamos las conexiones
const dbSqlite = new Database(dbSqlitePath);
const poolPostgres = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para conectar a Neon sin que se queje por los certificados TLS/SSL
  }
});

async function migrar() {
  console.log('🚀 --- Iniciando Migración Real de SQLite a Neon PostgreSQL ---');
  const clientPostgres = await poolPostgres.connect();

  try {
    // Empezamos una transacción para que si algo sale mal, no nos quede la base a la mitad (todo o nada)
    await clientPostgres.query('BEGIN');

    // 1. Limpiamos las tablas en Postgres para evitar duplicar registros en caso de re-ejecución
    console.log('🧹 Limpiando tablas de destino en Neon Postgres...');
    await clientPostgres.query(`
      TRUNCATE usuarios_sistema, ceremonias, egresados, otp_historial, invitados, 
               configuracion_anfiteatro, logs_auditoria, configuracion_sistema RESTART IDENTITY CASCADE
    `);
    console.log('✔ Base de datos de destino limpia.');

    // ==========================================
    // TABLA 1: USUARIOS_SISTEMA
    // ==========================================
    console.log('👤 Migrando usuarios_sistema...');
    const usuarios = dbSqlite.prepare('SELECT * FROM usuarios_sistema').all();
    for (const u of usuarios) {
      await clientPostgres.query(
        `INSERT INTO usuarios_sistema (id, nombre, email, password_hash, rol, activo, ultimo_login, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [u.id, u.nombre, u.email, u.password_hash, u.rol, u.activo, u.ultimo_login, u.creado_en]
      );
    }
    console.log(`✔ Se migraron ${usuarios.length} usuarios.`);

    // ==========================================
    // TABLA 2: CEREMONIAS
    // ==========================================
    console.log('🎉 Migrando ceremonias...');
    const ceremonias = dbSqlite.prepare('SELECT * FROM ceremonias').all();
    for (const c of ceremonias) {
      await clientPostgres.query(
        `INSERT INTO ceremonias (id, nombre, fecha, lugar, max_invitados, activa, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [c.id, c.nombre, c.fecha, c.lugar, c.max_invitados, c.activa, c.creado_en]
      );
    }
    console.log(`✔ Se migraron ${ceremonias.length} ceremonias.`);

    // ==========================================
    // TABLA 3: EGRESADOS
    // ==========================================
    console.log('🎓 Migrando egresados...');
    const egresados = dbSqlite.prepare('SELECT * FROM egresados').all();
    for (const e of egresados) {
      await clientPostgres.query(
        `INSERT INTO egresados (id, ceremonia_id, registrado_por, token, nombre, legajo, dni, correo, otp, otp_expira, asiento_id, entregador_nombre, entregador_asiento_id, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          e.id, e.ceremonia_id, e.registrado_por, e.token, e.nombre, e.legajo, e.dni, 
          e.correo, e.otp, e.otp_expira, e.asiento_id, e.entregador_nombre, e.entregador_asiento_id, e.creado_en
        ]
      );
    }
    console.log(`✔ Se migraron ${egresados.length} egresados.`);

    // ==========================================
    // TABLA 4: OTP_HISTORIAL
    // ==========================================
    console.log('🔑 Migrando historial de OTP...');
    const otpHistorial = dbSqlite.prepare('SELECT * FROM otp_historial').all();
    for (const o of otpHistorial) {
      await clientPostgres.query(
        `INSERT INTO otp_historial (id, egresado_id, otp_hash, ip_origen, resultado, solicitado_en, verificado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [o.id, o.egresado_id, o.otp_hash, o.ip_origen, o.resultado, o.solicitado_en, o.verificado_en]
      );
    }
    console.log(`✔ Se migraron ${otpHistorial.length} registros de OTP.`);

    // ==========================================
    // TABLA 5: INVITADOS
    // ==========================================
    console.log('👥 Migrando invitados...');
    const invitados = dbSqlite.prepare('SELECT * FROM invitados').all();
    for (const i of invitados) {
      await clientPostgres.query(
        `INSERT INTO invitados (id, egresado_id, validado_por, nombre, dni, telefono, correo, relacion, asiento_id, discapacidad, presente, fecha_presente, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          i.id, i.egresado_id, i.validado_por, i.nombre, i.dni, i.telefono, i.correo, 
          i.relacion, i.asiento_id, i.discapacidad, i.presente, i.fecha_presente, i.creado_en
        ]
      );
    }
    console.log(`✔ Se migraron ${invitados.length} invitados.`);

    // ==========================================
    // TABLA 6: CONFIGURACION_ANFITEATRO
    // ==========================================
    console.log('🏛 Migrando configuración del anfiteatro...');
    const anfiteatro = dbSqlite.prepare('SELECT * FROM configuracion_anfiteatro').all();
    for (const a of anfiteatro) {
      // Como Postgres maneja JSONB nativo, parseamos el texto plano que viene de SQLite
      const estructuraObj = JSON.parse(a.estructura);
      const mapaRolesObj = JSON.parse(a.mapa_roles);

      await clientPostgres.query(
        `INSERT INTO configuracion_anfiteatro (id, ceremonia_id, modificado_por, estructura, mapa_roles, actualizado_en)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [a.id, a.ceremonia_id, a.modificado_por, estructuraObj, mapaRolesObj, a.actualizado_en]
      );
    }
    console.log(`✔ Se migraron ${anfiteatro.length} configuraciones de anfiteatro.`);

    // ==========================================
    // TABLA 7: LOGS_AUDITORIA
    // ==========================================
    console.log('📝 Migrando logs de auditoría...');
    const logs = dbSqlite.prepare('SELECT * FROM logs_auditoria').all();
    for (const l of logs) {
      const valoresAnterioresObj = l.valores_anteriores ? JSON.parse(l.valores_anteriores) : null;
      const valoresNuevosObj = l.valores_nuevos ? JSON.parse(l.valores_nuevos) : null;

      await clientPostgres.query(
        `INSERT INTO logs_auditoria (id, usuario_id, accion, tabla_afectada, registro_afectado, valores_anteriores, valores_nuevos, ip_origen, fecha)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [l.id, l.usuario_id, l.accion, l.tabla_afectada, l.registro_afectado, valoresAnterioresObj, valoresNuevosObj, l.ip_origen, l.fecha]
      );
    }
    console.log(`✔ Se migraron ${logs.length} logs de auditoría.`);

    // ==========================================
    // TABLA 8: CONFIGURACION_SISTEMA
    // ==========================================
    console.log('⚙ Migrando configuración del sistema...');
    const config = dbSqlite.prepare('SELECT * FROM configuracion_sistema').all();
    for (const s of config) {
      await clientPostgres.query(
        `INSERT INTO configuracion_sistema (clave, valor, descripcion, actualizado_en)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, descripcion = EXCLUDED.descripcion, actualizado_en = EXCLUDED.actualizado_en`,
        [s.clave, s.valor, s.descripcion, s.actualizado_en]
      );
    }
    console.log(`✔ Se migraron ${config.length} configuraciones del sistema.`);

    // ¡Éxito total! Commiteamos los cambios
    await clientPostgres.query('COMMIT');
    console.log('🎉 --- ¡MIGRACIÓN COMPLETADA CON ÉXITO! ---');
    console.log('Todo se transfirió a Neon Postgres sin perder una sola línea.');

  } catch (error) {
    // Si algo falló, deshacemos todo lo que hicimos en Postgres
    await clientPostgres.query('ROLLBACK');
    console.error('✘ Error grave en la migración. Se aplicó ROLLBACK para no romper nada:', error);
  } finally {
    clientPostgres.release();
    dbSqlite.close();
    await poolPostgres.end();
  }
}

migrar();
