/**
 * Brief 22, T4: the related-genre coefficients evaluated before they were final, by controlled comparisons on the fixed
 * seeds `b22-proof-1` to `-8` (docs/verification/career-genre-2026-10-22/criteria.md), every path that reads a work's
 * genres, the same actor, day, preparation and draw, only what's known of genres changed (`tests/setup/b22-comparisons.ts`).
 *
 * Brief 21's 0.75 and 0.5 failed the criterion written before they were measured: a kind's gain on a taped brief, a
 * School night and a self-tape came to more than 0.85 of the genre's own, and a broad genre's on a taped brief and a
 * School night to more than 0.65. 0.65 and 0.40 hold on every path, and replaced them. The second test keeps the
 * measurement that decided it: 0.75 and 0.5 set back by hand fail again where they failed.
 */
import { describe, expect, it } from 'vitest';
import { ENGAGEMENT } from '@/engine/content/engagement';
import { ASKED, COMPARED_PATHS, RECORD_NAMES, SEEDS, atCoefficients, comparisons, verdict } from './setup/b22-comparisons';

const round = (x: number) => Math.round(x * 1e9) / 1e9;

describe('T4: the coefficients measured on the fixed seeds', () => {
  it('keeps 0.65 and 0.40, which hold K1 and K2 on every path: nothing and an unrelated genre alike, then the broad genre, a kind and the genre itself in order; a kind at most 0.85 of the genre’s own gain, a broad genre at most 0.65', () => {
    expect(ENGAGEMENT.related).toEqual({ kindToParent: 0.65, parentToKind: 0.4 });
    expect(SEEDS).toEqual(['b22-proof-1', 'b22-proof-2', 'b22-proof-3', 'b22-proof-4', 'b22-proof-5', 'b22-proof-6', 'b22-proof-7', 'b22-proof-8']);
    const rows = comparisons();
    expect(rows).toHaveLength(SEEDS.length * COMPARED_PATHS.length * RECORD_NAMES.length);
    // The reading itself, on every path and seed: crime asked, 0 for nothing and western, 0.4 × 0.9 for drama, 0.65 × 0.9 for a police procedural, 0.9 for crime.
    const reading = { none: 0, unrelated: 0, broad: 0.36, kind: 0.585, exact: 0.9 };
    for (const r of rows) expect(round(r.figures.reading), `${r.path} ${r.seed} ${r.record}`).toBe(reading[r.record]);
    // Every reading is the same actor's but for the genres: on every path and seed, nothing known and western at 90 come to the same whole.
    for (const r of rows.filter((x) => x.record === 'unrelated')) {
      const none = rows.find((x) => x.path === r.path && x.seed === r.seed && x.record === 'none')!;
      expect(r.figures.overall, `${r.path} ${r.seed}`).toBe(none.figures.overall);
    }
    const verdicts = verdict(rows);
    expect(verdicts.map((v) => v.path)).toEqual([...COMPARED_PATHS]);
    for (const v of verdicts) {
      expect(v.k1, `${v.path} ${JSON.stringify(v.gains)}`).toBe(true);
      expect(v.kindShare, v.path).toBeLessThanOrEqual(0.85);
      expect(v.broadShare, v.path).toBeLessThanOrEqual(0.65);
    }
    expect(ASKED).toBe('crime');
  }, 900_000);

  it('the measurement that replaced brief 21’s 0.75 and 0.5 (TEST SETUP: set back by hand): a kind over 0.85 of the genre’s own on a taped brief, a School night and a self-tape, a broad genre over 0.65 on a taped brief and a School night', () => {
    const paths = ['taped brief', 'school night', 'self-tape'] as const;
    const verdicts = atCoefficients(0.75, 0.5, () => verdict(comparisons(paths)));
    const by = Object.fromEntries(verdicts.map((v) => [v.path, v]));
    expect(by['taped brief']!.kindShare).toBeGreaterThan(0.85);
    expect(by['taped brief']!.broadShare).toBeGreaterThan(0.65);
    expect(by['school night']!.kindShare).toBeGreaterThan(0.85);
    expect(by['school night']!.broadShare).toBeGreaterThan(0.65);
    expect(by['self-tape']!.kindShare).toBeGreaterThan(0.85);
    for (const p of ['taped brief', 'school night', 'self-tape'] as const) expect(by[p]!.k2, p).toBe(false);
    // The order held even then: K1 was never what failed.
    for (const v of verdicts) expect(v.k1, v.path).toBe(true);
    // And put back.
    expect(ENGAGEMENT.related).toEqual({ kindToParent: 0.65, parentToKind: 0.4 });
  }, 900_000);
});
