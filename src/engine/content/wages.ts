/**
 * SLATE — the legal floor under a wage, where the character lives.
 *
 * Survival jobs, the ones actors take between roles, pay at or a little over
 * the minimum wage. So a job's pay starts from the real one: the statutory
 * adult hourly minimum in force where the character works, in that country's
 * money, with the date it took effect and where the figure came from. Checked
 * against the sources below on 2026-09-24. Where a country sets its floor by
 * collective agreement rather than statute, the lowest general rate is used
 * and marked as such.
 *
 * Outside the table, a country's own minimum from the world research
 * (`content/work-world.ts`, 2026-09-25) where it found one. Everywhere else
 * SLATE has no figure, and says so: `minimumWageAt` falls back
 * to an estimate from the town's cost of living (`kind: 'estimate'`), and the
 * screen calls it an estimate. That covers Italy, which has no statutory
 * minimum and whose sector agreements run from about €7 to €14 an hour, and
 * the United Arab Emirates, which has none for anybody who isn't Emirati.
 *
 * Resolved like the tax rules: the deepest of country, region and town that
 * has a figure wins, and each figure has a date range.
 */

import { CITIES, COUNTRIES, jurisdictionPath } from './geography';
import { WORLD_WORK } from './work-world';
import { exchange } from './currency';

export interface MinimumWage {
  /** A jurisdiction code as the tax rules use them, or a town id. */
  where: string;
  /** Hourly, in hundredths of the local unit. */
  hourly: number;
  currency: string;
  effectiveFrom: number;
  effectiveTo?: number;
  kind: 'statutory' | 'agreement';
  source: string;
  note?: string;
  /** A youth rate: for ages from `ageFrom` and under `ageBelow`. The adult rate has neither. */
  ageFrom?: number;
  ageBelow?: number;
}

const D = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);
const ALWAYS = D(1900, 1, 1);
const DOL_STATES = 'https://www.dol.gov/agencies/whd/minimum-wage/state';

const w = (
  where: string, hourly: number, currency: string, from: number, source: string,
  extra: { to?: number; kind?: MinimumWage['kind']; note?: string; ageFrom?: number; ageBelow?: number } = {},
): MinimumWage => ({
  where, hourly: Math.round(hourly * 100), currency, effectiveFrom: from,
  ...(extra.to !== undefined ? { effectiveTo: extra.to } : {}),
  kind: extra.kind ?? 'statutory', source,
  ...(extra.note ? { note: extra.note } : {}),
  ...(extra.ageFrom !== undefined ? { ageFrom: extra.ageFrom } : {}),
  ...(extra.ageBelow !== undefined ? { ageBelow: extra.ageBelow } : {}),
});

