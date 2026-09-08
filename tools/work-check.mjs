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
  BELOW_FEDERAL_STATES, NO_STATE_MINIMUM, STATE_FLOORS, STATE_NOTE,
  floorIn, floorIsCountrys, jobsAt, youngShareAt,
} from '../src/engine/content/work.ts';
import { COUNTRIES, REGIONS } from '../src/engine/content/geography.ts';
import { ATTRIBUTES } from '../src/engine/domain/attributes.ts';
import { SKILLS } from '../src/engine/domain/skills.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  describeJob, jobOf, jobsHeld, openingsFor, shiftPay, wageFor,
} from '../src/engine/systems/work.ts';
import { ageOf } from '../src/engine/systems/lifespan.ts';
import {
  BRANCH_NOTE, COVER_NOTE, COVER_REASONS, EMPLOYERS, EMPLOYER_BY_ID, EMPLOYER_NOTE, LADDER_NOTE,
  LETTING_GO_MISSES, LETTING_GO_NOTE, LETTING_GO_REASONS, LETTING_GO_STANDING,
  PAY_STANCE, ROLES, ROTA_SHIFTS, SECTOR_LABEL, SHIFT_BY_ID, SHIFT_KINDS, employersAreCountrys, employersIn,
  nextRole,
} from '../src/engine/content/employers.ts';
import {
  deductionsOn, nextOnTheRota, promotionFor, shiftsToCome, stateFloorFor, writeRota,
} from '../src/engine/systems/work.ts';
import {
  CYCLE_DAYS, CYCLE_LABEL, PAYDAY_NOTE, PAY_CYCLES, SICK_NOTE, SICK_STANDING,
  STATUTORY_SICK_PAY, cycleIn, cycleIsCountrys,
} from '../src/engine/content/employers.ts';

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
  const took = sim.execute({ kind: 'job.take', payload: { kindId: job.id } });
  if (!took.ok) { problems.push(`${where} was refused ${job.label}: ${took.error}`); continue; }
  const held = jobOf(sim);
  if (held.perHour !== wageFor(sim, job, sim.player, held.employerId, held.roleId)) {
    problems.push(`${where} is paid something other than the wage`);
  }
  if (held.perHour < shiftPay(sim, job) / Math.max(1, job.hours)) {
    problems.push(`${where} is paid under the floor for the job`);
  }
  // Two jobs is one too many.
  if (sim.execute({ kind: 'job.take', payload: { kindId: openings[0].id } }).ok) {
    problems.push(`${where} holds two jobs at once`);
  }
  // A shift pays what a shift pays, and it goes on the timesheet, not into
  // the account: nobody is handed cash at the door.
  const shift = nextOnTheRota(held);
  if (!shift) problems.push(`${where} started work with nothing on the rota`);
  const expected = shift
    ? Math.round(
      wageFor(sim, job, sim.player, held.employerId, held.roleId)
      * shift.hours * (SHIFT_BY_ID[shift.kindId]?.premium ?? 1),
    )
    : 0;
  const before = sim.ledger.availableFunds(sim.player.primaryAccountId);
  const worked = sim.execute({ kind: 'job.shift', payload: {} });
  if (!worked.ok) problems.push(`${where} could not work a shift: ${worked.error}`);
  else {
    if (worked.value.paid !== expected) problems.push(`${where} was paid ${worked.value.paid} for a ${expected} shift`);
    if (sim.ledger.availableFunds(sim.player.primaryAccountId) !== before) {
      problems.push(`${where} was handed cash at the end of the shift`);
    }
    if (held.owed !== worked.value.paid) problems.push(`${where} worked and the timesheet does not agree`);
    if (shift && held.owedHours !== shift.hours) {
      problems.push(`${where} worked ${shift.hours} hours and the timesheet says ${held.owedHours}`);
    }
    // And not twice in a day.
    if (sim.execute({ kind: 'job.shift', payload: {} }).ok) problems.push(`${where} worked two shifts in one day`);
    if (!describeJob(sim, jobOf(sim)).includes(held.employerName)) {
      problems.push(`${where} works somewhere the page does not name`);
    }
    // Hand the notice in first, so that what follows measures the thing that
    // matters most about leaving: the hours already worked still get paid.
    const quit = sim.execute({ kind: 'job.quit', payload: {} });
    if (!quit.ok) problems.push(`${where} could not leave: ${quit.error}`);
    if (jobOf(sim)) problems.push(`${where} left and still has the job`);
    if (jobsHeld(sim).length !== 1) problems.push(`${where} has the wrong number of jobs behind them`);
    // The money arrives on the pay date, less what is withheld at source.
    if (!held.nextPayAt) problems.push(`${where} worked with no pay date set`);
    else {
      const owed = held.owed;
      sim.advanceTo(held.nextPayAt + 60 * 60 * 1000);
      if (held.payslips.length === 0) problems.push(`${where} reached payday with no payslip`);
      else {
        const slip = held.payslips[held.payslips.length - 1];
        if (slip.gross !== owed) problems.push(`${where} was paid ${slip.gross} against ${owed} on the timesheet`);
        if (slip.net + slip.tax + slip.social !== slip.gross) {
          problems.push(`${where} has a payslip whose lines do not add up`);
        }
        if (slip.net > slip.gross) problems.push(`${where} took home more than they earned`);
        // The net landed in the account, whatever else the days in between
        // cost: rent and the rest of a life carry on while you wait to be paid.
        const wages = sim.ledger.history(sim.player.primaryAccountId)
          .filter((one) => one.memo.includes(held.employerName));
        if (wages.length === 0) problems.push(`${where} was paid and the account does not agree`);
        else {
          const into = wages[wages.length - 1].postings
            .filter((one) => one.accountId === sim.player.primaryAccountId)
            .reduce((sum, one) => sum + one.amount, 0);
          if (into !== slip.net) problems.push(`${where} banked ${into} against ${slip.net} on the payslip`);
        }
      }
      if (held.owed !== 0) problems.push(`${where} was paid and still carries the hours`);
      // And once the last packet is out, that is the end of it.
      const packets = held.payslips.length;
      sim.advanceTo(sim.now + 90 * 24 * 60 * 60 * 1000);
      if (held.payslips.length !== packets) problems.push(`${where} kept being paid after leaving`);
    }
  }
}

