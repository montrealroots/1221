/**
 * SLATE — who else is opening that week, and what it costs to be there.
 *
 * The release date was the emptiest decision in the first pass. A player picked a
 * month, the month moved the take through a seasonal table, and that was all of it —
 * so the best month was simply the best month and there was nothing to weigh.
 *
 * A date is only a decision when something else is standing on some of them. This is
 * the thing standing there. It answers one question — how much of a week is already
 * spoken for — and it answers it about the player's own slate as well as the other
 * studios, which is what turns it from an obstacle into a mistake a producer can
 * make. A studio that stacks three of its own releases in December is competing with
 * itself, and nothing else in the build would ever have said so.
 *
 * ## Knowable on purpose
 *
 * What the rivals do is drawn from the save's own seed and the date, so the field is
 * the same every time it is asked and can be read ahead. That is deliberate. A
 * schedule nobody could look at would make choosing a date a coin toss; one that can
 * be looked at is a judgement about whether a good month crowded beats a poor month
 * empty. The seasonal table and this file pull against each other on exactly that
 * question and neither is allowed to settle it alone.
 *
 * ## Why the rival slate is drawn rather than stored
 *
 * A stored table has to be migrated, has to be extended when a save outlives it, and
 * is a second place the truth lives. A function of the seed and the week has none of
 * those problems and cannot drift.
 *
 * It is named for what it answers rather than for what it contains, because
 * `world/calendar.ts` is already the player's own diary and two calendars in one
 * engine is how a reader ends up in the wrong file.
 */

import type { Simulation } from '../core/simulation';
import type { Channel } from '../content/format';
import { formatById } from '../content/format';
import { A_WEEK_HOLDS, STUDIOS, WHEN_THEY_OPEN, studiosOn, type Studio } from '../content/rivals';
import { projectsOf } from './company';
import { MS_WEEK } from './lot';

/** A thing opening in a given week. */
export interface Opening {
  /** Who is releasing it. */
  who: string;
  /** What it is called, where anybody knows. */
  what: string;
  /** How much of the week's attention it takes. */
  pull: number;
  /** Whether it is the player's own. */
  ours: boolean;
}

/** Weeks since the epoch, which is the key everything here is drawn against. */
export const weekIndex = (at: number): number => Math.floor(at / MS_WEEK);

/**
 * Whether one studio opens something in one week, and how big.
 *
 * Drawn per studio per week rather than per year, so a slate never has to be held
 * anywhere. The chance is the studio's annual rate spread across the year and pulled
 * towards the months it favors, which is what gives the field its shape: the months
 * an audience is most available are also the months it is worst to open in.
 */
export function whatTheyOpen(sim: Simulation, studio: Studio, at: number): Opening | undefined {
  const week = weekIndex(at);
  const month = new Date(at).getUTCMonth();
  const leaning = WHEN_THEY_OPEN[studio.id]?.[month] ?? 1;
  const chance = Math.min(0.85, (studio.aYear / 52) * leaning);
  const rng = sim.rng('rivals', studio.id, week);
  if (rng.next() >= chance) return undefined;
  // Around its usual size rather than exactly it, so the field is not a pattern to
  // memorize. Half again either way is enough to matter and not enough to surprise.
  return { who: studio.name, what: 'Something', pull: studio.pull * (0.6 + rng.next() * 0.8), ours: false };
}

/** Everything opening in the week containing this instant, on this channel. */
export function openingThatWeek(sim: Simulation, at: number, channel: Channel): readonly Opening[] {
  const week = weekIndex(at);
  const found: Opening[] = [];
  for (const studio of studiosOn(channel)) {
    const one = whatTheyOpen(sim, studio, at);
    if (one) found.push(one);
  }
  // And our own, which is the half that makes this a mistake rather than an obstacle.
  for (const project of projectsOf(sim.universe)) {
    const opening = project.opening;
    if (!opening || opening.channel !== channel) continue;
    if (weekIndex(opening.at) !== week) continue;
    const format = formatById(project.formatId);
    found.push({
      who: 'Us',
      what: project.title,
      // Read off the format rather than drawn, because we know what it is. A feature
      // crowds a week and a micro-series crowds nothing.
      pull: format ? Math.min(1, 0.25 + format.carriesForward * 0.6) : 0.3,
      ours: true,
    });
  }
  return found;
}

/**
 * How much of a week is already spoken for, 0 to 1.
 *
 * Totalled against what a week holds and clamped, because a week with four enormous
 * releases is not four times as crowded as one with a single enormous release — past
 * a point everybody simply does badly and the number stops carrying information.
 *
 * `excluding` lets a picture ask about its own week without counting itself, which is
 * what every caller wants and what the first version forgot, producing a release that
 * crowded itself out.
 */
export function crowding(sim: Simulation, at: number, channel: Channel, excluding?: string): number {
  const taken = openingThatWeek(sim, at, channel)
    .filter((one) => !(one.ours && excluding !== undefined && one.what === excluding))
    .reduce((sum, one) => sum + one.pull, 0);
  return Math.max(0, Math.min(1, taken / A_WEEK_HOLDS));
}

/**
 * The weeks ahead, so a date can be chosen by looking rather than by guessing.
 *
 * The screen this feeds is the reason the mechanic is worth having: a player who
 * cannot see the field is not choosing a date, they are picking a month and hoping.
 */
export function theWeeksAhead(
  sim: Simulation,
  from: number,
  channel: Channel,
  weeks = 26,
): readonly { at: number; crowding: number; against: readonly Opening[] }[] {
  const ahead: { at: number; crowding: number; against: readonly Opening[] }[] = [];
  for (let i = 0; i < weeks; i += 1) {
    const at = from + i * MS_WEEK;
    ahead.push({ at, crowding: crowding(sim, at, channel), against: openingThatWeek(sim, at, channel) });
  }
  return ahead;
}

/**
 * The emptiest week in a stretch, which is what a producer with no other constraint
 * would take.
 *
 * Offered rather than applied. A screen that silently moved a release to the quietest
 * week would be taking the decision the player came to take — and the quietest week is
 * usually in a month nobody goes out, which is the trade this whole file exists to put
 * in front of a player.
 */
export function quietestWeek(sim: Simulation, from: number, channel: Channel, weeks = 26): number {
  const ahead = theWeeksAhead(sim, from, channel, weeks);
  return ahead.reduce((best, one) => (one.crowding < best.crowding ? one : best), ahead[0]!).at;
}

/** Every studio, with what it is known for, for a screen. */
export const theOtherStudios = (): readonly Studio[] => STUDIOS;
