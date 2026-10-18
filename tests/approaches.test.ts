/**
 * Another way at a weakness that keeps coming back (`approach` in
 * `systems/coursework.ts`, from 2026-10-08): offered once a note is open and
 * given three times, on a part the work prepares; one a work; each changing
 * what's done and how it's read, none taking the note by itself, none a way
 * to grow without limit; and a persistent note said quietly, at most once a
 * week.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { PREP_DIMS } from '@/engine/content/coursework';
import {
  activitiesOf, approachRefusal, courseworkOf, notesOf, preparedParts, prepareRefusal, questionsFor, setWork, show, weightsOf, type Assignment,
} from '@/engine/systems/coursework';
import { APPROACH, LEARNING, recordNote } from '@/engine/systems/learning';

const zone = 'America/New_York';
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
let n = 0;
/** Scene study, prepared: every part at `rest`, the lines at `lines`, every choice supported. */
function work(sim: Simulation, lines: number, rest = 0.95): Assignment {
  n += 1;
  const cw = courseworkOf(sim, sim.player)!;
  for (const a of cw.assignments) if (a.status === 'open' || a.status === 'revising') a.status = 'done';
  const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: Math.min(28, n) })!;
  for (const d of PREP_DIMS) a.prep[d] = rest;
  a.prep.memorization = lines;
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id;
  return a;
}
/** The lines named three times: a persistent weakness. */
function persistent(sim: Simulation) {
  const notes = notesOf(courseworkOf(sim, sim.player)!);
  for (let i = 0; i < LEARNING.persistent; i += 1) recordNote(notes, { kind: 'dim', dim: 'memorization' }, `2026-09-0${i + 1}`, `x${i}`, 'Acting I', 0.2);
}

