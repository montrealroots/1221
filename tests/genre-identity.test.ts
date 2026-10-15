/**
 * Each genre's identity (from 2026-10-16; the owner's brief "Complete Genre Differentiation And Prove Each Genre's
 * Identity"): its register (`content/concerns.ts`, `content/genre-register.ts`), read by every take of a brief written
 * for it (`briefContext`), named on the screen and in a take's note (`systems/register.ts`), and the seven pairs of briefs
 * that were the same in every number a take read, revised (`docs/verification/genres-2026-10-16/README.md`).
 *
 * What's measured, and how the expectations were reached:
 *
 * - The register's integrity: every genre one or two concerns, each concern's preparation parts the ones the dimensions
 *   it leans on read (the tape task's own `prep`), its strength a reading's.
 * - The seven pairs: their briefs now differ in what a take reads with the register left out, and their registers differ.
 *   Controlled (the same scene, the same actor, preparation and day, only the genre changed): for every ability the first
 *   genre's register draws on by at least 0.3 more than the second's (summed from `CONCERNS`, not the engine), that
 *   ability's specialist (85, the other eleven evenly lowered to keep 600) comes out ahead in the first genre, and the
 *   reverse.
 * - Who a genre rewards: on Nordic noir's scene an actor at 70 in composure and focus and 40 in listening and
 *   adaptability is ahead of the opposite actor, and on social realism's the opposite actor is ahead. Measured on
 *   2026-10-16: 56.3 against 54.1, and 55.1 against 57.9.
 * - Every reading of every one of the fourteen briefs, at mastery, in every fitting way of playing it, is 100.
 * - Genre proficiency at none, low (0.3), medium (0.6) and high (0.9): the take rises with it, complete at 0.9; past it
 *   nothing more; and knowing another genre fully adds nothing.
 * - The note: held back most by an ability the genre's register asks for, a take names the concern; once that ability
 *   no longer holds it back, it doesn't (the advice answered isn't repeated).
 * - Played: a save prepares and tapes Nordic noir's brief through its commands, the take keeps its concern, a reload
 *   keeps it, and the take worked out again from what it kept is the take; composure worked on, the next take's note
 *   no longer names it.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { BRIEF_BY_ID, BRIEFS, type Brief } from '@/engine/content/briefs';
import { ABILITY_DEFS, MASTERED } from '@/engine/content/abilities';
import { AXES } from '@/engine/content/approaches';
import type { Axis } from '@/engine/content/material';
import { CONCERNS, CONCERN_IDS, CONCERN_STRENGTH, type Concern } from '@/engine/content/concerns';
import { GENRE_DEFS } from '@/engine/content/genres';
import { GENRE_REGISTER } from '@/engine/content/genre-register';
import { TASK_PROFILES, type Dimension } from '@/engine/content/tasks';
import { BRIEF, briefContext, briefMaterial, briefPiece, recordOf, registerOf, tapeReadsOf, type BriefRecord } from '@/engine/systems/briefs';
import { judgePiece } from '@/engine/systems/piece';
import { misfitOf, type Playing } from '@/engine/systems/material';
import { replay, type Performer } from '@/engine/systems/evaluation';
import { concernBehind, concernNote, concernWords } from '@/engine/systems/register';
import { instantFromZoned } from '@/engine/core/time';
import { genreState } from '@/engine/systems/engagement';

const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const ABILITIES = ABILITY_DEFS.map((d) => d.id);
const full = (): BriefRecord => ({ prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] });
const actor = (levels: Partial<Record<string, number>>, rest = 50, technique = 50): Performer => ({ ability: (id) => levels[id] ?? rest, full: () => 100, technique: () => technique });
const specialist = (a: string): Performer => actor({ [a]: 85 }, (600 - 85) / 11);
const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
/** A take as the game judges one, with no draw, at readiness 100, the genre known as `genre` says (1 by default). */
const take = (p: Performer, b: Brief, o: { reading?: string; genre?: number; rec?: BriefRecord; playing?: Omit<Playing, 'chosenAt' | 'prep'> } = {}) => {
  const reading = o.reading ?? b.readings[0]!.id;
  const ctx = briefContext(nobody, b, o.rec ?? full(), { reading, prep: { genre: o.genre ?? 1, ...(o.playing ? { approach: 1 } : {}) }, ...(o.playing ? { playing: { ...o.playing, chosenAt: 0, prep: 1 } } : {}) });
  return judgePiece('genre', p, { ...ctx, condition: { readiness: 100 }, key: `g:${b.id}`, expected: true }, briefPiece(b, { reading }));
};
/** The same scene with only its genre changed (TEST SETUP: the controlled comparison). */
const as = (b: Brief, genre: string): Brief => ({ ...b, id: `${b.id}~as-${genre}`, kinds: [genre] });
/** What a take reads of a brief, with its words and its register out: ag-baseline's `sigNoReadings`. */
const material = (b: Brief) => JSON.stringify([b.medium, b.size, b.stakes ?? 1, b.readerPlays ?? 'steady', b.language, b.timing, b.physical, b.partner, b.vocal, b.improvisation, Object.entries(tapeReadsOf(b)).sort(), b.beats.map((x) => [...x.tones].sort().join('+'))]);
/** An ability's weight in a register, summed from `CONCERNS` (not the engine). */
const drawOf = (genre: string, ability: string) => (GENRE_REGISTER[genre]?.concerns ?? []).flatMap((c) => Object.values(CONCERNS[c].inputs).flatMap((xs) => xs ?? [])).filter((x) => x.ability === ability).reduce((s, x) => s + x.weight, 0);

