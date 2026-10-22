"""
The advice's rows on brief 22's commit, read from the runs, never typed: brief 21's close.py
(`../../../genre-banking-2026-10-22/final-runs/advice/close.py`, itself brief 20's, 19's, 17's, 16's, 15's and 14's) read
from brief 22's folders. F2-A10 (f) and (h) on the fresh set, adv-v-0 to 119, run again here; (c) and the held-out set on the regression
run, brief 10's held-out set and F2-A's thirty, as brief 11 measured them. Writes ../final-result.json, which criteria.py
reads after brief 21's results, so its rows replace theirs.

    python3 docs/verification/career-genre-2026-10-22/final-runs/advice/close.py

Run from the repository's root once runs22.sh's ADVF and ADVR lanes are done and gathered (collect22.sh). A row whose
figures fall short stays open with them. Each file must record the commit its lanes ran on and a clean tree.
"""
import glob, json, re
B = 'docs/verification/career-genre-2026-10-22/final-runs'
A = f'{B}/advice'
IAV, IVI = 'Implemented And Verified', 'Implemented, Verification Incomplete'
GROUP = 'Brief 10 Area: advice'
BANDS = ['beginner', 'developing', 'advanced', 'nearMastery']
STAGES = ['firstWeek', 'midTerm', 'later']

exits = {}
for f in glob.glob(f'{B}/runs/exits-ADV*.txt'):
    for line in open(f, encoding='utf-8'):
        m = re.match(r'^(\S+) exit=(\d+) ', line)
        if m: exits[m.group(1)] = int(m.group(2))
at = {re.search(r'^at (\w+)', open(f, encoding='utf-8').read(), re.M).group(1) for f in glob.glob(f'{B}/runs/exits-ADV*.txt')}
assert len(at) == 1, at
tested = at.pop()

def files(pattern):
    out = []
    for f in sorted(glob.glob(f'{A}/{pattern}')):
        d = json.load(open(f, encoding='utf-8'))
        out.append({'file': f, 'commit': d.get('commit'), 'clean': d.get('clean'), 'cases': len(d.get('cases', []))})
    return out

fresh_files, reg_files = files('fresh-adv-v-*.json'), files('f2a-adv-*.json') + files('regression-adv-h-*.json')
fresh = json.load(open(f'{A}/fresh-summary.json', encoding='utf-8'))['groups']
reg = json.load(open(f'{A}/regression-summary.json', encoding='utf-8'))['groups']
ran = lambda fs, n: sum(x['cases'] for x in fs) == n and all(str(x['commit']).startswith(tested) and x['clean'] for x in fs)
ok_exits = lambda prefix: [k for k, v in exits.items() if k.startswith(prefix)] and all(v == 0 for k, v in exits.items() if k.startswith(prefix))

def evidence(fs, summary):
    return [{'file': summary, 'kind': 'measurement'}, {'file': f'{B}/runs/exits-ADVF.txt' if 'fresh' in summary else f'{B}/runs/exits-ADVR.txt', 'kind': 'measurement'}] + [{'file': x['file'], 'kind': 'measurement'} for x in fs]

rows, notes = [], {}
# (f): F1, F2, F4, F5 and F6 on 120 of 120; F3 on 96 of 120, 21 of 30 in each band and 28 of 40 in each stage.
g = fresh['fresh']
f12 = g['f12']
f_need = {k: f12[k] == g['n'] == 120 for k in ('F1', 'F2', 'F4', 'F5', 'F6')}
f3_band = {b: fresh[f'fresh F2-A10 {b}']['f12']['F3'] for b in BANDS}
f3_stage = {s: fresh[f'fresh F2-A10 {s}']['f12']['F3'] for s in STAGES}
f_ok = all(f_need.values()) and f12['F3'] >= 96 and all(v >= 21 for v in f3_band.values()) and all(v >= 28 for v in f3_stage.values()) and ran(fresh_files, 120) and ok_exits('fresh-')
f_said = (f"The fresh set, adv-v-0 to 119, run again on brief 22's commit {tested}, brief 12 having run it once unseen; every batch exit 0 and its tree clean (runs22.sh ADVF): "
          f"F1 {f12['F1']}, F2 {f12['F2']}, F4 {f12['F4']}, F5 {f12['F5']} and F6 {f12['F6']} of {g['n']} (120 asked); F3 {f12['F3']} of {g['n']} (96 asked), "
          f"by band {', '.join(f'{b} {v}' for b, v in f3_band.items())} of 30 (21 asked), by stage {', '.join(f'{s} {v}' for s, v in f3_stage.items())} of 40 (28 asked); "
          f"read as prepared {f12['readAsPrepared']}; the verdicts {f12['verdicts']}, on the cold take {f12['coldVerdicts']}. "
          f"Reported beside them as written, deciding nothing: (e) {g['e']['within']} of {g['e']['named']}, (f)'s ladder falls {g['f']['ladderFalls']} of {g['f']['nearMastery']} near mastery.")
rows.append({'id': 'advice.F2A10-f', 'group': GROUP, 'disposition': 'closed' if f_ok else 'remaining', 'status': IAV if f_ok else IVI,
             'exercised': f_said, 'evidence': evidence(fresh_files, f'{A}/fresh-summary.json'), 'measured': {'commit': tested, 'watch': 'engine'},
             **({} if f_ok else {'missing': f'The fresh run short of what closes the row (advice-criteria.md): {f_said}'})})
