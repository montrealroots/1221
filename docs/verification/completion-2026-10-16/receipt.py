"""
Brief 11's completion receipt (section 11), worked from the frozen baseline and the matrix as it stands, never typed:

    python3 docs/verification/completion-2026-10-16/receipt.py

Run from the repository's root after `node tools/completion-matrix.mjs`. It writes receipt.json (every baseline row's
status at the baseline and now, with its category) and RECEIPT.md, and exits 1 where the receipt finds what brief 11
forbids:
- a baseline row missing from the matrix;
- a row of decision 4's changed;
- a row closed by relabeling (an administrative row counted verified);
- a row verified at the baseline and not now.
The two completion figures are the brief's own: against the original full baseline (rows verified now among the 608 it
held in scope, out of 608), and against the actionable portion (the classification's actionable rows verified now, out of
those rows).
"""
import json, sys
from collections import Counter

B11 = 'docs/verification/completion-2026-10-16'
IAV, IVI, PI, NI, BE, DR, ED = ('Implemented And Verified', 'Implemented, Verification Incomplete', 'Partially Implemented',
                                'Not Implemented', 'Blocked Externally', 'Decision Required', 'Explicitly Deferred')
SEVEN = [IAV, IVI, PI, NI, BE, DR, ED]
ACTIONABLE = ('verification', 'design-or-gameplay')
ADMIN = ('superseded', 'duplicate', 'historical-record')

base = json.load(open(f'{B11}/baseline.json', encoding='utf-8'))
cls = json.load(open(f'{B11}/classification.json', encoding='utf-8'))
matrix = json.load(open('docs/verification/integration-2026-10-16/completion-matrix.json', encoding='utf-8'))
key = lambda r: (r['id'], r['group'])
now = {key(r): r for r in matrix['rows']}
category = {key(r): r['category'] for r in cls['rows']}
problems = []

NEEDS = {IVI: 'missing', PI: 'gap', NI: 'gap', BE: 'blocker', DR: 'decision', ED: 'deferredBy'}

def why(r):
    """What a row not verified now lacks: the field its status asks for."""
    v = r.get(NEEDS.get(r['status'], ''))
    if isinstance(v, dict): return v.get('question', '')
    return str(v or '')

rows = []
for b in base['rows']:
    k = key(b)
    n = now.get(k)
    if n is None:
        problems.append(f'{b["id"]} ({b["group"]}): in the baseline, not in the matrix')
        continue
    cat = category.get(k, 'verified at the baseline' if b['status'] == IAV else 'deferred at the baseline' if b['status'] == ED else 'unclassified')
    rows.append({'id': b['id'], 'group': b['group'], 'category': cat, 'baseline': b['status'], 'now': n['status'],
                 **({'lacks': why(n)} if n['status'] != IAV else {})})
added = [{'id': r['id'], 'group': r['group'], 'now': r['status']} for r in matrix['rows'] if key(r) not in {key(b) for b in base['rows']}]

d4 = [r for r in rows if r['category'] == 'decision-4']
for r in d4:
    if r['now'] != r['baseline']: problems.append(f'{r["id"]} ({r["group"]}): decision 4’s row moved from {r["baseline"]} to {r["now"]}')
for r in rows:
    if r['category'] in ADMIN and r['now'] == IAV: problems.append(f'{r["id"]} ({r["group"]}): an administrative row counted verified')
    if r['baseline'] == IAV and r['now'] != IAV: problems.append(f'{r["id"]} ({r["group"]}): verified at the baseline, {r["now"]} now: {r.get("lacks", "")[:160]}')
    if r['category'] == 'unclassified': problems.append(f'{r["id"]} ({r["group"]}): open at the baseline and in no category')

