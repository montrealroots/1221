/**
 * A branch of a chain is a branch, not the chain.
 *
 * What a test can hold: an arrangement that is the arrangement that country
 * really has, a product classified off its own tags and never off its name, a
 * climate that rules out a parka without ruling out a saucepan, a branch that
 * keeps the same buy every time you walk into it, and a hundred products in
 * every branch that sells more than one label.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  ALCOHOL_MONOPOLY, ALCOHOL_PROHIBITED, BEEF_RESTRICTED, BUY_DEPTH, NEVER_BELOW, NO_HEAVY_COATS,
  NO_SWIMWEAR, PORK_LICENSED_ROOM, PORK_NOT_SOLD, SEASONS_BOUGHT_FOR, availabilityOf, depthFor,
  onTheShelfIn, suitsClimate,
} from '@/engine/content/localbuy';
import { CATALOG, RETAILERS, houseBrandOf } from '@/engine/content/catalog';
import { CLIMATE_NAMES } from '@/engine/content/climate';
import { placesIn } from '@/engine/content/places';
import { MINIMUM_ASSORTMENT, assortmentAt, branchSize, notCarriedAt } from '@/engine/systems/retail';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';

const sim: Simulation = quickSave(
  { birthYear: 1995, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'localbuy',
);

/** Every shop in a city that sells more than one label. */
function shopsIn(cityId: string): Map<string, { ids: Set<string>; n: number; place: ReturnType<typeof placesIn>[number] }> {
  const out = new Map<string, { ids: Set<string>; n: number; place: ReturnType<typeof placesIn>[number] }>();
  for (const place of placesIn(cityId)) {
    if (place.kind !== 'shop' && place.kind !== 'market') continue;
    const retailer = place.retailerId ? RETAILERS.get(place.retailerId) : undefined;
    if (retailer && houseBrandOf(retailer) !== undefined) continue;
    const stock = assortmentAt(sim, place);
    if (stock.length > 0) out.set(place.name, { place, ids: new Set(stock.map((one) => one.item.id)), n: stock.length });
  }
  return out;
}

// ---------------------------------------------------------------------------

describe('what may be sold there', () => {
  it('carries the arrangements those countries really have', () => {
    expect(ALCOHOL_PROHIBITED.has('sa')).toBe(true);
    expect(ALCOHOL_MONOPOLY.se).toMatch(/Systembolaget/);
    expect(ALCOHOL_MONOPOLY.no).toMatch(/Vinmonopolet/);
    expect(ALCOHOL_MONOPOLY.fi).toMatch(/Alko/);
    expect(PORK_NOT_SOLD.has('kw')).toBe(true);
    expect(PORK_LICENSED_ROOM.has('ae')).toBe(true);
    expect(BEEF_RESTRICTED.has('in')).toBe(true);
    // And a country with no such arrangement is given none.
    for (const countryId of ['uk', 'us', 'fr', 'de', 'jp']) {
      expect(ALCOHOL_PROHIBITED.has(countryId), countryId).toBe(false);
      expect(ALCOHOL_MONOPOLY[countryId], countryId).toBeUndefined();
      expect(PORK_NOT_SOLD.has(countryId), countryId).toBe(false);
    }
    // Nothing is both prohibited and sold.
    for (const countryId of PORK_NOT_SOLD) expect(PORK_LICENSED_ROOM.has(countryId)).toBe(false);
  });

  it('reads a product off its tags and never off its name', () => {
    // The disaster this exists to prevent: Virgin contains gin, Hamilton
    // contains ham, and a Champion sweatshirt contains it twice.
    for (const name of ['Colavita Extra Virgin Olive Oil', 'Tabasco Original Red', 'Rummo Mezzi Paccheri']) {
      const item = CATALOG.all().find((one) => one.name === name);
      if (!item) continue;
      expect(onTheShelfIn(item, 'sa'), name).toBe(true);
    }
    for (const item of CATALOG.all().filter((one) => one.category === 'watch')) {
      expect(onTheShelfIn(item, 'sa'), item.name).toBe(true);
    }
  });

  it('takes alcohol off a Saudi shelf and puts it behind the Swedish counter', () => {
    const booze = CATALOG.all().filter((one) => one.tags.includes('alcohol'));
    expect(booze.length).toBeGreaterThan(20);
    for (const item of booze) {
      expect(onTheShelfIn(item, 'sa'), item.name).toBe(false);
      expect(availabilityOf(item, 'se').availability, item.name).toBe('licensed_counter');
      expect(availabilityOf(item, 'se').why).toMatch(/Systembolaget/);
      expect(onTheShelfIn(item, 'uk'), item.name).toBe(true);
    }
  });

  it('puts pork in a licensed room in the Emirates and nowhere at all in Kuwait', () => {
    const pork = CATALOG.all().filter((one) => one.tags.includes('pork'));
    expect(pork.length).toBeGreaterThan(3);
    for (const item of pork) {
      expect(onTheShelfIn(item, 'kw'), item.name).toBe(false);
      expect(availabilityOf(item, 'ae').availability, item.name).toBe('licensed_counter');
      expect(onTheShelfIn(item, 'es'), item.name).toBe(true);
    }
  });
});

