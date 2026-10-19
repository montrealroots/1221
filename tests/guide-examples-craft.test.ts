/**
 * The craft guide’s worked examples, played (from 2026-10-12; `src/engine/content/guide/craft.ts`).
 *
 * The connected-journey map (docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md §5) said every worked example runs
 * on a throwaway save that is never handed to an adapter, and that its figures are checked. Each of the craft guide’s
 * nine is played here on a save made for it (`createSave`), through the commands its steps name, and what the engine
 * then holds is written as the entry’s own text writes it and looked for in that text (`GUIDE_BY_ID`), so the words
 * and the engine can’t drift apart unnoticed. The last test plays them all beside a live save and finds it as it was.
 *
 * TEST SETUP marks what the commands can’t reach:
 * - a rested hour at a focus of 1, which the examples ask for, is readiness 80 at an hour no trait reads (`focusAt`):
 *   the dials are set to a rested day’s and energy to reach 80, before each step;
 * - a day kept clear: what the calendar would have wanted of the player (orientation, then classes) is canceled, as
 *   the examples’ “free for the hour” has it;
 * - an actor’s abilities and techniques at the levels an example states, at the moment it states them: the days of
 *   study and preparation between grow imagination and memory a little and let stamina fall without a workout;
 * - a classmate’s listening and focus, the breakdown at exactly 80% and a reader fully prepared, figures no step
 *   lands on.
 *
 * An example that says “with no draw” is read from the take’s record judged again from its own inputs with no draw
 * (`expected`, as the take’s own `expected` is); the take as played has its draw, and its band is what earns a callback.
 * An example read that way is checked for saying so, and what its steps open on screen is checked as played.
 *
 * Not run:
 * - The Player Profile’s P, and closing a look: a key and a dialog, the screen’s own. The look opened and the
 *   Techniques row read are run, as rendered. The example says the clock doesn’t move, and that’s what’s checked:
 *   opening an ability’s look on a life with no change to it yet writes an empty development ledger to the save
 *   (`recentOf` calls `developmentOf`), measured on 2026-10-12, so the save isn’t the same to the byte.
 *
 * Played on 2026-10-12, two figures were wrong against the engine, and their text was corrected in `craft.ts`: the
 * practice hour at 85 said 0.10 where its toast says +0.11, and A Reading And A Way To Play It came to 66.3 for an
 * actor at 60 in stamina, where its figures were for stamina at 60% of a first-year’s full (99.4).
 *
 * The verifier of that play found more the same day. A Piece Of Work, Explained was read with no draw and didn’t say
 * so: its look showed 65.9 where it said 66.5, and only the draw-free total and Tiring were checked against the look.
 * Practice’s repeat, pressed straight after a rested hour, came at a focus of 0.949 and gave 0.0794, where the guide
 * worked out 0.0840; both printed 0.08. The example now has every hour rested, and the guide works the repeat out as
 * `develop` does. And the examples’ own inputs (the levels, discipline, readiness, a classmate’s listening and focus,
 * the breakdown before a change, the beats and their turns, the pieces judged and the choices a habit still wanted) were
 * played here and never looked for in the text; the tier at 85 was looked for as `matchedTier(85)` gave it, the rule beside itself, and is
 * now the tier the engine’s hour was played at.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { serialise } from '@/engine/persistence/adapter';
import { plural } from '@/engine/core/text';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { CHAPTERS } from '@/engine/content/tutorial';
import { ABILITY_DEFS, DEVELOPMENT, MASTERED, TECHNIQUE_LABEL, type AbilityId } from '@/engine/content/abilities';
import { TIER, exerciseFor } from '@/engine/content/practice';
import { BRIEFS, BRIEF_BY_ID } from '@/engine/content/briefs';
import { APPROACH_EFFECT, AXES } from '@/engine/content/approaches';
import { EVALUATION, TASK_PROFILES } from '@/engine/content/tasks';
import { abilityFull, attributesOf, levelOf } from '@/engine/systems/attributes';
import { focusAt, mateAbilities } from '@/engine/systems/school';
import { readiness } from '@/engine/systems/life';
import { BAND_LABEL, reliabilityOf } from '@/engine/systems/coursework';
import { BRIEF, briefMaterial, forecast, genreKnown, partWords, prepSpeed, preview, recordOf, takeTogether } from '@/engine/systems/briefs';
import { misfitOf } from '@/engine/systems/material';
import { bandOfQuality, chiefLimit, frozenPerformer, replay, type Evaluation, type WorkRecord } from '@/engine/systems/evaluation';
import { judgePiece } from '@/engine/systems/piece';
import { workPiece } from '@/engine/systems/workpieces';
import { problemsOf } from '@/engine/systems/workbook';
import { matchedTier } from '@/engine/systems/practice';
import { ARTISTRY, identityOf } from '@/engine/systems/artistry';
import { isOpen } from '@/engine/world/tutorial';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';

// The Profile is rendered as the player has it: the game it reads is the save being played.
const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');

// --- the entry’s own words, and figures written as it writes them ----------------------------------------------------

/** An example’s whole text: its setup, its steps and its result, as the guide renders them. */
const example = (id: string): { setup: string; steps: readonly string[]; result: string; all: string } => {
  const e = GUIDE_BY_ID[id]!.example;
  return { ...e, all: [e.setup, ...e.steps, e.result].join(' ') };
};
const one = (x: number): string => x.toFixed(1);
const two = (x: number): string => x.toFixed(2);
const pct = (x: number): string => `${Math.round(x * 100)}%`;
const andList = (xs: readonly string[]): string => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const duration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const m = minutes % 60;
  return hours ? `${plural(hours, 'hour')}${m ? ` and ${plural(m, 'minute')}` : ''}` : plural(m, 'minute');
};
const band = (q: number): string => BAND_LABEL[bandOfQuality(q)];
const label = (id: AbilityId): string => ABILITY_DEFS.find((d) => d.id === id)!.label;
const text = (node: ReactNode): string => renderToStaticMarkup(createElement('div', null, node)).replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/\s+/g, ' ');

