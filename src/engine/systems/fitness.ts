/**
 * SLATE — training.
 *
 * A gym is a place with a door, hours, a price on the wall and things in it.
 * You walk in with a pass or you buy one; you do sets of something at a
 * chosen effort and it costs energy now and pays fitness later; a trainer
 * halves the chance of hurting yourself and remembers what you told them;
 * you are sore tomorrow, and it shows in your readiness until it fades.
 *
 * Every number here is committed by a command. The scene that plays it out
 * decides what to ask; this decides what it costs and what it does, and it
 * keeps the workout in progress itself rather than trusting a screen to
 * report what was done.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { MS_DAY, MS_MINUTE, addDays, formatDate, formatTime, instantFromZoned, zonedParts } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { clamp, remap } from '../core/rng';
import type { Id, Membership, MembershipProduct, Person, TrainingRecord, Workout, WorkoutBlock, WorkoutFocus, WorkoutIntensity } from '../domain/model';
import { CITIES } from '../content/geography';
import { placesIn, type Place } from '../content/places';
import { costOfLiving } from '../content/tax';
import {
  CLASS_BY_ID, EXERCISE_BY_ID, INTENSITY, PERIOD_DAYS, gymProfile, hoursLabel, isOpenAt,
  type ClassDef, type GymProfile,
} from '../content/fitness';
import { readiness } from './life';
import { rememberFact } from './memory';
import { createRelationship, findRelationship } from './relationships';
import { makeBackgroundPerson, peopleOf } from './people';

export const WORKOUTS_KEPT = 200;
/** The refusals the scene and the system both give, stated once. */
export const TOO_TIRED_TO_TRAIN = 'You have nothing to train with. Eat and sleep first.';
export const WORKOUT_ELSEWHERE = 'You have a workout under way somewhere else. Finish that first.';
export const MAX_SETS = 6;
export const MAX_BLOCKS = 12;

const PRODUCT_LABEL: Readonly<Record<MembershipProduct, string>> = {
  day_pass: 'Day Pass', monthly: 'Monthly Membership', annual: 'Annual Membership',
};

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** A gym in the city the player is in, or nothing. */
export function gymHere(sim: Simulation, placeId: string): Place | undefined {
  return placesIn(sim.player.currentLocationId).find((p) => p.id === placeId && p.kind === 'gym');
}

export function gymAt(sim: Simulation, placeId: string): { place: Place; profile: GymProfile } {
  const place = gymHere(sim, placeId);
  if (!place) throw new CommandError('There is no such gym in this city.');
  return { place, profile: gymProfile(place) };
}

export function membershipsOf(sim: Simulation, personId: Id): Membership[] {
  return Object.values(sim.universe.memberships)
    .filter((m) => m.personId === personId)
    .sort((a, b) => b.startsAt - a.startsAt);
}

/** The pass that covers this gym right now, if any. Canceled ones still count until they end. */
export function membershipFor(sim: Simulation, personId: Id, placeId: string, at: number = sim.now): Membership | undefined {
  return Object.values(sim.universe.memberships).find((m) =>
    m.personId === personId && m.placeId === placeId
    && (m.status === 'active' || m.status === 'cancelled')
    && m.startsAt <= at && at < m.endsAt);
}

export function trainingOf(person: Person): TrainingRecord {
  return (person.training ??= { soreness: 0, lifts: {}, sessions: 0 });
}

export function localHour(sim: Simulation): number {
  const parts = zonedParts(sim.now, sim.zone);
  return parts.hour + parts.minute / 60;
}

export function isGymOpen(sim: Simulation, profile: GymProfile): boolean {
  return isOpenAt(profile.hours, Math.floor(localHour(sim)));
}

export function workoutsOf(sim: Simulation, personId: Id, limit = 20): Workout[] {
  return Object.values(sim.universe.workouts)
    .filter((w) => w.personId === personId)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}

/** Classes starting within the next three-quarters of an hour, or the next one today. */
export function classesSoon(sim: Simulation, profile: GymProfile): { def: ClassDef; startsAt: number; soon: boolean }[] {
  const parts = zonedParts(sim.now, sim.zone);
  const out: { def: ClassDef; startsAt: number; soon: boolean }[] = [];
  for (const def of profile.classes) {
    for (const hour of def.startHours) {
      const startsAt = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour }, sim.zone);
      if (startsAt < sim.now - 10 * MS_MINUTE) continue;
      if (!isOpenAt(profile.hours, hour)) continue;
      out.push({ def, startsAt, soon: startsAt <= sim.now + 45 * MS_MINUTE });
      break;
    }
  }
  return out.sort((a, b) => a.startsAt - b.startsAt);
}

