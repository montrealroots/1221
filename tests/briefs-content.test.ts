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
      expect(b.id.startsWith(`brief-${b.kinds[0]}`), 'its id names the genre it was written for').toBe(true);
      expect(b.title[0], 'Title Case').toBe(b.title[0]!.toUpperCase());
      expect(b.kinds.length).toBeGreaterThanOrEqual(1);
      expect(b.kinds.length).toBeLessThanOrEqual(3);
      expect(new Set(b.kinds).size).toBe(b.kinds.length);
      for (const g of b.kinds) expect(GENRE_DEFS[g], g).toBeDefined();
      for (const k of ['logline', 'circumstances', 'relationship', 'you', 'reader', 'objective', 'obstacle'] as const) expect(b[k].length, k).toBeGreaterThanOrEqual(20);
      expect(JSON.stringify(b)).not.toMatch(/excerpt|adapted from|based on the (film|play)/i);
      expect(b.beats.length).toBeGreaterThanOrEqual(2);
      expect(b.beats.length).toBeLessThanOrEqual(4);
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
      const differ = b.readings.some((r, i) => b.readings.some((s, j) => j > i && DIMS.some((d) => Math.abs((r.lean as Record<string, number>)[d] ?? 1) - ((s.lean as Record<string, number>)[d] ?? 1) >= 0.1 || Math.abs(((s.lean as Record<string, number>)[d] ?? 1) - ((r.lean as Record<string, number>)[d] ?? 1)) >= 0.1)));
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
