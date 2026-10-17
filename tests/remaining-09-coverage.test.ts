/**
 * The coverage area's played journeys of brief 09 (2026-10-16, section 5): what the audit rows added that day for the
 * commands traced outside it claim and no gate test reached, and the one unresolved row play now reaches.
 *
 * - brief.reader: a classmate chosen to read with you learns it at your rehearsals, BRIEF.reader.rehearse (0.5) of each
 *   step's gain on what they have left, where the way of playing chosen takes PLAYING.gainShare (0.9) of the same gain:
 *   after the first rehearsal from nothing, the reader stands at 5/9 of the way's rehearsal. Until that day the capability
 *   said no test rehearsed with a classmate to raise it, and the take together was compared with their preparation set by
 *   hand (tests/ensemble.test.ts).
 * - school.choose_playing and work.settle on a scene for class: until that day no showing was run with a way chosen (its
 *   forecast was read in its place, tests/trace-commands.test.ts), and a segment's way kept on a class scene was read by
 *   no showing (tests/workbook.test.ts reads it on a take). The showing here is the clock's.
 * - school.choose_part_playing: a part's way, rehearsed in at the calls, kept across a reload and rehearsed in further.
 * - life.look_after as a command, apart from its five actions' rows: an action not on the menu is refused in its words
 *   with nothing changed, and what the command returns as changed is the action's own move on each dial, against a twin
 *   who lets the same minutes pass.
 * - tax.federal_lien_withdraw, unresolved until that day as out of any student's reach ("a student's year owes the IRS
 *   under two thousand dollars"): the creation screen's Inherited family keeps $2.6 million at Capital One's 3.00%, and
 *   a student who files nothing owes the IRS over $10,000 on 2027 by its final notice. The coverage area's probe found it
 *   on 2026-10-16 (probe/coverage09/tax-lien.ts, its output in docs/verification/remaining-09/coverage-result.json).
 *
 * What's worked by hand from the rules and not asked of the engine's helpers: the reader's 5/9 and each rehearsal's
 * share of what's left; the IRS's calendar (taxreturn.ts, as tests/remaining-tax.test.ts works it): the 2027 return due
 * Tuesday 18 April 2028 (the 15th a Saturday, and Monday the 17th Emancipation Day, observed), its substitute figured 365
 * days on, assessed 120 days after that, the LT11 140 days after the assessment and its levy 30 days on, a lien released
 * 30 days after payment and a withdrawal decided 30 days after it's asked; the $10,000 the notice of lien is filed on
 * (IRM 5.12.2.6).
 *
 * PLAYER JOURNEYS: new lives as the creation screen's draft makes them (`newLifeConfig` and `newLifeFrom`), Ada Cole,
 * born in New York, at Yale in New Haven from Monday 24 August 2026; screens rendered as the player has them and their
 * buttons pressed by their own handlers where a button is what's claimed. Seeds are arbitrary, none picked for what it
 * draws. TEST SETUP, said where it's done: the body kept fed, rested and awake as a player keeps it, where the work, not
 * the day, is what's measured.
 *
 * Judged figures (a take's, a showing's) aren't written here: the judge is being changed in another checkout. What's
 * asserted is what the record keeps and how two twins differ, which the judge's change doesn't move.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, MS_MINUTE, instantFromZoned, type Instant } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig, newLifeFrom, type NewSaveConfig } from '@/engine/world/bootstrap';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { APPROACH_EFFECT, PLAYING } from '@/engine/content/approaches';
import type { AxisValue } from '@/engine/content/material';
import { BRIEF, recordOf } from '@/engine/systems/briefs';
import { courseworkOf, playingRefusal, writtenUnplayed } from '@/engine/systems/coursework';
import { materialOf } from '@/engine/systems/material';
import { optionsOf, problemsOf } from '@/engine/systems/workbook';
import { workPiece } from '@/engine/systems/workpieces';
import { CALL_KIND } from '@/engine/systems/school';
import { processOf } from '@/engine/systems/production';
import { LOOKING_AFTER } from '@/engine/systems/life';
import { returnsOf } from '@/engine/systems/taxreturn';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
  toasts: [] as string[],
}));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, label: words(props.children), title: props.title, disabled: Boolean(props.disabled), onClick: props.onClick as never });
      return ce(real.Gated, props);
    },
  };
});
const { FederalLien } = await import('@/ui/components/LienPanels');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, NY);
const student = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => loadSave(JSON.parse(snap) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** TEST SETUP: the body kept fed, rested and awake, as a player keeps it. */
const kept = (sim: Simulation) => {
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
};
/** The clock moved six hours at a time, the body kept at each step. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { kept(sim); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const go = <T,>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T => { kept(sim); const r = sim.execute<T>({ kind, payload }); expect(r.ok, `${kind}: ${r.error}`).toBe(true); return r.value!; };
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** A component drawn as Papers draws it: its words, and the Gated buttons it drew. */
function drawn<P extends object>(sim: Simulation, component: FunctionComponent<P>, props: P): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(component, props)));
}
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);
function press(feature: string): string[] {
  const b = drew(feature);
  expect(b, `one ${feature}`).toHaveLength(1);
  h.toasts = [];
  b[0]!.onClick!();
  return h.toasts;
}
const longDate = (t: Instant) => new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: NY });

