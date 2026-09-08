/**
 * SLATE — the last four ordinary rooms, played out.
 *
 * The dentist, the vet, the licensing office and the phone shop. Each one is
 * a place in the city you have to actually be standing in, a wait, somebody
 * behind a counter, and a thing that changes afterwards.
 *
 * What is real: who pays for dentistry where you are, the veterinary group
 * over the door, the core vaccines, the microchipping law, the name of the
 * licensing office for your state or country, and the network you buy a plan
 * from. What is SLATE's own: every price, every wait, and every outcome.
 */

import { CommandError, type Simulation } from '../core/simulation';
import type { Id, Person, PhonePlan, Teeth, PetHealth } from '../domain/model';
import type { Instant } from '../core/time';
import { MS_DAY, MS_MINUTE, addDays, addMonths, formatDate } from '../core/time';
import { clamp } from '../core/rng';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import { placesIn, type Place } from '../content/places';
import { countryOfCity, CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { ageOf } from './lifespan';
import { growingOf } from './growing';
import { PET_BY_ID } from '../content/growingup';
import { licenseAuthorityFor } from '../content/documents';
import {
  APPOINTMENT_DAYS, ARRIVAL_LABEL, type Arrival, BAD_REPAIR, BOOSTER_MONTHS, CHIP_NOTE,
  COUNTER_JOBS, COUNTER_JOB_BY_ID, type CounterJob, DENTAL_SYSTEM_LABEL,
  DENTIST_NOTE, DONE_AT_THE_COUNTER, HANDSET_NOTE, NETWORK_BY_ID, NETWORK_KIND_LABEL,
  NETWORKS, type Network, OFFICE_NOTE, OUT_OF_HOURS_MULTIPLE, OUT_OF_HOURS_NOTE,
  PAPERWORK_WRONG, PET_DECAY_A_MONTH, PET_HEALTH_START, PET_TROUBLE, PORTING_CODE_DAYS,
  PORTING_DAYS, PORTING_NOTE, QUEUE_NOTE, RECALL_LONGEST_MONTHS, RECALL_NOTE,
  RECALL_SHORTEST_MONTHS, SCREEN_REPAIR, SCREEN_REPAIR_MINUTES, SENT_HOME, TARIFFS,
  TARIFF_BY_ID, TEETH_DECAY_A_MONTH, TEETH_START, TEETH_TROUBLE, TOOTH_NOTE, TRADE_IN_SHARE,
  TREATMENTS, TREATMENT_BY_ID, type Treatment, VET_NOTE, VET_SERVICES, VET_SERVICE_BY_ID,
  type VetService, WAIT_MINUTES, chipRequired, counterJobsAt, dentalIn, dentalIsCountrys,
  networksAreCountrys, networksIn, toothPrice, vetGroupsIn, vetGroupIsCountrys,
} from '../content/rooms';

// ---------------------------------------------------------------------------
// The rooms themselves
// ---------------------------------------------------------------------------

export function dentistsIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'dentist');
}

export function vetsIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'vet');
}

export function licenseOfficesIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'license_office');
}

export function phoneShopsIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'phone_shop');
}

/** The country whose arrangements apply where somebody is standing. */
export function countryHere(sim: Simulation, person: Person = sim.player): string {
  return countryOfCity(person.currentLocationId) ?? person.citizenshipId;
}

/** Standing in the room is the price of admission to all four of them. */
function mustBeHere(sim: Simulation, place: Place | undefined, what: string): Place {
  if (!place) throw new CommandError(`That is not ${what} in this city.`);
  if (sim.player.currentPlaceId !== place.id) {
    throw new CommandError(`You are not at ${place.name}.`);
  }
  return place;
}

/** What a fee comes to where you are standing, which is not the same everywhere. */
function here(sim: Simulation, amount: Money): Money {
  return Math.round(amount * costOfLiving(sim.player.currentLocationId));
}

