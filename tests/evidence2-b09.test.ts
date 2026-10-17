/**
 * The second round of 2026-10-13's evidence for five school rows the first round left partial: an Incomplete made up
 * and asked a month more for, a year asked to be repeated, an additional term, and work-study hours converted to grant
 * aid. As in the first round (tests/evidence-g25-school.test.ts, tests/evidence-g26-school.test.ts, whose helpers are
 * copied here, not imported), each command is sent as its button sends it (`sim.execute`, or the drawn Gated button's
 * own onClick, which runs it), each scheduled consequence comes by the clock (`sim.advanceTo`: an evaluation,
 * Commencement, a deadline, a decision, a processing), and each is read where the row says it's read. The figures are
 * worked here from the rules' own numbers and written as literals: a course passed at three quarters of its meetings,
 * thirty days to an Incomplete and thirty more, a session a week of the course, five working days to a decision, the
 * Bulletin's nine semesters and two Fails in a term, 150 assigned hours at $23.00.
 *
 * - `school.make_up`: an Incomplete in the last spring, On-Camera Acting Technique (Thursdays, fourteen meetings, four
 *   called in sick), holds the degree at Commencement; Make Up A Session, pressed on the Standing tab the day after,
 *   confers it (`conferIfReady`), once, through a save, where a twin left alone has the degree withheld at the
 *   month's end. A student who has withdrawn is refused in the School's words for one who has left it ('You’re not at
 *   school.'); the engine took the session and passed the course for them, and that test failed, until later on
 *   2026-10-13. The New Haven refusal was reached by no play, and 'Its month has run out.' by no student still at
 *   school; both went later that day.
 * - `school.extend_incomplete`: the same last-spring Incomplete, asked a month more for after Commencement: the old
 *   date passes with the degree still waiting, a session made up in the month more confers it, and a twin left alone
 *   lapses at the new date and has the degree withheld. Two defects, each a test that failed until later on 2026-10-13:
 *   the Permanent Incomplete's notice told a student whose degree it withheld to ask to repeat the year, which nothing
 *   then let them ask; and a student who had withdrawn could still be given a month more, its deadline put back on
 *   their calendar.
 * - `school.request_repeat`: refused beside an additional term in each of its words, the one asked for and the one
 *   granted, where a twin with neither is let ask. The decision's own refusal, 'Your Repeat Isn’t Granted' for a first
 *   year and the degree withheld for a last, is reached only from a fixture (a second Fail put on the record between
 *   the asking and the deciding), which no play makes: the decision counts as the asking did, and no evaluation falls
 *   between them.
 * - `school.request_extra_term`: past the Bulletin's nine semesters, refused at the asking and, at the decision, the
 *   degree withheld; and a disqualification the faculty never judged, refused at the asking and at the decision. Each
 *   from a fixture (a ninth term or a second Fail put on the record), which no play makes, beside a twin without it.
 * - `school.request_conversion`: a life made with the family creation leaves chosen, Wealthy, has no need found, so
 *   the drawn button is grayed and the command refused, while its twin with need is paid for the same Saturday (until
 *   2026-10-14 every draft was made wealthy, whatever it said; since then a family below Wealthy, chosen on Genres &
 *   Background, finds need, and tests/need-paths.test.ts plays one from creation); the command's returned hours are the hours May's processing pays; and the processing's 'No Hours To
 *   Convert', from a fixture no play makes.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity), an actor at Yale in New Haven from Monday 24 August 2026, played by the clock; born in London,
 * on an F-1, where the row reads the I-20. A course is failed as a player fails one, by sleeping through its meetings
 * (`life.sleep` at one in the morning for ten hours), and an Incomplete is had as a player has one, by calling in sick
 * (`school.call_in_sick`). The seeds are arbitrary, none picked for what it draws: b09-fall, b09-last, b09-repeat,
 * b09-l3, b09-c0, b09-new.
 *
 * TEST SETUP, said again where it's done:
 * - the coursework prepared each midnight and the student rested, fed and awake each time the clock moves, as
 *   tests/guide-examples-school.test.ts plays one, so nothing but a row's own steps falls short at an evaluation;
 * - an injury off work for the first week, and the flu on a day called in sick: illness and injury come by the draw;
 * - for need-based aid, a life with no family money behind it (family unset, wealth 'scraping'), as tests/work-limits.test.ts
 *   makes one, and as creation's Scraping family makes one from 2026-10-14 (until then no life made on the creation
 *   screen could have it: `newLifeConfig` and `newLifeFrom` gave every one a wealthy family, the owner's choice of
 *   2026-09-27);
 * - a second Fail, a ninth enrolled term, or six hours already converted, put on the record by hand, where the row's
 *   branch is reached by no play: each is said where it's done, with why no play reaches it;
 * - a screen's two-step choice pressed (Ask To Repeat The Year…), which a static render can't press its way into: the
 *   panel drawn with its choice made.
 * A life is copied in memory (`loadSave` of a JSON copy) for a twin or a later step, never written anywhere; a save
 * and a load are `serialise` and `deserialise`.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeConfig, newLifeFrom } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { PREP_DIMS } from '@/engine/content/coursework';
import type { SchoolDate } from '@/engine/content/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { CLASSES_KIND, CONVERT_KIND, SHIFT_KIND, TERM_KIND, classPeriod, coursesOn, isClassDay, keyOf } from '@/engine/systems/school';
import { INCOMPLETE_DUE_KIND, degreeShortfall } from '@/engine/systems/courserecord';
import { EXTRA_DECIDE_KIND, REPEAT_DECIDE_KIND, enrolledTerms } from '@/engine/systems/leave';
import { healthOf } from '@/engine/systems/health';
import { f1Of } from '@/engine/systems/permission';
import { earningsOf } from '@/engine/systems/earnings';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
  toasts: [] as string[],
  /** TEST SETUP: what the screen's useStates start at, in order, in place of their own initial values. */
  states: [] as unknown[],
  tab: 'standing' as string,
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    return h.states.length ? [h.states.shift(), set] : [value, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

// The School screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
});

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

const { RepeatPanel, WorkLimitsBlock } = await import('@/ui/components/StudyPlanPanels');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

