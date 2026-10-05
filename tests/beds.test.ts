/**
 * Beds by market (`content/beds.ts`, `systems/furniture.ts`, from
 * 2026-10-01): a frame and a mattress of one size at IKEA's prices, a
 * mattress that doesn't fit refused, a bed brought abroad that no mattress
 * there fits, and a single bed that sleeps one.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { bedAtHome, bedQuote, bedSleepsOne, bedsIn, mattressCost, mattressRefusal } from '@/engine/systems/furniture';
import { metAtWork, moveInRefusal } from '@/engine/systems/people';
import { homeKeyOf } from '@/engine/systems/items';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const own = (sim: Simulation) => { sim.player.home = { ...sim.player.home!, kind: 'own' }; return sim; };

describe('a bed', () => {
  it('is a frame and a mattress of one size, at IKEA’s prices with the delivery and the tax', () => {
    const sim = life('us-ny-newyork', 'bed-quote');
    const q = bedQuote(sim, 'us-ny-newyork', 'us-vihals-queen', 'us-vesteroy-queen');
    if (typeof q === 'string') throw new Error(q);
    const tax = Math.round((129 + 299) * 100 * salesTaxRate('us-ny-newyork', sim.now, 'furniture'));
    expect(q.amount).toBe(inSave(sim, (129 + 299 + 29) * 100 + tax, 'USD'));
    expect(bedQuote(sim, 'us-ny-newyork', 'us-vihals-queen', 'us-agotnes-twin')).toBe('A Twin mattress doesn’t fit a Queen frame.');
    expect(bedQuote(sim, 'us-ny-newyork', 'uk-neiden-double', 'us-agotnes-twin')).toBe('Choose a frame and a mattress sold here.');
    // Only what fits is offered: every frame with every mattress of its own size.
    expect(bedsIn('us-ny-newyork').every((b) => b.frame.size === b.mattress.size)).toBe(true);
    // IKEA sells no American king mattress, so until 2026-10-05 its TARVA king frame wasn't offered; makers' own kings now fit it.
    const tarva = bedsIn('us-ny-newyork').filter((b) => b.frame.id === 'us-tarva-king');
    expect(tarva.length).toBeGreaterThan(0);
    expect(tarva.every((b) => 'brand' in b.mattress)).toBe(true);
  });

  it('is bought as chosen, and keeps its country and size', () => {
    const sim = own(life('uk-eng-london', 'bed-buy'));
    const r = sim.execute({ kind: 'home.furnish', payload: { piece: 'bed', frameId: 'uk-neiden-double', mattressId: 'uk-valevag-double' } });
    expect(r.ok, r.error).toBe(true);
    expect(bedAtHome(sim.player)).toEqual({ country: 'uk', size: 'double', widthCm: 135 });
    expect(sim.player.items!.find((i) => i.kind === 'furniture:bed')!.label).toBe('NEIDEN Double Bed');
  });

  it('brought to another market, takes no mattress sold there', () => {
    const sim = own(life('uk-eng-london', 'bed-abroad'));
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'bed', frameId: 'uk-neiden-double', mattressId: 'uk-valevag-double' } }).ok).toBe(true);
    expect(mattressRefusal(sim.player, 'uk-eng-london')).toBeUndefined();
    expect(mattressRefusal(sim.player, 'ie-lei-dublin')).toBeUndefined();
    expect(mattressRefusal(sim.player, 'us-ny-newyork')).toBe('No mattress sold here fits your Double bed.');
    // A British double in Dublin takes Ireland's cheapest double, VESTMARKA's €149.
    expect(mattressCost(sim, 'ie-lei-dublin', 'double')).toBeGreaterThan(0);
    expect(mattressCost(sim, 'ie-lei-dublin', 'double')).toBeLessThan(mattressCost(sim, 'ie-lei-dublin')!);
  });

  it('is held to its own market even where a size shares a name, and the usual double keeps its mattress', () => {
    // A Mexican queen is 150 by 190; America's is 152 by 203, and one doesn't take the other.
    const mx = own(life('mx-cmx-mexicocity', 'bed-mx'));
    expect(mx.execute({ kind: 'home.furnish', payload: { piece: 'bed', frameId: 'mx-tallasen-queen', mattressId: 'mx-vagstranda-queen' } }).ok).toBe(true);
    expect(mattressRefusal(mx.player, 'us-ny-newyork')).toBe('No mattress sold here fits your Queen bed.');
    // Britain's usual bed, a King, takes the King mattress its default is priced with, though the catalog sells only doubles.
    const ldn = own(life('uk-eng-london', 'bed-default'));
    expect(ldn.execute({ kind: 'home.furnish', payload: { piece: 'bed' } }).ok).toBe(true);
    expect(bedAtHome(ldn.player)!.size).toBe('king');
    expect(mattressRefusal(ldn.player, 'uk-eng-london')).toBeUndefined();
    // A size nobody sells here has no price, rather than the usual one's.
    expect(mattressCost(ldn, 'us-ny-newyork', 'double')).toBeUndefined();
    // And the command says why.
    const abroad = own(life('uk-eng-london', 'bed-cmd'));
    expect(abroad.execute({ kind: 'home.furnish', payload: { piece: 'bed', frameId: 'uk-neiden-double', mattressId: 'uk-valevag-double' } }).ok).toBe(true);
    abroad.player.home = { ...abroad.player.home!, cityId: 'us-ny-newyork' };
    abroad.player.currentLocationId = 'us-ny-newyork';
    abroad.player.items!.find((i) => i.kind === 'furniture:bed')!.at = { kind: 'home', home: homeKeyOf(abroad.player.home)!, spot: 'floor' } as never;
    expect(abroad.execute({ kind: 'home.replace_mattress', payload: {} }).error).toBe('No mattress sold here fits your Double bed.');
  });

  it('a single sleeps one, and a partner won’t move in to it', () => {
    const sim = own(life('us-ny-newyork', 'bed-one'));
    // A twin frame isn't sold in New York's IKEA, so Toronto's.
    const to = own(life('ca-on-toronto', 'bed-one-ca'));
    expect(to.execute({ kind: 'home.furnish', payload: { piece: 'bed', frameId: 'ca-neiden-twin', mattressId: 'ca-agotnes-twin' } }).ok).toBe(true);
    expect(bedSleepsOne(to.player)).toBe(true);
    const c = metAtWork(to, to.player, 'ca-on-toronto', 'b1', 'A Job');
    c.dating = { since: to.now, dates: 9, couple: to.now };
    expect(moveInRefusal(to.player, c)).toBe('Your bed sleeps one: buy a bigger one first.');
    // A queen sleeps two.
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'bed', frameId: 'us-vihals-queen', mattressId: 'us-vesteroy-queen' } }).ok).toBe(true);
    expect(bedSleepsOne(sim.player)).toBe(false);
    // An older bed, with no size kept, is its country's usual double.
    delete sim.player.items!.find((i) => i.kind === 'furniture:bed')!.bed;
    expect(bedAtHome(sim.player)!.size).toBe('queen');
  });
});
