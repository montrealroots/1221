/**
 * Evidence for seven school rows the review of 2026-10-13 left partial (verification group g25-school): work-study's
 * Saturdays and pay, and a leave of absence asked for, called off, appealed, come back from and covered, and an
 * Incomplete made up. Each command is sent as its button sends it (`sim.execute`, or the button's own onClick on the
 * rendered screen), each scheduled consequence comes by the clock (`sim.advanceTo`), and each is read where the row says
 * it's read. The figures are the rules' own numbers worked here by hand and written as literals: the 2026–27 Bulletin's
 * living expenses and books, (28,028 + 2,373) / 2 = $15,200.50 a term of living-expense scholarship, $14,014.00 of it
 * taxable (the books' $1,186.50 aren't); Yale Health's $3,764 a year, $1,882 a term; Affiliate cover at $5,416 a term;
 * work-study's six-hour Saturdays at $23 an hour, $138; the late fee's $125 a month to $375 a term; the rebate
 * schedule's all, half and a quarter. Never the constant or the helper the engine computes them with.
 *
 * - work-study: the first fall's twelve class-week Saturdays (none in the work period or the fall recess) booked, worked
 *   and paid each Friday, $1,656 in 2026's work-study and on the 2026 return the tax season makes, beside the $14,014 of
 *   taxable scholarship, at 10% over the $14,600 standard deduction; the second year's twenty-six class-week Saturdays
 *   booked to the 150 assigned hours and no further, the first year having stopped at 144; Shifts And Pay drawn, Take An
 *   Elective Shift pressed and its evening paid that Friday, and a Saturday slept through missed, unpaid and counted.
 * - school.request_leave: asked on the third day of spring classes and begun on its decision five of Yale's working days
 *   on, Martin Luther King Jr. Day closed, past a tenth of the classes, half the term's scholarship returned (until
 *   2026-10-13 five weekdays, the holiday counted, and all of it); a medical leave begun past a quarter of the term returning a quarter; asked a week
 *   before the spring's evaluation and refused at its decision for the course that evaluation failed, the next fall then
 *   begun as if never asked, where a twin with every course passed is granted; an F-1 student's personal leave refused
 *   through the command; Ask For A Leave… opened and Ask pressed. The review's own todo, a personal leave asked in the
 *   first fall before its evaluation, can't be asked: `leaveRefusal` refuses a personal leave until a term is completed,
 *   so the decision's refusal is reached here from the first spring.
 * - school.cancel_leave: a leave granted for the spring and not begun, called off on Call It Off after its warning, and
 *   the spring begun as if never asked, where a twin left alone begins the leave; refused once a leave is on.
 * - school.appeal_leave: a dean's leave for an assessment slept through, appealed on Appeal To The Dean and overturned:
 *   courses, offset, enrolment, the half of the scholarship returned, the I-20's extra year, the evaluation and the next
 *   term all back, and played to; refused past its seven days and for a leave the dean didn't impose.
 * - school.reregister: back from a leave whose returned scholarship went unpaid, the hold refuses Register in its words
 *   and grays it on the screen, a class day and a Saturday don't count the student, and once paid Register takes and the
 *   next class counts. At a return `returnFromLeave` asks for registration before the term's start reads the hold, so a
 *   second journey begins the spring under a hold with no leave behind it: there the hold alone asks for it.
 * - school.buy_affiliate: quoted, refused while the bank can't cover it, bought on Buy It once it can, the lapse closed
 *   and the urgent care had in it billed as Yale Health's, $0; refused past its deadline, on a medical leave, and twice.
 * - school.make_up: an Incomplete extended a month into the spring's classes, refused an hour before class and in class
 *   in `startRefusal`'s words, made up after class on Make Up A Session, passed, its deadline passing with nothing more.
 *   And a session begun an hour before its month runs out, which it can’t hold, refused in its words. Until 2026-10-13
 *   the engine took it, the deadline made the course a Permanent Incomplete in the middle of it, and the session then
 *   passed it; that test asserted the refusal and failed when written, until the engine was fixed that day.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) and an actor at Yale in New Haven from Monday 24 August 2026;
 * where the row is about need, the family of no means a player can pick (`family` undefined, `wealth` scraping), and
 * where it's about an F-1, born in London instead. The screens are rendered with react-dom/server as the player has
 * them: `useGame` stands in for the provider, `run` is the save's own `execute`, and Gated is the real one with its
 * onClick kept so the test can press it.
 *
 * TEST SETUP, said again where it's done: the day's dials each six hours (`tended`), so the clock's consequences are
 * what's measured; the coursework done each midnight (`working`), so a student stays at the School to its second spring;
 * a stay in hospital or the flu, as an illness's admission or `careFor` gives one, where a leave or an Incomplete asks
 * one; a spring course met at a third of its meetings, as a run of unexcused absences leaves one; urgent care had in a
 * lapse, as `careFor` bills it; $1,000 owed on the Yale account with its due date come, as a term's bill unpaid in its
 * thirty days leaves it, where no first-year play makes a hold outside a leave; the bank emptied, and money put in, as
 * spending and savings would; and a screen's two-step choice, which a static render can't press its way into, given as
 * the states its useStates start at.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { PREP_DIMS } from '@/engine/content/coursework';
import { CLASSES_KIND, EVALUATION_KIND, SHIFT_KIND, TERM_KIND, registered } from '@/engine/systems/school';
import { ACCOUNT_DUE_KIND, APPEAL_KIND, LEAVE_DECIDE_KIND, accountOwed, enrolledTerms, yaleAccount } from '@/engine/systems/leave';
import { INCOMPLETE_DUE_KIND, degreeShortfall } from '@/engine/systems/courserecord';
import { careFor, coverOn, healthOf } from '@/engine/systems/health';
import { f1Of } from '@/engine/systems/permission';
import { yearOf } from '@/engine/systems/earnings';
import { returnsOf } from '@/engine/systems/taxreturn';
import { courseworkOf } from '@/engine/systems/coursework';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; onClick?: () => void; disabled?: boolean }[],
  /** TEST SETUP: what the screen's useStates start at, in order, in place of their own initial values. */
  states: [] as unknown[],
  tab: 'standing',
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
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, onClick: props.onClick as (() => void) | undefined, disabled: (props as { disabled?: boolean }).disabled });
      return ce(real.Gated, props);
    },
  };
});

const { LeavePanel } = await import('@/ui/components/StudyPlanPanels');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

