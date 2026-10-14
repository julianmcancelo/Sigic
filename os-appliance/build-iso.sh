#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Generador de SiGIC OS Appliance Ultraliviano
# Basado en Debian Minimal Netinst (Super estable, minimalista y ultra liviano)
# ==============================================================================

DEBIAN_URL="https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/"
ISO_NAME=$(curl -sL "$DEBIAN_URL" | grep -oP 'href="\Kdebian-[0-9\.]+-amd64-netinst\.iso' | head -n 1)

if [ -z "$ISO_NAME" ]; then
  ISO_NAME="debian-13.7.0-amd64-netinst.iso"
fi

echo "=== Generador de SiGIC OS Appliance Ultraliviano ==="
echo "Base: Debian Minimal Netinst ($ISO_NAME)"

# 1. Instalar dependencias si faltan
for cmd in xorriso 7z; do
  if ! command -v $cmd &> /dev/null; then
    echo "Instalando herramientas de empaquetado ($cmd)..."
    sudo apt update && sudo apt install -y p7zip-full xorriso isolinux
    break
  fi
done

# 2. Descargar imagen base mínima
if [ ! -f "$ISO_NAME" ]; then
  echo "Descargando imagen mínima de Debian (${DEBIAN_URL}${ISO_NAME})..."
  wget -O "$ISO_NAME" "${DEBIAN_URL}${ISO_NAME}"
fi

# 3. Extraer imagen
echo "Extrayendo imagen liviana..."
rm -rf iso_extraida iso_nueva
7z x "$ISO_NAME" -oiso_extraida

mkdir -p iso_nueva
cp -r iso_extraida/* iso_nueva/ 2>/dev/null || true

# 4. Inyectar instalador desatendido preseed.cfg
mkdir -p iso_nueva/preseed
cp preseed.cfg iso_nueva/preseed.cfg
cp preseed.cfg iso_nueva/preseed/preseed.cfg

# 5. Inyectar menú GRUB de arranque oficial con branding SiGIC
if [ -f grub.cfg ]; then
  cp grub.cfg iso_nueva/boot/grub/grub.cfg 2>/dev/null || true
fi

# 6. Empaquetar nueva ISO ultra liviana
ISO_SALIDA="sigic-os-lightweight-amd64.iso"
echo "Empaquetando $ISO_SALIDA..."

xorriso -as mkisofs \
  -r -V "SIGIC_OS_LIGHT" \
  -J -l -b isolinux/isolinux.bin \
  -c isolinux/boot.cat \
  -no-emul-boot -boot-load-size 4 -boot-info-table \
  -eltorito-alt-boot \
  -e boot/grub/efi.img \
  -no-emul-boot -isohybrid-gpt-basdat \
  -o "$ISO_SALIDA" \
  iso_nueva 2>/dev/null || \
xorriso -as mkisofs \
  -r -V "SIGIC_OS_LIGHT" \
  -J -l \
  -o "$ISO_SALIDA" \
  iso_nueva

echo "=========================================================="
echo "¡LISTO! Se generó la imagen ultraliviana: $ISO_SALIDA"
echo "Tamaño super reducido, consumo mínimo de RAM y disco."
echo "=========================================================="
