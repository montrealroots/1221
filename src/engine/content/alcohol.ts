/**
 * SLATE — alcohol (Stage 4 of `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-cooking-alcohol.json`.
 *
 * **Blood alcohol** is Widmark's: the grams drunk over the body's water,
 * `A / (r · kg · 10)` in g/dL, falling by β an hour. Widmark's r is 0.68
 * for men and 0.55 for women (Posey & Mozayani, 2007); SLATE keeps no sex,
 * so it takes the middle, as `systems/body.ts` does with Mifflin–St Jeor's.
 * β is NHTSA's 0.017 g/dL an hour for a moderate drinker (Computing a BAC
 * Estimate, 1994); the 0.015 often quoted couldn't be traced to its source.
 * A gram of ethanol is 0.789 ml and 7.1 kcal.
 *
 * **A drink** is what's poured where they are: an American pint is 473 ml,
 * a British and Irish one 568 ml; a Canadian and a Mexican beer taken as
 * America's. Its strength is SLATE's estimate of an ordinary draft lager,
 * 5% in America and 4% in Britain and Ireland, where the NHS puts a pint of
 * ordinary lager just over two units.
 *
 * **A pint at a bar** is Numbeo's crowd-sourced domestic draft, read
 * 2026-10-01: an estimate, said so. No city's price for a glass of wine was
 * found, so a bar here sells beer.
 *
 * **On the road**, NHTSA's case-control study gives the relative risk of a
 * crash at each 0.01 of breath alcohol, adjusted for age and sex (Compton &
 * Berning, DOT HS 812 117, 2015): below 1 at 0.01 and 0.02, 3.93 at 0.08,
 * 23.29 at 0.20 and over. How often an impaired drive ends in an arrest is
 * the CDC's: 1.41 million arrests in 2010 against 112 million self-reported
 * episodes (MMWR 60(39), 2011), about one in eighty, America's figure taken
 * everywhere, SLATE's estimate outside it.
 */

export type DrinkingMarket = 'US' | 'GB' | 'IE' | 'CA' | 'MX';

export const WIDMARK = { r: (0.68 + 0.55) / 2, betaPerHour: 0.017, gramsPerMl: 0.789, kcalPerGram: 7.1 } as const;

/** A pint of draft beer where they are: its volume and strength, and a bar's price for one (an estimate). */
export const PINT: Readonly<Record<DrinkingMarket, { ml: number; abv: number }>> = {
  US: { ml: 473, abv: 0.05 }, CA: { ml: 473, abv: 0.05 }, MX: { ml: 473, abv: 0.05 }, GB: { ml: 568, abv: 0.04 }, IE: { ml: 568, abv: 0.04 },
};

/** Numbeo's domestic draft pint, by town, in its money. */
export const BAR_PINT: Readonly<Record<string, { price: number; currency: string }>> = {
  'us-ny-newyork': { price: 8, currency: 'USD' },
  'us-ca-losangeles': { price: 8, currency: 'USD' },
  'uk-eng-london': { price: 7, currency: 'GBP' },
  'ie-lei-dublin': { price: 7, currency: 'EUR' },
  'ca-on-toronto': { price: 9, currency: 'CAD' },
  'ca-bc-vancouver': { price: 8, currency: 'CAD' },
  'mx-cmx-mexicocity': { price: 60, currency: 'MXN' },
};

/** NHTSA's relative risk of a crash, adjusted for age and sex, at each 0.01 g/dL from 0 to 0.20 and over. */
export const CRASH_RISK: readonly number[] = [1, 0.54, 0.85, 1.2, 1.6, 2.07, 2.61, 3.22, 3.93, 4.73, 5.64, 6.67, 7.82, 9.11, 10.56, 12.18, 13.97, 15.96, 18.17, 20.6, 23.29];

/** The share of impaired drives that end in an arrest. */
export const ARREST_PER_DRIVE = 1.41 / 112;

/** The age a drink may be bought, by country, and Ontario's and British Columbia's 19. */
export function drinkingAge(cityId: string): number {
  if (cityId.startsWith('us-')) return 21;
  if (cityId.startsWith('ca-on-') || cityId.startsWith('ca-bc-')) return 19;
  return 18;
}

