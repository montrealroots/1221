/**
 * SLATE — what the thing is actually about, and the dials the writer sets.
 *
 * Everything else in the production system is a decision about *who* and *when*. The
 * format is a shape, the posts are people, the week is a bet against a calendar. None
 * of it says what happens on screen, and a studio game where the player never authors
 * anything is a game about hiring.
 *
 * So this is the authoring layer: a genre, an era, and six dials the writer sets
 * before anybody is engaged. It is the one place a player makes something rather than
 * choosing somebody to make it.
 *
 * ## Why the dials cost something
 *
 * A row of sliders everybody pushes to the top is not a decision, it is a formality
 * with extra clicks. Two things stop that here.
 *
 * **They are paid for out of one pool.** `ATTENTION` is how much a script can carry,
 * and every point on every dial spends from it. A picture that is dense, fast, full
 * of turns and carrying four sub-plots is not ambitious, it is overloaded — and the
 * pool is what says so without anybody being refused.
 *
 * **They pull in different directions.** Pace and plot turns fill an opening; depth
 * and dialogue make people recommend it afterwards. That is the same split the posts
 * have — draw against craft — arriving from the other side, and it means the best
 * script for a summer blockbuster is measurably not the best script for an awards run.
 *
 * ## Why genre is not a multiplier
 *
 * A genre that multiplied the take would be decoration by the rule in
 * `docs/research/PIPELINE.md`. So a genre does nothing to the figure directly. What it
 * does is say **which dials that audience came for**: turns matter in a thriller and
 * barely register in a romance, where the dialogue is the thing. The same script is a
 * good horror picture and a poor drama, and no number was scaled to say so.
 */

/** The six dials, and what each one costs the pool. */
export type Dial = 'depth' | 'dialogue' | 'pace' | 'turns' | 'threads' | 'spectacle';

export const DIALS: readonly Dial[] = ['depth', 'dialogue', 'pace', 'turns', 'threads', 'spectacle'];

export interface DialSaid {
  id: Dial;
  label: string;
  /** What setting it high actually means, said to the person setting it. */
  what: string;
  /**
   * Which side it feeds: the opening, or what people say afterwards.
   *
   * The split that makes the dials a decision rather than a wishlist. A picture can
   * be built to open or built to last, and building it to do both is what the pool
   * refuses to pay for.
   */
  feeds: 'draw' | 'craft';
}

export const DIAL_SAID: readonly DialSaid[] = [
  {
    id: 'depth',
    label: 'Character Depth',
    what: 'People who change, and who existed before the story started.',
    feeds: 'craft',
  },
  {
    id: 'dialogue',
    label: 'Dialogue',
    what: 'Lines worth repeating. The cheapest thing to get right and the hardest.',
    feeds: 'craft',
  },
  {
    id: 'pace',
    label: 'Pace',
    what: 'How fast it moves. Nobody walks out of a fast picture bored, and plenty '
      + 'walk out unmoved.',
    feeds: 'draw',
  },
  {
    id: 'turns',
    label: 'Plot Turns',
    what: 'How often the ground moves. A trailer is made of these.',
    feeds: 'draw',
  },
  {
    id: 'threads',
    label: 'Sub-Plots',
    what: 'How many stories run alongside the one it’s about. They enrich a long '
      + 'thing and clutter a short one.',
    feeds: 'craft',
  },
  {
    id: 'spectacle',
    label: 'Spectacle',
    what: 'What there is to look at. It’s why people go out to see a thing rather '
      + 'than waiting for it.',
    feeds: 'draw',
  },
];

export const DIAL_BY_ID: Readonly<Record<string, DialSaid>> = Object.fromEntries(
  DIAL_SAID.map((d) => [d.id, d]),
);

/** The highest any one dial goes. Five, so a screen can draw it without a number. */
export const MOST = 5;

/**
 * How much a script can carry across all six dials together.
 *
 * Eighteen of a possible thirty, so a writer can max three dials or spread six at
 * three apiece, and cannot have everything. The figure is SLATE's own and it is the
 * single most load-bearing number in this file: too high and the pool stops being a
 * constraint, too low and every script is thin.
 */
export const ATTENTION = 18;

/** What a set of dials spends. */
export const spent = (dials: Readonly<Partial<Record<Dial, number>>>): number =>
  DIALS.reduce((sum, d) => sum + Math.max(0, Math.min(MOST, dials[d] ?? 0)), 0);

/** What is left to spend. */
export const leftToSpend = (dials: Readonly<Partial<Record<Dial, number>>>): number =>
  ATTENTION - spent(dials);

/**
 * Why this script cannot be written as set.
 *
 * One refusal, and it names both numbers, because a refusal that does not say how far
 * over you are is a wall.
 */
