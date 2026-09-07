/**
 * SLATE — the dealership: a car bought across a table.
 *
 * A deal is the conversation about one car at one lot, from the first look
 * to the signature or the walk to the door. The dealer has a floor and it is
 * theirs: it is never on the record and never on screen. What they have
 * said is. Looking the car over gives you levers; driving it tells you what
 * it is; every offer is a round, and there are only so many rounds before
 * the number stops moving. Walk away close enough and they may call.
 *
 * `veh.purchase` still does the buying. A deal fixes the price it uses and
 * carries the terms — the trade-in, the delivery, the work they agreed to
 * do — and the salesperson remembers what happened, so the next visit is a
 * second visit.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_DAY, MS_MINUTE, addDays, formatDate } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type { Id, Person, Vehicle, VehicleDeal, VehicleDealTerms, VehicleListing } from '../domain/model';
import { placesIn, type Place } from '../content/places';
import { KIND_PROFILE, VEHICLE_MODELS, kindOf, trimOf, type VehicleKind } from '../content/vehicles';
import { makeBackgroundPerson, peopleOf } from './people';
import { factsOf, rememberFact } from './memory';
import { createRelationship, findRelationship } from './relationships';
import { applyDealerRepairs, dealerPlaceFor, vehicleKind } from './vehicles';
import { speak } from '../dialogue/library';
import type { DialogueTone } from '../dialogue/schema';

export const DEAL_DAYS = 7;
export const CALLBACK_HOLD_DAYS = 3;
export const MAX_ROUNDS = 5;
export const CALLBACK_DAYS = 2;
export const DEALER_OPEN = 9;
export const DEALER_CLOSE = 19;
export const DEALS_KEPT = 40;
export const COOLING_OFF_HOURS = 20;

export const NOT_HERE = 'That dealership is not in the city you are in.';
export const FINAL_PRICE = 'They have given you their final price. Take it or leave it.';
export const NO_SUCH_DEAL = 'There is no deal like that on the table.';

// ---------------------------------------------------------------------------
// What you find when you look
// ---------------------------------------------------------------------------

export interface Finding {
  text: string;
  /** How far, as a fraction of the asking price, it lets the dealer's floor drop. */
  leverage: number;
  /** What the dealer can be asked to put right, if it is that kind of thing. */
  repair?: string;
}

const USED_FINDINGS: readonly Finding[] = [
  { text: 'The tires are down to the wear bars.', leverage: 0.02, repair: 'Fit New Tires' },
  { text: 'A scrape along the rear bumper.', leverage: 0.015, repair: 'Repair The Rear Bumper' },
  { text: 'There are gaps in the service history.', leverage: 0.02 },
  { text: 'The brake pads are near the end.', leverage: 0.015, repair: 'Fit New Brake Pads' },
  { text: 'A warning light comes on at idle.', leverage: 0.03, repair: 'Sort The Warning Light' },
  { text: 'One key, and it is the spare.', leverage: 0.01, repair: 'Cut A Second Key' },
  { text: 'The interior has been well looked after.', leverage: 0 },
  { text: 'The paint is original and straight.', leverage: 0 },
];

const NEW_FINDINGS: readonly Finding[] = [
  { text: 'Delivery mileage only.', leverage: 0 },
  { text: 'A factory blemish on the driver’s door.', leverage: 0.01, repair: 'Fix The Door Blemish' },
  { text: 'The wheels have been kerbed on the lot.', leverage: 0.01, repair: 'Refinish The Wheels' },
  { text: 'Every option on the sheet is on the car.', leverage: 0 },
];

const MOTO_USED_FINDINGS: readonly Finding[] = [
  { text: 'The chain and sprockets are hooked and due.', leverage: 0.02, repair: 'Fit A New Chain And Sprockets' },
  { text: 'The rear tire is squared off from motorway miles.', leverage: 0.015, repair: 'Fit A New Rear Tire' },
  { text: 'A fork seal is weeping.', leverage: 0.02, repair: 'Replace The Fork Seals' },
  { text: 'Scuffed bar ends and a scraped peg. It has been down, gently.', leverage: 0.03 },
  { text: 'The brake pads are thin.', leverage: 0.01, repair: 'Fit New Brake Pads' },
  { text: 'The service book is stamped every time.', leverage: 0 },
  { text: 'Original exhaust, original paint.', leverage: 0 },
];

const MOTO_NEW_FINDINGS: readonly Finding[] = [
  { text: 'Delivery miles only.', leverage: 0 },
  { text: 'A scratch on the tank from the showroom.', leverage: 0.01, repair: 'Touch In The Tank' },
  { text: 'Every accessory on the sheet is fitted.', leverage: 0 },
];