# (h): H1 on 120 of 120; H2 the first-named kept where it stayed and changed wherever another led; H3 and H4 every rise
# attributed and explained; H5 and H6 stale reads 0 and unexplained changes 0, over every read.
h12 = g['h12']
fo = h12['followed']
h_ok = (h12['H1'] == 120 and all(h12[k] == 120 for k in ('H2', 'H3', 'H4', 'H5', 'H6')) and fo['changedWhereLed'] == fo['leads']
        and fo['roseAttributed'] == fo['rose'] and fo['roseExplained'] == fo['rose'] and h12['staleReads'] == 0 and h12['unexplained'] == 0
        and ran(fresh_files, 120) and ok_exits('fresh-'))
h_said = (f"The fresh set on {tested}: H1 to H6 {', '.join(str(h12[k]) for k in ('H1', 'H2', 'H3', 'H4', 'H5', 'H6'))} of {g['n']} (120 asked); "
          f"followed, the first-named stayed on {fo['stayed']} and another led on {fo['leads']}, changed on {fo['changedWhereLed']}; rose {fo['rose']}, attributed {fo['roseAttributed']}, explained {fo['roseExplained']}; "
          f"{h12['reads']} reads with {h12['staleReads']} stale, {h12['changes']} forecast changes ({h12['rises']} rises) with {h12['unexplained']} unexplained. "
          f"Reported beside them as written, deciding nothing: (h) fell on {g['h']['fell']} of {g['h']['cases']}, its own level's part on {g['h']['ownFell']}.")
rows.append({'id': 'advice.F2A10-h', 'group': GROUP, 'disposition': 'closed' if h_ok else 'remaining', 'status': IAV if h_ok else IVI,
             'exercised': h_said, 'evidence': evidence(fresh_files, f'{A}/fresh-summary.json'), 'measured': {'commit': tested, 'watch': 'engine'},
             **({} if h_ok else {'missing': f'The fresh run short of what closes the row (advice-criteria.md): {h_said}'})})
# (c) on the regression run: the advised input's realized gain at or above the median of the others' on 95% of the
# held-out F2-A10 cases, and its mean 1.5 times a random input's, as brief 10 set it and brief 11 measured it. The run's
# files hold 160 cases: F2-A's forty (its first ten tuning) and the 120 held out.
rc, ra = reg['regression F2-A10']['c'], reg.get('regression F2-A', {}).get('c')
strata = {s: reg[f'regression F2-A10 {s}']['c']['ratio'] for s in BANDS + STAGES if f'regression F2-A10 {s}' in reg}
c_ok = rc['atOrAboveMedian'] >= 0.95 * rc['named'] and rc['ratio'] >= 1.5 and ran(reg_files, 160) and ok_exits('regression-') and ok_exits('f2a-')
c_said = (f"The held-out set, regression coverage from brief 12, on brief 22's commit {tested} (runs22.sh ADVR, every batch exit 0, its tree clean): the advised input's realized gain at or above "
          f"the median of the others' on {rc['atOrAboveMedian']} of {rc['named']} (95% asked), its mean {rc['firstMean']} against {rc['randomMean']} for an input chosen at random, {rc['ratio']} times (1.5 asked); "
          f"by stratum {', '.join(f'{s} {v}' for s, v in strata.items())}" + (f"; F2-A's 30 held out, {ra['ratio']}" if ra else '') + '.')
rows.append({'id': 'advice.F2A10-c', 'group': GROUP, 'disposition': 'closed' if c_ok else 'remaining', 'status': IAV if c_ok else IVI,
             'exercised': c_said, 'evidence': evidence(reg_files, f'{A}/regression-summary.json'), 'measured': {'commit': tested, 'watch': 'engine'},
             **({} if c_ok else {'missing': f'The regression run short of (c): {c_said}'})})
held_ok = ran(reg_files, 160) and ok_exits('regression-') and ok_exits('f2a-') and all(f'regression F2-A10 {s}' in reg for s in BANDS + STAGES)
missing_strata = [s for s in BANDS + STAGES if f'regression F2-A10 {s}' not in reg]
held_said = (f"Brief 10's held-out set, adv-h-0 to 119, and F2-A's adv-10 to 39, run on brief 22's commit {tested} in {len(reg_files)} batches, each exit 0, its commit and a clean tree written in each file, "
             f"then summarized as regression coverage, the tuning cases apart, each band and stage reported" + (f" but {', '.join(missing_strata)}" if missing_strata else '') +
             ". From brief 12 it isn't unseen validation: its results informed the clarified (f) and (h), and the fresh set took its place.")
rows.append({'id': 'advice.heldout', 'group': GROUP, 'disposition': 'closed' if held_ok else 'remaining', 'status': IAV if held_ok else IVI,
             'exercised': held_said, 'evidence': evidence(reg_files, f'{A}/regression-summary.json'), 'measured': {'commit': tested, 'watch': 'engine'},
             **({} if held_ok else {'missing': f'The regression run incomplete: {held_said}'})})
json.dump({'area': 'final', 'on': '2026-10-22', 'tested': tested, 'rows': rows}, open(f'{B}/final-result.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
for r in rows: print(f"{r['id']}: {r['status']}: {r['exercised'][:300]}")
