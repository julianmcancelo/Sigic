# <div align="center"><img src="./logo-oficial.png" alt="SiGIC" width="500" /></div>

<div align="center">
  <h3>Sistema de Gestión de Invitados y Ceremonias</h3>
  <p>Una plataforma integral diseñada para la organización, control de acceso y gestión de ubicaciones en eventos institucionales de alta escala.</p>

  [![Estado](https://img.shields.io/badge/Estado-Producci%C3%B3n-0EA5E9?style=for-the-badge)](https://github.com/)
  [![Tecnología](https://img.shields.io/badge/Stack-React_%7C_Node_%7C_Python-111827?style=for-the-badge)](https://github.com/)
  [![Institución](https://img.shields.io/badge/ITB-Instituto_Beltrn-black?style=for-the-badge)](https://www.itb.edu.ar/)
</div>

---

## Descripción General

**SiGIC** es la solución definitiva para la profesionalización de ceremonias de graduación y eventos masivos. Desarrollada con un enfoque en la agilidad operativa y la experiencia del usuario, la plataforma permite a los organizadores gestionar desde la arquitectura del auditorio hasta el check-in en tiempo real de los invitados mediante códigos QR.

---

## Funcionalidades Clave

*   **Centro de Control Operativo:** Aplicación nativa en Python para el despliegue simplificado de toda la infraestructura con un solo clic.
*   **Gestión de Egresados e Invitados:** Padrones dinámicos con soporte para importación masiva (CSV/XLSX) y envío de invitaciones automáticas.
*   **Editor de Anfiteatro:** Herramienta visual para diseñar la disposición de asientos, asignar roles (Autoridades, Egresados, Prioritarios) y gestionar el aforo.
*   **Control de Acceso Mobile:** Módulo optimizado para escaneo de credenciales QR en los puntos de ingreso con validación instantánea de ubicación.
*   **Soporte Multi-Hábitat:** Capacidad para gestionar múltiples ceremonias independientes dentro de una misma instancia del sistema.

---

## Arquitectura del Sistema

El proyecto está estructurado de forma modular para garantizar escalabilidad y facilidad de mantenimiento:

```text
SiGIC/
├── frontend/              # Interfaz de usuario (React + Vite + Tailwind)
├── backend/               # Servidor API (Node.js + Express + SQLite)
├── dist/                  # Distribución del Centro de Control (.exe)
├── SiGIC_Control_Center_Pro.py  # Código fuente del Lanzador Maestro
├── logo-oficial.png       # Identidad visual corporativa
└── sigic.db               # Base de datos relacional del sistema
```

---

## Despliegue Rápido (Recomendado)

Para usuarios finales y operadores, la plataforma incluye un **Centro de Control Profesional** que automatiza el arranque de los servicios:

1.  Navega a la carpeta `dist/`.
2.  Ejecuta `SiGIC_Control_Center_Pro.exe`.
3.  Presiona **"DESPLEGAR INFRAESTRUCTURA"**.
4.  Una vez que los servicios estén activos (indicadores en verde), haz clic en **"ABRIR PANEL DE CONTROL"**.

---

## Desarrollo y Despliegue Manual

Si deseas contribuir al desarrollo o ejecutar los servicios manualmente:

### Requisitos Previos
*   [Node.js](https://nodejs.org/) (v18 o superior)
*   [Python 3.x](https://www.python.org/) (para el Centro de Control)

### Pasos
```bash
# 1. Iniciar el Backend
cd backend
npm install
npm start

# 2. Iniciar el Frontend
cd ../frontend
npm install
npm run dev
```

---

## Créditos e Institución

Este proyecto ha sido desarrollado como parte de las Prácticas Profesionalizantes del **Instituto Tecnológico Beltrán (ITB)**. 

*   **Carrera:** Tecnicatura Superior en Desarrollo de Software.
*   **Año:** 2026.
*   **Ubicación:** Avellaneda, Buenos Aires, Argentina.

<div align="center">
  <p><i>Profesionalizando la gestión de eventos a través de la tecnología.</i></p>
</div>
