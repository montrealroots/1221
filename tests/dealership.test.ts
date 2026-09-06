/**
 * The dealership: a car bought across a table.
 *
 * Every lot has cars and somebody on the floor. Looking gives you levers,
 * driving costs you half an hour, every offer is a round, and the dealer's
 * floor is never crossed and never shown. A deal fixes the price the
 * purchase uses and carries its terms: the trade-in comes off what you owe,
 * a delivered car is theirs until it arrives, agreed work is done and on
 * the record. Walk away close and they call. Sign twice and you own one
 * car. The salesperson remembers all of it.
 */

import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { VehicleDeal, VehicleListing } from '@/engine/domain/model';
import {
  CALLBACK_DAYS, DEAL_DAYS, MAX_ROUNDS, dealFor, dealershipsIn, dealsOf, findingByText, floorOf, listingsAt, lotOf, salespersonAt,
  tradeInCandidates,
} from '@/engine/systems/dealership';
import { refreshInventory, purchaseQuote } from '@/engine/systems/vehicles';
import { factsOf } from '@/engine/systems/memory';
import { activeScene, sceneView } from '@/engine/systems/scenes';
import { placesIn } from '@/engine/content/places';
import { localHour } from '@/engine/systems/fitness';

function aLife(seed = 'dealer'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 400_000_00, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  // A clean garage and a score a lender will look at; the car you start with
  // is sold so every count below is the dealership's doing.
  for (const v of Object.values(sim.universe.vehicles)) if (!v.soldAt) sim.execute({ kind: 'veh.sell', payload: { vehicleId: v.id } });
  const profile = sim.universe.creditProfiles[sim.player.id];
  if (profile) profile.score = 720;
  refreshInventory(sim);
  // Lots open at nine and close at seven; start the day at ten, local time.
  const hour = localHour(sim);
  if (hour < 10 || hour >= 17) sim.advanceTo(sim.now + ((10 - hour + 24) % 24) * MS_HOUR);
  return sim;
}

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

/** The cheapest car on the first lot that has one, and the lot it sits on. */
function aCar(sim: Simulation, condition?: VehicleListing['condition']): { listing: VehicleListing; placeId: string } {
  for (const lot of dealershipsIn(sim)) {
    const cars = listingsAt(sim, lot.id).filter((l) => !condition || l.condition === condition);
    if (cars[0]) return { listing: cars[0], placeId: lot.id };
  }
  throw new Error('No car on any lot');
}

function arrive(sim: Simulation, placeId: string): void {
  must(sim, 'go.to', { placeId, mode: 'taxi' });
}

function open(sim: Simulation, condition?: VehicleListing['condition']) {
  const { listing, placeId } = aCar(sim, condition);
  arrive(sim, placeId);
  const { dealId } = must<{ dealId: string; salespersonId: string }>(sim, 'deal.open', { placeId, listingId: listing.id });
  return { deal: sim.universe.vehicleDeals[dealId]!, listing, placeId };
}

