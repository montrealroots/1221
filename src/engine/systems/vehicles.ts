/**
 * SLATE — owning a car (docs/WORLD.md, stage 3), from 2026-09-29: bought
 * new or used from the market where one lives, taxed, registered, insured
 * and financed at that place's published figures (\`content/vehiclefees.ts\`,
 * \`content/vehiclecatalog.ts\`), losing value as the studies find cars do,
 * and sold at what it's worth.
 *
 * A used car is SLATE's model of the used market: a model from the same
 * catalog at an age, priced at the new price less what the curve says it's
 * lost, taxed as a used car is where that differs. A car is sold at its
 * value, SLATE's estimate of a private sale; a dealer's trade-in, lower, and
 * repossession of a car whose loan isn't paid aren't kept. A missed payment
 * goes into arrears, as rent does. What a car cost is counted as spent, not
 * as something held against a net worth, as a home is; SLATE's simplification.
 */

import { REPO_SALE_KIND, loanMonth, registerRedeem, sellRepossessed } from './repossession';
import { inspectIfDue } from './inspections';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { CAR_MODELS, type CarModel, type VehicleKind } from '../content/vehiclecatalog';
import { BIKE_MODELS } from '../content/bikecatalog';
import { RV_MODELS } from '../content/rvcatalog';
import { RIDE_MODELS } from '../content/ridecatalog';
import { CHARGING, EV_MODELS, evIncentives } from '../content/evcatalog';
import { chargingRewards, homeShareOf, kwhPrice } from './charging';
import { registerTint, tintAtInspection, tintFuelFactor, tintOnTheRoad, type TintKind } from './tint';
import { everydayFuel } from './fueltank';
import { registerInteriors } from './interiors';
import { optionsQuote, optionsRefusal, orderWeeksOf } from './caroptions';
import { modLoading, registerMods } from './mods';
import { ATV_FEES, ATV_INSURANCE } from '../content/rides';
import { BC, BIKE_FEES, BIKE_INSURANCE, RV_FEES, RV_INSURANCE, CA_STATE, CMX, CT, DEALER_DOC_FEE, DEPRECIATION, FUEL, GB, IE_MOTOR_TAX, INSURANCE, KM_A_YEAR, LOAN_RATES, NY, NY_REGISTRATION_BY_WEIGHT, ON, PERMITS, UNRATED_FUEL_USD_PER_KM, US_NEW_BELOW_STICKER, type Jurisdiction } from '../content/vehiclefees';
import { homeOf } from './earnings';
import { owe, payFromBank, spend } from './household';
import { mayDrive, type VehicleClass } from './documents';
import { gone, mayBeStolen, stolenNow } from './theft';
import { tireFactor, tireInsuranceFactor, tiresMonth } from './tires';
import { byRoad as roadBetween, drive } from './driving';
import { registerWraps } from './wraps';
import { mayCollide, registerCarCare, serviceMonth, servicingKept } from './carcare';
import { registerCarSale } from './carsale';
import { registerRoofBox, roofFuelFactor } from './roofbox';
import { NO_HISTORY_GB } from '../content/carcare';
import { registerStandIn } from './standin';
import { registerCarAudio } from './caraudio';
import { registerUsedCars, usedFault } from './usedcars';
import { faultCost, inShopNow, mayBreak, registerRepairs, upkeepPerKm } from './repairs';

const YEAR_MS = 365.2425 * MS_DAY;
const NYC = new Set(['us-ny-newyork', 'us-ny-brooklyn', 'us-ny-queens', 'us-ny-manhattan', 'us-ny-thebronx', 'us-ny-statenisland']);
export const VEHICLE_MONTH_KIND = 'vehicle.month';
export const VEHICLE_RENEWAL_KIND = 'vehicle.renewal';

/** Liters per 100 km for a motorcycle or scooter whose maker publishes none: the mean of the catalog's that do (from 2026-09-30). */
export const BIKE_UNRATED_PER100 = (() => { const rated = BIKE_MODELS.filter((m) => m.per100km !== null).map((m) => m.per100km!); return rated.reduce((a, x) => a + x, 0) / rated.length; })();

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

export interface OwnedVehicle {
  id: string;
  /** A shop's window tint (`systems/tint.ts`, from 2026-09-30). */
  tint?: TintKind;
  /** A hitch or towbar fitted, to tow a caravan (`systems/caravans.ts`, from 2026-09-30). */
  hitch?: boolean;
  /** Months an electric car has earned charging rewards at home (`systems/charging.ts`). */
  monthsCharged?: number;
  /** A full respray, declared to the insurer (`systems/mods.ts`, from 2026-09-30); an older save's, before `mods`. */
  resprayed?: boolean;
  /** Modifications fitted and declared (`systems/mods.ts`). */
  mods?: import('./mods').Mod[];
  modelId: string;
  /** When it was bought, and how old it was then: a used one's years. */
  boughtAt: Instant;
  ageAtPurchase: number;
  /** Its price new, in the model's money, cents: what its value falls from. */
  listPrice: Money;
  jurisdiction: Jurisdiction;
  cityId: string;
  coverage: 'full' | 'liability';
  /** The loan, where financed: what's owed, in the save's money, and the month's payment. */
  loan?: { owed: Money; monthly: Money; apr: number; monthsLeft: number; original?: Money; missed?: number; missedAmount?: Money };
  /** Taken back by the lender for payments missed, and when it's sold unless redeemed (`systems/repossession.ts`). */
  repossessed?: { at: Instant; saleAt: Instant };
  registrationDue: Instant;
  soldAt?: Instant;
  /** Kilometers driven since it was bought: every day's, and the journeys'. */
  km?: number;
  /** The town it's in, where not where it's registered: driven there. */
  at?: string;
  /** The last periodic inspection's due date met (`systems/inspections.ts`, from 2026-09-29). */
  inspected?: Instant;
  /** A set of winter tires on it (`systems/tires.ts`, from 2026-09-30). */
  winterTires?: import('./tires').WinterTires;
  /** Stolen, and when it comes back where it was found (`systems/theft.ts`, from 2026-09-30). */
  stolen?: { at: Instant; recoverAt?: Instant };
  /** An unscheduled repair it needs, and a garage that has it (`systems/repairs.ts`, from 2026-10-01). */
  fault?: import('./repairs').Fault;
  /** A stereo fitted (`systems/caraudio.ts`, from 2026-10-02). */
  stereo?: boolean;
  /** A roof rack fitted, and the liters of a roof box on it (`systems/roofbox.ts`, from 2026-10-03). */
  roofRack?: true;
  roofBoxL?: number;
  /** Listed for a private sale (`systems/carsale.ts`, from 2026-10-03). */
  listed?: import('./carsale').Listing;
  inShop?: import('./repairs').InShop;
  /** Kilometers driven on errands since the month's driving (`systems/trips.ts`), taken out of it. */
  errandKm?: number;
  /** Its interior as commissioned, and one ordered and not yet fitted (`systems/interiors.ts`, from 2026-10-02). */
  interior?: import('./interiors').Interior;
  interiorOrdered?: import('./interiors').Interior;
  /** The factory options it was built with, and when a factory order comes; until then it isn't the buyer's to drive (`systems/caroptions.ts`, from 2026-10-02). */
  options?: string[];
  deliveredAt?: Instant;
  /** How full its tank or battery is, 0 to 1 (`systems/fueltank.ts`, from 2026-10-02); an older save's is full. */
  fuelLevel?: number;
  /** A wrap in film over the paint (`systems/wraps.ts`, from 2026-10-01). */
  wrap?: import('./wraps').Wrap;
  /** Its services, and when one was first missed (`systems/carcare.ts`, from 2026-10-01). */
  services?: import('./carcare').Service[];
  serviceMissed?: Instant;
  /** Leased, not owned (`systems/leasing.ts`, from 2026-09-30): the lessor's until bought out. */
  lease?: import('./leasing').Lease;
}

