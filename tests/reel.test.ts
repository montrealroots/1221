/**
 * Footage and the reel (`systems/footage.ts`, from 2026-10-08): what's
 * filmed of the actor's work, whether it can be used and why not, the reel
 * cut from what's chosen and as good as what's on it, and the one place it's
 * read, a paid submission's reach.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { WORK_COSTS } from '@/engine/content/career';
import { REFERRAL, careerOf, footageFor, submissionReach, weekOfAuditions } from '@/engine/systems/career';
import { AGENCIES } from '@/engine/content/career';
import { BONDS } from '@/engine/systems/school';
import { REEL_CALLBACK, footageRefusal, reelBand } from '@/engine/systems/footage';
import type { Assignment, Band } from '@/engine/systems/coursework';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const when = instantFromZoned({ year: 2029, month: 5, day: 1, hour: 12 }, 'America/New_York');
/** A self-tape shown in class, as the course's showing leaves it. */
function tape(sim: Simulation, id: string, course: string, band: Band): void {
  const school = sim.player.school as unknown as { coursework?: { assignments: Partial<Assignment>[]; used: string[]; orientation: { done: object } } };
  school.coursework ??= { assignments: [], used: [], orientation: { done: {} } };
  school.coursework.assignments.push({ id, course, template: 'self-tape', status: 'done', shown: { band, score: 0, at: when, parts: { prep: 0, craft: 0, ready: 0 }, strengths: [] } });
}

describe('footage', () => {
  it('is read from the record: class self-tapes there while you have a phone, the film monologue from the degree, as good as its course went', () => {
    const sim = life('rl-footage');
    expect(footageFor(sim.player)).toEqual([]);
    tape(sim, 'a1', 'DRAM 463a/b', 'strong');
    tape(sim, 'a2', 'DRAM 473b', 'exceptional');
    const withPhone = footageFor(sim.player);
    const hasPhone = withPhone.find((f) => f.id === 'tape:a1')!.available;
    // The phone is the life's own: whatever it has, the footage's availability follows it.
    if (!hasPhone) expect(withPhone.find((f) => f.id === 'tape:a1')!.why).toBe('It was recorded on your phone, and you have no phone now.');
    sim.player.school!.filmed = true;
    const film = footageFor(sim.player).find((f) => f.id === 'film-monologue')!;
    expect(film).toMatchObject({ kind: 'film-monologue', band: 'exceptional', available: true });
    // Unready footage isn't for casting.
    tape(sim, 'a3', 'DRAM 463a/b', 'unready');
    expect(footageRefusal(footageFor(sim.player).find((f) => f.id === 'tape:a3'))).toMatch(/unready/);
  });

  it('a reel is as good as what’s on it: weak work pulls strong down, and the choice is kept', () => {
    expect(reelBand(['exceptional'])).toBe('exceptional');
    expect(reelBand(['exceptional', 'working'])).toBe('strong');
    expect(reelBand(['strong', 'working', 'working'])).toBe('working');
    let sim = life('rl-cut');
    sim.player.school!.filmed = true;
    tape(sim, 'a2', 'DRAM 473b', 'exceptional');
    // No phone needed for the school's own film; cut from it alone, then from it and a working tape.
    const alone = sim.must<{ band: Band }>({ kind: 'career.reel', payload: { footage: ['film-monologue'] } });
    expect(alone.band).toBe('exceptional');
    sim = reload(sim);
    expect(careerOf(sim.player).reelCut).toMatchObject({ ids: ['film-monologue'], band: 'exceptional' });
    expect(sim.execute({ kind: 'career.reel', payload: { footage: ['nothing'] } }).error).toBe('There’s no such footage.');
    expect(sim.execute({ kind: 'career.reel', payload: { footage: ['a', 'b', 'c', 'd', 'e'] } }).error).toBe('A reel is short: four pieces at most.');
    expect(sim.universe.transactions.filter((t) => t.memo === 'A reel, edited')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('is read in one place, a paid submission’s reach: none, a reel from before footage was read, and a strong one', () => {
    const sim = life('rl-reach');
    const career = careerOf(sim.player);
    expect(submissionReach(career, false)).toBe(WORK_COSTS.freeSubmissionShare);
    expect(submissionReach(career, true)).toBe(1 - WORK_COSTS.wantReel);
    career.reelAt = when;
    expect(submissionReach(career, true)).toBe(1);
    career.reelCut = { at: when, ids: ['film-monologue'], band: 'strong' };
    expect(submissionReach(career, true)).toBe(REEL_CALLBACK.strong);
    expect(REEL_CALLBACK.exceptional).toBeGreaterThan(REEL_CALLBACK.strong);
  });

  it('refuses a reel with no footage, saying what footage is', () => {
    const sim = life('rl-none');
    expect(sim.execute({ kind: 'career.reel', payload: {} }).error).toBe('A reel is cut from footage, and you have none: a screen credit, a self-tape from class, or the school’s film monologue.');
  });
});

describe('a classmate who passes a part along', () => {
  it('is a close friend from school who’s signed, now and then; nobody who isn’t close does', () => {
    const sim = life('rl-referral');
    const career = careerOf(sim.player);
    career.since = when;
    const mate = sim.player.school!.classmates[0]!;
    mate.career = { agencyId: AGENCIES[0]!.id, credits: [] };
    const weeks = Array.from({ length: 300 }, (_, i) => when + i * 7 * 86_400_000);
    const count = () => weeks.reduce((n, w) => n + weekOfAuditions(sim, sim.player, w, undefined, 'us-ny-newyork', 0).filter((a) => a.referredBy).length, 0);
    mate.bond = BONDS.close - 1;
    expect(count()).toBe(0);
    mate.bond = BONDS.close;
    const got = count();
    expect(got).toBeGreaterThan(0);
    expect(got).toBeLessThan(300 * REFERRAL.chance * 3);
    const one = weeks.flatMap((w) => weekOfAuditions(sim, sim.player, w, undefined, 'us-ny-newyork', 0)).find((a) => a.referredBy)!;
    expect(one).toMatchObject({ referredBy: mate.name, mode: 'tape' });
  });
});
