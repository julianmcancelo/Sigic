# SiGIC — Documento de Especificacion y Diseno de Base de Datos

> **Instituto Tecnologico Beltran**  
> **Carrera:** Tecnicatura Superior en Analista de Sistemas  
> **Proyecto:** SiGIC — Sistema de Gestion Institucional de Colaciones  
> **Autor:** Cancelo Julian  
> **Motor de Base de Datos:** PostgreSQL 14+ (Neon Serverless Cloud)  
> **Version:** 1.0 (Definitiva para Evaluacion Academica)

---

## 1. Introduccion y Alcance del Modelo de Datos

El presente documento formaliza el diseno conceptual, logico y fisico de la base de datos relacional para la plataforma **SiGIC (Sistema de Gestion Institucional de Colaciones)**.

### Objetivos y Criterios de Diseno:
1. **Normalizacion en Tercera Forma Normal (3FN):** Estructura atomica que erradica la redundancia y anomalias de actualizacion.
2. **Integridad Referencial Estricta:** Reglas `ON DELETE CASCADE` y `ON DELETE SET NULL` bien definidas para preservar la coherencia en actos masivos.
3. **Seguridad mediante UUID v4:** Identificadores no predecibles que impiden ataques de enumeracion en credenciales QR.
4. **Flujo de Acceso Passwordless (OTP):** Autenticacion de graduados mediante hashes seguros SHA-256 e historial de auditoria con ventana de expiracion de 10 minutos.
5. **Flexibilidad Espacial (JSONB):** Modelado dinamico del anfiteatro para soportar variadas distribuciones de butacas sin migraciones de esquema.
6. **Trazabilidad y Auditoria:** Registro inmutable de transacciones criticas (INSERT, UPDATE, DELETE, LOGIN) con capturas JSONB.

---

## 2. Diagrama de Clases del Dominio

El diseno fisico implementa las especificaciones del Diagrama de Clases oficial del sistema:

![Diagrama de Clases SiGIC](diagrama_clases_sigic.png)

### Estrategias de Mapeo Objeto-Relacional:
- **Herencia de Usuarios (Single Table Inheritance - STI):** La clase abstracta `Usuario` y sus especializaciones (`ADMIN`, `ADMINISTRATIVO`, `PORTERIA`) se consolidan en la tabla `usuarios` mediante el discriminador enumerado `rol_usuario`.
- **Composicion de Ciclo de Vida:** Las entidades `invitados` y `otp_historial` dependen de la existencia de `egresados` (`ON DELETE CASCADE`).
- **Asociacion Polimorfica en Padrinos:** El entregador de titulo puede ser un `Profesor` (`profesor_id`), un familiar acreditado como `Invitado` (`invitado_id`) o un allegado `EXTERNO` (nombre libre), validado por una restriccion de comprobacion `CHECK` declarativa.

---

## 3. Modelo Logico Relacional (Notacion Formal)

- **USUARIOS** (<u>id</u>, nombre, email, password_hash, rol, activo, creado_en, actualizado_en)
- **CEREMONIAS** (<u>id</u>, nombre, fecha, lugar, max_invitados, max_padrinos, activa, creado_en)
- **PROFESORES** (<u>id</u>, nombre, dni, materia, activo, creado_en)
- **EGRESADOS** (<u>id</u>, *ceremonia_id*, token, nombre, legajo, dni, correo, telefono, estado, promedio, asiento_id, creado_en)
- **INVITADOS** (<u>id</u>, *egresado_id*, nombre, dni, telefono, correo, relacion, asiento_id, discapacidad, presente, fecha_presente, creado_en)
- **PADRINOS** (<u>id</u>, *egresado_id*, tipo, *profesor_id*, *invitado_id*, nombre, asiento_id, orden, creado_en)
- **OTP_HISTORIAL** (<u>id</u>, *egresado_id*, otp_hash, ip_origen, resultado, solicitado_en, verificado_en)
- **CONFIGURACION_ANFITEATRO** (<u>id</u>, *ceremonia_id*, estructura, mapa_roles, actualizado_en)
- **CONFIGURACION_SISTEMA** (<u>clave</u>, valor, descripcion, actualizado_en)
- **LOGS_AUDITORIA** (<u>id</u>, *usuario_id*, accion, tabla_afectada, registro_afectado, valores_anteriores, valores_nuevos, ip_origen, fecha)

