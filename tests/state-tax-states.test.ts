/**
 * The states researched in the limitations pass of 2026-10-11 (research-state-tax-collection-2a.json, -2b.json), each by
 * its own numbers; a state's assessment of a return never filed; and a refund from one state paying another's past-due
 * tax under their agreement. Until then Connecticut, New York and California were researched, a state never acted on a
 * return never filed, and a refund paid only its own state's balances.
 *
 * The expected numbers are written from the research, not read from `content/statetax.ts`, so a rule changed there
 * fails here. FIXTURES put a return by hand, due so many days ago, and say so; PLAYER JOURNEYS play a life.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { recordWages } from '@/engine/systems/earnings';
import { CITIES } from '@/engine/content/geography';
import { INCOME_TAX_RULES, applyBrackets } from '@/engine/content/tax';
import { STATE_TAX } from '@/engine/content/statetax';
import { returnsOf, owedToOf, type TaxReturn } from '@/engine/systems/taxreturn';
import { STATE_NONFILER_KIND, STATE_NOTICE_KIND, applyStatePayment, assessStateNonFiler, fileState, payStateRefund, statePartsOn, statePlanRefusal, type StateDue } from '@/engine/systems/statetax';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: RegExp) => sim.universe.notifications.filter((n) => title.test(n.title));
/** FIXTURE: every account of the player's with money in it emptied, by a posting, so the ledger still balances. */
const empty = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };
const T = 1_000_00;
const DAY = MS_DAY;
const MONTH = 30.4375 * DAY;
const near = (a: number, b: number) => expect(Math.abs(a - b), `${a} against ${b}`).toBeLessThanOrEqual(1);

/** FIXTURE: a return due so many days before now, put on the player by hand, its state's side filed now with nothing in the bank. */
function filedLate(sim: Simulation, state: string, lateDays: number, year: number, tax = T): { r: TaxReturn; sd: StateDue } {
  const r = { year, due: sim.now - lateDays * DAY, filedAt: sim.now, figures: { income: 50_000_00, balance: tax } } as unknown as TaxReturn;
  (sim.player.returns ??= {})[String(year)] = r;
  fileState(sim, sim.player, r, state, tax);
  return { r, sd: r.stateDue![state]! };
}

function fresh(seed: string): Simulation {
  const sim = life('us-ct-newhaven', seed);
  empty(sim);
  return sim;
}