// ---------------------------------------------------------------------------
// brief.reader
// ---------------------------------------------------------------------------

describe('brief.reader: a classmate who reads with you, rehearsed in', () => {
  const b = BRIEF_BY_ID['brief-comedy']!;
  /** Sunday 6 September 2026 at 8 AM: the brief chosen, played Driven, its breakdown and lines done; Maya chosen first where `early`. */
  const begun = (early: boolean) => {
    const sim = student('r09-reader');
    tended(sim, at(2026, 9, 6, 8));
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, pace: 'driven' });
    if (early) expect(go<{ reader: string }>(sim, 'brief.reader', { brief: b.id, mate: 0 }).reader).toBe(sim.player.school!.classmates[0]!.name);
    for (const step of ['read', 'lines', 'lines']) go(sim, 'brief.prepare', { brief: b.id, step });
    return sim;
  };

  it('PLAYER JOURNEY: a classmate chosen to read before the rehearsals learns it with her, 5/9 of the way’s rehearsal at the first and half of each step’s gain on what’s left after; another classmate, or the same after the recording, starts from nothing; the twin who chose her after the rehearsals tapes the same take of her own and a lower take together; across a reload', () => {
    const sim = begun(true);
    const rec = recordOf(sim.player, b.id);
    expect(rec.reader).toEqual({ mate: 0, prep: 0 });
    expect(rec.playing!.prep).toBe(0);
    go(sim, 'brief.prepare', { brief: b.id, step: 'rehearse' });
    const q1 = rec.playing!.prep;
    const p1 = rec.reader!.prep;
    expect(q1).toBeGreaterThan(0);
    // From nothing, the reader takes 0.5 of the gain and the way 0.9 of it: 5/9 of the way's, kept to three places.
    expect(BRIEF.reader.rehearse / PLAYING.gainShare).toBeCloseTo(5 / 9, 12);
    expect(p1).toBeCloseTo((q1 * 5) / 9, 3);
    go(sim, 'brief.prepare', { brief: b.id, step: 'rehearse' });
    const q2 = rec.playing!.prep;
    const p2 = rec.reader!.prep;
    // The second step's gain, read off the way's rise on what it had left; the reader's rise is half of it on theirs.
    const gain = (q2 - q1) / (0.9 * (1 - q1));
    expect(gain).toBeGreaterThan(0);
    expect(p2).toBeCloseTo(p1 + 0.5 * gain * (1 - p1), 3);

    // The same classmate chosen again keeps what she has; saved and loaded, so does the record.
    go(sim, 'brief.reader', { brief: b.id, mate: 0 });
    expect(rec.reader).toEqual({ mate: 0, prep: p2 });
    const back = reload(sim);
    expect(recordOf(back.player, b.id).reader).toEqual({ mate: 0, prep: p2 });

    // The twin who rehearsed with the recording and chose Maya after: the same steps at the same moments, Maya at nothing.
    const late = begun(false);
    for (let i = 0; i < 2; i += 1) go(late, 'brief.prepare', { brief: b.id, step: 'rehearse' });
    expect(late.now).toBe(sim.now);
    expect(recordOf(late.player, b.id).playing!.prep).toBe(q2);
    go(late, 'brief.reader', { brief: b.id, mate: 0 });
    expect(recordOf(late.player, b.id).reader).toEqual({ mate: 0, prep: 0 });
    // Taped at the same moment: the take of her own the same, the take together lower with a reader who hasn't rehearsed.
    go(back, 'practice.self_tape', { genre: 'comedy', brief: b.id });
    go(late, 'practice.self_tape', { genre: 'comedy', brief: b.id });
    const mine = recordOf(back.player, b.id).takes.at(-1)!;
    const theirs = recordOf(late.player, b.id).takes.at(-1)!;
    expect(mine.overall).toBe(theirs.overall);
    expect(mine.together!.reader).toBe(theirs.together!.reader);
    expect(mine.together!.overall).toBeGreaterThan(theirs.together!.overall);

    // Another classmate starts from nothing; and Maya, chosen again after the recording, starts from nothing too.
    go(sim, 'brief.reader', { brief: b.id, mate: 1 });
    expect(rec.reader).toEqual({ mate: 1, prep: 0 });
    expect(go<{ reader: string }>(sim, 'brief.reader', { brief: b.id, mate: 'alone' }).reader).toBe('A Recording');
    expect(rec.reader).toBeUndefined();
    go(sim, 'brief.reader', { brief: b.id, mate: 0 });
    expect(rec.reader).toEqual({ mate: 0, prep: 0 });
  }, 120_000);
});

