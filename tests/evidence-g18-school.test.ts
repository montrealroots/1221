/**
 * Evidence for seven school rows the review of 2026-10-13 left partial (verification group g18-school): the steps that
 * prepare a piece of coursework, the ways at a note that keeps coming back, the table work, and the partner and the
 * classmates the work is done with. Each command is run as the Coursework tab runs it (`sim.execute`), every scheduled
 * consequence by the clock (`sim.advanceTo`: the class day that shows the work and draws the day's moment, the evening a
 * rehearsal is booked for), and each consequence is read where the row says it is read. The figures are the rules' own
 * numbers worked here by hand and written as literals (a rehearsal kept is trust 4 and bond 2, the partner's way a fifth
 * of what's left, ten minutes a question), never asked of the constant or the helper the engine computes them with.
 *
 * - `school.prepare`: a step refused in its own words while the partner's other reading of the scene waits for an
 *   answer, and taken once it's answered; studio and library steps refused before the building's tour, which is slept
 *   through, and done once it's caught up by hand; a part read past 97% refused as having nothing more to gain; Learn
 *   Lines on the development history under `coursework:learn` three times and not a fourth; and twin lives, one scene
 *   prepared less through the command than the other, shown at its meeting by the clock: the lesser lower, judged in the
 *   scene's units (its two tones, the first again at its turn, from evaluation-10; in its two tones until then), its
 *   record holding exactly the preparation the commands left; the workbook's forecast rising
 *   with a step. The Coursework tab drawn: each step's button, grayed with its reason, and Read The Scene pressed.
 * - `school.approach`: Work On It With Your Partner moves the lines a fifth of what's left at the next rehearsal kept,
 *   once, through a reload, where a twin with no way chosen keeps its lines; Put It First, chosen through the command,
 *   leans every dimension of the showing that reads the lines by half again against the twin that kept the course's
 *   own objective, the dimensions themselves the same, and with the lines' dimensions whole shows higher. It weighs a
 *   part and doesn't better it: with the table work and the rehearsal at six tenths, as the review's twin had them, it
 *   came out lower, 48.1 against 48.3 (measured 2026-10-13). The partner's way refused in the command's words once the
 *   partner's trust is under wary, and offered again after amends. The tab's four ways drawn, the refused one grayed
 *   with its reason, Put It First pressed.
 * - `school.choose`: an answer the text cuts against, shown at the meeting, is the note; the next scene answered as the
 *   text supports takes it at its showing; the third answered against it again is given it again. Its refusals in
 *   their words (the scene read once worn out, to 0.275, is not yet known enough), ten minutes exactly, the answers
 *   through a reload. The Table Work drawn, with what cuts against a choice once it's shown.
 * - `school.ask_partner`: refused before the class is met (the session slept through), and booked once it's caught up,
 *   or met at the first class; refused under two hours ahead, past the due, over a rehearsal or another commitment, and
 *   before an intimacy scene's boundaries are agreed; declined by the partner's own day. A rehearsal kept moves trust 4,
 *   the bond 2 and practices listening, where a twin stood up moves none of them. The tab's Ask and the partner's line.
 * - `school.cancel_rehearsal`: called off with notice, no trust lost and nothing left to make right, and the evening
 *   passes with nothing; a booking kept or called off already refused; called off late, trust 4 lost, which with a
 *   rehearsal slept through brings the next class's boundary; and with the trust under wary the partner declines to be
 *   asked. The tab's Call It Off, with notice and without.
 * - `school.make_amends`: the trust a late call-off took given back exactly, no bond; a rehearsal slept through, trust
 *   6 and the bond 2; twenty minutes; the boundary the next class would bring not brought; the partner who declined an
 *   evening agreeing to it; refused with nothing to make right, and in class. The tab’s Make Amends. It was refused
 *   (TEST SETUP) away from New Haven too, a state no play reaches since nothing moves a life after it begins, until that
 *   refusal went on 2026-10-13, with help’s “They’re in New Haven.”.
 * - `school.respond`: a different reading kept (trust 1 lost where the text is on their side, the scene together read
 *   apart), taken (the answer theirs, the showing's table work a question's fifth higher, trust 2 and bond 1), or both
 *   tried (trust 3 and bond 1, read apart until the next rehearsal kept clears it); help given in 45 minutes for trust 4
 *   and bond 3, refused in class; an apology taken warmly or coolly, the bond 2 either way; a boundary pushed back on,
 *   trust 3 and bond 4 lost, lifted only by the fourth rehearsal kept through the clock, where one accepted lifts at the
 *   second; an invitation refused over a commitment that evening. The tab's moments drawn, the refused answer grayed.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) and an actor at Yale in New Haven, starting Monday 24 August
 * 2026 at 7:30 AM, played by the clock through orientation's week (the courses set their first work at The Courses And
 * What They Ask, Friday 28 August), the first classes from Monday 31 August, nine to three, and Acting I's first scene
 * due at its meeting on Tuesday 8 September. The seeds were chosen for what the clock draws on them, as a player's own
 * life draws it: g18-probe (The Cherry Orchard, Act Four, with Theo Patel, a scene in two tones; Imani asks for help on
 * 3 September, Elena to run lines on the 8th), g18-c (Trifles with Priya Reyes, who reads the obstacle another way at
 * the first class), g18-g (Trifles with Hannah Castillo, who brings the boundary, or the apology, to the first class).
 * The Coursework tab and the class's moments are rendered with react-dom/server as the player has them, their buttons
 * pressed by their own onClick.
 *
 * TEST SETUP, said again where it's done: the same seven dials before a step or a showing compared between twins, so
 * readiness is alike and only the preparation differs, and once worn out, for a read at the floor of its focus; a note
 * given three times and still open, which a life reaches by three showings short on it; parts of the preparation a
 * showing is given at, where the part under test is another; a partner's reliability (1, so a rehearsal is kept; 0, so
 * they don't come), which is drawn once for the life; and the player's town, which nothing in the game moves after a
 * life begins, for the two refusals that read it (Make Amends, and Help Now).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { instantFromZoned } from '@/engine/core/time';
import { TASK_PROFILES, TEMPLATE_TASK, type Dimension } from '@/engine/content/tasks';
import {
  courseworkOf, forecastWork, mateRecord, notesOf, partnerReadOf, questionsFor, trustOf, type Assignment,
} from '@/engine/systems/coursework';
import { momentsOf, personOf, type Moment } from '@/engine/systems/classmates';
import { recordNote } from '@/engine/systems/learning';
import { abilityOf, developmentOf, stepSpeed } from '@/engine/systems/attributes';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  toasts: [] as string[],
  buttons: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
}));

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A Gated button drawn as it is, its feature, words, title, state and onClick kept so a test can press it as the player would.
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.buttons.push({ feature: props.feature, label: words(props.children), title: props.title, disabled: Boolean(props.disabled), onClick: props.onClick as never });
      return real.Gated(props);
    },
  };
});

const { CourseworkPane } = await import('@/ui/components/CourseworkPane');
const { ClassMoments } = await import('@/ui/components/ClassMoments');

// ---------------------------------------------------------------------------
// The life, the clock, and the screen over them
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const ACTING_I = 'DRAM 103a/b';
const at = (month: number, day: number, hour: number, minute = 0) => instantFromZoned({ year: 2026, month, day, hour, minute }, ZONE);
const onDay = (key: string, hour: number, minute = 0) => { const [y, m, d] = key.split('-').map(Number); return instantFromZoned({ year: y!, month: m!, day: d!, hour, minute }, ZONE); };
const life = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const cwOf = (sim: Simulation) => courseworkOf(sim, sim.player)!;
const work = (sim: Simulation, id: string): Assignment => cwOf(sim).assignments.find((a) => a.id === id)!;
const actingI = (sim: Simulation): Assignment => cwOf(sim).assignments.find((a) => a.course === ACTING_I && (a.status === 'open' || a.status === 'revising'))!;
const byTemplate = (sim: Simulation, template: string): Assignment => cwOf(sim).assignments.find((a) => a.template === template && a.status === 'open')!;
const mateOf = (sim: Simulation, a: Assignment) => sim.player.school!.classmates[a.partner!]!;
const bond = (sim: Simulation, a: Assignment) => mateOf(sim, a).bond ?? 0;
/** The showings of a piece on the record, by the key `show` judges them under. */
const shownRecords = (sim: Simulation, a: Assignment) => (sim.player.work ?? []).filter((w) => w.inputs.key.startsWith(`show:${sim.player.id}:${a.id}:`));
const openMoments = (sim: Simulation) => momentsOf(cwOf(sim)).filter((m) => m.status === 'open');

/** TEST SETUP: the same seven dials, so the readiness a step or a showing reads is alike wherever two are compared. */
const dials = (sim: Simulation) => Object.assign(sim.player.wellbeing, { energy: 80, stress: 20, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 90, condition: 100 });

