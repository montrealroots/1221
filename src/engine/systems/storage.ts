/**
 * SLATE — where things are kept.
 *
 * A car or a motorcycle lives in a home's garage while there is room, then
 * on the driveway, then on the street, or in a paid unit across town. A boat
 * takes a marina berth by the foot, a dry stack at the yard, a trailer at
 * home if it is small enough and there is space, or the private dock of a
 * waterfront home. An aircraft takes a private hangar, a shared one or a
 * tie-down at the home airport, and sits on the ramp of whatever airport it
 * was flown to until it is flown on. Every keeping has a monthly fee, an
 * exposure that wears the thing and moves its insurance, and rules about
 * what fits. Placement happens on purchase, on moving home and on landing;
 * `stor.keep` moves anything, for what the new place charges.
 *
 * Every rate and capacity is SLATE's own calibration, including at a real
 * marina or airport. Nothing here is a quote from anybody.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, KeepingKind, Property, Vehicle, VehicleKeeping } from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY, addDays, formatDate } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { AIRPORTS, CITIES, nearestAirport, type Airport } from '../content/geography';
import { isWaterfront, placesIn, type Place } from '../content/places';
import { costOfLiving } from '../content/tax';
import { VEHICLE_MODELS, trimOf, type VehicleKind } from '../content/vehicles';
import { createBill } from './finance';
import { RAMP_MINUTES, craftOf, ensureCrew, vehicleKind } from './vehicles';

// ---------------------------------------------------------------------------
// Constants. Cents before cost of living unless said otherwise.
// ---------------------------------------------------------------------------

/** A trailered boat can be no longer than this. */
export const TRAILER_MAX_FEET = 26;
/** A dry stack takes boats up to this. */
export const DRY_STACK_MAX_FEET = 40;
/** What a motorcycle takes of a garage space. */
export const MOTORCYCLE_SPACE = 0.5;
/** What a boat on a trailer takes of a garage or driveway. */
export const TRAILER_SPACES = 2;
/** A driveway, where a home has one. */
export const DRIVEWAY_SPACES = 2;

const STORAGE_UNIT: Readonly<Record<'car' | 'motorcycle', Money>> = { car: 260_00, motorcycle: 110_00 };
/** Per foot per month. */
const BERTH_PER_FOOT: Money = 24_00;
const DRY_STACK_PER_FOOT: Money = 14_00;

type AircraftBand = 'light' | 'mid' | 'large';
const HANGAR: Readonly<Record<AircraftBand, Money>> = { light: 3_500_00, mid: 7_500_00, large: 18_000_00 };
const SHARED_HANGAR: Readonly<Record<AircraftBand, Money>> = { light: 1_800_00, mid: 4_000_00, large: 9_500_00 };
const TIE_DOWN: Readonly<Record<AircraftBand, Money>> = { light: 450_00, mid: 900_00, large: 2_000_00 };
/** A night on somebody else's ramp. */
const TRANSIENT_NIGHT: Readonly<Record<AircraftBand, Money>> = { light: 180_00, mid: 450_00, large: 1_100_00 };

/** How much weather the thing sees where it is kept. */
export type Exposure = 'indoors' | 'covered' | 'outdoors';

export const EXPOSURE: Readonly<Record<KeepingKind, Exposure>> = {
  garage: 'indoors', driveway: 'outdoors', street: 'outdoors', storage_unit: 'indoors',
  berth: 'outdoors', dry_stack: 'covered', trailer: 'covered', private_dock: 'outdoors',
  hangar: 'indoors', shared_hangar: 'indoors', tie_down: 'outdoors', transient: 'outdoors',
};

/** Condition lost a month, standing, by exposure. */
const WEAR_PER_MONTH: Readonly<Record<Exposure, number>> = { indoors: 0, covered: 0.4, outdoors: 1.5 };

/** What a keeping does to a premium. */
export const INSURANCE_FACTOR: Readonly<Record<Exposure, number>> = { indoors: 0.95, covered: 1, outdoors: 1.15 };

export const KEEPING_LABEL: Readonly<Record<KeepingKind, string>> = {
  garage: 'Home Garage', driveway: 'The Driveway', street: 'On The Street', storage_unit: 'Storage Unit',
  berth: 'Marina Berth', dry_stack: 'Dry Stack', trailer: 'On A Trailer At Home', private_dock: 'Private Dock',
  hangar: 'Private Hangar', shared_hangar: 'Shared Hangar', tie_down: 'Tie Down', transient: 'Transient Ramp',
};

