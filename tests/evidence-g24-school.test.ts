/**
 * Evidence for seven school rows the review of 2026-10-13 left partial (verification group g24-school): the classmates'
 * trust and bonds, the casting, the term's evaluation, the notes, the preparation, the bands a showing and a night are
 * read in, and the credits. Each command is run as its screen runs it (`sim.execute`), every scheduled consequence by
 * the clock (`sim.advanceTo`: the class day that shows the work and grows the class, the evening a rehearsal is booked
 * for, a performance, a term's start that casts it and its end that evaluates it), and each consequence is read where
 * the row says it is read. The figures are the rules' own numbers worked here by hand and written as literals (wary at
 * 25, a cast list's two points, half point and point and a half, a band's growth weight of 0.85, 1 and 1.1, a fifth of the fit
 * for delivery and two points' balance either way, a night's value from -1 to 2, a skill note taken at two points),
 * never asked of the constant or the helper the engine computes them with.
 *
 * - classmate trust/bonds: an ask declined in the partner's words once the clock has let their trust fall under wary
 *   (two rehearsals slept through and one called off late), nothing booked, through a reload, and agreed again after
 *   amends; the line at wary itself (25 agrees, 24 declines); a boundary's day's notice, a minute under declined and a
 *   day to the minute agreed; the cast list read the day it goes up (the own lead, a friend's lead, a rival's lead, a
 *   friend cast smaller), with the bonds the cast moved; and the Coursework and Casting tabs drawn with the trust, the
 *   decline pressed, and the close friend and the rival.
 * - casting (castFit/castScore): twin lives through the first spring's Carlotta, one sleeping through the closing
 *   night: the fall's casting reads each run's nights at their mean, the twin a fifth of the fit lower for it, and casts
 *   it a featured part where the other keeps a lead; the real term's read listed highest first, with no guard to skip
 *   it; and Why This Cast drawn.
 * - standing/term evaluation: a fall played with every piece shown unready, every class attended, a concern in its own
 *   words where the twin that does the work is good; that standing holding back the Rep and the Summer Cabaret; a fall
 *   come to spent, growing behind the class; a student at their reach who grew nothing, in line and good; a Carlotta
 *   run played after its term's evaluation judged at the next, its nights' mean the term's work and short, once; and
 *   the Standing tab's evaluation drawn.
 * - notes and feedback: a note on a skill taken at the showing again because the skill grew by practice, where the twin
 *   that worked on it at the desk didn't take it, and what each makes of the meeting's growth; a recurring note setting
 *   the next scene's objective at the meeting that sets it, leaning that scene's showing; a choice note taken and given
 *   again; a note on the lines worded new, then better but not yet, with both figures; and the feedback, the note
 *   taken and the objective drawn.
 * - preparation dims: twin scenes, one with Learn Lines three days running, shown by the clock, the lines read into
 *   the record, every dimension they hold back and the result; a partner's words after a rehearsal kept, as the answers at the table and the lines leave
 *   them, never the hand-set interpretation; and the figure on the Coursework tab rising as Learn Lines is pressed.
 * - showing/night bands: the class day's growth weighed by the band each piece is shown at (unready 0.85, working 1,
 *   strong 1.1; a note taken 1.1, not 0.95); the encouragement after an unready showing, from a classmate at the bond
 *   of 10 and not at 9, and not after a working one; and the band drawn on the Coursework tab and the word in the class.
 * - credits: Carlotta credited at the next casting once, with its nights; the Summer Cabaret's first show credited at
 *   its last night with the nights played, once; a leave begun after the run keeping the credit as it begins; and the
 *   Profile's School Journey line drawn before, during and after.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) and an actor at Yale in New Haven, with the disposition a new
 * life is given (every trait's knob at 1), starting Monday 24 August 2026 at 7:30 AM and played by the clock: the
 * first classes from Monday 31 August, the fall's evaluation on Friday 11 December, the spring's casting on Monday 4
 * January 2027 (the Carlotta Festival, four nights from 4 to 12 May at eight), the spring's evaluation on 23 April
 * before them, the Summer Cabaret from June, and the fall's casting on Monday 23 August 2027. The seeds were chosen
 * for what the clock draws on them, as a player's own life draws it: g18-probe (Acting I's first scene The Cherry
 * Orchard with Theo Patel, due Tuesday 8 September, shown again on the 9th; the fourth, due 19 October, shown again
 * on 26 October after the October recess), g18-g (Acting I with Hannah Castillo), g24-c (cast a Carlotta lead
 * beside Hannah Bennett and Noah Kowalski, then Barbara Undershaft in Major Barbara), g24-probe (a fall, worked or
 * not). The screens are rendered with react-dom/server as the player has them, their buttons pressed by their own
 * onClick.
 *
 * TEST SETUP, said again where it's done: a student who does the coursework, its every part prepared to 0.95 each
 * midnight (as tests/casting.test.ts plays one), where a row is about what follows from work done and not the doing;
 * the same seven dials before a showing or a class day compared between twins, and the same mood at the cast list's
 * door, so readiness is alike and only what's under test differs; a scene's preparation at given figures where the part under test is another;
 * a skill lowered, so a showing is short on it; a partner's reliability (drawn once for a life) and trust (to stand at
 * wary's edge); the bonds before a casting, levelled or set friend and rival, where the cast list is what's read; a
 * skill's level set alike in two twins before a class day, so only the band's weight differs; a term begun at the
 * reach; and a student come to every class spent.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { PREP_DIMS } from '@/engine/content/coursework';
import { TASK_PROFILES, TEMPLATE_TASK, type Dimension } from '@/engine/content/tasks';
import { CALL_KIND, SUMMER_KIND } from '@/engine/systems/school';
import { attributesOf } from '@/engine/systems/attributes';
import { BAND_LABEL, PARTNER_KIND, courseworkOf, mateRecord, notesOf, questionsFor, trustOf, type Assignment } from '@/engine/systems/coursework';
import { momentsOf, personOf } from '@/engine/systems/classmates';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  toasts: [] as string[],
  tab: 'standing',
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

// The School screen's kept tab, at the one a test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
});

const { CourseworkPane } = await import('@/ui/components/CourseworkPane');
const { ClassMoments } = await import('@/ui/components/ClassMoments');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');

// ---------------------------------------------------------------------------
// The life, the clock, and the screens over them
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const ACTING_I = 'DRAM 103a/b';
const CARLOTTA = 'Carlotta Festival Of New Plays';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onDay = (key: string, hour: number, minute = 0) => { const [y, m, d] = key.split('-').map(Number); return at(y!, m!, d!, hour, minute); };
const life = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: a student who does the coursework, its every part prepared to 0.95, as tests/casting.test.ts plays one. */
const doTheWork = (sim: Simulation) => { for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95); };
/** TEST SETUP: the work done each midnight, through however the test moves the clock (a reload drops the listener; it's added again). */
const working = (sim: Simulation): Simulation => { sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => doTheWork(s)); return sim; };

/** A save played once and kept, each test given its own load of it. */
const saves = new Map<string, string>();
function kept(key: string, build: () => Simulation): Simulation {
  let raw = saves.get(key);
  if (raw === undefined) { raw = serialise(build().universe); saves.set(key, raw); }
  return loadSave(deserialise(raw) as never);
}

const cwOf = (sim: Simulation) => courseworkOf(sim, sim.player)!;
const work = (sim: Simulation, id: string): Assignment => cwOf(sim).assignments.find((a) => a.id === id)!;
const actingI = (sim: Simulation): Assignment => cwOf(sim).assignments.find((a) => a.course === ACTING_I && (a.status === 'open' || a.status === 'revising'))!;
const mateOf = (sim: Simulation, a: Assignment) => sim.player.school!.classmates[a.partner!]!;
const named = (sim: Simulation, name: string) => sim.player.school!.classmates.find((m) => m.name === name)!;
/** The showings of a piece on the record, by the key `show` judges them under. */
const shownRecords = (sim: Simulation, a: Assignment) => (sim.player.work ?? []).filter((w) => w.inputs.key.startsWith(`show:${sim.player.id}:${a.id}:`));

/** TEST SETUP: the same seven dials, so the readiness a showing or a class day reads is alike wherever two are compared. */
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
const ask = (sim: Simulation, id: string, when: number) => go<{ accepted: boolean; reason?: string; rehearsalId?: string }>(sim, 'school.ask_partner', { assignmentId: id, at: when });
/** Every question at the table answered as the text supports it, through the command (ten minutes each). */
const answerAsTheTextSupports = (sim: Simulation, a: Assignment) => { for (const { q, options } of questionsFor(a)) go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id }); };
/** Played to a meeting's class day and past it, rested alike (TEST SETUP) at the door. */
function toMeeting(sim: Simulation, dueOn: string): void {
  sim.advanceTo(onDay(dueOn, 8, 59));
  dials(sim);
  sim.advanceTo(onDay(dueOn, 15, 30));
}

