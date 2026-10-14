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

# Copiar pantalla de bienvenida estética y logo
mkdir -p /opt/sigic-splash
cp /opt/sigic/os-appliance/splash.html /opt/sigic-splash/index.html
if [ -f "/opt/sigic/codigo/plataforma/public/logo.png" ]; then
  cp /opt/sigic/codigo/plataforma/public/logo.png /opt/sigic-splash/logo.png
fi
chown -R sigic:sigic /opt/sigic-splash

# Lanzar Chromium en modo Kiosco a pantalla completa
# Abre la pantalla de carga idéntica a SiGIC de inmediato, la cual redirige sola al detectar el servidor
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
  --app=file:///opt/sigic-splash/index.html
EOF

chmod +x /home/sigic/.xsession
chown -R sigic:sigic /home/sigic

systemctl enable nodm
