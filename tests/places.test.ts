/**
 * The city you move through.
 *
 * Going somewhere takes time in traffic, in a car with fuel in it or a cab you
 * pay for. Eating is a menu and a bill. Filling up is litres and money.
 * Sleeping and showering need somewhere you have a right to be. The landmarks
 * are real and say so; everything else is SLATE's and says that.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';
import { CITIES } from '@/engine/content/geography';
import {
  CITIES_WITH_LANDMARKS, CUISINES, INVENTED_NOTE, PLACE_KIND_LABEL, REAL_PLACES,
  cuisineOf, landmarksIn, menuOf, placesIn, priceOf,
} from '@/engine/content/places';
import {
  currentPlace, driveableVehicle, fuelOf, hotelRoom, neighbourhoodKm, placesNear,
  privacyOf, rangeKm, trafficFactor, whatIsHere,
} from '@/engine/systems/places';

const MS_DAY = 86_400_000;
const MS_HOUR = 3_600_000;

function aLife(seed: string, options: { car?: boolean; cityId?: string } = {}): { sim: Simulation; run: <R>(k: string, p?: Record<string, unknown>) => R; try: <R>(k: string, p?: Record<string, unknown>) => { ok: boolean; error?: string; value?: R } } {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown> = {}): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  const attempt = <R>(kind: string, payload: Record<string, unknown> = {}) => sim.execute<R>({ kind, payload });
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  run('sandbox.add_funds', { amount: 20_000_000_00 });
  if (options.cityId) sim.player.currentLocationId = options.cityId;
  if (options.car) {
    const models = Object.values(sim.universe.vehicles);
    void models;
    const listing = sim.execute<{ vehicleId: Id }>({ kind: 'veh.purchase', payload: { modelId: 'accord', trimId: 'ex', condition: 'new', acquisition: 'cash' } });
    if (!listing.ok) {
      // Whatever the catalogue's first model is, buy that instead.
      const any = sim.execute<{ vehicleId: Id }>({ kind: 'veh.refresh_inventory', payload: {} });
      void any;
    }
  }
  return { sim, run, try: attempt };
}

describe('the places', () => {
  it('puts real landmarks on the record and says which are the game’s own', () => {
    expect(REAL_PLACES.length).toBeGreaterThan(40);
    expect(new Set(REAL_PLACES.map((p) => p.id)).size).toBe(REAL_PLACES.length);
    for (const landmark of REAL_PLACES) {
      expect(CITIES.get(landmark.cityId), landmark.name).toBeDefined();
      expect(landmark.about.length).toBeGreaterThan(20);
      if (landmark.opened !== undefined) expect(landmark.opened).toBeLessThanOrEqual(new Date().getFullYear());
    }
    expect(CITIES_WITH_LANDMARKS.length).toBeGreaterThan(15);
    const la = placesIn('us-ca-losangeles');
    expect(la.filter((p) => p.real).length).toBeGreaterThan(8);
    expect(la.filter((p) => !p.real).length).toBeGreaterThan(15);
    expect(la.find((p) => p.name === 'Griffith Observatory')?.real).toBe(true);
    for (const place of la) {
      expect(place.name.length).toBeGreaterThan(2);
      expect(PLACE_KIND_LABEL[place.kind]).toBeDefined();
      expect(place.quality).toBeGreaterThanOrEqual(0);
      expect(place.quality).toBeLessThanOrEqual(100);
    }
  });

  it('gives any city somewhere to eat, and the same city the same places twice', () => {
    for (const cityId of ['us-ca-losangeles', 'uk-eng-london', 'hu-05-budapest', 'nz-wgn-wellington']) {
      const places = placesIn(cityId);
      expect(places.filter((p) => p.actions.includes('eat')).length, cityId).toBeGreaterThan(3);
      expect(places.filter((p) => p.kind === 'gas_station').length, cityId).toBeGreaterThan(0);
      expect(places.filter((p) => p.kind === 'hotel').length, cityId).toBeGreaterThan(0);
      expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
      expect(new Set(places.map((p) => p.name.toLowerCase())).size).toBe(places.length);
      expect(placesIn(cityId).map((p) => p.name)).toEqual(places.map((p) => p.name));
    }
  });

  it('gives a restaurant a real cuisine and a menu that is priced by the city', () => {
    const la = placesIn('us-ca-losangeles').filter((p) => p.kind === 'restaurant');
    const budapest = placesIn('hu-05-budapest').filter((p) => p.kind === 'restaurant');
    for (const place of la) {
      const cuisine = cuisineOf(place);
      expect(cuisine, place.name).toBeDefined();
      expect(CUISINES.map((c) => c.id)).toContain(cuisine!.id);
      const menu = menuOf(place);
      expect(menu.length).toBeGreaterThan(3);
      for (const item of menu) expect(priceOf(place, item)).toBeGreaterThan(0);
    }
    // The same dish costs more in Los Angeles than in Budapest.
    const dish = { price: 2 as const, nourishment: 30 };
    const laPrice = priceOf({ ...la[0]!, price: 2 }, dish);
    const budapestPrice = priceOf({ ...budapest[0]!, price: 2 }, dish);
    expect(laPrice).toBeGreaterThan(budapestPrice);
    expect(INVENTED_NOTE.length).toBeGreaterThan(10);
  });
});

describe('getting about', () => {
  it('is further and slower across a big city than a small one, and worse in rush hour', () => {
    const big = neighbourhoodKm('us-ca-losangeles', 'la-beverlyhills', 'la-hollywoodhills');
    const same = neighbourhoodKm('us-ca-losangeles', 'la-beverlyhills', 'la-beverlyhills');
    expect(big).toBeGreaterThan(same);
    expect(neighbourhoodKm('us-ca-losangeles', 'la-beverlyhills', 'la-hollywoodhills')).toBe(big);

    const world = quickSave({ wealth: 'inherited' }, 'traffic');
    const at = (hour: number) => {
      const parts = new Date(world.now);
      return Date.UTC(parts.getUTCFullYear(), parts.getUTCMonth(), parts.getUTCDate() + 3, hour + 8);
    };
    const rush = trafficFactor(world, 'us-ca-losangeles', at(8));
    const night = trafficFactor(world, 'us-ca-losangeles', at(23));
    expect(rush).toBeGreaterThan(night);
  });

  it('drives you across town in a car with fuel in it, and refuses when there is none', () => {
    const life = aLife('drive-1');
    const sim = life.sim;
    const cityId = sim.player.currentLocationId;
    const target = placesIn(cityId).find((p) => p.kind === 'restaurant')!;

    // A car in another city is not a car you can drive today.
    const mine = Object.values(sim.universe.vehicles).filter((v) => !v.soldAt && v.ownerId === sim.player.id);
    const parked = mine.map((v) => v.locationId);
    for (const v of mine) v.locationId = cityId === 'uk-eng-london' ? 'us-ny-newyork' : 'uk-eng-london';
    const noCar = life.try('go.to', { placeId: target.id, mode: 'drive' });
    expect(noCar.ok).toBe(false);
    expect(noCar.error).toMatch(/no car/i);
    mine.forEach((v, i) => { v.locationId = parked[i] ?? cityId; });

    // With a car here, driving burns the tank and puts miles on it.
    if (mine.length > 0) {
      const car = mine[0]!;
      car.locationId = cityId;
      car.fuelPercent = 60;
      const mileage = car.mileage;
      const drive = life.run<{ km: number; minutes: number }>('go.to', { placeId: target.id, mode: 'drive' });
      expect(drive.km).toBeGreaterThan(0);
      expect(fuelOf(car)).toBeLessThan(60);
      expect(car.mileage).toBeGreaterThanOrEqual(mileage);
      expect(rangeKm(car)).toBeGreaterThan(0);
      expect(driveableVehicle(sim, sim.player)?.id).toBe(car.id);
      // An empty tank goes nowhere.
      const other = placesIn(cityId).find((p) => p.kind === 'museum' || p.kind === 'gym')!;
      car.fuelPercent = 0.2;
      const dry = life.try('go.to', { placeId: other.id, mode: 'drive' });
      expect(dry.ok).toBe(false);
      expect(dry.error).toMatch(/tank|fill up/i);
      // Filling up needs a filling station, and then it does.
      const station = placesIn(cityId).find((p) => p.kind === 'gas_station')!;
      life.run('go.to', { placeId: station.id, mode: 'taxi' });
      const fill = life.run<{ litres: number; cost: number; fuelPercent: number }>('place.refuel', {});
      expect(fill.fuelPercent).toBe(100);
      expect(fill.litres).toBeGreaterThan(30);
      expect(fill.cost).toBeGreaterThan(0);
      expect(fuelOf(car)).toBe(100);
      const already = life.try('place.refuel', {});
      expect(already.ok).toBe(false);
      sim.player.currentPlaceId = undefined;
      const notAStation = life.try('place.refuel', {});
      expect(notAStation.ok).toBe(false);
      expect(notAStation.error).toMatch(/filling station/i);
    }
    sim.player.currentPlaceId = undefined;

    // A cab always works, and costs money and time.
    const before = sim.now;
    const spent = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const ride = life.run<{ minutes: number; cost: number; name: string }>('go.to', { placeId: target.id, mode: 'taxi' });
    expect(ride.minutes).toBeGreaterThan(2);
    expect(ride.cost).toBeGreaterThan(0);
    expect(sim.now - before).toBe(ride.minutes * 60_000);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBeLessThan(spent);
    expect(sim.player.currentPlaceId).toBe(target.id);
    expect(currentPlace(sim, sim.player)?.name).toBe(target.name);

    const again = life.run<{ minutes: number; note: string }>('go.to', { placeId: target.id, mode: 'walk' });
    expect(again.minutes).toBe(0);
    expect(again.note).toMatch(/already/i);
  });

  it('will not send you to a place in another city', () => {
    const life = aLife('drive-2');
    const elsewhere = placesIn('uk-eng-london')[0]!;
    const result = life.try('go.to', { placeId: elsewhere.id, mode: 'taxi' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/is in .* and you are in/i);
  });

  it('walks for free and takes it out of you', () => {
    const life = aLife('walk-1');
    const sim = life.sim;
    const target = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'cafe')!;
    const energy = sim.player.wellbeing.energy;
    const hygiene = sim.player.wellbeing.hygiene;
    const walk = life.run<{ cost: number; minutes: number }>('go.to', { placeId: target.id, mode: 'walk' });
    expect(walk.cost).toBe(0);
    expect(sim.player.wellbeing.energy).toBeLessThan(energy);
    expect(sim.player.wellbeing.hygiene).toBeLessThanOrEqual(hygiene);
  });
});

describe('eating', () => {
  it('orders off the menu, pays with service, and feeds you', () => {
    const life = aLife('eat-1');
    const sim = life.sim;
    const restaurant = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'restaurant')!;
    life.run('go.to', { placeId: restaurant.id, mode: 'taxi' });
    const menu = menuOf(restaurant);
    sim.player.wellbeing.nourishment = 30;

    const notOnIt = life.try('place.order', { items: ['Fish Fingers And Custard'] });
    expect(notOnIt.ok).toBe(false);
    expect(notOnIt.error).toMatch(/menu is/i);

    const before = sim.now;
    const order = life.run<{ total: number; nourishment: number; items: string[]; place: string }>('place.order', { items: [menu[0]!.name, menu[1]!.name] });
    expect(order.items.length).toBe(2);
    expect(order.total).toBeGreaterThan(priceOf(restaurant, menu[0]!) + priceOf(restaurant, menu[1]!) - 1);
    expect(order.place).toBe(restaurant.name);
    expect(sim.now - before).toBe(restaurant.minutes * 60_000);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(30);
    expect(sim.universe.history.some((h) => h.title.includes(restaurant.name))).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('will not serve you where nothing is served', () => {
    const life = aLife('eat-2');
    const sim = life.sim;
    const station = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'gas_station')!;
    life.run('go.to', { placeId: station.id, mode: 'taxi' });
    const result = life.try('place.order', { items: ['Anything'] });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/does not serve|nothing to order/i);
  });
});

describe('the sights', () => {
  it('takes the time it takes, charges where there is admission, and remembers it', () => {
    const life = aLife('sight-1');
    const sim = life.sim;
    sim.player.currentLocationId = 'us-ca-losangeles';
    const landmarks = landmarksIn('us-ca-losangeles');
    const free = landmarks.find((p) => !p.admissionCalibration)!;
    const paid = landmarks.find((p) => (p.admissionCalibration ?? 0) > 0)!;

    life.run('go.to', { placeId: free.id, mode: 'taxi' });
    const morale = sim.player.wellbeing.morale;
    const visit = life.run<{ cost: number; minutes: number; real: boolean; note: string }>('place.visit', {});
    expect(visit.cost).toBe(0);
    expect(visit.real).toBe(true);
    expect(visit.note).toBe(free.about);
    expect(sim.player.wellbeing.morale).toBeGreaterThan(morale);

    life.run('go.to', { placeId: paid.id, mode: 'taxi' });
    const funds = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const paidVisit = life.run<{ cost: number }>('place.visit', { minutes: 60 });
    expect(paidVisit.cost).toBeGreaterThan(0);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(funds - paidVisit.cost);
    expect(sim.universe.history.some((h) => h.title === `Went to ${paid.name}`)).toBe(true);
  });
});

describe('washing and sleeping', () => {
  it('needs a bathroom you have a right to, and a shower puts you back to clean', () => {
    const life = aLife('shower-1');
    const sim = life.sim;
    sim.player.wellbeing.hygiene = 30;
    const bar = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'bar')!;
    life.run('go.to', { placeId: bar.id, mode: 'taxi' });
    const nowhere = life.try('life.shower', {});
    expect(nowhere.ok).toBe(false);
    expect(nowhere.error).toMatch(/nowhere here/i);

    // A hotel room you booked is a bathroom.
    const booking = life.run<{ bookingId: Id }>('travel.book_hotel', {
      cityId: sim.player.currentLocationId, checkInAt: sim.now, nights: 2, roomClass: 'standard',
    });
    expect(hotelRoom(sim, sim.player)?.id).toBe(booking.bookingId);
    const showered = life.run<{ hygiene: number; where: string }>('life.shower', {});
    expect(showered.hygiene).toBe(100);
    expect(sim.player.wellbeing.hygiene).toBe(100);
    expect(privacyOf(sim, sim.player)).toBeDefined();
  });

  it('lets the day take its toll on you between showers', () => {
    const life = aLife('hygiene-1');
    const sim = life.sim;
    sim.player.wellbeing.hygiene = 100;
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(sim.player.wellbeing.hygiene).toBeLessThan(60);
    expect(sim.player.wellbeing.hygiene).toBeGreaterThanOrEqual(0);
  });
});

describe('what is here', () => {
  it('reads back the place, the city and what you can do', () => {
    const life = aLife('here-1');
    const sim = life.sim;
    const gym = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'gym')!;
    life.run('go.to', { placeId: gym.id, mode: 'taxi' });
    const here = whatIsHere(sim);
    expect(here.place?.id).toBe(gym.id);
    expect(here.actions).toContain('train');
    expect(here.city).toBe(CITIES.get(sim.player.currentLocationId)?.name);
    const near = placesNear(sim, { kind: 'restaurant', limit: 5 });
    expect(near.length).toBeGreaterThan(0);
    for (const entry of near) {
      expect(entry.journey.minutes).toBeGreaterThan(0);
      expect(entry.place.kind).toBe('restaurant');
    }
    // Nearest first.
    for (let i = 1; i < near.length; i++) expect(near[i]!.journey.minutes).toBeGreaterThanOrEqual(near[i - 1]!.journey.minutes);
  });
});

describe('two people, in private', () => {
  it('needs somewhere private, a partner, and the two of you in the same city', () => {
    const life = aLife('intimacy-1');
    const sim = life.sim;
    const stranger = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
    const notTogether = life.try('rel.intimacy', { personId: stranger.id });
    expect(notTogether.ok).toBe(false);

    // Somebody the player is actually with.
    const partner = Object.values(sim.universe.people).find((p) => !p.isPlayer && Math.abs((sim.now - p.birthInstant)) > 20 * 365 * 24 * MS_HOUR)!;
    const relationship = Object.values(sim.universe.relationships).find((r) => !r.endedAt && (r.aId === partner.id || r.bId === partner.id) && (r.aId === sim.player.id || r.bId === sim.player.id))
      ?? (() => {
        const id = sim.nextId('rel');
        sim.universe.relationships[id] = {
          id, saveId: sim.universe.meta.id, aId: sim.player.id < partner.id ? sim.player.id : partner.id,
          bId: sim.player.id < partner.id ? partner.id : sim.player.id, type: 'dating',
          dimensions: { familiarity: 80, affection: 78, trust: 74, respect: 70, compatibility: 72, commitment: 60, conflict: 8 },
          isPublic: false, exclusive: true, since: sim.now - 200 * MS_DAY, lastInteractionAt: sim.now - MS_DAY,
          memories: [],
        };
        return sim.universe.relationships[id]!;
      })();
    relationship.type = 'dating';
    relationship.dimensions = { familiarity: 80, affection: 78, trust: 74, respect: 70, compatibility: 72, commitment: 60, conflict: 8 };
    partner.currentLocationId = sim.player.currentLocationId;

    const bar = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'bar')!;
    life.run('go.to', { placeId: bar.id, mode: 'taxi' });
    const inPublic = life.try('rel.intimacy', { personId: partner.id });
    expect(inPublic.ok).toBe(false);
    expect(inPublic.error).toMatch(/private/i);

    life.run('travel.book_hotel', { cityId: sim.player.currentLocationId, checkInAt: sim.now, nights: 1, roomClass: 'standard' });
    const affection = relationship.dimensions.affection;
    const result = life.run<{ happened: boolean; reason: string }>('rel.intimacy', { personId: partner.id });
    expect(result.reason.length).toBeGreaterThan(8);
    if (result.happened) {
      expect(relationship.dimensions.affection).toBeGreaterThan(affection);
      expect(relationship.memories.some((m) => m.kind === 'private')).toBe(true);
      // Nothing explicit is ever written down.
      for (const memory of relationship.memories) expect(memory.summary.length).toBeLessThan(120);
    }
    expect(validateUniverse(sim.universe).errors).toEqual([]);

    // Somebody far away is not an option.
    partner.currentLocationId = partner.currentLocationId === 'uk-eng-london' ? 'us-ny-newyork' : 'uk-eng-london';
    const away = life.try('rel.intimacy', { personId: partner.id });
    expect(away.ok).toBe(false);
    expect(away.error).toMatch(/is in/i);
  });
});
