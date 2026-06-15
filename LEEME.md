<p align="center">
  <img src="codigo/plataforma-nextjs/public/logo-oficial.png" alt="Logo SiGIC" width="200" />
</p>

# SiGIC — Sistema de Gestión Integral de Colación

**Instituto Tecnológico Beltrán — 2026**

---

## Introducción

SiGIC es una plataforma integral desarrollada para planificar, coordinar y ejecutar ceremonias de colación de principio a fin. El sistema optimiza el flujo de acreditaciones, distribución de butacas en tiempo real, gestión de acompañantes y control de accesos mediante credenciales digitales con códigos QR, garantizando un evento ágil, moderno y seguro.

---

## Estructura Limpia del Proyecto

El código fuente del proyecto está organizado en la carpeta `codigo/` y las herramientas administrativas en `scripts/`, manteniendo el código clásico apartado del árbol activo para mayor claridad:

```text
SiGIC/
├── codigo/
│   ├── plataforma-nextjs/       # Plataforma Web y API Serverless (Next.js + Neon PostgreSQL)
│   │   ├── src/
│   │   │   ├── app/            # App Router (páginas web y endpoints de API)
│   │   │   ├── componentes/    # Componentes compartidos de React
│   │   │   ├── lib/            # Pools de base de datos, middlewares de auth, utilidades
│   │   │   └── paginas/        # Vistas de la aplicación (Bento Grid V2 y Clásica V1)
│   │   └── package.json        # Dependencias de la plataforma web
│   │
│   └── movil-reactnative/       # Aplicación móvil para control de accesos (React Native + Expo)
│       ├── src/
│       │   ├── app/            # Pantalla bienvenida, escáner QR y dashboard móvil
│       │   └── components/     # Componentes compartidos del móvil
│       └── package.json        # Dependencias del móvil
│
├── respaldo_legacy/             # Respaldo local de código clásico V1 (Vite + Express) - Gitignored
├── scripts/                     # Herramientas y consolas administrativas de Windows (.NET 8)
├── MANUAL.md                    # Manual de usuario completo para Administración, Alumnos y Portería
├── LEEME.md                     # Este archivo de documentación de desarrollo
├── README.md                    # Resumen general del proyecto
├── CHANGELOG.md                 # Historial de cambios
└── .gitignore
```

---

## Puesta en Marcha

### 1. Plataforma Web y API (Next.js)

1. Ingresa a la carpeta del proyecto:
   ```bash
   cd codigo/plataforma-nextjs
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea el archivo `.env.local` con las variables de base de datos y JWT (ver sección de variables abajo).
4. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```

### 2. Aplicación Móvil (React Native + Expo)

1. Ingresa a la carpeta del proyecto móvil:
   ```bash
   cd codigo/movil-reactnative
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el empaquetador de Expo Metro:
   ```bash
   npx expo start
   ```

---

## Tecnologías Utilizadas

| Capa | Componente Tecnológico |
|------|-----------|
| **Plataforma Web (Frontend)** | React 19, Tailwind CSS |
| **Backend & API** | Next.js 15+ (App Router Serverless) |
| **Base de datos** | PostgreSQL (Neon Cloud DB) |
| **Aplicación Móvil** | React Native, Expo, Expo BarcodeScanner |
| **Autenticación** | JSON Web Tokens (JWT HS256) |
| **Notificaciones** | Nodemailer (SMTP) |

---

## Variables de Entorno

Para ejecutar la plataforma web localmente, debes crear el archivo `.env.local` en la ruta `codigo/plataforma-nextjs/.env.local` con las siguientes configuraciones:

```ini
# Conexión a Base de Datos (Neon Cloud)
DATABASE_URL=postgresql://usuario:password@host/sigic?sslmode=require

# Llave de Firma para Tokens
JWT_SECRET=secreto_criptografico_de_al_menos_32_caracteres

# Servidor SMTP de Notificaciones por Correo
EMAIL_HOST=smtp.ejemplo.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=notificaciones@sigic.com
EMAIL_PASS=contrasena_de_aplicacion
```

---

## Ecosistema de Seguridad

*   **Autenticación JWT Estricta:** Las sesiones de administración y egresados generan tokens JWT cifrados con `HS256`. Los roles y permisos de los usuarios se validan en el servidor en cada llamada, mitigando la suplantación en el cliente.
*   **Autorización de Seguridad por Ceremonia:** El personal de portería (`PORTERIA`) requiere autorización individual para cada ceremonia. El acceso a la API móvil se deniega de forma automática si no se encuentran habilitados para el evento activo.
*   **Control de Fuerza Bruta (Rate Limiting):** El servidor implementa control de tasa en memoria en rutas sensibles (login y solicitudes OTP) para neutralizar ataques de diccionario.
*   **Conexiones Seguras TLS:** Forzamos el cifrado SSL en las conexiones hacia Neon PostgreSQL (`sslmode=require`).
*   **Cabeceras de Seguridad HTTP:** Prevención de ataques mediante configuraciones de frames (`DENY`), protección contra tipos mime (`nosniff`) y tamaño máximo JSON configurado para evitar ataques DoS.

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
