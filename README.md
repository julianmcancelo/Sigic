<p align="center">
  <img src="https://sigic-one.vercel.app/logo-oficial.png" alt="Logo SiGIC" width="220" />
</p>

<h1 align="center">SiGIC</h1>
<p align="center">
  <strong>Sistema de Gestión Integral de Colación y Ceremonias</strong><br>
  <em>Instituto Tecnológico Beltrán — Proyecto Final 2026</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Flutter-Shorebird-02569B?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter con Shorebird" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Cloud-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <a href="https://sigic-one.vercel.app">Ver en Producción &rarr; sigic-one.vercel.app</a>
  &nbsp;·&nbsp;
  <a href="https://demo.sigic.com.ar">Demo en Vivo &rarr; demo.sigic.com.ar</a>
</p>

> [!NOTE]
> La plataforma está desplegada en producción en Vercel con infraestructura serverless y base de datos PostgreSQL en Neon Cloud.

---

## Descripción

SiGIC es una plataforma integral desarrollada para planificar, coordinar y ejecutar ceremonias de colación de principio a fin. Automatiza la gestión del padrón de graduados, el envío de invitaciones, la selección de butacas, el registro de acompañantes, la generación de credenciales digitales con QR y el control de accesos el día del evento. Está pensado para que administradores, egresados y personal de portería operen desde una misma solución, sin papeles ni procesos manuales.

---

## ¿Qué Resuelve?

| Módulo | Descripción |
|---|---|
| **Gestión de Ceremonias** | Creación y administración de múltiples ceremonias con activación en vivo |
| **Padrón de Graduados** | Importación masiva desde Excel/CSV y altas individuales |
| **Invitaciones por Email** | Despacho masivo de invitaciones con enlace de acceso único por egresado |
| **Portal del Egresado** | Acceso seguro con OTP, confirmación de asistencia, registro de acompañantes y selección de butacas |
| **Credencial Digital** | Credencial QR con diseño institucional, lanyard animado y pase imprimible A4 |
| **Editor de Anfiteatro** | Distribución visual interactiva de sectores y asignación dinámica de butacas |
| **Acreditación QR** | App móvil Flutter para escaneo de credenciales y control de ingresos en tiempo real |
| **Portería y Autorización** | Matriz de autorizaciones por portero y ceremonia; QR de acceso por turno |
| **Panel de Reportes** | Gráficos de asistencia e ingresos por ceremonia en tiempo real |
| **Centro de Control** | Diagnósticos en vivo, backups JSON y herramientas de administración del sistema |

---

## Estructura del Proyecto

```text
SiGIC/
├── codigo/
│   ├── plataforma/              # Plataforma Web y API Serverless (Next.js + Neon PostgreSQL)
│   ├── movil_flutter/           # App de portería (Flutter + Shorebird OTA)
│   └── landing/                 # Sitio institucional estático
├── MANUAL.md                    # Manual de usuario (Administración, Egresados y Portería)
├── CHANGELOG.md                 # Historial de versiones y cambios
├── README.md                    # Este archivo
└── .gitignore
```

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend Web** | React 19, Next.js 16 (App Router + Turbopack), Tailwind CSS 4 |
| **Backend / API** | Next.js Serverless Functions — ruteador catch-all `api/[...slug]/` |
| **Base de Datos** | PostgreSQL (Neon Cloud, pool nativo `pg`, SSL forzado) |
| **Autenticación** | JWT HS256, OTP por email (`crypto.randomBytes` + Nodemailer) |
| **Íconos** | Lucide React (sin emojis en la interfaz) |
| **App Móvil** | Flutter, `mobile_scanner`, Shorebird Code Push |
| **Despliegue Web** | Vercel (push a `master` → deploy automático) |

---

## Flujo Principal del Egresado

```
Invitación por email → Acceso por token/OTP
       ↓
Aceptar asistencia
       ↓
Registrar acompañantes → Seleccionar butacas → Designar entregadores
       ↓
Credencial digital con QR (estado: CONFIRMADO)
       ↓
Pantalla de credencial con lanyard 3D + pase imprimible A4
       ↓
Día del evento: portería escanea QR con la app móvil
```

### Estados del Egresado

