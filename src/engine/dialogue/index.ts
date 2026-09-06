/**
 * SLATE — loading the dialogue library.
 *
 * Each section is its own module, pulled in on demand so the interface's
 * first bundle carries none of it. The app loads every section as it
 * starts; a test loads what it needs. A scene that speaks before its
 * section has arrived gets the fallback that contradicts nothing.
 */

import { isLoaded, registerChunk } from './library';
import type { DialogueChunk } from './schema';

const LOADERS: Readonly<Record<string, () => Promise<{ default?: DialogueChunk } & Record<string, unknown>>>> = {
  dating: () => import('./chunks/dating'),
  dining: () => import('./chunks/dining'),
  health: () => import('./chunks/health'),
  property: () => import('./chunks/property'),
  retail: () => import('./chunks/retail'),
  social: () => import('./chunks/social'),
  travel: () => import('./chunks/travel'),
  vehicles: () => import('./chunks/vehicles'),
};

export const SECTIONS: readonly string[] = Object.keys(LOADERS);

function chunkFromModule(section: string, mod: Record<string, unknown>): DialogueChunk {
  const found = Object.values(mod).find((v): v is DialogueChunk => Boolean(v) && typeof v === 'object' && (v as DialogueChunk).section === section);
  if (!found) throw new Error(`Dialogue module for '${section}' exports no chunk for that section.`);
  return found;
}

/** Load one section, once. */
export async function loadSection(section: string): Promise<void> {
  if (isLoaded(section)) return;
  const loader = LOADERS[section];
  if (!loader) throw new Error(`No dialogue section '${section}'.`);
  const mod = await loader();
  if (!isLoaded(section)) registerChunk(chunkFromModule(section, mod));
}

/** Load every section. */
export async function loadAllSections(): Promise<string[]> {
  await Promise.all(SECTIONS.map((s) => loadSection(s)));
  return [...SECTIONS];
}

export { speak, preview, libraryStats, allLines, lineById, linesFor, eligible, normalise, interpolate, registerChunk, isLoaded, loadedSections, chunkOf, FALLBACK_LINE, MAX_SEEN } from './library';
export type { DialogueChunk, DialogueContext, DialogueLine, DialogueQuery, DialogueTone, DialogueExpectation } from './schema';
