/**
 * Three findings left by the renewal fix of 2026-10-15, played (from 2026-10-15):
 *
 * 1. HUSKY D's work test asked of somebody applying. From 2027 Medicaid's community engagement is "a condition of
 *    eligibility" for an applicant as for a member, read for "1 or more but not more than 3 (as specified by the State)
 *    consecutive months immediately preceding the month during which such individual applies" (Pub. L. 119-21 §71119,
 *    42 USC 1396a(xx)(1)(A), govinfo.gov PLAW-119publ21, read 2026-10-15), and Connecticut reads one month ("If not exempt
 *    from the work rules at initial application, eligibility includes a 1-month look back", the Connecticut Hospital
 *    Association's HUSKY D materials from DSS's, 25 August 2026, read 2026-10-15). A month passes on 80 hours' work, a
 *    month's earnings of 80 hours at the federal minimum wage ($580), or school at least half-time (1396a(xx)(2)). Until
 *    2026-10-15 Enroll asked nothing, so a member ended at renewal for having no work had HUSKY D back the next day.
 *    Refused it, she's taken to be eligible for Medicaid for the premium tax credit (1396a(xx)(7)(B)), so the
 *    marketplace is what Enroll gives, in its own windows.
 *
 * 2. Covered Connecticut and the premium tax credit. Covered Connecticut is a silver plan bought with "100% of available
 *    Advanced Premium Tax Credits" by somebody "eligible for financial help" (portal.ct.gov/dss, read 2026-10-15). The
 *    credit is none under 100% of the poverty line from 2026 (36B(c)(1)(A), its exception for the lawfully present
 *    struck by Pub. L. 119-21 §71302), and from taxable years beginning after 31 December 2026 a noncitizen's only with a
 *    green card, as a Cuban or Haitian entrant or under a Compact of Free Association (§71301; Access Health CT,
 *    "Resources for Lawfully Present Immigrants", read 2026-10-15). Until 2026-10-15 SLATE gave Covered Connecticut to
 *    anybody lawfully present on any income under 175%. The marketplace's own credit was already none for an F-1
 *    student, a nonresident alien for SLATE's every year (`nonresidentFor`), and New York's Essential Plan keeps the
 *    lawfully present out of its trust fund (`programFor`), which no New Haven life reaches.
 *
 * 3. Covered Connecticut beside Yale Health. A student back from a personal leave without Affiliate cover, who enrolled
 *    on it, kept Covered Connecticut beside Yale Health's student cover, which is minimum essential coverage (Yale Health,
 *    2025–2026 Student Guide, read 2026-10-15). The credit is for somebody not eligible for other minimum essential
 *    coverage (26 USC 36B(c)(2)(B)), so from 2026-10-15 it ends at the month's look after she's back. HUSKY D stays:
 *    Medicaid takes somebody with other cover and pays after it (42 CFR 433.139), Yale Health takes HUSKY in place of its
 *    own hospitalization cover ("Can I waive ... with Connecticut Medicaid (HUSKY)? Yes", yalehealth.yale.edu, read
 *    2026-10-15), and school at least half-time meets its work test at renewal, which until 2026-10-15 SLATE didn't count.
 *
 * Every figure is worked here by hand, never asked of the helper that computes it:
 * - the poverty line SLATE keeps: 2025's $15,650 and 2026's $15,960 (2027 reads 2026's). HUSKY D's line is 138% of the
 *   year's, 15,960 × 1.38 ÷ 12 = $1,835.40 a month in 2026 and 2027; Covered Connecticut's is 175% of the year before's,
 *   15,650 × 1.75 ÷ 12 = $2,282.29 in 2026 and 15,960 × 1.75 ÷ 12 = $2,327.50 in 2027; the credit's floor is 100% of
 *   the year before's, 15,650 ÷ 12 = $1,304.17 in 2026 (to the cent, $1,304.16⅔) and 15,960 ÷ 12 = $1,330.00 in 2027;
 * - a Capital One 360 Performance Savings account pays 3.00% APY, credited monthly, which is the nominal
 *   12 × (1.03^(1/12) − 1) = 2.9595% a year, a 365th a day on each day's closing balance, at the month's end at 11 at night:
 *   $665,986 for a 30-day month is 665,986 × 0.029595 × 30 ÷ 365 = $1,620.00, and $813,983 for a 31-day month is
 *   813,983 × 0.029595 × 31 ÷ 365 = $2,046.00 (a ninth and a sixth of a cent over: the cent's fraction carried from the
 *   month before is added, and where it would take one a cent past, a balance to the cent is set, said where it's done);
 *   set at half past eleven on the month before's last day, a balance earns the month on itself alone. Until brief 21 (2026-10-22) the 3.00% ran as the nominal rate, and $657,000 and $803,000 earned
 *   those figures at 0.03;
 * - work-study is $23.00 an hour: January 2027's 6 hours before a leave begun on the 20th are $138.00;
 * - HUSKY D renews twelve months from a 2026 start and six from a 2027 one; Covered Connecticut likewise.
 *
 * PLAYER JOURNEYS: new lives as the creation screen's draft makes them (`newLifeFrom`, the family and the bank chosen),
 * Ada Cole, born in New York, a citizen, or in London, a student in F-1 status, at Yale in New Haven from Monday 24 August
 * 2026, played by the clock. The seeds are arbitrary, none picked for what it draws.
 *
 * TEST SETUP, said again where it's done:
 * - the coursework prepared each midnight and the student rested, fed and awake each time the clock moves at the School,
 *   as tests/need-paths.test.ts plays one;
 * - a month's work posted as wages (80 hours, $600), as tests/evidence-g05-life.test.ts posts it, where no played life
 *   on a leave has it: SLATE pays wages only for work-study and the Summer Cabaret, both a student's at the School;
 * - an F-1 student's status kept past her withdrawal's fifteen days, where the finding needs her to hold Covered
 *   Connecticut on 1 January 2027, which no played F-1 life does (said at the test).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeFrom, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf } from '@/engine/systems/coursework';
import { coverOn, healthOf } from '@/engine/systems/health';
import { earningsOf, workedBetween } from '@/engine/systems/earnings';
import { US_STATUS_KIND } from '@/engine/systems/permission';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; disabled: boolean; onClick?: () => void }[],
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
      h.clicks.push({ feature: props.feature, label: words(props.children), disabled: Boolean(props.disabled), onClick: props.onClick as never });
      return ce(real.Gated, props);
    },
  };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** TEST SETUP: the work done each midnight, every open piece's every part prepared. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
/** Ada Cole as the creation screen's draft makes her: the family, the bank, and where she was born. */
const life = (seed: string, wealth: StartingWealth, born: 'us-ny-newyork' | 'uk-eng-london') =>
  working(createSave(1, seed, newLifeFrom({ homeRegionId: born, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth, bankId: 'us-capital-one' } as Partial<NewSaveConfig>)));
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
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const mine = (sim: Simulation, kind: string) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && a.kind === kind);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
/** Savings set to a balance by the player's own moves, from or to 360 Checking. */
const setSavings = (sim: Simulation, balance: number) => {
  const savings = mine(sim, 'savings')[0]!;
  const gap = balance - savings.balance;
  if (gap !== 0) sim.must({ kind: 'bank.transfer', payload: gap > 0 ? { fromId: checking(sim).id, toId: savings.id, amount: gap } : { fromId: savings.id, toId: checking(sim).id, amount: -gap } });
  expect(savings.balance).toBe(balance);
};
/** TEST SETUP: a month's work posted as wages, as tests/evidence-g05-life.test.ts posts it. */
const wagesPosted = (sim: Simulation, when: Instant, gross: number, hours: number) => {
  sim.advanceTo(when);
  sim.post({ memo: `TEST SETUP wages, ${hours} hours`, category: 'salary', postings: [{ accountId: checking(sim).id, amount: gross }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -gross }] });
};
/** The month's interest on 360 Performance Savings. */
const interest = (sim: Simulation, year: number, month: number) => sim.universe.transactions.filter((t) => /^Interest: 360 Performance Savings$/.test(t.memo) && t.at >= at(year, month, 1, 0) && t.at < at(year, month + 1, 1, 0))
  .map((t) => t.postings.filter((p) => p.accountId === mine(sim, 'savings')[0]!.id).reduce((s, p) => s + p.amount, 0));

