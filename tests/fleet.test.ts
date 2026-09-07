/**
 * The fleet: motorcycles, boats and private aircraft beside the cars.
 *
 * Every make and model is real; every figure is SLATE's own. Each kind has
 * its own lot, its own findings when you look one over, its own way of being
 * taken out, its own insurance line and its own parts, and none of a car's
 * parts fit any of them. A boat and a jet cost money standing still, count
 * hours rather than miles, and a jet you own flies at what it costs to run
 * and lands where you do.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { loadSave, migrate, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { VehicleListing } from '@/engine/domain/model';
import {
  FACTORY_OPTIONS, KIND_PROFILE, MANUFACTURERS, PARTS, VEHICLE_MODELS, checkFitment, kindOf, partsFor, type VehicleKind,
} from '@/engine/content/vehicles';
import {
  MAX_CRUISE_HOURS, NOT_A_BOAT, NOT_FOR_THE_ROAD, craftOf, dealerPlaceFor, fitmentSubject, hourlyCostOf, refreshInventory, vehicleKind,
} from '@/engine/systems/vehicles';
import { dealershipsIn, findingByText, fullName, listingKind, listingsAt, lotOf, lotSells, tradeInCandidates } from '@/engine/systems/dealership';
import { driveableVehicle } from '@/engine/systems/places';
import { ownedAircraftOptions } from '@/engine/systems/travel';
import { CREW_HOLD_HOURS } from '@/engine/systems/journey';
import { activeScene, sceneView } from '@/engine/systems/scenes';
import { preview } from '@/engine/dialogue/library';
import { localHour } from '@/engine/systems/fitness';

function aLife(seed = 'fleet', funding = 5_000_000_00): Simulation {
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

function lotFor(sim: Simulation, kind: VehicleKind) {
  const lot = dealershipsIn(sim).find((l) => lotSells(l) === kind);
  if (!lot) throw new Error(`No ${kind} lot`);
  return lot;
}

/** The cheapest thing of a kind on its lot, or the one a predicate picks. */
function aListing(sim: Simulation, kind: VehicleKind, pick?: (l: VehicleListing) => boolean): { listing: VehicleListing; placeId: string } {
  const lot = lotFor(sim, kind);
  const stock = listingsAt(sim, lot.id).filter((l) => !pick || pick(l));
  if (!stock[0]) throw new Error(`Nothing on the ${kind} lot`);
  return { listing: stock[0], placeId: lot.id };
}

/** Across the table and out the door with the keys, for cash. */
function buy(sim: Simulation, kind: VehicleKind, pick?: (l: VehicleListing) => boolean) {
  const { listing, placeId } = aListing(sim, kind, pick);
  must(sim, 'go.to', { placeId, mode: 'taxi' });
  const { dealId } = must<{ dealId: string }>(sim, 'deal.open', { placeId, listingId: listing.id });
  const deal = sim.universe.vehicleDeals[dealId]!;
  must(sim, 'deal.offer', { dealId, price: deal.currentAsk });
  const { vehicleId } = must<{ vehicleId: string }>(sim, 'deal.sign', { dealId, acquisition: 'cash' });
  return { vehicle: sim.universe.vehicles[vehicleId]!, listing, placeId, dealId };
}

function start(sim: Simulation, input: Record<string, unknown>) {
  must(sim, 'scene.start', { definitionId: 'vehicles.dealer', input });
  return activeScene(sim)!;
}

