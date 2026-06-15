<p align="center">
  <img src="/logo-oficial.png" alt="Logo SiGIC" width="220" />
</p>

<h1 align="center">SiGIC - Plataforma Web (Next.js)</h1>
<p align="center">
  <strong>Centro de Control y API Serverless de la Plataforma</strong><br>
  <em>Instituto Tecnológico Beltrán — Proyecto Final 2026</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vercel-Cloud-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## Descripción General

Este directorio contiene la **plataforma central unificada** de SiGIC (Sistema de Gestión Integral de Colación y Ceremonias), desarrollada con **Next.js**. 

Anteriormente, el backend (Node.js Express) y el frontend administrativo (React Vite) se ejecutaban por separado. En esta versión optimizada para la nube, ambos componentes se consolidan en una arquitectura Next.js unificada, lo que permite el despliegue serverless instantáneo en **Vercel** y la conexión directa a la base de datos cloud **Neon PostgreSQL**.

---

## Características de la Plataforma Web

*   **API Serverless Integrada:** Endpoints rápidos de API localizados en `src/app/api/[...slug]/` que manejan de forma dinámica el flujo completo del sistema mediante un ruteador unificado de alto rendimiento.
*   **Diseño Bento Grid Premium (V2):** Panel administrativo con estética moderna, micro-animaciones dinámicas y componentes de interfaz limpios con Outfit y sombras slate.
*   **Centro de Control Web Integrado:** Diagnósticos en vivo de latencia, monitoreo de la conexión con Neon PostgreSQL, descargas de backups JSON de la base de datos con un clic y formateo de fábrica (System Reset) para volver a correr el Asistente de Setup.
*   **Editor de Anfiteatro Interactivo:** Modificación visual del anfiteatro y distribución interactiva de asientos para graduados, familiares, profesores y autoridades.
*   **Flujo de Acreditación (Portería Web):** Sección para autorizar y desautorizar de forma dinámica al personal de seguridad en ceremonias individuales y configurar sus códigos de acceso QR para la app móvil.

---

## Estructura del Código

El código del proyecto se organiza bajo la carpeta `src/` siguiendo el patrón estándar de Next.js:

```text
plataforma-nextjs/
├── public/                 # Assets de imagen públicos (logos, favicons y badges)
├── src/
│   ├── app/                # Ruteador Next.js App Router
│   │   ├── api/            # Directorio de APIs Serverless
│   │   │   ├── [...slug]/  # Controlador dinámico de endpoints del sistema
│   │   │   ├── auth/login  # Manejador seguro de logins con tokens JWT
│   │   │   └── auth/sesion # Validador persistente de sesiones móviles/web
│   │   ├── layout.tsx      # Layout HTML principal de Next.js
│   │   └── page.tsx        # Página de entrada principal
│   ├── componentes/        # Componentes reutilizables (Modales, Formularios, Anfiteatro)
│   ├── layouts/            # Plantillas generales de visualización (Login, Dashboard)
│   ├── lib/                # Módulos core de utilidades del servidor
│   │   ├── api.ts          # Cliente HTTP API para llamadas asíncronas
│   │   ├── auth-middleware.ts # Verificador de JWT y roles de usuario
│   │   ├── db.ts           # Cliente de conexión (Pool) con PostgreSQL
│   │   └── email.ts        # Configurador de SMTP y plantillas de invitación por correo
│   ├── paginas/            # Vistas lógicas de administración y control
│   │   ├── v2/             # Vistas Bento Grid modernas de la interfaz
│   │   │   ├── CentroControl.jsx  # Diagnóstico, Backups y Herramientas del Servidor
│   │   │   ├── GestionPorteria.jsx # Personal de seguridad, autorizaciones y QRs
│   │   │   └── PanelReportes.jsx   # Gráficos de asistencia e ingresos
│   │   └── PantallaBienvenida.jsx  # Vista de administración clásica (V1)
│   ├── utilidades/         # Formateadores de fecha y controladores de clima
│   └── App.jsx             # Orquestador del ruteo del cliente
├── next.config.ts          # Configuración del compilador y Turbopack
├── tailwind.config.ts      # Tokens de diseño y hojas de estilo TailwindCSS
└── package.json            # Dependencias del proyecto Next.js
```

---

## Puesta en Marcha Local

### Requisitos Previos
*   **Node.js** v20 o v22 (LTS recomendado)
*   **NPM** o cualquier gestor alternativo (Yarn, Pnpm, Bun)

### 1. Configuración de Variables de Entorno
Crea un archivo `.env.local` en la raíz de `codigo/plataforma-nextjs/` con la siguiente estructura:

```env
# Conexión a Base de Datos (Neon PostgreSQL o Postgres local)
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/sigic?sslmode=require"

# Secretos y Firmas Criptográficas
JWT_SECRET="tu_secreto_super_seguro_para_firmar_tokens"

# Configuración del Servidor de Correo (Notificaciones SMTP)
EMAIL_HOST="smtp.ejemplo.com"
EMAIL_PORT=465
EMAIL_SECURE="true"
EMAIL_USER="notificaciones@sigic.com"
EMAIL_PASS="tu_contraseña_smtp"
```

### 2. Instalación de Dependencias e Inicio

```bash
# Instalar los módulos del proyecto
npm install

# Iniciar servidor de desarrollo con Turbopack
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador para comenzar.

### 3. Compilación de Producción

Para validar el tipado y crear la compilación de producción optimizada:

```bash
npm run build
```

---

## Seguridad de la Plataforma

*   **Autenticación Criptográfica:** El login web y móvil genera un token JWT firmado `HS256`. Los datos de rol son calculados en el servidor en cada endpoint, neutralizando vulnerabilidades por falsificación del cliente.
*   **Enlaces de Invitación OTP:** Los graduados acceden al portal de autogestión de manera segura usando enlaces únicos generados mediante hashes criptográficos (`crypto.randomBytes`).
*   **Límite de Frecuencia (Rate Limiting):** Se cuenta con un limitador en memoria para evitar ataques de fuerza bruta en los inicios de sesión y solicitudes repetidas de emails.
*   **Encriptación Forzada SSL:** Todas las peticiones a Neon PostgreSQL se realizan bajo comunicación encriptada mediante protocolo SSL/TLS (`sslmode=require`).

---

## Equipo de Desarrollo

Este proyecto fue desarrollado en el marco de las **Prácticas Profesionalizantes** del **Instituto Tecnológico Beltrán** por:

*   **Cancelo Julian**
*   **Alfonso Alan Alexis**
*   **Contreras Villalba Sol Heilin**
*   **Frassia Matias**
*   **Santillan Luis Gabriel**

**Año del Proyecto:** 2026
