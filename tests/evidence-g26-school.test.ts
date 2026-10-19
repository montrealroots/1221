/**
 * Evidence for six school rows the review of 2026-10-13 left partial (verification group g26-school): an Incomplete's
 * month asked for again, a year asked to be repeated, the asking called off, an additional term, the Yale account paid,
 * and work-study hours converted to grant aid. Each command is run as its screen runs it (`sim.execute`, or the drawn
 * button's own onClick, which runs it), every scheduled consequence by the clock (`sim.advanceTo`: an evaluation, a
 * decision, a deadline, a processing, a term's classes), and each consequence is read where the row says it's read.
 * The figures are worked here from the rules' own numbers and written as literals (thirty days to an Incomplete and
 * thirty more, five working days to a decision, $23.00 an hour, 14% withheld, $125 a month to $375), never asked of the
 * helper the engine computes them with. Run on 2026-10-13, three of these failed, each on a defect the review hadn't
 * named; they were kept asserting what’s right, said where the engine was wrong, and pass since it was fixed that day.
 *
 * - `school.extend_incomplete`: Ask For A Month More, drawn on the Standing tab and pressed, moves Acting I's month
 *   from 10 January to 9 February once and goes from its line; the week's reminder comes on 2 February and not on 3
 *   January, the Permanent Incomplete at the new date and not the old, once each through a save, while the course's
 *   three fellow Incompletes, not extended, lapse on the old one; a twin not extended lapses on 10 January. Refused in
 *   its words a second time, for a course passed or never taken, and once Permanent. "Its month has run out." was
 *   reached by no play, the deadline’s own item making the course Permanent at the instant the month runs out, and went
 *   on 2026-10-13.
 * - `school.request_repeat`: Ask, drawn on Finishing The Degree and pressed after a first spring failed by sleeping
 *   through a course, decided by the clock through a save: two terms back, the class of 2030, the first year's courses
 *   met again against program term 0, the first attempt kept, the retake passed and the degree reading the pass. A
 *   student kept on academic warning by the faculty's review, the year to be repeated, is granted it, and the next
 *   evaluation doesn't dismiss them on the same Fails (until 2026-10-13 it did; the fix came that day). Refused in its
 *   words: before the year's end, with a leave asked for, once the next year has begun, with every course passed, a
 *   year a second time, and past nine semesters with eight enrolled. Two defects until 2026-10-13, both fixed that day:
 *   a second year’s repeat that took the degree to ten semesters was granted, and a repeat asked for while an additional
 *   term was asked for was granted with it. A third until later that day, found by the guide audit: the asking and the
 *   grant’s notice counted the year’s two alone, and said nothing of the two terms a first year’s repeat bills past six.
 * - `school.cancel_repeat`: Call Off The Request…, then Call It Off on the drawn panel: the chair's decision never
 *   comes, and the degree is withheld at the thirty days' end; refused when nothing is asked; a twin left alone is
 *   granted, with the next term on the calendar and the I-20 a year longer; one called off and asked again is decided.
 * - `school.request_extra_term`: Ask For An Additional Term, drawn and pressed after the last year's evaluation,
 *   granted through a save, the I-20 a year longer and the term on the calendar; its classes played: only the retake
 *   meets, counted against its own program term, passed at the evaluation, and the degree conferred in December. A
 *   defect until 2026-10-13, fixed that day: each of the additional term’s class days was held twice. Refused in its
 *   words; the ninth semester allowed.
 * - `school.pay_balance`: a scholarship returned on a leave, refused in its words (nothing owed, nothing asked, more than
 *   owed, a bank short of it, which moves nothing), paid from the drawn panel before the return, which lifts the hold
 *   and leaves the return term's scholarship whole, where a twin left unpaid has its return term's scholarship pay the
 *   account first (from 2026-10-16: until then the hold, held into the return, stopped registration until it was paid
 *   from the panel); a repeated year's terms past six paid from the panel, and a diploma held at Commencement for the
 *   last term's bill conferred when it's paid.
 * - `school.request_conversion`: refused in January and in the spring with only hours never assigned in prospect, and
 *   in June, the stat showing none; in May the hours never assigned asked on the drawn button and paid at May's
 *   processing, to the hour asked; an assigned shift called in sick asked in the fall and paid in January into the
 *   account, on the year's scholarship and on the return filed, against a twin that didn't ask; a nonresident's
 *   with 14% withheld; refused with no aid and on leave, and a leave begun with a request in cancels it.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty), an actor at Yale in New Haven from Monday 24 August 2026,
 * played by the clock. The rows about the I-20 and a nonresident's withholding are played by the same life born in
 * London, which a New York birthplace doesn't reach. A course is failed as a player fails one, by sleeping through its
 * meetings (`life.sleep` at one in the morning for ten hours, on days nothing else is due or expected), as
 * tests/guide-examples-school.test.ts fails one. The seeds are arbitrary, none picked for what it draws: g26-incomplete,
 * g26-repeat, g26-l3, g26-paid, g26-c0 to g26-c3.
 *
 * TEST SETUP, said again where it's done:
 * - the coursework prepared each midnight and the student rested, fed and awake each time the clock moves, as
 *   tests/guide-examples-school.test.ts plays one, so nothing but a row's own steps falls short at an evaluation;
 * - an injury that keeps them off work for the first week, and the flu for a day called in sick and for a medical
 *   leave's physician's recommendation: illness and injury come by the draw;
 * - for need-based aid, a life with no family money behind it (family unset, wealth 'scraping'), as
 *   tests/work-limits.test.ts makes one: `newLifeConfig` gives a new life a wealthy family, with no need found, unless
 *   the player chooses another (from 2026-10-14; until then every new life's was wealthy);
 * - the bank emptied, as tests/guide-examples-school.test.ts empties it, and money put back, as savings would be;
 * - a screen's two-step choice pressed (Ask To Repeat The Year…, Call Off The Request…), which a static render can't
 *   press its way into: the panel drawn with its choice made, as tests/defects-g8-2.test.ts draws it.
 * A life is copied in memory (`loadSave` of a JSON copy) for a twin or a later step, never written anywhere; a save
 * and a load are `serialise` and `deserialise`.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned, type Instant } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { PREP_DIMS } from '@/engine/content/coursework';
import type { SchoolDate } from '@/engine/content/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { CLASSES_KIND, CONFERRAL_KIND, CONVERT_KIND, SHIFT_KIND, TERM_KIND, classPeriod, coursesOn, isClassDay, keyOf } from '@/engine/systems/school';
import { INCOMPLETE_DUE_KIND } from '@/engine/systems/courserecord';
import { ACCOUNT_DUE_KIND, REPEAT_DECIDE_KIND, REPEAT_DUE_KIND, accountOwed, enrolledTerms } from '@/engine/systems/leave';
import { healthOf } from '@/engine/systems/health';
import { f1Of } from '@/engine/systems/permission';
import { earningsOf } from '@/engine/systems/earnings';
import { returnsOf } from '@/engine/systems/taxreturn';
import { overdraftHeadroom } from '@/engine/systems/lending';

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

const { RepeatPanel, YaleAccountPanel, WorkLimitsBlock, LeavePanel } = await import('@/ui/components/StudyPlanPanels');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

// ---------------------------------------------------------------------------
// The life, the clock, and the screen over them
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onDay = (d: SchoolDate, hour: number): Instant => instantFromZoned({ ...d, hour }, ZONE);
const dated = (t: Instant) => formatDate(t, ZONE);
const usd = (sim: Simulation, cents: number) => formatMoney(cents, saveCurrency(sim.universe));

/** TEST SETUP: the work done each midnight, every open piece's every part prepared. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const life = (seed: string, extra: Record<string, unknown> = {}) => working(createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra }));
/** TEST SETUP: need found, a family of no means (`newLifeConfig`'s family is wealthy, and finds none). */
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
/** TEST SETUP: down with the flu until the day's out, which is what lets Call In Sick through, and a physician recommend a leave. */
const flu = (sim: Simulation, days = 1) => { healthOf(sim.player).fluUntil = sim.now + days * MS_DAY; };
/** TEST SETUP: money in the bank, as savings would be. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
/** TEST SETUP: the bank emptied, as tests/guide-examples-school.test.ts empties it: every balance and the overdraft's room spent elsewhere, the card's limit gone. */
const drain = (sim: Simulation) => {
  const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && a.category !== 'yale-account');
  for (const a of mine) if (a.kind === 'credit_card') a.creditLimit = 0;
  for (const a of mine) if (a.balance > 0 && a.kind !== 'credit_card') sim.post({ memo: 'TEST SETUP: spent elsewhere', category: 'other', postings: [{ accountId: sim.nominalAccount('expense', 'Other').id, amount: a.balance }, { accountId: a.id, amount: -a.balance }] });
  const current = sim.player.primaryAccountId ? sim.universe.accounts[sim.player.primaryAccountId] : undefined;
  const room = overdraftHeadroom(sim, sim.player);
  if (current && room > 0) sim.post({ memo: 'TEST SETUP: spent elsewhere', category: 'other', postings: [{ accountId: sim.nominalAccount('expense', 'Other').id, amount: room }, { accountId: current.id, amount: -room }] });
};
const bankHeld = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((n, a) => n + a.balance, 0);

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
 * after it, every other one. Acting I is Incomplete there, with three fellow courses that met on the days called in.
 */
