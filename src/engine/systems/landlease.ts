/**
 * SLATE — farmland let to a farmer (docs/WORLD.md, stage 4c), from
 * 2026-09-30, researched in `docs/research/world/research-land-2.json`.
 *
 * Acreage one owns, and nothing is being built on, is let for a year at a
 * time at the place's published cash rent, paid at the start of each year of
 * the lease. The rents (`FARM_RENT`):
 * - New York's $83.50 an acre, NASS's 2025 cropland rent as Farm Progress
 *   reported it; Connecticut's about $85 for 2024 (secondary), 2025's not
 *   being read; California's $346, NASS's 2025 figure.
 * - England's £230 a hectare, Defra's average for a farm business tenancy,
 *   2024/25, reported by Farmers Weekly: £93.08 an acre.
 * - Leinster's €299 an acre for grazing and silage, SCSI and Teagasc, 2025.
 * - Ontario's and British Columbia's 2.35% of the land's value a year, Farm
 *   Credit Canada's 2025 rent-to-price ratio for Canada; Ontario's is within
 *   2% to 3%, and FCC published none for British Columbia, where the national
 *   ratio is SLATE's estimate.
 * Taxed as rental income: on the American return (Schedule E), and as it's
 * paid elsewhere, Britain's after HMRC's £1,000 property allowance a year.
 * Let, the land is the farmer's to use, and not ridden (`systems/outings.ts`).
 * It isn't split or joined while let; a sale ends the lease.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { computeAnnualTax } from '../content/tax';
import { LAND_MARKETS, type LandMarket } from '../content/land';
import { recordHome, yearOf } from './earnings';
import { buildingOn, landValue, parcelsOf, type Parcel } from './land';

export const LAND_LEASE_KIND = 'land.lease_year';
const YEAR_MS = 365.2425 * MS_DAY;
const ACRES_A_HECTARE = 2.4710538;

/** A year's rent an acre where farmland is let: a published figure, or a share of the land's value. */
export const FARM_RENT: Readonly<Partial<Record<LandMarket['place'], { perAcre?: number; ofValue?: number; basis: string }>>> = {
  'ny-state': { perAcre: 83.5, basis: 'NASS’s 2025 New York cropland rent, as Farm Progress reported it' },
  'ct-state': { perAcre: 85, basis: 'About $85 for Connecticut cropland in 2024, from a secondary source; 2025’s wasn’t read' },
  'ca-state': { perAcre: 346, basis: 'NASS’s 2025 California cropland rent' },
  england: { perAcre: 230 / ACRES_A_HECTARE, basis: 'Defra’s average for a farm business tenancy, £230 a hectare, 2024/25' },
  leinster: { perAcre: 299, basis: 'SCSI and Teagasc’s Leinster rent for grazing and silage, 2025' },
  ontario: { ofValue: 0.0235, basis: 'Farm Credit Canada’s 2025 rent-to-price ratio, 2.35% of the land’s value' },
  bc: { ofValue: 0.0235, basis: 'Farm Credit Canada’s national 2.35% of the land’s value, FCC publishing none for British Columbia: SLATE’s estimate' },
};

/** HMRC's property income allowance, a year. */
const UK_PROPERTY_ALLOWANCE = 1_000;

export interface LandLease { since: Instant; ending?: boolean }

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** A parcel's year of rent in its market's money, cents, or nothing where no rent is kept. */
export function yearRent(parcel: Parcel, at: Instant): Money | undefined {
  const m = LAND_MARKETS[parcel.market];
  const r = m ? FARM_RENT[m.place] : undefined;
  // A town lot's place has no farm rent: only acreage is let.
  if (!m || !r) return undefined;
  return r.perAcre !== undefined ? Math.round(r.perAcre * parcel.acres * 100) : Math.round(landValue(m, parcel.acres, at) * r.ofValue!);
}

export function leaseRefusal(person: Person, parcel: Parcel | undefined, at: Instant): string | undefined {
  if (!parcel || parcel.soldAt !== undefined) return 'That isn’t land you own.';
  if (LAND_MARKETS[parcel.market]?.kind !== 'acreage') return 'A farmer rents acreage, not a town lot.';
  if (yearRent(parcel, at) === undefined) return 'No farm rent is published there.';
  if (parcel.lease) return 'It’s let already.';
  if (parcel.selling) return 'It’s for sale.';
  if (buildingOn(person, parcel) || parcel.builtOn) return 'A house stands or is being built on it.';
  return undefined;
}

