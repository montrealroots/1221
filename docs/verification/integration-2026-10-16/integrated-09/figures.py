"""Brief 09's criteria on the integrated tree, read from the tools' outputs (never typed): writes figures.json.

Usage: python3 integrated-figures.py <folder with the outputs>
"""
import json, re, sys
D = sys.argv[1]
J = lambda f: json.load(open(f'{D}/{f}', encoding='utf-8'))
n = lambda x: f'{x:,}'
pc = lambda x: f'{x:g}%'
out = {}
s = J('stage.json')
st = s['stage']
out['ST1'] = f"restrained {st['ST1']['restrainedAhead']}, expansive {st['ST1']['expansiveAhead']} of {st['ST1']['n']}"
out['ST2'] = f"{st['ST2']['restsOnTheScene']} of {st['ST2']['bandApart']}, no house signal on any material"
out['ST4'] = '; '.join(f"{g} {json.dumps(v, ensure_ascii=False)}" for g, v in st['ST4']['genres'].items())
out['ST5'] = f"{n(st['ST5']['at100'])} of {n(st['ST5']['checked'])} at 100"
out['ST7'] = f"{st['ST7']['atLeastTwoWithinAPoint']} of {st['ST7']['materials']}"
out['ST8'] = f"{st['ST8']['follow']} of {st['ST8']['n']}"
f1 = st['F1']
out['Stage F1'] = (f"ST1 {f1['ST1']['restrainedAhead']} / {f1['ST1']['expansiveAhead']} of {f1['ST1']['n']}; ST5 {n(f1['ST5']['at100'])} of {n(f1['ST5']['checked'])}; "
                   f"ST7 {f1['ST7']['atLeastTwoWithinAPoint']} of {f1['ST7']['materials']}; ST8 {f1['ST8']['follow']} of {f1['ST8']['n']}")
f2 = st['F2']
out['Stage F2'] = '; '.join(f"{k[2:]}: ST1 {v['ST1']['restrainedAhead']} / {v['ST1']['expansiveAhead']} of {v['ST1']['n']}, ST8 {v['ST8']['follow']} of {v['ST8']['n']}" for k, v in f2.items())
samples = [k for k in ('designed', 'heldOut', 'freshHeldOut') if k in s]
out['I1'] = ', '.join(f"{k} {n(s[k]['I1']['at100'])} of {n(s[k]['I1']['checked'])}" for k in samples)
out['I2'] = ', '.join(f"{ax} {pc(s['I2'][ax]['differs'])}" for ax in ('pace', 'scale', 'structure'))
out['I3'] = ', '.join(f"{k} sd {s[k]['I3']['sd']}, restrained ahead {pc(s[k]['I3']['restrainedAhead'])}, expansive {pc(s[k]['I3']['expansiveAhead'])}" for k in samples)
out['I4'] = ', '.join(f"{k} {json.dumps({kk: vv for kk, vv in s[k]['I4'].items() if not isinstance(vv, (dict, list))}, ensure_ascii=False)}" for k in samples)
out['I5'] = ', '.join(f"{k} {json.dumps({kk: vv for kk, vv in s[k]['I5'].items() if not isinstance(vv, (dict, list))}, ensure_ascii=False)}" for k in samples)
out['ST9'] = 'I1 to I5, S1 to S4 and G2 as their rows say'
# The attribute criteria: ag-criteria.mjs's own lines, verdict and figure.
lines = open(f'{D}/criteria.txt', encoding='utf-8').read().splitlines()
crit = {}
for line in lines:
    m = re.match(r'^(\S+(?: \S+)*?)\s{2,}(Meets|FAILS)\s{2}(.*?)\s{2}\[', line)
    if m: crit[m.group(1)] = f'{m.group(2)}: {m.group(3)}'
for row, key in (('A1', 'A1'), ('A2', 'A2'), ('A3', 'A3'), ('T2', 'T2(a)'), ('T3', 'T3(a)'), ('G3', 'G3'), ('G4', 'G4'), ('G5', 'G5'), ('M1', 'M1'),
                 ('M3', 'M3'), ('O1', 'O1'), ('O2', 'O2'), ('H2', 'H2'), ('H5', 'H5'), ('H7', 'H7')):
    out[row] = crit[key]
# L1 and L2: the 120-day journeys.
js, jb = J('journey-specialist-bj-0.json'), J('journey-beginner-bj-0.json')
out['L1'] = f"specialist {js['recommendations']['longestSameTarget']}, beginner {jb['recommendations']['longestSameTarget']} weeks"
out['L2'] = f"specialist {js['sameTakeTwiceInARow']}, beginner {jb['sameTakeTwiceInARow']}"
# S1 to S4: the four samples.
sig, fr = J('signature.json'), J('signature-fresh.json')
four = [('designed', sig['designed']), ('held out', sig['heldOut']), ('fresh designed', fr['designedFresh']), ('fresh held out', fr['heldOutFresh'])]
out['S1'] = '; '.join(f"{k} {v['S1']['meanCos']} (least {v['S1']['least']})" for k, v in four)
out['S2'] = '; '.join(f"{k} {v['S2revised']['opposedOverOne']}×" for k, v in four)
out['S3'] = '; '.join(f"{k} {n(v['S3revised']['differing'])} of {n(v['S3revised']['cases'])} ({v['S3revised']['differ'] * 100:.1f}%)" for k, v in four)
g2 = J('genre-identity.json')['g2']['identicalCrossGenre']
out['S4'] = f"{len(g2)} briefs of different genres identical in every number"
audit = open(f'{D}/genre-audit.md', encoding='utf-8').read()
own = re.search(r'helps its own brief in (\d+) of (\d+)', audit); other = re.search(r'moves another genre.s brief in (\d+)', audit)
out['Genre Audit'] = f"helps its own brief in {own.group(1)} of {own.group(2)}, moves another genre’s in {other.group(1)}"
missing = [k for k, v in out.items() if not v]
assert not missing, missing
json.dump(out, open(f'{D}/figures.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
for k, v in out.items(): print(f'{k}: {v}')