const zone = 'America/New_York';
const at = (y: number, m: number, d: number, hh = 9, min = 0) => instantFromZoned({ year: y, month: m, day: d, hour: hh, minute: min }, zone);
const dayOf = (t: number) => { const p = zonedParts(t, zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** A family of no means, which Yale's aid meets: the player's own pick on Identity. */
const onAid = { family: undefined, wealth: 'scraping' };
/** Born in London: at Yale on an F-1. */
const londoner = { homeRegionId: 'uk-eng-london' };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** TEST SETUP: played by somebody who looks after themselves, the dials set each six hours, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** TEST SETUP: the coursework done each midnight, as tests/school.test.ts's `working` does it. */
const working = (sim: Simulation) => { sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => { for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95); }); return sim; };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);
const memoed = (sim: Simulation, memo: string | RegExp) => sim.universe.transactions.filter((t) => (typeof memo === 'string' ? t.memo === memo : memo.test(t.memo)));
const classesOn = (sim: Simulation, day: string) => sim.universe.scheduled.filter((i) => i.kind === CLASSES_KIND && i.payload.personId === sim.player.id && i.payload.day === day).map((i) => i.status);
/** TEST SETUP: money in the bank, as savings would be. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
/** TEST SETUP: everything in the bank spent elsewhere, each posted. */
const drain = (sim: Simulation) => {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.closedAt || (a.kind !== 'checking' && a.kind !== 'savings') || a.balance <= 0) continue;
    sim.post({ memo: 'Spent elsewhere', category: 'other', postings: [{ accountId: sim.nominalAccount('expense', 'Other').id, amount: a.balance }, { accountId: a.id, amount: -a.balance }] });
  }
};

/** A screen as the player has it: its markup, and its words with every title and tag taken out. The Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, screen: FunctionComponent, states: unknown[] = [], tab = 'standing'): { html: string; text: string } {
  h.sim = sim;
  h.clicks = [];
  h.states = [...states];
  h.tab = tab;
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  h.states = [];
  const text = html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  return { html, text };
}
const pressed = (feature: string) => h.clicks.filter((c) => c.feature === feature);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The button of that label, as drawn. */
const button = (html: string, label: string) => new RegExp(`<button[^>]*>${escape(label)}</button>`).exec(html)?.[0];

/**
 * A personal leave asked on the second day of spring classes, Tuesday 12 January 2027, and begun on its decision, five of
 * Yale's working days on with Martin Luther King Jr. Day closed: Wednesday 20 January. Until 2026-10-13 it was asked on
 * the third day, Wednesday 13 January, and decided on the 20th by five weekdays, the holiday counted; asked then now, it's
 * decided on the 21st, past a tenth of the classes (the third-day journey below).
 */
function personalLeave(seed: string): Simulation {
  const sim = student(seed, onAid);
  tended(sim, at(2027, 1, 12, 12));
  const asked = sim.must<{ decideAt: number; firstTerm: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
  tended(sim, asked.decideAt + MS_HOUR);
  expect(sim.player.school!.leave!.status).toBe('on');
  return sim;
}

/** A medical leave asked in the fall on the flu, and begun on its decision. TEST SETUP: the flu, as `careFor` gives one. */
function medicalLeave(seed: string): Simulation {
  const sim = student(seed);
  tended(sim, at(2026, 10, 5));
  healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
  const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
  tended(sim, asked.decideAt + MS_HOUR);
  expect(sim.player.school!.leave!.status).toBe('on');
  return sim;
}

describe('work-study', () => {
  it('PLAYER JOURNEY: the first fall’s twelve class-week Saturdays are booked, worked and paid on the Fridays as wages; 2026’s $1,656 is the year’s work-study and on the return the tax season makes, which taxes it with the scholarship', () => {
    let sim = student('g25-ws', onAid);
    // The first Saturday, Saturday 5 September 2026, ten to four: six hours owed.
    tended(sim, at(2026, 9, 5, 16, 1));
    expect(sim.player.school!.workStudy.owedHours).toBe(6);
    // Paid that Friday at five: six hours at $23, $138, as wages to the checking account.
    tended(sim, at(2026, 9, 11, 17, 1));
    const first = memoed(sim, /^Work-study wages/);
    expect(first.map((t) => t.memo)).toEqual(['Work-study wages, 6 hours: David Geffen School of Drama at Yale University']);
    expect(first[0]!.category).toBe('salary');
    expect(first[0]!.postings.find((q) => q.accountId === sim.player.primaryAccountId)?.amount).toBe(138_00);
    expect(sim.player.school!.workStudy.owedHours).toBe(0);
    sim = reload(sim);
    // Played through the 2027 tax season, Monday 1 February at nine.
    tended(sim, at(2027, 2, 1, 10));
    // Every class-week Saturday of the fall, none in the work period (24 October) or the fall recess (28 November).
    const fall = sim.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.elective !== true && i.at < at(2027, 1, 1, 0));
    expect(fall.map((i) => dayOf(i.at))).toEqual(['2026-09-05', '2026-09-12', '2026-09-19', '2026-09-26', '2026-10-03', '2026-10-10', '2026-10-17', '2026-10-31', '2026-11-07', '2026-11-14', '2026-11-21', '2026-12-05']);
    expect(fall.every((i) => i.status === 'done' && i.payload.hours === 6)).toBe(true);
    const paid2026 = memoed(sim, /^Work-study wages/).filter((t) => t.at < at(2027, 1, 1, 0));
    expect(paid2026).toHaveLength(12);
    expect(paid2026.reduce((s, t) => s + (t.postings.find((q) => q.accountId === sim.player.primaryAccountId)?.amount ?? 0), 0)).toBe(1_656_00);
    // The year's earnings, as work-study: twelve Saturdays at $138.
    expect(yearOf(sim.player, 2026).workStudy).toBe(1_656_00);
    // The return the tax season made for 2026: the wages beside the fall's taxable scholarship, $15,200.50 less the
    // books' $1,186.50, and the bank's interest; taxed at 10% on what's over the $14,600 standard deduction.
    const r = returnsOf(sim.player)['2026'];
    expect(r).toBeDefined();
    expect(r!.figures.workStudy).toBe(1_656_00);
    expect(r!.figures.scholarship).toBe(14_014_00);
    expect(r!.figures.income).toBe(14_014_00 + 1_656_00 + (r!.figures.interest ?? 0));
    expect(r!.figures.federal).toBe(Math.round((r!.figures.income - 14_600_00) / 10));
  }, 60_000);

  it('PLAYER JOURNEY: the second year’s twenty-six class-week Saturdays are booked to its 150 assigned hours and no further, twenty-five and none on 22 April 2028, after a first year of twenty-four that stopped at 144', () => {
    let sim = working(student('g25-cap'));
    tended(sim, at(2027, 8, 1));
    const assigned = (s: Simulation, from: number, to: number) => s.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.elective !== true && i.status !== 'cancelled' && i.at >= from && i.at < to);
    // The first year: twelve fall Saturdays and twelve spring ones (none in the spring recess), 144 hours, under the cap.
    expect(assigned(sim, at(2026, 8, 24, 0), at(2027, 8, 1, 0))).toHaveLength(24);
    expect(sim.player.school!.workStudy.assignedBooked).toBe(144);
    sim = reload(sim);
    tended(sim, at(2028, 5, 1));
    const year2 = assigned(sim, at(2027, 8, 23, 0), at(2028, 5, 1, 0));
    // Thirteen fall Saturdays, and twelve of the spring's thirteen: 25 × 6 = 150, the assigned hours.
    expect(year2.map((i) => dayOf(i.at))).toEqual([
      '2027-09-04', '2027-09-11', '2027-09-18', '2027-09-25', '2027-10-02', '2027-10-09', '2027-10-16', '2027-10-23', '2027-10-30', '2027-11-06', '2027-11-13', '2027-11-20', '2027-12-04',
      '2028-01-15', '2028-01-22', '2028-01-29', '2028-02-05', '2028-02-12', '2028-02-19', '2028-02-26', '2028-03-18', '2028-03-25', '2028-04-01', '2028-04-08', '2028-04-15',
    ]);
    expect(new Set(year2.map((i) => i.at)).size).toBe(25);
    expect(sim.player.school!.workStudy.assignedBooked).toBe(150);
    // Saturday 22 April 2028 is a class-week Saturday, classes on the Friday before it and the Monday after, and
    // nothing is booked on it.
    expect(classesOn(sim, '2028-04-21')).toEqual(['done']);
    expect(classesOn(sim, '2028-04-24').length).toBe(1);
    expect(sim.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && dayOf(i.at) === '2028-04-22')).toHaveLength(0);
    // Shifts And Pay says so.
    expect(drawn(sim, SchoolWorkspace, [], 'work').text).toContain('Assigned Hours Booked 150 of 150');
  }, 60_000);

  it('PLAYER JOURNEY: Shifts And Pay shows the hours booked and owed; Take An Elective Shift, pressed, books an evening that Friday pays; a Saturday slept through is missed, unpaid and counted against attendance', () => {
    const sim = student('g25-panel');
    tended(sim, at(2026, 9, 6, 12));
    let shown = drawn(sim, SchoolWorkspace, [], 'work');
    expect(shown.text).toContain('Assigned Hours Booked 6 of 150');
    expect(shown.text).toContain('Elective Hours Asked For 0');
    expect(shown.text).toContain('Owed On Friday $138.00 6 hours at $23.00 an hour');
    const take = pressed('school.take_shift');
    expect(take).toHaveLength(1);
    take[0]!.onClick!();
    // The next free evening in the term’s class days, seven to eleven, front of house: Tuesday 8 September, four hours.
    // Until 2026-10-13 this held Monday 7 September, Labor Day, a day off the term’s classes skip, which the booking
    // didn’t (found by that day’s final defect pass).
    const evening = pendingOf(sim, SHIFT_KIND).filter((i) => i.payload.elective === true);
    expect(evening.map((i) => i.at)).toEqual([at(2026, 9, 8, 19)]);
    expect(evening[0]!.payload.hours).toBe(4);
    shown = drawn(sim, SchoolWorkspace, [], 'work');
    expect(shown.text).toContain('Elective Hours Asked For 4');
    // That Friday pays the Saturday and the evening: ten hours, $230.
    tended(sim, at(2026, 9, 11, 17, 1));
    expect(memoed(sim, /^Work-study wages/).map((t) => t.memo)).toEqual(['Work-study wages, 10 hours: David Geffen School of Drama at Yale University']);
    expect(memoed(sim, /^Work-study wages/)[0]!.postings.find((q) => q.accountId === sim.player.primaryAccountId)?.amount).toBe(230_00);
    // The next Saturday slept through: to bed at nine for three hours, across the ten o'clock shift.
    tended(sim, at(2026, 9, 12, 9));
    sim.must({ kind: 'life.sleep', payload: { hours: 3 } });
    const saturday = sim.universe.scheduled.find((i) => i.kind === SHIFT_KIND && i.at === at(2026, 9, 12, 10))!;
    expect(saturday.status).toBe('missed');
    expect(titled(sim, 'You Missed A Work-Study Shift')).toHaveLength(1);
    expect(sim.player.school!.tally).toMatchObject({ shifts: 2, worked: 1 });
    expect(sim.player.school!.workStudy.owedHours).toBe(0);
    // Its Friday pays nothing: no wages, no second deposit.
    tended(sim, at(2026, 9, 18, 17, 1));
    expect(memoed(sim, /^Work-study wages/)).toHaveLength(1);
    // The Standing tab's attendance counts it: one of two assigned shifts.
    expect(drawn(sim, SchoolWorkspace, [], 'standing').text).toContain('1 of 2 assigned shifts');
  }, 60_000);
});

