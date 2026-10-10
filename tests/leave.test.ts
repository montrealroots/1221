/**
 * A leave of absence, a year repeated, and the Yale account past the sixth term (from 2026-10-10, `systems/leave.ts`).
 * PLAYER JOURNEYS play forward through commands, with a save and a load while something is pending; FIXTURES set a
 * state by hand to reach one rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { COMMENCEMENT_KIND, CLASSES_KIND, EVALUATION_KIND, TERM_KIND, academicTerm, classPeriod, coursesOn, evaluate, registered, termStart } from '@/engine/systems/school';
import { degreeShortfall } from '@/engine/systems/courserecord';
import { careFor, coverOn, healthOf } from '@/engine/systems/health';
import { f1Of } from '@/engine/systems/permission';
import { facultyReview, rebateShare, accountDue, billUnsupportedTerm, accountOwed, disqualified, enrolledTerms, insuranceStart, leaveRefusal, repeatRefusal, LEAVE_DECIDE_KIND } from '@/engine/systems/leave';
import { EXTENDED_STUDY, LEAVE_RULES } from '@/engine/content/school';
import { courseworkOf } from '@/engine/systems/coursework';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);
/** FIXTURE: money in the bank, as savings would be. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });

describe('PLAYER JOURNEY: a medical leave and the way back', () => {
  it('asks, waits, leaves the term, keeps Yale Health, gives notice with a clearance, and comes back to the courses it left', () => {
    let sim = student('lv-med');
    tended(sim, at(2026, 10, 5));
    // Not well, and the first term not done: no personal leave, but a medical one on a physician's recommendation.
    expect(leaveRefusal(sim, sim.player, 'personal', 'family')).toMatch(/after one term completed/);
    expect(leaveRefusal(sim, sim.player, 'medical', 'illness')).toMatch(/physician’s written recommendation/);
    // FIXTURE: the flu, as `careFor` gives one.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number; firstTerm: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    expect(asked).toMatchObject({ firstTerm: 0, startsNow: true });
    // Asked twice, refused: one request at a time.
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } }).error).toMatch(/with the chair and the dean/);
    // Pending across a save; nothing changes before the decision.
    sim = reload(sim);
    expect(sim.player.school!.leave!.status).toBe('pending');
    expect(sim.player.school!.offset ?? 0).toBe(0);
    tended(sim, asked.decideAt + MS_HOUR);
    const school = sim.player.school!;
    expect(school.leave!.status).toBe('on');
    expect(school.offset).toBe(LEAVE_RULES.terms);
    // The fall's courses left unfinished, each its own record, to be taken again.
    const left = Object.values(school.courses ?? {}).filter((r) => r.term === 0 && r.result === 'withdrawn');
    expect(left.length).toBeGreaterThan(3);
    expect(degreeShortfall(school).failed.map((r) => r.result)).toContain('withdrawn');
    // Medical: Yale Health goes on as Affiliate cover the School pays for.
    expect(school.leave!.affiliate).toMatchObject({ by: 'school', cost: 0 });
    expect(coverOn(sim.player, sim.now + 30 * MS_DAY)).toBe('yale');
    // No classes, calls or shifts while on leave; the return term on the calendar.
    expect(pendingOf(sim, CLASSES_KIND)).toHaveLength(0);
    expect(pendingOf(sim, TERM_KIND).map((i) => i.payload.term)).toEqual([2]);
    expect(enrolledTerms(school)).toEqual([]);
    // A second leave can't be asked for while on one.
    expect(leaveRefusal(sim, sim.player, 'medical', 'illness')).toBe('You’re on leave.');
    sim = reload(sim);
    // Notice: refused without a physician's clearance.
    tended(sim, at(2027, 5, 1));
    sim.player.wellbeing.condition = 20;
    expect(sim.execute({ kind: 'school.return_notice', payload: {} }).error).toMatch(/clear you/);
    sim.player.wellbeing.condition = 90;
    sim.must({ kind: 'school.return_notice', payload: {} });
    expect(sim.execute({ kind: 'school.return_notice', payload: {} }).error).toMatch(/gave notice/);
    // Back at the fall term, in the first year again, registration to do before classes count.
    tended(sim, at(termStart(2).date.year, termStart(2).date.month, termStart(2).date.day, 12));
    const back = sim.player.school!;
    expect(back.leave).toBeUndefined();
    expect(back.leaves!.at(-1)!.status).toBe('returned');
    expect(academicTerm(back, 2)).toBe(0);
    expect(registered(back, courseworkOf(sim, sim.player))).toBe(false);
    sim.must({ kind: 'school.reregister', payload: {} });
    expect(registered(back, courseworkOf(sim, sim.player))).toBe(true);
    // The first year's fall courses meet on the second fall's days.
    const day = classPeriod(2).from;
    let d = day;
    while (!coursesOn(d, back.offset).length) d = { ...d, day: d.day + 1 };
    expect(coursesOn(d, back.offset).map((c) => c.code)).toEqual(expect.arrayContaining(['DRAM 103a/b']));
    expect(titled(sim, 'Back From Your Leave')).toHaveLength(1);
  });
});

describe('a personal leave', () => {
  it('granted for the next term after the fall’s evaluation: the spring never begins, and the fall’s cover runs to 31 January', () => {
    const sim = student('lv-next');
    tended(sim, at(2026, 12, 18));
    const asked = sim.must<{ firstTerm: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    expect(asked).toMatchObject({ firstTerm: 1, startsNow: false });
    tended(sim, at(2027, 1, 2));
    expect(sim.player.school!.leave!.status).toBe('granted');
    tended(sim, at(2027, 1, 5));
    const school = sim.player.school!;
    expect(school.leave!.status).toBe('on');
    expect(school.leave!.aidReturned).toBeUndefined();
    expect(school.leave!.coverEnds).toBe(insuranceStart(1));
    expect(coverOn(sim.player, at(2027, 1, 20))).toBe('yale');
    expect(coverOn(sim.player, at(2027, 2, 10))).not.toBe('yale');
    // Its Affiliate deadline: 31 January, later than thirty days from asking.
    expect(school.leave!.affiliateBy).toBe(at(2027, 1, 31, 23) + 59 * 60_000);
  });

  it('PLAYER JOURNEY: asked on the third day of spring classes, begun on its decision: aid returned on the rebate schedule, cover lapsed, Affiliate bought with the fee credited and the care in the lapse credited; no notice and it ends in dismissal', () => {
    let sim = student('lv-pers', { family: undefined, wealth: 'scraping' });
    tended(sim, at(2027, 1, 13, 12));
    const asked = sim.must<{ firstTerm: number; startsNow: boolean; decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    expect(asked).toMatchObject({ firstTerm: 1, startsNow: true });
    sim = reload(sim);
    tended(sim, asked.decideAt + MS_HOUR);
    const school = sim.player.school!;
    expect(school.leave!.status).toBe('on');
    // Begun in the first tenth of the term: the term's living scholarship goes back in full, on the Yale account.
    expect(school.leave!.aidReturned).toBeGreaterThan(0);
    expect(accountOwed(sim, sim.player)).toBe(school.leave!.aidReturned);
    expect(school.leave!.retro).toBe(false);
    expect(coverOn(sim.player, sim.now + MS_DAY)).not.toBe('yale');
    // Care in the lapse is billed as uninsured.
    tended(sim, sim.now + 2 * MS_DAY);
    const bill = careFor(sim, sim.player, { care: 'urgent', what: 'Urgent care' }, sim.now);
    expect(bill?.amount ?? 0).toBeGreaterThan(0);
    const billed = bill!.amount;
    // Affiliate: confirmed, paid in full for both terms less the spring's fee paid, and the bill brought down.
    fund(sim, 20_000_00);
    expect(sim.execute({ kind: 'school.buy_affiliate', payload: {} }).error).toMatch(/Confirm/);
    const bought = sim.must<{ cost: number; credit: number }>({ kind: 'school.buy_affiliate', payload: { confirm: true } });
    expect(bought.credit).toBeGreaterThan(0);
    expect(bought.cost).toBe(2 * LEAVE_RULES.affiliatePerTerm - bought.credit);
    expect(coverOn(sim.player, sim.now - MS_DAY)).toBe('yale');
    expect(healthOf(sim.player).bills.find((b) => b.id === bill!.id)!.amount).toBeLessThan(billed);
    expect(titled(sim, 'Care Credited')).toHaveLength(1);
    // No notice by its deadline: dismissed, as the Bulletin's leave ends.
    sim = reload(sim);
    const by = sim.player.school!.leave!.noticeBy!;
    tended(sim, by + MS_HOUR);
    expect(sim.player.school!.standing).toBe('dismissed');
    expect(sim.player.school!.leaves!.at(-1)).toMatchObject({ status: 'dismissed' });
    expect(pendingOf(sim, TERM_KIND)).toHaveLength(0);
  });

  it('can be called off while it waits, and the decision never comes', () => {
    const sim = student('lv-cancel');
    tended(sim, at(2026, 12, 18));
    sim.must({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'personal' } });
    expect(sim.execute({ kind: 'school.cancel_leave', payload: {} }).error).toMatch(/Confirm/);
    sim.must({ kind: 'school.cancel_leave', payload: { confirm: true } });
    expect(pendingOf(sim, LEAVE_DECIDE_KIND)).toHaveLength(0);
    tended(sim, at(2027, 1, 12));
    expect(sim.player.school!.leaves!.at(-1)!.status).toBe('canceled');
    expect(sim.player.school!.offset ?? 0).toBe(0);
    expect(enrolledTerms(sim.player.school!)).toEqual([0, 1]);
  });

  it('is refused for a professional commitment, and refused to an F-1 student with why; a medical leave extends the I-20', () => {
    const sim = student('lv-f1', { homeRegionId: 'uk-eng-london' });
    tended(sim, at(2026, 12, 18));
    expect(leaveRefusal(sim, sim.player, 'personal', 'professional')).toMatch(/professional commitment/);
    expect(leaveRefusal(sim, sim.player, 'personal', 'family')).toMatch(/F-1.*fifteen days/);
    const before = f1Of(sim.player)!.expiresAt!;
    // FIXTURE: an injury, as a fall gives one.
    healthOf(sim.player).injury = { kind: 'sprain', at: sim.now - MS_DAY, until: sim.now + 10 * MS_DAY } as never;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'injury' } });
    tended(sim, asked.decideAt + MS_HOUR);
    tended(sim, at(2027, 1, 5));
    expect(sim.player.school!.leave!.status).toBe('on');
    expect(f1Of(sim.player)!.expiresAt! - before).toBeGreaterThan(360 * MS_DAY);
  });
});

describe('the rebate schedule a leave returns aid on', () => {
  it('returns all before classes and through the first tenth, half to a quarter, a quarter to midterm, nothing after', () => {
    const from = instantFromZoned({ ...classPeriod(0).from, hour: 0 }, zone);
    const to = instantFromZoned({ ...classPeriod(0).to, hour: 23 }, zone);
    const at = (share: number) => from + share * (to - from);
    expect(rebateShare(0, from - MS_DAY)).toBe(1);
    expect(rebateShare(0, at(0.05))).toBe(1);
    expect(rebateShare(0, at(0.2))).toBe(0.5);
    expect(rebateShare(0, at(0.4))).toBe(0.25);
    expect(rebateShare(0, at(0.6))).toBe(0);
  });
});

describe('withdrawing on leave', () => {
  it('ends the leave with the place', () => {
    const sim = student('lv-wd');
    tended(sim, at(2026, 10, 5));
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tended(sim, asked.decideAt + MS_HOUR);
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(sim.player.school!.standing).toBe('withdrawn');
    expect(sim.player.school!.leaves!.at(-1)!.status).toBe('withdrawn');
    expect(pendingOf(sim, TERM_KIND)).toHaveLength(0);
  });
});

describe('a withdrawal by the fifteenth day of classes', () => {
  it('cancels Yale Health back to the insurance term’s start, and care had in it is billed as uninsured, a bill of its own', () => {
    const sim = student('lv-retro', { wealth: 'comfortable' });
    tended(sim, at(2026, 9, 3, 12));
    const care = careFor(sim, sim.player, { care: 'visit', what: 'A doctor’s visit' }, sim.now);
    const billsBefore = healthOf(sim.player).bills.length;
    expect(healthOf(sim.player).careLog!.at(-1)!.share).toBe(care?.amount ?? 0);
    tended(sim, at(2026, 9, 8, 12));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(sim.player.school!.withdrewEarly).toBe(true);
    expect(coverOn(sim.player, at(2026, 9, 3, 12))).not.toBe('yale');
    const again = healthOf(sim.player).bills.slice(billsBefore);
    expect(again.some((b) => /canceled back/.test(b.what) && b.amount > 0)).toBe(true);
    expect(titled(sim, 'Care Billed Again')).toHaveLength(1);
  });
});

describe('failing, repeating and disqualification', () => {
  it('disqualifies at two Fails in a term, three by the second, or seven in all, as the Bulletin reads', () => {
    const sim = student('lv-dq');
    const school = sim.player.school!;
    const fail = (term: number, code: string) => ({ term, code, name: code, meetings: 20, attended: 5, excused: 0, result: 'fail' as const });
    // FIXTURE: records set by hand, two terms begun.
    Object.assign(school, { termsBegun: 2 });
    school.courses = { a: fail(0, 'A'), b: fail(1, 'B') };
    expect(disqualified(school)).toBeUndefined();
    school.courses.c = fail(1, 'C');
    expect(disqualified(school)).toMatch(/2 courses failed in Spring Term 2027/);
    school.courses = { a: fail(0, 'A'), b: fail(1, 'B'), c: { ...fail(0, 'C'), term: 0 } };
    expect(disqualified(school)).toMatch(/2 courses failed in Fall Term 2026/);
    // Spread one a term, three by the end of the second term.
    Object.assign(school, { termsBegun: 3 });
    school.courses = { a: fail(0, 'A'), b: fail(1, 'B'), c: fail(2, 'C') };
    expect(disqualified(school)).toBeUndefined();
    Object.assign(school, { termsBegun: 2, enrolled: [0, 1] });
    school.courses = { a: fail(0, 'A'), b: fail(1, 'B') };
    expect(disqualified(school)).toBeUndefined();
  });

  it('PLAYER JOURNEY: a first year failed is repeated on request, the attempts kept, and the degree reads the best', () => {
    let sim = student('lv-repeat');
    tended(sim, at(2027, 5, 10));
    const school = sim.player.school!;
    // FIXTURE: one spring course failed at the evaluation, as a run of unexcused absences fails one.
    const spring = Object.values(school.courses ?? {}).find((r) => r.term === 1 && r.result === 'pass')!;
    spring.result = 'fail';
    spring.why = 'TEST SETUP';
    expect(repeatRefusal(sim, sim.player)).toBeUndefined();
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_repeat', payload: {} });
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toMatch(/with the chair/);
    sim = reload(sim);
    tended(sim, asked.decideAt + MS_HOUR);
    const s = sim.player.school!;
    expect(s.repeat!.status).toBe('granted');
    expect(s.offset).toBe(2);
    expect(titled(sim, 'You’ll Repeat The Year')[0]!.body).toMatch(/SLATE’s faculty model/);
    // The second fall is the first year's fall again; the first attempts stay.
    tended(sim, at(2027, 8, 24, 12));
    expect(academicTerm(s, 2)).toBe(0);
    expect(enrolledTerms(s)).toEqual([0, 1, 2]);
    expect(Object.values(s.courses ?? {}).some((r) => r.code === spring.code && r.term === 1 && r.result === 'fail')).toBe(true);
    // FIXTURE: the course passed on its second attempt; the degree reads the pass.
    s.courses![`3:${spring.code}`] = { ...spring, term: 3, result: 'pass', why: 'TEST SETUP' };
    expect(degreeShortfall(s).failed.map((r) => r.code)).not.toContain(spring.code);
    // FIXTURE: a fall course passed the first time and failed on the repeat: the degree keeps the pass.
    const fall = Object.values(s.courses!).find((x) => x.term === 0 && x.result === 'pass')!;
    s.courses![`2:${fall.code}`] = { ...fall, term: 2, academic: fall.academic ?? 0, result: 'fail', why: 'TEST SETUP' };
    expect(degreeShortfall(s).failed.map((r) => r.code)).not.toContain(fall.code);
    // A second repeat isn't granted.
    s.courses![`3:${spring.code}`]!.result = 'fail';
    Object.assign(s, { termsBegun: 4 });
    s.history.push({ term: 3, standing: 'concern', attendance: 1, growth: 0, classGrowth: 0, reason: 'TEST SETUP' });
    // FIXTURE: the same first year failed again: the faculty don't approve it a second time.
    Object.assign(s, { termsBegun: 4 });
    expect(repeatRefusal(sim, sim.player)).toMatch(/don’t approve year 1 a second time/);
  });

  it('PLAYER JOURNEY: a last year failed waits thirty days for a repeat, then bills the seventh term, holds the account unpaid, and lifts the hold paid', () => {
    let sim = student('lv-final', { wealth: 'comfortable' });
    tended(sim, at(2026, 9, 2));
    const school = sim.player.school!;
    // FIXTURE: the sixth term's evaluation, five terms passed and one course failed in it.
    Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
    school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 6, excused: 0, result: 'fail', why: 'TEST SETUP' } };
    Object.assign(school.tally, { classDays: 40, attended: 40, excused: 0 });
    const review = evaluate(sim, sim.player, 5)!;
    expect(review.standing).not.toBe('withheld');
    expect(school.repeatBy).toBeGreaterThan(sim.now);
    expect(titled(sim, 'Your Degree Isn’t Complete')).toHaveLength(1);
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_repeat', payload: {} });
    sim = reload(sim);
    tended(sim, asked.decideAt + MS_HOUR);
    const s = sim.player.school!;
    expect(s.repeat!.status).toBe('granted');
    expect(s.repeatBy).toBeUndefined();
    // FIXTURE: the clock brought to the seventh term's eve, as playing three years would.
    expect(pendingOf(sim, TERM_KIND).map((i) => i.payload.term)).toContain(6);
    sim.timeline.cancel(pendingOf(sim, TERM_KIND).find((i) => i.payload.term === 6)!.id, sim.now);
    sim.schedule({ at: sim.now + MS_HOUR, kind: TERM_KIND, label: 'Term', category: 'school', priority: 30, payload: { personId: sim.player.id, term: 6 } });
    tended(sim, sim.now + 2 * MS_HOUR);
    expect(enrolledTerms(s)).toHaveLength(EXTENDED_STUDY.supportedTerms + 1);
    const owed = accountOwed(sim, sim.player);
    expect(owed).toBeGreaterThan(20_000_00);
    expect(titled(sim, 'A Term Without Tuition Support')).toHaveLength(1);
    // Unpaid by its due date: a hold and the late fee; monthly to the term's cap.
    tended(sim, sim.now + (EXTENDED_STUDY.dueDays + 1) * MS_DAY);
    expect(s.hold).toBeDefined();
    expect(accountOwed(sim, sim.player)).toBe(owed + EXTENDED_STUDY.lateFee);
    tended(sim, sim.now + 125 * MS_DAY);
    expect(accountOwed(sim, sim.player)).toBe(owed + EXTENDED_STUDY.lateFeeTermCap);
    // Paid in two parts; the hold lifts on the second.
    fund(sim, owed + 1_000_00);
    sim.must({ kind: 'school.pay_balance', payload: { amount: 1_000_00 } });
    expect(s.hold).toBeDefined();
    expect(sim.execute({ kind: 'school.pay_balance', payload: { amount: owed * 2 } }).error).toMatch(/is owed; pay that or less/);
    sim.must({ kind: 'school.pay_balance', payload: {} });
    expect(accountOwed(sim, sim.player)).toBe(0);
    expect(s.hold).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted')).toHaveLength(1);
  });

  it('PLAYER JOURNEY: graduation after a repeated year: the eighth term passed, the diploma held for the Yale account, conferred when it’s paid', () => {
    const sim = student('lv-late-grad', { wealth: 'comfortable' });
    tended(sim, at(2026, 9, 2));
    const school = sim.player.school!;
    // FIXTURE: the eighth calendar term, the program's sixth after a repeated year, its tuition billed and unpaid.
    Object.assign(school, { termsBegun: 8, enrolled: [0, 1, 2, 3, 4, 5, 6, 7], offset: 2, repeats: 1, standing: 'good', classOf: 2030 });
    billUnsupportedTerm(sim, sim.player, 7);
    accountDue(sim, sim.player, 7);
    expect(school.hold).toBeDefined();
    school.courses = { '7:DRAM 393b': { term: 7, academic: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } };
    Object.assign(school.tally, { classDays: 40, attended: 40, excused: 0 });
    const review = evaluate(sim, sim.player, 7)!;
    expect(review.standing).toBe('good');
    // FIXTURE: Commencement brought to tomorrow, so the years between aren't played.
    const booked = pendingOf(sim, COMMENCEMENT_KIND)[0]!;
    sim.timeline.cancel(booked.id, sim.now);
    sim.schedule({ at: sim.now + MS_DAY, kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 30, payload: booked.payload });
    tended(sim, sim.now + 2 * MS_DAY);
    expect(school.awaitingDegree).toBe(true);
    expect(titled(sim, 'The Diploma Is Held')).toHaveLength(1);
    fund(sim, accountOwed(sim, sim.player) + 10_000_00);
    sim.must({ kind: 'school.pay_balance', payload: {} });
    expect(school.standing).toBe('graduated');
    expect(titled(sim, 'Your MFA Is Conferred')[0]!.body).toMatch(/Your Yale account paid/);
  });

  it('REPLAY: the same seed and commands make the same leave, to the field', () => {
    const play = () => {
      const sim = student('lv-replay');
      tended(sim, at(2026, 10, 5));
      healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
      const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
      tended(sim, asked.decideAt + 3 * MS_DAY);
      return JSON.stringify({ school: sim.player.school, health: sim.player.health?.bills, docs: sim.player.documents });
    };
    expect(play()).toBe(play());
  });

  it('a last year failed with no repeat asked for in thirty days withholds the degree', () => {
    const sim = student('lv-final-none');
    tended(sim, at(2026, 9, 2));
    const school = sim.player.school!;
    // FIXTURE: as above.
    Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
    school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 6, excused: 0, result: 'fail', why: 'TEST SETUP' } };
    Object.assign(school.tally, { classDays: 40, attended: 40, excused: 0 });
    evaluate(sim, sim.player, 5);
    tended(sim, school.repeatBy! + MS_HOUR);
    expect(school.standing).toBe('withheld');
    expect(titled(sim, 'The Degree Isn’t Recommended')[0]!.body).toMatch(/didn’t ask to repeat/);
  });

  it('the faculty review a disqualification: the first time on warning, judged once, not stepped past', () => {
    const sim = student('lv-dq-play');
    tended(sim, at(2026, 12, 9));
    // FIXTURE: two fall courses met at a third of their meetings, none excused, before the evaluation settles them.
    const recs = Object.values(sim.player.school!.courses ?? {}).filter((r) => r.term === 0 && r.result === undefined).slice(0, 2);
    for (const r of recs) r.attended = Math.floor(r.meetings / 3);
    tended(sim, at(2026, 12, 12));
    expect(pendingOf(sim, EVALUATION_KIND)).toHaveLength(0);
    const school = sim.player.school!;
    expect(school.reviews?.[0]).toMatchObject({ term: 0, outcome: 'warning' });
    expect(school.standing).toBe('warning');
    expect(titled(sim, 'A Faculty Review: On Warning')[0]!.body).toMatch(/Bulletin disqualifies a student with 2 Failures in a term/);
    // Reviewed again in a later term, it's a dismissal.
    expect(facultyReview(sim, sim.player, 1)).toMatchObject({ outcome: 'dismissed' });
  });
});