*(Subrayado: Clave Primaria `PK` | Cursiva con asterisco: Clave Foranea `FK`)*

---

## 4. Diccionario de Datos

### 4.1. Tabla: `usuarios`
| Campo | Tipo | Nulo | Clave | Default | Descripcion |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | **PK** | `uuid_generate_v4()` | Identificador unico del usuario |
| `nombre` | `VARCHAR(150)` | No | | | Apellido y nombres completos |
| `email` | `VARCHAR(150)` | No | **UQ** | | Correo electronico institucional de acceso |
| `password_hash`| `VARCHAR(255)` | No | | | Hash seguro bcrypt de la contrasena |
| `rol` | `rol_usuario` | No | | `'ADMINISTRATIVO'` | `'ADMIN'`, `'ADMINISTRATIVO'`, `'PORTERIA'` |
| `activo` | `BOOLEAN` | No | | `TRUE` | Estado de habilitacion de la cuenta |
| `creado_en` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Fecha de alta |
| `actualizado_en`| `TIMESTAMPTZ`| No | | `CURRENT_TIMESTAMP` | Ultima modificacion |

### 4.2. Tabla: `ceremonias`
| Campo | Tipo | Nulo | Clave | Default | Descripcion |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | **PK** | `uuid_generate_v4()` | Identificador unico de la ceremonia |
| `nombre` | `VARCHAR(200)` | No | | | Denominacion formal del acto |
| `fecha` | `DATE` | No | | | Fecha del evento |
| `lugar` | `VARCHAR(200)` | No | | `'Sede Beltran'` | Ubicacion fisica |
| `max_invitados`| `INT` | No | | `4` | Limite de invitados por egresado (>= 0) |
| `max_padrinos` | `INT` | No | | `3` | Limite de padrinos por egresado (>= 0) |
| `activa` | `BOOLEAN` | No | | `FALSE` | Ceremonia en curso (maximo 1 activa) |
| `creado_en` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Marca temporal de creacion |

### 4.3. Tabla: `egresados`
| Campo | Tipo | Nulo | Clave | Default | Descripcion |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | **PK** | `uuid_generate_v4()` | Identificador unico del graduado |
| `ceremonia_id` | `UUID` | No | **FK** | | Ref: `ceremonias(id) ON DELETE CASCADE` |
| `token` | `VARCHAR(32)` | No | **UQ** | | Token para portal de autogestion |
| `nombre` | `VARCHAR(150)` | No | | | Apellido y nombres del graduado |
| `legajo` | `VARCHAR(50)` | No | | | Legajo academico institucional |
| `dni` | `VARCHAR(20)` | No | **UQ\*** | | DNI. Restriccion `UNIQUE(ceremonia_id, dni)` |
| `correo` | `VARCHAR(150)` | No | | | Correo para invitaciones y codigo OTP |
| `telefono` | `VARCHAR(50)` | Si | | `NULL` | Telefono de contacto |
| `estado` | `estado_egresado` | No | | `'PENDIENTE'` | `'PENDIENTE'`, `'ACEPTADO'`, `'RECHAZADO'` |
| `promedio` | `NUMERIC(4,2)` | Si | | `NULL` | Promedio academico general (0 a 10) |
| `asiento_id` | `VARCHAR(30)` | Si | | `NULL` | Butaca asignada en anfiteatro |
| `creado_en` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Alta en padron |

### 4.4. Tabla: `invitados`
| Campo | Tipo | Nulo | Clave | Default | Descripcion |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | **PK** | `uuid_generate_v4()` | Identificador unico del invitado |
| `egresado_id` | `UUID` | No | **FK** | | Ref: `egresados(id) ON DELETE CASCADE` |
| `nombre` | `VARCHAR(150)` | No | | | Nombre completo del invitado |
| `dni` | `VARCHAR(20)` | No | **UQ\*** | | DNI. Restriccion `UNIQUE(egresado_id, dni)` |
| `telefono` | `VARCHAR(50)` | Si | | `NULL` | Telefono de contacto |
| `correo` | `VARCHAR(150)` | Si | | `NULL` | Correo electronico |
| `relacion` | `VARCHAR(80)` | Si | | `NULL` | Vinculo familiar o afectivo |
| `asiento_id` | `VARCHAR(30)` | Si | | `NULL` | Butaca asignada |
| `discapacidad` | `BOOLEAN` | No | | `FALSE` | Requiere asiento accesible |
| `presente` | `BOOLEAN` | No | | `FALSE` | Acreditado en porteria |
| `fecha_presente`| `TIMESTAMPTZ`| Si | | `NULL` | Hora exacta del escaneo de ingreso |