const incomplete = once(() => {
  const sim = life('g26-incomplete');
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
  tend(sim, at(2026, 12, 11, 18));
  return freeze(sim);
});

/** The first spring's eve: Monday 11 January 2027, before its first class. */
const repeatBase = once(() => {
  const sim = life('g26-repeat');
  tend(sim, at(2027, 1, 11, 0));
  return freeze(sim);
});

const TABLE_WORK = 'DRAM 163b';
/**
 * The first spring with Text Analysis I (DRAM 163b, Thursdays, thirteen meetings) slept through four times, so it's
 * failed at the evaluation at five on Friday 23 April 2027; the repeat asked for, granted, and the life played on, kept
 * at each step a test starts from: a year's spring, the year's repeat, and the terms past six, paid.
 */
const r1 = once(() => {
  const sim = thaw(repeatBase());
  const missed = sleepThrough(sim, 1, { [TABLE_WORK]: 4 })[TABLE_WORK]!;
  tend(sim, at(2027, 4, 23, 18));
  const afterSpring1 = freeze(sim);
  const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} });
  tend(sim, asked.decideAt + MS_HOUR);
  tend(sim, at(2028, 1, 10, 0));
  const jan2028 = freeze(sim);
  tend(sim, at(2028, 4, 28, 18));
  const afterSpring3 = freeze(sim);
  tend(sim, at(2029, 1, 14, 0));
  const jan2029 = freeze(sim);
  // Fall Term 2029 begins at nine on Monday 27 August: the seventh term enrolled, billed.
  tend(sim, at(2029, 8, 27, 10));
  const termSixBilled = freeze(sim);
  sim.must({ kind: 'school.pay_balance', payload: {} });
  tend(sim, at(2030, 1, 13, 0));
  const jan2030 = freeze(sim);
  return { missed, afterSpring1, jan2028, afterSpring3, jan2029, termSixBilled, jan2030 };
});

/** The same first spring with Text Analysis I (Thursdays) and DRAM 403a/b (Fridays) slept through four times each. */
const keptOnWarning = once(() => {
  const sim = thaw(repeatBase());
  const missed = sleepThrough(sim, 1, { [TABLE_WORK]: 4, 'DRAM 403a/b': 4 });
  tend(sim, at(2027, 4, 23, 18));
  return { missed, afterSpring1: freeze(sim) };
});

const MOVEMENT_III = 'DRAM 373a';
/**
 * Born in London, on an F-1 whose I-20 runs to 30 July 2029: the third year's fall with Movement Invention III (DRAM
 * 373a, Wednesdays, thirteen meetings) slept through four times, failed at its evaluation; the last spring passed, and
 * its evaluation at five on Friday 27 April 2029 offers thirty days, to 27 May, to ask for a repeat or an additional term.
 */
const l3 = once(() => {
  const sim = life('g26-l3', LONDON);
  const i20 = f1Of(sim.player)!.expiresAt!;
  tend(sim, at(2028, 9, 1, 0));
  const missed = sleepThrough(sim, 4, { [MOVEMENT_III]: 4 })[MOVEMENT_III]!;
  tend(sim, at(2029, 4, 27, 18));
  return { i20, missed, lastEval: freeze(sim) };
});

/** From the last evaluation: the additional term asked for, granted, begun, its bill paid, and played to the year's end. */
const extraPlayed = once(() => {
  const sim = thaw(l3().lastEval);
  const asked = sim.must<{ decideAt: Instant; term: number }>({ kind: 'school.request_extra_term', payload: {} });
  tend(sim, asked.decideAt + MS_HOUR);
  tend(sim, at(2029, 8, 27, 10));
  const billed = accountOwed(sim, sim.player);
  sim.must({ kind: 'school.pay_balance', payload: {} });
  tend(sim, at(2029, 12, 31, 12));
  return { sim, asked, billed };
});

// ---------------------------------------------------------------------------
// school.extend_incomplete
// ---------------------------------------------------------------------------

/** The make-up sessions' lines on the Standing tab, by course name, in the order drawn. */
const incompleteRows = (html: string) => [...html.matchAll(/<strong>([^<]+)<\/strong>, Incomplete:/g)].map((m) => m[1]!);
const rowOf = (html: string, name: string) => html.match(new RegExp(`<span class="small"><strong>${name}</strong>, Incomplete:.*?</div>`))?.[0] ?? '';
const dueItems = (sim: Simulation, key: string) => pendingOf(sim, INCOMPLETE_DUE_KIND).filter((i) => i.payload.key === key).sort((a, b) => a.at - b.at).map((i) => [i.at, i.payload.remind === true]);

describe('school.extend_incomplete', () => {
  it('PLAYER JOURNEY: Ask For A Month More, pressed on the Standing tab, moves Acting I’s month to 9 February once; the reminder and the Permanent Incomplete come on the new date and not the old, through a save, once each', () => {
    let sim = thaw(incomplete());
    const acting = () => sim.player.school!.courses![ACTING_I]!;
    // Played: 39 meetings, 11 excused, 28 attended. Three quarters is 29.25, so 30 meetings pass it: two short, and a
    // session makes up a week's three, so one session, due thirty days from the evaluation at five on 11 December.
    expect(acting()).toMatchObject({ result: 'incomplete', meetings: 39, excused: 11, attended: 28, owed: 1, madeUp: 0, dueBy: at(2027, 1, 10, 17) });
    expect(titled(sim, 'Incomplete: Acting I')).toHaveLength(1);
    expect(dueItems(sim, ACTING_I)).toEqual([[at(2027, 1, 3, 17), true], [at(2027, 1, 10, 17), false]]);

    const before = drawn(sim, SchoolWorkspace);
    expect(before.html).toContain('<strong>Acting I</strong>, Incomplete: 1 of 1 make-up session left, by January 10, 2027.');
    const rows = incompleteRows(before.html);
    expect(rows).toHaveLength(4);
    expect(rows).toContain('Acting I');
    const asks = drew('school.extend_incomplete');
    expect(asks.map((a) => a.label)).toEqual(rows.map(() => 'Ask For A Month More'));
    expect(before.text).not.toContain('Locked');
    asks[rows.indexOf('Acting I')]!.onClick!();
    expect(h.toasts.at(-1)).toBe('Extended to February 9, 2027.');
    expect(acting()).toMatchObject({ result: 'incomplete', extended: true, dueBy: at(2027, 2, 9, 17) });
    // The reminder and the deadline moved with it: the old ones gone, a week before the new date and the date itself.
    expect(dueItems(sim, ACTING_I)).toEqual([[at(2027, 2, 2, 17), true], [at(2027, 2, 9, 17), false]]);

    const after = drawn(sim, SchoolWorkspace);
    expect(after.html).toContain('<strong>Acting I</strong>, Incomplete: 1 of 1 make-up session left, by February 9, 2027.');
    expect(drew('school.extend_incomplete')).toHaveLength(3);
    expect(rowOf(after.html, 'Acting I')).toContain('Make Up A Session');
    expect(rowOf(after.html, 'Acting I')).not.toContain('Ask For A Month More');
    expect(sim.execute({ kind: 'school.extend_incomplete', payload: { key: ACTING_I } }).error).toBe('You’ve already had your one extra month.');
    expect(acting().dueBy).toBe(at(2027, 2, 9, 17));

    sim = reload(sim);
    expect(acting()).toMatchObject({ extended: true, dueBy: at(2027, 2, 9, 17) });
    const others = rows.filter((n) => n !== 'Acting I');
    // The old reminder's day: Acting I's isn't said; its three fellows', not extended, are.
    tend(sim, at(2027, 1, 3, 18));
    expect(titled(sim, 'A Week Left: Acting I')).toHaveLength(0);
    for (const name of others) expect(titled(sim, `A Week Left: ${name}`)).toHaveLength(1);
    // The old deadline: Acting I still Incomplete; its fellows Permanent.
    tend(sim, at(2027, 1, 10, 18));
    expect(acting().result).toBe('incomplete');
    expect(titled(sim, 'Permanent Incomplete: Acting I')).toHaveLength(0);
    for (const name of others) expect(titled(sim, `Permanent Incomplete: ${name}`)).toHaveLength(1);
    // A week before the new date, and not an hour sooner.
    tend(sim, at(2027, 2, 2, 16));
    expect(titled(sim, 'A Week Left: Acting I')).toHaveLength(0);
    tend(sim, at(2027, 2, 2, 18));
    expect(titled(sim, 'A Week Left: Acting I').map((n) => n.body)).toEqual(['You still have one make-up session to do, by February 9, 2027. Press Make Up A Session on the Standing And Craft tab.']);
    // The new date: Incomplete an hour before, Permanent an hour after.
    tend(sim, at(2027, 2, 9, 16));
    expect(acting().result).toBe('incomplete');
    tend(sim, at(2027, 2, 9, 18));
    expect(acting()).toMatchObject({ result: 'permanent', why: 'an Incomplete not made up in time' });
    expect(titled(sim, 'Permanent Incomplete: Acting I').map((n) => n.body)).toEqual(['The time to make it up ran out, so Acting I carries no credit, and the degree can’t be completed without it. At the year’s end, you can ask to repeat the year on the Standing And Craft tab.']);

    // Nothing again through a save; the Standing tab reads it as the degree's shortfall.
    sim = reload(sim);
    tend(sim, at(2027, 2, 12, 12));
    expect(titled(sim, 'A Week Left: Acting I')).toHaveLength(1);
    expect(titled(sim, 'Permanent Incomplete: Acting I')).toHaveLength(1);
    const lapsed = drawn(sim, SchoolWorkspace);
    expect(lapsed.html).toContain('<strong>Acting I</strong>, Permanent Incomplete: an Incomplete not made up in time.');
    expect(lapsed.html).not.toContain('<strong>Acting I</strong>, Incomplete:');
    expect(lapsed.text).toMatch(/The degree still needs [^.]*Acting I[^.]*\./);
    expect(drew('school.extend_incomplete')).toHaveLength(0);
    expect(sim.execute({ kind: 'school.extend_incomplete', payload: { key: ACTING_I } }).error).toBe('There’s no Incomplete in that course.');
    expect(sim.execute({ kind: 'school.make_up', payload: { key: ACTING_I } }).error).toBe('There’s no Incomplete in that course to make up.');
  }, 120_000);

  it('without the month more, the same Incomplete is reminded on 3 January and Permanent on 10 January: the extension is what moved it', () => {
    const sim = thaw(incomplete());
    const acting = () => sim.player.school!.courses![ACTING_I]!;
    tend(sim, at(2027, 1, 3, 16));
    expect(titled(sim, 'A Week Left: Acting I')).toHaveLength(0);
    tend(sim, at(2027, 1, 3, 18));
    expect(titled(sim, 'A Week Left: Acting I').map((n) => n.body)).toEqual(['You still have one make-up session to do, by January 10, 2027. Press Make Up A Session on the Standing And Craft tab. If you need longer, press Ask For A Month More.']);
    tend(sim, at(2027, 1, 10, 16));
    expect(acting().result).toBe('incomplete');
    tend(sim, at(2027, 1, 10, 18));
    expect(acting().result).toBe('permanent');
    expect(titled(sim, 'Permanent Incomplete: Acting I')).toHaveLength(1);
    // Past it, there's no Incomplete to ask a month for.
    expect(sim.execute({ kind: 'school.extend_incomplete', payload: { key: ACTING_I } }).error).toBe('There’s no Incomplete in that course.');
  }, 120_000);

  // A test stood here on 2026-10-15 that marked this save's first year repeated by hand, a repeat with none of its terms,
  // which no play makes, to protect the `repeatedYears` clause in `repeatOpen` (systems/courserecord.ts). The clause was
  // removed later that day, when the count of semesters came to settle every repeated year itself, and the test with it.
  // A Permanent Incomplete in a repeated year, offered nothing, is played in tests/scope-school.test.ts.

  it('is refused in its own words for a course passed and one never taken, and changes nothing', () => {
    const sim = thaw(incomplete());
    const passed = recordsOf(sim, 0).find(([, r]) => r.result === 'pass')!;
    expect(sim.execute({ kind: 'school.extend_incomplete', payload: { key: passed[0] } }).error).toBe('There’s no Incomplete in that course.');
    expect(sim.player.school!.courses![passed[0]]).toMatchObject({ result: 'pass' });
    expect(sim.player.school!.courses![passed[0]]!.dueBy).toBeUndefined();
    // A second year's course, not yet reached.
    expect(sim.execute({ kind: 'school.extend_incomplete', payload: { key: '2:DRAM 203a/b' } }).error).toBe('There’s no Incomplete in that course.');
    expect(sim.player.school!.courses!['2:DRAM 203a/b']).toBeUndefined();
    expect(sim.player.school!.courses![ACTING_I]!.dueBy).toBe(at(2027, 1, 10, 17));
  }, 120_000);
});