in_scope = [r for r in rows if r['baseline'] != ED]
assert len(in_scope) == base['counts']['inScope'], (len(in_scope), base['counts']['inScope'])
actionable = [r for r in rows if r['category'] in ACTIONABLE]
closed = [r for r in actionable if r['now'] == IAV]
admin = [r for r in rows if r['category'] in ADMIN]
remaining = [r for r in actionable if r['now'] != IAV]
full_done = sum(r['now'] == IAV for r in in_scope)
pct = lambda a, b: f'{a} of {b} ({(1000 * a // b) / 10:.1f}%)'
receipt = {
    'baseline': {'frozen': base['frozen'], 'main': base['main'], 'counts': base['counts']},
    'matrix': matrix['completion'],
    'completion': {
        'againstTheFullBaseline': pct(full_done, len(in_scope)),
        'ofTheActionablePortion': pct(len(closed), len(actionable)),
        'verifiedAtTheBaseline': base['counts'][IAV],
    },
    'closedByWork': [{'id': r['id'], 'group': r['group'], 'baseline': r['baseline']} for r in closed],
    'administrative': [{'id': r['id'], 'group': r['group'], 'category': r['category'], 'baseline': r['baseline'], 'now': r['now']} for r in admin],
    'remaining': [{'id': r['id'], 'group': r['group'], 'now': r['now'], 'lacks': r.get('lacks', '')} for r in remaining],
    'decision4': [{'id': r['id'], 'group': r['group'], 'baseline': r['baseline'], 'now': r['now']} for r in d4],
    'addedRows': added,
    'problems': problems,
    'rows': rows,
}
json.dump(receipt, open(f'{B11}/receipt.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

esc = lambda s: str(s).replace('|', '/').replace('\n', ' ')
md = [
    '# Brief 11’s Completion Receipt',
    '',
    'Written by `receipt.py` from `baseline.json` (the matrix frozen at `main`’s `' + base['main'] + '`) and the matrix as it stands. Nothing here is typed.',
    '',
    f'- **Against the original full baseline:** {receipt["completion"]["againstTheFullBaseline"]} rows in scope Implemented And Verified (at the baseline, {base["counts"][IAV]} of {len(in_scope)}).',
    f'- **Of the actionable portion:** {receipt["completion"]["ofTheActionablePortion"]} closed by implementation or verification.',
    f'- **The matrix’s own count:** {matrix["completion"].replace("Completion, by the matrix: ", "")} Its denominator is smaller than 608 by the administrative rows, which aren’t progress.',
    '- **Not complete:** decision 4’s rows stay as authorized, and every remaining row is listed below with what it lacks.',
    '',
    '## Status Now, Of The Baseline’s Rows',
    '',
    '| Status | At The Baseline | Now |',
    '|---|---|---|',
    *[f'| {s} | {Counter(r["baseline"] for r in rows)[s]} | {Counter(r["now"] for r in rows)[s]} |' for s in SEVEN],
    '',
    f'## Closed By Implementation Or Verification ({len(closed)})',
    '',
    '| Row | Group | At The Baseline |', '|---|---|---|',
    *[f'| `{r["id"]}` | {esc(r["group"])} | {r["baseline"]} |' for r in closed],
    '',
    f'## Administrative Corrections ({len(admin)}), Not Progress',
    '',
    '| Row | Group | Category | At The Baseline | Now |', '|---|---|---|---|---|',
    *[f'| `{r["id"]}` | {esc(r["group"])} | {r["category"]} | {r["baseline"]} | {r["now"]} |' for r in admin],
    '',
    f'## Remaining In The Actionable Portion ({len(remaining)})',
    '',
    '| Row | Group | Now | What It Lacks |', '|---|---|---|---|',
    *[f'| `{r["id"]}` | {esc(r["group"])} | {r["now"]} | {esc(r.get("lacks", ""))[:400]} |' for r in remaining],
    '',
    f'## Decision 4’s Rows ({len(d4)}), Unchanged',
    '',
    '| Row | Group | At The Baseline | Now |', '|---|---|---|---|',
    *[f'| `{r["id"]}` | {esc(r["group"])} | {r["baseline"]} | {r["now"]} |' for r in d4],
    '',
    f'## Rows Not In The Baseline ({len(added)})',
    '',
    *([f'- `{r["id"]}` ({esc(r["group"])}): {r["now"]}' for r in added] or ['None: the baseline wasn’t changed.']),
    '',
    f'## What The Receipt Found ({len(problems)})',
    '',
    *([f'- {esc(p)}' for p in problems] or ['Nothing: no baseline row is missing, decision 4’s rows are unchanged, no administrative row is counted verified, and no row verified at the baseline has fallen back.']),
    '',
    '## Every Baseline Row',
    '',
    '| Row | Group | Category | At The Baseline | Now |', '|---|---|---|---|---|',
    *[f'| `{r["id"]}` | {esc(r["group"])} | {r["category"]} | {r["baseline"]} | {r["now"]} |' for r in rows],
    '',
]
open(f'{B11}/RECEIPT.md', 'w', encoding='utf-8').write('\n'.join(md))
print(f'against the full baseline {receipt["completion"]["againstTheFullBaseline"]}; actionable {receipt["completion"]["ofTheActionablePortion"]}; {len(problems)} problems')
for p in problems: print('  ' + p)
sys.exit(1 if problems else 0)
