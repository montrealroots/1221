/**
 * SLATE — leasing a new car in America (docs/WORLD.md, stage 3), from
 * 2026-09-30: a closed-end lease at the terms Toyota Financial Services
 * published for September 2026 (`US_LEASE`), paid monthly, returned at its
 * end for the disposition fee and any miles over the allowance, or bought
 * out at its residual.
 *
 * The payment is the published arithmetic: the depreciation, what the
 * capitalized cost is over the residual, spread over the term, and the rent
 * charge, the two added and times the money factor, with the state's sales
 * tax. A leased car is the lessor's: it isn't held in a net worth, sold or
 * traded in. Returning one early isn't kept, as the lessor publishes no
 * formula for its charge ("may be substantial"), and neither is buying one
 * out before its end, whose price is the lessor's payoff; a missed payment
 * goes into arrears, and the lessor taking the car back isn't kept. Leases
 * outside America aren't kept: Canada's, Britain's and Ireland's are
 * researched (research-car-buying.json) but not built.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { US_LEASE, US_NEW_BELOW_STICKER } from '../content/vehiclefees';
import { homeOf } from './earnings';
import { owe, payFromBank } from './household';
import { VEHICLE_MONTH_KIND, VEHICLE_RENEWAL_KIND, jurisdictionOf, kept, kindOf, modelById, monthlyInsurance, quote, renewal, usSalesTaxRate, vehiclesOf, type OwnedVehicle } from './vehicles';

export const LEASE_MONTH_KIND = 'vehicle.lease_month';
export const LEASE_END_KIND = 'vehicle.lease_end';
const KM_A_MILE = 1.609344;

export interface Lease {
  months: number;
  /** Payments still to come after the first, paid at signing. */
  monthsLeft: number;
  /** The month's payment, its tax in it where taxed monthly, in the save's money, cents. */
  monthly: Money;
  /** What it's bought out for at the end, in dollars, cents. */
  residual: Money;
  /** Its term run: the lessor's return date, a month on. */
  maturedAt?: Instant;
  returnBy?: Instant;
  missed?: number;
}

export interface LeaseQuote {
  currency: 'USD';
  /** The month's payment before tax, and with it. */
  base: Money;
  monthly: Money;
  residual: Money;
  capitalized: Money;
  atSigning: { label: string; amount: Money }[];
  dueAtSigning: Money;
  basis: string;
}

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** What leasing a new car costs where a town is, in dollars, cents, or why it can't be leased there. */
export function leaseQuote(modelId: string, cityId: string, at: Instant, months: number, person?: Person): LeaseQuote | string {
  const model = modelById(modelId);
  if (!model) return 'SLATE doesn’t sell that car.';
  if (kindOf(model) !== 'car') return 'The lease SLATE keeps is Toyota’s, for a car.';
  const j = jurisdictionOf(cityId);
  if (!j?.startsWith('US-')) return 'SLATE keeps leases in America only: New York, Connecticut and California.';
  if (!(US_LEASE.terms as readonly number[]).includes(months)) return `A lease of ${US_LEASE.terms.join(', ')} months.`;
  const q = quote(model, cityId, at, person ? { person } : {});
  if (typeof q === 'string') return q;
  const sticker = model.price + model.delivery;
  const capitalized = sticker - Math.round(sticker * US_NEW_BELOW_STICKER);
  const residual = Math.round(sticker * kept(months / 12));
  const base = Math.round((capitalized - residual) / months + (capitalized + residual) * US_LEASE.moneyFactor);
  const rate = usSalesTaxRate(j, cityId, at, capitalized / 100);
  // New York taxes every payment at signing; Connecticut and California, each as it's paid.
  const upfront = j === 'US-NY';
  const monthly = upfront ? base : Math.round(base * (1 + rate));
  const atSigning: { label: string; amount: Money }[] = [{ label: 'The First Month', amount: monthly }, { label: 'Acquisition Fee', amount: US_LEASE.acquisition * 100 }];
  if (upfront) atSigning.push({ label: `Sales Tax On Every Payment, ${(rate * 100).toFixed(3).replace(/0+$/, '')}%`, amount: Math.round(base * months * rate) });
  // The dealer's fee, registration, title and plates, as on a purchase; the sale's tax and discount are the lease's own.
  for (const l of q.lines) if (!l.label.startsWith('Sales Tax') && !l.label.startsWith('Below The Sticker')) atSigning.push(l);
  return {
    currency: 'USD', base, monthly, residual, capitalized, atSigning,
    dueAtSigning: atSigning.reduce((a, l) => a + l.amount, 0),
    basis: `${model.make} ${model.model} ${model.trim}, ${months} months: capitalized at the sticker less what buyers paid below it, a residual of ${Math.round(kept(months / 12) * 100)}% (SLATE’s depreciation curve), the money factor ${US_LEASE.moneyFactor} worked back from ${US_LEASE.source}. ${US_LEASE.milesAYear.toLocaleString('en-US')} miles a year, $${US_LEASE.perMileOver.toFixed(2)} a mile over, $${US_LEASE.disposition} at its return.`,
  };
}

