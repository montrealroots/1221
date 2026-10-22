/**
 * Brief 20's benefits area, B1 and B3 for tax (docs/verification/audit-2026-10-21/criteria.md): the year's wages reach
 * the earnings record, its withholding and the return the clock makes each February; the return's refund or balance
 * reaches the bank, at filing or on the refund's day; a return not filed brings its notice, its penalty and its interest
 * on the rule's days; and a payment plan's missed payment has its consequence. Each is a comparison of lives alike but
 * for one input, from the same seed, with the input that mustn't leak asserted equal.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig` or `newLifeFrom`), Ada Cole at Yale in New Haven, played by
 * the clock and the commands a player sends: `school.take_shift`, `pro.accept_offer`, `bank.transfer`, `bank.open_term`,
 * `bank.break_term`, `tax.file`, `tax.apply_plan`. TEST SETUP (tests/fakes/b20-benefits.ts), said where it's done: the
 * graduate made through the School's own Commencement handler, the offer for Winter Ledger standing as casting's draw
 * would make it, and a skilled actor's craft for the twin. Never the wages, a return, a balance or a plan.
 *
 * Every figure is worked here from the rule and written as a literal, never asked of the engine's helper: the IRS's 7% a
 * year compounded daily, a 365th of it a day in 2027 and a 366th in 2028 (IRC 6622); the failure-to-file penalty, 4.5% of
 * the IRS's part for each month or part to five, beside the failure-to-pay's half a percent, a month being 30.4375 days
 * here, and past 60 days the filing share at least the lesser of $535 and the part (IRC 6651; `RETURN`).
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { newLifeConfig, newLifeFrom, withFamily, type NewSaveConfig } from '@/engine/world/bootstrap';
import { hasSsn } from '@/engine/systems/taxid';
import { TAX_NOTICE_KIND } from '@/engine/systems/taxreturn';
import { personalityOf } from '@/engine/systems/personality';
import { at, breakTheCd, checkingOf, graduate, intoTheCd, own, postedTo, reload, skilled, tended, titled, worked } from './fakes/b20-benefits';

/** An F-1 student born in Toronto, from the Scraping family. */
const f1Student = (seed: string) => createSave(1, seed, { ...withFamily(newLifeConfig(), 'scraping'), homeRegionId: 'ca-on-toronto', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** A US citizen born in New York, from the Inherited family, banking at Capital One: its savings' interest owes the IRS. */
const heir = (seed: string) => createSave(1, seed, newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'inherited', bankId: 'us-capital-one' } as Partial<NewSaveConfig>));
const r2026 = (sim: Simulation) => sim.player.returns!['2026']!;
/** The IRS's growth at 7% a year compounded daily over whole days in a year of so many. */
const grown = (days: number, year: 365 | 366) => (1 + 0.07 / year) ** days;

