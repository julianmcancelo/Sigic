<p align="center">
  <img src="assets/logo-oficial.png" alt="Logo SiGIC" width="200" />
</p>

# SiGIC — Sistema de Gestión Integral de Colación

**Instituto Tecnológico Beltrán — 2026**

---

## Introducción

SiGIC es una plataforma integral que desarrollamos para administrar ceremonias de colación de principio a fin. El sistema facilita la gestión de ceremonias, el control del padrón de egresados, la asignación de acompañantes y asientos, el control de acceso automatizado mediante códigos QR y el monitoreo operativo de toda la infraestructura.

---

## Estructura del Proyecto

El código fuente de la aplicación está organizado en la carpeta `codigo/`, mientras que las herramientas operativas de administración de servidores se encuentran en `scripts/`. A continuación, se detalla la estructura limpia del proyecto:

```text
SiGIC/
├── codigo/
│   ├── servidor/                  # Backend Node.js + Express + PostgreSQL
│   │   ├── server.js              # Punto de entrada de la API
│   │   ├── db.js                  # Conexión a base de datos PostgreSQL
│   │   ├── middleware/            # Filtros de seguridad y control de peticiones
│   │   │   ├── autenticacion.js   # Autorización por roles (JWT)
│   │   │   └── limitador.js       # Rate limiting en memoria
│   │   ├── rutas/                 # Controladores y endpoints de la API
│   │   │   ├── auth.js            # Login de administración
│   │   │   ├── egresados.js       # Gestión y acceso de graduados
│   │   │   ├── invitados.js       # Gestión e ingreso de acompañantes
│   │   │   ├── ceremonias.js      # Creación y activación de eventos
│   │   │   ├── entregadores.js    # Asignación de docentes/autoridades
│   │   │   ├── profesores.js      # Catálogo de personal docente
│   │   │   ├── anfiteatro.js      # Distribución física de butacas
│   │   │   ├── stats.js           # Métricas de asistencia en tiempo real
│   │   │   ├── configuracion.js   # Parámetros globales del sistema
│   │   │   └── setup.js           # Asistente de configuración inicial
│   │   ├── servicios/             # Módulos de apoyo
│   │   │   ├── email.js           # Envío de invitaciones mediante Nodemailer
│   │   │   └── tokens.js          # Generación y firma de JWT (sin librerías externas)
│   │   ├── datos/                 # Definición del modelo de datos
│   │   │   └── schema.sql         # Script DDL definitivo para PostgreSQL
│   │   └── scripts/               # Utilidades de administración de datos
│   │       ├── inicializar_neon.js
│   │       ├── migrar_datos.js
│   │       ├── reset_datos.js
│   │       └── respaldar_postgres.js
│   │
│   └── interfaz/
│       ├── web/                   # Portal web administrativo (React + Vite)
│       ├── movil/                 # Portal web autogestión de egresados (React + Vite)
│       └── flutter/               # Aplicación móvil para control de accesos (Flutter)
│
├── scripts/
│   ├── SiGIC_ControlCenter.exe     # Centro de control compilado para Windows (.NET 8)
│   └── SiGIC_ControlCenter/        # Proyecto de desarrollo C# WPF estilo Fluent
│
├── MANUAL.md                       # Manual de usuario completo para Administradores, Egresados y Portería
├── LEEME.md                        # Este archivo de documentación de desarrollo
├── README.md                       # Resumen del proyecto en inglés
├── CHANGELOG.md                    # Historial de cambios
└── .gitignore
```

---

## Inicio Rápido

### 1. Centro de Control (Recomendado para Windows)
Para lanzar todos los servicios de forma unificada desde Windows, podemos usar nuestro Centro de Control nativo haciendo doble clic sobre el ejecutable:
👉 **[SiGIC_ControlCenter.exe](file:///d:/Sigic/scripts/SiGIC_ControlCenter.exe)** (en la carpeta `scripts/`).

### 2. Puesta en Marcha Manual

#### Backend (Servidor API)
```bash
cd codigo/servidor
npm install
npm start                # Escucha en el puerto 3001
```

#### Portal Web Administrativo
```bash
cd codigo/interfaz/web
npm install
npm run dev              # Corre en el puerto 5173
```

#### Portal Móvil (Egresados)
```bash
cd codigo/interfaz/movil
npm install
npm run dev              # Corre en el puerto 5173
```

#### App de Portería (Flutter)
```bash
cd codigo/interfaz/flutter
flutter pub get
flutter run
```

---

## Manual de Usuario Completo
Para conocer las guías de uso paso a paso orientadas al usuario final (Administración, Alumnos y Portería), consulte el archivo **[Manual de Usuario (MANUAL.md)](file:///d:/Sigic/MANUAL.md)** en la raíz del repositorio.

---

## Tecnologías Utilizadas

| Capa | Componente tecnológico |
|------|-----------|
| **Backend** | Node.js, Express |
| **Base de datos** | PostgreSQL (Neon) |
| **Frontend Web** | React, Vite, Tailwind CSS |
| **Frontend Móvil** | React, Vite |
| **Control de Accesos** | Flutter (Android/iOS) |
| **Autenticación** | Tokens firmados (JWT HS256) + OTP (SHA-256) |
| **Notificaciones** | Nodemailer |

---

## Variables de Entorno

Debemos crear el archivo `.env` en la ruta `codigo/servidor/.env` siguiendo como guía el archivo `codigo/servidor/.env.example`. Los parámetros clave son:

```ini
DATABASE_URL=postgresql://usuario:password@host/sigic
JWT_SECRET=secreto_aleatorio_de_al_menos_32_caracteres
EMAIL_USER=correo@dominio.com
EMAIL_PASS=contrasena_de_aplicacion
PORT=3001
CORS_ORIGINS=http://localhost:5173
```

---

## Seguridad

Hemos desarrollado un modelo de seguridad robusto que opera en el servidor y protege toda la información del evento:

*   **Autenticación JWT Estricta:** El inicio de sesión administrativo (`/api/auth/login`) emite un token con el rol real verificado contra la base de datos. Eliminamos completamente el uso de cabeceras arbitrarias del cliente como `x-rol` para evitar la suplantación de identidades.
*   **Acceso Limitado para Egresados:** Al validar su enlace único o ingresar el código OTP, el egresado recibe un token temporal restringido exclusivamente a la lectura y modificación de sus propios datos e invitados.
*   **Middlewares de Autorización por Rol:** Todos los endpoints de gestión de usuarios, carga de alumnos y configuración del anfiteatro requieren niveles de acceso jerárquicos verificados en el servidor (`SUPER_ADMIN`, `ADMIN` o `ADMINISTRATIVO`).
*   **Protección contra Ataques de Fuerza Bruta:** Añadimos un middleware de rate limiting personalizado en memoria que restringe el número de peticiones en rutas críticas como login, OTP y setup inicial.
*   **Verificación TLS en Base de Datos:** Forzamos la encriptación de la conexión con el servidor de PostgreSQL en Neon para proteger los datos en tránsito.
*   **Cabeceras de Seguridad HTTP:** Configuramos políticas de contenido y de frames (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`) y aplicamos límites al tamaño de las solicitudes JSON para prevenir ataques de denegación de servicio (DoS).

---

## Equipo de Desarrollo

*   **Instituto Tecnológico Beltrán**
*   **Proyecto:** SiGIC — Sistema de Gestión Integral de Colación
*   **Integrantes:**
    *   Alfonso Alan Alexis
    *   Cancelo Julian
    *   Contreras Villalba Sol Heilin
    *   Frassia Matias
    *   Santillan Luis Gabriel
*   **Año:** 2026
