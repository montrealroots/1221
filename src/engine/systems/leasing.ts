/**
 * SLATE — leasing a new car (docs/WORLD.md, stage 3), from 2026-09-30.
 *
 * **America:** a closed-end lease at the terms Toyota Financial Services
 * published for September 2026 (`US_LEASE`), paid monthly, returned at its
 * end for the disposition fee and any miles over the allowance, or bought
 * out at its residual. The payment is the published arithmetic: the
 * depreciation, what the capitalized cost is over the residual, spread over
 * the term, and the rent charge, the two added and times the money factor,
 * with the state's sales tax.
 *
 * **Canada** (`CA_LEASE`, from later on 2026-09-30): Honda Canada's lease,
 * the same arithmetic at a lease APR, a residual worked back from its
 * published payment, 20,000 km a year and 15 cents a kilometer over, the
 * payment and a buyout taxed as the province taxes a sale.
 *
 * **Britain and Ireland, a PCP** (`PCP`): a deposit, payments over all but
 * the last month, and at the end the guaranteed minimum future value paid to
 * own it, or the car handed back with its miles over charged. Under the
 * Consumer Credit Act's half rule, and Ireland's, it may go back at any time
 * once half the total's paid, the rest to half paid first.
 *
 * A leased car, and a PCP's until its final payment, is the lender's: it
 * isn't held in a net worth, sold or traded in. Until later on 2026-09-30
 * returning an American or a Canadian lease early wasn't kept, as the lessors
 * publish no formula for its charge ("may be substantial"), and the lessor
 * taking the car back for missed payments wasn't either (`takeLeasedCar` keeps
 * it now).
 *
 * From later on 2026-09-30, an American or a Canadian lease ends early, or is
 * bought out before its end, on the method the Federal Reserve's "Keys to
 * Vehicle Leasing" describes (`docs/research/world/research-sweep3.json`):
 * the early termination charge is the lease's remaining balance less the
 * car's realized value, its wholesale price; the balance is kept by the
 * constant yield method, the one most lessors use, falling each month by the
 * depreciation part of the payment. SLATE solves the lease's own rate, the
 * one at which its payments and residual come to its capitalized cost, and
 * takes the trade-in value as the wholesale. No lessor's own early
 * termination fee was found, so none is added; the disposition fee is
 * charged, as at any return. Bought out early, it's the balance, the
 * purchase option fee and the tax. The miles over are counted against the
 * whole term's allowance, as no lessor's proration was read. Until then
 * neither was kept. Britain's PCH isn't sold: its one
 * published offer is on a Corolla, which SLATE doesn't sell there. Mexico's
 * arrendamiento puro publishes no residual or allowance.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { salesTaxRate } from '../content/tax';
import { CA_LEASE, PCP, US_LEASE, US_NEW_BELOW_STICKER, type Jurisdiction } from '../content/vehiclefees';
import { homeOf } from './earnings';
import { owe, payFromBank } from './household';
import { takeLeasedCar } from './repossession';
import { VEHICLE_MONTH_KIND, VEHICLE_RENEWAL_KIND, tradeInValue, jurisdictionOf, kept, kindOf, loanRate, modelById, monthlyInsurance, quote, renewal, usSalesTaxRate, vehiclesOf, type OwnedVehicle } from './vehicles';

export const LEASE_MONTH_KIND = 'vehicle.lease_month';
export const LEASE_END_KIND = 'vehicle.lease_end';
const KM_A_MILE = 1.609344;

export type LeaseKind = 'lease' | 'pcp';

export interface Lease {
  months: number;
  /** Payments still to come: after the first, paid at signing, on a lease; after the deposit on a PCP. */
  monthsLeft: number;
  /** The month's payment, its tax in it where taxed monthly, in the save's money, cents. */
  monthly: Money;
  /** What it's bought out for at the end, in the lease's money, cents: the residual, or a PCP's future value. */
  residual: Money;
  /** Its term run: the lessor's return date, a month on. */
  maturedAt?: Instant;
  returnBy?: Instant;
  missed?: number;
  /** From later on 2026-09-30: a PCP or a lease, its money, its allowance and its charges; an older American lease has none, and is Toyota's. */
  kind?: LeaseKind;
  currency?: string;
  /** The allowance over the term, and the charge for each unit over, in the lease's money, cents a unit. */
  allowance?: number;
  unit?: 'mile' | 'km';
  perUnitOver?: number;
  /** At its return, and on a buyout, in the lease's money, cents. */
  disposition?: Money;
  buyoutFee?: Money;
  /** A PCP's half rule: half the total payable, and what's been paid, in the save's money, cents. */
  halfTotal?: Money;
  paid?: Money;
  /** A lease's capitalized cost and its monthly payment before tax, in its money, cents: what its balance is kept by (from later on 2026-09-30). */
  capitalized?: Money;
  base?: Money;
}