describe('wages reach the record, the withholding and the return, and the return reaches the bank (B1, B3)', () => {
  it('COMPARISON: two F-1 students alike but eight elective shifts of four hours at $23 in the fall: the 2026 1040-NR made on 1 February 2027 reads $736 more work-study, $88.32 more federal tax at 12%, more Connecticut tax, so a refund $88.32 smaller, paid into checking once on its day 70 days after filing; a twin who moves her savings into checking, which a 1040-NR doesn’t tax the interest of, files the same return', () => {
    const a = f1Student('b20-tax-shifts');
    const b = f1Student('b20-tax-shifts');
    const c = f1Student('b20-tax-shifts');
    for (const s of [a, b, c]) s.advanceTo(at(2026, 9, 14, 9));
    c.must({ kind: 'bank.transfer', payload: { fromId: own(c, 'savings').id, toId: checkingOf(c).id, amount: own(c, 'savings').balance } });
    for (let w = 0; w < 8; w += 1) {
      expect(a.execute({ kind: 'school.take_shift', payload: {} }).error).toBeUndefined();
      for (const s of [a, b, c]) s.advanceTo(s.now + 7 * MS_DAY);
    }
    for (const s of [a, b, c]) s.advanceTo(at(2027, 2, 1, 12));
    const ra = r2026(a);
    const rb = r2026(b);
    // The record and the return: 32 hours more of work-study, the whole of it on the 1040-NR.
    expect(a.player.earnings!.years['2026']!.workStudy - b.player.earnings!.years['2026']!.workStudy).toBe(736_00);
    expect([ra.figures.form, rb.figures.form]).toEqual(['1040-NR', '1040-NR']);
    expect([ra.figures.workStudy, rb.figures.workStudy]).toEqual([2_392_00, 1_656_00]);
    expect(ra.figures.income - rb.figures.income).toBe(736_00);
    // A nonresident's tax from the first dollar: the added $736 in the 12% bracket.
    expect(ra.figures.federal - rb.figures.federal).toBe(88_32);
    // The withholding is the scholarship's 14%, the same for both; work-study withholds none.
    expect([ra.figures.withheld, rb.figures.withheld]).toEqual([1_961_96, 1_961_96]);
    expect([ra.figures.owedTo, rb.figures.owedTo]).toEqual([{ irs: -241_24, states: { 'us-ct': 7_03 } }, { irs: -329_56, states: { 'us-ct': 3_35 } }]);
    // The input that mustn't leak: her savings in her checking account, whose interest a 1040-NR leaves out.
    const rc = r2026(c);
    for (const k of ['income', 'federal', 'withheld', 'balance', 'owedTo', 'states'] as const) expect(rc.figures[k], k).toEqual(rb.figures[k]);

    // Filed on 1 February: Connecticut's part from checking at once, the IRS's refund 21 days on and seven weeks more,
    // her 1040-NR going with an ITIN application, she having no Social Security number.
    for (const s of [a, b]) {
      expect(hasSsn(s.player)).toBe(false);
      const ct = r2026(s).figures.owedTo!.states['us-ct']!;
      s.must({ kind: 'tax.file', payload: { year: 2026 } });
      expect(postedTo(s, /^Connecticut income tax, 2026$/, checkingOf(s).id)).toEqual([[at(2027, 2, 1, 12), -ct]]);
      expect(r2026(s).refundAt).toBe(at(2027, 2, 1, 12) + 70 * MS_DAY);
      tended(s, at(2027, 4, 20, 12));
      expect(postedTo(s, /^Federal tax refund, 2026$/, checkingOf(s).id)).toEqual([[at(2027, 2, 1, 12) + 70 * MS_DAY, -r2026(s).figures.owedTo!.irs]]);
    }
  }, 120_000);

  it('COMPARISON: a graduate who works Winter Ledger’s nine weeks in Hudson, New York, has $10,026 of wages on her record with $766.99 of payroll tax and $81.04 of New York’s withheld, and her 2026 return, made by the clock, taxes it there and takes New York’s $0.46 from checking when she files; the same graduate who didn’t work has no return to file; a skilled twin who worked the same weeks, judged better, has the same record and the same return', () => {
    const a = graduate('b20-tax-career');
    const job = worked(a, 'winter-ledger');
    const e = a.player.pro!.engagements.find((x) => x.id === job.engagementId)!;
    const y = a.player.earnings!.years['2026']!;
    expect(e.pay.map((p) => p.received!.gross)).toEqual(Array(9).fill(1_114_00));
    expect([y.acting, y.withheld, y.withheldBy, y.elsewhere]).toEqual([10_026_00, 848_03, { us: 766_99, 'us-ny': 81_04 }, { 'us-ct>us-ny-hudson': 10_026_00 }]);
    expect(e.pay.reduce((s, p) => s + p.received!.withheld, 0)).toBe(848_03);
    tended(a, at(2027, 2, 1, 12));
    const r = r2026(a);
    // FICA at 7.65% of the wages is the payroll line, and what was withheld for it; the federal tax nothing, the year's
    // income under the standard deduction; New York's on the whole year's income in the share earned there.
    expect([r.figures.acting, r.figures.payroll, r.figures.federal, r.figures.withheld]).toEqual([10_026_00, 766_99, 0, 848_03]);
    expect(r.figures.owedTo).toEqual({ irs: 0, states: { 'us-ny': 46 } });
    const before = checkingOf(a).balance;
    expect(a.must({ kind: 'tax.file', payload: { year: 2026 } })).toEqual({ balance: 46, penalty: 0, paid: true, irs: 0, states: { 'us-ny': 46 } });
    expect(before - checkingOf(a).balance).toBe(46);
    expect(postedTo(a, /^New York income tax, 2026$/, checkingOf(a).id)).toEqual([[at(2027, 2, 1, 12), -46]]);

    const b = graduate('b20-tax-career');
    tended(b, at(2027, 2, 1, 12));
    expect(b.player.earnings?.years['2026']?.acting ?? 0).toBe(0);
    expect(b.player.returns?.['2026']).toBeUndefined();

    const c = graduate('b20-tax-career');
    skilled(c);
    worked(c, 'winter-ledger');
    tended(c, at(2027, 2, 1, 12));
    expect(c.player.earnings!.years['2026']).toEqual(a.player.earnings!.years['2026']);
    expect(r2026(c).figures).toEqual(r.figures);
  }, 120_000);
});

