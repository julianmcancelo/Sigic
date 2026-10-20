#!/bin/bash
set -e

# Iniciar PostgreSQL
sudo systemctl start postgresql

# Inicializar esquema si es necesario
sudo sigic-db-init

# Iniciar servidor web Next.js
sudo systemctl restart sigic-server

# Esperar a que el puerto este listo
sleep 2

# Matar instancias previas colgadas
killall chromium chromium-browser 2>/dev/null || true

# Lanzar navegador
export DISPLAY=:0
chromium --no-default-browser-check --no-first-run --password-store=basic --start-maximized http://localhost:3000 &