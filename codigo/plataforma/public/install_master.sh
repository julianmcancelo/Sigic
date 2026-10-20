#!/bin/bash
set -e

# Descargar e instalar en /usr/local/bin/iniciar-sigic
sudo curl -s http://10.0.2.2:3000/iniciar_todo.sh -o /usr/local/bin/iniciar-sigic
sudo chmod +x /usr/local/bin/iniciar-sigic

# Descargar e instalar el acceso directo en el escritorio
curl -s http://10.0.2.2:3000/iniciar_todo.desktop -o /home/sigic/Desktop/INICIAR-SIGIC.desktop
chmod +x /home/sigic/Desktop/INICIAR-SIGIC.desktop
gio set /home/sigic/Desktop/INICIAR-SIGIC.desktop metadata::trusted true 2>/dev/null || true

# Limpiar accesos viejos o redundantes del escritorio
rm -f /home/sigic/Desktop/iniciar_sigic.sh /home/sigic/Desktop/iniciar_sigic.desktop /home/sigic/Desktop/Activar-Servicios.desktop 2>/dev/null || true

# Configurar autostart
mkdir -p /home/sigic/.config/autostart
cp /home/sigic/Desktop/INICIAR-SIGIC.desktop /home/sigic/.config/autostart/

sudo chown -R sigic:sigic /home/sigic/

echo "EJECUTABLE_MAESTRO_INSTALADO_OK"