#!/usr/bin/env bash
set -e

# ==============================================================================
# Script de Personalización Estética y de Marca (Branding) para SiGIC Linux
# ==============================================================================

echo "=== Aplicando personalización visual e institucional a SiGIC Linux ==="

# 1. Mensaje de Bienvenida en Terminal (MOTD) 100% en Español
cat << 'EOF' > /etc/motd
   _____ _ _____ _____ _____ 
  / ____(_) ____|_   _/ ____|
 | (___  _| |__   | || |     
  \___ \| |  __|  | || |     
  ____) | | |___ _| || |____ 
 |_____/|_|_____|_____\_____|
 
 Sistema de Gestión Institucional de Colaciones
 Instituto Tecnológico Beltrán — Prácticas Profesionalizantes 2026
 ------------------------------------------------------------------
 Equipo de Desarrollo:
 • Cancelo Julián
 • Alfonso Alan Alexis
 • Contreras Villalba Sol Heilin
 • Frassia Matías
 • Santillán Luis Gabriel
 ------------------------------------------------------------------
 Estado del Sistema:
 • Portal Web:        http://localhost:3000
 • Ver Servicios:     docker compose -f /opt/sigic/docker-compose.yml ps
 • Ver Registros:     docker compose -f /opt/sigic/docker-compose.yml logs -f
 ------------------------------------------------------------------
EOF

# 2. Configurar el fondo de pantalla oficial
mkdir -p /usr/share/backgrounds/sigic
if [ -f "/opt/sigic/codigo/plataforma/public/logo.png" ]; then
  cp /opt/sigic/codigo/plataforma/public/logo.png /usr/share/backgrounds/sigic/logo.png
fi

# 3. Personalizar Openbox (sin decoraciones, pantalla completa y minimalista)
mkdir -p /etc/skel/.config/openbox
cat << 'EOF' > /etc/skel/.config/openbox/rc.xml
<?xml version="1.0" encoding="UTF-8"?>
<openbox_config xmlns="http://openbox.org/3.4/rc">
  <theme>
    <name>Clearlooks</name>
    <titleLayout></titleLayout>
  </theme>
  <desktops>
    <number>1</number>
  </desktops>
  <applications>
    <application class="*">
      <decor>no</decor>
      <maximized>yes</maximized>
      <fullscreen>yes</fullscreen>
    </application>
  </applications>
</openbox_config>
EOF

# 4. Hostname y banner de red institucional
echo "sigic-appliance" > /etc/hostname
sed -i 's/127.0.1.1.*/127.0.1.1\tsigic-appliance/g' /etc/hosts 2>/dev/null || true

echo "¡Personalización estética e institucional aplicada exitosamente!"
