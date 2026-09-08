# Changelog SiGIC

## 2026-09-07
### Plataforma Web — Portal del Egresado
- **Pantalla de credencial confirmada:** nueva vista `PantallaCredencialConfirmada.jsx` que se muestra al completar el flujo de inscripción. Presenta un layout Bento Grid institucional con la credencial 3D interactiva, estadísticas de la ceremonia y acciones de descarga.
- **Credencial con lanyard 3D:** componente `CredencialLanyard3D.jsx` con física pendular, oscilación en tres ejes y cinta satinada azul marino oscuro. Responde al movimiento del cursor del usuario.
- **Pase imprimible A4:** al hacer clic en "Imprimir", el sistema genera un documento oficial de una página con datos de la ceremonia, tabla de acompañantes, código QR y pie institucional. No imprime más la interfaz completa.
- **Acceso directo a credencial por token:** los egresados con estado `CONFIRMADO` que ingresan por su enlace de invitación son redirigidos directamente a la credencial sin pasar por el flujo de inscripción.
- **Soporte de estado `CONFIRMADO`:** `App.jsx` y `PanelGraduado.jsx` reconocen correctamente el estado `CONFIRMADO` sin cerrar la sesión.
- **Sin emojis:** todos los emojis fueron reemplazados por íconos de Lucide React en toda la interfaz del portal del egresado y pantalla de selección de login.
- **Fix logo:** creado alias `public/logo.png` para vistas que referenciaban esa ruta. El logo oficial ahora se muestra correctamente en el login y el layout de autenticación.

### Plataforma Web — Backend
- **Fix desbloqueo de cuentas:** limpieza de la tabla `auth_rate_limits` y reactivación de cuentas bloqueadas por intentos fallidos. La columna `activo` en `usuarios_sistema` es de tipo `integer` (1 = activo, 0 = bloqueado).

---

## 2026-09-05
### Seguridad y roles
- Personal limitado a `ADMINISTRATIVO` y `PORTERIA`; acceso `egresado` conservado. Migración de roles anteriores sin eliminar cuentas.
- Eliminados los bypass del servidor; sesiones revocables y permisos comprobados contra la base de datos.
- Portería requiere asignaciones explícitas; QR de login limitado a portería activa por ocho horas.
- Protección transaccional del último administrativo y de la primera instalación.
- OTP criptográfico de un solo uso, límites compartidos en PostgreSQL y orígenes de API restringidos.
- Actualización de SheetJS y almacenamiento seguro de tokens en Flutter; HTTPS obligatorio en el móvil.
- Pruebas reproducibles de seguridad y [guía de migración](docs/SEGURIDAD.md).

## 2026-06-09
### Seguridad
- Autenticación real con tokens de sesión firmados (JWT HS256): el login emite un token con el rol verificado por el servidor; los egresados reciben un token propio limitado a sus datos (OTP o link de invitación).
- Eliminada la autorización por header `x-rol` (era falsificable por el cliente).
- Protegidos todos los endpoints de gestión con autorización por rol en el servidor.
- Rate limiting en login, solicitud/verificación de OTP e inicialización del sistema.
- OTP invalidado después de 5 intentos fallidos.
- Tokens de invitación reemplazados por códigos criptográficamente seguros (`crypto.randomBytes`).
- Activada la verificación del certificado TLS hacia PostgreSQL (Neon).
- CORS configurable por `CORS_ORIGINS`, cabeceras de seguridad y límite de tamaño de JSON.
- Política de contraseñas (mínimo 8 caracteres) y bcrypt con factor 12.
- Protección contra dejar el sistema sin administrador activo.

### Actualizado
- La app de portería (Flutter) inicia sesión contra el backend y envía el token en cada operación.
- Los frontends web y móvil envían el token de sesión en el header `Authorization`.

## 2026-05-24
### Actualizado
- Reorganización de la raíz del proyecto (`docs`, `tools`, `Assets/logos`).
- Setup inicial del sistema: endpoint de estado (`GET /api/setup/status`), endpoint de inicialización (`POST /api/setup/initialize`) y asistente de configuración inicial en frontend.
- Login admin real contra backend (`/api/auth/login`), reemplaza el demo estático.
- Script de limpieza de datos operativos en backend (`npm run db:reset-datos`).
