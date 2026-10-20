import os
import subprocess

# Flags para VM sin GPU acelerada
flags = [
    'chromium',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--no-default-browser-check',
    '--no-first-run',
    '--password-store=basic',
    '--start-maximized',
    'http://localhost:3000/?admin_token=bypass-admin-token'
]

os.environ['DISPLAY'] = ':0'
subprocess.Popen(flags)