// ---------------------------------------------------------------------------
// The life, the clock, and the screen over them
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onDay = (d: SchoolDate, hour: number): Instant => instantFromZoned({ ...d, hour }, ZONE);

/** TEST SETUP: the work done each midnight, every open piece's every part prepared. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const ADA = { homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' };
const life = (seed: string, extra: Record<string, unknown> = {}) => working(createSave(1, seed, { ...newLifeConfig(), ...ADA, ...extra }));
/** TEST SETUP: need found, a family of no means, as creation's Scraping family has it (until 2026-10-14 no creation-screen life could). */
const ON_AID = { family: undefined, wealth: 'scraping' };
const LONDON = { homeRegionId: 'uk-eng-london' };
const reload = (sim: Simulation) => working(loadSave(deserialise(serialise(sim.universe)) as never));
/** A life kept in memory at a moment, and a copy of it to play on. */
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => working(loadSave(JSON.parse(snap) as never));
function once<T>(play: () => T): () => T {
  let done: { value: T } | undefined;
  return () => (done ??= { value: play() }).value;
}

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tend = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** TEST SETUP: down with the flu until the day's out, which is what lets Call In Sick through. */
const flu = (sim: Simulation, days = 1) => { healthOf(sim.player).fluUntil = sim.now + days * MS_DAY; };

const plusDays = (d: SchoolDate, days: number): SchoolDate => { const t = new Date(Date.UTC(d.year, d.month - 1, d.day + days)); return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }; };
function classDays(term: number): SchoolDate[] {
  const p = classPeriod(term);
  const out: SchoolDate[] = [];
  for (let d = p.from; keyOf(d) <= keyOf(p.to); d = plusDays(d, 1)) if (isClassDay(term, d)) out.push(d);
  return out;
}
const workDue = (sim: Simulation, d: SchoolDate, except: string) => (courseworkOf(sim, sim.player)?.assignments ?? [])
  .some((a) => a.course !== except && ((a.status === 'open' && a.dueOn === keyOf(d)) || (a.status === 'revising' && a.revision?.dueOn === keyOf(d))));
const expectedAt = (sim: Simulation, from: Instant, to: Instant) => sim.universe.scheduled
  .some((i) => i.status === 'pending' && i.requiresPlayer && i.kind !== CLASSES_KIND && i.at < to && i.at + (i.durationMinutes ?? 0) * 60_000 > from);
/**
 * Asleep from one in the morning to eleven, by the command a player uses, on as many of each course's meetings in a
 * term as asked: the day's classes at nine slept through. Days with another course's work due, or anything else to be
 * at, are passed over, so only the course asked for falls short on its meetings.
 */
function sleepThrough(sim: Simulation, term: number, plan: Record<string, number>, offset = 0): Record<string, string[]> {
  const missed: Record<string, string[]> = Object.fromEntries(Object.keys(plan).map((c) => [c, []]));
  for (const d of classDays(term)) {
    const code = Object.keys(plan).find((c) => missed[c]!.length < plan[c]! && coursesOn(d, offset).some((x) => x.code === c));
    if (!code) continue;
    tend(sim, onDay(d, 1));
    if (workDue(sim, d, code) || expectedAt(sim, onDay(d, 1), onDay(d, 11))) continue;
    sim.must({ kind: 'life.sleep', payload: { hours: 10 } });
    missed[code]!.push(keyOf(d));
  }
  return missed;
}

const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);
const recordsOf = (sim: Simulation, term: number) => Object.entries(sim.player.school!.courses ?? {}).filter(([, r]) => r.term === term);
const dueItems = (sim: Simulation, key: string) => pendingOf(sim, INCOMPLETE_DUE_KIND).filter((i) => i.payload.key === key).sort((a, b) => a.at - b.at).map((i) => [i.at, i.payload.remind === true]);

/** A screen as the player has it: its markup, and its text with the tags taken out; the Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, screen: FunctionComponent, states: unknown[] = [], tab = 'standing'): { html: string; text: string } {
  h.sim = sim;
  h.clicks = [];
  h.states = [...states];
  h.tab = tab;
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  h.states = [];
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);
/** A Stat tile's figure and its note, by its label. */
const stat = (html: string, label: string) => {
  const m = html.match(new RegExp(`<span class="stat-label">${label}</span><span class="stat-value[^"]*">([^<]*)</span>(?:<span class="stat-note">([^<]*)</span>)?`));
  return m ? { value: m[1], note: m[2] } : undefined;
};

// ---------------------------------------------------------------------------
// The lives, played once and copied for each test
// ---------------------------------------------------------------------------

const ACTING_I = '0:DRAM 103a/b';
/** Acting I's three meetings a week (Monday to Wednesday), first to last, in the first fall. */
const actingDays = () => classDays(0).filter((d) => coursesOn(d).some((c) => c.code === 'DRAM 103a/b'));

/**
 * The first fall, played to its evaluation at five on Friday 11 December 2026: laid up the first week (TEST SETUP: an
 * injury off work to Saturday 5 September), then called in sick (TEST SETUP: the flu) on eight of Acting I's meetings
 * after it, every other one, as tests/evidence-g26-school.test.ts plays it. Acting I is Incomplete there, a session
 * owed by Sunday 10 January 2027 at five; and the student then withdraws, at ten on Monday 14 December.
 */
const fallWithdrawn = once(() => {
  const sim = life('b09-fall');
  tend(sim, at(2026, 8, 30, 20));
  // TEST SETUP: laid up until the morning after the first week's last class day.
  healthOf(sim.player).injury = { kind: 'concussion', at: sim.now, until: at(2026, 9, 5, 8), offWorkUntil: at(2026, 9, 5, 8) } as never;
  tend(sim, at(2026, 9, 5, 8));
  let called = 0;
  for (const [i, d] of actingDays().entries()) {
    if (keyOf(d) < '2026-09-05' || i % 2 === 1 || called >= 8) continue;
    tend(sim, onDay(d, 8));
    flu(sim);
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    called += 1;
  }
  tend(sim, at(2026, 12, 14, 10));
  const incomplete = freeze(sim);
  sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
  return { incomplete, withdrawn: freeze(sim) };
});

