"""
Whether a resolved incident comes back (brief 17, section 12: "Evidence that resolved incidents do not return"), from
what each student was told, never from the save: for each classmate, the rehearsals they didn't come to (their
“… Didn’t Come” notice) and their apologies (the class's apology moment, its first word the classmate's name), in order.

- **An apology again** is one with no miss of that classmate's since their last apology: an apology for misses already
  apologized for. Brief 16's measure (`tools/voices.ts`, `apologiesBeyondMisses`) counted apologies against all the
  misses before them, so an apology repeated for two misses still counted as two of two, and found none.
- **Owed at the end** is a classmate with a miss after their last apology, or none, when the run ended.
- **How late:** the days from the last miss an apology covers to the apology, and whether its words say how long it's
  been (from brief 17, an apology four weeks or more after the last miss it's for says so, `apologyWords`).

    python3 docs/verification/continuity-2026-10-20/incidents.py <runs dir> [<runs dir> ...]
"""
import json, os, re, sys
from datetime import date

def day(s): return date.fromisoformat(s)
LATE = re.compile(r'It’s been|still bothers them|still wanted to say it|late, and they know it')

result = {}
for d in sys.argv[1:]:
    names = sorted(f[:-5] for f in os.listdir(d) if f.endswith('.json') and not f.startswith('summary'))
    tot = {'runs': len(names), 'misses': 0, 'apologies': 0, 'again': 0, 'covering': 0, 'owedAtEnd': 0,
           'late28': 0, 'late28Said': 0, 'early': 0, 'earlySaidLate': 0, 'examples': []}
    for n in names:
        run = json.load(open(os.path.join(d, f'{n}.json'), encoding='utf-8'))
        seq = []
        for x in run['said']:
            if x['kind'] == 'notice' and re.search(r' Didn’t Come$', x.get('title') or ''):
                seq.append((x['at'], 0, 'miss', x['title'].split(' ')[0], x['text']))
            elif x['kind'] == 'moment' and x.get('note') == 'apology':
                seq.append((x['at'], 1, 'apology', x['text'].split(' ')[0], x['text']))
        seq.sort(key=lambda e: (e[0], e[1]))
        since = {}   # the misses since a classmate's last apology
        for at, _, kind, who, text in seq:
            if kind == 'miss':
                tot['misses'] += 1
                since.setdefault(who, []).append(at)
                continue
            tot['apologies'] += 1
            owed = since.get(who, [])
            if not owed:
                tot['again'] += 1
                if len(tot['examples']) < 12: tot['examples'].append(f'{n} {at}: {who} apologizes, with no miss since their last apology')
            else:
                tot['covering'] += 1
                gap = (day(at) - day(owed[-1])).days
                if gap >= 28:
                    tot['late28'] += 1
                    tot['late28Said'] += bool(LATE.search(text))
                else:
                    tot['early'] += 1
                    tot['earlySaidLate'] += bool(LATE.search(text))
            since[who] = []
        tot['owedAtEnd'] += sum(1 for v in since.values() if v)
    result[d.rstrip('/').split('/')[-1]] = tot
    print(f"{d}: {tot['runs']} runs; {tot['misses']} misses; {tot['apologies']} apologies, {tot['again']} again for misses "
          f"already apologized for; of those covering a miss, {tot['late28']} came 28 days or more after the last "
          f"({tot['late28Said']} saying so), {tot['early']} sooner ({tot['earlySaidLate']} saying it was late); "
          f"{tot['owedAtEnd']} classmates owed one at the end")
    for e in tot['examples']: print(f'  {e}')
print(json.dumps(result, indent=1, ensure_ascii=False))
