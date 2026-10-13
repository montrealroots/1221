/**
 * Evidence for seven school rows the review of 2026-10-13 left partial (verification group g19-school): catching up a
 * missed orientation session (`school.orientation`), Learn The Part (`school.learn_part`), Catch Up The Blocking
 * (`school.review_blocking`), Work On The Note (`school.work_note`), Call In Sick (`school.call_in_sick`), Take An
 * Elective Shift (`school.take_shift`) and Join A Cabaret Show (`school.cabaret`). Each row's gaps are closed here
 * through the command its screen sends and the clock, and each consequence is read where the row says it's read,
 * against figures worked out from the rule's own numbers (a call's 0.12 of the lines and 0.25 of the blocking left, the
 * book's half, the sessions' minutes, $23.00 an hour, a night's value of −1 to 2, a Cabaret run at half weight up to
 * eight nights), never from the helper the engine computes them with.
 *
 * - `school.orientation`: the week missed in New York, then each session caught up in New Haven through the command:
 *   each takes its own minutes (120, 180, 120, 120, 150); the courses' session sets the first work of every first-year
 *   fall course, as the clock's session does for a twin who was there; the class met, a partner can be asked where
 *   until then "You haven’t met …" refused it; the tour opens the studios to a step on its feet and the library to Read
 *   It. Refused away from New Haven, with no time free before a class, once orientation is behind a life begun after it,
 *   and done already after a reload, each in its words with no time spent. Catch Up pressed on the Coursework tab.
 * - `school.learn_part`: four hours on the part after the read-through, memory grown and recorded on the first three only
 *   (`PROCESS.own.trainsAtMost`), the cap kept across a reload; the first night's preparation reads the lines learned,
 *   above a twin who only came to the calls and holds what twelve calls make (1 − 0.88¹²), and the twin's night factor
 *   is the par's 1; the second fall's casting reads each run's own delivery, and the hours on the part change it.
 *   Measured on 2026-10-13, they changed it downward: off book from the first work-through, the learner was given the
 *   blocking notes in place of the lines notes, which no work-through answers, left them untaken, and delivered 0.837
 *   to the twin's 1, the nights 41 to 51 on average. Refused not cast there, in class, once the lines are known, and
 *   once the run is over. Learn The Part pressed on the Casting tab.
 * - `school.review_blocking`: the fourth call, a blocking rehearsal, missed in New York; caught up after a reload, the
 *   gap closed and the blocking up by the book's half of what was left; the next work-through's note is on the lines,
 *   where a twin who left the gap is given the blocking; the first night reads 0.841796875 of blocking against the
 *   twin's 0.68359375. Memory from the book isn't held to Learn The Part's three. Refused with nothing missed, not cast,
 *   and once the run is over. Catch Up The Blocking pressed on the Casting tab.
 * - `school.work_note`: every note worked through the festival: the journey's direction tally counts the craft notes
 *   given, the ways tried and those answered, as the notes themselves have them; a note given again says what was
 *   tried, before and after; the closing's Looking Back states the calls and notes as the calendar and the notes have
 *   them, once across a reload, and carries the craft note not taken into the class's ledger. A lines note worked moves
 *   the lines as an hour on the part does on a twin at the same moment, and the next call, which takes it, grows the
 *   scene by `PROCESS.noteTaken`'s 1.1 of what it grows for a twin who left the note, with no note marked by hand.
 * - `school.call_in_sick`: called in the morning of a Carlotta work-through: the call excused, not counted, no gap in
 *   the blocking, no breach, still in the pool, across a reload; a twin who stays away without calling is counted. A
 *   partner rehearsal booked through `school.ask_partner` on a day called in sick is excused with trust unchanged, where
 *   the twin who just doesn't come is waited for.
 * - `school.take_shift`: pressed on the Work-Study tab, the evening it books in the toast and Elective Hours 4; worked
 *   through the clock, Friday pays 4 hours at $23.00 into the bank and onto the year's return, and the next payday adds
 *   only the Saturday's six, across a reload. A Seagull night on call is skipped. One test here failed when written, on
 *   a defect: until 2026-10-13 an evening booked and then called off by a leave kept its four hours asked for, where an
 *   evening not worked gives them back (`SHIFT_KIND`); fixed that day (`callOff`), it gives them back too.
 * - `school.cabaret`: Join A Cabaret Show pressed on the Casting tab; the show played through the clock; the fall's
 *   evaluation reads its nights (measured on 2026-10-13, all five off: work −1, the reason naming Yale Cabaret, Season
 *   59, which the Standing tab shows); the spring's casting reads the run once, at half weight (5 nights, weighted
 *   2.5), and Why This Cast says so; a twin who never joined has none of it. Beside a class whose every craft is 95 the
 *   same student is cast in a supporting part where among her own class she leads.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York, an actor at Yale in New
 * Haven from Monday 24 August 2026 (or, once, from 7 September, after orientation), played on the clock (`advanceTo`),
 * never by calling a handler. The screens are rendered as the player has them (react-dom/server) with `useGame`'s `run`
 * as the save's own `execute`; a pressed button is the component's own onClick. A save is reloaded through the
 * persistence adapter (`serialise`, `deserialise`); a twin, the road not taken, is the engine's own load of a copy,
 * never written anywhere.
 *
 * TEST SETUP, said again where it's done: rested, fed, steady and awake each time the clock moves (`tended`), as the
 * production journeys play one; a day in New York over a session or a call (`currentLocationId`), as
 * tests/papers-complete.test.ts and tests/guide-examples-productions.test.ts play one; a condition under
 * `ESTIMATE.sickBelow` where a day is called in sick, and the flu for a medical leave; the coursework prepared each
 * midnight for the Seagull understudy, as tests/school.test.ts plays one; every classmate's craft at 95 for the twin cast
 * beside them.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, MS_MINUTE, formatDate, formatDateTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { COURSES } from '@/engine/content/school';
import { PREP_DIMS } from '@/engine/content/coursework';
import { CABARET_KIND, CALL_KIND, ESTIMATE, SHIFT_KIND, registered } from '@/engine/systems/school';
import { ORIENTATION_KIND, courseworkOf, mateRecord, notesOf, trustOf } from '@/engine/systems/coursework';
import { nightFactor, processOf, type Process } from '@/engine/systems/production';
import { developmentOf } from '@/engine/systems/attributes';
import { journeyOf } from '@/engine/systems/evaluation';
import { healthOf } from '@/engine/systems/health';
import { yearOf } from '@/engine/systems/earnings';
import { figuresFor } from '@/engine/systems/taxreturn';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  buttons: [] as { text: string; disabled?: boolean; title?: string; onClick?: () => void }[],
  toasts: [] as string[],
  tabs: {} as Record<string, string>,
}));

/** Every button the screens draw, with its words, whether it's grayed out, its tooltip, and its own onClick. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepButtons = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, title: props.title as string | undefined, onClick: props.onClick as (() => void) | undefined });
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepButtons(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepButtons(await orig<Record<string, unknown>>()));

// The School screen's kept tab, at the one the test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back. Nothing is standing at a stop.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

// ---------------------------------------------------------------------------
// Lives, the clock, and the screen over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
/** Noon, or the hour given, of a day on New Haven's clock. */
const on = (year: number, month: number, day: number, hour = 12, minute = 0): number => instantFromZoned({ year, month, day, hour, minute }, NY);
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** A save written and read back as the adapter does it. */
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** The road not taken: the engine's own load of a copy, never written anywhere. */
const twinOf = (sim: Simulation): Simulation => loadSave(structuredClone(sim.universe) as never);
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time, as the production journeys play one. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** TEST SETUP: a day in New York (away from New Haven), or back. */
const awayIn = (sim: Simulation, city: 'us-ny-newyork' | 'us-ct-newhaven') => { sim.player.currentLocationId = city; };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const dayKeyOf = (t: number) => { const p = zonedParts(t, NY); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

/** The School screen at a tab: its markup, the words a player sees with every tooltip taken out first, and its buttons. */
function drawn(sim: Simulation, tab: string) {
  h.sim = sim;
  h.tabs['tab:/workspace/school'] = tab;
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(SchoolWorkspace)).replace(/<!-- -->/g, '');
  return { html, shown: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), buttons: [...h.buttons] };
}
const pressed = (b: { onClick?: () => void } | undefined) => { expect(b?.onClick, 'a button to press').toBeDefined(); h.toasts = []; b!.onClick!(); return h.toasts; };

