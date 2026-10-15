#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Generador de SiGIC OS — Escritorio Institucional XFCE + Dock Lateral
# Basado en Debian 12 con paquetes preinstalados (100% Offline / Boot directo)
# ==============================================================================

echo "=== Generador de SiGIC OS XFCE Desktop Edition ==="

# 1. Configurar directorios
WORK_DIR="/tmp/sigic-live-build"
sudo rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# 2. Descargar la imagen base oficial de Debian 12 Live XFCE
DEBIAN_LIVE_URL="https://cdimage.debian.org/debian-cd/current-live/amd64/iso-hybrid/debian-live-13.7.0-amd64-xfce.iso"
ISO_BASE="debian-live-xfce.iso"

if [ ! -f "$ISO_BASE" ]; then
  echo "Descargando Debian 12 Live XFCE oficial..."
  wget -q --show-progress "$DEBIAN_LIVE_URL" -O "$ISO_BASE" || {
    echo "Buscando último release de Debian Live XFCE..."
    FALLBACK_URL=$(curl -sL "https://cdimage.debian.org/debian-cd/current-live/amd64/iso-hybrid/" | grep -oP 'href="debian-live-12\.[0-9]+\.[0-9]+-amd64-xfce\.iso"' | head -n 1 | cut -d'"' -f2)
    wget -q --show-progress "https://cdimage.debian.org/debian-cd/current-live/amd64/iso-hybrid/${FALLBACK_URL}" -O "$ISO_BASE"
  }
fi

# 3. Extraer contenido de la ISO base
echo "Extrayendo imagen ISO con xorriso..."
rm -rf iso_root
mkdir -p iso_root
xorriso -osirrox on -indev "$ISO_BASE" -extract / iso_root
chmod -R u+w iso_root

# 4. Desempaquetar el sistema de archivos raíz (squashfs) para personalizar el escritorio
echo "Desempaquetando squashfs del sistema..."
rm -rf squashfs-root
sudo unsquashfs -d squashfs-root iso_root/live/filesystem.squashfs
sudo chown -R $USER:$USER squashfs-root
chmod -R u+w squashfs-root

# 5. Inyectar personalización del Escritorio XFCE con Dock Lateral y Branding SiGIC
echo "Personalizando el escritorio XFCE y Dock..."


# 5.1 Hostname y Banner de consola
echo "sigic-appliance" > squashfs-root/etc/hostname
cat << 'EOF' > squashfs-root/etc/motd
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

cat << 'EOF' > squashfs-root/etc/issue
SiGIC OS 2026 — Instituto Tecnológico Beltrán \n \l

EOF
cp squashfs-root/etc/issue squashfs-root/etc/issue.net

# 5.2 Fondo de pantalla Azul Beltrán oficial
mkdir -p squashfs-root/usr/share/backgrounds/sigic
if [ -f "$GITHUB_WORKSPACE/os-appliance/plymouth-theme/logo.png" ]; then
  cp "$GITHUB_WORKSPACE/os-appliance/plymouth-theme/logo.png" squashfs-root/usr/share/backgrounds/sigic/logo.png
fi

# Crear script de configuración visual para el usuario live
mkdir -p squashfs-root/etc/skel/.config/xfce4/xfconf/xfce-perchannel-xml
mkdir -p squashfs-root/etc/skel/Desktop

# 5.3 Crear lanzadores (.desktop) en el escritorio y dock con los 9 módulos de SiGIC
MODULOS=(
  "Panel de Control|panel-control|http://localhost:3000"
  "Gestión de Ceremonias|ceremonias|http://localhost:3000"
  "Gestión de Graduados|graduados|http://localhost:3000"
  "Gestión de Invitados|invitados|http://localhost:3000"
  "Diseño del Anfiteatro|anfiteatro|http://localhost:3000"
  "Control de Ingreso (Portería)|porteria|http://localhost:3000"
  "Gestión de Profesores|profesores|http://localhost:3000"
  "Panel de Reportes|reportes|http://localhost:3000"
  "Ajustes del Sistema|ajustes|http://localhost:3000"
)

mkdir -p squashfs-root/usr/share/applications/sigic
for mod in "${MODULOS[@]}"; do
  IFS="|" read -r titulo slug url <<< "$mod"
  cat << EOF > "squashfs-root/usr/share/applications/sigic-${slug}.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=SiGIC — ${titulo}
Comment=Módulo Oficial de SiGIC
Exec=x-www-browser "${url}"
Icon=applications-internet
Terminal=false
Categories=Network;WebBrowser;SiGIC;
EOF
  cp "squashfs-root/usr/share/applications/sigic-${slug}.desktop" squashfs-root/etc/skel/Desktop/
done

