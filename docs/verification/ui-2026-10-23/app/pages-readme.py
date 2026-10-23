"""The README of a set of `pages.mjs`'s images, read from its `pages.json` (the files, each page's headings, its clock),
never typed: each page under its moment, in the order taken, with the headings it showed.

  python3 docs/verification/ui-2026-10-23/app/pages-readme.py DIR desktop|phone
"""
import json, sys

d, kind = sys.argv[1], sys.argv[2]
rec = json.load(open(f'{d}/pages.json', encoding='utf-8'))
pages = [p for p in rec['pages'] if p.get('files')]
problems = [x for p in rec['pages'] for x in p.get('problems', [])]
wider = [p for p in pages if p.get('pageWider')]
rotate = [p for p in pages if p.get('rotate')]
parts = [p for p in pages if len(p['files']) > 1]
size = rec['size'].rstrip('m')
other = 'mobile/README.md' if kind == 'desktop' else '../README.md'
up = '../../' if kind == 'desktop' else '../../../'  # to docs/verification/ui-2026-10-23/
# What a page's headings can't say, from the images themselves.
SEEN = {
    'The Start': 'No save yet: three empty slots, each with New Save.',
    'Creation, Identity': 'Billed As Actress and New York picked as the place of birth; the rest as a new save sets it.',
    'Creation, Review': 'Ready To Begin.',
    'The Guide, Its First Chapter': 'A new life opens on it. The chapter is whole; the list of chapters beside it scrolls on its own, and shows what the window holds.',
    'Home, The Chapters Still To Read': 'The guide closed with Later: what a chapter not yet read opens is Locked, and says which chapter opens it.',
    'Your Saves': 'Slot 1 holds the save, with Continue. Its date and net worth read “—” and its time played 0s: `make-saves.ts` wrote it from the engine, and the game fills those in when it saves (`engine/index.ts`).',
    'How This Works': 'Opened from Home with ?.',
}
out = []
w = out.append
if kind == 'desktop':
    w("# Brief 23's Pages On The Built App, In The Order A Player Meets Them")
    w('')
    w(f'The same pages on a phone held on its side: `{other}`.')
    w('')
    w(f'Every page of the game, each captured whole, at the owner\'s word on 2026-10-23 ("Now let me get in chronological')
    w('order full captures of each full page from pc and mobile"). They were captured on the app built from `97404e70`, whose')
    w(f'`src` is brief 23\'s tested commit, `208dbf1f`. Each page is shown {size.replace("x", " by ")}, a desktop window, at twice the pixels.')
else:
    w("# Brief 23's Pages On A Phone Held On Its Side, In The Order A Player Meets Them")
    w('')
    w(f'The same {len(pages)} pages as `{other}`, at the owner\'s word on 2026-10-23 ("full captures of each full page from pc and')
    w(f'mobile"), on the same build. They\'re seen as a phone shows them held on its side, {size.replace("x", " by ")}, a touch screen with no')
    w('hover, at twice the pixels; upright, a phone shows only Rotate Your Phone To Play since brief 23. The menu is opened')
    w('through Menu and closed again before each page is taken.')
w('')
w('Each page is captured at the window\'s own size, so it is set out for that window and never for a taller one: the bar')
w('once, then what scrolls (the page, or a dialog\'s body) a window at a time, then the part below it (a dialog\'s foot),')
w('joined.' + (' The menu down the left doesn\'t scroll, so it stands beside the first window only.' if kind == 'desktop' else ''))
w('Toasts were hidden while a page was taken, since one would repeat down every window. A page taller than 12,000 of the')
w('image\'s pixels is in parts, each overlapping the one before it by 300, so nothing falls between them.')
w('')
w(f'The script, `{up}app/pages.mjs`' + (' (the same one)' if kind == 'phone' else '') + ', is kept, with `pages-compose.py` and this README\'s')
w('generator, `pages-readme.py`, beside it; brief 22\'s were scratch copies. It opens each save as a player opens one, from')
w('the saves with Continue, and reaches each page from the menu and each tab by pressing it.')
w(f'- **What it met:** {len(problems)} page errors, console errors or steps it couldn\'t take; {len(rotate)} pages showing the rotate screen;')
w(f'  {len(wider)} pages wider than the window.')
w(f'- **Its record:** `pages.json`, each page\'s files, its headings and the clock as the bar showed it.')
w(f'- **In parts:** {len(parts)} pages.')
w('')
moments = []
for p in pages:
    if not moments or moments[-1][0] != p['moment']: moments.append((p['moment'], []))
    moments[-1][1].append(p)
SAID = {
    'A New Life, 24 August 2026': 'A fresh browser with no save: the start, the five steps of creation, the guide a new life opens on, and Home.',
    'A New Student, 1 September 2026': f'Brief 22\'s `roles` save (`{up}../career-genre-2026-10-22/app/make-saves.ts`): every place on the menu, every tab of each, and How This Works.',
    'The Last Term, 1 March 2029': '`tests/fixtures/journey-j01-last-term-8283f80c`: Home and the School in the term of the Actor Showcase.',
    'b20-4 After Midnight, 2 September 2029': 'Brief 22\'s `released` save: OPT ended at midnight and The Winter Ledger called off. Every place and every tab again.',
}
for title, ps in moments:
    w(f'## {title}')
    w('')
    w(SAID.get(title, ''))
    w('')
    for i, p in enumerate(ps):
        k = p['n']
        pad = ' ' * (len(str(k)) + 2)
        heads = [h for i, h in enumerate(p['headings']) if h not in p['headings'][:i] and h not in ('David Geffen School of Drama at Yale University', 'Career', 'Papers', 'Chase', 'Who Are You Going To Be?')]
        note = SEEN.get(p['page'], '')
        if not note and heads:
            note = f"Its headings: {', '.join(heads[:14])}{', and more' if len(heads) > 14 else ''}."
        w(f"{k}. **{p['page']}{',** in ' + str(len(p['files'])) + ' parts.' if len(p['files']) > 1 else '.**'} {note}".rstrip())
        w('')
        for j, f in enumerate(p['files']):
            alt = p['page'] + (f', part {j + 1}' if len(p['files']) > 1 else '')
            w(f'{pad}![{alt}]({f})')
        w('')
open(f'{d}/README.md', 'w', encoding='utf-8').write('\n'.join(out).rstrip() + '\n')
print(f'{len(pages)} pages, {sum(len(p["files"]) for p in pages)} files, {len(problems)} problems')