// The first spring's Carlotta, as the calendar books it: a first-year's save on the day the cast list goes up.
const carlotta = (seed: string) => { const sim = student(seed); sim.advanceTo(on(2027, 1, 4, 9) + MS_MINUTE); return sim; };
const callsOf = (sim: Simulation) => {
  const ours = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.personId === sim.player.id && i.payload.which !== 'rep').sort((a, b) => a.at - b.at);
  return { calls: ours.filter((c) => c.payload.call === 'rehearsal'), nights: ours.filter((c) => c.payload.call === 'performance') };
};
const proc = (sim: Simulation): Process => processOf(sim.player.school!.casting!);
const memoryFrom = (sim: Simulation, source: string) => developmentOf(sim.player).history.filter((x) => x.id === 'memory' && x.source === source);
/** A night's record of work, played at a call's moment. */
const nightAt = (sim: Simulation, at: number) => (sim.player.work ?? []).filter((w) => w.at === at);
const TITLE = 'Carlotta Festival Of New Plays';

// ---------------------------------------------------------------------------
// school.orientation
// ---------------------------------------------------------------------------

describe('school.orientation', () => {
  const cw = (sim: Simulation) => courseworkOf(sim, sim.player)!;
  const sessions = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === ORIENTATION_KIND).sort((a, b) => a.at - b.at);
  /** A session caught up through the command: the clock moved its own minutes, and it's done at the moment it ended. */
  const caughtUp = (sim: Simulation, task: string, minutes: number): string => {
    const before = sim.now;
    const r = sim.must<{ told: string }>({ kind: 'school.orientation', payload: { task } });
    expect(sim.now - before, `${task}'s minutes`).toBe(minutes * MS_MINUTE);
    expect(cw(sim).orientation.done[task as 'tour']).toBe(sim.now);
    return r.told;
  };
  const LIBRARY = 'The library isn’t known to you yet: the tour shows you it.';

  it('PLAYER JOURNEY: the week missed in New York, caught up in New Haven: each session takes its own minutes and opens what it arranges, once, across a reload', () => {
    const sim = student('g19-orientation');
    // The road not taken: a twin in New Haven for the week, its sessions attended through the clock.
    const there = twinOf(sim);
    // TEST SETUP: in New York over orientation's week, so its five sessions are missed.
    awayIn(sim, 'us-ny-newyork');
    tended(sim, on(2026, 8, 29, 9));
    expect(sessions(sim).map((i) => i.status)).toEqual(['missed', 'missed', 'missed', 'missed', 'missed']);
    // Away, refused in its words, with no time spent and nothing done.
    const t0 = sim.now;
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'tour' } }).error).toBe('Orientation is in New Haven.');
    expect(sim.now).toBe(t0);
    expect(cw(sim).orientation.done).toEqual({});
    // TEST SETUP: back in New Haven on the Saturday before classes.
    awayIn(sim, 'us-ct-newhaven');
    expect(cw(sim).assignments).toEqual([]);
    expect(sim.execute({ kind: 'plays.read', payload: { playId: 'fleabag' } }).error).toBe(LIBRARY);

    // The courses and what they ask: two and a half hours, and every first-year fall course sets its first work, the
    // same work the session sets for the twin who was there.
    const told = caughtUp(sim, 'expectations', 150);
    const firstYearFall = COURSES.filter((c) => c.year === 1 && c.terms.includes('fall')).map((c) => c.code).sort();
    expect(firstYearFall).toHaveLength(8);
    const open = cw(sim).assignments.filter((a) => a.status === 'open');
    expect(open.map((a) => a.course).sort()).toEqual(firstYearFall);
    expect(told).toContain(`${open.length} courses gave you their first work now`);
    tended(there, on(2026, 8, 29, 9));
    const shape = (s: Simulation) => cw(s).assignments.map((a) => [a.course, a.template, a.dueOn, a.sceneId ?? '']).sort();
    expect(shape(sim)).toEqual(shape(there));

    // Meeting the class: three hours; a partner can be asked where until then they were a stranger.
    const scene = open.find((a) => a.template === 'scene-study' && a.partner !== undefined)!;
    expect(scene).toBeDefined();
    const mate = sim.player.school!.classmates[scene.partner!]!;
    const first = mate.name.split(' ')[0];
    const ask = { kind: 'school.ask_partner', payload: { assignmentId: scene.id, at: on(2026, 8, 30, 14) } };
    expect(sim.execute(ask).error).toBe(`You haven’t met ${first} yet: you’ll meet the class at orientation, or at the first class.`);
    expect(sim.player.school!.classmates.every((m) => mateRecord(m).met === undefined)).toBe(true);
    caughtUp(sim, 'classmates', 180);
    expect(sim.player.school!.classmates.every((m) => mateRecord(m).met === sim.now)).toBe(true);
    const asked = sim.execute<{ accepted: boolean }>(ask);
    expect(asked.ok, asked.error).toBe(true);
    expect(asked.value!.accepted).toBe(true);

    // The building, the studios and the library: two hours; a step on its feet in a studio, and a read from the library.
    const score = open.find((a) => a.template === 'movement-score')!;
    const talk = open.find((a) => a.template === 'context-presentation')!;
    const studioStep = { kind: 'school.prepare', payload: { assignmentId: score.id, activity: 'devise' } };
    const libraryStep = { kind: 'school.prepare', payload: { assignmentId: talk.id, activity: 'research' } };
    expect(sim.execute(studioStep).error).toBe('You don’t know the building yet: the tour shows you the studios.');
    expect(sim.execute(libraryStep).error).toBe('You don’t know the library yet: the tour shows you it.');
    caughtUp(sim, 'tour', 120);
    const devised = sim.execute<{ moved: number }>(studioStep);
    expect(devised.ok, devised.error).toBe(true);
    expect(devised.value!.moved).toBeGreaterThan(0);
    expect(sim.execute(libraryStep).error).not.toBe('You don’t know the library yet: the tour shows you it.');
    const read = sim.execute({ kind: 'plays.read', payload: { playId: 'fleabag' } });
    expect(read.ok, read.error).toBe(true);

    // The faculty, two hours, who set out what the School asks; registration, two hours more.
    expect(caughtUp(sim, 'faculty', 120)).toContain('They set out what the School asks');
    expect(registered(sim.player.school, cw(sim))).toBe(false);
    caughtUp(sim, 'register', 120);
    expect(registered(sim.player.school, cw(sim))).toBe(true);

    // Saved and read back: each session done, refused with the day it was done, no time spent, nothing set twice.
    const back = reload(sim);
    const set = courseworkOf(back, back.player)!.assignments.length;
    const met = back.player.school!.classmates.map((m) => mateRecord(m).met);
    for (const task of ['register', 'classmates', 'faculty', 'tour', 'expectations']) {
      const t = back.now;
      expect(back.execute({ kind: 'school.orientation', payload: { task } }).error, task).toBe(`Done on ${formatDate(courseworkOf(back, back.player)!.orientation.done[task as 'tour']!, NY)}.`);
      expect(back.now).toBe(t);
    }
    expect(courseworkOf(back, back.player)!.assignments).toHaveLength(set);
    expect(back.player.school!.classmates.map((m) => mateRecord(m).met)).toEqual(met);
    // And the first day of classes counts her, registered late.
    tended(back, on(2026, 8, 31, 17));
    expect(back.player.school!.tally).toMatchObject({ classDays: 1, attended: 1 });
  }, 60_000);

  it('is refused with no time free before a class, still ahead, no such session, and once orientation is behind a life begun after it', () => {
    const busy = student('g19-orientation-busy');
    // TEST SETUP: in New York for the week and the weekend, back on the first morning of classes.
    awayIn(busy, 'us-ny-newyork');
    tended(busy, on(2026, 8, 30, 20));
    awayIn(busy, 'us-ct-newhaven');
    tended(busy, on(2026, 8, 31, 7));
    const t0 = busy.now;
    // Three hours from seven run into the nine o'clock classes.
    expect(busy.execute({ kind: 'school.orientation', payload: { task: 'classmates' } }).error).toMatch(/^Classes starts at .+: there isn’t the time before it\.$/);
    expect(busy.now).toBe(t0);
    expect(courseworkOf(busy, busy.player)!.orientation.done.classmates).toBeUndefined();
    expect(busy.player.school!.classmates.every((m) => mateRecord(m).met === undefined)).toBe(true);

    const fresh = student('g19-orientation-fresh');
    expect(fresh.execute({ kind: 'school.orientation', payload: { task: 'tour' } }).error).toBe('Its session is still ahead on the calendar.');
    expect(fresh.execute({ kind: 'school.orientation', payload: { task: 'nonsense' } }).error).toBe('There’s no such session.');

    // A life begun on 7 September, after the first week: orientation is behind it, and what it arranges is taken as done.
    const late = student('g19-orientation-late', { startMonth: 9, startDay: 7 });
    expect(zonedParts(late.now, NY)).toMatchObject({ month: 9, day: 7 });
    expect(late.execute({ kind: 'school.orientation', payload: { task: 'register' } }).error).toBe('Orientation is behind you.');
    expect(registered(late.player.school, courseworkOf(late, late.player))).toBe(true);
    const read = late.execute({ kind: 'plays.read', payload: { playId: 'fleabag' } });
    expect(read.ok, read.error).toBe(true);
  }, 60_000);

  it('PLAYER JOURNEY: Catch Up on the Coursework tab: grayed away from New Haven with the reason in words; pressed there, the class met, its toast, and the row done', () => {
    const sim = student('g19-orientation-screen');
    awayIn(sim, 'us-ny-newyork');
    tended(sim, on(2026, 8, 29, 9));
    const away = drawn(sim, 'coursework');
    const grayed = away.buttons.filter((b) => b.text === 'Catch Up');
    expect(grayed).toHaveLength(5);
    expect(grayed.every((b) => b.disabled === true && b.title === 'Orientation is in New Haven.')).toBe(true);
    expect(away.shown.split('Orientation is in New Haven.').length - 1).toBe(5);

    awayIn(sim, 'us-ct-newhaven');
    const here = drawn(sim, 'coursework');
    const offered = here.buttons.filter((b) => b.text === 'Catch Up');
    expect(offered.map((b) => [b.disabled, b.title])).toEqual([
      [false, 'Catch it up: 120 minutes'], [false, 'Catch it up: 180 minutes'], [false, 'Catch it up: 120 minutes'], [false, 'Catch it up: 120 minutes'], [false, 'Catch it up: 150 minutes'],
    ]);
    const t0 = sim.now;
    // The second row is Meeting Your Class.
    const toasts = pressed(offered[1]);
    expect(toasts).toEqual([`You met the ${sim.player.school!.classmates.length} others in your class: you’ll partner them in scenes, rehearse with them and be cast beside them.`]);
    expect(sim.player.school!.classmates).toHaveLength(15);
    expect(sim.now - t0).toBe(180 * MS_MINUTE);
    const after = drawn(sim, 'coursework');
    expect(after.buttons.filter((b) => b.text === 'Catch Up')).toHaveLength(4);
    expect(after.shown).toContain(`Done ${formatDate(sim.now, NY)}`);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.learn_part
// ---------------------------------------------------------------------------

describe('school.learn_part', () => {
  const learn = { kind: 'school.learn_part', payload: {} };

  it('PLAYER JOURNEY: four hours on the part after the read-through: an hour each, the lines up each time, memory grown and recorded on the first three only, the cap kept across a reload', () => {
    const sim = carlotta('g19-learn');
    const { calls } = callsOf(sim);
    expect(calls).toHaveLength(12);
    tended(sim, calls[0]!.at + 7 * MS_HOUR);
    // The read-through, kept: 0.12 of the lines, nothing of the blocking.
    expect(proc(sim)).toMatchObject({ calls: 1, blocking: 0, trained: 0 });
    expect(proc(sim).lines).toBeCloseTo(0.12, 12);
    for (let k = 0; k < 4; k += 1) {
      const before = { at: sim.now, lines: proc(sim).lines, memory: sim.player.craft!.memorization, recorded: memoryFrom(sim, 'learn-part').length };
      const r = sim.must<{ lines: number }>(learn);
      expect(sim.now - before.at, `hour ${k + 1}`).toBe(60 * MS_MINUTE);
      expect(r.lines).toBe(proc(sim).lines);
      expect(proc(sim).lines).toBeGreaterThan(before.lines);
      // The first three hours train memory, each recorded with where it came from; the fourth only learns lines.
      expect(memoryFrom(sim, 'learn-part')).toHaveLength(Math.min(k + 1, 3));
      expect(sim.player.craft!.memorization > before.memory, `memory grown at hour ${k + 1}`).toBe(k < 3);
      expect(sim.player.craft!.memorization).toBeGreaterThanOrEqual(before.memory);
      expect(memoryFrom(sim, 'learn-part').length - before.recorded).toBe(k < 3 ? 1 : 0);
    }
    expect(memoryFrom(sim, 'learn-part').every((x) => x.delta > 0)).toBe(true);
    // Read back, a fifth hour trains nothing either.
    const back = reload(sim);
    const memory = back.player.craft!.memorization;
    const lines = proc(back).lines;
    back.must(learn);
    expect(proc(back).lines).toBeGreaterThan(lines);
    expect(back.player.craft!.memorization).toBe(memory);
    expect(memoryFrom(back, 'learn-part')).toHaveLength(3);
  }, 60_000);

  it('PLAYER JOURNEY: the first night reads the lines learned: its preparation is the process’s lines, above a twin who only came to the calls and holds what twelve calls make; the twin’s night factor is the par’s 1, the learner’s above it; the next casting reads each run’s own delivery, changed by the hours on the part', () => {
    const sim = carlotta('g19-learn-night');
    const twin = twinOf(sim);
    const { calls, nights } = callsOf(sim);
    tended(sim, calls[0]!.at + 7 * MS_HOUR);
    for (let k = 0; k < 4; k += 1) sim.must(learn);
    for (const s of [sim, twin]) tended(s, nights[0]!.at + 4 * MS_HOUR);
    const mine = nightAt(sim, nights[0]!.at);
    const theirs = nightAt(twin, callsOf(twin).nights[0]!.at);
    expect(mine).toHaveLength(1);
    expect(theirs).toHaveLength(1);
    // Twelve calls, each a share of 0.12 of what's left: 1 − 0.88¹². And the night asks that, above the least of 0.7.
    const twelveCalls = 1 - 0.88 ** 12;
    expect(proc(twin).lines).toBeCloseTo(twelveCalls, 12);
    expect(theirs[0]!.inputs.prep.lines).toBeCloseTo(twelveCalls, 12);
    expect(mine[0]!.inputs.prep.lines).toBe(proc(sim).lines);
    expect(mine[0]!.inputs.prep.lines).toBeGreaterThan(twelveCalls);
    expect(mine[0]!.inputs.required.lines).toBeCloseTo(twelveCalls, 12);
    expect(theirs[0]!.inputs.required.lines).toBeCloseTo(twelveCalls, 12);
    // The night's growth: the par's 1 for the twin, more for the actor who did more than come.
    expect(nightFactor(twin.player.school!.casting!)).toBe(1);
    expect(nightFactor(sim.player.school!.casting!)).toBeGreaterThan(1);
    // And the notes read the lines: past two-fifths of the calls a twin short of off book is told to get there; the
    // learner, off book, isn't.
    expect(proc(twin).notes[0]!.focus).toEqual({ kind: 'lines' });
    expect(proc(twin).notes[0]!.text).toMatch(/^Be off book/);
    expect(proc(sim).notes.some((n) => n.focus.kind === 'lines')).toBe(false);

    // The second fall's casting: the chair reads each one's own run of four nights, delivered as its nights were
    // prepared, at a School production's full weight up to eight nights, and a fifth of the fit by it. What the hours on
    // the part changed reaches the read. (Measured on 2026-10-13, it reaches it downward: the learner, off book from the
    // first work-through, was given the blocking notes instead, which no work-through answers, left them, and delivered
    // 0.837 to the twin's 1.)
    for (const s of [sim, twin]) tended(s, on(2027, 8, 24));
    const readOf = (s: Simulation) => ({ run: s.player.school!.runs!.find((r) => r.production === TITLE)!, you: s.player.school!.castRead!.rows.find((r) => r.you)! });
    for (const s of [sim, twin]) {
      const { run, you } = readOf(s);
      expect(run).toMatchObject({ source: 'school', nights: 4, missed: 0, readAtCasting: 2 });
      const delivery = Math.round((run.delivered / 4) * 1000) / 1000;
      expect(you.from).toContainEqual({ what: TITLE, source: 'school', nights: 4, delivery, weight: 4 });
      expect(you.delivery).toBe(delivery);
      expect(Math.abs(you.score - (you.fit * (0.8 + 0.2 * delivery) + you.balance))).toBeLessThanOrEqual(0.15);
    }
    expect(readOf(sim).you.delivery).not.toBe(readOf(twin).you.delivery);
  }, 60_000);

  it('is refused not cast there, in class, once the lines are known, and once the run is over, each in its words with nothing spent', () => {
    const sim = carlotta('g19-learn-refused');
    const { calls, nights } = callsOf(sim);
    const unchanged = (payload: Record<string, unknown>, words: string | RegExp) => {
      const t = sim.now, lines = proc(sim).lines;
      const e = sim.execute({ kind: 'school.learn_part', payload }).error;
      if (typeof words === 'string') expect(e).toBe(words); else expect(e).toMatch(words);
      expect(sim.now).toBe(t);
      expect(proc(sim).lines).toBe(lines);
    };
    // No Rep casting this spring.
    expect(sim.player.school!.rep).toBeUndefined();
    unchanged({ which: 'rep' }, 'You aren’t cast in anything there.');
    // In the day's classes, half an hour before the first blocking call.
    tended(sim, calls[0]!.at + 7 * MS_HOUR);
    tended(sim, calls[1]!.at - 30 * MS_MINUTE);
    unchanged({}, /^You’re at Classes until .+\.$/);
    // An hour at a time whenever there's one free, until the lines are known.
    for (let n = 0; proc(sim).lines < 0.97 && n < 60; n += 1) if (!sim.execute(learn).ok) tended(sim, sim.now + MS_HOUR);
    expect(proc(sim).lines).toBeGreaterThanOrEqual(0.97);
    unchanged({}, 'You know the part.');
    // The closing night played: nothing left to rehearse for.
    tended(sim, nights.at(-1)!.at + 4 * MS_HOUR);
    expect(sim.player.school!.casting!.performed).toBe(4);
    unchanged({}, 'The run is over.');
  }, 60_000);

  it('PLAYER JOURNEY: Learn The Part on the Casting tab: pressed, an hour on the lines, its toast, and the Lines figure the screen shows after', () => {
    const sim = carlotta('g19-learn-screen');
    const { calls } = callsOf(sim);
    tended(sim, calls[0]!.at + 7 * MS_HOUR);
    const before = drawn(sim, 'casting');
    expect(before.shown).toContain('Lines 12%');
    const button = before.buttons.find((b) => b.text === 'Learn The Part');
    expect(button?.disabled).toBe(false);
    const t0 = sim.now;
    const toasts = pressed(button);
    expect(sim.now - t0).toBe(60 * MS_MINUTE);
    const pct = `${Math.round(proc(sim).lines * 100)}%`;
    expect(proc(sim).lines).toBeGreaterThan(0.12);
    expect(toasts).toEqual([`An hour on the part: lines at ${pct}.`]);
    expect(drawn(sim, 'casting').shown).toContain(`Lines ${pct}`);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.review_blocking
// ---------------------------------------------------------------------------

describe('school.review_blocking', () => {
  const review = { kind: 'school.review_blocking', payload: {} };
  /** The fourth call, a blocking rehearsal, missed in New York (TEST SETUP: a day there over it), and back. */
  const missFourth = (sim: Simulation) => {
    const { calls } = callsOf(sim);
    expect(calls[3]!.payload.stage).toBe('blocking');
    tended(sim, calls[3]!.at - MS_HOUR);
    awayIn(sim, 'us-ny-newyork');
    sim.advanceTo(calls[3]!.at + MS_MINUTE);
    awayIn(sim, 'us-ct-newhaven');
    expect(calls[3]!.status).toBe('missed');
    expect(proc(sim).blockingMissed).toBe(1);
  };
  // The blocking calls' arithmetic: each kept call sets a quarter of what's left, the book half of it.
  const call = (b: number) => b + 0.25 * (1 - b);
  const book = (b: number) => b + 0.5 * (1 - b);

  it('PLAYER JOURNEY: the fourth call missed; caught up after a reload: an hour, the gap closed, the blocking up by half of what was left, memory recorded; then refused; the next note is on the lines where a twin who left the gap is given the blocking, and the first night reads the difference', () => {
    let sim = carlotta('g19-blocking');
    missFourth(sim);
    const twoCalls = call(call(0));
    expect(twoCalls).toBe(0.4375);
    expect(proc(sim).blocking).toBeCloseTo(twoCalls, 12);
    const leftOpen = twinOf(sim);
    sim = reload(sim);
    expect(proc(sim).blockingMissed).toBe(1);
    const t0 = sim.now;
    const memory = sim.player.craft!.memorization;
    const r = sim.must<{ blocking: number }>(review);
    expect(sim.now - t0).toBe(60 * MS_MINUTE);
    expect(r.blocking).toBe(0.71875);
    expect(proc(sim).blocking).toBe(book(twoCalls));
    expect(proc(sim).blockingMissed).toBe(0);
    expect(memoryFrom(sim, 'blocking')).toHaveLength(1);
    expect(sim.player.craft!.memorization).toBeGreaterThan(memory);
    // Nothing more to catch up: refused, nothing spent, nothing grown.
    const t1 = sim.now;
    expect(sim.execute(review).error).toBe('You haven’t missed any blocking.');
    expect(sim.now).toBe(t1);
    expect(proc(sim).blocking).toBe(0.71875);
    expect(memoryFrom(sim, 'blocking')).toHaveLength(1);

    // The first work-through, the sixth call: a gap open is the director's note; closed, the lines short past two-fifths
    // of the calls are (1 − 0.88⁵ after five calls kept).
    const sixth = (s: Simulation) => callsOf(s).calls[5]!;
    for (const s of [sim, leftOpen]) tended(s, sixth(s).at + 7 * MS_HOUR);
    expect(proc(sim).lines).toBeCloseTo(1 - 0.88 ** 5, 12);
    expect(proc(sim).notes[0]!.focus).toEqual({ kind: 'lines' });
    expect(proc(leftOpen).notes[0]!.focus).toEqual({ kind: 'blocking' });
    expect(proc(leftOpen).notes[0]!.text).toBe('The blocking isn’t set in you: go back through the book, so the stage pictures land where they’re meant to.');

    // The first night: the fifth call and the technical set a quarter more each, on what the book left, or on the gap.
    const first = (s: Simulation) => callsOf(s).nights[0]!.at;
    for (const s of [sim, leftOpen]) tended(s, first(s) + 4 * MS_HOUR);
    const caught = call(call(book(twoCalls)));
    const gap = call(call(twoCalls));
    expect(caught).toBe(0.841796875);
    expect(gap).toBe(0.68359375);
    expect(nightAt(sim, first(sim))[0]!.inputs.prep.blocking).toBeCloseTo(caught, 12);
    expect(nightAt(leftOpen, first(leftOpen))[0]!.inputs.prep.blocking).toBeCloseTo(gap, 12);
    expect(proc(leftOpen).blockingMissed).toBe(1);
    expect(nightFactor(sim.player.school!.casting!)).toBeGreaterThan(nightFactor(leftOpen.player.school!.casting!));

    // The closing played: nothing left to catch up for.
    tended(sim, callsOf(sim).nights.at(-1)!.at + 4 * MS_HOUR);
    expect(sim.execute(review).error).toBe('The run is over.');
    expect(sim.execute({ kind: 'school.review_blocking', payload: { which: 'rep' } }).error).toBe('You aren’t cast in anything there.');
  }, 60_000);

  it('grows memory from the book after Learn The Part has trained its three: the book isn’t held to that cap', () => {
    const sim = carlotta('g19-blocking-memory');
    missFourth(sim);
    for (let k = 0; k < 4; k += 1) sim.must({ kind: 'school.learn_part', payload: {} });
    expect(proc(sim).trained).toBe(3);
    expect(memoryFrom(sim, 'learn-part')).toHaveLength(3);
    const memory = sim.player.craft!.memorization;
    sim.must(review);
    expect(memoryFrom(sim, 'blocking')).toHaveLength(1);
    expect(memoryFrom(sim, 'blocking')[0]!.delta).toBeGreaterThan(0);
    expect(sim.player.craft!.memorization).toBeGreaterThan(memory);
    expect(memoryFrom(sim, 'learn-part')).toHaveLength(3);
  }, 60_000);

  it('PLAYER JOURNEY: Catch Up The Blocking on the Casting tab: offered with the gap shown, pressed, its toast, then grayed with the reason in words', () => {
    const sim = carlotta('g19-blocking-screen');
    missFourth(sim);
    const before = drawn(sim, 'casting');
    expect(before.shown).toContain('1 Missed To Catch Up');
    const button = before.buttons.find((b) => b.text === 'Catch Up The Blocking');
    expect(button?.disabled).toBe(false);
    expect(pressed(button)).toEqual(['Caught up from the book: blocking at 72%.']);
    const after = drawn(sim, 'casting');
    const grayed = after.buttons.find((b) => b.text === 'Catch Up The Blocking');
    expect(grayed).toMatchObject({ disabled: true, title: 'You haven’t missed any blocking.' });
    expect(after.shown).toContain('Catch Up The Blocking: You haven’t missed any blocking.');
    expect(after.shown).toContain('Blocking 72%');
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.work_note
// ---------------------------------------------------------------------------

describe('school.work_note', () => {
  /** The festival with the lines learned each evening and every note worked its first way, kept where it waits. */
  const festival = (seed: string) => {
    const sim = carlotta(seed);
    const { calls } = callsOf(sim);
    for (let k = 0; k < calls.length - 1; k += 1) {
      tended(sim, calls[k]!.at + 6.5 * MS_HOUR);
      if (proc(sim).lines < 0.97) sim.must({ kind: 'school.learn_part', payload: {} });
      const last = proc(sim).notes.at(-1);
      if (last && last.taken === undefined && !last.worked) {
        const r = sim.must<{ pending?: boolean }>({ kind: 'school.work_note', payload: {} });
        if (r.pending) sim.must({ kind: 'work.settle', payload: { piece: 'part:school', keep: true } });
      }
    }
    tended(sim, calls.at(-1)!.at + 7 * MS_HOUR);
    return sim;
  };
  /** What a craft note untaken goes into class as: the objective as the breakdown, listening and the relationship as the partner's part, the rest as time on its feet. */
  const LEDGER: Record<string, string> = { objective: 'dim:interpretation', listening: 'dim:partner', relationship: 'dim:partner', pacing: 'dim:rehearsal', behavior: 'dim:rehearsal', transitions: 'dim:rehearsal' };

  it('PLAYER JOURNEY: every note worked through the festival: the direction tally as the notes have it, a note given again says what was tried, and the closing looks back once, carrying the note not taken into class', () => {
    const sim = festival('g19-notes-a');
    const notes = proc(sim).notes;
    const directed = notes.filter((n) => n.focus.kind === 'craft' || n.focus.kind === 'direction');
    expect(directed.length).toBeGreaterThan(0);
    // The journey's tally, counted here from the notes themselves.
    const ways: Record<string, number> = {};
    for (const n of directed) if (n.answer?.solution) ways[n.answer.solution] = (ways[n.answer.solution] ?? 0) + 1;
    expect(journeyOf(sim.player).direction).toEqual({
      given: directed.length,
      worked: directed.filter((n) => n.worked && n.answer?.solution).length,
      answered: directed.filter((n) => n.taken).length,
      ways,
    });
    // A craft note given again on the same thing, after a way was tried at the last: what was tried, its figure before
    // and after, after "Better since the last note." where it was taken and "Still:" where it wasn't.
    const again = notes.flatMap((n, i) => {
      if (n.focus.kind !== 'craft') return [];
      const f = n.focus;
      const prior = notes.slice(0, i).reverse().find((m) => m.focus.kind === 'craft' && m.focus.note === f.note && m.focus.segment === f.segment);
      return prior?.answer?.solution ? [{ n, prior }] : [];
    });
    expect(again.length).toBeGreaterThan(0);
    expect(again.some(({ prior }) => prior.taken === true)).toBe(true);
    expect(again.some(({ prior }) => prior.taken === false)).toBe(true);
    for (const { n, prior } of again) {
      expect(n.text).toContain(`You tried ${prior.answer!.label!.toLowerCase()}: ${prior.answer!.before} then, ${prior.answer!.after} now.`);
      expect(n.text).toMatch(prior.taken ? /^Better since the last note\. You tried / : /^Still: /);
    }

    // The closing: the calls as the calendar has them, the notes as they were given, taken and answered in the work.
    tended(sim, callsOf(sim).nights.at(-1)!.at + 4 * MS_HOUR);
    const { calls } = callsOf(sim);
    const given = notes.filter((n) => n.taken !== undefined);
    const untaken = notes.filter((n) => n.taken === false);
    expect(untaken.some((n) => n.focus.kind === 'craft')).toBe(true);
    const looking = titled(sim, `Looking Back: ${TITLE}`);
    expect(looking).toHaveLength(1);
    expect(looking[0]!.body).toContain(`${TITLE}: ${calls.filter((c) => c.status === 'done').length} calls answered of ${calls.length}; ${given.filter((n) => n.taken).length} of ${given.length} notes taken, ${notes.filter((n) => n.focus.kind === 'craft' && n.taken).length} answered in the work; the dress ${proc(sim).dress}.`);
    expect(looking[0]!.body).toContain('What’s still open goes with you into class.');
    // Each craft note not taken, in the class's ledger as the part of a scene's preparation that answers it.
    const ledger = notesOf(courseworkOf(sim, sim.player)!);
    const fromRun = () => ledger.flatMap((r) => r.history.filter((x) => x.assignmentId === `production:${TITLE}`).map(() => r.key));
    for (const n of untaken.filter((x) => x.focus.kind === 'craft')) expect(fromRun()).toContain(LEDGER[(n.focus as { note: string }).note]);
    // Once: read back and a day on, no second looking back and nothing carried twice.
    const carried = fromRun().length;
    expect(carried).toBeGreaterThan(0);
    const back = reload(sim);
    tended(back, back.now + MS_DAY);
    expect(titled(back, `Looking Back: ${TITLE}`)).toHaveLength(1);
    expect(notesOf(courseworkOf(back, back.player)!).flatMap((r) => r.history.filter((x) => x.assignmentId === `production:${TITLE}`))).toHaveLength(carried);
  }, 60_000);

  it('PLAYER JOURNEY: a lines note worked moves the lines as an hour on the part does, on a twin at the same moment; refused a second time across a reload; taken at the next call, whose growth is a note taken’s 1.1 of a twin’s who left it', () => {
    const sim = carlotta('g19-lines-note');
    const { calls } = callsOf(sim);
    // Every call kept and nothing more: at the first work-through the lines are short of off book.
    tended(sim, calls[5]!.at + 6.5 * MS_HOUR);
    const note = proc(sim).notes.at(-1)!;
    expect(note.focus).toEqual({ kind: 'lines' });
    const before = proc(sim).lines;
    expect(before).toBeCloseTo(1 - 0.88 ** 6, 12);
    const learner = twinOf(sim);
    const left = twinOf(sim);
    const t0 = sim.now;
    expect(sim.must<{ worked: boolean }>({ kind: 'school.work_note', payload: {} })).toEqual({ worked: true });
    expect(sim.now - t0).toBe(60 * MS_MINUTE);
    // At least a share of 0.3 at half focus of what's left, and the same as an hour on the part from the same moment.
    expect(proc(sim).lines - before).toBeGreaterThanOrEqual(0.3 * 0.5 * (1 - before));
    learner.must({ kind: 'school.learn_part', payload: {} });
    expect(proc(sim).lines).toBeCloseTo(proc(learner).lines, 12);
    // The twin who leaves the note spends the hour idle, so the two clocks run on together.
    tended(left, sim.now);
    expect(proc(sim).notes.at(-1)!.worked).toBe(true);
    const back = reload(sim);
    expect(back.execute({ kind: 'school.work_note', payload: {} }).error).toBe('You’ve worked on it: the next call will show it.');
    // The next call: taken where it was worked, and not where it was left (the calls alone leave the lines at 1 − 0.88⁷,
    // short of off book); the call's growth, from the same craft on the same day, a note taken's 1.1 of the other's.
    const seventh = (s: Simulation) => callsOf(s).calls[6]!;
    for (const s of [back, left]) tended(s, seventh(s).at - MS_HOUR);
    expect(back.now).toBe(left.now);
    expect(back.player.craft!.scene).toBe(left.player.craft!.scene);
    const scene = back.player.craft!.scene;
    for (const s of [back, left]) s.advanceTo(seventh(s).at + MS_MINUTE);
    expect(proc(back).notes[0]!.taken).toBe(true);
    expect(proc(left).lines).toBeCloseTo(1 - 0.88 ** 7, 12);
    expect(proc(left).notes[0]!.taken).toBe(false);
    expect((back.player.craft!.scene - scene) / (left.player.craft!.scene - scene)).toBeCloseTo(1.1, 6);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.call_in_sick
// ---------------------------------------------------------------------------

describe('school.call_in_sick', () => {
  const sick = { kind: 'school.call_in_sick', payload: {} };
  /** TEST SETUP: unwell, under the condition calling in sick excuses, as an illness would leave them. */
  const unwell = (sim: Simulation) => { sim.player.wellbeing.condition = ESTIMATE.sickBelow - 10; };

  it('PLAYER JOURNEY: called in sick the morning of a Carlotta work-through: the call excused and not counted, no gap in the blocking, no breach, still in the pool, across a reload; a twin who stays away without calling is counted', () => {
    let sim = carlotta('g19-sick');
    const sixth = (s: Simulation) => callsOf(s).calls[5]!;
    expect(sixth(sim).payload.stage).toBe('work');
    tended(sim, sixth(sim).at - 9 * MS_HOUR);
    const school = () => sim.player.school!;
    const was = { tally: { ...school().tally }, calls: proc(sim).calls, blockingMissed: proc(sim).blockingMissed, castable: school().castable, standing: school().standing };
    expect(was).toMatchObject({ calls: 5, blockingMissed: 0, castable: true });
    const stayedAway = twinOf(sim);
    unwell(sim);
    expect(sim.must<{ excused: boolean }>(sick)).toEqual({ excused: true });
    expect(school().sickDay).toBe(dayKeyOf(sixth(sim).at));
    sim = reload(sim);
    expect(sim.execute(sick).error).toBe('You’ve called in sick today already.');
    tended(sim, sixth(sim).at + 7 * MS_HOUR);
    expect(sixth(sim).status).toBe('missed');
    expect(school().tally.calls).toBe(was.tally.calls);
    expect(school().tally.answered).toBe(was.tally.answered);
    expect(school().tally.breaches).toBe(was.tally.breaches);
    expect(proc(sim).calls).toBe(was.calls);
    expect(proc(sim).blockingMissed).toBe(0);
    expect(school().castable).toBe(true);
    expect(school().standing).toBe(was.standing);
    expect(titled(sim, 'You Missed A Rehearsal Call')).toHaveLength(0);
    // The day's classes too, excused.
    expect(school().tally.excused).toBe(was.tally.excused + 1);

    // The road not taken: away for the day without a word (TEST SETUP: in New York), the call and the classes counted.
    awayIn(stayedAway, 'us-ny-newyork');
    tended(stayedAway, sixth(stayedAway).at + 7 * MS_HOUR);
    const theirs = stayedAway.player.school!;
    expect(sixth(stayedAway).status).toBe('missed');
    expect(theirs.tally.calls).toBe(was.tally.calls + 1);
    expect(theirs.tally.answered).toBe(was.tally.answered);
    expect(theirs.tally.excused).toBe(was.tally.excused);
    expect(titled(stayedAway, 'You Missed A Rehearsal Call')).toHaveLength(1);
  }, 60_000);

  it('PLAYER JOURNEY: a partner rehearsal booked through Ask, on a day called in sick, is excused and the partner’s trust is unchanged; the twin who just doesn’t come is waited for', () => {
    const sim = student('g19-sick-partner');
    tended(sim, on(2026, 9, 1, 12));
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.status === 'open' && x.template === 'scene-study' && x.partner !== undefined)!;
    expect(a).toBeDefined();
    let booked: { accepted: boolean; rehearsalId?: string } | undefined;
    for (const hour of [7, 20, 21]) {
      booked = sim.must<{ accepted: boolean; rehearsalId?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: on(2026, 9, 2, hour) } });
      if (booked.accepted) break;
    }
    expect(booked?.accepted).toBe(true);
    const rehearsal = () => courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === a.id)!.rehearsals.find((r) => r.id === booked!.rehearsalId)!;
    const rehearsalAt = rehearsal().at;
    tended(sim, on(2026, 9, 2, 6));
    const mate = sim.player.school!.classmates[a.partner!]!;
    const first = mate.name.split(' ')[0]!;
    const trust = trustOf(mate);
    const noShow = twinOf(sim);
    unwell(sim);
    sim.must(sick);
    tended(sim, rehearsalAt + 2 * MS_HOUR);
    expect(rehearsal().status).toBe('excused');
    expect(trustOf(mate)).toBe(trust);
    expect(mateRecord(mate).missedByYou ?? 0).toBe(0);
    expect(titled(sim, `${first} Knows You’re Ill`)).toHaveLength(1);

    // TEST SETUP: in New York that morning, without calling in.
    awayIn(noShow, 'us-ny-newyork');
    tended(noShow, rehearsalAt + 2 * MS_HOUR);
    const theirMate = noShow.player.school!.classmates[a.partner!]!;
    const theirs = courseworkOf(noShow, noShow.player)!.assignments.find((x) => x.id === a.id)!.rehearsals.find((r) => r.id === booked!.rehearsalId)!;
    expect(theirs.status).toBe('missedByYou');
    expect(trustOf(theirMate)).toBeLessThan(trust);
    expect(titled(noShow, `${first} Waited For You`)).toHaveLength(1);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.take_shift
// ---------------------------------------------------------------------------

describe('school.take_shift', () => {
  const electives = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.personId === sim.player.id && i.payload.elective === true);
  /** Yale's work-study rate for 2026–27, $23.00 an hour (the Bulletin's, `WORK_STUDY.hourly`). */
  const HOURLY = 23_00;

  it('PLAYER JOURNEY: Take An Elective Shift on the Work-Study tab: the toast names the evening, Elective Hours reads 4; worked, Friday pays 4 hours at $23.00 into the bank and onto the year’s return, and the next payday only the Saturday’s six, across a reload', () => {
    const sim = student('g19-shift');
    tended(sim, on(2026, 8, 31, 12));
    expect(registered(sim.player.school, courseworkOf(sim, sim.player))).toBe(true);
    expect(yearOf(sim.player, 2026).workStudy).toBe(0);
    const before = drawn(sim, 'work');
    expect(before.shown).toContain('Elective Hours Asked For 0');
    const toasts = pressed(before.buttons.find((b) => b.text === 'Take An Elective Shift'));
    // The next evening, Tuesday 1 September, seven to eleven: nothing else wants it.
    const tuesday = on(2026, 9, 1, 19);
    expect(toasts).toEqual([`Front of house, ${formatDateTime(tuesday, NY)}.`]);
    expect(electives(sim).map((i) => [i.at, i.durationMinutes, i.payload.hours, i.status])).toEqual([[tuesday, 240, 4, 'pending']]);
    expect(drawn(sim, 'work').shown).toContain('Elective Hours Asked For 4');

    // Worked on Tuesday; paid on Friday the 4th at five, by direct deposit, and recorded for the return.
    tended(sim, on(2026, 9, 4, 18));
    expect(electives(sim)[0]!.status).toBe('done');
    const paid = Object.values(sim.universe.transactions).filter((t) => t.memo.startsWith('Work-study wages'));
    expect(paid).toHaveLength(1);
    expect(paid[0]!.memo).toMatch(/^Work-study wages, 4 hours: /);
    expect(paid[0]!.postings.find((p) => p.accountId === sim.player.primaryAccountId)?.amount).toBe(4 * HOURLY);
    expect(yearOf(sim.player, 2026).workStudy).toBe(4 * HOURLY);
    expect(figuresFor(sim.player, 2026).workStudy).toBe(4 * HOURLY);
    expect(sim.player.school!.workStudy).toMatchObject({ electiveHours: 4, owedHours: 0 });

    // Read back; the Saturday's six assigned hours are the next Friday's, and the evening isn't paid again.
    const back = reload(sim);
    tended(back, on(2026, 9, 11, 18));
    expect(yearOf(back.player, 2026).workStudy).toBe((4 + 6) * HOURLY);
    expect(figuresFor(back.player, 2026).workStudy).toBe((4 + 6) * HOURLY);
    expect(Object.values(back.universe.transactions).filter((t) => t.memo.startsWith('Work-study wages')).map((t) => t.memo.split(':')[0])).toEqual(['Work-study wages, 4 hours', 'Work-study wages, 6 hours']);
  }, 60_000);

  it('PLAYER JOURNEY: asked the day before a Seagull night on call, it skips every evening held by a call at five to the curtain’s end', () => {
    const sim = student('seagull');
    // TEST SETUP: the coursework prepared each midnight, as tests/school.test.ts plays its Seagull understudy, so the fall
    // is evaluated on the classes and the casting it's about.
    sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
      for (const x of courseworkOf(s, s.player)?.assignments ?? []) if (x.status === 'open' || x.status === 'revising') for (const d of PREP_DIMS) x.prep[d] = Math.max(x.prep[d] ?? 0, 0.95);
    });
    sim.advanceTo(on(2027, 1, 4, 9) + MS_MINUTE);
    expect(sim.player.school!.rep).toMatchObject({ kind: 'understudy' });
    const checks = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.personId === sim.player.id && i.payload.call === 'oncall').sort((a, b) => a.at - b.at);
    expect(checks.length).toBeGreaterThan(0);
    expect(checks.every((c) => c.requiresPlayer === false)).toBe(true);
    // Each night on call is a call three hours before the curtain, and holds the time from it to three hours after the
    // curtain: an eight o'clock curtain's evening from five to eleven.
    expect(checks.every((c) => Number(c.payload.perfAt) - c.at === 3 * MS_HOUR)).toBe(true);
    const held = checks.map((c) => [c.at, Number(c.payload.perfAt) + 180 * MS_MINUTE] as const);
    const evening = checks.find((c) => zonedParts(Number(c.payload.perfAt), NY).hour === 20)!;
    expect(zonedParts(evening.at, NY).hour).toBe(17);
    const night = evening.at;
    tended(sim, night - 29 * MS_HOUR);
    const tomorrow = on(zonedParts(night, NY).year, zonedParts(night, NY).month, zonedParts(night, NY).day, 19);
    const overlaps = (at: number) => held.some(([a, b]) => a < at + 4 * MS_HOUR && at < b);
    const wants = (at: number) => sim.universe.scheduled.some((i) => i.status === 'pending' && i.requiresPlayer && i.durationMinutes && i.at < at + 4 * MS_HOUR && at < i.at + i.durationMinutes * MS_MINUTE && i.kind !== SHIFT_KIND);
    // Tomorrow evening nothing wants her but the night on call, which needs nobody at the theater unless sent on.
    expect(overlaps(tomorrow)).toBe(true);
    expect(wants(tomorrow)).toBe(false);
    const r = sim.must<{ at: number; hours: number }>({ kind: 'school.take_shift', payload: {} });
    expect(r.at).toBeGreaterThan(tomorrow);
    expect(zonedParts(r.at, NY).hour).toBe(19);
    expect(overlaps(r.at)).toBe(false);
    // The first evening from tomorrow that no night on call and nothing that wants her holds.
    let free = tomorrow;
    while (overlaps(free) || wants(free)) free += MS_DAY;
    expect(r.at).toBe(free);
  }, 60_000);

  it('an evening booked and then called off by a leave gives its four hours back, as an evening not worked does', () => {
    const sim = student('g19-shift-leave');
    tended(sim, on(2026, 10, 5, 9));
    // TEST SETUP: the flu, as `careFor` gives one, for a medical leave.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tended(sim, asked.decideAt - 13 * MS_HOUR);
    const r = sim.must<{ at: number }>({ kind: 'school.take_shift', payload: {} });
    expect(r.at).toBeGreaterThan(asked.decideAt);
    expect(sim.player.school!.workStudy.electiveHours).toBe(4);
    tended(sim, asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave?.status).toBe('on');
    expect(electives(sim).find((i) => i.at === r.at)?.status).toBe('cancelled');
    // Never worked, and never to be: its hours are no longer asked for.
    expect(sim.player.school!.workStudy.electiveHours).toBe(0);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.cabaret
// ---------------------------------------------------------------------------

describe('school.cabaret', () => {
  /** A night's value as the faculty read a run: off −1, solid 0, strong 1, remarkable 2 (SLATE's `NIGHT_VALUE`). */
  const VALUE: Record<string, number> = { off: -1, solid: 0, strong: 1, remarkable: 2 };
  const SEASON = 'Yale Cabaret, Season 59';

  it('PLAYER JOURNEY: Join A Cabaret Show pressed on the Casting tab; played through the clock; the fall’s evaluation reads its nights and names the show, the spring’s casting reads the run once at half weight and Why This Cast says so; a twin who never joined has none of it', () => {
    const sim = student('g19-cabaret');
    tended(sim, on(2026, 9, 7, 18));
    const never = twinOf(sim);
    const offered = drawn(sim, 'casting');
    const toasts = pressed(offered.buttons.find((b) => b.text === 'Join A Cabaret Show'));
    const cab = () => sim.player.school!.cabaret!;
    expect(cab()).toMatchObject({ term: 0, production: SEASON, performed: 0 });
    // A Thursday at least three weeks off: 1 October.
    expect(cab().week).toBe('2026-10-01');
    expect(toasts).toEqual([`In the Cabaret: your show plays the week of ${formatDate(on(2026, 10, 1), NY)}.`]);
    const joined = drawn(sim, 'casting');
    expect(joined.shown).toContain(`Your show plays the week of ${formatDate(on(2026, 10, 1), NY)}`);
    expect(joined.shown).toContain(`Your Part ${cab().role}`);
    expect(joined.buttons.some((b) => b.text === 'Join A Cabaret Show')).toBe(false);
    const shows = sim.universe.scheduled.filter((i) => i.kind === CABARET_KIND && i.payload.call === 'performance');
    expect(shows).toHaveLength(5);

    // Played: five nights, each banded.
    tended(sim, Math.max(...shows.map((s) => s.at)) + 3 * MS_HOUR);
    expect(cab().performed).toBe(5);
    const nights = cab().nights!;
    expect(Object.values(nights).reduce((a, b) => a + b, 0)).toBe(5);

    // The fall's evaluation, through the clock: the show's nights are the term's work on stage, their mean by value.
    for (const s of [sim, never]) tended(s, on(2026, 12, 31));
    const work = Object.entries(nights).reduce((a, [band, n]) => a + VALUE[band]! * n, 0) / 5;
    const review = sim.player.school!.history[0]!;
    expect(review.term).toBe(0);
    expect(review.work).toBeCloseTo(work, 12);
    // Over −0.5 and under 1 the reason is silent on it; at or under −0.5 it falls short, at 1 or over it's noted.
    const said = work <= -0.5 ? ` Your work in ${SEASON} fell short of what the program asks.` : work >= 1 ? ` The faculty noted your strong work in ${SEASON}.` : '';
    expect(said).not.toBe('');
    expect(review.reason).toContain(said);
    expect(drawn(sim, 'standing').shown).toContain(said.trim());
    expect(never.player.school!.history[0]!.work).toBeUndefined();
    expect(never.player.school!.history[0]!.reason).not.toContain('Yale Cabaret');

    // The spring's casting, the term's first morning: the run read once, its nights at half weight, up to eight.
    for (const s of [sim, never]) tended(s, on(2027, 1, 4, 9) + MS_MINUTE);
    const run = sim.player.school!.runs!.find((r) => r.source === 'cabaret')!;
    expect(run).toMatchObject({ production: SEASON, nights: 5, missed: 0, readAtCasting: 1 });
    const delivery = Math.round((run.delivered / 5) * 1000) / 1000;
    const weight = Math.min(5, 8) * 0.5;
    expect(weight).toBe(2.5);
    expect(sim.player.school!.lastWork?.from).toContainEqual({ what: SEASON, source: 'cabaret', nights: 5, delivery, weight });
    const you = sim.player.school!.castRead!.rows.find((r) => r.you)!;
    expect(you.delivery).toBe(delivery);
    expect(you.from).toContainEqual({ what: SEASON, source: 'cabaret', nights: 5, delivery, weight });
    // A fifth of the fit by the delivery, as the chair reads it.
    expect(Math.abs(you.score - (you.fit * (0.8 + 0.2 * delivery) + you.balance))).toBeLessThanOrEqual(0.15);
    expect(drawn(sim, 'casting').shown).toContain(`${SEASON}, the Yale Cabaret, 5 nights (${Math.round(delivery * 100)}%, weighted 2.5)`);
    // Never joined: nothing to read, everything delivered.
    expect(never.player.school!.lastWork?.from ?? []).toEqual([]);
    expect(never.player.school!.castRead!.rows.find((r) => r.you)!.delivery).toBe(1);
    // Read back and a week on, the run isn't read again.
    const back = reload(sim);
    tended(back, back.now + 7 * MS_DAY);
    expect(back.player.school!.runs!.filter((r) => r.source === 'cabaret').map((r) => r.readAtCasting)).toEqual([1]);
  }, 60_000);

  it('casts the part within the company by its fit: beside a class whose every craft is 95, the same student takes a supporting part where among her own class she leads', () => {
    const sim = student('g19-cabaret-part');
    tended(sim, on(2026, 9, 7, 18));
    const strongClass = twinOf(sim);
    // TEST SETUP: every classmate's every craft skill at 95.
    for (const m of strongClass.player.school!.classmates) for (const k of Object.keys(m.craft)) (m.craft as unknown as Record<string, number>)[k] = 95;
    sim.must({ kind: 'school.cabaret', payload: {} });
    strongClass.must({ kind: 'school.cabaret', payload: {} });
    expect(sim.player.school!.cabaret).toMatchObject({ role: 'A Leading Part In A New Piece', size: 'lead' });
    expect(strongClass.player.school!.cabaret).toMatchObject({ role: 'A Supporting Part In A New Piece', size: 'supporting' });
  }, 60_000);
});
