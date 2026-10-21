/**
 * Brief 20's School area, B1 and B3: money owed to the School, its hold, and a leave's notice of return, through the
 * clock (2026-10-21). One student (seed `b20-school-account`, a New York student of modest means, on need-based aid) is
 * played by the attentive student to 5 October 2026, falls ill (TEST SETUP: the flu, as `careFor` gives one, set by
 * hand; the consequences under test are the leave's and the account's, not the flu's), and asks for a medical leave
 * (`school.request_leave`). Granted on 12 October, it begins that day: the fall's courses are left, and the term's
 * living-expense scholarship is charged back to the Yale account on the rebate schedule, due in thirty days. From there
 * the clock is moved a week at a time, as the Advance menu moves it.
 *
 * - A pays the balance from the bank before it's due (`school.pay_balance`); B doesn't, until February.
 * - C gives notice of return in May (`school.return_notice`), comes back in August and registers; D gives none.
 *
 * Relevant: unpaid at its date, a hold and a late fee, $125 a month to $375 a term, each said; paid, the hold lifts. No
 * notice by its date, dismissal; notice, the return, with registration asked again before classes count them. No leak:
 * the leave itself, the standing and every other dollar are the same, paid or not.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { healthOf } from '@/engine/systems/health';
import { ACCOUNT_DUE_KIND, accountOwed, yaleAccount } from '@/engine/systems/leave';
import { EXTENDED_STUDY } from '@/engine/content/school';
import { registered } from '@/engine/systems/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { at, balances, play, student, tallyOf, titled } from './setup/b20-school';

const open = (raw: string): Simulation => loadSave(deserialise(raw) as never);
/** The clock moved a week at a time, as the Advance menu's Next Week moves it while nothing wants the player. */
const weeks = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 7 * MS_DAY)); return sim; };
const FEE = EXTENDED_STUDY.lateFee;
const leaveOf = (sim: Simulation) => { const s = sim.player.school!; const l = s.leave ?? s.leaves?.at(-1); return { status: l?.status, firstTerm: l?.firstTerm, returnTerm: l?.returnTerm, startedAt: l?.startedAt, offset: s.offset, standing: s.standing }; };

describe('B1/B3: what a leave begun mid-term owes the School, paid and unpaid (seed b20-school-account)', () => {
  const S = {} as { raw: string; aid: number; due: number; a: Simulation; b: Simulation; paidA?: { owed: number; held: boolean } };
  beforeAll(() => {
    const sim = play(student('b20-school-account', { wealth: 'modest' }), at(2026, 10, 5, 12));
    // A medical leave needs a reason a physician would see: refused while well.
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } }).error).toMatch(/physician’s written recommendation/);
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    play(sim, asked.decideAt + MS_HOUR);
    S.raw = serialise(sim.universe);
    S.aid = sim.player.school!.leave!.aidReturned!;
    S.due = sim.universe.scheduled.find((i) => i.kind === ACCOUNT_DUE_KIND && i.status === 'pending')!.at;
    S.a = open(S.raw);
    S.a.advanceTo(at(2026, 10, 20, 12));
    S.paidA = S.a.must<{ owed: number; held: boolean }>({ kind: 'school.pay_balance', payload: {} });
    weeks(S.a, at(2027, 2, 15));
    S.b = weeks(open(S.raw), at(2027, 2, 15));
  }, 60_000);

  it('the leave begun mid-term charges part of the term’s living scholarship to the Yale account, due in thirty days', () => {
    const sim = open(S.raw);
    const l = sim.player.school!.leave!;
    expect(l.status).toBe('on');
    expect(S.aid).toBeGreaterThan(0);
    expect(accountOwed(sim, sim.player)).toBe(S.aid);
    expect(S.due).toBe(l.startedAt! + EXTENDED_STUDY.dueDays * MS_DAY);
    // The fall's courses left, kept on the record as left on a leave.
    const left = Object.values(sim.player.school!.courses!).filter((r) => r.term === 0);
    expect(left.length).toBeGreaterThan(3);
    expect(left.every((r) => r.result === 'withdrawn' && r.why === 'left on a leave of absence')).toBe(true);
  });

  it('unpaid at its date: a hold and a late fee, each month to the term’s cap, each said; the balance is the sum of its postings', () => {
    const b = S.b;
    expect(b.player.school!.hold).toBe(S.due);
    expect(b.player.school!.lateFees).toEqual({ 0: EXTENDED_STUDY.lateFeeTermCap });
    expect(accountOwed(b, b.player)).toBe(S.aid + EXTENDED_STUDY.lateFeeTermCap);
    const holds = titled(b, 'A Financial Hold');
    expect(holds.length).toBeGreaterThanOrEqual(1);
    expect(holds.at(-1)!.body).toMatch(/is owed on your Yale account\. While it’s unpaid, a hold stops registration and the diploma\. Pay it on the Terms And Award tab\./);
    const fees = b.universe.transactions.filter((t) => t.memo === 'Late payment fee, Fall Term 2026');
    expect(fees.map((t) => t.at - S.due)).toEqual([0, 30 * MS_DAY, 60 * MS_DAY]);
    const acc = yaleAccount(b, b.player, false)!;
    expect(b.universe.transactions.flatMap((t) => t.postings).filter((p) => p.accountId === acc.id).reduce((n, p) => n + p.amount, 0)).toBe(acc.balance);
    // Paid before its date: nothing owed, no hold, no fee.
    expect(S.paidA).toEqual({ owed: 0, held: false });
    expect(S.a.player.school!.hold).toBeUndefined();
    expect(S.a.player.school!.lateFees).toBeUndefined();
    expect(titled(S.a, 'A Financial Hold')).toHaveLength(0);
    expect(FEE * 3).toBe(EXTENDED_STUDY.lateFeeTermCap);
  });

  it('paid in February, the hold lifts, once; the late fees are the whole difference in the money; the leave is the same', () => {
    const b = open(serialise(S.b.universe));
    const paid = b.must<{ owed: number; held: boolean }>({ kind: 'school.pay_balance', payload: {} });
    expect(paid).toEqual({ owed: 0, held: false });
    expect(b.player.school!.hold).toBeUndefined();
    expect(titled(b, 'The Financial Hold Is Lifted')).toHaveLength(1);
    expect(b.execute({ kind: 'school.pay_balance', payload: {} }).error).toBe('Your Yale account owes no balance.');
    const checking = (sim: Simulation) => balances(sim)['Chase Total Checking']!;
    expect(checking(S.a) - checking(b)).toBe(EXTENDED_STUDY.lateFeeTermCap);
    expect(balances(b)['Chase Savings']).toBe(balances(S.a)['Chase Savings']);
    expect(leaveOf(b)).toEqual(leaveOf(S.a));
  });
});

