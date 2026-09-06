/**
 * Where things are kept.
 *
 * A home's garage holds as many as its kind, its features and what is built
 * on it say, a motorcycle taking half a space; what does not fit goes to the
 * driveway, then the street, and a paid unit is there for the asking. A boat
 * takes a slip by the foot where the marina has one at its length, a dry
 * stack, a trailer at home or the home's own dock. An aircraft takes a hangar
 * or a tie-down at the home field and sits on a foreign ramp at a nightly
 * rate until it comes home. Outside wears; indoors is worth a little on the
 * premium. Moving home moves the cars. A jet or a boat can carry a name.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { Property, Vehicle, VehicleListing } from '@/engine/domain/model';
import { VEHICLE_MODELS, type VehicleKind } from '@/engine/content/vehicles';
import { createVehicle, refreshInventory, vehicleKind } from '@/engine/systems/vehicles';
import { dealershipsIn, listingsAt, lotSells } from '@/engine/systems/dealership';
import { generateProperty, moveIn } from '@/engine/systems/property';
import { buildQuote } from '@/engine/systems/services';
import {
  DRIVEWAY_SPACES, MOTORCYCLE_SPACE, TRAILER_SPACES, dockFeetOf, garageSpacesOf, hasDriveway, homeSpaces, keepingLabel, keepingOptions,
  marinasIn, placeVehicle, slipsAt, ensureKeepings,
} from '@/engine/systems/storage';
import { localHour } from '@/engine/systems/fitness';

const LA = 'us-ca-losangeles';

function aLife(seed = 'keeping', funding = 5_000_000_00): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, funding, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  for (const v of Object.values(sim.universe.vehicles)) if (!v.soldAt) sim.execute({ kind: 'veh.sell', payload: { vehicleId: v.id } });
  const profile = sim.universe.creditProfiles[sim.player.id];
  if (profile) profile.score = 760;
  refreshInventory(sim);
  const hour = localHour(sim);
  if (hour < 10 || hour >= 17) sim.advanceTo(sim.now + ((10 - hour + 24) % 24) * MS_HOUR);
  return sim;
}

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): R {
  const result = sim.execute<R>({ kind, payload });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

/** A home of a kind, owned and lived in, with exactly these features. */
function liveIn(sim: Simulation, kind: Property['kind'], features: string[], seed: string = kind): Property {
  const property = generateProperty(sim, sim.player.currentLocationId, kind, `keeping-${seed}`);
  property.features = features;
  property.ownerId = sim.player.id;
  property.ownerKind = 'person';
  property.tenure = 'owned';
  moveIn(sim, sim.player.id, property.id);
  return property;
}

/** A thing of a kind, made rather than bought, so a test can place it itself. */
function aThing(sim: Simulation, modelId: string, trimId?: string): Vehicle {
  const model = VEHICLE_MODELS.require(modelId);
  const trim = trimId ? model.trims.find((t) => t.id === trimId)! : model.trims[0]!;
  return createVehicle(sim, {
    ownerId: sim.player.id, modelId, trimId: trim.id, year: 2024, mileage: 10,
    configuration: { paint: 'Black', wheels: 'Standard', interior: 'Black', options: [], modificationIds: [] },
    purchasePrice: trim.msrp, acquisition: 'cash', condition: 96,
  });
}

function buy(sim: Simulation, kind: VehicleKind, pick?: (l: VehicleListing) => boolean): Vehicle {
  const lot = dealershipsIn(sim).find((l) => lotSells(l) === kind)!;
  const listing = listingsAt(sim, lot.id).filter((l) => !pick || pick(l))[0];
  if (!listing) throw new Error(`Nothing on the ${kind} lot`);
  must(sim, 'go.to', { placeId: lot.id, mode: 'taxi' });
  const { dealId } = must<{ dealId: string }>(sim, 'deal.open', { placeId: lot.id, listingId: listing.id });
  must(sim, 'deal.offer', { dealId, price: sim.universe.vehicleDeals[dealId]!.currentAsk });
  const { vehicleId } = must<{ vehicleId: string }>(sim, 'deal.sign', { dealId, acquisition: 'cash' });
  return sim.universe.vehicles[vehicleId]!;
}

function billsOf(sim: Simulation, vehicleId: string) {
  return Object.values(sim.universe.bills).filter((b) => b.refType === 'vehicle' && b.refId === vehicleId);
}

