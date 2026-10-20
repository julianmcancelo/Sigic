#!/bin/bash
set -e

# Funcion para mostrar mensajes en terminal o ventana grafica
notificar() {
    echo "[SiGIC] $1"
    if which notify-send >/dev/null 2>&1; then
        notify-send "SiGIC Instituto Beltrán" "$1" -i /usr/share/pixmaps/sigic.png 2>/dev/null || true
    fi
}

notificar "Iniciando motor de base de datos PostgreSQL..."
sudo systemctl start postgresql

# Verificar que postgresql responda
until sudo -u postgres pg_isready -q; do
    sleep 1
done

notificar "Verificando esquema y tablas de la plataforma..."
sudo sigic-db-init 2>/dev/null || true

notificar "Iniciando servidor web institucional SiGIC (Next.js)..."
sudo systemctl restart sigic-server

# Esperar a que el puerto 3000 este listo y respondiendo HTTP 200
notificar "Esperando inicialización de la plataforma..."
until curl -s -f http://localhost:3000 >/dev/null 2>&1; do
    sleep 1
done

notificar "Plataforma operativa. Abriendo panel de administración..."

# Cerrar instancias colgadas previas
killall chromium chromium-browser 2>/dev/null || true
sleep 1

# Lanzar navegador maximizado en el Panel Clásico
export DISPLAY=:0
chromium \
    --no-default-browser-check \
    --no-first-run \
    --password-store=basic \
    --disable-gpu \
    --start-maximized \
    "http://localhost:3000/?admin_token=bypass-admin-token" >/dev/null 2>&1 &

notificar "SiGIC listo para operar."