/**
 * The school journey's gaps found by the audit of 2026-10-10 (docs/verification/school-journey-audit.json), each held
 * by the behavior it fixed:
 * - a dismissal ends the coursework;
 * - the last term on academic warning withholds the degree;
 * - a hospital stay excuses a partner rehearsal;
 * - a piece not shown, or not shown again, counts as unready;
 * - a note on a part already prepared isn't "taken" without work;
 * - an activity can't run across a class;
 * - elective shifts keep to the term and stay off nights on call;
 * - Yale Health ends with the term paid for.
 *
 * PLAYER JOURNEYS play forward; FIXTURES set a state by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { COMMENCEMENT_KIND, SHIFT_KIND, evaluate } from '@/engine/systems/school';
import { courseworkOf, noteTaken, trustOf, WORK, type Assignment } from '@/engine/systems/coursework';
import { yaleUntil } from '@/engine/systems/health';
import { startRefusal } from '@/engine/systems/life';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** FIXTURE: a term the faculty find short on attendance. */
const shortTerm = (sim: Simulation) => Object.assign(sim.player.school!.tally, { classDays: 40, attended: 0, excused: 0, calls: 0, answered: 0, shifts: 0, worked: 0 });
/** FIXTURE: an open piece of work for term 0. */
const openPiece = (sim: Simulation) => {
  const cw = courseworkOf(sim, sim.player)!;
  const a = cw.assignments.find((x) => x.status === 'open') ?? cw.assignments[0]!;
  a.status = 'open';
  return a;
};

describe('dismissal', () => {
  it('ends the coursework: open work lapses, booked rehearsals are off, and nothing can be prepared or asked after', () => {
    let sim = life('gap-dismiss');
    tended(sim, at(2026, 9, 1, 12));
    const a = openPiece(sim);
    a.rehearsals.push({ id: 'r-fixture', at: sim.now + 3 * MS_DAY, status: 'booked' });
    // FIXTURE: on warning, and short again.
    sim.player.school!.standing = 'warning';
    shortTerm(sim);
    expect(evaluate(sim, sim.player, 0)!.standing).toBe('dismissed');
    sim = reload(sim);
    const cw = courseworkOf(sim, sim.player)!;
    expect(cw.assignments.some((x) => x.status === 'open' || x.status === 'revising')).toBe(false);
    expect(cw.assignments.find((x) => x.id === a.id)!.rehearsals.find((r) => r.id === 'r-fixture')!.status).toBe('cancelled');
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: sim.now + 2 * MS_DAY } }).ok).toBe(false);
  });
});

