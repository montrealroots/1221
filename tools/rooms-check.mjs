/**
 * The last four ordinary rooms hold up.
 *
 * What is measured like published data: who pays for dentistry in each country
 * that has an arrangement, the England band charges and who is exempt from
 * them, the veterinary groups and the countries they really trade in, the
 * microchipping law and the year it came in, the licensing office for every
 * American state, and every mobile network against the country it operates in.
 *
 * What is measured for making sense: a treatment that needs something wrong
 * before anybody will do it, a queue that is shorter with an appointment than
 * without one, a contract a child cannot sign, and an exit fee that falls to
 * nothing once the tie in has run out.
 */

import {
  ARRIVAL_LABEL, BAD_REPAIR, BAND_CHARGE, CHIP_NOTE, CHIP_REQUIRED, COUNTER_JOBS, DENTAL_REGIMES,
  DENTAL_SYSTEM_LABEL, DENTIST_NOTE, GENERAL_DENTAL, NETWORKS, NETWORK_KIND_LABEL, OFFICE_NOTE,
  OUT_OF_HOURS_MULTIPLE, PAPERWORK_WRONG, PORTING_NOTE, RECALL_LONGEST_MONTHS, RECALL_NOTE,
  RECALL_SHORTEST_MONTHS, SENT_HOME, TARIFFS, TEETH_TROUBLE, TREATMENTS, VET_GROUPS, VET_NOTE,
  VET_SERVICES, WAIT_MINUTES, chipRequired, counterJobsAt, dentalIn, dentalIsCountrys,
  networksAreCountrys, networksIn, toothPrice, vetGroupIsCountrys, vetGroupsIn,
} from '../src/engine/content/rooms.ts';
import { COUNTRIES, REGIONS } from '../src/engine/content/geography.ts';
import { REGIONAL_LICENSE_OFFICES, licenseAuthorityFor } from '../src/engine/content/documents.ts';
import { placesIn } from '../src/engine/content/places.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  boostersDue, describeTeeth, dentistsIn, exitFee, licenseOfficesIn, officeHere, petCondition,
  phoneShopsIn, planOf, planPrice, teethOf, toothCondition, toothTrouble, treatmentsOffered,
  vetsIn, waitFor,
} from '../src/engine/systems/rooms.ts';

const problems = [];
const known = new Set(COUNTRIES.all().map((one) => one.id));

// --- Who pays for a filling ---------------------------------------------------

const seenCountries = new Set();
for (const regime of DENTAL_REGIMES) {
  if (!DENTAL_SYSTEM_LABEL[regime.system]) problems.push(`a regime is a "${regime.system}", which is not a system`);
  if (regime.patientShare < 0 || regime.patientShare > 1) problems.push(`a patient pays ${regime.patientShare} of it`);
  if (regime.about.length < 40) problems.push('a dental regime has nothing said about it');
  if (regime.countryIds.length === 0) problems.push('a dental regime applies nowhere');
  for (const countryId of regime.countryIds) {
    if (!known.has(countryId)) problems.push(`${countryId} has a dental regime and is not a country`);
    if (seenCountries.has(countryId)) problems.push(`${countryId} has two dental regimes`);
    seenCountries.add(countryId);
  }
  if (regime.freeUnder !== undefined && (regime.freeUnder < 12 || regime.freeUnder > 26)) {
    problems.push(`a country exempts under ${regime.freeUnder}s`);
  }
}
// The arrangements everybody in those countries knows about.
if (dentalIn('uk').system !== 'banded') problems.push('England is not carried as charging in bands');
if (dentalIn('uk').freeUnder !== 18) problems.push('England does not exempt under eighteens');
if (dentalIn('nl').system !== 'private') problems.push('Dutch adult dentistry is carried as covered');
if (dentalIn('nl').freeUnder !== 18) problems.push('Dutch children are not carried as covered');
if (dentalIn('jp').patientShare !== 0.3) problems.push('a Japanese patient does not pay thirty percent');
if (dentalIn('us').system !== 'insured_share') problems.push('American dental is not carried as its own policy');
if (dentalIn('ca').system !== 'insured_share') problems.push('Canadian dental is carried as inside medicare');
if (dentalIsCountrys('zz')) problems.push('a country with no regime is said to have one');
if (dentalIn('zz') !== GENERAL_DENTAL) problems.push('a country with no regime does not fall to the general one');
// The three bands go up, which is the whole point of there being three.
if (!(BAND_CHARGE[1] < BAND_CHARGE[2] && BAND_CHARGE[2] < BAND_CHARGE[3])) {
  problems.push('the three England bands are not in order');
}
if (!/bands/.test(DENTIST_NOTE)) problems.push('the note about who pays has gone');
if (!/three months/.test(RECALL_NOTE)) problems.push('the note about the recall interval has gone');
if (RECALL_SHORTEST_MONTHS >= RECALL_LONGEST_MONTHS) problems.push('the recall interval does not vary');

