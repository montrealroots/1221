/**
 * SLATE — Vehicles: buying, owning, servicing and modifying.
 *
 * Every car keeps two configurations: the one it left the factory with, which
 * never changes, and the one it has now. Modifications are validated against
 * make, model, year, trim, powertrain, body style, prerequisite parts and local
 * law before a wrench is picked up.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, ServiceRecord, Vehicle, VehicleConfiguration, VehicleListing, VehicleModification } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, addYears, MS_DAY } from '../core/time';
import { applyRate, formatMoney, type Money } from '../core/money';
import {
  FACTORY_OPTIONS, KIND_PROFILE, MANUFACTURERS, PARTS, VEHICLE_MODELS, checkFitment, kindOf, partsFor, trimOf,
  type BodyStyle, type CraftSpec, type FitmentSubject, type KindProfile, type PartCategory, type Powertrain, type VehicleKind,
} from '../content/vehicles';
import { CITIES } from '../content/geography';
import { placesIn, type Place } from '../content/places';
import { costOfLiving, vehicleFees } from '../content/tax';
import { weatherAt } from './weather';
import { createBill, amortisedPayment, loanRefusal, offeredApr } from './finance';

const DOC_FEE: Money = 85_00;
/** How long you can be out on a boat in one go, in hours. */
export const MAX_CRUISE_HOURS = 10;
/** Launching a trailered boat: the ramp fee before cost of living, and the time. */
export const RAMP_FEE: Money = 30_00;
export const RAMP_MINUTES = 45;

export const WAITING_ON_DELIVERY = 'That has not been delivered yet.';
/** A name on a tail or a transom. */
export const NAME_MAX = 30;
export const NOT_A_BOAT = 'That is not a boat.';
export const NOT_FOR_THE_ROAD = 'That does not go on the road.';
export const ROUGH_WATER = 'A storm is on the water. Nobody sensible is going out in it.';

/** What kind of thing a vehicle is. One from before there was anything but cars is a car. */
export function vehicleKind(vehicle: Pick<Vehicle, 'kind' | 'catalogId'>): VehicleKind {
  return vehicle.kind ?? kindOf(vehicle.catalogId);
}

export function profileOf(vehicle: Pick<Vehicle, 'kind' | 'catalogId'>): KindProfile {
  return KIND_PROFILE[vehicleKind(vehicle)];
}

/** Something that can be driven on a road: a car or a motorcycle. */
export function roadworthy(vehicle: Pick<Vehicle, 'kind' | 'catalogId'>): boolean {
  const kind = vehicleKind(vehicle);
  return kind === 'car' || kind === 'motorcycle';
}

/**
 * The craft figures as they stand: the trim's, plus what the parts on it
 * have added to range or top speed. Absent on a car.
 */
export function craftOf(sim: Simulation, vehicle: Vehicle): CraftSpec | undefined {
  const base = trimOf(vehicle.catalogId, vehicle.trim)?.craft;
  if (!base) return undefined;
  let rangeKm = base.rangeKm ?? 0;
  let topSpeed = base.topSpeed ?? 0;
  for (const modId of vehicle.currentConfiguration.modificationIds) {
    const mod = sim.universe.vehicleModifications[modId];
    if (!mod || mod.removedAt) continue;
    const part = PARTS.get(mod.partCatalogId);
    rangeKm += part?.effects.rangeKm ?? 0;
    topSpeed += part?.effects.topSpeed ?? 0;
  }
  return { ...base, rangeKm: base.rangeKm === undefined ? undefined : rangeKm, topSpeed: base.topSpeed === undefined ? undefined : topSpeed };
}

/** What a crewed boat or an aircraft costs a month in crew and standing maintenance, wherever it is kept. */
export function crewFor(sim: Simulation, vehicle: Vehicle): Money {
  const craft = trimOf(vehicle.catalogId, vehicle.trim)?.craft;
  if (!craft?.crewMonthly) return 0;
  return Math.round(craft.crewMonthly * costOfLiving(vehicle.locationId ?? sim.player.currentLocationId));
}

/** What an hour under way costs, in fuel, crew and wear, where the boat or jet is. */
export function hourlyCostOf(sim: Simulation, vehicle: Vehicle): Money {
  const craft = trimOf(vehicle.catalogId, vehicle.trim)?.craft;
  if (!craft?.hourlyOperating) return 0;
  return Math.round(craft.hourlyOperating * costOfLiving(vehicle.locationId ?? sim.player.currentLocationId));
}

/**
 * Which lot in a city sells this: for a car, the new-car mall, the used lot or
 * the classic dealer by condition; for anything else, the one place in town
 * that sells that kind. A city that somehow has fewer gets the last one there is.
 */
export function dealerPlaceFor(cityId: string, condition: VehicleListing['condition'], kind: VehicleKind = 'car'): Place | undefined {
  const lots = placesIn(cityId).filter((p) => p.kind === 'dealership');
  if (lots.length === 0) return undefined;
  const index = kind === 'car' ? (condition === 'collector' ? 2 : condition === 'used' ? 1 : 0) : KIND_PROFILE[kind].lotIndex;
  return lots[Math.min(index, lots.length - 1)];
}

/** The numbers on the paperwork for one price and one way of paying. */
export interface PurchaseQuote {
  price: Money;
  salesTax: Money;
  registration: Money;
  docFee: Money;
  /** Everything before any trade-in comes off. */
  total: Money;
  /** What leaves your account today, after a trade-in credit. */
  cashDue: Money;
  monthlyPayment?: Money;
  down?: Money;
  months?: number;
  apr?: number;
  borrow?: Money;
  tradeInCredit: Money;
}

/**
 * The same arithmetic the purchase runs, for reading before signing. Fees
 * are the jurisdiction's where you stand; the rate is the one your credit
 * gets; a trade-in credit comes off the cash due, or off what is borrowed.
 */
export function purchaseQuote(
  sim: Simulation, price: Money, acquisition: Vehicle['acquisition'],
  opts: { downPayment?: Money; termMonths?: number; tradeInCredit?: Money } = {},
): PurchaseQuote {
  const player = sim.player;
  const fees = vehicleFees(player.currentLocationId, sim.now);
  const salesTax = applyRate(price, fees.purchaseTaxRate);
  const registration = Math.max(fees.registrationMinimum, applyRate(price, fees.registrationRate));
  const total = price + salesTax + registration + DOC_FEE;
  const credit = Math.max(0, opts.tradeInCredit ?? 0);
  if (acquisition === 'financed') {
    const down = opts.downPayment ?? Math.round(price * 0.12);
    const months = opts.termMonths ?? 60;
    const apr = offeredApr(player.creditScore, 'auto');
    const borrow = price - down - credit;
    const monthlyPayment = borrow > 0 ? amortisedPayment(borrow, apr, months) : 0;
    return { price, salesTax, registration, docFee: DOC_FEE, total, cashDue: down + salesTax + registration + DOC_FEE, monthlyPayment, down, months, apr, borrow, tradeInCredit: credit };
  }
  if (acquisition === 'leased') {
    const residual = Math.round(price * 0.58);
    const months = opts.termMonths ?? 36;
    const down = opts.downPayment ?? Math.round(price * 0.08);
    const monthlyPayment = Math.ceil((price - residual) / months + (price * 0.0022));
    return { price, salesTax, registration, docFee: DOC_FEE, total, cashDue: Math.max(0, down + registration + DOC_FEE - credit), monthlyPayment, down, months, tradeInCredit: credit };
  }
  return { price, salesTax, registration, docFee: DOC_FEE, total, cashDue: Math.max(0, total - credit), tradeInCredit: credit };
}

/**
 * Why finance would be refused for a quote, or nothing: the lender's score
 * rule, a deposit that covers the car, and a payment your income will not
 * carry. The purchase applies it; the paperwork step shows it.
 */
