/**
 * The days a store may not open by law (`shutByLaw` in `systems/errands.ts`,
 * from 2026-10-02): England's large shops on Christmas Day and Easter Day,
 * Ontario's retail on its seven holidays; and a free day's top-up of
 * toiletries waits for a day the store opens (`restock`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { closedNow, shutAllDay, shutByLaw } from '@/engine/systems/errands';
import { restock } from '@/engine/systems/hygiene';
import { TOILETRIES } from '@/engine/content/hygiene';
import { GROCERY_CHAINS } from '@/engine/content/groceries';
import { itemsOf } from '@/engine/systems/items';

const at = (iso: string) => Date.parse(iso);

describe('a store shut by law', () => {
  it('in England: a large shop on Christmas Day and Easter Day, and not the day after', () => {
    expect(closedNow('tesco-gb', 'Tesco', 'uk-eng-london', at('2027-12-25T12:00:00Z'))).toBe('Tesco is closed today. A large shop in England may not open on Christmas Day.');
    expect(shutByLaw('uk-eng-london', at('2027-03-28T12:00:00+01:00'))).toBe('A large shop in England may not open on Easter Day.');
    expect(shutByLaw('uk-eng-london', at('2027-12-26T12:00:00Z'))).toBeUndefined();
    // Not a law of Ireland's.
    expect(shutByLaw('ie-lei-dublin', at('2027-12-25T12:00:00Z'))).toBeUndefined();
  });

  it('in Ontario: its seven retail holidays, Canada Day on the Monday when July 1 is a Sunday', () => {
    const shut = (iso: string) => Boolean(shutByLaw('ca-on-toronto', at(iso)));
    // 2029: Good Friday March 30, Easter April 1, July 1 a Sunday, September 3 the first Monday, Thanksgiving October 8.
    for (const d of ['2029-01-01', '2029-03-30', '2029-04-01', '2029-07-02', '2029-09-03', '2029-10-08', '2029-12-25']) expect(shut(`${d}T12:00:00-04:00`)).toBe(true);
    // Family Day and Victoria Day are the store's to choose since April 2026; Boxing Day is no retail holiday.
    for (const d of ['2029-02-19', '2029-05-21', '2029-07-01', '2029-12-26']) expect(shut(`${d}T12:00:00-04:00`)).toBe(false);
    expect(shutByLaw('ca-bc-vancouver', at('2029-07-02T12:00:00-07:00'))).toBeUndefined();
    expect(shutAllDay('ca-on-toronto', at('2029-12-25T12:00:00-05:00'))).toBe(true);
    expect(shutAllDay('ca-on-toronto', at('2029-12-24T12:00:00-05:00'))).toBe(false);
  });
});

describe('a toiletry’s chain', () => {
  it('is a grocery chain SLATE has, so its stores and hours are found (Tesco’s weren’t until 2026-10-02)', () => {
    const chains = new Set(GROCERY_CHAINS.map((c) => c.id));
    expect(TOILETRIES.filter((t) => !chains.has(t.chain)).map((t) => t.chain)).toEqual([]);
    expect(TOILETRIES.some((t) => t.chain === 'tesco-gb')).toBe(true);
  });
});

describe('a free day’s top-up', () => {
  it('waits for a day the store opens', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'storelaw');
    const p = sim.player;
    // Run out of everything, on Christmas Day.
    p.items = itemsOf(p).filter((i) => !i.supply);
    sim.universe.now = at('2027-12-25T12:00:00Z');
    expect(restock(sim, p)).toBe(0);
    sim.universe.now = at('2027-12-27T12:00:00Z');
    expect(restock(sim, p)).toBeGreaterThan(0);
  });
});