const seenTreatments = new Set();
for (const one of TREATMENTS) {
  if (seenTreatments.has(one.id)) problems.push(`${one.id} is listed twice`);
  seenTreatments.add(one.id);
  if (![0, 1, 2, 3].includes(one.band)) problems.push(`${one.label} is in band ${one.band}`);
  if (one.price <= 0) problems.push(`${one.label} costs nothing`);
  if (one.minutes < 5 || one.minutes > 180) problems.push(`${one.label} takes ${one.minutes} minutes`);
  if (one.about.length < 25) problems.push(`${one.label} has nothing said about it`);
  if (one.restores < 0 || one.restores > 60) problems.push(`${one.label} puts back ${one.restores}`);
}
// Whitening is cosmetic, which means nobody's system pays for it anywhere.
const whitening = TREATMENTS.find((one) => one.id === 'whitening');
if (whitening.band !== 0) problems.push('whitening is put in a band somebody would pay for');
for (const countryId of ['uk', 'de', 'jp', 'us', 'nl']) {
  if (toothPrice(whitening, countryId, 30) !== whitening.price) {
    problems.push(`${countryId} is said to pay toward whitening`);
  }
}
// A banded country charges the band, and a child pays nothing for treatment.
const filling = TREATMENTS.find((one) => one.id === 'filling');
if (toothPrice(filling, 'uk', 30) !== BAND_CHARGE[2]) problems.push('an English filling is not the band two charge');
if (toothPrice(filling, 'uk', 12) !== 0) problems.push('an English child pays for a filling');
if (toothPrice(filling, 'nl', 12) !== 0) problems.push('a Dutch child pays for a filling');
if (toothPrice(filling, 'nl', 30) <= toothPrice(filling, 'jp', 30)) {
  problems.push('a Dutch adult pays no more than a Japanese one');
}

// --- The vet ------------------------------------------------------------------

const seenGroups = new Set();
const seenGroupNames = new Set();
for (const group of VET_GROUPS) {
  if (seenGroups.has(group.id)) problems.push(`${group.id} is listed twice`);
  seenGroups.add(group.id);
  if (seenGroupNames.has(group.name)) problems.push(`${group.name} is listed twice`);
  seenGroupNames.add(group.name);
  if (group.countryIds.length === 0) problems.push(`${group.name} has practices nowhere`);
  for (const countryId of group.countryIds) {
    if (!known.has(countryId)) problems.push(`${group.name} trades in ${countryId}, which is not a country`);
  }
  if (group.about.length < 30) problems.push(`${group.name} has nothing said about it`);
}
if (VET_GROUPS.length < 10) problems.push(`only ${VET_GROUPS.length} veterinary groups`);
if (!vetGroupIsCountrys('uk')) problems.push('Britain has no veterinary group carried');
if (!vetGroupIsCountrys('us')) problems.push('America has no veterinary group carried');
if (vetGroupIsCountrys('zz')) problems.push('a country with none is said to have one');

