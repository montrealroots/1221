/**
 * Brief 20, the creation area: the twelve abilities, each read where the player's work is judged, and nowhere it isn't.
 * For each, two lives alike in everything but that ability, at 30 and at 90, tape the same brief cold on the first
 * morning through `brief.choose` and `practice.self_tape`, and the more able is judged better (B2: skill does what it
 * should). And with every ability at 30 or at 90, the career posts the same parts on the same Mondays (B2: and no more:
 * skill isn't who a part is posted to).
 *
 * The brief each is taped on is the one of a sample of every seventh, the first twenty-five, on which 30 against 90
 * moved the result most, chosen 2026-10-21 on a life of another seed. On this file's life the same takes came to: Emotional
 * Depth, Found Footage's, 19.1 against 23.1; Presence, Yakuza's, 19.5 and 21.6; Listening, Yakuza's, 19.4 and 22.0;
 * Imagination, Dark Fantasy's, 17.9 and 20.7; Focus, Mystery's, 19.3 and 23.5; Memory, the second Caper's, 18.5 and 22.1;
 * Adaptability, Found Footage's, 19.2 and 22.6; Composure, the second Biker's, 18.1 and 22.8; Vocal Expression, Dark
 * Fantasy's, 18.4 and 20.5; Physical Expression, Action's, 18.3 and 21.5; Discipline, the second Caper's, 18.2 and 21.4;
 * Stamina, Superhero's, 18.7 and 21.2. Cold, so preparation holds every take low and alike; what moves is the ability.
 *
 * PLAYER JOURNEYS: a new life as creation makes it, born in New York, at Yale from 7:30 AM Monday 24 August 2026, begun
 * with "I Know SLATE." chosen, on this file's seed, b20-c-able. TEST SETUP: the ability set in the one place it's kept
 * (`CRAFT_ABILITY`, the attributes, fitness for stamina), as tests/attributes-phase-2b.test.ts sets it, and the first
 * morning's calendar cleared before the take.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { ABILITY_DEFS, type AbilityId } from '@/engine/content/abilities';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { CRAFT_ABILITY, abilityOf, attributesOf } from '@/engine/systems/attributes';

const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);
const life = () => createSave(1, 'b20-c-able', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', tutorial: false, paused: true });
/** TEST SETUP: an ability set, in the one place it's kept. */
function setAbility(sim: Simulation, a: AbilityId, level: number): void {
  const skill = CRAFT_ABILITY[a];
  if (skill) sim.player.craft![skill] = level;
  else if (a === 'stamina') sim.player.wellbeing.fitness = level;
  else (attributesOf(sim, sim.player) as unknown as Record<string, number>)[a] = level;
}
const BRIEF: Record<AbilityId, string> = {
  emotionalDepth: 'brief-found_footage', presence: 'brief-yakuza', listening: 'brief-yakuza', imagination: 'brief-dark_fantasy',
  focus: 'brief-mystery', memory: 'brief-caper-2', adaptability: 'brief-found_footage', composure: 'brief-biker-2',
  vocal: 'brief-dark_fantasy', physical: 'brief-action', discipline: 'brief-caper-2', stamina: 'brief-superhero',
};
/** The brief taped cold, through its commands, at a level of one ability: the judged result. */
function taped(a: AbilityId, level: number): number {
  const sim = life();
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  setAbility(sim, a, level);
  expect(abilityOf(sim, sim.player, a)).toBe(level);
  const b = BRIEF_BY_ID[BRIEF[a]]!;
  expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } }).ok).toBe(true);
  const r = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } });
  expect(r.ok, r.error).toBe(true);
  return r.value!.overall;
}

describe('the twelve abilities', () => {
  for (const d of ABILITY_DEFS) {
    it(`PLAYER JOURNEY: ${d.label}: the same brief taped cold is judged better at 90 than at 30`, () => {
      const [low, high] = [taped(d.id, 30), taped(d.id, 90)];
      expect(high, `${d.id}: ${low} → ${high}`).toBeGreaterThan(low + 1);
    });
  }

  it('PLAYER JOURNEY: every ability at 90 or at 30, the career posts the same parts on the same Mondays through the fall', () => {
    const at = (level: number) => {
      const sim = life();
      for (const d of ABILITY_DEFS) setAbility(sim, d.id, level);
      sim.advanceTo(EDT(2026, 12, 7, 10));
      return (sim.player.pro?.opportunities ?? []).map((o) => `${o.projectId}@${o.postedAt}`);
    };
    const [weak, strong] = [at(30), at(90)];
    expect(strong.length).toBeGreaterThan(2);
    expect(strong).toEqual(weak);
  });
});
