/**
 * What the business added after its first portion (`systems/career.ts`,
 * `systems/health.ts`, `systems/unemployment.ts`, `systems/taxreturn.ts`):
 * Off-Broadway and series regulars, overtime, managers, residuals, health
 * cover, unemployment insurance and the tax return, against the published
 * figures in `content/career.ts` and `content/safetynet.ts`.
 */
import { quickSave } from '@/engine';
import { UNION_HEALTH } from '@/engine/content/career';
import { CALIFORNIA_MANDATE,CONNECTICUT_UI,INSULIN,NEW_YORK_UI,PLANS,POVERTY_LINE,RETURN,byYear } from '@/engine/content/safetynet';
import { computeAnnualTax } from '@/engine/content/tax';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY,MS_HOUR,instantFromZoned,zonedParts } from '@/engine/core/time';
import { earningsOf,recordBenefit,recordWages,yearOf } from '@/engine/systems/earnings';
import { benchmarkFor,healthMonth,healthOf,insulinShareOf,mayEnroll,planKey,programFor,shareOf } from '@/engine/systems/health';
import type { Craft } from '@/engine/systems/school';
import { evenCraft } from '@/engine/systems/school';
import { applicablePercent,deadline,figuresFor,latePenalty,returnsOf } from '@/engine/systems/taxreturn';
import { basePeriodFor,claimStateFor,monetary,unemploymentOf,weekBenefit,type Claim } from '@/engine/systems/unemployment';
import { describe,expect,it } from 'vitest';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, zone = NY) => instantFromZoned({ year, month, day, hour }, zone);
const craft = (level: number): Craft => (evenCraft(level));
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };

function pro(seed: string, city = 'us-ny-newyork', level = 75): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = craft(level);
  return sim;
}
const claimOf = (state: 'ny' | 'ca' | 'ct', weekly: number): Claim => ({ state, filedAt: 0, endsAt: 1e15, weekly, maxTotal: 1e12, paid: 0, waited: true, basePeriod: [] });

describe('health cover', () => {

  it('SAG-AFTRA’s: a base period’s earnings at the threshold give a year from three months after, for its premium', () => {
    const sim = pro('sag-health');
    const person = sim.player;
    for (const q of ['2025-4', '2026-1', '2026-2', '2026-3']) earningsOf(person).quarters[q] = { wages: 7_100_00, sag: 7_100_00 };
    healthMonth(sim, person, at(2027, 1, 1, 1));
    expect(healthOf(person).sag).toEqual({ from: at(2027, 1, 1, 1), until: at(2028, 1, 1, 0) });
    expect(sim.universe.transactions.some((t) => t.memo === 'SAG-AFTRA Health Plan premium')).toBe(true);
    // On the ledger's line for care, not food's.
    expect(sim.nominalAccount('expense', 'Medical Care').balance).toBeGreaterThan(0);
    // A premium the bank can't pay ends the plan, as COBRA's would.
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === person.id && a.balance > 0 && a.kind !== 'escrow') a.balance = 0;
    sim.universe.accounts[person.primaryAccountId!]!.balance = -100_000_00;
    healthMonth(sim, person, at(2027, 4, 1, 1));
    expect(healthOf(person).sag!.until).toBe(at(2027, 4, 1, 1));
    // And Equity-League's.
    healthOf(person).equity = { from: at(2027, 1, 1, 0), until: at(2027, 12, 1, 0) };
    healthMonth(sim, person, at(2027, 5, 1, 1));
    expect(healthOf(person).equity!.until).toBe(at(2027, 5, 1, 1));
    const short = pro('sag-short');
    for (const q of ['2025-4', '2026-1', '2026-2', '2026-3']) earningsOf(short.player).quarters[q] = { wages: 6_000_00, sag: 6_000_00 };
    healthMonth(short, short.player, at(2027, 1, 1, 1));
    expect(healthOf(short.player).sag).toBeUndefined();
    expect(byYear(UNION_HEALTH.sagThreshold, 2026)).toBe(28_090_00);
  });

  it('Equity-League’s: ten weeks in a year give six months from two months after', () => {
    const sim = pro('eq-health');
    const weeks = earningsOf(sim.player).equityWeeks;
    for (let n = 0; n < 10; n += 1) weeks.push(`2026-0${Math.floor(n / 4) + 7}-${String(1 + (n % 4) * 7).padStart(2, '0')}`);
    healthMonth(sim, sim.player, at(2026, 10, 1, 1));
    expect(healthOf(sim.player).equity).toEqual({ from: at(2026, 12, 1, 0), until: at(2027, 6, 1, 0) });
    weeks.pop();
    const fewer = pro('eq-fewer');
    earningsOf(fewer.player).equityWeeks.push(...weeks);
    healthMonth(fewer, fewer.player, at(2026, 10, 1, 1));
    expect(healthOf(fewer.player).equity).toBeUndefined();
  });

  it('counts months without cover in California, and not in New York', () => {
    const la = pro('uncovered-la', 'us-ca-losangeles');
    healthMonth(la, la.player, at(2027, 3, 1, 1));
    healthMonth(la, la.player, at(2027, 4, 1, 1));
    expect(healthOf(la.player).uncoveredInCalifornia[2027]).toBe(2);
    const ny = pro('uncovered-ny');
    healthMonth(ny, ny.player, at(2027, 3, 1, 1));
    expect(healthOf(ny.player).uncoveredInCalifornia[2027]).toBeUndefined();
  });
});

