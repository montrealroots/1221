/**
 * SLATE — how a picture gets made, written down as a plan the engine can run.
 *
 * A greenlight is a date, not a mood. The moment somebody says yes, a picture
 * stops being an idea with a budget attached and becomes a set of periods with
 * a crew coming on at the start of one of them and a delivery date at the end.
 * Everything expensive happens inside those periods, and every way a picture
 * dies is a period going wrong.
 *
 * ## Periods are data, and that is the point
 *
 * The obvious build was four stages in an enum — prep, shoot, post, deliver —
 * with the engine walking them by name. It would have worked for a live-action
 * feature and been wrong for everything else. You do not prep an animated
 * film; you board it, and the board is the shoot. A documentary shoots for two
 * years and cuts for one. A multi-camera sitcom shoots a show a week for
 * twenty-two weeks and posts each one in four days.
 *
 * So a plan is a list of periods, and the engine runs whatever list it is
 * handed. Adding a way of making something is adding a `Plan` here. No stage
 * machinery has to learn about it, because there is no stage machinery — there
 * is a list, and a cursor walking it.
 *
 * ## The shoot is the unit everything else is measured in
 *
 * Every real schedule is built off the shoot. Prep is quoted in weeks before
 * the first day. Post is quoted in weeks after wrap. Nobody plans a picture by
 * saying post will take nineteen weeks in the abstract; they say post is a bit
 * over twice the shoot and work from there. Each period carries `per`, which is
 * its length in shooting weeks, and the shoot itself is 1.
 *
 * ## What is real here and what is ours
 *
 * The delivery list is real. Every element on it is something a distributor
 * actually withholds money over, and the reason it is modeled at all is that
 * it is the failure nobody expects: a picture that is shot, cut, mixed and
 * finished, sitting unpaid because the music cue sheet was never filed. The
 * schedule proportions are SLATE's own, sized off the ordinary shape of a
 * mid-budget feature, and say so.
 */

import type { BookingKind } from '../domain/model';
import type { Stage } from '../domain/company';
import type { DimensionId } from './maturity';

// ---------------------------------------------------------------------------
// A period
// ---------------------------------------------------------------------------

export interface Period {
  id: string;
  /** What the picture's stage reads while this one is running. */
  stage: Stage;
  /** Title Case, for a screen. */
  label: string;
  /** What happens in it, in the world's words. */
  what: string;
  /**
   * How long it runs, as a multiple of the plan's base period.
   *
   * Exactly one period in a plan carries `per: 1`, and it is the one the
   * producer actually chooses the length of — the shoot on a feature, the
   * field on an unscripted season. Everything else is quoted against it, the
   * way a real schedule is. Deliberately not called "shooting weeks" any
   * more: a season that never shoots a scripted page still has a base period,
   * and naming this after the live-action case is how an engine ends up
   * unable to express anything else.
   */
  per: number;
  /**
   * The period this one begins alongside, rather than after.
   *
   * Without it every period starts when the last one ends, which is a
   * live-action assumption wearing a general name. On an unscripted season
   * post begins on field day one and runs months past wrap; the field and the
   * cut are the same calendar, not two. A period naming another here starts
   * when that one starts and runs its own length from there.
   */
  runsWith?: string;
  /**
   * Whether it holds a stage, and at what rate.
   *
   * A period that holds one takes it off the same board a paying tenant books
   * from, so the family's own picture and a Netflix unit compete for the same
   * four rooms. That competition is the reason the lot was worth building as a
   * business instead of a backdrop.
   */
  holds?: BookingKind;
  /** The share of the budget that goes out across it. The shares sum to 1. */
  spends: number;
  /**
   * What finishing this period moves, and to which rung.
   *
   * The join between the calendar and the maturity vector. A period ending is
   * the event that advances a dimension, which is why a picture that has
   * finished post is not automatically deliverable: post moves picture, sound
   * and conform, and it does not touch rights or compliance at all. Those are
   * somebody else's job and they are the ones that hold a finished thing up.
   */
  advances?: Partial<Record<DimensionId, string>>;
  /**
   * What a week of this period produces, counted the way the people in it
   * count it.
   *
   * A shoot is counted in days and nothing else — a crew says "day 22 of 30",
   * never "week five". Prep and post are counted in weeks. An animated
   * picture, when it comes, counts approved shots, and none of the machinery
   * around this has to change to let it: the period says what its unit is and
   * how many of them a week holds, and everything downstream asks.
   */
  unit: { one: string; many: string; aWeek: number };
}

