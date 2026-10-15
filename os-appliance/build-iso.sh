#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Generador de SiGIC OS Appliance con Interfaz de Escritorio Oficial
# Basado en Ubuntu con entorno visual exacto al Escritorio SiGIC
# ==============================================================================

UBUNTU_VER="24.04"
echo "=== Generador de SiGIC OS Ubuntu Desktop Edition ==="

# 1. Instalar dependencias necesarias
for cmd in xorriso 7z wget; do
  if ! command -v $cmd &> /dev/null; then
    echo "Instalando herramientas ($cmd)..."
    sudo apt update && sudo apt install -y p7zip-full xorriso isolinux wget curl
    break
  fi
done

# 2. Resolver y descargar la última ISO oficial de Ubuntu Server 24.04 LTS
if [ ! -f "ubuntu-base.iso" ]; then
  echo "Resolviendo enlace oficial de descarga de Ubuntu Server 24.04 LTS..."
  ISO_URL=$(curl -sL "https://releases.ubuntu.com/24.04/" | grep -oP 'href="\Kubuntu-24\.04\.[0-9]+-live-server-amd64\.iso' | head -n 1)
  if [ -z "$ISO_URL" ]; then
    ISO_URL="ubuntu-24.04.5-live-server-amd64.iso"
  fi
  echo "Descargando Ubuntu base: https://releases.ubuntu.com/24.04/${ISO_URL} ..."
  wget -O "ubuntu-base.iso" "https://releases.ubuntu.com/24.04/${ISO_URL}"
fi

ISO_ORIGINAL="ubuntu-base.iso"

# 3. Extraer imagen original
echo "Extrayendo imagen..."
rm -rf iso_extraida iso_nueva
7z x "$ISO_ORIGINAL" -oiso_extraida

mkdir -p iso_nueva
cp -r iso_extraida/* iso_nueva/ 2>/dev/null || true

# 4. Inyectar configuración desatendida autoinstall
mkdir -p iso_nueva/nocloud
cp user-data iso_nueva/nocloud/user-data
touch iso_nueva/nocloud/meta-data

# 5. Inyectar menú GRUB de arranque personalizado y cambiar la identidad del disco
if [ -f grub.cfg ]; then
  cp grub.cfg iso_nueva/boot/grub/grub.cfg 2>/dev/null || true
  cp grub.cfg iso_nueva/boot/grub/loopback.cfg 2>/dev/null || true
  cp grub.cfg iso_nueva/EFI/boot/grub.cfg 2>/dev/null || true
fi

# Reemplazar el nombre del sistema en la metadata del disco
mkdir -p iso_nueva/.disk
echo "SiGIC OS 2026 - Instituto Tecnologico Beltran" > iso_nueva/.disk/info 2>/dev/null || true

# 6. Empaquetar nueva ISO booteable de SiGIC Ubuntu (Totalmente compatible con VirtualBox UEFI y BIOS)
ISO_SALIDA="sigic-os-ubuntu-desktop-amd64.iso"
echo "Empaquetando $ISO_SALIDA con arranque hibrido UEFI + BIOS..."

# Extraer el sector MBR booteable de la imagen original de Ubuntu
dd if="$ISO_ORIGINAL" bs=1 count=446 of=isohdpfx.bin 2>/dev/null || true

# En Ubuntu 24.04, la imagen de arranque EFI puede estar en EFI/boot/bootx64.efi o boot/grub/i386-pc
EFI_OPT=""
if [ -f "iso_nueva/EFI/boot/bootx64.efi" ]; then
  # Crear una imagen FAT EFI estándar si no existe efi.img suelta
  mkdir -p efidir/EFI/boot
  cp iso_nueva/EFI/boot/bootx64.efi efidir/EFI/boot/ 2>/dev/null || true
  if [ -f "iso_nueva/boot/grub/grub.cfg" ]; then
    mkdir -p efidir/boot/grub
    cp iso_nueva/boot/grub/grub.cfg efidir/boot/grub/
  fi
  # Generar efi.img
  dd if=/dev/zero of=iso_nueva/boot/efi.img bs=1M count=10 2>/dev/null || true
  mkfs.vfat iso_nueva/boot/efi.img 2>/dev/null || true
  mcopy -i iso_nueva/boot/efi.img -s efidir/* ::/ 2>/dev/null || true
  EFI_OPT="-eltorito-alt-boot -e boot/efi.img -no-emul-boot -isohybrid-gpt-basdat"
fi

BOOT_OPT=""
if [ -f "iso_nueva/boot/grub/i386-pc/eltorito.img" ]; then
  BOOT_OPT="-b boot/grub/i386-pc/eltorito.img -c boot.catalog -no-emul-boot -boot-load-size 4 -boot-info-table"
elif [ -f "iso_nueva/isolinux/isolinux.bin" ]; then
  BOOT_OPT="-b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table"
fi

xorriso -as mkisofs \
  -r -V "SIGIC_OS" \
  -J -joliet-long -l \
  -partition_offset 16 \
  -isohybrid-mbr isohdpfx.bin \
  $BOOT_OPT \
  $EFI_OPT \
  -o "$ISO_SALIDA" \
  iso_nueva

echo "=========================================================="
echo "¡LISTO! Se generó la imagen oficial: $ISO_SALIDA"
echo "Basada en Ubuntu 24.04 LTS con el escritorio idéntico a SiGIC."
echo "=========================================================="
