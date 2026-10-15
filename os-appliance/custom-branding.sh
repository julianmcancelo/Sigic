#!/usr/bin/env bash
set -e

# ==============================================================================
# Script de Personalización Estética y de Marca para SiGIC Linux
# ==============================================================================

echo "=== Aplicando personalización visual e institucional a SiGIC Linux ==="

# 1. Mensaje de bienvenida en terminal (simple y claro)
cat << 'EOF' > /etc/motd
   _____ _ _____ _____ _____ 
  / ____(_) ____|_   _/ ____|
 | (___  _| |__   | || |     
  \___ \| |  __|  | || |     
  ____) | | |___ _| || |____ 
 |_____/|_|_____|_____\_____|
 
 Sistema de Gestión de Colaciones
 Instituto Tecnológico Beltrán — Práctica Profesionalizante 2026
 ------------------------------------------------------------------
 Alumnos:
 • Cancelo Julián
 • Alfonso Alan Alexis
 • Contreras Villalba Sol Heilin
 • Frassia Matías
 • Santillán Luis Gabriel
 ------------------------------------------------------------------
 Acceso al sistema:
 • Web local:       http://localhost:3000
 • Estado:          docker compose -f /opt/sigic/docker-compose.yml ps
 • Ver registros:   docker compose -f /opt/sigic/docker-compose.yml logs -f
 ------------------------------------------------------------------
EOF

# 2. Configurar el tema de booteo Plymouth oficial de SiGIC (reemplazar pantalla morada de Ubuntu)
mkdir -p /usr/share/plymouth/themes/sigic
if [ -d "/opt/sigic/os-appliance/plymouth-theme" ]; then
  cp -r /opt/sigic/os-appliance/plymouth-theme/* /usr/share/plymouth/themes/sigic/
  plymouth-set-default-theme -R sigic 2>/dev/null || update-alternatives --install /usr/share/plymouth/themes/default.plymouth default.plymouth /usr/share/plymouth/themes/sigic/sigic.plymouth 100 2>/dev/null || true
  update-initramfs -u 2>/dev/null || true
fi

# 2.1 Configurar el fondo de pantalla oficial
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

# 4. Hostname e identidad del sistema operativo (reemplazar Ubuntu por SiGIC OS)
echo "sigic-appliance" > /etc/hostname
sed -i 's/127.0.1.1.*/127.0.1.1\tsigic-appliance/g' /etc/hosts 2>/dev/null || true

cat << 'EOF' > /etc/issue
SiGIC OS 2026 — Instituto Tecnológico Beltrán \n \l

EOF

cp /etc/issue /etc/issue.net

# Personalizar /etc/os-release para herramientas y auditoría
cat << 'EOF' > /etc/os-release
NAME="SiGIC OS"
VERSION="2026 (Appliance)"
ID=sigic
ID_LIKE=ubuntu
PRETTY_NAME="SiGIC OS 2026 — Instituto Tecnológico Beltrán"
VERSION_ID="2026"
HOME_URL="https://www.sigic.com.ar"
SUPPORT_URL="https://github.com/julianmcancelo/Sigic"
BUG_REPORT_URL="https://github.com/julianmcancelo/Sigic/issues"
EOF

echo "¡Personalización aplicada exitosamente!"
