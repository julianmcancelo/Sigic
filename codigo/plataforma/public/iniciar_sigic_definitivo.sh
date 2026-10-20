#!/bin/bash
set -e

# Levantar base de datos y servidor
sudo systemctl start postgresql
sudo systemctl restart sigic-server
sleep 2

# Cerrar navegadores previos
killall chromium chromium-browser 2>/dev/null || true

# Abrir Chromium directo en el Panel Clásico
export DISPLAY=:0
chromium --no-default-browser-check --no-first-run --password-store=basic --start-maximized "http://localhost:3000/?admin_token=bypass-admin-token" &