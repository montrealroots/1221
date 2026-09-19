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
import type { Cadence } from './concept';
import type { StockId } from './inventory';

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
   * Everything on a real schedule is quoted against the one period the producer
   * actually chooses the length of, and so is everything here. Deliberately not
   * called "shooting weeks" any more: a season that never shoots a scripted
   * page still has a base period, and naming this after the live-action case is
   * how an engine ends up unable to express anything else.
   *
   * This used to say that exactly one period in a plan carries `per: 1` and
   * that it is the base. Both halves were wrong. The unscripted season carries
   * two — the rig is as long as the field, which is a true thing about an
   * unscripted season — so `per` was never an identifier, and everything that
   * went looking for the base by it found the rig. `Plan.basePeriod` names it
   * instead, because a plan should say which period that is and not leave it to
   * be inferred from a number that means something else.
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
   * What a week of this period banks into the inventory ledger.
   *
   * Material acquired and not yet placed on the timeline. A week of it costs
   * what it costs whether or not a second of it is ever used, which is what
   * makes the ratio between this and the finished runtime worth reporting.
   */
  acquires?: { stock: StockId; aWeek: number };
  /**
   * That this period is the cutting room, and how fast it runs.
   *
   * `at` names a row in the rate table and `hands` says how many of them there
   * are, so the throughput is capacity times rate rather than a number. `upTo`
   * is the rung a converted second has reached. Where inventory dwarfs the
   * timeline this is the bottleneck, and no amount of further acquiring helps.
   */
  converts?: {
    at: string;
    hands: number;
    upTo: string;
    /**
     * How much of this period's spend is the rooms themselves.
     *
     * The rest of it is everything else the period buys, which does not care
     * how many people are cutting: sound, music, color, the conform, the
     * deliverables. Without this the staffing decision was free — `spends` is a
     * flat share of the budget and knew nothing about how many rooms were
     * running, so six editors cost exactly what one did. More hands was faster,
     * safer and cost nothing, which made the maximum correct on every picture
     * in every state and the decision a number nobody had a reason to lower.
     *
     * A third, which is where editorial sits on a post budget with no heavy
     * visual effects on it — the cutting rooms, the assistants, the kit and the
     * space — and the two thirds left are the finishing that happens whatever
     * the room did. SLATE's own, and the figure the whole decision turns on, so
     * it is declared here rather than folded into `spends` where nobody could
     * see it.
     */
    ofTheSpend: number;
  };
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
   * The id of the period the producer chooses the length of.
   *
   * The shoot on a feature, the field on an unscripted season. It is the one
   * number a greenlight asks for, every other period is quoted against it, and
   * it is the first day a camera runs — which makes it the date the crew's
   * offsets count back from, the date the casting office works to, and the date
   * the reimbursement's application closes on.
   *
   * Named here rather than found by searching the periods for one called
   * 'shooting'. A season's base period is the field, and every reader that went
   * looking for a literal either hard-coded two names or found nothing: the
   * crew hired nobody onto an unscripted season for as long as this was
   * inferred, because the lookup came back empty and the whole department
   * walked past it.
   */
  basePeriod: string;
  /**
   * Weeks between the end of the work and the contractual delivery date. The
   * window exists so that finishing is not the same as delivering, because it
   * is not.
   */
  deliveryWeeks: number;
  /** Which ladder set its maturity is measured against. */
  ladders: string;
  /**
   * What shape of commitment this is, which is what an engine is checked against.
   *
   * `single` is one complete thing, `closed` is a run that ends, `returning` is
   * something that keeps coming back. A story engine declares which of these it can
   * sustain, so a transformation — which finishes — cannot be made as a returning
   * series, and the greenlight says so rather than making it badly.
   */
  cadence: Cadence;
  /**
   * What a finished one of these actually is: how many parts, and how long.
   *
   * The runtime is a default, not a rule — a producer sets what a picture runs
   * to, and an hour and nineteen minutes is a perfectly ordinary answer. The
   * part count is the plan's, because eight episodes is what the format is.
   */
  delivers: { parts: number; secondsEach: number };
  /**
   * Whether the parts finish together or in order.
   *
   * A feature has one part, so the question does not arise. A season shot in
   * blocks finishes episode one long before episode eight, and a period that
   * advances `inOrder` staggers its parts across its own span rather than
   * moving all of them at the end. That stagger is the difference between
   * eight timelines and one timeline drawn eight times.
   */
  partsFinish: 'together' | 'inOrder';
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
  /**
   * Who stands in front of the camera, where anybody does.
   *
   * `performers` is people cast in written parts. It was deliberately not a
   * boolean, because the other answer is not "nobody" — a format season puts
   * twelve contributors on a cast board and choosing them is the same act as
   * choosing every story the season can contain. Those are engaged, held and
   * paid on entirely different terms, and a flag reading true for both would
   * be the shortest possible way to say something false.
   *
   * `contributors` is that second answer, and the union existing for exactly
   * this is why it could be added without taking the warning back. The format
   * season carries it now. What follows from it is deliberately not the
   * performer path: `castsPerformers` is still only `'performers'`, so no role
   * is laid, no audition is armed, and the player is never offered a slot on a
   * cast board — being a contributor on a format is a job and it is not this
   * job. What contributors do reach is the three sale terms that are about
   * people rather than about parts, and `world/casting.ts` says which and why.
   */
  cast?: 'performers' | 'contributors';
  /**
   * The shooting ratio this plan's cutting rate is quoted at, by band id.
   *
   * Every published throughput figure in the business assumes the ordinary
   * amount of material for the form it was measured on. A room turning out
   * eight finished minutes a week on a feature is doing it at fifteen to one,
   * and the same room at thirty to one is not turning out eight minutes — it is
   * watching twice as much to find them. Naming the band here is what lets the
   * rate stop being a constant, and it is what makes a cast that needs more
   * takes cost the calendar rather than only the stock.
   */
  ratio?: string;
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
  basePeriod: 'shooting',
  cast: 'performers',
  ratio: 'feature',
  label: 'A Feature, Shot On Stages',
  what: 'Prep, a shoot, and a long post. The ordinary shape of a picture made indoors.',
  media: ['film'],
  deliveryWeeks: 6,
  anchor: 'start',
  ladders: 'picture',
  cadence: 'single',
  delivers: { parts: 1, secondsEach: 6_000 },
  partsFinish: 'together',
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
      acquires: { stock: 'rushes', aWeek: 4.2 },
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
      converts: { at: 'picture-editor', hands: 2, upTo: 'cut', ofTheSpend: 1 / 3 },
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
 *
 * That overlap is why a series runs four cutting rooms where a feature runs
 * one deeper: the DGA gives a feature director ten weeks for their cut and a
 * television director four days, so television cuts in parallel or it does not
 * make its transmission dates at all.
 */
