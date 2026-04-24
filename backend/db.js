const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbPath = path.resolve(__dirname, 'datos', 'sigic.db');

// Asegurar que el directorio de datos existe
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

// Configuración inicial de la base de datos
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Inicialización del Esquema (SQLite)
 */
function init() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios_sistema (
          id            TEXT         PRIMARY KEY,
          nombre        TEXT NOT NULL,
          email         TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          rol           TEXT  NOT NULL CHECK (rol IN ('ADMIN', 'PORTERIA')),
          activo        INTEGER      DEFAULT 1,
          ultimo_login  TEXT,
          creado_en     TEXT    DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS ceremonias (
          id            TEXT PRIMARY KEY,
          nombre        TEXT NOT NULL,
          fecha         TEXT NOT NULL,
          lugar         TEXT DEFAULT 'Sede Beltrán',
          max_invitados INTEGER DEFAULT 4,
          activa        INTEGER DEFAULT 0,
          creado_en     TEXT DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS egresados (
          id            TEXT         PRIMARY KEY,
          ceremonia_id  TEXT         REFERENCES ceremonias(id) ON DELETE CASCADE,
          registrado_por TEXT        REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
          token         TEXT  NOT NULL UNIQUE,
          nombre        TEXT         NOT NULL,
          legajo        TEXT  NOT NULL,
          dni           TEXT  NOT NULL,
          correo            TEXT,
          otp               TEXT,
          otp_expira        TEXT,
          asiento_id        TEXT,
          entregador_nombre TEXT,
          entregador_asiento_id TEXT,
          creado_en         TEXT    DEFAULT (datetime('now', 'localtime')),
          UNIQUE(dni, ceremonia_id)
      );

      CREATE TABLE IF NOT EXISTS otp_historial (
          id             INTEGER       PRIMARY KEY AUTOINCREMENT,
          egresado_id    TEXT         NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
          otp_hash       TEXT  NOT NULL,
          ip_origen      TEXT,
          resultado      TEXT  NOT NULL CHECK (resultado IN ('ENVIADO', 'VERIFICADO', 'FALLIDO', 'EXPIRADO')),
          solicitado_en  TEXT    DEFAULT (datetime('now', 'localtime')),
          verificado_en  TEXT
      );

      CREATE TABLE IF NOT EXISTS invitados (
          id             TEXT         PRIMARY KEY,
          egresado_id    TEXT         NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
          validado_por   TEXT         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
          nombre         TEXT         NOT NULL,
          dni            TEXT  NOT NULL,
          telefono       TEXT         NOT NULL,
          correo         TEXT,
          relacion       TEXT,
          asiento_id     TEXT,
          discapacidad   INTEGER      DEFAULT 0,
          presente       INTEGER      DEFAULT 0,
          fecha_presente TEXT,
          creado_en      TEXT    DEFAULT (datetime('now', 'localtime')),
          UNIQUE(dni, egresado_id)
      );

      CREATE TABLE IF NOT EXISTS configuracion_anfiteatro (
          id             INTEGER       PRIMARY KEY AUTOINCREMENT,
          ceremonia_id   TEXT         REFERENCES ceremonias(id) ON DELETE CASCADE,
          modificado_por TEXT         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
          estructura     TEXT        NOT NULL,
          mapa_roles     TEXT        NOT NULL,
          actualizado_en TEXT    DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS logs_auditoria (
          id                 INTEGER       PRIMARY KEY AUTOINCREMENT,
          usuario_id         TEXT         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
          accion             TEXT  NOT NULL,
          tabla_afectada     TEXT,
          registro_afectado  TEXT,
          valores_anteriores TEXT,
          valores_nuevos     TEXT,
          ip_origen          TEXT,
          fecha              TEXT    DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS configuracion_sistema (
          clave          TEXT PRIMARY KEY,
          valor          TEXT         NOT NULL,
          descripcion    TEXT,
          actualizado_en TEXT    DEFAULT (datetime('now', 'localtime'))
      );

      INSERT OR IGNORE INTO configuracion_sistema (clave, valor, descripcion) VALUES
        ('max_invitados_por_egresado', '4',                              'Máximo de acompañantes que puede registrar cada egresado'),
        ('nombre_evento',              'Ceremonia de Colación 2026',     'Nombre del evento que aparece en el sistema'),
        ('nombre_institucion',         'Instituto Tecnológico Beltrán',  'Nombre de la institución organizadora'),
        ('fecha_evento',               '2026-12-01',                     'Fecha prevista del evento (YYYY-MM-DD)'),
        ('lugar_evento',               'Sede Beltrán',                   'Lugar físico donde se realiza el evento'),
        ('portal_egresado_activo',     '1',                           'Habilita o deshabilita el acceso público del egresado'),
        ('registro_invitados_activo',  '1',                           'Permite o bloquea el registro de nuevos invitados');
    `);

    // Migración manual: Asegurar que egresados tenga asiento_id si ya existía la DB
    try {
      db.exec("ALTER TABLE egresados ADD COLUMN asiento_id TEXT;");
    } catch (e) {}
    
    try {
      db.exec("ALTER TABLE egresados ADD COLUMN ceremonia_id TEXT;");
    } catch (e) {}

    try {
      db.exec("ALTER TABLE egresados ADD COLUMN entregador_nombre TEXT;");
    } catch (e) {}

    try {
      db.exec("ALTER TABLE egresados ADD COLUMN entregador_asiento_id TEXT;");
    } catch (e) {}

    try {
      db.exec("ALTER TABLE invitados ADD COLUMN discapacidad INTEGER DEFAULT 0;");
    } catch (e) {}

    try {
      db.exec("ALTER TABLE configuracion_anfiteatro ADD COLUMN ceremonia_id TEXT REFERENCES ceremonias(id) ON DELETE CASCADE;");
    } catch (e) {}

    // Crear ceremonia por defecto si no hay ninguna
    const ceremoniasCount = db.prepare("SELECT COUNT(*) as total FROM ceremonias").get().total;
    if (ceremoniasCount === 0) {
      db.prepare(`
        INSERT INTO ceremonias (id, nombre, fecha, activa) 
        VALUES ('cer-001', 'Ceremonia de Colación 2026', '2026-12-15', 1)
      `).run();
    }

    // MIGRACIÓN: Eliminar UNIQUE global de DNI en egresados e invitados
    const tableInfo = db.prepare("PRAGMA table_info(egresados)").all();
    const hasDniUnique = db.prepare("PRAGMA index_list(egresados)").all().some(idx => idx.unique === 1 && idx.origin === 'u');
    
    // Si la tabla tiene el UNIQUE viejo, recreamos para aplicar el nuevo composite
    // Nota: better-sqlite3 no permite DROP CONSTRAINT, recrear es el estándar.
    try {
      const egresadoIndexes = db.prepare("PRAGMA index_list(egresados)").all();
      const needsMigration = egresadoIndexes.some(idx => idx.name.includes('dni') && !idx.name.includes('ceremonia'));
      
      if (needsMigration) {
        console.log("Migrando tabla egresados para permitir DNI en múltiples hábitats...");
        db.exec(`
          BEGIN TRANSACTION;
          ALTER TABLE egresados RENAME TO egresados_old;
          CREATE TABLE egresados (
            id TEXT PRIMARY KEY, ceremonia_id TEXT REFERENCES ceremonias(id) ON DELETE CASCADE,
            registrado_por TEXT REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
            token TEXT NOT NULL UNIQUE, nombre TEXT NOT NULL, legajo TEXT NOT NULL,
            dni TEXT NOT NULL, correo TEXT, otp TEXT, otp_expira TEXT, asiento_id TEXT,
            entregador_nombre TEXT, entregador_asiento_id TEXT, creado_en TEXT DEFAULT (datetime('now', 'localtime')),
            UNIQUE(dni, ceremonia_id)
          );
          INSERT INTO egresados (id, ceremonia_id, registrado_por, token, nombre, legajo, dni, correo, otp, otp_expira, asiento_id, entregador_nombre, entregador_asiento_id, creado_en)
          SELECT id, ceremonia_id, registrado_por, token, nombre, legajo, dni, correo, otp, otp_expira, asiento_id, entregador_nombre, entregador_asiento_id, creado_en FROM egresados_old;
          DROP TABLE egresados_old;
          COMMIT;
        `);
      }
      
      const invitadoIndexes = db.prepare("PRAGMA index_list(invitados)").all();
      if (invitadoIndexes.some(idx => idx.name.includes('dni') && !idx.name.includes('egresado'))) {
        console.log("Migrando tabla invitados para permitir DNI recurrente...");
        db.exec(`
          BEGIN TRANSACTION;
          ALTER TABLE invitados RENAME TO invitados_old;
          CREATE TABLE invitados (
            id TEXT PRIMARY KEY, egresado_id TEXT NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
            validado_por TEXT REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
            nombre TEXT NOT NULL, dni TEXT NOT NULL, telefono TEXT NOT NULL,
            correo TEXT, relacion TEXT, asiento_id TEXT, discapacidad INTEGER DEFAULT 0,
            presente INTEGER DEFAULT 0, fecha_presente TEXT, creado_en TEXT DEFAULT (datetime('now', 'localtime')),
            UNIQUE(dni, egresado_id)
          );
          INSERT INTO invitados SELECT * FROM invitados_old;
          DROP TABLE invitados_old;
          COMMIT;
        `);
      }
    } catch (err) {
      console.warn("Aviso de migración:", err.message);
    }

    console.log("✓ Base de datos SQLite inicializada correctamente.");
  } catch (e) {
    console.error("✘ Error al inicializar base de datos SQLite:", e);
    throw e;
  }
}

/**
 * Traductor de queries simple para compatibilidad PostgreSQL -> SQLite
 */
function translateSql(sql) {
  let translated = sql
    // Reemplazar $1, $2, etc por ?
    .replace(/\$\d+/g, '?')
    // Reemplazar casting ::text
    .replace(/::text/gi, '')
    // Reemplazar CURRENT_TIMESTAMP por datetime('now', 'localtime')
    .replace(/CURRENT_TIMESTAMP/gi, "datetime('now', 'localtime')")
    // Reemplazar Booleanos TRUE/FALSE (Postgres -> SQLite)
    .replace(/\bTRUE\b/gi, '1')
    .replace(/\bFALSE\b/gi, '0');

  return translated;
}

/**
 * Normaliza los parámetros para SQLite (convierte Date a String e ISO, Boolean a 0/1)
 */
function normalizeParam(val) {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

const query = (text, params = []) => {
  const sql = translateSql(text);
  const normalizedParams = params.map(normalizeParam);
  
  const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
  const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
  const hasReturning = sql.toUpperCase().includes('RETURNING');

  // Parche para las rutas que no envían ID y esperan que la DB lo genere
  if (isInsert && !sql.toLowerCase().includes('(id,') && !sql.toLowerCase().includes(' id,')) {
     const tableNameMatch = sql.match(/INSERT INTO\s+(\w+)/i);
     if (tableNameMatch) {
        const table = tableNameMatch[1].toLowerCase();
        if (['egresados', 'invitados', 'usuarios_sistema'].includes(table)) {
          const newSql = sql.replace(/(\(\s*)/, '(id, ').replace(/(VALUES\s*\(\s*)/i, '$1?, ');
          const newParams = [uuidv4(), ...normalizedParams];
          const stmt = db.prepare(newSql);
          // Si tiene RETURNING, usamos all()
          if (hasReturning) {
             const rows = stmt.all(newParams);
             return { rows, rowCount: rows.length };
          }
          const result = stmt.run(newParams);
          return { rows: [{ id: newParams[0] }], rowCount: 1 };
        }
     }
  }

  const stmt = db.prepare(sql);
  if (isSelect || hasReturning) {
    const rows = stmt.all(normalizedParams);
    return { rows, rowCount: rows.length };
  } else {
    const result = stmt.run(normalizedParams);
    return { 
      rows: result.lastInsertRowid ? [{ id: result.lastInsertRowid }] : [], 
      rowCount: result.changes 
    };
  }
};

const pool = {
  connect: async () => ({
    query: (text, params) => query(text, params),
    release: () => {}
  })
};

module.exports = {
  query,
  db,
  init,
  pool
};
