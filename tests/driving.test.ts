/**
 * Driving: a car, a road, and somewhere real at the end of it.
 *
 * The places offered are the real nearest places, capped at fifty and a
 * day's drive. You cannot drive without a car, with someone else's car, or
 * with a car that is in another city. Fuel is paid for once, and a retried
 * drive with the same key is not charged twice. And when you arrive you are
 * there: the city, the clock, the car, the miles on it, and the record.
 */

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CITIES, addCountryCities } from '@/engine/content/geography';
import {
  DRIVE_OPTIONS, MAX_DRIVE_KM, driveMinutes, drivingOptions, estimateDrive, fuelCostCents, roadKm,
} from '@/engine/systems/driving';
import { placeProfile } from '@/engine/world/place';
import { formatLocal, currencyInfo, hasRate } from '@/engine/content/currency';
import { sunTimes, formatDaylight } from '@/engine/core/sun';
import { languageNames } from '@/engine/content/languages';
import { instantFromZoned, zonedParts } from '@/engine/core/time';

const la = CITIES.get('us-ca-losangeles')!;
const sanDiego = CITIES.get('us-ca-sandiego')!;
const phoenix = CITIES.get('us-az-phoenix')!;
const newYork = CITIES.get('us-ny-newyork')!;

/**
 * A save with a car in the player's hands. The opening purchase can fall
 * through for a seed whose listings are out of reach, so when it does, a car
 * from the world is put in the player's name — this is a test of driving,
 * not of the dealership.
 */
function withCar(seed: string) {
  const sim = quickSave({ startWithVehicle: true, wealth: 'comfortable' }, seed);
  let car = Object.values(sim.universe.vehicles).find((v) => v.ownerId === sim.player.id);
  if (!car) {
    // The same thing the opening does: the cheapest listing, priced to what
    // is in the account, bought for real through the bus.
    const listing = Object.values(sim.universe.vehicleListings)
      .filter((l) => l.status === 'active' && l.locationId === sim.player.currentLocationId)
      .sort((a, b) => a.price - b.price)[0];
    if (!listing) throw new Error('nothing is for sale where the player is');
    const accountId = sim.player.primaryAccountId!;
    listing.price = Math.min(listing.price, Math.max(1_000_00, Math.round(sim.ledger.availableFunds(accountId) * 0.5)));
    const bought = sim.execute<{ vehicleId: string }>({ kind: 'veh.purchase', payload: { listingId: listing.id, acquisition: 'cash', accountId } });
    if (!bought.ok || !bought.value) throw new Error(`could not buy a car: ${bought.error}`);
    car = sim.universe.vehicles[bought.value.vehicleId];
    if (!car) throw new Error('the purchase produced no car');
  }
  return { sim, car };
}

describe('the road', () => {
  it('is longer than the crow flies and takes the time it takes', () => {
    const km = roadKm(la, sanDiego);
    expect(km).toBeGreaterThan(180);
    expect(km).toBeLessThan(240);
    expect(driveMinutes(km)).toBeGreaterThan(120);
    expect(driveMinutes(km)).toBeLessThan(200);
    expect(driveMinutes(5)).toBeLessThan(driveMinutes(50));
  });

  // The real neighborhood, as the Travel screen has it: every town in the country.
  beforeAll(() => { addCountryCities('us', readFileSync('public/geo/us.tsv', 'utf8')); });

  it('offers fifty real places across the day\'s drive, nearest first', () => {
    const sim = quickSave({}, 'driving-options');
    const options = drivingOptions(sim, la.id);
    expect(options.length).toBe(DRIVE_OPTIONS);
    for (let i = 1; i < options.length; i++) expect(options[i]!.km).toBeGreaterThanOrEqual(options[i - 1]!.km);
    for (const o of options) {
      expect(o.km).toBeLessThanOrEqual(MAX_DRIVE_KM);
      expect(o.city.id).not.toBe(la.id);
      expect(o.city.kind).not.toBe('section');
    }
    // Across town, the next city, and the far end of the day: not fifty suburbs.
    expect(options.some((o) => o.km < 40)).toBe(true);
    expect(options.some((o) => o.km > 300)).toBe(true);
    expect(options.some((o) => o.city.id === 'us-ca-longbeach')).toBe(true);
    expect(options.some((o) => o.city.id === 'us-nv-lasvegas')).toBe(true);
    expect(options.some((o) => o.city.id === newYork.id)).toBe(false);
  });

  it('never offers a section of the city you stand in, and finds any place in range by name', () => {
    const sim = quickSave({}, 'driving-sections');
    expect(CITIES.get('us-ca-hollywood')?.kind).toBe('section');
    expect(CITIES.get('us-ca-sacramento')?.kind).toBe('regional_capital');
    const fromLa = drivingOptions(sim, la.id);
    expect(fromLa.some((o) => o.city.id === 'us-ca-hollywood' || o.city.id === 'us-ca-echopark')).toBe(false);
    expect(drivingOptions(sim, la.id, undefined, { query: 'hollywood' })).toEqual([]);
    const search = drivingOptions(sim, la.id, undefined, { query: 'santa mon' });
    expect(search.map((o) => o.city.id)).toContain('us-ca-santamonica');
    expect(drivingOptions(sim, la.id, undefined, { query: 'new york' })).toEqual([]);
  });

  it('costs fuel by the car and the country', () => {
    const { sim, car } = withCar('driving-fuel');
    const cost = fuelCostCents(300, car, 'us');
    expect(cost).toBeGreaterThan(0);
    expect(fuelCostCents(300, car, 'uk')).toBeGreaterThan(cost);
    expect(fuelCostCents(300, undefined, 'us')).toBe(0);
    expect(estimateDrive(sim, la, phoenix, car).crossesZone).toBe(true);
    expect(estimateDrive(sim, la, sanDiego, car).crossesZone).toBe(false);
  });
});

