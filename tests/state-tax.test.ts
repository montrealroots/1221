/**
 * Federal and state income tax kept apart (from the integration pass of 2026-10-10; content/statetax.ts,
 * systems/statetax.ts). Each authority's assessed tax, outstanding parts, payments, notices, refunds and plan are its
 * own, by its own researched rules. PLAYER JOURNEYS play through commands; FIXTURES set a state by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { computeAnnualTax } from '@/engine/content/tax';
import { YALE_DRAMA } from '@/engine/content/school';
import { STATE_TAX, STATE_UNRESEARCHED } from '@/engine/content/statetax';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { troubles } from '@/engine/systems/spending';
import { connecticutTax, TAX_REFUND_KIND, owedAll, owedEverywhere, owedOn, returnsOf, withholdingSplit } from '@/engine/systems/taxreturn';
import { STATE_NOTICE_KIND, federalOffsetToState, owedToState, statePartsOn, statePlanRefusal } from '@/engine/systems/statetax';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** FIXTURE: every account of the player's with money in it emptied, by a posting, so the ledger still balances. */
const empty = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });

/** A 2026 return filed on 1 February with nothing in the bank: each authority's part owed. */
function owing(city: string, seed: string, gross = 40_000_00): Simulation {
  const sim = life(city, seed);
  recordWages(sim.player, at(2026, 5, 1), NY, { gross });
  play(sim, at(2027, 2, 1, 12));
  empty(sim);
  sim.must({ kind: 'tax.file', payload: { year: 2026 } });
  return sim;
}

describe('who is owed', () => {
  it('splits a Connecticut year: the IRS’s part and Connecticut’s, summing to the balance, the withholding each one’s', () => {
    const sim = life('us-ct-newhaven', 'st-split');
    // A paycheck as the Summer Cabaret's withholds: the IRS's and Connecticut's, each kept.
    const t = computeAnnualTax(30_000_00, YALE_DRAMA.cityId, at(2026, 7, 1), { currency: 'USD' });
    const ct = connecticutTax(30_000_00);
    recordWages(sim.player, at(2026, 7, 1), NY, { gross: 30_000_00, withheld: t.total + ct, withheldBy: { 'us-ct': ct }, employer: 'yale-summer-cabaret' });
    play(sim, at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    const to = r.figures.owedTo!;
    expect(to.irs + Object.values(to.states).reduce((a, b) => a + b, 0)).toBe(r.figures.balance);
    expect(yearOf(sim.player, 2026).withheldBy).toEqual({ us: t.total, 'us-ct': ct });
    expect(to.derived).toBeUndefined();
    // Connecticut withheld about what it taxes: its part of the return is small, either way.
    expect(Math.abs(to.states['us-ct'] ?? 0)).toBeLessThan(ct / 2);
    // A year paid before the withholding was kept by authority: divided by the calculation that withheld it then, whose
    // table had no Connecticut tax: all of it the IRS's, as it was, and said to be derived.
    delete yearOf(sim.player, 2026).withheldBy;
    yearOf(sim.player, 2026).withheld = t.total;
    const split = withholdingSplit(sim.player, 2026);
    expect(split.derived).toBe(true);
    expect(split.by).toEqual({ us: t.total });
  });

  it('PLAYER JOURNEY: an IRS plan covers federal tax only; Connecticut’s stays Connecticut’s, collected by its own notices', () => {
    const sim = owing('us-ct-newhaven', 'st-plan');
    const r = returnsOf(sim.player)['2026']!;
    const ct = r.stateDue!['us-ct']!;
    expect(ct.owed).toBe(r.figures.owedTo!.states['us-ct']);
    expect(r.owed).toBe(r.figures.owedTo!.irs);
    fund(sim, 200_00);
    sim.must({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: 300_00 } });
    play(sim, sim.now + MS_HOUR);
    expect(sim.player.taxPlan!.status).toBe('active');
    // Found by mutation (integration pass): compared with owedAll, which was what changed, this proved nothing. The
    // IRS's own balance on the return, nothing of Connecticut's in it.
    expect(sim.player.taxPlan!.covers).toBe(owedOn(r, sim.player.taxPlan!.appliedAt));
    expect(sim.player.taxPlan!.covers).toBe(owedAll(sim.player, sim.player.taxPlan!.appliedAt));
    expect(sim.player.taxPlan!.covers).toBeLessThan(owedEverywhere(sim.player, sim.player.taxPlan!.appliedAt));
    // Connecticut's bill comes on its own calendar, the IRS plan notwithstanding.
    play(sim, sim.now + 32 * MS_DAY);
    expect(titled(sim, 'A Bill From Connecticut DRS')).toHaveLength(1);
    expect(sim.ledger.audit()).toEqual([]);
  }, 60_000);
});

