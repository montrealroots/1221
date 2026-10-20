"""
Whether brief 17's runs are brief 16's game (brief 17, section 10: "Gameplay must remain unchanged except for the
authorized incident-continuity fix"): every number, boolean, key, list length and id-like string in each run's outputs
against brief 16's final runs, with only the words a player reads allowed to differ. Never typed: each folder's files
are compared with the same file of brief 16's. Brief 16's script (itself brief 15's), on brief 17's folders.

    python3 docs/verification/continuity-2026-10-20/numbers-same.py

A string is words when it holds a space or a capital letter; otherwise it's an id, a kind, a date or a key, and it's
compared. What differs and is explained below is counted apart, with its reason; anything else fails it (exit 1). The
explanations are brief 14's kinds of field, read from where the tools write them, never one difference waved through by
its value:
- **the run's own record:** the commit a run was made on, the files it read, the seconds it took;
- **figures.json:** written after the runs, from them, and compared by the criteria with brief 14's figures row by row;
- **a count of notices:** a notice merges into an unread one with the same title and body (`Simulation.notify`), so a
  rewrite that makes two bodies differ, or alike, changes how many merge. The events they tell of are counted apart and
  must be the same;
- **a measure of words:** what the journeys' continuity reads (all counts of text) and freshness's suggestions found by
  their phrases.
"""
import json, os, re, sys

B13 = 'docs/verification/voices-2026-10-20'   # before: brief 16's final runs
B14 = 'docs/verification/continuity-2026-10-20'   # after: brief 17's
FOLDERS = ['final', 'runs', 'advice', 'journeys-final']
EXPLAINED = [
    (r'^\.commits?(\[\d+\])?$|^\.files\[\d+\]$|^(\[\d+\])?\.secs$|^\.parts\[\d+\]\.secs$', 'the run’s own record: its commit, the files it read, its seconds'),
    (r'^\.notices$|^\.notices\[\d+\]|^\.shownNotices$', 'a count of notices: fewer merge, since a repeated one says what changed (section 8); the events are compared apart'),
    (r'^\.continuity\.(saidAgain|sameWordsTwice|advice\.wordsOnlyChanges|advice\.longRuns\[\d+\]\.stripped)', 'a measure of words: the journeys’ continuity counts text'),
    (r'^\.results\[\d+\]\.suggestionsFromRecord$', 'a measure of words: freshness finds a suggestion by its phrases'),
]
SKIP = {'figures.json': 'written after the runs and compared by criteria.py, figure by figure'}
# Brief 15's script let J16 parts 2 and 3 differ in one verdict, written before a tool's fix in brief 14. Brief 15's and
# brief 16's are both written by the fixed tool, so nothing is let differ by its file.
BY_FILE = set()
BY_FILE_WHY = ''

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
# The events the notices tell of (the docstring's "counted apart"), from each journey's whole list of (day, title): every
# notice brief 15's run had on a day is in brief 16's on that day, no title is had fewer times, and what's had more is
# only a classmate's notice whose body brief 16 made say its history (a help asked for again, a partner who didn't come
# again, an apology, lines run again), so it no longer merges into the one before (`Simulation.notify`).
REPEATS = re.compile(r'(: A Request For Help|: An Apology| Didn’t Come|^Ran Lines With )')
events = {'journeys': 0, 'every day and title kept': 0, 'none fewer': 0, 'more only of a classmate’s repeat': 0, 'more': {}}
for f in sorted(os.listdir(f'{B13}/journeys-final')):
    if not f.endswith('-p4.json'): continue
    a, b = load(f'{B13}/journeys-final/{f}'), load(f'{B14}/journeys-final/{f}')
    if not isinstance(a.get('notices'), list): continue
    ta, tb = {}, {}
    for n in a['notices']: ta[n[1]] = ta.get(n[1], 0) + 1
    for n in b['notices']: tb[n[1]] = tb.get(n[1], 0) + 1
    more = {t: tb[t] - ta.get(t, 0) for t in tb if tb[t] > ta.get(t, 0)}
    events['journeys'] += 1
    events['every day and title kept'] += {(n[0], n[1]) for n in a['notices']} <= {(n[0], n[1]) for n in b['notices']}
    events['none fewer'] += all(tb.get(t, 0) >= c for t, c in ta.items())
    events['more only of a classmate’s repeat'] += all(REPEATS.search(t) for t in more)
    for t, c in more.items():
        k = REPEATS.search(t).group(1).strip(': ') if REPEATS.search(t) else t
        events['more'][k] = events['more'].get(k, 0) + c
n = events['journeys']
if not n or any(events[k] != n for k in ('every day and title kept', 'none fewer', 'more only of a classmate’s repeat')): failed = True
result['notice events'] = events
print(f"notice events: {n} journeys; every day and title kept in {events['every day and title kept']}; none fewer in {events['none fewer']}; more only of a classmate’s repeat in {events['more only of a classmate’s repeat']}; more: {events['more']}")
json.dump(result, open(f'{B14}/numbers-same.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
sys.exit(1 if failed else 0)
