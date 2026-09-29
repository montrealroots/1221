/**
 * SLATE — owning land (docs/WORLD.md, stage 4), from 2026-09-29: a parcel
 * bought where one lives at its published value (`content/land.ts`), the
 * buyer's transfer taxes paid, a year's holding tax where one's kept, and
 * sold after the time land takes to sell, the seller's taxes paid from the
 * price. A lot splits where each part keeps the zoning's minimum, and two
 * parcels of one place combine into one.
 *
 * A parcel's value follows its source's latest yearly change from its
 * figure's year, and is held where the source publishes none, as the FHFA's
 * and the government's residential figures don't. What a sale fetches is
 * that value, SLATE's estimate of the market; a buyer's survey, title
 * insurance and lawyer, whose prices no authority publishes, aren't kept, nor
 * is the fee for splitting a lot where it isn't published.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { DAYS_TO_SELL, LAND_MARKETS, LAND_TAX, LAND_TRANSFER, areaWords, type LandMarket, type TransferTax } from '../content/land';
import { homeOf } from './earnings';
import { owe, payFromBank } from './household';

const YEAR_MS = 365.2425 * MS_DAY;
export const LAND_TAX_KIND = 'land.tax_year';
export const LAND_SALE_KIND = 'land.sale_closes';

export interface Parcel {
  id: string;
  market: number;
  acres: number;
  boughtAt: Instant;
  /** What it cost, in its market's money, cents. */
  paid: Money;
  selling?: { closesAt: Instant };
  soldAt?: Instant;
}

export const parcelsOf = (person: Person): Parcel[] => (person.land ??= []);
const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** The markets where one lives. */
export const marketsFor = (cityId: string) => LAND_MARKETS.map((m, i) => ({ m, i })).filter(({ m }) => m.cityId === cityId);

/** A figure's year as an instant: its first day. */
const yearOf = (y: string) => Date.UTC(Number((y.match(/\d{4}/) ?? ['2026'])[0]), 0, 1);

/** A parcel's value at a moment, in its market's money, cents: the value an acre grown by the source's yearly change since its year. */
export function landValue(m: LandMarket, acres: number, at: Instant): Money {
  const years = Math.max(0, (at - yearOf(m.year)) / YEAR_MS);
  return Math.round(m.perAcre * acres * (1 + m.yearlyChange) ** years * 100);
}

/** A tax on a price in its money, cents: marginal bands, or the band's rate on the whole. */
export function transferTax(t: TransferTax, price: Money): Money {
  const units = price / 100;
  if (t.whole) return Math.round(price * t.bands.find(([upTo]) => units <= upTo)![1]);
  let tax = 0;
  let from = 0;
  for (const [upTo, rate] of t.bands) {
    const slice = Math.max(0, Math.min(units, upTo) - from);
    tax += slice * rate;
    from = upTo;
    if (units <= upTo) break;
  }
  return Math.round(tax * 100);
}

/**
 * The value a year's holding tax is on, in its market's money, cents: the
 * value now, or under Proposition 13 the price paid grown at the cap, never
 * more than the value.
 */
export function taxedValue(p: Parcel, at: Instant): Money {
  const m = LAND_MARKETS[p.market]!;
  const value = landValue(m, p.acres, at);
  const cap = LAND_TAX[m.place]?.onPrice?.cap;
  if (cap === undefined) return value;
  return Math.min(value, Math.round(p.paid * (1 + cap) ** Math.floor(Math.max(0, at - p.boughtAt) / YEAR_MS)));
}

export interface LandQuote { currency: string; price: Money; lines: { label: string; amount: Money }[]; total: Money; basis: string }

