"""The playthroughs' 24 mutations (docs/verification/career-2026-10-20/playthroughs/mutations.txt), rebuilt on 2026-10-21
from their descriptions against 9485a309: the edits first made at 5daaeed8 went with the playthroughs' clone. Each is
applied alone in the clone given, the four played-test files run, and the file restored. Killed when the run exits
non-zero; "by" is the first test that failed.   python3 docs/verification/career-2026-10-20/playthroughs/mutate.py <clone> <out> [M1 M2 ...]"""
import os, subprocess, sys
J='src/engine/systems/projobs.ts'; A='src/engine/systems/proagent.ts'; P='src/engine/systems/propay.ts'; D='src/ui/looks/day.tsx'
TESTS=['tests/journey-career.test.ts','tests/journey-career-older.test.ts','tests/pro-work.test.ts','tests/propay.test.ts']
M=[
 ('M1',"a booked day of work is no practice in the project's genres",J,"      practiceGenres(s, person, projectGenres);\n",""),
 ('M2',"commission's scale read from the rate's 2026-27 amount, not the year the work was in",P,"  const minimum = first !== undefined ? minimumOn(rate, dateKey(first, WORK_ZONE)) : rate.amount;","  const minimum = rate.amount;"),
 ('M3',"SAG-AFTRA's day minimum the same in every contract year",'src/engine/content/careerwork.ts',"  const scale = [...SAG_DAY_BY_YEAR].reverse().find((r) => r.from <= day)?.amount;","  const scale = SAG_DAY_BY_YEAR.find((r) => r.from === '2026-07-01')?.amount;"),
 ('M4',"an audition in person kept from a booked day of work",J,"if (!there(at.person, item.at) || workDayAt(at.person, item.at)) { missRound(s, at.person, at.o, r); return; }","if (!there(at.person, item.at)) { missRound(s, at.person, at.o, r); return; }"),
 ('M5',"a day of work already missed still keeps her from an audition in its hours",J,"if (d.from < end && d.to > at && e.log?.find((l) => l.day === i)?.status !== 'missed') return","if (d.from < end && d.to > at) return"),
 ('M6',"the legend without its Career row",'src/engine/world/calendar.ts',"  { category: 'career', label: 'Career', colour: '#b08850',","  // { category: 'career', label: 'Career', colour: '#b08850',"),
 ('M7',"a trip of none (the showcase's calls) read as a trip carried",D,"const trip = own !== undefined && own > 0 ? own : undefined;","const trip = own !== undefined ? own : undefined;"),
 ('M8',"a commitment that carries its trip still said to need its town",D,"${city && trip === undefined ? ` and in ${city.name}` : ''}","${city ? ` and in ${city.name}` : ''}"),
 ('M9',"a work day's cost of missing it unsaid",D,"    case WORK_DAY_KIND: return item?.payload.kind === 'shoot'","    case WORK_DAY_KIND: return '' as string;\n    case 'mutated': return item?.payload.kind === 'shoot'"),
 ('M10',"an audition's cost of missing it unsaid",D,"    case AUDITION_KIND: return ': casting moves on without you, and the role is gone';","    case AUDITION_KIND: return '';"),
 ('M11',"a meeting's cost of missing it unsaid",D,"    case MEETING_KIND: return ': his office closes your approach, and looks again only after a year, at something new';","    case MEETING_KIND: return '';"),
 ('M12',"the showcase's cost of missing a call unsaid",D,"    case SHOWCASE_KIND: return call === 'rehearsal'","    case SHOWCASE_KIND: return '' as string;\n    case 'mutated': return call === 'rehearsal'"),
 ('M13',"a commitment with its trip, away from home, said to be missed as nothing takes you there",D,"              ? elsewhere && trip !== undefined","              ? false && elsewhere && trip !== undefined"),
 ('M14',"L1's watcher allowing a work day nothing outside but the work and the body (not its genres)",'tests/journey-career.test.ts',"[WORK_DAY_KIND]: ['work', 'genres', 'body'],","[WORK_DAY_KIND]: ['work', 'body'],"),
 ('M15',"Ask For A Referral recording the route as the showcase's",A,"    rel.via = { route: 'referral', at: s.now, by: job.by };","    rel.via = { route: 'showcase', at: s.now, by: job.by };"),
 ('M16',"Send What His Office Asked For not counted as supplied",A,"    delete rel.request;\n    setStage(s, rel, 'sent');",""),
 ('M17',"Ask To Move not moving the meeting",A,"    meeting.at = addDays(was, AGENT_TIMES.moveDays, officeZone(agent));","    meeting.at = was;"),
 ('M18',"Accept The Agreement leaving it offered",A,"    a.status = 'accepted';","    a.status = 'offered';"),
 ('M19',"Decline The Agreement leaving it offered",A,"    a.status = 'declined';\n",""),
 ('M20',"End It By Agreement recorded as some other way of ending",A,"p?.how === 'no-offer' || p?.how === 'too-little-work' ? p.how : 'agreement';","p?.how === 'no-offer' || p?.how === 'too-little-work' ? p.how : 'too-little-work';"),
 ('M21',"Check Your Materials not noted as checked",A,"    note(s, rel, 'checked', `checked:${approachesOf(rel)}`, notes.length","    false && note(s, rel, 'checked', `checked:${approachesOf(rel)}`, notes.length"),
 ('M22',"Join SAG-AFTRA charging a cent more than its fee and half a year's dues",P,"    const fee = usdIn(s, sagJoinUsd());","    const fee = usdIn(s, sagJoinUsd() + 1);"),
 ('M23',"a meeting with an agent's office not counted as away from class",J,"    if (!m || m.status === 'missed') continue;","    if (true as boolean) continue;"),
 ('M24',"a meeting's trip left out of the hours it takes her away",J,"    const away = (m.where === 'office' ? TRAVEL_MINUTES[person.currentLocationId] ?? 0 : 0) * MIN;\n    if (when >= m.at - away","    const away = 0;\n    if (when >= m.at - away"),
]
root, out = sys.argv[1], sys.argv[2]
only = sys.argv[3:]
for mid, what, f, old, new in M:
    if only and mid not in only: continue
    path = os.path.join(root, f)
    src = open(path, encoding='utf-8').read()
    if src.count(old) != 1:
        line = f'{mid} NOT APPLIED (its text found {src.count(old)} times): {what} [{f}]'
    else:
        open(path, 'w', encoding='utf-8').write(src.replace(old, new, 1))
        try:
            r = subprocess.run(['npx', 'vitest', 'run', *TESTS], cwd=root, capture_output=True, text=True, timeout=3600)
            failed = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith('×') or l.strip().startswith('FAIL ')]
            tests = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith('Tests ')]
            line = f"{mid} {'killed' if r.returncode else 'SURVIVED'}: {what} [{f}] ({tests[-1] if tests else 'exit ' + str(r.returncode)})" + (f' by: {failed[0][:230]}' if failed else '')
        finally:
            open(path, 'w', encoding='utf-8').write(src)
    print(line, flush=True)
    open(out, 'a', encoding='utf-8').write(line + '\n')
