#!/bin/bash
# =============================================================================
# SiGIC OS — Construcción de la ISO con Debian live-build (Debian 13 "trixie")
# Se ejecuta dentro de un contenedor debian:trixie (ver workflow de GitHub).
#   Entrada : /work/os-appliance/sigic-build  (Next.js standalone ya compilado)
#   Salida  : /work/os-appliance/sigic-os-amd64.iso
# =============================================================================
set -euo pipefail

RAIZ="/work/os-appliance"
LB_SRC="$RAIZ/live-build"
TRABAJO="/tmp/sigic-lb"
VERSION="${SIGIC_VERSION:-7.3.0}"

echo ">> Instalando herramientas de construcción..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  live-build debootstrap squashfs-tools xorriso isolinux syslinux-common \
  grub-pc-bin grub-efi-amd64-bin grub-efi-amd64-signed shim-signed mtools dosfstools \
  imagemagick librsvg2-bin openssl ca-certificates curl gnupg rsync

# --- Validar que la plataforma web fue compilada correctamente ---------------
if [ ! -f "$RAIZ/sigic-build/server.js" ]; then
  echo "ERROR: no existe os-appliance/sigic-build/server.js (¿falló 'next build' standalone?)"
  ls -la "$RAIZ/sigic-build" || true
  exit 1
fi

rm -rf "$TRABAJO"
mkdir -p "$TRABAJO"
cd "$TRABAJO"

# --- Configuración base de live-build ----------------------------------------
lb config \
  --distribution trixie \
  --architectures amd64 \
  --linux-flavours amd64 \
  --archive-areas "main contrib non-free-firmware" \
  --mirror-bootstrap "http://deb.debian.org/debian/" \
  --mirror-chroot "http://deb.debian.org/debian/" \
  --mirror-binary "http://deb.debian.org/debian/" \
  --security true --updates true \
  --binary-images iso-hybrid \
  --bootloaders "syslinux,grub-efi" \
  --debian-installer none \
  --memtest none \
  --win32-loader false \
  --apt-indices false \
  --cache false \
  --firmware-chroot true \
  --chroot-squashfs-compression-type zstd \
  --iso-application "SiGIC OS" \
  --iso-publisher "Instituto Tecnologico Beltran" \
  --iso-volume "SIGIC_OS" \
  --bootappend-live "boot=live components quiet splash hostname=sigic-os username=sigic user-fullname=SiGIC locales=es_AR.UTF-8 keyboard-layouts=latam timezone=America/Argentina/Buenos_Aires"

# --- Copiar paquetes, archivos y hooks propios -------------------------------
cp -r "$LB_SRC/config/." config/
chmod +x config/hooks/normal/*.hook.chroot

# --- Plataforma web ----------------------------------------------------------
mkdir -p config/includes.chroot/opt/sigic-web
cp -a "$RAIZ/sigic-build/." config/includes.chroot/opt/sigic-web/

# --- Secreto JWT único por cada ISO generada ---------------------------------
mkdir -p config/includes.chroot/etc/sigic
cat > config/includes.chroot/etc/sigic/sigic.env <<EOF
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgres://sigic:sigic@localhost:5432/sigic
DB_SSL_INSECURE=1
JWT_SECRET=$(openssl rand -hex 48)
EOF

# --- Identidad visual: fondo de escritorio y splash de arranque --------------
LOGO="$RAIZ/plymouth-theme/logo.png"
mkdir -p config/includes.chroot/usr/share/backgrounds/sigic
if [ -f "$LOGO" ]; then
  convert -size 1920x1080 xc:'#03080e' \( "$LOGO" -resize x380 \) -gravity center -composite \
    config/includes.chroot/usr/share/backgrounds/sigic/fondo.png
  convert -size 640x480 xc:'#03080e' \( "$LOGO" -resize x200 \) -gravity center -composite \
    -depth 8 -colors 256 PNG8:splash.png
  mkdir -p config/includes.chroot/opt/sigic
  cp "$LOGO" config/includes.chroot/opt/sigic/logo.png
  # Tema de arranque Plymouth
  mkdir -p config/includes.chroot/usr/share/plymouth/themes/sigic
  cp "$RAIZ/plymouth-theme/"* config/includes.chroot/usr/share/plymouth/themes/sigic/
else
  convert -size 1920x1080 xc:'#03080e' config/includes.chroot/usr/share/backgrounds/sigic/fondo.png
  convert -size 640x480 xc:'#03080e' -depth 8 -colors 256 PNG8:splash.png
fi

# --- Menú de arranque (BIOS y UEFI) con la marca de SiGIC --------------------
cp -r /usr/share/live/build/bootloaders config/bootloaders
for d in isolinux syslinux_common grub-pc grub-efi; do
  if [ -d "config/bootloaders/$d" ]; then
    rm -f "config/bootloaders/$d/splash.svg"
    cp splash.png "config/bootloaders/$d/splash.png"
  fi
done
find config/bootloaders -type f \( -name '*.cfg' -o -name '*.cfg.in' -o -name 'grub*.cfg' \) | while read -r f; do
  sed -i \
    -e 's/Debian GNU\/Linux/SiGIC OS/g' \
    -e 's/Live system (amd64)/Iniciar SiGIC OS/g' \
    -e 's/Live system (amd64 fail-safe mode)/Iniciar en Modo Seguro/g' \
    -e 's/Live system/Iniciar SiGIC OS/g' \
    -e 's/menu title .*/menu title SiGIC OS - Instituto Tecnologico Beltran/' "$f" || true
done
if [ -f config/bootloaders/isolinux/stdmenu.cfg ]; then
  cat > config/bootloaders/isolinux/stdmenu.cfg <<'EOF'
menu background splash.png
menu color title        * #00e5ff #00000000 none
menu color sel          * #ffffff #154b66 none
menu color hotsel       * #00e5ff #154b66 none
menu color unsel        * #d9f7fb #00000000 none
menu color tabmsg       * #80deea #00000000 none
menu color cmdline      0 #ffffff #00000000 none
menu color timeout_msg  * #80deea #00000000 none
menu color timeout      * #00e5ff #00000000 none
menu color border       * #154b66 #00000000 none
menu tabmsg Presione ENTER para arrancar | Practica Profesionalizante 2026
EOF
fi

# --- Construcción ------------------------------------------------------------
echo ">> Construyendo SiGIC OS v$VERSION (puede tardar 20-40 minutos)..."
lb build 2>&1 | tee build.log

ISO="$(ls -1 ./*.iso | head -n1)"
cp "$ISO" "$RAIZ/sigic-os-amd64.iso"
ls -lh "$RAIZ/sigic-os-amd64.iso"
echo ">> ¡SiGIC OS generado con éxito!"
