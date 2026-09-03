/**
 * SLATE — a place, as it is to somebody standing in it.
 *
 * Every city has its own clock, weather, prices and taxes, and when the
 * player is in one, Home says so. This gathers what the rest of the engine
 * already knows about a city into one honest profile: the time zone and the
 * hours it is from home, the weather now, the climate, what things cost, how
 * much of the industry is here, and what the taxman takes. Nothing here is
 * new information; it is the same jurisdiction, geography and climate the
 * simulation runs on, read for one place.
 */

import type { Simulation } from '../core/simulation';
import { MS_HOUR, formatTime, zoneAbbreviation, zoneOffsetMs } from '../core/time';
import { sunTimes, type SunTimes } from '../core/sun';
import { CITIES, COUNTRIES, REGIONS, distanceKm, type City } from '../content/geography';
import { computeAnnualTax, filmIncentive, propertyTaxRate, salesTaxRate } from '../content/tax';
import { currencyInfo, formatLocalCompact, type CurrencyInfo } from '../content/currency';
import { languageNames } from '../content/languages';
import { usesFahrenheit } from '../content/climate';
import { weatherAt, type WeatherNow } from '../systems/weather';
import { usesMiles } from '../systems/driving';

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
  weather?: WeatherNow;
  costOfLivingIndex: number;
  medianRentCents: number;
  industryPresence: number;
  jobMarketDepth: number;
  /** Effective income tax rate at the reference income, 0-1. */
  effectiveIncomeTax: number;
  salesTax: number;
  propertyTax: number;
  filmIncentive?: number;
  tags: string[];
}

/** The city the player lives in: their residence, else where they are from. */
export function homeCityOf(sim: Simulation): City | undefined {
  const player = sim.player;
  const residence = player.residenceId ? sim.universe.properties[player.residenceId] : undefined;
  return CITIES.get(residence?.locationId ?? player.homeRegionId) ?? CITIES.get(player.currentLocationId);
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
  const incentive = filmIncentive(city.id, sim.now);

  const km = home && away ? distanceKm(home, city) : 0;
  const distanceFromHome = away
    ? (usesMiles(city.countryId) ? `${Math.round(km * 0.621371)} mi` : `${Math.round(km)} km`)
    : undefined;

  return {
    city,
    regionName: region && region.name !== country?.name ? region.name : undefined,
    countryName: country?.name ?? city.countryId.toUpperCase(),
    countryId: city.countryId,
    currency: { ...currencyInfo(country?.currency ?? 'USD'), name: country?.currencyName || (country?.currency ?? 'USD') },
    localRent: city.medianRentCents > 0 ? formatLocalCompact(city.medianRentCents, country?.currency ?? 'USD') : undefined,
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
    weather: weatherAt(sim, city.id),
    costOfLivingIndex: city.costOfLivingIndex,
    medianRentCents: city.medianRentCents,
    industryPresence: city.industryPresence,
    jobMarketDepth: city.jobMarketDepth,
    effectiveIncomeTax: totalTax / TAX_REFERENCE_INCOME,
    salesTax: salesTaxRate(city.id, sim.now, 'general'),
    propertyTax: propertyTaxRate(city.id, sim.now),
    filmIncentive: incentive ? incentive.rate : undefined,
    tags: city.tags,
  };
}

/**
 * Where things the player is part of are shooting next.
 *
 * Only projects the player is actually on — cast, attached, directing or
 * writing. What some other production is doing on the other side of the
 * world is not something a working actor gets a memo about.
 */
export function upcomingShoots(sim: Simulation): { projectId: string; title: string; city: City; firstDay: number; days: number; isStage: boolean }[] {
  const player = sim.player;
  const mine = Object.values(sim.universe.projects).filter((p) =>
    p.castIds.includes(player.id)
    || p.directorId === player.id
    || p.writerIds.includes(player.id)
    || p.attachments.some((a) => a.personId === player.id));

  const out: { projectId: string; title: string; city: City; firstDay: number; days: number; isStage: boolean }[] = [];
  for (const project of mine) {
    const ahead = project.shootDayIds
      .map((id) => sim.universe.shootDays[id])
      .filter((d): d is NonNullable<typeof d> => !!d && d.status === 'scheduled' && d.date >= sim.now);
    const byPlace = new Map<string, { firstDay: number; days: number; isStage: boolean }>();
    for (const day of ahead) {
      const entry = byPlace.get(day.locationId);
      if (entry) { entry.days++; entry.firstDay = Math.min(entry.firstDay, day.date); entry.isStage = entry.isStage && day.isStage; }
      else byPlace.set(day.locationId, { firstDay: day.date, days: 1, isStage: day.isStage });
    }
    for (const [locationId, entry] of byPlace) {
      const city = CITIES.get(locationId);
      if (city) out.push({ projectId: project.id, title: project.title, city, ...entry });
    }
  }
  return out.sort((a, b) => a.firstDay - b.firstDay);
}