/** Papers, Health Cover, as the player has it: its words, and the Gated buttons it drew. */
function papers(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  h.tabs = { 'tab:/workspace/papers': 'health' };
  return onScreen(renderToStaticMarkup(createElement(PapersWorkspace as FunctionComponent)));
}
const enrollDrawn = () => h.clicks.filter((c) => c.feature === 'health.enroll');
/** Enroll pressed by its own onClick: what it toasted. */
function pressEnroll(): string[] {
  const b = enrollDrawn()[0];
  expect(b, 'an Enroll button').toBeDefined();
  h.toasts = [];
  b!.onClick!();
  return h.toasts;
}

// The sentence named income, school at least half-time or an exception from 2026-10-16: until then it said “$580.00 of
// earnings”, and income of any kind counts toward the $580 since (42 CFR 435.552(f)(2)). From 2026-10-17 it names income,
// time at the School or an exception: until then it began with 80 hours' work, which nobody off the School can do (brief 12).
const REFUSED = 'From January 1, 2027, HUSKY D asks for $580.00 of income, time at the School or an exception in the month before you apply, and last month had none of them.';

/** Two citizens at the School to the last night of 2026, with need (Comfortable) and without (Inherited). */
const atSchool = once(() => {
  const need = life('cover-need', 'comfortable', 'us-ny-newyork');
  const rich = life('cover-rich', 'inherited', 'us-ny-newyork');
  tend(need, at(2026, 12, 31, 23, 30));
  tend(rich, at(2026, 12, 31, 23, 30));
  return { need: freeze(need), rich: freeze(rich) };
});
/** A personal leave asked on 12 January 2027, the spring's second class day, begun on its decision, 20 January. */
const onLeave = (sim: Simulation): Simulation => {
  tend(sim, at(2027, 1, 12, 12));
  const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
  tend(sim, asked.decideAt + MS_HOUR);
  expect(sim.player.school!.leave).toMatchObject({ status: 'on', kind: 'personal' });
  expect(sim.player.school!.leave!.affiliate).toBeUndefined();
  expect(coverOn(sim.player, sim.now)).toBeUndefined();
  return sim;
};

