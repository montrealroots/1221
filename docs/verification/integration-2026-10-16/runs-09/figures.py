"""Brief 09's final runs, read from their outputs into figures.json (never typed), for criteria.py.

Usage, from the repository's root: python3 docs/verification/integration-2026-10-16/runs-09/figures.py
"""
import glob, json, os, re
D = 'docs/verification/integration-2026-10-16/runs-09'
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
work = {os.path.basename(f)[9:-5]: json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(f'{D}/workload-*.json'))}
good = sum(1 for w in work.values() if w['standing'] == 'good')
plans = {os.path.basename(f)[5:-5]: json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(f'{D}/plan-*.json'))}
at100 = sum(1 for p in plans.values() if p['payoff'] and all(t['overall'] == 100 for t in p['payoff']))
v = json.load(open(f'{D}/variety-v-0.json', encoding='utf-8'))
fr = json.load(open(f'{D}/freshness.json', encoding='utf-8'))['results']
repeat = [r for r in fr if r['profile'] != 'mastered' and (r['takeRepeatShare'] or r['sceneRepeatShare'])]
out['INT-long-runs'] = (f"lives: {len(lives)}, {grad} graduated, {len(dismissed)} dismissed ({', '.join(sorted(set(dismissed)))}), breaches {lb}, unbalanced {lu}; "
                        f"workload: {good} of {len(work)} in good standing (london-lives-0-neglect: {work['london-lives-0-neglect']['standing']}), breaches {sum(w['breaches'] for w in work.values())}; "
                        f"mastery plans: {at100} of {len(plans)} at 100 on every payoff tape; "
                        f"variety: {v['standing']}, breaches {v['breaches']}, {v['recommendations']['distinctTops']} distinct top recommendations over {v['recommendations']['weeks']} weeks, none at full ({v['recommendations']['recommendedAtFull']}), the longest unresolved {v['recommendations']['longestUnresolved']} weeks, the same practice situation {v['practice']['longestSameSituationInARow']} in a row at most; "
                        f"freshness: {len(fr)} runs, {len(repeat)} with a take or scene repeated outside the mastered profile; scenario saves {saves_ok} of {len(saves)}")
out['MA5'] = '; '.join(f"{k}: mastered {p['masteredOn']}, payoff {[t['overall'] for t in p['payoff']]}" for k, p in plans.items())
adv = open(f'{D}/advice.txt', encoding='utf-8').read().splitlines()
passes = sum(1 for l in adv if l.startswith('adv-') and l.endswith('PASS')); cases = sum(1 for l in adv if l.startswith('adv-'))
out['F2-A'] = f"{passes} of {cases} advice cases: the first named input the best to raise"
gate = open('docs/verification/integration-2026-10-16/runs-09/gate.txt', encoding='utf-8').read()
files = re.search(r'Test Files\s+(\d+) passed \((\d+)\)', gate); tests = re.search(r'Tests\s+(\d+) passed \((\d+)\)', gate)
holds = 'The completion matrix holds' in gate
summary = [l for l in gate.splitlines() if re.match(r'\s+(Test Files|Tests)\s', l)]
skips = 'none skipped' if not any('skipped' in l for l in summary) else 'some skipped'
exit_line = [l for l in gate.splitlines() if l.startswith('exit=')][-1]
out['INT-gate'] = f"npm run gate on 7c1198a2: {files.group(1)} of {files.group(2)} files, {tests.group(1)} of {tests.group(2)} tests passed, {skips}, {exit_line}{', the last check, the completion matrix, holding' if holds else ''}"
json.dump(out, open(f'{D}/figures.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
for k, x in out.items(): print(f'{k}: {x}')