### 4.5. Tabla: `profesores`
| Campo | Tipo | Nulo | Clave | Descripcion |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | No | **PK** | Identificador unico del profesor |
| `nombre` | `VARCHAR(150)` | No | | Apellido y nombres completos |
| `dni` | `VARCHAR(20)` | No | **UQ** | Documento del docente |
| `materia` | `VARCHAR(150)` | No | | Catedra que dicta |
| `activo` | `BOOLEAN` | No | | Habilitado para entrega de titulos |

### 4.6. Tabla: `padrinos`
| Campo | Tipo | Nulo | Clave | Descripcion |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `UUID` | No | **PK** | Identificador del padrino/entregador |
| `egresado_id` | `UUID` | No | **FK** | Ref: `egresados(id) ON DELETE CASCADE` |
| `tipo` | `tipo_padrino` | No | | `'PROFESOR'`, `'FAMILIAR'`, `'EXTERNO'` |
| `profesor_id` | `UUID` | Si | **FK** | Ref: `profesores(id)` (requerido si tipo='PROFESOR') |
| `invitado_id` | `UUID` | Si | **FK** | Ref: `invitados(id)` (requerido si tipo='FAMILIAR') |
| `nombre` | `VARCHAR(150)` | Si | | Nombre libre (requerido si tipo='EXTERNO') |
| `orden` | `INT` | No | | Prioridad de entrega (1, 2, 3...) |

*Restriccion de Consistencia Polimorfica:*  
`CHECK ((tipo='PROFESOR' AND profesor_id IS NOT NULL) OR (tipo='FAMILIAR' AND invitado_id IS NOT NULL) OR (tipo='EXTERNO' AND nombre IS NOT NULL))`

### 4.7. Tabla: `otp_historial`
| Campo | Tipo | Nulo | Clave | Descripcion |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `BIGSERIAL` | No | **PK** | Identificador secuencial del intento |
| `egresado_id` | `UUID` | No | **FK** | Ref: `egresados(id) ON DELETE CASCADE` |
| `otp_hash` | `VARCHAR(64)` | No | | Hash SHA-256 de la clave efimera |
| `ip_origen` | `VARCHAR(45)` | Si | | Direccion IP del solicitante |
| `resultado` | `resultado_otp`| No | | `'ENVIADO'`, `'VERIFICADO'`, `'FALLIDO'`, `'EXPIRADO'` |
| `solicitado_en`| `TIMESTAMPTZ`| No | | Fecha y hora de solicitud |
| `verificado_en`| `TIMESTAMPTZ`| Si | | Fecha y hora de verificacion |

### 4.8. Tabla: `configuracion_anfiteatro`
| Campo | Tipo | Nulo | Clave | Descripcion |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `BIGSERIAL` | No | **PK** | Identificador de configuracion de sala |
| `ceremonia_id` | `UUID` | No | **FK** | Ref: `ceremonias(id) ON DELETE CASCADE` |
| `estructura` | `JSONB` | No | | Geometria de filas, columnas y pasillos |
| `mapa_roles` | `JSONB` | No | | Zonas de butacas por rol |

### 4.9. Tabla: `configuracion_sistema`
| Campo | Tipo | Nulo | Clave | Descripcion |
| :--- | :--- | :---: | :---: | :--- |
| `clave` | `VARCHAR(100)` | No | **PK** | Clave del parametro (ej: 'modo_mantenimiento') |
| `valor` | `TEXT` | No | | Valor configurado ('true', 'false', etc.) |
| `descripcion` | `TEXT` | Si | | Descripcion operativa del parametro |

