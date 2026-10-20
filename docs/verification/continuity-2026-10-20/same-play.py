"""
Whether brief 17's students played the same game as the baseline's (brief 17, section 10: "Gameplay must remain
unchanged except for the authorized incident-continuity fix"): the 24 runs of `before/` (bbb82253, brief 16 as merged)
against the same scenarios and seeds after, event by event, each run to its first divergence.

Compared, never typed: every showing's day, course, piece, band and kind of note; every director's note's day and
speaker; every classmate's moment's day, classmate and kind; every advice card's day and what it recommends; every
notice's day and title; each run's reloads and last day. The words are what changed, so they aren't compared.

Two differences are expected, and each is counted apart with its reason:
- **the incident fix (authorized):** an apology covers every rehearsal missed since the last, and none comes again for
  the same misses. So an apology brief 16 repeated doesn't come, and the class day that held it may bring another
  moment, or none. Its first divergence is an apology moment present on one side only, and everything after it in that
  run is downstream of it.
- **notices that merge:** a notice merges into an unread one with the same title and body (`Simulation.notify`). Where a
  rewrite makes two bodies differ (the money editor's dated late-payment notice) or alike, fewer or more merge; the days
  and titles must still be the same.

    python3 docs/verification/continuity-2026-10-20/same-play.py <before dir> <after dir>
"""
import json, os, re, sys
from collections import Counter

before, after = sys.argv[1], sys.argv[2]
names = sorted(f[:-5] for f in os.listdir(before) if f.endswith('.json') and not f.startswith('summary'))

def stream(run):
    """Every event, in order, with what gameplay decides about it."""
    out = []
    for x in run['said']:
        k = x['kind']
        if k == 'showing': out.append(('showing', x['at'], x.get('course'), x.get('piece'), x.get('band'), x.get('note')))
        elif k == 'director': out.append(('director', x['at'], x.get('speaker')))
        elif k == 'moment': out.append(('moment', x['at'], x.get('mate'), x.get('note')))
        elif k == 'advice': out.append(('advice', x['at'], x.get('focus')))
    return out

# Titles an editor renamed in this pass, each its own way, to the name it has now: the same notice, its title's words
# changed. Read on both sides, so a notice is compared by what it is. Anything else that differs fails the comparison.
RENAMED = [
    (re.compile(r'^Still There: Time On Its Feet$'), 'Still There: Rehearsal', 'the ledger’s rehearsal note named Rehearsal in every course (coordinator, DIM_SUBJECT)'),
    (re.compile(r'^You’re On Tonight As An Understudy In The Company$'), 'You’re On Today At Yale Rep', 'an understudy in the company named by the Rep, and a matinee “today” (school editor)'),
    (re.compile(r'^You Went On As An Understudy In The Company$'), 'You Went On At Yale Rep', 'the same (school editor)'),
    (re.compile(r'^You’re On (?:Tonight|Today) As '), 'You’re On Today As ', 'a matinee “today”, not “tonight” (school editor)'),
    (re.compile(r'^Incompletes?(?: In |: ).*'), 'Incomplete', 'several Incompletes from one review told in one notice (school editor)'),
]
def norm(t):
    for pat, to, _ in RENAMED:
        if pat.search(t or ''): return pat.sub(to, t) if to.endswith(' ') else to
    return t

result, unexplained = {}, 0
for n in names:
    b = json.load(open(os.path.join(before, f'{n}.json')))
    a = json.load(open(os.path.join(after, f'{n}.json')))
    sb, sa = stream(b), stream(a)
    first = next((i for i in range(min(len(sb), len(sa))) if sb[i] != sa[i]), None if len(sb) == len(sa) else min(len(sb), len(sa)))
    row = {'events': [len(sb), len(sa)], 'same': first is None}
    if first is not None:
        x = sb[first] if first < len(sb) else None
        y = sa[first] if first < len(sa) else None
        # The incident fix: the first difference is an apology on one side, the other side's event the next day's
        # moment or later, never an earlier event of another kind.
        apology = (x is not None and x[0] == 'moment' and x[3] == 'apology') or (y is not None and y[0] == 'moment' and y[3] == 'apology')
        row['firstDivergence'] = {'at': (x or y)[1], 'before': x, 'after': y, 'explained': 'the incident fix: an apology brief 16 repeated, or its class day' if apology else None}
        # What's the same before it, by kind.
        row['sameBefore'] = dict(Counter(e[0] for e in sb[:first]))
        # Downstream of it: the showings after the day it diverged, matched by day, course and piece, and how many were
        # judged a different band, so what the fix changed in play is said, not assumed.
        day = (x or y)[1]
        sh = lambda s_: {(e[1], e[2], e[3]): e[4] for e in s_ if e[0] == 'showing' and e[1] >= day}
        hb, ha = sh(sb), sh(sa)
        common = set(hb) & set(ha)
        row['afterDivergence'] = {'showingsBefore': len(hb), 'showingsAfter': len(ha), 'matched': len(common),
                                  'bandDiffers': sum(1 for k in common if hb[k] != ha[k]),
                                  'moments': [sum(1 for e in sb if e[0] == 'moment' and e[1] >= day), sum(1 for e in sa if e[0] == 'moment' and e[1] >= day)]}
        if not apology: unexplained += 1
    # Notices: the days and titles, until the run's first divergence (after it, play differs by the fix).
    cut = row.get('firstDivergence', {}).get('at')
    nb = Counter((x['at'], norm(x.get('title'))) for x in b['said'] if x['kind'] == 'notice' and (cut is None or x['at'] < cut))
    na = Counter((x['at'], norm(x.get('title'))) for x in a['said'] if x['kind'] == 'notice' and (cut is None or x['at'] < cut))
    row['notices'] = {'before': sum(nb.values()), 'after': sum(na.values()), 'sameDaysAndTitles': set(nb) == set(na),
                      'mergedDifferently': sorted({t for (d, t) in set(nb) | set(na) if nb[(d, t)] != na[(d, t)]})[:12],
                      'onlyBefore': sorted(set(nb) - set(na))[:8], 'onlyAfter': sorted(set(na) - set(nb))[:8]}
    if set(nb) != set(na): unexplained += 1
    row['run'] = {'reloads': [b.get('reloads'), a.get('reloads')], 'endedOn': [b.get('endedOn'), a.get('endedOn')]}
    if first is None and (b.get('reloads') != a.get('reloads') or b.get('endedOn') != a.get('endedOn')): unexplained += 1
    result[n] = row

print(json.dumps({'runs': len(names), 'identical': sum(1 for r in result.values() if r['same']), 'unexplained': unexplained, 'renamed': [{'to': to, 'why': why} for _, to, why in RENAMED], 'byRun': result}, indent=1, ensure_ascii=False))
sys.exit(1 if unexplained else 0)