beforeAll(async () => { await loadAllSections(); });

describe('a home', () => {
  it('has the garage its kind and features say, a driveway when it has ground, and a dock only when it says so', () => {
    const sim = aLife();
    const flat = liveIn(sim, 'apartment', []);
    expect(garageSpacesOf(sim, flat)).toBe(0);
    expect(hasDriveway(flat)).toBe(false);
    const condo = liveIn(sim, 'condo', ['Parking Space']);
    expect(garageSpacesOf(sim, condo)).toBe(1);
    const house = liveIn(sim, 'house', ['Garage', 'Garden']);
    expect(garageSpacesOf(sim, house)).toBe(2);
    expect(hasDriveway(house)).toBe(true);
    expect(dockFeetOf(house)).toBe(0);
    const mansion = liveIn(sim, 'mansion', ['Pool', 'Private Dock']);
    expect(garageSpacesOf(sim, mansion)).toBe(6);
    expect(dockFeetOf(mansion)).toBe(80);
    const estate = liveIn(sim, 'estate', []);
    expect(garageSpacesOf(sim, estate)).toBe(10);
    const spaces = homeSpaces(sim, estate.id)!;
    expect(spaces.garage.spaces).toBe(10);
    expect(spaces.driveway.spaces).toBe(DRIVEWAY_SPACES);
  });

  it('only puts a private dock on a home where there is water', () => {
    const sim = aLife();
    let docks = 0;
    for (let i = 0; i < 40; i++) {
      const p = generateProperty(sim, 'us-nv-lasvegas', 'villa', `dry-${i}`);
      if (p.features.includes('Private Dock')) docks += 1;
    }
    expect(docks).toBe(0);
    let wet = 0;
    for (let i = 0; i < 40; i++) {
      const p = generateProperty(sim, LA, 'villa', `wet-${i}`);
      if (p.features.includes('Private Dock')) wet += 1;
    }
    expect(wet).toBeGreaterThan(0);
  });
});

