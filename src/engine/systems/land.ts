/**
 * SLATE — owning land (docs/WORLD.md, stage 4), from 2026-09-29.
 *
 * BUYING (stage 4b). Each market where one lives shows a few listings a
 * month, each a size it offers at an asking price over or under its
 * published value (`content/land.ts`; none is a real listing). An offer
 * names a price; the seller reads it against the asking price and how long
 * the land has sat, and accepts, counters at halfway for two days or turns
 * it down (decider `land.market`). Accepted, the searches with a published
 * fee are paid, and the deposit is paid as the place's custom has it: on
 * acceptance in America and Canada, on exchange in England and Ireland.
 * Until the thirtieth day the buyer can walk away, a deposit paid coming
 * back; after it, walking away or not paying at the closing on the
 * forty-fifth day loses it. The closing pays the rest of the price, the
 * buyer's transfer taxes and, in England, the Land Registry's fee. Land is
 * bought with money in the bank: a land loan isn't kept. Until 2026-09-29 a
 * parcel was bought at once at its value, with none of this.
 *
 * OWNING (stage 4a). A year's holding tax where one's kept; sold after the
 * time land takes to sell, the seller's taxes paid from the price. A lot
 * splits where each part keeps the zoning's minimum, and two parcels of one
 * place combine into one.
 *
 * A town lot's value moves with the town's home market from its figure's
 * year (`homes.ts`), the FHFA's land values being read from home prices.
 * Farmland takes its source's latest yearly change for the year until the
 * next edition, then moves with the town's home market: SLATE's estimate,
 * no long-run farmland figure being published. Until 2026-09-29 each took
 * one year's change for ever and a lot none, so a life's farmland in England
 * fell near nine-tenths in fifty years and a Brooklyn lot stood at 2022's
 * price while the houses around it rose. What a sale fetches is
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
import { DAYS_TO_SELL, LAND_DEAL, LAND_MARKETS, LAND_REGISTRATION, LAND_SEARCHES, LAND_TAX, LAND_TRANSFER, areaWords, type LandMarket, type TransferTax, closingLines, SPLIT_FEES } from '../content/land';
import { homeOf } from './earnings';
import { marketAt } from './homes';
import { drawFromBank, inTheBank, owe, payFromBank } from './household';

const YEAR_MS = 365.2425 * MS_DAY;
export const LAND_TAX_KIND = 'land.tax_year';
export const LAND_SALE_KIND = 'land.sale_closes';
export const LAND_EXCHANGE_KIND = 'land.exchange';
export const LAND_CLOSING_KIND = 'land.closing';

export interface Parcel {
  id: string;
  market: number;
  acres: number;
  boughtAt: Instant;
  /** What it cost, in its market's money, cents. */
  paid: Money;
  /** The listing it was bought from. */
  listingId?: string;
  /** The home built on it, which it went into (`systems/construction.ts`). */
  builtOn?: string;
  selling?: { closesAt: Instant };
  soldAt?: Instant;
  /** Let to a farmer (`systems/landlease.ts`, from 2026-09-30). */
  lease?: import('./landlease').LandLease;
}

/** Land for sale: a market's size at an asking price, in its money, cents. */
export interface Listing { id: string; market: number; acres: number; asking: Money; listedAt: Instant }

/** An offer accepted, on its way to the closing. */
export interface LandDeal {
  listing: Listing;
  price: Money;
  acceptedAt: Instant;
  /** Until when the buyer can walk away with a deposit paid back: exchange, in England and Ireland. */
  diligenceUntil: Instant;
  closesAt: Instant;
  /** The deposit, in the market's money, cents, and the account holding it once paid. */
  deposit: Money;
  escrowAccountId?: string;
}

/** Where a buyer stands with the land market: a deal, a counter standing, and the offers made on each listing. */
export interface LandBuying {
  deal?: LandDeal;
  counter?: { listingId: string; price: Money; until: Instant };
  offers: Record<string, number>;
}

export const parcelsOf = (person: Person): Parcel[] => (person.land ??= []);
/** Whether a house is being built on a parcel (`systems/construction.ts`). */
export const buildingOn = (person: Person | undefined, p: Parcel): boolean => person?.building?.parcelId === p.id;
export const landBuyingOf = (person: Person): LandBuying => (person.landBuying ??= { offers: {} });
const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** The markets where one lives. */
export const marketsFor = (cityId: string) => LAND_MARKETS.map((m, i) => ({ m, i })).filter(({ m }) => m.cityId === cityId);

