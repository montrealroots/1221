"""
Whether brief 16's students played the same game as the baseline's (brief 16, section 10: "Narrative variation does not
change gameplay results"): the seven students of `before/` against the same seeds after, event by event. Every showing's
day, course, piece, band and kind of note; every director's note's day and speaker; every classmate's moment's day and
speaker; every notice's day and title; each run's reloads and its last day. The words are what changed, so they aren't
compared, with two kinds of notice apart: a notice merges into an unread one with the same title and body
(`Simulation.notify`), so where a repeat now says it's a repeat (brief 16), fewer merge; those are counted, by title.

    python3 docs/verification/voices-2026-10-20/same-play.py before/ after/
"""
import json, os, sys
from collections import Counter

before, after = sys.argv[1], sys.argv[2]
SCEN = ['attentive', 'underprepared', 'improving', 'regressing', 'skilled', 'pressure', 'practicing']
out, bad = {}, 0
for s in SCEN:
    b = json.load(open(os.path.join(before, f'{s}.json')))
    a = json.load(open(os.path.join(after, f'{s}.json')))
    def events(run, kind, keys):
        return [tuple(x.get(k) for k in keys) for x in run['said'] if x['kind'] == kind]
    row = {}
    for kind, keys in [('showing', ['at', 'course', 'piece', 'band', 'note']), ('director', ['at', 'speaker']), ('moment', ['at', 'speaker']), ('advice', ['at', 'note'])]:
        eb, ea = events(b, kind, keys), events(a, kind, keys)
        row[kind] = {'before': len(eb), 'after': len(ea), 'same': eb == ea}
        if eb != ea: bad += 1
    nb = Counter((x['at'], x.get('title')) for x in b['said'] if x['kind'] == 'notice')
    na = Counter((x['at'], x.get('title')) for x in a['said'] if x['kind'] == 'notice')
    # A notice that merged into an unread one isn't said again, so a title on a day may appear fewer or more times;
    # the days and titles themselves must be the same.
    row['notice'] = {'before': sum(nb.values()), 'after': sum(na.values()), 'sameDaysAndTitles': set(nb) == set(na),
                     'mergedDifferently': sorted({t for (d, t) in set(nb) | set(na) if nb[(d, t)] != na[(d, t)]})}
    if set(nb) != set(na): bad += 1
    row['run'] = {'reloads': [b['reloads'], a['reloads']], 'endedOn': [b['endedOn'], a['endedOn']]}
    if b['reloads'] != a['reloads'] or b['endedOn'] != a['endedOn']: bad += 1
    out[s] = row
print(json.dumps({'differences': bad, 'scenarios': out}, indent=1, ensure_ascii=False))
sys.exit(1 if bad else 0)
