/**
 * SLATE — what buying, registering and insuring a car costs, by where one
 * lives (docs/WORLD.md, stage 3), from 2026-09-29. Researched from each
 * authority and kept, with every source, in
 * `docs/research/world/research-vehicles.json`. Amounts in the
 * jurisdiction's own money, whole units unless named cents.
 *
 * Eight jurisdictions: New York, Connecticut, California, Great Britain,
 * Ireland, Ontario, British Columbia and Mexico City. A car bought anywhere
 * else is refused, and says so.
 */

export type Jurisdiction = 'US-NY' | 'US-CT' | 'US-CA' | 'GB' | 'IE' | 'CA-ON' | 'CA-BC' | 'MX-CMX';

/** New York's two-year registration fee by weight in pounds (MV-202, 4/23): the heaviest band's upper pound, and the fee. */
export const NY_REGISTRATION_BY_WEIGHT: readonly (readonly [number, number])[] = [
  [1650, 26], [1750, 27.5], [1850, 29], [1950, 31], [2050, 32.5], [2150, 34], [2250, 35.5], [2350, 37.5], [2450, 39], [2550, 40.5],
  [2650, 42], [2750, 43.5], [2850, 45.5], [2950, 47], [3050, 48.5], [3150, 50], [3250, 52], [3350, 53.5], [3450, 55], [3550, 56.5],
  [3650, 59], [3750, 61.5], [3850, 64], [3950, 66.5], [4050, 69], [4150, 71], [4250, 73.5], [4350, 76], [4450, 78.5], [4550, 81],
  [4650, 83.5], [4750, 85.5], [4850, 88], [4950, 90.5], [5050, 93], [5150, 95.5], [5250, 98], [5350, 100.5], [5450, 102.5], [5550, 105],
  [5650, 107.5], [5750, 110], [5850, 112.5], [5950, 115], [6050, 117], [6150, 119.5], [6250, 122], [6350, 124.5], [6450, 127], [6550, 129.5],
  [6650, 131.5], [6750, 134], [6850, 136.5], [6950, 139], [Infinity, 140],
];

export const NY = {
  stateRate: 0.04,
  /** New York City's combined rate: 4% state, 4.5% city and the MCTD's 0.375% (Publication 718). */
  nycRate: 0.08875,
  title: 50, plates: 25,
  /** Every two years in the city: the vehicle use tax and the MCTD supplemental fee. */
  nycUseTax: 30, mctd: 50,
  /** A weight not published: SLATE reads 3,500 lb, a mid-size car's. */
  assumedLb: 3_500,
  source: 'https://www.tax.ny.gov/pdf/publications/sales/pub718.pdf; https://dmv.ny.gov/forms/mv202.pdf',
} as const;

export const CT = {
  rate: 0.0635, luxuryRate: 0.0775, luxuryOver: 50_000,
  /** Every three years: registration, the administrative fee, clean air and Passport to the Parks. */
  registration: 120, admin: 10, cleanAir: 15, parks: 24,
  /** Once, a new car: title, plate, the greenhouse gas fee, the emissions exemption, and a lien if financed. */
  title: 25, plate: 5, greenhouseNew: 15, emissionsExemption: 40, lien: 10,
  source: 'https://portal.ct.gov/dmv/resources/dmv-fees; https://portal.ct.gov/dmv/vehicle-services/sales-tax-registrations',
} as const;

export const CA_STATE = {
  baseRate: 0.0725,
  /** Los Angeles County's rate, 9.75%, and 10.25% from 1 October 2026 (CDTFA L-1037). */
  losAngeles: [['2020-01-01', 0.0975], ['2026-10-01', 0.1025]] as readonly (readonly [string, number])[],
  sanFrancisco: 0.08625,
  /** A year: registration, the CHP fee, the vehicle license fee on the value, and the transportation improvement fee by value. */
  registration: 76, chp: 34, vlf: 0.0065,
  tif: [[4_999, 33], [24_999, 66], [34_999, 132], [59_999, 198], [Infinity, 231]] as readonly (readonly [number, number])[],
  zev: 121,
  source: 'https://www.cdtfa.ca.gov/formspubs/L1037.pdf; https://www.dmv.ca.gov/portal/vehicle-registration/registration-fees/',
} as const;

