/**
 * A genre marked Mastered on the Player Profile (from 2026-10-16, at the owner's word: "Add a mastered badge to the genre
 * row"). Until then a genre's row said nothing of it: mastery showed only as its brief's hundreds and the School
 * Journey's milestone. A genre is mastered once one of its briefs is taped at full mastery (`Evaluation.mastery`: every
 * input the take reads at full, its preparation complete, the day's condition sufficient), kept on the brief's record
 * (`BriefRecord.mastered`) past the eight takes it keeps, read by `genreMastered` and drawn on the genre's row.
 *
 * Played through the commands: the brief chosen, prepared and taped by `brief.choose`, `brief.prepare` and
 * `practice.self_tape`, the Player Profile drawn as the player has it. TEST SETUP, as tests/workbook.test.ts does, said
 * where it's done: every ability full and every technique mastered (reaching it by play takes years, measured by
 * `tools/mastery.ts`), the genre known, and the clock's own commitments cleared and the day kept rested.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { briefsOf } from '@/engine/content/briefs';
import { MASTERED } from '@/engine/content/abilities';
import { forecast, genreMastered, prepareRefusal, recordOf, BRIEF } from '@/engine/systems/briefs';
import { evenCraft } from '@/engine/systems/school';
import { abilityFull } from '@/engine/systems/attributes';
import { MS_DAY } from '@/engine/core/time';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

// Without the original: it imports the looks, which import it back.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
// A screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');

// Absurdist's first brief. Absurdist and Action are the first two of the 149 in the list's order, so both rows are on its
// first page.
const ABSURDIST = briefsOf('absurdist')[0]!;

function student(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  rest(sim);
  return sim;
}
/** TEST SETUP: the clock's own commitments cleared and the day kept rested, so the take's condition is sufficient. */
function rest(sim: Simulation) {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
}
const go = <T = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute<T>({ kind, payload }); };
/** TEST SETUP: every ability full and every technique mastered, and the brief's genre known. */
function atFull(sim: Simulation, genre: string) {
  const p = sim.player;
  p.craft = evenCraft(MASTERED);
  for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = 100;
  p.attrs = { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 };
  p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
  (p.engagement ??= { byGenre: {} } as never).byGenre[genre] = { familiarity: 100, practice: 100 } as never;
}
/**
 * The brief chosen in its first reading and prepared through the commands until no step has anything more to give: a
 * few of each step a day, since the same step again the same day gives half as much, a day at a time. Stamina fades in
 * days without a workout, so the TEST SETUP holds it at full again before the take.
 */
function prepared(sim: Simulation, b = ABSURDIST) {
  expect(go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id }).ok).toBe(true);
  const steps = ['read', 'lines', 'rehearse'] as const;
  for (let day = 0; day < 30 && steps.some((step) => !prepareRefusal(sim, sim.player, b, step)); day += 1) {
    for (const step of steps) for (let n = 0; n < 3 && !prepareRefusal(sim, sim.player, b, step); n += 1) expect(go(sim, 'brief.prepare', { brief: b.id, step }).ok, step).toBe(true);
    sim.advanceTo(sim.now + MS_DAY);
    rest(sim);
  }
  for (const step of steps) expect(prepareRefusal(sim, sim.player, b, step), step).toBe('You’ve done all this step can do.');
  sim.player.wellbeing.fitness = abilityFull(sim, sim.player, 'stamina');
}
const tape = (sim: Simulation, b = ABSURDIST) => go<{ overall: number }>(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** The words of a genre's first cell on the Player Profile, as the page draws it, and whether its chip is there. */
function rowOf(sim: Simulation, label: string): { text: string; chip: string | undefined } {
  h.sim = sim;
  const html = renderToStaticMarkup(createElement(ProfileWorkspace)).replace(/<!-- -->/g, '');
  const cell = [...html.matchAll(/<tr><td class="nowrap">(.*?)<\/td>/g)].map((m) => m[1]!).find((c) => c.replace(/<[^>]+>/g, '').startsWith(label));
  expect(cell, `${label}'s row on the Player Profile`).toBeDefined();
  return { text: cell!.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), chip: /<span class="chip chip-positive" title="([^"]*)">Mastered<\/span>/.exec(cell!)?.[1] };
}