// The microchipping law is the law, with the year it came in.
for (const [countryId, law] of Object.entries(CHIP_REQUIRED)) {
  if (!known.has(countryId)) problems.push(`${countryId} requires a chip and is not a country`);
  if (law.dogsFrom < 1990 || law.dogsFrom > 2026) problems.push(`${countryId} required dog chips from ${law.dogsFrom}`);
  if (law.catsFrom !== undefined && law.catsFrom < 1990) problems.push(`${countryId} required cat chips from ${law.catsFrom}`);
}
if (chipRequired('uk', 'dog') !== 2016) problems.push('British dog microchipping is not dated to 2016');
if (chipRequired('uk', 'cat') !== 2024) problems.push('English cat microchipping is not dated to 2024');
if (chipRequired('us', 'dog') !== undefined) problems.push('America is said to require microchipping nationally');
if (!/law/.test(CHIP_NOTE)) problems.push('the note about the chip has gone');

const seenVetServices = new Set();
for (const one of VET_SERVICES) {
  if (seenVetServices.has(one.id)) problems.push(`${one.id} is listed twice`);
  seenVetServices.add(one.id);
  if (one.price <= 0) problems.push(`${one.label} costs nothing`);
  if (one.minutes < 5 || one.minutes > 240) problems.push(`${one.label} takes ${one.minutes} minutes`);
  if (one.about.length < 25) problems.push(`${one.label} has nothing said about it`);
  if (one.lastsMonths !== undefined && (one.lastsMonths < 1 || one.lastsMonths > 36)) {
    problems.push(`${one.label} is good for ${one.lastsMonths} months`);
  }
}
if (OUT_OF_HOURS_MULTIPLE <= 1) problems.push('an emergency at two in the morning costs no more');
if (!/real companies/.test(VET_NOTE)) problems.push('the note about the practices has gone');

// --- The counter ----------------------------------------------------------------

const states = REGIONS.all().filter((one) => one.id.startsWith('us-'));
for (const state of states) {
  if (!REGIONAL_LICENSE_OFFICES[state.id]) problems.push(`${state.name} has no licensing office named`);
  const found = licenseAuthorityFor('us', state.id);
  if (!found) problems.push(`${state.name} resolves to no authority`);
  else if (found.office === 'State motor vehicle department') {
    problems.push(`${state.name} falls back to the general office instead of its own`);
  }
}
// A few everybody would recognize.
if (licenseAuthorityFor('us', 'us-ca')?.office !== 'California DMV') problems.push('California is not the DMV');
if (licenseAuthorityFor('us', 'us-ma')?.office !== 'Massachusetts RMV') problems.push('Massachusetts is not the RMV');
if (licenseAuthorityFor('us', 'us-mi')?.office !== 'Michigan Secretary of State') problems.push('Michigan is not the Secretary of State');
if (licenseAuthorityFor('uk')?.office !== 'Driver and Vehicle Licensing Agency') problems.push('Britain is not the DVLA');

const seenJobs = new Set();
for (const job of COUNTER_JOBS) {
  if (seenJobs.has(job.id)) problems.push(`${job.id} is listed twice`);
  seenJobs.add(job.id);
  if (job.fromAge < 12 || job.fromAge > 21) problems.push(`${job.label} starts at ${job.fromAge}`);
  if (job.minutes < 5 || job.minutes > 120) problems.push(`${job.label} takes ${job.minutes} minutes at the window`);
  if (job.fee < 0) problems.push(`${job.label} costs less than nothing`);
  if (job.about.length < 25) problems.push(`${job.label} has nothing said about it`);
}
if (counterJobsAt(12).length !== 0) problems.push('a twelve year old is offered business at the counter');
if (counterJobsAt(30).length !== COUNTER_JOBS.length) problems.push('an adult cannot do everything at the counter');
// An appointment really is quicker than turning up, at both ends of the range.
if (WAIT_MINUTES.appointment[1] >= WAIT_MINUTES.walk_in[0]) {
  problems.push('an appointment is no quicker than walking in');
}
if (WAIT_MINUTES.first_thing[1] >= WAIT_MINUTES.walk_in[1]) {
  problems.push('turning up first thing is no quicker than turning up at two');
}
for (const arrival of Object.keys(ARRIVAL_LABEL)) {
  if (!WAIT_MINUTES[arrival]) problems.push(`${arrival} has no wait carried`);
}
if (PAPERWORK_WRONG <= 0 || PAPERWORK_WRONG > 0.4) problems.push(`the paperwork is wrong ${PAPERWORK_WRONG} of the time`);
if (SENT_HOME.length < 4) problems.push('there are not enough ways to be sent home');
for (const line of SENT_HOME) {
  if (line.length < 25) problems.push(`a refusal is too short to be one: "${line}"`);
}
if (!/fifty one/.test(OFFICE_NOTE)) problems.push('the note about the office has gone');

