/**
 * SLATE — actor, or actress.
 *
 * They are two words for two jobs' worth of people, and the business has
 * always kept them apart: separate awards, separate categories, separate
 * columns in a trade paper. So the game keeps them apart too. A person is one
 * or the other, and every label about that person uses their word. Every list
 * that would otherwise pile them together is split, and both halves get a
 * heading of their own.
 *
 * How a person's title is decided, in order: the title they carry, if they
 * carry one, because it is theirs to state; then the record's own statement of
 * their gender, for the real people the game reads in; then their pronouns,
 * she/her being an actress and everyone else an actor, which is the industry's
 * own default. Nobody's title is ever guessed from their name.
 *
 * It is a word, not a stat. Nothing about how well somebody acts, what they
 * are worth, or what they are offered branches on it — only what they are
 * called, which award categories are open to them, and which column they are
 * listed in.
 */

export type PerformerTitle = 'actor' | 'actress';

export const PERFORMER_TITLES: readonly PerformerTitle[] = ['actor', 'actress'];

/** The word itself, singular and plural. */
export const PERFORMER_NOUN: Readonly<Record<PerformerTitle, string>> = { actor: 'Actor', actress: 'Actress' };
export const PERFORMER_PLURAL: Readonly<Record<PerformerTitle, string>> = { actor: 'Actors', actress: 'Actresses' };

/** The title pronouns imply, absent anything better. */
export function impliedPerformerTitle(pronouns: string): PerformerTitle {
  return /^\s*she\b/i.test(pronouns) ? 'actress' : 'actor';
}

/**
 * The title a record's stated gender implies.
 *
 * Only for the real people the game reads in from the public record, where
 * gender is a field somebody else filled in. Anything the record does not
 * state plainly comes back undefined rather than being decided here.
 */
export function titleFromGender(gender: string | undefined): PerformerTitle | undefined {
  if (!gender) return undefined;
  const lower = gender.toLowerCase();
  if (lower === 'female' || lower === 'woman' || lower === 'trans woman' || lower === 'transgender female') return 'actress';
  if (lower === 'male' || lower === 'man' || lower === 'trans man' || lower === 'transgender male') return 'actor';
  return undefined;
}

/** The title a person is routed by. An explicit one wins; otherwise pronouns decide. */
export function performerTitleOf(person: {
  pronouns: string;
  performerTitle?: PerformerTitle | undefined;
}): PerformerTitle {
  return person.performerTitle ?? impliedPerformerTitle(person.pronouns);
}

/** What to call this person: "Actor" or "Actress". */
export function performerNoun(person: { pronouns: string; performerTitle?: PerformerTitle | undefined }): string {
  return PERFORMER_NOUN[performerTitleOf(person)];
}

/**
 * Splits a list of people into the two columns, in the order the business
 * lists them, with everybody kept.
 */
export function splitByTitle<T extends { pronouns: string; performerTitle?: PerformerTitle | undefined }>(
  people: readonly T[],
): { actors: T[]; actresses: T[] } {
  const actors: T[] = [];
  const actresses: T[] = [];
  for (const person of people) (performerTitleOf(person) === 'actress' ? actresses : actors).push(person);
  return { actors, actresses };
}

/**
 * The same, for the records read off the public record, which state a gender
 * rather than pronouns. Anybody the record does not state is kept in a third
 * list rather than being sorted into a column they did not choose.
 */
export function splitRecordsByTitle<T extends { gender?: string }>(
  people: readonly T[],
): { actors: T[]; actresses: T[]; unstated: T[] } {
  const actors: T[] = [];
  const actresses: T[] = [];
  const unstated: T[] = [];
  for (const person of people) {
    const title = titleFromGender(person.gender);
    if (title === 'actress') actresses.push(person);
    else if (title === 'actor') actors.push(person);
    else unstated.push(person);
  }
  return { actors, actresses, unstated };
}

/**
 * Whether an award category is open to a performer of this title.
 *
 * A category that names one title is closed to the other; one that names
 * neither, or both, is open to everyone. "Best Actress" does not take an
 * actor, "Best Performance" takes anybody.
 */
export function categoryAdmits(category: string, title: PerformerTitle): boolean {
  const lower = category.toLowerCase();
  const namesActress = /\bactress\b/.test(lower);
  const namesActor = /\bactor\b/.test(lower);
  if (namesActress && !namesActor) return title === 'actress';
  if (namesActor && !namesActress) return title === 'actor';
  return true;
}

/**
 * A name that carries the word, rendered for one person.
 *
 * Traits and career labels are written with both words in the data — "Method
 * Actor/Actress" — because the data does not know whose sheet it is on. This
 * picks the right half when it does.
 */
export function forTitle(label: string, title: PerformerTitle): string {
  return label.replace(/\bActor\/Actress\b/g, PERFORMER_NOUN[title])
    .replace(/\bactor\/actress\b/g, title);
}
