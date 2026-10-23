"""Brief 23's walk, before beside after: each size's measures from two summaries (summarize.py's), as a Markdown table.

  python3 docs/verification/ui-2026-10-23/app/compare.py BEFORE.json AFTER.json

A cell is "before → after". A step counts once under a measure however many things on it fail it.
"""
import json, sys

before, after = (json.load(open(f)) for f in sys.argv[1:3])
order = ['1280x720', '1440x900', '1920x1080', '1024x768', '760x900', '667x375m', '844x390m', '932x430m', '390x844m']
cols = [('steps', 'Steps'), ('pageWider', 'Page wider'), ('bleed', 'Past its card'), ('cut', 'Cut, no way to read'),
        ('cutTitled', 'Cut, titled'), ('squeezed', 'Squeezed'), ('clipped', 'Clipped'),
        ('stepsWithSmallTargets', 'Touch target under 44'), ('tabBarsHalfShownNoCue', 'Tab half-shown, no cue'),
        ('dialogsNotFitting', 'Dialog not fitting'), ('headerHeight', 'Bar height'), ('railShown', 'Rail shown'),
        ('rotateScreen', 'Rotate screen')]
name = lambda s: s.replace('m', ' phone').replace('x', '×') if s.endswith('m') else s.replace('x', '×')
print('| Size | ' + ' | '.join(c[1] for c in cols) + ' |')
print('|---' * (len(cols) + 1) + '|')
for size in order:
    b, a = before['sizes'].get(size), after['sizes'].get(size)
    if not a: continue
    # The 44 pixels are a touch screen's (WCAG 2.5.5); a desktop's mouse isn't held to them, so its cell says so.
    cell = lambda k: 'not asked' if k == 'stepsWithSmallTargets' and not size.endswith('m') else f"{(b or {}).get(k, '–') if b else '–'} → {a.get(k, '–')}".replace('[', '').replace(']', '')
    print(f'| {name(size)} | ' + ' | '.join(cell(k) for k, _ in cols) + ' |')