export const NO_ROOM = 'There is no room there.';
export const TOO_BIG = 'It does not fit there.';
export const NOT_HERE = 'That is not in the city the vehicle is in.';

// ---------------------------------------------------------------------------
// Homes: how many spaces, and whether there is water at the end of the garden
// ---------------------------------------------------------------------------

const SPACES_BY_KIND: Readonly<Record<string, number>> = {
  apartment: 0, condo: 0, townhouse: 1, house: 1, villa: 3, mansion: 6, estate: 10, penthouse: 2,
  ranch: 3, farm: 2, cabin: 1, land: 0, studio_lot: 20,
};

const DOCK_BY_KIND: Readonly<Record<string, number>> = { villa: 40, mansion: 80, estate: 120, cabin: 24, house: 30 };

/** Covered spaces at a home: its kind, its features, and any garage built on it. */
export function garageSpacesOf(sim: Simulation, property: Property): number {
  if (property.garageSpaces !== undefined) return property.garageSpaces;
  let spaces = SPACES_BY_KIND[property.kind] ?? 0;
  if (property.features.includes('Garage')) spaces += 1;
  if (property.features.includes('Parking Space')) spaces += 1;
  for (const id of property.structureIds) {
    const structure = sim.universe.structures[id];
    if (structure?.kind === 'garage') spaces += Math.max(1, Math.floor(structure.sqft / 250));
  }
  return spaces;
}

/** The longest boat a home's own dock takes, or nothing. */
export function dockFeetOf(property: Property): number {
  if (property.dockFeet !== undefined) return property.dockFeet;
  if (property.features.includes('Private Dock')) return DOCK_BY_KIND[property.kind] ?? 30;
  return 0;
}

/** A home with ground has a driveway. A flat does not. */
export function hasDriveway(property: Property): boolean {
  return property.lotSqft > 0 && !['apartment', 'condo', 'penthouse', 'land'].includes(property.kind);
}

/** What a vehicle takes of a garage or a driveway, in spaces. */
export function spacesTaken(vehicle: Vehicle): number {
  const kind = vehicleKind(vehicle);
  return kind === 'motorcycle' ? MOTORCYCLE_SPACE : kind === 'boat' ? TRAILER_SPACES : kind === 'car' ? 1 : 0;
}

export interface HomeSpaces {
  property: Property;
  garage: { spaces: number; used: number; vehicleIds: Id[] };
  driveway: { spaces: number; used: number; vehicleIds: Id[] };
  dockFeet: number;
  dockVehicleId?: Id;
}

/** What is in a home's garage and on its driveway, and what is at its dock. */
export function homeSpaces(sim: Simulation, propertyId: Id): HomeSpaces | undefined {
  const property = sim.universe.properties[propertyId];
  if (!property) return undefined;
  const kept = Object.values(sim.universe.vehicles).filter((v) => !v.soldAt && v.keeping?.propertyId === propertyId);
  const inGarage = kept.filter((v) => v.keeping?.kind === 'garage' || v.keeping?.kind === 'trailer' && v.keeping.placeId === 'garage');
  const onDrive = kept.filter((v) => v.keeping?.kind === 'driveway' || v.keeping?.kind === 'trailer' && v.keeping.placeId === 'driveway');
  return {
    property,
    garage: { spaces: garageSpacesOf(sim, property), used: inGarage.reduce((s, v) => s + spacesTaken(v), 0), vehicleIds: inGarage.map((v) => v.id) },
    driveway: { spaces: hasDriveway(property) ? DRIVEWAY_SPACES : 0, used: onDrive.reduce((s, v) => s + spacesTaken(v), 0), vehicleIds: onDrive.map((v) => v.id) },
    dockFeet: dockFeetOf(property),
    dockVehicleId: kept.find((v) => v.keeping?.kind === 'private_dock')?.id,
  };
}

// ---------------------------------------------------------------------------
// Marinas and yards
// ---------------------------------------------------------------------------

/** Slip bands by longest boat, and how many of each a marina of this size has before anyone else's boats. */
const SLIP_BANDS: readonly { upTo: number; base: number }[] = [
  { upTo: 30, base: 80 }, { upTo: 45, base: 40 }, { upTo: 65, base: 16 }, { upTo: 100, base: 6 }, { upTo: 150, base: 2 }, { upTo: 250, base: 1 },
];

