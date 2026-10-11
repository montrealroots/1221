/**
 * The school's remaining paths (from 2026-10-10, `systems/leave.ts`): a leave's length worked out from the course
 * sequence; a return to the class a year below, the first class gone on without the student; a mandatory medical leave
 * by Yale Health's assessment and the dean's decision, and an appeal; an additional term to retake what's unpassed,
 * finished in December; and the aid office's review of a term past six. PLAYER JOURNEYS play through commands;
 * FIXTURES set a state by hand to reach a rare event, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CLASSES_KIND, CONFERRAL_KIND, TERM_KIND, coursesFor, evaluate, meanCraft, termStart } from '@/engine/systems/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { healthOf } from '@/engine/systems/health';
import { formerStage, accountOwed, considerWelfare, enrolledTerms, extraRefusal, leaveLengths, WELFARE_KIND, APPEAL_KIND } from '@/engine/systems/leave';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });

describe('a leave’s length', () => {
  it('is worked out from the course sequence: a year fits, one term or three would return to second halves never begun', () => {
    const sim = student('sp-lengths');
    tended(sim, at(2026, 12, 18));
    const lengths = leaveLengths(sim, sim.player.school!, 'personal');
    expect(lengths.find((x) => x.terms === 2)!.why).toBeUndefined();
    expect(lengths.find((x) => x.terms === 1)!.why).toMatch(/second halves of year-long courses/);
    expect(lengths.find((x) => x.terms === 3)!.why).toMatch(/second halves/);
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family', terms: 1 } }).error).toMatch(/second halves/);
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family', terms: 2 } }).ok).toBe(true);
  });
});

describe('PLAYER JOURNEY: back from a leave, with the class a year below', () => {
  it('keeps the first class whole and played forward, draws the new one at the same stage, and keeps old work’s partners', () => {
    let sim = student('sp-cohort');
    tended(sim, at(2026, 10, 5));
    const first = sim.player.school!.classmates;
    const names = first.map((m) => m.name);
    const craftThen = meanCraft(first[0]!.craft);
    // FIXTURE: a classmate trusted, a relationship kept.
    first[0]!.trust = 77;
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tended(sim, asked.decideAt + MS_HOUR);
    tended(sim, at(2027, 5, 1));
    sim.must({ kind: 'school.return_notice', payload: {} });
    sim = reload(sim);
    tended(sim, at(2027, 8, 24, 12));
    const school = sim.player.school!;
    expect(school.classOf).toBe(2030);
    expect(school.classmates.map((m) => m.name).some((n) => names.includes(n))).toBe(false);
    const former = school.formerClasses![0]!;
    expect(former.classOf).toBe(2029);
    expect(former.classmates[0]!.trust).toBe(77);
    // The first class went on: the spring they had without the student.
    expect(meanCraft(former.classmates[0]!.craft)).toBeGreaterThan(craftThen);
    // Past coursework keeps its partner by name.
    const past = courseworkOf(sim, sim.player)!.assignments.filter((a) => a.partner !== undefined && a.setOn < '2027-01-01');
    expect(past.every((a) => a.partnerName && names.includes(a.partnerName))).toBe(true);
    expect(titled(sim, 'The Class Of 2030')).toHaveLength(1);
    // And goes on after: a term later it's had another term, its second year's spring (found by tools/scenarios.ts,
    // 2026-10-10: until then it stopped where the student rejoined).
    const atJoin = meanCraft(former.classmates[1]!.craft);
    expect(formerStage(former, 2)).toBe(2);
    tended(sim, at(2028, 1, 20, 12));
    const later = sim.player.school!.formerClasses![0]!;
    expect(later.playedTo).toBe(2);
    expect(formerStage(later, 3)).toBe(3);
    expect(meanCraft(later.classmates[1]!.craft)).toBeGreaterThan(atJoin);
  }, 60_000);
});

describe('a mandatory medical leave', () => {
  /** FIXTURE: two stays in hospital in the last four weeks, as the care log keeps them, and the student still in one. */
  const crisis = (sim: Simulation, days: number) => {
    const h = healthOf(sim.player);
    h.careLog = [{ at: sim.now - 10 * MS_DAY, care: 'stay', what: 'A stay' }, { at: sim.now - 2 * MS_DAY, care: 'stay', what: 'A stay' }].map((x) => ({ ...x, share: 0 })) as never;
    h.inHospitalUntil = sim.now + days * MS_DAY;
  };

  it('PLAYER JOURNEY: assessed on function, recommended, imposed by the dean, appealed and overturned once cleared early in the term', () => {
    let sim = student('sp-mandatory');
    tended(sim, at(2026, 9, 14));
    crisis(sim, 40);
    considerWelfare(sim, sim.player);
    const w = sim.player.school!.welfare!;
    expect(w.trigger).toMatch(/2 stays in hospital/);
    expect(titled(sim, 'Yale Health Asks To See You')[0]!.body).toMatch(/not of any diagnosis/);
    sim = reload(sim);
    sim.advanceTo(w.assessAt + MS_HOUR);
    expect(titled(sim, 'Yale Health Recommends A Medical Leave')).toHaveLength(1);
    sim.advanceTo(sim.now + 3 * MS_DAY);
    const leave = sim.player.school!.leave!;
    expect(leave.mandatory).toBeDefined();
    expect(leave.status).toBe('on');
    expect(pendingOf(sim, CLASSES_KIND)).toHaveLength(0);
    // FIXTURE: out of hospital and well within the week.
    healthOf(sim.player).inHospitalUntil = sim.now - MS_HOUR;
    sim.player.wellbeing.condition = 90;
    const appeal = sim.must<{ decideAt: number }>({ kind: 'school.appeal_leave', payload: {} });
    expect(sim.execute({ kind: 'school.appeal_leave', payload: {} }).error).toMatch(/You appealed/);
    tended(sim, appeal.decideAt + MS_HOUR);
    const school = sim.player.school!;
    expect(school.leave).toBeUndefined();
    expect(school.leaves!.at(-1)!.status).toBe('rescinded');
    expect(school.offset ?? 0).toBe(0);
    expect(Object.values(school.courses ?? {}).some((r) => r.term === 0 && r.result === 'withdrawn')).toBe(false);
    expect(enrolledTerms(school)).toContain(0);
    tended(sim, sim.now + 3 * MS_DAY);
    expect(sim.universe.scheduled.some((i) => i.kind === CLASSES_KIND && i.payload.personId === sim.player.id && (i.status === 'pending' || i.status === 'done'))).toBe(true);
    expect(titled(sim, 'Your Leave Is Overturned')).toHaveLength(1);
  });

  it('an assessment that finds the student back within two weeks leaves them at school, with the modifications they have', () => {
    const sim = student('sp-modifications');
    tended(sim, at(2026, 9, 14));
    crisis(sim, 5);
    considerWelfare(sim, sim.player);
    sim.advanceTo(sim.player.school!.welfare!.assessAt + MS_HOUR);
    expect(sim.player.school!.welfare).toBeUndefined();
    expect(sim.player.school!.welfares!.at(-1)!.outcome).toBe('modifications');
    expect(sim.player.school!.leave).toBeUndefined();
    expect(pendingOf(sim, WELFARE_KIND)).toHaveLength(0);
  });

  it('one stay in hospital, or a few days missed early in a term, asks nothing: the rule reads function over weeks', () => {
    // Found by mutation (2026-10-10): with one stay enough, nothing failed.
    const sim = student('sp-one-stay');
    tended(sim, at(2026, 9, 14));
    healthOf(sim.player).careLog = [{ at: sim.now - 3 * MS_DAY, care: 'stay', what: 'A stay', share: 0 }] as never;
    considerWelfare(sim, sim.player);
    expect(sim.player.school!.welfare).toBeUndefined();
    // FIXTURE: eleven class days, every one missed ill, short of the twelve the share is read over.
    Object.assign(sim.player.school!.tally, { classDays: 11, excused: 11 });
    considerWelfare(sim, sim.player);
    expect(sim.player.school!.welfare).toBeUndefined();
    Object.assign(sim.player.school!.tally, { classDays: 12, excused: 8 });
    considerWelfare(sim, sim.player);
    expect(sim.player.school!.welfare?.trigger).toMatch(/8 of the term’s 12 class days/);
  });

  it('an appeal from a student cleared with less than half the term left leaves the leave standing', () => {
    // Found by mutation (2026-10-10): with the half-term rule gone, nothing failed.
    const sim = student('sp-late-appeal');
    tended(sim, at(2026, 11, 9));
    crisis(sim, 40);
    considerWelfare(sim, sim.player);
    sim.advanceTo(sim.player.school!.welfare!.assessAt + 3 * MS_DAY);
    expect(sim.player.school!.leave?.mandatory).toBeDefined();
    healthOf(sim.player).inHospitalUntil = sim.now - MS_HOUR;
    sim.player.wellbeing.condition = 90;
    const d = sim.must<{ decideAt: number }>({ kind: 'school.appeal_leave', payload: {} });
    tended(sim, d.decideAt + MS_HOUR);
    const appeal = sim.player.school!.leave!.mandatory!.appeal!;
    expect(appeal.outcome).toBe('upheld');
    expect(JSON.stringify(appeal)).toMatch(/Too much of the term/);
  });

  it('an appeal turned down leaves the leave standing; too late, it’s refused', () => {
    const sim = student('sp-upheld');
    tended(sim, at(2026, 9, 14));
    crisis(sim, 40);
    considerWelfare(sim, sim.player);
    sim.advanceTo(sim.player.school!.welfare!.assessAt + 3 * MS_DAY);
    const d = sim.must<{ decideAt: number }>({ kind: 'school.appeal_leave', payload: {} });
    sim.advanceTo(d.decideAt + MS_HOUR);
    expect(sim.player.school!.leave!.mandatory!.appeal!.outcome).toBe('upheld');
    expect(pendingOf(sim, APPEAL_KIND)).toHaveLength(0);
    expect(sim.player.school!.leave!.status).toBe('on');
  });
});

