/**
 * SLATE — what the year decides, and why a trophy has to be worth money.
 *
 * An awards system is the easiest thing in a studio game to build badly. A ceremony
 * fires, a name is printed, a counter goes up, and nothing anywhere reads the
 * counter — which is the defect this repository has a tool for. The old build had
 * exactly that: an awards module whose only output was a notification.
 *
 * So this file starts from the other end. A win is worth three things, all of them
 * read somewhere else, and the categories exist to hang those three on:
 *
 *   - **The library is worth more.** A picture that wins is still playing, and the
 *     windows that have not opened yet open bigger. That is the honest mechanism —
 *     awards do not make a film that already finished earn retroactively, they make
 *     the parts of its life still ahead of it worth more.
 *   - **Everybody on it gets the credit.** A win counts as a result for the people in
 *     the winning posts, which moves standings, which changes what they cost next
 *     time and who will take your calls.
 *   - **It is a reason to have made the other kind of picture.** A page built for
 *     depth and dialogue loses to a spectacle in the takings and beats it here, so
 *     the two halves of the script pool finally point at two different prizes.
 *
 * ## Why a category is a post
 *
 * Because a category that did not name a job could not credit anybody, and crediting
 * people is two of the three things a win is for. Best Direction is the director's
 * award and moves the director's standing. The one exception is the picture itself,
 * which credits everybody above the line — the people an audience has heard of.
 *
 * ## What is deliberately not here
 *
 * No nominations, no campaigning, no voting bodies with tastes of their own. Those
 * are real and they are all decisions somebody could make, which is exactly why they
 * should arrive as their own module with their own readers rather than as fields on
 * this one nothing looks at.
 */

/** What the year gives out. */
export interface Award {
  /** Stable id. Saved on a project, so renaming one costs a migration. */
  id: string;
  /** What it is called. */
  label: string;
  /**
   * The post it credits, where it credits one.
   *
   * Absent on the picture itself, which credits everybody above the line. Read when
   * a win is turned into a result on somebody's record.
   */
  postId?: string;
  /**
   * What the remaining windows are worth after winning this, as a multiplier.
   *
   * The picture carries more than any single craft award, which is the true shape of
   * it: a best film wins an audience and a best editing award wins respect.
   */
  liftsWindows: number;
  /** What the room is actually rewarding, said in a sentence. */
  rewards: string;
}

/**
 * Seven, one for each thing the model can already tell apart.
 *
 * Every row credits a post that exists in `content/craft.ts`, except the first. A
 * category for a job the engine does not model would be a name with nothing behind
 * it, which is how an awards system becomes decoration.
 */
export const AWARDS: readonly Award[] = [
  {
    id: 'picture',
    label: 'Picture Of The Year',
    liftsWindows: 1.55,
    rewards: 'The whole of it: what was on the page, who was in it, and how it was made.',
  },
  {
    id: 'direction',
    label: 'Direction',
    postId: 'director',
    liftsWindows: 1.22,
    rewards: 'The one job the rest of the picture is downstream of.',
  },
  {
    id: 'writing',
    label: 'Writing',
    postId: 'writer',
    liftsWindows: 1.18,
    rewards: 'Whether there was anything underneath it.',
  },
  {
    id: 'performance',
    label: 'Lead Performance',
    postId: 'lead',
    liftsWindows: 1.26,
    rewards: 'The face people came for, doing more than turning up.',
  },
  {
    id: 'photography',
    label: 'Photography',
    postId: 'photography',
    liftsWindows: 1.10,
    rewards: 'What it looked like, which is the first thing anybody notices and the '
      + 'last thing anybody credits.',
  },
  {
    id: 'cutting',
    label: 'Editing',
    postId: 'cutting',
    liftsWindows: 1.08,
    rewards: 'What it turned out to have been.',
  },
  {
    id: 'music',
    label: 'Music',
    postId: 'music',
    liftsWindows: 1.09,
    rewards: 'What it felt like from outside.',
  },
];

export const AWARD_BY_ID: Readonly<Record<string, Award>> = Object.fromEntries(
  AWARDS.map((a) => [a.id, a]),
);

export const awardById = (id: string | undefined): Award | undefined =>
  (id === undefined ? undefined : AWARD_BY_ID[id]);

/**
 * The month the ceremony falls in, from January.
 *
 * February, which puts it a couple of months after the awards season the release
 * calendar already leans into — so a picture opened in October to be seen by the
 * room is still inside its own run when the room votes, and the lift lands on
 * windows that have not opened. A ceremony in the same month as the releases would
 * have nothing left to lift.
 */
export const CEREMONY_MONTH = 1;

/** How far back the room looks, in months. */
export const CONSIDERS_MONTHS = 14;

/**
 * How much of what the room is judging is the page, against how it was made.
 *
 * Deliberately weighted towards the craft posts rather than towards the script,
 * because the script's own reward is that it decides word of mouth and therefore the
 * length of the run. A model where the page won both would make the dials the only
 * decision in the game.
 */
export const ROOM_WEIGHS = { craft: 0.62, page: 0.26, mouth: 0.12 };

/**
 * What a picture is worth to the room, 0 upward.
 *
 * Takings are deliberately absent. A room that rewarded the highest-grossing picture
 * would be a second chart, and the whole point of having awards beside a box office
 * is that they can disagree — a quiet picture that nobody went to can win, and a
 * studio can be run to win either one.
 */
export function standsWithTheRoom(
  craftStands: number,
  servesItsGenre: number,
  wordOfMouth: number,
): number {
  return craftStands * ROOM_WEIGHS.craft
    + servesItsGenre * ROOM_WEIGHS.page
    + (wordOfMouth + 1) / 2 * ROOM_WEIGHS.mouth;
}

/**
 * How far a draw may move a picture up or down the room's order.
 *
 * A room that simply ranked by a number would make the ceremony an announcement of
 * something already knowable, and every year would go to whoever spent most on a
 * director. A fifth either way is enough that a favorite usually wins and sometimes
 * does not, which is what a room is.
 */
export const THE_ROOM_IS_A_ROOM = 0.2;
