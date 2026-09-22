/**
 * SLATE — where you are, and everything that hangs off it.
 *
 * Home’s Where You Are panel prints eleven figures about a city — a local
 * clock, a daylight span, a currency, a cost index, three tax rates, an
 * industry rating, a jobs figure, a language list and a country line — and
 * every one of them is a dead end today. They are all real. They come from the
 * gazetteer and the jurisdiction tables the simulation already runs on.
 *
 * The chain declared here is the gazetteer’s own chain rather than an invented
 * one: a city hangs beneath its region and a region beneath its country
 * because `parentId` says so, and `placeProfile` reads the live world every
 * time. The money hangs beneath the country that issues it. The light hangs
 * beneath the city it falls on — and at Reykjavík’s latitude that is not a
 * footnote, because the sun does polar things up there and a person standing
 * in it would say so.
 *
 * Where a figure is SLATE’s calibration rather than public record — a rent, a
 * cost index, an exchange rate, an industry rating — one provenance line at
 * the foot of the body says so, and that is the whole of it.
 */

import { CITIES, COUNTRIES, REGIONS, type City, type Country, type Region } from '@/engine/content/geography';
import { CLIMATE_NAMES, climateTypeFor, usesFahrenheit, usesMiles } from '@/engine/content/climate';
import { RATES_NOTE, currencyInfo, formatLocal, type CurrencyInfo, formatAtlasCompact} from '@/engine/content/currency';
import { languageNames } from '@/engine/content/languages';
import {
  PROPERTY_TAX_RULES, SALES_TAX_RULES, resolveIncomeTaxLayers, resolveRule,
} from '@/engine/content/tax';
import { formatDaylight, sunTimes, type SunTimes } from '@/engine/core/sun';
import { addDays, formatTime, zoneAbbreviation, zonedParts } from '@/engine/core/time';
import { plural, titleCaseLabel } from '@/engine/core/text';
import { formatPeople, homeCityOf, placeKindLabel, placeProfile, type PlaceProfile } from '@/engine/world/place';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { Open } from './Look';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, outOf, said, spokenList, toStart } from './words';

// ---------------------------------------------------------------------------
// Reading the world
// ---------------------------------------------------------------------------

/**
 * A gazetteer name, said the way a person says it.
 *
 * Five regions are written with a slash — Tunapuna/Piarco, Penal/Debe — and so
 * are two hundred and seventy-nine of the towns that arrive the moment a
 * country’s full list is loaded. Said aloud there is an "and" in the gap, so
 * that is what goes in the gap.
 *
 * Twenty-nine more of those towns are census tracts written Ct 0014, and a run
 * of four digits is an identifier rather than a name. So the number is read as
 * a number: the padding goes, and anything genuinely long gets the comma a
 * person would write it with.
 */
const spokenName = (name: string): string => name
  .replace(/\s*\/\s*/g, ' and ')
  .replace(/_+/g, ' ')
  .replace(/\d{4,}/g, (run) => Number(run).toLocaleString('en-US'));

/**
 * "the United States", "the Netherlands", "Iceland".
 *
 * English puts a "the" in front of a country whose name is a plural or a
 * description rather than a proper noun, and "you’re not in United States" is
 * the tell that a machine wrote the sentence.
 */
const THE_COUNTRY = /^(United|Democratic|Netherlands|Philippines|Bahamas|Gambia|Maldives|Comoros|Seychelles|Falkland|Cayman|Marshall|Solomon|Faroe|Cook)\b|(Islands|Republic|Emirates|Kingdom|States|Federation|Congo)$/;

const theCountry = (name: string): string => {
  // The gazetteer already writes one of them as "The Netherlands", and a
  // capital T in the middle of a sentence is the tell that nobody read it.
  if (/^The\s/.test(name)) return `the ${name.slice(4)}`;
  return THE_COUNTRY.test(name) ? `the ${name}` : name;
};

/** "a, b, c and 32 more", which is how a person reads a list that ran long. */
function spokenSome(names: readonly string[], shown: number): string {
  const named = names.slice(0, shown);
  const rest = names.length - named.length;
  return spokenList(rest > 0 ? [...named, `${rest.toLocaleString('en-US')} more`] : named);
}

const playerIn = (sim: Simulation): Person | undefined => sim.universe.people[sim.universe.playerId];

