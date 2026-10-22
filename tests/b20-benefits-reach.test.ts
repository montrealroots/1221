/**
 * Brief 20's benefits area: the tax rows the record called unreachable, read again against the career brief 19 brought
 * (docs/verification/audit-2026-10-21/criteria.md M2, D1). The record said every life studies, works and files from New
 * Haven, so Connecticut was the only state a return could owe. A graduate's work is in New York (every project's town is
 * there, `content/careerwork.ts`), and the return taxes it there as a nonresident's, with what New York withheld credited
 * against it (`figuresFor`). New York's tax on the year's whole income, in the share earned there, is more than what
 * its payroll withheld on the New York wages alone, so a life that works there owes New York a little at filing.
 *
 * - `tax.catch_up_state_plan`: reached. New York ends a plan only if a missed payment isn't made up by the next due date
 *   (`content/statetax.ts`), so its Catch Up is drawn and pressed in a played life.
 * - `tax.lien_dispute`: reached, wrongly. DEFECT, found here: a lien was "filed in error" where their own return's tax was
 *   no more than the tax paid before it was filed (`lienInError`), whatever penalties and interest it secured. New York
 *   takes a part payment to the tax first, so a graduate who never filed, paid the tax New York assessed and was sent its
 *   tax warrant for the late penalty and interest, then filed her own return, could have the warrant withdrawn as filed in
 *   error. From 2026-10-21 a lien is in error only where their own return, in the assessment's place, left nothing owed
 *   on the year when it was filed (26 CFR 301.6326-1(b)(1): a lien is erroneous where "the tax liability that gave rise
 *   to the lien was satisfied prior to the filing of the notice"; IRC 6665(a)(2): additions to tax and penalties are
 *   treated as tax). The IRS's (`federalLienInError`) the same.
 * - `tax.amend`: not reached. Nothing in a played life changes a filed year's record: a career's pay is the year it's
 *   paid, and the year's return reads nothing that's written after it.
 * - `tax.request_waiver`: not reached. Only Oregon charges the three-year penalty, and no life lives or works there.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York, a graduate of the School in
 * New Haven, played by the clock and the commands a player sends. TEST SETUP (tests/fakes/b20-benefits.ts), as
 * tests/pro-work.test.ts does it: the body kept fed, rested and awake; the graduate made through the School's own
 * Commencement handler; the offer for Winter Ledger standing as casting's draw would make it. Never a return, a balance,
 * a plan or a lien, which are under test.
 *
 * Every figure is worked here from the rule and written as a literal. Winter Ledger's nine weeks at $1,114 in Hudson, New
 * York, $10,026: New York's tax on the year's $10,040.59 of income, with $11.09 of bank interest, in the share earned
 * there, $81.50, against the $81.04 its payroll withheld: $0.46 owed. Its nonresident's return due 15 April 2027.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { PROJECTS } from '@/engine/content/careerwork';
import { STATE_TAX } from '@/engine/content/statetax';
import { stateOf } from '@/engine/systems/earnings';
import { lienDisputeRefusal, lienInError, statePartsOn, stateDueOf, STATE_NOTICE_KIND } from '@/engine/systems/statetax';
import { at, breakTheCd, checkingOf, graduate, intoTheCd, played, reload, tended, titled, worked } from './fakes/b20-benefits';

const SECURED = 'It was filed for tax you owed, so it wasn’t filed in error, and it can’t be withdrawn.';
const r2026 = (sim: Simulation) => sim.player.returns!['2026']!;
const ny = (sim: Simulation) => r2026(sim).stateDue!['us-ny']!;

/** The graduate, Winter Ledger worked and paid in the fall, the clock run to the 2026 return's morning. */
function withNewYorkPay(seed: string): Simulation {
  const sim = graduate(seed);
  worked(sim, 'winter-ledger');
  tended(sim, at(2027, 2, 1, 12));
  const r = r2026(sim);
  expect([r.figures.acting, r.figures.withheld, r.figures.owedTo]).toEqual([10_026_00, 848_03, { irs: 0, states: { 'us-ny': 46 } }]);
  expect(r.figures.states).toEqual([{ state: 'us-ct', tax: 0, credit: 0 }, { state: 'us-ny', tax: 81_50, credit: 0 }]);
  return sim;
}

