import os
import time

# 1. Matar procesos viejos de asistente o navegadores
os.system("pkill -f asistente 2>/dev/null || true")
os.system("killall -9 chromium chromium-browser chrome 2>/dev/null || true")
time.sleep(1)

# 2. Asegurar que los servicios locales de SiGIC esten activos y funcionando
os.system("sudo systemctl start postgresql 2>/dev/null || true")
os.system("sudo sigic-db-init 2>/dev/null || true")
os.system("sudo systemctl restart sigic-server 2>/dev/null || true")
time.sleep(2)

# 3. Lanzar Chromium apuntando al servidor web
# Probamos primero con http://localhost:3000
os.environ["DISPLAY"] = ":0"
os.system("nohup chromium --no-default-browser-check --no-first-run --password-store=basic --start-maximized http://localhost:3000 >/dev/null 2>&1 &")