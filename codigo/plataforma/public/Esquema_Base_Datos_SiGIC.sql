-- ============================================================================
-- SiGIC — Sistema de Gestion Institucional de Colaciones
-- Script DDL, Carga Inicial y Operaciones CRUD Integrales
-- Motor: PostgreSQL 14+ (Neon Serverless Cloud)
-- Institucion: Instituto Tecnologico Beltran (ITB)
-- Carrera: Tecnicatura Superior en Analista de Sistemas
-- Autor: Cancelo Julian
-- ============================================================================

-- ============================================================================
-- PARTE 1: CONFIGURACION, EXTENSIONES Y ENUMS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
        CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'ADMINISTRATIVO', 'PORTERIA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_egresado') THEN
        CREATE TYPE estado_egresado AS ENUM ('PENDIENTE', 'ACEPTADO', 'RECHAZADO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_padrino') THEN
        CREATE TYPE tipo_padrino AS ENUM ('PROFESOR', 'FAMILIAR', 'EXTERNO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resultado_otp') THEN
        CREATE TYPE resultado_otp AS ENUM ('ENVIADO', 'VERIFICADO', 'FALLIDO', 'EXPIRADO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_log') THEN
        CREATE TYPE tipo_log AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_asiento') THEN
        CREATE TYPE tipo_asiento AS ENUM ('EGRESADO', 'INVITADO', 'PADRINO', 'RESERVA');
    END IF;
END $$;

-- Funcion disparadora para actualizacion automatica de timestamps
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 2: DEFINICION DE TABLAS (DDL) CON INTEGRIDAD REFERENCIAL
-- ============================================================================

-- 1. Tabla de Usuarios del Sistema (Administracion y Porteria)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'ADMINISTRATIVO',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_actualizar_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- 2. Tabla de Ceremonias (Eventos de Colacion)
CREATE TABLE IF NOT EXISTS ceremonias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL,
    lugar VARCHAR(200) NOT NULL DEFAULT 'Sede Beltran',
    max_invitados INT NOT NULL DEFAULT 4 CHECK (max_invitados >= 0),
    max_padrinos INT NOT NULL DEFAULT 3 CHECK (max_padrinos >= 0),
    activa BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indice unico parcial: asegura que solo exista 1 ceremonia activa en simultaneo
CREATE UNIQUE INDEX IF NOT EXISTS idx_ceremonias_activa_unica 
    ON ceremonias ((activa)) WHERE activa = TRUE;

-- 3. Tabla de Profesores (Cuerpo Docente para Entrega de Diplomas)
CREATE TABLE IF NOT EXISTS profesores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    materia VARCHAR(150) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Egresados (Nomina de Graduados de la Colacion)
CREATE TABLE IF NOT EXISTS egresados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ceremonia_id UUID NOT NULL REFERENCES ceremonias(id) ON DELETE CASCADE,
    token VARCHAR(32) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    legajo VARCHAR(50) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    estado estado_egresado NOT NULL DEFAULT 'PENDIENTE',
    promedio NUMERIC(4,2) CHECK (promedio >= 0 AND promedio <= 10),
    asiento_id VARCHAR(30),
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_egresado_ceremonia_dni UNIQUE (ceremonia_id, dni)
);

-- 5. Tabla de Invitados (Acompanantes y Acreditacion QR)
CREATE TABLE IF NOT EXISTS invitados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    telefono VARCHAR(50),
    correo VARCHAR(150),
    relacion VARCHAR(80),
    asiento_id VARCHAR(30),
    discapacidad BOOLEAN NOT NULL DEFAULT FALSE,
    presente BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_presente TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_invitado_egresado_dni UNIQUE (egresado_id, dni)
);

