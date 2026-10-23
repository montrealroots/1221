"""Brief 23's walk, summed: each size's measures over every life and step, from one or more audit.json files.

  python3 docs/verification/ui-2026-10-23/app/summarize.py OUT.json audit.json [audit.json ...]

Writes the merged steps' summary (by size, and the steps that failed a measure) to OUT.json and prints it.
"""
import json, sys
from collections import defaultdict

out, files = sys.argv[1], sys.argv[2:]
steps = [e for f in files for e in json.load(open(f)) if e.get('step') != '(problems)']
problems = [p for f in files for e in json.load(open(f)) if e.get('step') == '(problems)' for p in e.get('problems', [])]
by = defaultdict(list)
for e in steps: by[e['size']].append(e)
order = ['1280x720', '1440x900', '1920x1080', '1024x768', '760x900', '667x375m', '844x390m', '932x430m', '390x844m']
summary = {'steps': len(steps), 'sizes': {}, 'failing': defaultdict(list), 'problems': sorted(set(problems))}
for size in sorted(by, key=lambda s: order.index(s) if s in order else 99):
    es = by[size]
    def n(pred): return sum(1 for e in es if pred(e))
    tabs = [t for e in es for t in e.get('tabs', [])]
    s = {
        'steps': len(es),
        'pageWider': n(lambda e: e.get('pageWider', 0) > 1),
        'bleed': n(lambda e: e.get('bleedCount', 0) > 0),
        'cut': n(lambda e: e.get('cutCount', 0) > 0),
        'cutTitled': n(lambda e: e.get('cutTitledCount', 0) > 0),
        'squeezed': n(lambda e: e.get('squeezedCount', 0) > 0),
        'clipped': n(lambda e: e.get('clippedCount', 0) > 0),
        'smallTargetsPerStep': round(sum(e.get('smallCount', 0) for e in es) / max(1, len(es)), 1),
        'stepsWithSmallTargets': n(lambda e: e.get('smallCount', 0) > 0),
        'textLinksPerStep': round(sum(e.get('textLinkCount', 0) for e in es) / max(1, len(es)), 1),
        'headerHeight': sorted({e.get('headerH') for e in es if e.get('headerH')}),
        'contentShareMin': min((e.get('contentShare') or 100) for e in es),
        'railShown': n(lambda e: e.get('railShown')),
        'tabBarsOverflowing': sum(1 for t in tabs if t['overflows']),
        'tabBarsHalfShownNoCue': sum(1 for t in tabs if t['halfShown'] and not t['cue']),
        'tabBarsActiveHidden': sum(1 for t in tabs if t['activeVisible'] is False),
        'dialogsNotFitting': n(lambda e: e.get('dialog') and e.get('dialogFits') is False),
        'dialogFootHidden': n(lambda e: e.get('dialog') and e.get('dialogFootVisible') is False),
        'rotateScreen': n(lambda e: e.get('rotate')),
    }
    summary['sizes'][size] = s
    for e in es:
        bad = [k for k, ok in [('pageWider', e.get('pageWider', 0) <= 1), ('bleed', not e.get('bleedCount')), ('cut', not e.get('cutCount')), ('squeezed', not e.get('squeezedCount')), ('clipped', not e.get('clippedCount'))] if not ok]
        if bad: summary['failing'][f"{size} {e['step']}"].append({'life': e['life'], 'bad': bad, 'bleed': e.get('bleed', [])[:3], 'cut': e.get('cut', [])[:3], 'squeezed': e.get('squeezed', [])[:3], 'clipped': e.get('clipped', [])[:3], 'pageWider': e.get('pageWider')})
summary['failing'] = dict(summary['failing'])
json.dump(summary, open(out, 'w'), indent=1)
print(json.dumps(summary['sizes'], indent=1))
print(len(summary['failing']), 'size-steps failing a measure;', len(summary['problems']), 'problems')
