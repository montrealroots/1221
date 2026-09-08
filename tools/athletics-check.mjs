/**
 * The track holds up.
 *
 * Half of this is real and is measured like real data: every event at its real
 * distance, every world record with a holder and a year and inside the range a
 * human being can actually run, every named meet in a real town in a country
 * the geography has and in the month it is really held, and every entry
 * standard slower than the world record and faster than a club runner.
 *
 * The other half is SLATE's own and is measured for being honest about it: a
 * ladder that is a ladder, a season that runs the rungs a country really runs,
 * a field nobody real is in, and a time that has to be earned rather than
 * handed over with a skill sheet.
 */

import {
  ATHLETICS_NOTE, CATEGORY_NOTE, CONTRACT_BANDS, CONTRACT_NOTE, ENDS, ENTRY_STANDARDS, EVENTS,
  EVENT_BY_ID, GENERAL_SCHOOL_WORDS, LEVELS, MEETS_NOTE, NAMED_MEETS, OPPONENT_FIRST, PRIME_NOTE,
  PRIME_TO, PRIZE_NOTE, PRO_NOTE, PURSES, RECORDS_NOTE, RIVAL_FIRST, RIVAL_LAST,
  SCHOOL_TRACK_COUNTRIES, SCHOOL_WORDS, SEASON_LADDERS, SELECTION_NOTE, SHOE_BRANDS,
  STANDARDS_NOTE, TIER_LABEL, TIER_WEIGHT, TRACK_FROM_AGE, WIND_LIMIT, WIND_NOTE, WORLD_RECORDS,
  bandFor, endsFor, eventsFor, heldIn, ladderFor, ladderIsCountrys, levelOf, primeAt, prizeFor,
  qualityOf, ratioAt, recordFor, roundsAt, schoolWords, schoolsRunTrack, standardFor, timeAt,
  timeForLevel, windLegal,
} from '../src/engine/content/athletics.ts';
import { CITIES, COUNTRIES } from '../src/engine/content/geography.ts';
import { SKILLS } from '../src/engine/domain/skills.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  abilityFor, bestEventsFor, formatSeconds, nextMeet, runningOf, seasonOf,
} from '../src/engine/systems/athletics.ts';

const problems = [];
const known = new Set(COUNTRIES.all().map((one) => one.id));

// --- The events, which are real -------------------------------------------

const seenEvents = new Set();
for (const event of EVENTS) {
  if (seenEvents.has(event.id)) problems.push(`${event.id} is listed twice`);
  seenEvents.add(event.id);
  if (event.metres < 60 || event.metres > 1600) problems.push(`${event.label} is ${event.metres} meters`);
  if (event.surfaces.length === 0) problems.push(`${event.label} is run nowhere`);
  if (event.about.length < 20) problems.push(`${event.label} has nothing said about it`);
  // The weights are a share of one thing, so they add up to one.
  const total = Object.values(event.weights).reduce((sum, one) => sum + one, 0);
  if (Math.abs(total - 1) > 0.001) problems.push(`${event.label} is decided by ${total.toFixed(3)} of a runner`);
  // And every one of them is a skill somebody can actually hold.
  const skillIds = new Set(SKILLS.map((one) => one.id));
  for (const key of Object.keys(event.weights)) {
    if (!skillIds.has(key)) problems.push(`${event.label} is decided by "${key}", which is not a skill`);
  }
}
// The hurdles are the one place the two categories run different events.
if (EVENT_BY_ID['110mh']?.category !== 'mens') problems.push('the high hurdles are not carried as a men’s event');
if (EVENT_BY_ID['100mh']?.category !== 'womens') problems.push('the women’s hurdles are not carried as one');
for (const category of ['mens', 'womens']) {
  const open = eventsFor(category);
  if (open.length < 8) problems.push(`${category} has only ${open.length} events`);
  const wrong = open.find((one) => one.category && one.category !== category);
  if (wrong) problems.push(`${wrong.label} is offered to ${category}`);
}
// Only an outdoor sprint reads the wind, because that is the rule.
for (const event of EVENTS) {
  if (event.windRead && !event.surfaces.includes('outdoor')) {
    problems.push(`${event.label} reads the wind indoors`);
  }
}
if (WIND_LIMIT !== 2.0) problems.push(`the wind limit is ${WIND_LIMIT}`);
if (windLegal('100m', 2.1)) problems.push('a mark with 2.1 behind it stands');
if (!windLegal('100m', 2.0)) problems.push('a mark with exactly the limit behind it does not stand');
if (!windLegal('400m', 5)) problems.push('the four hundred reads a wind gauge');

