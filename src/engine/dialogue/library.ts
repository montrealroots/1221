/**
 * SLATE — the dialogue library at run time.
 *
 * Chunks register themselves here, one per section, and the systems ask for
 * a line by section, purpose and beat with what the world knows at that
 * moment. Selection filters for what is true first — the outcome, the move,
 * the speaker's voice, what they know about you — and only then chooses,
 * seeded, among what is left, weighted away from what this save has heard
 * before. A save keeps the ids it has heard and when, bounded; it never
 * carries the text.
 *
 * When nothing qualifies, the answer is a fallback that contradicts
 * nothing, and it says so, rather than a line that is wrong for the moment.
 */

import type { Simulation } from '../core/simulation';
import { MS_DAY } from '../core/time';
import type { DialogueState } from '../domain/model';
import type { DialogueChunk, DialogueContext, DialogueLine, DialogueQuery } from './schema';

export const MAX_SEEN = 2000;
export const FALLBACK_LINE = 'They say something, and the moment passes.';

const CHUNKS = new Map<string, DialogueChunk>();
const BY_ID = new Map<string, DialogueLine>();
const INDEX = new Map<string, DialogueLine[]>();

function keyOf(section: string, purpose: string): string {
  return `${section}/${purpose}`;
}

/** Put a chunk in the library. Registering the same section again replaces it. */
export function registerChunk(chunk: DialogueChunk): void {
  const prior = CHUNKS.get(chunk.section);
  if (prior) {
    for (const old of prior.lines) BY_ID.delete(old.id);
    for (const key of [...INDEX.keys()]) if (key.startsWith(`${chunk.section}/`)) INDEX.delete(key);
  }
  for (const entry of chunk.lines) {
    if (BY_ID.has(entry.id)) throw new Error(`Dialogue line '${entry.id}' is defined twice.`);
    if (entry.section !== chunk.section) throw new Error(`Dialogue line '${entry.id}' is in the wrong chunk (${chunk.section}).`);
    BY_ID.set(entry.id, entry);
    const key = keyOf(entry.section, entry.purpose);
    const list = INDEX.get(key) ?? [];
    list.push(entry);
    INDEX.set(key, list);
  }
  CHUNKS.set(chunk.section, chunk);
}

export function isLoaded(section: string): boolean {
  return CHUNKS.has(section);
}

export function chunkOf(section: string): DialogueChunk | undefined {
  return CHUNKS.get(section);
}

export function loadedSections(): string[] {
  return [...CHUNKS.keys()].sort();
}

export function allLines(): DialogueLine[] {
  return [...BY_ID.values()];
}

export function lineById(id: string): DialogueLine | undefined {
  return BY_ID.get(id);
}

export function linesFor(query: DialogueQuery): DialogueLine[] {
  const list = INDEX.get(keyOf(query.section, query.purpose)) ?? [];
  return query.beat ? list.filter((l) => l.beat === query.beat) : list;
}

/** The lines that are true for this moment. */
export function eligible(lines: readonly DialogueLine[], ctx: DialogueContext): DialogueLine[] {
  return lines.filter((l) => {
    const w = l.when;
    if (!w) return true;
    if (w.result && (!ctx.result || !w.result.includes(ctx.result))) return false;
    if (w.move && (!ctx.move || !w.move.includes(ctx.move))) return false;
    if (w.tone && !w.tone.includes('any') && (!ctx.tone || !w.tone.includes(ctx.tone))) return false;
    if (w.minChemistry !== undefined && (ctx.chemistry ?? 0) < w.minChemistry) return false;
    if (w.maxChemistry !== undefined && (ctx.chemistry ?? 0) > w.maxChemistry) return false;
    if (w.requires && !w.requires.every((f) => ctx.facts?.includes(f))) return false;
    if (w.forbids && w.forbids.some((f) => ctx.facts?.includes(f))) return false;
    if (w.flags && !w.flags.every((f) => ctx.flags?.includes(f))) return false;
    return true;
  });
}

