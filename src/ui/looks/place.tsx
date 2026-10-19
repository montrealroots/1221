/**
 * SLATE — where you are, and everything that hangs off it.
 *
 * Home’s Where You Are panel printed eleven figures about a city — a local
 * clock, a daylight span, a currency, a cost index, three tax rates, an
 * industry rating, a jobs figure, a language list and a country line — and
 * every one of them was a dead end. The rest are real, from the gazetteer and
 * the jurisdiction tables the simulation already runs on; the industry rating
 * and the jobs figure were SLATE’s calibration, read by nothing, and went on
 * 2026-09-27.
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
 * cost index, an exchange rate — one provenance line at
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
import { addDays, formatDurationWords, formatTime, MS_MINUTE, zoneAbbreviation, zonedParts } from '@/engine/core/time';
import { plural, titleCaseLabel } from '@/engine/core/text';
import { formatPeople, homeCityOf, placeKindLabel, placeProfile, type PlaceProfile } from '@/engine/world/place';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { Open } from './Look';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { rentAt } from '@/engine/content/rents';
import { isAre, said, spokenList } from './words';

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
  if (sun.polar === 'night') return 'The sun doesn’t rise here today';
  if (sun.sunrise === undefined || sun.sunset === undefined) return 'No sunrise on file';
  // In words in a sentence (from 2026-10-17): until then “12h 45m of daylight”, the Stat’s form below.
  return `${formatTime(sun.sunrise, zone)} to ${formatTime(sun.sunset, zone)}, ${formatDurationWords(sun.daylightMinutes * MS_MINUTE)} of daylight`;
}

/** What SLATE thinks a unit of this money is worth, said honestly. */
function rateLine(info: CurrencyInfo): string {
  if (info.code === 'USD') return 'The currency every exchange rate is quoted against';
  if (info.unitsPerUsd === undefined) return 'No exchange rate on file, so nothing is converted into it';
  return `About ${info.unitsPerUsd.toLocaleString('en-US')} to the US dollar, estimated`;
}

// ---------------------------------------------------------------------------
// A city
// ---------------------------------------------------------------------------