// ---------------------------------------------------------------------------
// school.choose_playing and work.settle, read by the clock's showing
// ---------------------------------------------------------------------------

describe('a scene for class: its way of playing and a segment’s way kept, read by the showing the clock runs', () => {
  /** The first scene study the clock sets with a scene the game has a profile of, a week or more before it's due: the save then, and its id. */
  const set = (() => {
    let found: { snap: string; id: string } | undefined;
    return () => {
      if (!found) {
        const sim = student('r09-scene');
        for (;;) {
          tended(sim, sim.now + 6 * MS_HOUR);
          const a = courseworkOf(sim, sim.player)?.assignments.find((x) => x.status === 'open' && x.template === 'scene-study' && materialOf(x.sceneId) && at(Number(x.dueOn.slice(0, 4)), Number(x.dueOn.slice(5, 7)), Number(x.dueOn.slice(8, 10)), 0) - sim.now > 7 * MS_DAY);
          if (a) { found = { snap: freeze(sim), id: a.id }; break; }
          expect(sim.now).toBeLessThan(at(2026, 12, 1));
        }
      }
      return { sim: thaw(found.snap), id: found.id };
    };
  })();
  const assignment = (sim: Simulation, id: string) => courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === id)!;
  /** The same work in each twin: read, the lines twice, rehearsed alone twice, each through the command at the same moment. */
  const prepared = (sim: Simulation, id: string) => { for (const activity of ['read', 'learn', 'learn', 'rehearse', 'rehearse']) go(sim, 'school.prepare', { assignmentId: id, activity }); };
  /** Played by the clock to its showing. */
  const toShowing = (sim: Simulation, id: string) => {
    const a = () => assignment(sim, id);
    const due = a().dueOn;
    const until = at(Number(due.slice(0, 4)), Number(due.slice(5, 7)), Number(due.slice(8, 10)) + 2, 0);
    while (!a().shown && sim.now < until) tended(sim, sim.now + 6 * MS_HOUR);
    expect(a().shown, 'shown by the clock').toBeDefined();
    return (sim.player.work ?? []).find((w) => w.at === a().shown!.at)!;
  };

  it('PLAYER JOURNEY: a scene study set by the clock, played Driven and rehearsed in on its feet, a segment played its own way and kept: the showing, run by the clock after a reload, reads the way’s rehearsal and its lean, and plays that segment its own way; its twin who chose and kept nothing is shown with neither', () => {
    const { sim, id } = set();
    const twin = thaw(freeze(sim));
    const chosen = go<{ prep: number; kept: boolean }>(sim, 'school.choose_playing', { assignmentId: id, pace: 'driven' });
    expect(chosen).toEqual({ prep: 0, kept: true });
    prepared(sim, id);
    prepared(twin, id);
    const a = assignment(sim, id);
    expect(a.playing).toMatchObject({ pace: 'driven' });
    const rehearsedIn = a.playing!.prep;
    expect(rehearsedIn).toBeGreaterThan(0);
    expect(assignment(twin, id).playing).toBeUndefined();

    // A segment played its own way, on an axis the whole leaves open: tried, waiting, then kept.
    const key = `assignment:${id}`;
    const piece = workPiece(sim, sim.player, key)!;
    const problem = problemsOf(piece).find((x) => optionsOf(piece, x).some((o) => o.adjustment === 'beat-way'))!;
    expect(problem).toBeDefined();
    go(sim, 'work.identify', { piece: key, problem: problem.id });
    const way = optionsOf(workPiece(sim, sim.player, key)!, a.book!.problem!).find((o) => o.adjustment === 'beat-way')!;
    expect(way.option!.startsWith('pace:')).toBe(false);
    expect(go<{ verdict: string }>(sim, 'work.try', { piece: key, adjustment: 'beat-way', option: way.option }).verdict).toBe('pending');
    expect(go<{ verdict: string }>(sim, 'work.settle', { piece: key, keep: true }).verdict).toBe('kept');
    const [axis, side] = way.option!.split(':');
    expect(a.book!.ways![way.segment!]).toMatchObject({ axis, side });
    const keptPrep = a.book!.ways![way.segment!]!.prep;
    expect(keptPrep).toBeGreaterThan(0);

    // Saved and loaded before the showing: the way and the segment's way kept.
    const back = reload(sim);
    expect(assignment(back, id).playing).toEqual(a.playing);
    expect(assignment(back, id).book!.ways![way.segment!]).toEqual(a.book!.ways![way.segment!]);

    const shown = toShowing(back, id);
    const plain = toShowing(twin, id);
    // The showing reads the way: its rehearsal as the approach's preparation against the scene's own mark, its lean.
    expect(shown.inputs.prep.approach).toBeGreaterThanOrEqual(rehearsedIn);
    expect(shown.inputs.required.approach).toBeGreaterThan(0);
    expect(plain.inputs.prep.approach).toBeUndefined();
    expect(plain.inputs.required.approach).toBeUndefined();
    expect(shown.inputs.lean!.responsiveness!).toBeGreaterThan(plain.inputs.lean!.responsiveness ?? 1);
    // And plays the segment its own way, as kept, leaned as that side leans and rehearsed in at least as far as when it
    // was kept; the twin's showing plays no segment its own way.
    const own = shown.inputs.piece!.own?.[way.segment!];
    expect(own?.lean).toEqual(APPROACH_EFFECT[side as AxisValue].lean);
    expect(own?.prep?.way).toBeGreaterThanOrEqual(keptPrep);
    expect(plain.inputs.piece!.own).toBeUndefined();
  }, 300_000);
});