/** Text as it is compared: case, punctuation and spacing aside, slots alike. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/\{[a-z_]+\}/g, '{}')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9{} ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function interpolate(text: string, vars: Readonly<Record<string, string>> | undefined): string {
  if (!vars) return text;
  return text.replace(/\{([a-z_]+)\}/g, (whole, key: string) => (key in vars ? vars[key]! : whole));
}

export function ensureDialogueState(sim: Simulation): DialogueState {
  if (!sim.universe.dialogue) sim.universe.dialogue = { version: 1, seen: {} };
  return sim.universe.dialogue;
}

export interface Spoken {
  id?: string;
  text: string;
  /** Nothing qualified; this is the line that contradicts nothing. */
  fallback: boolean;
}

/**
 * Choose and record a line. Called inside a command, never from a view,
 * because hearing a line is a thing the save remembers.
 */
export function speak(sim: Simulation, query: DialogueQuery, ctx: DialogueContext = {}, salt: string | number = ''): Spoken {
  let pool = eligible(linesFor(query), ctx);
  if (pool.length === 0 && ctx.tone) pool = eligible(linesFor(query), { ...ctx, tone: undefined });
  if (pool.length === 0) return { text: interpolate(FALLBACK_LINE, ctx.vars), fallback: true };

  const state = ensureDialogueState(sim);
  const fresh = pool.filter((l) => {
    const seen = state.seen[l.id];
    return !(l.cooldownDays && seen && seen.at + l.cooldownDays * MS_DAY > sim.now);
  });
  const candidates = fresh.length > 0 ? fresh : pool;
  const rng = sim.rng('dialogue', query.section, query.purpose, query.beat ?? '', ctx.move ?? '', ctx.result ?? '', String(salt), sim.now);
  const chosen = rng.weighted(candidates, (l) => (l.weight ?? 1) / Math.pow(1 + (state.seen[l.id]?.n ?? 0), 1.5));

  const seen = state.seen[chosen.id];
  state.seen[chosen.id] = { n: (seen?.n ?? 0) + 1, at: sim.now };
  const ids = Object.keys(state.seen);
  if (ids.length > MAX_SEEN) {
    const oldest = ids.sort((a, b) => state.seen[a]!.at - state.seen[b]!.at).slice(0, ids.length - MAX_SEEN);
    for (const id of oldest) delete state.seen[id];
  }
  return { id: chosen.id, text: interpolate(chosen.text, ctx.vars), fallback: false };
}

/**
 * The line a view would show, chosen the same way, recording nothing. For
 * text on screen before any command has run; a command uses `speak`.
 */
export function preview(sim: Simulation, query: DialogueQuery, ctx: DialogueContext = {}, salt: string | number = ''): Spoken {
  let pool = eligible(linesFor(query), ctx);
  if (pool.length === 0 && ctx.tone) pool = eligible(linesFor(query), { ...ctx, tone: undefined });
  if (pool.length === 0) return { text: interpolate(FALLBACK_LINE, ctx.vars), fallback: true };
  const seen = sim.universe.dialogue?.seen ?? {};
  const rng = sim.rng('dialogue-preview', query.section, query.purpose, query.beat ?? '', String(salt));
  const chosen = rng.weighted(pool, (l) => (l.weight ?? 1) / Math.pow(1 + (seen[l.id]?.n ?? 0), 1.5));
  return { id: chosen.id, text: interpolate(chosen.text, ctx.vars), fallback: false };
}

export interface LibraryStats {
  total: number;
  unique: number;
  bySection: Record<string, number>;
  sections: string[];
}

/** What is in the library right now. `unique` counts normalised text, so slot variants count once. */
export function libraryStats(): LibraryStats {
  const lines = allLines();
  const bySection: Record<string, number> = {};
  for (const l of lines) bySection[l.section] = (bySection[l.section] ?? 0) + 1;
  return { total: lines.length, unique: new Set(lines.map((l) => normalise(l.text))).size, bySection, sections: loadedSections() };
}
