/**
 * SLATE — furniture of one's own (docs/WORLD.md, stage 6c), from
 * 2026-09-29, on the prices in `content/furniture.ts`.
 *
 * A home bought or built from 2026-09-29 comes empty, as a real one does; a
 * rented room or flat comes furnished, SLATE's reading of what a let
 * includes, and a home owned before then is taken as furnished, so no save
 * wakes to an empty house. A bed and a sofa are the person's, bought where
 * they live and delivered, and they move with them. In an empty home, a
 * night without a bed is slept on the floor and an hour unwinding without a
 * sofa takes half the stress off (`WITHOUT`).
 *
 * Movers take them from one home to the next, and a bed carries a state's
 * mattress recycling fee, from 2026-09-30 (below); until then neither was
 * kept. A mattress wearing out and movers in Ireland and abroad weren't kept
 * either, and are now (below). The rest of a home's furniture wasn't kept,
 * as changing nothing, until 2026-10-02, when IKEA's seats, tables and
 * storage came to be sold for what each does (`systems/furnishings.ts`).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { FURNITURE, MATTRESS, MATTRESS_FEE_USD, MATTRESS_YEARS, MOVERS, MOVERS_ABROAD, PIECE_LABEL, RENTED_TRUCK, WITHOUT, type Piece } from '../content/furniture';
import { FUEL } from '../content/vehiclefees';
import { BED_MARKET, BED_PARTS, DEFAULT_BED_SIZE, SLEEPS_TWO_CM, bedSize, type BedPart } from '../content/beds';
import { MS_DAY } from '../core/time';
import { inTheBank, owe, payFromBank } from './household';
import { jurisdictionOf, kindOf, modelById, runningCost, vehiclesOf, type OwnedVehicle } from './vehicles';
import { mayDrive } from './documents';
import { addItem, followTheMove, hasAtHome, homeKeyOf, itemsOf } from './items';
import { KIVIK_M2, fitRefusal } from './rooms';
import { byRoad, roadKm } from './driving';

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** The home they live in, where they own it and it came empty. */
export function bareHome(person: Person): boolean {
  if (person.home?.kind !== 'owned') return false;
  return (person.homes ?? []).find((h) => h.id === person.home!.homeId)?.bare === true;
}

/** Whether they have a piece at the home they live in (`systems/items.ts`); from 2026-10-01 a piece is an item at a home, where it was a timestamp that went everywhere with them. */
export const owns = (person: Person, piece: Piece): boolean => hasAtHome(person, `furniture:${piece}`);
/** Whether a piece was at a home, by the home's key. */
const hadAt = (person: Person, home: string | undefined, piece: Piece): boolean => Boolean(home) && itemsOf(person).some((i) => i.kind === `furniture:${piece}` && i.at.kind === 'home' && i.at.home === home);

/** Sleeping at home on the floor: an empty home and no bed of their own. */
export const onTheFloor = (person: Person): boolean => bareHome(person) && !owns(person, 'bed');

/** What an hour unwinding at home takes off, of the usual: half in an empty home with no sofa. */
export const unwindComfort = (person: Person): number => (bareHome(person) && !owns(person, 'sofa') ? WITHOUT.unwindBare : 1);

/** What a piece costs where a town is, delivered and taxed, in the save's money, cents; or nothing where SLATE keeps no price. */
export function pieceCost(sim: Simulation, cityId: string, piece: Piece): { amount: Money; tax: Money } | undefined {
  const country = FURNITURE[CITIES.get(cityId)?.countryId ?? ''];
  if (!country) return undefined;
  const item = country.items[piece];
  if (!item) return undefined;
  const taxRate = country.taxAdded ? salesTaxRate(cityId, sim.now, 'furniture') : 0;
  const tax = Math.round(item.price * 100 * taxRate);
  // A bed's mattress carries its state's recycling fee, where one is charged.
  const fee = piece === 'bed' ? inSave(sim, Math.round(mattressFeeUsd(cityId, sim.now) * 100), 'USD') : 0;
  return { amount: inSave(sim, Math.round((item.price + item.delivery) * 100) + tax, country.currency) + fee, tax: inSave(sim, tax, country.currency) };
}