export interface SlipBand { upTo: number; total: number; taken: number; mine: number; free: number; perFoot: Money }

export function marinasIn(cityId: string): Place[] {
  return placesIn(cityId).filter((p) => p.kind === 'marina');
}

export function storageYardsIn(cityId: string): Place[] {
  return placesIn(cityId).filter((p) => p.kind === 'storage');
}

/** The boat yards that dry stack: the lot that sells boats. */
export function dryStacksIn(cityId: string): Place[] {
  return placesIn(cityId).filter((p) => p.kind === 'dealership' && p.sells === 'boat');
}

/** What a marina has, band by band. Other people's boats are a seeded share that does not move. */
export function slipsAt(sim: Simulation, marina: Place): SlipBand[] {
  const rng = sim.rng('slips', marina.id);
  const max = marina.maxSlipFeet ?? 65;
  const scale = clamp(marina.quality / 80, 0.6, 1.4);
  const mine = Object.values(sim.universe.vehicles).filter((v) => !v.soldAt && v.keeping?.kind === 'berth' && v.keeping.placeId === marina.id);
  return SLIP_BANDS.filter((b) => b.upTo <= max || b === SLIP_BANDS.find((x) => x.upTo >= max)).map((band) => {
    const total = Math.max(1, Math.round(band.base * scale));
    const taken = Math.min(total, Math.round(total * rng.float(0.55, 0.95)));
    const mineHere = mine.filter((v) => bandFor(boatLength(sim, v)) === band.upTo).length;
    return { upTo: band.upTo, total, taken, mine: mineHere, free: Math.max(0, total - taken - mineHere), perFoot: Math.round(BERTH_PER_FOOT * clamp(marina.quality / 75, 0.7, 1.8)) };
  });
}

function bandFor(feet: number): number {
  return (SLIP_BANDS.find((b) => feet <= b.upTo) ?? SLIP_BANDS[SLIP_BANDS.length - 1]!).upTo;
}

export function boatLength(sim: Simulation, vehicle: Vehicle): number {
  return craftOf(sim, vehicle)?.lengthFeet ?? trimOf(vehicle.catalogId, vehicle.trim)?.craft?.lengthFeet ?? 20;
}

// ---------------------------------------------------------------------------
// Airports
// ---------------------------------------------------------------------------

export function aircraftBand(vehicle: Vehicle): AircraftBand {
  const style = VEHICLE_MODELS.get(vehicle.catalogId)?.bodyStyle ?? 'light_jet';
  return style === 'large_jet' || style === 'long_range_jet' ? 'large' : style === 'midsize_jet' || style === 'super_midsize_jet' ? 'mid' : 'light';
}

/** The airport a city keeps its aircraft at. */
export function homeAirportOf(cityId: string): Airport | undefined {
  const id = nearestAirport(cityId);
  return id ? AIRPORTS.get(id) : undefined;
}

/** Whether an airport has a private hangar with a door tall enough. */
function hangarFits(airport: Airport, band: AircraftBand): boolean {
  if (!airport.hasPrivateTerminal) return false;
  if (band === 'large') return airport.runwayFeet >= 8_000;
  return true;
}

/** A night on a ramp away from home, before cost of living. */
export function transientNight(vehicle: Vehicle): Money {
  return TRANSIENT_NIGHT[aircraftBand(vehicle)];
}

// ---------------------------------------------------------------------------
// Options: everywhere a thing could be kept, and why not
// ---------------------------------------------------------------------------

export interface KeepingOption {
  kind: KeepingKind;
  label: string;
  /** Where, by name. */
  where: string;
  detail: string;
  monthly: Money;
  exposure: Exposure;
  available: boolean;
  reason?: string;
  propertyId?: Id;
  placeId?: string;
  airportId?: string;
  /** For a trailer at home: which part of the home it stands on. */
  spot?: 'garage' | 'driveway';
}

function col(cityId: string): number {
  return costOfLiving(cityId);
}

/** The home that counts: where the player lives, if it is in this city. */
function residenceIn(sim: Simulation, cityId: string): Property | undefined {
  const home = sim.player.residenceId ? sim.universe.properties[sim.player.residenceId] : undefined;
  return home && home.locationId === cityId && !home.soldAt ? home : undefined;
}

