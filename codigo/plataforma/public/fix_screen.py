import os
import subprocess

# Matar procesos de asistentes viejos o pantallas duplicadas
os.system("pkill -f asistente || true")

# Cerrar chromium
os.system("killall chromium chromium-browser chrome 2>/dev/null || true")

# Esperar 1 segundo
import time
time.sleep(1)

# Iniciar Chromium apuntando al servidor de la VM y host
# Con configuracion para que ocupe toda la pantalla y no pregunte nada
cmd = "nohup chromium --no-default-browser-check --no-first-run --password-store=basic --start-maximized --start-fullscreen http://localhost:3000 >/dev/null 2>&1 &"
os.system(cmd)