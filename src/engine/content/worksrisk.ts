/**
 * SLATE — what home works do that the estimate doesn't say (Stage 12 of
 * `docs/BACKLOG.md`, from 2026-10-02), from
 * `docs/research/world/research-gaps-construction.json`, read 2026-10-02.
 *
 * **Bids.** Washington Consumers' Checkbook's undercover shoppers asked for
 * identical jobs and were quoted $190,000 to $321,000 for an addition (the
 * high 69% over the low) and $8,500 to $13,250 for a small bathroom (56%), and
 * found price had no bearing on quality. SLATE takes the middle, 62.5%: bids
 * fall evenly within 23.8% either side of their middle. Most homeowners get
 * three or more (ArcSite's 2022 survey), and the cheapest is taken. The
 * guides' figures are what homeowners paid, after their bids, so the bids are
 * centered where their cheapest averages the guide's figure.
 *
 * **Over budget.** 43% of American homeowners who hired a professional went
 * over the estimate, and slightly more than a third of those by 30% or more
 * (Angi's 2026 State of Home Spending pulse, 1,000 homeowners). In the UK 55%
 * went over (Toolstation's 2022 poll); it gives the overrun in pounds, £3,024
 * on average, not as a share of a budget, so SLATE takes Angi's sizes there
 * too. No survey publishes the overrun as a share of budget, so within each
 * band the size is drawn evenly: up to 30%, or 30% to 60%, the top SLATE's
 * estimate. Ireland takes the UK's share, Canada and Mexico America's.
 *
 * **Late.** In the UK almost a quarter of projects ran late, by three months
 * on average (Toolstation 2022). In America 48% "took longer than expected"
 * (Clever's 2026 poll), with no length published. Three months over a
 * kitchen's 4.5 months of building (Houzz's 2020 study) is two thirds of the
 * work's time, and a late job runs over by that share on average, drawn as a
 * delay's long tail is (exponentially), SLATE's derivation.
 */

export const BIDS = { count: 3, spread: 0.625 } as const;
/** How far either side of their middle bids fall, from the high-over-low spread. */
export const BID_HALF = BIDS.spread / (2 + BIDS.spread);

export interface WorksOdds { over: number; tail: number; late: number }
const AMERICA: WorksOdds = { over: 0.43, tail: 0.34, late: 0.48 };
const BRITAIN: WorksOdds = { over: 0.55, tail: 0.34, late: 0.24 };
export const WORKS_ODDS: Readonly<Record<string, WorksOdds>> = { us: AMERICA, ca: AMERICA, mx: AMERICA, uk: BRITAIN, ie: BRITAIN };

/** An overrun's bands: up to 30%, or 30% to 60% (the top SLATE's estimate). */
export const OVERRUN_BANDS = { under: 0.3, top: 0.6 } as const;
/** A late job's mean overrun of time, as a share of its days: three months over a kitchen's 4.5. */
export const LATE_SHARE = 3 / 4.5;