/** What driving a car a distance costs in the save's money: fuel at the place's pump by its official economy, and upkeep; an electric car's kWh at the share charged at home (`systems/charging.ts`), none on a journey. */
export function runningCost(sim: Simulation, v: OwnedVehicle, km: number, homeShare = 0, road: 'town' | 'highway' = 'town'): Money {
  const m = modelById(v.modelId)!;
  if (m.fuel === 'ev' && m.kwhPer100km) {
    const kwh = (km * m.kwhPer100km) / 100;
    return inSave(sim, Math.round(kwh * kwhPrice(v.jurisdiction, homeShare) * tintFuelFactor(v) * roofFuelFactor(v, road)), CHARGING[v.jurisdiction].currency) + inSave(sim, Math.round(km * upkeepPerKm(m, v.jurisdiction)), 'USD');
  }
  const fuel = FUEL[v.jurisdiction];
  const litre = m.fuel === 'diesel' ? fuel.diesel : fuel.petrol;
  // A motorcycle or scooter its maker doesn't rate burns the mean of those that are; an unrated car, AAA's cost a mile.
  const per100 = m.per100km ?? (onTwoWheels(m) ? BIKE_UNRATED_PER100 : null);
  // Tint keeps the cabin cooler, and the air conditioning burns a little less (`systems/tint.ts`).
  const fuelCost = Math.round((per100 !== null ? inSave(sim, Math.round((km * per100 * litre) / 100), fuel.currency) : inSave(sim, Math.round(km * UNRATED_FUEL_USD_PER_KM), 'USD')) * tintFuelFactor(v) * roofFuelFactor(v, road));
  // Upkeep less the repairs drawn as faults (`systems/repairs.ts`); until 2026-10-01 all of AAA's.
  return fuelCost + inSave(sim, Math.round(km * upkeepPerKm(m, v.jurisdiction)), 'USD');
}

/** Upkeep for a distance in the save's money: AAA's, less the repairs drawn as faults (`systems/repairs.ts`). */
export const upkeepCost = (sim: Simulation, v: OwnedVehicle, km: number): Money => inSave(sim, Math.round(km * upkeepPerKm(modelById(v.modelId)!, v.jurisdiction)), 'USD');

/** A month of everyday driving, in kilometers: the place's published year, over twelve. */
export const monthKm = (v: OwnedVehicle) => KM_A_YEAR[v.jurisdiction] / 12;

/** The jurisdiction a town's car is registered in, where SLATE has its rules. */
export function jurisdictionOf(cityId: string): Jurisdiction | undefined {
  const city = CITIES.get(cityId);
  if (!city) return undefined;
  const region = city.parentId ?? '';
  if (city.countryId === 'us') return region === 'us-ny' ? 'US-NY' : region === 'us-ct' ? 'US-CT' : region === 'us-ca' ? 'US-CA' : undefined;
  if (city.countryId === 'uk') return 'GB';
  if (city.countryId === 'ie') return 'IE';
  if (city.countryId === 'ca') return region === 'ca-08' || cityId.startsWith('ca-on-') ? 'CA-ON' : region === 'ca-02' || cityId.startsWith('ca-bc-') ? 'CA-BC' : undefined;
  if (city.countryId === 'mx') return region === 'mx-09' || cityId.startsWith('mx-cmx') ? 'MX-CMX' : undefined;
  return undefined;
}

const MARKET: Record<Jurisdiction, CarModel['market']> = { 'US-NY': 'US', 'US-CT': 'US', 'US-CA': 'US', GB: 'GB', IE: 'IE', 'CA-ON': 'CA', 'CA-BC': 'CA', 'MX-CMX': 'MX' };
const CURRENCY: Record<Jurisdiction, string> = { 'US-NY': 'USD', 'US-CT': 'USD', 'US-CA': 'USD', GB: 'GBP', IE: 'EUR', 'CA-ON': 'CAD', 'CA-BC': 'CAD', 'MX-CMX': 'MXN' };

/**
 * A year's resident parking permit for a car kept on the street at home, in
 * the place's money, cents; nothing with a garage at a home owned there, or
 * where no permit is kept.
 */
export function parkingYear(person: Person, model: CarModel, cityId: string): { amount: Money; currency: string } | undefined {
  // A motorcycle's parking isn't kept: Westminster's and Dublin's permits are a car's.
  if (onTwoWheels(model) || forOutings(model)) return undefined;
  if ((person.homes ?? []).some((h) => h.cityId === cityId && !h.selling && (h.facts?.features ?? []).includes('garage'))) return undefined;
  if (cityId === PERMITS.london.cityId) {
    const pounds = model.fuel === 'ev' ? PERMITS.london.ev : bracket(PERMITS.london.bands, model.co2 ?? 150);
    return { amount: Math.round(pounds * 100), currency: PERMITS.london.currency };
  }
  if (cityId === PERMITS.dublin.cityId) return { amount: PERMITS.dublin.flat * 100, currency: PERMITS.dublin.currency };
  return undefined;
}

/** What a model is: a car where not said. */
export const kindOf = (m: CarModel): VehicleKind => m.kind ?? 'car';
/** Whether it's ridden on two wheels: a motorcycle's or a scooter's rules. */
export const onTwoWheels = (m: CarModel) => kindOf(m) === 'motorcycle' || kindOf(m) === 'scooter';
/** Whether it's for an outing, not the road: a bicycle, e-bike or ATV isn't driven every day or between towns (`systems/life.ts`). */
export const forOutings = (m: CarModel) => kindOf(m) === 'bicycle' || kindOf(m) === 'ebike' || kindOf(m) === 'atv';
/** Whether it's registered where it's kept, and so renews: a road vehicle, and an ATV where a renewal is asked. */
export function registers(m: CarModel, j: Jurisdiction): boolean {
  if (kindOf(m) === 'bicycle' || kindOf(m) === 'ebike') return false;
  if (kindOf(m) === 'atv') { const f = ATV_FEES[j as keyof typeof ATV_FEES]; return Boolean(f && 'renew' in f); }
  return true;
}

/** Whether it's a home on wheels, which a campground takes (`systems/stays.ts`). */
export const sleepsIn = (m: CarModel) => kindOf(m) === 'motorhome' || kindOf(m) === 'campervan';
/** The license class a model is ridden or driven on: a car license drives a van or any motorhome SLATE sells (New York's class D to 26,000 lb, Britain's B to 3,500 kg, Ontario's G to 11,000 kg). */
export const classFor = (m: CarModel): VehicleClass => (onTwoWheels(m) ? 'motorcycle' : 'car');

/** What's on sale where a town is, of a kind: cars, motorcycles or scooters. */
export function modelsFor(cityId: string, kind: VehicleKind = 'car'): CarModel[] {
  const j = jurisdictionOf(cityId);
  return j ? [...CAR_MODELS, ...EV_MODELS, ...BIKE_MODELS, ...RV_MODELS, ...RIDE_MODELS].filter((m) => m.market === MARKET[j] && kindOf(m) === kind) : [];
}

export const modelById = (id: string) => CAR_MODELS.find((m) => m.id === id) ?? EV_MODELS.find((m) => m.id === id) ?? BIKE_MODELS.find((m) => m.id === id) ?? RV_MODELS.find((m) => m.id === id) ?? RIDE_MODELS.find((m) => m.id === id);

/** The share of its value new a car keeps at an age: iSeeCars' points, straight lines between. */
export function kept(ageYears: number): number {
  const pts = DEPRECIATION;
  if (ageYears <= 0) return 1;
  for (let i = 1; i < pts.length; i += 1) {
    const [a1, l1] = pts[i]!;
    const [a0, l0] = pts[i - 1]!;
    if (ageYears <= a1) return 1 - (l0 + ((l1 - l0) * (ageYears - a0)) / (a1 - a0));
  }
  return 1 - pts[pts.length - 1]![1];
}

