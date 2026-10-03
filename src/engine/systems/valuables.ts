/**
 * SLATE — jewelry and watches as valuables: a safe, a burglary, and the
 * insurance on them (the master plan's §29, from 2026-10-02; the safes, the
 * limits and the rate in `content/valuables.ts`).
 *
 * A piece of jewelry or a watch is a valuable by its catalog's category.
 * A burglary (`belongingsDay` in `systems/dwelling.ts`) takes every one at
 * the home that isn't locked in a safe or on them, the day's outfit, and
 * they're gone from what they own. A safe holds what fits in its liters and
 * goes nowhere: bolted down, SLATE's reading of how a home safe is fitted,
 * as insurers want it. The insurance on what's inside pays for the pieces
 * up to the policy's limit on jewelry, with the rest of the claim over its
 * deductible; a piece scheduled on the policy is paid in full, without a
 * deductible, for a premium on the first of each month. Without a policy on
 * what's inside, nothing can be scheduled, and what was lapses.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { CLOTHING_PRODUCTS } from '../content/clothingcatalog';
import { SAFES, SCHEDULED_RATE_YEAR, THEFT_LIMITS, type Safe } from '../content/valuables';
import { inSaveMoney } from './banking';
import { payFromBank, spend } from './household';
import { addItem, homeKeyOf, itemById, itemsOf, moveRefusal, type Item, type Place } from './items';
import { coveredInside } from './dwelling';

const VALUABLE = new Set(CLOTHING_PRODUCTS.filter((p) => p.category === 'jewelry' || p.category === 'watches').map((p) => p.id));

export const isValuable = (item: Item): boolean => VALUABLE.has(item.kind);
export const isSafe = (item: Item): boolean => item.kind.startsWith('safe:');
export const valuablesOf = (person: Person): Item[] => itemsOf(person).filter(isValuable);
export const safeById = (id: string): Safe | undefined => SAFES.find((s) => s.id === id);

/** Where a thing sits at last, through whatever holds it: the home it's at, or nothing; and whether a safe holds it on the way. */
function rootOf(person: Person, item: Item): { home?: string; locked: boolean } {
  let locked = false;
  let at: Place = item.at;
  for (let n = 0; at.kind === 'inside' && n < 20; n += 1) {
    const holder = itemById(person, at.itemId);
    if (!holder) return { locked };
    if (isSafe(holder)) locked = true;
    at = holder.at;
  }
  return { home: at.kind === 'home' ? at.home : undefined, locked };
}

export const lockedAway = (person: Person, item: Item): boolean => rootOf(person, item).locked;

/** The safes at the home they live in. */
export function safesAtHome(person: Person): Item[] {
  const home = homeKeyOf(person.home);
  return itemsOf(person).filter((i) => isSafe(i) && i.at.kind === 'home' && i.at.home === home);
}

/** What's on sale where they live, cheapest first. */
export function safeCatalog(sim: Simulation, person: Person): { safe: Safe; price: Money }[] {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const country = CITIES.get(cityId)?.countryId;
  return SAFES.filter((s) => s.country === country).map((safe) => ({ safe, price: inSaveMoney(sim, Math.round(safe.price * (1 + (safe.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'goods'))) * 100), safe.currency) })).sort((a, b) => a.price - b.price);
}

/** A scheduled piece's premium a month, in the save's money. */
export const scheduledPremium = (item: Item): Money => Math.round((item.paid ?? 0) * SCHEDULED_RATE_YEAR / 12);

export function scheduleRefusal(sim: Simulation, person: Person, item: Item | undefined): string | undefined {
  if (!item || !isValuable(item)) return 'Only jewelry and watches are scheduled.';
  if (!item.paid) return 'There’s no receipt to schedule it at.';
  if (coveredInside(sim, person) === undefined) return 'Scheduling goes on a policy that covers what’s in your home.';
  return undefined;
}

/**
 * A burglary's valuables: every piece at the home that isn't locked away is
 * taken, and gone. Returns what the insurance counts toward the claim before
 * its deductible (the unscheduled pieces up to the policy's limits), and what
 * it pays in full besides (the scheduled ones), in the save's money.
 */