/** Taking the money, with the one message everybody gets when it is not there. */
function pay(sim: Simulation, amount: Money, memo: string, category: string, place: Place): void {
  if (amount <= 0) return;
  const accountId = sim.player.primaryAccountId;
  if (!accountId) throw new CommandError('You have no account to pay for it from.');
  if (sim.ledger.availableFunds(accountId) < amount) {
    throw new CommandError(`That is ${formatMoney(amount)}, and you do not have it.`);
  }
  sim.expense(accountId, amount, memo, category, { refType: 'place', refId: place.id });
}

// ---------------------------------------------------------------------------
// Teeth
// ---------------------------------------------------------------------------

/** The record of somebody's teeth, made the first time anybody looks at them. */
export function teethOf(sim: Simulation, personId: Id = sim.player.id): Teeth {
  sim.universe.teeth ??= {};
  const existing = sim.universe.teeth[personId];
  if (existing) return existing;
  const made: Teeth = {
    personId,
    condition: TEETH_START,
    checkedAt: sim.now,
    recallMonths: 6,
    treatments: [],
  };
  sim.universe.teeth[personId] = made;
  return made;
}

/**
 * What a set of teeth is worth right now.
 *
 * Lazily decayed rather than ticked, like form on the track: the number is
 * worked out from how long it has been since anybody looked, so a save that
 * sat closed for a year has the teeth it should have.
 */
export function toothCondition(sim: Simulation, personId: Id = sim.player.id): number {
  const teeth = teethOf(sim, personId);
  const months = (sim.now - teeth.checkedAt) / (MS_DAY * 30.4);
  return clamp(Math.round((teeth.condition - months * TEETH_DECAY_A_MONTH) * 10) / 10, 0, 100);
}

/** Whether something in there needs doing, which the practice will find. */
export function toothTrouble(sim: Simulation, personId: Id = sim.player.id): boolean {
  return toothCondition(sim, personId) < TEETH_TROUBLE;
}

/** When the practice asked to see them again. */
export function dueForCheckup(sim: Simulation, personId: Id = sim.player.id): Instant {
  const teeth = teethOf(sim, personId);
  return addMonths(teeth.checkedAt, teeth.recallMonths, sim.homeZone);
}

/** How this reads on a page. */
export function describeTeeth(sim: Simulation, personId: Id = sim.player.id): string {
  const condition = toothCondition(sim, personId);
  const word = condition >= 85 ? 'In good order'
    : condition >= 70 ? 'Fine'
      : condition >= TEETH_TROUBLE ? 'Due a look at'
        : condition >= 35 ? 'Something needs doing' : 'Something needs doing urgently';
  const teeth = teethOf(sim, personId);
  return `${word}. Last seen ${formatDate(teeth.checkedAt, sim.homeZone)}, `
    + `and they asked to see you again in ${plural(teeth.recallMonths, 'month')}.`;
}

/** What this practice can do for you today, given the state of things. */
export function treatmentsOffered(sim: Simulation, personId: Id = sim.player.id): Treatment[] {
  const trouble = toothTrouble(sim, personId);
  return TREATMENTS.filter((one) => !one.needsTrouble || trouble);
}

// ---------------------------------------------------------------------------
// The animal
// ---------------------------------------------------------------------------

/** The record for the animal a life produced, made the first time it is seen. */
export function petHealthOf(sim: Simulation, personId: Id = sim.player.id): PetHealth | undefined {
  const growing = growingOf(sim, personId);
  const pet = growing?.pet;
  if (!pet || pet.untilAt !== undefined) return undefined;
  sim.universe.petHealth ??= {};
  const existing = sim.universe.petHealth[personId];
  if (existing) return existing;
  const made: PetHealth = {
    personId,
    condition: PET_HEALTH_START,
    checkedAt: sim.now,
    chipped: false,
    treatments: [],
  };
  sim.universe.petHealth[personId] = made;
  return made;
}