const bracket = (table: readonly (readonly [number, number])[], x: number) => table.find(([upTo]) => x <= upTo)?.[1] ?? table[table.length - 1]![1];
const stepOn = (steps: readonly (readonly [string, number])[], at: Instant) => { const day = new Date(at).toISOString().slice(0, 10); let v = steps[0]![1]; for (const [d, r] of steps) if (d <= day) v = r; return v; };
const lbOf = (m: CarModel) => (m.kerbKg ? m.kerbKg * 2.20462 : NY.assumedLb);

export interface Quote { currency: string; price: Money; lines: { label: string; amount: Money }[]; total: Money; basis: string }

/** What buying a car costs where one lives, in the jurisdiction's money, cents: its price and every tax and fee. */
export function quote(model: CarModel, cityId: string, at: Instant, opts: { age?: number; financed?: boolean; person?: Person; tradeIn?: { value: Money; payoff: Money; label: string }; options?: readonly string[] } = {}): Quote | string {
  const j = jurisdictionOf(cityId);
  if (!j) return 'SLATE doesn’t have that place’s car taxes and fees yet: it keeps New York, Connecticut, California, Great Britain, Ireland, Ontario, British Columbia and Mexico City.';
  if (model.market !== MARKET[j]) return 'That car is sold in another market.';
  const age = opts.age ?? 0;
  const used = age > 0;
  // A new car's factory options join its price before the taxes (`systems/caroptions.ts`, from 2026-10-02).
  const extras = !used && opts.options?.length ? optionsQuote(model, opts.options).cents : 0;
  const price = Math.round((model.price + (used ? 0 : model.delivery) + extras) * kept(age));
  const lines: { label: string; amount: Money }[] = [];
  const c = (x: number) => Math.round(x * 100);
  // A new car in America sells below its sticker by what buyers paid on average (KBB, from 2026-09-30).
  // KBB's average is for new cars and light trucks, a van among them; an RV's dealers aren't in it.
  const below = !used && j.startsWith('US-') && (kindOf(model) === 'car' || kindOf(model) === 'van') ? Math.round(price * US_NEW_BELOW_STICKER) : 0;
  if (below) lines.push({ label: 'Below The Sticker, What Buyers Paid On Average', amount: -below });
  const sold = price - below;
  const units = sold / 100;
  // A trade-in's value comes off the price New York and Connecticut tax, a dealer's sale; California taxes the whole (CDTFA).
  const taxedPrice = Math.max(0, sold - (opts.tradeIn?.value ?? 0));
  // A bicycle shop and an ATV dealer title nothing: the documentation fee is a road vehicle's.
  const doc = forOutings(model) ? undefined : DEALER_DOC_FEE[j];
  if (doc) lines.push({ label: doc.label, amount: c(used ? doc.used : doc.new) });
  if (forOutings(model)) lines.push(...outingLines(model, j, cityId, at, sold, taxedPrice));
  else if (onTwoWheels(model)) lines.push(...bikeLines(model, j, cityId, at, sold, taxedPrice));
  else switch (j) {
    case 'US-NY': {
      const rate = NYC.has(cityId) ? NY.nycRate : NY.stateRate;
      lines.push({ label: `Sales Tax, ${(rate * 100).toFixed(3).replace(/0+$/, '')}%${NYC.has(cityId) ? '' : ' (The State’s; The County’s Not Kept)'}`, amount: Math.round(taxedPrice * rate) });
      lines.push({ label: 'Title', amount: c(NY.title) }, { label: 'Plates', amount: c(NY.plates) });
      lines.push({ label: 'Registration, Two Years', amount: c(bracket(NY_REGISTRATION_BY_WEIGHT, lbOf(model)) + (NYC.has(cityId) ? NY.nycUseTax + NY.mctd : 0)) });
      break;
    }
    case 'US-CT': {
      lines.push({ label: units > CT.luxuryOver ? 'Sales Tax, 7.75% (Over $50,000)' : 'Sales Tax, 6.35%', amount: Math.round(taxedPrice * (units > CT.luxuryOver ? CT.luxuryRate : CT.rate)) });
      lines.push({ label: 'Registration And Its Fees, Three Years', amount: c(CT.registration + CT.admin + CT.cleanAir + CT.parks) });
      lines.push({ label: 'Title And Plate', amount: c(CT.title + CT.plate) });
      if (!used) lines.push({ label: 'Greenhouse Gas Fee And Emissions Exemption', amount: c(CT.greenhouseNew + CT.emissionsExemption) });
      if (opts.financed) lines.push({ label: 'Lien', amount: c(CT.lien) });
      break;
    }
    case 'US-CA': {
      const rate = cityId === 'us-ca-losangeles' ? stepOn(CA_STATE.losAngeles, at) : cityId === 'us-ca-sanfrancisco' ? CA_STATE.sanFrancisco : CA_STATE.baseRate;
      lines.push({ label: `Sales Tax, ${(rate * 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`, amount: Math.round(sold * rate) });
      lines.push({ label: 'Registration, The Year', amount: caYear(model, sold, age) });
      break;
    }
    case 'GB':
      // The makers' on-the-road prices include VAT, the first registration fee and the first year's VED.
      break;
    case 'IE':
      // The price includes VAT and VRT; the first year's motor tax is due.
      lines.push({ label: 'Motor Tax, The First Year', amount: c(bracket(IE_MOTOR_TAX, model.co2 ?? 150)) });
      break;
    case 'CA-ON':
      lines.push({ label: 'HST, 13%', amount: Math.round(price * ON.hst) });
      lines.push({ label: 'Permit And Plates', amount: c(ON.permit + ON.plate) });
      break;
    case 'CA-BC': {
      lines.push({ label: 'GST, 5%', amount: used ? 0 : Math.round(price * BC.gst) });
      const pst = bracket(BC.pst, units);
      lines.push({ label: `PST, ${Math.round(pst * 100)}%`, amount: Math.round(price * pst) });
      lines.push({ label: 'Registration, Plates And The Year’s License', amount: c(BC.registration + BC.plate + bracket(BC.licence, model.kerbKg ?? BC.assumedKg)) });
      break;
    }
    case 'MX-CMX':
      // The price includes IVA and ISAN; the tenencia is waived under MXN 638,000.
      lines.push({ label: 'Plates And Circulation Card', amount: c(CMX.plates) });
      if (units > CMX.tenenciaWaivedTo) lines.push({ label: 'Tenencia (Its Tariff Above The Waiver Isn’t Kept)', amount: 0 });
      break;
  }
  // What's given toward a new electric car at the sale (`evIncentives`): MyFirstEV to a first-time buyer only.
  if (!used) {
    const firstEv = !(opts.person?.vehicles ?? []).some((x) => modelById(x.modelId)?.fuel === 'ev');
    for (const l of evIncentives(model, j, at, firstEv)) lines.push({ label: l.label, amount: -l.amount });
  }
  // A resident's parking permit, where one's kept, and no garage at home.
  const permit = opts.person ? parkingYear(opts.person, model, cityId) : cityId === PERMITS.london.cityId || cityId === PERMITS.dublin.cityId ? parkingYear({ homes: [] } as unknown as Person, model, cityId) : undefined;
  if (permit) lines.push({ label: 'Resident Parking Permit, The Year', amount: permit.currency === CURRENCY[j] ? permit.amount : exchange(permit.amount, permit.currency, CURRENCY[j]) ?? permit.amount });
  // A car traded in: its value less any loan on it, off what's due.
  if (opts.tradeIn) lines.push({ label: `Trade-In, ${opts.tradeIn.label}`, amount: -(opts.tradeIn.value - opts.tradeIn.payoff) });
  const total = price + lines.reduce((a, l) => a + l.amount, 0);
  return { currency: CURRENCY[j], price, lines, total, basis: `${model.make} ${model.model} ${model.trim}: the maker’s price (${model.sourceType}), ${model.deliveryBasis}${used ? `, less ${Math.round((1 - kept(age)) * 100)}% for ${age} ${age === 1 ? 'year' : 'years'} (${'iSeeCars, SLATE’s lines between'})` : ''}${below ? `, and ${(US_NEW_BELOW_STICKER * 100).toFixed(1)}% below the sticker, what Kelley Blue Book found American buyers paid in August 2026` : ''}${doc ? '. The dealer’s documentation fee is the state’s cap, or in Connecticut, where none is set, the average its legislature found in 2016' : ''}.` };
}

