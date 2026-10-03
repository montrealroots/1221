/**
 * A quartz watch's battery (`systems/watches.ts`, from 2026-10-02): it runs
 * down its maker's years after it was fitted, and the watch has stopped and
 * isn't put on, until a battery's changed at the market's published price.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { BATTERY_YEARS } from '@/engine/content/watchbatteries';
import { addItem, homeKeyOf, type Item } from '@/engine/systems/items';
import { unwearable, type Garment } from '@/engine/systems/wardrobe';
import { batteryOptions, batteryRefusal, batteryRunsOut, makerServiceOf, servicePrice, stopped } from '@/engine/systems/watches';
import { inSaveMoney } from '@/engine/systems/banking';

const TIMEX = 'us-timex-weekender-37mm-fabric-strap-watch';
const LONGINES = 'gb-selfridges-l81154616-primaluna-moonphase-stainless-steel-quartz-watch';
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const YEAR = 365.25 * MS_DAY;

function watch(sim: Simulation, kind: string): Item & { garment: Garment } {
  const p = sim.player;
  return addItem(sim, p, { kind, label: 'A Watch', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(p.home)!, spot: 'drawers' }, acquiredAt: sim.now, paid: 100_00, garment: { kind: 'accessory', slot: 'accessory', care: 'hand', wears: 0, washes: 0 } }) as Item & { garment: Garment };
}

describe('a watch’s battery', () => {
  it('is kept only for the quartz watches SLATE sells whose maker gives its life', () => {
    for (const id of Object.keys(BATTERY_YEARS)) expect(CLOTHING_PRODUCTS.find((p) => p.id === id)?.category, id).toBe('watches');
    expect(BATTERY_YEARS[TIMEX]).toBe(3.5);
    expect(BATTERY_YEARS['us-casio-f91w-1']).toBe(7);
  });

  it('runs down its years after it was bought, and the stopped watch isn’t put on', () => {
    const sim = life('us-ny-newyork', 'watch-stop');
    const w = watch(sim, TIMEX);
    expect(batteryRunsOut(w)).toBe(w.acquiredAt + 3.5 * YEAR);
    expect(unwearable(sim, sim.player, w)).toBeUndefined();
    expect(unwearable(sim, sim.player, w, w.acquiredAt + 3.5 * YEAR)).toBe('stopped, its battery run down');
    expect(stopped(w, w.acquiredAt + 3.5 * YEAR - 1)).toBe(false);
  });

  it('is changed at the market’s price, cheapest first, and the watch is back in a week', () => {
    const sim = life('us-ny-newyork', 'watch-change');
    const w = watch(sim, TIMEX);
    const opts = batteryOptions(sim, sim.player, w);
    expect(opts.map((o) => o.service.id)).toEqual(['timex-mail-in', 'kay-mail-in']);
    expect(opts[0]!.price).toBe(inSaveMoney(sim, 18_00, 'USD'));
    sim.must({ kind: 'watch.battery', payload: { itemId: w.id, serviceId: 'timex-mail-in' } });
    expect(w.at.kind).toBe('service');
    const back = w.acquiredAt + 7 * MS_DAY;
    expect(batteryRunsOut(w)).toBe(back + 3.5 * YEAR);
    expect(batteryRefusal(sim, sim.player, w.id, 'kay-mail-in')).toBe('The A Watch isn’t to hand.');
    sim.advanceTo(back + MS_DAY);
    expect(w.at.kind).toBe('home');
    expect(batteryRefusal(sim, sim.player, w.id, 'tommy-mail-in')).toBe('That service doesn’t change this watch’s battery here.');
  });

  it('is Fraser Hart’s by brand in London, Longines’ own with the tax in Toronto, none for a Timex in London', () => {
    const ldn = life('uk-eng-london', 'watch-ldn');
    const l = watch(ldn, LONGINES);
    expect(batteryOptions(ldn, ldn.player, l).map((o) => [o.service.id, o.price])).toEqual([['fraser-hart-longines', inSaveMoney(ldn, 80_00, 'GBP')]]);
    expect(batteryOptions(ldn, ldn.player, watch(ldn, TIMEX))).toEqual([]);
    const to = life('ca-on-toronto', 'watch-to');
    const t = watch(to, LONGINES);
    expect(batteryOptions(to, to.player, t)[0]!.price).toBe(inSaveMoney(to, Math.round(50 * 1.13 * 100), 'CAD'));
    expect(batteryRefusal(to, to.player, 'none', 'longines-canada')).toBe('Only a quartz watch whose maker gives its battery’s life is changed here.');
  });
});

describe('a mechanical watch’s service, and the PRX’s battery', () => {
  const GENTLEMAN = 'gb-selfridges-tissot-gentleman-38mm-stainless-steel-automatic-watch';
  const PRX = 'mx-liverpool-mx-reloj-prx-para-hombre-t1374101104100';
  const named = (sim: Simulation, kind: string) => { const w = watch(sim, kind); w.label = CLOTHING_PRODUCTS.find((p) => p.id === kind)!.name; return w; };

  it('stops past Tissot’s four and a half years until serviced at its price, away three weeks', () => {
    const sim = life('uk-eng-london', 'watch-service');
    const w = named(sim, GENTLEMAN);
    expect(stopped(w, sim.now + 4.4 * YEAR)).toBe(false);
    expect(stopped(w, sim.now + 4.6 * YEAR)).toBe(true);
    expect(servicePrice(sim, sim.player, w)).toBe(inSaveMoney(sim, 175_00, 'GBP'));
    const r = sim.must<{ paid: number; back: number }>({ kind: 'watch.service', payload: { itemId: w.id } });
    expect(r.back - sim.now).toBe(21 * MS_DAY);
    expect(stopped(w, r.back + 4.4 * YEAR)).toBe(false);
    // A quartz watch has no service here, and a Seiko automatic isn't counted.
    const quartz = named(sim, LONGINES);
    expect(sim.execute({ kind: 'watch.service', payload: { itemId: quartz.id } }).error).toMatch(/^Only a mechanical watch/);
    expect(makerServiceOf(named(sim, 'gb-john-lewis-seiko-srpd59k1-mens-5-sports-automatic-day-date-bracelet-strap-watch-silvero'))).toBeUndefined();
  });

  it('runs a PRX on its movement maker’s battery life, changed at Tissot’s own price', () => {
    const sim = life('mx-cmx-mexicocity', 'watch-prx');
    const w = named(sim, PRX);
    expect(batteryRunsOut(w)! - w.acquiredAt).toBeCloseTo(6.75 * YEAR, -3);
    expect(batteryOptions(sim, sim.player, w)[0]!.price).toBe(inSaveMoney(sim, 1_300_00, 'MXN'));
  });
});