// ---------------------------------------------------------------------------
// school.choose_part_playing
// ---------------------------------------------------------------------------

/**
 * Written work has no way of playing (from 2026-10-17, brief 13's journeys, docs/verification/playthroughs-2026-10-17/
 * journeys-criteria.md, check 2): Table Work sets a scene, but it's presented at the table, its task isn't performed
 * (`UNPERFORMED`), and no step of it rehearses a way in. Until then a way could be chosen for it, previewed as if rehearsed
 * in full, and it came to the showing at nothing: journey J12 (seed j13-6) chose ways on seven pieces of it.
 */
describe('written work: no way of playing to choose', () => {
  /** The first Table Work the clock sets: the save then, and its id. */
  const set = (() => {
    let found: { snap: string; id: string } | undefined;
    return () => {
      if (!found) {
        const sim = student('written-playing');
        for (;;) {
          tended(sim, sim.now + 6 * MS_HOUR);
          const a = courseworkOf(sim, sim.player)?.assignments.find((x) => x.status === 'open' && x.template === 'table-work');
          if (a) { found = { snap: freeze(sim), id: a.id }; break; }
          expect(sim.now).toBeLessThan(at(2027, 3, 1));
        }
      }
      return { sim: thaw(found.snap), id: found.id };
    };
  })();
  const words = 'It’s written work, presented at the table and never played: there’s no way of playing it to choose.';

  it('PLAYER JOURNEY: the Table Work the clock sets in January 2027, on a scene, is refused a way of playing in its words, by the command and by the gate the Coursework pane draws its choice behind, and through a reload; shown by the clock, its record reads no way, as its twin’s who never asked', () => {
    const { sim, id } = set();
    const a = () => courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === id)!;
    expect(a().sceneId).toBeDefined();
    expect(playingRefusal(a())).toBe(words);
    kept(sim);
    expect(sim.execute({ kind: 'school.choose_playing', payload: { assignmentId: id, scale: 'expansive' } }).error).toBe(words);
    expect(a().playing).toBeUndefined();
    const back = reload(sim);
    expect(back.execute({ kind: 'school.choose_playing', payload: { assignmentId: id, pace: 'driven' } }).error).toBe(words);
    const due = a().dueOn;
    const until = at(Number(due.slice(0, 4)), Number(due.slice(5, 7)), Number(due.slice(8, 10)) + 2, 0);
    while (!a().shown && sim.now < until) tended(sim, sim.now + 6 * MS_HOUR);
    const w = (sim.player.work ?? []).find((x) => x.at === a().shown!.at)!;
    expect(w).toBeDefined();
    expect(Object.keys(w.inputs.prep)).not.toContain('approach');
    expect(Object.keys(w.inputs.required)).not.toContain('approach');
  }, 300_000);

  it('FIXTURE: a save from before 2026-10-17 that kept a way of playing on its Table Work still to be shown has it taken off on opening, once; a performed piece’s way, chosen by the command, is kept, and so is a shown one’s (TEST SETUP: the way put on as that build let the command put it, a shown copy of the piece with its way, and the opening step marked not yet taken)', () => {
    const { sim, id } = set();
    const scene = courseworkOf(sim, sim.player)!.assignments.find((x) => x.id !== id && !playingRefusal(x))!;
    expect(scene, 'a performed piece open beside it').toBeDefined();
    go(sim, 'school.choose_playing', { assignmentId: scene.id, pace: 'driven' });
    const table = courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === id)!;
    table.playing = { chosenAt: sim.now, prep: 0, scale: 'expansive' };
    // And one shown, its way part of how it went, which opening leaves.
    const shown = { ...structuredClone(table), id: 'shown-table-work', status: 'done' as const, shown: { band: 'working' as const, score: 0.6, at: sim.now - MS_DAY, strengths: [] } };
    courseworkOf(sim, sim.player)!.assignments.push(shown);
    sim.universe.opened = (sim.universe.opened ?? []).filter((x) => x !== 'writtenUnplayed');
    const opened = reload(sim);
    const of = (s: Simulation, x: string) => courseworkOf(s, s.player)!.assignments.find((y) => y.id === x)!;
    expect(of(opened, id).playing).toBeUndefined();
    expect(of(opened, scene.id).playing).toMatchObject({ pace: 'driven' });
    expect(of(opened, 'shown-table-work').playing).toMatchObject({ scale: 'expansive' });
    expect(opened.universe.opened).toContain('writtenUnplayed');
    // Once: a way on it again (TEST SETUP) is left by the next opening, the step taken.
    of(opened, id).playing = { chosenAt: opened.now, prep: 0, scale: 'expansive' };
    expect(of(reload(opened), id).playing).toMatchObject({ scale: 'expansive' });
    expect(writtenUnplayed(opened)).toBe(1);
    expect(of(opened, id).playing).toBeUndefined();
  }, 300_000);
});

