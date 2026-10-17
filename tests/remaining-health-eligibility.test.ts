/**
 * Health eligibility's remaining work, the integration pass of 2026-10-16 (`docs/verification/remaining/
 * health-eligibility-checklist.json`): the five items left open by the current scope, and two found on the way.
 *
 * What was read, and what changed that day:
 * - HUSKY D's work rules from 1 January 2027 (Pub. L. 119-21 §71119, 42 USC 1396a(xx); CMS-2454-IFC of 3 June 2026,
 *   42 CFR 435.550-559, read 2026-10-16). A month meets them with 80 hours' work (which SLATE stopped reading on 2026-10-17, as 80 hours it pays are always over $580), a month's income of $580 or school at
 *   least half-time; and "the agency must determine the monthly income based on the individual's MAGI-based income"
 *   (435.552(f)(2)), so interest, a benefit or a pension count toward the $580 as pay does. Until that day SLATE counted
 *   work's pay alone.
 * - Connecticut's look-back (the Connecticut Hospital Association's HUSKY D materials of 25 August 2026, adapted from
 *   DSS's): the one month before an application, and at a renewal six months, any one of them meeting the rules or an
 *   exception. Until that day a renewal read the month before alone.
 * - The exceptions SLATE can read: 65 or over, or under 19, for any of a month (435.551, 435.553); SNAP received in it
 *   while not exempt from SNAP's work rules (435.554(c)(7)); and a stay in hospital in it, on her request (435.555(d)(1),
 *   which Connecticut keeps: "Were recently inpatient in a hospital"). Until that day none was read.
 * - The order: a notice of noncompliance, "considered to be received 5 days after the date on the notice", thirty
 *   calendar days from its receipt to answer, a member covered meanwhile, then the decision (435.558); an ending said "at
 *   least 10 days before the date of action" (42 CFR 431.211; Connecticut's UPM 1570.10(A)(1)), at a month's end
 *   (SLATE's reading: Connecticut's own day of discontinuance wasn't found). Until that day an applicant was refused and
 *   a renewal ended cover at its own hour.
 * - Covered Connecticut is for somebody "ineligible for HUSKY Health/Medicaid due to income" (portal.ct.gov/dss and Access
 *   Health CT, read 2026-10-16), so an income HUSKY D's line takes isn't Covered Connecticut's, whatever the status: a
 *   noncitizen HUSKY D bars by status at 100% to 138% is given the marketplace. Until that day she was given Covered
 *   Connecticut. Neither DSS nor Access Health CT was found to say so of that person in so many words.
 * - The premium tax credit on Form 1040-NR (IRS Pub. 974 (2025): Form 8962 is filed "with your income tax return (Form
 *   1040, 1040-SR, or 1040-NR)"), for a lawfully present F-1 student in 2026, and from 2027 for an "eligible alien"
 *   only, which she isn't (36B(e)(2)(B), Pub. L. 119-21 §71301). Until that day the return gave a nonresident none.
 *
 * Every figure is worked here from the rule, never asked of the engine's helper:
 * - the lines SLATE keeps: HUSKY D's 138% of 2026's $15,960 a month, 15,960 × 1.38 ÷ 12 = $1,835.40 (2027 reads 2026's);
 *   the credit's floor, 2025's $15,650 ÷ 12 = $1,304.17;
 * - a Capital One 360 Performance Savings account pays 3.00% a year, a 365th a day on the day's balance, at the month's
 *   end: $365,000 for December's 31 days is 365,000 × 0.03 × 31 ÷ 365 = $930.00; $182,500 is $465.00;
 * - (until later on 2026-10-16, brief 09's journeys, HUSKY D began on the first of next month, and every date of the
 *   renewal below was a month later: dated 1 November, decided 6 December, ending with December)
 * - a notice dated on a day is received five days on, and answered by the thirtieth day from then, the 34th day after
 *   its date; decided the next day at midnight: dated 4 January 2027, received 9 January, answered by 7 February,
 *   decided 8 February; dated 1 October 2027, answered by 4 November, decided 5 November;
 * - decided on 5 November 2027, ten days on is 15 November, and the cover ends with November (until 1 December 2027);
 * - HUSKY D begins on the first of the month of application, and reaches back to the first of a month before it she was
 *   eligible in and had care in with nothing covering her: three months for an application in 2026, one from 2027
 *   (Connecticut's UPM § 1560.10; 42 USC 1396a(a)(34) as Pub. L. 119-21 § 71112 amends it). Enrolled on 1 October 2026
 *   it begins on 1 October, and applied for on 4 January 2027, on 1 January, or 1 December with December's care;
 * - HUSKY D renewed in 2027 renews six months on; enrolled in 2026, twelve, from the month of application;
 * - the return's credit: a month's premium less the applicable percentage of income over twelve, the percentage at
 *   under 133% of the year before's line 2.10% in 2026 (Rev. Proc. 2025-25): $20,000 of income is 20,000 ÷ 15,650 =
 *   127.8% of 2025's line, and 0.021 × 20,000 ÷ 12 = $35.00 a month, so each $706.00 premium comes back as $671.00.
 *
 * PLAYER JOURNEYS: new lives as the creation screen's draft makes them (`newLifeFrom`, the family and the bank chosen),
 * Ada Cole, born in New York, a citizen, or in London, a student in F-1 status, at Yale in New Haven from Monday 24 August
 * 2026, withdrawn on 25 August, the fifteenth day of classes not yet passed, so Yale Health ends that day; played by the
 * clock, through Papers rendered as the player has it and its buttons pressed by their own handlers. Seeds are
 * arbitrary, none picked for what it draws.
 *
 * TEST SETUP and FIXTURE, said again where each is done: wages posted by hand (SLATE pays wages only for a student's
 * work-study and the Summer Cabaret, both at the School, so a withdrawn life has none); the week's illness draw forced to
 * a stay in hospital; an F-1 student's status kept past her grace, and a month's income set on her record, where no
 * played F-1 life holds 100% to 138% in status (Capital One and Citi refuse her, Chase pays cents, work-study is under
 * the floor); a year's record set for the return.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeFrom, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { HEALTH_WEEK_KIND, WORK_DECIDED_KIND, coverOn, endsAfterNotice, healthOf, monthEngagement } from '@/engine/systems/health';
import { earningsOf, workedBetween, yearOf } from '@/engine/systems/earnings';
import { figuresFor } from '@/engine/systems/taxreturn';
import { US_STATUS_KIND } from '@/engine/systems/permission';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; onClick?: () => void }[],
  toasts: [] as string[],
  tabs: {} as Record<string, string>,
}));

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
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
      h.clicks.push({ feature: props.feature, label: words(props.children), onClick: props.onClick as never });
      return ce(real.Gated, props);
    },
  };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { Home } = await import('@/ui/screens/Home');

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** Ada Cole as the creation screen's draft makes her, at Capital One. */
const life = (seed: string, wealth: StartingWealth, born: 'us-ny-newyork' | 'uk-eng-london' = 'us-ny-newyork', extra: Partial<NewSaveConfig> = {}) =>
  createSave(1, seed, newLifeFrom({ homeRegionId: born, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth, bankId: 'us-capital-one', ...extra } as Partial<NewSaveConfig>));