/** The city the player is standing in, falling back to the one they live in. */
function standingIn(sim: Simulation): City | undefined {
  const player = playerIn(sim);
  if (!player) return undefined;
  return CITIES.get(player.currentLocationId) ?? homeCityOf(sim);
}

/**
 * A city SLATE can profile.
 *
 * The jurisdiction resolver walks city, then region, then country, so a city
 * whose gazetteer row carries no region — a handful of territories do — has no
 * tax to read and no profile to build. Better to say nothing about such a
 * place than to open onto a throw.
 */
function profileFor(sim: Simulation, city: City | undefined): PlaceProfile | undefined {
  if (!city || !REGIONS.get(city.parentId)) return undefined;
  return placeProfile(sim, city.id);
}

const cityFor = (sim: Simulation, id: string): City | undefined =>
  (id ? CITIES.get(id) : standingIn(sim));

/**
 * Whether a city opens onto anything.
 *
 * Same condition `profileFor` resolves on: no region, no jurisdiction to read
 * taxes through, no profile. A name is never painted as a way in unless it is
 * one, so every way that names a town asks this first.
 */
const placeOpens = (city: City | undefined): boolean => !!city && !!REGIONS.get(city.parentId);

/** "2 hours ahead of home", "half an hour behind home", "on the same clock as home". */
function clockAgainstHome(hours: number): string {
  if (hours === 0) return 'on the same clock as home';
  const size = Math.abs(hours);
  // India, Nepal and Newfoundland all sit on a half hour, and "0.5 hours" is
  // not a thing anybody says out loud.
  const gap = size === 0.5 ? 'half an hour' : plural(size, 'hour');
  return `${gap} ${hours > 0 ? 'ahead of' : 'behind'} home`;
}

/** What the Daylight tile says, and what a way into the light says. */
function lightLine(sun: SunTimes, zone: string): string {
  if (sun.polar === 'day') return 'The sun never sets today';
  if (sun.polar === 'night') return 'No sunrise here today';
  if (sun.sunrise === undefined || sun.sunset === undefined) return 'No sunrise on file';
  return `${formatTime(sun.sunrise, zone)} to ${formatTime(sun.sunset, zone)}, ${formatDaylight(sun.daylightMinutes)} of it`;
}

/** What SLATE thinks a unit of this money is worth, said honestly. */
function rateLine(info: CurrencyInfo): string {
  if (info.code === 'USD') return 'What the ledger is kept in';
  if (info.unitsPerUsd === undefined) return 'No rate on file, so the ledger stays in dollars';
  return `About ${info.unitsPerUsd.toLocaleString('en-US')} to the dollar, by SLATE’s reckoning`;
}

// ---------------------------------------------------------------------------
// A city
// ---------------------------------------------------------------------------

