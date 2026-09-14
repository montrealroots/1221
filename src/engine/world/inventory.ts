/**
 * SLATE — what has been acquired, what it can be turned into, and how late.
 *
 * `content/inventory.ts` says what the stocks and the rates are. This runs the
 * second ledger against the first: material banked on one side, runtime
 * claimed on the other, and a conversion rate between them that decides
 * whether the thing makes its date.
 *
 * ## The ratio is reported, never chosen
 *
 * `ratioOf` divides what was banked by what is owed. Nothing sets it. A season
 * on a fixed rig lands in the thousands because a rig banks thousands of hours;
 * an animated picture lands near one because nothing is rendered that is not
 * used. The same two lines of arithmetic produce both, and the test that holds
 * them checks the answers against real published ratios rather than against
 * anything in the engine.
 *
 * ## Money buys capacity, capacity buys progress
 *
 * The other half, and the reason a documentary is made in the edit with no
 * documentary-specific code anywhere. Where inventory dwarfs the timeline the
 * bottleneck stops being acquisition and becomes conversion, and no amount of
 * further shooting helps. `weeksToConvert` says how long the cut needs;
 * `willMakeIt` says whether the calendar has that long. When it does not, that
 * is the make-air scramble, and it arrives as a consequence of the numbers
 * rather than as an event somebody scripted.
 */

import type { Simulation } from '../core/simulation';
import type { Project } from '../domain/company';
import type { StockId } from '../content/inventory';
import { STOCKS, throughput } from '../content/inventory';
import type { Period, Plan } from '../content/making';
import { MS_WEEK } from './lot';
import { finishesBy, planOf, windowOf } from './making';
import { owedSeconds, partsOf } from './maturity';

// ---------------------------------------------------------------------------
// The ledger
// ---------------------------------------------------------------------------

/** What has been banked of one stock. */
export const bankedOf = (project: Project, stock: StockId): number =>
  project.banked?.[stock] ?? 0;

/** Puts material into the ledger. */
export function bank(project: Project, stock: StockId, howMuch: number): number {
  if (howMuch <= 0) return bankedOf(project, stock);
  const now = bankedOf(project, stock) + howMuch;
  project.banked = { ...(project.banked ?? {}), [stock]: now };
  return now;
}

/** Everything banked, as seconds of material, for the ratio. */
export function materialSeconds(project: Project): number {
  // Rushes and archive are already time. Beats and shots are counted things,
  // so they carry a nominal length — a logged beat is about a minute of usable
  // material, an authored shot about four seconds.
  return bankedOf(project, 'rushes') * 3_600
    + bankedOf(project, 'archive')
    + bankedOf(project, 'beats') * 60
    + bankedOf(project, 'shots') * 4;
}

/**
 * Material against finished runtime: the shooting ratio.
 *
 * Reported rather than set. Undefined before anything is owed, because a ratio
 * against nothing is not a large number, it is not a number.
 */
export function ratioOf(project: Project): number | undefined {
  const owed = owedSeconds(project);
  if (owed <= 0) return undefined;
  const material = materialSeconds(project);
  return material <= 0 ? undefined : material / owed;
}

/** The ratio said the way the business says it. */
export const saidAsRatio = (ratio: number): string =>
  `${ratio >= 100 ? Math.round(ratio / 10) * 10 : Math.round(ratio)}:1`;

// ---------------------------------------------------------------------------
// Converting it
// ---------------------------------------------------------------------------

/** The period on a plan that converts material into runtime, if any. */
export const cuttingPeriod = (plan: Plan): Period | undefined =>
  plan.periods.find((one) => one.converts !== undefined);

/**
 * Finished seconds the cut still has to produce.
 *
 * Measured against what the room has actually turned out rather than against
 * the rungs the parts sit on, because those are two different facts and only
 * one of them is the cutting room's. A part climbs to the rung the cut takes
 * it to when the room's output covers its runtime, so this is the quantity
 * that drives the climb and the quantity the forecast is made from — one
 * number, read twice, rather than two that drift apart.
 */
export function leftToCut(project: Project): number {
  const plan = planOf(project);
  if (!plan || !cuttingPeriod(plan)) return 0;
  // What was never cut, plus what has to be cut again. The second term is what
  // makes a note show up in the forecast the week it arrives rather than as a
  // surprise at the end, and it is the reason `weighTheCut` can say a season
  // has stopped making its date without anybody watching for it.
  const again = partsOf(project).reduce((n, part) => n + (part.recut ?? 0), 0);
  return Math.max(0, owedSeconds(project) - (project.cut ?? 0)) + again;
}

/** How many hands the cutting room has: the decision, or the plan's default. */
export function handsOn(project: Project): number {
  const plan = planOf(project);
  const converts = plan ? cuttingPeriod(plan)?.converts : undefined;
  return project.hands ?? converts?.hands ?? 0;
}

/**
 * Finished seconds the cutting room turns out in a week.
 *
 * Capacity times rate, and the capacity half is a decision rather than a
 * property of the plan. Doubling the editors halves the weeks; halving them
 * is how a season that was going to make its airdate stops making it.
 */
export function cutsAWeek(project: Project): number {
  const plan = planOf(project);
  const converts = plan ? cuttingPeriod(plan)?.converts : undefined;
  return converts ? throughput(converts.at, handsOn(project)) : 0;
}

/**
 * Weeks the cut needs for what is left, at the rate it actually runs at.
 *
 * Remaining work over capacity times rate, which is the research's own
 * forecasting rule. Undefined where nothing converts, because a plan with no
 * cutting room has no cutting bottleneck rather than an infinite one.
 */
