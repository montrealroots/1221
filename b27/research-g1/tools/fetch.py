#!/usr/bin/env python3
"""Fetch one URL into its own new folder OUT/dl/NAME/, keep the bytes, the headers and a text rendering, and log the result.
Usage: python3 -I fetch.py NAME URL [ID]"""
import sys, subprocess, hashlib, json, os, re, datetime
OUT = '/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/research-g1'
name, url = sys.argv[1], sys.argv[2]
sid = sys.argv[3] if len(sys.argv) > 3 else ''
d = f"{OUT}/dl/{name}"
os.makedirs(d, exist_ok=False)
raw = f"{d}/body.bin"; hdr = f"{d}/headers.txt"
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
t0 = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
r = subprocess.run(['curl', '-sS', '-L', '--http1.1', '-m', '180', '--cacert', '/root/.ccr/ca-bundle.crt', '-A', UA,
                    '-H', 'Accept-Language: en-US,en;q=0.9', '-H', 'Accept: text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
                    '-D', hdr, '-o', raw, '-w', '%{http_code} %{url_effective} %{content_type}', url], capture_output=True, text=True)
parts = (r.stdout or '').split(' ', 2)
code, final, ctype = (parts + ['', '', ''])[:3]
body = open(raw, 'rb').read() if os.path.exists(raw) else b''
kind = 'none'
if body[:4] == b'%PDF':
    os.rename(raw, f"{d}/document.pdf"); kind = 'pdf'
    subprocess.run(['pdftotext', '-layout', f"{d}/document.pdf", f"{d}/document.txt"], capture_output=True)
elif body:
    os.rename(raw, f"{d}/page.html"); kind = 'html'
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(body.decode('utf-8', errors='replace'), 'html.parser')
    for t in soup(['script', 'style', 'noscript', 'svg']): t.decompose()
    text = re.sub(r'\n\s*\n+', '\n\n', soup.get_text('\n'))
    open(f"{d}/page.txt", 'w', encoding='utf-8').write(text)
rec = {'name': name, 'id': sid, 'url': url, 'final': final, 'http': code, 'contentType': ctype, 'kind': kind, 'bytes': len(body),
       'sha256': hashlib.sha256(body).hexdigest(), 'retrieved': t0, 'error': (r.stderr or '').strip()[:300]}
json.dump(rec, open(f"{d}/fetch.json", 'w'), indent=1)
open(f"{OUT}/fetch-log.jsonl", 'a').write(json.dumps(rec) + '\n')
print(json.dumps(rec))
