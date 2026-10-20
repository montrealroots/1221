"""
Whether brief 17's runs are brief 16's game but for the authorized fix (brief 17, section 10: "Gameplay must remain
unchanged except for the authorized incident-continuity fix... For the explicitly authorized incident-continuity fix,
explain and test the intended behavioral difference separately"). Two comparisons, never typed, each file with the same
file of the other side:

1. **The words** (`words`): brief 16's final runs against brief 17's runs with the fix taken out (`fixoff/`, made by
   `runs/fixoff-lanes17.sh` on the tested commit with `fixoff/students/fix-off.patch`, its one line). Every number,
   boolean, key, list length and id-like string must be the same, the words a player reads aside, and what's explained
   below counted apart. The judge's outputs (`final/`, the tested commit's) are held here too: the judge reads no
   classmate. A difference not explained fails it (exit 1).
2. **The fix** (`fix`): the runs with the fix taken out against the tested commit's. Everything that differs here is
   the fix's, and is counted, file by file. For each journey, the first day its notices differ must be a classmate's
   (a moment, a rehearsal they ask for, miss or aren't answered about), with everything before it the same; a journey
   whose first difference is anything else fails it.

A string is words when it holds a space or a capital letter; otherwise it's an id, a kind, a date or a key, and it's
compared. What's explained, read from where the tools write it, never one difference waved through by its value:
- **the run's own record:** the commit a run was made on, the files it read, the seconds it took;
- **figures.json:** written after the runs, from them, and compared by criteria.py figure by figure;
- **a count of notices:** a notice merges into an unread one with the same title and body (`Simulation.notify`), so a
  rewrite that makes two bodies differ, or alike, changes how many merge. The events they tell of are compared apart;
- **a measure of words:** what the journeys' continuity reads (all counts of text) and freshness's suggestions found by
  their phrases.

    python3 docs/verification/continuity-2026-10-20/numbers-same.py
"""
import json, os, re, sys

B16 = 'docs/verification/voices-2026-10-20'      # brief 16's final runs
B17 = 'docs/verification/continuity-2026-10-20'  # brief 17's, on the tested commit
OFF = f'{B17}/fixoff'                             # brief 17's with the fix taken out
EXPLAINED = [
    (r'^\.commits?(\[\d+\])?$|^\.files\[\d+\]$|^(\[\d+\])?\.secs$|^\.parts\[\d+\]\.secs$', 'the run’s own record: its commit, the files it read, its seconds'),
    (r'^\.notices$|^\.notices\[\d+\]|^\.shownNotices$', 'a count of notices: a rewrite changes which merge; the events are compared apart'),
    (r'^\.continuity\.(saidAgain|sameWordsTwice|advice\.wordsOnlyChanges|advice\.longRuns\[\d+\]\.stripped)', 'a measure of words: the journeys’ continuity counts text'),
    (r'^\.results\[\d+\]\.suggestionsFromRecord$', 'a measure of words: freshness finds a suggestion by its phrases'),
]
SKIP = {'figures.json': 'written after the runs and compared by criteria.py, figure by figure'}
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

# Titles an editor renamed, read on both sides as the notice they are (`same-play.py`'s RENAMED, the same table).
RENAMED = [
    (re.compile(r'^Still There: Time On Its Feet$'), 'Still There: Rehearsal'),
    (re.compile(r'^You’re On (?:Tonight|Today) (?:As An Understudy In The Company|At Yale Rep)$'), 'You’re On At Yale Rep'),
    (re.compile(r'^You Went On (?:As An Understudy In The Company|At Yale Rep)$'), 'You Went On At Yale Rep'),
    (re.compile(r'^You’re On (?:Tonight|Today) As '), 'You’re On As '),
    (re.compile(r'^Incompletes?(?: In |: ).*'), 'Incomplete'),
]
def norm(t):
    for pat, to in RENAMED:
        if pat.search(t or ''): return pat.sub(to, t) if to.endswith(' ') else to
    return t
CLASS = re.compile(r'^\w+(?:: (?:A Different Reading|Run Lines Together\?|A Request For Help|A Word After Class|An Apology|A Boundary)| Didn’t Come| Asks To Rehearse| Didn’t Hear Back)$')

result, failed = {'words': {}, 'fix': {}}, False
# 1. The words: brief 16's runs against the fix taken out, and the judge's outputs against the tested commit's.
for d, before, after in (('final', f'{B16}/final', f'{B17}/final'), ('runs', f'{B16}/runs', f'{OFF}/runs'),
                         ('advice', f'{B16}/advice', f'{OFF}/advice'), ('journeys-final', f'{B16}/journeys-final', f'{OFF}/journeys-final')):
    same, explained, unexplained, missing = 0, {}, {}, []
    for f in files(before):
        if not os.path.exists(f'{after}/{f}'): missing.append(f); continue
        out = []
        try: diff(load(f'{before}/{f}'), load(f'{after}/{f}'), '', out)
        except Exception as e: out = [('', f'unreadable: {e}')]
        un = [(p, x) for p, x in out if not why(p)]
        for p, x in out:
            if why(p): explained[why(p)] = explained.get(why(p), 0) + 1
        if un: unexplained[f] = [f'{p}: {x}' for p, x in un[:8]]
        elif not out: same += 1
    if unexplained or missing or not files(before): failed = True
    result['words'][d] = {'before': before, 'after': after, 'files': len(files(before)), 'same': same, 'explained': explained, 'unexplained': unexplained, 'missing': missing}
    print(f"words, {d}: {len(files(before))} files; {same} identical in every number; explained: {explained or 'none'}; unexplained: {len(unexplained)} files; missing: {len(missing)}")
    for f, v in unexplained.items():
        print(f'  {f}:'); [print(f'    {x}') for x in v]
