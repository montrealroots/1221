"""
Every phrase PLAYTEST.md quotes, and every label it bolds, found in what the built app printed (brief 15, section 12: a
short manual review route; brief 14's check, on brief 15's records). A walkthrough that names a control the game doesn't have
sends its reader looking for nothing, so each is looked for, in order:
- **on the built app:** the final walk's screens at both widths (`final-walk/1440`, `final-walk/390`), the frame
  area's walks of creation (`frame/`), the phone screens of the coordinator's check (`coordinator-phone/`), and the
  journeys' traces on the tested commit (`interface-final/`, `journeys14-final/`);
- **in the code only:** a string in `src/` outside the guide, for a screen no walk reached;
- **nowhere:** neither. It exits 1 on one.

    python3 docs/verification/editorial-2026-10-19/playtest-check.py
"""
import glob, json, os, re, sys
B = 'docs/verification/editorial-2026-10-19'
text = open(f'{B}/PLAYTEST.md', encoding='utf-8').read()
quotes = re.findall(r'“([^”]+)”', text)
labels = [l for l in re.findall(r'\*\*([^*]+)\*\*', text) if not l.endswith(':') and not l.startswith('Report') and not l.startswith('Expect')
          and not l.startswith('Listen for') and l not in ('As you go, note any sentence that:', 'What the automated runs are, and what they aren\'t.', 'in the code only:', 'nowhere:', 'on the built app:')]
labels = [re.sub(r'\s*→\s*', '\n', l).split('\n') for l in labels]
labels = sorted({p.strip().rstrip('.') for parts in labels for p in parts if p.strip()})
labels = [l.replace('N Left', '') .replace('(', '').replace(')', '').strip() for l in labels]

def words(x):
    if isinstance(x, str): return [x]
    if isinstance(x, list): return [w for v in x for w in words(v)]
    if isinstance(x, dict): return [w for v in x.values() for w in words(v)]
    return []
app = []
for f in glob.glob(f'{B}/final-walk/*/*.json') + glob.glob(f'{B}/frame/**/*.json', recursive=True) + glob.glob(f'{B}/coordinator-phone/*.json') \
        + glob.glob(f'{B}/interface-final/**/*.json', recursive=True) + glob.glob(f'{B}/journeys14-final/**/*.json', recursive=True):
    try: app += words(json.load(open(f, encoding='utf-8')))
    except (json.JSONDecodeError, UnicodeDecodeError): pass
APP = '\n'.join(' '.join(w.split()) for w in app)
code = []
for f in glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True):
    if '/content/guide/' in f or f.endswith('content/tutorial.ts'): continue
    code.append(open(f, encoding='utf-8').read())
CODE = '\n'.join(code).replace("\\'", "'")

out, nowhere = [], []
for kind, items in (('quote', quotes), ('label', labels)):
    for q in items:
        q1 = ' '.join(q.split())
        where = 'on the built app' if q1 in APP else 'in the code only' if q1 in CODE else 'nowhere'
        out.append((kind, q1, where))
        if where == 'nowhere': nowhere.append(q1)
for k, q, w in out: print(f'{w:18} {k:6} {q}')
print(f'{len(out)} quoted phrases and labels: {sum(1 for x in out if x[2] == "on the built app")} on the built app, '
      f'{sum(1 for x in out if x[2] == "in the code only")} in the code only, {len(nowhere)} nowhere.')
json.dump([{'kind': k, 'text': q, 'found': w} for k, q, w in out], open(f'{B}/playtest-check.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
sys.exit(1 if nowhere else 0)
