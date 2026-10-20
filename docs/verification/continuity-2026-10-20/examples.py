"""
Before and after from actual play (brief 17, section 12: "Before/after examples from actual gameplay"): the same student
on the same seed, before (`bbb82253`, brief 16 as merged) and after, the same event on the same day set side by side.
Play is the same up to each run's first divergence (`same-play.py`), so a showing of one course on one day is the same
showing on both sides, and only its words differ. Nothing here is typed: each pair is found in the runs by what the
before side said, the phrases the owner's brief named first.

    python3 docs/verification/continuity-2026-10-20/examples.py <before dir> <after dir> > examples.md
"""
import json, os, re, sys
from collections import defaultdict

before, after = sys.argv[1], sys.argv[2]
names = sorted(f[:-5] for f in os.listdir(before) if f.endswith('.json') and not f.startswith('summary'))
# What to look for on the before side: the brief's own examples first, then the kinds of message it names.
WANT = [
    ('The note is “taken at 75%”', r'taken at \d+%'),
    ('A fourth time for the note on …', r'(?:A|An) \w+ time for the note on'),
    ('“At Unready, this is the part that fell shortest”', r'At Unready, this is the part'),
    ('“Meanwhile, try this”', r'Meanwhile, try this'),
    ('A card label as a prose subject', r'the note on [A-Z][a-z]+ [A-Z]'),
    ('A part named twice', r'held it back most\. The '),
    ('Strong despite the day, at a point or two', r'(?:came out \w+|Strong, even) though your \w+ ran low'),
]
out = ['# Before And After, From Play', '',
       'Each pair is one event on one day of one student on one seed, before (`bbb82253`) and after. Found by '
       '`examples.py` from the runs, never typed.', '']
seen = set()   # a pair already shown, from another seed whose first months play the same
for label, pat in WANT:
    out += [f'## {label}', '']
    shown = 0
    for n in names:
        b = json.load(open(os.path.join(before, f'{n}.json'), encoding='utf-8'))
        a = json.load(open(os.path.join(after, f'{n}.json'), encoding='utf-8'))
        by = defaultdict(list)
        for x in a['said']:
            if x['kind'] == 'showing': by[(x['at'], x.get('course'), x.get('piece'))].append(x)
        for x in b['said']:
            if x['kind'] != 'showing' or not re.search(pat, x['text']): continue
            twin = by.get((x['at'], x.get('course'), x.get('piece')))
            if not twin or x['text'] in seen: continue
            seen.add(x['text'])
            out += [f"**{n}, {x['at']}, {x.get('course')}, {x.get('piece')} ({x.get('band')})**", '',
                    f"- Before: {x['text']}", f"- After: {twin[0]['text']}", '']
            shown += 1
            break
        if shown >= 3: break
    if not shown: out += ['None in these runs.', '']
# The class and the directors: the same moment's day and classmate, and the same production's call.
out += ['## The Class, Speaking', '']
for n in names[:24]:
    b = json.load(open(os.path.join(before, f'{n}.json'), encoding='utf-8'))
    a = json.load(open(os.path.join(after, f'{n}.json'), encoding='utf-8'))
    am = {(x['at'], x.get('mate'), x.get('note')): x for x in a['said'] if x['kind'] == 'moment'}
    k = 0
    for x in b['said']:
        if x['kind'] != 'moment' or x.get('note') not in ('help', 'study', 'apology', 'disagreement'): continue
        y = am.get((x['at'], x.get('mate'), x.get('note')))
        if not y or y['text'] == x['text']: continue
        out += [f"**{n}, {x['at']}, a {x.get('note')}**", '', f"- Before: {x['text']}", f"- After: {y['text']}", '']
        k += 1
        if k >= 2: break
    if len([l for l in out if l.startswith('**') and 'a help' in l or 'a study' in l]) > 8: break
out += ['## Directors', '']
for n in names:
    b = json.load(open(os.path.join(before, f'{n}.json'), encoding='utf-8'))
    a = json.load(open(os.path.join(after, f'{n}.json'), encoding='utf-8'))
    ad = defaultdict(list)
    for x in a['said']:
        if x['kind'] == 'director': ad[(x['at'], x.get('speaker'))].append(x)
    k = 0
    for x in b['said']:
        if x['kind'] != 'director': continue
        y = ad.get((x['at'], x.get('speaker')))
        if not y or y[0]['text'] == x['text']: continue
        out += [f"**{n}, {x['at']}, {x.get('speaker')}**", '', f"- Before: {x['text']}", f"- After: {y[0]['text']}", '']
        k += 1
        if k >= 2: break
    if sum(1 for l in out if l.startswith('**') and 'director:' in l) >= 6: break
print('\n'.join(out))