// --- The records, which are real ------------------------------------------

const seenRecords = new Set();
for (const record of WORLD_RECORDS) {
  const key = `${record.eventId}:${record.category}:${record.surface}`;
  if (seenRecords.has(key)) problems.push(`${key} has two world records`);
  seenRecords.add(key);
  const event = EVENT_BY_ID[record.eventId];
  if (!event) { problems.push(`${record.eventId} has a record and is not an event`); continue; }
  if (!event.surfaces.includes(record.surface)) problems.push(`${event.label} has a ${record.surface} record and is not run ${record.surface}s`);
  if (event.category && event.category !== record.category) problems.push(`${event.label} has a ${record.category} record`);
  if (record.holder.length < 3) problems.push(`${key} has no holder`);
  if (record.place.length < 3) problems.push(`${key} was set nowhere`);
  if (record.year < 1912 || record.year > 2026) problems.push(`${key} was set in ${record.year}`);
  // Nobody has run a hundred meters in eight seconds, and nobody has run one in twenty.
  const perSecond = event.metres / record.seconds;
  if (perSecond < 6 || perSecond > 12.5) problems.push(`${key} is ${perSecond.toFixed(1)} meters a second`);
}
if (WORLD_RECORDS.length < 16) problems.push(`only ${WORLD_RECORDS.length} world records`);
if (recordFor('100m', 'mens', 'outdoor')?.holder !== 'Usain Bolt') problems.push('the hundred meter record has moved');
if (!/real/.test(RECORDS_NOTE) || !/after that is not in here/.test(RECORDS_NOTE)) {
  problems.push('the note saying the records are as SLATE carries them has gone');
}

// --- The two ends of every event -------------------------------------------

for (const category of ['mens', 'womens']) {
  for (const event of eventsFor(category)) {
    const both = endsFor(event.id, category);
    if (!both) { problems.push(`${event.label} has no ${category} ends`); continue; }
    if (both.firstDay <= both.best) problems.push(`${event.label}: a first day is quicker than the world record`);
    const record = recordFor(event.id, category);
    if (record && Math.abs(record.seconds - both.best) > 0.001) {
      problems.push(`${event.label}: the fast end is ${both.best} and the record is ${record.seconds}`);
    }
    // A first day is slower than a world record but not absurdly so.
    if (both.firstDay / both.best > 1.7) problems.push(`${event.label}: a first day is ${(both.firstDay / both.best).toFixed(2)} times the record`);
  }
}

// --- The ladder, which is SLATE's own --------------------------------------

let last = 99;
for (const level of LEVELS) {
  if (level.ratio >= last) problems.push(`the ladder is out of order at ${level.label}`);
  last = level.ratio;
  if (level.about.length < 15) problems.push(`${level.label} has nothing said about it`);
  if (level.womens < level.ratio) problems.push(`${level.label} is harder for women than for men`);
}
if (LEVELS[LEVELS.length - 1].ratio <= 1) problems.push('world class is faster than the world record');
// A world record is world class and a first day is not.
if (levelOf(9.58, '100m', 'mens').id !== 'world') problems.push('the world record is not world class');
if (levelOf(13.8, '100m', 'mens').id !== 'first_day') problems.push('a first day is not a first day');
// The line reads the same both ways.
for (const seconds of [9.9, 10.4, 11.2, 12.5]) {
  const back = timeAt(qualityOf(seconds, '100m', 'mens'), '100m', 'mens');
  if (Math.abs(back - seconds) > 0.02) problems.push(`${seconds} reads back as ${back}`);
}
// And the ladder means something in every event.
for (const category of ['mens', 'womens']) {
  for (const event of eventsFor(category)) {
    const at = timeForLevel('world', event.id, category);
    const team = timeForLevel('team', event.id, category);
    if (at === undefined || team === undefined) { problems.push(`${event.label} has no ladder`); continue; }
    if (team <= at) problems.push(`${event.label}: a school team is quicker than world class`);
  }
}
for (const level of LEVELS) {
  if (ratioAt(level, 'womens') !== level.womens) problems.push(`${level.label} does not read its own women's ratio`);
}

