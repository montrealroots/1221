/**
 * The shoot day.
 *
 * What a test can hold about a day you shoot something: a diary that refuses a
 * day that has gone, a flat that cannot carry twenty setups, a location that
 * takes a fee and its own time to answer and gives the fee back when it says
 * no, a favor that only the people who know you will do, a day that will not
 * run without a camera in your hands or without permission, and a wrap where
 * what you got is what the day could actually carry.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  CREW_ROLE_LABEL, HOME_SETUPS, MAX_HOURS, STANDARD_HOURS, askable, capabilityOf, describeDay,
  locationsIn, permissionFee, planned, shootDaysOf,
} from '@/engine/systems/shoot';
import { housesIn, stockOf, outNow } from '@/engine/systems/rental';
import { createRelationship } from '@/engine/systems/relationships';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, Person, ShootDay } from '@/engine/domain/model';
import { familyOf } from '@/engine/systems/lifespan';

const DAY = 86_400_000;
const HOUR = 3_600_000;

function inLosAngeles(name: string): Simulation {
  const sim = quickSave({ wealth: 'wealthy' }, name);
  sim.player.currentLocationId = 'us-ca-losangeles';
  return sim;
}

/** A camera in your hands, which is what a day actually needs. */
function withCamera(sim: Simulation): void {
  const house = housesIn(sim).find((place) => ((place as { lines?: string[] }).lines ?? []).includes('camera'))!;
  const body = [...stockOf(sim, house)]
    .filter((good) => good.subcategory === 'camera')
    .sort((a, b) => a.basePrice - b.basePrice)[0]!;
  const hired = sim.execute<{ hireId: Id }>({
    kind: 'kit.hire', payload: { houseId: house.id, items: [{ catalogId: body.id }], days: 5 },
  });
  expect(hired.ok, String(hired.error)).toBe(true);
  sim.execute({ kind: 'kit.collect', payload: { hireId: hired.value!.hireId } });
  expect(outNow(sim).length).toBe(1);
}

function planDay(sim: Simulation, over: Partial<Record<string, unknown>> = {}): ShootDay {
  const result = sim.execute<{ dayId: Id }>({
    kind: 'shoot.plan',
    payload: { title: 'The Kitchen Scene', at: sim.now + 2 * HOUR, hours: 8, where: 'street', setups: 6, ...over },
  });
  expect(result.ok, String(result.error)).toBe(true);
  return sim.universe.shootDays[result.value!.dayId]!;
}

/** Somebody who knows you well enough to be asked. */
function aFriend(sim: Simulation): Person {
  const other = Object.values(sim.universe.people).find((person) => !person.isPlayer)!;
  createRelationship(sim, sim.player.id, other.id, 'friend', {
    dimensions: { familiarity: 85, affection: 85, trust: 80, respect: 80, conflict: 0 },
  });
  return other;
}

describe('putting a day in the diary', () => {
  it('takes a name, a place and some hours, and refuses a day that has gone', () => {
    const sim = inLosAngeles('shoot-plan');
    const day = planDay(sim);
    expect(day.status).toBe('planned');
    expect(day.hours).toBe(8);
    expect(day.permission.needed).toBe(false);
    expect(planned(sim).length).toBe(1);
    expect(describeDay(sim, day)).toContain('nobody');

    expect(sim.execute({ kind: 'shoot.plan', payload: { title: 'No', at: sim.now + DAY, where: 'street' } }).ok).toBe(false);
    expect(sim.execute({
      kind: 'shoot.plan', payload: { title: 'Yesterday', at: sim.now - 3 * DAY, where: 'street' },
    }).ok).toBe(false);
  });

  it('will not let a flat carry a stage day', () => {
    const sim = inLosAngeles('shoot-home');
    const day = planDay(sim, { where: 'home', setups: 20 });
    expect(day.setups).toBe(HOME_SETUPS);
    expect(day.where).toBe('home');
  });

  it('holds a day to the hours a day has', () => {
    const sim = inLosAngeles('shoot-hours');
    expect(planDay(sim, { hours: 40 }).hours).toBe(MAX_HOURS);
    expect(planDay(sim, { hours: 0 }).hours).toBeGreaterThanOrEqual(2);
  });

  it('needs permission for somewhere somebody owns, and not for the street', () => {
    const sim = inLosAngeles('shoot-permission-needed');
    const place = locationsIn(sim)[0]!;
    const day = planDay(sim, { where: 'place', placeId: place.id });
    expect(day.permission.needed).toBe(true);
    expect(day.permission.fee).toBe(permissionFee(sim, place));
    expect(day.permission.fee).toBeGreaterThan(0);

    const street = planDay(sim, { where: 'street' });
    expect(street.permission.needed).toBe(false);
    expect(sim.execute({ kind: 'shoot.ask_permission', payload: { dayId: street.id } }).ok).toBe(false);
  });
});

