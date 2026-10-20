"""
Every phrase PLAYTEST.md quotes, and every label it bolds, found where the game says it (brief 17, section 12: "A short
playable route for the owner to verify the result"). Brief 14's `playtest-check.py` on brief 17's folders. A route that
names a control the game doesn't have sends its reader looking for nothing, so each is looked for, in order:
- **on the built app:** the final text walk's screens at both widths (`final-walk/walk-*`), the details check's results
  (`final-walk/details/details-*.json`), the journeys' traces on the tested commit (`interface-final/`, `journeys14-final/`)
  and the tutorial area's walk of the guide (`tutorial/after/`);
- **in what the students were told:** the runs of `tools/voices.ts` on the tested commit (`after/`);
- **in the code only:** a string in `src/` outside the guide, for a screen no walk reached;
- **nowhere:** none of these. It exits 1 on one.

The phrases it quotes as the game no longer says them ("the note is taken at", and the like) are in double straight
quotes, and are looked for too: each must be found nowhere in what the students were told or on the built app.

    python3 docs/verification/continuity-2026-10-20/playtest-check.py
"""
import glob, json, re, sys
B = 'docs/verification/continuity-2026-10-20'
text = open(f'{B}/PLAYTEST.md', encoding='utf-8').read()
body = text.split('## 1.', 1)[1]
quotes = re.findall(r'“([^”]+)”', body)
gone = re.findall(r'"([^"]+)"', body)
SKIP = ('Expect', 'Report', 'As you go', 'What the automated', 'The runs', 'The built app', 'The phrases here', 'What none')
labels = [l for l in re.findall(r'\*\*([^*]+)\*\*', body) if not l.startswith(SKIP) and not l.endswith(':')]
labels = sorted({p.strip().rstrip('.') for l in labels for p in re.split(r'\s*→\s*', l) if p.strip()})

def words(x):
    if isinstance(x, str): return [x]
    if isinstance(x, list): return [w for v in x for w in words(v)]
    if isinstance(x, dict): return [w for v in x.values() for w in words(v)]
    return []
def read(paths):
    out = []
    for f in paths:
        try:
            out += words(json.load(open(f, encoding='utf-8'))) if f.endswith('.json') else [open(f, encoding='utf-8').read()]
        except (json.JSONDecodeError, UnicodeDecodeError, IsADirectoryError): pass
    return '\n'.join(' '.join(w.split()) for w in out)
APP = read(glob.glob(f'{B}/final-walk/walk-*/*.json') + glob.glob(f'{B}/final-walk/details/details-*.json')
           + glob.glob(f'{B}/interface-final/**/*.json', recursive=True) + glob.glob(f'{B}/journeys14-final/**/*.json', recursive=True)
           + glob.glob(f'{B}/tutorial/after/**/*.txt', recursive=True))
TOLD = read(glob.glob(f'{B}/after/*.json'))
code = []
for f in glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True):
    if '/content/guide/' in f or f.endswith('content/tutorial.ts'): continue
    code.append(open(f, encoding='utf-8').read())
CODE = '\n'.join(code).replace("\\'", "'").replace('&amp;', '&')

out, bad = [], []
for kind, items in (('quote', quotes), ('label', labels)):
    for q in items:
        q1 = ' '.join(q.split())
        where = 'on the built app' if q1 in APP else 'told a student' if q1 in TOLD else 'in the code only' if q1 in CODE else 'nowhere'
        out.append((kind, q1, where))
        if where == 'nowhere': bad.append(q1)
for q in gone:
    q1 = ' '.join(q.split())
    where = 'still said' if q1 in TOLD or q1 in APP else 'no longer said'
    out.append(('gone', q1, where))
    if where == 'still said': bad.append(q1)
for k, q, w in out: print(f'{w:18} {k:6} {q}')
print(f'{len(out)} quoted phrases and labels: {sum(1 for x in out if x[2] == "on the built app")} on the built app, '
      f'{sum(1 for x in out if x[2] == "told a student")} told a student, {sum(1 for x in out if x[2] == "in the code only")} in the code only, '
      f'{sum(1 for x in out if x[2] == "nowhere")} nowhere; {sum(1 for x in out if x[0] == "gone")} the game no longer says, '
      f'{sum(1 for x in out if x[2] == "still said")} of them still said.')
json.dump([{'kind': k, 'text': q, 'found': w} for k, q, w in out], open(f'{B}/playtest-check.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
sys.exit(1 if bad else 0)
