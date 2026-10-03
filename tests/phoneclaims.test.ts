/**
 * A phone damaged or stolen (`systems/phones.ts`, from 2026-10-03): at the
 * odds a survey publishes where they live, repaired at AppleCare+'s fee or
 * the maker's own price, replaced only under theft and loss cover, and a
 * maker's plan approved on the record as a card is.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { PHONE_PROTECTION } from '@/engine/content/phones';
import { APPROVE_FROM, INQUIRY } from '@/engine/systems/cardlife';
import { PHONE_DAYS, claimQuote, phoneById, phonesOf, phonesOnSale, plansFor, riskFor } from '@/engine/systems/phones';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const into = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const iphone16 = 'us-apple-iphone-16-128';

function bought(sim: Simulation, phoneId: string) {
  const p = phoneById(phoneId)!;
  sim.must({ kind: 'phone.buy', payload: { phoneId, color: p.colors[0] } });
  sim.advanceBy(PHONE_DAYS * MS_DAY + 60_000);
  return phonesOf(sim.player).find((x) => x.device.phoneId === phoneId)!;
}

describe('a phone damaged', () => {
  it('is repaired at the maker’s out-of-warranty price, or AppleCare+’s fee for the incident', () => {
    const sim = life('us-ny-newyork', 'claim-ny');
    const owned = bought(sim, iphone16);
    const tax = 1 + salesTaxRate('us-ny-newyork', sim.now, 'general');
    expect(claimQuote(sim, sim.player, owned)).toBe('It isn’t damaged.');
    owned.device.broken = 'screen';
    expect(claimQuote(sim, sim.player, owned)).toBe(into(sim, Math.round(279 * tax * 100), 'USD'));
    owned.device.broken = 'other';
    expect(claimQuote(sim, sim.player, owned)).toBe(into(sim, Math.round(619 * tax * 100), 'USD'));
    // A cracked phone isn't traded in at the working one's value.
    const next = phonesOnSale(sim, sim.player).find((p) => p.maker === 'Apple' && p.id !== iphone16)!;
    expect(sim.execute({ kind: 'phone.buy', payload: { phoneId: next.id, color: next.colors[0], tradeInItemId: owned.id } }).error).toBe('Apple’s trade-in value is for one in working order.');
    const cover = PHONE_PROTECTION.find((x) => x.market === 'us' && x.maker === 'Apple' && x.theftAndLoss && x.models.includes('iPhone 16'))!;
    sim.must({ kind: 'phone.protect', payload: { itemId: owned.id, plan: cover.plan } });
    expect(claimQuote(sim, sim.player, owned)).toBe(into(sim, 99_00, 'USD'));
    owned.device.broken = 'screen';
    expect(claimQuote(sim, sim.player, owned)).toBe(into(sim, 29_00, 'USD'));
    expect(sim.must<{ paid: number }>({ kind: 'phone.claim', payload: { itemId: owned.id } }).paid).toBe(into(sim, 29_00, 'USD'));
    expect(owned.device.broken).toBeUndefined();
  });

  it('happens in America at Allstate’s odds, and is stolen there and in England, but nowhere a survey is silent', () => {
    expect(riskFor(life('us-ny-newyork', 'risk-ny').player)).toMatchObject({ damagedYear: 0.31, screenShare: 0.67, stolenYear: 0.05 });
    expect(riskFor(life('uk-eng-london', 'risk-ldn').player)).toMatchObject({ damagedYear: null, stolenYear: 0.0054 });
    expect(riskFor(life('ca-on-toronto', 'risk-to').player)).toBeUndefined();
    // The ONS's is England's and Wales's, not Scotland's.
    expect(riskFor(life('uk-sct-edinburgh', 'risk-edi').player)).toBeUndefined();
    // Two years in use in New York: about half are damaged or stolen in that time (1 − 0.69² × 0.95²).
    let hit = 0;
    for (const seed of ['r1', 'r2', 'r3', 'r4', 'r5', 'r6']) {
      const sim = life('us-ny-newyork', seed);
      const owned = bought(sim, iphone16);
      sim.must({ kind: 'phone.activate', payload: { itemId: owned.id } });
      for (let m = 0; m < 24 && !owned.device.broken && owned.device.stolen === undefined; m += 1) sim.advanceBy(30 * MS_DAY);
      if (owned.device.broken || owned.device.stolen !== undefined) hit += 1;
    }
    expect(hit).toBeGreaterThan(0);
    expect(hit).toBeLessThan(6);
  });
});

describe('a phone stolen', () => {
  it('is replaced only under theft and loss cover, at Apple’s fee, two a year', () => {
    const sim = life('us-ny-newyork', 'claim-theft');
    const owned = bought(sim, iphone16);
    owned.device.stolen = sim.now;
    expect(sim.execute({ kind: 'phone.activate', payload: { itemId: owned.id } }).error).toBe('It was stolen.');
    expect(claimQuote(sim, sim.player, owned)).toBe('Only cover with theft and loss replaces a stolen phone.');
    owned.device.protection = { plan: 'AppleCare+ with Theft and Loss', monthly: 0, batteryFee: 0 };
    expect(sim.must<{ paid: number }>({ kind: 'phone.claim', payload: { itemId: owned.id } }).paid).toBe(into(sim, 149_00, 'USD'));
    expect(owned.device.stolen).toBeUndefined();
    owned.device.stolen = sim.now;
    sim.must({ kind: 'phone.claim', payload: { itemId: owned.id } });
    owned.device.stolen = sim.now;
    expect(claimQuote(sim, sim.player, owned)).toBe('The cover replaces two a year, and both have been claimed.');
    // Cover without theft and loss doesn't.
    const ie = life('ie-lei-dublin', 'claim-ie');
    const mine = bought(ie, 'ie-apple-iphone-16-128');
    ie.must({ kind: 'phone.protect', payload: { itemId: mine.id, plan: 'AppleCare+' } });
    mine.device.stolen = ie.now;
    expect(claimQuote(ie, ie.player, mine)).toBe('Only cover with theft and loss replaces a stolen phone.');
  });
});

describe('a maker’s plan', () => {
  it('is credit: an inquiry on the record, and declined below a card’s approval', () => {
    const sim = life('us-ny-newyork', 'plan-credit');
    const galaxy = phonesOnSale(sim, sim.player).find((p) => p.maker === 'Samsung' && plansFor(p).some((x) => x.months.includes(24)))!;
    const plan = plansFor(galaxy).find((x) => x.months.includes(24))!.plan.name;
    const order = { phoneId: galaxy.id, color: galaxy.colors[0], plan, months: 24 };
    sim.player.credit!.score = APPROVE_FROM + INQUIRY - 1;
    expect(sim.execute({ kind: 'phone.buy', payload: order }).error).toBe(`${plan} declined it: your record isn’t strong enough.`);
    sim.player.credit!.score = 700;
    sim.must({ kind: 'phone.buy', payload: order });
    expect(sim.player.credit!.score).toBe(700 - INQUIRY);
  });
});