describe('asking whether you can be there', () => {
  it('takes the fee, takes its time, and answers', () => {
    const sim = inLosAngeles('shoot-permission');
    const accountId = sim.player.primaryAccountId!;
    const place = locationsIn(sim)[0]!;
    const day = planDay(sim, { where: 'place', placeId: place.id, at: sim.now + 8 * DAY });

    const before = sim.ledger.availableFunds(accountId);
    const asked = sim.execute<{ fee: number }>({ kind: 'shoot.ask_permission', payload: { dayId: day.id } });
    expect(asked.ok, String(asked.error)).toBe(true);
    expect(before - sim.ledger.availableFunds(accountId)).toBe(day.permission.fee);
    expect(sim.universe.shootDays[day.id]!.permission.status).toBe('asked');
    // Asking twice is asking twice.
    expect(sim.execute({ kind: 'shoot.ask_permission', payload: { dayId: day.id } }).ok).toBe(false);

    sim.advanceTo(sim.now + 5 * DAY);
    const answered = sim.universe.shootDays[day.id]!;
    expect(['granted', 'refused']).toContain(answered.permission.status);
    expect(answered.permission.note?.length ?? 0).toBeGreaterThan(5);
  });

  it('gives the fee back when the answer is no', () => {
    // Every seed answers differently, so this looks for a save that was
    // refused rather than assuming one.
    let refused = 0;
    for (let n = 0; n < 12 && refused === 0; n += 1) {
      const sim = inLosAngeles(`shoot-refusal-${n}`);
      const accountId = sim.player.primaryAccountId!;
      const place = locationsIn(sim).filter((one) => (one.quality ?? 0) > 80)[0] ?? locationsIn(sim)[0]!;
      const day = planDay(sim, { where: 'place', placeId: place.id, at: sim.now + 8 * DAY });
      sim.execute({ kind: 'shoot.ask_permission', payload: { dayId: day.id } });
      sim.advanceTo(sim.now + 5 * DAY);
      const answered = sim.universe.shootDays[day.id]!;
      if (answered.permission.status !== 'refused') continue;
      refused += 1;
      // The fee went out and came back. The balance itself moves for the
      // ordinary reasons a life moves it over five days, so what is checked
      // here is the pair of postings rather than the total.
      const history = sim.ledger.history(accountId, 40);
      const paid = history.find((entry) => entry.memo.startsWith('Location fee —'));
      const back = history.find((entry) => entry.memo.startsWith('Location fee returned'));
      expect(paid, 'the fee was never taken').toBeDefined();
      expect(back, 'the fee never came back').toBeDefined();
      expect(describeDay(sim, answered)).toContain('said no');
    }
    expect(refused, 'no seed in twelve was ever refused a location').toBeGreaterThan(0);
  });
});

describe('asking people to come', () => {
  it('will not let you ask a stranger for a day of their life', () => {
    const sim = inLosAngeles('shoot-crew-stranger');
    const day = planDay(sim);
    // Somebody you actually do not know. A life starts with the family it was
    // born into, and you would ask your brother for a day — so the people who
    // are askable at the start are exactly them, and nobody else.
    const known = new Set(askable(sim).map((person) => person.id));
    const stranger = Object.values(sim.universe.people)
      .find((person) => !person.isPlayer && !known.has(person.id))!;
    expect(known.size).toBe(familyOf(sim).all.length);
    expect(sim.execute({
      kind: 'shoot.ask_crew', payload: { dayId: day.id, personId: stranger.id, role: 'camera' },
    }).ok).toBe(false);
  });

  it('asks somebody who knows you, and remembers that they came', () => {
    const sim = inLosAngeles('shoot-crew-friend');
    const friend = aFriend(sim);
    expect(askable(sim).map((person) => person.id)).toContain(friend.id);

    const day = planDay(sim);
    const asked = sim.execute<{ answer: string; note: string }>({
      kind: 'shoot.ask_crew', payload: { dayId: day.id, personId: friend.id, role: 'camera' },
    });
    expect(asked.ok, String(asked.error)).toBe(true);
    expect(['yes', 'no']).toContain(asked.value!.answer);
    expect(asked.value!.note).toContain(friend.displayName);

    const now = sim.universe.shootDays[day.id]!;
    expect(now.crew.length).toBe(1);
    expect(now.crew[0]!.role).toBe('camera');
    expect(CREW_ROLE_LABEL[now.crew[0]!.role]).toBe('Camera');
    // Asking the same person twice is not asking twice.
    expect(sim.execute({
      kind: 'shoot.ask_crew', payload: { dayId: day.id, personId: friend.id, role: 'sound' },
    }).ok).toBe(false);

    if (asked.value!.answer === 'yes') {
      const rel = Object.values(sim.universe.relationships)[0]!;
      expect(rel.memories.some((memory) => memory.summary.includes(day.title))).toBe(true);
    }
  });

  it('gets more out of a day with somebody on it than alone', () => {
    const sim = inLosAngeles('shoot-capability');
    const day = planDay(sim, { hours: STANDARD_HOURS });
    const alone = capabilityOf(sim, day);
    day.crew.push({ personId: 'x', name: 'Somebody', role: 'camera', answer: 'yes' });
    day.crew.push({ personId: 'y', name: 'Somebody Else', role: 'sound', answer: 'yes' });
    expect(capabilityOf(sim, day)).toBeGreaterThan(alone);
    // Somebody who said no is not on the day.
    const withNo = capabilityOf(sim, day);
    day.crew.push({ personId: 'z', name: 'Not Coming', role: 'lighting', answer: 'no' });
    expect(capabilityOf(sim, day)).toBe(withNo);
  });
});

