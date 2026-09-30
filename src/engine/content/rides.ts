/**
 * SLATE — what a bicycle, an e-bike and an ATV ask and do (docs/WORLD.md,
 * stage 3i), from 2026-09-30, from `docs/research/world/research-vehicle-kinds.json`,
 * `research-vehicle-insurance.json` and `research-kind-effects.json`.
 */

/**
 * An ATV's registration where it's asked, in the place's money, units: New
 * York's $12.50 a year and $12.50 for the plate; Connecticut's $30, $5 for
 * the plate and $10 Clean Air Act fee, read as a year's (its term wasn't
 * confirmed); California's $54 green sticker every two years; Ontario's $38
 * off-road permit and plate, and British Columbia's $48, once. An ATV kept off
 * the road in Britain needs none; Ireland's and Mexico City's weren't found.
 */
export const ATV_FEES = {
  'US-NY': { first: 12.5 + 12.5, renew: 12.5, years: 1, label: 'Registration And Plate' },
  'US-CT': { first: 30 + 5 + 10, renew: 30 + 10, years: 1, label: 'Registration, Plate And Clean Air Act Fee' },
  'US-CA': { first: 54, renew: 54, years: 2, label: 'Green Sticker, Two Years' },
  'CA-ON': { first: 38, label: 'Off-Road Vehicle Permit And Plate' },
  'CA-BC': { first: 48, label: 'Off-Road Vehicle Registration' },
} as const;

/**
 * A year's ATV insurance where a figure is published: ValuePenguin's average
 * for one rider in Wisconsin, $88 for liability and $327 full, taken for the
 * American states. No figure was found elsewhere, and none is charged there.
 */
export const ATV_INSURANCE = { full: 327, liability: 88, currency: 'USD', basis: 'ValuePenguin’s average for an ATV, one Wisconsin rider’s' } as const;

/**
 * A ride on one's own bicycle or e-bike:
 * - Its effort: the 2024 Adult Compendium of Physical Activities, bicycling,
 *   general, 7.0 METs (01014); an e-bike with light assistance, 6.0 (01084).
 * - Its risk: DfT's reported pedal cyclist casualties, 4,367 per billion
 *   miles ridden (RAS0201, 2025), over an hour at the Compendium's leisure
 *   pace of 10 mph; an e-bike's the Oslo study's 5.14 against a bicycle's 7.26
 *   (Fyhri et al., Findings, April 2026). A crash's injuries.
 * - What it builds: a run's, the same hour of work outdoors: SLATE's estimate.
 */
export const CYCLING = {
  met: { bicycle: 7.0, ebike: 6.0 },
  casualtiesPerMile: 4_367 / 1e9,
  mph: 10,
  ebikeRisk: 5.14 / 7.26,
  source: '2024 Adult Compendium of Physical Activities; DfT RAS0201; Fyhri et al. 2026',
} as const;

/**
 * An afternoon on one's own ATV, on acreage one owns: the Compendium's 4.0
 * METs for riding one (15470). The CPSC counts about 100,400 emergency-room
 * injuries from off-highway vehicles in 2023, but no rate an hour or a rider,
 * so none is drawn; its fuel isn't published either, and isn't charged.
 */
export const ATV_OUTING = { met: 4.0, hours: 2 } as const;
