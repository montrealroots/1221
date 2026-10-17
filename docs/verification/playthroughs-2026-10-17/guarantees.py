"""
Brief 13's section 7, the guarantees the final changes must keep, each read from what holds it, never typed: the matrix's
rows that state it (their status as the matrix gives it, so a row whose measurement went stale reads as stale), the final
runs on the tested commit that measure it, and the gate's own lines. Writes guarantees.json and GUARANTEES.md.

    python3 docs/verification/playthroughs-2026-10-17/guarantees.py

Run from the repository's root after `node tools/completion-matrix.mjs`, receipt.py and the gate on the tested commit
(runs/gate.txt). A guarantee is held when every row it names is Implemented And Verified and every figure it reads came
out as the guarantee says; otherwise it is named open, with the row or figure that isn't. It exits 1 if one is open.
"""
import json, os, re, sys

B = 'docs/verification/playthroughs-2026-10-17'
IAV = 'Implemented And Verified'
matrix = {(r['id'], r['group']): r for r in json.load(open('docs/verification/integration-2026-10-16/completion-matrix.json', encoding='utf-8'))['rows']}
by_id = {}
for (i, g), r in matrix.items(): by_id.setdefault(i, []).append(r)
load = lambda p: json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None
fig = load(f'{B}/runs/figures.json') or {}
mono = load(f'{B}/final/monotonicity.json')
journeys = load(f'{B}/journeys-final/summary.json') or []
receipt = load(f'{B}/receipt.json') or {}
gate = open(f'{B}/runs/gate.txt', encoding='utf-8').read() if os.path.exists(f'{B}/runs/gate.txt') else ''
src = lambda p, pat: (re.search(pat, open(p, encoding='utf-8').read()) or [None, None])[1]

def row(i, group=None):
    rs = [r for r in by_id.get(i, []) if group is None or r['group'] == group]
    if len(rs) != 1: return {'id': i, 'group': group, 'status': f'{len(rs)} rows of that name in the matrix', 'held': False}
    r = rs[0]
    return {'id': i, 'group': r['group'], 'status': r['status'], 'held': r['status'] == IAV,
            'why': '' if r['status'] == IAV else str(r.get('missing') or r.get('decision') or r.get('statusNote') or '')[:300]}

def figure(name, said, held):
    return {'figure': name, 'said': said, 'held': bool(held)}

def checks(name):
    # Each final journey's own check of that name, read from its summary: how many passed of how many ran.
    ran = [j for j in journeys if name in (j.get('checks') or {})]
    return sum(1 for j in ran if j['checks'][name] == 'pass'), len(ran)

lr = fig.get('INT-long-runs', '')
breaches = [int(x) for x in re.findall(r'breaches (\d+)', lr)]
unbalanced = [int(x) for x in re.findall(r'unbalanced (\d+)', lr)]
plans = re.search(r'mastery plans: (\d+) of (\d+) at 100', lr)
schema_engine = src('src/engine/domain/model.ts', r'SAVE_SCHEMA_VERSION = (\d+)')
schema_guard = src('base44/shared/guard.js', r'SUPPORTED_SCHEMA_VERSION = (\d+)')
d4 = [r for r in receipt.get('rows', []) if r.get('disposition') == 'decision 4']
d4_moved = [r['id'] for r in d4 if r.get('baseline') != r.get('now')]
wired = re.search(r'^(\d+) declared words? that nothing reads', gate, re.M)
caps = re.search(r'^(\d+) capabilities: Missing (\d+)[^\n]*', gate, re.M)
gate_exit = (re.findall(r'^exit=(\d+)', gate, re.M) or [None])[-1]
check_names = sorted({k for j in journeys for k in (j.get('checks') or {})})

def journey_check(pattern, what):
    ks = [k for k in check_names if re.search(pattern, k, re.I)]
    if not ks: return figure(f'the journeys’ check on {what}', f'no check matching “{pattern}” in journeys-final/summary.json', False)
    p, n = map(sum, zip(*(checks(k) for k in ks)))
    return figure(f'the journeys’ check on {what}', f'{p} of {n} passed on the tested commit ({", ".join(ks)})', n and p == n)

