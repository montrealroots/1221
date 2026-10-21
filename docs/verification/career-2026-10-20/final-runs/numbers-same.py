"""
Brief 19's final runs against brief 17's, file by file, never typed (brief 17's `../../continuity-2026-10-20/numbers-same.py`,
its comparison rules carried over). Brief 19 changed play on purpose: the career after the degree, the Actor Showcase as
the last term's coursework, the clock's stops and the understudy's part. So only the judge's outputs (`final/`) are held
to brief 17's: where every number in them is the same, criteria.py moves the judge's overrides too (`SAME19`). The other
folders are compared and counted, file by file, for the receipt to say where brief 19 reaches; a difference there isn't
a failure.

Every number, boolean, key, list length and id-like string is compared, the words a player reads aside. What's explained,
read from where the tools write it: the run's own record (its commit, whether its tree was clean, the files it read, its
seconds), a count of notices (a body rewritten changes which merge) and the measures of words.

    python3 docs/verification/career-2026-10-20/final-runs/numbers-same.py

Exit 1 where the judge's outputs differ unexplained, or a file is missing.
"""
import json, os, re, sys

B17 = 'docs/verification/continuity-2026-10-20'      # brief 17's final runs, on ecd961cc
B19 = 'docs/verification/career-2026-10-20/final-runs'  # brief 19's, on the tested commit
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
    before, after = f'{B17}/{d}', f'{B19}/{d}'
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
    held = d == 'final'
    if held and (unexplained or missing or not files(before)): failed = True
    result[d] = {'before': before, 'after': after, 'held': held, 'files': len(files(before)), 'same': same, 'explained': explained, 'unexplained': unexplained, 'missing': missing}
    print(f"{d}{' (held to brief 17)' if held else ''}: {len(files(before))} files; {same} the same in every number; explained: {explained or 'none'}; differ: {len(unexplained)} files; missing: {len(missing)}")
    for f, v in list(unexplained.items())[:12]:
        print(f"  {f} ({v['differences']}):"); [print(f'    {x}') for x in v['first'][:3]]
json.dump(result, open(f'{B19}/numbers-same.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
sys.exit(1 if failed else 0)
