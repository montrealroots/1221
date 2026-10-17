"""
Brief 13's receipt (section 9), brief 12's receipt read again with brief 13's results after brief 12's, so a later
result replaces an earlier one; worked from brief 11's frozen baseline, its classification, both briefs' results and the
matrix as it stands, never typed. Brief 12's own receipt (`../resolution-2026-10-17/RECEIPT.md`) stays as it was.

    python3 docs/verification/playthroughs-2026-10-17/receipt.py

Run from the repository's root after `node tools/completion-matrix.mjs`. It writes receipt.json and RECEIPT.md. Each of
the 46 actionable rows ends in exactly one of the brief's categories (section 5): closed through implementation or
verification, superseded by this authorization, a scope resolution, a research assumption, or remaining. Decision 4's 23
rows and brief 11's 9 administrative rows are counted apart. It exits 1 where the record and the matrix disagree:
- a baseline row has gone;
- decision 4 has moved;
- a row called closed, a scope resolution or a research assumption isn't verified in the matrix;
- a superseded row isn't Explicitly Deferred, or has no replacement;
- an administrative row is counted verified;
- a row verified at the baseline has fallen back.
"""
import json, os, sys
from collections import Counter

B11 = 'docs/verification/completion-2026-10-16'
B12 = 'docs/verification/resolution-2026-10-17'
B13 = 'docs/verification/playthroughs-2026-10-17'
IAV, IVI, PI, NI, BE, DR, ED = ('Implemented And Verified', 'Implemented, Verification Incomplete', 'Partially Implemented',
                                'Not Implemented', 'Blocked Externally', 'Decision Required', 'Explicitly Deferred')
SEVEN = [IAV, IVI, PI, NI, BE, DR, ED]
NEEDS = {IVI: 'missing', PI: 'gap', NI: 'gap', BE: 'blocker', DR: 'decision', ED: 'deferredBy'}
ACTIONABLE = ('verification', 'design-or-gameplay')
ADMIN = ('superseded', 'duplicate', 'historical-record')
CATEGORIES = ['closed', 'superseded', 'scope resolution', 'research assumption', 'remaining']

base = json.load(open(f'{B11}/baseline.json', encoding='utf-8'))
cls = json.load(open(f'{B11}/classification.json', encoding='utf-8'))
matrix = json.load(open('docs/verification/integration-2026-10-16/completion-matrix.json', encoding='utf-8'))
key = lambda r: (r['id'], r['group'])
now = {key(r): r for r in matrix['rows']}
category = {key(r): r['category'] for r in cls['rows']}
results = {}
for d in (B12, B13):
    for f in sorted(x for x in os.listdir(d) if x.endswith('-result.json')):
        res = json.load(open(f'{d}/{f}', encoding='utf-8'))
        for r in res.get('rows', []):
            results[(r['id'], r.get('group'))] = {**r, 'area': res.get('area', f[:-12]), 'file': f'{d}/{f}'}
        for n in res.get('replacements', []):
            results[('replacement', n['id'])] = {**n, 'area': res.get('area', f[:-12]), 'file': f'{d}/{f}'}
problems = []

def lacks(r):
    v = r.get(NEEDS.get(r['status'], ''))
    return v.get('question', '') if isinstance(v, dict) else str(v or '')

rows = []
for b in base['rows']:
    k = key(b)
    n = now.get(k)
    if n is None:
        problems.append(f'{b["id"]} ({b["group"]}): in the baseline, not in the matrix')
        continue
    cat = category.get(k)
    entry = {'id': b['id'], 'group': b['group'], 'baseline': b['status'], 'now': n['status']}
    if cat in ACTIONABLE:
        r12 = results.get(k) or results.get((b['id'], None))
        if r12:
            entry['disposition'], entry['by'] = r12['disposition'], r12['file']
        elif n['status'] == IAV:
            entry['disposition'], entry['by'] = 'closed', 'brief 11'
        else:
            entry['disposition'], entry['by'] = 'remaining', 'nothing yet'
        if n['status'] != IAV: entry['lacks'] = lacks(n)
    elif cat == 'decision-4':
        entry['disposition'] = 'decision 4'
    elif cat in ADMIN:
        entry['disposition'] = 'administrative'
    else:
        entry['disposition'] = 'verified at the baseline' if b['status'] == IAV else 'deferred at the baseline' if b['status'] == ED else 'unclassified'
    rows.append(entry)

for r in rows:
    d = r['disposition']
    if d == 'decision 4' and r['now'] != r['baseline']: problems.append(f'{r["id"]} ({r["group"]}): decision 4’s row moved from {r["baseline"]} to {r["now"]}')
    if d in ('closed', 'scope resolution', 'research assumption') and r['now'] != IAV: problems.append(f'{r["id"]} ({r["group"]}): called {d}, {r["now"]} in the matrix')
    if d == 'superseded' and r['now'] != ED: problems.append(f'{r["id"]} ({r["group"]}): called superseded, {r["now"]} in the matrix')
    if d == 'administrative' and r['now'] == IAV: problems.append(f'{r["id"]} ({r["group"]}): an administrative row counted verified')
    if r['baseline'] == IAV and r['now'] != IAV: problems.append(f'{r["id"]} ({r["group"]}): verified at the baseline, {r["now"]} now')
    if d == 'unclassified': problems.append(f'{r["id"]} ({r["group"]}): open at the baseline and in no category')