export const GB = {
  /** VED from the second year, and the expensive car supplement in years two to six over £40,000 (£50,000 electric). */
  vedStandard: 200, supplement: 440, supplementOver: 40_000, supplementOverEv: 50_000,
  source: 'https://www.gov.uk/vehicle-tax-rate-tables',
} as const;

/** Ireland's motor tax a year by WLTP CO2, cars from 2021: up to the band's grams, the tax. */
export const IE_MOTOR_TAX: readonly (readonly [number, number])[] = [
  [0, 120], [50, 140], [80, 150], [90, 160], [100, 170], [110, 180], [120, 190], [130, 200], [140, 210], [150, 270], [160, 280], [170, 420], [190, 600], [200, 790], [225, 1250], [Infinity, 2400],
];
export const IE_SOURCE = 'https://www.revenue.ie/en/vrt/calculating-vrt/applying-tax.aspx; motor tax bands, gov.ie';

export const ON = {
  hst: 0.13, permit: 32, plate: 59,
  source: 'https://www.ontario.ca/page/register-vehicle-permit-and-licence-plate',
} as const;

export const BC = {
  gst: 0.05,
  /** PST on a passenger car from a dealer, by the whole price (Bulletin PST 308, August 2026). */
  pst: [[54_999.99, 0.07], [55_999.99, 0.08], [56_999.99, 0.09], [124_999.99, 0.1], [149_999.99, 0.15], [Infinity, 0.2]] as readonly (readonly [number, number])[],
  registration: 18, plate: 18,
  /** A year's license fee by net weight in kilograms. */
  licence: [[1_000, 46], [1_400, 53], [1_900, 61], [2_300, 84], [2_800, 122], [Infinity, 142]] as readonly (readonly [number, number])[],
  /** A weight not published: SLATE reads 1,600 kg, a mid-size car's. */
  assumedKg: 1_600,
  source: 'https://www2.gov.bc.ca/assets/gov/taxes/sales-taxes/publications/pst-308-vehicles.pdf; https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/334_91',
} as const;

export const CMX = {
  /** Once: plates, the circulation card and the sticker; a year: the refrendo. The tenencia is waived to MXN 638,000 with the refrendo paid on time. */
  plates: 972, refrendo: 760, tenenciaWaivedTo: 638_000,
  source: 'https://cdmxassets.s3.us-east-1.amazonaws.com/media/files-pdf/control-vehicular/2026/CONT_VEH_CV_2026.pdf',
} as const;

/**
 * A year's insurance, the average paid. The US states' from the NAIC's
 * Auto Insurance Database Report (data year 2023, the latest): liability
 * alone, or liability with collision and comprehensive, which a lender asks.
 * Britain's the ABI's average comprehensive premium paid (Q2 2026); Ireland's
 * the Central Bank's average written premium; Ontario's FSRA's average;
 * British Columbia's ICBC's average Autoplan premium. Mexico City asks only
 * liability cover, and no average premium is published: the one average
 * found is a comparison site's quote, read secondhand.
 */