### 4.10. Tabla: `logs_auditoria`
| Campo | Tipo | Nulo | Clave | Descripcion |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `BIGSERIAL` | No | **PK** | Registro secuencial de auditoria |
| `usuario_id` | `UUID` | Si | **FK** | Ref: `usuarios(id) ON DELETE SET NULL` |
| `accion` | `tipo_log` | No | | `'INSERT'`, `'UPDATE'`, `'DELETE'`, `'LOGIN'`, `'LOGOUT'` |
| `tabla_afectada`| `VARCHAR(60)`| No | | Entidad sobre la que se opero |
| `registro_afectado`| `UUID` | Si | | ID del registro modificado |
| `valores_anteriores`| `JSONB` | Si | | Snapshot previo |
| `valores_nuevos` | `JSONB` | Si | | Snapshot posterior |
| `ip_origen` | `VARCHAR(45)`| Si | | Direccion IP del operador |
| `fecha` | `TIMESTAMPTZ`| No | | Timestamp de auditoria |

---

## 5. Script DDL y DML Completo para PostgreSQL

```sql
-- ============================================================================
-- SiGIC — Sistema de Gestion Institucional de Colaciones
-- Script DDL y DML Integral para PostgreSQL 14+ (Neon Serverless)
-- Autor: Cancelo Julian · Analista de Sistemas · Instituto Tecnologico Beltran
-- ============================================================================

-- 1. EXTENSIONES DEL SISTEMA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS DE DATOS ENUMERADOS (ENUMs)
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

-- 3. FUNCIONES DE DISPARADOR (TRIGGERS)
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CREACION DE TABLAS

-- 4.1. Tabla: usuarios
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

-- 4.2. Tabla: ceremonias
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

-- Indice unico parcial: asegura que solo exista 1 ceremonia activa en toda la base
CREATE UNIQUE INDEX IF NOT EXISTS idx_ceremonias_activa_unica 
    ON ceremonias ((activa)) WHERE activa = TRUE;

-- 4.3. Tabla: profesores
CREATE TABLE IF NOT EXISTS profesores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    materia VARCHAR(150) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4.4. Tabla: egresados
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

-- 4.5. Tabla: invitados
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

-- 4.6. Tabla: padrinos
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

-- 4.7. Tabla: otp_historial
CREATE TABLE IF NOT EXISTS otp_historial (
    id BIGSERIAL PRIMARY KEY,
    egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    otp_hash VARCHAR(64) NOT NULL,
    ip_origen VARCHAR(45),
    resultado resultado_otp NOT NULL DEFAULT 'ENVIADO',
    solicitado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    verificado_en TIMESTAMPTZ
);

-- 4.8. Tabla: configuracion_anfiteatro
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

-- 4.9. Tabla: configuracion_sistema
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion TEXT,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_actualizar_configuracion
    BEFORE UPDATE ON configuracion_sistema
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- 4.10. Tabla: logs_auditoria
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

-- 5. INDICES DE OPTIMIZACION (B-TREE)
CREATE INDEX IF NOT EXISTS idx_egresados_token ON egresados(token);
CREATE INDEX IF NOT EXISTS idx_egresados_dni ON egresados(dni);
CREATE INDEX IF NOT EXISTS idx_egresados_ceremonia ON egresados(ceremonia_id);
CREATE INDEX IF NOT EXISTS idx_invitados_egresado ON invitados(egresado_id);
CREATE INDEX IF NOT EXISTS idx_invitados_presente ON invitados(presente);
CREATE INDEX IF NOT EXISTS idx_padrinos_egresado ON padrinos(egresado_id);
CREATE INDEX IF NOT EXISTS idx_otp_egresado ON otp_historial(egresado_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs_auditoria(fecha DESC);

-- 6. DATOS SEMILLA (SEEDS INICIALES)
INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
('modo_mantenimiento', 'false', 'Suspende el portal publico de graduados ante tareas tecnicas'),
('acceso_oculto_egresado', 'true', 'Requiere 5 clics sobre el logo en portada para revelar login'),
('acceso_directo_admin', 'true', 'Habilita la ruta directa /admin para gestores'),
('nombre_institucion', 'Instituto Tecnologico Beltran', 'Nombre formal de la casa de estudios')
ON CONFLICT (clave) DO NOTHING;

-- Usuario administrador maestro inicial (password: Admin2026!)
INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo) VALUES
('11111111-1111-4111-8111-111111111111', 'Administrador General SiGIC', 'admin@sigic.com.ar', crypt('Admin2026!', gen_salt('bf', 10)), 'ADMIN', TRUE),
('22222222-2222-4222-8222-222222222222', 'Operador de Porteria Beltran', 'porteria@sigic.com.ar', crypt('Porteria2026!', gen_salt('bf', 10)), 'PORTERIA', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Ceremonia activa de graduacion 2026
INSERT INTO ceremonias (id, nombre, fecha, lugar, max_invitados, max_padrinos, activa) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Colacion de Grados Promocion 2026 · Analista de Sistemas', '2026-11-20', 'Anfiteatro Central Beltran', 4, 3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Profesores titulares para entrega de diplomas
INSERT INTO profesores (id, nombre, dni, materia, activo) VALUES
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 'Ing. Roberto Gomez', '18234567', 'Practica Profesionalizante III', TRUE),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02', 'Lic. Mariana Bianchi', '22456789', 'Bases de Datos Avanzadas', TRUE),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb03', 'Dr. Carlos Benitez', '14567890', 'Arquitectura de Software', TRUE)
ON CONFLICT (dni) DO NOTHING;

-- Egresado modelo
INSERT INTO egresados (id, ceremonia_id, token, nombre, legajo, dni, correo, telefono, estado, promedio, asiento_id) VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'token_demo_cancelo_julian_2026', 'Cancelo Julian', 'ITB-2023-8891', '42111222', 'cancelo.julian@sigic.com.ar', '+54 9 11 5566-7788', 'ACEPTADO', 9.50, 'platea-A-1')
ON CONFLICT (token) DO NOTHING;

-- Acompanantes modelo vinculados al egresado
INSERT INTO invitados (id, egresado_id, nombre, dni, telefono, correo, relacion, asiento_id, discapacidad, presente) VALUES
('dddddddd-dddd-4ddd-8ddd-dddddddddd01', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Marta Gonzalez', '20111222', '+54 9 11 4433-2211', 'marta@gmail.com', 'Madre', 'platea-A-2', FALSE, FALSE),
('dddddddd-dddd-4ddd-8ddd-dddddddddd02', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Horacio Cancelo', '18111222', '+54 9 11 4433-2212', 'horacio@gmail.com', 'Padre', 'platea-A-3', FALSE, FALSE)
ON CONFLICT (egresado_id, dni) DO NOTHING;

-- Padrino docente designado
INSERT INTO padrinos (id, egresado_id, tipo, profesor_id, orden) VALUES
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'PROFESOR', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 1)
ON CONFLICT (egresado_id, orden) DO NOTHING;
```

