/**
 * A television of one's own (`systems/televisions.ts`, `content/tvcatalog.ts`,
 * from 2026-10-05): the sets sold where they live at the shop's price with the
 * place's tax, bought and kept as the home's TV with its model, and watching it
 * billed at its label's on-mode power, or the catalog's middle where none.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { salesTaxRate } from '@/engine/content/tax';
import { TV_PRODUCTS } from '@/engine/content/tvcatalog';
import { inSaveMoney } from '@/engine/systems/banking';
import { owns } from '@/engine/systems/furniture';
import { GENERIC_TV_WATTS, buyTvRefusal, tvAtHome, tvCatalog, watchPower } from '@/engine/systems/televisions';
import { itemsOf } from '@/engine/systems/items';
import { SERVICES } from '@/engine/content/homelife';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a television', () => {
  it('is sold where you live, cheapest first, at its price with the place’s tax', () => {
    const sim = life('us-ny-newyork', 'tv-shop');
    const shop = tvCatalog(sim, sim.player);
    expect(shop.length).toBeGreaterThan(0);
    expect(shop.every((x) => x.offer.market === 'us')).toBe(true);
    expect(shop.map((x) => x.price)).toEqual([...shop.map((x) => x.price)].sort((a, b) => a - b));
    const one = shop[0]!;
    expect(one.price).toBe(inSaveMoney(sim, Math.round(one.offer.price * (1 + salesTaxRate('us-ny-newyork', sim.now, 'goods')) * 100), one.offer.currency));
    const abroad = TV_PRODUCTS.flatMap((p) => p.offers).find((o) => o.market !== 'us');
    if (abroad) expect(buyTvRefusal(sim.player, abroad.id)).toBe('It’s sold in another country.');
    expect(buyTvRefusal(sim.player, 'nothing')).toBe('That isn’t on sale.');
  });

  it('is bought as the home’s TV, its model kept, and watched on the bill at its own power', () => {
    const sim = life('us-ny-newyork', 'tv-buy');
    const shop = tvCatalog(sim, sim.player);
    const labeled = shop.find((x) => typeof x.product.attrs.onModeWatts === 'number') ?? shop[0]!;
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const r = sim.must<{ paid: number; itemId: string }>({ kind: 'tv.buy', payload: { offerId: labeled.offer.id } });
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(r.paid);
    expect(r.paid).toBe(labeled.price);
    const tv = itemsOf(sim.player).find((i) => i.id === r.itemId)!;
    expect(tv.kind).toBe('furniture:tv');
    expect(tv.spec).toMatchObject({ product: labeled.product.id, offer: labeled.offer.id });
    expect(owns(sim.player, 'tv')).toBe(true);
    const watts = typeof labeled.product.attrs.onModeWatts === 'number' ? labeled.product.attrs.onModeWatts : GENERIC_TV_WATTS!;
    expect(tvAtHome(sim.player)!.watts).toBe(watts);
    // Two hours on it.
    const was = sim.player.living?.extraKwh ?? 0;
    expect(watchPower(sim.player, 120)).toBeCloseTo((watts * 2) / 1000, 9);
    expect((sim.player.living?.extraKwh ?? 0) - was).toBeCloseTo((watts * 2) / 1000, 9);
  });

  it('draws the catalog’s middle where the set has no model, and nothing without a set', () => {
    const sim = life('uk-eng-london', 'tv-generic');
    expect(watchPower(sim.player, 60)).toBe(0);
    expect(GENERIC_TV_WATTS).toBeDefined();
    sim.player.items = [...(sim.player.items ?? []), { id: 'old-tv', kind: 'furniture:tv', label: 'TV', quantity: 1, condition: 1, at: { kind: 'home', home: itemsOf(sim.player).find((i) => i.at.kind === 'home')?.at.kind === 'home' ? (itemsOf(sim.player).find((i) => i.at.kind === 'home')!.at as { home: string }).home : 'x', spot: 'floor' }, acquiredAt: sim.now }];
    if (tvAtHome(sim.player)) expect(watchPower(sim.player, 60)).toBeCloseTo(GENERIC_TV_WATTS! / 1000, 9);
  });

  it('is refused for a home that isn’t theirs to furnish', () => {
    const sim = life('us-ny-newyork', 'tv-away');
    const one = tvCatalog(sim, sim.player)[0]!;
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(buyTvRefusal(sim.player, one.offer.id)).toBe('A television is bought where you live, for a home of your own.');
  });

  it('has every set’s power: its label’s, ENERGY STAR’s, or its screen’s area at their median, marked an estimate', () => {
    expect(TV_PRODUCTS.every((p) => typeof p.attrs.onModeWatts === 'number' && p.attrs.onModeWatts > 0)).toBe(true);
    const area = (d: number) => (d * d * 144) / 337;
    const est = TV_PRODUCTS.filter((p) => p.attrs.powerBasis === 'estimate');
    expect(est.length).toBeGreaterThan(0);
    // The median watts a square inch of ENERGY STAR's sets, the same for every estimate.
    const per = est.map((p) => (p.attrs.onModeWatts as number) / area(p.attrs.sizeIn as number));
    for (const x of per) expect(x).toBeCloseTo(0.0699, 2);
    expect(TV_PRODUCTS.some((p) => p.attrs.powerBasis === 'ENERGY STAR on mode')).toBe(true);
    // The generic set's draw leaves the estimates out.
    const labeled = TV_PRODUCTS.filter((p) => p.attrs.powerBasis !== 'estimate').map((p) => p.attrs.onModeWatts as number).sort((a, b) => a - b);
    expect(GENERIC_TV_WATTS).toBe(labeled[labeled.length >> 1]);
  });

  it('bills an hour of a program watched on it at its own power', () => {
    const sim = life('us-ny-newyork', 'tv-watch');
    const one = tvCatalog(sim, sim.player)[0]!;
    sim.must({ kind: 'tv.buy', payload: { offerId: one.offer.id } });
    sim.must({ kind: 'home.subscribe', payload: { id: SERVICES.find((x) => x.market === 'us' && x.service === 'Amazon Prime')!.id } });
    const was = sim.player.living?.extraKwh ?? 0;
    const r = sim.must<{ watched: number }>({ kind: 'tv.watch', payload: { programmeId: 'us-reacher', to: 'hour' } });
    expect((sim.player.living?.extraKwh ?? 0) - was).toBeCloseTo((tvAtHome(sim.player)!.watts! * r.watched) / 60 / 1000, 9);
  });
});
