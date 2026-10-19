"""
Brief 15's receipt (section 12), written from the pass's records, never typed: the second pass's statuses as the
inventory counts them now, the baseline as it was committed at bdb23949, every area's examples, reasons and defects, the
cross-area review, the tests the pass added and changed, the final runs' exits, the built app's walk and journeys, and
the comparison of every number with brief 14's runs.

    python3 docs/verification/editorial-2026-10-19/receipt.py

Run from the repository's root after `node tools/text-inventory.mjs --write` and the final runs. It writes receipt.json
and RECEIPT.md beside itself, and exits 1 where the record says the pass isn't finished:
- a source Pending or Blocked in the second pass, or the pass not closed;
- a final check that didn't exit 0;
- a final run that differs from brief 14's in a number nothing explains;
- a phrase the review route quotes that's found nowhere.
A record not there yet is said as not run, and fails it too. Brief 14's receipt.py, on brief 15's records.
"""
import glob, json, os, re, subprocess, sys
from collections import Counter

B = 'docs/verification/editorial-2026-10-19'
B14 = 'docs/verification/language-2026-10-17'
BASE = 'bdb23949'
problems = []

def sh(*cmd):
    return subprocess.run(cmd, capture_output=True, text=True).stdout

def load(path, default=None):
    try:
        return json.load(open(path, encoding='utf-8'))
    except (FileNotFoundError, json.JSONDecodeError):
        return default

def read(path, default=''):
    try:
        return open(path, encoding='utf-8').read()
    except FileNotFoundError:
        return default

def exit_of(path):
    m = re.findall(r'exit=(\d+)', read(path))
    return int(m[-1]) if m else None

