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
import { openDecisions } from '@/engine/world/world';
import { at, subjectKey, type Subject } from '@/ui/looks/subject';
import { readiness, readinessParts } from '@/engine/systems/life';

const UI = new URL('../src/ui/', import.meta.url);

/**
 * A world with something in it.
 *
 * A fresh save is empty in three ways that matter here: nothing is on the
 * calendar, nothing is waiting on a decision, and nothing has been announced.
 * Nothing in the engine puts anything there on its own any more, so crawling a
 * `quickSave()` would leave `entry`, `decision` and `notification` declared
 * and never once resolved.
 *
 * So the test plants one of each. These are the real constructors —
 * `schedule`, `requireDecision` and `notify` — not fixtures, so the shapes
 * stay honest, and the two kinds are registered first because the engine
 * refuses to schedule anything nothing would handle.
 */
function world(): Simulation {
  const sim = quickSave();
  const player = sim.universe.people[sim.universe.playerId]!;

  sim.onSchedule('life.appointment', () => {});
  sim.onSchedule('life.dinner', () => {});

  sim.schedule({
    at: sim.now + 2 * MS_DAY + 3 * MS_HOUR,
    durationMinutes: 180,
    kind: 'life.appointment',
    label: 'Dentist',
    category: 'personal',
    requiresPlayer: true,
    locationId: player.currentLocationId,
  });
  sim.schedule({
    at: sim.now + 5 * MS_DAY,
    kind: 'life.dinner',
    label: 'Dinner With Friends',
    category: 'personal',
    requiresPlayer: true,
  });
  sim.requireDecision({
    category: 'personal',
    urgency: 70,
    title: 'The Dentist Wants An Answer',
    detail: 'They are holding the slot, and the answer is yours to give.',
    dueAt: sim.now + 3 * MS_DAY,
  });
  sim.notify({
    category: 'personal',
    title: 'The Clocks Go Back Soon',
    body: 'An hour comes back to you at the end of the month.',
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

describe('what’s costing readiness', () => {
  it('ranks the dials by what each takes off readiness, and multiplies to it', () => {
    const sim = quickSave({}, 'ready-rank');
    const w = sim.player.wellbeing;
    Object.assign(w, { energy: 100, stress: 50, sleepDebt: 0, nourishment: 100, morale: 100, hygiene: 40, condition: 100 });
    const parts = readinessParts(sim.player);
    const loss = (key: string) => { const p = parts.find((one) => one.key === key)!; return 1 - p.factor / p.best; };
    // Stress at 50 costs about three times what hygiene at 40 does.
    expect(loss('stress')).toBeGreaterThan(3 * loss('hygiene'));
    expect(readiness(sim.player)).toBeCloseTo(Math.min(100, 100 * parts.reduce((p, one) => p * one.factor, 1) / 1.35), 6);
  });
});

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
        expect(text, `${key} ${what} does not start as a name does: ${text}`).toMatch(/^[\p{Lu}0-9]/u);
      }
    }
  });

  it('never puts the kind inside the name', () => {
    // Rule 5: `kind` renders as an eyebrow above the name and never enters it.
    // The hour-by-hour look shipped as name "Friday, Hour By Hour" under kind
    // "Hour By Hour", which prints the same three words twice, one above the
    // other, and puts them in the trail as well. Nothing caught it, so this
    // does.
    for (const [key, look] of looks) {
      expect(
        look.name.toLowerCase().includes(look.kind.toLowerCase()),
        `${key} name "${look.name}" carries its own kind "${look.kind}"`,
      ).toBe(false);
    }
  });

  it('starts a sentence the way a sentence starts', () => {
    // "four people live under the one roof" — a spelled-out number at the
    // front of a summary, which is what `said(4, 'person')` returns and what
    // shipped on the household. Names and figures are fine at the front; a
    // lowercase letter is not.
    // Collected rather than asserted one at a time: half a dozen of these
    // shipped together, and a gate that reports the first one takes six runs
    // to say what a person would have seen in one glance at the page.
    const offenders: string[] = [];
    const check = (where: string, text: string): void => {
      if (/^[a-z]/.test(text)) offenders.push(`${where}: ${text}`);
    };
    for (const [key, look] of looks) {
      check(`${key} name`, look.name);
      check(`${key} kind`, look.kind);
      check(`${key} summary`, look.summary);
      if (look.provenance) check(`${key} provenance`, look.provenance);
      for (const way of look.ways ?? []) {
        check(`${key} way label`, way.label);
        check(`${key} way detail`, way.detail);
      }
    }
    expect(offenders).toEqual([]);
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

  it('writes a figure out of a hundred as a figure', () => {
    // "82/100", not "82 out of a hundred". The words were four times the width
    // of the figure and said nothing the slash does not, and nine dials each
    // ending in the same five words read as a wall rather than a list.
    const offenders: string[] = [];
    for (const { path, text } of sources()) {
      if (path.endsWith('/words.ts')) continue;
      for (const [index, line] of text.split('\n').entries()) {
        // Comments may say it in prose; a string a player reads may not.
        if (/^\s*(\*|\/\/)/.test(line)) continue;
        // "out of 100" as well: it asked only for the words, and the place card
        // printed Industry and Jobs "out of 100" past it.
        if (/out of (a hundred|100)\b/.test(line)) offenders.push(`${path.split('/src/')[1]}:${index + 1}`);
      }
    }
    expect(offenders, 'a figure written out in words where /100 belongs').toEqual([]);
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

/**
 * The pointer on a decision, resolving something.
 *
 * `refType` and `refId` are declared on a decision and on a notification. The
 * crawl above cannot cover them — its decision is hand-made and carries no
 * pointer at all — so this is the way from a decision onto the thing it is
 * about being walked rather than assumed.
 */
describe('a decision opens onto the thing it is about', () => {
  it('walks from a row to the calendar entry it is about', () => {
    const sim = quickSave({}, 'decision-way');
    const made = sim.execute<{ ok: boolean; id?: string }>({
      kind: 'calendar.schedule', payload: { title: 'Dentist', at: sim.now + 4 * MS_DAY },
    }).value!;
    sim.requireDecision({
      urgency: 60, category: 'personal', title: 'Keep The Dentist?', detail: 'It is in four days.',
      refType: 'entry', refId: made.id,
    });

    const row = openDecisions(sim)[0]!;
    const looked = resolveLook(sim, at('decision', row.id)) as Looked;
    expect(looked.name).toBeTruthy();
    expect(
      (looked.ways ?? []).map((way) => way.to),
      'the decision knows what it is about and paints no way onto it',
    ).toContainEqual({ kind: 'entry', id: made.id });
  });
});

describe('the sentence the player wrote', () => {
  /** Every string in a body, joined, so a body can be read the way a page is. */
  function wordsIn(node: ReactNode, out: string[] = []): string[] {
    if (node === null || node === undefined || typeof node === 'boolean') return out;
    if (typeof node === 'string' || typeof node === 'number') {
      out.push(String(node));
      return out;
    }
    if (Array.isArray(node)) {
      for (const child of node) wordsIn(child, out);
      return out;
    }
    if (isValidElement(node)) wordsIn((node.props as { children?: ReactNode }).children, out);
    return out;
  }

  /**
   * `background` is the one field on a person that was kept as flavor rather
   * than deleted with the rest of the sweep, and it was kept on one condition:
   * the game says it back. A player who types a sentence about the life before
   * this one and never sees it again has written into a hole. So the reader is
   * held here, not left to a comment — this fails the moment the person look
   * stops printing it, which is the state the field was rescued from.
   */
  it('prints a person’s background on their own page', () => {
    const sim = quickSave({}, 'background-reader');
    const player = sim.universe.people[sim.universe.playerId]!;
    player.background = 'Raised three streets from a stage door and never went in.';

    const found = resolveLook(sim, at('person', player.id)) as Looked;
    expect(wordsIn(found.body).join(' ')).toContain('never went in');
  });

  it('prints what they care about and the films they love beside it', () => {
    const sim = quickSave({ interests: ['cinematography'], genres: ['western'] }, 'taste-reader');
    const found = resolveLook(sim, at('person', sim.universe.playerId)) as Looked;
    const words = wordsIn(found.body).join(' ');
    expect(words).toContain('Cinematography');
    expect(words).toContain('Western');
  });

  it('says nothing at all rather than an empty line when there is nothing to say', () => {
    const sim = quickSave({}, 'background-empty');
    const player = sim.universe.people[sim.universe.playerId]!;
    player.background = '   ';
    player.interests = [];
    player.genres = [];

    // Only the papers, which a person always has: no empty line where the background, the interests and the films would be.
    const found = resolveLook(sim, at('person', player.id)) as Looked;
    const kids = (found.body as { props: { children: { key: string }[] } }).props.children.filter(Boolean);
    expect(kids.map((k) => k.key)).toEqual(['papers']);
  });
});

describe('the sleep debt dial', () => {
  it('calls an ordinary day’s debt the day’s, and what a short night leaves owed', () => {
    // The clock charges the day as it moves, so by eleven a day up from seven
    // has put 5.4 hours on the books, and the Sleep dialog offers the normal
    // eight hours for it. The dial called it owed.
    const sim = quickSave({}, 'dial-ordinary-day');
    const dial = () => (resolveLook(sim, at('dial', `${sim.universe.playerId}/sleepDebt`)) as Looked).summary;
    // To bed at eleven for eight hours, then the whole next day up to eleven.
    const elevenAfter = (from: number) => from + 15.5 * MS_HOUR;
    sim.advanceTo(elevenAfter(sim.now));
    // A new save's first evening too: the world starts them owing nothing.
    expect(dial()).toBe('5 hours, about what a day awake puts on the books. A night pays it back.');
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    sim.advanceTo(sim.now + 16 * MS_HOUR);
    expect(sim.player.wellbeing.sleepDebt).toBeCloseTo(16 * 0.34, 9);
    expect(dial()).toBe('5 hours, about what a day awake puts on the books. A night pays it back.');
    const person = () => resolveLook(sim, at('person', sim.universe.playerId)) as Looked;
    const row = () => person().ways?.find((way) => way.label === 'Sleep Debt')?.detail;
    expect(row()).toBe('5 hours on the books, and what sleep pays back');
    expect((resolveLook(sim, at('dial', `${sim.universe.playerId}/sleepDebt`)) as Looked).provenance)
      .toBe('Counted in hours: a waking hour adds a third of one, and a night pays it back, a long one faster. A night under six hours adds some too, and the shortest add more than they pay back.');
    // Four hours in bed leave three owed in the morning, which is what the
    // night left, not what a day has put on.
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 4 } }).ok).toBe(true);
    expect(Math.round(sim.player.wellbeing.sleepDebt)).toBe(3);
    expect(dial()).toBe('3 hours owed. One long night would clear it.');
    // Kept up through the next night an hour at a time, it is owed.
    for (let hour = 0; hour < 20; hour += 1) sim.advanceTo(sim.now + MS_HOUR);
    expect(dial()).toMatch(/hours owed/);

    // Woken owing nothing, the debt is the day's only up to a normal day's and
    // two hours more, 7.44. Kept up past eleven an hour at a time, the sixth
    // hour leaves it at 7.31 and the seventh takes it to 7.65, owed.
    const late = quickSave({}, 'dial-long-day');
    const lateDial = () => (resolveLook(late, at('dial', `${late.universe.playerId}/sleepDebt`)) as Looked).summary;
    late.advanceTo(elevenAfter(late.now));
    for (let hour = 0; hour < 6; hour += 1) late.advanceTo(late.now + MS_HOUR);
    expect(late.player.wellbeing.sleepDebt).toBeCloseTo(21.5 * 0.34, 9);
    expect(lateDial()).toMatch(/about what a day awake puts on the books/);
    late.advanceTo(late.now + MS_HOUR);
    expect(late.player.wellbeing.sleepDebt).toBeCloseTo(22.5 * 0.34, 9);
    expect(lateDial()).toBe('8 hours owed. One long night would clear it.');
  });
});
