/**
 * Every practice brief is whole, original and honest about what it asks (from 2026-10-12; `content/briefs/`). Each is
 * checked on its own, so a brief that breaks a rule is named; then every genre is checked for one written for it.
 *
 * What's held: the scene's setup is all there (circumstances, relationship, who you and the reader play, objective,
 * obstacle, two to four beats); its features are 0 to 3 and every high one says why; its techniques are real ones,
 * said why, and include every applied demand of every genre it's listed under (a genre's research-backed demand is
 * staged by the scene, never assumed by a label); a side it won't take says why; and it offers two or more readings,
 * each supported, leaning the work within bounds, and at least two of them leaning it differently.
 */
import { describe, expect, it } from 'vitest';
import { BRIEFS } from '@/engine/content/briefs';
import { GENRE_DEFS } from '@/engine/content/genres';
import { DEMAND_TECHNIQUE, applied, genreTags } from '@/engine/content/demands';
import { TECHNIQUES } from '@/engine/content/abilities';
import { AXES } from '@/engine/content/approaches';
import type { Brief } from '@/engine/content/briefs';

const DIMS = ['believability', 'interpretation', 'connection', 'execution', 'consistency', 'responsiveness'];
const ABILITIES = ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'vocal', 'physical', 'discipline', 'stamina'];
const TONES = ['comic', 'grave', 'lyric', 'grotesque'];
const BASE: Record<Brief['medium'], string[]> = { camera: ['screen', 'scene'], voice: ['voiceover', 'scene'] };

