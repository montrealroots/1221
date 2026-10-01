/**
 * Having and raising a child (`systems/children.ts`, `content/children.ts`,
 * from 2026-10-01): PRESTO's chance by the carrier's age, the birth's cost
 * where it happens, a self-employed parent's leave pay, the cost of raising
 * shared as the bills are, each country's child benefit, and America's
 * Child Tax Credit on the return.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { PREGNANCY_DAYS, conceptionChance } from '@/engine/content/children';
import { recordWages } from '@/engine/systems/earnings';
import { figuresFor } from '@/engine/systems/taxreturn';
import { metAtWork, type Contact } from '@/engine/systems/people';
import { birthCost, childBenefit, childTaxCredit, childrenOf, mayConceive, raisingMonth, tryRefusal, type Child } from '@/engine/systems/children';

const YEAR = 365.2425 * MS_DAY;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const together = (sim: Simulation, city: string, carries: boolean, income: Contact['income'] = { annual: 40_000, currency: 'USD', employed: true }): Contact => {
  sim.player.home = { ...sim.player.home!, kind: 'own', cityId: city };
  const c = metAtWork(sim, sim.player, city, `k-${city}`, 'A Job');
  c.dating = { since: sim.now, dates: 9, couple: sim.now };
  c.livesWith = sim.now;
  c.income = income;
  if (carries) c.carries = true; else delete c.carries;
  c.born = sim.now - 30 * YEAR;
  return c;
};
const child = (sim: Simulation, years: number): Child => { const k = { id: `k${years}`, name: 'A Child', born: sim.now - years * YEAR }; childrenOf(sim.player).push(k); return k; };

describe('conceiving', () => {
  it('is PRESTO’s chance by the carrier’s age, and none past 45', () => {
    const cycle = (share: number, n: number) => 1 - Math.pow(1 - share, 1 / n);
    expect(conceptionChance(22)).toBeCloseTo(cycle(0.793, 12), 12);
    expect(conceptionChance(29)).toBeCloseTo(cycle(0.62, 6), 12);
    expect(conceptionChance(38)).toBeCloseTo(cycle(0.674, 12), 12);
    expect(conceptionChance(33.5)).toBeCloseTo((cycle(0.62, 6) + cycle(0.674, 12)) / 2, 12);
    expect(conceptionChance(46)).toBe(0);
  });

  it('is tried by a couple living together where one can carry, and drawn monthly', () => {
    const sim = life('us-ny-newyork', 'ch-try');
    sim.player.pronouns = 'he/him';
    expect(tryRefusal(sim.player)).toMatch(/partner you live with/);
    const c = together(sim, 'us-ny-newyork', false);
    expect(tryRefusal(sim.player)).toMatch(/Neither of you can carry/);
    c.carries = true;
    expect(tryRefusal(sim.player)).toBeUndefined();
    expect(sim.execute({ kind: 'social.try_for_child', payload: { trying: true } }).ok).toBe(true);
    expect(mayConceive(sim, sim.player, sim.now, 0)).toBe(false);
    expect(mayConceive(sim, sim.player, sim.now, 1)).toBe(true);
    expect(sim.player.pregnancy).toEqual({ carrier: 'them', contactId: c.id, due: sim.now + PREGNANCY_DAYS * MS_DAY });
    expect(tryRefusal(sim.player)).toBe('A child is on the way.');
    // Your own pronouns make you the carrier.
    sim.player.pronouns = 'she/her';
    delete sim.player.pregnancy;
    mayConceive(sim, sim.player, sim.now + 1, 1);
    expect(sim.player.pregnancy!.carrier).toBe('you');
  });
});

describe('the birth', () => {
  it('costs America’s insured or uninsured figures, a caesarean at its rate, and nothing in Britain', () => {
    const ny = life('us-ny-newyork', 'ch-cost');
    const c = together(ny, 'us-ny-newyork', true);
    expect(birthCost(ny, ny.player, 'them', c, ny.now, 0)).toEqual({ amount: inSave(ny, 2_563, 'USD'), caesarean: false });
    expect(birthCost(ny, ny.player, 'them', c, ny.now, 1)).toEqual({ amount: inSave(ny, 3_071, 'USD'), caesarean: true });
    c.income = { annual: 0, currency: 'USD', employed: false };
    expect(birthCost(ny, ny.player, 'them', c, ny.now, 0).amount).toBe(inSave(ny, 27_372, 'USD'));
    const ldn = life('uk-eng-london', 'ch-nhs');
    const d = together(ldn, 'uk-eng-london', true, { annual: 30_000, currency: 'GBP', employed: true });
    expect(birthCost(ldn, ldn.player, 'them', d, ldn.now, 1).amount).toBe(0);
  });

  it('brings the child, ends the trying, and pays Britain’s Maternity Allowance to a self-employed mother', () => {
    const sim = life('uk-eng-london', 'ch-born');
    sim.player.pronouns = 'she/her';
    together(sim, 'uk-eng-london', false, { annual: 30_000, currency: 'GBP', employed: true });
    expect(sim.execute({ kind: 'social.try_for_child', payload: { trying: true } }).ok).toBe(true);
    mayConceive(sim, sim.player, sim.now, 1);
    sim.advanceTo(sim.player.pregnancy!.due + 60_000);
    expect(childrenOf(sim.player)).toHaveLength(1);
    expect(sim.player.trying).toBeUndefined();
    sim.advanceBy(40 * 7 * MS_DAY);
    const paid = sim.universe.transactions.filter((t) => t.memo === 'Maternity Allowance');
    expect(paid).toHaveLength(39);
  });
});

describe('raising a child', () => {
  it('costs the published year by age, a month at a time, shared as the bills are', () => {
    const sim = life('us-ny-newyork', 'ch-raise');
    child(sim, 3);
    expect(raisingMonth(sim, sim.player, sim.now)).toBe(inSave(sim, 310_605 / 17 / 12, 'USD'));
    together(sim, 'us-ny-newyork', true);
    expect(raisingMonth(sim, sim.player, sim.now)).toBe(Math.round(inSave(sim, 310_605 / 17 / 12, 'USD') * 0.5));
    // Grown at eighteen, and costs nothing more.
    childrenOf(sim.player)[0]!.born = sim.now - 18.5 * YEAR;
    expect(raisingMonth(sim, sim.player, sim.now)).toBe(0);
  });

  it('brings each country’s child benefit by its rules', () => {
    const ldn = life('uk-eng-london', 'ch-cb');
    child(ldn, 2); child(ldn, 5);
    expect(childBenefit(ldn, ldn.player, ldn.now)).toBe(inSave(ldn, (27.05 + 17.9) * 52 / 12, 'GBP'));
    // The higher earner at £70,000: half of it taken back.
    together(ldn, 'uk-eng-london', true, { annual: 70_000, currency: 'GBP', employed: true });
    expect(childBenefit(ldn, ldn.player, ldn.now)).toBe(inSave(ldn, (27.05 + 17.9) * 52 / 12 * 0.5, 'GBP'));
    const du = life('ie-lei-dublin', 'ch-ie');
    child(du, 1);
    expect(childBenefit(du, du.player, du.now)).toBe(inSave(du, 140, 'EUR'));
    const to = life('ca-on-toronto', 'ch-ca');
    child(to, 2);
    together(to, 'ca-on-toronto', true, { annual: 60_000, currency: 'CAD', employed: true });
    expect(childBenefit(to, to.player, to.now)).toBe(inSave(to, (8_157 - (60_000 - 38_237) * 0.07) / 12, 'CAD'));
    const mx = life('mx-cmx-mexicocity', 'ch-mx');
    child(mx, 8);
    expect(childBenefit(mx, mx.player, mx.now)).toBe(inSave(mx, 2_500 / 12, 'MXN'));
  });

  it('in America is the Child Tax Credit on the return, refundable to $1,700 where there’s no tax to take it off', () => {
    const year = (sim: Simulation) => zonedParts(sim.now, sim.homeZone).year;
    const federal = (pay: number, kids: number) => {
      const sim = life('us-ny-newyork', 'ch-ctc');
      for (let i = 0; i < kids; i += 1) childrenOf(sim.player).push({ id: `c${i}`, name: 'A Child', born: instantFromZoned({ year: year(sim) - 3, month: 1, day: 1, hour: 12, minute: 0 }, sim.homeZone) });
      recordWages(sim.player, instantFromZoned({ year: year(sim), month: 3, day: 1, hour: 12, minute: 0 }, sim.homeZone), sim.homeZone, { gross: pay });
      return figuresFor(sim.player, year(sim)).federal;
    };
    expect(federal(100_000_00, 0) - federal(100_000_00, 1)).toBe(2_200_00);
    expect(federal(10_000_00, 1)).toBe(-1_700_00);
    expect(childTaxCredit({ children: [{ id: 'a', name: 'A', born: Date.UTC(2024, 0, 1) }] } as never, 2026, 210_000_00, false, 'USD').credit).toBe(2_200_00 - 10 * 50_00);
  });
});

describe('the family’s month', () => {
  it('pays the cost of raising, brings the benefit, and draws the trying couple’s chance', () => {
    const sim = life('uk-eng-london', 'ch-month');
    together(sim, 'uk-eng-london', true, { annual: 30_000, currency: 'GBP', employed: true });
    child(sim, 2);
    expect(sim.execute({ kind: 'social.try_for_child', payload: { trying: true } }).ok).toBe(true);
    sim.advanceBy(32 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'Child benefit')).toBe(true);
    expect(sim.universe.transactions.some((t) => t.memo === 'Raising the children, your share')).toBe(true);
    // A carrier of thirty, three years of months: a child on the way, or born.
    for (let m = 0; m < 36 && !sim.player.pregnancy && childrenOf(sim.player).length < 2; m += 1) sim.advanceBy(31 * MS_DAY);
    expect(Boolean(sim.player.pregnancy) || childrenOf(sim.player).length > 1).toBe(true);
  });

  it('costs nothing for a grown child, at eighteen, wherever they live', () => {
    const sim = life('uk-eng-london', 'ch-grown');
    child(sim, 18.5);
    expect(raisingMonth(sim, sim.player, sim.now)).toBe(0);
    expect(childBenefit(sim, sim.player, sim.now)).toBe(0);
  });
});