export interface Plan {
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** What this way of making something is, said to somebody choosing it. */
  what: string;
  /** Which media it is available for. */
  media: readonly ('film' | 'television')[];
  /** The periods, in the order they are declared. */
  periods: readonly Period[];
  /**
   * Weeks between the end of the work and the contractual delivery date. The
   * window exists so that finishing is not the same as delivering, because it
   * is not.
   */
  deliveryWeeks: number;
  /** Which ladder set its maturity is measured against. */
  ladders: string;
  /**
   * Which end of the schedule is nailed down.
   *
   * `start` is a picture: work begins when the money says it can, and the
   * delivery date is whatever falls out of the far end. `delivery` is a
   * broadcast season: the transmission date is agreed against a format
   * document before anybody knows what the content is, and the work is fitted
   * backward into the room left in front of it. Those are opposite clocks,
   * and an engine that only has the first can only make pictures.
   */
  anchor: 'start' | 'delivery';
}

// ---------------------------------------------------------------------------
// The plans
// ---------------------------------------------------------------------------

/**
 * A live-action feature, shot on stages.
 *
 * The proportions are SLATE's own and are sized off the ordinary mid-budget
 * shape: prep a little under the length of the shoot, post a bit over twice
 * it. A thirty-day picture on a five-day week is six shooting weeks, which
 * lands prep at about five weeks, post at about fifteen, and a delivery date
 * around ten months from the day the crew came on. That is a recognizable
 * feature schedule and it falls out of one number.
 */
const FEATURE: Plan = {
  id: 'feature',
  label: 'A Feature, Shot On Stages',
  what: 'Prep, a shoot, and a long post. The ordinary shape of a picture made indoors.',
  media: ['film'],
  deliveryWeeks: 6,
  anchor: 'start',
  ladders: 'picture',
  periods: [
    {
      id: 'prep',
      stage: 'prep',
      label: 'Prep',
      what: 'The crew comes on, the sets go up, and the money starts going out before a frame is shot.',
      per: 0.85,
      holds: 'prep',
      spends: 0.2,
      advances: { rights: 'optioned' },
      unit: { one: 'week of prep', many: 'weeks of prep', aWeek: 1 },
    },
    {
      id: 'shooting',
      stage: 'shooting',
      label: 'Principal Photography',
      what: 'The shoot. The most expensive weeks of the picture, and the ones that can’t be done again cheaply.',
      per: 1,
      holds: 'shooting',
      spends: 0.5,
      advances: { picture: 'shot', performance: 'captured' },
      unit: { one: 'shooting day', many: 'shooting days', aWeek: 5 },
    },
    {
      id: 'post',
      stage: 'post',
      label: 'Post',
      what: 'Cut, then sound, then color. Longer than the shoot and quieter, and where a picture is actually decided.',
      per: 2.4,
      spends: 0.3,
      advances: { picture: 'graded', sound: 'mixed', performance: 'complete', conform: 'mastered' },
      unit: { one: 'week of post', many: 'weeks of post', aWeek: 1 },
    },
  ],
};

/**
 * A returning television series, shot on stages.
 *
 * The difference from a feature is not size, it is overlap. Post on episode
 * one runs while episode four is shooting, so post barely extends past wrap
 * even though the total post work is larger. Prep is longer because a series
 * builds standing sets it will live on for months.
 */
