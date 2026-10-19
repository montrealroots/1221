"""
Brief 15's defects, one entry each, apart from the editorial changes (section 12: "gameplay defects discovered separately
from editorial changes"). Every area kept its own `defects.md`; this is their index, with the coordinator's own finds.
For each entry: its kind, whether it's fixed or left, and, if left, why and who it's for.

    python3 docs/verification/editorial-2026-10-19/defects.py

Each entry names the record it comes from, and `--verify` checks every record still holds its heading, so the index
can't drift from the records. It writes defects.json and DEFECTS.md beside itself.

Kinds:
- **words:** a sentence that said something untrue, or a figure wrong, in what the game shows. The game did the right
  thing; the sentence didn't say it.
- **behavior:** the game does something its own words, its data or the law it models say it shouldn't.
- **data:** a figure or a rule in the research data that its own source contradicts.
- **layout:** what a screen shows clipped, crushed or covered at a width.
- **accessibility:** what a screen reader or a keyboard is told.
- **unwired:** code or content nothing reads.
"""
import json, os, re, sys
from collections import Counter

B = 'docs/verification/editorial-2026-10-19'
E = []
def d(area, ref, title, kind, status, where='', why='', who=''):
    E.append({'id': f'{area}-{ref}', 'area': area, 'record': f'{area}/defects.md', 'heading': ref, 'title': title,
              'kind': kind, 'status': status, 'where': where, 'why': why, 'who': who})

# frame
d('frame', '1. Before Yale Said', 'Before Yale said the savings stayed, and that the account kept there opened empty, when neither was true', 'words', 'fixed', 'ui/creation/CharacterCreation.tsx')
d('frame', '2. A Search In A Country', 'A search in a country with no towns printed empty quotes', 'words', 'fixed', 'ui/creation/LocationPicker.tsx')
# health
d('health', '1. **A body at its mark', 'A body at its mark was told what happens above it', 'words', 'fixed')
d('health', '2. **The Morale look', 'The Morale look contradicted itself at 62', 'words', 'fixed')
d('health', '3. **A lost appeal', 'A lost appeal was titled "Appeal Upheld"', 'words', 'fixed')
d('health', '4. **The booking notice', 'The booking notice named a date and no next step', 'words', 'fixed', 'systems/appointments.ts', 'fixed by the coordinator at the health merge, with the papers guide\'s quote')
d('health', '5. **Cambodia', 'Cambodia\'s currency was "Riels"', 'words', 'fixed', 'tools/build-world-data.mjs, content/world-data.ts', 'fixed by the coordinator')
d('health', '6. **A place', 'A place\'s "What it\'s known for" read adjectives as things', 'words', 'fixed', 'ui/looks/place.tsx', 'fixed by the coordinator')
d('health', '7. **Readiness at its ceiling', 'Readiness at its ceiling still named a measure "pulling readiness down"', 'words', 'fixed')
# material-a
d('material-a', '1. **Handover At Seven', 'A medical brief said the opposite of its scene', 'words', 'fixed', 'content/briefs/briefs-d.ts')
d('material-a', '2. **Level One, Again', 'A brief promised words the pane doesn\'t show', 'words', 'fixed', 'content/briefs/briefs-c.ts')
d('material-a', '3. **A Table Work note', 'A Table Work note gave the reason without the answer it was about', 'words', 'fixed', 'systems/coursework.ts', 'fixed by the coordinator')
# material-b
d('material-b', '1. **Room Three Opens At Seven', 'A brief\'s circumstances said what its scene doesn\'t', 'words', 'fixed', 'content/briefs/second-d.ts')
d('material-b', '2. **Berth Fifteen', 'A beat said something its scene doesn\'t', 'words', 'fixed', 'content/briefs/second-c.ts')
d('material-b', '3. **The Warm Walls', 'A brief\'s arc read as the opposite of its scene', 'words', 'fixed', 'content/briefs/second-b.ts')
d('material-b', '4. **Ahead Of The Sweep Bus', 'A brief\'s arc said the chase was called off where it isn\'t', 'words', 'fixed', 'content/briefs/second-a.ts')
d('material-b', '5. **The arc is shown twice', 'A brief pane said its arc twice', 'words', 'fixed', 'ui/components/BriefPane.tsx', 'fixed by the school area')
d('material-b', '6. **One count, two names', 'One count, two names on one pane', 'words', 'fixed', 'ui/components/PlayingChooser.tsx', 'fixed by the school area')
# money
d('money', 'm1. Two Move Money refusals', 'Two Move Money refusals, and the hint above them, named a limit rounded to whole units', 'words', 'fixed', 'systems/banking.ts, ui/workspaces/BankWorkspace.tsx')
d('money', 'm2. A charge-off', 'A charge-off was said to stay on the record "until it\'s paid"', 'words', 'fixed', 'ui/bank/BankLending.tsx, docs/GLOSSARY.md', 'the glossary row fixed by the coordinator')
# money-data
d('money-data', '1. The US refund law', 'The US refund law said "out-of-state" for "not initiated within a state"', 'words', 'fixed', 'content/security.ts')
d('money-data', '2. Field names on the screen', 'Field names on the screen', 'words', 'fixed', 'content/security.ts')
d('money-data', '3. Card replacement fees', 'Card replacement fees where the bank\'s own words, in the same data, say otherwise', 'data', 'left', 'content/security.ts',
  'each changes a fee the game charges, and some need a choice (does a faulty card count as lost?); brief 15 changes no charge (section 9)', 'the owner')
