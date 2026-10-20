"""
Each claim the coordinator's tests hold, run with it taken out (CLAUDE.md, the house standard: "Mutation-test every claim a
test protects"). One mutation at a time to a copy of the source as it stands, the test files that hold the claim run,
and the source put back; the result is whether any test failed, with the tests that did. A mutation no test fails is a
claim nothing holds, and is said so.

    python3 docs/verification/continuity-2026-10-20/coordinator/mutate17.py > docs/verification/continuity-2026-10-20/coordinator/mutations.txt
"""
import shutil, subprocess, sys, tempfile, os

M = [
    # The incident fix (classmates.ts, index.ts), held by tests/continuity-incidents.test.ts.
    ('an apology owed again for misses it covered', 'src/engine/systems/classmates.ts',
     "r.status === 'missedByThem' && r.apologized === undefined && r.at >= since", "r.status === 'missedByThem' && r.at >= since", ['tests/continuity-incidents.test.ts']),
    ('an apology that marks nothing it covers', 'src/engine/systems/classmates.ts',
     'if (m.covers) for (const a of cw.assignments)', 'if (false) for (const a of cw.assignments)', ['tests/continuity-incidents.test.ts']),
    ('a late apology said as if it were last week', 'src/engine/systems/classmates.ts',
     "const late = gap < 28 ? '' : {", "const late = gap < 99999 ? '' : {", ['tests/continuity-incidents.test.ts']),
    ('what a classmate asked, not counted on them', 'src/engine/systems/classmates.ts',
     '(p.asked ??= {})[kind] = (p.asked[kind] ?? 0) + 1;', '(p.asked ??= {});', ['tests/continuity-incidents.test.ts']),
    ('a save’s count read as exact', 'src/engine/systems/classmates.ts',
     'known: p.countedSince === undefined', 'known: true', ['tests/continuity-incidents.test.ts']),
    ('every classmate asking the same way', 'src/engine/systems/classmates.ts',
     "export const wayOf = (mate: Classmate, kind: string, n: number): number => hash(`${mate.name}:${kind}`) % n;",
     'export const wayOf = (mate: Classmate, kind: string, n: number): number => 0 * n;', ['tests/continuity-incidents.test.ts']),
    ('a save from before: a miss older than all it remembers left owed', 'src/engine/index.ts',
     'if (full && from !== undefined) for (const r of misses) if (r.at < from) { r.apologized = from; assumed += 1; }', '', ['tests/continuity-incidents.test.ts']),
    ('a save from before: a miss before a kept apology left owed', 'src/engine/index.ts',
     'for (const at of apologies) for (const r of misses) if (r.apologized === undefined && r.at < at) { r.apologized = at; marked += 1; }', '', ['tests/continuity-incidents.test.ts']),
    # The memory and the words from the final runs (feedback.ts), held by tests/feedback-voices.test.ts.
    ('a whole message said before, by another course, not remembered', 'src/engine/systems/feedback.ts',
     'const said = new Set([...recent, ...heard.all]);', 'const said = new Set([...recent]);', ['tests/feedback-voices.test.ts']),
    ('a course’s own last five openings not remembered', 'src/engine/systems/feedback.ts',
     '(ownOpenings.has(openingOf(o)) ? 1e9 : 0)', '0', ['tests/feedback-voices.test.ts']),
    ('a course’s own openings remembered for ever', 'src/engine/systems/feedback.ts',
     'heard.own.slice(-5).map(openingOf)', 'heard.own.map(openingOf)', ['tests/feedback-voices.test.ts']),
    ('a note put right today said by its date', 'src/engine/systems/feedback.ts',
     'if (!dated && f.today && f.before!.taken === f.today) switch', 'if (false) switch', ['tests/feedback-voices.test.ts']),
    # The first view of the Coursework tab, held by tests/editorial17-coordinator.test.ts.
    ('the first week kept first once it’s done', 'src/ui/components/CourseworkPane.tsx',
     'const weekDone = ORIENTATION.every(', 'const weekDone = false && ORIENTATION.every(', ['tests/editorial17-coordinator.test.ts']),
]

def run(tests):
    r = subprocess.run(['npx', 'vitest', 'run', *tests], capture_output=True, text=True, timeout=1200)
    out = r.stdout + r.stderr
    return r.returncode, [l.strip()[:170] for l in out.splitlines() if l.strip().startswith('×')]

code, fails = run(sorted({t for m in M for t in m[4]}))
print(f'unmutated: exit={code}, {len(fails)} failed')
if code != 0: sys.exit(2)
held = 0
for name, path, a, b, tests in M:
    keep = tempfile.mktemp()
    shutil.copy(path, keep)
    try:
        src = open(path, encoding='utf-8').read()
        n = src.count(a)
        if n < 1:
            print(f'{name}: NOT APPLIED (found {n} times)'); continue
        open(path, 'w', encoding='utf-8').write(src.replace(a, b, 1))
        code, fails = run(tests)
        held += bool(fails)
        print(f"{name}: {'held, ' + str(len(fails)) + ' failed' if fails else 'NOT HELD: every test passed'}")
        for l in fails: print(f'    {l}')
    finally:
        shutil.copy(keep, path); os.remove(keep)
print(f'{held} of {len(M)} mutations held by a failing test; the sources put back')