describe('each state by its own numbers', () => {
  it('Illinois: 2% late within 30 days, 10% after; interest 7% simple by the day; filing late 2% to $250, beside it', () => {
    const sim = fresh('ss-il');
    const { r, sd } = filedLate(sim, 'us-il', 0, 2001);
    let p = statePartsOn(sd, r.due, r.due + 20 * DAY);
    near(p.penalty, 0.02 * T);
    near(p.interest, T * 0.07 * 20 / 365);
    p = statePartsOn(sd, r.due, r.due + 40 * DAY);
    near(p.penalty, 0.1 * T);
    near(p.interest, T * 0.07 * 40 / 365);
    near(filedLate(sim, 'us-il', 100, 2003).sd.penalty!, 0.02 * T);
    const big = filedLate(sim, 'us-il', 200, 2002, 50_000_00);
    expect(big.sd.penalty).toBe(250_00);
  });

  it('Hawaii: 20% once at sixty days on a return filed on time, none on a late one; 2/3% a month on the tax and the penalties', () => {
    const sim = fresh('ss-hi');
    const { r, sd } = filedLate(sim, 'us-hi', 0, 2001);
    expect(statePartsOn(sd, r.due, r.due + 59 * DAY).penalty).toBe(0);
    near(statePartsOn(sd, r.due, r.due + 61 * DAY).penalty, 0.2 * T);
    // Brought up to sixty-one days, the next month's interest runs on the penalty too.
    const before = statePartsOn(sd, r.due, r.due + 61 * DAY);
    Object.assign(sd, { parts: before, owed: before.tax + before.penalty + before.interest, accruedAt: r.due + 61 * DAY, payLateRate: 0.2, interestMonths: 3 });
    const after = statePartsOn(sd, r.due, r.due + 3 * MONTH + DAY);
    near(after.interest - before.interest, (0.08 / 12) * (T + 0.2 * T));
    // Filed four months late: 5% a month begun, and no 20% beside it.
    const late = filedLate(sim, 'us-hi', 100, 2002);
    near(late.sd.penalty!, 0.05 * 4 * T);
    near(statePartsOn(late.sd, late.r.due, sim.now + 400 * DAY).penalty, 0.2 * T);
  });

  it('Colorado: 5% and a half a month after, to 12%, at least $5; 8% interest, 11% thirty days past its first notice unless a plan was asked for', () => {
    const sim = fresh('ss-co');
    const { r, sd } = filedLate(sim, 'us-co', 0, 2001);
    near(statePartsOn(sd, r.due, r.due + DAY).penalty, 0.05 * T);
    near(statePartsOn(sd, r.due, r.due + 2 * MONTH - DAY).penalty, 0.055 * T);
    near(statePartsOn(sd, r.due, r.due + 30 * MONTH).penalty, 0.12 * T);
    const small = filedLate(sim, 'us-co', 0, 2002, 20_00);
    expect(statePartsOn(small.sd, small.r.due, small.r.due + DAY).penalty).toBe(5_00);
    // FIXTURE: its first notice on the due date.
    sd.noticedAt = r.due;
    near(statePartsOn(sd, r.due, r.due + 60 * DAY).interest, T * (0.08 * 30 + 0.11 * 30) / 365);
    sd.planAskedAt = r.due + 10 * DAY;
    near(statePartsOn(sd, r.due, r.due + 60 * DAY).interest, T * 0.08 * 60 / 365);
  });

  it('Oregon: 5% once, 20% more past three months late; 8% interest, 12% sixty days past the assessment, plan or not; penalty first', () => {
    const sim = fresh('ss-or');
    expect(filedLate(sim, 'us-or', 85, 2001).sd.penalty).toBe(0);
    const { r, sd } = filedLate(sim, 'us-or', 100, 2002);
    near(sd.penalty!, 0.2 * T);
    near(statePartsOn(sd, r.due, sim.now).penalty, 0.25 * T);
    sd.noticedAt = sim.now;
    sd.planAskedAt = sim.now;
    const p = statePartsOn(sd, r.due, sim.now + 90 * DAY);
    near(p.interest - statePartsOn(sd, r.due, sim.now).interest, T * (0.08 * 60 + 0.12 * 30) / 365);
  });

  it('Arizona: 0.5% a month to 10%, 4.5% a month filing late, the two held to 25%; interest added to the principal each January', () => {
    const sim = fresh('ss-az');
    const { r, sd } = filedLate(sim, 'us-az', 400, 2001);
    // Fourteen months begun: filing late 25% would pass the cap with 7% of late payment, so it's 18%; then late payment
    // stops at 7%, the two at 25%.
    near(sd.penalty!, 0.18 * T);
    near(statePartsOn(sd, r.due, sim.now + 900 * DAY).penalty, 0.25 * T);
    // Interest from the due date, simple through each year, the year's added on 1 January.
    const fresh2 = filedLate(sim, 'us-az', 0, 2002);
    const due = fresh2.r.due;
    const jan = (y: number) => Date.parse(`${y}-01-01T05:00:00Z`);
    const y0 = new Date(due).getUTCFullYear();
    const to = jan(y0 + 2) + 30 * DAY;
    const i1 = T * 0.07 * (jan(y0 + 1) - due) / DAY / 365;
    const i2 = (T + i1) * 0.07 * (jan(y0 + 2) - jan(y0 + 1)) / DAY / 365;
    const i3 = (T + i1 + i2) * 0.07 * 30 / 365;
    near(statePartsOn(fresh2.sd, due, to).interest, i1 + i2 + i3);
  });

  it('Georgia, Louisiana: the two penalties held to 25%; Louisiana’s filing penalty only past its six-month extension', () => {
    const sim = fresh('ss-ga');
    const ga = filedLate(sim, 'us-ga', 200, 2001);
    near(statePartsOn(ga.sd, ga.r.due, sim.now + 900 * DAY).penalty, 0.25 * T);
    near(ga.sd.penalty!, 0.25 * T - 0.005 * 7 * T);
    const la4 = filedLate(sim, 'us-la', 100, 2002);
    expect(la4.sd.penalty).toBe(0);
    const la8 = filedLate(sim, 'us-la', 230, 2003);
    near(la8.sd.penalty!, 0.25 * T - 0.005 * 8 * T);
    near(statePartsOn(la8.sd, la8.r.due, sim.now + 900 * DAY).penalty, 0.25 * T);
  });

  it('Massachusetts, North Carolina: filing late beside paying late, each to its own cap; New Mexico’s one penalty', () => {
    const sim = fresh('ss-ma');
    const ma = filedLate(sim, 'us-ma', 100, 2001);
    near(ma.sd.penalty!, 0.04 * T);
    near(statePartsOn(ma.sd, ma.r.due, sim.now).penalty, 0.08 * T);
    near(statePartsOn(ma.sd, ma.r.due, sim.now + 900 * DAY).penalty, 0.29 * T);
    const nc = filedLate(sim, 'us-nc', 100, 2002);
    near(statePartsOn(nc.sd, nc.r.due, sim.now).penalty, 0.05 * 4 * T + 0.05 * T);
    near(statePartsOn(nc.sd, nc.r.due, sim.now + 900 * DAY).penalty, 0.2 * T + 0.05 * T);
    const nm = filedLate(sim, 'us-nm', 100, 2003);
    expect(nm.sd.penalty).toBe(0);
    near(statePartsOn(nm.sd, nm.r.due, sim.now).penalty, 0.08 * T);
    near(statePartsOn(nm.sd, nm.r.due, sim.now + 900 * DAY).penalty, 0.2 * T);
  });

  it('Pennsylvania: 5% once, 5% a month filing late beside it to 25%, at least $5; 7% simple; the tax, then interest, then penalties', () => {
    const sim = fresh('ss-pa');
    const { r, sd } = filedLate(sim, 'us-pa', 0, 2001);
    near(statePartsOn(sd, r.due, r.due + DAY).penalty, 0.05 * T);
    near(statePartsOn(sd, r.due, r.due + 100 * DAY).interest, T * 0.07 * 100 / 365);
    const late = filedLate(sim, 'us-pa', 100, 2002);
    near(late.sd.penalty!, 0.2 * T);
    expect(filedLate(sim, 'us-pa', 10, 2003, 50_00).sd.penalty).toBe(5_00);
    // A part paid goes to the tax, then the interest, then the penalties.
    expect(applyStatePayment(sim, sim.player, late.r, 'us-pa', T + 10_00, 'payment')).toEqual({ tax: T, interest: 10_00, penalty: 0 });
  });

  it('Ohio: filing late the greater of $50 a month to $500 and 5% a month to half; its plan only with the Attorney General', () => {
    const sim = fresh('ss-oh');
    // $1,000 four months late: 20% is $200, $50 a month $200 too; $100 of tax: $200, not $20.
    near(filedLate(sim, 'us-oh', 100, 2001).sd.penalty!, 200_00);
    expect(filedLate(sim, 'us-oh', 100, 2002, 100_00).sd.penalty).toBe(200_00);
    expect(filedLate(sim, 'us-oh', 400, 2003, 100_00).sd.penalty).toBe(500_00);
    // Twice the interest, 14% a year, a month or part at a time.
    const { r, sd } = filedLate(sim, 'us-oh', 0, 2004);
    near(statePartsOn(sd, r.due, r.due + 3 * MONTH - DAY).penalty, 3 * (0.14 / 12) * T);
    expect(statePlanRefusal(sim, sim.player, 'us-oh', 6)).toMatch(/Ohio Attorney General does, once the debt is sent there/);
    // FIXTURE: certified to the Attorney General: the plan is offered, and interest runs on the penalties.
    for (const x of Object.values(sim.player.returns!)) if (x.stateDue?.['us-oh']) x.stateDue['us-oh'].collection = 5;
    expect(statePlanRefusal(sim, sim.player, 'us-oh', 6)).toBeUndefined();
    const before = statePartsOn(sd, r.due, r.due + 30 * DAY);
    Object.assign(sd, { parts: before, owed: before.tax + before.penalty + before.interest, accruedAt: r.due + 30 * DAY, payLateRate: 0.14 / 12 });
    near(statePartsOn(sd, r.due, r.due + 60 * DAY).interest - before.interest, (T + before.penalty) * 0.07 * 30 / 365);
  });

  it('every state a city puts a life in, with an income tax, is researched', () => {
    // A state's own rule that takes something of $50,000: Texas's, Florida's and the others with none take nothing.
    const taxed = new Set(INCOME_TAX_RULES.filter((x) => /^US-[A-Z]{2}$/.test(x.jurisdictionCode) && applyBrackets(50_000_00, x) > 0).map((x) => x.jurisdictionCode.toLowerCase()));
    // Connecticut's is computed apart from the table (`connecticutTax`).
    taxed.add('us-ct');
    const reached = new Set((CITIES.all() as { parentId?: string }[]).map((c) => c.parentId ?? '').filter((s) => taxed.has(s)));
    expect([...reached].sort()).toEqual(['us-az', 'us-ca', 'us-co', 'us-ct', 'us-ga', 'us-hi', 'us-il', 'us-la', 'us-ma', 'us-nc', 'us-nm', 'us-ny', 'us-oh', 'us-or', 'us-pa']);
    for (const s of reached) expect(STATE_TAX[s as keyof typeof STATE_TAX], s).toBeDefined();
  });

  it('plans by each state’s terms: Georgia’s $25 a month, Hawaii’s over $100, Illinois to $15,000, New Mexico to twelve months', () => {
    const sim = fresh('ss-plan');
    filedLate(sim, 'us-ga', 0, 2001, 300_00);
    expect(statePlanRefusal(sim, sim.player, 'us-ga', 24)).toMatch(/at least \$25 a month/);
    expect(statePlanRefusal(sim, sim.player, 'us-ga', 12)).toBeUndefined();
    filedLate(sim, 'us-hi', 0, 2002, 90_00);
    expect(statePlanRefusal(sim, sim.player, 'us-hi', 6)).toMatch(/more than \$100/);
    filedLate(sim, 'us-il', 0, 2003, 16_000_00);
    expect(statePlanRefusal(sim, sim.player, 'us-il', 24)).toMatch(/\$15,000 or less.*financial statement/);
    filedLate(sim, 'us-nm', 0, 2004, 500_00);
    expect(statePlanRefusal(sim, sim.player, 'us-nm', 13)).toMatch(/1 to 12 months/);
  });
});

