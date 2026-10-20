import os
import subprocess

# Matar instancias previas
os.system('pkill -f chromium 2>/dev/null || true')

# Lanzar con xdg-open o chromium directo en DISPLAY :0
os.environ['DISPLAY'] = ':0'
subprocess.Popen([
    'chromium',
    '--no-sandbox',
    '--disable-gpu',
    '--password-store=basic',
    '--start-maximized',
    'http://localhost:3000/?admin_preview=1'
])