#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Generador de SiGIC OS Live Appliance con Debian 12 (Bookworm)
# Basado en Debian Live Oficial — 100% Booteable en RAM (Sin instalar)
# ==============================================================================

echo "=== Generador de SiGIC OS Live Appliance (Debian 12 Bookworm) ==="

# 1. Instalar dependencias necesarias para Debian Live
sudo apt update
sudo apt install -y live-build debootstrap isolinux syslinux-common xorriso squashfs-tools debian-archive-keyring

# 2. Directorio de trabajo
BUILD_DIR="debian-live"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# 3. Configurar live-build para Debian 12 con soporte híbrido BIOS + UEFI y mirrors de Debian oficiales
echo "Configurando live-build..."
lb config \
  --mode debian \
  --distribution bookworm \
  --architectures amd64 \
  --mirror-bootstrap "http://deb.debian.org/debian/" \
  --mirror-chroot "http://deb.debian.org/debian/" \
  --mirror-binary "http://deb.debian.org/debian/" \
  --archive-areas "main contrib non-free non-free-firmware" \
  --bootloader syslinux \
  --binary-images iso-hybrid \
  --iso-application "SiGIC OS 2026 - Instituto Tecnologico Beltran" \
  --iso-publisher "Alumnos de Practica Profesionalizante 2026" \
  --iso-volume "SIGIC_OS" \
  --memtest none \
  --win32-loader false



# 4. Lista de paquetes esenciales para SiGIC Appliance
mkdir -p config/package-lists
cat << 'EOF' > config/package-lists/sigic.list.chroot
# Base del sistema y kernel
linux-image-amd64
live-boot
live-config
live-config-systemd
systemd-sysv

# Red y conectividad
network-manager
wireless-tools
wpasupplicant
hostapd
dnsmasq
curl
wget
ca-certificates

# Servidor gráfico mínimo
xorg
xserver-xorg-video-all
openbox
nodm
unclutter
x11-xserver-utils

# Navegador Kiosco
chromium

# Splash visual
plymouth
plymouth-themes

# Node.js y utilidades
git
htop
neofetch
net-tools
EOF

# 5. Inyectar personalización y configuración del sistema (Chroot Hook)
mkdir -p config/hooks/live
cat << 'EOF' > config/hooks/live/99-sigic-custom.chroot
#!/bin/bash
set -e

echo "=== Personalizando SiGIC OS ==="

# Crear usuario sigic con contraseña sigic
useradd -m -s /bin/bash -G sudo,video,audio,netdev sigic || true
echo "sigic:sigic" | chpasswd

# Hostname e identidad
echo "sigic-appliance" > /etc/hostname
cat << 'EOT' > /etc/issue
SiGIC OS 2026 — Instituto Tecnologico Beltran \n \l

EOT
cp /etc/issue /etc/issue.net

cat << 'EOT' > /etc/motd
   _____ _ _____ _____ _____ 
  / ____(_) ____|_   _/ ____|
 | (___  _| |__   | || |     
  \___ \| |  __|  | || |     
  ____) | | |___ _| || |____ 
 |_____/|_|_____|_____\_____|
 
 Sistema de Gestion de Colaciones
 Instituto Tecnologico Beltran — Practica Profesionalizante 2026
 ------------------------------------------------------------------
 Alumnos:
 • Cancelo Julian
 • Alfonso Alan Alexis
 • Contreras Villalba Sol Heilin
 • Frassia Matias
 • Santillan Luis Gabriel
 ------------------------------------------------------------------
 Acceso al sistema:
 • Web local:       http://localhost:3000
 ------------------------------------------------------------------
EOT

# Configurar nodm para autologin directo sin pedir contraseña
cat << 'EOT' > /etc/default/nodm
NODM_ENABLE=true
NODM_USER=sigic
NODM_XSESSION=/home/sigic/.xsession
NODM_X_OPTIONS="-nocursor"
EOT

# Crear sesión gráfica Kiosco
mkdir -p /home/sigic/.config/openbox
cat << 'EOT' > /home/sigic/.xsession
#!/bin/bash
xset s off
xset -dpms
xset s noblank
unclutter -idle 3 -root &
openbox-session &

# Abrir Chromium en modo Kiosk directo
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-features=Translate \
  --app=file:///opt/sigic-splash/index.html &
EOT

chmod +x /home/sigic/.xsession
chown -R sigic:sigic /home/sigic

# Copiar pantalla de bienvenida visual
mkdir -p /opt/sigic-splash
if [ -f "/opt/sigic-splash/index.html" ]; then
  chmod -R 755 /opt/sigic-splash
fi

# Activar servicios
systemctl enable nodm || true
EOF

chmod +x config/hooks/live/99-sigic-custom.chroot

# 6. Inyectar splash de SiGIC en el chroot
mkdir -p config/includes.chroot/opt/sigic-splash
cp ../splash.html config/includes.chroot/opt/sigic-splash/index.html
if [ -f "../../codigo/plataforma/public/logo.png" ]; then
  cp ../../codigo/plataforma/public/logo.png config/includes.chroot/opt/sigic-splash/logo.png
fi

# 7. Inyectar menú GRUB personalizado con los créditos del Beltrán
mkdir -p config/bootloaders/grub-pc
mkdir -p config/bootloaders/grub-efi
cat << 'EOF' > config/bootloaders/grub-pc/grub.cfg
set default="0"
set timeout=3

set menu_color_normal=cyan/black
set menu_color_highlight=black/light-cyan

echo " "
echo "  ========================================================================"
echo "    SIGIC OS (DEBIAN 12 LIVE) — SISTEMA DE GESTION DE COLACIONES          "
echo "    Instituto Tecnologico Beltran — Practica Profesionalizante 2026       "
echo "  ========================================================================"
echo "    Alumnos:"
echo "    • Cancelo Julian"
echo "    • Alfonso Alan Alexis"
echo "    • Contreras Villalba Sol Heilin"
echo "    • Frassia Matias"
echo "    • Santillan Luis Gabriel"
echo "  ========================================================================"
echo " "

menuentry "Iniciar SiGIC OS Live (Directo a Memoria RAM - Sin Instalar)" {
    linux /live/vmlinuz boot=live components quiet splash splash.theme=sigic
    initrd /live/initrd.img
}

menuentry "Iniciar SiGIC OS (Modo Seguro / Diagnostico)" {
    linux /live/vmlinuz boot=live components nomodeset
    initrd /live/initrd.img
}
EOF
cp config/bootloaders/grub-pc/grub.cfg config/bootloaders/grub-efi/grub.cfg

# 8. Compilar la ISO Live con live-build
echo "Compilando Debian Live ISO..."
sudo lb build

# 9. Mover y nombrar la ISO final
ISO_GENERADA=$(ls live-image-amd64.hybrid.iso live-image-amd64.iso 2>/dev/null | head -n 1)
if [ -f "$ISO_GENERADA" ]; then
  mv "$ISO_GENERADA" ../sigic-os-debian12-live-amd64.iso
  echo "=========================================================="
  echo "¡LISTO! Se generó la ISO Oficial: sigic-os-debian12-live-amd64.iso"
  echo "=========================================================="
else
  echo "Error: No se encontró la imagen ISO compilada."
  exit 1
fi
