/**
 * Phase 2b of the owner's brief "Perfect The Attributes, Genres, And Their Integration Through Demonstrable Gameplay"
 * (2026-10-16; docs/verification/attributes-genres-2026-10-16/phase-2b.md). Each block holds one step, and each failed
 * on the code before the step:
 * 1. Knowing the genre read over its whole range, with a smaller gate (`EVALUATION.partFloor`, `BRIEF.complete.genre`),
 *    and a take credits its genres as practice by how far it was prepared (`practiceShare`).
 * 2. What a piece demands decides which abilities count (`BASE_INPUTS`, `DEMAND_EFFECT`): a longer text asks memory, more
 *    at stake composure, less of a partner presence, more beats discipline, a grave piece emotional depth, a comic one
 *    focus, an invented world imagination; and no one ability is best on most of a kind of work.
 * 3. Stamina's load by a piece's length (`PIECE.load`): a night draws on it more than a light brief or scene. From
 *    2026-10-16's brief 10 a night's is its workload (`systems/workload.ts`): its running time, its part and its
 *    intensity, so a one-act asks less of it than a whole evening, where until then every night was a whole evening.
 * 4. Listening speeds a brief rehearsed against its reader (and an evening with a partner or a reader); adaptability a
 *    director's note on the blocking worked into a part (`stepSpeed`).
 * TEST SETUP throughout: levels and parts written directly where a block says so, and the clock's own commitments
 * cleared where a step is taken through its command, as tests/attributes-phase-2a.test.ts does.
 *
 * From 2026-10-17, the owner's brief 11 ("Finish The Current Build Against A Fixed Checklist",
 * docs/verification/completion-2026-10-16/): the criteria phase 2b met by reading the code (phase-2b.md §9), held here by
 * tests a change would fail, each for all twelve abilities where the criterion names them all:
 * 5. A4: what the game says each ability does and what develops it, the ability's look drawn, against what changes when
 *    it changes and what grows it, clause by clause.
 * 6. A5: an action the player chooses for each, and the screen that says what moved.
 * 7. T1: the practice control's gain before the hour and the hour's own words after, the repeat and a technique past
 *    mastery said.
 * 8. O3: bands, grades and casting read the player's own result (casting the expected), preparation and condition named
 *    as limits of their own.
 * 9. F1: every note reads what the evaluation found.
 * 10. F3: preparation, the day's condition and a way of playing that didn't fit, each in its own words.
 * 11. A1: each ability's largest effect, +10 on the mean result of a kind of work, at half a point or more.
 * 12. Brief 11's section 7: health, stamina and energy kept apart.
 * The screens are drawn to markup (react-dom/server) over the save being played, as tests/ability-mastered.test.ts draws
 * the Player Profile: `useGame` stands in for the provider, `run` is the save's own `execute`, a toast is kept for the test
 * to read, and Gated is the real one with its onClick kept so a test can press it. React's `useState(false)` is answered
 * `true` while `h.asking` is set, which opens every practice control, as tests/defects-g8-8.test.ts opens Amend The Return.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR } from '@/engine/core/time';
import type { Person } from '@/engine/domain/model';
import { ABILITY_DEFS, MASTERED, STEP_SPEED, TECHNIQUES, type AbilityId } from '@/engine/content/abilities';
import { BRIEFS, BRIEF_BY_ID, type Brief } from '@/engine/content/briefs';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '@/engine/content/material';
import { PIECE } from '@/engine/content/piece';
import { EVALUATION, TASK_PROFILES } from '@/engine/content/tasks';
import { instantFromZoned } from '@/engine/core/time';
import { attributesOf } from '@/engine/systems/attributes';
import { BRIEF, briefContext, briefPiece, practiceShare, prepareBrief, recordOf, requiredOf, prepareRefusal } from '@/engine/systems/briefs';
import type { Performer } from '@/engine/systems/evaluation';
import { materialContext } from '@/engine/systems/material';
import { judgePiece, loadOf, nightPiece, unitSegments } from '@/engine/systems/piece';
import { nightLoad, runningOf, type Participation } from '@/engine/systems/workload';
import { RUNNING_TIMES } from '@/engine/content/workload';
import { hasProcess, type Process } from '@/engine/systems/production';
import { CALL_KIND, NIGHT_DIFFICULTY } from '@/engine/systems/school';
import { PREP_DIMS } from '@/engine/content/coursework';
import { READER, courseworkOf, mateRecord, partnerPart, questionsFor, type Assignment } from '@/engine/systems/coursework';

import { MS_DAY } from '@/engine/core/time';
import { loadSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { ATTRIBUTES, abilityFull, abilityOf, developmentOf, isAbility, levelOf, nerves, CRAFT_ABILITY } from '@/engine/systems/attributes';
import { bandOfQuality, chiefLimit, judge, performerOf, replay, type Evaluation } from '@/engine/systems/evaluation';
import { TEMPLATES, templateById } from '@/engine/content/coursework';
import { DIMENSION_LABEL, TEMPLATE_TASK, type Dimension } from '@/engine/content/tasks';
import { EXERCISES, EXERCISE_BY_ID, EXERCISE_DESIGN, TIER, exerciseFor } from '@/engine/content/practice';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { FITNESS, TRAINING, occupiedAt, trainingAt } from '@/engine/systems/life';
import { LAB_KIND, castFit, castingPerformer, focusAt, grewFrom, nightBand, nightTogether, playPiece } from '@/engine/systems/school';
import { rehearseTrains } from '@/engine/systems/briefs';
import { BAND_LABEL, judgeWork, meetingsFrom, noteTaken, scenePiece, skillHeld, togetherOf, workContext } from '@/engine/systems/coursework';
import { energyOfNight, eveningCost, segmentShares, withPart } from '@/engine/systems/workload';
import { workPiece as gamePiece, briefReadingPiece, courseworkPiece } from '../tools/pieces';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';
import { readersOf, sourceWords } from '@/ui/looks/actor';
import { adviceFor } from '@/engine/systems/next-steps';
import { suggestions } from '@/engine/systems/briefs';
import { AXES } from '@/engine/content/approaches';
import { genreState } from '@/engine/systems/engagement';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  asking: false,
  toasts: [] as string[],
  clicks: [] as { feature: string; title?: string; onClick?: () => void }[],
  ran: [] as { kind: string; ok: boolean; value?: unknown; error?: string }[],
  states: [] as unknown[],
}));

// A practice control opens on a press (`openUp`): answered open while asking.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((init: unknown) => {
    // TEST SETUP: what each useState starts at, in render order, where a test gives them (Look After Yourself's dropdown).
    if (h.states.length) { const [, set] = real.useState(init); return [h.states.shift(), set]; }
    return h.asking && init === false ? [true, () => undefined] : real.useState(init);
  }) as typeof real.useState;
  return { ...real, useState, default: { ...real, useState } };
});
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
// Without the original: it imports the looks, which import it back.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => { const r = h.sim.execute({ kind, payload }); h.ran.push({ kind, ...r }); return r; },
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  return { ...real, Gated: (props: Parameters<typeof real.Gated>[0]) => { h.clicks.push({ feature: props.feature, title: props.title, onClick: props.onClick as (() => void) | undefined }); return ce(real.Gated, props); } };
});
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { TimeControls } = await import('@/ui/shell/TimeControls');

/** What the player reads: the markup with its titles and tags taken out, its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** The Player Profile drawn as the player has it, every practice control opened where `open`. */
function profile(sim: Simulation, open = false): { html: string; text: string } {
  h.sim = sim; h.clicks = []; h.asking = open;
  const html = renderToStaticMarkup(createElement(ProfileWorkspace)).replace(/<!-- -->/g, '');
  h.asking = false;
  return { html, text: onScreen(html) };
}
/** An ability's row in Attributes And Craft, its cells as the page draws them (the first its name, Mastered beside it where it is). */
function abilityRow(html: string, label: string): string[] {
  const rows = [...html.matchAll(/<tr><td class="nowrap">(.*?)<\/tr>/g)].map((m) => [...`<td class="nowrap">${m[1]!}`.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((c) => onScreen(c[1]!).trim()));
  const row = rows.find((r) => r[0]!.replace(/\s*Mastered$/, '') === label);
  expect(row, `${label}'s row on the Player Profile`).toBeDefined();
  return row!;
}
/** An ability's look, its body as drawn. */
function lookOf(sim: Simulation, id: AbilityId): string {
  h.sim = sim;
  const look = resolveLook(sim, subject('ability', id)) as Looked;
  expect(look && !('gone' in look), id).toBe(true);
  return onScreen(renderToStaticMarkup(createElement('div', null, look.body)));
}
/** TEST SETUP: whatever is under way on the calendar let finish, the day's own commitments cleared, and the player rested. */
function freeAndRested(sim: Simulation): void {
  for (let busy = occupiedAt(sim, sim.now); busy; busy = occupiedAt(sim, sim.now)) sim.advanceTo(busy.at + busy.durationMinutes! * 60_000);
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer && !item.payload.kept) sim.timeline.cancel(item.id, sim.now);
  const w = sim.player.wellbeing; w.energy = 100; w.stress = 0; w.morale = 80; w.nourishment = 90; w.hygiene = 100; w.sleepDebt = 0;
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
}
/** TEST SETUP: an ability set, in the one place it's kept. */
function setAbility(sim: Simulation, a: AbilityId, level: number): void {
  const skill = CRAFT_ABILITY[a];
  if (skill) sim.player.craft![skill] = level;
  else if (a === 'stamina') sim.player.wellbeing.fitness = level;
  else (attributesOf(sim, sim.player) as unknown as Record<string, number>)[a] = level;
}
/** Played by somebody who looks after themselves (TEST SETUP: the day kept rested, as tests/direction.test.ts keeps it). */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { const w = sim.player.wellbeing; Object.assign(w, { energy: 95, stress: 5, sleepDebt: 0, nourishment: 85, morale: 75, hygiene: 95 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const NY = 'America/New_York';
const on = (y: number, m: number, d: number, hour = 9) => instantFromZoned({ year: y, month: m, day: d, hour }, NY);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const clearDay = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
const rested = (sim: Simulation) => { const w = sim.player.wellbeing; w.energy = 100; w.stress = 0; w.morale = 80; w.nourishment = 90; w.hygiene = 100; w.sleepDebt = 0; };

const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
/** The developing actor of baseline §5: every ability 50, every technique 40. */
const DEVELOPING: Performer = { ability: () => 50, full: () => 100, technique: () => 40 };
/** A take of a brief fully prepared on a sufficient day, no draw, the genre known as given (TEST SETUP: the part set directly). */
const take = (b: Brief, p: Performer, known: number) => {
  const rec = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
  const ctx = briefContext(nobody, b, rec, { reading: b.readings[0]!.id, prep: { genre: known } });
  return judgePiece('p2b', p, { ...ctx, condition: { readiness: 100 }, key: `p2b:${b.id}`, expected: true }, briefPiece(b, { ...rec, reading: b.readings[0]!.id }));
};

// ---------------------------------------------------------------------------------------------------------------
// 1. Knowing the genre
// ---------------------------------------------------------------------------------------------------------------

describe('knowing the genre reads over its whole range, with a gate a master clears', () => {
  const sample = BRIEFS.filter((_, i) => i % 10 === 0);

  it('costs a mastered actor a tenth or so with the genre never met, and nothing once it is known to 90', () => {
    for (const b of sample) {
      const none = take(b, MASTER, 0);
      // The gate: the interpretation's preparation keeps three quarters (`partFloor`), so the master stays Exceptional.
      expect(none.overall, b.id).toBeGreaterThanOrEqual(EVALUATION.bands.exceptional);
      expect(none.overall, b.id).toBeLessThan(100);
      const known = take(b, MASTER, BRIEF.complete.genre);
      expect(known.overall, b.id).toBe(100);
      expect(known.mastery, b.id).toBe(true);
    }
  });

  it('raises the take with every step from 0 to 90 known, past the 30 that completed it until 2026-10-16, by a tenth or more a step', () => {
    for (const b of sample) {
      const at = [0, 0.3, 0.6, 0.9].map((k) => take(b, DEVELOPING, k).overall);
      for (let i = 1; i < at.length; i += 1) expect(at[i]! - at[i - 1]!, `${b.id} at ${at.join(', ')}`).toBeGreaterThanOrEqual(0.1);
      // Past complete it adds nothing.
      expect(take(b, DEVELOPING, 1).overall).toBe(at[3]);
    }
  });

  it('is complete at 90, as a technique is mastered, and floored at three quarters of the interpretation', () => {
    expect(requiredOf(BRIEF_BY_ID['brief-drama']!).genre).toBe(0.9);
    expect(EVALUATION.partFloor.genre).toBe(0.75);
  });
});

describe('a take credits its genres by how far it was prepared', () => {
  it('credits a cold take its seventh, a complete one in full, and between in step with the parts', () => {
    const b = BRIEF_BY_ID['brief-drama']!;
    const req = requiredOf(b);
    expect(practiceShare({ prep: { interpretation: 0, memorization: 0, rehearsal: 0 } }, b)).toBeCloseTo(BRIEF.practiceUnprepared, 12);
    expect(practiceShare({ prep: { interpretation: req.interpretation!, memorization: 1, rehearsal: 0.97 } }, b)).toBeCloseTo(1, 12);
    expect(practiceShare({ prep: { interpretation: req.interpretation! / 2, memorization: 0, rehearsal: 0 } }, b)).toBeCloseTo(BRIEF.practiceUnprepared + (1 - BRIEF.practiceUnprepared) / 6, 12);
  });

  it('PLAYER JOURNEY: taping cold, a new brief in a new genre every hour, credits no more genre practice an hour than preparing one brief and taping it', () => {
    const practice = (sim: Simulation) => Object.values(sim.player.engagement?.byGenre ?? {}).reduce((s, g) => s + g.practice, 0);
    const tape = (sim: Simulation, b: Brief) => {
      if (!recordOf(sim.player, b.id).reading) expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } }).ok).toBe(true);
      const r = sim.execute({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } });
      expect(r.ok, r.error).toBe(true);
    };
    // Cold: three hours, three briefs of three genres, no step taken on any.
    const cold = life('p2b-credit');
    clearDay(cold); rested(cold);
    const t0 = cold.now, p0 = practice(cold);
    for (const b of [BRIEF_BY_ID['brief-drama']!, BRIEF_BY_ID['brief-comedy']!, BRIEF_BY_ID['brief-horror']!]) { clearDay(cold); rested(cold); tape(cold, b); }
    const coldRate = (practice(cold) - p0) / ((cold.now - t0) / MS_HOUR);
    // Prepared: one brief, each part complete through its own steps (one a day per step, so none is a repeat), then taped.
    const prep = life('p2b-credit');
    const b = BRIEF_BY_ID['brief-drama']!;
    const req = requiredOf(b);
    let hours = 0;
    const done = () => { const p = recordOf(prep.player, b.id).prep; return p.interpretation >= req.interpretation! && p.memorization >= req.memorization! && p.rehearsal >= req.rehearsal!; };
    for (let day = 0; day < 10 && !done(); day += 1) {
      for (const s of ['read', 'lines', 'rehearse'] as const) {
        clearDay(prep); rested(prep);
        const part = s === 'read' ? 'interpretation' : s === 'lines' ? 'memorization' : 'rehearsal';
        if (recordOf(prep.player, b.id).prep[part] >= req[part]! || prepareRefusal(prep, prep.player, b, s)) continue;
        const from = prep.now;
        expect(prep.execute({ kind: 'brief.prepare', payload: { brief: b.id, step: s } }).ok).toBe(true);
        hours += (prep.now - from) / MS_HOUR;
      }
      prep.advanceTo(prep.now + 24 * MS_HOUR);
    }
    expect(done()).toBe(true);
    clearDay(prep); rested(prep);
    const q0 = practice(prep), from = prep.now;
    tape(prep, b);
    hours += (prep.now - from) / MS_HOUR;
    const prepRate = (practice(prep) - q0) / hours;
    expect(coldRate, `cold ${coldRate.toFixed(3)} an hour, prepared ${prepRate.toFixed(3)}`).toBeLessThanOrEqual(prepRate);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2. What a piece demands
// ---------------------------------------------------------------------------------------------------------------

const EVEN: Performer = { ability: () => 50, full: () => 100, technique: () => 50 };
const plus = (p: Performer, a: AbilityId, by: number): Performer => ({ ...p, ability: (id) => (id === a ? p.ability(id) + by : p.ability(id)) });
/** The effect of +10 on one ability for the even actor, on a brief fully prepared, the genre known, the first reading. */
const effectOn = (b: Brief, a: AbilityId) => take(b, plus(EVEN, a, 10), 1).overall - take(b, EVEN, 1).overall;
/** A brief like another but in what's given (TEST SETUP: a variant with its own id, so its material is its own). */
let variants = 0;
const like = (b: Brief, over: Partial<Brief>): Brief => ({ ...b, ...over, id: `${b.id}~p2b-${(variants += 1)}` });
const beatsOf = (n: number, tone: 'grave' | 'comic' | 'lyric') => Array.from({ length: n }, () => ({ what: 'A beat.', tones: [tone] }));

/**
 * A scene shown in class or a night of a play, fully prepared, as the baseline judges one (TEST SETUP: the parts set). A
 * night as a supporting part's workload over its play's running time from 2026-10-16 (brief 10), or the part given.
 */
function work(m: MaterialProfile, night: boolean, p: Performer, size: Participation = 'supporting'): number {
  const task = night ? TASK_PROFILES.performance! : TASK_PROFILES.scene!;
  const read = materialContext(task, m);
  const parts = night ? ['lines', 'blocking', 'notes'] : ['familiarity', 'memorization', 'interpretation', 'rehearsal', 'partner'];
  return judgePiece('p2b', p, {
    task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep: Object.fromEntries(parts.map((k) => [k, 1])), required: Object.fromEntries(parts.map((k) => [k, 0.9])),
    difficulty: night ? NIGHT_DIFFICULTY.school.supporting : -0.3, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: 'p2b', expected: true,
  }, night ? nightPiece(m, runningOf({ play: m.id }), size) : { segments: unitSegments(m, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') }).overall;
}

describe('what a piece demands decides which abilities count', () => {
  const base = BRIEF_BY_ID['brief-drama']!;

  it('asks memory more of a longer text, composure more of higher stakes, presence more of a piece with less of a partner', () => {
    expect(effectOn(like(base, { size: 'long' }), 'memory')).toBeGreaterThan(effectOn(like(base, { size: 'short' }), 'memory') + 0.3);
    expect(effectOn(like(base, { stakes: 3 }), 'composure')).toBeGreaterThan(effectOn(like(base, { stakes: 0 }), 'composure') + 0.3);
    // Composure's own: the stakes lean consistency, which discipline shares, and composure gains more of it than discipline
    // does (a mutation that kept the lean and took composure's input out survived the line above, and a margin of 0.2).
    const rise = (a: AbilityId) => effectOn(like(base, { stakes: 3 }), a) - effectOn(like(base, { stakes: 0 }), a);
    // Measured: composure 1.1 and discipline 0 from stakes 0 to 3; with the lean alone, 0.6 and 0.2.
    expect(rise('composure')).toBeGreaterThan(rise('discipline') + 0.6);
    // At full precision from later on 2026-10-16. Shown, presence's +10 came to 0.5 with no partner and 0.2 with a partner
    // at 3 while the full drain was 0.3, and 0.6 and 0.3 once it was 0.4 (`PIECE.drain`): 0.3 apart to the tenth either way,
    // so the comparison rested on the floating point's last digit, and failed on it at 0.4. Exact, 0.587 and 0.277, then
    // 0.584 and 0.275: 0.31 apart.
    const exactOn = (b: Brief, a: AbilityId) => take(b, plus(EVEN, a, 10), 1).exact! - take(b, EVEN, 1).exact!;
    expect(exactOn(like(base, { partner: 0 }), 'presence')).toBeGreaterThan(exactOn(like(base, { partner: 3 }), 'presence') + 0.3);
  });

  it('asks discipline more of more beats, emotional depth of a grave piece, focus of a comic one, imagination of a lyric one', () => {
    expect(effectOn(like(base, { beats: beatsOf(6, 'grave') }), 'discipline')).toBeGreaterThan(effectOn(like(base, { beats: beatsOf(3, 'grave') }), 'discipline') + 0.2);
    expect(effectOn(like(base, { beats: beatsOf(3, 'grave') }), 'emotionalDepth')).toBeGreaterThan(effectOn(like(base, { beats: beatsOf(3, 'comic') }), 'emotionalDepth') + 0.3);
    expect(effectOn(like(base, { beats: beatsOf(3, 'comic') }), 'focus')).toBeGreaterThan(effectOn(like(base, { beats: beatsOf(3, 'grave') }), 'focus') + 0.3);
    expect(effectOn(like(base, { beats: beatsOf(3, 'lyric') }), 'imagination')).toBeGreaterThan(effectOn(like(base, { beats: beatsOf(3, 'grave') }), 'imagination') + 0.2);
  });

  it('has no ability best on half or more of the briefs, the scenes or the nights: the specialist built on it, 85 against the rest lowered to keep the budget', () => {
    const abilities = ABILITY_DEFS.map((d) => d.id);
    const specialist = (a: AbilityId): Performer => ({ ability: (id) => (id === a ? 85 : (600 - 85) / 11), full: () => 100, technique: () => 50 });
    const bestOf = (score: (p: Performer) => number) => { let best = 'even', top = score(EVEN); for (const a of abilities) { const s = score(specialist(a)); if (s > top + 1e-9) { best = a; top = s; } } return best; };
    const most = (xs: string[]) => { const m: Record<string, number> = {}; for (const x of xs) m[x] = (m[x] ?? 0) + 1; return Math.max(...Object.values(m)) / xs.length; };
    // Every other brief, the mean of its readings as baseline §2 reads it.
    const briefs = BRIEFS.filter((_, i) => i % 2 === 0).map((b) => bestOf((p) => b.readings.reduce((s, r) => {
      const rec = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
      const ctx = briefContext(nobody, b, rec, { reading: r.id, prep: { genre: 1 } });
      return s + judgePiece('p2b', p, { ...ctx, condition: { readiness: 100 }, key: 'p2b', expected: true }, briefPiece(b, { ...rec, reading: r.id })).overall;
    }, 0)));
    const scenes = SCENE_MATERIAL.map((m) => bestOf((p) => work(m, false, p)));
    const nights = PLAY_MATERIAL.map((m) => bestOf((p) => work(m, true, p)));
    // Until 2026-10-16: emotional depth best on 90% of the briefs, listening on all 56 scenes and all 30 nights (H2).
    expect(most(briefs)).toBeLessThanOrEqual(0.5);
    expect(most(scenes)).toBeLessThanOrEqual(0.5);
    expect(most(nights)).toBeLessThanOrEqual(0.5);
  }, 120_000);
});

// ---------------------------------------------------------------------------------------------------------------
// 3. Stamina by length
// ---------------------------------------------------------------------------------------------------------------

describe('stamina counts by how long and how hard a piece is', () => {
  // Until 2026-10-16 (brief 10) this was 'loads a night as a whole evening, and a long brief more than a medium one', and
  // held a night's load at 0.6 or more whatever the play: the owner's decision 5 made a night's its running time's.
  it('loads a night by its running time, a one-act less than a whole evening, and a long brief more than a medium one', () => {
    const oneActs = ['The Bear', 'A Marriage Proposal', 'Riders To The Sea', 'Salomé', 'Trifles', 'Miss Julie'];
    const of = (title: string) => nightLoad(RUNNING_TIMES[title]!, { physical: 2, vocal: 1 }, 'lead').workload;
    for (const a of oneActs) for (const m of PLAY_MATERIAL.filter((x) => !oneActs.includes(x.id) && RUNNING_TIMES[x.id]!.minutes >= 150)) expect(of(a), `${a} against ${m.id}`).toBeLessThan(of(m.id));
    const b = BRIEF_BY_ID['brief-drama']!;
    expect(briefPiece(like(b, { size: 'long' }), {}).load).toBeGreaterThan(briefPiece(like(b, { size: 'medium' }), {}).load + 0.1);
  });

  // Until 2026-10-16 (brief 10) this was 'gives +10 stamina half a point or more on a night, on the mean of the plays, and
  // a tenth or less on a light brief', of a supporting part's night, which every night was then as to stamina: a whole
  // evening's lead. A night reads its part's share of the evening since, and the claim, a whole evening's, is a lead's:
  // 0.50 on the mean of the 30 plays, where a supporting part's is 0.32 and a featured part's 0.14 (measured 2026-10-16).
  it('gives +10 stamina half a point or more on a lead’s night, on the mean of the plays, less in a smaller part, and a tenth or less on a light brief', () => {
    const effect = (size: Participation) => { const xs = PLAY_MATERIAL.map((m) => work(m, true, plus(EVEN, 'stamina', 10), size) - work(m, true, EVEN, size)); return xs.reduce((a, x) => a + x, 0) / xs.length; };
    expect(effect('lead')).toBeGreaterThanOrEqual(0.5);
    expect(effect('supporting')).toBeLessThan(effect('lead'));
    expect(effect('featured')).toBeLessThan(effect('supporting'));
    const light = like(BRIEF_BY_ID['brief-drama']!, { size: 'short', physical: 0, vocal: 0 });
    // At the precision a take is kept to (from 2026-10-16: the genre's register left it at 0.1 and a float's remainder).
    expect(Math.round(effectOn(light, 'stamina') * 1000) / 1000).toBeLessThanOrEqual(0.1);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 4. What speeds a step
// ---------------------------------------------------------------------------------------------------------------

describe('listening and adaptability speed the steps their descriptions name', () => {
  const ratio = (lo: number, hi: number) => (STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * (hi / 100)) / (STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * (lo / 100));

  it('rehearses a brief on its feet further with more listening, against its reader, by the ratio of the two speeds; a voice brief by neither', () => {
    const moved = (listening: number, b: Brief) => {
      const sim = life('p2b-rehearse');
      clearDay(sim); rested(sim);
      attributesOf(sim, sim.player).listening = listening;
      recordOf(sim.player, b.id).prep.memorization = 0.5; // TEST SETUP: enough of the lines to rehearse.
      return prepareBrief(sim, sim.player, b, 'rehearse').moved;
    };
    const drama = BRIEF_BY_ID['brief-drama']!;
    // To the thousandth the part is kept to (`r3`).
    expect(moved(80, drama) / moved(20, drama)).toBeCloseTo(ratio(20, 80), 2);
    const voice = BRIEFS.find((b) => b.medium === 'voice')!;
    expect(moved(80, voice)).toBe(moved(20, voice));
  });

  it('PLAYER JOURNEY: an evening run with a reader in the partner’s place goes further with more listening, by the ratio of the two speeds', () => {
    const moved = (listening: number) => {
      const sim = life('p2b-reader');
      clearDay(sim); rested(sim);
      attributesOf(sim, sim.player).listening = listening;
      // TEST SETUP: a scene-study assignment, its table work answered as the text supports, as tests/attributes-phase-2a.test.ts sets one.
      const a: Assignment = {
        id: 'p2b-reader', course: 'DRAM 103a/b', template: 'scene-study', term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', sceneId: 'seagull-4', role: 0, partner: 0,
        prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), familiarity: 0.6, memorization: 0.6 } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
      };
      for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
      courseworkOf(sim, sim.player)!.assignments.push(a);
      mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
      const r = sim.execute<{ moved: number }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: READER.id } });
      expect(r.ok, r.error).toBe(true);
      return partnerPart(a);
    };
    // The step is practice in listening too, and that grows after the part has moved, so the ratio is the speeds'.
    expect(moved(80) / moved(20)).toBeCloseTo(ratio(20, 80), 6);
  });

  it('PLAYER JOURNEY: a director’s note on the blocking, worked into the part, goes further with more adaptability, by the ratio of the two speeds', () => {
    const moved = (adaptability: number) => {
      const sim = life('p2b-note');
      // The first spring's festival, cast on 4 January 2027, to the evening of its first rehearsal call, the day kept
      // rested as tests/direction.test.ts keeps it.
      sim.advanceTo(instantFromZoned({ year: 2027, month: 1, day: 4, hour: 9 }, 'America/New_York') + 60_000);
      const first = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((x, y) => x.at - y.at)[0]!;
      while (sim.now < first.at + 7 * MS_HOUR) { rested(sim); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(first.at + 7 * MS_HOUR, sim.now + 6 * MS_HOUR)); }
      const c = sim.player.school!.casting!;
      expect(hasProcess(c)).toBe(true);
      const proc = (c as unknown as { process: Process }).process;
      // TEST SETUP: the blocking half set and the director's last note on it, as a missed call leaves them.
      proc.blocking = 0.5;
      proc.notes.push({ at: sim.now, text: 'The blocking isn’t set in you.', focus: { kind: 'blocking' } });
      attributesOf(sim, sim.player).adaptability = adaptability;
      rested(sim);
      const r = sim.execute({ kind: 'school.work_note', payload: {} });
      expect(r.ok, r.error).toBe(true);
      return proc.blocking - 0.5;
    };
    // To a thousandth: the note is practice in adaptability (`ordinary`), and that hair of growth lands before the speed is read.
    expect(moved(80) / moved(20)).toBeCloseTo(ratio(20, 80), 3);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 5. A4: what the game says each ability does, and what develops it (brief 11)
// ---------------------------------------------------------------------------------------------------------------

/** A judged piece, by any performer (FIXTURE: fully prepared, readiness 100, no draw, as the game builds each). */
type Judged = (p: Performer) => Evaluation;
/** The scene a template sets, by its kind of material (TEST SETUP: one the courses set). */
const SCENE_FOR: Readonly<Record<string, string>> = { scene: 'seagull-4', 'verse-scene': 'hamlet-3-1', 'greek-scene': 'antigone-441' };
/** A coursework template's work as `judgeWork` judges it: its scene where it sets one, in its units (`scenePiece`); whole where not. */
function templateWork(template: string): Judged {
  const t = templateById(template)!;
  const a = { id: `p2b-${template}`, course: t.courses[0]!, template, term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', ...(t.material !== 'none' ? { sceneId: SCENE_FOR[t.material] } : {}), role: 0, partner: 0, prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 1])), answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open' } as unknown as Assignment;
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
  const parts = Object.fromEntries(Object.keys(t.dims).map((d) => [d, 1]));
  const ctx = { ...workContext(a, parts, Object.fromEntries(Object.keys(parts).map((d) => [d, EVALUATION.complete.coursework]))), condition: { readiness: 100 }, key: `p2b:${template}`, expected: true };
  const piece = scenePiece(a);
  return (p) => (piece ? judgePiece('p2b', p, ctx, piece) : judge('p2b', p, ctx));
}
/** An audition shown on a scene (TEST SETUP: Two Contrasting Monologues on it). */
function auditionOn(sceneId: string): Judged {
  const t = templateById('audition-pair')!;
  const a = { id: `p2b-audition-${sceneId}`, course: t.courses[0]!, template: t.id, term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', sceneId, role: 0, partner: 0, prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 1])), answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open' } as unknown as Assignment;
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
  const parts = Object.fromEntries(Object.keys(t.dims).map((d) => [d, 1]));
  const ctx = { ...workContext(a, parts, Object.fromEntries(Object.keys(parts).map((d) => [d, EVALUATION.complete.coursework]))), condition: { readiness: 100 }, key: `p2b:audition:${sceneId}`, expected: true };
  const piece = scenePiece(a)!;
  return (p) => judgePiece('p2b', p, ctx, piece);
}
/** Every piece of each kind of work, by the task it's judged as: every template, every brief at its first reading, every class scene, every night. */
const PIECES_BY_TASK: Readonly<Record<string, readonly Judged[]>> = (() => {
  const out: Record<string, Judged[]> = {};
  const add = (j: Judged) => { (out[j(EVEN).task] ??= []).push(j); };
  for (const t of TEMPLATES) add(templateWork(t.id));
  for (const b of BRIEFS) { const pc = briefReadingPiece(b.id, b.readings[0]!.id); add((p) => pc.judge(p)); }
  for (const m of SCENE_MATERIAL) { const pc = gamePiece(m, 'scene'); add((p) => pc.judge(p)); }
  for (const m of PLAY_MATERIAL) { const pc = gamePiece(m, 'night'); add((p) => pc.judge(p)); }
  return out;
})();
const dimsOf = (e: Evaluation): Partial<Record<Dimension, number>> => Object.fromEntries(e.dimensions.map((d) => [d.dimension, d.exact ?? d.quality]));
/** The dimensions of a piece +10 on an ability moves, at full precision, from the even actor. */
const movedBy = (j: Judged, a: AbilityId): Dimension[] => { const lo = dimsOf(j(EVEN)), hi = dimsOf(j(plus(EVEN, a, 10))); return (Object.keys(lo) as Dimension[]).filter((d) => Math.abs((hi[d] ?? 0) - lo[d]!) > 1e-9); };
/** Each named dimension of every piece of a task moves with the ability. */
function readsIn(a: AbilityId, task: string, dims: readonly Dimension[]): void {
  const pieces = PIECES_BY_TASK[task]!;
  expect(pieces.length, task).toBeGreaterThan(0);
  for (const [i, j] of pieces.entries()) { const m = movedBy(j, a); for (const d of dims) expect(m, `${a}: ${task} piece ${i}, ${d}`).toContain(d); }
}
/** The mean effect of +10 on an ability over pieces, on the whole at full precision. */
const meanEffect = (pieces: readonly Judged[], a: AbilityId) => pieces.reduce((s, j) => s + (j(plus(EVEN, a, 10)).exact! - j(EVEN).exact!), 0) / pieces.length;
/** The effect of +10 on one dimension of a brief like another, at full precision. */
const dimEffectOn = (b: Brief, a: AbilityId, d: Dimension, playing?: { scale?: 'restrained' | 'expansive' }) => {
  const at = (p: Performer) => {
    const rec = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
    const ctx = briefContext(nobody, b, rec, { reading: b.readings[0]!.id, prep: { genre: 1, ...(playing ? { approach: 1 } : {}) }, ...(playing ? { playing: { ...playing, chosenAt: 0, prep: 1 } } : {}) });
    return dimsOf(judgePiece('p2b', p, { ...ctx, condition: { readiness: 100 }, key: 'p2b', expected: true }, briefPiece(b, { ...rec, reading: b.readings[0]!.id })))[d] ?? 0;
  };
  return at(plus(EVEN, a, 10)) - at(EVEN);
};
const exactEffectOn = (b: Brief, a: AbilityId) => take(b, plus(EVEN, a, 10), 1).exact! - take(b, EVEN, 1).exact!;
/** A night of a part of a size, as the game reads one: its workload and its text by the part's time on stage (`withPart`). */
function nightOfPart(m: MaterialProfile, size: Participation): Judged {
  const task = TASK_PROFILES.performance!;
  const spec = nightPiece(m, runningOf({ play: m.id }), size);
  const read = materialContext(task, withPart(m, spec.night!));
  return (p) => judgePiece('p2b', p, { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep: { lines: 1, blocking: 1, notes: 1 }, required: { lines: 0.9, blocking: 0.9, notes: 0.9 }, difficulty: NIGHT_DIFFICULTY.school.supporting, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: 'p2b', expected: true }, spec);
}
/** How far a step goes at an ability's two levels, the step taken through its command on a fresh life (TEST SETUP: the ability set, the day rested). */
function stepRatio(a: AbilityId, step: (sim: Simulation) => number, lo = 20, hi = 80): number {
  const at = (level: number) => { const sim = life(`p2b-a4-${a}`); freeAndRested(sim); setAbility(sim, a, level); return step(sim); };
  return at(hi) / at(lo);
}
const speedRatio = (lo: number, hi: number) => (STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * (hi / 100)) / (STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * (lo / 100));
/** TEST SETUP: an assignment of a template on a scene, its parts as given, the table work answered as the text supports. */
function assignment(sim: Simulation, template: string, prep: Partial<Record<string, number>> = {}, sceneId?: string): Assignment {
  const t = templateById(template)!;
  const a: Assignment = {
    id: `p2b-${template}-${courseworkOf(sim, sim.player)!.assignments.length}`, course: t.courses[0]!, template, term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', ...(t.material !== 'none' ? { sceneId: sceneId ?? SCENE_FOR[t.material] } : {}), role: 0, partner: 0,
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), ...prep } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  } as Assignment;
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
  courseworkOf(sim, sim.player)!.assignments.push(a);
  mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
  return a;
}
const prepared = (sim: Simulation, a: Assignment, activity: string) => { const r = sim.execute<{ moved: number }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity } }); expect(r.ok, `${a.template}/${activity}: ${r.error}`).toBe(true); return r.value!.moved; };
/**
 * TEST SETUP: a part cast with its process, as a casting leaves one, and its calls booked: a rehearsal call the next day
 * and a performance three days on, each kept (`payload.kept`) through what `freeAndRested` clears. What a casting's first
 * week holds, without the four months of play to it (tests/direction.test.ts plays them).
 */
function cast(sim: Simulation, process: Partial<Process> = {}): { call: number; night: number } {
  const p = sim.player;
  p.school!.casting = { production: 'A Test Play', role: 'A Part In A New Play', kind: 'carlotta', term: 0, performed: 0, process: { lines: 0.2, blocking: 0.5, calls: 0, blockingMissed: 0, notes: [], trained: 0, ...process } } as never;
  const call = sim.now + 26 * MS_HOUR, night = call + 3 * MS_DAY;
  sim.schedule({ at: call, kind: CALL_KIND, label: 'A Test Play: Rehearsal', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 180, payload: { personId: p.id, call: 'rehearsal', kept: true } });
  sim.schedule({ at: night, kind: CALL_KIND, label: 'A Test Play: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 150, payload: { personId: p.id, call: 'performance', kept: true } });
  return { call, night };
}
/** An evening with the partner asked for, at the first hour from a day on that they take (through `school.ask_partner`); its time. */
function askedFor(sim: Simulation, a: Assignment): number {
  for (let k = 26; k < 26 + 72; k += 1) {
    const when = sim.now + k * MS_HOUR;
    const r = sim.execute<{ accepted: boolean }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: when } });
    if (r.ok && r.value!.accepted) return when;
  }
  throw new Error(`no evening ${a.id}'s partner would take`);
}
const procOf = (sim: Simulation) => (sim.player.school!.casting as unknown as { process: Process }).process;

/**
 * Each ability's two sentences, clause by clause (`ABILITY_DEFS[].develops` and `.affects`), with what holds each. The
 * develops clauses read the development history of one played save (`grownBy`); the affects clauses work the judge, the
 * steps and the clock. A clause is the sentence's own words, so a rewritten sentence fails the GUARD below until its
 * clauses are held again.
 */
type Clause = { says: string; holds: () => void };
const grows: Partial<Record<AbilityId, Clause[]>> = {};
const does: Partial<Record<AbilityId, Clause[]>> = {};
/** What the develops journey grew, by ability and source (filled by its test, read by the clauses). */
const grownBy = (a: AbilityId, source: RegExp): number => developmentOf(DEVELOPED.sim!.player).history.filter((x) => x.id === a && source.test(x.source)).reduce((s, x) => s + x.delta, 0);
const DEVELOPED: { sim?: Simulation; at: Record<string, number> } = { at: {} };
const grew = (a: AbilityId, ...sources: RegExp[]) => () => { for (const s of sources) expect(grownBy(a, s), `${a} from ${s}`).toBeGreaterThan(0); };

const BASE = BRIEF_BY_ID['brief-drama']!;
const turning = (n: number) => Array.from({ length: n }, (_, i) => ({ what: 'A beat.', tones: [i % 2 ? 'comic' : 'grave'] as ['comic' | 'grave'] }));

grows.emotionalDepth = [
  { says: 'Scene study and its classes', holds: grew('emotionalDepth', /^class:DRAM 103a\/b$/) },
  { says: 'performing', holds: grew('emotionalDepth', /^night:/) },
  { says: 'the sense-memory exercise', holds: grew('emotionalDepth', /^practice:sense-memory$/) },
];
does.emotionalDepth = [
  { says: 'Believability in every piece of performed work (a scene, a song, an improvisation, a clown turn, a self-tape, a taped brief, an audition, a night on stage)', holds: () => { for (const t of ['scene', 'song', 'improvisation', 'clown', 'camera', 'tape', 'tapeOnFeet', 'audition', 'performance']) readsIn('emotionalDepth', t, ['believability']); } },
  { says: 'most where the piece is played grave', holds: () => expect(effectOn(like(BASE, { beats: beatsOf(3, 'grave') }), 'emotionalDepth')).toBeGreaterThan(effectOn(like(BASE, { beats: beatsOf(3, 'comic') }), 'emotionalDepth') + 0.3) },
  { says: 'connection in a fight or an intimacy scene shown with a partner', holds: () => readsIn('emotionalDepth', 'partnered', ['connection']) },
];

grows.presence = [
  { says: 'Nights in front of a house, a little at a time', holds: () => { expect(grownBy('presence', /^nerves:performance$/)).toBeGreaterThan(0); expect(DEVELOPED.at.nightPresence).toBeCloseTo(ATTRIBUTES.presenceGain * (100 - DEVELOPED.at.presenceBefore!) * DEVELOPED.at.lift!, 9); } },
  { says: 'more on a remarkable night', holds: grew('presence', /^night$/) },
  { says: 'a showing for classmates', holds: grew('presence', /^practice:showing-for-classmates$/) },
  { says: 'what graded exposure and a clown practice carry over', holds: grew('presence', /^transfer:graded-exposure$/, /^transfer:clown-practice$/) },
];
does.presence = [
  { says: 'Connection in performance, an audition, a clown turn, a scene and a taped brief', holds: () => { for (const t of ['performance', 'audition', 'clown', 'scene', 'tape', 'tapeOnFeet']) readsIn('presence', t, ['connection']); } },
  { says: 'more the less of a partner the piece has to play off', holds: () => expect(exactEffectOn(like(BASE, { partner: 0 }), 'presence')).toBeGreaterThan(exactEffectOn(like(BASE, { partner: 3 }), 'presence') + 0.3) },
  { says: 'more on a night in front of a house than in a scene, an audition or a taped brief', holds: () => { const night = meanEffect(PIECES_BY_TASK.performance!, 'presence'); for (const t of ['scene', 'audition', 'tape', 'tapeOnFeet']) expect(night, t).toBeGreaterThan(meanEffect(PIECES_BY_TASK[t]!, 'presence')); } },
];

grows.listening = [
  { says: 'Partner rehearsals', holds: grew('listening', /^partner-rehearsal$/) },
  { says: 'scene study and improvisation classes', holds: grew('listening', /^class:DRAM 103a\/b$/, /^class:DRAM 153a$/) },
  { says: 'every night in front of a house', holds: grew('listening', /^night$/) },
  { says: 'the improvisation game', holds: () => { expect(DEVELOPED.at.gameListening).toBeGreaterThan(0); grew('listening', /^transfer:improv-session$/)(); } },
  { says: 'the repetition exercise', holds: grew('listening', /^practice:repetition$/) },
];
does.listening = [
  { says: 'Responsiveness and connection in partnered work and performance', holds: () => { readsIn('listening', 'partnered', ['responsiveness', 'connection']); readsIn('listening', 'performance', ['responsiveness', 'connection']); } },
  { says: 'more the more the piece is built on a partner and on timing', holds: () => { expect(exactEffectOn(like(BASE, { partner: 3 }), 'listening')).toBeGreaterThan(exactEffectOn(like(BASE, { partner: 0 }), 'listening')); expect(exactEffectOn(like(BASE, { timing: 3 }), 'listening')).toBeGreaterThan(exactEffectOn(like(BASE, { timing: 0 }), 'listening')); } },
  { says: 'how far an evening rehearsing with a partner or a reader goes', holds: () => {
    // With a reader: the evening's own move, by the ratio of the two speeds (as block 4 plays it).
    expect(stepRatio('listening', (sim) => { const a = assignment(sim, 'scene-study', { familiarity: 0.6, memorization: 0.6 }); prepared(sim, a, READER.id); return partnerPart(a); })).toBeCloseTo(speedRatio(20, 80), 6);
    // With the partner: an evening asked for and kept (TEST SETUP: the partner as reliable as one comes).
    expect(stepRatio('listening', (sim) => { const a = assignment(sim, 'scene-study', { familiarity: 0.6, memorization: 0.6 }); mateRecord(sim.player.school!.classmates[0]!).reliability = 1; const when = askedFor(sim, a); tended(sim, when + 3 * MS_HOUR); expect(a.rehearsals[0]!.status).toBe('kept'); return a.prep.partner; })).toBeCloseTo(speedRatio(20, 80), 6);
  } },
  { says: 'a brief rehearsed on its feet against its reader', holds: () => expect(stepRatio('listening', (sim) => { recordOf(sim.player, BASE.id).prep.memorization = 0.5; return prepareBrief(sim, sim.player, BASE, 'rehearse').moved; })).toBeCloseTo(speedRatio(20, 80), 2) },
];

grows.imagination = [
  { says: 'The table work of coursework', holds: grew('imagination', /^prepare:interpretation$/) },
  { says: 'breaking a brief down', holds: grew('imagination', /^brief:interpretation$/) },
  { says: 'character and script analysis classes', holds: grew('imagination', /^class:DRAM 103a\/b$/, /^class:DRAM 873a\/b$/) },
  { says: 'reading plays', holds: grew('imagination', /^read:/) },
  { says: 'the given-circumstances exercise', holds: grew('imagination', /^practice:given-circumstances$/) },
];
does.imagination = [
  { says: 'Interpretation in every task that asks one', holds: () => { for (const t of Object.values(TASK_PROFILES).filter((x) => x.dims.interpretation)) readsIn('imagination', t.id, ['interpretation']); } },
  { says: 'more where the language is heightened or verse, a beat is held two ways, or the piece is lyric or grotesque', holds: () => {
    const plain = dimEffectOn(like(BASE, { language: 'everyday', beats: beatsOf(3, 'grave') }), 'imagination', 'interpretation');
    for (const over of [{ language: 'heightened' as const }, { language: 'verse' as const }]) expect(dimEffectOn(like(BASE, { ...over, beats: beatsOf(3, 'grave') }), 'imagination', 'interpretation'), over.language).toBeGreaterThan(plain);
    expect(dimEffectOn(like(BASE, { language: 'everyday', beats: [...beatsOf(2, 'grave'), { what: 'A beat.', tones: ['grave', 'comic'] }] }), 'imagination', 'interpretation')).toBeGreaterThan(plain);
    for (const tone of ['lyric', 'grotesque'] as const) expect(dimEffectOn(like(BASE, { language: 'everyday', beats: beatsOf(3, tone as never) }), 'imagination', 'interpretation'), tone).toBeGreaterThan(plain);
  } },
  { says: 'a little of believability', holds: () => { for (const t of ['scene', 'tape', 'performance']) { readsIn('imagination', t, ['believability']); for (const j of PIECES_BY_TASK[t]!.slice(0, 10)) { const d = (a: AbilityId) => dimsOf(j(plus(EVEN, a, 10))).believability! - dimsOf(j(EVEN)).believability!; expect(d('imagination'), t).toBeLessThan(d('emotionalDepth')); } } } },
  { says: 'how far a step of table work or a brief’s breakdown goes', holds: () => {
    expect(stepRatio('imagination', (sim) => prepared(sim, assignment(sim, 'song'), 'song-text'))).toBeCloseTo(speedRatio(20, 80), 6);
    expect(stepRatio('imagination', (sim) => prepareBrief(sim, sim.player, BASE, 'read').moved)).toBeCloseTo(speedRatio(20, 80), 2);
  } },
];

grows.focus = [
  { says: 'Attentive preparation done well-rested', holds: () => { expect(grownBy('focus', /^prepare:familiarity$/)).toBeGreaterThan(0); expect(DEVELOPED.at.focusRested).toBeGreaterThan(DEVELOPED.at.focusTired!); } },
  { says: 'the concentration exercise', holds: grew('focus', /^practice:concentration$/) },
];
does.focus = [
  { says: 'How far a step getting to know coursework’s material goes', holds: () => expect(stepRatio('focus', (sim) => prepared(sim, assignment(sim, 'scene-study'), 'read'))).toBeCloseTo(speedRatio(20, 80), 6) },
  { says: 'interpretation and execution in written work', holds: () => readsIn('focus', 'written', ['interpretation', 'execution']) },
  { says: 'execution in voice work, a self-tape and a taped brief', holds: () => { for (const t of ['voice', 'camera', 'tape', 'tapeOnFeet']) readsIn('focus', t, ['execution']); } },
  { says: 'more where the material is built on timing, played comic, or in heightened or verse language', holds: () => {
    const plain = dimEffectOn(like(BASE, { timing: 0, language: 'everyday', beats: beatsOf(3, 'grave') }), 'focus', 'execution');
    for (const over of [{ timing: 3 as const }, { beats: beatsOf(3, 'comic') }, { language: 'heightened' as const }, { language: 'verse' as const }]) expect(dimEffectOn(like(BASE, { timing: 0, language: 'everyday', beats: beatsOf(3, 'grave'), ...over }), 'focus', 'execution'), JSON.stringify(over).slice(0, 40)).toBeGreaterThan(plain);
  } },
  { says: 'consistency in any piece played Restrained, the inner line held through it', holds: () => { const b = like(BASE, { stakes: 0 }); expect(dimEffectOn(b, 'focus', 'consistency')).toBe(0); expect(dimEffectOn(b, 'focus', 'consistency', { scale: 'restrained' })).toBeGreaterThan(0); } },
  { says: 'holding movement and partnered physical work steady', holds: () => { readsIn('focus', 'movement', ['consistency']); readsIn('focus', 'partnered', ['consistency']); } },
  { says: 'The day’s focus is another thing: how ready you come to the hour.', holds: () => {
    const sim = life('p2b-a4-dayfocus'); freeAndRested(sim);
    const day = () => focusAt(sim, sim.player, sim.now);
    const rested = day();
    setAbility(sim, 'focus', 10); expect(day()).toBe(rested); setAbility(sim, 'focus', 95); expect(day()).toBe(rested);
    sim.player.wellbeing.energy = 20; expect(day()).toBeLessThan(rested);
  } },
];

grows.memory = [
  { says: 'Learning lines', holds: grew('memory', /^prepare:memorization$/, /^brief:memorization$/) },
  { says: 'the recall drill', holds: grew('memory', /^practice:recall-drill$/) },
  { says: 'learning a part', holds: grew('memory', /^learn-part$/) },
];
does.memory = [
  { says: 'How far a step learning lines goes (a scene’s, a brief’s, a part’s)', holds: () => {
    expect(stepRatio('memory', (sim) => prepared(sim, assignment(sim, 'scene-study', { familiarity: 0.6 }), 'learn'))).toBeCloseTo(speedRatio(20, 80), 6);
    expect(stepRatio('memory', (sim) => prepareBrief(sim, sim.player, BASE, 'lines').moved)).toBeCloseTo(speedRatio(20, 80), 2);
    expect(stepRatio('memory', (sim) => { cast(sim); const before = procOf(sim).lines; expect(sim.execute({ kind: 'school.learn_part', payload: {} }).ok).toBe(true); return procOf(sim).lines - before; })).toBeCloseTo(speedRatio(20, 80), 6);
  } },
  { says: 'execution wherever a part’s lines are spoken (a scene, a self-tape, a taped brief, an audition, a night)', holds: () => { for (const t of ['scene', 'camera', 'tape', 'tapeOnFeet', 'audition', 'performance']) readsIn('memory', t, ['execution']); } },
  { says: 'more the longer the text: a medium or long brief, verse, and a whole part on a night', holds: () => {
    const short = exactEffectOn(like(BASE, { size: 'short' }), 'memory');
    expect(exactEffectOn(like(BASE, { size: 'medium' }), 'memory')).toBeGreaterThan(short);
    expect(exactEffectOn(like(BASE, { size: 'long' }), 'memory')).toBeGreaterThan(exactEffectOn(like(BASE, { size: 'medium' }), 'memory'));
    expect(dimEffectOn(like(BASE, { language: 'verse' }), 'memory', 'execution')).toBeGreaterThan(dimEffectOn(like(BASE, { language: 'everyday' }), 'memory', 'execution'));
    expect(meanEffect(PIECES_BY_TASK.performance!, 'memory')).toBeGreaterThan(meanEffect(PIECES_BY_TASK.scene!, 'memory'));
  } },
  { says: 'more the longer the part is on stage', holds: () => { const m = PLAY_MATERIAL.find((x) => x.id === 'Major Barbara')!; expect(meanEffect([nightOfPart(m, 'lead')], 'memory')).toBeGreaterThan(meanEffect([nightOfPart(m, 'featured')], 'memory')); } },
];

grows.adaptability = [
  { says: 'Revising after a note', holds: grew('adaptability', /^prepare:revision$/) },
  { says: 'working a director’s note', holds: grew('adaptability', /^work-note$/) },
  { says: 'the improvisation game', holds: grew('adaptability', /^transfer:improv-session$/, /^class:DRAM 153a$/) },
];
does.adaptability = [
  { says: 'Responsiveness', holds: () => { for (const t of Object.values(TASK_PROFILES).filter((x) => x.dims.responsiveness)) readsIn('adaptability', t.id, ['responsiveness']); } },
  { says: 'holding a change of tone', holds: () => expect(dimEffectOn(like(BASE, { beats: turning(4) }), 'adaptability', 'believability')).toBeGreaterThan(dimEffectOn(like(BASE, { beats: beatsOf(4, 'grave') }), 'adaptability', 'believability')) },
  { says: 'recovering from a slip and covering a partner’s', holds: () => { recovers('adaptability'); covers('adaptability'); } },
  { says: 'how far a step of revision after a note goes, so a note is taken sooner', holds: () => {
    expect(stepRatio('adaptability', (sim) => prepared(sim, revising(sim), 'revise'))).toBeCloseTo(speedRatio(20, 80), 6);
    // Steps to the note taken, at a tired day's focus and a rested one's: never more with more adaptability, fewer where a step falls short.
    const steps = (adaptability: number, energy: number) => { const sim = life('p2b-a4-revise'); freeAndRested(sim); setAbility(sim, 'adaptability', adaptability); const a = revising(sim); let n = 0; while (!noteTaken(sim.player, a, '2026-09-21') && n < 12) { freeAndRested(sim); sim.player.wellbeing.energy = energy; prepared(sim, a, 'revise'); n += 1; } return n; };
    const pairs = [100, 40, 15].map((e) => [steps(20, e), steps(80, e)] as const);
    for (const [lo, hi] of pairs) expect(hi).toBeLessThanOrEqual(lo);
    expect(pairs.some(([lo, hi]) => hi < lo), JSON.stringify(pairs)).toBe(true);
  } },
  { says: 'how far a director’s note on the blocking goes when it’s worked into a part', holds: () => expect(stepRatio('adaptability', (sim) => { cast(sim); const proc = procOf(sim); proc.notes.push({ at: sim.now, text: 'The blocking isn’t set in you.', focus: { kind: 'blocking' } } as never); expect(sim.execute({ kind: 'school.work_note', payload: {} }).ok).toBe(true); return proc.blocking - 0.5; })).toBeCloseTo(speedRatio(20, 80), 3) },
];

grows.composure = [
  { says: 'Every night in front of a house and a solo showing, a little, as performance anxiety falls with exposure', holds: () => { expect(DEVELOPED.at.nightComposure).toBeCloseTo(ATTRIBUTES.composureGain.performance * (100 - DEVELOPED.at.composureBefore!) * DEVELOPED.at.lift!, 9); expect(DEVELOPED.at.soloComposure).toBeGreaterThan(0); } },
  { says: 'the graded-exposure exercise', holds: grew('composure', /^practice:graded-exposure$/) },
  { says: 'what concentration and a showing for classmates carry over', holds: grew('composure', /^transfer:concentration$/, /^transfer:showing-for-classmates$/) },
];
does.composure = [
  { says: 'Consistency under pressure, more the more rides on the piece (a brief’s stakes)', holds: () => { for (const t of ['scene', 'song', 'camera', 'tape', 'audition', 'performance']) readsIn('composure', t, ['consistency']); expect(effectOn(like(BASE, { stakes: 3 }), 'composure')).toBeGreaterThan(effectOn(like(BASE, { stakes: 0 }), 'composure') + 0.3); } },
  { says: 'on a night in front of a house, more than in a scene shown in class', holds: () => expect(meanEffect(PIECES_BY_TASK.performance!, 'composure')).toBeGreaterThan(meanEffect(PIECES_BY_TASK.scene!, 'composure')) },
  { says: 'a little of believability where the stakes are high', holds: () => { expect(dimEffectOn(like(BASE, { stakes: 0, beats: beatsOf(3, 'grave') }), 'composure', 'believability')).toBe(0); expect(dimEffectOn(like(BASE, { stakes: 3, beats: beatsOf(3, 'grave') }), 'composure', 'believability')).toBeGreaterThan(0); } },
  { says: 'believability in any piece played Restrained, the calm that lets a held feeling read', holds: () => { const b = like(BASE, { stakes: 0, beats: beatsOf(3, 'grave') }); expect(dimEffectOn(b, 'composure', 'believability', { scale: 'restrained' })).toBeGreaterThan(0); } },
  { says: 'recovering from a slip', holds: () => recovers('composure') },
  { says: 'the stress nerves add before a performance', holds: () => { const sim = life('p2b-a4-nerves'); const at = (c: number) => { setAbility(sim, 'composure', c); sim.player.wellbeing.stress = 0; nerves(sim, sim.player, 'performance'); return sim.player.wellbeing.stress; }; expect(at(90)).toBeLessThan(at(30)); } },
];

grows.vocal = [
  { says: 'The voice classes', holds: grew('vocal', /^class:DRAM 113a\/b$/) },
  { says: 'sequences', holds: grew('vocal', /^coursework:practice$/) },
  { says: 'songs', holds: () => { expect(DEVELOPED.at.songVocal).toBeGreaterThan(0); grew('vocal', /^transfer:singing-practice$/)(); } },
  { says: 'the vocal exercise', holds: grew('vocal', /^practice:voice-work$/) },
];
does.vocal = [{ says: 'Execution in voice work, songs, classical text and performance', holds: () => { for (const t of ['voice', 'song', 'performance']) readsIn('vocal', t, ['execution']); expect(movedBy(templateWork('classical-scene'), 'vocal')).toContain('execution'); expect(dimEffectOn(like(BASE, { language: 'verse' }), 'vocal', 'execution')).toBeGreaterThan(dimEffectOn(like(BASE, { language: 'everyday' }), 'vocal', 'execution')); } }];

grows.physical = [
  { says: 'The movement and Alexander classes', holds: grew('physical', /^class:DRAM 133a\/b$/, /^class:DRAM 143a\/b$/) },
  { says: 'movement scores', holds: grew('physical', /^coursework:rehearse-score$/) },
  { says: 'fights', holds: () => { expect(DEVELOPED.at.fightPhysical).toBeGreaterThan(0); grew('physical', /^transfer:combat-drill$/)(); } },
  { says: 'the movement exercise', holds: grew('physical', /^practice:movement-work$/) },
];
does.physical = [{ says: 'Execution in movement, fights, intimacy work and performance', holds: () => { for (const t of ['movement', 'partnered', 'performance']) readsIn('physical', t, ['execution']); for (const t of ['fight-sequence', 'intimacy-practice']) expect(movedBy(templateWork(t), 'physical'), t).toContain('execution'); } }];

grows.discipline = [
  { says: 'Practice on days running', holds: () => expect(DEVELOPED.at.practiceDays).toBe(DEVELOPED.at.daysPractised) },
  { says: 'attending every call', holds: grew('discipline', /^call$/) },
];
does.discipline = [
  { says: 'How much what classes, nights, steps and practice grow counts for, a tenth more at 100 and a tenth less at 0', holds: () => {
    const lift = (grow: (sim: Simulation) => number) => { const at = (d: number) => { const sim = life('p2b-a4-lift'); freeAndRested(sim); setAbility(sim, 'discipline', d); return grow(sim); }; return at(100) / at(0); };
    for (const source of ['class:TEST', 'night:TEST']) expect(lift((sim) => { const s = sim.player.craft!.scene; grewFrom(sim, sim.player, source, 1, [['scene', 1]]); return sim.player.craft!.scene - s; }), source).toBeCloseTo(1.1 / 0.9, 9);
    expect(lift((sim) => { const a = assignment(sim, 'scene-study'); const f = abilityOf(sim, sim.player, 'focus'); prepared(sim, a, 'read'); return abilityOf(sim, sim.player, 'focus') - f; })).toBeCloseTo(1.1 / 0.9, 9);
    expect(lift((sim) => { const r = sim.execute<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: 'concentration' } }); expect(r.ok, r.error).toBe(true); return r.value!.gained; })).toBeCloseTo(1.1 / 0.9, 9);
  } },
  { says: '(a workout’s fitness aside)', holds: () => { const at = (d: number) => { const sim = life('p2b-a4-workout'); freeAndRested(sim); setAbility(sim, 'discipline', d); const f = sim.player.wellbeing.fitness; expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true); return sim.player.wellbeing.fitness - f; }; expect(at(100)).toBe(at(0)); } },
  { says: 'consistency in every task that asks it', holds: () => { for (const t of Object.values(TASK_PROFILES).filter((x) => x.dims.consistency && x.id !== 'audition')) readsIn('discipline', t.id, ['consistency']); } },
  { says: 'an audition’s only by its beats, where nerves are what’s held', holds: () => {
    // An audition shown on a scene of three units (A Doll's House, its third act) reads none; on six (The Seagull, its fourth), three beats past three.
    expect(movedBy(auditionOn('dollhouse-3'), 'discipline')).not.toContain('consistency');
    expect(movedBy(auditionOn('seagull-4'), 'discipline')).toContain('consistency');
    expect(movedBy(auditionOn('dollhouse-3'), 'composure')).toContain('consistency');
  } },
  { says: 'more the more beats a piece holds and on a night of a run', holds: () => { expect(effectOn(like(BASE, { beats: beatsOf(6, 'grave') }), 'discipline')).toBeGreaterThan(effectOn(like(BASE, { beats: beatsOf(3, 'grave') }), 'discipline') + 0.2); expect(meanEffect(PIECES_BY_TASK.performance!, 'discipline')).toBeGreaterThan(meanEffect(PIECES_BY_TASK.scene!, 'discipline')); } },
  { says: 'execution in physical work set to a score', holds: () => { expect(dimEffectOn(like(BASE, { physical: 0 }), 'discipline', 'execution')).toBe(0); expect(dimEffectOn(like(BASE, { physical: 3 }), 'discipline', 'execution')).toBeGreaterThan(0); } },
  { says: 'execution in written work', holds: () => readsIn('discipline', 'written', ['execution']) },
];