export const MINIMUM_WAGES: readonly MinimumWage[] = [
  // --- Countries ----------------------------------------------------------
  w('US', 7.25, 'USD', D(2009, 7, 24), 'https://www.dol.gov/general/topic/wages/minimumwage'),
  w('GB', 12.21, 'GBP', D(2025, 4, 1), 'https://www.gov.uk/national-minimum-wage-rates', { to: D(2026, 4, 1), note: 'National Living Wage, 21 and over.' }),
  w('GB', 12.71, 'GBP', D(2026, 4, 1), 'https://www.gov.uk/national-minimum-wage-rates', { note: 'National Living Wage, 21 and over.' }),
  // The youth rates from April 2026; the research found none for 2025/26, so
  // a worker under 21 is paid the adult rate before then.
  w('GB', 10.85, 'GBP', D(2026, 4, 1), 'https://www.gov.uk/national-minimum-wage-rates', { ageFrom: 18, ageBelow: 21, note: '18 to 20.' }),
  w('GB', 8.00, 'GBP', D(2026, 4, 1), 'https://www.gov.uk/national-minimum-wage-rates', { ageBelow: 18, note: 'Under 18.' }),
  w('CA', 17.75, 'CAD', D(2025, 4, 1), 'https://www.canada.ca/en/employment-social-development/news/2026/03/government-of-canada-raises-the-federal-minimum-wage.html', { to: D(2026, 4, 1), note: 'Federal; applies to federally regulated work. Provinces set their own.' }),
  w('CA', 18.15, 'CAD', D(2026, 4, 1), 'https://www.canada.ca/en/employment-social-development/news/2026/03/government-of-canada-raises-the-federal-minimum-wage.html', { note: 'Federal; applies to federally regulated work. Provinces set their own.' }),
  w('AU', 24.95, 'AUD', D(2025, 7, 1), 'https://www.fairwork.gov.au/about-us/workplace-laws/annual-wage-review/annual-wage-review-2026', { to: D(2026, 7, 1) }),
  w('AU', 26.44, 'AUD', D(2026, 7, 1), 'https://www.fairwork.gov.au/about-us/workplace-laws/annual-wage-review/annual-wage-review-2026'),
  w('NZ', 23.50, 'NZD', D(2025, 4, 1), 'https://www.mbie.govt.nz/about/news/minimum-wage-set-for-2026', { to: D(2026, 4, 1) }),
  w('NZ', 23.95, 'NZD', D(2026, 4, 1), 'https://www.mbie.govt.nz/about/news/minimum-wage-set-for-2026'),
  // 476,093 a month from January and 476,379 from April, over the agreement's
  // 173.33 hours.
  w('IS', 2746.73, 'ISK', D(2026, 1, 1), 'https://www.efling.is/sa-launatoflur', { to: D(2026, 4, 1), kind: 'agreement', note: 'Iceland has no statutory minimum: this is the lowest band of the Efling–SA general agreement.' }),
  w('IS', 2748.39, 'ISK', D(2026, 4, 1), 'https://www.efling.is/sa-launatoflur', { kind: 'agreement', note: 'Iceland has no statutory minimum: this is the lowest band of the Efling–SA general agreement.' }),
  w('MX', 39.38, 'MXN', D(2026, 1, 1), 'https://www.gob.mx/conasami/articulos/incremento-a-los-salarios-minimos-para-2026?idiom=es', { note: 'General zone, 315.04 a day over eight hours.' }),
  w('KR', 10320, 'KRW', D(2026, 1, 1), 'https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18144'),
  w('JP', 1121, 'JPY', D(2025, 10, 1), 'https://www.mhlw.go.jp/stf/newpage_74920.html', { to: D(2026, 10, 1), note: 'National weighted average of the prefectural minimums.' }),
  w('JP', 1177, 'JPY', D(2026, 10, 1), 'https://www.mhlw.go.jp/stf/newpage_74920.html', { note: 'National weighted average of the prefectural minimums; prefectures move between October and December.' }),
  w('IE', 14.15, 'EUR', D(2026, 1, 1), 'https://www.citizensinformation.ie/en/employment/employment-rights-and-conditions/pay-and-employment/minimum-wage/', { note: '20 and over.' }),
  w('IE', 12.74, 'EUR', D(2026, 1, 1), 'https://www.citizensinformation.ie/en/employment/employment-rights-and-conditions/pay-and-employment/minimum-wage/', { ageFrom: 19, ageBelow: 20, note: '19, 90% of the adult rate.' }),
  w('IE', 11.32, 'EUR', D(2026, 1, 1), 'https://www.citizensinformation.ie/en/employment/employment-rights-and-conditions/pay-and-employment/minimum-wage/', { ageFrom: 18, ageBelow: 19, note: '18, 80%.' }),
  w('IE', 9.91, 'EUR', D(2026, 1, 1), 'https://www.citizensinformation.ie/en/employment/employment-rights-and-conditions/pay-and-employment/minimum-wage/', { ageBelow: 18, note: 'Under 18, 70%.' }),
  w('FR', 12.02, 'EUR', D(2026, 1, 1), 'https://www.info.gouv.fr/actualite/le-smic-revalorise-au-1er-janvier-2026', { to: D(2026, 6, 1), note: 'SMIC, gross.' }),
  w('FR', 12.31, 'EUR', D(2026, 6, 1), 'https://www.info.gouv.fr/actualite/le-smic-revalorise-le-1er-juin-2026', { note: 'SMIC, gross.' }),
  // 1,221 a month in fourteen payments is 17,094 a year, over 2,080 hours.
  w('ES', 8.22, 'EUR', D(2026, 1, 1), 'https://www.boe.es/buscar/doc.php?id=BOE-A-2026-3815', { note: 'SMI, 17,094 a year over 2,080 hours; Spain publishes it by the day and the month.' }),
  w('DE', 13.90, 'EUR', D(2026, 1, 1), 'https://www.bmas.de/DE/Service/Presse/Pressemitteilungen/2025/mindestlohn-steigt-zum-ersten-januar-2026.html'),

  // --- US states; the rest pay the federal rate ---------------------------
  w('US-WA', 17.13, 'USD', D(2026, 1, 1), DOL_STATES),
  w('US-NY', 16.00, 'USD', D(2026, 1, 1), DOL_STATES, { note: 'Outside New York City, Long Island and Westchester.' }),
  w('US-NY-newyork', 17.00, 'USD', D(2026, 1, 1), DOL_STATES),
  w('US-NV', 12.00, 'USD', D(2024, 7, 1), DOL_STATES),
  w('US-FL', 14.00, 'USD', D(2025, 9, 30), 'https://floridajobs.org/florida-minimum-wage', { to: D(2026, 9, 30) }),
  w('US-FL', 15.00, 'USD', D(2026, 9, 30), 'https://floridajobs.org/florida-minimum-wage'),
  w('US-CA', 16.90, 'USD', D(2026, 1, 1), DOL_STATES),
  w('US-OR', 15.05, 'USD', D(2025, 7, 1), 'https://www.oregon.gov/boli/workers/pages/minimum-wage.aspx', { to: D(2026, 7, 1), note: 'Standard rate; Portland metro and non-urban counties differ.' }),
  w('US-OR', 15.55, 'USD', D(2026, 7, 1), 'https://www.oregon.gov/boli/workers/pages/minimum-wage.aspx', { note: 'Standard rate; Portland metro and non-urban counties differ.' }),
  w('US-NM', 12.00, 'USD', ALWAYS, DOL_STATES),
  w('US-NJ', 15.92, 'USD', D(2026, 1, 1), DOL_STATES),
  w('US-MA', 15.00, 'USD', D(2023, 1, 1), DOL_STATES),
  w('US-IL', 15.00, 'USD', D(2025, 1, 1), DOL_STATES),
  w('US-HI', 16.00, 'USD', D(2026, 1, 1), DOL_STATES),
  w('US-CO', 15.16, 'USD', D(2026, 1, 1), DOL_STATES),
  w('US-AZ', 15.15, 'USD', D(2026, 1, 1), DOL_STATES),
  w('US-OH', 11.00, 'USD', D(2026, 1, 1), DOL_STATES, { note: 'Employers with gross receipts of $405,000 or more.' }),
  w('US-MI', 13.73, 'USD', D(2026, 2, 21), DOL_STATES),

  // --- Canadian provinces --------------------------------------------------
  // Keyed as the gazetteer numbers them: Quebec is CA-10, Ontario CA-08 and
  // British Columbia CA-02. They were keyed CA-QC, CA-ON and CA-BC, which no
  // town carries, so every Canadian town was paid the federal rate, and taxed
  // without its province, until 2026-09-25.
  w('CA-10', 16.10, 'CAD', D(2025, 5, 1), 'https://www.quebec.ca/nouvelles/actualites/details/le-taux-general-du-salaire-minimum-passera-a-1660-lheure-le-1er-mai-2026-68123', { to: D(2026, 5, 1) }),
  w('CA-10', 16.60, 'CAD', D(2026, 5, 1), 'https://www.quebec.ca/nouvelles/actualites/details/le-taux-general-du-salaire-minimum-passera-a-1660-lheure-le-1er-mai-2026-68123'),
  w('CA-08', 17.60, 'CAD', D(2025, 10, 1), 'https://hicksmorley.com/2026/04/01/ontario-minimum-wage-to-increase-october-1-2026/', { to: D(2026, 10, 1) }),
  w('CA-08', 17.95, 'CAD', D(2026, 10, 1), 'https://hicksmorley.com/2026/04/01/ontario-minimum-wage-to-increase-october-1-2026/'),
  w('CA-02', 17.85, 'CAD', D(2025, 6, 1), 'https://news.gov.bc.ca/releases/2026LBR0021-000581', { to: D(2026, 6, 1) }),
  w('CA-02', 18.25, 'CAD', D(2026, 6, 1), 'https://news.gov.bc.ca/releases/2026LBR0021-000581'),

  // --- Tokyo prefecture ----------------------------------------------------
  // The gazetteer numbers Japan's prefectures as GeoNames does, in the order
  // of their names, and Tokyo is 40 there. This was keyed to JP-13, Tokyo's
  // ISO number, which in the gazetteer is Hyōgo: Hyōgo's towns were paid
  // Tokyo's rate and Tokyo's got it only through a key on the one town.
  w('JP-40', 1226, 'JPY', D(2025, 10, 3), 'https://jsite.mhlw.go.jp/tokyo-hellowork/list/kiba/minimum-wage-information_2026.html', { to: D(2026, 10, 1) }),
  w('JP-40', 1280, 'JPY', D(2026, 10, 1), 'https://jsite.mhlw.go.jp/tokyo-hellowork/list/kiba/minimum-wage-information_2026.html'),
];