/** The American state's sales tax rate on a car at a price, in dollars, where a town is: what a lease's payments are taxed at (`systems/leasing.ts`). */
export function usSalesTaxRate(j: Jurisdiction, cityId: string, at: Instant, units: number): number {
  if (j === 'US-NY') return NYC.has(cityId) ? NY.nycRate : NY.stateRate;
  if (j === 'US-CT') return units > CT.luxuryOver ? CT.luxuryRate : CT.rate;
  if (j === 'US-CA') return cityId === 'us-ca-losangeles' ? stepOn(CA_STATE.losAngeles, at) : cityId === 'us-ca-sanfrancisco' ? CA_STATE.sanFrancisco : CA_STATE.baseRate;
  return 0;
}

/** A motorcycle's or scooter's taxes and registration where it's bought, in the place's money, cents (`BIKE_FEES`). */
function bikeLines(model: CarModel, j: Jurisdiction, cityId: string, at: Instant, sold: Money, taxedPrice: Money): { label: string; amount: Money }[] {
  const c = (x: number) => Math.round(x * 100);
  const out: { label: string; amount: Money }[] = [];
  if (j.startsWith('US-')) {
    const rate = usSalesTaxRate(j, cityId, at, sold / 100);
    // California taxes the whole price; New York and Connecticut the price less a trade-in.
    out.push({ label: `Sales Tax, ${(rate * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}%`, amount: Math.round((j === 'US-CA' ? sold : taxedPrice) * rate) });
  }
  const r = renewal({ modelId: model.id, jurisdiction: j, cityId, boughtAt: at, ageAtPurchase: 0, listPrice: sold } as OwnedVehicle, at);
  switch (j) {
    case 'US-NY': out.push({ label: 'Title', amount: c(BIKE_FEES.NY.title) }, { label: 'Registration, The Year', amount: r.amount }); break;
    case 'US-CT': out.push({ label: 'Title And Plate', amount: c(BIKE_FEES.CT.title + BIKE_FEES.CT.plate) }, { label: 'Registration And Its Fees, The Year', amount: r.amount }); break;
    case 'US-CA': out.push({ label: 'Registration, The Year', amount: r.amount }); break;
    case 'GB': break;
    case 'IE': out.push({ label: 'Motor Tax, The First Year', amount: r.amount }); break;
    case 'CA-ON': out.push({ label: 'HST, 13%', amount: Math.round(sold * ON.hst) }, { label: 'Permit And Plates', amount: c(ON.permit + ON.plate) }); break;
    case 'CA-BC': {
      const pst = bracket(BC.pst, sold / 100);
      out.push({ label: 'GST, 5%', amount: Math.round(sold * BC.gst) }, { label: `PST, ${Math.round(pst * 100)}%`, amount: Math.round(sold * pst) }, { label: 'Registration, Plate And The Year’s License', amount: c(BC.registration + BC.plate) + r.amount });
      break;
    }
    case 'MX-CMX': out.push({ label: 'Alta, Plate And Circulation Card', amount: c(BIKE_FEES.CMX.alta) }, { label: 'Tenencia, The Year', amount: bikeTenencia(sold) }); break;
  }
  return out;
}

/**
 * A bicycle's, e-bike's or ATV's taxes where it's bought, and an ATV's
 * registration (`ATV_FEES`), in the place's money, cents. British Columbia
 * charges no PST on a bicycle or an e-bike (PST Bulletin 110) and its PST on an
 * ATV; the rest as a road vehicle's sale.
 */
function outingLines(model: CarModel, j: Jurisdiction, cityId: string, at: Instant, sold: Money, taxedPrice: Money): { label: string; amount: Money }[] {
  const out: { label: string; amount: Money }[] = [];
  if (j.startsWith('US-')) {
    const rate = usSalesTaxRate(j, cityId, at, sold / 100);
    out.push({ label: `Sales Tax, ${(rate * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}%`, amount: Math.round((j === 'US-CA' ? sold : taxedPrice) * rate) });
  }
  if (j === 'CA-ON') out.push({ label: 'HST, 13%', amount: Math.round(sold * ON.hst) });
  if (j === 'CA-BC') {
    out.push({ label: 'GST, 5%', amount: Math.round(sold * BC.gst) });
    if (kindOf(model) === 'atv') { const pst = bracket(BC.pst, sold / 100); out.push({ label: `PST, ${Math.round(pst * 100)}%`, amount: Math.round(sold * pst) }); }
  }
  const f = kindOf(model) === 'atv' ? ATV_FEES[j as keyof typeof ATV_FEES] : undefined;
  if (f) out.push({ label: f.label, amount: Math.round(f.first * 100) });
  return out;
}

/** Mexico City's tenencia on a motorcycle's value, cents: 3% before IVA, subsidized whole to MXN 250,000. */
function bikeTenencia(value: Money): Money {
  return value / 100 <= BIKE_FEES.CMX.subsidizedTo ? 0 : Math.round((value / 1.16) * BIKE_FEES.CMX.tenencia);
}

/** California's year: registration, the CHP fee, the vehicle license fee on the value, the transportation improvement fee, and the ZEV fee. */
export function caYear(model: CarModel, value: Money, age = 0): Money {
  const v = value / 100;
  // The smog abatement fee, to a car's eighth year, in place of the smog check; none on an electric car.
  const abatement = model.fuel === 'ev' ? 0 : CA_STATE.abatement.find(([upTo]) => age < upTo)?.[1] ?? 0;
  return Math.round((CA_STATE.registration + CA_STATE.chp + bracket(CA_STATE.tif, v) + (model.fuel === 'ev' ? CA_STATE.zev : 0) + abatement) * 100 + value * CA_STATE.vlf);
}

/**
 * Moving home takes the car where a road reaches (from 2026-09-29): it's
 * driven there, and within one country it's registered in the new state or
 * province at that place's registration, and its title and plates where
 * they're charged. Across a border the car keeps its registration: importing
 * one isn't kept. Until then a car stayed where it was bought, and a life
 * that moved on left it there.
 */
