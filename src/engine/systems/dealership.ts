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
import { VEHICLE_MODELS, trimOf } from '../content/vehicles';
import { makeBackgroundPerson, peopleOf } from './people';
import { factsOf, rememberFact } from './memory';
import { createRelationship, findRelationship } from './relationships';
import { applyDealerRepairs, dealerPlaceFor } from './vehicles';
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
  { text: 'The tyres are down to the wear bars.', leverage: 0.02, repair: 'Fit New Tyres' },
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

const ALL_FINDINGS: readonly Finding[] = [...USED_FINDINGS, ...NEW_FINDINGS];

/** What looking a car over turns up. Fixed for the car, so a second look agrees with the first. */
export function findingsFor(sim: Simulation, listing: VehicleListing): Finding[] {
  const rng = sim.rng('findings', listing.id);
  const pool = listing.condition === 'new' ? NEW_FINDINGS : USED_FINDINGS;
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
  return listing.dealerPlaceId ?? dealerPlaceFor(listing.locationId, listing.condition)?.id;
}

/**
 * "2018 Porsche Cayenne", not "2018 Porsche Cayenne Cayenne": a model that
 * carries its make's name, or a trim that carries the model's, is said once.
 */
function joinName(year: number, make: string, model: string, trim?: string): string {
  const body = model.startsWith(make) ? model : `${make} ${model}`;
  const tail = trim && trim !== model && !body.endsWith(trim) ? ` ${trim}` : '';
  return `${year} ${body}${tail}`.replace(/\s+/g, ' ').trim();
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
  return makeBackgroundPerson(sim, {
    rng, archetype: `sales:${place.id}`, industryRole: 'car_salesperson', cityId: place.cityId,
    background: `Sells cars at ${place.name}.`,
    interests: ['cars', rng.pick(['golf', 'football', 'cooking', 'fishing', 'music'])],
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

/** The cars you could put in part exchange: yours, here, paid for or on finance, not leased, not still waiting on delivery. */
export function tradeInCandidates(sim: Simulation): Vehicle[] {
  const player = sim.player;
  return Object.values(sim.universe.vehicles).filter((v) =>
    !v.soldAt && !v.deliveryDueAt && v.ownerId === player.id && v.acquisition !== 'leased'
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
    facts: seller ? sellerKnows(sim, seller.id) : [],
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
      category: 'vehicle', title: `The ${vehicleName(vehicle)} was delivered`,
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
      if (s.player.wellbeing.energy < 10) throw new CommandError('You are too tired to drive anything today.');
      s.advanceTo(s.now + 30 * MS_MINUTE);
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
          const vehicle = tradeInCandidates(s).find((v) => v.id === p.tradeInVehicleId);
          if (!vehicle) throw new CommandError('That is not a car you can trade in here.');
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
      if (make) rememberFact(s, deal.salespersonId, { kind: 'preference', aboutId: s.player.id, text: `Drives a ${make}.`, weight: 20, sourceKind: 'deal' });
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
  const hp = trim?.horsepower ?? 150;
  const quick = (trim?.zeroToSixty ?? 8) < 5;
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
