<p align="center">
  <img src="https://sigic-one.vercel.app/logo-oficial.png" alt="Logo SiGIC" width="180" />
</p>

<h1 align="center">SiGIC Accesos — App Móvil</h1>
<p align="center">
  <strong>Control de accesos y acreditación QR para ceremonias de colación</strong><br>
  <em>Instituto Tecnológico Beltrán — Proyecto Final 2026</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Flutter-Dart-02569B?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter" />
  <img src="https://img.shields.io/badge/Shorebird-Code_Push-FF6B35?style=for-the-badge" alt="Shorebird" />
  <img src="https://img.shields.io/badge/Android-iOS-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android e iOS" />
</p>

---

## Descripción

**SiGIC Accesos** es la aplicación móvil oficial del sistema SiGIC para el personal de portería. Permite escanear credenciales QR de egresados e invitados el día del evento, validando el acceso en tiempo real contra la API de la plataforma web.

La app está desarrollada en **Flutter** y se distribuye en producción con **Shorebird** (actualizaciones OTA sin pasar por tiendas de aplicaciones).

---

## Características

- **Escáner QR en tiempo real** con `mobile_scanner`
- **Búsqueda manual** por nombre, DNI o legajo como respaldo al escaneo
- **Validación en línea** contra la API de SiGIC (`/api/invitados/buscar`)
- **Acreditación grupal:** marca como presentes al egresado y todos sus invitados a la vez
- **Panel de estadísticas:** ingresos totales, presentes y grupos confirmados
- **Selector de ceremonia:** el portero puede cambiar entre ceremonias autorizadas
- **Autenticación segura:** login con usuario y contraseña del sistema, token JWT almacenado de forma segura
- **Modo offline limitado:** las credenciales escaneadas se registran en cola si no hay conexión
- **Actualizaciones OTA** con Shorebird sin necesidad de nueva publicación en tienda

---

## Estructura del Código

```text
movil_flutter/
├── lib/
│   ├── main.dart                     # Entry point
│   ├── aplicacion_sigic.dart         # Configuración de la app y tema
│   ├── modelos/
│   │   ├── ceremonia.dart
│   │   ├── ceremonia_autorizada.dart
│   │   ├── estadisticas_acceso.dart
│   │   ├── grupo_asistencia.dart
│   │   ├── resultado_escaneo.dart
│   │   └── usuario_sesion.dart
│   ├── pantallas/                    # Vistas de la app
│   ├── servicios/
│   │   ├── servicio_api.dart         # Cliente HTTP — comunicación con el backend SiGIC
│   │   ├── servicio_almacenamiento.dart # Persistencia local (token, usuario, URL API)
│   │   ├── servicio_release.dart     # Info de versión de la app
│   │   └── servicio_shorebird.dart   # Integración Shorebird Code Push
│   ├── widgets/                      # Componentes UI reutilizables
│   └── nucleo/                       # Constantes y utilidades compartidas
├── assets/                           # Logos e imágenes
├── android/
├── ios/
├── pubspec.yaml
└── shorebird.yaml
```

---

## Puesta en Marcha Local

### Requisitos

- **Flutter SDK** (canal stable, v3.x o superior)
- **Shorebird CLI** (para builds de producción y OTA)
- Dispositivo físico o emulador Android/iOS

### Desarrollo

```bash
cd codigo/movil_flutter
flutter pub get
flutter run
```

La app se conecta por defecto a `https://sigic-one.vercel.app/api`. Podés cambiar la URL desde la pantalla de configuración dentro de la app.

---

## Autenticación

El personal de portería inicia sesión con sus credenciales de usuario del sistema (rol `PORTERIA`). La app:

1. Hace `POST /api/auth/login` → recibe un token JWT
2. Llama `GET /api/auth/sesion` para validar que el usuario tiene ceremonias autorizadas
3. Almacena el token de forma segura localmente
4. Envía el token en el header `Authorization: Bearer <token>` en cada petición

> [!IMPORTANT]
> Para que un usuario de portería pueda ingresar a la app, un administrador debe asignarle al menos una ceremonia desde el panel de **Gestión de Portería** en la plataforma web. Sin esa asignación, el servidor responde 403.

---

## Producción con Shorebird

```bash
# Login con la cuenta de Shorebird
shorebird login

# Release inicial (genera el bundle para las tiendas)
shorebird release android
shorebird release ios

# Parche OTA (actualización sin tienda)
shorebird patch android
shorebird patch ios
```

Las actualizaciones OTA se aplican automáticamente al iniciar la app. No requieren intervención del usuario ni aprobación de tienda.

---

## Endpoints Utilizados

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/api/auth/login` | Autenticación con email y contraseña |
| `GET` | `/api/auth/sesion` | Validación de sesión activa y ceremonias autorizadas |
| `GET` | `/api/ceremonias/activa` | Ceremonia activa del sistema |
| `GET` | `/api/ceremonias/autorizadas` | Ceremonias autorizadas para el portero |
| `POST` | `/api/invitados/buscar` | Búsqueda de grupo por código QR |
| `GET` | `/api/invitados/buscar/:codigo` | Búsqueda alternativa por GET |
| `PUT` | `/api/invitados/:id/presente` | Acreditar un invitado |
| `PUT` | `/api/invitados/presente-masivo` | Acreditar múltiples invitados |
| `PUT` | `/api/egresados/:id/presente` | Acreditar al egresado |
| `GET` | `/api/stats` | Estadísticas de ingresos de la ceremonia |
| `POST` | `/api/dispositivos/registrar` | Registro del dispositivo en el sistema |

---

## Equipo de Desarrollo

- Alfonso Alan Alexis
- Cancelo Julian
- Contreras Villalba Sol Heilin
- Frassia Matias
- Santillan Luis Gabriel

**Instituto Tecnológico Beltrán — 2026**
