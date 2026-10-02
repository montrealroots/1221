/**
 * SLATE — reading, and having something to read (the master plan's §34b,
 * from 2026-10-02; the libraries and the prices in `content/reading.ts`).
 *
 * A reader, by their interests, enjoys an hour unwinding at home only with
 * something to read there: a library card of the town they live in, a book
 * of their own, or an e-reader (`lovedIn` in `systems/enjoyment.ts`), as a
 * film lover needs a TV. A library card is had where you live, free to a
 * resident; a book or an e-reader is bought at its seller's price, with the
 * town's sales tax where it's added, and kept at home.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { LIBRARIES, READING_BUYS, type Library, type ReadingBuy } from '../content/reading';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';
import { addItem, homeKeyOf, itemsOf } from './items';

export const libraryIn = (cityId: string): Library | undefined => LIBRARIES.find((l) => l.cityId === cityId);
export const readingBuyById = (id: string): ReadingBuy | undefined => READING_BUYS.find((x) => x.id === id);

/** Something to read at the home they live in: the town's library card, a book or an e-reader there. */
export function hasSomethingToRead(person: Pick<Person, 'home'> & Partial<Pick<Person, 'items' | 'libraryCard'>>): boolean {
  if (person.home && person.libraryCard === person.home.cityId) return true;
  const home = homeKeyOf(person.home);
  return (person.items ?? []).some((i) => (i.kind.startsWith('book:') || i.kind.startsWith('ereader:')) && i.at.kind === 'home' && i.at.home === home);
}

/** What's on sale where they live, cheapest first. */
export function readingCatalog(sim: Simulation, person: Person): { buy: ReadingBuy; price: Money }[] {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const country = CITIES.get(cityId)?.countryId;
  return READING_BUYS.filter((x) => x.country === country).map((buy) => ({ buy, price: inSaveMoney(sim, Math.round(buy.price * (1 + (buy.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'goods'))) * 100), buy.currency) })).sort((a, b) => a.price - b.price);
}

export function cardRefusal(person: Person): string | undefined {
  const city = person.home?.cityId;
  if (!city || person.home!.kind === 'sofa') return 'A library card is had where you live.';
  if (!libraryIn(city)) return 'SLATE doesn’t have the library where you live.';
  if (person.libraryCard === city) return 'You have one.';
  return undefined;
}

export function registerReading(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { library: string }>('reading.library_card', (_p, { sim: s }) => {
    const person = s.player;
    const no = cardRefusal(person);
    if (no) throw new CommandError(no);
    person.libraryCard = person.home!.cityId;
    return { library: libraryIn(person.home!.cityId)!.name };
  });
  sim.onCommand<{ id: string }, { paid: Money }>('reading.buy', (p, { sim: s }) => {
    const person = s.player;
    const buy = readingBuyById(String(p?.id));
    if (!buy) throw new CommandError('That isn’t on sale.');
    if (!person.home || person.home.cityId !== person.currentLocationId) throw new CommandError('It’s bought where you live, and kept at home.');
    const priced = readingCatalog(s, person).find((x) => x.buy.id === buy.id);
    if (!priced) throw new CommandError('It’s sold in another country.');
    if (!payFromBank(s, person, priced.price, `${buy.seller}: ${buy.label}`, 'personal')) throw new CommandError('The bank couldn’t pay for it.');
    addItem(s, person, { kind: `${buy.kind}:${buy.id}`, label: buy.label, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, acquiredAt: s.now, paid: priced.price });
    return { paid: priced.price };
  });
}

/** How many books and e-readers they have, for the screen. */
export const readingOwned = (person: Person): number => itemsOf(person).filter((i) => i.kind.startsWith('book:') || i.kind.startsWith('ereader:')).length;
