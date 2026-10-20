import os
import json
import time

# Script JS a inyectar o cargar con Chromium para setear localStorage
js_code = '''
localStorage.setItem('sesion_admin', 'true');
localStorage.setItem('admin_user', JSON.stringify({
    id: 1,
    nombre: 'Julián Cancelo',
    correo: 'admin@sigic.com.ar',
    rol: 'SUPER_ADMIN'
}));
localStorage.setItem('version_admin', 'clasica');
localStorage.setItem('sigic_estilo_interfaz', 'dashboard');
localStorage.setItem('token_sesion', 'bypass-admin-token');
window.location.href = 'http://localhost:3000';
'''

# Matar chromium previo
os.system("killall chromium chromium-browser chrome 2>/dev/null || true")
time.sleep(1)

# Creamos una pagina HTML lanzadora que inyecte localStorage y redirija a localhost:3000
launcher_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
{js_code}
</script>
</body>
</html>'''

with open('/tmp/login.html', 'w') as f:
    f.write(launcher_html)

os.environ['DISPLAY'] = ':0'
os.system('nohup chromium --no-default-browser-check --no-first-run --password-store=basic --start-maximized "http://localhost:3000" >/dev/null 2>&1 &')