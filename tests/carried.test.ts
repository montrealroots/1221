/**
 * The last of what was built in on 2026-09-27: work abroad and its taxes,
 * Connecticut's income tax, the states' job-expense deductions, meal
 * penalties, and the body's own: conditions carried, the pharmacy, the
 * dentist and the optician (`systems/career.ts`, `systems/health.ts`,
 * `systems/taxreturn.ts`).
 */
import { quickSave } from '@/engine';
import { exchange } from '@/engine/content/currency';
import { ABROAD,CARE,CHRONIC,DENTAL_VISION,PHARMACY,PLANS,STATE_DEDUCTIONS } from '@/engine/content/safetynet';
import { computeAnnualTax } from '@/engine/content/tax';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY,instantFromZoned,zonedParts } from '@/engine/core/time';
import { payeeAccount } from '@/engine/systems/cash';
import { documentsOf,passportOf } from '@/engine/systems/documents';
import { earningsOf,recordInterest,recordWages,yearOf } from '@/engine/systems/earnings';
import { catching,fillMedicine,grown,healthOf,illnessWeek,keepUp,rxShareOf,shareOf,teethAndEyesShareOf } from '@/engine/systems/health';
import { canadaElected,connecticutTax,figuresFor,settleUkYears,ukAllowed,ukTaxOn } from '@/engine/systems/taxreturn';
import { describe,expect,it } from 'vitest';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
function pro(seed: string, city = 'us-ny-newyork'): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  // An actor sent abroad holds a passport, and nothing here is about papers (docs/WORLD.md, stage 1b).
  if (!passportOf(sim.player, sim.now)) documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - 86_400_000, expiresAt: sim.now + 3650 * 86_400_000 });
  return sim;
}

describe('working abroad', () => {

  it('credits the foreign tax against the US’s on that income, and has Canada’s back under CAD 15,000', () => {
    const sim = pro('ftc');
    recordWages(sim.player, at(2027, 3, 1), NY, { gross: 60_000_00 });
    recordWages(sim.player, at(2027, 5, 1), NY, { gross: 40_000_00, where: 'ca-on-toronto', foreignWithheld: 9_200_00 });
    const federal = computeAnnualTax(100_000_00, 'us-ny-newyork', at(2027, 12, 31, 12)).federal;
    // Filed late, the 216.1 election is lost and the 23% stands, all of it credited as far as the US tax on that income.
    const late = figuresFor(sim.player, 2027, 'USD', at(2028, 5, 15));
    expect(late.foreignRefund).toBe(0);
    expect(late.foreignCredit).toBe(Math.min(9_200_00, Math.round(federal * 0.4)));
    expect(late.federal).toBe(federal - late.foreignCredit);
    // Filed by 30 April, Canada's graduated tax is what stands, and the rest comes back.
    // Worked in Toronto: Ontario's tax, not the 48% surtax.
    const elected = canadaElected(40_000_00, 0, 100_000_00, 'USD', { 'ca-08': 40_000_00 });
    const f = figuresFor(sim.player, 2027, 'USD', at(2028, 4, 15));
    expect(f.foreignRefund).toBe(9_200_00 - elected);
    expect(f.foreignCredit).toBe(Math.min(elected, Math.round(federal * 0.4)));
    // The agent's share of the Canadian work comes off its net.
    const agented = pro('ftc-agent');
    recordWages(agented.player, at(2027, 3, 1), NY, { gross: 60_000_00, commission: 6_000_00 });
    recordWages(agented.player, at(2027, 5, 1), NY, { gross: 40_000_00, where: 'ca-on-toronto', foreignWithheld: 9_200_00, commission: 4_000_00 });
    expect(figuresFor(agented.player, 2027, 'USD', at(2028, 4, 15)).foreignRefund).toBe(9_200_00 - canadaElected(40_000_00, 4_000_00, 100_000_00, 'USD', { 'ca-08': 40_000_00 }));
    const small = pro('ftc-small');
    const under = (exchange(ABROAD.canada.treatyCad, 'CAD', 'USD') ?? 0) - 100_00;
    recordWages(small.player, at(2027, 5, 1), NY, { gross: under, where: 'ca-on-toronto', foreignWithheld: Math.round(under * 0.23) });
    expect(figuresFor(small.player, 2027)).toMatchObject({ foreignRefund: Math.round(under * 0.23), foreignCredit: 0 });
  });
});

