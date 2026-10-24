"""Brief 22's final runs played again on brief 26's finished source (2026-10-24, M12), set beside the same runs as
committed at the sweep's starting point (`main` at b46ee301, brief 24's replay), never typed: brief 24's
`../../ui-polish-2026-10-23/final-runs/compare.py`, its result written here. Brief 26 changed three things in the game
(creation's Genres step reading the career projects' genres as loved, a closed card sending its credit back and net
worth counting a credit, the server guard's reported size) and nothing a final run's number should read, so every number
a run writes should be the one it wrote before; a difference is listed, file by file, for the README to read.
The numbers are compared by brief 22's own rules (`../../career-genre-2026-10-22/final-runs/numbers-same.py`, run here
with its "before" set to the committed runs and its result written here, not over its own): every number, boolean, key,
list length and id-like string, the words a player reads aside, the run's own record (commit, clean tree, seconds)
explained. The text outputs (logs, walks' reports) are compared byte for byte.
    python3 docs/verification/sweep-2026-10-24/final-runs/compare.py BEFORE
BEFORE is the folder holding `docs/verification/career-genre-2026-10-22/final-runs` as committed before the runs were
gathered (`git archive b46ee301 docs/verification/career-genre-2026-10-22/final-runs | tar -x -C BEFORE`).
"""
import filecmp, json, os, sys

R = 'docs/verification/career-genre-2026-10-22/final-runs'
BEFORE = os.path.join(sys.argv[1], R)
HERE = 'docs/verification/sweep-2026-10-24/final-runs'
src = open(f'{R}/numbers-same.py', encoding='utf-8').read()
for old, new in [
    ("B21 = 'docs/verification/genre-banking-2026-10-22/final-runs'", f"B21 = {BEFORE!r}"),
    ("open(f'{B22}/numbers-same.json', 'w', encoding='utf-8')", f"open({HERE + '/numbers-same-22.json'!r}, 'w', encoding='utf-8')"),
    ('(against brief 21)', '(against the committed runs)'),
    ('sys.exit(1 if failed else 0)', ''),
    # The run's own record where brief 20's journeys and the app walks keep it: a fork's seconds, when a walk ran, how
    # long a save took to open.
    ("|^\\.parts\\[\\d+\\]\\.secs$'", "|^\\.parts\\[\\d+\\]\\.secs$|\\.forks\\[\\d+\\]\\.secs$|^\\.at$|^\\.saves\\[\\d+\\]\\.ms$'"),
    # Brief 20's journeys and the app walks' reports as well, which brief 22's comparer leaves to its README.
    ("for d in ('final', 'runs', 'advice', 'journeys-final', 'interface-final', 'journeys14-final'):",
     "for d in ('final', 'runs', 'advice', 'journeys-final', 'interface-final', 'journeys14-final', 'b20-journeys', 'app', 'app/walk', 'app/older', 'app/b21', 'app/b22'):"),
]:
    assert old in src, old
    src = src.replace(old, new)
exec(compile(src, f'{R}/numbers-same.py', 'exec'), {'__name__': '__main__'})

# The text outputs, byte for byte: every file that isn't JSON, in every folder the runs write.
text = {'same': 0, 'differ': [], 'missing': []}
for root, _, names in os.walk(BEFORE):
    for n in sorted(names):
        if n.endswith(('.json', '.jsonl', '.py', '.sh', '.before')):
            continue
        b = os.path.join(root, n)
        a = os.path.join(R, os.path.relpath(b, BEFORE))
        if not os.path.exists(a): text['missing'].append(os.path.relpath(a, R)); continue
        if filecmp.cmp(a, b, shallow=False): text['same'] += 1
        else: text['differ'].append(os.path.relpath(a, R))
json.dump(text, open(f'{HERE}/text-same-22.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(f"text: {text['same']} the same byte for byte; {len(text['differ'])} differ; {len(text['missing'])} missing")
for f in text['differ'][:80]: print(f'  {f}')
