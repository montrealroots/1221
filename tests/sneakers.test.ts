/**
 * Air Jordans at retail and on resale (`systems/sneakers.ts`, from
 * 2026-10-02): each retailer's offer where you live with the place's tax,
 * GOAT's new and used asks in America with its shipping, a pair that keeps
 * its style code, size and condition, and GOAT's payout when it's sold on.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { GOAT_ASKS, SNEAKERS, SNEAKER_RETAIL } from '@/engine/content/sneakers';
import { GOAT, goatPayout, sneakerOffers } from '@/engine/systems/sneakers';
import { garmentsOf } from '@/engine/systems/wardrobe';

// A life begun once the pairs read are out, the last on October 25, 2026: until its release a pair isn't offered.
const life = (city: string, seed: string, start = { startYear: 2026, startMonth: 11, startDay: 2 }) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy', ...start }, seed);
const usd = (sim: Simulation, dollars: number) => { const c = Math.round(dollars * 100); const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur)!; };
// A pair Nike US sells, not sold out, that GOAT also asks for new and used.
const pick = () => SNEAKERS.find((s) => SNEAKER_RETAIL.some((o) => o.styleCode === s.styleCode && o.market === 'US' && !o.soldOut) && GOAT_ASKS.some((a) => a.styleCode === s.styleCode && a.newAsk !== null && a.usedAsk !== null))!;

describe('a pair of Jordans', () => {
  it('is offered from its release date, at retail and on GOAT, and not before', () => {
    // A life begins on January 5, 2026; until 2026-10-05 a pair released that July was offered from its first day.
    const s = pick();
    expect(s.released! > '2026-01-05').toBe(true);
    const early = life('us-ny-newyork', 'jordans-early', { startYear: 2026, startMonth: 1, startDay: 5 });
    expect(sneakerOffers(early, early.player, s.styleCode)).toEqual([]);
    // A pair whose release date wasn't read is offered throughout.
    expect(SNEAKERS.find((x) => x.styleCode === '553558-303')!.released).toBeNull();
    expect(sneakerOffers(early, early.player, '553558-303').length).toBeGreaterThan(0);
    const [y, m, d] = s.released!.split('-').map(Number) as [number, number, number];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    expect(early.execute({ kind: 'sneakers.buy', payload: { styleCode: s.styleCode, offer: 'goat:new', size: '10' } }).error).toBe(`The ${s.name} isn’t out until ${months[m - 1]} ${d}, ${y}.`);
    // On the day it's out, both.
    const day = life('us-ny-newyork', 'jordans-day', { startYear: y, startMonth: m, startDay: d });
    const offers = sneakerOffers(day, day.player, s.styleCode);
    expect(offers.some((o) => o.seller === 'GOAT') && offers.some((o) => o.seller !== 'GOAT')).toBe(true);
  });

  it('has each offer where you live, cheapest first: the retailer’s with New York’s tax, and GOAT’s new and used with its shipping', () => {
    const sim = life('us-ny-newyork', 'jordans-offers');
    const s = pick();
    const offers = sneakerOffers(sim, sim.player, s.styleCode);
    expect(offers.map((o) => o.total)).toEqual([...offers.map((o) => o.total)].sort((a, b) => a - b));
    const ask = GOAT_ASKS.find((a) => a.styleCode === s.styleCode)!;
    const goatNew = offers.find((o) => o.key === 'goat:new')!;
    // New York's clothing and footwear exemption under $110; the city's tax on more.
    expect(goatNew.shipping).toBe(usd(sim, GOAT.buyerShipping));
    expect(goatNew.total - goatNew.shipping!).toBeGreaterThanOrEqual(usd(sim, ask.newAsk!));
    const retail = offers.find((o) => o.key.startsWith('retail:'))!;
    expect(retail.shipping).toBeNull();
    // Not in London: GOAT isn't offered, and the retail offers are Britain's.
    const ldn = life('uk-eng-london', 'jordans-ldn');
    expect(sneakerOffers(ldn, ldn.player, s.styleCode).some((o) => o.seller === 'GOAT')).toBe(false);
  });

  it('is bought at an offer in a size it has, arrives keeping its code, size and condition, and sells on GOAT for the ask less its fees', () => {
    const sim = life('us-ny-newyork', 'jordans-buy');
    const s = pick();
    const offer = sneakerOffers(sim, sim.player, s.styleCode).find((o) => o.key === 'goat:used')!;
    expect(sim.execute({ kind: 'sneakers.buy', payload: { styleCode: s.styleCode, offer: offer.key, size: '99' } }).error).toBe('Choose one of its sizes.');
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(sim.execute({ kind: 'sneakers.buy', payload: { styleCode: s.styleCode, offer: offer.key, size: '10' } }).ok).toBe(true);
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(offer.total);
    sim.advanceBy(8 * MS_DAY);
    const pair = garmentsOf(sim.player).find((g) => g.spec?.styleCode === s.styleCode)!;
    expect(pair.spec).toMatchObject({ styleCode: s.styleCode, size: '10', bought: 'used' });
    expect(pair.at.kind).toBe('home');
    // A used pair sells at the used ask.
    const q = goatPayout(sim, sim.player, pair);
    if (typeof q === 'string') throw new Error(q);
    const ask = GOAT_ASKS.find((a) => a.styleCode === s.styleCode)!.usedAsk!;
    expect(q.condition).toBe('used');
    expect(q.paid).toBe(usd(sim, Math.round(((ask * (1 - GOAT.commission) - GOAT.prepaidLabel) * (1 - GOAT.cashOut)) * 100) / 100));
    const r = sim.execute<{ paid: number }>({ kind: 'sneakers.sell', payload: { itemId: pair.id } });
    expect(r.ok, r.error).toBe(true);
    expect(garmentsOf(sim.player).some((g) => g.id === pair.id)).toBe(false);
  });

  it('won’t sell what you’re wearing, and a pair bought new and never worn sells at the new ask', () => {
    const sim = life('us-ny-newyork', 'jordans-new');
    const s = pick();
    sim.must({ kind: 'sneakers.buy', payload: { styleCode: s.styleCode, offer: 'goat:new', size: '10' } });
    sim.advanceBy(8 * MS_DAY);
    const pair = garmentsOf(sim.player).find((g) => g.spec?.styleCode === s.styleCode)!;
    const q = goatPayout(sim, sim.player, pair);
    expect(typeof q === 'string' ? q : q.condition).toBe('new');
    sim.player.wornNow = { itemIds: [pair.id], since: sim.now };
    expect(goatPayout(sim, sim.player, pair)).toBe('You’re wearing it.');
  });
});

describe('what a pair can’t do', () => {
  it('isn’t bought from a retailer read as sold out, nor sold on GOAT from outside America', () => {
    const sim = life('us-ny-newyork', 'jordans-sold-out');
    const gone = SNEAKER_RETAIL.find((o) => o.market === 'US' && o.soldOut)!;
    const offer = sneakerOffers(sim, sim.player, gone.styleCode).find((o) => o.soldOut)!;
    expect(sim.execute({ kind: 'sneakers.buy', payload: { styleCode: gone.styleCode, offer: offer.key, size: offer.sizes[0] } }).error).toMatch(/was sold out of it/);
    const ldn = life('uk-eng-london', 'jordans-ldn-sell');
    const s = pick();
    const pair = { id: 'x', kind: `sneaker:${s.styleCode}`, label: s.name, quantity: 1, condition: 1, at: { kind: 'person' as const }, acquiredAt: ldn.now, spec: { styleCode: s.styleCode, size: '10', bought: 'new' }, garment: { kind: 'shoes', slot: 'shoes' as const, care: 'hand' as const, wears: 0, washes: 0 } };
    expect(goatPayout(ldn, ldn.player, pair)).toBe('GOAT buys from sellers in America here.');
  });
});
