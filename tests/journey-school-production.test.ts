/**
 * A journey through one production (`systems/production.ts`, from
 * 2026-10-07): cast in the first spring's Carlotta Festival, the read-through,
 * a blocking call missed for a day in New York and caught up from the book,
 * the director's notes worked on between calls, the technical and the dress,
 * and the four nights played on what the rehearsals made; saved and loaded
 * midway, every step the button's command, and the ledgers whole at the end.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { CALL_KIND, type Casting } from '@/engine/systems/school';
import { hasProcess, nightFactor } from '@/engine/systems/production';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

describe('journey: a production, from the read-through to the closing night', () => {
  it('rehearses, misses and catches up, works the notes, and plays the nights on it', () => {
    let sim = createSave(1, 'jr-production', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.player.school!.classmates[0]!.craft.scene = 99;
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    const casting = () => sim.player.school!.casting!;
    const procOf = (c: Casting) => (hasProcess(c) ? c.process : undefined);
    const proc = () => procOf(casting());
    expect(casting()).toMatchObject({ kind: 'carlotta', performed: 0 });
    const ours = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep').sort((a, b) => a.at - b.at);
    const rehearsals = ours.filter((c) => c.payload.call === 'rehearsal');
    const nights = ours.filter((c) => c.payload.call === 'performance');
    expect(nights).toHaveLength(4);

    // The read-through.
    tended(sim, rehearsals[0]!.at + 7 * MS_HOUR);
    expect(proc()).toMatchObject({ calls: 1, notes: [] });

    tended(sim, rehearsals[1]!.at + 7 * MS_HOUR);
    // A day in New York over the third call, a blocking rehearsal: missed, a gap in the book.
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, rehearsals[2]!.at + 7 * MS_HOUR);
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(rehearsals[2]!.status).toBe('missed');
    expect(proc()!.blockingMissed).toBe(1);
    sim = reload(sim);
    expect(sim.execute({ kind: 'school.review_blocking', payload: {} }).ok).toBe(true);
    expect(proc()!.blockingMissed).toBe(0);

    // Each evening after a call: the part, and the director's note.
    for (let k = 3; k < rehearsals.length - 1; k += 1) {
      tended(sim, rehearsals[k]!.at + 6 * MS_HOUR + 30 * 60_000);
      if (proc()!.lines < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
      const last = proc()!.notes.at(-1);
      if (last && last.taken === undefined) expect(sim.execute({ kind: 'school.work_note', payload: {} }).ok).toBe(true);
      if (k === 6) sim = reload(sim);
    }
    // The dress: a reading, and no performance counted.
    tended(sim, rehearsals.at(-1)!.at + 7 * MS_HOUR);
    expect(proc()!.dress).toBeDefined();
    expect(casting().performed).toBe(0);
    expect(proc()!.notes.every((n) => n.taken)).toBe(true);
    const factor = nightFactor(casting());
    expect(factor).toBeGreaterThan(1);

    // The four nights, each played once on it.
    tended(sim, nights.at(-1)!.at + 4 * MS_HOUR);
    expect(casting().performed).toBe(4);
    expect(casting().nights).toBeDefined();
    expect(nightFactor(casting())).toBe(factor);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});