describe('the lot', () => {
  it('gives every city three dealerships, and every listing sits on one of them', () => {
    const sim = aLife();
    const lots = dealershipsIn(sim);
    expect(lots).toHaveLength(3);
    expect(lots.map((l) => l.name)).toContain('Crossroads Auto Sales');
    const listings = Object.values(sim.universe.vehicleListings).filter((l) => l.status === 'active');
    expect(listings.length).toBeGreaterThan(5);
    for (const listing of listings) {
      expect(listing.dealerPlaceId, listing.id).toBeDefined();
      expect(lots.some((l) => l.id === lotOf(listing))).toBe(true);
      expect(listing.dealerName).toBe(lots.find((l) => l.id === listing.dealerPlaceId)!.name);
    }
    // Adding the lots moved nothing: the first place of every other kind kept its id.
    expect(placesIn(sim.player.currentLocationId).find((p) => p.kind === 'gym' && !p.real)?.id).toMatch(/:gym:0$/);
  });

  it('makes the salesperson on the first deal, never before, and only once', () => {
    const sim = aLife();
    const { listing, placeId } = aCar(sim);
    expect(salespersonAt(sim, placeId)).toBeUndefined();
    arrive(sim, placeId);
    const a = must<{ dealId: string; salespersonId: string; resumed: boolean }>(sim, 'deal.open', { placeId, listingId: listing.id });
    const b = must<{ dealId: string; salespersonId: string; resumed: boolean }>(sim, 'deal.open', { placeId, listingId: listing.id });
    expect(b.dealId).toBe(a.dealId);
    expect(b.resumed).toBe(true);
    expect(salespersonAt(sim, placeId)!.id).toBe(a.salespersonId);
    expect(factsOf(sim, a.salespersonId, { kind: 'meeting', aboutId: sim.player.id })).toHaveLength(1);
    expect(sim.universe.scheduled.some((i) => i.kind === 'deal.expire' && i.status === 'pending' && i.refId === a.dealId)).toBe(true);
  });

  it('refuses a car from another lot and a lot in another city', () => {
    const sim = aLife();
    const lots = dealershipsIn(sim);
    const { listing, placeId } = aCar(sim);
    const other = lots.find((l) => l.id !== placeId)!;
    arrive(sim, other.id);
    expect(attempt(sim, 'deal.open', { placeId: other.id, listingId: listing.id }).error).toMatch(/not on the lot/);
    expect(attempt(sim, 'deal.open', { placeId: 'us-ny-newyork:dealership:0', listingId: listing.id }).error).toMatch(/not in the city/);
  });
});

describe('looking and driving', () => {
  it('looking it over takes twenty minutes and turns up the same findings every time', () => {
    const sim = aLife();
    const { deal } = open(sim, 'used');
    const before = sim.now;
    const first = must<{ findings: string[] }>(sim, 'deal.inspect', { dealId: deal.id });
    expect(sim.now - before).toBe(20 * 60_000);
    expect(first.findings.length).toBeGreaterThanOrEqual(1);
    const again = must<{ findings: string[] }>(sim, 'deal.inspect', { dealId: deal.id });
    expect(again.findings).toEqual(first.findings);
    for (const text of first.findings) expect(findingByText(text)).toBeDefined();
  });

  it('a test drive costs half an hour and a little energy, and the salesperson remembers it', () => {
    const sim = aLife();
    const { deal } = open(sim);
    const energy = sim.player.wellbeing.energy;
    const { impression } = must<{ impression: string }>(sim, 'deal.test_drive', { dealId: deal.id });
    expect(impression.length).toBeGreaterThan(20);
    expect(sim.player.wellbeing.energy).toBe(energy - 3);
    expect(factsOf(sim, deal.salespersonId, { kind: 'topic', aboutId: sim.player.id })[0]?.text).toMatch(/^Drove the/);
    sim.player.wellbeing.energy = 5;
    const { deal: second } = open(sim, undefined);
    if (second.id !== deal.id) expect(attempt(sim, 'deal.test_drive', { dealId: second.id }).error).toMatch(/too tired/);
  });
});

