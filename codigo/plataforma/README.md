<p align="center">
  <img src="https://sigic-one.vercel.app/logo-oficial.png" alt="Logo SiGIC" width="200" />
</p>

<h1 align="center">SiGIC — Plataforma Web</h1>
<p align="center">
  <strong>Panel Administrativo + API Serverless (Next.js 16)</strong><br>
  <em>Instituto Tecnológico Beltrán — Proyecto Final 2026</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Cloud-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <a href="https://sigic-one.vercel.app">Ver en Producción &rarr; sigic-one.vercel.app</a>
</p>

---

## Descripción General

Este directorio contiene la **plataforma central unificada** de SiGIC, desarrollada con **Next.js 16** y **React 19**. Consolida en una sola aplicación:

- **El panel administrativo** (React 19 + Tailwind CSS 4, diseño Bento Grid institucional)
- **El portal del egresado** (acceso por OTP/token, inscripción, credencial 3D con lanyard)
- **La API Serverless** (ruteador catch-all `api/[...slug]/` que centraliza todos los endpoints)
- **La conexión a base de datos** (PostgreSQL en Neon Cloud, pool nativo `pg`, SSL forzado)

---

## Módulos Activos

| Módulo | Descripción |
|---|---|
| **API Serverless Unificada** | Ruteador dinámico `api/[...slug]/` — todos los endpoints del sistema en un solo catch-all |
| **Panel Bento Grid (V2)** | Dashboard premium con widgets de estadísticas, clima, accesos rápidos y animaciones |
| **Portal del Egresado** | Acceso por OTP o token de invitación, confirmación, selección de butacas e invitados |
| **Credencial Digital 3D** | Credencial con lanyard animado (física pendular en tres ejes), cinta azul marino oscuro |
| **Pase Imprimible A4** | Documento oficial generado al imprimir: datos de ceremonia, QR y tabla de acompañantes |
| **Editor de Anfiteatro** | Distribución visual interactiva de sectores y butacas por ceremonia |
| **Gestión de Portería** | Autorización de personal por ceremonia, generación de QR de acceso por turno (8 h) |
| **Centro de Control** | Diagnósticos en vivo, backups JSON con un clic, factory reset y auditoría del sistema |
| **Panel de Reportes** | Gráficos de asistencia e ingresos por ceremonia en tiempo real |
| **Asistente de Configuración** | Wizard de primera puesta en marcha: usuario admin, ceremonia y configuración base |

---

## Estructura del Código

```text
plataforma/
├── public/
│   ├── logo-oficial.png          # Logo institucional (fuente)
│   ├── logo.png                  # Alias del logo (referenciado por vistas de login)
│   └── manual/                   # Capturas del manual integrado
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── [...slug]/        # Catch-all: todos los endpoints del sistema
│   │   │   ├── auth/login/       # POST — autenticación con JWT
│   │   │   └── auth/sesion/      # GET  — validación de sesión activa
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx              # Entry point: renderiza <App />
│   ├── App.jsx                   # Orquestador SPA — estado global, navegación y sesiones
│   ├── componentes/
│   │   ├── graduado/
│   │   │   ├── CredencialLanyard3D.jsx        # Credencial interactiva con física 3D
│   │   │   └── PantallaCredencialConfirmada.jsx # Vista post-confirmación (Bento Grid)
│   │   ├── ModalCredencial.jsx               # Generador/visualizador de credencial QR
│   │   ├── ModalImportar.jsx                 # Importador masivo (Excel/CSV)
│   │   └── ...
│   ├── paginas/
│   │   ├── operacion/
│   │   │   ├── CentroControl.jsx
│   │   │   ├── EditorAnfiteatro.jsx
│   │   │   ├── GestionCeremonias.jsx
│   │   │   ├── GestionGraduados.jsx
│   │   │   ├── GestionPorteria.jsx
│   │   │   ├── GestionProfesores.jsx
│   │   │   ├── PanelAjustes.jsx
│   │   │   └── PanelReportes.jsx
│   │   ├── PanelGraduado.jsx     # Portal completo del egresado
│   │   └── ...
│   ├── lib/
│   │   ├── auth-middleware.ts    # Verificador de JWT y validación de roles
│   │   ├── db.ts                 # Pool de conexión PostgreSQL (Neon)
│   │   ├── email.ts              # Envío de invitaciones y credenciales (Nodemailer)
│   │   ├── otp.ts                # Generación y validación de OTP
│   │   ├── schema.ts             # Inicialización y migración de tablas
│   │   └── tokens.ts             # Firma y verificación JWT
│   └── utilidades/
│       ├── clima.js
│       └── formatear-fecha.js
├── next.config.ts
└── package.json
```