replacements = []
for (tag, rid), n in results.items():
    if tag != 'replacement': continue
    m = next((x for x in matrix['rows'] if x['id'] == rid and x['group'].endswith('Replacement Criteria')), None)
    replacements.append({'id': rid, 'replaces': n['replaces'], 'criterion': n.get('criterion', ''), 'status': m['status'] if m else 'not in the matrix',
                         'evidence': n.get('evidence', []), **({'lacks': lacks(m)} if m and m['status'] != IAV else {})})
    if not m: problems.append(f'{rid}: a replacement not in the matrix')
for r in rows:
    if r['disposition'] == 'superseded' and not any(r['id'] in x['replaces'] for x in replacements):
        problems.append(f'{r["id"]}: superseded with no replacement')

in_scope = [r for r in rows if r['baseline'] != ED]
assert len(in_scope) == base['counts']['inScope'], (len(in_scope), base['counts']['inScope'])
actionable = [r for r in rows if r['disposition'] in CATEGORIES]
assert len(actionable) == cls['actionable'], (len(actionable), cls['actionable'])
count = Counter(r['disposition'] for r in actionable)
pct = lambda a, b: f'{a} of {b} ({(1000 * a // b) / 10:.1f}%)'
full_done = sum(r['now'] == IAV for r in in_scope)
receipt = {
    'baseline': {'frozen': base['frozen'], 'main': base['main'], 'counts': base['counts']},
    'matrix': matrix['completion'],
    'againstTheFullBaseline': pct(full_done, len(in_scope)),
    'actionable': {c: count.get(c, 0) for c in CATEGORIES} | {'of': len(actionable)},
    'decision4': sum(r['disposition'] == 'decision 4' for r in rows),
    'administrative': sum(r['disposition'] == 'administrative' for r in rows),
    'replacements': replacements,
    'problems': problems,
    'rows': rows,
}
json.dump(receipt, open(f'{B13}/receipt.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

esc = lambda s: str(s).replace('|', '/').replace('\n', ' ')

# Section 9's other parts, each read from its record: the playthroughs (journeys-result.json, interface-result.json),
# the defects each area found, and the final runs and whether main holds this branch (runs/, git).
def playthroughs_md():
    # Brief 13's playthroughs, read from the journeys and interface areas' results as they wrote them.
    out = []
    j = f'{B13}/journeys-result.json'
    if os.path.exists(j):
        jr = json.load(open(j, encoding='utf-8'))
        table = jr.get('journeys') or jr.get('playthroughs') or []
        out += [f'## The Complete School Journeys ({len(table)})', '', '| Journey | Profile | Seed | Duration | Expected | Actual | Checks | Issues |', '|---|---|---|---|---|---|---|---|']
        for x in table:
            checks = x.get('checks') or {}
            passed = sum(1 for v in checks.values() if (v.get('passed') if isinstance(v, dict) else v) is True) if isinstance(checks, dict) else ''
            out.append(f'| {esc(x.get("id", ""))} | {esc(x.get("profile", ""))} | {esc(x.get("seed", ""))} | {esc(x.get("duration", ""))} | {esc(x.get("expected", ""))[:160]} | {esc(x.get("actual", ""))[:160]} | {passed}{"/" + str(len(checks)) if isinstance(checks, dict) and checks else ""} | {esc("; ".join(x.get("issues", [])) if isinstance(x.get("issues"), list) else x.get("issues", ""))[:200]} |')
        out.append('')
    i = f'{B13}/interface-result.json'
    if os.path.exists(i):
        ir = json.load(open(i, encoding='utf-8'))
        runs = ir.get('playthroughs') or []
        out += [f'## The Interface Playthroughs ({len(runs)})', '', '| Playthrough | Width | Steps | Passed | Failed | Trace |', '|---|---|---|---|---|---|']
        for x in runs:
            out.append(f'| {esc(x.get("id", x.get("name", "")))} | {esc(x.get("width", ""))} | {esc(x.get("steps", ""))} | {esc(x.get("passed", ""))} | {esc(x.get("failed", ""))} | {esc(x.get("trace", ""))} |')
        out.append('')
    defects = []
    for f in sorted(x for x in os.listdir(B13) if x.endswith('-result.json')):
        for d in json.load(open(f'{B13}/{f}', encoding='utf-8')).get('defectsFound', []):
            defects.append(f'- **{f[:-12]}:** {esc(d.get("what", d) if isinstance(d, dict) else d)[:400]}')
    if defects:
        out += [f'## Defects Found By Brief 13 ({len(defects)})', '', *defects, '']
    return out

def runs_md():
    import glob, re, subprocess
    R = f'{B13}/runs'
    out = ['## The Final Runs, The Walkthrough And Merging', '']
    for f in sorted(glob.glob(f'{R}/exits-*.txt')):
        lines = open(f, encoding='utf-8').read().splitlines()
        steps = [l for l in lines if ' exit=' in l]
        bad = [l.split(' ')[0] for l in steps if not re.search(r' exit=0 ', l)]
        out.append(f'- **{os.path.basename(f)[6:-4]}:** {lines[0]}; {len(steps)} steps, {"every one exit 0" if not bad else "not exit 0: " + ", ".join(bad)}.')
    fig = json.load(open(f'{R}/figures.json', encoding='utf-8')) if os.path.exists(f'{R}/figures.json') else {}
    out += [f'- **{k}:** {esc(v)}' for k, v in fig.items()]
    for w in ('1440', '390'):
        p = f'{R}/acceptance/{w}-report.json'
        if not os.path.exists(p): continue
        rep = json.load(open(p, encoding='utf-8'))
        walk = [s for s in rep['steps'] if re.match(r'^(health:|stamina and recovery:|papers: a Connecticut ID card|\[save: brief scenario\] advice:)', s['name'])]
        out.append(f'- **The walkthrough’s own steps at {w}** (PLAYTEST.md): ' + '; '.join(f'{"passed" if s.get("ok") else "FAILED" if s.get("ok") is False else "skipped"}: {esc(s["name"])[:90]}' for s in walk))
    try:
        merged = subprocess.run(['git', 'merge-base', '--is-ancestor', 'HEAD', 'origin/main'], capture_output=True).returncode == 0
        out.append(f'- **Merged:** {"main holds this branch’s head" if merged else "not into main, which is the owner’s word to give"} (git merge-base, as this was written). **Deployed:** nothing; Base44 deployment is the owner’s word after the gate (rule 14).')
    except OSError:
        pass
    return out + ['']

md = [
    '# Brief 13’s Completion Receipt',
    '',
    'Written by `receipt.py` from brief 11’s frozen baseline (the matrix at `main`’s `' + base['main'] + '`), its classification, brief 12’s and brief 13’s results and the matrix as it stands. Nothing here is typed.',
    '',
    f'- **Against the original full baseline:** {receipt["againstTheFullBaseline"]} rows in scope Implemented And Verified (at the baseline, {base["counts"][IAV]} of {len(in_scope)}).',
    f'- **The {len(actionable)} actionable rows, each in one category:** ' + '; '.join(f'{c} {count.get(c, 0)}' for c in CATEGORIES) + '.',
    f'- **Outside them:** decision 4’s {receipt["decision4"]} rows, unchanged; brief 11’s {receipt["administrative"]} administrative rows.',
    f'- **The matrix’s own count:** {matrix["completion"].replace("Completion, by the matrix: ", "")}',
    '',
    '## The Actionable Rows',
    '',
    '| Row | Group | At The Baseline | Now | Category | By |', '|---|---|---|---|---|---|',
    *[f'| `{r["id"]}` | {esc(r["group"])} | {r["baseline"]} | {r["now"]} | {r["disposition"]} | {esc(r.get("by", ""))} |' for r in actionable],
    '',
    f'## The Replacement Criteria ({len(replacements)})',
    '',
    '| Row | Replaces | Status | Evidence |', '|---|---|---|---|',
    *[f'| `{x["id"]}` | {esc(x["replaces"])} | {x["status"]} | {esc("; ".join((e.get("file", "") + (" ‘" + e["title"] + "’" if e.get("title") else "")) for e in x["evidence"]))[:600]} |' for x in replacements],
    '',
    '## What Remains',
    '',
    *([f'- `{r["id"]}` ({esc(r["group"])}): {r["now"]}: {esc(r.get("lacks", ""))[:400]}' for r in actionable if r['disposition'] == 'remaining'] or ['Nothing in the actionable portion.']),
    *[f'- `{x["id"]}` (replacement): {x["status"]}: {esc(x.get("lacks", ""))[:400]}' for x in replacements if x['status'] != IAV],
    '',
    f'## Decision 4’s Rows ({receipt["decision4"]}), Unchanged',
    '',
    '| Row | Group | At The Baseline | Now |', '|---|---|---|---|',
    *[f'| `{r["id"]}` | {esc(r["group"])} | {r["baseline"]} | {r["now"]} |' for r in rows if r['disposition'] == 'decision 4'],
    '',
    *playthroughs_md(),
    *runs_md(),
    f'## What The Receipt Found ({len(problems)})',
    '',
    *([f'- {esc(p)}' for p in problems] or ['Nothing: no baseline row is gone, decision 4 is unchanged, every closed, resolved or assumed row is verified in the matrix, every superseded row is deferred with its replacement, and no row verified at the baseline has fallen back.']),
    '',
]
open(f'{B13}/RECEIPT.md', 'w', encoding='utf-8').write('\n'.join(md))
print(f'against the full baseline {receipt["againstTheFullBaseline"]}; actionable ' + ', '.join(f'{c} {count.get(c, 0)}' for c in CATEGORIES) + f'; {len(problems)} problems')
for p in problems: print('  ' + p)
sys.exit(1 if problems else 0)
