/**
 * Four school defects found by the triage of 2026-10-12, each held here against the engine and the screen that shows it
 * (from 2026-10-12): the Classes tab showed the calendar year's week and courses, not the student's, after a leave or a
 * repeated year, capped its term at the sixth, and listed a year's courses in an additional term; a scholarship charged
 * back on a leave was owed with no due date, so it never brought a hold or a late fee; Call In Sick stayed on the
 * Classes tab, grayed, after the student had left; and an additional term's semester count carried a term that always
 * added nothing, so the rule it stood for (a term skipped before it isn't a semester) was held by no test.
 *
 * The screens are rendered to markup (react-dom/server) over real saves, as tests/defects-g8-2.test.ts renders them:
 * `useGame` stands in for the provider, `run` is the save's own `execute`, and Gated is the real one with its onClick
 * kept so the test can see it drawn. PLAYER JOURNEYS play through commands; FIXTURES set a state by hand to reach one
 * rule, and say so.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { EXTENDED_STUDY } from '@/engine/content/school';
import { classPeriod, coursesFor, evaluate, sickRefusal, termLabel, termOf, timetable } from '@/engine/systems/school';
import { ACCOUNT_DUE_KIND, accountOwed, extraRefusal } from '@/engine/systems/leave';
import { healthOf } from '@/engine/systems/health';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; disabled?: boolean }[],
}));

// The School screen's kept tab, at Classes: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? 'classes' : initial) as T, () => undefined] as const };
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
  return { ...real, Gated: (props: Parameters<typeof real.Gated>[0]) => { h.clicks.push({ feature: props.feature, disabled: props.disabled }); return ce(real.Gated, props); } };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** Played by somebody who looks after themselves, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);
/** FIXTURE: money in the bank, as savings would be. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const today = (sim: Simulation) => { const p = zonedParts(sim.now, zone); return { year: p.year, month: p.month, day: p.day }; };

/** A screen as the player has it: its markup, and its text with the tags taken out; the Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, screen: FunctionComponent): { html: string; text: string } {
  h.sim = sim;
  h.clicks = [];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);
/** The course names in the Classes tab's Your Week table, the first table on it, each meeting once. */
const weekNames = (html: string) => [...(html.match(/<table>[\s\S]*?<\/table>/)?.[0] ?? '').matchAll(/<td>(?:<[^>]+>)*([^<]+)(?:<\/[^>]+>)*<\/td>/g)].map((m) => m[1]!).filter((x) => !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(x));
/** The same, as the engine's timetable has it for a year and season. */
const timetableNames = (year: 1 | 2 | 3, season: 'fall' | 'spring') => timetable(year, season).flatMap((d) => d.slice(0, 3).map((c) => c.name));
const sorted = (xs: string[]) => [...xs].sort();

/** FIXTURE: the clock and the record brought to a calendar term, as playing three years would (tests/defects-g10-1.test.ts's). */
const placed = (seed: string, term: number, record: Record<string, unknown>) => {
  const sim = student(seed);
  Object.assign(sim.player.school!, record);
  sim.universe.now = instantFromZoned({ ...classPeriod(term).from, hour: 7 }, zone);
  return sim;
};

describe('The Classes tab, a year behind or past the sixth term', () => {
  it('PLAYER JOURNEY: back from a first-fall leave, shows the first year’s week and courses, which the engine schedules', () => {
    const sim = student('g8-3-classes');
    tended(sim, at(2026, 10, 5));
    // FIXTURE: the flu, as `careFor` gives one.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tended(sim, asked.decideAt + MS_HOUR);
    tended(sim, at(2027, 5, 1));
    sim.must({ kind: 'school.return_notice', payload: {} });
    tended(sim, at(2027, 8, 24, 12));
    const school = sim.player.school!;
    expect(school.leaves!.at(-1)!.status).toBe('returned');
    expect(termOf(today(sim))).toBe(2);
    expect(school.offset).toBe(2);
    const { html, text } = drawn(sim, SchoolWorkspace);
    expect(text).toContain(`Your Week, ${termLabel(2)}`);
    expect(text).toContain('Year 1: nine to three on class days');
    expect(text).toContain('Year 1 Courses');
    expect(text).not.toContain('Year 2 Courses');
    // The week is the first year's fall, and every course the engine meets them for on a class day is in it.
    const week = weekNames(html);
    expect(sorted(week)).toEqual(sorted(timetableNames(1, 'fall')));
    let d = classPeriod(2).from;
    while (!coursesFor(school, d).length) d = { ...d, day: d.day + 1 };
    for (const c of coursesFor(school, d)) expect(week).toContain(c.name);
  }, 120_000);

  it('a third-year fall after a leave is that fall, named and timed as the calendar has it, with the third year’s fall week', () => {
    const sim = placed('g8-3-third', 6, { termsBegun: 7, offset: 2, enrolled: [2, 3, 4, 5, 6] });
    const { html, text } = drawn(sim, SchoolWorkspace);
    expect(termLabel(6)).toBe('Fall Term 2029');
    expect(text).toContain(`Your Week, ${termLabel(6)}`);
    expect(text).toContain('Year 3: nine to three on class days');
    expect(sorted(weekNames(html))).toEqual(sorted(timetableNames(3, 'fall')));
    expect(text).toContain(`This term’s classes run from ${formatDate(instantFromZoned({ ...classPeriod(6).from, hour: 12 }, zone), zone)}`);
  });

  it('in an additional term, shows only the courses retaken, on their own days, as `coursesFor` schedules them', () => {
    const sim = placed('g8-3-extra', 6, { termsBegun: 7, enrolled: [0, 1, 2, 3, 4, 5, 6], extra: { term: 6, courses: [{ code: 'DRAM 153a', academic: 0, name: 'Play' }] } });
    const { html, text } = drawn(sim, SchoolWorkspace);
    expect(text).toContain(`Your Week, ${termLabel(6)}`);
    expect(weekNames(html)).toEqual(['Play']);
    expect(text).toContain('Your Additional Term’s Courses');
    expect(text).not.toMatch(/Year \d Courses/);
    // The table's second, the courses: Play alone.
    const courses = [...html.matchAll(/<table>[\s\S]*?<\/table>/g)][1]![0];
    expect(courses).toContain('DRAM 153a');
    expect(courses.match(/<tr>/g)).toHaveLength(2);
  });
});

