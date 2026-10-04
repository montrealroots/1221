/**
 * A television of one's own (`systems/televisions.ts`, from 2026-10-04): the
 * sets sold where you live by make and the model number sold there, at the place's price, bought and
 * kept as the home's TV, and watching billed by the set's power past the
 * usual one's, which a typical household's electricity already has on.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { TV_PRODUCTS } from '@/engine/content/tvcatalog';
import { SERVICES } from '@/engine/content/homelife';
import { salesTaxRate } from '@/engine/content/tax';
import { GENERIC_TV_WATTS, buyTvRefusal, tvAtHome, tvCatalog, tvName, watchPower } from '@/engine/systems/televisions';
import { owns } from '@/engine/systems/furniture';
import { itemsOf } from '@/engine/systems/items';
import { inTheBank } from '@/engine/systems/household';
import { electricityAdjustment } from '@/engine/systems/electricity';
import { programmeById } from '@/engine/systems/programmes';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const watts = (sim: Simulation, offerId: string) => tvCatalog(sim, sim.player).find((x) => x.offer.id === offerId)!.product.attrs.onModeWatts as number;
/** The labeled sets on sale where they live, the least and the most power. */
const labeled = (sim: Simulation) => {
  const sets = tvCatalog(sim, sim.player).filter((x) => typeof x.product.attrs.onModeWatts === 'number').sort((a, b) => (a.product.attrs.onModeWatts as number) - (b.product.attrs.onModeWatts as number));
  return { least: sets[0]!, most: sets[sets.length - 1]! };
};

