/**
 * The third round of 2026-10-13: declared words nothing reached, taken out, each with a test that failed before it went.
 *
 * - The refusals for being away from New Haven (defect 71): Make Amends’ “… is in New Haven.”, Help Now’s “They’re in
 *   New Haven.”, a step’s “The studios are in New Haven.” and “The Haas Arts Library is in New Haven.”, Catch Up’s
 *   “Orientation is in New Haven.”, the Social Security number’s “The Social Security office is in New Haven, at 150
 *   Court Street.” and Read It’s “A copy is at the Haas Arts Library, in New Haven.”. A life is enrolled only where it
 *   begins in New Haven (`populateWorld`), and nothing has moved a person since the scope reset of 2026-10-09, so no play
 *   reached any of them; each was read only by a test that moved the student to New York by hand, and the guide listed
 *   each as a refusal a player could meet. No state a player reaches can show a refusal’s absence, so these read the
 *   functions that refused and the guide the player reads: before, each function read `currentLocationId` and the guide
 *   quoted each sentence.
 * - `recordWages`’ `sag` and `residual` (loose end L3), set by no caller since the career went on 2026-10-09: the year’s
 *   and the quarter’s SAG-AFTRA wages and the wages by production they wrote stayed at nothing, and nothing read them. A
 *   played summer’s stipends now leave no such field; before, each year and quarter carried a `sag` of 0.
 * - `workContext`’s genre lookup for work with no scene (loose end L6): every scene has a profile, so work with a scene
 *   never reaches that branch, and the lookup came back empty every time. A played first fall’s work with no scene now
 *   carries no families; before, it carried an empty list.
 * - `playReads`’ kinds’ demands for a play with no profile (loose end L10): the only such play is a new piece, which has
 *   no kinds, so the demands added nothing. Its reads are the piece’s own; before, the function called `withDemands`.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven from Monday 24
 * August 2026, born in New York; every act a command its screen sends, everything after it the clock.
 *
 * TEST SETUP, said again where it’s done: the body kept fed, rested and awake as the clock moves (`tended`); good standing
 * before joining the Summer Cabaret, which a passive spring doesn’t keep.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { GUIDE } from '@/engine/content/guide';
import { NEW_PLAYS_READ } from '@/engine/content/plays';
import { amendsRefusal, respondRefusal } from '@/engine/systems/classmates';
import { courseworkOf, orientationRefusal, workContext } from '@/engine/systems/coursework';
import { ssnRefusal } from '@/engine/systems/taxid';
import { copyAt } from '@/engine/systems/playreading';
import { earningsOf, yearOf } from '@/engine/systems/earnings';
import { playReads } from '@/engine/systems/school';
import { LEARNING } from '@/engine/systems/learning';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour, minute: 0 }, NY);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player keeps it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
/** A function’s body as written in its file, from its signature to the closing brace at the line’s start. */
const bodyOf = (path: string, name: string) => {
  const text = source(path);
  const from = text.indexOf(`function ${name}(`);
  expect(from, name).toBeGreaterThan(-1);
  return text.slice(from, text.indexOf('\n}\n', from));
};

describe('the refusals for being away from New Haven (defect 71)', () => {
  const WORDS = [
    'is in New Haven.”', 'They’re in New Haven.', 'The studios are in New Haven.', 'The Haas Arts Library is in New Haven.',
    'Orientation is in New Haven.', 'The Social Security office is in New Haven, at 150 Court Street.', 'A copy is at the Haas Arts Library, in New Haven.',
  ];

  it('the guide names none of them, and asks no one to be in New Haven for Make Amends, Help Now, a studio or the library, Catch Up, the number or Read It', () => {
    for (const entry of GUIDE) {
      const said = JSON.stringify(entry);
      for (const w of WORDS) expect(said.includes(w), `${entry.id}: ${w}`).toBe(false);
    }
    const all = JSON.stringify(GUIDE);
    for (const need of [
      'For Make Amends: something between you to put right, New Haven',
      'Help Now: New Haven',
      'A studio or the library also needs New Haven',
      'For Catch Up: in New Haven',
      'in New Haven and out of hospital, with',
      'At school and in New Haven, with orientation’s tour',
    ]) expect(all.includes(need), need).toBe(false);
  });

  it('none of the functions that refused reads where the student is', () => {
    for (const refusal of [amendsRefusal, respondRefusal, orientationRefusal, ssnRefusal, copyAt]) expect(String(refusal), refusal.name).not.toContain('currentLocationId');
    expect(bodyOf('engine/systems/coursework.ts', 'needRefusal')).not.toContain('currentLocationId');
  });

  it('PLAYER JOURNEY: a played first fall is in New Haven still, where every life at the School begins and nothing moves it', () => {
    const sim = student('d3-town');
    tended(sim, at(2026, 10, 5, 12));
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
  }, 60_000);
});

describe('recordWages’ SAG-AFTRA mark (loose end L3)', () => {
  it('PLAYER JOURNEY: a summer’s stipends, paid by the clock, leave the year and its quarters no SAG-AFTRA wages, which nothing read', () => {
    const sim = student('d3-sag');
    tended(sim, at(2027, 3, 20, 12));
    // TEST SETUP: good standing before joining, which the company asks and a passive spring doesn’t keep.
    sim.player.school!.standing = 'good';
    expect(sim.execute({ kind: 'school.summer_cabaret', payload: {} }).ok).toBe(true);
    tended(sim, at(2027, 7, 3, 12));
    // June’s four Fridays at $375 and July’s first.
    const year = yearOf(sim.player, 2027);
    expect(year.acting).toBe(5 * 375_00);
    expect(Object.keys(year)).not.toContain('sag');
    expect(Object.keys(year)).not.toContain('sagByProject');
    const quarters = earningsOf(sim.player).quarters;
    expect(quarters['2027-2']).toEqual({ wages: 4 * 375_00, byState: { 'us-ct': 4 * 375_00 } });
    expect(quarters['2027-3']).toEqual({ wages: 375_00, byState: { 'us-ct': 375_00 } });
  }, 60_000);
});

describe('workContext’s genres for work with no scene (loose end L6)', () => {
  it('PLAYER JOURNEY: a first fall’s work with no scene carries no genre families, its lean only what its objective puts first', () => {
    const sim = student('d3-families');
    tended(sim, at(2026, 9, 8, 12));
    // Voice Sequence, Speech Drill, Movement Score and the rest: set by their courses, none with a scene or a way of playing.
    const own = courseworkOf(sim, sim.player)!.assignments.filter((a) => !a.sceneId && !a.playing);
    expect(own.length).toBeGreaterThan(0);
    for (const a of own) {
      const ctx = workContext(a, {}, {});
      expect('families' in ctx, a.template).toBe(false);
      // Each dimension even, or weighed more where it reads the part the objective puts first.
      for (const x of Object.values(ctx.lean ?? {})) expect([1, LEARNING.objectiveWeight], a.template).toContain(x);
    }
  }, 60_000);
});

describe('playReads’ kinds for a play with no profile (loose end L10)', () => {
  it('a new piece, the one play with no profile, reads its own reads, and the function asks no genre for demands', () => {
    const piece = { parts: [], reads: NEW_PLAYS_READ };
    expect(playReads(piece)).toEqual(NEW_PLAYS_READ);
    expect(playReads(piece)).not.toBe(NEW_PLAYS_READ);
    expect(String(playReads)).not.toContain('withDemands');
  });
});
