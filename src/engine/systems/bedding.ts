/**
 * SLATE — bedding on the bed (the master plan's §35b, from 2026-10-06; the
 * sets and their prices in `content/bedding.ts`). Until then a bed had no
 * sheets: nothing on it was owned, worn or washed.
 *
 * A set is bought for the bed at home, of its size, where a price for one was
 * read, and kept in the drawers. Each night slept at home is a night on the
 * set in use, the one of the bed's size nearest its wash; at the Sleep
 * Foundation's seven it's due one, and the next clean set goes on. A load of
 * laundry at home washes every set due, each taken as one garment's room in
 * the drum, SLATE's estimate: no set's weight was read. A bed whose sets are
 * all due is shown as so, and sleeps no worse for it: nothing SLATE has read
 * sizes what unwashed sheets do to a night's sleep.
 */

import { salesTaxRate } from '../content/tax';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { BEDDING_NIGHTS, BEDDING_SETS, type BeddingSet } from '../content/bedding';
import { inSaveMoney } from './banking';
import { spend } from './household';
import { addItem, homeKeyOf, itemsOf, type Item } from './items';
import { bedAtHome } from './furniture';
import { atHome } from './dwelling';

type Bedding = Item & { bedding: NonNullable<Item['bedding']> };

/** The bedding sets they own at the home they live in. */
export const beddingOf = (person: Person): Bedding[] => {
  const home = homeKeyOf(person.home);
  return itemsOf(person).filter((i): i is Bedding => Boolean(i.bedding) && i.at.kind === 'home' && i.at.home === home);
};

/** The sets sold for the bed at home, with their prices in the save's money; none where no price was read for its size. */
export function beddingOffers(sim: Simulation, person: Person): { set: BeddingSet; cost: Money }[] {
  const bed = bedAtHome(person);
  const country = CITIES.get(person.home?.cityId ?? '')?.countryId;
  if (!bed || !country) return [];
  // America's and Canada's shelf prices are before the sales tax, added at the till; Britain's, Ireland's and
  // Mexico's include their VAT (from 2026-10-06; until then America's and Canada's were charged without it).
  const tax = country === 'us' || country === 'ca' ? salesTaxRate(person.home!.cityId, sim.now, 'furniture') : 0;
  return BEDDING_SETS.filter((s) => s.country === country && s.sizes.includes(bed.size)).map((set) => ({ set, cost: inSaveMoney(sim, Math.round(set.price * (1 + tax) * 100), set.currency) }));
}

/** Why a set can't be bought now, or nothing. */
export function beddingRefusal(sim: Simulation, person: Person, setId: string): string | undefined {
  if (!person.home || person.home.kind === 'sofa' || !atHome(person)) return 'Bedding is bought for a bed at home.';
  const bed = bedAtHome(person);
  if (!bed) return 'You have no bed at home.';
  if (!beddingOffers(sim, person).some((o) => o.set.id === setId)) return `SLATE has no published price here for a set to fit a ${bed.size} bed.`;
  return undefined;
}

/** The set on the bed tonight: a clean one of the bed's size, the one slept in most. */
export function onTheBed(person: Person): Bedding | undefined {
  const bed = bedAtHome(person);
  if (!bed) return undefined;
  return beddingOf(person).filter((b) => b.bedding.size === bed.size && !b.bedding.dirty).sort((a, b) => b.bedding.nights - a.bedding.nights)[0];
}

/** Whether the bed has sets and every one of them is due its wash. */
export function beddingDue(person: Person): boolean {
  const bed = bedAtHome(person);
  const fits = beddingOf(person).filter((b) => b.bedding.size === bed?.size);
  return fits.length > 0 && fits.every((b) => b.bedding.dirty);
}

/** A sleep at home, on the day it ends: a night on the set in use, due its wash at seven. False where there's no clean set. */
export function beddingNight(person: Person, day: string): boolean {
  if (!atHome(person)) return false;
  const set = onTheBed(person);
  // A night a day: a nap the same day on the same set isn't another.
  if (!set || set.bedding.lastDay === day) return false;
  set.bedding.nights += 1;
  set.bedding.lastDay = day;
  if (set.bedding.nights >= BEDDING_NIGHTS) set.bedding.dirty = true;
  return true;
}

/** The sets due a wash, which a load at home takes. */
export const dirtyBedding = (person: Person): Bedding[] => (atHome(person) ? beddingOf(person).filter((b) => b.bedding.dirty) : []);

/** Washed with a load: clean, and none of its nights left. */
export function washBedding(sets: readonly Bedding[]): void {
  for (const b of sets) { delete b.bedding.dirty; b.bedding.nights = 0; }
}

export function registerBedding(sim: Simulation): void {
  sim.onCommand<{ setId: string }, { paid: Money }>('home.buy_bedding', (p, { sim: s }) => {
    const person = s.player;
    const no = beddingRefusal(s, person, String(p?.setId));
    if (no) throw new CommandError(no);
    const { set, cost } = beddingOffers(s, person).find((o) => o.set.id === p.setId)!;
    if (!spend(s, person, cost, `IKEA, ${set.name}`, 'household')) throw new CommandError('The payment didn’t go through.');
    addItem(s, person, { kind: `bedding:${set.id}`, label: set.name, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'drawers' }, acquiredAt: s.now, paid: cost, bedding: { size: bedAtHome(person)!.size, nights: 0 } });
    return { paid: cost };
  });
}
