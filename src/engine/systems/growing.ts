/**
 * SLATE — growing up.
 *
 * The years between five and twenty five, as things that happen on a day and
 * have to be answered. A moment arrives, it goes into the Decision Center like
 * anything else that needs deciding, and what you pick moves something real:
 * an attribute, a skill, money, how it sits with the people who raised you, or
 * a person who is in your life now and was not before.
 *
 * Everybody it introduces is SLATE's own, and every moment in it is the
 * ordinary kind rather than anybody's in particular.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { GrowingUp, Id, Person } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_MINUTE, addDays } from '../core/time';
import { formatMoney } from '../core/money';
import { countryOfCity } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { HERITAGE_BY_ID, heritagesIn } from '../content/heritage';
import {
  ALLOWANCE_NOTE, DRIVING_NOTE, GROWING_NOTE, LESSONS_TO_READY, LESSON_COST, MOMENTS,
  MOMENT_BY_ID, TEST_COST, TEST_PASSES_AT, type Choice, type Moment, allowanceAt, momentsAt,
} from '../content/growingup';
import { ageOf, familyOf, mayI, relative } from './lifespan';
import { schoolingOf } from './school';
import { studiesOf } from './university';
import { runningOf } from './athletics';
import { createRelationship } from './relationships';
import { attributesOf } from '../domain/attributes';

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

/** What has happened so far, if anything has. */
export function growingOf(sim: Simulation, personId: Id = sim.player.id): GrowingUp | undefined {
  return Object.values(sim.universe.growing ?? {}).find((one) => one.personId === personId);
}

/** Start the record, or return the one there is. Idempotent. */
export function ensureGrowing(sim: Simulation, person: Person = sim.player): GrowingUp {
  sim.universe.growing ??= {};
  const existing = growingOf(sim, person.id);
  if (existing) return existing;
  const record: GrowingUp = {
    id: sim.nextId('growing'),
    saveId: sim.universe.meta.id,
    personId: person.id,
    done: [],
    lessons: 0,
    testsSat: 0,
    startedAt: sim.now,
  };
  sim.universe.growing[record.id] = record;
  return record;
}

// ---------------------------------------------------------------------------
// Which moments are open
// ---------------------------------------------------------------------------

/** Whether the world is in the state a moment needs. */
export function conditionMet(sim: Simulation, moment: Moment): boolean {
  switch (moment.requires) {
    case undefined: return true;
    case 'at_school': return Boolean(schoolingOf(sim));
    case 'at_secondary': return ageOf(sim) >= 11 && Boolean(schoolingOf(sim));
    case 'at_university': return Boolean(studiesOf(sim));
    case 'has_sibling': return familyOf(sim).siblings.length > 0;
    case 'runs': return Boolean(runningOf(sim));
    case 'may_work': return mayI(sim, 'work').ok;
    case 'may_drive': return mayI(sim, 'drive').ok && !growingOf(sim)?.passedTestAt;
    // The first wage is the thing that follows the first job, and the first
    // job is a moment in here rather than a record anywhere else.
    case 'works': return growingOf(sim)?.done.includes('first_job') ?? false;
    case 'lives_at_home': return ageOf(sim) >= 18 && !Object.values(sim.universe.properties ?? {})
      .some((one) => one.ownerId === sim.player.id && !one.soldAt);
    default: return true;
  }
}

/** Everything that could happen now and has not happened yet. */
export function openMoments(sim: Simulation, record: GrowingUp): Moment[] {
  const age = ageOf(sim);
  return momentsAt(age).filter((one) => !record.done.includes(one.id) && conditionMet(sim, one));
}

/** The one waiting on an answer, if there is one. */
export function pendingMoment(record: GrowingUp): Moment | undefined {
  return record.openId ? MOMENT_BY_ID[record.openId] : undefined;
}

/** Everything already lived through, oldest first. */
export function livedThrough(record: GrowingUp): Moment[] {
  return record.done.map((id) => MOMENT_BY_ID[id]).filter((one): one is Moment => Boolean(one));
}

// ---------------------------------------------------------------------------
// Making it happen
// ---------------------------------------------------------------------------

/** How far apart moments fall, so a childhood is not a queue of them. */
const APART_DAYS = 90;

/** How long a moment waits for an answer before the moment simply passes. */
export const LAPSES_AFTER_DAYS = 60;

/** Put the next one on the calendar, if there is one to put. */
export function scheduleNext(sim: Simulation, record: GrowingUp): void {
  if (record.openId) return;
  const rng = sim.rng('growing.when', record.id, record.done.length);
  const at = addDays(sim.now, rng.int(Math.round(APART_DAYS * 0.5), APART_DAYS), sim.homeZone);
  record.nextAt = at;
  sim.schedule({
    at,
    kind: 'growing.moment',
    label: 'Something Happens',
    category: 'personal',
    payload: { growingId: record.id },
    priority: 35,
  });
}