/** Room at home for one more of this, in the garage or on the driveway, not counting where it already is. */
function roomAtHome(sim: Simulation, home: Property, vehicle: Vehicle): { garage: boolean; driveway: boolean } {
  const spaces = homeSpaces(sim, home.id)!;
  const need = spacesTaken(vehicle);
  const already = (spot: 'garage' | 'driveway') => spaces[spot].vehicleIds.includes(vehicle.id) ? need : 0;
  return {
    garage: spaces.garage.used - already('garage') + need <= spaces.garage.spaces,
    driveway: spaces.driveway.spaces > 0 && spaces.driveway.used - already('driveway') + need <= spaces.driveway.spaces,
  };
}

export function keepingOptions(sim: Simulation, vehicle: Vehicle): KeepingOption[] {
  const kind = vehicleKind(vehicle);
  const cityId = vehicle.locationId ?? sim.player.currentLocationId;
  const city = CITIES.get(cityId);
  const c = col(cityId);
  const home = residenceIn(sim, cityId);
  const out: KeepingOption[] = [];

  if (kind === 'car' || kind === 'motorcycle') {
    if (home) {
      const room = roomAtHome(sim, home, vehicle);
      const spaces = homeSpaces(sim, home.id)!;
      out.push({
        kind: 'garage', label: KEEPING_LABEL.garage, where: home.addressLine, detail: `${spaces.garage.spaces} space${spaces.garage.spaces === 1 ? '' : 's'}, ${spaces.garage.used} used.`,
        monthly: 0, exposure: 'indoors', available: spaces.garage.spaces > 0 && room.garage, reason: spaces.garage.spaces === 0 ? 'No garage at home.' : room.garage ? undefined : NO_ROOM, propertyId: home.id,
      });
      out.push({
        kind: 'driveway', label: KEEPING_LABEL.driveway, where: home.addressLine, detail: 'Outside, at home. Weather and the occasional scrape.',
        monthly: 0, exposure: 'outdoors', available: spaces.driveway.spaces > 0 && room.driveway, reason: spaces.driveway.spaces === 0 ? 'No driveway at home.' : room.driveway ? undefined : NO_ROOM, propertyId: home.id,
      });
    }
    out.push({ kind: 'street', label: KEEPING_LABEL.street, where: city?.name ?? cityId, detail: 'Free, and exposed to everything.', monthly: 0, exposure: 'outdoors', available: true });
    for (const yard of storageYardsIn(cityId)) {
      out.push({ kind: 'storage_unit', label: KEEPING_LABEL.storage_unit, where: yard.name, detail: 'Indoors, alarmed, dry. By the month.', monthly: Math.round(STORAGE_UNIT[kind] * c), exposure: 'indoors', available: true, placeId: yard.id });
    }
  }

  if (kind === 'boat') {
    const feet = boatLength(sim, vehicle);
    if (home) {
      const dock = dockFeetOf(home);
      const spaces = homeSpaces(sim, home.id)!;
      const dockFree = !spaces.dockVehicleId || spaces.dockVehicleId === vehicle.id;
      out.push({
        kind: 'private_dock', label: KEEPING_LABEL.private_dock, where: home.addressLine, detail: dock > 0 ? `Your own dock, up to ${dock} ft.` : 'No dock at home.',
        monthly: 0, exposure: 'outdoors', available: dock >= feet && dockFree, reason: dock === 0 ? 'No dock at home.' : dock < feet ? `The dock takes ${dock} ft; this is ${feet} ft.` : dockFree ? undefined : 'Something is already at the dock.', propertyId: home.id,
      });
      const room = roomAtHome(sim, home, vehicle);
      const spot: 'garage' | 'driveway' | undefined = room.garage ? 'garage' : room.driveway ? 'driveway' : undefined;
      out.push({
        kind: 'trailer', label: KEEPING_LABEL.trailer, where: home.addressLine, detail: `Up to ${TRAILER_MAX_FEET} ft, taking ${TRAILER_SPACES} spaces. A ramp fee and ${RAMP_MINUTES} minutes each time out.`,
        monthly: 0, exposure: spot === 'garage' ? 'indoors' : 'covered', available: feet <= TRAILER_MAX_FEET && Boolean(spot), reason: feet > TRAILER_MAX_FEET ? `${feet} ft is too long to trailer.` : spot ? undefined : NO_ROOM, propertyId: home.id, spot,
      });
    }
    for (const marina of marinasIn(cityId)) {
      const bands = slipsAt(sim, marina);
      const band = bands.find((b) => feet <= b.upTo);
      const fits = Boolean(band) && feet <= (marina.maxSlipFeet ?? 65);
      const free = band ? band.free > 0 || (vehicle.keeping?.kind === 'berth' && vehicle.keeping.placeId === marina.id) : false;
      out.push({
        kind: 'berth', label: KEEPING_LABEL.berth, where: marina.name, detail: band ? `A slip up to ${band.upTo} ft at ${formatMoney(band.perFoot)} a foot; ${band.free} free.` : 'Nothing that size.',
        monthly: band ? Math.round(band.perFoot * feet * c) : 0, exposure: 'outdoors', available: fits && free, reason: !fits ? `${marina.name} takes boats up to ${marina.maxSlipFeet ?? 65} ft.` : free ? undefined : 'No slip free at that length. Ask again next month.', placeId: marina.id,
      });
    }
    for (const yard of dryStacksIn(cityId)) {
      out.push({
        kind: 'dry_stack', label: KEEPING_LABEL.dry_stack, where: yard.name, detail: `Racked under cover, launched on request. Up to ${DRY_STACK_MAX_FEET} ft.`,
        monthly: Math.round(DRY_STACK_PER_FOOT * feet * c), exposure: 'covered', available: feet <= DRY_STACK_MAX_FEET, reason: feet > DRY_STACK_MAX_FEET ? `${feet} ft is too long for the rack.` : undefined, placeId: yard.id,
      });
    }
    if (out.length === 0 || !out.some((o) => o.available)) {
      const why = city && !isWaterfront(city) && marinasIn(cityId).length === 0 ? `${city.name} has no water a boat can be kept in.` : undefined;
      if (why) out.push({ kind: 'dry_stack', label: KEEPING_LABEL.dry_stack, where: city?.name ?? cityId, detail: why, monthly: 0, exposure: 'covered', available: false, reason: why });
    }
  }

  if (kind === 'jet') {
    const band = aircraftBand(vehicle);
    const airport = homeAirportOf(cityId);
    if (airport) {
      const large = band === 'large';
      out.push({ kind: 'hangar', label: KEEPING_LABEL.hangar, where: airport.name, detail: 'Your own hangar, your own door. The crew work out of it.', monthly: Math.round(HANGAR[band] * c), exposure: 'indoors', available: hangarFits(airport, band), reason: hangarFits(airport, band) ? undefined : airport.hasPrivateTerminal ? `${airport.name} has no hangar for an aircraft this size.` : `${airport.name} has no private terminal.`, airportId: airport.id });
      out.push({ kind: 'shared_hangar', label: KEEPING_LABEL.shared_hangar, where: airport.name, detail: 'A space in the FBO hangar, towed in and out.', monthly: Math.round(SHARED_HANGAR[band] * c), exposure: 'indoors', available: airport.hasPrivateTerminal && !large, reason: !airport.hasPrivateTerminal ? `${airport.name} has no private terminal.` : large ? 'The shared hangar does not take an aircraft this size.' : undefined, airportId: airport.id });
      out.push({ kind: 'tie_down', label: KEEPING_LABEL.tie_down, where: airport.name, detail: 'Outside on the ramp, chocked and tied. The cheapest way, and the weather gets at it.', monthly: Math.round(TIE_DOWN[band] * c), exposure: 'outdoors', available: true, airportId: airport.id });
    }
  }
  return out;
}

