/**
 * Every noun opens onto something.
 *
 * Depth is a graph, and a graph is exactly the sort of thing that rots
 * silently: a way in points at a subject whose kind was renamed, a seed names
 * an id that no longer exists, a body says "press the lot" and the lot was
 * never declared. None of that shows up in a typecheck, because a Subject is
 * two strings.
 *
 * So this crawls it. Boot a save, take every kind's seeds, resolve them, walk
 * every way transitively to a fixed point, and assert that each edge lands on
 * something. `tests/navigation.test.ts` exists because the same class of bug
 * shipped twice with routes; this is the same guarantee for looks, before it
 * has had the chance to ship once.
 *
 * The gates below are the rules in docs/DRILL-DOWN.md, enforced rather than
 * written down.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import '@/ui/looks/all';
import { lookKinds, resolveLook, seedsFor, trailTo, type Looked, type Way } from '@/ui/looks/registry';
import { at, subjectKey, type Subject } from '@/ui/looks/subject';

const UI = new URL('../src/ui/', import.meta.url);

/**
 * A world with something in it.
 *
 * A fresh save is empty in three ways that matter here: nothing is on the
 * calendar, nothing is waiting on a decision, and nothing has been announced.
 * Nothing in the engine puts anything there either — casting, The Industry and
 * the job system were the three things that used to, and all three are gone —
 * so crawling a `quickSave()` would leave `entry`, `decision` and
 * `notification` declared and never once resolved.
 *
 * So the test plants one of each, the way the game will when the family
 * business starts producing them. These are the real constructors — `schedule`,
 * `decide` and `notify` — not fixtures, so the shapes stay honest, and the
 * two kinds are registered first because the engine refuses to schedule
 * anything nothing would handle.
 */
function world(): Simulation {
  const sim = quickSave();
  const player = sim.universe.people[sim.universe.playerId]!;

  sim.onSchedule('production.table_read', () => {});
  sim.onSchedule('life.dinner', () => {});

  sim.schedule({
    at: sim.now + 2 * MS_DAY + 3 * MS_HOUR,
    durationMinutes: 180,
    kind: 'production.table_read',
    label: 'Table Read',
    category: 'work',
    requiresPlayer: true,
    locationId: player.currentLocationId,
  });
  sim.schedule({
    at: sim.now + 5 * MS_DAY,
    kind: 'life.dinner',
    label: 'Dinner At The House',
    category: 'personal',
    requiresPlayer: true,
  });
  sim.requireDecision({
    category: 'work',
    urgency: 70,
    title: 'A Part Has Been Offered',
    detail: 'Somebody wants an answer on it, and the answer is yours to give.',
    dueAt: sim.now + 3 * MS_DAY,
  });
  sim.notify({
    category: 'work',
    title: 'The Lot Is Finished',
    body: 'The stages are up and the gate is open.',
    importance: 60,
  });

  return sim;
}

/**
 * Every subject reachable from the seeds, and what it resolved to.
 *
 * Walks to a fixed point rather than to a depth, so a chain that grows a
 * sixth level is covered the day it is written. Anything that fails to
 * resolve is collected rather than thrown, so one broken edge reports every
 * broken edge instead of the first.
 */
function crawl(sim: Simulation): {
  seen: Map<string, Looked>;
  broken: { from: string; way: Way }[];
  deadSeeds: string[];
} {
  const seen = new Map<string, Looked>();
  const broken: { from: string; way: Way }[] = [];
  const deadSeeds: string[] = [];
  const queue: { subject: Subject; from: string }[] = [];

  for (const kind of lookKinds()) {
    for (const id of seedsFor(kind, sim)) queue.push({ subject: at(kind, id), from: `seed ${kind}` });
  }

  while (queue.length > 0) {
    const { subject, from } = queue.shift()!;
    const key = subjectKey(subject);
    if (seen.has(key)) continue;
    const found = resolveLook(sim, subject);
    if (found === undefined || 'gone' in found) {
      if (from.startsWith('seed ')) deadSeeds.push(key);
      continue;
    }
    seen.set(key, found);
    for (const way of allWays(found)) {
      const target = resolveLook(sim, way.to);
      if (target === undefined || 'gone' in target) broken.push({ from: key, way });
      else queue.push({ subject: way.to, from: key });
    }
    if (found.parent) queue.push({ subject: found.parent, from: key });
  }

  return { seen, broken, deadSeeds };
}

