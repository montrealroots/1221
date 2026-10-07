/**
 * The class as people (`systems/classmates.ts`, from 2026-10-08): moments a
 * classmate brings in class and how each answer moves the one record they
 * carry (trust, bond, memory); a boundary after being let down and how it's
 * kept and lifted; making amends; ordinary days left ordinary; and the class
 * remembered as contacts after the degree.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { bondMove } from '@/engine/systems/school';
import { askRefusal, courseworkOf, mateBusy, mateRecord, openFor, questionsFor, trustOf } from '@/engine/systems/coursework';
import { CLASS, MOMENT_KIND, STUDY_KIND, classMoment, keptWith, momentsOf, noteIncident, personOf, priorityOf, type Moment, type MomentKind } from '@/engine/systems/classmates';
import { contactsOf, knowTheClass } from '@/engine/systems/people';

const zone = 'America/New_York';
const at = (month: number, day: number, hour = 9, year = 2026) => instantFromZoned({ year, month, day, hour }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const cw = (sim: Simulation) => courseworkOf(sim, sim.player)!;
/** Played a day at a time from the first class until a classmate brings a moment of a kind. */
function until(sim: Simulation, kinds: MomentKind[], days = 60): Moment | undefined {
  for (let d = 0; d < days; d += 1) {
    const m = momentsOf(cw(sim)).find((x) => kinds.includes(x.kind) && (x.status === 'open' || x.status === 'said'));
    if (m) return m;
    // Answer anything else that's waiting, so the next can come.
    for (const x of momentsOf(cw(sim)).filter((y) => y.status === 'open')) sim.execute({ kind: 'school.respond', payload: { momentId: x.id, choice: x.kind === 'study' || x.kind === 'help' ? 'no' : x.kind === 'disagreement' ? 'hold' : x.kind === 'apology' ? 'accept' : 'respect' } });
    // Something chosen at the table, so a shared scene can be read another way.
    for (const a of cw(sim).assignments.filter((x) => x.status === 'open' && x.partner !== undefined)) for (const { q, options } of questionsFor(a)) if (!a.answers[q.id]) a.answers[q.id] = options[0]!.id;
    tended(sim, at(8, 31, 20) + d * MS_DAY);
  }
  return undefined;
}

describe('ordinary days', () => {
  it('leaves most class days without a moment, and never two waiting at once', () => {
    const sim = life('cm-ordinary');
    tended(sim, at(8, 31, 20));
    let days = 0, withMoment = 0;
    for (let d = 0; d < 40; d += 1) {
      const before = momentsOf(cw(sim)).length;
      tended(sim, at(8, 31, 20) + d * MS_DAY);
      days += 1;
      if (momentsOf(cw(sim)).length > before) withMoment += 1;
      expect(momentsOf(cw(sim)).filter((m) => m.status === 'open').length).toBeLessThanOrEqual(1);
    }
    expect(withMoment).toBeLessThan(days / 2);
    // Priorities drawn once for the class met, and kept.
    const p = sim.player.school!.classmates.map((m) => personOf(m).priority);
    expect(p.every(Boolean)).toBe(true);
    expect(sim.player.school!.classmates.map((_, i) => priorityOf(sim, sim.player, i))).toEqual(p);
  });
});

