import os
import subprocess

try:
    find = subprocess.check_output(['find', '/home', '/opt', '/usr', '-name', '*asistente*', '2>/dev/null'], shell=True).decode('utf-8')
    with open('/home/sigic/diag_out.txt', 'w') as f:
        f.write(find)
        f.write("\n--- PS AUX ---\n")
        f.write(subprocess.check_output(['ps', 'aux']).decode('utf-8'))
except Exception as e:
    with open('/home/sigic/diag_out.txt', 'w') as f:
        f.write(str(e))