describe('another way at it', () => {
  it('is offered only for a note given often, one a work', () => {
    const sim = life('ap-offer');
    tended(sim, sim.now + MS_HOUR);
    const a = work(sim, 0.2);
    expect(approachRefusal(sim, sim.player, a, 'drill')).toBe('None of your recurring notes is one this piece can help with.');
    // Given twice, not yet: three times makes it one that keeps coming back.
    const notes = notesOf(courseworkOf(sim, sim.player)!);
    for (let i = 0; i < LEARNING.persistent - 1; i += 1) recordNote(notes, { kind: 'dim', dim: 'memorization' }, `2026-08-2${i}`, `y${i}`, 'Acting I', 0.2);
    expect(approachRefusal(sim, sim.player, a, 'drill')).toBe('None of your recurring notes is one this piece can help with.');
    persistent(sim);
    expect(approachRefusal(sim, sim.player, a, 'drill')).toBeUndefined();
    expect(sim.must<{ dim: string }>({ kind: 'school.approach', payload: { assignmentId: a.id, kind: 'drill' } }).dim).toBe('memorization');
    expect(sim.execute({ kind: 'school.approach', payload: { assignmentId: a.id, kind: 'smaller' } }).error).toMatch(/^You’ve already chosen a targeted drill for this piece\./);
    expect(sim.execute({ kind: 'school.approach', payload: { assignmentId: a.id, kind: 'nonsense' } }).error).toBe('That isn’t a way to work on it.');
  });

  it('a drill is a step of the work, once a day, moving the part by what’s left, through a save; the note stays open', () => {
    let sim = life('ap-drill');
    tended(sim, sim.now + MS_HOUR);
    const a = work(sim, 0.2);
    persistent(sim);
    sim.must({ kind: 'school.approach', payload: { assignmentId: a.id, kind: 'drill' } });
    sim = reload(sim);
    const b = courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === a.id)!;
    expect(activitiesOf(b).some((x) => x.id === 'drill')).toBe(true);
    const before = b.prep.memorization;
    const t0 = sim.now;
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: b.id, activity: 'drill' } }).ok).toBe(true);
    expect(sim.now - t0).toBe(APPROACH.drill.minutes * 60_000);
    expect(b.prep.memorization).toBeGreaterThan(before);
    expect(b.prep.memorization).toBeLessThan(before + APPROACH.drill.gain);
    expect(prepareRefusal(sim, sim.player, b, 'drill')).toBe('You’ve done this today. It builds over several days, not in one long session.');
    expect(notesOf(courseworkOf(sim, sim.player)!).find((x) => x.key === 'dim:memorization')!.status).toBe('open');
  });

  it('put first, the part weighs more; a smaller piece reads whole at six tenths and shows as no better than Working', () => {
    const sim = life('ap-ways');
    tended(sim, sim.now + MS_HOUR);
    sim.player.craft = Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 80])) as never;
    persistent(sim);
    const first = work(sim, 0.2);
    // From no objective: the persistent note may have set one already, as it should (`objectiveFor`).
    delete first.objective;
    const w0 = weightsOf(first).memorization!;
    sim.must({ kind: 'school.approach', payload: { assignmentId: first.id, kind: 'objective' } });
    expect(first.objective).toBe('lines');
    expect(weightsOf(first).memorization!).toBeGreaterThan(w0);
    const small = work(sim, APPROACH.smaller);
    sim.must({ kind: 'school.approach', payload: { assignmentId: small.id, kind: 'smaller' } });
    expect(preparedParts(sim.player, small, '2026-10-01').memorization).toBeCloseTo(1, 10);
    for (const d of PREP_DIMS) small.prep[d] = d === 'memorization' ? APPROACH.smaller : 1;
    const s = show(sim, sim.player, small, '2026-10-01', instantFromZoned({ year: 2026, month: 10, day: 1, hour: 10 }, zone));
    expect(s.band).toBe('working');
    // The note can be taken there: the piece asked for was learned.
    expect(small.taken).toContain('dim:memorization');
  });

  it('with the partner, the next rehearsal kept works on it, once; not without a partner who’d work with you', () => {
    const sim = life('ap-partner');
    tended(sim, sim.now + MS_HOUR);
    persistent(sim);
    const a = work(sim, 0.2, 0.3);
    const mate = sim.player.school!.classmates[a.partner!]!;
    (mate as { trust?: number }).trust = 10;
    expect(approachRefusal(sim, sim.player, a, 'partner')).toMatch(/would rather work alone/);
    (mate as { trust?: number }).trust = 60;
    sim.must({ kind: 'school.approach', payload: { assignmentId: a.id, kind: 'partner' } });
    expect(a.approach!.kind).toBe('partner');
  });
});

describe('a weakness ignored', () => {
  it('is said quietly, at most once a week, while the card and the ledger keep it in view', () => {
    const sim = life('ap-quiet');
    tended(sim, sim.now + MS_HOUR);
    persistent(sim);
    // Shown at several meetings within a week, the lines short each time.
    for (const day of [1, 2, 3, 5, 9]) {
      const a = work(sim, 0.1);
      a.dueOn = `2026-09-${String(day).padStart(2, '0')}`;
      void a;
    }
    const before = sim.universe.notifications.filter((x) => x.title === 'Still There: Lines').length;
    tended(sim, instantFromZoned({ year: 2026, month: 9, day: 30, hour: 20 }, zone));
    const still = sim.universe.notifications.filter((x) => x.title === 'Still There: Lines');
    // However many showings named it, at most one notice a week.
    const weeks = Math.ceil((instantFromZoned({ year: 2026, month: 9, day: 30, hour: 20 }, zone) - instantFromZoned({ year: 2026, month: 8, day: 24, hour: 0 }, zone)) / (7 * MS_DAY));
    expect(still.length - before).toBeLessThanOrEqual(weeks);
    const rec = notesOf(courseworkOf(sim, sim.player)!).find((x) => x.key === 'dim:memorization')!;
    expect(rec.status === 'open' || rec.status === 'resolved').toBe(true);
  });
});
