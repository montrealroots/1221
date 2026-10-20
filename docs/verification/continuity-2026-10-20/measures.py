"""
The measures before and after (brief 17, section 10: "Measure: exact duplicate messages; repeated openings; repeated
advice bodies; repeated sentence structures after normalizing dates, names, and numbers; whether repeated advice remains
contextually justified; contradictions between messages and actual state. Report the denominator, history window, and
exclusions for each metric"), read from the two summaries `tools/voices.ts --summarize` wrote, never typed. Both sides
are summarized by the same `voices.ts`, so the definitions are the same; they're printed under the table, from the
summary itself.

    python3 docs/verification/continuity-2026-10-20/measures.py <before summary.json> <after summary.json> > measures.md
"""
import json, sys

b, a = (json.load(open(p, encoding='utf-8')) for p in sys.argv[1:3])
def get(d, path):
    for k in path.split('.'): d = d[k]
    return d
def pct(n, of): return f'{n} of {of} ({100 * n / of:.1f}%)' if of else f'{n} of 0'
rows = []
def row(label, n, of=None):
    x, y = get(b, n), get(a, n)
    if of: rows.append((label, pct(x, get(b, of)), pct(y, get(a, of))))
    else: rows.append((label, str(x), str(y)))
P = 'brief17.perKind'
rows.append(('**A showing’s feedback**', '', ''))
row('Messages', f'{P}.showing.messages')
row('Said before word for word in the same run', f'{P}.showing.exact', f'{P}.showing.messages')
row('First sentence said in one of the same course’s last five', 'openings.repeatedWithinFiveFromSameCourse', 'openings.showings')
row('Distinct first sentences', 'openings.distinct')
row('Body (after the first sentence) said in the course’s last five', f'{P}.showing.bodies', f'{P}.showing.withBody')
row('… of those, on the same note as the one it repeats', f'{P}.showing.bodiesSameFinding', f'{P}.showing.bodies')
row('… of those, saying in its first sentence that it’s the same', f'{P}.showing.bodiesSameFindingSaidContinuing', f'{P}.showing.bodiesSameFinding')
row('Sentence structures said in the course’s last five', f'{P}.showing.structures', f'{P}.showing.sentences')
row('Messages every sentence of which was said in the course’s last five', f'{P}.showing.allStale', f'{P}.showing.messages')
row('Sentences said by two or more courses (distinct sentences)', 'shared.sentencesFromTwoOrMoreCourses')
row('Showings with a sentence another course said', 'shared.showingsWithOne', 'openings.showings')
rows.append(('Courses’ voices: the mean share of one course’s sentences another said', f"{get(b, 'brief17.speakers.meanShared')}", f"{get(a, 'brief17.speakers.meanShared')}"))
for kind, label in (('director', 'A director’s note'), ('moment', 'A classmate’s moment'), ('notice', 'A notice'), ('advice', 'The Profile’s advice card')):
    rows.append((f'**{label}**', '', ''))
    row('Messages', f'{P}.{kind}.messages')
    row('Said before word for word in the same run', f'{P}.{kind}.exact', f'{P}.{kind}.messages')
    row('First sentence said in the speaker’s last five', f'{P}.{kind}.openings', f'{P}.{kind}.messages')
    row('Body said in the speaker’s last five', f'{P}.{kind}.bodies', f'{P}.{kind}.withBody')
    row('… of those, on the same finding, saying it’s the same', f'{P}.{kind}.bodiesSameFindingSaidContinuing', f'{P}.{kind}.bodiesSameFinding')
    row('Messages every sentence of which was said in the speaker’s last five', f'{P}.{kind}.allStale', f'{P}.{kind}.messages')
row('Advice: words shown, on average', 'advice.meanWords')
row('Advice: words with Why This Recommendation open, on average', 'advice.meanWordsWithDetails')
rows.append(('**Claims against the record**', '', ''))
C = 'brief17.contradictions'
for k, label in (('move', 'A band’s move (up, down, how far, from what)'), ('best', 'A best'), ('first', 'A first Strong'), ('run', 'A run at Strong or better, and its count'), ('count', 'A note’s count')):
    rows.append((f'{label}: wrong', pct(get(b, f'{C}.{k}Wrong'), get(b, f'{C}.{k}Claims')), pct(get(a, f'{C}.{k}Wrong'), get(a, f'{C}.{k}Claims'))))
rows.append(('A classmate’s “last time”: wrong', pct(get(b, 'brief17.lastAnswer.wrong'), get(b, 'brief17.lastAnswer.claims')), pct(get(a, 'brief17.lastAnswer.wrong'), get(a, 'brief17.lastAnswer.claims'))))
E = 'brief17.events'
rows.append(('A partner’s miss counted in its notice: wrong', pct(get(b, f'{E}.missCountWrong'), get(b, f'{E}.missCounts')), pct(get(a, f'{E}.missCountWrong'), get(a, f'{E}.missCounts'))))
rows.append(('A request for help counted: wrong', pct(get(b, f'{E}.helpCountWrong'), get(b, f'{E}.helpCounts')), pct(get(a, f'{E}.helpCountWrong'), get(a, f'{E}.helpCounts'))))
rows.append(('**Memory**', '', ''))
rows.append(('Messages read again after a save and a load that differed', pct(get(b, 'brief17.rerolled.differed'), get(b, 'brief17.rerolled.checked')), pct(get(a, 'brief17.rerolled.differed'), get(a, 'brief17.rerolled.checked'))))
out = ['| Measure | Before (`bbb82253`) | After |', '|---|---|---|'] + [f'| {l} | {x} | {y} |' for l, x, y in rows]
out += ['', '**How each is counted** (the summary’s own definitions, the same on both sides):', '']
for k, v in get(a, 'brief17.definitions').items():
    if k == 'runs': out.append(f"- **runs:** {len(v)}: {', '.join(v)}")
    else: out.append(f'- **{k}:** {v}')
print('\n'.join(out))