// --- The phone shop --------------------------------------------------------------

const seenNetworks = new Set();
for (const network of NETWORKS) {
  if (seenNetworks.has(network.id)) problems.push(`${network.id} is listed twice`);
  seenNetworks.add(network.id);
  if (!NETWORK_KIND_LABEL[network.kind]) problems.push(`${network.name} is a "${network.kind}"`);
  if (network.countryIds.length === 0) problems.push(`${network.name} operates nowhere`);
  for (const countryId of network.countryIds) {
    if (!known.has(countryId)) problems.push(`${network.name} operates in ${countryId}, which is not a country`);
  }
  if (network.signal < 40 || network.signal > 100) problems.push(`${network.name} has a signal of ${network.signal}`);
  if (network.pricing < 0.2 || network.pricing > 2) problems.push(`${network.name} prices at ${network.pricing}`);
  if (network.about.length < 25) problems.push(`${network.name} has nothing said about it`);
}
if (NETWORKS.length < 50) problems.push(`only ${NETWORKS.length} networks carried`);
// The ones everybody in those countries would name.
for (const [countryId, name] of [
  ['us', 'Verizon'], ['uk', 'EE'], ['de', 'Deutsche Telekom'], ['fr', 'Orange'], ['jp', 'NTT Docomo'],
  ['kr', 'SK Telecom'], ['in', 'Jio'], ['au', 'Telstra'], ['ca', 'Rogers'], ['br', 'Vivo'],
  ['za', 'Vodacom'], ['ke', 'Safaricom'],
]) {
  if (!networksIn(countryId).some((one) => one.name === name)) {
    problems.push(`${name} is not carried as operating in ${countryId}`);
  }
}
// And nobody is sold a network from somewhere else.
if (networksIn('uk').some((one) => one.name === 'Verizon')) problems.push('Verizon is sold in Britain');
if (networksIn('us').some((one) => one.name === 'EE')) problems.push('EE is sold in America');
if (!networksAreCountrys('it')) problems.push('Italy has no network carried');
if (networksAreCountrys('zz')) problems.push('a country with none is said to have one');
// A network that rents somebody else's masts is carried as renting them.
const virtual = NETWORKS.filter((one) => one.kind === 'virtual');
if (virtual.length < 5) problems.push(`only ${virtual.length} networks carried as renting`);
for (const id of ['giffgaff', 'mint', 'congstar', 'koodo']) {
  if (NETWORKS.find((one) => one.id === id)?.kind !== 'virtual') {
    problems.push(`${id} is carried as running its own masts`);
  }
}
for (const id of ['verizon', 'ee', 'telekom_de', 'docomo', 'telstra']) {
  if (NETWORKS.find((one) => one.id === id)?.kind !== 'own_network') {
    problems.push(`${id} is carried as renting somebody else's masts`);
  }
}
if (TARIFFS.length < 3) problems.push('there are not enough ways to buy a plan');
for (const tariff of TARIFFS) {
  if (tariff.monthly <= 0) problems.push(`${tariff.label} costs nothing a month`);
  if (tariff.months < 0 || tariff.months > 36) problems.push(`${tariff.label} ties you in for ${tariff.months} months`);
  if (tariff.about.length < 30) problems.push(`${tariff.label} has nothing said about it`);
}
// Prepaid ties nobody in, which is the point of it.
if (TARIFFS.find((one) => one.id === 'prepaid').months !== 0) problems.push('pay as you go ties you in');
if (BAD_REPAIR <= 0 || BAD_REPAIR > 0.4) problems.push(`a repair goes wrong ${BAD_REPAIR} of the time`);
if (!/legal right/.test(PORTING_NOTE)) problems.push('the note about keeping your number has gone');

