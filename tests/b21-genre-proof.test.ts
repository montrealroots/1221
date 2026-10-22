/**
 * Brief 21's genre proof (P1, docs/verification/genre-banking-2026-10-22/criteria.md): the relevant genres, weighed, read
 * on every path the brief names, with nothing changed but what the actor knows of genres.
 *
 * - The measure: each material's requirements as the rule weighs them, worked by hand (tests/setup/genre-proof.ts);
 *   low, medium and the most that counts; one genre mastered and one weak; all mastered; a genre unrelated at its most;
 *   duplicate and overlapping tags; more tags never adding; bounded and never lowered by more knowledge, over a seeded
 *   sweep of every play's, project's and brief's list; and what somebody loves apart from what they know.
 * - The paths, over the documented seed set (`SEEDS`, six actors): the School's casting and a night at the School on five
 *   plays of five shapes; an audition in person, a self-tape, a callback and a work day (a shoot day, or a night of a
 *   stage run) on four projects and two lists set by hand. At each, the genre part as the evaluation took it and the
 *   choices' preparation (the intermediate figures, which a cap on the whole can't hide), and the whole.
 * - Casting's reading of suitability, and a professional rehearsal day's lines: each moved by the genres and by nothing
 *   unrelated; and casting never made certain.
 *
 * Every expected figure is worked from the rule's own numbers, written in the setup module as literals.
 */

import { describe, expect, it } from 'vitest';
import { genreNeeds, relevantGenre } from '@/engine/systems/engagement';
import { genresOfPlay } from '@/engine/content/plays';
import { PROJECTS, projectById } from '@/engine/content/careerwork';
import { BRIEFS } from '@/engine/content/briefs';
import { GENRE_DEFS } from '@/engine/content/genres';
import {
  LEVELS, PATHS, PLAYS, PRO_PATHS, PROJECTS_READ, SCHOOL_PATHS, SEEDS, UNRELATED, actor, atLevel, casting, expectedTotal, knowing, listed,
  rehearsalLines, type Known, type Material, type Reading,
} from './setup/genre-proof';

const COMPLETE = 0.9;
const FLOOR = 0.75;
const kindsOf = (m: Material): readonly string[] => m.genres ?? (m.play ? genresOfPlay(m.play)! : projectById(m.project!)!.genres);
const knower = (known: Known) => ({ engagement: { byGenre: Object.fromEntries(Object.entries(known).map(([g, v]) => [g, { familiarity: v, practice: 0 }])) } });
/** The records the comparisons read: the levels, one mastered and the rest weak, all mastered, and an unrelated genre at its most. */
const RECORDS = (m: Material): Record<string, Known> => ({
  low: atLevel(m, LEVELS.low),
  medium: atLevel(m, LEVELS.medium),
  max: atLevel(m, LEVELS.max),
  'one mastered': { ...atLevel(m, 0), [m.needs[0]![0]]: 100 },
  'all mastered': atLevel(m, 100),
  unrelated: { [UNRELATED]: 100 },
});

