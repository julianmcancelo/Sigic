import os
import subprocess
import time

# Configurar el perfil de Chromium para que tenga la sesion de admin guardada
profile_dir = "/home/sigic/.config/chromium/Default"
os.system(f"mkdir -p '{profile_dir}'")

# Script para arrancar la aplicacion con node local y chromium
os.environ['DISPLAY'] = ':0'
subprocess.Popen([
    'chromium',
    '--no-default-browser-check',
    '--no-first-run',
    '--password-store=basic',
    '--start-maximized',
    'http://localhost:3000/?admin_preview=1'
])