export function carryCars(sim: Simulation, person: Person, fromCity: string, toCity: string): void {
  if (fromCity === toCity) return;
  for (const v of vehiclesOf(person)) {
    // A bicycle, e-bike or ATV goes with the household, wherever it moves; its registration isn't moved (from 2026-09-30).
    if (v.soldAt === undefined && (v.at ?? v.cityId) === fromCity && forOutings(modelById(v.modelId)!)) { v.at = toCity; continue; }
    if (v.soldAt !== undefined || (v.at ?? v.cityId) !== fromCity || !roadBetween(fromCity, toCity)) continue;
    v.at = toCity;
    const j = jurisdictionOf(toCity);
    const sameCountry = CITIES.get(fromCity)?.countryId === CITIES.get(toCity)?.countryId;
    if (!j || j === v.jurisdiction || !sameCountry) continue;
    const moved: OwnedVehicle = { ...v, jurisdiction: j, cityId: toCity };
    const r = renewal(moved, sim.now);
    const c = (x: number) => Math.round(x * 100);
    const bike = onTwoWheels(modelById(v.modelId)!);
    const once = bike && j === 'US-NY' ? c(BIKE_FEES.NY.title) : bike && j === 'US-CT' ? c(BIKE_FEES.CT.title + BIKE_FEES.CT.plate) : j === 'US-NY' ? c(NY.title + NY.plates) : j === 'US-CT' ? c(CT.title + CT.plate + CT.admin) : j === 'US-CA' ? c(15) : j === 'CA-ON' ? c(ON.permit + ON.plate) : j === 'CA-BC' ? c(BC.registration + BC.plate) : 0;
    const due = inSave(sim, r.amount + once, CURRENCY[j]);
    const m = modelById(v.modelId)!;
    if (due > 0 && !payFromBank(sim, person, due, `Registering the ${m.make} ${m.model} in its new home`, 'vehicle')) owe(sim, person, due, 'Registering the car', 'vehicle');
    v.jurisdiction = j;
    v.cityId = toCity;
    v.registrationDue = r.next;
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.kind === VEHICLE_RENEWAL_KIND && item.payload.vehicleId === v.id) sim.timeline.cancel(item.id, sim.now);
    sim.schedule({ at: r.next, kind: VEHICLE_RENEWAL_KIND, label: 'Registration Renewal', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id } });
  }
}

/**
 * What a dealer gives for a car traded in, in the save's money: its value, and
 * in Britain about 4% less, the published gap between a part-exchange and a
 * private sale (Auto Express, 2024, secondary). No gap is published in
 * America, so a trade-in there is taken at the car's value, said so.
 */
export function tradeInValue(sim: Simulation, v: OwnedVehicle): Money {
  const m = modelById(v.modelId)!;
  return inSave(sim, Math.round(valueOf(v, sim.now) * (v.jurisdiction === 'GB' ? 0.96 : 1)), m.currency);
}

/** A car traded in where a town is, for its quote: its value and its loan in that place's money. */
export function tradeInFor(sim: Simulation, cityId: string, v: OwnedVehicle): { value: Money; payoff: Money; label: string } | undefined {
  const j = jurisdictionOf(cityId);
  if (!j || v.soldAt !== undefined || v.repossessed || v.lease || stolenNow(v, sim.now)) return undefined;
  const cur = saveCurrency(sim.universe);
  const toJ = (c: Money) => (cur === CURRENCY[j] ? c : exchange(c, cur, CURRENCY[j]) ?? c);
  const m = modelById(v.modelId)!;
  return { value: toJ(tradeInValue(sim, v)), payoff: toJ(v.loan?.owed ?? 0), label: `${m.make} ${m.model}` };
}

/** Whether a car of theirs can be sold now, and why not. */
export function sellRefusal(sim: Simulation, person: Person, vehicleId: string): string | undefined {
  const v = vehiclesOf(person).find((x) => x.id === vehicleId && x.soldAt === undefined);
  if (!v) return 'That isn’t a car you own.';
  if (v.repossessed) return 'The lender has it: redeem it, or it’s sold for the loan.';
  if (stolenNow(v, sim.now)) return 'It’s been stolen.';
  if (v.lease) return 'A leased car is the lessor’s to sell: at the lease’s end it’s returned or bought out.';
  return undefined;
}

/**
 * A car sold for a price in the save's money: the loan paid off first, what's
 * left to the bank, and a loan bigger than the car paid from it; what it had
 * booked stood down. What came to them after the loan.
 */
export function sellVehicle(sim: Simulation, person: Person, v: OwnedVehicle, value: Money, memo: string): Money {
  const payoff = v.loan?.owed ?? 0;
  sim.post({ memo, category: 'vehicle', postings: [{ accountId: person.primaryAccountId!, amount: value - payoff }, { accountId: sim.nominalAccount('liability_other', 'Car Loans').id, amount: payoff }, { accountId: sim.nominalAccount('income', 'Car Sold').id, amount: -value }] });
  v.soldAt = sim.now;
  delete v.loan;
  delete v.listed;
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.payload.vehicleId === v.id) sim.timeline.cancel(item.id, sim.now);
  return value - payoff;
}

/** A car's value now, in its money: its price new less what the curve says it's lost, and less a repair it needs (`systems/repairs.ts`). */
export function valueOf(v: OwnedVehicle, at: Instant): Money {
  // In Britain, a car whose servicing wasn't kept is worth less (`NO_HISTORY_GB`, from 2026-10-01).
  const history = v.jurisdiction === 'GB' && !servicingKept(v, modelById(v.modelId)!, at) ? 1 - NO_HISTORY_GB : 1;
  return Math.max(0, Math.round(v.listPrice * kept(v.ageAtPurchase + (at - v.boughtAt) / YEAR_MS) * history) - faultCost(v, modelById(v.modelId)!.currency));
}

/** A renewal's fee in the jurisdiction's money, cents, and when the next is due. */
export function renewal(v: OwnedVehicle, at: Instant): { amount: Money; next: Instant; memo: string } {
  const m = modelById(v.modelId)!;
  const age = v.ageAtPurchase + (at - v.boughtAt) / YEAR_MS;
  const year = (n: number) => at + n * YEAR_MS;
  const c = (x: number) => Math.round(x * 100);
  // An ATV renews where it's asked (`ATV_FEES`); a bicycle never registers.
  if (kindOf(m) === 'atv') { const f = ATV_FEES[v.jurisdiction as keyof typeof ATV_FEES]; return f && 'renew' in f ? { amount: c(f.renew), next: year(f.years), memo: 'ATV registration renewed' } : { amount: 0, next: year(100), memo: 'No registration asked' }; }
  if (kindOf(m) === 'bicycle' || kindOf(m) === 'ebike') return { amount: 0, next: year(100), memo: 'No registration asked' };
  // Ireland taxes a van as a goods vehicle and a motorhome as a motor caravan.
  if (v.jurisdiction === 'IE' && kindOf(m) === 'van') return { amount: c(RV_FEES.IE.goods), next: year(1), memo: 'Motor tax, the year, a goods vehicle' };
  if (v.jurisdiction === 'IE' && sleepsIn(m)) return { amount: c(RV_FEES.IE.motorCaravan), next: year(1), memo: 'Motor tax, the year, a motor caravan' };
  // Britain's light goods rate on a van, and its private light goods rate on a motorhome (`RV_FEES`).
  if (v.jurisdiction === 'GB' && kindOf(m) === 'van') { const built = new Date(v.boughtAt - v.ageAtPurchase * YEAR_MS).toISOString().slice(0, 10); const [from, to] = RV_FEES.GB.euro45; return { amount: c(built >= from && built <= to ? RV_FEES.GB.vanEuro45 : RV_FEES.GB.van), next: year(1), memo: 'Vehicle tax, the year, a van' }; }
  if (v.jurisdiction === 'GB' && sleepsIn(m)) return { amount: c(RV_FEES.GB.motorCaravan), next: year(1), memo: 'Vehicle tax, the year, a motor caravan' };
  if (onTwoWheels(m)) {
    const cc = m.cc ?? 125;
    switch (v.jurisdiction) {
      case 'US-NY': return { amount: c(BIKE_FEES.NY.registration), next: year(1), memo: 'Motorcycle registration, the year' };
      case 'US-CT': return { amount: c(BIKE_FEES.CT.registration + BIKE_FEES.CT.cleanAir + BIKE_FEES.CT.parks), next: year(1), memo: 'Motorcycle registration, the year' };
      case 'US-CA': return { amount: caYear(m, valueOf(v, at)) + c(BIKE_FEES.CA.safety), next: year(1), memo: 'Motorcycle registration, the year' };
      case 'GB': return { amount: c(bracket(BIKE_FEES.GB.ved, cc)), next: year(1), memo: 'Vehicle tax, the year' };
      case 'IE': return { amount: c(bracket(BIKE_FEES.IE.motorTax, cc)), next: year(1), memo: 'Motor tax, the year' };
      case 'CA-ON': return { amount: 0, next: year(1), memo: 'Plate renewed, the year (free since 2022)' };
      case 'CA-BC': return { amount: c(BIKE_FEES.BC.licence), next: year(1), memo: 'License renewed, the year' };
      case 'MX-CMX': return { amount: c(BIKE_FEES.CMX.refrendo) + bikeTenencia(valueOf(v, at)), next: year(1), memo: 'Refrendo and tenencia, the year' };
    }
  }
  switch (v.jurisdiction) {
    case 'US-NY': return { amount: c(bracket(NY_REGISTRATION_BY_WEIGHT, lbOf(m)) + (NYC.has(v.cityId) ? NY.nycUseTax + NY.mctd : 0)), next: year(2), memo: 'Registration renewed, two years' };
    case 'US-CT': return { amount: c(CT.registration + CT.admin + CT.cleanAir + CT.parks), next: year(3), memo: 'Registration renewed, three years' };
    case 'US-CA': return { amount: caYear(m, valueOf(v, at), age), next: year(1), memo: 'Registration renewed, the year' };
    case 'GB': return { amount: c(GB.vedStandard + (age < 6 && m.price / 100 > (m.fuel === 'ev' ? GB.supplementOverEv : GB.supplementOver) ? GB.supplement : 0)), next: year(1), memo: 'Vehicle tax, the year' };
    case 'IE': return { amount: c(bracket(IE_MOTOR_TAX, m.co2 ?? 150)), next: year(1), memo: 'Motor tax, the year' };
    case 'CA-ON': return { amount: 0, next: year(1), memo: 'Plate renewed, the year (free since 2022)' };
    case 'CA-BC': return { amount: c(bracket(BC.licence, m.kerbKg ?? BC.assumedKg)), next: year(1), memo: 'License renewed, the year' };
    case 'MX-CMX': return { amount: c(CMX.refrendo), next: year(1), memo: 'Refrendo, the year' };
  }
}

