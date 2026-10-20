#!/bin/bash
set -e

echo "=== INICIANDO CONSTRUCCION DE NUEVA ISO SIGIC ==="

# 1. Instalar herramientas si faltan
sudo apt update
sudo apt install -y squashfs-tools xorriso isolinux syslinux-common curl

# 2. Directorio de trabajo
WORKDIR="/home/sigic/build_iso"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

# 3. Descargar el build mas reciente de Next.js compilado en el host
echo "Descargando bundle web actualizado de SiGIC..."
rm -rf sigic-web.tar.gz /tmp/sigic-web
curl -s http://10.0.2.2:3000/sigic-web-bundle.tar.gz -o sigic-web.tar.gz

echo "Bundle descargado con exito."