const PAIRS = [['biker', 'coming_of_age'], ['childrens', 'science_fantasy'], ['christmas', 'holiday'], ['dystopian', 'medical_drama'], ['espionage', 'neorealism'], ['family', 'steampunk'], ['nordic_noir', 'social_realism']] as const;

describe('the register', () => {
  it('gives every genre one or two concerns, each with why, from research or SLATE’s stated reading of its conventions', () => {
    expect(Object.keys(GENRE_REGISTER).sort()).toEqual(Object.keys(GENRE_DEFS).sort());
    for (const [g, r] of Object.entries(GENRE_REGISTER)) {
      expect(r.concerns.length, g).toBeGreaterThanOrEqual(1);
      expect(r.concerns.length, g).toBeLessThanOrEqual(2);
      expect(new Set(r.concerns).size, g).toBe(r.concerns.length);
      expect(['research', 'reading']).toContain(r.basis);
      expect(r.why.length, g).toBeGreaterThan(20);
    }
    // Every concern is some genre's.
    expect(new Set(Object.values(GENRE_REGISTER).flatMap((r) => r.concerns))).toEqual(new Set(CONCERN_IDS));
  });

  it('names for each concern only the preparation the dimensions it leans on read, and counts as strongly as a reading', () => {
    const tape = TASK_PROFILES.tape!;
    for (const c of CONCERN_IDS) {
      const leaned = (Object.entries(CONCERNS[c].lean) as [Dimension, number][]).filter(([, x]) => x > 1).map(([d]) => d);
      const read = new Set(leaned.flatMap((d) => tape.dims[d]!.prep ?? []));
      for (const part of CONCERNS[c].parts) expect(read.has(part), `${c}: ${part}`).toBe(true);
      expect(concernWords(c)).toContain(CONCERNS[c].label);
    }
    expect(CONCERN_STRENGTH).toEqual({ lean: BRIEF.readingLean, draw: BRIEF.readingDraw });
  });
});

