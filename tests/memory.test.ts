/**
 * What people remember: facts, not dialogue.
 *
 * The same thing told twice is one fact with the greater weight. What has
 * expired is not returned and is dropped. A person carries only so many, and
 * the least important go first. Facts travel with the save.
 */

import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MAX_FACTS_PER_PERSON, factOf, factsOf, forgetFact, rememberFact } from '@/engine/systems/memory';

function someone(seed = 'memory') {
  const sim = quickSave({}, seed);
  const other = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
  return { sim, other };
}

describe('remembering', () => {
  it('keeps one fact for one thing, however often it is said', () => {
    const { sim, other } = someone();
    rememberFact(sim, other.id, { kind: 'goal', aboutId: sim.player.id, text: 'Get Stronger', weight: 50, sourceKind: 'test' });
    const again = rememberFact(sim, other.id, { kind: 'goal', aboutId: sim.player.id, text: 'Get Stronger', weight: 80, sourceKind: 'test' });
    expect(factsOf(sim, other.id)).toHaveLength(1);
    expect(again?.weight).toBe(80);
    expect(factOf(sim, other.id, 'goal', sim.player.id)?.text).toBe('Get Stronger');
  });

  it('returns the important ones first and leaves out what has expired', () => {
    const { sim, other } = someone();
    rememberFact(sim, other.id, { kind: 'topic', text: 'Talked about the strike.', weight: 20, sourceKind: 'test' });
    rememberFact(sim, other.id, { kind: 'promise', aboutId: sim.player.id, text: 'Said they would call on Sunday.', weight: 90, sourceKind: 'test' });
    rememberFact(sim, other.id, { kind: 'meeting', text: 'Coffee last Tuesday.', weight: 40, expiresAt: sim.now + 10 * MS_DAY, sourceKind: 'test' });
    expect(factsOf(sim, other.id).map((f) => f.kind)).toEqual(['promise', 'meeting', 'topic']);
    sim.advanceTo(sim.now + 11 * MS_DAY);
    expect(factsOf(sim, other.id).map((f) => f.kind)).toEqual(['promise', 'topic']);
    expect(factsOf(sim, other.id, { kind: 'promise', aboutId: sim.player.id })).toHaveLength(1);
  });

  it('carries only so many, and drops the least important', () => {
    const { sim, other } = someone();
    for (let i = 0; i < MAX_FACTS_PER_PERSON + 10; i++) {
      rememberFact(sim, other.id, { kind: 'event', text: `Thing ${i}`, weight: i, sourceKind: 'test' });
    }
    const kept = factsOf(sim, other.id);
    expect(kept).toHaveLength(MAX_FACTS_PER_PERSON);
    expect(Math.min(...kept.map((f) => f.weight))).toBe(10);
  });

  it('can be forgotten, and survives a save', () => {
    const { sim, other } = someone();
    const fact = rememberFact(sim, other.id, { kind: 'boundary', aboutId: sim.player.id, text: 'Does not drink.', weight: 70, sourceKind: 'test' })!;
    const loaded = loadSave(deserialise(serialise(sim.universe)));
    expect(factsOf(loaded, other.id)[0]?.text).toBe('Does not drink.');
    expect(forgetFact(loaded, other.id, fact.id)).toBe(true);
    expect(factsOf(loaded, other.id)).toHaveLength(0);
    expect(forgetFact(loaded, 'person_nobody', fact.id)).toBe(false);
  });
});