d('money-data', '4. A rush that costs nothing', 'A rush that costs nothing was said as "$0.00 more"', 'words', 'fixed', 'ui/bank/BankSecurity.tsx', 'fixed by the coordinator')
d('money-data', '5. A bank\'s note about its debit card', 'A bank\'s note about its debit card shown under its credit card', 'data', 'left', 'ui/bank/BankSecurity.tsx, content/security.ts',
  'the words now say which card a note is about; a note for each card is a change to the data\'s shape', 'the owner')
d('money-data', '6. Unclaimed money', 'Unclaimed money\'s destination printed as a clause', 'words', 'fixed', 'content/accountlife.ts')
d('money-data', '7. Claim It Back', 'Claim It Back gives money back where the country\'s law says it can\'t be claimed', 'behavior', 'left', 'systems/accountlife.ts',
  'a change to what a command does; the words say what the law is', 'the owner')
d('money-data', '8. Australia', 'Australia\'s unclaimed money: any balance goes, where the law takes A$500 or more', 'behavior', 'left', 'systems/accountlife.ts',
  'a rule change; the words say A$500', 'the owner')
d('money-data', '9. Term deposit penalties', 'Term deposit penalties estimated where the bank publishes a rule', 'behavior', 'left', 'systems/accountlife.ts',
  'the screen labels the figure estimated, so nothing untrue is said; modelling each bank\'s rule is new work', 'the owner')
d('money-data', '10. BMO', 'BMO\'s notice for a change at the end may be the other way round', 'data', 'left', 'content/accountlife.ts',
  'a question for the research: which way BMO\'s terms mean it needs them read again', 'the owner')
d('money-data', '11. "Current account"', '"Current account" in the game\'s sentence about a term deposit\'s end', 'words', 'fixed', 'systems/accountlife.ts', 'fixed by the money area')
# papers
for n, t in [(1, 'Every passport\'s arrival said a travel authorization had ended'), (2, 'A visit\'s name was lowercased whole, acronyms too'),
             (3, 'A missed visa interview promised a step the game no longer has'), (4, 'A lien only announced, or announced and never filed, said it had been filed and recorded'),
             (5, 'A document reported stolen said "You reported it lost"'), (6, 'The guide said Connecticut\'s ID card shows Being Decided until it comes'),
             (7, 'The Social Security panel said the ITIN "holds up the return for seven weeks"'), (8, 'The IRS plan panel said a monthly plan "is approved online"'),
             (9, '"Paid by you" under a plan\'s Each Month, beside "By direct debit"'), (10, 'A UK tax year "settles on January 31 2028", with no comma')]:
    d('papers', f'{n}. **', t, 'words', 'fixed')
