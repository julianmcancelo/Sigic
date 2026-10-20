import os
import subprocess

browsers = ['firefox', 'firefox-esr', 'chromium', 'google-chrome', 'epiphany-browser']
found = {}
for b in browsers:
    p = subprocess.run(['which', b], capture_output=True, text=True)
    found[b] = p.stdout.strip()

with open('/tmp/browsers.txt', 'w') as f:
    for k, v in found.items():
        f.write(f'{k}: {v}\n')