defineLook<PlaceProfile>('place', {
  gone: 'There’s nowhere by that name on the map, or nothing SLATE knows well enough to tell you about.',
  resolve: (sim, id) => profileFor(sim, cityFor(sim, id)),
  seeds: (sim) => {
    const ids = [standingIn(sim)?.id, homeCityOf(sim)?.id];
    return [...new Set(ids.filter((id): id is string => !!id))];
  },
  look: (place, { sim }) => {
    const here = standingIn(sim);
    const isHere = here?.id === place.city.id;
    const isHome = place.homeCity?.id === place.city.id;
    const region = REGIONS.get(place.city.parentId);
    const climate = CLIMATE_NAMES[climateTypeFor(place.city)].toLowerCase();
    const label = placeKindLabel(place.city);
    const people = formatPeople(place.cityPopulation);
    const rent = place.localRent ?? formatAtlasCompact(place.medianRentCents);
    const layers = resolveIncomeTaxLayers(place.city.id, sim.now);
    // A state with no income tax still has a rule, so that the resolver has
    // something to say. It is not a layer that takes anything, and printing it
    // as one is how "Texas (No State Income Tax)" ends up in a list of what
    // the taxman takes.
    const taking = layers.filter((l) => l.kind !== 'none');
    const takesNone = layers.filter((l) => l.kind === 'none').map((l) => l.label.replace(/\s*\(.*\)$/, ''));
    const salesRule = resolveRule(SALES_TAX_RULES, place.city.id, sim.now);
    const propertyRule = resolveRule(PROPERTY_TAX_RULES, place.city.id, sim.now);

    const ways: Way[] = [];
    if (region) {
      const towns = CITIES.childrenOf(region.id).length;
      ways.push({
        to: at('region', region.id),
        label: spokenName(region.name),
        detail: `What ${theCountry(place.countryName)} calls this corner of itself, and ${said(towns, 'town')} of it on the map`,
      });
    }
    ways.push({
      to: at('country', place.countryId),
      label: place.countryName,
      detail: 'Languages, money, which side of the road, and the law over all of it',
    });
    ways.push({
      to: at('currency', place.currency.code),
      label: place.currency.name || place.currency.code,
      // Code first, then the symbol. A symbol is whatever the country writes —
      // kr, zł, ₫ — and half of them start lowercase, which is wrong at the
      // front of a line and not something to correct: it is their spelling.
      detail: `${place.currency.code}, written ${place.currency.symbol}, and what a hundred dollars turns into here`,
    });
    ways.push({
      to: at('daylight', place.city.id),
      label: 'Daylight',
      detail: lightLine(place.sun, place.zone),
    });
    if (place.away && place.homeCity && placeOpens(place.homeCity)) {
      ways.push({
        to: at('place', place.homeCity.id),
        label: spokenName(place.homeCity.name),
        // "back" only if you are standing here. Read from a third city, the
        // distance on file is this city’s distance from home, not yours.
        detail: isHere
          ? `Home, ${place.distanceFromHome} back, where it’s ${formatTime(sim.now, place.homeCity.timeZone)}`
          : `Where you actually live, and it’s ${formatTime(sim.now, place.homeCity.timeZone)} there`,
      });
    }

    return {
      name: spokenName(place.city.name),
      kind: isHome ? 'Where You Live' : isHere ? 'Where You Are' : 'A City On The Map',
      parent: region ? at('region', region.id) : at('country', place.countryId),
      summary: summaryOfPlace(place, isHere, isHome),
      body: (
        <>
          <p className="small muted">
            {label === 'Capital'
              ? `It’s the capital of ${theCountry(place.countryName)}, ${people} people live here, and the climate is ${climate}.`
              : label
                ? `It’s the ${label.toLowerCase()} of ${spokenName(region?.name ?? place.countryName)}, ${people} people live here, and the climate is ${climate}.`
                : `${people} people live here, in ${spokenName(region?.name ?? place.countryName)}, and the climate is ${climate}.`}
            {place.tags.length > 0 && ` What it’s known for: ${spokenList(place.tags).toLowerCase()}.`}
          </p>
          <p className="small muted">
            {place.medianRentCents > 0 && `Rent on a one-bedroom runs about ${rent} a month, `}
            {place.medianRentCents > 0
              ? `and the cost of living sits at ${place.costOfLivingIndex}, where a hundred is the American average.`
              : `The cost of living sits at ${place.costOfLivingIndex}, where a hundred is the American average.`}
            {layers.length === 0
              ? ` SLATE has no income tax table for ${theCountry(place.countryName)} yet, so the tile below says so rather than showing you a zero it can’t stand behind.`
              : taking.length === 0
                ? ` No income tax comes out of a wage here, at any level.`
                : ` Income tax comes in ${said(taking.length, 'layer')} here: ${spokenList(taking.map((l) => l.label))}${takesNone.length > 0 ? `, and ${spokenList(takesNone)} ${takesNone.length === 1 ? 'adds' : 'add'} nothing on top` : ''}.`}
          </p>
          <p className="small muted">{industryLine(place)}</p>
          {place.away && place.homeCity && (
            <p className="small muted">
              {isHere
                ? <>You’re {place.distanceFromHome} from home in{' '}
                  <Open subject={at('place', place.homeCity.id)}>{spokenName(place.homeCity.name)}</Open>,{' '}
                  {clockAgainstHome(place.hoursFromHome)}.</>
                : <>It’s {place.distanceFromHome} from home in{' '}
                  <Open subject={at('place', place.homeCity.id)}>{spokenName(place.homeCity.name)}</Open>, and{' '}
                  {clockAgainstHome(place.hoursFromHome)}.</>}
            </p>
          )}
          <div className="grid grid-3">
            <Stat label="Local Time" value={place.localTime} note={place.zoneAbbreviation} />
            <Stat
              label="Daylight"
              value={place.sun.polar === 'day' ? 'Midnight Sun' : place.sun.polar === 'night' ? 'Polar Night'
                : `${formatTime(place.sun.sunrise ?? sim.now, place.zone)} – ${formatTime(place.sun.sunset ?? sim.now, place.zone)}`}
              note={`${formatDaylight(place.sun.daylightMinutes)} of light`}
            />
            <Stat
              label="Currency"
              value={`${place.currency.symbol} ${place.currency.code}`}
              note={rateLine(place.currency)}
            />
            <Stat label="Cost Of Living" value={place.costOfLivingIndex} note="A hundred is the American average" />
            <Stat
              label="Tax On A Wage"
              value={layers.length > 0 ? `${Math.round(place.effectiveIncomeTax * 100)}%` : 'Not On File'}
              note={layers.length > 0 ? 'Income tax and payroll both, on a US$60,000 wage' : 'No table for this country yet'}
            />
            <Stat
              label="Sales Tax"
              value={salesRule ? `${(place.salesTax * 100).toFixed(1)}%` : 'Not On File'}
              note={propertyRule ? `Property ${(place.propertyTax * 100).toFixed(2)}%` : 'Property tax not on file either'}
            />
            <Stat label="Industry" value={`${place.industryPresence} out of 100`} note="Film and Television work here" />
            <Stat label="Jobs" value={`${place.jobMarketDepth} out of 100`} note="Ordinary work, outside the industry" />
            <Stat
              label="Languages"
              value={place.languages[0] ?? 'Not On File'}
              note={spokenList(place.languages.slice(1)) || 'Just the one, on the country’s own list'}
            />
          </div>
        </>
      ),
      ways,
      provenance: 'Where it sits, what the clock says and which country it answers to are public record. '
        + 'The rent, the cost index, the industry rating and the tax rates are SLATE’s own calibration.',
    };
  },
});

