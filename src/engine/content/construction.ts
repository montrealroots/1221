/**
 * SLATE — building a house on a lot one owns (docs/WORLD.md, stage 5), from
 * 2026-09-29, researched in docs/research/world/research-construction.json.
 *
 * WHAT'S BUILT. The sizes the authorities publish. In America, the Census
 * Bureau's median floor area of the new houses an owner built and of those a
 * contractor built on the owner's land, completed in 2025, and the latter's
 * average, for the Northeast (New York, New Haven) and the West (Los
 * Angeles). In London, the nationally described space standard's two-story
 * houses, which the London Plan applies. The bedrooms and bathrooms of the
 * American sizes are SLATE's, the Census publishing none by size, and so are
 * the London houses' bathrooms.
 *
 * WHAT IT COSTS. The Census's 2025 median contract price a square foot for a
 * house a contractor builds on the owner's land, by region, the contract
 * price leaving out the lot; the Census publishes no state or city figure, so
 * the region's stands in for the town, said so. London has no published
 * figure: SLATE takes the compilers' £2,200 a square meter for a self-build
 * in England, read from BCIS's subscription data, and 20% more, the low end
 * of the London premium they quote.
 *
 * HOW IT'S PAID. Stage by stage, as NAHB's 2024 survey of what building a
 * house costs breaks it down, with the permit, impact and water fees taken
 * out of site work, since SLATE charges each place's own. Each stage is
 * billed as it's finished.
 *
 * HOW LONG. America: from the permit to completion, NAHB's 2025 reading of
 * the Census by division (Middle Atlantic 12.6 months, New England 13.5,
 * Pacific 10.3), the permit's wait the Census's latest by region (2022:
 * 2.2 months in the Northeast, 1.3 in the West) and the building the rest.
 * London: nine months on site, SLATE's middle of the six to twelve the
 * compilers quote, no statistic being published.
 */

export type BuildPlace = 'nyc' | 'new-haven' | 'los-angeles' | 'london';

export const SQFT_PER_M2 = 10.7639104;

export interface Design { id: string; sqft: number; beds: number; baths: number; basis: string }

const ne = 'the Census’s Northeast';
const west = 'the Census’s West';
const nds = (m2: number, beds: number, people: number, baths: number): Design => ({ id: `nds-${beds}b${people}p`, sqft: Math.round(m2 * SQFT_PER_M2), beds, baths, basis: `the nationally described space standard’s ${beds}-bedroom, ${people}-person two-story house, ${m2} m²` });

export const DESIGNS: Readonly<Record<'northeast' | 'west' | 'london', readonly Design[]>> = {
  northeast: [
    { id: 'ne-owner', sqft: 1_721, beds: 3, baths: 2, basis: `${ne} median owner-built house completed in 2025` },
    { id: 'ne-median', sqft: 2_495, beds: 4, baths: 2.5, basis: `${ne} median house a contractor built on the owner’s land, completed in 2025` },
    { id: 'ne-average', sqft: 2_867, beds: 4, baths: 3, basis: `${ne} average house a contractor built on the owner’s land, completed in 2025` },
  ],
  west: [
    { id: 'w-owner', sqft: 1_686, beds: 3, baths: 2, basis: `${west} median owner-built house completed in 2025` },
    { id: 'w-median', sqft: 2_354, beds: 4, baths: 2.5, basis: `${west} median house a contractor built on the owner’s land, completed in 2025` },
    { id: 'w-average', sqft: 2_751, beds: 4, baths: 3, basis: `${west} average house a contractor built on the owner’s land, completed in 2025` },
  ],
  london: [nds(79, 2, 4, 1), nds(93, 3, 5, 1), nds(106, 4, 6, 2)],
};

export interface BuildRules {
  designs: readonly Design[];
  currency: string;
  /** The price of building, whole units a square foot or a square meter. */
  rate: number;
  unit: 'sqft' | 'm2';
  rateBasis: string;
  /** The most floor a lot takes: of its area, or its coverage and stories. */
  bulk?: { floorArea: number; basis: string } | { coverage: number; stories: number; basis: string };
  /** Months waiting for the permit, then building. */
  permitMonths: number;
  buildMonths: number;
  timeBasis: string;
  /** The certificate a house is lived in on. */
  occupancy: string;
}

export const BUILD_RULES: Readonly<Record<BuildPlace, BuildRules>> = {
  nyc: {
    designs: DESIGNS.northeast, currency: 'USD', rate: 179.3, unit: 'sqft', rateBasis: `${ne} median contract price a square foot, 2025`,
    bulk: { floorArea: 0.75, basis: 'R2’s floor area ratio, 0.75 of the lot' },
    permitMonths: 2.2, buildMonths: 12.6 - 2.2, timeBasis: 'the Middle Atlantic’s 12.6 months from permit to completion (NAHB, 2025), 2.2 of them waiting to start (Census, Northeast, 2022)',
    occupancy: 'Certificate Of Occupancy',
  },
  'new-haven': {
    designs: DESIGNS.northeast, currency: 'USD', rate: 179.3, unit: 'sqft', rateBasis: `${ne} median contract price a square foot, 2025`,
    bulk: { coverage: 0.3, stories: 2, basis: 'RS-2’s 30% building coverage, read secondhand, on two stories as most new houses are built' },
    permitMonths: 2.2, buildMonths: 13.5 - 2.2, timeBasis: 'New England’s 13.5 months from permit to completion (NAHB, 2025), 2.2 of them waiting to start (Census, Northeast, 2022)',
    occupancy: 'Certificate Of Occupancy',
  },
  'los-angeles': {
    designs: DESIGNS.west, currency: 'USD', rate: 176.87, unit: 'sqft', rateBasis: `${west} median contract price a square foot, 2025`,
    bulk: { floorArea: 0.45, basis: 'the Baseline Mansionization Ordinance’s residential floor area, 45% of a flat R1 lot' },
    permitMonths: 1.3, buildMonths: 10.3 - 1.3, timeBasis: 'the Pacific’s 10.3 months from permit to completion (NAHB, 2025), 1.3 of them waiting to start (Census, West, 2022)',
    occupancy: 'Certificate Of Occupancy',
  },
  london: {
    designs: DESIGNS.london, currency: 'GBP', rate: 2_640, unit: 'm2', rateBasis: 'SLATE’s estimate: the compilers’ £2,200 a square meter for a self-build in England, and 20% more for London',
    permitMonths: 0, buildMonths: 9, timeBasis: 'SLATE’s nine months on site, the middle of the six to twelve compilers quote; the plot comes with its permission, and the building notice is two days',
    occupancy: 'Completion Certificate',
  },
};

