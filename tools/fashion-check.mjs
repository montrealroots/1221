/**
 * The fashion weeks hold up.
 *
 * The weeks are real and this measures that they are: that every one is in a
 * city the geography has, that it runs in months that exist and shows a
 * collection for each of them, and that no two of them collide on an id or a
 * name. Every house on a schedule has to be a brand the catalog actually
 * sells, because a wardrobe and a front row have to be talking about the same
 * thing — a house nobody can buy from is a seat nobody can earn.
 *
 * It also measures a season: that a week's shows do not stack two houses into
 * the same room at the same minute, that the big names anchor the end of it
 * the way they really do, that a season is named a year ahead of the calendar
 * the way the industry names it, and that the note saying the schedule moves
 * every year is still on the page.
 */

import {
  ANSWER_DAYS, FASHION_NOTE, FASHION_WEEKS, SEASON_LABEL, SEAT_BAR_SHARE, SEAT_LABEL,
  SEAT_THRESHOLD, SEAT_WEIGHT, SHOWING_HOUSES, SHOW_DAYS, SHOW_HOURS, TURNING_UP_COST,
  WEEK_TIER_LABEL, housesAt, weeksFor,
} from '../src/engine/content/fashionweeks.ts';
import { CATALOG } from '../src/engine/content/catalog.ts';
import { CITIES } from '../src/engine/content/geography.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  editionsIn, editionsWithShows, seasonYear, seatFor, showsIn, standingWith, upcomingEditions,
} from '../src/engine/systems/fashion.ts';

const problems = [];

// --- The weeks --------------------------------------------------------------

const ids = new Set();
const names = new Set();
for (const week of FASHION_WEEKS) {
  if (ids.has(week.id)) problems.push(`two weeks share the id ${week.id}`);
  ids.add(week.id);
  if (names.has(week.name)) problems.push(`two weeks are called ${week.name}`);
  names.add(week.name);
  const city = CITIES.get(week.cityId);
  if (!city) problems.push(`${week.name} is in ${week.cityId}, which is not a city here`);
  if (week.editions.length === 0) problems.push(`${week.name} runs in no month`);
  for (const edition of week.editions) {
    if (edition.month < 1 || edition.month > 12) problems.push(`${week.name} runs in month ${edition.month}`);
    if (!SEASON_LABEL[edition.season]) problems.push(`${week.name} shows a ${edition.season}, which is not a collection`);
    const lastDay = new Date(Date.UTC(2025, edition.month, 0)).getUTCDate();
    if (edition.days[0] < 1 || edition.days[1] > lastDay || edition.days[1] < edition.days[0]) {
      problems.push(`${week.name} opens between day ${edition.days[0]} and ${edition.days[1]} of month ${edition.month}`);
    }
  }
  if (!['record', 'slate'].includes(week.placement)) problems.push(`${week.name} has no placement`);
  // A week SLATE has placed itself has to admit it in its own description,
  // because the calendar is otherwise read as public record.
  if (week.placement === 'slate' && !/move|fixed slot|suspended|stopped/i.test(week.about)) {
    problems.push(`${week.name} is SLATE's own placement but does not say so`);
  }
  // South of the equator the calendar runs the other way round: summer arrives
  // in December and winter in June, and a collection is shown some months
  // before the season it is for rather than during or after it.
  const southern = ['br-27-saopaulo', 'za-06-johannesburg', 'za-11-capetown', 'au-nsw-sydney', 'au-vic-melbourne'];
  if (southern.includes(week.cityId)) {
    for (const edition of week.editions) {
      // A summer collection is shown between April and October, ahead of the
      // December that it is for.
      if (edition.season === 'spring_summer' && (edition.month < 4 || edition.month > 10)) {
        problems.push(`${week.name} shows the summer in month ${edition.month}, which is after the summer it is for arrives`);
      }
      // A winter collection is shown between October and March, ahead of the
      // June that it is for.
      if (edition.season === 'autumn_winter' && edition.month >= 4 && edition.month <= 9) {
        problems.push(`${week.name} shows the winter in month ${edition.month}, which is during or after the winter it is for`);
      }
    }
  }
  if (!WEEK_TIER_LABEL[week.tier]) problems.push(`${week.name} is a ${week.tier}, which is not a kind of week`);
  if (week.selectivity < 0 || week.selectivity > 100) problems.push(`${week.name} is ${week.selectivity} selective`);
  if (week.about.length < 20) problems.push(`${week.name} has nothing said about it`);
}