defineLook<PlaceProfile>('place', {
  gone: 'That place isn’t on the map, or the game has too little about it to show.',
  resolve: (sim, id) => profileFor(sim, cityFor(sim, id)),
  seeds: (sim) => {
    const ids = [standingIn(sim)?.id, homeCityOf(sim)?.id];
    return [...new Set(ids.filter((id): id is string => !!id))];
  },
  look: (place, { sim }) => {
    // Where the player stands is where they live (`homeCityOf`, since the scope of 2026-10-09 moved nobody), so a city
    // is theirs or another. Until 2026-10-13 the look told standing here from living here too, and had words for each
    // apart, “Where You Are”, “Home, … back”, “You’re … from home” and “you’re not in it today”, that no life reached.
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
        detail: `The part of ${theCountry(place.countryName)} it’s in, with ${said(towns, 'town')} on the map`,
      });
    }
    ways.push({
      to: at('country', place.countryId),
      label: place.countryName,
      detail: 'Its languages, its money and which side of the road they drive on',
    });
    ways.push({
      to: at('currency', place.currency.code),
      label: place.currency.name || place.currency.code,
      // Code first, then the symbol. A symbol is whatever the country writes —
      // kr, zł, ₫ — and half of them start lowercase, which is wrong at the
      // front of a line and not something to correct: it is their spelling.
      detail: `${place.currency.code}, written ${place.currency.symbol}, and what a hundred US dollars comes to here`,
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
        // Until 2026-10-13 a city the player stood in away from home said “Home, … back” here: none is.
        detail: `Where you actually live, and it’s ${formatTime(sim.now, place.homeCity.timeZone)} there`,
      });
    }

    return {
      name: spokenName(place.city.name),
      kind: isHome ? 'Where You Live' : 'A City On The Map',
      parent: region ? at('region', region.id) : at('country', place.countryId),
      summary: summaryOfPlace(place, isHome),
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
              ? `and the cost of living sits at ${place.costOfLivingIndex}, where a hundred is the United States’ price level.`
              : `The cost of living sits at ${place.costOfLivingIndex}, where a hundred is the United States’ price level.`}
            {(() => { const figure = rentAt(place.city.id, 'USD'); return figure.kind === 'published' ? ` The rent is published: ${figure.measure}, ${figure.period}; source: ${figure.source}.` : ''; })()}
            {layers.length === 0
              ? ` The game has no income tax table for ${theCountry(place.countryName)}, so Tax On A Wage says Not On File rather than zero.`
              : taking.length === 0
                ? ` No income tax comes out of a wage here, at any level.`
                : ` Income tax comes in ${said(taking.length, 'layer')} here: ${spokenList(taking.map((l) => l.label))}${takesNone.length > 0 ? `, and ${spokenList(takesNone)} ${takesNone.length === 1 ? 'adds' : 'add'} nothing on top` : ''}.`}
          </p>
          {/* Another city’s distance from the player’s. Until 2026-10-13 one they stood in said “You’re … from home in”:
              none is. */}
          {place.away && place.homeCity && (
            <p className="small muted">
              It’s {place.distanceFromHome} from home in{' '}
              <Open subject={at('place', place.homeCity.id)}>{spokenName(place.homeCity.name)}</Open>, and{' '}
              {clockAgainstHome(place.hoursFromHome)}.
            </p>
          )}
          <div className="grid grid-3">
            <Stat label="Local Time" value={place.localTime} note={place.zoneAbbreviation} />
            <Stat
              label="Daylight"
              value={place.sun.polar === 'day' ? 'Midnight Sun' : place.sun.polar === 'night' ? 'Polar Night'
                : `${formatTime(place.sun.sunrise ?? sim.now, place.zone)} – ${formatTime(place.sun.sunset ?? sim.now, place.zone)}`}
              note={`${formatDaylight(place.sun.daylightMinutes)} of daylight`}
            />
            <Stat
              label="Currency"
              value={`${place.currency.symbol} ${place.currency.code}`}
              note={rateLine(place.currency)}
            />
            <Stat label="Cost Of Living" value={place.costOfLivingIndex} note="A hundred is the United States’ price level" />
            <Stat
              label="Tax On A Wage"
              value={layers.length > 0 ? `${Math.round(place.effectiveIncomeTax * 100)}%` : 'Not On File'}
              note={layers.length > 0 ? 'Income tax and payroll both, on a US$60,000 wage' : 'No tax table for this country'}
            />
            <Stat
              label="Sales Tax"
              value={salesRule ? `${(place.salesTax * 100).toFixed(1)}%` : 'Not On File'}
              note={propertyRule ? `Property ${(place.propertyTax * 100).toFixed(2)}%` : 'Property tax not on file either'}
            />
            <Stat
              label="Languages"
              value={place.languages[0] ?? 'Not On File'}
              note={spokenList(place.languages.slice(1)) || 'The only one listed'}
            />
          </div>
        </>
      ),
      ways,
      provenance: 'Its location, time zone and country are public record. '
        + (rentAt(place.city.id, 'USD').kind === 'published'
          ? 'Its rent is published, and its cost of living and tax rates are estimated.'
          : rentAt(place.city.id, 'USD').kind === 'calibrated'
            ? 'Its rent is estimated, scaled to published rents, and its cost of living and tax rates are estimated.'
            : 'Its rent, cost of living and tax rates are estimated.'),
    };
  },
});

/**
 * One sentence about standing here, or about not standing here. Home is where the player stands (`homeCityOf`); until
 * 2026-10-13 this had a sentence for standing away from home, “You’re here and not home”, and one for home while away,
 * “you’re not in it today”, which no life reached.
 */