/** The option a thing goes to when nobody chooses: the first available in the order above, which is the sensible order. */
export function defaultKeeping(sim: Simulation, vehicle: Vehicle): KeepingOption | undefined {
  const options = keepingOptions(sim, vehicle);
  const order: KeepingKind[] = ['private_dock', 'garage', 'trailer', 'driveway', 'berth', 'dry_stack', 'hangar', 'shared_hangar', 'tie_down', 'street', 'storage_unit'];
  return order.map((k) => options.find((o) => o.kind === k && o.available)).find(Boolean);
}

/** One line on where a thing is. */
export function keepingLabel(sim: Simulation, vehicle: Vehicle): string {
  const k = vehicle.keeping;
  if (!k) return 'Nowhere in particular';
  const where = k.propertyId ? sim.universe.properties[k.propertyId]?.addressLine
    : k.placeId ? placesIn(k.cityId).find((p) => p.id === k.placeId)?.name
      : k.airportId ? AIRPORTS.get(k.airportId)?.name : CITIES.get(k.cityId)?.name;
  return `${KEEPING_LABEL[k.kind]}${where ? ` · ${where}` : ''}`;
}

/** What a thing's keeping does to a premium. */
export function keepingInsuranceFactor(vehicle: Vehicle): number {
  return vehicle.keeping ? INSURANCE_FACTOR[EXPOSURE[vehicle.keeping.kind]] : 1;
}