describe('the UK’s tax year, and Canada’s tax on residuals', () => {

  it('takes the province’s tax where the work was done: BC’s in Vancouver, Ontario’s and its surtax in Toronto, the 48% only on what no province takes', () => {
    const cad = (usd: number) => exchange(usd, 'USD', 'CAD')!;
    const usdOf = (c: number) => exchange(c, 'CAD', 'USD')!;
    const net = cad(80_000_00);
    const federal = Math.round(0.14 * 58_523_00 + 0.205 * (net - 58_523_00));
    // About CAD 109,600: into BC's third band and Ontario's third.
    const bc = Math.round(0.056 * 50_363_00 + 0.077 * (100_728_00 - 50_363_00) + 0.105 * (net - 100_728_00));
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD', { 'ca-02': 80_000_00 })).toBe(usdOf(Math.round(federal + bc)));
    const on = Math.round(0.0505 * 53_891_00 + 0.0915 * (107_785_00 - 53_891_00) + 0.1116 * (net - 107_785_00));
    const onSurtax = Math.max(0, on - 5_818_00) * 0.2 + Math.max(0, on - 7_446_00) * 0.36;
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD', { 'ca-08': 80_000_00 })).toBe(usdOf(Math.round(federal + on + onSurtax)));
    // Half in each; and half nowhere, the surtax on that half.
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD', { 'ca-02': 40_000_00, 'ca-08': 40_000_00 })).toBe(usdOf(Math.round(federal + bc / 2 + (on + onSurtax) / 2)));
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD', { 'ca-02': 40_000_00 })).toBe(usdOf(Math.round(federal + bc / 2 + federal * 0.48 / 2)));
    // Mostly Canadian, and the provinces' personal amounts come off too.
    expect(canadaElected(80_000_00, 0, 80_000_00, 'USD', { 'ca-02': 80_000_00 })).toBe(usdOf(Math.round(federal - Math.round(0.14 * 16_452_00) + bc - Math.round(0.056 * 13_216_00))));
  });

  it('records where abroad each dollar was earned, for the provinces', () => {
    const sim = pro('where');
    recordWages(sim.player, at(2027, 5, 1), NY, { gross: 10_000_00, where: 'ca-bc-vancouver' });
    recordWages(sim.player, at(2027, 6, 1), NY, { gross: 5_000_00, where: 'ca-on-toronto' });
    expect(yearOf(sim.player, 2027).foreignWhere).toEqual({ 'ca-bc-vancouver': 10_000_00, 'ca-on-toronto': 5_000_00 });
  });

  it('settles the UK years at tax season', () => {
    const sim = pro('uk-season');
    recordWages(sim.player, at(2024, 6, 1), NY, { gross: 10_000_00, where: 'uk-eng-london', employer: 'a', foreignWithheld: 2_000_00 });
    const season = sim.universe.scheduled.find((i) => i.kind === 'tax.season' && i.status === 'pending')!;
    sim.advanceTo(season.at + 60_000);
    expect(yearOf(sim.player, zonedParts(season.at, NY).year).foreign.uk!.withheld).toBe(-2_000_00);
  }, 60_000);

  it('works Canada’s elected tax on the net: the federal brackets, the surtax, and the personal amount only for mostly Canadian income', () => {
    const cad = (usd: number) => exchange(usd, 'USD', 'CAD')!;
    const net = cad(40_000_00 - 4_000_00);
    const brackets = Math.round(0.14 * Math.min(net, 58_523_00) + 0.205 * Math.max(0, net - 58_523_00));
    expect(canadaElected(40_000_00, 4_000_00, 100_000_00, 'USD')).toBe(exchange(Math.round(brackets * 1.48), 'CAD', 'USD'));
    const big = cad(80_000_00);
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD')).toBe(exchange(Math.round(Math.round(0.14 * 58_523_00 + 0.205 * (big - 58_523_00)) * 1.48), 'CAD', 'USD'));
    // All of the year's income Canadian: the basic personal amount's credit first.
    expect(canadaElected(40_000_00, 4_000_00, 40_000_00, 'USD')).toBe(exchange(Math.round((brackets - Math.round(0.14 * 16_452_00)) * 1.48), 'CAD', 'USD'));
  });

  it('settles a UK year with its return: all back under the treaty, and over it the bands on it all', () => {
    const sim = pro('uk-settle');
    recordWages(sim.player, at(2027, 6, 1), NY, { gross: 15_000_00, where: 'uk-eng-london', employer: 'a', foreignWithheld: 3_000_00 });
    recordWages(sim.player, at(2028, 6, 1), NY, { gross: 80_000_00, where: 'uk-eng-london', employer: 'b', foreignWithheld: 16_000_00 });
    // The 2027–28 year files by 31 January 2029; not before.
    settleUkYears(sim, sim.player, 2028);
    expect(yearOf(sim.player, 2028).foreign.uk!.withheld).toBe(16_000_00);
    settleUkYears(sim, sim.player, 2029);
    expect(yearOf(sim.player, 2029).foreign.uk).toEqual({ gross: 0, withheld: -3_000_00 });
    settleUkYears(sim, sim.player, 2029);
    expect(yearOf(sim.player, 2029).foreign.uk!.withheld).toBe(-3_000_00);
    settleUkYears(sim, sim.player, 2030);
    const tax = ukTaxOn(80_000_00, 'USD');
    const gbp = exchange(80_000_00, 'USD', 'GBP')!;
    expect(tax).toBe(exchange(Math.round(0.2 * 37_700_00 + 0.4 * (gbp - 37_700_00)), 'GBP', 'USD'));
    expect(yearOf(sim.player, 2030).foreign.uk!.withheld).toBe(tax - 16_000_00);
  });

  it('gives a British or EEA citizen the UK’s allowance, tapered past £100,000, and a US citizen none', () => {
    const gbp = (n: number) => exchange(n, 'GBP', 'USD')!;
    // £50,000: the allowance first, and the £37,430 left all at 20%.
    expect(ukTaxOn(gbp(50_000_00), 'USD', true)).toBeCloseTo(gbp(Math.round(0.2 * (50_000_00 - 12_570_00))), -2);
    expect(ukTaxOn(gbp(50_000_00), 'USD', false)).toBeGreaterThan(ukTaxOn(gbp(50_000_00), 'USD', true));
    // Gone by £125,140.
    expect(ukTaxOn(gbp(130_000_00), 'USD', true)).toBe(ukTaxOn(gbp(130_000_00), 'USD', false));
    expect(ukTaxOn(gbp(110_000_00), 'USD', true)).toBeLessThan(ukTaxOn(gbp(110_000_00), 'USD', false));
    expect(ukAllowed('uk')).toBe(true);
    expect(ukAllowed('is')).toBe(true);
    expect(ukAllowed('us')).toBe(false);
  });

  it('keeps a UK year to settle where there’s no account to settle it through', () => {
    const sim = pro('uk-no-account');
    recordWages(sim.player, at(2027, 6, 1), NY, { gross: 15_000_00, where: 'uk-eng-london', employer: 'a', foreignWithheld: 3_000_00 });
    const primary = sim.player.primaryAccountId;
    sim.player.primaryAccountId = undefined;
    settleUkYears(sim, sim.player, 2029);
    expect(earningsOf(sim.player).ukSettled ?? []).toEqual([]);
    sim.player.primaryAccountId = primary;
    settleUkYears(sim, sim.player, 2030);
    expect(earningsOf(sim.player).ukSettled).toEqual(['2027']);
    expect(yearOf(sim.player, 2030).foreign.uk!.withheld).toBe(-3_000_00);
  });
});

