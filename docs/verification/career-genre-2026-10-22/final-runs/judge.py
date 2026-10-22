"""
Brief 22's judge, read from its outputs (final/), never typed: the four area items the judge's measurement holds
(genres.7-measured, L3-R.b, judge.together, advice.F2), restated on brief 22's tested commit as brief 21's judge.py
restated them on its own (`../../genre-banking-2026-10-22/final-runs/judge.py`), each output set beside brief 21's
(`numbers-same.json`, "final"); and the Genre Audit's replacement criterion, Genre Audit-R, a row of its own.

Brief 22 changed what the judge reads on purpose: each work asks its genres as its material states them, and a related
genre counts across one direct link at 0.65 or 0.40. An output that moved is held only where `judge-moved.json` reads
it ("files": the file, why it moved, and that its criterion still holds); one moved with no reading leaves its item
Implemented, Verification Incomplete.

The Genre Audit as written (the owner's genre acceptance brief, 2026-10-16: "helps its own in every genre; leaks into
none") was superseded by the owner in brief 22 with "No unrelated-genre contribution; only documented, bounded transfer
across approved direct relationships." Genre Audit-R is verified only on that criterion measured here: every unrelated
pair moving nothing, every direct pair moving less than the genre itself, every genre helping its own brief.

    python3 docs/verification/career-genre-2026-10-22/final-runs/judge.py

Run from the repository's root after collect22.sh and numbers-same.py. Writes judge-result.json, which criteria.py reads
with brief 22's other results.
"""
import json, os, re

B = 'docs/verification/career-genre-2026-10-22/final-runs'
F = f'{B}/final'
B21F = 'docs/verification/genre-banking-2026-10-22/final-runs/final'
IAV, IVI = 'Implemented And Verified', 'Implemented, Verification Incomplete'
GROUP = 'Brief 22: the judge'
DECISION = 'docs/verification/career-genre-2026-10-22/decision-history.md'

ns = json.load(open(f'{B}/numbers-same.json', encoding='utf-8'))['final']
exits = open(f'{F}/exits.txt', encoding='utf-8').read()
at = re.search(r'^at (\w+)', exits, re.M).group(1)
parts = re.findall(r'^(\S+) exit=(\d+)', exits, re.M)
bad = [p for p, e in parts if e != '0']
MOVED = f'{B}/judge-moved.json'
readings = json.load(open(MOVED, encoding='utf-8')).get('files', {}) if os.path.exists(MOVED) else {}
differ, missing = set(ns['unexplained']), set(ns['missing'])
read = lambda f: bool(readings.get(f, {}).get('why')) and readings[f].get('holds') is True
unread = lambda *fs: [f for f in fs if (f in differ and not read(f)) or f in missing]
moved = lambda *fs: [f for f in fs if f in differ]

rows = []
def row(id, ok, said, files):
    r = {'id': id, 'group': GROUP, 'status': IAV if ok else IVI, 'exercised': said, 'measured': {'commit': at, 'watch': 'judge'},
         'evidence': [{'file': f'{F}/{f}', 'kind': 'measurement'} for f in files] + [{'file': f'{F}/README.md', 'kind': 'review'}, {'file': f'{B}/numbers-same.json', 'kind': 'measurement'}]
         + ([{'file': MOVED, 'kind': 'review'}] if any(f in readings for f in files) else [])}
    if not ok:
        r['missing'] = said
    rows.append(r)

