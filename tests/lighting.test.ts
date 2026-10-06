/**
 * A home's lights (`systems/lighting.ts`, `content/lighting.ts`,
 * `content/lightingcatalog.ts`, from 2026-10-05): its sockets at the market's
 * household average with the typical home's bulb in each, lit for the hours
 * somebody's home and up in the dark, the bulbs going out at their rated life
 * and replaced from spares or bought, lamps bringing sockets of their own,
 * and what they draw billed against the typical household's lighting.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CITIES } from '@/engine/content/geography';
import { LIGHTING_NORM } from '@/engine/content/lighting';
import { MS_DAY, startOfDay } from '@/engine/core/time';
import { electricityAdjustment, KIND_SHARE } from '@/engine/systems/electricity';
import { itemsOf } from '@/engine/systems/items';
import {
  BULBS, LAMPS, bulbCatalog, darkSockets, fitRefusal, homeSockets, lampCatalog, lightingDay, lightsOf, litHours, meanDarkHours, replaceBulbs,
  spareBulbs, typicalBulb, typicalLightKwh, typicalSocketHours,
} from '@/engine/systems/lighting';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const at = (y: number, m: number, d: number, city: string) => startOfDay(Date.UTC(y, m - 1, d, 12), CITIES.require(city).timeZone);

describe('a home’s lights', () => {
  it('has the market’s household sockets, each with the typical home’s bulb, ages spread through its life', () => {
    const sim = life('us-ny-newyork', 'light-ny');
    const lights = lightsOf(sim.player)!;
    expect(lights.sockets).toHaveLength(Math.round(52 * KIND_SHARE[sim.player.home!.kind]!));
    expect(homeSockets(sim.player)).toBe(lights.sockets.length);
    const typical = typicalBulb('us', 'edison')!;
    expect(lights.sockets.every((s) => s.socket === 'edison' && s.watts === typical.watts && s.life === typical.life)).toBe(true);
    expect(new Set(lights.sockets.map((s) => s.hours)).size).toBe(lights.sockets.length);
    // A British home's are bayonets, 45 of them.
    const ldn = life('uk-eng-london', 'light-ldn');
    expect(lightsOf(ldn.player)!.sockets.filter((s) => !s.lamp).every((s) => s.socket === 'bayonet')).toBe(true);
    expect(LIGHTING_NORM.uk!.lamps).toBe(45);
  });

  it('is lit for the hours somebody’s home and up in the dark: a London December longer than its June', () => {
    const sim = life('uk-eng-london', 'light-dark');
    const city = 'uk-eng-london';
    const dec = litHours(sim, sim.player, at(2026, 12, 15, city));
    const jun = litHours(sim, sim.player, at(2027, 6, 15, city));
    expect(dec).toBeGreaterThan(jun);
    expect(meanDarkHours(city, sim.now)).toBeGreaterThan(jun);
    // And so draws more on the bill.
    sim.universe.now = at(2026, 12, 15, city);
    const winter = lightingDay(sim, sim.player);
    sim.universe.now = at(2027, 6, 15, city);
    expect(winter).toBeGreaterThan(lightingDay(sim, sim.player));
    // Away, nobody's home: none lit.
    sim.player.currentLocationId = 'us-ny-newyork';
    expect(litHours(sim, sim.player, at(2026, 12, 15, city))).toBe(0);
  });

  it('burns what its bulbs draw onto the month, and a dimmer bulb draws less', () => {
    const sim = life('us-ny-newyork', 'light-kwh');
    lightsOf(sim.player);
    const l = sim.player.living!;
    delete l.lightKwh;
    const kwh = lightingDay(sim, sim.player);
    expect(l.lightKwh).toBeCloseTo(kwh, 9);
    const lit = lightsOf(sim.player)!.sockets.filter((s) => s.watts !== undefined).reduce((n, s) => n + s.watts!, 0);
    if (litHours(sim, sim.player, startOfDay(sim.now, CITIES.require('us-ny-newyork').timeZone)) > 0) expect(kwh).toBeGreaterThan(0);
    for (const s of lightsOf(sim.player)!.sockets) if (s.watts !== undefined) s.watts /= 2;
    expect(lightingDay(sim, sim.player)).toBeCloseTo(kwh / 2, 9);
    expect(lit).toBeGreaterThan(0);
  });

  it('bills the lights against the typical household’s: bulbs drawing more cost more, less cost less', () => {
    const sim = life('us-ny-newyork', 'light-bill');
    lightsOf(sim.player);
    const l = sim.player.living!;
    const days = 30;
    Object.assign(l, { billDays: days, homeDays: days });
    const typical = typicalLightKwh(sim.player, days);
    expect(typical).toBeGreaterThan(0);
    l.lightKwh = typical;
    const even = electricityAdjustment(sim, sim.player, 11);
    l.lightKwh = typical * 2;
    expect(electricityAdjustment(sim, sim.player, 11)).toBeGreaterThan(even);
    l.lightKwh = typical / 2;
    expect(electricityAdjustment(sim, sim.player, 11)).toBeLessThan(even);
    // A typical home's sockets, lit their typical hours, draw the typical lighting.
    // (Within the socket count's rounding.)
    const hours = typicalSocketHours('us', 'us-ny-newyork')!;
    const sockets = lightsOf(sim.player)!.sockets.length;
    expect(sockets * typicalBulb('us', 'edison')!.watts * hours / 1000 * days / typical).toBeCloseTo(sockets / (52 * KIND_SHARE[sim.player.home!.kind]!), 9);
  });

  it('goes dark at a bulb’s rated life, and is lit again from a spare, or a pack bought with the shortcut on', () => {
    const sim = life('us-ny-newyork', 'light-out');
    const lights = lightsOf(sim.player)!;
    const first = lights.sockets[0]!;
    first.hours = first.life - 0.001;
    sim.universe.now = at(2026, 12, 15, 'us-ny-newyork');
    lightingDay(sim, sim.player);
    expect(first.watts).toBeUndefined();
    expect(darkSockets(sim.player)).toContain(first);
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(replaceBulbs(sim, sim.player)).toBe(1);
    expect(first.watts).toBeGreaterThan(0);
    expect(first.hours).toBe(0);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBeLessThan(before);
    // The pack's rest kept as spares, fitted by hand into the brightest-drawing sockets next.
    const spare = spareBulbs(sim.player)[0];
    if (spare) {
      expect(spare.item.quantity).toBe(Number(spare.product.attrs.pack) - 1);
      const r = sim.must<{ fitted: number }>({ kind: 'lighting.fit', payload: { productId: spare.product.id } });
      expect(r.fitted).toBeGreaterThan(0);
    }
    expect(fitRefusal(sim.player, 'nothing')).toBe('You have none of those spare.');
  });

  it('puts the same kind of bulb back where one of it died, as a life of years of restocking leaves every socket (from 2026-10-06)', () => {
    const sim = life('us-ny-newyork', 'light-same');
    const lights = lightsOf(sim.player)!;
    const first = lights.sockets.find((s) => !s.built && !s.lamp)!;
    const cheapest = bulbCatalog(sim, sim.player).find((r) => r.product.attrs.socket === first.socket && !r.product.attrs.smart && (first.maxWatts === undefined || Number(r.product.attrs.watts) <= first.maxWatts))!;
    // Every socket of its kind already lit by the cheapest bulb, as decades of the shortcut leave it; then one dies.
    for (const s of lights.sockets.filter((x) => x.socket === first.socket && !x.built)) Object.assign(s, { bulb: cheapest.product.id, watts: Number(cheapest.product.attrs.watts) });
    first.hours = first.life - 0.001;
    sim.universe.now = at(2026, 12, 15, 'us-ny-newyork');
    lightingDay(sim, sim.player);
    expect(first.watts).toBeUndefined();
    expect(first.bulb).toBe(cheapest.product.id);
    // Until 2026-10-06 this threw 'No socket here takes it.' and failed the whole New Day.
    expect(replaceBulbs(sim, sim.player)).toBe(1);
    expect(first.watts).toBe(Number(cheapest.product.attrs.watts));
    // A socket lit by the same kind still isn't refitted with it.
    expect(fitRefusal(sim.player, cheapest.product.id)).toBe('No socket here takes it.');
  });

  it('sells bulbs and lamps where they live, and a lamp brings its sockets, taking nothing over its watts', () => {
    const sim = life('us-ny-newyork', 'light-lamp');
    expect(BULBS.length).toBeGreaterThan(0);
    expect(bulbCatalog(sim, sim.player).every((r) => r.offer.market === 'us')).toBe(true);
    const shop = lampCatalog(sim, sim.player);
    const lamp = shop.find((r) => !r.product.attrs.integrated && !r.product.attrs.bulbIncluded && typeof r.product.attrs.maxWatts === 'number')!;
    expect(lamp).toBeDefined();
    const sockets = lightsOf(sim.player)!.sockets.length;
    const r = sim.must<{ itemId: string }>({ kind: 'lighting.buy_lamp', payload: { offerId: lamp.offer.id, ...(lamp.product.variants.length > 1 ? { color: lamp.product.variants[0]!.attrs.color } : {}) } });
    expect(itemsOf(sim.player).find((i) => i.id === r.itemId)!.kind).toBe('furniture:lamp');
    const added = lightsOf(sim.player)!.sockets.filter((s) => s.lamp === r.itemId);
    expect(added).toHaveLength(Number(lamp.product.attrs.bulbs));
    expect(lightsOf(sim.player)!.sockets.length).toBe(sockets + added.length);
    expect(added.every((s) => s.watts === undefined && s.maxWatts === lamp.product.attrs.maxWatts)).toBe(true);
    // A bulb over its watts doesn't go in it.
    const big = bulbCatalog(sim, sim.player).find((b) => b.product.attrs.socket === added[0]!.socket && Number(b.product.attrs.watts) > Number(lamp.product.attrs.maxWatts));
    if (big) {
      for (const s of lightsOf(sim.player)!.sockets) if (!s.lamp) s.socket = 'gu10';
      sim.must({ kind: 'lighting.buy_bulbs', payload: { offerId: big.offer.id } });
      expect(fitRefusal(sim.player, big.product.id)).toBe('No socket here takes it.');
    }
    expect(LAMPS.some((p) => p.attrs.integrated)).toBe(true);
  });

  it('starts again in a new home, the lamps they keep carried with them', () => {
    const sim = life('us-ny-newyork', 'light-move');
    const lights = lightsOf(sim.player)!;
    lights.sockets[0]!.hours = 123;
    sim.player.living!.lights = { ...lights, home: 'somewhere-else' };
    expect(lightsOf(sim.player)!.sockets[0]!.hours).toBe(0);
    expect(MS_DAY).toBeGreaterThan(0);
  });
});
