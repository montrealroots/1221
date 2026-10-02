/**
 * SLATE — toiletries, and the barbers and salons (Stage 5 of
 * `docs/BACKLOG.md`, from 2026-10-01; the products and places in
 * `content/hygiene.ts`).
 *
 * **Supplies** are items in the bathroom, bought at the grocery chains,
 * used as people use them: a shower 11.3 g of body wash (Loretz et al.
 * 2006, weighed use, via the EPA's Exposure Factors Handbook), or 2.6 g of
 * a bar of soap (a 1983 industry average, the only figure found), and
 * 11.76 g of shampoo (Loretz), hair taken as washed every shower, SLATE's
 * estimate; a day two brushings of a pea-sized 0.25 g of toothpaste (the
 * CDC and the ADA) and 0.898 g of deodorant (Hall et al. 2007); a
 * toothbrush replaced every three months (the ADA). The morning's own
 * shower, the one nobody chooses, uses them too.
 *
 * **Without them** a shower still rinses but doesn't leave them as clean:
 * at most 85 without soap or body wash, 90 without shampoo; a morning
 * without toothpaste or deodorant starts five fresher points down for each.
 * Those sizes are SLATE's estimates. Toilet paper, razors and the rest are
 * on sale and kept, not used up: most chains don't say how many sheets are
 * on a roll, and nothing reads a shave.
 *
 * A life is given a set of each to start, the cheapest of each kind where
 * it lives, and on a day with time for the shops what's run out is bought
 * again. Where SLATE keeps no chain's toiletries, they aren't counted.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import type { Money } from '../core/money';
import { salesTaxRate } from '../content/tax';
import { GROCERY_CHAINS } from '../content/groceries';
import { SALONS, TOILETRIES as BATHROOM, type Salon, type Toiletry } from '../content/hygiene';
import { CLEANING } from '../content/cleaning';
import type { CatalogEntry } from './catalog';
import { inSaveMoney } from './banking';
import { spend } from './household';
import { closedNow } from './errands';
import { addItem, homeKeyOf, itemsOf, reachable, type Item } from './items';
import { stow } from './trips';

/** What makes an item a supply: its kind, its unit and how much is left. */
export interface Supply { kind: string; unit: 'g' | 'ml' | 'ct'; left: number }
export type Supplied = Item & { supply: Supply };

/** Conditioner from 2026-10-02: Loretz et al. 2008's 13.13 g a use (the EPA's Exposure Factors Handbook, ch. 17), used where there is some; nobody is given it to start, and it isn't bought again unasked. */
export const USE = { bodyWashG: 11.3, soapG: 2.6, shampooG: 11.76, conditionerG: 13.13, toothpasteG: 0.25, brushings: 2, deodorantG: 0.898, toothbrushDays: 90 } as const;
/** What going without does: a shower's ceiling without a cleanser and without shampoo, and a morning's points for each daily thing missing. SLATE's estimates. */
export const WITHOUT = { cleanser: 85, shampoo: 90, daily: 5 } as const;
/** The kinds a life keeps and uses up. */
export const KEPT = ['body-wash', 'shampoo', 'toothpaste', 'toothbrush', 'deodorant'] as const;
/**
 * The cleaning a home uses up, counted from 2026-10-02 (`content/cleaning.ts`): a wash's laundry detergent, a load each, and
 * a dishwasher's tablet a cycle, at the 184 cycles a year the Department of Energy's test procedure takes for a household's
 * use. Dish soap, sprays, bleach, paper towels, bin bags and sponges are on sale and kept, not used up: nobody publishes how
 * fast a household gets through them.
 */
export const CLEANING_KEPT = ['laundry-detergent', 'dishwasher-detergent'] as const;
export const DISHWASHER_CYCLES_A_DAY = 184 / 365;
/** A week's use of each, below which it's bought again: two loads of a person's one or two a week (`LAUNDRY`), and a week of dishwasher cycles. */
export const CLEANING_LOW: Readonly<Record<(typeof CLEANING_KEPT)[number], number>> = { 'laundry-detergent': 2, 'dishwasher-detergent': 7 * DISHWASHER_CYCLES_A_DAY };
/** Everything the chains sell for the bathroom and for cleaning. */
const TOILETRIES: readonly Toiletry[] = [...BATHROOM, ...CLEANING];

const MARKET: Readonly<Record<string, string>> = { us: 'US', uk: 'GB', ie: 'IE', ca: 'CA', mx: 'MX' };
const marketOf = (cityId: string) => MARKET[cityId.split('-')[0] ?? ''];
const chainsHere = (cityId: string) => new Set(GROCERY_CHAINS.filter((c) => c.storesIn.includes(cityId) || c.nearestTo.includes(cityId)).map((c) => c.id));