// ---------------------------------------------------------------------------
// 1. HUSKY D's work test, asked of somebody applying (health.enroll)
// ---------------------------------------------------------------------------

describe('health.enroll: HUSKY D asks an applicant for the month before’s work, from 2027', () => {
  const leave = once(() => {
    const sim = onLeave(thaw(atSchool().need));
    return freeze(sim);
  });

  // Until 2026-10-15 this journey had her refused on 1 February for January's 6 hours, the School read at the instant she
  // applied, when she was on her leave. The month is read whole since that day (`enrolledIn`): a student's enrollment
  // "will end at the end of the month that the student ... withdraws" (42 CFR 435.552(c)(3), CMS-2454-IFC, read
  // 2026-10-15), so her 1 to 19 January at the School are January enrolled, and the refusal is February's, a month wholly
  // on the leave. Her 6 hours of January are still short of the work.
  it('PLAYER JOURNEY: a student with need on a personal leave from 20 January 2027 is given HUSKY D on 1 February for January at the School, refused it on 1 March for a February wholly on the leave, in The Marketplace’s words, and Enroll buys the marketplace; with $600 of wages in February (TEST SETUP) she’s given HUSKY D; past the 60 days Enroll isn’t drawn', () => {
    const january = thaw(leave());
    january.advanceTo(at(2027, 2, 1, 9));
    // January: under HUSKY D's $1,835.40, and 6 hours of work-study, $138.00, short of 80 hours and of $580; but at the
    // School to the 19th, a month enrolled.
    expect(earningsOf(january.player).months['2027-01']).toBeLessThan(1_835_40);
    expect(workedBetween(january, january.player, at(2027, 1, 1, 0), at(2027, 2, 1, 0))).toEqual({ pay: 138_00, hours: 6 });
    const given = papers(january);
    expect(given).toContain('Last month’s income qualifies you for HUSKY D. You can enroll at any time, with no premium.');
    expect(given).not.toContain(REFUSED);
    // From the first of the month she enrolls in, 1 February, renewed six months on, 1 August (Connecticut's UPM
    // § 1560.10(B), from 2026-10-16, brief 09's journeys: until then from 1 March, renewed 1 September). January, the one
    // month an application from 2027 reaches back, had no care with nothing covering her, so it isn't reached.
    expect(pressEnroll()).toEqual(['Enrolled in HUSKY D, from February 1, 2027.']);
    expect(healthOf(january.player).program).toMatchObject({ kind: 'medicaid', state: 'ct', from: at(2027, 2, 1, 0), renewAt: at(2027, 8, 1, 0) });

    // 1 March: February was all on the leave, with no work. Within the 60 days of losing Yale Health on 20 January (to
    // 21 March), so the marketplace is open, from 1 April.
    const idle = thaw(leave());
    idle.advanceTo(at(2027, 3, 1, 9));
    expect(earningsOf(idle.player).months['2027-02'] ?? 0).toBeLessThan(1_835_40);
    expect(workedBetween(idle, idle.player, at(2027, 2, 1, 0), at(2027, 3, 1, 0))).toEqual({ pay: 0, hours: 0 });
    const text = papers(idle);
    expect(text).toContain(`${REFUSED} The marketplace is open to you, because you’re within 60 days of losing cover.`);
    expect(text).not.toContain('Last month’s income qualifies you for HUSKY D');
    expect(pressEnroll()).toEqual(['Enrolled in the marketplace, from April 1, 2027.']);
    expect(healthOf(idle.player).program).toBeUndefined();

    // Change the input: $600 of wages in February, 80 hours' pay (TEST SETUP: no played life on a leave has it). HUSKY D, from 1 March,
    // the month she enrolls in, renewed six months on (until 2026-10-16 from 1 April).
    const worked = thaw(leave());
    wagesPosted(worked, at(2027, 2, 26, 17), 600_00, 80);
    worked.advanceTo(at(2027, 3, 1, 9));
    expect(papers(worked)).toContain('Last month’s income qualifies you for HUSKY D. You can enroll at any time, with no premium.');
    expect(pressEnroll()).toEqual(['Enrolled in HUSKY D, from March 1, 2027.']);
    expect(healthOf(worked.player).program).toMatchObject({ kind: 'medicaid', state: 'ct', from: at(2027, 3, 1, 0), renewAt: at(2027, 9, 1, 0) });

    // Past the 60 days from the loss (Yale Health lapsed on 20 January, and the 1 February look found her uncovered), and
    // out of open enrollment: the refusal stands alone and Enroll isn't drawn.
    const late = thaw(leave());
    late.advanceTo(at(2027, 4, 5, 9));
    const lateText = papers(late);
    expect(lateText).toContain(`${REFUSED} It’s outside open enrollment, October 23 to January 15, and you haven’t lost cover in the last 60 days.`);
    expect(enrollDrawn()).toEqual([]);
    expect(late.execute({ kind: 'health.enroll', payload: {} }).error).toBe(`${REFUSED} It’s outside open enrollment, October 23 to January 15, and you haven’t lost cover in the last 60 days.`);
  }, 600_000);

  // Found by the skeptic's play of 2026-10-15: until then the School was read at the instant she applied, and a student
  // at the School all of January who withdrew on 1 February was refused on 2 February, "last month had none of them".
  it('PLAYER JOURNEY: at the School all of January 2027 and withdrawn on 1 February, she’s given HUSKY D on 2 February for January enrolled; on 1 April, March after the School, she’s refused', () => {
    const left = thaw(atSchool().need);
    tend(left, at(2027, 2, 1, 12));
    expect(left.player.school!.standing).toBe('good');
    left.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(left.player.school!.standing).toBe('withdrawn');
    const later = thaw(freeze(left));
    left.advanceTo(at(2027, 2, 2, 9));
    // January's income under HUSKY D's $1,835.40, and its work short of 80 hours and $580: the School alone meets it.
    expect(earningsOf(left.player).months['2027-01']).toBeLessThan(1_835_40);
    const jan = workedBetween(left, left.player, at(2027, 1, 1, 0), at(2027, 2, 1, 0));
    expect(jan.hours).toBeLessThan(80);
    expect(jan.pay).toBeLessThan(580_00);
    const text = papers(left);
    expect(text).toContain('Last month’s income qualifies you for HUSKY D. You can enroll at any time, with no premium.');
    expect(text).not.toContain(REFUSED);
    // Withdrawn after the fifteenth day of classes, Yale Health covers her thirty days more, to 3 March, and HUSKY D
    // begins on the first of a month on or after that, 1 April.
    expect(pressEnroll()).toEqual(['Enrolled in HUSKY D, from April 1, 2027.']);
    // Change the input, the month read: on 1 April the month before is March, after the School ended in February.
    later.advanceTo(at(2027, 4, 1, 9));
    expect(workedBetween(later, later.player, at(2027, 3, 1, 0), at(2027, 4, 1, 0))).toEqual({ pay: 0, hours: 0 });
    expect(papers(later)).toContain(REFUSED);
  }, 600_000);

  // Until 2026-10-16 the renewal ended her HUSKY D at its own hour. Since then it sends a notice of noncompliance, she's
  // covered while she answers, it's decided and ends with the month (42 USC 1396a(xx)(6); 42 CFR 435.558, 431.211).
  // Renamed later on 2026-10-16 (brief 09's journeys, inputs/renames.json; until then “PLAYER JOURNEY: ended at renewal on 1 November 2027 for having no work, she presses Enroll the next day: HUSKY D isn’t given back, the line says why, and Enroll buys the marketplace in open enrollment, until 2026-10-16; since then the renewal sends a notice, HUSKY D ends with December, and the next day is 2 January 2028”): HUSKY D begins on the
  // first of the month of application, and reaches back to a month before it with care in it (Connecticut's UPM
  // § 1560.10), so enrolled on 1 October 2026, her generic filled uninsured on 31 August, it runs from 1 August and is
  // renewed on 1 October 2027; the notice received on 6 October, answered by 4 November, decided on 5 November, and ten
  // days on, 15 November, it ends with November. The next day she's on is 2 December, November the month before, in
  // open enrollment (23 October to 15 January), so the marketplace from 1 January 2028.
  it('PLAYER JOURNEY: HUSKY D enrolled on 1 October 2026, from 1 August, the month of a generic filled uninsured, comes to renewal on 1 October 2027 with no work; its notice ends it with November, and pressing Enroll on 2 December 2027, November the month before, doesn’t give it back, the line says why, and Enroll buys the marketplace in open enrollment', () => {
    const sim = life('cover-r1', 'comfortable', 'us-ny-newyork');
    sim.advanceTo(at(2026, 8, 25, 12));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    sim.advanceTo(at(2026, 10, 1, 9));
    papers(sim);
    expect((healthOf(sim.player).fills ?? []).filter((f) => f.at < at(2026, 10, 1, 0)).map((f) => [f.at, coverOn(sim.player, f.at)])).toEqual([[at(2026, 8, 31, 9), undefined]]);
    expect(pressEnroll()).toEqual(['Enrolled in HUSKY D, from August 1, 2026.']);
    expect(healthOf(sim.player).program!.renewAt).toBe(at(2027, 10, 1, 0));
    const back = thaw(freeze(sim));
    back.advanceTo(at(2027, 10, 2, 9));
    expect(titled(back, 'A Notice Of Noncompliance').map((n) => n.at)).toEqual([at(2027, 10, 1, 0, 30)]);
    expect(coverOn(back.player, back.now)).toBe('medicaid');
    back.advanceTo(at(2027, 12, 2, 9));
    expect(titled(back, 'Your Public Cover Ends').map((n) => n.at)).toEqual([at(2027, 11, 5, 0)]);
    expect(coverOn(back.player, back.now)).toBeUndefined();
    // The next day, November the month before: under the line, no work, and no school.
    expect(earningsOf(back.player).months['2027-11']).toBeLessThan(580_00);
    expect(workedBetween(back, back.player, at(2027, 11, 1, 0), at(2027, 12, 1, 0))).toEqual({ pay: 0, hours: 0 });
    expect(papers(back)).toContain(`${REFUSED} The marketplace is open to you, because it’s open enrollment.`);
    expect(pressEnroll()).toEqual(['Enrolled in the marketplace, from January 1, 2028.']);
    expect(healthOf(back.player).program!.until).toBe(at(2027, 12, 1, 0));
    expect(healthOf(back.player).marketplace).toEqual({ from: at(2028, 1, 1, 0), state: 'ct' });
  }, 300_000);
});