export function burgleValuables(sim: Simulation, person: Person, homeKey: string, insured: boolean): { taken: Item[]; toClaim: Money; inFull: Money } {
  // What they have on is with them, wherever it's kept (`wornNow` in `systems/wardrobe.ts`).
  const worn = new Set(person.wornNow?.itemIds ?? []);
  const taken = valuablesOf(person).filter((i) => { const r = rootOf(person, i); return r.home === homeKey && !r.locked && !worn.has(i.id); });
  if (taken.length === 0) return { taken, toClaim: 0, inFull: 0 };
  const gone = new Set(taken.map((i) => i.id));
  person.items = itemsOf(person).filter((i) => !gone.has(i.id));
  if (!insured) return { taken, toClaim: 0, inFull: 0 };
  const country = CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId;
  const limit = THEFT_LIMITS.find((l) => l.country === country);
  const inMoney = (n: number | undefined) => (n === undefined || !limit ? Infinity : inSaveMoney(sim, Math.round(n * 100), limit.currency));
  const perItem = inMoney(limit?.perItem);
  let toClaim = 0;
  let inFull = 0;
  for (const i of taken) {
    if (i.scheduled) inFull += i.paid ?? 0;
    else toClaim += Math.min(i.paid ?? 0, perItem);
  }
  return { taken, toClaim: Math.min(toClaim, inMoney(limit?.total)), inFull };
}

/** The first of the month: the scheduled pieces' premium, or their lapse where nothing covers the home or it can't be paid. */
export function scheduledMonth(sim: Simulation, person: Person, insured: boolean): void {
  const scheduled = valuablesOf(person).filter((i) => i.scheduled);
  if (scheduled.length === 0) return;
  const premium = scheduled.reduce((sum, i) => sum + scheduledPremium(i), 0);
  if (insured && spend(sim, person, premium, 'Scheduled jewelry and watches', 'insurance')) return;
  for (const i of scheduled) delete i.scheduled;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Your Scheduled Pieces Lapsed', body: insured ? 'The premium couldn’t be paid.' : 'No policy covers what’s in your home now, so there’s none to schedule them on.', importance: 50, route: '/workspace/belongings' });
}

export function registerValuables(sim: Simulation): void {
  sim.onCommand<{ id: string }, { paid: Money }>('valuables.buy_safe', (p, { sim: s }) => {
    const person = s.player;
    const safe = safeById(String(p?.id));
    if (!safe) throw new CommandError('That isn’t on sale.');
    if (!person.home || person.home.kind === 'sofa' || person.home.cityId !== person.currentLocationId) throw new CommandError('A safe is bought where you live, and bolted down there.');
    const priced = safeCatalog(s, person).find((x) => x.safe.id === safe.id);
    if (!priced) throw new CommandError('It’s sold in another country.');
    if (!payFromBank(s, person, priced.price, `${safe.seller}: ${safe.label}`, 'household')) throw new CommandError('The bank couldn’t pay for it.');
    addItem(s, person, { kind: `safe:${safe.id}`, label: safe.label, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, acquiredAt: s.now, paid: priced.price, holdsL: safe.holdsL, bulky: true });
    return { paid: priced.price };
  });
  sim.onCommand<{ itemId: string }, { safe: string }>('valuables.lock_up', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId));
    if (!item || !isValuable(item)) throw new CommandError('Only jewelry and watches go in the safe.');
    const safes = safesAtHome(person);
    if (safes.length === 0) throw new CommandError('There’s no safe where you live.');
    let why = '';
    for (const safe of safes) {
      const to: Place = { kind: 'inside', itemId: safe.id };
      const no = moveRefusal(s, person, item, to);
      if (!no) { item.at = to; return { safe: safe.label }; }
      why = no;
    }
    throw new CommandError(why);
  });
  sim.onCommand<{ itemId: string }, { ok: true }>('valuables.take_out', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId));
    const holder = item?.at.kind === 'inside' ? itemById(person, item.at.itemId) : undefined;
    if (!item || !holder || !isSafe(holder)) throw new CommandError('It isn’t in a safe.');
    const to: Place = { kind: 'home', home: homeKeyOf(person.home) ?? '', spot: 'drawers' };
    const no = moveRefusal(s, person, item, to);
    if (no) throw new CommandError(no);
    item.at = to;
    return { ok: true };
  });
  sim.onCommand<{ itemId: string; on: boolean }, { premium: Money }>('valuables.schedule', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId));
    if (!p?.on) { if (item) delete item.scheduled; return { premium: 0 }; }
    const no = scheduleRefusal(s, person, item);
    if (no) throw new CommandError(no);
    item!.scheduled = true;
    return { premium: scheduledPremium(item!) };
  });
}