/** A small seeded generator, so the sweep is the same every run: `mulberry32`. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

describe('the measure', () => {
  it('weighs each material’s genres as the rule does: the first listed half, the rest sharing the other half, a broad genre beside its own kind counted as the kind', () => {
    for (const m of [...PLAYS, ...PROJECTS_READ]) {
      expect(genreNeeds(kindsOf(m)).map((n) => [n.id, n.weight]), m.name).toEqual(m.needs.map(([g, w]) => [g, w]));
    }
  });

  it('gives each shape its share: low, medium, the most, one mastered and one weak, all mastered, and nothing for an unrelated genre at its most', () => {
    for (const m of [...PLAYS, ...PROJECTS_READ]) {
      const kinds = kindsOf(m);
      for (const [name, known] of Object.entries(RECORDS(m))) {
        expect(relevantGenre(knower(known), kinds).total, `${m.name}, ${name}`).toBeCloseTo(name === 'unrelated' ? 0 : expectedTotal(m, known), 12);
      }
      // One mastered and one weak is its own share: the whole where the material is one genre, less where it's more.
      const one = relevantGenre(knower(RECORDS(m)['one mastered']!), kinds).total;
      expect(one, m.name).toBeCloseTo(m.needs[0]![1], 12);
      if (m.needs.length > 1) expect(one, m.name).toBeLessThan(relevantGenre(knower(RECORDS(m)['all mastered']!), kinds).total);
    }
  });

  it('counts a tag listed twice once, and a broad genre beside its kind as one requirement, met by the kind whole and by the broad genre at half', () => {
    const both = (known: Known, kinds: readonly string[]) => relevantGenre(knower(known), kinds).total;
    expect(both({ comedy: 80 }, ['comedy', 'comedy'])).toBe(both({ comedy: 80 }, ['comedy']));
    expect(both({ comedy: 80 }, ['comedy', 'comedy'])).toBeCloseTo(0.8, 12);
    const route = projectById('route-nine')!.genres;
    expect(route).toEqual(['psychological_horror', 'horror']);
    expect(both({ psychological_horror: 90 }, route)).toBeCloseTo(0.9, 12);
    expect(both({ horror: 90 }, route)).toBeCloseTo(0.45, 12);
    // Both known: still 0.9, never 0.9 + 0.45.
    expect(both({ psychological_horror: 90, horror: 90 }, route)).toBeCloseTo(0.9, 12);
    // A kind toward its broad genre: 0.75 of what it's known at.
    expect(both({ psychological_horror: 80 }, ['horror'])).toBeCloseTo(0.6, 12);
  });

  it('never adds for more tags: every list in the game weighs to one, knowing every genre at 100 comes to one, and an unknown tag added never raises it', () => {
    const lists = [
      ...PROJECTS.map((p) => p.genres),
      ...BRIEFS.map((b) => b.kinds),
      ...PLAYS.map((m) => kindsOf(m)),
      ...[...new Set(BRIEFS.flatMap((b) => b.kinds))].map((g) => [g]),
    ];
    const everything = knower(Object.fromEntries(Object.keys(GENRE_DEFS).map((g) => [g, 100])));
    for (const kinds of lists) {
      expect(genreNeeds(kinds).reduce((a, n) => a + n.weight, 0), kinds.join(',')).toBeCloseTo(1, 12);
      expect(relevantGenre(everything, kinds).total, kinds.join(',')).toBeCloseTo(1, 12);
    }
    const draw = rng(21);
    const genres = Object.keys(GENRE_DEFS);
    for (let k = 0; k < 300; k += 1) {
      const kinds = lists[Math.floor(draw() * lists.length)]!;
      const known: Known = {};
      for (const g of kinds) known[g] = Math.round(draw() * 100);
      const extra = genres.find((g) => !kinds.includes(g) && known[g] === undefined && relevantGenre(knower({ [g]: 100 }), kinds).total === 0)!;
      expect(relevantGenre(knower(known), [...kinds, extra]).total, `${kinds.join(',')} + ${extra}`).toBeLessThanOrEqual(relevantGenre(knower(known), kinds).total + 1e-12);
    }
  });

  it('stays between 0 and 1, and more of any genre never lowers it, over 2,000 seeded records across every list', () => {
    const draw = rng(2026_10_22);
    const lists = [...PROJECTS.map((p) => p.genres), ...BRIEFS.map((b) => b.kinds), ...PLAYS.map((m) => kindsOf(m))];
    const genres = Object.keys(GENRE_DEFS);
    for (let k = 0; k < 2000; k += 1) {
      const kinds = lists[Math.floor(draw() * lists.length)]!;
      // The list's own genres, a related one or two and an unrelated one, each at a random figure.
      const pool = [...kinds, ...genres.filter((g) => GENRE_DEFS[g]!.families.some((f) => kinds.includes(f))).slice(0, 2), genres[Math.floor(draw() * genres.length)]!];
      const known: Known = {};
      for (const g of pool) known[g] = Math.round(draw() * 100);
      const before = relevantGenre(knower(known), kinds).total;
      expect(before).toBeGreaterThanOrEqual(0);
      expect(before).toBeLessThanOrEqual(1);
      const raised = pool[Math.floor(draw() * pool.length)]!;
      const after = relevantGenre(knower({ ...known, [raised]: Math.min(100, known[raised]! + 1 + Math.floor(draw() * 30)) }), kinds).total;
      expect(after, `${kinds.join(',')}: ${raised}`).toBeGreaterThanOrEqual(before - 1e-12);
    }
  });

  it('keeps what somebody loves apart from what they know: loving every genre of a work counts for nothing in it', () => {
    const sim = actor(SEEDS[0]);
    for (const m of PLAYS) {
      sim.player.genres = m.needs.map(([g]) => g);
      expect(relevantGenre(sim.player, kindsOf(m)).total, m.name).toBe(0);
      const loved = knowing(sim.player, {}, () => PATHS['school night'](sim, m));
      sim.player.genres = [];
      expect(knowing(sim.player, {}, () => PATHS['school night'](sim, m)), m.name).toEqual(loved);
    }
  }, 120_000);
});

/** Each path's readings over the seed set, for one material: by record, by seed. */
function readings(path: keyof typeof PATHS, m: Material): Record<string, Reading[]> {
  const out: Record<string, Reading[]> = {};
  for (const seed of SEEDS) {
    const sim = actor(seed);
    for (const [name, known] of Object.entries(RECORDS(m))) (out[name] ??= []).push(listed(m, () => knowing(sim.player, known, () => PATHS[path](sim, m))));
  }
  return out;
}

/**
 * What the genre part is, by the rule: the known total at the School; on a professional path the fit's genre half, the
 * total against what completes it kept to three places as the fit is (`fitOf`, before brief 21 too), of 90.
 */
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const partOf = (path: string, total: number) => (SCHOOL_PATHS.includes(path as never) ? total : r3(Math.min(1, total / COMPLETE)) * COMPLETE);