// --- A life it happens in ----------------------------------------------------------

for (const [birthYear, cityId] of [[2005, 'uk-eng-london'], [1995, 'us-ca-losangeles']]) {
  const sim = quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, `rooms-check-${birthYear}`);
  const where = `${cityId}`;
  // All four rooms are in a city of any size.
  for (const [rooms, what] of [
    [dentistsIn(sim), 'dental practice'], [vetsIn(sim), 'veterinary practice'],
    [licenseOfficesIn(sim), 'licensing office'], [phoneShopsIn(sim), 'phone shop'],
  ]) {
    if (rooms.length === 0) problems.push(`${where} has no ${what}`);
    for (const room of rooms) {
      if (!room.name || room.name === 'A Place') problems.push(`a ${what} in ${where} has no name`);
      if (!room.about || room.about.length < 20) problems.push(`a ${what} in ${where} has nothing said about it`);
    }
  }
  // The office over the door is the real one for that state or country.
  const expected = licenseAuthorityFor(cityId.split('-')[0], cityId.split('-').slice(0, 2).join('-'))?.office;
  if (officeHere(sim) !== expected) problems.push(`${where} does not name its own licensing office`);
  if (licenseOfficesIn(sim).some((one) => one.name !== expected)) {
    problems.push(`${where} has a licensing office with somebody else's name on it`);
  }

  // Teeth start somewhere, decay, and a treatment nobody needs is refused.
  const started = toothCondition(sim);
  if (started <= 0 || started > 100) problems.push(`${where} starts with teeth at ${started}`);
  if (toothTrouble(sim)) problems.push(`${where} starts with something already wrong`);
  if (treatmentsOffered(sim).some((one) => one.needsTrouble)) {
    problems.push(`${where} is offered a filling with nothing to fill`);
  }
  const practice = dentistsIn(sim)[0];
  sim.player.currentPlaceId = practice.id;
  if (sim.execute({ kind: 'room.dentist', payload: { placeId: practice.id, treatmentId: 'filling' } }).ok) {
    problems.push(`${where} was given a filling with nothing wrong`);
  }
  const exam = sim.execute({ kind: 'room.dentist', payload: { placeId: practice.id, treatmentId: 'exam' } });
  if (!exam.ok) problems.push(`${where} could not be examined: ${exam.error}`);
  else {
    if (exam.value.recall < RECALL_SHORTEST_MONTHS || exam.value.recall > RECALL_LONGEST_MONTHS) {
      problems.push(`${where} was asked back in ${exam.value.recall} months`);
    }
    if (!describeTeeth(sim).includes('month')) problems.push(`${where} has teeth the page cannot describe`);
  }
  // And a set of teeth nobody looks at gets worse rather than staying put.
  const after = toothCondition(sim);
  sim.advanceTo(sim.now + 400 * 24 * 60 * 60 * 1000);
  if (toothCondition(sim) >= after) problems.push(`${where} left their teeth a year and they did not get worse`);

  // The counter refuses a child and takes an adult, and the queue is a queue.
  const office = licenseOfficesIn(sim)[0];
  if (office) {
    sim.player.currentPlaceId = office.id;
    const quick = waitFor(sim, 'appointment', office);
    const slow = waitFor(sim, 'walk_in', office);
    if (quick > slow) problems.push(`${where} waits longer with an appointment than without one`);
    // Whether the paperwork is wrong is settled per day, so that being sent
    // home means come back another day rather than try again in a minute.
    // Sixty days is enough to see both answers without being a coin toss.
    let refused = 0;
    let taken = 0;
    for (let i = 0; i < 60; i += 1) {
      const res = sim.execute({ kind: 'room.counter', payload: { placeId: office.id, jobId: 'renew', arrival: 'appointment' } });
      if (!res.ok) { problems.push(`${where} could not use the counter: ${res.error}`); break; }
      if (res.value.done) taken += 1; else refused += 1;
      if (res.value.waited <= 0) problems.push(`${where} waited no time at all`);
      sim.advanceTo(sim.now + 24 * 60 * 60 * 1000);
    }
    if (taken === 0) problems.push(`${where} was never served at the counter`);
    if (refused === 0) problems.push(`${where} was never once sent home over the paperwork in sixty days`);
    // And twice on the same day is the same answer, because it is the same
    // wallet and the same forms.
    const first = sim.execute({ kind: 'room.counter', payload: { placeId: office.id, jobId: 'address', arrival: 'appointment' } });
    const again = sim.execute({ kind: 'room.counter', payload: { placeId: office.id, jobId: 'address', arrival: 'appointment' } });
    if (first.ok && again.ok && first.value.done !== again.value.done) {
      problems.push(`${where} got a different answer to the same paperwork on the same day`);
    }
  }

  // A plan is a plan, a child cannot sign one, and leaving early costs.
  const shop = phoneShopsIn(sim)[0];
  sim.player.currentPlaceId = shop.id;
  const countryId = cityId.split('-')[0];
  const network = networksIn(countryId)[0];
  if (!network) problems.push(`${where} has no network to buy from`);
  else {
    const foreign = NETWORKS.find((one) => !one.countryIds.includes(countryId));
    if (sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: foreign.id, tariffId: 'sim_only' } }).ok) {
      problems.push(`${where} was sold a plan on a network that does not operate there`);
    }
    const took = sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: network.id, tariffId: 'sim_only' } });
    if (!took.ok) problems.push(`${where} could not take a plan: ${took.error}`);
    else {
      if (took.value.monthly <= 0) problems.push(`${where} pays nothing a month`);
      if (sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: network.id, tariffId: 'prepaid' } }).ok) {
        problems.push(`${where} holds two plans at once`);
      }
      const plan = planOf(sim);
      if (!plan) problems.push(`${where} took a plan and is on none`);
      else {
        if (exitFee(sim, plan) <= 0) problems.push(`${where} can leave a twelve month contract on day one for nothing`);
        sim.advanceTo(sim.now + 400 * 24 * 60 * 60 * 1000);
        if (exitFee(sim, plan) !== 0) problems.push(`${where} still pays to leave after the tie in ran out`);
        const out = sim.execute({ kind: 'room.end_plan', payload: {} });
        if (!out.ok) problems.push(`${where} could not leave: ${out.error}`);
        if (planOf(sim)) problems.push(`${where} left and is still on it`);
      }
    }
  }
}

