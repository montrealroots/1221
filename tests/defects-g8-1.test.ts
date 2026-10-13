/**
 * Five school defects found by the triage of 2026-10-12, each held here against the engine (from 2026-10-12):
 * the hold's and the held diploma's notices named the Standing tab, where Your Yale Account isn't; a day called in
 * sick excused neither a Cabaret nor a Summer Cabaret call; a grave breach counted twice, once on the day and again at
 * its term's evaluation; not coming to Yale Health's assessment changed only the sentence; and an elective shift was
 * booked, worked and paid on a leave. PLAYER JOURNEYS play through commands; FIXTURES set a state by hand to reach one
 * rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CABARET_KIND, CALL_KIND, COMMENCEMENT_KIND, SHIFT_KIND, SUMMER_KIND, evaluate, shiftRefusal, sickRefusal } from '@/engine/systems/school';
import { accountDue, billUnsupportedTerm, considerWelfare } from '@/engine/systems/leave';
import { healthOf } from '@/engine/systems/health';
import { SECTIONS } from '@/ui/shell/sections';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** Played by somebody who looks after themselves, awake through the evening, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number, step = 6 * MS_HOUR) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + step)); } };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);
const weekdayOf = (when: number) => { const p = zonedParts(when, zone); return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay(); };
const dayOf = (when: number) => { const p = zonedParts(when, zone); return `${p.year}-${p.month}-${p.day}`; };

describe('the hold’s notices name the tab Your Yale Account is on', () => {
  it('says to pay on Terms And Award, for the hold and for the diploma it keeps', () => {
    const terms = SECTIONS['/workspace/school']!.find((s) => s.id === 'terms')!.label;
    const sim = student('g8-hold', { wealth: 'comfortable' });
    tended(sim, at(2026, 9, 2));
    const school = sim.player.school!;
    // FIXTURE: the eighth calendar term, the program's sixth after a repeated year, its tuition billed and unpaid, as
    // tests/leave.test.ts's late graduation sets it.
    Object.assign(school, { termsBegun: 8, enrolled: [0, 1, 2, 3, 4, 5, 6, 7], offset: 2, repeats: 1, standing: 'good', classOf: 2030 });
    billUnsupportedTerm(sim, sim.player, 7);
    accountDue(sim, sim.player, 7);
    const hold = titled(sim, 'A Financial Hold')[0]!.body;
    expect(hold).toMatch(new RegExp(`Pay it on the ${terms} tab\\.$`));
    expect(hold).not.toMatch(/Standing tab/);
    school.courses = { '7:DRAM 393b': { term: 7, academic: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } };
    Object.assign(school.tally, { classDays: 40, attended: 40, excused: 0 });
    expect(evaluate(sim, sim.player, 7)!.standing).toBe('good');
    // FIXTURE: Commencement brought to tomorrow, so the years between aren't played.
    const booked = pendingOf(sim, COMMENCEMENT_KIND)[0]!;
    sim.timeline.cancel(booked.id, sim.now);
    sim.schedule({ at: sim.now + MS_DAY, kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 30, payload: booked.payload });
    tended(sim, sim.now + 2 * MS_DAY);
    const held = titled(sim, 'The Diploma Is Held')[0]!.body;
    expect(held).toMatch(new RegExp(`Pay it on the ${terms} tab\\.$`));
    expect(held).not.toMatch(/Standing tab/);
  });
});

describe('PLAYER JOURNEY: Call In Sick on a Cabaret day', () => {
  it('excuses the Saturday’s two shows: neither is played or held against the record, and the closing still credits the run', () => {
    const sim = student('g8-cab');
    tended(sim, at(2026, 9, 20));
    sim.must({ kind: 'school.cabaret', payload: {} });
    const shows = pendingOf(sim, CABARET_KIND).filter((i) => i.payload.call === 'performance').sort((a, b) => a.at - b.at);
    const saturday = shows.filter((i) => weekdayOf(i.at) === 6);
    expect(saturday).toHaveLength(2);
    const p = zonedParts(saturday[0]!.at, zone);
    tended(sim, at(p.year, p.month, p.day, 8));
    // FIXTURE: the flu that morning, as `careFor` gives one.
    healthOf(sim.player).fluUntil = sim.now + 3 * MS_DAY;
    expect(sickRefusal(sim, sim.player)).toBeUndefined();
    expect(sim.must<{ excused: boolean }>({ kind: 'school.call_in_sick', payload: {} }).excused).toBe(true);
    const cab = sim.player.school!.cabaret!;
    const played = cab.performed;
    expect(played).toBeGreaterThan(0);
    tended(sim, saturday[1]!.at + 3 * MS_HOUR, MS_HOUR);
    for (const show of saturday) expect(show.status, `${dayOf(show.at)} ${zonedParts(show.at, zone).hour}:00`).toBe('missed');
    expect(cab.performed).toBe(played);
    // Excused, so not a night delivered at nothing in the record the next casting reads.
    expect((sim.player.school!.runs ?? []).filter((r) => r.source === 'cabaret').reduce((n, r) => n + r.missed, 0)).toBe(0);
    // The closing excused after nights played: on the résumé all the same.
    expect(sim.player.school!.credits).toEqual([expect.objectContaining({ kind: 'cabaret', wentOn: played })]);
    expect(sim.player.school!.standing).toBe('good');
  }, 120_000);
});

describe('PLAYER JOURNEY: Call In Sick on a Summer Cabaret night', () => {
  it('excuses the performance: not played, and the company keeps the student', () => {
    const sim = student('g8-summer');
    sim.advanceTo(at(2027, 3, 20, 12));
    // TEST SETUP: in good standing, which the company asks of a student; this is a test of the night, not the year.
    sim.player.school!.standing = 'good';
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const show = pendingOf(sim, SUMMER_KIND).filter((i) => i.payload.call === 'performance').sort((a, b) => a.at - b.at)[0]!;
    const run = Number(show.payload.run);
    const p = zonedParts(show.at, zone);
    sim.advanceTo(at(p.year, p.month, p.day, 8));
    // FIXTURE: the flu that morning, as `careFor` gives one.
    healthOf(sim.player).fluUntil = sim.now + 3 * MS_DAY;
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(sickRefusal(sim, sim.player)).toBeUndefined();
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    const summer = sim.player.school!.summer!;
    const played = summer.played[run] ?? 0;
    tended(sim, show.at + 4 * MS_HOUR, MS_HOUR);
    expect(show.status).toBe('missed');
    expect(summer.played[run] ?? 0).toBe(played);
    expect(summer.out).toBeFalsy();
    expect(pendingOf(sim, SUMMER_KIND).length).toBeGreaterThan(0);
    expect(titled(sim, 'Out Of The Summer Cabaret')).toHaveLength(0);
    expect((sim.player.school!.runs ?? []).filter((r) => r.source === 'summer').reduce((n, r) => n + r.missed, 0)).toBe(0);
  }, 180_000);
});

describe('a grave breach before its term’s evaluation', () => {
  /**
   * A first-year understudying at Yale Rep, sent on and away that night: a missed performance, a grave breach.
   * FIXTURE: the night is put on the calendar as the five o'clock check puts one when the role's actor is out
   * (`goesOn`), rather than searching seeds for one.
   */
  const breached = (seed: string) => {
    const sim = student(seed);
    sim.player.school!.classmates[0]!.craft.scene = 99;
    sim.advanceTo(at(2027, 1, 2, 9));
    const school = sim.player.school!;
    // TEST SETUP: in good standing into the spring, which the Rep's casting and the rule are both about; the fall,
    // passed over in one step, is no part of it.
    Object.assign(school, { standing: 'good', castable: true });
    sim.advanceTo(at(2027, 1, 20, 9));
    expect(school.rep).toBeDefined();
    expect(school.standing).toBe('good');
    const curtain = at(2027, 2, 5, 19);
    sim.schedule({ at: curtain, durationMinutes: 180, kind: CALL_KIND, label: 'You’re On', category: 'school', priority: 32, requiresPlayer: true, payload: { personId: sim.player.id, call: 'performance', which: 'rep', wentOn: true } });
    sim.advanceTo(curtain - MS_HOUR);
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(curtain + MS_HOUR);
    expect(school.tally.breaches).toBe(1);
    expect(school.standing).toBe('warning');
    // FIXTURE: the rest of the term met, so the breach is all that falls short: every class and call kept, grown in
    // line with the class, and no coursework counted.
    const t = school.tally;
    Object.assign(t, { classDays: 40, attended: 40, excused: 0, answered: t.calls - 1, craftAtStart: { ...sim.player.craft! }, classAtStart: school.classmates.map((m) => Object.values(m.craft).reduce((a, b) => a + b, 0) / Object.values(m.craft).length) });
    const cw = (school as { coursework?: { assignments: { term: number }[] } }).coursework;
    if (cw) cw.assignments = cw.assignments.filter((a) => a.term !== 1);
    return sim;
  };

  it('in good standing, ends that term’s evaluation on the warning it brought, not in dismissal', () => {
    const sim = breached('g8-breach');
    expect(evaluate(sim, sim.player, 1)!.standing).toBe('warning');
    expect(sim.player.school!.standing).toBe('warning');
    // And the evaluation says why the term fell short, which nothing else in it does.
    expect(sim.player.school!.history.at(-1)!.reason).toMatch(/grave breach/);
  }, 60_000);

  it('with another shortfall as well, ends in dismissal', () => {
    const sim = breached('g8-breach');
    Object.assign(sim.player.school!.tally, { classDays: 40, attended: 20, excused: 0 });
    expect(evaluate(sim, sim.player, 1)!.standing).toBe('dismissed');
  }, 60_000);
});

