/**
 * The scenes themselves, played through.
 *
 * The gym from the street to the shower, with a stale click and a walk-out
 * in the middle. A meal from "where" to "fed". A run from "where" to "done".
 * And each of them skipped, landing where the same commands land.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { placesNear } from '@/engine/systems/places';
import { activeScene, sceneView, type ChooseResult } from '@/engine/systems/scenes';
import { membershipFor, trainingOf, workoutsOf } from '@/engine/systems/fitness';
import { factsOf } from '@/engine/systems/memory';

const GOLDS = 'gym-la-golds-venice';

function aLife(seed = 'played'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 50_000_00, 'Test funding', 'other');
  return sim;
}

function open(sim: Simulation, definitionId: string, input: Record<string, unknown> = {}) {
  const result = sim.execute<{ sceneId: string }>({ kind: 'scene.start', payload: { definitionId, input } });
  expect(result.ok, result.error).toBe(true);
  return activeScene(sim)!;
}

function pick(sim: Simulation, choiceId: string): ChooseResult {
  const scene = activeScene(sim)!;
  const result = sim.execute<ChooseResult>({ kind: 'scene.choose', payload: { sceneId: scene.id, revision: scene.revision, choiceId } });
  expect(result.ok, `${choiceId}: ${result.error}`).toBe(true);
  return result.value!;
}

function say(sim: Simulation, text: string): ChooseResult {
  const scene = activeScene(sim)!;
  const result = sim.execute<ChooseResult>({ kind: 'scene.choose', payload: { sceneId: scene.id, revision: scene.revision, text } });
  expect(result.ok, `${text}: ${result.error}`).toBe(true);
  return result.value!;
}

function choices(sim: Simulation): string[] {
  return sceneView(sim, activeScene(sim)!).choices.filter((c) => !c.disabled).map((c) => c.id);
}

describe('the gym', () => {
  it('from the street to the shower', () => {
    const sim = aLife();
    const scene = open(sim, 'fitness.gym', { placeId: GOLDS });
    expect(scene.node).toBe('arrive');
    expect(scene.placeId).toBeUndefined();
    const view = sceneView(sim, scene);
    expect(view.eyebrow).toBe('A Real Gym');
    expect(view.text).toMatch(/1965/);
    expect(choices(sim)).toContain('go:walk');

    pick(sim, 'go:walk');
    expect(activeScene(sim)!.node).toBe('desk');
    expect(activeScene(sim)!.placeId).toBe(GOLDS);
    expect(sim.player.currentPlaceId).toBe(GOLDS);
    expect(choices(sim)).toEqual(['pass:day_pass', 'pass:monthly', 'pass:annual']);

    const funds = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    pick(sim, 'pass:day_pass');
    expect(membershipFor(sim, sim.player.id, GOLDS)?.product).toBe('day_pass');
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBeLessThan(funds);
    expect(activeScene(sim)!.node).toBe('plan');
    expect(trainingOf(sim.player).current?.placeId).toBe(GOLDS);

    pick(sim, 'focus:strength');
    expect(activeScene(sim)!.node).toBe('pick');
    expect(choices(sim)).toContain('ex:squat');
    pick(sim, 'ex:squat');
    expect(activeScene(sim)!.node).toBe('effort');
    const before = sim.now;
    pick(sim, 'go:steady');
    expect(sim.now).toBeGreaterThan(before);
    expect(activeScene(sim)!.node).toBe('pick');
    expect(activeScene(sim)!.context['blocks']).toBe(1);
    expect(trainingOf(sim.player).lifts['squat']).toBeDefined();

    // Typed, this time.
    say(sim, 'deadlift');
    expect(activeScene(sim)!.node).toBe('effort');
    say(sim, 'easy');
    expect(activeScene(sim)!.context['blocks']).toBe(2);

    pick(sim, 'done');
    expect(activeScene(sim)!.node).toBe('cooldown');
    expect(choices(sim)).toContain('shower');
    const hygiene = sim.player.wellbeing.hygiene;
    pick(sim, 'shower');
    expect(sim.player.wellbeing.hygiene).toBeGreaterThan(hygiene);
    expect(activeScene(sim)!.node).toBe('cooldown');
    pick(sim, 'finish');
    expect(activeScene(sim)!.node).toBe('reflect');
    expect(workoutsOf(sim, sim.player.id)).toHaveLength(1);
    expect(workoutsOf(sim, sim.player.id)[0]!.blocks).toHaveLength(2);
    pick(sim, 'finish');
    expect(activeScene(sim)).toBeUndefined();
    expect(sim.universe.scenes.sessions[scene.id]!.status).toBe('completed');
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('is interrupted if you walk out mid-workout, and resumes when you walk back in', () => {
    const sim = aLife();
    open(sim, 'fitness.gym', { placeId: GOLDS });
    pick(sim, 'go:walk');
    pick(sim, 'pass:day_pass');
    pick(sim, 'focus:cardio');
    // The nearest café, so the detour is a detour and not a day's walk.
    const elsewhere = placesNear(sim, { mode: 'walk', kind: 'cafe', limit: 1 })[0]!.place;
    expect(sim.execute({ kind: 'go.to', payload: { placeId: elsewhere.id, mode: 'walk' } }).ok).toBe(true);
    const result = pick(sim, 'ex:treadmill');
    expect(result.status).toBe('interrupted');
    expect(result.message).toMatch(/no longer at/);
    const scene = activeScene(sim)!;
    expect(scene.status).toBe('interrupted');
    expect(sceneView(sim, scene).eyebrow).toBe('Interrupted');
    expect(sim.execute({ kind: 'scene.resume', payload: { sceneId: scene.id } }).ok).toBe(false);
    expect(sim.execute({ kind: 'go.to', payload: { placeId: GOLDS, mode: 'walk' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'scene.resume', payload: { sceneId: scene.id } }).ok).toBe(true);
    expect(activeScene(sim)!.node).toBe('pick');
    pick(sim, 'ex:treadmill');
    // Three walks across town have taken their toll; the scene only offers easy.
    pick(sim, 'go:easy');
    expect(activeScene(sim)!.context['blocks']).toBe(1);
  });

  it('a trainer costs money, asks what you are for, and remembers', () => {
    const sim = aLife();
    open(sim, 'fitness.gym', { placeId: GOLDS });
    pick(sim, 'go:walk');
    pick(sim, 'pass:monthly');
    expect(choices(sim)).toContain('trainer');
    pick(sim, 'trainer');
    const hire = choices(sim).find((c) => c.startsWith('hire:'))!;
    const funds = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    pick(sim, hire);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBeLessThan(funds);
    expect(activeScene(sim)!.node).toBe('goal');
    pick(sim, 'goal:camera');
    expect(activeScene(sim)!.node).toBe('plan');
    expect(sceneView(sim, activeScene(sim)!).text).toMatch(/is with you/);
    pick(sim, 'focus:strength');
    pick(sim, 'ex:bench');
    pick(sim, 'go:steady');
    pick(sim, 'done');
    pick(sim, 'finish');
    const trainerId = hire.slice(5);
    expect(factsOf(sim, trainerId, { kind: 'goal', aboutId: sim.player.id })[0]?.text).toBe('Look Right On Camera');

    // Next time, they remember without asking.
    pick(sim, 'finish');
    open(sim, 'fitness.gym', { placeId: GOLDS });
    pick(sim, 'checkin');
    pick(sim, 'trainer');
    expect(sceneView(sim, activeScene(sim)!).choices.find((c) => c.id === hire)?.detail).toMatch(/Knows you/);
    pick(sim, hire);
    expect(activeScene(sim)!.node).toBe('plan');
    expect(sceneView(sim, activeScene(sim)!).text).toMatch(/remembers that you want to look right on camera/);
  });

  it('skipped, it buys the cheapest way in and does a steady session', () => {
    const sim = aLife();
    const result = sim.execute<{ lines: string[] }>({ kind: 'scene.quick', payload: { definitionId: 'fitness.gym', input: { placeId: GOLDS } } });
    expect(result.ok, result.error).toBe(true);
    expect(membershipFor(sim, sim.player.id, GOLDS)?.product).toBe('day_pass');
    expect(workoutsOf(sim, sim.player.id)[0]!.blocks.length).toBeGreaterThanOrEqual(1);
    expect(sim.player.currentPlaceId).toBe(GOLDS);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('a meal out', () => {
  it('from where to fed', () => {
    const sim = aLife();
    open(sim, 'life.meal');
    expect(activeScene(sim)!.node).toBe('choose');
    const first = choices(sim)[0]!;
    expect(first).toMatch(/^place:/);
    pick(sim, first);
    expect(activeScene(sim)!.node).toBe('arrive');
    pick(sim, 'go:walk');
    expect(activeScene(sim)!.node).toBe('menu');
    expect(activeScene(sim)!.placeId).toBe(first.slice(6));
    const dish = choices(sim).find((c) => c.startsWith('dish:'))!;
    pick(sim, dish);
    expect(choices(sim)).toContain('order');
    const fed = sim.player.wellbeing.nourishment;
    const funds = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    pick(sim, 'order');
    expect(activeScene(sim)!.node).toBe('reflect');
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(fed);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBeLessThan(funds);
    pick(sim, 'finish');
    expect(activeScene(sim)).toBeUndefined();
  });

  it('skipped, it eats somewhere cheap and near', () => {
    const sim = aLife();
    const fed = sim.player.wellbeing.nourishment;
    const result = sim.execute({ kind: 'scene.quick', payload: { definitionId: 'life.meal' } });
    expect(result.ok, result.error).toBe(true);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(fed);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('a run', () => {
  it('from where to done', () => {
    const sim = aLife();
    open(sim, 'life.run', { minutes: 40 });
    expect(activeScene(sim)!.node).toBe('route');
    expect(choices(sim)).toContain('route:streets');
    pick(sim, 'route:streets');
    expect(activeScene(sim)!.node).toBe('pace');
    const before = { now: sim.now, fitness: sim.player.wellbeing.fitness };
    pick(sim, 'pace:hard');
    expect(activeScene(sim)!.node).toBe('reflect');
    expect(sim.now).toBe(before.now + 28 * 60_000);
    expect(sim.player.wellbeing.fitness).toBeGreaterThan(before.fitness);
    pick(sim, 'finish');
    expect(activeScene(sim)).toBeUndefined();
  });

  it('goes to the park first if that is where you chose', () => {
    const sim = aLife();
    open(sim, 'life.run');
    const park = choices(sim).find((c) => c.startsWith('route:') && c !== 'route:streets');
    if (!park) return;
    pick(sim, park);
    pick(sim, 'pace:easy');
    expect(sim.player.currentPlaceId).toBe(park.slice(6));
  });
});