describe('a disagreement about the shared scene', () => {
  it('can be answered three reasonable ways: keeping yours costs nothing where the text supports both, theirs changes your answer, both pays at the next rehearsal', () => {
    let sim = life('cm-disagree');
    tended(sim, at(8, 31, 8));
    const m = until(sim, ['disagreement'], 90)!;
    expect(m).toBeDefined();
    expect(m.text).toMatch(/reads .* another way: “.*”, where you have “.*”\./);
    // The shared work waits on the answer, and the save keeps the moment.
    const a = cw(sim).assignments.find((x) => x.id === m.assignmentId)!;
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } }).error).toMatch(/reads the scene another way: answer first\./);
    sim = reload(sim);
    const mate = sim.player.school!.classmates[m.mate]!;
    const t0 = trustOf(mate), b0 = mate.bond ?? 0;
    const twins = [reload(sim), reload(sim)];
    // Keep yours.
    const kept = sim.must<{ done: string }>({ kind: 'school.respond', payload: { momentId: m.id, choice: 'hold' } });
    const q = questionsFor(a).find(({ q: x }) => x.id === m.question)!;
    const mineSupported = q.options.find((o) => o.id === a.answers[m.question as never])!.supported;
    const theirsSupported = q.options.find((o) => o.id === m.theirs)!.supported;
    expect(trustOf(sim.player.school!.classmates[m.mate]!)).toBe(t0 + (!mineSupported && theirsSupported ? CLASS.holdAgainstText.trust : 0));
    expect(kept.done).toMatch(/You kept yours/);
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice: 'hold' } }).error).toBe('You’ve answered it.');
    // Theirs: the answer is theirs now.
    const [t1, t2] = twins as [Simulation, Simulation];
    t1.must({ kind: 'school.respond', payload: { momentId: m.id, choice: 'theirs' } });
    expect(cw(t1).assignments.find((x) => x.id === a.id)!.answers[m.question as never]).toBe(m.theirs);
    expect(trustOf(t1.player.school!.classmates[m.mate]!)).toBe(t0 + CLASS.theirs.trust);
    expect(t1.player.school!.classmates[m.mate]!.bond ?? 0).toBeCloseTo(b0 + bondMove(t1.player, CLASS.theirs.bond), 10);
    // Both: marked for the next rehearsal kept.
    t2.must({ kind: 'school.respond', payload: { momentId: m.id, choice: 'both' } });
    expect((cw(t2).assignments.find((x) => x.id === a.id) as { tryBoth?: boolean }).tryBoth).toBe(true);
    expect(breaches(t2.universe)).toEqual([]);
  });
});