chmod +x squashfs-root/etc/skel/Desktop/*.desktop

# 5.4 Inyectar Splash HTML de bienvenida
mkdir -p squashfs-root/opt/sigic-splash
if [ -f "$GITHUB_WORKSPACE/os-appliance/splash.html" ]; then
  cp "$GITHUB_WORKSPACE/os-appliance/splash.html" squashfs-root/opt/sigic-splash/index.html
fi
if [ -f "$GITHUB_WORKSPACE/os-appliance/plymouth-theme/logo.png" ]; then
  cp "$GITHUB_WORKSPACE/os-appliance/plymouth-theme/logo.png" squashfs-root/opt/sigic-splash/logo.png
fi

# 5.5 Autoarranque del Splash en el navegador al iniciar sesión
mkdir -p squashfs-root/etc/skel/.config/autostart
cat << 'EOF' > squashfs-root/etc/skel/.config/autostart/sigic-splash.desktop
[Desktop Entry]
Type=Application
Exec=x-www-browser --app=file:///opt/sigic-splash/index.html
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=SiGIC Splash
Comment=Pantalla de Bienvenida Oficial de SiGIC
EOF

# 6. Reempaquetar el squashfs modificado
echo "Reempaquetando squashfs con compresión XZ..."
rm -f iso_root/live/filesystem.squashfs
mksquashfs squashfs-root iso_root/live/filesystem.squashfs -comp xz -b 1M

# Actualizar el hash md5 del squashfs
cd iso_root
md5sum live/filesystem.squashfs > live/filesystem.squashfs.md5 2>/dev/null || true
cd "$WORK_DIR"

# 7. Inyectar menú GRUB y Menú ISOLINUX personalizado con branding SiGIC y créditos del Beltrán
if [ -f "iso_root/boot/grub/grub.cfg" ]; then
  cat << 'EOF' > iso_root/boot/grub/grub.cfg
set default="0"
set timeout=3

set menu_color_normal=cyan/black
set menu_color_highlight=black/light-cyan

echo "  ========================================================================"
echo "    SIGIC OS (XFCE DESKTOP) — SISTEMA DE GESTION DE COLACIONES           "
echo "    Instituto Tecnologico Beltran — Practica Profesionalizante 2026       "
echo "  ========================================================================"
echo "    Alumnos:"
echo "    • Cancelo Julian"
echo "    • Alfonso Alan Alexis"
echo "    • Contreras Villalba Sol Heilin"
echo "    • Frassia Matias"
echo "    • Santillan Luis Gabriel"
echo "  ========================================================================"

menuentry "Iniciar SiGIC OS (Escritorio XFCE Oficial — Instituto Beltrán)" {
    linux /live/vmlinuz boot=live components quiet splash
    initrd /live/initrd.img
}

menuentry "Iniciar SiGIC OS (Modo Seguro / Diagnóstico)" {
    linux /live/vmlinuz boot=live components nomodeset
    initrd /live/initrd.img
}
EOF
fi

# Personalizar el menú gráfico ISOLINUX (la pantalla azul que se ve al arrancar en BIOS)
for isodir in iso_root/isolinux iso_root/syslinux; do
  if [ -d "$isodir" ]; then
    echo "Personalizando menú gráfico en $isodir..."
    # Reemplazar títulos y textos por español y marca institucional
    if [ -f "$isodir/menu.cfg" ]; then
      cat << 'EOF' > "$isodir/menu.cfg"
menu hshift 0
menu width 82

menu title SiGIC OS — Sistema de Gestión de Colaciones
include stdmenu.cfg

default live-es
label live-es
  menu label ^Iniciar SiGIC OS (Escritorio XFCE en RAM)
  menu default
  linux /live/vmlinuz
  initrd /live/initrd.img
  append boot=live components quiet splash

label live-failsafe
  menu label Iniciar en ^Modo Seguro (Diagnostico)
  linux /live/vmlinuz
  initrd /live/initrd.img
  append boot=live components nomodeset
EOF
    fi

    # Personalizar pie de página y colores
    if [ -f "$isodir/stdmenu.cfg" ]; then
      cat << 'EOF' > "$isodir/stdmenu.cfg"
menu background splash.png
menu color title    *#ffffffff *#00000000 *
menu color sel      *#ffffffff *#20406080 *
menu color hotsel   *#ffffffff *#306090a0 *
menu color tabmsg   *#ffffffff *#00000000 *
menu color cmdline  *#ffffffff *#00000000 *
menu color timeout_msg *#ffffffff *#00000000 *
menu color timeout  *#ffffffff *#00000000 *

menu tabmsg Presione ENTER para arrancar | Alumnos: Cancelo, Alfonso, Contreras, Frassia, Santillan
EOF
    fi
  fi
done


# 8. Generar la ISO Híbrida final
ISO_FINAL="$GITHUB_WORKSPACE/os-appliance/sigic-os-xfce-desktop-amd64.iso"
echo "Generando imagen ISO booteable híbrida en $ISO_FINAL..."

xorriso -as mkisofs \
  -r -V "SIGIC_OS_XFCE" \
  -J -joliet-long -l \
  -b isolinux/isolinux.bin \
  -c isolinux/boot.cat \
  -no-emul-boot -boot-load-size 4 -boot-info-table \
  -o "$ISO_FINAL" \
  iso_root

ls -lh "$ISO_FINAL"
echo "¡Generación finalizada con éxito!"

