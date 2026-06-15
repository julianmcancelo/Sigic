<p align="center">
  <img src="codigo/plataforma-nextjs/public/logo-oficial.png" alt="Logo SiGIC" width="220" />
</p>

<h1 align="center">SiGIC</h1>
<p align="center">
  <strong>Sistema de Gestión Integral de Colación y Ceremonias</strong><br>
  <em>Instituto Tecnológico Beltrán — Proyecto Final 2026</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_Native-Expo-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vercel-Cloud-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

> [!NOTE]
> La plataforma se encuentra optimizada para su despliegue serverless e infraestructura cloud en Vercel y Neon DB.

---

## Descripción

SiGIC es una plataforma integral desarrollada para planificar, coordinar y ejecutar ceremonias de colación de principio a fin. El sistema optimiza el flujo de acreditaciones, distribución de butacas en tiempo real, gestión de acompañantes y control de accesos mediante credenciales digitales con códigos QR, garantizando un evento ágil, moderno y seguro.

---

## ¿Qué Resuelve?

El sistema cubre todo el ciclo operativo de un acto de colación institucional:

*   **Gestión Multi-Hábitat:** Creación y administración independiente de múltiples ceremonias (activación de ceremonias en vivo).
*   **Padrón de Graduados:** Importación masiva de egresados desde planillas de cálculo (Excel/CSV), altas individuales y edición de datos académicos.
*   **Invitaciones y Acompañantes:** Sistema autogestionado para que el egresado asigne a sus invitados bajo los límites configurados.
*   **Editor Visual de Anfiteatro:** Distribución de sectores y asignación dinámica de butacas (egresados distinguidos, familiares, autoridades).
*   **Acreditación por QR (Portería):** App móvil del personal de seguridad para el escaneo de credenciales, control de firmas digitales y acreditación instantánea.
*   **Consola de Monitoreo:** Estadísticas en vivo de ingresos, latencias y reportes de asistencia.

---

## Estructura Limpia del Proyecto

El código fuente principal está consolidado en dos aplicaciones activas (web y móvil), manteniendo el código antiguo apartado del árbol activo:

```text
SiGIC/
├── codigo/
│   ├── plataforma-nextjs/       # Plataforma Web y API Serverless (Next.js + Neon PostgreSQL)
│   └── movil-reactnative/       # Aplicación móvil de Acreditación (React Native + Expo)
├── respaldo_legacy/             # Respaldo de código clásico V1 (Vite + Node Express) - Gitignored
├── scripts/                     # Herramientas administrativas locales de Windows (.NET 8)
├── MANUAL.md                    # Manual de usuario completo (Administración, Alumnos y Portería)
├── LEEME.md                     # Guía técnica de desarrollo y seguridad (Español)
├── README.md                    # Este archivo de presentación general
├── CHANGELOG.md                 # Historial de versiones y cambios
└── .gitignore
```

---

## Seguridad del Sistema

El ecosistema de seguridad de SiGIC opera bajo estrictos estándares de producción:

> [!IMPORTANT]
> **Autenticación con JWT:** Todas las llamadas a la API están protegidas mediante tokens JWT firmados `HS256`. La validación de roles y permisos se calcula directamente en el servidor para evitar falsificaciones en el cliente.

*   **OTP y Enlaces de Autenticación:** Los egresados inician sesión mediante códigos OTP de un solo uso o mediante links únicos generados mediante hashes criptográficamente seguros.
*   **Control de Accesos de Seguridad:** El personal de portería cuenta con una matriz de autorizaciones individuales por ceremonia. El acceso a la API se bloquea dinámicamente si el portero no está asignado a la ceremonia activa actual.
*   **Control de Tasa (Rate Limiting):** El servidor cuenta con control de peticiones en memoria para neutralizar intentos de fuerza bruta en los endpoints de autenticación.
*   **Protección TLS:** Conexión cifrada obligatoria hacia PostgreSQL (Neon Cloud) mediante `sslmode=require`.

---

## Puesta en Marcha

### Requisitos Previos
- **Node.js** v20 o v22 (LTS)
- **NPM** (gestor de paquetes de Node)
- **Expo Go** en dispositivo móvil (opcional, para desarrollo móvil rápido)

### 1. Iniciar la Plataforma Web (Next.js)
1. Ve al directorio del frontend/backend:
   ```bash
   cd codigo/plataforma-nextjs
   ```
2. Crea un archivo `.env.local` con las credenciales de base de datos (PostgreSQL), secreto JWT y SMTP (ver detalles en `codigo/plataforma-nextjs/README.md`).
3. Instala e inicia el servidor de desarrollo:
   ```bash
   npm install
   npm run dev
   ```

### 2. Iniciar la Aplicación Móvil (React Native)
1. Ve al directorio del móvil:
   ```bash
   cd codigo/movil-reactnative
   ```
2. Instala e inicia el bundler de Expo:
   ```bash
   npm install
   npx expo start
   ```
3. Escanea el código QR de Metro con la cámara (iOS) o Expo Go (Android) para ejecutar la app.

---

## Manual de Usuario Completo

Para conocer en detalle el flujo operativo de la plataforma para cada rol de usuario (Administradores, Egresados y Portería), consulte nuestro **[Manual de Usuario Completo (MANUAL.md)](file:///d:/Sigic/MANUAL.md)** en la raíz del repositorio.

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
