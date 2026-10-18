/**
 * Liens, the longer payment arrangements, Oregon's three-year penalty and Massachusetts's discretion (remaining-gaps
 * pass, 2026-10-11; research-state-tax-liens-a.json, -b.json, research-federal-tax-lien.json,
 * research-state-tax-arrangements.json). Each lifecycle is played through its commands and the calendar: filed, paid,
 * released; asked for and released; filed in error and withdrawn; under a plan, not filed. Expected amounts are the
 * researched figures, written out. FIXTURES put a return on by hand, due some days ago, and say so.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { recordWages } from '@/engine/systems/earnings';
import { returnsOf, unassessedBalance, type TaxReturn } from '@/engine/systems/taxreturn';
import { troubles } from '@/engine/systems/spending';
import { STATE_LIEN_KIND, assessStateNonFiler, fileState, fileStateLien, lienDisputeRefusal, lienReleaseRefusal, reconsiderState, statePlanRefusal, threeYearCheck, waiverRefusal } from '@/engine/systems/statetax';
import { STATE_TAX } from '@/engine/content/statetax';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const DAY = MS_DAY;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const empty = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === kind && i.payload.personId === sim.player.id);

/** FIXTURE: a return due `lateDays` ago, its state's side filed now with nothing in the bank. */
function owing(sim: Simulation, state: string, tax: number, year: number, lateDays = 1): TaxReturn {
  const r = { year, due: sim.now - lateDays * DAY, filedAt: sim.now, figures: { income: 50_000_00, balance: tax } } as unknown as TaxReturn;
  (sim.player.returns ??= {})[String(year)] = r;
  fileState(sim, sim.player, r, state, tax);
  return r;
}
function fresh(seed: string, city = 'us-ct-newhaven'): Simulation { const sim = life(city, seed); empty(sim); return sim; }