/** How the animal actually is, decayed lazily from the last time anybody looked. */
export function petCondition(sim: Simulation, personId: Id = sim.player.id): number | undefined {
  const record = petHealthOf(sim, personId);
  if (!record) return undefined;
  const months = (sim.now - record.checkedAt) / (MS_DAY * 30.4);
  return clamp(Math.round((record.condition - months * PET_DECAY_A_MONTH) * 10) / 10, 0, 100);
}

/** Whether the boosters have run out, which they do every year. */
export function boostersDue(sim: Simulation, personId: Id = sim.player.id): boolean {
  const record = petHealthOf(sim, personId);
  if (!record) return true;
  if (record.boostedAt === undefined) return true;
  return sim.now > addMonths(record.boostedAt, BOOSTER_MONTHS, sim.homeZone);
}

/** Whether the law where you are standing wants this animal chipped. */
export function chipIsTheLaw(sim: Simulation, personId: Id = sim.player.id): number | undefined {
  const growing = growingOf(sim, personId);
  const kindId = growing?.pet?.kindId;
  if (kindId !== 'dog' && kindId !== 'cat') return undefined;
  return chipRequired(countryHere(sim), kindId);
}

/** What this practice would see you about today. */
export function vetServicesOffered(sim: Simulation, personId: Id = sim.player.id): VetService[] {
  const condition = petCondition(sim, personId);
  const trouble = condition !== undefined && condition < PET_TROUBLE;
  return VET_SERVICES.filter((one) => !one.needsTrouble || trouble);
}

/** Whose practice this is, where a real group runs it. */
export function vetGroupAt(place: Place, countryId: string): string | undefined {
  return vetGroupsIn(countryId).find((one) => one.name === place.name)?.name;
}

/** How the animal reads on a page. */
export function describePet(sim: Simulation, personId: Id = sim.player.id): string | undefined {
  const growing = growingOf(sim, personId);
  const pet = growing?.pet;
  if (!pet || pet.untilAt !== undefined) return undefined;
  const kind = PET_BY_ID[pet.kindId];
  const condition = petCondition(sim, personId) ?? PET_HEALTH_START;
  const word = condition >= 85 ? 'Well' : condition >= PET_TROUBLE ? 'All right' : 'Not right';
  const record = petHealthOf(sim, personId);
  return `${pet.name}, ${(kind?.label ?? 'an animal').toLowerCase()}. ${word}. `
    + `${record?.chipped ? 'Chipped' : 'Not chipped'}, and `
    + `${boostersDue(sim, personId) ? 'the boosters are due' : 'the boosters are up to date'}.`;
}

// ---------------------------------------------------------------------------
// The phone
// ---------------------------------------------------------------------------

/** The plan somebody is on, if they are on one. */
export function planOf(sim: Simulation, personId: Id = sim.player.id): PhonePlan | undefined {
  return Object.values(sim.universe.phonePlans ?? {})
    .find((one) => one.personId === personId && !one.endedAt);
}

/** Every plan they have ever been on, newest first. */
export function plansHeld(sim: Simulation, personId: Id = sim.player.id): PhonePlan[] {
  return Object.values(sim.universe.phonePlans ?? {})
    .filter((one) => one.personId === personId)
    .sort((a, b) => b.startedAt - a.startedAt);
}

/** What a plan on this network costs a month here. */
export function planPrice(sim: Simulation, network: Network, tariffId: string): Money {
  const tariff = TARIFF_BY_ID[tariffId];
  if (!tariff) return 0;
  return Math.round(tariff.monthly * network.pricing * costOfLiving(sim.player.currentLocationId));
}

/** What it costs to get out of one early, which is the thing nobody reads. */
export function exitFee(sim: Simulation, plan: PhonePlan): Money {
  const tariff = TARIFF_BY_ID[plan.tariffId];
  if (!tariff || tariff.months === 0) return 0;
  const ends = addMonths(plan.startedAt, tariff.months, sim.homeZone);
  if (sim.now >= ends) return 0;
  const monthsLeft = Math.max(0, (ends - sim.now) / (MS_DAY * 30.4));
  return Math.round(plan.monthly * monthsLeft * tariff.exitShare);
}