export interface WageFloor {
  /** Hourly, in hundredths of `currency`. */
  hourly: number;
  currency: string;
  kind: 'statutory' | 'agreement' | 'estimate';
  source?: string;
  note?: string;
}

/**
 * What an hour at the floor pays here, now.
 *
 * Where SLATE has no figure it estimates one from the town's cost of living,
 * which the atlas puts at 100 for the American average: thirteen US dollars
 * an hour at a hundred, the federal minimum being well under what an American
 * hourly job pays, converted into the town's money where SLATE has a rate for
 * it, and into dollars where it hasn't.
 */
export function minimumWageAt(cityId: string, at: number, localCurrency: string, age?: number): WageFloor {
  const city = CITIES.require(cityId);
  const keys = [...jurisdictionPath(cityId), cityId];
  // A youth rate for the worker's age where the place has one, else the adult rate.
  const young = (one: MinimumWage) => one.ageFrom !== undefined || one.ageBelow !== undefined;
  const fits = (one: MinimumWage) => age !== undefined && (one.ageFrom ?? 0) <= age && age < (one.ageBelow ?? Number.POSITIVE_INFINITY);
  for (let i = keys.length - 1; i >= 0; i--) {
    const here = MINIMUM_WAGES.filter((one) => one.where === keys[i]
      && one.effectiveFrom <= at && (one.effectiveTo === undefined || at < one.effectiveTo));
    const found = here.find((one) => young(one) && fits(one)) ?? here.find((one) => !young(one));
    if (found) {
      return {
        hourly: found.hourly, currency: found.currency, kind: found.kind, source: found.source,
        ...(found.note ? { note: found.note } : {}),
      };
    }
  }
  // Outside the table, the country's own minimum from the world research
  // (`content/work-world.ts`), where it found one.
  const world = WORLD_WORK[COUNTRIES.get(city.countryId)?.jurisdictionCode ?? '']?.minimum;
  if (world) {
    return { hourly: world.hourly, currency: world.currency, kind: world.kind, source: world.source, ...(world.note ? { note: world.note } : {}) };
  }
  const usd = Math.round(13_00 * city.costOfLivingIndex / 100);
  const local = exchange(usd, 'USD', localCurrency);
  return local === undefined
    ? { hourly: usd, currency: 'USD', kind: 'estimate' }
    : { hourly: local, currency: localCurrency, kind: 'estimate' };
}
