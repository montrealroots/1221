/**
 * A take read against the recording, in words (2026-10-12; `systems/ensemble.ts`).
 *
 * `sharedWords` named the reader by the first word of their name, which is a classmate's first name and, for the
 * recording a brief is read against when no classmate reads (`systems/briefs.ts`, 'A Recording'), the article: a take the
 * recording lifted said "… over your own work: A lifted it." It names the recording by the thing itself now, "the
 * recording", wherever the words name the reader, and a classmate by their first name as before.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { BRIEFS } from '@/engine/content/briefs';
import { recordOf } from '@/engine/systems/briefs';
import { sharedWords, type SharedResult } from '@/engine/systems/ensemble';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** TEST SETUP: nothing the player has to attend in the way, and rested, so each command goes through. */
function rested(sim: Simulation) {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
}

const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rested(sim); return sim.execute<Record<string, unknown>>({ kind, payload }); };

describe('a take the recording lifted', () => {
  it('says the recording lifted it, not "A"', () => {
    const sim = life('g31-recording');
    // A scene on camera played off a partner, read against the recording (no classmate chosen).
    const camera = BRIEFS.find((b) => b.medium === 'camera' && b.partner >= 2)!;
    expect(go(sim, 'brief.choose', { brief: camera.id, reading: camera.readings[0]!.id }).ok).toBe(true);
    expect(go(sim, 'brief.reader', { brief: camera.id, mate: 'alone' }).ok).toBe(true);
    for (const step of ['read', 'lines', 'lines']) go(sim, 'brief.prepare', { brief: camera.id, step });
    expect(go(sim, 'practice.self_tape', { genre: camera.kinds[0], brief: camera.id }).ok).toBe(true);
    const take = recordOf(sim.player, camera.id).takes.at(-1)!;
    expect(take.together).toBeDefined();
    expect(take.together!.reader).toBe('A Recording');
    // A new student's own work is under what the recording's lines bring, so the recording lifts the take.
    expect(take.together!.overall).toBeGreaterThanOrEqual(take.overall + 1);
    expect(take.together!.words).toMatch(/over your own work: the recording lifted it\.$/);
    expect(take.together!.words).not.toMatch(/\bA lifted\b/);
  });
});

describe('the reader named in the words', () => {
  const shared = (partner: string, over: Partial<SharedResult> = {}): SharedResult => ({
    overall: 70, dims: {}, contribution: 0.6, partner, parts: { prep: 1, timing: 0.6, agree: 1, reliability: 1 }, ...over,
  });

  it('names the recording by the thing itself wherever the words name the reader', () => {
    expect(sharedWords(60, shared('A Recording'))).toBe('Together it came to 70, 10 over your own work: the recording lifted it.');
    const under = sharedWords(80, shared('A Recording', { parts: { prep: 0.3, timing: 0.6, agree: 1, reliability: 1 }, slip: { at: 'Beat 2', by: 0.1, covered: 0.8 } }));
    expect(under).toBe('Together it came to 70, 10 under your own work: the recording came less prepared than you; the recording slipped in beat 2, and you covered most of it. Your own result stands as it is.');
  });

  it('keeps a classmate’s first name', () => {
    expect(sharedWords(60, shared('Ruth Banks'))).toBe('Together it came to 70, 10 over your own work: Ruth lifted it.');
    expect(sharedWords(80, shared('Ruth Banks', { parts: { prep: 0.3, timing: 0.6, agree: 1, reliability: 1 } }))).toMatch(/: Ruth came less prepared than you\./);
  });
});
