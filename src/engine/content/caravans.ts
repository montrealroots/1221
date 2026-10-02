/**
 * SLATE — a travel trailer or touring caravan of one's own, towed behind a
 * car (from 2026-09-30), from `docs/research/world/research-vehicles5.json`
 * and `docs/research/world/research-towing2.json`. Every figure is the cited
 * page's; one read from a search's extract or a secondary site says so.
 *
 * Sold where a price and a weight were both read:
 * - America: Jayco's Jay Flight SLX 178DBS at the series' $17,318 before
 *   sales tax (Jayco, which doesn't say whether freight and prep are in it),
 *   its GVWR 4,800 lb.
 * - Britain: Bailey's Discovery D4-2 at £21,499 with VAT (Bailey, from
 *   1 August 2026), its MTPLM 998 kg.
 * Not sold: Canada's only price read, CA$31,956 for a Jay Flight 130BH at a
 * Thunder Bay dealer, came without the 130BH's weight, so no car could be
 * matched to it; no Irish dealer's price in euros was found; Mexico's were
 * Mercado Libre listings, new or used unclear.
 */

export type CaravanMarket = 'US' | 'GB';

export interface CaravanModel {
  label: string;
  price: number;
  currency: string;
  /** Whether the price includes the sales tax (Britain's VAT), or it's added (an American state's). */
  taxIncluded: boolean;
  /** Its most the maker allows it to weigh loaded: GVWR or MTPLM, kg. */
  maxKg: number;
  source: string;
}

export const LB = 0.45359237;

export const CARAVANS: Readonly<Record<CaravanMarket, CaravanModel>> = {
  US: { label: 'Jayco Jay Flight SLX 178DBS', price: 17_318, currency: 'USD', taxIncluded: false, maxKg: 4_800 * LB, source: 'https://www.jayco.com/rvs/travel-trailers/2026-jay-flight-slx/178dbs/' },
  GB: { label: 'Bailey Discovery D4-2', price: 21_499, currency: 'GBP', taxIncluded: true, maxKg: 998, source: 'https://www.baileyofbristol.co.uk/touring-caravans/discovery/discovery-d4-2/' },
};

/**
 * What a car may tow braked, kg: its maker's rating for the trim SLATE sells,
 * or 0 where the maker rates it for none. The law asks that a trailer not be
 * heavier than the car is rated for, so a caravan goes behind a car whose
 * rating is at least the caravan's most. Confirmed where read on the maker's
 * page; the rest from dealers' and the motoring press's pages, or a search's
 * extract, as `research-towing2.json` records each. A car not listed, an
 * electric one among them, has no rating SLATE read, and tows nothing.
 *
 * Britain's caravan clubs advise a caravan of no more than 85% of the car's
 * curb weight, and never over 100% (the Caravan and Motorhome Club, the
 * Camping and Caravanning Club). That is advice, not law, and SLATE holds a
 * curb weight for too few cars, so it isn't asked.
 */
export const TOW_RATINGS: Readonly<Record<string, { kg: number; confirmed: boolean }>> = {
  'us-ford-f-series': { kg: 8_400 * LB, confirmed: false },
  'us-chevrolet-silverado': { kg: 9_500 * LB, confirmed: false },
  'us-toyota-rav4': { kg: 1_750 * LB, confirmed: true },
  'us-honda-cr-v': { kg: 1_500 * LB, confirmed: true },
  'us-ram-pickup-1500-heavy-duty': { kg: 11_550 * LB, confirmed: false },
  'us-gmc-sierra': { kg: 9_400 * LB, confirmed: false },
  // GM Authority's 800 lb for the FWD Equinox; a dealer's page said it isn't rated at all.
  'us-chevrolet-equinox': { kg: 800 * LB, confirmed: false },
  'us-toyota-camry': { kg: 0, confirmed: false },
  'us-ram-promaster': { kg: 6_910 * LB, confirmed: false },
  'us-mercedes-benz-sprinter': { kg: 5_000 * LB, confirmed: false },
  'us-ford-transit': { kg: 6_400 * LB, confirmed: false },
  'gb-ford-puma': { kg: 1_100, confirmed: false },
  'gb-kia-sportage': { kg: 1_900, confirmed: false },
  'gb-nissan-qashqai': { kg: 1_935, confirmed: false },
  'gb-vauxhall-corsa': { kg: 1_200, confirmed: false },
  'gb-nissan-juke': { kg: 1_250, confirmed: false },
  'gb-volkswagen-golf': { kg: 1_400, confirmed: false },
  'gb-volvo-xc40': { kg: 1_600, confirmed: true },
  'gb-mg-hs': { kg: 1_500, confirmed: false },
  'gb-ford-transit-custom': { kg: 2_300, confirmed: false },
  'gb-mercedes-benz-sprinter': { kg: 2_000, confirmed: false },
};

