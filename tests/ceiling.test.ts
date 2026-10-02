/**
 * How far an actor can grow (2026-09-28): each skill to where it began and
 * 26 points more, fitted to McDaniel, Schmidt and Hunter's .49 and .15
 * (`CEILING`). Until then everybody grew toward 100, and anybody who kept
 * working reached 99 by thirty.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CEILING, ceilingOf, grow, meanCraft, type Craft } from '@/engine/systems/school';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', tutorial: false });

describe('the ceiling', () => {
  it('is each skill as admitted and 26 more, for the actor and every classmate', () => {
    const sim = life('ceiling-admit');
    const p = sim.player;
    for (const [k, v] of Object.entries(p.craft!)) expect(p.craftCeiling![k as keyof Craft]).toBeCloseTo(Math.min(100, v + CEILING.headroom), 1);
    for (const mate of p.school!.classmates) expect(meanCraft(mate.ceiling!) - meanCraft(mate.craft)).toBeCloseTo(CEILING.headroom, 0);
    expect(CEILING.headroom).toBe(26);
  });

  it('is approached and never passed, however much work there is', () => {
    const sim = life('ceiling-grow');
    const craft = sim.player.craft!;
    const top = ceilingOf(craft, 'scene');
    expect(top).toBeLessThan(100);
    for (let i = 0; i < 20000; i += 1) grow(craft, 'scene', 1.2, 2);
    expect(craft.scene).toBeLessThanOrEqual(top);
    expect(craft.scene).toBeGreaterThan(top - 1);
    // A classmate the same.
    const mate = sim.player.school!.classmates[0]!;
    const mateTop = ceilingOf(mate.craft, 'voice');
    for (let i = 0; i < 20000; i += 1) grow(mate.craft, 'voice', 1.2, 2);
    expect(mate.craft.voice).toBeLessThanOrEqual(mateTop);
  });

  it('comes back with a save, and a save from before ceilings keeps its skills and grows each to the average admit’s at most', () => {
    const sim = life('ceiling-save');
    const again = loadSave(deserialise(serialise(sim.universe)));
    const craft = again.player.craft!;
    expect(ceilingOf(craft, 'emotion')).toBe(again.player.craftCeiling!.emotion);
    const old = deserialise(serialise(sim.universe));
    const person = old.people[old.playerId]!;
    delete person.craftCeiling;
    person.craft!.scene = 97;
    person.craft!.voice = 50;
    const opened = loadSave(old);
    const c = opened.player.craft!;
    expect(ceilingOf(c, 'scene')).toBe(97);
    expect(ceilingOf(c, 'voice')).toBe(CEILING.averageTalent + CEILING.headroom);
    grow(c, 'scene', 1.2, 2);
    expect(c.scene).toBe(97);
  });
});
