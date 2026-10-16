/**
 * School, money and papers as connected journeys (brief 09, section 6, 2026-10-16): where one area's change of the last
 * pass reaches another's system, played through the commands and the clock on lives creation offers, through save and
 * load, and in one jump against small steps. docs/verification/remaining-09/journeys-checklist.json is the list, written
 * before any change; journeys-result.json is what came of it.
 *
 * The lives (`createSave` with `newLifeConfig`, the family chosen as creation chooses it, `withFamily`): Ada Cole, born
 * in New York or London, at Yale in New Haven from Monday 24 August 2026. The seeds are arbitrary, none picked for what
 * it draws, except where a draw is the point and the seed was searched for it, said where it's used: j9-grad, jy-1,
 * jw-1, jw-2, jw-3, jl-1 (searched, jl-1 to jl-40: an appointment booked in a leave's lapse), je-5 (searched, je-1 to
 * je-6: a New Yorker whose one photo ID is a license that runs out mid-program).
 *
 * Found on the way, and fixed 2026-10-16 (each DEFECT test below failed before its fix):
 * - A graduate's School page said “Only the terms to come stand between you and the degree.”, “58 of 58 courses passed so
 *   far.”, “In the casting pool.”, each of the term's floors still ahead, Not Cast Yet and Nothing Set Yet. Found in the
 *   built app that day, and played here to the degree.
 * - The 60 days to enroll after losing Yale Health ran from the month's look that found it lost, not from the loss (45 CFR
 *   155.420(c)(1)), and the notice said “You have 60 days” whenever it came, and nothing of HUSKY D taking her that day.
 * - An appointment booked at Fair Haven in a personal leave's lapse stayed there once Affiliate cover was bought, and
 *   nothing said Yale Health pays only at its own Health Center until the visit's bill, $187.20.
 * - A license run out had nothing in its row on Papers: a New Yorker whose one photo ID it was met it first as a bank's
 *   refusal.
 *
 * Every figure is worked here from the rules' own numbers and written as a literal: the Bulletin's 2026–2027 living
 * expenses, $28,028, health plan, $3,764, and books, $2,373, so a term's living-expense scholarship of ($28,028 − $3,764
 * + $2,373 + $3,764) / 2 = $15,200.50 with need found; the rebate schedule's half for a leave begun with more than a tenth
 * and no more than a quarter of the term's classes gone (p.183); Affiliate cover's $5,416 a term less the term's $1,882
 * student fee paid; the account's $125 late fee a month to $375 a term, thirty days after it's due; the marketplace's 60
 * days; Yale Health's thirty days after a withdrawal (p.174); Commencement on the Monday before Memorial Day.
 *
 * TEST SETUP, said again where it's done: the dials set each time the clock moves six hours (rested, fed, awake), as
 * tests/remaining-school-term.test.ts plays a term; and, where a life must reach the degree or keep its standing, every
 * open piece's parts prepared each midnight, as tests/scope-school.test.ts prepares them.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeConfig, newLifeFrom, withFamily, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf } from '@/engine/systems/coursework';
import { HEALTH_WEEK_KIND, WORK_DECIDED_KIND, coverOn, hardshipRefusal, healthOf, mayEnroll } from '@/engine/systems/health';
import { accountOwed, yaleAccount } from '@/engine/systems/leave';
import { classPeriod } from '@/engine/systems/school';
import { photoIdOf } from '@/engine/systems/documents';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tab: 'standing',
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
}));

// The screens' kept tab, at the one the test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key.startsWith('tab:') ? h.tab : initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A Gated button drawn as it is, its feature, words, title and state kept so a test can press it as the player would.
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, label: words(props.children), title: props.title, disabled: Boolean(props.disabled), onClick: props.onClick as never });
      return ce('button', { 'data-feature': props.feature, disabled: props.disabled, title: props.title }, props.children);
    },
    useFeature: () => ({ open: true }),
  };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, hour = 9, minute = 0): Instant => instantFromZoned({ year: y, month: m, day: d, hour, minute }, NY);
const dated = (t: Instant) => formatDate(t, NY);

/** TEST SETUP: every open piece's parts prepared each midnight, as tests/scope-school.test.ts prepares them. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const life = (seed: string, wealth: NewSaveConfig['wealth'], extra: Partial<NewSaveConfig> = {}, work = true) => {
  const sim = createSave(1, seed, withFamily({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra }, wealth!));
  return work ? working(sim) : sim;
};
const reload = (sim: Simulation, work = true) => { const back = loadSave(deserialise(serialise(sim.universe)) as never); return work ? working(back) : back; };
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tend = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const refused = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => { const r = sim.execute({ kind, payload }); expect(r.ok, `${kind} should be refused`).toBe(false); return r.error; };
const ok = <T,>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => { const r = sim.execute<T>({ kind, payload }); expect(r.error, `${kind}`).toBeUndefined(); return r.value as T; };
const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const drawn = (sim: Simulation, C: () => JSX.Element | null, tab: string) => { h.sim = sim; h.tab = tab; h.clicks = []; return text(renderToStaticMarkup(createElement(C))); };
const account = (sim: Simulation, name: string) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.name === name && !a.closedAt)!;
/** Nothing a refusal moves: the clock, the ledger, the calendar's length, the person. */
const still = (sim: Simulation) => JSON.stringify([sim.now, sim.universe.transactions.length, sim.universe.scheduled.length, sim.player]);

// ---------------------------------------------------------------------------
// journeys.known-graduated-school-page
// ---------------------------------------------------------------------------

const STALE = ['Only the terms to come stand between you and the degree.', 'courses passed so far', 'In the casting pool.', 'is the floor', 'or more is short', 'Not Cast Yet', 'Nothing set yet'];