describe('school.request_leave', () => {
  it('PLAYER JOURNEY: asked on the third day of spring classes, decided five of Yale’s working days on, Martin Luther King Jr. Day closed, and begun that day: past a tenth of the classes, half the term’s scholarship goes back on the rebate schedule, $7,600.25 owed on the Yale account; kept through a reload, and not done twice', () => {
    let sim = student('g25-third', onAid);
    tended(sim, at(2027, 1, 13, 12));
    const asked = sim.must<{ decideAt: number; firstTerm: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    // Wednesday 13 January to Thursday 21 January: the 14th, 15th, 19th, 20th and 21st, Yale closed on Monday the 18th
    // for Martin Luther King Jr. Day (“Official Yale Holidays”). Until 2026-10-13 this held Wednesday the 20th, five
    // weekdays with the holiday counted, and all of the scholarship returned.
    expect(asked).toEqual({ decideAt: at(2027, 1, 21, 12), firstTerm: 1, startsNow: true });
    expect(pendingOf(sim, LEAVE_DECIDE_KIND).map((i) => i.at)).toEqual([at(2027, 1, 21, 12)]);
    sim = reload(sim);
    expect(sim.player.school!.leave!.status).toBe('pending');
    tended(sim, asked.decideAt + MS_HOUR);
    const school = sim.player.school!;
    const l = school.leave!;
    expect(l).toMatchObject({ status: 'on', startedAt: at(2027, 1, 21, 12), firstTerm: 1, returnTerm: 3 });
    // 10.5 days into the 103 from 11 January to 23 April, past a tenth and short of a quarter: half of the term's
    // living-expense scholarship, (28,028 + 2,373) / 2 = $15,200.50, back on the Yale account, $7,600.25.
    expect(l.aidReturned).toBe(7_600_25);
    expect(accountOwed(sim, sim.player)).toBe(7_600_25);
    expect(memoed(sim, 'Living-expense scholarship returned on the rebate schedule (50%), Spring Term 2027: leave of absence')).toHaveLength(1);
    expect(school.offset).toBe(2);
    expect(enrolledTerms(school)).toEqual([0]);
    expect(Object.values(school.courses ?? {}).filter((r) => r.term === 1).every((r) => r.result === 'withdrawn')).toBe(true);
    expect(coverOn(sim.player, at(2027, 1, 22))).not.toBe('yale');
    expect(titled(sim, 'Your Leave Has Begun')).toHaveLength(1);
    // Saved and opened again, nothing of it happens twice; asked again, refused.
    sim = reload(sim);
    tended(sim, sim.now + 2 * MS_DAY);
    expect(titled(sim, 'Your Leave Has Begun')).toHaveLength(1);
    expect(accountOwed(sim, sim.player)).toBe(7_600_25);
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } }).error).toBe('You’re on leave.');
  }, 60_000);

  it('a medical leave begun past a quarter of the spring’s classes and before half returns a quarter of the scholarship, $3,800.13', () => {
    const sim = student('g25-quarter', onAid);
    tended(sim, at(2027, 2, 8, 12));
    // TEST SETUP: the flu, as `careFor` gives one.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    expect(asked.decideAt).toBe(at(2027, 2, 15, 12));
    tended(sim, asked.decideAt + MS_HOUR);
    // Begun Monday 15 February at noon, 35.5 days into the 103 from 11 January to 23 April: a quarter, $15,200.50 / 4.
    expect(sim.player.school!.leave!.aidReturned).toBe(3_800_13);
    expect(accountOwed(sim, sim.player)).toBe(3_800_13);
    expect(memoed(sim, 'Living-expense scholarship returned on the rebate schedule (25%), Spring Term 2027: leave of absence')).toHaveLength(1);
  }, 60_000);

  it('PLAYER JOURNEY: decided on the record as it stands then: asked a week before the spring’s evaluation, refused when the evaluation fails a course, in its words, once; the next fall begins as if never asked, where a twin with every course passed is granted the leave', () => {
    const sim = student('g25-refuse');
    tended(sim, at(2027, 4, 19, 9));
    const asked = sim.must<{ decideAt: number; firstTerm: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    // Past the spring's tenth class day: from the next term, the fall, decided Monday 26 April.
    expect(asked).toEqual({ decideAt: at(2027, 4, 26, 9), firstTerm: 2, startsNow: false });
    const twin = reload(sim);
    // TEST SETUP: Acting I met at a third of its meetings, as a run of unexcused absences leaves it.
    const acting = sim.player.school!.courses!['1:DRAM 103a/b']!;
    acting.attended = Math.floor(acting.meetings / 3);
    tended(sim, asked.decideAt + MS_HOUR);
    tended(twin, asked.decideAt + MS_HOUR);
    const school = sim.player.school!;
    expect(acting.result).toBe('fail');
    expect(school.leave).toBeUndefined();
    expect(school.leaves!.at(-1)).toMatchObject({ status: 'refused', why: 'You weren’t current with your requirements: Acting I.' });
    expect(titled(sim, 'Your Leave Is Refused').map((n) => n.body)).toEqual(['The chair and the dean refused it. You weren’t current with your requirements: Acting I. You stay at the School as you are.']);
    expect(pendingOf(sim, LEAVE_DECIDE_KIND)).toHaveLength(0);
    expect(twin.player.school!.leave).toMatchObject({ status: 'granted', firstTerm: 2, returnTerm: 4 });
    expect(titled(twin, 'Your Leave Is Granted')).toHaveLength(1);
    // The fall: the refused student at the School as before, a year on; the twin on leave.
    tended(sim, at(2027, 8, 31, 12));
    tended(twin, at(2027, 8, 31, 12));
    expect(school.offset ?? 0).toBe(0);
    expect(school.classOf).toBe(2029);
    expect(enrolledTerms(school)).toEqual([0, 1, 2]);
    expect(classesOn(sim, '2027-08-30')).toEqual(['done']);
    expect(titled(sim, 'Your Leave Has Begun')).toHaveLength(0);
    expect(twin.player.school!.leave!.status).toBe('on');
    expect(twin.player.school!.offset).toBe(2);
    expect(enrolledTerms(twin.player.school!)).toEqual([0, 1]);
    expect(classesOn(twin, '2027-08-30')).toEqual([]);
  }, 60_000);

  it('an F-1 student’s personal leave is refused through the command, in its words, and nothing is asked', () => {
    const sim = student('g25-f1', londoner);
    tended(sim, at(2026, 12, 18));
    expect(f1Of(sim.player)).toBeDefined();
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } }).error).toBe('On an F-1, a personal leave ends your status: the School would report it, and you’d have fifteen days to leave the United States, which SLATE can’t play. A medical leave keeps your status, as a reduced course load.');
    expect(sim.player.school!.leave).toBeUndefined();
    expect(pendingOf(sim, LEAVE_DECIDE_KIND)).toHaveLength(0);
  }, 60_000);

  it('PLAYER JOURNEY: Ask For A Leave… opens the form’s Ask, which says what asking does; pressed, it asks for the form’s kind, reason and length, and the panel says who has it and by when', () => {
    const sim = student('g25-ask');
    tended(sim, at(2026, 12, 18));
    // As the panel opens: a medical leave, which nothing a physician would recommend on lets through.
    let shown = drawn(sim, LeavePanel);
    expect(button(shown.html, 'Ask For A Leave…')).toContain('disabled=""');
    expect(pressed('school.request_leave')).toHaveLength(0);
    // TEST SETUP: Personal, Family, Two Terms chosen and Ask For A Leave… pressed (the panel's kind, reason, length and step).
    shown = drawn(sim, LeavePanel, ['personal', 'family', 2, 'request']);
    expect(shown.text).toContain('Asking puts it to the chair and the dean, who decide in five working days.');
    expect(shown.text).toContain('Granted, it would run from Spring Term 2027 to Spring Term 2028');
    const ask = pressed('school.request_leave');
    expect(ask).toHaveLength(1);
    ask[0]!.onClick!();
    // Friday 18 December 2026: Yale's working days are the 21st, 22nd and 23rd, then closed from the 24th to New Year's
    // Day, and the spring term begins at 8 AM on Monday 4 January, before the fifth, which decides it then. Until
    // 2026-10-13 this held Christmas Day, five weekdays on (found by that day's final defect pass).
    expect(sim.player.school!.leave).toMatchObject({ status: 'pending', kind: 'personal', reason: 'family', terms: 2, firstTerm: 1, decideAt: at(2027, 1, 4, 8) });
    expect(pendingOf(sim, LEAVE_DECIDE_KIND)).toHaveLength(1);
    shown = drawn(sim, LeavePanel);
    expect(shown.text).toContain('Your Leave With The Chair And The Dean Personal, Family');
    expect(shown.text).toContain('Decided by January 4, 2027');
  }, 60_000);
});

