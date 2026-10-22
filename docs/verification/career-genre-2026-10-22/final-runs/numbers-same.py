"""
Brief 22's final runs against brief 21's, file by file, never typed (brief 21's
`../../genre-banking-2026-10-22/final-runs/numbers-same.py`, its comparison rules carried over). Brief 22 changed what the
judge and the runs read on purpose: each work asks its genres as its material states them (`content/genre-weights.ts`),
a related genre counts across one direct link at 0.65 or 0.40 (`systems/engagement.ts`), and OPT is counted by the day
with permission read at each work day (`systems/permission.ts`, `systems/projobs.ts`). Brief 21 ran every lane, so every
folder here is held to brief 21's. A difference is reported, file by file, for the receipt to read against what brief 22
changed; criteria.py moves a judge row only with its figure beside the last one, and an override only where its own
outputs are the same.

Every number, boolean, key, list length and id-like string is compared, the words a player reads aside. What's explained,
read from where the tools write it: the run's own record (its commit, whether its tree was clean, the files it read, its
seconds), a count of notices (a body rewritten changes which merge) and the measures of words.

    python3 docs/verification/career-genre-2026-10-22/final-runs/numbers-same.py
"""
import json, os, re, sys

B21 = 'docs/verification/genre-banking-2026-10-22/final-runs'  # brief 21's final runs, on fd32e869: every folder's last
B22 = 'docs/verification/career-genre-2026-10-22/final-runs'   # brief 22's, on the tested commit
EXPLAINED = [
    (r'^\.commits?(\[\d+\])?$|^\.clean$|^\.files\[\d+\]$|^(\[\d+\])?\.secs$|^\.parts\[\d+\]\.secs$', 'the run’s own record: its commit, whether its tree was clean, the files it read, its seconds'),
    (r'^\.notices$|^\.notices\[\d+\]|^\.shownNotices$', 'a count of notices: a rewrite changes which merge; the events are compared apart'),
    (r'^\.continuity\.(saidAgain|sameWordsTwice|advice\.wordsOnlyChanges|advice\.longRuns\[\d+\]\.stripped)', 'a measure of words: the journeys’ continuity counts text'),
    (r'^\.results\[\d+\]\.suggestionsFromRecord$', 'a measure of words: freshness finds a suggestion by its phrases'),
]
SKIP = {'figures.json': 'written after the runs and compared by criteria.py, figure by figure', 'numbers-same.json': 'this file'}
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
def why(path): return next((reason for pat, reason in EXPLAINED if re.search(pat, path)), None)
def files(d): return sorted(f for f in os.listdir(d) if f.endswith(('.json', '.jsonl')) and f not in SKIP) if os.path.isdir(d) else []

result, failed = {}, False
for d in ('final', 'runs', 'advice', 'journeys-final', 'interface-final', 'journeys14-final'):
    before, after = f'{B21}/{d}', f'{B22}/{d}'
    same, explained, unexplained, missing = 0, {}, {}, []
    for f in files(before):
        if not os.path.exists(f'{after}/{f}'): missing.append(f); continue
        out = []
        try: diff(load(f'{before}/{f}'), load(f'{after}/{f}'), '', out)
        except Exception as e: out = [('', f'unreadable: {e}')]
        un = [(p, x) for p, x in out if not why(p)]
        for p, x in out:
            if why(p): explained[why(p)] = explained.get(why(p), 0) + 1
        if un: unexplained[f] = {'differences': len(un), 'first': [f'{p}: {x}' for p, x in un[:6]]}
        elif not out: same += 1
    held = False  # brief 22 changed what the judge and the runs read: a difference is read, not failed
    result[d] = {'before': before, 'after': after, 'held': held, 'files': len(files(before)), 'same': same, 'explained': explained, 'unexplained': unexplained, 'missing': missing}
    print(f"{d} (against brief 21): {len(files(before))} files; {same} the same in every number; explained: {explained or 'none'}; differ: {len(unexplained)} files; missing: {len(missing)}")
    for f, v in list(unexplained.items())[:12]:
        print(f"  {f} ({v['differences']}):"); [print(f'    {x}') for x in v['first'][:3]]
json.dump(result, open(f'{B22}/numbers-same.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
sys.exit(1 if failed else 0)