grows.stamina = [
  { says: 'Workouts', holds: grew('stamina', /^workout/) },
  { says: 'more on a run in fine weather', holds: () => expect(DEVELOPED.at.run! / DEVELOPED.at.indoors!).toBeCloseTo(TRAINING.run / TRAINING.indoors, 9) },
  { says: 'held three days after each', holds: () => expect(DEVELOPED.at.heldFor).toBe(FITNESS.heldDays) },
  { says: 'lost past that, as fitness is', holds: () => expect(DEVELOPED.at.fellADay).toBeCloseTo(FITNESS.perDay, 9) },
];
does.stamina = [
  { says: 'In a piece played through in parts (a scene, a brief, a night on stage), how much of the later parts it holds', holds: () => {
    for (const t of ['scene', 'tape', 'performance']) for (const j of PIECES_BY_TASK[t]!.slice(0, 12)) {
      const seg = (p: Performer) => j(p).piece!.segments.map((s) => s.drain);
      const lo = seg(EVEN), hi = seg(plus(EVEN, 'stamina', 30)), full = seg({ ...EVEN, ability: (a) => (a === 'stamina' ? 100 : 50) });
      // A scene's and a brief's first part is untouched; a night's tires from the curtain up, its later parts the more.
      if (t !== 'performance') expect(lo[0], t).toBe(1);
      expect(lo.at(-1)!, t).toBeLessThan(lo[0]!);
      expect(hi.at(-1)!, t).toBeGreaterThan(lo.at(-1)!);
      expect(full.every((x) => x === 1), t).toBe(true);
    }
  } },
  { says: 'more the longer the piece and the more of the body’s and the voice’s work it asks', holds: () => { const light = like(BASE, { size: 'short', physical: 0, vocal: 0 }); for (const over of [{ size: 'long' as const }, { physical: 3 as const }, { vocal: 3 as const }]) expect(exactEffectOn(like(light, over), 'stamina'), JSON.stringify(over)).toBeGreaterThan(exactEffectOn(light, 'stamina')); } },
  { says: 'a night by its workload, the production’s running time, your part’s share of it and its intensity, less after an interval', holds: () => {
    const rt = RUNNING_TIMES['Hedda Gabler']!;
    const w = (over: Partial<typeof rt>, size: Participation = 'supporting', m = { physical: 1, vocal: 1 }) => nightLoad({ ...rt, ...over }, m, size).workload;
    expect(w({ minutes: rt.minutes + 60 })).toBeGreaterThan(w({}));
    expect(w({}, 'lead')).toBeGreaterThan(w({}, 'supporting'));
    expect(w({}, 'supporting', { physical: 3, vocal: 2 })).toBeGreaterThan(w({}));
    // The drain just after an interval is less than just before it, and less than the same evening played straight through.
    const n = nightLoad(rt, { physical: 1, vocal: 1 }, 'lead');
    const straight = nightLoad({ ...rt, breaks: [] }, { physical: 1, vocal: 1 }, 'lead');
    expect(rt.breaks.length).toBeGreaterThan(0);
    const halves = [{ label: 'a', tones: [], weight: 1, turnInto: false, blend: false }, { label: 'b', tones: [], weight: 1, turnInto: false, blend: false }];
    expect(segmentShares(n, halves)[1]!).toBeLessThan(segmentShares(straight, halves)[1]!);
  } },
  { says: 'the energy a night costs afterward, up to half of it spared at full', holds: () => { const n = nightLoad(RUNNING_TIMES['Hedda Gabler']!, { physical: 1, vocal: 1 }, 'lead'); expect(eveningCost(n, 1, 100).energy).toBeCloseTo(eveningCost(n, 0, 100).energy / 2, 9); expect(eveningCost(n, 0.5, 100).energy).toBeLessThan(eveningCost(n, 0, 100).energy); } },
  { says: 'in work shown whole without a scene (voice work, a song, movement, a fight), consistency', holds: () => { for (const t of ['voice-sequence', 'song', 'movement-score', 'fight-sequence']) expect(movedBy(templateWork(t), 'stamina'), t).toEqual(['consistency']); } },
];

