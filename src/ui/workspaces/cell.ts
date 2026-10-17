/**
 * SLATE — what fits in one day of the month grid, what it says, and which of
 * its half hours the plan form offers.
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

import { formatDate, startOfDay, startOfNextDay, zonedParts, MS_MINUTE } from '@/engine/core/time';
import { holidayLabel } from '@/engine/content/holidays';
import type { CalendarDay, CalendarEntry } from '@/engine/world/calendar';
import { said, toStart } from '@/ui/looks/words';

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
  // A count under ten is a word, as in the rest of the game's prose; until 2026-10-17 two or more were figures
  // ("2 things on it.") beside "One thing on it." (brief 14).
  const booked = standing.length === 0 ? '' : `${toStart(said(standing.length, 'thing'))} on it.`;
  return [
    formatDate(day.date, zone),
    kept.length > 0 ? `${kept.join('. ')}.` : '',
    booked || (kept.length > 0 ? '' : 'No plans on it.'),
  ].filter(Boolean).join(' ');
}

/*
 * The plan form's clock. A slot is minutes from the start of the day, and the
 * day runs until the next date begins: twenty-three hours on the day the
 * clocks go forward and twenty-five on the day they go back. The form used to
 * count twenty-four from the start whatever the day, and to open at nine hours
 * in. On a 23-hour day that opened it at ten, offered 12:00 AM and 12:30 AM of
 * the next date under this one, and kept the day open until one the next
 * morning. On a 25-hour day it closed the day to plans at eleven that night
 * and ran out an hour early: where the clocks repeat an hour in the small
 * hours it opened at eight and left out 11:00 PM and 11:30 PM, and where they
 * repeat eleven at night (Beirut, Santiago, Cairo) it left out the second run
 * of 11:00 PM and 11:30 PM. The repeated hour's two runs read the same on the
 * clock, and the form offers both.
 */

/** Whether a day is still ahead enough to put something on. */
export function canPlan(day: CalendarDay, now: number, zone: string): boolean {
  return startOfNextDay(day.date, zone) > now;
}

/** Every half hour of a day that has not already gone by. */
export function openSlots(day: CalendarDay, now: number, zone: string): number[] {
  const start = startOfDay(day.date, zone);
  const end = startOfNextDay(start, zone);
  const out: number[] = [];
  for (let minute = 0; start + minute * MS_MINUTE < end; minute += 30) {
    if (start + minute * MS_MINUTE >= now) out.push(minute);
  }
  return out;
}

/** Where the picker opens: nine in the morning by the clock, or the next half hour still ahead. */
export function firstFreeSlot(day: CalendarDay, now: number, zone: string): number {
  const start = startOfDay(day.date, zone);
  const slots = openSlots(day, now, zone);
  const nine = slots.find((m) => zonedParts(start + m * MS_MINUTE, zone).hour >= 9);
  return nine ?? slots[0] ?? 0;
}