/**
 * NAHB's 2024 stages of building a house, in dollars of its average, with
 * site work's permit ($7,640), impact ($6,367) and water and sewer ($6,260)
 * fees taken out, and its "other" folded into the final steps.
 */
export const STAGES: readonly { name: string; usd: number }[] = [
  { name: 'Site Work', usd: 32_719 - 7_640 - 6_367 - 6_260 },
  { name: 'Foundations', usd: 44_748 },
  { name: 'Framing', usd: 70_982 },
  { name: 'Exterior Finishes', usd: 57_510 },
  { name: 'Systems Rough-In', usd: 82_319 },
  { name: 'Interior Finishes', usd: 103_391 },
  { name: 'Final Steps', usd: 27_710 + 8_835 },
];

/** The inspections each place names at a stage's end, by the stage's index. */
export const INSPECTIONS: Readonly<Record<BuildPlace, Readonly<Record<number, string>>>> = {
  nyc: { 1: 'Footing And Foundation Inspection', 2: 'Framing Inspection', 4: 'Plumbing Progress And Insulation Inspections', 6: 'Final Inspection' },
  'los-angeles': { 1: 'Foundation Inspection', 2: 'Framing Inspection', 4: 'Rough Electrical, Plumbing, Mechanical And Insulation Inspections', 6: 'Final Inspection' },
  'new-haven': { 6: 'The Building Official’s Final Inspection' },
  london: { 6: 'Completion Notice To Building Control' },
};

/**
 * London's Community Infrastructure Levy a square meter of new floor, 2026:
 * each borough's and the Mayor's. Croydon's £209.61 and the Mayor's £30.30;
 * Havering's north of the A1306, £151.52 (SLATE's reading of where a plot
 * is), and the Mayor's £30.30; Hackney's zone A at its 2015 base, £190, its
 * indexed rate not found, and the Mayor's band 2, £72.73. Someone building a
 * home to live in claims the self-build exemption, and owes it if the home is
 * sold or let within three years of completion.
 */
export const LONDON_CIL: Readonly<Record<string, { borough: number; mayor: number }>> = {
  Hackney: { borough: 190, mayor: 72.73 },
  Croydon: { borough: 209.61, mayor: 30.3 },
  Havering: { borough: 151.52, mayor: 30.3 },
};
export const CIL_CLAWBACK_YEARS = 3;

/**
 * Los Angeles's permit, on its valuation: the LADBS table's $101 a square
 * foot for an average wood-frame dwelling (2015), the fee from LAMC Table
 * 1-A by that valuation, plan check at 90% of it, the state's strong-motion
 * fee ($13 a $100,000) and building standards fee ($4 a $100,000), the
 * Certificate Of Occupancy's $150, the Affordable Housing Linkage Fee at the
 * medium market's $10.38 a square foot (2020's schedule; SLATE's reading of
 * where a lot is), and the school developer fee at the state's 2026 cap,
 * $5.38, read secondhand.
 */
export const LA_FEES = {
  valuationPerSqft: 101,
  table1A: [[2_000, 65, 0], [20_000, 40, 0.0125], [50_000, 170, 0.006], [100_000, 195, 0.0055], [500_000, 395, 0.0035], [1_000_000, 520, 0.00325]] as readonly (readonly [number, number, number])[],
  planCheck: 0.9,
  smip: 0.00013,
  bsa: 0.00004,
  occupancy: 150,
  linkagePerSqft: 10.38,
  schoolPerSqft: 5.38,
} as const;

/** New York City's new building permit for a one- to three-family house: $0.06 a square foot, $100 at least (Admin Code Table 28-112.2). */
export const NYC_FEES = { perSqft: 0.06, least: 100 } as const;

/**
 * New Haven's building permit, $25 for the first $1,000 of the work's value
 * and $15 for each $1,000 more, with a $10 processing fee, and the state's
 * education fee, $0.26 a $1,000: both read secondhand, the city's site
 * refusing to be read.
 */
export const NEW_HAVEN_FEES = { first: 25, perThousand: 15, processing: 10, education: 0.26 } as const;

/** London's building control charge for a new house: Hackney's £1,018.50 and VAT, read secondhand and taken for all three boroughs. */
export const LONDON_BUILDING_CONTROL = { fee: 1_018.5, vat: 0.2 } as const;

export const BUILD_SOURCE = 'docs/research/world/research-construction.json: Census Survey of Construction 2025; NAHB Construction Cost Survey 2024 and its 2025 build times; NYC Admin Code 28-112.2; LAMC 91.107 and LADBS; California SMIP and Health and Safety Code 18931.6; New Haven and CGS 29-252a; the nationally described space standard; Planning Portal; Hackney, Croydon, Havering and the Mayor of London’s CIL schedules';