function go<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
/** A command refused: its words. */
function no(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): string {
  const r = sim.execute({ kind, payload });
  expect(r.ok, `${kind} was let through`).toBe(false);
  return r.error!;
}
/** A step of preparation from the tab, its readiness set alike (TEST SETUP). */
const step = (sim: Simulation, id: string, activity: string) => { dials(sim); return go<{ moved: number; dim: string; minutes: number }>(sim, 'school.prepare', { assignmentId: id, activity }); };
const ask = (sim: Simulation, id: string, when: number) => go<{ accepted: boolean; reason?: string; rehearsalId?: string }>(sim, 'school.ask_partner', { assignmentId: id, at: when });
/** Played to a meeting's class day and past it, rested alike (TEST SETUP) at the door. */
function toMeeting(sim: Simulation, dueOn: string): void {
  sim.advanceTo(onDay(dueOn, 8, 59));
  dials(sim);
  sim.advanceTo(onDay(dueOn, 15, 30));
}
/** TEST SETUP: a note on a part given three times and still open, as three showings short on it leave one. */
function noteThreeTimes(sim: Simulation, dim: 'memorization'): void {
  const notes = notesOf(cwOf(sim));
  for (let i = 0; i < 3; i += 1) recordNote(notes, { kind: 'dim', dim }, `2026-08-2${i + 1}`, `earlier-${i}`, 'Acting I', 0.2);
}

const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
/** The Coursework tab as the player has it: its words; the Gated buttons it drew are in `h.buttons`. */
function drawn(sim: Simulation, what: 'pane' | 'moments' = 'pane'): { html: string; text: string } {
  h.sim = sim;
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(what === 'pane' ? CourseworkPane : ClassMoments)).replace(/<!-- -->/g, '');
  return { html, text: textOf(html) };
}
const buttons = (feature: string, label: string) => h.buttons.filter((b) => b.feature === feature && b.label === label);
function only(feature: string, label: string) {
  const all = buttons(feature, label);
  expect(all, `one ${label} button`).toHaveLength(1);
  return all[0]!;
}
/** A Gated button pressed, as the player presses it: what it toasted. */
function press(b: { onClick?: () => void }): string[] {
  h.toasts = [];
  b.onClick!();
  return h.toasts;
}

/**
 * g18-g's partner let down twice before the first class: a rehearsal on Saturday 29 August slept through (trust 12 and
 * the bond 5), asked for on Friday afternoon; and Sunday's, asked for that morning, called off at noon, seven hours
 * ahead (trust 4).
 */