const BOAT_USED_FINDINGS: readonly Finding[] = [
  { text: 'The antifoul is due; there is growth at the waterline.', leverage: 0.015, repair: 'Antifoul The Hull' },
  { text: 'Gelcoat crazing on the transom.', leverage: 0.02, repair: 'Repair The Transom Gelcoat' },
  { text: 'The bilge pump cycles more than it should.', leverage: 0.025, repair: 'Find The Leak' },
  { text: 'High engine hours for the year.', leverage: 0.02 },
  { text: 'The canvas is sun-rotted at the seams.', leverage: 0.01, repair: 'Replace The Canvas' },
  { text: 'A recent survey, and it reads clean.', leverage: 0 },
  { text: 'The engines start first time and idle even.', leverage: 0 },
];

const BOAT_NEW_FINDINGS: readonly Finding[] = [
  { text: 'Commissioning hours only.', leverage: 0 },
  { text: 'A scuff on the rub rail from the travel lift.', leverage: 0.01, repair: 'Replace The Rub Rail Section' },
  { text: 'Every option on the sheet is aboard.', leverage: 0 },
];

const JET_USED_FINDINGS: readonly Finding[] = [
  { text: 'The engines are not on a maintenance program.', leverage: 0.03 },
  { text: 'A major inspection is due within the year.', leverage: 0.025 },
  { text: 'The paint is chipped along the leading edges.', leverage: 0.01, repair: 'Touch Up The Leading Edges' },
  { text: 'The avionics database is out of date.', leverage: 0.005, repair: 'Update The Databases' },
  { text: 'Cabin wear on the divan and the carpet.', leverage: 0.01, repair: 'Clean And Repair The Cabin' },
  { text: 'The logbooks are complete back to delivery.', leverage: 0 },
  { text: 'Hangared its whole life.', leverage: 0 },
];

const JET_NEW_FINDINGS: readonly Finding[] = [
  { text: 'Ferry hours only.', leverage: 0 },
  { text: 'A mark on the cabin veneer from the completion center.', leverage: 0.005, repair: 'Refinish The Veneer' },
  { text: 'Every option on the specification is installed.', leverage: 0 },
];

const FINDINGS_BY_KIND: Readonly<Record<VehicleKind, { used: readonly Finding[]; fresh: readonly Finding[] }>> = {
  car: { used: USED_FINDINGS, fresh: NEW_FINDINGS },
  motorcycle: { used: MOTO_USED_FINDINGS, fresh: MOTO_NEW_FINDINGS },
  boat: { used: BOAT_USED_FINDINGS, fresh: BOAT_NEW_FINDINGS },
  jet: { used: JET_USED_FINDINGS, fresh: JET_NEW_FINDINGS },
};

const ALL_FINDINGS: readonly Finding[] = Object.values(FINDINGS_BY_KIND).flatMap((f) => [...f.used, ...f.fresh]);

/** What kind of thing a listing is. One from before there was anything but cars is a car. */
export function listingKind(listing: VehicleListing): VehicleKind {
  return listing.kind ?? kindOf(listing.catalogId.split(':')[0] ?? '');
}

/** What looking it over turns up. Fixed for the listing, so a second look agrees with the first. */
export function findingsFor(sim: Simulation, listing: VehicleListing): Finding[] {
  const rng = sim.rng('findings', listing.id);
  const pools = FINDINGS_BY_KIND[listingKind(listing)];
  const pool = listing.condition === 'new' ? pools.fresh : pools.used;
  const count = rng.int(1, 3);
  return rng.shuffle([...pool]).slice(0, count);
}

export function findingByText(text: string): Finding | undefined {
  return ALL_FINDINGS.find((f) => f.text === text);
}

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

export function dealershipsIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((p) => p.kind === 'dealership');
}

/** The lot, which must be in the city you are in. */
export function dealershipAt(sim: Simulation, placeId: string): Place {
  const place = dealershipsIn(sim).find((p) => p.id === placeId);
  if (!place) throw new CommandError(NOT_HERE);
  return place;
}

/** The cars on one lot right now. */
export function listingsAt(sim: Simulation, placeId: string): VehicleListing[] {
  return Object.values(sim.universe.vehicleListings)
    .filter((l) => l.status === 'active' && lotOf(l) === placeId)
    .sort((a, b) => a.price - b.price);
}

/** The lot a listing sits on — recorded on it, or worked out for one from before lots existed. */
export function lotOf(listing: VehicleListing): string | undefined {
  return listing.dealerPlaceId ?? dealerPlaceFor(listing.locationId, listing.condition, listingKind(listing))?.id;
}

/** What a lot sells. A lot from before there was anything but cars sells cars. */
export function lotSells(place: Place): VehicleKind {
  return (place.sells as VehicleKind | undefined) ?? 'car';
}

/**
 * "2018 Porsche Cayenne GTS", not "2018 Porsche Cayenne Cayenne GTS", and
 * "2026 Range Rover Sport", not "2026 Range Rover Range Rover Sport": a
 * model that carries its make's name, or a trim that carries the model's,
 * is said once.
 */
export function fullName(year: number | undefined, make: string, model: string, trim?: string): string {
  const named = trim && trim.startsWith(model) ? trim : model;
  const body = named.startsWith(make) ? named : `${make} ${named}`;
  const tail = trim && named === model && trim !== model && !body.endsWith(trim) ? ` ${trim}` : '';
  return `${year === undefined ? '' : `${year} `}${body}${tail}`.replace(/\s+/g, ' ').trim();
}

