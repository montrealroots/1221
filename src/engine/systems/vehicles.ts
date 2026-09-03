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
  FACTORY_OPTIONS, MANUFACTURERS, PARTS, VEHICLE_MODELS, checkFitment, partsFor, trimOf,
  type BodyStyle, type FitmentSubject, type PartCategory, type Powertrain,
} from '../content/vehicles';
import { CITIES } from '../content/geography';
import { costOfLiving, vehicleFees } from '../content/tax';
import { createBill, amortisedPayment, offeredApr } from './finance';

const SERVICE_INTERVAL_MILES = 7_500;

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

  sim.onCommand<{ listingId: Id; acquisition: Vehicle['acquisition']; downPayment?: Money; termMonths?: number; accountId?: Id; negotiate?: boolean }, { vehicleId: Id; paid: Money; monthlyPayment?: Money }>(
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

      // Negotiation is real: a dealer moves within their room.
      let price = listing.price;
      if (p.negotiate) {
        const rng = s.rng('negotiate', listing.id);
        const skill = clamp((player.skills['negotiation'] ?? 10) / 100, 0, 1);
        const movement = listing.negotiationRoom * clamp(0.25 + skill * 0.85 + rng.float(-0.15, 0.15), 0, 1);
        price = Math.round(price * (1 - movement));
      }

      const fees = vehicleFees(player.currentLocationId, s.now);
      const salesTax = applyRate(price, fees.purchaseTaxRate);
      const registration = Math.max(fees.registrationMinimum, applyRate(price, fees.registrationRate));
      const docFee = 8_50_0;
      const total = price + salesTax + registration + docFee;

      let cashDue = total;
      let loanAccountId: Id | undefined;
      let monthlyPayment: Money | undefined;

      if (p.acquisition === 'financed') {
        const down = p.downPayment ?? Math.round(price * 0.12);
        const borrow = price - down;
        if (borrow <= 0) throw new CommandError('The deposit covers the whole price. Buy it outright instead.');
        const months = p.termMonths ?? 60;
        const apr = offeredApr(player.creditScore, 'auto');
        const payment = amortisedPayment(borrow, apr, months);
        const monthlyIncome = monthlyIncomeEstimate(s, player.id);
        if (monthlyIncome > 0 && payment > monthlyIncome * 0.28) {
          throw new CommandError(
            `A lender will not approve that. ${formatMoney(payment)} a month against income of about ${formatMoney(monthlyIncome)} is too much.`,
          );
        }
        cashDue = down + salesTax + registration + docFee;
        monthlyPayment = payment;
      } else if (p.acquisition === 'leased') {
        const residual = Math.round(price * 0.58);
        const months = p.termMonths ?? 36;
        const down = p.downPayment ?? Math.round(price * 0.08);
        monthlyPayment = Math.ceil((price - residual) / months + (price * 0.0022));
        cashDue = down + registration + docFee;
      }

      if (s.ledger.availableFunds(accountId) < cashDue) {
        throw new CommandError(`You need ${formatMoney(cashDue)} to drive this away and you have ${formatMoney(s.ledger.availableFunds(accountId))}.`);
      }

      if (p.acquisition === 'financed') {
        const down = p.downPayment ?? Math.round(price * 0.12);
        const result = s.execute<{ accountId: Id; monthlyPayment: Money }>({
          kind: 'finance.take_loan',
          payload: { borrowerId: player.id, principal: price - down, months: p.termMonths ?? 60, product: 'auto', name: `Auto loan — ${model.make} ${model.name}` },
        });
        if (!result.ok) throw new CommandError(result.error ?? 'Financing was declined.');
        loanAccountId = result.value?.accountId;
      }

      s.expense(accountId, cashDue, `${model.make} ${model.name} ${trim.name}`, 'transport', { refType: 'listing', refId: listing.id });

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

      if (p.acquisition === 'leased') {
        vehicle.leaseEndsAt = addDays(s.now, (p.termMonths ?? 36) * 30, s.homeZone);
        vehicle.leaseMileageCap = (p.termMonths ?? 36) / 12 * 12000;
      }

      if (monthlyPayment && p.acquisition === 'leased') {
        createBill(s, {
          payerId: player.id,
          name: `Lease — ${model.make} ${model.name}`,
          category: 'transport',
          amount: monthlyPayment,
          frequency: 'monthly',
          firstDueAt: addDays(s.now, 30, s.homeZone),
          autopayAccountId: accountId,
          refType: 'vehicle', refId: vehicle.id,
          endsAt: vehicle.leaseEndsAt,
        });
      }

      listing.status = 'sold';
      s.emit('vehicle.purchased', {
        vehicleId: vehicle.id, ownerId: player.id, price, total: cashDue,
        acquisition: p.acquisition, locationId: player.currentLocationId,
      });
      s.remember({
        category: 'vehicle',
        title: `Bought a ${listing.year} ${model.make} ${model.name}`,
        detail: `${trim.name}, ${listing.condition}, ${listing.mileage.toLocaleString('en-US')} miles. ${formatMoney(price)}${p.acquisition === 'financed' ? ' financed' : p.acquisition === 'leased' ? ' leased' : ' in cash'}.`,
        refs: [{ type: 'vehicle', id: vehicle.id }],
        significance: 55, public: false, amount: price,
      });
      return { vehicleId: vehicle.id, paid: cashDue, monthlyPayment };
    },
  );

  sim.onCommand<{ vehicleId: Id; accountId?: Id }, { proceeds: Money }>(
    'veh.sell',
    (p, { sim: s }) => {
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!vehicle || vehicle.soldAt) throw new CommandError('You do not own that vehicle.');
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
      addMileage(s, vehicle, p.miles);
      const serviceDue = vehicle.mileage >= vehicle.nextServiceDueMileage;
      return { mileage: vehicle.mileage, serviceDue };
    },
  );
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

  const vehicle: Vehicle = {
    id: sim.nextId('veh'),
    saveId: sim.universe.meta.id,
    ownerId: spec.ownerId,
    ownerKind: spec.ownerKind ?? 'person',
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
    nextServiceDueMileage: spec.mileage + SERVICE_INTERVAL_MILES,
    efficiency: trim.efficiency,
    horsepower: trim.horsepower,
    zeroToSixty: trim.zeroToSixty,
    storedAtPropertyId: owner?.residenceId,
  };
  sim.universe.vehicles[vehicle.id] = vehicle;

  sim.schedule({
    at: vehicle.registrationExpiresAt,
    kind: 'veh.registration_due',
    label: `Registration Renewal — ${vehicle.make} ${vehicle.model}`,
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
        title: `${part.name} could not be fitted`,
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
        title: `${vehicle.make} ${vehicle.model} is not road legal`,
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
          title: `Tell your insurer about ${part.name}`,
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

  // Mileage and condition.
  const expectedMiles = ageYears * 11_500;
  const mileageFactor = clamp(1 - (vehicle.mileage - expectedMiles) / 260_000, 0.55, 1.22);
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

export function addMileage(sim: Simulation, vehicle: Vehicle, miles: number): void {
  vehicle.mileage += Math.max(0, Math.round(miles));
  vehicle.mechanicalHealth = clamp(vehicle.mechanicalHealth - miles / 3200, 0, 100);
  vehicle.condition = clamp(vehicle.condition - miles / 9000, 0, 100);

  if (vehicle.mileage >= vehicle.nextServiceDueMileage) {
    sim.requireDecision({
      urgency: vehicle.mechanicalHealth < 55 ? 72 : 45,
      category: 'vehicles',
      title: `${vehicle.make} ${vehicle.model} is due for service`,
      detail: `${vehicle.mileage.toLocaleString('en-US')} miles. Skipping it costs more later.`,
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
    scheduled: 'Scheduled service', repair: 'Repair', recall: 'Recall work',
    inspection: 'Inspection', tires: 'Tires', detail: 'Detailing',
    bodywork: 'Body and paint', warranty: 'Warranty service',
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
  return Math.round((base[kind] ?? 400_00) * index * col * healthPenalty);
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
        title: `Cannot pay for ${serviceLabel(kind).toLowerCase()}`,
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
    shopName: underWarranty ? `${vehicle.make} Dealer Service` : 'Meridian Auto Works',
    healthDelta,
  };
  sim.universe.serviceRecords[record.id] = record;
  vehicle.serviceRecordIds.push(record.id);

  vehicle.mechanicalHealth = clamp(vehicle.mechanicalHealth + healthDelta, 0, 100);
  if (kind === 'detail' || kind === 'bodywork') vehicle.condition = clamp(vehicle.condition + (kind === 'bodywork' ? 12 : 5), 0, 100);
  if (kind === 'scheduled') vehicle.nextServiceDueMileage = vehicle.mileage + SERVICE_INTERVAL_MILES;

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
      title: `${vehicle.make} ${vehicle.model} failed inspection`,
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
      label: `Registration Renewal — ${vehicle.make} ${vehicle.model}`,
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
  for (const vehicle of Object.values(sim.universe.vehicles)) {
    if (vehicle.soldAt) continue;
    revalue(sim, vehicle);
  }
}

export function refreshInventory(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const cityId = player.currentLocationId;

  for (const [id, listing] of Object.entries(sim.universe.vehicleListings)) {
    if (listing.status !== 'active' || sim.now - listing.listedAt > 60 * MS_DAY) delete sim.universe.vehicleListings[id];
  }

  const rng = sim.rng('vehicle_inventory', cityId, Math.floor(sim.now / (14 * MS_DAY)));
  const currentYear = new Date(sim.now).getUTCFullYear();
  const models = VEHICLE_MODELS.all();
  const count = rng.int(12, 20);

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
    const mileage = condition === 'new' ? rng.int(3, 40) : Math.round(age * rng.int(6_500, 15_500));

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

    const listing: VehicleListing = {
      id: sim.nextId('veh'),
      saveId: sim.universe.meta.id,
      catalogId: `${model.id}:${trim.id}`,
      condition,
      year,
      mileage,
      price,
      locationId: cityId,
      dealerName: dealerName(model.parentId, condition),
      configuration: {
        paint: rng.pick(['Obsidian Black', 'Glacier White', 'Nardo Grey', 'Racing Blue', 'Signal Red', 'Forest Green', 'Champagne']),
        wheels: rng.pick(['18" Alloy', '19" Alloy', '20" Forged', '21" Split-Spoke', '22" Polished']),
        interior: rng.pick(['Black Leather', 'Tan Leather', 'Grey Cloth', 'Cream Nappa', 'Red Nappa', 'Alcantara']),
        options,
        modificationIds: [],
      },
      status: 'active',
      listedAt: sim.now,
      negotiationRoom: condition === 'new' ? rng.float(0.02, 0.06) : rng.float(0.04, 0.13),
    };
    sim.universe.vehicleListings[listing.id] = listing;
  }
  sim.emit('veh.inventory_refreshed', { cityId, count });
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