function letDownTwice(): { sim: Simulation; id: string } {
  const sim = life('g18-g');
  sim.advanceTo(at(8, 28, 14));
  const a = actingI(sim);
  expect(mateOf(sim, a).name).toBe('Hannah Castillo');
  expect(ask(sim, a.id, at(8, 29, 19)).accepted).toBe(true);
  // Asleep from six on Saturday for three hours, across the seven o'clock agreed.
  sim.advanceTo(at(8, 29, 18));
  go(sim, 'life.sleep', { hours: 3 });
  sim.advanceTo(at(8, 30, 9));
  expect(a.rehearsals[0]!.status).toBe('missedByYou');
  const sunday = ask(sim, a.id, at(8, 30, 19));
  expect(sunday.accepted).toBe(true);
  sim.advanceTo(at(8, 30, 12));
  expect(go<{ late: boolean }>(sim, 'school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: sunday.rehearsalId }).late).toBe(true);
  return { sim, id: a.id };
}

/** g18-g's partner stood up twice and a third evening called off late, so the trust falls under wary (25): 50 − 12 − 12 − 4 = 22. */
function underWary(): { sim: Simulation; id: string } {
  const sim = life('g18-g');
  sim.advanceTo(at(8, 28, 14));
  const a = actingI(sim);
  expect(ask(sim, a.id, at(8, 29, 19)).accepted).toBe(true);
  expect(ask(sim, a.id, at(8, 30, 19)).accepted).toBe(true);
  for (const day of [29, 30]) { sim.advanceTo(at(8, day, 18)); go(sim, 'life.sleep', { hours: 3 }); }
  sim.advanceTo(at(8, 30, 22));
  expect(a.rehearsals.map((r) => r.status)).toEqual(['missedByYou', 'missedByYou']);
  expect(trustOf(mateOf(sim, a))).toBe(26);
  const monday = ask(sim, a.id, at(8, 31, 19));
  expect(monday.accepted, monday.reason).toBe(true);
  sim.advanceTo(at(8, 31, 8));
  expect(go<{ late: boolean }>(sim, 'school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: monday.rehearsalId }).late).toBe(true);
  expect(trustOf(mateOf(sim, a))).toBe(22);
  return { sim, id: a.id };
}

// ---------------------------------------------------------------------------
// school.prepare
// ---------------------------------------------------------------------------

describe('school.prepare', () => {
  it('is refused in the moment’s own words while the partner’s other reading waits for an answer, through a reload, and taken once it’s answered', () => {
    let sim = life('g18-c');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    expect(mateOf(sim, a).name).toBe('Priya Reyes');
    step(sim, a.id, 'read');
    // Every question at the table answered as the text cuts against it.
    for (const { q, options } of questionsFor(a)) go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options.find((o) => !o.supported)!.id });
    // The first class, Monday 31 August: Priya reads the obstacle another way (the day's draw, on this seed).
    sim.advanceTo(at(8, 31, 15, 30));
    const m = openMoments(sim).find((x) => x.kind === 'disagreement');
    expect(m).toMatchObject({ assignmentId: a.id, mate: a.partner, question: 'obstacle' });
    expect(a.asks?.filter((k) => k.status === 'open') ?? []).toEqual([]);
    dials(sim);
    expect(no(sim, 'school.prepare', { assignmentId: a.id, activity: 'learn' })).toBe('Priya reads the scene another way: answer first.');
    sim = reload(sim);
    dials(sim);
    expect(no(sim, 'school.prepare', { assignmentId: a.id, activity: 'learn' })).toBe('Priya reads the scene another way: answer first.');
    go(sim, 'school.respond', { momentId: m!.id, choice: 'hold' });
    const t0 = sim.now;
    const learned = step(sim, a.id, 'learn');
    // Trifles is a medium scene: its lines take 75 minutes.
    expect(learned.minutes).toBe(75);
    expect(sim.now - t0).toBe(75 * 60_000);
    expect(work(sim, a.id).prep.memorization).toBe(learned.moved);
  });

  it('is refused a studio and the library before the building’s tour, slept through, and done once the tour is caught up by hand, through a reload', () => {
    let sim = life('g18-probe');
    // Asleep from half past nine on Thursday 27 August for four hours, across the tour at ten.
    sim.advanceTo(at(8, 27, 9, 30));
    go(sim, 'life.sleep', { hours: 4 });
    sim.advanceTo(at(8, 28, 14));
    expect(cwOf(sim).orientation.done.tour).toBeUndefined();
    expect(cwOf(sim).orientation.done.expectations).toBeDefined();
    const score = byTemplate(sim, 'movement-score');
    const context = byTemplate(sim, 'context-presentation');
    dials(sim);
    expect(no(sim, 'school.prepare', { assignmentId: score.id, activity: 'devise' })).toBe('You don’t know the building yet: the tour shows you the studios.');
    expect(no(sim, 'school.prepare', { assignmentId: context.id, activity: 'research' })).toBe('You don’t know the library yet: the tour shows you it.');
    // Desk work isn't held by it: the play is read.
    expect(step(sim, context.id, 'read-play').moved).toBeGreaterThan(0);
    const t0 = sim.now;
    expect(go<{ told: string }>(sim, 'school.orientation', { task: 'tour' }).told).toBe('You were shown the studios you can book to rehearse in, the theaters, and the Haas Family Arts Library.');
    expect(sim.now - t0).toBe(120 * 60_000);
    sim = reload(sim);
    const devised = step(sim, score.id, 'devise');
    expect(devised.minutes).toBe(60);
    expect(work(sim, score.id).prep.interpretation).toBe(devised.moved);
    expect(devised.moved).toBeGreaterThan(0);
    expect(step(sim, context.id, 'research').moved).toBeGreaterThan(0);
  });

  it('is refused as having nothing more to gain once a part is read past 97%, and not before, through a reload and the next day', () => {
    let sim = life('g18-probe');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    let reads = 0;
    let last = 0;
    while (work(sim, a.id).prep.familiarity < 0.97 && reads < 12) {
      last = work(sim, a.id).prep.familiarity;
      step(sim, a.id, 'read');
      reads += 1;
    }
    // Each read was let through below the mark; the one that would start past it isn't.
    expect(last).toBeLessThan(0.97);
    expect(work(sim, a.id).prep.familiarity).toBeGreaterThanOrEqual(0.97);
    dials(sim);
    expect(no(sim, 'school.prepare', { assignmentId: a.id, activity: 'read' })).toBe('There’s nothing more to gain from it now.');
    sim = reload(sim);
    sim.advanceTo(at(8, 29, 16));
    dials(sim);
    expect(no(sim, 'school.prepare', { assignmentId: a.id, activity: 'read' })).toBe('There’s nothing more to gain from it now.');
    // Another part is still to gain.
    expect(step(sim, a.id, 'learn').moved).toBeGreaterThan(0);
  });

  it('puts three Learn Lines on the development history under coursework:learn and not a fourth, each with its practice, through a reload', () => {
    let sim = life('g18-probe');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    step(sim, a.id, 'read');
    const t0 = sim.now;
    const steps: { trained: { id: string; delta: number }[]; practice: number[]; craft: number }[] = [];
    for (let n = 0; n < 4; n += 1) {
      const from = sim.now;
      const craft = sim.player.craft!.memorization;
      step(sim, a.id, 'learn');
      // A step's growth is recorded as it ends (`prepare` moves the clock first), so the step before's is at `from`.
      const added = developmentOf(sim.player).history.filter((e) => e.at > from);
      steps.push({
        trained: added.filter((e) => e.source === 'coursework:learn').map((e) => ({ id: e.id, delta: e.delta })),
        practice: added.filter((e) => e.source === 'prepare:memorization').map((e) => e.delta),
        craft: sim.player.craft!.memorization - craft,
      });
    }
    // The first three train the skill (the lines are the memory ability), each on the record under its step; the fourth
    // practices only.
    for (const [i, s] of steps.entries()) {
      expect(s.trained.map((e) => e.id), `Learn Lines ${i + 1}`).toEqual(i < 3 ? ['memory'] : []);
      expect(s.practice, `Learn Lines ${i + 1}`).toHaveLength(1);
      // What the record says each step grew is what the skill grew, to the thousandth it's kept at.
      expect(Math.abs((s.trained[0]?.delta ?? 0) + s.practice[0]! - s.craft)).toBeLessThanOrEqual(0.0011);
    }
    expect(work(sim, a.id).trained).toBe(3);
    sim = reload(sim);
    expect(developmentOf(sim.player).history.filter((e) => e.at > t0 && e.source === 'coursework:learn')).toHaveLength(3);
  });

  it('shows the same toned scene prepared less through the command lower at its meeting, judged in its units, its record holding the preparation the commands left, once', () => {
    const base = life('g18-probe');
    base.advanceTo(at(8, 28, 14));
    const id = actingI(base).id;
    expect(actingI(base).sceneId).toBe('cherry-orchard-4');
    expect(actingI(base).dueOn).toBe('2026-09-08');
    const less = reload(base);
    const more = reload(base);
    for (const sim of [less, more]) { step(sim, id, 'read'); step(sim, id, 'learn'); }
    // The workbook's forecast, read before and after a step of Rehearse Alone.
    const before = forecastWork(more, more.player, work(more, id), '2026-09-08').overall;
    step(more, id, 'rehearse');
    expect(forecastWork(more, more.player, work(more, id), '2026-09-08').overall).toBeGreaterThan(before);
    step(more, id, 'rehearse');
    step(more, id, 'rehearse');
    // The twins differ in the rehearsal alone.
    expect(work(less, id).prep.familiarity).toBe(work(more, id).prep.familiarity);
    expect(work(less, id).prep.memorization).toBe(work(more, id).prep.memorization);
    expect(work(less, id).prep.rehearsal).toBe(0);
    expect(work(more, id).prep.rehearsal).toBeGreaterThan(0.5);
    for (const sim of [less, more]) toMeeting(sim, '2026-09-08');
    const [l] = shownRecords(less, work(less, id));
    const [m] = shownRecords(more, work(more, id));
    // Judged in the scene's units: its two tones, comic and grave, and its one turn, which goes to the first of them
    // (`unitSegments`, from evaluation-10), so three. Until then it was judged in its two tones.
    expect(l!.inputs.piece?.segments).toHaveLength(3);
    expect(m!.inputs.piece?.segments).toHaveLength(3);
    expect(l!.inputs.piece?.segments.map((x) => x.weight)).toEqual([0.5, 0.5, 1]);
    // What the record was judged from is what the commands left: no answers at the table, no rehearsal with Theo.
    for (const [sim, rec] of [[less, l], [more, m]] as const) {
      const p = work(sim, id).prep;
      expect(rec!.inputs.prep).toEqual({ familiarity: p.familiarity, memorization: p.memorization, interpretation: 0, rehearsal: p.rehearsal, partner: 0 });
    }
    // Prepared less, shown lower: lower only on dimensions that read the rehearsal, the same on every other. One that
    // reads it may stay where it was, where something else holds it: responsiveness did, at 22.2 in both (measured
    // 2026-10-13), held by a first-year's abilities rather than the rehearsal.
    expect(l!.overall).toBeLessThan(m!.overall);
    expect(work(less, id).shown!.score).toBeLessThan(work(more, id).shown!.score);
    const task = TASK_PROFILES[TEMPLATE_TASK['scene-study'] ?? 'scene']!;
    const reads = (Object.entries(task.dims) as [Dimension, { prep?: readonly string[] }][]).filter(([, s]) => (s.prep ?? []).includes('rehearsal')).map(([d]) => d);
    const dims = Object.keys(l!.dims) as Dimension[];
    const lower = dims.filter((d) => l!.dims[d]! < m!.dims[d]!);
    expect(lower.length).toBeGreaterThan(0);
    for (const d of lower) expect(reads, d).toContain(d);
    for (const d of dims.filter((x) => !lower.includes(x))) expect(l!.dims[d], d).toBe(m!.dims[d]);
    // Shown once: a reload and another day add no second showing.
    const again = reload(less);
    again.advanceTo(at(9, 9, 20));
    expect(shownRecords(again, work(again, id))).toHaveLength(1);
  });

  it('draws each step as a button on the Coursework tab, grayed with the reason it can’t be taken, and Read The Scene pressed takes its 40 minutes', () => {
    const sim = life('g18-probe');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    dials(sim);
    const { text } = drawn(sim);
    expect(text).toContain('Acting I: Scene Study');
    expect(text).toContain('The Cherry Orchard');
    const read = only('school.prepare', 'Read The Scene');
    expect(read).toMatchObject({ disabled: false, title: '40 minutes' });
    expect(only('school.prepare', 'Learn Lines')).toMatchObject({ disabled: true, title: 'Read it first: lines are learned from a scene you know.' });
    expect(only('school.prepare', 'Rehearse Alone')).toMatchObject({ disabled: true, title: 'Learn some of the lines first.' });
    expect(only('school.prepare', 'Work On The Note')).toMatchObject({ disabled: true, title: 'There’s no note to work on until it’s been shown.' });
    expect(text).toContain('Learn Lines: Read it first: lines are learned from a scene you know.');
    const t0 = sim.now;
    const toasts = press(read);
    expect(sim.now - t0).toBe(40 * 60_000);
    const moved = a.prep.familiarity;
    expect(moved).toBeGreaterThan(0);
    expect(toasts).toEqual([`Read The Scene: 40 minutes, Knows The Scene up ${Math.round(moved * 100)}%.`]);
    drawn(sim);
    expect(only('school.prepare', 'Learn Lines')).toMatchObject({ disabled: false, title: '45 minutes' });
  });
});

// ---------------------------------------------------------------------------
// school.approach
// ---------------------------------------------------------------------------

describe('school.approach', () => {
  it('Work On It With Your Partner moves the lines a fifth of what’s left at the next rehearsal kept, once, through a reload, where a twin with no way chosen keeps its lines', () => {
    const base = life('g18-probe');
    base.advanceTo(at(8, 28, 14));
    const id = actingI(base).id;
    noteThreeTimes(base, 'memorization');
    step(base, id, 'read');
    step(base, id, 'learn');
    mateRecord(mateOf(base, actingI(base))).reliability = 1; // TEST SETUP: Theo comes when he says he will.
    let way = reload(base);
    const none = reload(base);
    expect(go<{ dim: string }>(way, 'school.approach', { assignmentId: id, kind: 'partner' }).dim).toBe('memorization');
    const lines = work(way, id).prep.memorization;
    for (const sim of [way, none]) expect(ask(sim, id, at(8, 29, 19)).accepted).toBe(true);
    way = reload(way);
    for (const sim of [way, none]) sim.advanceTo(at(8, 29, 21));
    expect(work(way, id).rehearsals[0]!.status).toBe('kept');
    expect(work(none, id).rehearsals[0]!.status).toBe('kept');
    // A fifth of what's left: the way's own figure.
    expect(work(way, id).prep.memorization).toBeCloseTo(lines + 0.2 * (1 - lines), 12);
    expect(work(way, id).partnerWorked).toBe(true);
    expect(work(none, id).prep.memorization).toBe(lines);
    expect(work(none, id).partnerWorked).toBeUndefined();
    // The partner part moves alike in both: the way adds the weakness, not more of the rehearsal.
    expect(work(way, id).prep.partner).toBe(work(none, id).prep.partner);
    // The next evening kept: the partner part again, the lines not again.
    way = reload(way);
    const once = work(way, id).prep.memorization;
    const partner = work(way, id).prep.partner;
    expect(ask(way, id, at(8, 30, 19)).accepted).toBe(true);
    way.advanceTo(at(8, 30, 21));
    expect(work(way, id).rehearsals[1]!.status).toBe('kept');
    expect(work(way, id).prep.memorization).toBe(once);
    expect(work(way, id).prep.partner).toBeGreaterThan(partner);
  });

  /**
   * Put It First weighs a part; it doesn't make the part better. No dimension of a scene reads the lines alone:
   * believability reads them with the table work, execution with the rehearsal, and a dimension is held by its shorter
   * part. With the lines learned and every other part at six tenths, as the review's twin had it, the lines put first
   * leaned dimensions the six tenths held, and came out lower than the twin leaning Knows The Scene: 48.1 against 48.3,
   * and 75.9 against 76.1 with every ability full (measured 2026-10-13). The dimensions came out the same in both; only
   * their weights moved. So the twin here has the lines' dimensions whole: the table work answered as the text supports
   * it, at the table, and the rehearsal done, with Knows The Scene and the partner part at six tenths.
   */
  it('Put It First, chosen through the command, leans the showing at the meeting toward the lines by half again, the same dimensions weighed otherwise, and with the lines’ dimensions whole shows it higher than the twin that kept the course’s own objective', () => {
    const base = life('g18-probe');
    base.advanceTo(at(8, 28, 14));
    const a = actingI(base);
    const id = a.id;
    noteThreeTimes(base, 'memorization');
    // The course's own objective for a first piece: the part it asked longest ago, Knows The Scene.
    expect(a.objective).toBe('circumstances');
    // TEST SETUP: the lines learned and the rehearsal done; Knows The Scene and the partner part at six tenths.
    Object.assign(a.prep, { familiarity: 0.6, memorization: 1, rehearsal: 1, partner: 0.6 });
    // The table work at the table, every answer as the text supports it.
    for (const { q, options } of questionsFor(a)) go(base, 'school.choose', { assignmentId: id, question: q.id, option: options.find((o) => o.supported)!.id });
    const put = reload(base);
    const kept = reload(base);
    expect(go<{ dim: string }>(put, 'school.approach', { assignmentId: id, kind: 'objective' }).dim).toBe('memorization');
    expect(work(put, id).objective).toBe('lines');
    for (const sim of [put, kept]) toMeeting(sim, '2026-09-08');
    expect(work(reload(put), id).approach).toMatchObject({ kind: 'objective', dim: 'memorization', key: 'dim:memorization' });
    const [p] = shownRecords(put, work(put, id));
    const [k] = shownRecords(kept, work(kept, id));
    // The same preparation in both, shown, and the same dimensions out of it: Put It First weighs them, no more.
    expect(p!.inputs.prep).toEqual(k!.inputs.prep);
    expect(p!.inputs.prep).toEqual({ familiarity: 0.6, memorization: 1, interpretation: 1, rehearsal: 1, partner: 0.6 });
    expect(p!.dims).toEqual(k!.dims);
    // The lines put first lean every dimension that reads them by half again, against the twin's lean on Knows The Scene.
    const task = TASK_PROFILES[TEMPLATE_TASK['scene-study'] ?? 'scene']!;
    for (const [d, s] of Object.entries(task.dims) as [Dimension, { prep?: readonly string[] }][]) {
      const want = ((s.prep ?? []).includes('memorization') ? 1.5 : 1) / ((s.prep ?? []).includes('familiarity') ? 1.5 : 1);
      expect((p!.inputs.lean?.[d] ?? 1) / (k!.inputs.lean?.[d] ?? 1), d).toBeCloseTo(want, 9);
    }
    expect(p!.overall).toBeGreaterThan(k!.overall);
  });

  it('refuses the partner’s way in the command’s words once their trust is under wary, and offers it again after amends', () => {
    const { sim, id } = underWary();
    noteThreeTimes(sim, 'memorization');
    expect(no(sim, 'school.approach', { assignmentId: id, kind: 'partner' })).toBe('Hannah would rather work alone, after last time.');
    sim.advanceTo(at(8, 31, 15, 30));
    go(sim, 'school.make_amends', { mate: work(sim, id).partner });
    expect(trustOf(mateOf(sim, work(sim, id)))).toBe(38);
    expect(go<{ dim: string }>(sim, 'school.approach', { assignmentId: id, kind: 'partner' }).dim).toBe('memorization');
  });

  it('draws the four ways on the Coursework tab, the partner’s grayed with its reason, and Put It First pressed is chosen for that work alone', () => {
    const { sim, id } = underWary();
    noteThreeTimes(sim, 'memorization');
    sim.advanceTo(at(8, 31, 15, 30));
    const { text } = drawn(sim);
    expect(text).toContain('A Note That Keeps Coming Back: Lines, given 3 times.');
    // Acting I's card comes first, with the four ways; the speech drill, which prepares a text too, has its own.
    const first = <T,>(all: T[]) => { expect(all.length).toBeGreaterThan(0); return all[0]!; };
    expect(first(buttons('school.approach', 'A Targeted Drill'))).toMatchObject({ disabled: false, title: 'a half-hour drill of it, once a day' });
    expect(first(buttons('school.approach', 'A Smaller Piece Of It'))).toMatchObject({ disabled: false });
    expect(first(buttons('school.approach', 'Work On It With Your Partner'))).toMatchObject({ disabled: true, title: 'Hannah would rather work alone, after last time.' });
    const put = first(buttons('school.approach', 'Put It First'));
    expect(put).toMatchObject({ disabled: false, title: 'it comes first, and counts for more when the work is shown' });
    expect(press(put)).toEqual(['Put It First: it comes first, and counts for more when the work is shown.']);
    expect(work(sim, id).approach?.kind).toBe('objective');
    expect(cwOf(sim).assignments.filter((a) => a.approach).map((a) => a.id)).toEqual([id]);
    expect(drawn(sim).text).toContain('Another Way At It: Put It First. On lines: it comes first, and counts for more when the work is shown. It doesn’t take the note by itself.');
  });
});

// ---------------------------------------------------------------------------
// school.choose
// ---------------------------------------------------------------------------

describe('school.choose', () => {
  it('makes an answer the text cuts against the showing’s note; the next scene answered as the text supports takes it; the third answered against it is given it again', () => {
    let sim = life('g18-probe');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    step(sim, a.id, 'read');
    step(sim, a.id, 'read');
    const odd = questionsFor(a).find(({ options }) => options.some((o) => !o.supported))!;
    const against = odd.options.find((o) => !o.supported)!;
    for (const { q, options } of questionsFor(a)) go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: (q.id === odd.q.id ? against : options.find((o) => o.supported)!).id });
    // TEST SETUP: the lines, the rehearsal and the partner part at nine tenths, so a choice is what most held it back.
    Object.assign(a.prep, { memorization: 0.9, rehearsal: 0.9, partner: 0.9 });
    toMeeting(sim, a.dueOn);
    expect(a.feedback?.focus).toEqual({ kind: 'choice', question: odd.q.id });
    expect(a.feedback?.text).toContain(`${odd.q.label}: ${against.why}`);
    const key = `choice:${odd.q.id}`;
    expect(notesOf(cwOf(sim)).find((n) => n.key === key)).toMatchObject({ status: 'open', given: 1 });
    // Shown again at the next meeting with the answer as it was: not taken there.
    sim.advanceTo(at(9, 12, 20));
    expect(work(sim, a.id).status).toBe('done');
    expect(work(sim, a.id).revision?.applied).toBe(false);
    expect(notesOf(cwOf(sim)).find((n) => n.key === key)?.status).toBe('open');
    // The next scene, set at a meeting since: that question answered as its text supports.
    const next = actingI(sim);
    expect(next.id).not.toBe(a.id);
    step(sim, next.id, 'read');
    const q2 = questionsFor(next).find(({ q }) => q.id === odd.q.id)!;
    go(sim, 'school.choose', { assignmentId: next.id, question: q2.q.id, option: q2.options.find((o) => o.supported)!.id });
    sim = reload(sim);
    toMeeting(sim, next.dueOn);
    expect(work(sim, next.id).taken).toContain(key);
    expect(work(sim, next.id).shown!.strengths).toContain(`The note on ${odd.q.label.toLowerCase()} is taken`);
    expect(notesOf(cwOf(sim)).find((n) => n.key === key)).toMatchObject({ status: 'resolved', resolvedOn: next.dueOn });
    // The third: answered against the text again, the note comes back.
    sim.advanceTo(onDay(next.dueOn, 20) + 4 * 86_400_000);
    const third = actingI(sim);
    expect([a.id, next.id]).not.toContain(third.id);
    step(sim, third.id, 'read');
    const q3 = questionsFor(third).find(({ q }) => q.id === odd.q.id)!;
    for (const { q, options } of questionsFor(third)) go(sim, 'school.choose', { assignmentId: third.id, question: q.id, option: (q.id === odd.q.id ? q3.options.find((o) => !o.supported)! : options.find((o) => o.supported)!).id });
    Object.assign(work(sim, third.id).prep, { familiarity: 0.9, memorization: 0.9, rehearsal: 0.9, partner: 0.9 }); // TEST SETUP, as before
    toMeeting(sim, third.dueOn);
    expect(work(sim, third.id).feedback?.focus).toEqual({ kind: 'choice', question: odd.q.id });
    expect(notesOf(cwOf(sim)).find((n) => n.key === key)).toMatchObject({ status: 'open', given: 2 });
  });

  it('is refused in its own words: before the scene is read, a question or an answer not the work’s, the same answer, in class, before a rehearsal, and on finished work; and takes ten minutes exactly', () => {
    let sim = life('g18-probe');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    const [first, second] = questionsFor(a);
    const supported = first!.options.find((o) => o.supported)!;
    dials(sim);
    expect(no(sim, 'school.choose', { assignmentId: a.id, question: first!.q.id, option: supported.id })).toBe('Read it first: table work is done on a text you know.');
    // TEST SETUP: worn out, readiness under 40, as a night without sleep leaves one, so a step reads at the floor of its
    // focus, a half. Read The Scene's 0.55 at half: 0.275, under the 0.3 the table asks.
    Object.assign(sim.player.wellbeing, { energy: 15, stress: 85, sleepDebt: 12, nourishment: 25, morale: 25, hygiene: 40, condition: 100 });
    const speed = stepSpeed(sim, sim.player, 'focus'); // as the step reads it, before it grows focus
    go(sim, 'school.prepare', { assignmentId: a.id, activity: 'read' });
    // 0.275 until 2026-10-16, when a step began to read the ability it's practice in (`stepSpeed`): Read The Scene goes
    // further by focus, 85% at 0 to 115% at 100, this student's about 101%. Still under the 0.3 the table asks.
    expect(a.prep.familiarity).toBeCloseTo(0.55 * 0.5 * speed, 12);
    expect(a.prep.familiarity).toBeLessThan(0.3);
    expect(no(sim, 'school.choose', { assignmentId: a.id, question: first!.q.id, option: supported.id })).toBe('Read it first: table work is done on a text you know.');
    step(sim, a.id, 'read');
    expect(a.prep.familiarity).toBeGreaterThanOrEqual(0.3);
    expect(no(sim, 'school.choose', { assignmentId: byTemplate(sim, 'movement-score').id, question: first!.q.id, option: supported.id })).toBe('That isn’t a question this work asks.');
    expect(no(sim, 'school.choose', { assignmentId: a.id, question: 'nonsense', option: supported.id })).toBe('That isn’t a question this work asks.');
    expect(no(sim, 'school.choose', { assignmentId: a.id, question: first!.q.id, option: 'nonsense' })).toBe('That isn’t one of the answers.');
    const t0 = sim.now;
    expect(go<{ supported: boolean }>(sim, 'school.choose', { assignmentId: a.id, question: first!.q.id, option: supported.id })).toEqual({ supported: true });
    expect(sim.now - t0).toBe(10 * 60_000);
    expect(no(sim, 'school.choose', { assignmentId: a.id, question: first!.q.id, option: supported.id })).toBe('That’s your answer already.');
    const cut = second!.options.find((o) => !o.supported)!;
    expect(go<{ supported: boolean }>(sim, 'school.choose', { assignmentId: a.id, question: second!.q.id, option: cut.id })).toEqual({ supported: false });
    // Before a rehearsal at seven, five minutes to it.
    expect(ask(sim, a.id, at(8, 29, 19)).accepted).toBe(true);
    sim.advanceTo(at(8, 29, 18, 55));
    const third = questionsFor(a)[2]!;
    expect(no(sim, 'school.choose', { assignmentId: a.id, question: third.q.id, option: third.options[0]!.id })).toBe('Rehearsal With Theo starts at 7:00 PM: there isn’t the time before it.');
    // In class.
    sim.advanceTo(at(8, 31, 10));
    expect(no(sim, 'school.choose', { assignmentId: a.id, question: third.q.id, option: third.options[0]!.id })).toBe('You’re at Classes until 3:00 PM.');
    sim = reload(sim);
    expect(work(sim, a.id).answers).toEqual({ [first!.q.id]: supported.id, [second!.q.id]: cut.id });
    // Shown, shown again, and done.
    sim.advanceTo(at(9, 12, 20));
    expect(work(sim, a.id).status).toBe('done');
    expect(no(sim, 'school.choose', { assignmentId: a.id, question: third.q.id, option: third.options[0]!.id })).toBe('That work is finished.');
  });

  it('draws the table work’s questions as selects with the scene’s readings, and once shown says what cuts against a choice', () => {
    const sim = life('g18-probe');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    step(sim, a.id, 'read');
    const qs = questionsFor(a);
    const odd = qs.find(({ options }) => options.some((o) => !o.supported))!;
    const against = odd.options.find((o) => !o.supported)!;
    go(sim, 'school.choose', { assignmentId: a.id, question: odd.q.id, option: against.id });
    const { html, text } = drawn(sim);
    expect(text).toContain('Table Work');
    for (const { q, options } of qs) {
      const select = html.match(new RegExp(`<select id="${a.id}-${q.id}"[^>]*>(.*?)</select>`))?.[1];
      expect(select, q.label).toBeDefined();
      expect(html).toContain(`<label for="${a.id}-${q.id}">${q.label}</label>`);
      for (const o of options) expect(textOf(select!), q.label).toContain(textOf(o.text));
      expect(select!).toContain('Not Decided');
    }
    expect(html).toMatch(new RegExp(`<option value="${against.id}" selected="">`));
    // Nothing yet says why: that comes with the showing.
    expect(text).not.toContain('What cuts against it');
    toMeeting(sim, a.dueOn);
    expect(drawn(sim).text).toContain(`What cuts against it: ${textOf(against.why!)}`);
  });
});

