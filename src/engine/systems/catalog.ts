/**
 * SLATE — every list of things to buy or book, in one shape (Stage 2 of
 * `docs/BACKLOG.md`, from 2026-10-01). The owner's rule: a catalog shows the
 * cheapest first, by a price that's comparable across the list, and says
 * what the price is: a stay's total against a night's, a full price against
 * an installment, a one-time cost against a monthly one. A price SLATE
 * doesn't know is never taken as nothing. It goes last, said to be a quote or
 * unknown. Search, filters and the other sorts are the player's to change.
 *
 * Favorites, from 2026-10-03 (the master plan's §10): anything in a list
 * can be marked, kept with the character by its list, and a list narrowed to
 * its favorites. The order stays the cheapest first: a favorite is found,
 * not put ahead.
 */

import type { Money } from '../core/money';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';

/** What a list's price is: a published one, SLATE's estimate, a quote to be asked for, or none known. */
export type PriceKind = 'advertised' | 'estimate' | 'quote' | 'unknown';

export interface CatalogEntry<T = unknown> {
  id: string;
  /** Title Case, as the list names it. */
  label: string;
  /** The comparable price, in the save's money; null where it's a quote or unknown. */
  price: Money | null;
  priceKind: PriceKind;
  /** What the price is, the same for every entry in a list: "Total, Taxed And Registered", "The Whole Stay". */
  basis: string;
  /** What it can be filtered by: a facet's name to its value. */
  facets?: Readonly<Record<string, string>>;
  /** Words it's found by, beyond its label. */
  words?: string;
  value: T;
}

export type CatalogSort = 'cheapest' | 'dearest' | 'name';
export const SORT_LABEL: Readonly<Record<CatalogSort, string>> = { name: 'By Name', dearest: 'Most Expensive First', cheapest: 'Cheapest First' };

export interface CatalogView { sort?: CatalogSort; query?: string; filters?: Readonly<Record<string, string>>; /** Only these, a list's favorites as they stood when it was narrowed to them. */ only?: readonly string[] }

/** The ids marked favorite in a list. */
export const favoritesIn = (person: Pick<Person, 'favorites'>, list: string): readonly string[] => person.favorites?.[list] ?? [];

export function registerCatalog(sim: Simulation): void {
  sim.onCommand<{ list: string; id: string }, { favorite: boolean }>('catalog.favorite', (p, { sim: s }) => {
    const list = String(p?.list ?? '');
    const id = String(p?.id ?? '');
    if (!list || !id) throw new CommandError('Choose something in a list.');
    const all = (s.player.favorites ??= {});
    const mine = all[list] ?? [];
    const favorite = !mine.includes(id);
    all[list] = favorite ? [...mine, id] : mine.filter((x) => x !== id);
    if (all[list]!.length === 0) delete all[list];
    return { favorite };
  });
}

/**
 * A list arranged: filtered by its facets and a search, then sorted, the
 * cheapest first unless another sort is asked for. A price unknown or to be
 * quoted goes last in either price order, by name among its kind.
 */
export function arrange<T>(entries: readonly CatalogEntry<T>[], view: CatalogView = {}): CatalogEntry<T>[] {
  const words = (view.query ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const kept = entries.filter((e) => {
    for (const [facet, value] of Object.entries(view.filters ?? {})) if (value && e.facets?.[facet] !== value) return false;
    if (view.only && !view.only.includes(e.id)) return false;
    const text = `${e.label} ${e.words ?? ''}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
  const sort = view.sort ?? 'cheapest';
  return kept.slice().sort((a, b) => {
    if (sort === 'name') return a.label.localeCompare(b.label);
    if (a.price === null || b.price === null) return a.price === null && b.price === null ? a.label.localeCompare(b.label) : a.price === null ? 1 : -1;
    return (sort === 'cheapest' ? a.price - b.price : b.price - a.price) || a.label.localeCompare(b.label);
  });
}

/** A facet's values across a list, for its filter. */
export function facetValues(entries: readonly CatalogEntry[], facet: string): string[] {
  return [...new Set(entries.map((e) => e.facets?.[facet]).filter((v): v is string => Boolean(v)))].sort();
}