// --- a throwaway life, played ----------------------------------------------------------------------------------------

const DRAMA = BRIEF_BY_ID['brief-drama']!;
const [READING_ONE, READING_TWO] = [DRAMA.readings[0]!, DRAMA.readings[1]!];
const DRAMA_PIECE = `brief:${DRAMA.id}`;
const STRONG = EVALUATION.bands.strong;

/** A first-year in New York, early in the fall: a save of its own, never handed to an adapter. */
function life(seed: string, over: Partial<NewSaveConfig> = {}): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...over });
  clear(sim);
  return sim;
}
/** TEST SETUP: the day kept clear, as an example’s “free for the hour” has it. */
function clear(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: a rested hour at a focus of 1, readiness 80 (`focusOf`), the day clear. */
function rested(sim: Simulation): void {
  clear(sim);
  const p = sim.player;
  Object.assign(p.wellbeing, { stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60, condition: 90 });
  let [lo, hi] = [0, 100];
  for (let i = 0; i < 60; i += 1) { const mid = (lo + hi) / 2; p.wellbeing.energy = mid; if (readiness(p) < 80) lo = mid; else hi = mid; }
  p.wellbeing.energy = hi;
}
/** A command, pressed rested: refused, it fails the test with its reason. */
function press<T = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown>, rest = true): T {
  if (rest) rested(sim);
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
const nextDay = (sim: Simulation): void => { sim.advanceTo(sim.now + 24 * 3_600_000); };
/** TEST SETUP: every ability and technique at a level, stamina at it, or at a share of its full where `share`. */
function atLevel(sim: Simulation, level: number, over: Partial<Record<AbilityId, number>> = {}, share = false): void {
  const p = sim.player;
  for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = level;
  Object.assign(p.attrs!, { presence: level, composure: level, listening: level, imagination: level, focus: level, adaptability: level, discipline: level });
  p.wellbeing.fitness = share ? (level / 100) * abilityFull(sim, p, 'stamina') : level;
  const held: Partial<Record<AbilityId, keyof NonNullable<typeof p.craft>>> = { emotionalDepth: 'emotion', memory: 'memorization', vocal: 'voice', physical: 'movement' };
  for (const [a, v] of Object.entries(over) as [AbilityId, number][]) {
    if (held[a]) p.craft![held[a]!] = v;
    else (p.attrs as unknown as Record<string, number>)[a] = v;
  }
}
/** A piece of work judged again from its own inputs, with no draw (`replay`, with `expected`). */
function undrawn(w: WorkRecord): Evaluation {
  const i = w.inputs;
  return judgePiece(i.seed!, frozenPerformer(i), {
    task: TASK_PROFILES[w.task]!, techniques: i.techniques, prep: i.prep, required: i.required, difficulty: i.difficulty, condition: i.condition, families: i.families, key: i.key,
    ...(i.lean ? { lean: i.lean } : {}), ...(i.inputs ? { inputs: i.inputs } : {}), ...(i.extraPrep ? { extraPrep: i.extraPrep } : {}), ...(i.fit ? { fit: i.fit } : {}), expected: true,
  }, i.piece!);
}
/** The one level a piece of work read every ability and technique at, from its record: it fails the test where they differ. */
function judgedAt(w: WorkRecord): number {
  const levels = new Set([...Object.values(w.inputs.abilities), ...Object.values(w.inputs.levels ?? {})]);
  expect([...levels]).toHaveLength(1);
  return [...levels][0]!;
}
/** Studied once a day until the drama’s brief counts knowing it complete: the days it took. */
function knowTheGenre(sim: Simulation): number {
  let days = 0;
  while (genreKnown(sim.player, DRAMA) < BRIEF.complete.genre && days < 30) { press(sim, 'genre.study', { genre: DRAMA.kinds[0] }); nextDay(sim); days += 1; }
  return days;
}
/** Preparing A Brief’s two days: each step once a day, rested. What each day left, the second day’s speed, and the minutes. */
function twoDays(sim: Simulation) {
  const after: { interpretation: number; memorization: number; rehearsal: number }[] = [];
  let minutes = 0;
  let speed = 0;
  for (let day = 0; day < 2; day += 1) {
    if (day === 1) { nextDay(sim); speed = prepSpeed(sim.player, DRAMA); }
    for (const step of ['read', 'lines', 'rehearse']) minutes += press<{ minutes: number }>(sim, 'brief.prepare', { brief: DRAMA.id, step }).minutes;
    after.push({ ...recordOf(sim.player, DRAMA.id).prep });
  }
  return { after, speed, minutes };
}
/** The drama’s brief, its genre known, read the first way and prepared over the two days. */
function preparedDrama(seed: string, before?: (sim: Simulation) => void): Simulation {
  const sim = life(seed);
  knowTheGenre(sim);
  press(sim, 'brief.choose', { brief: DRAMA.id, reading: READING_ONE.id });
  before?.(sim);
  twoDays(sim);
  return sim;
}
/** The classmate who’ll read: the most reliable, with listening and focus at 70 (TEST SETUP). */
function aReader(sim: Simulation): number {
  const mates = sim.player.school!.classmates.map((_, i) => i);
  const i = mates.sort((a, b) => reliabilityOf(sim, sim.player, b) - reliabilityOf(sim, sim.player, a))[0]!;
  Object.assign(mateAbilities(sim, sim.player, i), { listening: 70, focus: 70 });
  return i;
}
/** The take with its reader now, with no draw: what Work It Through reads (`workpieces.ts`). */
function togetherNow(sim: Simulation) {
  const own = forecast(sim, sim.player, DRAMA);
  const t = takeTogether(sim, sim.player, DRAMA, recordOf(sim.player, DRAMA.id), own)!;
  return { own: own.overall, together: t.overall, slip: t.slip, timing: t.parts.timing };
}

// --- the plays, one an example -----------------------------------------------------------------------------------------

const PLAYS = {
  profile() {
    const sim = life('guide-craft-profile', { tutorial: true });
    for (const c of CHAPTERS) { press(sim, 'tutorial.read', { chapterId: c.id }, false); if (c.id === 'profile') break; }
    const opened = isOpen(sim, 'ui.profile');
    const t0 = sim.now;
    // In Attributes And Craft, the ability’s name opens its look.
    const look = resolveLook(sim, { kind: 'ability', id: 'emotionalDepth' }) as Looked;
    const lookText = text(look.body);
    // The Techniques table, as the Profile draws it.
    h.sim = sim;
    const screen = renderToStaticMarkup(createElement(ProfileWorkspace));
    const techniques = screen.slice(screen.indexOf(`techniques, each mastered at ${MASTERED}`));
    const row = new RegExp(`<tr>(?:(?!</tr>).)*?${TECHNIQUE_LABEL.scene}(?:(?!</tr>).)*</tr>`).exec(techniques)?.[0] ?? '';
    return { opened, look, lookText, sceneRow: row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), scene: sim.player.craft!.scene, moved: sim.now - t0 };
  },
  practice() {
    const hour = (level: number, tier?: 0 | 1 | 2, twice = false) => {
      const sim = life('guide-craft-practice');
      sim.player.craft!.emotion = level; // TEST SETUP: Emotional Depth at the example’s level,
      sim.player.attrs!.discipline = 50; // and discipline at 50.
      rested(sim);
      const from = levelOf(sim, sim.player, 'emotionalDepth');
      const discipline = levelOf(sim, sim.player, 'discipline');
      const marked = matchedTier(from);
      const focus = focusAt(sim, sim.player, sim.now);
      const first = press<{ gained: number; level: number; tier: 0 | 1 | 2 }>(sim, 'practice.exercise', { exercise: exerciseFor('emotionalDepth')!.id, ...(tier !== undefined ? { tier } : {}) });
      if (!twice) return { from, discipline, marked, focus, first, again: undefined, second: undefined };
      // Later the same day, rested again (TEST SETUP), as the example has every hour: the day’s focus read before it.
      rested(sim);
      const again = focusAt(sim, sim.player, sim.now);
      const second = press<{ gained: number; level: number }>(sim, 'practice.exercise', { exercise: exerciseFor('emotionalDepth')!.id }, false);
      return { from, discipline, marked, focus, first, again, second };
    };
    return { at60: hour(60, undefined, true), below: hour(60, 0), at85: hour(85) };
  },
  genre() {
    const sim = life('guide-craft-genre');
    const g = DRAMA.kinds[0]!;
    const known0 = partWords(DRAMA, recordOf(sim.player, DRAMA.id), 'genre', genreKnown(sim.player, DRAMA));
    const first = press<{ familiarity: number }>(sim, 'genre.study', { genre: g }).familiarity;
    const second = press<{ familiarity: number }>(sim, 'genre.study', { genre: g }).familiarity;
    const daily = life('guide-craft-genre-daily');
    const days = knowTheGenre(daily);
    const at = daily.player.engagement!.byGenre[g]!.familiarity;
    const known = genreKnown(daily.player, DRAMA);
    const look = resolveLook(daily, { kind: 'genre', id: g }) as Looked;
    return { known0, first, second, days, at, known, summary: look.summary };
  },
  prepare() {
    const sim = life('guide-craft-prepare');
    // TEST SETUP (from 2026-10-16): imagination and memory at 50, the example's, where each speeds its step by exactly 1
    // (`stepSpeed`); the steps grow them a few hundredths over two days, which moves no figure said.
    attributesOf(sim, sim.player).imagination = 50;
    sim.player.craft!.memorization = 50;
    const traits = sim.player.personalityTraits ?? [];
    const speed0 = prepSpeed(sim.player, DRAMA);
    press(sim, 'brief.choose', { brief: DRAMA.id, reading: READING_ONE.id });
    const days = twoDays(sim);
    const e = forecast(sim, sim.player, DRAMA);
    const spec = workPiece(sim, sim.player, DRAMA_PIECE)!.spec();
    return { traits, speed0, ...days, beats: e.piece!.segments.map((s, i) => ({ asks: s.required, has: s.part, turnInto: spec.segments[i]!.turnInto, blend: spec.segments[i]!.blend })) };
  },
  choose() {
    const sim = life('guide-craft-choose');
    // TEST SETUP: the example’s actor, stamina at 60% of its full.
    atLevel(sim, 60, { emotionalDepth: 75, composure: 70, listening: 50, adaptability: 50 }, true);
    // The actor as the save holds them: each ability the example names, one it doesn’t, a technique, and stamina’s share of its full.
    const p = sim.player;
    const actor = {
      ...Object.fromEntries((['emotionalDepth', 'composure', 'listening', 'adaptability', 'presence'] as const).map((a) => [a, levelOf(sim, p, a)])) as Record<'emotionalDepth' | 'composure' | 'listening' | 'adaptability' | 'presence', number>,
      scene: p.craft!.scene,
      stamina: levelOf(sim, p, 'stamina') / abilityFull(sim, p, 'stamina'),
    };
    // The figure beside each reading, as Your Reading shows it (`BriefPane.tsx`).
    const figure = (r: string) => preview(sim, sim.player, DRAMA, r, {}).overall;
    const [first, second] = [figure(READING_ONE.id), figure(READING_TWO.id)];
    press(sim, 'brief.choose', { brief: DRAMA.id, reading: READING_ONE.id });
    recordOf(sim.player, DRAMA.id).prep.interpretation = BRIEF.complete.interpretation; // TEST SETUP: the breakdown at 80%.
    const breakdown = recordOf(sim.player, DRAMA.id).prep.interpretation;
    const changed = press<{ interpretation: number; readingChanged: boolean }>(sim, 'brief.choose', { brief: DRAMA.id, reading: READING_TWO.id });
    return { actor, first, second, breakdown, changed, kept: recordOf(sim.player, DRAMA.id).prep.interpretation };
  },
  reader() {
    // With the recording: prepared over the two days, the actor at 62 at the take (TEST SETUP), and taped.
    /** TEST SETUP: the actor at 62 when it’s measured, rested; then the take with the reader, as it stands. */
    const measured = (sim: Simulation) => { atLevel(sim, 62); rested(sim); return { prep: recordOf(sim.player, DRAMA.id).reader?.prep ?? 1, ...togetherNow(sim) }; };
    // With the recording, then taped.
    const alone = preparedDrama('guide-craft-reader-alone');
    const recording = measured(alone);
    press(alone, 'practice.self_tape', { genre: DRAMA.kinds[0] });
    const take = recordOf(alone.player, DRAMA.id).takes.at(-1)!;
    const readiness = alone.player.work!.at(-1)!.inputs.condition.readiness;
    const callback = recordOf(alone.player, DRAMA.id).callback !== undefined;
    // The classmate chosen after the two days, worked through on the third: the run, then a rehearsal, the day’s first.
    const after = preparedDrama('guide-craft-reader-after');
    const reads = aReader(after);
    const mate = { ...mateAbilities(after, after.player, reads) };
    press(after, 'brief.reader', { brief: DRAMA.id, mate: reads });
    const fresh = measured(after);
    const named = problemsOf(workPiece(after, after.player, DRAMA_PIECE)!).some((p) => p.kind === 'partner');
    nextDay(after);
    press(after, 'work.identify', { piece: DRAMA_PIECE, problem: 'partner' });
    press(after, 'work.try', { piece: DRAMA_PIECE, adjustment: 'with-partner' });
    const run = measured(after);
    press(after, 'brief.prepare', { brief: DRAMA.id, step: 'rehearse' });
    const rehearsed = measured(after);
    // The classmate chosen before the two days.
    const before = preparedDrama('guide-craft-reader-before', (sim) => press(sim, 'brief.reader', { brief: DRAMA.id, mate: aReader(sim) }));
    const two = measured(before);
    recordOf(before.player, DRAMA.id).reader!.prep = 1; // TEST SETUP: fully prepared, which no number of rehearsals reaches.
    const full = measured(before);
    return { recording, take, readiness, callback, mate, fresh, named, run, rehearsed, two, full };
  },
  tape() {
    const sim = preparedDrama('guide-craft-tape');
    atLevel(sim, 62); rested(sim); // TEST SETUP: the actor at 62 at the take, as the guide's examples have it.
    const prepared = forecast(sim, sim.player, DRAMA);
    press(sim, 'practice.self_tape', { genre: DRAMA.kinds[0] });
    const rec = recordOf(sim.player, DRAMA.id);
    const take = rec.takes.at(-1)!;
    const w = sim.player.work!.at(-1)!;
    const u = undrawn(w);
    const together = takeTogether(sim, sim.player, DRAMA, rec, u)!;
    const callback = rec.callback ? { ...rec.callback } : undefined;
    // The callback it earns, at the same level, nothing else changed.
    atLevel(sim, 62); rested(sim);
    const again = press<{ purpose: string }>(sim, 'practice.self_tape', { genre: DRAMA.kinds[0] });
    const second = rec.takes.at(-1)!;
    return { prepared, take, w, u, together, callback, again, second, still: rec.callback };
  },
  work() {
    const sim = preparedDrama('guide-craft-work');
    atLevel(sim, 62); rested(sim); // TEST SETUP: the actor at 62 at the take, as the guide's examples have it.
    press(sim, 'practice.self_tape', { genre: DRAMA.kinds[0] });
    const w = sim.player.work!.at(-1)!;
    const look = resolveLook(sim, { kind: 'work', id: w.inputs.key }) as Looked;
    return { w, u: undrawn(w), again: replay(w, TASK_PROFILES[w.task]!)!, look, body: text(look.body) };
  },
  identity() {
    const sim = life('guide-craft-identity');
    // Briefs that take Measured, so no choice is one the text forbids.
    const others = BRIEFS.filter((b) => b.id !== DRAMA.id && !misfitOf('pace', 'measured', briefMaterial(b)));
    const tape = (b = DRAMA) => press(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
    // Measured for the pace on three pieces, the drama’s taped that way; and four more taped, played no way chosen.
    press(sim, 'brief.choose', { brief: DRAMA.id, reading: READING_ONE.id, pace: 'measured' });
    tape();
    for (const b of others.slice(0, 2)) press(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, pace: 'measured' });
    for (const b of others.slice(2, 6)) { press(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id }); tape(b); }
    const atFirst = identityOf(sim.player);
    const chosenAtFirst = sim.player.experience!.approaches.measured!.chosen;
    tape();
    const afterTake = identityOf(sim.player);
    const measured = { ...sim.player.experience!.approaches.measured! };
    // Measured chosen on one more piece at a time, until a habit is named: how many more it took.
    let more = 0;
    for (const b of others.slice(6)) {
      if (identityOf(sim.player).habits.length) break;
      press(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, pace: 'measured' });
      more += 1;
    }
    return { atFirst, chosenAtFirst, afterTake, measured, more, atLast: identityOf(sim.player) };
  },
};