/** A look's ways in, including the ones held behind a facet. */
function allWays(look: Looked): Way[] {
  return [...(look.ways ?? []), ...(look.facets ?? []).flatMap((f) => [...(f.ways ?? [])])];
}

/** Every element in a body, flattened, so a body can be inspected as a shape. */
function elementsIn(node: ReactNode, out: ReactElement[] = []): ReactElement[] {
  if (node === null || node === undefined || typeof node === 'boolean') return out;
  if (Array.isArray(node)) {
    for (const child of node) elementsIn(child, out);
    return out;
  }
  if (isValidElement(node)) {
    out.push(node);
    const props = node.props as { children?: ReactNode };
    elementsIn(props.children, out);
  }
  return out;
}

const nameOfType = (element: ReactElement): string => {
  const type = element.type as unknown;
  if (typeof type === 'string') return type;
  if (typeof type === 'function') return (type as { name?: string }).name ?? '';
  return '';
};

/** A grid of Stats: the shape a look becomes when it gives up and prints a record. */
function statGrids(body: ReactNode): ReactElement[] {
  return elementsIn(body).filter((element) => {
    const className = String((element.props as { className?: unknown }).className ?? '');
    if (!/\bgrid\b/.test(className)) return false;
    return elementsIn((element.props as { children?: ReactNode }).children)
      .some((child) => nameOfType(child) === 'Stat');
  });
}

describe('the shape of a look', () => {
  const sim = world();
  const looks = [...crawl(sim).seen.entries()];

  it('crawls something worth crawling', () => {
    expect(lookKinds().length).toBeGreaterThan(3);
    expect(looks.length).toBeGreaterThan(15);
  });

  it('states a name, a kind and a summary everywhere', () => {
    for (const [key, look] of looks) {
      expect(look.name, `${key} has no name`).toBeTruthy();
      expect(look.kind, `${key} has no kind`).toBeTruthy();
      expect(look.summary, `${key} has no summary`).toBeTruthy();
    }
  });

  it('never prints a field name where a word belongs', () => {
    // Rule 5. `Sleep Debt` passes; `sleepDebt`, `Atlantic/Reykjavik` and
    // `person_000001` are the three ways an identifier leaks onto a screen.
    //
    // The camel-case clause is the one that matters and the one the spec's
    // first regex missed: `sleepDebt` carries no underscore, no slash and no
    // run of digits, so `/_|\/|\d{4}/` waved through the very example the
    // rule was written around. It is anchored at a word boundary so that
    // McAllen, DeLuca and DreamWorks — all real gazetteer and company
    // spellings — are not mistaken for identifiers.
    for (const [key, look] of looks) {
      for (const [what, text] of [['name', look.name], ['kind', look.kind]] as const) {
        expect(text, `${key} ${what} reads as an identifier: ${text}`).not.toMatch(/_|\/|\d{4}/);
        expect(text, `${key} ${what} is a field name: ${text}`).not.toMatch(/\b[a-z]+[A-Z]/);
        expect(text, `${key} ${what} does not start as a name does: ${text}`).toMatch(/^[A-Z0-9]/);
      }
    }
  });

  it('leads with a sentence', () => {
    for (const [key, look] of looks) {
      const summary = look.summary.trim();
      expect(summary, `${key} summary is not a sentence: ${summary}`).toMatch(/[.!?]$/);
      expect(summary.split(/\s+/).length, `${key} summary is too short to be a sentence`).toBeGreaterThan(2);
      expect(summary, `${key} summary reads as an identifier`).not.toMatch(/_|\d{4}-\d/);
    }
  });

  it('never becomes a record view', () => {
    // Rule 6. One grid of facts under the sentence is a look; two is a table
    // with a heading, and a body that is nothing but a grid is a record.
    for (const [key, look] of looks) {
      if (!look.body) continue;
      const grids = statGrids(look.body);
      expect(grids.length, `${key} holds ${grids.length} grids of stats`).toBeLessThanOrEqual(1);
    }
  });

  it('says what is behind every way before it is taken', () => {
    // Rule 7. The graph has to be readable without walking it.
    for (const [key, look] of looks) {
      for (const way of allWays(look)) {
        expect(way.label, `${key} has a way with no label`).toBeTruthy();
        expect(way.detail, `${key} → ${way.label} says nothing about what is behind it`).toBeTruthy();
        expect(way.detail.length, `${key} → ${way.label} detail is too terse to help`).toBeGreaterThan(8);
      }
    }
  });

  it('keeps provenance to one line and never opens it', () => {
    // Rule 10. A footnote, not a level.
    for (const [key, look] of looks) {
      if (look.provenance === undefined) continue;
      expect(look.provenance, `${key} provenance runs to more than a line`).not.toMatch(/\n/);
      expect(look.provenance.length, `${key} provenance is an essay`).toBeLessThan(220);
    }
  });
});