// --- The houses -------------------------------------------------------------

const sellable = new Set(CATALOG.all()
  .filter((item) => ['clothing', 'footwear', 'accessory', 'watch', 'jewelry'].includes(item.category))
  .map((item) => item.brand));

const seen = new Set();
for (const house of SHOWING_HOUSES) {
  const key = `${house.brand}@${house.weekId}`;
  if (seen.has(key)) problems.push(`${house.brand} is on the ${house.weekId} schedule twice`);
  seen.add(key);
  // A house you cannot buy from is a seat you cannot earn, so every one on a
  // schedule has to be something the catalog really sells.
  if (!sellable.has(house.brand)) {
    problems.push(`${house.brand} shows at ${house.weekId} but nothing in the catalog is by them`);
  }
  if (!ids.has(house.weekId)) problems.push(`${house.brand} shows at ${house.weekId}, which is not a week`);
  if (house.standing < 0 || house.standing > 100) problems.push(`${house.brand} has a standing of ${house.standing}`);
  if (house.about.length < 15) problems.push(`${house.brand} has nothing said about it`);
}

const withSchedule = FASHION_WEEKS.filter((week) => housesAt(week.id).length > 0);
if (withSchedule.length < 6) problems.push(`only ${withSchedule.length} weeks have a schedule at all`);

// --- The seats --------------------------------------------------------------

let lastThreshold = 999;
let lastWeight = 999;
for (const seat of ['front_row', 'second_row', 'back', 'standing']) {
  if (!SEAT_LABEL[seat]) problems.push(`${seat} has no name`);
  if (SEAT_THRESHOLD[seat] > lastThreshold) problems.push(`${SEAT_LABEL[seat]} is harder to get than the row in front of it`);
  if (SEAT_WEIGHT[seat] > lastWeight) problems.push(`${SEAT_LABEL[seat]} carries more of the room than the row in front of it`);
  if (SEAT_BAR_SHARE[seat] > 1 || SEAT_BAR_SHARE[seat] <= 0) problems.push(`${SEAT_LABEL[seat]} has a bar share of ${SEAT_BAR_SHARE[seat]}`);
  lastThreshold = SEAT_THRESHOLD[seat];
  lastWeight = SEAT_WEIGHT[seat];
}
if (ANSWER_DAYS[0] >= ANSWER_DAYS[1]) problems.push('a house answers in no time at all');
if (TURNING_UP_COST <= 0) problems.push('turning up costs nothing');
if (SHOW_HOURS.length < 4) problems.push('a show day has almost no hours in it');

// --- The note ---------------------------------------------------------------

if (!/SLATE/.test(FASHION_NOTE) || !/moves every year/.test(FASHION_NOTE)) {
  problems.push('the note saying the schedule moves every year has gone');
}
if (!/public record/.test(FASHION_NOTE)) {
  problems.push('the note no longer separates the documented weeks from the ones SLATE placed');
}

// --- A season -------------------------------------------------------------

const sim = quickSave({ wealth: 'wealthy' }, 'fashion-check');
const year = new Date(sim.now).getUTCFullYear();
const editions = editionsIn(sim, year);
if (editions.length < FASHION_WEEKS.length) {
  problems.push(`${editions.length} editions in a year across ${FASHION_WEEKS.length} weeks`);
}

// A February show is the autumn that follows it; a September show is the
// spring after that. That is the industry's own naming and it holds.
if (seasonYear('autumn_winter', 2, 2026) !== 2026) problems.push('a February show is not named for that year');
if (seasonYear('spring_summer', 9, 2026) !== 2027) problems.push('a September show is not named for the next year');
if (seasonYear('autumn_winter', 11, 2026) !== 2027) problems.push('a southern winter shown in November is not named for the next year');
if (seasonYear('winter_festive', 10, 2026) !== 2026) problems.push('a festive collection shown in October is not named for that year');

