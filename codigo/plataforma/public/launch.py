import os
desktop_file = '''[Desktop Entry]
Version=1.0
Type=Application
Name=SiGIC Plataforma
Comment=Abrir plataforma institucional SiGIC
Exec=chromium --no-default-browser-check --no-first-run --password-store=basic --start-maximized --app=http://10.0.2.2:3000
Icon=/usr/share/pixmaps/sigic.png
Terminal=false
StartupNotify=true
'''
with open('/home/sigic/Desktop/SiGIC-Plataforma.desktop', 'w') as f:
    f.write(desktop_file)
os.chmod('/home/sigic/Desktop/SiGIC-Plataforma.desktop', 0o755)
os.system('gio set /home/sigic/Desktop/SiGIC-Plataforma.desktop metadata::trusted true 2>/dev/null')
os.system('chromium --no-default-browser-check --no-first-run --password-store=basic --start-maximized --app=http://10.0.2.2:3000 &')
print('LAUNCH_SUCCESS')
