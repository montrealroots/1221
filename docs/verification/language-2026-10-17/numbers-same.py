"""
Whether brief 14's final runs are brief 13's game (brief 14: "Must not change: gameplay rules, calculations, saves"):
every number, boolean, key, list length and id-like string in each run's outputs against brief 13's, with only the words
a player reads allowed to differ. Never typed: each folder's files are compared with the same file of brief 13's.

    python3 docs/verification/language-2026-10-17/numbers-same.py

A string is words when it holds a space or a capital letter; otherwise it's an id, a kind, a date or a key, and it's
compared. What differs and is explained below is counted apart, with its reason; anything else fails it (exit 1). The
explanations are kinds of field, read from where the tools write them, never one difference waved through by its value:
- **the run's own record:** the commit a run was made on, the files it read, the seconds it took;
- **figures.json:** written after the runs, from them, and compared by criteria.py with brief 13's figures row by row;
- **a count of notices:** a notice merges into an unread one with the same title and body (`Simulation.notify`). Brief
  14's section 8 has a repeated notice say what changed, so fewer bodies are identical and fewer merge. The events they
  tell of are counted apart (showings, work, reviews, standings) and must be the same;
- **a measure of words:** what the journeys' continuity reads (the advice's words stripped, notices said again, the same
  words twice: all counts of text) and freshness's suggestions found by their phrases.
"""
import json, os, re, sys

B13 = 'docs/verification/playthroughs-2026-10-17'
B14 = 'docs/verification/language-2026-10-17'
FOLDERS = ['final', 'runs', 'advice', 'journeys-final']
EXPLAINED = [
    (r'^\.commits?(\[\d+\])?$|^\.files\[\d+\]$|^(\[\d+\])?\.secs$|^\.parts\[\d+\]\.secs$', 'the run’s own record: its commit, the files it read, its seconds'),
    (r'^\.notices$|^\.notices\[\d+\]|^\.shownNotices$', 'a count of notices: fewer merge, since a repeated one says what changed (section 8); the events are compared apart'),
    (r'^\.continuity\.(saidAgain|sameWordsTwice|advice\.wordsOnlyChanges|advice\.longRuns\[\d+\]\.stripped)', 'a measure of words: the journeys’ continuity counts text'),
    (r'^\.results\[\d+\]\.suggestionsFromRecord$', 'a measure of words: freshness finds a suggestion by its phrases'),
]
SKIP = {'figures.json': 'written after the runs and compared by criteria.py, figure by figure'}
# One check's verdict in parts written before the tool's fix (7e1152de): J16's parts 2 and 3 were written by the lane on
# 6d83601a, when the OPT check looked for the refusal's old words ("left without it") and the refusal said "left without
# one". Its final part was checked again with the fixed tool, on the same saved state, and passes (runs/exits-JRR.txt).
BY_FILE = {('J16-p2.json', '.checks.7 papers'), ('J16-p3.json', '.checks.7 papers')}
BY_FILE_WHY = 'the OPT check before its fix read the refusal’s old words; J16’s final part, checked again, passes'

ID = re.compile(r'^[a-z0-9_.:/#@+\-]*$')
def is_words(s): return not ID.match(s) and not re.match(r'^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$', s)

def diff(a, b, path, out):
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b: out.append((f'{path}.{k}', f'only in {"after" if k in b else "before"}'))
            else: diff(a[k], b[k], f'{path}.{k}', out)
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b): out.append((path, f'{len(a)} items before, {len(b)} after'))
        for i, (x, y) in enumerate(zip(a, b)): diff(x, y, f'{path}[{i}]', out)
    elif isinstance(a, str) and isinstance(b, str):
        if is_words(a) and is_words(b): return
        if a != b: out.append((path, f'{a[:60]!r} before, {b[:60]!r} after'))
    elif type(a) != type(b) or a != b:
        out.append((path, f'{str(a)[:60]} before, {str(b)[:60]} after'))

def load(p):
    if p.endswith('.jsonl'): return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip().startswith('{')]
    return json.load(open(p, encoding='utf-8'))

def why(path):
    return next((reason for pat, reason in EXPLAINED if re.search(pat, path)), None)

result, failed = {}, False
for d in FOLDERS:
    a_dir, b_dir = f'{B13}/{d}', f'{B14}/{d}'
    same, explained, unexplained, missing, skipped = 0, {}, {}, [], []
    for f in sorted(os.listdir(a_dir)):
        if not f.endswith(('.json', '.jsonl')): continue
        if f in SKIP: skipped.append(f); continue
        if not os.path.exists(f'{b_dir}/{f}'): missing.append(f); continue
        out = []
        try: diff(load(f'{a_dir}/{f}'), load(f'{b_dir}/{f}'), '', out)
        except Exception as e: out = [('', f'unreadable: {e}')]
        reason = lambda p: BY_FILE_WHY if any(f == bf and p.startswith(bp) for bf, bp in BY_FILE) else why(p)
        un = [(p, x) for p, x in out if not reason(p)]
        for p, x in out:
            r = reason(p)
            if r: explained[r] = explained.get(r, 0) + 1
        if un: unexplained[f] = [f'{p}: {x}' for p, x in un[:8]]
        elif not out: same += 1
    if unexplained or missing: failed = True
    files = len([f for f in os.listdir(a_dir) if f.endswith(('.json', '.jsonl')) and f not in SKIP])
    result[d] = {'files': files, 'same': same, 'explained': explained, 'unexplained': unexplained, 'missing': missing, 'skipped': skipped}
    print(f"{d}: {result[d]['files']} files; {same} identical in every number; differences explained: {explained or 'none'}; unexplained: {len(unexplained)} files; missing after: {len(missing)}")
    for f, v in unexplained.items():
        print(f'  {f}:'); [print(f'    {x}') for x in v]
json.dump(result, open(f'{B14}/numbers-same.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
sys.exit(1 if failed else 0)