/** Withdrawn on 25 August 2026, by the fifteenth day of classes: Yale Health ends that day. */
const withdrawn = (sim: Simulation): Simulation => {
  sim.advanceTo(at(2026, 8, 25, 12));
  expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
  return sim;
};
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => loadSave(JSON.parse(snap) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const health = (sim: Simulation) => sim.universe.notifications.filter((n) => n.category === 'health').map((n) => [n.at, n.title, n.body]);
const mine = (sim: Simulation, kind: string) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && a.kind === kind);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const setSavings = (sim: Simulation, balance: number) => {
  const savings = mine(sim, 'savings')[0]!;
  const gap = balance - savings.balance;
  if (gap !== 0) sim.must({ kind: 'bank.transfer', payload: gap > 0 ? { fromId: checking(sim).id, toId: savings.id, amount: gap } : { fromId: savings.id, toId: checking(sim).id, amount: -gap } });
  expect(savings.balance).toBe(balance);
};
/** TEST SETUP: a month's work posted as wages, as tests/scope-cover.test.ts posts it. */
const wagesPosted = (sim: Simulation, when: Instant, gross: number, hours: number) => {
  sim.advanceTo(when);
  sim.post({ memo: `TEST SETUP wages, ${hours} hours`, category: 'salary', postings: [{ accountId: checking(sim).id, amount: gross }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -gross }] });
};
const interest = (sim: Simulation, year: number, month: number) => sim.universe.transactions.filter((t) => /^Interest: 360 Performance Savings$/.test(t.memo) && t.at >= at(year, month, 1, 0) && t.at < at(year, month + 1, 1, 0))
  .map((t) => t.postings.filter((p) => p.accountId === mine(sim, 'savings')[0]!.id).reduce((s, p) => s + p.amount, 0));
/** TEST SETUP: draws forced on one save, as tests/scope-health.test.ts forces them. */
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

/** Papers, Health Cover, as the player has it: its words, and the Gated buttons it drew. */
function papers(sim: Simulation, tab = 'health'): string {
  h.sim = sim;
  h.clicks = [];
  h.tabs = { 'tab:/workspace/papers': tab };
  return onScreen(renderToStaticMarkup(createElement(PapersWorkspace as FunctionComponent)));
}
const drawnFor = (feature: string) => h.clicks.filter((c) => c.feature === feature);
/** Home as the player has it: What Needs You draws the six unread notices, the most important and latest first. */
function home(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(Home as FunctionComponent)));
}
/** Papers' paragraph on the work rules, as the player meets them (from 2026-10-17, brief 12: until then it began “80 hours’ work”). */
const RULES_LINE = 'From 2027 Medicaid also has work rules. You meet them in any month you spend some of at the School, or in a month with $580.00 of income (pay, interest, a benefit or a pension). In Connecticut that’s the month before you apply, or any one of the 6 months before a renewal. You also meet them if you’re 65 or over, if you get SNAP under its own work rules, or if you ask for a hospital stay to count.';
/** No screen says hours of work meet the rules, or asks school at least half-time (brief 12). */
const NO_HOURS = /hours’ work|hours of work|half-time/;
/** A Gated button pressed by its own onClick: what it toasted. */
function press(feature: string, label?: string): string[] {
  const b = drawnFor(feature).filter((c) => label === undefined || c.label === label);
  expect(b.map((c) => c.label), `one ${feature}`).toHaveLength(1);
  h.toasts = [];
  b[0]!.onClick!();
  return h.toasts;
}