export function furnishRefusal(sim: Simulation, person: Person, piece: Piece): string | undefined {
  if (owns(person, piece)) return 'You have one.';
  // A bed or a sofa has to fit in the rooms (`systems/rooms.ts`, from 2026-10-03): a bed its country's usual double, a sofa the KIVIK.
  const country = CITIES.get(person.home?.cityId ?? '')?.countryId ?? '';
  const usual = BED_MARKET[country] ? bedSize(BED_MARKET[country]!, DEFAULT_BED_SIZE[country]!) : undefined;
  const fit = piece === 'sofa' ? fitRefusal(sim, person, KIVIK_M2, 'sofa') : piece === 'bed' && usual ? fitRefusal(sim, person, (usual.widthCm * usual.lengthCm) / 10_000, 'bed') : undefined;
  if (fit) return fit;
  const where = person.home?.cityId ?? person.currentLocationId;
  const cost = pieceCost(sim, where, piece);
  if (!cost) return 'SLATE keeps no price for it where you live yet.';
  if (inTheBank(sim, person) < cost.amount) return `It costs ${formatMoney(cost.amount, saveCurrency(sim.universe), { cents: false })}, delivered.`;
  return undefined;
}

export function registerFurniture(sim: Simulation): void {
  // How they'd move their pieces: the movers, or a rented truck they drive.
  sim.onCommand<{ by: 'movers' | 'truck' }, { by: 'movers' | 'truck' }>('home.move_by', (p, { sim: s }) => {
    const by = p?.by === 'truck' ? 'truck' : 'movers';
    if (by === 'truck') s.player.moveBy = 'truck';
    else delete s.player.moveBy;
    return { by };
  });
  sim.onCommand<{ piece: Piece; frameId?: string; mattressId?: string }, { paid: Money }>('home.furnish', (p, { sim: s }) => {
    const person = s.player;
    const piece = p?.piece;
    if (!piece || !(piece in PIECE_LABEL)) throw new CommandError('No such piece.');
    const no = furnishRefusal(s, person, piece);
    if (no) throw new CommandError(no);
    const cityId = person.home?.cityId ?? person.currentLocationId;
    const country = CITIES.get(cityId)?.countryId ?? '';
    // A bed of your choosing, its frame and its mattress the same size (`content/beds.ts`), or the country's usual double.
    const chosen = piece === 'bed' && p.frameId ? bedQuote(s, cityId, String(p.frameId), String(p.mattressId ?? '')) : undefined;
    if (typeof chosen === 'string') throw new CommandError(chosen);
    const chosenSize = chosen ? bedSize(BED_MARKET[country]!, chosen.frame.size) : undefined;
    const tight = chosenSize ? fitRefusal(s, person, (chosenSize.widthCm * chosenSize.lengthCm) / 10_000, 'bed') : undefined;
    if (tight) throw new CommandError(tight);
    const cost = chosen ?? pieceCost(s, cityId, piece)!;
    const label = chosen ? `${chosen.frame.name} ${bedSize(BED_MARKET[country]!, chosen.frame.size)!.label} Bed` : PIECE_LABEL[piece].replace(/^An? /, '');
    if (!payFromBank(s, person, cost.amount, `${PIECE_LABEL[piece]}, bought and delivered`, 'home')) throw new CommandError('The bank couldn’t pay for it.');
    addItem(s, person, { kind: `furniture:${piece}`, label, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, acquiredAt: s.now, paid: cost.amount, bulky: true,
      ...(piece === 'bed' && BED_MARKET[country] ? { bed: { country, size: chosen?.frame.size ?? DEFAULT_BED_SIZE[country]! } } : {}) });
    // A new bed brings its own mattress.
    if (piece === 'bed') delete person.mattressAt;
    return { paid: cost.amount };
  });
}