def table(head, rows):
    out = ['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)]
    out += ['| ' + ' | '.join(str(c) for c in r) + ' |' for r in rows]
    return '\n'.join(out)

def cut(s, n=360):
    s = ' '.join(str(s).split())
    return s if len(s) <= n else s[:n - 1].rstrip() + '…'

SECOND = ['Rewritten', 'Retained', 'Pending', 'Blocked']

# --- The inventory, both passes ---------------------------------------------------------------------------------------
inv = load('docs/text/inventory.json', {})
base = json.loads(sh('git', 'show', f'{BASE}:docs/text/inventory.json') or '{}')
speak_start = json.loads(sh('git', 'show', f'{BASE}:docs/text/engine-speak.json') or '{"counts":{}}')['counts']
ratchet = load('docs/text/engine-speak.json', {'counts': {}})['counts']
rows = inv.get('sources', [])
second = Counter(r.get('second') for r in rows)
if second.get('Pending') or second.get('Blocked') or len(rows) == 0:
    problems.append(f"the second pass: {second.get('Pending', 0)} Pending, {second.get('Blocked', 0)} Blocked")
if not os.path.exists('docs/text/second-pass-closed.json'): problems.append('the second pass isn’t closed (docs/text/second-pass-closed.json)')
areas2 = inv.get('areas2', {})
totals = inv.get('totals', {})
first_now = Counter(r.get('status') for r in rows)
# A source the second pass rewrote that the first pass had kept: the brief's "including all retained text".
moved = Counter((r.get('status'), r.get('second')) for r in rows)

# --- Before and after, and kept with a reason --------------------------------------------------------------------------
examples = {f.split('/')[-2]: load(f, []) for f in sorted(glob.glob(f'{B}/*/examples.json'))}
ex_all = [dict(x, area=a) for a, xs in examples.items() for x in (xs if isinstance(xs, list) else [])]
picked = []
for a, xs in examples.items():
    xs = [x for x in (xs if isinstance(xs, list) else []) if x.get('before') and x.get('after')]
    xs.sort(key=lambda x: (not x.get('meaningSensitive'), len(str(x.get('after')))))
    picked += [dict(x, area=a) for x in xs[:2]]
kept = {}
for r in rows:
    if r.get('second') == 'Retained' and r.get('secondWhy'):
        kept.setdefault(r.get('area2'), []).append((r['id'], r['secondWhy']))

# --- Tests the pass added and changed ----------------------------------------------------------------------------------
status_lines = sh('git', 'diff', '--name-status', BASE, 'HEAD', '--', 'tests').splitlines()
added = [l.split('\t')[1] for l in status_lines if l.startswith('A\t') and l.endswith('.test.ts')]
added_counts = [(f, len(re.findall(r'^\s*it\(', read(f), re.M))) for f in added]
changed_tests = len([l for l in status_lines if l.startswith('M\t')])

# --- Final checks and runs -----------------------------------------------------------------------------------------
gate_exit = exit_of(f'{B}/final-checks/gate-exit.txt')
gate_txt = read(f'{B}/final-checks/gate.txt')
suite = re.findall(r'Tests\s+(\d+) passed \((\d+)\)', gate_txt)
files = re.findall(r'Test Files\s+(\d+) passed \((\d+)\)', gate_txt)
if gate_exit != 0: problems.append(f'the gate: {"not run" if gate_exit is None else f"exit {gate_exit}"}')
build_exit = exit_of(f'{B}/final-checks/build-exit.txt')
if build_exit != 0: problems.append(f'the build: {"not run" if build_exit is None else f"exit {build_exit}"}')
lane_exits = {}
for f in sorted(glob.glob(f'{B}/runs/exits-*.txt')):
    lines = [l for l in read(f).splitlines() if ' exit=' in l]
    bad = [l.split(' cmd:')[0] for l in lines if not re.search(r' exit=0 ', l)]
    lane_exits[f.replace(B + '/', '')] = (len(lines), bad)
    if bad: problems.append(f"{f.replace(B + '/', '')}: {len(bad)} steps not exit 0")
if not lane_exits: problems.append('the final runs: not run')
numbers = load(f'{B}/numbers-same.json')
if numbers is None: problems.append('the comparison with brief 14: not run')
elif any(v.get('unexplained') or v.get('missing') for v in numbers.values()): problems.append('a final run differs from brief 14 in a number nothing explains')

# --- The built app --------------------------------------------------------------------------------------------------
def walk_count(d):
    n = 0
    for f in glob.glob(f'{d}/*.json'):
        if f.endswith('walk.json'): continue
        x = load(f, [])
        n += len(x) if isinstance(x, list) else 0
    return n
walks = {w: (walk_count(f'{B}/before/walk-{w}'), walk_count(f'{B}/final-walk/{w}')) for w in ('1440', '390')}
if not walks['1440'][1] or not walks['390'][1]: problems.append('the final walk: not run at both widths')
omit_before = load(f'{B}/before/omissions-walk.json', {})
omit_after = load(f'{B}/final-walk/omissions.json', {})
def omit_counts(x):
    return (len(x.get('lines', [])) if isinstance(x.get('lines'), list) else x.get('lines'), len(x.get('held', [])) if isinstance(x.get('held'), list) else x.get('held'),
            len(x.get('outside', [])) if isinstance(x.get('outside'), list) else x.get('outside'), len(x.get('assembled', [])) if isinstance(x.get('assembled'), list) else x.get('assembled'))
ui = '\n'.join(read(f) for f in glob.glob(f'{B}/runs/exits-UI.txt') + glob.glob(f'{B}/runs/exits-A.txt'))
def ui_exit(name):
    m = re.search(rf'^{re.escape(name)} exit=(\d+)', ui, re.M)
    return int(m.group(1)) if m else None
# The brief's eight journeys (section 11), each with the runs on the tested commit that press it at both widths.
JOURNEYS = [
    ('New-player onboarding', ['ui-normal-1440', 'ui-normal-390', 'acceptance-1440', 'acceptance-390'], 'the normal playthrough from creation, and the acceptance run’s fifteen saves; the tutorial’s chapters followed on the build (tutorial/follow-1440, follow-390)'),
    ('School: preparation, a showing, feedback, improvement', ['ui-normal-1440', 'ui-normal-390'], 'the normal playthrough: a term’s coursework, its showings and the notes after'),
    ('Attributes, genres, interpretation and advice', ['ui-specialist-1440', 'ui-specialist-390'], 'the specialist playthrough: practice, a brief taped, the Profile’s advice'),
    ('A setback and recovery', ['ui-setback-1440', 'ui-setback-390'], 'the setback playthrough: an injury, time off, coming back'),
    ('Banking with a restriction or a pending state', ['ui-banking-1440', 'ui-banking-390'], 'brief 14’s banking journey: round-ups short, a refusal, pending payments'),
    ('Papers and a document on its way', ['ui-document-1440', 'ui-document-390'], 'brief 14’s document journey: a passport applied for and waited on'),
    ('A health interruption', ['ui-health-1440', 'ui-health-390'], 'brief 14’s health journey: unwell on a class day, a doctor booked'),
    ('Saving, exiting and continuing', ['acceptance-1440', 'acceptance-390'], 'the acceptance run opens each of fifteen saves from its slot and reads it; the review route’s last step asks the owner to do it by hand'),
]
journeys = [(name, {s: ui_exit(s) for s in steps}, how) for name, steps, how in JOURNEYS]
for name, ex, _ in journeys:
    if any(v != 0 for v in ex.values()): problems.append(f'the journey “{name}”: ' + ', '.join(f'{k} {"not run" if v is None else f"exit {v}"}' for k, v in ex.items() if v != 0))
follow = {w: read(f'{B}/final-follow/follow-{w}.log') for w in ('1440', '390')}
follow_exit = {w: exit_of(f'{B}/final-follow/follow-{w}-exit.txt') for w in ('1440', '390')}
for w, e in follow_exit.items():
    if e != 0: problems.append(f'the guide followed on the build at {w}: {"not run" if e is None else f"exit {e}"}')

# --- Defects, the cross-area review, the route -----------------------------------------------------------------------
defects = load(f'{B}/defects.json')
if defects is None: problems.append('the defect index: not written')
elif defects.get('problems'): problems.append('the defect index names a record that doesn’t hold its heading')
route = load(f'{B}/playtest-check.json')
if route is None: problems.append('the review route’s check: not run')
elif any(x['found'] == 'nowhere' for x in route): problems.append('the review route quotes something found nowhere')
coord = read(f'{B}/coordinator.md')
open_part = coord[coord.index('## Open'):coord.index('## Settled')] if '## Open' in coord else ''
still_open = re.findall(r'^- \*\*(.+?)\*\*', open_part, re.M)

commits = [l.split(' ', 1) for l in sh('git', 'log', '--first-parent', '--format=%h %s', f'{BASE}..HEAD').splitlines()][::-1]
style = read('docs/STYLE.md')
finished = style[style.index('## Speak like a finished game'):] if '## Speak like a finished game' in style else ''
finished = finished[:finished.index('\n## ', 5)] if '\n## ' in finished[5:] else finished
finished_parts = re.findall(r'^### (.+)$', finished, re.M) or re.findall(r'^\*\*(.+?)\*\*', finished, re.M)
gloss = [(s.split('\n', 1)[0].strip(), len(re.findall(r'^\| \*\*', s, re.M))) for s in re.split(r'^## ', read('docs/GLOSSARY.md'), flags=re.M)[1:]]

receipt = {
    'commit': sh('git', 'rev-parse', '--short', 'HEAD').strip(),
    'inventory': {'start': base.get('all'), 'now': inv.get('all'), 'second': dict(second), 'firstNow': dict(first_now), 'byArea': areas2,
                  'movedFromFirst': {f'{a} → {b}': n for (a, b), n in moved.items()}, 'engineSpeak': {'start': sum(speak_start.values()), 'ratchet': sum(ratchet.values())}},
    'examples': {'count': len(ex_all), 'byArea': {a: len(x) if isinstance(x, list) else 0 for a, x in examples.items()}},
    'tests': {'added': dict(added_counts), 'changedFiles': changed_tests},
    'final': {'gate': gate_exit, 'suite': suite[-1] if suite else None, 'files': files[-1] if files else None, 'build': build_exit,
              'lanes': {k: {'steps': n, 'notZero': bad} for k, (n, bad) in lane_exits.items()}, 'numbersSame': numbers},
    'builtApp': {'screens': walks, 'omissionsBefore': omit_counts(omit_before) if omit_before else None, 'omissionsAfter': omit_counts(omit_after) if omit_after else None,
                 'journeys': {n: e for n, e, _ in journeys}, 'follow': follow_exit},
    'defects': defects.get('counts') if defects else None,
    'route': Counter(x['found'] for x in route) if route else None,
    'open': still_open,
    'problems': problems,
}
json.dump(receipt, open(f'{B}/receipt.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

md = []
w = md.append
w("# Brief 15's Receipt: The Natural-Language Editorial Pass")
w('')
w(f"Written by `receipt.py` from the pass's records on `{receipt['commit']}`, nothing typed: the brief's section 12, in its order. The "
  "brief is `../briefs-2026-10-16/15-complete-natural-language-editorial-pass.txt`; how the pass was worked is `README.md`; what "
  "crossed areas is `coordinator.md`; the reading of all ten areas together is `crossarea.md`.")
w('')
w('**What this is and isn’t.** Every number here is a count a tool made or a test checked. The journeys pressed the controls a player '
  'presses at 1440 and 390 wide, and the walk read every screen on fifteen saves. A green check is no proof of good prose (section 10), '
  'and nothing here is human usability approval: the review route, `PLAYTEST.md`, is for the owner’s ear, and only the owner can give it.')
w('')
w('## 1. The Second-Pass Inventory, Every Source Accounted For')
w('')
a0, a1 = base.get('all', {}), inv.get('all', {})
w(f"`tools/text-inventory.mjs` finds every string in `src/`, `index.html` and `public/` a player can see, and groups it into the sources a "
  f"writer reads as one. Brief 15 gave each a second status apart from brief 14's, so the first pass's history is kept (`docs/text/statuses/`, "
  f"`docs/text/second-pass/`).")
w('')
w(table(['', 'Sources', 'Strings', 'Words', 'Engine-Speak Hits'],
        [[f'At the start (`{BASE}`)', a0.get('sources'), a0.get('strings'), a0.get('words'), a0.get('speak')],
         [f"Now (`{receipt['commit']}`)", a1.get('sources'), a1.get('strings'), a1.get('words'), a1.get('speak')]]))
w('')
w(table(['The second pass', 'Rewritten', 'Retained', 'Pending', 'Blocked'], [['Every source', *(second.get(k, 0) for k in SECOND)]]))
w('')
w('Every source brief 14 kept or rewrote was read again; how the two passes meet:')
w('')
w(table(['First pass (brief 14)', 'Second pass (brief 15)', 'Sources'], sorted([[a, b, n] for (a, b), n in moved.items()], key=lambda r: (str(r[0]), str(r[1])))))
w('')
w('By the area whose status names each source:')
w('')
w(table(['Area', 'Sources', 'Words', *SECOND], [[a, v.get('sources'), v.get('words'), *(v.get(f'second {k}', 0) for k in SECOND)] for a, v in sorted(areas2.items())]))
w('')
w('By subsystem:')
w('')
w(table(['Subsystem', 'Sources', 'Words', *SECOND, 'Engine-Speak'], [[t['name'], t['sources'], t['words'], *(t.get(f'second {k}', 0) for k in SECOND), t['speak']] for t in totals.values()]))
w('')
w(f"The engine-speak ratchet (`docs/text/engine-speak.json`) stands at {sum(ratchet.values())}, from {sum(speak_start.values())} at the start; it may fall and may not rise.")
w('')
w('**Omissions.** The inventory was checked against the game before any text changed, and again at the cross-area review (`omissions.md`): '
  'the page’s title, the holiday names, and every citation that began with a web address were brought in; the gazetteer’s place names are '
  'proper names and stay out.')
w('')
w('## 2. Representative Before And After, From Every Subsystem')
w('')
w(f"{len(ex_all)} pairs in the areas' `examples.json`, each checked against the code. The working reference (`reference.md`) is the eight kinds "
  "of text the brief names, with the owner's four examples, rewritten before the areas began.")
w('')
w(table(['Area', 'Pairs'], sorted(receipt['examples']['byArea'].items())))
w('')
for x in picked:
    w(f"- **{x['area']}** (`{x.get('source', '')}`)")
    w(f"  - Before: {cut(x['before'])}")
    w(f"  - After: {cut(x['after'])}")
    if x.get('why'): w(f"  - Why: {cut(x['why'], 240)}")
w('')
w('## 3. Specific Reasons For Retained Text')
w('')
w('Every Retained status carries a reason the tool checks: eight words at least, and none of the brief’s ruled-out reasons ("already '
  'reviewed", "grammatically correct", "no flagged words"). Each area’s `retained.md` samples them; two from each area’s statuses:')
w('')
for a in sorted(kept):
    for sid, why in kept[a][:2]:
        w(f"- **{a}**, `{sid}`: {cut(why, 300)}")
w('')
w('## 4. Verified Tutorial Journeys')
w('')
w('The tutorial area followed every chapter of the guide on the built app at 1440 and 390, pressing what each says to press '
  '(`tutorial/follow-1440`, `follow-390`, `routes.md`). On the tested commit it was followed again:')
w('')
w(table(['Width', 'Exit', 'Record'], [[wd, 'not run' if e is None else e, f'`final-follow/follow-{wd}.log`'] for wd, e in follow_exit.items()]))
w('')
gq = sh('node', 'tools/guide-quotes.mjs', '--check').strip().splitlines()
w(f"`tools/guide-quotes.mjs --check`, in the gate: {gq[-1] if gq else 'not run'}")
w('')
w('## 5. Dynamic Text And Repeated Messages')
w('')
w('Section 8’s variants (singular and plural, a missing optional part, names, pronouns, dates, amounts, deadlines, changed statuses) are '
  'held by `tests/language-dynamic.test.ts` and the areas’ tests, each area’s batch notes recording the variants it read. A repeated note '
  'says what changed since the last (`systems/coursework.ts`, `tests/variety.test.ts`). The tests the pass added:')
w('')
w(table(['Test file', 'Tests'], added_counts) if added_counts else 'None added; the pass changed existing tests to hold the new words.')
w('')
w(f'{changed_tests} test files were changed to hold the new words as exactly as they held the old; no behavioral check was loosened.')
w('')
w('## 6. Defects, Apart From The Editorial Changes')
w('')
if defects:
    c = defects['counts']
    w(f"`DEFECTS.md`, from every area's record and the coordinator's: {c['total']} in all, {c['by_status'].get('fixed', 0)} fixed and "
      f"{c['by_status'].get('left', 0)} left, each left one for the owner with why.")
    w('')
    w(table(['Kind', 'Fixed', 'Left', 'All'], [[k, v.get('fixed', 0), v.get('left', 0), v.get('total', 0)] for k, v in sorted(c['by_kind'].items())]))
else:
    w('Not written yet.')
w('')
w('## 7. The Built Game')
w('')
w(table(['Width', 'Screens walked before', 'Screens walked on the tested commit'], [[wd, b, a] for wd, (b, a) in walks.items()]))
w('')
if omit_after:
    l, h, o, s = omit_counts(omit_after)
    w(f"The tested commit's walk, line by line against the inventory (`tools/text-omissions.mjs`, `final-walk/omissions.json`): {l} lines of four "
      f"words or more, {h} held by an inventory string, {s} assembled from values, {o} from a file the inventory doesn't read.")
    w('')
w('The brief’s eight journeys, each with the runs on the tested commit that press it (exit 0 is every step passed and every language check clean):')
w('')
w(table(['Journey', 'Runs', 'How'], [[n, ', '.join(f'{k} {"not run" if v is None else v}' for k, v in e.items()), h] for n, e, h in journeys]))
w('')
w('**Routes not exercised by a run.** Dialogs and states no save reaches are read in the code (the inventory) and by the areas’ renders, not '
  'on the build. No run plays a whole degree on the build: brief 13’s twenty-five journeys play it in the engine (`journeys-final/`). The '
  'built app is checked in Chromium alone. Whether the voice is natural is the owner’s to judge.')
w('')
w('## 8. Tests, Commands, Commits And Outcomes')
w('')
w(f"- **`npm run gate`** on `{receipt['commit']}`: {'not run' if gate_exit is None else f'exit {gate_exit}'}"
  + (f", {files[-1][0]} of {files[-1][1]} files and {suite[-1][0]} of {suite[-1][1]} tests" if suite and files else '') + ' (`final-checks/gate.txt`).')
w(f"- **`npm run build`**: {'not run' if build_exit is None else f'exit {build_exit}'} (`final-checks/build.txt`).")
w('- **The final runs**, each step’s exit recorded (`runs/exits-*.txt`):')
w('')
w(table(['Record', 'Steps', 'Not exit 0'], [[k, n, '; '.join(bad) or 'none'] for k, (n, bad) in lane_exits.items()]) if lane_exits else 'Not run yet.')
w('')
w('- **Gameplay unchanged.** Every number, id, list length and key in the final runs against brief 14\'s, words allowed to differ '
  '(`numbers-same.py`, `numbers-same.json`):')
w('')
if numbers:
    w(table(['Runs', 'Files', 'Identical in every number', 'Differences explained', 'Unexplained'],
            [[k, v.get('files'), v.get('same'), '; '.join(f'{n} ({r})' for r, n in (v.get('explained') or {}).items()) or 'none', len(v.get('unexplained') or {})] for k, v in numbers.items()]))
else:
    w('Not run yet.')
w('')
w('The pass’s commits on the branch, in order (merges carry each area’s own):')
w('')
for h, s in commits: w(f'- `{h}` {s}')
w('')
w('## 9. The Manual Review Route')
w('')
if route:
    rc = Counter(x['found'] for x in route)
    w(f"`PLAYTEST.md`, about twenty-five minutes. Every phrase and label it quotes was looked for (`playtest-check.py`): {rc.get('on the built app', 0)} "
      f"on the built app, {rc.get('in the code only', 0)} in the code only, {rc.get('nowhere', 0)} nowhere.")
else:
    w('`PLAYTEST.md`; its check hasn’t run.')
w('')
w('## 10. Writing Guidance And Handoff')
w('')
w('`docs/STYLE.md`’s "Speak like a finished game", written before any text changed, and its Pictures section, which now names the weather’s '
  'picture as the one exception. `docs/GLOSSARY.md`:')
w('')
w(table(['Section', 'Terms'], gloss))
w('')
w('`SLATE_CURRENT_MASTER_HANDOFF.md` carries the pass’s state to the next session.')
w('')
w('## 11. What Remains')
w('')
w(f"- **Unreviewed:** {second.get('Pending', 0)} sources Pending in the second pass. **Blocked:** {second.get('Blocked', 0)}.")
w('- **Left open, each with why, in `coordinator.md`:**')
for o in still_open: w(f'  - {o}')
if defects: w(f"- **Defects left:** {defects['counts']['by_status'].get('left', 0)}, each for the owner, in `DEFECTS.md`.")
w('')
if problems:
    w('## Not Yet Finished')
    w('')
    for p in problems: w(f'- {p}')
    w('')
open(f'{B}/RECEIPT.md', 'w', encoding='utf-8').write('\n'.join(md))
print(f"RECEIPT.md written on {receipt['commit']}; {len(problems)} problems" + (': ' + '; '.join(problems) if problems else ''))
sys.exit(1 if problems else 0)