/** TEST SETUP: a scene shown and its note on the partner part read, the work back for revision, as a showing leaves it. */
function revising(sim: Simulation): Assignment {
  const a = assignment(sim, 'scene-study', { familiarity: 0.6, memorization: 0.6, rehearsal: 0.6, partner: 0.3 });
  a.status = 'revising';
  a.revision = { dueOn: '2026-12-01', before: 0.3 };
  a.feedback = { course: 'DRAM 103a/b', teachers: 'Gregory Wallace', text: 'It needed time together.', focus: { kind: 'dim', dim: 'partner' }, seen: true } as never;
  return a;
}
/** A slip recovered from by the ability: the shake a slip leaves the next part, none at the ability's full and the other's, some where it's lower. */
function recovers(a: 'composure' | 'adaptability'): void {
  const other = a === 'composure' ? 'adaptability' : 'composure';
  const actor = (mine: number, theirs: number): Performer => ({ ability: (id) => (id === a ? mine : id === other ? theirs : 30), full: () => 100, technique: () => 30 });
  const b = like(BASE, { beats: beatsOf(4, 'grave') });
  const rec = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
  const ctx = briefContext(nobody, b, rec, { reading: b.readings[0]!.id, prep: { genre: 1 } });
  const segs = (p: Performer, key: string) => judgePiece('p2b', p, { ...ctx, condition: { readiness: 100 }, key }, briefPiece(b, { ...rec, reading: b.readings[0]!.id })).piece!.segments;
  // A draw where the first beat slips at both levels (searched, the draw being the save's own by its key).
  const key = Array.from({ length: 400 }, (_, i) => `p2b-slip-${i}`).find((k) => segs(actor(100, 100), k)[0]!.slip && segs(actor(0, 100), k)[0]!.slip)!;
  expect(key, `a slip in the first beat for ${a}`).toBeDefined();
  expect(segs(actor(100, 100), key)[1]!.shaken).toBe(1);
  expect(segs(actor(0, 100), key)[1]!.shaken).toBeLessThan(1);
}
/** A partner's slip covered by the ability: the scene together loses less of it, the player's own result as it was. */
function covers(a: 'listening' | 'adaptability'): void {
  const sim = life('p2b-a4-cover');
  const s = assignment(sim, 'scene-study', { familiarity: 1, memorization: 1, rehearsal: 1, partner: 1 });
  mateRecord(sim.player.school!.classmates[0]!).reliability = 0.6;
  const day = '2026-09-21';
  const judged = (k: string) => judgeWork(sim, sim.player, s, day, sim.now, k);
  const key = Array.from({ length: 400 }, (_, i) => `p2b-cover-${i}`).find((k) => togetherOf(sim, sim.player, s, day, judged(k))?.slip)!;
  expect(key, 'a partner’s slip').toBeDefined();
  const own = judged(key);
  const at = (level: number) => { setAbility(sim, a, level); return togetherOf(sim, sim.player, s, day, own)!; };
  const lo = at(10), hi = at(95);
  expect(hi.slip!.covered).toBeGreaterThan(lo.slip!.covered);
  expect(hi.overall).toBeGreaterThan(lo.overall);
}