/** A state's mattress recycling fee on a bed bought there, in dollars, or nothing. */
export function mattressFeeUsd(cityId: string, at: number): number {
  const steps = MATTRESS_FEE_USD[CITIES.get(cityId)?.parentId ?? ''];
  return steps ? [...steps].reverse().find((s) => at >= s.from)!.usd : 0;
}

/**
 * What movers charge to take one's own bed and sofa from one home to the
 * next (\`MOVERS\`, and \`MOVERS_ABROAD\` across a border), in the save's
 * money; nothing without pieces of one's own, or where no figure is kept.
 */
export function moversCost(sim: Simulation, person: Person, fromCity: string, toCity: string, fromHome = homeKeyOf(person.home)): Money {
  // Furniture of one's own to move: a bed, a sofa, or from 2026-10-02 any piece bought for the home.
  if (!hadAt(person, fromHome, 'bed') && !hadAt(person, fromHome, 'sofa') && !itemsOf(person).some((i) => i.kind.startsWith('ikea:') && i.at.kind === 'home' && i.at.home === fromHome)) return 0;
  const from = CITIES.get(fromCity);
  const to = CITIES.get(toCity);
  if (!from || !to) return 0;
  // Abroad: the pair's own estimate, either way.
  if (from.countryId !== to.countryId) {
    const abroad = MOVERS_ABROAD[[from.countryId, to.countryId].sort().join('|')];
    return abroad ? inSave(sim, Math.round(abroad.amount * 100), abroad.currency) : 0;
  }
  const rates = MOVERS[from.countryId];
  if (!rates) return 0;
  const miles = distanceKm(from, to) / 1.609344;
  const units = miles <= 100 ? rates.local(miles) : rates.far;
  return units === undefined ? 0 : inSave(sim, Math.round(units * 100), rates.currency);
}

/**
 * A cargo van of one's own where the move starts, a road to the new home and
 * a license to drive it there (from 2026-09-30): it carries the bed and sofa,
 * and the move costs its fuel and upkeep for the road, not the movers.
 */
export function ownVanFor(sim: Simulation, person: Person, fromCity: string, toCity: string): OwnedVehicle | undefined {
  if (!byRoad(fromCity, toCity) || !mayDrive(person, fromCity, sim.now).ok) return undefined;
  return vehiclesOf(person).find((v) => v.soldAt === undefined && !v.repossessed && (v.at ?? v.cityId) === fromCity && kindOf(modelById(v.modelId)!) === 'van');
}

/**
 * A rented truck for the move (`RENTED_TRUCK`): its day, its miles there and
 * back, and its fuel at the town's price, in the save's money; or why it
 * can't be one, and the movers come.
 */
export function truckFor(sim: Simulation, person: Person, fromCity: string, toCity: string): Money | string {
  const from = CITIES.get(fromCity);
  const to = CITIES.get(toCity);
  if (from?.countryId !== 'us' || to?.countryId !== 'us') return 'U-Haul’s in-town rate is kept only in America.';
  const may = mayDrive(person, fromCity, sim.now);
  if (!may.ok) return may.why ?? 'You may not drive here.';
  const miles = roadKm(fromCity, toCity) / 1.609344;
  if (miles > RENTED_TRUCK.withinMiles) return `An in-town truck is kept for a move within ${RENTED_TRUCK.withinMiles} miles; farther, the movers come.`;
  const there = 2 * miles;
  const fuel = there / RENTED_TRUCK.mpg * 3.785411784 * FUEL[jurisdictionOf(fromCity)!].petrol;
  return inSave(sim, Math.round((RENTED_TRUCK.perDay + RENTED_TRUCK.perMile * there) * 100 + fuel), RENTED_TRUCK.currency);
}

/** Movers paid on moving home, where one's own pieces go too; one's own van instead, where there is one; a rented truck, where they'd rather. */
/** Movers, a van or a truck for the bed and sofa at the home left, and every belonging there brought along (`followTheMove`). */
export function carryFurniture(sim: Simulation, person: Person, fromCity: string, toCity: string, fromHome?: string): void {
  payTheMove(sim, person, fromCity, toCity, fromHome ?? homeKeyOf(person.home));
  followTheMove(person, fromHome);
}