const SERIES: Plan = {
  id: 'series',
  label: 'A Series, Shot On Stages',
  what: 'Long prep for standing sets, a long shoot, and a post that runs alongside it and finishes soon after wrap.',
  media: ['television'],
  deliveryWeeks: 4,
  anchor: 'start',
  ladders: 'picture',
  periods: [
    {
      id: 'prep',
      stage: 'prep',
      label: 'Prep',
      what: 'Standing sets go up on a stage the show will hold for the whole run.',
      per: 0.5,
      holds: 'prep',
      spends: 0.14,
      advances: { rights: 'optioned' },
      unit: { one: 'week of prep', many: 'weeks of prep', aWeek: 1 },
    },
    {
      id: 'shooting',
      stage: 'shooting',
      label: 'The Block Shoot',
      what: 'Episodes shoot in blocks, and post on the early ones runs while the later ones are still on the floor.',
      per: 1,
      holds: 'shooting',
      spends: 0.58,
      advances: { picture: 'shot', performance: 'captured' },
      unit: { one: 'shooting day', many: 'shooting days', aWeek: 5 },
    },
    {
      id: 'post',
      stage: 'post',
      label: 'Finishing',
      what: 'What is left after wrap, which is less than a feature because most of it was already done.',
      per: 0.8,
      spends: 0.28,
      advances: { picture: 'graded', sound: 'mixed', performance: 'complete', conform: 'mastered' },
      unit: { one: 'week of finishing', many: 'weeks of finishing', aWeek: 1 },
    },
  ],
};

/**
 * A format-led unscripted season, delivered against a fixed transmission date.
 *
 * Here because the research said to build it, and said why: it breaks every
 * assumption a live-action-shaped engine bakes in, all at once. There is no
 * script, so no page count or stripboard can be hardcoded anywhere. There are
 * no takes, so coverage cannot be assumed. There is no boundary between
 * production and post, so a scheduler cannot be written as prep-shoot-post.
 * Build the feature first and every one of those gets quietly satisfied by a
 * live-action-shaped special case, and the spine is not discovered to be fake
 * until the fourth kind, with nine kinds of content sitting on top of it.
 *
 * Four things about this plan are true of nothing else in the file, and each
 * one was a place the engine had to stop being a picture engine:
 *
 * Casting sits where writing would. Choosing twelve people is choosing every
 * story the season can contain, it happens before anything is shot, and it
 * cannot be undone.
 *
 * Post begins on field day one, not after wrap. The field and the cut are one
 * calendar, not two — which is what `runsWith` exists for.
 *
 * The airdate is agreed against a format document before anybody knows what
 * the content is, so the work is fitted backward into the room in front of it
 * rather than delivering whenever it happens to finish.
 *
 * And compliance runs alongside the cut rather than after it, because consent,
 * welfare and fairness are what actually gate lock here. An act can be
 * finished, funny and perfectly cut at week nineteen and be destroyed by a
 * withdrawn consent.
 *
 * The proportions are SLATE's own, fitted to the bands in the research: six to
 * sixteen weeks of casting overlapping six to twelve weeks of rig, three to ten
 * weeks of continuous field, and post running from day one to eight or twenty
 * weeks past wrap. The money shape is its own too, and its shape is the point:
 * above the line barely exists, because there is no script cost and the
 * contributors are on stipends rather than salaries.
 */