// The work rules as the player meets them, from 2026-10-17 (brief 12): until then REFUSED and APPLIED_NOTICE began
// “80 hours’ work” and said “school at least half-time”.
const REFUSED = 'From January 1, 2027, HUSKY D asks for $580.00 of income, time at the School or an exception in the month before you apply, and last month had none of them.';
const APPLY_LINE = 'You can still apply for HUSKY D. You’ll be sent a notice of noncompliance, with 30 days from receiving it to show you met the work rules in December 2026, or that an exception applies, such as a hospital stay that month. It’s decided after that, and you can buy a marketplace plan in the meantime.';
const APPLIED_NOTICE = 'HUSKY D couldn’t find $580.00 of income, time at the School or an exception in December 2026, before the month you applied. Answer by February 7, 2027. Your pay, income, time at the School, age and SNAP are checked from the records. A stay in hospital in that month counts too if you ask: press Request A Hardship Exception on Papers, under Health Cover. If you don’t answer, the application is denied on February 8, 2027. Meanwhile you can buy a marketplace plan in its enrollment windows, but you won’t get the premium tax credit while HUSKY D would take you if not for its work rules. You can apply again in any month after one that meets them.';

// ---------------------------------------------------------------------------
// 3 and 4. An application: the month before, a notice, thirty days to answer, then the decision
// ---------------------------------------------------------------------------