function pick(sim: Simulation, label: RegExp) {
  const scene = activeScene(sim)!;
  const view = sceneView(sim, scene);
  const choice = view.choices.find((c) => label.test(c.label) && !c.disabled);
  if (!choice) throw new Error(`No choice ${label} at "${view.title}": ${view.choices.map((c) => c.label).join(' | ')}`);
  must(sim, 'scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId: choice.id });
  return sceneView(sim, activeScene(sim) ?? scene);
}

beforeAll(async () => { await loadAllSections(); });

describe('the catalog', () => {
  it('carries real makes for every kind, with every figure marked as a calibration', () => {
    const byKind = (kind: VehicleKind) => VEHICLE_MODELS.all().filter((m) => m.kind === kind);
    expect(byKind('motorcycle').length).toBeGreaterThanOrEqual(20);
    expect(byKind('boat').length).toBeGreaterThanOrEqual(16);
    expect(byKind('jet').length).toBeGreaterThanOrEqual(12);
    for (const model of VEHICLE_MODELS.all()) {
      expect(MANUFACTURERS.get(model.parentId), model.id).toBeDefined();
      expect(model.source, model.id).toBe('calibrated_estimate');
      expect(MANUFACTURERS.require(model.parentId).source).toBe('public_reference');
      for (const trim of model.trims) {
        for (const option of trim.availableOptions) expect(FACTORY_OPTIONS.get(option), `${model.id} ${option}`).toBeDefined();
        if (model.kind === 'boat' || model.kind === 'jet') {
          expect(trim.craft?.hourlyOperating, `${model.id} ${trim.id}`).toBeGreaterThan(0);
        }
        if (model.kind === 'jet') {
          expect(trim.craft?.rangeKm).toBeGreaterThan(1_000);
          expect(trim.craft?.runwayFeet).toBeGreaterThan(2_000);
          expect(trim.craft?.seats).toBeGreaterThan(3);
        }
        if (model.kind === 'boat') expect(trim.craft?.lengthFeet).toBeGreaterThan(15);
        if (model.kind === 'motorcycle') expect(trim.craft?.topSpeed).toBeGreaterThan(60);
      }
    }
    expect(kindOf('ducati_panigalev4')).toBe('motorcycle');
    expect(kindOf('gulfstream_g650er')).toBe('jet');
    expect(kindOf('toyota_corolla')).toBe('car');
    expect(kindOf('nothing_like_this')).toBe('car');
  });

  it('keeps every kind\'s parts to that kind: nothing from a car goes on a boat, nothing from a boat goes on a bike', () => {
    const subject = (kind: VehicleKind, modelId: string, trimId: string) => {
      const model = VEHICLE_MODELS.require(modelId);
      const trim = model.trims.find((t) => t.id === trimId)!;
      return { kind, modelId, make: model.parentId, year: 2024, trimId, powertrain: trim.powertrain, bodyStyle: model.bodyStyle, installedCategories: [] };
    };
    const car = subject('car', 'bmw_3series', 'm340i');
    const bike = subject('motorcycle', 'ducati_panigalev4', 'v4s');
    const boat = subject('boat', 'azimut_55', 'base');
    const jet = subject('jet', 'embraer_phenom300e', 'base');

    const bigBrakes = PARTS.require('brakes_bigbrake');
    expect(checkFitment(bigBrakes, boat).fits).toBe(false);
    expect(checkFitment(bigBrakes, boat).reasons[0]).toMatch(/made for cars, not a boat/);
    expect(checkFitment(PARTS.require('boat_gyro'), bike).fits).toBe(false);
    expect(checkFitment(PARTS.require('boat_gyro'), boat).fits).toBe(true);
    expect(checkFitment(PARTS.require('jet_winglets'), car).fits).toBe(false);
    expect(checkFitment(PARTS.require('jet_winglets'), jet).fits).toBe(true);
    expect(checkFitment(PARTS.require('moto_panniers'), bike).fits).toBe(false); // a superbike has nowhere to hang them
    expect(checkFitment(PARTS.require('moto_exhaust_slipon'), bike).fits).toBe(true);

    // The parts on offer for each are only its own.
    for (const part of partsFor(car)) expect(part.fitment.kinds ?? ['car'], part.id).toContain('car');
    for (const part of partsFor(bike)) expect(part.fitment.kinds, part.id).toContain('motorcycle');
    for (const part of partsFor(boat)) expect(part.fitment.kinds, part.id).toContain('boat');
    for (const part of partsFor(jet)) expect(part.fitment.kinds, part.id).toContain('jet');
    expect(partsFor(bike).length).toBeGreaterThanOrEqual(12);
    expect(partsFor(boat).length).toBeGreaterThanOrEqual(10);
    expect(partsFor(jet).length).toBeGreaterThanOrEqual(10);

    // Prerequisites hold on the water and in the air as they do on the road.
    expect(checkFitment(PARTS.require('boat_watermaker'), boat).reasons[0]).toMatch(/requires power/);
    expect(checkFitment(PARTS.require('boat_watermaker'), { ...boat, installedCategories: ['power'] }).fits).toBe(true);
    expect(checkFitment(PARTS.require('boat_radar'), subject('boat', 'bostonwhaler_outrage280', 'twin300')).reasons[0]).toMatch(/requires navigation/);
  });
});

describe('names', () => {
  it('says a make, a model and a trim once each', () => {
    expect(fullName(2018, 'Cirrus Aircraft', 'Vision SF50', 'Vision SF50 G2+')).toBe('2018 Cirrus Aircraft Vision SF50 G2+');
    expect(fullName(2026, 'Range Rover', 'Range Rover Sport')).toBe('2026 Range Rover Sport');
    expect(fullName(2018, 'Porsche', 'Cayenne', 'Cayenne GTS')).toBe('2018 Porsche Cayenne GTS');
    expect(fullName(2026, 'Honda', 'Gold Wing', 'Gold Wing Tour')).toBe('2026 Honda Gold Wing Tour');
    expect(fullName(2024, 'BMW', '3 Series', 'M340i')).toBe('2024 BMW 3 Series M340i');
    expect(fullName(2024, 'Gulfstream', 'G650ER', 'G650ER')).toBe('2024 Gulfstream G650ER');
    expect(fullName(undefined, 'Ducati', 'Monster')).toBe('Ducati Monster');
  });
});

describe('the lots', () => {
  it('gives every city a motorcycle dealer, a boat yard and an aircraft broker after the three car lots, and stocks each with its own kind', () => {
    const sim = aLife();
    const lots = dealershipsIn(sim);
    expect(lots.map((l) => lotSells(l))).toEqual(['car', 'car', 'car', 'motorcycle', 'boat', 'jet']);
    expect(lots[3]!.name).toBe('Northline Motorcycles');
    expect(lots[4]!.name).toMatch(/Yacht And Boat Sales$/);
    expect(lots[5]!.name).toMatch(/Jet Center$/);
    expect(dealerPlaceFor(sim.player.currentLocationId, 'used', 'boat')?.id).toBe(lots[4]!.id);
    expect(dealerPlaceFor(sim.player.currentLocationId, 'new', 'car')?.id).toBe(lots[0]!.id);

    for (const kind of ['motorcycle', 'boat', 'jet'] as const) {
      const stock = listingsAt(sim, lotFor(sim, kind).id);
      expect(stock.length, kind).toBeGreaterThan(0);
      for (const listing of stock) {
        expect(listing.kind).toBe(kind);
        expect(listingKind(listing)).toBe(kind);
        expect(lotOf(listing)).toBe(lotFor(sim, kind).id);
        expect(kindOf(listing.catalogId.split(':')[0]!)).toBe(kind);
      }
    }
    // The car lots carry only cars, as they did.
    for (const lot of lots.slice(0, 3)) for (const listing of listingsAt(sim, lot.id)) expect(listingKind(listing)).toBe('car');
  });

  it('replaces a fortnight\'s stock when restocked in the same fortnight, rather than listing every car twice', () => {
    const sim = aLife();
    const active = () => Object.values(sim.universe.vehicleListings).filter((l) => l.status === 'active' && l.locationId === sim.player.currentLocationId);
    const before = active().length;
    const { listing, placeId } = aListing(sim, 'car');
    must(sim, 'go.to', { placeId, mode: 'taxi' });
    const { dealId } = must<{ dealId: string }>(sim, 'deal.open', { placeId, listingId: listing.id });
    refreshInventory(sim);
    expect(active().length).toBe(before);
    const seen = new Set<string>();
    for (const l of active()) {
      const key = `${l.catalogId}|${l.year}|${l.mileage}|${l.price}|${l.configuration.paint}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
    // The car on the table is still the car on the table.
    expect(sim.universe.vehicleListings[listing.id]?.status).toBe('active');
    expect(sim.universe.vehicleDeals[dealId]?.listingId).toBe(listing.id);
  });

  it('starts a new life with a car, never the cheapest thing on the bike lot', () => {
    for (const wealth of ['comfortable', 'wealthy'] as const) {
      const sim = quickSave({ wealth, startWithVehicle: true }, `fleet-start-${wealth}`);
      const owned = Object.values(sim.universe.vehicles).filter((v) => v.ownerId === sim.player.id && !v.soldAt);
      expect(owned.length).toBe(1);
      expect(vehicleKind(owned[0]!)).toBe('car');
    }
  });

  it('only trades in the kind the lot sells', () => {
    const sim = aLife();
    buy(sim, 'motorcycle');
    const boatLot = lotFor(sim, 'boat');
    expect(tradeInCandidates(sim, lotSells(boatLot))).toHaveLength(0);
    expect(tradeInCandidates(sim, 'motorcycle')).toHaveLength(1);
  });
});

describe('a motorcycle', () => {
  it('is looked over as a motorcycle, ridden, insured on the motor line and serviced every four thousand miles', () => {
    const sim = aLife();
    const { listing, placeId } = aListing(sim, 'motorcycle', (l) => l.condition !== 'new');
    must(sim, 'go.to', { placeId, mode: 'taxi' });
    const { dealId } = must<{ dealId: string }>(sim, 'deal.open', { placeId, listingId: listing.id });
    const { findings } = must<{ findings: string[] }>(sim, 'deal.inspect', { dealId });
    for (const text of findings) {
      const finding = findingByText(text)!;
      expect(finding, text).toBeDefined();
      expect(text).not.toMatch(/service history|warning light|One key/);
    }
    const deal = sim.universe.vehicleDeals[dealId]!;
    must(sim, 'deal.offer', { dealId, price: deal.currentAsk });
    const { vehicleId } = must<{ vehicleId: string }>(sim, 'deal.sign', { dealId, acquisition: 'cash' });
    const bike = sim.universe.vehicles[vehicleId]!;
    expect(vehicleKind(bike)).toBe('motorcycle');
    expect(bike.nextServiceDueMileage - bike.mileage).toBe(KIND_PROFILE.motorcycle.serviceInterval);
    expect(bike.upkeepBillId).toBeUndefined();
    expect(driveableVehicle(sim)?.id).toBe(bike.id);

    const before = bike.mileage;
    must(sim, 'veh.drive', { vehicleId, miles: 150 });
    expect(sim.universe.vehicles[vehicleId]!.mileage).toBe(before + 150);
    expect(attempt(sim, 'veh.cruise', { vehicleId, hours: 2 }).error).toBe(NOT_A_BOAT);

    expect(attempt(sim, 'ins.quote', { line: 'marine', coveredRefs: [{ type: 'vehicle', id: vehicleId }] }).error).toMatch(/covered by auto insurance, not marine/);
    const quote = must<{ premium: number; quoteId: string }>(sim, 'ins.quote', { line: 'auto', coveredRefs: [{ type: 'vehicle', id: vehicleId }] });
    expect(quote.premium).toBeGreaterThan(0);
  });

  it('is talked about as a bike across the table: a ride, not a drive', () => {
    const sim = aLife();
    const { listing, placeId } = aListing(sim, 'motorcycle');
    start(sim, { placeId, listingId: listing.id });
    pick(sim, /^(Taxi|Walk|Transit|Drive)$/);
    const lot = sceneView(sim, activeScene(sim)!);
    expect(lot.text).toMatch(/bikes? in the showroom|empty today/);
    pick(sim, /You Came For/);
    const car = sceneView(sim, activeScene(sim)!);
    expect(car.choices.map((c) => c.label)).toContain('Take It For A Ride');
    expect(car.choices.map((c) => c.label)).toContain('Look At Another Bike');
    expect(car.choices.map((c) => c.label)).not.toContain('Take It For A Drive');
    const { impression } = must<{ impression: string }>(sim, 'deal.test_drive', { dealId: activeScene(sim)!.refId });
    expect(impression).not.toMatch(/seats are the best part/);
  });
});

describe('a boat', () => {
  it('is kept somewhere from the day it is bought, paying for it monthly, until the day it is sold', () => {
    const sim = aLife();
    const { vehicle } = buy(sim, 'boat');
    expect(vehicleKind(vehicle)).toBe('boat');
    expect(vehicle.upkeepBillId).toBeUndefined();
    expect(vehicle.keeping).toBeDefined();
    expect(['berth', 'dry_stack', 'trailer', 'private_dock']).toContain(vehicle.keeping!.kind);
    const bills = () => Object.values(sim.universe.bills).filter((b) => b.refType === 'vehicle' && b.refId === vehicle.id);
    if (vehicle.keeping!.monthly > 0) {
      const bill = sim.universe.bills[vehicle.keeping!.billId!]!;
      expect(bill.name).toMatch(/^(Berth|Dry Stack) — /);
      expect(bill.amount).toBe(vehicle.keeping!.monthly);
      expect(bill.active).toBe(true);
      expect(bill.refId).toBe(vehicle.id);
      expect(bills()).toHaveLength(1);
    }
    must(sim, 'veh.sell', { vehicleId: vehicle.id });
    expect(bills().every((b) => !b.active)).toBe(true);
    expect(sim.universe.vehicles[vehicle.id]!.keeping).toBeUndefined();
  });

  it('counts hours, burns fuel by the hour, will not go on the road, and is serviced every hundred hours', () => {
    const sim = aLife();
    const { vehicle } = buy(sim, 'boat');
    expect(attempt(sim, 'veh.drive', { vehicleId: vehicle.id, miles: 50 }).error).toBe(NOT_FOR_THE_ROAD);
    expect(driveableVehicle(sim)).toBeUndefined();
    expect(vehicle.nextServiceDueMileage - vehicle.mileage).toBe(KIND_PROFILE.boat.serviceInterval);

    const hourly = hourlyCostOf(sim, vehicle);
    expect(hourly).toBeGreaterThan(0);
    const hoursBefore = vehicle.mileage;
    const stressBefore = sim.player.wellbeing.stress;
    const at = sim.now;
    const out = attempt<{ hours: number; cost: number }>(sim, 'veh.cruise', { vehicleId: vehicle.id, hours: 4 });
    if (!out.ok) {
      // A storm on the water is the one honest refusal; anything else is a bug.
      expect(out.error).toMatch(/storm/);
      return;
    }
    expect(out.value!.cost).toBe(hourly * 4);
    expect(sim.universe.vehicles[vehicle.id]!.mileage).toBe(hoursBefore + 4);
    expect(sim.now - at).toBe(4 * MS_HOUR);
    expect(sim.player.wellbeing.stress).toBeLessThanOrEqual(stressBefore);
    const fuel = sim.ledger.history(sim.player.primaryAccountId!, 5).find((t) => t.memo.startsWith('Fuel — '));
    expect(fuel).toBeDefined();
    expect(attempt(sim, 'veh.cruise', { vehicleId: vehicle.id, hours: MAX_CRUISE_HOURS + 5 }).ok).toBe(true);
    expect(sim.universe.vehicles[vehicle.id]!.mileage).toBe(hoursBefore + 4 + MAX_CRUISE_HOURS);
  });

  it('is insured on the marine line, and a claim with undisclosed work aboard is denied', () => {
    const sim = aLife();
    const { vehicle } = buy(sim, 'boat');
    expect(attempt(sim, 'ins.quote', { line: 'auto', coveredRefs: [{ type: 'vehicle', id: vehicle.id }] }).error).toMatch(/marine insurance, not auto/);
    const quote = must<{ quoteId: string; premium: number }>(sim, 'ins.quote', { line: 'marine', coveredRefs: [{ type: 'vehicle', id: vehicle.id }] });
    const { policyId } = must<{ policyId: string }>(sim, 'ins.purchase', { quoteId: quote.quoteId });
    expect(sim.universe.insurancePolicies[policyId]!.carrier).toBe('Northbank Marine');

    // A tracker the insurer was never told about.
    must(sim, 'veh.book_modification', { vehicleId: vehicle.id, partIds: ['boat_tracker'] });
    sim.advanceTo(sim.now + 5 * MS_DAY);
    expect(sim.universe.vehicles[vehicle.id]!.currentConfiguration.modificationIds).toHaveLength(1);
    const claim = must<{ status: string }>(sim, 'ins.file_claim', { policyId, description: 'Hit the dock', claimedAmount: 8_000_00, refType: 'vehicle', refId: vehicle.id });
    expect(claim.status).toBe('denied');
  });

  it('is sold across the table as a boat: a sea trial, no lease, a berth on the way out', () => {
    const sim = aLife();
    const { listing, placeId } = aListing(sim, 'boat');
    start(sim, { placeId, listingId: listing.id });
    pick(sim, /^(Taxi|Walk|Transit|Drive)$/);
    pick(sim, /You Came For/);
    const car = sceneView(sim, activeScene(sim)!);
    expect(car.choices.map((c) => c.label)).toContain('Take It Out On The Water');
    expect(car.facts!.find((f) => f.label === 'Condition')!.value).toMatch(/hrs$/);
    pick(sim, /^Take It Out On The Water$/);
    pick(sim, /^Talk Numbers$/);
    const numbers = sceneView(sim, activeScene(sim)!);
    expect(numbers.choices.map((c) => c.label)).toContain('Ask For Delivery To A Berth');
    pick(sim, /^Accept /);
    const agreed = sceneView(sim, activeScene(sim)!);
    const lease = agreed.choices.find((c) => c.label.startsWith('Lease'))!;
    expect(lease.disabled).toMatch(/not leased/);
    pick(sim, /^Pay Cash$/);
    pick(sim, /^Not Now$/);
    const keys = sceneView(sim, activeScene(sim)!);
    expect(keys.text).toMatch(/It goes to (marina berth|dry stack|on a trailer at home|private dock)/);
  });
});

describe('a private jet', () => {
  it('costs a hangar and crew monthly, is insured on the aviation line, and flies at what it costs to run', () => {
    const sim = aLife('fleet-jet', 150_000_000_00);
    const { vehicle: jet } = buy(sim, 'jet', (l) => (VEHICLE_MODELS.get(l.catalogId.split(':')[0]!)?.trims[0]?.craft?.rangeKm ?? 0) >= 2_000);
    expect(vehicleKind(jet)).toBe('jet');
    expect(jet.keeping?.kind).toBe('hangar');
    expect(sim.universe.bills[jet.keeping!.billId!]!.name).toMatch(/^Hangar — /);
    expect(sim.universe.bills[jet.crewBillId!]!.name).toMatch(/^Crew — /);
    expect(attempt(sim, 'ins.quote', { line: 'auto', coveredRefs: [{ type: 'vehicle', id: jet.id }] }).error).toMatch(/aviation insurance, not auto/);
    const quote = must<{ quoteId: string }>(sim, 'ins.quote', { line: 'aviation', coveredRefs: [{ type: 'vehicle', id: jet.id }] });
    must(sim, 'ins.purchase', { quoteId: quote.quoteId });
    expect(attempt(sim, 'veh.drive', { vehicleId: jet.id, miles: 10 }).error).toBe(NOT_FOR_THE_ROAD);

    // Los Angeles to San Francisco is inside any jet's range.
    const options = ownedAircraftOptions(sim, 'us-ca-sanfrancisco');
    expect(options).toHaveLength(1);
    const mine = options[0]!;
    expect(mine.available).toBe(true);
    expect(mine.hourlyRate).toBe(hourlyCostOf(sim, jet));
    expect(mine.estimatedCost).toBeLessThan(mine.hourlyRate * mine.estimatedHours * 1.18 + 5_000_00);

    const departAt = sim.now + 3 * MS_HOUR;
    const booked = must<{ bookingId: string; cost: number; arriveAt: number }>(sim, 'travel.charter_private', { toCityId: 'us-ca-sanfrancisco', departAt, vehicleId: jet.id });
    expect(booked.cost).toBe(mine.estimatedCost);
    const booking = sim.universe.flightBookings[booked.bookingId]!;
    expect(booking.vehicleId).toBe(jet.id);
    expect(booking.airlineName).toMatch(/^Your /);
    expect(booking.cabin).toBe('private');
    const flight = sim.ledger.history(sim.player.primaryAccountId!, 3).find((t) => t.memo.startsWith('Flight — '));
    expect(flight).toBeDefined();

    // The aircraft is asked about, goes when you get there, and lands where you do.
    sim.advanceTo(departAt - 20 * 60 * 1000);
    const ask = Object.values(sim.universe.decisions).find((d) => d.refId === booking.id && !d.resolvedAt && !d.dismissedAt);
    expect(ask).toBeDefined();
    expect(ask!.actions!.map((a) => a.label)).toEqual(['Go To The Aircraft', 'Stay Home']);
    expect(ask!.dueAt).toBe(booking.departAt + CREW_HOLD_HOURS * MS_HOUR);
    const hoursBefore = sim.universe.vehicles[jet.id]!.mileage;
    const flown = must<{ landedIn?: string; missed: boolean }>(sim, 'travel.fly', { bookingId: booking.id });
    expect(flown.missed).toBe(false);
    expect(flown.landedIn).toBe('us-ca-sanfrancisco');
    expect(sim.player.currentLocationId).toBe('us-ca-sanfrancisco');
    expect(sim.universe.flightBookings[booking.id]!.status).toBe('flown');
    const landed = sim.universe.vehicles[jet.id]!;
    expect(landed.locationId).toBe('us-ca-sanfrancisco');
    expect(landed.mileage).toBeGreaterThan(hoursBefore);

    // Back in Los Angeles without it, it is somewhere else and says so.
    sim.player.currentLocationId = 'us-ca-losangeles';
    const away = ownedAircraftOptions(sim, 'us-ca-sanfrancisco')[0]!;
    expect(away.available).toBe(false);
    expect(away.reason).toMatch(/San Francisco/);
  });

  it('waits for a passenger who is late, and goes home without one who never comes', () => {
    const sim = aLife('fleet-jet-late', 150_000_000_00);
    const { vehicle: jet } = buy(sim, 'jet', (l) => (VEHICLE_MODELS.get(l.catalogId.split(':')[0]!)?.trims[0]?.craft?.rangeKm ?? 0) >= 2_000);
    const departAt = sim.now + 3 * MS_HOUR;
    const booked = must<{ bookingId: string; arriveAt: number }>(sim, 'travel.charter_private', { toCityId: 'us-ca-sanfrancisco', departAt, vehicleId: jet.id });
    // An hour late: the crew are still there, and the arrival moves with you.
    sim.advanceTo(departAt + MS_HOUR);
    expect(sim.universe.flightBookings[booked.bookingId]!.status).toBe('booked');
    const flown = must<{ missed: boolean }>(sim, 'travel.fly', { bookingId: booked.bookingId });
    expect(flown.missed).toBe(false);
    expect(sim.universe.flightBookings[booked.bookingId]!.arriveAt).toBeGreaterThan(booked.arriveAt);

    const again = must<{ bookingId: string }>(sim, 'travel.charter_private', { toCityId: 'us-ca-losangeles', departAt: sim.now + 3 * MS_HOUR, vehicleId: jet.id });
    sim.advanceTo(sim.now + 3 * MS_HOUR + (CREW_HOLD_HOURS + 1) * MS_HOUR);
    expect(sim.universe.flightBookings[again.bookingId]!.status).toBe('missed');
    expect(sim.universe.vehicles[jet.id]!.locationId).toBe('us-ca-sanfrancisco');
  });

  it('gains range from the tanks or winglets that fit it, and is worked on in an aircraft shop', () => {
    const sim = aLife('fleet-jet-parts', 150_000_000_00);
    // Anything but the smallest personal jet takes one of the two range parts.
    const { vehicle: jet } = buy(sim, 'jet', (l) => VEHICLE_MODELS.get(l.catalogId.split(':')[0]!)?.bodyStyle !== 'very_light_jet');
    const before = craftOf(sim, jet)!.rangeKm!;
    const partId = ['jet_winglets', 'jet_aux_tank'].find((id) => checkFitment(PARTS.require(id), fitmentSubject(sim, jet)).fits)!;
    expect(partId).toBeDefined();
    must(sim, 'veh.book_modification', { vehicleId: jet.id, partIds: [partId] });
    sim.advanceTo(sim.now + 5 * MS_DAY);
    expect(craftOf(sim, sim.universe.vehicles[jet.id]!)!.rangeKm).toBe(before + PARTS.require(partId).effects.rangeKm!);
    expect(attempt(sim, 'veh.book_modification', { vehicleId: jet.id, partIds: ['tune_stage1'] }).error).toMatch(/made for cars, not a jet/);
    must(sim, 'veh.book_service', { vehicleId: jet.id, kind: 'scheduled' });
    sim.advanceTo(sim.now + 4 * MS_DAY);
    const record = Object.values(sim.universe.serviceRecords).find((r) => r.vehicleId === jet.id && r.kind === 'scheduled');
    expect(record?.shopName).toBe('Meridian Aero Services');
    expect(record!.cost).toBeGreaterThan(5_000_00);
  });
});

describe('what is said', () => {
  it('never says a car line about a boat, and has something of its own to say about each kind', () => {
    const sim = aLife();
    for (const kind of ['bike', 'boat', 'jet'] as const) {
      const back = preview(sim, { section: 'vehicles', purpose: 'drive', beat: 'back' }, { facts: [kind], tone: 'firm' }, `back-${kind}`);
      expect(back.fallback, kind).toBe(false);
      // A bike has keys to hand back; a boat and a jet do not get the car's lines at all.
      if (kind === 'bike') expect(back.id).toMatch(/so\.(1|2|bike)$/);
      else expect(back.id, kind).toContain(`so.${kind}`);
      const greet = preview(sim, { section: 'vehicles', purpose: 'greet', beat: 'lot' }, { facts: [kind], flags: ['first_visit'], vars: { first: 'Sam', car: 'the thing' } }, `greet-${kind}`);
      expect(greet.text).not.toMatch(/between two cars/);
    }
    const car = preview(sim, { section: 'vehicles', purpose: 'drive', beat: 'back' }, { facts: ['car'] }, 'back-car');
    expect(car.id).not.toMatch(/so\.(bike|boat|jet)/);
  });
});

describe('saves from before', () => {
  it('stamps every vehicle and listing from before as the car it was, and loads', () => {
    const sim = quickSave({ startWithVehicle: true, wealth: 'wealthy' }, 'fleet-migrate');
    for (const v of Object.values(sim.universe.vehicles)) delete v.kind;
    for (const l of Object.values(sim.universe.vehicleListings)) delete l.kind;
    sim.universe.meta.schemaVersion = 37;
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(true);
    expect(result.steps.some((s) => s.includes('stamped with their kind'))).toBe(true);
    for (const v of Object.values(sim.universe.vehicles)) expect(v.kind).toBe('car');
    // Stamped from the catalog, never guessed: the car lots' stock is cars,
    // and anything the new lots carried is what it is.
    for (const l of Object.values(sim.universe.vehicleListings)) expect(l.kind).toBe(kindOf(l.catalogId.split(':')[0]!));
    expect(Object.values(sim.universe.vehicleListings).filter((l) => l.kind === 'car').length).toBeGreaterThan(5);
    const loaded = loadSave(sim.universe);
    expect(Object.values(loaded.universe.vehicles).filter((v) => !v.soldAt).length).toBeGreaterThan(0);
  });
});