describe('what the weather asks for', () => {
  it('buys for the seasons a climate actually has', () => {
    for (const climate of Object.keys(CLIMATE_NAMES) as (keyof typeof SEASONS_BOUGHT_FOR)[]) {
      expect(SEASONS_BOUGHT_FOR[climate].length, climate).toBeGreaterThan(0);
    }
    expect(SEASONS_BOUGHT_FOR.equatorial).not.toContain('Winter');
    expect(SEASONS_BOUGHT_FOR.polar).not.toContain('Summer');
    expect(NO_SWIMWEAR.has('polar')).toBe(true);
    expect(NO_HEAVY_COATS.has('equatorial')).toBe(true);
  });

  it('does not decline to stock a saucepan because of the weather', () => {
    for (const item of CATALOG.all().filter((one) => one.category !== 'clothing' && one.category !== 'footwear')) {
      expect(suitsClimate(item, 'polar'), item.name).toBe(true);
      expect(suitsClimate(item, 'equatorial'), item.name).toBe(true);
    }
  });
});

describe('the branch’s own buy', () => {
  it('gives a flagship more of the range than a small branch, and never less than a shop', () => {
    let last = 2;
    for (const band of BUY_DEPTH) {
      expect(band.share).toBeLessThan(last);
      last = band.share;
    }
    expect(depthFor(95).share).toBeGreaterThan(depthFor(20).share);
    expect(NEVER_BELOW).toBeGreaterThanOrEqual(MINIMUM_ASSORTMENT);
  });

  it('is the same shop every time you walk into it', () => {
    const shops = shopsIn('uk-eng-london');
    const [name, first] = [...shops][0]!;
    const again = assortmentAt(sim, first.place);
    expect(again.filter((one) => !first.ids.has(one.item.id)), name).toHaveLength(0);
    // And a fortnight later, because a buy is a season's decision.
    sim.advanceTo(sim.now + 20 * MS_DAY);
    const later = assortmentAt(sim, first.place);
    expect(later.filter((one) => !first.ids.has(one.item.id)), name).toHaveLength(0);
  });

  it('still carries the hundred every branch promises', () => {
    for (const cityId of ['uk-eng-london', 'jp-13-tokyo', 'sg-singapore', 'is-39-reykjavik']) {
      for (const [name, shop] of shopsIn(cityId)) {
        expect(shop.n, `${name} in ${cityId}`).toBeGreaterThanOrEqual(MINIMUM_ASSORTMENT);
        expect(branchSize(shop.place).length).toBeGreaterThan(4);
      }
    }
  });
});

describe('the same chain in two countries', () => {
  it('is not the same shop', () => {
    const london = shopsIn('uk-eng-london');
    const singapore = shopsIn('sg-singapore');
    const shared = [...london.keys()].filter((name) => singapore.has(name));
    expect(shared.length).toBeGreaterThan(2);
    for (const name of shared) {
      const onlyLondon = [...london.get(name)!.ids].filter((id) => !singapore.get(name)!.ids.has(id));
      const onlySingapore = [...singapore.get(name)!.ids].filter((id) => !london.get(name)!.ids.has(id));
      expect(onlyLondon.length + onlySingapore.length, name).toBeGreaterThan(0);
    }
  });

  it('says which arrangement left something off, and says nothing where there is none', () => {
    for (const [cityId, expected] of [
      ['sa-10-riyadh', /not sold/], ['se-26-stockholm', /Systembolaget/], ['ae-du-dubai', /licensed room/],
    ] as const) {
      const reasons = [...shopsIn(cityId).values()]
        .map((one) => notCarriedAt(one.place))
        .find((one) => one.length > 0);
      expect(reasons, cityId).toBeDefined();
      expect(reasons!.some((one) => expected.test(one.why)), cityId).toBe(true);
      for (const reason of reasons!) expect(reason.count).toBeGreaterThan(0);
    }
    // Britain has no such arrangement, so nothing is left off and nothing is said.
    const british = [...shopsIn('uk-eng-london').values()]
      .map((one) => notCarriedAt(one.place))
      .find((one) => one.length > 0);
    expect(british).toBeUndefined();
  });
});
