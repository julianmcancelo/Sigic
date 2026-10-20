#!/bin/bash
set -e

echo "=== INICIANDO CONSTRUCCION DE LA ISO SIGIC DESDE CERO ==="

BUILD_DIR="/home/sigic/iso_build"
sudo rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

echo "Instalando herramientas de masterizado de ISO..."
sudo apt update
sudo apt install -y squashfs-tools xorriso isolinux syslinux-common

echo "1. Creando punto de montaje para extraer la ISO actual..."
sudo mkdir -p /mnt/iso
sudo mount -o loop /dev/sr0 /mnt/iso 2>/dev/null || sudo mount -o loop /dev/cdrom /mnt/iso 2>/dev/null || true

mkdir -p iso_root
if [ -d "/mnt/iso/live" ]; then
    echo "Copiando estructura base de la ISO..."
    cp -r /mnt/iso/* iso_root/ 2>/dev/null || true
fi

echo "2. Extrayendo filesystem.squashfs..."
mkdir -p squashfs-root
if [ -f "iso_root/live/filesystem.squashfs" ]; then
    sudo unsquashfs -d squashfs-root iso_root/live/filesystem.squashfs
else
    echo "Descargando o copiando squashfs del sistema..."
fi

echo "3. Inyectando la plataforma SiGIC actualizada..."
sudo mkdir -p squashfs-root/opt/sigic-web
sudo tar -xzf /tmp/sigic-web.tar.gz -C squashfs-root/opt/sigic-web/

# Copiar .env local
cat << 'EOF' | sudo tee squashfs-root/opt/sigic-web/.env.local
DATABASE_URL=postgresql://sigic:sigic@localhost:5432/sigic
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=sigic-beltran-secret-key-production-2026
EOF

echo "4. Inyectando los 10 fondos de pantalla institucionales..."
sudo mkdir -p squashfs-root/usr/share/backgrounds/sigic
sudo cp -r /usr/share/backgrounds/sigic/* squashfs-root/usr/share/backgrounds/sigic/

echo "5. Inyectando ejecutable maestro y lanzador de escritorio..."
sudo cp /usr/local/bin/iniciar-sigic squashfs-root/usr/local/bin/iniciar-sigic
sudo chmod +x squashfs-root/usr/local/bin/iniciar-sigic

sudo mkdir -p squashfs-root/etc/skel/Desktop squashfs-root/etc/skel/.config/autostart
sudo cp /home/sigic/Desktop/INICIAR-SIGIC.desktop squashfs-root/etc/skel/Desktop/
sudo cp /home/sigic/Desktop/INICIAR-SIGIC.desktop squashfs-root/etc/skel/.config/autostart/

echo "6. Empaquetando nuevo filesystem.squashfs (compresión XZ)..."
sudo rm -f iso_root/live/filesystem.squashfs
sudo mksquashfs squashfs-root iso_root/live/filesystem.squashfs -comp xz -b 1M

echo "7. Creando nueva ISO booteable híbrida..."
ISO_OUTPUT="/home/sigic/sigic-os-final.iso"
sudo rm -f "$ISO_OUTPUT"

xorriso -as mkisofs \
    -iso-level 3 \
    -full-iso9660-filenames \
    -volid "SIGIC_OS_BELTRAN" \
    -eltorito-boot isolinux/isolinux.bin \
    -eltorito-catalog isolinux/boot.cat \
    -no-emul-boot -boot-load-size 4 -boot-info-table \
    -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin \
    -eltorito-alt-boot \
    -e boot/grub/efi.img \
    -no-emul-boot -isohybrid-gpt-basdat \
    -output "$ISO_OUTPUT" \
    iso_root/

echo "=== ISO GENERADA EXITOSAMENTE: $ISO_OUTPUT ==="
ls -lh "$ISO_OUTPUT"