---

## 6. Operaciones CRUD y Consultas Transaccionales

### 6.1. Modulo de Ceremonias y Planificacion

#### Create (Alta de Ceremonia con Aforo)
```sql
INSERT INTO ceremonias (nombre, fecha, lugar, max_invitados, max_padrinos, activa)
VALUES ('Colacion Promocion 2026 - Turno Noche', '2026-11-25', 'Anfiteatro Beltran', 4, 3, FALSE)
RETURNING id, nombre, activa;
```

#### Read (Consulta de Ceremonia Activa con Estadisticas de Aforo)
```sql
SELECT 
    c.id, c.nombre, c.fecha, c.lugar, c.max_invitados,
    COUNT(DISTINCT e.id) AS total_egresados,
    COUNT(DISTINCT i.id) AS total_invitados,
    COUNT(DISTINCT CASE WHEN i.presente = TRUE THEN i.id END) AS presentes_acreditados
FROM ceremonias c
LEFT JOIN egresados e ON e.ceremonia_id = c.id
LEFT JOIN invitados i ON i.egresado_id = e.id
WHERE c.activa = TRUE
GROUP BY c.id;
```

#### Update (Activacion Atomica Transaccional de Ceremonia)
```sql
BEGIN;
-- Paso 1: Desactivar todas las ceremonias previas
UPDATE ceremonias SET activa = FALSE WHERE activa = TRUE;

-- Paso 2: Activar exclusivamente la ceremonia designada
UPDATE ceremonias 
SET activa = TRUE 
WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
COMMIT;
```

#### Delete (Baja de Ceremonia con Limpieza en Cascada)
```sql
DELETE FROM ceremonias WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
```

---

### 6.2. Modulo de Egresados y Padron Academico

