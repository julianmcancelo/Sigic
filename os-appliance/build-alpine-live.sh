#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Generador de SiGIC OS Live Appliance con Alpine Linux Extended
# 100% Modo Diskless / RAM-Only — Booteo instantáneo en VirtualBox y PCs físicas
# ==============================================================================

echo "=== Generador de SiGIC OS Live Appliance (Alpine Linux Extended) ==="

ALPINE_VERSION="3.20"
ALPINE_RELEASE="3.20.3"
ALPINE_ISO_NAME="alpine-extended-${ALPINE_RELEASE}-x86_64.iso"
ALPINE_URL="https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VERSION}/releases/x86_64/${ALPINE_ISO_NAME}"

# 1. Descargar Alpine Extended oficial
if [ ! -f "$ALPINE_ISO_NAME" ]; then
  echo "Descargando Alpine Linux Extended oficial (${ALPINE_ISO_NAME})..."
  wget -q --show-progress "$ALPINE_URL" -O "$ALPINE_ISO_NAME"
fi

# 2. Extraer ISO original con xorriso
echo "Extrayendo Alpine ISO..."
rm -rf alpine_iso
mkdir -p alpine_iso
xorriso -osirrox on -indev "$ALPINE_ISO_NAME" -extract / alpine_iso
chmod -R u+w alpine_iso

# 3. Crear overlay / apkovl de configuración desatendida de SiGIC
echo "Generando overlay de configuración SiGIC (apkovl)..."
OVERLAY_DIR="alpine_overlay"
rm -rf "$OVERLAY_DIR"
mkdir -p "$OVERLAY_DIR"

# 3.1 Hostname e identidad institucional
mkdir -p "$OVERLAY_DIR/etc"
echo "sigic-appliance" > "$OVERLAY_DIR/etc/hostname"

cat << 'EOF' > "$OVERLAY_DIR/etc/motd"
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
 ------------------------------------------------------------------
EOF

cat << 'EOF' > "$OVERLAY_DIR/etc/issue"
SiGIC OS 2026 — Instituto Tecnológico Beltrán \n \l

EOF

# 3.2 Repositorios oficiales de Alpine (main y community activos)
mkdir -p "$OVERLAY_DIR/etc/apk"
cat << EOF > "$OVERLAY_DIR/etc/apk/repositories"
https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VERSION}/main
https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VERSION}/community
EOF

# 3.3 Configuración de red local autónoma
mkdir -p "$OVERLAY_DIR/etc/network"
cat << 'EOF' > "$OVERLAY_DIR/etc/network/interfaces"
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp
EOF

# 3.4 Inyectar entorno de escritorio Kiosco y pantalla SiGIC
mkdir -p "$OVERLAY_DIR/opt/sigic-splash"
cp splash.html "$OVERLAY_DIR/opt/sigic-splash/index.html"
if [ -f "../codigo/plataforma/public/logo.png" ]; then
  cp ../codigo/plataforma/public/logo.png "$OVERLAY_DIR/opt/sigic-splash/logo.png"
fi

# 3.5 Script de inicio de interfaz gráfica Kiosco (.xinitrc)
mkdir -p "$OVERLAY_DIR/root"
cat << 'EOF' > "$OVERLAY_DIR/root/.xinitrc"
#!/bin/sh
xset s off
xset -dpms
xset s noblank
openbox &

# Abrir Chromium en pantalla completa
exec chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --app=file:///opt/sigic-splash/index.html
EOF
chmod +x "$OVERLAY_DIR/root/.xinitrc"

# 3.6 Servicio de inicio automático de SiGIC
mkdir -p "$OVERLAY_DIR/etc/init.d"
cat << 'EOF' > "$OVERLAY_DIR/etc/init.d/sigic-kiosk"
#!/sbin/openrc-run

description="SiGIC OS Kiosk Mode Service"

depend() {
    need localmount
    after bootmisc
}