// The four run back to back, in the same order, both seasons.
const FOUR = ['fw-nyfw', 'fw-lfw', 'fw-mfw', 'fw-pfw'];
for (const month of [2, 9]) {
  const dates = FOUR.map((id) => editions.find(
    (one) => one.weekId === id && new Date(one.startsAt).getUTCMonth() + 1 === month,
  ));
  if (dates.some((one) => !one)) { problems.push(`one of the four has no edition in month ${month}`); continue; }
  for (let i = 1; i < dates.length; i += 1) {
    if (dates[i].startsAt <= dates[i - 1].startsAt) {
      problems.push(`${dates[i].week.name} does not follow ${dates[i - 1].week.name} in month ${month}`);
    }
  }
}

let shows = 0;
let bigNamesLate = 0;
let bigNames = 0;
for (const edition of editions) {
  const list = showsIn(sim, edition);
  shows += list.length;
  const slots = new Set();
  for (const show of list) {
    if (show.at < edition.startsAt || show.at > edition.endsAt) {
      problems.push(`${show.house.brand} shows outside ${edition.week.name}`);
    }
    const slot = `${show.at}@${show.venue}`;
    if (slots.has(slot)) problems.push(`two houses show in ${show.venue} at the same minute at ${edition.week.name}`);
    slots.add(slot);
    if (show.venue.length < 8) problems.push(`${show.house.brand} shows somewhere with no name`);
    // The biggest names anchor the end of the week.
    if (show.house.standing >= 95) {
      bigNames += 1;
      const day = Math.floor((show.at - edition.startsAt) / 86_400_000);
      if (day >= SHOW_DAYS - 3) bigNamesLate += 1;
    }
  }
}
if (bigNames > 0 && bigNamesLate < bigNames * 0.6) {
  problems.push(`${bigNames - bigNamesLate} of ${bigNames} of the biggest names open a week rather than close it`);
}

// --- Who gets in ------------------------------------------------------------

const paris = upcomingEditions(sim, 400 * 86_400_000).find((one) => one.weekId === 'fw-pfw');
if (!paris) problems.push('Paris is not on the calendar in the next year');
else {
  const chanel = housesAt('fw-pfw').find((one) => one.brand === 'Chanel');
  // Nobody has heard of a new character, and nowhere lets them in.
  if (seatFor(sim, chanel)) problems.push('a house nobody has heard of walks into Chanel');
  // Somebody the whole world knows gets a seat somewhere.
  sim.player.reputation.publicFame = 94;
  sim.player.reputation.prestige = 88;
  sim.player.reputation.professionalReputation = 85;
  const seats = housesAt('fw-pfw').map((house) => seatFor(sim, house)).filter(Boolean);
  if (seats.length === 0) problems.push('somebody the whole world knows cannot get into a single show in Paris');
  if (standingWith(sim, chanel) < 60) problems.push('the most famous person in the world means nothing to a house');
}

const carried = editionsWithShows(sim, 400 * 86_400_000);
const all = upcomingEditions(sim, 400 * 86_400_000);

// --- What it found ----------------------------------------------------------

const placed = FASHION_WEEKS.filter((w) => w.placement === 'slate').length;
console.log(`\n${FASHION_WEEKS.length} real weeks in ${new Set(FASHION_WEEKS.map((w) => w.cityId)).size} cities, ${editions.length} editions a year.`);
console.log(`${FASHION_WEEKS.length - placed} run to dates that are public record; ${placed} are placed by SLATE and say so.`);
console.log(`${SHOWING_HOUSES.length} house slots across ${withSchedule.length} weeks, every one a brand the catalog sells.`);
console.log(`${new Set(SHOWING_HOUSES.map((h) => h.brand)).size} houses show, ${shows} shows a year.`);
console.log(`${carried.length} of ${all.length} editions ahead have a schedule SLATE carries.`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('The season stands up.');