d('papers', '11. **`residenceRefusal`', '`residenceRefusal` has no caller', 'unwired', 'left', 'systems/documents.ts',
  'removing code is a scope decision, not a writing one', 'the owner')
d('papers', '12. **The US passport', 'The US passport\'s fee basis ended on a fragment', 'words', 'fixed', 'tools/build-passports.mjs', 'fixed by the coordinator')
d('papers', '13. **`licensepaths.ts`', '`licensepaths.ts` and most of `licenses.ts` reach no screen', 'unwired', 'left', 'content/licensepaths.ts, content/licenses.ts',
  'deleting them is a scope decision, as in brief 14', 'the owner')
# profile
d('profile', 'D1. The advice sent', 'The advice sent a technique\'s exercise to the wrong panel', 'words', 'fixed', 'systems/next-steps.ts')
d('profile', 'D2. Three of the advice', 'Three of the advice\'s dynamic variants printed nonsense', 'words', 'fixed', 'systems/next-steps.ts')
# school
for n, t in [(1, 'A remedy named a button the card never shows'), (2, '"Lines wasn\'t complete."'), (3, '"By the Close."'), (4, '"The month to make it up ran out."'),
             (5, 'A rehearsal "moved"'), (6, 'The library refusal after the School'), (7, '"1 woman and 0 men."'), (8, 'The guide said make-up sessions are booked'),
             (9, 'A fit\'s reason in brackets'), (10, '"Register on the School screen."'), (11, 'A missed-call warning to a student already out of the pool'),
             (12, '"The Standing tab."'), (13, '"In speech, and accents and dialects."'), (14, '"1 h 40" in a sentence'), (15, '"Classes don\'t count your attendance."'),
             (16, '"The savings beside it."'), (17, 'Garbled reasons in What It Asks'), (18, '"Of the whole piece."'), (19, '"Classes don\'t count you."')]:
    d('school', f'{n}. **', t, 'words', 'fixed')
# tutorial
d('tutorial', '1. How This Works\' Show Everything Toggle', 'How This Works\' toggle changed its name and said it was pressed', 'accessibility', 'fixed', 'ui/guide/Help.tsx')
d('tutorial', '2. How You Are Said', 'How You Are said an injury wore condition down', 'words', 'fixed', 'content/tutorial.ts')
d('tutorial', '3. Cover, Benefits And Returns', 'A chapter sent the player to a button that isn\'t there', 'words', 'fixed', 'content/tutorial.ts')
d('tutorial', '- **A new life\'s top bar', 'At 390 wide the top bar broke Locked letter by letter, and the clock covered Guide', 'layout', 'fixed', 'styles/app.css', 'fixed by the coordinator, checked on the build (coordinator-phone/)')
d('tutorial', '- **The guide dialog at 390', 'At 390 wide the guide left a long chapter about 250 pixels to read in', 'layout', 'fixed', 'styles/app.css', 'fixed by the coordinator, checked on the build')
d('tutorial', '- **A long-term condition left untreated', 'A long-term condition left untreated said "Left Alone"', 'words', 'fixed', 'ui/workspaces/PapersWorkspace.tsx', 'fixed by the papers area')
# The coordinator's own, found at the cross-area review.
d('coordinator', 'advice', 'The advice said "off the whole a piece"', 'words', 'fixed', 'systems/experience.ts', 'crossarea.md; brief 14 wrote it')
d('coordinator', 'leave notice', 'A leave\'s notice named a panel where the booking notice names the button and the tab', 'words', 'fixed', 'systems/leave.ts', 'crossarea.md')
d('coordinator', 'inventory', 'The inventory didn\'t read a citation that began with a web address', 'unwired', 'fixed', 'tools/text-inventory.mjs', 'omissions.md')

