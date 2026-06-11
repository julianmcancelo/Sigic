# Changelog SiGIC

## 2026-06-09
### Seguridad
- Implementamos autenticacion real con tokens de sesion firmados (JWT HS256, sin dependencias externas):
  - el login emite un token con el rol verificado por el servidor,
  - eliminamos la autorizacion por header `x-rol` (era falsificable por el cliente),
  - los egresados reciben un token propio limitado a sus datos (via OTP o link de invitacion).
- Protegimos todos los endpoints de gestion (egresados, invitados, ceremonias, configuracion, profesores, usuarios, stats) con autorizacion por rol en el servidor.
- Agregamos rate limiting en login, solicitud/verificacion de OTP e inicializacion del sistema.
- El OTP se invalida despues de 5 intentos fallidos.
- Reemplazamos los tokens de invitacion basados en `Math.random()` por codigos criptograficamente seguros.
- Dejamos de loguear los cuerpos de las peticiones (contenian contrasenas y codigos OTP) y eliminamos logs de depuracion del OTP.
- Activamos la verificacion del certificado TLS hacia PostgreSQL (Neon).
- CORS configurable por `CORS_ORIGINS`, cabeceras de seguridad y limite de tamano de JSON.
- Politica de contrasenas (minimo 8 caracteres) y bcrypt con factor 12.
- Proteccion contra dejar el sistema sin SUPER_ADMIN activo.
- Nuevo `.env.example` sin secretos y seccion de seguridad en `LEEME.md`.

### Actualizado
- Control Center reescrito como aplicacion nativa de Windows 11 (v5.0.0):
  - sin dependencias externas (se elimina customtkinter; solo libreria estandar de Python),
  - estetica Fluent estilo app Configuracion: tipografia Segoe UI Variable, tarjetas, panel de navegacion,
  - color de acento real del sistema (leido del Registro de Windows),
  - tema claro/oscuro que sigue la preferencia del sistema (configurable: sistema/claro/oscuro),
  - barra de titulo oscura nativa via DWM y conciencia de DPI para texto nitido,
  - consola estilo Terminal de Windows (Cascadia Mono) con colores por tipo de mensaje.
- La app de porteria (Flutter) ahora inicia sesion contra el backend y envia el token en cada operacion.
- Los frontends web y movil envian el token de sesion en el header `Authorization`.
- Pagina raiz del backend redisenada y salida de consola del arranque mas clara.
- Migracion automatica de la tabla `usuarios_sistema` en SQLite local para los nuevos roles.

## 2026-05-24
### Actualizado
- Reorganizamos la raiz del proyecto para una estructura mas clara (`docs`, `tools`, `Assets/logos`).
- Limpiamos artefactos de desarrollo y archivos basura en frontend, backend y mobile.
- Mejoramos el Control Center en Python para monitoreo operativo de backend, frontend y base de datos.
- Corregimos arranque del backend para inicializacion de base con manejo asincrono y error controlado.
- Agregamos soporte de entorno dinamico en frontend para `VITE_API_BASE_URL`.
- Integramos setup inicial del sistema:
  - endpoint de estado (`GET /api/setup/status`),
  - endpoint de inicializacion (`POST /api/setup/initialize`),
  - asistente de configuracion inicial en frontend.
- Reemplazamos login admin de demo por login real contra backend (`/api/auth/login`).
- Agregamos script de limpieza de datos operativos en backend (`npm run db:reset-datos`).
- Reescribimos README en formato limpio, sin emojis, con lenguaje propio del equipo.