describe('school.cancel_leave', () => {
  it('PLAYER JOURNEY: a leave granted for the spring and not yet begun, called off on Call It Off after its warning: the spring begins as if it was never asked, through a reload, where a twin left alone begins the leave', () => {
    let sim = student('g25-cancel');
    // Asked on Monday 14 December, after the fall's evaluation on the 11th, decided on Monday the 21st, before the spring.
    // Until 2026-10-13 it was asked on the 18th and decided on Christmas Day; asked then now, it's decided as the spring
    // begins (the Ask journey above).
    tended(sim, at(2026, 12, 14));
    const asked = sim.must<{ decideAt: number; firstTerm: number }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    tended(sim, asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave).toMatchObject({ status: 'granted', firstTerm: 1, returnTerm: 3 });
    expect(titled(sim, 'Your Leave Is Granted')).toHaveLength(1);
    const twin = reload(sim);
    // Unconfirmed, the command says what it does and does nothing.
    expect(sim.execute({ kind: 'school.cancel_leave', payload: {} }).error).toBe('Calling it off keeps you at the School as you are. Confirm to go ahead.');
    expect(sim.player.school!.leave!.status).toBe('granted');
    let shown = drawn(sim, LeavePanel);
    expect(shown.text).toContain('Granted, Not Yet Begun');
    expect(button(shown.html, 'Call Off The Leave…')).toBeDefined();
    expect(pressed('school.cancel_leave')).toHaveLength(0);
    // TEST SETUP: Call Off The Leave… pressed (the panel's kind, reason, length and step).
    shown = drawn(sim, LeavePanel, ['medical', 'illness', 2, 'cancel']);
    expect(shown.text).toContain('You stay at the School as you are.');
    pressed('school.cancel_leave')[0]!.onClick!();
    expect(sim.player.school!.leave).toBeUndefined();
    expect(sim.player.school!.leaves!.at(-1)).toMatchObject({ status: 'canceled', firstTerm: 1 });
    expect(sim.execute({ kind: 'school.cancel_leave', payload: { confirm: true } }).error).toBe('No leave is asked for.');
    sim = reload(sim);
    tended(sim, at(2027, 1, 12, 12));
    tended(twin, at(2027, 1, 12, 12));
    const school = sim.player.school!;
    expect(school.leave).toBeUndefined();
    expect(school.offset ?? 0).toBe(0);
    expect(school.termsBegun).toBe(2);
    expect(enrolledTerms(school)).toEqual([0, 1]);
    expect(classesOn(sim, '2027-01-11')).toEqual(['done']);
    expect(titled(sim, 'Your Leave Has Begun')).toHaveLength(0);
    expect(twin.player.school!.leave!.status).toBe('on');
    expect(twin.player.school!.offset).toBe(2);
    expect(enrolledTerms(twin.player.school!)).toEqual([0]);
    expect(classesOn(twin, '2027-01-11')).toEqual([]);
    expect(titled(twin, 'Your Leave Has Begun')).toHaveLength(1);
  }, 60_000);

  it('a leave already on can’t be called off: refused in its words, and the leave stays on', () => {
    const sim = medicalLeave('g25-onleave');
    expect(sim.execute({ kind: 'school.cancel_leave', payload: { confirm: true } }).error).toBe('You’re on leave: you come back at the term it ends, with notice. To leave for good, withdraw.');
    expect(sim.player.school!.leave!.status).toBe('on');
    expect(sim.player.school!.offset).toBe(2);
    expect(drawn(sim, LeavePanel).text).not.toContain('Call Off The Leave…');
  }, 60_000);
});