---

## Puesta en Marcha Local

### Requisitos

- **Node.js** v20 o v22 (LTS recomendado)
- **NPM**
- Credenciales de una base de datos **PostgreSQL** (Neon Cloud o local)

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz de `codigo/plataforma/`:

```env
# Base de datos (Neon PostgreSQL o local)
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/sigic?sslmode=require"

# JWT
JWT_SECRET="secreto_de_al_menos_32_caracteres"

# SMTP (Nodemailer)
EMAIL_HOST="smtp.ejemplo.com"
EMAIL_PORT=465
EMAIL_SECURE="true"
EMAIL_USER="notificaciones@sigic.com"
EMAIL_PASS="contraseña_smtp"

# URL pública (para generar links en emails)
NEXT_PUBLIC_APP_URL="https://sigic-one.vercel.app"
```

### 2. Instalación e Inicio

```bash
npm install
npm run dev      # Turbopack — http://localhost:3000
```

### 3. Build de Producción

```bash
npm run build
npm start
```

---

## Despliegue en Vercel

La plataforma se despliega automáticamente al hacer push a `master`.

> [!IMPORTANT]
> En el Dashboard de Vercel, el **Root Directory** debe estar configurado como `codigo/plataforma`.
> Las variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `EMAIL_*`, `NEXT_PUBLIC_APP_URL`) deben estar definidas en **Settings → Environment Variables**.

---

## Arquitectura SPA

`App.jsx` es el orquestador central. No usa el router de Next.js para navegación interna; toda la lógica de pantallas se controla con el estado `vistaActual` / `pantallaAdmin`.

### Flujo del Portal del Egresado

1. Egresado ingresa por su enlace de invitación (`?token=...`) o solicita OTP
2. Si su estado es `PENDIENTE` → pantalla de aceptación
3. Si su estado es `ACEPTADO` → panel con tabs: Juramento · Acompañantes · Entregadores · Butacas · Credencial
4. Si su estado es `CONFIRMADO` → acceso directo a la pantalla de credencial con lanyard 3D

### Interceptor de Sesión

El fetch global en `App.jsx` captura errores 401 y cierra la sesión automáticamente. Los tokens que comienzan con `bypass-` (modo Expositor/demo) son ignorados por el interceptor.

---

## Seguridad

- **JWT HS256:** todos los endpoints protegidos validan token, rol y versión de sesión en la BD.
- **OTP por email:** los egresados acceden con códigos de un solo uso generados con `crypto.randomBytes`.
- **Rate Limiting:** contadores atómicos en la tabla `auth_rate_limits` de PostgreSQL, compartidos entre instancias serverless.
- **SSL forzado:** conexiones a Neon bajo `sslmode=require`.
- **Autorización dinámica:** portería bloqueada automáticamente si no está habilitada para la ceremonia activa (`ceremonias_usuarios_autorizados`).
- **Desbloqueo:** cuentas bloqueadas por rate limiting se reactivan limpiando `auth_rate_limits` y actualizando `activo = 1` en `usuarios_sistema`.

---

## Convenciones del Código

- Todo el código en **español** (variables, funciones, comentarios, componentes).
- Componentes en **PascalCase**, archivos `.jsx`.
- Estilos con **Tailwind CSS** — sin CSS Modules ni styled-components.
- Estado con `useState` + `useEffect` — sin Redux ni Zustand.
- Íconos con **Lucide React** — sin emojis.
- PowerShell: usar `;` como separador de comandos (no `&&`).

---

## Equipo de Desarrollo

- Alfonso Alan Alexis
- Cancelo Julian
- Contreras Villalba Sol Heilin
- Frassia Matias
- Santillan Luis Gabriel

**Instituto Tecnológico Beltrán — 2026**