export interface LeaseQuote {
  kind: LeaseKind;
  currency: string;
  /** The month's payment before tax, and with it. */
  base: Money;
  monthly: Money;
  residual: Money;
  capitalized: Money;
  atSigning: { label: string; amount: Money }[];
  dueAtSigning: Money;
  /** The rate, as an APR, and the allowance over the term. */
  apr: number;
  allowance: number;
  unit: 'mile' | 'km';
  perUnitOver: number;
  disposition: Money;
  buyoutFee: Money;
  /** A PCP's total payable, in the lease's money. */
  total?: Money;
  basis: string;
}

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** A lease's terms where a jurisdiction has them, in months. */
export function leaseTerms(j: Jurisdiction | undefined): readonly number[] {
  if (!j) return [];
  if (j.startsWith('US-')) return US_LEASE.terms;
  if (j === 'CA-ON' || j === 'CA-BC') return CA_LEASE.terms;
  if (j === 'GB' || j === 'IE') return PCP.terms;
  return [];
}

export const leaseKindOf = (j: Jurisdiction | undefined): LeaseKind => (j === 'GB' || j === 'IE' ? 'pcp' : 'lease');

/** A PCP's monthly payment: the credit less the future value's present worth, over the payments, at the APR. */
export function pcpPayment(credit: Money, balloon: Money, payments: number, apr: number): Money {
  const i = apr / 12;
  if (i === 0) return Math.round((credit - balloon) / payments);
  const v = 1 / (1 + i);
  return Math.round(((credit - balloon * v ** (payments + 1)) * i) / (1 - v ** payments));
}