describe('school.appeal_leave', () => {
  /**
   * A dean's leave: a stay in hospital through the fall's first weeks brings Yale Health's assessment by the clock, on
   * Friday 18 September at nine, and the student, home and well by then, sleeps through it, a ground of its own; the
   * dean imposes the leave on Monday 21 September at nine. TEST SETUP: the stay, 1 to 17 September, as an illness's
   * admission would make it.
   */
  function imposed(seed: string) {
    const sim = student(seed, { ...londoner, ...onAid });
    tended(sim, at(2026, 9, 1, 8));
    const f1Before = f1Of(sim.player)!.expiresAt!;
    healthOf(sim.player).inHospitalUntil = at(2026, 9, 17, 8);
    tended(sim, at(2026, 9, 18, 8));
    expect(sim.player.school!.welfare).toMatchObject({ status: 'scheduled', assessAt: at(2026, 9, 18, 9) });
    // Before the dean imposes anything, there's nothing to appeal.
    expect(sim.execute({ kind: 'school.appeal_leave', payload: {} }).error).toBe('Only a leave the dean imposed can be appealed.');
    sim.must({ kind: 'life.sleep', payload: { hours: 3 } });
    tended(sim, at(2026, 9, 21, 10));
    expect(sim.player.school!.leave).toMatchObject({ status: 'on', kind: 'medical', firstTerm: 0, returnTerm: 2 });
    return { sim, f1Before };
  }

  it('PLAYER JOURNEY: a dean’s leave for an assessment slept through, appealed on Appeal To The Dean and overturned once cleared: the courses, the term, the half of the scholarship returned and the I-20’s extra year all back, the evaluation and the spring on the calendar again and played to; through a reload, and once', () => {
    const { sim: first, f1Before } = imposed('g25-appeal');
    let sim = first;
    const l = sim.player.school!.leave!;
    expect(l.mandatory).toMatchObject({ why: 'You didn’t come to the assessment, which the Bulletin names as a ground of its own.', appealBy: at(2026, 9, 28, 9) });
    // Begun a fifth of the way into the fall's classes (31 August to 11 December): half the scholarship back, $7,600.25.
    expect(l.aidReturned).toBe(7_600_25);
    expect(accountOwed(sim, sim.player)).toBe(7_600_25);
    // The I-20 a year longer, as a reduced course load.
    const before = zonedParts(f1Before, zone);
    expect(zonedParts(f1Of(sim.player)!.expiresAt!, zone)).toMatchObject({ year: before.year + 1, month: before.month, day: before.day });
    const shown = drawn(sim, LeavePanel);
    expect(shown.text).toContain('Imposed by the dean on Yale Health’s recommendation: You didn’t come to the assessment, which the Bulletin names as a ground of its own. You can appeal in writing to the dean until September 28, 2026;');
    const appeal = pressed('school.appeal_leave');
    expect(appeal).toHaveLength(1);
    appeal[0]!.onClick!();
    // Five weekdays on: Monday 28 September at ten.
    expect(sim.player.school!.leave!.mandatory!.appeal).toEqual({ at: at(2026, 9, 21, 10), decideAt: at(2026, 9, 28, 10) });
    expect(pendingOf(sim, APPEAL_KIND).map((i) => i.at)).toEqual([at(2026, 9, 28, 10)]);
    expect(drawn(sim, LeavePanel).text).toContain('Your appeal is with the dean, decided by September 28, 2026.');
    expect(pressed('school.appeal_leave')).toHaveLength(0);
    expect(sim.execute({ kind: 'school.appeal_leave', payload: {} }).error).toBe('You appealed on September 21, 2026.');
    sim = reload(sim);
    tended(sim, at(2026, 9, 28, 11));
    const school = sim.player.school!;
    expect(school.leave).toBeUndefined();
    expect(school.leaves!.at(-1)).toMatchObject({ status: 'rescinded', mandatory: { appeal: { outcome: 'rescinded' } } });
    expect(titled(sim, 'Your Leave Is Overturned')).toHaveLength(1);
    expect(Object.values(school.courses ?? {}).filter((r) => r.term === 0 && r.result === 'withdrawn')).toHaveLength(0);
    expect(school.offset ?? 0).toBe(0);
    expect(school.classOf).toBe(2029);
    expect(enrolledTerms(school)).toEqual([0]);
    // The half returned is restored: nothing owed, the restoring posted once.
    expect(accountOwed(sim, sim.player)).toBe(0);
    const restored = memoed(sim, 'Living-expense scholarship restored, Fall Term 2026: the leave overturned on appeal');
    expect(restored).toHaveLength(1);
    expect(Math.max(...restored[0]!.postings.map((q) => q.amount))).toBe(7_600_25);
    // The I-20 as it was.
    expect(f1Of(sim.player)!.expiresAt).toBe(f1Before);
    // The fall's evaluation, Friday 11 December at five, and the spring, Monday 4 January at nine, back on the calendar.
    expect(pendingOf(sim, EVALUATION_KIND).map((i) => [i.at, i.payload.term])).toEqual([[at(2026, 12, 11, 17), 0]]);
    expect(pendingOf(sim, TERM_KIND).map((i) => [i.at, i.payload.term])).toEqual([[at(2027, 1, 4, 9), 1]]);
    // Past the returned aid's thirty days: nothing owed, so no hold and no late fee.
    tended(sim, at(2026, 10, 22, 12));
    expect(school.hold).toBeUndefined();
    expect(school.lateFees).toBeUndefined();
    // Played to them: the fall evaluated, the spring begun and enrolled.
    tended(sim, at(2027, 1, 5, 12));
    expect(school.history.map((x) => x.term)).toEqual([0]);
    expect(school.termsBegun).toBe(2);
    expect(enrolledTerms(school)).toEqual([0, 1]);
    expect(titled(sim, 'Your Leave Is Overturned')).toHaveLength(1);
  }, 60_000);

  it('an appeal past its seven days is refused in its words, the button gone, and nothing is put to the dean', () => {
    const { sim } = imposed('g25-late');
    tended(sim, at(2026, 9, 28, 10));
    const shown = drawn(sim, LeavePanel);
    expect(pressed('school.appeal_leave')).toHaveLength(0);
    expect(shown.text).not.toContain('You can appeal in writing to the dean until');
    expect(sim.execute({ kind: 'school.appeal_leave', payload: {} }).error).toBe('The appeal had to be in by September 28, 2026.');
    expect(sim.player.school!.leave!.mandatory!.appeal).toBeUndefined();
    expect(pendingOf(sim, APPEAL_KIND)).toHaveLength(0);
    expect(sim.player.school!.leave!.status).toBe('on');
  }, 60_000);

  it('a medical leave the student asked for isn’t the dean’s to overturn: refused in its words, and nothing is put to the dean', () => {
    const sim = medicalLeave('g25-own');
    expect(sim.execute({ kind: 'school.appeal_leave', payload: {} }).error).toBe('Only a leave the dean imposed can be appealed.');
    expect(pendingOf(sim, APPEAL_KIND)).toHaveLength(0);
    expect(sim.player.school!.leave!.status).toBe('on');
    drawn(sim, LeavePanel);
    expect(pressed('school.appeal_leave')).toHaveLength(0);
  }, 60_000);
});

