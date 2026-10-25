#!/usr/bin/env python3
"""Mutation tests for brief 27's F fixes: each mutation applied alone, the named test run, the source restored."""
import subprocess, sys
ROOT = '/home/user/1221/'
PC = 'tests/pro-core.test.ts'
P = 'src/engine/systems/pro.ts'
T = 'something to come still reads it'
MUTS = [
    ('F1 an unpaid payment not read', P, "  if (e.pay.some((p) => !p.received && !p.deferred)) return true;\n", "", PC, T),
    ('F2 a release to come not read', P, "  if (c.status === 'shot' && !e.history.some((h) => h.key === 'release:shelved')) return true;\n", "", PC, T),
    ('F3 a shelved release kept for ever', P, "  if (c.status === 'shot' && !e.history.some((h) => h.key === 'release:shelved')) return true;", "  if (c.status === 'shot') return true;", PC, T),
    ('F4 a recent release not read', P, "  if (c.releasedAt !== undefined && now !== undefined && now - c.releasedAt < LIVE_AFTER_RELEASE) return true;\n", "", PC, T),
    ('F5 an open entry not read', P, "  return [...(pro.awards ?? []), ...(pro.guild ?? []), ...(pro.festivals ?? [])].some((x) => x.creditId === c.id && open.includes(x.state));", "  return false;", PC, T),
    ('F6 every engagement kept', P, ".filter((e) => !stillRead(pro, e, now)));", ".filter((e) => !stillRead(pro, e, now) && false));", PC, T),
    ('F7 each entry its own field', 'src/engine/systems/awards.ts', "list.filter((x) => x.year === a!.year && x.category === a!.category && x.state === 'entered' && !x.field)", "list.filter((x) => x === a)", 'tests/career-awards.test.ts', 'two guest parts'),
    ('F8 the count not one more', 'src/engine/systems/awards.ts', "submissions: submissions - 1 + mine.length", "submissions", 'tests/career-awards.test.ts', 'two guest parts'),
    ('F9 the note not said', 'src/engine/systems/awards.ts', "const others = also > 0 ?", "const others = also > 99 ?", 'tests/career-awards.test.ts', 'two guest parts'),
    ('F10 the recap not naming the part', 'src/engine/systems/awards.ts', "${other ? `You won it for ${other.role} in ${other.project} instead.` : 'You didn’t win.'}", "You didn’t win.", 'tests/career-awards.test.ts', 'two guest parts'),
    ('F11 the lines not naming the other part', 'src/engine/systems/ceremony.ts', "${again.map((x) => `you again, for ${x.role} in ${x.project}, `).join('')}", "", 'tests/career-awards.test.ts', 'two guest parts'),
    ('F12 lost to your own part as to another', 'src/engine/systems/ceremony.ts', "      : mine ? `It’s you,", "      : false ? `It’s you,", 'tests/career-awards.test.ts', 'two guest parts'),
    ('F13 an old field not read', 'src/engine/systems/awards.ts', "=> id === 'you' || id === youIn(a.creditId);", "=> id === youIn(a.creditId);", 'tests/career-awards.test.ts', 'drawn before'),
    ('F14 the window always are open', 'src/engine/systems/actorawards.ts', "now > submissionsClose(ed) ? 'were open'", "now > submissionsClose(ed) ? 'are open'", 'tests/b27-actor-awards.test.ts', 'places a performance by the rules'),
    ('F15 the Emmy reason for gone work as it was', 'src/engine/systems/awards.ts', "  if (!t || !e) return { eligible: false, why: pastWhy(sim, c) };\n  const premiere = premiereOf(sim, person, c);\n  const year = premiere !== undefined ? emmyYearOf", "  if (!t || !e) return { eligible: false, why: 'This work’s scenes are no longer in the game, so it can’t say.' };\n  const premiere = premiereOf(sim, person, c);\n  const year = premiere !== undefined ? emmyYearOf", 'tests/career-awards.test.ts', 'no longer holds'),
    ('F16 the Actor Awards reason for gone work as it was', 'src/engine/systems/actorawards.ts', "  if (!t || !e) return { eligible: false, why: pastWhy(sim, c) };", "  if (!t || !e) return { eligible: false, why: 'This work’s scenes are no longer in the game, so it can’t say.' };", 'tests/b27-actor-awards.test.ts', 'places a performance by the rules'),
    ('F17 you went up said before it happened', 'src/engine/systems/ceremony.ts', "won && (n.attend.speech || n.attend.accepted === 'unanswered')) lines.push", "won) lines.push", 'tests/b27-ceremony.test.ts', 'doesn’t go up'),
    ('F18 every unreleased credit shelved', 'src/engine/systems/awards.ts', "return c.release?.kind === 'shelved' ? 'It was shelved", "return true ? 'It was shelved", 'tests/career-awards.test.ts', 'no longer holds'),
    ('F19 an open year said closed', 'src/engine/systems/awards.ts', "  if (sim.now <= deadlineOf(ed)) return 'Its part is no longer on your record, so it can’t be entered.';\n", "", 'tests/career-awards.test.ts', 'no longer holds'),
    ('F20 a second entry for one program allowed', 'src/engine/systems/awards.ts', "  if (oc) return `${oc.role} in ${c.project} is entered", "  if (false) return `${oc.role} in ${c.project} is entered", 'tests/career-awards.test.ts', 'one program'),
    ('F21 the production entering one program twice', 'src/engine/systems/awards.ts', "const entered = c.at <= deadlineOf(ed) && !twice && productionEnters", "const entered = c.at <= deadlineOf(ed) && productionEnters", 'tests/career-awards.test.ts', 'one program'),
    ('F22 the recap blaming the deadline', 'src/engine/systems/awards.ts', "Emmy Awards: ${a.why ?? 'the entry deadline passed.'}`;", "Emmy Awards: the entry deadline passed.`;", 'tests/career-awards.test.ts', 'one program'),
    ('F23 a day keeps no parts', 'src/engine/systems/workflow.ts', "  const whole = kept.length > 1 || kept[0]!.f !== undefined;", "  const whole = false;", 'tests/career-workflows.test.ts', 'WF-01'),
    ('F24 parts not replayed', 'src/engine/systems/evaluation.ts', "  if (i.parts?.length) return partsJudged(i, profile, frozenPerformer(i), false);", "", 'tests/career-workflows.test.ts', 'WF-01'),
    ('F25 the insert not kept', 'src/engine/systems/workflow.ts', "...(printed !== best!.overall ? { f: STUNT.insert } : {})", "", 'tests/career-workflows.test.ts', 'WF-18'),
]
only = sys.argv[1:]
for name, path, old, new, test, pattern in MUTS:
    if only and name.split()[0] not in only: continue
    p = ROOT + path
    src = open(p, encoding='utf-8').read()
    if src.count(old) != 1: print(name, 'ANCHOR', src.count(old), flush=True); continue
    open(p, 'w', encoding='utf-8').write(src.replace(old, new, 1))
    try:
        r = subprocess.run(['npx', 'vitest', 'run', test, '-t', pattern], cwd=ROOT, capture_output=True, text=True, timeout=1200)
        out = r.stdout + r.stderr
        verdict = 'KILLED' if r.returncode != 0 else 'SURVIVED'
        line = next((l.strip() for l in out.splitlines() if l.strip().startswith('→')), '')
        print(f'{verdict}  {name}  {line[:150]}', flush=True)
    finally:
        open(p, 'w', encoding='utf-8').write(src)