describe('catching the flu', () => {
  it('is likelier short of sleep and under stress, by the tempered studies', () => {
    const sim = pro('catching');
    const w = sim.player.wellbeing;
    Object.assign(w, { sleepDebt: 0, stress: 0 });
    expect(catching(sim.player)).toBe(1);
    Object.assign(w, { sleepDebt: CARE.catching.debtTo, stress: 0 });
    expect(catching(sim.player)).toBeCloseTo(CARE.catching.sleepMost, 9);
    Object.assign(w, { sleepDebt: CARE.catching.debtFrom, stress: 100 });
    expect(catching(sim.player)).toBeCloseTo(CARE.catching.stressMost, 9);
    Object.assign(w, { sleepDebt: 6, stress: 50 });
    expect(catching(sim.player)).toBeCloseTo((1 + 0.5 * (CARE.catching.sleepMost - 1)) * (1 + 0.5 * (CARE.catching.stressMost - 1)), 9);
    // Over a flu season of weeks, the worn catch it more often.
    const count = (debt: number, stress: number) => { let n = 0; for (let i = 0; i < 4000; i += 1) { Object.assign(w, { sleepDebt: debt, stress }); if (illnessWeek(sim, sim.player, at(2026, 11, 2) + i * 7 * MS_DAY).some((e) => e.flu)) n += 1; } return n; };
    expect(count(12, 100)).toBeGreaterThan(count(0, 0) * 2);
  });
});

