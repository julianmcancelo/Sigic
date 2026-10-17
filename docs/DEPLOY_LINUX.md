# Despliegue de SiGIC en Linux con Docker & Docker Compose

Esta configuración permite iniciar todo el ecosistema de **SiGIC** (Web + API + Base de Datos PostgreSQL) en cualquier servidor Linux (Ubuntu, Debian, Fedora, Arch, VPS, máquina virtual o servidor local) en un solo comando, sin instalar Node.js ni configurar bases de datos manualmente.

---

## 🚀 Requisitos Previos en el Servidor Linux

Tener instalados **Docker** y **Docker Compose**:

```bash
# En Ubuntu / Debian:
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

---

## ⚡ Inicio Rápido (1 Comando)

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/julianmcancelo/Sigic.git
   cd Sigic
   ```

2. (Opcional) Copiar variables de entorno si querés configurar SMTP de correos:
   ```bash
   cp .env.docker.example .env
   ```

3. **Iniciar todo el sistema:**
   ```bash
   docker compose up -d --build
   ```

¡Y listo! Al iniciar los contenedores:
- **Base de datos (PostgreSQL 16)** arranca de forma aislada y persistente en el volumen `sigic_pgdata`.
- **SiGIC Web & API** arranca en `http://localhost:3000` (o la IP pública del servidor).
- La base de datos se inicializa automáticamente gracias a `src/lib/schema.ts`, creando todas las tablas, relaciones, índices y roles necesarios.
- Al abrir por primera vez en el navegador se presentará el **Asistente de Configuración Inicial (Setup Wizard)** para registrar al primer administrador institucional y crear la ceremonia.

---

## 🛠️ Comandos de Gestión Útiles

- **Ver estado de los contenedores:**
  ```bash
  docker compose ps
  ```

- **Ver logs en tiempo real:**
  ```bash
  docker compose logs -f sigic-web
  ```

- **Detener el sistema (conservando los datos):**
  ```bash
  docker compose stop
  ```

- **Reiniciar el sistema:**
  ```bash
  docker compose restart
  ```

- **Actualizar a la última versión:**
  ```bash
  git pull origin master
  docker compose up -d --build
  ```
