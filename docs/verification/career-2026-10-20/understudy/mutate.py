#!/usr/bin/env python3
"""Mutation-checks brief 19's D6 claims: each mutation takes one claim out of the code, runs the test that holds it, and
records whether the test failed (it should). Each file is restored from git after its run."""
import json, subprocess, sys, re

CLONE = '/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/b19-understudy'
TESTS = sys.argv[1] if len(sys.argv) > 1 else 'tests/understudy-part.test.ts'
ONLY = sys.argv[2].split(',') if len(sys.argv) > 2 else None
S = 'src/engine/systems/school.ts'
W = 'src/engine/systems/workpieces.ts'
I = 'src/engine/index.ts'
U = 'src/ui/workspaces/SchoolWorkspace.tsx'

MUTATIONS = [
  ('covered-lead-only', 'an understudy covers the biggest part written for them, not a lead or nothing', S,
   "for (const size of ['lead', 'supporting', 'featured'] as const) {", "for (const size of ['lead'] as const) {"),
  ('size-not-read', "an understudy's size is the covered part's in its play", S,
   "const part = c.kind === 'understudy' && c.play ? REP_PLAYS.find((p) => p.title === c.play)?.parts.find((p) => p.name === c.role) : undefined;",
   "const part = undefined as { size: PartSize } | undefined;"),
  ('night-as-lead', "a night is judged at the covered part's size", S,
   "casting, item.at, partSizeOf(casting), rep ? 'rep' : 'school');", "casting, item.at, casting.size ?? 'lead', rep ? 'rep' : 'school');"),
  ('forecast-as-lead', "A Night Now is forecast at the covered part's size", W,
   "holder, sim.now, partSizeOf(holder), w === 'rep'", "holder, sim.now, holder.size ?? 'lead', w === 'rep'"),
  ('spec-as-lead', "the part's piece is the covered part's evening", W,
   "spec: () => playPiece(holder, partSizeOf(holder)),", "spec: () => playPiece(holder, holder.size ?? 'lead'),"),
  ('hours-as-lead', "a night gone on keeps the covered part's hours on stage", S,
   "stageHours(casting, partSizeOf(casting))", "stageHours(casting, casting.size ?? 'lead')"),
  ('old-oncall-as-lead', "a night on call booked before 2026-09-28 costs the covered part's evening", S,
   "casting, item.at, partSizeOf(casting), 'rep', true)", "casting, item.at, 'lead', 'rep', true)"),
  ('oncall-unnamed', 'a night on call names the part on the calendar', S,
   "const onCallFor = (role: string): string => (bySize(role) ? 'On Call' : `On Call For ${role}`);", "const onCallFor = (role: string): string => (bySize(role) ? 'On Call' : 'On Call');"),
  ('no-why', 'the casting notice says why the part is a supporting one', S,
   "return size === 'lead' ? '' : ` Its leads", "return size === size ? '' : ` Its leads"),
  ('tab-no-size', "the Casting tab says an understudy's part's size", U,
   "note={(casting.size || casting.kind === 'understudy') && !casting.role.startsWith('A ')", "note={casting.size && !casting.role.startsWith('A ')"),
  ('no-mark', 'a save from before is marked on opening', I,
   "    nameTheCover(sim);\n    opened.push('nameTheCover');", "    opened.push('nameTheCover');"),
  ('mark-ignores-judged', 'a save whose run was judged keeps the company cover', S,
   "const judged = r.performed > 0 || Object.keys(r.nights ?? {}).length > 0 || (r as Casting & { closed?: Instant }).closed !== undefined;",
   "const judged = (r as Casting & { closed?: Instant }).closed !== undefined;"),
  ('mark-ignores-closed', 'a save whose run has closed keeps the company cover', S,
   "const judged = r.performed > 0 || Object.keys(r.nights ?? {}).length > 0 || (r as Casting & { closed?: Instant }).closed !== undefined;",
   "const judged = r.performed > 0 || Object.keys(r.nights ?? {}).length > 0;"),
  ('mark-no-relabel', "a save's calls still to come are named for the part", S,
   "if (item.payload.call === 'oncall') item.label = `${r.production}: ${onCallFor(r.role)}`;", "if (item.payload.call === 'oncall') item.label = String(item.label);"),
  ('mark-untold', 'the player is told once what the mark assigned', S,
   "if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: `Your Understudy Part: ${part.name}`",
   "if (person.id === 'nobody') sim.notify({ category: 'school', title: `Your Understudy Part: ${part.name}`"),
  ('mark-uncounted', 'the mark returns how many it gave a part, and a second opening gives none', S,
   "      r.role = part.name;\n      named += 1;", "      r.role = part.name;\n      named += 2;"),
]

out = []
for (mid, claim, f, old, new) in MUTATIONS:
  if ONLY and mid not in ONLY: continue
  path = f'{CLONE}/{f}'
  src = open(path, encoding='utf8').read()
  n = src.count(old)
  if n != 1:
    out.append({'id': mid, 'claim': claim, 'file': f, 'error': f'found {n} times'}); continue
  open(path, 'w', encoding='utf8').write(src.replace(old, new))
  try:
    r = subprocess.run(['npx', 'vitest', 'run', *TESTS.split(','), '--maxWorkers=1', '--minWorkers=1'], cwd=CLONE, capture_output=True, text=True, timeout=3000)
    text = r.stdout + r.stderr
    failed = sorted(set(re.findall(r'FAIL\s+\S+ > (.+)', text)))
    out.append({'id': mid, 'claim': claim, 'file': f, 'exit': r.returncode, 'killed': r.returncode != 0, 'failed': failed})
  finally:
    subprocess.run(['git', 'checkout', '--', f], cwd=CLONE, check=True)
  print(json.dumps(out[-1]), flush=True)
json.dump(out, open('/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/b19u/mutations.json', 'w'), indent=1)