export function whyNotWrite(dials: Readonly<Partial<Record<Dial, number>>>): string | undefined {
  for (const d of DIALS) {
    const at = dials[d];
    if (at === undefined) continue;
    if (!Number.isInteger(at) || at < 0 || at > MOST) {
      return `${DIAL_BY_ID[d]!.label} runs from 0 to ${MOST}, and ${at} isn’t in that range.`;
    }
  }
  const used = spent(dials);
  if (used > ATTENTION) {
    return `A script carries ${ATTENTION} points across all six and this asks for ${used}. `
      + 'Something has to come down.';
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Genre
// ---------------------------------------------------------------------------

export interface Genre {
  id: string;
  label: string;
  /**
   * What this audience came for, as a weight per dial.
   *
   * The whole of what a genre does. Weights sum to roughly the same total across
   * genres, so no genre is better than another — they want different things, and a
   * script set for one is measurably wrong for another.
   */
  wants: Readonly<Record<Dial, number>>;
  /** What it is, said to the person choosing. */
  what: string;
}

/**
 * Nine, which is where the list stopped being distinguishable.
 *
 * Each row is a different shape of want rather than a different label. The test was
 * the same one the formats got: if two genres want the same dials in the same order,
 * they are one genre with two names.
 */
export const GENRES: readonly Genre[] = [
  {
    id: 'drama',
    label: 'Drama',
    what: 'People, and what happens to them. The default, and the hardest to do well.',
    wants: { depth: 3.0, dialogue: 2.4, pace: 0.6, turns: 0.8, threads: 1.4, spectacle: 0.4 },
  },
  {
    id: 'thriller',
    label: 'Thriller',
    what: 'Something is wrong and it’s getting worse.',
    wants: { depth: 1.0, dialogue: 0.9, pace: 2.4, turns: 3.0, threads: 0.8, spectacle: 0.5 },
  },
  {
    id: 'comedy',
    label: 'Comedy',
    what: 'It’s funny, which is a craft and not a tone.',
    wants: { depth: 1.2, dialogue: 3.2, pace: 2.0, turns: 0.9, threads: 1.0, spectacle: 0.3 },
  },
  {
    id: 'romance',
    label: 'Romance',
    what: 'Two people, and whether.',
    wants: { depth: 2.6, dialogue: 2.8, pace: 0.7, turns: 0.6, threads: 1.4, spectacle: 0.5 },
  },
  {
    id: 'action',
    label: 'Action',
    what: 'Bodies in motion and a reason to care which way they go.',
    wants: { depth: 0.7, dialogue: 0.7, pace: 2.8, turns: 1.2, threads: 0.4, spectacle: 2.8 },
  },
  {
    id: 'horror',
    label: 'Horror',
    what: 'Dread first, and the thing itself as late as possible.',
    wants: { depth: 0.9, dialogue: 0.6, pace: 2.2, turns: 2.0, threads: 0.4, spectacle: 2.5 },
  },
  {
    id: 'crime',
    label: 'Crime',
    what: 'A world with its own rules, and one person breaking them.',
    wants: { depth: 2.0, dialogue: 2.2, pace: 1.4, turns: 2.0, threads: 1.4, spectacle: 0.6 },
  },
  {
    id: 'scifi',
    label: 'Science Fiction',
    what: 'One thing about the world is different, and everything follows from it.',
    wants: { depth: 1.6, dialogue: 1.2, pace: 1.4, turns: 1.8, threads: 1.0, spectacle: 2.6 },
  },
  {
    id: 'family',
    label: 'Family',
    what: 'Made so that nobody in the room is bored and nobody is frightened.',
    wants: { depth: 1.4, dialogue: 1.6, pace: 2.2, turns: 0.8, threads: 0.6, spectacle: 2.4 },
  },
];

export const GENRE_BY_ID: Readonly<Record<string, Genre>> = Object.fromEntries(
  GENRES.map((g) => [g.id, g]),
);

export const genreById = (id: string | undefined): Genre | undefined =>
  (id === undefined ? undefined : GENRE_BY_ID[id]);

/**
 * How well a script serves the audience its genre brings, 0 to about 1.4.
 *
 * A weighted mean of the dials against what the genre wants, over the most it could
 * have wanted. One is a script that spent its attention exactly where this audience
 * looks. Well under one is a picture at odds with its own label — which is allowed,
 * and is how a player discovers that a talky action film is nobody's favorite.
 */
export function servesIts(genre: Genre, dials: Readonly<Partial<Record<Dial, number>>>): number {
  let got = 0;
  let could = 0;
  for (const d of DIALS) {
    const want = genre.wants[d];
    got += want * Math.max(0, Math.min(MOST, dials[d] ?? 0));
    could += want * MOST;
  }
  // Against what the same attention spent perfectly would have bought, so a script
  // is judged on where it put its points and not on having more of them.
  const ideal = could * (ATTENTION / (DIALS.length * MOST));
  return ideal > 0 ? got / ideal : 0;
}

/**
 * What the dials do to each side, as two multipliers around one.
 *
 * Read by the box office: `draw` lifts or drops the opening, `craft` moves word of
 * mouth. Both are scaled by how well the script serves its genre, which is what makes
 * the genre read without it ever multiplying a result.
 */
export function whatItReads(
  genre: Genre,
  dials: Readonly<Partial<Record<Dial, number>>>,
): { draw: number; craft: number; serves: number } {
  const serves = servesIts(genre, dials);
  const side = (which: 'draw' | 'craft') => {
    const on = DIAL_SAID.filter((d) => d.feeds === which);
    const at = on.reduce((sum, d) => sum + Math.max(0, Math.min(MOST, dials[d.id] ?? 0)), 0);
    // Against what an even spread across this side would be, so a script that put
    // everything into the opening reads above one there and below one on the other.
    const even = (ATTENTION / DIALS.length) * on.length;
    return even > 0 ? at / even : 1;
  };
  return {
    draw: 1 + (side('draw') - 1) * 0.35 * serves,
    craft: 1 + (side('craft') - 1) * 0.35 * serves,
    serves,
  };
}

/** A script nobody has set the dials on, which is what an unwritten picture has. */
export const UNWRITTEN: Readonly<Record<Dial, number>> = {
  depth: 3, dialogue: 3, pace: 3, turns: 3, threads: 3, spectacle: 3,
};