describe('Connecticut', () => {
  it('pays unemployment on 40 times the benefit, the two best quarters over 26, from its floor to $721, with no waiting week', () => {
    // ($4,000 + $3,908) / 2 / 26 = $152.07: $152, and $6,080 of base-period wages asked.
    expect(monetary('ct', [4_000_00, 3_908_00, 0, 0], 'USD', 2026)).toMatchObject({ ok: true, weekly: 152_00, maxTotal: 152_00 * 26 });
    // Under 40 times the floor, nothing: $1,500 against 40 times $44.
    expect(monetary('ct', [1_000_00, 500_00, 0, 0], 'USD', 2026).ok).toBe(false);
    // The floor, $44 in 2026 and $45 in 2027, and the frozen maximum.
    expect(monetary('ct', [1_000_00, 800_00, 0, 0], 'USD', 2026)).toMatchObject({ ok: true, weekly: 44_00 });
    expect(monetary('ct', [1_000_00, 800_00, 0, 0], 'USD', 2027)).toMatchObject({ ok: true, weekly: 45_00 });
    expect(monetary('ct', [50_000_00, 50_000_00, 0, 0], 'USD', 2027).weekly).toBe(CONNECTICUT_UI.maximum);
    // A week with work: the benefit less two-thirds of the pay, and nothing at one and a half times it.
    const ct = claimOf('ct', 300_00);
    expect(weekBenefit(ct, 5, 0)).toBe(300_00);
    expect(weekBenefit(ct, 5, 150_00)).toBe(200_00);
    expect(weekBenefit(ct, 5, 100_40)).toBe(300_00 - 67_00);
    expect(weekBenefit(ct, 5, 449_00)).toBe(0);
    expect(weekBenefit(ct, 5, 450_00)).toBe(0);
    // Filed from New Haven, the first week is paid.
    const sim = pro('ct-claim', 'us-ct-newhaven');
    for (const q of ['2025-1', '2025-2', '2025-3', '2025-4']) earningsOf(sim.player).quarters[q] = { wages: 8_000_00, sag: 0 };
    sim.must({ kind: 'benefits.claim', payload: {} });
    expect(unemploymentOf(sim.player).claim).toMatchObject({ state: 'ct', waited: true, weekly: 307_00 });
    play(sim, sim.now + 8 * MS_DAY);
    expect(unemploymentOf(sim.player).claim!.paid).toBe(307_00);
    // A New Haven actor whose base period was paid for New York work claims in New York, as an interstate claim is.
    const commuter = pro('ct-ny-claim', 'us-ct-newhaven');
    for (const q of ['2025-1', '2025-2', '2025-3', '2025-4']) earningsOf(commuter.player).quarters[q] = { wages: 8_000_00, sag: 0, byState: { 'us-ny': 8_000_00 } };
    expect(claimStateFor(commuter.player, commuter.now)).toBe('ny');
    // Wages recorded keep the state they were earned in.
    const paid = pro('ct-ny-wages', 'us-ct-newhaven');
    recordWages(paid.player, at(2026, 5, 1), NY, { gross: 5_000_00, where: 'us-ny-newyork', employer: 'x' });
    expect(earningsOf(paid.player).quarters['2026-2']!.byState).toEqual({ 'us-ny': 5_000_00 });
    commuter.must({ kind: 'benefits.claim', payload: {} });
    expect(unemploymentOf(commuter.player).claim!.state).toBe('ny');
  });

  it('covers a low month by HUSKY D, to 175% of last year’s poverty line by Covered Connecticut, and above it by Access Health CT', () => {
    const sim = pro('ct-cover', 'us-ct-newhaven');
    const p = sim.player;
    earningsOf(p).months['2026-05'] = 1_500_00;
    expect(programFor(p, at(2026, 6, 2))).toEqual({ kind: 'medicaid', band: 'low' });
    earningsOf(p).months['2026-05'] = 2_250_00;
    expect(programFor(p, at(2026, 6, 2))).toEqual({ kind: 'essential', band: 'low' });
    earningsOf(p).months['2026-05'] = 2_300_00;
    expect(programFor(p, at(2026, 6, 2))).toBeUndefined();
    earningsOf(p).months['2026-09'] = 5_000_00;
    expect(mayEnroll(p, at(2026, 10, 25)).ok).toBe(true);
    expect(mayEnroll(p, at(2026, 10, 20)).why).toMatch(/23 October to 15 January/);
    expect(benchmarkFor('ct', 2026, 'USD')).toBe(706_00);
    expect(benchmarkFor('ct', 2027, 'USD')).toBe(786_00);
    // Enrolled in Covered Connecticut, care costs nothing and renews every six months from 2027.
    // Last month's income, the month before the save's start.
    earningsOf(p).months['2025-12'] = 2_250_00;
    expect(zonedParts(sim.now, NY)).toMatchObject({ year: 2026, month: 1 });
    sim.must({ kind: 'health.enroll', payload: {} });
    const h = healthOf(p);
    expect(h.program).toMatchObject({ kind: 'essential', state: 'ct' });
    expect(planKey(p, h.program!.from + MS_HOUR)).toBe('covered-ct');
    expect(shareOf(p, 'stay', h.program!.from + MS_HOUR)).toBe(0);
    // HUSKY D renews every six months from January 2027, where New York's wait until March.
    h.program = { ...h.program!, kind: 'medicaid', renewAt: at(2027, 1, 1, 0) };
    earningsOf(p).months['2026-12'] = 1_000_00;
    healthMonth(sim, p, at(2027, 1, 1, 1));
    expect(h.program.renewAt).toBe(at(2027, 7, 1, 0));
    // HUSKY D asks no copay at the pharmacy, where New York's Medicaid asks a dollar.
    h.program = { ...h.program!, kind: 'medicaid' };
    expect(planKey(p, h.program.from + MS_HOUR)).toBe('essential-low');
    // The marketplace plan: the deductible, then $1,500 for the stay; insulin at Connecticut's $25.
    delete h.program;
    h.marketplace = { from: at(2027, 1, 1, 0), state: 'ct' };
    expect(planKey(p, at(2027, 2, 1))).toBe('marketplace-ct');
    expect(shareOf(p, 'stay', at(2027, 2, 1))).toBe(PLANS['marketplace-ct']!.deductible + 1_500_00);
    expect(insulinShareOf(p, at(2027, 2, 2))).toBeLessThanOrEqual(INSULIN.connecticutCap);
  });
});

