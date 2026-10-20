import os
import subprocess
import time

# Cerrar las terminales xfce4-terminal
os.system("killall xfce4-terminal 2>/dev/null || true")

# Traer chromium al frente y maximizar
os.system("wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz 2>/dev/null || true")
os.system("wmctrl -a Chromium 2>/dev/null || true")
os.system("wmctrl -r Chromium -b add,maximized_vert,maximized_horz 2>/dev/null || true")