-- 6. Tabla de Padrinos (Entregadores de Titulo Polimorficos)
CREATE TABLE IF NOT EXISTS padrinos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    tipo tipo_padrino NOT NULL,
    profesor_id UUID REFERENCES profesores(id) ON DELETE SET NULL,
    invitado_id UUID REFERENCES invitados(id) ON DELETE SET NULL,
    nombre VARCHAR(150),
    asiento_id VARCHAR(30),
    orden INT NOT NULL DEFAULT 1 CHECK (orden > 0),
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_padrino_orden UNIQUE (egresado_id, orden),
    CONSTRAINT ck_padrino_consistencia CHECK (
        (tipo = 'PROFESOR' AND profesor_id IS NOT NULL) OR
        (tipo = 'FAMILIAR' AND invitado_id IS NOT NULL) OR
        (tipo = 'EXTERNO'  AND nombre IS NOT NULL)
    )
);

-- 7. Tabla de Historial OTP (Autenticacion Passwordless y Auditoria)
CREATE TABLE IF NOT EXISTS otp_historial (
    id BIGSERIAL PRIMARY KEY,
    egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    otp_hash VARCHAR(64) NOT NULL,
    ip_origen VARCHAR(45),
    resultado resultado_otp NOT NULL DEFAULT 'ENVIADO',
    solicitado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    verificado_en TIMESTAMPTZ
);

-- 8. Tabla de Configuracion del Anfiteatro (Distribucion Espacial JSONB)
CREATE TABLE IF NOT EXISTS configuracion_anfiteatro (
    id BIGSERIAL PRIMARY KEY,
    ceremonia_id UUID NOT NULL REFERENCES ceremonias(id) ON DELETE CASCADE,
    estructura JSONB NOT NULL DEFAULT '{}'::jsonb,
    mapa_roles JSONB NOT NULL DEFAULT '{}'::jsonb,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_actualizar_anfiteatro
    BEFORE UPDATE ON configuracion_anfiteatro
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- 9. Tabla de Configuracion del Sistema (Parametros Globales y Mantenimiento)
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion TEXT,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_actualizar_configuracion
    BEFORE UPDATE ON configuracion_sistema
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- 10. Tabla de Logs de Auditoria (Trazabilidad Inmutable)
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    accion tipo_log NOT NULL,
    tabla_afectada VARCHAR(60) NOT NULL,
    registro_afectado UUID,
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    ip_origen VARCHAR(45),
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 3: INDICES DE OPTIMIZACION (B-TREE)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_egresados_token ON egresados(token);
CREATE INDEX IF NOT EXISTS idx_egresados_dni ON egresados(dni);
CREATE INDEX IF NOT EXISTS idx_egresados_ceremonia ON egresados(ceremonia_id);
CREATE INDEX IF NOT EXISTS idx_invitados_egresado ON invitados(egresado_id);
CREATE INDEX IF NOT EXISTS idx_invitados_presente ON invitados(presente);
CREATE INDEX IF NOT EXISTS idx_padrinos_egresado ON padrinos(egresado_id);
CREATE INDEX IF NOT EXISTS idx_otp_egresado ON otp_historial(egresado_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs_auditoria(fecha DESC);

-- ============================================================================
-- PARTE 4: CARGA INICIAL DE DATOS (REGISTROS BASE)
-- ============================================================================

INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
('modo_mantenimiento', 'false', 'Suspende el portal publico de graduados ante tareas tecnicas'),
('acceso_oculto_egresado', 'true', 'Requiere 5 clics sobre el logo en portada para revelar login'),
('acceso_directo_admin', 'true', 'Habilita la ruta directa /admin para gestores'),
('nombre_institucion', 'Instituto Tecnologico Beltran', 'Nombre formal de la casa de estudios')
ON CONFLICT (clave) DO NOTHING;

-- Usuarios administrativos y de porteria iniciales (passwords cifradas bcrypt)
INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo) VALUES
('11111111-1111-4111-8111-111111111111', 'Administrador General SiGIC', 'admin@sigic.com.ar', crypt('Admin2026!', gen_salt('bf', 10)), 'ADMIN', TRUE),
('22222222-2222-4222-8222-222222222222', 'Operador de Porteria Beltran', 'porteria@sigic.com.ar', crypt('Porteria2026!', gen_salt('bf', 10)), 'PORTERIA', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Ceremonia oficial de graduacion
INSERT INTO ceremonias (id, nombre, fecha, lugar, max_invitados, max_padrinos, activa) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Colacion de Grados Promocion 2026 · Analista de Sistemas', '2026-11-20', 'Anfiteatro Central Beltran', 4, 3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Cuerpo docente habilitado para entrega de titulos
INSERT INTO profesores (id, nombre, dni, materia, activo) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 'Ing. Roberto Gomez', '18234567', 'Practica Profesionalizante III', TRUE),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02', 'Lic. Mariana Bianchi', '22456789', 'Bases de Datos Avanzadas', TRUE),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb03', 'Dr. Carlos Benitez', '14567890', 'Arquitectura de Software', TRUE)
ON CONFLICT (dni) DO NOTHING;

