/**
 * Training: a door, a price, a set of squats, and tomorrow's legs.
 *
 * A pass is sold once however many times the button is pressed. A monthly
 * membership is a bill, and the bill is what renews it; canceling stops the
 * bill and the membership runs out on its own. Nothing happens on the gym
 * floor unless you are on it, it is open, and you are holding a pass. A block
 * of work takes the time it takes, spends what it spends and moves a record
 * when it earns it. A trainer has to be paid for before they count, and they
 * remember. The same seed hurts the same person the same way. The ledger
 * still sums to zero at the end of all of it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { placesIn } from '@/engine/content/places';
import { CITIES_WITH_REAL_GYMS, EXERCISES, REAL_GYMS, gymProfile, hoursLabel } from '@/engine/content/fitness';
import {
  bookedTrainer, ensureTrainers, membershipFor, trainingOf, workoutsOf,
} from '@/engine/systems/fitness';
import { factsOf } from '@/engine/systems/memory';
import { readiness } from '@/engine/systems/life';
import { findRelationship } from '@/engine/systems/relationships';

const MS_MINUTE = 60_000;
const GOLDS = 'gym-la-golds-venice';

function aLife(seed = 'fitness'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 50_000_00, 'Test funding', 'other');
  return sim;
}

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

function walkTo(sim: Simulation, placeId: string): void {
  must(sim, 'go.to', { placeId, mode: 'walk' });
}

/** Moves the clock to a local hour today or tomorrow, processing the world on the way. */
function goToHour(sim: Simulation, hour: number): void {
  const parts = zonedParts(sim.now, sim.zone);
  let at = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour }, sim.zone);
  if (at <= sim.now) at += MS_DAY;
  sim.advanceTo(at);
}

describe('the real gyms', () => {
  it('are in the city, say they are real, and calibrate rather than claim', () => {
    const la = placesIn('us-ca-losangeles').filter((p) => p.kind === 'gym');
    const golds = la.find((p) => p.id === GOLDS);
    expect(golds?.real).toBe(true);
    expect(golds?.about).toMatch(/1965/);
    expect(gymProfile(golds!).calibration).toBe('calibrated_estimate');
    const invented = la.find((p) => !p.real);
    expect(invented).toBeDefined();
    expect(gymProfile(invented!).calibration).toBe('simulated');
  });

  it('reach the cities they reach, and no more', () => {
    expect(new Set(REAL_GYMS.map((g) => g.id)).size).toBe(REAL_GYMS.length);
    expect(CITIES_WITH_REAL_GYMS.length).toBe(new Set(REAL_GYMS.map((g) => g.cityId)).size);
    // The numbers the game states about itself. Change them here when the
    // list changes, and nowhere else.
    expect(REAL_GYMS).toHaveLength(25);
    expect(CITIES_WITH_REAL_GYMS).toHaveLength(13);
    for (const gym of REAL_GYMS) expect(gym.about, gym.id).toMatch(/SLATE|record|Pumping Iron/);
  });

  it('has a profile that is the same gym every time', () => {
    const place = placesIn('us-ca-losangeles').find((p) => p.id === GOLDS)!;
    expect(gymProfile(place)).toEqual(gymProfile(place));
    expect(hoursLabel(gymProfile(place).hours)).toMatch(/AM|24 Hours/);
  });
});

