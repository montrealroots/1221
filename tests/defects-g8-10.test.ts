/**
 * Coursework defects confirmed on 2026-10-12 (group g8, part 10), each held here:
 * - both readings tried at a rehearsal kept moved `prep.interpretation` on every scene, though on a scene whose table
 *   work is the answers alone nothing the showing reads it (`interpretationOf`);
 * - a rehearsal kept with a partner never rehearsed the chosen way of playing in, though the partner evening is the
 *   scene's work on its feet with the other person in it;
 * - the comments in `systems/classmates.ts` said an answer was due by ten the next evening, that encouragement came
 *   from a friend only, and that making amends lifted a boundary. What the code does is pinned here, so the corrected
 *   comments have a test under them.
 * TEST SETUP throughout: assignments written onto the coursework, as tests/coursework-defects.test.ts does, the
 * clock's own commitments cleared where a rehearsal is booked, and the partner's reliability set to 1 so the evening
 * is kept (the draw of whether they come is the subject of tests/partners.test.ts, not of these).
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { PREP_DIMS, templateById } from '@/engine/content/coursework';
import { courseworkOf, interpretationOf, mateRecord, notesOf, questionsFor, type Assignment, type PartnerRehearsal } from '@/engine/systems/coursework';
import { recordNote } from '@/engine/systems/learning';
import { CLASS, classMoment, keptWith, momentsOf, noteIncident, personOf } from '@/engine/systems/classmates';
import { BONDS } from '@/engine/systems/school';

const zone = 'America/New_York';
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

function work(sim: Simulation, template: string, prep: Partial<Record<string, number>>, sceneId: string): Assignment {
  const a: Assignment = {
    id: `g810-${template}`, course: 'DRAM 403a/b', template, term: 1, setOn: '2026-08-24', dueOn: '2026-12-01', sceneId, role: 0, partner: 0,
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), ...prep } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  courseworkOf(sim, sim.player)!.assignments.push(a);
  mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
  return a;
}

/** A rehearsal with the partner asked for an evening they're free, and kept. */
function keep(sim: Simulation, a: Assignment): PartnerRehearsal {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  mateRecord(sim.player.school!.classmates[0]!).reliability = 1;
  for (let day = 24; day <= 31; day += 1) {
    const when = instantFromZoned({ year: 2026, month: 8, day, hour: 19 }, zone);
    const asked = sim.must<{ accepted: boolean; rehearsalId?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: when } });
    if (!asked.accepted) continue;
    tended(sim, when + 3 * MS_HOUR);
    const r = a.rehearsals.find((x) => x.id === asked.rehearsalId)!;
    expect(r.status).toBe('kept');
    return r;
  }
  throw new Error('No evening the partner was free in the first week.');
}

describe('both readings tried at a rehearsal kept', () => {
  it('leave a scene whose table work is the answers alone with no figure moved, and bring the readings together', () => {
    const sim = life('g810-both-answers');
    const a = work(sim, 'scene-study', { familiarity: 0.6, memorization: 0.6 }, 'seagull-4');
    expect(templateById('scene-study')!.activities.some((x) => x.dim === 'interpretation')).toBe(false);
    for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id;
    // TEST SETUP: a reading held apart, then both agreed to be tried (`school.respond`, `systems/classmates.ts`).
    a.readsApart = 'objective';
    a.tryBoth = true;
    const table = interpretationOf(a);
    keep(sim, a);
    expect(a.tryBoth).toBeUndefined();
    expect(a.readsApart).toBeUndefined();
    // Nothing reads `prep.interpretation` on this scene, and nothing writes it now.
    expect(a.prep.interpretation).toBe(0);
    expect(interpretationOf(a)).toBe(table);
  });

  it('move the step’s half of the table work where the course has a step at the table', () => {
    const sim = life('g810-both-scan');
    const a = work(sim, 'classical-scene', { familiarity: 0.6, memorization: 0.6 }, 'muchado-4-1');
    expect(templateById('classical-scene')!.activities.some((x) => x.dim === 'interpretation')).toBe(true);
    for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id;
    a.tryBoth = true;
    const table = interpretationOf(a);
    keep(sim, a);
    expect(a.tryBoth).toBeUndefined();
    expect(a.prep.interpretation).toBeCloseTo(CLASS.bothGain, 12);
    expect(interpretationOf(a)).toBeGreaterThan(table);
  });
});

