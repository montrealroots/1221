# G1's research (2026-10-25) into brief 27's register: every attempt kept, a page's bytes hashed again here and compared
# with what the fetch recorded, each fact with the page's words. A page the register had read is updated to the bytes G1
# read (the facts are from those bytes); a page it hadn't is added.
import json, os, hashlib, sys
O, REG = sys.argv[1], sys.argv[2]
g = json.load(open(os.path.join(O, 'facts.json')))
reg = json.load(open(REG))
by = {s['id']: s for s in reg['sources']}
UNREADABLE = {'b27-G1-09': 'an index page with no text', 'b27-G1-13': 'a script shell with no text', 'b27-G1-14': 'a script shell with no text'}
problems = []
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def minute(t): return t[:16] + 'Z' if t and len(t) >= 16 else t
for s in g['sources']:
    dl = os.path.join(O, s['download']) if s.get('download') else None
    digest = sha(dl) if dl and os.path.exists(dl) else None
    rec = s.get('sha256') or (json.load(open(os.path.join(os.path.dirname(dl), 'fetch.json'))).get('sha256') if dl else None)
    if digest and rec and digest != rec: problems.append(f"{s['id']}: bytes {digest[:12]} vs recorded {rec[:12]}")
    attempts = [{'at': minute(a['at']), 'http': a['http'], 'bytes': a.get('bytes', 0), 'error': a.get('error', '')} for a in s.get('attempts', [])] \
        or [{'at': minute(s['retrieved']), 'http': s['http'], 'bytes': s['bytes'], 'error': ''}]
    facts = [{'fact': f"{f['value'].rstrip('.')} ({f['where']}).", 'quote': f['quote']} for f in s['facts']]
    status = 'unreadable' if s['id'] in UNREADABLE else 'read'
    e = by.get(s['id'])
    if e is None:
        e = {'id': s['id'], 'register': 'b27', 'was': None, 'previously': None, 'title': s['title'], 'organization': None,
             'territory': None, 'updated': None, 'establishes': [], 'confidence': None, 'usedBy': [], 'url': s['url'],
             'final': s['url'], 'status': status, 'http': s['http'], 'bytes': s['bytes'], 'sha256': digest,
             'retrieved': minute(s['retrieved']), 'attempts': []}
        if s['id'].startswith('b25-N'): e['was'], e['previously'] = s['id'][4:], 'read by brief 25; read again by G1'
        if s['id'] == 'work-S36': e['was'], e['previously'] = 'S36 (docs/research/career-2026-10-20/work.md)', 'cited by brief 21; read again by G1'
        reg['sources'].append(e); by[e['id']] = e
    seen = {(a['at'], a['http']) for a in e['attempts']}
    e['attempts'] += [a for a in attempts if (a['at'], a['http']) not in seen]
    e['status'], e['http'], e['bytes'], e['sha256'], e['retrieved'] = status, s['http'], s['bytes'], digest, minute(s['retrieved'])
    if not e.get('title'): e['title'] = s['title']
    have = {(f['fact'], f['quote']) for f in e['establishes']}
    e['establishes'] += [f for f in facts if (f['fact'], f['quote']) not in have] if status == 'read' else []
    if status != 'read': e['establishes'] = []
reg['written'] = reg.get('written')
open(REG, 'w').write(json.dumps(reg, indent=1, ensure_ascii=False) + '\n')
print('problems:', problems or 'none'); print('entries', len(reg['sources']), 'facts', sum(len(x['establishes']) for x in reg['sources']))