/** Buying a parcel: its price and the buyer's taxes, in its market's money, cents. */
export function landQuote(marketIndex: number, acres: number, at: Instant): LandQuote {
  const m = LAND_MARKETS[marketIndex]!;
  const price = landValue(m, acres, at);
  const lines = LAND_TRANSFER[m.place].filter((t) => t.payer === 'buyer').map((t) => ({ label: t.label, amount: transferTax(t, price) }));
  return { currency: m.currency, price, lines, total: price + lines.reduce((a, l) => a + l.amount, 0), basis: `${areaWords(acres, m.place)} at ${m.basis}.` };
}

/** What a sale leaves the seller: the value less the seller's taxes, in its money, cents. */
export function saleProceeds(m: LandMarket, value: Money): { taxes: { label: string; amount: Money }[]; net: Money } {
  const taxes = LAND_TRANSFER[m.place].filter((t) => t.payer === 'seller').map((t) => ({ label: t.label, amount: transferTax(t, value) }));
  return { taxes, net: value - taxes.reduce((a, t) => a + t.amount, 0) };
}

export function buyLandRefusal(person: Person, marketIndex: number, acres: number): string | undefined {
  const m = LAND_MARKETS[marketIndex];
  if (!m) return 'SLATE doesn’t sell that land.';
  if (m.cityId !== homeOf(person)) return 'Land is bought where you live.';
  if (!m.sizes.some((s) => Math.abs(s - acres) < 1e-9)) return 'That size isn’t offered.';
  return undefined;
}

/** Why a parcel can't be split in two, or nothing: a lot keeps the zoning's minimum on each side; acreage keeps an acre. */
export function splitRefusal(p: Parcel): string | undefined {
  const m = LAND_MARKETS[p.market]!;
  if (p.selling || p.soldAt !== undefined) return 'It’s being sold.';
  const least = m.kind === 'lot' ? m.zoning?.minAcres ?? 0 : 1;
  if (m.place === 'london') return 'A plot with planning permission is split by a new permission, which SLATE doesn’t take.';
  if (p.acres / 2 < least) return `Each half would be under the ${m.zoning ? `${m.zoning.name} minimum, ${areaWords(least, m.place)}` : 'acre SLATE keeps'}.`;
  return undefined;
}