// ---------------------------------------------------------------------------
// school.request_repeat
// ---------------------------------------------------------------------------

/** The first year's fall courses, as the timetable (`timetable(1, 'fall')`) and the lab DRAM 50a make it. */
const YEAR_ONE_FALL = ['DRAM 103a/b', 'DRAM 113a/b', 'DRAM 123a/b', 'DRAM 133a/b', 'DRAM 143a/b', 'DRAM 153a', 'DRAM 403a/b', 'DRAM 50a', 'DRAM 873a/b'];

describe('school.request_repeat', () => {
  it('PLAYER JOURNEY: a first spring failed by sleeping through a course, Ask pressed on Finishing The Degree, decided in five working days through a save: two terms back, the class of 2030, once', () => {
    let sim = thaw(r1().afterSpring1);
    const school = () => sim.player.school!;
    expect(r1().missed).toHaveLength(4);
    // Thirteen Thursdays, four slept through: nine of thirteen is under three quarters.
    expect(school().courses![`1:${TABLE_WORK}`]).toMatchObject({ result: 'fail', meetings: 13, attended: 9, excused: 0 });
    expect(recordsOf(sim, 1).filter(([, r]) => r.result !== 'pass').map(([k]) => k)).toEqual([`1:${TABLE_WORK}`]);
    expect(school().standing).toBe('concern');
    expect(school().classOf).toBe(2029);

    // The panel offers it; Ask To Repeat The Year… opens the choice, which Ask then asks.
    const first = drawn(sim, RepeatPanel);
    expect(first.text).toContain('Finishing The Degree');
    expect(first.text).toContain('Ask To Repeat The Year…');
    expect(drew('school.request_repeat')).toHaveLength(0);
    // TEST SETUP: Ask To Repeat The Year… pressed, as the screen's choice would be.
    const asking = drawn(sim, RepeatPanel, ['request']);
    expect(asking.text).toContain('Asking puts it to the chair and the dean, decided in five working days. Granted, you take year 1’s courses again from Fall Term 2027, and what you did the first time stays on your record; the degree reads the pass.');
    // The first year again takes the degree to eight terms, two enrolled, two again and four to come; the seventh and
    // eighth, Fall Term 2029 and Spring Term 2030, are billed past six at 2029–30’s tuition, 2026–27’s $40,750.00 grown
    // 3.22% a year three times, half a year’s each: $22,407.28 twice. Until 2026-10-13 the year’s two alone were
    // counted, six terms, and nothing was said of billing; found by the guide audit of that day.
    expect(asking.text).toContain('the degree reads the pass. The tuition scholarship supports six terms, and with the year again the degree takes 8: 2 would be billed to your Yale account, about $44,814.56 in tuition alone.');
    const ask = drew('school.request_repeat');
    expect(ask.map((a) => a.label)).toEqual(['Ask']);
    ask[0]!.onClick!();
    // Five working days from Friday 23 April at six: Friday 30 April at six.
    expect(h.toasts.at(-1)).toBe('Asked: decided by April 30, 2027.');
    expect(school().repeat).toMatchObject({ status: 'pending', decideAt: at(2027, 4, 30, 18), year: 1, terms: [0, 1] });
    expect(pendingOf(sim, REPEAT_DECIDE_KIND).map((i) => i.at)).toEqual([at(2027, 4, 30, 18)]);
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('Your request is with the chair and the dean, decided by April 30, 2027.');

    sim = reload(sim);
    tend(sim, at(2027, 4, 30, 17));
    expect(school().repeat!.status).toBe('pending');
    expect(school().offset ?? 0).toBe(0);
    tend(sim, at(2027, 4, 30, 19));
    expect(school().repeat).toMatchObject({ status: 'granted', decidedAt: at(2027, 4, 30, 18) });
    expect(school()).toMatchObject({ offset: 2, classOf: 2030, repeats: 1, repeatedYears: [1] });
    // The same eight terms, two of them billed (until 2026-10-13 the notice counted six and said nothing of it).
    expect(titled(sim, 'You’ll Repeat The Year').map((n) => n.body)).toEqual(['The chair and the dean granted it: from Fall Term 2027 you take year 1’s courses again, and what you did the first time stays on your record. The tuition scholarship supports six terms, and with the year again the degree takes eight terms: two will be billed to your Yale account. The Bulletin sets no rule for repeating a course; the decision is the game’s.']);
    // Not a last year's: the next term was on the calendar already, and nothing is added to it.
    expect(pendingOf(sim, TERM_KIND).map((i) => i.payload.term)).toEqual([2]);
    sim = reload(sim);
    tend(sim, at(2027, 5, 10));
    expect(titled(sim, 'You’ll Repeat The Year')).toHaveLength(1);
    expect(school()).toMatchObject({ offset: 2, classOf: 2030, repeats: 1, repeatedYears: [1] });
  }, 120_000);

  it('PLAYER JOURNEY, granted: the first year’s courses meet again in Fall Term 2027 against program term 0, with the class of 2030; the first attempt is kept, the retake passed, and the degree reads the pass', () => {
    const fall = thaw(r1().afterSpring3);
    const school = fall.player.school!;
    expect(titled(fall, 'The Class Of 2030')).toHaveLength(1);
    // Fall Term 2027, calendar term 2: the first year's fall courses, each its own record against program term 0, met
    // and passed; no second year's course among them.
    const again = recordsOf(fall, 2);
    expect(again.map(([, r]) => r.code).sort()).toEqual([...YEAR_ONE_FALL].sort());
    for (const [, r] of again) expect(r).toMatchObject({ academic: 0, result: 'pass' });
    for (const [, r] of again) expect(r.meetings).toBeGreaterThan(0);
    // Their first attempts in Fall Term 2026 stay.
    for (const code of YEAR_ONE_FALL) expect(school.courses![`0:${code}`]).toBeDefined();
    // Spring Term 2028, calendar term 3: Text Analysis I met again against program term 1 and passed, the Fail of
    // Spring Term 2027 kept beside it.
    expect(school.courses![`1:${TABLE_WORK}`]).toMatchObject({ academic: 1, result: 'fail' });
    expect(school.courses![`3:${TABLE_WORK}`]).toMatchObject({ academic: 1, result: 'pass' });
    expect(school.courses![`3:${TABLE_WORK}`]!.meetings).toBeGreaterThan(10);
    // The degree reads the pass: the Standing tab has nothing standing between them and it.
    const { text } = drawn(fall, SchoolWorkspace);
    expect(text).toContain('Only the terms to come stand between you and the degree.');
    expect(text).not.toContain('The degree needs');
    expect(fall.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You passed every course this year, so there’s nothing to repeat it for.');
  }, 120_000);

  it('PLAYER JOURNEY: kept on academic warning by the faculty’s review, the year to be repeated, the repeat is granted, and the next fall’s evaluation doesn’t dismiss them on the same Fails', () => {
    const sim = thaw(keptOnWarning().afterSpring1);
    const school = sim.player.school!;
    const fails = recordsOf(sim, 1).filter(([, r]) => r.result === 'fail').map(([, r]) => r.code);
    expect(fails).toEqual(expect.arrayContaining([TABLE_WORK, 'DRAM 403a/b']));
    // Two Fails in a term is the Bulletin's disqualification: the faculty's first review keeps them, on warning.
    expect(school.reviews).toHaveLength(1);
    expect(school.reviews![0]).toMatchObject({ term: 1, outcome: 'warning' });
    expect(school.standing).toBe('warning');
    expect(titled(sim, 'A Faculty Review: On Warning').map((n) => n.body)).toEqual([`${fails.length} courses failed in Spring Term 2027: the Bulletin disqualifies a student with 2 Failures in a term. The faculty reviewed it and kept you on academic warning, to repeat the year: ask to repeat it at the year’s end, on the Standing And Craft tab.`]);
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} });
    tend(sim, asked.decideAt + MS_HOUR);
    // Granted, on the Fails the review judged (until 2026-10-13 refused on them, and the warning's remedy never had).
    expect(school.repeat!.status).toBe('granted');
    expect(school.offset).toBe(2);
    expect(titled(sim, 'Your Repeat Isn’t Granted')).toHaveLength(0);
    // The repeated fall's evaluation at five on Friday 10 December 2027: judged on the term, not the old Fails again.
    tend(sim, at(2027, 12, 10, 18));
    expect(school.reviews).toHaveLength(1);
    expect(school.standing).toBe('good');
    expect(school.history.at(-1)).toMatchObject({ term: 2, standing: 'good' });
  }, 120_000);

  it('is refused in its own words: before the year’s end, with a leave asked for, once the next year has begun, a year a second time, and past nine semesters', () => {
    // Before the first spring's evaluation.
    const early = thaw(repeatBase());
    expect(early.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You can ask to repeat a year only at its end, after the spring’s term review.');
    // A medical leave asked for after the spring's evaluation (TEST SETUP: the flu, for the physician's recommendation).
    const leaving = thaw(r1().afterSpring1);
    flu(leaving, 4);
    leaving.must({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    expect(leaving.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('Not while a leave is under way.');
    expect(leaving.player.school!.repeat).toBeUndefined();
    // Not asked by the next year's first morning: at eight on Monday 23 August the year has begun; at ten, its term has.
    const late = thaw(r1().afterSpring1);
    tend(late, at(2027, 8, 23, 8));
    expect(late.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('The next year has begun.');
    tend(late, at(2027, 8, 23, 10));
    expect(late.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You can ask to repeat a year only at its end, after the spring’s term review.');
    expect(late.player.school!.offset ?? 0).toBe(0);
    // The repeated spring, Text Analysis I slept through again: year 1 isn't repeated twice.
    const again = thaw(r1().jan2028);
    expect(sleepThrough(again, 3, { [TABLE_WORK]: 4 }, 2)[TABLE_WORK]).toHaveLength(4);
    tend(again, at(2028, 4, 28, 18));
    expect(again.player.school!.courses![`3:${TABLE_WORK}`]).toMatchObject({ academic: 1, result: 'fail' });
    expect(again.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('In the game, the faculty don’t approve repeating year 1 a second time.');
    // The last spring, eight terms enrolled, a course slept through: a repeat would make ten.
    const last = thaw(r1().jan2030);
    expect(enrolledTerms(last.player.school!)).toHaveLength(8);
    expect(sleepThrough(last, 7, { 'DRAM 473b': 4 }, 2)['DRAM 473b']).toHaveLength(4);
    tend(last, at(2030, 4, 26, 18));
    expect(last.player.school!.courses!['7:DRAM 473b']).toMatchObject({ academic: 5, result: 'fail' });
    expect(last.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('Repeating would make 10 semesters, past the nine the Bulletin allows for the degree.');
    // So the evaluation offered the additional term alone, and the panel offers no repeat. It doesn't say why: with the
    // first year's repeat on the record, the panel shows a refusal only where no repeat was ever asked (`!r`).
    expect(titled(last, 'Your Degree Isn’t Complete').map((n) => n.body)[0]).toMatch(/you can ask on the Standing And Craft tab for an additional term, Spring Term 2031, to retake it\./);
    const panel = drawn(last, RepeatPanel);
    expect(panel.text).toContain('Your last year wasn’t passed. Ask by May 26, 2030, or the degree is withheld.');
    expect(panel.text).toContain('Or an additional term, Spring Term 2031, to retake Taming The Cyclops alone');
    expect(panel.text).not.toContain('Ask To Repeat The Year…');
    expect(drew('school.request_repeat')).toHaveLength(0);
    expect(last.player.school!.repeat).toMatchObject({ year: 1, status: 'granted' });
  }, 120_000);

  it('refuses a second year’s repeat that would take the degree to ten semesters, past the Bulletin’s nine', () => {
    // A first year repeated, and year 2's spring failed in DRAM 233a/b (Mondays): six terms enrolled, year 2's two terms
    // again and year 3's two after them make ten. The Bulletin wants the degree within nine (p.194).
    const sim = thaw(r1().jan2029);
    expect(sleepThrough(sim, 5, { 'DRAM 233a/b': 4 }, 2)['DRAM 233a/b']).toHaveLength(4);
    tend(sim, at(2029, 4, 27, 18));
    const school = sim.player.school!;
    expect(school.courses!['5:DRAM 233a/b']).toMatchObject({ academic: 3, result: 'fail' });
    expect(enrolledTerms(school)).toHaveLength(6);
    expect(school.offset).toBe(2);
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toMatch(/Repeating would make 10 semesters, past the nine/);
  }, 120_000);

  it('refuses a repeat while an additional term is asked for, as an additional term is refused while a repeat is', () => {
    const sim = thaw(l3().lastEval);
    sim.must({ kind: 'school.request_extra_term', payload: {} });
    expect(sim.player.school!.extraRequest!.status).toBe('pending');
    // The other way round it's refused (`extraRefusal`); this way both were granted when played on 2026-10-13: the
    // additional term and the repeat, two terms back with the class of 2030, for the one course, and the retake passed in
    // the fall while the student sat the third year's spring again.
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toMatch(/additional term/);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// school.cancel_repeat
// ---------------------------------------------------------------------------

describe('school.cancel_repeat', () => {
  it('PLAYER JOURNEY: Call Off The Request…, then Call It Off on a last year’s repeat: no decision comes, through a save, and the degree is withheld at the thirty days’ end', () => {
    let sim = thaw(l3().lastEval);
    const school = () => sim.player.school!;
    expect(l3().missed).toHaveLength(4);
    expect(school().courses![`4:${MOVEMENT_III}`]).toMatchObject({ result: 'fail', meetings: 13, attended: 9 });
    expect(school().repeatBy).toBe(at(2029, 5, 27, 17));
    sim.must({ kind: 'school.request_repeat', payload: {} });
    expect(school().repeat).toMatchObject({ status: 'pending', decideAt: at(2029, 5, 4, 18), year: 3 });
    // The first press asks; nothing calls it off yet.
    const first = drawn(sim, RepeatPanel);
    expect(first.text).toContain('Year 3, asked April 27, 2029: with the chair and the dean, decided by May 4, 2029, for Movement Invention III.');
    expect(first.text).toContain('Call Off The Request…');
    expect(drew('school.cancel_repeat')).toHaveLength(0);
    const warning = 'If you call it off and don’t ask again by May 27, 2029, the faculty won’t recommend the degree.';
    expect(first.text).not.toContain(warning);
    expect(sim.execute({ kind: 'school.cancel_repeat', payload: {} }).error).toBe(`${warning} Confirm to go ahead.`);
    expect(school().repeat!.status).toBe('pending');
    // TEST SETUP: Call Off The Request… pressed, as the screen's choice would be.
    const asked = drawn(sim, RepeatPanel, ['cancel']);
    expect(asked.text).toContain(warning);
    expect(asked.text).toContain('Keep It');
    const callOff = drew('school.cancel_repeat');
    expect(callOff.map((c) => c.label)).toEqual(['Call It Off']);
    callOff[0]!.onClick!();
    expect(h.toasts.at(-1)).toBe('Called off.');
    expect(school().repeat!.status).toBe('canceled');
    // The chair's decision is off the calendar; the thirty days' end stays on it.
    expect(pendingOf(sim, REPEAT_DECIDE_KIND)).toHaveLength(0);
    expect(pendingOf(sim, REPEAT_DUE_KIND).map((i) => i.at)).toEqual([at(2029, 5, 27, 17)]);
    expect(sim.execute({ kind: 'school.cancel_repeat', payload: { confirm: true } }).error).toBe('You haven’t asked to repeat the year.');

    sim = reload(sim);
    // The decision's day passes with nothing decided.
    tend(sim, at(2029, 5, 4, 19));
    expect(school().repeat!.status).toBe('canceled');
    expect(school().repeat!.decidedAt).toBeUndefined();
    expect(school().offset ?? 0).toBe(0);
    expect(school().classOf).toBe(2029);
    expect(titled(sim, 'You’ll Repeat The Year')).toHaveLength(0);
    expect(titled(sim, 'Your Repeat Isn’t Granted')).toHaveLength(0);
    expect(f1Of(sim.player)!.expiresAt).toBe(l3().i20);
    // The thirty days' end: in good standing an hour before, the degree withheld at it.
    tend(sim, at(2029, 5, 27, 16));
    expect(school().standing).toBe('good');
    tend(sim, at(2029, 5, 27, 18));
    expect(school().standing).toBe('withheld');
    expect(school().endedAt).toBe(at(2029, 5, 27, 17));
    const notices = titled(sim, 'The Degree Isn’t Recommended');
    expect(notices).toHaveLength(1);
    // Until 2026-10-13 it said “You didn’t ask to repeat the year in its thirty days”, whatever was open, and this held it.
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(notices[0]!.body).toBe('The thirty days to finish the degree ended with nothing asked for, and it needs every course passed. The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. You can still practice, and tape the practice briefs on your Profile, outside the School.');
    const after = drawn(sim, RepeatPanel);
    expect(after.text).toContain('Year 3, asked April 27, 2029: called off, for Movement Invention III.');
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You’re not at school.');
  }, 120_000);

  it('called off after the thirty days ended with it pending, withholds the degree then: until 2026-10-13 nothing did, and every request was refused as “Its thirty days have run out.”', () => {
    const sim = thaw(l3().lastEval);
    const school = () => sim.player.school!;
    expect(school().repeatBy).toBe(at(2029, 5, 27, 17));
    // Asked on Thursday 24 May 2029: Yale’s fifth working day on, Memorial Day (28 May) closed, is Friday 1 June.
    tend(sim, at(2029, 5, 24, 10));
    expect(sim.must<{ decideAt: number }>({ kind: 'school.request_repeat', payload: {} }).decideAt).toBe(at(2029, 6, 1, 10));
    // The thirty days end on the 27th with the request pending, and withhold nothing.
    tend(sim, at(2029, 5, 28, 10));
    expect(school().standing).toBe('good');
    expect(sim.execute({ kind: 'school.cancel_repeat', payload: {} }).error).toBe('If you call it off, the faculty won’t recommend the degree: its thirty days ended on May 27, 2029. Confirm to go ahead.');
    // Break: the withholding in `school.cancel_repeat` taken out: still in good standing, and `extraRefusal` and
    // `repeatRefusal`, their old lines back, say “Its thirty days have run out.”
    sim.must({ kind: 'school.cancel_repeat', payload: { confirm: true } });
    expect(school()).toMatchObject({ standing: 'withheld', endedAt: at(2029, 5, 28, 10) });
    expect(school().repeatBy).toBeUndefined();
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You’re not at school.');
    expect(sim.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('You’re not at school.');
  }, 120_000);

  it('a twin not called off is granted at the decision: the next term on the calendar, the I-20 a year longer, and the thirty days’ end withholds nothing', () => {
    const sim = thaw(l3().lastEval);
    const school = sim.player.school!;
    expect(new Date(l3().i20).toISOString()).toBe('2029-07-30T12:00:00.000Z');
    sim.must({ kind: 'school.request_repeat', payload: {} });
    tend(sim, at(2029, 5, 4, 19));
    expect(school.repeat).toMatchObject({ status: 'granted', decidedAt: at(2029, 5, 4, 18) });
    expect(school).toMatchObject({ offset: 2, classOf: 2030, repeatedYears: [3] });
    expect(school.repeatBy).toBeUndefined();
    // A last year's: the program had no next term, and one is put on the calendar, Monday 27 August 2029 at nine.
    expect(pendingOf(sim, TERM_KIND).map((i) => [i.payload.term, i.at])).toEqual([[6, at(2029, 8, 27, 9)]]);
    expect(pendingOf(sim, REPEAT_DUE_KIND)).toHaveLength(0);
    expect(new Date(f1Of(sim.player)!.expiresAt!).toISOString()).toBe('2030-07-30T12:00:00.000Z');
    expect(titled(sim, 'You’ll Repeat The Year')[0]!.body).toMatch(/The tuition scholarship supports six terms, and with the year again the degree takes eight terms: two will be billed to your Yale account\. Your I-20 is extended a year\./);
    tend(sim, at(2029, 5, 27, 18));
    expect(school.standing).toBe('good');
    expect(titled(sim, 'The Degree Isn’t Recommended')).toHaveLength(0);
  }, 120_000);

  it('called off and asked again before the date, the chair decides the new request', () => {
    const sim = thaw(l3().lastEval);
    const school = sim.player.school!;
    sim.must({ kind: 'school.request_repeat', payload: {} });
    tend(sim, at(2029, 4, 30, 12));
    sim.must({ kind: 'school.cancel_repeat', payload: { confirm: true } });
    expect(pendingOf(sim, REPEAT_DECIDE_KIND)).toHaveLength(0);
    // Asked again on Monday 30 April at noon: five working days, Monday 7 May at noon.
    const again = sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} });
    expect(again.decideAt).toBe(at(2029, 5, 7, 12));
    tend(sim, at(2029, 5, 4, 19));
    expect(school.repeat!.status).toBe('pending');
    tend(sim, at(2029, 5, 7, 13));
    expect(school.repeat).toMatchObject({ status: 'granted', requestedAt: at(2029, 4, 30, 12) });
    expect(titled(sim, 'You’ll Repeat The Year')).toHaveLength(1);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// school.request_extra_term
// ---------------------------------------------------------------------------

describe('school.request_extra_term', () => {
  it('PLAYER JOURNEY: Ask For An Additional Term, pressed after the last year’s evaluation, granted through a save: Fall Term 2029 on the calendar for Movement Invention III alone, the I-20 a year longer, once', () => {
    let sim = thaw(l3().lastEval);
    const school = () => sim.player.school!;
    const offer = drawn(sim, RepeatPanel);
    expect(offer.text).toContain('Or an additional term, Fall Term 2029, to retake Movement Invention III alone, with the class then in that year, the degree conferred in December.');
    const ask = drew('school.request_extra_term');
    expect(ask.map((a) => a.label)).toEqual(['Ask For An Additional Term']);
    ask[0]!.onClick!();
    expect(h.toasts.at(-1)).toBe('Asked: decided by May 4, 2029.');
    expect(school().extraRequest).toMatchObject({ status: 'pending', decideAt: at(2029, 5, 4, 18), term: 6, courses: [{ code: MOVEMENT_III, academic: 4, name: 'Movement Invention III' }] });
    expect(sim.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('Your request is with the chair and the dean, decided by May 4, 2029.');

    sim = reload(sim);
    tend(sim, at(2029, 5, 4, 19));
    expect(school().extraRequest!.status).toBe('granted');
    expect(school().extra).toEqual({ term: 6, courses: [{ code: MOVEMENT_III, academic: 4, name: 'Movement Invention III' }] });
    expect(school().repeatBy).toBeUndefined();
    expect(school().awaitingDegree).toBeUndefined();
    expect(pendingOf(sim, REPEAT_DUE_KIND)).toHaveLength(0);
    expect(pendingOf(sim, TERM_KIND).map((i) => [i.payload.term, i.at])).toEqual([[6, at(2029, 8, 27, 9)]]);
    expect(new Date(f1Of(sim.player)!.expiresAt!).toISOString()).toBe('2030-07-30T12:00:00.000Z');
    const granted = titled(sim, 'An Additional Term Granted');
    expect(granted).toHaveLength(1);
    expect(granted[0]!.body).toContain('in Fall Term 2029 you retake Movement Invention III, and only those');
    expect(granted[0]!.body).toContain('Passed, the degree is conferred at Yale’s December conferral.');
    expect(sim.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('Your additional term is Fall Term 2029.');
    // The thirty days' end withholds nothing now.
    sim = reload(sim);
    tend(sim, at(2029, 5, 27, 18));
    expect(school().standing).toBe('good');
    expect(titled(sim, 'An Additional Term Granted')).toHaveLength(1);
    expect(drawn(sim, RepeatPanel).text).toContain('In Fall Term 2029 you take only Movement Invention III; passed, the degree is conferred at Yale’s December conferral.');
  }, 120_000);

  it('the additional term holds each of its class days once, Movement Invention III meeting its fourteen Wednesdays, counted against program term 4', () => {
    const { sim } = extraPlayed();
    const school = sim.player.school!;
    // Fall Term 2029's classes run Monday 3 September to Friday 14 December, the 21st of November off: fourteen
    // Wednesdays, and nothing else meets.
    const wednesdays = classDays(6).filter((d) => new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay() === 3).map(keyOf);
    expect(wednesdays).toHaveLength(14);
    const held = sim.universe.scheduled.filter((i) => i.kind === CLASSES_KIND && i.payload.personId === sim.player.id && i.status === 'done' && i.at > at(2029, 8, 1)).map((i) => String(i.payload.day));
    expect(held).toEqual(wednesdays);
    expect(recordsOf(sim, 6).map(([k]) => k)).toEqual([`6:${MOVEMENT_III}`]);
    expect(school.courses![`6:${MOVEMENT_III}`]).toMatchObject({ academic: 4, meetings: 14, attended: 14, excused: 0 });
  }, 120_000);

  it('PLAYER JOURNEY: the retake is passed at the additional term’s evaluation, with no record put in by hand, and the degree is conferred at Yale’s December conferral', () => {
    const { sim, asked, billed } = extraPlayed();
    const school = sim.player.school!;
    expect(asked.term).toBe(6);
    // The seventh term enrolled was billed, and paid through the command.
    expect(enrolledTerms(school)).toHaveLength(7);
    expect(billed).toBeGreaterThan(0);
    expect(titled(sim, 'A Term Without Tuition Support')).toHaveLength(1);
    expect(accountOwed(sim, sim.player)).toBe(0);
    // The attempts kept: the Fail of Fall Term 2028 and the pass of Fall Term 2029, both against program term 4.
    expect(school.courses![`4:${MOVEMENT_III}`]).toMatchObject({ academic: 4, result: 'fail' });
    expect(school.courses![`6:${MOVEMENT_III}`]).toMatchObject({ academic: 4, result: 'pass' });
    // Conferred at ten on Saturday 22 December 2029, and not at a Commencement.
    expect(sim.universe.scheduled.filter((i) => i.kind === CONFERRAL_KIND && i.payload.personId === sim.player.id).map((i) => [i.status, i.at])).toEqual([['done', at(2029, 12, 22, 10)]]);
    expect(school.standing).toBe('graduated');
    expect(school.endedAt).toBe(at(2029, 12, 22, 10));
    expect(titled(sim, 'Your MFA Is Conferred').map((n) => n.body)).toEqual(['Your MFA in Acting is conferred at Yale’s December conferral, after the courses you retook in an additional term. The diploma is mailed in about six weeks.']);
  }, 120_000);

  it('is refused in its own words before the last year, while a repeat is asked for, and with every course passed; and allowed as the ninth semester', () => {
    const early = thaw(repeatBase());
    expect(early.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('You can ask for an additional term after your last year’s term review, to retake what you didn’t pass.');
    const repeating = thaw(l3().lastEval);
    repeating.must({ kind: 'school.request_repeat', payload: {} });
    expect(repeating.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('Your request to repeat the year is being decided.');
    expect(repeating.player.school!.extraRequest).toBeUndefined();
    // Eight terms enrolled after a repeated first year, the last spring's DRAM 473b failed: the additional term is the
    // ninth, which the Bulletin allows, in Spring Term 2031.
    const last = thaw(r1().jan2030);
    sleepThrough(last, 7, { 'DRAM 473b': 4 }, 2);
    tend(last, at(2030, 4, 26, 18));
    expect(enrolledTerms(last.player.school!)).toHaveLength(8);
    const offered = drawn(last, RepeatPanel);
    expect(offered.text).toContain('Or an additional term, Spring Term 2031, to retake');
    const asked = last.must<{ term: number }>({ kind: 'school.request_extra_term', payload: {} });
    expect(asked.term).toBe(9);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// school.pay_balance
// ---------------------------------------------------------------------------

describe('school.pay_balance', () => {
  // Recast and renamed on 2026-10-16 (brief 09's journeys, journeys.d-aid-past-balance; inputs/renames.json): until then
  // “PLAYER JOURNEY: a scholarship returned on a leave is refused in its words and moves nothing, holds registration on
  // the return, and paid from the drawn panel lifts the hold and lets the term count”, the hold held into the return,
  // where the term's scholarship was paid whole to the bank while it stopped registration. From then the term's aid pays
  // the account first, as Yale applies a credit to the charges before any refund (Yale Student Accounts, Refunds), so
  // the payment from the panel is made before the return, and the twin left unpaid shows the aid paying it.
  it('PLAYER JOURNEY: a scholarship returned on a leave is refused in its words and moves nothing, paid from the drawn panel before the return lifts the hold and leaves the return term’s scholarship whole; an unpaid twin’s return term pays the account from its scholarship first, the hold lifting at the term’s start, and only the student who registers is counted', () => {
    let sim = life('g26-paid', ON_AID);
    const school = () => sim.player.school!;
    tend(sim, at(2027, 1, 13, 12));
    // Nothing owed: refused, and nothing drawn to pay it with.
    expect(sim.execute({ kind: 'school.pay_balance', payload: {} }).error).toBe('Your Yale account owes no balance.');
    expect(sim.execute({ kind: 'school.pay_balance', payload: { amount: 0 } }).error).toBe('Your Yale account owes no balance.');
    drawn(sim, YaleAccountPanel);
    expect(drew('school.pay_balance')).toHaveLength(0);
    // A personal leave from the spring just begun: its scholarship goes back on the rebate schedule, onto the account.
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    tend(sim, asked.decideAt + MS_HOUR);
    const l = school().leave!;
    expect(l.status).toBe('on');
    const returned = l.aidReturned!;
    expect(returned).toBeGreaterThan(0);
    expect(accountOwed(sim, sim.player)).toBe(returned);
    const panel = drawn(sim, YaleAccountPanel);
    expect(stat(panel.html, 'Owed On Your Yale Account')?.value).toBe(usd(sim, returned));
    expect(drew('school.pay_balance').map((c) => c.label)).toEqual(['Pay From Your Bank']);
    // Nothing asked, and more than is owed.
    expect(sim.execute({ kind: 'school.pay_balance', payload: { amount: 0 } }).error).toBe('Enter an amount to pay.');
    expect(sim.execute({ kind: 'school.pay_balance', payload: { amount: returned + 1 } }).error).toBe(`${usd(sim, returned)} is owed. Pay that or less.`);
    expect(accountOwed(sim, sim.player)).toBe(returned);
    // Unpaid by its due date thirty days on: the hold, and $125 a month to the term's $375.
    const due = pendingOf(sim, ACCOUNT_DUE_KIND)[0]!;
    tend(sim, due.at + MS_HOUR);
    expect(school().hold).toBe(due.at);
    expect(accountOwed(sim, sim.player)).toBe(returned + 125_00);
    tend(sim, due.at + 3 * 30 * MS_DAY + MS_HOUR);
    expect(accountOwed(sim, sim.player)).toBe(returned + 375_00);
    tend(sim, due.at + 5 * 30 * MS_DAY + MS_HOUR);
    expect(accountOwed(sim, sim.player)).toBe(returned + 375_00);
    expect(titled(sim, 'A Financial Hold').length).toBeGreaterThan(1);
    // Notice of return given on 1 October.
    tend(sim, at(2027, 10, 1, 12));
    sim.must({ kind: 'school.return_notice', payload: {} });
    const owed = returned + 375_00;
    expect(accountOwed(sim, sim.player)).toBe(owed);
    // A twin left unpaid into the return.
    const unpaid = thaw(freeze(sim));
    // TEST SETUP: the bank emptied. Refused, and nothing moved: the account, the hold, the bank.
    drain(sim);
    const emptied = bankHeld(sim);
    expect(emptied).toBeLessThanOrEqual(0);
    const payments = () => sim.universe.transactions.filter((t) => t.memo === 'Payment: Yale Student Account').length;
    const paidBefore = payments();
    // In the bank's words from 2026-10-16, which say what to do; until then “Your bank can’t cover it.”
    const nothing = 'Your checking account and your savings can’t cover any of it, so nothing was paid. Move money into your checking account first.';
    expect(sim.execute({ kind: 'school.pay_balance', payload: {} }).error).toBe(nothing);
    expect(sim.execute({ kind: 'school.pay_balance', payload: { amount: 100_00 } }).error).toBe(nothing);
    expect(accountOwed(sim, sim.player)).toBe(owed);
    expect(school().hold).toBe(due.at);
    expect(payments()).toBe(paidBefore);
    expect(bankHeld(sim)).toBe(emptied);
    // TEST SETUP: money put back, as savings would be; then paid in full from the drawn panel, the amount left blank.
    fund(sim, owed + 500_00);
    const pay = drawn(sim, YaleAccountPanel);
    expect(stat(pay.html, 'Financial Hold')?.value).toBe(`Since ${dated(due.at)}`);
    const bank = bankHeld(sim);
    drew('school.pay_balance')[0]!.onClick!();
    expect(h.toasts.at(-1)).toBe('Paid in full.');
    expect(accountOwed(sim, sim.player)).toBe(0);
    expect(bankHeld(sim)).toBe(bank - owed);
    expect(school().hold).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted').map((n) => n.body)).toEqual(['Your Yale account is paid. Registration and the diploma are open to you again.']);
    // The leave's return term, Spring Term 2028, begun at nine on Monday 3 January: registration asked again, no hold.
    tend(sim, at(2028, 1, 3, 10));
    tend(unpaid, at(2028, 1, 3, 10));
    expect(school().leaves!.at(-1)!.status).toBe('returned');
    expect(school().mustRegister).toBe(true);
    const register = drawn(sim, LeavePanel);
    expect(register.text).toContain('Register for Spring Term 2028: until you do, classes don’t count your attendance and you can’t work shifts.');
    expect(register.text).not.toContain('A financial hold stops it');
    expect(drew('school.reregister').map((c) => c.disabled)).toEqual([false]);
    // The term's scholarship, by hand: 2027–28's living-expense scholarship, $16,128.08, less its plan, $2,034.44, is
    // $14,093.64 to pay out. Paid before, it's whole; the twin's pays the account first, and the rest reaches the bank.
    const legs = (s: Simulation) => s.universe.transactions.filter((t) => t.memo.startsWith('Living-expense scholarship, the spring term of 2028:')).map((t) => t.postings.filter((p) => s.universe.accounts[p.accountId]?.ownerId === s.player.id).map((p) => [s.universe.accounts[p.accountId]!.category === 'yale-account' ? 'Yale account' : 'bank', p.amount]));
    expect(legs(sim)).toEqual([[['bank', 14_093_64]]]);
    expect(legs(unpaid)).toEqual([[['bank', 14_093_64 - owed], ['Yale account', owed]]]);
    expect(accountOwed(unpaid, unpaid.player)).toBe(0);
    expect(unpaid.player.school!.hold).toBeUndefined();
    expect(titled(unpaid, 'The Financial Hold Is Lifted').map((n) => [n.at, n.body])).toEqual([[at(2028, 1, 3, 9), `This term’s living-expense scholarship paid the ${usd(unpaid, owed)} it owed. Registration and the diploma are open to you again.`]]);
    expect(sim.must<{ registeredAt: Instant }>({ kind: 'school.reregister', payload: {} }).registeredAt).toBe(sim.now);
    expect(school().mustRegister).toBeUndefined();
    sim = reload(sim);
    // The term's first class day, Monday 10 January: registered, the classes count; the twin, its hold lifted but not
    // registered, isn't counted, and is told to register, not to pay.
    tend(sim, at(2028, 1, 10, 18));
    tend(unpaid, at(2028, 1, 10, 18));
    const met = recordsOf(sim, 3);
    expect(met.length).toBeGreaterThan(0);
    for (const [, r] of met) expect(r.attended).toBe(r.meetings);
    expect(titled(sim, 'Not Registered')).toHaveLength(0);
    expect(recordsOf(unpaid, 3).map(([k]) => k).sort()).toEqual(met.map(([k]) => k).sort());
    for (const [, r] of recordsOf(unpaid, 3)) expect(r.attended).toBe(0);
    expect(titled(unpaid, 'Not Registered').map((n) => n.body)).toEqual(['You haven’t registered, so you were counted absent from today’s classes. Press Register on the Standing And Craft tab. Registering late takes the chair’s written permission, which the game assumes you have.']);
    expect(titled(sim, 'The Financial Hold Is Lifted')).toHaveLength(1);
    expect(sim.execute({ kind: 'school.pay_balance', payload: {} }).error).toBe('Your Yale account owes no balance.');
  }, 120_000);

  it('PLAYER JOURNEY: a repeated year’s seventh term paid from the drawn panel in full; the eighth left unpaid holds the diploma at Commencement, and paying it confers the degree', () => {
    let sim = thaw(r1().termSixBilled);
    const school = () => sim.player.school!;
    expect(enrolledTerms(school())).toHaveLength(7);
    expect(titled(sim, 'A Term Without Tuition Support')).toHaveLength(1);
    // What's owed is the sum of the term's two charges: its tuition and its Yale Health fee, no need found.
    const charged = sim.universe.transactions.filter((t) => t.memo.startsWith('Tuition, Fall Term 2029:') || t.memo === 'Yale Health fee, Fall Term 2029').map((t) => t.postings.find((p) => p.amount > 0)!.amount);
    expect(charged).toHaveLength(2);
    const owed = charged[0]! + charged[1]!;
    expect(accountOwed(sim, sim.player)).toBe(owed);
    const panel = drawn(sim, YaleAccountPanel, [], 'terms');
    expect(stat(panel.html, 'Owed On Your Yale Account')?.value).toBe(usd(sim, owed));
    const bank = bankHeld(sim);
    drew('school.pay_balance')[0]!.onClick!();
    expect(h.toasts.at(-1)).toBe('Paid in full.');
    expect(accountOwed(sim, sim.player)).toBe(0);
    expect(bankHeld(sim)).toBe(bank - owed);
    sim = reload(sim);
    // Paid before its due date: no hold, and the eighth term, Spring Term 2030, asks no registration of them.
    tend(sim, at(2030, 1, 7, 10));
    expect(school().hold).toBeUndefined();
    expect(school().mustRegister).toBeUndefined();
    expect(enrolledTerms(school())).toHaveLength(8);
    const eighth = accountOwed(sim, sim.player);
    expect(eighth).toBeGreaterThan(0);
    // Left unpaid: the hold from its due date, the late fees to the term's $375; Commencement, Monday 20 May 2030 at ten.
    tend(sim, at(2030, 5, 20, 14));
    expect(school().hold).toBeDefined();
    expect(accountOwed(sim, sim.player)).toBe(eighth + 375_00);
    expect(school().standing).toBe('good');
    expect(school().awaitingDegree).toBe(true);
    expect(titled(sim, 'The Diploma Is Held').map((n) => n.body)).toEqual([`${usd(sim, eighth + 375_00)} is owed on your Yale account, and a financial hold keeps the diploma until it’s paid. Pay it on the Terms And Award tab.`]);
    expect(sim.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('You’ve passed every course, so there’s nothing to retake.');
    sim = reload(sim);
    expect(sim.must<{ owed: number; held: boolean }>({ kind: 'school.pay_balance', payload: {} })).toEqual({ owed: 0, held: false });
    expect(school().standing).toBe('graduated');
    expect(school().awaitingDegree).toBeUndefined();
    expect(titled(sim, 'Your MFA Is Conferred').map((n) => n.body)).toEqual(['Your Yale account paid, the faculty confer the MFA in Acting, class of 2030, without the ceremony.']);
    sim = reload(sim);
    tend(sim, at(2030, 5, 22));
    expect(titled(sim, 'Your MFA Is Conferred')).toHaveLength(1);
    expect(school().standing).toBe('graduated');
  }, 120_000);
});

// ---------------------------------------------------------------------------
// school.request_conversion
// ---------------------------------------------------------------------------

const RATE = 23_00;
const grantsOf = (sim: Simulation) => sim.universe.transactions.filter((t) => /^Grant-in-aid: \d+ work-study hours converted/.test(t.memo));
const nominal = (sim: Simulation, kind: 'income' | 'expense', name: string) => sim.nominalAccount(kind, name).id;
/** The first-year aid student with nothing excused: the first spring's eve, its first days, and May. */
const c0 = once(() => {
  const sim = life('g26-c0', ON_AID);
  tend(sim, at(2027, 1, 6, 12));
  const jan6 = freeze(sim);
  tend(sim, at(2027, 2, 1, 12));
  const feb1 = freeze(sim);
  tend(sim, at(2027, 5, 3, 12));
  return { jan6, feb1, may3: freeze(sim) };
});
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

describe('school.request_conversion', () => {
  it('is refused in its own words with only hours never assigned in prospect: in January, in the spring before May, and in June, the stat showing none', () => {
    const jan = thaw(c0().jan6);
    const janWords = 'There are no hours to convert at January’s processing. Only assigned hours you missed while ill or hurt count then.';
    expect(jan.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe(janWords);
    const janPanel = drawn(jan, WorkLimitsBlock);
    expect(stat(janPanel.html, 'Convertible To Grant Aid')).toEqual({ value: '0 hours', note: '$0.00 at the rate; 0 converted' });
    expect(drew('school.request_conversion').map((c) => [c.disabled, c.title])).toEqual([[true, janWords]]);
    expect(pendingOf(jan, CONVERT_KIND)).toHaveLength(0);
    // On 1 February, 96 of the year's 150 assigned hours booked: the spring's Saturdays still to come aren't hours never
    // assigned (until 2026-10-13 they were counted so, 54 hours shown and returned, and 6 paid in May).
    const feb = thaw(c0().feb1);
    expect(feb.player.school!.workStudy.assignedBooked).toBe(96);
    const febWords = 'There are no hours to convert yet. Hours you missed while ill or hurt count now; hours never assigned count from May, once the spring’s shifts are done.';
    expect(feb.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe(febWords);
    expect(stat(drawn(feb, WorkLimitsBlock).html, 'Convertible To Grant Aid')?.value).toBe('0 hours');
    // Not asked in May: in June the next processing is January's, which pays no hours never assigned (until
    // 2026-10-13 such a request was taken, booked for the next January, and paid nothing).
    const june = thaw(c0().may3);
    tend(june, at(2027, 6, 10, 12));
    expect(june.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe(janWords);
    expect(stat(drawn(june, WorkLimitsBlock).html, 'Convertible To Grant Aid')?.value).toBe('0 hours');
    expect(pendingOf(june, CONVERT_KIND)).toHaveLength(0);
  }, 120_000);

  it('PLAYER JOURNEY: in May the hours never assigned, asked on the drawn button, are paid at May’s processing to the hour asked, into the account and onto the year’s scholarship, once through a save', () => {
    let sim = thaw(c0().may3);
    const school = () => sim.player.school!;
    // The year's assigned Saturdays, each six hours: twenty-four booked and worked, 144 of the 150, so six never assigned.
    const assigned = sim.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.personId === sim.player.id && i.payload.elective === false && i.at < at(2027, 6, 1));
    expect(assigned).toHaveLength(24);
    expect(assigned.every((i) => Number(i.payload.hours) === 6 && i.status === 'done')).toBe(true);
    expect(school().workStudy.assignedBooked).toBe(144);
    const panel = drawn(sim, WorkLimitsBlock);
    expect(stat(panel.html, 'Convertible To Grant Aid')).toEqual({ value: '6 hours', note: '$138.00 at the rate; 0 converted' });
    const ask = drew('school.request_conversion');
    expect(ask.map((c) => [c.label, c.disabled])).toEqual([['Ask For Conversion To Grant Aid', false]]);
    ask[0]!.onClick!();
    expect(h.toasts.at(-1)).toBe('Asked: processed May 15, 2027.');
    expect(pendingOf(sim, CONVERT_KIND).map((i) => [i.at, i.payload.year])).toEqual([[at(2027, 5, 15, 12), '0']]);
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('Your request is already in for the next processing.');
    sim = reload(sim);
    tend(sim, at(2027, 5, 15, 11));
    const before = earningsOf(sim.player).years[2027]!.scholarship ?? 0;
    expect(grantsOf(sim)).toHaveLength(0);
    tend(sim, at(2027, 5, 15, 13));
    // Six hours at $23.00: $138.00, all of it to the account (no tax withheld for a resident), and the scholarship's.
    const grants = grantsOf(sim);
    expect(grants).toHaveLength(1);
    expect(grants[0]!.memo).toMatch(/^Grant-in-aid: 6 work-study hours converted/);
    const into = grants[0]!.postings.find((p) => !sim.universe.accounts[p.accountId]!.nominal)!;
    expect(into.amount).toBe(6 * RATE);
    expect(grants[0]!.postings.find((p) => p.accountId === nominal(sim, 'income', 'Scholarship'))!.amount).toBe(-6 * RATE);
    expect(grants[0]!.postings).toHaveLength(2);
    expect((earningsOf(sim.player).years[2027]!.scholarship ?? 0) - before).toBe(6 * RATE);
    expect(school().convertedHours).toEqual({ 0: 6 });
    expect(titled(sim, 'Hours Converted To Grant Aid').map((n) => n.body)).toEqual([`6 work-study hours you couldn’t work became $138.00 of grant aid, paid into your ${sim.universe.accounts[into.accountId]!.name}. It’s a scholarship for living costs, which the US taxes.`]);
    expect(stat(drawn(sim, WorkLimitsBlock).html, 'Convertible To Grant Aid')).toEqual({ value: '0 hours', note: '$0.00 at the rate; 6 converted' });
    sim = reload(sim);
    tend(sim, at(2027, 5, 20, 12));
    expect(grantsOf(sim)).toHaveLength(1);
    expect(titled(sim, 'Hours Converted To Grant Aid')).toHaveLength(1);
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('There are no hours to convert at January’s processing. Only assigned hours you missed while ill or hurt count then.');
  }, 120_000);

  it('PLAYER JOURNEY: an assigned Saturday called in sick, asked on the drawn button in the fall, is paid at January’s processing, and the 2027 return filed carries it, against a twin that didn’t ask', () => {
    let sim = life('g26-c1', ON_AID);
    sickSaturday(sim);
    const panel = drawn(sim, WorkLimitsBlock);
    expect(stat(panel.html, 'Hours Excused This Year')?.value).toBe('6');
    expect(stat(panel.html, 'Convertible To Grant Aid')).toEqual({ value: '6 hours', note: '$138.00 at the rate; 0 converted' });
    const twin = thaw(freeze(sim));
    drew('school.request_conversion')[0]!.onClick!();
    expect(h.toasts.at(-1)).toBe('Asked: processed January 15, 2027.');
    expect(pendingOf(sim, CONVERT_KIND).map((i) => i.at)).toEqual([at(2027, 1, 15, 12)]);
    const asked = drawn(sim, WorkLimitsBlock);
    expect(drew('school.request_conversion').map((c) => [c.disabled, c.title])).toEqual([[true, 'Your request is already in for the next processing.']]);
    expect(asked.text).toContain('Your request is already in for the next processing.');
    sim = reload(sim);
    tend(sim, at(2027, 1, 15, 11));
    const before = earningsOf(sim.player).years[2027]?.scholarship ?? 0;
    tend(sim, at(2027, 1, 15, 13));
    const grants = grantsOf(sim);
    expect(grants.map((t) => [t.at, t.postings.map((p) => p.amount).sort((a, b) => a - b)])).toEqual([[at(2027, 1, 15, 12), [-6 * RATE, 6 * RATE]]]);
    expect((earningsOf(sim.player).years[2027]?.scholarship ?? 0) - before).toBe(6 * RATE);
    expect(sim.player.school!.convertedHours).toEqual({ 0: 6 });
    expect(titled(sim, 'Hours Converted To Grant Aid')).toHaveLength(1);
    // The 2027 return, filed in February 2028: its scholarship and its income $138.00 more than the twin's.
    tend(sim, at(2028, 2, 15));
    tend(twin, at(2028, 2, 15));
    expect(grantsOf(twin)).toHaveLength(0);
    sim.must({ kind: 'tax.file', payload: { year: 2027 } });
    twin.must({ kind: 'tax.file', payload: { year: 2027 } });
    const mine = returnsOf(sim.player)['2027']!.figures!;
    const theirs = returnsOf(twin.player)['2027']!.figures!;
    expect((mine.scholarship ?? 0) - (theirs.scholarship ?? 0)).toBe(6 * RATE);
    expect(mine.income - theirs.income).toBe(6 * RATE);
  }, 120_000);

  it('PLAYER JOURNEY: a nonresident’s grant has 14% withheld, the account getting the rest, and the year’s withholding raised by it', () => {
    const sim = life('g26-c2', { ...ON_AID, ...LONDON });
    sickSaturday(sim);
    const asked = sim.must<{ at: Instant; hours: number }>({ kind: 'school.request_conversion', payload: {} });
    expect(asked).toEqual({ at: at(2027, 1, 15, 12), hours: 6 });
    tend(sim, at(2027, 1, 15, 11));
    const withheldBefore = earningsOf(sim.player).years[2027]?.withheld ?? 0;
    tend(sim, at(2027, 1, 15, 13));
    // $138.00, 14% of it $19.32: $118.68 to the account, $19.32 to the tax withheld.
    const grant = grantsOf(sim)[0]!;
    expect(grant.postings.find((p) => !sim.universe.accounts[p.accountId]!.nominal)!.amount).toBe(118_68);
    expect(grant.postings.find((p) => p.accountId === nominal(sim, 'income', 'Scholarship'))!.amount).toBe(-138_00);
    expect(grant.postings.find((p) => p.accountId === nominal(sim, 'expense', 'Tax Withheld'))!.amount).toBe(19_32);
    expect((earningsOf(sim.player).years[2027]?.withheld ?? 0) - withheldBefore).toBe(19_32);
    expect(titled(sim, 'Hours Converted To Grant Aid')[0]!.body).toContain('became $138.00 of grant aid, paid into your');
    expect(titled(sim, 'Hours Converted To Grant Aid')[0]!.body).toContain(', $19.32 withheld for tax.');
  }, 120_000);

  it('is refused with no aid and on leave, in its own words, and a leave begun with a request in cancels it: nothing paid in January', () => {
    // The new life's own family: wealthy, no need found.
    const rich = thaw(repeatBase());
    expect(rich.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('Converting hours to grant aid is only for students on financial aid, and the aid office found no need for you.');
    expect(stat(drawn(rich, WorkLimitsBlock).html, 'Convertible To Grant Aid')).toEqual({ value: 'Not On Aid', note: undefined });
    // Asked, then a medical leave (TEST SETUP: the flu, for the physician's recommendation) begun mid-term.
    const sim = life('g26-c3', ON_AID);
    sickSaturday(sim);
    sim.must({ kind: 'school.request_conversion', payload: {} });
    expect(pendingOf(sim, CONVERT_KIND)).toHaveLength(1);
    flu(sim, 4);
    const leave = sim.must<{ decideAt: Instant; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    expect(leave.startsNow).toBe(true);
    tend(sim, leave.decideAt + MS_HOUR);
    expect(sim.player.school!.leave!.status).toBe('on');
    expect(pendingOf(sim, CONVERT_KIND)).toHaveLength(0);
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('You can’t while you’re on leave: a student on leave has no aid.');
    tend(sim, at(2027, 1, 15, 13));
    expect(grantsOf(sim)).toHaveLength(0);
    expect(sim.player.school!.convertedHours).toBeUndefined();
    expect(titled(sim, 'Hours Converted To Grant Aid')).toHaveLength(0);
  }, 120_000);
});