function joinName(year: number, make: string, model: string, trim?: string): string {
  return fullName(year, make, model, trim);
}

export function carName(listing: VehicleListing): string {
  const model = VEHICLE_MODELS.get(listing.catalogId.split(':')[0] ?? '');
  const trim = trimOf(model?.id ?? '', listing.catalogId.split(':')[1] ?? '');
  return joinName(listing.year, model?.make ?? '', model?.name ?? '', trim?.name);
}

export function vehicleName(vehicle: Vehicle): string {
  return joinName(vehicle.year, vehicle.make, vehicle.model);
}

export function listingOf(sim: Simulation, deal: VehicleDeal): VehicleListing {
  const listing = sim.universe.vehicleListings[deal.listingId];
  if (!listing) throw new CommandError('That car is no longer on the lot.');
  return listing;
}

/** Whoever works the floor at a lot, if they have been met. Reads only. */
export function salespersonAt(sim: Simulation, placeId: string): Person | undefined {
  return peopleOf(sim, `sales:${placeId}`)[0];
}

function ensureSalesperson(sim: Simulation, place: Place): Person {
  const existing = salespersonAt(sim, place.id);
  if (existing) return existing;
  const rng = sim.rng('sales', place.id);
  const sells = lotSells(place);
  return makeBackgroundPerson(sim, {
    rng, archetype: `sales:${place.id}`, industryRole: 'car_salesperson', cityId: place.cityId,
    background: `Sells ${KIND_PROFILE[sells].plural.toLowerCase()} at ${place.name}.`,
    interests: [sells === 'car' ? 'cars' : sells === 'motorcycle' ? 'motorcycles' : sells === 'boat' ? 'sailing' : 'flying', rng.pick(['golf', 'football', 'cooking', 'fishing', 'music'])],
    skills: { negotiation: rng.int(55, 90) },
    age: [28, 58],
    personality: { extraversion: rng.int(60, 95), agreeableness: rng.int(35, 80) },
    lifestyle: 'comfortable',
  });
}

export function dealsOf(sim: Simulation): VehicleDeal[] {
  return Object.values(sim.universe.vehicleDeals).sort((a, b) => b.openedAt - a.openedAt);
}

export function openDeals(sim: Simulation): VehicleDeal[] {
  return dealsOf(sim).filter((d) => d.status === 'open' || d.status === 'agreed');
}

/** The deal on the table for a car, if there is one. */
export function dealFor(sim: Simulation, listingId: Id): VehicleDeal | undefined {
  return openDeals(sim).find((d) => d.listingId === listingId);
}

export function dealOf(sim: Simulation, dealId: Id): VehicleDeal {
  const deal = sim.universe.vehicleDeals[dealId];
  if (!deal) throw new CommandError(NO_SUCH_DEAL);
  return deal;
}

export function roundsLeft(deal: VehicleDeal): number {
  return Math.max(0, MAX_ROUNDS - deal.rounds);
}

/** How many times you have been on this lot before today, as the salesperson counts it. */
export function visitsBefore(sim: Simulation, salespersonId: Id): number {
  return factsOf(sim, salespersonId, { aboutId: sim.player.id }).filter((f) => f.kind === 'meeting' || f.kind === 'event').length;
}

/**
 * The dealer's floor. Never shown. Room is the listing's; each finding you
 * have not asked them to fix lowers it a little; a customer who has bought
 * here before gets a little more.
 */
export function floorOf(sim: Simulation, deal: VehicleDeal): Money {
  const listing = listingOf(sim, deal);
  let room = listing.negotiationRoom;
  if (deal.inspected) {
    const leverage = deal.findings
      .map((text) => findingByText(text))
      .filter((f): f is Finding => Boolean(f) && !deal.terms.repairs.includes(f!.repair ?? ''))
      .reduce((sum, f) => sum + f.leverage, 0);
    room += Math.min(0.05, leverage);
  }
  if (factsOf(sim, deal.salespersonId, { kind: 'event', aboutId: sim.player.id }).some((f) => f.text.startsWith('Bought'))) room += 0.01;
  return Math.round(listing.price * (1 - clamp(room, 0, 0.3)));
}

/** What the dealer will allow against a car you bring. Their number, not the market's. */
export function tradeInAllowance(sim: Simulation, deal: VehicleDeal, vehicle: Vehicle): Money {
  const rng = sim.rng('trade-in', deal.id, vehicle.id);
  return Math.round(vehicle.currentValue * rng.float(0.8, 0.9));
}

/**
 * What you could put in part exchange: yours, here, paid for or on finance,
 * not leased, not still waiting on delivery, and the same kind of thing the
 * lot sells. A boat yard does not want your car.
 */
export function tradeInCandidates(sim: Simulation, kind: VehicleKind = 'car'): Vehicle[] {
  const player = sim.player;
  return Object.values(sim.universe.vehicles).filter((v) =>
    !v.soldAt && !v.deliveryDueAt && v.ownerId === player.id && v.acquisition !== 'leased' && vehicleKind(v) === kind
    && (v.locationId ?? player.currentLocationId) === player.currentLocationId);
}

