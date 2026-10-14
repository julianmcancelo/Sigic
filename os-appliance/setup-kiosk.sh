#!/usr/bin/env bash
set -e

# ==============================================================================
# Script de Configuración del Modo Kiosco para SiGIC Appliance
# ==============================================================================

# 1. Configurar nodm para autologin con usuario 'sigic'
cat << 'EOF' > /etc/default/nodm
NODM_ENABLE=true
NODM_USER=sigic
NODM_XSESSION=/home/sigic/.xsession
NODM_X_OPTIONS="-nocursor"
EOF

# 2. Crear sesión X mínima con Openbox y Chromium en pantalla completa
mkdir -p /home/sigic/.config/openbox
cat << 'EOF' > /home/sigic/.xsession
#!/bin/bash

# Deshabilitar ahorro de energía de pantalla
xset s off
xset -dpms
xset s noblank

# Ocultar puntero del mouse tras inactividad
unclutter -idle 3 -root &

# Iniciar gestor de ventanas liviano
openbox-session &

# Esperar a que el backend de SiGIC esté respondiendo en localhost:3000
echo "Esperando a SiGIC..."
until curl -s http://localhost:3000/api/estado > /dev/null 2>&1 || curl -s http://localhost:3000 > /dev/null 2>&1; do
  sleep 2
done

# Lanzar Chromium en modo Kiosco a pantalla completa
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-features=Translate \
  --app=http://localhost:3000
EOF

chmod +x /home/sigic/.xsession
chown -R sigic:sigic /home/sigic

systemctl enable nodm