describe('cars and motorcycles', () => {
  it('fill the garage first, a motorcycle taking half a space, then the driveway, then the street', () => {
    const sim = aLife();
    liveIn(sim, 'house', ['Garage']); // two spaces and a driveway
    const first = aThing(sim, 'toyota_corolla', 'le'); placeVehicle(sim, first);
    const second = aThing(sim, 'honda_civic', 'lx'); placeVehicle(sim, second);
    expect(first.keeping?.kind).toBe('garage');
    expect(second.keeping?.kind).toBe('garage');
    expect(first.keeping?.monthly).toBe(0);
    const third = aThing(sim, 'mazda_mx5', 'club'); placeVehicle(sim, third);
    expect(third.keeping?.kind).toBe('driveway');
    const fourth = aThing(sim, 'jeep_wrangler', 'sport'); placeVehicle(sim, fourth);
    expect(fourth.keeping?.kind).toBe('driveway');
    const fifth = aThing(sim, 'ford_f150', 'xl'); placeVehicle(sim, fifth);
    expect(fifth.keeping?.kind).toBe('street');
    const home = homeSpaces(sim, sim.player.residenceId!)!;
    expect(home.garage.used).toBe(2);
    expect(home.driveway.used).toBe(2);

    // A bike squeezes in where a car would not.
    must(sim, 'stor.keep', { vehicleId: second.id, kind: 'street' });
    const bike = aThing(sim, 'ducati_monster', 'base'); placeVehicle(sim, bike);
    const bike2 = aThing(sim, 'yamaha_mt09', 'base'); placeVehicle(sim, bike2);
    expect(bike.keeping?.kind).toBe('garage');
    expect(bike2.keeping?.kind).toBe('garage');
    expect(homeSpaces(sim, sim.player.residenceId!)!.garage.used).toBe(1 + 2 * MOTORCYCLE_SPACE);
    expect(attempt(sim, 'stor.keep', { vehicleId: second.id, kind: 'garage' }).error).toMatch(/no room/i);
  });

  it('go to a paid unit for the asking, and come home when there is room again', () => {
    const sim = aLife();
    liveIn(sim, 'townhouse', []); // one space
    const car = aThing(sim, 'bmw_3series', '330i'); placeVehicle(sim, car);
    expect(car.keeping?.kind).toBe('garage');
    const unit = keepingOptions(sim, car).find((o) => o.kind === 'storage_unit')!;
    expect(unit.available).toBe(true);
    expect(unit.monthly).toBeGreaterThan(0);
    const moved = must<{ kind: string; monthly: number }>(sim, 'stor.keep', { vehicleId: car.id, kind: 'storage_unit', placeId: unit.placeId });
    expect(moved.monthly).toBe(unit.monthly);
    const bill = billsOf(sim, car.id).find((b) => b.active)!;
    expect(bill.name).toMatch(/^Storage — /);
    expect(bill.amount).toBe(unit.monthly);
    expect(keepingLabel(sim, car)).toMatch(/^Storage Unit · /);
    expect(attempt(sim, 'stor.keep', { vehicleId: car.id, kind: 'storage_unit', placeId: unit.placeId }).error).toMatch(/already kept/);
    must(sim, 'stor.keep', { vehicleId: car.id, kind: 'garage' });
    expect(sim.universe.bills[bill.id]!.active).toBe(false);
    expect(car.keeping?.billId).toBeUndefined();
  });

  it('are placed when bought, and moved when you move home', () => {
    const sim = aLife();
    liveIn(sim, 'house', ['Garage']);
    const car = buy(sim, 'car');
    expect(car.keeping?.kind).toBe('garage');
    const flat = liveIn(sim, 'apartment', [], 'flat');
    expect(sim.player.residenceId).toBe(flat.id);
    expect(sim.universe.vehicles[car.id]!.keeping?.kind).toBe('street');
    expect(sim.universe.notifications ? Object.values(sim.universe.notifications).some((n) => /No Room For The/.test(n.title)) : true).toBe(true);
  });

  it('wear standing outside and not in a garage, and cost more to insure there', () => {
    const sim = aLife();
    liveIn(sim, 'house', ['Garage']);
    const inside = aThing(sim, 'toyota_corolla', 'le'); placeVehicle(sim, inside);
    const outside = aThing(sim, 'honda_civic', 'lx'); placeVehicle(sim, outside);
    must(sim, 'stor.keep', { vehicleId: outside.id, kind: 'street' });
    const before = { inside: inside.condition, outside: outside.condition };
    sim.advanceTo(sim.now + 32 * MS_DAY);
    expect(sim.universe.vehicles[outside.id]!.condition).toBeLessThan(before.outside);
    expect(sim.universe.vehicles[inside.id]!.condition).toBe(before.inside);

    // Something worth insuring, so the premium is above the floor the factor moves.
    must(sim, 'stor.keep', { vehicleId: inside.id, kind: 'street' });
    const dear = aThing(sim, 'porsche_911', 'turbos'); placeVehicle(sim, dear);
    expect(dear.keeping?.kind).toBe('garage');
    const garaged = buildQuote(sim, sim.player.id, 'auto', [{ type: 'vehicle', id: dear.id }]).premium;
    must(sim, 'stor.keep', { vehicleId: dear.id, kind: 'street' });
    const streeted = buildQuote(sim, sim.player.id, 'auto', [{ type: 'vehicle', id: dear.id }]).premium;
    expect(streeted).toBeGreaterThan(garaged);
  });
});