// --- The companies, which are real ------------------------------------------

const seenEmployers = new Set();
const seenNames = new Set();
for (const employer of EMPLOYERS) {
  if (seenEmployers.has(employer.id)) problems.push(`${employer.id} is listed twice`);
  seenEmployers.add(employer.id);
  if (seenNames.has(employer.name)) problems.push(`${employer.name} is listed twice`);
  seenNames.add(employer.name);
  if (employer.countryIds.length === 0) problems.push(`${employer.name} trades nowhere`);
  for (const countryId of employer.countryIds) {
    if (!known.has(countryId)) problems.push(`${employer.name} trades in ${countryId}, which is not a country`);
  }
  if (!SECTOR_LABEL[employer.sector]) problems.push(`${employer.name} is a "${employer.sector}", which is not a sector`);
  if (!PAY_STANCE[employer.pay]) problems.push(`${employer.name} pays "${employer.pay}", which is not a stance`);
  if (employer.about.length < 25) problems.push(`${employer.name} has nothing said about it`);
}
if (EMPLOYERS.length < 40) problems.push(`only ${EMPLOYERS.length} real employers`);
// The countries the game is most likely to be played in all have some.
for (const countryId of ['us', 'uk', 'ca', 'au', 'de', 'fr', 'jp']) {
  if (!employersAreCountrys(countryId)) problems.push(`${countryId} has no real employer at all`);
  if (employersIn(countryId).length < 3) problems.push(`${countryId} has fewer than three`);
}
// And the pay stances are an order rather than three labels.
if (PAY_STANCE.well_above.multiple <= PAY_STANCE.above.multiple) problems.push('paying well above the floor is not worth more than paying above it');
if (PAY_STANCE.at_it.multiple !== 1) problems.push('paying the floor is not paying the floor');
if (!/publicly/.test(EMPLOYER_NOTE) || !/exact/.test(EMPLOYER_NOTE)) problems.push('the note about how pay is carried has gone');
if (!/SLATE/.test(BRANCH_NOTE)) problems.push('the note about the branch has gone');

