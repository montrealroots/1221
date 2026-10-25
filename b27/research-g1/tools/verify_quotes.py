#!/usr/bin/env python3
"""Check every quote in OUT/facts.json against its download: the text rendering kept beside it and a second rendering
(pdftotext without -layout for PDFs; the HTML's text joined without separators for pages), whitespace collapsed and
zero-width spaces removed. Usage: python3 -I verify_quotes.py"""
import json, os, re, subprocess, sys
OUT = '/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/research-g1'

def norm(s):
    s = s.replace('​', '').replace(' ', ' ').replace(' ', ' ').replace(' ', ' ')
    return re.sub(r'\s+', ' ', s).strip()

cache = {}
def renderings(src):
    key = src['download']
    if key in cache: return cache[key]
    path = os.path.join(OUT, src['download']); txt = os.path.join(OUT, src['text'])
    r = []
    if os.path.exists(txt): r.append(norm(open(txt, encoding='utf-8', errors='replace').read()))
    if path.endswith('.pdf') and os.path.exists(path):
        p = subprocess.run(['pdftotext', path, '-'], capture_output=True, text=True)
        r.append(norm(p.stdout))
    elif os.path.exists(path):
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(open(path, 'rb').read().decode('utf-8', errors='replace'), 'html.parser')
        for t in soup(['script', 'style', 'noscript', 'svg']): t.decompose()
        r.append(norm(soup.get_text('')))
    cache[key] = r
    return r

data = json.load(open(os.path.join(OUT, 'facts.json')))
bad = 0; n = 0
for s in data['sources']:
    for f in s['facts']:
        n += 1
        q = norm(f['quote'])
        if not any(q in t for t in renderings(s)):
            bad += 1
            print(f"MISSING {s['id']} {f['field']}: {f['quote'][:110]}")
print(f'{n} quotes checked, {bad} not found')
sys.exit(1 if bad else 0)