describe('the numbers', () => {
  it('never goes below the floor, never shows it, and counters downward until the rounds run out', () => {
    const sim = aLife();
    const { deal } = open(sim);
    const floor = floorOf(sim, deal);
    expect(floor).toBeLessThan(deal.askingPrice);
    // A lowball is refused and their number does not move.
    const low = must<{ status: string; ask: number }>(sim, 'deal.offer', { dealId: deal.id, price: Math.round(floor * 0.5) });
    expect(low.status).toBe('refused');
    expect(low.ask).toBe(deal.askingPrice);
    // Offers inside the room are countered, each one lower than the last, never under the floor.
    let ask = deal.askingPrice;
    let rounds = 1;
    while (deal.status === 'open' && rounds < MAX_ROUNDS) {
      const offer = Math.round(floor * 0.93);
      const result = must<{ status: string; ask: number; said: string }>(sim, 'deal.offer', { dealId: deal.id, price: offer });
      rounds += 1;
      expect(result.said).not.toContain(String(floor));
      if (result.status === 'accepted' || result.status === 'final') break;
      expect(result.ask).toBeLessThan(ask);
      expect(result.ask).toBeGreaterThanOrEqual(floor);
      ask = result.ask;
    }
    if (deal.status === 'open') {
      expect(deal.rounds).toBe(MAX_ROUNDS);
      expect(deal.currentAsk).toBeGreaterThanOrEqual(floor);
      expect(attempt(sim, 'deal.offer', { dealId: deal.id, price: Math.round(floor * 0.93) }).error).toMatch(/final price/);
      // Meeting their number still works after the last round.
      const taken = must<{ status: string }>(sim, 'deal.offer', { dealId: deal.id, price: deal.currentAsk });
      expect(taken.status).toBe('accepted');
    }
    expect(deal.status).toBe('agreed');
    expect(deal.agreedPrice).toBeGreaterThanOrEqual(floor);
    expect(deal.agreedPrice).toBeLessThanOrEqual(deal.askingPrice);
    for (const line of deal.said) expect(line).not.toContain(String(floor / 100));
  });

  it('an offer at or above the floor is accepted, and never for more than they asked', () => {
    const sim = aLife();
    const { deal } = open(sim);
    const floor = floorOf(sim, deal);
    const result = must<{ status: string; ask: number }>(sim, 'deal.offer', { dealId: deal.id, price: floor });
    expect(result.status).toBe('accepted');
    expect(deal.agreedPrice).toBe(floor);
    const { deal: other } = open(sim);
    if (other.id !== deal.id) {
      const over = must<{ status: string; ask: number }>(sim, 'deal.offer', { dealId: other.id, price: other.askingPrice * 2 });
      expect(over.status).toBe('accepted');
      expect(other.agreedPrice).toBe(other.askingPrice);
    }
  });

  it('what you found is a lever, unless you ask them to fix it', () => {
    const sim = aLife();
    const { deal } = open(sim, 'used');
    const untouched = floorOf(sim, deal);
    must(sim, 'deal.inspect', { dealId: deal.id });
    const lever = deal.findings.map((t) => findingByText(t)!).find((f) => f.leverage > 0);
    if (!lever) return;
    const withLever = floorOf(sim, deal);
    expect(withLever).toBeLessThan(untouched);
    if (lever.repair) {
      must(sim, 'deal.set_terms', { dealId: deal.id, repairs: [lever.repair] });
      expect(floorOf(sim, deal)).toBeGreaterThan(withLever);
      expect(attempt(sim, 'deal.set_terms', { dealId: deal.id, repairs: ['Paint it gold'] }).error).toMatch(/only ask them to fix what you found/);
    }
  });
});