/** A year's rent in, and its tax where it's taken as it's paid. */
function collect(sim: Simulation, person: Person, parcel: Parcel): Money {
  const m = LAND_MARKETS[parcel.market]!;
  const rent = inSave(sim, yearRent(parcel, sim.now)!, m.currency);
  const cityId = m.town ?? m.cityId;
  const zone = CITIES.require(cityId).timeZone;
  const country = CITIES.get(cityId)?.countryId ?? '';
  const y = yearOf(person, zonedParts(sim.now, zone).year);
  let taxable = 0;
  if (country === 'us') recordHome(person, sim.now, zone, 'rentalRent', rent);
  else if (country === 'uk') {
    const allowance = inSave(sim, UK_PROPERTY_ALLOWANCE * 100, 'GBP');
    const before = y.farmRent ?? 0;
    taxable = Math.max(0, before + rent - Math.max(allowance, before));
  } else taxable = rent;
  y.farmRent = (y.farmRent ?? 0) + rent;
  const money = { currency: saveCurrency(sim.universe) };
  const base = y.acting + (y.lodgerTaxed ?? 0) + (y.farmTaxed ?? 0);
  const tax = taxable > 0 ? computeAnnualTax(base + taxable, cityId, sim.now, money).total - computeAnnualTax(base, cityId, sim.now, money).total : 0;
  y.farmTaxed = (y.farmTaxed ?? 0) + taxable;
  sim.post({
    memo: `A year’s farm rent, ${m.label}`, category: 'home',
    postings: [
      { accountId: person.primaryAccountId!, amount: rent - tax },
      { accountId: sim.nominalAccount('income', 'Farm Rent').id, amount: -rent },
      ...(tax > 0 ? [{ accountId: sim.nominalAccount('expense', 'Tax On Farm Rent').id, amount: tax }] : []),
    ],
  });
  return rent;
}

export function registerLandLease(sim: Simulation): void {
  sim.onCommand<{ parcelId: string }, { rent: Money }>('land.lease_out', (p, { sim: s }) => {
    const person = s.player;
    const parcel = parcelsOf(person).find((x) => x.id === p?.parcelId);
    const no = leaseRefusal(person, parcel, s.now);
    if (no) throw new CommandError(no);
    parcel!.lease = { since: s.now };
    const rent = collect(s, person, parcel!);
    s.schedule({ at: s.now + YEAR_MS, kind: LAND_LEASE_KIND, label: 'The Farm Rent', category: 'home', priority: 30, payload: { personId: person.id, parcelId: parcel!.id } });
    return { rent };
  });

  sim.onCommand<{ parcelId: string }, { endsAt: Instant }>('land.end_lease', (p, { sim: s }) => {
    const person = s.player;
    const parcel = parcelsOf(person).find((x) => x.id === p?.parcelId && x.soldAt === undefined);
    if (!parcel?.lease) throw new CommandError('It isn’t let.');
    if (parcel.lease.ending) throw new CommandError('It ends at the year’s end already.');
    parcel.lease.ending = true;
    const next = s.universe.scheduled.find((i) => i.status === 'pending' && i.kind === LAND_LEASE_KIND && i.payload.parcelId === parcel.id);
    return { endsAt: next?.at ?? s.now };
  });

  sim.onSchedule(LAND_LEASE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const parcel = person ? parcelsOf(person).find((x) => x.id === item.payload.parcelId) : undefined;
    if (!person || !parcel?.lease) return;
    // Sold, or its year run out on notice: the farmer goes.
    if (parcel.soldAt !== undefined || parcel.lease.ending) {
      delete parcel.lease;
      if (person.id === s.universe.playerId && parcel.soldAt === undefined) s.notify({ category: 'home', title: 'The Farm Lease Ended', body: `${LAND_MARKETS[parcel.market]!.label} is yours to use again, from ${formatDate(s.now, s.zone)}.`, importance: 40, route: '/workspace/land' });
      return;
    }
    const rent = collect(s, person, parcel);
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'The Farm Rent', body: `A year’s rent, ${formatMoney(rent, saveCurrency(s.universe))}, before its tax.`, importance: 30, route: '/workspace/land' });
    s.schedule({ at: item.at + YEAR_MS, kind: LAND_LEASE_KIND, label: 'The Farm Rent', category: 'home', priority: 30, payload: { personId: person.id, parcelId: parcel.id } });
  });
}
