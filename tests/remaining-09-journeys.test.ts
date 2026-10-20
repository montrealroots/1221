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
import { HEALTH_WEEK_KIND, WORK_DECIDED_KIND, careFor, coverOn, hardshipRefusal, healthOf, mayEnroll, retroStart } from '@/engine/systems/health';
import { earningsOf } from '@/engine/systems/earnings';
import { ACCOUNT_DUE_KIND, accountOwed, yaleAccount } from '@/engine/systems/leave';
import { classPeriod } from '@/engine/systems/school';
import { documentsOf, photoIdOf } from '@/engine/systems/documents';
import { attentiveHour } from '../tools/policy';

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

const STALE = ['Only the terms to come stand between you and the degree.', 'courses passed so far', 'You’re in the casting pool.', 'You need 90% or more', 'falls short of what’s asked', 'Not Cast Yet', 'Nothing is set yet'];

describe('journeys.known-graduated-school-page: the School page once the School has ended', () => {
  it('DEFECT: a life played to the degree reads it on its Standing, Casting and Coursework tabs, before and after a reload: the degree conferred at Commencement on Monday 21 May 2029, every course passed, the last term’s figures with their floors in the past, no casting and no work ahead (until 2026-10-16 “Only the terms to come stand between you and the degree.”, “so far”, “In the casting pool.”, each floor ahead, Not Cast Yet and Nothing set yet)', () => {
    const sim = life('j9-grad', 'wealthy');
    // In the first fall, at school, the page says what's so then: the terms to come.
    tend(sim, at(2026, 10, 1, 12));
    const first = drawn(sim, SchoolWorkspace, 'standing');
    expect(first).toContain('courses passed so far. Only the terms to come stand between you and the degree.');
    expect(first).toContain('Attendance This Term');
    expect(first).toContain('You need 90% or more');
    expect(first).toContain('You’re in the casting pool.');
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
      expect(standing).toContain('90% was the minimum');
      expect(standing).toContain('half its pace was the minimum');
      expect(standing).toContain('Once 3 or more are due, half or more fell short of what’s asked');
      const casting = drawn(s, SchoolWorkspace, 'casting');
      expect(casting).toContain('No Casting Ahead');
      expect(casting).toContain('The chair casts students at the School, and your degree is conferred, so there’s no casting now. The productions you played stay on your Profile.');
      const coursework = drawn(s, SchoolWorkspace, 'coursework');
      expect(coursework).toContain('Your degree is conferred, so no course sets work now.');
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
    expect(standing).toContain(`${passed} of ${all.length} courses passed. You withdrew. The Bulletin lets a student who withdrew apply to come back, but the game doesn’t offer a return.`);
    expect(standing).toContain('Attendance Last Term');
    // The fall's courses, left in the middle: Not Finished, and not listed with the term's meetings as if still taken.
    expect(standing).toContain('Fall Term 2026, DRAM 103a/b Acting I: Not Finished');
    expect(standing).not.toContain('In Progress');
    expect(standing).not.toMatch(/Acting I: at \d+ of \d+ meetings/);
    expect(drawn(sim, SchoolWorkspace, 'casting')).toContain('The chair casts students at the School, and you’ve left it, so there’s no casting now.');
    expect(drawn(sim, SchoolWorkspace, 'coursework')).toContain('You’ve left the School, so no course sets work now.');
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
    expect(standing).toMatch(new RegExp(`${passed} of ${all.length} courses passed\\. You were dismissed(, with [^.]+ not passed)?\\. A dismissed student can’t return to the School\\.`));
    expect(drawn(sim, SchoolWorkspace, 'casting')).toContain('The chair casts students at the School, and you’ve left it, so there’s no casting now.');
    expect(drawn(sim, SchoolWorkspace, 'coursework')).toContain('You’ve left the School, so no course sets work now.');
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
    expect(titled(sim, 'Spring Term 2027 Begins').map((n) => n.body)).toEqual(['Classes run from January 11 to April 23, 2027, when the faculty review the term. Tuition, $20,375.00 a term, is covered by the tuition scholarship. Your living-expense scholarship of $15,200.50 paid this term’s Yale Health plan, $1,882.00, and $13,318.50 is in your Chase Total Checking.']);
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
    expect(titled(sim, 'Your Leave Has Begun')[0]!.body).toContain('$7,600.25 of the term’s scholarship has to be returned on the rebate schedule. It’s on your Yale account, due by February 26, 2027. Yale Health’s student cover ended today. Affiliate cover, $5,416.00 a term, can be bought until February 19, 2027.');
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
    expect(refused(sim, 'school.buy_affiliate', { confirm: true })).toBe('You already have it.');
    expect(coverOn(sim.player, sim.now)).toBe('yale');
    // A part of the Yale account paid, from savings now; more than owed, and nothing, refused in their words.
    expect(refused(sim, 'school.pay_balance', { amount: 7_600_26 })).toBe('$7,600.25 is owed. Pay that or less.');
    expect(refused(sim, 'school.pay_balance', { amount: 0 })).toBe('Enter an amount to pay.');
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

  // Recast and renamed on 2026-10-16 (inputs/renames.json), the coordinator's follow-up (journeys.d-aid-past-balance):
  // until then “PLAYER JOURNEY: back for Spring Term 2028 under the hold, registration is refused in its words; she moves
  // her money into savings again and pays it from both, the hold lifts once, she registers, and the term’s first class
  // day counts her, through a reload”, the term's $14,093.64 paid whole to Chase Total Checking with $7,875.25 owed and
  // the hold refusing registration. From then the term's aid pays the account first, as Yale applies a credit to the
  // charges before any refund (Yale Student Accounts, Refunds); the payment from both accounts is a twin's, before.
  it('DEFECT: back for Spring Term 2028 owing $7,875.25 under the hold since 26 February 2027, the term’s $16,128.08 living-expense scholarship less its $2,034.44 plan pays the account first: the hold lifts at nine on Monday 3 January, said once, $6,218.39 reaches Chase Total Checking, as the term’s notice and Terms And Award say; she registers, and the first class day counts her, through a reload; a twin who paid it from checking and savings on 1 October has the $14,093.64 whole (until 2026-10-16 it went to the bank whole, and the hold refused registration)', () => {
    let sim = fromLeave();
    tend(sim, at(2027, 10, 1, 12));
    const notice = ok<{ noticeAt: Instant; returnsAt: Instant }>(sim, 'school.return_notice');
    expect(notice).toEqual({ noticeAt: sim.now, returnsAt: at(2028, 1, 3, 9) });
    expect(refused(sim, 'school.return_notice')).toBe('You already gave notice on October 1, 2027.');
    expect(accountOwed(sim, sim.player)).toBe(7_875_25);
    // The twin: nothing in checking since the cover was bought, $1,000.00 moved back into it from savings, and the account
    // paid from both.
    const twin = reload(sim);
    {
      const checking = account(twin, 'Chase Total Checking');
      const savings = account(twin, 'Chase Savings');
      expect(checking.balance).toBe(0);
      ok(twin, 'bank.transfer', { fromId: savings.id, toId: checking.id, amount: 1_000_00 });
      expect(checking.balance).toBe(1_000_00);
      const saved = savings.balance;
      expect(ok(twin, 'school.pay_balance')).toEqual({ owed: 0, held: false });
      expect(checking.balance).toBe(0);
      expect(saved - savings.balance).toBe(6_875_25);
      expect(titled(twin, 'The Financial Hold Is Lifted').map((n) => n.body)).toEqual(['Your Yale account is paid. Registration and the diploma are open to you again.']);
    }
    sim = reload(sim);
    tend(sim, at(2028, 1, 3, 10));
    tend(twin, at(2028, 1, 3, 10));
    const school = () => sim.player.school!;
    expect(school().leaves!.at(-1)!.status).toBe('returned');
    expect(titled(sim, 'Back From Your Leave')).toHaveLength(1);
    // By hand: 2027–28's figures, a year of the Bulletins' growth on 2026–27's (living expenses less the plan, and books,
    // at 5.82%; the plan at 8.10%; tuition at 3.22%): a scholarship of $16,128.08, the plan $2,034.44, $14,093.64 to pay
    // out; $7,875.25 of it onto the account, the $7,600.25 sent back less the $100.00 paid and the term's $375.00 of fees.
    const yale = yaleAccount(sim, sim.player)!.id;
    const legs = (s: Simulation) => {
      const t = s.universe.transactions.filter((x) => x.memo.startsWith('Living-expense scholarship, the spring term of 2028:'));
      expect(t).toHaveLength(1);
      return t[0]!.postings.filter((p) => s.universe.accounts[p.accountId]?.ownerId === s.player.id).map((p) => [p.accountId === yale ? 'Yale Student Account' : s.universe.accounts[p.accountId]!.name, p.amount]);
    };
    expect(legs(sim)).toEqual([['Chase Total Checking', 6_218_39], ['Yale Student Account', 7_875_25]]);
    expect(accountOwed(sim, sim.player)).toBe(0);
    expect(school().hold).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted').map((n) => [n.at, n.body])).toEqual([[at(2028, 1, 3, 9), 'This term’s living-expense scholarship paid the $7,875.25 it owed. Registration and the diploma are open to you again.']]);
    expect(titled(sim, 'Spring Term 2028 Begins').map((n) => n.body)).toEqual(['Classes run from January 10 to April 28, 2028, when the faculty review the term. Tuition, $21,031.08 a term, is covered by the tuition scholarship. Your living-expense scholarship of $16,128.08 paid this term’s Yale Health plan, $2,034.44, and the $7,875.25 your Yale account owed; $6,218.39 is in your Chase Total Checking.']);
    const terms = drawn(sim, SchoolWorkspace, 'terms');
    expect(terms).toContain(' Living-Expense Scholarship $16,128.08 Applied To Your Yale Account $7,875.25 Paid To Your Bank $6,218.39 ');
    expect(terms).toContain(' Owed On Your Yale Account $0.00 ');
    // The return asks registration again; the hold gone, it's taken.
    expect(school().mustRegister).toBe(true);
    expect(ok<{ registeredAt: Instant }>(sim, 'school.reregister').registeredAt).toBe(sim.now);
    expect(refused(sim, 'school.reregister')).toBe('You’re already registered.');
    sim = reload(sim);
    // Monday 10 January 2028, the term's first class day: counted.
    tend(sim, at(2028, 1, 10, 18));
    const met = Object.values(sim.player.school!.courses ?? {}).filter((r) => r.term === 3);
    expect(met.length).toBeGreaterThan(0);
    for (const r of met) expect(r.attended).toBe(r.meetings);
    expect(titled(sim, 'Not Registered')).toHaveLength(0);
    expect(titled(sim, 'The Financial Hold Is Lifted')).toHaveLength(1);
    // The twin who paid: nothing owed at the term's start, so the $14,093.64 is paid out whole.
    expect(legs(twin)).toEqual([['Chase Total Checking', 14_093_64]]);
    expect(titled(twin, 'Spring Term 2028 Begins').map((n) => n.body)).toEqual(['Classes run from January 10 to April 28, 2028, when the faculty review the term. Tuition, $21,031.08 a term, is covered by the tuition scholarship. Your living-expense scholarship of $16,128.08 paid this term’s Yale Health plan, $2,034.44, and $14,093.64 is in your Chase Total Checking.']);
    expect(titled(twin, 'The Financial Hold Is Lifted')).toHaveLength(1);
    for (const s of [sim, twin]) {
      expect(breaches(s.universe)).toEqual([]);
      expect(s.ledger.audit()).toEqual([]);
    }
  }, 300_000);
});

describe('journeys.d-aid-past-balance: a term begun under a hold its aid clears', () => {
  it('DEFECT: a student with need begins Spring Term 2027 under a hold (TEST SETUP: $1,000.00 owed on the Yale account and its due date come on 18 December, as tests/evidence-g25-school.test.ts sets them); the term’s scholarship pays the $1,125.00 first, the hold lifts at nine on 4 January, said once, registration isn’t asked, the first class day counts her, and $12,193.50 reaches Chase Total Checking (until 2026-10-16 the hold stayed, and the term asked her to register past it)', () => {
    const sim = life('jy-hold', 'modest', {}, false);
    tend(sim, at(2026, 12, 18, 12));
    sim.post({ memo: 'TEST SETUP', category: 'school', postings: [{ accountId: sim.nominalAccount('expense', 'Other').id, amount: 1_000_00 }, { accountId: yaleAccount(sim, sim.player)!.id, amount: -1_000_00 }] });
    sim.schedule({ at: sim.now + MS_HOUR, kind: ACCOUNT_DUE_KIND, label: 'Yale Account: Payment Due', category: 'school', priority: 33, payload: { personId: sim.player.id, term: 0 } });
    tend(sim, at(2026, 12, 18, 14));
    const school = () => sim.player.school!;
    expect(school().hold).toBe(at(2026, 12, 18, 13));
    // The month's $125.00 late fee: $1,125.00 owed.
    expect(accountOwed(sim, sim.player)).toBe(1_125_00);
    tend(sim, at(2027, 1, 4, 12));
    // By hand: 2026–27's scholarship, $15,200.50, less its plan, $1,882.00, is $13,318.50; $1,125.00 of it onto the
    // account, and $12,193.50 to the bank.
    const posted = sim.universe.transactions.filter((t) => t.memo.startsWith('Living-expense scholarship, the spring term of 2027:'));
    expect(posted.map((t) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).map((p) => [sim.universe.accounts[p.accountId]!.category === 'yale-account' ? 'Yale account' : sim.universe.accounts[p.accountId]!.name, p.amount]))).toEqual([[['Chase Total Checking', 12_193_50], ['Yale account', 1_125_00]]]);
    expect(accountOwed(sim, sim.player)).toBe(0);
    expect(school().hold).toBeUndefined();
    expect(school().mustRegister).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted').map((n) => [n.at, n.body])).toEqual([[at(2027, 1, 4, 9), 'This term’s living-expense scholarship paid the $1,125.00 it owed. Registration and the diploma are open to you again.']]);
    tend(sim, at(2027, 1, 11, 18));
    const met = Object.values(sim.player.school!.courses ?? {}).filter((r) => r.term === 1);
    expect(met.length).toBeGreaterThan(0);
    for (const r of met) expect(r.attended).toBe(r.meetings);
    expect(titled(sim, 'Not Registered')).toHaveLength(0);
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
    expect(titled(sim, 'A Doctor’s Appointment').at(-1)!.body).toBe('A doctor’s visit: booked at Fair Haven Community Health Care for March 4, 2027, the usual wait where you live. Be there then, or press Call It Off on Papers, under Health Cover.');
    // What Papers prices it at there, before the cover changes and after: the bill it brings, kept.
    ok(sim, 'school.buy_affiliate', { confirm: true });
    expect(coverOn(sim.player, appointment!.at)).toBe('yale');
    const outside = 'You booked a doctor’s visit on March 4, 2027 at Fair Haven Community Health Care while Yale Health didn’t cover you, so it stays where you booked it. Yale Health pays only for a visit at its own Health Center. To be covered, press Call It Off on Papers, under Health Cover, then Book An Appointment to be seen there.';
    expect(titled(sim, 'Your Appointment Is Outside Yale Health').map((n) => n.body)).toEqual([outside]);
    const papers = drawn(sim, PapersWorkspace, 'health');
    expect(papers).toContain('A doctor’s visit: an appointment March 4, 2027, Fair Haven Community Health Care. Yale Health pays for a visit only at its own Health Center: call this off, then Book An Appointment, to be seen there');
    const priced = /Fair Haven Community Health Care, A Visit (\$[\d,]+\.\d\d)/.exec(papers)?.[1];
    expect(priced).toBeDefined();
    // A twin that keeps it: billed at Fair Haven as the uninsured's, the figure Papers gave, and told why.
    const kept = reload(sim);
    tend(kept, at(2027, 3, 4, 18));
    expect(titled(kept, 'A Doctor’s Visit').at(-1)!.body).toBe(`You saw a doctor at Fair Haven Community Health Care. Yale Health pays for a visit only at its own Health Center, not here. You owe ${priced}. It’s taken from your checking account on April 3, 2027, and if there isn’t enough then, it becomes medical debt.`);
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
    expect(titled(sim, 'A Doctor’s Visit').at(-1)!.body).toBe('You saw a doctor at Yale Health Center, Student Health. There’s nothing to pay.');
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
    expect(titled(sim, 'Your Health Cover Ended').map((n) => n.body)).toEqual(['You have no health cover from March 17, 2027. You can enroll in the marketplace until May 16, 2027, 60 days after you lost cover. Enroll on Papers, under Health Cover.']);
    // March had no work, income or school: HUSKY D isn't hers on April's look, and the marketplace's 60 days are.
    expect(mayEnroll(sim.player, sim.now, 'USD', sim).why).toBe('From January 1, 2027, HUSKY D asks for $580.00 of income, time at the School or an exception in the month before you apply, and last month had none of them. The marketplace is open to you, because you’re within 60 days of losing cover.');
    sim = reload(sim);
    // The 2026 return, filed on 1 March would have been the same: the withdrawal reaches 2027's, not 2026's. Filed now.
    const filed = ok<{ balance: number; paid: boolean }>(sim, 'tax.file', { year: 2026 });
    expect(filed.paid).toBe(true);
    expect(refused(sim, 'tax.file', { year: 2026 })).toBe('You’ve already filed it. To change it, file an amended return.');
    const twin = reload(sim);
    tend(twin, at(2027, 5, 10, 12));
    expect(ok<{ kind: string; from: Instant }>(twin, 'health.enroll')).toEqual({ kind: 'marketplace', from: at(2027, 6, 1, 0) });
    tend(sim, at(2027, 5, 20, 12));
    const before = still(sim);
    expect(refused(sim, 'health.enroll')).toBe('From January 1, 2027, HUSKY D asks for $580.00 of income, time at the School or an exception in the month before you apply, and last month had none of them. It’s outside open enrollment, October 23 to January 15, and you haven’t lost cover in the last 60 days.');
    expect(still(sim)).toBe(before);
    expect(drawn(sim, PapersWorkspace, 'health')).toContain('you haven’t lost cover in the last 60 days');
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  // Recast and renamed on 2026-10-16 (journeys.d-medicaid-start, inputs/renames.json; until then “PLAYER JOURNEY: withdrawn in the first fall on 5 October 2026, a citizen is told HUSKY D takes her on the notice that her cover ended, enrolls, and is covered from 1 January; the notice and the cover are the same in one jump as in six-hour steps”): HUSKY D
  // begins on the first of the month of application (Connecticut's UPM § 1560.10(B)), 1 December, so the visit the clock
  // draws on 3 December, billed $183.98 as the uninsured's while HUSKY D waited for 1 January, is HUSKY D's at $0. The
  // three months before (§ 1560.10(A)): Yale Health covered her to 4 November, and November had no care, so none is reached.
  it('DEFECT: withdrawn in the first fall on 5 October 2026, a citizen is told HUSKY D takes her on the notice that her cover ended, enrolls on 2 December, and is covered from 1 December, the month she applied in: the doctor’s visit of 3 December is HUSKY D’s, nothing to pay; the notice and the cover are the same in one jump as in six-hour steps (until 2026-10-16 HUSKY D began on 1 January and the visit was billed $183.98 uninsured)', () => {
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
      expect(titled(s, 'Your Health Cover Ended').map((n) => [dated(n.at), n.body])).toEqual([['December 1, 2026', 'You have no health cover from November 4, 2026. You can enroll in the marketplace until January 3, 2027, 60 days after you lost cover. HUSKY D can take you at any time on last month’s income, with no premium. Enroll on Papers, under Health Cover.']]);
      expect((healthOf(s.player).careLog ?? []).filter((e) => e.at >= at(2026, 11, 1, 0))).toEqual([]);
      expect(ok<{ kind: string; from: Instant }>(s, 'health.enroll')).toEqual({ kind: 'medicaid', from: at(2026, 12, 1, 0) });
      expect(refused(s, 'health.enroll')).toBe('You’re already enrolled.');
      expect(coverOn(s.player, s.now)).toBe('medicaid');
      tend(s, at(2026, 12, 10, 12));
      const visit = (healthOf(s.player).careLog ?? []).filter((e) => e.at >= at(2026, 12, 1, 0));
      expect(visit.map((e) => [e.at, e.care, e.share, e.billId])).toEqual([[at(2026, 12, 3, 10), 'visit', 0, undefined]]);
      expect(titled(s, 'A Doctor’s Visit').filter((n) => n.at >= at(2026, 12, 1, 0)).map((n) => n.body)).toEqual(['You saw a doctor at Fair Haven Community Health Care. There’s nothing to pay.']);
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
      expect(notice!.body).toMatch(/^You have no health cover from August 1, 2026\. You can enroll in the marketplace until October 24, 2026, 60 days after the cancellation was made/);
    }
    tend(sim, at(2026, 10, 22, 12));
    expect(mayEnroll(sim.player, sim.now, 'USD', sim).ok).toBe(true);
  }, 300_000);

  it('PLAYER JOURNEY: an F-1 student from London withdraws on 5 October 2026: fifteen days’ grace, out of status on 20 October, the marketplace and the DMV refuse her in their words, her cover-ended notice says so, and her 2026 return, a 1040-NR filed without a Social Security number, pays its refund once seventy days on, through a reload; the status and health notices are the same in one jump', () => {
    let sim = life('jw-2', 'modest', { homeRegionId: 'uk-eng-london' });
    tend(sim, at(2026, 10, 5, 12));
    ok(sim, 'school.withdraw', { confirm: true });
    expect(titled(sim, 'You Withdrew From The School')[0]!.body).toContain('As an F-1 student, you have a fifteen-day grace period, and OPT isn’t open to you.');
    const save = serialise(sim.universe);
    tend(sim, at(2026, 12, 2, 12));
    const jump = working(loadSave(deserialise(save) as never));
    jump.advanceTo(at(2026, 12, 2, 12));
    const said = (s: Simulation) => s.universe.notifications.filter((n) => ['Out Of Status', 'Your Health Cover Ended'].includes(n.title)).map((n) => [dated(n.at), n.title, n.body]);
    expect(said(sim)).toEqual([
      ['October 20, 2026', 'Out Of Status', 'You stayed in the United States past the end of your status, so you’re now out of status. In the game, your US visa is canceled and the Visa Waiver Program is closed to you from now on.'],
      ['December 1, 2026', 'Your Health Cover Ended', 'You have no health cover from November 4, 2026. You’re out of status, so neither the marketplace nor Covered Connecticut will take you.'],
    ]);
    expect(said(jump)).toEqual(said(sim));
    expect(refused(sim, 'health.enroll')).toBe('The marketplace is only for citizens and people lawfully present, and you’re out of status.');
    expect(refused(sim, 'documents.apply_idcard')).toBe('The DMV checks lawful presence through SAVE, and you’re out of status, so it won’t issue you a card.');
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
  // Renamed on 2026-10-17 (brief 11's KS-ct-idcard, inputs/renames.json): until then 'DEFECT: a New Yorker whose one
  // photo ID is her license sees it run out on 14 June 2028, mid-program; Papers says what replaces it on its row; a new
  // bank refuses her, nothing moved; the Connecticut ID card applied for on Papers, $28.00, is in force at once, and the
  // bank opens, its $100.00 in transit until it lands, through a reload (until 2026-10-16 the row said nothing past Run
  // Out)', when a citizen's card was in force at the counter for six years.
  it('DEFECT: a New Yorker whose one photo ID is her license sees it run out on 14 June 2028, mid-program; Papers says what replaces it on its row; a new bank refuses her, nothing moved; the Connecticut ID card applied for on Papers, $28.00, comes by mail on 19 July, the bank refusing her until it does, and then the bank opens, its $100.00 in transit until it lands, through a reload (until 2026-10-16 the row said nothing past Run Out; until 2026-10-17 the card was in force at once)', () => {
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
    expect(papers).toContain('June 14, 2028 Run Out You can’t renew a driving license in the game. Use a passport or ID card in force as your photo ID: see Your Passport and Your ID.');
    // A new bank asks for a photo ID in force.
    const chase = account(sim, 'Chase Total Checking');
    const before = still(sim);
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi', fundFrom: chase.id, amount: 100_00 })).toBe('Citi needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.');
    expect(still(sim)).toBe(before);
    // Connecticut's non-driver ID, where she lives: $28.00, mailed within twenty business days of Tuesday 20 June, the
    // Fourth not among them, Wednesday 19 July; to her first birthday at least seven years on, 14 June 2036 (Connecticut
    // DMV and CGS 1-1h; from 2026-10-17: until then six years, in force at once for a citizen).
    const held = chase.balance;
    const got = ok<{ fee: number; expiresAt: Instant; readyAt: Instant }>(sim, 'documents.apply_idcard');
    expect(got).toMatchObject({ fee: 28_00 });
    expect(dated(got.readyAt)).toBe('July 19, 2028');
    expect(held - chase.balance).toBe(28_00);
    expect(refused(sim, 'documents.apply_idcard')).toBe('One is already on its way.');
    expect(refused(sim, 'bank.open_current', { bankId: 'us-citi', fundFrom: chase.id, amount: 100_00 })).toBe('Citi needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.');
    sim = reload(sim);
    tend(sim, got.readyAt + MS_HOUR);
    expect(refused(sim, 'documents.apply_idcard')).toBe('You already hold one in force.');
    const card = photoIdOf(sim.player, sim.now)!;
    expect(card).toMatchObject({ kind: 'idcard', issuer: 'us-ct' });
    expect(dated(card.expiresAt!)).toBe('June 14, 2036');
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
 * HUSKY D enrolled on Papers on 1 October from 1 October, every week's illness a "no" and the week of Monday 13
 * September 2027 a stay in hospital (TEST SETUP, as that file forces them); her renewal of 1 October 2027 reads April to
 * September 2027, finds no work, and sends its notice. Until 2026-10-16's journeys.d-medicaid-start HUSKY D began on
 * 1 November, and every date here was a month later: the renewal of 1 November, the drop on 2 November, its end on
 * 1 December.
 */
function noticed(): Simulation {
  const sim = createSave(1, 'r09-hardship', newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'comfortable', bankId: 'us-capital-one' } as Partial<NewSaveConfig>));
  sim.advanceTo(at(2026, 8, 25, 12));
  expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
  const force = forcing(sim);
  force('health.illness', null, []); // TEST SETUP: every week's illness a "no"
  sim.advanceTo(at(2026, 10, 1, 9));
  expect(ok(sim, 'health.enroll')).toEqual({ kind: 'medicaid', from: at(2026, 10, 1, 0) });
  sim.advanceTo(at(2027, 9, 6, 12));
  const week = sim.universe.scheduled.filter((i) => i.kind === HEALTH_WEEK_KIND && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[0]!;
  expect(week.at).toBe(at(2027, 9, 13, 9));
  force('health.illness', [sim.player.id, String(week.at)], [0]); // TEST SETUP: that week's first draw, a stay
  sim.advanceTo(at(2027, 10, 1, 9));
  expect(healthOf(sim.player).pending).toMatchObject({ kind: 'renewal', decideAt: at(2027, 11, 5, 0) });
  expect(hardshipRefusal(sim, sim.player, sim.now)).toBeUndefined();
  return sim;
}

describe('journeys.d-hardship-ended-renewal: a renewal’s notice once the program it would renew is ending', () => {
  // Renamed later on 2026-10-16 (inputs/renames.json; until then “DEFECT: HUSKY D dropped on Papers on 2 November 2027, its renewal’s notice of 1 November waiting: the notice goes with it, Papers draws neither its line nor Request A Hardship Exception, the hardship is refused in its words with nothing moved, and a second Drop is refused; HUSKY D ends on 1 December as dropped, nothing renewed or decided after, through a reload (until 2026-10-16 the hardship was taken and said “The hardship is granted, and the work rules met.” while nothing was renewed)”): a month earlier, as noticed() says.
  it('DEFECT: HUSKY D dropped on Papers on 2 October 2027, its renewal’s notice of 1 October waiting: the notice goes with it, Papers draws neither its line nor Request A Hardship Exception, the hardship is refused in its words with nothing moved, and a second Drop is refused; HUSKY D ends on 1 November as dropped, nothing renewed or decided after, through a reload (until 2026-10-16 the hardship was taken and said “The hardship is granted, and the work rules met.” while nothing was renewed)', () => {
    let sim = noticed();
    sim.advanceTo(at(2027, 10, 2, 9));
    drawn(sim, PapersWorkspace, 'health');
    press('health.drop', 'Drop The Plan');
    expect(healthOf(sim.player).program).toMatchObject({ until: at(2027, 11, 1, 0), ended: 'voluntary' });
    // Nothing left to renew: the notice and its decision go with the program.
    expect(healthOf(sim.player).pending).toBeUndefined();
    expect(sim.universe.scheduled.filter((i) => i.kind === WORK_DECIDED_KIND && i.status === 'pending')).toEqual([]);
    const page = drawn(sim, PapersWorkspace, 'health');
    expect(page).not.toContain('A notice of noncompliance dated');
    expect(h.clicks.filter((c) => c.feature === 'health.request_hardship')).toEqual([]);
    expect(h.clicks.filter((c) => c.feature === 'health.drop')).toEqual([]);
    expect(page).toContain('Dropped: it ends on November 1, 2027.');
    const before = still(sim);
    expect(refused(sim, 'health.request_hardship')).toBe('There’s no notice of noncompliance waiting for an answer.');
    expect(refused(sim, 'health.drop')).toBe('It’s already dropped, and it ends on November 1, 2027.');
    expect(still(sim)).toBe(before);
    sim = reload(sim, false);
    sim.advanceTo(at(2027, 11, 7, 9));
    expect(coverOn(sim.player, at(2027, 10, 31, 23))).toBe('medicaid');
    expect(coverOn(sim.player, at(2027, 11, 1, 9))).toBeUndefined();
    for (const title of ['Your Public Cover Is Renewed', 'Your Public Cover Ends']) expect(titled(sim, title)).toEqual([]);
    expect(titled(sim, 'Your Health Cover Ended').filter((n) => n.at >= at(2027, 10, 1, 0)).map((n) => n.body)).toEqual(['You have no health cover from November 1, 2027. Dropping a plan or leaving it unpaid doesn’t open special enrollment. You can enroll again in open enrollment, or once a month’s income qualifies you for HUSKY D or Covered Connecticut.']);
    expect(breaches(sim.universe)).toEqual([]);
  }, 600_000);

  it('GUARD: a renewal’s notice waiting while its program has ended some other way, which no played life reaches (TEST SETUP: HUSKY D’s end set on the record by hand, the notice left), refuses the hardship in words that say so, and nothing is renewed or moved', () => {
    const sim = noticed();
    sim.advanceTo(at(2027, 10, 10, 9));
    // TEST SETUP: the program ended on the record without the drop that would take the notice with it (a month earlier
    // from 2026-10-16, as noticed() says).
    healthOf(sim.player).program!.until = at(2027, 10, 10, 0);
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

// ---------------------------------------------------------------------------
// journeys.f-ended-life-loops
// ---------------------------------------------------------------------------

describe('journeys.f-ended-life-loops: a loop waiting for the clock once a life has ended', () => {
  it('GUARD: jl-17’s life, ended by mortality’s draw at 9:58 PM on 11 January 2027, tended by this file’s own six-hour loop to the 20th fails at once naming the death (tests/setup/ended-life.ts), where it hung before; a single move of the clock still returns where it stopped', () => {
    // jl-17, Modest: found 2026-10-16 when a search of jl-1 to jl-40 hung on it (probe p7-hang.ts).
    const sim = life('jl-17', 'modest', {}, false);
    expect(() => tend(sim, at(2027, 1, 20, 12))).toThrow('Ada Cole’s life ended on January 11, 2027 at 9:58 PM, at 24, and its clock stays there');
    const stopped = sim.now;
    expect(sim.universe.meta.endedAt).toBe(stopped);
    // The engine's own rule: a life that has ended keeps its clock where it stopped.
    const moved = sim.advanceTo(at(2027, 2, 1, 12));
    expect([moved.from, moved.to, sim.now]).toEqual([stopped, stopped, stopped]);
  }, 300_000);

  it('GUARD: tools/policy.ts’s attentiveHour, the hour the tools and eight test files loop on, throws at once naming the death on an ended life (FIXTURE: mortality’s end written as its handler writes it, at 9 PM on 24 August 2026, aged 22), where a loop on it spun for good', () => {
    const sim = life('jl-guard', 'modest', {}, false);
    tend(sim, at(2026, 8, 24, 21));
    expect(sim.now).toBe(at(2026, 8, 24, 21));
    sim.universe.meta.endedAt = sim.now;
    sim.universe.meta.endedAge = 22;
    const stopped = sim.now;
    expect(() => { while (sim.now < at(2026, 9, 1, 12)) attentiveHour(sim); }).toThrow('Ada Cole’s life ended on August 24, 2026 at 9:00 PM, at 22: its clock stays there, and an hour can’t be played.');
    expect(sim.now).toBe(stopped);
  });
});

// ---------------------------------------------------------------------------
// journeys.f-mexico-residence
// ---------------------------------------------------------------------------

describe('journeys.f-mexico-residence: Residence Abroad’s Mexico row, which sold papers nothing read', () => {
  it('DEFECT: a wealthy New Yorker’s first day on Papers reads Mexico’s rule and why SLATE grants none, Apply grayed with those words, and the route asked for anyway is refused in them with nothing moved; a card an older save holds (FIXTURE) is shown to its end through a reload, Renew grayed and refused in its words, and once it runs out the row reads the rule again (until 2026-10-16 the row sold the card for $674.93 and said nothing but these papers read it)', () => {
    const sim = life('jm-1', 'wealthy', {}, false);
    // Mexico's rule by hand: 11,460 UMA and 680 UMA at 2026's MXN 117.31, MXN 1,344,372.6 and 79,770.8 to the peso; the
    // card's MXN 11,140.74 a year and the consulate's US$56 (the guidelines of 25 July 2025, the Ley Federal de Derechos).
    const why = 'Moving abroad isn’t part of the game, so you can’t get Mexico’s papers here.';
    const rule = `Mexico grants temporary residence on savings of MXN 1,344,373 or an income of MXN 79,771 a month over six months, with the card at MXN 11,140.74 a year and the consulate’s visa at US$56. ${why}`;
    const page = drawn(sim, PapersWorkspace, 'work');
    expect(page).toContain(` Mexico ${rule} `);
    expect(page).not.toContain('Open to you');
    expect(page).not.toContain('$674.93');
    expect(h.clicks.filter((c) => c.feature === 'documents.residence' || c.feature === 'documents.renew_residence' || c.feature === 'documents.settle').map((c) => [c.feature, c.label, c.disabled, c.title])).toEqual([['documents.residence', 'Apply', true, rule]]);
    const before = still(sim);
    expect(refused(sim, 'documents.residence', { country: 'MX' })).toBe(rule);
    expect(still(sim)).toBe(before);
    // FIXTURE: Residente Temporal bought on 3 September 2025, as an older save could have, a year's card to 3 September 2026.
    documentsOf(sim.player).push({ id: 'mx-card', kind: 'visa', issuer: 'MX', name: 'Residente Temporal', number: 'R1', status: 'valid', issuedAt: at(2025, 9, 3, 12), expiresAt: at(2026, 9, 3, 12), destination: 'MX', route: 'mx-temporary' });
    const back = reload(sim, false);
    const renewal = `Mexico renews temporary residence a year at a time, in the card’s last 30 days, for MXN 11,140.74. ${why}`;
    const holding = drawn(back, PapersWorkspace, 'work');
    expect(holding).toContain(` Mexico Residente Temporal, to September 3, 2026. ${renewal} `);
    expect(h.clicks.filter((c) => c.feature === 'documents.residence' || c.feature === 'documents.renew_residence' || c.feature === 'documents.settle' || c.feature === 'documents.naturalize').map((c) => [c.feature, c.label, c.disabled, c.title])).toEqual([['documents.renew_residence', 'Renew', true, renewal]]);
    const held = still(back);
    expect(refused(back, 'documents.renew_residence', { country: 'MX' })).toBe(renewal);
    expect(refused(back, 'documents.settle', { country: 'MX' })).toBe('Permanent residence comes after four years of temporary residence.');
    expect(refused(back, 'documents.naturalize', { country: 'MX' })).toBe('It needs five years’ residence in Mexico.');
    expect(still(back)).toBe(held);
    // Run out at its year's end: the row reads Mexico's rule again.
    tend(back, at(2026, 9, 4, 12));
    expect(drawn(back, PapersWorkspace, 'work')).toContain(` Mexico ${rule} `);
    expect([breaches(back.universe).length, back.ledger.audit().length]).toEqual([0, 0]);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// journeys.d-f1-term-notice
// ---------------------------------------------------------------------------

describe('journeys.d-f1-term-notice: an F-1 student’s term notice and what reached her account', () => {
  it('DEFECT: a London-born F-1 student’s Fall Term 2026 notice says $11,356.54 is in Chase Total Checking after $1,961.96 withheld for the IRS, as the posting has it (until 2026-10-16 it said the whole $13,318.50 was)', () => {
    const sim = life('jw-2', 'modest', { homeRegionId: 'uk-eng-london' }, false);
    tend(sim, at(2026, 9, 1, 12));
    // By hand: 2026–27's scholarship, ($28,028 − $3,764 + $2,373 + $3,764) / 2 = $15,200.50, meets the plan's $1,882.00,
    // leaving $13,318.50; its taxable part is all but the books' $1,186.50 a term, $14,014.00, and 14% of it, $1,961.96, is
    // withheld at source for a nonresident (IRC 1441(b)), so $11,356.54 is paid in.
    const t = sim.universe.transactions.filter((x) => x.memo.startsWith('Living-expense scholarship, the fall term of 2026:'));
    expect(t.map((x) => x.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).map((p) => [sim.universe.accounts[p.accountId]!.name, p.amount]))).toEqual([[['Chase Total Checking', 11_356_54]]]);
    expect(titled(sim, 'Fall Term 2026 Begins').map((n) => n.body)).toEqual(['Classes run from August 31 to December 11, 2026, when the faculty review the term. Tuition, $20,375.00 a term, is covered by the tuition scholarship. Your living-expense scholarship of $15,200.50 paid this term’s Yale Health plan, $1,882.00, and $11,356.54 is in your Chase Total Checking, after $1,961.96 withheld for the IRS.']);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// journeys.d-medicaid-start
// ---------------------------------------------------------------------------

describe('journeys.d-medicaid-start: HUSKY D from the first of the month of application, and the months before it', () => {
  it('DEFECT: withdrawn on Tuesday 25 August 2026, Yale Health canceled back to 1 August, her generic filled uninsured at $41.79 on 31 August, 14 September and 19 October; enrolled in HUSKY D on Papers on 22 October, it covers her from 1 August, the two months before October each with a fill and her income then under its line, and the three fills are priced again as its $0, $125.37 back to Chase Total Checking once, through a reload; a twin who waits to 2 December reaches back three months to 1 September, and the August fill stays hers (until 2026-10-16 HUSKY D began on 1 November and every fill stayed at $41.79)', () => {
    const sim = life('jr-3', 'modest', {}, false);
    tend(sim, at(2026, 8, 25, 12));
    ok(sim, 'school.withdraw', { confirm: true });
    tend(sim, at(2026, 10, 22, 12));
    const h = () => healthOf(sim.player);
    // jr-3, Modest, born in New York: searched, jr-1 to jr-12, for prescriptions filled in the lapse (probe p20-retro.ts).
    const fills = (s: Simulation) => (healthOf(s.player).fills ?? []).map((f) => [dated(f.at), f.share]);
    expect(fills(sim)).toEqual([['August 31, 2026', 41_79], ['September 14, 2026', 41_79], ['October 19, 2026', 41_79]]);
    for (const f of h().fills ?? []) expect(coverOn(sim.player, f.at)).toBeUndefined();
    const twin = reload(sim, false);
    // By hand: an application in October 2026 reaches the three months before it, July to September (UPM § 1560.10(A),
    // before Pub. L. 119-21 § 71112's one month from 2027). September and August each had a fill with nothing covering
    // her and her income then under 138% of the poverty line, a citizen's: from 1 August. July had no care.
    const checking = account(sim, 'Chase Total Checking');
    const before = checking.balance;
    expect(ok<{ kind: string; from: Instant }>(sim, 'health.enroll')).toEqual({ kind: 'medicaid', from: at(2026, 8, 1, 0) });
    expect(h().program).toMatchObject({ kind: 'medicaid', state: 'ct', from: at(2026, 8, 1, 0), renewAt: at(2027, 10, 1, 0) });
    // HUSKY D asks no copay at the pharmacy: each fill's $41.79 is credited, and paid back once.
    expect(fills(sim)).toEqual([['August 31, 2026', 0], ['September 14, 2026', 0], ['October 19, 2026', 0]]);
    expect(checking.balance - before).toBe(3 * 41_79);
    expect(checking.balance - before).toBe(125_37);
    const back = reload(sim, false);
    tend(back, at(2026, 10, 29, 12));
    expect(fills(back).slice(0, 3)).toEqual([['August 31, 2026', 0], ['September 14, 2026', 0], ['October 19, 2026', 0]]);
    expect(back.universe.transactions.filter((t) => t.memo.startsWith('Refund:') && t.memo.includes('HUSKY D, from August 1, 2026'))).toHaveLength(3);
    expect(breaches(back.universe)).toEqual([]);
    expect(back.ledger.audit()).toEqual([]);
    // The twin, applying in December: September, October and November are the three months, and each had care or was one
    // she was eligible in, so it begins on 1 September; the August fill is outside its reach.
    tend(twin, at(2026, 12, 2, 12));
    expect(ok<{ kind: string; from: Instant }>(twin, 'health.enroll')).toEqual({ kind: 'medicaid', from: at(2026, 9, 1, 0) });
    expect(fills(twin).slice(0, 3)).toEqual([['August 31, 2026', 41_79], ['September 14, 2026', 0], ['October 19, 2026', 0]]);
  }, 300_000);

  it('GUARD: an application made in January 2028 reaches one month back, where one made in 2026 reached three (FIXTURE: an income of $600 a month from October 2027, the work rules met by it and under HUSKY D’s line, and a doctor’s visit through the game’s own care on the 15th of October, November and December 2027, all uninsured); enrolled on 5 January 2028, HUSKY D covers her from 1 December 2027 and prices again December’s visit alone', () => {
    // No played life reaches it: a student out of the School by 2027 has no work, so January's application would need
    // December's work rules met, and a month's income of $580 or more under the line SLATE's lives don't earn.
    const sim = life('jr-guard', 'modest', {}, false);
    tend(sim, at(2026, 8, 25, 12));
    ok(sim, 'school.withdraw', { confirm: true });
    const months = earningsOf(sim.player).months;
    for (const [m, d] of [[10, 15], [11, 15], [12, 15]] as const) {
      tend(sim, at(2027, m, d, 10));
      // Outside the clock's own care: the visit, as tools/condition.ts puts the flu (`careFor`).
      careFor(sim, sim.player, { care: 'visit', what: 'A doctor’s visit' }, sim.now);
    }
    for (const m of ['2027-10', '2027-11', '2027-12']) months[m] = 600_00;
    tend(sim, at(2028, 1, 5, 12));
    const put = [at(2027, 10, 15, 10), at(2027, 11, 15, 10), at(2027, 12, 15, 10)];
    const visits = () => (healthOf(sim.player).careLog ?? []).filter((e) => e.care === 'visit' && put.includes(e.at)).map((e) => [dated(e.at), e.share > 0]);
    expect(visits()).toEqual([['October 15, 2027', true], ['November 15, 2027', true], ['December 15, 2027', true]]);
    expect(ok<{ kind: string; from: Instant }>(sim, 'health.enroll')).toEqual({ kind: 'medicaid', from: at(2027, 12, 1, 0) });
    expect(visits()).toEqual([['October 15, 2027', true], ['November 15, 2027', true], ['December 15, 2027', false]]);
  }, 300_000);

  it('GUARD: the reach back stops at a month she wasn’t eligible in, or one another plan of hers covered, as SLATE keeps one stretch of cover (FIXTURE: her care one visit on 28 August 2026 with nothing covering her, an application on 5 November; then September’s income set over the line, then a Covered Connecticut plan set on September)', () => {
    const sim = life('jr-reach', 'modest', {}, false);
    tend(sim, at(2026, 8, 25, 12));
    ok(sim, 'school.withdraw', { confirm: true });
    tend(sim, at(2026, 11, 5, 12));
    const h = healthOf(sim.player);
    // FIXTURE: one visit the whole of her care, Yale Health canceled back to 1 August by the withdrawal.
    h.careLog = [{ at: at(2026, 8, 28, 10), care: 'visit', what: 'FIXTURE', share: 100_00 }];
    h.fills = [];
    expect(coverOn(sim.player, at(2026, 8, 28, 10))).toBeUndefined();
    const start = at(2026, 11, 1, 0);
    // October, September and August all hers: from 1 August.
    expect(retroStart(sim.player, at(2026, 11, 5, 12), start, 'USD')).toBe(at(2026, 8, 1, 0));
    // FIXTURE: September's income $5,000, over HUSKY D's $1,835.40: the reach stops there.
    const months = earningsOf(sim.player).months;
    const september = months['2026-09'];
    months['2026-09'] = 5_000_00;
    expect(retroStart(sim.player, at(2026, 11, 5, 12), start, 'USD')).toBe(start);
    months['2026-09'] = september ?? 0;
    // FIXTURE: a Covered Connecticut plan through September: the reach stops there too.
    h.program = { kind: 'essential', state: 'ct', from: at(2026, 9, 1, 0), until: at(2026, 10, 1, 0), band: 'low', renewAt: at(2027, 9, 1, 0) };
    expect(retroStart(sim.player, at(2026, 11, 5, 12), start, 'USD')).toBe(start);
  }, 300_000);
});