// ---------------------------------------------------------------------------
// 2. Covered Connecticut and the premium tax credit, for a student in F-1 status
// ---------------------------------------------------------------------------

describe('Covered Connecticut is had with the premium tax credit: none under the poverty line, and from 2027 none for an F-1 student', () => {
  it('PLAYER JOURNEY: an F-1 student with need, withdrawn on 21 September 2026 and in her grace on 1 October, on September’s income under the credit’s $1,304.17, is given the marketplace, not Covered Connecticut', () => {
    const sim = life('cover-f1-need', 'comfortable', 'uk-eng-london');
    sim.advanceTo(at(2026, 9, 21, 12));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(false);
    sim.advanceTo(at(2026, 10, 1, 9));
    expect(sim.player.usOutOfStatus).toBeUndefined();
    // 15,650 ÷ 12 = 1,304.17 (1,304.16⅔): the credit's floor in 2026.
    expect(earningsOf(sim.player).months['2026-09']).toBeLessThan(1_304_16);
    expect(papers(sim)).toContain('You’re within 60 days before Yale Health’s cover ends.');
    expect(pressEnroll()).toEqual(['Enrolled in the marketplace, from November 1, 2026.']);
    expect(healthOf(sim.player).program).toBeUndefined();
  }, 120_000);

  /**
   * An Inherited family's student withdrawn on 21 September or 1 December 2026, and played to enroll on 1 October or
   * 2 December, on the month before's income within Covered Connecticut's band. A citizen earns it: savings at Capital
   * One set on the month before's last night to $665,986, which earns 665,986 × 0.029595 × 30 ÷ 365 = $1,620.00 in the
   * month, beside the work-study paid in it, $23.00 an hour. An F-1 student can't (TEST SETUP: the month's income set on
   * her record to $2,052.00): Capital One and Citi open only for a US citizen or green card holder, so her money is at
   * Chase, whose savings pays a few dollars a month on millions; and her work-study, the only other income a student
   * has, is under the credit's floor. So no played F-1 life reaches Covered Connecticut from 2026-10-15 at all; until
   * then one did on September's work-study alone (the journey above).
   */
  const withdrawnOn = (seed: string, born: 'us-ny-newyork' | 'uk-eng-london', month: 9 | 11) => {
    const sim = life(seed, 'inherited', born);
    sim.advanceTo(at(2026, month - 1, 31, 23, 30));
    if (born === 'us-ny-newyork') setSavings(sim, 665_986_00); // $657,000 until brief 21 (2026-10-22): above
    sim.advanceTo(month === 9 ? at(2026, 9, 21, 12) : at(2026, 12, 1, 12));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    sim.advanceTo(month === 9 ? at(2026, 10, 1, 9) : at(2026, 12, 2, 9));
    const key = `2026-${month === 9 ? '09' : '11'}`;
    if (born === 'us-ny-newyork') {
      expect(interest(sim, 2026, month)).toEqual([1_620_00]);
      const work = workedBetween(sim, sim.player, at(2026, month, 1, 0), at(2026, month + 1, 1, 0));
      expect(work.pay).toBe(work.hours * 23_00);
      const income = earningsOf(sim.player).months[key]!;
      expect(income).toBe(1_620_00 + work.pay);
      // Over HUSKY D's $1,835.40, within Covered Connecticut's $2,282.29.
      expect(income).toBeGreaterThan(1_835_40);
      expect(income).toBeLessThanOrEqual(2_282_29);
    } else {
      expect(mine(sim, 'savings')[0]!.bankId).toBe('us-chase');
      earningsOf(sim.player).months[key] = 2_052_00; // TEST SETUP: a month's income no played F-1 life has
    }
    expect(sim.player.usOutOfStatus).toBeUndefined();
    return sim;
  };

  it('TEST SETUP: an F-1 student on a month’s $2,052.00 (set by hand) is given Covered Connecticut from 1 November 2026, and the marketplace from 1 January 2027; a citizen who earns it, Covered Connecticut from 1 January', () => {
    // $2,052.00: over the floor's $1,304.17 and HUSKY D's $1,835.40 (which an F-1 student isn't admitted to from
    // 1 October 2026), within $2,282.29.
    const fall = withdrawnOn('cover-f1-oct', 'uk-eng-london', 9);
    papers(fall);
    expect(pressEnroll()).toEqual(['Enrolled in Covered Connecticut, from November 1, 2026.']);

    const winter = withdrawnOn('cover-f1-dec', 'uk-eng-london', 11);
    // Withdrawn on 1 December, Yale Health runs thirty days, to 31 December: cover from 1 January 2027, a year the credit
    // isn't hers.
    expect(papers(winter)).toContain('It’s open enrollment.');
    expect(pressEnroll()).toEqual(['Enrolled in the marketplace, from January 1, 2027.']);
    expect(healthOf(winter.player).program).toBeUndefined();

    // Change the input: born in New York, a citizen, the same day, the same income.
    const citizen = withdrawnOn('cover-cit-dec', 'us-ny-newyork', 11);
    papers(citizen);
    expect(pressEnroll()).toEqual(['Enrolled in Covered Connecticut, from January 1, 2027.']);
  }, 600_000);

  it('TEST SETUP: Covered Connecticut held from 1 November 2026 by an F-1 student kept in status past her grace ends on 1 January 2027, said, and the marketplace is open to her; a citizen’s runs on', () => {
    const f1 = withdrawnOn('cover-f1-hold', 'uk-eng-london', 9);
    papers(f1);
    expect(pressEnroll()).toEqual(['Enrolled in Covered Connecticut, from November 1, 2026.']);
    // TEST SETUP: her status kept past the withdrawal's fifteen days. No played F-1 life holds Covered Connecticut on
    // 1 January 2027: a personal leave is refused her, a medical leave keeps Yale Health, a withdrawal's or a dismissal's
    // grace ends her status (and the plan with it) within weeks, and OPT comes after the degree, in 2029.
    for (const item of f1.universe.scheduled) if (item.kind === US_STATUS_KIND && item.status === 'pending') f1.timeline.cancel(item.id, f1.now);
    f1.advanceTo(at(2026, 12, 31, 12));
    expect(coverOn(f1.player, f1.now)).toBe('essential');
    f1.advanceTo(at(2027, 1, 2, 9));
    expect(f1.player.usOutOfStatus).toBeUndefined();
    expect(healthOf(f1.player).program).toMatchObject({ kind: 'essential', from: at(2026, 11, 1, 0), until: at(2027, 1, 1, 0, 30) });
    expect(coverOn(f1.player, f1.now)).toBeUndefined();
    expect(titled(f1, 'Your Public Cover Has Ended').map((n) => [n.at, n.body])).toEqual([[at(2027, 1, 1, 0, 30), 'Covered Connecticut depends on the premium tax credit. From January 1, 2027, a noncitizen gets that credit only with a green card, as a Cuban or Haitian entrant, or under a Compact of Free Association. You can still buy a marketplace plan, without the credit.']]);
    expect(titled(f1, 'Your Health Cover Ended').map((n) => n.body)).toEqual(['You have no health cover from January 1, 2027. You have 60 days to enroll in the marketplace. Enroll on Papers, under Health Cover.']);
    expect(titled(f1, 'Your Public Cover Ends')).toEqual([]);
    papers(f1);
    expect(pressEnroll()).toEqual(['Enrolled in the marketplace, from February 1, 2027.']);

    // Change the input: a citizen, enrolled the same way, keeps it to its renewal on 1 November 2027.
    const citizen = withdrawnOn('cover-cit-hold', 'us-ny-newyork', 9);
    papers(citizen);
    expect(pressEnroll()).toEqual(['Enrolled in Covered Connecticut, from November 1, 2026.']);
    citizen.advanceTo(at(2027, 1, 2, 9));
    expect(coverOn(citizen.player, citizen.now)).toBe('essential');
    expect(healthOf(citizen.player).program!.until).toBeUndefined();
    expect(healthOf(citizen.player).program!.renewAt).toBe(at(2027, 11, 1, 0));
    expect(titled(citizen, 'Your Public Cover Has Ended')).toEqual([]);
  }, 600_000);
});