-- Graduado modelo
INSERT INTO egresados (id, ceremonia_id, token, nombre, legajo, dni, correo, telefono, estado, promedio, asiento_id) VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'token_demo_cancelo_julian_2026', 'Cancelo Julian', 'ITB-2023-8891', '42111222', 'cancelo.julian@sigic.com.ar', '+54 9 11 5566-7788', 'ACEPTADO', 9.50, 'platea-A-1')
ON CONFLICT (token) DO NOTHING;

-- Invitados asociados
INSERT INTO invitados (id, egresado_id, nombre, dni, telefono, correo, relacion, asiento_id, discapacidad, presente) VALUES
('dddddddd-dddd-4ddd-8ddd-dddddddddd01', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Marta Gonzalez', '20111222', '+54 9 11 4433-2211', 'marta@gmail.com', 'Madre', 'platea-A-2', FALSE, FALSE),
('dddddddd-dddd-4ddd-8ddd-dddddddddd02', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Horacio Cancelo', '18111222', '+54 9 11 4433-2212', 'horacio@gmail.com', 'Padre', 'platea-A-3', FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Padrino asignado
INSERT INTO padrinos (id, egresado_id, tipo, profesor_id, orden) VALUES
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'PROFESOR', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PARTE 5: OPERACIONES CRUD ESENCIALES (CONSULTAS SQL DE NEGOCIO)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CRUD 1: CEREMONIAS
-- ----------------------------------------------------------------------------

-- [CREATE] Crear una nueva ceremonia de colacion
INSERT INTO ceremonias (nombre, fecha, lugar, max_invitados, max_padrinos, activa)
VALUES ('Colacion de Grados Promocion 2027 · Analista de Sistemas', '2027-11-19', 'Anfiteatro Central Beltran', 4, 3, FALSE)
RETURNING id, nombre, fecha, activa;

-- [READ] Obtener la ceremonia activa con totales de egresados e invitados
SELECT 
    c.id, c.nombre, c.fecha, c.lugar, c.max_invitados, c.max_padrinos,
    COUNT(DISTINCT e.id) AS total_egresados,
    COUNT(DISTINCT i.id) AS total_invitados,
    COUNT(DISTINCT CASE WHEN e.estado = 'ACEPTADO' THEN e.id END) AS egresados_confirmados
FROM ceremonias c
LEFT JOIN egresados e ON e.ceremonia_id = c.id
LEFT JOIN invitados i ON i.egresado_id = e.id
WHERE c.activa = TRUE
GROUP BY c.id;

-- [UPDATE] Activacion atomica de una ceremonia (desactiva cualquier otra en curso)
BEGIN;
UPDATE ceremonias SET activa = FALSE WHERE activa = TRUE;
UPDATE ceremonias SET activa = TRUE WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
COMMIT;

-- [DELETE] Eliminar ceremonia y toda su estructura vinculada en cascada
-- DELETE FROM ceremonias WHERE id = '00000000-0000-0000-0000-000000000000';

-- ----------------------------------------------------------------------------
-- CRUD 2: EGRESADOS (GRADUADOS)
-- ----------------------------------------------------------------------------

-- [CREATE] Alta masiva / importacion desde padron academico Excel
INSERT INTO egresados (ceremonia_id, token, nombre, legajo, dni, correo, telefono, promedio)
VALUES 
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'token_seguro_01_a7b8c9d0', 'Laura Fernandez', 'ITB-2023-8892', '38444555', 'laura.f@correo.com', '+54 11 5544-3322', 8.90),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'token_seguro_02_e1f2g3h4', 'Martin Gomez', 'ITB-2023-8893', '39111444', 'martin.g@correo.com', '+54 11 5544-3323', 9.15)
ON CONFLICT (ceremonia_id, dni) 
DO UPDATE SET correo = EXCLUDED.correo, telefono = EXCLUDED.telefono;