describe('a rehearsal kept with a partner', () => {
  it('rehearses the chosen way of playing in, as the steps on your feet do; with none chosen there’s nothing to rehearse', () => {
    const sim = life('g810-playing');
    const a = work(sim, 'scene-study', { familiarity: 0.6, memorization: 0.6 }, 'seagull-4');
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
    sim.must({ kind: 'school.choose_playing', payload: { assignmentId: a.id, pace: 'driven' } });
    expect(a.playing!.prep).toBe(0);
    keep(sim, a);
    expect(a.prep.partner).toBeGreaterThan(0);
    expect(a.playing!.prep).toBeGreaterThan(0);
    // The same evening with no way chosen moves the partner part as much, and rehearses nothing in.
    const twin = life('g810-playing');
    const b = work(twin, 'scene-study', { familiarity: 0.6, memorization: 0.6 }, 'seagull-4');
    keep(twin, b);
    expect(b.playing).toBeUndefined();
    expect(b.prep.partner).toBeCloseTo(a.prep.partner, 12);
  });

  it('leaves the partner part’s branch in `prepare` to a targeted drill on it, which still rehearses the choice in', () => {
    // The triage of 2026-10-12 read `act.dim === 'partner'` in `prepareRefusal` and `prepare` as unreachable, since the
    // partner step is always refused there; a drill on a persistent partner note (`school.approach`) reaches it.
    const sim = life('g810-drill');
    const a = work(sim, 'scene-study', { familiarity: 0.6, memorization: 0.6 }, 'seagull-4');
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
    const notes = notesOf(courseworkOf(sim, sim.player)!);
    for (const [k, on] of ['2026-08-01', '2026-08-08', '2026-08-15'].entries()) recordNote(notes, { kind: 'dim', dim: 'partner' }, on, `before-${k}`, 'Acting I', 0.2);
    expect(sim.must<{ dim: string }>({ kind: 'school.approach', payload: { assignmentId: a.id, kind: 'drill' } }).dim).toBe('partner');
    sim.must({ kind: 'school.choose_playing', payload: { assignmentId: a.id, pace: 'driven' } });
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'partner' } }).error).toMatch(/rehearsal you both agree to/);
    const done = sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'drill' } });
    expect(done.ok, done.error).toBe(true);
    expect(a.prep.partner).toBeGreaterThan(0);
    expect(a.playing!.prep).toBeGreaterThan(0);
  });
});

describe('what the class does, as systems/classmates.ts now says it', () => {
  it('an answer is due 22 hours after the class that brought it: seven the next morning, for a class at nine', () => {
    const sim = life('g810-answer-by');
    const start = instantFromZoned({ year: 2026, month: 8, day: 31, hour: 8 }, zone);
    let m;
    for (let d = 0; d < 40 && !m; d += 1) {
      tended(sim, start + d * 24 * MS_HOUR + 16 * MS_HOUR);
      m = momentsOf(courseworkOf(sim, sim.player)!).find((x) => x.status !== 'said');
    }
    expect(m).toBeDefined();
    expect(m!.until - m!.at).toBe(CLASS.answerHours * MS_HOUR);
    const made = zonedParts(m!.at, zone);
    const due = zonedParts(m!.until, zone);
    expect(made.hour).toBe(9);
    expect(due.hour).toBe(7);
    expect(Date.UTC(due.year, due.month - 1, due.day) - Date.UTC(made.year, made.month - 1, made.day)).toBe(24 * MS_HOUR);
  });

  it('encouragement comes from a classmate at a bond of CLASS.encourage.bondFrom, below a friend’s', () => {
    const sim = life('g810-encourage');
    expect(CLASS.encourage.bondFrom).toBeLessThan(BONDS.friend);
    const cw = courseworkOf(sim, sim.player)!;
    const bad = work(sim, 'scene-study', {}, 'seagull-4');
    bad.status = 'done';
    bad.shown = { band: 'unready', score: 0.2, at: sim.now, strengths: [] } as unknown as Assignment['shown'];
    const mates = sim.player.school!.classmates;
    for (const [i, mate] of mates.entries()) if (i > 0) delete mateRecord(mate).met;
    const mate = mates[0]!;
    mate.bond = CLASS.encourage.bondFrom;
    // TEST SETUP: the kinds of moment this classmate could bring otherwise, had with them just now.
    personOf(mate).moments = [{ at: sim.now, kind: 'study' }, { at: sim.now, kind: 'help' }];
    let said;
    for (let day = 1; day <= 28 && !said; day += 1) said = classMoment(sim, sim.player, { year: 2026, month: 9, day });
    expect(said?.kind).toBe('encouragement');
    expect(mate.bond).toBeLessThan(BONDS.friend);
    expect(momentsOf(cw).some((x) => x.kind === 'encouragement' && x.mate === 0)).toBe(true);
  });

  it('making amends puts right what’s unrepaired and lifts no boundary; rehearsals kept since lift it', () => {
    const sim = life('g810-amends');
    const mate = sim.player.school!.classmates[0]!;
    mateRecord(mate).met = sim.now;
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
    noteIncident(mate, sim.now, 'missed');
    personOf(mate).boundary = { since: sim.now, keptSince: 0, accepted: true };
    const trust = mateRecord(mate).trust ?? 50;
    expect(sim.must<{ repaired: number }>({ kind: 'school.make_amends', payload: { mate: 0 } }).repaired).toBe(1);
    expect(mateRecord(mate).trust).toBe(trust + CLASS.amends.missed.trust);
    expect(personOf(mate).boundary).toBeDefined();
    keptWith(mate);
    expect(personOf(mate).boundary).toBeDefined();
    keptWith(mate);
    expect(personOf(mate).boundary).toBeUndefined();
    // Pushed back on: four kept. Set before 2026-10-10 (no answer kept): three.
    personOf(mate).boundary = { since: sim.now, keptSince: 0, accepted: false };
    for (let k = 1; k < CLASS.boundary.liftAfterKept.pushedBack; k += 1) keptWith(mate);
    expect(personOf(mate).boundary).toBeDefined();
    keptWith(mate);
    expect(personOf(mate).boundary).toBeUndefined();
    personOf(mate).boundary = { since: sim.now, keptSince: 0 };
    for (let k = 1; k < CLASS.boundary.liftAfterKept.before; k += 1) keptWith(mate);
    expect(personOf(mate).boundary).toBeDefined();
    keptWith(mate);
    expect(personOf(mate).boundary).toBeUndefined();
  });
});
