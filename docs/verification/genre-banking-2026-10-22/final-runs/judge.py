"""
Brief 21's judge, read from its outputs (final/), never typed: the four area items the judge's measurement holds
(genres.7-measured, L3-R.b, judge.together, advice.F2), which criteria.py carried from brief 19's commit only while every
judge output was the same in every number. Brief 21 changed what the judge reads (a night's interpretation reads the
genre; a taped brief's practice shared by weight; the Seagull's kinds), so each is restated here on brief 21's tested
commit from what its own measurement wrote, Implemented And Verified only where that bears it out, and Implemented,
Verification Incomplete with what it showed otherwise. Writes judge-result.json, which criteria.py reads with brief 21's
other results.

    python3 docs/verification/genre-banking-2026-10-22/final-runs/judge.py

Run from the repository's root after collect21.sh and numbers-same.py.
"""
import json, re

B = 'docs/verification/genre-banking-2026-10-22/final-runs'
F = f'{B}/final'
B19F = 'docs/verification/career-2026-10-20/final-runs/final'
IAV, IVI = 'Implemented And Verified', 'Implemented, Verification Incomplete'
GROUP = 'Brief 21: the judge'

ns = json.load(open(f'{B}/numbers-same.json', encoding='utf-8'))['final']
exits = open(f'{F}/exits.txt', encoding='utf-8').read()
at = re.search(r'^at (\w+)', exits, re.M).group(1)
parts = re.findall(r'^(\S+) exit=(\d+)', exits, re.M)
bad = [p for p, e in parts if e != '0']
differ, missing = set(ns['unexplained']), set(ns['missing'])
same = lambda *fs: [f for f in fs if f in differ or f in missing]
text = lambda p: re.sub(r'\b[0-9a-f]{8,40}\b', '<commit>', open(p, encoding='utf-8').read())

rows = []
def row(id, ok, said, files):
    r = {'id': id, 'group': GROUP, 'status': IAV if ok else IVI, 'exercised': said, 'measured': {'commit': at, 'watch': 'judge'},
         'evidence': [{'file': f'{F}/{f}', 'kind': 'measurement'} for f in files] + [{'file': f'{F}/README.md', 'kind': 'review'}, {'file': f'{B}/numbers-same.json', 'kind': 'measurement'}]}
    if not ok:
        r['missing'] = said
    rows.append(r)

# Each genre criterion's outputs: the signatures, the identity, the advice baseline and the audit's table.
g_files = ['signature.json', 'signature-fresh.json', 'signature-validate.json', 'genre-identity.json', 'ag-baseline.json']
g_moved = same(*g_files)
g_audit = text(f'{F}/genre-audit.md') == text(f'{B19F}/genre-audit.md')
row('genres.7-measured', not g_moved and g_audit and not bad,
    f"The same commands and seeds on brief 21's tested commit, {at} (measure.sh genres-a, genres-b, stage, ag): "
    + (f"{', '.join(g_files)} the same as brief 19's in every number, and genre-audit.md word for word, so each genre criterion holds where it held and fails where it failed"
       if not g_moved and g_audit else f"moved from brief 19's: {', '.join(g_moved + ([] if g_audit else ['genre-audit.md']))}")
    + (f"; not exit 0: {', '.join(bad)}" if bad else ''), g_files + ['genre-audit.md'])

# L3-R's journeys and their verdict, as l3r.json writes it.
l3 = json.load(open(f'{F}/l3r.json', encoding='utf-8'))
v = l3['verdict']
growth = v['c'].get('growth', {})
row('L3-R.b', bool(l3.get('met')) and v['b']['met'] and not bad,
    f"measure.sh journeys-a, journeys-b and l3r on brief 21's tested commit, {at}, seeds bj-0 and bj-1, all four profiles: "
    f"(b) {'met' if v['b']['met'] else 'not met'} on {v['b']['journeys']} journeys, " + ', '.join(f'{k} {n}' for k, n in v['b']['profiles'].items())
    + f"; (c) {'met' if v['c']['met'] else 'not met'}, growth {min(growth.values()):.3f} at least" + f"; L3-R met: {l3.get('met')}"
    + ('' if 'l3r.json' not in differ else "; l3r.json moved from brief 19's (taped briefs' practice shared by weight), the verdict read from it here")
    + (f"; not exit 0: {', '.join(bad)}" if bad else ''), ['l3r.json'])

# Everything the judge measures together: every part exit 0, every output as brief 19's but those brief 21's practice by
# weight reaches (the journeys' takes and their traces, which L3-R reads above), and L3-R's verdict brief 19's.
j_moved = sorted(differ | missing)
practice = [f for f in j_moved if re.match(r'^(journey|l3-trace)-.*\.json$|^l3r\.json$', f)]
other = [f for f in j_moved if f not in practice]
l3_19 = json.load(open(f'{B19F}/l3r.json', encoding='utf-8'))
row('judge.together', not bad and not other and bool(l3.get('met')) == bool(l3_19.get('met')),
    f"Every part of measure.sh but the two mutation runs on brief 21's tested commit, {at} ({len(parts)} parts, "
    + (f"not exit 0: {', '.join(bad)}" if bad else 'every one exit 0') + f"): {ns['same']} of {ns['files']} outputs brief 19's in every number"
    + (f"; moved, by a taped brief's practice shared by weight (a journey's takes, their traces): {', '.join(practice)}, and L3-R's verdict as brief 19's ({l3.get('met')})" if practice else '')
    + (f"; moved otherwise, unread: {', '.join(other)}" if other else '') + '. So every criterion that held holds and those that failed fail as before.',
    ['figures.json', 'exits.txt'])

# F2 as written, beside F2-A10: its line in criteria.txt and the baseline it reads.
f2 = next((l.strip() for l in open(f'{F}/criteria.txt', encoding='utf-8') if l.startswith('F2 as written')), '')
f2_19 = next((l.strip() for l in open(f'{B19F}/criteria.txt', encoding='utf-8') if l.startswith('F2 as written')), None)
row('advice.F2', bool(f2) and f2 == f2_19 and not same('ag-baseline.json') and not bad,
    f"tools/ag-baseline.ts and tools/ag-criteria.mjs on brief 21's tested commit, {at} (measure.sh ag): {re.sub(r' {2,}', ' ', f2) or 'no F2 line'}"
    + ("; the line and ag-baseline.json brief 19's" if f2 == f2_19 and not same('ag-baseline.json') else "; moved from brief 19's")
    + ', reported beside F2-A10 and not counted for the advice', ['criteria.txt', 'ag-baseline.json'])

json.dump({'rows': rows}, open(f'{B}/judge-result.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
for r in rows:
    print(r['id'], r['status'], '|', r['exercised'][:240])
