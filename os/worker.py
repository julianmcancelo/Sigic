import os

script_sh = '''#!/bin/bash
sudo systemctl start postgresql
sudo sigic-db-init
sudo systemctl restart sigic-server
sleep 2
chromium --no-default-browser-check --no-first-run --password-store=basic --start-maximized --app=http://localhost:3000 &
'''

with open('/home/sigic/Desktop/INICIAR-SIGIC.sh', 'w') as f:
    f.write(script_sh)
os.chmod('/home/sigic/Desktop/INICIAR-SIGIC.sh', 0o755)

desktop_file = '''[Desktop Entry]
Version=1.0
Type=Application
Name=INICIAR SIGIC
Comment=Levantar base de datos y abrir SiGIC
Exec=/home/sigic/Desktop/INICIAR-SIGIC.sh
Icon=/usr/share/pixmaps/sigic.png
Terminal=false
StartupNotify=true
'''

with open('/home/sigic/Desktop/INICIAR-SIGIC.desktop', 'w') as f:
    f.write(desktop_file)
os.chmod('/home/sigic/Desktop/INICIAR-SIGIC.desktop', 0o755)
os.system('gio set /home/sigic/Desktop/INICIAR-SIGIC.desktop metadata::trusted true 2>/dev/null')
os.system('/home/sigic/Desktop/INICIAR-SIGIC.sh &')