describe('A4: what the game says each ability does and what develops it, it does (brief 11)', () => {
  it('the ability’s look says what develops it, what it does and which work reads it, and every task and dimension it names moves with it on every piece of that task; stamina’s are the drain’s, exactly, all twelve', () => {
    const sim = life('p2b-a4-look');
    const page = profile(sim);
    for (const d of ABILITY_DEFS) {
      const body = lookOf(sim, d.id);
      const readers = readersOf(d.id);
      expect(body, d.id).toContain(`What develops it. ${d.develops}`);
      expect(body, d.id).toContain(`What it does. ${d.affects}`);
      expect(body, d.id).toContain(`Which work reads it. ${readers.map((r) => `${r.label}: ${r.dims.map((x) => DIMENSION_LABEL[x].toLowerCase()).join(', ')}`).join('; ')}.`);
      // The Profile's It Shapes says the same dimensions.
      expect(abilityRow(page.html, d.label)[5], d.id).toBe([...new Set(readers.flatMap((r) => r.dims))].map((x) => DIMENSION_LABEL[x]).join(', '));
      for (const r of readers) readsIn(d.id, r.task, r.dims);
    }
    // Stamina is read in a piece judged in parts as the drain on each dimension tiring reaches, and in work shown whole as
    // consistency: what the look names is every task and dimension +10 of it moves on any piece, and nothing else.
    const named = readersOf('stamina').flatMap((r) => r.dims.map((x) => `${r.task}: ${x}`)).sort();
    const moved = [...new Set(Object.entries(PIECES_BY_TASK).flatMap(([task, js]) => js.flatMap((j) => movedBy(j, 'stamina').map((x) => `${task}: ${x}`))))].sort();
    expect(named).toEqual(moved);
  }, 120_000);

  it('GUARD: every clause of every ability’s two sentences is its own words and is held by a check, all twelve', () => {
    for (const d of ABILITY_DEFS) {
      for (const [field, clauses] of [['develops', grows[d.id]], ['affects', does[d.id]]] as const) {
        expect(clauses, `${d.id}.${field}`).toBeDefined();
        let rest = d[field];
        for (const c of clauses!) { expect(rest, `${d.id}.${field}: “${c.says}”`).toContain(c.says); rest = rest.replace(c.says, ' '); }
        // What's left between the clauses is only how they're joined.
        expect(rest.replace(/\b(and|or)\b/g, '').replace(/[\s,;:.()]/g, ''), `${d.id}.${field} said beyond its clauses`).toBe('');
      }
    }
  });

  it('PLAYER JOURNEY: every activity each ability’s develops sentence names grows it, on one save played through its commands and its clock', () => {
    // A first-year in New York, the first week of classes played (TEST SETUP: the day kept rested, as tests/direction.test.ts keeps it).
    const sim = life('p2b-a4-develops');
    DEVELOPED.sim = sim; DEVELOPED.at = {};
    tended(sim, on(2026, 9, 5, 12));
    // Coursework's steps: knowing the scene, its lines, the table work of a song's lyric, a sequence practised, a score
    // rehearsed, an evening with a reader, a revision after a note (TEST SETUP: each assignment set as the course sets one).
    freeAndRested(sim);
    const scene = assignment(sim, 'scene-study');
    for (const step of ['read', 'learn']) { freeAndRested(sim); prepared(sim, scene, step); }
    const song = assignment(sim, 'song');
    freeAndRested(sim); prepared(sim, song, 'song-text');
    freeAndRested(sim); prepared(sim, assignment(sim, 'voice-sequence', { familiarity: 0.6 }), 'practice');
    freeAndRested(sim); prepared(sim, assignment(sim, 'movement-score', { interpretation: 0.6 }), 'rehearse-score');
    freeAndRested(sim); prepared(sim, revising(sim), 'revise');
    // Attentive preparation done well-rested grows focus more than the same step tired (a twin at the same hour).
    for (const [k, energy] of [['focusRested', 100], ['focusTired', 15]] as const) { const twin = life('p2b-a4-focus'); freeAndRested(twin); twin.player.wellbeing.energy = energy; const f = abilityOf(twin, twin.player, 'focus'); prepared(twin, assignment(twin, 'scene-study'), 'read'); DEVELOPED.at[k] = abilityOf(twin, twin.player, 'focus') - f; }
    // A brief broken down and its lines learned; a fight and a song rehearsed on their feet.
    freeAndRested(sim);
    expect(sim.execute({ kind: 'brief.choose', payload: { brief: BASE.id, reading: BASE.readings[0]!.id } }).ok).toBe(true);
    for (const step of ['read', 'lines']) { freeAndRested(sim); expect(sim.execute({ kind: 'brief.prepare', payload: { brief: BASE.id, step } }).ok).toBe(true); }
    for (const [k, want, kind] of [['fightPhysical', 'physical', 'action'], ['songVocal', 'vocal', 'musical']] as const) {
      const b = BRIEFS.find((x) => rehearseTrains(x) === want && x.kinds.includes(kind))!;
      expect(b, `a ${kind} brief built on the ${want}`).toBeDefined();
      freeAndRested(sim);
      expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } }).ok).toBe(true);
      recordOf(sim.player, b.id).prep.memorization = 0.5; // TEST SETUP: enough of the lines to rehearse.
      const before = abilityOf(sim, sim.player, want);
      expect(sim.execute({ kind: 'brief.prepare', payload: { brief: b.id, step: 'rehearse' } }).ok).toBe(true);
      DEVELOPED.at[k] = abilityOf(sim, sim.player, want) - before;
    }
    // A play read.
    freeAndRested(sim);
    expect(sim.execute({ kind: 'plays.read', payload: { playId: CONTEMPORARY_PLAYS[0]!.id } }).ok).toBe(true);
    // An hour of every ability's exercise, and the five whose carrying over a sentence names, played as a variation:
    // four a day, the days counted for discipline's.
    const days = new Set<string>();
    const hour = (exercise: string, focus = 'steady') => {
      freeAndRested(sim);
      let r = sim.execute({ kind: 'practice.exercise', payload: { exercise, focus } });
      if (!r.ok && /4 hours/.test(r.error ?? '')) { tended(sim, sim.now + MS_DAY); freeAndRested(sim); r = sim.execute({ kind: 'practice.exercise', payload: { exercise, focus } }); }
      expect(r.ok, `${exercise}: ${r.error}`).toBe(true);
      days.add(developmentOf(sim.player).practice!.day);
    };
    for (const e of EXERCISES.filter((x) => isAbility(x.trains))) hour(e.id);
    for (const e of ['graded-exposure', 'clown-practice', 'concentration', 'showing-for-classmates', 'improv-session', 'singing-practice', 'combat-drill']) hour(e, 'variation');
    DEVELOPED.at.daysPractised = days.size;
    DEVELOPED.at.practiceDays = developmentOf(sim.player).history.filter((x) => x.id === 'discipline' && x.source === 'practice-day').length;
    // The improvisation game played with the partner: an evening asked for and kept (TEST SETUP: the partner as reliable as one comes).
    freeAndRested(sim);
    mateRecord(sim.player.school!.classmates[0]!).reliability = 1;
    const game = assignment(sim, 'play-game');
    const when = askedFor(sim, game);
    const heard = abilityOf(sim, sim.player, 'listening');
    tended(sim, when + 3 * MS_HOUR);
    expect(game.rehearsals[0]!.status).toBe('kept');
    DEVELOPED.at.gameListening = abilityOf(sim, sim.player, 'listening') - heard;
    // A part cast (TEST SETUP), learned, a director's note on the blocking worked, its rehearsal call answered, and a night
    // played before a house.
    freeAndRested(sim);
    const { call, night } = cast(sim);
    expect(sim.execute({ kind: 'school.learn_part', payload: {} }).ok).toBe(true);
    procOf(sim).notes.push({ at: sim.now, text: 'The blocking isn’t set in you.', focus: { kind: 'blocking' } } as never);
    freeAndRested(sim);
    expect(sim.execute({ kind: 'school.work_note', payload: {} }).ok).toBe(true);
    tended(sim, call + 4 * MS_HOUR);
    DEVELOPED.at.presenceBefore = abilityOf(sim, sim.player, 'presence');
    DEVELOPED.at.composureBefore = abilityOf(sim, sim.player, 'composure');
    DEVELOPED.at.lift = 1 + 0.1 * (abilityOf(sim, sim.player, 'discipline') - 50) / 50;
    tended(sim, night - MS_HOUR);
    const nightHistory = developmentOf(sim.player).history.length;
    tended(sim, night + 4 * MS_HOUR);
    // What the house's nerves grew, read off the levels (the history keeps each change to a thousandth).
    expect(developmentOf(sim.player).history.slice(nightHistory).filter((x) => x.source === 'nerves:performance').map((x) => x.id).sort()).toEqual(['composure', 'presence']);
    DEVELOPED.at.nightPresence = abilityOf(sim, sim.player, 'presence') - DEVELOPED.at.presenceBefore!;
    DEVELOPED.at.nightComposure = abilityOf(sim, sim.player, 'composure') - DEVELOPED.at.composureBefore!;
    // A remarkable night: everything at its full (TEST SETUP), the part complete and its notes taken, its next performance played.
    const p = sim.player;
    for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 100;
    // Presence a little under its full, so a remarkable night's share of what's left has room to grow it.
    for (const d of ABILITY_DEFS) setAbility(sim, d.id, d.id === 'presence' ? 95 : abilityFull(sim, p, d.id));
    Object.assign(procOf(sim), { lines: 1, blocking: 1 });
    for (const n of procOf(sim).notes) n.taken = true;
    sim.schedule({ at: sim.now + 2 * MS_HOUR, kind: CALL_KIND, label: 'A Test Play: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 150, payload: { personId: p.id, call: 'performance', kept: true } });
    tended(sim, sim.now + 6 * MS_HOUR);
    expect((p.school!.casting as unknown as { nights: Record<string, number> }).nights.remarkable).toBe(1);
    // A solo showing (TEST SETUP: the third year's lab showing booked).
    setAbility(sim, 'composure', 50);
    freeAndRested(sim);
    const solo = sim.now + 60_000;
    sim.schedule({ at: solo, kind: LAB_KIND, label: 'You Are The Creator: Showing', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 120, payload: { personId: p.id, showing: true } });
    tended(sim, solo + 3 * MS_HOUR);
    DEVELOPED.at.soloComposure = developmentOf(p).history.filter((x) => x.id === 'composure' && x.source === 'nerves:performance' && x.at === solo).reduce((s, x) => s + x.delta, 0);
    // Workouts, a run and indoors (the weather's own, read a day at a time), and fitness after the last: held three days, then falling.
    setAbility(sim, 'stamina', 60);
    for (let d = 0; d < 40 && (DEVELOPED.at.run === undefined || DEVELOPED.at.indoors === undefined); d += 1) {
      freeAndRested(sim);
      const where = trainingAt(sim, p, sim.now + MS_HOUR).where;
      const f = p.wellbeing.fitness;
      if (DEVELOPED.at[where === 'run' ? 'run' : 'indoors'] === undefined && !sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok) { tended(sim, sim.now + MS_DAY); continue; }
      if (p.wellbeing.fitness > f) DEVELOPED.at[where === 'run' ? 'run' : 'indoors'] = p.wellbeing.fitness - f;
      tended(sim, sim.now + MS_DAY);
      setAbility(sim, 'stamina', 60);
    }
    freeAndRested(sim);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    const after = p.wellbeing.fitness;
    const fit: number[] = [];
    for (let d = 1; d <= 5; d += 1) { tended(sim, sim.now + MS_DAY); fit.push(p.wellbeing.fitness); }
    DEVELOPED.at.heldFor = fit.filter((x) => x === after).length;
    DEVELOPED.at.fellADay = fit[FITNESS.heldDays]! - fit[FITNESS.heldDays + 1]!;
    // Every develops clause, read off the record the save keeps, and the record kept across a save and a load.
    for (const d of ABILITY_DEFS) for (const c of grows[d.id]!) c.holds();
    expect(developmentOf(reload(sim).player).history).toEqual(developmentOf(sim.player).history);
  }, 120_000);

  it('every effect each ability’s affects sentence names, it has, clause by clause, all twelve', () => {
    for (const d of ABILITY_DEFS) for (const c of does[d.id]!) c.holds();
  }, 300_000);
});