describe('a state lien’s lifecycle', () => {
  it('California: its notice of intent, the lien thirty days on with its $10 fee, paid, released 40 days later', () => {
    const sim = fresh('lien-ca');
    const r = owing(sim, 'us-ca', 1_000_00, 2001);
    const sd = () => r.stateDue!['us-ca']!;
    // Three notices 35 days apart; the intent with the third (FTB 4966).
    sim.advanceTo(sim.now + 106 * DAY);
    expect(sd().lien).toMatchObject({ status: 'intent', name: 'Notice Of State Tax Lien' });
    expect(sim.universe.notifications.some((n) => n.title === 'California Intends To File A Lien')).toBe(true);
    const penaltyBefore = sd().parts!.penalty;
    sim.advanceTo(sim.now + 31 * DAY);
    expect(sd().lien).toMatchObject({ status: 'filed', fee: 10_00, recordedAt: 'the county recorder and the Secretary of State' });
    expect(sd().parts!.penalty - penaltyBefore).toBeGreaterThanOrEqual(10_00);
    expect(sim.universe.notifications.filter((n) => n.title === 'A Notice Of State Tax Lien Is Filed')).toHaveLength(1);
    // Released only once paid: asked before, refused with why.
    expect(lienReleaseRefusal(sim, sim.player, r, 'us-ca')).toMatch(/once what it was filed for is paid in full/);
    fund(sim, 5_000_00);
    sim.must({ kind: 'tax.pay_state', payload: { state: 'us-ca', year: 2001 } });
    expect(sd().lien!.status).toBe('paid');
    expect(lienReleaseRefusal(sim, sim.player, r, 'us-ca')).toMatch(/released on its own, within 40 days/);
    sim.advanceTo(sim.now + 41 * DAY);
    expect(sd().lien!.status).toBe('released');
    expect(pending(sim, STATE_LIEN_KIND)).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('California: a plan set up after the notice of intent, and no lien is filed', () => {
    const sim = fresh('lien-ca-plan');
    const r = owing(sim, 'us-ca', 1_000_00, 2001);
    sim.advanceTo(sim.now + 106 * DAY);
    expect(r.stateDue!['us-ca']!.lien!.status).toBe('intent');
    fund(sim, 2_000_00);
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-ca', months: 12 } });
    sim.advanceTo(sim.now + 3 * DAY);
    expect(r.stateDue!['us-ca']!.lien!.status).toBe('dropped');
    sim.advanceTo(sim.now + 30 * DAY);
    expect(r.stateDue!['us-ca']!.lien!.status).toBe('dropped');
    expect(sim.universe.notifications.some((n) => n.title === 'A Notice Of State Tax Lien Is Filed')).toBe(false);
  });

  it('Connecticut: filed with its notice of intent to levy; paid; released only on request, and once', () => {
    const sim = fresh('lien-ct');
    const r = owing(sim, 'us-ct', 1_000_00, 2001);
    sim.advanceTo(sim.now + 61 * DAY);
    expect(r.stateDue!['us-ct']!.lien!.status).toBe('filed');
    fund(sim, 3_000_00);
    sim.must({ kind: 'tax.pay_state', payload: { state: 'us-ct', year: 2001 } });
    expect(r.stateDue!['us-ct']!.lien!.status).toBe('paid');
    sim.advanceTo(sim.now + 60 * DAY);
    // Nothing on its own: Connecticut issues the certificate on request.
    expect(r.stateDue!['us-ct']!.lien!.status).toBe('paid');
    expect(lienReleaseRefusal(sim, sim.player, r, 'us-ct')).toBeUndefined();
    sim.must({ kind: 'tax.lien_release', payload: { state: 'us-ct', year: 2001 } });
    expect(sim.execute({ kind: 'tax.lien_release', payload: { state: 'us-ct', year: 2001 } }).error).toMatch(/You’ve already asked\. It’s to be released by/);
    sim.advanceTo(sim.now + 31 * DAY);
    expect(r.stateDue!['us-ct']!.lien!.status).toBe('released');
  });

  it('Hawaii: a plan over twelve months files a lien with its $25 fee; paid off, its release asks the $25 release fee', () => {
    const sim = fresh('lien-hi', 'us-hi-honolulu');
    const r = owing(sim, 'us-hi', 2_000_00, 2001);
    fund(sim, 10_000_00);
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-hi', months: 18 } });
    sim.advanceTo(sim.now + 2 * DAY);
    expect(r.stateDue!['us-hi']!.lien).toMatchObject({ status: 'filed', trigger: 'plan', fee: 25_00, recordedAt: 'the Bureau of Conveyances' });
    sim.must({ kind: 'tax.pay_state', payload: { state: 'us-hi', year: 2001 } });
    expect(r.stateDue!['us-hi']!.lien!.status).toBe('paid');
    const bank = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    sim.must({ kind: 'tax.lien_release', payload: { state: 'us-hi', year: 2001 } });
    expect(bank - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(25_00);
    sim.advanceTo(sim.now + 31 * DAY);
    expect(r.stateDue!['us-hi']!.lien!.status).toBe('released');
  });

  it('one filed on an assessment their own return shows was nothing: withdrawn on request as in error, its fee back; one that wasn’t, refused', () => {
    const sim = fresh('lien-error');
    const r = { year: 2001, due: sim.now - 500 * DAY, figures: { income: 50_000_00, balance: 1_000_00 } } as unknown as TaxReturn;
    sim.player.returns = { ...(sim.player.returns ?? {}), '2001': r };
    assessStateNonFiler(sim, sim.player, r, 'us-ca', 1_000_00);
    fileStateLien(sim, sim.player, r, 'us-ca', 'collection');
    expect(lienDisputeRefusal(r, 'us-ca')).toMatch(/was filed for tax you owed, so it wasn’t filed in error/);
    // Their own return: what was withheld covered it all.
    reconsiderState(sim, sim.player, r, 'us-ca', 0);
    expect(lienDisputeRefusal(r, 'us-ca')).toBeUndefined();
    sim.must({ kind: 'tax.lien_dispute', payload: { state: 'us-ca', year: 2001 } });
    sim.advanceTo(sim.now + 31 * DAY);
    expect(r.stateDue!['us-ca']!.lien!.status).toBe('withdrawn');
    // Its $10 fee back: nothing was owed for it to come off.
    const back = sim.universe.transactions.filter((t) => /a lien’s fee back, filed in error/.test(t.memo));
    expect(back.map((t) => t.postings.find((p) => p.accountId === sim.player.primaryAccountId)?.amount)).toEqual([10_00]);
    sim.advanceTo(sim.now + 20 * DAY);
    // The release after payment that was on the calendar didn't turn it back into a release.
    expect(r.stateDue!['us-ca']!.lien!.status).toBe('withdrawn');
    expect(sim.ledger.audit()).toEqual([]);

    // Their own return shows the tax was owed after all: the lien secured it, and isn't withdrawn.
    const owedAfterAll = { year: 2002, due: sim.now - 500 * DAY, figures: { income: 50_000_00, balance: 1_000_00 } } as unknown as TaxReturn;
    sim.player.returns['2002'] = owedAfterAll;
    assessStateNonFiler(sim, sim.player, owedAfterAll, 'us-ca', 1_000_00);
    fileStateLien(sim, sim.player, owedAfterAll, 'us-ca', 'collection');
    reconsiderState(sim, sim.player, owedAfterAll, 'us-ca', 800_00);
    expect(lienDisputeRefusal(owedAfterAll, 'us-ca')).toMatch(/was filed for tax you owed, so it wasn’t filed in error/);
  });
});

describe('the IRS’s notice of federal tax lien', () => {
  it('PLAYER JOURNEY: $10,000 or more unpaid at the LT11 files it; paid, released within 30 days; then withdrawn on Form 12277', () => {
    const sim = life('us-ny-newyork', 'fed-lien');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 150_000_00 });
    while (sim.now < at(2027, 2, 1, 12)) sim.advanceTo(Math.min(at(2027, 2, 1, 12), sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true });
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const r = () => returnsOf(sim.player)['2026']!;
    expect(r().owed).toBeGreaterThan(10_000_00);
    // CP501, CP503, CP504 five weeks apart from the due date, the LT11 five weeks after (from 2026-10-16: until then from
    // the filing on 1 February, before the tax was due; `nextNotice`).
    sim.advanceTo(r().due + 4 * 35 * DAY + 2 * DAY);
    expect(r().lien).toMatchObject({ name: 'Notice Of Federal Tax Lien', status: 'filed' });
    expect(sim.universe.notifications.find((n) => n.title === 'The IRS Filed A Notice Of Federal Tax Lien')!.body).toMatch(/Letter 3172.*30 days to ask for a Collection Due Process hearing, which the game doesn’t offer/);
    expect(sim.execute({ kind: 'tax.federal_lien_withdraw', payload: { year: 2026 } }).error).toMatch(/once the lien is released/);
    fund(sim, 60_000_00);
    sim.must({ kind: 'tax.pay', payload: { year: 2026 } });
    expect(r().lien!.status).toBe('paid');
    sim.advanceTo(sim.now + 31 * DAY);
    expect(r().lien!.status).toBe('released');
    sim.must({ kind: 'tax.federal_lien_withdraw', payload: { year: 2026 } });
    sim.advanceTo(sim.now + 31 * DAY);
    expect(r().lien!.status).toBe('withdrawn');
    expect(sim.ledger.audit()).toEqual([]);
  }, 180_000);
});

describe('the longer arrangements', () => {
  it('New Mexico: twelve months with no lien; thirteen to 72 only as its long-term agreement, with a lien', () => {
    const sim = fresh('nm-long', 'us-nm-santafe');
    owing(sim, 'us-nm', 3_000_00, 2001);
    expect(statePlanRefusal(sim, sim.player, 'us-nm', 24)).toMatch(/For longer, apply for its long-term installment agreement/);
    expect(statePlanRefusal(sim, sim.player, 'us-nm', 24, { long: true })).toBeUndefined();
    expect(statePlanRefusal(sim, sim.player, 'us-nm', 80, { long: true })).toMatch(/at most 72 months/);
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-nm', months: 24, long: true } });
    sim.advanceTo(sim.now + 2 * DAY);
    const r = returnsOf(sim.player)['2001']!;
    expect(sim.player.statePlans!['us-nm']!.status).toBe('active');
    expect(r.stateDue!['us-nm']!.lien).toMatchObject({ status: 'filed', trigger: 'plan', name: 'Notice Of Claim Of Tax Lien' });
  });

  it('Pennsylvania: its extended plan over $50,000, decided on the statement from your own records; declined where it doesn’t fit', () => {
    const sim = fresh('pa-ext', 'us-pa-philadelphia');
    owing(sim, 'us-pa', 60_000_00, 2001);
    expect(statePlanRefusal(sim, sim.player, 'us-pa', 12)).toMatch(/Apply for its extended payment plan instead/);
    // FIXTURE: three months of pay, $9,000 a month in, $1,000 out.
    for (const m of [1, 2, 3]) sim.post({ memo: 'Wages', category: 'income', at: sim.now - m * 20 * DAY, postings: [{ accountId: sim.player.primaryAccountId!, amount: 9_000_00 }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -9_000_00 }] } as never);
    for (const m of [1, 2, 3]) sim.post({ memo: 'Rent', category: 'housing', at: sim.now - m * 20 * DAY, postings: [{ accountId: sim.player.primaryAccountId!, amount: -1_000_00 }, { accountId: sim.nominalAccount('expense', 'Rent').id, amount: 1_000_00 }] } as never);
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-pa', months: 36, long: true } });
    const plan = () => sim.player.statePlans!['us-pa']!;
    expect(plan().long!.statement).toMatchObject({ income: 9_000_00, expenses: 1_000_00, net: 8_000_00 });
    sim.advanceTo(sim.now + 15 * DAY);
    expect(plan().status).toBe('active');

    const poor = fresh('pa-ext-2', 'us-pa-philadelphia');
    owing(poor, 'us-pa', 60_000_00, 2001);
    poor.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-pa', months: 36, long: true } });
    poor.advanceTo(poor.now + 15 * DAY);
    expect(poor.player.statePlans!['us-pa']!.status).toBe('declined');
    expect(poor.player.statePlans!['us-pa']!.why).toMatch(/more than the \$0\.00 your financial statement leaves over each month/);
    expect(poor.universe.scheduled.some((i) => i.status === 'pending' && i.kind === 'tax.state_notice' && i.payload.state === 'us-pa')).toBe(true);
  });

  it('Pennsylvania’s extended plan once approved: a payment missed ends it, collection resumes; paid off, it ends paid', () => {
    const approved = (seed: string) => {
      const sim = fresh(seed, 'us-pa-philadelphia');
      owing(sim, 'us-pa', 60_000_00, 2001);
      // FIXTURE: three months of pay, $9,000 a month in, none out, so the statement leaves room.
      for (const m of [1, 2, 3]) sim.post({ memo: 'Wages', category: 'income', at: sim.now - m * 20 * DAY, postings: [{ accountId: sim.player.primaryAccountId!, amount: 9_000_00 }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -9_000_00 }] } as never);
      empty(sim);
      sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-pa', months: 36, long: true } });
      sim.advanceTo(sim.now + 15 * DAY);
      expect(sim.player.statePlans!['us-pa']!.status).toBe('active');
      return sim;
    };
    // Nothing in the bank at its first payment: Pennsylvania's rule on a missed payment wasn't found, so it ends.
    const missed = approved('pa-missed');
    missed.advanceTo(missed.now + 40 * DAY);
    expect(missed.player.statePlans!['us-pa']!.status).toBe('ended');
    expect(missed.universe.scheduled.some((i) => i.status === 'pending' && i.kind === 'tax.state_notice' && i.payload.state === 'us-pa')).toBe(true);
    expect(missed.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === 'tax.state_plan_payment' && i.payload.personId === missed.player.id)).toEqual([]);

    const done = approved('pa-done');
    fund(done, 80_000_00);
    done.must({ kind: 'tax.pay_state', payload: { state: 'us-pa', year: 2001 } });
    expect(done.player.statePlans!['us-pa']!.status).toBe('paid');
    done.advanceTo(done.now + 40 * DAY);
    // Nothing more taken or sent once it's paid.
    expect(done.universe.scheduled.filter((i) => i.status === 'pending' && /^tax\.state_/.test(i.kind) && i.payload.personId === done.player.id && i.payload.state === 'us-pa')).toEqual([]);
    expect(done.ledger.audit()).toEqual([]);
  });

  it('Louisiana: 20% down offered, never required; its formal agreement from $50,000', () => {
    const sim = fresh('la-down', 'us-la-neworleans');
    owing(sim, 'us-la', 10_000_00, 2001);
    expect(statePlanRefusal(sim, sim.player, 'us-la', 24)).toBeUndefined();
    fund(sim, 5_000_00);
    const owedBefore = returnsOf(sim.player)['2001']!.stateDue!['us-la']!.owed!;
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-la', months: 24, down: 2_000_00 } });
    expect(returnsOf(sim.player)['2001']!.stateDue!['us-la']!.owed).toBeLessThanOrEqual(owedBefore - 2_000_00);
    const big = fresh('la-formal', 'us-la-neworleans');
    owing(big, 'us-la', 55_000_00, 2001);
    expect(statePlanRefusal(big, big.player, 'us-la', 24)).toMatch(/Apply for its formal installment agreement instead/);
    expect(STATE_TAX['us-la'].plan.downPayment!.required).toBe(false);
  });

  it('the District: its 10% down taken with the request, and a lien for a plan over twelve months', () => {
    const sim = fresh('dc-down', 'us-dc-washington');
    owing(sim, 'us-dc', 5_000_00, 2001);
    fund(sim, 2_000_00);
    const sd = () => returnsOf(sim.player)['2001']!.stateDue!['us-dc']!;
    const owed = sd().owed!;
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-dc', months: 18, down: Math.round(owed * 0.1) } });
    expect(sim.player.statePlans!['us-dc']!.down).toBe(Math.round(owed * 0.1));
    sim.advanceTo(sim.now + 2 * DAY);
    expect(sd().lien).toMatchObject({ status: 'filed', trigger: 'plan', name: 'District Tax Lien' });
  });
});