/** Somebody new in your life, who is SLATE's own. */
function makeAFriend(sim: Simulation, record: GrowingUp): Person | undefined {
  const player = sim.player;
  const cityId = player.currentLocationId;
  const countryId = countryOfCity(cityId) ?? player.citizenshipId;
  const rng = sim.rng('growing.friend', record.id, record.done.length);
  const pool = heritagesIn(countryId);
  const heritage = pool.length > 0
    ? rng.pick(pool)
    : HERITAGE_BY_ID[player.heritageId ?? 'english'] ?? heritagesIn('uk')[0];
  if (!heritage) return undefined;
  const gender = rng.pick(['female', 'male'] as const);
  const surname = heritage.family[rng.int(0, heritage.family.length - 1)] ?? 'Hall';
  const friend = relative(
    sim, player, ageOf(sim) + rng.int(-1, 1), surname, cityId,
    `friend:${record.done.length}`, heritage, gender,
  );
  createRelationship(sim, player.id, friend.id, 'friend', {
    dimensions: { familiarity: 45, affection: 55, trust: 50, respect: 50 },
    context: 'Growing up',
  });
  return friend;
}

/** Take away the friend it costs you, where there is one to lose. */
function loseAFriend(sim: Simulation): string | undefined {
  const friends = Object.values(sim.universe.relationships ?? {})
    .filter((one) => (one.aId === sim.player.id || one.bId === sim.player.id)
      && one.type === 'friend' && !one.endedAt);
  if (friends.length === 0) return undefined;
  const rel = friends[friends.length - 1]!;
  rel.endedAt = sim.now;
  rel.dimensions.conflict = clamp((rel.dimensions.conflict ?? 0) + 40, 0, 100);
  const otherId = rel.aId === sim.player.id ? rel.bId : rel.aId;
  return sim.universe.people[otherId]?.displayName;
}

/** Apply what a choice does, once. */
export function applyChoice(
  sim: Simulation, record: GrowingUp, moment: Moment, choice: Choice,
): { note: string } {
  const effect = choice.effect;
  const player = sim.player;

  for (const [key, amount] of Object.entries(effect.attribute ?? {})) {
    const held = attributesOf(player)[key];
    if (held === undefined) continue;
    player.attributes[key] = clamp(Math.round((held + amount) * 10) / 10, 0, 100);
  }
  for (const [key, amount] of Object.entries(effect.skill ?? {})) {
    const held = player.skills?.[key] ?? 0;
    player.skills[key] = clamp(Math.round((held + amount) * 10) / 10, 0, 100);
  }
  if (effect.energy) player.wellbeing.energy = clamp(player.wellbeing.energy + effect.energy, 0, 100);
  if (effect.stress) player.wellbeing.stress = clamp(player.wellbeing.stress + effect.stress, 0, 100);
  if (effect.morale) player.wellbeing.morale = clamp(player.wellbeing.morale + effect.morale, 0, 100);

  // Money, scaled to what things cost where you are living.
  let moved = 0;
  if (effect.money) {
    const accountId = player.primaryAccountId;
    moved = Math.round(effect.money * costOfLiving(player.currentLocationId));
    if (accountId && moved > 0) {
      sim.income(accountId, moved, moment.title, 'other', { refType: 'person', refId: player.id });
    } else if (accountId && moved < 0) {
      sim.expense(accountId, -moved, moment.title, 'personal', { refType: 'person', refId: player.id });
    }
  }

  // How it lands with the people it lands with.
  const family = familyOf(sim);
  const shifts: { people: Person[]; by: number }[] = [
    { people: family.parents, by: effect.parents ?? 0 },
    { people: family.siblings, by: effect.siblings ?? 0 },
  ];
  for (const { people, by } of shifts) {
    if (!by) continue;
    for (const member of people) {
      const rel = Object.values(sim.universe.relationships ?? {}).find(
        (one) => (one.aId === player.id && one.bId === member.id)
          || (one.bId === player.id && one.aId === member.id),
      );
      if (!rel) continue;
      rel.dimensions.affection = clamp((rel.dimensions.affection ?? 50) + by, 0, 100);
      rel.dimensions.trust = clamp((rel.dimensions.trust ?? 50) + Math.round(by * 0.5), 0, 100);
    }
  }

  let extra = '';
  if (effect.friend === 'make') {
    const friend = makeAFriend(sim, record);
    if (friend) extra = ` ${friend.displayName} is in your life now.`;
  } else if (effect.friend === 'lose') {
    const gone = loseAFriend(sim);
    if (gone) extra = ` You and ${gone} do not speak after this.`;
  }

  record.done.push(moment.id);
  record.openId = undefined;
  sim.remember({
    category: 'life',
    title: moment.title,
    detail: effect.memory,
    refs: [{ type: 'person', id: player.id }],
    significance: effect.significance,
    public: effect.public ?? false,
  });
  sim.emit('growing.lived', { momentId: moment.id, choiceId: choice.id });
  scheduleNext(sim, record);
  return {
    note: `${effect.note}${extra}${moved > 0 ? ` ${formatMoney(moved)} in.` : moved < 0 ? ` ${formatMoney(-moved)} out.` : ''}`,
  };
}

