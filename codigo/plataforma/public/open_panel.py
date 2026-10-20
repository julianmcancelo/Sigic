import os
import subprocess

html_content = '''<!DOCTYPE html>
<html>
<body>
<script>
localStorage.setItem('sesion_admin', 'true');
localStorage.setItem('sigic_estilo_interfaz', 'dashboard');
localStorage.setItem('version_admin', 'clasica');
localStorage.setItem('admin_user', JSON.stringify({
    id: 1,
    nombre: 'Julián Cancelo',
    correo: 'admin@sigic.com.ar',
    rol: 'SUPER_ADMIN'
}));
localStorage.setItem('token_sesion', 'bypass-admin-token');
window.location.href = 'http://localhost:3000';
</script>
</body>
</html>'''

with open('/tmp/redir.html', 'w') as f:
    f.write(html_content)

os.environ['DISPLAY'] = ':0'
subprocess.Popen([
    'chromium',
    '--no-sandbox',
    '--disable-gpu',
    '--no-default-browser-check',
    '--no-first-run',
    '--password-store=basic',
    '--start-maximized',
    'file:///tmp/redir.html'
])