describe('invitations and requests', () => {
  it('running lines: yes books it and moves your weakest lines; missed, it’s something to make right; no costs nothing', () => {
    const sim = life('cm-study');
    tended(sim, at(8, 31, 8));
    const m = until(sim, ['study'], 120)!;
    expect(m).toBeDefined();
    const mate = sim.player.school!.classmates[m.mate]!;
    const twin = reload(sim);
    const t0 = trustOf(mate);
    // No: nothing lost.
    twin.must({ kind: 'school.respond', payload: { momentId: m.id, choice: 'no' } });
    expect(trustOf(twin.player.school!.classmates[m.mate]!)).toBe(t0);
    // Yes, then away when it comes.
    sim.must({ kind: 'school.respond', payload: { momentId: m.id, choice: 'yes' } });
    const booked = sim.universe.scheduled.filter((i) => i.kind === STUDY_KIND && i.status === 'pending');
    expect(booked).toHaveLength(1);
    expect(sim.universe.scheduled.some((i) => i.kind === MOMENT_KIND && i.status === 'pending' && i.payload.momentId === m.id)).toBe(false);
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, m.when! + 2 * MS_HOUR);
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(trustOf(mate)).toBe(t0 + CLASS.study.missed.trust);
    expect(personOf(mate).incidents!.filter((x) => !x.repaired)).toHaveLength(1);
    // Made right: some trust back, once.
    tended(sim, m.when! + 26 * MS_HOUR);
    const r = sim.must<{ repaired: number }>({ kind: 'school.make_amends', payload: { mate: m.mate } });
    expect(r.repaired).toBe(1);
    expect(trustOf(mate)).toBe(t0 + CLASS.study.missed.trust + CLASS.amends.trustPer);
    expect(sim.execute({ kind: 'school.make_amends', payload: { mate: m.mate } }).error).toBe('There’s nothing between you to make right.');
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('kept, running lines moves the least secure open lines, without training a skill', () => {
    const sim = life('cm-study-kept');
    tended(sim, at(8, 31, 8));
    const m = until(sim, ['study'], 120)!;
    sim.must({ kind: 'school.respond', payload: { momentId: m.id, choice: 'yes' } });
    const before = cw(sim).assignments.filter((a) => (a.status === 'open' || a.status === 'revising') && a.sceneId).map((a) => ({ id: a.id, v: a.prep.memorization }));
    const memo = sim.player.craft!.memorization;
    tended(sim, m.when! + 2 * MS_HOUR);
    const moved = before.filter((b) => cw(sim).assignments.find((a) => a.id === b.id)!.prep.memorization > b.v);
    if (before.length) expect(moved.length).toBe(1);
    expect(sim.player.craft!.memorization).toBeCloseTo(memo, 1);
  });
});

describe('a boundary', () => {
  it('comes after two letdowns not made right; asks a day’s notice; is lifted after three kept rehearsals', () => {
    const sim = life('cm-boundary');
    tended(sim, at(8, 31, 8));
    const a = openFor(sim, sim.player, 'DRAM 103a/b')!;
    const mate = sim.player.school!.classmates[a.partner!]!;
    noteIncident(mate, sim.now, 'missed');
    noteIncident(mate, sim.now, 'lateCancel');
    let m: Moment | undefined;
    for (let d = 0; d < 60 && !m; d += 1) {
      for (const x of momentsOf(cw(sim)).filter((y) => y.status === 'open' && y.kind !== 'boundary')) sim.execute({ kind: 'school.respond', payload: { momentId: x.id, choice: x.kind === 'study' || x.kind === 'help' ? 'no' : x.kind === 'disagreement' ? 'hold' : 'accept' } });
      tended(sim, at(8, 31, 20) + d * MS_DAY);
      m = momentsOf(cw(sim)).find((x) => x.kind === 'boundary' && x.status === 'open' && x.mate === a.partner);
    }
    expect(m).toBeDefined();
    sim.must({ kind: 'school.respond', payload: { momentId: m!.id, choice: 'respect' } });
    expect(personOf(mate).boundary).toBeDefined();
    const open = openFor(sim, sim.player, 'DRAM 103a/b') ?? a;
    // An hour tomorrow they're free, under a day ahead: refused for the boundary.
    const hours = Array.from({ length: 23 }, (_, h) => sim.now + (h + 2) * MS_HOUR).filter((w) => !mateBusy(sim.player, a.partner!, w, 90));
    expect(hours.length).toBeGreaterThan(0);
    expect(askRefusal(sim, sim.player, open, hours[0]!).declines).toBe(`${mate.name.split(' ')[0]} asked to be asked a day ahead, after last time.`);
    // Kept three times since: lifted.
    personOf(mate).boundary!.keptSince = CLASS.boundary.liftAfterKept - 1;
    keptWith(mate);
    expect(personOf(mate).boundary).toBeUndefined();
  });
});

describe('after the degree', () => {
  it('the class is known by its bonds, and remembers what happened at school', () => {
    const sim = life('cm-after');
    tended(sim, at(8, 31, 20));
    const mate = sim.player.school!.classmates[0]!;
    mateRecord(mate).log = [{ at: sim.now, what: 'Ran lines with you' }, { at: sim.now - MS_DAY, what: 'You helped them with their lines when they were behind' }];
    mate.bond = 30;
    knowTheClass(sim, sim.player, sim.player.school!.classmates);
    const c = contactsOf(sim.player).find((x) => x.name === mate.name)!;
    expect(c.memory.map((x) => x.what)).toEqual(['At Yale: Ran lines with you', 'At Yale: You helped them with their lines when they were behind']);
    expect(c.rival).toBeUndefined();
  });

  it('classMoment is a no-op for a life without a school', () => {
    const sim = life('cm-none');
    delete (sim.player as { school?: unknown }).school;
    expect(classMoment(sim, sim.player, { year: 2026, month: 9, day: 1 })).toBeUndefined();
  });
});

describe('one at a time', () => {
  it('brings no new moment while one waits for an answer, on any day', () => {
    const sim = life('cm-one');
    tended(sim, at(9, 4, 20));
    const moments = momentsOf(cw(sim));
    moments.push({ id: 'waiting', mate: 0, kind: 'help', at: sim.now, until: sim.now + 22 * MS_HOUR, status: 'open', text: 'Waiting.' });
    for (let d = 1; d <= 60; d += 1) expect(classMoment(sim, sim.player, { year: 2026, month: 10, day: 1 + (d % 28) })).toBeUndefined();
    expect(momentsOf(cw(sim)).filter((m) => m.status === 'open')).toHaveLength(1);
  });
});
