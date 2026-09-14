/**
 * SLATE — the reasons finished work comes apart.
 *
 * The maturity vector exists so that done can be the minimum across six things
 * rather than the state of one. That only means anything if the six can move
 * downward, and until now nothing in the engine ever sent one down. The ladder
 * was a ladder nobody ever fell off.
 *
 * The research is blunt about what the fall is for. A finished, funny,
 * perfectly cut act can be destroyed at week nineteen by a withdrawn consent, a
 * duty-of-care escalation, a fairness obligation or a compliance note — and in
 * some forms a lawyer can destroy finished work at week nineteen. That is the
 * sentence this file exists to make true.
 *
 * ## A finding is a row, and the damage is not in the row
 *
 * Every row here says one thing: which dimension it takes down and how far, as
 * a distance rather than as the name of a rung. `down: 1` is a note. `'floor'`
 * is the bottom of whatever ladder this form is measured against. `'room'` is
 * the rung the production's own cutting room hands a part up to, which is one
 * step below the grade on a picture and four below lock on a season, because a
 * season's ladder carries a producer, an executive and a broadcaster above the
 * cutting room and a picture's carries a grade.
 *
 * Distances and not names, because a rung id is a form-specific fact wearing
 * ordinary clothes. Two ladder sets happen to share five of their six columns
 * today. The third one will not, and a row naming `'assembly'` would silently
 * stop working rather than fail.
 *
 * What a finding costs is not written in the row at all. It is `fell` — how
 * many rungs the part actually dropped — times everything that was standing on
 * the rung it dropped from. The same withdrawn consent is free in week two and
 * ruinous in week nineteen, and nothing here says so: the ladder says so.
 *
 * ## What is real here and what is ours
 *
 * Every row is an event the research names, cited. The weights are SLATE's
 * own — the corpus gives frequencies for almost none of this — chosen so the
 * cheap, routine findings are most of what happens and the catastrophes are
 * rare, which is the shape the research describes even where it gives no
 * number. The one frequency it does give is two to four rounds of notes per
 * episode, and the deck is weighted so a season sees about that.
 */

import type { DimensionId } from './maturity';

// ---------------------------------------------------------------------------
// What a finding is
// ---------------------------------------------------------------------------

/**
 * How far down a finding sends a dimension.
 *
 * A number is that many rungs. `'floor'` is the bottom of the ladder, which is
 * what a withdrawn signature means whatever form it lands on. `'room'` is the
 * rung the cutting room hands work up to, so a note that sends a cut back to
 * the cutting room costs whatever this form has built above the cutting room —
 * which is the whole difference between the forms, said once, in one word.
 */
export type HowFar = number | 'floor' | 'room';

/** What has to be true of a production before a finding can happen to it. */
export interface Needs {
  /** The production banks material. Above this ratio it has more than it logged. */
  ratioAbove?: number;
  /**
   * Some period of the plan moves this dimension while the work is going on.
   *
   * The shape of the plan, never its name. A form that clears its rights in
   * prep and files a chain of title has no live consent to withdraw; a form
   * whose consent is a standing relationship with people who are still in the
   * room does. That difference is visible in the periods and nowhere else.
   */
  movedDuringTheWork?: DimensionId;
  /** There are rungs above the cutting room for somebody to send it back from. */
  aboveTheRoom?: true;
  /** The picture hangs off an underlying right the company holds on paper. */
  onPaper?: true;
  /**
   * A piece of the delivery list the company has not filed yet.
   *
   * What makes filing early a real decision rather than a chore. A gap in the
   * chain of title is not an event that happens on a Tuesday, it is a fact
   * about the paperwork that stays true until somebody proves otherwise — and
   * the proof is the certificate. Sit on it and it can be found; file it and
   * the question is closed.
   */
  unfiled?: string;
}

export interface Finding {
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** What happened, the way the person who found it would say it. */
  what: string;
  /** Which dimension it takes down. */
  dimension: DimensionId;
  /** How far down. */
  down: HowFar;
  /** One part, or everything that has not gone out. */
  scope: 'part' | 'whole';
  /** How much of the deck this row is. SLATE's own. */
  weight: number;
  /** What has to be true before it can happen at all. */
  needs?: Needs;
  /** Where it comes from. */
  source: string;
}

// ---------------------------------------------------------------------------
// The deck
// ---------------------------------------------------------------------------

/**
 * Everything that can be found in work that is already finished.
 *
 * Ordered heaviest first, which is also cheapest first — and that ordering is
 * the point rather than a coincidence. Most of what a review turns up is a
 * note. The season-ending ones are at the bottom of the list because they are
 * at the bottom of the deck.
 */