# Read, and not counted, each with why.
EXCLUDED = [
    ('tutorial', 'Weather emoji on Home', 'the one picture systems/weather.ts keeps on purpose, beside its word and out of the accessible name; docs/STYLE.md now says so'),
    ('school', 'Functional Defects', 'the school area found none in its sources'),
]

def verify():
    bad = []
    for e in E:
        if e['area'] == 'coordinator': continue
        text = open(f"{B}/{e['record']}", encoding='utf-8').read()
        if e['heading'] not in text: bad.append(f"{e['id']}: “{e['heading']}” isn't in {e['record']}")
    return bad

problems = verify()
if '--verify' in sys.argv:
    for p in problems: print(p)
    print(f'{len(E)} entries; {len(problems)} not found in their records')
    sys.exit(1 if problems else 0)

by_status = Counter(e['status'] for e in E)
by_kind = {}
for e in E:
    k = by_kind.setdefault(e['kind'], Counter()); k[e['status']] += 1; k['total'] += 1
out = {'written': 'by defects.py, from each area\'s defects.md and the coordinator\'s records', 'counts': {'total': len(E), 'by_status': dict(by_status),
       'by_kind': {k: dict(v) for k, v in by_kind.items()}}, 'entries': E, 'excluded': [{'area': a, 'title': t, 'why': w} for a, t, w in EXCLUDED], 'problems': problems}
json.dump(out, open(f'{B}/defects.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

md = ['# Brief 15\'s Defects', '',
      'Every defect the pass found, apart from the editorial changes (brief 15, section 12), written by `defects.py` from each area\'s',
      '`defects.md` and the coordinator\'s records. Each entry says where its record is. `defects.py --verify` checks that every record',
      'still holds the heading it\'s indexed by.', '',
      f"{len(E)} in all: {by_status.get('fixed', 0)} fixed, {by_status.get('left', 0)} left. Every one left is for the owner: each would change what the",
      'game charges, does or keeps, which an editorial pass doesn\'t (section 9). Two of them are a sentence and the game disagreeing:',
      'Claim It Back and Australia\'s unclaimed money, where the words state the law and the game does otherwise. That gap is the defect,',
      'and the words weren\'t bent to match the game.', '',
      '| Kind | Fixed | Left | All |', '|---|---|---|---|']
for k, v in sorted(by_kind.items()):
    md.append(f"| {k} | {v.get('fixed', 0)} | {v.get('left', 0)} | {v['total']} |")
md += ['', '## Left, For The Owner', '']
for e in E:
    if e['status'] == 'left':
        md.append(f"- **{e['title']}** ({e['kind']}; `{e['where']}`; `{e['record']}`, {e['heading'].strip('*- ')}). {e['why'][0].upper() + e['why'][1:]}.")
md += ['', '## Fixed', '', '| Area | Defect | Kind | Where |', '|---|---|---|---|']
for e in E:
    if e['status'] == 'fixed':
        md.append(f"| {e['area']} | {e['title']}{' (' + e['why'] + ')' if e['why'] else ''} | {e['kind']} | {('`' + e['where'] + '`') if e['where'] else 'its record'} |")
md += ['', '## Read And Not Counted', '']
for a, t, w in EXCLUDED: md.append(f'- **{t}** ({a}): {w}.')
md.append('')
open(f'{B}/DEFECTS.md', 'w', encoding='utf-8').write('\n'.join(md))
print(f"DEFECTS.md: {len(E)} entries, {by_status.get('fixed', 0)} fixed, {by_status.get('left', 0)} left; {len(problems)} not found in their records")
sys.exit(1 if problems else 0)
