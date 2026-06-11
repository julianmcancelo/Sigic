const { Pool, types } = require('pg');

// Configuración de parsers de tipo para pg (PostgreSQL)
// El OID 1114 representa el tipo TIMESTAMP sin zona horaria en PostgreSQL.
// Por defecto, pg lo interpreta en el huso horario local de la máquina de Node.
// Forzamos a interpretarlo siempre como UTC, ya que los guardamos con toISOString().
types.setTypeParser(1114, function(stringValue) {
  if (!stringValue) return null;
  // Reemplazamos el espacio entre fecha y hora por 'T' y añadimos la 'Z' de UTC
  const formateado = stringValue.replace(' ', 'T') + (stringValue.includes('Z') || stringValue.includes('+') ? '' : 'Z');
  return new Date(formateado);
});
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbPath = path.resolve(__dirname, 'datos', 'sigic.db');

let pool = null;
let db = null;
let mode = 'sqlite';

// ============================================================
// CONEXIÓN DINÁMICA: PostgreSQL (Neon) o SQLite (Local)
// ============================================================
if (process.env.DATABASE_URL) {
  // Modo PostgreSQL (Producción / Nube en Neon)
  console.log('🔌 Conectando a PostgreSQL (Neon Cloud)...');
  // Verificamos el certificado TLS del servidor (Neon usa certificados de CA
  // pública, así que la verificación estricta funciona). Solo si una red
  // intermedia rompe la cadena se puede definir DB_SSL_INSECURE=1 como
  // escape temporal, asumiendo el riesgo de interceptación.
  const sslInseguro = process.env.DB_SSL_INSECURE === '1';
  if (sslInseguro) {
    console.warn('⚠ DB_SSL_INSECURE=1: la verificación del certificado de la base está DESACTIVADA.');
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: !sslInseguro
    }
  });
  mode = 'postgres';
} else {
  // Modo SQLite (Local / Desarrollo Offline)
  console.log('🔌 Conectando a SQLite local (datos/sigic.db)...');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  mode = 'sqlite';
}

/**
 * Inicialización de Base de Datos
 * Si es Postgres, verifica si las tablas existen; si no, ejecuta schema.sql automáticamente.
 * Si es SQLite, corre los scripts originales y recrea tablas si es necesario.
 */
