/**
 * SLATE — mastery of every genre there is.
 *
 * The player is the best actor or actress who has ever lived, and this is the
 * part of that claim which is about the work rather than the instrument: there
 * is no genre they cannot do. A period piece, a slasher, a Wuxia, a mumblecore
 * two-hander, a Kabuki adaptation — all of it, at the top of it.
 *
 * Every mastery is derived from `FILM_GENRES` rather than written out, so the
 * two lists can never disagree: add a genre and the mastery for it exists, in
 * the same order, with no second file to remember.
 */

import type { TraitDef } from '../domain/attributes';
import { FILM_GENRES } from './interests';

/**
 * What a mastery says, in the words the game would use.
 *
 * One sentence, the same shape for all of them on purpose. A hundred and
 * forty-nine hand-written variations would read as a hundred and forty-nine
 * different claims; this is one claim, made about every genre in turn.
 */
function masteryOf(label: string): string {
  return `Everything ${label} asks of a performer, at the top of what the form can do with it.`;
}

export const GENRE_MASTERIES: readonly TraitDef[] = FILM_GENRES
  .map((genre) => ({
    id: `genre_${genre.id}`,
    name: `${genre.label} Mastery`,
    category: 'Genre' as const,
    description: masteryOf(genre.label),
  }))
  // Sorted by the mastery's own name, not inherited from the genre order.
  // Adding a word to the end reorders any pair where one genre name begins the
  // other: "Horror Comedy Mastery" comes before "Horror Mastery", where the
  // genres themselves run Horror then Horror Comedy.
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

export const GENRE_MASTERY_BY_ID: Readonly<Record<string, TraitDef>> =
  Object.fromEntries(GENRE_MASTERIES.map((one) => [one.id, one]));

/** The mastery that belongs to one genre, by that genre's id. */
export function masteryForGenre(genreId: string): TraitDef | undefined {
  return GENRE_MASTERY_BY_ID[`genre_${genreId}`];
}
