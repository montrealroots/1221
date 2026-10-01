/**
 * Every list of things to buy or book, cheapest first by a comparable price
 * (`systems/catalog.ts`, `systems/catalogs.ts`, from 2026-10-01): an unknown
 * price never counted as nothing, search, filters, the other sorts, and each
 * of SLATE's lists in that order by default.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { arrange, facetValues, type CatalogEntry } from '@/engine/systems/catalog';
import { applianceCatalog, furnitureCatalog, homeCatalog, landCatalog, modCatalog, rentalCatalog, stayCatalog, vehicleCatalog } from '@/engine/systems/catalogs';

const e = (id: string, price: number | null, facets: Record<string, string> = {}, words = ''): CatalogEntry<string> => ({ id, label: id, price, priceKind: price === null ? 'quote' : 'advertised', basis: 'Total', facets, words, value: id });
/** Prices in a list's order: known ones rise, and unknown ones come after them all. */
function cheapestFirst(entries: readonly CatalogEntry[]): void {
  const prices = arrange(entries).map((x) => x.price);
  const known = prices.filter((p): p is number => p !== null);
  expect(known).toEqual([...known].sort((a, b) => a - b));
  const firstUnknown = prices.indexOf(null);
  if (firstUnknown >= 0) expect(prices.slice(firstUnknown).every((p) => p === null)).toBe(true);
  expect(new Set(entries.map((x) => x.basis)).size).toBeLessThanOrEqual(1);
}

describe('a catalog', () => {
  it('shows the cheapest first, an unknown price last in either price order and never as nothing, and sorts by name when asked', () => {
    const list = [e('Coat', 300_00), e('Quote Only', null), e('Scarf', 40_00), e('Boots', 300_00)];
    expect(arrange(list).map((x) => x.id)).toEqual(['Scarf', 'Boots', 'Coat', 'Quote Only']);
    expect(arrange(list, { sort: 'dearest' }).map((x) => x.id)).toEqual(['Boots', 'Coat', 'Scarf', 'Quote Only']);
    expect(arrange(list, { sort: 'name' }).map((x) => x.id)).toEqual(['Boots', 'Coat', 'Quote Only', 'Scarf']);
  });

  it('is searched by every word, and filtered by each facet chosen', () => {
    const list = [e('Wool Coat', 300_00, { color: 'black' }, 'winter'), e('Rain Coat', 120_00, { color: 'yellow' }), e('Wool Scarf', 40_00, { color: 'black' }, 'winter')];
    expect(arrange(list, { query: 'wool' }).map((x) => x.id)).toEqual(['Wool Scarf', 'Wool Coat']);
    expect(arrange(list, { query: 'winter coat' }).map((x) => x.id)).toEqual(['Wool Coat']);
    expect(arrange(list, { filters: { color: 'yellow' } }).map((x) => x.id)).toEqual(['Rain Coat']);
    expect(arrange(list, { filters: { color: '' } })).toHaveLength(3);
    expect(facetValues(list, 'color')).toEqual(['black', 'yellow']);
  });
});

describe('SLATE’s lists', () => {
  const ny = (seed: string): Simulation => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

  it('are each the cheapest first by default, on one price basis: cars, homes, land, furniture, appliances and mods', () => {
    const sim = ny('cat-lists');
    const cars = vehicleCatalog(sim, sim.player, 'us-ny-newyork', 'car');
    expect(cars.length).toBeGreaterThan(3);
    cheapestFirst(cars);
    cheapestFirst(vehicleCatalog(sim, sim.player, 'us-ny-newyork', 'motorcycle', 3));
    cheapestFirst(homeCatalog(sim, 'us-ny-newyork'));
    cheapestFirst(landCatalog(sim, sim.player, 'us-ny-newyork'));
    cheapestFirst(furnitureCatalog(sim, 'us-ny-newyork'));
    cheapestFirst(applianceCatalog(sim, 'us-ny-newyork'));
    cheapestFirst(modCatalog(sim));
    // A used model's price is an estimate; a new one's is the dealer's.
    expect(vehicleCatalog(sim, sim.player, 'us-ny-newyork', 'car', 3)[0]!.priceKind).toBe('estimate');
    expect(cars[0]!.priceKind).toBe('advertised');
  });

  it('prices a stay for the whole stay and a rental for the whole rental, the cheapest first', () => {
    const sim = ny('cat-stays');
    const stays = stayCatalog(sim, 'us-ny-newyork', 3, 'flexible', true, false, sim.now + 14 * 86_400_000);
    expect(stays.length).toBeGreaterThan(1);
    cheapestFirst(stays);
    expect(stays[0]!.basis).toBe('The Whole Stay, Taxes In');
    const rentals = rentalCatalog(sim, sim.player, 'us-ca-losangeles', sim.now + 14 * 86_400_000, sim.now + 17 * 86_400_000, false);
    cheapestFirst(rentals);
  });

  it('lists a home’s furniture without a price here last, as not known', () => {
    const sim = quickSave({ startLocationId: 'is-39-mosfellsbr', homeRegionId: 'is-39-mosfellsbr', livesWhereBorn: true }, 'cat-unknown');
    const pieces = furnitureCatalog(sim, 'is-39-mosfellsbr');
    expect(pieces.every((p) => p.price === null ? p.priceKind === 'unknown' : true)).toBe(true);
    cheapestFirst(pieces);
    expect(pieces.some((p) => p.price === null)).toBe(true);
  });
});