/** What leasing a new car costs where a town is, in the place's money, cents, or why it can't be leased there. */
export function leaseQuote(modelId: string, cityId: string, at: Instant, months: number, person?: Person): LeaseQuote | string {
  const model = modelById(modelId);
  if (!model) return 'SLATE doesn’t sell that car.';
  if (kindOf(model) !== 'car') return 'The leases SLATE keeps are for a car.';
  const j = jurisdictionOf(cityId);
  const terms = leaseTerms(j);
  if (!j || !terms.length) return 'SLATE keeps leases in America and Canada, and a PCP in Britain and Ireland.';
  if (!terms.includes(months)) return `${leaseKindOf(j) === 'pcp' ? 'A PCP' : 'A lease'} of ${terms.join(', ')} months.`;
  const q = quote(model, cityId, at, person ? { person } : {});
  if (typeof q === 'string') return q;
  const sticker = model.price + model.delivery;
  const plates = q.lines.filter((l) => !l.label.startsWith('Sales Tax') && !l.label.startsWith('Below The Sticker') && !/HST|GST|PST/.test(l.label) && l.amount > 0);
  const name = `${model.make} ${model.model} ${model.trim}`.trim();
  if (j.startsWith('US-')) {
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
    atSigning.push(...plates);
    return {
      kind: 'lease', currency: 'USD', base, monthly, residual, capitalized, atSigning,
      dueAtSigning: atSigning.reduce((a, l) => a + l.amount, 0),
      apr: US_LEASE.moneyFactor * 2400, allowance: (US_LEASE.milesAYear * months) / 12, unit: 'mile', perUnitOver: US_LEASE.perMileOver * 100, disposition: US_LEASE.disposition * 100, buyoutFee: 0,
      basis: `${name}, ${months} months: capitalized at the sticker less what buyers paid below it, a residual of ${Math.round(kept(months / 12) * 100)}% (SLATE’s depreciation curve), the money factor ${US_LEASE.moneyFactor} worked back from ${US_LEASE.source}. ${US_LEASE.milesAYear.toLocaleString('en-US')} miles a year, $${US_LEASE.perMileOver.toFixed(2)} a mile over, $${US_LEASE.disposition} at its return.`,
    };
  }
  if (j === 'CA-ON' || j === 'CA-BC') {
    const share = CA_LEASE.residual24 * (kept(months / 12) / kept(2));
    const residual = Math.round(sticker * share);
    const base = Math.round((sticker - residual) / months + ((sticker + residual) * CA_LEASE.apr) / 24);
    const rate = salesTaxRate(cityId, at, 'goods');
    const monthly = Math.round(base * (1 + rate));
    const atSigning = [{ label: 'The First Month', amount: monthly }, ...plates];
    return {
      kind: 'lease', currency: 'CAD', base, monthly, residual, capitalized: sticker, atSigning,
      dueAtSigning: atSigning.reduce((a, l) => a + l.amount, 0),
      apr: CA_LEASE.apr * 100, allowance: (CA_LEASE.kmAYear * months) / 12, unit: 'km', perUnitOver: CA_LEASE.perKmOver * 100, disposition: 0, buyoutFee: 0,
      basis: `${name}, ${months} months at ${(CA_LEASE.apr * 100).toFixed(2)}%: a residual of ${Math.round(share * 100)}%, worked back from ${CA_LEASE.source} and scaled along SLATE’s depreciation curve; ${CA_LEASE.kmAYear.toLocaleString('en-US')} km a year, 15¢ a kilometer over; each payment taxed at ${Math.round(rate * 1000) / 10}%.`,
    };
  }
  // A PCP: the deposit, payments over all but the last month, and the future value.
  const place = j === 'GB' ? PCP.GB : PCP.IE;
  const apr = j === 'GB' ? (PCP.GB.freeOn.includes(model.id) ? 0 : PCP.GB.apr) : loanRate('IE', person?.credit?.score ?? 700, false) ?? 0;
  const deposit = Math.round(sticker * PCP.deposit);
  const share = PCP.gmfv37 * (kept(months / 12) / kept(37 / 12));
  const residual = Math.round(sticker * share);
  const monthly = pcpPayment(sticker - deposit, residual, months - 1, apr);
  const docFee = Math.round(place.docFee * 100);
  const buyoutFee = Math.round(place.purchaseFee * 100);
  const atSigning = [{ label: 'The Deposit', amount: deposit }, ...(docFee ? [{ label: 'Documentation Fee', amount: docFee }] : []), ...plates];
  const total = deposit + monthly * (months - 1) + residual + docFee + buyoutFee;
  return {
    kind: 'pcp', currency: j === 'GB' ? 'GBP' : 'EUR', base: monthly, monthly, residual, capitalized: sticker, atSigning,
    dueAtSigning: atSigning.reduce((a, l) => a + l.amount, 0),
    apr: apr * 100, allowance: (place.milesAYear * months) / 12, unit: 'mile', perUnitOver: place.perMileOver * 100, disposition: 0, buyoutFee, total,
    basis: `${name}, a PCP over ${months} months: ${Math.round(PCP.deposit * 100)}% down, ${months - 1} payments at ${(apr * 100).toFixed(2)}% APR, and a final payment of ${Math.round(share * 100)}% to own it, from ${PCP.source}. ${place.milesAYear.toLocaleString('en-US')} miles a year, 8p a mile over${j === 'IE' ? ', Britain’s shape standing in for Ireland’s, which isn’t published' : ''}.`,
  };
}