describe('a paycheck', () => {

  it('comes by check into the wallet when there’s no current account open', () => {
    const sim = pro('no-account');
    const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
    current.closedAt = sim.now;
    const into = payeeAccount(sim, sim.player);
    expect(into.kind).toBe('cash');
    expect(payeeAccount(sim, sim.player).id).toBe(into.id);
    delete current.closedAt;
    expect(payeeAccount(sim, sim.player).id).toBe(current.id);
  });
});

describe('interest', () => {
  it('reaches the return and the month’s income, as it was paid', () => {
    const sim = pro('interest');
    const interest = () => -sim.nominalAccount('income', 'Interest').balance;
    const before = interest();
    sim.advanceBy(70 * MS_DAY);
    const paid = interest() - before;
    expect(paid).toBeGreaterThan(0);
    const years = sim.player.earnings!.years;
    expect(Object.values(years).reduce((a, y) => a + (y.interest ?? 0), 0)).toBe(paid);
    const months = Object.values(sim.player.earnings!.months).reduce((a, m) => a + m, 0);
    expect(months).toBeGreaterThanOrEqual(paid);
    // It's taxed as income, and carries no payroll tax.
    const without = figuresFor(sim.player, 2027);
    recordInterest(sim.player, at(2027, 6, 1), NY, 50_000_00);
    const withInterest = figuresFor(sim.player, 2027);
    expect(withInterest.federal).toBeGreaterThan(without.federal);
    expect(withInterest.payroll).toBe(without.payroll);
    // A New Yorker's city tax on it too, by where they lived when it was paid.
    expect(withInterest.local).toBeGreaterThan(without.local);
  }, 60_000);
});

describe('Connecticut', () => {
  it('taxes as its instructions work it: nothing at $15,000, $40 at $20,000, $130 at $25,000', () => {
    expect(connecticutTax(15_000_00)).toBe(0);
    expect(connecticutTax(20_000_00)).toBe(40_00);
    expect(connecticutTax(25_000_00)).toBe(130_00);
    // Past $30,000 the exemption falls away, and past $56,500 the add-back comes.
    expect(connecticutTax(45_000_00)).toBe(Math.round((200_00 + 0.045 * 35_000_00) * 0.9));
    expect(connecticutTax(70_000_00)).toBe(Math.round(2_000_00 + 0.055 * 20_000_00 + 75_00));
  });
});

