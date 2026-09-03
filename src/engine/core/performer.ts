/**
 * SLATE — actor, or actress, where the industry insists on one.
 *
 * Everything the player reads carries both words at once — "Actor/Actress",
 * "Method Actor/Actress" — so one page serves everyone who opens it. The one
 * place the game cannot do that is the award categories, which the industry
 * splits down the word: Best Actor and Best Actress are different prizes, and
 * a nominee belongs in one of them.
 *
 * So this decides, for a person, which of those a category admits. A person
 * may carry an explicit title; absent one, pronouns decide — she/her is an
 * actress, everyone else an actor — which is the industry's own default.
 * Nothing else in the simulation branches on it. It is a word, not a stat.
 */

export type PerformerTitle = 'actor' | 'actress';

/** The title pronouns imply, absent a choice. */
export function impliedPerformerTitle(pronouns: string): PerformerTitle {
  return /^\s*she\b/i.test(pronouns) ? 'actress' : 'actor';
}

/** The title a person is routed by. An explicit one wins; otherwise pronouns decide. */
export function performerTitleOf(person: {
  pronouns: string;
  performerTitle?: PerformerTitle | undefined;
}): PerformerTitle {
  return person.performerTitle ?? impliedPerformerTitle(person.pronouns);
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
