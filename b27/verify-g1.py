# My own check of the research agent's quotes: text extracted again from each download (pdftotext, and a tag strip for
# HTML), whitespace collapsed, quotes and the extraction normalized for quotes/dashes, each quote searched.
import json, os, re, subprocess, sys, html, unicodedata
O = sys.argv[1]; OUT = sys.argv[2]
d = json.load(open(os.path.join(O, 'facts.json')))
def norm(t):
    t = unicodedata.normalize('NFKC', t)
    t = t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace('–', '-').replace('—', '-').replace(' ', ' ').replace('­', '')
    t = re.sub(r'-\s+', '-', t)
    return re.sub(r'\s+', ' ', t).strip().lower()
cache = {}
def text_of(path):
    if path in cache: return cache[path]
    full = os.path.join(O, path)
    out = ''
    if full.endswith('.pdf'):
        for layout in ([], ['-layout']):
            r = subprocess.run(['pdftotext', *layout, full, '-'], capture_output=True, text=True)
            out += ' \n ' + r.stdout
    else:
        raw = open(full, encoding='utf-8', errors='replace').read()
        raw = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', raw)
        out = html.unescape(re.sub(r'<[^>]+>', ' ', raw))
    cache[path] = norm(out)
    return cache[path]
res = {'found': 0, 'missing': []}
for s in d['sources']:
    dl = s.get('download')
    if not dl or not os.path.exists(os.path.join(O, dl)):
        res['missing'].append({'id': s['id'], 'why': 'no download', 'download': dl}); continue
    t = text_of(dl)
    for f in s['facts']:
        q = norm(f['quote'])
        # an ellipsis in a quote joins two verbatim pieces
        parts = [p.strip() for p in re.split(r'\.\.\.|…|\[\.\.\.\]', q) if p.strip()]
        if all(p in t for p in parts): res['found'] += 1
        else: res['missing'].append({'id': s['id'], 'field': f['field'], 'quote': f['quote'][:160], 'where': f.get('where')})
json.dump(res, open(OUT, 'w'), indent=1)
print('found', res['found'], 'missing', len(res['missing']))