describe('the states’ job-expense deductions', () => {
  it('itemizes an actor’s commissions and dues on a New York return above 2% of income, where that beats $8,000', () => {
    const sim = pro('it196');
    recordWages(sim.player, at(2027, 3, 1), NY, { gross: 100_000_00, commission: 18_000_00, dues: 2_000_00 });
    const itemized = 20_000_00 - 0.02 * 100_000_00;
    const extra = itemized - STATE_DEDUCTIONS.standard['us-ny']!;
    const ny = figuresFor(sim.player, 2027).states.find((s) => s.state === 'us-ny')!;
    expect(ny.tax).toBe(computeAnnualTax(100_000_00, 'us-ny-newyork', at(2027, 12, 31, 12), { deductions: extra }).regional);
    const small = pro('it196-small');
    recordWages(small.player, at(2027, 3, 1), NY, { gross: 100_000_00, commission: 5_000_00 });
    expect(figuresFor(small.player, 2027).states.find((s) => s.state === 'us-ny')!.tax).toBe(computeAnnualTax(100_000_00, 'us-ny-newyork', at(2027, 12, 31, 12)).regional);
  });
});

describe('the pharmacy, the dentist and the optician', () => {
  it('fill a prescription at each plan’s copay, a brand after its deductible, and the uninsured at the cash price', () => {
    const sim = pro('rx');
    const when = at(2027, 3, 1);
    expect(rxShareOf(sim.player, false, when)).toBe(grown(PHARMACY.price.generic, 'rx', when));
    const h = healthOf(sim.player);
    // Access Health CT's Standard Silver; until 2026-10-09 this was SAG-AFTRA's plan, which went with the career.
    h.marketplace = { from: at(2027, 1, 1, 0), state: 'ct' };
    const plan = PHARMACY.plans['marketplace-ct']!;
    expect(rxShareOf(sim.player, false, when)).toBe(plan.generic[0]);
    // The $250 brand deductible first, the copay on top; then only the copay.
    expect(rxShareOf(sim.player, true, when)).toBe(plan.brandDeductible + plan.brand[0]);
    expect(rxShareOf(sim.player, true, when)).toBe(plan.brand[0]);
  });

  it('leave dental and vision to what each plan covers, and the uninsured the price', () => {
    const sim = pro('teeth');
    const when = at(2027, 3, 1);
    // From 2026-10-03 a New Yorker's cleaning is 209 NYC Dental's own $144, not the national average (`NAMED_TEETH_EYES`).
    expect(teethAndEyesShareOf(sim.player, 'cleaning', when)).toBe(144_00);
    const h = healthOf(sim.player);
    // A marketplace plan pays none of it; New York's Medicaid all of it. Until 2026-10-09 SAG-AFTRA's plan stood here for
    // a plan paying part, and none that's left does.
    h.marketplace = { from: at(2027, 1, 1, 0), state: 'ny' };
    expect(teethAndEyesShareOf(sim.player, 'cleaning', when)).toBe(144_00);
    delete h.marketplace;
    h.program = { kind: 'medicaid', state: 'ny', from: at(2027, 1, 1, 0), band: 'low', renewAt: at(2028, 1, 1, 0) };
    expect(teethAndEyesShareOf(sim.player, 'cleaning', when)).toBe(0);
    expect(teethAndEyesShareOf(sim.player, 'filling', when)).toBe(0);
    expect(teethAndEyesShareOf(sim.player, 'exam', when)).toBe(0);
    expect(shareOf(sim.player, 'glasses', when)).toBe(0);
  });

  it('bring the dentist to about three in five a year, and an eye exam only to those with lenses', () => {
    const sim = pro('visits');
    const h = healthOf(sim.player);
    h.lenses = false;
    let years = 0;
    let exams = 0;
    for (let y = 0; y < 120; y += 1) {
      let saw = false;
      for (let w = 0; w < 52; w += 1) {
        for (const e of illnessWeek(sim, sim.player, sim.now + (y * 52 + w) * 7 * MS_DAY)) {
          if (e.care === 'cleaning') saw = true;
          if (e.care === 'exam') exams += 1;
        }
      }
      if (saw) years += 1;
    }
    expect(years / 120).toBeGreaterThan(DENTAL_VISION.dentistShare - 0.12);
    expect(years / 120).toBeLessThan(DENTAL_VISION.dentistShare + 0.12);
    expect(exams).toBe(0);
  });
});

