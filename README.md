<p align="center">
  <img src="https://sigic-one.vercel.app/logo-oficial.png" alt="Logo SiGIC" width="220" />
</p>

<h1 align="center">SiGIC</h1>
<p align="center">
  <strong>Sistema de Gestión Integral de Colación y Ceremonias</strong><br>
  <em>Instituto Tecnológico Beltrán — Proyecto Final 2026</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_Native-Expo-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Cloud-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <a href="https://sigic-one.vercel.app">🌐 Ver Demo en Vivo</a>
</p>

> [!NOTE]
> La plataforma está desplegada en producción en Vercel con infraestructura serverless y base de datos PostgreSQL en Neon Cloud.

---

## Descripción

SiGIC es una plataforma integral desarrollada para planificar, coordinar y ejecutar ceremonias de colación de principio a fin. El sistema optimiza el flujo de acreditaciones, distribución de butacas en tiempo real, gestión de acompañantes y control de accesos mediante credenciales digitales con códigos QR, garantizando un evento ágil, moderno y seguro.

---

## ¿Qué Resuelve?

El sistema cubre todo el ciclo operativo de un acto de colación institucional:

| Módulo | Descripción |
|---|---|
| **Gestión de Ceremonias** | Creación y administración de múltiples ceremonias con activación en vivo |
| **Padrón de Graduados** | Importación masiva desde Excel/CSV y altas individuales |
| **Invitaciones** | Autogestión del egresado para asignar acompañantes bajo los límites configurados |
| **Editor de Anfiteatro** | Distribución visual de sectores y asignación dinámica de butacas |
| **Acreditación QR** | App móvil para escaneo de credenciales y control de firmas digitales |
| **Portería y Autorización** | Matriz de autorizaciones por portero y ceremonia desde la plataforma web |
| **Centro de Control** | Diagnósticos en vivo, backups JSON y herramientas de administración del servidor |

---

## Estructura del Proyecto

```text
SiGIC/
├── codigo/
│   ├── plataforma/              # Plataforma Web y API Serverless (Next.js + Neon PostgreSQL)
│   └── movil-reactnative/       # Aplicación móvil de Acreditación (React Native + Expo)
├── respaldo_legacy/             # Respaldo de código clásico V1 (Vite + Express) — Gitignored
├── scripts/                     # Herramientas administrativas locales de Windows (.NET 8)
├── MANUAL.md                    # Manual de usuario (Administración, Alumnos y Portería)
├── LEEME.md                     # Guía técnica de desarrollo y seguridad
├── README.md                    # Este archivo
├── CHANGELOG.md                 # Historial de versiones y cambios
└── .gitignore
```

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend Web** | React 19, Next.js 15 (App Router), Tailwind CSS |
| **Backend / API** | Next.js Serverless Functions (API Routes) |
| **Base de Datos** | PostgreSQL (Neon Cloud, con `pg` pool nativo) |
| **Autenticación** | JWT HS256, OTP por email (Nodemailer + SMTP) |
| **Aplicación Móvil** | React Native, Expo SDK 52, Expo Camera / BarcodeScanner |
| **Despliegue Web** | Vercel (serverless, CDN global) |
| **Herramientas Admin** | .NET 8 (scripts locales de Windows para tareas de mantenimiento) |

---

## Seguridad del Sistema

> [!IMPORTANT]
> **Autenticación con JWT:** Todas las llamadas a la API están protegidas mediante tokens JWT firmados `HS256`. La validación de roles y permisos se calcula directamente en el servidor para evitar falsificaciones en el cliente.

- **OTP y Enlaces de Autenticación:** Los egresados inician sesión mediante códigos OTP de un solo uso o links únicos generados mediante hashes criptográficamente seguros (`crypto.randomBytes`).
- **Autorización por Ceremonia:** El personal de portería requiere autorización individual por ceremonia. El acceso a la API se bloquea dinámicamente si el portero no está asignado al evento activo.
- **Control de Tasa (Rate Limiting):** Limitador en memoria para neutralizar intentos de fuerza bruta en endpoints de autenticación.
- **Protección TLS:** Conexión cifrada obligatoria hacia PostgreSQL (Neon Cloud) mediante `sslmode=require`.

---

## Puesta en Marcha

### Requisitos Previos

- **Node.js** v20 o v22 (LTS)
- **NPM** (gestor de paquetes de Node)
- **Expo Go** en dispositivo móvil (para desarrollo móvil rápido)

### 1. Plataforma Web (Next.js)

```bash
# Ingresar al directorio
cd codigo/plataforma

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

> Crea un archivo `.env.local` con las credenciales de base de datos (PostgreSQL), secreto JWT y SMTP.
> Ver detalles completos en [`codigo/plataforma/README.md`](codigo/plataforma/README.md).

### 2. Aplicación Móvil (React Native)

```bash
# Ingresar al directorio
cd codigo/movil-reactnative

# Instalar dependencias
npm install

# Iniciar bundler de Expo
npx expo start
```

Escanea el código QR de Metro con la cámara (iOS) o Expo Go (Android) para ejecutar la app.
Ver detalles completos en [`codigo/movil-reactnative/README.md`](codigo/movil-reactnative/README.md).

---

## Documentación

| Archivo | Contenido |
|---|---|
| [`MANUAL.md`](MANUAL.md) | Manual de usuario completo (Administradores, Egresados y Portería) |
| [`LEEME.md`](LEEME.md) | Guía técnica de desarrollo, variables de entorno y ecosistema de seguridad |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial detallado de versiones y cambios |
| [`codigo/plataforma/README.md`](codigo/plataforma/README.md) | Documentación específica de la plataforma web Next.js |
| [`codigo/movil-reactnative/README.md`](codigo/movil-reactnative/README.md) | Documentación específica de la app móvil React Native |

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