describe('the day itself', () => {
  it('will not run without a camera in your hands', () => {
    const sim = inLosAngeles('shoot-no-kit');
    const day = planDay(sim);
    sim.advanceTo(day.at);
    const result = sim.execute({ kind: 'shoot.run', payload: { dayId: day.id } });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('nothing to shoot on');
  });

  it('will not run early, or at a place nobody said yes to', () => {
    const sim = inLosAngeles('shoot-guards');
    withCamera(sim);
    const early = planDay(sim, { at: sim.now + 5 * DAY });
    expect(sim.execute({ kind: 'shoot.run', payload: { dayId: early.id } }).ok).toBe(false);

    const place = locationsIn(sim)[0]!;
    const owned = planDay(sim, { where: 'place', placeId: place.id, at: sim.now + HOUR });
    sim.advanceTo(owned.at);
    const refused = sim.execute({ kind: 'shoot.run', payload: { dayId: owned.id } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain('said you can be there');
  });

  it('takes the hours, takes it out of you, and puts what it got in the can', () => {
    const sim = inLosAngeles('shoot-run');
    withCamera(sim);
    const day = planDay(sim, { hours: 8, setups: 6 });
    sim.advanceTo(day.at);
    const before = sim.now;
    const energy = sim.player.wellbeing.energy;

    const ran = sim.execute<{ got: number; setups: number; note: string }>({
      kind: 'shoot.run', payload: { dayId: day.id },
    });
    expect(ran.ok, String(ran.error)).toBe(true);
    expect(ran.value!.setups).toBe(6);
    expect(ran.value!.got).toBeGreaterThanOrEqual(0);
    expect(ran.value!.got).toBeLessThanOrEqual(6);
    expect((sim.now - before) / HOUR).toBeCloseTo(8, 1);
    expect(sim.player.wellbeing.energy).toBeLessThan(energy);

    const shot = sim.universe.shootDays[day.id]!;
    expect(shot.status).toBe('shot');
    expect(shot.got).toBe(ran.value!.got);
    expect(shot.note?.length ?? 0).toBeGreaterThan(10);
    expect(describeDay(sim, shot)).toContain('in the can');
    // The kit that was on the day knows it was there, which is what wears it.
    expect(outNow(sim)[0]!.shootDayIds).toContain(day.id);
    // And a day is shot once.
    expect(sim.execute({ kind: 'shoot.run', payload: { dayId: day.id } }).ok).toBe(false);
  });

  it('can be called off, and a called off day is not shot', () => {
    const sim = inLosAngeles('shoot-abandon');
    withCamera(sim);
    const day = planDay(sim);
    expect(sim.execute({ kind: 'shoot.abandon', payload: { dayId: day.id } }).ok).toBe(true);
    expect(sim.universe.shootDays[day.id]!.status).toBe('abandoned');
    sim.advanceTo(day.at);
    expect(sim.execute({ kind: 'shoot.run', payload: { dayId: day.id } }).ok).toBe(false);
    expect(planned(sim).length).toBe(0);
    expect(shootDaysOf(sim).length).toBe(1);
  });
});