async function init() {
  if (mode === 'postgres') {
    try {
      const client = await pool.connect();
      try {
        console.log('🔍 Validando esquema existente en PostgreSQL (Neon)...');
        
        // Verificamos si la tabla usuarios_sistema ya existe
        const res = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'usuarios_sistema'
          );
        `);
        const schemaExists = res.rows[0].exists;

        if (!schemaExists) {
          console.log('⚡ Base de datos vacía. Creando tablas en PostgreSQL usando schema.sql...');
          const schemaPath = path.resolve(__dirname, 'datos', 'schema.sql');
          if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await client.query(schemaSql);
            console.log('✓ Esquema PostgreSQL creado con éxito en Neon.');
          } else {
            console.warn('⚠ Alerta: No se encontró el archivo datos/schema.sql para inicializar PostgreSQL.');
          }
        } else {
          console.log('✓ Base de datos PostgreSQL ya tiene su esquema de tablas inicializado.');

          // Parches de migración para Postgres existente
          try {
            await client.query(`
              DO $$
              BEGIN
                IF EXISTS (
                  SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_sistema_rol_check'
                ) THEN
                  ALTER TABLE usuarios_sistema DROP CONSTRAINT usuarios_sistema_rol_check;
                END IF;
              END
              $$;
            `);
          } catch(e) {}
          try {
            await client.query(`
              ALTER TABLE usuarios_sistema
              ADD CONSTRAINT usuarios_sistema_rol_check
              CHECK (rol IN ('SUPER_ADMIN', 'ADMINISTRATIVO', 'ADMIN', 'PORTERIA', 'AUDITOR'));
            `);
          } catch(e) {}
          try { await client.query("ALTER TABLE egresados ADD COLUMN IF NOT EXISTS telefono TEXT;"); } catch(e) {}
          try { await client.query("ALTER TABLE egresados ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'PENDIENTE';"); } catch(e) {}
          try { await client.query("ALTER TABLE egresados ADD COLUMN IF NOT EXISTS promedio NUMERIC(5,2);"); } catch(e) {}
          try { await client.query("ALTER TABLE egresados ADD COLUMN IF NOT EXISTS carrera TEXT;"); } catch(e) {}
          try { await client.query("ALTER TABLE egresados ADD COLUMN IF NOT EXISTS anio_inscripcion INTEGER;"); } catch(e) {}
          try { await client.query("ALTER TABLE ceremonias ADD COLUMN IF NOT EXISTS max_entregadores INTEGER DEFAULT 3;"); } catch(e) {}
          try {
            await client.query(`
              INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
                ('formato_identificador', '{CARRERA}-{LEGAJO}-{AÑO}', 'Formato del identificador del graduado'),
                ('campos_identificador', 'carrera,legajo,anio_inscripcion', 'Campos activos para la identificación del graduado')
              ON CONFLICT (clave) DO NOTHING;
            `);
          } catch(e) {}

          // Creo tablas nuevas si no existen en Postgres existente
          await client.query(`
            CREATE TABLE IF NOT EXISTS profesores (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              nombre TEXT NOT NULL,
              dni VARCHAR(20),
              materia TEXT,
              activo INTEGER DEFAULT 1,
              creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `);
          await client.query(`
            CREATE TABLE IF NOT EXISTS entregadores (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
              tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PROFESOR', 'FAMILIAR')),
              profesor_id UUID REFERENCES profesores(id) ON DELETE SET NULL,
              invitado_id UUID REFERENCES invitados(id) ON DELETE SET NULL,
              nombre TEXT NOT NULL,
              orden INTEGER NOT NULL DEFAULT 1,
              creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(egresado_id, orden)
            );
          `);
        }
      } finally {
        client.release();
      }
    } catch (e) {
      console.error('✘ Error grave al inicializar PostgreSQL en Neon:', e);
      throw e;
    }
  } else {
    // ============================================================
    // INICIALIZACIÓN ORIGINAL DE SQLITE (COMPATIBILIDAD)
    // ============================================================
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios_sistema (
            id            TEXT         PRIMARY KEY,
            nombre        TEXT NOT NULL,
            email         TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            rol           TEXT  NOT NULL CHECK (rol IN ('SUPER_ADMIN', 'ADMINISTRATIVO', 'ADMIN', 'PORTERIA', 'AUDITOR')),
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
            max_entregadores INTEGER DEFAULT 3,
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
            telefono          TEXT,
            estado            TEXT DEFAULT 'PENDIENTE',
            promedio          REAL,
            carrera           TEXT,
            anio_inscripcion  INTEGER,
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

        CREATE TABLE IF NOT EXISTS profesores (
            id            TEXT PRIMARY KEY,
            nombre        TEXT NOT NULL,
            dni           TEXT,
            materia       TEXT,
            activo        INTEGER DEFAULT 1,
            creado_en     TEXT DEFAULT (datetime('now', 'localtime'))
        );

        CREATE TABLE IF NOT EXISTS entregadores (
            id            TEXT PRIMARY KEY,
            egresado_id   TEXT NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
            tipo          TEXT NOT NULL CHECK (tipo IN ('PROFESOR', 'FAMILIAR')),
            profesor_id   TEXT REFERENCES profesores(id) ON DELETE SET NULL,
            invitado_id   TEXT REFERENCES invitados(id) ON DELETE SET NULL,
            nombre        TEXT NOT NULL,
            orden         INTEGER NOT NULL DEFAULT 1,
            creado_en     TEXT DEFAULT (datetime('now', 'localtime')),
            UNIQUE(egresado_id, orden)
        );

        INSERT OR IGNORE INTO configuracion_sistema (clave, valor, descripcion) VALUES
          ('max_invitados_por_egresado', '4',                              'Máximo de acompañantes que puede registrar cada egresado'),
          ('nombre_evento',              'Ceremonia de Colación 2026',     'Nombre del evento que aparece en el sistema'),
          ('nombre_institucion',         'Instituto Tecnológico Beltrán',  'Nombre de la institución organizadora'),
          ('fecha_evento',               '2026-12-01',                     'Fecha prevista del evento (YYYY-MM-DD)'),
          ('lugar_evento',               'Sede Beltrán',                   'Lugar físico donde se realiza el evento'),
          ('portal_egresado_activo',     '1',                           'Habilita o deshabilita el acceso público del egresado'),
          ('registro_invitados_activo',  '1',                           'Permite o bloquea el registro de nuevos invitados'),
          ('formato_identificador',      '{CARRERA}-{LEGAJO}-{AÑO}',       'Formato del identificador del graduado'),
          ('campos_identificador',       'carrera,legajo,anio_inscripcion','Campos activos para la identificación del graduado');
      `);

      // Parches de migración para SQLite local
      // Si la tabla de usuarios fue creada con la lista vieja de roles,
      // la reconstruimos para admitir SUPER_ADMIN, ADMINISTRATIVO y AUDITOR.
      try {
        const defUsuarios = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'usuarios_sistema'").get();
        if (defUsuarios && !defUsuarios.sql.includes('SUPER_ADMIN')) {
          console.log('Migrando tabla usuarios_sistema local (SQLite) para nuevos roles...');
          // Patrón seguro de SQLite: crear tabla nueva, copiar, eliminar la
          // vieja y renombrar. Nunca se renombra la tabla referenciada para
          // no reescribir las claves foráneas de las demás tablas.
          db.pragma('foreign_keys = OFF');
          db.exec(`
            BEGIN TRANSACTION;
            CREATE TABLE usuarios_sistema_nueva (
                id            TEXT         PRIMARY KEY,
                nombre        TEXT NOT NULL,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                rol           TEXT  NOT NULL CHECK (rol IN ('SUPER_ADMIN', 'ADMINISTRATIVO', 'ADMIN', 'PORTERIA', 'AUDITOR')),
                activo        INTEGER      DEFAULT 1,
                ultimo_login  TEXT,
                creado_en     TEXT    DEFAULT (datetime('now', 'localtime'))
            );
            INSERT INTO usuarios_sistema_nueva (id, nombre, email, password_hash, rol, activo, ultimo_login, creado_en)
            SELECT id, nombre, email, password_hash, rol, activo, ultimo_login, creado_en FROM usuarios_sistema;
            DROP TABLE usuarios_sistema;
            ALTER TABLE usuarios_sistema_nueva RENAME TO usuarios_sistema;
            COMMIT;
          `);
          db.pragma('foreign_keys = ON');
        }
      } catch (e) {
        console.warn('Aviso de migración de usuarios local:', e.message);
      }
      try { db.exec("ALTER TABLE egresados ADD COLUMN asiento_id TEXT;"); } catch (e) {}
      try { db.exec("ALTER TABLE egresados ADD COLUMN ceremonia_id TEXT;"); } catch (e) {}
      try { db.exec("ALTER TABLE egresados ADD COLUMN entregador_nombre TEXT;"); } catch (e) {}
      try { db.exec("ALTER TABLE egresados ADD COLUMN entregador_asiento_id TEXT;"); } catch (e) {}
      try { db.exec("ALTER TABLE invitados ADD COLUMN discapacidad INTEGER DEFAULT 0;"); } catch (e) {}
      try { db.exec("ALTER TABLE configuracion_anfiteatro ADD COLUMN ceremonia_id TEXT REFERENCES ceremonias(id) ON DELETE CASCADE;"); } catch (e) {}
      try { db.exec("ALTER TABLE egresados ADD COLUMN telefono TEXT;"); } catch (e) {}
      try { db.exec("ALTER TABLE egresados ADD COLUMN estado TEXT DEFAULT 'PENDIENTE';"); } catch (e) {}
      try { db.exec("ALTER TABLE egresados ADD COLUMN promedio REAL;"); } catch (e) {}
      try { db.exec("ALTER TABLE egresados ADD COLUMN carrera TEXT;"); } catch (e) {}
      try { db.exec("ALTER TABLE egresados ADD COLUMN anio_inscripcion INTEGER;"); } catch (e) {}
      try { db.exec("ALTER TABLE ceremonias ADD COLUMN max_entregadores INTEGER DEFAULT 3;"); } catch (e) {}
      try {
        db.exec(`
          INSERT OR IGNORE INTO configuracion_sistema (clave, valor, descripcion) VALUES
            ('formato_identificador', '{CARRERA}-{LEGAJO}-{AÑO}', 'Formato del identificador del graduado'),
            ('campos_identificador', 'carrera,legajo,anio_inscripcion', 'Campos activos para la identificación del graduado');
        `);
      } catch (e) {}

      const ceremoniasCount = db.prepare("SELECT COUNT(*) as total FROM ceremonias").get().total;
      if (ceremoniasCount === 0) {
        db.prepare(`
          INSERT INTO ceremonias (id, nombre, fecha, activa) 
          VALUES ('cer-001', 'Ceremonia de Colación 2026', '2026-12-15', 1)
        `).run();
      }

      // Migraciones de UNIQUE compuesta en SQLite
      try {
        const egresadoIndexes = db.prepare("PRAGMA index_list(egresados)").all();
        const needsMigration = egresadoIndexes.some(idx => idx.name.includes('dni') && !idx.name.includes('ceremonia'));
        
        if (needsMigration) {
          console.log("Migrando tabla egresados local (SQLite) para DNI compuesto...");
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
          console.log("Migrando tabla invitados local (SQLite) para DNI único por egresado...");
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
        console.warn("Aviso de migración local:", err.message);
      }

      console.log("✓ Base de datos SQLite local inicializada correctamente.");
    } catch (e) {
      console.error("✘ Error al inicializar base de datos SQLite local:", e);
      throw e;
    }
  }
}

/**
 * Traductor simple de SQL PostgreSQL -> SQLite
 */
function translateSql(sql) {
  let translated = sql
    .replace(/\$\d+/g, '?') // Convierte $1, $2 en ?
    .replace(/::(text|int|integer|bigint|numeric|real)/gi, '') // Quita castings de tipo de Postgres
    .replace(/CURRENT_TIMESTAMP/gi, "datetime('now', 'localtime')")
    .replace(/\bTRUE\b/gi, '1')
    .replace(/\bFALSE\b/gi, '0');

  return translated;
}

/**
 * Adapta los tipos de datos para SQLite local (fechas y booleanos)
 */
function normalizeParam(val) {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

/**
 * Orquestador principal de queries.
 * Redirige la consulta directamente a PostgreSQL si está conectado,
 * o aplica la traducción compatible en SQLite.
 */
const query = async (text, params = []) => {
  if (mode === 'postgres') {
    // Si estamos en Postgres, ejecutamos de forma nativa e ideal
    const res = await pool.query(text, params);
    return res;
  } else {
    // Si estamos en SQLite local, aplicamos compatibilidad hacia atrás
    const sql = translateSql(text);
    const normalizedParams = params.map(normalizeParam);
    
    const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    const hasReturning = sql.toUpperCase().includes('RETURNING');

    // Auto-generación de IDs UUID en SQLite local si no se provee
    if (isInsert && !sql.toLowerCase().includes('(id,') && !sql.toLowerCase().includes(' id,')) {
       const tableNameMatch = sql.match(/INSERT INTO\s+(\w+)/i);
       if (tableNameMatch) {
          const table = tableNameMatch[1].toLowerCase();
          if (['egresados', 'invitados', 'usuarios_sistema', 'profesores', 'entregadores'].includes(table)) {
            const newSql = sql.replace(/(\(\s*)/, '(id, ').replace(/(VALUES\s*\(\s*)/i, '$1?, ');
            const newParams = [uuidv4(), ...normalizedParams];
            const stmt = db.prepare(newSql);
            if (hasReturning) {
               const rows = stmt.all(newParams);
               return { rows, rowCount: rows.length };
            }
            stmt.run(newParams);
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
  }
};

module.exports = {
  query,
  db,
  init,
  pool: mode === 'postgres' ? pool : {
    connect: async () => ({
      query: (text, params) => query(text, params),
      release: () => {}
    })
  }
};