/** What a model's insurance figure is, said plainly. */
export function insuranceBasis(j: Jurisdiction, m: CarModel): string | undefined {
  if (kindOf(m) === 'bicycle' || kindOf(m) === 'ebike') return 'None asked, and none kept';
  if (kindOf(m) === 'atv') return j.startsWith('US-') ? ATV_INSURANCE.basis : 'No premium was found here, and none is charged';
  if (sleepsIn(m) && RV_INSURANCE[j]) return RV_INSURANCE[j]!.basis;
  if (onTwoWheels(m)) return BIKE_INSURANCE[j].basis;
  const car = INSURANCE[j]?.basis;
  return car && kindOf(m) !== 'car' ? `A car’s, as none is published for it: ${car}` : car;
}

/** Whether liability-only cover is offered for a model where it's kept: a car's or van's where the place's is published, a scooter's where one is. */
export function liabilityOffered(j: Jurisdiction, m: CarModel): boolean {
  if (kindOf(m) === 'atv') return j.startsWith('US-');
  if (forOutings(m)) return false;
  if (onTwoWheels(m)) return kindOf(m) === 'scooter' && BIKE_INSURANCE[j].scooterLiability !== undefined;
  if (sleepsIn(m) && RV_INSURANCE[j]) return false;
  return INSURANCE[j]?.liability !== undefined;
}

/** The money a model's insurance is quoted in where it's kept. */
export function insuranceCurrency(j: Jurisdiction, m: CarModel): string {
  if (kindOf(m) === 'atv' && j.startsWith('US-')) return ATV_INSURANCE.currency;
  if (sleepsIn(m) && RV_INSURANCE[j]) return RV_INSURANCE[j]!.currency;
  return onTwoWheels(m) ? BIKE_INSURANCE[j].currency : CURRENCY[j];
}

/** A month's insurance in the jurisdiction's money, cents, or why there isn't one: a car's, or a motorcycle's or scooter's by its kind and engine. */
export function monthlyInsurance(j: Jurisdiction, coverage: OwnedVehicle['coverage'], model?: CarModel): Money | string {
  // A motorhome's or campervan's where an RV average is published; elsewhere, and a van, a car's (`RV_INSURANCE`).
  if (model && (kindOf(model) === 'bicycle' || kindOf(model) === 'ebike')) return 0;
  if (model && kindOf(model) === 'atv') return j.startsWith('US-') ? Math.round(((coverage === 'liability' ? ATV_INSURANCE.liability : ATV_INSURANCE.full) * 100) / 12) : 0;
  const rv = model && sleepsIn(model) ? RV_INSURANCE[j] : undefined;
  if (rv) return Math.round((rv.year * 100) / 12);
  if (model && onTwoWheels(model)) {
    const b = BIKE_INSURANCE[j];
    const cc = model.cc ?? 125;
    const scooter = kindOf(model) === 'scooter';
    const year = scooter && coverage === 'liability' && b.scooterLiability ? b.scooterLiability
      : scooter && cc <= 50 && b.moped ? b.moped
      : scooter && b.scooter ? b.scooter
      : typeof b.motorcycle === 'number' ? b.motorcycle : bracket(b.motorcycle, cc);
    return Math.round((year * 100) / 12);
  }
  const ins = INSURANCE[j];
  if (!ins) return 'SLATE doesn’t have that place’s insurance premiums yet.';
  const year = coverage === 'liability' && ins.liability ? ins.liability : ins.full;
  return Math.round((year * 100) / 12);
}

/** The loan rate for a car where one lives, and for a record: the US's by credit tier, new or used; elsewhere the published rate. */
export function loanRate(j: Jurisdiction, score: number, used: boolean): number | undefined {
  if (j.startsWith('US-')) return (used ? LOAN_RATES.usUsed : LOAN_RATES.usNew).find(([from]) => score >= from)![1];
  if (j === 'CA-ON' || j === 'CA-BC') return LOAN_RATES.CA;
  if (j === 'MX-CMX') return LOAN_RATES.MX;
  if (j === 'IE') return LOAN_RATES.IE;
  if (j === 'GB') return LOAN_RATES.GB;
  return undefined;
}

export function amortized(principal: Money, apr: number, months: number): Money {
  const r = apr / 12;
  return r === 0 ? Math.round(principal / months) : Math.round((principal * r) / (1 - (1 + r) ** -months));
}

export const vehiclesOf = (person: Person) => (person.vehicles ??= []);

/** Whether it has side windows a shop could tint: not a motorcycle, a scooter, a bicycle or an ATV. */
export const glazed = (v: OwnedVehicle): boolean => { const m = modelById(v.modelId); return !!m && !onTwoWheels(m) && !forOutings(m); };

export function buyRefusal(sim: Simulation, person: Person, modelId: string, opts: { age?: number; financed?: boolean; coverage?: OwnedVehicle['coverage']; options?: readonly string[] }): string | undefined {
  const model = modelById(modelId);
  if (!model) return 'SLATE doesn’t sell that car.';
  const bad = optionsRefusal(model, opts.options ?? [], opts.age ?? 0);
  if (bad) return bad;
  const q = quote(model, homeOf(person), sim.now, { ...opts, person });
  if (typeof q === 'string') return q;
  const j = jurisdictionOf(homeOf(person))!;
  const ins = monthlyInsurance(j, opts.coverage ?? 'full', model);
  if (typeof ins === 'string') return ins;
  // A motorcycle's or scooter's liability-only cover is kept only where it's published.
  if (kindOf(model) !== 'car' && !forOutings(model) && opts.coverage === 'liability' && !liabilityOffered(j, model)) return 'Liability-only cover for this isn’t kept here: full cover.';
  if (opts.financed && opts.coverage === 'liability') return 'A lender asks for full cover on a car it finances.';
  if (opts.financed && loanRate(j, person.credit?.score ?? 0, (opts.age ?? 0) > 0) === undefined) return 'SLATE doesn’t have a published car loan rate there yet: buy it outright.';
  if ((opts.age ?? 0) < 0 || (opts.age ?? 0) > 15) return 'A used car of up to fifteen years.';
  return undefined;
}