describe('each state by its own rules', () => {
  it('Connecticut: 10% once past the due date, 1% a month simple on the tax, a payment to the penalty first', () => {
    const sim = owing('us-ct-newhaven', 'st-ct');
    const r = returnsOf(sim.player)['2026']!;
    const sd = r.stateDue!['us-ct']!;
    const tax = sd.parts!.tax;
    // Filed early: nothing before 15 April.
    expect(statePartsOn(sd, r.due, r.due - MS_DAY)).toEqual({ tax, penalty: 0, interest: 0 });
    // The parts rounded so they sum to the whole rounded once: a cent may move between penalty and interest.
    const first = statePartsOn(sd, r.due, r.due + MS_DAY);
    expect(first.penalty).toBe(Math.round(0.1 * tax));
    expect(Math.abs(first.interest - 0.01 * tax)).toBeLessThanOrEqual(1);
    // Two months begun: 2% simple, the penalty still 10%.
    const two = statePartsOn(sd, r.due, r.due + 40 * MS_DAY);
    expect(two.penalty).toBe(Math.round(0.1 * tax));
    expect(Math.abs(two.interest - 0.02 * tax)).toBeLessThanOrEqual(1);
    play(sim, r.due + 40 * MS_DAY);
    fund(sim, 50_00);
    const paid = sim.must<{ tax: number; penalty: number; interest: number }>({ kind: 'tax.pay_state', payload: { state: 'us-ct', year: 2026, amount: 50_00 } });
    expect(paid).toMatchObject({ paid: 50_00, tax: 0, penalty: 50_00, interest: 0 });
    expect(STATE_TAX['us-ct'].orderAssumed).toBe(false);
  }, 60_000);

  it('New York: half a percent a month and 9.5% a year from the due date; a missed plan payment made up by the next due date, then ended', () => {
    const sim = owing('us-ny-newyork', 'st-ny');
    const r = returnsOf(sim.player)['2026']!;
    const sd = r.stateDue!['us-ny']!;
    const tax = sd.parts!.tax;
    const p = statePartsOn(sd, r.due, r.due + 45 * MS_DAY);
    expect(p.penalty).toBe(Math.round(0.01 * tax));
    expect(p.interest).toBeCloseTo(tax * ((1 + 0.095 / 365) ** 45 - 1), -1);
    // An installment payment agreement: 36 months at most, $20,000 at most.
    // What the budget sets aside is what the screens say is owed, with today's interest and penalty (acceptance pass).
    play(sim, r.due + 45 * MS_DAY);
    expect(troubles(sim, sim.player).find((t) => t.kind === 'tax')!.amount).toBe(owedEverywhere(sim.player, sim.now));
    expect(owedEverywhere(sim.player, sim.now)).toBeGreaterThan((r.owed ?? 0) + (sd.owed ?? 0));
    expect(statePlanRefusal(sim, sim.player, 'us-ny', 48)).toMatch(/1 to 36 months/);
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-ny', months: 12 } });
    play(sim, sim.now + MS_HOUR);
    expect(sim.player.statePlans!['us-ny']!.status).toBe('active');
    // The first payment missed: a default only if not made up by the next due date.
    play(sim, sim.now + 31 * MS_DAY);
    expect(sim.player.statePlans!['us-ny']!.status).toBe('missed');
    fund(sim, 5_000_00);
    sim.must({ kind: 'tax.catch_up_state_plan', payload: { state: 'us-ny' } });
    expect(sim.player.statePlans!['us-ny']!.status).toBe('active');
    empty(sim);
    play(sim, sim.now + 31 * MS_DAY);
    play(sim, sim.now + 31 * MS_DAY);
    expect(sim.player.statePlans!['us-ny']!.status).toBe('ended');
    expect(sim.universe.scheduled.some((i) => i.kind === STATE_NOTICE_KIND && i.status === 'pending' && i.payload.state === 'us-ny')).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  }, 60_000);

  it('California: 5% and half a percent a month; a plan’s $34 added to the balance; a new balance defaults it; a levy’s $362', () => {
    const sim = owing('us-ca-losangeles', 'st-ca');
    const r = returnsOf(sim.player)['2026']!;
    const sd = r.stateDue!['us-ca']!;
    const tax = sd.parts!.tax;
    expect(statePartsOn(sd, r.due, r.due + 45 * MS_DAY).penalty).toBe(Math.round(0.06 * tax));
    const before = owedToState(sim.player, 'us-ca', sim.now);
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-ca', months: 24 } });
    play(sim, sim.now + 3 * MS_DAY);
    expect(sim.player.statePlans!['us-ca']!.status).toBe('active');
    expect(owedToState(sim.player, 'us-ca', sim.now)).toBe(before + 34_00);
    // FIXTURE: a corrected W-2 with more wages, amended: California's terms make a new liability a default.
    yearOf(sim.player, 2026).acting += 5_000_00;
    const a = sim.must<{ processAt: number }>({ kind: 'tax.amend', payload: { year: 2026 } });
    fund(sim, 2_000_00);
    play(sim, a.processAt + MS_HOUR);
    expect(sim.player.statePlans!['us-ca']!.status).toBe('missed');
    expect(titled(sim, 'California FTB: Intent To Terminate Your Plan').length).toBeGreaterThanOrEqual(1);
  }, 60_000);

  it('California levies after its three notices, its collection fee with it', () => {
    const sim = owing('us-ca-losangeles', 'st-ca-levy');
    const filed = sim.now;
    for (let d = 0; d < 3 * 35 + 2; d += 1) { empty(sim); play(sim, filed + (d + 1) * MS_DAY); }
    expect(titled(sim, 'California’s Final Notice Before Levy')).toHaveLength(1);
    fund(sim, 1_000_000_00);
    play(sim, filed + (3 * 35 + 32) * MS_DAY);
    expect(titled(sim, 'California Ordered Your Bank To Pay')).toHaveLength(1);
    expect(titled(sim, 'California Ordered Your Bank To Pay')[0]!.body).toContain('$362.00 collection fee');
    const levy = sim.universe.transactions.find((t) => t.memo === 'California FTB levy, 2026 return')!;
    expect(levy).toBeDefined();
    expect(returnsOf(sim.player)['2026']!.stateDue!['us-ca']!.payments!.some((p) => p.how === 'levy')).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  }, 60_000);

  it('a state SLATE hasn’t researched keeps its balance with nothing added, and says so rather than take the IRS’s rules', () => {
    const sim = owing('us-il-chicago', 'st-il');
    const r = returnsOf(sim.player)['2026']!;
    const sd = r.stateDue!['us-il']!;
    expect(sd.owed).toBeGreaterThan(0);
    expect(statePartsOn(sd, r.due, r.due + 400 * MS_DAY)).toEqual(sd.parts);
    expect(statePlanRefusal(sim, sim.player, 'us-il', 12)).toBe(STATE_UNRESEARCHED);
    expect(sim.universe.scheduled.some((i) => i.kind === STATE_NOTICE_KIND && i.payload.state === 'us-il')).toBe(false);
  }, 60_000);
});

