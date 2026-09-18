/**
 * SLATE — the once in a lifetime one.
 *
 * The player is not a talented person who got lucky. They are the best actor
 * or actress alive, and the industry knows it. There is one of them in a save
 * and there has never been another.
 *
 * So the instrument does not start low and climb. It starts at the ceiling of
 * the scale the game keeps for it — all 813 acting attributes, every acting
 * trait there is — and there is nothing on the creation screen that moves any
 * of it, because there is nowhere for it to go.
 *
 * What that premise costs, and what is being done about it, is in
 * `docs/UNBITTEN.md`: a sheet nothing can move is a sheet nothing can read to
 * decide, so the answer is to spend the instrument rather than test it, and to
 * let the industry's picture of it lag what it is.
 *
 * There is no cheat mode in this build, because a cheat mode is for giving a
 * player something the game withheld, and this game withholds nothing about
 * what the player can do. What it does not give them is a career that runs
 * itself, money that does not run out, or an industry that forgives. Being the
 * best there has ever been at the work is not the same as being able to keep
 * the lights on, and that gap is the entire game.
 */

/** The top of every scale in this game. */
export const CEILING = 100;

/**
 * The G.O.A.T. traits.
 *
 * One tier above every other trait in the game, and the player holds all of
 * them at once. They are written to be compatible with each other on purpose:
 * an ordinary trait set is a set of trade-offs, and this is deliberately not
 * that. Nobody else in the world will ever hold one.
 *
 * Each names the discipline it is the greatest at, which is now the only one
 * there is. The field stays anyway: a trait that says what it is the greatest
 * at can be asked, and one that assumes cannot.
 */
export type Discipline = 'acting';

export const DISCIPLINES: readonly Discipline[] = ['acting'];

export const DISCIPLINE_LABEL: Readonly<Record<Discipline, string>> = { acting: 'Acting' };

export interface GoatTrait {
  id: string;
  name: string;
  discipline: Discipline;
  /** What it is, in the words the game would use. */
  description: string;
}

export const GOAT_TRAITS: readonly GoatTrait[] = [
  {
    id: 'goat_truth', name: 'Nothing Between You And It', discipline: 'acting',
    description: 'There’s no performance. There’s only somebody in a room to whom something is happening.',
  },
  {
    id: 'goat_range', name: 'No Ceiling On Range', discipline: 'acting',
    description: 'There’s no part you can’t do, in any register, in any accent, at any age you could plausibly play.',
  },
  {
    id: 'goat_camera', name: 'The Camera Wants You', discipline: 'acting',
    description: 'Something happens between you and a lens that nobody has satisfactorily explained.',
  },
];

export const GOAT_TRAIT_BY_ID: Readonly<Record<string, GoatTrait>> =
  Object.fromEntries(GOAT_TRAITS.map((t) => [t.id, t]));

/** Every G.O.A.T. trait in one discipline. */
export function goatTraitsIn(discipline: Discipline): readonly GoatTrait[] {
  return GOAT_TRAITS.filter((t) => t.discipline === discipline);
}

/** What the chip says, everywhere it appears. */
export const GOAT_LABEL = 'G.O.A.T.';