describe('collection by each state’s steps', () => {
  it('PLAYER JOURNEY: Georgia’s notices, the 20% fee with its execution, then its levy, in a played year', () => {
    const sim = life('us-ga-atlanta', 'ss-ga-play');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    play(sim, at(2027, 2, 1, 12));
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const r = () => returnsOf(sim.player)['2026']!;
    expect(r().stateDue!['us-ga']!.owed).toBeGreaterThan(0);
    play(sim, at(2027, 7, 1));
    const ga = r().stateDue!['us-ga']!;
    expect(titled(sim, /Georgia Issued A State Tax Execution/)).toHaveLength(1);
    expect(titled(sim, /Georgia Issued A State Tax Execution/)[0]!.body).toMatch(/The Collection Fee With The Execution, 20%, \$[\d,.]+, is added/);
    expect(ga.collection).toBeGreaterThanOrEqual(3);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});

describe('a return never filed', () => {
  it('PLAYER JOURNEY: Connecticut makes it three months on, assesses it sixty days later at 10% or $50, collects it; their own replaces it', () => {
    let sim = life('us-ct-newhaven', 'ss-nf-ct');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 30_000_00 });
    play(sim, at(2027, 2, 1, 12));
    empty(sim);
    const owed = () => owedToOf(sim.player, returnsOf(sim.player)['2026']!).states['us-ct'] ?? 0;
    expect(owed()).toBeGreaterThan(0);
    // Not filed: the IRS's substitute a year on, and Connecticut's own letter after three months.
    play(sim, at(2027, 7, 20));
    expect(titled(sim, /Connecticut DRS Made Your Return/)).toHaveLength(1);
    expect(returnsOf(sim.player)['2026']!.stateDue?.['us-ct']?.filedAt).toBeUndefined();
    sim = reload(sim);
    play(sim, at(2027, 9, 20));
    const r = returnsOf(sim.player)['2026']!;
    const sd = r.stateDue!['us-ct']!;
    expect(sd.assessedBy).toBeDefined();
    expect(sd.balance).toBe(owed());
    expect(sd.parts!.penalty).toBe(Math.max(50_00, Math.round(0.1 * sd.balance)));
    expect(titled(sim, /Connecticut DRS Assessed Your 2026 Return/).map((n) => n.body)).toEqual([expect.stringContaining(', and The Penalty For A Return DRS Made, 10% Or $50, The Greater. File your own')]);
    expect(sim.universe.scheduled.some((i) => i.kind === STATE_NOTICE_KIND && i.status === 'pending' && i.payload.state === 'us-ct')).toBe(true);
    // Their own, filed now: it takes the assessment's place, its charges in proportion; nothing assessed twice.
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const after = returnsOf(sim.player)['2026']!.stateDue!['us-ct']!;
    expect(after.replacedAt).toBe(sim.now);
    expect(titled(sim, /Replaces Connecticut’s Assessment/)).toHaveLength(1);
    expect(sim.universe.scheduled.some((i) => i.kind === STATE_NONFILER_KIND && i.status === 'pending')).toBe(false);
    expect(sim.ledger.audit()).toEqual([]);
  }, 180_000);

  it('PLAYER JOURNEY: filed after Connecticut’s letter and before its assessment, the letter’s sixty days come to nothing', () => {
    const sim = life('us-ct-newhaven', 'ss-nf-ct2');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 30_000_00 });
    play(sim, at(2027, 7, 20));
    expect(titled(sim, /Connecticut DRS Made Your Return/)).toHaveLength(1);
    expect(sim.universe.scheduled.some((i) => i.kind === STATE_NONFILER_KIND && i.status === 'pending')).toBe(true);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    // Off the calendar at once, not left to find the return filed when it comes.
    expect(sim.universe.scheduled.some((i) => i.kind === STATE_NONFILER_KIND && i.status === 'pending')).toBe(false);
    play(sim, at(2027, 10, 1));
    expect(returnsOf(sim.player)['2026']!.stateDue?.['us-ct']?.assessedBy).toBeUndefined();
    expect(titled(sim, /Connecticut DRS Assessed/)).toHaveLength(0);
  }, 180_000);

  it('California’s assessment adds its 25% demand penalty and its $143 fee to the late penalties; a filed return stops the letters', () => {
    const sim = fresh('ss-nf-ca');
    const r = { year: 2001, due: sim.now - 500 * DAY, figures: { income: 50_000_00, balance: T } } as unknown as TaxReturn;
    (sim.player.returns ??= {})['2001'] = r;
    assessStateNonFiler(sim, sim.player, r, 'us-ca', T);
    const sd = r.stateDue!['us-ca']!;
    expect(sd.assessedBy).toBeDefined();
    // Late filing past five months, 25%, the larger of it and late payment's 5% and 0.5% a month (17 months begun, 13.5%):
    // 11.5% beside it; then the demand penalty and the fee.
    near(sd.penalty!, 0.115 * T + 0.25 * T + 143_00);
  });
});