// ---------------------------------------------------------------------------------------------------------------
// 6. A5: an action the player chooses develops each ability, and the screen says what moved (brief 11)
// ---------------------------------------------------------------------------------------------------------------

/** An hour pressed on the exercise's own control, the Player Profile drawn with it opened: the command's answer and the toast. */
function pressPractice(sim: Simulation, e: (typeof EXERCISES)[number]): { gained: number; level: number; discipline: number; feedback: string; toast: string; control: string } {
  const page = profile(sim, true);
  // The control's own words, from its exercise's name to its button.
  const from = page.html.indexOf(`<strong>${e.label}.</strong>`);
  expect(from, `${e.label}'s control, opened`).toBeGreaterThan(-1);
  const control = onScreen(page.html.slice(from, page.html.indexOf('Practice An Hour', from)));
  const button = h.clicks.find((c) => c.feature === 'practice.exercise' && c.title === e.how);
  expect(button, `${e.label}'s Practice An Hour, not refused`).toBeDefined();
  h.toasts = []; h.ran = [];
  button!.onClick!();
  const r = h.ran.at(-1)!;
  expect(r.ok, `${e.label}: ${r.error}`).toBe(true);
  return { ...(r.value as { gained: number; level: number; discipline: number; feedback: string }), toast: h.toasts.at(-1)!, control };
}