const SERIES: Plan = {
  id: 'series',
  basePeriod: 'shooting',
  cast: 'performers',
  ratio: 'drama',
  label: 'A Series, Shot On Stages',
  what: 'Long prep for standing sets, a long shoot, and a post that runs alongside it and finishes soon after wrap.',
  media: ['television'],
  deliveryWeeks: 4,
  anchor: 'start',
  ladders: 'picture',
  // Returning: a series shot on stages is the thing a company keeps making, so it
  // needs an engine that does not run out.
  cadence: 'returning',
  delivers: { parts: 8, secondsEach: 3_000 },
  partsFinish: 'inOrder',
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
      acquires: { stock: 'rushes', aWeek: 11 },
      unit: { one: 'shooting day', many: 'shooting days', aWeek: 5 },
    },
    {
      id: 'post',
      stage: 'post',
      label: 'Finishing',
      what: 'Cutting rooms running one per episode, from the first block. Most of it is behind the show by wrap, and what is left is the finish.',
      per: 1.6,
      runsWith: 'shooting',
      spends: 0.28,
      advances: { picture: 'graded', sound: 'mixed', performance: 'complete', conform: 'mastered' },
      converts: { at: 'television-editor', hands: 4, upTo: 'cut', ofTheSpend: 1 / 3 },
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
  basePeriod: 'field',
  ratio: 'rig',
  cast: 'contributors',
  label: 'A Format Season, Against An Airdate',
  what: 'A cast board, a built arena, a continuous shoot, and a cut that starts the same day the cameras do.',
  media: ['television'],
  deliveryWeeks: 2,
  anchor: 'delivery',
  ladders: 'season',
  // Closed rather than returning: this plan is one season against one airdate. A
  // format that comes back every year would be a second plan, not this one with a
  // different word on it.
  cadence: 'closed',
  delivers: { parts: 8, secondsEach: 3_600 },
  partsFinish: 'inOrder',
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
      acquires: { stock: 'rushes', aWeek: 2_500 },
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
      // Nearly half, and higher than the scripted forms on purpose: an
      // unscripted season is made in the edit rather than shot to a script, so
      // the rooms are most of what its post buys and the finishing around them
      // is comparatively little.
      converts: { at: 'unscripted-editor', hands: 3, upTo: 'assembly', ofTheSpend: 0.45 },
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
export const slackOf = (weeks: number, budgetCents: number): number =>
  weeks / impliedShootWeeks(budgetCents);

/** How hard a squeezed schedule pushes back, in days per shooting week. SLATE's own. */
export const SLIP_RATE = 0.9;

/**
 * How much of an overrun a cast is responsible for, end to end.
 *
 * A cast nobody can rely on stretches whatever the schedule was going to do
 * anyway by about half again; one that turns up every morning takes about a
 * third of it back. Never the whole of it, in either direction — a schedule cut
 * below what the picture costs runs over with saints in it, and a picture with
 * room in it loses a day to the weather whoever is in it.
 *
 * SLATE's own, and set below what the schedule itself is worth on purpose: the
 * producer's decision about weeks is meant to matter more than their decision
 * about people, because it does.
 */
export const TRUST_COSTS = 0.85;

/** What an overrun day costs, against an ordinary day of the shoot. SLATE's own. */
export const SLIP_COSTS = 1.35;

/** What missing the delivery date costs a week, as a share of the budget. SLATE's own. */
export const LATE_PENALTY_A_WEEK = 0.004;

/**
 * The producer's fee, as a share of what the picture is greenlit at.
 *
 * This exists because of a measurement, and the measurement is the most damning
 * one in the audit trail. Over twenty-five played years a company that greenlights
 * thirty-six pictures and delivers thirty-three ends holding EUR 238,755,876 —
 * and the player who ran every one of them ends with **EUR 700**, which is the
 * balance they opened the save with. They own nought percent of the company,
 * because the parents built it and the parents hold it, and across a quarter of a
 * century exactly EUR 1,540 reached their own accounts.
 *
 * `docs/UNBITTEN.md` had this the other way round. It said the company must stop
 * out-earning the career and that the slate returning 1.44 to 1.63 times its
 * negative was the engine of a hundred-to-one — a decision about the game, left
 * for the owner. It is not a calibration problem and moving the multiple would
 * not have touched it: the company was not out-earning the career, it was earning
 * money the career could never reach. There was no mechanism at all. No dividend,
 * no ownership, no fee. A producer fee is the one every picture actually carries.
 *
 * Three percent, which is inside the ordinary range a producer's fee is quoted at
 * and deliberately at the bottom of it. What that buys is the figure that makes
 * this a balance rather than a lever: on a twenty-million-euro feature it is
 * EUR 600,000, against a lead acting fee on the same picture of about
 * EUR 878,000. So producing pays about what a good part pays, which is the whole
 * answer to whether producing makes acting pointless — it does not, because the
 * slate's return stays with the family that financed it and what reaches the
 * person is a fee for the work.
 *
 * It is charged on top of the budget rather than out of it. Every period's spend
 * is a share of `budgetCents` and those shares come to one, so folding the fee in
 * would mean re-cutting all of them and moving every spend figure this build has
 * measured, to no benefit. A picture therefore costs the company three percent
 * more than the number it was greenlit at, which is also true of real pictures:
 * the budget a producer quotes and the check a financier writes have never been
 * the same number.
 */
export const PRODUCER_FEE = 0.03;

/**
 * How long a new pair of hands takes to actually start in the cutting room.
 *
 * `project.hands` had exactly one write site in the whole engine — inside
 * `greenlight` — and no command anywhere. The field's own docstring said the
 * opposite in three places: "the plan's figure is a default, not a rule", "the
 * number of editors is the decision that sits between a budget and a delivery
 * date", and "that is a decision that can change week to week". `aWeekOn` said
 * hands can be changed in any week. `ui/looks/business.tsx` told the player "put
 * one editor on this where the plan assumed two and it arrives half as fast".
 *
 * The lever worked and the door was missing. Measured on an unscripted season
 * twenty-one days into post, with the save written directly because there was no
 * path a player could walk: one editor cut 12,600 seconds and left 16,200 to go;
 * six cut 28,800 and cleared the backlog. `tests/inventory.test.ts` had to reach
 * around the command layer to exercise it, and a notification — "Back Inside Its
 * Date" — could only ever fire after a restaff nobody could perform.
 *
 * Two weeks, because a free instant restaff is a strictly dominant button and
 * every cutting room would end at six hands. The cost is the other half of that
 * and is priced off `aRoomCosts`, which the build already has; the lead time is
 * what stops a player watching the warning and fixing every picture the week it
 * appears. Under-staffing a season still costs it its date.
 */
export const A_NEW_HAND_STARTS_IN_WEEKS = 2;