export function registerLand(sim: Simulation): void {
  sim.onCommand<{ market: number; acres: number }, { parcelId: string; paid: Money }>('land.buy', (p, { sim: s }) => {
    const person = s.player;
    const idx = Number(p?.market);
    const acres = Number(p?.acres);
    const no = buyLandRefusal(person, idx, acres);
    if (no) throw new CommandError(no);
    const q = landQuote(idx, acres, s.now);
    const m = LAND_MARKETS[idx]!;
    const total = inSave(s, q.total, q.currency);
    if (!payFromBank(s, person, total, `${m.label}, ${areaWords(acres, m.place)}, and its taxes`, 'land')) throw new CommandError(`${formatMoney(total, saveCurrency(s.universe))} is more than the bank can cover.`);
    const id = s.nextId('parcel');
    parcelsOf(person).push({ id, market: idx, acres, boughtAt: s.now, paid: q.price });
    if (LAND_TAX[m.place]) s.schedule({ at: s.now + YEAR_MS, kind: LAND_TAX_KIND, label: 'Land Tax', category: 'home', priority: 30, payload: { personId: person.id, parcelId: id } });
    return { parcelId: id, paid: total };
  });

  sim.onCommand<{ parcelId: string }, { closesAt: Instant }>('land.sell', (p, { sim: s }) => {
    const person = s.player;
    const parcel = parcelsOf(person).find((x) => x.id === p?.parcelId && x.soldAt === undefined);
    if (!parcel) throw new CommandError('That isn’t land you own.');
    if (parcel.selling) throw new CommandError('It’s for sale already.');
    const closesAt = s.now + DAYS_TO_SELL * MS_DAY;
    parcel.selling = { closesAt };
    s.schedule({ at: closesAt, kind: LAND_SALE_KIND, label: 'Land Sale Closes', category: 'home', priority: 30, payload: { personId: person.id, parcelId: parcel.id } });
    return { closesAt };
  });

  sim.onCommand<{ parcelId: string }, { parts: string[] }>('land.split', (p, { sim: s }) => {
    const person = s.player;
    const parcel = parcelsOf(person).find((x) => x.id === p?.parcelId && x.soldAt === undefined);
    if (!parcel) throw new CommandError('That isn’t land you own.');
    const no = splitRefusal(parcel);
    if (no) throw new CommandError(no);
    parcel.acres /= 2;
    parcel.paid = Math.round(parcel.paid / 2);
    const id = s.nextId('parcel');
    parcelsOf(person).push({ ...parcel, id });
    if (LAND_TAX[LAND_MARKETS[parcel.market]!.place]) s.schedule({ at: s.now + YEAR_MS, kind: LAND_TAX_KIND, label: 'Land Tax', category: 'home', priority: 30, payload: { personId: person.id, parcelId: id } });
    return { parts: [parcel.id, id] };
  });

  sim.onCommand<{ a: string; b: string }, { parcelId: string }>('land.combine', (p, { sim: s }) => {
    const person = s.player;
    const a = parcelsOf(person).find((x) => x.id === p?.a && x.soldAt === undefined && !x.selling);
    const b = parcelsOf(person).find((x) => x.id === p?.b && x.soldAt === undefined && !x.selling && x.id !== p?.a);
    if (!a || !b) throw new CommandError('Two parcels you own, neither for sale.');
    if (LAND_MARKETS[a.market]!.place !== LAND_MARKETS[b.market]!.place || LAND_MARKETS[a.market]!.label !== LAND_MARKETS[b.market]!.label) throw new CommandError('Parcels combine only where they’re the same place.');
    a.acres += b.acres;
    a.paid += b.paid;
    b.soldAt = s.now;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.payload.parcelId === b.id) s.timeline.cancel(item.id, s.now);
    return { parcelId: a.id };
  });

  sim.onSchedule(LAND_TAX_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const parcel = person ? parcelsOf(person).find((x) => x.id === item.payload.parcelId) : undefined;
    // A sale or a combine cancels the parcel's pending tax, so a parcel gone isn't met here.
    if (!person || !parcel) return;
    const m = LAND_MARKETS[parcel.market]!;
    const tax = LAND_TAX[m.place];
    if (!tax) return;
    const due = inSave(s, Math.round(taxedValue(parcel, s.now) * tax.rate), m.currency);
    if (due > 0 && !payFromBank(s, person, due, `Property tax, ${m.label}`, 'land')) owe(s, person, due, 'Property tax on land', 'land');
    s.schedule({ at: item.at + YEAR_MS, kind: LAND_TAX_KIND, label: 'Land Tax', category: 'home', priority: 30, payload: { personId: person.id, parcelId: parcel.id } });
  });

  sim.onSchedule(LAND_SALE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const parcel = person ? parcelsOf(person).find((x) => x.id === item.payload.parcelId) : undefined;
    if (!person || !parcel || parcel.soldAt !== undefined || !parcel.selling) return;
    const m = LAND_MARKETS[parcel.market]!;
    const sale = saleProceeds(m, landValue(m, parcel.acres, s.now));
    const net = inSave(s, sale.net, m.currency);
    s.post({ memo: `Sold: ${m.label}, ${areaWords(parcel.acres, m.place)}, its taxes paid`, category: 'land', postings: [{ accountId: person.primaryAccountId!, amount: net }, { accountId: s.nominalAccount('income', 'Land Sold').id, amount: -net }] });
    parcel.soldAt = s.now;
    delete parcel.selling;
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.payload.parcelId === parcel.id) s.timeline.cancel(one.id, s.now);
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'Land Sold', body: `${m.label}: ${formatMoney(net, saveCurrency(s.universe))} to you, on ${formatDate(s.now, s.zone)}.`, importance: 50, route: '/workspace/land' });
  });
}