function summaryOfPlace(place: PlaceProfile, isHome: boolean): string {
  if (isHome) {
    return `This is where you live. It’s ${place.localTime}, and ${formatPeople(place.cityPopulation)} people live here.`;
  }
  if (!place.homeCity || !place.distanceFromHome) {
    return `It’s ${place.localTime} there. You live somewhere else.`;
  }
  return `It’s ${place.localTime} there, ${place.distanceFromHome} from home.`;
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
 * How many first-level parts a country is divided into, said without the word.
 *
 * The gazetteer gives the United States fifty-one of them and Canada thirteen,
 * because the District of Columbia is not a state and Nunavut is not a
 * province. Counting them as states is a sentence that is wrong about the
 * world, so the count is of parts and the word is kept for the one part the
 * look is actually about. They were "pieces" the map "cuts" a country into
 * until 2026-10-17 (brief 14).
 */
const pieces = (countryId: string): string => said(REGIONS.childrenOf(countryId).length, 'part');

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
  gone: 'That region isn’t on the map.',
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
        ? `The country it’s in, which the map divides into ${pieces(region.parentId)}, and you’re in this one`
        : `The country it’s in, which the map divides into ${pieces(region.parentId)}`,
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
        ? `You’re in it, in ${spokenName(here.name)}, ${towns.length === 1 ? 'its only place' : `one of its ${said(towns.length, 'place')}`} on the map.`
        : towns.length > 0
          ? `Part of ${theCountry(countryName)}, with ${said(towns.length, 'place')} on the map. You’re in none of them.`
          : `Part of ${theCountry(countryName)}, and none of its towns are on your map yet.`,
      body: (
        <>
          <p className="small muted">
            {towns.length > 0
              ? `It’s one of the ${pieces(region.parentId)} the map divides ${theCountry(countryName)} into. ${named.length === 1 ? `Its one town on your map is ${named[0]}` : `Its towns on your map are ${spokenSome(named, 6)}`}.`
              : `It’s one of the ${pieces(region.parentId)} the map divides ${theCountry(countryName)} into. A country’s towns show up once your life has a place in it.`}
          </p>
          {sample && (
            <p className="small muted">
              {layer && layer.kind !== 'none'
                ? `Income tax here isn’t only the country’s: ${layer.label} is added on top of it.`
                : `The ${word.toLowerCase()} adds no income tax of its own.`}
            </p>
          )}
        </>
      ),
      ways,
      provenance: `The ${word.toLowerCase()} and its towns come from a public gazetteer. A country’s towns show up once your life has a place in it.`,
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
  gone: 'That country isn’t on the map.',
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
        detail: `The ${regionWord(country.id).toLowerCase()} you’re in, one of its ${pieces(country.id)}`,
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
        ? `You’re in ${theCountry(country.name)}, a country of ${formatPeople(country.population)} people, and its money is the ${money.toLowerCase()}.`
        : `A country in ${country.continent}, with ${formatPeople(country.population)} people. You’re in ${here ? spokenName(here.name) : 'another country'}.`,
      body: (
        <>
          <p className="small muted">
            {country.capital ? `The capital is ${capitalName(country)}. ` : ''}
            {`The country is in ${country.continent}, with ${formatPeople(country.population)} people across `}
            {`${country.areaKm2.toLocaleString('en-US')} square kilometers.`}
          </p>
          <p className="small muted">
            {`They drive on the ${country.drivesOn}, measure distance in ${usesMiles(country.id) ? 'miles' : 'kilometers'} and read the temperature in ${usesFahrenheit(country.id) ? 'Fahrenheit' : 'Celsius'}.`}
            {languages.length > 0 && ` ${spokenList(languages)} ${isAre(languages.length)} spoken${languages.length > 1 ? ', in the order the country lists them' : ''}.`}
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
      provenance: 'These facts come from a public gazetteer.',
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
  gone: 'No country on the map uses that currency.',
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
    const users = money.users.map((c) => c.name.trim());

    const ways: Way[] = money.users
      .slice()
      .sort((a, b) => (a.id === money.home?.id ? -1 : b.id === money.home?.id ? 1 : b.population - a.population))
      .slice(0, 3)
      .map((c) => ({
        to: at('country', c.id),
        label: c.name,
        detail: c.population > 0
          ? `${formatPeople(c.population)} people${c.capital ? `, with its capital at ${capitalName(c)}` : ''}`
          : 'Nobody lives there',
      }));

    return {
      name: money.name,
      kind: 'The Money',
      parent: money.home ? at('country', money.home.id) : undefined,
      summary: money.home
        ? `The ${money.name.toLowerCase()} is the money here, written ${money.info.symbol}. ${money.info.code === 'USD' ? 'Every exchange rate is quoted against it.' : money.info.unitsPerUsd === undefined ? 'The game has no exchange rate for it.' : `It’s about ${money.info.unitsPerUsd.toLocaleString('en-US')} to the US dollar, estimated.`}`
        : `The money of ${spokenSome(users, 4)}. You’re not in ${users.length === 1 ? 'it' : 'any of them'}.`,
      body: (
        <>
          <p className="small muted">
            {money.info.code === 'USD'
              ? 'Every exchange rate in the game is quoted against the US dollar, so every conversion goes through it.'
              : hundred
                ? `A hundred US dollars is ${hundred} ${money.home ? 'here' : 'there'}.`
                : 'The game has no exchange rate for it, so nothing is converted into it, and a life started here keeps its money in euros.'}
            {money.info.decimals === 0
              ? ' It has no smaller unit, so prices in it are whole numbers.'
              : ' Prices in it are written to two decimal places.'}
            {money.info.symbolAfter
              ? ' Its symbol goes after the number.'
              : ' Its symbol goes before the number.'}
          </p>
          <p className="small muted">
            {`It’s used in ${spokenSome(users, 4)}.`}
            {place && place.currency.code === money.info.code && place.localRent
              && ` A one-bedroom in ${spokenName(place.city.name)} is about ${place.localRent} a month.`}
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
  gone: 'That place isn’t on the map, so its daylight can’t be shown.',
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
        ? 'The sun doesn’t set here today, so it’s light all day and all night.'
        : today.polar === 'night'
          ? 'The sun doesn’t rise here today.'
          : `Daylight runs from ${formatTime(today.sunrise ?? 0, city.timeZone)} to ${formatTime(today.sunset ?? 0, city.timeZone)} today, ${formatDurationWords(today.daylightMinutes * MS_MINUTE)}, and ${swingLine(swing)}.`,
      body: (
        <>
          <p className="small muted">
            {`${spokenName(city.name)} is at ${degrees}° ${north ? 'north' : 'south'}, ${latitudeLine(city.latitude)}`}
          </p>
          <p className="small muted">{yearLine(midsummer, midwinter)}</p>
          <div className="grid grid-3">
            <Stat
              label="Sunrise"
              value={today.polar ? 'None Today' : formatTime(today.sunrise ?? 0, city.timeZone)}
              note={today.polar === 'day' ? 'It doesn’t get dark' : today.polar === 'night' ? 'It stays below the horizon' : 'Local time'}
            />
            <Stat
              label="Sunset"
              value={today.polar ? 'None Today' : formatTime(today.sunset ?? 0, city.timeZone)}
              note={today.polar ? 'The sun doesn’t cross the horizon' : 'Local time'}
            />
            <Stat
              label="Length"
              value={today.polar === 'day' ? 'All Of It' : today.polar === 'night' ? 'None Of It' : formatDaylight(today.daylightMinutes)}
              note={swing === 0 ? 'Barely changing' : `${swing > 0 ? 'Gaining' : 'Losing'} ${plural(Math.abs(swing), 'minute')} a day`}
            />
            <Stat
              label="Longest Day"
              value={midsummer.polar === 'day' ? 'All Of It' : formatDaylight(midsummer.daylightMinutes)}
              note={north ? 'At the June solstice' : 'At the December solstice'}
            />
            <Stat
              label="Shortest Day"
              value={midwinter.polar === 'night' ? 'None Of It' : formatDaylight(midwinter.daylightMinutes)}
              note={north ? 'At the December solstice' : 'At the June solstice'}
            />
            <Stat label="Time Zone" value={zoneAbbreviation(sim.now, city.timeZone)} note="The local time zone" />
          </div>
        </>
      ),
      provenance: 'Calculated from the Earth’s tilt, the day of the year and this latitude, as an almanac does, and good to a minute or two.',
    };
  },
});