describe('the paths, the same actor and draw, only the genres changed', () => {
  const cases = [
    ...SCHOOL_PATHS.flatMap((path) => PLAYS.map((m) => ({ path, m }))),
    ...PRO_PATHS.flatMap((path) => PROJECTS_READ.map((m) => ({ path, m }))),
  ];
  for (const { path, m } of cases) {
    it(`${path}, ${m.name} (${m.shape}): the genre part and the choices move by the rule, the whole never falls as knowledge rises, and an unrelated genre moves nothing`, () => {
      const r = readings(path, m);
      for (let s = 0; s < SEEDS.length; s += 1) {
        const at = (name: string) => r[name]![s]!;
        const where = `${SEEDS[s]}`;
        if (path !== 'school casting') {
          for (const name of ['low', 'medium', 'max', 'one mastered', 'all mastered']) {
            const total = expectedTotal(m, RECORDS(m)[name]!);
            // The intermediate figures: the part as the evaluation took it, and the choices' preparation it gates.
            const part = partOf(path, total);
            expect(at(name).part, `${where} ${name}: the part`).toBeCloseTo(part, 9);
            expect(at(name).required, `${where} ${name}`).toBe(COMPLETE);
            // Kept to three places, as every dimension's preparation is.
            expect(at(name).prepared, `${where} ${name}: the choices' preparation`).toBeCloseTo(FLOOR + (1 - FLOOR) * Math.min(1, part / COMPLETE), 3);
          }
          expect(at('low').interpretation!, where).toBeLessThan(at('max').interpretation!);
          expect(at('low').interpretation!, where).toBeLessThanOrEqual(at('medium').interpretation!);
          expect(at('medium').interpretation!, where).toBeLessThanOrEqual(at('max').interpretation!);
        }
        expect(at('low').overall, where).toBeLessThan(at('max').overall);
        expect(at('low').overall, where).toBeLessThanOrEqual(at('medium').overall);
        expect(at('medium').overall, where).toBeLessThanOrEqual(at('max').overall);
        // Complete at 90: all mastered is the most there is, and no more than the most that counts.
        expect(at('all mastered').overall, where).toBe(at('max').overall);
        // One mastered and the rest weak: the whole where it's one genre, between where it's more.
        if (m.needs.length === 1) expect(at('one mastered').overall, where).toBe(at('all mastered').overall);
        else {
          expect(at('one mastered').overall, where).toBeGreaterThanOrEqual(at('low').overall);
          expect(at('one mastered').overall, where).toBeLessThanOrEqual(at('all mastered').overall);
        }
        // An unrelated genre at its most is the same as knowing none.
        expect(at('unrelated'), where).toEqual(at('low'));
      }
    }, 300_000);
  }
});

describe('casting’s reading and a rehearsal day’s lines', () => {
  it('professional casting reads the genres as half the fit, by the rule, an unrelated genre not at all, and never makes the part certain', () => {
    for (const seed of SEEDS) {
      const sim = actor(seed);
      for (const m of PROJECTS_READ) listed(m, () => {
        const at = (known: Known) => knowing(sim.player, known, () => casting(sim, m));
        const low = at(atLevel(m, 0));
        const medium = at(atLevel(m, LEVELS.medium));
        const max = at(atLevel(m, LEVELS.max));
        expect(medium.genre, m.name).toBeCloseTo(Math.min(1, expectedTotal(m, atLevel(m, LEVELS.medium)) / COMPLETE), 12);
        expect([low.genre, max.genre], m.name).toEqual([0, 1]);
        // The fit is the genre half and the techniques half, alike: the genre moves it by half of what it moves.
        expect(max.fit - low.fit, m.name).toBeCloseTo(0.5, 12);
        expect(at({ [UNRELATED]: 100 }), m.name).toEqual(low);
        expect(low.chance, m.name).toBeLessThan(max.chance);
        // At the most there is, a Strong final round is still a chance: SLATE's ceiling, 80 in 100 (`CASTING.most`).
        expect(max.chance, m.name).toBeLessThanOrEqual(0.8);
      });
    }
  }, 120_000);

  it('a professional rehearsal day learns the lines faster in genres known, by a sixth of the weighed total, and no faster for an unrelated genre', () => {
    const sim = actor(SEEDS[0]);
    for (const m of PROJECTS_READ) listed(m, () => {
      const at = (known: Known) => knowing(sim.player, known, () => rehearsalLines(sim, m));
      // A School call's rate, 0.12 of what's left, times 1 + a sixth of the total, to three places.
      expect(at(atLevel(m, 0)), m.name).toBe(0.12);
      expect(at(atLevel(m, LEVELS.max)), m.name).toBe(r3(0.12 * (1 + expectedTotal(m, atLevel(m, LEVELS.max)) / 6)));
      expect(at({ [UNRELATED]: 100 }), m.name).toBe(0.12);
    });
  }, 120_000);
});