/**
 * A first offense, by where it's driven: the band of blood alcohol it starts
 * at, the fine in the jurisdiction's money and how many months the license
 * goes. A fine given as a range is its middle. Each is its government's own
 * page, or as noted:
 * - New York (dmv.ny.gov): driving while ability impaired over 0.05, $300
 *   to $500 and 90 days; DWI at 0.08, $500 to $1,000 and at least six
 *   months; aggravated at 0.18, $1,000 to $2,500 and at least a year.
 * - Connecticut (Conn. Gen. Stat. §14-227a): $500 to $1,000 and 45 days.
 * - California (dmv.ca.gov): $390 to $1,000 base fine, before the court's
 *   penalty assessments, which SLATE doesn't keep; four months.
 * - England (gov.uk): at least a year's ban; the fine, Band C, 150% of a
 *   week's income, at the £440 week the Sentencing Council assumes where
 *   it isn't known.
 * - Ireland (Drinkaware): €200 and three months from 0.05; €400 and six
 *   from 0.08; over 0.10 a court, at least a year, its fine not kept.
 * - Ontario (ontario.ca): the warn range from 0.05, $250 and seven days;
 *   from 0.08, the roadside $550 and the Criminal Code's least fine, $1,000
 *   to 0.12, $1,500 to 0.16 and $2,000 above, and a year after conviction.
 * - British Columbia (gov.bc.ca): the warn range, $200, $250 to reinstate
 *   and $150 impound, three days; a fail from 0.08, $500, $250 and $680, 90
 *   days.
 * - Mexico City (Reglamento de Tránsito, art. 50): from 0.08, 20 to 36
 *   hours' arrest at El Torito, which can't be paid off, and a fine Infobae
 *   reported at MXN 6,224, unconfirmed.
 */
export interface Offence { from: number; fine: number | null; months: number; arrestHours?: number; label: string }
export const OFFENCES: Readonly<Record<string, { currency: string; bands: readonly Offence[] }>> = {
  'US-NY': { currency: 'USD', bands: [
    { from: 0.05, fine: 400, months: 3, label: 'Driving While Ability Impaired' },
    { from: 0.08, fine: 750, months: 6, label: 'Driving While Intoxicated' },
    { from: 0.18, fine: 1750, months: 12, label: 'Aggravated Driving While Intoxicated' },
  ] },
  'US-CT': { currency: 'USD', bands: [{ from: 0.08, fine: 750, months: 1.5, label: 'Driving Under The Influence' }] },
  'US-CA': { currency: 'USD', bands: [{ from: 0.08, fine: 695, months: 4, label: 'Driving Under The Influence' }] },
  GB: { currency: 'GBP', bands: [{ from: 0.08, fine: 660, months: 12, label: 'Drink Driving' }] },
  IE: { currency: 'EUR', bands: [
    { from: 0.05, fine: 200, months: 3, label: 'Drink Driving' },
    { from: 0.08, fine: 400, months: 6, label: 'Drink Driving' },
    { from: 0.1, fine: null, months: 12, label: 'Drink Driving, In Court' },
  ] },
  'CA-ON': { currency: 'CAD', bands: [
    { from: 0.05, fine: 250, months: 7 / 30, label: 'The Warn Range' },
    { from: 0.08, fine: 1550, months: 12, label: 'Impaired Driving' },
    { from: 0.12, fine: 2050, months: 12, label: 'Impaired Driving' },
    { from: 0.16, fine: 2550, months: 12, label: 'Impaired Driving' },
  ] },
  'CA-BC': { currency: 'CAD', bands: [
    { from: 0.05, fine: 600, months: 3 / 30, label: 'An Immediate Roadside Prohibition, Warn' },
    { from: 0.08, fine: 1430, months: 3, label: 'An Immediate Roadside Prohibition, Fail' },
  ] },
  'MX-CMX': { currency: 'MXN', bands: [{ from: 0.08, fine: 6224, months: 0, arrestHours: 36, label: 'The Alcoholímetro' }] },
};