/** One sentence about standing here, or about not standing here. */
function summaryOfPlace(place: PlaceProfile, isHere: boolean, isHome: boolean): string {
  if (isHome && isHere) {
    return `You’re home, it’s ${place.localTime} on the clock you keep, and ${formatPeople(place.cityPopulation)} people are keeping it with you.`;
  }
  if (isHere && place.homeCity) {
    return `You’re here and not home — ${place.distanceFromHome} from ${spokenName(place.homeCity.name)}, ${clockAgainstHome(place.hoursFromHome)}, and it’s ${place.localTime} where you’re standing.`;
  }
  if (isHome) {
    return `Home, ${place.localTime} there right now, and you’re not in it today.`;
  }
  if (!place.homeCity || !place.distanceFromHome) {
    return `It’s ${place.localTime} there, and you’re not in it.`;
  }
  return `It’s ${place.localTime} there, ${place.distanceFromHome} from home, and you’re not in it.`;
}

/** What the two work ratings come to, side by side. */
function industryLine(place: PlaceProfile): string {
  return `Film and Television rate ${outOf(place.industryPresence)} here, against ${outOf(place.jobMarketDepth)} for ordinary work.`;
}

// ---------------------------------------------------------------------------
// The region above it
// ---------------------------------------------------------------------------

/** What a country calls its first-level pieces. The gazetteer knows the shape; this knows the word. */
const REGION_WORD: Record<string, string> = {
  us: 'State', au: 'State', br: 'State', mx: 'State', in: 'State', de: 'State', ng: 'State', my: 'State', at: 'State',
  ca: 'Province', cn: 'Province', za: 'Province', ar: 'Province', es: 'Province', kr: 'Province', ph: 'Province',
  id: 'Province', pk: 'Province', th: 'Province', pl: 'Province', nl: 'Province', be: 'Province',
  jp: 'Prefecture', ch: 'Canton', ie: 'County', uk: 'Nation',
};

const regionWord = (countryId: string): string => REGION_WORD[countryId] ?? 'Region';

/**
 * How many first-level pieces a country is cut into, said without the word.
 *
 * The gazetteer gives the United States fifty-one of them and Canada thirteen,
 * because the District of Columbia is not a state and Nunavut is not a
 * province. Counting them as states is a sentence that is wrong about the
 * world, so the count is of pieces and the word is kept for the one piece the
 * look is actually about.
 */
const pieces = (countryId: string): string => said(REGIONS.childrenOf(countryId).length, 'piece');

/**
 * A capital, said the way a name is said.
 *
 * The country table and the city table are two different GeoNames files and
 * they do not always agree on the accents — Reykjavik in one, Reykjavík in the
 * other — so the city’s own spelling wins where the gazetteer can find it. It
 * goes through the name gate either way, because a capital is a name.
 */
