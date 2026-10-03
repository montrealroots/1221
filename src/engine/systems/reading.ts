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
 *
 * From 2026-10-03 a book of one's own is read through (`research-home-gaps.json`):
 * an hour unwinding at home with it reads Brysbaert's 260 words a minute of
 * fiction (his 2019 meta-analysis), and a novel is the 96,398 words that 694
 * English novels average (66.9 million words, a 2020 corpus in Data in
 * Brief), no publisher giving its book's own count. Read through, it's read:
 * it stops counting as something to read, and another is wanted, or the
 * library. The library and an e-reader don't run out: a card lends book
 * after book, and what an e-reader holds isn't kept.
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

/** Brysbaert's fiction reading rate, words a minute, and the corpus's novel, words. */
export const READ_WPM = 260;
export const NOVEL_WORDS = Math.round(66_900_000 / 694);

/** A book of one's own at home not yet read through. */
const unread = (person: Partial<Pick<Person, 'items' | 'home'>>) => { const home = homeKeyOf(person.home as Person['home']); return (person.items ?? []).filter((i) => i.kind.startsWith('book:') && !i.readThrough && i.at.kind === 'home' && i.at.home === home); };

/** Something to read at the home they live in: the town's library card, an unread book or an e-reader there. */
export function hasSomethingToRead(person: Pick<Person, 'home'> & Partial<Pick<Person, 'items' | 'libraryCard'>>): boolean {
  if (person.home && person.libraryCard === person.home.cityId) return true;
  const home = homeKeyOf(person.home);
  return unread(person).length > 0 || (person.items ?? []).some((i) => i.kind.startsWith('ereader:') && i.at.kind === 'home' && i.at.home === home);
}

/** Some minutes read at home: the book they're reading, the one begun first; read through, it's done. The book finished, or nothing. */
export function readFor(sim: Simulation, person: Person, minutes: number): string | undefined {
  const book = unread(person).sort((a, b) => (b.readWords ?? 0) - (a.readWords ?? 0) || a.acquiredAt - b.acquiredAt)[0];
  if (!book) return undefined;
  book.readWords = (book.readWords ?? 0) + minutes * READ_WPM;
  if (book.readWords < NOVEL_WORDS) return undefined;
  book.readThrough = true;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'personal', title: 'A Book Read Through', body: `${book.label}, finished.${hasSomethingToRead(person) ? '' : ' There’s nothing else at home to read: a library card or another book.'}`, importance: 20, route: '/workspace/belongings' });
  return book.label;
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
