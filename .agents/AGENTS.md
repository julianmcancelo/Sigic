# SiGIC — Contexto del Proyecto

> **Sistema de Gestión Institucional de Colaciones**
> Repositorio: `julianmcancelo/Sigic` · Rama principal: `master`

---

## 1. ¿Qué es SiGIC?

SiGIC es una plataforma web + móvil que automatiza la organización de actos de graduación (colaciones) para instituciones académicas. Cubre tres flujos principales:

1. **Administración**: Creación de ceremonias, carga masiva de graduados (Excel), envío de invitaciones por email, diseño del anfiteatro.
2. **Autogestión del Egresado**: Acceso por token OTP, confirmación de asistencia, registro de acompañantes/entregadores, selección de butacas y generación de credencial QR.
3. **Acreditación Móvil (Portería)**: App React Native que escanea QRs el día del evento para validar ingresos en tiempo real.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend Web | React 19 + Next.js 16 (Turbopack) + TailwindCSS 4 |
| Backend/API | Next.js API Routes (serverless en Vercel) |
| Base de Datos | Neon PostgreSQL (serverless, SSL) vía `pg` |
| Email | Nodemailer con SMTP configurable |
| App Móvil | React Native + Expo (Expo Router) |
| Hosting | Vercel (producción) |

---

## 3. Estructura de Archivos

