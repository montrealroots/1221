/**
 * Two things declared and read by nothing, taken out (2026-10-12).
 *
 * - The clock's 'fast' and 'faster' speeds: `world.set_preferences` took them and the live loop ran them at 60 and 600
 *   times real time, but the only control, Play and Pause, sends 'paused' or 'live'. The command refuses them now, and
 *   a save that stored one opens at 'live', as a save that stored the old 'standard' already did.
 * - The experience record's `materials` (each material's times, best and last) and a way of playing's `best`: written
 *   on every judged piece and read by nothing (`systems/artistry.ts` reads the features and the ways' chosen and
 *   shown). A piece played now leaves neither on the record, and what is read still counts.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, migrate, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MATERIAL_BY_ID } from '@/engine/content/material';
import { noteMaterial } from '@/engine/systems/experience';

describe('the clock’s speeds', () => {
  it('refuses fast and faster, which no control sends, and says what the clock runs', () => {
    const sim = quickSave({}, 'g6-speed');
    const before = sim.universe.preferences.timeSpeed;
    for (const speed of ['fast', 'faster']) {
      const answer = sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: speed } });
      expect(answer.ok, speed).toBe(false);
      expect(answer.error).toBe('The clock can only be set to Play or Pause.');
      expect(sim.universe.preferences.timeSpeed).toBe(before);
    }
    // What the control sends still goes through.
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } }).ok).toBe(true);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'live' } }).ok).toBe(true);
    expect(sim.universe.preferences.timeSpeed).toBe('live');
  });

  it('opens a save that stored fast or faster at live, says so, and changes nothing on a second open', () => {
    for (const speed of ['fast', 'faster']) {
      const u = JSON.parse(JSON.stringify(quickSave({}, `g6-speed-${speed}`).universe));
      u.preferences.timeSpeed = speed;
      const report = migrate(u);
      expect(u.preferences.timeSpeed, speed).toBe('live');
      expect(report.steps.join(' ')).toMatch(/live/);
      const once = JSON.stringify(u);
      const again = migrate(u);
      expect(JSON.stringify(u)).toBe(once);
      expect(again.steps.join(' ')).not.toMatch(/fast/i);
    }
  });

  it('runs only paused and live in the app’s loop', () => {
    const CONTEXT = readFileSync(new URL('../src/app/game-context.tsx', import.meta.url), 'utf8');
    const table = /const SPEED_MULTIPLIER[^{]*\{([^}]*)\}/.exec(CONTEXT)?.[1] ?? '';
    const keys = [...table.matchAll(/^\s*(\w+):/gm)].map((m) => m[1]);
    expect(keys).toEqual(['paused', 'live']);
  });
});

// --- The experience record, played through the commands.

function student(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return sim;
}
const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
  return sim.execute<Record<string, unknown>>({ kind, payload });
};

describe('the experience record', () => {
  it('keeps no materials and no side’s best from a taped brief, and still counts what is read', () => {
    const sim = student('g6-xp-played');
    expect(go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'guarded', scale: 'restrained' }).ok).toBe(true);
    const taped = go(sim, 'practice.self_tape', { genre: 'drama' });
    expect(taped.ok).toBe(true);
    expect(typeof taped.value!.overall).toBe('number');
    const xp = sim.player.experience!;
    expect('materials' in xp).toBe(false);
    for (const [side, r] of Object.entries(xp.approaches)) expect('best' in r, side).toBe(false);
    // What `systems/artistry.ts` reads is still there: the side chosen and shown, the features met.
    expect(xp.approaches.restrained!.chosen).toBeGreaterThan(0);
    expect(xp.approaches.restrained!.shown).toBeGreaterThan(0);
    expect(Object.values(xp.features).some((f) => f.met > 0)).toBe(true);
  });

  it('keeps neither from a judged piece noted directly, whatever its result', () => {
    const sim = student('g6-xp-noted');
    const m = MATERIAL_BY_ID['earnest-2']!;
    for (const overall of [40, 80]) noteMaterial(sim.player, { material: m, at: sim.now, overall, approaches: ['driven'], shown: true });
    const xp = sim.player.experience!;
    expect('materials' in xp).toBe(false);
    expect('best' in xp.approaches.driven!).toBe(false);
    expect(xp.approaches.driven!.shown).toBe(2);
  });
});