#### Create (Insercion Masiva / Bulk Insert desde Excel)
```sql
INSERT INTO egresados (ceremonia_id, token, nombre, legajo, dni, correo, estado, promedio)
VALUES 
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', md5(random()::text || clock_timestamp()::text), 'Cancelo Julian', 'ITB-8891', '42111222', 'julian@sigic.com.ar', 'PENDIENTE', 9.50),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', md5(random()::text || clock_timestamp()::text), 'Alfonso Alan Alexis', 'ITB-8892', '41222333', 'alan@sigic.com.ar', 'PENDIENTE', 9.20)
ON CONFLICT (ceremonia_id, dni) 
DO UPDATE SET 
    correo = EXCLUDED.correo,
    promedio = EXCLUDED.promedio;
```

#### Read (Resolucion de Portal del Graduado por Token Seguro)
```sql
SELECT 
    e.id, e.nombre, e.dni, e.legajo, e.correo, e.estado, e.asiento_id,
    c.nombre AS ceremonia_nombre, c.fecha AS ceremonia_fecha, c.lugar,
    c.max_invitados, c.max_padrinos
FROM egresados e
JOIN ceremonias c ON c.id = e.ceremonia_id
WHERE e.token = 'token_demo_cancelo_julian_2026';
```

#### Update (Transicion de Estado y Asignacion de Butaca)
```sql
UPDATE egresados
SET 
    estado = 'ACEPTADO',
    asiento_id = 'platea-A-1'
WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' AND estado = 'PENDIENTE'
RETURNING id, estado, asiento_id;
```

#### Delete (Descarte / Desvinculacion de Egresado)
```sql
DELETE FROM egresados WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
```

---

### 6.3. Modulo de Invitados y Acreditacion en Porteria

#### Create (Alta de Acompanante Validando Limite de Aforo)
```sql
INSERT INTO invitados (egresado_id, nombre, dni, telefono, correo, relacion, discapacidad)
SELECT 
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Marta Gonzalez', '20111222', '+54 9 11 4433-2211', 'marta@gmail.com', 'Madre', FALSE
WHERE (
    SELECT COUNT(*) FROM invitados WHERE egresado_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
) < (
    SELECT c.max_invitados FROM egresados e JOIN ceremonias c ON c.id = e.ceremonia_id WHERE e.id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
)
RETURNING id, nombre;
```

#### Read (Nomina de Invitados de un Egresado para Pase QR Grupal)
```sql
SELECT 
    i.id, i.nombre, i.dni, i.relacion, i.asiento_id, i.discapacidad, i.presente, i.fecha_presente
FROM invitados i
WHERE i.egresado_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
ORDER BY i.nombre ASC;
```

#### Update (Acreditacion en Porteria en Tiempo Real con Sellado de Tiempo)
```sql
UPDATE invitados
SET 
    presente = TRUE,
    fecha_presente = CURRENT_TIMESTAMP
WHERE id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01' AND presente = FALSE
RETURNING id, nombre, presente, fecha_presente;
```

#### Delete (Baja de Invitado y Liberacion de Cupo)
```sql
DELETE FROM invitados WHERE id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01';
```

---

### 6.4. Modulo de Profesores y Padrinos de Estrado

#### Create (Designacion Polimorfica de Docente Titular)
```sql
INSERT INTO padrinos (egresado_id, tipo, profesor_id, orden)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'PROFESOR', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 1)
ON CONFLICT (egresado_id, orden) 
DO UPDATE SET profesor_id = EXCLUDED.profesor_id, tipo = EXCLUDED.tipo;
```

#### Read (Reporte de Estrado para Locucion Ceremonial)
```sql
SELECT 
    e.nombre AS egresado,
    e.promedio,
    p.orden,
    p.tipo,
    CASE 
        WHEN p.tipo = 'PROFESOR' THEN prof.nombre || ' (Docente - ' || prof.materia || ')'
        WHEN p.tipo = 'FAMILIAR' THEN inv.nombre || ' (Acompanante - ' || inv.relacion || ')'
        WHEN p.tipo = 'EXTERNO'  THEN p.nombre || ' (Allegado)'
    END AS entregador_diploma
FROM egresados e
JOIN padrinos p ON p.egresado_id = e.id
LEFT JOIN profesores prof ON prof.id = p.profesor_id
LEFT JOIN invitados inv ON inv.id = p.invitado_id
WHERE e.ceremonia_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' AND e.estado = 'ACEPTADO'
ORDER BY e.promedio DESC, e.nombre ASC, p.orden ASC;
```

#### Delete (Desvinculacion de Padrino)
```sql
DELETE FROM padrinos WHERE id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
```

