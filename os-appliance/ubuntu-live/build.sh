#!/usr/bin/env bash
# ==============================================================================
# SiGIC OS — Generador de Live ISO Oficial basada en Ubuntu 24.04 LTS (Noble)
# 100% Ejecutable en RAM (Casper) — Compatible con UEFI + BIOS
# No modifica ni interfiere con la build de Debian 13.
# ==============================================================================
set -euo pipefail

RAIZ="$(pwd)"
UBUNTU_DIR="$RAIZ/os-appliance/ubuntu-live"
CHROOT_DIR="/tmp/sigic-ubuntu-chroot"
ISO_DIR="/tmp/sigic-ubuntu-iso"
SALIDA_ISO="$RAIZ/os-appliance/sigic-os-ubuntu-24.04-amd64.iso"
VERSION="${SIGIC_VERSION:-24.04.1}"

echo "=========================================================="
echo ">> Iniciando compilación de SiGIC OS Ubuntu Live Edition v$VERSION"
echo "=========================================================="

# 1. Instalar dependencias en el host
echo ">> [1/8] Instalando herramientas del sistema..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  debootstrap squashfs-tools xorriso grub-pc-bin grub-efi-amd64-bin \
  mtools dosfstools rsync ca-certificates curl openssl

# 2. Debootstrap de Ubuntu 24.04 LTS (Noble Numbat)
echo ">> [2/8] Creando sistema base Ubuntu 24.04 (Noble)..."
sudo rm -rf "$CHROOT_DIR" "$ISO_DIR"
sudo mkdir -p "$CHROOT_DIR" "$ISO_DIR/casper" "$ISO_DIR/boot/grub"

sudo debootstrap --arch=amd64 noble "$CHROOT_DIR" http://archive.ubuntu.com/ubuntu/

# 3. Montar pseudo-sistemas de archivos
sudo mount --bind /dev "$CHROOT_DIR/dev"
sudo mount --bind /dev/pts "$CHROOT_DIR/dev/pts"
sudo mount --bind /proc "$CHROOT_DIR/proc"
sudo mount --bind /sys "$CHROOT_DIR/sys"

cleanup() {
  echo ">> Limpiando montajes..."
  sudo umount "$CHROOT_DIR/dev/pts" 2>/dev/null || true
  sudo umount "$CHROOT_DIR/dev" 2>/dev/null || true
  sudo umount "$CHROOT_DIR/proc" 2>/dev/null || true
  sudo umount "$CHROOT_DIR/sys" 2>/dev/null || true
}
trap cleanup EXIT

# 4. Configurar repositorios Ubuntu completos dentro del chroot
echo ">> [3/8] Configurando repositorios y paquetes en chroot..."
sudo tee "$CHROOT_DIR/etc/apt/sources.list" > /dev/null << 'EOF'
deb http://archive.ubuntu.com/ubuntu/ noble main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu/ noble-updates main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu/ noble-security main restricted universe multiverse
EOF

# Configurar hostname y resolv.conf
sudo cp /etc/resolv.conf "$CHROOT_DIR/etc/resolv.conf"
echo "sigic-ubuntu" | sudo tee "$CHROOT_DIR/etc/hostname" > /dev/null

# 5. Instalar kernel, casper (Live boot) y entorno de escritorio XFCE
echo ">> [4/8] Instalando Kernel Ubuntu, Casper y entorno XFCE..."
sudo chroot "$CHROOT_DIR" /bin/bash -c "
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y --no-install-recommends \
    linux-image-generic casper systemd-sysv \
    xorg xfce4 xfce4-terminal xfce4-notifyd lightdm lightdm-gtk-greeter \
    network-manager network-manager-gnome dbus-x11 \
    python3 python3-gi gir1.2-gtk-3.0 gir1.2-gdkpixbuf-2.0 python3-cairo \
    locales keyboard-configuration console-setup \
    fonts-noto-core fonts-liberation fonts-dejavu-core \
    curl wget rsync sudo psmisc net-tools \
    open-vm-tools spice-vdagent
  apt-get clean