export const FINDINGS: readonly Finding[] = [
  {
    id: 'compliance-note',
    label: 'A Compliance Note',
    what: 'A compliance editor watches the cut line by line and sends back a list with timecodes on it: a logo, a bystander, a minor’s face, a word that’s wrong for the hour it goes out. The fix is a few seconds long, and the pass it just failed has to happen again.',
    dimension: 'compliance',
    down: 1,
    scope: 'part',
    weight: 0.26,
    source: 'KINDS.md: a line-by-line viewing for defamation, fairness, harm and offense, then the blur-and-bleep pass — 1-3 days per episode, plus re-views after every change',
  },
  {
    id: 'notes-round',
    label: 'A Note From The People Paying',
    what: 'The cut comes back from one level up with notes about structure and people rather than frames. The game is confusing, find a hero, we don’t care about her. It goes back a step, and on a form with a producer, an executive and a broadcaster stacked above the room, a step is not far and there are a lot of them.',
    dimension: 'picture',
    down: 1,
    scope: 'part',
    weight: 0.22,
    needs: { aboveTheRoom: true },
    source: 'KINDS.md: rounds-per-approval is the universal cost multiplier; 2-4 rounds of notes per episode',
  },
  {
    id: 'coverage-debt',
    label: 'Coverage Debt Comes Due',
    what: 'The edit reaches the act and needs the person to say why they did it, and no story producer ever asked. The moment was caught and it isn’t cuttable, and the pickup that would make it cuttable comes back from a contributor who now knows how it ended.',
    dimension: 'performance',
    down: 1,
    scope: 'part',
    weight: 0.14,
    needs: { ratioAbove: 40 },
    source: 'KINDS.md: a high ratio is not coverage — what is missing is discovered in the edit, months after the person is reachable',
  },
  {
    id: 'master-rejected',
    label: 'The Master Comes Back',
    what: 'A technical review runs the master end to end and logs faults against timecode: a dropout, a caption out of sync, a wrong credit, loudness off the outlet’s number. Creatively there’s nothing wrong with it, and it still isn’t a file anybody will accept.',
    dimension: 'conform',
    down: 'floor',
    scope: 'part',
    weight: 0.13,
    source: 'PIPELINE.md: quality control at runtime plus 50-100%, reporting in 24-48 hours, rejecting for faults nobody watching would notice',
  },
  {
    id: 'withdrawn-consent',
    label: 'A Withdrawn Consent',
    what: 'A person on screen takes back their appearance agreement, because they’ve left, because they’ve seen the edit, or because the protocol gave them the right to withdraw whenever they liked. Every beat built on them goes, and it un-finishes furthest exactly where the work had climbed highest.',
    dimension: 'rights',
    down: 'floor',
    scope: 'part',
    weight: 0.11,
    needs: { movedDuringTheWork: 'rights' },
    source: 'KINDS.md: the contributor who withdraws consent after lock, and a right to withdraw at any time written into the duty-of-care plan',
  },
  {
    id: 'chain-gap',
    label: 'A Gap In The Chain',
    what: 'A signature is missing from the paper trail that proves the company owns what it’s about to sell. An actor who never signed, a co-writer who won’t assign, an option that ran out while the picture was in post. The picture is fine. The company can’t show it owns it.',
    dimension: 'rights',
    down: 'floor',
    scope: 'whole',
    weight: 0.06,
    needs: { onPaper: true, unfiled: 'chain' },
    source: 'PIPELINE.md: chain of title is the unbroken paper trail, and a break in it stops the insurance, which stops the sale',
  },
  {
    id: 'lost-moment',
    label: 'A Moment Nobody Caught',
    what: 'The proposal, the fight, the collapse happened once. No camera was pointed at it, the radio mic was flat, or the card got wiped before the second copy finished. What’s left is the rung that says it never happened, and an episode that has to be built round the hole by people who were counting on it.',
    dimension: 'performance',
    down: 'floor',
    scope: 'part',
    weight: 0.04,
    needs: { ratioAbove: 40 },
    source: 'KINDS.md: an unverified wipe, a flat radio mic, drifting timecode — the unrepeatable event nobody can shoot again',
  },
];

export const findingById = (id: string): Finding | undefined =>
  FINDINGS.find((one) => one.id === id);

/** What the whole deck weighs, for walking it. */
export const deckWeight = (deck: readonly Finding[]): number =>
  deck.reduce((n, one) => n + one.weight, 0);

// ---------------------------------------------------------------------------
// How often
// ---------------------------------------------------------------------------

/**
 * The chance a week of looking at one part turns something up, at nothing to
 * hide and at everything to hide.
 *
 * SLATE's own, both ends. The corpus gives two to four rounds of notes per
 * episode and a compliance pass re-viewed after every change, and these are
 * fitted so a season's episode draws about that many findings across the weeks
 * its cut is standing above the cutting room. The low end is not zero, because
 * a picture with its paperwork filed and its coverage shot to a plan still gets
 * a note; it is low enough that the note is the only thing it ever gets.
 */
export const REVIEW_RATE = { clean: 0.015, exposed: 0.17 } as const;
