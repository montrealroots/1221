/**
 * SLATE — shorthand for writing event date rules.
 *
 * `nearest(3, 12, SUN)` reads "the Sunday nearest March 12"; `nth(10, THU, 2)`
 * "the second Thursday of October"; `laborDay(-3)` "three days before US
 * Labor Day". The data files read better for it.
 */

import type { DateRule, Weekday } from './events';

export const SUN: Weekday = 0;
export const MON: Weekday = 1;
export const TUE: Weekday = 2;
export const WED: Weekday = 3;
export const THU: Weekday = 4;
export const FRI: Weekday = 5;
export const SAT: Weekday = 6;

export const fixed = (month: number, day: number): DateRule => ({ kind: 'fixed', month, day });
export const nth = (month: number, weekday: Weekday, n: number): DateRule => ({ kind: 'nth', month, weekday, nth: n });
export const nearest = (month: number, day: number, weekday: Weekday): DateRule => ({ kind: 'nearest', month, day, weekday });
export const laborDay = (offsetDays: number): DateRule => ({ kind: 'labor-day', offsetDays });
export const relative = (eventId: string, offsetDays: number): DateRule => ({ kind: 'relative', eventId, offsetDays });
export const parity = (even: DateRule, odd: DateRule): DateRule => ({ kind: 'parity', even, odd });

/** A source read on the day this data was compiled. */
export const WIKI = (page: string) => `Wikipedia: ${page} (read 2026-09-03)`;
export const SEARCH = (what: string) => `Web search: ${what} (read 2026-09-03)`;
export const EDITORIAL = 'SLATE editorial: from general knowledge of the event; the date is a projection from its usual pattern, not a verified announcement';
