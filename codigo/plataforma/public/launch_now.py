import os
import subprocess

# Matar terminales y lanzar chromium
os.environ['DISPLAY'] = ':0'
subprocess.Popen(['chromium', '--no-default-browser-check', '--no-first-run', '--password-store=basic', '--start-maximized', 'http://localhost:3000/?admin_token=bypass-admin-token'])