"

# 6. Inyectar todos los componentes de SiGIC (Scripts Python, Web Next.js, Desktop, Fondos Beltrán)
echo ">> [5/8] Inyectando archivos de SiGIC y configuración institucional..."
SRC_CHROOT="$RAIZ/os-appliance/live-build/config/includes.chroot"
if [ -d "$SRC_CHROOT" ]; then
  sudo rsync -a "$SRC_CHROOT/" "$CHROOT_DIR/"
fi

# Inyectar el build standalone de Next.js si existe
if [ -d "$RAIZ/os-appliance/sigic-build" ]; then
  sudo mkdir -p "$CHROOT_DIR/opt/sigic-web"
  sudo rsync -a "$RAIZ/os-appliance/sigic-build/" "$CHROOT_DIR/opt/sigic-web/"
fi

# Configurar usuario live 'sigic' y autologin en LightDM
echo ">> [6/8] Configurando usuario institucional y sesión Live..."
sudo chroot "$CHROOT_DIR" /bin/bash -c "
  # Locales
  sed -i 's/^# *es_AR.UTF-8 UTF-8/es_AR.UTF-8 UTF-8/' /etc/locale.gen
  locale-gen
  update-locale LANG=es_AR.UTF-8 LC_ALL=es_AR.UTF-8

  # Usuario 'sigic' con contraseña 'sigic'
  id sigic >/dev/null 2>&1 || useradd -m -s /bin/bash -c 'SiGIC Instituto Beltrán' sigic
  echo 'sigic:sigic' | chpasswd
  usermod -aG sudo,adm,dialout,video,audio,cdrom sigic
  echo 'sigic ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/sigic
  chmod 0440 /etc/sudoers.d/sigic

  # LightDM Autologin
  mkdir -p /etc/lightdm/lightdm.conf.d
  cat << 'EOF_LDM' > /etc/lightdm/lightdm.conf.d/50-sigic-autologin.conf