describe('school.reregister', () => {
  it('PLAYER JOURNEY: back from a leave whose returned scholarship went unpaid: the hold refuses Register in its words and grays it, a class day and a Saturday don’t count the student; paid, Register takes, once, and the next class counts', () => {
    let sim = personalLeave('g25-hold');
    expect(accountOwed(sim, sim.player)).toBe(15_200_50);
    sim.must({ kind: 'school.return_notice', payload: {} });
    // Unpaid by its thirty days, Friday 19 February: the hold and the month's $125 fee.
    tended(sim, at(2027, 2, 19, 13));
    expect(sim.player.school!.hold).toBe(at(2027, 2, 19, 12));
    expect(accountOwed(sim, sim.player)).toBe(15_200_50 + 125_00);
    sim = reload(sim);
    // Back at the spring term's start, Monday 3 January 2028.
    tended(sim, at(2028, 1, 3, 12));
    const school = sim.player.school!;
    expect(school.leave).toBeUndefined();
    expect(school.leaves!.at(-1)!.status).toBe('returned');
    expect(school.mustRegister).toBe(true);
    // Three months' fees, to the term's $375 cap.
    expect(accountOwed(sim, sim.player)).toBe(15_200_50 + 375_00);
    expect(sim.execute({ kind: 'school.reregister', payload: {} }).error).toBe('A financial hold stops registration: $15,575.50 is owed on your Yale account.');
    expect(school.mustRegister).toBe(true);
    expect(registered(school, courseworkOf(sim, sim.player))).toBe(false);
    let shown = drawn(sim, LeavePanel);
    expect(shown.text).toContain('Register for Spring Term 2028: until you do, classes don’t count you and shifts can’t be worked. A financial hold stops it until your Yale account is paid.');
    expect(button(shown.html, 'Register')).toContain('disabled=""');
    // The first class day, Monday 10 January: classes don't count the student.
    tended(sim, at(2028, 1, 10, 16));
    expect(classesOn(sim, '2028-01-10')).toEqual(['missed']);
    expect(school.tally).toMatchObject({ classDays: 1, attended: 0 });
    expect(titled(sim, 'Not Registered')).toHaveLength(1);
    expect(Object.values(school.courses ?? {}).filter((r) => r.term === 3).every((r) => r.attended === 0)).toBe(true);
    // The first Saturday, 15 January: a shift that can't be worked.
    tended(sim, at(2028, 1, 15, 17));
    expect(sim.universe.scheduled.find((i) => i.kind === SHIFT_KIND && i.at === at(2028, 1, 15, 10))!.status).toBe('missed');
    expect(titled(sim, 'A Shift You Couldn’t Work')).toHaveLength(1);
    expect(school.workStudy.owedHours).toBe(0);
    // TEST SETUP: the money to pay it, as savings would hold it.
    fund(sim, 15_575_50 + 100_00);
    expect(sim.must<{ owed: number; held: boolean }>({ kind: 'school.pay_balance', payload: {} })).toEqual({ owed: 0, held: false });
    expect(school.hold).toBeUndefined();
    shown = drawn(sim, LeavePanel);
    expect(button(shown.html, 'Register')).not.toContain('disabled');
    pressed('school.reregister')[0]!.onClick!();
    expect(school.mustRegister).toBeUndefined();
    expect(school.registeredAt).toBe(sim.now);
    expect(registered(school, courseworkOf(sim, sim.player))).toBe(true);
    expect(sim.execute({ kind: 'school.reregister', payload: {} }).error).toBe('You’re registered.');
    sim = reload(sim);
    // Tuesday 18 January (Monday the 17th is Martin Luther King Jr. Day): counted.
    tended(sim, at(2028, 1, 18, 16));
    expect(classesOn(sim, '2028-01-18')).toEqual(['done']);
    expect(sim.player.school!.tally.attended).toBe(1);
    expect(registered(sim.player.school, courseworkOf(sim, sim.player))).toBe(true);
  }, 60_000);

  it('a term begun under a hold, with no leave behind it, asks for registration again: refused until paid, the first class day not counted, then registered and counted', () => {
    const sim = student('g25-hold-term');
    tended(sim, at(2026, 12, 18, 12));
    // TEST SETUP: $1,000 owed on the Yale account and its due date come, as a term's bill unpaid in its thirty days
    // leaves it. The hold and the month's fee are the clock's (`ACCOUNT_DUE_KIND`).
    sim.post({ memo: 'TEST SETUP', category: 'school', postings: [{ accountId: sim.nominalAccount('expense', 'Other').id, amount: 1_000_00 }, { accountId: yaleAccount(sim, sim.player)!.id, amount: -1_000_00 }] });
    sim.schedule({ at: sim.now + MS_HOUR, kind: ACCOUNT_DUE_KIND, label: 'Yale Account: Payment Due', category: 'school', priority: 33, payload: { personId: sim.player.id, term: 0 } });
    tended(sim, at(2026, 12, 18, 14));
    expect(sim.player.school!.hold).toBeDefined();
    expect(sim.player.school!.mustRegister).toBeUndefined();
    // The spring begins, Monday 4 January at nine, under the hold.
    tended(sim, at(2027, 1, 4, 12));
    const school = sim.player.school!;
    expect(school.leave).toBeUndefined();
    expect(school.termsBegun).toBe(2);
    expect(school.mustRegister).toBe(true);
    expect(registered(school, courseworkOf(sim, sim.player))).toBe(false);
    expect(sim.execute({ kind: 'school.reregister', payload: {} }).error).toBe('A financial hold stops registration: $1,125.00 is owed on your Yale account.');
    const shown = drawn(sim, LeavePanel);
    expect(shown.text).toContain('Register for Spring Term 2027: until you do, classes don’t count you and shifts can’t be worked. A financial hold stops it until your Yale account is paid.');
    expect(button(shown.html, 'Register')).toContain('disabled=""');
    tended(sim, at(2027, 1, 11, 16));
    expect(classesOn(sim, '2027-01-11')).toEqual(['missed']);
    expect(titled(sim, 'Not Registered')).toHaveLength(1);
    // TEST SETUP: the money to pay it, as savings would hold it.
    fund(sim, 1_125_00);
    sim.must({ kind: 'school.pay_balance', payload: {} });
    sim.must({ kind: 'school.reregister', payload: {} });
    tended(sim, at(2027, 1, 12, 16));
    expect(classesOn(sim, '2027-01-12')).toEqual(['done']);
    expect(school.tally).toMatchObject({ classDays: 2, attended: 1 });
  }, 60_000);
});