describe('a refund from one state to another’s past-due tax', () => {
  it('California’s refund pays New York’s balance once New York has sent a notice; Georgia’s, with no agreement, doesn’t', () => {
    const sim = fresh('ss-offset');
    const ny = filedLate(sim, 'us-ny', 0, 2001, 400_00);
    // FIXTURE: refunds due from California and Georgia on another year.
    const r = { year: 2002, due: sim.now - 10 * DAY, figures: { income: 50_000_00, balance: 0 } } as unknown as TaxReturn;
    sim.player.returns!['2002'] = r;
    r.stateDue = { 'us-ca': { state: 'us-ca', balance: -300_00, refund: 300_00 }, 'us-ga': { state: 'us-ga', balance: -300_00, refund: 300_00 } };
    // No notice from New York yet: not past due, nothing taken.
    payStateRefund(sim, sim.player, r, 'us-ca');
    expect(ny.sd.payments ?? []).toHaveLength(0);
    // Noticed, the next refund from California pays it; Georgia's never does.
    r.stateDue['us-ca']!.refundedAt = undefined;
    ny.sd.collection = 1;
    payStateRefund(sim, sim.player, r, 'us-ga');
    expect(ny.sd.payments ?? []).toHaveLength(0);
    payStateRefund(sim, sim.player, r, 'us-ca');
    expect(ny.sd.payments!.map((p) => [p.how, p.amount])).toEqual([['refund offset', 300_00]]);
    expect(titled(sim, /Your California Refund Went To New York/)).toHaveLength(1);
    expect(sim.ledger.audit()).toEqual([]);
  });
});
