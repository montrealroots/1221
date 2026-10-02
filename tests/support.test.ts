/**
 * The children after their parents part, and child support
 * (`systems/support.ts`, `content/support.ts`, from 2026-10-02).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { CT_SCHEDULE } from '@/engine/content/ctsupport';
import { californiaK } from '@/engine/content/support';
import { childBenefit, childrenOf, raisingMonth } from '@/engine/systems/children';
import { contactsOf, partnerStays } from '@/engine/systems/people';
import { recordWages } from '@/engine/systems/earnings';
import { supportLines, supportMonthly } from '@/engine/systems/support';

const AT = Date.UTC(2027, 5, 1);
const YEAR = 365.2425 * MS_DAY;

describe('the formulas', () => {
  it('in New York are the CSSA’s share of combined income to its cap, the paying parent’s part', () => {
    expect(supportMonthly('us-ny', 1, 100_000, 50_000, 'us-ny-newyork', AT)).toBeCloseTo((0.17 * 100_000) / 12, 6);
    expect(supportMonthly('us-ny', 2, 100_000, 0, 'us-ny-newyork', AT)).toBeCloseTo((0.25 * 100_000) / 12, 6);
    expect(supportMonthly('us-ny', 1, 300_000, 0, 'us-ny-newyork', AT)).toBeCloseTo((0.17 * 193_000) / 12, 6);
    expect(supportMonthly('us-ny', 7, 100_000, 0, 'us-ny-newyork', AT)).toBeCloseTo((0.35 * 100_000) / 12, 6);
  });

  it('in California are K by the band times the payer’s net, and 1.6 for two', () => {
    expect(californiaK(2_000)).toBeCloseTo(0.165 + 2_000 / 82_857, 9);
    expect(californiaK(4_000)).toBeCloseTo(0.131 + 4_000 / 42_149, 9);
    expect(californiaK(7_000)).toBe(0.25);
    expect(californiaK(12_000)).toBeCloseTo(0.1 + 1_499 / 12_000, 9);
    expect(californiaK(20_000)).toBeCloseTo(0.12 + 1_200 / 20_000, 9);
    const one = supportMonthly('us-ca', 1, 90_000, 40_000, 'us-ca-losangeles', AT)!;
    expect(supportMonthly('us-ca', 2, 90_000, 40_000, 'us-ca-losangeles', AT)).toBeCloseTo(one * 1.6, 6);
    expect(supportMonthly('us-ca', 6, 90_000, 40_000, 'us-ca-losangeles', AT)).toBeCloseTo(one * 2.3, 6);
    expect(one).toBeGreaterThan(0);
  });

  it('in Connecticut read the 2026 schedule', () => {
    expect(CT_SCHEDULE.find((r) => r[0] === 1_000)!.slice(1)).toEqual([0.2305, 0.3495, 0.4206, 0.4698, 0.5168, 0.5618]);
    const one = supportMonthly('us-ct', 1, 80_000, 80_000, 'us-ct-newhaven', AT)!;
    expect(supportMonthly('us-ct', 2, 80_000, 80_000, 'us-ct-newhaven', AT)!).toBeGreaterThan(one * 1.4);
    // Half the combined income, half the obligation.
    expect(supportMonthly('us-ct', 1, 80_000, 0, 'us-ct-newhaven', AT)!).toBeGreaterThan(one);
  });

  it('in England are the CMS’s rates on the payer’s gross week, and £7 at £200 or less', () => {
    expect(supportMonthly('uk', 1, 52 * 1_000, 0, 'uk-eng-london', AT)).toBeCloseTo(((0.12 * 800 + 0.09 * 200) * 52) / 12, 6);
    expect(supportMonthly('uk', 3, 52 * 500, 0, 'uk-eng-london', AT)).toBeCloseTo((0.19 * 500 * 52) / 12, 6);
    expect(supportMonthly('uk', 1, 52 * 5_000, 0, 'uk-eng-london', AT)).toBeCloseTo(((0.12 * 800 + 0.09 * 2_200) * 52) / 12, 6);
    expect(supportMonthly('uk', 1, 52 * 150, 0, 'uk-eng-london', AT)).toBeCloseTo((7 * 52) / 12, 6);
  });

  it('in Ontario and British Columbia are the federal tables between their points', () => {
    expect(supportMonthly('ca-08', 1, 50_000, 0, 'ca-on-toronto', AT)).toBe(450);
    expect(supportMonthly('ca-08', 1, 60_000, 0, 'ca-on-toronto', AT)).toBeCloseTo(450 + (245 * 10) / 25, 9);
    expect(supportMonthly('ca-08', 1, 200_000, 0, 'ca-on-toronto', AT)).toBeCloseTo(1_327 + 0.0076 * 50_000, 9);
    expect(supportMonthly('ca-08', 3, 100_000, 0, 'ca-on-toronto', AT)).toBeCloseTo((1_517 * 2_781) / 2_135, 9);
    expect(supportMonthly('ca-02', 2, 125_000, 0, 'ca-bc-vancouver', AT)).toBe(1_893);
    expect(supportMonthly('ca-08', 1, 15_000, 0, 'ca-on-toronto', AT)).toBe(120);
  });

  it('in Mexico City are lawyers’ practice on net income; in Ireland, none', () => {
    const one = supportMonthly('mx', 1, 300_000, 0, 'mx-cmx-mexicocity', AT)!;
    expect(supportMonthly('mx', 2, 300_000, 0, 'mx-cmx-mexicocity', AT)).toBeCloseTo((one * 0.275) / 0.175, 6);
    expect(supportMonthly('mx', 4, 300_000, 0, 'mx-cmx-mexicocity', AT)).toBeCloseTo((one * 0.4) / 0.175, 6);
    expect(supportMonthly('ie', 1, 60_000, 0, 'ie-lei-dublin', AT)).toBeUndefined();
    expect(supportMonthly('us-ny', 0, 60_000, 0, 'us-ny-newyork', AT)).toBe(0);
  });
});

describe('a separation with a child', () => {
  const family = (seed: string) => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
    const c = { id: 'ex', name: 'Alex Ex', cityId: 'us-ny-newyork', born: sim.now - 30 * YEAR, met: { how: 'work', at: sim.now }, hours: 0, memory: [], income: { annual: 60_000, currency: 'USD', employed: true } } as never as ReturnType<typeof contactsOf>[number];
    contactsOf(sim.player).push(c);
    childrenOf(sim.player).push({ id: 'kid', name: 'Kid', born: sim.now - 5 * YEAR, otherParentId: 'ex' });
    const year = zonedParts(sim.now, sim.homeZone).year;
    recordWages(sim.player, instantFromZoned({ year: year - 1, month: 3, day: 1, hour: 12, minute: 0 }, sim.homeZone), sim.homeZone, { gross: 120_000_00 });
    return { sim, c };
  };
  const usd = (sim: ReturnType<typeof quickSave>, n: number) => { const c = Math.round(n * 100); return saveCurrency(sim.universe) === 'USD' ? c : exchange(c, 'USD', saveCurrency(sim.universe))!; };

  it('with you, their other parent pays you; you raise them', () => {
    const { sim } = family('support-with-you');
    const lines = supportLines(sim, sim.player, sim.now);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.amount).toBe(usd(sim, (0.17 * 60_000) / 12));
    expect(raisingMonth(sim, sim.player, sim.now)).toBeGreaterThan(0);
  });

  it('staying with them when you move away, you pay them, and their raising isn’t yours', () => {
    const { sim, c } = family('support-with-them');
    c.livesWith = sim.now;
    sim.player.home = { ...sim.player.home!, cityId: 'us-ca-losangeles' };
    partnerStays(sim, sim.player);
    expect(childrenOf(sim.player)[0]!.livesWith).toBe('them');
    const lines = supportLines(sim, sim.player, sim.now);
    expect(lines[0]!.amount).toBe(-usd(sim, (0.17 * 120_000) / 12));
    expect(raisingMonth(sim, sim.player, sim.now)).toBe(0);
  });

  it('runs to the age the place’s support runs to: 21 in New York', () => {
    const { sim } = family('support-until');
    childrenOf(sim.player)[0]!.born = sim.now - 20.5 * YEAR;
    expect(supportLines(sim, sim.player, sim.now)).toHaveLength(1);
    childrenOf(sim.player)[0]!.born = sim.now - 21.5 * YEAR;
    expect(supportLines(sim, sim.player, sim.now)).toHaveLength(0);
  });
});

describe('support’s edges', () => {
  const family = (city: string, seed: string) => {
    const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
    const c = { id: 'ex', name: 'Alex Ex', cityId: city, born: sim.now - 30 * YEAR, met: { how: 'work', at: sim.now }, hours: 0, memory: [], income: { annual: 60_000, currency: 'USD', employed: true } } as never as ReturnType<typeof contactsOf>[number];
    contactsOf(sim.player).push(c);
    childrenOf(sim.player).push({ id: 'kid', name: 'Kid', born: sim.now - 5 * YEAR, otherParentId: 'ex' });
    return { sim, c };
  };
  it('isn’t paid between a married couple living apart, nor by a former partner with no work', () => {
    const married = family('us-ny-newyork', 'support-married');
    married.sim.player.marriage = { contactId: 'ex', at: married.sim.now, worthAt: 0 };
    expect(supportLines(married.sim, married.sim.player, married.sim.now)).toHaveLength(0);
    const idle = family('us-ny-newyork', 'support-idle');
    idle.c.income = { annual: 60_000, currency: 'USD', employed: false };
    expect(supportLines(idle.sim, idle.sim.player, idle.sim.now)).toHaveLength(0);
  });

  it('leaves the state’s child benefit to the parent the child lives with', () => {
    const { sim } = family('ie-lei-dublin', 'support-benefit');
    const before = childBenefit(sim, sim.player, sim.now);
    expect(before).toBeGreaterThan(0);
    childrenOf(sim.player)[0]!.livesWith = 'them';
    expect(childBenefit(sim, sim.player, sim.now)).toBe(0);
  });
});