export function leaseRefusal(sim: Simulation, person: Person, modelId: string, months: number, coverage: OwnedVehicle['coverage']): string | undefined {
  const q = leaseQuote(modelId, homeOf(person), sim.now, months, person);
  if (typeof q === 'string') return q;
  if (coverage === 'liability') return 'A lessor asks for full cover on its car.';
  const ins = monthlyInsurance(jurisdictionOf(homeOf(person))!, coverage, modelById(modelId));
  if (typeof ins === 'string') return ins;
  return undefined;
}

/** Miles driven over the lease's allowance, and what they cost, in dollars, cents. */
export function milesOver(v: OwnedVehicle): { miles: number; charge: Money } {
  if (!v.lease) return { miles: 0, charge: 0 };
  const miles = Math.max(0, Math.round((v.km ?? 0) / KM_A_MILE - (US_LEASE.milesAYear * v.lease.months) / 12));
  return { miles, charge: Math.round(miles * US_LEASE.perMileOver * 100) };
}

/** What buying a leased car out at its end costs, in dollars, cents: the residual and the state's tax on it. */
export function buyoutPrice(v: OwnedVehicle, at: Instant): Money | undefined {
  if (!v.lease) return undefined;
  return Math.round(v.lease.residual * (1 + usSalesTaxRate(v.jurisdiction, v.cityId, at, v.lease.residual / 100)));
}

const cancelFor = (sim: Simulation, v: OwnedVehicle) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.payload.vehicleId === v.id) sim.timeline.cancel(item.id, sim.now); };

/** The car back to the lessor: the disposition fee, and the miles over. */
function giveBack(sim: Simulation, person: Person, v: OwnedVehicle): Money {
  const m = modelById(v.modelId)!;
  const over = milesOver(v);
  const due = inSave(sim, US_LEASE.disposition * 100 + over.charge, 'USD');
  const memo = `The ${m.make} ${m.model} returned at its lease’s end${over.miles ? `, ${over.miles.toLocaleString('en-US')} miles over` : ''}`;
  if (!payFromBank(sim, person, due, memo, 'vehicle')) owe(sim, person, due, 'The lease’s return', 'vehicle');
  v.soldAt = sim.now;
  cancelFor(sim, v);
  return due;
}