describe('unemployment', () => {
  it('New York: two quarters, $3,500 in one, one and a half times; the high quarter over 26 or 25, $143 to $869', () => {
    expect(monetary('ny', [10_000_00, 5_000_00, 3_000_00, 2_000_00])).toMatchObject({ ok: true, weekly: 384_00 });
    expect(monetary('ny', [3_500_00, 2_000_00, 1_000_00, 500_00])).toMatchObject({ ok: true, weekly: 140_00 });
    expect(monetary('ny', [40_000_00, 20_000_00, 20_000_00, 10_000_00]).weekly).toBe(NEW_YORK_UI.maximum);
    expect(monetary('ny', [9_000_00, 0, 0, 0]).ok).toBe(false);
    expect(monetary('ny', [3_400_00, 3_000_00, 0, 0]).ok).toBe(false);
    expect(monetary('ny', [10_000_00, 3_000_00, 0, 0]).ok).toBe(false);
    // Two quarters over $4,000: the two highest averaged.
    expect(monetary('ny', [10_000_00, 6_000_00, 0, 0]).weekly).toBe(307_00);
  });

  it('California: $1,300 in a quarter, or $900 and one and a quarter times; $40 to $450; at most half the base period', () => {
    expect(monetary('ca', [5_200_00, 0, 0, 0])).toMatchObject({ ok: true, weekly: 200_00, maxTotal: 2_600_00 });
    expect(monetary('ca', [20_000_00, 20_000_00, 20_000_00, 20_000_00])).toMatchObject({ weekly: 450_00, maxTotal: 450_00 * 26 });
    expect(monetary('ca', [1_000_00, 300_00, 0, 0]).ok).toBe(true);
    expect(monetary('ca', [1_000_00, 0, 0, 0]).ok).toBe(false);
  });

  it('pays a week with work by New York’s hours, or nothing at the maximum; California less its earnings past the disregard', () => {
    const ny = claimOf('ny', 400_00);
    expect([0, 12, 18, 25, 31].map((h) => weekBenefit(ny, h, 100_00))).toEqual([400_00, 300_00, 200_00, 100_00, 0]);
    expect(weekBenefit(ny, 10, 869_00)).toBe(0);
    const ca = claimOf('ca', 400_00);
    expect(weekBenefit(ca, 0, 0)).toBe(400_00);
    expect(weekBenefit(ca, 8, 80_00)).toBe(400_00 - (80_00 - 25_00));
    expect(weekBenefit(ca, 8, 400_00)).toBe(400_00 - (400_00 - 100_00));
    expect(weekBenefit(ca, 8, 2_000_00)).toBe(0);
  });

  it('is claimed where they live when the wages’ state isn’t kept, on the base period, with an unpaid waiting week, and paid as income', () => {
    const sim = pro('claim');
    const person = sim.player;
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(false);
    for (const q of ['2025-1', '2025-2', '2025-3', '2025-4']) earningsOf(person).quarters[q] = { wages: 10_000_00, sag: 0 };
    expect(basePeriodFor(person, 'ny', sim.now).quarters).toEqual(['2024-4', '2025-1', '2025-2', '2025-3']);
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(true);
    expect(unemploymentOf(person).claim!.weekly).toBe(384_00);
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(false);
    play(sim, sim.now + 8 * MS_DAY);
    expect(unemploymentOf(person).claim).toMatchObject({ waited: true, paid: 0 });
    play(sim, sim.now + 14 * MS_DAY);
    expect(unemploymentOf(person).claim!.paid).toBe(2 * 384_00);
    expect(yearOf(person, 2026).unemployment).toBe(2 * 384_00);
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Unemployment insurance')).every((t) => t.category === 'benefit')).toBe(true);
    // Out of the state and abroad, it went on as an interstate claim and paid nothing a week abroad, until the journeys
    // went in the scope reset of 2026-10-09: where they are is where they live now.
  });
});