describe('A5: an action the player chooses develops each ability, and says what moved (brief 11)', () => {
  it('PLAYER JOURNEY: an hour of each of the ten abilities’ exercises, pressed on its control, grows it, its words and the toast say by how much, and the Profile’s row says the last change, across a save and a load', () => {
    const sim = life('p2b-a5');
    tended(sim, on(2026, 9, 5, 12));
    let hours = 0;
    for (const d of ABILITY_DEFS) {
      const e = exerciseFor(d.id);
      if (!e) continue;
      if (hours === 4) { tended(sim, sim.now + MS_DAY); hours = 0; }
      freeAndRested(sim);
      const before = levelOf(sim, sim.player, d.id);
      const r = pressPractice(sim, e);
      hours += 1;
      const after = levelOf(sim, sim.player, d.id);
      expect(after - before, d.id).toBeCloseTo(r.gained, 12);
      expect(r.gained, d.id).toBeGreaterThan(0);
      // The hour's own words, the toast, and the Profile's row, each the same figure.
      expect(r.feedback, d.id).toContain(`${d.label} rose ${r.gained.toFixed(2)}, to ${after.toFixed(1)} of ${Math.round(abilityFull(sim, sim.player, d.id))}`);
      expect(r.toast, d.id).toBe(`${e.label}: +${r.gained.toFixed(2)}.`);
      const row = abilityRow(profile(sim).html, d.label);
      expect(row[6], d.id).toBe(`+${r.gained.toFixed(2)}, ${e.label}`);
      expect(abilityRow(profile(reload(sim)).html, d.label)[6], `${d.id} after a reload`).toBe(`+${r.gained.toFixed(2)}, ${e.label}`);
    }
  }, 120_000);

  it('PLAYER JOURNEY: discipline grows from a day’s practice kept, once a day, said before the hour and on its row after; stamina from a Work Out, said on its row and its look', () => {
    const sim = life('p2b-a5-habit');
    tended(sim, on(2026, 9, 5, 12));
    freeAndRested(sim);
    const e = exerciseFor('focus')!;
    const before = abilityOf(sim, sim.player, 'discipline');
    const first = pressPractice(sim, e);
    // Said before the hour, on the control, by the hour's own figure.
    expect(first.control).toContain(`+${first.discipline.toFixed(2)} to discipline for the day kept`);
    expect(first.discipline).toBeGreaterThan(0);
    expect(abilityOf(sim, sim.player, 'discipline') - before).toBeCloseTo(first.discipline, 12);
    expect(abilityRow(profile(sim).html, 'Discipline')[6]).toBe(`+${first.discipline.toFixed(2)}, ${sourceWords('practice-day')}`);
    // A second hour the same day keeps no more of the habit: discipline stands, and the control says nothing of it.
    freeAndRested(sim);
    const again = pressPractice(sim, exerciseFor('memory')!);
    expect(again.discipline).toBe(0);
    expect(again.control).not.toContain('to discipline for the day kept');
    // The next day's first hour, kept again.
    tended(sim, sim.now + MS_DAY);
    freeAndRested(sim);
    expect(pressPractice(sim, e).discipline).toBeGreaterThan(0);
    // Stamina: Work Out, under Look After Yourself (its row names where), grows fitness, and the row and the look say by how much.
    expect(abilityRow(profile(sim).html, 'Stamina')[7]).toContain('Work Out, under Look After Yourself');
    freeAndRested(sim);
    const fitness = sim.player.wellbeing.fitness;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    const built = sim.player.wellbeing.fitness - fitness;
    expect(built).toBeGreaterThan(0);
    const last = developmentOf(sim.player).history.at(-1)!;
    expect(last.id).toBe('stamina');
    expect(abilityRow(profile(sim).html, 'Stamina')[6]).toBe(`+${built.toFixed(2)}, ${sourceWords(last.source)}`);
    expect(lookOf(sim, 'stamina')).toContain(`Last Change +${built.toFixed(2)} ${sourceWords(last.source)}`);
    expect(abilityRow(profile(reload(sim)).html, 'Stamina')[6]).toBe(`+${built.toFixed(2)}, ${sourceWords(last.source)}`);
  }, 120_000);
});

// ---------------------------------------------------------------------------------------------------------------
// 7. T1: training says its value before and after (brief 11)
// ---------------------------------------------------------------------------------------------------------------

describe('T1: training says its value before the hour and after it (brief 11)', () => {
  it('PLAYER JOURNEY: each of the ten abilities’ controls says the hour’s gain and its tier before it, the hour’s words the same gain, the tier and that it’s pitched where you are after; a second hour the same day is said a repeat before and after, at half', () => {
    const sim = life('p2b-t1');
    let day = 5;
    for (const d of ABILITY_DEFS) {
      const e = exerciseFor(d.id);
      if (!e) continue;
      // Each ability's two hours early on a day of their own, so the second is the same day's.
      tended(sim, on(2026, 9, (day += 1), 7));
      freeAndRested(sim);
      const level = levelOf(sim, sim.player, d.id);
      const matched = TIER.label[level < TIER.bands[0] ? 0 : level < TIER.bands[1] ? 1 : 2];
      const first = pressPractice(sim, e);
      // Before: the gain, the level it starts from, and the tier marked as theirs.
      expect(first.control, d.id).toContain(`About +${first.gained.toFixed(2)} to ${d.label.toLowerCase()} (now ${level.toFixed(1)})`);
      expect(first.control, d.id).toContain(`${matched} (Your Level)`);
      // After: the same gain, the tier's material and that it was pitched where they are.
      expect(first.feedback, d.id).toContain(`${d.label} rose ${first.gained.toFixed(2)}`);
      expect(first.feedback, d.id).toContain(`${matched}: ${EXERCISE_DESIGN[e.id]!.tiers[TIER.label.indexOf(matched as never)]}.`);
      expect(first.feedback, d.id).toContain('Pitched where you are.');
      expect(first.feedback, d.id).not.toMatch(/on it today/);
      // Again the same day: said a repeat before, at half, and after.
      freeAndRested(sim);
      const second = pressPractice(sim, e);
      expect(second.control, d.id).toContain('hour 2 on it today keeps 50%');
      expect(second.control, d.id).toContain(`About +${second.gained.toFixed(2)}`);
      expect(second.feedback, d.id).toContain('Hour 2 on it today: each repeat keeps half the one before, so another exercise would give more.');
      expect(second.gained / first.gained, d.id).toBeGreaterThan(0.45);
      expect(second.gained / first.gained, d.id).toBeLessThan(0.5);
    }
  }, 120_000);

  it('PLAYER JOURNEY: stamina’s training, Work Out, says the fitness it builds before the hour, to a tenth, and its row the same after; a gain under a point isn’t said as none', () => {
    const sim = life('p2b-t1-workout');
    tended(sim, on(2026, 9, 6, 7));
    freeAndRested(sim);
    // TEST SETUP: fitness a little past a whole number, where a gain under a point rounded to whole numbers read as none.
    sim.player.wellbeing.fitness = 50.6;
    // Look After Yourself, opened (TEST SETUP: its dropdown, the bar's fourth state, as tests/evidence-g07-life.test.ts opens it).
    h.sim = sim; h.states = [false, false, null, true];
    const bar = onScreen(renderToStaticMarkup(createElement(TimeControls)));
    expect(h.states).toHaveLength(0);
    const item = bar.slice(bar.indexOf('Work Out'), bar.indexOf('readiness', bar.indexOf('Work Out')));
    const said = /Fitness (\d+(?:\.\d)?) → (\d+(?:\.\d)?)/.exec(item);
    expect(said, item).not.toBeNull();
    const from = sim.player.wellbeing.fitness;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    const built = sim.player.wellbeing.fitness - from;
    expect(said![1]).toBe(from.toFixed(1));
    expect(said![2]).toBe((from + built).toFixed(1));
    expect(Number(said![2]) - Number(said![1])).toBeGreaterThan(0);
    expect(abilityRow(profile(sim).html, 'Stamina')[6]).toBe(`+${built.toFixed(2)}, ${sourceWords(developmentOf(sim.player).history.at(-1)!.source)}`);
  });

  it('PLAYER JOURNEY: every technique past 90 is said to move no result, on its control before the hour and in the hour’s words after; at 85, neither says it', () => {
    const sim = life('p2b-t1-past');
    tended(sim, on(2026, 9, 5, 12));
    const past = 'Past 90, no piece of work asks more of a technique: what it adds from here moves no result.';
    let hours = 0;
    for (const t of TECHNIQUES) {
      const e = exerciseFor(t)!;
      for (const level of [85, 95]) {
        if (hours === 4) { tended(sim, sim.now + MS_DAY); hours = 0; }
        freeAndRested(sim);
        sim.player.craft![t] = level; // TEST SETUP: the technique at the level.
        const r = pressPractice(sim, e);
        hours += 1;
        if (level > MASTERED) { expect(r.control, t).toContain(past); expect(r.feedback, t).toContain(past); }
        else { expect(r.control, t).not.toContain('Past 90'); expect(r.feedback, t).not.toContain('Past 90'); }
      }
    }
  }, 120_000);
});