describe('the last term', () => {
  it('on academic warning, withholds the degree: no Commencement, and the notice doesn’t speak of a next term', () => {
    const sim = life('gap-withheld');
    // FIXTURE: the sixth term's evaluation, from a concern, short.
    sim.player.school!.standing = 'concern';
    sim.player.school!.termsBegun = 6;
    shortTerm(sim);
    const review = evaluate(sim, sim.player, 5)!;
    expect(review.standing).toBe('withheld');
    expect(sim.universe.scheduled.some((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending')).toBe(false);
    const note = sim.universe.notifications.find((n) => n.title === 'The Degree Isn’t Recommended')!;
    expect(note.body).not.toMatch(/next term,/);
    expect(sim.execute({ kind: 'school.take_shift', payload: {} }).ok).toBe(false);
  });

  it('with a concern alone, graduates, and says the concern doesn’t stand in the way', () => {
    const sim = life('gap-concern');
    sim.player.school!.termsBegun = 6;
    shortTerm(sim);
    expect(evaluate(sim, sim.player, 5)!.standing).toBe('concern');
    expect(sim.universe.scheduled.some((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending')).toBe(true);
    expect(sim.universe.notifications.find((n) => n.title === 'A Notice Of Academic Concern')!.body).toMatch(/doesn’t stand in the way of the degree/);
  });
});

describe('PLAYER JOURNEY: ill over a booked partner rehearsal', () => {
  it('is excused, not standing them up: trust unchanged, and they’re told', () => {
    const sim = life('gap-hospital');
    let found: { a: Assignment; k: { id: string; at: number } } | undefined;
    for (let d = 0; !found && d < 30; d += 1) {
      tended(sim, at(2026, 9, 1, 16) + d * MS_DAY);
      for (const a of courseworkOf(sim, sim.player)!.assignments) { const k = a.asks?.find((x) => x.status === 'open'); if (k) found = { a, k }; }
    }
    expect(found, 'a partner asks within the month').toBeDefined();
    const { a, k } = found!;
    sim.must({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } });
    const mate = sim.player.school!.classmates[a.partner!]!;
    const trust = trustOf(mate);
    // FIXTURE: admitted to hospital over the evening, as an illness's admission does.
    sim.player.health = { ...(sim.player.health ?? {}), inHospitalUntil: k.at + MS_DAY } as never;
    tended(sim, k.at + 3 * MS_HOUR);
    const r = courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === a.id)!.rehearsals.at(-1)!;
    expect(r.status).toBe('excused');
    expect(trustOf(mate)).toBe(trust);
  });
});

describe('the term’s coursework', () => {
  it('counts a piece not shown, unexcused, and one not shown again as unready', () => {
    const sim = life('gap-notshown');
    const cw = courseworkOf(sim, sim.player)!;
    // FIXTURE: three pieces shown strong, one of them not there to be shown again; two never shown.
    const shown = (id: string, missedAgain = false) => ({ id, term: 0, status: 'done', shown: { band: 'strong', score: 0.7, at: 0, parts: { prep: 1, craft: 1, ready: 1 }, strengths: [] }, ...(missedAgain ? { revision: { dueOn: '', before: 0, missed: true } } : {}), rehearsals: [] }) as unknown as Assignment;
    cw.assignments.push(shown('s1'), shown('s2'), shown('s3', true), { id: 'm1', term: 0, status: 'missed', rehearsals: [] } as unknown as Assignment, { id: 'm2', term: 0, status: 'missed', rehearsals: [] } as unknown as Assignment);
    const review = evaluate(sim, sim.player, 0)!;
    expect(review.coursework).toMatchObject({ shown: 5, unready: 3 });
    expect(review.standing).toBe('concern');
  });

  it('doesn’t count a note as taken where the part was already past enough when shown, with no work since', () => {
    const sim = life('gap-note');
    tended(sim, at(2026, 9, 1, 12));
    const a = openPiece(sim);
    // FIXTURE: a note on a part shown at 0.85, nothing done since.
    a.feedback = { course: 'x', teachers: 'x', text: '', focus: { kind: 'dim', dim: 'familiarity' }, kind: 'new' } as never;
    a.prep.familiarity = 0.85;
    a.revision = { dueOn: '2026-09-10', before: 0.85 };
    expect(noteTaken(sim.player, a, '2026-09-10')).toBe(false);
    a.revision = { dueOn: '2026-09-10', before: 0.5 };
    expect(noteTaken(sim.player, a, '2026-09-10')).toBe(true);
    expect(WORK.revision.dimEnough).toBeLessThanOrEqual(0.85);
  });
});

describe('time', () => {
  it('won’t start two hours of work at eight with classes at nine, and will start one that ends before them', () => {
    const sim = life('gap-read');
    tended(sim, at(2026, 9, 1, 8));
    expect(startRefusal(sim, sim.player, 120)).toMatch(/starts at 9/);
    expect(startRefusal(sim, sim.player, 45)).toBeUndefined();
  });

  it('offers no elective shift in the summer recess, when the Rep is dark', () => {
    const sim = life('gap-summer');
    tended(sim, at(2027, 6, 1, 10));
    const answer = sim.execute({ kind: 'school.take_shift', payload: {} });
    expect(answer.ok).toBe(false);
    expect(sim.universe.scheduled.some((i) => i.kind === SHIFT_KIND && i.status === 'pending' && i.payload.elective === true)).toBe(false);
  });
});

describe('Yale Health after leaving', () => {
  it('after a dismissal, thirty days (SLATE’s reading; the Bulletin names withdrawal), the degree to 1 August (the rule of 2026-10-10, after p.174 was read)', () => {
    const sim = life('gap-health');
    const school = sim.player.school!;
    school.standing = 'dismissed';
    school.endedAt = at(2026, 12, 15);
    expect(yaleUntil(sim.player)).toBe(school.endedAt + 30 * MS_DAY);
    school.standing = 'graduated';
    school.endedAt = at(2029, 5, 21);
    expect(yaleUntil(sim.player)).toBe(instantFromZoned({ year: 2029, month: 8, day: 1, hour: 0 }, zone));
  });
});