describe('conditions carried', () => {
  it('are drawn once, at a young adult’s rates', () => {
    let depression = 0;
    let lenses = 0;
    for (let n = 0; n < 200; n += 1) {
      const h = healthOf(pro(`c${n}`).player);
      if (h.chronic?.depression) depression += 1;
      if (h.lenses) lenses += 1;
    }
    expect(depression / 200).toBeGreaterThan(CHRONIC.share.depression * 0.6);
    expect(depression / 200).toBeLessThan(CHRONIC.share.depression * 1.4);
    expect(lenses / 200).toBeGreaterThan(DENTAL_VISION.lensShare * 0.8);
    expect(lenses / 200).toBeLessThan(DENTAL_VISION.lensShare * 1.2);
  }, 120_000);

  it('cost their care each month, at what the plan leaves; unpaid, they lapse; left alone, depression weighs on morale', () => {
    const sim = pro('keep');
    const h = healthOf(sim.player);
    h.chronic = { depression: { treated: true }, hypertension: { treated: true } };
    // New York's Essential Plan at its higher band: $15 a visit, $6 a generic. SAG-AFTRA's stood here until 2026-10-09.
    h.program = { kind: 'essential', state: 'ny', from: at(2026, 1, 1, 0), band: 'high', renewAt: at(2027, 1, 1, 0) };
    const when = at(2026, 3, 1, 1);
    // The month’s care, and its fill of medicine (`fillMedicine`, from 2026-10-02).
    const cost = keepUp(sim, sim.player, when) + fillMedicine(sim, sim.player, when);
    expect(cost).toBe(2 * PLANS['essential-high']!.visit + 2 * PHARMACY.plans['essential-high']!.generic[0]);
    // With next to nothing and no card, the month's care goes unpaid.
    const poor = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'nothing' }, 'keep-poor');
    const ph = healthOf(poor.player);
    ph.chronic = { depression: { treated: true } };
    for (const acct of Object.values(poor.universe.accounts)) if (acct.ownerId === poor.player.id && acct.id === poor.player.primaryAccountId) acct.balance = -5_000_00;
    expect(keepUp(poor, poor.player, when)).toBe(0);
    expect(ph.chronic.depression!.lapsed).toBe(true);
    // Left alone, against the same life without it, a week on.
    const alone = pro('weigh');
    const well = pro('weigh');
    healthOf(alone.player).chronic = { depression: { treated: true } };
    healthOf(well.player).chronic = {};
    expect(alone.execute({ kind: 'health.treat', payload: { condition: 'depression', on: false } }).ok).toBe(true);
    const week = alone.universe.scheduled.filter((i) => i.kind === 'health.week' && i.status === 'pending').sort((x, y) => x.at - y.at)[0]!.at + 60_000;
    alone.advanceTo(week);
    well.advanceTo(week);
    expect(well.player.wellbeing.morale - alone.player.wellbeing.morale).toBeCloseTo(CHRONIC.untreated.moraleAWeek, 0);
    expect(sim.execute({ kind: 'health.treat', payload: { condition: 'asthma', on: true } })).toMatchObject({ ok: false, error: 'You don’t have that.' });
  });

  it('let asthma left alone double the emergencies', () => {
    const sim = pro('asthma');
    const h = healthOf(sim.player);
    let kept = 0;
    let left = 0;
    for (let w = 0; w < 52 * 60; w += 1) {
      h.chronic = { asthma: { treated: true } };
      kept += illnessWeek(sim, sim.player, sim.now + w * 7 * MS_DAY).filter((e) => e.care === 'emergency').length;
      h.chronic = { asthma: { treated: false } };
      left += illnessWeek(sim, sim.player, sim.now + w * 7 * MS_DAY).filter((e) => e.care === 'emergency').length;
    }
    expect(left / kept).toBeGreaterThan(1.5);
  });
});