export function weeksToConvert(project: Project): number | undefined {
  const rate = cutsAWeek(project);
  if (rate <= 0) return undefined;
  return leftToCut(project) / rate;
}

export interface Forecast {
  /** Weeks of cutting the work still needs. */
  needs: number;
  /** Weeks of calendar it has before the date. */
  has: number;
  /** Short by this many weeks. Zero or less means it makes it. */
  shortBy: number;
  /** Whether it makes the date. */
  makesIt: boolean;
}

/**
 * Whether the cut can be finished in the time the calendar leaves for it.
 *
 * The honest version of "are we going to make it", and the one that produces a
 * scramble without anybody scripting a scramble. A season whose airdate was
 * agreed before anybody knew what the content is does not get to move the
 * date, so a cutting room that is three weeks short is a real emergency with a
 * real cause: too much material, too few hands, or not enough calendar.
 */
export function willMakeIt(project: Project, now: number): Forecast | undefined {
  const needs = weeksToConvert(project);
  if (needs === undefined) return undefined;
  const plan = planOf(project);
  const period = plan ? cuttingPeriod(plan) : undefined;
  const window = period ? windowOf(project, period.id) : undefined;
  const until = window?.to ?? finishesBy(project);
  if (until === undefined) return undefined;
  const has = Math.max(0, (until - now) / MS_WEEK);
  const shortBy = needs - has;
  return { needs, has, shortBy, makesIt: shortBy <= 0 };
}

// ---------------------------------------------------------------------------
// Banking it
// ---------------------------------------------------------------------------

/**
 * Banks a week of whatever a period acquires, or the share of one that passed.
 *
 * Called once per week of an acquiring period rather than in a lump at the
 * end, because the whole point of the ledger is that material piles up while
 * the cut is still behind it. A lump at the end would make the ratio right and
 * the pressure invisible.
 *
 * The share is there because the last week of anything is rarely a whole one,
 * and a stub week that banks seven days of material is the sort of small lie
 * that shows up later as a ratio nobody can account for.
 */
export function bankAWeek(project: Project, period: Period, share = 1): void {
  const acquires = period.acquires;
  if (!acquires) return;
  bank(project, acquires.stock, acquires.aWeek * share);
}

/**
 * Looks at the forecast and says so when the answer changes.
 *
 * Called on every week of banking rather than at a period boundary, because on
 * a plan whose cut runs with its shoot there are no useful boundaries left —
 * the field, the cut and the compliance all began on the same morning, before
 * a single hour had been banked. The week the material overtakes the room is
 * the only moment the news is worth anything.
 *
 * It speaks on the change and not on the state, so a season told it would miss
 * air is told again when the extra editors get it back. That is the loop that
 * makes staffing a decision rather than a number on a form.
 */
export function weighTheCut(sim: Simulation, project: Project): void {
  const forecast = willMakeIt(project, sim.now);
  const ratio = ratioOf(project);
  if (!forecast || ratio === undefined) return;
  const short = !forecast.makesIt;
  if (short === (project.shortOfTheDate ?? false)) return;
  project.shortOfTheDate = short;
  const hands = handsOn(project);
  const room = `${hands} ${hands === 1 ? 'cutting room' : 'cutting rooms'}`;
  sim.notify({
    category: 'business',
    title: short
      ? `${project.title} Has More Than It Can Cut`
      : `${project.title} Is Back Inside Its Date`,
    body: short
      ? `${saidAsRatio(ratio)} of material against what it owes, and ${room} to get through it. `
        + `The cut needs ${Math.ceil(forecast.needs)} more weeks and the calendar leaves `
        + `${Math.floor(forecast.has)}, so it is ${Math.ceil(forecast.shortBy)} short.`
      : `${room} on it, and the cut is inside the date again with `
        + `${Math.floor(-forecast.shortBy)} weeks in hand.`,
    importance: short ? 70 : 45,
    refType: 'project',
    refId: project.id,
  });
}

/** What the ledger says, in a sentence. */
export function whereTheMaterialStands(project: Project, now: number): string {
  const ratio = ratioOf(project);
  if (ratio === undefined) return 'Not a frame of it has been shot yet.';
  const banked = STOCKS
    .filter((stock) => bankedOf(project, stock.id) > 0)
    .map((stock) => {
      const n = Math.round(bankedOf(project, stock.id));
      return `${n.toLocaleString('en-US')} ${n === 1 ? stock.unit.one : stock.unit.many} of ${stock.label.toLowerCase()}`;
    });
  const said = `${banked.join(', ')}. That is ${saidAsRatio(ratio)} against what it owes.`;
  const forecast = willMakeIt(project, now);
  if (!forecast || forecast.makesIt) return said;
  return `${said} The cut needs ${Math.ceil(forecast.needs)} weeks and has `
    + `${Math.floor(forecast.has)}, so it is ${Math.ceil(forecast.shortBy)} short of the date.`;
}

/** The stock a plan banks, for anything that needs to name it. */
export const stockOf = (plan: Plan): StockId | undefined =>
  plan.periods.find((one) => one.acquires)?.acquires?.stock;

/** Everything banked, for a screen that wants the whole ledger. */
export function ledgerOf(project: Project): { stock: StockId; label: string; amount: number }[] {
  return STOCKS
    .map((stock) => ({ stock: stock.id, label: stock.label, amount: bankedOf(project, stock.id) }))
    .filter((row) => row.amount > 0);
}