const UNSCRIPTED: Plan = {
  id: 'unscripted',
  label: 'A Format Season, Against An Airdate',
  what: 'A cast board, a built arena, a continuous shoot, and a cut that starts the same day the cameras do.',
  media: ['television'],
  deliveryWeeks: 2,
  anchor: 'delivery',
  ladders: 'season',
  periods: [
    {
      id: 'casting',
      stage: 'prep',
      label: 'The Cast Board',
      what: 'Choosing twelve people. That’s the same act as choosing every story the season can contain, and it can’t be undone later.',
      per: 1.5,
      spends: 0.12,
      advances: { rights: 'optioned' },
      unit: { one: 'contributor seen', many: 'contributors seen', aWeek: 40 },
    },
    {
      id: 'rig',
      stage: 'prep',
      label: 'The Build And The Rig',
      what: 'The arena goes up and the fixed rig goes in. Runs alongside casting, because neither waits for the other.',
      per: 1,
      runsWith: 'casting',
      holds: 'prep',
      spends: 0.18,
      unit: { one: 'week of build', many: 'weeks of build', aWeek: 1 },
    },
    {
      id: 'field',
      stage: 'shooting',
      label: 'The Field',
      what: 'Continuous recording. Progress is beats banked against the story areas set that morning, never pages.',
      per: 1,
      holds: 'shooting',
      spends: 0.42,
      advances: { picture: 'stringout', performance: 'captured' },
      unit: { one: 'contributor-day', many: 'contributor-days', aWeek: 7 },
    },
    {
      id: 'post',
      stage: 'post',
      label: 'The Cut',
      what: 'Stringouts, paper cuts, assemblies. It starts on field day one and is still running months after everybody goes home.',
      per: 3,
      runsWith: 'field',
      spends: 0.24,
      advances: { picture: 'locked', sound: 'mixed', performance: 'complete', conform: 'mastered' },
      unit: { one: 'cut minute', many: 'cut minutes', aWeek: 15 },
    },
    {
      id: 'compliance',
      stage: 'post',
      label: 'Consent And Compliance',
      what: 'Clearing what was recorded, which gates lock. A finished act can be destroyed at week nineteen by a withdrawn consent.',
      per: 2.5,
      runsWith: 'post',
      spends: 0.04,
      advances: { rights: 'cleared', compliance: 'passed' },
      unit: { one: 'clearance', many: 'clearances', aWeek: 6 },
    },
  ],
};

export const PLANS: readonly Plan[] = [FEATURE, SERIES, UNSCRIPTED];

export const planById = (id: string): Plan | undefined => PLANS.find((p) => p.id === id);

/** Which ways of making something are open to a given medium. */
export const plansFor = (medium: 'film' | 'television'): Plan[] =>
  PLANS.filter((p) => p.media.includes(medium));

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export type DeliveredBy = 'production' | 'business';

export interface Element {
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** What it is, for anybody who has not filed one. */
  what: string;
  /**
   * Who hands it over. Production elements come out of the work and arrive
   * when the work does. Business elements are paperwork, and paperwork is a
   * thing a person has to remember.
   */
  by: DeliveredBy;
  /** The period it cannot exist before. */
  after: string;
  /** Whether the money is withheld until it is in. */
  holdsPayment: boolean;
  /**
   * What handing it over moves, and to which rung.
   *
   * On a picture there is no compliance period and no rights period — the
   * legal work *is* this list. Filing the chain of title is what clears the
   * rights; the errors and omissions certificate is what gets it through
   * review. On a season those are a real period running alongside the cut
   * instead, which is why the join lives on both and neither is redundant.
   */
  moves?: { dimension: DimensionId; to: string };
}

/**
 * The delivery list, which is the real one.
 *
 * A distributor does not pay for a film. It pays for a list of physical and
 * legal items, and it pays when the list is complete. Everything below is
 * something that is actually on such a list and actually gets withheld over.
 *
 * The interesting half is `by: 'business'`. Those four are not made by anybody
 * on the crew and cannot be finished by shooting better. They are filed, by
 * whoever is running the company, and a picture can sit finished and unpaid
 * for months because one of them was nobody's job.
 */
