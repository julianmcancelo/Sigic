# SiGIC — Paquete de Entrega Oficial (Dockerizado)

> **Sistema de Gestión Institucional de Colaciones**  
> **Instituto Tecnológico Beltrán**  
> **Carrera:** Tecnicatura Superior en Analista de Sistemas  

---

## Contenido del Entregable

Este directorio contiene todo lo necesario para ejecutar la solución completa de SiGIC en cualquier equipo que cuente con Docker Desktop / Docker Engine sin necesidad de instalar dependencias locales (Node.js, PostgreSQL, etc.).

| Archivo | Descripción |
|---|---|
| `docker-compose.yml` | Orquestador de servicios (PostgreSQL 16 + Next.js 16/React 19) |
| `init.sql` | Estructura completa y datos iniciales de la base de datos |
| `INICIAR_SIGIC.bat` | Script de 1 clic para Windows (levanta todo y abre el navegador) |
| `DETENER_SIGIC.bat` | Script para apagar y liberar recursos |

---

## Requisitos Previos

- Tener instalado y en ejecución [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) o Docker Engine (Linux).

---

## Instrucciones de Uso

### Opción 1: En Windows con doble clic
1. Haga doble clic sobre `INICIAR_SIGIC.bat`.
2. El script levantará la base de datos PostgreSQL, la plataforma web y abrirá automáticamente [http://localhost:3000](http://localhost:3000) en el navegador predeterminado.
3. Para apagar el sistema, ejecute `DETENER_SIGIC.bat`.

### Opción 2: Desde terminal (Cualquier sistema operativo)
```bash
# Iniciar servicios en segundo plano
docker compose up -d

# Ver registros en tiempo real
docker compose logs -f

# Detener los servicios
docker compose down
```

---

## Puertos y Servicios

- **Plataforma Web SiGIC**: `http://localhost:3000`
- **Base de Datos PostgreSQL**: `localhost:5432`
  - Usuario: `sigic_admin`
  - Clave: `sigic_password_segura_2026`
  - Base: `sigic_db`
