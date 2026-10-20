#!/bin/bash
set -e

# ==============================================================================
# SiGIC - SCRIPT DE ACTUALIZACION DINAMICA EN CALIENTE
# Permite actualizar la plataforma, base de datos y assets en vivo o desde USB / Red
# sin necesidad de reconstruir la ISO completa.
# ==============================================================================

COLOR_AZUL="\033[1;34m"
COLOR_VERDE="\033[1;32m"
COLOR_AMARILLO="\033[1;33m"
COLOR_ROJO="\033[1;31m"
COLOR_RESET="\033[0m"

echo -e "${COLOR_AZUL}======================================================${COLOR_RESET}"
echo -e "${COLOR_VERDE}   SiGIC - Asistente de Actualización Dinámica       ${COLOR_RESET}"
echo -e "${COLOR_AZUL}   Instituto Tecnológico Beltrán - Avellaneda        ${COLOR_RESET}"
echo -e "${COLOR_AZUL}======================================================${COLOR_RESET}"

DESTINO="/opt/sigic-web"
ORIGEN_BUNDLE=""

# 1. Verificar si hay pendrive USB o carpeta compartida montada
if [ -f "/media/sigic/SIGIC_UPDATE/sigic-web-bundle.tar.gz" ]; then
    ORIGEN_BUNDLE="/media/sigic/SIGIC_UPDATE/sigic-web-bundle.tar.gz"
    echo -e "${COLOR_VERDE}[+] Detectado paquete de actualización en pendrive USB.${COLOR_RESET}"
elif [ -f "/mnt/sigic-web-bundle.tar.gz" ]; then
    ORIGEN_BUNDLE="/mnt/sigic-web-bundle.tar.gz"
    echo -e "${COLOR_VERDE}[+] Detectado paquete de actualización en carpeta compartida /mnt.${COLOR_RESET}"
elif [ -f "/tmp/sigic-web-bundle.tar.gz" ]; then
    ORIGEN_BUNDLE="/tmp/sigic-web-bundle.tar.gz"
    echo -e "${COLOR_VERDE}[+] Detectado paquete en /tmp.${COLOR_RESET}"
elif [ -n "$1" ] && [ -f "$1" ]; then
    ORIGEN_BUNDLE="$1"
    echo -e "${COLOR_VERDE}[+] Usando paquete provisto: $ORIGEN_BUNDLE${COLOR_RESET}"
fi

# 2. Si no se encontró bundle local, intentar sincronizar por Red / HTTP si hay conectividad
if [ -z "$ORIGEN_BUNDLE" ]; then
    echo -e "${COLOR_AMARILLO}[*] Buscando actualizaciones remotas vía red...${COLOR_RESET}"
    if ping -c 1 -W 2 google.com >/dev/null 2>&1; then
        echo -e "${COLOR_VERDE}[+] Conexión a Internet detectada.${COLOR_RESET}"
        # URL remota configurable (GitHub Releases o repo institucional)
        URL_REMOTA="https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/sigic-web-bundle.tar.gz"
        echo -e "[*] Descargando última versión oficial..."
        if curl -L --progress-bar "$URL_REMOTA" -o /tmp/sigic-web-bundle.tar.gz; then
            ORIGEN_BUNDLE="/tmp/sigic-web-bundle.tar.gz"
            echo -e "${COLOR_VERDE}[+] Descarga completada con éxito.${COLOR_RESET}"
        fi
    fi
fi

if [ -z "$ORIGEN_BUNDLE" ] || [ ! -f "$ORIGEN_BUNDLE" ]; then
    echo -e "${COLOR_ROJO}[!] No se encontró ningún archivo de actualización 'sigic-web-bundle.tar.gz'.${COLOR_RESET}"
    echo -e "    Podés colocarlo en un pendrive con la etiqueta SIGIC_UPDATE o copiarlo a /tmp/."
    exit 1
fi

echo -e "\n${COLOR_AZUL}[1/4] Deteniendo servidor web SiGIC para actualización segura...${COLOR_RESET}"
sudo systemctl stop sigic-server || true

echo -e "${COLOR_AZUL}[2/4] Aplicando nueva versión en $DESTINO...${COLOR_RESET}"
sudo mkdir -p "$DESTINO"
sudo tar -xzf "$ORIGEN_BUNDLE" -C "$DESTINO"

echo -e "${COLOR_AZUL}[3/4] Verificando esquema de Base de Datos PostgreSQL...${COLOR_RESET}"
sudo sigic-db-init 2>/dev/null || true

echo -e "${COLOR_AZUL}[4/4] Reiniciando servicio web SiGIC...${COLOR_RESET}"
sudo systemctl start sigic-server

# Esperar respuesta
until curl -s -f http://localhost:3000 >/dev/null 2>&1; do
    sleep 1
done

if which notify-send >/dev/null 2>&1; then
    notify-send "SiGIC Actualizado" "La plataforma se ha actualizado con éxito a la última versión." -i /usr/share/pixmaps/sigic.png 2>/dev/null || true
fi

echo -e "\n${COLOR_VERDE}======================================================${COLOR_RESET}"
echo -e "${COLOR_VERDE} ✔ ¡ACTUALIZACIÓN COMPLETADA CON ÉXITO!              ${COLOR_RESET}"
echo -e "${COLOR_VERDE} La plataforma SiGIC ya está corriendo al día.       ${COLOR_RESET}"
echo -e "${COLOR_VERDE}======================================================${COLOR_RESET}"