export const INSURANCE: Readonly<Record<Jurisdiction, { full: number; liability?: number; currency: string; basis: string } | undefined>> = {
  'US-NY': { full: 1_895.99, liability: 1_115.97, currency: 'USD', basis: 'the NAIC’s New York averages, 2023' },
  'US-CT': { full: 1_508.21, liability: 853.74, currency: 'USD', basis: 'the NAIC’s Connecticut averages, 2023' },
  'US-CA': { full: 1_417.94, liability: 660.84, currency: 'USD', basis: 'the NAIC’s California averages, 2023' },
  GB: { full: 566, currency: 'GBP', basis: 'the ABI’s average comprehensive premium paid, Q2 2026' },
  IE: { full: 655, currency: 'EUR', basis: 'the Central Bank’s average written premium, private motor' },
  'CA-ON': { full: 2_164, currency: 'CAD', basis: 'FSRA’s average annual premium, Ontario' },
  'CA-BC': { full: 1_358, currency: 'CAD', basis: 'ICBC’s average Autoplan premium' },
  'MX-CMX': { full: 6_427, currency: 'MXN', basis: 'liability, the cover Mexico City asks: Rastreator’s average quote, 2025, read secondhand; no average premium is published' },
};

/**
 * What's lost of a car's value by its age, iSeeCars' study of all cars
 * (2026): 24.79% at three years, 41.70% at five, 52.51% at seven, 65.12% at
 * ten. Between and beyond them SLATE draws straight lines, its estimate; a
 * new car loses nothing on the day, which no study states either.
 */
export const DEPRECIATION: readonly (readonly [number, number])[] = [[0, 0], [3, 0.2479], [5, 0.417], [7, 0.5251], [10, 0.6512], [20, 0.85]];
export const DEPRECIATION_SOURCE = 'iSeeCars, 2026 (docs/research/world/research-vehicles.json); SLATE’s straight lines between, and to 85% at twenty years';

/**
 * Car loan rates where they're published: Experian's US averages by credit
 * tier, new and used (Q2 2026, VantageScore 4.0 tiers); the Bank of Canada's
 * auto loan rate; Banxico's average for Mexico over 55 months; the Central
 * Bank's rate for Irish consumer loans; for Britain, the Bank of England's
 * quoted rate for a £10,000 personal loan (August 2026), as no 2026 car
 * finance average is published (the FCA's are from 2023).
 */
export const LOAN_RATES = {
  usNew: [[781, 0.0441], [661, 0.0615], [601, 0.0971], [501, 0.1352], [0, 0.1611]] as readonly (readonly [number, number])[],
  usUsed: [[781, 0.0629], [661, 0.0881], [601, 0.1393], [501, 0.191], [0, 0.2162]] as readonly (readonly [number, number])[],
  CA: 0.0666, MX: 0.141, IE: 0.0672, GB: 0.069,
  source: 'Experian, State of the Automotive Finance Market Q2 2026; Bank of Canada; Banxico; Central Bank of Ireland; Bank of England, series IUMHPTL',
} as const;

/**
 * A car's everyday driving, a year, in kilometers: the FHWA's light-duty
 * short-wheelbase average, 10,812 miles (2024); England's 7,100 miles a car
 * (DfT NTS0901, 2025), taken for Britain; Ireland's 15,196 km (the CSO, from
 * NCT odometers, 2023); Canada's light vehicles' 15,366 km (the Canadian
 * Vehicle Survey, 2009, read secondhand; none since). Mexico publishes none:
 * SLATE takes the mean of those four.
 */
const KM = (miles: number) => Math.round(miles * 1.609344);
const PER_YEAR = { US: KM(10_812), GB: KM(7_100), IE: 15_196, CA: 15_366 };
export const KM_A_YEAR: Readonly<Record<Jurisdiction, number>> = {
  'US-NY': PER_YEAR.US, 'US-CT': PER_YEAR.US, 'US-CA': PER_YEAR.US, GB: PER_YEAR.GB, IE: PER_YEAR.IE, 'CA-ON': PER_YEAR.CA, 'CA-BC': PER_YEAR.CA,
  'MX-CMX': Math.round((PER_YEAR.US + PER_YEAR.GB + PER_YEAR.IE + PER_YEAR.CA) / 4),
};

/**
 * A liter of fuel at the pump, cents in the place's money, the week of 28
 * September 2026: the EIA's New York and California regular and its US
 * average for Connecticut (a gallon over 3.785 liters); DESNZ's UK petrol and
 * diesel; AA Ireland's; NRCan's Toronto and Vancouver; Mexico City's Magna,
 * read secondhand.
 */