describe('boats', () => {
  it('take a slip by the foot at a marina that has one at their length, and are refused where the water is too small', () => {
    const sim = aLife();
    const marina = marinasIn(LA)[0]!;
    expect(marina.name).toBe('Marina del Rey');
    const small = aThing(sim, 'mastercraft_xt23'); // 23 ft
    const berth = keepingOptions(sim, small).find((o) => o.kind === 'berth' && o.placeId === marina.id)!;
    expect(berth.available).toBe(true);
    const band = slipsAt(sim, marina).find((b) => 23 <= b.upTo)!;
    expect(berth.monthly).toBe(Math.round(band.perFoot * 23 * 1.52));
    const freeBefore = band.free;
    must(sim, 'stor.keep', { vehicleId: small.id, kind: 'berth', placeId: marina.id });
    expect(slipsAt(sim, marina).find((b) => b.upTo === band.upTo)!.free).toBe(freeBefore - 1);
    expect(billsOf(sim, small.id).find((b) => b.active)!.name).toMatch(/^Berth — /);

    // Seventy-two feet of Azimut at a marina whose longest slip is sixty-five.
    sim.player.currentLocationId = 'us-ca-sanfrancisco';
    const yacht = aThing(sim, 'azimut_72');
    const sfMarina = marinasIn('us-ca-sanfrancisco')[0]!;
    const sfBerth = keepingOptions(sim, yacht).find((o) => o.kind === 'berth' && o.placeId === sfMarina.id)!;
    expect(sfBerth.available).toBe(false);
    expect(sfBerth.reason).toMatch(/up to 65 ft/);
    expect(keepingOptions(sim, yacht).find((o) => o.kind === 'dry_stack')!.reason).toMatch(/too long for the rack/);
  });

  it('sit on a trailer at home when small enough and there is room, and pay the ramp each time out', () => {
    const sim = aLife();
    liveIn(sim, 'house', ['Garage']); // two spaces
    const boat = aThing(sim, 'bostonwhaler_montauk190'); // 19 ft
    placeVehicle(sim, boat);
    expect(boat.keeping?.kind).toBe('trailer');
    expect(boat.keeping?.placeId).toBe('garage');
    expect(homeSpaces(sim, sim.player.residenceId!)!.garage.used).toBe(TRAILER_SPACES);
    const out = attempt<{ cost: number }>(sim, 'veh.cruise', { vehicleId: boat.id, hours: 2 });
    if (!out.ok) { expect(out.error).toMatch(/storm/); return; }
    expect(sim.ledger.history(sim.player.primaryAccountId!, 5).some((t) => t.memo.startsWith('Launch ramp — '))).toBe(true);
    const big = aThing(sim, 'searay_sundancer320'); // 32 ft
    expect(keepingOptions(sim, big).find((o) => o.kind === 'trailer')!.reason).toMatch(/too long to trailer/);
  });

  it('go to the home dock for nothing when there is one long enough', () => {
    const sim = aLife();
    const home = liveIn(sim, 'villa', ['Private Dock']); // 40 ft
    expect(dockFeetOf(home)).toBe(40);
    const boat = aThing(sim, 'axopar_37xc'); // 37 ft
    placeVehicle(sim, boat);
    expect(boat.keeping?.kind).toBe('private_dock');
    expect(boat.keeping?.monthly).toBe(0);
    const another = aThing(sim, 'chriscraft_launch27');
    expect(keepingOptions(sim, another).find((o) => o.kind === 'private_dock')!.reason).toMatch(/already at the dock/);
    const yacht = aThing(sim, 'azimut_55');
    expect(keepingOptions(sim, yacht).find((o) => o.kind === 'private_dock')!.reason).toMatch(/takes 40 ft/);
  });
});