describe('school.choose_part_playing: a part’s way, kept across a reload', () => {
  it('PLAYER JOURNEY: the first spring’s part played Driven from the read-through, rehearsed in at two calls, saved and loaded, and rehearsed in at the third as far as the twin that wasn’t reloaded', () => {
    const sim = student('r09-part');
    sim.advanceTo(at(2027, 1, 4, 9) + MS_MINUTE);
    const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.personId === sim.player.id && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((x, y) => x.at - y.at);
    expect(calls.length).toBeGreaterThan(3);
    expect(go<{ prep: number }>(sim, 'school.choose_part_playing', { which: 'school', pace: 'driven' }).prep).toBe(0);
    tended(sim, calls[1]!.at + 7 * MS_HOUR);
    const proc = (s: Simulation) => processOf(s.player.school!.casting!);
    const two = proc(sim).playing!.prep;
    expect(two).toBeGreaterThan(0);
    const back = reload(sim);
    expect(proc(back).playing).toEqual(proc(sim).playing);
    tended(sim, calls[2]!.at + 7 * MS_HOUR);
    tended(back, calls[2]!.at + 7 * MS_HOUR);
    expect(proc(sim).playing!.prep).toBeGreaterThan(two);
    expect(proc(back).playing).toEqual(proc(sim).playing);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// life.look_after, as a command
// ---------------------------------------------------------------------------

describe('life.look_after, as a command', () => {
  it('PLAYER JOURNEY: an action not on the menu is refused in its words with the save as it was; a shower returns its time and what it did to each dial, which is the twin’s who let the same twenty minutes pass, and no more', () => {
    const sim = student('r09-look');
    tended(sim, at(2026, 8, 30, 8));
    const was = freeze(sim);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'bathe' } }).error).toBe('That isn’t something you can do for yourself here.');
    expect(sim.execute({ kind: 'life.look_after', payload: {} }).error).toBe('That isn’t something you can do for yourself here.');
    expect(freeze(sim)).toBe(was);
    // TEST SETUP: a day's grime, so the shower isn't refused as clean.
    sim.player.wellbeing.hygiene = 60;
    const started = sim.now;
    const r = go<{ doneAt: number; changed: Record<string, number> }>(sim, 'life.look_after', { action: 'wash' });
    expect(r.doneAt).toBe(started + LOOKING_AFTER.wash.minutes * MS_MINUTE);
    expect(sim.now).toBe(r.doneAt);
    // The twin who let the same twenty minutes pass, kept the same way first.
    const lived = thaw(was);
    lived.player.wellbeing.hygiene = 60;
    kept(lived);
    lived.advanceTo(r.doneAt);
    const moved = Object.fromEntries(Object.entries(sim.player.wellbeing).map(([k, v]) => [k, (v as number) - ((lived.player.wellbeing as unknown as Record<string, number>)[k] ?? 0)]).filter(([, d]) => d !== 0));
    for (const [k, d] of Object.entries(r.changed)) expect(d, k).toBeCloseTo(moved[k]!, 9);
    expect(Object.keys(r.changed).sort()).toEqual(Object.keys(moved).sort());
    expect(r.changed.hygiene).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// tax.federal_lien_withdraw, reached by play
// ---------------------------------------------------------------------------

describe('tax.federal_lien_withdraw: an Inherited family’s student who files nothing', () => {
  /** The 2027 return's calendar, worked from the rules: due 18 April 2028 at midnight's minute before. */
  const DUE = at(2028, 4, 18, 23, 59);
  const ASSESSED = DUE + (365 + 120) * MS_DAY;
  const LT11 = ASSESSED + 140 * MS_DAY;
  const LEVY = LT11 + 30 * MS_DAY;
  const RELEASED = LEVY + 30 * MS_DAY;
  const life = (wealth: 'inherited' | 'wealthy') => createSave(1, 'r09-lien', newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth, bankId: 'us-capital-one' } as Partial<NewSaveConfig>));

  it('PLAYER JOURNEY: at Capital One’s 3.00% on the family’s $2.6 million she owes the IRS over $10,000 on 2027 by its LT11, which files the notice of lien; the levy pays it, it’s released 30 days on, Form 12277 is refused while 2028’s return is unfiled and pressed on the lien panel once it’s filed, and the lien is withdrawn 30 days on, said once across a reload; the Wealthy family’s twin, its LT11 under $10,000, has no lien', () => {
    const sim = life('inherited');
    const r = () => returnsOf(sim.player)['2027']!;
    sim.advanceTo(ASSESSED + MS_HOUR);
    expect(r().due).toBe(DUE);
    expect([r().substitute, r().filedAt]).toEqual([true, ASSESSED]);
    expect(r().lien).toBeUndefined();

    // The LT11: owed $10,000 or more, the notice of lien filed with it.
    sim.advanceTo(LT11 + MS_HOUR);
    const lien = r().lien!;
    expect(lien).toMatchObject({ status: 'filed', filedAt: LT11 });
    expect(lien.amount).toBeGreaterThanOrEqual(10_000_00);
    const final = titled(sim, 'Final Notice Of Intent To Levy').filter((n) => n.at === LT11);
    expect(final).toHaveLength(1);
    expect(final[0]!.body).toContain(`on your 2027 return`);
    expect(titled(sim, 'The IRS Filed A Notice Of Federal Tax Lien').map((n) => n.at)).toEqual([LT11]);
    // Before payment Papers draws the withdrawal shut, and says why.
    drawn(sim, FederalLien, { year: 2027 });
    expect(drew('tax.federal_lien_withdraw').map((c) => [c.label, c.disabled, c.title])).toEqual([['Ask For Its Withdrawal (Form 12277)', true, 'You can ask for a withdrawal once the lien is released, which happens within 30 days of paying in full. Only a lien filed in error can be withdrawn sooner, and this one wasn’t.']]);

    // The levy pays it; released 30 days after payment, on its own.
    sim.advanceTo(LEVY + MS_HOUR);
    expect(r().owed).toBeUndefined();
    expect(r().lien).toMatchObject({ status: 'paid', paidAt: LEVY, releaseDue: RELEASED });
    sim.advanceTo(at(2030, 3, 10, 12));
    expect(r().lien!.status).toBe('released');
    expect(titled(sim, 'Your Federal Tax Lien Is Released').map((n) => n.at)).toEqual([RELEASED]);

    // Released: the withdrawal asks the last three years' returns filed, and 2028's isn't.
    const unfiled = 'The IRS withdraws a lien after payment only if your last three years’ returns are filed, and your 2028 return isn’t. File it first.';
    drawn(sim, FederalLien, { year: 2027 });
    expect(drew('tax.federal_lien_withdraw').map((c) => [c.disabled, c.title])).toEqual([[true, unfiled]]);
    const was = freeze(sim);
    expect(sim.execute({ kind: 'tax.federal_lien_withdraw', payload: { year: 2027 } }).error).toBe(unfiled);
    expect(freeze(sim)).toBe(was);
    // Filed, as Papers' File It sends it: paid at filing from the bank.
    const filed = sim.must<{ paid: boolean }>({ kind: 'tax.file', payload: { year: 2028 } });
    expect(filed.paid).toBe(true);
    drawn(sim, FederalLien, { year: 2027 });
    expect(drew('tax.federal_lien_withdraw').map((c) => [c.label, c.disabled])).toEqual([['Ask For Its Withdrawal (Form 12277)', false]]);
    const asked = sim.now;
    expect(press('tax.federal_lien_withdraw')).toEqual([`Form 12277 sent. The IRS decides by ${longDate(asked + 30 * MS_DAY)}.`]);
    expect(r().lien).toMatchObject({ status: 'disputed', decideAt: asked + 30 * MS_DAY });
    expect(sim.execute({ kind: 'tax.federal_lien_withdraw', payload: { year: 2027 } }).error).toBe(`You’ve already asked. The IRS decides by ${longDate(asked + 30 * MS_DAY)}.`);

    // Saved and loaded, then past its day: withdrawn, said once, and not asked again.
    const back = reload(sim);
    back.advanceTo(asked + 31 * MS_DAY);
    const after = returnsOf(back.player)['2027']!.lien!;
    expect([after.status, after.withdrawnAt]).toEqual(['withdrawn', asked + 30 * MS_DAY]);
    expect(titled(back, 'Your Federal Tax Lien Is Withdrawn').map((n) => n.body)).toEqual(['The IRS withdrew the notice of federal tax lien on your 2027 return. A withdrawn notice is treated as if it had never been filed.']);
    expect(back.execute({ kind: 'tax.federal_lien_withdraw', payload: { year: 2027 } }).error).toBe('The lien has already been withdrawn.');

    // The Wealthy family's twin: the same calendar, an LT11 on 2027 under $10,000, and no lien.
    const twin = life('wealthy');
    twin.advanceTo(LT11 + MS_HOUR);
    const t = returnsOf(twin.player)['2027']!;
    expect(t.substitute).toBe(true);
    expect(titled(twin, 'Final Notice Of Intent To Levy').filter((n) => n.at === LT11)).toHaveLength(1);
    expect(t.lien).toBeUndefined();
    expect(titled(twin, 'The IRS Filed A Notice Of Federal Tax Lien')).toEqual([]);
  }, 300_000);
});