describe('B3: a leave’s notice of return, given and not given, through the clock (seed b20-school-account)', () => {
  const S = {} as { c: Simulation; d: Simulation; noticeBy: number };
  beforeAll(() => {
    const sim = play(student('b20-school-account', { wealth: 'modest' }), at(2026, 10, 5, 12));
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    play(sim, asked.decideAt + MS_HOUR);
    sim.must({ kind: 'school.pay_balance', payload: {} });
    S.noticeBy = sim.player.school!.leave!.noticeBy!;
    const raw = serialise(sim.universe);
    S.c = weeks(open(raw), at(2027, 5, 3, 12));
    S.c.must({ kind: 'school.return_notice', payload: {} });
    weeks(S.c, at(2027, 8, 23, 12));
    S.d = weeks(open(raw), S.noticeBy + MS_DAY);
  }, 60_000);

  it('no notice by its date: reminded two weeks before, then dismissed at the date', () => {
    const d = S.d;
    expect(d.player.school!.standing).toBe('dismissed');
    expect(titled(d, 'Two Weeks To Give Notice')).toHaveLength(1);
    expect(titled(d, 'Two Weeks To Give Notice')[0]!.at).toBe(S.noticeBy - 14 * MS_DAY);
    expect(titled(d, 'Dismissed From The School')[0]!.at).toBe(S.noticeBy);
    expect(titled(d, 'Dismissed From The School')[0]!.body).toMatch(/You didn’t give notice of your return by/);
  });

  it('notice given: no reminder and no dismissal; back for the fall, asked to register before classes count them', () => {
    const c = S.c;
    expect(c.player.school!.standing).not.toBe('dismissed');
    expect(titled(c, 'Two Weeks To Give Notice')).toHaveLength(0);
    expect(titled(c, 'Back From Your Leave')).toHaveLength(1);
    expect(c.player.school!.leave).toBeUndefined();
    expect(c.player.school!.leaves!.at(-1)!.status).toBe('returned');
    expect(registered(c.player.school, courseworkOf(c, c.player))).toBe(false);
    // Registered on the Standing tab, the first week's classes count them.
    c.must({ kind: 'school.reregister', payload: {} });
    play(c, at(2027, 9, 4));
    const t = tallyOf(c);
    expect(t.classDays).toBeGreaterThanOrEqual(5);
    expect(t.attended).toBe(t.classDays);
  }, 60_000);
});