```
d:/Sigic/
├── Manual_Usuario_y_Soporte_SiGIC.md    # Manual técnico en Markdown
├── manual.docx                          # Manual exportado a Word
│
├── codigo/
│   ├── plataforma/                      # ══ APLICACIÓN WEB PRINCIPAL ══
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── .env.local                   # Variables de entorno (NO commitear valores)
│   │   │
│   │   ├── public/
│   │   │   ├── manual/                  # Capturas del manual integrado
│   │   │   │   ├── panel_admin.png
│   │   │   │   ├── gestion_graduados.png
│   │   │   │   ├── gestion_ceremonias.png
│   │   │   │   ├── diseno_anfiteatro.png
│   │   │   │   ├── email_invitacion.png
│   │   │   │   ├── email_asunto.png
│   │   │   │   ├── portal_otp.png
│   │   │   │   ├── portal_inasistencia.png
│   │   │   │   ├── pantalla_aceptacion.png
│   │   │   │   ├── panel_graduado_acompanantes.png
│   │   │   │   ├── panel_graduado_entregadores.png
│   │   │   │   └── credencial_digital.png
│   │   │   └── ...
│   │   │
│   │   └── src/
│   │       ├── App.jsx                  # ★ ORQUESTADOR PRINCIPAL (sesiones, routing, estado global)
│   │       │
│   │       ├── app/                     # Next.js App Router
│   │       │   ├── layout.tsx           # Layout raíz (HTML, fuentes)
│   │       │   ├── page.tsx             # Punto de entrada (renderiza <App />)
│   │       │   ├── globals.css
│   │       │   └── api/
│   │       │       ├── auth/
│   │       │       │   ├── login/route.ts    # POST /api/auth/login (JWT)
│   │       │       │   └── sesion/route.ts   # GET  /api/auth/sesion
│   │       │       └── [...slug]/route.ts    # ★ CATCH-ALL: proxy a todos los endpoints API
│   │       │
│   │       ├── paginas/                 # Páginas/Vistas del sistema
│   │       │   ├── PantallaBienvenida.jsx
│   │       │   ├── PantallaSeleccionLogin.jsx
│   │       │   ├── PaginaInicioSesion.jsx
│   │       │   ├── PantallaAceptacion.jsx
│   │       │   ├── LoginGraduado.jsx
│   │       │   ├── LoginEgresado.jsx
│   │       │   ├── PanelGraduado.jsx           # Portal completo del egresado
│   │       │   ├── GestionGraduados.jsx         # CRUD de graduados + importación Excel
│   │       │   ├── GestionCeremonias.jsx        # CRUD de ceremonias
│   │       │   ├── GestionProfesores.jsx        # CRUD de docentes
│   │       │   ├── GestionInvitados.jsx
│   │       │   ├── EditorAnfiteatro.jsx         # Mapa interactivo de butacas
│   │       │   ├── ControlIngreso.jsx
│   │       │   ├── SeleccionAsientos.jsx
│   │       │   ├── RegistroInvitados.jsx
│   │       │   ├── PanelAjustes.jsx
│   │       │   ├── AsistenteSetup.jsx           # Wizard de configuración inicial
│   │       │   ├── ManualUsuarioWeb.jsx          # Manual integrado (páginas visuales)
│   │       │   └── v2/                          # Vistas Pro (dashboard avanzado)
│   │       │       ├── PantallaBienvenidaPro.jsx # Dashboard Bento Grid
│   │       │       ├── PanelReportes.jsx
│   │       │       ├── GestionPorteria.jsx      # Gestión de cuentas de seguridad
│   │       │       ├── CentroControl.jsx        # Mantenimiento, backup, reset
│   │       │       └── panel/                   # Sub-componentes del dashboard Pro
│   │       │
│   │       ├── componentes/             # Componentes reutilizables
│   │       │   ├── ControlExpositor.jsx         # Widget flotante para demos
│   │       │   ├── PantallaCargaInicial.jsx     # Splash screen
│   │       │   ├── FormularioInicioSesion.jsx
│   │       │   ├── FormularioGraduado.jsx
│   │       │   ├── FormularioEgresado.jsx
│   │       │   ├── ModalCredencial.jsx          # Credencial QR del graduado
│   │       │   ├── ModalImportar.jsx            # Importación Excel
│   │       │   ├── ModalAsignarAsientos.jsx
│   │       │   ├── ModalConfirmacion.jsx
│   │       │   ├── ModalLinkRegistro.jsx
│   │       │   ├── ModalPermisos.jsx
│   │       │   ├── ModalQR.jsx
│   │       │   ├── HeaderGlobal.jsx
│   │       │   ├── LogoBeltran.jsx
│   │       │   ├── InputCampo.jsx
│   │       │   ├── CampoFormulario.jsx
│   │       │   ├── StepCard.jsx
│   │       │   ├── TarjetaEgresado.jsx
│   │       │   ├── TarjetaInvitadoForm.jsx
│   │       │   ├── PasoCantidadInvitados.jsx
│   │       │   └── PantallaExitoRegistro.jsx
│   │       │
│   │       ├── lib/                     # Lógica de servidor y utilidades core
│   │       │   ├── api.ts               # ★ CAPA DE SERVICIOS (fetch wrappers para el frontend)
│   │       │   ├── db.ts                # Pool de conexiones PostgreSQL (pg)
│   │       │   ├── auth-middleware.ts    # Verificación JWT en API routes
│   │       │   ├── email.ts             # Nodemailer: envío de invitaciones
│   │       │   ├── otp.ts               # Generación y validación de OTP
│   │       │   └── tokens.ts            # Firma y verificación JWT
│   │       │
│   │       ├── servicios/
│   │       │   └── api.ts               # Re-export de lib/api.ts
│   │       │
│   │       ├── datos/                   # Datos estáticos / mock
│   │       │   ├── accesos-rapidos.js
│   │       │   ├── credenciales-demo.js
│   │       │   └── ubicacion-por-defecto.js
│   │       │
│   │       ├── layouts/
│   │       │   └── LayoutAutenticacion.jsx
│   │       │
│   │       └── utilidades/
│   │           ├── clima.js
│   │           ├── formatear-fecha.js
│   │           └── validar-formulario-login.js
│   │
│   └── movil-reactnative/               # ══ APP MÓVIL (PORTERÍA) ══
│       ├── package.json
│       ├── app.json                      # Configuración Expo
│       ├── babel.config.js
│       ├── metro.config.js
│       └── src/
│           ├── app/
│           │   ├── _layout.tsx
│           │   ├── index.tsx             # Pantalla principal del escáner
│           │   └── explore.tsx
│           ├── components/               # Componentes UI de la app
│           ├── constants/theme.ts
│           ├── hooks/
│           ├── services/api.ts           # Comunicación con el backend
│           └── global.css
```

---

## 4. Arquitectura y Flujo de Datos