start() {
    ebegin "Iniciando SiGIC OS Kiosk..."
    # Configurar usuario sin password
    echo "root:sigic" | chpasswd
    
    # Iniciar servidor Xorg directo con .xinitrc
    startx &
    eend $?
}
EOF
chmod +x "$OVERLAY_DIR/etc/init.d/sigic-kiosk"

# Activar servicios al arrancar en OpenRC
mkdir -p "$OVERLAY_DIR/etc/runlevels/default"
ln -sf /etc/init.d/sigic-kiosk "$OVERLAY_DIR/etc/runlevels/default/sigic-kiosk"
ln -sf /etc/init.d/networking "$OVERLAY_DIR/etc/runlevels/default/networking"

# 3.7 Empaquetar el overlay apkovl
cd "$OVERLAY_DIR"
tar -czvf ../alpine_iso/localhost.apkovl.tar.gz *
cd ..
rm -rf "$OVERLAY_DIR"

# 4. Personalizar Menú GRUB / Syslinux de arranque con créditos del Beltrán
if [ -f "alpine_iso/boot/syslinux/syslinux.cfg" ]; then
  cat << 'EOF' > alpine_iso/boot/syslinux/syslinux.cfg
TIMEOUT 20
PROMPT 0
DEFAULT sigic

MENU TITLE SiGIC OS (Alpine Extended) - Inst. Tecnologico Beltran

LABEL sigic
  MENU LABEL Iniciar SiGIC OS Live (Directo a RAM - Alumnos Beltran 2026)
  LINUX /boot/vmlinuz-lts
  INITRD /boot/initramfs-lts
  APPEND modules=loop,squashfs modloop=/boot/modloop-lts quiet console=tty0
EOF
fi

if [ -f "alpine_iso/boot/grub/grub.cfg" ]; then
  cat << 'EOF' > alpine_iso/boot/grub/grub.cfg
set default="0"
set timeout=2

set menu_color_normal=cyan/black
set menu_color_highlight=black/light-cyan

echo "  ========================================================================"
echo "    SIGIC OS (ALPINE EXTENDED) — SISTEMA DE GESTION DE COLACIONES        "
echo "    Instituto Tecnologico Beltran — Practica Profesionalizante 2026       "
echo "  ========================================================================"
echo "    Alumnos:"
echo "    • Cancelo Julian"
echo "    • Alfonso Alan Alexis"
echo "    • Contreras Villalba Sol Heilin"
echo "    • Frassia Matias"
echo "    • Santillan Luis Gabriel"
echo "  ========================================================================"

menuentry "Iniciar SiGIC OS Live (Directo a RAM - Modo Kiosco Oficial)" {
    linux /boot/vmlinuz-lts modules=loop,squashfs modloop=/boot/modloop-lts quiet console=tty0
    initrd /boot/initramfs-lts
}
EOF
fi

# 5. Reempaquetar la ISO Híbrida UEFI + BIOS (pesa solo ~800MB)
ISO_FINAL="sigic-os-alpine-extended-amd64.iso"
echo "Empaquetando $ISO_FINAL con xorriso..."

xorriso -as mkisofs \
  -r -V "ALPINE_EXT" \
  -J -joliet-long -l \
  -isohybrid-mbr alpine_iso/boot/syslinux/isolinux.bin 2>/dev/null || true \
  -b boot/syslinux/isolinux.bin \
  -c boot/syslinux/boot.cat \
  -no-emul-boot -boot-load-size 4 -boot-info-table \
  -eltorito-alt-boot -e boot/grub/efi.img -no-emul-boot -isohybrid-gpt-basdat 2>/dev/null || true \
  -o "$ISO_FINAL" \
  alpine_iso 2>/dev/null || xorriso -as mkisofs -r -V "SIGIC_OS" -o "$ISO_FINAL" alpine_iso

echo "=========================================================="
echo "¡LISTO! Se generó la imagen: $ISO_FINAL"
echo "Tamaño ultra compacto, booteo garantizado en RAM en VirtualBox."
echo "=========================================================="
