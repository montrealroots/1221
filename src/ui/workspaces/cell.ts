/**
 * SLATE — what fits in one day of the month grid, and what it says.
 *
 * A cell is small and a day can carry more than it holds. Deciding what to
 * print is a rule, not markup, so it lives here where it can be argued with
 * and tested rather than inside a `.slice(0, 1)` nobody reads twice.
 *
 * The rule that matters: more than one holiday can land on one day — one the
 * country keeps and one its region keeps on top, or two of the country's own —
 * and printing one and hiding the other is the calendar deciding for you which
 * of them you care about. Both show.
 */

import { formatDate } from '@/engine/core/time';
import { holidayLabel } from '@/engine/content/holidays';
import type { CalendarDay, CalendarEntry } from '@/engine/world/calendar';

/** Chips a cell holds before it has to start hiding things. */
export const CHIPS = 3;

/**
 * Whether an entry is still on the calendar at all.
 *
 * Canceled is the one status that means it is not: you called it off, and a
 * day you called something off on should look as free as a day you never put
 * anything on. Missed and completed both happened — one of them badly — and a
 * calendar that hid them would be lying about your week.
 *
 * The day panel is the exception and shows everything, chip and all, because
 * that is where somebody went looking rather than glanced.
 */
export const stillStands = (entry: CalendarEntry): boolean => entry.status !== 'cancelled';

/** The entries a glance surface draws: what still stands, in order. */
export const standingIn = (day: CalendarDay): CalendarEntry[] => day.entries.filter(stillStands);

/**
 * How many of the day's holidays are printed.
 *
 * Never all three chips: a day that is a holiday is usually also a day, and
 * squeezing the player's own commitments out of their own calendar to make
 * room for somebody else's public holiday is the wrong way round.
 */
export const holidayChips = (day: CalendarDay): number => Math.min(day.holidays.length, CHIPS - 1);

/** What is left for the day's own commitments. */
export const roomFor = (day: CalendarDay): number => CHIPS - holidayChips(day);

/** Everything the cell could not fit, holidays and commitments together. */
export const hiddenIn = (day: CalendarDay): number =>
  (day.holidays.length - holidayChips(day)) + Math.max(0, standingIn(day).length - roomFor(day));

/**
 * What a screen reader hears for one cell.
 *
 * A label overrides the button's own text, so whatever it leaves out is not
 * read at all: the old one said "March 17, 2026, 0 entries" over a cell whose
 * only content was the words St. Patrick's Day. Everything the cell prints is
 * said here.
 */
export function dayLabel(day: CalendarDay, zone: string): string {
  const kept = day.holidays.map(holidayLabel);
  const standing = standingIn(day);
  const booked = standing.length === 0
    ? ''
    : standing.length === 1
      ? 'One thing on it.'
      : `${standing.length} things on it.`;
  return [
    formatDate(day.date, zone),
    kept.length > 0 ? `${kept.join('. ')}.` : '',
    booked || (kept.length > 0 ? '' : 'Nothing on it.'),
  ].filter(Boolean).join(' ');
}