describe('Oregon’s three years unfiled, and Massachusetts’s discretion', () => {
  it('three years with tax and no return of their own: 100% of each year’s tax, held to it; its waiver by the schedule once their own is filed', () => {
    const sim = fresh('or-three', 'us-or-portland');
    const rs = [2001, 2002, 2003].map((y) => { const r = { year: y, due: sim.now - (3 - (y - 2001)) * 365 * DAY, figures: { income: 50_000_00, balance: 1_000_00 } } as unknown as TaxReturn; sim.player.returns = { ...(sim.player.returns ?? {}), [String(y)]: r }; return r; });
    // The state's own assessments: not returns.
    for (const r of rs) assessStateNonFiler(sim, sim.player, r, 'us-or', 1_000_00);
    threeYearCheck(sim, sim.player, 'us-or', 2003, () => 1_000_00);
    // Each assessment already carries 5% paid late, 20% filed over three months late and 25% for not filing on demand:
    // $500 of the $1,000, so the 100% has room for $500 more.
    for (const r of rs) expect(r.stateDue!['us-or']!.threeYear!.amount).toBe(500_00);
    expect(waiverRefusal(sim, rs[0], 'us-or')).toMatch(/File your own return/);
    reconsiderState(sim, sim.player, rs[0]!, 'us-or', 1_000_00);
    expect(waiverRefusal(sim, rs[0], 'us-or')).toBeUndefined();
    sim.must({ kind: 'tax.request_waiver', payload: { state: 'us-or', year: 2001 } });
    // After the assessment: 25% waived.
    expect(rs[0]!.stateDue!['us-or']!.threeYear!.waived).toBe(125_00);
  });

  it('a run broken by a year filed adds nothing', () => {
    const sim = fresh('or-broken', 'us-or-portland');
    const rs = [2001, 2002, 2003].map((y) => { const r = { year: y, due: sim.now - 400 * DAY, figures: { income: 50_000_00, balance: 1_000_00 } } as unknown as TaxReturn; sim.player.returns = { ...(sim.player.returns ?? {}), [String(y)]: r }; return r; });
    fileState(sim, sim.player, rs[1]!, 'us-or', 1_000_00);
    threeYearCheck(sim, sim.player, 'us-or', 2003, () => 1_000_00);
    expect(rs.some((r) => r.threeYearFor?.['us-or'])).toBe(false);
  });

  it('Massachusetts may double a non-filer’s tax; SLATE’s DOR doesn’t, and its letter says so', () => {
    const words = STATE_TAX['us-ma'].nonFiler.letters[0]!.words;
    expect(words).toMatch(/may assess up to double the tax/);
    expect(words).toMatch(/so the game doesn’t do it/);
    const sim = fresh('ma-nf', 'us-ma-boston');
    const r = { year: 2001, due: sim.now - 500 * DAY, figures: { income: 50_000_00, balance: 1_000_00 } } as unknown as TaxReturn;
    sim.player.returns = { ...(sim.player.returns ?? {}), '2001': r };
    assessStateNonFiler(sim, sim.player, r, 'us-ma', 1_000_00);
    // 1% a month to 25% for each of filing and paying late; never the doubling's $1,000 more.
    expect(r.stateDue!['us-ma']!.parts!.tax).toBe(1_000_00);
    expect(r.stateDue!['us-ma']!.parts!.penalty).toBeLessThanOrEqual(50_00 * 10);
  });
});

describe('the budget and Home', () => {
  it('count a state’s own assessment of an unfiled return once: in what’s owed, not again in the return late', () => {
    const sim = fresh('budget-once');
    const r = { year: 2001, due: sim.now - 400 * DAY, figures: { income: 50_000_00, balance: 3_000_00, owedTo: { irs: 2_000_00, states: { 'us-ct': 1_000_00 } } } } as unknown as TaxReturn;
    sim.player.returns = { ...(sim.player.returns ?? {}), '2001': r };
    assessStateNonFiler(sim, sim.player, r, 'us-ct', 1_000_00);
    expect(unassessedBalance(sim.player, r)).toBe(2_000_00);
    const t = troubles(sim, sim.player);
    const tax = t.find((x) => x.kind === 'tax')!.amount;
    const late = t.find((x) => x.kind === 'return_late')!.amount;
    // Connecticut's assessed balance is in `tax`; the return late carries the IRS's $2,000 and its late penalties only.
    expect(tax).toBe(r.stateDue!['us-ct']!.owed);
    expect(late).toBeLessThan(2_000_00 + 2_000_00 * 0.5);
    expect(late).toBeGreaterThanOrEqual(2_000_00);
  });
});