// ---------------------------------------------------------------------------------------------------------------
// 8. O3: bands, grades and casting read the player's own result; preparation and condition named as limits (brief 11)
// ---------------------------------------------------------------------------------------------------------------

/** TEST SETUP: every ability and technique at a level, stamina at that share of its full. */
function atLevel(sim: Simulation, level: number): void {
  for (const k of Object.keys(sim.player.craft!)) (sim.player.craft as Record<string, number>)[k] = level;
  for (const d of ABILITY_DEFS) setAbility(sim, d.id, d.id === 'stamina' ? (abilityFull(sim, sim.player, 'stamina') * level) / 100 : level);
}
/**
 * A paired scene shown at Acting I's next meeting, played through the clock (TEST SETUP: the work set due there, the
 * player's own side of it complete, the partner as `partner` makes them). What the meeting kept: the work's record and the showing.
 */
function shownWithPartner(seed: string, level: number, partner: (mate: Record<string, unknown>, a: Assignment) => void, tweak: (sim: Simulation) => void = () => undefined) {
  const sim = life(seed);
  tended(sim, on(2026, 9, 8, 7));
  atLevel(sim, level); tweak(sim);
  // TEST SETUP: the course's own work set aside, as tests/approaches.test.ts sets it aside, so the meeting shows this.
  for (const x of courseworkOf(sim, sim.player)!.assignments) if (x.course === 'DRAM 103a/b' && (x.status === 'open' || x.status === 'revising')) x.status = 'done';
  const a = assignment(sim, 'scene-study', { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 });
  a.dueOn = meetingsFrom('DRAM 103a/b', { year: 2026, month: 9, day: 8 }, sim.player.school)[0]!;
  partner(mateRecord(sim.player.school!.classmates[0]!) as unknown as Record<string, unknown>, a);
  const due = Number(new Date(`${a.dueOn}T23:00:00-04:00`));
  for (; sim.now < due; ) { tended(sim, Math.min(due, sim.now + 6 * MS_HOUR)); atLevel(sim, level); tweak(sim); }
  const record = (sim.player.work ?? []).find((w) => w.inputs.key === `show:${sim.player.id}:${a.id}:${a.dueOn}`)!;
  expect(record, `${seed}: shown`).toBeDefined();
  return { sim, a, record, shown: a.shown! };
}

describe('O3: bands, grades and casting read the player’s own result, and preparation and condition are limits of their own (brief 11)', () => {
  it('PLAYER JOURNEY: a paired scene shown at Acting I’s meeting is banded by the player’s own result, Exceptional, while the scene together, said beside it, is Strong; a partner who reads it apart moves the scene together and nothing of the player’s own', () => {
    const good = shownWithPartner('p2b-o3', 80, (m) => { m.reliability = 1; });
    const apart = shownWithPartner('p2b-o3', 80, (m, a) => { m.reliability = 0.6; m.trust = 0; a.readsApart = 'objective'; });
    for (const x of [good, apart]) {
      expect(x.shown.band).toBe(bandOfQuality(x.record.overall));
      expect(x.record.band).toBe(x.shown.band);
      expect(x.shown.together!.overall).toBeLessThan(x.record.overall);
      expect(x.sim.universe.notifications.some((n) => n.title === `Shown: Scene Study, ${BAND_LABEL[x.shown.band]}`)).toBe(true);
    }
    // Own result and band the same whatever the partner did; the scene together not.
    expect(apart.record.overall).toBe(good.record.overall);
    expect(good.shown.band).toBe('exceptional');
    expect(bandOfQuality(good.shown.together!.overall)).toBe('strong');
    expect(apart.shown.together!.overall).toBeLessThan(good.shown.together!.overall);
    // Kept as shown across a save and a load.
    const again = reload(good.sim);
    expect((again.player.work ?? []).find((w) => w.inputs.key === good.record.inputs.key)!.band).toBe('exceptional');
  }, 120_000);

  it('PLAYER JOURNEY: a night is banded by the player’s own night while the company’s, said apart, moves the mood alone; casting reads the expected personal result, no draw and no company in it', () => {
    // At 88 everywhere a new play's night comes to just over the solid line, the band a night's whole is read in.
    const night = (reliable: number) => {
      const sim = life('p2b-o3-night');
      tended(sim, on(2026, 9, 6, 7));
      atLevel(sim, 88);
      freeAndRested(sim);
      // TEST SETUP: a part cast with a company of three classmates, its calls booked; the company as reliable as given.
      const { night: at } = cast(sim, { lines: 1, blocking: 1 });
      (sim.player.school!.casting as unknown as { cast: { name: string }[] }).cast = sim.player.school!.classmates.slice(0, 3).map((m) => ({ name: m.name }));
      for (const m of sim.player.school!.classmates.slice(0, 3)) mateRecord(m).reliability = reliable;
      for (; sim.now < at + 4 * MS_HOUR; ) { tended(sim, Math.min(at + 4 * MS_HOUR, sim.now + 6 * MS_HOUR)); atLevel(sim, 88); }
      const record = (sim.player.work ?? []).filter((w) => w.task === 'performance').at(-1)!;
      const casting = sim.player.school!.casting!;
      return { sim, record, together: nightTogether(sim, sim.player, casting as never, replay(record, TASK_PROFILES.performance!)!)!, casting };
    };
    const steady = night(1), shaky = night(0.2);
    for (const x of [steady, shaky]) {
      expect(x.record.band).toBe(nightBand(x.record.overall));
      expect(x.together).toBeDefined();
    }
    expect(shaky.record.overall).toBe(steady.record.overall);
    expect(shaky.record.band).toBe('solid');
    expect(steady.record.band).toBe('solid');
    // The shaky company's night together is under the solid line, the steady one's over the player's own: neither is the band.
    expect(nightBand(shaky.together.overall)).toBe('off');
    expect(steady.together.overall).toBeGreaterThan(steady.record.overall);
    expect(shaky.together.overall).toBeLessThan(steady.together.overall);
    // Casting: the play's fit for a performer is the night it would be expected to come to, with no draw, at any key, and
    // the same as that night judged with no draw by the performer casting reads (stamina and discipline as full).
    const sim = steady.sim;
    const perf = performerOf(sim, sim.player);
    const reads = { scene: 2, character: 1 };
    const fits = ['a', 'b', 'c'].map((k) => castFit(sim, perf, reads, [], k, 'Hedda Gabler'));
    expect(new Set(fits).size).toBe(1);
    const m = PLAY_MATERIAL.find((x) => x.id === 'Hedda Gabler')!;
    const spec = playPiece({ play: 'Hedda Gabler' });
    const read = materialContext(TASK_PROFILES.performance!, withPart(m, spec.night!));
    const ctx = { task: TASK_PROFILES.performance!, techniques: reads, prep: {}, required: {}, difficulty: 0, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: 'x' };
    expect(judgePiece(sim.universe.meta.seed, castingPerformer(perf), { ...ctx, expected: true }, spec).overall).toBe(fits[0]);
    // A drawn night of the same part, where a draw falls, is another figure: casting reads none.
    expect(['k1', 'k2', 'k3', 'k4'].some((k) => judgePiece(sim.universe.meta.seed, castingPerformer(perf), { ...ctx, key: k }, spec).overall !== fits[0])).toBe(true);
  }, 120_000);

  it('PLAYER JOURNEY: a take taped cold names its preparation short as limits of their own, in the task’s words, and a take with the flu names the flu, while the abilities each read stand as they are', () => {
    const tape = (seed: string, prepare: boolean, flu: boolean) => {
      const sim = life(seed);
      tended(sim, on(2026, 9, 6, 7));
      atLevel(sim, 60);
      freeAndRested(sim);
      expect(sim.execute({ kind: 'brief.choose', payload: { brief: BASE.id, reading: BASE.readings[0]!.id } }).ok).toBe(true);
      // TEST SETUP: a prepared brief's parts complete, as tests/briefs.test.ts sets them; a cold one's untouched.
      if (prepare) {
        Object.assign(recordOf(sim.player, BASE.id).prep, { interpretation: 1, memorization: 1, rehearsal: 1 });
        for (const g of BASE.kinds) Object.assign(genreState(sim.player, g), { familiarity: 100, practice: 100 });
      }
      // TEST SETUP: down with the flu, as the health week leaves it, the day otherwise as rested as the well twin's.
      if (flu) (sim.player as unknown as { health: { fluUntil: number } }).health.fluUntil = sim.now + 3 * MS_DAY;
      freeAndRested(sim);
      atLevel(sim, 60);
      const r = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: BASE.kinds[0], brief: BASE.id } });
      expect(r.ok, r.error).toBe(true);
      const w = (sim.player.work ?? []).at(-1)!;
      h.sim = sim;
      const look = resolveLook(sim, subject('work', w.inputs.key)) as Looked;
      return { w, look, all: replay(w, TASK_PROFILES[w.task]!)! };
    };
    const ready = tape('p2b-o3-tape', true, false);
    const cold = tape('p2b-o3-tape', false, false);
    const ill = tape('p2b-o3-tape', true, true);
    // The same abilities read, whatever the preparation or the day.
    expect(cold.w.inputs.abilities).toEqual(ready.w.inputs.abilities);
    expect(ill.w.inputs.abilities).toEqual(ready.w.inputs.abilities);
    // Cold: what the preparation cost is a preparation limit, named as the task names the part, and the take's look says
    // the first. (A limit is its one input made whole: where two parts a dimension reads are both short, neither alone
    // is, so not every part short is named on every dimension: the lines here, behind the breakdown on both it reads.)
    const prepLimits = cold.all.limits.filter((l) => l.kind === 'preparation');
    expect(prepLimits.length).toBeGreaterThan(0);
    for (const l of prepLimits) expect(l.label).toBe(TASK_PROFILES[cold.w.task]!.prepLabel![l.what]);
    expect(ready.all.limits.some((l) => l.kind === 'preparation')).toBe(false);
    expect(cold.look.summary).toContain(chiefLimit(cold.w)!);
    expect(chiefLimit(cold.w)).toMatch(/wasn’t complete, which cost /);
    // The flu: a condition limit, Down With The Flu, on the dimensions the task lists illness for, and none elsewhere.
    const fluLimits = ill.all.limits.filter((l) => l.kind === 'condition' && l.what === 'illness');
    expect(fluLimits.length).toBeGreaterThan(0);
    for (const l of fluLimits) { expect(l.label).toBe('Down With The Flu'); expect(TASK_PROFILES[ill.w.task]!.dims[l.dimension]!.conditions).toContain('illness'); }
    // The well twin's only condition is stamina's drain through the later beats, named as its own (“Stamina, By Beat 2”).
    expect(ready.all.limits.filter((l) => l.kind === 'condition').every((l) => l.what === 'stamina' && /^Stamina, By /.test(l.label))).toBe(true);
    expect(onScreen(renderToStaticMarkup(createElement('div', null, ill.look.body)))).toContain('Judged with readiness');
    expect(onScreen(renderToStaticMarkup(createElement('div', null, ill.look.body)))).toContain('the flu');
    // The ability limits name abilities only: preparation and the day are never folded into one.
    for (const x of [cold, ill]) for (const l of x.all.limits.filter((y) => y.kind === 'ability')) expect(isAbility(l.what as AbilityId), l.what).toBe(true);
  }, 120_000);
});

// ---------------------------------------------------------------------------------------------------------------
// 9. F1: every note names what the evaluation found (brief 11)
// 10. F3: preparation, the day's condition and a way that didn't fit, each in its own words, apart from ability
// ---------------------------------------------------------------------------------------------------------------

/**
 * A life whose takes are taped through the commands (TEST SETUP as each says: its levels, its preparation, the day), and
 * its Player Profile's What To Work On Next as drawn, line by line.
 */
function taped(seed: string, briefs: readonly Brief[], setup: (sim: Simulation, b: Brief) => void, choose: Record<string, string> = {}) {
  const sim = life(seed);
  tended(sim, on(2026, 9, 6, 7));
  for (const b of briefs) {
    freeAndRested(sim);
    expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id, ...choose } }).ok).toBe(true);
    setup(sim, b);
    const r = sim.execute({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } });
    expect(r.ok, `${b.id}: ${r.error}`).toBe(true);
  }
  return { sim, recs: adviceFor(sim, sim.player), next: nextWork(sim) };
}
/** The Player Profile's What To Work On Next as drawn, each line its label and its words (a tag's space before a stop taken out). */
const nextWork = (sim: Simulation): string => { const page = profile(sim).text.replace(/\s+([.,;:])/g, '$1'); return page.slice(page.indexOf('What To Work On Next'), page.indexOf('Ability Now Full')); };
/** TEST SETUP: a brief's parts complete and its genre known, as a player who prepared it leaves them. */
const preparedFully = (sim: Simulation, b: Brief) => { Object.assign(recordOf(sim.player, b.id).prep, { interpretation: 1, memorization: 1, rehearsal: 1 }); for (const g of b.kinds) Object.assign(genreState(sim.player, g), { familiarity: 100, practice: 100 }); };
const LONG = BRIEFS.filter((b) => b.size === 'long').slice(0, 4);

