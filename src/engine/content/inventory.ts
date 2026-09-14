/**
 * SLATE — the other ledger, and the rate table that empties it.
 *
 * A production runs two ledgers and almost every game models one. The first is
 * the timeline: runtime claimed at some maturity, which is `Project.parts`.
 * The second is the inventory — everything acquired and not yet placed on that
 * timeline. Rushes, camera-hours, logged beats, drawn cuts in hand, rendered
 * versions, licensed archive, transcribed interviews. Every form has one.
 *
 * ## The shooting ratio is a result, not a setting
 *
 * Inventory divided by runtime *is* the shooting ratio, so it stops being a
 * number somebody picks and becomes something the engine reports back. The
 * research gives the real spread and it is enormous: about 1:1 for CG and
 * stop-motion, where nothing is shot that is not used; around 50:1 for
 * Wiseman; 87:1 for Hoop Dreams; and on the order of 7,000:1 for a
 * ninety-source fixed rig cutting three forty-four-minute episodes a week —
 * ninety cameras times twenty-four hours times seven days is 15,120
 * camera-hours against two and a bit hours of transmitted show.
 *
 * Same ledger, same arithmetic, four wildly different numbers. None of them is
 * written down anywhere in the engine.
 *
 * ## Money buys capacity, capacity buys progress, money never buys progress
 *
 * The other half is the rate table, and it is the reason a documentary is made
 * in the edit with no documentary-specific code anywhere. Where inventory
 * dwarfs the timeline, the bottleneck stops being acquisition and becomes
 * *conversion* — editor-weeks — and no amount of extra shooting helps. Every
 * published throughput figure in the business is a row in one table:
 *
 * - A feature animator finals four to five seconds a week.
 * - An Aardman animator gets about two seconds a day.
 * - A classic Disney feature animator with assistants, about 3.75 feet a day,
 *   which is roughly fourteen seconds a week.
 * - An unscripted editor turns out two to four finished minutes a day.
 * - A feature documentary runs about a month of cutting per ten finished
 *   minutes.
 *
 * Those are hours apart from each other and they all live in the same column.
 *
 * ## What is real here and what is ours
 *
 * Every rate above is published and is used as published. What a week of a
 * given period banks is SLATE's own, chosen so the ratio that falls out lands
 * inside the researched bands — which is the honest way round: pick the inputs
 * so the emergent number is right, rather than writing the emergent number down
 * and calling it a model.
 */

// ---------------------------------------------------------------------------
// What gets acquired
// ---------------------------------------------------------------------------

export type StockId = 'rushes' | 'beats' | 'shots' | 'archive';

export interface Stock {
  id: StockId;
  /** Title Case, for a screen. */
  label: string;
  /** What it is, and why it is not finished work. */
  what: string;
  /** What one of it is called, for counting. */
  unit: { one: string; many: string };
}

/**
 * The kinds of material a production banks.
 *
 * Deliberately few. These are not departments or file types, they are the
 * distinct things that sit between having spent money and having screen time:
 * footage nobody has watched, moments somebody logged, shots that exist at
 * some stage, and material bought in from outside.
 */
export const STOCKS: readonly Stock[] = [
  {
    id: 'rushes',
    label: 'Rushes',
    what: 'Recorded and unwatched. It cost what it cost whether or not a second of it is ever used.',
    unit: { one: 'hour', many: 'hours' },
  },
  {
    id: 'beats',
    label: 'Logged Beats',
    what: 'Moments a story producer has found and marked in the rushes. The raw material of a story, and the thing they are actually paid for.',
    unit: { one: 'beat', many: 'beats' },
  },
  {
    id: 'shots',
    label: 'Shots In Hand',
    what: 'Authored work at some stage short of final. It is the animation equivalent of rushes and behaves the same way.',
    unit: { one: 'shot', many: 'shots' },
  },
  {
    id: 'archive',
    label: 'Licensed Archive',
    what: 'Bought in from outside, priced by the second, and payable again every time it is used.',
    unit: { one: 'second', many: 'seconds' },
  },
];

