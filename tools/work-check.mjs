/**
 * The Saturday job holds up.
 *
 * The minimum wage is published and this measures it like published data:
 * every country the game names is a country the geography has, every figure
 * is a wage a human being could be paid, the countries with no statutory
 * minimum are the ones that really have none, and the game never quietly
 * turns a national floor into a local one where the country does not.
 *
 * The jobs themselves are SLATE's own and are measured for making sense: an
 * age you could really be doing them from, hours that are a shift, and
 * something learned that the game actually carries.
 */

import {
  EMPLOYER_FIRST, EMPLOYER_SECOND, FIRST_JOBS, JOB_BY_ID, JOB_NOTE, LOCAL_MINIMUMS, LOCAL_NOTE,
  NO_MINIMUM_NOTE, SHIFTS_A_WEEK, WAGE_FLOORS, WAGE_NOTE, WORLD_FLOOR, YOUNG_NOTE, YOUNG_RATE,
  floorIn, floorIsCountrys, jobsAt, youngShareAt,
} from '../src/engine/content/work.ts';
import { COUNTRIES } from '../src/engine/content/geography.ts';
import { ATTRIBUTES } from '../src/engine/domain/attributes.ts';
import { SKILLS } from '../src/engine/domain/skills.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  describeJob, jobOf, jobsHeld, openingsFor, shiftPay, wageFor,
} from '../src/engine/systems/work.ts';
import { ageOf } from '../src/engine/systems/lifespan.ts';

const problems = [];
const known = new Set(COUNTRIES.all().map((one) => one.id));

// --- The floor, which is published -----------------------------------------

const seen = new Set();
for (const floor of WAGE_FLOORS) {
  if (seen.has(floor.countryId)) problems.push(`${floor.countryId} has two floors`);
  seen.add(floor.countryId);
  if (!known.has(floor.countryId)) problems.push(`${floor.countryId} has a floor and is not a country`);
  if (floor.perHour <= 0) problems.push(`${floor.countryId} pays nothing an hour`);
  if (floor.perHour > 40_00) problems.push(`${floor.countryId} pays ${floor.perHour} an hour`);
  if (floor.year < 2000 || floor.year > 2026) problems.push(`${floor.countryId}'s figure is from ${floor.year}`);
  if (floor.about.length < 25) problems.push(`${floor.countryId} has nothing said about its floor`);
}
if (WAGE_FLOORS.length < 40) problems.push(`only ${WAGE_FLOORS.length} countries carry a floor`);

// The ones with no statutory minimum are the ones that really have none.
const NONE = ['dk', 'se', 'no', 'fi', 'is', 'it', 'at', 'ch'];
for (const countryId of NONE) {
  const floor = FLOOR(countryId);
  if (!floor) { problems.push(`${countryId} is not carried at all`); continue; }
  if (floor.statutory) problems.push(`${countryId} is said to have a statutory minimum wage`);
}
for (const countryId of ['us', 'uk', 'de', 'fr', 'au', 'jp', 'br', 'in']) {
  const floor = FLOOR(countryId);
  if (!floor) { problems.push(`${countryId} is not carried at all`); continue; }
  if (!floor.statutory) problems.push(`${countryId} is said to have no statutory minimum wage`);
}
function FLOOR(countryId) {
  return WAGE_FLOORS.find((one) => one.countryId === countryId);
}
// The American federal figure is the one everybody knows, and it has not moved.
if (FLOOR('us')?.perHour !== 7_25) problems.push('the American federal floor is not what it is');
if (FLOOR('us')?.year !== 2009) problems.push('the American federal floor is not dated to when it was set');
// And the rich countries with no statutory floor still pay well.
if (FLOOR('dk').perHour <= FLOOR('us').perHour) problems.push('a bargained Danish floor is below the American statutory one');
if (!/collective/.test(NO_MINIMUM_NOTE)) problems.push('the note about the countries with no minimum has gone');
if (!/rounded/.test(WAGE_NOTE)) problems.push('the note about the conversion has gone');
if (!/state/.test(LOCAL_NOTE)) problems.push('the note about local minimums has gone');
if (!/young/.test(YOUNG_NOTE)) problems.push('the note about the young rate has gone');

for (const countryId of LOCAL_MINIMUMS) {
  if (!known.has(countryId)) problems.push(`${countryId} sets a local minimum and is not a country`);
  if (!floorIsCountrys(countryId)) problems.push(`${countryId} sets a local minimum and has no floor carried`);
}
// Somewhere it does not carry falls to the world floor, and says so.
if (floorIn('zz').perHour !== WORLD_FLOOR) problems.push('a country with no figure gets no general one');
if (floorIsCountrys('zz')) problems.push('a country with no figure is said to have one');

// The young rate goes up with age and reaches the adult figure.
let last = -1;
for (const band of YOUNG_RATE) {
  if (band.fromAge <= last) problems.push('the young rate bands are out of order');
  last = band.fromAge;
  if (band.share <= 0 || band.share > 1) problems.push(`a ${band.fromAge} year old is paid ${band.share} of it`);
}
if (youngShareAt(14) >= youngShareAt(19)) problems.push('a fourteen year old is paid as much as a nineteen year old');
if (youngShareAt(30) !== 1) problems.push('an adult is not paid the adult rate');

// --- The jobs, which are SLATE's own -----------------------------------------

