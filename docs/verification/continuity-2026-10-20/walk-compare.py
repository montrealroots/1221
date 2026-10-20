"""
What a player reads on the built app, before (`bbb82253`) and after (the tested commit), on the same fifteen scenario saves
written on `bbb82253` (brief 17, section 11: "inspect representative desktop and mobile screens"), read from the two
walks (`tools/text-walk.mjs`), never typed. For each width: the screens walked on both sides, how many say something
different, how many lines of text and how many controls' names changed, and the paragraphs a player meets that are
four sentences or more. A control's name is compared apart from the text: the brief keeps interface labels stable
("Variation belongs primarily in narrative and feedback, not in randomly changing the names of controls").

    python3 docs/verification/continuity-2026-10-20/walk-compare.py <before walk dir> <after walk dir> [<width> ...]
"""
import json, os, re, sys

before, after = sys.argv[1], sys.argv[2]
widths = sys.argv[3:] or ['1440', '390']
def lines(x):
    t = x.get('text') or ''
    return [l.strip() for l in (t if isinstance(t, list) else t.split('\n')) if l.strip()]
def sentences(l): return len([s for s in re.split(r'(?<=[.!?])\s+(?=[A-Z“])', l) if re.search(r'[a-z]', s)])
out = {}
for w in widths:
    r = {'saves': 0, 'screens': 0, 'changed': 0, 'linesBefore': 0, 'linesAfter': 0, 'linesOnlyBefore': 0, 'linesOnlyAfter': 0,
         'controlsRenamed': [], 'fourOrMoreBefore': 0, 'fourOrMoreAfter': 0, 'longestBefore': 0, 'longestAfter': 0}
    for f in sorted(os.listdir(f'{before}/{w}')):
        if not f.endswith('.json') or f == 'walk.json' or not os.path.exists(f'{after}/walk-{w}/{f}'): continue
        b = {(s['screen'], s.get('tab')): s for s in json.load(open(f'{before}/{w}/{f}', encoding='utf-8'))}
        a = {(s['screen'], s.get('tab')): s for s in json.load(open(f'{after}/walk-{w}/{f}', encoding='utf-8'))}
        r['saves'] += 1
        for k in sorted(set(b) & set(a), key=str):
            r['screens'] += 1
            lb, la = lines(b[k]), lines(a[k])
            r['linesBefore'] += len(lb); r['linesAfter'] += len(la)
            ob, oa = set(lb) - set(la), set(la) - set(lb)
            r['linesOnlyBefore'] += len(ob); r['linesOnlyAfter'] += len(oa)
            r['changed'] += bool(ob or oa)
            for side, ls in (('Before', lb), ('After', la)):
                n = [sentences(l) for l in ls]
                r[f'fourOrMore{side}'] += sum(1 for x in n if x >= 4)
                r[f'longest{side}'] = max([r[f'longest{side}']] + [len(l.split()) for l in ls])
            gone = set(b[k].get('buttons') or []) - set(a[k].get('buttons') or [])
            new = set(a[k].get('buttons') or []) - set(b[k].get('buttons') or [])
            if gone or new: r['controlsRenamed'].append({'save': f[:-5], 'screen': ' / '.join(x for x in k if x), 'gone': sorted(gone)[:6], 'new': sorted(new)[:6]})
    out[w] = r
    print(f"{w}: {r['saves']} saves, {r['screens']} screens on both sides, {r['changed']} saying something different; "
          f"lines {r['linesBefore']} and {r['linesAfter']}, {r['linesOnlyBefore']} only before and {r['linesOnlyAfter']} only after; "
          f"lines of four sentences or more {r['fourOrMoreBefore']} and {r['fourOrMoreAfter']}, the longest {r['longestBefore']} and {r['longestAfter']} words; "
          f"screens whose controls differ {len(r['controlsRenamed'])}")
print(json.dumps(out, indent=1, ensure_ascii=False))