// ---------------------------------------------------------------------------
// school.ask_partner
// ---------------------------------------------------------------------------

describe('school.ask_partner', () => {
  it('is refused before the class is met, its session slept through, and booked once it’s caught up by hand, or once the first class has met them', () => {
    const sim = life('g18-probe');
    // Asleep from half past nine on Tuesday 25 August for four and a half hours, across Meeting Your Class.
    sim.advanceTo(at(8, 25, 9, 30));
    go(sim, 'life.sleep', { hours: 4.5 });
    sim.advanceTo(at(8, 28, 14));
    expect(cwOf(sim).orientation.done.classmates).toBeUndefined();
    const a = actingI(sim);
    expect(mateOf(sim, a).name).toBe('Theo Patel');
    expect(mateRecord(mateOf(sim, a)).met).toBeUndefined();
    expect(no(sim, 'school.ask_partner', { assignmentId: a.id, at: at(8, 29, 19) })).toBe('You haven’t met Theo yet: you’ll meet the class at orientation, or at the first class.');
    const caught = reload(sim);
    const waited = reload(sim);
    expect(go<{ told: string }>(caught, 'school.orientation', { task: 'classmates' }).told).toBe('You met the 15 others in your class: you’ll partner them in scenes, rehearse with them and be cast beside them.');
    expect(ask(caught, a.id, at(8, 29, 19)).accepted).toBe(true);
    expect(work(caught, a.id).rehearsals.map((r) => r.status)).toEqual(['booked']);
    // Not caught up: met in the room at the first class, Monday 31 August at nine.
    waited.advanceTo(at(8, 31, 15, 30));
    expect(mateRecord(mateOf(waited, a)).met).toBe(at(8, 31, 9));
    expect(ask(waited, a.id, at(9, 1, 19)).accepted).toBe(true);
  });

  it('is refused under two hours ahead, past the due, over a rehearsal or another commitment, and before the boundaries of an intimacy scene are agreed; and declined by the partner’s own day', () => {
    const sim = life('g18-probe');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    expect(no(sim, 'school.ask_partner', { assignmentId: a.id, at: sim.now + 3_600_000 })).toBe('Ask at least 2 hours ahead.');
    // Due at the meeting on Tuesday 8 September: an evening the night before ends in time, one at eight that morning doesn't.
    expect(no(sim, 'school.ask_partner', { assignmentId: a.id, at: at(9, 8, 8) })).toBe('That’s after it’s due.');
    expect(ask(sim, a.id, at(8, 29, 19)).accepted).toBe(true);
    expect(no(sim, 'school.ask_partner', { assignmentId: a.id, at: at(8, 29, 19, 30) })).toBe('You’re already rehearsing then.');
    // Another partner's evening: the game played through with Hannah on Sunday at seven.
    const game = byTemplate(sim, 'play-game');
    expect(mateOf(sim, game).name).toBe('Hannah Kim');
    expect(ask(sim, game.id, at(8, 30, 19)).accepted).toBe(true);
    expect(no(sim, 'school.ask_partner', { assignmentId: a.id, at: at(8, 30, 19) })).toBe('You have Rehearsal With Hannah then.');
    // The partner's own day: in class until three on a weekday, never before seven.
    const before = (mateRecord(mateOf(sim, a)).log ?? []).length;
    expect(ask(sim, a.id, at(8, 31, 10))).toEqual({ accepted: false, reason: 'Theo is in class until three.' });
    expect(mateRecord(mateOf(sim, a)).log![0]!.what).toBe('Couldn’t rehearse at 10:00 AM: Theo is in class until three.');
    expect(mateRecord(mateOf(sim, a)).log).toHaveLength(before + 1);
    expect(ask(sim, a.id, at(8, 29, 6))).toEqual({ accepted: false, reason: 'Theo won’t rehearse before 7 or past 22.' });
    expect(work(sim, a.id).rehearsals).toHaveLength(1);
    // A no from their own day costs nothing between you.
    expect(trustOf(mateOf(sim, a))).toBe(50);
    // The intimacy scene with Grace: not before the practice is reviewed past half.
    const close = byTemplate(sim, 'intimacy-practice');
    expect(mateOf(sim, close).name).toBe('Grace Park');
    expect(no(sim, 'school.ask_partner', { assignmentId: close.id, at: at(8, 31, 19) })).toBe('Agree how you’ll work first: no partner work without the boundaries set.');
    let reviews = 0;
    while (work(sim, close.id).prep.familiarity < 0.5 && reviews < 4) { step(sim, close.id, 'protocol'); reviews += 1; }
    expect(reviews).toBeGreaterThan(0);
    expect(ask(sim, close.id, at(8, 31, 19)).accepted).toBe(true);
  });

  it('kept, moves the partner’s trust 4 and the bond 2 and practices listening, where a twin they stood up moves none of them, once, through a reload', () => {
    const base = life('g18-probe');
    base.advanceTo(at(8, 28, 14));
    const a = actingI(base);
    expect(ask(base, a.id, at(8, 29, 19)).accepted).toBe(true);
    let kept = reload(base);
    const stood = reload(base);
    mateRecord(mateOf(kept, a)).reliability = 1; // TEST SETUP: Theo comes.
    mateRecord(mateOf(stood, a)).reliability = 0; // TEST SETUP: Theo doesn't.
    const before = (sim: Simulation) => { sim.advanceTo(at(8, 29, 18, 59)); return { trust: trustOf(mateOf(sim, a)), bond: bond(sim, a), listening: abilityOf(sim, sim.player, 'listening') }; };
    const k0 = before(kept);
    const s0 = before(stood);
    expect(k0).toEqual(s0);
    expect(k0.trust).toBe(50);
    for (const sim of [kept, stood]) sim.advanceTo(at(8, 29, 21));
    expect(work(kept, a.id).rehearsals[0]!.status).toBe('kept');
    expect(trustOf(mateOf(kept, a))).toBe(54);
    expect(bond(kept, a)).toBe(k0.bond + 2);
    expect(abilityOf(kept, kept.player, 'listening')).toBeGreaterThan(k0.listening);
    expect(work(kept, a.id).prep.partner).toBeGreaterThan(0);
    expect(mateRecord(mateOf(kept, a)).kept).toBe(1);
    expect(work(stood, a.id).rehearsals[0]!.status).toBe('missedByThem');
    expect(trustOf(mateOf(stood, a))).toBe(50);
    expect(bond(stood, a)).toBe(s0.bond);
    expect(abilityOf(stood, stood.player, 'listening')).toBe(s0.listening);
    expect(work(stood, a.id).prep.partner).toBe(0);
    expect(mateRecord(mateOf(stood, a)).stoodUp).toBe(1);
    // Kept once: a reload and the next day add nothing more.
    kept = reload(kept);
    kept.advanceTo(at(8, 30, 12));
    expect(trustOf(mateOf(kept, a))).toBe(54);
    expect(bond(kept, a)).toBe(k0.bond + 2);
    expect(mateRecord(mateOf(kept, a)).kept).toBe(1);
  });

  it('draws Ask on the Coursework tab with the partner’s trust, grayed with the refusal before the class is met, and pressed books the evening', () => {
    const sim = life('g18-probe');
    sim.advanceTo(at(8, 25, 9, 30));
    go(sim, 'life.sleep', { hours: 4.5 });
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    const { text } = drawn(sim);
    expect(text).toContain('Rehearsing With Theo');
    expect(text).toContain('Trust 50 of 100 · Came to 0 of 0 agreed · Reliability');
    expect(only('school.ask_partner', 'Ask Theo')).toMatchObject({ disabled: true, title: 'You haven’t met Theo yet: you’ll meet the class at orientation, or at the first class.' });
    go(sim, 'school.orientation', { task: 'classmates' });
    drawn(sim);
    const ask7 = only('school.ask_partner', 'Ask Theo');
    expect(ask7.disabled).toBe(false);
    // The day it offers first is today, at seven in the evening.
    expect(press(ask7)).toEqual(['Theo said yes.']);
    expect(work(sim, a.id).rehearsals.map((r) => [r.at, r.status])).toEqual([[at(8, 28, 19), 'booked']]);
  });
});