describe('a return not filed (B3)', () => {
  it('COMPARISON: an heir’s 2026 return owing the IRS $1,351.47 on her savings’ interest: filed on 1 February it costs that and no more; filed 85 days after its 15 April due date it adds $555.27 of penalties and $31.00 of interest; never filed, the late notice comes on the due date, the worry of it each day from the next, the IRS’s CP2566 a year on, and its assessment 120 days after that, with $643.12 of penalties and interest from the due date on the tax and the filing share; her own return in its place, the same tax, leaves the penalty standing and says so', () => {
    const DUE = at(2027, 4, 15, 23, 59);
    const TAX = 1_351_47;
    const onTime = heir('b20-tax-late');
    onTime.advanceTo(at(2027, 2, 1, 12));
    expect(r2026(onTime).due).toBe(DUE);
    expect(r2026(onTime).figures.owedTo).toEqual({ irs: TAX, states: { 'us-ct': 339_41 } });
    const late = heir('b20-tax-late');
    const never = heir('b20-tax-late');

    onTime.must({ kind: 'tax.file', payload: { year: 2026 } });
    expect(postedTo(onTime, /^Federal income tax, 2026/, checkingOf(onTime).id)).toEqual([[at(2027, 2, 1, 12), -TAX]]);
    expect([r2026(onTime).penalty, r2026(onTime).owed]).toEqual([0, undefined]);

    // 85 days late: three months begun. Paying late's 1.5% ($20.27), filing late's 13.5% raised past 60 days to $535;
    // interest on the tax and the filing share, $1,886.47, for 85 days at a 365th of 7% a day: $31.00.
    late.advanceTo(DUE + 85 * MS_DAY);
    late.must({ kind: 'tax.file', payload: { year: 2026 } });
    const payLate = Math.min(0.25, 0.005 * 3) * TAX;
    const fileLate = Math.max(3 * 0.045 * TAX, Math.min(535_00, TAX));
    expect(r2026(late).penalty).toBe(Math.round(payLate + fileLate));
    expect(r2026(late).penalty).toBe(555_27);
    const interest = Math.round((TAX + fileLate) * (grown(85, 365) - 1));
    expect(interest).toBe(31_00);
    expect(postedTo(late, /^Federal income tax, 2026, with late penalties and interest$/, checkingOf(late).id)).toEqual([[DUE + 85 * MS_DAY, -(TAX + 555_27 + interest)]]);

    // Never filed. Up to the due date it weighs on her no more than the paid return weighs on her twin; from the day after,
    // each day ends with the worry of tax owed, 4 more points of stress and 2 fewer of morale, by her temperament.
    for (const s of [onTime, never]) s.advanceTo(DUE - MS_HOUR);
    expect([never.player.wellbeing.stress, never.player.wellbeing.morale]).toEqual([onTime.player.wellbeing.stress, onTime.player.wellbeing.morale]);
    for (const s of [onTime, never]) s.advanceTo(DUE + MS_HOUR);
    expect(never.player.wellbeing.stress - onTime.player.wellbeing.stress).toBeCloseTo(4 * personalityOf(never.player, 'stressGain'), 6);
    expect(onTime.player.wellbeing.morale - never.player.wellbeing.morale).toBeCloseTo(2 * personalityOf(never.player, 'moraleSwing'), 6);
    expect(titled(never, 'Your 2026 Return Is Late').map((n) => [n.at, n.body])).toEqual([[DUE, 'Each month it’s late adds 5% of what you owe the IRS, up to a quarter of it, and after 60 days the penalty is at least $535.00. Connecticut charges its own penalty on what you owe it. File it on Papers, under Tax Returns.']]);
    never.advanceTo(DUE + (365 + 120) * MS_DAY + MS_HOUR);
    expect(titled(never, 'The IRS Figured Your 2026 Return').map((n) => n.at)).toEqual([DUE + 365 * MS_DAY]);
    expect(titled(never, 'The IRS Assessed Your 2026 Return').map((n) => n.at)).toEqual([DUE + 485 * MS_DAY]);
    const r = r2026(never);
    expect([r.substitute, r.filedAt]).toEqual([true, DUE + 485 * MS_DAY]);
    // Sixteen months begun: paying late's 8%, filing late's 22.5% raised to $535. Interest on $1,886.47 from the due date:
    // 260 days of 2027 at a 365th and 225 of 2028 at a 366th, to the minute.
    const sfrPayLate = 0.08 * TAX;
    const sfrFileLate = Math.max(5 * 0.045 * TAX, Math.min(535_00, TAX));
    expect(r.penalty).toBe(Math.round(sfrPayLate + sfrFileLate));
    const newYear = at(2028, 1, 1, 0);
    const sfrInterest = Math.round((TAX + sfrFileLate) * (grown((newYear - DUE) / MS_DAY, 365) * grown((DUE + 485 * MS_DAY - newYear) / MS_DAY, 366) - 1));
    expect(r.parts).toEqual({ tax: TAX, penalty: Math.round(sfrPayLate + sfrFileLate), interest: sfrInterest });
    expect(r.penalty).toBe(643_12);
    // And the IRS's collection begins: its first reminder 35 days on.
    expect(never.universe.scheduled.filter((i) => i.kind === TAX_NOTICE_KIND && i.status === 'pending').map((i) => i.at)).toEqual([DUE + 520 * MS_DAY]);

    // DEFECT: her own return filed in its place two weeks on shows the same $1,351.47, the IRS's figures claiming no credit
    // hers would, so the penalty and interest stand, and the notice says so. Until 2026-10-21 it said they were "reduced
    // in proportion", which they weren't.
    never.advanceTo(DUE + 499 * MS_DAY);
    never.must({ kind: 'tax.file', payload: { year: 2026 } });
    // The penalty assessed with it kept whole: its share of the tax is the same.
    expect([r.substitute, r.reconsideredAt, r.parts!.tax, r.penalty]).toEqual([false, never.now, TAX, 643_12]);
    expect(titled(never, 'Your 2026 Return Replaces The IRS’s').map((n) => n.body)).toEqual([`The IRS reconsidered its assessment using your own return: $1,351.47 of federal tax for the year, against its $1,351.47. You still owe $${(r.owed! / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}. Your return shows the same tax, so its penalty and interest stand.`]);
  }, 120_000);
});

