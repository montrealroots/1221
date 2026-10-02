/**
 * SLATE — how long a doctor's appointment is waited for, by place (the
 * master plan's §50.3–7, from 2026-10-02), from
 * `docs/research/world/research-appointments.json`, read 2026-10-02.
 *
 * - England: NHS England Digital's Appointments in General Practice, July
 *   2026, all staff, the share of appointments by time from booking: the same
 *   day 44.7%, the next 7.6%, two to seven days 17.3%, eight to fourteen
 *   12.4%, fifteen to twenty-one 7.4%, twenty-two to twenty-eight 5.1%, more
 *   than twenty-eight 5.4% (taken as thirty-five, no further split being
 *   published). Within a band, any day as likely as another.
 * - America: AMN Healthcare's 2025 survey, the average days to a new
 *   patient's family-medicine appointment: New York 4, Los Angeles 13, and
 *   its fifteen metros' 23.5 for a town it doesn't survey (New Haven).
 * - Canada: the share of adults seen the same day or the next, from CIHI's
 *   tables, 24.7% in Ontario and 21.8% in British Columbia (derived, as the
 *   research says, by a method that gives CIHI's own 26% nationally). For the
 *   rest no wait is published, and SLATE takes a week, its estimate.
 * - Mexico: IMSS's ENCAL 2025, 29 days on average from asking to being seen
 *   at a family-medicine unit, for those it covers, a Mexican citizen here;
 *   anyone else sees a private doctor, whose wait isn't published.
 * - Ireland publishes no GP wait, and a visit is had as before, unbooked.
 */

export const ENGLAND_BANDS: readonly { from: number; to: number; share: number }[] = [
  { from: 0, to: 0, share: 0.447 },
  { from: 1, to: 1, share: 0.076 },
  { from: 2, to: 7, share: 0.173 },
  { from: 8, to: 14, share: 0.124 },
  { from: 15, to: 21, share: 0.074 },
  { from: 22, to: 28, share: 0.051 },
  { from: 35, to: 35, share: 0.054 },
];
export const US_DAYS: Readonly<Record<string, number>> = { 'us-ny-newyork': 4, 'us-ca-losangeles': 13 };
export const US_METRO_AVERAGE_DAYS = 23.5;
export const CANADA_NEXT_DAY: Readonly<Record<string, number>> = { 'ca-08': 0.247, 'ca-02': 0.218 };
/** Canada's wait when it isn't the next day: none published; SLATE's estimate. */
export const CANADA_OTHERWISE_DAYS = 7;
export const IMSS_DAYS = 29;
/** A consultation's time on the calendar: SLATE's estimate, none of the research's sources publishing one. */
export const CONSULT_MINUTES = 20;
/** The hour a booked appointment is at, local: SLATE's. */
export const CONSULT_HOUR = 10;