describe('school.buy_affiliate', () => {
  it('PLAYER JOURNEY: quoted at the leave’s two terms less the spring’s fee, $8,950; refused while the bank can’t cover it, the lapse and the bill as they were; bought on Buy It once it can, the cover back to the day student cover ended and the urgent care had in the lapse billed as Yale Health’s, $0; kept through a reload, and not bought twice', () => {
    let sim = personalLeave('g25-aff');
    const l = sim.player.school!.leave!;
    // Student cover ended the day the leave began; Affiliate cover can be bought until thirty days from asking, later
    // than 31 January: 11 February, asked on the 12th (until 2026-10-13 the 12th, asked on the 13th).
    expect(l.coverEnds).toBe(at(2027, 1, 20, 12));
    expect(l.affiliateBy).toBe(at(2027, 2, 11, 12));
    expect(l.feeCredit).toBe(1_882_00);
    expect(sim.player.school!.uncovered).toEqual([{ from: at(2027, 1, 20, 12) }]);
    tended(sim, sim.now + 2 * MS_DAY);
    // TEST SETUP: urgent care had in the lapse, as `careFor` bills it.
    const bill = careFor(sim, sim.player, { care: 'urgent', what: 'Urgent care' }, sim.now)!;
    const billed = bill.amount;
    expect(billed).toBeGreaterThan(0);
    let shown = drawn(sim, LeavePanel);
    expect(button(shown.html, 'Buy Affiliate Cover…')).toBeDefined();
    expect(shown.text).toContain('Affiliate cover can be bought until February 11, 2027.');
    expect(sim.execute({ kind: 'school.buy_affiliate', payload: {} }).error).toBe('Affiliate cover for the leave’s two terms is $8,950.00, with the $1,882.00 student fee you paid credited, paid in full now. Confirm to buy it.');
    // TEST SETUP: the bank emptied, as spending would leave it.
    drain(sim);
    expect(sim.execute({ kind: 'school.buy_affiliate', payload: { confirm: true } }).error).toBe('Your bank can’t cover it.');
    expect(sim.player.school!.leave!.affiliate).toBeUndefined();
    expect(sim.player.school!.uncovered).toEqual([{ from: at(2027, 1, 20, 12) }]);
    expect(healthOf(sim.player).bills.find((b) => b.id === bill.id)!.amount).toBe(billed);
    expect(memoed(sim, 'Yale Health Affiliate Coverage, a leave of absence')).toHaveLength(0);
    expect(coverOn(sim.player, at(2027, 1, 25))).not.toBe('yale');
    // TEST SETUP: money put in, as savings would hold it.
    fund(sim, 9_000_00);
    // TEST SETUP: Buy Affiliate Cover… pressed (the panel's kind, reason, length and step).
    shown = drawn(sim, LeavePanel, ['medical', 'illness', 2, 'affiliate']);
    expect(shown.text).toContain('Yale Health for the leave’s two terms, $8,950.00, with the $1,882.00 student fee you paid credited, paid in full now; care since your cover ended is billed as Yale Health pays it.');
    pressed('school.buy_affiliate')[0]!.onClick!();
    // Two terms at $5,416, less the spring's $1,882 fee paid.
    expect(sim.player.school!.leave!.affiliate).toMatchObject({ by: 'self', cost: 8_950_00, credit: 1_882_00 });
    const paid = memoed(sim, 'Yale Health Affiliate Coverage, a leave of absence');
    expect(paid).toHaveLength(1);
    expect(Math.max(...paid[0]!.postings.map((q) => q.amount))).toBe(8_950_00);
    // Continuous from the day student cover ended: the lapse closed, and the urgent care Yale Health's, a $0 copay.
    expect(coverOn(sim.player, at(2027, 1, 20, 13))).toBe('yale');
    expect(coverOn(sim.player, at(2027, 1, 25))).toBe('yale');
    expect((sim.player.school!.uncovered ?? []).filter((g) => g.until === undefined)).toHaveLength(0);
    expect(healthOf(sim.player).bills.find((b) => b.id === bill.id)!.amount).toBe(0);
    expect(titled(sim, 'Care Credited')).toHaveLength(1);
    sim = reload(sim);
    expect(sim.player.school!.leave!.affiliate).toMatchObject({ by: 'self', cost: 8_950_00 });
    expect(coverOn(sim.player, at(2027, 1, 25))).toBe('yale');
    expect(sim.execute({ kind: 'school.buy_affiliate', payload: { confirm: true } }).error).toBe('You have it.');
    expect(memoed(sim, 'Yale Health Affiliate Coverage, a leave of absence')).toHaveLength(1);
    expect(titled(sim, 'Care Credited')).toHaveLength(1);
    drawn(sim, LeavePanel);
    expect(pressed('school.buy_affiliate')).toHaveLength(0);
  }, 60_000);

  it('past its deadline it’s refused in its words, with the money there: no cover, no charge, the lapse open, and the button gone', () => {
    const sim = personalLeave('g25-aff-late');
    tended(sim, at(2027, 2, 11, 13));
    // TEST SETUP: money put in, so the deadline alone refuses it.
    fund(sim, 9_000_00);
    expect(button(drawn(sim, LeavePanel).html, 'Buy Affiliate Cover…')).toBeUndefined();
    expect(sim.execute({ kind: 'school.buy_affiliate', payload: { confirm: true } }).error).toBe('It could be bought until February 11, 2027.');
    expect(sim.player.school!.leave!.affiliate).toBeUndefined();
    expect(memoed(sim, 'Yale Health Affiliate Coverage, a leave of absence')).toHaveLength(0);
    expect(coverOn(sim.player, at(2027, 1, 25))).not.toBe('yale');
    expect(sim.player.school!.uncovered).toEqual([{ from: at(2027, 1, 20, 12) }]);
  }, 60_000);

  it('on a medical leave the School pays for it: refused in its words, nothing charged, and covered', () => {
    const sim = medicalLeave('g25-aff-med');
    expect(sim.execute({ kind: 'school.buy_affiliate', payload: { confirm: true } }).error).toBe('The School pays for your Affiliate cover.');
    expect(sim.player.school!.leave!.affiliate).toMatchObject({ by: 'school', cost: 0 });
    expect(memoed(sim, 'Yale Health Affiliate Coverage, a leave of absence')).toHaveLength(0);
    expect(coverOn(sim.player, sim.now + 30 * MS_DAY)).toBe('yale');
  }, 60_000);
});