// --- The standards, which are real ------------------------------------------

for (const [eventId, byCategory] of Object.entries(ENTRY_STANDARDS)) {
  if (!EVENT_BY_ID[eventId]) problems.push(`${eventId} has a standard and is not an event`);
  for (const [category, seconds] of Object.entries(byCategory)) {
    if (seconds === 0) continue;
    const record = recordFor(eventId, category, 'outdoor');
    if (record && seconds <= record.seconds) problems.push(`the ${category} ${eventId} standard is faster than the record`);
    // A standard is a hard time, not an impossible one and not a club time.
    if (record && seconds / record.seconds > 1.15) problems.push(`the ${category} ${eventId} standard is soft`);
    if (levelOf(seconds, eventId, category).id !== 'world' && levelOf(seconds, eventId, category).id !== 'national') {
      problems.push(`the ${category} ${eventId} standard is only ${levelOf(seconds, eventId, category).label}`);
    }
  }
}
if (standardFor('110mh', 'womens') !== undefined) problems.push('the high hurdles have a women’s standard');
if (!/World Athletics/.test(STANDARDS_NOTE)) problems.push('the note about the standards has gone');

// --- The meets, which are real ----------------------------------------------

const seenMeets = new Set();
const seenNames = new Set();
for (const meet of NAMED_MEETS) {
  if (seenMeets.has(meet.id)) problems.push(`${meet.id} is listed twice`);
  seenMeets.add(meet.id);
  if (seenNames.has(meet.name)) problems.push(`${meet.name} is listed twice`);
  seenNames.add(meet.name);
  if (!known.has(meet.countryId)) problems.push(`${meet.name} is in ${meet.countryId}, which is not a country`);
  if (meet.cityId && !CITIES.get(meet.cityId)) problems.push(`${meet.name} is in ${meet.cityId}, which is not a city`);
  if (meet.cityId && CITIES.get(meet.cityId)?.countryId !== meet.countryId && !meet.rotates) {
    problems.push(`${meet.name} is in ${meet.countryId} and its city is not`);
  }
  if (meet.month < 1 || meet.month > 12) problems.push(`${meet.name} is held in month ${meet.month}`);
  if (meet.town.length < 4) problems.push(`${meet.name} is held nowhere`);
  if (meet.stages.length === 0) problems.push(`${meet.name} is for nobody`);
  if (meet.about.length < 20) problems.push(`${meet.name} has nothing said about it`);
  if (!TIER_LABEL[meet.tier]) problems.push(`${meet.name} is a "${meet.tier}", which is not a tier`);
  // An indoor meet is not held in July and an outdoor championship is not in January.
  if (meet.surface === 'indoor' && ![12, 1, 2, 3].includes(meet.month)) {
    problems.push(`${meet.name} is indoors in month ${meet.month}`);
  }
}
if (NAMED_MEETS.length < 50) problems.push(`only ${NAMED_MEETS.length} real meets`);
// The ones everybody has heard of are in there.
for (const id of ['penn_relays', 'champs', 'prefontaine', 'weltklasse', 'world_champs', 'olympics', 'ncaa_outdoor', 'english_schools']) {
  if (!NAMED_MEETS.some((one) => one.id === id)) problems.push(`${id} is not carried`);
}
if (!/real meet in a real town/.test(MEETS_NOTE)) problems.push('the note about the meets has gone');

// --- The seasons -------------------------------------------------------------