describe('a genre marked Mastered, on the Player Profile', () => {
  it('PLAYER JOURNEY: a student at full mastery chooses Absurdist’s brief, prepares it through the commands and tapes it: the take is at full mastery, the brief is marked mastered at the take, and Absurdist’s row says Mastered, its title naming the brief and the day, where Action’s says nothing; across a save and a load, and taped at full mastery again, still from the first', () => {
    const sim = student('genre-mastered');
    atFull(sim, 'absurdist');
    expect(rowOf(sim, 'Absurdist')).toEqual({ text: 'Absurdist', chip: undefined });
    prepared(sim);
    expect(forecast(sim, sim.player, ABSURDIST).mastery).toBe(true);
    const r = tape(sim);
    expect(r.ok).toBe(true);
    expect(r.value!.overall).toBe(100);
    const rec = recordOf(sim.player, ABSURDIST.id);
    const take = rec.takes.at(-1)!;
    // The work record keeps the take's judgment, and it's at full mastery.
    expect(sim.player.work!.find((w) => w.at === take.at)!.mastery).toBe(true);
    expect(rec.mastered).toBe(take.at);
    expect(genreMastered(sim.player, 'absurdist')).toEqual({ at: take.at, brief: ABSURDIST });
    expect(genreMastered(sim.player, 'action')).toBeUndefined();
    const day = new Intl.DateTimeFormat('en-US', { timeZone: sim.zone, month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(take.at));
    expect(rowOf(sim, 'Absurdist')).toEqual({ text: 'Absurdist Mastered', chip: `${ABSURDIST.title} taped at full mastery on ${day}` });
    expect(rowOf(sim, 'Action')).toEqual({ text: 'Action', chip: undefined });
    const back = reload(sim);
    expect(back.player.briefs![ABSURDIST.id]!.mastered).toBe(take.at);
    expect(rowOf(back, 'Absurdist').chip).toBe(`${ABSURDIST.title} taped at full mastery on ${day}`);
    // Taped at full mastery again, it's mastered from the first take still.
    expect(tape(back).ok).toBe(true);
    const again = back.player.briefs![ABSURDIST.id]!.takes.at(-1)!;
    expect(again.at).toBeGreaterThan(take.at);
    expect(back.player.work!.find((w) => w.at === again.at)!.mastery).toBe(true);
    expect(back.player.briefs![ABSURDIST.id]!.mastered).toBe(take.at);
  });

  it('a take short of mastery marks nothing: with focus at 90 the same prepared brief tapes under full mastery, the brief isn’t marked, and the row says nothing', () => {
    const sim = student('genre-mastered-short');
    atFull(sim, 'absurdist');
    sim.player.attrs!.focus = 90;
    prepared(sim);
    expect(tape(sim).ok).toBe(true);
    const rec = recordOf(sim.player, ABSURDIST.id);
    expect(sim.player.work!.find((w) => w.at === rec.takes.at(-1)!.at)!.mastery).toBe(false);
    expect(rec.mastered).toBeUndefined();
    expect(genreMastered(sim.player, 'absurdist')).toBeUndefined();
    expect(rowOf(sim, 'Absurdist')).toEqual({ text: 'Absurdist', chip: undefined });
  });

  it('mastery stays past the takes kept: after the take at full mastery, nine more short of it, the first gone from the eight the brief keeps, and the genre still mastered from the first take’s instant; Loved beside it when the genre is loved', () => {
    const sim = student('genre-mastered-kept');
    atFull(sim, 'absurdist');
    prepared(sim);
    expect(tape(sim).ok).toBe(true);
    const first = recordOf(sim.player, ABSURDIST.id).takes.at(-1)!.at;
    sim.player.attrs!.focus = 90;
    for (let n = 0; n < BRIEF.takesKept + 1; n += 1) expect(tape(sim).ok).toBe(true);
    const rec = recordOf(sim.player, ABSURDIST.id);
    expect(rec.takes).toHaveLength(BRIEF.takesKept);
    expect(rec.takes.some((t) => t.at === first)).toBe(false);
    expect(rec.mastered).toBe(first);
    expect(genreMastered(sim.player, 'absurdist')!.at).toBe(first);
    sim.player.genres = ['absurdist'];
    expect(rowOf(sim, 'Absurdist').text).toBe('Absurdist, Loved Mastered');
  });

  it('PLAYER JOURNEY: a save an older build wrote, its Absurdist brief taped at full mastery and nothing marked, is opened: marked from the work record at that take, once, and its row says Mastered; a second opening changes nothing; a save whose record no longer holds that take, only a later one short of mastery, stays unmarked', () => {
    const sim = student('genre-mastered-older');
    atFull(sim, 'absurdist');
    prepared(sim);
    expect(tape(sim).ok).toBe(true);
    const at = recordOf(sim.player, ABSURDIST.id).mastered!;
    expect(at).toBeDefined();
    // And a take after it short of mastery, which the record keeps too and which marks nothing.
    sim.player.attrs!.focus = 90;
    expect(tape(sim).ok).toBe(true);
    // FIXTURE: the save as the build before 2026-10-16 wrote it, with no brief marked and no step named.
    type Older = { opened?: string[]; playerId: string; people: Record<string, { briefs: Record<string, { mastered?: number }>; work: { at: number; inputs: { key: string } }[] }> };
    const older = JSON.parse(serialise(sim.universe)) as Older;
    delete older.people[older.playerId]!.briefs[ABSURDIST.id]!.mastered;
    // That build had neither step: from 2026-10-17 the later one, `writtenUnplayed`, is taken off too, and from 2026-10-20
    // `pro.begun` (brief 19's professional record).
    older.opened = older.opened!.filter((x) => x !== 'briefsMastered' && x !== 'writtenUnplayed' && x !== 'pro.begun');
    expect(older.opened).toEqual(['followTheCover', 'findTermInterest', 'cutIntoUnits', 'cardYears', 'timeTheCalls']);
    const opened = loadSave(deserialise(JSON.stringify(older)) as never);
    expect(opened.universe.opened).toContain('briefsMastered');
    expect(opened.player.briefs![ABSURDIST.id]!.mastered).toBe(at);
    expect(rowOf(opened, 'Absurdist').text).toBe('Absurdist Mastered');
    const again = reload(opened);
    expect(again.player.briefs![ABSURDIST.id]!.mastered).toBe(at);
    // The take gone from the work record before the save was opened: nothing to find it by, so nothing is marked.
    const lost = JSON.parse(JSON.stringify(older)) as Older;
    const person = lost.people[lost.playerId]!;
    person.work = person.work.filter((w) => w.at !== at);
    expect(person.work.filter((w) => w.inputs.key.startsWith(`brief:${lost.playerId}:${ABSURDIST.id}:`))).toHaveLength(1);
    const unmarked = loadSave(deserialise(JSON.stringify(lost)) as never);
    expect(unmarked.player.briefs![ABSURDIST.id]!.mastered).toBeUndefined();
    expect(rowOf(unmarked, 'Absurdist').text).toBe('Absurdist');
  });

  it('a genre with both its briefs taped at full mastery is mastered from the first of them: Absurdist’s second brief taped at full mastery a day later leaves the row naming the first, by its title and its day', () => {
    const sim = student('genre-mastered-both');
    atFull(sim, 'absurdist');
    const [one, two] = briefsOf('absurdist');
    prepared(sim, one);
    expect(tape(sim, one).ok).toBe(true);
    const first = recordOf(sim.player, one!.id).mastered!;
    prepared(sim, two);
    expect(tape(sim, two).ok).toBe(true);
    const second = recordOf(sim.player, two!.id).mastered!;
    expect(second).toBeGreaterThan(first);
    expect(genreMastered(sim.player, 'absurdist')).toEqual({ at: first, brief: one });
    expect(rowOf(sim, 'Absurdist').chip).toMatch(new RegExp(`^${one!.title} taped at full mastery on `));
  });
});