export function leaseRefusal(sim: Simulation, person: Person, modelId: string, months: number, coverage: OwnedVehicle['coverage']): string | undefined {
  const q = leaseQuote(modelId, homeOf(person), sim.now, months, person);
  if (typeof q === 'string') return q;
  if (coverage === 'liability') return 'A lender asks for full cover on its car.';
  const ins = monthlyInsurance(jurisdictionOf(homeOf(person))!, coverage, modelById(modelId));
  if (typeof ins === 'string') return ins;
  return undefined;
}

/** A lease's money, its allowance and its charge a unit over: an older American lease's are Toyota's. */
const termsOf = (l: Lease) => ({
  currency: l.currency ?? 'USD', unit: l.unit ?? 'mile',
  allowance: l.allowance ?? (US_LEASE.milesAYear * l.months) / 12,
  perUnitOver: l.perUnitOver ?? US_LEASE.perMileOver * 100,
  disposition: l.disposition ?? US_LEASE.disposition * 100,
  buyoutFee: l.buyoutFee ?? 0,
});

/** The lease's money: dollars where it doesn't say. */
export const leaseCurrency = (v: OwnedVehicle): string => v.lease?.currency ?? 'USD';

/** Miles or kilometers driven over the lease's allowance, and what they cost, in the lease's money, cents. */
export function milesOver(v: OwnedVehicle): { miles: number; unit: 'mile' | 'km'; charge: Money } {
  if (!v.lease) return { miles: 0, unit: 'mile', charge: 0 };
  const t = termsOf(v.lease);
  const driven = t.unit === 'mile' ? (v.km ?? 0) / KM_A_MILE : v.km ?? 0;
  const miles = Math.max(0, Math.round(driven - t.allowance));
  return { miles, unit: t.unit, charge: Math.round(miles * t.perUnitOver) };
}

/** What buying a leased car out at its end costs, in the lease's money, cents: the residual and its tax, or a PCP's final payment and fee. */
export function buyoutPrice(v: OwnedVehicle, at: Instant): Money | undefined {
  if (!v.lease) return undefined;
  const t = termsOf(v.lease);
  if (v.lease.kind === 'pcp') return v.lease.residual + t.buyoutFee;
  if (v.jurisdiction === 'CA-ON' || v.jurisdiction === 'CA-BC') return Math.round(v.lease.residual * (1 + salesTaxRate(v.cityId, at, 'goods')));
  return Math.round(v.lease.residual * (1 + usSalesTaxRate(v.jurisdiction, v.cityId, at, v.lease.residual / 100)));
}

/**
 * A lease's balance after so many payments, by the constant yield method: the
 * payments still to come and the residual, at the rate that brings all of
 * them, from the first at signing, to the capitalized cost. In its money.
 */
export function leaseBalance(lease: Lease, made: number): Money | undefined {
  const { capitalized, base, months, residual } = lease;
  if (capitalized === undefined || base === undefined) return undefined;
  const worth = (r: number, from: number) => { let sum = 0; for (let k = from; k < months; k += 1) sum += base / (1 + r) ** (k - from); return sum + residual / (1 + r) ** (months - from); };
  // The monthly rate, by halving: what's paid falls as the rate rises.
  let lo = 0;
  let hi = 0.05;
  for (let i = 0; i < 60; i += 1) { const mid = (lo + hi) / 2; if (worth(mid, 0) > capitalized) lo = mid; else hi = mid; }
  // Right after the payment last made, as the Federal Reserve's example keeps it: at signing, the capitalized cost less the first.
  const r = (lo + hi) / 2;
  return Math.round(worth(r, Math.min(made, months)) / (1 + r));
}