# The events the notices tell of: every (day, title) brief 16's journey had is in the fix-off journey's on that day,
# titles renamed read as one; and what's had more or fewer, by title.
ev = {'journeys': 0, 'every day and title kept': 0, 'more': {}, 'fewer': {}}
for f in files(f'{B16}/journeys-final'):
    if not f.endswith('-p4.json') or not os.path.exists(f'{OFF}/journeys-final/{f}'): continue
    a, b = load(f'{B16}/journeys-final/{f}'), load(f'{OFF}/journeys-final/{f}')
    if not isinstance(a.get('notices'), list): continue
    ev['journeys'] += 1
    da, db = {(n[0], norm(n[1])) for n in a['notices']}, {(n[0], norm(n[1])) for n in b['notices']}
    ev['every day and title kept'] += da == db
    ca, cb = {}, {}
    for n in a['notices']: ca[norm(n[1])] = ca.get(norm(n[1]), 0) + 1
    for n in b['notices']: cb[norm(n[1])] = cb.get(norm(n[1]), 0) + 1
    for t in set(ca) | set(cb):
        k = re.sub(r'^\w+(?=(?:: | Didn’t))', 'A classmate', t)
        if cb.get(t, 0) > ca.get(t, 0): ev['more'][k] = ev['more'].get(k, 0) + cb[t] - ca.get(t, 0)
        if cb.get(t, 0) < ca.get(t, 0): ev['fewer'][k] = ev['fewer'].get(k, 0) + ca[t] - cb.get(t, 0)
if not ev['journeys'] or ev['every day and title kept'] != ev['journeys']: failed = True
result['words']['notice events'] = ev
print(f"words, notice events: {ev['journeys']} journeys; the same days and titles in {ev['every day and title kept']}; more: {ev['more']}; fewer: {ev['fewer']}")

# 2. The fix: the fix taken out against the tested commit's.
for d in ('runs', 'advice', 'journeys-final'):
    before, after = f'{OFF}/{d}', f'{B17}/{d}'
    same, differ = 0, {}
    for f in files(before):
        if not os.path.exists(f'{after}/{f}'): differ[f] = ['missing after']; continue
        out = []
        diff(load(f'{before}/{f}'), load(f'{after}/{f}'), '', out)
        un = [(p, x) for p, x in out if not why(p)]
        if un: differ[f] = len(un)
        else: same += 1
    result['fix'][d] = {'files': len(files(before)), 'same': same, 'differ': differ}
    print(f"fix, {d}: {len(files(before))} files; {same} the same in every number; {len(differ)} differ: {', '.join(f'{f} ({n})' for f, n in list(differ.items())[:12])}")
# Each journey's first difference, by its notices.
jr = {}
for f in files(f'{OFF}/journeys-final'):
    if not f.endswith('-p4.json') or not os.path.exists(f'{B17}/journeys-final/{f}'): continue
    a, b = load(f'{OFF}/journeys-final/{f}'), load(f'{B17}/journeys-final/{f}')
    sa, sb = sorted({(n[0], n[1]) for n in a.get('notices', [])}), sorted({(n[0], n[1]) for n in b.get('notices', [])})
    i = next((k for k in range(min(len(sa), len(sb))) if sa[k] != sb[k]), None)
    if i is None and len(sa) == len(sb): jr[f[:-8]] = {'same': True}; continue
    day = min(sa[i][0] if i is not None and i < len(sa) else '9999', sb[i][0] if i is not None and i < len(sb) else '9999')
    xa, xb = {t for d_, t in sa if d_ == day}, {t for d_, t in sb if d_ == day}
    first = sorted((xa - xb) | (xb - xa))
    ok = bool(first) and all(CLASS.match(t) for t in first)
    jr[f[:-8]] = {'same': False, 'from': day, 'first': first[:4], 'aClassmates': ok}
    if not ok: failed = True
result['fix']['journeys'] = jr
print(f"fix, journeys: {len(jr)}; the same in {sum(1 for v in jr.values() if v['same'])}; first differing on a classmate's day in {sum(1 for v in jr.values() if not v['same'] and v['aClassmates'])}; otherwise {sum(1 for v in jr.values() if not v['same'] and not v['aClassmates'])}")
for k, v in jr.items():
    if not v['same']: print(f"  {k}: from {v['from']}, {', '.join(v['first'])}")
json.dump(result, open(f'{B17}/numbers-same.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
sys.exit(1 if failed else 0)
