/**
 * The student's experience, completed (from 2026-10-10): each repair held by the behavior it fixed. PLAYER JOURNEYS
 * play forward through commands; FIXTURES set a state by hand to reach one rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { courseworkOf, type Assignment } from '@/engine/systems/coursework';
import { momentsOf, sharedWork, STUDY_KIND } from '@/engine/systems/classmates';
import { CABARET_KIND, COMMENCEMENT_KIND, evaluate } from '@/engine/systems/school';
import { settleCourses } from '@/engine/systems/courserecord';
import { yaleUntil } from '@/engine/systems/health';
import { graceDays, optRefusal, usStatusEnds } from '@/engine/systems/permission';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

describe('running lines with a classmate', () => {
  it('works on the scene you share with them, the one you chose, and says what moved; never another partner’s', () => {
    let sim = student('se-lines');
    tended(sim, at(2026, 9, 2, 16));
    const cw = courseworkOf(sim, sim.player)!;
    // FIXTURE: three open scenes, two with classmate 0 and one with classmate 1, all with lines at nothing.
    const scene = (id: string, partner: number) => ({ ...cw.assignments.find((a) => a.sceneId)!, id, partner, status: 'open', rehearsals: [], asks: [], prep: { ...cw.assignments.find((a) => a.sceneId)!.prep, memorization: 0 } }) as Assignment;
    cw.assignments.push(scene('mine-a', 0), scene('mine-b', 0), scene('theirs', 1));
    expect(sharedWork(sim, sim.player, 0).map((a) => a.id)).toEqual(expect.arrayContaining(['mine-a', 'mine-b']));
    expect(sharedWork(sim, sim.player, 0).map((a) => a.id)).not.toContain('theirs');
    // FIXTURE: classmate 0 asks to run lines tomorrow evening.
    const when = at(2026, 9, 3, 19);
    momentsOf(cw).push({ id: 'm-study', mate: 0, kind: 'study', at: sim.now, until: sim.now + MS_DAY, status: 'open', when, text: 'Run lines?' } as never);
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: 'm-study', choice: 'yes', assignmentId: 'theirs' } }).ok).toBe(false);
    sim.must({ kind: 'school.respond', payload: { momentId: 'm-study', choice: 'yes', assignmentId: 'mine-b' } });
    expect(sim.universe.scheduled.find((i) => i.kind === STUDY_KIND && i.status === 'pending')?.payload.assignmentId).toBe('mine-b');
    sim = reload(sim);
    tended(sim, when + 2 * MS_HOUR);
    const by = (id: string) => courseworkOf(sim, sim.player)!.assignments.find((a) => a.id === id)!.prep.memorization;
    expect(by('mine-b')).toBeGreaterThan(0);
    expect(by('mine-a')).toBe(0);
    expect(by('theirs')).toBe(0);
    expect(sim.universe.notifications.find((n) => n.title.startsWith('Ran Lines With'))?.body).toMatch(/Your lines for .+ went from 0% to \d+%/);
  });

  it('with no scene shared, runs their lines: it helps them, moves nothing of yours, and says so', () => {
    const sim = student('se-lines-none');
    tended(sim, at(2026, 9, 2, 16));
    const cw = courseworkOf(sim, sim.player)!;
    for (const a of cw.assignments) if (a.partner === 2) a.partner = 3;
    const before = cw.assignments.map((a) => a.prep.memorization);
    const when = at(2026, 9, 3, 19);
    momentsOf(cw).push({ id: 'm-none', mate: 2, kind: 'study', at: sim.now, until: sim.now + MS_DAY, status: 'open', when, text: 'Run lines?' } as never);
    expect(sim.must<{ done: string }>({ kind: 'school.respond', payload: { momentId: 'm-none', choice: 'yes' } }).done).toMatch(/don’t have a scene together right now/);
    tended(sim, when + 2 * MS_HOUR);
    const after = courseworkOf(sim, sim.player)!.assignments.slice(0, before.length).map((a) => a.prep.memorization);
    expect(after).toEqual(before);
    expect(sim.universe.notifications.find((n) => n.title.startsWith('Ran Lines With'))?.body).toMatch(/but not your own preparation/);
  });
});

describe('the Cabaret on academic warning', () => {
  it('takes them out of a show still to come, calls off what’s left, and holds none of it against them', () => {
    const sim = student('se-cabaret');
    tended(sim, at(2026, 9, 7, 12));
    const joined = sim.execute<{ week: string }>({ kind: 'school.cabaret', payload: {} });
    expect(joined.ok, joined.error).toBe(true);
    const calls = () => sim.universe.scheduled.filter((i) => i.kind === CABARET_KIND && i.status === 'pending').length;
    expect(calls()).toBeGreaterThan(0);
    const breaches = sim.player.school!.tally.breaches;
    // FIXTURE: a concern already, and a term short on attendance, which the evaluation turns into a warning.
    sim.player.school!.standing = 'concern';
    Object.assign(sim.player.school!.tally, { classDays: 40, attended: 0, excused: 0 });
    expect(evaluate(sim, sim.player, 0)!.standing).toBe('warning');
    expect(calls()).toBe(0);
    expect(sim.player.school!.cabaret!.withdrawn?.why).toBe('academic warning');
    expect(sim.player.school!.tally.breaches).toBe(breaches);
    expect(sim.universe.notifications.filter((n) => n.title === 'Out Of The Cabaret Show')).toHaveLength(1);
    expect(sim.execute({ kind: 'school.cabaret', payload: {} }).error).toMatch(/academic warning/);
  });
});

describe('leaving the School: withdrawal, dismissal, a degree withheld and the degree are different events', () => {
  const international = (seed: string) => student(seed, { homeRegionId: 'uk-eng-london' });
  it('PLAYER JOURNEY: a withdrawal by the fifteenth day of classes cancels Yale Health back to the term, refunds its premium, and leaves fifteen days’ grace and no OPT', () => {
    let sim = international('se-withdraw-early');
    tended(sim, at(2026, 9, 8, 12));
    const premium = sim.universe.transactions.filter((t) => t.memo.startsWith('Yale Health plan')).length;
    expect(sim.execute({ kind: 'school.withdraw', payload: {} }).error).toMatch(/Confirm/);
    const answer = sim.must<{ early: boolean; refund: number }>({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(answer.early).toBe(true);
    expect(answer.refund > 0).toBe(premium > 0);
    sim = reload(sim);
    const school = sim.player.school!;
    expect(school.standing).toBe('withdrawn');
    expect(yaleUntil(sim.player)).toBe(school.endedAt);
    expect(graceDays(sim.player)).toBe(15);
    expect(usStatusEnds(sim.player)).toBe(school.endedAt! + 15 * MS_DAY);
    expect(optRefusal(sim, sim.player)).toMatch(/completed degree/);
    // Nothing of the student's own is left on the calendar but a classmate’s moment brought in that day’s class, which
    // lapses at its hour as one does at the School. Until 2026-10-13 this held nothing at all: the moment was called off
    // with the rest and stayed open for good (tests/evidence2-b07.test.ts, school.respond). The class they left keeps
    // its term's end, to be followed on without them (`leaveClassBehind`, from 2026-10-11).
    const own = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind.startsWith('school.') && i.payload.personId === sim.player.id && i.kind !== 'school.payday' && i.kind !== 'school.former_class' && i.payload.classOf === undefined);
    expect(own.map((i) => i.kind)).toEqual(['school.moment']);
    const moment = momentsOf(courseworkOf(sim, sim.player)!).find((m) => m.id === own[0]!.payload.momentId)!;
    expect(moment).toMatchObject({ status: 'open', until: own[0]!.at });
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === 'school.former_class' && i.payload.personId === sim.player.id)).toBe(true);
    expect(courseworkOf(sim, sim.player)!.assignments.some((a) => a.status === 'open')).toBe(false);
    expect(sim.execute({ kind: 'school.withdraw', payload: { confirm: true } }).ok).toBe(false);
    tended(sim, own[0]!.at + MS_HOUR);
    expect(momentsOf(courseworkOf(sim, sim.player)!).find((m) => m.id === moment.id)!.status).toBe('lapsed');
  });

  it('a withdrawal later in the term keeps Yale Health thirty days, with nothing refunded', () => {
    const sim = international('se-withdraw-late');
    tended(sim, at(2026, 10, 14, 12));
    expect(sim.must<{ early: boolean; refund: number }>({ kind: 'school.withdraw', payload: { confirm: true } })).toEqual({ early: false, refund: 0 });
    expect(yaleUntil(sim.player)).toBe(sim.player.school!.endedAt! + 30 * MS_DAY);
  });

  it('a dismissal leaves no grace; a degree withheld fifteen days and no OPT, Yale Health to 31 July; the degree sixty days and OPT', () => {
    const sim = international('se-exits');
    const school = sim.player.school!;
    // FIXTURE: each ending set by hand, read by the rules that follow from it.
    Object.assign(school, { standing: 'dismissed', endedAt: at(2027, 2, 10) });
    expect(graceDays(sim.player)).toBe(0);
    expect(usStatusEnds(sim.player)).toBe(school.endedAt);
    expect(yaleUntil(sim.player)).toBe(school.endedAt! + 30 * MS_DAY);
    Object.assign(school, { standing: 'withheld', endedAt: at(2029, 4, 30) });
    expect(graceDays(sim.player)).toBe(15);
    expect(optRefusal(sim, sim.player)).toMatch(/completed degree/);
    expect(yaleUntil(sim.player)).toBe(instantFromZoned({ year: 2029, month: 8, day: 1, hour: 0 }, zone));
    Object.assign(school, { standing: 'graduated', endedAt: at(2029, 5, 21) });
    expect(graceDays(sim.player)).toBe(60);
    expect(optRefusal(sim, sim.player) ?? '').not.toMatch(/completed degree/);
  });
});

describe('each course passed, incomplete or failed, and what the degree needs', () => {
  it('PLAYER JOURNEY: ill for five weeks of classes in the first fall, an Incomplete in a course, made up in its sessions, and passed', () => {
    let sim = student('se-incomplete');
    tended(sim, at(2026, 10, 1, 8));
    // FIXTURE: admitted to hospital for five weeks of classes, as a serious illness's admission would.
    sim.player.health = { ...(sim.player.health ?? {}), inHospitalUntil: at(2026, 11, 10, 8) } as never;
    tended(sim, at(2026, 12, 12, 12));
    const records = Object.entries(sim.player.school!.courses ?? {}).filter(([, r]) => r.term === 0);
    expect(records.length).toBeGreaterThan(3);
    expect(records.every(([, r]) => r.result !== undefined)).toBe(true);
    expect(records.some(([, r]) => r.result === 'fail')).toBe(false);
    const incomplete = records.filter(([, r]) => r.result === 'incomplete');
    expect(incomplete.length).toBeGreaterThan(0);
    const [key, r] = incomplete[0]!;
    expect(sim.universe.notifications.some((n) => n.title === `Incomplete: ${r.name}`)).toBe(true);
    sim = reload(sim);
    for (let i = 0; i < (r.owed ?? 0); i += 1) {
      const made = sim.must<{ passed: boolean }>({ kind: 'school.make_up', payload: { key } });
      expect(made.passed).toBe(i === (r.owed ?? 0) - 1);
      sim.advanceTo(sim.now + 3 * MS_HOUR);
    }
    expect(sim.player.school!.courses![key]!.result).toBe('pass');
    expect(sim.execute({ kind: 'school.make_up', payload: { key } }).ok).toBe(false);
  });

  it('a course missed without excuse isn’t passed, the evaluation falls short, and the last term withholds the degree for it', () => {
    const sim = student('se-fail');
    const school = sim.player.school!;
    // FIXTURE: a first-term course attended at half its meetings, none excused.
    school.courses = { '0:DRAM 103a': { term: 0, code: 'DRAM 103a', name: 'Acting I', meetings: 20, attended: 10, excused: 0 } };
    settleCourses(sim, sim.player, 0, () => ({ due: 0, notShown: 0 }));
    expect(school.courses['0:DRAM 103a']!.result).toBe('fail');
    expect(evaluate(sim, sim.player, 0)!.reason).toMatch(/You didn’t pass Acting I/);
    // FIXTURE: the last term's evaluation in good standing otherwise.
    Object.assign(school, { standing: 'good', termsBegun: 6 });
    Object.assign(school.tally, { classDays: 40, attended: 40, excused: 0 });
    // From 2026-10-10 a first-year course never retaken is offered an additional term of its season before the degree
    // is withheld; until then it was withheld at once.
    expect(evaluate(sim, sim.player, 5)!.standing).not.toBe('withheld');
    expect(sim.universe.notifications.find((n) => n.title === 'Your Degree Isn’t Complete')!.body).toMatch(/You haven’t passed Acting I.*additional term/);
  });

  it('an Incomplete at Commencement keeps them from it, and the degree comes when it’s made up, or is withheld when its month runs out', () => {
    for (const makeUp of [true, false]) {
      const sim = student(`se-late-${makeUp}`);
      tended(sim, at(2026, 9, 1, 18));
      const school = sim.player.school!;
      // FIXTURE: the last term's evaluation passed with one Incomplete open, then to Commencement.
      Object.assign(school, { standing: 'good', termsBegun: 6 });
      school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 12, excused: 8 } };
      settleCourses(sim, sim.player, 5, () => ({ due: 0, notShown: 0 }));
      expect(school.courses['5:DRAM 393b']!.result).toBe('incomplete');
      Object.assign(school.tally, { classDays: 40, attended: 40, excused: 0 });
      evaluate(sim, sim.player, 5);
      // FIXTURE: Commencement brought to tomorrow, so the month after it is played rather than three years.
      const booked = sim.universe.scheduled.find((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending')!;
      sim.timeline.cancel(booked.id, sim.now);
      const commencement = sim.schedule({ at: sim.now + MS_DAY, kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 30, payload: booked.payload });
      tended(sim, Math.min(commencement.at + MS_HOUR, school.courses['5:DRAM 393b']!.dueBy! - MS_DAY));
      expect(sim.now).toBeGreaterThan(commencement.at);
      expect(school.standing).toBe('good');
      expect(school.awaitingDegree).toBe(true);
      if (makeUp) {
        // Each session in an evening, clear of the day's classes.
        for (let i = 0; i < (school.courses['5:DRAM 393b']!.owed ?? 0); i += 1) { tended(sim, sim.now + MS_DAY); sim.must({ kind: 'school.make_up', payload: { key: '5:DRAM 393b' } }); }
        expect(school.standing).toBe('graduated');
      } else {
        tended(sim, school.courses['5:DRAM 393b']!.dueBy! + MS_HOUR);
        expect(school.courses['5:DRAM 393b']!.result).toBe('permanent');
        expect(school.standing).toBe('withheld');
      }
    }
  });
});

describe('an Incomplete’s month', () => {
  it('is extended once by a month, and not again', () => {
    const sim = student('se-extend');
    const school = sim.player.school!;
    // FIXTURE: a course left incomplete by illness at the first term's evaluation.
    school.courses = { '0:DRAM 103a/b': { term: 0, code: 'DRAM 103a/b', name: 'Acting I', meetings: 40, attended: 20, excused: 20 } };
    settleCourses(sim, sim.player, 0, () => ({ due: 0, notShown: 0 }), () => 3);
    const r = school.courses['0:DRAM 103a/b']!;
    expect(r.result).toBe('incomplete');
    // Ten meetings short of three quarters, three a week: four sessions.
    expect(r.owed).toBe(4);
    const due = r.dueBy!;
    expect(sim.must<{ dueBy: number }>({ kind: 'school.extend_incomplete', payload: { key: '0:DRAM 103a/b' } }).dueBy).toBe(due + 30 * MS_DAY);
    expect(sim.execute({ kind: 'school.extend_incomplete', payload: { key: '0:DRAM 103a/b' } }).error).toMatch(/your one extra month/);
    sim.advanceTo(due + MS_DAY);
    expect(r.result).toBe('incomplete');
  });
});
