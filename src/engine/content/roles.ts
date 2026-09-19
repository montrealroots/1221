/**
 * SLATE — the parts in the thing, and why one of them was never enough.
 *
 * Until now a picture had a post called Lead and that post was the whole cast. One
 * chair, filled once, standing in for everybody an audience would actually see. It
 * worked, in the sense that the draw axis had something to read — and it meant a
 * two-hander and a twelve-part ensemble were cast by the same single decision, which
 * is the kind of thing that passes every check in the build and is obviously wrong
 * the moment somebody plays it.
 *
 * So the cast is a list, and the list is decided by the shape of the thing. A feature
 * has a lead, a second and a couple of parts worth naming. A continuing series runs
 * on an ensemble, and `content/concept.ts` has been saying so from the day the story
 * engines landed: television is a web of characters, and an engine that turns on
 * people rubbing against each other does not run on two of them.
 *
 * ## Why billing is a weight rather than a rank
 *
 * The first billed part is most of why anybody turns up to something they have not
 * heard of, and the fourth is not. But the fourth is not nothing either, and a model
 * where only the lead counted would make every casting decision after the first one
 * free. So each role carries a share of the draw, falling steeply, and the last
 * couple of parts are worth having somebody real in without being worth a fortune.
 *
 * ## What is deliberately not here
 *
 * No character names, no ages, no descriptions, no auditions, no chemistry between
 * one player and another. The deleted casting system had all of those and its own
 * docstring admitted the parts were called `Lead 1` and `Support 2` because a real
 * name would have been a novel the game had not written. A role here is a slot with
 * a weight on it, which is the honest version of what the model can actually read.
 */

export interface Billing {
  /** Stable id, saved on the project against a person. */
  id: string;
  /** What it is called on a screen. */
  label: string;
  /**
   * Its share of the draw, against the other parts.
   *
   * Falls steeply. The first billed part is most of the reason anybody turns up to
   * something they have not heard of; the fourth is worth having somebody real in
   * and is not worth a fortune.
   */
  weight: number;
}

/**
 * Six, which is as far as billing goes before it stops being a decision.
 *
 * A seventh part exists on the screen and is not a thing a producer spends a morning
 * on, so the list stops where the choosing stops. Everybody past this is the casting
 * office's problem.
 */
export const BILLINGS: readonly Billing[] = [
  { id: 'first', label: 'First Billed', weight: 100 },
  { id: 'second', label: 'Second Billed', weight: 58 },
  { id: 'third', label: 'Third Billed', weight: 34 },
  { id: 'fourth', label: 'Fourth Billed', weight: 20 },
  { id: 'fifth', label: 'Fifth Billed', weight: 12 },
  { id: 'sixth', label: 'Sixth Billed', weight: 7 },
];

export const BILLING_BY_ID: Readonly<Record<string, Billing>> = Object.fromEntries(
  BILLINGS.map((b) => [b.id, b]),
);

export const billingById = (id: string | undefined): Billing | undefined =>
  (id === undefined ? undefined : BILLING_BY_ID[id]);

/**
 * The smallest cast anything is made with.
 *
 * Two. A one-hander is a real thing and it is not a thing this model can say anything
 * useful about, so the floor is where a picture stops being a monologue.
 */
export const FEWEST = 2;

/**
 * How many parts a thing of this shape is cast with.
 *
 * Read off the format and the part count rather than chosen, because a cast size is
 * a fact about the object: a ninety-minute film has a handful of people in it and a
 * twenty-part series has a company. The engine's own `leastPeople` is checked
 * separately at the greenlight and answers a different question — whether the story
 * engine can run at all — so a television picture has to satisfy both.
 */
export function howManyParts(medium: 'film' | 'television', parts: number): number {
  const base = medium === 'television' ? 4 : 3;
  // One more part for every four beyond the first, which gets a six-part limited
  // series to five and a twenty-four part serial to the ceiling.
  const more = Math.floor(Math.max(0, parts - 1) / 4);
  return Math.max(FEWEST, Math.min(BILLINGS.length, base + more));
}

/** The billings a thing of this shape actually casts. */
export const castingFor = (medium: 'film' | 'television', parts: number): readonly Billing[] =>
  BILLINGS.slice(0, howManyParts(medium, parts));

/**
 * How the cast stands, given the reach of whoever is in each part.
 *
 * A weighted mean over the parts this picture actually has, so a two-hander is judged
 * on two people and a company on six. An empty part counts as ordinary for the same
 * reason an empty post does: the casting office filled it without being asked.
 */
export function castStands(
  medium: 'film' | 'television',
  parts: number,
  reachOf: (billingId: string) => number | undefined,
): number {
  const billings = castingFor(medium, parts);
  let weighted = 0;
  let total = 0;
  for (const one of billings) {
    weighted += (reachOf(one.id) ?? 1) * one.weight;
    total += one.weight;
  }
  return total > 0 ? weighted / total : 1;
}

/**
 * How much of the draw the cast accounts for, against the music.
 *
 * The cast is most of it and the music is real. Whose face is on a poster brings
 * people who have heard of nothing else; what it sounds like in a trailer is the
 * other way anybody arrives at something cold.
 */
export const CAST_IS_OF_THE_DRAW = 0.72;