describe('journeys.known-graduated-school-page: the School page once the School has ended', () => {
  it('DEFECT: a life played to the degree reads it on its Standing, Casting and Coursework tabs, before and after a reload: the degree conferred at Commencement on Monday 21 May 2029, every course passed, the last term’s figures with their floors in the past, no casting and no work ahead (until 2026-10-16 “Only the terms to come stand between you and the degree.”, “so far”, “In the casting pool.”, each floor ahead, Not Cast Yet and Nothing set yet)', () => {
    const sim = life('j9-grad', 'wealthy');
    // In the first fall, at school, the page says what's so then: the terms to come.
    tend(sim, at(2026, 10, 1, 12));
    const first = drawn(sim, SchoolWorkspace, 'standing');
    expect(first).toContain('courses passed so far. Only the terms to come stand between you and the degree.');
    expect(first).toContain('Attendance This Term');
    expect(first).toContain('90% is the floor');
    expect(first).toContain('In the casting pool.');
    tend(sim, at(2029, 6, 2, 12));
    expect(sim.player.school!.standing).toBe('graduated');
    // Commencement, the Monday before Memorial Day (28 May 2029), at ten.
    expect(sim.player.school!.endedAt).toBe(at(2029, 5, 21, 10));
    for (const s of [sim, reload(sim)]) {
      const standing = drawn(s, SchoolWorkspace, 'standing');
      const all = Object.values(s.player.school!.courses ?? {});
      expect(all.every((r) => r.result === 'pass')).toBe(true);
      expect(standing).toContain(`${all.length} of ${all.length} courses passed. Every course the degree needs was passed, and it was conferred on May 21, 2029.`);
      expect(standing).toContain('Attendance Last Term');
      expect(standing).toContain('90% was the floor');
      expect(standing).toContain('half its pace was the floor');
      expect(standing).toContain('half of 3 or more was short');
      const casting = drawn(s, SchoolWorkspace, 'casting');
      expect(casting).toContain('No Casting Ahead');
      expect(casting).toContain('The chair casts students at the School, and your degree is conferred: no casting comes now. The productions you played stay on your Profile.');
      const coursework = drawn(s, SchoolWorkspace, 'coursework');
      expect(coursework).toContain('Your degree is conferred: no course sets work now.');
      for (const page of [standing, casting, coursework]) for (const stale of STALE) expect(page, stale).not.toContain(stale);
    }
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('PLAYER JOURNEY: a withdrawal in the first fall says how it ended, offers no repeat, no casting and no work, and keeps saying so through a reload; the course record stays as it was', () => {
    let sim = life('jw-1', 'modest');
    tend(sim, at(2026, 10, 5, 12));
    expect(refused(sim, 'school.withdraw')).toBe('Withdrawing gives up your place at the School. Confirm to go ahead.');
    const record = JSON.stringify(sim.player.school!.courses);
    ok(sim, 'school.withdraw', { confirm: true });
    expect(refused(sim, 'school.withdraw', { confirm: true })).toBe('You’re not at school.');
    expect(JSON.stringify(sim.player.school!.courses)).toBe(record);
    sim = reload(sim);
    const standing = drawn(sim, SchoolWorkspace, 'standing');
    const all = Object.values(sim.player.school!.courses ?? {});
    const passed = all.filter((r) => r.result === 'pass').length;
    expect(standing).toContain(`${passed} of ${all.length} courses passed. You withdrew. The Bulletin lets a student who withdrew apply to come back; SLATE doesn’t model a return.`);
    expect(standing).toContain('Attendance Last Term');
    // The fall's courses, left in the middle: Not Finished, and not listed with the term's meetings as if still taken.
    expect(standing).toContain('Fall Term 2026, DRAM 103a/b Acting I: Not Finished');
    expect(standing).not.toContain('In Progress');
    expect(standing).not.toMatch(/Acting I: at \d+ of \d+ meetings/);
    expect(drawn(sim, SchoolWorkspace, 'casting')).toContain('The chair casts students at the School, and you’ve left it: no casting comes now.');
    expect(drawn(sim, SchoolWorkspace, 'coursework')).toContain('You’ve left the School: no course sets work now.');
    for (const tab of ['standing', 'casting', 'coursework']) for (const stale of STALE) expect(drawn(sim, SchoolWorkspace, tab), stale).not.toContain(stale);
  }, 120_000);
});

describe('journeys.known-graduated-school-page: a dismissal', () => {
  it('PLAYER JOURNEY: a student who never prepares her coursework (jd-1, the dials tended and no work done) is dismissed at Fall Term 2027’s evaluation, concern then warning before it; the page says so, with no way back, no casting and no work, through a reload', () => {
    let sim = life('jd-1', 'modest', {}, false);
    tend(sim, at(2027, 12, 20, 12));
    const school = sim.player.school!;
    expect(school.history.map((e) => e.standing)).toEqual(['concern', 'warning', 'dismissed']);
    expect(dated(school.endedAt!)).toBe('December 10, 2027');
    sim = reload(sim, false);
    const standing = drawn(sim, SchoolWorkspace, 'standing');
    const all = Object.values(sim.player.school!.courses ?? {});
    const passed = all.filter((r) => r.result === 'pass').length;
    expect(standing).toMatch(new RegExp(`${passed} of ${all.length} courses passed\\. You were dismissed(, with [^.]+ not passed)?\\. Once dismissed, a student isn’t eligible to come back\\.`));
    expect(drawn(sim, SchoolWorkspace, 'casting')).toContain('The chair casts students at the School, and you’ve left it: no casting comes now.');
    expect(drawn(sim, SchoolWorkspace, 'coursework')).toContain('You’ve left the School: no course sets work now.');
    for (const tab of ['standing', 'casting', 'coursework']) for (const stale of STALE) expect(drawn(sim, SchoolWorkspace, tab), stale).not.toContain(stale);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// journeys.x1: a Yale payment drawing on savings, then the hold, then registration
// ---------------------------------------------------------------------------

const yalePostings = (sim: Simulation) => {
  const yale = yaleAccount(sim, sim.player, false);
  return sim.universe.transactions.flatMap((t) => t.postings.filter((q) => q.accountId === yale?.id).map((q) => [t.memo, q.amount]));
};
const holdNotices = (sim: Simulation) => titled(sim, 'A Financial Hold').map((n) => [dated(n.at), n.body]);

/**
 * jy-1, Modest (need found): played to the spring, a personal leave asked on Wednesday 20 January 2027 and begun at its
 * decision at noon five Yale working days on (Monday 18 January, Martin Luther King Day, a holiday before it); most of Chase Total
 * Checking moved into Chase Savings by the player's own transfer; Affiliate cover bought, drawing on both; $100.00 paid on
 * the Yale account. Kept as a save, which each twin opens.
 */
const leaveTaken = (() => {
  let kept: { save: string; checking: number; savings: number } | undefined;
  return () => kept ??= (() => {
    let sim = life('jy-1', 'modest');
    tend(sim, at(2027, 1, 20, 12));
    // The spring's scholarship as the rule gives it: ($28,028 − $3,764 + $2,373 + $3,764) / 2, less the $1,882 plan.
    expect(titled(sim, 'Spring Term 2027 Begins').map((n) => n.body)).toEqual(['Your living-expense scholarship of $15,200.50 met this term’s Yale Health plan, $1,882.00, and $13,318.50 is in your Chase Total Checking. Tuition, $20,375.00 a term, is covered by the tuition scholarship.']);
    const asked = ok<{ decideAt: Instant; firstTerm: number; startsNow: boolean }>(sim, 'school.request_leave', { kind: 'personal', reason: 'financial' });
    expect(asked).toEqual({ decideAt: at(2027, 1, 27, 12), firstTerm: 1, startsNow: true });
    expect(refused(sim, 'school.request_leave', { kind: 'personal', reason: 'financial' })).toBe('Your request is with the chair and the dean, decided by January 27, 2027.');
    sim = reload(sim);
    tend(sim, asked.decideAt + MS_HOUR);
    const l = sim.player.school!.leave!;
    expect(l).toMatchObject({ status: 'on', startedAt: at(2027, 1, 27, 12), aidReturned: 7_600_25 });
    // Spring Term 2027's classes run from Monday 11 January to Friday 23 April: on 27 January 16 days of 103 had gone,
    // more than a tenth and no more than a quarter, so the rebate schedule sends half the term's $15,200.50 back.
    const period = classPeriod(1);
    expect([period.from, period.to]).toEqual([{ year: 2027, month: 1, day: 11 }, { year: 2027, month: 4, day: 23 }]);
    expect(accountOwed(sim, sim.player)).toBe(7_600_25);
    expect(titled(sim, 'Your Leave Has Begun')[0]!.body).toContain('$7,600.25 of the term’s scholarship goes back on the rebate schedule, on your Yale account, due by February 26, 2027. Yale Health’s student cover ended today. Affiliate cover, $5,416.00 a term, can be bought until February 19, 2027.');
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    // The player's own move: all but $500.00 of the current account into the savings beside it, at once at one bank.
    const checking = account(sim, 'Chase Total Checking');
    const savings = account(sim, 'Chase Savings');
    const moved = checking.balance - 500_00;
    expect(ok<{ moved: number; arrivesAt?: number }>(sim, 'bank.transfer', { fromId: checking.id, toId: savings.id, amount: moved })).toMatchObject({ moved });
    expect(checking.balance).toBe(500_00);
    const saved = savings.balance;
    // Affiliate cover: asked without confirming, its price and nothing moved; two terms at $5,416.00 less the $1,882.00 paid.
    const before = still(sim);
    expect(refused(sim, 'school.buy_affiliate')).toBe('Affiliate cover for the leave’s two terms is $8,950.00, with the $1,882.00 student fee you paid credited, paid in full now. Confirm to buy it.');
    expect(still(sim)).toBe(before);
    expect(ok<{ cost: number; credit: number }>(sim, 'school.buy_affiliate', { confirm: true })).toEqual({ cost: 8_950_00, credit: 1_882_00 });
    // $500.00 from the current account, the rest from the savings beside it (banking.s7.school).
    expect(checking.balance).toBe(0);
    expect(saved - savings.balance).toBe(8_450_00);
    expect(refused(sim, 'school.buy_affiliate', { confirm: true })).toBe('You have it.');
    expect(coverOn(sim.player, sim.now)).toBe('yale');
    // A part of the Yale account paid, from savings now; more than owed, and nothing, refused in their words.
    expect(refused(sim, 'school.pay_balance', { amount: 7_600_26 })).toBe('$7,600.25 is owed; pay that or less.');
    expect(refused(sim, 'school.pay_balance', { amount: 0 })).toBe('Pay something.');
    expect(ok(sim, 'school.pay_balance', { amount: 100_00 })).toEqual({ owed: 7_500_25, held: false });
    expect(saved - savings.balance).toBe(8_550_00);
    expect(breaches(sim.universe)).toEqual([]);
    return { save: serialise(sim.universe), checking: checking.balance, savings: savings.balance };
  })();
})();
const fromLeave = () => working(loadSave(deserialise(leaveTaken().save) as never));

describe('journeys.x1: a Yale payment drawing on savings, then the hold, then registration', () => {
  it('PLAYER JOURNEY: a Modest student’s personal leave sends half the spring’s scholarship back to her Yale account; she moves her money into savings, buys Affiliate cover from both accounts and pays $100.00 from savings; unpaid, the hold comes at thirty days with $125.00 a month to $375.00, the same in one jump as in six-hour steps', () => {
    leaveTaken();
    const steps = fromLeave();
    tend(steps, at(2027, 10, 1, 12));
    const jump = fromLeave();
    jump.advanceTo(at(2027, 10, 1, 12));
    for (const sim of [steps, jump]) {
      const school = sim.player.school!;
      expect(school.hold).toBe(at(2027, 2, 26, 12));
      expect(school.lateFees).toEqual({ 1: 375_00 });
      expect(accountOwed(sim, sim.player)).toBe(7_875_25);
      expect(yalePostings(sim)).toEqual([
        ['Living-expense scholarship returned on the rebate schedule (50%), Spring Term 2027: leave of absence', -7_600_25],
        ['Payment: Yale Student Account', 100_00],
        ['Late payment fee, Spring Term 2027', -125_00],
        ['Late payment fee, Spring Term 2027', -125_00],
        ['Late payment fee, Spring Term 2027', -125_00],
      ]);
      // Each thirty days while owed: the fee to the term's cap, then the hold said again without one, from 27 May; the same
      // words said again while unread are one notice brought up to the latest, 24 September (`Simulation.notify`).
      const told = (owed: string, fee: boolean) => `${owed} is owed on your Yale account${fee ? ', with a $125.00 late fee' : ''}. While it’s unpaid, a hold stops registration and the diploma. Pay it on the Terms And Award tab.`;
      expect(holdNotices(sim)).toEqual([
        ['February 26, 2027', told('$7,625.25', true)], ['March 28, 2027', told('$7,750.25', true)], ['April 27, 2027', told('$7,875.25', true)],
        ['September 24, 2027', told('$7,875.25', false)],
      ]);
      expect(coverOn(sim.player, sim.now)).toBe('yale');
      expect(breaches(sim.universe)).toEqual([]);
      expect(sim.ledger.audit()).toEqual([]);
    }
    expect(JSON.stringify(jump.player.school!.leave)).toBe(JSON.stringify(steps.player.school!.leave));
  }, 300_000);

  it('PLAYER JOURNEY: back for Spring Term 2028 under the hold, registration is refused in its words; she moves her money into savings again and pays it from both, the hold lifts once, she registers, and the term’s first class day counts her, through a reload', () => {
    let sim = fromLeave();
    tend(sim, at(2027, 10, 1, 12));
    const notice = ok<{ noticeAt: Instant; returnsAt: Instant }>(sim, 'school.return_notice');
    expect(notice).toEqual({ noticeAt: sim.now, returnsAt: at(2028, 1, 3, 9) });
    expect(refused(sim, 'school.return_notice')).toBe('You gave notice on October 1, 2027.');
    sim = reload(sim);
    tend(sim, at(2028, 1, 3, 10));
    const school = () => sim.player.school!;
    expect(school().leaves!.at(-1)!.status).toBe('returned');
    expect(school().mustRegister).toBe(true);
    expect(titled(sim, 'Back From Your Leave')).toHaveLength(1);
    // Under the hold since 26 February 2027: the $7,600.25 sent back, less the $100.00 paid, and the term's $375.00 of fees.
    expect(school().hold).toBe(at(2027, 2, 26, 12));
    expect(accountOwed(sim, sim.player)).toBe(7_875_25);
    const before = still(sim);
    expect(refused(sim, 'school.reregister')).toBe('A financial hold stops registration: $7,875.25 is owed on your Yale account.');
    expect(still(sim)).toBe(before);
    // The player's own move again, all but $1,000.00 into savings, so the payment draws on both.
    const checking = account(sim, 'Chase Total Checking');
    const savings = account(sim, 'Chase Savings');
    ok(sim, 'bank.transfer', { fromId: checking.id, toId: savings.id, amount: checking.balance - 1_000_00 });
    const saved = savings.balance;
    expect(ok(sim, 'school.pay_balance')).toEqual({ owed: 0, held: false });
    expect(checking.balance).toBe(0);
    expect(saved - savings.balance).toBe(6_875_25);
    expect(school().hold).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted').map((n) => n.body)).toEqual(['Your Yale account is paid. Registration and the diploma are open to you again.']);
    expect(refused(sim, 'school.pay_balance')).toBe('Your Yale account owes no balance.');
    expect(ok<{ registeredAt: Instant }>(sim, 'school.reregister').registeredAt).toBe(sim.now);
    expect(refused(sim, 'school.reregister')).toBe('You’re registered.');
    sim = reload(sim);
    // Monday 10 January 2028, the term's first class day: counted.
    tend(sim, at(2028, 1, 10, 18));
    const met = Object.values(sim.player.school!.courses ?? {}).filter((r) => r.term === 3);
    expect(met.length).toBeGreaterThan(0);
    for (const r of met) expect(r.attended).toBe(r.meetings);
    expect(titled(sim, 'Not Registered')).toHaveLength(0);
    expect(titled(sim, 'The Financial Hold Is Lifted')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// journeys.x2: a leave and its Affiliate cover, then a bill
// ---------------------------------------------------------------------------

describe('journeys.x2: a leave and its Affiliate cover, then a bill', () => {
  it('DEFECT: a doctor’s visit booked at Fair Haven in a personal leave’s lapse is said to be outside Yale Health once Affiliate cover is bought, in a notice and on Papers, and the way to be seen at Yale Health is taken: called off, booked again, seen the next weekday for nothing; kept, it’s billed as the uninsured’s, as Papers priced it (until 2026-10-16 nothing said so until the bill)', () => {
    // jl-1, Modest: searched (jl-1 to jl-40) for a life whose draw brings a doctor's visit to be booked in a leave's lapse.
    let sim = life('jl-1', 'modest');
    tend(sim, at(2027, 1, 20, 12));
    const asked = ok<{ decideAt: Instant }>(sim, 'school.request_leave', { kind: 'personal', reason: 'family' });
    tend(sim, asked.decideAt + MS_HOUR);
    tend(sim, at(2027, 2, 10, 12));
    // Uncovered since the leave began on 27 January: the visit is booked at the town's first practice, Fair Haven.
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    const [appointment] = healthOf(sim.player).appointments!;
    expect(appointment).toMatchObject({ at: at(2027, 3, 4, 10), clinicId: 'us-ct-fhchc-grand' });
    expect(titled(sim, 'A Doctor’s Appointment').at(-1)!.body).toBe('A doctor’s visit: booked at Fair Haven Community Health Care for March 4, 2027, the wait where you live.');
    // What Papers prices it at there, before the cover changes and after: the bill it brings, kept.
    ok(sim, 'school.buy_affiliate', { confirm: true });
    expect(coverOn(sim.player, appointment!.at)).toBe('yale');
    const outside = 'A doctor’s visit on March 4, 2027 at Fair Haven Community Health Care: booked while Yale Health didn’t cover you, it stays where it was booked, and Yale Health pays for a visit only at its own Health Center. Call it off under Your Doctor on Papers, then Book An Appointment, and you’re seen there.';
    expect(titled(sim, 'Your Appointment Is Outside Yale Health').map((n) => n.body)).toEqual([outside]);
    const papers = drawn(sim, PapersWorkspace, 'health');
    expect(papers).toContain('A doctor’s visit: an appointment March 4, 2027, Fair Haven Community Health Care. Yale Health pays for a visit only at its own Health Center: call this off, then Book An Appointment, to be seen there');
    const priced = /Fair Haven Community Health Care, A Visit (\$[\d,]+\.\d\d)/.exec(papers)?.[1];
    expect(priced).toBeDefined();
    // A twin that keeps it: billed at Fair Haven as the uninsured's, the figure Papers gave, and told why.
    const kept = reload(sim);
    tend(kept, at(2027, 3, 4, 18));
    expect(titled(kept, 'A Doctor’s Visit').at(-1)!.body).toBe(`A doctor’s visit, Fair Haven Community Health Care. Yale Health pays for a visit at its own Health Center, not here. Your share is ${priced}, due in 30 days.`);
    // The player's way: called off under Your Doctor, then booked again: Yale Health's Student Health, the next weekday.
    sim = reload(sim);
    expect(titled(sim, 'Your Appointment Is Outside Yale Health')).toHaveLength(1);
    expect(ok(sim, 'health.cancel_appointment', { appointmentId: appointment!.id })).toEqual({ canceled: true });
    expect(healthOf(sim.player).owedVisit).toBe('A doctor’s visit');
    expect(ok<{ at: Instant }>(sim, 'health.book').at).toBe(at(2027, 2, 11, 10));
    expect(healthOf(sim.player).appointments!.map((a) => a.clinicId)).toEqual(['us-ct-yalehealth-studenthealth']);
    expect(refused(sim, 'health.book')).toBe('There’s nothing to see a doctor about.');
    expect(drawn(sim, PapersWorkspace, 'health')).not.toContain('call this off, then Book An Appointment');
    tend(sim, at(2027, 2, 11, 18));
    expect(titled(sim, 'A Doctor’s Visit').at(-1)!.body).toBe('A doctor’s visit, Yale Health Center, Student Health. Nothing to pay.');
    expect(titled(sim, 'Your Appointment Is Outside Yale Health')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// journeys.x3: a withdrawal, then health eligibility, then tax and Papers
// ---------------------------------------------------------------------------

describe('journeys.x3: a withdrawal, then health eligibility, then tax and Papers', () => {
  it('DEFECT: withdrawn on 15 February 2027, Yale Health out on 17 March, the notice of 1 April names the marketplace’s last day, 16 May, 60 days from the loss; on 20 May Enroll refuses it, HUSKY D asking for March’s work; a twin enrolls on 10 May (until 2026-10-16 the 60 days ran from the look of 1 April, to 31 May, and the notice said “You have 60 days”)', () => {
    let sim = life('jw-3', 'modest');
    tend(sim, at(2027, 2, 15, 12));
    ok(sim, 'school.withdraw', { confirm: true });
    expect(titled(sim, 'You Withdrew From The School')[0]!.body).toContain('Yale Health covers you for thirty days more.');
    // Thirty days on, 17 March at noon (Bulletin 2026–27 p.174).
    expect(coverOn(sim.player, at(2027, 3, 17, 11))).toBe('yale');
    expect(coverOn(sim.player, at(2027, 3, 17, 13))).toBeUndefined();
    // Enroll is open at once: January had school at least half-time, HUSKY D's work rule met.
    expect(mayEnroll(sim.player, sim.now, 'USD', sim)).toMatchObject({ ok: true, program: 'medicaid' });
    tend(sim, at(2027, 4, 1, 12));
    expect(titled(sim, 'Your Health Cover Ended').map((n) => n.body)).toEqual(['You’re uncovered from March 17, 2027. You can enroll in the marketplace until May 16, 2027, 60 days from losing cover.']);
    // March had no work, income or school: HUSKY D isn't hers on April's look, and the marketplace's 60 days are.
    expect(mayEnroll(sim.player, sim.now, 'USD', sim).why).toBe('From January 1, 2027, HUSKY D asks an applicant for 80 hours’ work, $580.00 of income, school at least half-time or an exception in the month before, and last month had none of them. The marketplace is open to you: within 60 days of losing cover.');
    sim = reload(sim);
    // The 2026 return, filed on 1 March would have been the same: the withdrawal reaches 2027's, not 2026's. Filed now.
    const filed = ok<{ balance: number; paid: boolean }>(sim, 'tax.file', { year: 2026 });
    expect(filed.paid).toBe(true);
    expect(refused(sim, 'tax.file', { year: 2026 })).toBe('You’ve filed it. A change is an amended return.');
    const twin = reload(sim);
    tend(twin, at(2027, 5, 10, 12));
    expect(ok<{ kind: string; from: Instant }>(twin, 'health.enroll')).toEqual({ kind: 'marketplace', from: at(2027, 6, 1, 0) });
    tend(sim, at(2027, 5, 20, 12));
    const before = still(sim);
    expect(refused(sim, 'health.enroll')).toBe('From January 1, 2027, HUSKY D asks an applicant for 80 hours’ work, $580.00 of income, school at least half-time or an exception in the month before, and last month had none of them. Outside open enrollment, 23 October to 15 January, and not within 60 days of losing cover.');
    expect(still(sim)).toBe(before);
    expect(drawn(sim, PapersWorkspace, 'health')).toContain('not within 60 days of losing cover');
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('PLAYER JOURNEY: withdrawn in the first fall on 5 October 2026, a citizen is told HUSKY D takes her on the notice that her cover ended, enrolls, and is covered from 1 January; the notice and the cover are the same in one jump as in six-hour steps', () => {
    const sim = life('jw-1', 'modest');
    tend(sim, at(2026, 10, 5, 12));
    ok(sim, 'school.withdraw', { confirm: true });
    const save = serialise(sim.universe);
    const steps = reload(sim);
    tend(steps, at(2026, 12, 2, 12));
    const jump = working(loadSave(deserialise(save) as never));
    jump.advanceTo(at(2026, 12, 2, 12));
    for (const s of [steps, jump]) {
      // Uncovered from 4 November at noon, thirty days on; told at December's look, 1 December, with the window's last
      // day, 60 days from the loss, 3 January 2027, and HUSKY D, which takes her at any time on November's income.
      expect(titled(s, 'Your Health Cover Ended').map((n) => [dated(n.at), n.body])).toEqual([['December 1, 2026', 'You’re uncovered from November 4, 2026. You can enroll in the marketplace until January 3, 2027, 60 days from losing cover; HUSKY D takes you at any time on last month’s income, with no premium.']]);
      expect(ok<{ kind: string; from: Instant }>(s, 'health.enroll')).toEqual({ kind: 'medicaid', from: at(2027, 1, 1, 0) });
      expect(refused(s, 'health.enroll')).toBe('You’re enrolled from January 1, 2027.');
      expect(coverOn(s.player, at(2027, 1, 1, 12))).toBe('medicaid');
    }
  }, 300_000);

  it('PLAYER JOURNEY: withdrawn on Tuesday 25 August 2026, in orientation’s week before classes begin on 31 August, Yale Health is canceled back to 1 August; the notice of 1 September counts the 60 days from the withdrawal, the day she learned of it, to 24 October, and Enroll is open on 22 October, the same in one jump', () => {
    const sim = life('jw-4', 'modest');
    tend(sim, at(2026, 8, 25, 12));
    expect(ok<{ early: boolean }>(sim, 'school.withdraw', { confirm: true }).early).toBe(true);
    expect(titled(sim, 'You Withdrew From The School')[0]!.body).toContain('is canceled back to August 1, 2026, the start of its insurance term');
    const save = serialise(sim.universe);
    tend(sim, at(2026, 9, 1, 12));
    const jump = working(loadSave(deserialise(save) as never));
    jump.advanceTo(at(2026, 9, 1, 12));
    for (const s of [sim, jump]) {
      const [notice] = titled(s, 'Your Health Cover Ended');
      expect(dated(notice!.at)).toBe('September 1, 2026');
      // 25 August and 60 days: 24 October (45 CFR 155.420(c)(5)); from the cover's own end, 1 August, it would be 30 September.
      expect(notice!.body).toMatch(/^You’re uncovered from August 1, 2026\. You can enroll in the marketplace until October 24, 2026, 60 days from when it was canceled back/);
    }
    tend(sim, at(2026, 10, 22, 12));
    expect(mayEnroll(sim.player, sim.now, 'USD', sim).ok).toBe(true);
  }, 300_000);

  it('PLAYER JOURNEY: an F-1 student from London withdraws on 5 October 2026: fifteen days’ grace, out of status on 20 October, the marketplace and the DMV refuse her in their words, her cover-ended notice says so, and her 2026 return, a 1040-NR filed without a Social Security number, pays its refund once seventy days on, through a reload; the status and health notices are the same in one jump', () => {
    let sim = life('jw-2', 'modest', { homeRegionId: 'uk-eng-london' });
    tend(sim, at(2026, 10, 5, 12));
    ok(sim, 'school.withdraw', { confirm: true });
    expect(titled(sim, 'You Withdrew From The School')[0]!.body).toContain('As an F-1 student you have fifteen days’ grace, and OPT isn’t open to you.');
    const save = serialise(sim.universe);
    tend(sim, at(2026, 12, 2, 12));
    const jump = working(loadSave(deserialise(save) as never));
    jump.advanceTo(at(2026, 12, 2, 12));
    const said = (s: Simulation) => s.universe.notifications.filter((n) => ['Out Of Status', 'Your Health Cover Ended'].includes(n.title)).map((n) => [dated(n.at), n.title, n.body]);
    expect(said(sim)).toEqual([
      ['October 20, 2026', 'Out Of Status', 'You stayed in the United States past your status. Your US visa is void, and the Visa Waiver Program is closed to you for good.'],
      ['December 1, 2026', 'Your Health Cover Ended', 'You’re uncovered from November 4, 2026. Out of status, neither the marketplace nor Covered Connecticut will take you.'],
    ]);
    expect(said(jump)).toEqual(said(sim));
    expect(refused(sim, 'health.enroll')).toBe('The marketplace sells to a citizen or somebody lawfully present, and you stayed past your status.');
    expect(refused(sim, 'documents.apply_idcard')).toBe('The DMV checks lawful presence through SAVE, and you stayed past your status.');
    tend(sim, at(2027, 3, 1, 12));
    const filed = ok<{ balance: number; refundAt?: Instant; irs: number }>(sim, 'tax.file', { year: 2026 });
    // The 14% withheld at source on her taxable scholarship is more than the 1040-NR's tax: a refund, seventy days on.
    expect(filed.balance).toBeLessThan(0);
    // Filed at noon on 1 March, the refund seventy days on to the hour: 1 PM on 10 May, the clocks gone forward between.
    expect(filed.refundAt).toBe(at(2027, 3, 1, 12) + 70 * MS_DAY);
    expect(dated(filed.refundAt!)).toBe('May 10, 2027');
    sim = reload(sim);
    const checking = account(sim, 'Chase Total Checking');
    const was = checking.balance;
    tend(sim, at(2027, 5, 11, 12));
    const refunds = sim.universe.transactions.filter((t) => t.at >= at(2027, 3, 1, 13) && t.postings.some((q) => q.accountId === checking.id && q.amount === -filed.balance));
    expect(refunds).toHaveLength(1);
    expect(checking.balance - was).toBeLessThanOrEqual(-filed.balance);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// journeys.x4: a document running out under a payment
// ---------------------------------------------------------------------------

describe('journeys.x4: a document running out under a payment', () => {
  it('DEFECT: a New Yorker whose one photo ID is her license sees it run out on 14 June 2028, mid-program; Papers says what replaces it on its row; a new bank refuses her, nothing moved; the Connecticut ID card applied for on Papers, $28.00, is in force at once, and the bank opens, its $100.00 in transit until it lands, through a reload (until 2026-10-16 the row said nothing past Run Out)', () => {
    // je-5, Modest: searched (je-1 to je-6) for a New Yorker holding a license and no passport. A New York license is
    // issued on the 18th birthday and renewed each eight years: 14 June 2020 to 14 June 2028.
    let sim = life('je-5', 'modest');
    tend(sim, at(2028, 6, 13, 12));
    const license = sim.player.documents!.find((d) => d.kind === 'license')!;
    expect(license).toMatchObject({ issuer: 'us-ny', issuedAt: expect.any(Number) });
    expect(dated(license.expiresAt!)).toBe('June 14, 2028');
    expect(sim.player.documents!.filter((d) => d.kind === 'passport')).toEqual([]);
    expect(photoIdOf(sim.player, sim.now)).toBe(license);
    expect(sim.player.school!.standing).not.toBe('dismissed');
    tend(sim, at(2028, 6, 20, 12));
    expect(photoIdOf(sim.player, sim.now)).toBeUndefined();
    const papers = drawn(sim, PapersWorkspace, 'passport');
    expect(papers).toContain('June 14, 2028 Run Out Nothing in SLATE renews a license since the cars went: a passport or an ID card in force is your photo ID, under Your Passport and Your ID.');
    // A new bank asks for a photo ID in force.
    const chase = account(sim, 'Chase Total Checking');
    const before = still(sim);
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi', fundFrom: chase.id, amount: 100_00 })).toBe('Citi asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each.');
    expect(still(sim)).toBe(before);
    // Connecticut's non-driver ID, where she lives: $28.00, six years (Connecticut DMV), in force at once for a citizen.
    const held = chase.balance;
    expect(ok<{ fee: number; expiresAt: Instant }>(sim, 'documents.apply_idcard')).toMatchObject({ fee: 28_00 });
    expect(held - chase.balance).toBe(28_00);
    expect(refused(sim, 'documents.apply_idcard')).toBe('You hold one in force.');
    sim = reload(sim);
    const card = photoIdOf(sim.player, sim.now)!;
    expect(card).toMatchObject({ kind: 'idcard', issuer: 'us-ct' });
    expect(dated(card.expiresAt!)).toBe('June 20, 2034');
    expect(drawn(sim, PapersWorkspace, 'passport')).toContain('Non-Driver Identification Card');
    const opened = ok<{ accountId: string; arrivesAt: Instant }>(sim, 'bank.open_current', { bankId: 'us-citi', fundFrom: account(sim, 'Chase Total Checking').id, amount: 100_00 });
    expect(sim.universe.accounts[opened.accountId]!.balance).toBe(0);
    tend(sim, opened.arrivesAt + MS_HOUR);
    expect(sim.universe.accounts[opened.accountId]!.balance).toBe(100_00);
    expect(breaches(sim.universe)).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// journeys.d-lapse-prescription
// ---------------------------------------------------------------------------

describe('journeys.d-lapse-prescription: a prescription filled in a leave’s lapse, and Affiliate cover bought back to its start', () => {
  it('DEFECT: a generic filled uninsured on 8 February 2027 is billed again as Yale Health pays it once Affiliate cover is bought on 18 February: Yale Health’s $10.00 copay, the rest paid back to the bank once, on a line of its own, through a reload (until 2026-10-16 the fill stayed at the pharmacy’s cash price)', () => {
    // jl-12, Modest: searched (jl-1 to jl-40) for a life whose draw fills a prescription in a leave's lapse.
    let sim = life('jl-12', 'modest');
    tend(sim, at(2027, 1, 20, 12));
    const asked = ok<{ decideAt: Instant }>(sim, 'school.request_leave', { kind: 'personal', reason: 'family' });
    tend(sim, asked.decideAt + MS_HOUR);
    tend(sim, at(2027, 2, 18, 12));
    const fill = healthOf(sim.player).bills.find((b) => b.what === 'A prescription, a generic' && b.at >= asked.decideAt)!;
    expect(dated(fill.at)).toBe('February 8, 2027');
    expect(fill).toMatchObject({ paid: true });
    // Uninsured, filled at the pharmacy's cash price, more than a plan's copay.
    expect(fill.amount).toBeGreaterThan(10_00);
    const checking = account(sim, 'Chase Total Checking');
    const before = checking.balance;
    expect(ok<{ cost: number }>(sim, 'school.buy_affiliate', { confirm: true }).cost).toBe(8_950_00);
    const after = checking.balance;
    sim = reload(sim);
    // Yale Health's generic copay is $10.00: the rest of what was paid comes back.
    const back = fill.amount - 10_00;
    const line = healthOf(sim.player).bills.find((b) => b.adjusts === fill.id)!;
    expect(line).toMatchObject({ amount: 0, credit: back, paid: true });
    expect(titled(sim, 'Care Credited').at(-1)!.body).toContain(`$${(back / 100).toFixed(2)} less`);
    const refunds = sim.universe.transactions.filter((t) => t.memo.startsWith('Refund: A prescription, a generic'));
    expect(refunds).toHaveLength(1);
    // The cover's $8,950.00 out of the current account, the fill's difference back into it, at once.
    expect(after).toBe(before - 8_950_00 + back);
    expect(account(sim, 'Chase Total Checking').balance).toBe(after);
    tend(sim, at(2027, 2, 25, 12));
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Refund: A prescription, a generic'))).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// journeys.d-hardship-ended-renewal
// ---------------------------------------------------------------------------

/** TEST SETUP: draws forced on one save, as tests/remaining-09-hardship.test.ts forces them. A reloaded save draws its own. */
function forcing(sim: Simulation): (stream: string, key: (string | number)[] | null, values: number[]) => void {
  const forced = new Map<string, number[]>();
  const real = sim.rng.bind(sim);
  Object.assign(sim, {
    rng: (stream: string, ...keys: (string | number)[]) => {
      const values = forced.get([stream, ...keys].join('|')) ?? forced.get(stream);
      const d = real(stream, ...keys);
      if (!values) return d;
      let i = 0;
      return { ...d, next: () => values[i++] ?? 0.999 };
    },
  });
  return (stream, key, values) => { forced.set(key ? [stream, ...key].join('|') : stream, values); };
}
const press = (feature: string, label?: string) => {
  const b = h.clicks.filter((c) => c.feature === feature && (label === undefined || c.label === label));
  expect(b.map((c) => c.label), `one ${feature}`).toHaveLength(1);
  b[0]!.onClick!();
};

/**
 * tests/remaining-09-hardship.test.ts's member, played the same way: Ada Cole as the creation screen's draft makes her
 * (`newLifeFrom`), the Comfortable family at Capital One, withdrawn on 25 August 2026 by the fifteenth day of classes,
 * HUSKY D enrolled on Papers on 1 October from 1 November, every week's illness a "no" and the week of Monday 13
 * September 2027 a stay in hospital (TEST SETUP, as that file forces them); her renewal of 1 November 2027 reads May to
 * October 2027, finds no work, and sends its notice.
 */
function noticed(): Simulation {
  const sim = createSave(1, 'r09-hardship', newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'comfortable', bankId: 'us-capital-one' } as Partial<NewSaveConfig>));
  sim.advanceTo(at(2026, 8, 25, 12));
  expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
  const force = forcing(sim);
  force('health.illness', null, []); // TEST SETUP: every week's illness a "no"
  sim.advanceTo(at(2026, 10, 1, 9));
  expect(ok(sim, 'health.enroll')).toEqual({ kind: 'medicaid', from: at(2026, 11, 1, 0) });
  sim.advanceTo(at(2027, 9, 6, 12));
  const week = sim.universe.scheduled.filter((i) => i.kind === HEALTH_WEEK_KIND && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[0]!;
  expect(week.at).toBe(at(2027, 9, 13, 9));
  force('health.illness', [sim.player.id, String(week.at)], [0]); // TEST SETUP: that week's first draw, a stay
  sim.advanceTo(at(2027, 11, 1, 9));
  expect(healthOf(sim.player).pending).toMatchObject({ kind: 'renewal', decideAt: at(2027, 12, 6, 0) });
  expect(hardshipRefusal(sim, sim.player, sim.now)).toBeUndefined();
  return sim;
}

describe('journeys.d-hardship-ended-renewal: a renewal’s notice once the program it would renew is ending', () => {
  it('DEFECT: HUSKY D dropped on Papers on 2 November 2027, its renewal’s notice of 1 November waiting: the notice goes with it, Papers draws neither its line nor Request A Hardship Exception, the hardship is refused in its words with nothing moved, and a second Drop is refused; HUSKY D ends on 1 December as dropped, nothing renewed or decided after, through a reload (until 2026-10-16 the hardship was taken and said “The hardship is granted, and the work rules met.” while nothing was renewed)', () => {
    let sim = noticed();
    sim.advanceTo(at(2027, 11, 2, 9));
    drawn(sim, PapersWorkspace, 'health');
    press('health.drop', 'Drop The Plan');
    expect(healthOf(sim.player).program).toMatchObject({ until: at(2027, 12, 1, 0), ended: 'voluntary' });
    // Nothing left to renew: the notice and its decision go with the program.
    expect(healthOf(sim.player).pending).toBeUndefined();
    expect(sim.universe.scheduled.filter((i) => i.kind === WORK_DECIDED_KIND && i.status === 'pending')).toEqual([]);
    const page = drawn(sim, PapersWorkspace, 'health');
    expect(page).not.toContain('A notice of noncompliance of');
    expect(h.clicks.filter((c) => c.feature === 'health.request_hardship')).toEqual([]);
    expect(h.clicks.filter((c) => c.feature === 'health.drop')).toEqual([]);
    expect(page).toContain('Dropped: it ends on December 1, 2027.');
    const before = still(sim);
    expect(refused(sim, 'health.request_hardship')).toBe('No notice of noncompliance waits on an answer.');
    expect(refused(sim, 'health.drop')).toBe('It’s dropped: it ends on December 1, 2027.');
    expect(still(sim)).toBe(before);
    sim = reload(sim, false);
    sim.advanceTo(at(2027, 12, 7, 9));
    expect(coverOn(sim.player, at(2027, 11, 30, 23))).toBe('medicaid');
    expect(coverOn(sim.player, at(2027, 12, 1, 9))).toBeUndefined();
    for (const title of ['Your Public Cover Is Renewed', 'Your Public Cover Ends']) expect(titled(sim, title)).toEqual([]);
    expect(titled(sim, 'Your Health Cover Ended').filter((n) => n.at >= at(2027, 11, 1, 0)).map((n) => n.body)).toEqual(['You’re uncovered from December 1, 2027. A plan dropped or left unpaid opens no special enrollment: open enrollment, or a month’s income that qualifies you for HUSKY D or Covered Connecticut, is the way back.']);
    expect(breaches(sim.universe)).toEqual([]);
  }, 600_000);

  it('GUARD: a renewal’s notice waiting while its program has ended some other way, which no played life reaches (TEST SETUP: HUSKY D’s end set on the record by hand, the notice left), refuses the hardship in words that say so, and nothing is renewed or moved', () => {
    const sim = noticed();
    sim.advanceTo(at(2027, 11, 10, 9));
    // TEST SETUP: the program ended on the record without the drop that would take the notice with it.
    healthOf(sim.player).program!.until = at(2027, 11, 10, 0);
    const words = 'HUSKY D has ended, so there’s no renewal left to answer.';
    expect(hardshipRefusal(sim, sim.player, sim.now)).toBe(words);
    const before = still(sim);
    expect(refused(sim, 'health.request_hardship')).toBe(words);
    expect(still(sim)).toBe(before);
    expect(titled(sim, 'Your Public Cover Is Renewed')).toEqual([]);
    const page = drawn(sim, PapersWorkspace, 'health');
    expect(page).toContain(words);
    expect(h.clicks.filter((c) => c.feature === 'health.request_hardship')).toEqual([]);
  }, 600_000);
});
