-- ============================================================
-- ESQUEMA DE BASE DE DATOS — SiGIC 2026 (PostgreSQL)
-- Instituto Tecnológico Beltrán
-- Versión: 2.0 — Con auditoría completa y historial OTP
-- ============================================================

-- Extensión para generación de UUIDs automáticos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA 1: USUARIOS DEL SISTEMA
-- Almacena administradores y personal de portería.
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol           VARCHAR(20)  NOT NULL CHECK (rol IN ('ADMIN', 'PORTERIA')),
    activo        BOOLEAN      DEFAULT TRUE,
    ultimo_login  TIMESTAMP,
    creado_en     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 2: EGRESADOS
-- Participantes de la graduación. Acceden sin contraseña (OTP/Token).
-- ============================================================
CREATE TABLE IF NOT EXISTS egresados (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    registrado_por UUID        REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    token         VARCHAR(10)  NOT NULL UNIQUE,
    nombre        TEXT         NOT NULL,
    legajo        VARCHAR(50)  NOT NULL,
    dni           VARCHAR(20)  NOT NULL UNIQUE,
    correo        TEXT,
    -- OTP: almacenamiento TEMPORAL — se limpia al verificar
    otp           VARCHAR(6),
    otp_expira    TIMESTAMP,
    creado_en     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 3: OTP_HISTORIAL
-- Registro permanente de todos los intentos de autenticación.
-- El OTP nunca se guarda en texto plano — solo su hash SHA-256.
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_historial (
    id             SERIAL       PRIMARY KEY,
    egresado_id    UUID         NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    otp_hash       VARCHAR(64)  NOT NULL, -- SHA-256 del código original
    ip_origen      VARCHAR(45),           -- IPv4 o IPv6 del cliente
    resultado      VARCHAR(20)  NOT NULL
                   CHECK (resultado IN ('ENVIADO', 'VERIFICADO', 'FALLIDO', 'EXPIRADO')),
    solicitado_en  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    verificado_en  TIMESTAMP                -- NULL hasta que se verifica exitosamente
);

-- ============================================================
-- TABLA 4: INVITADOS
-- Acompañantes registrados por el egresado. El ID es el contenido del QR.
-- ============================================================
CREATE TABLE IF NOT EXISTS invitados (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    egresado_id    UUID         NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    validado_por   UUID         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    nombre         TEXT         NOT NULL,
    dni            VARCHAR(20)  NOT NULL UNIQUE, -- Único por evento
    telefono       TEXT         NOT NULL,
    correo         TEXT,
    relacion       TEXT,        -- Padre, Madre, Amigo, etc.
    asiento_id     VARCHAR(30), -- Ej: "baja-A-3"
    presente       BOOLEAN      DEFAULT FALSE,
    fecha_presente TIMESTAMP,   -- Hora exacta de check-in
    creado_en      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 5: CONFIGURACION_ANFITEATRO
-- Guarda la estructura y los roles del mapa del anfiteatro.
-- Usa JSONB para máxima flexibilidad sin cambiar el schema.
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion_anfiteatro (
    id             SERIAL       PRIMARY KEY,
    modificado_por UUID         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    estructura     JSONB        NOT NULL,
    -- Ejemplo: {"baja":{"filas":5,"asientos":6},"alta":{"filas":4,"asientos":8}}
    mapa_roles     JSONB        NOT NULL,
    -- Ejemplo: {"baja-A-1":"autoridad","baja-C-1":"egresado"}
    actualizado_en TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 6: LOGS_AUDITORIA
-- Registro permanente de acciones críticas del sistema.
-- ============================================================
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id                 SERIAL       PRIMARY KEY,
    usuario_id         UUID         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    accion             VARCHAR(50)  NOT NULL,
    -- Valores: CREAR_EGRESADO, ELIMINAR_EGRESADO, CHECK_IN, MODIFICAR_ANFITEATRO, etc.
    tabla_afectada     VARCHAR(50),
    registro_afectado  UUID,        -- ID del registro modificado
    valores_anteriores JSONB,       -- Estado ANTES del cambio
    valores_nuevos     JSONB,       -- Estado DESPUÉS del cambio
    ip_origen          VARCHAR(45),
    fecha              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ÍNDICES para mejorar rendimiento en consultas frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_egresados_token  ON egresados(token);
CREATE INDEX IF NOT EXISTS idx_egresados_correo ON egresados(correo);
CREATE INDEX IF NOT EXISTS idx_invitados_egresado ON invitados(egresado_id);
CREATE INDEX IF NOT EXISTS idx_invitados_presente ON invitados(presente);
CREATE INDEX IF NOT EXISTS idx_otp_egresado ON otp_historial(egresado_id);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs_auditoria(fecha);

-- ============================================================
-- TABLA 7: CONFIGURACION_SISTEMA
-- Almacena todos los parámetros ajustables de la plataforma.
-- Solo los administradores pueden modificarla vía Panel de Ajustes.
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave          VARCHAR(100) PRIMARY KEY,
    valor          TEXT         NOT NULL,
    descripcion    TEXT,
    actualizado_en TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Inserción de valores por defecto (solo si no existen)
INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
  ('max_invitados_por_egresado', '4',                              'Máximo de acompañantes que puede registrar cada egresado'),
  ('nombre_evento',              'Ceremonia de Colación 2026',     'Nombre del evento que aparece en el sistema'),
  ('nombre_institucion',         'Instituto Tecnológico Beltrán',  'Nombre de la institución organizadora'),
  ('fecha_evento',               '2026-12-01',                     'Fecha prevista del evento (YYYY-MM-DD)'),
  ('lugar_evento',               'Sede Beltrán',                   'Lugar físico donde se realiza el evento'),
  ('portal_egresado_activo',     'true',                           'Habilita o deshabilita el acceso público del egresado'),
  ('registro_invitados_activo',  'true',                           'Permite o bloquea el registro de nuevos invitados')
ON CONFLICT (clave) DO NOTHING;