describe('the graph', () => {
  const sim = world();
  const { broken, deadSeeds, seen } = crawl(sim);

  it('opens onto something at every edge', () => {
    const lines = broken.map((b) => `${b.from} → ${b.way.label} (${subjectKey(b.way.to)})`);
    expect(lines, 'ways that open onto nothing').toEqual([]);
  });

  it('seeds only what is really there', () => {
    expect(deadSeeds, 'kinds seeding ids that do not resolve').toEqual([]);
  });

  it('never parents a thing to itself', () => {
    // trailTo throws on a cycle; walking every reachable subject proves none does.
    for (const key of seen.keys()) {
      const cut = key.indexOf(':');
      const subject = cut < 0 ? at(key) : at(key.slice(0, cut), key.slice(cut + 1));
      expect(() => trailTo(sim, subject), `${key} sits in a cycle`).not.toThrow();
    }
  });

  it('reaches every declared kind from a seed', () => {
    // A kind nothing seeds and nothing points at is a declaration no player
    // can arrive at. It is not wrong, but it is not shipped either.
    const reached = new Set([...seen.keys()].map((k) => (k.includes(':') ? k.slice(0, k.indexOf(':')) : k)));
    expect([...lookKinds()].filter((k) => !reached.has(k)), 'kinds nothing opens onto').toEqual([]);
  });
});

describe('what the screens name', () => {
  /** Every .tsx and .ts under src/ui, read once. */
  function sources(dir = UI, out: { path: string; text: string }[] = []): { path: string; text: string }[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
      if (entry.isDirectory()) sources(url, out);
      else if (/\.tsx?$/.test(entry.name)) out.push({ path: url.pathname, text: readFileSync(url, 'utf8') });
    }
    return out;
  }

  it('names a kind that something has declared', () => {
    // A typo in at('palce', …) is a dead noun that renders as plain text and
    // never tells anybody. Caught here, at the moment it is written.
    const kinds = new Set(lookKinds());
    const strays: string[] = [];
    for (const { path, text } of sources()) {
      if (path.includes('/looks/registry') || path.includes('/looks/subject')) continue;
      for (const match of text.matchAll(/\bat\(\s*'([a-z][a-zA-Z-]*)'/g)) {
        if (!kinds.has(match[1]!)) strays.push(`${path.split('/src/')[1]}: at('${match[1]}')`);
      }
    }
    expect(strays, 'subjects naming a kind nothing declares').toEqual([]);
  });

  it('writes the apostrophe the house writes', () => {
    // docs/STYLE.md: the apostrophe is the typographic one, "which the rest
    // of the prose already uses". Nothing checked it, and the first draft of
    // place.tsx shipped forty-six straight ones into sentences a player
    // reads. A letter on each side of it is a contraction or a possessive
    // and can be nothing else — that shape is not valid JavaScript outside a
    // string, a comment or JSX text.
    const offenders: string[] = [];
    for (const { path, text } of sources()) {
      if (!path.includes('/ui/looks/')) continue;
      for (const [index, line] of text.split('\n').entries()) {
        if (/[A-Za-z]'[A-Za-z]/.test(line)) offenders.push(`${path.split('/src/')[1]}:${index + 1}`);
      }
    }
    expect(offenders, 'straight apostrophes where the house writes a typographic one').toEqual([]);
  });

  it('writes no drill state into a screen', () => {
    // Rule 1. Depth lives in src/ui/looks and nowhere else.
    const offenders: string[] = [];
    for (const { path, text } of sources()) {
      if (path.includes('/ui/looks/')) continue;
      if (/useState<\s*Subject/.test(text)) offenders.push(path.split('/src/')[1]!);
    }
    expect(offenders, 'screens holding their own drill state').toEqual([]);
  });
});