describe('the catalog', () => {
  it('keeps each model once, its offers in the five markets at a price read, and its power with what it is and where it was read', () => {
    expect(TV_PRODUCTS.length).toBeGreaterThan(0);
    expect(new Set(TV_PRODUCTS.map((p) => p.id)).size).toBe(TV_PRODUCTS.length);
    const offers = TV_PRODUCTS.flatMap((p) => p.offers);
    expect(new Set(offers.map((o) => o.id)).size).toBe(offers.length);
    for (const p of TV_PRODUCTS) {
      expect(p.category).toBe('televisions');
      expect(p.attrs.sizeIn as number, p.id).toBeGreaterThan(0);
      expect(p.offers.length, p.id).toBeGreaterThan(0);
      if (typeof p.attrs.onModeWatts === 'number') {
        expect(p.attrs.powerBasis, p.id).toBeTruthy();
        expect(p.attrs.powerUrl, p.id).toMatch(/^https:\/\//);
      }
      for (const o of p.offers) {
        expect(['us', 'ca', 'uk', 'ie', 'mx']).toContain(o.market);
        expect(o.price, o.id).toBeGreaterThan(0);
        // America's and Canada's prices are before tax; the others' with it.
        expect(o.taxIncluded, o.id).toBe(!['us', 'ca'].includes(o.market));
      }
    }
    // The usual set: the middle of the labeled ones.
    const all = TV_PRODUCTS.map((p) => p.attrs.onModeWatts).filter((w): w is number => typeof w === 'number').sort((a, b) => a - b);
    expect(GENERIC_TV_WATTS).toBe(all[all.length >> 1]);
  });

  it('names no panel where no page named one, and takes from a later read what an earlier one left unstated', () => {
    const tv = (id: string) => TV_PRODUCTS.find((p) => p.id === id)!;
    // Loewe's own page sells the Antares at 42 and 65 inches as an OLED; Richer Sounds' list, the only read of the 55, names no panel.
    expect(tv('loewe-antares-42').attrs.panel).toBe('OLED');
    expect(tv('loewe-antares-55').attrs.panel).toBeNull();
    // LG's own page left the C5's refresh unstated; Best Buy Canada's listing states it.
    expect(tv('lg-oled55c5pua').attrs.refreshHz).toBe(120);
    // Where both state one, the first read keeps it: Samsung's own 60 Hz for the U7900H, not Best Buy Canada's 120.
    expect(tv('samsung-un65u7900hfxzc').attrs.refreshHz).toBe(60);
  });

  it('sells where they live, cheapest first, with the place’s tax where the price is before it', () => {
    const ny = life('us-ny-newyork', 'tv-ny');
    const shop = tvCatalog(ny, ny.player);
    expect(shop.length).toBeGreaterThan(1);
    expect(shop.every((x) => x.offer.market === 'us')).toBe(true);
    for (let i = 1; i < shop.length; i += 1) expect(shop[i]!.price).toBeGreaterThanOrEqual(shop[i - 1]!.price);
    const tax = salesTaxRate('us-ny-newyork', ny.now, 'goods');
    expect(tax).toBeGreaterThan(0);
    expect(shop[0]!.price).toBe(Math.round(shop[0]!.offer.price * (1 + tax) * 100));
    const london = life('uk-eng-london', 'tv-london');
    const uk = tvCatalog(london, london.player);
    expect(uk.every((x) => x.offer.market === 'uk')).toBe(true);
    expect(uk[0]!.price).toBe(Math.round(uk[0]!.offer.price * 100));
  });
});

describe('buying one', () => {
  it('is paid from the bank, delivered and kept as the home’s TV with its model, one at a time', () => {
    const sim = life('us-ny-newyork', 'tv-buy');
    const { offer, product, price } = tvCatalog(sim, sim.player)[0]!;
    const before = inTheBank(sim, sim.player);
    const r = sim.must<{ paid: number; itemId: string }>({ kind: 'tv.buy', payload: { offerId: offer.id } });
    expect(r.paid).toBe(price);
    expect(before - inTheBank(sim, sim.player)).toBe(price);
    const item = itemsOf(sim.player).find((i) => i.id === r.itemId)!;
    expect(item).toMatchObject({ kind: 'furniture:tv', bulky: true, at: { kind: 'home', spot: 'floor' } });
    expect(item.spec?.product).toBe(product.id);
    expect(item.label).toBe(`${tvName(product, offer)}, ${product.attrs.sizeIn}-Inch`);
    // It's the TV a film or television lover unwinds with.
    expect(owns(sim.player, 'tv')).toBe(true);
    expect(tvAtHome(sim.player)?.product?.id).toBe(product.id);
    expect(sim.execute({ kind: 'tv.buy', payload: { offerId: offer.id } }).error).toBe('You have one.');
  });

  it('is refused for another country’s offer, one not on sale, or a color it isn’t offered in', () => {
    const sim = life('us-ny-newyork', 'tv-refuse');
    const abroad = TV_PRODUCTS.flatMap((p) => p.offers).find((o) => o.market === 'uk')!;
    expect(buyTvRefusal(sim.player, abroad.id)).toBe('It’s sold in another country.');
    expect(sim.execute({ kind: 'tv.buy', payload: { offerId: 'no-such-set' } }).error).toBe('That isn’t on sale.');
    const here = tvCatalog(sim, sim.player)[0]!;
    expect(sim.execute({ kind: 'tv.buy', payload: { offerId: here.offer.id, color: 'Not A Color' } }).error).toBe('It isn’t offered in that color.');
    // Away from home, it waits until they're back.
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(buyTvRefusal(sim.player, here.offer.id)).toBe('A television is bought where you live, for a home of your own.');
  });
});

describe('its name', () => {
  it('is the model number it’s sold under where they live, a region’s where it differs from the maker’s', () => {
    // A set sold in America under its own model and in Britain under another.
    const both = TV_PRODUCTS.find((p) => p.offers.some((o) => o.market === 'uk' && o.model) && p.offers.some((o) => o.market === 'us'))!;
    const uk = both.offers.find((o) => o.market === 'uk' && o.model)!;
    expect(uk.model).not.toBe(both.model);
    const london = life('uk-eng-london', 'tv-name');
    const there = tvCatalog(london, london.player).find((x) => x.offer.id === uk.id)!;
    expect(tvName(there.product, there.offer)).toBe(`${both.brand} ${uk.model}`);
    const r = london.must<{ itemId: string }>({ kind: 'tv.buy', payload: { offerId: uk.id } });
    expect(itemsOf(london.player).find((i) => i.id === r.itemId)!.label).toBe(`${both.brand} ${uk.model}, ${both.attrs.sizeIn}-Inch`);
    const ny = life('us-ny-newyork', 'tv-name-ny');
    const us = tvCatalog(ny, ny.player).find((x) => x.product.id === both.id)!;
    expect(tvName(us.product, us.offer)).toBe(`${both.brand} ${both.model}`);
  });
});

describe('a model read under a region’s code', () => {
  it('is the one product, its offer there named by that code, and no second product of it', () => {
    const code = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Best Buy Canada reads Samsung's UN40F6000FFXZA as UN40F6000FFXZC, Canada's code for it.
    const read = TV_PRODUCTS.flatMap((p) => p.offers.filter((o) => o.seller === 'Best Buy' && o.market === 'ca' && o.model).map((o) => ({ p, o })));
    expect(read.length).toBeGreaterThan(0);
    for (const { p, o } of read) {
      expect(code(o.model!)).not.toBe(code(p.model));
      expect(TV_PRODUCTS.some((q) => q.id !== p.id && q.brand === p.brand && code(q.model) === code(o.model!)), `${p.brand} ${o.model}`).toBe(false);
    }
  });
});

describe('watching it', () => {
  it('adds the set’s power past the usual one’s for the minutes watched, and nothing with the usual set or none', () => {
    const sim = life('us-ny-newyork', 'tv-watts');
    expect(watchPower(sim.player, 60)).toBe(0);
    const { most } = labeled(sim);
    sim.must({ kind: 'tv.buy', payload: { offerId: most.offer.id } });
    const w = watts(sim, most.offer.id);
    expect(w).toBeGreaterThan(GENERIC_TV_WATTS!);
    const extra = sim.player.living?.extraKwh ?? 0;
    expect(watchPower(sim.player, 90)).toBeCloseTo(((w - GENERIC_TV_WATTS!) * 90) / 60 / 1000, 12);
    expect(sim.player.living!.extraKwh).toBeCloseTo(extra + ((w - GENERIC_TV_WATTS!) * 90) / 60 / 1000, 12);
    // A set SLATE sold before with no model draws the usual one's: nothing past it.
    const plain = life('us-ny-newyork', 'tv-plain');
    plain.must({ kind: 'home.furnish', payload: { piece: 'tv' } });
    expect(tvAtHome(plain.player)?.watts).toBe(GENERIC_TV_WATTS);
    expect(watchPower(plain.player, 90)).toBe(0);
    // A frugal set takes a little off.
    const small = life('us-ny-newyork', 'tv-small');
    const { least } = labeled(small);
    small.must({ kind: 'tv.buy', payload: { offerId: least.offer.id } });
    expect(watchPower(small.player, 60)).toBeLessThan(0);
  });

  it('draws for the minutes an episode runs, and the month’s electricity follows the set', () => {
    const watchAnEpisode = (offerId: string | undefined, seed: string) => {
      const sim = life('us-ny-newyork', seed);
      if (offerId) sim.must({ kind: 'tv.buy', payload: { offerId } });
      sim.must({ kind: 'home.subscribe', payload: { id: SERVICES.find((s) => s.market === 'us' && s.service === 'Amazon Prime')!.id } });
      const before = sim.player.living?.extraKwh ?? 0;
      const r = sim.must<{ watched: number }>({ kind: 'tv.watch', payload: { programmeId: programmeById('us-reacher')!.id } });
      return { sim, added: (sim.player.living?.extraKwh ?? 0) - before, watched: r.watched };
    };
    const probe = life('us-ny-newyork', 'tv-probe');
    const { most, least } = labeled(probe);
    const big = watchAnEpisode(most.offer.id, 'tv-big');
    expect(big.added).toBeCloseTo(((watts(big.sim, most.offer.id) - GENERIC_TV_WATTS!) * big.watched) / 60 / 1000, 12);
    const none = watchAnEpisode(undefined, 'tv-none');
    expect(none.added).toBe(0);
    const frugal = watchAnEpisode(least.offer.id, 'tv-frugal');
    // The same episode on a hungrier set costs more on the month's bill.
    const month = new Date(big.sim.now).getUTCMonth() + 1;
    expect(electricityAdjustment(big.sim, big.sim.player, month)).toBeGreaterThan(electricityAdjustment(frugal.sim, frugal.sim.player, month));
  });
});