// ---------------------------------------------------------------------------
// school.cancel_rehearsal
// ---------------------------------------------------------------------------

describe('school.cancel_rehearsal', () => {
  it('called off with notice costs no trust and leaves nothing to make right, the evening passes with nothing; a booking kept or called off already is refused', () => {
    let sim = life('g18-probe');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    const mate = () => mateOf(sim, a);
    mateRecord(mate()).reliability = 1; // TEST SETUP: Theo comes when he says.
    const monday = ask(sim, a.id, at(8, 31, 19));
    const saturday = ask(sim, a.id, at(8, 29, 19));
    expect([monday.accepted, saturday.accepted]).toEqual([true, true]);
    expect(go<{ late: boolean }>(sim, 'school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: monday.rehearsalId })).toEqual({ late: false });
    expect(trustOf(mate())).toBe(50);
    expect(personOf(mate()).incidents ?? []).toEqual([]);
    expect(mateRecord(mate()).log![0]!.what).toBe('You moved a rehearsal, with notice');
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.payload.rehearsalId === monday.rehearsalId)).toBe(false);
    expect(no(sim, 'school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: monday.rehearsalId })).toBe('There’s no such rehearsal booked.');
    sim = reload(sim);
    sim.advanceTo(at(8, 29, 21));
    expect(work(sim, a.id).rehearsals.find((r) => r.id === saturday.rehearsalId)!.status).toBe('kept');
    expect(no(sim, 'school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: saturday.rehearsalId })).toBe('There’s no such rehearsal booked.');
    const partner = work(sim, a.id).prep.partner;
    // Monday evening passes: the rehearsal called off stays off, and moves nothing.
    sim.advanceTo(at(8, 31, 21));
    expect(work(sim, a.id).rehearsals.find((r) => r.id === monday.rehearsalId)!.status).toBe('cancelled');
    expect(work(sim, a.id).prep.partner).toBe(partner);
    expect(mateRecord(mate()).kept).toBe(1);
    expect(trustOf(mate())).toBe(54);
  });

  it('called off late costs the partner 4 of their trust, and with a rehearsal slept through, the next class brings their boundary', () => {
    const { sim, id } = letDownTwice();
    const mate = mateOf(sim, work(sim, id));
    expect(trustOf(mate)).toBe(34);
    expect(mate.bond).toBe(-5);
    expect((personOf(mate).incidents ?? []).map((x) => x.kind)).toEqual(['missed', 'lateCancel']);
    expect(mateRecord(mate).log![0]!.what).toBe('You called off a rehearsal at short notice');
    // The first class, Monday 31 August.
    sim.advanceTo(at(8, 31, 15, 30));
    const brought = openMoments(sim).filter((m) => m.mate === work(sim, id).partner);
    expect(brought.map((m) => [m.kind, m.text])).toEqual([['boundary', 'Hannah says that after the last times, they’ll only rehearse with you if you ask a day ahead.']]);
  });

  it('with the partner’s trust under wary, an ask is declined in their words, and the evening isn’t booked', () => {
    const { sim, id } = underWary();
    expect(ask(sim, id, at(9, 2, 19))).toEqual({ accepted: false, reason: 'Hannah would rather work on it alone, after last time.' });
    expect(work(sim, id).rehearsals.filter((r) => r.status === 'booked')).toEqual([]);
    expect(reload(sim).execute<{ accepted: boolean }>({ kind: 'school.ask_partner', payload: { assignmentId: id, at: at(9, 2, 19) } }).value?.accepted).toBe(false);
  });

  it('draws Call It Off on the Coursework tab, with notice and at short notice, and pressed calls it off', () => {
    const sim = life('g18-probe');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    const monday = ask(sim, a.id, at(8, 31, 19));
    const tonight = ask(sim, a.id, at(8, 28, 19));
    expect([monday.accepted, tonight.accepted]).toEqual([true, true]);
    drawn(sim);
    const offs = buttons('school.cancel_rehearsal', 'Call It Off');
    expect(offs.map((b) => b.title)).toEqual(['With notice', 'Short notice: Theo will mind']);
    expect(press(offs[1]!)).toEqual(['Called off.']);
    expect(work(sim, a.id).rehearsals.find((r) => r.id === tonight.rehearsalId)!.status).toBe('cancelled');
    expect(trustOf(mateOf(sim, a))).toBe(46);
    const { text } = drawn(sim);
    expect(text).toContain('Called Off');
    expect(buttons('school.cancel_rehearsal', 'Call It Off').map((b) => b.title)).toEqual(['With notice']);
  });
});

// ---------------------------------------------------------------------------
// school.make_amends
// ---------------------------------------------------------------------------

describe('school.make_amends', () => {
  it('gives back the 4 trust a late call-off took and no bond, and for a rehearsal slept through trust 6 and the bond 2, in twenty minutes, once', () => {
    const base = life('g18-probe');
    base.advanceTo(at(8, 28, 14));
    const a = actingI(base);
    expect(ask(base, a.id, at(8, 29, 19)).accepted).toBe(true);
    const late = reload(base);
    const slept = reload(base);
    late.advanceTo(at(8, 29, 10));
    go(late, 'school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: work(late, a.id).rehearsals[0]!.id });
    expect([trustOf(mateOf(late, a)), bond(late, a)]).toEqual([46, 0]);
    slept.advanceTo(at(8, 29, 18));
    go(slept, 'life.sleep', { hours: 3 });
    slept.advanceTo(at(8, 29, 22));
    expect([trustOf(mateOf(slept, a)), bond(slept, a)]).toEqual([38, -5]);
    for (const [sim, trust, b] of [[late, 50, 0], [slept, 44, -3]] as const) {
      const t0 = sim.now;
      expect(go<{ repaired: number }>(sim, 'school.make_amends', { mate: a.partner })).toEqual({ repaired: 1 });
      expect(sim.now - t0).toBe(20 * 60_000);
      expect([trustOf(mateOf(sim, a)), bond(sim, a)]).toEqual([trust, b]);
      expect(mateRecord(mateOf(sim, a)).log![0]!.what).toBe('You made it right with them');
      expect(no(sim, 'school.make_amends', { mate: a.partner })).toBe('There’s nothing between you to make right.');
      const again = reload(sim);
      expect(no(again, 'school.make_amends', { mate: a.partner })).toBe('There’s nothing between you to make right.');
      expect(trustOf(mateOf(again, a))).toBe(trust);
    }
  });

  it('made before the first class, the boundary the twin who didn’t make it right is brought there isn’t brought, nor in the three weeks after', () => {
    const { sim, id } = letDownTwice();
    const owed = reload(sim);
    const amended = reload(sim);
    amended.advanceTo(at(8, 30, 13));
    expect(go<{ repaired: number }>(amended, 'school.make_amends', { mate: work(amended, id).partner })).toEqual({ repaired: 2 });
    expect(trustOf(mateOf(amended, work(amended, id)))).toBe(44);
    // The bond −5 the rehearsal slept through cost, 2 of it given back; the call-off took none, and gives none.
    expect(bond(amended, work(amended, id))).toBe(-3);
    for (const s of [owed, amended]) s.advanceTo(at(9, 20, 20));
    const fromHer = (s: Simulation) => momentsOf(cwOf(s)).filter((m) => m.mate === work(s, id).partner).map((m) => m.kind);
    expect(fromHer(owed)).toContain('boundary');
    expect(fromHer(amended)).not.toContain('boundary');
  });

  it('brings the trust back over wary, so the partner who declined to be asked agrees to the same evening', () => {
    const { sim, id } = underWary();
    expect(ask(sim, id, at(9, 2, 19)).accepted).toBe(false);
    sim.advanceTo(at(8, 31, 15, 30));
    expect(go<{ repaired: number }>(sim, 'school.make_amends', { mate: work(sim, id).partner })).toEqual({ repaired: 3 });
    // 22 + 6 + 6 + 4, and the bond −10 + 2 + 2.
    expect(trustOf(mateOf(sim, work(sim, id)))).toBe(38);
    expect(bond(sim, work(sim, id))).toBe(-6);
    expect(ask(sim, id, at(9, 2, 19))).toMatchObject({ accepted: true });
  });

  // Until 2026-10-13 this also moved her to New York by hand to reach “Hannah is in New Haven.”, which went that day:
  // nothing in the game moves a life after it begins.
  it('is refused in class, and for no such classmate', () => {
    const { sim, id } = letDownTwice();
    sim.advanceTo(at(8, 31, 10));
    const mate = work(sim, id).partner;
    expect(no(sim, 'school.make_amends', { mate })).toBe('You’re at Classes until 3:00 PM.');
    expect(no(sim, 'school.make_amends', { mate: 99 })).toBe('There’s no such classmate.');
  });

  it('draws Make Amends on the Coursework tab under what wants making right, grayed in class, and pressed makes it right', () => {
    const { sim, id } = letDownTwice();
    sim.advanceTo(at(8, 31, 10));
    let { text } = drawn(sim);
    expect(text).toContain('Your Partners');
    expect(text).toContain('Hannah Castillo Trust 34');
    expect(text).toContain('2 times you let them down, not made right.');
    expect(only('school.make_amends', 'Make Amends')).toMatchObject({ disabled: true, title: 'You’re at Classes until 3:00 PM.' });
    sim.advanceTo(at(8, 31, 15, 30));
    drawn(sim);
    const make = only('school.make_amends', 'Make Amends');
    expect(make).toMatchObject({ disabled: false, title: 'Twenty minutes, in person' });
    expect(press(make)).toEqual(['You made it right with Hannah.']);
    ({ text } = drawn(sim));
    expect(text).not.toContain('you let them down, not made right');
    expect(buttons('school.make_amends', 'Make Amends')).toEqual([]);
    expect(trustOf(mateOf(sim, work(sim, id)))).toBe(44);
  });
});

// ---------------------------------------------------------------------------
// school.respond
// ---------------------------------------------------------------------------

describe('school.respond', () => {
  /** g18-c to the first class: every answer at the table against the text, and Priya's other reading of the obstacle open. */
  function disagreed(): { sim: Simulation; id: string; m: Moment } {
    const sim = life('g18-c');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    step(sim, a.id, 'read');
    for (const { q, options } of questionsFor(a)) go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options.find((o) => !o.supported)!.id });
    sim.advanceTo(at(8, 31, 15, 30));
    const m = openMoments(sim).find((x) => x.kind === 'disagreement')!;
    expect(m).toMatchObject({ mate: a.partner, question: 'obstacle', assignmentId: a.id });
    return { sim, id: a.id, m };
  }

  it('a different reading kept, taken or tried both ways: the trust and bond each moves, the answer, and the scene together read apart until a rehearsal kept', () => {
    const base = disagreed();
    const id = base.id;
    const a0 = work(base.sim, id);
    const trust0 = trustOf(mateOf(base.sim, a0));
    const bond0 = bond(base.sim, a0);
    const mine = a0.answers.obstacle;
    const [hold, theirs, both] = [reload(base.sim), reload(base.sim), reload(base.sim)];
    expect(go<{ done: string }>(hold, 'school.respond', { momentId: base.m.id, choice: 'hold' }).done).toBe('You kept yours. Priya isn’t persuaded, and the text is on their side.');
    expect(go<{ done: string }>(theirs, 'school.respond', { momentId: base.m.id, choice: 'theirs' }).done).toBe('You’ll play it Priya’s way.');
    expect(go<{ done: string }>(both, 'school.respond', { momentId: base.m.id, choice: 'both' }).done).toBe('You’ll try both at your next rehearsal with Priya.');
    expect(no(hold, 'school.respond', { momentId: base.m.id, choice: 'theirs' })).toBe('You’ve answered it.');
    const now = (s: Simulation) => ({ trust: trustOf(mateOf(s, work(s, id))) - trust0, bond: bond(s, work(s, id)) - bond0 });
    // Kept against the text, where theirs is supported: a point of trust. Theirs: 2 and the bond 1. Both: 3 and 1.
    expect(now(hold)).toEqual({ trust: -1, bond: 0 });
    expect(now(theirs)).toEqual({ trust: 2, bond: 1 });
    expect(now(both)).toEqual({ trust: 3, bond: 1 });
    expect(work(hold, id).readsApart).toBe('obstacle');
    expect(work(reload(hold), id).readsApart).toBe('obstacle');
    expect(work(hold, id).answers.obstacle).toBe(mine);
    expect(work(theirs, id).answers.obstacle).toBe(base.m.theirs);
    expect(work(theirs, id).readsApart).toBeUndefined();
    expect(work(both, id).tryBoth).toBe(true);
    // The scene together reads the readings apart, nine tenths agreed, where one was kept or both are still to try.
    const agree = (s: Simulation) => partnerReadOf(s, s.player, work(s, id), '2026-09-08')!.agree;
    expect([agree(hold), agree(theirs), agree(both)]).toEqual([0.9, 1, 0.9]);
    // Tried both at the next rehearsal kept: the readings come together, and nothing is held apart.
    mateRecord(mateOf(both, work(both, id))).reliability = 1; // TEST SETUP: Priya comes.
    expect(ask(both, id, at(9, 1, 19)).accepted).toBe(true);
    both.advanceTo(at(9, 1, 21));
    expect(work(both, id).rehearsals.at(-1)!.status).toBe('kept');
    expect(work(both, id).tryBoth).toBeUndefined();
    expect(agree(reload(both))).toBe(1);
    // The showing at the meeting reads the table work as answered: theirs a fifth of it, supported; kept, none.
    for (const s of [hold, theirs]) toMeeting(s, '2026-09-08');
    expect(shownRecords(hold, work(hold, id))[0]!.inputs.prep.interpretation).toBe(0);
    expect(shownRecords(theirs, work(theirs, id))[0]!.inputs.prep.interpretation).toBeCloseTo(0.2, 12);
  });

  // Until 2026-10-13 this also moved her to New York by hand to reach “They’re in New Haven.”, which went that day:
  // nothing in the game moves a life after it begins.
  it('help given takes 45 minutes and moves trust 4 and the bond 3, refused in class; said no, nothing moves', () => {
    const base = life('g18-probe');
    base.advanceTo(at(9, 3, 10));
    const m = openMoments(base).find((x) => x.kind === 'help')!;
    expect(m).toBeDefined();
    const mate = () => base.player.school!.classmates[m.mate]!;
    expect(mate().name).toBe('Imani Nguyen');
    expect(no(base, 'school.respond', { momentId: m.id, choice: 'help' })).toBe('You’re at Classes until 3:00 PM.');
    base.advanceTo(at(9, 3, 15, 30));
    const helped = reload(base);
    const declined = reload(base);
    const trust0 = trustOf(mate());
    const bond0 = mate().bond ?? 0;
    const t0 = helped.now;
    expect(go<{ done: string }>(helped, 'school.respond', { momentId: m.id, choice: 'help' }).done).toBe('You ran Imani’s lines with them.');
    expect(helped.now - t0).toBe(45 * 60_000);
    const imani = (s: Simulation) => s.player.school!.classmates[m.mate]!;
    expect(trustOf(imani(helped)) - trust0).toBe(4);
    expect((imani(helped).bond ?? 0) - bond0).toBe(3);
    const t1 = declined.now;
    expect(go<{ done: string }>(declined, 'school.respond', { momentId: m.id, choice: 'no' }).done).toBe('You told Imani you can’t.');
    expect(declined.now).toBe(t1);
    expect(trustOf(imani(declined))).toBe(trust0);
    expect(imani(declined).bond ?? 0).toBe(bond0);
  });

  it('an apology taken warmly is the bond 2 closer, coolly 2 further, and no trust either way', () => {
    const sim = life('g18-g');
    sim.advanceTo(at(8, 28, 14));
    const a = actingI(sim);
    mateRecord(mateOf(sim, a)).reliability = 0; // TEST SETUP: Hannah doesn't come.
    expect(ask(sim, a.id, at(8, 29, 19)).accepted).toBe(true);
    sim.advanceTo(at(8, 31, 15, 30));
    expect(work(sim, a.id).rehearsals[0]!.status).toBe('missedByThem');
    const m = openMoments(sim).find((x) => x.kind === 'apology')!;
    expect(m).toMatchObject({ mate: a.partner });
    const trust0 = trustOf(mateOf(sim, a));
    const bond0 = bond(sim, a);
    const [warm, cool] = [reload(sim), reload(sim)];
    expect(go<{ done: string }>(warm, 'school.respond', { momentId: m.id, choice: 'accept' }).done).toBe('You told Hannah it’s fine.');
    expect(go<{ done: string }>(cool, 'school.respond', { momentId: m.id, choice: 'cool' }).done).toBe('You let Hannah know it mattered.');
    expect([trustOf(mateOf(warm, a)) - trust0, bond(warm, a) - bond0]).toEqual([0, 2]);
    expect([trustOf(mateOf(cool, a)) - trust0, bond(cool, a) - bond0]).toEqual([0, -2]);
  });

  it('a boundary pushed back on costs trust 3 and the bond 4 and lifts only at the fourth rehearsal kept through the clock; accepted, trust 2, it lifts at the second', () => {
    const { sim, id } = letDownTwice();
    sim.advanceTo(at(8, 31, 15, 30));
    const m = openMoments(sim).find((x) => x.kind === 'boundary')!;
    expect(m).toMatchObject({ mate: work(sim, id).partner });
    mateRecord(mateOf(sim, work(sim, id))).reliability = 1; // TEST SETUP: Hannah comes when she says.
    for (const [choice, done, trust, b, lifts] of [
      ['argue', 'Hannah holds to it, and things are cooler between you: 4 rehearsals kept before it lifts.', 31, -9, 4],
      ['respect', 'From now, ask Hannah a day ahead; 2 rehearsals kept, and it lifts.', 36, -5, 2],
    ] as const) {
      const s = reload(sim);
      const mate = () => mateOf(s, work(s, id));
      expect(go<{ done: string }>(s, 'school.respond', { momentId: m.id, choice }).done).toBe(done);
      expect([trustOf(mate()), mate().bond]).toEqual([trust, b]);
      // Less than a day ahead: declined in the boundary's words.
      expect(ask(s, id, at(8, 31, 19))).toEqual({ accepted: false, reason: 'Hannah asked to be asked a day ahead, after last time.' });
      // Evenings a day and more ahead, each kept by the clock.
      for (const day of [1, 2, 3, 4]) expect(ask(s, id, at(9, day, 19)).accepted).toBe(true);
      const held: boolean[] = [];
      for (const day of [1, 2, 3, 4]) {
        s.advanceTo(at(9, day, 21));
        expect(work(s, id).rehearsals.at(-5 + day)!.status).toBe('kept');
        held.push(Boolean(personOf(mate()).boundary));
      }
      expect(held).toEqual([1, 2, 3, 4].map((n) => n < lifts));
      // Lifted: an evening less than a day ahead is agreed.
      s.advanceTo(at(9, 5, 10));
      expect(ask(s, id, at(9, 5, 19))).toMatchObject({ accepted: true });
    }
  });

  it('an invitation to run lines is refused a yes over a commitment that evening, in its words, and a no is taken', () => {
    const sim = life('g18-probe');
    sim.advanceTo(at(9, 8, 15, 30));
    const m = openMoments(sim).find((x) => x.kind === 'study')!;
    expect(m).toMatchObject({ when: at(9, 9, 19) });
    expect(sim.player.school!.classmates[m.mate]!.name).toBe('Elena Haddad');
    const game = byTemplate(sim, 'play-game');
    expect(ask(sim, game.id, at(9, 9, 19)).accepted).toBe(true);
    expect(no(sim, 'school.respond', { momentId: m.id, choice: 'yes' })).toBe('You have Rehearsal With Hannah then: say no instead.');
    expect(go<{ done: string }>(sim, 'school.respond', { momentId: m.id, choice: 'no' }).done).toBe('You told Elena you can’t.');
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === 'school.study_session')).toBe(false);
  });

  it('draws an open moment on the Coursework tab with its answers, the refused one grayed with its reason, and pressed answers it', () => {
    const sim = life('g18-probe');
    sim.advanceTo(at(9, 8, 15, 30));
    const m = openMoments(sim).find((x) => x.kind === 'study')!;
    expect(ask(sim, byTemplate(sim, 'play-game').id, at(9, 9, 19)).accepted).toBe(true);
    let { text } = drawn(sim, 'moments');
    expect(text).toContain('Your Class');
    expect(text).toContain(`Elena Haddad: Run Lines Together?. ${m.text}`);
    expect(only('school.respond', 'Say Yes')).toMatchObject({ disabled: true, title: 'You have Rehearsal With Hannah then: say no instead.' });
    const say = only('school.respond', 'Say No');
    expect(say).toMatchObject({ disabled: false, title: 'Say No' });
    expect(press(say)).toEqual(['You told Elena you can’t.']);
    ({ text } = drawn(sim, 'moments'));
    expect(buttons('school.respond', 'Say No')).toEqual([]);
    expect(text).toContain('Elena Haddad: Run Lines Together? · Say No');
  });
});