function capitalName(country: Country): string {
  const city = CITIES.byName(country.capital);
  return spokenName(city?.countryId === country.id ? city.name : country.capital);
}

defineLook<Region>('region', {
  gone: 'Somebody redrew the map, and it isn’t one of the pieces any more.',
  resolve: (sim, id) => REGIONS.get(id || standingIn(sim)?.parentId || ''),
  seeds: (sim) => {
    const ids = [standingIn(sim)?.parentId, homeCityOf(sim)?.parentId];
    return [...new Set(ids.filter((id): id is string => !!id && !!REGIONS.get(id)))];
  },
  look: (region, { sim }) => {
    const country = COUNTRIES.get(region.parentId);
    const countryName = country?.name ?? region.parentId.toUpperCase();
    const word = regionWord(region.parentId);
    const here = standingIn(sim);
    const inIt = here?.parentId === region.id;
    const towns = CITIES.childrenOf(region.id);
    const named = towns.map((c) => spokenName(c.name));
    const siblings = REGIONS.childrenOf(region.parentId).length;

    // Read from a town inside it, not from where the player happens to be:
    // California takes its own cut whether or not anybody is standing in it.
    const sample = inIt && here ? here : [...towns].sort((a, b) => b.population - a.population)[0];
    const layer = sample
      ? resolveIncomeTaxLayers(sample.id, sim.now).find((l) => l.jurisdictionCode === region.jurisdictionCode)
      : undefined;

    const ways: Way[] = [{
      to: at('country', region.parentId),
      label: countryName,
      // Only the one you came in through if you are actually in it. Read from
      // a state on the other side of the country, that is somebody else’s.
      detail: inIt
        ? `${toStart(pieces(region.parentId))} on the map, and this is the one you came in through`
        : `The country over it, and the ${siblings - 1} other pieces of it on the map`,
    }];
    for (const town of orderedTowns(towns, here?.id)) {
      ways.push({
        to: at('place', town.id),
        label: spokenName(town.name),
        detail: `${formatPeople(town.population)} people${placeKindLabel(town) ? `, and the ${placeKindLabel(town)!.toLowerCase()}` : ''}`,
      });
    }

    return {
      name: spokenName(region.name),
      kind: `The ${word}`,
      parent: at('country', region.parentId),
      summary: inIt && here
        ? `You’re inside it, in ${spokenName(here.name)}, one of the ${said(towns.length, 'place')} in it SLATE can name.`
        : towns.length > 0
          ? `Part of ${theCountry(countryName)}, with ${said(towns.length, 'place')} in it SLATE can name, and you’re in none of them today.`
          : `Part of ${theCountry(countryName)}, and not one of its towns is on your map yet.`,
      body: (
        <>
          <p className="small muted">
            {towns.length > 0
              ? `One of ${pieces(region.parentId)} the map cuts ${theCountry(countryName)} into, and the towns of it on your map are ${spokenSome(named, 6)}.`
              : `One of ${pieces(region.parentId)} the map cuts ${theCountry(countryName)} into, and none of its towns are on your map yet — SLATE loads a country’s full list the first time somebody goes looking in it.`}
          </p>
          {sample && (
            <p className="small muted">
              {layer && layer.kind !== 'none'
                ? `Tax isn’t only set nationally here: ${layer.label} lands on top of whatever the country already takes.`
                : `Income tax is set above this level — the ${word.toLowerCase()} adds none of its own.`}
            </p>
          )}
        </>
      ),
      ways,
      provenance: `The ${word.toLowerCase()} and everything in it come from the public gazetteer. Which of its towns SLATE has loaded depends on where you’ve been looking.`,
    };
  },
});

/** The town you are standing in first, then the biggest, capped at four. */
function orderedTowns(towns: readonly City[], hereId: string | undefined): City[] {
  const sorted = [...towns].sort((a, b) => b.population - a.population);
  const here = sorted.find((c) => c.id === hereId);
  const rest = sorted.filter((c) => c.id !== hereId);
  return (here ? [here, ...rest] : rest).slice(0, 4);
}

// ---------------------------------------------------------------------------
// The country above that
// ---------------------------------------------------------------------------

