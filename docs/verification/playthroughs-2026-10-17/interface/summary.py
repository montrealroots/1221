"""
Brief 13's interface playthroughs, summed from their traces (2026-10-17): each playthrough at each width, its steps
passed and failed, which of the six things each passed step exercised, its trace and its screenshots. Nothing in it is
typed: every figure is read from `<playthrough>-<width>/trace.json`, which `tools/playthroughs-ui.mjs` wrote, and
`exits.txt`, which the runs appended to.

    python3 docs/verification/playthroughs-2026-10-17/interface/summary.py

writes `summary.json` beside it, which `../interface-result.json` names for its figures.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REL = 'docs/verification/playthroughs-2026-10-17/interface'
SIX = ['navigation', 'drill-down', 'unavailable', 'confirmation', 'notification', 'save-continue']

runs = []
for play in ['normal', 'setback', 'specialist']:
    for width in [1440, 390]:
        folder = f'{play}-{width}'
        path = os.path.join(HERE, folder, 'trace.json')
        if not os.path.exists(path):
            runs.append({'playthrough': play, 'width': width, 'missing': f'{REL}/{folder}/trace.json'})
            continue
        t = json.load(open(path, encoding='utf-8'))
        shots = sorted(f for f in os.listdir(os.path.join(HERE, folder)) if f.endswith('.jpg'))
        runs.append({
            'playthrough': play,
            'width': width,
            'commit': t.get('commit'),
            'trackedChangesWhenRun': t.get('uncommitted'),
            'startingPoint': t.get('startingPoint'),
            'steps': len(t['steps']),
            'passed': sum(1 for s in t['steps'] if s['ok']),
            'failed': [{'n': s['n'], 'name': s['name'], 'why': s.get('why')} for s in t['steps'] if not s['ok']],
            'exercised': {k: [s['n'] for s in t['steps'] if s['ok'] and k in s['exercises']] for k in SIX},
            'sixMissing': [k for k in SIX if not any(s['ok'] and k in s['exercises'] for s in t['steps'])],
            # The first step with the game's clock on the screen: a new life's first steps are the slots and creation.
            'gameFrom': next((f"{s['date']} {s.get('clock', '')}".strip() for s in t['steps'] if s.get('date')), ''),
            'gameTo': f"{t['steps'][-1].get('date', '')} {t['steps'][-1].get('clock', '')}".strip() if t['steps'] else '',
            'dialogsGoneThrough': len(t.get('dialogs', [])),
            'errors': len(t.get('errors', [])),
            'overflows': len(t.get('overflows', [])),
            'trace': f'{REL}/{folder}/trace.json',
            'log': f'{REL}/{folder}/run.log',
            'screenshots': [f'{REL}/{folder}/{f}' for f in shots],
            'stepNames': [f"{s['n']}. {'passed' if s['ok'] else 'FAILED'}: {s['name']}" for s in t['steps']],
        })

exits = [line.strip() for line in open(os.path.join(HERE, 'exits.txt'), encoding='utf-8')] if os.path.exists(os.path.join(HERE, 'exits.txt')) else []
out = {
    'written': 'by summary.py, from the traces and exits.txt',
    'runs': runs,
    'allPassed': all(r.get('steps') and not r['failed'] and not r['sixMissing'] and not r['errors'] and not r['overflows'] for r in runs),
    'exits': exits,
}
with open(os.path.join(HERE, 'summary.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
    f.write('\n')
print(json.dumps({'allPassed': out['allPassed'], 'runs': [(r['playthrough'], r['width'], r.get('passed'), r.get('steps'), r.get('sixMissing')) for r in runs]}, ensure_ascii=False))