export const toiletryById = (id: string): Toiletry | undefined => TOILETRIES.find((t) => t.id === id);
export const salonById = (id: string): Salon | undefined => SALONS.find((s) => s.id === id);
export const salonsIn = (cityId: string): Salon[] => SALONS.filter((s) => s.cityId === cityId);

/** One, with the town's sales tax where it's added, in the save's money. */
export function toiletryPrice(sim: Simulation, cityId: string, t: Toiletry): Money {
  const tax = t.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'toiletries');
  return inSaveMoney(sim, Math.round(t.price * (1 + tax) * 100), t.currency);
}

const KIND_LABEL: Readonly<Record<string, string>> = {
  soap: 'Soap', 'body-wash': 'Body Wash', shampoo: 'Shampoo', conditioner: 'Conditioner', toothpaste: 'Toothpaste', toothbrush: 'Toothbrushes', deodorant: 'Deodorant',
  razor: 'Razors', 'shaving-cream': 'Shaving Cream', 'toilet-paper': 'Toilet Paper', floss: 'Floss', pads: 'Pads', tampons: 'Tampons',
  'dish-soap': 'Dish Soap', 'dishwasher-detergent': 'Dishwasher Detergent', 'laundry-detergent': 'Laundry Detergent', 'all-purpose-cleaner': 'All-Purpose Cleaner',
  bleach: 'Bleach', 'paper-towels': 'Paper Towels', 'trash-bags': 'Trash Bags', sponges: 'Sponges',
};

/** The toiletries on sale where they are. */
export function toiletryCatalog(sim: Simulation, cityId: string): CatalogEntry<Toiletry>[] {
  const chains = chainsHere(cityId);
  return TOILETRIES.filter((t) => chains.has(t.chain)).map((t) => ({
    id: t.id, label: t.name, value: t, basis: 'Shelf Price, Tax In', price: toiletryPrice(sim, cityId, t), priceKind: 'advertised' as const,
    facets: { kind: KIND_LABEL[t.kind] ?? 'Other', chain: GROCERY_CHAINS.find((c) => c.id === t.chain)?.name ?? t.chain },
  }));
}

export const suppliesOf = (person: Person): Supplied[] => itemsOf(person).filter((i): i is Supplied => i.supply !== undefined);

/** What's to hand of a kind, with some left. */
const toHand = (sim: Simulation, person: Person, kind: string): Supplied[] => suppliesOf(person).filter((i) => i.supply.kind === kind && i.supply.left > 0 && reachable(sim, person, i.at));

/** Uses an amount of the first kind there's enough of; true where there was some. */
function take(sim: Simulation, person: Person, kinds: readonly string[], amount: number): boolean {
  for (const kind of kinds) {
    const have = toHand(sim, person, kind);
    if (have.length === 0) continue;
    let need = kind === 'soap' ? USE.soapG : amount;
    for (const i of have) {
      const used = Math.min(need, i.supply.left);
      i.supply.left -= used;
      need -= used;
      if (i.supply.left <= 1e-9) person.items = itemsOf(person).filter((x) => x.id !== i.id);
      if (need <= 1e-9) break;
    }
    return true;
  }
  return false;
}

/** Whether they keep count of toiletries: a life given its set where SLATE keeps the shops. */
export const keepsSupplies = (person: Person): boolean => person.suppliesSince !== undefined;

/** A shower's cleansers used: how clean it can leave them. */
export function showerUses(sim: Simulation, person: Person): number {
  if (!keepsSupplies(person)) return 100;
  const cleansed = take(sim, person, ['body-wash', 'soap'], USE.bodyWashG);
  const shampooed = take(sim, person, ['shampoo'], USE.shampooG);
  // Conditioner after the shampoo, where it's been bought.
  if (shampooed) take(sim, person, ['conditioner'], USE.conditionerG);
  return Math.min(cleansed ? 100 : WITHOUT.cleanser, shampooed ? 100 : WITHOUT.shampoo);
}

/** A day's teeth and deodorant: the freshness lost for what's missing. A toothbrush wears a day's share of its three months. */
export function dailyCare(sim: Simulation, person: Person): number {
  if (!keepsSupplies(person)) return 0;
  const brush = toHand(sim, person, 'toothbrush').find((b) => b.condition > 0);
  if (brush) brush.condition = Math.max(0, brush.condition - 1 / USE.toothbrushDays);
  const teeth = Boolean(brush) && take(sim, person, ['toothpaste'], USE.toothpasteG * USE.brushings);
  const fresh = take(sim, person, ['deodorant'], USE.deodorantG);
  return (teeth ? 0 : WITHOUT.daily) + (fresh ? 0 : WITHOUT.daily);
}