/** Whether the tie in has run out, which is when leaving is free. */
export function outOfContract(sim: Simulation, plan: PhonePlan): boolean {
  return exitFee(sim, plan) === 0;
}

/** How the plan reads on a page. */
export function describePlan(sim: Simulation, plan: PhonePlan): string {
  const network = NETWORK_BY_ID[plan.networkId];
  const tariff = TARIFF_BY_ID[plan.tariffId];
  const data = tariff && tariff.data > 0 ? `${tariff.data} GB` : 'as much data as you like';
  return `${tariff?.label ?? 'A plan'} on ${network?.name ?? 'a network'}, `
    + `${formatMoney(plan.monthly)} a month, ${data}. `
    + `${outOfContract(sim, plan) ? 'Out of contract, so you may leave whenever.' : `${formatMoney(exitFee(sim, plan))} to leave early.`}`;
}

/** The network whose shop this is, where it is a network's own shop. */
export function networkAt(place: Place, countryId: string): Network | undefined {
  return networksIn(countryId).find((one) => one.name === place.name);
}

// ---------------------------------------------------------------------------
// The counter
// ---------------------------------------------------------------------------

/** What the office where you are standing is actually called. */
export function officeHere(sim: Simulation): string {
  const city = CITIES.get(sim.player.currentLocationId);
  const found = licenseAuthorityFor(countryHere(sim), city?.parentId);
  return found?.office ?? 'The Licensing Office';
}

/** How long you stand about, given how you came. */
export function waitFor(sim: Simulation, arrival: Arrival, place: Place): number {
  const [low, high] = WAIT_MINUTES[arrival];
  const rng = sim.rng('rooms.queue', place.id, String(Math.floor(sim.now / MS_DAY)));
  return rng.int(low, high);
}

