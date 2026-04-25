# SiGIC

Sistema de Gestion de Invitados y Ceremonias.
Una plataforma integral diseñada para la organizacion, control de acceso y gestion de ubicaciones en eventos institucionales.

---

## Descripcion General

SiGIC es una solucion desarrollada para la profesionalizacion de ceremonias de graduacion y eventos masivos. La plataforma permite gestionar desde la arquitectura del auditorio hasta el check-in en tiempo real de los invitados mediante codigos QR.

Este proyecto destaca por su arquitectura modular, utilizando componentes propios publicados en el registro oficial de NPM.

---

## Funcionalidades Clave

*   Centro de Control Operativo: Aplicacion para el despliegue simplificado de la infraestructura.
*   Gestion de Egresados e Invitados: Padrones dinamicos con soporte para importacion masiva y envio de invitaciones.
*   Editor de Anfiteatro: Herramienta visual para diseñar la disposicion de asientos y gestionar el aforo.
*   Libreria Modular de Asientos: Utiliza el paquete @jcancelo/mapa-asientos-sigic para una gestion reactiva de las ubicaciones.
*   Control de Acceso Mobile: Modulo optimizado para escaneo de credenciales QR.

---

## Arquitectura del Sistema

El proyecto esta estructurado de la siguiente manera:

```text
SiGIC/
├── frontend/              # Interfaz de usuario (React + Vite + Tailwind)
├── backend/               # Servidor API (Node.js + Express + SQLite)
├── dist/                  # Distribucion del Centro de Control
├── SiGIC_Control_Center_Pro.py  # Lanzador Maestro
└── sigic.db               # Base de datos relacional
```

---

## Desarrollo y Despliegue

### Requisitos Previos
*   Node.js (v18 o superior)
*   NPM

### Instalacion Manual
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

---

## Creditos e Institucion

Este proyecto ha sido desarrollado como parte de las Practicas Profesionalizantes del Instituto Tecnologico Beltran (ITB).

*   Carrera: Tecnicatura Superior en Desarrollo de Software.
*   Año: 2026.
*   Autor: Julian Cancelo.

---
Instituto Tecnologico Beltran - Avellaneda, Buenos Aires, Argentina.