// ---------------------------------------------------------------------------
// 3. A program taken on a leave, and Yale Health again on the return
// ---------------------------------------------------------------------------

describe('a program taken on a personal leave without Affiliate cover, and Yale Health back on the return', () => {
  /** Back from the leave on 3 January 2028, notice given, the Yale account paid and registered, played at the School to `until`. */
  const backAtSchool = (sim: Simulation, until: Instant) => {
    sim.advanceTo(at(2027, 11, 1, 9));
    sim.must({ kind: 'school.return_notice', payload: {} });
    sim.advanceTo(at(2028, 1, 3, 12));
    expect(sim.player.school!.leaves?.at(-1)).toMatchObject({ status: 'returned', returnedAt: at(2028, 1, 3, 9) });
    sim.execute({ kind: 'school.pay_balance', payload: {} });
    sim.must({ kind: 'school.reregister', payload: {} });
    tend(sim, until);
  };

  it('PLAYER JOURNEY: an Inherited family’s student enrolls in Covered Connecticut on her leave, on January’s interest; back at the School on 3 January 2028, Yale Health covers her and Covered Connecticut ends at the 1 February look, said', () => {
    const sim = thaw(atSchool().rich);
    // $813,982.33, a hundredth of a cent over $2,046.00 in January: $813,983, a sixth of a cent over, took December's
    // carried fraction a cent past it. $803,000 until brief 21 (2026-10-22): above.
    setSavings(sim, 813_982_33);
    onLeave(sim);
    sim.advanceTo(at(2027, 2, 1, 9));
    // January: $2,046.00 of interest and 6 hours' work-study, $138.00: $2,184.00, over $1,835.40 and within $2,327.50.
    expect(interest(sim, 2027, 1)).toEqual([2_046_00]);
    expect(earningsOf(sim.player).months['2027-01']).toBe(2_184_00);
    papers(sim);
    expect(pressEnroll()).toEqual(['Enrolled in Covered Connecticut, from March 1, 2027.']);
    expect(healthOf(sim.player).program!.renewAt).toBe(at(2027, 9, 1, 0));
    backAtSchool(sim, at(2028, 1, 31, 12));
    // Back, before the look: Yale Health covers her, and Covered Connecticut, renewed on 1 September on August's interest,
    // runs beside it until the month's look.
    expect(coverOn(sim.player, sim.now)).toBe('yale');
    expect(healthOf(sim.player).program).toMatchObject({ kind: 'essential', renewAt: at(2028, 3, 1, 0) });
    expect(healthOf(sim.player).program!.until).toBeUndefined();
    tend(sim, at(2028, 2, 1, 9));
    expect(healthOf(sim.player).program!.until).toBe(at(2028, 2, 1, 0, 30));
    expect(titled(sim, 'Your Public Cover Has Ended').map((n) => [n.at, n.body])).toEqual([[at(2028, 2, 1, 0, 30), 'You have Yale Health’s student cover again, and Covered Connecticut is only for people with no other qualifying cover.']]);
    expect(coverOn(sim.player, sim.now)).toBe('yale');
    expect(titled(sim, 'Your Health Cover Ended').filter((n) => n.at >= at(2028, 1, 1, 0))).toEqual([]);
    expect(healthOf(sim.player).covered).toBe(true);
  }, 900_000);

  // Renamed on 2026-10-16 (brief 09's journeys, inputs/renames.json; until then “PLAYER JOURNEY: a student with need takes HUSKY D on her leave (TEST SETUP: the work it asks); back at the School it stays beside Yale Health, and its renewal on 1 March 2028 is met by her being at the School”): HUSKY D begins on the
  // first of the month of application, 1 February 2027 (Connecticut's UPM § 1560.10(B)), not 1 March, so each renewal six
  // months on comes a month earlier: 1 August 2027, met by July's work (TEST SETUP), and 1 February 2028, which reads
  // August 2027 to January 2028 and is met by January at the School.
  it('PLAYER JOURNEY: a student with need takes HUSKY D on her leave (TEST SETUP: the work it asks); back at the School it stays beside Yale Health, and its renewal on 1 February 2028 is met by her being at the School', () => {
    const sim = onLeave(thaw(atSchool().need));
    wagesPosted(sim, at(2027, 1, 29, 17), 600_00, 80); // TEST SETUP: January's work, which no played life on a leave has
    sim.advanceTo(at(2027, 2, 1, 9));
    papers(sim);
    expect(pressEnroll()).toEqual(['Enrolled in HUSKY D, from February 1, 2027.']);
    wagesPosted(sim, at(2027, 7, 30, 17), 600_00, 80); // TEST SETUP: July's work, for the renewal on 1 August
    sim.advanceTo(at(2027, 8, 1, 9));
    expect(healthOf(sim.player).program).toMatchObject({ kind: 'medicaid', renewAt: at(2028, 2, 1, 0) });
    backAtSchool(sim, at(2028, 1, 31, 12));
    // Beside Yale Health, which pays first: HUSKY D isn't ended.
    expect(coverOn(sim.player, sim.now)).toBe('yale');
    expect(healthOf(sim.player).program!.until).toBeUndefined();
    tend(sim, at(2028, 2, 2, 9));
    expect(titled(sim, 'Your Public Cover Has Ended')).toEqual([]);
    // January 2028: under the line, and short of the work, 80 hours or $580; at the School, she meets it.
    expect(earningsOf(sim.player).months['2028-01']).toBeLessThan(1_835_40);
    const january = workedBetween(sim, sim.player, at(2028, 1, 1, 0), at(2028, 2, 1, 0));
    expect(january.hours).toBeLessThan(80);
    expect(january.pay).toBeLessThan(580_00);
    expect(titled(sim, 'Your Public Cover Ends')).toEqual([]);
    expect(healthOf(sim.player).program).toMatchObject({ kind: 'medicaid', renewAt: at(2028, 8, 1, 0) });
    expect(healthOf(sim.player).program!.until).toBeUndefined();
  }, 900_000);
});

