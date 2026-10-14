#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Generador de ISO Autónoma (SiGIC OS Appliance)
# Basado en Ubuntu Server Live + Autoinstall
# ==============================================================================

UBUNTU_VER="24.04"
ISO_ORIGINAL="ubuntu-${UBUNTU_VER}-live-server-amd64.iso"
ISO_SALIDA="sigic-os-${UBUNTU_VER}-autoinstall.iso"

echo "=== Generador de SiGIC OS Appliance ==="

# 1. Verificar dependencias
for cmd in xorriso 7z mksquashfs; do
  if ! command -v $cmd &> /dev/null; then
    echo "Instalando dependencias necesarias ($cmd)..."
    sudo apt update && sudo apt install -y p7zip-full xorriso isolinux
    break
  fi
done

# 2. Descargar ISO oficial de Ubuntu Server
# Ubuntu actualiza los releases puntuales (ej: 24.04.2 / 24.04.3 / 24.04.5), por lo que resolvemos el enlace actual
if [ ! -f "ubuntu-base.iso" ]; then
  echo "Resolviendo enlace oficial de descarga de Ubuntu Server 24.04 LTS..."
  ISO_URL=$(curl -sL "https://releases.ubuntu.com/24.04/" | grep -oP 'href="\Kubuntu-24\.04\.[0-9]+-live-server-amd64\.iso' | head -n 1)
  if [ -z "$ISO_URL" ]; then
    ISO_URL="ubuntu-24.04.5-live-server-amd64.iso"
  fi
  echo "Descargando: https://releases.ubuntu.com/24.04/${ISO_URL} ..."
  wget -O "ubuntu-base.iso" "https://releases.ubuntu.com/24.04/${ISO_URL}"
fi
ISO_ORIGINAL="ubuntu-base.iso"

# 3. Preparar directorios de trabajo
echo "Extrayendo imagen..."
rm -rf iso_extraida iso_nueva
7z x "$ISO_ORIGINAL" -oiso_extraida

mkdir -p iso_nueva
cp -r iso_extraida/* iso_nueva/ 2>/dev/null || true

# 4. Inyectar configuración desatendida (Autoinstall)
mkdir -p iso_nueva/nocloud
cp user-data iso_nueva/nocloud/user-data
touch iso_nueva/nocloud/meta-data

# 5. Inyectar menú GRUB de arranque oficial con branding SiGIC
if [ -f grub.cfg ]; then
  cp grub.cfg iso_nueva/boot/grub/grub.cfg
fi

# 6. Empaquetar nueva ISO booteable
echo "Empaquetando $ISO_SALIDA..."
xorriso -as mkisofs \
  -r -V "SIGIC_OS" \
  -J -l -b boot/grub/i386-pc/eltorito.img \
  -c boot.catalog \
  -no-emul-boot -boot-load-size 4 -boot-info-table \
  -eltorito-alt-boot \
  -e boot/grub/efi.img \
  -no-emul-boot -isohybrid-gpt-basdat \
  -o "$ISO_SALIDA" \
  iso_nueva

echo "=========================================================="
echo "¡LISTO! Se generó la imagen: $ISO_SALIDA"
echo "Podés quemarla en un pendrive con Rufus, BalenaEtcher o Ventoy."
echo "=========================================================="