export function registerLeasing(sim: Simulation): void {
  sim.onCommand<{ modelId: string; months?: number; coverage?: OwnedVehicle['coverage'] }, { vehicleId: string; paid: Money; monthly: Money }>('vehicle.lease', (p, { sim: s }) => {
    const person = s.player;
    const months = Math.round(Number(p?.months ?? 36));
    const coverage = p?.coverage === 'liability' ? 'liability' : 'full';
    const no = leaseRefusal(s, person, String(p?.modelId), months, coverage);
    if (no) throw new CommandError(no);
    const cityId = homeOf(person);
    const j = jurisdictionOf(cityId)!;
    const model = modelById(String(p.modelId))!;
    const q = leaseQuote(model.id, cityId, s.now, months, person) as LeaseQuote;
    const down = inSave(s, q.dueAtSigning, 'USD');
    if (!payFromBank(s, person, down, `${model.make} ${model.model}, leased: due at signing`, 'vehicle')) throw new CommandError(`${formatMoney(down, saveCurrency(s.universe))} is more than the bank can cover.`);
    const id = s.nextId('vehicle');
    const v: OwnedVehicle = { id, modelId: model.id, boughtAt: s.now, ageAtPurchase: 0, listPrice: model.price, jurisdiction: j, cityId, coverage, registrationDue: 0, lease: { months, monthsLeft: months - 1, monthly: inSave(s, q.monthly, 'USD'), residual: q.residual } };
    v.registrationDue = renewal(v, s.now).next;
    vehiclesOf(person).push(v);
    s.schedule({ at: s.now + 30 * MS_DAY, kind: VEHICLE_MONTH_KIND, label: 'The Car’s Month', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: id } });
    s.schedule({ at: s.now + 30 * MS_DAY, kind: LEASE_MONTH_KIND, label: 'The Lease’s Month', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: id } });
    s.schedule({ at: v.registrationDue, kind: VEHICLE_RENEWAL_KIND, label: 'Registration Renewal', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: id } });
    return { vehicleId: id, paid: down, monthly: v.lease!.monthly };
  });

  sim.onSchedule(LEASE_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const v = person ? vehiclesOf(person).find((x) => x.id === item.payload.vehicleId) : undefined;
    if (!person || !v?.lease || v.soldAt !== undefined) return;
    const m = modelById(v.modelId)!;
    if (v.lease.monthsLeft > 0) {
      if (payFromBank(s, person, v.lease.monthly, `Lease payment, the ${m.make} ${m.model}`, 'vehicle')) v.lease.missed = 0;
      else { owe(s, person, v.lease.monthly, 'Lease payment', 'vehicle'); v.lease.missed = (v.lease.missed ?? 0) + 1; }
      v.lease.monthsLeft -= 1;
      s.schedule({ at: item.at + 30 * MS_DAY, kind: LEASE_MONTH_KIND, label: 'The Lease’s Month', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id } });
      return;
    }
    // The term run: a month to return it or buy it out, and returned if neither.
    v.lease.maturedAt = s.now;
    v.lease.returnBy = s.now + 30 * MS_DAY;
    s.schedule({ at: v.lease.returnBy, kind: LEASE_END_KIND, label: 'The Lease Ends', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id } });
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'Your Lease Is Ending', body: `The ${m.make} ${m.model}’s lease has run its term. Buy it out for ${formatMoney(inSave(s, buyoutPrice(v, s.now)!, 'USD'), saveCurrency(s.universe))} on the Cars screen, or it goes back to the lessor on ${formatDate(v.lease.returnBy, s.zone)}.`, importance: 60, route: '/workspace/vehicles' });
  });

  sim.onSchedule(LEASE_END_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const v = person ? vehiclesOf(person).find((x) => x.id === item.payload.vehicleId) : undefined;
    if (!person || !v?.lease || v.soldAt !== undefined) return;
    giveBack(s, person, v);
  });

  const matured = (s: Simulation, vehicleId: unknown) => {
    const v = vehiclesOf(s.player).find((x) => x.id === vehicleId && x.soldAt === undefined);
    if (!v?.lease) throw new CommandError('That isn’t a car you lease.');
    if (v.lease.maturedAt === undefined) throw new CommandError('The lease hasn’t run its term: the lessor publishes no charge for ending it early.');
    return v;
  };

  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.lease_return', (p, { sim: s }) => ({ paid: giveBack(s, s.player, matured(s, p?.vehicleId)) }));

  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.lease_buyout', (p, { sim: s }) => {
    const v = matured(s, p?.vehicleId);
    const m = modelById(v.modelId)!;
    const paid = inSave(s, buyoutPrice(v, s.now)!, 'USD');
    if (!payFromBank(s, s.player, paid, `Bought out the ${m.make} ${m.model} at its lease’s end`, 'vehicle')) throw new CommandError(`${formatMoney(paid, saveCurrency(s.universe))} is more than the bank can cover.`);
    // Its pending return finds no lease and passes.
    delete v.lease;
    return { paid };
  });
}
