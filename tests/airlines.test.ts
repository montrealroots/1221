/**
 * Real airlines, and whether a flight anywhere is flown by one that goes there.
 *
 * Two promises. Every country in the geography is accounted for: home to a
 * carrier, served by named neighbors' carriers, or honestly listed as having
 * no scheduled service. And a route is flown by carriers that really serve
 * its ends, so a domestic hop is never handed to a foreign connector. The
 * second one held a real defect until this file existed: the geography keys
 * the United Kingdom as `uk` and the airline list said `gb`, so British
 * Airways was never a home carrier and London to Manchester was flown by
 * whoever was left over.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import {
  AIRLINES, NO_SERVICE, SERVED_BY, airlineByCode, airlinesFor, carriersServing, coverageOf, homeCarriers,
} from '@/engine/content/airlines';
import { searchFlights } from '@/engine/systems/travel';
import { RETAILERS, shoppableItems } from '@/engine/content/catalog';
import { PIECE_KINDS, pieceOf } from '@/engine/content/jewellery';

beforeAll(async () => { await loadAllSections(); });

/** The first city the geography has in a country, by name if asked. */
function cityIn(countryId: string, name?: string): string {
  const found = CITIES.all().find((c) => c.countryId === countryId && (!name || c.name === name));
  expect(found, `no city ${name ?? ''} in ${countryId}`).toBeDefined();
  return found!.id;
}

describe('every country is accounted for', () => {
  it('is home to a carrier, served by named neighbors, or honestly without service', () => {
    const unaccounted = COUNTRIES.all().filter((c) => coverageOf(c.id).kind === 'unaccounted').map((c) => c.id);
    expect(unaccounted).toEqual([]);
  });

  it('names only carriers that exist when it says who serves a country', () => {
    for (const codes of Object.values(SERVED_BY)) {
      for (const code of codes) expect(airlineByCode(code), code).toBeDefined();
    }
  });

  it('keys the United Kingdom the way the geography does', () => {
    expect(CITIES.get('uk-eng-london')?.countryId).toBe('uk');
    expect(homeCarriers('uk').map((a) => a.code)).toContain('BA');
    expect(AIRLINES.some((a) => a.countryId === 'gb')).toBe(false);
  });

  it('uses each IATA code once and homes every carrier in a real country', () => {
    const codes = AIRLINES.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const a of AIRLINES) expect(COUNTRIES.get(a.countryId), a.name).toBeDefined();
  });

  it('gives a reason, not a flight, where there is no scheduled service', () => {
    for (const [countryId, reason] of Object.entries(NO_SERVICE)) {
      expect(reason.length).toBeGreaterThan(20);
      expect(carriersServing(countryId)).toEqual([]);
      expect(coverageOf(countryId)).toEqual({ kind: 'none', reason });
    }
  });
});

describe('who flies a route', () => {
  it('flies a domestic British hop with British carriers, not a Gulf connector', () => {
    const domestic = airlinesFor('uk', 'uk', 260);
    expect(domestic.length).toBeGreaterThan(0);
    expect(domestic.every((a) => a.countryId === 'uk')).toBe(true);
  });

  it('flies a domestic Nigerian hop with Nigerian carriers', () => {
    const domestic = airlinesFor('ng', 'ng', 520);
    expect(domestic.map((a) => a.code)).toContain('P4');
    expect(domestic.every((a) => a.countryId === 'ng')).toBe(true);
  });

  it('hands a country with no carrier of its own to the neighbors that really serve it', () => {
    const cayenne = airlinesFor('gf', 'fr', 7100);
    expect(cayenne.some((a) => a.code === 'AF')).toBe(true);
    const helena = airlinesFor('sh', 'za', 3100);
    expect(helena.map((a) => a.code)).toContain('4Z');
  });

  it('puts the world connectors on long haul and keeps them off short haul', () => {
    const long = airlinesFor('us', 'uk', 5500);
    expect(long.every((a) => a.longHaul)).toBe(true);
    expect(long.some((a) => a.code === 'EK')).toBe(true);
    const short = airlinesFor('fr', 'de', 480);
    expect(short.some((a) => a.code === 'EK')).toBe(false);
  });

  it('searches London to Manchester and finds no foreign connector on it', () => {
    const sim = quickSave({}, 'routes');
    const options = searchFlights(sim, cityIn('uk', 'London'), cityIn('uk', 'Manchester'), sim.now + 3 * MS_DAY);
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) {
      expect(airlineByCode(o.airlineCode)?.countryId, o.airlineName).toBe('uk');
    }
  });
});

describe('the iced-out houses', () => {
  it('stocks Icebox and King Ice to a hundred each, on floors where they really are', () => {
    const counts = new Map<string, number>();
    for (const it of shoppableItems()) counts.set(it.brand, (counts.get(it.brand) ?? 0) + 1);
    expect(counts.get('Icebox')).toBeGreaterThanOrEqual(100);
    expect(counts.get('King Ice')).toBeGreaterThanOrEqual(100);
    expect(RETAILERS.get('icebox')?.locations).toContain('us-ga-atlanta');
    expect(RETAILERS.get('johnny_dang')?.locations).toContain('us-tx-houston');
  });

  it('hangs grillz on the peg that is none of the four, and chains on the necklace peg', () => {
    const items = shoppableItems();
    const grill = items.find((i) => i.id === 'ib_grill_dia_set')!;
    const cuban = items.find((i) => i.id === 'ib_cuban_14kyellowgold_12')!;
    expect(grill.slot).toBe('jewellery');
    expect(cuban.slot).toBe('necklace');
  });

  it('lets the bench make grillz, a tennis chain, a nameplate and a Miami Cuban', () => {
    for (const id of ['grillz', 'tennis_chain', 'nameplate', 'miami_cuban']) {
      expect(PIECE_KINDS.some((p) => p.id === id), id).toBe(true);
      expect(pieceOf(id).grams).toBeGreaterThan(0);
    }
    expect(pieceOf('miami_cuban').grams).toBeGreaterThan(pieceOf('chain').grams);
  });
});