// --- The ladder ---------------------------------------------------------------

let lastMultiple = 0;
let lastShifts = -1;
for (const role of ROLES) {
  if (role.multiple <= lastMultiple) problems.push(`${role.label} is worth no more than the step below`);
  lastMultiple = role.multiple;
  if (role.shifts < lastShifts) problems.push(`${role.label} asks for fewer shifts than the step below`);
  lastShifts = role.shifts;
  if (role.hours < 4 || role.hours > 12) problems.push(`${role.label} works ${role.hours} hours`);
  if (role.about.length < 25) problems.push(`${role.label} has nothing said about it`);
  if (ROTA_SHIFTS[role.id] === undefined) problems.push(`${role.label} is on no rota`);
}
if (ROLES[0].shifts !== 0 || ROLES[0].standing !== 0) problems.push('somebody has to earn the bottom rung');
if (nextRole(ROLES[ROLES.length - 1].id)) problems.push('there is something above the top of the ladder');
if (!/shape of it/.test(LADDER_NOTE)) problems.push('the note about the ladder has gone');

// --- The rota -------------------------------------------------------------------

const seenShifts = new Set();
for (const kind of SHIFT_KINDS) {
  if (seenShifts.has(kind.id)) problems.push(`${kind.id} is listed twice`);
  seenShifts.add(kind.id);
  if (kind.startsAt < 0 || kind.startsAt > 23) problems.push(`${kind.label} starts at ${kind.startsAt}`);
  if (kind.premium < 1 || kind.premium > 2) problems.push(`${kind.label} pays ${kind.premium} of the rate`);
  if (kind.about.length < 25) problems.push(`${kind.label} has nothing said about it`);
}
// Nights and weekends pay more, because they really do.
if (SHIFT_KINDS.find((one) => one.id === 'night').premium <= 1) problems.push('a night pays no more than a day');
if (SHIFT_KINDS.find((one) => one.id === 'weekend').premium <= 1) problems.push('a weekend pays no more than a weekday');
if (COVER_REASONS.length < 5) problems.push('there are not enough reasons to ring somebody');
if (!/ordinary/.test(COVER_NOTE)) problems.push('the note about the call has gone');

// --- A rota that is a rota ---------------------------------------------------------