const GAL = 3.785411784;
export const FUEL: Readonly<Record<Jurisdiction, { petrol: number; diesel: number; currency: string }>> = {
  'US-NY': { petrol: Math.round(440.5 / GAL), diesel: Math.round(440.5 / GAL), currency: 'USD' },
  'US-CT': { petrol: Math.round(446.5 / GAL), diesel: Math.round(446.5 / GAL), currency: 'USD' },
  'US-CA': { petrol: Math.round(618.9 / GAL), diesel: Math.round(618.9 / GAL), currency: 'USD' },
  GB: { petrol: 173, diesel: 198, currency: 'GBP' },
  IE: { petrol: 187, diesel: 194, currency: 'EUR' },
  'CA-ON': { petrol: 184, diesel: 184, currency: 'CAD' },
  'CA-BC': { petrol: 209, diesel: 209, currency: 'CAD' },
  'MX-CMX': { petrol: 2_381, diesel: 2_381, currency: 'MXN' },
};

/**
 * Upkeep: AAA's maintenance, repair and tires, 11.7 US cents a mile (2026),
 * a US figure SLATE carries everywhere at the exchange; and, for a car not
 * yet rated for economy, AAA's fuel at 17.3 cents a mile.
 */
export const UPKEEP_USD_PER_KM = 11.7 / 1.609344;
export const UNRATED_FUEL_USD_PER_KM = 17.3 / 1.609344;
export const RUNNING_SOURCE = 'AAA Your Driving Costs 2026; EIA, DESNZ, AA Ireland, NRCan weekly prices; FHWA VM-1, DfT NTS0901, CSO, Statistics Canada';

/**
 * Parking a car at home on the street (from 2026-09-29): a resident's
 * permit a year. London's is Westminster's, the borough SLATE takes for the
 * city, by the car's CO2 from 2 March 2026 (an electric car's by its
 * battery, SLATE reading the smaller band), and £60 more for a diesel from
 * before 2015, which no car on sale is; Dublin City's €50, unchanged since
 * 2011. A home owned with a garage needs none. New York publishes no garage
 * average and parks on the street for nothing; elsewhere no permit is kept.
 */
export const PERMITS = {
  london: { cityId: 'uk-eng-london', currency: 'GBP', ev: 40, bands: [[90, 91.85], [130, 126.12], [150, 143.96], [255, 230.05], [Infinity, 353.1]] as readonly (readonly [number, number])[] },
  dublin: { cityId: 'ie-lei-dublin', currency: 'EUR', flat: 50 },
  source: 'https://www.westminster.gov.uk/media/document/new-charges-from-mon-2-march-2026; https://www.dublincity.ie/travel-and-transport/apply-or-renew-residential-parking-permit/apply-residential-parking-permit',
} as const;

/**
 * A dealer's documentation fee, in dollars, from 2026-09-30: New York's cap
 * (15 NYCRR 78.19), charged at it; California's cap for a dealer that is a
 * DMV private industry partner (Vehicle Code 4456.5; SB 791's rise was
 * vetoed); Connecticut's uncapped conveyance fee at the averages its
 * legislature's research office found in 2016 (report 2023-R-0092), new and
 * used. Ontario's and British Columbia's advertised prices must include
 * every dealer fee (OMVIC, VSA), so none is added there; Britain's
 * on-the-road prices include theirs; no figure is published for Ireland's
 * dealers or Mexico's.
 */
export const DEALER_DOC_FEE: Readonly<Partial<Record<Jurisdiction, { new: number; used: number; label: string }>>> = {
  'US-NY': { new: 175, used: 175, label: 'Dealer Documentation Fee, New York’s Cap' },
  'US-CA': { new: 85, used: 85, label: 'Dealer Document Processing Charge, California’s Cap' },
  'US-CT': { new: 405, used: 131, label: 'Dealer Conveyance Fee, Connecticut’s Average (Negotiable)' },
};