/** Ending an American or a Canadian lease before its term, or buying it out early, in the lease's money; or why it can't be. */
export function earlyEnd(sim: Simulation, v: OwnedVehicle): { balance: Money; realized: Money; charge: Money; buyout: Money } | string {
  const lease = v.lease;
  if (!lease) return 'That isn’t a car you lease.';
  const balance = leaseBalance(lease, lease.months - lease.monthsLeft);
  // A PCP keeps none, and goes back under the half rule; a lease signed before the balance was kept, none either.
  if (balance === undefined) return 'A lease signed before its balance was kept: ended at its term.';
  const cur = saveCurrency(sim.universe);
  const into = leaseCurrency(v);
  const trade = tradeInValue(sim, v);
  const realized = cur === into ? trade : exchange(trade, cur, into) ?? trade;
  const tax = v.jurisdiction === 'CA-ON' || v.jurisdiction === 'CA-BC' ? salesTaxRate(v.cityId, sim.now, 'goods') : usSalesTaxRate(v.jurisdiction, v.cityId, sim.now, balance / 100);
  return { balance, realized, charge: Math.max(0, balance - realized), buyout: Math.round(balance * (1 + tax)) + termsOf(lease).buyoutFee };
}

/** A PCP's early return under the half rule: what's to pay to reach half the total, in the save's money; or why it can't. */
export function halfRule(v: OwnedVehicle): { topUp: Money } | string {
  if (v.lease?.kind !== 'pcp' || v.lease.halfTotal === undefined) return 'Only a PCP goes back early, under the half rule.';
  return { topUp: Math.max(0, v.lease.halfTotal - (v.lease.paid ?? 0)) };
}

const cancelFor = (sim: Simulation, v: OwnedVehicle) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.payload.vehicleId === v.id) sim.timeline.cancel(item.id, sim.now); };

