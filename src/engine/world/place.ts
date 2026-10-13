/**
 * SLATE — a place, as it is to somebody standing in it.
 *
 * Every city has its own clock, weather, prices and taxes, and when the
 * player is in one, Home says so. This gathers what the rest of the engine
 * already knows about a city into one honest profile: the time zone and the
 * hours it is from home, the climate, what things cost, and what the taxman
 * takes. The weather now is read beside it (`weatherAt`); until 2026-09-27 the
 * profile ran the hourly model for a field nothing read. Nothing here is
 * new information; it is the same jurisdiction, geography and climate the
 * simulation runs on, read for one place.
 */

import type { Simulation } from '../core/simulation';
import { MS_HOUR, formatTime, zoneAbbreviation, zoneOffsetMs } from '../core/time';
import { sunTimes, type SunTimes } from '../core/sun';
import { CITIES, COUNTRIES, REGIONS, distanceKm, type City } from '../content/geography';
import { computeAnnualTax, propertyTaxRate, salesTaxRate } from '../content/tax';
import { currencyInfo, formatLocalCompact, type CurrencyInfo } from '../content/currency';
import { languageNames } from '../content/languages';
import { usesFahrenheit, usesMiles } from '../content/climate';
import { rentAt } from '../content/rents';

/** "Capital", "State Capital", "Provincial Capital": what kind of place this is, if it is a kind at all. */
export function placeKindLabel(city: City): string | undefined {
  if (city.kind === 'capital') return 'Capital';
  if (city.kind === 'regional_capital') return `${REGION_WORD[city.countryId] ?? 'Regional'} Capital`;
  return undefined;
}

/** What a first-level region is called, where it is not just a region. */
const REGION_WORD: Record<string, string> = {
  us: 'State', au: 'State', br: 'State', mx: 'State', in: 'State', de: 'State', ng: 'State', my: 'State', at: 'State',
  ca: 'Provincial', cn: 'Provincial', za: 'Provincial', ar: 'Provincial', es: 'Provincial', it: 'Regional',
  jp: 'Prefectural', kr: 'Provincial', ph: 'Provincial', id: 'Provincial', pk: 'Provincial', th: 'Provincial',
  fr: 'Regional', uk: 'National', ch: 'Cantonal', ie: 'County', pl: 'Provincial', nl: 'Provincial', be: 'Provincial',
};

/** "3.8M", "466K", "912": a population at a glance. */
export function formatPeople(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString('en-US');
}

/** A representative salary the effective tax rate is read at. */
export const TAX_REFERENCE_INCOME = 60_000_00;

export interface PlaceProfile {
  city: City;
  regionName?: string;
  countryName: string;
  countryId: string;
  /** The money here: how it is written, and SLATE's rate if one is on file. */
  currency: CurrencyInfo & { name: string };
  /** Median rent written in the local currency, when a rate is on file. */
  localRent?: string;
  languages: string[];
  capital: string;
  continent: string;
  countryPopulation: number;
  areaKm2: number;
  /** International dialling code, without the plus. */
  phone: string;
  /** Sunrise and sunset here, on this local day. */
  sun: SunTimes;
  units: { distance: 'mi' | 'km'; temperature: 'F' | 'C' };
  cityPopulation: number;
  drivesOn: 'left' | 'right';
  localTime: string;
  zone: string;
  zoneAbbreviation: string;
  /** Hours ahead (+) or behind (−) the player's home city. */
  hoursFromHome: number;
  homeCity?: City;
  /** Distance from home, in the unit this country reads. */
  distanceFromHome?: string;
  away: boolean;
  costOfLivingIndex: number;
  medianRentCents: number;
  /** Effective income tax rate at the reference income, 0-1. */
  /**
   * What a wage actually loses, as a fraction of it.
   *
   * Every line `computeAnnualTax` returns, which is income tax at all three
   * levels and payroll on top. Calling it income tax alone understates what
   * comes out and overstates the income tax rate, so nothing that prints it
   * may label it that.
   */
  effectiveIncomeTax: number;
  salesTax: number;
  propertyTax: number;
  tags: string[];
}