```
PENDIENTE → INVITADO → ACEPTADO → CONFIRMADO
                     ↘ RECHAZADO  (irreversible)
```

---

## Seguridad del Sistema

> [!IMPORTANT]
> **JWT HS256:** Todas las operaciones protegidas usan tokens firmados. El servidor verifica estado, rol y versión de sesión en cada petición. Personal con roles `ADMINISTRATIVO` y `PORTERIA`; egresados con identidad separada.

- **OTP y enlaces únicos:** los egresados acceden con códigos de un solo uso generados con `crypto.randomBytes`.
- **Autorización por ceremonia:** el personal de portería requiere asignación individual por evento. El acceso a la API se bloquea dinámicamente si el portero no está habilitado para la ceremonia activa.
- **Rate Limiting:** contadores atómicos en PostgreSQL compartidos entre instancias serverless, para limitar intentos de autenticación fallidos.
- **TLS forzado:** conexión cifrada obligatoria hacia PostgreSQL (Neon Cloud) con `sslmode=require`.
- **Desbloqueo de cuentas:** las cuentas bloqueadas por rate limiting se reactivan limpiando `auth_rate_limits` y seteando `activo = 1` en `usuarios_sistema`.

---

## Puesta en Marcha

### Requisitos Previos

- **Node.js** v20 o v22 (LTS)
- **NPM**
- **Flutter SDK** y Shorebird CLI (solo para la app móvil)

### 1. Plataforma Web (Next.js)

```bash
cd codigo/plataforma
npm install
npm run dev         # Servidor de desarrollo con Turbopack
```

Crea un archivo `.env.local` con las variables de entorno. Ver [`codigo/plataforma/README.md`](codigo/plataforma/README.md) para la referencia completa.

### 2. Aplicación Móvil (Flutter)

```bash
cd codigo/movil_flutter
flutter pub get
flutter run
```

Las actualizaciones OTA en producción se gestionan con Shorebird. Ver [`codigo/movil_flutter/README.md`](codigo/movil_flutter/README.md).

---

## Roles del Sistema

| Rol | Panel Admin | CRUD Graduados | Anfiteatro | Portería | Centro Control |
|---|:---:|:---:|:---:|:---:|:---:|
| Egresado | Solo su portal | — | Solo su butaca | — | — |
| Portería | Solo escáner móvil | — | Lectura | — | — |
| Administrativo | Completo | Edición | Edición | — | — |
| Soporte (`soporte@sigic.com.ar`) | Completo | — | — | Global | Total |

---

## Documentación

| Archivo | Contenido |
|---|---|
| [`MANUAL.md`](MANUAL.md) | Manual de usuario completo (Administradores, Egresados y Portería) |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial detallado de versiones y cambios |
| [`codigo/plataforma/README.md`](codigo/plataforma/README.md) | Documentación técnica de la plataforma web |
| [`codigo/movil_flutter/README.md`](codigo/movil_flutter/README.md) | Documentación de la app móvil Flutter |
| [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md) | Arquitectura de seguridad, variables de entorno y guía de migración de roles |

---

## Equipo de Desarrollo

Este proyecto fue desarrollado en el marco de las **Prácticas Profesionalizantes** del **Instituto Tecnológico Beltrán** por:

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/julianmcancelo.png" width="80px;" alt="Julian Cancelo"/><br />
      <sub><b>Cancelo Julian</b></sub>
    </td>
    <td align="center">
      <img src="https://github.com/identicons/alfonso.png" width="80px;" alt="Alfonso Alan Alexis"/><br />
      <sub><b>Alfonso Alan Alexis</b></sub>
    </td>
    <td align="center">
      <img src="https://github.com/identicons/contreras.png" width="80px;" alt="Contreras Villalba Sol Heilin"/><br />
      <sub><b>Contreras V. Sol</b></sub>
    </td>
    <td align="center">
      <img src="https://github.com/identicons/frassia.png" width="80px;" alt="Frassia Matias"/><br />
      <sub><b>Frassia Matias</b></sub>
    </td>
    <td align="center">
      <img src="https://github.com/identicons/santillan.png" width="80px;" alt="Santillan Luis Gabriel"/><br />
      <sub><b>Santillan Luis G.</b></sub>
    </td>
  </tr>
</table>

**Año del Proyecto:** 2026