-- [READ] Validar acceso al portal mediante token secreto individual
SELECT 
    e.id, e.token, e.nombre, e.legajo, e.dni, e.correo, e.estado, e.asiento_id, e.promedio,
    c.id AS ceremonia_id, c.nombre AS ceremonia_nombre, c.fecha AS ceremonia_fecha, c.lugar AS ceremonia_lugar
FROM egresados e
JOIN ceremonias c ON c.id = e.ceremonia_id
WHERE e.token = 'token_demo_cancelo_julian_2026';

-- [UPDATE] Aceptacion de asistencia y asignacion de butaca
UPDATE egresados
SET estado = 'ACEPTADO', asiento_id = 'platea-A-1'
WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
RETURNING id, nombre, estado, asiento_id;

-- [DELETE] Baja logica o rechazo irreversible de invitacion
UPDATE egresados
SET estado = 'RECHAZADO', asiento_id = NULL
WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

-- ----------------------------------------------------------------------------
-- CRUD 3: INVITADOS Y ACREDITACION EN PORTERIA (APP MOVIL)
-- ----------------------------------------------------------------------------

-- [CREATE] Registrar acompanante con validacion de cupo maximo
INSERT INTO invitados (egresado_id, nombre, dni, telefono, correo, relacion, discapacidad)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Camila Benitez', '44111333', '+54 11 9988-7766', 'camila@gmail.com', 'Hermana', FALSE)
RETURNING id, nombre, dni, egresado_id;

-- [READ] Consultar lista de invitados acreditados para la credencial QR
SELECT id, nombre, dni, relacion, asiento_id, discapacidad, presente, fecha_presente
FROM invitados
WHERE egresado_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
ORDER BY nombre ASC;

-- [UPDATE] Check-In en tiempo real por escaneo de QR en porteria
UPDATE invitados
SET presente = TRUE, fecha_presente = CURRENT_TIMESTAMP
WHERE id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'
RETURNING id, nombre, dni, presente, fecha_presente;

-- [DELETE] Desvincular o anular invitado
DELETE FROM invitados
WHERE id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd02';

-- ----------------------------------------------------------------------------
-- CRUD 4: PADRINOS (ENTREGADORES DE DIPLOMA)
-- ----------------------------------------------------------------------------

-- [CREATE] Asignar docente titular como padrino
INSERT INTO padrinos (egresado_id, tipo, profesor_id, orden)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'PROFESOR', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 1)
ON CONFLICT (egresado_id, orden)
DO UPDATE SET tipo = EXCLUDED.tipo, profesor_id = EXCLUDED.profesor_id, invitado_id = NULL, nombre = NULL;

-- [CREATE] Asignar familiar invitado como segundo padrino
INSERT INTO padrinos (egresado_id, tipo, invitado_id, orden)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'FAMILIAR', 'dddddddd-dddd-4ddd-8ddd-dddddddddd01', 2)
ON CONFLICT (egresado_id, orden)
DO UPDATE SET tipo = EXCLUDED.tipo, invitado_id = EXCLUDED.invitado_id, profesor_id = NULL, nombre = NULL;

-- [READ] Listar padrinos y entregadores designados por el egresado
SELECT 
    p.id, p.orden, p.tipo, p.asiento_id,
    COALESCE(prof.nombre, inv.nombre, p.nombre) AS nombre_entregador,
    COALESCE(prof.materia, inv.relacion, 'Externo') AS detalle
FROM padrinos p
LEFT JOIN profesores prof ON prof.id = p.profesor_id
LEFT JOIN invitados inv ON inv.id = p.invitado_id
WHERE p.egresado_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
ORDER BY p.orden ASC;

