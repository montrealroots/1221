/**
 * SLATE — H4-R (d), what an ability does outside the judged piece (from 2026-10-16, brief 10;
 * docs/verification/decisions-2026-10-16/criteria.md, H4-R (d)). Each benefit an ability's own description claims
 * beyond the piece judged (`ABILITY_DEFS[].affects`) measured by twin lives through the game's commands: the same seed,
 * the same day, one ability set low in one twin and high in the other (TEST SETUP, as tests/attributes-phase-2a.test.ts
 * and tests/attributes-phase-2b.test.ts set them), the same command played in each, and what it moved read from the
 * save. Each line is reported on its own, apart from H4-R (b), into which nothing here is added.
 *
 *   npx vite-node tools/h4-indirect.ts -- --out h4-indirect.json
 */
import { writeFileSync } from 'node:fs';
import { createSave, loadSave } from '../src/engine';
import { newLifeConfig } from '../src/engine/world/bootstrap';
import type { Simulation } from '../src/engine/core/simulation';
import { instantFromZoned, MS_DAY, MS_HOUR } from '../src/engine/core/time';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { PREP_DIMS } from '../src/engine/content/coursework';
import { BRIEF_BY_ID } from '../src/engine/content/briefs';
import { abilityFull, abilityOf, attributesOf } from '../src/engine/systems/attributes';
import { READER, courseworkOf, mateRecord, partnerPart, questionsFor, type Assignment } from '../src/engine/systems/coursework';
import { recordOf } from '../src/engine/systems/briefs';
import { CALL_KIND } from '../src/engine/systems/school';
import { hasProcess, type Process } from '../src/engine/systems/production';
import type { AbilityId } from '../src/engine/content/abilities';

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1]! : d; };
const OUT = arg('out', 'h4-indirect.json');
const LOW = 20, HIGH = 80;
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const clearDay = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
const rested = (sim: Simulation) => { const w = sim.player.wellbeing; w.energy = 100; w.stress = 0; w.morale = 80; w.nourishment = 90; w.hygiene = 100; w.sleepDebt = 0; };
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;

/** TEST SETUP: an ability set directly, where the save keeps it (the craft for the four kept there, the attributes, the body). */
function setAbility(sim: Simulation, id: AbilityId, level: number): void {
  const p = sim.player;
  const craft: Partial<Record<AbilityId, string>> = { emotionalDepth: 'emotion', memory: 'memorization', vocal: 'voice', physical: 'movement' };
  if (craft[id]) (p.craft as Record<string, number>)[craft[id]!] = level;
  else if (id === 'stamina') p.wellbeing.fitness = (level / 100) * abilityFull(sim, p, 'stamina');
  else (attributesOf(sim, p) as unknown as Record<string, number>)[id] = level;
}

/** TEST SETUP: a coursework assignment on a scene, its parts as given, the table work answered as the text supports. */
function assignment(sim: Simulation, template: string, sceneId: string, prep: Partial<Record<string, number>>, status: Assignment['status'] = 'open'): Assignment {
  const a: Assignment = {
    id: `h4d-${template}-${sceneId}`, course: 'DRAM 103a/b', template, term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', sceneId, role: 0, partner: 0,
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), ...prep } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status,
  };
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
  courseworkOf(sim, sim.player)!.assignments.push(a);
  mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
  return a;
}

type Line = { ability: AbilityId; claim: string; command: string; low: number; high: number; read: string; shows: boolean; note?: string };
const lines: Line[] = [];
/** Twin lives: the same start, the ability at LOW and at HIGH, the same play, the figure each comes to. */
function twins(ability: AbilityId, claim: string, command: string, read: string, start: () => Simulation, play: (sim: Simulation) => number, expect: 'higher' | 'lower' = 'higher'): void {
  const fig = (level: number) => { const sim = start(); setAbility(sim, ability, level); return play(sim); };
  const low = fig(LOW), high = fig(HIGH);
  const shows = expect === 'higher' ? high > low + 1e-12 : high < low - 1e-12;
  lines.push({ ability, claim, command, low: r4(low), high: r4(high), read, shows });
  console.log(`${ability.padEnd(13)} ${shows ? 'shows ' : 'NOT   '} ${claim}: ${r4(low)} at ${LOW}, ${r4(high)} at ${HIGH}`);
}
const fresh = (seed: string) => () => { const sim = life(seed); clearDay(sim); rested(sim); return sim; };
const step = (sim: Simulation, a: Assignment, activity: string) => { const r = sim.execute<{ moved: number }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity } }); if (!r.ok) throw new Error(`${activity}: ${r.error}`); return r.value!.moved; };
const briefStep = (sim: Simulation, brief: string, s: 'read' | 'lines' | 'rehearse') => { const r = sim.execute<{ moved: number }>({ kind: 'brief.prepare', payload: { brief, step: s } }); if (!r.ok) throw new Error(`${s}: ${r.error}`); return r.value!.moved; };