// A child cannot sign a contract and can buy a prepaid one.
{
  const sim = quickSave(
    { birthYear: 2013, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'rooms-child',
  );
  const shop = phoneShopsIn(sim)[0];
  sim.player.currentPlaceId = shop.id;
  const network = networksIn('uk')[0];
  if (sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: network.id, tariffId: 'sim_only' } }).ok) {
    problems.push('a child signed a twelve month contract');
  }
  const prepaid = sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: network.id, tariffId: 'prepaid' } });
  if (!prepaid.ok) problems.push(`a child could not buy pay as you go: ${prepaid.error}`);
}

// And nobody does any of it from the other side of town.
{
  const sim = quickSave(
    { birthYear: 1990, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'rooms-away',
  );
  const practice = dentistsIn(sim)[0];
  sim.player.currentPlaceId = undefined;
  const res = sim.execute({ kind: 'room.dentist', payload: { placeId: practice.id, treatmentId: 'exam' } });
  if (res.ok) problems.push('somebody was examined without being at the practice');
  if (!/n[o’]t at/.test(res.error ?? '')) problems.push('being somewhere else is refused for the wrong reason');
}

// --- Say what was measured -----------------------------------------------------------

console.log(`${DENTAL_REGIMES.length} dental arrangements covering ${seenCountries.size} countries, from three bands to a separate policy.`);
console.log(`${VET_GROUPS.length} real veterinary groups, and microchipping law carried for ${Object.keys(CHIP_REQUIRED).length} countries.`);
console.log(`${states.length} American states and the District, each with the name it really calls its licensing office.`);
console.log(`${NETWORKS.length} mobile networks, ${virtual.length} of which rent somebody else's masts.`);
console.log('The arrangements, the groups, the offices and the networks are public record. Every price, wait and outcome is SLATE’s own.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)].slice(0, 40)) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The rooms hold.');
