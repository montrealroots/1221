/**
 * SLATE — a hotel's late check-out where the hotel publishes its price
 * (Stage 6 of `docs/BACKLOG.md`, from 2026-10-02), from
 * `docs/research/world/research-gaps-hotels-health.json`, read 2026-10-02.
 *
 * Of SLATE's 28 named hotels, five publish what a later check-out costs, and
 * those five sell one:
 * - **Hotel Catedral**, Mexico City: until 19:00 for a flat MX$553 (its
 *   policies file, updated 25 September 2026).
 * - **Freehand Los Angeles**: until 15:00 for half the night's rate (its FAQ).
 * - **The Beverly Hills Hotel**: until 16:00 for half the best available
 *   day's rate (a search's summary of its FAQ).
 * - **Omni New Haven Hotel at Yale**: "starting at $50" (a search's summary
 *   of its policies), from an 11:00 check-out. No time is given, and SLATE
 *   takes two hours, the most Wyndham's members are given free, its reading.
 * - **The Hoxton, Holborn**: £10 an hour until 16:00 at the desk, and free
 *   under Flexy Time when booked direct at least 72 hours ahead. SLATE's
 *   named-hotel rates are each hotel's own, so a stay booked that far ahead
 *   gets it free.
 *
 * Every one is "subject to availability", and no source publishes how often a
 * hotel grants one: no survey (J.D. Power, STR, Oracle Hospitality) counts
 * it. SLATE grants a priced late check-out when it is asked for, its reading.
 * Arriving early is guaranteed only by booking the night before, as the Four
 * Seasons and the Beverly Hills Hotel say, and SLATE's stays already book by
 * the night.
 */

export type LateFee =
  | { kind: 'flat'; amount: number; currency: string }
  | { kind: 'night-share'; share: number }
  | { kind: 'hourly'; amount: number; currency: string };

export interface LateTerms { until: number; fee: LateFee; freeBookedAhead?: number }

export const LATE_CHECKOUT: Readonly<Record<string, LateTerms>> = {
  'hotel-catedral-cdmx': { until: 19, fee: { kind: 'flat', amount: 553, currency: 'MXN' } },
  'freehand-los-angeles': { until: 15, fee: { kind: 'night-share', share: 0.5 } },
  'beverly-hills-hotel': { until: 16, fee: { kind: 'night-share', share: 0.5 } },
  'omni-new-haven-at-yale': { until: 13, fee: { kind: 'flat', amount: 50, currency: 'USD' } },
  'hoxton-holborn': { until: 16, fee: { kind: 'hourly', amount: 10, currency: 'GBP' }, freeBookedAhead: 72 },
};