{
  const sim = quickSave(
    { birthYear: 2006, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'rota-check',
  );
  const took = sim.execute({ kind: 'job.take', payload: { kindId: 'checkout' } });
  if (!took.ok) problems.push(`taking a checkout job was refused: ${took.error}`);
  else {
    const held = jobOf(sim);
    if (!held.employerId) problems.push('a British supermarket job is at nobody real');
    else if (!EMPLOYER_BY_ID[held.employerId]) problems.push(`the employer is ${held.employerId}, which is not carried`);
    if (held.roleId !== 'crew') problems.push('somebody starts above the bottom rung');
    if (held.rota.length === 0) problems.push('a job comes with no rota at all');
    // The rota goes forward, never twice at once, and every shift is a real kind.
    let previous = 0;
    for (const shift of held.rota) {
      if (shift.at < previous) problems.push('a rota is out of order');
      previous = shift.at;
      if (!SHIFT_KINDS.some((one) => one.id === shift.kindId)) problems.push(`a rota has a "${shift.kindId}" on it`);
      if (shift.hours < 1) problems.push('a rota has a shift of no hours');
    }
    if (!nextOnTheRota(held)) problems.push('there is nothing to work');
    // A week of rota is the number of shifts the role is down for.
    const week = writeRota(sim, held);
    if (week.length !== ROTA_SHIFTS[held.roleId]) {
      problems.push(`a crew rota is ${week.length} shifts and should be ${ROTA_SHIFTS[held.roleId]}`);
    }
    // Nobody is promoted on their first day.
    const early = promotionFor(held);
    if (early.ready) problems.push('somebody is offered a promotion on day one');
    if (sim.execute({ kind: 'job.take_promotion', payload: {} }).ok) problems.push('a promotion can be taken on day one');
    // And nobody can accept a cover nobody offered.
    if (sim.execute({ kind: 'job.cover', payload: {} }).ok) problems.push('a cover shift can be taken that nobody offered');
    if (shiftsToCome(held).length === 0) problems.push('there is nothing to come');
  }
}

// --- Payday and ringing in ----------------------------------------------------

for (const [countryId, cycle] of Object.entries(PAY_CYCLES)) {
  if (!known.has(countryId)) problems.push(`${countryId} has a pay cycle and is not a country`);
  if (!CYCLE_LABEL[cycle]) problems.push(`${countryId} is paid "${cycle}", which is not a cycle`);
}
// The habits SLATE claims are the ones those countries really have.
if (cycleIn('uk') !== 'monthly') problems.push('Britain is not carried as paying monthly');
if (cycleIn('us') === 'monthly') problems.push('America is carried as paying monthly');
if (!cycleIsCountrys('au')) problems.push('Australia has no cycle carried');
if (cycleIn('zz') !== 'monthly') problems.push('a country with no cycle gets no general one');
for (const days of Object.values(CYCLE_DAYS)) {
  if (days < 7 || days > 31) problems.push(`a pay cycle of ${days} days`);
}
if (!/withheld/.test(PAYDAY_NOTE)) problems.push('the note about payday has gone');

// Statutory sick pay exists where it exists and does not where it does not.
for (const countryId of STATUTORY_SICK_PAY) {
  if (!known.has(countryId)) problems.push(`${countryId} has statutory sick pay and is not a country`);
}
if (!STATUTORY_SICK_PAY.has('uk')) problems.push('Britain is carried as having no statutory sick pay');
if (STATUTORY_SICK_PAY.has('us')) problems.push('America is carried as having a federal statutory sick pay');
if (SICK_STANDING.genuine <= SICK_STANDING.pulled) problems.push('ringing in ill costs more than pulling one');
if (SICK_STANDING.pulled <= SICK_STANDING.caught) problems.push('being caught costs less than not being caught');
if (!/entitlement/.test(SICK_NOTE)) problems.push('the note about ringing in has gone');

// And a payslip adds up.
{
  const sim = quickSave(
    { birthYear: 1996, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'payslip-check',
  );
  const slip = deductionsOn(sim, 200_000, 'uk-eng-london', 30);
  if (slip.net + slip.tax + slip.social !== 200_000) problems.push('a payslip does not add up');
  if (slip.net >= 200_000) problems.push('nothing at all is withheld from a British wage');
  if (slip.net <= 0) problems.push('a whole wage is withheld');
  // A small wage is taxed more lightly than a large one, which is the point of brackets.
  const small = deductionsOn(sim, 20_000, 'uk-eng-london', 30);
  if (small.tax / 20_000 > slip.tax / 200_000) problems.push('a small wage is taxed harder than a large one');
}

// --- The states, which publish their own -------------------------------------

const states = new Set(REGIONS.all().filter((one) => one.id.startsWith('us-')).map((one) => one.id));
if (states.size !== 51) problems.push(`${states.size} American states and territories, not 51`);
for (const [regionId, perHour] of Object.entries(STATE_FLOORS)) {
  if (!states.has(regionId)) problems.push(`${regionId} sets a minimum and is not an American state`);
  if (perHour <= FLOOR('us').perHour) problems.push(`${regionId} is carried at or below the federal floor`);
  if (perHour > 25_00) problems.push(`${regionId} is carried at ${perHour} an hour`);
}
for (const regionId of [...NO_STATE_MINIMUM, ...BELOW_FEDERAL_STATES]) {
  if (!states.has(regionId)) problems.push(`${regionId} has no minimum and is not an American state`);
  if (regionId in STATE_FLOORS) problems.push(`${regionId} both has and has not a state minimum`);
}
// The five with none and the two below federal are the seven everyone knows.
if (NO_STATE_MINIMUM.size !== 5) problems.push(`${NO_STATE_MINIMUM.size} states with no minimum, not 5`);
if (BELOW_FEDERAL_STATES.size !== 2) problems.push(`${BELOW_FEDERAL_STATES.size} states below federal, not 2`);
for (const regionId of ['us-al', 'us-la', 'us-ms', 'us-sc', 'us-tn']) {
  if (!NO_STATE_MINIMUM.has(regionId)) problems.push(`${regionId} is carried as setting its own minimum`);
}
if (Object.keys(STATE_FLOORS).length + NO_STATE_MINIMUM.size + BELOW_FEDERAL_STATES.size > states.size) {
  problems.push('more states are carried than there are states');
}
// A state that sets none falls to the federal figure, and one that sets its own does not.
if (stateFloorFor('us-tn-nashville') !== FLOOR('us').perHour) problems.push('Tennessee does not fall to the federal floor');
if (stateFloorFor('us-ca-losangeles') !== STATE_FLOORS['us-ca']) problems.push('Los Angeles is not paid California\u2019s floor');
if (stateFloorFor('us-wa-seattle') <= stateFloorFor('us-tx-houston')) problems.push('Washington pays no more than Texas');
if (stateFloorFor('uk-eng-london') !== undefined) problems.push('London is given an American state floor');
if (!/state by/.test(STATE_NOTE)) problems.push('the note about the states has gone');

// --- Being let go ------------------------------------------------------------

if (LETTING_GO_MISSES < 2 || LETTING_GO_MISSES > 6) problems.push(`${LETTING_GO_MISSES} in a row is not a sacking`);
if (LETTING_GO_STANDING < 0 || LETTING_GO_STANDING > 25) problems.push('the patience threshold is not a threshold');
for (const why of ['missed', 'standing']) {
  if ((LETTING_GO_REASONS[why] ?? '').length < 20) problems.push(`there is nothing said about being let go for ${why}`);
}
if (!/turning up/.test(LETTING_GO_NOTE)) problems.push('the note about being let go has gone');
{
  const sim = quickSave(
    { birthYear: 2009, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'let-go-check',
  );
  const took = sim.execute({ kind: 'job.take', payload: { kindId: 'checkout' } });
  if (!took.ok) problems.push(`could not take a job to be let go from: ${took.error}`);
  else {
    const held = jobOf(sim);
    const employerName = held.employerName;
    const earned = held.earned;
    // Turn up for nothing for a month and somebody else is on the rota.
    sim.advanceTo(sim.now + 40 * 24 * 60 * 60 * 1000);
    if (jobOf(sim)) problems.push('somebody who never turned up still has the job');
    const ended = jobsHeld(sim)[0];
    if (!ended?.endedAt) problems.push('being let go did not end the job');
    if (!ended?.endReason) problems.push('being let go came with no reason');
    if (ended && ended.earned !== earned) problems.push('being let go changed what had been earned');
    if (ended && ended.rota.some((one) => !one.worked && !one.missed)) {
      problems.push(`${employerName} left shifts on the rota of somebody they let go`);
    }
  }
}

// --- Say what was measured ----------------------------------------------------

const none = WAGE_FLOORS.filter((one) => !one.statutory).length;
console.log(`${WAGE_FLOORS.length} national wage floors, ${none} of them bargained rather than legislated.`);
console.log(`The American federal floor is ${(FLOOR('us').perHour / 100).toFixed(2)} an hour and has not moved since ${FLOOR('us').year}.`);
console.log(`${FIRST_JOBS.length} kinds of first job, from ${Math.min(...FIRST_JOBS.map((o) => o.fromAge))}, and ${SHIFTS_A_WEEK} shifts a week.`);
console.log(`${EMPLOYERS.length} real companies across ${new Set(EMPLOYERS.flatMap((o) => o.countryIds)).size} countries, in ${new Set(EMPLOYERS.map((o) => o.sector)).size} sectors.`);
console.log(`${ROLES.length} rungs from crew to the store, and ${SHIFT_KINDS.length} kinds of shift on a rota.`);
console.log(`${Object.keys(PAY_CYCLES).length} pay cycles carried, and ${STATUTORY_SICK_PAY.size} countries where a day off sick is paid.`);
console.log(`${Object.keys(STATE_FLOORS).length} American states publish a floor above the federal one; ${NO_STATE_MINIMUM.size} set none at all.`);
console.log(`${LETTING_GO_MISSES} shifts missed in a row and somebody else is on the rota.`);
console.log('The companies are real; the branch, the rota, the manager and every shift are SLATE’s own.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)]) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The job holds.');
