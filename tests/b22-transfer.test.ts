/**
 * Brief 22, section 3 (docs/verification/career-genre-2026-10-22/criteria.md, T1 to T3): knowing a genre counts toward
 * another only across one direct link, a broad genre and its direct kind, and only as familiarity: it helps meet a
 * requirement and earns nothing stored. The genre's own knowledge and the best related credit count together,
 * `1 − (1 − own) × (1 − related)`.
 *
 * - The whole table, 149 genres by 149: what's related, at what, and what isn't (siblings, two links away, unrelated).
 * - Exact, partial and no knowledge; a broad genre toward its kind and a kind toward its broad genre; several genres of
 *   a work known unevenly; no chain amplified; nothing stored by reading, and practice only in what the work asks;
 *   bounded and never falling; the genre's own study always adding; and nothing irrelevant moved.
 *
 * TEST SETUP: what a person knows of genres, set for one reading.
 */
import { describe, expect, it } from 'vitest';
import { GENRE_DEFS } from '@/engine/content/genres';
import { ENGAGEMENT } from '@/engine/content/engagement';
import { BRIEFS } from '@/engine/content/briefs';
import { PROJECTS } from '@/engine/content/careerwork';
import { ancestorsOf, creditPractice, parentsOf, relatedness, relevantGenre, requirementOf, requirementOfPlay, requirementOfRole, type Engagement } from '@/engine/systems/engagement';
import { briefContext, briefPiece, type BriefRecord } from '@/engine/systems/briefs';
import { judgePiece } from '@/engine/systems/piece';
import type { Performer } from '@/engine/systems/evaluation';
import type { Person } from '@/engine/domain/model';

type Known = Record<string, number>;
const record = (known: Known): Engagement => ({ byGenre: Object.fromEntries(Object.entries(known).map(([g, v]) => [g, { familiarity: v, practice: 0 }])) });
const read = (known: Known, work: Parameters<typeof relevantGenre>[1]) => relevantGenre({ engagement: record(known) }, work);
const total = (known: Known, work: Parameters<typeof relevantGenre>[1]) => read(known, work).total;
const GENRES = Object.keys(GENRE_DEFS).sort();
const { kindToParent: KIND, parentToKind: BROAD } = ENGAGEMENT.related;