function payTheMove(sim: Simulation, person: Person, fromCity: string, toCity: string, fromHome: string | undefined): void {
  if (moversCost(sim, person, fromCity, toCity, fromHome) === 0) return;
  const van = ownVanFor(sim, person, fromCity, toCity);
  if (van) {
    const m = modelById(van.modelId)!;
    const fuel = runningCost(sim, van, roadKm(fromCity, toCity));
    if (!payFromBank(sim, person, fuel, `Your bed and sofa moved in the ${m.make} ${m.model}`, 'home')) owe(sim, person, fuel, 'The move, in your van', 'home');
    return;
  }
  const truck = person.moveBy === 'truck' ? truckFor(sim, person, fromCity, toCity) : undefined;
  if (typeof truck === 'number') {
    if (!payFromBank(sim, person, truck, 'U-Haul’s 15-foot truck, your bed and sofa moved yourself', 'home')) owe(sim, person, truck, 'U-Haul', 'home');
    return;
  }
  const cost = moversCost(sim, person, fromCity, toCity, fromHome);
  if (cost > 0 && !payFromBank(sim, person, cost, 'Movers, your bed and sofa', 'home')) owe(sim, person, cost, 'Movers', 'home');
}

/** When the mattress they sleep on was new: the bed's, or the one put in it since. */
const mattressSince = (person: Person): number | undefined => person.mattressAt ?? itemsOf(person).find((i) => i.kind === 'furniture:bed' && i.at.kind === 'home' && i.at.home === homeKeyOf(person.home))?.acquiredAt;

/** Whether their own mattress has outlived its years. */
export function mattressWorn(person: Person, at: number): boolean {
  const since = mattressSince(person);
  return since !== undefined && at - since >= MATTRESS_YEARS * 365.2425 * MS_DAY;
}

/** What a new mattress costs where they live, the old one taken away, in the save's money; or nothing where none is priced. */
export function mattressCost(sim: Simulation, cityId: string, size?: string): Money | undefined {
  const countryId = CITIES.get(cityId)?.countryId ?? '';
  const country = FURNITURE[countryId];
  // A bed of the country's usual double takes its mattress; another size the cheapest of its size sold there (`content/beds.ts`, from 2026-10-01).
  const other = size && size !== DEFAULT_BED_SIZE[countryId] ? [...(BED_PARTS[countryId]?.mattresses ?? [])].filter((x) => x.size === size).sort((a, b) => a.price - b.price)[0] : undefined;
  if (size && size !== DEFAULT_BED_SIZE[countryId] && !other) return undefined;
  const m = other ? { price: other.price, removal: MATTRESS[countryId]?.removal } : MATTRESS[countryId];
  if (!country || !m) return undefined;
  const taxRate = country.taxAdded ? salesTaxRate(cityId, sim.now, 'furniture') : 0;
  const units = m.price + country.items.bed!.delivery + (m.removal ?? 0);
  const tax = Math.round(m.price * 100 * taxRate);
  const fee = inSave(sim, Math.round(mattressFeeUsd(cityId, sim.now) * 100), 'USD');
  return inSave(sim, Math.round(units * 100) + tax, country.currency) + fee;
}

/**
 * Beds by market (from 2026-10-01, `content/beds.ts`): a frame and a
 * mattress of the same size, the country's own, at IKEA's prices with the
 * country's delivery, tax and fee. A frame with no mattress of its size
 * sold there isn't offered.
 */