/** The trainers who work at a gym. Made once, then the same people every time. */
export function ensureTrainers(sim: Simulation, placeId: string): Person[] {
  const key = `trainer:${placeId}`;
  const existing = peopleOf(sim, key);
  if (existing.length >= 2) return existing;
  const { place } = gymAt(sim, placeId);
  const made: Person[] = [...existing];
  for (let i = existing.length; i < 2; i++) {
    const rng = sim.rng('trainer', placeId, i);
    made.push(makeBackgroundPerson(sim, {
      rng, archetype: key, industryRole: 'personal_trainer', cityId: place.cityId,
      background: `Personal trainer at ${place.name}.`,
      interests: ['training', rng.pick(['running', 'climbing', 'cooking', 'surfing', 'boxing', 'yoga'])],
      skills: { fitness: rng.int(72, 96) },
      age: [26, 46],
      personality: { conscientiousness: rng.int(60, 95), extraversion: rng.int(55, 90) },
    }));
  }
  return made;
}

/** The trainers already made for a gym. Reads only; a view must not create people. */
export function trainersAt(sim: Simulation, placeId: string): Person[] {
  return peopleOf(sim, `trainer:${placeId}`);
}

export function trainerAt(sim: Simulation, placeId: string, trainerId: Id): Person {
  const trainer = sim.universe.people[trainerId];
  if (!trainer || trainer.archetype !== `trainer:${placeId}`) throw new CommandError('They do not work here.');
  return trainer;
}

/** The trainer currently paid for at this gym, if the booking still stands. */
export function bookedTrainer(sim: Simulation, person: Person, placeId: string): Person | undefined {
  const booking = person.training?.trainer;
  if (!booking || booking.placeId !== placeId || booking.until < sim.now) return undefined;
  return sim.universe.people[booking.personId];
}

function nextMorning(sim: Simulation): number {
  const parts = zonedParts(sim.now, sim.zone);
  const today = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: 7 }, sim.zone);
  return today > sim.now ? today : addDays(today, 1, sim.zone);
}

function requirePresent(sim: Simulation, placeId: string): { place: Place; profile: GymProfile } {
  const found = gymAt(sim, placeId);
  if (sim.player.currentPlaceId !== placeId) throw new CommandError(`You are not at ${found.place.name}. Walk in first.`);
  if (!isGymOpen(sim, found.profile)) throw new CommandError(`${found.place.name} is closed. ${hoursLabel(found.profile.hours)}.`);
  return found;
}

