/**
 * SLATE — when the grocery chains' stores are open (Stage 7 of
 * `docs/BACKLOG.md`, from 2026-10-01), each the store in the town a buyer
 * shops at, from `docs/research/world/research-errands.json`: hours as
 * opening and closing, local, by day, 24 for open all night. England's
 * Sunday Trading Act lets a large store open six hours between 10:00 and
 * 18:00 on a Sunday, which Tesco's and Sainsbury's Sundays are.
 *
 * - Price Rite of Hamden: 08:00 to 21:00, Sundays to 20:00 (its store data).
 * - The Fresh Grocer of Fulton St: 07:00 to 22:00 (a listing).
 * - Smart & Final Extra!, Figueroa St: 06:00 to 22:00 (its store data).
 * - Tesco Kensington: all night, Sundays 11:00 to 17:00 (a listing).
 * - Sainsbury's Nine Elms: 07:00 to 23:00, Sundays 11:00 to 17:00 (its locator).
 * - SuperValu Aston Quay: 07:00 to 23:00, Sundays to 22:00 (its locator).
 * - Save-On-Foods Cambie: 07:00 to 22:00 (listings).
 * - Giant Tiger Kennedy Rd: 08:00 to 21:00, Sundays to 19:00 (its locator).
 * - Chedraui Eduardo Molina: 07:00 to 23:00 (listings).
 */

export interface Hours { open: number; close: number }
/** A week's hours; a Friday that keeps its own, as gyms' do, from 2026-10-01. */
export interface Week { weekdays: Hours; saturday: Hours; sunday: Hours; friday?: Hours }

const daily = (open: number, close: number): Week => ({ weekdays: { open, close }, saturday: { open, close }, sunday: { open, close } });
const sundays = (week: Hours, sunday: Hours): Week => ({ weekdays: week, saturday: week, sunday });

export const CHAIN_HOURS: Readonly<Record<string, Week>> = {
  pricerite: sundays({ open: 8, close: 21 }, { open: 8, close: 20 }),
  thefreshgrocer: daily(7, 22),
  smartfinal: daily(6, 22),
  'tesco-gb': sundays({ open: 0, close: 24 }, { open: 11, close: 17 }),
  sainsburys: sundays({ open: 7, close: 23 }, { open: 11, close: 17 }),
  'supervalu-ie': sundays({ open: 7, close: 23 }, { open: 7, close: 22 }),
  saveonfoods: daily(7, 22),
  gianttiger: sundays({ open: 8, close: 21 }, { open: 8, close: 19 }),
  chedraui: daily(7, 23),
};

/** The hours a day's week gives, by its weekday (0 Sunday, 6 Saturday). */
export const hoursOn = (week: Week, weekday: number): Hours => (weekday === 0 ? week.sunday : weekday === 6 ? week.saturday : weekday === 5 && week.friday ? week.friday : week.weekdays);