describe('refunds', () => {
  it('a state’s refund pays what’s owed to it for another year first; the IRS’s goes to that state’s past-due tax only after its notice', () => {
    const sim = owing('us-ct-newhaven', 'st-refunds');
    const r26 = returnsOf(sim.player)['2026']!;
    // FIXTURE: 2027's paychecks over-withheld, the IRS's and Connecticut's both, so each refunds.
    recordWages(sim.player, at(2027, 5, 1), NY, { gross: 10_000_00, withheld: 6_000_00, withheldBy: { 'us-ct': 2_000_00 } });
    play(sim, r26.due + 40 * MS_DAY);
    expect(titled(sim, 'A Bill From Connecticut DRS')).toHaveLength(1);
    const owedBefore = owedToState(sim.player, 'us-ct', at(2028, 2, 1, 12));
    play(sim, at(2028, 2, 1, 12));
    fund(sim, 10_00);
    sim.must({ kind: 'tax.file', payload: { year: 2027 } });
    const r27 = returnsOf(sim.player)['2027']!;
    expect(r27.stateDue!['us-ct']!.refund).toBeGreaterThan(0);
    expect(r27.refund).toBeGreaterThan(0);
    play(sim, sim.now + 22 * MS_DAY);
    expect(titled(sim, 'Your Connecticut Refund Went To What You Owe It')).toHaveLength(1);
    expect(sim.universe.transactions.some((t) => t.memo === 'Federal refund, 2027, sent to Connecticut DRS') || owedToState(sim.player, 'us-ct', sim.now) === 0).toBe(true);
    expect(owedToState(sim.player, 'us-ct', sim.now)).toBeLessThan(owedBefore);
    // Fired again, a refund pays nothing more.
    const count = sim.universe.transactions.filter((t) => /refund/i.test(t.memo)).length;
    sim.schedule({ at: sim.now + MS_HOUR, kind: TAX_REFUND_KIND, label: 'Again', category: 'system', priority: 20, payload: { personId: sim.player.id, year: 2027 } });
    sim.schedule({ at: sim.now + MS_HOUR, kind: TAX_REFUND_KIND, label: 'Again', category: 'system', priority: 20, payload: { personId: sim.player.id, year: 2027, state: 'us-ct' } });
    play(sim, sim.now + 2 * MS_HOUR);
    expect(sim.universe.transactions.filter((t) => /refund/i.test(t.memo)).length).toBe(count);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});

describe('a federal refund and a state’s debt', () => {
  it('isn’t sent to a state that hasn’t sent its notice yet: a debt isn’t past due before it’s billed', () => {
    // Found by mutation (integration pass): nothing tested a federal refund before the state's first notice.
    const sim = owing('us-ct-newhaven', 'st-no-notice');
    const r26 = returnsOf(sim.player)['2026']!;
    expect(r26.stateDue!['us-ct']!.collection ?? 0).toBe(0);
    const before = owedToState(sim.player, 'us-ct', sim.now);
    expect(federalOffsetToState(sim, sim.player, 'us-ct', 500_00, 2027)).toBe(0);
    expect(owedToState(sim.player, 'us-ct', sim.now)).toBe(before);
    // Billed, it is.
    play(sim, sim.now + 32 * MS_DAY);
    expect(r26.stateDue!['us-ct']!.collection).toBe(1);
    expect(federalOffsetToState(sim, sim.player, 'us-ct', 500_00, 2027)).toBe(500_00);
    expect(sim.ledger.audit()).toEqual([]);
  }, 60_000);
});

describe('a save from before the split', () => {
  it('divides a combined balance between the IRS and the state to the cent, once, and an IRS plan keeps federal tax only', () => {
    let sim = owing('us-ny-newyork', 'st-migrate');
    const r = () => returnsOf(sim.player)['2026']!;
    // FIXTURE: the return as a save from before kept it, one balance, its parts summed, no state side, no split.
    const ny = r().stateDue!['us-ny']!;
    const combined = { tax: r().parts!.tax + ny.parts!.tax, penalty: r().parts!.penalty + ny.parts!.penalty, interest: r().parts!.interest + ny.parts!.interest };
    Object.assign(r(), { parts: combined, owed: combined.tax + combined.penalty + combined.interest, base: combined.tax });
    delete r().stateDue;
    delete r().figures.owedTo;
    for (const i of sim.universe.scheduled) if (i.kind === STATE_NOTICE_KIND && i.status === 'pending') sim.timeline.cancel(i.id, sim.now);
    const total = r().owed!;
    const ledger = JSON.stringify(sim.ledger.audit());
    sim = reload(sim);
    expect(r().split).toBeDefined();
    expect(r().split!.how).toMatch(/in proportion/);
    const nyNow = r().stateDue!['us-ny']!;
    expect(r().owed! + nyNow.owed!).toBe(total);
    expect(nyNow.migrated).toBeDefined();
    expect(sim.universe.scheduled.some((i) => i.kind === STATE_NOTICE_KIND && i.status === 'pending')).toBe(true);
    expect(JSON.stringify(sim.ledger.audit())).toBe(ledger);
    // Opened again: nothing divided twice.
    const once = JSON.stringify(r());
    sim = reload(sim);
    expect(JSON.stringify(r())).toBe(once);
  }, 60_000);
});

describe('time, commands and reloads', () => {
  it('charges the same across the due date whether the save is reopened or not, and refuses paying a state more than it’s owed', () => {
    const a = owing('us-ny-newyork', 'st-reload');
    const b = reload(a);
    const due = returnsOf(a.player)['2026']!.due;
    play(a, due + 40 * MS_DAY);
    play(b, due - MS_DAY);
    const c = reload(b);
    play(c, due + 40 * MS_DAY);
    expect(owedToState(c.player, 'us-ny', c.now)).toBe(owedToState(a.player, 'us-ny', a.now));
    const owed = owedToState(a.player, 'us-ny', a.now);
    fund(a, owed + 20_000_00);
    expect(a.execute({ kind: 'tax.pay_state', payload: { state: 'us-ny', year: 2026, amount: owed + 1 } }).error).toMatch(/pay that or less/);
    a.must({ kind: 'tax.pay_state', payload: { state: 'us-ny', year: 2026 } });
    expect(a.execute({ kind: 'tax.pay_state', payload: { state: 'us-ny', year: 2026 } }).error).toMatch(/owe New York DTF nothing/);
    expect(a.universe.scheduled.some((i) => i.kind === STATE_NOTICE_KIND && i.status === 'pending' && i.payload.state === 'us-ny')).toBe(false);
  }, 60_000);
});
