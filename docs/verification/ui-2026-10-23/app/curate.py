"""The images kept in the repository from a walk: the same pages and sizes before and after, so each pair compares.

  python3 docs/verification/ui-2026-10-23/app/curate.py WALK_OUT DEST

Copies from the walk's output (WALK_OUT/<group>/<life>/<size>/NN-step[-full].jpg) to DEST/<life>/<size>/step[-full].jpg,
the step number dropped (a step's number moved when Updates joined the rail).
"""
import glob, os, re, shutil, sys

src, dest = sys.argv[1], sys.argv[2]
ALL = None
KEEP = {
    # life: {size: (viewport steps, whole-page steps)}
    'released': {
        '1440x900': (ALL, ['home', 'updates', 'player-profile', 'calendar', 'school-standing-and-craft', 'career-work', 'money-accounts', 'papers-permission-to-work', 'papers-tax-returns']),
        '844x390m': (ALL, ['home', 'updates', 'player-profile', 'calendar', 'career-work', 'papers-permission-to-work']),
        '667x375m': (['home', 'navigation-open', 'career-overview', 'school-standing-and-craft', 'advance-menu', 'look-after-yourself-menu', 'sleep-dialog', 'how-this-works'], []),
        '932x430m': (['home', 'navigation-open', 'school-standing-and-craft', 'papers-permission-to-work'], []),
        '1280x720': (['home', 'career-work', 'calendar'], []),
        '1920x1080': (['home', 'career-work', 'calendar'], []),
        '1024x768': (['home'], []),
        '760x900': (['home', 'navigation-open'], []),
        '390x844m': (ALL, []),
    },
    'booked': {'1440x900': (['home', 'career-work', 'calendar'], ['home', 'career-work', 'calendar']), '844x390m': (['home', 'career-work', 'calendar'], ['career-work', 'calendar'])},
    'offer': {'1440x900': (['home', 'career-opportunities', 'papers-permission-to-work'], ['career-opportunities']), '844x390m': (['career-opportunities'], ['career-opportunities'])},
    'new': {'1440x900': (['home', 'player-profile', 'how-this-works'], ['home', 'player-profile']), '844x390m': (['home', 'player-profile'], ['home'])},
    'long': {'1440x900': (['home', 'player-profile', 'money-accounts'], []), '844x390m': (['home', 'money-accounts'], [])},
    'older': {'1440x900': (['home'], []), '844x390m': (['home'], [])},
    'developed': {'1440x900': (['home', 'school-coursework'], []), '844x390m': (['school-coursework'], [])},
    'graduate': {'1440x900': (['home'], []), '844x390m': (['home'], [])},
}
n = 0
for path in glob.glob(f'{src}/**/*.jpg', recursive=True):
    parts = path.split(os.sep)
    life, size, name = parts[-3], parts[-2], parts[-1]
    m = re.match(r'\d+-(.+?)(-full)?\.jpg$', name)
    if not m or life not in KEEP or size not in KEEP[life]: continue
    step, full = m.group(1), bool(m.group(2))
    views, wholes = KEEP[life][size]
    if (full and step in wholes) or (not full and (views is ALL or step in views)):
        os.makedirs(f'{dest}/{life}/{size}', exist_ok=True)
        shutil.copyfile(path, f'{dest}/{life}/{size}/{step}{"-full" if full else ""}.jpg'); n += 1
print(n, 'images to', dest)
