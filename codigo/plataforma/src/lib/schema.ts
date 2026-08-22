import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';

let inicializacion: Promise<void> | null = null;

const CEREMONIA_DEMO_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_DEMO_ID = '11111111-1111-4111-8111-111111111111';

/**
 * Crea y actualiza el esquema mínimo de SiGIC. El repositorio histórico
 * dependía de una base preexistente; mantener el DDL junto al código permite
 * levantar entornos nuevos (como la demo) sin pasos manuales.
 */
export function inicializarBaseDatos(): Promise<void> {
  if (!inicializacion) {
    inicializacion = ejecutarInicializacion().catch((error) => {
      inicializacion = null;
      throw error;
    });
  }
  return inicializacion;
}

async function ejecutarInicializacion() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('sigic-schema-v1'))");
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios_sistema (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL CHECK (rol IN ('SUPER_ADMIN','ADMINISTRATIVO','ADMIN','PORTERIA','AUDITOR')),
        activo INTEGER DEFAULT 1,
        ultimo_login TIMESTAMP,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS ceremonias (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        fecha VARCHAR(50) NOT NULL,
        lugar VARCHAR(150) DEFAULT 'Sede Beltrán',
        max_invitados INTEGER DEFAULT 4,
        max_entregadores INTEGER DEFAULT 3,
        activa INTEGER DEFAULT 0,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS egresados (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ceremonia_id VARCHAR(50) REFERENCES ceremonias(id) ON DELETE CASCADE,
        registrado_por UUID REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
        token VARCHAR(10) NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        legajo VARCHAR(50) NOT NULL,
        dni VARCHAR(20) NOT NULL,
        correo TEXT,
        carrera TEXT,
        anio_inscripcion INTEGER,
        otp VARCHAR(6),
        otp_expira TIMESTAMP,
        asiento_id VARCHAR(30),
        entregador_nombre TEXT,
        entregador_asiento_id VARCHAR(30),
        telefono TEXT,
        estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','ACEPTADO','RECHAZADO')),
        promedio NUMERIC(5,2),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS otp_historial (
        id SERIAL PRIMARY KEY,
        egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
        otp_hash VARCHAR(64) NOT NULL,
        ip_origen VARCHAR(120),
        resultado VARCHAR(32) NOT NULL,
        solicitado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verificado_en TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS invitados (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
        validado_por UUID REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
        nombre TEXT NOT NULL,
        dni VARCHAR(20) NOT NULL,
        telefono TEXT NOT NULL,
        correo TEXT,
        relacion TEXT,
        asiento_id VARCHAR(30),
        discapacidad INTEGER DEFAULT 0,
        presente BOOLEAN DEFAULT FALSE,
        fecha_presente TIMESTAMP,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (dni, egresado_id)
      );
      CREATE TABLE IF NOT EXISTS configuracion_anfiteatro (
        id SERIAL PRIMARY KEY,
        ceremonia_id VARCHAR(50) REFERENCES ceremonias(id) ON DELETE CASCADE,
        modificado_por UUID REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
        estructura JSONB NOT NULL,
        mapa_roles JSONB NOT NULL,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS logs_auditoria (
        id SERIAL PRIMARY KEY,
        usuario_id UUID REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
        accion VARCHAR(50) NOT NULL,
        tabla_afectada VARCHAR(50),
        registro_afectado UUID,
        valores_anteriores JSONB,
        valores_nuevos JSONB,
        ip_origen VARCHAR(120),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS configuracion_sistema (
        clave VARCHAR(100) PRIMARY KEY,
        valor TEXT NOT NULL,
        descripcion TEXT,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS profesores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre TEXT NOT NULL,
        dni VARCHAR(20),
        materia TEXT,
        activo INTEGER DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS entregadores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PROFESOR','FAMILIAR')),
        profesor_id UUID REFERENCES profesores(id) ON DELETE SET NULL,
        invitado_id UUID REFERENCES invitados(id) ON DELETE SET NULL,
        nombre TEXT NOT NULL,
        orden INTEGER NOT NULL DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (egresado_id, orden)
      );
      CREATE TABLE IF NOT EXISTS ceremonias_usuarios_autorizados (
        ceremonia_id VARCHAR(50) NOT NULL,
        usuario_id VARCHAR(50) NOT NULL,
        PRIMARY KEY (ceremonia_id, usuario_id)
      );
      CREATE TABLE IF NOT EXISTS dispositivos_moviles (
        dispositivo_id VARCHAR(100) PRIMARY KEY,
        usuario_id VARCHAR(100) NOT NULL,
        marca VARCHAR(100), fabricante VARCHAR(120), modelo VARCHAR(160),
        nombre_dispositivo VARCHAR(160), sistema VARCHAR(80), version_sistema VARCHAR(80),
        tipo_dispositivo VARCHAR(40), version_app VARCHAR(40), es_dispositivo_real SMALLINT DEFAULT 1,
        ip_ultimo_acceso VARCHAR(120), agente_usuario VARCHAR(300),
        primera_conexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP, sesion_activa SMALLINT DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_egresados_token ON egresados(token);
      CREATE INDEX IF NOT EXISTS idx_egresados_correo ON egresados(correo);
      CREATE INDEX IF NOT EXISTS idx_invitados_egresado ON invitados(egresado_id);
      CREATE INDEX IF NOT EXISTS idx_invitados_presente ON invitados(presente);
      CREATE INDEX IF NOT EXISTS idx_otp_egresado ON otp_historial(egresado_id);
      CREATE INDEX IF NOT EXISTS idx_entregadores_egresado ON entregadores(egresado_id);
      CREATE INDEX IF NOT EXISTS dispositivos_moviles_usuario_idx ON dispositivos_moviles(usuario_id);
      CREATE UNIQUE INDEX IF NOT EXISTS egresados_inscripcion_ceremonia_key
        ON egresados (ceremonia_id, UPPER(COALESCE(legajo, '')), UPPER(COALESCE(carrera, '')), COALESCE(anio_inscripcion, 0));
    `);

    // Instalaciones históricas guardaban la asistencia como 0/1. Flutter y
    // PostgreSQL trabajan mejor con un booleano real; la migración conserva
    // todos los valores existentes y es idempotente.
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'invitados'
            AND column_name = 'presente' AND data_type <> 'boolean'
        ) THEN
          ALTER TABLE invitados ALTER COLUMN presente DROP DEFAULT;
          ALTER TABLE invitados ALTER COLUMN presente TYPE BOOLEAN
            USING (COALESCE(presente::text, '0') IN ('1', 'true', 't'));
          ALTER TABLE invitados ALTER COLUMN presente SET DEFAULT FALSE;
        END IF;
      END $$;
    `);

    await client.query(`
      INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
        ('max_invitados_por_egresado','4','Máximo de acompañantes por egresado'),
        ('nombre_institucion','Instituto Tecnológico Beltrán','Institución organizadora'),
        ('portal_egresado_activo','true','Acceso público del egresado'),
        ('registro_invitados_activo','true','Registro de invitados'),
        ('setup_inicial_completado','0','Estado del asistente inicial')
      ON CONFLICT (clave) DO NOTHING
    `);

    if (process.env.DEMO_MODE === 'true') {
      await sembrarDemo(client);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function sembrarDemo(client: Awaited<ReturnType<typeof pool.connect>>) {
  const hash = await bcrypt.hash('Demo1234', 12);
  await client.query(
    `INSERT INTO usuarios_sistema (id,nombre,email,password_hash,rol,activo)
     VALUES ($1,'Administración Demo','admin@demo.com',$2,'SUPER_ADMIN',1)
     ON CONFLICT (email) DO NOTHING`,
    [ADMIN_DEMO_ID, hash]
  );
  await client.query(
    `INSERT INTO ceremonias (id,nombre,fecha,lugar,max_invitados,max_entregadores,activa)
     VALUES ($1,'Ceremonia Demo SiGIC 2026','2026-12-01','Auditorio Instituto Beltrán',4,3,1)
     ON CONFLICT (id) DO UPDATE SET activa=1`,
    [CEREMONIA_DEMO_ID]
  );
  await client.query(
    `INSERT INTO profesores (id,nombre,dni,materia) VALUES
      ('33333333-3333-4333-8333-333333333331','Laura Fernández','20111222','Proyecto Final'),
      ('33333333-3333-4333-8333-333333333332','Martín González','22333444','Programación')
     ON CONFLICT (id) DO NOTHING`
  );
  await client.query(
    `INSERT INTO egresados (id,ceremonia_id,token,nombre,legajo,dni,correo,carrera,anio_inscripcion,estado,promedio,asiento_id) VALUES
      ('44444444-4444-4444-8444-444444444441',$1,'DEMO0001','Julieta Pérez','SIG-001','40111222','julieta.demo@sigic.com.ar','Analista de Sistemas',2023,'ACEPTADO',9.10,'baja-A-1'),
      ('44444444-4444-4444-8444-444444444442',$1,'DEMO0002','Tomás Rodríguez','SIG-002','41222333','tomas.demo@sigic.com.ar','Analista de Sistemas',2023,'ACEPTADO',8.45,'baja-A-2'),
      ('44444444-4444-4444-8444-444444444443',$1,'DEMO0003','Sofía Martínez','SIG-003','42333444','sofia.demo@sigic.com.ar','Desarrollo de Software',2024,'PENDIENTE',9.35,NULL),
      ('44444444-4444-4444-8444-444444444444',$1,'DEMO0004','Mateo López','SIG-004','43444555','mateo.demo@sigic.com.ar','Desarrollo de Software',2024,'ACEPTADO',7.90,'baja-A-3')
     ON CONFLICT (id) DO NOTHING`,
    [CEREMONIA_DEMO_ID]
  );
  await client.query(
    `INSERT INTO invitados (id,egresado_id,nombre,dni,telefono,correo,relacion,asiento_id,presente,fecha_presente) VALUES
      ('55555555-5555-4555-8555-555555555551','44444444-4444-4444-8444-444444444441','Carlos Pérez','25111222','11 5555-1001','carlos.demo@sigic.com.ar','Padre','baja-B-1',TRUE,CURRENT_TIMESTAMP - INTERVAL '12 minutes'),
      ('55555555-5555-4555-8555-555555555552','44444444-4444-4444-8444-444444444441','Ana Gómez','27222333','11 5555-1002','ana.demo@sigic.com.ar','Madre','baja-B-2',FALSE,NULL),
      ('55555555-5555-4555-8555-555555555553','44444444-4444-4444-8444-444444444442','Lucía Rodríguez','28333444','11 5555-1003','lucia.demo@sigic.com.ar','Hermana','baja-B-3',TRUE,CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
      ('55555555-5555-4555-8555-555555555554','44444444-4444-4444-8444-444444444444','Valentina López','29444555','11 5555-1004','valentina.demo@sigic.com.ar','Madre','baja-B-4',FALSE,NULL)
     ON CONFLICT (id) DO NOTHING`
  );
  await client.query(
    `INSERT INTO entregadores (id,egresado_id,tipo,profesor_id,nombre,orden) VALUES
      ('66666666-6666-4666-8666-666666666661','44444444-4444-4444-8444-444444444441','PROFESOR','33333333-3333-4333-8333-333333333331','Laura Fernández',1),
      ('66666666-6666-4666-8666-666666666662','44444444-4444-4444-8444-444444444442','PROFESOR','33333333-3333-4333-8333-333333333332','Martín González',1)
     ON CONFLICT (id) DO NOTHING`
  );
  await client.query(
    `INSERT INTO configuracion_sistema (clave,valor,descripcion) VALUES
      ('setup_inicial_completado','1','Demo inicializada'),
      ('nombre_evento','Ceremonia Demo SiGIC 2026','Nombre visible'),
      ('fecha_evento','2026-12-01','Fecha visible'),
      ('lugar_evento','Auditorio Instituto Beltrán','Lugar visible'),
      ('mostrar_presentacion_inicial','true','Presentación institucional')
     ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor, actualizado_en=CURRENT_TIMESTAMP`
  );
}