/** What the dealer said last. */
export function lastSaid(deal: VehicleDeal): string {
  return deal.said[deal.said.length - 1] ?? '';
}

// ---------------------------------------------------------------------------
// What they say
// ---------------------------------------------------------------------------

function say(deal: VehicleDeal, line: string): void {
  deal.said.push(line);
  if (deal.said.length > 12) deal.said.splice(0, deal.said.length - 12);
}

/** The voice a salesperson answers in. Read from who they are, never rolled. */
export function sellerTone(person: Person): DialogueTone {
  return person.personality.agreeableness >= 60 ? 'warm' : 'firm';
}

/** What a salesperson knows about the player, as the library's conditions name it. */
export function sellerKnows(sim: Simulation, sellerId: Id): string[] {
  const facts = factsOf(sim, sellerId, { aboutId: sim.player.id });
  const known: string[] = [];
  if (facts.some((f) => f.kind === 'event' && f.text.startsWith('Bought'))) known.push('bought');
  if (facts.some((f) => f.kind === 'event' && f.text.startsWith('Walked away'))) known.push('walked');
  if (facts.some((f) => f.kind === 'topic' && f.text.startsWith('Drove'))) known.push('drove');
  return known;
}

/** The library's name for what is being sold, so a line about a car is never said about a boat. */
export function kindFact(kind: VehicleKind): string {
  return kind === 'motorcycle' ? 'bike' : kind === 'boat' ? 'boat' : kind === 'jet' ? 'jet' : 'car';
}