---

### 6.5. Modulo de Autenticacion Passwordless (OTP)

#### Create (Emision de Hash OTP de 6 Digitos)
```sql
INSERT INTO otp_historial (egresado_id, otp_hash, ip_origen, resultado, solicitado_en)
VALUES (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    encode(digest('481920', 'sha256'), 'hex'),
    '190.191.12.34',
    'ENVIADO',
    CURRENT_TIMESTAMP
);
```

#### Read y Update (Verificacion de Codigo con Ventana de 10 Minutos)
```sql
UPDATE otp_historial
SET 
    resultado = 'VERIFICADO',
    verificado_en = CURRENT_TIMESTAMP
WHERE id = (
    SELECT id FROM otp_historial
    WHERE egresado_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
      AND resultado = 'ENVIADO'
      AND otp_hash = encode(digest('481920', 'sha256'), 'hex')
      AND solicitado_en >= (CURRENT_TIMESTAMP - INTERVAL '10 minutes')
    ORDER BY solicitado_en DESC
    LIMIT 1
)
RETURNING id, resultado, verificado_en;
```

---

### 6.6. Modulo de Parametros y Modo Mantenimiento

#### Update (Conmutacion en Vivo del Modo Mantenimiento)
```sql
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES ('modo_mantenimiento', 'true', 'Suspende temporalmente el portal publico para tareas tecnicas')
ON CONFLICT (clave) 
DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = CURRENT_TIMESTAMP;
```

#### Read (Consulta de Logs de Auditoria para Control de Seguridad)
```sql
SELECT 
    l.id, l.accion, l.tabla_afectada, l.registro_afectado,
    COALESCE(u.nombre, 'Sistema Automatico') AS operador,
    l.ip_origen, l.fecha,
    l.valores_anteriores, l.valores_nuevos
FROM logs_auditoria l
LEFT JOIN usuarios u ON u.id = l.usuario_id
ORDER BY l.fecha DESC
LIMIT 50;
```

---

### 6.7. Consultas Analiticas y Reportes de Cierre de Ceremonia

#### Reporte Ejecutivo de Presentismo para Secretaria Academica
```sql
SELECT 
    c.nombre AS acto_colacion,
    COUNT(DISTINCT e.id) AS total_graduados_padron,
    COUNT(DISTINCT CASE WHEN e.estado = 'ACEPTADO' THEN e.id END) AS graduados_confirmados,
    COUNT(DISTINCT CASE WHEN e.estado = 'RECHAZADO' THEN e.id END) AS graduados_inasistentes,
    COUNT(DISTINCT i.id) AS total_invitados_registrados,
    COUNT(DISTINCT CASE WHEN i.presente = TRUE THEN i.id END) AS invitados_ingresados_salon,
    ROUND(
        (COUNT(DISTINCT CASE WHEN i.presente = TRUE THEN i.id END)::numeric / 
         NULLIF(COUNT(DISTINCT i.id), 0)) * 100, 2
    ) AS porcentaje_asistencia_invitados
FROM ceremonias c
LEFT JOIN egresados e ON e.ceremonia_id = c.id
LEFT JOIN invitados i ON i.egresado_id = e.id
WHERE c.activa = TRUE
GROUP BY c.id;
```

#### Planilla de Acreditacion para Descarga en Excel
```sql
SELECT 
    e.legajo,
    e.dni AS egresado_dni,
    e.nombre AS egresado_nombre,
    e.asiento_id AS egresado_butaca,
    i.dni AS invitado_dni,
    i.nombre AS invitado_nombre,
    i.relacion AS vinculo,
    i.asiento_id AS invitado_butaca,
    CASE WHEN i.presente THEN 'PRESENTE' ELSE 'AUSENTE' END AS estado_ingreso,
    TO_CHAR(i.fecha_presente, 'DD/MM/YYYY HH24:MI:SS') AS hora_acreditacion
FROM egresados e
LEFT JOIN invitados i ON i.egresado_id = e.id
WHERE e.ceremonia_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
ORDER BY e.nombre ASC, i.nombre ASC;
```

---

*Documento de Especificacion y Diseno de Base de Datos · Autor: Cancelo Julian*  
*Tecnicatura Superior en Analista de Sistemas · Instituto Tecnologico Beltran (Avellaneda, Buenos Aires)*