const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
/** A screen as the player has it: its words; the Gated buttons it drew are in `h.buttons`. */
function drawn(sim: Simulation, screen: FunctionComponent, tab = 'standing'): { html: string; text: string } {
  h.sim = sim;
  h.tab = tab;
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: textOf(html) };
}
const buttons = (feature: string, label: string) => h.buttons.filter((b) => b.feature === feature && b.label === label);
/** A Gated button pressed, as the player presses it: what it toasted. */
function press(b: { onClick?: () => void }): string[] {
  h.toasts = [];
  b.onClick!();
  return h.toasts;
}

// ---------------------------------------------------------------------------
// The lives the rows share, played once
// ---------------------------------------------------------------------------

/** g18-probe on Friday 28 August 2026 at two, the courses' first work set. */
const probeAug28 = () => kept('g18-probe:aug28', () => { const s = life('g18-probe'); s.advanceTo(at(2026, 8, 28, 14)); return s; });
/** g18-g on the same afternoon, Acting I partnered with Hannah Castillo. */
const hannahAug28 = () => kept('g18-g:aug28', () => { const s = life('g18-g'); s.advanceTo(at(2026, 8, 28, 14)); return s; });
/** g24-c, doing the work, at the spring's casting's door: Monday 4 January 2027, a minute to nine. */
const castDoor = () => working(kept('g24-c:jan', () => { const s = working(life('g24-c')); s.advanceTo(at(2027, 1, 4, 8, 59)); return s; }));
/** g24-c, doing the work, two hours before Carlotta's closing night: Wednesday 12 May 2027 at six. */
const closingEve = () => working(kept('g24-c:closing', () => { const s = castDoor(); s.advanceTo(at(2027, 5, 12, 18)); return s; }));
/** The same, every night played, at the fall's casting: Monday 23 August 2027, a minute past nine. */
const fallCast = () => working(kept('g24-c:fall', () => { const s = closingEve(); s.advanceTo(at(2027, 8, 23, 9, 1)); return s; }));

/**
 * g18-g's partner, Hannah Castillo, let down by the clock until her trust is under wary: two rehearsals slept through
 * (twelve each) and a third called off that morning (four), 50 − 12 − 12 − 4 = 22. Asked for on Friday afternoon.
 */