for (const ladder of SEASON_LADDERS) {
  for (const countryId of ladder.countryIds) {
    if (!known.has(countryId)) problems.push(`a ${ladder.stage} season is run in ${countryId}, which is not a country`);
  }
  if (ladder.rungs.length < 2) problems.push(`the ${ladder.stage} ${ladder.surface} season is ${ladder.rungs.length} rung`);
  if (ladder.months.length === 0) problems.push(`the ${ladder.stage} ${ladder.surface} season is in no month`);
  if (ladder.about.length < 25) problems.push(`the ${ladder.stage} ${ladder.surface} season has nothing said about it`);
  let meets = 0;
  const tiers = new Set();
  for (const rung of ladder.rungs) {
    if (!TIER_LABEL[rung.tier]) problems.push(`a season runs a "${rung.tier}", which is not a tier`);
    if (tiers.has(rung.tier)) problems.push(`the ${ladder.stage} season runs ${rung.tier} twice`);
    tiers.add(rung.tier);
    if (rung.count < 1) problems.push(`${rung.tier} appears ${rung.count} times`);
    if (rung.daysAfter < 3) problems.push(`${rung.tier} is ${rung.daysAfter} days after the one before it`);
    meets += rung.count;
  }
  // A season opens on its easiest meet and nobody has to qualify for that one.
  const opening = ladder.rungs[0];
  if (opening.qualifyBy !== undefined) problems.push(`the ${ladder.stage} season makes you qualify for its first meet`);
  const weights = ladder.rungs.map((one) => TIER_WEIGHT[one.tier]);
  if (Math.min(...weights) !== weights[0]) problems.push(`the ${ladder.stage} ${ladder.surface} season does not open on its easiest meet`);
  if (Math.max(...weights) === weights[0]) problems.push(`the ${ladder.stage} ${ladder.surface} season opens on its hardest meet`);
  // Anything you have to qualify for comes after something to qualify at.
  for (let i = 0; i < ladder.rungs.length; i++) {
    if (ladder.rungs[i].qualifyBy !== undefined && i === 0) {
      problems.push(`the ${ladder.stage} season has nothing to qualify at`);
    }
  }
  if (meets < 3 || meets > 20) problems.push(`the ${ladder.stage} ${ladder.surface} season is ${meets} meets`);
}
// An American school runs two seasons and Britain runs one.
if (!ladderIsCountrys('school', 'indoor', 'us')) problems.push('an American school runs no indoor season');
if (ladderIsCountrys('school', 'indoor', 'uk')) problems.push('a British school runs an indoor season');
if (!ladderFor('school', 'outdoor', 'mn')) problems.push('a country with no season of its own gets no general one');
// The rounds are what a championship really runs.
if (roundsAt('dual', '100m').length !== 1) problems.push('a dual meet runs heats');
if (roundsAt('global', '100m').length !== 3) problems.push('a world championship hundred is not three rounds');
if (roundsAt('global', '4x100m').length !== 1) problems.push('a relay runs semi finals');

// --- Everybody else in the lane is SLATE's own -------------------------------

if (RIVAL_FIRST.length < 30 || RIVAL_LAST.length < 25) problems.push('there are not enough invented rivals');
const holders = new Set(WORLD_RECORDS.map((one) => one.holder.toLowerCase()));
for (const first of RIVAL_FIRST) {
  for (const last of RIVAL_LAST) {
    if (holders.has(`${first} ${last}`.toLowerCase())) problems.push(`${first} ${last} is a real record holder`);
  }
}
if (!/SLATE/.test(ATHLETICS_NOTE) || !/no results feed/.test(ATHLETICS_NOTE)) {
  problems.push('the note saying which half of the track is real has gone');
}
if (!/own choice/.test(CATEGORY_NOTE)) problems.push('the note about the two categories has gone');
if (!/two meters a second/.test(WIND_NOTE)) problems.push('the note about the wind has gone');
// The school across town is called what that country calls a school.
const seenCountry = new Set();
for (const group of SCHOOL_WORDS) {
  for (const countryId of group.countryIds) {
    if (!known.has(countryId)) problems.push(`${countryId} has school words and is not a country`);
    if (seenCountry.has(countryId)) problems.push(`${countryId} is given two sets of school words`);
    seenCountry.add(countryId);
  }
}
if (schoolWords('us').some((one) => /Grammar|Comprehensive/.test(one))) {
  problems.push('an American school runs against comprehensives');
}
if (!schoolWords('de').includes('Gymnasium')) problems.push('a German school runs against no Gymnasium');
if (schoolWords('mn') !== GENERAL_SCHOOL_WORDS) problems.push('a country with no words of its own gets none');
if (OPPONENT_FIRST.length < 20) problems.push('there are not enough schools across town');
for (const countryId of SCHOOL_TRACK_COUNTRIES) {
  if (!known.has(countryId)) problems.push(`${countryId} runs school track and is not a country`);
}
if (!schoolsRunTrack('us') || !schoolsRunTrack('jm')) problems.push('America or Jamaica does not run school track');
if (schoolsRunTrack('mc')) problems.push('Monaco runs school track');