describe('a payment plan’s missed payment (B3)', () => {
  it('COMPARISON: a Scraping family’s student, dismissed in December 2027, files her 2027 return on 1 February 2028 with her money in a CD, owing the IRS $1,700.39, and her monthly plan at the least, $23.62, is approved at once with no fee at her income: kept up with the CD broken, $23.62 leaves her accounts every 30 days and no letter comes; missed on 2 March, CP523 comes at once, the plan ends 30 days on, and the IRS’s final notice comes 35 days after the 18 April due date, the levy 30 days after it', () => {
    const kept = createSave(1, 'b20-tax-plan', { ...withFamily(newLifeConfig(), 'scraping'), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    kept.advanceTo(at(2027, 2, 1, 12));
    kept.must({ kind: 'tax.file', payload: { year: 2026 } });
    kept.advanceTo(at(2028, 2, 1, 12));
    const r = () => kept.player.returns!['2027']!;
    expect([kept.player.school!.standing, r().figures.owedTo]).toEqual(['dismissed', { irs: 1_700_39, states: { 'us-ct': 585_33 } }]);
    intoTheCd(kept);
    kept.must({ kind: 'tax.file', payload: { year: 2027 } });
    expect(r().owed).toBe(1_700_39);
    // The least a month, what's owed over 72 months, rounded up: $1,700.39 / 72 = $23.617.
    expect(kept.must({ kind: 'tax.apply_plan', payload: { kind: 'long', directDebit: true } })).toEqual({ status: 'pending', decideAt: at(2028, 2, 1, 12) + 60_000, fee: 0 });
    kept.advanceTo(kept.now + 2 * 60_000);
    const first = at(2028, 2, 1, 12) + 60_000 + 30 * MS_DAY;
    expect(kept.player.taxPlan).toMatchObject({ status: 'active', monthly: 23_62, nextDue: first });
    const missed = reload(kept);

    // Kept up: the CD broken, the money back in checking, each payment taken on its day.
    breakTheCd(kept);
    kept.advanceTo(at(2028, 6, 1, 12));
    expect(postedTo(kept, /^IRS payment plan$/, checkingOf(kept).id)).toEqual([0, 1, 2, 3].map((n) => [first + n * 30 * MS_DAY, -23_62]));
    expect(kept.player.taxPlan!.status).toBe('active');
    expect(titled(kept, 'Notice CP523: A Payment Missed')).toEqual([]);
    expect(titled(kept, 'Final Notice Of Intent To Levy')).toEqual([]);

    // Missed: nothing in checking or savings on 2 March.
    missed.advanceTo(at(2028, 6, 24, 12));
    expect(titled(missed, 'Notice CP523: A Payment Missed').map((n) => [n.at, n.body])).toEqual([[first, 'Your bank couldn’t pay the plan’s $23.62. Catch up by April 1, 2028 on Papers, under Tax Returns, or the plan ends and collection resumes.']]);
    expect(titled(missed, 'Your IRS Payment Plan Has Ended').map((n) => n.at)).toEqual([first + 30 * MS_DAY]);
    expect(missed.player.taxPlan!.status).toBe('ended');
    const DUE = at(2028, 4, 18, 23, 59);
    expect(titled(missed, 'Final Notice Of Intent To Levy').map((n) => n.at)).toEqual([DUE + 35 * MS_DAY]);
    expect(titled(missed, 'The IRS Levied Your Accounts').map((n) => n.at)).toEqual([DUE + 65 * MS_DAY]);
    expect(postedTo(missed, /^IRS payment plan$/, checkingOf(missed).id)).toEqual([]);
  }, 120_000);
});

describe('a later year’s tax under a plan (B3)', () => {
  it('PLAYER JOURNEY: the heir’s 2026 balance on a plan at the least, her 2027 return filed unpaid on 1 February 2028 adds more than two payments’ worth: Notice CP523 at once, the plan behind; revised, it covers both years and is in force again; her twin who doesn’t revise has it ended 30 days on', () => {
    const sim = heir('b20-tax-newtax');
    sim.advanceTo(at(2027, 2, 1, 12));
    intoTheCd(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    sim.must({ kind: 'tax.apply_plan', payload: { kind: 'long', directDebit: true } });
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(sim.player.taxPlan).toMatchObject({ status: 'active', monthly: 18_78 });
    // The CD broken and all but $50,000 back in her Capital One savings, earning its interest, so each payment is made.
    breakTheCd(sim);
    sim.must({ kind: 'bank.transfer', payload: { fromId: checkingOf(sim).id, toId: own(sim, 'savings').id, amount: checkingOf(sim).balance - 50_000_00 } });
    sim.advanceTo(at(2028, 2, 1, 12));
    expect(sim.player.taxPlan!.status).toBe('active');
    // Everything into a CD again, and the 2027 return filed: the bank can't pay it, and it meets the plan.
    intoTheCd(sim);
    const filed = sim.must<{ irs: number; paid: boolean }>({ kind: 'tax.file', payload: { year: 2027 } });
    expect(filed.paid).toBe(false);
    const added = sim.player.returns!['2027']!.owed!;
    expect(added).toBeGreaterThan(2 * 18_78);
    expect(sim.player.taxPlan).toMatchObject({ status: 'default', defaultBy: at(2028, 2, 1, 12) + 30 * MS_DAY });
    expect(titled(sim, 'Notice CP523: Your Payment Plan').map((n) => [n.at, n.body])).toEqual([[at(2028, 2, 1, 12), `New tax of $${(added / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} is more than two of the plan’s monthly payments, so it can’t simply join the plan. Revise the plan on Papers by March 2, 2028, or it ends and collection resumes.`]]);
    const twin = reload(sim);
    // Revised at the least on both years: in force, covering them.
    breakTheCd(sim);
    const owedNow = Object.values(sim.player.returns!).reduce((s, r) => s + (r.owed ? r.owed : 0), 0);
    expect(sim.execute({ kind: 'tax.revise_plan', payload: {} }).error).toBeUndefined();
    expect(sim.player.taxPlan!.status).toBe('active');
    expect(sim.player.taxPlan!.covers).toBeGreaterThanOrEqual(owedNow);
    sim.advanceTo(at(2028, 3, 10, 12));
    expect(sim.player.taxPlan!.status).toBe('active');
    expect(titled(sim, 'Your IRS Payment Plan Has Ended')).toEqual([]);
    // Not revised: ended on its day.
    twin.advanceTo(at(2028, 3, 10, 12));
    expect(twin.player.taxPlan!.status).toBe('ended');
    expect(titled(twin, 'Your IRS Payment Plan Has Ended').map((n) => n.at)).toEqual([at(2028, 2, 1, 12) + 30 * MS_DAY]);
  }, 120_000);
});