export const stockById = (id: string): Stock | undefined => STOCKS.find((s) => s.id === id);

// ---------------------------------------------------------------------------
// The rate table
// ---------------------------------------------------------------------------

export interface Rate {
  id: string;
  /** Who is doing it. */
  who: string;
  /** Finished seconds of screen time one of them produces in a week. */
  secondsAWeek: number;
  /** Where the figure comes from. */
  source: string;
}

/**
 * What a person converts in a week, in finished seconds of screen time.
 *
 * All published, and the spread is the point: the slowest row here is two
 * hundred and forty times slower than the fastest, and both are somebody
 * working flat out at a craft they are good at. An engine with one throughput
 * number can model exactly one of these.
 */
export const RATES: readonly Rate[] = [
  {
    id: 'unscripted-editor',
    who: 'An unscripted editor',
    // Two to four finished minutes a day, taken at three, five days a week.
    secondsAWeek: 3 * 60 * 5,
    source: 'Working practice, as reported in the trade',
  },
  {
    id: 'doc-editor',
    who: 'A documentary editor',
    // About a month of cutting per ten finished minutes.
    secondsAWeek: Math.round((10 * 60) / 4.33),
    source: 'Working practice for feature documentary',
  },
  {
    id: 'television-editor',
    who: 'A television drama editor',
    // A fifty-minute episode in about four and a half weeks, which is what the
    // DGA's four-day director's cut and an editor per episode add up to.
    secondsAWeek: 660,
    source: 'Television practice: one editor per episode, cutting as blocks arrive',
  },
  {
    id: 'picture-editor',
    who: 'A picture editor on a feature',
    // SLATE's own, sized between the two above: a feature cuts faster than a
    // documentary because the material is scripted and shot to a plan.
    secondsAWeek: 60 * 8,
    source: 'SLATE’s own, between the documentary and unscripted rows',
  },
  {
    id: 'feature-animator',
    who: 'A feature animator',
    secondsAWeek: 4,
    source: 'Long-standing industry figure, four to five seconds a week',
  },
  {
    id: 'stop-motion-animator',
    who: 'A stop-motion animator',
    // About two seconds a day at Aardman, five days a week.
    secondsAWeek: 2 * 5,
    source: 'Aardman, as reported',
  },
];

export const rateById = (id: string): Rate | undefined => RATES.find((r) => r.id === id);

/** What a whole department turns out in a week, given how many hands it has. */
export const throughput = (rateId: string, hands: number): number =>
  (rateById(rateId)?.secondsAWeek ?? 0) * Math.max(0, hands);

// ---------------------------------------------------------------------------
// The bands the ratio is supposed to land in
// ---------------------------------------------------------------------------

export interface Band {
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** Material to finished runtime. */
  ratio: number;
  source: string;
}

/**
 * Real shooting ratios, kept so the engine's own output can be checked.
 *
 * Nothing reads these to decide anything. They exist so a test can take the
 * ratio the engine produces and say whether it is a number anybody in the
 * business would recognize, which is the only way an emergent figure can be
 * held honest.
 */
export const KNOWN_RATIOS: readonly Band[] = [
  { id: 'cg', label: 'Computer Animation', ratio: 1, source: 'Nothing is rendered that is not used' },
  { id: 'drama', label: 'A Scripted Drama Series', ratio: 10, source: 'Shot to a plan, faster than a feature, with less coverage per page' },
  { id: 'feature', label: 'A Scripted Feature', ratio: 15, source: 'Ordinary digital-era coverage' },
  { id: 'wiseman', label: 'Observational Documentary', ratio: 50, source: 'Frederick Wiseman' },
  { id: 'hoop', label: 'A Long-Form Documentary', ratio: 87, source: 'Hoop Dreams' },
  { id: 'rig', label: 'A Fixed-Rig Season', ratio: 7_000, source: '90 sources, 24 hours, against three 44-minute episodes a week' },
];