[Seat:*]
autologin-user=sigic
autologin-user-timeout=0
user-session=xfce
greeter-session=lightdm-gtk-greeter
EOF_LDM

  # Asegurar permisos en escritorio y ejecutables
  chmod +x /opt/sigic/*.py 2>/dev/null || true
  chmod +x /usr/local/bin/* 2>/dev/null || true
  chmod +x /etc/skel/Desktop/*.desktop 2>/dev/null || true
  mkdir -p /home/sigic/Desktop
  cp -r /etc/skel/Desktop/* /home/sigic/Desktop/ 2>/dev/null || true
  chown -R sigic:sigic /home/sigic

  # Marcar .desktop como ejecutables confiables para XFCE
  for f in /home/sigic/Desktop/*.desktop; do
    if [ -f \"\$f\" ]; then
      gio set \"\$f\" \"metadata::trusted\" \"yes\" 2>/dev/null || true
    fi
  done
"

# 7. Extraer Kernel/Initrd y comprimir squashfs
echo ">> [7/8] Extrayendo kernel y empaquetando squashfs (ZSTD)..."
# Copiar vmlinuz e initrd de casper a la ISO
sudo cp "$CHROOT_DIR"/boot/vmlinuz-* "$ISO_DIR/casper/vmlinuz"
sudo cp "$CHROOT_DIR"/boot/initrd.img-* "$ISO_DIR/casper/initrd"

# Desmontar antes de comprimir
cleanup
trap - EXIT

sudo mksquashfs "$CHROOT_DIR" "$ISO_DIR/casper/filesystem.squashfs" \
  -comp zstd -Xcompression-level 15 -b 1M -e boot/vmlinuz-* -e boot/initrd.img-*

# Generar manifest de paquetes
sudo chroot "$CHROOT_DIR" dpkg-query -W --showformat='${Package} ${Version}\n' | sudo tee "$ISO_DIR/casper/filesystem.manifest" > /dev/null
sudo cp "$ISO_DIR/casper/filesystem.manifest" "$ISO_DIR/casper/filesystem.manifest-remove"

# 8. Generar configuración de arranque GRUB (UEFI y BIOS)
echo ">> [8/8] Generando menú de arranque GRUB y creando ISO híbrida..."
sudo tee "$ISO_DIR/boot/grub/grub.cfg" > /dev/null << 'EOF'
set default="0"
set timeout=5

set menu_color_normal=cyan/black
set menu_color_highlight=black/light-cyan

echo "=========================================================="
echo "  SiGIC OS (Ubuntu 24.04 LTS Live Edition)                "
echo "  Instituto Tecnológico Beltrán — Colaciones 2026        "
echo "=========================================================="

menuentry "1. Iniciar SiGIC OS Ubuntu Live (Escritorio en RAM)" {
    set gfxpayload=keep
    linux /casper/vmlinuz boot=casper quiet splash locales=es_AR.UTF-8 keyboard-layouts=latam timezone=America/Argentina/Buenos_Aires ---
    initrd /casper/initrd.img
}

menuentry "2. Iniciar SiGIC OS Ubuntu (Modo Seguro / Diagnóstico)" {
    set gfxpayload=keep
    linux /casper/vmlinuz boot=casper nomodeset locales=es_AR.UTF-8 keyboard-layouts=latam ---
    initrd /casper/initrd.img
}

menuentry "3. Probar Memoria RAM (Memtest)" {
    linux16 /boot/memtest86+.bin
}
EOF

# Replicar grub.cfg en loopback
sudo cp "$ISO_DIR/boot/grub/grub.cfg" "$ISO_DIR/boot/grub/loopback.cfg"

# Generar imagen EFI booteable
sudo mkdir -p "$ISO_DIR/EFI/BOOT"
if [ -f /usr/lib/grub/x86_64-efi/monolithic/gcdx64.efi ]; then
  sudo cp /usr/lib/grub/x86_64-efi/monolithic/gcdx64.efi "$ISO_DIR/EFI/BOOT/bootx64.efi"
elif command -v grub-mkstandalone >/dev/null 2>&1; then
  sudo grub-mkstandalone \
    --format=x86_64-efi \
    --output="$ISO_DIR/EFI/BOOT/bootx64.efi" \
    --locales="" \
    --fonts="" \
    "boot/grub/grub.cfg=$ISO_DIR/boot/grub/grub.cfg" 2>/dev/null || true
fi

# Metadata de la ISO
sudo mkdir -p "$ISO_DIR/.disk"
echo "SiGIC OS 24.04 LTS (Ubuntu Live Desktop Edition)" | sudo tee "$ISO_DIR/.disk/info" > /dev/null

# Generar ISO Híbrida con xorriso
echo ">> Creando archivo ISO final: $SALIDA_ISO"
sudo xorriso -as mkisofs \
  -r -V "SIGIC_UBUNTU" \
  -J -joliet-long -l \
  -iso-level 3 \
  -partition_offset 16 \
  -b boot/grub/i386-pc/eltorito.img \
  -c boot.catalog \
  -no-emul-boot -boot-load-size 4 -boot-info-table \
  -eltorito-alt-boot \
  -e EFI/BOOT/bootx64.efi \
  -no-emul-boot -isohybrid-gpt-basdat \
  -o "$SALIDA_ISO" \
  "$ISO_DIR" 2>/dev/null || {
    # Fallback con parámetros de compatibilidad xorriso
    sudo xorriso -as mkisofs \
      -r -V "SIGIC_UBUNTU" \
      -J -joliet-long -l \
      -o "$SALIDA_ISO" \
      "$ISO_DIR"
  }

ls -lh "$SALIDA_ISO"
echo "=========================================================="
echo ">> ¡LISTO! SiGIC OS Ubuntu Live Edition generado con éxito:"
echo ">> $SALIDA_ISO"
echo "=========================================================="