/** The car back to the lender: the disposition fee, the miles over, and before its end a PCP's top-up to half. */
function giveBack(sim: Simulation, person: Person, v: OwnedVehicle, topUp = 0, why = 'early, under the half rule'): Money {
  const m = modelById(v.modelId)!;
  const t = termsOf(v.lease!);
  const over = milesOver(v);
  const due = inSave(sim, t.disposition + over.charge, t.currency) + topUp;
  const memo = `The ${m.make} ${m.model} returned ${topUp || v.lease!.maturedAt === undefined ? why : 'at its term’s end'}${over.miles ? `, ${over.miles.toLocaleString('en-US')} ${over.unit === 'km' ? 'km' : 'miles'} over` : ''}`;
  if (due > 0 && !payFromBank(sim, person, due, memo, 'vehicle')) owe(sim, person, due, 'The lease’s return', 'vehicle');
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
    const down = inSave(s, q.dueAtSigning, q.currency);
    if (!payFromBank(s, person, down, `${model.make} ${model.model}, ${q.kind === 'pcp' ? 'on a PCP' : 'leased'}: due at signing`, 'vehicle')) throw new CommandError(`${formatMoney(down, saveCurrency(s.universe))} is more than the bank can cover.`);
    const id = s.nextId('vehicle');
    const lease: Lease = {
      months, monthsLeft: months - 1, monthly: inSave(s, q.monthly, q.currency), residual: q.residual,
      kind: q.kind, currency: q.currency, allowance: q.allowance, unit: q.unit, perUnitOver: q.perUnitOver, disposition: q.disposition, buyoutFee: q.buyoutFee,
      ...(q.kind === 'lease' ? { capitalized: q.capitalized, base: q.base } : {}),
      ...(q.kind === 'pcp' ? { halfTotal: Math.round(inSave(s, q.total!, q.currency) / 2), paid: inSave(s, q.atSigning[0]!.amount, q.currency) } : {}),
    };
    const v: OwnedVehicle = { id, modelId: model.id, boughtAt: s.now, ageAtPurchase: 0, listPrice: model.price, jurisdiction: j, cityId, coverage, registrationDue: 0, lease };
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
      if (payFromBank(s, person, v.lease.monthly, `${v.lease.kind === 'pcp' ? 'PCP' : 'Lease'} payment, the ${m.make} ${m.model}`, 'vehicle')) { v.lease.missed = 0; if (v.lease.paid !== undefined) v.lease.paid += v.lease.monthly; }
      else {
        owe(s, person, v.lease.monthly, 'Lease payment', 'vehicle');
        v.lease.missed = (v.lease.missed ?? 0) + 1;
        // Three missed, the lessor takes its car back (`systems/repossession.ts`).
        if (takeLeasedCar(s, person, v, `${m.make} ${m.model}`)) return;
      }
      v.lease.monthsLeft -= 1;
      s.schedule({ at: item.at + 30 * MS_DAY, kind: LEASE_MONTH_KIND, label: 'The Lease’s Month', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id } });
      return;
    }
    // The term run: a month to return it or buy it out, and returned if neither.
    v.lease.maturedAt = s.now;
    v.lease.returnBy = s.now + 30 * MS_DAY;
    s.schedule({ at: v.lease.returnBy, kind: LEASE_END_KIND, label: 'The Lease Ends', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id } });
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'Your Lease Is Ending', body: `The ${m.make} ${m.model}’s ${v.lease.kind === 'pcp' ? 'PCP' : 'lease'} has run its term. ${v.lease.kind === 'pcp' ? 'Make the final payment' : 'Buy it out'} for ${formatMoney(inSave(s, buyoutPrice(v, s.now)!, leaseCurrency(v)), saveCurrency(s.universe))} on the Cars screen, or it goes back on ${formatDate(v.lease.returnBy, s.zone)}.`, importance: 60, route: '/workspace/vehicles' });
  });

  sim.onSchedule(LEASE_END_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const v = person ? vehiclesOf(person).find((x) => x.id === item.payload.vehicleId) : undefined;
    if (!person || !v?.lease || v.soldAt !== undefined) return;
    giveBack(s, person, v);
  });

  const leased = (s: Simulation, vehicleId: unknown) => {
    const v = vehiclesOf(s.player).find((x) => x.id === vehicleId && x.soldAt === undefined);
    if (!v?.lease) throw new CommandError('That isn’t a car you lease.');
    return v;
  };

  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.lease_return', (p, { sim: s }) => {
    const v = leased(s, p?.vehicleId);
    if (v.lease!.maturedAt !== undefined) return { paid: giveBack(s, s.player, v) };
    // Before its end, a PCP under the half rule, and a lease for its early termination charge.
    if (v.lease!.kind === 'pcp') {
      const half = halfRule(v);
      if (typeof half === 'string') throw new CommandError(half);
      return { paid: giveBack(s, s.player, v, half.topUp) };
    }
    const early = earlyEnd(s, v);
    if (typeof early === 'string') throw new CommandError(early);
    return { paid: giveBack(s, s.player, v, inSave(s, early.charge, leaseCurrency(v)), 'early, its early termination charge paid') };
  });

  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.lease_buyout', (p, { sim: s }) => {
    const v = leased(s, p?.vehicleId);
    const m = modelById(v.modelId)!;
    // Before its end, a lease at its balance (`earlyEnd`); a PCP only at its end.
    const early = v.lease!.maturedAt === undefined ? earlyEnd(s, v) : undefined;
    if (typeof early === 'string') throw new CommandError(v.lease!.kind === 'pcp' ? 'A PCP is bought at its final payment, at its end.' : early);
    const paid = inSave(s, early ? early.buyout : buyoutPrice(v, s.now)!, leaseCurrency(v));
    if (!payFromBank(s, s.player, paid, `Bought out the ${m.make} ${m.model} ${early ? 'before' : 'at'} its ${v.lease!.kind === 'pcp' ? 'PCP' : 'lease'}’s end`, 'vehicle')) throw new CommandError(`${formatMoney(paid, saveCurrency(s.universe))} is more than the bank can cover.`);
    // Its pending return finds no lease and passes.
    delete v.lease;
    return { paid };
  });
}
