/**
 * SLATE — what fits in one day of the month grid, and what it says.
 *
 * A cell is small and a day can carry more than it holds. Deciding what to
 * print is a rule, not markup, so it lives here where it can be argued with
 * and tested rather than inside a `.slice(0, 1)` nobody reads twice.
 *
 * The rule that matters: a life keeps two calendars, so two holidays land on
 * one day often enough — Whit Monday and Memorial Day are both 25 May 2026 —
 * and printing one and hiding the other is the calendar deciding for you
 * which country's year you care about. Both show.
 */

import { formatDate } from '@/engine/core/time';
import { holidayLabel } from '@/engine/content/holidays';
import type { CalendarDay } from '@/engine/world/calendar';

/** Chips a cell holds before it has to start hiding things. */
export const CHIPS = 3;

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
  (day.holidays.length - holidayChips(day)) + Math.max(0, day.entries.length - roomFor(day));

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
  const booked = day.entries.length === 0
    ? ''
    : day.entries.length === 1
      ? 'One thing on it.'
      : `${day.entries.length} things on it.`;
  return [
    formatDate(day.date, zone),
    kept.length > 0 ? `${kept.join('. ')}.` : '',
    booked || (kept.length > 0 ? '' : 'Nothing on it.'),
  ].filter(Boolean).join(' ');
}