const ON_CAMERA = 'DRAM 463a/b';
const ON_CAMERA_KEY = `5:${ON_CAMERA}`;
/**
 * The last spring, Spring Term 2029: On-Camera Acting Technique (DRAM 463a/b) meets on Thursdays, fourteen times from
 * 18 January to 26 April. Called in sick (TEST SETUP: the flu) on its first four, it's met at ten of fourteen, under
 * three quarters (ten and a half), with only excused absences: an Incomplete at the evaluation at five on Friday 27
 * April, a session owed (eleven meetings pass it, a week's one meeting a session), due thirty days on, Sunday 27 May at
 * five. Commencement is Monday 21 May at ten, the Monday a week before Memorial Day.
 */
const lastSpring = once(() => {
  const sim = life('b09-last');
  tend(sim, at(2029, 1, 14, 0));
  const thursdays = classDays(5).filter((d) => coursesOn(d).some((c) => c.code === ON_CAMERA)).slice(0, 4);
  for (const d of thursdays) {
    tend(sim, onDay(d, 8));
    flu(sim);
    sim.must({ kind: 'school.call_in_sick', payload: {} });
  }
  tend(sim, at(2029, 4, 27, 18));
  const afterEval = freeze(sim);
  tend(sim, at(2029, 5, 21, 14));
  return { thursdays: thursdays.map(keyOf), afterEval, commencement: freeze(sim) };
});

const TABLE_WORK = 'DRAM 163b';
/**
 * The first spring with Text Analysis I (DRAM 163b, Thursdays, thirteen meetings) slept through four times, so it's
 * failed at the evaluation at five on Friday 23 April 2027; then the repeat asked for and granted, the life played on
 * to the last spring's evaluation of Friday 26 April 2030, with Taming The Cyclops (DRAM 473b) slept through four times:
 * eight terms enrolled, the additional term on offer as the ninth.
 */
const firstSpring = once(() => {
  const sim = life('b09-repeat');
  tend(sim, at(2027, 1, 11, 0));
  const missed = sleepThrough(sim, 1, { [TABLE_WORK]: 4 })[TABLE_WORK]!;
  tend(sim, at(2027, 4, 23, 18));
  return { missed, afterSpring1: freeze(sim) };
});
const eightEnrolled = once(() => {
  const sim = thaw(firstSpring().afterSpring1);
  const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} });
  tend(sim, asked.decideAt + MS_HOUR);
  // Fall Term 2029, the seventh term enrolled, billed past the six the tuition scholarship supports, and paid.
  tend(sim, at(2029, 8, 27, 10));
  sim.must({ kind: 'school.pay_balance', payload: {} });
  tend(sim, at(2030, 1, 13, 0));
  const missed = sleepThrough(sim, 7, { 'DRAM 473b': 4 }, 2)['DRAM 473b']!;
  tend(sim, at(2030, 4, 26, 18));
  return { missed, lastEval: freeze(sim) };
});

const MOVEMENT_III = 'DRAM 373a';
/**
 * Born in London, on an F-1: the third year's fall with Movement Invention III (DRAM 373a, Wednesdays) slept through
 * four times, failed at its evaluation; the last spring passed, and its evaluation at five on Friday 27 April 2029 offers
 * thirty days, to 27 May, to ask for a repeat or an additional term.
 */
const l3 = once(() => {
  const sim = life('b09-l3', LONDON);
  const i20 = f1Of(sim.player)!.expiresAt!;
  tend(sim, at(2028, 9, 1, 0));
  const missed = sleepThrough(sim, 4, { [MOVEMENT_III]: 4 })[MOVEMENT_III]!;
  tend(sim, at(2029, 4, 27, 18));
  return { i20, missed, lastEval: freeze(sim) };
});

/** TEST SETUP: a second course of a term, passed at its evaluation, put on the record as failed, which no play does after the evaluation. */
function secondFail(sim: Simulation, term: number, except: string): string {
  const [key, r] = recordsOf(sim, term).find(([, x]) => x.result === 'pass' && x.code !== except)!;
  r.result = 'fail';
  r.why = 'TEST SETUP';
  return key;
}

// ---------------------------------------------------------------------------
// school.make_up
// ---------------------------------------------------------------------------