defineLook<Country>('country', {
  gone: 'There’s no country by that name to be in.',
  resolve: (sim, id) => COUNTRIES.get(id || standingIn(sim)?.countryId || ''),
  seeds: (sim) => {
    const ids = [standingIn(sim)?.countryId, homeCityOf(sim)?.countryId];
    return [...new Set(ids.filter((id): id is string => !!id))];
  },
  look: (country, { sim }) => {
    const here = standingIn(sim);
    const inIt = here?.countryId === country.id;
    const languages = languageNames(country.languages ?? '');
    const money = titleCaseLabel(country.currencyName || country.currency);
    const capital = CITIES.byName(country.capital);
    const capitalHere = capital?.countryId === country.id ? capital : undefined;
    const region = inIt && here ? REGIONS.get(here.parentId) : undefined;

    const ways: Way[] = [{
      to: at('currency', country.currency),
      label: money,
      detail: `What everything in ${theCountry(country.name)} is priced in`,
    }];
    if (region) {
      ways.push({
        to: at('region', region.id),
        label: spokenName(region.name),
        detail: `The ${regionWord(country.id).toLowerCase()} you’re standing in, one of ${pieces(country.id)} the map cuts it into`,
      });
    }
    if (capitalHere && capitalHere.id !== here?.id && placeOpens(capitalHere)) {
      ways.push({
        to: at('place', capitalHere.id),
        label: spokenName(capitalHere.name),
        detail: `The capital, ${formatPeople(capitalHere.population)} people`,
      });
    }

    return {
      name: country.name,
      kind: 'The Country',
      summary: inIt
        ? `You’re in ${theCountry(country.name)} today, ${formatPeople(country.population)} people are in it with you, and everything you buy is priced in ${money.toLowerCase()}.`
        : `${country.continent}, ${formatPeople(country.population)} people, and you’re not in it — you’re in ${here ? spokenName(here.name) : 'somewhere else'}.`,
      body: (
        <>
          <p className="small muted">
            {country.capital ? `The capital is ${capitalName(country)}, and the country ` : 'The country '}
            {`sits in ${country.continent}, with ${formatPeople(country.population)} people spread over `}
            {`${country.areaKm2.toLocaleString('en-US')} square kilometers of it.`}
          </p>
          <p className="small muted">
            {`They drive on the ${country.drivesOn}, measure distance in ${usesMiles(country.id) ? 'miles' : 'kilometers'} and read the temperature in ${usesFahrenheit(country.id) ? 'Fahrenheit' : 'Celsius'}.`}
            {languages.length > 0 && ` ${spokenList(languages)} ${isAre(languages.length)} spoken, in that order.`}
          </p>
          <div className="grid grid-3">
            <Stat label="Capital" value={country.capital ? capitalName(country) : 'Not On File'} note={country.continent} />
            <Stat label="People" value={formatPeople(country.population)} note={`${country.areaKm2.toLocaleString('en-US')} sq km`} />
            <Stat label="Money" value={`${currencyInfo(country.currency).symbol} ${country.currency}`} note={money} />
            <Stat label="Languages" value={languages[0] ?? 'Not On File'} note={spokenList(languages.slice(1)) || 'The only one listed'} />
            <Stat label="Calling Code" value={country.phone ? `+${country.phone.replace(/^\+/, '')}` : 'Not On File'} note="Dialed from outside" />
            <Stat label="Drives On" value={titleCaseLabel(country.drivesOn)} note={usesMiles(country.id) ? 'Miles on the signs' : 'Kilometers on the signs'} />
          </div>
        </>
      ),
      ways,
      provenance: 'Country facts are public reference data, as the gazetteer publishes them.',
    };
  },
});

// ---------------------------------------------------------------------------
// The money
// ---------------------------------------------------------------------------

interface TheMoney {
  info: CurrencyInfo;
  name: string;
  users: Country[];
  /** The country whose money this is, from where the player is standing. */
  home?: Country;
}

