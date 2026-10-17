"""
Brief 14's dynamic cases, mutation-tested (from 2026-10-17): each entry breaks one variant in its source, runs the
test of tests/language-dynamic.test.ts that holds it, and puts the source back as it read it. Run from the repository's
root, with a folder for the logs:

    python3 docs/verification/language-2026-10-17/dynamic/mutate.py <log folder> [M01 M02 ...]

Each entry: its id, the file, the text broken, what it's broken to, the test's title (a `-t` filter), and what the
break means. The results, as run, are in README.md, Mutations.
"""
import subprocess, json, sys, os
ROOT = os.getcwd()
OUT = sys.argv[1] if len(sys.argv) > 1 else 'mutations'
os.makedirs(OUT, exist_ok=True)
M = [
 ('M01', 'src/ui/looks/classmate.tsx', "Came to ${came} of ${plural(asked, 'rehearsal')} with you", "Came to ${came} of ${asked} rehearsals with you", 'rehearsals with a classmate', 'the classmate look counts one rehearsal in the plural again'),
 ('M02', 'src/ui/looks/classmate.tsx', "return `${n} more ${n === 1 ? 'rehearsal' : 'rehearsals'}`;", "return `${n} more rehearsals`;", 'rehearsals with a classmate', 'a boundary lifts after "1 more rehearsals"'),
 ('M03', 'src/ui/workspaces/SchoolWorkspace.tsx', "{plural(t.classDays - t.excused, 'class day')}", "{t.classDays - t.excused} class days", 'first day of classes', 'the Standing tab counts one class day in the plural'),
 ('M04', 'src/ui/workspaces/SchoolWorkspace.tsx', "make-up {r.owed === 1 ? 'session' : 'sessions'} left", "make-up sessions left", 'first day of classes', 'one make-up session owed in the plural'),
 ('M05', 'src/engine/systems/coursework.ts', "${set ? `${set === 1 ? 'One piece is' : `${set} pieces are`} set and still to be shown.` : 'Everything set so far has been shown.'}", "${set ? `${set} pieces are set and still to be shown.` : 'Everything set so far has been shown.'}", 'coursework warning', 'the warning says "1 pieces are set"'),
 ('M06', 'src/engine/systems/coursework.ts', "const of = tally.unreadyShown.length === 1 ? 'the one you showed' :", "const of = tally.unreadyShown.length === 0 ? 'the one you showed' :", 'coursework warning', 'the one Unready piece shown said as "N of the 1 you showed"'),
 ('M07', 'src/engine/systems/life.ts', "title: `You Slept Through ${crossed.length} Commitment${crossed.length === 1 ? '' : 's'}`,", "title: `You Slept Through ${crossed.length} Commitments`,", 'commitments slept through', 'one commitment slept through in the plural'),
 ('M08', 'src/engine/systems/production.ts', "${p.calls} ${p.calls === 1 ? 'call' : 'calls'} answered", "${p.calls} calls answered", 'nights with the company', 'one call answered in the plural'),
 ('M09', 'src/ui/looks/wellbeing.tsx', "  if (/^\\s*she\\b/i.test(person.pronouns ?? '')) return { they: 'she', them: 'her', their: 'her', are: 'is', s: third };\n", "", 'own pronouns', 'a she/her person spoken of as they'),
 ('M10', 'src/ui/looks/wellbeing.tsx', "  if (isYou) return { they: 'you', them: 'you', their: 'your', are: 'are', s: (v) => v };\n", "", 'own pronouns', 'the player spoken of in the third person'),
 ('M11', 'src/engine/systems/coursework.ts', "const withReader = read ? ` You ran it with a reader ${timesWords(read)}.` : ` ${READER.label} lets you work on your side of it without them.`;", "const withReader = read ? ` You ran it with a reader ${timesWords(read)}.` : '';", 'a partner and a reader', 'no reader: the way to work without the partner left unsaid'),
 ('M12', 'src/ui/looks/papers.tsx', "It should be ready ${doc.readyAt ? `by ${formatDate(doc.readyAt, zone)}` : 'soon'}.", "It should be ready by ${formatDate(doc.readyAt ?? 0, zone)}.", 'a date not yet known', 'an application with no ready day says a date anyway'),
 ('M13', 'src/ui/papers/Documents.tsx', "Researched {(() => { const [year, month, day] = ENTRY_AS_OF.split('-').map(Number); return formatDate(instantFromZoned({ year: year!, month: month!, day: day!, hour: 12 }, sim.zone), sim.zone); })()}.", "Researched {ENTRY_AS_OF}.", 'payments missed', 'the entry rules day back to its ISO form'),
 ('M14', 'src/engine/systems/school.ts', "  if (next === 'warning') return last ? 'not recommend your degree' : reviewed ? 'keep you on academic warning' : 'put you on academic warning';", "  if (next === 'warning') return 'not recommend your degree';", 'concern, a warning and a dismissal', 'a concern says the next short term would withhold the degree'),
 ('M15', 'src/ui/workspaces/SchoolWorkspace.tsx', ": school.leave?.status === 'on' ? `On leave until ${termLabel(school.leave.returnTerm)}.` :", ": school.leave?.status === 'on' ? 'On leave.' :", 'on leave', 'the page head on a leave without its return'),
 ('M17', 'src/engine/systems/coursework.ts', ": `${shown}, but ${about} wasn’t taken yet.${moved}${band} It stays open under Your Notes.`;", ": `${shown}, and took ${about}.${moved}${band}`;", 'a note worked and the piece shown again', 'a note not taken said as taken'),
 ('M18', 'src/ui/workspaces/PapersWorkspace.tsx', "{f.balance > 0 ? 'You Owe' : f.balance < 0 ? 'Your Refund' : 'Nothing Owed Or Due Back'}", "{f.balance > 0 ? 'You Owe' : 'Your Refund'}", 'tax return’s balance', 'a return with nothing either way says Your Refund $0.00'),
 ('M19', 'src/ui/looks/money.tsx', "    if (owed === 0 && a.balance > 0) {", "    if (owed === 0 && a.balance > 1e12) {", 'holding your money', 'a card holding your money says only that it owes nothing'),
 ('M20', 'src/ui/screens/Home.tsx', "(primary.balance < 0 ? `−${balanceText(sim, primary, -primary.balance, primary.currency ? -heldOf(primary) : undefined)}` : balanceText(sim, primary))", "balanceText(sim, primary)", 'an account: money in it', 'Home writes an overdrawn balance with a hyphen'),
 ('M21', 'src/engine/systems/coursework.ts', "const ordinal = (n: number): string => { const t = n % 100; return `${n}${t >= 11 && t <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`; };", "const ordinal = (n: number): string => `${n}th`;", 'unchanged weakness', 'the third time said as "3th"'),
 ('M22', 'src/engine/systems/coursework.ts', "    ? `This is the ${ordinal(before.given + 1)} time you’ve had this note (last in ${before.course} on ${when}), and it’s still there. ${body}`\n    : `You had the same note in ${before.course} on ${when}, and it’s still there. ${body}`;", "    ? body\n    : body;", 'unchanged weakness', 'a note given again said as a new discovery'),
 ('M23', 'src/engine/systems/courserecord.ts', "body: `${(r.owed ?? 0) - (r.madeUp ?? 0) === 1 ? 'One make-up session' : `${(r.owed ?? 0) - (r.madeUp ?? 0)} make-up sessions`} still to do,", "body: `${r.owed} make-up sessions still to do,", 'warning repeated', 'the week-left reminder says what was owed, not what is left'),
 ('M24', 'src/engine/systems/experience.ts', "${f.of === 1 ? 'piece' : 'pieces'} ${calls} on it", "piece ${calls} on it", 'the advice: none before', 'the advice counts its pieces in the singular'),
 ('M25', 'src/ui/workspaces/SchoolWorkspace.tsx', "const where = school.standing === 'graduated' ? 'Graduated.' :", "const where = school.standing === 'graduated' ? 'Left the School.' :", 'each screen at each stage', 'a graduate read as having left'),
 ('M26', 'src/engine/systems/leave.ts', "if (l?.status === 'pending') return `Your request is with the chair and the dean, decided by ${formatDate(l.decideAt, sim.zone)}.`;", "if (l?.status === 'pending') return 'Your request is with the chair and the dean.';", 'on leave', 'a pending leave refused without its date'),
 ('M27', 'src/engine/systems/credit.ts', "body: `${credit.hardship ? 'The plan’s payment' : 'The minimum payment'} was ${formatMoney(due, currency)}, and only ${formatMoney(paid, currency)} was paid.", "body: `${credit.hardship ? 'The plan’s payment' : 'The minimum payment'} was ${formatMoney(due, currency)}, and only ${formatMoney(paid, currency)} was paid..", 'a card payment', 'a doubled stop in the late payment notice'),
 ('M28', 'src/engine/systems/experience.ts', "const pointsWords = (n: number): string => `${n} ${n === 1 ? 'point' : 'points'}`;", "const pointsWords = (n: number): string => `${n} points`;", 'advice’s counts', 'a cost of exactly one point said as "1 points"'),
 ('M29', 'src/engine/systems/experience.ts', "const calls = f.pieces === 1 ? 'calls' : 'call';", "const calls = 'call';", 'advice’s counts', '"1 of your last 12 pieces call on it"'),
]
only = sys.argv[2:]
results=[]
for mid, f, old, new, filt, what in M:
    if only and mid not in only: continue
    p=os.path.join(ROOT,f)
    src=open(p).read()
    n=src.count(old)
    if n!=1:
        results.append({'id':mid,'file':f,'what':what,'result':f'NOT APPLIED (found {n})'}); print(mid,'not applied',n, flush=True); continue
    open(p,'w').write(src.replace(old,new))
    try:
        log=os.path.join(OUT,f'{mid}.txt')
        with open(log,'w') as fh:
            r=subprocess.run(['npx','vitest','run','tests/language-dynamic.test.ts','-t',filt],cwd=ROOT,stdout=fh,stderr=subprocess.STDOUT,timeout=600)
        code=r.returncode
        txt=open(log).read()
        import re
        m=re.search(r'Tests\s+(.*)',txt)
        results.append({'id':mid,'file':f,'what':what,'filter':filt,'exit':code,'tests':m.group(1).strip() if m else '?'})
        print(mid, code, m.group(1).strip() if m else '?', flush=True)
    finally:
        open(p,'w').write(src)
json.dump(results, open(os.path.join(OUT,'results.json' if not only else 'results-partial.json'),'w'), indent=1)