export function bedQuote(sim: Simulation, cityId: string, frameId: string, mattressId: string): { amount: Money; tax: Money; frame: BedPart; mattress: BedPart } | string {
  const countryId = CITIES.get(cityId)?.countryId ?? '';
  const parts = BED_PARTS[countryId];
  const country = FURNITURE[countryId];
  if (!parts || !country) return 'SLATE keeps no beds where you live yet.';
  const frame = parts.frames.find((f) => f.id === frameId);
  const mattress = parts.mattresses.find((m) => m.id === mattressId);
  if (!frame || !mattress) return 'Choose a frame and a mattress sold here.';
  if (frame.size !== mattress.size) return `A ${bedSize(BED_MARKET[countryId]!, mattress.size)!.label} mattress doesn’t fit a ${bedSize(BED_MARKET[countryId]!, frame.size)!.label} frame.`;
  const units = frame.price + mattress.price;
  const tax = Math.round(units * 100 * (country.taxAdded ? salesTaxRate(cityId, sim.now, 'furniture') : 0));
  const fee = inSave(sim, Math.round(mattressFeeUsd(cityId, sim.now) * 100), 'USD');
  return { amount: inSave(sim, Math.round((units + country.items.bed!.delivery) * 100) + tax, country.currency) + fee, tax: inSave(sim, tax, country.currency), frame, mattress };
}

/** The beds a town sells, frame and mattress of a size, each frame with each mattress that fits it. */
export function bedsIn(cityId: string): { frame: BedPart; mattress: BedPart }[] {
  const parts = BED_PARTS[CITIES.get(cityId)?.countryId ?? ''];
  return parts ? parts.frames.flatMap((frame) => parts.mattresses.filter((m) => m.size === frame.size).map((mattress) => ({ frame, mattress }))) : [];
}

/** The bed they sleep in at home: its country and size, an older bed its country's usual double. */
export function bedAtHome(person: Person): { country: string; size: string; widthCm: number } | undefined {
  const item = itemsOf(person).find((i) => i.kind === 'furniture:bed' && i.at.kind === 'home' && i.at.home === homeKeyOf(person.home));
  if (!item) return undefined;
  const country = item.bed?.country ?? CITIES.get(person.home?.cityId ?? '')?.countryId ?? 'us';
  const size = item.bed?.size ?? DEFAULT_BED_SIZE[country] ?? 'queen';
  const market = BED_MARKET[country];
  return { country, size, widthCm: (market && bedSize(market, size)?.widthCm) ?? SLEEPS_TWO_CM };
}

/** Whether their bed at home sleeps only one: under 120 cm wide. */
export const bedSleepsOne = (person: Person): boolean => (bedAtHome(person)?.widthCm ?? SLEEPS_TWO_CM) < SLEEPS_TWO_CM;

/** Why their bed can't take a new mattress here: none sold here fits it, as a British bed in America. */
export function mattressRefusal(person: Person, cityId: string): string | undefined {
  const bed = bedAtHome(person);
  if (!bed) return 'You have no bed of your own.';
  const here = CITIES.get(cityId)?.countryId ?? '';
  const market = BED_MARKET[bed.country];
  const label = market ? bedSize(market, bed.size)?.label : undefined;
  const sold = bed.size === DEFAULT_BED_SIZE[here] || BED_PARTS[here]?.mattresses.some((m) => m.size === bed.size);
  if (market !== BED_MARKET[here] || !sold) return `No mattress sold here fits your ${label ?? ''} bed.`.replace('  ', ' ');
  return undefined;
}

export function registerMattress(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { paid: Money }>('home.replace_mattress', (_p, { sim: s }) => {
    const person = s.player;
    if (!owns(person, 'bed')) throw new CommandError('You have no bed of your own.');
    const no = mattressRefusal(person, person.home?.cityId ?? person.currentLocationId);
    if (no) throw new CommandError(no);
    const cost = mattressCost(s, person.home?.cityId ?? person.currentLocationId, bedAtHome(person)!.size);
    if (cost === undefined) throw new CommandError('SLATE keeps no mattress price where you live yet.');
    if (!payFromBank(s, person, cost, 'A new mattress, delivered and the old one taken away', 'home')) throw new CommandError('The bank couldn’t pay for it.');
    person.mattressAt = s.now;
    return { paid: cost };
  });
}