// ---------------------------------------------------------------------------
// 4. A renewal kept by her being at the School, by play alone (brief 12, 2026-10-17)
// ---------------------------------------------------------------------------

describe('health.enroll: a renewal kept by a month at the School, played', () => {
  /**
   * Brief 12's health area (docs/verification/resolution-2026-10-17/health-criteria.md, H3): until that day the one test
   * of a renewal met by the School reached it through a renewal held by work posted by hand (the leave journey above,
   * whose August renewal July's TEST SETUP work held). Here nothing is posted. A student with need on her personal leave
   * from 20 January 2027 enrolls on Papers on 21 January, Yale Health having lapsed the day before: HUSKY D from the first
   * of the month of application, 1 January (`programStart`), renewed six months on, 1 July, reading January to June. The
   * leave began on the 20th, so January was a month at the School (`enrolledIn`), and it meets the rules. Change the input,
   * the day she enrolls: her twin who waits to 1 February is given HUSKY D from February, renewed on 1 August, reading
   * February to July, all on the leave, with under $580 of income in each, no SNAP and no stay: a notice of noncompliance.
   * Each is said on Home, as What Needs You draws it once the player has read what was there.
   */
  const RENEWED = 'HUSKY D is renewed. Its next renewal is on January 1, 2028. Last month’s income is within its limit, and you met its work rules in January 2027, with time at the School.';
  const NOTICE = 'HUSKY D couldn’t find $580.00 of income, time at the School or an exception in any month from February to July 2027.';

  it('PLAYER JOURNEY: on a personal leave from 20 January 2027, she enrolls in HUSKY D on Papers on 21 January, from 1 January; its renewal on 1 July is kept, Home saying January 2027 met its work rules at the School, said once across a reload; her twin who enrolls on 1 February is renewed on 1 August with no month at the School, and Home draws the notice of noncompliance', async () => {
    const { Home } = await import('@/ui/screens/Home');
    const home = (sim: Simulation): string => { h.sim = sim; h.clicks = []; return onScreen(renderToStaticMarkup(createElement(Home as FunctionComponent))); };
    const snap = freeze(onLeave(thaw(atSchool().need)));

    const early = thaw(snap);
    early.advanceTo(at(2027, 1, 21, 9));
    expect(papers(early)).toContain('Last month’s income qualifies you for HUSKY D. You can enroll at any time, with no premium.');
    expect(pressEnroll()).toEqual(['Enrolled in HUSKY D, from January 1, 2027.']);
    expect(healthOf(early.player).program).toMatchObject({ kind: 'medicaid', state: 'ct', from: at(2027, 1, 1, 0), renewAt: at(2027, 7, 1, 0) });
    early.advanceTo(at(2027, 6, 30, 21));
    // February to June wholly on the leave, each under $580 of income: January, the month she left, is the one that meets it.
    for (const m of ['2027-02', '2027-03', '2027-04', '2027-05', '2027-06']) expect(earningsOf(early.player).months[m] ?? 0).toBeLessThan(580_00);
    expect(early.player.school!.leave).toMatchObject({ status: 'on', startedAt: at(2027, 1, 20, 12) });
    early.must({ kind: 'world.mark_read', payload: {} }); // What Needs You read, with Mark … Read
    const kept = thaw(freeze(early));
    kept.advanceTo(at(2027, 7, 1, 9));
    expect(healthOf(kept.player).program).toMatchObject({ kind: 'medicaid', from: at(2027, 1, 1, 0), renewAt: at(2028, 1, 1, 0) });
    expect(healthOf(kept.player).program!.until).toBeUndefined();
    expect(healthOf(kept.player).pending).toBeUndefined();
    expect(coverOn(kept.player, kept.now)).toBe('medicaid');
    expect(titled(kept, 'Your Public Cover Is Renewed').map((n) => [n.at, n.body])).toEqual([[at(2027, 7, 1, 0, 30), RENEWED]]);
    expect(titled(kept, 'A Notice Of Noncompliance')).toEqual([]);
    const keptHome = home(kept);
    expect(keptHome).toContain(`Your Public Cover Is Renewed ${RENEWED}`);
    expect(keptHome).not.toMatch(/hours’ work|half-time/);

    const late = thaw(snap);
    late.advanceTo(at(2027, 2, 1, 9));
    papers(late);
    expect(pressEnroll()).toEqual(['Enrolled in HUSKY D, from February 1, 2027.']);
    expect(healthOf(late.player).program).toMatchObject({ from: at(2027, 2, 1, 0), renewAt: at(2027, 8, 1, 0) });
    late.advanceTo(at(2027, 7, 31, 21));
    for (const m of ['2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07']) expect(earningsOf(late.player).months[m] ?? 0).toBeLessThan(580_00);
    late.must({ kind: 'world.mark_read', payload: {} });
    late.advanceTo(at(2027, 8, 1, 9));
    expect(healthOf(late.player).pending).toMatchObject({ kind: 'renewal', noticeAt: at(2027, 8, 1, 0, 30), months: ['2027-07', '2027-06', '2027-05', '2027-04', '2027-03', '2027-02'] });
    expect(titled(late, 'Your Public Cover Is Renewed')).toEqual([]);
    expect(coverOn(late.player, late.now)).toBe('medicaid');
    const lateHome = home(late);
    expect(lateHome).toContain(`A Notice Of Noncompliance ${NOTICE}`);
    expect(lateHome).not.toMatch(/hours’ work|half-time/);
  }, 900_000);
});