/**
 * What American buyers paid below the sticker for a new car: Kelley Blue
 * Book's August 2026 average transaction price, $50,089, against an average
 * MSRP of $51,852, 3.4% (published 2026-09-10). No average is published for
 * Canada, Mexico, Britain or Ireland, where discounts come as finance rates
 * and vouchers, so the sticker is paid there.
 */
export const US_NEW_BELOW_STICKER = 0.034;

/**
 * An American closed-end lease, from Toyota Financial Services' published
 * offers for September 2026 (the RAV4 Hybrid in New York, Connecticut and
 * California): $750 acquisition fee, 10,000 miles a year, $0.15 a mile over,
 * $350 disposition fee at the end, terms of 24 to 60 months. The money
 * factor, 0.00299, isn't published: it's worked back from each offer's own
 * figures, and all three give it (research-car-buying.json). The residual is
 * SLATE's depreciation curve at the term: 75% at three years, where Toyota's
 * offers set 76% to 77%. New York taxes a lease's payments at signing (Tax
 * Law 1111(i)); Connecticut and California tax each payment.
 */
export const US_LEASE = {
  moneyFactor: 0.00299,
  acquisition: 750,
  disposition: 350,
  milesAYear: 10_000,
  perMileOver: 0.15,
  terms: [24, 36, 48] as const,
  source: 'Toyota Financial Services, offers expiring 2026-09-30 (toyota.com/greaterny, /socal); the money factor derived from them',
};

/**
 * A motorcycle's or scooter's registration and taxes where one lives, from
 * 2026-09-30 (`docs/research/world/research-vehicle-kinds.json`,
 * `research-vehicle-insurance.json`), in the place's money, units:
 * - New York's $17.50 a year (VTL 410(5)) and the $50 title; the plate's fee
 *   and the MCTD's surcharge weren't confirmed and aren't added.
 * - Connecticut's $63, read as a year's (its term wasn't confirmed), the $5
 *   plate, $25 title, $15 Clean Air Act and $15 parks fees.
 * - California's car fees and value fee, and the $2 motorcycle safety fee.
 * - Britain's vehicle tax by engine size, a year.
 * - Ireland's motor tax by engine size, a year; the price includes VRT.
 * - Ontario's permit and plate, the plate renewing free since 2022.
 * - British Columbia's registration and plate, and $33 a year for the license.
 * - Mexico City's alta, MXN 709, and refrendo, MXN 472, a year (Código
 *   Fiscal art. 224); the tenencia, 3% of the value before IVA, subsidized
 *   whole to MXN 250,000 (the 2026 decree), which SLATE reads each year off
 *   its value on the depreciation curve, not the Code's factor table.
 */
/**
 * A motorhome's and a van's taxes where they differ from a car's (from
 * 2026-09-30): Ireland's motor tax on a goods vehicle up to 3,000 kg
 * unladen, €333 a year, and on a motor caravan, €102, the Department of
 * Transport's rates (the caravan's read from its table, not confirmed).
 * Britain's private light goods and light goods vehicle rates weren't
 * researched: a motorhome and a van there pay a car's standard rate, said so.
 */
export const RV_FEES = { IE: { goods: 333, motorCaravan: 102 } } as const;

/**
 * A year's insurance for a motorhome or campervan where an average is
 * published: Progressive's countrywide average for a motorhome (2024) in the
 * American states, and Quotezone's index average for comprehensive cover in
 * Britain (August 2025 on). Elsewhere, and for a van, a car's.
 */
