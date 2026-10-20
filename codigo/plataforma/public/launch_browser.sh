#!/bin/bash
pkill -f chromium 2>/dev/null || true
sleep 1
export DISPLAY=:0
chromium --no-sandbox --disable-gpu --password-store=basic --start-maximized "http://localhost:3000/?admin_preview=1" > /tmp/chrom.log 2>&1 &