describe('school.make_up', () => {
  /** The fall's Incompletes: a stay in hospital, 1 October to 10 November, then the evaluation by the clock. TEST SETUP: the stay, as an illness's admission would make it. */
  function incompleteFall(seed: string): Simulation {
    const sim = student(seed);
    tended(sim, at(2026, 10, 1, 8));
    healthOf(sim.player).inHospitalUntil = at(2026, 11, 10, 8);
    tended(sim, at(2026, 12, 14, 10));
    // Acting I, a session short of its three quarters, due a month from the evaluation of Friday 11 December at five.
    expect(sim.player.school!.courses!['0:DRAM 103a/b']).toMatchObject({ name: 'Acting I', result: 'incomplete', owed: 1, madeUp: 0, dueBy: at(2027, 1, 10, 17) });
    return sim;
  }
  const KEY = '0:DRAM 103a/b';

  it('PLAYER JOURNEY: an Incomplete extended a month into the spring’s classes is refused an hour before class and in class, in their words, the clock and the record as they were; made up after class on Make Up A Session in two hours, passed, and its deadline passes with nothing more; through a reload', () => {
    let sim = incompleteFall('g25-makeup');
    expect(sim.must<{ dueBy: number }>({ kind: 'school.extend_incomplete', payload: { key: KEY } })).toEqual({ dueBy: at(2027, 2, 9, 17) });
    sim = reload(sim);
    // Tuesday 12 January 2027 at eight: classes at nine, inside the two hours a session takes.
    tended(sim, at(2027, 1, 12, 8));
    const early = 'Classes starts at 9:00 AM: there isn’t the time before it.';
    let shown = drawn(sim, SchoolWorkspace, [], 'standing');
    expect(shown.text).toContain('Acting I , Incomplete: 1 of 1 make-up sessions left, by February 9, 2027.');
    expect(button(shown.html, 'Make Up A Session')).toContain('disabled=""');
    expect(shown.text).toContain(early);
    expect(sim.execute({ kind: 'school.make_up', payload: { key: KEY } }).error).toBe(early);
    expect(sim.now).toBe(at(2027, 1, 12, 8));
    expect(sim.player.school!.courses![KEY]!.madeUp).toBe(0);
    // At ten, in class.
    tended(sim, at(2027, 1, 12, 10));
    expect(sim.execute({ kind: 'school.make_up', payload: { key: KEY } }).error).toBe('You’re at Classes until 3:00 PM.');
    expect(sim.now).toBe(at(2027, 1, 12, 10));
    expect(sim.player.school!.courses![KEY]!.madeUp).toBe(0);
    // Half past three, classes over: Make Up A Session, pressed, takes two hours and passes it.
    tended(sim, at(2027, 1, 12, 15, 30));
    shown = drawn(sim, SchoolWorkspace, [], 'standing');
    expect(button(shown.html, 'Make Up A Session')).not.toContain('disabled');
    const make = pressed('school.make_up');
    expect(make).toHaveLength(1);
    make[0]!.onClick!();
    expect(sim.now).toBe(at(2027, 1, 12, 17, 30));
    const r = sim.player.school!.courses![KEY]!;
    expect(r).toMatchObject({ result: 'pass', why: 'made up after an Incomplete', madeUp: 1 });
    const open = degreeShortfall(sim.player.school!);
    expect([...open.failed, ...open.incomplete].map((x) => x.code)).not.toContain('DRAM 103a/b');
    expect(pendingOf(sim, INCOMPLETE_DUE_KIND).filter((i) => i.payload.key === KEY)).toHaveLength(0);
    expect(sim.execute({ kind: 'school.make_up', payload: { key: KEY } }).error).toBe('There’s no Incomplete in that course to make up.');
    sim = reload(sim);
    tended(sim, at(2027, 2, 10, 12));
    expect(sim.player.school!.courses![KEY]!.result).toBe('pass');
    expect(titled(sim, 'Permanent Incomplete: Acting I')).toHaveLength(0);
  }, 60_000);

  it('a session begun an hour before its month runs out, which it can’t hold, is refused in its words, and the course isn’t passed after its deadline made it permanent', () => {
    const sim = incompleteFall('g25-makeup-late');
    // Sunday 10 January 2027 at four: an hour of the month left, and a session takes two.
    tended(sim, at(2027, 1, 10, 16));
    const made = sim.execute<{ passed: boolean }>({ kind: 'school.make_up', payload: { key: KEY } });
    expect(made.error).toBe('Its month runs out at 5:00 PM: there isn’t the time for a session before it.');
    expect(sim.now).toBe(at(2027, 1, 10, 16));
    expect(sim.player.school!.courses![KEY]!.madeUp).toBe(0);
    tended(sim, at(2027, 1, 10, 18));
    expect(sim.player.school!.courses![KEY]!.result).toBe('permanent');
    expect(titled(sim, 'Permanent Incomplete: Acting I')).toHaveLength(1);
  }, 60_000);
});