/** A figure's year as an instant: its first day. */
const yearOf = (y: string) => Date.UTC(Number((y.match(/\d{4}/) ?? ['2026'])[0]), 0, 1);

/**
 * A parcel's value at a moment, in its market's money, cents: a lot's moved
 * with the town's home market since its figure's year; farmland's by its
 * source's yearly change for a year, and with the town's market after.
 */
export function landValue(m: LandMarket, acres: number, at: Instant): Money {
  const from = yearOf(m.year);
  // Farmland moves with its own town's market, a lot with the city's.
  const market = (t: Instant) => marketAt(m.town ?? m.cityId, m.currency, t);
  if (m.kind === 'lot') return Math.round(m.perAcre * acres * market(at) / market(from) * 100);
  const edition = from + YEAR_MS;
  const first = (1 + m.yearlyChange) ** (Math.max(0, Math.min(at, edition) - from) / YEAR_MS);
  return Math.round(m.perAcre * acres * first * (at > edition ? market(at) / market(edition) : 1) * 100);
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

/**
 * Buying a parcel at a price, its value where none is given: the buyer's
 * taxes, the searches with a published fee, and in England the Land
 * Registry's fee, in its market's money, cents.
 */
export function landQuote(marketIndex: number, acres: number, at: Instant, price?: Money): LandQuote {
  const m = LAND_MARKETS[marketIndex]!;
  const paid = price ?? landValue(m, acres, at);
  const lines = LAND_TRANSFER[m.place].filter((t) => t.payer === 'buyer').map((t) => ({ label: t.label, amount: transferTax(t, paid) }));
  for (const s of LAND_SEARCHES[m.place] ?? []) lines.push({ label: s.label, amount: s.amount * 100 });
  if (m.place === 'london' || m.place === 'england') lines.push({ label: 'Land Registry Fee', amount: LAND_REGISTRATION.find(([upTo]) => paid / 100 <= upTo)![1] * 100 });
  // Title insurance and the lawyer, where published (from 2026-09-30).
  lines.push(...closingLines(m.place, paid));
  return { currency: m.currency, price: paid, lines, total: paid + lines.reduce((a, l) => a + l.amount, 0), basis: `${areaWords(acres, m.place)} at ${m.basis}.` };
}

/** What a sale leaves the seller: the value less the seller's taxes, in its money, cents. */
export function saleProceeds(m: LandMarket, value: Money): { taxes: { label: string; amount: Money }[]; net: Money } {
  const taxes = LAND_TRANSFER[m.place].filter((t) => t.payer === 'seller').map((t) => ({ label: t.label, amount: transferTax(t, value) }));
  return { taxes, net: value - taxes.reduce((a, t) => a + t.amount, 0) };
}

const monthKey = (at: Instant) => { const d = new Date(at); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };

/**
 * The land listed this month where a town is (decider `land.listings`): each
 * market's few, a size it offers at an asking price within SLATE's spread of
 * its value, listed up to twice the time land takes to sell before the
 * month began. What one has bought or has an offer accepted on is gone.
 */
export function listingsFor(sim: Simulation, person: Person, cityId: string, at: Instant = sim.now): Listing[] {
  const d = new Date(at);
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const key = monthKey(at);
  const taken = new Set([...parcelsOf(person).map((p) => p.listingId), person.landBuying?.deal?.listing.id]);
  const out: Listing[] = [];
  for (const { m, i } of marketsFor(cityId)) {
    for (let n = 0; n < LAND_DEAL.listingsAMonth; n++) {
      const id = `${i}.${key}.${n}`;
      if (taken.has(id)) continue;
      const r = sim.rng('land.listings', i, key, n);
      const acres = m.sizes[Math.floor(r.next() * m.sizes.length)]!;
      const over = LAND_DEAL.askOver[0] + r.next() * (LAND_DEAL.askOver[1] - LAND_DEAL.askOver[0]);
      const listedAt = start - Math.floor(r.next() * DAYS_TO_SELL * 2) * MS_DAY;
      out.push({ id, market: i, acres, asking: Math.round(landValue(m, acres, start) * (1 + over) / 100_00) * 100_00, listedAt });
    }
  }
  return out;
}

/** The least a seller takes, of the asking price: falling the longer the land has sat. */
export function landFloor(listing: Listing, at: Instant): number {
  return LAND_DEAL.floor - Math.min(LAND_DEAL.floorFallsAtMost, Math.max(0, at - listing.listedAt) / YEAR_MS * LAND_DEAL.floorFallsAYear);
}

export type LandAnswer = { answer: 'accepted' } | { answer: 'countered'; price: Money } | { answer: 'rejected' };

/**
 * How a seller answers: from the least they'd take up, yes the more often
 * the nearer the asking price, always at it, and otherwise a counter at
 * halfway; a little under it, a counter; further under, no.
 * SLATE's estimates, as a home's seller's.
 */
export function landAnswer(sim: Simulation, person: Person, listing: Listing, price: Money, tries: number): LandAnswer {
  const floor = landFloor(listing, sim.now);
  const ratio = price / listing.asking;
  const halfway = Math.round((price + listing.asking) / 2 / 100_00) * 100_00;
  if (ratio >= floor) return sim.rng('land.market', person.id, listing.id, tries).next() < (ratio - floor) / (1 - floor) ? { answer: 'accepted' } : { answer: 'countered', price: halfway };
  return ratio >= floor - 0.05 ? { answer: 'countered', price: halfway } : { answer: 'rejected' };
}

/** Why an offer can't be made, or nothing. */
export function offerRefusal(sim: Simulation, person: Person, listingId: string, price: Money): string | undefined {
  if (landBuyingOf(person).deal) return 'You have an offer accepted already.';
  const listing = listingsFor(sim, person, homeOf(person)).find((l) => l.id === listingId);
  if (!listing) return 'That land isn’t listed where you live.';
  if (!(price > 0)) return 'An offer names a price.';
  const q = landQuote(listing.market, listing.acres, sim.now, price);
  const cash = inSave(sim, q.total, q.currency);
  if (inTheBank(sim, person) < cash) return `The seller asks to see ${formatMoney(cash, saveCurrency(sim.universe), { cents: false })} in the bank, the price and what buying it costs.`;
  return undefined;
}

/** Why a parcel can't be split in two, or nothing: a lot keeps the zoning's minimum on each side; acreage keeps an acre. */
export function splitRefusal(p: Parcel, person?: Person): string | undefined {
  const m = LAND_MARKETS[p.market]!;
  if (p.selling || p.soldAt !== undefined) return 'It’s being sold.';
  if (buildingOn(person, p)) return 'A house is being built on it.';
  const least = m.kind === 'lot' ? m.zoning?.minAcres ?? 0 : 1;
  if (m.place === 'london') return 'A plot with planning permission is split by a new permission, which SLATE doesn’t take.';
  if (p.acres / 2 < least) return `Each half would be under the ${m.zoning ? `${m.zoning.name} minimum, ${areaWords(least, m.place)}` : 'acre SLATE keeps'}.`;
  return undefined;
}

/** A deposit into its own account, from the bank; false if the bank can't. */
function payDeposit(sim: Simulation, person: Person, deal: LandDeal): boolean {
  const m = LAND_MARKETS[deal.listing.market]!;
  const amount = inSave(sim, deal.deposit, m.currency);
  const draw = drawFromBank(sim, person, amount, false, true);
  if (draw.short > 0) return false;
  const escrow = sim.openAccount({ id: sim.nextId('account'), kind: 'escrow', name: 'Land Deposit', ownerId: person.id, institution: m.place === 'london' || m.place === 'england' || m.place === 'leinster' ? 'The Seller’s Solicitor' : 'The Title Company', openedAt: sim.now, category: 'land-deposit' });
  sim.post({ memo: `Deposit on ${m.label}`, category: 'land', postings: [...draw.postings, { accountId: escrow.id, amount }] });
  deal.escrowAccountId = escrow.id;
  return true;
}

/** A deposit paid back, or kept by the seller. */
function releaseDeposit(sim: Simulation, person: Person, deal: LandDeal, back: boolean): void {
  const escrow = deal.escrowAccountId ? sim.universe.accounts[deal.escrowAccountId] : undefined;
  if (!escrow || escrow.balance <= 0) return;
  const to = back ? person.primaryAccountId! : sim.nominalAccount('expense', 'Land Deposit Forfeited').id;
  sim.post({ memo: back ? 'Land deposit back' : 'Land deposit kept by the seller', category: 'land', postings: [{ accountId: escrow.id, amount: -escrow.balance }, { accountId: to, amount: escrow.balance }] });
  escrow.closedAt = sim.now;
}

function endDeal(sim: Simulation, person: Person): void {
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && (one.kind === LAND_EXCHANGE_KIND || one.kind === LAND_CLOSING_KIND) && one.payload.personId === person.id) sim.timeline.cancel(one.id, sim.now);
  delete landBuyingOf(person).deal;
}