/**
 * The city the player lives in, which is where they are: since the scope of
 * 2026-10-09 nothing moves a player, and the city they were born in
 * (`homeRegionId`) is read only where the one they stand in isn't in the
 * atlas. Until 2026-09-27 it was always where they were, from a build in which
 * nothing moved the player; from then until 2026-10-09 jobs on location,
 * sublets and relocation moved them, and their home's city came first. So
 * "away" is said only of another city, on its place look: Home's away line
 * and its hours from home went on 2026-10-13, reached by no life.
 */
export function homeCityOf(sim: Simulation): City | undefined {
  const player = sim.player;
  return CITIES.get(player.currentLocationId) ?? CITIES.get(player.homeRegionId);
}

export function placeProfile(sim: Simulation, cityId: string): PlaceProfile | undefined {
  const city = CITIES.get(cityId);
  if (!city) return undefined;
  const region = REGIONS.get(city.parentId);
  const country = COUNTRIES.get(city.countryId);
  const home = homeCityOf(sim);
  const away = !!home && home.id !== city.id;

  const hoursFromHome = home
    ? Math.round(((zoneOffsetMs(sim.now, city.timeZone) - zoneOffsetMs(sim.now, home.timeZone)) / MS_HOUR) * 2) / 2
    : 0;

  const tax = computeAnnualTax(TAX_REFERENCE_INCOME, city.id, sim.now);
  const totalTax = tax.lines.reduce((sum, line) => sum + line.amount, 0);

  const km = home && away ? distanceKm(home, city) : 0;
  // Thousands separated, because a distance from home is usually a four-digit
  // one and "3756 mi" reads as a serial number rather than as a distance.
  const distanceFromHome = away
    ? (usesMiles(city.countryId)
      ? `${Math.round(km * 0.621371).toLocaleString('en-US')} mi`
      : `${Math.round(km).toLocaleString('en-US')} km`)
    : undefined;

  const oneBedUsd = city.medianRentCents > 0 ? rentAt(city.id, 'USD').oneBed : 0;
  return {
    city,
    regionName: region && region.name !== country?.name ? region.name : undefined,
    countryName: country?.name ?? city.countryId.toUpperCase(),
    countryId: city.countryId,
    currency: { ...currencyInfo(country?.currency ?? 'USD'), name: country?.currencyName || (country?.currency ?? 'USD') },
    // The rent the game charges (`content/rents.ts`), not the atlas's raw
    // figure: Home said "Rent about 473K kr/mo" for Mosfellsbær while the
    // household charged from Iceland's published 205,000.
    localRent: oneBedUsd > 0 ? formatLocalCompact(oneBedUsd, country?.currency ?? 'USD') : undefined,
    languages: languageNames(country?.languages ?? ''),
    capital: country?.capital ?? '',
    continent: country?.continent ?? '',
    countryPopulation: country?.population ?? 0,
    areaKm2: country?.areaKm2 ?? 0,
    phone: country?.phone ?? '',
    sun: sunTimes(sim.now, city.latitude, city.longitude, city.timeZone),
    units: { distance: usesMiles(city.countryId) ? 'mi' : 'km', temperature: usesFahrenheit(city.countryId) ? 'F' : 'C' },
    cityPopulation: city.population,
    drivesOn: country?.drivesOn ?? 'right',
    localTime: formatTime(sim.now, city.timeZone),
    zone: city.timeZone,
    zoneAbbreviation: zoneAbbreviation(sim.now, city.timeZone),
    hoursFromHome,
    homeCity: home,
    distanceFromHome,
    away,
    costOfLivingIndex: city.costOfLivingIndex,
    medianRentCents: oneBedUsd,
    effectiveIncomeTax: totalTax / TAX_REFERENCE_INCOME,
    salesTax: salesTaxRate(city.id, sim.now, 'general'),
    propertyTax: propertyTaxRate(city.id, sim.now),
    tags: city.tags,
  };
}