function underWary(): { sim: Simulation; id: string } {
  const sim = hannahAug28();
  const a = actingI(sim);
  expect(mateOf(sim, a).name).toBe('Hannah Castillo');
  expect(trustOf(mateOf(sim, a))).toBe(50);
  expect(ask(sim, a.id, at(2026, 8, 29, 19)).accepted).toBe(true);
  expect(ask(sim, a.id, at(2026, 8, 30, 19)).accepted).toBe(true);
  // Asleep from six on Saturday and Sunday for three hours, across the seven o'clocks agreed.
  for (const day of [29, 30]) { sim.advanceTo(at(2026, 8, day, 18)); go(sim, 'life.sleep', { hours: 3 }); }
  sim.advanceTo(at(2026, 8, 30, 22));
  expect(work(sim, a.id).rehearsals.map((r) => r.status)).toEqual(['missedByYou', 'missedByYou']);
  // 50 − 12 − 12: a point over wary, and she still agrees to Monday.
  expect(trustOf(mateOf(sim, a))).toBe(26);
  const monday = ask(sim, a.id, at(2026, 8, 31, 19));
  expect(monday.accepted).toBe(true);
  sim.advanceTo(at(2026, 8, 31, 8));
  expect(go<{ late: boolean }>(sim, 'school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: monday.rehearsalId }).late).toBe(true);
  expect(trustOf(mateOf(sim, a))).toBe(22);
  return { sim, id: a.id };
}

// ---------------------------------------------------------------------------
// classmate trust/bonds
// ---------------------------------------------------------------------------

describe('classmate trust/bonds', () => {
  it('declines an ask in the partner’s own words once the clock has let their trust fall under wary, nothing booked, through a reload; amends bring it back over and the evening is agreed', () => {
    const { sim: s0, id } = underWary();
    const words = 'Hannah would rather work on it alone, after last time.';
    expect(ask(s0, id, at(2026, 9, 2, 19))).toEqual({ accepted: false, reason: words });
    expect(mateRecord(mateOf(s0, work(s0, id))).log![0]!.what).toBe(`Couldn’t rehearse at 7:00 PM: ${words}`);
    expect(work(s0, id).rehearsals.filter((r) => r.status === 'booked')).toEqual([]);
    expect(s0.universe.scheduled.filter((i) => i.kind === PARTNER_KIND && i.status === 'pending')).toEqual([]);
    const sim = reload(s0);
    expect(ask(sim, id, at(2026, 9, 2, 19))).toEqual({ accepted: false, reason: words });
    expect(work(sim, id).rehearsals.filter((r) => r.status === 'booked')).toEqual([]);
    // Made right after the first class: twelve less six for each evening slept through, the four called off late given
    // back, 22 + 6 + 6 + 4 = 38, over wary again; and the same evening is agreed.
    sim.advanceTo(at(2026, 8, 31, 15, 30));
    expect(go<{ repaired: number }>(sim, 'school.make_amends', { mate: work(sim, id).partner })).toEqual({ repaired: 3 });
    expect(trustOf(mateOf(sim, work(sim, id)))).toBe(38);
    expect(ask(sim, id, at(2026, 9, 2, 19))).toMatchObject({ accepted: true });
    expect(work(sim, id).rehearsals.filter((r) => r.status === 'booked').map((r) => r.at)).toEqual([at(2026, 9, 2, 19)]);
  });

  it('draws the line at wary itself: at trust 25 the partner agrees and the evening is booked, at 24 they decline in their words and it isn’t', () => {
    const at25 = probeAug28();
    const at24 = probeAug28();
    const a = actingI(at25);
    expect(mateOf(at25, a).name).toBe('Theo Patel');
    // TEST SETUP: Theo's trust at wary's edge, which the trust's own moves (4, 12, 4, 6) don't land on from 50.
    mateRecord(mateOf(at25, a)).trust = 25;
    mateRecord(mateOf(at24, a)).trust = 24;
    expect(ask(at25, a.id, at(2026, 8, 29, 19))).toMatchObject({ accepted: true });
    expect(work(at25, a.id).rehearsals.map((r) => [r.at, r.status])).toEqual([[at(2026, 8, 29, 19), 'booked']]);
    expect(at25.universe.scheduled.filter((i) => i.kind === PARTNER_KIND && i.status === 'pending').map((i) => i.at)).toEqual([at(2026, 8, 29, 19)]);
    expect(ask(at24, a.id, at(2026, 8, 29, 19))).toEqual({ accepted: false, reason: 'Theo would rather work on it alone, after last time.' });
    expect(work(at24, a.id).rehearsals).toEqual([]);
    expect(at24.universe.scheduled.filter((i) => i.kind === PARTNER_KIND && i.status === 'pending')).toEqual([]);
  });

  it('asks a day’s notice once a boundary is set after being let down twice: a minute under a day ahead declined in its words, a day ahead to the minute agreed', () => {
    const sim = hannahAug28();
    const a = actingI(sim);
    // Let down twice before the first class: Saturday's rehearsal slept through, Sunday's called off that noon.
    expect(ask(sim, a.id, at(2026, 8, 29, 19)).accepted).toBe(true);
    sim.advanceTo(at(2026, 8, 29, 18));
    go(sim, 'life.sleep', { hours: 3 });
    sim.advanceTo(at(2026, 8, 30, 9));
    const sunday = ask(sim, a.id, at(2026, 8, 30, 19));
    sim.advanceTo(at(2026, 8, 30, 12));
    go(sim, 'school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: sunday.rehearsalId });
    // The first class, Monday 31 August: Hannah brings the boundary; answered that evening, accepted.
    sim.advanceTo(at(2026, 8, 31, 19));
    const m = momentsOf(cwOf(sim)).find((x) => x.kind === 'boundary')!;
    expect(m).toMatchObject({ mate: a.partner, status: 'open', text: 'Hannah says that after the last times, they’ll only rehearse with you if you ask a day ahead.' });
    go(sim, 'school.respond', { momentId: m.id, choice: 'respect' });
    expect(personOf(mateOf(sim, work(sim, a.id))).boundary).toBeDefined();
    const now = sim.now;
    expect(ask(sim, a.id, now + 24 * MS_HOUR - 60_000)).toEqual({ accepted: false, reason: 'Hannah wants a day’s notice after last time. Ask for an evening at least a day ahead.' });
    expect(work(sim, a.id).rehearsals.filter((r) => r.status === 'booked')).toEqual([]);
    expect(ask(sim, a.id, now + 24 * MS_HOUR)).toMatchObject({ accepted: true });
    expect(work(sim, a.id).rehearsals.filter((r) => r.status === 'booked').map((r) => r.at)).toEqual([now + 24 * MS_HOUR]);
  });

  it('reads the cast list the day it goes up: the own lead lifts the mood two points, a friend’s lead half a point more, a rival’s lead adds a point and a half of stress, and a friend cast smaller moves nothing', () => {
    const [level, friends, smaller] = [castDoor(), castDoor(), castDoor()];
    // TEST SETUP: every classmate level with the player, bond 0; then a friend and a rival in one twin, a friend in the other.
    for (const s of [level, friends, smaller]) for (const m of s.player.school!.classmates) m.bond = 0;
    named(friends, 'Hannah Bennett').bond = 60;
    named(friends, 'Noah Kowalski').bond = -40;
    named(smaller, 'Nadia Morales').bond = 60;
    const nine = at(2027, 1, 4, 9);
    for (const s of [level, friends, smaller]) {
      s.advanceTo(nine - 1);
      Object.assign(s.player.wellbeing, { morale: 50, stress: 30 }); // TEST SETUP: the same mood at the door.
      s.advanceTo(nine);
    }
    for (const s of [level, friends, smaller]) {
      const sizes = Object.fromEntries(s.player.school!.around!.list.filter((x) => x.production === CARLOTTA).map((x) => [x.name, x.size]));
      expect(sizes).toMatchObject({ You: 'lead', 'Hannah Bennett': 'lead', 'Noah Kowalski': 'lead', 'Nadia Morales': 'featured' });
    }
    const w = (s: Simulation) => s.player.wellbeing;
    // The own lead: two points of mood, with every knob at 1.
    expect(w(level).morale).toBeCloseTo(52, 6);
    // A friend's lead: half a point more; a rival's: a point and a half of stress.
    expect(w(friends).morale - w(level).morale).toBeCloseTo(0.5, 9);
    expect(w(friends).stress - w(level).stress).toBeCloseTo(1.5, 9);
    // A friend cast featured: nothing.
    expect(w(smaller).morale).toBe(w(level).morale);
    expect(w(smaller).stress).toBe(w(level).stress);
    // The bonds the cast moved, before the list was read: ten for the weeks shared, twelve back where a lead written for
    // either went to the other (the player's lead, which Nadia could have had).
    const bonds = (s: Simulation) => ['Hannah Bennett', 'Noah Kowalski', 'Nadia Morales'].map((n) => named(s, n).bond);
    expect(bonds(level)).toEqual([10, 10, -2]);
    expect(bonds(friends)).toEqual([70, -30, -2]);
    expect(bonds(smaller)).toEqual([10, 10, 58]);
    // Read once: a reload and the next day move none of them again.
    const again = reload(friends);
    again.advanceTo(at(2027, 1, 5, 12));
    expect(bonds(again)).toEqual([70, -30, -2]);
    expect(again.player.school!.around!.term).toBe(1);
  });

  it('draws the partner’s trust with the decline on the Coursework tab, pressed in their words, and the cast list’s close friend and rival on the Casting tab', () => {
    const { sim, id } = underWary();
    const { text } = drawn(sim, CourseworkPane);
    expect(text).toContain('Rehearsing With Hannah');
    expect(text).toContain('Trust 22 of 100 · No rehearsals agreed yet · You missed 2');
    const words = 'Hannah would rather work on it alone, after last time.';
    const asks = buttons('school.ask_partner', 'Ask Hannah').filter((b) => b.title === words);
    expect(asks).toHaveLength(1);
    expect(asks[0]!.disabled).toBe(false);
    expect(press(asks[0]!)).toEqual([`Hannah can’t: ${words}`]);
    expect(work(sim, id).rehearsals.filter((r) => r.status === 'booked')).toEqual([]);
    // The cast list on the Casting tab, a friend and a rival set before it went up (TEST SETUP, as above).
    const friends = castDoor();
    for (const m of friends.player.school!.classmates) m.bond = 0;
    named(friends, 'Hannah Bennett').bond = 60;
    named(friends, 'Noah Kowalski').bond = -40;
    friends.advanceTo(at(2027, 1, 4, 9, 1));
    const cast = drawn(friends, SchoolWorkspace, 'casting').text;
    expect(cast).toContain(`Hannah Bennett ${CARLOTTA} A Leading Part In A New Play Close Friend`);
    expect(cast).toContain(`Noah Kowalski ${CARLOTTA} A Leading Part In A New Play Rival`);
    expect(cast).toContain(`Nadia Morales ${CARLOTTA} A Featured Part In A New Play`);
    expect(cast).not.toContain(`Nadia Morales ${CARLOTTA} A Featured Part In A New Play Rival`);
  });
});

// ---------------------------------------------------------------------------
// casting (castFit/castScore)
// ---------------------------------------------------------------------------

describe('casting (castFit/castScore)', () => {
  const runOf = (s: Simulation, production: string) => s.player.school!.runs!.find((r) => r.production === production)!;
  const you = (s: Simulation) => s.player.school!.castRead!.rows.find((r) => r.you)!;
  const row = (s: Simulation, name: string) => s.player.school!.castRead!.rows.find((r) => r.name === name)!;
  const r3 = (x: number) => Math.round(x * 1000) / 1000;

  it('reads a Carlotta closing night slept through as delivered at nothing, the run at its nights’ mean, and casts the twin a featured part where the one who played it keeps a lead', () => {
    const played = closingEve();
    const slept = closingEve();
    expect(played.player.school!.casting).toMatchObject({ production: CARLOTTA, size: 'lead', performed: 3 });
    expect(runOf(played, CARLOTTA)).toMatchObject({ nights: 3, missed: 0 });
    const three = runOf(played, CARLOTTA).delivered;
    // The closing night, at eight, is all that's left of it.
    const left = played.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.call === 'performance' && i.payload.which !== 'rep');
    expect(left.map((i) => [i.at, i.payload.last])).toEqual([[at(2027, 5, 12, 20), true]]);
    // Asleep from six for five hours, across it.
    go(slept, 'life.sleep', { hours: 5 });
    for (const s of [played, slept]) s.advanceTo(at(2027, 5, 12, 23));
    expect(runOf(played, CARLOTTA)).toMatchObject({ nights: 4, missed: 0 });
    expect(runOf(slept, CARLOTTA)).toMatchObject({ nights: 4, missed: 1, delivered: three });
    const four = runOf(played, CARLOTTA).delivered;
    expect(four - three).toBeGreaterThan(0.5);
    // A performance missed is a grave breach: good to warning; the one who played stays good.
    expect(played.player.school!.standing).toBe('good');
    expect(slept.player.school!.standing).toBe('warning');
    // Through a reload, to the fall's casting.
    const [K, M] = [working(reload(played)), working(reload(slept))];
    for (const s of [K, M]) s.advanceTo(at(2027, 8, 23, 9, 1));
    // The Seagull's understudy run-through is the one Rep night before it.
    const rep = runOf(K, 'The Seagull');
    expect(rep).toMatchObject({ source: 'rep', nights: 1 });
    expect(runOf(M, 'The Seagull').delivered).toBe(rep.delivered);
    // A School night and a Rep night weigh one each (both under eight nights): the share is the nights' sum over their
    // number, the night slept through adding nothing to the sum and one to the number.
    expect(K.player.school!.lastWork).toMatchObject({ size: 'lead', delivery: r3((rep.delivered + four) / 5), weight: 5 });
    expect(M.player.school!.lastWork).toMatchObject({ size: 'lead', delivery: r3((rep.delivered + three) / 5), weight: 5 });
    expect(K.player.school!.lastWork!.from!.find((f) => f.what === CARLOTTA)).toMatchObject({ source: 'school', nights: 4, delivery: r3(four / 4), weight: 4 });
    expect(M.player.school!.lastWork!.from!.find((f) => f.what === CARLOTTA)).toMatchObject({ source: 'school', nights: 4, delivery: r3(three / 4), weight: 4 });
    // Each run read once, at this casting.
    for (const s of [K, M]) expect(s.player.school!.runs!.filter((r) => r.readAtCasting === 2).map((r) => r.production).sort()).toEqual([CARLOTTA, 'The Seagull']);
    // The chair's read of the player: the fit, four fifths of it whatever was delivered and a fifth by the share
    // delivered, two points off for last time's lead; to a tenth, as it's kept.
    for (const s of [K, M]) {
      const y = you(s);
      expect(y.delivery).toBe(s.player.school!.lastWork!.delivery);
      expect(y.balance).toBe(-2);
      expect(Math.abs(y.score - (y.fit * (0.8 + 0.2 * y.delivery) - 2))).toBeLessThanOrEqual(0.1);
    }
    expect(you(K).score - you(M).score).toBeGreaterThan(2);
    // Read for the same play, with Samuel Park read the same in both: the player above him, then below.
    for (const s of [K, M]) expect(s.player.school!.castRead!.play).toBe('Major Barbara');
    expect(row(M, 'Samuel Park').score).toBe(row(K, 'Samuel Park').score);
    const order = (s: Simulation) => s.player.school!.castRead!.rows.map((r) => r.name);
    expect(order(K).indexOf('You')).toBeLessThan(order(K).indexOf('Samuel Park'));
    expect(order(M).indexOf('You')).toBeGreaterThan(order(M).indexOf('Samuel Park'));
    // And the part given moves with it.
    expect(you(K).size).toBe('lead');
    expect(you(M).size).toBe('featured');
    expect(K.player.school!.casting).toMatchObject({ play: 'Major Barbara', role: 'Barbara Undershaft', size: 'lead' });
    expect(M.player.school!.casting).toMatchObject({ play: 'Major Barbara', size: 'featured' });
  });

  it('lists a real term’s cast by the chair’s read, highest first, each read its fit by a fifth for delivery and the balance, with no lead read below a featured part', () => {
    const K = fallCast();
    const rows = K.player.school!.castRead!.rows;
    expect(rows.filter((r) => r.you)).toHaveLength(1);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < rows.length; i += 1) expect(rows[i]!.score, rows[i]!.name).toBeLessThanOrEqual(rows[i - 1]!.score);
    // Last time's lead two points down, a featured part two up, a supporting part even.
    for (const r of rows) expect([-2, 0, 2], r.name).toContain(r.balance);
    for (const r of rows) expect(Math.abs(r.score - (r.fit * (0.8 + 0.2 * r.delivery) + r.balance)), r.name).toBeLessThanOrEqual(0.1);
    const leads = rows.filter((r) => r.size === 'lead');
    const featured = rows.filter((r) => r.size === 'featured');
    expect(leads.length).toBeGreaterThan(0);
    expect(featured.length).toBeGreaterThan(0);
    expect(Math.min(...leads.map((r) => r.score))).toBeGreaterThanOrEqual(Math.max(...featured.map((r) => r.score)));
  });

  it('draws Why This Cast on the Casting tab: the play and term, what the player’s delivery is read from, and each row’s fit, delivery, balance, read and part', () => {
    const K = fallCast();
    const y = you(K);
    const { text } = drawn(K, SchoolWorkspace, 'casting');
    expect(text).toContain('Why This Cast');
    expect(text).toContain(`You ${y.fit.toFixed(1)} ${Math.round(y.delivery * 100)}% -2 ${y.score.toFixed(1)} Barbara Undershaft`);
    const sam = row(K, 'Samuel Park');
    expect(text).toContain(`Samuel Park ${sam.fit.toFixed(1)} ${Math.round(sam.delivery * 100)}% ${sam.balance > 0 ? `+${sam.balance}` : sam.balance} ${sam.score.toFixed(1)} ${sam.part}`);
    expect(text).toContain(`Your ${Math.round(y.delivery * 100)}% delivered comes from The Seagull, Yale Rep, 1 night`);
  });
});

// ---------------------------------------------------------------------------
// standing/term evaluation
// ---------------------------------------------------------------------------

describe('standing/term evaluation', () => {
  /** g24-probe's fall, played by the clock to the day after its evaluation: as it comes, and doing the work. */
  const fallAsItComes = () => kept('g24-probe:dec-plain', () => { const s = life('g24-probe'); s.advanceTo(at(2026, 12, 12, 12)); return s; });
  const fallWorked = () => working(kept('g24-probe:dec-work', () => { const s = working(life('g24-probe')); s.advanceTo(at(2026, 12, 12, 12)); return s; }));
  /** The fall's pieces due, shown or not shown, and the band each stands at: a reshow's in place of the first. */
  const pieces = (s: Simulation) => cwOf(s).assignments.filter((a) => a.term === 0 && (a.shown || a.status === 'missed'));
  const bandOf = (a: Assignment) => (a.status === 'missed' || a.revision?.missed ? 'unready' : a.revision?.band ?? a.shown!.band);

  it('weighs a fall played with every piece shown unready and every class attended as a concern, in its own words, where the twin that does the work stays good', () => {
    const plain = fallAsItComes();
    const done = fallWorked();
    const n = pieces(plain).length;
    expect(n).toBeGreaterThanOrEqual(3);
    expect(pieces(plain).map(bandOf).filter((b) => b !== 'unready')).toEqual([]);
    expect(plain.player.school!.history).toHaveLength(1);
    const [review] = plain.player.school!.history;
    expect(review).toMatchObject({ term: 0, standing: 'concern', attendance: 1, coursework: { shown: n, unready: n, strong: 0 } });
    expect(review!.reason).toContain('You came to 100% of the classes, calls and shifts asked of you');
    expect(review!.reason).toContain(` ${n} of the ${n} pieces due in class were Unready or not shown. That’s short of what the program asks.`);
    expect(plain.player.school!.standing).toBe('concern');
    // The twin: under half unready, half or more strong, and the faculty say so.
    const m = pieces(done).length;
    const unready = pieces(done).map(bandOf).filter((b) => b === 'unready').length;
    const strong = pieces(done).map(bandOf).filter((b) => b === 'strong' || b === 'exceptional').length;
    expect(unready * 2).toBeLessThan(m);
    expect(strong * 2).toBeGreaterThanOrEqual(m);
    expect(done.player.school!.history[0]).toMatchObject({ term: 0, standing: 'good', attendance: 1, coursework: { shown: m, unready, strong } });
    expect(done.player.school!.history[0]!.reason).toContain(` The faculty noted your coursework: ${strong} of ${m} pieces were Strong or better.`);
    expect(done.player.school!.standing).toBe('good');
    // Evaluated once: a reload and the week after add no second review.
    const again = reload(plain);
    again.advanceTo(at(2026, 12, 19, 12));
    expect(again.player.school!.history).toHaveLength(1);
    expect(again.player.school!.standing).toBe('concern');
  });

  it('holds the Rep and the Summer Cabaret to that standing: at the spring’s casting the good twin understudies at the Rep and the concern doesn’t, and the summer’s company is refused the concern in its words', () => {
    const plain = fallAsItComes();
    const done = fallWorked();
    for (const s of [plain, done]) s.advanceTo(at(2027, 1, 4, 9, 1));
    expect(done.player.school!.rep).toMatchObject({ production: 'The Seagull', role: 'Nina', kind: 'understudy' });
    expect(plain.player.school!.rep).toBeUndefined();
    // Both cast in the spring's School production all the same: the pool is the castable, not the good.
    for (const s of [plain, done]) expect(s.player.school!.casting).toMatchObject({ production: CARLOTTA });
    for (const s of [plain, done]) s.advanceTo(at(2027, 2, 1, 12));
    expect(no(plain, 'school.summer_cabaret')).toBe('The Summer Cabaret only takes students in good standing.');
    expect(go<{ from: number }>(done, 'school.summer_cabaret').from).toBe(at(2027, 6, 4, 13));
  });

  it('weighs a fall come to every class spent, every class attended, as growing behind the class, in its words, where the rested twin is not behind', () => {
    const spent = working(life('g24-probe'));
    // TEST SETUP: at every class day's door, spent: a third of the energy, stressed, short of sleep and low.
    for (let d = at(2026, 8, 31, 8, 58); d < at(2026, 12, 11, 8); d += 24 * MS_HOUR) {
      spent.advanceTo(d);
      Object.assign(spent.player.wellbeing, { energy: 30, stress: 85, sleepDebt: 20, morale: 20 });
      spent.advanceTo(d + 7 * MS_HOUR);
    }
    spent.advanceTo(at(2026, 12, 12, 12));
    const [review] = spent.player.school!.history;
    const rested = fallWorked().player.school!.history[0]!;
    expect(review).toMatchObject({ term: 0, standing: 'concern', attendance: 1 });
    // Grew under half what the rested twin and the class did, from the same start.
    expect(review!.growth * 2).toBeLessThan(rested.growth);
    expect(review!.growth * 2).toBeLessThan(review!.classGrowth);
    expect(review!.reason).toContain(`Your craft grew ${review!.growth.toFixed(1)} points, and the class’s middle student’s grew ${review!.classGrowth.toFixed(1)}. Allowing for how much room each of you had to grow, that’s behind the class.`);
    expect(rested.reason).not.toContain('behind the class');
  });

  it('weighs a student who began the term at their reach and grew nothing as in line with the class, good, not behind it', () => {
    const sim = working(life('g24-probe'));
    // TEST SETUP: a term begun at the reach, every skill at its ceiling (written into the craft the ceilings are kept for).
    const ceiling = sim.player.craftCeiling!;
    Object.assign(sim.player.craft!, ceiling);
    sim.player.school!.tally.craftAtStart = { ...ceiling };
    sim.advanceTo(at(2026, 12, 12, 12));
    const [review] = sim.player.school!.history;
    expect(review!.growth).toBe(0);
    expect(review!.classGrowth).toBeGreaterThan(0.5);
    expect(review).toMatchObject({ term: 0, standing: 'good', attendance: 1 });
    expect(review!.reason).toContain(`Your craft grew 0.0 points, and the class’s middle student’s grew ${review!.classGrowth.toFixed(1)}. Allowing for how much room each of you had to grow, that’s in line with the class.`);
  });

  it('judges a run played after its term’s evaluation at the next, once: its nights with the term’s own at their mean are the term’s work, short, in its words', () => {
    const K = fallCast();
    // Carlotta closed on 12 May, after the spring's evaluation of 23 April: kept for the next.
    const late = K.player.school!.unreviewed ?? [];
    expect(late.map((c) => c.production)).toEqual([CARLOTTA]);
    const carlottaNights = { ...late[0]!.nights };
    K.advanceTo(at(2027, 12, 20, 12));
    const fall = K.player.school!.casting!;
    expect(fall).toMatchObject({ play: 'Major Barbara', performed: 8 });
    const V = { off: -1, solid: 0, strong: 1, remarkable: 2 } as const;
    const all = [carlottaNights, fall.nights ?? {}].flatMap((n) => Object.entries(n) as [keyof typeof V, number][]);
    const mean = all.reduce((s, [b, c]) => s + V[b] * c, 0) / all.reduce((s, [, c]) => s + c, 0);
    const review = K.player.school!.history.find((r) => r.term === 2)!;
    expect(review.work).toBeCloseTo(mean, 12);
    // At or under -0.5 a term's work on stage falls short.
    expect(mean).toBeLessThanOrEqual(-0.5);
    expect(review.reason).toContain(` Your work in ${CARLOTTA} and Major Barbara fell short of what the program asks.`);
    expect(review.standing).toBe('concern');
    expect(K.player.school!.unreviewed).toBeUndefined();
    // Once: the spring's evaluation doesn't read it again.
    const next = reload(K);
    working(next);
    next.advanceTo(at(2028, 5, 1, 12));
    const spring = next.player.school!.history.find((r) => r.term === 3)!;
    expect(spring).toBeDefined();
    expect(spring.reason).not.toContain(CARLOTTA);
    expect(spring.reason).not.toContain('Major Barbara');
  });

  it('draws the evaluation on the Standing tab: the term, the standing, the attendance, the growths and the reason', () => {
    const plain = fallAsItComes();
    const [review] = plain.player.school!.history;
    const { text } = drawn(plain, SchoolWorkspace, 'standing');
    expect(text).toContain('Term Reviews');
    // The Evaluations table’s Coursework column, the review’s own count, from 2026-10-16 (tests/remaining-school-term.test.ts).
    expect(text).toContain(`Fall Term 2026 Academic Concern 100% ${review!.growth.toFixed(1)} ${review!.classGrowth.toFixed(1)} ${review!.coursework ? `${review!.coursework.unready} of ${review!.coursework.shown} Unready or not shown` : 'None counted'} ${review!.reason}`);
    const done = fallWorked();
    const ok = done.player.school!.history[0]!;
    // The Evaluations table’s Coursework column, the review’s own count, from 2026-10-16 (tests/remaining-school-term.test.ts).
    expect(drawn(done, SchoolWorkspace, 'standing').text).toContain(`Fall Term 2026 Good Standing 100% ${ok.growth.toFixed(1)} ${ok.classGrowth.toFixed(1)} ${ok.coursework ? `${ok.coursework.unready} of ${ok.coursework.shown} Unready or not shown` : 'None counted'} ${ok.reason}`);
  });
});

// ---------------------------------------------------------------------------
// notes and feedback
// ---------------------------------------------------------------------------

/**
 * TEST SETUP: Character Work at 5, what holds a scene back most, with the craft behind what Scene Study asks of the year
 * (Scene Study 50, Emotional Access 80: a craft score under 0.45), and the abilities kept in the craft that a scene's
 * execution reads at 90 (from 2026-10-16, `skillHeld`).
 */
function characterHolds(sim: Simulation): void {
  Object.assign(sim.player.craft!, { character: 5, scene: 50, emotion: 80, memorization: 90, voice: 90, movement: 90 });
}

describe('notes and feedback', () => {
  /** g18-probe to the evening before Acting I's fourth scene is due, Sunday 18 October. */
  const fourthEve = () => kept('g18-probe:oct18', () => { const s = probeAug28(); s.advanceTo(at(2026, 10, 18, 18)); return s; });

  it('takes a note on a skill at the showing again because the skill grew by practice, where the twin that worked on it at the desk didn’t, and each meeting grows the class by it', () => {
    const sim = fourthEve();
    const a = actingI(sim);
    expect(a).toMatchObject({ dueOn: '2026-10-19', template: 'scene-study' });
    // TEST SETUP: Character Work low, so the scene asks more of it than there is; every part prepared, Work On The Note
    // left at nothing for the desk to do. From 2026-10-16 the note names the skill the judged result's limits say cost it
    // most (`skillHeld`), where until then it named the weakest skill the work is shown for, whatever it cost; so the
    // craft's other skills this scene reads stand where Character Work is what holds it (`characterHolds`).
    characterHolds(sim);
    Object.assign(a.prep, { familiarity: 0.95, memorization: 0.95, rehearsal: 0.95, partner: 0.95, revision: 0 });
    answerAsTheTextSupports(sim, a);
    toMeeting(sim, '2026-10-19');
    const shown = work(sim, a.id);
    expect(shown.feedback).toMatchObject({ focus: { kind: 'skill', skill: 'character' }, kind: 'new', text: 'It asked for more character work than you have yet. That’s what to build in class over the next few weeks.' });
    expect(shown.status).toBe('revising');
    expect(shown.revision!.dueOn).toBe('2026-10-26');
    const given = notesOf(cwOf(sim)).find((x) => x.key === 'skill:character')!;
    expect(given).toMatchObject({ status: 'open', given: 1 });
    const level = given.level!;
    const practiced = reload(sim);
    const desk = reload(sim);
    // The desk: the note read, and Work On The Note twice, which took a note on a skill until 2026-10-12.
    go(desk, 'school.read_feedback', { assignmentId: a.id });
    for (let i = 0; i < 2; i += 1) { dials(desk); go(desk, 'school.prepare', { assignmentId: a.id, activity: 'revise' }); }
    expect(work(desk, a.id).prep.revision).toBeGreaterThanOrEqual(0.6);
    // The practice: Character Work an hour each evening of the recess, the day's first hour, which keeps its whole gain.
    for (let day = 19; day <= 25; day += 1) {
      practiced.advanceTo(at(2026, 10, day, 19));
      dials(practiced);
      go(practiced, 'practice.exercise', { exercise: 'character-work' });
    }
    for (const s of [practiced, desk]) s.advanceTo(at(2026, 10, 26, 8, 59));
    // Two points of the hundred over where it was given, in one; under two in the other, which grew only in class.
    expect(practiced.player.craft!.character / 100).toBeGreaterThanOrEqual(level + 0.02);
    expect(desk.player.craft!.character / 100).toBeLessThan(level + 0.02);
    // TEST SETUP: Scene Study alike in both, and the same dials, so the meeting's growth differs by its weight alone.
    desk.player.craft!.scene = practiced.player.craft!.scene;
    // And discipline alike (from 2026-10-16): a class's growth reads it (`grown`), and the practiced twin's seven days of
    // practice grew it; until then a class's growth didn't read it.
    attributesOf(desk, desk.player).discipline = attributesOf(practiced, practiced.player).discipline;
    for (const s of [practiced, desk]) dials(s);
    const before = practiced.player.craft!.scene;
    for (const s of [practiced, desk]) s.advanceTo(at(2026, 10, 26, 9));
    expect(work(practiced, a.id).revision).toMatchObject({ applied: true });
    expect(work(desk, a.id).revision).toMatchObject({ applied: false });
    expect(notesOf(cwOf(practiced)).find((x) => x.key === 'skill:character')).toMatchObject({ status: 'resolved', resolvedOn: '2026-10-26' });
    expect(notesOf(cwOf(desk)).find((x) => x.key === 'skill:character')).toMatchObject({ status: 'open', given: 1 });
    expect(practiced.universe.notifications.some((x) => x.title.startsWith('Note Taken: '))).toBe(true);
    expect(desk.universe.notifications.some((x) => x.title.startsWith('Note Not Taken Yet: '))).toBe(true);
    // The note taken weighs the meeting's growth 1.1; not taken, 0.95.
    const grew = (s: Simulation) => s.player.craft!.scene - before;
    expect(grew(practiced) / grew(desk)).toBeCloseTo(1.1 / 0.95, 9);
    // Taken once: a reload and the next meeting add no second taking.
    const again = reload(practiced);
    again.advanceTo(at(2026, 10, 28, 20));
    const rec = notesOf(cwOf(again)).find((x) => x.key === 'skill:character')!;
    expect(rec.history.filter((x) => x.kind === 'applied')).toHaveLength(1);
    expect(work(again, a.id).status).toBe('done');
  });

  it('sets the next scene’s objective by the note the showings keep giving, at the meeting that sets it, and that objective leans its showing, where a twin with it cleared shows the same work otherwise', () => {
    const sim = probeAug28();
    sim.advanceTo(at(2026, 9, 21, 20));
    const scenes = () => cwOf(sim).assignments.filter((a) => a.course === ACTING_I);
    // The first scene's objective by the course's turn, and the second's (the first two of the course's parts): no note
    // had been given twice when either was set.
    expect(scenes().map((a) => [a.setOn, a.objective])).toEqual([['2026-08-30', 'circumstances'], ['2026-09-09', 'lines']]);
    const time = notesOf(cwOf(sim)).find((x) => x.key === 'dim:rehearsal')!;
    expect(time.status).toBe('open');
    const others = notesOf(cwOf(sim)).filter((x) => x.key !== 'dim:rehearsal' && x.status === 'open');
    for (const x of others) expect(time.given, x.key).toBeGreaterThan(x.given);
    // The class day of Tuesday 22 September sets the third: Rehearsal, the part the open note given most names, where
    // the course's turn would have asked The Choices next. Answered that evening, after Drama 50.
    sim.advanceTo(at(2026, 9, 22, 18, 30));
    const third = actingI(sim);
    expect(third).toMatchObject({ setOn: '2026-09-22', objective: 'shape', dueOn: '2026-10-05' });
    // TEST SETUP: the third prepared but its time on its feet, which the objective puts first; the table answered.
    Object.assign(third.prep, { familiarity: 0.9, memorization: 0.9, rehearsal: 0.2, partner: 0.9 });
    answerAsTheTextSupports(sim, third);
    const cleared = reload(sim);
    delete work(cleared, third.id).objective; // TEST SETUP: the twin with no objective.
    for (const s of [sim, cleared]) toMeeting(s, '2026-10-05');
    const [put] = shownRecords(sim, work(sim, third.id));
    const [none] = shownRecords(cleared, work(cleared, third.id));
    expect(put!.inputs.prep).toEqual(none!.inputs.prep);
    // Every dimension that reads the rehearsal leans half again, the rest as they were.
    const task = TASK_PROFILES[TEMPLATE_TASK['scene-study'] ?? 'scene']!;
    let reads = 0;
    for (const [d, spec] of Object.entries(task.dims) as [Dimension, { prep?: readonly string[] }][]) {
      const want = (spec.prep ?? []).includes('rehearsal') ? 1.5 : 1;
      if (want > 1) reads += 1;
      expect((put!.inputs.lean?.[d] ?? 1) / (none!.inputs.lean?.[d] ?? 1), d).toBeCloseTo(want, 9);
    }
    expect(reads).toBeGreaterThan(0);
    // Its weakest part weighing more, the showing comes out lower.
    expect(put!.overall).toBeLessThan(none!.overall);
  });

  it('takes a note on a choice where the next scene answers it as the text supports, and gives it again where the one after answers it against the text', () => {
    const sim = probeAug28();
    const first = actingI(sim);
    // TEST SETUP: every part prepared but the table, so a choice is what holds the showing back most.
    Object.assign(first.prep, { familiarity: 0.95, memorization: 0.95, rehearsal: 0.95, partner: 0.95 });
    const odd = questionsFor(first).find(({ options }) => options.some((o) => !o.supported))!;
    expect(odd).toBeDefined();
    for (const { q, options } of questionsFor(first)) go(sim, 'school.choose', { assignmentId: first.id, question: q.id, option: options.find((o) => o.supported === (q.id !== odd.q.id))!.id });
    const key = `choice:${odd.q.id}`;
    toMeeting(sim, first.dueOn);
    expect(work(sim, first.id).feedback).toMatchObject({ focus: { kind: 'choice', question: odd.q.id }, kind: 'new' });
    expect(notesOf(cwOf(sim)).find((x) => x.key === key)).toMatchObject({ status: 'open', given: 1 });
    // The second scene, set the next day: the same question answered as the text supports, that evening.
    sim.advanceTo(at(2026, 9, 9, 18, 30));
    const second = actingI(sim);
    expect(second.id).not.toBe(first.id);
    Object.assign(second.prep, { familiarity: 0.95, memorization: 0.95, rehearsal: 0.95, partner: 0.95 }); // TEST SETUP, as before
    answerAsTheTextSupports(sim, second);
    toMeeting(sim, second.dueOn);
    expect(work(sim, second.id).taken).toContain(key);
    expect(work(sim, second.id).shown!.strengths).toContain(`You took the earlier note on ${odd.q.label.toLowerCase()}`);
    expect(notesOf(cwOf(sim)).find((x) => x.key === key)).toMatchObject({ status: 'resolved', resolvedOn: second.dueOn });
    // The third: answered against the text again, and the note is given again, recurring.
    sim.advanceTo(onDay(second.dueOn, 18, 30) + 24 * MS_HOUR);
    const third = actingI(sim);
    expect([first.id, second.id]).not.toContain(third.id);
    const again = questionsFor(third).find(({ q }) => q.id === odd.q.id)!;
    const against = again.options.find((o) => !o.supported)!;
    expect(against).toBeDefined();
    Object.assign(third.prep, { familiarity: 0.95, memorization: 0.95, rehearsal: 0.95, partner: 0.95 }); // TEST SETUP, as before
    for (const { q, options } of questionsFor(third)) go(sim, 'school.choose', { assignmentId: third.id, question: q.id, option: (q.id === odd.q.id ? against : options.find((o) => o.supported)!).id });
    toMeeting(sim, third.dueOn);
    expect(work(sim, third.id).feedback).toMatchObject({ focus: { kind: 'choice', question: odd.q.id }, kind: 'recurring' });
    expect(work(sim, third.id).feedback!.text).toContain(`${odd.q.label}: ${against.why}`);
    expect(notesOf(cwOf(sim)).find((x) => x.key === key)).toMatchObject({ status: 'open', given: 2 });
  });

  it('words a note through the clock by where it stands against the last on the same part: new at the first showing, then better but not there yet, with both figures', () => {
    const sim = probeAug28();
    // The first scene left unprepared: the lines are what held it back, a note new to the ledger.
    toMeeting(sim, '2026-09-08');
    const first = cwOf(sim).assignments.find((a) => a.course === ACTING_I)!;
    const body = 'The lines weren’t secure, so the attention went to remembering, not to the other person.';
    expect(first.feedback).toMatchObject({ focus: { kind: 'dim', dim: 'memorization' }, kind: 'new', text: `${body} (Lines: 0% prepared.) You played Varya in The Cherry Orchard.` });
    expect(notesOf(cwOf(sim)).find((x) => x.key === 'dim:memorization')).toMatchObject({ status: 'open', given: 1, level: 0 });
    // The second, set the next day: everything but the lines prepared (TEST SETUP, the table answered through the
    // command), and Learn Lines once, after the partner's ask is answered no.
    sim.advanceTo(at(2026, 9, 9, 18, 30));
    const second = actingI(sim);
    expect(second.sceneId).toBe('rising-moon');
    Object.assign(second.prep, { familiarity: 0.95, rehearsal: 0.95, partner: 0.95 });
    answerAsTheTextSupports(sim, second);
    for (const k of (second.asks ?? []).filter((x) => x.status === 'open')) go(sim, 'school.answer_partner', { assignmentId: second.id, askId: k.id, yes: false });
    dials(sim);
    go(sim, 'school.prepare', { assignmentId: second.id, activity: 'learn' });
    const lines = work(sim, second.id).prep.memorization;
    // Better by a tenth or more, and short of three quarters: better, not yet.
    expect(lines).toBeGreaterThanOrEqual(0.1);
    expect(lines).toBeLessThan(0.75);
    toMeeting(sim, second.dueOn);
    const pct = Math.round(lines * 100);
    expect(work(sim, second.id).feedback).toMatchObject({ focus: { kind: 'dim', dim: 'memorization' }, kind: 'partial', text: `This has improved since September 8, 2026 (0% then, ${pct}% now), but it isn’t there yet. ${body} (Lines: ${pct}% prepared.) You played The Sergeant in The Rising of the Moon.` });
    expect(notesOf(cwOf(sim)).find((x) => x.key === 'dim:memorization')).toMatchObject({ status: 'open', given: 2, level: lines });
  });

  it('draws the note on the Coursework tab: the skill note new, then taken, shown again and marked taken in the ledger; and the objective a note put first, with why', () => {
    const sim = fourthEve();
    const a = actingI(sim);
    characterHolds(sim); // TEST SETUP, as above
    Object.assign(a.prep, { familiarity: 0.95, memorization: 0.95, rehearsal: 0.95, partner: 0.95, revision: 0 });
    answerAsTheTextSupports(sim, a);
    toMeeting(sim, '2026-10-19');
    const shown = work(sim, a.id).shown!;
    let { text } = drawn(sim, CourseworkPane);
    // Working until 2026-10-16; the craft set so Character Work holds it (`characterHolds`) shows it Strong.
    expect(text).toContain(`Feedback: ${BAND_LABEL[shown.band]}, ${Math.round(shown.score * 100)} Of 100 · A New Note`);
    expect(text).toContain('It asked for more character work than you have yet. That’s what to build in class over the next few weeks.');
    expect(text).toContain('Character Work · Given once, on ');
    for (let day = 19; day <= 25; day += 1) { sim.advanceTo(at(2026, 10, day, 19)); dials(sim); go(sim, 'practice.exercise', { exercise: 'character-work' }); }
    sim.advanceTo(at(2026, 10, 26, 15, 30));
    ({ text } = drawn(sim, CourseworkPane));
    expect(text).toContain(`Note Taken, Shown Again ${{ unready: 'Unready', working: 'Working', strong: 'Strong', exceptional: 'Exceptional' }[work(sim, a.id).revision!.band!]}`);
    expect(text).toMatch(/Character Work · Given once, on [^·]+ Taken /);
    // The objective a note put first, on the third scene's card.
    const third = probeAug28();
    third.advanceTo(at(2026, 9, 22, 15, 30));
    const rec = notesOf(cwOf(third)).find((x) => x.key === 'dim:rehearsal')!;
    ({ text } = drawn(third, CourseworkPane));
    expect(text).toContain(`Put First: Rehearsal. Your notes have named it ${rec.given} times since`);
    expect(text).toContain('so it counts for more when this piece is shown.');
  });
});

// ---------------------------------------------------------------------------
// preparation dims
// ---------------------------------------------------------------------------

describe('preparation dims', () => {
  it('reads Learn Lines three days running into the showing the clock gives at the meeting: the lines the commands left on the record, every dimension they hold back higher, and the whole', () => {
    const lines = probeAug28();
    const none = probeAug28();
    const id = actingI(lines).id;
    for (const s of [lines, none]) {
      for (let i = 0; i < 2; i += 1) { dials(s); go(s, 'school.prepare', { assignmentId: id, activity: 'read' }); }
      answerAsTheTextSupports(s, work(s, id));
      // TEST SETUP: its time on its feet and with the partner at 0.95, so the lines are what holds a dimension back.
      Object.assign(work(s, id).prep, { rehearsal: 0.95, partner: 0.95 });
    }
    // Learn Lines on Friday, Saturday and Sunday, from five, in one.
    for (const day of [28, 29, 30]) { lines.advanceTo(at(2026, 8, day, 17)); dials(lines); go(lines, 'school.prepare', { assignmentId: id, activity: 'learn' }); }
    expect(work(lines, id).prep.memorization).toBeGreaterThan(0.5);
    expect(work(none, id).prep.memorization).toBe(0);
    expect(work(lines, id).prep.familiarity).toBe(work(none, id).prep.familiarity);
    for (const s of [lines, none]) toMeeting(s, '2026-09-08');
    const [l] = shownRecords(lines, work(lines, id));
    const [n] = shownRecords(none, work(none, id));
    // What the record was judged from is what the commands left.
    for (const [s, rec] of [[lines, l], [none, n]] as const) expect(rec!.inputs.prep.memorization).toBe(work(s, id).prep.memorization);
    const task = TASK_PROFILES[TEMPLATE_TASK['scene-study'] ?? 'scene']!;
    const reads = (Object.entries(task.dims) as [Dimension, { prep?: readonly string[] }][]).filter(([, spec]) => (spec.prep ?? []).includes('memorization')).map(([d]) => d);
    expect(reads.length).toBeGreaterThan(0);
    for (const d of reads) expect(l!.dims[d]!, d).toBeGreaterThan(n!.dims[d]!);
    expect(l!.overall).toBeGreaterThan(n!.overall);
    expect(work(lines, id).shown!.score).toBeGreaterThan(work(none, id).shown!.score);
    // Shown once: a reload and the next days add no second showing.
    const again = reload(lines);
    again.advanceTo(at(2026, 9, 10, 20));
    expect(shownRecords(again, work(again, id))).toHaveLength(1);
  });

  it('has the partner say after a rehearsal kept what the answers at the table and the lines leave weakest, never the interpretation set by hand, through a reload', () => {
    const [against, supported, offBook] = [probeAug28(), probeAug28(), probeAug28()];
    const a = actingI(against);
    for (const s of [against, supported, offBook]) {
      mateRecord(mateOf(s, a)).reliability = 1; // TEST SETUP: Theo comes when he says he will.
      // TEST SETUP: the scene known, the lines and its time on its feet at nine tenths, and the interpretation figure full.
      Object.assign(work(s, a.id).prep, { familiarity: 0.9, memorization: 0.9, rehearsal: 0.9, interpretation: 1 });
    }
    work(offBook, a.id).prep.memorization = 0.3; // TEST SETUP: the lines short in this one.
    for (const { q, options } of questionsFor(a)) go(against, 'school.choose', { assignmentId: a.id, question: q.id, option: options.find((o) => !o.supported)!.id });
    for (const s of [supported, offBook]) answerAsTheTextSupports(s, work(s, a.id));
    for (const s of [against, supported, offBook]) expect(ask(s, a.id, at(2026, 8, 29, 19)).accepted).toBe(true);
    for (const s of [against, supported, offBook]) s.advanceTo(at(2026, 8, 29, 21));
    const said = (s: Simulation) => { const r = work(s, a.id).rehearsals[0]!; expect(r.status).toBe('kept'); return r.said; };
    expect(said(against)).toBe('Theo isn’t sure what you’re playing for: your choices weren’t clear to them.');
    expect(said(supported)).toBe('Theo says it’s coming together.');
    expect(said(offBook)).toBe('Theo says you were on book most of the time, and they couldn’t catch your eye.');
    expect(said(reload(against))).toBe('Theo isn’t sure what you’re playing for: your choices weren’t clear to them.');
    // Drawn under the evening on the Coursework tab, marked the game's words.
    expect(drawn(against, CourseworkPane).text).toContain('Theo isn’t sure what you’re playing for: your choices weren’t clear to them. (Simulated: the game’s words.)');
  });

  it('draws the part’s figure on the Coursework tab and raises it by what Learn Lines, pressed, says it moved', () => {
    const sim = probeAug28();
    const a = actingI(sim);
    for (let i = 0; i < 2; i += 1) { dials(sim); go(sim, 'school.prepare', { assignmentId: a.id, activity: 'read' }); }
    dials(sim);
    let { text } = drawn(sim, CourseworkPane);
    expect(text).toContain('Lines 0% Note priority');
    const learn = buttons('school.prepare', 'Learn Lines');
    expect(learn.length).toBeGreaterThan(0);
    expect(learn[0]!.disabled).toBe(false);
    const toasts = press(learn[0]!);
    const pct = Math.round(work(sim, a.id).prep.memorization * 100);
    expect(pct).toBeGreaterThan(0);
    // The Cherry Orchard's fourth act is a short scene: its lines take 45 minutes.
    expect(toasts).toEqual([`Learn Lines: 45 minutes, Lines up ${pct}%.`]);
    ({ text } = drawn(sim, CourseworkPane));
    expect(text).toContain(`Lines ${pct}% Note priority`);
  });
});

// ---------------------------------------------------------------------------
// showing/night bands
// ---------------------------------------------------------------------------

describe('showing/night bands', () => {
  /**
   * g18-probe at the first meeting's door, Tuesday 8 September, twice: prepared (TEST SETUP: every piece's parts at 0.95,
   * Acting I's table answered through the command) and not, with the first classmate's bond at `bond` (TEST SETUP).
   */
  function twins(bond: number, prepared: boolean): Simulation {
    const sim = probeAug28();
    if (prepared) {
      for (const a of cwOf(sim).assignments) for (const d of PREP_DIMS) a.prep[d] = 0.95;
      answerAsTheTextSupports(sim, actingI(sim));
    }
    sim.player.school!.classmates[0]!.bond = bond;
    sim.advanceTo(at(2026, 9, 8, 8, 59));
    dials(sim);
    return sim;
  }

  it('weighs the class day’s growth by the band each piece is shown at: unready 0.85, working 1, strong 1.1; and the meeting again by the note taken, 1.1, or not, 0.95', () => {
    const done = twins(0, true);
    const not = twins(0, false);
    const before = (s: Simulation) => ({ scene: s.player.craft!.scene, script: s.player.craft!.script });
    const [d0, n0] = [before(done), before(not)];
    expect(d0).toEqual(n0);
    for (const s of [done, not]) s.advanceTo(at(2026, 9, 8, 9));
    const band = (s: Simulation, course: string) => cwOf(s).assignments.find((a) => a.course === course && a.shown)!.shown!.band;
    expect([band(done, ACTING_I), band(done, 'DRAM 873a/b')]).toEqual(['working', 'strong']);
    expect([band(not, ACTING_I), band(not, 'DRAM 873a/b')]).toEqual(['unready', 'unready']);
    // Scene Study grows in Acting I alone, Script Analysis in Text And Context alone: each by its course's band.
    expect((done.player.craft!.scene - d0.scene) / (not.player.craft!.scene - n0.scene)).toBeCloseTo(1 / 0.85, 9);
    expect((done.player.craft!.script - d0.script) / (not.player.craft!.script - n0.script)).toBeCloseTo(1.1 / 0.85, 9);
    // Shown again on the 9th: the step beyond worked on and taken in one, the lines' note not in the other.
    for (const s of [done, not]) { s.advanceTo(at(2026, 9, 9, 8, 59)); dials(s); }
    not.player.craft!.scene = done.player.craft!.scene; // TEST SETUP: Scene Study alike, so the weight alone differs.
    const scene = done.player.craft!.scene;
    for (const s of [done, not]) s.advanceTo(at(2026, 9, 9, 9));
    const first = (s: Simulation) => cwOf(s).assignments.find((a) => a.course === ACTING_I)!;
    expect(first(done).revision).toMatchObject({ applied: true });
    expect(first(not).revision).toMatchObject({ applied: false });
    expect((done.player.craft!.scene - scene) / (not.player.craft!.scene - scene)).toBeCloseTo(1.1 / 0.95, 9);
  });

  it('brings encouragement after an unready showing from a classmate at a bond of 10, three points of mood, once; not at 9, and not after a working showing', () => {
    const ten = twins(10, false);
    const nine = twins(9, false);
    const working1 = twins(10, true);
    for (const s of [ten, nine, working1]) s.advanceTo(at(2026, 9, 8, 9));
    const mate = ten.player.school!.classmates[0]!;
    const first = mate.name.split(' ')[0];
    const encouraged = (s: Simulation) => momentsOf(cwOf(s)).filter((m) => m.kind === 'encouragement');
    expect(encouraged(ten)).toHaveLength(1);
    expect(encouraged(ten)[0]).toMatchObject({ mate: 0, status: 'said', assignmentId: cwOf(ten).assignments.find((a) => a.course === ACTING_I)!.id, text: `${first} caught you after class: everyone has a showing like that, and yours will come back.` });
    expect(mateRecord(mate).log![0]!.what).toBe('Encouraged you after a hard showing');
    expect(encouraged(nine)).toEqual([]);
    expect(encouraged(working1)).toEqual([]);
    expect(ten.player.wellbeing.morale - nine.player.wellbeing.morale).toBeCloseTo(3, 9);
    // Once: a reload and the unready showings of the rest of the week bring no second word from them.
    const again = reload(ten);
    again.advanceTo(at(2026, 9, 12, 12));
    expect(encouraged(again)).toHaveLength(1);
  });

  it('draws the band on the Coursework tab, the showing’s and the work shown’s, and the word after class in Your Class', () => {
    const sim = twins(10, false);
    sim.advanceTo(at(2026, 9, 8, 15, 30));
    const a = cwOf(sim).assignments.find((x) => x.course === ACTING_I)!;
    const { text } = drawn(sim, CourseworkPane);
    expect(text).toContain(`Feedback: Unready, ${Math.round(a.shown!.score * 100)} Of 100 · A New Note`);
    const first = sim.player.school!.classmates[0]!.name;
    const moments = drawn(sim, ClassMoments).text;
    expect(moments).toContain('Your Class');
    expect(moments).toContain(`${first}: A Word After Class`);
    sim.advanceTo(at(2026, 9, 9, 15, 30));
    expect(drawn(sim, CourseworkPane).text).toContain('Acting I : Scene Study, The Cherry Orchard, with Theo Patel · Unready · Note Not Taken, Shown Again Unready');
  });
});

// ---------------------------------------------------------------------------
// credits
// ---------------------------------------------------------------------------

describe('credits', () => {
  const carlottaCredit = { production: CARLOTTA, role: 'A Leading Part In A New Play', kind: 'carlotta', year: 2027, size: 'lead' };

  it('puts Carlotta on the résumé at the next casting with every night played, once, and the twin that slept through the closing with three', () => {
    const played = closingEve();
    const slept = closingEve();
    go(slept, 'life.sleep', { hours: 5 });
    for (const s of [played, slept]) s.advanceTo(at(2027, 8, 23, 8, 59));
    // Played and closed, and not yet on the résumé: it goes there at the next casting.
    for (const s of [played, slept]) expect(s.player.school!.credits ?? []).toEqual([]);
    for (const s of [played, slept]) s.advanceTo(at(2027, 8, 23, 9, 1));
    expect(played.player.school!.credits).toEqual([{ ...carlottaCredit, wentOn: 4 }]);
    expect(slept.player.school!.credits).toEqual([{ ...carlottaCredit, wentOn: 3 }]);
    // Once: through a reload and the next casting, which credits the fall's run beside it.
    const next = working(reload(played));
    next.advanceTo(at(2028, 1, 3, 9, 1));
    const credits = next.player.school!.credits!;
    expect(credits.filter((c) => c.production === CARLOTTA)).toEqual([{ ...carlottaCredit, wentOn: 4 }]);
    expect(credits.find((c) => c.kind === 'thesis')).toMatchObject({ production: 'Directors’ Thesis Production I', role: 'Barbara Undershaft', year: 2027, wentOn: 8, size: 'lead' });
  });

  it('puts the Summer Cabaret’s first show on the résumé at its last night with the nights played, once', () => {
    const sim = castDoor();
    sim.advanceTo(at(2027, 2, 1, 12));
    go(sim, 'school.summer_cabaret');
    const show = sim.player.school!.summer!.shows![0]!;
    expect(show).toMatchObject({ play: 'The Bear', role: 'Yelena Popova' });
    const nights = sim.universe.scheduled.filter((i) => i.kind === SUMMER_KIND && i.payload.call === 'performance' && i.payload.run === 0).sort((x, y) => x.at - y.at);
    // Friday at eight, Saturday's matinee and night, and the closing on Sunday.
    expect(nights.map((i) => i.at)).toEqual([at(2027, 6, 25, 20), at(2027, 6, 26, 14), at(2027, 6, 26, 20), at(2027, 6, 27, 20)]);
    sim.advanceTo(at(2027, 6, 27, 19));
    expect(sim.player.school!.credits ?? []).toEqual([]);
    sim.advanceTo(at(2027, 6, 27, 23));
    expect(sim.player.school!.summer!.played[0]).toBe(4);
    expect(sim.player.school!.credits).toEqual([{ production: 'The Bear, Yale Summer Cabaret 2027', role: 'Yelena Popova', kind: 'summer', year: 2027, wentOn: 4 }]);
    const again = reload(sim);
    again.advanceTo(at(2027, 7, 2, 12));
    expect(again.player.school!.credits!.filter((c) => c.kind === 'summer')).toHaveLength(1);
  });

  it('keeps Carlotta on the résumé as a leave asked for after it begins, with no casting to write it', () => {
    const sim = closingEve();
    sim.advanceTo(at(2027, 5, 13, 12));
    const asked = go<{ firstTerm: number; startsNow: boolean; decideAt: number }>(sim, 'school.request_leave', { kind: 'personal', reason: 'personal' });
    expect(asked).toMatchObject({ firstTerm: 2, startsNow: false });
    sim.advanceTo(asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave).toMatchObject({ status: 'granted', firstTerm: 2 });
    sim.advanceTo(at(2027, 8, 23, 8, 59));
    expect(sim.player.school!.credits ?? []).toEqual([]);
    sim.advanceTo(at(2027, 8, 23, 9, 1));
    expect(sim.player.school!.leave).toMatchObject({ status: 'on' });
    expect(sim.player.school!.casting).toBeUndefined();
    expect(sim.player.school!.castRead?.term).toBe(1);
    expect(sim.player.school!.credits).toEqual([{ ...carlottaCredit, wentOn: 4 }]);
    const again = reload(sim);
    again.advanceTo(at(2027, 9, 15, 12));
    expect(again.player.school!.credits).toEqual([{ ...carlottaCredit, wentOn: 4 }]);
  });

  it('draws the Profile’s School Journey line: nothing yet, the run going on, then on stage with its year, and the summer’s show beside it', () => {
    const sim = castDoor();
    sim.advanceTo(at(2027, 1, 4, 9, 1));
    expect(drawn(sim, ProfileWorkspace).text).toContain('No production yet.');
    sim.advanceTo(at(2027, 5, 7, 12));
    expect(drawn(sim, ProfileWorkspace).text).toContain(`No production finished yet; A Leading Part In A New Play in ${CARLOTTA} is running.`);
    // Closed with its last night on 12 May, it's on stage before the fall's casting files its credit (from 2026-10-13:
    // until then it read as running into September).
    sim.advanceTo(at(2027, 5, 20, 12));
    expect(sim.player.school!.credits ?? []).toEqual([]);
    expect(drawn(sim, ProfileWorkspace).text).toContain(`On stage: A Leading Part In A New Play in ${CARLOTTA}, 2027.`);
    expect(drawn(sim, ProfileWorkspace).text).not.toContain('is running.');
    const fall = fallCast();
    expect(drawn(fall, ProfileWorkspace).text).toContain(`On stage: A Leading Part In A New Play in ${CARLOTTA}, 2027.`);
    const summer = castDoor();
    summer.advanceTo(at(2027, 2, 1, 12));
    go(summer, 'school.summer_cabaret');
    summer.advanceTo(at(2027, 6, 27, 23));
    expect(drawn(summer, ProfileWorkspace).text).toContain(`On stage: Yelena Popova in The Bear, Yale Summer Cabaret 2027, 2027; A Leading Part In A New Play in ${CARLOTTA}, 2027.`);
  });
});