describe('PLAYER JOURNEY: an additional term, and December’s conferral', () => {
  it('retakes a first-year fall course in a fall after the third year, billed past six, reviewed by the aid office, and confers in December', () => {
    let sim = student('sp-extra', { wealth: 'comfortable' });
    tended(sim, at(2026, 9, 2));
    const school = sim.player.school!;
    // FIXTURE: the sixth term's evaluation, every course passed but the first fall's Play.
    Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
    school.courses = { '0:DRAM 153a': { term: 0, academic: 0, code: 'DRAM 153a', name: 'Play', meetings: 13, attended: 3, excused: 0, result: 'fail', why: 'TEST SETUP' } };
    Object.assign(school.tally, { classDays: 40, attended: 40, excused: 0 });
    evaluate(sim, sim.player, 5);
    expect(school.repeatBy).toBeDefined();
    const plan = extraRefusal(sim, sim.player);
    expect(plan.why).toBeUndefined();
    expect(termStart(plan.term!).fall).toBe(true);
    const asked = sim.must<{ decideAt: number; term: number }>({ kind: 'school.request_extra_term', payload: {} });
    sim = reload(sim);
    tended(sim, asked.decideAt + MS_HOUR);
    const s = sim.player.school!;
    expect(s.extra).toMatchObject({ term: asked.term, courses: [{ code: 'DRAM 153a', academic: 0 }] });
    // In that term, only Play meets.
    const plus = (d: { year: number; month: number; day: number }, n: number) => { const t = new Date(Date.UTC(d.year, d.month - 1, d.day + n)); return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }; };
    const day = (() => { let d = plus(termStart(asked.term).date, 8); for (let n = 0; n < 21 && !coursesFor(s, d).length; n += 1) d = plus(d, 1); return d; })();
    expect(coursesFor(s, day).map((c) => c.code)).toEqual(['DRAM 153a']);
    // The aid office's review: no exception to tuition without a medical leave.
    sim.must({ kind: 'school.request_aid_review', payload: {} });
    tended(sim, sim.now + 8 * MS_DAY);
    expect(s.aidReview).toMatchObject({ status: 'decided', tuition: false });
    // FIXTURE: the additional term's start brought near, and Play passed in it.
    sim.timeline.cancel(pendingOf(sim, TERM_KIND).find((i) => i.payload.term === asked.term)!.id, sim.now);
    sim.schedule({ at: sim.now + MS_HOUR, kind: TERM_KIND, label: 'Term', category: 'school', priority: 30, payload: { personId: sim.player.id, term: asked.term } });
    tended(sim, sim.now + 2 * MS_HOUR);
    expect(accountOwed(sim, sim.player)).toBeGreaterThan(0);
    fund(sim, accountOwed(sim, sim.player) + 100_00);
    sim.must({ kind: 'school.pay_balance', payload: {} });
    s.courses![`${asked.term}:DRAM 153a`] ={ term: asked.term, academic: 0, code: 'DRAM 153a', name: 'Play', meetings: 13, attended: 13, excused: 0, result: 'pass', why: 'TEST SETUP' };
    Object.assign(s.tally, { classDays: 13, attended: 13, excused: 0 });
    evaluate(sim, sim.player, asked.term);
    const conferral = pendingOf(sim, CONFERRAL_KIND)[0]!;
    expect(new Date(conferral.at).getUTCMonth()).toBe(11);
    // FIXTURE: the conferral brought to tomorrow.
    sim.timeline.cancel(conferral.id, sim.now);
    sim.schedule({ at: sim.now + MS_DAY, kind: CONFERRAL_KIND, label: 'Conferral', category: 'school', priority: 30, payload: conferral.payload });
    tended(sim, sim.now + 2 * MS_DAY);
    expect(s.standing).toBe('graduated');
    expect(titled(sim, 'Your MFA Is Conferred')[0]!.body).toMatch(/December conferral/);
  });

  it('a medical leave behind it earns the aid office’s exception to tuition', () => {
    const sim = student('sp-aid', { family: undefined, wealth: 'scraping' });
    tended(sim, at(2026, 9, 2));
    const school = sim.player.school!;
    // FIXTURE: a medical leave returned from, and a seventh term coming.
    school.leaves = [{ id: 'l1', kind: 'medical', reason: 'illness', requestedAt: 0, status: 'returned', firstTerm: 0, returnTerm: 2, terms: 2, decideAt: 0 }];
    Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5] });
    sim.must({ kind: 'school.request_aid_review', payload: {} });
    tended(sim, sim.now + 8 * MS_DAY);
    expect(school.aidReview).toMatchObject({ status: 'decided', tuition: true, living: true });
    expect(sim.execute({ kind: 'school.request_aid_review', payload: {} }).error).toMatch(/reviewed/);
  });
});
