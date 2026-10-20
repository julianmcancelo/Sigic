import os
import subprocess

# Inyectar cambio de estilo interfaz en la sesión de Chromium usando una URL directa o modificando localStorage
# En App.jsx, cuando estiloInterfaz === 'dashboard' (el default es escritorio en algunos perfiles),
# se renderiza PantallaBienvenida / PantallaBienvenidaPro
# Vamos a setear via javascript en una pestana o con un script HTML lanzador:

html = '''<!DOCTYPE html>
<html>
<body>
<script>
localStorage.setItem('sesion_admin', 'true');
localStorage.setItem('sigic_estilo_interfaz', 'dashboard');
localStorage.setItem('admin_user', JSON.stringify({
    id: 1,
    nombre: 'Julián Cancelo',
    correo: 'admin@sigic.com.ar',
    rol: 'SUPER_ADMIN'
}));
localStorage.setItem('version_admin', 'clasica');
localStorage.setItem('token_sesion', 'bypass-admin-token');
window.location.href = 'http://localhost:3000';
</script>
</body>
</html>'''

with open('/tmp/dashboard.html', 'w') as f:
    f.write(html)

os.environ['DISPLAY'] = ':0'
subprocess.Popen([
    'chromium',
    '--no-sandbox',
    '--disable-gpu',
    '--no-default-browser-check',
    '--no-first-run',
    '--password-store=basic',
    '--start-maximized',
    'file:///tmp/dashboard.html'
])