// ---------------------------------------------------------------------------
// Placing and moving
// ---------------------------------------------------------------------------

function endKeepingBill(sim: Simulation, vehicle: Vehicle): void {
  const id = vehicle.keeping?.billId;
  const bill = id ? sim.universe.bills[id] : undefined;
  if (bill) { bill.active = false; bill.endsAt = sim.now; }
}

function billName(vehicle: Vehicle, kind: KeepingKind): string {
  const name = `${vehicle.make} ${vehicle.model}`;
  return kind === 'berth' ? `Berth — ${name}` : kind === 'dry_stack' ? `Dry Stack — ${name}` : kind === 'storage_unit' ? `Storage — ${name}`
    : kind === 'hangar' ? `Hangar — ${name}` : kind === 'shared_hangar' ? `Hangar Space — ${name}` : kind === 'tie_down' ? `Tie Down — ${name}` : `Keeping — ${name}`;
}

/**
 * Puts a vehicle at an option: ends whatever it was paying, starts what this
 * costs, records the keeping. The first month is not charged today; the bill
 * falls due in thirty days like every other.
 */
export function applyKeeping(sim: Simulation, vehicle: Vehicle, option: KeepingOption, accountId: Id | undefined): VehicleKeeping {
  endKeepingBill(sim, vehicle);
  const cityId = vehicle.locationId ?? sim.player.currentLocationId;
  const keeping: VehicleKeeping = {
    kind: option.kind, cityId, propertyId: option.propertyId, placeId: option.kind === 'trailer' ? option.spot : option.placeId, airportId: option.airportId,
    since: sim.now, monthly: option.monthly,
  };
  if (option.monthly > 0) {
    const bill = createBill(sim, {
      payerId: vehicle.ownerId, name: billName(vehicle, option.kind), category: 'transport', amount: option.monthly, frequency: 'monthly',
      firstDueAt: addDays(sim.now, 30, sim.homeZone), autopayAccountId: accountId ?? sim.player.primaryAccountId, refType: 'vehicle', refId: vehicle.id,
    });
    keeping.billId = bill.id;
  }
  vehicle.keeping = keeping;
  if (vehicleKind(vehicle) === 'jet' && option.kind !== 'transient') vehicle.homeKeeping = keeping;
  vehicle.storedAtPropertyId = option.propertyId;
  sim.emit('vehicle.kept', { vehicleId: vehicle.id, kind: option.kind, monthly: option.monthly, where: option.where });
  return keeping;
}

/** Places a thing where it would go by default, and says so if that is the street or the ramp. */
export function placeVehicle(sim: Simulation, vehicle: Vehicle, accountId?: Id): KeepingOption | undefined {
  const option = defaultKeeping(sim, vehicle);
  if (!option) return undefined;
  applyKeeping(sim, vehicle, option, accountId);
  if (option.kind === 'street' || option.kind === 'driveway' || option.kind === 'tie_down') {
    sim.notify({
      category: 'vehicles', title: `The ${vehicle.make} ${vehicle.model} Is ${option.kind === 'tie_down' ? 'On The Ramp' : option.kind === 'street' ? 'On The Street' : 'On The Driveway'}`,
      body: option.kind === 'tie_down' ? `No hangar for it at ${option.where}, so it is tied down outside. The weather will get at it.` : `No room in the garage at ${option.where}. It is outside, and the weather and the neighbourhood will get at it.`,
      importance: 42, route: '/workspace/vehicles', refType: 'vehicle', refId: vehicle.id,
    });
  }
  return option;
}

