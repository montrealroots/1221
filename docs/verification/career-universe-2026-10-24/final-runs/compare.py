"""Brief 22's final runs played again on brief 27's finished source (2026-10-25, F), set beside the same runs as
committed at brief 27's starting point (`main` at d6eba5d5, brief 26's close), never typed: brief 26's
`../../sweep-2026-10-24/final-runs/compare.py`, its result written here. Unlike brief 26, brief 27 changed what the runs
read on purpose (the career's slate, its lifecycle, the awards and the ceremony, the record's bound), so a difference
here is listed for the README to read against what brief 27 built, not failed. The judge's outputs, which brief 27
measured again in its own folder (`final/`), are set beside brief 22's (`../../career-genre-2026-10-22/final-runs/final/`,
the judge's last measurement, on 16b50e07) the same way.

The numbers are compared by brief 22's own rules (`../../career-genre-2026-10-22/final-runs/numbers-same.py`): every
number, boolean, key, list length and id-like string, the words a player reads aside, the run's own record (commit,
clean tree, seconds) explained. The text outputs (logs, walks' reports) are compared byte for byte.

    python3 docs/verification/career-universe-2026-10-24/final-runs/compare.py BEFORE

BEFORE is the folder holding `docs/verification/career-genre-2026-10-22/final-runs` as committed before the runs were
gathered (`git archive d6eba5d5 docs/verification/career-genre-2026-10-22/final-runs | tar -x -C BEFORE`).
"""
import filecmp, json, os, sys

R = 'docs/verification/career-genre-2026-10-22/final-runs'
BEFORE = os.path.join(sys.argv[1], R)
HERE = 'docs/verification/career-universe-2026-10-24/final-runs'
src = open(f'{R}/numbers-same.py', encoding='utf-8').read()
EXPLAIN = ("|^\\.parts\\[\\d+\\]\\.secs$'", "|^\\.parts\\[\\d+\\]\\.secs$|\\.forks\\[\\d+\\]\\.secs$|^\\.at$|^\\.saves\\[\\d+\\]\\.ms$'")

def run(before, after, folders, out, label):
    s = src
    for old, new in [
        ("B21 = 'docs/verification/genre-banking-2026-10-22/final-runs'", f"B21 = {before!r}"),
        ("B22 = 'docs/verification/career-genre-2026-10-22/final-runs'", f"B22 = {after!r}"),
        ("open(f'{B22}/numbers-same.json', 'w', encoding='utf-8')", f"open({out!r}, 'w', encoding='utf-8')"),
        ('(against brief 21)', f'({label})'),
        ('sys.exit(1 if failed else 0)', ''),
        # The run's own record where brief 20's journeys and the app walks keep it: a fork's seconds, when a walk ran,
        # how long a save took to open.
        EXPLAIN,
        ("for d in ('final', 'runs', 'advice', 'journeys-final', 'interface-final', 'journeys14-final'):", f"for d in {folders!r}:"),
    ]:
        assert old in s, old
        s = s.replace(old, new)
    exec(compile(s, f'{R}/numbers-same.py', 'exec'), {'__name__': '__main__'})

# The runs, gathered in place, against the same runs as committed at d6eba5d5.
run(BEFORE, R, ('runs', 'advice', 'journeys-final', 'interface-final', 'journeys14-final', 'b20-journeys', 'app', 'app/walk', 'app/older', 'app/b21', 'app/b22'),
    f'{HERE}/numbers-same-runs.json', 'against the runs as committed at d6eba5d5')
# The judge, measured again here, against brief 22's.
run(R, HERE, ('final',), f'{HERE}/numbers-same-judge.json', "against brief 22's judge")

# The text outputs, byte for byte: every file that isn't JSON, in every folder the runs write.
text = {'same': 0, 'differ': [], 'missing': []}
for root, _, names in os.walk(BEFORE):
    for n in sorted(names):
        if n.endswith(('.json', '.jsonl', '.py', '.sh', '.before')) or os.path.relpath(root, BEFORE).split(os.sep)[0] == 'final':
            continue
        b = os.path.join(root, n)
        a = os.path.join(R, os.path.relpath(b, BEFORE))
        if not os.path.exists(a): text['missing'].append(os.path.relpath(a, R)); continue
        if filecmp.cmp(a, b, shallow=False): text['same'] += 1
        else: text['differ'].append(os.path.relpath(a, R))
json.dump(text, open(f'{HERE}/text-same-runs.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(f"text: {text['same']} the same byte for byte; {len(text['differ'])} differ; {len(text['missing'])} missing")
for f in text['differ'][:80]: print(f'  {f}')