describe('aircraft', () => {
  it('take a hangar at the home field, can be moved to a tie-down for less, and pay the ramp away from home', () => {
    const sim = aLife('keeping-jet', 150_000_000_00);
    const jet = buy(sim, 'jet', (l) => (VEHICLE_MODELS.get(l.catalogId.split(':')[0]!)?.trims[0]?.craft?.rangeKm ?? 0) >= 2_000);
    expect(jet.keeping?.kind).toBe('hangar');
    expect(jet.homeKeeping?.kind).toBe('hangar');
    const hangar = jet.keeping!.monthly;
    const tie = keepingOptions(sim, jet).find((o) => o.kind === 'tie_down')!;
    expect(tie.monthly).toBeLessThan(hangar);
    must(sim, 'stor.keep', { vehicleId: jet.id, kind: 'tie_down' });
    expect(sim.universe.vehicles[jet.id]!.keeping?.kind).toBe('tie_down');
    must(sim, 'stor.keep', { vehicleId: jet.id, kind: 'hangar' });

    const departAt = sim.now + 3 * MS_HOUR;
    const booked = must<{ bookingId: string }>(sim, 'travel.charter_private', { toCityId: 'us-ca-sanfrancisco', departAt, vehicleId: jet.id });
    sim.advanceTo(departAt - 20 * 60 * 1000);
    must(sim, 'travel.fly', { bookingId: booked.bookingId });
    const away = sim.universe.vehicles[jet.id]!;
    expect(away.keeping?.kind).toBe('transient');
    expect(away.keeping?.cityId).toBe('us-ca-sanfrancisco');
    expect(away.homeKeeping?.kind).toBe('hangar');
    expect(sim.universe.bills[away.homeKeeping!.billId!]!.active).toBe(true);
    expect(attempt(sim, 'stor.keep', { vehicleId: jet.id, kind: 'tie_down' }).error).toMatch(/Fly it back first/);

    // Three nights on the SFO ramp, charged on the way out.
    sim.advanceTo(sim.now + 3 * MS_DAY);
    const back = must<{ bookingId: string }>(sim, 'travel.charter_private', { toCityId: LA, departAt: sim.now + 3 * MS_HOUR, vehicleId: jet.id });
    sim.advanceTo(sim.now + 3 * MS_HOUR - 20 * 60 * 1000);
    must(sim, 'travel.fly', { bookingId: back.bookingId });
    const home = sim.universe.vehicles[jet.id]!;
    expect(home.keeping?.kind).toBe('hangar');
    const ramp = sim.ledger.history(sim.player.primaryAccountId!, 20).find((t) => t.memo.startsWith('Ramp fees — '));
    expect(ramp).toBeDefined();
    expect(ramp!.memo).toMatch(/San Francisco/);
    expect(ramp!.memo).toMatch(/[34] nights/);
  });

  it('can be named, like Air Drake, and fly under the name', () => {
    const sim = aLife('keeping-name', 150_000_000_00);
    const jet = buy(sim, 'jet', (l) => (VEHICLE_MODELS.get(l.catalogId.split(':')[0]!)?.trims[0]?.craft?.rangeKm ?? 0) >= 2_000);
    expect(attempt(sim, 'veh.name', { vehicleId: jet.id, name: 'x'.repeat(40) }).error).toMatch(/at most/);
    expect(attempt(sim, 'veh.name', { vehicleId: jet.id, name: '<script>' }).error).toMatch(/Letters, numbers/);
    must(sim, 'veh.name', { vehicleId: jet.id, name: '  Air   Slate ' });
    expect(sim.universe.vehicles[jet.id]!.nickname).toBe('Air Slate');
    const booked = must<{ bookingId: string }>(sim, 'travel.charter_private', { toCityId: 'us-ca-sanfrancisco', departAt: sim.now + 3 * MS_HOUR, vehicleId: jet.id });
    expect(sim.universe.flightBookings[booked.bookingId]!.airlineName).toBe('Air Slate');
    must(sim, 'veh.name', { vehicleId: jet.id, name: null });
    expect(sim.universe.vehicles[jet.id]!.nickname).toBeUndefined();
    const boat = aThing(sim, 'riva_aquarivasuper');
    must(sim, 'veh.name', { vehicleId: boat.id, name: "Ma'am" });
    expect(vehicleKind(boat)).toBe('boat');
    expect(boat.nickname).toBe("Ma'am");
  });
});

describe('saves from before', () => {
  it('places everything on load, and turns an old berth bill into the keeping bill rather than charging twice', () => {
    const sim = aLife();
    const boat = aThing(sim, 'mastercraft_xt23');
    // The old way: one bill for the berth and crew, and no keeping.
    const bill = { ...sim.universe.bills[Object.keys(sim.universe.bills)[0]!]! };
    bill.id = 'bill_old_berth';
    bill.name = `Berth — ${boat.make} ${boat.model}`;
    bill.amount = 700_00;
    bill.active = true;
    bill.refType = 'vehicle';
    bill.refId = boat.id;
    sim.universe.bills[bill.id] = bill;
    boat.upkeepBillId = bill.id;
    boat.keeping = undefined;
    const placed = ensureKeepings(sim);
    expect(placed).toBeGreaterThanOrEqual(1);
    const kept = sim.universe.vehicles[boat.id]!;
    expect(kept.keeping).toBeDefined();
    expect(kept.keeping!.billId).toBe(bill.id);
    expect(kept.keeping!.monthly).toBe(700_00);
    expect(kept.upkeepBillId).toBeUndefined();
    expect(billsOf(sim, boat.id).filter((b) => b.active)).toHaveLength(1);
    // Loading does it again, and does nothing the second time.
    const loaded = loadSave(sim.universe);
    expect(loaded.universe.vehicles[boat.id]!.keeping!.billId).toBe(bill.id);
    expect(billsOf(loaded, boat.id).filter((b) => b.active)).toHaveLength(1);
  });
});