describe('Yale Health’s assessment, not come to', () => {
  /** FIXTURE: two stays in hospital in the last four weeks, as the care log keeps them, and well again since. */
  const recovered = (seed: string) => {
    const sim = student(seed);
    tended(sim, at(2026, 9, 14));
    const h = healthOf(sim.player);
    h.careLog = [{ at: sim.now - 10 * MS_DAY, care: 'stay', what: 'A stay', share: 0 }, { at: sim.now - 2 * MS_DAY, care: 'stay', what: 'A stay', share: 0 }] as never;
    h.inHospitalUntil = sim.now - MS_HOUR;
    considerWelfare(sim, sim.player);
    return { sim, w: sim.player.school!.welfare! };
  };

  it('is a ground of its own: a well student out of town that day is recommended a leave, the dean imposes it, and an appeal once cleared overturns it', () => {
    const { sim, w } = recovered('g8-welfare');
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, w.assessAt + MS_HOUR);
    expect(w.attended).toBe(false);
    expect(w.outcome).toBe('leave');
    expect(titled(sim, 'Yale Health Recommends A Medical Leave')[0]!.body).toMatch(/didn’t come to the assessment/);
    tended(sim, w.decideAt! + MS_HOUR);
    const leave = sim.player.school!.leave!;
    expect(leave.mandatory?.why).toMatch(/didn’t come to the assessment/);
    expect(leave.status).toBe('on');
    expect(titled(sim, 'The Dean Decides Against A Leave')).toHaveLength(0);
    // Back, well and cleared, with most of the term ahead: the appeal overturns it.
    sim.player.currentLocationId = 'us-ct-newhaven';
    const appeal = sim.must<{ decideAt: number }>({ kind: 'school.appeal_leave', payload: {} });
    tended(sim, appeal.decideAt + MS_HOUR);
    expect(sim.player.school!.leave).toBeUndefined();
    expect(sim.player.school!.leaves!.at(-1)!.status).toBe('rescinded');
  }, 60_000);

  it('come to, finds the same well student fit, and nothing changes', () => {
    const { sim, w } = recovered('g8-welfare');
    tended(sim, w.assessAt + MS_HOUR);
    expect(w.attended).toBe(true);
    expect(w.outcome).toBe('fit');
    expect(sim.player.school!.leave).toBeUndefined();
    expect(titled(sim, 'Yale Health Recommends A Medical Leave')).toHaveLength(0);
  }, 60_000);
});

describe('PLAYER JOURNEY: Take An Elective Shift on a leave', () => {
  it('is refused, with its reason, and nothing is booked or paid', () => {
    const sim = student('g8-leave');
    tended(sim, at(2026, 10, 5));
    // FIXTURE: the flu, as `careFor` gives one.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tended(sim, asked.decideAt + MS_HOUR);
    const school = sim.player.school!;
    expect(school.leave?.status).toBe('on');
    expect(shiftRefusal(sim.player)).toBe('You’re on leave: no shifts until you’re back.');
    const owed = school.workStudy.owedHours;
    expect(sim.execute({ kind: 'school.take_shift', payload: {} }).error).toBe('You’re on leave: no shifts until you’re back.');
    expect(pendingOf(sim, SHIFT_KIND)).toHaveLength(0);
    tended(sim, sim.now + 3 * MS_DAY);
    expect(school.workStudy.owedHours).toBe(owed);
  }, 60_000);
});
