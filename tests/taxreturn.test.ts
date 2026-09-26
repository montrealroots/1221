/**
 * What's settled after the tax year (`content/taxreturn.ts`,
 * `systems/taxreturn.ts`): the year's real tax on its real pay, the benefit
 * taxed where the law taxes it, the credits a low-paid worker gets only on
 * the return, and the difference from what was withheld, paid back or asked
 * for on the country's own date.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { franceIncomeTax, payrollYear, spainCuota } from '@/engine/content/payroll';
import { primeActivite } from '@/engine/systems/topup';
import { zonedParts } from '@/engine/core/time';
import {
  SETTLEMENTS, calEitc, canadaWorkers, koreaEarnedIncome, nyHouseholdCredit, nzIndependentEarner, quebecWorkPremium, settleYear, spainMinimumWage, usEitc, type YearFigures,
} from '@/engine/content/taxreturn';
import { layOff } from '@/engine/systems/work';

const at = Date.UTC(2026, 5, 1);
const year = (path: string[], wages: number, extra: Partial<YearFigures> = {}): YearFigures => ({ wages, benefits: [], age: 30, path, at, benefitMonths: 0, rent: 0, savings: 0, ...extra });
const taxOn = (iso: string, path: string[], wages: number) =>
  payrollYear(iso, wages * 100, { path, at, age: 30 }).lines.filter((l) => l.kind === 'tax').reduce((sum, l) => sum + l.amount / 100, 0);

describe('the credits on a return', () => {
  it('works the US earned income tax credit for no children, 2026', () => {
    expect(usEitc(year(['US'], 8_680), 0)).toBeCloseTo(664, 6);
    expect(usEitc(year(['US'], 5_000), 0)).toBeCloseTo(382.5, 6);
    expect(usEitc(year(['US'], 15_000), 0)).toBeCloseTo(664 - 0.0765 * 4_140, 6);
    expect(usEitc(year(['US'], 19_540), 0)).toBeCloseTo(0, 6);
    // Under 25 there's none; unemployment benefit counts toward the phase-out.
    expect(usEitc(year(['US'], 8_680, { age: 24 }), 0)).toBe(0);
    expect(usEitc(year(['US'], 8_680), 5_000)).toBeCloseTo(664 - 0.0765 * (13_680 - 10_860), 6);
  });

  it('works the Canada Workers Benefit, Spain’s minimum-wage deduction and New Zealand’s earner credit', () => {
    expect(canadaWorkers(year(['CA'], 3_000))).toBe(0);
    expect(canadaWorkers(year(['CA'], 20_000))).toBe(1_665);
    expect(canadaWorkers(year(['CA'], 30_000))).toBeCloseTo(1_665 - 0.15 * 2_608, 6);
    // EI is net income: it takes the benefit down, though it isn't working income.
    expect(canadaWorkers(year(['CA'], 25_000, { benefits: [{ name: 'Employment Insurance', amount: 5_000 }] }))).toBeCloseTo(1_665 - 0.15 * 2_608, 6);
    expect(spainMinimumWage(17_000)).toBeCloseTo(590.89, 6);
    expect(spainMinimumWage(18_000)).toBeCloseTo(590.89 - 0.2 * 906, 6);
    expect(spainMinimumWage(20_100)).toBe(0);
    expect(nzIndependentEarner(year(['NZ'], 23_000))).toBe(0);
    expect(nzIndependentEarner(year(['NZ'], 30_000))).toBe(520);
    expect(nzIndependentEarner(year(['NZ'], 30_000, { benefitMonths: 2 }))).toBeCloseTo(520 * 10 / 12, 6);
    expect(nzIndependentEarner(year(['NZ'], 68_000))).toBeCloseTo(260, 6);
  });
});

describe('settling a year', () => {
  it('gives back what a half year had withheld as if it were a whole one', () => {
    const gb = SETTLEMENTS.GB!;
    // A full year's withholding on £40,000 settled on the £20,000 really earned.
    const withheld = taxOn('GB', ['GB'], 40_000) / 2;
    const settled = settleYear(gb, year(['GB'], 20_000), withheld);
    expect(settled.owed).toBeCloseTo(taxOn('GB', ['GB'], 20_000), 6);
    expect(settled.refund).toBeCloseTo(withheld - taxOn('GB', ['GB'], 20_000), 6);
    expect(settled.refund).toBeGreaterThan(0);
    // A steady year settles to nothing.
    expect(settleYear(gb, year(['GB'], 20_000), taxOn('GB', ['GB'], 20_000)).refund).toBeCloseTo(0, 6);
  });

  it('taxes Jobseeker’s Allowance in Britain and not Universal Credit', () => {
    const gb = SETTLEMENTS.GB!;
    const base = taxOn('GB', ['GB'], 20_000);
    expect(settleYear(gb, year(['GB'], 20_000, { benefits: [{ name: 'Universal Credit', amount: 2_000 }] }), base).owed).toBeCloseTo(base, 6);
    expect(settleYear(gb, year(['GB'], 20_000, { benefits: [{ name: 'New Style Jobseeker’s Allowance', amount: 2_000 }] }), base).owed).toBeCloseTo(taxOn('GB', ['GB'], 22_000), 6);
  });

  it('raises Germany’s rate on the wages for tax-free Arbeitslosengeld, and taxes only the wages', () => {
    const de = SETTLEMENTS.DE!;
    const plain = settleYear(de, year(['DE'], 20_000), 0).owed;
    const withAlg = settleYear(de, year(['DE'], 20_000, { benefits: [{ name: 'Arbeitslosengeld', amount: 5_000 }] }), 0).owed;
    expect(withAlg).toBeGreaterThan(plain);
    expect(withAlg).toBeCloseTo(taxOn('DE', ['DE'], 25_000) * 20_000 / 25_000, 6);
  });

  it('taxes US unemployment benefit federally and not in New York’s own tax', () => {
    const path = ['US', 'US-NY'];
    const line = (wages: number, name: string) => payrollYear('US', wages * 100, { path, at, age: 30 }).lines.find((l) => l.name === name)!.amount / 100;
    const settled = settleYear(SETTLEMENTS.US!, year(path, 20_000, { benefits: [{ name: 'Unemployment Insurance', amount: 5_000 }] }), 0);
    expect(settled.owed).toBeCloseTo(line(25_000, 'Federal Income Tax') + line(20_000, 'New York State Income Tax'), 6);
  });

  it('never takes a deduction past the tax, so a minimum wage in Spain owes nothing', () => {
    expect(spainCuota(16_000)).toBeLessThan(spainMinimumWage(16_000));
    expect(settleYear(SETTLEMENTS.ES!, year(['ES'], 16_000), 300).owed).toBe(0);
  });

  it('charges Spain’s cuota less the minimum-wage deduction, and adds Iceland’s 2.5%', () => {
    const es = settleYear(SETTLEMENTS.ES!, year(['ES'], 18_000), 500);
    expect(es.owed).toBeCloseTo(Math.max(0, spainCuota(18_000) - spainMinimumWage(18_000)), 6);
    expect(es.refund).toBeCloseTo(500 - es.owed, 6);
    const is = settleYear(SETTLEMENTS.IS!, year(['IS'], 4_000_000), taxOn('IS', ['IS'], 4_000_000) + 10_000);
    expect(is.refund).toBeCloseTo(10_250, 4);
  });

  it('holds Ontario’s LIFT credit to Ontario’s tax, and pays the Canada Workers Benefit on top', () => {
    const on = SETTLEMENTS['CA-08']!;
    const path = ['CA', 'CA-08'];
    const settled = settleYear(on, year(path, 20_000), 0);
    const lift = settled.credits.find((c) => c.name === 'Ontario LIFT Credit')!;
    const ontario = payrollYear('CA', 20_000 * 100, { path, at, age: 30 }).lines.find((l) => l.name === 'Ontario Income Tax')!.amount / 100;
    expect(lift.amount).toBeCloseTo(Math.min(875, 0.0505 * 20_000, ontario), 6);
    expect(settled.refund).toBeCloseTo(-settled.owed + 1_665, 6);
  });
});

describe('a played year', () => {
  it('pays Toronto’s refund once, in mid-May, with the Canada Workers Benefit', () => {
    const sim = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'return-toronto');
    sim.advanceTo(Date.UTC(2027, 4, 14, 12));
    expect(sim.player.earnings?.lastReturn).toBeUndefined();
    sim.advanceTo(Date.UTC(2027, 4, 16, 12));
    const settled = sim.player.earnings!.lastReturn!;
    expect(settled.year).toBe('2026-01-01');
    expect(settled.credits.some((c) => c.name === 'Canada Workers Benefit')).toBe(true);
    const refunds = () => sim.universe.transactions.filter((t) => t.category === 'tax');
    expect(refunds()).toHaveLength(1);
    expect(refunds()[0]!.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(settled.refund);
    sim.advanceBy(3 * MS_DAY);
    expect(refunds()).toHaveLength(1);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('settles Japan’s year in December for somebody in work, and in April for somebody not', () => {
    const tokyo = () => quickSave({ startLocationId: 'jp-13-tokyo', homeRegionId: 'jp-13-tokyo', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'return-tokyo');
    const working = tokyo();
    working.advanceTo(Date.UTC(2027, 0, 1, 12));
    expect(working.player.earnings?.lastReturn?.name).toBe('年末調整');
    const adjusted = working.player.earnings!.lastReturn!.at;
    // The final return's date doesn't settle the same year again.
    working.advanceTo(Date.UTC(2027, 3, 16, 12));
    expect(working.player.earnings!.lastReturn!.at).toBe(adjusted);
    const left = tokyo();
    // Two weeks' notice from 1 December ends the job before the year does.
    left.advanceTo(Date.UTC(2026, 11, 1));
    left.must({ kind: 'work.quit', payload: {} });
    left.advanceTo(Date.UTC(2027, 0, 2, 12));
    expect(left.player.earnings?.lastReturn).toBeUndefined();
    left.advanceTo(Date.UTC(2027, 3, 16, 12));
    expect(left.player.earnings?.lastReturn?.year).toBe('2026-01-01');
  });

  it('gives a US worker laid off mid-year the earned income tax credit on a smaller year', () => {
    const sim = quickSave({ startLocationId: 'us-tx-houston', homeRegionId: 'us-tx-houston', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'return-houston');
    sim.advanceTo(Date.UTC(2026, 4, 1));
    layOff(sim, sim.player);
    sim.must({ kind: 'work.quit', payload: {} });
    sim.advanceTo(Date.UTC(2027, 2, 3, 12));
    const settled = sim.player.earnings!.lastReturn!;
    expect(settled.credits.find((c) => c.name === 'Earned Income Tax Credit')?.amount ?? 0).toBeGreaterThan(0);
    expect(settled.refund).toBeGreaterThanOrEqual(settled.withheld);
  });
});

describe('the credits from the second research pass', () => {
  it('works New York’s household credit and its 30% of the federal credit', () => {
    expect(nyHouseholdCredit(4_000)).toBe(75);
    expect(nyHouseholdCredit(15_000)).toBe(45);
    expect(nyHouseholdCredit(27_000)).toBe(20);
    expect(nyHouseholdCredit(30_000)).toBe(0);
    const path = ['US', 'US-NY'];
    const settled = settleYear(SETTLEMENTS['US-NY']!, year(path, 9_000), 0);
    const federal = usEitc(year(path, 9_000), 0);
    const nyTax = payrollYear('US', 9_000 * 100, { path, at, age: 30 }).lines.find((l) => l.name === 'New York State Income Tax')?.amount ?? 0;
    const household = Math.min(45, nyTax / 100);
    expect(settled.credits.find((c) => c.name === 'New York Earned Income Credit')?.amount ?? 0).toBeCloseTo(Math.max(0, 0.3 * federal - household), 6);
  });

  it('reads California’s credit off its table, and Quebec’s work premium off its rates', () => {
    expect(calEitc(4_700, 4_700, 30)).toBe(302);
    expect(calEitc(2_500, 2_500, 30)).toBeCloseTo(160.5, 6);
    expect(calEitc(12_500, 12_500, 30)).toBeCloseTo(188, 6);
    expect(calEitc(33_000, 33_000, 30)).toBe(0);
    expect(calEitc(10_000, 40_000, 30)).toBe(0);
    expect(calEitc(4_700, 4_700, 17)).toBe(0);
    expect(quebecWorkPremium(10_000, 10_000)).toBeCloseTo(0.116 * 7_600, 6);
    expect(quebecWorkPremium(15_000, 15_000)).toBeCloseTo(1_207.33 - 0.1 * 2_192, 6);
    expect(quebecWorkPremium(30_000, 30_000)).toBe(0);
  });

  it('takes Ireland’s rent credit off income tax, 20% of rent to €1,000', () => {
    const ie = SETTLEMENTS.IE!;
    const tax = taxOn('IE', ['IE'], 45_000);
    expect(settleYear(ie, year(['IE'], 45_000, { rent: 3_000 }), tax).refund).toBeCloseTo(600, 6);
    expect(settleYear(ie, year(['IE'], 45_000, { rent: 12_000 }), tax).refund).toBeCloseTo(1_000, 6);
    // Never more than the income tax there is to take it off.
    const paye = payrollYear('IE', 21_000 * 100, { path: ['IE'], at, age: 30 }).lines.find((l) => l.name === 'PAYE')!.amount / 100;
    expect(paye).toBeLessThan(1_000);
    expect(settleYear(ie, year(['IE'], 21_000, { rent: 12_000 }), taxOn('IE', ['IE'], 21_000)).refund).toBeCloseTo(paye, 6);
  });

  it('works Korea’s earned income credit for a single household, by pay and savings', () => {
    expect(koreaEarnedIncome(2_000_000, 0)).toBeCloseTo(825_000, 6);
    expect(koreaEarnedIncome(6_000_000, 0)).toBe(1_650_000);
    expect(koreaEarnedIncome(15_000_000, 0)).toBeCloseTo(1_650_000 - 6_000_000 * 165 / 1_300, 6);
    expect(koreaEarnedIncome(22_000_000, 0)).toBe(0);
    expect(koreaEarnedIncome(6_000_000, 200_000_000)).toBe(825_000);
    expect(koreaEarnedIncome(6_000_000, 250_000_000)).toBe(0);
  });

  it('settles Seoul’s year with February’s pay and pays the earned income credit at the end of September', () => {
    const seoul = quickSave({ startLocationId: 'kr-11-seoul', homeRegionId: 'kr-11-seoul', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'return-seoul');
    seoul.advanceTo(Date.UTC(2027, 1, 26, 12));
    expect(seoul.player.earnings?.lastReturn?.name).toBe('연말정산');
    seoul.advanceTo(Date.UTC(2027, 9, 1, 12));
    expect(seoul.universe.transactions.some((t) => t.category === 'tax' && t.memo.startsWith('근로장려금'))).toBe(true);
    expect(seoul.ledger.audit()).toEqual([]);
  });
});

describe('France, Mexico and Australia', () => {
  it('works France’s tax with its 10% deduction and décote, and the prime d’activité by its formula', () => {
    expect(franceIncomeTax(20_000)).toBeCloseTo(704 - (897 - 0.4525 * 704), 6);
    expect(franceIncomeTax(12_000)).toBe(0);
    // €1,170 net in a month, at the SMIC of €12.31: the bonus is part-way.
    const bonus = 240.63 * (1_170 - 59 * 12.31) / (79 * 12.31);
    expect(primeActivite(1_170, 0, 12.31)).toBeCloseTo(638.28 + 0.5985 * 1_170 + bonus - 1_170, 6);
    // ARE counts against it; nothing under €15, nothing without earnings.
    expect(primeActivite(1_170, 500, 12.31)).toBe(0);
    const full = primeActivite(1_170, 0, 12.31);
    expect(primeActivite(1_170, full - 10, 12.31)).toBe(0);
    expect(primeActivite(1_170, full - 20, 12.31)).toBeCloseTo(20, 6);
    expect(primeActivite(0, 0, 12.31)).toBe(0);
    expect(primeActivite(2_000, 0, 12.31)).toBeCloseTo(638.28 + 0.5985 * 2_000 + 240.63 - 2_000, 6);
  });

  it('pays Paris’s prime d’activité on the 5th, and takes a French balance due in September, not July', () => {
    const paris = quickSave({ startLocationId: 'fr-idf-paris', homeRegionId: 'fr-idf-paris', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'return-paris');
    paris.advanceTo(Date.UTC(2026, 5, 6, 12));
    const tops = paris.universe.transactions.filter((t) => t.category === 'topup');
    expect(tops.length).toBeGreaterThan(0);
    expect(tops.every((t) => zonedParts(t.at, paris.homeZone).day === 5)).toBe(true);
    // An ARE of €15,000 in 2026, taxable and never withheld: a balance due.
    paris.post({ memo: 'Allocation d’aide au retour à l’emploi', category: 'benefit', postings: [
      { accountId: paris.nominalAccount('income', 'Unemployment Benefit').id, amount: -15_000_00 },
      { accountId: paris.player.primaryAccountId!, amount: 15_000_00 },
    ] });
    paris.advanceTo(Date.UTC(2027, 7, 2, 12));
    expect(paris.universe.transactions.some((t) => t.category === 'tax')).toBe(false);
    paris.advanceTo(Date.UTC(2027, 8, 26, 12));
    const due = paris.universe.transactions.find((t) => t.category === 'tax')!;
    expect(due.postings.find((p) => p.accountId === paris.player.primaryAccountId)!.amount).toBeLessThan(0);
    expect(paris.ledger.audit()).toEqual([]);
  });

  it('settles Australia’s year to June in November', () => {
    const sydney = quickSave({ startLocationId: 'au-nsw-sydney', homeRegionId: 'au-nsw-sydney', livesWhereBorn: true, dayJob: true, wealth: 'modest', birthYear: 1994 }, 'return-sydney');
    sydney.advanceTo(Date.UTC(2026, 10, 15, 12));
    expect(sydney.player.earnings!.lastReturn!.year).toBe('2025-07-01');
  });
});