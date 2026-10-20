import os

sh_path = "/home/sigic/Desktop/iniciar_sigic.sh"
desktop_path = "/home/sigic/Desktop/iniciar_sigic.desktop"

os.system("curl -s http://10.0.2.2:3000/iniciar_sigic.sh -o " + sh_path)
os.system("curl -s http://10.0.2.2:3000/iniciar_sigic.desktop -o " + desktop_path)

os.system("chmod +x " + sh_path)
os.system("chmod +x " + desktop_path)
os.system("gio set " + desktop_path + " metadata::trusted true 2>/dev/null || true")
os.system("chown sigic:sigic " + sh_path + " " + desktop_path)