/**
 * A hitch or towbar fitted, in the place's money: Britain's at Towbar
 * Express's £760 for a fixed bar, supplied and fitted (its Puma page, the one
 * read). America's at the middle of U-Haul's $100 to $600 "on average", from
 * 2023, the only installed figure U-Haul published; its own hitch finder
 * prices each car only after a search.
 */
export const HITCH_FIT: Readonly<Record<CaravanMarket, { amount: number; currency: string; basis: string }>> = {
  US: { amount: 350, currency: 'USD', basis: 'The middle of U-Haul’s $100 to $600 for a hitch installed (2023)' },
  GB: { amount: 760, currency: 'GBP', basis: 'Towbar Express’s fixed towbar, supplied and fitted' },
};

/**
 * Its year where it's kept, in the place's money, from `research-towing2.json`:
 * - New York: $5.39 a 500 lb of its GVWR, at least $14.38 (DMV), and
 *   Progressive's $351.44 average travel trailer policy (2024).
 * - Connecticut: a camp trailer's $22.50, the top of the $19 to $22.50 the
 *   month of registering sets, $5 for the plate, and $24 to the Passport to
 *   the Parks (DMV); the $25 title over 3,000 lb at the sale. Its insurance
 *   is New York's, Progressive publishing none for Connecticut.
 * - California: $76 and the CHP's $34, and the Vehicle License Fee's 0.65%
 *   of its value (DMV), and Progressive's $405.14 (2024). County fees vary and
 *   aren't kept.
 * - Britain: no registration and no road tax (GOV.UK), and InsureMy's £162.45
 *   average for a touring caravan (2026).
 */
export const CARAVAN_YEAR: Readonly<Record<'US-NY' | 'US-CT' | 'US-CA' | 'GB', { registration: (maxKg: number, value: number) => number; firstExtra: number; insurance: number; currency: string }>> = {
  'US-NY': { registration: (kg) => Math.max(14.38, Math.ceil(kg / LB / 500) * 5.39), firstExtra: 0, insurance: 351.44, currency: 'USD' },
  'US-CT': { registration: () => 22.5 + 5 + 24, firstExtra: 25, insurance: 351.44, currency: 'USD' },
  'US-CA': { registration: (_kg, value) => 76 + 34 + 0.0065 * value, firstExtra: 0, insurance: 405.14, currency: 'USD' },
  GB: { registration: () => 0, firstExtra: 0, insurance: 162.45, currency: 'GBP' },
};

/**
 * What towing does to the drive:
 * - Fuel: fueleconomy.gov's 1% more a 100 lb of weight carried, taken at the
 *   caravan's most. Oak Ridge measured 30% to 50% for an SUV with a 3,500 lb
 *   trailer, which the rule of thumb's 35% sits inside.
 * - Speed: where the law sets a lower limit towing, the drive takes longer by
 *   the ratio of the two. Britain's 60 mph on a motorway against a car's 70
 *   (GOV.UK). California's 55 mph against its freeways' 65 (Vehicle Code
 *   22406 and 22349). New York, Connecticut, Ontario and British Columbia set
 *   no separate limit where the research looked.
 */
export const TOWING = {
  fuelPer100Lb: 0.01,
  slower: { GB: 70 / 60, 'US-CA': 65 / 55 } as Readonly<Record<string, number>>,
} as const;