/** Whether their detergents are counted: from the first day after 2026-10-02 they keep a home with its toiletries counted. */
export const keepsCleaning = (person: Person): boolean => person.cleaningSince !== undefined;

/** Whether there's the laundry detergent for so many loads to hand. */
export function detergentFor(sim: Simulation, person: Person, loads: number): boolean {
  return !keepsCleaning(person) || toHand(sim, person, 'laundry-detergent').reduce((n, i) => n + i.supply.left, 0) + 1e-9 >= loads;
}

/** The laundry detergent for so many loads, used, where it's counted. */
export function laundryDetergent(sim: Simulation, person: Person, loads: number): void {
  if (keepsCleaning(person) && loads > 0) take(sim, person, ['laundry-detergent'], loads);
}

/** A day's share of a dishwasher's cycles, its tablets used; false where there are none, and the dishes are done by hand. */
export function dishwasherRuns(sim: Simulation, person: Person): boolean {
  if (!keepsCleaning(person)) return true;
  return take(sim, person, ['dishwasher-detergent'], DISHWASHER_CYCLES_A_DAY);
}

/** Why they can't buy it here, or nothing. */
export function toiletryRefusal(person: Person, id: string, quantity: number, at?: Instant): string | undefined {
  const t = toiletryById(id);
  if (!t) return 'That isn’t on sale.';
  if (!chainsHere(person.currentLocationId).has(t.chain)) return 'There’s no store of that chain here.';
  if (!(Number.isInteger(quantity) && quantity >= 1 && quantity <= 10)) return 'From one to ten.';
  if (!(person.home && person.home.cityId === person.currentLocationId)) return 'Toiletries go home to your bathroom, here.';
  // Only while the store is open, for a purchase made at a moment; the day's restocking is done in its open hours (`systems/errands.ts`).
  if (at !== undefined) { const shut = closedNow(t.chain, GROCERY_CHAINS.find((c) => c.id === t.chain)?.name ?? 'The store', person.currentLocationId, at); if (shut) return shut; }
  return undefined;
}

/** Buys toiletries: paid, and into the bathroom. */
export function buyToiletries(sim: Simulation, person: Person, id: string, quantity: number, inOpenHours = false): Money {
  const no = toiletryRefusal(person, id, quantity, inOpenHours ? undefined : sim.now);
  if (no) throw new CommandError(no);
  const t = toiletryById(id)!;
  const paid = toiletryPrice(sim, person.currentLocationId, t) * quantity;
  if (!spend(sim, person, paid, GROCERY_CHAINS.find((c) => c.id === t.chain)?.name ?? 'A chemist', 'personal')) throw new CommandError('The payment didn’t go through.');
  for (let i = 0; i < quantity; i += 1) giveToiletry(sim, person, t, Math.round(paid / quantity));
  return paid;
}

function giveToiletry(sim: Simulation, person: Person, t: Toiletry, paid?: Money): void {
  // A toothbrush is one brush a count; anything else is its size.
  // Carried, or in the car, until a trip out is home (`stow`).
  stow(person, addItem(sim, person, { kind: t.id, label: t.name, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: CLEANING.includes(t) ? 'storage' : 'bathroom' }, acquiredAt: sim.now, ...(paid !== undefined ? { paid } : {}), supply: { kind: t.kind, unit: t.sizeUnit, left: t.sizeQty } }), sim.now);
}

/** The cheapest of a kind, a gram or a brush: in a store in reach of the town, or anywhere in its market. Nothing where SLATE keeps none. */
export function cheapestToiletry(sim: Simulation, cityId: string, kind: string, inReach = true): Toiletry | undefined {
  const market = marketOf(cityId);
  const chains = chainsHere(cityId);
  return TOILETRIES.filter((t) => t.market === market && t.kind === kind && (!inReach || chains.has(t.chain)))
    .sort((a, b) => toiletryPrice(sim, cityId, a) / Math.max(1, a.sizeQty) - toiletryPrice(sim, cityId, b) / Math.max(1, b.sizeQty))[0];
}

/** The set a life begins with, once, where SLATE keeps its market's toiletries. */
export function starterSupplies(sim: Simulation, person: Person): boolean {
  if (keepsSupplies(person) || !person.home) return false;
  // Owned, not bought: a store in reach's where there is one, the market's otherwise.
  const picks = KEPT.map((kind) => cheapestToiletry(sim, person.home!.cityId, kind) ?? cheapestToiletry(sim, person.home!.cityId, kind, false));
  if (picks.some((p) => !p)) return false;
  for (const p of picks) giveToiletry(sim, person, p!);
  person.suppliesSince = sim.now;
  return true;
}