describe('each practice brief', () => {
  it('has a unique id', () => {
    const ids = BRIEFS.map((b) => b.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  for (const b of BRIEFS) {
    it(`${b.id}: is a whole, honest brief`, () => {
      // Exactly the genre it was written for, and an ordinal after a second (from 2026-10-12: until then 'brief-action_comedy'
      // would have passed for 'action').
      expect(new RegExp(`^brief-${b.kinds[0]}(-[2-9])?$`).test(b.id), 'its id names the genre it was written for').toBe(true);
      expect(b.title[0], 'Title Case').toBe(b.title[0]!.toUpperCase());
      expect(b.kinds.length).toBeGreaterThanOrEqual(1);
      expect(b.kinds.length).toBeLessThanOrEqual(3);
      expect(new Set(b.kinds).size).toBe(b.kinds.length);
      for (const g of b.kinds) expect(GENRE_DEFS[g], g).toBeDefined();
      for (const k of ['logline', 'circumstances', 'relationship', 'you', 'reader', 'objective', 'obstacle'] as const) expect(b[k].length, k).toBeGreaterThanOrEqual(20);
      expect(JSON.stringify(b)).not.toMatch(/excerpt|adapted from|based on the (film|play)/i);
      expect(b.beats.length).toBeGreaterThanOrEqual(2);
      expect(b.beats.length).toBeLessThanOrEqual(b.size === 'long' ? 6 : 4);
      if (b.stakes !== undefined) expect([0, 1, 2, 3]).toContain(b.stakes);
      if (b.readerPlays !== undefined) { expect(['steady', 'pressing', 'withholding', 'unpredictable']).toContain(b.readerPlays); expect(b.medium).toBe('camera'); }
      for (const beat of b.beats) {
        expect(beat.what.length).toBeGreaterThanOrEqual(10);
        expect(beat.tones.length).toBeGreaterThanOrEqual(1);
        expect(beat.tones.length).toBeLessThanOrEqual(2);
        expect(new Set(beat.tones).size).toBe(beat.tones.length);
        for (const t of beat.tones) expect(TONES).toContain(t);
      }
      expect(b.why.beats, 'why.beats').toBeTruthy();
      for (const f of ['timing', 'physical', 'partner', 'vocal', 'improvisation'] as const) {
        expect([0, 1, 2, 3]).toContain(b[f]);
        if (b[f] >= 2) expect(b.why[f], `why.${f}`).toBeTruthy();
      }
      expect(['everyday', 'heightened', 'verse']).toContain(b.language);
      if (b.language !== 'everyday') expect(b.why.language, 'why.language').toBeTruthy();
      for (const [k, w] of Object.entries(b.techniques ?? {})) {
        expect(TECHNIQUES, k).toContain(k);
        expect([1, 2, 3]).toContain(w);
      }
      if (Object.keys(b.techniques ?? {}).length) expect(b.why.techniques, 'why.techniques').toBeTruthy();
      // Every genre it's listed under has its applied demands staged by the scene.
      const asks = new Set([...BASE[b.medium], ...Object.keys(b.techniques ?? {})]);
      for (const g of b.kinds) for (const tag of genreTags(g)) expect(asks.has(DEMAND_TECHNIQUE[tag]), `${g} asks ${DEMAND_TECHNIQUE[tag]}`).toBe(true);
      if (b.allows) {
        expect(b.why.allows, 'why.allows').toBeTruthy();
        for (const [axis, sides] of Object.entries(b.allows)) {
          expect(AXES[axis as keyof typeof AXES], axis).toBeDefined();
          for (const s of sides!) expect(AXES[axis as keyof typeof AXES].values).toContain(s);
          expect(sides!.length).toBe(1);
        }
      }
      expect(b.readings.length).toBeGreaterThanOrEqual(2);
      expect(new Set(b.readings.map((r) => r.id)).size).toBe(b.readings.length);
      for (const r of b.readings) {
        expect(r.label[0]).toBe(r.label[0]!.toUpperCase());
        expect(r.reading.length).toBeGreaterThanOrEqual(20);
        expect(r.rests.length).toBeGreaterThanOrEqual(20);
        expect(Object.keys(r.lean).length).toBeGreaterThan(0);
        for (const [d, x] of Object.entries(r.lean)) { expect(DIMS, d).toContain(d); expect(x).toBeGreaterThanOrEqual(0.85); expect(x).toBeLessThanOrEqual(1.25); }
        expect(r.draws.length).toBeGreaterThan(0);
        for (const d of r.draws) { expect(DIMS).toContain(d.dim); expect(ABILITIES).toContain(d.ability); expect(d.weight).toBeGreaterThanOrEqual(0.3); expect(d.weight).toBeLessThanOrEqual(1); }
      }
      // Meaningfully different: two readings lean some dimension at least 0.1 apart.
      // (From 2026-10-12 one comparison, parenthesized as meant: until then its first clause took the absolute value of one
      // lean and subtracted the other, and passed only because its second clause was right.)
      const differ = b.readings.some((r, i) => b.readings.some((s, j) => j > i && DIMS.some((d) => Math.abs(((r.lean as Record<string, number>)[d] ?? 1) - ((s.lean as Record<string, number>)[d] ?? 1)) >= 0.1)));
      expect(differ, 'two readings lean the work differently').toBe(true);
    });
  }
});

describe('the genres', () => {
  it('each has a brief written for it', () => {
    const missing = Object.keys(GENRE_DEFS).filter((g) => !BRIEFS.some((b) => b.kinds[0] === g));
    expect(missing).toEqual([]);
  });

  it('a genre with applied demands is never listed on a brief that doesn’t stage them', () => {
    for (const b of BRIEFS) for (const g of b.kinds) if (applied(g)) for (const t of genreTags(g)) expect([...BASE[b.medium], ...Object.keys(b.techniques ?? {})], `${b.id} under ${g}`).toContain(DEMAND_TECHNIQUE[t]);
  });
});

/**
 * Two situations for every genre (from 2026-10-12; the owner's brief of that day, section 7): a genre's second brief is
 * a different situation, not the first renamed. Its relationship, objective, obstacle and circumstances share few
 * words with the first's, and it differs on at least two of the axes the owner named: medium, the material's features,
 * the tones in order, the beats' number, the length, the stakes, how the reader plays the other part, and what the
 * scene stages.
 */
describe('two situations for every genre', () => {
  const words = (s: string) => new Set(s.toLowerCase().match(/[a-z’']{5,}/g) ?? []);
  const overlap = (a: string, b: string) => { const x = words(a), y = words(b); return [...x].filter((w) => y.has(w)).length / Math.max(1, Math.min(x.size, y.size)); };
  const axes = (a: Brief, b: Brief) => [
    a.medium !== b.medium,
    (['timing', 'physical', 'partner', 'vocal', 'improvisation'] as const).filter((f) => a[f] !== b[f]).length >= 2,
    a.beats.map((x) => x.tones.join('+')).join('>') !== b.beats.map((x) => x.tones.join('+')).join('>'),
    a.beats.length !== b.beats.length,
    a.size !== b.size,
    (a.stakes ?? 1) !== (b.stakes ?? 1),
    (a.readerPlays ?? 'steady') !== (b.readerPlays ?? 'steady'),
    JSON.stringify(a.techniques ?? {}) !== JSON.stringify(b.techniques ?? {}),
  ].filter(Boolean).length;

  it('has at least two briefs written for each genre', () => {
    const short = Object.keys(GENRE_DEFS).filter((g) => BRIEFS.filter((b) => b.kinds[0] === g).length < 2);
    expect(short).toEqual([]);
  });

  for (const g of Object.keys(GENRE_DEFS)) {
    it(`${g}: its briefs are different situations`, () => {
      const list = BRIEFS.filter((b) => b.kinds[0] === g);
      for (let i = 0; i < list.length; i += 1) for (let j = i + 1; j < list.length; j += 1) {
        const [a, b] = [list[i]!, list[j]!];
        expect(a.title, 'a title of its own').not.toBe(b.title);
        for (const k of ['relationship', 'objective', 'obstacle', 'circumstances'] as const) expect(overlap(a[k], b[k]), `${a.id} and ${b.id}: ${k}`).toBeLessThan(0.5);
        expect(axes(a, b), `${a.id} and ${b.id}: the axes they differ on`).toBeGreaterThanOrEqual(2);
      }
    });
  }
});
