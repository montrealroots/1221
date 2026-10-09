/**
 * The attributes (`systems/attributes.ts`): presence, composure, reputation
 * and recognition, each drawn or earned as the business has it, and each
 * read by an outcome.
 */

import { createSave,loadSave,quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { ATTRIBUTES,earn,fadeRecognition,nerves } from '@/engine/systems/attributes';
import type { Craft } from '@/engine/systems/school';
import { evaluate,evenCraft } from '@/engine/systems/school';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { describe,expect,it } from 'vitest';

const craft = (level: number): Craft => (evenCraft(level));
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
function pro(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = craft(75);
  return sim;
}

describe('drawn at the start of a life', () => {
  it('gives the faculty’s first choice a presence of 55 to 80, a composure by their stability, and no name yet', () => {
    const presences: number[] = [];
    for (let n = 0; n < 20; n += 1) {
      const sim = life(`attr-draw-${n}`);
      const a = sim.player.attrs!;
      presences.push(a.presence);
      expect(a.presence).toBeGreaterThanOrEqual(55);
      expect(a.presence).toBeLessThanOrEqual(80);
      expect(a.composure).toBeCloseTo(ATTRIBUTES.composureStart.base + ATTRIBUTES.composureStart.perStability * sim.player.personality.emotionalStability, 0);
      expect(a.reputation).toBe(0);
      expect(a.recognition).toBe(0);
    }
    // Two lives, two draws; the same life, the same draw.
    expect(new Set(presences).size).toBeGreaterThan(10);
    expect(life('attr-draw-3').player.attrs!.presence).toBe(presences[3]);
  });

  it('draws them for a save from before them when it opens', () => {
    const sim = life('attr-old');
    const before = sim.player.attrs!;
    delete sim.player.attrs;
    const opened = loadSave(JSON.parse(JSON.stringify(sim.universe)));
    expect(opened.player.attrs).toEqual(before);
  });
});

describe('composure', () => {

  it('keeps stress off zero for a student through a term of performing', () => {
    const sim = life('attr-term');
    sim.player.wellbeing.stress = 0;
    for (let n = 0; n < 5; n += 1) nerves(sim, sim.player, 'performance');
    expect(sim.player.wellbeing.stress).toBeGreaterThan(0);
  });
});

describe('at school', () => {
  it('puts nerves before a performance, and gives a Yale Rep night to the reputation', () => {
    const sim = life('attr-school-show');
    const p = sim.player;
    p.school!.casting = { production: 'A Test Play', role: 'A Part In A New Play', kind: 'carlotta', term: 0, performed: 0 };
    p.school!.rep = { production: 'The Seagull', role: 'Konstantin', kind: 'role', term: 0, performed: 0 };
    p.awakeSince = sim.now - 60_000;
    p.wellbeing.stress = 0;
    const composure = p.attrs!.composure;
    sim.schedule({ at: sim.now + 60_000, kind: 'school.call', label: 'A Test Play: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 150, payload: { personId: p.id, call: 'performance' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(p.school!.casting!.performed).toBe(1);
    expect(p.wellbeing.stress).toBeGreaterThan(0);
    expect(p.attrs!.composure).toBeGreaterThan(composure);
    expect(p.attrs!.reputation).toBe(0);
    sim.schedule({ at: sim.now + 60_000, kind: 'school.call', label: 'The Seagull: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 180, payload: { personId: p.id, call: 'performance', which: 'rep' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(p.attrs!.reputation).toBe(ATTRIBUTES.reputation.repPerformance);
  });
});

describe('reputation', () => {
  it('is earned less the nearer the top, and lost in points', () => {
    const sim = pro('attr-earn');
    earn(sim, sim.player, 10);
    expect(sim.player.attrs!.reputation).toBe(10);
    earn(sim, sim.player, 10);
    expect(sim.player.attrs!.reputation).toBe(19);
    earn(sim, sim.player, -25);
    expect(sim.player.attrs!.reputation).toBe(0);
  });

  it('is given by the degree, and taken by a dismissal', () => {
    const grad = life('attr-degree');
    grad.player.school!.standing = 'good';
    const p = grad.player;
    for (const term of [0, 1, 2, 3, 4, 5]) { Object.assign(p.school!.tally, { classDays: 10, attended: 10, excused: 0, calls: 0, answered: 0, shifts: 0, worked: 0 }); p.school!.tally.craftAtStart = Object.fromEntries(Object.entries(p.craft!).map(([k, v]) => [k, v - 3])) as Craft; evaluate(grad, p, term); }
    expect(p.school!.standing).toBe('good');
    // Commencement, brought to now: the degree is on the record.
    const commencement = grad.universe.scheduled.find((i) => i.kind === 'school.commencement' && i.status === 'pending')!;
    grad.timeline.reschedule(commencement.id, grad.now + 60_000);
    grad.advanceTo(grad.now + 2 * 60_000);
    expect(p.school!.standing).toBe('graduated');
    expect(p.attrs!.reputation).toBe(ATTRIBUTES.reputation.degree);
    const out = life('attr-out');
    const q = out.player;
    q.attrs!.reputation = 20;
    for (const term of [0, 1, 2]) { Object.assign(q.school!.tally, { classDays: 20, attended: 10, excused: 0 }); evaluate(out, q, term); }
    expect(q.school!.standing).toBe('dismissed');
    expect(q.attrs!.reputation).toBe(20 + ATTRIBUTES.reputation.dismissed);
  });
});

describe('recognition', () => {

  it('fades each month without new work', () => {
    const sim = pro('attr-fade');
    sim.player.attrs!.recognition = 50;
    fadeRecognition(sim, sim.player);
    expect(sim.player.attrs!.recognition).toBeCloseTo(50 * (1 - ATTRIBUTES.recognition.fadePerMonth), 2);
  });
});

describe('building them on purpose', () => {

  it('halves an audition’s nerves with a coach', () => {
    const sim = pro('attr-coach');
    const p = sim.player;
    p.attrs!.composure = 30;
    p.wellbeing.stress = 0;
    nerves(sim, p, 'audition');
    const full = p.wellbeing.stress;
    p.attrs!.composure = 30;
    p.wellbeing.stress = 0;
    const kept = nerves(sim, p, 'audition', ATTRIBUTES.build.coachedNerves);
    expect(p.wellbeing.stress).toBeCloseTo(full / 2, 10);
    expect(kept).toBeCloseTo(1 - ATTRIBUTES.nerves.focusCost * 0.7 * 0.5, 10);
  });
});