describe('the seven pairs that were the same in every number a take read', () => {
  it('differ now in what a take reads of the brief itself, the register left out, and in their registers', () => {
    for (const [g, h] of PAIRS) {
      const [a, b] = [BRIEF_BY_ID[`brief-${g}`]!, BRIEF_BY_ID[`brief-${h}`]!];
      expect(material(a), `${g} and ${h}`).not.toBe(material(b));
      expect([...registerOf(a)].sort(), `${g} and ${h}`).not.toEqual([...registerOf(b)].sort());
    }
    // Across the whole catalog, no two briefs of different genres read alike.
    const seen = new Map<string, string>();
    for (const b of BRIEFS) {
      const key = JSON.stringify([material(b), [...registerOf(b)].sort()]);
      const was = seen.get(key);
      if (was) expect(BRIEF_BY_ID[was]!.kinds[0], `${was} and ${b.id}`).toBe(b.kinds[0]);
      seen.set(key, b.id);
    }
  });

  it('reward, on the same scene with only the genre changed, the specialists their registers draw on', () => {
    let checked = 0;
    for (const [g, h] of PAIRS) {
      for (const [own, other] of [[g, h], [h, g]] as const) {
        const scene = BRIEF_BY_ID[`brief-${own}`]!;
        for (const a of ABILITIES) {
          const gap = drawOf(own, a) - drawOf(other, a);
          if (Math.abs(gap) < 0.3) continue;
          const mine = take(specialist(a), scene).overall;
          const theirs = take(specialist(a), as(scene, other)).overall;
          if (gap > 0) expect(mine, `${a} on ${own}'s scene, as ${own} and as ${other}`).toBeGreaterThan(theirs);
          else expect(mine, `${a} on ${own}'s scene, as ${own} and as ${other}`).toBeLessThan(theirs);
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThan(30);
  });

  it('crosses over who comes out ahead: the held-in actor in Nordic noir, the live one in social realism', () => {
    const heldIn = actor({ composure: 70, focus: 70, listening: 40, adaptability: 40 });
    const live = actor({ composure: 40, focus: 40, listening: 70, adaptability: 70 });
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const realism = BRIEF_BY_ID['brief-social_realism']!;
    expect(take(heldIn, noir).overall).toBeGreaterThan(take(live, noir).overall);
    expect(take(live, realism, { reading: realism.readings[1]!.id }).overall).toBeGreaterThan(take(heldIn, realism, { reading: realism.readings[1]!.id }).overall);
    // The same scene, only the genre changed: the held-in actor's take falls when Nordic noir's is called social realism.
    expect(take(heldIn, noir).overall).toBeGreaterThan(take(heldIn, as(noir, 'social_realism')).overall);
  });

  it('come to 100 for a mastered actor in every reading and every fitting way of playing, so no genre is harder to master', () => {
    const fitting = (b: Brief) => [{}, ...(Object.keys(AXES) as Axis[]).flatMap((axis) => AXES[axis].values.filter((side) => !misfitOf(axis, side, briefMaterial(b))).map((side) => ({ [axis]: side })))];
    for (const [g, h] of PAIRS) for (const id of [g, h]) {
      const b = BRIEF_BY_ID[`brief-${id}`]!;
      for (const r of b.readings) for (const playing of fitting(b)) {
        const e = take(MASTER, b, { reading: r.id, playing });
        expect(e.overall, `${id} ${r.id} ${JSON.stringify(playing)}`).toBe(100);
        expect(e.mastery).toBe(true);
      }
    }
  });
});

describe('genre proficiency, and no bonus from another genre', () => {
  it('raises a take from none through low, medium and high, complete at 0.9, and nothing past it', () => {
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const p = actor({}, 70, 70);
    const at = [0, 0.3, 0.6, 0.9, 1].map((genre) => take(p, noir, { genre }).overall);
    expect(at[0]).toBeLessThan(at[1]!);
    expect(at[1]).toBeLessThan(at[2]!);
    expect(at[2]).toBeLessThan(at[3]!);
    expect(at[4]).toBe(at[3]);
    expect(take(MASTER, noir, { genre: BRIEF.complete.genre }).overall).toBe(100);
  });

  it('reads only the brief’s own genres known, and only its own genre’s register', () => {
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const knowsOther = { engagement: { byGenre: { social_realism: { familiarity: 100, practice: 100 } } } } as unknown as Person;
    const ctx = (person: Person) => briefContext(person, noir, full(), { reading: noir.readings[0]!.id });
    expect(ctx(knowsOther).prep.genre).toBe(0);
    // TEST SETUP: another genre's register emptied; Nordic noir's take doesn't move.
    const p = actor({ composure: 70, listening: 40 });
    const before = take(p, noir).overall;
    const saved = GENRE_REGISTER.social_realism!;
    (GENRE_REGISTER as Record<string, unknown>).social_realism = { ...saved, concerns: [] };
    try { expect(take(p, noir).overall).toBe(before); } finally { (GENRE_REGISTER as Record<string, unknown>).social_realism = saved; }
  });
});

describe('the take’s note', () => {
  it('names the concern behind the limit while it holds the take back, and stops once it doesn’t', () => {
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const weak = take(actor({ composure: 20 }, 80, 80), noir);
    expect(weak.limits[0]).toMatchObject({ kind: 'ability', what: 'composure' });
    const c = concernBehind(noir, weak);
    expect(c).toBe<Concern>('restraint');
    expect(concernNote('nordic_noir', c!)).toBe('Nordic Noir’s Feeling Held In asks for it');
    // Composure brought up: something else holds it back now, and the note says nothing of restraint.
    const answered = take(actor({ composure: 90 }, 80, 80), noir);
    expect(answered.limits[0]?.what).not.toBe('composure');
    expect(concernBehind(noir, answered)).not.toBe('restraint');
    // An ability the register doesn't ask names no concern.
    expect(concernBehind(noir, take(actor({ memory: 20 }, 80, 80), noir))).toBeUndefined();
  });
});

describe('played: Nordic noir’s brief, taped, reloaded and taped again', () => {
  it('keeps the take’s concern through a reload, and works the take out again from what it kept', () => {
    const NY = 'America/New_York';
    const sim: Simulation = createSave(1, 'genre-identity', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const rest = (s: Simulation) => Object.assign(s.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, morale: 60, hygiene: 80, condition: 90 }); // TEST SETUP
    // TEST SETUP: an actor far along everywhere but composure, and the genre known, as years of work would leave her.
    Object.assign(sim.player.craft!, Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 80])));
    Object.assign(sim.player.attrs!, { presence: 80, composure: 15, listening: 80, imagination: 80, focus: 80, adaptability: 80, discipline: 80 });
    genreState(sim.player, 'nordic_noir').familiarity = 90;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 8, day: 29, hour: 13 }, NY));
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const press = (s: Simulation, kind: string, payload: Record<string, unknown>) => { rest(s); const r = s.execute({ kind, payload }); expect(r.ok, `${kind}: ${r.error}`).toBe(true); };
    press(sim, 'brief.choose', { brief: noir.id, reading: noir.readings[0]!.id });
    for (const step of ['read', 'lines', 'rehearse', 'read', 'lines', 'rehearse']) press(sim, 'brief.prepare', { brief: noir.id, step });
    press(sim, 'practice.self_tape', { genre: 'nordic_noir', brief: noir.id });
    const first = recordOf(sim.player, noir.id).takes.at(-1)!;
    expect(first.concern).toBe('restraint');
    expect(first.chief).toMatch(/^Composure held back/);
    const again = loadSave(deserialise(serialise(sim.universe)) as never);
    const kept = recordOf(again.player, noir.id).takes.at(-1)!;
    expect(kept).toEqual(first);
    // The take worked out again from what it kept is the take: no figure moves on a reload.
    const work = again.player.work!.find((w) => w.inputs.key === first.key)!;
    expect(replay(work, TASK_PROFILES[work.task]!)!.overall).toBe(work.overall);
    // Continuing after the reload: composure worked on to full (TEST SETUP), taped again, and the note no longer names it.
    // What holds it back now is said, with the concern behind it where there is one: restraint draws on focus too.
    again.player.attrs!.composure = 100;
    press(again, 'practice.self_tape', { genre: 'nordic_noir', brief: noir.id });
    const second = recordOf(again.player, noir.id).takes.at(-1)!;
    expect(second.overall).toBeGreaterThan(first.overall);
    expect(second.chief).not.toMatch(/^Composure/);
    expect(recordOf(again.player, noir.id).takes).toHaveLength(2);
  });
});
