import urllib.request

try:
    with urllib.request.urlopen('http://localhost:3000/?admin_preview=1') as response:
        html = response.read().decode('utf-8')
        with open('/tmp/curl_res.txt', 'w') as f:
            f.write(f'STATUS: {response.status}\n')
            f.write(f'LEN: {len(html)}\n')
            f.write(html[:500])
except Exception as e:
    with open('/tmp/curl_res.txt', 'w') as f:
        f.write(f'ERROR: {e}\n')