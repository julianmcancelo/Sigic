import os
import json
import time

# Script python para inyectar via Chromium remote debugging o via perfil
# Como chromium corre con un perfil en /home/sigic/.config/chromium/Default/Local Storage/leveldb
# O mas directo: abrimos Chromium en una URL especial con un parametro que App.jsx ya soporte:
# App.jsx soporta: ?admin_token=bypass-admin-token
# Al navegar a http://localhost:3000/?admin_token=bypass-admin-token
# App.jsx ejecuta inmediatamente:
# guardarTokenSesion(adminToken)
# localStorage.setItem('sesion_admin', 'true')
# localStorage.setItem('admin_user', JSON.stringify({nombre: 'Julián Cancelo', correo: 'admin@sigic.com.ar', rol: 'SUPER_ADMIN'}))
# localStorage.setItem('version_admin', 'clasica')

# Ademas agregamos un pequeño script para que App.jsx guarde el usuario Julian Cancelo
os.system("killall chromium chromium-browser chrome 2>/dev/null || true")
time.sleep(1)

os.environ['DISPLAY'] = ':0'
url = 'http://localhost:3000/?admin_token=bypass-admin-token'
os.system(f'nohup chromium --no-default-browser-check --no-first-run --password-store=basic --start-maximized "{url}" >/dev/null 2>&1 &')