// ---------------------------------------------------------------------------
// Learning to drive
// ---------------------------------------------------------------------------

/** What a lesson costs where you are. */
export function lessonCost(sim: Simulation): number {
  return Math.round(LESSON_COST * costOfLiving(sim.player.currentLocationId));
}

/** What the test costs where you are. */
export function testCost(sim: Simulation): number {
  return Math.round(TEST_COST * costOfLiving(sim.player.currentLocationId));
}

/** How ready somebody is for a driving test, out of a hundred. */
export function readyToDrive(sim: Simulation, record: GrowingUp): number {
  const lessons = Math.min(record.lessons, LESSONS_TO_READY * 2);
  const held = sim.player.skills?.driving ?? 0;
  return clamp(Math.round((lessons / LESSONS_TO_READY) * 55 + held * 0.45), 0, 100);
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerGrowing(sim: Simulation): void {
  /** Answering whatever has come round. */
  sim.onCommand<{ momentId: string; choiceId: string }, { note: string }>(
    'growing.choose',
    (p, { sim: s }) => {
      const record = ensureGrowing(s);
      const moment = MOMENT_BY_ID[p.momentId];
      if (!moment) throw new CommandError('That is not something that happens.');
      if (record.done.includes(moment.id)) throw new CommandError('That has already happened.');
      const choice = moment.choices.find((one) => one.id === p.choiceId);
      if (!choice) throw new CommandError('That is not one of the answers.');
      s.advanceTo(s.now + 45 * MS_MINUTE);
      return applyChoice(s, record, moment, choice);
    },
  );

  /** An hour with an instructor. */
  sim.onCommand<Record<string, never>, { lessons: number; ready: number; note: string }>(
    'growing.lesson',
    (_p, { sim: s }) => {
      const record = ensureGrowing(s);
      if (record.passedTestAt) throw new CommandError('You have passed. There is nothing left to learn from an instructor.');
      const allowed = mayI(s, 'drive');
      if (!allowed.ok) throw new CommandError(allowed.reason);
      const accountId = s.player.primaryAccountId;
      const cost = lessonCost(s);
      if (!accountId || s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`An hour is ${formatMoney(cost)} and you do not have it.`);
      }
      s.expense(accountId, cost, 'Driving Lesson', 'personal', { refType: 'person', refId: s.player.id });
      record.lessons += 1;
      s.player.skills.driving = clamp(
        Math.round(((s.player.skills?.driving ?? 0) + s.rng('growing.lesson', record.id, record.lessons).float(1.6, 3.4)) * 10) / 10,
        0, 100,
      );
      s.advanceTo(s.now + 75 * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - 8, 0, 100);
      const ready = readyToDrive(s, record);
      s.emit('growing.lesson', { lessons: record.lessons, ready });
      return {
        lessons: record.lessons,
        ready,
        note: `An hour, ${formatMoney(cost)}. ${record.lessons} in. `
          + `${ready >= TEST_PASSES_AT ? 'You are about ready to sit it.' : 'Not ready yet.'}`,
      };
    },
  );

  /** Sitting the test, which can be failed. */
  sim.onCommand<
    Record<string, never>,
    { passed: boolean; mark: number; testsSat: number; note: string }
  >(
    'growing.test',
    (_p, { sim: s }) => {
      const record = ensureGrowing(s);
      if (record.passedTestAt) throw new CommandError('You have already passed it.');
      const allowed = mayI(s, 'drive');
      if (!allowed.ok) throw new CommandError(allowed.reason);
      if (record.lessons < 3) throw new CommandError('Nobody sits it off three hours. Book some lessons.');
      const accountId = s.player.primaryAccountId;
      const cost = testCost(s);
      if (!accountId || s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`The test is ${formatMoney(cost)} and you do not have it.`);
      }
      s.expense(accountId, cost, 'Driving Test', 'personal', { refType: 'person', refId: s.player.id });
      record.testsSat += 1;

      const rng = s.rng('growing.test', record.id, record.testsSat);
      const nerves = clamp((s.player.wellbeing.stress ?? 20) - 30, 0, 60) * 0.25;
      const mark = clamp(Math.round(readyToDrive(s, record) + rng.int(-14, 14) - nerves), 0, 100);
      const passed = mark >= TEST_PASSES_AT;
      s.advanceTo(s.now + 90 * MS_MINUTE);
      s.player.wellbeing.stress = clamp(s.player.wellbeing.stress + (passed ? -6 : 12), 0, 100);

      if (passed) {
        record.passedTestAt = s.now;
        s.remember({
          category: 'life',
          title: 'Passed The Driving Test',
          detail: record.testsSat === 1
            ? 'First time, and nobody has ever heard the end of it.'
            : `On the ${record.testsSat === 2 ? 'second' : `${record.testsSat}th`} attempt, which is most people.`,
          refs: [{ type: 'person', id: s.player.id }],
          significance: 6,
          public: false,
        });
      }
      s.emit('growing.test', { passed, mark, testsSat: record.testsSat });
      return {
        passed,
        mark,
        testsSat: record.testsSat,
        note: passed
          ? `Passed${record.testsSat === 1 ? ', first time' : ` on the ${record.testsSat}${record.testsSat === 2 ? 'nd' : 'th'} go`}. Now go and get the license itself.`
          : `Failed. ${formatMoney(cost)} and another go to book.`,
      };
    },
  );

  // --- What comes round ------------------------------------------------------

  /** A moment arrives, and it goes where everything that needs deciding goes. */
  sim.onSchedule('growing.moment', (item, s) => {
    const record = Object.values(s.universe.growing ?? {})
      .find((one) => one.id === (item.payload as { growingId: Id }).growingId);
    if (!record || record.personId !== s.player.id) return;
    if (record.openId) return;
    const open = openMoments(s, record);
    if (open.length === 0) { scheduleNext(s, record); return; }
    const moment = s.rng('growing.pick', record.id, record.done.length).pick(open);
    record.openId = moment.id;
    record.nextAt = undefined;
    // A moment that is never answered is a moment that passed, rather than
    // one that stops every other thing in a life from ever happening.
    s.schedule({
      at: addDays(s.now, LAPSES_AFTER_DAYS, s.homeZone),
      kind: 'growing.lapse',
      label: 'The Moment Passes',
      category: 'personal',
      payload: { growingId: record.id, momentId: moment.id },
      priority: 8,
    });
    s.requireDecision({
      urgency: moment.urgency,
      category: 'life',
      title: moment.title,
      detail: moment.detail,
      route: '/workspace/character',
      refType: 'person',
      refId: s.player.id,
      actions: moment.choices.map((choice) => ({
        label: choice.label,
        commandKind: 'growing.choose',
        payload: { momentId: moment.id, choiceId: choice.id },
      })),
    });
    s.emit('growing.arrived', { momentId: moment.id });
  });

  /** Nothing decided is a decision too, and life goes on either way. */
  sim.onSchedule('growing.lapse', (item, s) => {
    const payload = item.payload as { growingId: Id; momentId: string };
    const record = Object.values(s.universe.growing ?? {}).find((one) => one.id === payload.growingId);
    if (!record || record.openId !== payload.momentId) return;
    record.done.push(payload.momentId);
    record.openId = undefined;
    s.emit('growing.lapsed', { momentId: payload.momentId });
    scheduleNext(s, record);
  });

  /** Pocket money, weekly, until you are old enough to be earning. */
  sim.onSchedule('growing.allowance', (_item, s) => {
    const record = growingOf(s);
    if (!record) return;
    const age = ageOf(s);
    const aWeek = Math.round(allowanceAt(age) * costOfLiving(s.player.currentLocationId));
    const accountId = s.player.primaryAccountId;
    if (aWeek > 0 && accountId) {
      s.income(accountId, aWeek, 'Pocket Money', 'other', { refType: 'person', refId: s.player.id });
      record.allowancePaidAt = s.now;
    }
    if (age < 18) {
      s.schedule({
        at: addDays(s.now, 7, s.homeZone),
        kind: 'growing.allowance',
        label: 'Pocket Money',
        category: 'personal',
        priority: 10,
      });
    }
  });
}

/**
 * Set a life going: the record, the first moment, and the pocket money.
 *
 * Idempotent, and safe on a save made before any of this existed.
 */
export function startGrowingUp(sim: Simulation, person: Person = sim.player): GrowingUp {
  const record = ensureGrowing(sim, person);
  if (!record.openId && record.nextAt === undefined) scheduleNext(sim, record);
  if (ageOf(sim, person) < 18 && record.allowancePaidAt === undefined) {
    sim.schedule({
      at: addDays(sim.now, 7, sim.homeZone),
      kind: 'growing.allowance',
      label: 'Pocket Money',
      category: 'personal',
      priority: 10,
    });
    record.allowancePaidAt = sim.now;
  }
  return record;
}

export { GROWING_NOTE, ALLOWANCE_NOTE, DRIVING_NOTE, MOMENTS, LESSONS_TO_READY, TEST_PASSES_AT };
export type { Instant };