// --- the examples --------------------------------------------------------------------------------------------------------

describe('the craft guide’s worked examples, played', () => {
  it('The Player Profile: the ability opens to its look, the Techniques row says how far to mastery, and no clock moves', () => {
    const ex = example('craft.profile');
    const r = PLAYS.profile();
    expect(r.opened).toBe(true);
    // The look the example opens, named as it names it, with every part the example lists.
    expect(ex.all).toContain(`press ${r.look.name}`);
    for (const part of ['Now', 'Classes Reach', 'Last Change', 'How it grows.', 'Where it started.', 'What it does.', 'To practice it.']) expect(r.lookText, part).toContain(part);
    const exercise = exerciseFor('emotionalDepth')!;
    expect(r.lookText).toContain(`To practice it. ${exercise.label}:`);
    expect(ex.result).toContain(`its exercise, ${exercise.label}`);
    // Scene Study’s row: its Mastered column, how far it has to go to MASTERED.
    expect(r.scene).toBeLessThan(MASTERED);
    expect(r.sceneRow).toContain(`${one(MASTERED - r.scene)} To Go`);
    expect(ex.result).toContain(`${TECHNIQUE_LABEL.scene}’s Mastered column says how far it has to go to ${MASTERED}`);
    expect(r.moved).toBe(0);
    expect(ex.result).toContain('The clock hasn’t moved.');
  });

  it('Practice: an hour, the repeat, a tier below and an hour at 85, as the toast says each', () => {
    const ex = example('craft.practice');
    const { at60, below, at85 } = PLAYS.practice();
    // The example’s actor, as the save holds it when the hour begins.
    expect(ex.setup).toContain(`${label('emotionalDepth')} at ${at60.from}, discipline at ${at60.discipline}`);
    // Every hour at a focus of 1, the repeat too.
    expect(at60.focus).toBe(1);
    expect(at60.again).toBe(1);
    expect(ex.setup).toContain('every hour rested, at a focus of 1');
    expect(ex.steps[0]).toContain(`the ${TIER.label[at60.marked]} tier is marked Your Level`);
    expect(at60.first.tier).toBe(at60.marked);
    expect(ex.result).toContain(`The first hour adds ${two(at60.first.gained)}, to ${one(at60.first.level)}`);
    expect(ex.result).toContain(`the second, a repeat, adds ${two(at60.second!.gained)}`);
    expect(ex.result).toContain(`At the ${TIER.label[0]} tier the first would have added ${two(below.first.gained)}`);
    // The tier the hour at 85 was played at, asked none: the one marked Your Level there.
    expect(ex.result).toContain(`At ${at85.from}, at the ${TIER.label[at85.first.tier]} tier marked Your Level there, the same hour adds ${two(at85.first.gained)}`);
    // The floor: at 85 the hour is a session’s at its floor, the share of 100 still to go long past it.
    expect(at85.first.gained).toBeCloseTo(DEVELOPMENT.sessionGain * DEVELOPMENT.deliberate * DEVELOPMENT.floor, 9);
    expect(ex.result).toContain(`never falls under ${pct(DEVELOPMENT.floor)} of a session’s`);
  });

  it('Genres: a study, a second the same day, and once a day until the brief counts the genre known', () => {
    const ex = example('craft.genre');
    const r = PLAYS.genre();
    expect(ex.setup).toContain(`Knowing The Genre at ${r.known0.replace(' of ', ' of the ')}`);
    expect(ex.result).toContain(`The first study takes familiarity to ${one(r.first)}, and the second the same day only to ${one(r.second)}`);
    expect(r.known).toBeGreaterThanOrEqual(BRIEF.complete.genre);
    expect(ex.result).toContain(`it passes ${pct(BRIEF.complete.genre)} on day ${r.days}, at ${one(r.at)}`);
    // What the genre’s look says, word for word as the example quotes it.
    const said = /a scene or a part from a play of its kind \d+% quicker to prepare/.exec(r.summary)?.[0];
    expect(said).toBeDefined();
    expect(ex.result).toContain(`the genre’s look says it makes ${said}`);
  });

  it('Preparing A Brief: two days of the three steps, each beat against what it asks, and the hours', () => {
    const ex = example('craft.brief-prepare');
    const r = PLAYS.prepare();
    expect(r.traits).toEqual([]);
    expect(r.speed0).toBe(1);
    // The scene as its spec builds it: its beats, those a change of tone leads into, and those held two ways.
    expect(ex.setup).toContain(`${plural(r.beats.length, 'beat')}, ${plural(r.beats.filter((b) => b.turnInto).length, 'change')} of tone and ${r.beats.filter((b) => b.blend).length} held two ways`);
    const [one1, two2] = r.after;
    expect(one1!.interpretation).toBe(one1!.memorization);
    expect(ex.result).toContain(`Day one leaves the breakdown and the lines at ${pct(one1!.interpretation)} and rehearsal at ${pct(one1!.rehearsal)}`);
    expect(ex.result).toContain(`day two’s steps go ${pct(r.speed - 1)} faster`);
    expect(two2!.interpretation).toBe(two2!.memorization);
    expect(two2!.interpretation).toBeGreaterThanOrEqual(BRIEF.complete.interpretation);
    expect(ex.result).toContain(`the breakdown and the lines to ${pct(two2!.interpretation)}, past the ${pct(BRIEF.complete.interpretation)} that completes them, and rehearsal to ${pct(two2!.rehearsal)}`);
    expect(ex.result).toContain(`The beats ask ${andList(r.beats.map((b) => pct(b.asks)))}`);
    const most = r.beats.reduce((m, b) => (b.asks > m.asks ? b : m));
    expect(most.turnInto && most.blend).toBe(true);
    expect(r.beats.every((b) => b.has >= b.asks)).toBe(true);
    expect(ex.result).toContain('every beat is met');
    expect(ex.result).toContain(`${duration(r.minutes)} in all`);
  });

  it('A Reading And A Way To Play It: the figure beside each reading, and a change of reading’s cost to the breakdown', () => {
    const ex = example('craft.brief-choose');
    const r = PLAYS.choose();
    const a = r.actor;
    expect(a.adaptability).toBe(a.listening);
    expect(a.scene).toBe(a.presence);
    expect(ex.setup).toContain(`by an actor at ${a.emotionalDepth} in ${label('emotionalDepth')}, ${a.composure} in ${label('composure')}, ${a.listening} in ${label('listening')} and in ${label('adaptability')}, and ${a.presence} in everything else, techniques too, with ${label('stamina').toLowerCase()} at ${pct(a.stamina)} of its full`);
    expect(ex.steps[2]).toContain(`With the breakdown at ${pct(r.breakdown)}, change from the first to the second`);
    expect(ex.result).toContain(`Fully prepared, ${READING_ONE.label} comes to ${one(r.first)} and ${READING_TWO.label} to ${one(r.second)}`);
    expect(r.first).toBeGreaterThan(r.second);
    expect(ex.result).toContain('the first leans on what this actor does well');
    expect(r.changed.readingChanged).toBe(true);
    expect(r.changed.interpretation).toBe(r.kept);
    expect(ex.result).toContain(`The change leaves the breakdown at ${pct(r.kept)}`);
  });

  it('Who Reads With You: the recording, a classmate chosen late and worked through, and one chosen early', () => {
    const ex = example('craft.brief-reader');
    const r = PLAYS.reader();
    const own = r.recording.own;
    // Your own take, whoever reads: the same in every way to it, and the take’s own with no draw.
    for (const x of [r.fresh, r.run, r.rehearsed, r.two, r.full]) expect(x.own).toBe(own);
    expect(r.take.expected).toBe(own);
    expect(ex.setup).toContain(`taped at readiness ${Math.round(r.readiness)} with no draw: your own take at ${one(own)} (${band(own)})`);
    // The classmate who reads, as the save holds them.
    expect(r.mate.focus).toBe(r.mate.listening);
    expect(ex.setup).toContain(`A classmate whose listening and focus are ${r.mate.listening} reads`);
    expect(ex.result).toContain(`Your own take is ${one(own)} whoever reads`);
    // The classmate’s timing from listening and focus at 70, and no slip on the day.
    for (const x of [r.fresh, r.run, r.rehearsed, r.two, r.full]) { expect(x.timing).toBeCloseTo(0.85, 9); expect(x.slip).toBeUndefined(); }
    expect(ex.result).toContain(`With the recording, the take together comes to ${one(r.recording.together)}, ${band(r.recording.together)}`);
    expect(ex.result).toContain(`would bring it to ${one(r.fresh.together)}, ${one(own - r.fresh.together)} under your own`);
    expect(r.named).toBe(own - r.fresh.together >= 3);
    expect(ex.result).toContain(r.named ? 'so Work It Through names them as not there yet' : `${one(own - r.fresh.together)} under your own.`);
    expect(ex.result).toContain(`Run It With Your Partner takes them to ${pct(r.run.prep)} and the take to ${one(r.run.together)}`);
    expect(ex.result).toContain(`the rehearsal after it takes them to ${pct(r.rehearsed.prep)} and the take to ${one(r.rehearsed.together)}, ${band(r.rehearsed.together)}`);
    expect(ex.result).toContain(`they come to it ${pct(r.two.prep)} prepared, and the take to ${one(r.two.together)}`);
    expect(r.full.together).toBeGreaterThan(own);
    expect(ex.result).toContain(`fully prepared, they’d bring it to ${one(r.full.together)}, over your own`);
    // What earns a callback: the take together at Strong, as the played take, with its draw, earned one or didn’t.
    expect(ex.result).toContain(`a callback is earned from ${STRONG} together`);
    expect(r.callback).toBe(r.take.together!.overall >= STRONG);
  });

  it('Taping A Brief: the take beat by beat with no draw, the take together, and the callback played no differently', () => {
    const ex = example('craft.brief-tape');
    const r = PLAYS.tape();
    // Fully prepared: the two days and the genre known leave no part of the preparation short.
    expect(r.prepared.limits.filter((l) => l.kind === 'preparation')).toEqual([]);
    expect(r.take.purpose).toBe('first');
    expect(r.take.expected).toBe(r.u.overall);
    expect(r.w.inputs.condition.readiness).toBeCloseTo(80, 6);
    // The actor and the day, as the take’s record holds what it was judged with.
    expect(ex.setup).toContain(`by an actor at ${judgedAt(r.w)} in every ability and technique, rested at readiness ${Math.round(r.w.inputs.condition.readiness)}, with no draw`);
    const segs = r.u.piece!.segments;
    expect(ex.result).toContain(`It comes to ${one(r.u.overall)}, ${band(r.u.overall)}: its beats ${andList(segs.map((s) => one(s.overall)))}, the last beat ${pct(1 - segs.at(-1)!.drain)} off for stamina, continuity ${one(r.u.piece!.continuity)}.`);
    expect(ex.result).toContain(`${chiefLimit(r.u)}.`);
    expect(ex.result).toContain(`With the recording reading, the take together is ${one(r.together.overall)}, ${r.together.overall >= STRONG ? 'enough for a callback' : 'short of a callback'}`);
    // The take as played, with its draw: its take together at Strong earned the callback.
    expect(r.callback).toBeDefined();
    expect(bandOfQuality(r.take.together!.overall)).toMatch(/strong|exceptional/);
    expect(AXES[r.callback!.axis].values).toContain(r.callback!.side);
    expect(r.again.purpose).toBe('callback');
    expect(ex.result).toContain(`Pitched as a callback, the same take comes to ${one(r.second.expected)}, ${band(r.second.expected)}`);
    expect(r.second.answered).toBe(false);
    expect(r.still).toBeDefined();
    expect(ex.result).toContain('played no differently it leaves the note unanswered: the callback is still yours');
  });

  it('A Piece Of Work, Explained: the take opened from the record, its summary and its parts', () => {
    const ex = example('craft.work');
    const r = PLAYS.work();
    // Opened, it says its result and what held it back most, worked out again from its own inputs to the same figure.
    expect(r.look.summary).toContain(`Judged ${one(r.w.overall)} of 100, ${band(r.w.overall)}`);
    expect(r.look.summary).toContain(`${chiefLimit(r.w)}.`);
    expect(r.again.overall).toBe(r.w.overall);
    expect(r.look.provenance).toContain(`Judged again from its record, it comes to ${one(r.w.overall)}`);
    // Part By Part, as the look draws it, is the take as played, with its draw: each part’s row and the continuity.
    for (const s of r.again.piece!.segments) expect(r.body).toMatch(new RegExp(`${s.label} [A-Z][A-Za-z ]* ${one(s.overall)} ${pct(s.part)} of ${pct(s.required)} `));
    expect(r.body).toContain(`from part to part: ${one(r.again.piece!.continuity)}.`);
    // The example’s figures are the take with no draw, which no step shows, so its setup says so; until 2026-10-12 it
    // didn’t, and played, the look showed 65.9 where the example said 66.5.
    expect(ex.setup).toContain(`an actor at ${judgedAt(r.w)} in everything, fully prepared, at readiness ${Math.round(r.w.inputs.condition.readiness)}, with no draw`);
    expect(ex.result).toContain(`${one(r.u.overall)} of 100, ${band(r.u.overall)}. The summary says what held it back most: ${chiefLimit(r.u)}.`);
    const segs = r.u.piece!.segments;
    expect(ex.result).toContain(`Moment By Moment gives ${andList(segs.map((s) => `${s.label} ${one(s.overall)}`))}`);
    expect(ex.result).toContain(`${segs.at(-1)!.label} is Tiring, ${pct(1 - segs.at(-1)!.drain)} off, and continuity is ${one(r.u.piece!.continuity)}`);
    // Part By Part, as the look draws it: stamina draws nothing, so the last beat’s Tiring is the same drawn or not.
    expect(r.body).toContain('Moment By Moment');
    expect(r.body).toContain(`Tiring: ${pct(1 - r.again.piece!.segments.at(-1)!.drain)} off`);
    expect(r.again.piece!.segments.at(-1)!.drain).toBe(segs.at(-1)!.drain);
  });

  it('Your Work So Far: early days at five pieces, no habit from a take, and a habit at five choices', () => {
    const ex = example('craft.identity');
    const r = PLAYS.identity();
    expect(r.atFirst.pieces).toBe(ARTISTRY.least - 1);
    expect(r.chosenAtFirst).toBe(3);
    expect(ex.setup).toContain(`A first-year with ${plural(r.atFirst.pieces, 'piece')} judged, who has newly chosen ${APPROACH_EFFECT.measured.label} for the pace on ${plural(r.chosenAtFirst, 'piece')} of work`);
    expect(r.atFirst.early).toBe(true);
    expect(ex.result).toContain(`With ${r.atFirst.pieces} judged it says Early days: patterns are named once ${ARTISTRY.least} are`);
    // The take played Measured again: a sixth piece, its evidence, and no choice more.
    expect(r.afterTake.pieces).toBe(ARTISTRY.least);
    expect(r.afterTake.early).toBe(false);
    expect(r.afterTake.habits).toEqual([]);
    expect(r.measured.chosen).toBe(r.chosenAtFirst);
    expect(r.measured.shown).toBe(2);
    expect(ex.result).toContain(`With ${r.afterTake.pieces}, strengths and what keeps holding the work back can be named`);
    expect(ex.result).toContain(`so it stands at ${r.measured.chosen} of the ${ARTISTRY.habitAt} a habit needs`);
    // The choices more it took to name the habit, as the step and the result count them, and the words the example quotes.
    expect(ex.steps[2]).toContain(`for the pace on ${plural(r.more, 'more piece')}.`);
    expect(ex.result).toContain(`Chosen on the ${r.more} more, it’s named one`);
    const quoted = /“(You tend to play it [^”]+)”/.exec(ex.result)?.[1];
    expect(r.atLast.habits.map((x) => x.line)).toContain(quoted);
  });
});

describe('playing the examples', () => {
  it('leaves a live save as it was, to the byte', () => {
    const live = quickSave();
    live.advanceTo(live.now + 30 * 3_600_000);
    const before = serialise(live.universe);
    for (const play of Object.values(PLAYS)) play();
    expect(serialise(live.universe)).toBe(before);
  });
});
