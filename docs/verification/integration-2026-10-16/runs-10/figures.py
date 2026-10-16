"""Brief 10's final runs, read from their outputs into figures.json (never typed), for criteria.py.

Brief 09's (runs-09/figures.py) with three changes: the 24 lives ran a life at a time in two lanes
(`tools/lives.ts -- --why`, which plays the same life the default loop does), and lives.jsonl is their lines in the
default loop's order; F2-A's 40 cases are read from F2-A10's harness, which ran adv-0 to adv-9 as tuning cases and adv-10
to adv-39 in the held-out set (decisions-2026-10-16/advice/final/), its `pass` F2-A's own; and the gate's commit is read
from gate.txt, not written here, and INT-gate is written only once gate.txt is there.

Usage, from the repository's root: python3 docs/verification/integration-2026-10-16/runs-10/figures.py
"""
import glob, json, os, re
D = 'docs/verification/integration-2026-10-16/runs-10'
ADV = 'docs/verification/decisions-2026-10-16/advice/final'
out = {}
acc = {}
for w in ('1440', '390'):
    tail = [l for l in open(f'{D}/acceptance/{w}.log', encoding='utf-8').read().splitlines() if 'passed' in l and 'failed' in l][-1]
    acc[w] = tail.strip()
out['INT-navigation'] = f"the built app at 1440: {acc['1440']}; at 390: {acc['390']}"
skipped = all(re.search(r'\b0 skipped\b', v) for v in acc.values())
out['INT-skipped'] = f"{'no step skipped at either width' if skipped else 'a step skipped'}: {acc['1440']} / {acc['390']}"
saves = [l for l in open(f'{D}/saves/exits.txt', encoding='utf-8').read().splitlines() if 'exit=' in l]
saves_ok = sum(1 for l in saves if l.endswith('exit=0'))
lives = [json.loads(l) for l in open(f'{D}/lives.jsonl', encoding='utf-8') if l.strip().startswith('{')]
grad = sum(1 for l in lives if l['standing'] == 'graduated')
dismissed = [l['profile'] for l in lives if l['standing'] != 'graduated']
lb = sum(l.get('breaches', 0) for l in lives); lu = sum(l.get('unbalanced', 0) for l in lives)
errs = sum(1 for l in lives if l.get('error'))
work = {os.path.basename(f)[9:-5]: json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(f'{D}/workload-*.json'))}
good = sum(1 for w in work.values() if w['standing'] == 'good')
plans = {os.path.basename(f)[5:-5]: json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(f'{D}/plan-*.json'))}
at100 = sum(1 for p in plans.values() if p['payoff'] and all(t['overall'] == 100 for t in p['payoff']))
v = json.load(open(f'{D}/variety-v-0.json', encoding='utf-8'))
fr = json.load(open(f'{D}/freshness.json', encoding='utf-8'))['results']
repeat = [r for r in fr if r['profile'] != 'mastered' and (r['takeRepeatShare'] or r['sceneRepeatShare'])]
out['INT-long-runs'] = (f"lives: {len(lives)}, {grad} graduated, {len(dismissed)} dismissed ({', '.join(sorted(set(dismissed)))}), breaches {lb}, unbalanced {lu}, errors {errs}; "
                        f"workload: {good} of {len(work)} in good standing (london-lives-0-neglect: {work['london-lives-0-neglect']['standing']}), breaches {sum(w['breaches'] for w in work.values())}; "
                        f"mastery plans: {at100} of {len(plans)} at 100 on every payoff tape; "
                        f"variety: {v['standing']}, breaches {v['breaches']}, {v['recommendations']['distinctTops']} distinct top recommendations over {v['recommendations']['weeks']} weeks, none at full ({v['recommendations']['recommendedAtFull']}), the longest unresolved {v['recommendations']['longestUnresolved']} weeks, the same practice situation {v['practice']['longestSameSituationInARow']} in a row at most; "
                        f"freshness: {len(fr)} runs, {len(repeat)} with a take or scene repeated outside the mastered profile; scenario saves {saves_ok} of {len(saves)}")
out['MA5'] = '; '.join(f"{k}: mastered {p['masteredOn']}, payoff {[t['overall'] for t in p['payoff']]}" for k, p in plans.items())
cases = [c for f in sorted(glob.glob(f'{ADV}/adv-0-9.json') + glob.glob(f'{ADV}/held-out-adv-*.json')) for c in json.load(open(f, encoding='utf-8'))['cases']]
f2a = sorted((c for c in cases if re.fullmatch(r'adv-\d+', c['seed'])), key=lambda c: int(c['seed'][4:]))
assert [c['seed'] for c in f2a] == [f'adv-{i}' for i in range(40)], [c['seed'] for c in f2a]
out['F2-A'] = f"{sum(1 for c in f2a if c['pass'])} of {len(f2a)} advice cases: the first named input the best to raise"
# The gate runs on the commit that holds every other figure here, and its own figure is folded in after (as brief 09's
# was): until gate.txt is there, INT-gate isn't written, and criteria.py leaves its row as it was.
if os.path.exists(f'{D}/gate.txt'):
    gate = open(f'{D}/gate.txt', encoding='utf-8').read()
    files = re.search(r'Test Files\s+(\d+) passed \((\d+)\)', gate); tests = re.search(r'Tests\s+(\d+) passed \((\d+)\)', gate)
    holds = 'The completion matrix holds' in gate
    summary = [l for l in gate.splitlines() if re.match(r'\s+(Test Files|Tests)\s', l)]
    skips = 'none skipped' if not any('skipped' in l for l in summary) else 'some skipped'
    exit_line = [l for l in gate.splitlines() if l.startswith('exit=')][-1]
    at = re.search(r'^at (\w+)', gate, re.M).group(1)
    out['INT-gate'] = f"npm run gate on {at}: {files.group(1)} of {files.group(2)} files, {tests.group(1)} of {tests.group(2)} tests passed, {skips}, {exit_line}{', the last check, the completion matrix, holding' if holds else ''}"
json.dump(out, open(f'{D}/figures.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
for k, x in out.items(): print(f'{k}: {x}')