/** The detergents a home begins with, once, beside its toiletries: laundry detergent, and the dishwasher's where it has one. */
export function starterCleaning(sim: Simulation, person: Person, dishwasher: boolean): boolean {
  if (keepsCleaning(person) || !keepsSupplies(person) || !person.home) return false;
  const kinds = CLEANING_KEPT.filter((k) => dishwasher || k !== 'dishwasher-detergent');
  const picks = kinds.map((kind) => cheapestToiletry(sim, person.home!.cityId, kind) ?? cheapestToiletry(sim, person.home!.cityId, kind, false));
  if (picks.some((p) => !p)) return false;
  for (const p of picks) giveToiletry(sim, person, p!);
  person.cleaningSince = sim.now;
  return true;
}

/** What's run out bought again on a free day, the cheapest of each in a store here; a worn toothbrush thrown out. How many bought. */
export function restock(sim: Simulation, person: Person, dishwasher = false): number {
  if (!keepsSupplies(person) || !person.home || person.home.cityId !== person.currentLocationId) return 0;
  const worn = suppliesOf(person).filter((i) => i.supply.kind === 'toothbrush' && i.condition <= 0);
  if (worn.length) person.items = itemsOf(person).filter((i) => !worn.some((w) => w.id === i.id));
  let bought = 0;
  const cleaning = keepsCleaning(person) ? CLEANING_KEPT.filter((k) => dishwasher || k !== 'dishwasher-detergent') : [];
  for (const kind of [...KEPT, ...cleaning]) {
    const have = toHand(sim, person, kind).filter((i) => kind !== 'toothbrush' || i.condition > 0);
    // A detergent is bought again with a week's use left, as people buy it before it's out: until 2026-10-02 only once it
    // was, and a working life went weeks without washing between free days (the lives replayed at ce72adf3: 1,048 refused).
    const low = CLEANING_LOW[kind as (typeof CLEANING_KEPT)[number]];
    const left = have.reduce((n, i) => n + i.supply.left, 0);
    if (low !== undefined ? left >= low : have.length > 0 || (kind === 'body-wash' && toHand(sim, person, 'soap').length > 0)) continue;
    const pick = cheapestToiletry(sim, person.currentLocationId, kind);
    if (!pick || toiletryRefusal(person, pick.id, 1)) continue;
    try { buyToiletries(sim, person, pick.id, 1, true); bought += 1; } catch (e) { if (!(e instanceof CommandError)) throw e; }
  }
  return bought;
}

/** A salon's tip, the custom's middle: Emily Post's 15 to 20% in America and Canada, Debrett's 10% in Britain, 5 to 10% in Ireland, AFAR's 10 to 20% in Mexico. */
export const SALON_TIP: Readonly<Record<string, number>> = { US: 0.175, CA: 0.175, GB: 0.1, IE: 0.075, MX: 0.15 };
/** Minutes for a service whose list gives none, and what a visit does for the mood. SLATE's estimates. */
export const GROOMING = { minutes: 45, morale: 3 } as const;

/** A service at a salon: its price with the tip, in the save's money, and its minutes; nothing where the price isn't known. */
export function groomingQuote(sim: Simulation, s: Salon, service: string): { price: Money; tip: Money; minutes: number } | undefined {
  const svc = s.services.find((x) => x.service === service);
  if (!svc || svc.price === null) return undefined;
  const share = SALON_TIP[marketOf(s.cityId) ?? 'US'] ?? 0;
  return { price: inSaveMoney(sim, Math.round(svc.price * 100), svc.currency), tip: inSaveMoney(sim, Math.round(svc.price * share * 100), svc.currency), minutes: svc.minutes ?? GROOMING.minutes };
}

/** Why this service can't be had, or nothing. */
export function groomingRefusal(sim: Simulation, person: Person, salonId: string, service: string): string | undefined {
  const s = salonById(salonId);
  if (!s) return 'No such place.';
  if (s.cityId !== person.currentLocationId) return `${s.name} is in another town.`;
  if (!s.services.some((x) => x.service === service)) return 'They don’t offer that.';
  if (!groomingQuote(sim, s, service)) return 'SLATE doesn’t know their price for it.';
  return undefined;
}

/** When they last had their hair cut or styled. */
export const lastGroomed = (person: Person): Instant | undefined => person.groomedAt;
export const daysSince = (sim: Simulation, at: Instant | undefined): number | undefined => (at === undefined ? undefined : Math.floor((sim.now - at) / MS_DAY));

export function registerHygiene(sim: Simulation): void {
  sim.onCommand<{ productId: string; quantity?: number }, { paid: Money }>('hygiene.buy', (p, { sim: s }) => ({ paid: buyToiletries(s, s.player, String(p?.productId), Number(p?.quantity ?? 1)) }));
}