export const RV_INSURANCE: Readonly<Partial<Record<Jurisdiction, { year: number; currency: string; basis: string }>>> = {
  'US-NY': { year: 1_052, currency: 'USD', basis: 'Progressive’s countrywide average for a motorhome, 2024' },
  'US-CT': { year: 1_052, currency: 'USD', basis: 'Progressive’s countrywide average for a motorhome, 2024' },
  'US-CA': { year: 1_052, currency: 'USD', basis: 'Progressive’s countrywide average for a motorhome, 2024' },
  GB: { year: 598, currency: 'GBP', basis: 'Quotezone’s index average for a motorhome, comprehensive' },
};

export const BIKE_FEES = {
  NY: { registration: 17.5, title: 50 },
  CT: { registration: 63, plate: 5, title: 25, cleanAir: 15, parks: 15 },
  CA: { safety: 2 },
  GB: { ved: [[150, 27], [400, 59], [600, 90], [Infinity, 125]] as readonly (readonly [number, number])[], mot: 29.65 },
  IE: { motorTax: [[75, 49], [200, 67], [Infinity, 88]] as readonly (readonly [number, number])[] },
  BC: { licence: 33 },
  CMX: { alta: 709, refrendo: 472, tenencia: 0.03, subsidizedTo: 250_000 },
} as const;

/**
 * A year's insurance for a motorcycle or scooter, in the place's money,
 * units. What's published differs by place, and each says what it is:
 * - The US states: ValuePenguin's quotes for one rider, a 45-year-old man on
 *   a Honda Rebel 500 with full coverage (2026-09-25). A scooter in New York:
 *   one quote for a Vespa GTS 300 in New York City, $312 for liability and
 *   $1,975 full; Connecticut's and California's scooters take the motorcycle's.
 * - Britain: Confused.com's median premiums paid, January to March 2026: a
 *   motorcycle's £291, a scooter's £463.01, a moped's (to 50cc) £288.17.
 * - British Columbia: ICBC's Basic tariff from 1 September 2026 by engine
 *   class, Lower Mainland, $200,000 liability, before the rider's own factor.
 * - Ireland, Ontario and Mexico City publish no average, only ranges: the
 *   middle of odo.ie's €300 to €600 for an experienced rider, of Ratehub's
 *   CAD 1,500 to 3,500, and of MXN 1,200 to 3,500 for liability. SLATE's
 *   estimates, and said so.
 */
export const BIKE_INSURANCE: Readonly<Record<Jurisdiction, { motorcycle: number | readonly (readonly [number, number])[]; scooter?: number; moped?: number; scooterLiability?: number; currency: string; basis: string }>> = {
  'US-NY': { motorcycle: 324, scooter: 1_975, scooterLiability: 312, currency: 'USD', basis: 'ValuePenguin’s quote for a Honda Rebel 500, full coverage, 2026; a scooter’s, one New York City quote' },
  'US-CT': { motorcycle: 348, currency: 'USD', basis: 'ValuePenguin’s quote for a Honda Rebel 500, full coverage, 2026' },
  'US-CA': { motorcycle: 552, currency: 'USD', basis: 'ValuePenguin’s quote for a Honda Rebel 500, full coverage, 2026' },
  GB: { motorcycle: 291, scooter: 463.01, moped: 288.17, currency: 'GBP', basis: 'Confused.com’s median premiums, January to March 2026' },
  IE: { motorcycle: 450, currency: 'EUR', basis: 'The middle of odo.ie’s €300 to €600 for an experienced rider, SLATE’s estimate' },
  'CA-ON': { motorcycle: 2_500, currency: 'CAD', basis: 'The middle of Ratehub’s CAD 1,500 to 3,500, SLATE’s estimate' },
  'CA-BC': { motorcycle: [[110, 479.79], [400, 670.43], [750, 1_299.3], [1_150, 1_408.63], [Infinity, 1_960.7]], currency: 'CAD', basis: 'ICBC’s Basic tariff by engine class, Lower Mainland, before the rider’s own factor' },
  'MX-CMX': { motorcycle: 2_350, currency: 'MXN', basis: 'The middle of MXN 1,200 to 3,500 for the liability cover the city asks, SLATE’s estimate' },
};
