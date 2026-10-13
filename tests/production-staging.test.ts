/**
 * A production's calls numbered and staged on the calls it keeps (from 2026-10-12; `cast`, `systems/school.ts`).
 *
 * Measured by the productions reading of 2026-10-12 on seed 'of-a': a fall Thesis I casting beside a Yale Rep
 * understudy assignment had 20 rehearsal calls numbered and only 8 booked. Calls 2 to 16 and 17 to 20 were dropped,
 * the technical and the dress among them, because every School rehearsal on a Rep performance night was dropped for an
 * understudy's night on call, after the calls had been staged. The par counted calls never given, and a student who
 * came to every call could never reach complete preparation.
 *
 * TEST SETUP: a strong student (so the Rep casts them) at the start of the second term, as tests/school.test.ts sets it.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CALL_KIND } from '@/engine/systems/school';
import { completeFor, parFor } from '@/engine/systems/production';

function secondTerm(seed: string) {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  Object.assign(sim.player.craft!, { scene: 95, character: 95, emotion: 95 });
  sim.schedule({ at: sim.now + 60_000, kind: 'school.term', label: 'A Term Begins', category: 'school', priority: 30, payload: { personId: sim.player.id, term: 2 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  return sim;
}

describe('a production beside a Rep assignment', () => {
  for (const seed of ['of-a', 'both-2', 'staging-c']) {
    it(`numbers every rehearsal call it keeps, one to the last, with its technical and its dress (${seed})`, () => {
      const sim = secondTerm(seed);
      const ours = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((a, b) => a.at - b.at);
      if (!ours.length) return; // Not cast in the School's production this term on this seed: nothing to number.
      const reps = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === CALL_KIND && i.payload.which === 'rep');
      expect(reps.length).toBeGreaterThan(0);
      const of = Number(ours[0]!.payload.of);
      expect(of).toBe(ours.length);
      expect(ours.map((c) => Number(c.payload.n))).toEqual(ours.map((_, i) => i + 1));
      if (of >= 4) {
        expect(ours.at(-1)!.payload.stage).toBe('dress');
        expect(ours.at(-2)!.payload.stage).toBe('tech');
      }
      // The par is what these calls make, and complete is reachable by coming to all of them.
      expect(parFor(of)).toBeGreaterThan(0);
      expect(completeFor({ process: { lines: 0, blocking: 0, calls: 0, blockingMissed: 0, notes: [], trained: 0, of } })!.blocking).toBeGreaterThan(0.5);
    });
  }
});