export const DELIVERY: readonly Element[] = [
  {
    id: 'picture',
    label: 'The Finished Picture',
    what: 'The graded master, at the agreed running time, in the format the contract names.',
    by: 'production',
    after: 'post',
    holdsPayment: true,
  },
  {
    id: 'me',
    label: 'The M&E Track',
    what: 'Music and effects with the dialogue stripped out, fully filled, so the picture can be dubbed into another language. A thin one gets rejected and costs a re-record.',
    by: 'production',
    after: 'post',
    holdsPayment: true,
  },
  {
    id: 'textless',
    label: 'Textless Backgrounds',
    what: 'Every shot that carries a title or a credit, again without it, so other territories can lay their own over the top.',
    by: 'production',
    after: 'post',
    holdsPayment: true,
  },
  {
    id: 'stems',
    label: 'The Stems',
    what: 'Dialogue, music and effects as separate tracks, so a mix can be rebuilt without going back to the sessions.',
    by: 'production',
    after: 'post',
    holdsPayment: true,
  },
  {
    id: 'captions',
    label: 'Captions And Subtitles',
    what: 'Timed text, checked against the locked picture. Cheap to make and impossible to make before the picture stops changing.',
    by: 'production',
    after: 'post',
    holdsPayment: true,
    moves: { dimension: 'conform', to: 'accepted' },
  },
  {
    id: 'stills',
    label: 'Stills And Key Art',
    what: 'What the picture is sold with. Shot during the shoot by a unit photographer, because there’s no shooting it afterward.',
    by: 'production',
    after: 'shooting',
    holdsPayment: false,
  },
  {
    id: 'chain',
    label: 'Chain Of Title',
    what: 'The unbroken paper trail proving the company owns what it is selling, from the underlying rights forward. A gap in it stops a sale dead.',
    by: 'business',
    after: 'prep',
    holdsPayment: true,
    moves: { dimension: 'rights', to: 'cleared' },
  },
  {
    id: 'eo',
    label: 'Errors And Omissions Cover',
    what: 'The insurance that answers for a claim over what is in the picture. No distributor releases anything without a certificate.',
    by: 'business',
    after: 'prep',
    holdsPayment: true,
    moves: { dimension: 'compliance', to: 'reviewed' },
  },
  {
    id: 'cues',
    label: 'The Music Cue Sheet',
    what: 'Every piece of music, timed to the frame, with who wrote it and who publishes it. It’s how composers get paid, and it’s forgotten constantly.',
    by: 'business',
    after: 'post',
    holdsPayment: true,
  },
  {
    id: 'credits',
    label: 'The Credit Obligations List',
    what: 'Every credit anybody is contractually owed, in the size and order they’re owed it. Getting one wrong is a breach with a number attached.',
    by: 'business',
    after: 'post',
    holdsPayment: true,
    moves: { dimension: 'compliance', to: 'passed' },
  },
];

export const elementById = (id: string): Element | undefined => DELIVERY.find((e) => e.id === id);

/** What production hands over on its own, once a given period is behind it. */
export const elementsAfter = (periodId: string, by: DeliveredBy): Element[] =>
  DELIVERY.filter((e) => e.after === periodId && e.by === by);

/** The ones the money waits on. */
export const HOLDS_PAYMENT = DELIVERY.filter((e) => e.holdsPayment).map((e) => e.id);

// ---------------------------------------------------------------------------
// Slipping
// ---------------------------------------------------------------------------

/**
 * How long a picture of a given size actually shoots.
 *
 * Not a straight line, because it is not one in life. A five million euro
 * feature shoots under four weeks; a twenty million one shoots six; a hundred
 * and fifty million one shoots fourteen. Spend per week climbs steeply with
 * scale — a tentpole burns four times what a mid-budget picture burns a day —
 * so days bought per euro fall away. The curve below is fitted to those three
 * anchors and is SLATE's own.
 *
 * What it is for: setting a schedule is a decision, and a decision needs a
 * number to be measured against. This is the number.
 */
export const impliedShootWeeks = (budgetCents: number): number => {
  const millions = Math.max(0.25, budgetCents / 100 / 1_000_000);
  return 1.9 * millions ** 0.4;
};

/**
 * How a schedule stands against what the money says it should be.
 *
 * 1 when the two agree, below 1 when weeks were cut to make a number work,
 * above 1 when a picture has been given room. A crew knows this figure on day
 * one, without being told it, and so should the player.
 */
export const tightnessOf = (weeks: number, budgetCents: number): number =>
  weeks / impliedShootWeeks(budgetCents);

/** How hard a squeezed schedule pushes back, in days per shooting week. SLATE's own. */
export const SLIP_RATE = 0.9;

/** What an overrun day costs, against an ordinary day of the shoot. SLATE's own. */
export const SLIP_COSTS = 1.35;

/** What missing the delivery date costs a week, as a share of the budget. SLATE's own. */
export const LATE_PENALTY_A_WEEK = 0.004;
