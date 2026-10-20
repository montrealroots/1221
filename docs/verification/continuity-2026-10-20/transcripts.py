"""
Consecutive transcripts from the final after-runs (brief 17, section 12: "Consecutive transcripts demonstrating distinct
speakers and continuity"), read from the runs, never typed, each in the order a player met it:
- **the five teachers:** for one student, the first ten showings of one course in each voice (`VOICE_OF`), side by side
  in sequence, so a voice is read across what changed from piece to piece;
- **a production's director:** every call's note through one run, and its closing note;
- **a classmate, over a year:** one partner's misses, their apologies and their requests, with the days between.

    python3 docs/verification/continuity-2026-10-20/transcripts.py <runs dir> > transcripts.md
"""
import json, os, re, sys
from datetime import date

d = sys.argv[1]
run = lambda n: json.load(open(os.path.join(d, f'{n}.json'), encoding='utf-8'))
VOICE = {'direct': 'Acting I', 'warm': 'Voice I', 'exacting': 'Speech And Accents I', 'patient': 'The Body As Source I', 'brisk': 'Acting Intimacy And Combat For The Stage'}
out = ['# Consecutive Transcripts, From The Final Runs', '',
       'Each block is one run of `tools/voices.ts` on the tested commit, in the order a player met it. Written by '
       '`transcripts.py` from the runs, never typed. The whole of each run, every kind of message in order, is in '
       '`after/transcript.md`.', '']
for student in ('regressing-v16-0', 'improving-v17-1'):
    r = run(student)
    out += [f'## The Five Teachers: {student}', '']
    for v, course in VOICE.items():
        shown = [x for x in r['said'] if x['kind'] == 'showing' and x.get('course') == course][:10]
        out += [f'### {course} ({v})', '']
        out += [f"- **{x['at']}, {x.get('band')}:** {x['text']}" for x in shown] or ['None in this run.']
        out += ['']
# A director through a run: the student with the most calls from one director.
best = None
for f in sorted(os.listdir(d)):
    if not f.endswith('.json') or f.startswith('summary'): continue
    r = json.load(open(os.path.join(d, f), encoding='utf-8'))
    by = {}
    for x in r['said']:
        if x['kind'] == 'director': by.setdefault(x.get('speaker'), []).append(x)
    for sp, xs in by.items():
        if not best or len(xs) > len(best[2]): best = (f[:-5], sp, xs)
if best:
    n, sp, xs = best
    out += [f'## A Director Through A Run: {n}, {sp}', '']
    out += [f"- **{x['at']}, {x.get('note')}:** {x['text']}" for x in xs[:24]] + ['']
# A classmate over a year: the run and partner with the most misses and apologies between them.
pick = None
for f in sorted(os.listdir(d)):
    if not f.endswith('.json') or f.startswith('summary'): continue
    r = json.load(open(os.path.join(d, f), encoding='utf-8'))
    seq = {}
    for x in r['said']:
        if x['kind'] == 'notice' and re.search(r' (Didn’t Come|Asks To Rehearse)$', x.get('title') or ''):
            seq.setdefault(x['title'].split(' ')[0], []).append(x)
        elif x['kind'] == 'moment' and x.get('note') in ('apology', 'help', 'study', 'disagreement', 'boundary'):
            seq.setdefault(x['text'].split(' ')[0], []).append(x)
    for who, xs in seq.items():
        kinds = {x.get('note') or x.get('title', '').split(' ', 1)[-1] for x in xs}
        score = sum(1 for x in xs if x.get('note') == 'apology') * 3 + sum(1 for x in xs if 'Didn’t Come' in (x.get('title') or ''))
        if 'apology' in kinds and (not pick or score > pick[3]): pick = (f[:-5], who, xs, score)
if pick:
    n, who, xs, _ = pick
    out += [f'## A Classmate Over The Run: {n}, {who}', '']
    last = None
    for x in xs:
        days = (date.fromisoformat(x['at']) - date.fromisoformat(last)).days if last else None
        gap = '' if days is None else ' (the same day)' if days == 0 else f" ({days} {'day' if days == 1 else 'days'} on)"
        what = x.get('title') if x['kind'] == 'notice' else f"a moment: {x.get('note')}"
        out.append(f"- **{x['at']}{gap}, {what}:** {x['text']}")
        last = x['at']
    out.append('')
print('\n'.join(out))