// Listening: an evening with a reader in the partner's place, and a brief rehearsed on its feet against its reader.
twins('listening', 'an evening rehearsing with a reader goes further', 'school.prepare (Scene Study, the reader’s evening)', 'the partner part moved', fresh('h4d-reader'), (sim) => { const a = assignment(sim, 'scene-study', 'seagull-4', { familiarity: 0.6, memorization: 0.6 }); step(sim, a, READER.id); return partnerPart(a); });
twins('listening', 'a brief rehearsed on its feet against its reader goes further', 'brief.prepare rehearse (brief-drama)', 'the rehearsal moved', fresh('h4d-brief-rehearse'), (sim) => { recordOf(sim.player, 'brief-drama').prep.memorization = 0.5; return briefStep(sim, 'brief-drama', 'rehearse'); });
// Imagination: a step of table work (a classical scene's scansion, its interpretation) and a brief's breakdown.
twins('imagination', 'a step of table work goes further', 'school.prepare (Classical Scene, scan)', 'the interpretation moved', fresh('h4d-scan'), (sim) => step(sim, assignment(sim, 'classical-scene', 'hamlet-3-1', { familiarity: 0.6 }), 'scan'));
twins('imagination', 'a brief’s breakdown goes further', 'brief.prepare read (brief-drama)', 'the breakdown moved', fresh('h4d-brief-read'), (sim) => briefStep(sim, 'brief-drama', 'read'));
// Focus: getting to know coursework's material.
twins('focus', 'a step getting to know coursework’s material goes further', 'school.prepare (Scene Study, read)', 'the familiarity moved', fresh('h4d-read'), (sim) => step(sim, assignment(sim, 'scene-study', 'seagull-4', {}), 'read'));
// Memory: a scene's lines, a brief's lines, and (below) a part's.
twins('memory', 'a step learning a scene’s lines goes further', 'school.prepare (Scene Study, learn)', 'the lines moved', fresh('h4d-learn'), (sim) => step(sim, assignment(sim, 'scene-study', 'seagull-4', { familiarity: 0.6 }), 'learn'));
twins('memory', 'a step learning a brief’s lines goes further', 'brief.prepare lines (brief-drama)', 'the lines moved', fresh('h4d-brief-lines'), (sim) => briefStep(sim, 'brief-drama', 'lines'));
// Adaptability: a revision after a note (the work shown and its note given: TEST SETUP status), and (below) a note on the blocking.
twins('adaptability', 'a step of revision after a note goes further', 'school.prepare (Scene Study, revise)', 'the revision moved', fresh('h4d-revise'), (sim) => step(sim, assignment(sim, 'scene-study', 'seagull-4', { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 }, 'revising'), 'revise'));
// Composure: the stress nerves add before a performance (TEST SETUP casting, the call played through the clock).
const performance = (seed: string) => () => {
  const sim = life(seed);
  const p = sim.player;
  p.school!.casting = { production: 'A Test Play', role: 'A Part In A New Play', kind: 'carlotta', term: 0, performed: 0 };
  p.awakeSince = sim.now - 60_000;
  rested(sim);
  return sim;
};
const playNight = (sim: Simulation) => { sim.schedule({ at: sim.now + 60_000, kind: 'school.call', label: 'A Test Play: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 150, payload: { personId: sim.player.id, call: 'performance' } }); sim.advanceTo(sim.now + 2 * 60_000); };
twins('composure', 'the stress nerves add before a performance is less', 'a performance call, played through the clock', 'stress after the curtain', performance('h4d-nerves'), (sim) => { playNight(sim); return sim.player.wellbeing.stress; }, 'lower');
// Discipline: how much an hour of practice grows.
twins('discipline', 'an hour of practice grows more', 'practice.exercise (sense-memory)', 'emotional depth gained', fresh('h4d-practice'), (sim) => { const r = sim.execute<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: 'sense-memory' } }); if (!r.ok) throw new Error(r.error); return r.value!.gained; });
// Stamina: the condition after the work, a night, and across a run of three (the energy the night leaves).
twins('stamina', 'a night on stage leaves more energy after it', 'a performance call, played through the clock', 'energy after the curtain', performance('h4d-night-energy'), (sim) => { playNight(sim); return sim.player.wellbeing.energy; });

// The festival's first rehearsal call (cast on 4 January 2027), reached once by the clock and opened again for each twin.
{
  const sim = life('h4d-festival');
  sim.advanceTo(instantFromZoned({ year: 2027, month: 1, day: 4, hour: 9 }, 'America/New_York') + 60_000);
  const first = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((x, y) => x.at - y.at)[0];
  if (first) {
    while (sim.now < first.at + 7 * MS_HOUR) { rested(sim); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(first.at + 7 * MS_HOUR, sim.now + 6 * MS_HOUR)); }
    const saved = serialise(sim.universe);
    const open = () => { const s = loadSave(deserialise(saved) as never); rested(s); return s; };
    const proc = (s: Simulation) => (s.player.school!.casting as unknown as { process: Process }).process;
    if (hasProcess(sim.player.school!.casting!)) {
      twins('memory', 'a step learning a part’s lines goes further', 'school.learn_part (the festival)', 'the part’s lines moved', open, (s) => { const before = proc(s).lines; const r = s.execute({ kind: 'school.learn_part', payload: {} }); if (!r.ok) throw new Error(r.error); return proc(s).lines - before; });
      twins('adaptability', 'a director’s note on the blocking worked into a part goes further', 'school.work_note (the festival)', 'the blocking moved', open, (s) => { const p = proc(s); p.blocking = 0.5; p.notes.push({ at: s.now, text: 'The blocking isn’t set in you.', focus: { kind: 'blocking' } }); const r = s.execute({ kind: 'school.work_note', payload: {} }); if (!r.ok) throw new Error(r.error); return p.blocking - 0.5; });
    }
  }
}
void MS_DAY; void abilityOf; void BRIEF_BY_ID;

const out = {
  criterion: 'H4-R (d): each benefit outside the judged piece an ability’s description claims, by twin lives through the commands, on its own line',
  levels: { low: LOW, high: HIGH },
  lines,
  shown: lines.filter((l) => l.shows).length, of: lines.length,
  notShown: lines.filter((l) => !l.shows).map((l) => `${l.ability}: ${l.claim}`),
};
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
console.log(`${out.shown} of ${out.of} shown`);