describe('the tax return', () => {
  it('is due 15 April, or the next business day with Emancipation Day observed', () => {
    const day = (y: number) => zonedParts(deadline(y), NY);
    expect([2026, 2027, 2028, 2029, 2030].map((y) => `${day(y).month}/${day(y).day}`)).toEqual(['4/15', '4/18', '4/17', '4/15', '4/15']);
  });

  it('keeps a student’s work-study out of the quarters unemployment reads', () => {
    const sim = pro('ws');
    recordWages(sim.player, at(2026, 6, 1), NY, { gross: 3_000_00, workStudy: true });
    expect(earningsOf(sim.player).quarters).toEqual({});
    expect(yearOf(sim.player, 2026).workStudy).toBe(3_000_00);
  });

  it('works out the year: income tax where they lived, payroll on the acting wages, less what was withheld', () => {
    const sim = pro('figures');
    const person = sim.player;
    recordWages(person, at(2026, 5, 1), NY, { gross: 40_000_00, withheld: 6_000_00, sag: true, employer: 'a' });
    recordWages(person, at(2026, 6, 1), NY, { gross: 3_000_00, workStudy: true });
    const f = figuresFor(person, 2026);
    const all = computeAnnualTax(43_000_00, 'us-ny-newyork', at(2026, 12, 31, 12));
    expect(f.incomeTax).toBe(all.federal + all.regional + all.local);
    expect(f.payroll).toBe(computeAnnualTax(40_000_00, 'us-ny-newyork', at(2026, 12, 31, 12)).payroll);
    expect(f.balance).toBe(f.incomeTax + f.payroll - 6_000_00);
  });

  it('leaves unemployment out of California’s tax, and counts it in New York’s', () => {
    const la = pro('ui-ca', 'us-ca-losangeles');
    recordWages(la.player, at(2026, 5, 1), 'America/Los_Angeles', { gross: 30_000_00 });
    recordBenefit(la.player, at(2026, 8, 1), 'America/Los_Angeles', 5_000_00);
    const withUi = figuresFor(la.player, 2026);
    const t = computeAnnualTax(35_000_00, 'us-ca-losangeles', at(2026, 12, 31, 12));
    const state = computeAnnualTax(30_000_00, 'us-ca-losangeles', at(2026, 12, 31, 12)).regional;
    expect(withUi.incomeTax).toBe(t.federal + state + t.local);
  });

  it('takes a qualifying performing artist’s commission and dues off income', () => {
    const sim = pro('qpa');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 8_000_00, commission: 800_00, dues: 200_00, employer: 'a' });
    recordWages(sim.player, at(2026, 6, 1), NY, { gross: 6_000_00, commission: 600_00, dues: 150_00, employer: 'b' });
    expect(figuresFor(sim.player, 2026).deduction).toBe(1_750_00);
    // One employer, however much it cost: none.
    const one = pro('qpa-one');
    recordWages(one.player, at(2026, 5, 1), NY, { gross: 14_000_00, commission: 1_400_00, dues: 400_00, employer: 'a' });
    expect(figuresFor(one.player, 2026).deduction).toBe(0);
    // Two, with the costs at a tenth or under: none.
    const cheap = pro('qpa-cheap');
    recordWages(cheap.player, at(2026, 5, 1), NY, { gross: 7_000_00, commission: 700_00, employer: 'a' });
    recordWages(cheap.player, at(2026, 6, 1), NY, { gross: 7_000_00, commission: 700_00, employer: 'b' });
    expect(figuresFor(cheap.player, 2026).deduction).toBe(0);
  });

  it('takes Yale New Haven’s charity off an uninsured Connecticut patient’s hospital bill: free to 250% of the poverty line, 67% off to 550%', () => {
    const bill = (seed: string, city: string, yearly: number) => {
      const sim = pro(seed, city);
      const months = earningsOf(sim.player).months;
      for (const k of Object.keys(months)) delete months[k];
      months['2025-12'] = yearly;
      return shareOf(sim.player, 'stay', sim.now);
    };
    const line = byYear(POVERTY_LINE, 2026);
    const full = bill('ct-rich', 'us-ct-newhaven', Math.round(line * 7));
    expect(full).toBeGreaterThan(0);
    expect(bill('ct-low', 'us-ct-newhaven', Math.round(line * 2))).toBe(0);
    expect(bill('ct-mid', 'us-ct-newhaven', Math.round(line * 4))).toBe(Math.round(full * 0.33));
    // Not a New Yorker's: New York's own rule frees under 200% and no more.
    expect(bill('ny-mid', 'us-ny-newyork', Math.round(line * 4))).toBe(full);
  });

  it('takes it off an insured Connecticut patient’s hospital bill on an application before it’s due, and not twice', () => {
    const sim = pro('ct-aid', 'us-ct-newhaven');
    const line = byYear(POVERTY_LINE, 2026);
    const months = earningsOf(sim.player).months;
    for (const k of Object.keys(months)) delete months[k];
    months['2025-12'] = Math.round(line * 4);
    const bill = { id: 'mx1', at: sim.now, what: 'A stay in hospital', amount: 1_000_00, dueAt: sim.now + 30 * MS_DAY, hospital: true, cityId: 'us-ct-newhaven' };
    healthOf(sim.player).bills.push(bill);
    expect(sim.must<{ aid: string }>({ kind: 'health.apply_aid', payload: { billId: 'mx1' } }).aid).toBe('discount');
    expect(bill.amount).toBe(330_00);
    expect(sim.execute({ kind: 'health.apply_aid', payload: { billId: 'mx1' } }).ok).toBe(false);
    // Not a New York hospital's, nor one already screened.
    healthOf(sim.player).bills.push({ ...bill, id: 'mx2', cityId: 'us-ny-newyork' }, { ...bill, id: 'mx3', aid: 'screened' as const });
    expect(sim.execute({ kind: 'health.apply_aid', payload: { billId: 'mx2' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'health.apply_aid', payload: { billId: 'mx3' } }).error).toMatch(/charity is off it already/);
  });

  it('adds Connecticut’s 2026 assistance: half of what the expired credits would have paid over 400% of the poverty line, and none elsewhere', () => {
    const at450 = Math.round(4.5 * 15_650_00);
    const figures = (seed: string, city: string, gross: number) => {
      const sim = pro(seed, city);
      recordWages(sim.player, at(2026, 5, 1), NY, { gross });
      healthOf(sim.player).premiums[2026] = [1_200_00, 1_200_00];
      return figuresFor(sim.player, 2026);
    };
    const ct = figures('ct-tpa', 'us-ct-newhaven', at450);
    // No federal credit over 400%; the enhanced one would have been the premium less 8.5% of income.
    expect(ct.credit).toBe(0);
    expect(ct.stateAssistance).toBe(Math.round(2 * Math.round(1_200_00 - (0.085 * at450) / 12) * 0.5));
    expect(figures('ny-tpa', 'us-ny-newyork', at450).stateAssistance).toBeUndefined();
    // At 350% the federal credit stands and Connecticut adds nothing.
    expect(figures('ct-350', 'us-ct-newhaven', Math.round(3.5 * 15_650_00)).stateAssistance).toBeUndefined();
  });

  it('gives back the premium tax credit, and adds California’s penalty for months without cover', () => {
    const sim = pro('credit');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    healthOf(sim.player).premiums[2026] = [940_00, 940_00];
    const pct = applicablePercent(2026, 40_000_00 / 15_650_00)!;
    expect(figuresFor(sim.player, 2026).credit).toBe(2 * Math.round(940_00 - (pct * 40_000_00) / 12));
    expect(applicablePercent(2026, 4.2)).toBeUndefined();
    expect(applicablePercent(2026, 3.5)).toBe(0.0996);
    const la = pro('mandate', 'us-ca-losangeles');
    recordWages(la.player, at(2026, 5, 1), 'America/Los_Angeles', { gross: 60_000_00 });
    healthOf(la.player).uncoveredInCalifornia[2026] = 3;
    expect(figuresFor(la.player, 2026).mandate).toBe(3 * Math.round(Math.max(CALIFORNIA_MANDATE.flat, 0.025 * 60_000_00) / 12));
    // A high income's 2.5% is capped at the average bronze plan.
    const rich = pro('mandate-rich', 'us-ca-losangeles');
    recordWages(rich.player, at(2026, 5, 1), 'America/Los_Angeles', { gross: 300_000_00 });
    healthOf(rich.player).uncoveredInCalifornia[2026] = 2;
    expect(figuresFor(rich.player, 2026).mandate).toBe(2 * CALIFORNIA_MANDATE.bronzeMonth);
  });

  it('adds the late penalties to a balance filed late, and at least $525 past 60 days', () => {
    const due = deadline(2026);
    expect(latePenalty(10_000_00, due, due - 1)).toBe(0);
    expect(latePenalty(10_000_00, due, due + 10 * MS_DAY)).toBe(Math.round(10_000_00 * 0.05));
    expect(latePenalty(1_000_00, due, due + 70 * MS_DAY)).toBe(Math.round(1_000_00 * 0.005 * 3) + RETURN.lateMinimum);
    expect(latePenalty(100_00, due, due + 70 * MS_DAY)).toBe(Math.round(100_00 * 0.005 * 3) + 100_00);
    expect(latePenalty(-500_00, due, due + 400 * MS_DAY)).toBe(0);
  });

  it('is ready in February, filed for a refund 21 days on, or a balance from the bank, or owed', () => {
    const sim = pro('file');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00, withheld: 20_000_00 });
    play(sim, at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.balance).toBeLessThan(0);
    expect(Object.values(sim.universe.decisions).some((d) => d.refType === 'return' && d.actions[0]?.commandKind === 'tax.file')).toBe(true);
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(true);
    expect(r.refundAt! - sim.now).toBe(RETURN.refundDays * MS_DAY);
    play(sim, r.refundAt! + MS_HOUR);
    expect(sim.universe.transactions.find((t) => t.memo === 'Tax refund, 2026')!.postings[0]!.amount).toBe(-r.figures.balance);
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(false);

    const owe = pro('owe');
    recordWages(owe.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    play(owe, at(2027, 2, 1, 12));
    for (const a of Object.values(owe.universe.accounts)) if (a.ownerId === owe.player.id && a.balance > 0) a.balance = 0;
    expect(owe.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(true);
    const o = returnsOf(owe.player)['2026']!;
    expect(o.owed).toBe(o.figures.balance);
    expect(owe.execute({ kind: 'tax.pay', payload: { year: 2026 } }).ok).toBe(false);
  }, 60_000);
});
