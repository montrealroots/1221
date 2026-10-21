import subprocess, sys
M = [
 ('I28', 'src/engine/systems/projobs.ts', "    if (!writtenFor(t, person)) continue;\n", "", 'tests/pro-work.test.ts', 'posts an actor the parts'),
 ('I29', 'src/engine/systems/projobs.ts', "t.role.for === 'either' || t.role.for === person.performerTitle;", "t.role.for === 'either' || t.role.for !== person.performerTitle;", 'tests/pro-work.test.ts', 'posts an actor the parts'),
 ('I30', 'src/ui/career/OpportunitiesPane.tsx', "${writtenForWords(t)} Playing ages", "Playing ages", 'tests/pro-opportunities-screen.test.ts', 'a first-year'),
 ('I31', 'src/ui/career/OpportunitiesPane.tsx', "!t.access.open && writtenFor(t, person));", "!t.access.open);", 'tests/pro-opportunities-screen.test.ts', 'a first-year'),
 ('I32', 'src/ui/career/OpportunitiesPane.tsx', "`The pay is deferred: ${DEFERRED_WHY}, so nothing is paid for it.`", "'The pay is deferred: nothing is paid for it.'", 'tests/pro-opportunities-screen.test.ts', 'deferred pay is never paid'),
 ('I33', 'src/ui/career/WorkPane.tsx', "defers the pay: ${DEFERRED_WHY}, so nothing is paid for it.", "defers the pay, so it’s shown here and never paid.", 'tests/propay-screen.test.ts', 'reads deferred'),
 ('I34', 'src/ui/workspaces/CalendarWorkspace.tsx', "${trip ? ` Getting there takes ${tripWords(trip)} each way, and the trip is part of it.` : ''}", "", 'tests/calendar-entry-trip.test.ts', 'trip'),
 ('I35', 'src/engine/content/careerwork.ts', "no real offer of covered work through him, or,", "no real offer of covered work, or,", 'tests/pro-core.test.ts', 'Equity’s 90 days one way'),
 ('I36', 'src/engine/systems/proagent.ts', "days with no real offer of covered work through him`,", "days with no real offer of covered work`,", 'tests/journey-agent.test.ts', 'Equity’s 90 days with no offer'),
 ('I37', 'src/engine/content/careerwork.ts', "part: 'Callum', size: 'supporting', for: 'actor'", "part: 'Callum', size: 'supporting', for: 'either'", 'tests/pro-core.test.ts', 'writes each part'),
 ('I38', 'src/engine/systems/projobs.ts', "export const DEFERRED_WHY = 'a student film pays its actors only if it earns money later, and no film in the game does';", "export const DEFERRED_WHY = 'a student film pays its actors only if it earns money later';", 'tests/pro-work.test.ts', 'an unsigned graduate, from a posted student film'),
 ('I39', 'src/engine/decided.ts', "agentId: AGENTS[0]!.id,", "agentId: 'jordan-parente',", 'tests/deciders.test.ts', 'pro.posting'),
 ('I40', 'src/engine/decided.ts', "    sim.player.performerTitle = title === 1 ? 'actress' : 'actor';\n", "", 'tests/deciders.test.ts', 'pro.posting'),
 ('I41', 'src/engine/systems/projobs.ts', "    if (!writtenFor(t, person)) continue;\n", "", 'tests/deciders.test.ts', 'pro.posting'),
 ('I42', 'src/engine/systems/projobs.ts', "    if (elsewhere) { missRound(s, at.person, at.o, r, elsewhere); return; }\n", "", 'tests/pro-work.test.ts', 'two auditions in person whose trips meet'),
 ('I43', 'src/engine/systems/proagent.ts', "    if (present(person, item.at) && !elsewhere) {", "    if (present(person, item.at)) {", 'tests/pro-work.test.ts', 'a meeting at the agent’s office and an audition'),
 ('I44', 'src/engine/systems/projobs.ts', "    const away = tripMinutes(person.currentLocationId, t.place.cityId) * MIN;\n    for (const r of o.rounds ?? []) {\n      if (r.form === 'in-person' && r.status === 'done'", "    const away = 0;\n    for (const r of o.rounds ?? []) {\n      if (r.form === 'in-person' && r.status === 'done'", 'tests/pro-work.test.ts', 'two auditions in person whose trips meet'),
 ('I45', 'src/engine/content/careerwork.ts', "part: 'Felix', size: 'lead'", "part: 'Theo', size: 'lead'", 'tests/pro-core.test.ts', 'names no part as the School names a classmate'),
 ('I46', 'src/engine/systems/projobs.ts', "  if (!careerStop(item.kind)) return [];\n", "  return [];\n", 'tests/language-frame-ui.test.ts', 'two auditions in person at one hour'),
 ('I47', 'src/ui/shell/TimeControls.tsx', "      {clashes.length > 0 && (\n        <p className=\"small\">", "      {false && clashes.length > 0 && (\n        <p className=\"small\">", 'tests/language-frame-ui.test.ts', 'two auditions in person at one hour'),
 ('I48', 'src/ui/shell/TimeControls.tsx', "confirm.missed.slice(n + 1).map((w) => w.item)", "confirm.missed.map((w) => w.item)", 'tests/language-frame-ui.test.ts', 'two auditions in person at one hour'),
 ('I49', 'src/engine/systems/projobs.ts', "const windowOf = (i: ScheduledItem): readonly [Instant, Instant] => [i.at - (i.travelMinutes ?? 0) * MIN, i.at + ((i.durationMinutes ?? 0) + (i.travelMinutes ?? 0)) * MIN];", "const windowOf = (i: ScheduledItem): readonly [Instant, Instant] => [i.at, i.at + (i.durationMinutes ?? 0) * MIN];", 'tests/language-frame-ui.test.ts', 'two auditions in person at one hour'),
 ('I50', 'src/engine/systems/projobs.ts', "const careerStop = (kind: string): boolean => kind === AUDITION_KIND || kind === MEETING_KIND;", "const CAREER_STOPS = new Set([AUDITION_KIND, MEETING_KIND]);\nconst careerStop = (kind: string): boolean => CAREER_STOPS.has(kind);", 'tests/module-load-order.test.ts', 'load in the bundle'),
]
import os
ONLY = os.environ.get('ONLY', '').split(',') if os.environ.get('ONLY') else None
M = [m for m in M if not ONLY or m[0] in ONLY]
out = []
for mid, f, a, b, test, name in M:
    s = open(f, encoding='utf-8').read()
    assert s.count(a) == 1, (mid, s.count(a))
    open(f, 'w', encoding='utf-8').write(s.replace(a, b))
    try:
        r = subprocess.run(['npx', 'vitest', 'run', test, '-t', name], capture_output=True, text=True, timeout=600)
        tail = [l for l in r.stdout.splitlines() if 'Tests ' in l]
        out.append(f"{mid} {'killed' if r.returncode else 'SURVIVED'} ({f}: {a.strip()[:60]!r} -> {b.strip()[:40]!r}; {test} -t {name!r}: {tail[-1].strip() if tail else r.returncode})")
    finally:
        open(f, 'w', encoding='utf-8').write(s)
    print(out[-1], flush=True)
