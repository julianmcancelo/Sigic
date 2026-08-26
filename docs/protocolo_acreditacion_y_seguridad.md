# SiGIC — Protocolo de Acreditación, Formatos QR y Seguridad Operativa

> **Documento Técnico de Referencia**
> Sistema de Gestión Institucional de Colaciones — SiGIC
> Fecha de actualización: Agosto 2026

---

## 1. Visión General

El subsistema de **Control de Acceso y Acreditación** de SiGIC permite validar la identidad y registrar el ingreso en sala de graduados y sus acompañantes durante el evento de colación.

El sistema fue diseñado para operar con máxima tolerancia a fallos, compatibilidad con múltiples formatos de credenciales (físicas, digitales y móviles) y soporte simultáneo para:
1. **Lector de Código de Barras / QR USB (Modo Pistola)**: Emula teclado (keyboard wedge) sin necesidad de foco en pantalla.
2. **Cámara Integrada (Webcam / Smartphone / Tablet)**: Lectura continua mediante html5-qrcode con selección dinámica de sensor.
3. **Búsqueda Manual**: Búsqueda inmediata por DNI, Legajo o Token alfanumérico.

---

## 2. Formatos de Credencial QR Soportados

El backend unifica la decodificación en src/lib/api-helpers.ts (parsearCodigoAcreditacion), permitiendo que el mismo punto de lectura procese:

| Formato / Origen | Ejemplo de Carga Útil | Mecanismo de Resolución |
|---|---|---|
| **Google Wallet Pass** | SIGIC:a8f9c2d1-e23a-4b5c-8901-123456789abc | Remueve prefijo SIGIC:, busca por token UUID o ID de egresado |
| **Credencial Web JSON** | { id:...,token:a8f9c2d1...,dni:42123456,asientos:[A-01,A-02]} | Parsea JSON nativo y extrae campos clave (	oken, dni, id) |
| **URL / Enlace Directo** | https://sigic.beltran.edu.ar/?token=a8f9c2d1... o /egresados/token/a8f9c2d1... | Parsea Query String y Path para extraer el token |
| **UUID Directo** | 8f9c2d1-e23a-4b5c-8901-123456789abc | Búsqueda por token de acceso del graduado o ID de invitado |
| **DNI Numérico** | 42123456 | Búsqueda en padrón de egresados e invitados por DNI |
| **Token Alfanumérico Corto** | TK98234 | Búsqueda por código de seguridad |

---

## 3. Endpoints de Acreditación (API REST)

### 3.1. Búsqueda y Resolución de Credencial
- **Endpoint**: GET /api/invitados/buscar/:codigo
- **Descripción**: Localiza la credencial, infiere el rol (Graduado / Acompañante) y devuelve la ficha completa del grupo con sus butacas asignadas y estado de asistencia.

### 3.2. Acreditación Grupal (1-Clic)
- **Endpoint**: PUT /api/egresados/:id/presente-grupo
- **Payload**:
`json
{
  acreditarEgresado: true,
  invitadoIds: [uuid-invitado-1, uuid-invitado-2]
}
`
- **Comportamiento**: En una única transacción SQL registra el ingreso del egresado y de todos los acompañantes seleccionados con timestamp NOW().

### 3.3. Acreditación Individual
- Graduado: PUT /api/egresados/:id/presente
- Acompañante: PUT /api/invitados/:id/presente

### 3.4. Métricas de Asistencia en Tiempo Real
- **Endpoint**: GET /api/asistencia
- **Respuesta**: Totales de graduados e invitados en sala, capacidad y porcentaje de asistencia.

---

## 4. Roles y Seguridad de Acceso

| Rol | Acceso a la Plataforma | Vista Predeterminada |
|---|---|---|
| SUPERADMIN | Total a todos los módulos | Dashboard Bento Grid / Menú General |
| ADMIN | Gestión académica y ceremonias | Dashboard Bento Grid / Menú General |
| SOPORTE | Mantenimiento y Centro de Control | Centro de Control |
| PORTERIA / SEGURIDAD | Control de Ingreso y Escaneo | **ControlIngreso (Modo Operativo Directo)** |
| EGRESADO | Portal del Graduado | Portal del Graduado / Selección de Asientos |

---

## 5. Live Sync (Sincronización en Vivo)

Cuando un operador en portería registra un ingreso:
1. Se despacha emitirCambioSync('EGRESADOS', { id }) e emitirCambioSync('INVITADOS', { egresadoId }).
2. Las pantallas de Administración, Reportes y el Mapa de Butacas se actualizan automáticamente sin necesidad de recargar la página (F5).
3. El semáforo auditado de capacidad y asientos ocupados refleja el ingreso en tiempo real.

---

## 6. Feedback Auditivo y Accesibilidad

El lector de acreditación incluye un sintetizador Web Audio API integrado (sin dependencias externas):
- **Tono Armónico Ascendente**: Ingreso exitoso y habilitado.
- **Tono de Alerta (Doble Pitido)**: Persona o grupo que ya había ingresado previamente.
- **Tono Grave de Error**: Credencial no encontrada o token revocado.
- **Indicador de Accesibilidad**: Alerta destacada en pantalla para acompañantes con movilidad reducida.