export function registerVehicles(sim: Simulation): void {
  sim.onCommand<{ modelId: string; age?: number; financed?: boolean; months?: number; coverage?: OwnedVehicle['coverage']; tradeIn?: string; options?: string[] }, { vehicleId: string; paid: Money; monthly?: Money; deliveredAt?: Instant }>('vehicle.buy', (p, { sim: s }) => {
    const person = s.player;
    const age = Math.max(0, Math.round(Number(p?.age ?? 0)));
    const financed = p?.financed === true;
    const coverage = p?.coverage === 'liability' ? 'liability' : 'full';
    const options = Array.isArray(p?.options) ? p.options.map(String) : [];
    const no = buyRefusal(s, person, String(p?.modelId), { age, financed, coverage, options });
    if (no) throw new CommandError(no);
    const model = modelById(String(p.modelId))!;
    const cityId = homeOf(person);
    const j = jurisdictionOf(cityId)!;
    // A car traded in: owned, not the lender's, taken at a dealer's value, its loan paid off from it.
    const old = p?.tradeIn ? vehiclesOf(person).find((x) => x.id === p.tradeIn && x.soldAt === undefined) : undefined;
    if (p?.tradeIn && !old) throw new CommandError('That isn’t a car you own.');
    if (old?.repossessed) throw new CommandError('The lender has that car.');
    if (old?.lease) throw new CommandError('A leased car is the lessor’s: it’s returned or bought out at the lease’s end, not traded.');
    const trade = old ? tradeInFor(s, cityId, old) : undefined;
    const q = quote(model, cityId, s.now, { age, financed, person, options, ...(trade ? { tradeIn: trade } : {}) }) as Quote;
    const total = inSave(s, q.total, q.currency);
    const cur = saveCurrency(s.universe);
    // Financed, the price is lent and the taxes and fees paid down, as a dealer arranges it.
    // A trade-in worth more than the taxes and fees comes off what's lent.
    const lent = financed ? Math.max(0, Math.min(inSave(s, q.price, q.currency), total)) : 0;
    const down = Math.max(0, total - lent);
    if (!payFromBank(s, person, down, `${model.make} ${model.model}${age ? `, ${age} years old` : ', new'}${financed ? ', the taxes and fees' : ''}`, 'vehicle')) throw new CommandError(`${formatMoney(down, cur)} is more than the bank can cover.`);
    const id = s.nextId('vehicle');
    const v: OwnedVehicle = { id, modelId: model.id, boughtAt: s.now, ageAtPurchase: age, listPrice: model.price, jurisdiction: j, cityId, coverage, registrationDue: renewal({ id, modelId: model.id, boughtAt: s.now, ageAtPurchase: age, listPrice: model.price, jurisdiction: j, cityId, coverage, registrationDue: 0 }, s.now).next };
    // Built to order: its options kept, and the car the buyer's once it comes.
    if (options.length) v.options = options;
    if (optionsQuote(model, options).factory) v.deliveredAt = s.now + orderWeeksOf(model)!.weeks * 7 * MS_DAY;
    if (financed) {
      const months = Math.max(12, Math.min(84, Math.round(Number(p?.months ?? 60))));
      const apr = loanRate(j, person.credit?.score ?? 0, age > 0)!;
      v.loan = { owed: lent, monthly: amortized(lent, apr, months), apr, monthsLeft: months, original: lent };
      s.post({ memo: `A car loan, ${model.make} ${model.model}`, category: 'vehicle', postings: [{ accountId: s.nominalAccount('expense', 'Vehicles').id, amount: lent }, { accountId: s.nominalAccount('liability_other', 'Car Loans').id, amount: -lent }] });
    }
    if (old && trade) {
      // The old car to the dealer: its loan paid off, its value the credit spent on this one.
      const value = inSave(s, trade.value, q.currency);
      const payoff = old.loan?.owed ?? 0;
      s.post({ memo: `Traded in the ${trade.label}`, category: 'vehicle', postings: [{ accountId: s.nominalAccount('liability_other', 'Car Loans').id, amount: payoff }, { accountId: s.nominalAccount('income', 'Car Sold').id, amount: -value }, { accountId: s.nominalAccount('expense', 'Vehicles').id, amount: value - payoff }] });
      old.soldAt = s.now;
      delete old.loan;
      for (const item of s.universe.scheduled) if (item.status === 'pending' && item.payload.vehicleId === old.id) s.timeline.cancel(item.id, s.now);
    }
    // A used car comes with the fault it has, at the AA's seven in ten (`usedFault`, from 2026-10-02).
    const hidden = usedFault(s, person, model.id, age, cityId, s.now);
    if (hidden) v.fault = hidden;
    vehiclesOf(person).push(v);
    s.schedule({ at: s.now + 30 * MS_DAY, kind: VEHICLE_MONTH_KIND, label: 'The Car’s Month', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: id } });
    if (registers(model, j)) s.schedule({ at: v.registrationDue, kind: VEHICLE_RENEWAL_KIND, label: 'Registration Renewal', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: id } });
    return { vehicleId: id, paid: down, ...(v.loan ? { monthly: v.loan.monthly } : {}), ...(v.deliveredAt ? { deliveredAt: v.deliveredAt } : {}) };
  });

  registerRedeem(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined));
  registerTint(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined), glazed);
  registerMods(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined), glazed);
  registerRoofBox(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined));
  registerCarAudio(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined && !x.repossessed && !x.lease));
  registerUsedCars(sim, jurisdictionOf, homeOf);
  registerStandIn(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined));
  registerCarCare(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined && !x.repossessed && !stolenNow(x, sim.now)), (v) => modelById(v.modelId)!);
  registerInteriors(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined && !x.repossessed && !stolenNow(x, sim.now)));
  registerWraps(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined && !x.repossessed && !stolenNow(x, sim.now)), (v) => modelById(v.modelId)!, (v) => liabilityOffered(v.jurisdiction, modelById(v.modelId)!));
  registerRepairs(sim, (person, id) => vehiclesOf(person).find((x) => x.id === id && x.soldAt === undefined && !x.repossessed && !stolenNow(x, sim.now)), (v) => modelById(v.modelId)!);
  sim.onSchedule(REPO_SALE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const v = person ? vehiclesOf(person).find((x) => x.id === item.payload.vehicleId) : undefined;
    if (!person || !v || !v.repossessed || v.soldAt !== undefined) return;
    const m = modelById(v.modelId)!;
    sellRepossessed(s, person, v, inSave(s, valueOf(v, s.now), m.currency), `${m.make} ${m.model}`);
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.payload.vehicleId === v.id) s.timeline.cancel(one.id, s.now);
  });

  // Sold to a dealer at its offer, or listed to sell privately (`systems/carsale.ts`, from 2026-10-03; until then sold at once at its full value).
  registerCarSale(sim);

  sim.onSchedule(VEHICLE_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const v = person ? vehiclesOf(person).find((x) => x.id === item.payload.vehicleId) : undefined;
    if (!person || !v || v.soldAt !== undefined) return;
    const m = modelById(v.modelId)!;
    // With the lender, it's neither insured, driven nor paid for: the notice runs to its sale.
    if (v.repossessed) { s.schedule({ at: item.at + 30 * MS_DAY, kind: VEHICLE_MONTH_KIND, label: 'The Car’s Month', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id } }); return; }
    // Stolen this month, at the place's rate, or back where it was found (`systems/theft.ts`).
    if (v.stolen?.recoverAt !== undefined && v.stolen.recoverAt <= s.now) delete v.stolen;
    mayBeStolen(s, person, v, m, valueOf(v, s.now), m.currency);
    if (v.soldAt !== undefined) return;
    const missing = stolenNow(v, s.now);
    // Insurance, the month's share of the year.
    const ins = monthlyInsurance(v.jurisdiction, v.coverage, m);
    if (typeof ins === 'number' && ins > 0 && !missing) {
      const due = Math.round(inSave(s, ins, insuranceCurrency(v.jurisdiction, m)) * tireInsuranceFactor(v) * modLoading(v));
      if (!payFromBank(s, person, due, `${kindOf(m) === 'car' ? 'Car insurance' : 'Insurance'}, the ${m.make} ${m.model}`, 'vehicle')) owe(s, person, due, kindOf(m) === 'car' ? 'Car insurance' : 'Vehicle insurance', 'vehicle');
    }
    // A month's everyday driving, for someone who may drive: fuel and upkeep, and what the road brings (`systems/driving.ts`).
    // Only where the owner lives: a car left in another town sits. Until 2026-09-29 one left in New Haven was driven every day by its owner in Dublin.
    let driven = 0;
    // Broken down, or at the garage, it stays put (`systems/repairs.ts`).
    if (!v.repossessed && !missing && !forOutings(m) && !v.fault?.severe && !inShopNow(v, s.now) && !(v.deliveredAt !== undefined && v.deliveredAt > item.at) && (v.at ?? v.cityId) === homeOf(person) && mayDrive(person, v.at ?? v.cityId, s.now, s.now, classFor(m), m.cc).ok) {
      // The month's everyday driving, less what errands have already driven and paid for (`systems/trips.ts`).
      const km = Math.max(0, monthKm(v) - (v.errandKm ?? 0));
      const errandKm = v.errandKm ?? 0;
      v.errandKm = 0;
      // Through the tank where one is kept (`systems/fueltank.ts`, from 2026-10-02): the month's fill-ups, and
      // upkeep on every kilometer, the errands' too, whose fuel came out of the tank. Tried on a copy, and kept if paid.
      const trial = { ...v };
      const filled = everydayFuel(s, trial, km, homeShareOf(person));
      const run = filled ? filled.cost + upkeepCost(s, v, km + errandKm) : runningCost(s, v, km, homeShareOf(person));
      // Fuel is bought at the pump, by the bank or the card: a month neither can pay for, the car isn't driven. Until
      // 2026-09-29 the fuel went into arrears as if it had been burned, and a New York life starved paying for it.
      if (spend(s, person, run, `Fuel and upkeep, the ${m.make} ${m.model}`, 'vehicle')) {
        if (filled) v.fuelLevel = trial.fuelLevel;
        // The utility's rewards for charging at home off the peak (`systems/charging.ts`).
        const reward = m.fuel === 'ev' && m.kwhPer100km ? chargingRewards(s, person, v.jurisdiction, (km * m.kwhPer100km * homeShareOf(person)) / 100, v.monthsCharged ?? 0, zonedParts(item.at, s.homeZone).month) : 0;
        if (reward > 0) { s.post({ memo: 'Charging rewards, the month', category: 'vehicle', postings: [{ accountId: person.primaryAccountId!, amount: reward }, { accountId: s.nominalAccount('income', 'Charging Rewards').id, amount: -reward }] }); v.monthsCharged = (v.monthsCharged ?? 0) + 1; }
        v.km = (v.km ?? 0) + km;
        drive(s, person, v.jurisdiction, km, item.at, `${v.id}-${item.at}`, kindOf(m), tireFactor(v, item.at));
        driven = km;
        // And may need a repair for it, or meet another car (`systems/carcare.ts`).
        mayBreak(s, person, v, m, item.at);
        if (mayCollide(s, person, v, m, inSave(s, valueOf(v, item.at), m.currency), item.at) && v.soldAt !== undefined) return;
        // Tint darker than the law allows, on the road (`systems/tint.ts`).
        tintOnTheRoad(s, person, v, item.at);
      }
    }
    // A service gone past due without one, missed for good (`systems/carcare.ts`).
    serviceMonth(v, m, item.at);
    // Winter tires: the kilometers on them, Ontario's switchovers, a set worn out (`systems/tires.ts`).
    if (!missing) tiresMonth(s, person, v, driven, item.at);
    // An inspection come due, where the law asks one (`systems/inspections.ts`).
    // An electric car in Mexico City is exempt from the verificación, its green plates say, and in California from the smog check (from 2026-09-30).
    if (!forOutings(m) && !missing && !(m.fuel === 'ev' && (v.jurisdiction === 'MX-CMX' || v.jurisdiction === 'US-CA')) && inspectIfDue(s, person, v, kindOf(m))) tintAtInspection(s, person, v);
    // The loan: interest on what's owed, and the rest off it.
    if (v.loan) {
      const interest = Math.round((v.loan.owed * v.loan.apr) / 12);
      const payment = Math.min(v.loan.monthly, v.loan.owed + interest);
      const principal = payment - interest;
      const paid = payFromBank(s, person, payment, `Car loan payment, the ${m.make} ${m.model}`, 'vehicle');
      if (!paid) owe(s, person, payment, 'Car loan payment', 'vehicle');
      // Missed payments counted, and the car taken where the law lets the lender (`systems/repossession.ts`).
      loanMonth(s, person, v, paid, payment, `${m.make} ${m.model}`);
      // The payment above was booked to Vehicles; its principal part moves off the loan, the interest stays the cost.
      s.post({ memo: 'Car loan, principal repaid', category: 'vehicle', postings: [{ accountId: s.nominalAccount('liability_other', 'Car Loans').id, amount: principal }, { accountId: s.nominalAccount('expense', 'Vehicles').id, amount: -principal }] });
      v.loan.owed -= principal;
      v.loan.monthsLeft -= 1;
      if (v.loan.owed <= 0 || v.loan.monthsLeft <= 0) delete v.loan;
    }
    // Stolen for good, its loan paid: off the books.
    if (v.stolen && v.stolen.recoverAt === undefined && !v.loan) { gone(s, v); return; }
    s.schedule({ at: item.at + 30 * MS_DAY, kind: VEHICLE_MONTH_KIND, label: 'The Car’s Month', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id } });
  });

  sim.onSchedule(VEHICLE_RENEWAL_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const v = person ? vehiclesOf(person).find((x) => x.id === item.payload.vehicleId) : undefined;
    if (!person || !v || v.soldAt !== undefined || (v.stolen && v.stolen.recoverAt === undefined)) return;
    const r = renewal(v, s.now);
    // The year's parking permit comes due with it (`parkingYear`).
    const permit = parkingYear(person, modelById(v.modelId)!, v.cityId);
    if (permit) {
      const due = inSave(s, permit.amount, permit.currency);
      if (!payFromBank(s, person, due, 'Resident parking permit, the year', 'vehicle')) owe(s, person, due, 'Resident parking permit', 'vehicle');
    }
    if (r.amount > 0) {
      const due = inSave(s, r.amount, CURRENCY[v.jurisdiction]);
      if (!payFromBank(s, person, due, r.memo, 'vehicle')) owe(s, person, due, r.memo, 'vehicle');
    }
    v.registrationDue = r.next;
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'Registration Renewed', body: `${r.memo}, until ${formatDate(r.next, s.zone)}.`, importance: 30, route: '/workspace/vehicles' });
    s.schedule({ at: r.next, kind: VEHICLE_RENEWAL_KIND, label: 'Registration Renewal', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id } });
  });
}

