desktop_file = '''[Desktop Entry]
Version=1.0
Type=Application
Name=Iniciar Servicios SiGIC
Comment=Inicia la base de datos y la plataforma SiGIC
Exec=sh -c "sudo systemctl start postgresql && sudo sigic-db-init && sudo systemctl restart sigic-server && zenity --info --title=\\"SiGIC Beltran\\" --text=\\"Servicios iniciados con exito.\\" --timeout=3"
Icon=/usr/share/pixmaps/sigic.png
Terminal=false
StartupNotify=true
'''
with open('/home/sigic/Desktop/Iniciar-Servicios.desktop', 'w') as f:
    f.write(desktop_file)

import os
os.chmod('/home/sigic/Desktop/Iniciar-Servicios.desktop', 0o755)
os.system('gio set /home/sigic/Desktop/Iniciar-Servicios.desktop metadata::trusted true 2>/dev/null')
os.system('python3 /opt/sigic/asistente-os.py &')
print("SETUP_COMPLETED")