describe('PLAYER JOURNEY: a scholarship returned on a leave', () => {
  it('is due in thirty days, said when the leave begins, and unpaid brings the hold and the late fee', () => {
    const sim = student('g8-3-aid', { family: undefined, wealth: 'scraping' });
    tended(sim, at(2027, 1, 13, 12));
    const asked = sim.must<{ firstTerm: number; startsNow: boolean; decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    expect(asked).toMatchObject({ firstTerm: 1, startsNow: true });
    tended(sim, asked.decideAt + MS_HOUR);
    const school = sim.player.school!;
    const l = school.leave!;
    expect(l.status).toBe('on');
    expect(l.aidReturned).toBeGreaterThan(0);
    expect(accountOwed(sim, sim.player)).toBe(l.aidReturned);
    // Its due date, on the calendar and in the notice.
    const due = pendingOf(sim, ACCOUNT_DUE_KIND);
    expect(due).toHaveLength(1);
    expect(due[0]!.at).toBe(l.startedAt! + EXTENDED_STUDY.dueDays * MS_DAY);
    expect(due[0]!.payload.term).toBe(l.firstTerm);
    expect(titled(sim, 'Your Leave Has Begun')[0]!.body).toContain(`on your Yale account, due by ${formatDate(due[0]!.at, zone)}`);
    // Unpaid past it: the hold, and the month's late fee on top of what's owed.
    expect(school.hold).toBeUndefined();
    tended(sim, due[0]!.at + MS_HOUR);
    expect(school.hold).toBeDefined();
    expect(school.lateFees?.[String(l.firstTerm)]).toBe(EXTENDED_STUDY.lateFee);
    expect(accountOwed(sim, sim.player)).toBe(l.aidReturned! + EXTENDED_STUDY.lateFee);
    expect(titled(sim, 'A Financial Hold')).toHaveLength(1);
    // Paid, it lifts.
    fund(sim, accountOwed(sim, sim.player) + 100_00);
    sim.must({ kind: 'school.pay_balance', payload: {} });
    expect(school.hold).toBeUndefined();
  }, 120_000);
});

describe('Call In Sick, once the student has left', () => {
  it('PLAYER JOURNEY: shows on a class day at school, and not at all after a withdrawal', () => {
    const sim = student('g8-3-sick');
    tended(sim, at(2026, 9, 9, 7));
    drawn(sim, SchoolWorkspace);
    expect(drew('school.call_in_sick')).toHaveLength(1);
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(sim.player.school!.standing).toBe('withdrawn');
    // The refusal the button would have shown, grayed, for good.
    expect(sickRefusal(sim, sim.player)).toBe('You’re not at school.');
    const { text } = drawn(sim, SchoolWorkspace);
    expect(drew('school.call_in_sick')).toHaveLength(0);
    expect(text).not.toContain('Call In Sick');
  }, 60_000);
});

describe('An additional term’s semesters', () => {
  it('don’t count a term skipped before it: eight enrolled and a spring course failed, next spring’s retake is the ninth, offered', () => {
    const sim = student('g8-3-ninth');
    tended(sim, at(2026, 9, 2));
    const school = sim.player.school!;
    // FIXTURE: a repeated year behind them, eight terms enrolled, and the last spring's course failed at its evaluation.
    Object.assign(school, { termsBegun: 8, enrolled: [0, 1, 2, 3, 4, 5, 6, 7], offset: 2, classOf: 2030, standing: 'good', repeatedYears: [1] });
    school.courses = { '7:DRAM 393b': { term: 7, academic: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 6, excused: 0, result: 'fail', why: 'TEST SETUP' } };
    Object.assign(school.tally, { classDays: 40, attended: 40, excused: 0 });
    evaluate(sim, sim.player, 7);
    // A repeat would make ten; the additional term, the spring after the fall skipped, makes nine.
    expect(school.repeatBy).toBeGreaterThan(sim.now);
    const plan = extraRefusal(sim, sim.player);
    expect(plan.why).toBeUndefined();
    expect(plan.term).toBe(9);
    expect(sim.execute({ kind: 'school.request_extra_term', payload: {} }).ok).toBe(true);
  }, 60_000);
});
