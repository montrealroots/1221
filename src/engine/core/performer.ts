/**
 * SLATE — actor, or actress.
 *
 * The industry keeps both words and means something by the difference:
 * award categories are split down it, casting breakdowns are written in it,
 * and a performer is billed in one or the other. A game that only ever says
 * "actor" is not neutral; it is describing half its players in the wrong
 * word.
 *
 * One rule, in one place. A person may choose their title outright. Absent a
 * choice, pronouns decide — she/her is an actress, everyone else an actor —
 * which is the industry's own default and is wrong rarely enough that the
 * override covers it. Nothing in the simulation branches on the title except
 * the award categories that are named for it; it is a word, not a stat.
 */

export type PerformerTitle = 'actor' | 'actress';

export const PERFORMER_TITLES: readonly PerformerTitle[] = ['actor', 'actress'];

/** The title pronouns imply, absent a choice. */
export function impliedPerformerTitle(pronouns: string): PerformerTitle {
  return /^\s*she\b/i.test(pronouns) ? 'actress' : 'actor';
}

/** The title a person goes by. An explicit choice wins; otherwise pronouns decide. */
export function performerTitleOf(person: {
  pronouns: string;
  performerTitle?: PerformerTitle | undefined;
}): PerformerTitle {
  return person.performerTitle ?? impliedPerformerTitle(person.pronouns);
}

/** The word itself, capitalised as a title. */
export function performerWord(title: PerformerTitle): 'Actor' | 'Actress' {
  return title === 'actress' ? 'Actress' : 'Actor';
}

/**
 * A label written for an actor, as it reads for this performer.
 *
 * Whole words only: "Character Actor" becomes "Character Actress", and a
 * "Reactor" is left alone. Applying it twice is the same as applying it once.
 */
export function performerLabel(label: string, title: PerformerTitle): string {
  if (title !== 'actress') return label;
  return label.replace(/\bActor\b/g, 'Actress').replace(/\bactor\b/g, 'actress');
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