/** The appointments a counter has free, which are never soon. */
export function appointmentsAt(sim: Simulation, place: Place): Instant[] {
  const rng = sim.rng('rooms.appointments', place.id, String(Math.floor(sim.now / MS_DAY)));
  const [low, high] = APPOINTMENT_DAYS;
  return [rng.int(low, low + 6), rng.int(low + 7, high - 8), rng.int(high - 7, high)]
    .map((days) => addDays(sim.now, days, sim.homeZone));
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export function registerRooms(sim: Simulation): void {
  /** Sitting in the chair, which starts with somebody looking. */
  sim.onCommand<
    { placeId: string; treatmentId: string },
    { paid: Money; condition: number; recall: number; note: string }
  >(
    'room.dentist',
    (p, { sim: s }) => {
      const place = mustBeHere(s, dentistsIn(s).find((one) => one.id === p.placeId), 'a dental practice');
      const treatment = TREATMENT_BY_ID[p.treatmentId];
      if (!treatment) throw new CommandError('They do not do that here.');
      const teeth = teethOf(s);
      const condition = toothCondition(s);
      if (treatment.needsTrouble && condition >= TEETH_TROUBLE) {
        throw new CommandError(`There is nothing in there that needs ${treatment.label.toLowerCase()}. They will not do it.`);
      }
      const countryId = countryHere(s);
      const age = ageOf(s);
      const paid = here(s, toothPrice(treatment, countryId, age));
      pay(s, paid, `${treatment.label} — ${place.name}`, 'health', place);

      // The examination is the one that resets the clock and sets the recall;
      // everything else is work done on the day.
      teeth.condition = clamp(condition + treatment.restores, 0, 100);
      if (treatment.id === 'exam') {
        teeth.checkedAt = s.now;
        // NICE really does set the interval by how much trouble the teeth
        // give, rather than by the calendar. Good teeth get asked back less.
        teeth.recallMonths = teeth.condition >= 88 ? RECALL_LONGEST_MONTHS
          : teeth.condition >= 78 ? 12
            : teeth.condition >= 66 ? 6
              : RECALL_SHORTEST_MONTHS;
      } else {
        // Anything else still counts as having been looked at today.
        teeth.checkedAt = s.now;
      }
      teeth.treatments = [...teeth.treatments, { id: treatment.id, at: s.now, paid }].slice(-40);
      s.advanceTo(s.now + treatment.minutes * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - 6, 0, 100);
      if (treatment.needsTrouble) {
        s.player.wellbeing.stress = clamp((s.player.wellbeing.stress ?? 20) + 8, 0, 100);
      }
      const regime = dentalIn(countryId);
      const free = regime.freeUnder !== undefined && age < regime.freeUnder && treatment.band !== 0;
      s.emit('room.dentist', { placeId: place.id, treatmentId: treatment.id, paid });
      return {
        paid,
        condition: teeth.condition,
        recall: teeth.recallMonths,
        note: `${treatment.label} at ${place.name}. `
          + `${free ? 'Nothing to pay: you are under the age that pays here.' : `${formatMoney(paid)}.`} `
          + `${treatment.id === 'exam' ? `They want to see you again in ${plural(teeth.recallMonths, 'month')}.` : treatment.about}`,
      };
    },
  );

  /** The vet, which is the same shape and a different animal. */
  sim.onCommand<
    { placeId: string; serviceId: string; outOfHours?: boolean },
    { paid: Money; condition: number; note: string }
  >(
    'room.vet',
    (p, { sim: s }) => {
      const place = mustBeHere(s, vetsIn(s).find((one) => one.id === p.placeId), 'a veterinary practice');
      const growing = growingOf(s);
      const pet = growing?.pet;
      if (!pet || pet.untilAt !== undefined) throw new CommandError('You have no animal to take anywhere.');
      const service = VET_SERVICE_BY_ID[p.serviceId];
      if (!service) throw new CommandError('They do not do that here.');
      const record = petHealthOf(s)!;
      const condition = petCondition(s) ?? PET_HEALTH_START;
      if (service.needsTrouble && condition >= PET_TROUBLE) {
        throw new CommandError(`${pet.name} is well. There is nothing to treat.`);
      }
      if (service.id === 'chip' && record.chipped) {
        throw new CommandError(`${pet.name} is already chipped. The number does not need a second one.`);
      }
      if (service.id === 'neuter' && record.neuteredAt !== undefined) {
        throw new CommandError(`${pet.name} has already been done.`);
      }
      const outOfHours = p.outOfHours === true || service.id === 'emergency';
      const paid = Math.round(here(s, service.price) * (outOfHours ? OUT_OF_HOURS_MULTIPLE : 1));
      pay(s, paid, `${service.label} — ${place.name}`, 'health', place);

      record.condition = clamp(condition + service.restores, 0, 100);
      record.checkedAt = s.now;
      if (service.id === 'chip') record.chipped = true;
      if (service.id === 'neuter') record.neuteredAt = s.now;
      if (service.id === 'vaccination') record.boostedAt = s.now;
      record.treatments = [...record.treatments, { id: service.id, at: s.now, paid }].slice(-40);
      s.advanceTo(s.now + service.minutes * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - 5, 0, 100);
      if (service.needsTrouble) {
        s.player.wellbeing.stress = clamp((s.player.wellbeing.stress ?? 20) + 10, 0, 100);
      }
      const law = chipIsTheLaw(s);
      s.emit('room.vet', { placeId: place.id, serviceId: service.id, paid });
      return {
        paid,
        condition: record.condition,
        note: `${service.label} for ${pet.name} at ${place.name}. ${formatMoney(paid)}`
          + `${outOfHours ? ', which is what out of hours costs' : ''}. `
          + `${service.id === 'chip' && law !== undefined ? `Required by law here since ${law}.` : service.about}`,
      };
    },
  );

  /** The counter, where the paperwork can simply be wrong. */
  sim.onCommand<
    { placeId: string; jobId: string; arrival?: Arrival },
    { paid: Money; waited: number; done: boolean; note: string }
  >(
    'room.counter',
    (p, { sim: s }) => {
      const place = mustBeHere(s, licenseOfficesIn(s).find((one) => one.id === p.placeId), 'a licensing office');
      const job = COUNTER_JOB_BY_ID[p.jobId];
      if (!job) throw new CommandError('They do not do that at this counter.');
      const age = ageOf(s);
      if (age < job.fromAge) {
        throw new CommandError(`${job.label} is not something somebody of ${age} does. ${job.fromAge} is the age for it.`);
      }
      const arrival = p.arrival ?? 'walk_in';
      const waited = waitFor(s, arrival, place);
      s.advanceTo(s.now + (waited + job.minutes) * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - Math.round(waited / 12), 0, 100);

      // The paperwork. A fussy job can be wrong, and being sent home costs the
      // morning and nothing else, because they have not done anything yet.
      const rng = s.rng('rooms.counter', place.id, job.id, String(Math.floor(s.now / MS_DAY)));
      if (job.fussy && rng.float(0, 1) < PAPERWORK_WRONG) {
        s.player.wellbeing.stress = clamp((s.player.wellbeing.stress ?? 20) + 12, 0, 100);
        s.emit('room.counter_refused', { placeId: place.id, jobId: job.id });
        return {
          paid: 0,
          waited,
          done: false,
          note: `${plural(waited, 'minute')} in the queue at ${place.name}, and then: `
            + `“${rng.pick(SENT_HOME)}” Nothing paid, and you will have to come back.`,
        };
      }

      const paid = here(s, job.fee);
      pay(s, paid, `${job.label} — ${place.name}`, 'personal', place);
      s.remember({
        category: 'life',
        title: job.label,
        detail: `${place.name}. ${plural(waited, 'minute')} of queue.`,
        refs: [{ type: 'place', id: place.id }],
        significance: 2,
        public: false,
      });
      s.emit('room.counter', { placeId: place.id, jobId: job.id, paid, waited });
      return {
        paid,
        waited,
        done: true,
        note: `${plural(waited, 'minute')} in the queue at ${place.name}. `
          + `“${rng.pick(DONE_AT_THE_COUNTER)}”`
          + `${paid > 0 ? ` ${formatMoney(paid)}.` : ''}`,
      };
    },
  );

  /** Taking out a plan, which is the phone shop's whole business. */
  sim.onCommand<
    { placeId: string; networkId: string; tariffId: string; keepNumber?: boolean },
    { monthly: Money; network: string; keptNumber: boolean; note: string }
  >(
    'room.take_plan',
    (p, { sim: s }) => {
      const place = mustBeHere(s, phoneShopsIn(s).find((one) => one.id === p.placeId), 'a phone shop');
      const countryId = countryHere(s);
      const network = networksIn(countryId).find((one) => one.id === p.networkId);
      if (!network) throw new CommandError('That network does not operate here.');
      const tariff = TARIFF_BY_ID[p.tariffId];
      if (!tariff) throw new CommandError('That is not one of the plans.');
      const age = ageOf(s);
      // A contract is a contract, so a child cannot sign one. Prepaid needs
      // nobody's signature, which is exactly why it exists.
      if (tariff.months > 0 && age < 18) {
        throw new CommandError('Nobody under eighteen signs a contract. Pay as you go needs no signature.');
      }
      const existing = planOf(s);
      if (existing) {
        throw new CommandError(`You are on ${NETWORK_BY_ID[existing.networkId]?.name ?? 'a plan'} already. End that one first.`);
      }
      const monthly = planPrice(s, network, tariff.id);
      // The first month is taken in the shop, which is how it really works.
      pay(s, monthly, `${network.name} — First Month`, 'personal', place);

      const keptNumber = p.keepNumber === true && plansHeld(s).length > 0;
      const plan: PhonePlan = {
        id: s.nextId('plan'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        networkId: network.id,
        tariffId: tariff.id,
        monthly,
        startedAt: s.now,
        numberMovesAt: keptNumber ? addDays(s.now, PORTING_DAYS, s.homeZone) : undefined,
      };
      s.universe.phonePlans ??= {};
      s.universe.phonePlans[plan.id] = plan;
      s.advanceTo(s.now + 40 * MS_MINUTE);
      s.emit('room.plan_taken', { planId: plan.id, networkId: network.id, tariffId: tariff.id });
      return {
        monthly,
        network: network.name,
        keptNumber,
        note: `${tariff.label} on ${network.name}, ${formatMoney(monthly)} a month. `
          + `${NETWORK_KIND_LABEL[network.kind]}. `
          + `${keptNumber ? `Your number moves across tomorrow; the code is good for ${PORTING_CODE_DAYS} days.` : 'A new number, live now.'}`,
      };
    },
  );

  /** Getting out of one, which costs what the small print said it would. */
  sim.onCommand<Record<string, never>, { paid: Money; note: string }>(
    'room.end_plan',
    (_p, { sim: s }) => {
      const plan = planOf(s);
      if (!plan) throw new CommandError('You are not on a plan.');
      const network = NETWORK_BY_ID[plan.networkId];
      const paid = exitFee(s, plan);
      if (paid > 0) {
        const accountId = s.player.primaryAccountId;
        if (!accountId) throw new CommandError('You have no account to pay the exit fee from.');
        if (s.ledger.availableFunds(accountId) < paid) {
          throw new CommandError(`Leaving early is ${formatMoney(paid)}, and you do not have it.`);
        }
        s.expense(accountId, paid, `${network?.name ?? 'A network'} — Early Exit`, 'personal', {
          refType: 'person', refId: s.player.id,
        });
      }
      plan.endedAt = s.now;
      s.emit('room.plan_ended', { planId: plan.id, paid });
      return {
        paid,
        note: paid > 0
          ? `Out of ${network?.name ?? 'the plan'} early. ${formatMoney(paid)}, which is what the small print said.`
          : `Out of ${network?.name ?? 'the plan'}. Nothing to pay: the tie in had run out.`,
      };
    },
  );

  /** And the other half of a phone shop, which is mending the one you have. */
  sim.onCommand<
    { placeId: string },
    { paid: Money; wentWell: boolean; note: string }
  >(
    'room.repair_phone',
    (p, { sim: s }) => {
      const place = mustBeHere(s, phoneShopsIn(s).find((one) => one.id === p.placeId), 'a phone shop');
      const paid = here(s, SCREEN_REPAIR);
      pay(s, paid, `A Screen Repair — ${place.name}`, 'personal', place);
      s.advanceTo(s.now + SCREEN_REPAIR_MINUTES * MS_MINUTE);
      const rng = s.rng('rooms.repair', place.id, String(s.now));
      const wentWell = rng.float(0, 1) > BAD_REPAIR;
      s.emit('room.phone_repaired', { placeId: place.id, paid, wentWell });
      return {
        paid,
        wentWell,
        note: wentWell
          ? `An hour and a half, ${formatMoney(paid)}, and it looks like it did out of the box.`
          : `An hour and a half and ${formatMoney(paid)}, and the touch is not quite right at the top. `
            + 'They will look at it again if you bring it back.',
      };
    },
  );
}

export {
  ARRIVAL_LABEL, CHIP_NOTE, COUNTER_JOBS, DENTAL_SYSTEM_LABEL, DENTIST_NOTE, HANDSET_NOTE,
  NETWORKS, NETWORK_BY_ID, NETWORK_KIND_LABEL, OFFICE_NOTE, OUT_OF_HOURS_NOTE, PORTING_NOTE,
  QUEUE_NOTE, RECALL_NOTE, TARIFFS, TARIFF_BY_ID, TOOTH_NOTE, TRADE_IN_SHARE, TREATMENTS,
  VET_NOTE, VET_SERVICES, counterJobsAt, dentalIn, dentalIsCountrys, networksAreCountrys,
  networksIn, toothPrice, vetGroupIsCountrys, vetGroupsIn,
  type Arrival, type CounterJob, type Network, type Treatment, type VetService,
};