# The audit, read from what it wrote: the old criterion's count and brief 22's.
audit = open(f'{F}/genre-audit.md', encoding='utf-8').read()
own = re.search(r'helps its own brief in (\d+) of (\d+)', audit)
crit = re.search(r'an\s+unrelated\s+genre\s+moves\s+it\s+in\s+(\d+)\s+of\s+(\d+);\s+a\s+genre\s+one\s+direct\s+link\s+away.*?moves\s+it\s+in\s+(\d+)\s+of\s+(\d+),\s+each\s+by\s+less\s+than\s+the\s+genre\s+itself\s+in\s+(\d+)\s+of\s+(\d+),\s+the\s+most\s+(\d+)%', audit, re.S)
old = re.search(r'the\s+next\s+genre\s+over,\s+the\s+old\s+criterion.s\s+own\s+test.*?moves\s+in\s+(\d+)', audit, re.S)
helps = bool(own) and own.group(1) == own.group(2)
unrelated0 = bool(crit) and crit.group(1) == '0'
bounded = bool(crit) and crit.group(5) == crit.group(4) and int(crit.group(7)) < 100
audit_ok = helps and unrelated0 and bounded and not bad
audit_said = (f"tools/genre-audit.ts on brief 22's tested commit, {at} (measure.sh genres-b): every genre helps its own brief in {own.group(1)} of {own.group(2)}; "
              + (f"an unrelated genre moves another's brief in {crit.group(1)} of {crit.group(2)} ordered pairs; a genre one direct link away (a kind and its broad genre) in "
                 f"{crit.group(3)} of {crit.group(4)}, each by less than the genre itself in {crit.group(5)} of {crit.group(4)}, the most {crit.group(7)}% of its own gain"
                 if crit else 'the criterion\'s lines not found in genre-audit.md')
              + (f"; the old criterion's next genre over moves in {old.group(1)}, each a genre and its own kind, reported and not counted" if old else '')
              + (f"; not exit 0: {', '.join(bad)}" if bad else ''))

# Each genre criterion's outputs: the signatures, the identity, the advice baseline, and the audit on the new criterion.
g_files = ['signature.json', 'signature-fresh.json', 'signature-validate.json', 'genre-identity.json', 'ag-baseline.json']
g_unread, g_moved = unread(*g_files), moved(*g_files)
row('genres.7-measured', not g_unread and audit_ok,
    f"The same commands and seeds on brief 22's tested commit, {at} (measure.sh genres-a, genres-b, stage, ag): "
    + (f"{', '.join(f for f in g_files if f not in g_moved) or 'none'} the same as brief 21's in every number"
       + (f"; moved, each read in judge-moved.json: {', '.join(f'{f} ({readings[f]['why']})' for f in g_moved if read(f))}" if any(read(f) for f in g_moved) else '')
       + (f"; moved with no reading: {', '.join(g_unread)}" if g_unread else ''))
    + f". The audit, on the criterion that replaced its first (the owner's brief 22, {DECISION}): {audit_said}",
    g_files + ['genre-audit.md'])

# L3-R's journeys and their verdict, as l3r.json writes it.
l3 = json.load(open(f'{F}/l3r.json', encoding='utf-8'))
v = l3['verdict']
growth = v['c'].get('growth', {})
row('L3-R.b', bool(l3.get('met')) and v['b']['met'] and not bad,
    f"measure.sh journeys-a, journeys-b and l3r on brief 22's tested commit, {at}, seeds bj-0 and bj-1, all four profiles: "
    f"(b) {'met' if v['b']['met'] else 'not met'} on {v['b']['journeys']} journeys, " + ', '.join(f'{k} {n}' for k, n in v['b']['profiles'].items())
    + f"; (c) {'met' if v['c']['met'] else 'not met'}, growth {min(growth.values()):.3f} at least" + f"; L3-R met: {l3.get('met')}"
    + ('' if 'l3r.json' not in differ else "; l3r.json moved from brief 21's, the verdict read from it here")
    + (f"; not exit 0: {', '.join(bad)}" if bad else ''), ['l3r.json'])

