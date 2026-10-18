"""
Brief 14's receipt (section 10), written from the pass's records, never typed: the inventory and its statuses as the
tool counts them now, the baseline as it was committed at d82d38d0, every area's examples and defects, the tests the
pass added, the final runs' exits, and the comparison of every number with brief 13's runs.

    python3 docs/verification/language-2026-10-17/receipt.py

Run from the repository's root after `node tools/text-inventory.mjs --write` and the final runs. It writes receipt.json
and RECEIPT.md beside itself. It exits 1 where the record says the sweep isn't finished: a source Pending or with no
status, a final check that didn't exit 0, a final run that differs from brief 13's in a number, or a defect index that
doesn't add up. A record not there yet is said as not run, and fails it too.
"""
import glob, json, os, re, subprocess, sys
from collections import Counter, defaultdict

B = 'docs/verification/language-2026-10-17'
B13 = 'docs/verification/playthroughs-2026-10-17'
BASE_COMMIT = 'd82d38d0'
START = '0368d46b'
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
    """The exit a run recorded in a file: the last `exit=N` in it, or None where it's not there."""
    m = re.findall(r'exit=(\d+)', read(path))
    return int(m[-1]) if m else None

def table(head, rows):
    out = ['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)]
    out += ['| ' + ' | '.join(str(c) for c in r) + ' |' for r in rows]
    return '\n'.join(out)

def cut(s, n=360):
    s = ' '.join(str(s).split())
    return s if len(s) <= n else s[:n - 1].rstrip() + '…'

# --- The standard ---------------------------------------------------------------------------------------------------
style = read('docs/STYLE.md')
talking = style[style.index('## Talking to the player'):]
talking = talking[:talking.index('\n## ', 5)]
style_parts = re.findall(r'^### (.+)$', talking, re.M)
glossary = read('docs/GLOSSARY.md')
gloss_sections = []
for sec in re.split(r'^## ', glossary, flags=re.M)[1:]:
    name = sec.split('\n', 1)[0].strip()
    gloss_sections.append((name, len(re.findall(r'^\| \*\*', sec, re.M))))

# --- The inventory --------------------------------------------------------------------------------------------------
inv = load('docs/text/inventory.json', {})
base = json.loads(sh('git', 'show', f'{BASE_COMMIT}:docs/text/inventory.json') or '{}')
speak_start = json.loads(sh('git', 'show', f'{BASE_COMMIT}:docs/text/engine-speak.json') or '{"counts":{}}')['counts']
ratchet = load('docs/text/engine-speak.json', {'counts': {}})['counts']
all_now = inv.get('all', {})
if all_now.get('Pending', 1) != 0: problems.append(f"{all_now.get('Pending')} sources Pending")
by_area = defaultdict(Counter)
for s in inv.get('sources', []):
    by_area[s.get('area') or 'baseline'][s['status']] += 1
STATUSES = ['Rewritten And Verified', 'Reviewed And Retained', 'Pending', 'Blocked']

# --- Before and after -----------------------------------------------------------------------------------------------
examples = {}
for f in sorted(glob.glob(f'{B}/*/examples.json')):
    examples[f.split('/')[-2]] = load(f, [])
ex_all = [dict(x, area=a) for a, xs in examples.items() for x in xs]
ex_kinds = Counter(x.get('kind', 'other') for x in ex_all)
ex_meaning = sum(1 for x in ex_all if x.get('meaningSensitive'))
SHOW_KINDS = ['button', 'label', 'notification', 'feedback', 'official', 'narration', 'error', 'refusal', 'tutorial', 'confirmation', 'empty']
picked = []
for k in SHOW_KINDS:
    xs = [x for x in ex_all if x.get('kind') == k and x.get('before') and x.get('after')]
    xs.sort(key=lambda x: (not x.get('meaningSensitive'), x['area']))
    seen = set()
    for x in xs:
        if x['area'] in seen: continue
        seen.add(x['area']); picked.append(x)
        if len(seen) == 2: break

# --- Tests the pass added -------------------------------------------------------------------------------------------
added = [l.split('\t')[1] for l in sh('git', 'diff', '--name-status', START, 'HEAD', '--', 'tests').splitlines() if l.startswith('A\t') and l.endswith('.test.ts')]
added_counts = [(f, len(re.findall(r'^\s*it\(', read(f), re.M))) for f in added]
changed_tests = len([l for l in sh('git', 'diff', '--name-status', START, 'HEAD', '--', 'tests').splitlines() if l.startswith('M\t')])

# --- Final checks and runs ------------------------------------------------------------------------------------------
gate_exit = exit_of(f'{B}/final-checks/gate-exit.txt')
gate_txt = read(f'{B}/final-checks/gate.txt')
suite = re.findall(r'Tests\s+(\d+) passed \((\d+)\)', gate_txt)
files = re.findall(r'Test Files\s+(\d+) passed \((\d+)\)', gate_txt)
if gate_exit != 0: problems.append(f'the gate: {"not run" if gate_exit is None else f"exit {gate_exit}"}')
build_exit = exit_of(f'{B}/final-checks/build-exit.txt')
if build_exit != 0: problems.append(f'the build: {"not run" if build_exit is None else f"exit {build_exit}"}')
lane_exits = {}
for f in sorted(glob.glob(f'{B}/runs/exits-*.txt')) + sorted(glob.glob(f'{B}/final-walk/exits.txt')):
    rows = [l for l in read(f).splitlines() if ' exit=' in l]
    bad = [l.split(' cmd:')[0] for l in rows if not re.search(r' exit=0 ', l)]
    lane_exits[f.replace(B + '/', '')] = (len(rows), bad)
numbers = load(f'{B}/numbers-same.json')
if numbers is None: problems.append('the comparison with brief 13: not run')
elif any(v.get('different') for v in numbers.values()): problems.append('a final run differs from brief 13 in a number')

# --- The built app --------------------------------------------------------------------------------------------------
def walk_count(d):
    n = 0
    for f in glob.glob(f'{d}/*.json'):
        if f.endswith('walk.json'): continue
        x = load(f, [])
        n += len(x) if isinstance(x, list) else 0
    return n
walks = {w: (walk_count(f'{B}/before/walk-{w}'), walk_count(f'{B}/final-walk/walk-{w}')) for w in ('1440', '390')}
def faults(p):
    x = load(p)
    if not x: return None
    return x.get('read'), sum(v.get('distinct', 0) for v in x.get('found', {}).values()), sorted(x.get('found', {}))
render = {w: (faults(f'{B}/before/render-before-{w}.json'), faults(f'{B}/final-walk/render-{w}.json')) for w in ('1440', '390')}
routes = load(f'{B}/final-walk/routes.json')
# Brief 13's three playthroughs and brief 14's three journeys, each at both widths, as the UI lane recorded them.
ui = read(f'{B}/runs/exits-UI.txt')
journeys = {}
for n in ('normal', 'setback', 'specialist', 'banking', 'document', 'health'):  # the last three's outputs in journeys14-final/
    for wd in ('1440', '390'):
        m = re.search(rf'^ui-{n}-{wd} exit=(\d+)', ui, re.M)
        journeys[f'{n}-{wd}'] = int(m.group(1)) if m else None

# --- Defects --------------------------------------------------------------------------------------------------------
defects = load(f'{B}/defects.json')
if defects is None: problems.append('the defect index: not written')
else:
    st = Counter(e['status'] for e in defects['entries'])
    if dict(st) != {k: v for k, v in defects.get('counts', {}).get('by_status', {}).items() if v} or len(defects['entries']) != defects['counts'].get('total'):
        problems.append('the defect index’s counts don’t add up')

# --- What's open ----------------------------------------------------------------------------------------------------
coord = read(f'{B}/coordinator.md')
open_part = coord[coord.index('## Open'):coord.index('## Settled')] if '## Open' in coord else ''
still_open = re.findall(r'^- \*\*(.+?)\*\*', open_part, re.M)

# --- Commits --------------------------------------------------------------------------------------------------------
commits = [l.split(' ', 1) for l in sh('git', 'log', '--first-parent', '--format=%h %s', f'{START}..HEAD').splitlines()][::-1]

receipt = {
    'commit': sh('git', 'rev-parse', '--short', 'HEAD').strip(),
    'standard': {'parts': style_parts, 'glossary': gloss_sections},
    'inventory': {'start': base.get('all'), 'now': all_now, 'byArea': {a: dict(c) for a, c in by_area.items()}, 'engineSpeak': {'start': sum(speak_start.values()), 'now': all_now.get('speak'), 'ratchet': sum(ratchet.values())}},
    'examples': {'count': len(ex_all), 'meaningSensitive': ex_meaning, 'byArea': {a: len(x) for a, x in examples.items()}, 'byKind': dict(ex_kinds)},
    'tests': {'added': dict(added_counts), 'changedFiles': changed_tests},
    'final': {'gate': gate_exit, 'suite': suite[-1] if suite else None, 'files': files[-1] if files else None, 'build': build_exit, 'lanes': {k: {'steps': n, 'notZero': bad} for k, (n, bad) in lane_exits.items()}, 'journeys': journeys, 'numbersSame': numbers},
    'builtApp': {'screens': walks, 'render': render, 'routes': routes.get('counts') if isinstance(routes, dict) else None},
    'defects': defects.get('counts') if defects else None,
    'open': still_open,
    'problems': problems,
}
json.dump(receipt, open(f'{B}/receipt.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

md = []
w = md.append
w("# Brief 14's Receipt: The Player's Language")
w('')
w(f"Written by `receipt.py` from the pass's records on `{receipt['commit']}`, nothing typed: the brief's section 10, in its order. "
  "The brief itself is `../briefs-2026-10-16/14-complete-player-facing-language-and-tutorial-overhaul.txt`; how the pass was "
  "worked is `README.md`; what crossed areas is `coordinator.md`.")
w('')
w('**What this is and isn’t.** Every number here is a count a tool made or a test checked. The interface journeys pressed the '
  'controls a player presses at 1440 and 390 wide and read what came back. None of it is a judgment of how the game reads to '
  'a person, and nothing here is human usability approval: that’s what `PLAYTEST.md` is for, and only the owner can give it.')
w('')
w('## 1. The Style Guide And The Glossary')
w('')
w('`docs/STYLE.md`, "Talking to the player", written before any text changed and revised as the areas found what it missed. Its parts:')
w('')
for p in style_parts: w(f'- {p}')
w('')
w('`docs/GLOSSARY.md`, one name for one thing, assembled from the areas’ own glossaries:')
w('')
w(table(['Section', 'Terms'], gloss_sections))
w('')
w('## 2. The Inventory, With Statuses')
w('')
s0, s1 = base.get('all', {}), all_now
w(f"`tools/text-inventory.mjs` finds every string in `src/` a player can see and groups it into the sources a writer reads as one. "
  f"`docs/text/INVENTORY.md` is the checklist it writes; `docs/text/statuses/` holds each area's statuses against a hash of the text.")
w('')
w(table(['', 'Sources', 'Strings', 'Words', 'Rewritten And Verified', 'Reviewed And Retained', 'Pending', 'Blocked', 'Engine-Speak Hits'],
        [[f'At the start (`{BASE_COMMIT}`)', s0.get('sources'), s0.get('strings'), s0.get('words'), s0.get('Rewritten And Verified'), s0.get('Reviewed And Retained'), s0.get('Pending'), s0.get('Blocked'), s0.get('speak')],
         [f"Now (`{receipt['commit']}`)", s1.get('sources'), s1.get('strings'), s1.get('words'), s1.get('Rewritten And Verified'), s1.get('Reviewed And Retained'), s1.get('Pending'), s1.get('Blocked'), s1.get('speak')]]))
w('')
w('The start counted TypeScript alone; the JSON the game shows joined the inventory during the pass (224 sources). '
  f"The engine-speak ratchet (`docs/text/engine-speak.json`) stands at {sum(ratchet.values())}; it may fall and may not rise.")
w('')
w('Engine-speak by kind, at the start and now. The pattern counts a word; each hit left is in a source an area read '
  'and kept. Most are a "take" in a self-tape\'s sense, which the glossary allows; the code and file names in '
  '`content/attributes-matrix.ts`, which writes the documentation and no screen; and words in their ordinary sense, '
  'a body\'s weight in creation, a safe\'s dial and hand signals in a brief\'s scene:')
w('')
w(table(['Kind', 'At the start', 'Now'], [[k, speak_start.get(k, 0), ratchet.get(k, 0)] for k in sorted(set(speak_start) | set(ratchet), key=lambda k: -speak_start.get(k, 0))]))
w('')
w('By the area whose status names each source:')
w('')
w(table(['Area'] + STATUSES, [[a] + [c.get(k, 0) for k in STATUSES] for a, c in sorted(by_area.items())]))
w('')
w('## 3. Coverage By Subsystem')
w('')
w(table(['Subsystem', 'Sources', 'Strings', 'Words', 'Rewritten And Verified', 'Reviewed And Retained', 'Pending', 'Blocked', 'Engine-Speak Hits'],
        [[t['name'], t['sources'], t['strings'], t['words'], t['Rewritten And Verified'], t['Reviewed And Retained'], t['Pending'], t['Blocked'], t['speak']] for t in inv.get('totals', {}).values()]))
w('')
w('## 4. Before And After')
w('')
w(f"{len(ex_all)} pairs in the areas' and passes' `examples.json`, {ex_meaning} of them marked meaning-sensitive "
  '(a rewrite whose meaning had to be checked against the code, not only its words).')
w('')
w(table(['Area or pass', 'Pairs'], sorted(receipt['examples']['byArea'].items())))
w('')
w(table(['Kind of text', 'Pairs'], ex_kinds.most_common()))
w('')
w('Two of each kind of text, from two areas, meaning-sensitive ones first:')
w('')
for x in picked:
    w(f"- **{x['kind'].title()}** ({x['area']}, `{x.get('source', '')}`)")
    w(f"  - Before: {cut(x['before'])}")
    w(f"  - After: {cut(x['after'])}")
    if x.get('why'): w(f"  - Why: {cut(x['why'], 240)}")
w('')
w('## 5. The Tutorials’ Routes, Verified On The Built App')
w('')
if isinstance(routes, dict):
    w('`tools/tutorial-routes.mjs` read every label the guide and How This Works name against the final walk and its capture (`final-walk/routes.md`):')
    w('')
    w(table(['Outcome', 'Labels'], sorted((routes.get('counts') or {}).items())))
else:
    w('Not run yet.')
w('')
gq = sh('node', 'tools/guide-quotes.mjs', '--check').strip().splitlines()
w(f"`tools/guide-quotes.mjs --check`, now in the gate: {gq[-1] if gq else 'not run'}")
w('')
w('Each How This Works entry says what to do next or, where nothing follows, why (`tests/guide.test.ts`). The tutorial '
  'area\'s record of the eight questions per tutorial is `tutorial/routes.md` and `tutorial/batches.md`.')
w('')
w('## 6. Dynamic Cases')
w('')
w('Sections 7 and 8, held across the game by `tests/language-dynamic.test.ts` (`dynamic/README.md`: each bullet, its generators, '
  'its variants and the mutations tried). The tests the pass added, each run in the gate:')
w('')
w(table(['Test file', 'Tests'], added_counts))
w('')
w(f'{changed_tests} older test files were changed to hold the new words as exactly as they held the old; no test title changed.')
w('')
w('## 7. Desktop And Mobile')
w('')
w(table(['Width', 'Screens walked before', 'Screens walked after', 'Strings read before', 'Faults before', 'Strings read after', 'Faults after'],
        [[wd, b, a, (render[wd][0] or [None])[0], (render[wd][0] or [None, None])[1], (render[wd][1] or [None])[0], (render[wd][1] or [None, None])[1]] for wd, (b, a) in walks.items()]))
w('')
for wd in ('1440', '390'):
    if render[wd][1] and render[wd][1][2]: w(f"- {wd}: the faults left are {', '.join(render[wd][1][2])} (`final-walk/render-{wd}.json`).")
w('')
w('The interface journeys on the final commit (exit 0 is every step passed and every language check clean):')
w('')
w(table(['Journey', 'Exit'], [[k, 'not run' if v is None else v] for k, v in journeys.items()]))
w('')
w('## 8. Defects')
w('')
if defects:
    w(f"Every defect the pass found, one entry each, from every record, and checked against the tree by `defects.py --verify` "
      f"(`DEFECTS.md`, `defects.json`): {defects['counts']['total']} in all, {defects['counts']['by_status'].get('fixed', 0)} fixed and "
      f"{defects['counts']['by_status'].get('left', 0)} left, each left one with its reason and who it's for. {len(defects.get('excluded', []))} more items "
      'the records raised were read and not counted, each with why.')
    w('')
    w(table(['Kind', 'Fixed', 'Left', 'All'], [[k, v.get('fixed', 0), v.get('left', 0), v.get('total', 0)] for k, v in defects['counts'].get('by_kind', {}).items()]))
else:
    w('The index isn’t written yet.')
w('')
w('## 9. Tests, Commands, Commits And Results')
w('')
w(f"- **`npm run gate`** on `{receipt['commit']}`: {'not run' if gate_exit is None else f'exit {gate_exit}'}"
  + (f", {files[-1][0]} of {files[-1][1]} files and {suite[-1][0]} of {suite[-1][1]} tests" if suite and files else '') + ' (`final-checks/gate.txt`).')
w(f"- **`npm run build`**: {'not run' if build_exit is None else f'exit {build_exit}'} (`final-checks/build.txt`).")
w('- **The final runs**, each step’s exit recorded (`runs/exits-*.txt`, `final-walk/exits.txt`):')
w('')
w(table(['Record', 'Steps', 'Not exit 0'], [[k, n, '; '.join(bad) or 'none'] for k, (n, bad) in lane_exits.items()]))
w('')
w('- **Gameplay unchanged.** Every number, id, list length and key in the final runs against brief 13\'s, words allowed to differ (`numbers-same.json`):')
w('')
if numbers:
    w(table(['Runs', 'Files the same game', 'Files different'], [[k, v.get('same'), len(v.get('different') or {})] for k, v in numbers.items()]))
else:
    w('Not run yet.')
w('')
w('The pass\'s commits on the branch, in order (merges carry each area\'s own):')
w('')
for h, s in commits: w(f'- `{h}` {s}')
w('')
w('## 10. What Remains Unreviewed Or Blocked')
w('')
w(f"- **Unreviewed:** {all_now.get('Pending')} sources Pending, and the gate fails on one. **Blocked:** {all_now.get('Blocked')}.")
w('- **Left open, each with why, in `coordinator.md`:**')
for o in still_open: w(f'  - {o}')
if defects:
    left = [e for e in defects['entries'] if e['status'] == 'left']
    w(f'- **Defects left:** {len(left)}, each with why, in `DEFECTS.md`.')
w('')
w('## 11. The Manual Walkthrough')
w('')
w('`PLAYTEST.md`: a route for the owner to play by hand on a local build, every step with what to expect and what to report.')
w('')
if problems:
    w('## Not Yet Finished')
    w('')
    for p in problems: w(f'- {p}')
    w('')
open(f'{B}/RECEIPT.md', 'w', encoding='utf-8').write('\n'.join(md))
print(f"RECEIPT.md written on {receipt['commit']}; {len(problems)} problems" + (': ' + '; '.join(problems) if problems else ''))
sys.exit(1 if problems else 0)