```
┌─────────────────────┐     HTTPS      ┌──────────────────────────┐
│   Cliente Web        │ ──────────────→│  Vercel (Next.js)        │
│   (React SPA)        │                │                          │
│   - Admin            │                │  /api/auth/login         │
│   - Egresado         │                │  /api/auth/sesion        │
│   - Manual           │                │  /api/[...slug] (catch)  │
└─────────────────────┘                │         │                 │
                                       │         ↓                 │
┌─────────────────────┐                │  ┌─────────────────────┐  │
│  App Móvil           │ ──────────────→│  │  lib/db.ts (Pool)   │  │
│  (React Native)      │    HTTPS       │  │  → Neon PostgreSQL  │  │
│  - Escaneo QR        │                │  └─────────────────────┘  │
└─────────────────────┘                │         │                 │
                                       │         ↓                 │
                                       │  ┌─────────────────────┐  │
                                       │  │  lib/email.ts        │  │
                                       │  │  → SMTP (Nodemailer) │  │
                                       └──┴─────────────────────┴──┘
```

### Flujo del Orquestador (App.jsx)

`App.jsx` es un **SPA orquestada por estado**, no usa rutas de Next.js para navegación interna. Funciona así:

1. **Estado global**: `adminActivo`, `graduadoActivo`, `vistaActual`, `enMantenimiento`, `requiereSetup`, `ceremoniaActiva`
2. **Decisión de pantalla**: Se evalúan en cascada:
   - `cargandoSetup` → Splash screen
   - `requiereSetup` → AsistenteSetup
   - `tokenURL` presente → LoginGraduado (validación OTP)
   - `graduadoActivo` → PanelGraduado / PantallaAceptacion (según estado)
   - `adminActivo` → Dashboard + navegación lateral
   - Default → PantallaBienvenida (con easter egg de 5 clics)
3. **Interceptor 401**: Detecta tokens expirados y cierra sesión automáticamente (excepto tokens bypass del Expositor).

---

## 5. Variables de Entorno (.env.local)

```
DATABASE_URL=           # Connection string de Neon PostgreSQL
JWT_SECRET=             # Secreto para firmar tokens JWT
SMTP_HOST=              # Host del servidor de correo
SMTP_PORT=              # Puerto SMTP (587/465)
SMTP_USER=              # Usuario SMTP
SMTP_PASS=              # Contraseña SMTP
SMTP_FROM=              # Dirección del remitente
DB_SSL_INSECURE=        # "1" para deshabilitar verificación SSL
NEXT_PUBLIC_APP_URL=    # URL pública de la aplicación
```

---

## 6. Base de Datos (PostgreSQL / Neon)

### Tablas principales

| Tabla | Propósito |
|---|---|
| `usuarios` | Cuentas de admin, soporte, portería, auditor |
| `ceremonias` | Eventos de colación (fecha, lugar, aforo, estado activo) |
| `egresados` | Padrón de graduados (nombre, DNI, legajo, correo, estado) |
| `invitados` | Acompañantes registrados por cada egresado |
| `butacas` | Mapa de asientos del anfiteatro (fila, número, tipo, estado) |
| `profesores` | Docentes disponibles como entregadores de título |
| `entregadores` | Relación egresado ↔ persona que entrega el diploma |
| `configuracion` | Pares clave/valor para ajustes del sistema (ej: `modo_mantenimiento`) |
| `codigos_otp` | Códigos temporales de acceso para egresados |
| `sesiones_porteria` | Tokens de acceso para la app móvil |

### Estados del Egresado (Pipeline)

```
PENDIENTE → INVITADO → ACEPTADO → CONFIRMADO
                     ↘ RECHAZADO (irreversible)
```

---

## 7. API Surface (Endpoints Principales)

### Autenticación
- `POST /api/auth/login` — Login admin (email + password → JWT)
- `GET  /api/auth/sesion` — Validar sesión activa

### Catch-All (`/api/[...slug]`)
- `GET /api/ceremonias` — Listar ceremonias
- `GET /api/ceremonias/activa` — Ceremonia activa
- `POST /api/ceremonias` — Crear ceremonia
- `PUT /api/ceremonias/:id/activar` — Activar ceremonia
- `GET /api/egresados` — Listar graduados
- `POST /api/egresados` — Crear graduado
- `POST /api/egresados/importar` — Importación masiva (Excel)
- `POST /api/egresados/enviar-invitaciones` — Despacho masivo de emails
- `GET /api/egresados/token/:token` — Validar token de acceso
- `POST /api/solicitar-otp` — Solicitar código OTP
- `POST /api/verificar-otp` — Verificar código OTP
- `GET /api/invitados/:egresadoId` — Invitados de un egresado
- `POST /api/invitados` — Registrar invitado
- `DELETE /api/invitados/:id` — Eliminar invitado
- `GET /api/butacas` — Mapa de butacas
- `PUT /api/butacas/:id` — Actualizar estado de butaca
- `GET /api/configuracion` — Ajustes del sistema
- `PUT /api/configuracion/:clave` — Actualizar ajuste