G = [
    ('Maximum-quality prepared mastery',
     [row('M1', 'Criteria: The Attributes'), row('M1', 'Brief 10 Area: judge'), row('MA5'), row('MA6'), row('journeys.7-mastery')],
     [figure('the mastery plans (runs13.sh D)', f'{plans.group(1)} of {plans.group(2)} played plans at 100 on every payoff tape' if plans else 'not run', plans and plans.group(1) == plans.group(2))]),
    ('Relevant attribute improvement without unintended regression',
     [row('MA1'), row('MA2'), row('A5'), row('L3-R.d'), row('journeys.7-attributes')],
     [figure('L3-R (d), every ability raised alone on every piece (runs13.sh M3, M4, MF)',
             f"{mono['checks']:,} checks on {mono['pieces']} pieces, {mono['falls']} falls, worst {mono['worst']}" if mono else 'not run', mono and mono['falls'] == 0)]),
    ('Genre-specific benefits without unrelated leakage',
     [row('S3'), row('S4'), row('genres.7-measured'), row('journeys.7-genres')], []),
    ('Specialist opportunities and valid limitations',
     [row('H4-R.a'), row('H4-R.b'), row('H4-R.c'), row('H4-R.d'), row('ST6-R2.c'), row('journeys.7-specialists')], [],
     # ST6-R2.e was never verified (Decision Required when brief 13 began), so it isn't a guarantee kept; it's named here
     # beside the guarantee, as it stands, not counted in it.
     [row('ST6-R2.e')]),
    ('Accurate advice forecasts',
     [row('advice.F2A10-b'), row('advice.F2A10-c'), row('advice.F2A10-e'), row('advice.heldout'), row('journeys.7-advice-forecasts')],
     [figure('F2-A’s forty cases (runs13.sh ADVR)', fig.get('F2-A', 'not run'), re.match(r'(\d+) of (\d+)', fig.get('F2-A', '')) and len(set(re.match(r'(\d+) of (\d+)', fig['F2-A']).groups())) == 1)]),
    ('Stamina’s duration, participation, intensity and recovery',
     [row(f'stamina.W{n}') for n in range(1, 11)] + [row('stamina.A1'), row('journeys.7-stamina')], []),
    ('Ledger balance',
     [row('journeys.7-ledger')],
     [figure('the long runs (runs13.sh B, C, D)', f'breaches {sum(breaches)}, unbalanced {sum(unbalanced)} across the lives, the workload runs and the variety run' if breaches else 'not run', breaches and not sum(breaches) and not sum(unbalanced)),
      journey_check(r'^6 money$', 'money (check 6, the ledger balanced at every reload)')]),
    ('Save compatibility and historical results',
     [row('INT-migration'), row('INT-determinism'), row('stamina.W10'), row('genres.5-saves'), row('journeys.7-save')],
     [figure('the save schema, pinned in two places', f'SAVE_SCHEMA_VERSION {schema_engine} in src/engine/domain/model.ts, SUPPORTED_SCHEMA_VERSION {schema_guard} in base44/shared/guard.js', schema_engine == schema_guard == '94'),
      journey_check(r'^10 save and reload$', 'save and reload (check 10)')]),
    ('Decision #4’s unchanged protected rows',
     [],
     [figure('receipt.py, against brief 11’s frozen baseline', f'{len(d4)} rows, {len(d4_moved)} moved' + (f': {", ".join(d4_moved)}' if d4_moved else ''), d4 and not d4_moved)]),
    ('Nothing advertised as a functioning mechanic is decoration',
     [row('A4'), row('INT-gate')],
     [figure('tools/wired.mjs --check, in the gate', f'{wired.group(0)} (the ratchet’s person namespace and people table, which bootstrap alone fills: the one player, not a mechanic); the counts in docs/UNWIRED.json didn’t rise' if wired else 'the gate not run', wired and gate_exit == '0'),
      figure('tools/capabilities.mjs --check, in the gate', caps.group(0) if caps else 'the gate not run', caps and caps.group(2) == '0' and gate_exit == '0')]),
]

out = []
for name, rows, figs, *beside in G:
    beside = beside[0] if beside else []
    open_ = [f"{r['id']} ({r['status']}{': ' + r['why'] if r.get('why') else ''})" for r in rows if not r['held']] + [f"{f['figure']}: {f['said']}" for f in figs if not f['held']]
    out.append({'guarantee': name, 'held': not open_, 'rows': rows, 'figures': figs, 'open': open_, 'beside': beside})
json.dump({'on': gate and re.search(r'^at (\w+)', gate, re.M).group(1), 'guarantees': out}, open(f'{B}/guarantees.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

esc = lambda s: str(s).replace('|', '/').replace('\n', ' ')
md = ['# Brief 13’s Guarantees (Section 7)', '',
      'Written by `guarantees.py` from the completion matrix, the final runs on the tested commit and the gate. Nothing here is typed. '
      'A guarantee is held when every row it names is Implemented And Verified, as the matrix gives it (a row whose measurement went stale reads as stale), and every figure came out as it says.', '',
      f'- **Held:** {sum(1 for g in out if g["held"])} of {len(out)}.', '']
for g in out:
    md += [f'## {g["guarantee"]}: {"held" if g["held"] else "open"}', '']
    md += [f'- `{r["id"]}` ({esc(r["group"])}): {r["status"]}' + (f': {esc(r["why"])}' if r.get('why') else '') for r in g['rows']]
    md += [f'- **{esc(f["figure"])}:** {esc(f["said"])}' for f in g['figures']]
    md += [f'- Beside it, not counted in it: `{r["id"]}` ({esc(r["group"])}): {r["status"]}' + (f': {esc(r["why"])}' if r.get('why') else '') for r in g['beside']]
    md.append('')
open(f'{B}/GUARANTEES.md', 'w', encoding='utf-8').write('\n'.join(md))
for g in out: print(f"{'held' if g['held'] else 'OPEN'}: {g['guarantee']}" + ('' if g['held'] else ' — ' + '; '.join(g['open'])[:400]))
sys.exit(0 if all(g['held'] for g in out) else 1)
