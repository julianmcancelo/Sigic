-- ============================================================
-- ESQUEMA DE BASE DE DATOS — SiGIC 2026 (PostgreSQL)
-- Instituto Tecnológico Beltrán
-- Versión: 3.0 — Esquema definitivo alineado con SQLite local
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
    rol           VARCHAR(20)  NOT NULL CHECK (rol IN ('SUPER_ADMIN', 'ADMINISTRATIVO', 'ADMIN', 'PORTERIA', 'AUDITOR')),
    activo        INTEGER      DEFAULT 1, -- Usamos INTEGER para compatibilidad de booleanos 1/0
    ultimo_login  TIMESTAMP,
    creado_en     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 2: CEREMONIAS (HÁBITATS)
-- Representa las diferentes ceremonias de colación gestionadas.
-- ============================================================
CREATE TABLE IF NOT EXISTS ceremonias (
    id            VARCHAR(50)  PRIMARY KEY,
    nombre        VARCHAR(150) NOT NULL,
    fecha         VARCHAR(50)  NOT NULL,
    lugar         VARCHAR(150) DEFAULT 'Sede Beltrán',
    max_invitados INTEGER      DEFAULT 4,
    max_entregadores INTEGER   DEFAULT 3,
    activa        INTEGER      DEFAULT 0, -- 1 = Activa, 0 = Inactiva
    creado_en     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 3: EGRESADOS
-- Participantes de la graduación. Acceden sin contraseña (OTP/Token).
-- ============================================================
CREATE TABLE IF NOT EXISTS egresados (
    id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    ceremonia_id          VARCHAR(50)  REFERENCES ceremonias(id) ON DELETE CASCADE,
    registrado_por        UUID         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    token                 VARCHAR(10)  NOT NULL UNIQUE,
    nombre                TEXT         NOT NULL,
    legajo                VARCHAR(50)  NOT NULL,
    dni                   VARCHAR(20)  NOT NULL,
    correo                TEXT,
    otp                   VARCHAR(6),
    otp_expira            TIMESTAMP,
    asiento_id            VARCHAR(30),
    entregador_nombre     TEXT,
    entregador_asiento_id VARCHAR(30),
    telefono              TEXT,
    estado                VARCHAR(20)  DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ACEPTADO', 'RECHAZADO')),
    promedio              NUMERIC(5,2),
    creado_en             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dni, ceremonia_id)
);

-- ============================================================
-- TABLA 4: OTP_HISTORIAL
-- Registro permanente de todos los intentos de autenticación.
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_historial (
    id             SERIAL       PRIMARY KEY,
    egresado_id    UUID         NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    otp_hash       VARCHAR(64)  NOT NULL, -- Hash SHA-256 del OTP
    ip_origen      VARCHAR(45),
    resultado      VARCHAR(20)  NOT NULL CHECK (resultado IN ('ENVIADO', 'VERIFICADO', 'FALLIDO', 'EXPIRADO')),
    solicitado_en  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    verificado_en  TIMESTAMP
);

-- ============================================================
-- TABLA 5: INVITADOS
-- Acompañantes registrados por el egresado. El ID es el del código QR.
-- ============================================================
CREATE TABLE IF NOT EXISTS invitados (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    egresado_id    UUID         NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    validado_por   UUID         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    nombre         TEXT         NOT NULL,
    dni            VARCHAR(20)  NOT NULL,
    telefono       TEXT         NOT NULL,
    correo         TEXT,
    relacion       TEXT,
    asiento_id     VARCHAR(30),
    discapacidad   INTEGER      DEFAULT 0, -- 1 = Sí, 0 = No
    presente       INTEGER      DEFAULT 0, -- 1 = Presente, 0 = Ausente
    fecha_presente TIMESTAMP,
    creado_en      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dni, egresado_id)
);

-- ============================================================
-- TABLA 6: CONFIGURACION_ANFITEATRO
-- Guarda la estructura y los roles del mapa del anfiteatro.
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion_anfiteatro (
    id             SERIAL       PRIMARY KEY,
    ceremonia_id   VARCHAR(50)  REFERENCES ceremonias(id) ON DELETE CASCADE,
    modificado_por UUID         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    estructura     JSONB        NOT NULL,
    mapa_roles     JSONB        NOT NULL,
    actualizado_en TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 7: LOGS_AUDITORIA
-- Registro permanente de acciones críticas del sistema.
-- ============================================================
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id                 SERIAL       PRIMARY KEY,
    usuario_id         UUID         REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    accion             VARCHAR(50)  NOT NULL,
    tabla_afectada     VARCHAR(50),
    registro_afectado  UUID,
    valores_anteriores JSONB,
    valores_nuevos     JSONB,
    ip_origen          VARCHAR(45),
    fecha              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 8: CONFIGURACION_SISTEMA
-- Almacena parámetros ajustables de la plataforma.
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave          VARCHAR(100) PRIMARY KEY,
    valor          TEXT         NOT NULL,
    descripcion    TEXT,
    actualizado_en TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 9: PROFESORES
-- Catálogo de profesores disponibles para entregar diplomas.
-- ============================================================
CREATE TABLE IF NOT EXISTS profesores (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre        TEXT NOT NULL,
    dni           VARCHAR(20),
    materia       TEXT,
    activo        INTEGER DEFAULT 1,
    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA 10: ENTREGADORES
-- Personas asignadas a entregar el diploma a cada egresado.
-- ============================================================
CREATE TABLE IF NOT EXISTS entregadores (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    egresado_id   UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    tipo          VARCHAR(20) NOT NULL CHECK (tipo IN ('PROFESOR', 'FAMILIAR')),
    profesor_id   UUID REFERENCES profesores(id) ON DELETE SET NULL,
    invitado_id   UUID REFERENCES invitados(id) ON DELETE SET NULL,
    nombre        TEXT NOT NULL,
    orden         INTEGER NOT NULL DEFAULT 1,
    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(egresado_id, orden)
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

-- Índices de optimización de búsquedas en PostgreSQL
CREATE INDEX IF NOT EXISTS idx_egresados_token  ON egresados(token);
CREATE INDEX IF NOT EXISTS idx_egresados_correo ON egresados(correo);
CREATE INDEX IF NOT EXISTS idx_invitados_egresado ON invitados(egresado_id);
CREATE INDEX IF NOT EXISTS idx_invitados_presente ON invitados(presente);
CREATE INDEX IF NOT EXISTS idx_otp_egresado ON otp_historial(egresado_id);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs_auditoria(fecha);
CREATE INDEX IF NOT EXISTS idx_entregadores_egresado ON entregadores(egresado_id);
CREATE INDEX IF NOT EXISTS idx_profesores_activo ON profesores(activo);