describe('tax.catch_up_state_plan, reached in a played life', () => {
  it('PLAYER JOURNEY: her 2026 return filed on 1 February 2027 with everything in a CD leaves New York’s $0.46 owed; its plan over one month is approved at once, its 3 March payment missed, and Catch Up, pressed after the CD is broken, pays it and the plan ends paid; her twin who doesn’t catch up has the plan ended on 2 April and collection back at New York’s tax warrant; and six months on the year still can’t be amended, nothing on record having changed', () => {
    const sim = withNewYorkPay('b20-reach-plan');
    intoTheCd(sim);
    expect(sim.must({ kind: 'tax.file', payload: { year: 2026 } })).toEqual({ balance: 46, penalty: 0, paid: false, irs: 0, states: { 'us-ny': 46 } });
    expect(ny(sim).owed).toBe(46);
    expect(sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-ny', months: 1 } })).toEqual({ decideAt: sim.now + 1, monthly: 46, fee: 0, down: 0 });
    sim.advanceTo(sim.now + 60_000);
    const plan = () => sim.player.statePlans!['us-ny']!;
    expect([plan().status, plan().nextDue]).toEqual(['active', at(2027, 2, 1, 12) + 30 * MS_DAY + 1]);
    // One month, said as one (until 2026-10-21 “for 1 months”).
    expect(titled(sim, 'New York DTF Approved Your Plan').map((n) => n.body)).toEqual(['$0.46 a month for 1 month, from March 3, 2027. Collection has stopped, but interest and the late-payment penalty keep adding up.']);
    expect(plan().history.map((h) => h.what)).toContain('Approved: $0.46 a month for 1 month');
    // The payment's day, the bank still empty: missed, and New York gives until the next due date.
    sim.advanceTo(plan().nextDue! + MS_HOUR);
    expect([plan().status, plan().endsBy]).toEqual(['missed', at(2027, 3, 3, 12) + 1 + 30 * MS_DAY]);
    expect(titled(sim, 'New York DTF: A Plan Payment Missed').map((n) => n.body)).toEqual(['Your bank couldn’t pay the plan’s $0.46. Catch up by April 2, 2027 on Papers, under Tax Returns, or the plan ends and collection resumes.']);
    const twin = reload(sim);

    breakTheCd(sim);
    const before = checkingOf(sim).balance;
    expect(sim.must({ kind: 'tax.catch_up_state_plan', payload: { state: 'us-ny' } })).toEqual({ paid: 46 });
    expect(before - checkingOf(sim).balance).toBe(46);
    expect([plan().status, ny(sim).owed]).toEqual(['paid', undefined]);
    expect(ny(sim).payments!.map((p) => [p.amount, p.tax, p.how])).toEqual([[46, 46, 'plan']]);
    expect(sim.execute({ kind: 'tax.catch_up_state_plan', payload: { state: 'us-ny' } }).error).toBe('That plan isn’t behind, so there’s nothing to catch up.');

    // Not caught up: ended on its day, and collection back at the step before a levy, New York's tax warrant 30 days
    // after its due date of 15 April.
    twin.advanceTo(at(2027, 4, 3, 12));
    expect(twin.player.statePlans!['us-ny']!.status).toBe('ended');
    expect(titled(twin, 'New York DTF Ended Your Plan').map((n) => n.body)).toEqual(['You didn’t make up the missed payment in time. Collection resumes on what you owe.']);
    expect(twin.universe.scheduled.filter((i) => i.kind === STATE_NOTICE_KIND && i.status === 'pending').map((i) => [i.at, i.payload.state])).toEqual([[stateDueOf(r2026(twin)) + 30 * MS_DAY, 'us-ny']]);

    // A filed year amended: Amend The Return… is open, and File The Amendment finds nothing on record changed.
    tended(sim, at(2027, 8, 2, 12));
    expect(sim.execute({ kind: 'tax.amend', payload: { year: 2026 } }).error).toBe('Your return as filed matches what’s on record, so there’s nothing to amend.');
  }, 120_000);
});

describe('a state plan in force holds the state’s letters (B3)', () => {
  it('COMPARISON: with New York’s plan for her 2026 balance in force, paid two cents a month, her 2027 return, filed unpaid on 1 February 2028 after Calder Street’s weeks, joins the plan and no bill comes on it; her twin who paid 2026 instead and has no plan is billed 30 days after the 18 April due date', () => {
    const sim = graduate('b20-reach-hold');
    worked(sim, 'winter-ledger');
    played(sim, at(2027, 2, 1, 12));
    intoTheCd(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    expect(ny(sim).owed).toBe(46);
    const twin = reload(sim);
    // Hers: New York's plan over 36 months, two cents a month, the CD broken so each is paid.
    expect(sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-ny', months: 36 } })).toMatchObject({ monthly: 2 });
    sim.advanceTo(sim.now + 60_000);
    breakTheCd(sim);
    // Her twin's: the year paid, no plan.
    breakTheCd(twin);
    twin.must({ kind: 'tax.pay_state', payload: { state: 'us-ny', year: 2026 } });
    for (const s of [sim, twin]) {
      worked(s, 'calder-street', at(2027, 2, 1, 12));
      played(s, at(2028, 2, 1, 12));
      intoTheCd(s);
      s.must({ kind: 'tax.file', payload: { year: 2027 } });
      breakTheCd(s);
    }
    const owed2027 = (s: Simulation) => s.player.returns!['2027']!.stateDue!['us-ny']!.owed!;
    expect(owed2027(sim)).toBeGreaterThan(0);
    expect(owed2027(twin)).toBe(owed2027(sim));
    expect(sim.player.statePlans!['us-ny']!.history.map((h) => h.what)).toContain('A new balance joined the plan');
    for (const s of [sim, twin]) s.advanceTo(at(2028, 6, 1, 12));
    const bills = (s: Simulation) => titled(s, 'A Bill From New York State').filter((n) => n.body.includes('your 2027 New York return')).map((n) => n.at);
    expect(sim.player.statePlans!['us-ny']!.status).toBe('active');
    expect(bills(sim)).toEqual([]);
    expect(bills(twin)).toEqual([at(2028, 4, 18, 23, 59) + 30 * MS_DAY]);
  }, 120_000);
});

describe('tax.lien_dispute: a lien in error is one their own return left nothing owed on (D1)', () => {
  it('DEFECT: never filed, New York assesses her 2026 return on 12 September 2028 at $1.03, she pays its $0.46 of tax, its tax warrant is filed on 17 December for the $0.57 of penalty and interest left, the levy takes it, and her own return filed on 1 March 2029 shows the same $0.46: the warrant secured what she owed, so it isn’t withdrawn as filed in error; until 2026-10-21 it was offered and taken', () => {
    const sim = withNewYorkPay('b20-reach-lien');
    // Never filed. New York's letters a year after its due date, then 30, 30 and 90 days, then its assessment.
    tended(sim, at(2028, 9, 13, 12));
    expect(titled(sim, 'New York Asks For Your Return').map((n) => n.at)).toEqual([stateDueOf(r2026(sim)) + 365 * MS_DAY]);
    // The tax, $0.46; the late-filing penalty past 60 days, New York's least, the tax itself, less the late-payment
    // penalty's 17 months at half a percent ($0.04) beside it, then that late-payment penalty: $0.50; and 9.5% a year,
    // compounded daily, on the tax from the due date, $0.07.
    expect(statePartsOn(ny(sim), stateDueOf(r2026(sim)), sim.now)).toEqual({ tax: 46, penalty: 50, interest: 7 });
    expect(sim.must({ kind: 'tax.pay_state', payload: { state: 'us-ny', year: 2026, amount: 46 } })).toMatchObject({ paid: 46, tax: 46, penalty: 0, interest: 0, owed: 57 });
    // Its bill, its notice and demand, then the warrant, 30 days apart; the levy 30 days after it.
    tended(sim, at(2029, 3, 1, 12));
    const lien = ny(sim).lien!;
    expect([lien.name, lien.status, lien.amount, lien.fee]).toEqual(['New York Tax Warrant', 'released', 57, 0]);
    expect(titled(sim, 'New York Filed A Tax Warrant').map((n) => n.at)).toEqual([lien.filedAt]);
    expect(ny(sim).payments!.map((p) => [p.how, p.tax, p.penalty, p.interest])).toEqual([['payment', 46, 0, 0], ['levy', 0, 50, 7]]);
    // Her own return in the assessment's place: New York's tax as hers, $0.46, so the penalty and interest stand.
    expect(sim.must({ kind: 'tax.file', payload: { year: 2026 } })).toMatchObject({ states: { 'us-ny': 46 } });
    expect(ny(sim).replacedAt).toBe(sim.now);
    expect(lienInError(r2026(sim), 'us-ny')).toBe(false);
    expect(lienDisputeRefusal(r2026(sim), 'us-ny')).toBe(SECURED);
    const still = JSON.stringify([ny(sim), sim.universe.scheduled.filter((i) => i.status === 'pending').length]);
    expect(sim.execute({ kind: 'tax.lien_dispute', payload: { state: 'us-ny', year: 2026 } }).error).toBe(SECURED);
    expect(JSON.stringify([ny(sim), sim.universe.scheduled.filter((i) => i.status === 'pending').length])).toBe(still);
  }, 120_000);
});

describe('tax.request_waiver, not reached', () => {
  it('only Oregon charges the three-year penalty, every project is in New York, and a played life stays where the School is', () => {
    expect(Object.entries(STATE_TAX).filter(([, rules]) => rules.threeYear).map(([state]) => state)).toEqual(['us-or']);
    expect([...new Set(PROJECTS.map((t) => stateOf(t.place.cityId)))]).toEqual(['us-ny']);
    const sim = graduate('b20-reach-oregon');
    worked(sim, 'winter-ledger');
    expect([sim.player.currentLocationId, Object.keys(sim.player.earnings!.years['2026']!.byResidence)]).toEqual(['us-ct-newhaven', ['us-ct-newhaven']]);
  }, 60_000);
});