export function financeRefusal(sim: Simulation, quote: PurchaseQuote, borrowerId: Id = sim.player.id): string | undefined {
  const lender = loanRefusal(sim, borrowerId, 'auto');
  if (lender) return lender;
  if ((quote.borrow ?? 0) <= 0) return 'The deposit covers the whole price. Buy it outright instead.';
  const monthlyIncome = monthlyIncomeEstimate(sim, borrowerId);
  if (monthlyIncome > 0 && (quote.monthlyPayment ?? 0) > monthlyIncome * 0.28) {
    return `A lender will not approve that. ${formatMoney(quote.monthlyPayment ?? 0)} a month against income of about ${formatMoney(monthlyIncome)} is too much.`;
  }
  return undefined;
}

/** A car you cannot drive, sell or book in yet, because it is not with you. */
export function requireInHand(vehicle: Vehicle): void {
  if (vehicle.deliveryDueAt) throw new CommandError(WAITING_ON_DELIVERY);
}

/**
 * What the dealer agreed to put right before handover, done at no charge and
 * on the record as a repair, so the history shows it.
 */
export function applyDealerRepairs(sim: Simulation, vehicle: Vehicle, repairs: readonly string[], shopName: string): void {
  for (const description of repairs) {
    const record: ServiceRecord = {
      id: sim.nextId('service'),
      saveId: sim.universe.meta.id,
      vehicleId: vehicle.id,
      kind: 'repair',
      description: `${description} — agreed at sale`,
      mileage: vehicle.mileage,
      cost: 0,
      coveredByWarranty: false,
      performedAt: sim.now,
      shopName,
      healthDelta: 6,
    };
    sim.universe.serviceRecords[record.id] = record;
    vehicle.serviceRecordIds.push(record.id);
    vehicle.mechanicalHealth = clamp(vehicle.mechanicalHealth + 6, 0, 100);
    vehicle.condition = clamp(vehicle.condition + 3, 0, 100);
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerVehicles(sim: Simulation): void {
  sim.onSchedule('veh.refresh_inventory', () => {
    refreshInventory(sim);
    sim.schedule({ at: addDays(sim.now, 14, sim.homeZone), kind: 'veh.refresh_inventory', label: 'Dealer Inventory', category: 'vehicles', priority: 68 });
  });
  sim.onSchedule('veh.service_appointment', (item) => performService(sim, item.payload.vehicleId as Id, item.payload.kind as ServiceRecord['kind'], item.payload.description as string));
  sim.onSchedule('veh.install_parts', (item) => installParts(sim, item.payload.vehicleId as Id, item.payload.partIds as string[]));
  sim.onSchedule('veh.registration_due', (item) => renewRegistration(sim, item.payload.vehicleId as Id));
  sim.onSchedule('veh.depreciate', () => {
    depreciateAll(sim);
    sim.schedule({ at: addDays(sim.now, 30, sim.homeZone), kind: 'veh.depreciate', label: 'Vehicle Values', category: 'system', priority: 93 });
  });

  // --- Purchase ------------------------------------------------------------

  sim.onCommand<{ listingId: Id; acquisition: Vehicle['acquisition']; downPayment?: Money; termMonths?: number; accountId?: Id; negotiate?: boolean; dealId?: Id }, { vehicleId: Id; paid: Money; monthlyPayment?: Money; deliveryDueAt?: number }>(
    'veh.purchase',
    (p, { sim: s }) => {
      const listing = s.universe.vehicleListings[p.listingId];
      if (!listing || listing.status !== 'active') throw new CommandError('That vehicle is no longer available.');
      const model = VEHICLE_MODELS.require(listing.catalogId.split(':')[0] as string);
      const trimId = listing.catalogId.split(':')[1] as string;
      const trim = trimOf(model.id, trimId);
      if (!trim) throw new CommandError('That configuration is no longer offered.');

      const player = s.player;
      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');

      // A deal made across the table fixes the price and carries its terms.
      // Without one, negotiation is one seeded haggle at the counter.
      const deal = p.dealId ? s.universe.vehicleDeals[p.dealId] : undefined;
      if (p.dealId && (!deal || deal.listingId !== listing.id)) throw new CommandError('That deal is not for this car.');
      if (deal && deal.status !== 'agreed') throw new CommandError('Agree a price before you sign.');
      let price = listing.price;
      if (deal) {
        price = deal.agreedPrice ?? listing.price;
      } else if (p.negotiate) {
        const rng = s.rng('negotiate', listing.id);
        const skill = clamp((player.skills['negotiation'] ?? 10) / 100, 0, 1);
        const movement = listing.negotiationRoom * clamp(0.25 + skill * 0.85 + rng.float(-0.15, 0.15), 0, 1);
        price = Math.round(price * (1 - movement));
      }

      // The car you bring: what they allow for it comes off what you owe
      // today, once whatever is still owed on it has been cleared.
      const tradeIn = deal?.terms.tradeInVehicleId ? s.universe.vehicles[deal.terms.tradeInVehicleId] : undefined;
      let tradeCredit: Money = 0;
      let tradePayoff: Money = 0;
      if (deal?.terms.tradeInVehicleId) {
        if (!tradeIn || tradeIn.soldAt || tradeIn.ownerId !== player.id) throw new CommandError('The car you were trading in is not yours to trade.');
        if (tradeIn.acquisition === 'leased') throw new CommandError('A leased car cannot be traded in.');
        requireInHand(tradeIn);
        tradeCredit = deal.terms.tradeInValue ?? 0;
        if (tradeIn.loanAccountId) {
          const loan = s.ledger.tryAccount(tradeIn.loanAccountId);
          tradePayoff = loan ? Math.max(0, -loan.balance) : 0;
          if (tradePayoff > tradeCredit) {
            throw new CommandError(`You owe ${formatMoney(tradePayoff)} on the ${tradeIn.year} ${tradeIn.make} ${tradeIn.model} and they will only allow ${formatMoney(tradeCredit)} for it.`);
          }
        }
      }
      const netCredit = Math.max(0, tradeCredit - tradePayoff);

      const quote = purchaseQuote(s, price, p.acquisition, { downPayment: p.downPayment, termMonths: p.termMonths, tradeInCredit: netCredit });
      if (p.acquisition === 'financed') {
        const refusal = financeRefusal(s, quote);
        if (refusal) throw new CommandError(refusal);
      }
      if (s.ledger.availableFunds(accountId) < quote.cashDue) {
        throw new CommandError(`You need ${formatMoney(quote.cashDue)} to drive this away and you have ${formatMoney(s.ledger.availableFunds(accountId))}.`);
      }

      let loanAccountId: Id | undefined;
      if (p.acquisition === 'financed') {
        const result = s.execute<{ accountId: Id; monthlyPayment: Money }>({
          kind: 'finance.take_loan',
          payload: { borrowerId: player.id, principal: quote.borrow, months: quote.months, product: 'auto', name: `Auto loan — ${model.make} ${model.name}` },
        });
        if (!result.ok) throw new CommandError(result.error ?? 'Financing was declined.');
        loanAccountId = result.value?.accountId;
      }

      // The trade-in changes hands: its value comes in, its loan goes out,
      // and it is off the books before the new car goes on them.
      if (tradeIn && deal) {
        s.income(accountId, tradeCredit, `Trade-in — ${tradeIn.year} ${tradeIn.make} ${tradeIn.model}`, 'transport', { refType: 'vehicle', refId: tradeIn.id });
        if (tradeIn.loanAccountId && tradePayoff > 0) {
          s.post({
            memo: `Loan payoff — ${tradeIn.make} ${tradeIn.model}`,
            category: 'transport',
            postings: [{ accountId: tradeIn.loanAccountId, amount: tradePayoff }, { accountId, amount: -tradePayoff }],
            refType: 'vehicle', refId: tradeIn.id,
          });
          const loan = s.ledger.tryAccount(tradeIn.loanAccountId);
          if (loan) loan.closedAt = s.now;
        }
        tradeIn.soldAt = s.now;
        s.timeline.cancelFor('vehicle', tradeIn.id, s.now);
        for (const bill of Object.values(s.universe.bills)) {
          if (bill.refType === 'vehicle' && bill.refId === tradeIn.id) bill.active = false;
        }
        s.emit('vehicle.sold', { vehicleId: tradeIn.id, proceeds: tradeCredit, net: netCredit, tradedIn: true });
      }

      // The gross goes out; the credit already came in above, so the account
      // moves by exactly the cash due.
      s.expense(accountId, quote.cashDue + netCredit, `${model.make} ${model.name} ${trim.name}`, 'transport', { refType: 'listing', refId: listing.id });

      const vehicle = createVehicle(s, {
        ownerId: player.id,
        modelId: model.id,
        trimId,
        year: listing.year,
        mileage: listing.mileage,
        configuration: listing.configuration,
        purchasePrice: price,
        acquisition: p.acquisition,
        loanAccountId,
        condition: listing.condition === 'new' ? 100 : clamp(100 - listing.mileage / 2200, 45, 96),
      });
      if (deal) vehicle.dealId = deal.id;
      ensureCrew(s, vehicle, accountId);

      if (p.acquisition === 'leased') {
        vehicle.leaseEndsAt = addDays(s.now, (quote.months ?? 36) * 30, s.homeZone);
        vehicle.leaseMileageCap = (quote.months ?? 36) / 12 * 12000;
      }

      if (quote.monthlyPayment && p.acquisition === 'leased') {
        createBill(s, {
          payerId: player.id,
          name: `Lease — ${model.make} ${model.name}`,
          category: 'transport',
          amount: quote.monthlyPayment,
          frequency: 'monthly',
          firstDueAt: addDays(s.now, 30, s.homeZone),
          autopayAccountId: accountId,
          refType: 'vehicle', refId: vehicle.id,
          endsAt: vehicle.leaseEndsAt,
        });
      }

      // Delivered cars are theirs until they arrive; collected cars get any
      // agreed work done before the keys change hands.
      let deliveryDueAt: number | undefined;
      const dealerName = deal ? (placesIn(listing.locationId).find((pl) => pl.id === deal.dealerPlaceId)?.name ?? listing.dealerName) : listing.dealerName;
      if (deal?.terms.delivery === 'deliver') {
        const rng = s.rng('delivery', deal.id);
        deliveryDueAt = addDays(s.now, rng.int(2, 5), s.homeZone);
        vehicle.deliveryDueAt = deliveryDueAt;
        vehicle.locationId = listing.locationId;
        s.schedule({
          at: deliveryDueAt, kind: 'deal.delivery',
          label: `Delivery — ${listing.year} ${model.make} ${model.name}`,
          category: 'vehicles', payload: { vehicleId: vehicle.id, dealId: deal.id }, priority: 60,
          refType: 'vehicle', refId: vehicle.id, locationId: listing.locationId,
        });
      } else if (deal && deal.terms.repairs.length > 0) {
        applyDealerRepairs(s, vehicle, deal.terms.repairs, dealerName);
      }

      listing.status = 'sold';
      s.emit('vehicle.purchased', {
        vehicleId: vehicle.id, ownerId: player.id, price, total: quote.cashDue,
        acquisition: p.acquisition, locationId: player.currentLocationId, dealId: deal?.id,
      });
      s.remember({
        category: 'vehicle',
        title: `Bought a ${listing.year} ${model.make} ${model.name}`,
        detail: `${trim.name}, ${listing.condition}, ${listing.mileage.toLocaleString('en-US')} miles. ${formatMoney(price)}${p.acquisition === 'financed' ? ' financed' : p.acquisition === 'leased' ? ' leased' : ' in cash'}${deal ? ` from ${dealerName}` : ''}${tradeIn ? `, trading in the ${tradeIn.year} ${tradeIn.make} ${tradeIn.model}` : ''}.`,
        refs: [{ type: 'vehicle', id: vehicle.id }],
        significance: 55, public: false, amount: price,
      });
      return { vehicleId: vehicle.id, paid: quote.cashDue, monthlyPayment: quote.monthlyPayment, deliveryDueAt };
    },
  );

  sim.onCommand<{ vehicleId: Id; accountId?: Id }, { proceeds: Money }>(
    'veh.sell',
    (p, { sim: s }) => {
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!vehicle || vehicle.soldAt) throw new CommandError('You do not own that vehicle.');
      requireInHand(vehicle);
      if (vehicle.acquisition === 'leased') throw new CommandError('You cannot sell a leased vehicle. Return it at the end of the term.');

      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to receive the proceeds.');

      const rng = s.rng('sell_vehicle', vehicle.id);
      const proceeds = Math.round(vehicle.currentValue * rng.float(0.88, 1.02));

      // Settle any outstanding finance first.
      let net = proceeds;
      if (vehicle.loanAccountId) {
        const loan = s.ledger.tryAccount(vehicle.loanAccountId);
        const owed = loan ? Math.max(0, -loan.balance) : 0;
        if (owed > 0) {
          const payoff = Math.min(owed, proceeds);
          s.post({
            memo: `Loan payoff — ${vehicle.make} ${vehicle.model}`,
            category: 'transport',
            postings: [
              { accountId: vehicle.loanAccountId, amount: payoff },
              { accountId: s.nominalAccount('income', 'Vehicle sale').id, amount: -payoff },
            ],
            refType: 'vehicle', refId: vehicle.id,
          });
          net = proceeds - payoff;
          if (loan && Math.max(0, -loan.balance) === 0) loan.closedAt = s.now;
          if (owed > proceeds) {
            throw new CommandError(
              `You owe ${formatMoney(owed)} on this car and it is only worth ${formatMoney(proceeds)}. You would have to bring ${formatMoney(owed - proceeds)} to close it out.`,
            );
          }
        }
      }
      if (net > 0) s.income(accountId, net, `Sold ${vehicle.year} ${vehicle.make} ${vehicle.model}`, 'transport', { refType: 'vehicle', refId: vehicle.id });

      vehicle.soldAt = s.now;
      s.timeline.cancelFor('vehicle', vehicle.id, s.now);
      for (const bill of Object.values(s.universe.bills)) {
        if (bill.refType === 'vehicle' && bill.refId === vehicle.id) bill.active = false;
      }

      s.emit('vehicle.sold', { vehicleId: vehicle.id, proceeds, net });
      s.remember({
        category: 'vehicle',
        title: `Sold the ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        detail: `${formatMoney(proceeds)} at ${vehicle.mileage.toLocaleString('en-US')} miles.`,
        refs: [{ type: 'vehicle', id: vehicle.id }],
        significance: 35, public: false, amount: proceeds,
      });
      return { proceeds: net };
    },
  );

  // --- Modification --------------------------------------------------------

  sim.onCommand<{ vehicleId: Id; partIds: string[]; accountId?: Id; scheduledAt?: number }, { scheduledItemId: Id; cost: Money; warnings: string[] }>(
    'veh.book_modification',
    (p, { sim: s }) => {
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!vehicle || vehicle.soldAt) throw new CommandError('You do not own that vehicle.');
      requireInHand(vehicle);
      if (vehicle.acquisition === 'leased') throw new CommandError('You cannot modify a leased vehicle.');
      if (p.partIds.length === 0) throw new CommandError('Choose at least one part.');

      const subject = fitmentSubject(s, vehicle);
      const warnings: string[] = [];
      let cost = 0;
      const col = costOfLiving(s.player.currentLocationId);

      // Validate the whole basket, in order, so prerequisites within the basket count.
      const provisional = [...subject.installedCategories];
      for (const partId of p.partIds) {
        const part = PARTS.get(partId);
        if (!part) throw new CommandError(`Unknown part: ${partId}`);
        const verdict = checkFitment(part, { ...subject, installedCategories: provisional });
        if (!verdict.fits) throw new CommandError(verdict.reasons.join(' '));
        warnings.push(...verdict.warnings.map((w) => `${part.name}: ${w}`));
        provisional.push(part.category);
        cost += part.price + Math.round(part.labourHours * 165_00 * col);
      }

      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`That work comes to ${formatMoney(cost)} with labour and you cannot cover it.`);
      }

      const at = p.scheduledAt ?? addDays(s.now, 4, s.homeZone);
      const totalLabour = p.partIds.reduce((sum, id) => sum + (PARTS.get(id)?.labourHours ?? 0), 0);
      const item = s.schedule({
        at,
        kind: 'veh.install_parts',
        label: `Shop Appointment — ${vehicle.make} ${vehicle.model}`,
        category: 'vehicles',
        payload: { vehicleId: vehicle.id, partIds: p.partIds },
        priority: 55,
        refType: 'vehicle', refId: vehicle.id,
        requiresPlayer: true,
        locationId: s.player.currentLocationId,
        durationMinutes: Math.min(480, Math.round(totalLabour * 60)),
      });

      s.expense(accountId, cost, `Modification — ${vehicle.make} ${vehicle.model}`, 'transport', { refType: 'vehicle', refId: vehicle.id });
      s.emit('vehicle.modification_booked', { vehicleId: vehicle.id, partIds: p.partIds, cost, at });
      return { scheduledItemId: item.id, cost, warnings };
    },
  );

  sim.onCommand<{ vehicleId: Id; modificationId: Id; accountId?: Id }, { removed: boolean }>(
    'veh.remove_modification',
    (p, { sim: s }) => {
      const mod = s.universe.vehicleModifications[p.modificationId];
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!mod || !vehicle || mod.vehicleId !== vehicle.id || mod.removedAt) throw new CommandError('That modification is not fitted.');

      // Anything depending on it has to come off first.
      const remaining = vehicle.currentConfiguration.modificationIds
        .filter((id) => id !== mod.id)
        .map((id) => s.universe.vehicleModifications[id])
        .filter(Boolean) as VehicleModification[];
      const category = PARTS.get(mod.partCatalogId)?.category;
      for (const other of remaining) {
        const otherPart = PARTS.get(other.partCatalogId);
        if (category && otherPart?.requires.includes(category)) {
          throw new CommandError(`${otherPart.name} depends on the ${category.replace(/_/g, ' ')}. Remove that first.`);
        }
      }

      const accountId = p.accountId ?? s.player.primaryAccountId;
      const labour = Math.round((PARTS.get(mod.partCatalogId)?.labourHours ?? 1) * 0.6 * 165_00);
      if (accountId && s.ledger.availableFunds(accountId) >= labour) {
        s.expense(accountId, labour, `Removal — ${mod.name}`, 'transport', { refType: 'vehicle', refId: vehicle.id });
      }

      mod.removedAt = s.now;
      vehicle.currentConfiguration.modificationIds = vehicle.currentConfiguration.modificationIds.filter((id) => id !== mod.id);
      recomputeVehicleSpecs(s, vehicle.id);
      s.emit('vehicle.modification_removed', { vehicleId: vehicle.id, modificationId: mod.id });
      return { removed: true };
    },
  );

  // --- Service -------------------------------------------------------------

  sim.onCommand<{ vehicleId: Id; kind: ServiceRecord['kind']; description?: string; at?: number }, { scheduledItemId: Id; estimate: Money }>(
    'veh.book_service',
    (p, { sim: s }) => {
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!vehicle || vehicle.soldAt) throw new CommandError('You do not own that vehicle.');
      requireInHand(vehicle);
      const estimate = serviceEstimate(s, vehicle, p.kind);
      const at = p.at ?? addDays(s.now, 3, s.homeZone);
      const item = s.schedule({
        at,
        kind: 'veh.service_appointment',
        label: `${serviceLabel(p.kind)} — ${vehicle.make} ${vehicle.model}`,
        category: 'vehicles',
        payload: { vehicleId: vehicle.id, kind: p.kind, description: p.description ?? serviceLabel(p.kind) },
        priority: 58,
        refType: 'vehicle', refId: vehicle.id,
        requiresPlayer: true,
        durationMinutes: p.kind === 'bodywork' ? 480 : 150,
      });
      return { scheduledItemId: item.id, estimate };
    },
  );

  sim.onCommand<{ vehicleId: Id; miles: number }, { mileage: number; serviceDue: boolean }>(
    'veh.drive',
    (p, { sim: s }) => {
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!vehicle || vehicle.soldAt) throw new CommandError('You do not own that vehicle.');
      requireInHand(vehicle);
      if (!roadworthy(vehicle)) throw new CommandError(NOT_FOR_THE_ROAD);
      addMileage(s, vehicle, p.miles);
      const serviceDue = vehicle.mileage >= vehicle.nextServiceDueMileage;
      return { mileage: vehicle.mileage, serviceDue };
    },
  );

  // --- A boat, out ---------------------------------------------------------

  sim.onCommand<{ vehicleId: Id; hours: number; accountId?: Id }, { hours: number; cost: Money; serviceDue: boolean }>(
    'veh.cruise',
    (p, { sim: s }) => {
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!vehicle || vehicle.soldAt) throw new CommandError('You do not own that vehicle.');
      requireInHand(vehicle);
      if (vehicleKind(vehicle) !== 'boat') throw new CommandError(NOT_A_BOAT);
      const player = s.player;
      if ((vehicle.locationId ?? player.currentLocationId) !== player.currentLocationId) throw new CommandError('The boat is in another city.');
      const hours = clamp(Math.round(p.hours), 1, MAX_CRUISE_HOURS);
      if (player.wellbeing.energy < 12) throw new CommandError('You are too tired to take a boat out today.');
      const weather = weatherAt(s, player.currentLocationId);
      if (weather && (weather.precipitation === 'storm' || weather.windKph > 50)) throw new CommandError(ROUGH_WATER);

      // A trailered boat is launched at the ramp for a fee and the time it
      // takes; a dry-stacked one is put in by the yard while you park.
      const trailered = vehicle.keeping?.kind === 'trailer';
      const stacked = vehicle.keeping?.kind === 'dry_stack';
      const ramp = trailered ? Math.round(RAMP_FEE * costOfLiving(player.currentLocationId)) : 0;
      const cost = hourlyCostOf(s, vehicle) * hours + ramp;
      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (cost > 0 && s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`${hours} hour${hours === 1 ? '' : 's'} on the water is about ${formatMoney(cost)} in fuel${ramp > 0 ? ' and the ramp' : ''} and you cannot cover it.`);
      }
      if (ramp > 0) s.expense(accountId, ramp, `Launch ramp — ${vehicle.make} ${vehicle.model}`, 'transport', { refType: 'vehicle', refId: vehicle.id });
      if (cost - ramp > 0) s.expense(accountId, cost - ramp, `Fuel — ${vehicle.make} ${vehicle.model}`, 'transport', { refType: 'vehicle', refId: vehicle.id });

      if (trailered) s.advanceTo(s.now + RAMP_MINUTES * 60 * 1000);
      if (stacked) s.advanceTo(s.now + 30 * 60 * 1000);
      s.advanceTo(s.now + hours * 60 * 60 * 1000);
      const rough = weather ? weather.windKph > 30 || weather.precipitation === 'rain' : false;
      player.wellbeing.energy = clamp(player.wellbeing.energy - hours * (rough ? 4 : 2.5), 0, 100);
      player.wellbeing.stress = clamp(player.wellbeing.stress - hours * (rough ? 1 : 2.5), 0, 100);
      player.wellbeing.morale = clamp(player.wellbeing.morale + Math.min(10, hours * 1.5), 0, 100);
      addMileage(s, vehicle, hours);
      s.emit('vehicle.cruised', { vehicleId: vehicle.id, hours, cost, rough, ramp });
      s.remember({
        category: 'vehicle',
        title: `${hours} Hour${hours === 1 ? '' : 's'} On The ${vehicle.make} ${vehicle.model}`,
        detail: rough ? 'Rough going. Worth it anyway.' : weather ? `${weather.condition}, ${weather.temperature} degrees.` : 'Out and back.',
        refs: [{ type: 'vehicle', id: vehicle.id }], significance: 18, public: false, amount: cost,
      });
      return { hours: vehicle.mileage, cost, serviceDue: vehicle.mileage >= vehicle.nextServiceDueMileage };
    },
  );

  // --- A name on the side ------------------------------------------------------

  sim.onCommand<{ vehicleId: Id; name: string | null }, { name?: string }>(
    'veh.name',
    (p, { sim: s }) => {
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!vehicle || vehicle.soldAt || vehicle.ownerId !== s.player.id) throw new CommandError('You do not own that vehicle.');
      if (p.name === null || p.name.trim() === '') {
        vehicle.nickname = undefined;
        return {};
      }
      const name = p.name.replace(/\s+/g, ' ').trim();
      if (name.length > NAME_MAX) throw new CommandError(`A name is at most ${NAME_MAX} characters.`);
      if (!/^[\p{L}\p{N}][\p{L}\p{N} .'&-]*$/u.test(name)) throw new CommandError('Letters, numbers, spaces and a little punctuation.');
      vehicle.nickname = name;
      s.emit('vehicle.named', { vehicleId: vehicle.id, name });
      s.remember({
        category: 'vehicle', title: `Named The ${vehicle.make} ${vehicle.model} ${name}`,
        detail: vehicleKind(vehicle) === 'jet' ? 'On the tail from the next repaint; on the manifest from today.' : vehicleKind(vehicle) === 'boat' ? 'On the transom, in the harbourmaster\'s book.' : 'What you call it, anyway.',
        refs: [{ type: 'vehicle', id: vehicle.id }], significance: 10, public: false,
      });
      return { name };
    },
  );
}

/**
 * A crewed yacht and any aircraft need people on retainer whether or not
 * they move. The bill starts a month out, ends when the thing is sold, and is
 * only ever created once. Where the thing is kept is the keeping system's bill.
 */
export function ensureCrew(sim: Simulation, vehicle: Vehicle, accountId: Id): void {
  if (vehicle.soldAt || vehicle.crewBillId) return;
  const amount = crewFor(sim, vehicle);
  if (amount <= 0) return;
  const bill = createBill(sim, {
    payerId: vehicle.ownerId,
    name: `Crew — ${vehicle.make} ${vehicle.model}`,
    category: 'transport',
    amount,
    frequency: 'monthly',
    firstDueAt: addDays(sim.now, 30, sim.homeZone),
    autopayAccountId: accountId,
    refType: 'vehicle', refId: vehicle.id,
  });
  vehicle.crewBillId = bill.id;
}

/** One line of a vehicle's name: what its owner calls it, or what it is. */
export function displayName(vehicle: Pick<Vehicle, 'nickname' | 'year' | 'make' | 'model'>): string {
  return vehicle.nickname?.trim() || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

export function fitmentSubject(sim: Simulation, vehicle: Vehicle): FitmentSubject {
  const installed = vehicle.currentConfiguration.modificationIds
    .map((id) => sim.universe.vehicleModifications[id])
    .filter((m): m is VehicleModification => Boolean(m) && !m?.removedAt)
    .map((m) => PARTS.get(m.partCatalogId)?.category)
    .filter((c): c is PartCategory => Boolean(c));

  const model = VEHICLE_MODELS.get(vehicle.catalogId);
  return {
    kind: vehicleKind(vehicle),
    modelId: vehicle.catalogId,
    make: vehicle.make,
    year: vehicle.year,
    trimId: vehicle.trim,
    powertrain: vehicle.powertrain as Powertrain,
    bodyStyle: (model?.bodyStyle ?? 'sedan') as BodyStyle,
    installedCategories: installed,
  };
}

export function availableParts(sim: Simulation, vehicleId: Id, category?: PartCategory) {
  const vehicle = sim.universe.vehicles[vehicleId];
  if (!vehicle) return [];
  const subject = fitmentSubject(sim, vehicle);
  return partsFor(subject, category).map((part) => ({ part, verdict: checkFitment(part, subject) }));
}

export function createVehicle(
  sim: Simulation,
  spec: {
    ownerId: Id; modelId: string; trimId: string; year: number; mileage: number;
    configuration: VehicleConfiguration; purchasePrice: Money;
    acquisition: Vehicle['acquisition']; loanAccountId?: Id; condition: number;
    ownerKind?: 'person' | 'company';
  },
): Vehicle {
  const model = VEHICLE_MODELS.require(spec.modelId);
  const trim = trimOf(spec.modelId, spec.trimId);
  if (!trim) throw new CommandError('Unknown trim.');
  const owner = sim.universe.people[spec.ownerId];
  const cityId = owner?.currentLocationId ?? 'us-ca-losangeles';
  const fees = vehicleFees(cityId, sim.now);

  const factory: VehicleConfiguration = {
    paint: spec.configuration.paint,
    wheels: spec.configuration.wheels,
    interior: spec.configuration.interior,
    options: [...spec.configuration.options],
    modificationIds: [],
  };

  const profile = KIND_PROFILE[model.kind];
  const vehicle: Vehicle = {
    id: sim.nextId('veh'),
    saveId: sim.universe.meta.id,
    ownerId: spec.ownerId,
    ownerKind: spec.ownerKind ?? 'person',
    kind: model.kind,
    locationId: cityId,
    catalogId: model.id,
    make: model.make,
    model: model.name,
    year: spec.year,
    trim: spec.trimId,
    bodyStyle: model.bodyStyle,
    powertrain: trim.powertrain,
    vin: `SL${sim.counter('vin').toString(36).toUpperCase().padStart(6, '0')}${spec.year}`,
    factoryConfiguration: factory,
    currentConfiguration: { ...factory, options: [...factory.options], modificationIds: [] },
    mileage: spec.mileage,
    condition: spec.condition,
    mechanicalHealth: clamp(spec.condition + 4, 0, 100),
    purchasePrice: spec.purchasePrice,
    currentValue: spec.purchasePrice,
    purchasedAt: sim.now,
    acquisition: spec.acquisition,
    loanAccountId: spec.loanAccountId,
    registeredIn: cityId,
    registrationExpiresAt: addYears(sim.now, 1, sim.homeZone),
    warranty: {
      bumperToBumperUntil: spec.mileage < 1000 ? addYears(sim.now, 4, sim.homeZone) : undefined,
      powertrainUntil: spec.mileage < 1000 ? addYears(sim.now, 6, sim.homeZone) : undefined,
      voided: false,
    },
    serviceRecordIds: [],
    nextServiceDueMileage: spec.mileage + profile.serviceInterval,
    efficiency: trim.efficiency,
    horsepower: trim.horsepower,
    zeroToSixty: trim.zeroToSixty,
    storedAtPropertyId: owner?.residenceId,
  };
  sim.universe.vehicles[vehicle.id] = vehicle;

  sim.schedule({
    at: vehicle.registrationExpiresAt,
    kind: 'veh.registration_due',
    label: `${profile.document} Renewal — ${vehicle.make} ${vehicle.model}`,
    category: 'vehicles',
    payload: { vehicleId: vehicle.id },
    priority: 62,
    refType: 'vehicle', refId: vehicle.id,
  });

  void fees;
  return vehicle;
}

function installParts(sim: Simulation, vehicleId: Id, partIds: string[]): void {
  const vehicle = sim.universe.vehicles[vehicleId];
  if (!vehicle || vehicle.soldAt) return;
  const col = costOfLiving(sim.player.currentLocationId);

  for (const partId of partIds) {
    const part = PARTS.get(partId);
    if (!part) continue;
    const subject = fitmentSubject(sim, vehicle);
    const verdict = checkFitment(part, subject);
    if (!verdict.fits) {
      sim.notify({
        category: 'vehicles',
        title: `${part.name} Could Not Be Fitted`,
        body: verdict.reasons.join(' '),
        importance: 60, route: '/workspace/vehicles',
      });
      continue;
    }

    const mod: VehicleModification = {
      id: sim.nextId('vehmod'),
      saveId: sim.universe.meta.id,
      vehicleId: vehicle.id,
      partCatalogId: part.id,
      name: part.name,
      category: part.category,
      cost: part.price,
      labourCost: Math.round(part.labourHours * 165_00 * col),
      installedAt: sim.now,
      effects: {
        horsepower: part.effects.horsepower,
        zeroToSixty: part.effects.zeroToSixty,
        efficiency: part.effects.efficiency,
        valueDelta: part.effects.valueDelta,
        condition: part.effects.condition,
      },
      streetLegal: part.streetLegal,
      voidsWarranty: part.voidsWarranty,
      insuranceDisclosed: false,
    };
    sim.universe.vehicleModifications[mod.id] = mod;
    vehicle.currentConfiguration.modificationIds.push(mod.id);

    if (part.voidsWarranty && !vehicle.warranty.voided) {
      vehicle.warranty.voided = true;
      vehicle.warranty.voidReason = `${part.name} fitted on ${new Date(sim.now).toISOString().slice(0, 10)}.`;
      sim.notify({
        category: 'vehicles',
        title: 'Warranty Voided',
        body: `Fitting ${part.name} voids the manufacturer warranty on the ${vehicle.make} ${vehicle.model}.`,
        importance: 58, route: '/workspace/vehicles',
      });
    }
    if (!part.streetLegal) {
      sim.requireDecision({
        urgency: 55, category: 'vehicles',
        title: `${vehicle.make} ${vehicle.model} Is Not Road Legal`,
        detail: `${part.name} is not street legal where the car is registered. It will fail inspection and can be cited.`,
        route: '/workspace/vehicles',
        refType: 'vehicle', refId: vehicle.id,
      });
    }
    if (part.insuranceRelevant) {
      const policy = vehicle.insurancePolicyId ? sim.universe.insurancePolicies[vehicle.insurancePolicyId] : undefined;
      if (policy) {
        sim.requireDecision({
          urgency: 48, category: 'vehicles',
          title: `Tell Your Insurer About ${part.name}`,
          detail: 'An undisclosed modification is grounds for a denied claim.',
          route: '/workspace/insurance',
          refType: 'vehicle', refId: vehicle.id,
        });
      }
    }
    sim.emit('vehicle.modified', { vehicleId: vehicle.id, modificationId: mod.id, partId: part.id, category: part.category });
  }

  recomputeVehicleSpecs(sim, vehicle.id);
  sim.remember({
    category: 'vehicle',
    title: `Modified the ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    detail: partIds.map((id) => PARTS.get(id)?.name ?? id).join(', '),
    refs: [{ type: 'vehicle', id: vehicle.id }],
    significance: 25, public: false,
  });
}

export function recomputeVehicleSpecs(sim: Simulation, vehicleId: Id): void {
  const vehicle = sim.universe.vehicles[vehicleId];
  if (!vehicle) return;
  const trim = trimOf(vehicle.catalogId, vehicle.trim);
  if (!trim) return;

  let hp = trim.horsepower;
  let zeroSixty = trim.zeroToSixty;
  let efficiency = trim.efficiency;

  for (const optionId of vehicle.currentConfiguration.options) {
    const option = FACTORY_OPTIONS.get(optionId);
    if (!option) continue;
    hp += option.effects.horsepower ?? 0;
    zeroSixty += option.effects.zeroToSixty ?? 0;
    efficiency += option.effects.efficiency ?? 0;
  }

  for (const modId of vehicle.currentConfiguration.modificationIds) {
    const mod = sim.universe.vehicleModifications[modId];
    if (!mod || mod.removedAt) continue;
    hp += mod.effects.horsepower ?? 0;
    zeroSixty += mod.effects.zeroToSixty ?? 0;
    efficiency += mod.effects.efficiency ?? 0;
    if (mod.effects.condition) vehicle.condition = clamp(vehicle.condition + mod.effects.condition, 0, 100);
  }

  vehicle.horsepower = Math.round(hp);
  vehicle.zeroToSixty = Math.max(1.5, Number(zeroSixty.toFixed(2)));
  vehicle.efficiency = Math.max(4, Math.round(efficiency));
  revalue(sim, vehicle);
}

/** Market value from age, mileage, condition and what has been done to it. */
export function revalue(sim: Simulation, vehicle: Vehicle): Money {
  const model = VEHICLE_MODELS.get(vehicle.catalogId);
  const trim = trimOf(vehicle.catalogId, vehicle.trim);
  if (!model || !trim) return vehicle.currentValue;

  const ageYears = Math.max(0, (sim.now - Date.UTC(vehicle.year, 0, 1)) / (365.25 * MS_DAY));
  const collector = model.collectorAfterYears !== undefined && ageYears > model.collectorAfterYears;

  let value = trim.msrp;
  if (collector) {
    const depreciated = trim.msrp * Math.pow(1 - model.depreciationRate, model.collectorAfterYears ?? 15);
    const appreciationYears = ageYears - (model.collectorAfterYears ?? 15);
    value = depreciated * Math.pow(1.045, appreciationYears);
  } else {
    value = trim.msrp * Math.pow(1 - model.depreciationRate, ageYears);
  }

  // Use and condition, in whatever this kind counts.
  const profile = profileOf(vehicle);
  const expectedUse = ageYears * profile.expectedPerYear;
  const mileageFactor = clamp(1 - (vehicle.mileage - expectedUse) / profile.useSpan, 0.55, 1.22);
  const conditionFactor = remap(vehicle.condition, 0, 100, 0.42, 1.08);

  value *= mileageFactor * conditionFactor;

  // Options recover part of their cost; modifications mostly do not.
  for (const optionId of vehicle.factoryConfiguration.options) {
    const option = FACTORY_OPTIONS.get(optionId);
    if (option) value += option.price * (option.effects.valueRetention ?? 0.2) * Math.pow(0.9, ageYears);
  }
  for (const modId of vehicle.currentConfiguration.modificationIds) {
    const mod = sim.universe.vehicleModifications[modId];
    if (!mod || mod.removedAt) continue;
    const part = PARTS.get(mod.partCatalogId);
    value += (part?.effects.valueRecovery ?? 0) * mod.cost;
    value += mod.effects.valueDelta ?? 0;
    if (!mod.streetLegal) value *= 0.92;
  }

  if (vehicle.warranty.voided && ageYears < 5) value *= 0.94;

  vehicle.currentValue = Math.max(50_000, Math.round(value));
  return vehicle.currentValue;
}

/** Use, in whatever this kind counts: miles on the road, hours on the water or in the air. */
export function addMileage(sim: Simulation, vehicle: Vehicle, miles: number): void {
  const profile = profileOf(vehicle);
  vehicle.mileage += Math.max(0, Math.round(miles));
  vehicle.mechanicalHealth = clamp(vehicle.mechanicalHealth - miles / profile.wearDivisor, 0, 100);
  vehicle.condition = clamp(vehicle.condition - miles / profile.conditionDivisor, 0, 100);

  if (vehicle.mileage >= vehicle.nextServiceDueMileage) {
    sim.requireDecision({
      urgency: vehicle.mechanicalHealth < 55 ? 72 : 45,
      category: 'vehicles',
      title: `${vehicle.make} ${vehicle.model} Is Due For Service`,
      detail: `${vehicle.mileage.toLocaleString('en-US')} ${profile.unit}. Skipping it costs more later.`,
      route: '/workspace/vehicles',
      actions: [{ label: 'Book Service', commandKind: 'veh.book_service', payload: { vehicleId: vehicle.id, kind: 'scheduled' } }],
      refType: 'vehicle', refId: vehicle.id,
    });
  }
  if (vehicle.leaseMileageCap && vehicle.mileage - 0 > vehicle.leaseMileageCap) {
    sim.notify({
      category: 'vehicles', title: 'Over The Lease Mileage Cap',
      body: `You are past the allowance on the ${vehicle.make} ${vehicle.model}. Overage is charged per mile at return.`,
      importance: 55, route: '/workspace/vehicles',
    });
  }
  revalue(sim, vehicle);
}

function serviceLabel(kind: ServiceRecord['kind']): string {
  const labels: Record<ServiceRecord['kind'], string> = {
    scheduled: 'Scheduled Service', repair: 'Repair', recall: 'Recall Work',
    inspection: 'Inspection', tires: 'Tires', detail: 'Detailing',
    bodywork: 'Body And Paint', warranty: 'Warranty Service',
  };
  return labels[kind];
}

export function serviceEstimate(sim: Simulation, vehicle: Vehicle, kind: ServiceRecord['kind']): Money {
  const model = VEHICLE_MODELS.get(vehicle.catalogId);
  const index = model?.maintenanceCostIndex ?? 1;
  const col = costOfLiving(sim.player.currentLocationId);
  const base: Record<ServiceRecord['kind'], number> = {
    scheduled: 420_00, repair: 1_250_00, recall: 0, inspection: 95_00,
    tires: 1_450_00, detail: 340_00, bodywork: 3_800_00, warranty: 0,
  };
  const healthPenalty = kind === 'repair' ? remap(vehicle.mechanicalHealth, 100, 0, 1, 3.2) : 1;
  return Math.round((base[kind] ?? 400_00) * index * col * healthPenalty * profileOf(vehicle).serviceCostIndex);
}

function performService(sim: Simulation, vehicleId: Id, kind: ServiceRecord['kind'], description: string): void {
  const vehicle = sim.universe.vehicles[vehicleId];
  if (!vehicle || vehicle.soldAt) return;
  const accountId = sim.player.primaryAccountId;

  const underWarranty = !vehicle.warranty.voided && (
    (kind === 'repair' && (vehicle.warranty.bumperToBumperUntil ?? 0) > sim.now) ||
    kind === 'recall' || kind === 'warranty'
  );
  const cost = underWarranty ? 0 : serviceEstimate(sim, vehicle, kind);

  if (cost > 0) {
    if (!accountId || sim.ledger.availableFunds(accountId) < cost) {
      sim.requireDecision({
        urgency: 76, category: 'vehicles',
        title: `Cannot Pay For ${serviceLabel(kind)}`,
        detail: `The shop quoted ${formatMoney(cost)} on the ${vehicle.make} ${vehicle.model}. The work has not been done.`,
        route: '/workspace/vehicles',
        refType: 'vehicle', refId: vehicle.id,
      });
      return;
    }
    sim.expense(accountId, cost, `${serviceLabel(kind)} — ${vehicle.make} ${vehicle.model}`, 'transport', { refType: 'vehicle', refId: vehicle.id });
  }

  const healthDelta = kind === 'scheduled' ? 14 : kind === 'repair' ? 32 : kind === 'tires' ? 8 : kind === 'bodywork' ? 4 : 3;
  const record: ServiceRecord = {
    id: sim.nextId('service'),
    saveId: sim.universe.meta.id,
    vehicleId: vehicle.id,
    kind,
    description,
    mileage: vehicle.mileage,
    cost,
    coveredByWarranty: underWarranty,
    performedAt: sim.now,
    shopName: underWarranty ? `${vehicle.make} Dealer Service` : shopFor(vehicleKind(vehicle)),
    healthDelta,
  };
  sim.universe.serviceRecords[record.id] = record;
  vehicle.serviceRecordIds.push(record.id);

  vehicle.mechanicalHealth = clamp(vehicle.mechanicalHealth + healthDelta, 0, 100);
  if (kind === 'detail' || kind === 'bodywork') vehicle.condition = clamp(vehicle.condition + (kind === 'bodywork' ? 12 : 5), 0, 100);
  if (kind === 'scheduled') vehicle.nextServiceDueMileage = vehicle.mileage + profileOf(vehicle).serviceInterval;

  sim.resolveDecision('vehicle', vehicle.id, 'vehicles');
  revalue(sim, vehicle);
  sim.emit('vehicle.serviced', { vehicleId: vehicle.id, kind, cost, coveredByWarranty: underWarranty });
}

function renewRegistration(sim: Simulation, vehicleId: Id): void {
  const vehicle = sim.universe.vehicles[vehicleId];
  if (!vehicle || vehicle.soldAt) return;
  const fees = vehicleFees(vehicle.registeredIn, sim.now);
  const fee = Math.max(fees.registrationMinimum, applyRate(vehicle.currentValue, fees.registrationRate));
  const accountId = sim.player.primaryAccountId;

  const illegalMods = vehicle.currentConfiguration.modificationIds
    .map((id) => sim.universe.vehicleModifications[id])
    .filter((m) => m && !m.removedAt && !m.streetLegal);

  if (fees.inspectionRequired && illegalMods.length > 0) {
    sim.requireDecision({
      urgency: 74, category: 'vehicles',
      title: `${vehicle.make} ${vehicle.model} Failed Inspection`,
      detail: `${illegalMods.map((m) => m?.name).join(', ')} ${illegalMods.length === 1 ? 'is' : 'are'} not street legal here. Registration cannot be renewed until removed.`,
      route: '/workspace/vehicles',
      refType: 'vehicle', refId: vehicle.id,
    });
    return;
  }

  if (accountId && sim.ledger.availableFunds(accountId) >= fee) {
    sim.expense(accountId, fee, `Registration — ${vehicle.make} ${vehicle.model}`, 'transport', { refType: 'vehicle', refId: vehicle.id });
    vehicle.registrationExpiresAt = addYears(sim.now, 1, sim.homeZone);
    sim.schedule({
      at: vehicle.registrationExpiresAt, kind: 'veh.registration_due',
      label: `${profileOf(vehicle).document} Renewal — ${vehicle.make} ${vehicle.model}`,
      category: 'vehicles', payload: { vehicleId: vehicle.id }, priority: 62,
      refType: 'vehicle', refId: vehicle.id,
    });
  } else {
    sim.requireDecision({
      urgency: 66, category: 'vehicles',
      title: 'Registration Is Overdue',
      detail: `${formatMoney(fee)} is owed on the ${vehicle.make} ${vehicle.model}.`,
      route: '/workspace/vehicles',
      refType: 'vehicle', refId: vehicle.id,
    });
  }
}

function depreciateAll(sim: Simulation): void {
  let count = 0;
  for (const vehicle of Object.values(sim.universe.vehicles)) {
    if (vehicle.soldAt) continue;
    revalue(sim, vehicle);
    count += 1;
  }
  // The month's tick, for anything that wears or charges by the month standing still.
  sim.emit('vehicle.revalued', { count });
}

/** Where the work gets done, by what it is. SLATE's own shops. */
function shopFor(kind: VehicleKind): string {
  return kind === 'boat' ? 'Harbour Yard' : kind === 'jet' ? 'Meridian Aero Services' : 'Meridian Auto Works';
}

/** How many of each kind a city's lots carry per fortnight. */
const STOCK_RANGE: Readonly<Record<VehicleKind, [number, number]>> = { car: [12, 20], motorcycle: [4, 7], boat: [3, 5], jet: [1, 3] };

/** The colours, wheels and interiors a lot describes its stock with, by kind. */
const STOCK_LOOKS: Readonly<Record<VehicleKind, { paint: string[]; wheels: string[]; interior: string[] }>> = {
  car: {
    paint: ['Obsidian Black', 'Glacier White', 'Nardo Grey', 'Racing Blue', 'Signal Red', 'Forest Green', 'Champagne'],
    wheels: ['18" Alloy', '19" Alloy', '20" Forged', '21" Split-Spoke', '22" Polished'],
    interior: ['Black Leather', 'Tan Leather', 'Grey Cloth', 'Cream Nappa', 'Red Nappa', 'Alcantara'],
  },
  motorcycle: {
    paint: ['Gloss Black', 'Ducati Red', 'Racing Blue', 'Matte Grey', 'British Racing Green', 'Vivid Orange', 'Pearl White'],
    wheels: ['Cast Alloy', 'Spoked', 'Forged Alloy', 'Carbon'],
    interior: ['Stock Saddle', 'Comfort Saddle', 'Brown Leather Saddle', 'Alcantara Saddle'],
  },
  boat: {
    paint: ['White Hull', 'Navy Hull', 'Black Hull', 'Seafoam Hull', 'Whaler Blue Hull', 'Mahogany Hull', 'Grey Hull'],
    wheels: ['Single Outboard', 'Twin Outboards', 'Triple Outboards', 'Sterndrive', 'Twin Inboards', 'Twin Shaft Diesels', 'Sails And Diesel'],
    interior: ['White Vinyl', 'Grey Vinyl', 'Teak And Cream', 'Navy And Teak', 'Ivory Leather', 'Walnut And Ivory'],
  },
  jet: {
    paint: ['White With Blue Stripe', 'White With Silver Stripe', 'Matte Grey', 'Pearl White', 'Charcoal With Gold Line', 'White With Red Cheatline'],
    wheels: ['Standard Gear', 'Standard Gear', 'Standard Gear'],
    interior: ['Cream Leather', 'Tan Leather And Walnut', 'Grey Leather And Carbon', 'Ivory And Gloss Ebony', 'Cognac Leather'],
  },
};

export function refreshInventory(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const cityId = player.currentLocationId;

  // A fortnight's stock is seeded by the fortnight, so refreshing twice in
  // the same one would list the same cars twice. This fortnight's unsold
  // stock here is replaced, except anything somebody is at the table over.
  const bucket = Math.floor(sim.now / (14 * MS_DAY));
  const held = new Set(Object.values(sim.universe.vehicleDeals).filter((d) => d.status === 'open' || d.status === 'agreed').map((d) => d.listingId));
  for (const [id, listing] of Object.entries(sim.universe.vehicleListings)) {
    if (listing.status !== 'active' || sim.now - listing.listedAt > 60 * MS_DAY) { delete sim.universe.vehicleListings[id]; continue; }
    if (listing.locationId === cityId && Math.floor(listing.listedAt / (14 * MS_DAY)) === bucket && !held.has(id)) delete sim.universe.vehicleListings[id];
  }

  const rng = sim.rng('vehicle_inventory', cityId, bucket);
  let total = 0;
  for (const kind of ['car', 'motorcycle', 'boat', 'jet'] as const) {
    if (!dealerPlaceFor(cityId, 'new', kind)) continue;
    total += stockLot(sim, cityId, kind, rng);
  }
  // The car somebody is at the table over was regenerated too, identically;
  // the fresh copy goes, the one on the table stays.
  const keyOf = (l: VehicleListing) => `${l.catalogId}|${l.year}|${l.mileage}|${l.price}|${l.configuration.paint}|${l.configuration.interior}`;
  const heldKeys = new Set([...held].map((id) => sim.universe.vehicleListings[id]).filter((l): l is VehicleListing => Boolean(l)).map(keyOf));
  for (const [id, listing] of Object.entries(sim.universe.vehicleListings)) {
    if (listing.status === 'active' && listing.locationId === cityId && !held.has(id) && heldKeys.has(keyOf(listing))) {
      delete sim.universe.vehicleListings[id];
      total -= 1;
    }
  }
  sim.emit('veh.inventory_refreshed', { cityId, count: total });
}

/** One kind's fortnight of stock on its lot. Returns how many were listed. */
function stockLot(sim: Simulation, cityId: string, kind: VehicleKind, rng: ReturnType<Simulation['rng']>): number {
  const currentYear = new Date(sim.now).getUTCFullYear();
  const models = VEHICLE_MODELS.all().filter((m) => m.kind === kind);
  if (models.length === 0) return 0;
  const [low, high] = STOCK_RANGE[kind];
  const count = rng.int(low, high);
  const looks = STOCK_LOOKS[kind];

  for (let i = 0; i < count; i++) {
    const model = rng.weighted(models, (m) => {
      const mfg = MANUFACTURERS.get(m.parentId);
      return mfg?.segment === 'exotic' ? 3 : mfg?.segment === 'luxury' ? 10 : 24;
    });
    const trim = rng.pick(model.trims);
    const condition = rng.weighted(['new', 'used', 'certified', 'collector'] as const, (c) =>
      c === 'used' ? 45 : c === 'new' ? 30 : c === 'certified' ? 20 : model.collectorAfterYears ? 6 : 0,
    );

    const year = condition === 'new'
      ? currentYear
      : condition === 'collector'
        ? clamp(currentYear - rng.int(model.collectorAfterYears ?? 18, 32), model.years[0], currentYear)
        : clamp(currentYear - rng.int(1, 9), model.years[0], currentYear);

    const age = Math.max(0, currentYear - year);
    const perYear = KIND_PROFILE[kind].expectedPerYear;
    const mileage = condition === 'new'
      ? (kind === 'car' ? rng.int(3, 40) : kind === 'motorcycle' ? rng.int(1, 12) : rng.int(1, 8))
      : Math.round(age * perYear * rng.float(0.55, 1.35));

    let price = trim.msrp;
    if (condition !== 'new') {
      price = Math.round(trim.msrp * Math.pow(1 - model.depreciationRate, age) * rng.float(0.9, 1.08));
      if (condition === 'certified') price = Math.round(price * 1.07);
      if (condition === 'collector') price = Math.round(trim.msrp * Math.pow(1.04, age) * rng.float(0.85, 1.35));
    }
    price = Math.round(price * clamp(costOfLiving(cityId) * 0.35 + 0.65, 0.85, 1.25));

    const optionCount = rng.int(0, Math.min(4, trim.availableOptions.length));
    const options = rng.shuffle(trim.availableOptions).slice(0, optionCount);
    price += options.reduce((s, id) => s + (FACTORY_OPTIONS.get(id)?.price ?? 0), 0);

    const lot = dealerPlaceFor(cityId, condition, kind);
    const listing: VehicleListing = {
      id: sim.nextId('veh'),
      saveId: sim.universe.meta.id,
      kind,
      catalogId: `${model.id}:${trim.id}`,
      condition,
      year,
      mileage,
      price,
      locationId: cityId,
      dealerName: lot?.name ?? dealerName(model.parentId, condition),
      dealerPlaceId: lot?.id,
      configuration: {
        paint: rng.pick(looks.paint),
        wheels: rng.pick(looks.wheels),
        interior: rng.pick(looks.interior),
        options,
        modificationIds: [],
      },
      status: 'active',
      listedAt: sim.now,
      negotiationRoom: condition === 'new' ? rng.float(0.02, 0.06) : rng.float(0.04, 0.13),
    };
    sim.universe.vehicleListings[listing.id] = listing;
  }
  return count;
}

function dealerName(makeId: string, condition: string): string {
  const mfg = MANUFACTURERS.get(makeId);
  if (condition === 'new' || condition === 'certified') return `${mfg?.name ?? 'Auto'} of ${CITIES.all()[0]?.name ?? 'the city'}`.replace(/ of .*/, ' Downtown');
  if (condition === 'collector') return 'Meridian Classic Motors';
  return 'Crossroads Auto Sales';
}

function monthlyIncomeEstimate(sim: Simulation, personId: Id): Money {
  const from = sim.now - 180 * MS_DAY;
  const owned = new Set(sim.ledger.accountsOf(personId).map((a) => a.id));
  let total = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.at < from) continue;
    const delta = txn.postings.reduce((s, p) => (owned.has(p.accountId) ? s + p.amount : s), 0);
    if (delta > 0 && ['salary', 'contract', 'royalty', 'creator', 'sponsorship'].includes(txn.category)) total += delta;
  }
  return Math.round(total / 6);
}