describe('F3: feedback says the condition and the preparation apart from ability (brief 11)', () => {
  it('PLAYER JOURNEY: takes taped cold are advised as preparation, in its words, with no exercise; the same briefs prepared aren’t', () => {
    const cold = taped('p2b-f3-cold', LONG, () => undefined);
    const prep = cold.recs.filter((r) => r.target.startsWith('prep:'));
    expect(prep.length).toBeGreaterThan(0);
    for (const r of prep) {
      expect(r.focus).toBe('preparation');
      expect(r.exercise).toBeUndefined();
      expect(r.why).toMatch(/^Coming to the work with .+ short cost about [\d.]+ points of the whole a piece: that’s preparation, not training\.$/);
      expect(cold.next).toContain(`${r.label}. ${r.why}`);
    }
    const ready = taped('p2b-f3-cold', LONG, preparedFully);
    expect(ready.recs.some((r) => r.target.startsWith('prep:'))).toBe(false);
  }, 120_000);

  it('PLAYER JOURNEY: takes with the flu are advised as the day’s condition, in its words, with no exercise; a well twin’s aren’t', () => {
    const ill = taped('p2b-f3-flu', LONG, (sim, b) => { preparedFully(sim, b); (sim.player as unknown as { health: { fluUntil: number } }).health.fluUntil = sim.now + 3 * MS_DAY; });
    const flu = ill.recs.find((r) => r.target === 'condition:illness');
    expect(flu, JSON.stringify(ill.recs.map((r) => r.target))).toBeDefined();
    expect(flu!.focus).toBe('condition');
    expect(flu!.exercise).toBeUndefined();
    expect(flu!.why).toMatch(/^Down With The Flu cost about [\d.]+ points of the whole a piece: come to the work rested and well, or find places to breathe in it\.$/);
    expect(ill.next).toContain(`${flu!.label}. ${flu!.why}`);
    const well = taped('p2b-f3-flu', LONG, preparedFully);
    expect(well.recs.some((r) => r.target === 'condition:illness')).toBe(false);
  }, 120_000);

  it('PLAYER JOURNEY: takes played a way the scene doesn’t allow are advised as the choice, in its words, with no exercise', () => {
    const misfit = BRIEFS.flatMap((b) => (Object.entries(b.allows ?? {}) as [string, readonly string[]][]).map(([axis, ok]) => ({ b, axis, side: (AXES as Record<string, { values: readonly string[] }>)[axis]!.values.find((v) => !ok.includes(v))! })));
    expect(misfit.length).toBeGreaterThan(0);
    const picks = misfit.filter((x, i, xs) => xs.findIndex((y) => y.b.id === x.b.id) === i).slice(0, 4);
    const sim = life('p2b-f3-fit');
    tended(sim, on(2026, 9, 6, 7));
    for (const { b, axis, side } of picks) {
      freeAndRested(sim);
      expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id, [axis]: side } }).ok).toBe(true);
      preparedFully(sim, b);
      recordOf(sim.player, b.id).playing!.prep = 1; // TEST SETUP: the way rehearsed in, so what's said is the fit alone.
      expect(sim.execute({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } }).ok).toBe(true);
    }
    const fit = adviceFor(sim, sim.player).find((r) => r.target === 'fit:fit');
    expect(fit, JSON.stringify(adviceFor(sim, sim.player).map((r) => r.target))).toBeDefined();
    expect(fit!.focus).toBe('choice');
    expect(fit!.exercise).toBeUndefined();
    expect(fit!.why).toMatch(/^A way of playing that didn’t fit cost about [\d.]+ points of the whole a piece: choose one the material or the direction takes\.$/);
    expect(nextWork(sim)).toContain(`${fit!.label}. ${fit!.why}`);
  }, 120_000);

  it('PLAYER JOURNEY: stamina draining through long takes is advised as stamina, built by a Work Out, never as rest; a fitter twin isn’t advised it', () => {
    // TEST SETUP: a body far from fit at each take, every brief prepared, the day rested.
    const unfit = taped('p2b-f3-stamina', LONG, (sim, b) => { preparedFully(sim, b); sim.player.wellbeing.fitness = 15; });
    const s = unfit.recs.find((r) => r.target === 'condition:stamina');
    expect(s, JSON.stringify(unfit.recs.map((r) => r.target))).toBeDefined();
    expect(s!.label).toBe('Stamina');
    expect(s!.exercise).toBeUndefined();
    expect(s!.why).toContain('Work Out');
    expect(s!.why).toContain('Rest restores energy, not fitness.');
    expect(s!.why).not.toContain('come to the work rested');
    expect(unfit.next).toContain(`${s!.label}. ${s!.why}`);
    const fit = taped('p2b-f3-stamina', LONG, (sim, b) => { preparedFully(sim, b); sim.player.wellbeing.fitness = abilityFull(sim, sim.player, 'stamina'); });
    expect(fit.recs.some((r) => r.target === 'condition:stamina')).toBe(false);
  }, 120_000);
});

describe('F1: every note names what the evaluation found (brief 11)', () => {
  it('PLAYER JOURNEY: twins taping the same prepared brief, one weak in imagination and one in emotional depth: each take’s chief limit, its look, What To Work On Next and the brief suggested for it name what each one’s evaluation found', () => {
    const weakIn = (a: AbilityId) => taped(`p2b-f1-${a}`, [BASE], (sim, b) => { preparedFully(sim, b); atLevel(sim, 60); setAbility(sim, a, 10); });
    const said: Record<string, string[]> = {};
    for (const a of ['imagination', 'emotionalDepth'] as const) {
      const { sim, recs, next } = weakIn(a);
      const label = ABILITY_DEFS.find((d) => d.id === a)!.label;
      const w = sim.player.work!.at(-1)!;
      // The take's chief limit is its evaluation's first, in words, on its look.
      expect(w.limits[0]!.what, a).toBe(a);
      const chief = chiefLimit(w)!;
      expect(chief, a).toBe(`Your ${label} held back ${DIMENSION_LABEL[w.limits[0]!.dimension]} by ${w.limits[0]!.by} points`);
      h.sim = sim;
      expect((resolveLook(sim, subject('work', w.inputs.key)) as Looked).summary, a).toContain(chief);
      // What To Work On Next: the first training named is an input the take's evaluation found holding it back, this one.
      const top = recs.find((r) => r.forecast)!;
      expect(top.target, a).toBe(a);
      expect(w.limits.some((l) => l.what === top.target), a).toBe(true);
      expect(next, a).toContain(`${top.label}, ${EXERCISE_BY_ID[top.exercise!]!.label}`);
      // And the brief suggested beside a brief, as its pane asks (`suggestions` with the advice's first): leaning on it most.
      const idea = suggestions(sim.player, { target: top.target, label: top.label, level: levelOf(sim, sim.player, a), full: 100 }).find((s) => s.why.startsWith('It leans on'))!;
      expect(idea.why, a).toContain(`It leans on ${top.label.toLowerCase()} more than`);
      said[a] = [chief, top.target, idea.brief];
    }
    // The falsifiability: the same take, another weakness, another note at each.
    expect(said.imagination![0]).not.toBe(said.emotionalDepth![0]);
    expect(said.imagination![1]).not.toBe(said.emotionalDepth![1]);
  }, 120_000);

  it('PLAYER JOURNEY: a scene shown at Acting I’s meeting by a craft behind the year gets its note on the craft skill its judged result’s limits say held it most, the voice for one twin and emotional access for the other', () => {
    const shown = (skill: 'voice' | 'emotion') => shownWithPartner(`p2b-f1-note-${skill}`, 40, (m) => { m.reliability = 1; }, (sim) => { sim.player.craft![skill] = 5; });
    for (const skill of ['voice', 'emotion'] as const) {
      const { a, record } = shown(skill);
      expect(skillHeld(record)?.skill, skill).toBe(skill);
      expect(a.feedback!.focus, skill).toEqual({ kind: 'skill', skill });
      expect(a.feedback!.text, skill).toContain(`It asked for more ${(skill === 'voice' ? 'Vocal Expression' : 'Emotional Depth').toLowerCase()} than you have yet`);
    }
  }, 120_000);
});

// ---------------------------------------------------------------------------------------------------------------
// 11. A1: each ability's largest effect, +10 on the mean result of a kind of work (brief 11)
// ---------------------------------------------------------------------------------------------------------------

describe('A1: every ability is causal somewhere, at half a point or more (brief 11)', () => {
  /**
   * The kinds of work tools/ag-baseline.ts measures A1 on, but its 298 briefs, judged as it judges them (`tools/pieces.ts`,
   * the same constructions): every class scene, every night as a supporting part, casting's read of every play and every
   * coursework template not judged as a scene. Its figure is its own: the mean over a kind's pieces of the whole's change
   * with +10 from the even actor, each change kept to a thousandth and the mean to a hundredth.
   */
  const KINDS: Record<string, readonly { judge: (p: Performer) => Evaluation }[]> = {
    scene: SCENE_MATERIAL.map((m) => gamePiece(m, 'scene')),
    night: PLAY_MATERIAL.map((m) => gamePiece(m, 'night')),
    casting: PLAY_MATERIAL.map((m) => gamePiece(m, 'casting')),
    coursework: TEMPLATES.filter((t) => (TEMPLATE_TASK[t.id] ?? 'scene') !== 'scene').map((t) => courseworkPiece(t.id)),
  };
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  const mean = (pieces: readonly { judge: (p: Performer) => Evaluation }[], a: AbilityId) => r2(pieces.reduce((s, pc) => s + r3(pc.judge(plus(EVEN, a, 10)).overall - pc.judge(EVEN).overall), 0) / pieces.length);

  it('gives each of the twelve a kind of work where +10 moves the mean result half a point or more, and stamina half a point on the class scenes', () => {
    const largest: Record<string, [string, number]> = {};
    for (const d of ABILITY_DEFS) {
      const by = Object.entries(KINDS).map(([k, pieces]) => [k, mean(pieces, d.id)] as [string, number]);
      largest[d.id] = by.reduce((x, y) => (y[1] > x[1] ? y : x));
      expect(largest[d.id]![1], `${d.id}: ${JSON.stringify(by)}`).toBeGreaterThanOrEqual(0.5);
    }
    // Stamina's own (stamina.A1): the drain through a scene's later units, at 0.54 on brief 10's integrated code.
    expect(mean(KINDS.scene!, 'stamina')).toBeGreaterThanOrEqual(0.5);
  }, 120_000);
});

// ---------------------------------------------------------------------------------------------------------------
// 12. Brief 11, section 7: health, stamina and energy kept apart
// ---------------------------------------------------------------------------------------------------------------

describe('health, stamina and energy kept apart (brief 11, section 7)', () => {
  /** The life and the week tests/evidence-g07-life.test.ts finds the clock's flu in: 2 November 2026, five days of it. */
  const FLU_WEEK = Date.UTC(2026, 10, 2, 14);
  const fluLife = () => createSave(1, 'g07-flu-155', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 }, personalityTraits: [] });

  it('PLAYER JOURNEY: the flu the clock brings takes condition and energy and is told, leaves fitness as it was, reaches each ability’s work where its task lists illness, as the Profile’s Today says, and stops a Work Out in its words', () => {
    const sim = fluLife();
    sim.advanceTo(FLU_WEEK - 1000);
    const was = { ...sim.player.wellbeing };
    sim.advanceTo(FLU_WEEK + 1000);
    const flu = (sim.player as unknown as { health: { fluUntil?: number } }).health.fluUntil;
    expect(flu).toBe(FLU_WEEK + 5 * MS_DAY);
    expect(sim.player.wellbeing.condition).toBeLessThan(was.condition);
    expect(sim.player.wellbeing.energy).toBeLessThan(was.energy);
    // Health isn't stamina: fitness is the body's training, and the flu takes none of it.
    expect(sim.player.wellbeing.fitness).toBe(was.fitness);
    expect(sim.universe.notifications.filter((n) => n.title === 'You Have The Flu')).toHaveLength(1);
    // Today, on the Player Profile: the flu named where a task lists illness for the dimension an ability is read in.
    const page = profile(sim).html;
    for (const d of ABILITY_DEFS) {
      const today = abilityRow(page, d.label)[4]!;
      const dims = [...new Set(readersOf(d.id).flatMap((r) => r.dims.filter((x) => (TASK_PROFILES[r.task]!.dims[x]!.conditions ?? []).includes('illness'))))];
      if (dims.length) expect(today, d.id).toContain(`The flu: ${dims.map((x) => DIMENSION_LABEL[x].toLowerCase()).join(', ')}`);
      else expect(today, d.id).not.toContain('The flu');
    }
    freeAndRested(sim);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe('Not with the flu: rest until it passes.');
  }, 120_000);

  it('PLAYER JOURNEY: twins at a night’s curtain at the same readiness, one down with the flu: the flu reaches the night once, as Down With The Flu on the dimensions its task lists illness for; stamina, its drain in every part and the energy the night costs are the well twin’s', () => {
    const night = (ill: boolean) => {
      const sim = life('p2b-s7-night');
      tended(sim, on(2026, 9, 6, 7));
      atLevel(sim, 60);
      freeAndRested(sim);
      const { night: at } = cast(sim, { lines: 1, blocking: 1 });
      // TEST SETUP: the flu's days set by hand, without its toll, so the twins come to the curtain alike but for it.
      for (; sim.now < at + 4 * MS_HOUR; ) {
        tended(sim, Math.min(at + 4 * MS_HOUR, sim.now + 6 * MS_HOUR));
        atLevel(sim, 60);
        if (ill) (sim.player as unknown as { health: { fluUntil: number } }).health.fluUntil = at + MS_DAY;
      }
      const w = (sim.player.work ?? []).filter((x) => x.task === 'performance').at(-1)!;
      return { sim, w, e: replay(w, TASK_PROFILES.performance!)! };
    };
    const well = night(false), ill = night(true);
    expect(ill.w.inputs.condition.readiness).toBe(well.w.inputs.condition.readiness);
    expect(ill.w.inputs.condition.ill).toBe(true);
    expect(ill.w.inputs.abilities).toEqual(well.w.inputs.abilities);
    expect(ill.e.piece!.segments.map((s) => s.drain)).toEqual(well.e.piece!.segments.map((s) => s.drain));
    expect(energyOfNight(ill.w)).toBe(energyOfNight(well.w));
    // What the flu adds is one limit kind: the illness, on each dimension the night lists it for, once each.
    const added = ill.e.dimensions.flatMap((d) => d.limits.filter((l) => l.kind === 'condition' && l.what === 'illness').map((l) => l.dimension));
    expect(added.sort()).toEqual((Object.entries(TASK_PROFILES.performance!.dims) as [Dimension, { conditions?: readonly string[] }][]).filter(([, s]) => (s.conditions ?? []).includes('illness')).map(([d]) => d).sort());
    for (const d of ill.e.dimensions) expect(d.limits.filter((l) => l.what === 'illness'), d.dimension).toHaveLength(added.includes(d.dimension) ? 1 : 0);
    const kinds = (e: Evaluation) => new Set(e.limits.map((l) => `${l.kind}:${l.what}`));
    expect([...kinds(ill.e)].filter((k) => !kinds(well.e).has(k))).toEqual(['condition:illness']);
    expect(ill.w.overall).toBeLessThan(well.w.overall);
  }, 120_000);

  it('PLAYER JOURNEY: rest restores energy and eases stress, but leaves the flu its days and fitness where it was; a Work Out builds fitness by under a point, never to full at once', () => {
    const sim = fluLife();
    sim.advanceTo(FLU_WEEK + 1000);
    const flu = (sim.player as unknown as { health: { fluUntil: number } }).health.fluUntil;
    sim.advanceTo(on(2026, 11, 2, 21));
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); // TEST SETUP
    sim.player.wellbeing.stress = 40; // TEST SETUP: a day's worth of stress to unwind.
    const before = { ...sim.player.wellbeing };
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'unwind' } }).ok).toBe(true);
    expect(sim.player.wellbeing.stress).toBeLessThan(before.stress);
    const asleep = { ...sim.player.wellbeing };
    const slept = sim.execute<{ recovered: number }>({ kind: 'life.sleep', payload: { hours: 9 } });
    expect(slept.ok, slept.error).toBe(true);
    expect(slept.value!.recovered).toBeGreaterThan(0);
    expect(sim.player.wellbeing.energy).toBeGreaterThan(asleep.energy);
    // The flu keeps its days, and fitness isn't built by rest.
    expect((sim.player as unknown as { health: { fluUntil: number } }).health.fluUntil).toBe(flu);
    expect(sim.player.wellbeing.fitness).toBeLessThanOrEqual(before.fitness);
    expect(sim.now).toBeLessThan(flu);
    // Once it's passed: a Work Out builds fitness by under a point, a long way from full.
    sim.advanceTo(flu + 2 * MS_HOUR);
    freeAndRested(sim);
    const f = sim.player.wellbeing.fitness;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    expect(sim.player.wellbeing.fitness - f).toBeGreaterThan(0);
    expect(sim.player.wellbeing.fitness - f).toBeLessThan(1);
    expect(sim.player.wellbeing.fitness).toBeLessThan(abilityFull(sim, sim.player, 'stamina'));
  }, 120_000);
});