/** A small seeded generator, so the sweep is the same every run: `mulberry32`. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

describe('T1: one direct link, and nothing else', () => {
  it('reads all 149 by 149: itself 1, a direct kind toward its broad genre 0.65, a broad genre toward its direct kind 0.4, every other pair 0', () => {
    expect(GENRES).toHaveLength(149);
    let kinds = 0, broads = 0, none = 0;
    for (const known of GENRES) for (const need of GENRES) {
      const r = relatedness(known, need);
      if (known === need) expect(r).toBe(1);
      else if (parentsOf(known).includes(need)) { expect(r, `${known} → ${need}`).toBe(KIND); kinds += 1; }
      else if (parentsOf(need).includes(known)) { expect(r, `${known} → ${need}`).toBe(BROAD); broads += 1; }
      else { expect(r, `${known} → ${need}`).toBe(0); none += 1; }
    }
    // Every direct link counted both ways, and every other pair of different genres nothing.
    expect(kinds).toBe(broads);
    expect(kinds + broads + none + GENRES.length).toBe(149 * 149);
  });

  it('gives nothing two links away: the twelve kinds of a broad genre that is itself a kind (Nordic noir of crime, crime of drama) count nothing toward the farther one, which brief 21 counted at 0.75', () => {
    const chained = GENRES.filter((g) => ancestorsOf(g).size > parentsOf(g).length);
    expect(chained).toHaveLength(12);
    for (const g of chained) for (const far of [...ancestorsOf(g)].filter((a) => !parentsOf(g).includes(a))) {
      expect(relatedness(g, far), `${g} → ${far}`).toBe(0);
      expect(relatedness(far, g), `${far} → ${g}`).toBe(0);
    }
    expect(relatedness('nordic_noir', 'drama')).toBe(0);
    expect(relatedness('nordic_noir', 'crime')).toBe(KIND);
    expect(relatedness('crime', 'drama')).toBe(KIND);
  });

  it('gives nothing between siblings: two kinds of one broad genre, romantic comedy and farce of comedy, domestic and political drama of drama', () => {
    for (const [a, b] of [['romantic_comedy', 'farce'], ['domestic_drama', 'political_drama'], ['psychological_horror', 'horror_comedy'], ['police_procedural', 'heist']] as [string, string][]) {
      expect(parentsOf(a).some((p) => parentsOf(b).includes(p)), `${a} and ${b} share a broad genre`).toBe(true);
      expect([relatedness(a, b), relatedness(b, a)]).toEqual([0, 0]);
    }
  });
});

describe('T3: exact, partial and none, together and bounded', () => {
  it('reads a domestic drama: itself at 90 is 0.9; drama, its broad genre, at 90 is 0.36; a kind of nothing, Western, at 100 is 0; both is 0.936, more than either and never their sum', () => {
    const dd = ['domestic_drama'];
    expect(total({ domestic_drama: 90 }, dd)).toBeCloseTo(0.9, 12);
    expect(total({ drama: 90 }, dd)).toBeCloseTo(0.36, 12);
    expect(total({ western: 100 }, dd)).toBe(0);
    expect(total({}, dd)).toBe(0);
    expect(total({ domestic_drama: 90, drama: 90 }, dd)).toBeCloseTo(1 - 0.1 * 0.64, 12);
    const [need] = read({ domestic_drama: 90, drama: 90 }, dd).needs;
    expect([need!.id, need!.weight, need!.own, Math.round(need!.related * 1e9) / 1e9, need!.by]).toEqual(['domestic_drama', 1, 0.9, 0.36, 'drama']);
    expect(need!.credit).toBeCloseTo(0.936, 12);
    // Exact mastery is whole, whatever else is known.
    expect(total({ domestic_drama: 100, drama: 30, western: 100 }, dd)).toBe(1);
  });

  it('a kind toward its broad genre at 0.65 and a broad genre toward its kind at 0.4: Psychological Horror known meets Horror, Horror known meets Psychological Horror', () => {
    expect(total({ psychological_horror: 80 }, ['horror'])).toBeCloseTo(0.52, 12);
    expect(total({ horror: 80 }, ['psychological_horror'])).toBeCloseTo(0.32, 12);
    // A kind of several broad genres, tragicomedy of tragedy and of comedy, toward each.
    expect(total({ tragicomedy: 80 }, ['tragedy'])).toBeCloseTo(0.52, 12);
    expect(total({ tragicomedy: 80 }, ['comedy'])).toBeCloseTo(0.52, 12);
    // Both of tragicomedy's broad genres known: the better of them counts, once, never both.
    expect(total({ tragedy: 80, comedy: 60 }, ['tragicomedy'])).toBeCloseTo(0.32, 12);
  });

  it('several genres of a work known unevenly: Macbeth (tragedy 3, historical drama 1, supernatural 1) with tragedy at 90, drama at 60 and horror at 40', () => {
    const r = read({ tragedy: 90, drama: 60, horror: 40 }, requirementOfPlay('Macbeth'));
    // Tragedy its own 0.9; historical drama by drama, its broad genre, 0.4 × 0.6; supernatural by horror, 0.4 × 0.4.
    expect(r.needs.map((n) => [n.id, n.own, Math.round(n.related * 1e9) / 1e9, n.by])).toEqual([['historical_drama', 0, 0.24, 'drama'], ['supernatural', 0, 0.16, 'horror'], ['tragedy', 0.9, 0, undefined]]);
    expect(r.total).toBeCloseTo(0.6 * 0.9 + 0.2 * 0.24 + 0.2 * 0.16, 12);
  });

  it('never amplifies a chain: drama known gives a Nordic noir nothing, crime known 0.4 of itself, and both together crime’s 0.4', () => {
    expect(total({ drama: 100 }, ['nordic_noir'])).toBe(0);
    expect(total({ crime: 100 }, ['nordic_noir'])).toBeCloseTo(BROAD, 12);
    expect(total({ crime: 100, drama: 100 }, ['nordic_noir'])).toBeCloseTo(BROAD, 12);
    // And a Nordic noir known gives drama nothing, crime 0.65 of itself.
    expect(total({ nordic_noir: 100 }, ['drama'])).toBe(0);
    expect(total({ nordic_noir: 100 }, ['crime'])).toBeCloseTo(KIND, 12);
  });

  it('keeps every reading between 0 and 1, never lowers it for more of any genre, and each point of the genre’s own always adds, over 3,000 seeded records', () => {
    const draw = rng(2026_10_22_22);
    const lists = [...PROJECTS.map((t) => requirementOfRole(t)), ...BRIEFS.map((b) => requirementOf(b.kinds)), requirementOfPlay('Macbeth'), requirementOfPlay('The Winter’s Tale'), requirementOf(['nordic_noir', 'farce', 'romance'])];
    for (let k = 0; k < 3000; k += 1) {
      const work = lists[Math.floor(draw() * lists.length)]!;
      const ids = work.needs.map((n) => n.id);
      const pool = [...ids, ...ids.flatMap((g) => parentsOf(g)), ...GENRES.filter((g) => ids.some((i) => parentsOf(g).includes(i))).slice(0, 2), GENRES[Math.floor(draw() * GENRES.length)]!];
      const known: Known = {};
      for (const g of pool) known[g] = Math.round(draw() * 100);
      const before = total(known, work);
      expect(before).toBeGreaterThanOrEqual(0);
      expect(before).toBeLessThanOrEqual(1);
      const raised = pool[Math.floor(draw() * pool.length)]!;
      if (known[raised]! < 100) expect(total({ ...known, [raised]: Math.min(100, known[raised]! + 1 + Math.floor(draw() * 30)) }, work), raised).toBeGreaterThanOrEqual(before - 1e-12);
      // The work's own genre raised: strictly more, unless it's already whole.
      const own = ids[Math.floor(draw() * ids.length)]!;
      if ((known[own] ?? 0) < 100) expect(total({ ...known, [own]: Math.min(100, (known[own] ?? 0) + 5) }, work), `${own} raised`).toBeGreaterThan(before);
    }
  });

  it('keeps specialist work worth it: at 90, the genre itself 0.9, its kind 0.585, its broad genre 0.36, an unrelated genre 0; and from a broad genre known at 90, the first study of the kind adds, where brief 21’s better-of-the-two added nothing until past its broad genre’s credit', () => {
    expect([total({ crime: 90 }, ['crime']), total({ police_procedural: 90 }, ['crime']), total({ drama: 90 }, ['crime']), total({ western: 90 }, ['crime'])].map((x) => Math.round(x * 1e9) / 1e9)).toEqual([0.9, 0.585, 0.36, 0]);
    const broad = total({ drama: 90 }, ['domestic_drama']);
    expect(total({ drama: 90, domestic_drama: 8 }, ['domestic_drama'])).toBeGreaterThan(broad);
    expect(total({ drama: 90, domestic_drama: 8 }, ['domestic_drama'])).toBeCloseTo(1 - 0.92 * 0.64, 12);
  });
});

describe('T2: familiarity apart from progression', () => {
  it('reading writes nothing: the record is the same after every reading', () => {
    const rec = record({ drama: 90, crime: 40 });
    const before = JSON.stringify(rec);
    for (const work of [['nordic_noir'], ['domestic_drama'], ['drama', 'crime'], requirementOfPlay('Macbeth')]) relevantGenre({ engagement: rec }, work);
    expect(JSON.stringify(rec)).toBe(before);
  });

  it('practice goes only to what the work asks: a domestic drama’s session to domestic drama, none to drama, however well drama is known', () => {
    const rec = record({ drama: 90 });
    expect(creditPractice(rec, ['domestic_drama'])).toEqual(['domestic_drama']);
    expect(rec.byGenre.drama).toEqual({ familiarity: 90, practice: 0 });
    expect(rec.byGenre.domestic_drama!.practice).toBe(10);
    // A broad genre listed beside it, folded in, earns nothing of its own either.
    creditPractice(rec, ['domestic_drama', 'drama']);
    expect(rec.byGenre.drama!.practice).toBe(0);
  });
});

describe('T3: nothing irrelevant moves', () => {
  it('an unrelated genre at 100 leaves a taped brief of another genre exactly as knowing nothing does, and a related one moves it less than the genre itself', () => {
    const EVEN: Performer = { ability: () => 55, full: () => 100, technique: () => 50 };
    const taped = (known: Known, b: (typeof BRIEFS)[number]) => {
      const person = { engagement: record(known) } as unknown as Person;
      const rec: BriefRecord = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
      const reading = b.readings[0]!.id;
      return judgePiece('b22', EVEN, { ...briefContext(person, b, rec, { reading }), condition: { readiness: 100 }, key: `b22:${b.id}`, expected: true }, briefPiece(b, { ...rec, reading }, reading)).overall;
    };
    const farce = BRIEFS.find((b) => b.kinds[0] === 'farce')!;
    const none = taped({}, farce);
    expect(taped({ western: 100, nordic_noir: 100, romantic_comedy: 100 }, farce)).toBe(none);
    const broad = taped({ comedy: 90 }, farce);
    const own = taped({ farce: 90 }, farce);
    expect(broad).toBeGreaterThan(none);
    expect(own).toBeGreaterThan(broad);
  });
});