describe('driving somewhere', () => {
  it('needs a car', () => {
    const sim = quickSave({ startWithVehicle: false }, 'driving-nocar');
    const result = sim.execute({ kind: 'travel.drive', payload: { vehicleId: 'nope', toCityId: sanDiego.id } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/car/i);
  });

  it('refuses someone else\'s car, a car in another city, and a drive too far', () => {
    const { sim, car } = withCar('driving-refuse');
    const stranger = Object.values(sim.universe.vehicles).find((v) => v.ownerId !== sim.player.id);
    if (stranger) {
      expect(sim.execute({ kind: 'travel.drive', payload: { vehicleId: stranger.id, toCityId: sanDiego.id } }).ok).toBe(false);
    }
    car.locationId = newYork.id;
    const away = sim.execute({ kind: 'travel.drive', payload: { vehicleId: car.id, toCityId: sanDiego.id } });
    expect(away.ok).toBe(false);
    expect(away.error).toMatch(/New York/);
    car.locationId = la.id;
    const far = sim.execute({ kind: 'travel.drive', payload: { vehicleId: car.id, toCityId: newYork.id } });
    expect(far.ok).toBe(false);
    expect(far.error).toMatch(/flight/);
  });

  it('takes you there: the city, the clock, the car and the record', () => {
    const { sim, car } = withCar('driving-arrive');
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const mileage = car.mileage;
    const result = sim.execute<{ arriveAt: number; km: number; fuelCents: number }>({
      kind: 'travel.drive', payload: { vehicleId: car.id, toCityId: phoenix.id }, idempotencyKey: 'drive:phoenix',
    });
    expect(result.ok).toBe(true);
    const { arriveAt, fuelCents } = result.value!;
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - fuelCents);
    expect(sim.player.currentLocationId).toBe(la.id); // still on the road

    sim.advanceTo(arriveAt + 1);
    expect(sim.player.currentLocationId).toBe(phoenix.id);
    expect(sim.zone).toBe(phoenix.timeZone);
    expect(car.locationId).toBe(phoenix.id);
    expect(car.mileage).toBeGreaterThan(mileage + 300);
    expect(sim.universe.history.some((h) => /Drove To Phoenix/.test(h.title))).toBe(true);
  });

  it('charges the fuel once however many times the same drive is sent', () => {
    const { sim, car } = withCar('driving-retry');
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const first = sim.execute<{ fuelCents: number }>({ kind: 'travel.drive', payload: { vehicleId: car.id, toCityId: sanDiego.id }, idempotencyKey: 'drive:sd' });
    const again = sim.execute<{ fuelCents: number }>({ kind: 'travel.drive', payload: { vehicleId: car.id, toCityId: sanDiego.id }, idempotencyKey: 'drive:sd' });
    expect(first.ok && again.ok).toBe(true);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - first.value!.fuelCents);
    expect(sim.universe.scheduled.filter((i) => i.kind === 'travel.drive_arrive').length).toBe(1);
  });

  it('leaves the car behind when you fly', () => {
    const { sim, car } = withCar('driving-fly');
    expect(car.locationId).toBe(la.id);
    // Flying is booked through the travel system; the car does not come.
    sim.player.currentLocationId = newYork.id;
    expect(car.locationId).toBe(la.id);
    const stuck = sim.execute({ kind: 'travel.drive', payload: { vehicleId: car.id, toCityId: 'us-ma-boston' } });
    expect(stuck.ok).toBe(false);
    expect(stuck.error).toMatch(/Los Angeles/);
  });
});