describe('health.apply: HUSKY D applied for on its notice, the month before read, decided after thirty days', () => {
  // Until 2026-10-16 Papers' refusal was the end of it: no notice, no time to answer, and nothing to apply with.
  it('PLAYER JOURNEY: withdrawn, with no work and under $580 of income in December 2026, she applies on 4 January 2027: a notice, thirty days from its receipt, uncovered meanwhile, denied on 8 February; one notice each across a reload, the same in one jump as day by day; and she may apply again', () => {
    const sim = withdrawn(life('rhe-apply', 'comfortable'));
    sim.advanceTo(at(2027, 1, 4, 9));
    // December: no work, and the interest a family with need earns, under $580 and under HUSKY D's $1,835.40.
    expect(workedBetween(sim, sim.player, at(2026, 12, 1, 0), at(2027, 1, 1, 0))).toEqual({ pay: 0, hours: 0 });
    expect(earningsOf(sim.player).months['2026-12'] ?? 0).toBeLessThan(580_00);
    expect(monthEngagement(sim, sim.player, '2026-12', 'USD')).toBeUndefined();
    const text = papers(sim);
    expect(text).toContain(`${REFUSED} The marketplace is open to you, because it’s open enrollment.`);
    expect(text).toContain(APPLY_LINE);
    // The rules as she can meet them, off the School: income, or an exception; no hours of work (brief 12, 2026-10-17).
    expect(text).toContain(RULES_LINE);
    expect(text).not.toMatch(NO_HOURS);
    // What Needs You read and cleared with Mark … Read, as the player does before she applies.
    sim.must({ kind: 'world.mark_read', payload: {} });
    expect(press('health.apply', 'Apply For HUSKY D')).toEqual(['Applied. A notice will say what’s needed, and it’s decided February 8, 2027.']);
    const told = home(sim);
    expect(told).toContain(`A Notice Of Noncompliance ${APPLIED_NOTICE}`);
    expect(told).not.toMatch(NO_HOURS);
    // Approved, it would begin on the first of the month of application, 1 January (from 2026-10-16; until then 1 February).
    expect(healthOf(sim.player).pending).toEqual({ kind: 'application', state: 'ct', noticeAt: at(2027, 1, 4, 9), decideAt: at(2027, 2, 8, 0), months: ['2026-12'], band: 'low', from: at(2027, 1, 1, 0) });
    expect(titled(sim, 'A Notice Of Noncompliance').map((n) => n.body)).toEqual([APPLIED_NOTICE]);
    // An applicant isn't covered while she answers.
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    expect(healthOf(sim.player).program).toBeUndefined();
    // Pressed again, and the hardship asked for with no stay: each refused in its words, nothing changed.
    expect(sim.execute({ kind: 'health.apply', payload: {} }).error).toBe('Your application waits on its notice: answer it by February 7, 2027.');
    expect(sim.execute({ kind: 'health.request_hardship', payload: {} }).error).toBe('None of the months it checked, December 2026, had a stay in hospital, the one hardship the game counts.');
    const pending = papers(sim);
    expect(pending).toContain('A notice of noncompliance dated January 4, 2027: HUSKY D couldn’t find that you met the work rules in December 2026. Answer by February 7, 2027. The application is decided on February 8, 2027. None of the months it checked, December 2026, had a stay in hospital, the one hardship the game counts.');
    expect(drawnFor('health.request_hardship')).toEqual([]);
    expect(drawnFor('health.apply')).toEqual([]);
    expect(sim.universe.scheduled.filter((i) => i.kind === WORK_DECIDED_KIND && i.status === 'pending')).toHaveLength(1);

    // One jump, against day by day with a reload on 20 January: the same notices, the same record.
    const snap = freeze(sim);
    const jump = thaw(snap);
    jump.advanceTo(at(2027, 2, 9, 9));
    let steps = thaw(snap);
    for (let t = at(2027, 1, 5, 9); t <= at(2027, 2, 9, 9); t += MS_DAY) {
      steps.advanceTo(t);
      if (t === at(2027, 1, 20, 9)) steps = thaw(freeze(steps));
    }
    expect(health(steps)).toEqual(health(jump));
    expect(healthOf(steps.player)).toEqual(healthOf(jump.player));
    // On 7 February it waits still; on 8 February it's denied, said once.
    expect(titled(jump, 'Public Cover Denied').map((n) => [n.at, n.body])).toEqual([[at(2027, 2, 8, 0), 'December 2026 didn’t show $580.00 of income, time at the School or an exception, and none was shown by February 7, 2027, so your application for HUSKY D is denied. You can still buy a marketplace plan in its enrollment windows, but without the premium tax credit while HUSKY D would take you if not for its work rules. You can apply for HUSKY D again in any month after one that meets them.']]);
    expect(titled(jump, 'A Notice Of Noncompliance')).toHaveLength(1);
    const denied = home(jump);
    expect(denied).toContain('Public Cover Denied December 2026 didn’t show $580.00 of income, time at the School or an exception, and none was shown by February 7, 2027, so your application for HUSKY D is denied.');
    expect(denied).not.toMatch(NO_HOURS);
    expect(healthOf(jump.player).pending).toBeUndefined();
    expect(healthOf(jump.player).program).toBeUndefined();
    // No restriction on applying again (42 CFR 435.558(e)): January is read now, and it's short too.
    papers(jump);
    expect(press('health.apply', 'Apply For HUSKY D')).toEqual(['Applied. A notice will say what’s needed, and it’s decided March 16, 2027.']);
    expect(healthOf(jump.player).pending).toMatchObject({ months: ['2027-01'], noticeAt: at(2027, 2, 9, 9) });
  }, 300_000);

  // Change the input: the month's income, of any kind (42 CFR 435.552(f)(2)). Until 2026-10-16 interest didn't count.
  it('PLAYER JOURNEY: an Inherited citizen withdrawn, her savings at $365,000 for December, $930.00 of interest, is given HUSKY D on 4 January 2027 with no work; at $182,500, $465.00, she’s shown the work rules short', () => {
    const twin = (seed: string, balance: number) => {
      const sim = withdrawn(life(seed, 'inherited'));
      sim.advanceTo(at(2026, 11, 30, 23, 30));
      setSavings(sim, balance);
      sim.advanceTo(at(2027, 1, 4, 9));
      return sim;
    };
    const high = twin('rhe-income-hi', 365_000_00);
    expect(interest(high, 2026, 12)).toEqual([930_00]);
    expect(earningsOf(high.player).months['2026-12']).toBe(930_00);
    expect(workedBetween(high, high.player, at(2026, 12, 1, 0), at(2027, 1, 1, 0))).toEqual({ pay: 0, hours: 0 });
    expect(monthEngagement(high, high.player, '2026-12', 'USD')).toBe('income');
    expect(papers(high)).toContain('Last month’s income qualifies you for HUSKY D. You can enroll at any time, with no premium.');
    // From the first of the month of application, 1 January, renewed six months on (from 2026-10-16; until then 1 February
    // and 1 August). December, the one month a 2027 application reaches back, had no care with nothing covering her.
    expect(press('health.enroll')).toEqual(['Enrolled in HUSKY D, from January 1, 2027.']);
    expect(healthOf(high.player).program).toMatchObject({ kind: 'medicaid', from: at(2027, 1, 1, 0), renewAt: at(2027, 7, 1, 0) });

    const low = twin('rhe-income-lo', 182_500_00);
    expect(interest(low, 2026, 12)).toEqual([465_00]);
    expect(monthEngagement(low, low.player, '2026-12', 'USD')).toBeUndefined();
    const text = papers(low);
    expect(text).toContain(REFUSED);
    expect(drawnFor('health.apply').map((c) => c.label)).toEqual(['Apply For HUSKY D']);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// 2. The exceptions SLATE can read: age, SNAP under its work rules, a stay in hospital asked for
// ---------------------------------------------------------------------------

describe('HUSKY D’s work rules: the exceptions SLATE reads, applied before a denial', () => {
  it('PLAYER JOURNEY: a student born in 1960, 66, withdrawn, is given HUSKY D on 4 January 2027 with no work, as the rules ask nothing of somebody 65 or over; her twin born in 2001 is shown them short', () => {
    const old = withdrawn(life('rhe-age', 'comfortable', 'us-ny-newyork', { birthYear: 1960 }));
    old.advanceTo(at(2027, 1, 4, 9));
    expect((at(2026, 12, 1, 0) - old.player.birthInstant) / (365.2425 * MS_DAY)).toBeGreaterThan(65);
    expect(workedBetween(old, old.player, at(2026, 12, 1, 0), at(2027, 1, 1, 0))).toEqual({ pay: 0, hours: 0 });
    expect(earningsOf(old.player).months['2026-12'] ?? 0).toBeLessThan(580_00);
    expect(monthEngagement(old, old.player, '2026-12', 'USD')).toBe('age');
    expect(papers(old)).toContain('Last month’s income qualifies you for HUSKY D. You can enroll at any time, with no premium.');
    // From the month of application's first (from 2026-10-16; until then 1 February).
    expect(press('health.enroll')).toEqual(['Enrolled in HUSKY D, from January 1, 2027.']);
    const young = withdrawn(life('rhe-age-young', 'comfortable'));
    young.advanceTo(at(2027, 1, 4, 9));
    expect(monthEngagement(young, young.player, '2026-12', 'USD')).toBeUndefined();
    expect(papers(young)).toContain(REFUSED);
  }, 300_000);

  it('PLAYER JOURNEY: withdrawn, she applies for SNAP on Papers on 20 November 2026 and it pays in December, while she’s under its work rules: on 4 January 2027 HUSKY D is hers with no work; her twin without SNAP is shown the work rules short', () => {
    const sim = withdrawn(life('rhe-snap', 'comfortable'));
    sim.advanceTo(at(2026, 11, 20, 12));
    papers(sim, 'benefits');
    expect(press('benefits.assistance')).toEqual(['Applied. The first month comes November 27, 2026.']);
    sim.advanceTo(at(2027, 1, 4, 9));
    const december = sim.universe.transactions.filter((t) => t.memo === 'SNAP, the month, onto the EBT card' && t.at >= at(2026, 12, 1, 0) && t.at < at(2027, 1, 1, 0));
    expect(december).toHaveLength(1);
    // Under SNAP's work rules: out of school, no unemployment claim, 18 to 64.
    expect(sim.player.school!.standing).toBe('withdrawn');
    expect(sim.player.unemployment?.claim).toBeUndefined();
    expect(workedBetween(sim, sim.player, at(2026, 12, 1, 0), at(2027, 1, 1, 0))).toEqual({ pay: 0, hours: 0 });
    expect(monthEngagement(sim, sim.player, '2026-12', 'USD')).toBe('snap');
    expect(papers(sim)).toContain('Last month’s income qualifies you for HUSKY D. You can enroll at any time, with no premium.');
    // From 2026-10-16 (until then from 1 February, and the December care stayed hers): applied in January 2027, HUSKY D
    // reaches back one month, to December, which she was eligible in, its work rules not asked before 2027, and had care
    // in with nothing covering her: a generic filled on 28 December, $41.79 paid, and a doctor's visit on the 31st, its
    // $183.98 bill not yet due. HUSKY D asks no copay: the fill's $41.79 comes back, and the visit's bill is credited whole.
    expect((healthOf(sim.player).careLog ?? []).filter((e) => e.at >= at(2026, 12, 1, 0)).map((e) => [e.at, e.care, e.share])).toEqual([[at(2026, 12, 31, 10), 'visit', 183_98]]);
    expect((healthOf(sim.player).fills ?? []).filter((f) => f.at >= at(2026, 12, 1, 0)).map((f) => [f.at, f.share])).toEqual([[at(2026, 12, 28, 9), 41_79]]);
    expect(press('health.enroll')).toEqual(['Enrolled in HUSKY D, from December 1, 2026.']);
    expect((healthOf(sim.player).careLog ?? []).filter((e) => e.at >= at(2026, 12, 1, 0)).map((e) => [e.at, e.care, e.share])).toEqual([[at(2026, 12, 31, 10), 'visit', 0]]);
    expect((healthOf(sim.player).fills ?? []).filter((f) => f.at >= at(2026, 12, 1, 0)).map((f) => [f.at, f.share])).toEqual([[at(2026, 12, 28, 9), 0]]);
    expect(healthOf(sim.player).bills.filter((b) => b.at === at(2026, 12, 31, 10)).map((b) => [b.amount, b.credited, b.paid])).toEqual([[0, 183_98, true]]);
    // The twin who didn't apply for SNAP: the same month, the rules short.
    const twin = withdrawn(life('rhe-snap', 'comfortable'));
    twin.advanceTo(at(2027, 1, 4, 9));
    expect(monthEngagement(twin, twin.player, '2026-12', 'USD')).toBeUndefined();
    expect(papers(twin)).toContain(REFUSED);
  }, 300_000);

  // Renamed on 2026-10-16 (brief 09's journeys, inputs/renames.json; until then “PLAYER JOURNEY: a stay in hospital in December 2026 (TEST SETUP: the week’s draw forced); on 4 January she buys the marketplace, applies for HUSKY D and asks for the hardship: approved from 1 February, the marketplace ending as it begins, its premium never taken, and the decision of 8 February passes it by, across a reload”): approved, HUSKY D begins on
  // the first of the month of application, 1 January, and reaches back the one month a 2027 application does to
  // December, which she was eligible in and had the stay in with nothing covering her (UPM § 1560.10; Pub. L. 119-21
  // § 71112). The stay, free under Yale New Haven's charity, is HUSKY D's now, its price paid by the plan; renewed six
  // months from the month of application, 1 July 2027.
  it('PLAYER JOURNEY: a stay in hospital in December 2026 (TEST SETUP: the week’s draw forced); on 4 January she buys the marketplace, applies for HUSKY D and asks for the hardship: approved from 1 December, reaching back to the stay, which HUSKY D now pays where the hospital’s charity had, the marketplace ending as it begins, its premium never taken, and the decision of 8 February passes it by, across a reload', () => {
    const sim = withdrawn(life('rhe-stay', 'comfortable'));
    const force = forcing(sim);
    force('health.illness', null, []); // TEST SETUP: every week's illness a "no"
    sim.advanceTo(at(2026, 12, 1, 12));
    const week = sim.universe.scheduled.filter((i) => i.kind === HEALTH_WEEK_KIND && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[0]!;
    expect(week.at).toBe(at(2026, 12, 7, 9));
    force('health.illness', [sim.player.id, String(week.at)], [0]); // TEST SETUP: that week's first draw, a stay, a "yes"
    sim.advanceTo(at(2027, 1, 4, 9));
    expect(healthOf(sim.player).careLog!.filter((e) => e.care === 'stay').map((e) => e.at)).toEqual([at(2026, 12, 7, 9)]);
    papers(sim);
    expect(press('health.enroll')).toEqual(['Enrolled in the marketplace, from February 1, 2027.']);
    const text = papers(sim);
    expect(text).toContain(APPLY_LINE);
    expect(press('health.apply', 'Apply For HUSKY D')).toEqual(['Applied. A notice will say what’s needed, and it’s decided February 8, 2027.']);
    expect(papers(sim)).toContain('If you were in hospital in one of those months, you can ask for it to count.');
    expect(press('health.request_hardship', 'Request A Hardship Exception')).toEqual(['Hardship exception granted. The work rules count as met.']);
    expect(titled(sim, 'Public Cover Approved').map((n) => n.body)).toEqual(['HUSKY D covers you from December 1, 2026, with no premium. December 2026 met its work rules through a stay in hospital you asked to count. Your marketplace plan ends as it begins.']);
    expect(home(sim)).toContain('Public Cover Approved HUSKY D covers you from December 1, 2026, with no premium. December 2026 met its work rules through a stay in hospital you asked to count. Your marketplace plan ends as it begins.');
    expect(healthOf(sim.player).program).toEqual({ kind: 'medicaid', state: 'ct', from: at(2026, 12, 1, 0), band: 'low', renewAt: at(2027, 7, 1, 0) });
    const stay = healthOf(sim.player).careLog!.find((e) => e.care === 'stay')!;
    expect([stay.share, stay.planPaid! > 0]).toEqual([0, true]);
    expect(coverOn(sim.player, stay.at)).toBe('medicaid');
    expect(healthOf(sim.player).marketplace).toEqual({ from: at(2027, 2, 1, 0), state: 'ct', until: at(2027, 2, 1, 0) });
    expect(healthOf(sim.player).pending).toBeUndefined();
    // Asked again: nothing waits on an answer.
    expect(sim.execute({ kind: 'health.request_hardship', payload: {} }).error).toBe('There’s no notice of noncompliance waiting for an answer.');
    const back = thaw(freeze(sim));
    back.advanceTo(at(2027, 2, 10, 9));
    expect(coverOn(back.player, at(2027, 2, 2, 9))).toBe('medicaid');
    expect(back.universe.transactions.filter((t) => t.memo === 'Marketplace health plan premium')).toEqual([]);
    expect(titled(back, 'Public Cover Denied')).toEqual([]);
    expect(titled(back, 'Public Cover Approved')).toHaveLength(1);
    expect(titled(back, 'A Notice Of Noncompliance')).toHaveLength(1);
  }, 300_000);

  it('GUARD: under 19 for any of a month meets the rules; no life at Yale is under 21, so a birth set by hand reaches it (FIXTURE)', () => {
    const sim = withdrawn(life('rhe-young', 'comfortable'));
    // FIXTURE: born 25 November 2008, eighteen until 25 November 2027: under 19 for part of November.
    sim.player.birthInstant = at(2008, 11, 25, 0);
    expect(monthEngagement(sim, sim.player, '2027-11', 'USD')).toBe('age');
    // Nineteen for all of December 2027: not under 19 for any of it.
    expect(monthEngagement(sim, sim.player, '2027-12', 'USD')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3 and 4. A renewal: six months read, a notice, covered while she answers, ended at a month's end
// ---------------------------------------------------------------------------

describe('HUSKY D’s renewal: the six months before read, then a notice and thirty days, then the end said ten days ahead', () => {
  /**
   * The Comfortable family's student withdrawn on 25 August 2026 and enrolled on Papers on 1 October: HUSKY D from 1 October,
   * the month of application, renewed on 1 October 2027 (from 2026-10-16; until then from 1 November, renewed on
   * 1 November 2027, and played from 1 April, where now from 1 March so a month's work can fall before the six read).
   */
  const enrolled = (() => {
    let snap: string | undefined;
    return () => {
      if (!snap) {
        const sim = withdrawn(life('rhe-renew', 'comfortable'));
        sim.advanceTo(at(2026, 10, 1, 9));
        papers(sim);
        expect(press('health.enroll')).toEqual(['Enrolled in HUSKY D, from October 1, 2026.']);
        expect(healthOf(sim.player).program!.renewAt).toBe(at(2027, 10, 1, 0));
        sim.advanceTo(at(2027, 3, 1, 9));
        snap = freeze(sim);
      }
      return thaw(snap);
    };
  })();

  // Renamed on 2026-10-16 (brief 09's journeys, inputs/renames.json; until then “PLAYER JOURNEY: 80 hours’ work in June 2027 (TEST SETUP) renew her on 1 November to 1 May 2028, said once; the same work in April, outside May to October, brings a notice of noncompliance”): renewed on 1 October 2027,
  // a month earlier, the six months read are April to September, so the twin's month outside them is March.
  it('PLAYER JOURNEY: $600 of wages in June 2027 (TEST SETUP) renew her on 1 October to 1 April 2028, said once; the same wages in March, outside April to September, bring a notice of noncompliance', () => {
    const june = enrolled();
    wagesPosted(june, at(2027, 6, 25, 17), 600_00, 80); // TEST SETUP: June's work, which no withdrawn life has
    june.advanceTo(at(2027, 10, 1, 9));
    expect(healthOf(june.player).program).toMatchObject({ kind: 'medicaid', from: at(2026, 10, 1, 0), renewAt: at(2028, 4, 1, 0) });
    expect(healthOf(june.player).program!.until).toBeUndefined();
    // Until 2026-10-17 “by 80 hours’ work”: since then the hours aren’t read, and the $600 they were paid is (brief 12, health-criteria.md).
    expect(titled(june, 'Your Public Cover Is Renewed').map((n) => [n.at, n.body])).toEqual([[at(2027, 10, 1, 0, 30), 'HUSKY D is renewed until its next renewal, on April 1, 2028. Last month’s income is within its limit, and June 2027 met its work rules with $580.00 or more of income.']]);
    expect(titled(june, 'A Notice Of Noncompliance')).toEqual([]);
    const reloaded = thaw(freeze(june));
    reloaded.advanceTo(at(2027, 11, 2, 9));
    expect(titled(reloaded, 'Your Public Cover Is Renewed')).toHaveLength(1);

    const march = enrolled();
    wagesPosted(march, at(2027, 3, 26, 17), 600_00, 80); // TEST SETUP: March's work, a month before the six
    march.advanceTo(at(2027, 10, 1, 9));
    expect(titled(march, 'Your Public Cover Is Renewed')).toEqual([]);
    expect(healthOf(march.player).pending).toMatchObject({ kind: 'renewal', months: ['2027-09', '2027-08', '2027-07', '2027-06', '2027-05', '2027-04'] });
    expect(coverOn(march.player, march.now)).toBe('medicaid');
  }, 300_000);

  // Renamed on 2026-10-16 (brief 09's journeys, inputs/renames.json; until then “PLAYER JOURNEY: with no work and under $580 of income in May to October 2027, the renewal of 1 November sends a notice; covered to 31 December, decided on 6 December, ended with December, said ten days ahead; one notice each, the same in one jump as day by day, and across a reload in the thirty days”): every date a month earlier,
  // the renewal on 1 October 2027, worked from the rules above. The clocks go back on 7 November inside the days played now.
  it('PLAYER JOURNEY: with no work and under $580 of income in April to September 2027, the renewal of 1 October sends a notice; covered to 30 November, decided on 5 November, ended with November, said ten days ahead; one notice each, the same in one jump as day by day, and across a reload in the thirty days', () => {
    const sim = enrolled();
    sim.advanceTo(at(2027, 9, 30, 12));
    for (const m of ['2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09']) expect(earningsOf(sim.player).months[m] ?? 0).toBeLessThan(580_00);
    expect(workedBetween(sim, sim.player, at(2027, 4, 1, 0), at(2027, 10, 1, 0))).toEqual({ pay: 0, hours: 0 });
    const snap = freeze(sim);
    const jump = thaw(snap);
    jump.advanceTo(at(2027, 12, 2, 9));
    let steps = thaw(snap);
    let reloaded = false;
    // A day at a time (the clocks go back on 7 November, so the hour moves by one; the days don't).
    for (let t = at(2027, 10, 1, 9); t <= at(2027, 12, 2, 9); t += MS_DAY) {
      steps.advanceTo(t);
      if (!reloaded && t >= at(2027, 10, 20, 0)) { steps = thaw(freeze(steps)); reloaded = true; }
      // Notice, the thirty days and the decision in order: covered every day to 30 November.
      if (t <= at(2027, 11, 30, 9)) expect(coverOn(steps.player, t)).toBe('medicaid');
      if (t >= at(2027, 10, 1, 9) && t < at(2027, 11, 5, 0)) { expect(titled(steps, 'A Notice Of Noncompliance')).toHaveLength(1); expect(titled(steps, 'Your Public Cover Ends')).toEqual([]); }
    }
    expect(health(steps)).toEqual(health(jump));
    expect(healthOf(steps.player)).toEqual(healthOf(jump.player));
    expect(titled(jump, 'A Notice Of Noncompliance').map((n) => n.at)).toEqual([at(2027, 10, 1, 0, 30)]);
    expect(titled(jump, 'Your Public Cover Ends').map((n) => n.at)).toEqual([at(2027, 11, 5, 0)]);
    expect(healthOf(jump.player).program!.until).toBe(at(2027, 12, 1, 0));
    expect(coverOn(jump.player, at(2027, 11, 30, 23))).toBe('medicaid');
    expect(coverOn(jump.player, at(2027, 12, 1, 9))).toBeUndefined();
    expect(titled(jump, 'Your Health Cover Ended').filter((n) => n.at >= at(2027, 10, 1, 0)).map((n) => [n.at, n.body])).toEqual([[at(2027, 12, 1, 0, 30), 'You have no health cover from December 1, 2027. You have 60 days to enroll in the marketplace. Enroll on Papers, under Health Cover.']]);
    expect(healthOf(jump.player).pending).toBeUndefined();
    // No premium for HUSKY D, ever: nothing health took from her bank but care.
    expect(jump.universe.transactions.filter((t) => /premium/i.test(t.memo))).toEqual([]);
  }, 600_000);
});

describe('the ten days’ advance notice of an ending (42 CFR 431.211)', () => {
  it('GUARD: an ending said late in a month waits ten days into the next and ends with that one; no played renewal is decided later than the sixth of a month, so the ten days never cross a month there', () => {
    // Said on 25 November 2027: ten days on is 5 December, so the cover ends with December (until 1 January 2028).
    expect(endsAfterNotice(at(2027, 11, 25, 0))).toBe(at(2028, 1, 1, 0));
    // Said on 21 November: ten days on is 1 December at midnight, December's own.
    expect(endsAfterNotice(at(2027, 11, 21, 0))).toBe(at(2028, 1, 1, 0));
    // Said on 20 November: 30 November, so it ends with November.
    expect(endsAfterNotice(at(2027, 11, 20, 0))).toBe(at(2027, 12, 1, 0));
    // Said on 6 December, as a renewal of 1 November is decided: 16 December, December's end.
    expect(endsAfterNotice(at(2027, 12, 6, 0))).toBe(at(2028, 1, 1, 0));
  });
});

// ---------------------------------------------------------------------------
// 1 and 5. Covered Connecticut over HUSKY D's line only; the credit on Form 1040-NR in 2026, none from 2027
// ---------------------------------------------------------------------------

describe('Covered Connecticut is for an income HUSKY D’s line doesn’t take, and the premium tax credit reaches a 1040-NR in 2026', () => {
  /** An F-1 student withdrawn on 21 September 2026, her status kept past her grace and September's income set by hand (FIXTURE), on 1 October. */
  const f1 = (seed: string, september: number, born: 'uk-eng-london' | 'us-ny-newyork' = 'uk-eng-london') => {
    const sim = life(seed, 'inherited', born);
    sim.advanceTo(at(2026, 9, 21, 12));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(false);
    for (const item of sim.universe.scheduled) if (item.kind === US_STATUS_KIND && item.status === 'pending') sim.timeline.cancel(item.id, sim.now); // FIXTURE: status kept
    sim.advanceTo(at(2026, 10, 1, 9));
    earningsOf(sim.player).months['2026-09'] = september; // FIXTURE: a month's income no played F-1 life has
    expect(sim.player.usOutOfStatus).toBeUndefined();
    return sim;
  };

  // Until 2026-10-16 the first was given Covered Connecticut.
  it('FIXTURE: an F-1 student on a month’s $1,500.00, between the credit’s $1,304.17 and HUSKY D’s $1,835.40, barred from HUSKY D by her status, is given the marketplace, not Covered Connecticut; at $2,052.00, Covered Connecticut; a citizen at $1,500.00, HUSKY D', () => {
    const between = f1('rhe-f1-mid', 1_500_00);
    expect(papers(between)).toContain('You’re within 60 days before Yale Health’s cover ends.');
    expect(press('health.enroll')).toEqual(['Enrolled in the marketplace, from November 1, 2026.']);
    expect(healthOf(between.player).program).toBeUndefined();
    const over = f1('rhe-f1-over', 2_052_00);
    papers(over);
    expect(press('health.enroll')).toEqual(['Enrolled in Covered Connecticut, from November 1, 2026.']);
    const citizen = f1('rhe-cit-mid', 1_500_00, 'us-ny-newyork');
    papers(citizen);
    expect(press('health.enroll')).toEqual(['Enrolled in HUSKY D, from November 1, 2026.']);
  }, 300_000);

  // Until 2026-10-16 a nonresident alien's return took no credit.
  it('FIXTURE: two months’ $706.00 premiums on $20,000 of income come back as $1,342.00 on an F-1 student’s 2026 Form 1040-NR; none on her 2027 return; none for a citizen in 2026, whom HUSKY D would take', () => {
    const sim = life('rhe-1040nr', 'inherited', 'uk-eng-london');
    const fixture = (year: number) => {
      // FIXTURE: a year's record set by hand, $20,000 of work-study and two months' premiums.
      yearOf(sim.player, year).workStudy = 20_000_00;
      healthOf(sim.player).premiums[year] = [706_00, 706_00];
      return figuresFor(sim.player, year);
    };
    const y2026 = fixture(2026);
    expect(y2026.form).toBe('1040-NR');
    expect(y2026.income).toBe(20_000_00);
    // 20,000 ÷ 15,650 = 127.8% of 2025's line, under 133%: 2.10%; 0.021 × 2,000,000 ÷ 12 = 3,500 cents a month.
    expect(Math.round(0.021 * 20_000_00 / 12)).toBe(35_00);
    expect(y2026.credit).toBe(2 * (706_00 - 35_00));
    const y2027 = fixture(2027);
    expect(y2027.form).toBe('1040-NR');
    expect(y2027.credit).toBe(0);
    const citizen = life('rhe-1040-cit', 'inherited');
    yearOf(citizen.player, 2026).workStudy = 20_000_00; // FIXTURE
    healthOf(citizen.player).premiums[2026] = [706_00, 706_00];
    const c = figuresFor(citizen.player, 2026);
    expect(c.form).toBeUndefined();
    expect(c.income).toBe(20_000_00);
    expect(c.credit).toBe(0);
  });
});

