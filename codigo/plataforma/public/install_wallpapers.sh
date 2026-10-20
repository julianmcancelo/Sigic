#!/bin/bash
set -e

WALLPAPER_DIR="/usr/share/backgrounds/sigic"
sudo mkdir -p "$WALLPAPER_DIR"

FONDOS=("original" "beltran" "aurora" "carbon" "ceremonial" "cybergrid" "sunset" "emerald" "sapphire" "alabaster")

for f in "${FONDOS[@]}"; do
    echo "Descargando fondo $f.jpg..."
    sudo curl -s "http://10.0.2.2:3000/wallpapers/$f.jpg" -o "$WALLPAPER_DIR/$f.jpg"
done

# Copiar el predeterminado beltran a fondo.png y fondo.jpg
sudo cp "$WALLPAPER_DIR/beltran.jpg" "$WALLPAPER_DIR/fondo.jpg"
sudo cp "$WALLPAPER_DIR/beltran.jpg" "$WALLPAPER_DIR/fondo.png"

# Establecer beltran.jpg como fondo del escritorio XFCE activo
xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitor0/workspace0/last-image -s "$WALLPAPER_DIR/beltran.jpg" 2>/dev/null || true
xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVirtual1/workspace0/last-image -s "$WALLPAPER_DIR/beltran.jpg" 2>/dev/null || true
xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitordisplay/workspace0/last-image -s "$WALLPAPER_DIR/beltran.jpg" 2>/dev/null || true

# Aplicar a todos los monitores detectados por xfconf
for p in $(xfconf-query -c xfce4-desktop -l | grep 'last-image'); do
    xfconf-query -c xfce4-desktop -p "$p" -s "$WALLPAPER_DIR/beltran.jpg" 2>/dev/null || true
done

echo "FONDOS_INSTALADOS_OK"