const attributeIds = new Set(ATTRIBUTES.map((one) => one.id));
const skillIds = new Set(SKILLS.map((one) => one.id));
const seenJobs = new Set();
for (const job of FIRST_JOBS) {
  if (seenJobs.has(job.id)) problems.push(`${job.id} is listed twice`);
  seenJobs.add(job.id);
  if (job.fromAge < 12 || job.fromAge > 21) problems.push(`${job.label} starts at ${job.fromAge}`);
  if (job.hours < 1 || job.hours > 12) problems.push(`${job.label} is a ${job.hours} hour shift`);
  if (job.demand < 5 || job.demand > 60) problems.push(`${job.label} takes ${job.demand} out of you`);
  if (job.premium < 0.8 || job.premium > 1.6) problems.push(`${job.label} pays ${job.premium} of the floor`);
  if (job.about.length < 25) problems.push(`${job.label} has nothing said about it`);
  if (job.feeds.length === 0) problems.push(`${job.label} teaches nothing`);
  for (const feed of job.feeds) {
    const pool = feed.kind === 'skill' ? skillIds : attributeIds;
    if (!pool.has(feed.key)) problems.push(`${job.label} feeds "${feed.key}", which is not a ${feed.kind}`);
  }
}
if (FIRST_JOBS.length < 10) problems.push(`only ${FIRST_JOBS.length} kinds of first job`);
if (jobsAt(13).length === 0) problems.push('a thirteen year old can do nothing at all');
if (jobsAt(13).length >= jobsAt(18).length) problems.push('a thirteen year old can do as much as an eighteen year old');
if (SHIFTS_A_WEEK < 1 || SHIFTS_A_WEEK > 5) problems.push(`${SHIFTS_A_WEEK} shifts a week is not a Saturday job`);
if (EMPLOYER_FIRST.length < 8 || EMPLOYER_SECOND.length < 6) problems.push('there are not enough invented employers');
if (!/rota/.test(JOB_NOTE)) problems.push('the note about the employer has gone');

// --- A life it happens in -------------------------------------------------

for (const [birthYear, cityId, expectStatutory] of [
  [2009, 'uk-eng-london', true], [2009, 'us-ca-losangeles', true],
  [2009, 'se-26-stockholm', false], [2014, 'uk-eng-london', true],
]) {
  const sim = quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, `work-check-${birthYear}-${cityId}`);
  const age = ageOf(sim);
  const where = `a ${age} year old in ${cityId}`;
  const openings = openingsFor(sim);
  if (age >= 16 && openings.length === 0) problems.push(`${where} has nothing at all going`);
  if (age < 13 && openings.length > 0) problems.push(`${where} is offered a job`);
  if (floorIn(cityId.split('-')[0]).statutory !== expectStatutory) {
    problems.push(`${cityId} is carried as ${expectStatutory ? 'not ' : ''}statutory`);
  }
  if (openings.length === 0) continue;

  const job = openings[openings.length - 1];
  const expected = shiftPay(sim, job);
  const took = sim.execute({ kind: 'job.take', payload: { kindId: job.id } });
  if (!took.ok) { problems.push(`${where} was refused ${job.label}: ${took.error}`); continue; }
  if (jobOf(sim)?.perHour !== wageFor(sim, job)) problems.push(`${where} is paid something other than the wage`);
  // Two jobs is one too many.
  if (sim.execute({ kind: 'job.take', payload: { kindId: openings[0].id } }).ok) {
    problems.push(`${where} holds two jobs at once`);
  }
  // A shift pays what a shift pays, and it goes into the account.
  const before = sim.ledger.availableFunds(sim.player.primaryAccountId);
  const worked = sim.execute({ kind: 'job.shift', payload: {} });
  if (!worked.ok) problems.push(`${where} could not work a shift: ${worked.error}`);
  else {
    if (worked.value.paid !== expected) problems.push(`${where} was paid ${worked.value.paid} for a ${expected} shift`);
    const after = sim.ledger.availableFunds(sim.player.primaryAccountId);
    if (after !== before + worked.value.paid) problems.push(`${where} was paid and the account does not agree`);
    // And not twice in a day.
    if (sim.execute({ kind: 'job.shift', payload: {} }).ok) problems.push(`${where} worked two shifts in one day`);
  }
  if (!describeJob(sim, jobOf(sim)).includes(jobOf(sim).employerName)) {
    problems.push(`${where} works somewhere the page does not name`);
  }
  const quit = sim.execute({ kind: 'job.quit', payload: {} });
  if (!quit.ok) problems.push(`${where} could not leave: ${quit.error}`);
  if (jobOf(sim)) problems.push(`${where} left and still has the job`);
  if (jobsHeld(sim).length !== 1) problems.push(`${where} has the wrong number of jobs behind them`);
}

// --- Say what was measured ----------------------------------------------------

const none = WAGE_FLOORS.filter((one) => !one.statutory).length;
console.log(`${WAGE_FLOORS.length} national wage floors, ${none} of them bargained rather than legislated.`);
console.log(`The American federal floor is ${(FLOOR('us').perHour / 100).toFixed(2)} an hour and has not moved since ${FLOOR('us').year}.`);
console.log(`${FIRST_JOBS.length} kinds of first job, from ${Math.min(...FIRST_JOBS.map((o) => o.fromAge))}, and ${SHIFTS_A_WEEK} shifts a week.`);
console.log('The employer is real where the city has one and SLATE’s own where it does not; the rota is SLATE’s own everywhere.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)]) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The job holds.');