function pay(sim: Simulation, amount: Money, memo: string, refs: { refType: string; refId: Id }, accountId?: Id): Id {
  const account = accountId ?? sim.player.primaryAccountId;
  if (!account) throw new CommandError('No account to pay from.');
  if (sim.ledger.availableFunds(account) < amount) {
    throw new CommandError(`That is ${formatMoney(amount)} and you cannot cover it right now.`);
  }
  if (amount > 0) sim.expense(account, amount, memo, 'lifestyle', refs);
  return account;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerFitness(sim: Simulation): void {
  // --- Soreness fades overnight --------------------------------------------
  sim.onSchedule('fitness.recovery', () => {
    const person = sim.player;
    const training = person.training;
    if (!training || training.soreness <= 0) return;
    const before = training.soreness;
    training.soreness = clamp(training.soreness - (30 + person.wellbeing.fitness / 4), 0, 100);
    if (training.soreness > 0) {
      training.sorenessUntil = nextMorning(sim);
      sim.schedule({ at: training.sorenessUntil, kind: 'fitness.recovery', label: 'Recovery', category: 'system', priority: 94 });
    } else {
      training.sorenessUntil = undefined;
      if (before >= 40) {
        sim.notify({ category: 'health', title: 'Recovered', body: 'The soreness has gone. You are ready to train again.', importance: 15, route: '/workspace/wellbeing' });
      }
    }
  });

  // --- A pass runs out -------------------------------------------------------
  sim.onSchedule('gym.membership_end', (item) => {
    const membership = sim.universe.memberships[item.payload['membershipId'] as Id];
    if (!membership) return;
    if (membership.endsAt > sim.now) return; // renewed since this was set
    if (membership.status === 'active' && membership.billId) {
      membership.status = 'lapsed';
      const bill = sim.universe.bills[membership.billId];
      if (bill) bill.active = false;
      sim.notify({ category: 'finance', title: 'Membership Lapsed', body: `${membership.gymName} did not get paid, and your membership has lapsed.`, importance: 45, route: '/workspace/wellbeing' });
    } else if (membership.status === 'active' || membership.status === 'cancelled') {
      membership.status = 'expired';
      if (membership.product !== 'day_pass') {
        sim.notify({ category: 'life', title: 'Membership Ended', body: `Your membership at ${membership.gymName} has ended.`, importance: 25, route: '/workspace/wellbeing' });
      }
    }
  });

  // --- The bill behind a membership ---------------------------------------
  sim.onEvent('finance.bill_paid', 'gym.renew', (event, { sim: s }) => {
    const { billId } = event.payload as { billId: Id };
    const membership = Object.values(s.universe.memberships).find((m) => m.billId === billId);
    if (!membership || membership.status !== 'active') return;
    membership.endsAt += PERIOD_DAYS[membership.product] * MS_DAY;
    s.timeline.cancelFor('membership', membership.id, s.now);
    s.schedule({
      at: membership.endsAt + 2 * 60 * MS_MINUTE, kind: 'gym.membership_end',
      label: `${membership.gymName} Membership`, category: 'system', priority: 120,
      payload: { membershipId: membership.id }, refType: 'membership', refId: membership.id,
    });
  });

  sim.onEvent('finance.bill_missed', 'gym.lapse', (event, { sim: s }) => {
    const { billId, missedCount } = event.payload as { billId: Id; missedCount: number };
    const membership = Object.values(s.universe.memberships).find((m) => m.billId === billId);
    if (!membership || membership.status !== 'active' || missedCount < 2) return;
    membership.status = 'lapsed';
    const bill = s.universe.bills[billId];
    if (bill) bill.active = false;
    s.notify({ category: 'finance', title: 'Membership Lapsed', body: `${membership.gymName} has lapsed your membership after two missed payments.`, importance: 50, route: '/workspace/bank' });
  });

  // --- Buying a pass --------------------------------------------------------
  sim.onCommand<{ placeId: string; product: MembershipProduct; accountId?: Id }, { membershipId: Id; cost: Money; endsAt: number }>(
    'gym.buy_pass',
    (p, { sim: s }) => {
      const person = s.player;
      const { place, profile } = gymAt(s, p.placeId);
      if (!(p.product in PRODUCT_LABEL)) throw new CommandError('Choose a day pass, a monthly or an annual membership.');
      const covering = membershipFor(s, person.id, place.id);
      if (covering) throw new CommandError(`You already have a ${PRODUCT_LABEL[covering.product].toLowerCase()} at ${place.name} that covers now.`);
      const cost = p.product === 'day_pass' ? profile.dayPass : p.product === 'monthly' ? profile.monthly : profile.annual;
      const id = s.nextId('membership');
      const accountId = pay(s, cost, `${place.name} — ${PRODUCT_LABEL[p.product]}`, { refType: 'membership', refId: id }, p.accountId);
      const endsAt = s.now + PERIOD_DAYS[p.product] * MS_DAY;
      const membership: Membership = {
        id, saveId: s.universe.meta.id, personId: person.id,
        placeId: place.id, gymName: place.name, product: p.product, price: cost,
        startsAt: s.now, endsAt, status: 'active', visits: 0,
      };
      if (p.product !== 'day_pass') {
        const { billId } = s.must<{ billId: Id }>({
          kind: 'finance.create_bill',
          payload: {
            payerId: person.id, name: `${place.name} Membership`, category: 'lifestyle', amount: cost,
            frequency: p.product === 'monthly' ? 'monthly' : 'annual', firstDueAt: endsAt,
            autopayAccountId: accountId, refType: 'membership', refId: id,
          },
        });
        membership.billId = billId;
      }
      s.universe.memberships[id] = membership;
      s.schedule({
        at: endsAt + 2 * 60 * MS_MINUTE, kind: 'gym.membership_end',
        label: `${place.name} ${PRODUCT_LABEL[p.product]}`, category: 'system', priority: 120,
        payload: { membershipId: id }, refType: 'membership', refId: id,
      });
      s.remember({
        category: 'life', title: `${PRODUCT_LABEL[p.product]} At ${place.name}`,
        detail: `${formatMoney(cost)}. ${p.product === 'day_pass' ? 'Good for twenty-four hours.' : `Renews ${formatDate(endsAt, s.homeZone)}.`}`,
        refs: [{ type: 'person', id: person.id }, { type: 'membership', id }],
        significance: p.product === 'day_pass' ? 5 : 14, public: false, amount: cost,
      });
      s.emit('gym.pass_bought', { membershipId: id, placeId: place.id, product: p.product, cost });
      return { membershipId: id, cost, endsAt };
    },
  );

  sim.onCommand<{ membershipId: Id }, { endsAt: number }>(
    'gym.cancel_membership',
    (p, { sim: s }) => {
      const membership = s.universe.memberships[p.membershipId];
      if (!membership || membership.personId !== s.player.id) throw new CommandError('No such membership.');
      if (membership.status !== 'active') throw new CommandError('That membership is not running.');
      if (membership.product === 'day_pass') throw new CommandError('A day pass is not something you cancel; it runs out.');
      membership.status = 'cancelled';
      membership.cancelledAt = s.now;
      if (membership.billId) {
        const bill = s.universe.bills[membership.billId];
        if (bill) bill.active = false;
        s.timeline.cancelFor('bill', membership.billId, s.now);
      }
      s.remember({
        category: 'life', title: `Canceled ${membership.gymName}`,
        detail: `Usable until ${formatDate(membership.endsAt, s.homeZone)}, then nothing more is charged.`,
        refs: [{ type: 'membership', id: membership.id }], significance: 8, public: false,
      });
      return { endsAt: membership.endsAt };
    },
  );

  // --- Through the door -----------------------------------------------------
  sim.onCommand<{ placeId: string }, { membershipId: Id; product: MembershipProduct; visits: number }>(
    'gym.check_in',
    (p, { sim: s }) => {
      const person = s.player;
      const { place } = requirePresent(s, p.placeId);
      const membership = membershipFor(s, person.id, place.id);
      if (!membership) throw new CommandError(`You have no pass at ${place.name}. A day pass or a membership gets you in.`);
      if (person.wellbeing.energy < 12) throw new CommandError(TOO_TIRED_TO_TRAIN);
      const training = trainingOf(person);
      if (training.current && training.current.placeId !== place.id) {
        throw new CommandError(WORKOUT_ELSEWHERE);
      }
      membership.visits += 1;
      ensureTrainers(s, place.id);
      training.current ??= { placeId: place.id, startedAt: s.now, focus: 'strength', blocks: [], cost: 0, injured: false, effects: {} };
      s.emit('gym.checked_in', { placeId: place.id, membershipId: membership.id });
      return { membershipId: membership.id, product: membership.product, visits: membership.visits };
    },
  );

  // --- A trainer for the session --------------------------------------------
  sim.onCommand<{ placeId: string; trainerId: Id; minutes: number; accountId?: Id }, { cost: Money; until: number; trainerName: string }>(
    'gym.hire_trainer',
    (p, { sim: s }) => {
      const person = s.player;
      const { place, profile } = requirePresent(s, p.placeId);
      const trainer = trainerAt(s, place.id, p.trainerId);
      const minutes = p.minutes;
      if (!Number.isInteger(minutes) || minutes < 30 || minutes > 120) throw new CommandError('A session is between thirty minutes and two hours.');
      const cost = Math.round(profile.trainerHourly * minutes / 60);
      pay(s, cost, `${trainer.displayName} — training session`, { refType: 'person', refId: trainer.id }, p.accountId);
      const training = trainingOf(person);
      training.trainer = { personId: trainer.id, placeId: place.id, until: s.now + minutes * MS_MINUTE };
      if (training.current) training.current.trainerId = trainer.id;
      if (training.current) training.current.cost += cost;
      if (!findRelationship(s, person.id, trainer.id)) {
        createRelationship(s, person.id, trainer.id, 'acquaintance', { context: `trainer at ${place.name}` });
      }
      rememberFact(s, trainer.id, {
        kind: 'meeting', aboutId: person.id, text: `Trained ${person.displayName} at ${place.name} on ${formatDate(s.now, s.homeZone)}.`,
        weight: 35, expiresAt: s.now + 120 * MS_DAY, sourceKind: 'training', refType: 'person', refId: person.id,
      });
      return { cost, until: training.trainer.until, trainerName: trainer.displayName };
    },
  );

  // --- A block of work -------------------------------------------------------
  sim.onCommand<
    { placeId: string; exerciseId: string; sets: number; intensity: WorkoutIntensity; focus?: WorkoutFocus },
    { minutes: number; effects: Record<string, number>; progressed: boolean; injured: boolean; best: number; unit: string; note: string }
  >(
    'gym.train_block',
    (p, { sim: s }) => {
      const person = s.player;
      const { place, profile } = requirePresent(s, p.placeId);
      const exercise = EXERCISE_BY_ID[p.exerciseId];
      if (!exercise) throw new CommandError('No such exercise.');
      if (!profile.facilities.includes(exercise.facility)) throw new CommandError(`${place.name} has no ${exercise.facility === 'pool' ? 'pool' : exercise.facility} for that.`);
      const level = INTENSITY[p.intensity];
      if (!level) throw new CommandError('Choose easy, steady or hard.');
      const sets = p.sets;
      if (!Number.isInteger(sets) || sets < 1 || sets > MAX_SETS) throw new CommandError(`Between one and ${MAX_SETS} sets.`);
      const training = trainingOf(person);
      if (!training.current || training.current.placeId !== place.id) throw new CommandError('Check in first.');
      if (training.current.blocks.length >= MAX_BLOCKS) throw new CommandError('That is enough for one day. Finish up.');
      if (person.wellbeing.energy < 10) throw new CommandError('Nothing left. Stop here.');

      const minutes = Math.round(sets * exercise.minutesPerSet * (p.intensity === 'hard' ? 1.15 : 1) + Math.max(0, sets - 1));
      const clash = s.timeline.conflicts(s.now, minutes)[0];
      if (clash) throw new CommandError(`That block would run into "${clash.label}" at ${formatTime(clash.at, s.zone)}. Finish up, or do something shorter.`);

      const trainer = bookedTrainer(s, person, place.id);
      const soreness = training.soreness;
      const effort = level.effort;
      const soreFactor = 1 + soreness / 200;
      const headroom = remap(person.wellbeing.fitness, 0, 100, 1.0, 0.25);
      const coached = trainer ? 1.2 : 1;

      s.advanceTo(s.now + minutes * MS_MINUTE);

      const w = person.wellbeing;
      const deltas: Record<string, number> = {
        energy: exercise.energy * sets * effort * soreFactor,
        fitness: exercise.fitness * sets * effort * headroom * coached,
        condition: exercise.condition * sets * effort * (exercise.focus === 'mobility' ? 1.2 : 1),
        stress: exercise.stress * sets * effort,
        hygiene: -3 * sets * effort,
        morale: 0.8 * sets,
      };
      const effects: Record<string, number> = {};
      for (const [key, delta] of Object.entries(deltas)) {
        const k = key as keyof typeof w;
        const before = w[k];
        w[k] = clamp(before + delta, 0, 100);
        effects[key] = Math.round((w[k] - before) * 10) / 10;
      }
      const skillBefore = person.skills['fitness'] ?? 0;
      person.skills['fitness'] = clamp(skillBefore + exercise.fitness * 0.5 * sets * effort * remap(skillBefore, 0, 100, 1, 0.12), 0, 100);

      // The record moves when a working set goes well.
      const lift = (training.lifts[exercise.id] ??= { best: exercise.start, sessions: 0, lastAt: s.now });
      lift.sessions += 1;
      lift.lastAt = s.now;
      let progressed = false;
      if (level.progress > 0) {
        const chance = level.progress * remap(readiness(person), 30, 100, 0.5, 1.1) * (trainer ? 1.15 : 1) * (soreness > 50 ? 0.5 : 1);
        if (s.rng('progress', person.id, exercise.id, s.now).chance(clamp(chance, 0, 0.95))) {
          lift.best += exercise.step;
          progressed = true;
        }
      }

      // The thing that goes wrong.
      let injured = false;
      const risk = exercise.injuryRisk * level.risk * (sets / 3) * (1 + soreness / 60) * (trainer ? 0.5 : 1) * remap(w.condition, 0, 100, 1.8, 0.8);
      if (risk > 0 && s.rng('injury', person.id, exercise.id, s.now).chance(clamp(risk, 0, 0.6))) {
        injured = true;
        const hit = s.rng('injury-severity', person.id, s.now).int(6, 14);
        w.condition = clamp(w.condition - hit, 0, 100);
        w.stress = clamp(w.stress + 6, 0, 100);
        effects['condition'] = (effects['condition'] ?? 0) - hit;
        training.current.injured = true;
        s.remember({
          category: 'health', title: `Hurt Doing ${exercise.name}`,
          detail: `${place.name}. ${trainer ? 'Even with a trainer watching.' : 'Nobody was watching the form.'} Condition down ${hit}.`,
          refs: [{ type: 'person', id: person.id }], significance: 22, public: false,
        });
      }

      const soreGain = sets * effort * (exercise.focus === 'strength' ? 4.5 : exercise.focus === 'cardio' ? 2.5 : -4);
      training.soreness = clamp(training.soreness + soreGain, 0, 100);

      const block: WorkoutBlock = { exerciseId: exercise.id, sets, intensity: p.intensity, minutes, progressed };
      training.current.blocks.push(block);
      if (p.focus) training.current.focus = p.focus;
      for (const [key, value] of Object.entries(effects)) {
        training.current.effects[key] = Math.round(((training.current.effects[key] ?? 0) + value) * 10) / 10;
      }

      const note = injured
        ? `Something went in the ${exercise.name.toLowerCase()}. You stop the set.`
        : progressed
          ? `A new best: ${lift.best} ${exercise.unit}.`
          : level.note;
      return { minutes, effects, progressed, injured, best: lift.best, unit: exercise.unit, note };
    },
  );

  // --- A class ---------------------------------------------------------------
  sim.onCommand<{ placeId: string; classId: string; accountId?: Id }, { minutes: number; cost: Money; effects: Record<string, number>; startsAt: number }>(
    'gym.take_class',
    (p, { sim: s }) => {
      const person = s.player;
      const { place, profile } = requirePresent(s, p.placeId);
      const def = CLASS_BY_ID[p.classId];
      if (!def || !profile.classes.some((c) => c.id === def.id)) throw new CommandError(`${place.name} does not run that class.`);
      const slot = classesSoon(s, profile).find((c) => c.def.id === def.id);
      if (!slot) throw new CommandError(`No ${def.name} today. The timetable is on the wall.`);
      if (!slot.soon) throw new CommandError(`${def.name} starts at ${formatTime(slot.startsAt, s.zone)}. Come back nearer the time.`);
      const training = trainingOf(person);
      if (!training.current || training.current.placeId !== place.id) throw new CommandError('Check in first.');
      const membership = membershipFor(s, person.id, place.id);
      const cost = membership && membership.product !== 'day_pass' ? 0 : Math.round(def.dropIn * costOfLiving(place.cityId));
      const wait = Math.max(0, slot.startsAt - s.now);
      const total = Math.round(wait / MS_MINUTE) + def.minutes;
      const clash = s.timeline.conflicts(s.now, total)[0];
      if (clash) throw new CommandError(`${def.name} would run into "${clash.label}" at ${formatTime(clash.at, s.zone)}.`);
      pay(s, cost, `${place.name} — ${def.name}`, { refType: 'membership', refId: membership?.id ?? place.id }, p.accountId);

      s.advanceTo(slot.startsAt > s.now ? slot.startsAt : s.now);
      s.advanceTo(s.now + def.minutes * MS_MINUTE);

      const w = person.wellbeing;
      const effects: Record<string, number> = {};
      const deltas: Record<string, number> = { energy: def.energy, fitness: def.fitness * remap(w.fitness, 0, 100, 1, 0.3), condition: def.condition, stress: def.stress, morale: def.morale, hygiene: -12 };
      for (const [key, delta] of Object.entries(deltas)) {
        const k = key as keyof typeof w;
        const before = w[k];
        w[k] = clamp(before + delta, 0, 100);
        effects[key] = Math.round((w[k] - before) * 10) / 10;
      }
      training.soreness = clamp(training.soreness + 6, 0, 100);
      training.current.classId = def.id;
      training.current.focus = 'class';
      training.current.cost += cost;
      training.current.blocks.push({ exerciseId: `class:${def.id}`, sets: 1, intensity: 'steady', minutes: def.minutes, progressed: false });
      for (const [key, value] of Object.entries(effects)) {
        training.current.effects[key] = Math.round(((training.current.effects[key] ?? 0) + value) * 10) / 10;
      }
      return { minutes: def.minutes, cost, effects, startsAt: slot.startsAt };
    },
  );

  // --- Done ------------------------------------------------------------------
  sim.onCommand<{ placeId: string; cutShort?: boolean; goal?: string }, { workoutId: Id; minutes: number; blocks: number; injured: boolean; summary: string }>(
    'gym.finish_workout',
    (p, { sim: s }) => {
      const person = s.player;
      const training = trainingOf(person);
      const current = training.current;
      if (!current || current.placeId !== p.placeId) throw new CommandError('There is no workout under way here.');
      const { place } = gymAt(s, p.placeId);
      const minutes = Math.round((s.now - current.startedAt) / MS_MINUTE);
      const trainer = bookedTrainer(s, person, place.id);

      const workout: Workout = {
        id: s.nextId('workout'), saveId: s.universe.meta.id, personId: person.id,
        placeId: place.id, gymName: place.name, at: current.startedAt, minutes,
        focus: current.focus, blocks: current.blocks, trainerId: current.trainerId, classId: current.classId,
        cost: current.cost, effects: current.effects, cutShort: Boolean(p.cutShort), injured: current.injured,
      };
      s.universe.workouts[workout.id] = workout;
      const kept = Object.values(s.universe.workouts).sort((a, b) => b.at - a.at);
      for (const old of kept.slice(WORKOUTS_KEPT)) delete s.universe.workouts[old.id];

      training.sessions += 1;
      training.lastWorkoutAt = s.now;
      training.current = undefined;
      training.trainer = undefined;
      if (training.soreness > 0 && !s.timeline.pending().some((i) => i.kind === 'fitness.recovery')) {
        training.sorenessUntil = nextMorning(s);
        s.schedule({ at: training.sorenessUntil, kind: 'fitness.recovery', label: 'Recovery', category: 'system', priority: 94 });
      }

      const goal = typeof p.goal === 'string' ? p.goal.trim().slice(0, 120) : '';
      if (trainer && goal) {
        rememberFact(s, trainer.id, {
          kind: 'goal', aboutId: person.id, text: goal, weight: 70,
          sourceKind: 'training', refType: 'workout', refId: workout.id,
        });
      }
      if (trainer) {
        const preference = current.focus === 'class' ? 'prefers classes' : `likes ${current.focus} work`;
        rememberFact(s, trainer.id, {
          kind: 'preference', aboutId: person.id, text: `${person.firstName} ${preference}.`, weight: 40,
          expiresAt: s.now + 180 * MS_DAY, sourceKind: 'training', refType: 'workout', refId: workout.id,
        });
      }

      const bests = current.blocks.filter((b) => b.progressed).length;
      const summary = current.blocks.length === 0
        ? 'You walked in and walked out again.'
        : `${current.blocks.length} block${current.blocks.length === 1 ? '' : 's'} in ${minutes} minutes${bests > 0 ? `, ${bests} new best${bests === 1 ? '' : 's'}` : ''}${current.injured ? ', and something hurts' : ''}.`;

      s.remember({
        category: 'life', title: `Trained At ${place.name}`,
        detail: `${summary}${trainer ? ` With ${trainer.displayName}.` : ''}`,
        refs: [{ type: 'person', id: person.id }, { type: 'workout', id: workout.id }],
        significance: bests > 0 ? 12 : 6, public: false, amount: current.cost || undefined,
      });
      s.emit('fitness.workout_completed', { workoutId: workout.id, placeId: place.id, minutes, blocks: current.blocks.length, injured: current.injured });
      return { workoutId: workout.id, minutes, blocks: current.blocks.length, injured: current.injured, summary };
    },
  );

  void CITIES;
}
