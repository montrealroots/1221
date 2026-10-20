"""
Whether the feedback that repeats is justified (brief 17, section 10: "Whether repeated advice remains contextually
justified"), from the runs, never typed: each showing whose first sentence the same course said in its last five, and
each whose every sentence's structure it did (`tools/voices.ts`'s `openings` and `allStale`, the same normalizing), split
by why it might repeat:
- **an acknowledgment:** one sentence, Strong or better, which the brief asks for ("Sometimes acknowledge the
  achievement and stop");
- **the same finding:** on a note or limit (its `focus`) the course gave in its last five, the thing still true;
- **says so:** of those, its first sentence says it's the same, or counts it ("again", "still", "as on", "notes now",
  "in a row" and the like);
- **the rest:** neither.

    python3 docs/verification/continuity-2026-10-20/justified.py <before runs> <after runs>
"""
import json, os, re, sys

def norm(s):
    s = re.sub(r'“[^”]*”', '“…”', s)
    s = re.sub(r'\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}\b', 'DATE', s)
    return re.sub(r'\s+', ' ', re.sub(r'[-+]?\d+(?:[.,]\d+)*%?', '#', s)).strip()
NAME = re.compile(r"(?<=\S\s)(?:[A-Z][\w’'-]*)(?:\s+(?:[A-Z][\w’'-]*|Of|And|The|In|On|To|With|A|For|At|By))*(?:\s+[A-Z][\w’'-]*)?")
def struct(s):
    s = NAME.sub('NAME', re.sub(r'You played [^.]+ in [^.]+\.', 'You played ROLE in PLAY.', norm(s)))
    s = re.sub(r'\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\b', 'NTH', s, flags=re.I)
    return re.sub(r'\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b', 'N', s, flags=re.I)
def sents(t): return [x.strip() for x in re.split(r'(?<=[.!?])\s+(?=[A-Z“])', re.sub(r'^Simulated note from [^:]+: ', '', t)) if x.strip()]
SAYS = re.compile(r"\b(?:again|still|same|as on|as at|as it did|last time|before|back|since|keeps|kept|another|continu|running|in a row|twice|earlier today|holding|notes now|note \d+|\d+(?:st|nd|rd|th) note|times? now|matching)\b", re.I)

result = {}
for d in sys.argv[1:3]:
    r = {'showings': 0, 'openings': {'all': 0, 'acknowledgment': 0, 'sameFinding': 0, 'saysSo': 0, 'rest': 0}, 'allStale': {'all': 0, 'acknowledgment': 0, 'sameFinding': 0, 'saysSo': 0, 'rest': 0}, 'rest': []}
    for f in sorted(os.listdir(d)):
        if not f.endswith('.json') or f.startswith('summary'): continue
        run = json.load(open(os.path.join(d, f), encoding='utf-8'))
        last = {}
        for x in run['said']:
            if x['kind'] != 'showing': continue
            r['showings'] += 1
            prev = last.get(x.get('course'), [])[-5:]
            s = sents(x['text'])
            body = [y for y in s if not y.startswith('You played ')]
            opening = norm(s[0]) if s else ''
            stale = bool(body) and all(struct(y) in {struct(z) for m in prev for z in sents(m['text']) if not z.startswith('You played ')} for y in body)
            for key, hit in (('openings', opening in [norm(sents(m['text'])[0]) for m in prev if sents(m['text'])]), ('allStale', stale)):
                if not hit: continue
                e = r[key]; e['all'] += 1
                if len(body) == 1 and x.get('band') in ('strong', 'exceptional'): e['acknowledgment'] += 1
                elif any(m.get('focus') == x.get('focus') for m in prev):
                    e['sameFinding'] += 1; e['saysSo'] += bool(SAYS.search(s[0]))
                else:
                    e['rest'] += 1
                    if len(r['rest']) < 8: r['rest'].append(f"{f[:-5]} {x['at']} {x.get('course')}: {x['text'][:140]}")
            last.setdefault(x.get('course'), []).append(x)
    result[d.rstrip('/').split('/')[-1]] = r
    for key in ('openings', 'allStale'):
        e = r[key]
        print(f"{d}: {key} {e['all']} of {r['showings']}: acknowledgments {e['acknowledgment']}; the same finding {e['sameFinding']} ({e['saysSo']} saying so); the rest {e['rest']}")
print(json.dumps(result, indent=1, ensure_ascii=False))
