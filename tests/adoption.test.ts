/**
 * A child by adoption or by a surrogate (`systems/adoption.ts`,
 * `content/adoption.ts`, from 2026-10-02).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { recordWages } from '@/engine/systems/earnings';
import { figuresFor } from '@/engine/systems/taxreturn';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { ADOPTION } from '@/engine/content/adoption';
import { childrenOf } from '@/engine/systems/children';
import { adoptRefusal, adoptionCredit, monthsToMatch, pathCost } from '@/engine/systems/adoption';

const YEAR = 365.2425 * MS_DAY;
const life = (city: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.post({ memo: 'Test money', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount: 500_000_00 }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -500_000_00 }] });
  return sim;
};
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const age = (sim: Simulation, years: number) => { sim.player.birthInstant = sim.now - years * YEAR; };

describe('adoption', () => {
  it('in New York is Spence-Chapin’s newborn, matched in the months its rate gives, and the credit on the return', () => {
    const sim = life('us-ny-newyork', 'adopt-ny');
    age(sim, 30);
    expect(pathCost(sim, sim.player, 'adoption')).toBe(inSave(sim, 53_000, 'USD'));
    const r = sim.execute<{ arrives: number }>({ kind: 'social.adopt', payload: { kind: 'adoption' } });
    expect(r.ok, r.error).toBe(true);
    expect(adoptRefusal(sim, sim.player, 'adoption', sim.now)).toBe('A child is on the way already.');
    sim.advanceTo(r.value!.arrives + MS_DAY);
    const kid = childrenOf(sim.player).at(-1)!;
    expect(Math.abs(kid.born - r.value!.arrives)).toBeLessThan(MS_DAY);
    expect(sim.player.familyPath).toBeUndefined();
    const year = new Date(r.value!.arrives).getUTCFullYear();
    // The credit: the expenses to $17,670, $5,120 of it refundable; half of it halfway through the phase-out.
    expect(adoptionCredit(sim.player, year, inSave(sim, 100_000, 'USD'), 'USD')).toEqual({ credit: 17_670_00, refundable: 5_120_00 });
    expect(adoptionCredit(sim.player, year, 285_080_00, 'USD').credit).toBe(Math.round(17_670_00 * 0.5));
    expect(adoptionCredit(sim.player, year + 1, 0, 'USD')).toEqual({ credit: 0, refundable: 0 });
  });

  it('matches a newborn in about the months 63% a year gives', () => {
    const sim = life('us-ny-newyork', 'adopt-match');
    let n = 0;
    for (let k = 0; k < 2_000; k += 1) n += monthsToMatch(sim, sim.player, 0.63, k);
    const p = 1 - Math.pow(0.37, 1 / 12);
    expect(n / 2_000).toBeGreaterThan(1 / p - 1.5);
    expect(n / 2_000).toBeLessThan(1 / p + 1.5);
  });

  it('in England is the local authority’s child from care, the court’s £207, after the published wait, at the age they’re placed', () => {
    const sim = life('uk-eng-london', 'adopt-uk');
    age(sim, 30);
    expect(pathCost(sim, sim.player, 'adoption')).toBe(inSave(sim, 207, 'GBP'));
    const r = sim.execute<{ arrives: number }>({ kind: 'social.adopt', payload: { kind: 'adoption' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.arrives - sim.now).toBeCloseTo(27 * YEAR / 12, -4);
    sim.advanceTo(r.value!.arrives + MS_DAY);
    const kid = childrenOf(sim.player).at(-1)!;
    expect((r.value!.arrives - kid.born) / YEAR).toBeCloseTo(ADOPTION.uk!.childAge, 3);
  }, 60_000);

  it('asks the place’s age', () => {
    const ldn = life('uk-eng-london', 'adopt-age');
    age(ldn, 20);
    expect(adoptRefusal(ldn, ldn.player, 'adoption', ldn.now)).toBe('England asks you to be 21 to adopt.');
    const mx = life('mx-cmx-mexicocity', 'adopt-mx');
    age(mx, 24);
    expect(adoptRefusal(mx, mx.player, 'adoption', mx.now)).toBe('Mexico asks you to be 25 to adopt.');
    age(mx, 26);
    expect(adoptRefusal(mx, mx.player, 'adoption', mx.now)).toBeUndefined();
  });
});

describe('a surrogacy', () => {
  it('where it’s compensated costs Circle’s $189,500, and the child is born a pregnancy later; Ireland’s law isn’t in force', () => {
    const sim = life('us-ca-losangeles', 'surrogate-la');
    expect(pathCost(sim, sim.player, 'surrogacy')).toBe(inSave(sim, 189_500, 'USD'));
    const r = sim.execute<{ arrives: number }>({ kind: 'social.adopt', payload: { kind: 'surrogacy' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.arrives - sim.now).toBe(280 * MS_DAY);
    sim.advanceTo(r.value!.arrives + MS_DAY);
    expect(childrenOf(sim.player).at(-1)!.born).toBe(r.value!.arrives);
    expect(sim.player.adopted ?? []).toHaveLength(0);
    const dub = life('ie-lei-dublin', 'surrogate-ie');
    expect(adoptRefusal(dub, dub.player, 'surrogacy', dub.now)).toBe('Ireland’s surrogacy law isn’t in force yet.');
    const ldn = life('uk-eng-london', 'surrogate-uk');
    expect(pathCost(ldn, ldn.player, 'surrogacy')).toBe(inSave(ldn, 55_270, 'GBP'));
  }, 60_000);
});

describe('the adoption credit on the return', () => {
  it('comes off the year’s federal tax, and its refundable part is paid back where there’s no tax', () => {
    const federal = (pay: number, adopted: boolean) => {
      const sim = life('us-ny-newyork', 'adopt-return');
      const year = zonedParts(sim.now, sim.homeZone).year;
      if (adopted) sim.player.adopted = [{ at: sim.now, cost: 53_000_00, year }];
      recordWages(sim.player, instantFromZoned({ year, month: 3, day: 1, hour: 12, minute: 0 }, sim.homeZone), sim.homeZone, { gross: pay });
      return figuresFor(sim.player, year).federal;
    };
    expect(federal(150_000_00, false) - federal(150_000_00, true)).toBe(17_670_00);
    expect(federal(5_000_00, true)).toBe(-5_120_00);
  });
});

describe('a newborn’s match in New York', () => {
  it('comes the months the draw gives', () => {
    const sim = life('us-ny-newyork', 'adopt-when');
    age(sim, 30);
    const start = sim.now;
    const r = sim.execute<{ arrives: number }>({ kind: 'social.adopt', payload: { kind: 'adoption' } });
    expect(r.value!.arrives).toBe(start + monthsToMatch(sim, sim.player, 0.63, start) * (YEAR / 12));
  });
});
