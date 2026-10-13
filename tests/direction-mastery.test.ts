/**
 * The mastery contract with the director's notes worked (from 2026-10-12; the owner's brief of that day, section 12).
 * A mastered student cast in the first spring's festival, every note worked the first way offered and each change
 * kept, comes out of the part's own forecast at exactly 100, with mastery: the ways a note offers move weight and
 * rehearse a change in; they never cap what a mastered actor's night can be.
 * TEST SETUP: every ability and technique at full, and the day kept rested so the calls are what's measured, as
 * tests/direction.test.ts plays the festival.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { attributesOf, abilityFull } from '@/engine/systems/attributes';
import { CALL_KIND } from '@/engine/systems/school';
import { hasProcess } from '@/engine/systems/production';
import { workPiece } from '@/engine/systems/workpieces';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

describe('a part at mastery, its notes worked', () => {
  it('is forecast at exactly 100, with every note worked and each change kept', () => {
    const sim = createSave(1, 'direction-mastery', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const p = sim.player;
    for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 100;
    const a = attributesOf(sim, p) as unknown as Record<string, number>;
    for (const k of Object.keys(a)) a[k] = 100;
    p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    const proc = () => { const c = sim.player.school!.casting!; return hasProcess(c) ? c.process : undefined; };
    const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((x, y) => x.at - y.at);
    expect(calls.length).toBeGreaterThan(2);
    let worked = 0;
    for (let k = 0; k < calls.length - 1; k += 1) {
      tended(sim, calls[k]!.at + 6 * MS_HOUR + 30 * 60_000);
      if ((proc()?.lines ?? 1) < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
      if ((proc()?.blockingMissed ?? 0) > 0) sim.execute({ kind: 'school.review_blocking', payload: {} });
      const last = proc()?.notes.at(-1);
      if (last && last.taken === undefined && !last.worked) {
        const r = sim.execute<{ pending?: boolean }>({ kind: 'school.work_note', payload: {} });
        if (r.ok) {
          worked += 1;
          if (r.value?.pending) sim.execute({ kind: 'work.settle', payload: { piece: 'part:school', keep: true } });
        }
      }
    }
    tended(sim, calls.at(-1)!.at + 7 * MS_HOUR);
    expect(worked).toBeGreaterThan(0);
    // TEST SETUP: kept fit, as a mastered actor is (four months untended let fitness, and with it stamina, fall).
    p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
    const e = workPiece(sim, sim.player, 'part:school')!.forecast();
    expect(e.overall).toBe(100);
    expect(e.mastery).toBe(true);
  });
});