# Everything the judge measures together: every part exit 0, every output as brief 21's or moved with its reading, and
# L3-R's verdict brief 21's.
j_moved = sorted(differ | missing)
j_unread = [f for f in j_moved if not read(f)]
l3_21 = json.load(open(f'{B21F}/l3r.json', encoding='utf-8'))
row('judge.together', not bad and not j_unread and bool(l3.get('met')) == bool(l3_21.get('met')),
    f"Every part of measure.sh but the two mutation runs on brief 22's tested commit, {at} ({len(parts)} parts, "
    + (f"not exit 0: {', '.join(bad)}" if bad else 'every one exit 0') + f"): {ns['same']} of {ns['files']} outputs brief 21's in every number"
    + (f"; moved by brief 22's genre weights and related credit, each read in judge-moved.json: {', '.join(f for f in j_moved if read(f))}" if any(read(f) for f in j_moved) else '')
    + (f"; moved with no reading: {', '.join(j_unread)}" if j_unread else '')
    + f"; L3-R's verdict {l3.get('met')}, as brief 21's {l3_21.get('met')}. So every criterion that held holds and those that failed fail as before.",
    ['figures.json', 'exits.txt'])

# F2 as written, beside F2-A10: its line in criteria.txt and the baseline it reads.
f2 = next((l.strip() for l in open(f'{F}/criteria.txt', encoding='utf-8') if l.startswith('F2 as written')), '')
f2_21 = next((l.strip() for l in open(f'{B21F}/criteria.txt', encoding='utf-8') if l.startswith('F2 as written')), None)
row('advice.F2', bool(f2) and f2 == f2_21 and not unread('ag-baseline.json') and not bad,
    f"tools/ag-baseline.ts and tools/ag-criteria.mjs on brief 22's tested commit, {at} (measure.sh ag): {re.sub(r' {2,}', ' ', f2) or 'no F2 line'}"
    + ("; the line brief 21's" if f2 == f2_21 else "; moved from brief 21's") + ('' if 'ag-baseline.json' not in differ else ', ag-baseline.json moved and read in judge-moved.json' if read('ag-baseline.json') else ', ag-baseline.json moved with no reading')
    + ', reported beside F2-A10 and not counted for the advice', ['criteria.txt', 'ag-baseline.json'])

# The Genre Audit's replacement, a criterion of its own: verified only on its own measurement here.
replacement = {
    'id': 'Genre Audit-R', 'replaces': 'Genre Audit (as written: "helps its own in every genre; leaks into none")',
    'criterion': 'Every genre in the code (149): knowing it helps its own work; no unrelated-genre contribution; only documented, bounded transfer across approved direct relationships (the owner\'s brief 22, 2026-10-22)',
    'entry': 'npx vite-node tools/genre-audit.ts -- --out <file>',
    'reads': 'The judge (`systems/evaluation.ts`, `systems/piece.ts`) over every genre\'s first brief, and `relevantGenre` with `relatedness` (`systems/engagement.ts`): a genre known at 100 against 0, for an even actor, everything prepared',
    'threshold': 'Its own brief helped in every genre; an unrelated genre moves another\'s brief in 0 pairs; a genre one direct link away moves it by less than the genre itself in every pair',
    'changes': 'Nothing: a measurement',
    'systems': 'Every judged piece that reads a work\'s genres: briefs, nights, auditions, self-tapes, callbacks, work days, casting\'s fit, class scenes',
    'sees': 'What It Asks on a part, the guide\'s Genres entry (Related Genres: 65% and 40%, one step only)',
    'failure': audit_said,
    'implementation': 'systems/engagement.ts (`relatedness`, `relevantGenre`), content/engagement.ts (`ENGAGEMENT.related`), tools/genre-audit.ts',
    'evidence': [{'file': f'{F}/genre-audit.md', 'title': 'the criterion and the direct pairs'}, {'file': DECISION, 'title': 'the old criterion, brief 21\'s question and the owner\'s authorization'},
                 {'file': 'docs/verification/career-genre-2026-10-22/comparisons.md', 'title': 'the coefficients measured'}, {'file': 'tests/b22-transfer.test.ts'}, {'file': 'tests/b22-comparisons.test.ts'}],
    'status': IAV if audit_ok else IVI, 'measured': {'commit': at, 'watch': 'judge'},
}
if not audit_ok:
    replacement['missing'] = audit_said

json.dump({'rows': rows, 'replacements': [replacement]}, open(f'{B}/judge-result.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
for r in rows + [replacement]:
    print(r['id'], r['status'], '|', (r.get('exercised') or r.get('failure'))[:260])
