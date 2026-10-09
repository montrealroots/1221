/**
 * The attributes (`systems/attributes.ts`): presence and composure, each
 * drawn as the business has it, and each read by an outcome. Reputation and
 * recognition were tested here until 2026-10-09, when they went with the
 * career that read them.
 */

import { createSave,loadSave,quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { ATTRIBUTES,nerves } from '@/engine/systems/attributes';
import type { Craft } from '@/engine/systems/school';
import { evenCraft,nightOf } from '@/engine/systems/school';
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
  it('gives the faculty’s first choice a presence of 55 to 80, and a composure by their stability', () => {
    const presences: number[] = [];
    for (let n = 0; n < 20; n += 1) {
      const sim = life(`attr-draw-${n}`);
      const a = sim.player.attrs!;
      presences.push(a.presence);
      expect(a.presence).toBeGreaterThanOrEqual(55);
      expect(a.presence).toBeLessThanOrEqual(80);
      expect(a.composure).toBeCloseTo(ATTRIBUTES.composureStart.base + ATTRIBUTES.composureStart.perStability * sim.player.personality.emotionalStability, 0);
      expect(Object.keys(a).sort()).toEqual(['composure', 'presence']);
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
  it('puts nerves before a performance, and grows composure by it', () => {
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
  });

  it('reads a night by presence as well as the craft: the same night, read higher with more of it', () => {
    // The falsifiability test: only presence moves, and the night's band moves with it somewhere in sixty nights.
    const sim = life('attr-night');
    const nights = (presence: number) => { sim.player.attrs!.presence = presence; return Array.from({ length: 60 }, (_, n) => nightOf(sim, sim.player, `p${n}`, 57, 1)); };
    const rank = (x: string): number => ({ off: 0, solid: 1, strong: 2 } as Record<string, number>)[x] ?? 3;
    const low = nights(55).map(rank);
    const high = nights(80).map(rank);
    expect(high.every((h, i) => h >= low[i]!)).toBe(true);
    expect(high.reduce((a, b) => a + b, 0)).toBeGreaterThan(low.reduce((a, b) => a + b, 0));
    // At the middle of the draw, presence moves nothing.
    const mid = ATTRIBUTES.presence.from + ATTRIBUTES.presence.span / 2;
    sim.player.attrs!.presence = mid;
    const atMid = Array.from({ length: 60 }, (_, n) => nightOf(sim, sim.player, `p${n}`, 57, 1));
    expect(atMid.filter((x) => x === 'remarkable').length).toBeGreaterThanOrEqual(nights(55).filter((x) => x === 'remarkable').length);
  });
});

describe('nerves', () => {
  it('cost less with more composure', () => {
    const sim = pro('attr-composure');
    const p = sim.player;
    p.attrs!.composure = 30;
    p.wellbeing.stress = 0;
    const shaky = nerves(sim, p, 'performance');
    const shakyStress = p.wellbeing.stress;
    p.attrs!.composure = 90;
    p.wellbeing.stress = 0;
    const steady = nerves(sim, p, 'performance');
    expect(steady).toBeGreaterThan(shaky);
    expect(p.wellbeing.stress).toBeLessThan(shakyStress);
    expect(shaky).toBeCloseTo(1 - ATTRIBUTES.nerves.focusCost * 0.7, 10);
  });
});
