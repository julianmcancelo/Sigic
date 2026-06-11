<p align="center">
  <img src="assets/logo-oficial.png" alt="Logo SiGIC" width="200" />
</p>

# SiGIC - Sistema de Gestión de Invitados y Ceremonias

**Instituto Tecnológico Beltrán — 2026**

---

## Estado actual
SiGIC es una plataforma integral que desarrollamos para administrar ceremonias de colación de principio a fin. Actualmente, la aplicación funciona utilizando PostgreSQL como motor de base de datos principal, con un backend robusto en Node.js y clientes frontend desarrollados en React y Flutter.

## Qué resuelve
- Alta y gestión de ceremonias de graduación.
- Padrón unificado de egresados y sus invitados.
- Registro y control de acceso automatizado por QR en portería.
- Configuración visual de anfiteatros, sectores y asientos.
- Asignación de profesores y entregadores de diplomas.
- Panel operativo y métricas en tiempo real.

---

## Estructura del proyecto
A continuación, se presenta la estructura simplificada del código en desarrollo:
```text
SiGIC/
├── codigo/
│   ├── servidor/           # Backend (API REST + base de datos)
│   │   ├── datos/          # Esquema SQL y datos semilla
│   │   ├── rutas/          # Controladores y endpoints REST
│   │   ├── middleware/     # Filtros de autenticación (JWT) y rate limiting
│   │   ├── servicios/      # Notificaciones (email) y tokens de sesión
│   │   └── scripts/        # Tareas de administración (inicializar, respaldar, resetear)
│   └── interfaz/
│       ├── web/            # Portal de gestión administrativa (React + Vite)
│       ├── movil/          # Portal de autogestión de egresados (React + Vite)
│       └── flutter/        # App móvil para escaneo en portería (Flutter)
├── scripts/                # Panel de Control nativo de Windows (Python)
├── LEEME.md                # Guía de configuración y seguridad detallada
├── README.md               # Este archivo (resumen del proyecto)
├── CHANGELOG.md            # Historial de versiones y cambios
└── .gitignore
```

---

## Seguridad
- Autenticación segura mediante tokens de sesión firmados (JWT HS256) generados por el servidor.
- Control de acceso y autorización por rol jerárquico verificado en cada endpoint de la API.
- Rate limiting en memoria para prevenir ataques de fuerza bruta en inicio de sesión y validación OTP.
- Para conocer la configuración y el modelo de seguridad en detalle, consultar la sección correspondiente en [LEEME.md](file:///d:/Sigic/LEEME.md).

---

## Requisitos
- Node.js 18+
- npm
- Python 3.x (opcional, requerido para el Control Center)

---

## Arranque rápido

### Opción 1: Control Center (Recomendado)
Para iniciar todos los componentes de forma unificada bajo Windows, ejecutar:
```bash
python scripts/SiGIC_Control_Center_Pro.py
```

### Opción 2: Manual

1. **Servidor Backend:**
   ```bash
   cd codigo/servidor
   npm install
   npm start
   ```

2. **Administración Web:**
   ```bash
   cd codigo/interfaz/web
   npm install
   npm run dev
   ```

3. **Portal Móvil:**
   ```bash
   cd codigo/interfaz/movil
   npm install
   npm run dev
   ```

---

## Equipo de Desarrollo
Proyecto desarrollado por el equipo de Prácticas Profesionalizantes del Instituto Tecnológico Beltrán:

*   Alfonso Alan Alexis
*   Cancelo Julian
*   Contreras Villalba Sol Heilin
*   Frassia Matias
*   Santillan Luis Gabriel