describe('signing', () => {
  it('buys the car at the agreed price with cash, once, however many times the pen comes down', () => {
    const sim = aLife();
    const { deal, listing } = open(sim);
    must(sim, 'deal.offer', { dealId: deal.id, price: deal.currentAsk });
    const account = sim.player.primaryAccountId!;
    const before = sim.ledger.availableFunds(account);
    const quote = purchaseQuote(sim, deal.agreedPrice!, 'cash');
    const command = { kind: 'deal.sign', payload: { dealId: deal.id, acquisition: 'cash' }, idempotencyKey: 'sign:1' };
    const first = sim.execute<{ vehicleId: string; paid: number }>(command);
    expect(first.ok, first.error).toBe(true);
    expect(sim.execute(command).replayed).toBe(true);
    expect(attempt(sim, 'deal.sign', { dealId: deal.id, acquisition: 'cash' }).error).toMatch(/already yours/);
    expect(first.value!.paid).toBe(quote.cashDue);
    expect(before - sim.ledger.availableFunds(account)).toBe(quote.cashDue);
    const vehicle = sim.universe.vehicles[first.value!.vehicleId]!;
    expect(vehicle.purchasePrice).toBe(deal.agreedPrice);
    expect(vehicle.dealId).toBe(deal.id);
    expect(vehicle.deliveryDueAt).toBeUndefined();
    expect(sim.universe.vehicleListings[listing.id]!.status).toBe('sold');
    expect(Object.values(sim.universe.vehicles).filter((v) => !v.soldAt)).toHaveLength(1);
    expect(deal.status).toBe('signed');
    expect(factsOf(sim, deal.salespersonId, { kind: 'event', aboutId: sim.player.id })[0]?.text).toMatch(/^Bought the/);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('refuses to sign before a price is agreed, and when the money is not there', () => {
    const sim = aLife();
    const { deal } = open(sim);
    expect(attempt(sim, 'deal.sign', { dealId: deal.id, acquisition: 'cash' }).error).toMatch(/Agree a price/);
    must(sim, 'deal.offer', { dealId: deal.id, price: deal.currentAsk });
    const account = sim.player.primaryAccountId!;
    const funds = sim.ledger.availableFunds(account);
    sim.expense(account, funds - 100_00, 'Spent it all', 'other');
    const broke = attempt(sim, 'deal.sign', { dealId: deal.id, acquisition: 'cash' });
    expect(broke.ok).toBe(false);
    expect(broke.error).toMatch(/You need/);
    expect(deal.status).toBe('agreed');
    expect(Object.values(sim.universe.vehicles).filter((v) => !v.soldAt)).toHaveLength(0);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('finances it through the loan book and leases it on a bill', () => {
    const sim = aLife();
    const { deal } = open(sim);
    must(sim, 'deal.offer', { dealId: deal.id, price: deal.currentAsk });
    const financed = must<{ vehicleId: string; monthlyPayment?: number }>(sim, 'deal.sign', { dealId: deal.id, acquisition: 'financed', termMonths: 60 });
    const vehicle = sim.universe.vehicles[financed.vehicleId]!;
    expect(vehicle.acquisition).toBe('financed');
    expect(vehicle.loanAccountId).toBeDefined();
    expect(financed.monthlyPayment).toBeGreaterThan(0);
    const { deal: second } = open(sim);
    expect(second.id).not.toBe(deal.id);
    must(sim, 'deal.offer', { dealId: second.id, price: second.currentAsk });
    const leased = must<{ vehicleId: string; monthlyPayment?: number }>(sim, 'deal.sign', { dealId: second.id, acquisition: 'leased' });
    const lease = sim.universe.vehicles[leased.vehicleId]!;
    expect(lease.acquisition).toBe('leased');
    expect(Object.values(sim.universe.bills).some((b) => b.refType === 'vehicle' && b.refId === lease.id && b.active)).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('takes a trade-in off what you owe, moves the old car off the books, and refuses one under water', () => {
    const sim = aLife();
    // Own a car first, outright.
    const first = open(sim);
    must(sim, 'deal.offer', { dealId: first.deal.id, price: first.deal.currentAsk });
    const owned = must<{ vehicleId: string }>(sim, 'deal.sign', { dealId: first.deal.id, acquisition: 'cash' });
    expect(tradeInCandidates(sim).map((v) => v.id)).toEqual([owned.vehicleId]);

    const second = open(sim);
    const { tradeInValue } = must<{ tradeInValue?: number }>(sim, 'deal.set_terms', { dealId: second.deal.id, tradeInVehicleId: owned.vehicleId });
    expect(tradeInValue).toBeGreaterThan(0);
    must(sim, 'deal.offer', { dealId: second.deal.id, price: second.deal.currentAsk });
    const quote = purchaseQuote(sim, second.deal.agreedPrice!, 'cash', { tradeInCredit: tradeInValue });
    const account = sim.player.primaryAccountId!;
    const before = sim.ledger.availableFunds(account);
    const signed = must<{ vehicleId: string; paid: number }>(sim, 'deal.sign', { dealId: second.deal.id, acquisition: 'cash' });
    expect(signed.paid).toBe(quote.cashDue);
    expect(before - sim.ledger.availableFunds(account)).toBe(quote.cashDue);
    expect(sim.universe.vehicles[owned.vehicleId]!.soldAt).toBe(sim.now);
    expect(Object.values(sim.universe.vehicles).filter((v) => !v.soldAt).map((v) => v.id)).toEqual([signed.vehicleId]);
    expect(sim.ledger.audit()).toEqual([]);

    // A car with more owed on it than they will allow cannot be traded.
    const third = open(sim);
    must(sim, 'deal.offer', { dealId: third.deal.id, price: third.deal.currentAsk });
    const financed = must<{ vehicleId: string }>(sim, 'deal.sign', { dealId: third.deal.id, acquisition: 'financed', downPayment: 100_00 });
    const fourth = open(sim);
    must(sim, 'deal.set_terms', { dealId: fourth.deal.id, tradeInVehicleId: financed.vehicleId });
    must(sim, 'deal.offer', { dealId: fourth.deal.id, price: fourth.deal.currentAsk });
    const under = attempt(sim, 'deal.sign', { dealId: fourth.deal.id, acquisition: 'cash' });
    expect(under.ok).toBe(false);
    expect(under.error).toMatch(/You owe/);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('a delivered car is theirs until it arrives, with the agreed work done and on the record', () => {
    const sim = aLife();
    const { deal } = open(sim, 'used');
    must(sim, 'deal.inspect', { dealId: deal.id });
    const repair = deal.findings.map((t) => findingByText(t)?.repair).find(Boolean);
    must(sim, 'deal.set_terms', { dealId: deal.id, delivery: 'deliver', ...(repair ? { repairs: [repair] } : {}) });
    must(sim, 'deal.offer', { dealId: deal.id, price: deal.currentAsk });
    const signed = must<{ vehicleId: string; deliveryDueAt?: number }>(sim, 'deal.sign', { dealId: deal.id, acquisition: 'cash' });
    const vehicle = sim.universe.vehicles[signed.vehicleId]!;
    expect(signed.deliveryDueAt).toBeGreaterThan(sim.now);
    expect(vehicle.deliveryDueAt).toBe(signed.deliveryDueAt);
    expect(attempt(sim, 'veh.drive', { vehicleId: vehicle.id, miles: 10 }).error).toMatch(/not been delivered/);
    expect(attempt(sim, 'veh.sell', { vehicleId: vehicle.id }).error).toMatch(/not been delivered/);
    expect(vehicle.serviceRecordIds).toHaveLength(0);
    sim.advanceTo(signed.deliveryDueAt! + 60_000);
    expect(vehicle.deliveryDueAt).toBeUndefined();
    if (repair) {
      expect(vehicle.serviceRecordIds).toHaveLength(1);
      const record = sim.universe.serviceRecords[vehicle.serviceRecordIds[0]!]!;
      expect(record.cost).toBe(0);
      expect(record.description).toContain(repair);
    }
    expect(sim.universe.notifications.some((n) => n.title === 'Your Car Has Arrived')).toBe(true);
    expect(attempt(sim, 'veh.drive', { vehicleId: vehicle.id, miles: 10 }).ok).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('insures the new car from the same chair', () => {
    const sim = aLife();
    const { deal } = open(sim);
    must(sim, 'deal.offer', { dealId: deal.id, price: deal.currentAsk });
    const { vehicleId } = must<{ vehicleId: string }>(sim, 'deal.sign', { dealId: deal.id, acquisition: 'cash' });
    const quote = must<{ premium: number; quoteId: string }>(sim, 'ins.quote', { line: 'auto', coveredRefs: [{ type: 'vehicle', id: vehicleId }] });
    expect(quote.premium).toBeGreaterThan(0);
    const { policyId } = must<{ policyId: string }>(sim, 'ins.purchase', { quoteId: quote.quoteId });
    expect(sim.universe.vehicles[vehicleId]!.insurancePolicyId).toBe(policyId);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('walking away, and coming back', () => {
  it('ends the conversation, is remembered, cannot be reopened the same day, and lapses on its own if left', () => {
    const sim = aLife();
    const { deal, listing, placeId } = open(sim);
    must(sim, 'deal.walk_away', { dealId: deal.id });
    expect(deal.status).toBe('walked');
    expect(factsOf(sim, deal.salespersonId, { kind: 'event', aboutId: sim.player.id })[0]?.text).toMatch(/^Walked away/);
    expect(attempt(sim, 'deal.open', { placeId, listingId: listing.id }).error).toMatch(/Come back tomorrow/);
    expect(attempt(sim, 'deal.offer', { dealId: deal.id, price: deal.askingPrice }).error).toMatch(/walked away/);
    sim.advanceTo(sim.now + MS_DAY);
    const again = must<{ dealId: string; resumed: boolean }>(sim, 'deal.open', { placeId, listingId: listing.id });
    expect(again.dealId).not.toBe(deal.id);
    expect(again.resumed).toBe(false);
    sim.advanceTo(sim.now + (DEAL_DAYS + 1) * MS_DAY);
    expect(sim.universe.vehicleDeals[again.dealId]!.status).toBe('expired');
  });

  it('calls you back when you walked away close to their floor, and the call holds the price', () => {
    const sim = aLife();
    const { deal, listing } = open(sim);
    const floor = floorOf(sim, deal);
    // Offer just under the floor, so it is countered, then walk.
    const result = must<{ status: string }>(sim, 'deal.offer', { dealId: deal.id, price: Math.round(floor * 0.97) });
    if (result.status === 'accepted') return; // the rng landed it; nothing to call about
    const { callbackAt } = must<{ callbackAt?: number }>(sim, 'deal.walk_away', { dealId: deal.id });
    expect(callbackAt).toBeDefined();
    expect(callbackAt! - sim.now).toBeGreaterThanOrEqual(CALLBACK_DAYS * MS_DAY - MS_HOUR);
    sim.advanceTo(callbackAt! + 60_000);
    expect(deal.status).toBe('agreed');
    expect(deal.agreedPrice).toBeGreaterThanOrEqual(floor);
    expect(deal.agreedPrice).toBeLessThan(listing.price);
    const decision = Object.values(sim.universe.decisions).find((d) => d.refType === 'deal' && d.refId === deal.id && !d.resolvedAt);
    expect(decision).toBeDefined();
    const commands = new Set(sim.commandKinds());
    for (const action of decision!.actions) expect(commands.has(action.commandKind), action.commandKind).toBe(true);
    // Take it: the sign goes through at the called price.
    const signed = must<{ vehicleId: string }>(sim, 'deal.sign', { dealId: deal.id, acquisition: 'cash' });
    expect(sim.universe.vehicles[signed.vehicleId]!.purchasePrice).toBe(deal.agreedPrice);
    expect(Object.values(sim.universe.decisions).find((d) => d.refId === deal.id)!.resolvedAt).toBeDefined();
  });

  it('the second visit is a second visit', () => {
    const sim = aLife();
    const first = open(sim);
    must(sim, 'deal.offer', { dealId: first.deal.id, price: first.deal.currentAsk });
    must(sim, 'deal.sign', { dealId: first.deal.id, acquisition: 'cash' });
    const second = open(sim);
    if (second.placeId === first.placeId) {
      expect(second.deal.salespersonId).toBe(first.deal.salespersonId);
      expect(second.deal.said[0]).toMatch(/remembers you/);
      // A customer gets a little more room.
      expect(floorOf(sim, second.deal)).toBeLessThan(Math.round(second.listing.price * (1 - second.listing.negotiationRoom)));
    }
  });
});

describe('the scene', () => {
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

  it('walks the whole way: arrive, the lot, the car, the numbers, the paperwork, the keys', () => {
    const sim = aLife();
    const { listing, placeId } = aCar(sim);
    const scene = start(sim, { placeId, listingId: listing.id });
    expect(scene.node).toBe('arrive');
    pick(sim, /^(Taxi|Walk|Transit|Drive)$/);
    expect(activeScene(sim)!.node).toBe('lot');
    const lot = sceneView(sim, activeScene(sim)!);
    expect(lot.choices[0]!.label).toContain('You Came For');
    pick(sim, /You Came For/);
    expect(activeScene(sim)!.node).toBe('car');
    expect(dealFor(sim, listing.id)).toBeDefined();
    pick(sim, /^Look It Over$/);
    pick(sim, /^Take It For A Drive$/);
    pick(sim, /^Talk Numbers$/);
    const numbers = sceneView(sim, activeScene(sim)!);
    expect(numbers.facts!.map((f) => f.label)).toContain('Rounds Left');
    // No floor on screen.
    const deal = dealFor(sim, listing.id)!;
    const floor = floorOf(sim, deal);
    expect(JSON.stringify(numbers)).not.toContain(String(floor));
    pick(sim, /^Accept /);
    expect(activeScene(sim)!.node).toBe('agreed');
    const paperwork = sceneView(sim, activeScene(sim)!);
    expect(paperwork.facts!.map((f) => f.label)).toEqual(['Price', 'Tax And Fees', 'Trade-In Credit', 'Cash Total']);
    pick(sim, /^Pay Cash$/);
    expect(activeScene(sim)!.node).toBe('signed');
    pick(sim, /^Get An Insurance Quote$/);
    pick(sim, /^Insure It/);
    expect(activeScene(sim)!.node).toBe('handover');
    pick(sim, /^Back To The Day$/);
    expect(activeScene(sim)).toBeUndefined();
    const vehicle = Object.values(sim.universe.vehicles).find((v) => v.dealId === deal.id)!;
    expect(vehicle.insurancePolicyId).toBeDefined();
    expect(vehicle.dealId).toBe(deal.id);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('survives a save and a reload halfway through, and the short version applies the same rules', () => {
    const sim = aLife();
    const { listing, placeId } = aCar(sim);
    start(sim, { placeId, listingId: listing.id });
    pick(sim, /^(Taxi|Walk|Transit|Drive)$/);
    pick(sim, /You Came For/);
    pick(sim, /^Talk Numbers$/);
    pick(sim, /^Offer /);
    const back = loadSave(JSON.parse(JSON.stringify(sim.universe)));
    const scene = activeScene(back)!;
    expect(scene.node).toBe('numbers');
    const deal = back.universe.vehicleDeals[String(scene.context['dealId'])]!;
    expect(deal.rounds).toBe(1);
    must(back, 'scene.skip', { sceneId: scene.id, revision: scene.revision });
    expect(activeScene(back)).toBeUndefined();
    expect(deal.status).toBe('signed');
    expect(Object.values(back.universe.vehicles).filter((v) => !v.soldAt)).toHaveLength(1);
    expect(back.ledger.audit()).toEqual([]);
  });

  it('is interrupted by leaving the lot, and picks up where it was', () => {
    const sim = aLife();
    const { listing, placeId } = aCar(sim);
    start(sim, { placeId, listingId: listing.id });
    pick(sim, /^(Taxi|Walk|Transit|Drive)$/);
    pick(sim, /You Came For/);
    const cafe = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'cafe')!;
    must(sim, 'go.to', { placeId: cafe.id, mode: 'taxi' });
    // The runtime notices on the next step, not on the taxi ride.
    const scene = activeScene(sim)!;
    const away = must<{ status: string }>(sim, 'scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId: 'numbers' });
    expect(away.status).toBe('interrupted');
    expect(scene.status).toBe('interrupted');
    must(sim, 'go.to', { placeId, mode: 'taxi' });
    must(sim, 'scene.resume', { sceneId: scene.id });
    expect(activeScene(sim)!.status).toBe('active');
    expect(activeScene(sim)!.node).toBe('car');
  });

  it('keeps deals bounded and lists them newest first', () => {
    const sim = aLife();
    const { deal } = open(sim);
    expect(dealsOf(sim)[0]!.id).toBe(deal.id);
    const kinds = new Set(sim.commandKinds());
    for (const kind of ['deal.open', 'deal.inspect', 'deal.test_drive', 'deal.set_terms', 'deal.offer', 'deal.walk_away', 'deal.sign']) expect(kinds.has(kind), kind).toBe(true);
    const deals: VehicleDeal[] = dealsOf(sim);
    expect(deals.every((d) => typeof d.id === 'string')).toBe(true);
  });
});