---

## 8. Roles de Usuario

| Rol | Dashboard | CRUD Graduados | Anfiteatro | Seguridad | Centro Control |
|---|:---:|:---:|:---:|:---:|:---:|
| Egresado | Solo su portal | ❌ | Solo su asiento | ❌ | ❌ |
| Portería | Solo escáner | ❌ | Lectura | ❌ | ❌ |
| Auditor | ✅ | Lectura | Lectura | ❌ | ❌ |
| Administrativo | ✅ | ✅ Edición | ✅ Edición | ❌ | ❌ |
| Super Admin | ✅ | ✅ Total | ✅ Total | ✅ Local | ❌ |
| Soporte (`soporte@sigic.com.ar`) | ✅ | ❌ | ❌ | ✅ Global | ✅ Total |

---

## 9. Funcionalidades Especiales

### Easter Egg de Acceso
La pantalla de bienvenida tiene un logo de SiGIC. Al hacer **5 clics** sobre él, se desbloquea la pantalla de selección de login (admin/egresado). Es un gesto de seguridad intencional para que los graduados no vean el formulario de admin.

### Modo Mantenimiento
- Se activa/desactiva desde el **Panel del Expositor** o desde la tabla `configuracion` (clave: `modo_mantenimiento`).
- Se persiste en la base de datos Y en `localStorage`.
- Cuando está activo, la pantalla de bienvenida muestra un overlay de "Sistema en Mantenimiento".

### Panel del Expositor (Demo Mode)
Widget flotante (esquina inferior derecha) que permite simular roles:
- **Administrador**: Sesión mock de admin
- **Soporte Técnico**: Sesión mock de soporte
- **Egresado (Invitado)**: Estado PENDIENTE → flujo de aceptación
- **Egresado (Activo)**: Estado ACEPTADO → selección de butacas
- **Activar/Desactivar Mantenimiento**
- **Limpiar Sistema**: Cierra todas las sesiones mock

### Credencial Digital
Al completar el registro, el egresado obtiene una credencial con código QR que sirve como **pase grupal** para él y sus acompañantes. Es escaneable por la app móvil de portería.

---

## 10. Convenciones de Código

- **Idioma**: Todo el código (variables, funciones, componentes, comentarios) está en **español**.
- **Componentes**: PascalCase, archivos `.jsx` (ej: `PanelGraduado.jsx`).
- **Funciones de API**: camelCase en español (ej: `obtenerCeremoniaActiva`, `crearCeremonia`).
- **Estilos**: TailwindCSS (utility-first). Sin CSS modules ni styled-components.
- **Estado**: `useState` + `useEffect` en App.jsx. No hay Redux/Zustand.
- **Routing**: SPA manual (no usa Next.js pages routing). La navegación se controla con `vistaActual`.
- **Iconos**: Lucide React (`lucide-react`).

---

## 11. Comandos Útiles

```bash
# Desarrollo
cd d:\Sigic\codigo\plataforma
npm run dev          # Servidor de desarrollo (Turbopack)

# Producción
npm run build        # Build optimizado
npm start            # Iniciar servidor de producción

# Lint
npx eslint src/      # Verificar errores

# Git
git add .; git commit -m "mensaje"; git push

# App Móvil
cd d:\Sigic\codigo\movil-reactnative
npx expo start       # Iniciar Expo dev server
```

---

## 12. Notas para el Asistente

- El interceptor de fetch en `App.jsx` ignora errores 401 cuando el token empieza con `bypass-` (tokens del Expositor).
- `[...slug]/route.ts` es el **catch-all** que maneja TODA la API. Cualquier endpoint nuevo se agrega ahí.
- Las imágenes del manual van en `public/manual/` para la web y se referencian con paths relativos (`/manual/archivo.png`).
- Al hacer cambios, siempre verificar con `npm run build` que compila correctamente antes de pushear.
- PowerShell usa `;` como separador de comandos, no `&&`.