// --- A time has to be earned --------------------------------------------------

{
  // The same character, twelve years old and twenty two, on the same sheet.
  const child = quickSave(
    { birthYear: 2014, startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles' }, 'track-child',
  );
  const adult = quickSave(
    { birthYear: 2002, startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles' }, 'track-adult',
  );
  const young = abilityFor(child, child.player, '100m');
  const grown = abilityFor(adult, adult.player, '100m');
  if (young >= grown) problems.push(`a twelve year old is as able as a grown one (${young} against ${grown})`);
  if (young < 5) problems.push('a twelve year old has no ability at all');

  // Nobody arrives at the track with a season's work already in their legs.
  const joined = adult.execute({ kind: 'track.join', payload: {} });
  if (joined.ok && joined.value.onTheTeam) {
    const running = runningOf(adult);
    if (!running) problems.push('making the team wrote no running record');
    else {
      if (running.form > 30) problems.push(`somebody turns up with ${running.form} form`);
      if (running.eventIds.length === 0) problems.push('nobody entered them in anything');
      const season = seasonOf(adult);
      if (!season) problems.push('making the team started no season');
      else {
        if (season.meets.length < 3) problems.push(`a season is ${season.meets.length} meets`);
        const first = nextMeet(season);
        if (!first) problems.push('a season has no first meet');
        // The schedule moves forward and never twice on the same day.
        let previous = 0;
        for (const meet of season.meets) {
          if (meet.at <= previous) problems.push('two meets on the same day');
          previous = meet.at;
          if (!meet.name || meet.name.length < 4) problems.push('a meet with no name');
        }
        // Racing before the day is refused.
        const early = adult.execute({ kind: 'track.race', payload: {} });
        if (early.ok) problems.push('a meet can be run before it is held');
      }
    }
  }
  // And the events a coach enters somebody in are the ones they are best at.
  const best = bestEventsFor(adult, adult.player, runningOf(adult) ?? { category: 'mens', eventIds: [] }, 'outdoor');
  if (best.length === 0) problems.push('nobody is best at anything');
}

// --- Turning professional -----------------------------------------------------

// A championship that is not annual falls in the years it really falls in.
{
  const worlds = NAMED_MEETS.find((one) => one.id === 'world_champs');
  const games = NAMED_MEETS.find((one) => one.id === 'olympics');
  if (worlds && (!heldIn(worlds, 2025) || heldIn(worlds, 2026))) problems.push('the world championships are in the wrong years');
  if (games && (!heldIn(games, 2028) || heldIn(games, 2027))) problems.push('the Games are in the wrong years');
  for (const meet of NAMED_MEETS) {
    if (meet.everyYears && meet.firstYear === undefined) problems.push(`${meet.name} has a cycle and no year to count from`);
    if (!meet.everyYears && meet.firstYear !== undefined) problems.push(`${meet.name} has a year to count from and no cycle`);
    if (meet.eventIds) {
      for (const id of meet.eventIds) {
        if (!EVENT_BY_ID[id]) problems.push(`${meet.name} contests "${id}", which is not an event`);
      }
    }
  }
}

// A sprinter is quickest in their prime and slower after it.
if (primeAt(24) !== 1) problems.push('a twenty four year old is not at their best');
if (primeAt(PRIME_TO) !== 1) problems.push('the prime does not run to the end of itself');
if (primeAt(34) >= primeAt(29)) problems.push('a thirty four year old is as quick as a twenty nine year old');
if (primeAt(45) < 0.5) problems.push('a forty five year old has nothing left at all');
if (!/calibration/.test(PRIME_NOTE)) problems.push('the note about the prime has gone');

// The money.
const seenPurse = new Set();
for (const purse of PURSES) {
  if (seenPurse.has(purse.tier)) problems.push(`${purse.tier} has two purses`);
  seenPurse.add(purse.tier);
  if (!TIER_LABEL[purse.tier]) problems.push(`${purse.tier} pays out and is not a tier`);
  if (purse.places.length !== 8) problems.push(`${purse.tier} pays ${purse.places.length} places`);
  let last = Infinity;
  for (const amount of purse.places) {
    if (amount > last) problems.push(`${purse.tier} pays more for finishing lower`);
    last = amount;
    if (amount < 0) problems.push(`${purse.tier} charges you to finish`);
  }
  if (purse.about.length < 20) problems.push(`${purse.tier} has nothing said about its money`);
}
// A world championship pays more than a circuit meet, and school pays nothing.
if (prizeFor('global', 1, true) <= prizeFor('circuit', 1, true)) problems.push('a world title pays less than a circuit meet');
if (prizeFor('global', 1, false) !== 0) problems.push('an amateur is paid prize money');
if (prizeFor('national_schools', 1, true) !== 0) problems.push('a schools meet pays prize money');
if (!/published/.test(PRIZE_NOTE)) problems.push('the note about the prize money has gone');

// The contracts, which are SLATE's own against real companies.
if (SHOE_BRANDS.length < 6) problems.push('there are not enough companies');
let lastLow = Infinity;
for (const band of CONTRACT_BANDS) {
  if (!LEVELS.some((one) => one.id === band.levelId)) problems.push(`${band.levelId} has a contract band and is not a level`);
  if (band.low >= band.high) problems.push(`${band.levelId} has a band that is not a band`);
  if (band.low >= lastLow) problems.push('the contract bands are out of order');
  lastLow = band.low;
  if (band.years < 1 || band.years > 6) problems.push(`${band.levelId} signs for ${band.years} years`);
  if (band.medalBonus <= 0) problems.push(`${band.levelId} has no medal bonus`);
  if (band.about.length < 20) problems.push(`${band.levelId} has nothing said about it`);
}
// Nobody signs anybody off a school team time.
if (bandFor('team') || bandFor('county') || bandFor('first_day')) problems.push('a company signs a school team runner');
if (!bandFor('world')) problems.push('a world class runner is offered nothing');
if (!/SLATE/.test(CONTRACT_NOTE) || !/private/.test(CONTRACT_NOTE)) problems.push('the note about the contracts has gone');
if (!/amateur/.test(PRO_NOTE)) problems.push('the note about turning professional has gone');
if (!/standard/.test(SELECTION_NOTE)) problems.push('the note about selection has gone');

// --- Say what was measured ----------------------------------------------------

const towns = new Set(NAMED_MEETS.map((one) => one.town));
console.log(`${EVENTS.length} events, ${WORLD_RECORDS.length} world records from ${Math.min(...WORLD_RECORDS.map((o) => o.year))} to ${Math.max(...WORLD_RECORDS.map((o) => o.year))}, all of them real.`);
console.log(`${NAMED_MEETS.length} real meets in ${towns.size} towns across ${new Set(NAMED_MEETS.map((o) => o.countryId)).size} countries.`);
console.log(`${SEASON_LADDERS.length} season ladders, ${SKILLS.filter((o) => o.domain === 'athletics').length} running skills, and teams from ${TRACK_FROM_AGE}.`);
console.log(`A world class hundred is ${formatSeconds(timeForLevel('world', '100m', 'mens'))} and a school team one is ${formatSeconds(timeForLevel('team', '100m', 'mens'))}.`);
console.log(`${PURSES.length} purses and ${CONTRACT_BANDS.length} contract bands against ${SHOE_BRANDS.length} real companies, every deal SLATE’s own.`);
console.log('Every rival in every lane is SLATE’s own, and so is every time run in the game.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of problems) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The track holds.');