-- [DELETE] Quitar padrino
DELETE FROM padrinos WHERE id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

-- ----------------------------------------------------------------------------
-- CRUD 5: AUTENTICACION PASSWORDLESS Y CODIGOS OTP
-- ----------------------------------------------------------------------------

-- [CREATE] Registrar emision de codigo OTP efimero (hash SHA-256)
INSERT INTO otp_historial (egresado_id, otp_hash, ip_origen, resultado, solicitado_en)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', encode(digest('849201', 'sha256'), 'hex'), '190.220.14.88', 'ENVIADO', CURRENT_TIMESTAMP)
RETURNING id, solicitado_en;

-- [UPDATE] Validacion de codigo OTP con expiracion estricta de 10 minutos
UPDATE otp_historial
SET resultado = 'VERIFICADO', verificado_en = CURRENT_TIMESTAMP
WHERE id = (
    SELECT id FROM otp_historial
    WHERE egresado_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
      AND resultado = 'ENVIADO'
      AND otp_hash = encode(digest('849201', 'sha256'), 'hex')
      AND solicitado_en >= (CURRENT_TIMESTAMP - INTERVAL '10 minutes')
    ORDER BY solicitado_en DESC
    LIMIT 1
)
RETURNING id, resultado, verificado_en;

-- ----------------------------------------------------------------------------
-- CRUD 6: CONFIGURACION Y MODO MANTENIMIENTO
-- ----------------------------------------------------------------------------

-- [READ] Consultar estado actual del sistema
SELECT clave, valor, descripcion, actualizado_en
FROM configuracion_sistema
WHERE clave = 'modo_mantenimiento';

-- [UPDATE] Activar o desactivar modo mantenimiento en caliente
UPDATE configuracion_sistema
SET valor = 'true', actualizado_en = CURRENT_TIMESTAMP
WHERE clave = 'modo_mantenimiento'
RETURNING clave, valor, actualizado_en;

-- ----------------------------------------------------------------------------
-- CRUD 7: REPORTES ANALITICOS Y ESTRADO DE LOCUCION
-- ----------------------------------------------------------------------------

-- [READ] Reporte de Estrado para Locucion Ceremonial (Graduado, Promedio, Entregadores)
SELECT 
    e.nombre AS egresado,
    e.dni AS egresado_dni,
    e.promedio,
    e.asiento_id AS asiento_graduado,
    p.orden,
    CASE 
        WHEN p.tipo = 'PROFESOR' THEN prof.nombre || ' (Docente titular - ' || prof.materia || ')'
        WHEN p.tipo = 'FAMILIAR' THEN inv.nombre || ' (Familiar - ' || inv.relacion || ')'
        WHEN p.tipo = 'EXTERNO'  THEN p.nombre || ' (Allegado designado)'
    END AS persona_entrega_diploma
FROM egresados e
JOIN padrinos p ON p.egresado_id = e.id
LEFT JOIN profesores prof ON prof.id = p.profesor_id
LEFT JOIN invitados inv ON inv.id = p.invitado_id
WHERE e.ceremonia_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  AND e.estado = 'ACEPTADO'
ORDER BY e.promedio DESC, e.nombre ASC, p.orden ASC;

-- [READ] Metricas de Acreditacion en Tiempo Real para Porteria y Seguridad
SELECT 
    COUNT(DISTINCT e.id) AS total_graduados_convocados,
    COUNT(DISTINCT CASE WHEN e.estado = 'ACEPTADO' THEN e.id END) AS graduados_confirmados,
    COUNT(DISTINCT i.id) AS total_invitados_registrados,
    COUNT(DISTINCT CASE WHEN i.presente = TRUE THEN i.id END) AS invitados_ingresados_qr,
    ROUND((COUNT(DISTINCT CASE WHEN i.presente = TRUE THEN i.id END)::numeric / NULLIF(COUNT(DISTINCT i.id), 0)) * 100, 1) AS porcentaje_afluencia
FROM egresados e
LEFT JOIN invitados i ON i.egresado_id = e.id
WHERE e.ceremonia_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