/** A home has changed: whatever was in the old garage or drive goes where the new home has room. */
function rehomeRoadVehicles(sim: Simulation, newHomeId: Id): void {
  const home = sim.universe.properties[newHomeId];
  if (!home) return;
  for (const vehicle of Object.values(sim.universe.vehicles)) {
    if (vehicle.soldAt || vehicle.ownerId !== sim.player.id) continue;
    const k = vehicle.keeping;
    const atAHome = k && (k.kind === 'garage' || k.kind === 'driveway' || k.kind === 'trailer' || k.kind === 'private_dock');
    if (!atAHome || k.propertyId === home.id) continue;
    if ((vehicle.locationId ?? sim.player.currentLocationId) !== home.locationId) continue;
    const was = k.kind;
    const option = defaultKeeping(sim, vehicle);
    if (!option) continue;
    applyKeeping(sim, vehicle, option, undefined);
    if (EXPOSURE[option.kind] !== 'indoors' && EXPOSURE[was] === 'indoors') {
      sim.notify({
        category: 'vehicles', title: `No Room For The ${vehicle.make} ${vehicle.model}`,
        body: `${home.addressLine} has no covered space left for it. It is ${KEEPING_LABEL[option.kind].toLowerCase()} now.`,
        importance: 40, route: '/workspace/vehicles', refType: 'vehicle', refId: vehicle.id,
      });
    }
  }
}

/** Standing outside costs condition; a jet sitting on somebody else's ramp costs money. Monthly. */
function monthlyExposure(sim: Simulation): void {
  for (const vehicle of Object.values(sim.universe.vehicles)) {
    if (vehicle.soldAt || !vehicle.keeping) continue;
    const wear = WEAR_PER_MONTH[EXPOSURE[vehicle.keeping.kind]];
    if (wear > 0) vehicle.condition = clamp(vehicle.condition - wear, 0, 100);
    if (vehicle.keeping.kind === 'transient') settleTransient(sim, vehicle);
  }
}

/** What a jet owes the ramp it is on, charged, and the clock restarted. */
export function settleTransient(sim: Simulation, vehicle: Vehicle): Money {
  const k = vehicle.keeping;
  if (!k || k.kind !== 'transient') return 0;
  const nights = Math.max(1, Math.ceil((sim.now - k.since) / MS_DAY));
  const due = Math.round(transientNight(vehicle) * nights * col(k.cityId));
  const accountId = sim.player.primaryAccountId;
  if (due > 0 && accountId) {
    const airport = k.airportId ? AIRPORTS.get(k.airportId) : undefined;
    sim.expense(accountId, due, `Ramp fees — ${airport?.name ?? 'the airport'}, ${nights} night${nights === 1 ? '' : 's'}`, 'transport', { refType: 'vehicle', refId: vehicle.id });
  }
  k.since = sim.now;
  return due;
}

