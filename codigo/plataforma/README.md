<p align="center">
  <img src="https://sigic-one.vercel.app/logo-oficial.png" alt="Logo SiGIC" width="200" />
</p>

<h1 align="center">SiGIC — Plataforma Web</h1>
<p align="center">
  <strong>Backend API Serverless + Panel Administrativo (Next.js)</strong><br>
  <em>Instituto Tecnológico Beltrán — Proyecto Final 2026</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Cloud-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center">
  <a href="https://sigic-one.vercel.app">🌐 Ver en Producción → sigic-one.vercel.app</a>
</p>

---

## Descripción General

Este directorio contiene la **plataforma central unificada** de SiGIC, desarrollada con **Next.js 15**. Consolida en una sola aplicación:

- **El panel administrativo** (React 19 + Tailwind CSS, con diseño Bento Grid premium)
- **La API Serverless** (rutas API de Next.js que reemplazan el servidor Express de la V1)
- **La conexión a base de datos** (PostgreSQL en Neon Cloud, pool nativo con `pg`)

---

## Características

| Módulo | Descripción |
|---|---|
| **API Serverless Unificada** | Ruteador dinámico en `api/[...slug]/` que maneja todo el sistema |
| **Panel Bento Grid (V2)** | Diseño premium con micro-animaciones, sombras slate y tipografía Outfit |
| **Centro de Control** | Diagnósticos en vivo de latencia, backups JSON con un clic, y factory reset |
| **Editor de Anfiteatro** | Distribución visual interactiva de sectores y butacas |
| **Gestión de Portería** | Autorización por ceremonia del personal de seguridad y generación de QRs |
| **Portal de Egresados** | Acceso seguro con OTP por email, selección de asientos y gestión de invitados |
| **Panel de Reportes** | Gráficos de asistencia e ingresos por ceremonia en tiempo real |

---

## Estructura del Código

```text
plataforma/
├── public/                     # Assets públicos (logos, favicons, credencial QR template)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   ├── [...slug]/      # Controlador dinámico de todos los endpoints del sistema
│   │   │   ├── auth/login/     # Login seguro con generación de tokens JWT
│   │   │   └── auth/sesion/    # Validación persistente de sesiones (web + móvil)
│   │   ├── layout.tsx          # Layout HTML principal
│   │   └── page.tsx            # Entry point de la aplicación
│   ├── componentes/            # Componentes reutilizables de React
│   │   ├── panel/              # Widgets del dashboard (fecha, clima, accesos rápidos)
│   │   ├── ModalCredencial.jsx # Generador y visualizador de credenciales QR
│   │   ├── ModalImportar.jsx   # Importador masivo de egresados (Excel/CSV)
│   │   └── ...
│   ├── layouts/                # Plantillas de layout (autenticación, dashboard)
│   ├── lib/                    # Módulos del servidor
│   │   ├── api.ts              # Cliente HTTP asíncrono para llamadas internas
│   │   ├── auth-middleware.ts  # Verificador de JWT y validación de roles
│   │   ├── db.ts               # Pool de conexión a PostgreSQL (Neon)
│   │   ├── email.ts            # Configuración SMTP y envío de invitaciones
│   │   ├── otp.ts              # Generación y validación de códigos OTP
│   │   └── tokens.ts           # Firma y verificación de tokens JWT
│   ├── paginas/
│   │   ├── v2/                 # Vistas modernas Bento Grid (interfaz activa)
│   │   │   ├── CentroControl.jsx       # Diagnóstico, backups y system reset
│   │   │   ├── GestionCeremonias.jsx   # CRUD de ceremonias
│   │   │   ├── GestionGraduados.jsx    # Padrón de egresados e importación
│   │   │   ├── GestionPorteria.jsx     # Personal de seguridad y autorizaciones
│   │   │   ├── GestionProfesores.jsx   # Gestión de docentes
│   │   │   ├── EditorAnfiteatro.jsx    # Editor visual de butacas
│   │   │   ├── PanelReportes.jsx       # Gráficos y estadísticas
│   │   │   └── PanelAjustes.jsx        # Configuración del sistema
│   │   └── PantallaBienvenida.jsx      # Vista clásica V1 (referencia)
│   ├── utilidades/             # Formateadores de fecha, controlador de clima
│   └── App.jsx                 # Orquestador del ruteo del cliente (SPA)
├── next.config.ts              # Configuración del compilador y Turbopack
└── package.json                # Dependencias del proyecto
```

---

## Puesta en Marcha Local

### Requisitos Previos

- **Node.js** v20 o v22 (LTS recomendado)
- **NPM** (o Yarn, Pnpm, Bun)
- Credenciales de acceso a una base de datos **PostgreSQL** (Neon Cloud o local)

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz de `codigo/plataforma/` con la siguiente estructura:

```env
# Conexión a Base de Datos (Neon PostgreSQL o Postgres local)
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/sigic?sslmode=require"

# Secretos y Firmas Criptográficas
JWT_SECRET="tu_secreto_super_seguro_de_al_menos_32_caracteres"

# Configuración del Servidor de Correo (Notificaciones SMTP)
EMAIL_HOST="smtp.ejemplo.com"
EMAIL_PORT=465
EMAIL_SECURE="true"
EMAIL_USER="notificaciones@sigic.com"
EMAIL_PASS="tu_contraseña_smtp"
```

### 2. Instalación e Inicio

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con Turbopack
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### 3. Compilación de Producción

```bash
npm run build
```

---

## Despliegue en Vercel

La plataforma está configurada para desplegarse automáticamente en Vercel al hacer push a `master`.

> [!IMPORTANT]
> En el Dashboard de Vercel, el **Root Directory** debe estar configurado como `codigo/plataforma`.
> Las variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `EMAIL_*`) deben estar definidas en **Settings → Environment Variables** del proyecto en Vercel.

---

## Seguridad

- **JWT HS256:** Login web y móvil genera tokens firmados. Los roles se validan en el servidor en cada endpoint.
- **OTP por Email:** Los egresados acceden con códigos de un solo uso generados con `crypto.randomBytes`.
- **Rate Limiting:** Limitador en memoria en rutas de autenticación para neutralizar fuerza bruta.
- **SSL Forzado:** Conexiones a Neon PostgreSQL bajo `sslmode=require`.
- **Autorización Dinámica:** Personal de portería bloqueado automáticamente si no está habilitado para la ceremonia activa.

---

## Equipo de Desarrollo

- **Alfonso Alan Alexis**
- **Cancelo Julian**
- **Contreras Villalba Sol Heilin**
- **Frassia Matias**
- **Santillan Luis Gabriel**

**Instituto Tecnológico Beltrán — 2026**