defineLook<TheMoney>('currency', {
  gone: 'Nobody prices anything in that any more.',
  resolve: (sim, id) => {
    const here = standingIn(sim);
    const country = COUNTRIES.get(here?.countryId ?? '');
    const code = (id || country?.currency || '').toUpperCase();
    if (!code) return undefined;
    const users = COUNTRIES.all().filter((c) => c.currency === code);
    if (users.length === 0) return undefined;
    const home = country?.currency === code ? country : undefined;
    const named = home?.currencyName || users.find((c) => c.currencyName)?.currencyName || code;
    return { info: currencyInfo(code), name: titleCaseLabel(named), users, home };
  },
  seeds: (sim) => {
    const codes = [
      COUNTRIES.get(standingIn(sim)?.countryId ?? '')?.currency,
      COUNTRIES.get(homeCityOf(sim)?.countryId ?? '')?.currency,
    ];
    return [...new Set(codes.filter((c): c is string => !!c))];
  },
  look: (money, { sim }) => {
    const here = standingIn(sim);
    const place = profileFor(sim, here);
    const hundred = formatLocal(100_00, money.info.code);
    const users = money.users.map((c) => c.name);

    const ways: Way[] = money.users
      .slice()
      .sort((a, b) => (a.id === money.home?.id ? -1 : b.id === money.home?.id ? 1 : b.population - a.population))
      .slice(0, 3)
      .map((c) => ({
        to: at('country', c.id),
        label: c.name,
        detail: `${formatPeople(c.population)} people, and ${c.capital ? capitalName(c) : 'no capital'} at the middle of it`,
      }));

    return {
      name: money.name,
      kind: 'The Money',
      parent: money.home ? at('country', money.home.id) : undefined,
      summary: money.home
        ? `You pay for things here in ${money.name.toLowerCase()}, written ${money.info.symbol}, and ${money.info.unitsPerUsd === undefined ? 'SLATE has no rate on file to turn it into dollars' : `SLATE puts it at about ${money.info.unitsPerUsd.toLocaleString('en-US')} to the dollar`}.`
        : `${spokenSome(users, 4)} ${users.length === 1 ? 'prices' : 'price'} everything in it, and you’re not standing ${users.length === 1 ? 'there' : 'in any of them'} today.`,
      body: (
        <>
          <p className="small muted">
            {money.info.code === 'USD'
              ? 'This is the unit the ledger itself is kept in, so nothing is converted into it or out of it.'
              : hundred
                ? `A hundred dollars is ${hundred} on the ground ${money.home ? 'here' : 'there'}.`
                : 'SLATE has no rate on file for it, so nothing is converted and the ledger stays in dollars.'}
            {money.info.decimals === 0
              ? ` There are no cents in it — the smallest thing you can hand over is one whole ${money.name.toLowerCase()}.`
              : ` It divides into hundredths, and prices are written to two of them.`}
            {money.info.symbolAfter
              ? ` The symbol goes after the number, the way ${money.info.symbol} is written on a receipt.`
              : ' The symbol goes in front of the number.'}
          </p>
          <p className="small muted">
            {`SLATE prices ${spokenSome(users, 4)} in it.`}
            {place && place.currency.code === money.info.code && place.localRent
              && ` A one-bedroom in ${spokenName(place.city.name)} is about ${place.localRent} a month in it.`}
          </p>
        </>
      ),
      ways,
      provenance: RATES_NOTE,
    };
  },
});

// ---------------------------------------------------------------------------
// The light
// ---------------------------------------------------------------------------

interface TheLight {
  city: City;
  today: SunTimes;
  tomorrow: SunTimes;
  midsummer: SunTimes;
  midwinter: SunTimes;
}

