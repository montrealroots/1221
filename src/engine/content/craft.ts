/**
 * SLATE — the posts a picture has to fill, and the one thing that stops a list of
 * them being decoration.
 *
 * The deleted crew system had fourteen departments and twenty-four named posts, with
 * head flags, start weeks, union locals and budget floors. It also had no command, so
 * the engine drew the person and nobody ever chose. Worse, it said so in its own
 * docstring: *nothing reads a gaffer's technique.* Fourteen departments of declared
 * words with nothing reading them, which is THE ONE RULE broken fourteen times in a
 * single file.
 *
 * This is the smaller version that bites. Seven posts, and each earns its row by
 * moving a named axis of the finished thing. The test applied to every candidate was:
 * if the worst available person fills this instead of the best, does a figure the
 * player sees change? Seven passed. Transport, catering, locations, publicity,
 * construction, medical and security did not, and they are not here. They can come
 * back the day something reads them.
 *
 * ## The axes, and why there are only two that reach the box office
 *
 * A post moves one of three things, and three is the number because three is what
 * anything downstream reads:
 *
 *   - **craft** — how good it turns out, which becomes word of mouth, which bends
 *     the run. It barely touches the opening.
 *   - **draw** — how many people come at all, which is the height of the opening
 *     and does nothing whatever to word of mouth.
 *   - **thrift** — how much of the budget survives contact with the schedule.
 *
 * That craft and draw are different axes is the whole game in this file. A famous
 * cast fills an opening weekend and does not make anybody recommend the picture
 * afterwards; a fine director is the reverse. A model where both simply meant
 * "better" could produce neither a loved failure nor an unloved hit, and both of
 * those are ordinary.
 *
 * ## Why a post is filled by a person and not by a tier
 *
 * Because the first pass filled them with tiers — Starting Out through First Call —
 * and a tier cannot be hired away, cannot get more expensive after a hit, cannot take
 * a share of the back end instead of a fee, and cannot be the same person you used
 * last time. All four of those are decisions, and a tier is a price tag. `talent.ts`
 * holds what a person is; this holds what a picture needs.
 */

/** What a post moves. Three, because three is what the rest of the engine reads. */
export type Axis = 'craft' | 'draw' | 'thrift';

export const AXES: readonly Axis[] = ['craft', 'draw', 'thrift'];

export const AXIS_SAID: Readonly<Record<Axis, string>> = {
  craft: 'how good it turns out',
  draw: 'how many people come',
  thrift: 'how much of the budget survives',
};

export interface Post {
  /** Stable id. Saved on the project against a person. */
  id: string;
  /** What the department is called. */
  department: string;
  /** What the person filling it is called. */
  title: string;
  /** Which axis this post moves. */
  axis: Axis;
  /**
   * How much of that axis it accounts for, against the other posts on it.
   *
   * Relative rather than absolute: an axis is the weighted mean of the reach of
   * whoever fills each post on it, so these are shares and their scale is arbitrary.
   */
  weight: number;
  /** What this post is for, said to the person choosing. */
  what: string;
  /**
   * Whether this post is above the line.
   *
   * Read twice and both matter: above-the-line people can take points instead of a
   * fee, and they are the ones an audience has heard of, so only they carry between
   * pictures in a lineage. A grip does not sell a sequel.
   */
  aboveTheLine: boolean;
}

/**
 * The seven, and what each is for.
 *
 * The director carries the most weight on craft by a distance, which is the one place
 * this file takes a position. A production is not a democracy of departments, and a
 * model where the composer and the director moved the same amount would be false to
 * the thing it is modeling.
 */
export const POSTS: readonly Post[] = [
  {
    id: 'director',
    department: 'Direction',
    title: 'Director',
    axis: 'craft',
    weight: 40,
    aboveTheLine: true,
    what: 'Decides what it is. Everything below reads their taste, and a picture '
      + 'survives a weak anything else more easily than a weak one of these.',
  },
  {
    id: 'writer',
    department: 'Writing',
    title: 'Writer',
    axis: 'craft',
    weight: 26,
    aboveTheLine: true,
    what: 'Whether there is anything underneath. The one post whose failure cannot '
      + 'be fixed later by spending more.',
  },
  {
    id: 'photography',
    department: 'Photography',
    title: 'Director of Photography',
    axis: 'craft',
    weight: 18,
    aboveTheLine: false,
    what: 'What it looks like, and how many hours a day the unit needs to get it.',
  },
  {
    id: 'cutting',
    department: 'The Cutting Room',
    title: 'Editor',
    axis: 'craft',
    weight: 16,
    aboveTheLine: false,
    what: 'What it turns out to have been. Recovers more bad days than anybody '
      + 'admits, and cannot recover all of them.',
  },
  {
    id: 'lead',
    department: 'The Cast',
    title: 'Lead',
    axis: 'draw',
    weight: 62,
    aboveTheLine: true,
    what: 'Whose face is on it. Most of the reason anybody turns up to something '
      + 'they have not heard of.',
  },
  {
    id: 'music',
    department: 'Music',
    title: 'Composer',
    axis: 'draw',
    weight: 38,
    aboveTheLine: false,
    what: 'What it feels like from outside — the trailer, the theme, the thing '
      + 'people have heard before they have seen anything.',
  },
  {
    id: 'line',
    department: 'Production',
    title: 'Line Producer',
    axis: 'thrift',
    weight: 100,
    aboveTheLine: false,
    what: 'Whether the schedule and the budget describe the same picture. The only '
      + 'post whose whole job is that the others can do theirs.',
  },
];

export const POST_BY_ID: Readonly<Record<string, Post>> = Object.fromEntries(
  POSTS.map((p) => [p.id, p]),
);

export const postById = (id: string | undefined): Post | undefined =>
  (id === undefined ? undefined : POST_BY_ID[id]);

/** The posts on a given axis. */
export const postsOn = (axis: Axis): readonly Post[] => POSTS.filter((p) => p.axis === axis);

/** The posts whose occupant an audience has heard of. */
export const ABOVE_THE_LINE: readonly Post[] = POSTS.filter((p) => p.aboveTheLine);

/**
 * How an axis stands, given the reach of whoever fills each post on it.
 *
 * A weighted mean, so it lands near 1 for an ordinarily staffed picture, under it for
 * a cheaply staffed one and over it for an expensive one. A post nobody has been put
 * in counts as `UNFILLED_REACH` rather than as zero, because an empty post means the
 * production office found a working professional unasked, not that the job went undone.
 */
export function axisStands(axis: Axis, reachOf: (postId: string) => number | undefined): number {
  let weighted = 0;
  let total = 0;
  for (const post of postsOn(axis)) {
    weighted += (reachOf(post.id) ?? UNFILLED_REACH) * post.weight;
    total += post.weight;
  }
  return total > 0 ? weighted / total : 1;
}

/**
 * What an unfilled post is worth.
 *
 * One, exactly: the ordinary working professional the production office would have
 * engaged anyway. Not zero, and not a penalty — a player who leaves every post alone
 * should get an ordinary picture rather than an unmade one, so that filling a post is
 * a decision to do better or cheaper rather than a chore to avoid a hole.
 */
export const UNFILLED_REACH = 1;