describe('passes and memberships', () => {
  it('sells a day pass once, however many times the purchase is retried', () => {
    const sim = aLife();
    const funds = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const payload = { placeId: GOLDS, product: 'day_pass' };
    const first = sim.execute<{ cost: number }>({ kind: 'gym.buy_pass', payload, idempotencyKey: 'buy:1' });
    expect(first.ok, first.error).toBe(true);
    const again = sim.execute({ kind: 'gym.buy_pass', payload, idempotencyKey: 'buy:1' });
    expect(again.ok).toBe(true);
    expect(again.replayed).toBe(true);
    const third = sim.execute({ kind: 'gym.buy_pass', payload });
    expect(third.ok).toBe(false);
    expect(third.error).toMatch(/already have/);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(funds - first.value!.cost);
    expect(sim.universe.transactions.filter((t) => t.refType === 'membership')).toHaveLength(1);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('a monthly membership is a bill, the bill renews it, and canceling stops the bill', () => {
    const sim = aLife();
    const { membershipId } = must<{ membershipId: string }>(sim, 'gym.buy_pass', { placeId: GOLDS, product: 'monthly' });
    const membership = sim.universe.memberships[membershipId]!;
    expect(membership.billId).toBeDefined();
    const bill = sim.universe.bills[membership.billId!]!;
    expect(bill.refType).toBe('membership');
    const firstEnd = membership.endsAt;

    sim.advanceTo(sim.now + 31 * MS_DAY);
    expect(membership.status).toBe('active');
    expect(membership.endsAt).toBeGreaterThan(firstEnd);
    expect(sim.universe.transactions.filter((t) => t.memo.includes('Membership') || t.refId === bill.id).length).toBeGreaterThanOrEqual(2);

    must(sim, 'gym.cancel_membership', { membershipId });
    expect(membership.status).toBe('cancelled');
    expect(bill.active).toBe(false);
    expect(membershipFor(sim, sim.player.id, GOLDS)).toBeDefined();
    sim.advanceTo(membership.endsAt + 3 * 60 * MS_MINUTE);
    expect(membership.status).toBe('expired');
    expect(membershipFor(sim, sim.player.id, GOLDS)).toBeUndefined();
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('lapses when the bill goes unpaid twice', () => {
    const sim = aLife();
    const { membershipId } = must<{ membershipId: string }>(sim, 'gym.buy_pass', { placeId: GOLDS, product: 'monthly' });
    const account = sim.player.primaryAccountId!;
    // The founder is paid a monthly draw by the company, which would quietly
    // cover the bill. Stop it, so an empty account stays empty.
    must(sim, 'co.set_draw', { amount: 0 });
    for (const a of sim.ledger.accountsOf(sim.player.id)) {
      const funds = sim.ledger.availableFunds(a.id);
      if (funds > 0) sim.expense(a.id, funds, 'Emptied for the test', 'other');
    }
    expect(sim.ledger.availableFunds(account)).toBe(0);
    sim.advanceTo(sim.now + 65 * MS_DAY);
    expect(sim.universe.memberships[membershipId]!.status).toBe('lapsed');
  });
});

describe('through the door', () => {
  it('needs you present, the place open, and a pass in your hand', () => {
    const sim = aLife();
    const away = attempt(sim, 'gym.check_in', { placeId: GOLDS });
    expect(away.ok).toBe(false);
    expect(away.error).toMatch(/Walk in/);

    walkTo(sim, GOLDS);
    const noPass = attempt(sim, 'gym.check_in', { placeId: GOLDS });
    expect(noPass.ok).toBe(false);
    expect(noPass.error).toMatch(/no pass/i);

    must(sim, 'gym.buy_pass', { placeId: GOLDS, product: 'day_pass' });
    const inside = must<{ visits: number }>(sim, 'gym.check_in', { placeId: GOLDS });
    expect(inside.visits).toBe(1);
    expect(trainingOf(sim.player).current?.placeId).toBe(GOLDS);
  });

  it('is closed when it is closed', () => {
    const sim = aLife();
    // A gym with a closing time, so the small hours are the small hours.
    const shut = placesIn(sim.player.currentLocationId).filter((p) => p.kind === 'gym')
      .find((p) => gymProfile(p).hours.close < 24);
    expect(shut, 'a gym that closes').toBeDefined();
    must(sim, 'gym.buy_pass', { placeId: shut!.id, product: 'day_pass' });
    goToHour(sim, 3);
    must(sim, 'go.to', { placeId: shut!.id, mode: 'taxi' });
    const result = attempt(sim, 'gym.check_in', { placeId: shut!.id });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/closed/i);
  });
});

describe('a block of work', () => {
  function inside(seed = 'blocks'): Simulation {
    const sim = aLife(seed);
    walkTo(sim, GOLDS);
    must(sim, 'gym.buy_pass', { placeId: GOLDS, product: 'day_pass' });
    must(sim, 'gym.check_in', { placeId: GOLDS });
    return sim;
  }

  it('takes time, spends energy, moves fitness and keeps a record', () => {
    const sim = inside();
    const before = { now: sim.now, energy: sim.player.wellbeing.energy, fitness: sim.player.wellbeing.fitness };
    const block = must<{ minutes: number; effects: Record<string, number>; best: number; unit: string }>(
      sim, 'gym.train_block', { placeId: GOLDS, exerciseId: 'squat', sets: 3, intensity: 'steady', focus: 'strength' },
    );
    expect(block.minutes).toBeGreaterThan(0);
    expect(sim.now).toBe(before.now + block.minutes * MS_MINUTE);
    expect(sim.player.wellbeing.energy).toBeLessThan(before.energy);
    expect(sim.player.wellbeing.fitness).toBeGreaterThan(before.fitness);
    expect(block.unit).toBe('kg');
    const training = trainingOf(sim.player);
    expect(training.lifts['squat']?.sessions).toBe(1);
    expect(training.soreness).toBeGreaterThan(0);
    expect(training.current?.blocks).toHaveLength(1);
  });

  it('refuses what the gym does not have, what the day does not allow, and what is not checked in', () => {
    const sim = inside();
    const profile = gymProfile(placesIn(sim.player.currentLocationId).find((p) => p.id === GOLDS)!);
    const missing = EXERCISES.find((e) => !profile.facilities.includes(e.facility));
    if (missing) {
      const result = attempt(sim, 'gym.train_block', { placeId: GOLDS, exerciseId: missing.id, sets: 2, intensity: 'easy' });
      expect(result.ok).toBe(false);
    }
    expect(attempt(sim, 'gym.train_block', { placeId: GOLDS, exerciseId: 'squat', sets: 9, intensity: 'steady' }).ok).toBe(false);
    expect(attempt(sim, 'gym.train_block', { placeId: GOLDS, exerciseId: 'nope', sets: 2, intensity: 'steady' }).ok).toBe(false);

    sim.onSchedule('test.commitment', () => {});
    sim.schedule({ kind: 'test.commitment', at: sim.now + 5 * MS_MINUTE, durationMinutes: 60, requiresPlayer: true, label: 'Audition', category: 'career' });
    const clash = attempt(sim, 'gym.train_block', { placeId: GOLDS, exerciseId: 'squat', sets: 3, intensity: 'steady' });
    expect(clash.ok).toBe(false);
    expect(clash.error).toMatch(/Audition/);
  });

  it('hurts the same person the same way from the same seed', () => {
    const run = (seed: string) => {
      const sim = inside(seed);
      const flags: boolean[] = [];
      for (let i = 0; i < 6 && sim.player.wellbeing.energy > 20; i++) {
        const block = must<{ injured: boolean }>(sim, 'gym.train_block', { placeId: GOLDS, exerciseId: i % 2 ? 'deadlift' : 'squat', sets: 4, intensity: 'hard' });
        flags.push(block.injured);
      }
      return flags;
    };
    expect(run('same-legs')).toEqual(run('same-legs'));
  });
});

describe('a trainer', () => {
  it('has to be paid for before they count, and remembers what you told them', () => {
    const sim = aLife();
    walkTo(sim, GOLDS);
    must(sim, 'gym.buy_pass', { placeId: GOLDS, product: 'day_pass' });
    must(sim, 'gym.check_in', { placeId: GOLDS });
    expect(attempt(sim, 'gym.hire_trainer', { placeId: GOLDS, trainerId: 'person_nobody', minutes: 60 }).ok).toBe(false);
    expect(bookedTrainer(sim, sim.player, GOLDS)).toBeUndefined();

    const trainers = ensureTrainers(sim, GOLDS);
    expect(trainers).toHaveLength(2);
    expect(ensureTrainers(sim, GOLDS).map((t) => t.id)).toEqual(trainers.map((t) => t.id));
    const trainer = trainers[0]!;
    const funds = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const hired = must<{ cost: number }>(sim, 'gym.hire_trainer', { placeId: GOLDS, trainerId: trainer.id, minutes: 60 });
    expect(hired.cost).toBeGreaterThan(0);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(funds - hired.cost);
    expect(bookedTrainer(sim, sim.player, GOLDS)?.id).toBe(trainer.id);
    expect(findRelationship(sim, sim.player.id, trainer.id)).toBeDefined();

    must(sim, 'gym.train_block', { placeId: GOLDS, exerciseId: 'bench', sets: 3, intensity: 'steady' });
    must(sim, 'gym.finish_workout', { placeId: GOLDS, goal: 'Get Stronger' });
    const goal = factsOf(sim, trainer.id, { kind: 'goal', aboutId: sim.player.id })[0];
    expect(goal?.text).toBe('Get Stronger');
    expect(factsOf(sim, trainer.id, { kind: 'meeting', aboutId: sim.player.id })).toHaveLength(1);
    expect(factsOf(sim, trainer.id, { kind: 'preference', aboutId: sim.player.id })[0]?.text).toMatch(/strength/);
  });
});

describe('afterwards', () => {
  it('the engine keeps the workout, recovery is scheduled, and readiness comes back', () => {
    const sim = aLife();
    walkTo(sim, GOLDS);
    must(sim, 'gym.buy_pass', { placeId: GOLDS, product: 'day_pass' });
    must(sim, 'gym.check_in', { placeId: GOLDS });
    const fresh = readiness(sim.player);
    must(sim, 'gym.train_block', { placeId: GOLDS, exerciseId: 'squat', sets: 4, intensity: 'hard' });
    must(sim, 'gym.train_block', { placeId: GOLDS, exerciseId: 'deadlift', sets: 4, intensity: 'hard' });
    const done = must<{ workoutId: string; blocks: number }>(sim, 'gym.finish_workout', { placeId: GOLDS });
    expect(done.blocks).toBe(2);
    const workout = sim.universe.workouts[done.workoutId]!;
    expect(workout.blocks.map((b) => b.exerciseId)).toEqual(['squat', 'deadlift']);
    expect(workoutsOf(sim, sim.player.id)).toHaveLength(1);
    expect(trainingOf(sim.player).current).toBeUndefined();
    expect(attempt(sim, 'gym.finish_workout', { placeId: GOLDS }).ok).toBe(false);

    const sore = trainingOf(sim.player).soreness;
    expect(sore).toBeGreaterThan(0);
    expect(sim.universe.scheduled.some((i) => i.kind === 'fitness.recovery' && i.status === 'pending')).toBe(true);
    // Sore legs read as less ready, all else being equal.
    const withSoreness = readiness(sim.player);
    trainingOf(sim.player).soreness = 0;
    expect(readiness(sim.player)).toBeGreaterThan(withSoreness);
    trainingOf(sim.player).soreness = sore;

    sim.advanceTo(sim.now + 4 * MS_DAY);
    expect(trainingOf(sim.player).soreness).toBe(0);
    expect(sim.ledger.audit()).toEqual([]);
    void fresh;
  });
});