defineLook<TheLight>('daylight', {
  gone: 'Sunrise still happens. It just isn’t anywhere SLATE can name.',
  resolve: (sim, id) => {
    const city = cityFor(sim, id);
    if (!city) return undefined;
    const { latitude: lat, longitude: lon, timeZone: zone } = city;
    const year = zonedParts(sim.now, zone).year;
    return {
      city,
      today: sunTimes(sim.now, lat, lon, zone),
      tomorrow: sunTimes(addDays(sim.now, 1, zone), lat, lon, zone),
      midsummer: sunTimes(Date.UTC(year, lat >= 0 ? 5 : 11, 21, 12), lat, lon, zone),
      midwinter: sunTimes(Date.UTC(year, lat >= 0 ? 11 : 5, 21, 12), lat, lon, zone),
    };
  },
  seeds: (sim) => {
    const ids = [standingIn(sim)?.id, homeCityOf(sim)?.id];
    return [...new Set(ids.filter((id): id is string => !!id))];
  },
  look: (light, { sim }) => {
    const { city, today, tomorrow, midsummer, midwinter } = light;
    const swing = today.polar || tomorrow.polar
      ? 0
      : Math.round(tomorrow.daylightMinutes - today.daylightMinutes);
    const north = city.latitude >= 0;
    const degrees = Math.abs(Math.round(city.latitude));

    return {
      name: 'Daylight',
      kind: 'The Light Today',
      // The light falls on a city whether or not the tax tables can reach it,
      // so the parent is declared only where it would open.
      parent: placeOpens(city) ? at('place', city.id) : undefined,
      summary: today.polar === 'day'
        ? `The sun doesn’t go down here today — you get all twenty-four hours of it, and the difference between two in the afternoon and two in the morning is the color of the light.`
        : today.polar === 'night'
          ? `The sun doesn’t come up here today — you get a few hours of blue in the middle of it and that’s the whole day.`
          : `It’s light from ${formatTime(today.sunrise ?? 0, city.timeZone)} to ${formatTime(today.sunset ?? 0, city.timeZone)}, ${formatDaylight(today.daylightMinutes)} of it, and ${swingLine(swing)}.`,
      body: (
        <>
          <p className="small muted">
            {`${spokenName(city.name)} sits at ${degrees}° ${north ? 'north' : 'south'}, ${latitudeLine(city.latitude)}`}
          </p>
          <p className="small muted">{yearLine(midsummer, midwinter)}</p>
          <div className="grid grid-3">
            <Stat
              label="Sunrise"
              value={today.polar ? 'None Today' : formatTime(today.sunrise ?? 0, city.timeZone)}
              note={today.polar === 'day' ? 'It never got dark' : today.polar === 'night' ? 'It stays under the horizon' : 'Local clock'}
            />
            <Stat
              label="Sunset"
              value={today.polar ? 'None Today' : formatTime(today.sunset ?? 0, city.timeZone)}
              note={today.polar ? 'Nothing crosses the horizon' : 'Local clock'}
            />
            <Stat
              label="Length"
              value={today.polar === 'day' ? 'All Of It' : today.polar === 'night' ? 'None Of It' : formatDaylight(today.daylightMinutes)}
              note={swing === 0 ? 'Barely moving' : `${swing > 0 ? 'Gaining' : 'Losing'} ${plural(Math.abs(swing), 'minute')} a day`}
            />
            <Stat
              label="Longest Day"
              value={midsummer.polar === 'day' ? 'All Of It' : formatDaylight(midsummer.daylightMinutes)}
              note="Around the solstice in June or December, whichever is summer here"
            />
            <Stat
              label="Shortest Day"
              value={midwinter.polar === 'night' ? 'None Of It' : formatDaylight(midwinter.daylightMinutes)}
              note="The other solstice, six months from it"
            />
            <Stat label="Time Zone" value={zoneAbbreviation(sim.now, city.timeZone)} note="The clock everyone here keeps" />
          </div>
        </>
      ),
      provenance: 'Not a lookup — the tilt of the Earth, the day of the year and this latitude, worked out the way an almanac works it out. Good to a minute or two.',
    };
  },
});

/** How fast the day is growing or shrinking, in the words you would use. */
function swingLine(minutes: number): string {
  if (minutes === 0) return 'the length of the day is barely moving';
  const size = Math.abs(minutes);
  return `you’re ${minutes > 0 ? 'gaining' : 'losing'} about ${said(size, 'minute')} of it a day`;
}

/** What this latitude does to a year, said plainly. */
function latitudeLine(latitude: number): string {
  const size = Math.abs(latitude);
  const circle = latitude >= 0 ? 'Arctic Circle' : 'Antarctic Circle';
  if (size >= 66.5) return `inside the ${circle}, where the sun spends part of the year refusing to set and part of it refusing to rise.`;
  if (size >= 58) return `just short of the ${circle}, which is close enough that the year swings hard at both ends.`;
  if (size >= 45) return `far enough from the equator that winter afternoons end early and summer evenings go on.`;
  if (size >= 23.5) return `in the middle latitudes, where the day stretches and shrinks by a couple of hours either side of the year.`;
  return `close enough to the equator that the day is near enough twelve hours the whole year round.`;
}

/** The two ends of the year, from the same geometry. */
function yearLine(midsummer: SunTimes, midwinter: SunTimes): string {
  const long = midsummer.polar === 'day' ? 'the sun never sets at all' : `you get ${formatDaylight(midsummer.daylightMinutes)}`;
  const short = midwinter.polar === 'night' ? 'it never comes up' : `you get ${formatDaylight(midwinter.daylightMinutes)}`;
  return `On the longest day of the year ${long}; on the shortest, ${short}. That gap is the whole difference between living here and living somewhere flat.`;
}