const tell = (sim: Simulation, person: Person, title: string, body: string) => { if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title, body, importance: 75, route: '/workspace/land' }); };

export function registerLand(sim: Simulation): void {
  sim.onCommand<{ listingId: string; price: number }, { answer: LandAnswer['answer']; price?: Money }>('land.offer', (p, { sim: s }) => {
    const person = s.player;
    const price = Math.round(Number(p?.price));
    const no = offerRefusal(s, person, String(p?.listingId), price);
    if (no) throw new CommandError(no);
    const listing = listingsFor(s, person, homeOf(person)).find((l) => l.id === p.listingId)!;
    const buying = landBuyingOf(person);
    const tries = buying.offers[listing.id] ?? 0;
    buying.offers[listing.id] = tries + 1;
    const c = buying.counter;
    const answer: LandAnswer = c && c.listingId === listing.id && c.until >= s.now && price >= c.price ? { answer: 'accepted' } : landAnswer(s, person, listing, price, tries);
    if (answer.answer === 'countered') { buying.counter = { listingId: listing.id, price: answer.price, until: s.now + 2 * MS_DAY }; return { answer: 'countered', price: answer.price }; }
    if (answer.answer === 'rejected') return { answer: 'rejected' };
    delete buying.counter;
    const m = LAND_MARKETS[listing.market]!;
    const rule = LAND_DEAL.deposit[m.place];
    const deal: LandDeal = { listing, price, acceptedAt: s.now, diligenceUntil: s.now + LAND_DEAL.diligenceDays * MS_DAY, closesAt: s.now + LAND_DEAL.closingDays * MS_DAY, deposit: Math.round(price * rule.share) };
    if (rule.at === 'accept' && !payDeposit(s, person, deal)) throw new CommandError('The bank can’t pay the deposit.');
    buying.deal = deal;
    // The searches with a published fee, ordered now.
    const searches = (LAND_SEARCHES[m.place] ?? []).reduce((a, x) => a + x.amount * 100, 0);
    const due = inSave(s, searches, m.currency);
    if (due > 0 && !payFromBank(s, person, due, `Searches on ${m.label}`, 'land')) owe(s, person, due, 'Searches on land', 'land');
    s.schedule({ at: deal.diligenceUntil, kind: LAND_EXCHANGE_KIND, label: rule.at === 'exchange' ? 'Contracts Exchanged' : 'Due Diligence Ends', category: 'home', priority: 30, payload: { personId: person.id } });
    s.schedule({ at: deal.closesAt, kind: LAND_CLOSING_KIND, label: 'Land Closing', category: 'home', priority: 30, payload: { personId: person.id } });
    return { answer: 'accepted', price };
  });

  sim.onCommand<Record<string, never>, { depositBack: boolean }>('land.withdraw', (_p, { sim: s }) => {
    const person = s.player;
    const deal = landBuyingOf(person).deal;
    if (!deal) throw new CommandError('You have no offer accepted.');
    const back = s.now < deal.diligenceUntil;
    releaseDeposit(s, person, deal, back);
    endDeal(s, person);
    return { depositBack: back };
  });

  sim.onSchedule(LAND_EXCHANGE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const deal = person?.landBuying?.deal;
    if (!person || !deal) return;
    const m = LAND_MARKETS[deal.listing.market]!;
    if (LAND_DEAL.deposit[m.place].at === 'exchange') {
      // Subject to contract until now: a deposit the bank can't pay ends it, owing nothing.
      if (!payDeposit(s, person, deal)) { endDeal(s, person); tell(s, person, 'The Purchase Fell Through', `${m.label}: the bank couldn’t pay the deposit on exchange, so contracts weren’t exchanged.`); return; }
      tell(s, person, 'Contracts Exchanged', `${m.label}: the deposit is paid and you’re bound to complete on ${formatDate(deal.closesAt, s.zone)}.`);
      return;
    }
    tell(s, person, 'Due Diligence Ends', `${m.label}: walking away now loses the deposit. It closes on ${formatDate(deal.closesAt, s.zone)}.`);
  });

  sim.onSchedule(LAND_CLOSING_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const deal = person?.landBuying?.deal;
    if (!person || !deal) return;
    const m = LAND_MARKETS[deal.listing.market]!;
    const q = landQuote(deal.listing.market, deal.listing.acres, s.now, deal.price);
    // The searches were paid when they were ordered.
    const searches = (LAND_SEARCHES[m.place] ?? []).reduce((a, x) => a + x.amount * 100, 0);
    const escrow = deal.escrowAccountId ? s.universe.accounts[deal.escrowAccountId] : undefined;
    const held = Math.max(0, escrow?.balance ?? 0);
    const total = inSave(s, q.total - searches, m.currency);
    const draw = drawFromBank(s, person, total - held, false, true);
    if (draw.short > 0) {
      releaseDeposit(s, person, deal, false);
      endDeal(s, person);
      tell(s, person, 'The Purchase Fell Through', `${m.label}: the bank couldn’t pay the rest at the closing, and the seller kept the deposit.`);
      return;
    }
    const postings = [...draw.postings, { accountId: s.nominalAccount('expense', 'Land').id, amount: total }];
    if (escrow && held > 0) { postings.push({ accountId: escrow.id, amount: -held }); escrow.closedAt = s.now; }
    s.post({ memo: `${m.label}, ${areaWords(deal.listing.acres, m.place)}, bought, and its taxes`, category: 'land', postings });
    const id = s.nextId('parcel');
    parcelsOf(person).push({ id, market: deal.listing.market, acres: deal.listing.acres, boughtAt: s.now, paid: deal.price, listingId: deal.listing.id });
    if (LAND_TAX[m.place]) s.schedule({ at: s.now + YEAR_MS, kind: LAND_TAX_KIND, label: 'Land Tax', category: 'home', priority: 30, payload: { personId: person.id, parcelId: id } });
    endDeal(s, person);
    tell(s, person, 'Land Bought', `${m.label}, ${areaWords(deal.listing.acres, m.place)}, is yours.`);
  });

  sim.onCommand<{ parcelId: string }, { closesAt: Instant }>('land.sell', (p, { sim: s }) => {
    const person = s.player;
    const parcel = parcelsOf(person).find((x) => x.id === p?.parcelId && x.soldAt === undefined);
    if (!parcel) throw new CommandError('That isn’t land you own.');
    if (parcel.selling) throw new CommandError('It’s for sale already.');
    if (buildingOn(person, parcel)) throw new CommandError('A house is being built on it.');
    const closesAt = s.now + DAYS_TO_SELL * MS_DAY;
    parcel.selling = { closesAt };
    s.schedule({ at: closesAt, kind: LAND_SALE_KIND, label: 'Land Sale Closes', category: 'home', priority: 30, payload: { personId: person.id, parcelId: parcel.id } });
    return { closesAt };
  });

  sim.onCommand<{ parcelId: string }, { parts: string[] }>('land.split', (p, { sim: s }) => {
    const person = s.player;
    const parcel = parcelsOf(person).find((x) => x.id === p?.parcelId && x.soldAt === undefined);
    if (!parcel) throw new CommandError('That isn’t land you own.');
    const no = splitRefusal(parcel, person);
    if (no) throw new CommandError(no);
    if (parcel.lease) throw new CommandError('It’s let to a farmer: end the lease first.');
    // The authority's fee, where one's published (from 2026-10-01).
    const m = LAND_MARKETS[parcel.market]!;
    const fee = SPLIT_FEES[m.place];
    if (fee !== undefined && !payFromBank(s, person, inSave(s, Math.round(fee * 100), m.currency), `Splitting ${m.label}, the authority’s fee`, 'land')) throw new CommandError('The bank couldn’t pay the fee to split it.');
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
    if (buildingOn(person, a) || buildingOn(person, b)) throw new CommandError('A house is being built on it.');
    if (a.lease || b.lease) throw new CommandError('Let land isn’t joined: end the lease first.');
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