describe('school.make_up', () => {
  it('PLAYER JOURNEY: an Incomplete in the last spring keeps them from Commencement; Make Up A Session, pressed on the Standing tab the day after, passes it and confers the degree, once, through a save; a twin left alone has the degree withheld at the month’s end', () => {
    let sim = thaw(lastSpring().commencement);
    const school = () => sim.player.school!;
    const record = () => school().courses![ON_CAMERA_KEY]!;
    expect(lastSpring().thursdays).toEqual(['2029-01-18', '2029-01-25', '2029-02-01', '2029-02-08']);
    // Ten of fourteen, four excused: under three quarters on its meetings, but none missed unexcused.
    expect(record()).toMatchObject({ name: 'On-Camera Acting Technique', result: 'incomplete', meetings: 14, excused: 4, attended: 10, owed: 1, madeUp: 0, dueBy: at(2029, 5, 27, 17) });
    const open = degreeShortfall(school());
    expect(open.failed).toEqual([]);
    expect(open.incomplete.map((r) => r.code)).toEqual([ON_CAMERA]);
    // Three years on, still in New Haven, where every new life begins (`atSchool`) and nothing in play moves it: the
    // make-up's New Haven refusal is reached by no play.
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    expect(newLifeFrom({ ...ADA, startLocationId: 'uk-eng-london' }).startLocationId).toBe('us-ct-newhaven');
    // Commencement passed them by: the degree waits.
    expect(school().awaitingDegree).toBe(true);
    expect(titled(sim, 'Not At Commencement').map((n) => n.body)).toEqual(['With On-Camera Acting Technique still incomplete, you take no part in Commencement. The degree is yours once it’s made up in time.']);
    expect(titled(sim, 'Your MFA Is Conferred')).toHaveLength(0);
    const twin = thaw(freeze(sim));

    // Tuesday 22 May at ten: the line and its button on the Standing tab, pressed.
    tend(sim, at(2029, 5, 22, 10));
    const shown = drawn(sim, SchoolWorkspace);
    expect(shown.html).toContain('<strong>On-Camera Acting Technique</strong>, Incomplete: 1 of 1 make-up sessions left, by May 27, 2029.');
    const make = drew('school.make_up');
    expect(make.map((c) => [c.label, c.disabled])).toEqual([['Make Up A Session', false]]);
    make[0]!.onClick!();
    expect(h.toasts.at(-1)).toBe('On-Camera Acting Technique: passed.');
    // Two hours, and the course passed: nothing stands between them and the degree, which is conferred at noon.
    expect(sim.now).toBe(at(2029, 5, 22, 12));
    expect(record()).toMatchObject({ result: 'pass', why: 'made up after an Incomplete', madeUp: 1 });
    expect(pendingOf(sim, INCOMPLETE_DUE_KIND)).toHaveLength(0);
    expect(school().standing).toBe('graduated');
    expect(school().endedAt).toBe(at(2029, 5, 22, 12));
    expect(school().awaitingDegree).toBeUndefined();
    expect(titled(sim, 'Your MFA Is Conferred').map((n) => n.body)).toEqual(['Your last Incomplete made up, the faculty confer the MFA in Acting, class of 2029, without the ceremony.']);

    sim = reload(sim);
    tend(sim, at(2029, 5, 28, 12));
    expect(school().standing).toBe('graduated');
    expect(titled(sim, 'Your MFA Is Conferred')).toHaveLength(1);
    expect(titled(sim, 'Permanent Incomplete: On-Camera Acting Technique')).toHaveLength(0);
    expect(titled(sim, 'The Degree Isn’t Recommended')).toHaveLength(0);

    // The twin, not made up: waiting an hour before the month's end, withheld at it.
    tend(twin, at(2029, 5, 27, 16));
    expect(twin.player.school!.courses![ON_CAMERA_KEY]!.result).toBe('incomplete');
    expect(twin.player.school!.awaitingDegree).toBe(true);
    tend(twin, at(2029, 5, 27, 18));
    expect(twin.player.school!.courses![ON_CAMERA_KEY]!.result).toBe('permanent');
    expect(twin.player.school!.standing).toBe('withheld');
    expect(twin.player.school!.endedAt).toBe(at(2029, 5, 27, 17));
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(twin, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual(['On-Camera Acting Technique wasn’t made up in its month, and the degree needs every course passed. The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.']);
    expect(titled(twin, 'Your MFA Is Conferred')).toHaveLength(0);
  }, 60_000);

  it('a student who has withdrawn with an Incomplete open is refused a make-up session in the School’s words, before its month runs out and after, and the Standing tab lists the Incomplete with no Make Up A Session', () => {
    const sim = thaw(fallWithdrawn().withdrawn);
    const acting = () => sim.player.school!.courses![ACTING_I]!;
    expect(sim.player.school!.standing).toBe('withdrawn');
    // Played: 39 meetings, 11 excused, 28 attended; three quarters is 29.25, so 30 pass it, and a session makes up a
    // week's three: one session, due thirty days from the evaluation at five on 11 December.
    expect(acting()).toMatchObject({ result: 'incomplete', meetings: 39, excused: 11, attended: 28, owed: 1, madeUp: 0, dueBy: at(2027, 1, 10, 17) });
    // Three fellow courses met on the days called in, each at under three quarters with only excused absences.
    const incompletes = recordsOf(sim, 0).filter(([, r]) => r.result === 'incomplete');
    expect(incompletes.map(([, r]) => r.code).sort()).toEqual(['DRAM 103a/b', 'DRAM 123a/b', 'DRAM 50a', 'DRAM 873a/b']);
    // The deadline went off the calendar with the School (`setStanding`), so the record stays Incomplete.
    expect(dueItems(sim, ACTING_I)).toEqual([]);
    const after = thaw(freeze(sim));
    // Tuesday 15 December at ten, inside the month: nothing else on. Until later on 2026-10-13 the session was taken: two
    // hours, and Acting I passed for a student who has left the School.
    tend(sim, at(2026, 12, 15, 10));
    const before = sim.now;
    expect(sim.execute({ kind: 'school.make_up', payload: { key: ACTING_I } }).error).toBe('You’re not at school.');
    expect(sim.now).toBe(before);
    expect(acting()).toMatchObject({ result: 'incomplete', madeUp: 0 });
    // The Standing tab still lists each Incomplete, and offers no Make Up A Session, as Ask For A Month More, Call In Sick
    // and Take A Shift offer nothing once you’ve left: until 2026-10-13 it stayed, grayed with “You’re not at school.”, for good
    // (found by that day’s final checks).
    const tab = drawn(sim, SchoolWorkspace);
    expect(tab.html).toContain('<strong>Acting I</strong>, Incomplete: 1 of 1 make-up sessions left, by January 10, 2027.');
    expect(drew('school.make_up')).toHaveLength(0);
    expect(tab.text).not.toContain('You’re not at school.');
    // Past the month: still the School's words, not the month's.
    tend(after, at(2027, 1, 11, 12));
    expect(after.execute({ kind: 'school.make_up', payload: { key: ACTING_I } }).error).toBe('You’re not at school.');
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.extend_incomplete
// ---------------------------------------------------------------------------

describe('school.extend_incomplete', () => {
  it('PLAYER JOURNEY: after Commencement, Ask For A Month More moves the last spring’s Incomplete to 26 June: the old date passes with the degree still waiting, a session made up in the month more confers it, and a twin left alone lapses at the new date and has the degree withheld', () => {
    const sim = thaw(lastSpring().commencement);
    const school = () => sim.player.school!;
    tend(sim, at(2029, 5, 22, 10));
    const before = drawn(sim, SchoolWorkspace);
    expect(before.html).toContain('<strong>On-Camera Acting Technique</strong>, Incomplete: 1 of 1 make-up sessions left, by May 27, 2029.');
    const ask = drew('school.extend_incomplete');
    expect(ask.map((c) => c.label)).toEqual(['Ask For A Month More']);
    ask[0]!.onClick!();
    // Thirty days on from 27 May at five: 26 June at five; the week's reminder on 19 June.
    expect(h.toasts.at(-1)).toBe('Extended to June 26, 2029.');
    expect(school().courses![ON_CAMERA_KEY]).toMatchObject({ result: 'incomplete', extended: true, dueBy: at(2029, 6, 26, 17) });
    expect(dueItems(sim, ON_CAMERA_KEY)).toEqual([[at(2029, 6, 19, 17), true], [at(2029, 6, 26, 17), false]]);
    const twin = thaw(freeze(sim));

    // The old date passes: still Incomplete, the degree still waiting, nothing withheld.
    tend(sim, at(2029, 5, 27, 18));
    expect(school().courses![ON_CAMERA_KEY]!.result).toBe('incomplete');
    expect(school().awaitingDegree).toBe(true);
    expect(school().standing).not.toBe('withheld');
    expect(titled(sim, 'Permanent Incomplete: On-Camera Acting Technique')).toHaveLength(0);
    // Made up on Wednesday 20 June at ten, within the month more: the degree conferred.
    tend(sim, at(2029, 6, 20, 10));
    expect(sim.must<{ madeUp: number; owed: number; passed: boolean }>({ kind: 'school.make_up', payload: { key: ON_CAMERA_KEY } })).toEqual({ madeUp: 1, owed: 1, passed: true });
    expect(school().standing).toBe('graduated');
    expect(titled(sim, 'Your MFA Is Conferred').map((n) => n.body)).toEqual(['Your last Incomplete made up, the faculty confer the MFA in Acting, class of 2029, without the ceremony.']);

    // The twin: reminded again a week before the new date (the first reminder came on 20 May, before the extension),
    // Incomplete an hour before it, then Permanent and withheld.
    tend(twin, at(2029, 6, 19, 16));
    expect(titled(twin, 'A Week Left: On-Camera Acting Technique').map((n) => n.body)).toEqual(['One make-up session still to do, by May 27, 2029. Press Make Up A Session on the Standing tab.']);
    tend(twin, at(2029, 6, 19, 18));
    expect(titled(twin, 'A Week Left: On-Camera Acting Technique').map((n) => n.body)).toEqual(['One make-up session still to do, by May 27, 2029. Press Make Up A Session on the Standing tab.', 'One make-up session still to do, by June 26, 2029. Press Make Up A Session on the Standing tab.']);
    tend(twin, at(2029, 6, 26, 16));
    expect(twin.player.school!.courses![ON_CAMERA_KEY]!.result).toBe('incomplete');
    expect(twin.player.school!.standing).not.toBe('withheld');
    tend(twin, at(2029, 6, 26, 18));
    expect(twin.player.school!.courses![ON_CAMERA_KEY]).toMatchObject({ result: 'permanent', why: 'an Incomplete not made up in its month' });
    expect(twin.player.school!.standing).toBe('withheld');
    expect(twin.player.school!.endedAt).toBe(at(2029, 6, 26, 17));
    expect(titled(twin, 'The Degree Isn’t Recommended')).toHaveLength(1);
    expect(titled(twin, 'Your MFA Is Conferred')).toHaveLength(0);
  }, 60_000);

  it('DEFECT: a Permanent Incomplete that withholds a waiting degree doesn’t tell the student to ask to repeat the year, which the withholding leaves them no way to ask', () => {
    const sim = thaw(lastSpring().commencement);
    tend(sim, at(2029, 5, 27, 18));
    expect(sim.player.school!.standing).toBe('withheld');
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You’re not at school.');
    expect(sim.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('You’re not at school.');
    expect(titled(sim, 'Permanent Incomplete: On-Camera Acting Technique').map((n) => n.body)).toEqual(['The month to make it up ran out, so On-Camera Acting Technique carries no credit, and the degree can’t be completed without it.']);
  }, 60_000);

  it('DEFECT: a student who has withdrawn with an Incomplete open is refused a month more in the School’s words, before its month runs out and after; nothing goes back on the calendar, and the Standing tab offers none', () => {
    const sim = thaw(fallWithdrawn().withdrawn);
    const acting = () => sim.player.school!.courses![ACTING_I]!;
    const after = thaw(freeze(sim));
    tend(sim, at(2026, 12, 15, 10));
    expect(sim.execute({ kind: 'school.extend_incomplete', payload: { key: ACTING_I } }).error).toBe('You’re not at school.');
    expect(acting().extended).toBeUndefined();
    expect(acting().dueBy).toBe(at(2027, 1, 10, 17));
    expect(dueItems(sim, ACTING_I)).toEqual([]);
    drawn(sim, SchoolWorkspace);
    expect(drew('school.extend_incomplete')).toHaveLength(0);
    tend(after, at(2027, 1, 11, 12));
    expect(after.execute({ kind: 'school.extend_incomplete', payload: { key: ACTING_I } }).error).toBe('You’re not at school.');
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.request_repeat
// ---------------------------------------------------------------------------

describe('school.request_repeat', () => {
  it('PLAYER JOURNEY: beside an additional term it’s refused in each of its words, asked for and then granted, and the panel offers no repeat; a twin with neither is let ask', () => {
    // The twin: nothing asked, the repeat open.
    const free = thaw(l3().lastEval);
    expect(l3().missed).toHaveLength(4);
    expect(free.player.school!.courses![`4:${MOVEMENT_III}`]).toMatchObject({ result: 'fail' });
    expect(free.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} }).decideAt).toBe(at(2029, 5, 4, 18));

    const sim = thaw(l3().lastEval);
    const school = () => sim.player.school!;
    // Five working days from Friday 27 April at six: Friday 4 May at six.
    expect(sim.must<{ decideAt: Instant; term: number }>({ kind: 'school.request_extra_term', payload: {} })).toEqual({ decideAt: at(2029, 5, 4, 18), term: 6 });
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('Your request for an additional term is with the chair and the dean, decided by May 4, 2029.');
    // TEST SETUP: Ask To Repeat The Year… pressed, as the screen's choice would be: it isn't drawn to be pressed.
    let panel = drawn(sim, RepeatPanel, ['request']);
    expect(panel.text).toContain('An additional term, Fall Term 2029, asked April 27, 2029 to retake Movement Invention III: with the chair and the dean, decided by May 4, 2029.');
    expect(panel.text).not.toContain('Ask To Repeat The Year…');
    expect(drew('school.request_repeat')).toHaveLength(0);

    tend(sim, at(2029, 5, 4, 19));
    expect(school().extra).toEqual({ term: 6, courses: [{ code: MOVEMENT_III, academic: 4, name: 'Movement Invention III' }] });
    expect(school().repeatBy).toBeUndefined();
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('Your additional term is Fall Term 2029.');
    expect(school().repeat).toBeUndefined();
    expect(school().offset ?? 0).toBe(0);
    expect(school().classOf).toBe(2029);
    expect(pendingOf(sim, REPEAT_DECIDE_KIND)).toHaveLength(0);
    panel = drawn(sim, RepeatPanel, ['request']);
    expect(panel.text).toContain('In Fall Term 2029 you take only Movement Invention III; passed, the degree is conferred at Yale’s December conferral.');
    expect(panel.text).not.toContain('Ask To Repeat The Year…');
    expect(drew('school.request_repeat')).toHaveLength(0);
  }, 60_000);

  it('the decision’s refusal of a first year, reached only from a fixture: a disqualification the faculty never judged, refused in its words, the class of 2029 kept and the fall on as before; a twin without it granted', () => {
    const sim = thaw(firstSpring().afterSpring1);
    expect(firstSpring().missed).toHaveLength(4);
    const school = sim.player.school!;
    expect(school.courses![`1:${TABLE_WORK}`]).toMatchObject({ result: 'fail', meetings: 13, attended: 9 });
    expect(school.reviews ?? []).toEqual([]);
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} });
    // Five working days from Friday 23 April at six: Friday 30 April at six.
    expect(asked.decideAt).toBe(at(2027, 4, 30, 18));
    const twin = thaw(freeze(sim));
    // TEST SETUP: a second Fail in Spring Term 2027 put on the record between the asking and the deciding. No play does
    // it: a course is failed only at its term's evaluation, where the faculty's review judges a disqualification at
    // once, and no evaluation falls between a repeat's asking and its deciding.
    secondFail(sim, 1, TABLE_WORK);
    tend(sim, at(2027, 4, 30, 19));
    const why = '2 courses failed in Spring Term 2027: the Bulletin disqualifies a student with 2 Failures in a term.';
    expect(school.repeat).toMatchObject({ status: 'refused', why, decidedAt: at(2027, 4, 30, 18) });
    expect(titled(sim, 'Your Repeat Isn’t Granted').map((n) => n.body)).toEqual([`The chair and the dean refused it. ${why}`]);
    expect(school.offset ?? 0).toBe(0);
    expect(school.classOf).toBe(2029);
    expect(school.repeatedYears).toBeUndefined();
    expect(school.standing).not.toBe('withheld');
    expect(pendingOf(sim, TERM_KIND).map((i) => [i.payload.term, i.at])).toEqual([[2, at(2027, 8, 23, 9)]]);
    expect(titled(sim, 'You’ll Repeat The Year')).toHaveLength(0);
    tend(twin, at(2027, 4, 30, 19));
    expect(twin.player.school!.repeat!.status).toBe('granted');
    expect(twin.player.school!).toMatchObject({ offset: 2, classOf: 2030 });
  }, 60_000);

  it('the decision’s refusal of a last year, reached only from a fixture: the degree withheld in its words, the I-20 as it was; a twin without it granted', () => {
    const sim = thaw(l3().lastEval);
    const school = sim.player.school!;
    expect(school.repeatBy).toBe(at(2029, 5, 27, 17));
    sim.must({ kind: 'school.request_repeat', payload: {} });
    const twin = thaw(freeze(sim));
    // TEST SETUP: a second Fail in Fall Term 2028 put on the record after the last year's evaluation, which no play does.
    secondFail(sim, 4, MOVEMENT_III);
    tend(sim, at(2029, 5, 4, 19));
    const why = '2 courses failed in Fall Term 2028: the Bulletin disqualifies a student with 2 Failures in a term.';
    expect(school.repeat).toMatchObject({ status: 'refused', why });
    expect(school.standing).toBe('withheld');
    expect(school.endedAt).toBe(at(2029, 5, 4, 18));
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual([`The chair and the dean refused your request to repeat the year. ${why} The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.`]);
    expect(titled(sim, 'Your Repeat Isn’t Granted')).toHaveLength(0);
    expect(school.offset ?? 0).toBe(0);
    expect(f1Of(sim.player)!.expiresAt).toBe(l3().i20);
    expect(pendingOf(sim, TERM_KIND)).toHaveLength(0);
    tend(twin, at(2029, 5, 4, 19));
    expect(twin.player.school!.repeat!.status).toBe('granted');
    expect(twin.player.school!.standing).not.toBe('withheld');
    expect(new Date(f1Of(twin.player)!.expiresAt!).toISOString()).toBe('2030-07-30T12:00:00.000Z');
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.request_extra_term
// ---------------------------------------------------------------------------

/** TEST SETUP: a ninth term on the enrolled record, which no play puts there before an additional term (see the describe). */
const ninthTerm = (sim: Simulation) => { const school = sim.player.school!; school.enrolled = [...enrolledTerms(school), Math.max(...enrolledTerms(school)) + 1]; };

describe('school.request_extra_term', () => {
  // No play reaches nine enrolled terms at a last year's evaluation: one repeat is the most the nine allow, which makes
  // eight; a leave's term isn't enrolled; and an additional term, the ninth, can't be asked twice.

  it('past the Bulletin’s nine, reached only from a fixture: refused at the asking in its words, the panel offering none, and the degree withheld at the thirty days’ end; a twin without it is let ask, as the ninth', () => {
    const sim = thaw(eightEnrolled().lastEval);
    expect(eightEnrolled().missed).toHaveLength(4);
    const school = sim.player.school!;
    expect(enrolledTerms(school)).toHaveLength(8);
    expect(school.courses!['7:DRAM 473b']).toMatchObject({ academic: 5, result: 'fail' });
    expect(school.repeatBy).toBe(at(2030, 5, 26, 17));
    const twin = thaw(freeze(sim));
    ninthTerm(sim);
    expect(sim.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('It would make 10 semesters, past the nine the Bulletin allows.');
    expect(school.extraRequest).toBeUndefined();
    expect(pendingOf(sim, EXTRA_DECIDE_KIND)).toHaveLength(0);
    const panel = drawn(sim, RepeatPanel);
    expect(panel.text).toContain('Your last year wasn’t passed. Ask by May 26, 2030, or the degree is withheld.');
    expect(panel.text).not.toContain('Or an additional term');
    expect(drew('school.request_extra_term')).toHaveLength(0);
    tend(sim, at(2030, 5, 26, 18));
    expect(school.standing).toBe('withheld');
    // Until 2026-10-13 it said “You didn’t ask to repeat the year in its thirty days”, to a student who could ask for
    // neither, and this test held it.
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual(['The thirty days to finish the degree ended with nothing asked for, and it needs every course passed. The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.']);
    expect(twin.must<{ term: number }>({ kind: 'school.request_extra_term', payload: {} }).term).toBe(9);
  }, 60_000);

  it('PLAYER JOURNEY: having repeated a year, eight terms enrolled, offered an additional term alone and asking nothing, the degree is withheld at the thirty days’ end in words for what was open, not a repeat never offered', () => {
    const sim = thaw(eightEnrolled().lastEval);
    const school = sim.player.school!;
    expect(enrolledTerms(school)).toHaveLength(8);
    // A year already repeated: repeating the last would make ten semesters, so it’s refused and the term alone offered.
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('Repeating would make 10 semesters, past the nine the Bulletin allows for the degree.');
    const offer = titled(sim, 'Your Degree Isn’t Complete').map((n) => n.body);
    expect(offer).toHaveLength(1);
    expect(offer[0]).toContain('you can ask for an additional term');
    expect(offer[0]).not.toContain('repeat the year');
    tend(sim, at(2030, 5, 26, 18));
    expect(school.standing).toBe('withheld');
    // Until 2026-10-13: “You didn’t ask to repeat the year in its thirty days”, a repeat this student was never offered.
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual(['The thirty days to finish the degree ended with nothing asked for, and it needs every course passed. The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.']);
  }, 60_000);

  it('past the Bulletin’s nine at the decision, reached only from a fixture: refused in its words and the degree withheld, no term on the calendar; a twin without it granted', () => {
    const sim = thaw(eightEnrolled().lastEval);
    const school = sim.player.school!;
    // Five working days from Friday 26 April 2030 at six: Friday 3 May at six.
    expect(sim.must<{ decideAt: Instant; term: number }>({ kind: 'school.request_extra_term', payload: {} })).toEqual({ decideAt: at(2030, 5, 3, 18), term: 9 });
    const twin = thaw(freeze(sim));
    ninthTerm(sim);
    tend(sim, at(2030, 5, 3, 19));
    const why = 'It would make 10 semesters, past the nine the Bulletin allows.';
    expect(school.extraRequest).toMatchObject({ status: 'refused', why });
    expect(school.extra).toBeUndefined();
    expect(school.standing).toBe('withheld');
    expect(school.endedAt).toBe(at(2030, 5, 3, 18));
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual([`The chair and the dean refused an additional term. ${why} The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.`]);
    expect(titled(sim, 'An Additional Term Granted')).toHaveLength(0);
    expect(pendingOf(sim, TERM_KIND)).toHaveLength(0);
    tend(twin, at(2030, 5, 3, 19));
    expect(twin.player.school!.extra).toMatchObject({ term: 9 });
    expect(pendingOf(twin, TERM_KIND).map((i) => i.payload.term)).toEqual([9]);
  }, 60_000);

  it('a disqualification the faculty never judged, reached only from a fixture: refused at the asking in its words, and at the decision the degree withheld; a twin without it granted', () => {
    // At the asking.
    const asking = thaw(l3().lastEval);
    // TEST SETUP: a second Fail in Fall Term 2028 put on the record after the last year's evaluation, which no play does:
    // the faculty's review judges every disqualification at the evaluation that makes it.
    secondFail(asking, 4, MOVEMENT_III);
    expect(asking.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('The faculty’s disqualification stands against it.');
    expect(asking.player.school!.extraRequest).toBeUndefined();
    // At the decision: asked, then the same fixture before it's decided.
    const sim = thaw(l3().lastEval);
    sim.must({ kind: 'school.request_extra_term', payload: {} });
    const twin = thaw(freeze(sim));
    secondFail(sim, 4, MOVEMENT_III);
    tend(sim, at(2029, 5, 4, 19));
    const why = '2 courses failed in Fall Term 2028: the Bulletin disqualifies a student with 2 Failures in a term.';
    expect(sim.player.school!.extraRequest).toMatchObject({ status: 'refused', why });
    expect(sim.player.school!.standing).toBe('withheld');
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual([`The chair and the dean refused an additional term. ${why} The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.`]);
    expect(f1Of(sim.player)!.expiresAt).toBe(l3().i20);
    tend(twin, at(2029, 5, 4, 19));
    expect(twin.player.school!.extraRequest!.status).toBe('granted');
    expect(new Date(f1Of(twin.player)!.expiresAt!).toISOString()).toBe('2030-07-30T12:00:00.000Z');
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.request_conversion
// ---------------------------------------------------------------------------

const RATE = 23_00;
const grantsOf = (sim: Simulation) => sim.universe.transactions.filter((t) => /^Grant-in-aid: \d+ work-study hours converted/.test(t.memo));
/** The first assigned Saturday, 5 September 2026 at ten, six hours: called in sick (TEST SETUP: the flu) two hours before. */
function sickSaturday(sim: Simulation) {
  tend(sim, at(2026, 9, 1, 8));
  const sat = pendingOf(sim, SHIFT_KIND).filter((i) => i.payload.elective === false).sort((a, b) => a.at - b.at)[0]!;
  expect(sat.at).toBe(at(2026, 9, 5, 10));
  expect(Number(sat.payload.hours)).toBe(6);
  tend(sim, sat.at - 2 * MS_HOUR);
  flu(sim);
  sim.must({ kind: 'school.call_in_sick', payload: {} });
  tend(sim, sat.at + MS_HOUR);
  expect(sim.universe.scheduled.find((i) => i.id === sat.id)!.status).toBe('missed');
  expect(sim.player.school!.excusedHours).toEqual({ 0: 6 });
}
/** The first-year aid student with nothing excused, played to Monday 3 May 2027: the spring's twenty-four Saturdays worked. */
const c0 = once(() => {
  const sim = life('b09-c0', ON_AID);
  tend(sim, at(2027, 5, 3, 12));
  return freeze(sim);
});

describe('school.request_conversion', () => {
  // Until 2026-10-14 this was 'a life made as the creation screen makes one, whatever its draft said of the family, has no
  // need found', its draft asking for Scraping and `newLifeFrom` making it wealthy all the same. Since then the draft's
  // family is kept, and the life with no need is the one creation leaves at Wealthy.
  it('PLAYER JOURNEY: a life made with the family creation leaves chosen, Wealthy, has no need found: an assigned Saturday called in sick, the drawn button grayed and the command refused in its words, and nothing paid in January, where its twin with need is paid for the same six hours', () => {
    // The draft leaves the family as creation chose it.
    const made = newLifeFrom({ ...ADA });
    expect(made.family).toBe('wealthy');
    expect(made.wealth).toBe('wealthy');
    const sim = working(createSave(1, 'b09-new', made));
    expect(sim.player.family).toBe('wealthy');
    sickSaturday(sim);
    const words = 'Converting hours to grant aid is only for students on financial aid, and the aid office found no need for you.';
    const panel = drawn(sim, WorkLimitsBlock);
    expect(stat(panel.html, 'Hours Excused This Year')?.value).toBe('6');
    expect(stat(panel.html, 'Convertible To Grant Aid')).toEqual({ value: 'Not On Aid', note: undefined });
    expect(drew('school.request_conversion').map((c) => [c.label, c.disabled, c.title])).toEqual([['Ask For Conversion To Grant Aid', true, words]]);
    // TEST SETUP: the twin, the same life at the same moment with need found, as a family below Wealthy has it.
    const twin = thaw(freeze(sim));
    twin.player.family = undefined;
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe(words);
    expect(pendingOf(sim, CONVERT_KIND)).toHaveLength(0);
    expect(twin.must<{ at: Instant; hours: number }>({ kind: 'school.request_conversion', payload: {} })).toEqual({ at: at(2027, 1, 15, 12), hours: 6 });
    tend(sim, at(2027, 1, 15, 13));
    tend(twin, at(2027, 1, 15, 13));
    expect(grantsOf(sim)).toHaveLength(0);
    expect(sim.player.school!.convertedHours).toBeUndefined();
    expect(titled(sim, 'Hours Converted To Grant Aid')).toHaveLength(0);
    // Six hours at $23.00, $138.00, for the twin alone.
    expect(grantsOf(twin).map((t) => t.postings.map((p) => p.amount).sort((a, b) => a - b))).toEqual([[-6 * RATE, 6 * RATE]]);
    expect(twin.player.school!.convertedHours).toEqual({ 0: 6 });
  }, 60_000);

  it('the hours the command returns in May are the hours May’s processing pays: six never assigned, 150 less the 144 booked, $138.00 into the account and onto the year’s scholarship', () => {
    const sim = thaw(c0());
    const school = sim.player.school!;
    expect(school.workStudy.assignedBooked).toBe(144);
    expect(stat(drawn(sim, WorkLimitsBlock).html, 'Convertible To Grant Aid')).toEqual({ value: '6 hours', note: '$138.00 at the rate; 0 converted' });
    const asked = sim.execute<{ at: Instant; hours: number }>({ kind: 'school.request_conversion', payload: {} });
    expect(asked.error).toBeUndefined();
    expect(asked.value).toEqual({ at: at(2027, 5, 15, 12), hours: 6 });
    tend(sim, at(2027, 5, 15, 11));
    const before = earningsOf(sim.player).years[2027]!.scholarship ?? 0;
    tend(sim, at(2027, 5, 15, 13));
    const grants = grantsOf(sim);
    expect(grants.map((t) => t.memo)).toEqual(['Grant-in-aid: 6 work-study hours converted, David Geffen School of Drama at Yale University']);
    expect(grants[0]!.postings.find((p) => p.accountId === sim.player.primaryAccountId)?.amount).toBe(6 * RATE);
    expect((earningsOf(sim.player).years[2027]!.scholarship ?? 0) - before).toBe(6 * RATE);
    expect(school.convertedHours).toEqual({ 0: 6 });
  }, 60_000);

  it('a processing that finds nothing says so, reached only from a fixture: no grant, no scholarship, and the request done; the twin without it is paid', () => {
    const sim = thaw(c0());
    expect(sim.must<{ hours: number }>({ kind: 'school.request_conversion', payload: {} }).hours).toBe(6);
    const twin = thaw(freeze(sim));
    // TEST SETUP: the six hours recorded as converted before May's processing. No play does it: a request is refused
    // unless the processing it books counts hours, one request is in at a time, and a leave that begins cancels it.
    sim.player.school!.convertedHours = { 0: 6 };
    tend(sim, at(2027, 5, 15, 13));
    tend(twin, at(2027, 5, 15, 13));
    expect(titled(sim, 'No Hours To Convert').map((n) => n.body)).toEqual(['The aid office processed your request and found no work-study hours to convert: none missed ill or hurt, and none never assigned.']);
    expect(grantsOf(sim)).toHaveLength(0);
    expect(titled(sim, 'Hours Converted To Grant Aid')).toHaveLength(0);
    expect(sim.universe.scheduled.filter((i) => i.kind === CONVERT_KIND && i.payload.personId === sim.player.id).map((i) => [i.status, i.at])).toEqual([['done', at(2027, 5, 15, 12)]]);
    expect(grantsOf(twin)).toHaveLength(1);
    expect(titled(twin, 'No Hours To Convert')).toHaveLength(0);
  }, 60_000);
});