/** How fast the day is growing or shrinking, in the words you would use. */
function swingLine(minutes: number): string {
  if (minutes === 0) return 'the days are barely changing in length';
  const size = Math.abs(minutes);
  return `the days are getting about ${said(size, 'minute')} ${minutes > 0 ? 'longer' : 'shorter'} each day`;
}

/** What this latitude does to a year, said plainly. */
function latitudeLine(latitude: number): string {
  const size = Math.abs(latitude);
  const circle = latitude >= 0 ? 'Arctic Circle' : 'Antarctic Circle';
  if (size >= 66.5) return `inside the ${circle}, where for part of the year the sun doesn’t set, and for part of it, it doesn’t rise.`;
  if (size >= 58) return `just short of the ${circle}, so the days are very long in summer and very short in winter.`;
  if (size >= 45) return 'far enough from the equator that winter afternoons end early and summer evenings run late.';
  if (size >= 23.5) return 'in the middle latitudes, where the length of the day changes by a few hours over the year.';
  return 'close enough to the equator that the day is about twelve hours long all year.';
}

/** The two ends of the year, from the same geometry. */
function yearLine(midsummer: SunTimes, midwinter: SunTimes): string {
  const long = midsummer.polar === 'day' ? 'the sun doesn’t set at all' : `there’s ${formatDaylight(midsummer.daylightMinutes)} of daylight`;
  const short = midwinter.polar === 'night' ? 'it doesn’t rise at all' : `there’s ${formatDaylight(midwinter.daylightMinutes)}`;
  return `On the longest day of the year ${long}, and on the shortest, ${short}.`;
}