/** An aircraft has landed somewhere: on its home field it goes back in its hangar, anywhere else it sits on the ramp. */
function landed(sim: Simulation, vehicle: Vehicle, cityId: string): void {
  if (vehicleKind(vehicle) !== 'jet') return;
  const home = vehicle.homeKeeping;
  const airport = homeAirportOf(cityId);
  if (vehicle.keeping?.kind === 'transient') settleTransient(sim, vehicle);
  if (home && home.cityId === cityId) {
    vehicle.keeping = home;
    vehicle.storedAtPropertyId = undefined;
    return;
  }
  vehicle.keeping = { kind: 'transient', cityId, airportId: airport?.id, since: sim.now, monthly: 0 };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerStorage(sim: Simulation): void {
  // Bought: it goes where it goes. The purchase has already been paid for
  // and the keys handed over; this is the bill for where it sleeps.
  sim.onEvent('vehicle.purchased', 'storage.place', (event, { sim: s }) => {
    const { vehicleId } = event.payload as { vehicleId: Id };
    const vehicle = s.universe.vehicles[vehicleId];
    if (!vehicle || vehicle.soldAt || vehicle.keeping) return;
    placeVehicle(s, vehicle);
  }, 40);

  sim.onEvent('vehicle.sold', 'storage.release', (event, { sim: s }) => {
    const { vehicleId } = event.payload as { vehicleId: Id };
    const vehicle = s.universe.vehicles[vehicleId];
    if (!vehicle) return;
    endKeepingBill(s, vehicle);
    vehicle.keeping = undefined;
    vehicle.homeKeeping = undefined;
    vehicle.storedAtPropertyId = undefined;
  });

  sim.onEvent('prop.moved_in', 'storage.rehome', (event, { sim: s }) => {
    const { propertyId } = event.payload as { propertyId: Id };
    rehomeRoadVehicles(s, propertyId);
  });

  sim.onEvent('vehicle.relocated', 'storage.landed', (event, { sim: s }) => {
    const { vehicleId, cityId } = event.payload as { vehicleId: Id; cityId: string };
    const vehicle = s.universe.vehicles[vehicleId];
    if (vehicle && !vehicle.soldAt) landed(s, vehicle, cityId);
  });

  sim.onEvent('vehicle.revalued', 'storage.exposure', (_event, { sim: s }) => monthlyExposure(s));

  sim.onCommand<{ vehicleId: Id; kind: KeepingKind; propertyId?: Id; placeId?: string; airportId?: string; accountId?: Id }, { kind: KeepingKind; monthly: Money; where: string }>(
    'stor.keep',
    (p, { sim: s }) => {
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!vehicle || vehicle.soldAt || vehicle.ownerId !== s.player.id) throw new CommandError('You do not own that vehicle.');
      if (vehicle.deliveryDueAt) throw new CommandError('It has not been delivered yet.');
      if (vehicle.keeping?.kind === 'transient') throw new CommandError('It is on a ramp away from home. Fly it back first.');
      const cityId = vehicle.locationId ?? s.player.currentLocationId;
      if (s.player.currentLocationId !== cityId) throw new CommandError(NOT_HERE);
      const option = keepingOptions(s, vehicle).find((o) => o.kind === p.kind
        && (p.propertyId === undefined || o.propertyId === p.propertyId)
        && (p.placeId === undefined || o.placeId === p.placeId)
        && (p.airportId === undefined || o.airportId === p.airportId));
      if (!option) throw new CommandError('That is not somewhere this can be kept.');
      if (!option.available) throw new CommandError(option.reason ?? NO_ROOM);
      const current = vehicle.keeping;
      if (current && current.kind === option.kind && current.propertyId === option.propertyId && (current.placeId === (option.kind === 'trailer' ? option.spot : option.placeId)) && current.airportId === option.airportId) {
        throw new CommandError('It is already kept there.');
      }
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (option.monthly > 0 && (!accountId || s.ledger.availableFunds(accountId) < option.monthly)) {
        throw new CommandError(`${option.where} wants ${formatMoney(option.monthly)} a month and you cannot show the first month.`);
      }
      applyKeeping(s, vehicle, option, accountId);
      s.remember({
        category: 'vehicle', title: `Moved The ${vehicle.make} ${vehicle.model} To ${option.where}`,
        detail: `${KEEPING_LABEL[option.kind]}${option.monthly > 0 ? `, ${formatMoney(option.monthly)} a month from ${formatDate(addDays(s.now, 30, s.homeZone), s.homeZone)}` : ', nothing a month'}.`,
        refs: [{ type: 'vehicle', id: vehicle.id }], significance: 12, public: false,
      });
      return { kind: option.kind, monthly: option.monthly, where: option.where };
    },
  );
}

/**
 * A save from before keeping existed: every vehicle in hand is placed, and a
 * boat's or a jet's old berth-and-crew bill becomes its keeping bill rather
 * than a second charge. Idempotent; a placed vehicle is left alone.
 */
export function ensureKeepings(sim: Simulation): number {
  let placed = 0;
  for (const vehicle of Object.values(sim.universe.vehicles)) {
    if (vehicle.soldAt || vehicle.ownerId !== sim.player.id) continue;
    // A crewed yacht or an aircraft pays its people whether or not it was
    // bought across a table. Idempotent, so a save that has one keeps it.
    if (sim.player.primaryAccountId) ensureCrew(sim, vehicle, sim.player.primaryAccountId);
    if (vehicle.keeping) continue;
    const option = defaultKeeping(sim, vehicle);
    if (!option) continue;
    if (vehicle.upkeepBillId && sim.universe.bills[vehicle.upkeepBillId]?.active) {
      // The old bill stands in for the new one at the old price; nothing is charged twice.
      const bill = sim.universe.bills[vehicle.upkeepBillId]!;
      vehicle.keeping = { kind: option.kind, cityId: vehicle.locationId ?? sim.player.currentLocationId, propertyId: option.propertyId, placeId: option.placeId, airportId: option.airportId, since: sim.now, monthly: bill.amount, billId: bill.id };
      if (vehicleKind(vehicle) === 'jet') vehicle.homeKeeping = vehicle.keeping;
      vehicle.upkeepBillId = undefined;
    } else {
      applyKeeping(sim, vehicle, option, undefined);
    }
    placed += 1;
  }
  return placed;
}

export type { VehicleKind };