function sellerSays(sim: Simulation, deal: VehicleDeal, purpose: string, beat: string, extra: { result?: string; move?: string; flags?: string[]; vars?: Record<string, string> } = {}): string {
  const seller = sim.universe.people[deal.salespersonId];
  const listing = sim.universe.vehicleListings[deal.listingId];
  const vars = {
    first: seller?.firstName ?? 'They',
    car: listing ? carName(listing) : 'the car',
    ask: formatMoney(deal.currentAsk),
    price: formatMoney(deal.agreedPrice ?? deal.currentAsk),
    ...extra.vars,
  };
  const spoken = speak(sim, { section: 'vehicles', purpose, beat }, {
    tone: seller ? sellerTone(seller) : undefined,
    facts: [...(seller ? sellerKnows(sim, seller.id) : []), kindFact(listing ? listingKind(listing) : 'car')],
    result: extra.result, move: extra.move, flags: extra.flags, vars,
  }, `${deal.id}:${deal.rounds}:${deal.said.length}`);
  return spoken.text;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerDealership(sim: Simulation): void {
  sim.onSchedule('deal.expire', (item) => {
    const deal = sim.universe.vehicleDeals[item.payload['dealId'] as Id];
    if (!deal || (deal.status !== 'open' && deal.status !== 'agreed')) return;
    deal.status = 'expired';
    deal.closedAt = sim.now;
    const listing = sim.universe.vehicleListings[deal.listingId];
    if (listing) {
      sim.notify({
        category: 'vehicles', title: 'The Deal Has Lapsed',
        body: `The ${carName(listing)} is no longer being held for you.`,
        importance: 25, route: '/workspace/vehicles', refType: 'deal', refId: deal.id,
      });
    }
  });

  sim.onSchedule('deal.callback', (item) => {
    const deal = sim.universe.vehicleDeals[item.payload['dealId'] as Id];
    const price = Number(item.payload['price'] ?? 0);
    if (!deal || deal.status !== 'walked' || price <= 0) return;
    const listing = sim.universe.vehicleListings[deal.listingId];
    const seller = sim.universe.people[deal.salespersonId];
    if (!listing || listing.status !== 'active' || !seller) return;
    deal.status = 'agreed';
    deal.agreedPrice = price;
    deal.currentAsk = price;
    deal.closedAt = undefined;
    deal.expiresAt = addDays(sim.now, CALLBACK_HOLD_DAYS, sim.homeZone);
    say(deal, sellerSays(sim, deal, 'callback', 'phone'));
    sim.schedule({
      at: deal.expiresAt, kind: 'deal.expire', label: `Deal On The ${carName(listing)}`, category: 'vehicles',
      payload: { dealId: deal.id }, priority: 70, refType: 'deal', refId: deal.id,
    });
    sim.requireDecision({
      urgency: 45, category: 'vehicles',
      title: `${seller.firstName} Called About The ${carName(listing)}`,
      detail: `They will do ${formatMoney(price)}. The offer holds for ${CALLBACK_HOLD_DAYS} days.`,
      route: '/workspace/vehicles',
      actions: [
        { label: 'Go And Sign', commandKind: 'scene.start', payload: { definitionId: 'vehicles.dealer', input: { placeId: deal.dealerPlaceId, dealId: deal.id } } },
        { label: 'Let It Go', commandKind: 'deal.walk_away', payload: { dealId: deal.id } },
      ],
      dueAt: deal.expiresAt,
      refType: 'deal', refId: deal.id,
    });
    sim.notify({
      category: 'vehicles', title: `${seller.firstName} Called`,
      body: `${formatMoney(price)} for the ${carName(listing)}, if you come in by ${formatDate(deal.expiresAt, sim.zone)}.`,
      importance: 50, route: '/workspace/vehicles', refType: 'deal', refId: deal.id,
    });
  });

  sim.onSchedule('deal.delivery', (item) => {
    const vehicle = sim.universe.vehicles[item.payload['vehicleId'] as Id];
    const deal = sim.universe.vehicleDeals[item.payload['dealId'] as Id];
    if (!vehicle || vehicle.soldAt) return;
    vehicle.deliveryDueAt = undefined;
    const lot = placesIn(vehicle.locationId ?? sim.player.currentLocationId).find((p) => p.id === deal?.dealerPlaceId);
    if (deal && deal.terms.repairs.length > 0) applyDealerRepairs(sim, vehicle, deal.terms.repairs, lot?.name ?? 'The dealer');
    sim.emit('vehicle.delivered', { vehicleId: vehicle.id, dealId: deal?.id });
    sim.notify({
      category: 'vehicles', title: 'Your Car Has Arrived',
      body: `The ${vehicleName(vehicle)} is outside${deal && deal.terms.repairs.length > 0 ? `, with the agreed work done: ${deal.terms.repairs.map((r) => r.toLowerCase()).join(', ')}` : ''}.`,
      importance: 55, route: '/workspace/vehicles', refType: 'vehicle', refId: vehicle.id,
    });
    sim.remember({
      category: 'vehicle', title: `The ${vehicleName(vehicle)} Was Delivered`,
      detail: lot ? `Brought round by ${lot.name}.` : 'Brought round by the dealer.',
      refs: [{ type: 'vehicle', id: vehicle.id }], significance: 30, public: false,
    });
  });

  // --- Opening a conversation about one car ---------------------------------

  sim.onCommand<{ placeId: string; listingId: Id }, { dealId: Id; salespersonId: Id; resumed: boolean }>(
    'deal.open',
    (p, { sim: s }) => {
      const place = dealershipAt(s, p.placeId);
      const listing = s.universe.vehicleListings[p.listingId];
      if (!listing || listing.status !== 'active') throw new CommandError('That car is no longer for sale.');
      if (lotOf(listing) !== place.id) throw new CommandError(`That car is not on the lot at ${place.name}.`);

      const existing = dealFor(s, listing.id);
      if (existing) return { dealId: existing.id, salespersonId: existing.salespersonId, resumed: true };

      const walked = dealsOf(s).find((d) => d.listingId === listing.id && d.status === 'walked' && (d.closedAt ?? 0) > s.now - COOLING_OFF_HOURS * 60 * MS_MINUTE);
      if (walked) throw new CommandError('You walked away from that one today. Come back tomorrow if you still want it.');

      const seller = ensureSalesperson(s, place);
      const player = s.player;
      if (!findRelationship(s, player.id, seller.id)) {
        createRelationship(s, player.id, seller.id, 'acquaintance', { context: `sells cars at ${place.name}` });
        rememberFact(s, seller.id, { kind: 'meeting', aboutId: player.id, text: `Met on the lot at ${place.name}.`, weight: 30, sourceKind: 'deal' });
      }

      const deal: VehicleDeal = {
        id: s.nextId('deal'),
        saveId: s.universe.meta.id,
        listingId: listing.id,
        dealerPlaceId: place.id,
        salespersonId: seller.id,
        status: 'open',
        askingPrice: listing.price,
        currentAsk: listing.price,
        rounds: 0,
        said: [],
        inspected: false,
        findings: [],
        testDriven: false,
        terms: { delivery: 'collect', repairs: [] },
        openedAt: s.now,
        expiresAt: addDays(s.now, DEAL_DAYS, s.homeZone),
      };
      const before = visitsBefore(s, seller.id);
      s.universe.vehicleDeals[deal.id] = deal;
      say(deal, sellerSays(s, deal, 'open', 'car', { flags: [before > 1 ? 'returning' : 'first_visit'] }));
      pruneDeals(s);
      s.schedule({
        at: deal.expiresAt, kind: 'deal.expire', label: `Deal On The ${carName(listing)}`, category: 'vehicles',
        payload: { dealId: deal.id }, priority: 70, refType: 'deal', refId: deal.id,
      });
      s.emit('deal.opened', { dealId: deal.id, listingId: listing.id, salespersonId: seller.id });
      return { dealId: deal.id, salespersonId: seller.id, resumed: false };
    },
  );

  // --- Looking, and driving ---------------------------------------------------

  sim.onCommand<{ dealId: Id }, { findings: string[] }>(
    'deal.inspect',
    (p, { sim: s }) => {
      const deal = requireOpen(s, p.dealId, ['open']);
      if (deal.inspected) return { findings: deal.findings };
      const listing = listingOf(s, deal);
      s.advanceTo(s.now + 20 * MS_MINUTE);
      deal.inspected = true;
      deal.findings = findingsFor(s, listing).map((f) => f.text);
      const levers = deal.findings.filter((t) => (findingByText(t)?.leverage ?? 0) > 0);
      say(deal, sellerSays(s, deal, 'inspect', 'car', { flags: [levers.length > 0 ? 'levers' : 'clean'] }));
      return { findings: deal.findings };
    },
  );

  sim.onCommand<{ dealId: Id }, { impression: string }>(
    'deal.test_drive',
    (p, { sim: s }) => {
      const deal = requireOpen(s, p.dealId, ['open', 'agreed']);
      const listing = listingOf(s, deal);
      if (deal.testDriven) return { impression: impressionOf(s, listing) };
      if (s.player.wellbeing.energy < 10) throw new CommandError('You are too tired to take anything out today.');
      const kind = listingKind(listing);
      s.advanceTo(s.now + (kind === 'boat' || kind === 'jet' ? 60 : 30) * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - 3, 0, 100);
      deal.testDriven = true;
      const impression = impressionOf(s, listing);
      rememberFact(s, deal.salespersonId, { kind: 'topic', aboutId: s.player.id, text: `Drove the ${carName(listing)}.`, weight: 25, sourceKind: 'deal', expiresAt: s.now + 120 * MS_DAY });
      say(deal, sellerSays(s, deal, 'drive', 'back'));
      return { impression };
    },
  );

  // --- Terms: what else is on the table ---------------------------------------

  sim.onCommand<{ dealId: Id; delivery?: VehicleDealTerms['delivery']; tradeInVehicleId?: Id | null; repairs?: string[] }, { terms: VehicleDealTerms; tradeInValue?: Money }>(
    'deal.set_terms',
    (p, { sim: s }) => {
      const deal = requireOpen(s, p.dealId, ['open', 'agreed']);
      if (p.delivery) {
        deal.terms.delivery = p.delivery;
        say(deal, `"${sellerSays(s, deal, 'terms', 'numbers', { move: p.delivery })}"`);
      }
      if (p.tradeInVehicleId !== undefined) {
        if (p.tradeInVehicleId === null) {
          deal.terms.tradeInVehicleId = undefined;
          deal.terms.tradeInValue = undefined;
        } else {
          const vehicle = tradeInCandidates(s, listingKind(listingOf(s, deal))).find((v) => v.id === p.tradeInVehicleId);
          if (!vehicle) throw new CommandError('That is not something you can trade in here.');
          deal.terms.tradeInVehicleId = vehicle.id;
          deal.terms.tradeInValue = tradeInAllowance(s, deal, vehicle);
          say(deal, sellerSays(s, deal, 'terms', 'numbers', { move: 'tradein', vars: { trade: vehicleName(vehicle), value: formatMoney(deal.terms.tradeInValue) } }));
        }
      }
      if (p.repairs) {
        if (deal.status !== 'open') throw new CommandError('The price is agreed. Work on the car was part of that conversation.');
        const allowed = deal.findings.map((t) => findingByText(t)?.repair).filter((r): r is string => Boolean(r));
        for (const repair of p.repairs) if (!allowed.includes(repair)) throw new CommandError('You can only ask them to fix what you found.');
        deal.terms.repairs = [...new Set(p.repairs)];
        if (deal.terms.repairs.length > 0) say(deal, `"${sellerSays(s, deal, 'terms', 'numbers', { move: 'repairs', vars: { repairs: deal.terms.repairs.map((r) => r.toLowerCase()).join(', ') } })}"`);
      }
      return { terms: deal.terms, tradeInValue: deal.terms.tradeInValue };
    },
  );

  // --- The numbers -------------------------------------------------------------

  sim.onCommand<{ dealId: Id; price: Money }, { status: 'accepted' | 'countered' | 'refused' | 'final'; ask: Money; said: string }>(
    'deal.offer',
    (p, { sim: s }) => {
      const deal = requireOpen(s, p.dealId, ['open']);
      const price = Math.round(p.price);
      if (!Number.isFinite(price) || price <= 0) throw new CommandError('Offer a number.');
      if (!s.universe.people[deal.salespersonId]) throw new CommandError(NO_SUCH_DEAL);

      // Meeting their number is always accepted, and never for more than they asked.
      if (price >= deal.currentAsk) {
        deal.agreedPrice = deal.currentAsk;
        deal.lastOffer = deal.currentAsk;
        deal.status = 'agreed';
        say(deal, sellerSays(s, deal, 'accept', 'numbers'));
        s.emit('deal.agreed', { dealId: deal.id, price: deal.currentAsk });
        return { status: 'accepted', ask: deal.currentAsk, said: lastSaid(deal) };
      }
      if (deal.rounds >= MAX_ROUNDS) throw new CommandError(FINAL_PRICE);

      const floor = floorOf(s, deal);
      const rng = s.rng('deal', deal.id, deal.rounds);
      deal.lastOffer = price;
      deal.rounds += 1;
      const last = deal.rounds >= MAX_ROUNDS;

      if (price >= floor) {
        deal.agreedPrice = price;
        deal.status = 'agreed';
        say(deal, sellerSays(s, deal, 'accept', 'numbers'));
        s.emit('deal.agreed', { dealId: deal.id, price });
        return { status: 'accepted', ask: price, said: lastSaid(deal) };
      }
      if (price < floor * 0.9) {
        say(deal, sellerSays(s, deal, last ? 'final' : 'refuse', 'numbers'));
        return { status: last ? 'final' : 'refused', ask: deal.currentAsk, said: lastSaid(deal) };
      }
      // Already at their floor: there is nowhere left to go, and they say so.
      if (deal.currentAsk <= floor) {
        deal.rounds = MAX_ROUNDS;
        say(deal, sellerSays(s, deal, 'final', 'numbers'));
        return { status: 'final', ask: deal.currentAsk, said: lastSaid(deal) };
      }
      const skill = clamp((s.player.skills['negotiation'] ?? 10) / 100, 0, 1);
      const move = clamp(0.35 + skill * 0.45 + rng.float(-0.08, 0.08), 0.2, 0.95);
      let counter = Math.round(deal.currentAsk - (deal.currentAsk - price) * move);
      counter = Math.max(floor, Math.min(counter, deal.currentAsk - 100));
      deal.currentAsk = counter;
      say(deal, sellerSays(s, deal, last ? 'final' : 'counter', 'numbers'));
      return { status: last ? 'final' : 'countered', ask: counter, said: lastSaid(deal) };
    },
  );

  // --- Leaving, and signing ----------------------------------------------------

  sim.onCommand<{ dealId: Id }, { callbackAt?: number }>(
    'deal.walk_away',
    (p, { sim: s }) => {
      const deal = requireOpen(s, p.dealId, ['open', 'agreed']);
      const listing = listingOf(s, deal);
      const wasOpen = deal.status === 'open';
      const floor = floorOf(s, deal);
      deal.status = 'walked';
      deal.closedAt = s.now;
      s.timeline.cancelFor('deal', deal.id, s.now);
      s.resolveDecision('deal', deal.id);
      rememberFact(s, deal.salespersonId, {
        kind: 'event', aboutId: s.player.id,
        text: `Walked away from the ${carName(listing)}${deal.lastOffer ? ` at ${formatMoney(deal.lastOffer)}` : ''}.`,
        weight: 45, sourceKind: 'deal', expiresAt: s.now + 90 * MS_DAY, refType: 'deal', refId: deal.id,
      });
      s.emit('deal.walked', { dealId: deal.id, lastOffer: deal.lastOffer });

      // Close enough, and they will find your number in a couple of days.
      let callbackAt: number | undefined;
      if (wasOpen && deal.lastOffer && deal.lastOffer >= floor * 0.96) {
        callbackAt = addDays(s.now, CALLBACK_DAYS, s.homeZone);
        s.schedule({
          at: callbackAt, kind: 'deal.callback', label: `A Call About The ${carName(listing)}`, category: 'vehicles',
          payload: { dealId: deal.id, price: Math.max(floor, deal.lastOffer) }, priority: 55, refType: 'deal', refId: deal.id,
        });
      }
      return { callbackAt };
    },
  );

  sim.onCommand<{ dealId: Id; acquisition: Vehicle['acquisition']; downPayment?: Money; termMonths?: number; accountId?: Id }, { vehicleId: Id; paid: Money; monthlyPayment?: Money; deliveryDueAt?: number }>(
    'deal.sign',
    (p, { sim: s }) => {
      const deal = requireOpen(s, p.dealId, ['agreed']);
      const listing = listingOf(s, deal);
      const result = s.execute<{ vehicleId: Id; paid: Money; monthlyPayment?: Money; deliveryDueAt?: number }>({
        kind: 'veh.purchase',
        payload: { listingId: listing.id, acquisition: p.acquisition, downPayment: p.downPayment, termMonths: p.termMonths, accountId: p.accountId, dealId: deal.id },
      });
      if (!result.ok || !result.value) throw new CommandError(result.error ?? 'The paperwork did not go through.');
      deal.status = 'signed';
      deal.closedAt = s.now;
      deal.vehicleId = result.value.vehicleId;
      s.timeline.cancelFor('deal', deal.id, s.now);
      s.resolveDecision('deal', deal.id);
      rememberFact(s, deal.salespersonId, {
        kind: 'event', aboutId: s.player.id,
        text: `Bought the ${carName(listing)} for ${formatMoney(deal.agreedPrice ?? listing.price)}.`,
        weight: 70, sourceKind: 'deal', refType: 'vehicle', refId: result.value.vehicleId,
      });
      const make = VEHICLE_MODELS.get(listing.catalogId.split(':')[0] ?? '')?.make;
      const verb = { car: 'Drives', motorcycle: 'Rides', boat: 'Keeps', jet: 'Flies' }[listingKind(listing)];
      if (make) rememberFact(s, deal.salespersonId, { kind: 'preference', aboutId: s.player.id, text: `${verb} a ${make}.`, weight: 20, sourceKind: 'deal' });
      say(deal, sellerSays(s, deal, 'sign', 'desk'));
      s.emit('deal.signed', { dealId: deal.id, vehicleId: result.value.vehicleId, price: deal.agreedPrice });
      return result.value;
    },
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireOpen(sim: Simulation, dealId: Id, statuses: readonly VehicleDeal['status'][]): VehicleDeal {
  const deal = dealOf(sim, dealId);
  if (!statuses.includes(deal.status)) {
    throw new CommandError(deal.status === 'signed' ? 'That car is already yours.' : deal.status === 'walked' ? 'You walked away from that one.' : deal.status === 'expired' ? 'That deal has lapsed.' : 'Agree a price first.');
  }
  if (sim.player.currentLocationId !== listingOf(sim, deal).locationId) throw new CommandError(NOT_HERE);
  return deal;
}

function impressionOf(sim: Simulation, listing: VehicleListing): string {
  const model = VEHICLE_MODELS.get(listing.catalogId.split(':')[0] ?? '');
  const trim = trimOf(model?.id ?? '', listing.catalogId.split(':')[1] ?? '');
  const rng = sim.rng('impression', listing.id);
  const kind = listingKind(listing);
  const hp = trim?.horsepower ?? 150;
  const quick = (trim?.zeroToSixty ?? 8) < 5;
  if (kind === 'motorcycle') {
    const worn = listing.condition !== 'new' && listing.mileage > 20_000;
    return [
      quick ? 'It leaves before you have finished the thought. Second gear is a decision.' : hp > 90 ? 'Enough to be interesting everywhere and frightening nowhere.' : 'Light, easy, and it will go all day on a tank.',
      worn ? rng.pick(['A notch in the steering at straight ahead.', 'The clutch takes up late. It has done miles.', 'Something ticks at idle that should not.']) : rng.pick(['It turns in the moment you look where you want to go.', 'Smooth off the throttle, smooth back on.', 'It feels tight. Somebody has looked after it.']),
      (model?.bodyStyle === 'tourer' || model?.bodyStyle === 'cruiser') ? 'The seat is the best part.' : model?.bodyStyle === 'sportbike' ? 'Your wrists will have an opinion after an hour.' : '',
    ].filter(Boolean).join(' ');
  }
  if (kind === 'boat') {
    const knots = trim?.craft?.topSpeed ?? 30;
    const worn = listing.condition !== 'new' && listing.mileage > 500;
    return [
      model?.bodyStyle === 'sailing_yacht' ? 'The breeze fills in and the whole boat leans into it and goes quiet.' : knots > 40 ? 'It comes onto the plane in a few seconds and the wake flattens out behind you.' : 'It gets up and goes, and the ride is soft through the chop.',
      worn ? rng.pick(['There is a vibration at cruise that was not there at idle.', 'The gauges do not all agree with each other.', 'Water in the bilge by the time you are back at the dock.']) : rng.pick(['Dry, quiet, and it tracks straight.', 'Everything at the helm works the first time.', 'It turns tighter than it looks like it should.']),
      (trim?.craft?.berths ?? 0) > 0 ? 'Below decks is the best part.' : '',
    ].filter(Boolean).join(' ');
  }
  if (kind === 'jet') {
    const worn = listing.condition !== 'new' && listing.mileage > 4_000;
    return [
      (trim?.craft?.rangeKm ?? 0) > 9_000 ? 'It climbs straight to the forties and the cabin barely notices.' : 'Off the ground in a few thousand feet and the ground drops away fast.',
      worn ? rng.pick(['A cabin fan hums that the crew have stopped hearing.', 'The seat leather has gone shiny where people sit.', 'One screen on the flight deck is slower than the others.']) : rng.pick(['Quiet enough to talk at the back without raising your voice.', 'Everything in the cabin does what it says on the panel.', 'It smells new because it is.']),
      'The pilot lets you sit up front on the way back.',
    ].join(' ');
  }
  const worn = listing.condition !== 'new' && listing.mileage > 60_000;
  const parts = [
    quick ? 'It gets up and goes before you have finished asking.' : hp > 300 ? 'Plenty under your foot when you want it.' : 'Enough to get out of its own way, no more.',
    worn ? rng.pick(['There is a rattle somewhere behind you over bumps.', 'The steering has a little play in it.', 'It has done miles and it drives like it.']) : rng.pick(['It tracks straight and stops square.', 'Quiet inside. Everything falls to hand.', 'It feels like nobody has been unkind to it.']),
    listing.configuration.interior.includes('Leather') || listing.configuration.interior.includes('Nappa') ? 'The seats are the best part.' : '',
  ].filter(Boolean);
  return parts.join(' ');
}

function pruneDeals(sim: Simulation): void {
  const closed = dealsOf(sim).filter((d) => d.status !== 'open' && d.status !== 'agreed');
  for (const stale of closed.slice(DEALS_KEPT)) delete sim.universe.vehicleDeals[stale.id];
}