describe('a place, as it is to somebody standing in it', () => {
  it('reads its own clock, taxes, prices and money', () => {
    const sim = quickSave({}, 'place-la');
    const here = placeProfile(sim, la.id)!;
    expect(here.away).toBe(false);
    expect(here.zone).toBe('America/Los_Angeles');
    expect(here.currency.code).toBe('USD');
    expect(here.effectiveIncomeTax).toBeGreaterThan(0.1);
    expect(here.effectiveIncomeTax).toBeLessThan(0.45);
    expect(here.salesTax).toBeGreaterThan(0);
    expect(here.languages.length).toBeGreaterThan(0);
    expect(here.sun.daylightMinutes).toBeGreaterThan(9 * 60);
    expect(here.sun.daylightMinutes).toBeLessThan(15 * 60);
  });

  it('knows it is away, how far, and how many hours off home time', () => {
    const sim = quickSave({}, 'place-away');
    sim.player.currentLocationId = newYork.id;
    const there = placeProfile(sim, newYork.id)!;
    expect(there.away).toBe(true);
    expect(there.distanceFromHome).toMatch(/mi$/);
    expect(there.hoursFromHome).toBe(3);
    const london = placeProfile(sim, 'uk-eng-london')!;
    expect(london.currency.code).toBe('GBP');
    expect(london.localRent).toMatch(/£/);
    expect(london.distanceFromHome).toMatch(/mi$/); // the UK drives in miles
    const paris = placeProfile(sim, 'fr-idf-paris')!;
    expect(paris.currency.code).toBe('EUR');
    expect(paris.distanceFromHome).toMatch(/km$/);
    expect(paris.units.temperature).toBe('C');
  });

});

describe('money as each country writes it', () => {
  it('writes yen without decimals and euros with them', () => {
    expect(formatLocal(150_00, 'JPY')).toBe('¥22,500');
    expect(formatLocal(100_00, 'EUR')).toBe('€92.00');
    expect(formatLocal(100_00, 'SEK')).toBe('1,060.00 kr');
    expect(formatLocal(1_00, 'SEK')).toBe('10.60 kr');
    expect(currencyInfo('GBP').symbol).toBe('£');
  });

  it('never invents a rate', () => {
    expect(hasRate('USD')).toBe(true);
    expect(hasRate('XYZ')).toBe(false);
    expect(formatLocal(100_00, 'XYZ')).toBeUndefined();
    expect(currencyInfo('XYZ').symbol).toBe('XYZ');
  });
});

describe('the sun', () => {
  const at = (month: number, day: number, zone: string) => instantFromZoned({ year: 2026, month, day, hour: 12, minute: 0, second: 0 }, zone);

  it('gives Los Angeles a long June and a short December', () => {
    const june = sunTimes(at(6, 21, la.timeZone), la.latitude, la.longitude, la.timeZone);
    const december = sunTimes(at(12, 21, la.timeZone), la.latitude, la.longitude, la.timeZone);
    expect(june.daylightMinutes).toBeGreaterThan(14 * 60);
    expect(december.daylightMinutes).toBeLessThan(10 * 60 + 15);
    const rise = zonedParts(june.sunrise!, la.timeZone);
    expect(rise.hour).toBeGreaterThanOrEqual(5);
    expect(rise.hour).toBeLessThanOrEqual(6);
  });

  it('runs the other way in Sydney, and evenly at the equator', () => {
    const sydney = CITIES.get('au-nsw-sydney')!;
    const june = sunTimes(at(6, 21, sydney.timeZone), sydney.latitude, sydney.longitude, sydney.timeZone);
    const december = sunTimes(at(12, 21, sydney.timeZone), sydney.latitude, sydney.longitude, sydney.timeZone);
    expect(december.daylightMinutes).toBeGreaterThan(june.daylightMinutes + 3 * 60);
    const equator = sunTimes(at(3, 21, 'UTC'), 0, 0, 'UTC');
    expect(Math.abs(equator.daylightMinutes - 12 * 60)).toBeLessThan(20);
  });

  it('knows a polar day and a polar night', () => {
    expect(sunTimes(at(6, 21, 'UTC'), 80, 20, 'UTC').polar).toBe('day');
    expect(sunTimes(at(12, 21, 'UTC'), 80, 20, 'UTC').polar).toBe('night');
    expect(formatDaylight(605)).toBe('10h 5m');
  });
});

describe('languages', () => {
  it('names them from GeoNames codes and never duplicates', () => {
    expect(languageNames('es-MX,en')).toEqual(['Spanish', 'English']);
    expect(languageNames('en-US,es-US,haw,fr')).toEqual(['English', 'Spanish', 'Hawaiian', 'French']);
    expect(languageNames('en-GB,cy-GB,gd')).toEqual(['English', 'Welsh', 'Scottish Gaelic']);
    expect(languageNames('zz')).toEqual(['ZZ']);
  });
});
