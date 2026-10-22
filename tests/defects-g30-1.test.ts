/**
 * Craft-look defects found by the readings of 2026-10-12, each fixed and held here (`ui/looks/actor.tsx`):
 * - a genre's look showed Preparation N% Faster, "the best of the two, never a cap on the work", beside a summary
 *   that says a brief in the genre reads knowing it, so the figure read as covering the genre's brief. A brief's
 *   steps never read it (`prepSpeed` is the material met before, `featureSpeed`); a scene for class from a play of
 *   the kind and a part's lines do (`genreSpeed`, `systems/coursework.ts`, `systems/production.ts`);
 * - a piece of work's small print printed its parts of preparation and its families by their keys: a take read
 *   "interpretation 100% of 80%, memorization …, genre …, approach …", and a night of a play with no profile
 *   "leaning to science_fiction".
 *
 * PLAYER JOURNEYS play through commands; FIXTURES set a state by hand, and say so.
 */
import { isValidElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { prepSpeed } from '@/engine/systems/briefs';
import { genreSpeed, genreState } from '@/engine/systems/engagement';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';

function student(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return sim;
}
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
};
const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute<Record<string, unknown>>({ kind, payload }); };

/** Every string in a body, joined, the way a page reads it. */
function wordsIn(node: ReactNode, out: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === 'boolean') return out;
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out; }
  if (Array.isArray(node)) { for (const child of node) wordsIn(child, out); return out; }
  if (isValidElement(node)) wordsIn((node.props as { children?: ReactNode }).children, out);
  return out;
}
const read = (node: ReactNode) => wordsIn(node).join('');
/** A work's small print, the line under its limits (the limits name dimensions, "the interpretation", in words of their own). */
const smallPrint = (node: ReactNode) => { const all = read(node); return all.slice(all.indexOf('Judged with readiness')); };

/** The labels, values and notes of the Stats in a body. */
function statsIn(node: ReactNode, out: { label: string; value: string; note: string }[] = []): { label: string; value: string; note: string }[] {
  if (node === null || node === undefined || typeof node === 'boolean' || typeof node !== 'object') return out;
  if (Array.isArray(node)) { for (const child of node) statsIn(child, out); return out; }
  if (isValidElement(node)) {
    const props = node.props as { label?: unknown; value?: unknown; note?: unknown; children?: ReactNode };
    if (typeof props.label === 'string') out.push({ label: props.label, value: String(props.value ?? ''), note: String(props.note ?? '') });
    statsIn(props.children, out);
  }
  return out;
}

const look = (sim: Simulation, kind: string, id: string): Looked => {
  const found = resolveLook(sim, at(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  return found;
};

describe('a genre’s look, its Preparation figure', () => {
  it('says what it speeds, a scene or a part from a play of its kind, and that a brief’s steps read the material met before', () => {
    const sim = student('g30-genre');
    const b = BRIEF_BY_ID['brief-drama']!;
    expect(b.kinds).toContain('drama');
    // PLAYER JOURNEY: a take in the genre, so the genre has practice and the look a figure.
    expect(go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id }).ok).toBe(true);
    expect(go(sim, 'brief.prepare', { brief: b.id, step: 'read' }).ok).toBe(true);
    const briefBefore = prepSpeed(sim.player, b);
    const genreBefore = genreSpeed(sim.player, ['drama']);
    // FIXTURE: the genre studied to 60, by hand, to move the genre's figure and nothing else.
    genreState(sim.player, 'drama').familiarity = 60;
    // The falsifiability test, on the engine: the genre's figure moves; a brief's steps don't.
    expect(genreSpeed(sim.player, ['drama'])).toBeGreaterThan(genreBefore);
    expect(prepSpeed(sim.player, b)).toBe(briefBefore);
    const prep = statsIn(look(sim, 'genre', 'drama').body).find((s) => s.label === 'Preparation')!;
    expect(prep.value).toBe(`${Math.round((genreSpeed(sim.player, ['drama']) - 1) * 100)}% Faster`);
    // What it speeds, named, and a brief's steps said to read something else.
    // "Of only its kind" from brief 21 (2026-10-22), when a play's several genres came to count each for its share.
    expect(prep.note).toMatch(/a scene or a part from a play of only its kind/i);
    expect(prep.note).toMatch(/A brief’s steps speed up with material you’ve met before instead/);
    expect(prep.note).not.toMatch(/never a cap on the work$/);
  });
});

describe('a piece of work’s small print', () => {
  it('names a take’s parts of preparation by the task’s own words, and the way of playing it as the limits do', () => {
    const sim = student('g30-work');
    const b = BRIEF_BY_ID['brief-drama']!;
    // PLAYER JOURNEY: chosen with a way of playing it, prepared a round, and taped.
    expect(go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, scale: 'restrained' }).ok).toBe(true);
    for (const step of ['read', 'lines', 'rehearse']) expect(go(sim, 'brief.prepare', { brief: b.id, step }).ok, step).toBe(true);
    expect(go(sim, 'practice.self_tape', { genre: 'drama' }).ok).toBe(true);
    const w = sim.player.work!.at(-1)!;
    expect(Object.keys(w.inputs.prep).sort()).toEqual(['approach', 'genre', 'interpretation', 'memorization', 'rehearsal']);
    const small = smallPrint(look(sim, 'work', w.inputs.key).body);
    expect(small).toMatch(/^Judged with readiness/);
    for (const words of ['breaking down the text for your reading', 'learning the lines', 'rehearsal on your feet', 'knowing the genre', 'how you play it']) expect(small, words).toContain(`${words} at `);
    // No key in the sentence.
    for (const key of ['interpretation', 'memorization', 'approach']) expect(small, key).not.toMatch(new RegExp(`\\b${key}\\b`));
    expect(small).not.toMatch(/\bgenre \d/);
  });

  it('names the families it leaned to by their genres’ words', () => {
    const sim = student('g30-families');
    const b = BRIEF_BY_ID['brief-drama']!;
    expect(go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id }).ok).toBe(true);
    expect(go(sim, 'brief.prepare', { brief: b.id, step: 'read' }).ok).toBe(true);
    expect(go(sim, 'practice.self_tape', { genre: 'drama' }).ok).toBe(true);
    const taken = sim.player.work!.at(-1)!;
    // FIXTURE: a night of a play with no profile leans by its families (`nightEvaluation`); a record of one, by hand,
    // copied from a real take with its families set, under a key of its own.
    const night = { ...taken, task: 'performance', inputs: { ...taken.inputs, prep: { lines: 0.9, blocking: 0.8 }, required: { lines: 0.8, blocking: 0.7 }, families: ['science_fiction', 'animation'], key: `night:${sim.player.id}:g30` } };
    sim.player.work!.push(night);
    const small = smallPrint(look(sim, 'work', night.inputs.key).body);
    expect(small).toMatch(/^Judged with readiness/);
    expect(small).toContain('its genres: science fiction, animation');
    expect(small).not.toContain('science_fiction');
    expect(small).toContain('learning the lines at 90% (complete at 80%)');
    expect(small).toContain('the blocking at 80% (complete at 70%)');
  });
});
