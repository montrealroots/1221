/**
 * Round three of 2026-10-14's evidence, for eight Life and Papers rows the second round left partial
 * (health.enroll, health.appeal_decided, documents.us_status, world.tick, documents.apply_ssn, health.choose_clinic,
 * health.appointment, and the knob row that was ten knobs until receipts went). What changed beneath them that day:
 * creation offers a family (`withFamily`, `FAMILIES`), so a life whose savings earn past Connecticut's marketplace line is
 * made on the creation screen, where until then the marketplace was reached only on a month's wages posted by hand; the
 * ninety-day rule for an undated decision went, with the keeping of a closed row to a date still ahead; and the receipts
 * knob went.
 *
 * Every figure is worked here from the rule's own numbers and written as a literal, never asked of the engine's helper:
 * - Connecticut's marketplace line is 175% of 2025's poverty line, $15,650, a twelfth of it a month, $2,282.29;
 *   Connecticut's benchmark premium, KFF's 2026 average, is $706 a month, and $786 in 2027 (CT Mirror, 14 September 2026);
 * - an Inherited family's money is 240,000 € and 2,400,000 € at SLATE's 0.92 to the dollar, $260,870 in checking and
 *   $2,608,696 in savings, as tests/need-paths.test.ts works it; all but $20,000 of it put in Chase's CD is $2,849,566,
 *   at Chase's 3.50% a year, a 365th a day: 37 days, 25 August to 30 September, is $10,110.10, and the CD's 212 days to
 *   its maturity on 24 March 2027 are $57,928.16; broken on 10 March 2027 after 198 midnights, $54,102.71 earned less
 *   Chase's 180 days' interest for a term of six months to two years, $49,184.29, keeps $4,918.42;
 * - a doctor's visit uninsured is $183.98 and a marketplace's share $45, as tests/evidence-g05-life.test.ts works them,
 *   $138.98 between them; New Haven's wait for a doctor is AMN Healthcare's fifteen-metro average, 23.5 days, and for
 *   a specialist America's 31;
 * - Yale Health ends on a withdrawal by the fifteenth day of classes on the day, and after it thirty days on (Bulletin
 *   2026–27 p.174); a plan chosen before cover ends starts the first of the month on or after its end (45 CFR
 *   155.420(b)(2)(iv)), otherwise the first of next month; a withdrawn F-1 keeps her status fifteen days.
 *
 * What this round measured, and the two tests that failed on the tree of 2026-10-14 until that day's fixes (5f0cba03),
 * titled DEFECT until then and retitled for what they assert once they passed:
 * - A CD's interest was income nothing recorded. Chase's CD, opened on the first morning with an Inherited family's
 *   money, was credited $57,928.16 at its maturity, and neither the year's earnings (`recordInterest`) nor March's income
 *   saw a cent of it, where a savings account's month's interest and a CD's interest taken by hand were both recorded.
 *   So the student who withdrew on 1 April was given HUSKY D by Enroll, on March's $276 of work-study, where March's
 *   income was over Connecticut's line two hundredfold. It has been recorded since, wherever a term's interest is
 *   credited: renewed, moved to savings, paid out or broken (two tests below hold the last two). The interest taken by
 *   hand (`bank.take_term_interest`) is the way the F-1 here reaches the marketplace at all: with her savings left at
 *   Chase, Wells Fargo or Bank of America, September's income came to $435.44 at each, under the line, and Capital One,
 *   whose 3.00% carries the citizen of tests/need-paths.test.ts over it, won't open an F-1's account (creation gave her
 *   Chase when it was asked for).
 * - Out of status, the marketplace plan an F-1 bought in her grace ends on the next month's look, before the month it was
 *   to start: Yale Health's thirty days after a late withdrawal outlast the status's fifteen, so in every played life a
 *   marketplace plan ended this way had not begun. The notice said "Your Marketplace Plan Has Ended" until that day's
 *   fix, where Covered Connecticut's, ended the same way, has said "Your Public Cover Won’t Begin" since 2026-10-13; it
 *   has said "Your Marketplace Plan Won’t Begin" since. The 1 December notice that followed said she was uncovered from
 *   December 1, a month after Yale Health ended; it has given the day the cover ended since.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`, the family as the screen's `withFamily` gives it), Ada
 * Cole, born in New York (a citizen) or in London (on an F-1), an actor at Yale in New Haven from Monday 24 August 2026,
 * played by the clock (`advanceTo`), through the commands the screens send (`execute`, `must`), and through Papers
 * rendered as the player has it (react-dom/server), its Gated buttons pressed by their own onClick. A save is reloaded
 * (`loadSave` of its JSON) between slices where the clock runs on. The seeds are arbitrary: lp-m1, lp-m2, lp-m3, lp-cd,
 * lp-f1, lp-us, lp-ssn, lp-dr, lp-ap, lp-kn.
 *
 * TEST SETUP, said again where it's done: the week's illness draw forced to a doctor's visit or a stay in hospital, the
 * claim's draw to a denial and the appeal's to its outcome, as tests/evidence-g05-life.test.ts forces them, and a kept
 * visit's referral draw to a referral; the rows of a save from before 2026-10-14 left undated, as an older build wrote
 * them.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, migrate } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts, type Instant } from '@/engine/core/time';
import { newLifeConfig, withFamily, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { APPEAL_KIND, HEALTH_WEEK_KIND, coverOn, healthOf } from '@/engine/systems/health';
import { SPECIALIST, appointmentsOf } from '@/engine/systems/appointments';
import { earningsOf } from '@/engine/systems/earnings';
import { payeeAccount } from '@/engine/systems/cash';
import { openDecisions } from '@/engine/world/world';
import { KNOB_READS, PERSONALITY_TRAITS } from '@/engine/content/personality-traits';
import { KNOB_LIMITS } from '@/engine/systems/personality';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** The Gated buttons drawn, each with its feature, words, state and onClick. */
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
  toasts: [] as string[],
  tabs: {} as Record<string, string>,
}));

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back. `run` is the save's own execute.
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

// A Gated button drawn as it is, its feature, words and onClick kept so a test can press it as the player would.
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

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { at: lookAt } = await import('@/ui/looks');
const { resolveLook } = await import('@/ui/looks/registry');

// ---------------------------------------------------------------------------
// The lives, the clock and the screens
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** Ada Cole's answers with the family chosen as the creation screen's select chooses it (`withFamily`). */
const answers = (family: StartingWealth, extra: Partial<NewSaveConfig> = {}): NewSaveConfig =>
  withFamily({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra }, family);
const LONDON: Partial<NewSaveConfig> = { homeRegionId: 'uk-eng-london' };

const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => loadSave(JSON.parse(snap) as never);
function once<T>(play: () => T): () => T {
  let done: { value: T } | undefined;
  return () => (done ??= { value: play() }).value;
}
const mine = (sim: Simulation, kind: string) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && a.kind === kind && a.category !== 'term');
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const memos = (sim: Simulation, memo: RegExp) => sim.universe.transactions.filter((t) => memo.test(t.memo));
const into = (t: { postings: { accountId: string; amount: number }[] }, accountId: string) => t.postings.filter((p) => p.accountId === accountId).reduce((s, p) => s + p.amount, 0);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
/** What the marketplace's premium took from checking, by when. */
const premiums = (sim: Simulation) => memos(sim, /^Marketplace health plan premium$/).map((t) => [t.at, -into(t, checking(sim).id)]);

/** A screen as the player has it; the Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, screen: FunctionComponent, tabs: Record<string, string> = {}): { html: string; text: string } {
  h.sim = sim;
  h.clicks = [];
  h.tabs = tabs;
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: onScreen(html) };
}
const HEALTH_TAB = { 'tab:/workspace/papers': 'health' };
const papers = (sim: Simulation) => drawn(sim, PapersWorkspace, HEALTH_TAB);
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);
/** A Gated button pressed by its own onClick: what it toasted. */
function press(feature: string): string[] {
  const b = drew(feature)[0];
  expect(b, `a ${feature} button`).toBeDefined();
  h.toasts = [];
  b!.onClick!();
  return h.toasts;
}
/** A look as it opens: its body's words. */
function look(sim: Simulation, kind: string, id: string): string {
  h.sim = sim;
  const found = resolveLook(sim, lookAt(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  return onScreen(renderToStaticMarkup(createElement('div', null, found.body)));
}

/**
 * TEST SETUP: draws forced on one save: a stream's numbers for one key, or for every key, given in order, and then
 * 0.999, a "no" to every chance after them.
 */
function forcing(sim: Simulation): (stream: string, key: (string | number)[] | null, values: number[]) => void {
  const forced = new Map<string, number[]>();
  const real = sim.rng.bind(sim);
  const rng = (stream: string, ...keys: (string | number)[]) => {
    const values = forced.get([stream, ...keys].join('|')) ?? forced.get(stream);
    const d = real(stream, ...keys);
    if (!values) return d;
    let i = 0;
    return { ...d, next: () => values[i++] ?? 0.999 };
  };
  Object.assign(sim, { rng });
  return (stream, key, values) => { forced.set(key ? [stream, ...key].join('|') : stream, values); };
}
/** The week's draw in `illnessWeek`'s order: a stay in hospital is the first chance, a doctor's visit the third. */
const VISIT = [0.999, 0.999, 0];
const STAY = [0];
/** TEST SETUP: the next health week's draw forced, and the week played. */
function forceWeek(sim: Simulation, force: ReturnType<typeof forcing>, draws: number[]) {
  const week = pendingOf(sim, HEALTH_WEEK_KIND)[0]!;
  force('health.illness', [sim.player.id, String(week.at)], draws);
  sim.advanceTo(week.at + MS_HOUR);
  return week.at;
}

const SHARE = 45_00;
const UNINSURED = 183_98;
/** New Haven’s wait for a doctor: AMN Healthcare’s 2025 average over its fifteen metros, 23.5 days, to the day. */
const VISIT_WAIT = 24;
/** Yale Health's "same-day or next-day" appointment, the next weekday, where a member's visit goes with nothing picked (from 2026-10-15). */
const YALE_WAIT = 1;
/** Chase's CD of everything but $20,000: $2,849,566. */
const IN_CD = 2_849_566_00;

/** A life at Capital One, withdrawn on 25 August 2026 in the first fifteen days, so Yale Health ends; played to 1 October. */
function withdrawnEarly(seed: string, family: StartingWealth): Simulation {
  const sim = createSave(1, seed, { ...answers(family), bankId: 'us-capital-one' });
  sim.advanceTo(at(2026, 8, 25, 12));
  expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
  sim.advanceTo(at(2026, 10, 1, 9));
  return sim;
}

/** Everything but $20,000 moved from savings and put in Chase's CD on the first morning, as the bank's screens send it. */
function intoTheCd(sim: Simulation): string {
  const savings = mine(sim, 'savings')[0]!;
  sim.must({ kind: 'bank.transfer', payload: { fromId: savings.id, toId: checking(sim).id, amount: savings.balance } });
  expect(checking(sim).balance - 20_000_00).toBe(IN_CD);
  return sim.must<{ accountId: string }>({ kind: 'bank.open_term', payload: { amount: IN_CD } }).accountId;
}

// ---------------------------------------------------------------------------
// health.enroll: the marketplace a family's savings reach, followed to its premiums
// ---------------------------------------------------------------------------

/** The Inherited life of tests/need-paths.test.ts, enrolled on Papers on 1 October, frozen as Enroll leaves it. */
const enrolled = once(() => {
  const sim = withdrawnEarly('lp-m1', 'inherited');
  expect(earningsOf(sim.player).months['2026-09']).toBe(6_436_10);
  papers(sim);
  const toast = press('health.enroll');
  return { toast, snap: freeze(sim) };
});

describe('health.enroll, on income the clock paid (round three)', () => {
  it('PLAYER JOURNEY: the Inherited student’s marketplace, Enrolled from 1 November on Papers, is charged $706 on 1 November and 1 December and $786 on 1 January 2027, each once across a reload; it’s refused again in its own words before and after it begins', () => {
    const { toast, snap } = enrolled();
    expect(toast).toEqual(['Enrolled in the marketplace, from November 1, 2026.']);
    const sim = thaw(snap);
    // Papers draws no Enroll while the plan waits, and the command says why.
    papers(sim);
    expect(drew('health.enroll')).toHaveLength(0);
    expect(sim.execute({ kind: 'health.enroll', payload: {} }).error).toBe('You’re already enrolled, from November 1, 2026.');
    sim.advanceTo(at(2026, 11, 2, 9));
    expect(coverOn(sim.player, sim.now)).toBe('marketplace');
    expect(sim.execute({ kind: 'health.enroll', payload: {} }).error).toBe('You’re already enrolled.');
    const nov = freeze(sim);
    const again = thaw(nov);
    again.advanceTo(at(2027, 1, 2, 9));
    expect(premiums(again)).toEqual([[at(2026, 11, 1, 0, 30), 706_00], [at(2026, 12, 1, 0, 30), 706_00], [at(2027, 1, 1, 0, 30), 786_00]]);
    expect(healthOf(again.player).premiums).toEqual({ 2026: [706_00, 706_00], 2027: [786_00] });
  }, 60_000);

  it('PLAYER JOURNEY: withdrawn after the fifteenth day, on 9 October, Yale Health covers thirty days more, to 8 November, and Enroll gives the marketplace from 1 December, the first of the month after Yale’s end, not 1 November; no premium is taken on 1 November', () => {
    const sim = createSave(1, 'lp-m3', { ...answers('inherited'), bankId: 'us-capital-one' });
    sim.advanceTo(at(2026, 10, 9, 9));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(false);
    papers(sim);
    expect(press('health.enroll')).toEqual(['Enrolled in the marketplace, from December 1, 2026.']);
    // Thirty days of hours from nine on 9 October is eight on 8 November, the clocks having gone back on 1 November.
    sim.advanceTo(at(2026, 11, 8, 7, 30));
    expect(coverOn(sim.player, sim.now)).toBe('yale');
    expect(coverOn(sim.player, at(2026, 11, 8, 8))).toBeUndefined();
    expect(premiums(sim)).toEqual([]);
    sim.advanceTo(at(2026, 11, 15, 9));
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    sim.advanceTo(at(2026, 12, 2, 9));
    expect(coverOn(sim.player, sim.now)).toBe('marketplace');
    expect(premiums(sim)).toEqual([[at(2026, 12, 1, 0, 30), 706_00]]);
  }, 60_000);

  it('PLAYER JOURNEY: a CD’s interest, $57,928.16 at its maturity on 24 March 2027, is income the year’s record and March’s income test read, so Enroll on 1 April gives the marketplace, not HUSKY D', () => {
    const sim = createSave(1, 'lp-cd', { ...answers('inherited'), bankId: 'us-chase' });
    const cd = intoTheCd(sim);
    sim.advanceTo(at(2027, 3, 25, 9));
    expect(memos(sim, /^Interest: CD, reinvested$/).map((t) => into(t, cd))).toEqual([57_928_16]);
    sim.advanceTo(at(2027, 4, 1, 9));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(false);
    expect(earningsOf(sim.player).years[2027]?.interest ?? 0).toBe(57_928_16);
    papers(sim);
    // Yale Health ends thirty days on, 1 May at nine, so the plan starts on 1 June.
    expect(press('health.enroll')).toEqual(['Enrolled in the marketplace, from June 1, 2027.']);
  }, 60_000);

  // From 2026-10-14 a term's interest is recorded wherever it's credited, once. These two failed before: the CD paid
  // out, and the CD broken, posted their interest and left the year's record at nothing.
  it('PLAYER JOURNEY: the same CD set to be paid out at its end is paid $57,928.16 of interest on 24 March 2027, and the year’s record and March’s income hold it once', () => {
    const sim = createSave(1, 'lp-cd', { ...answers('inherited'), bankId: 'us-chase' });
    const cd = intoTheCd(sim);
    sim.must({ kind: 'bank.set_term_end', payload: { accountId: cd, atEnd: 'paid_out' } });
    sim.advanceTo(at(2027, 3, 23, 9));
    const before = earningsOf(sim.player).months['2027-03'] ?? 0;
    expect(earningsOf(sim.player).years[2027]?.interest ?? 0).toBe(0);
    sim.advanceTo(at(2027, 3, 25, 9));
    const paid = memos(sim, /^CD paid out$/);
    expect(paid).toHaveLength(1);
    const interest = -paid[0]!.postings.filter((p) => sim.universe.accounts[p.accountId]?.nominal && p.amount < 0).reduce((s, p) => s + p.amount, 0);
    expect(interest).toBe(57_928_16);
    expect(earningsOf(sim.player).years[2027]?.interest).toBe(57_928_16);
    expect((earningsOf(sim.player).months['2027-03'] ?? 0) - before).toBe(57_928_16);
  }, 60_000);

  it('PLAYER JOURNEY: the same CD broken on 10 March 2027, 198 days’ interest less Chase’s 180 days’, keeps $4,918.42, and records it as the year’s interest and March’s income, once', () => {
    const sim = createSave(1, 'lp-cd', { ...answers('inherited'), bankId: 'us-chase' });
    const cd = intoTheCd(sim);
    sim.advanceTo(at(2027, 3, 10, 9));
    const before = earningsOf(sim.player).months['2027-03'] ?? 0;
    expect(earningsOf(sim.player).years[2027]?.interest ?? 0).toBe(0);
    sim.must({ kind: 'bank.break_term', payload: { accountId: cd } });
    const broken = memos(sim, /^CD broken early$/);
    expect(broken).toHaveLength(1);
    const kept = -broken[0]!.postings.filter((p) => sim.universe.accounts[p.accountId]?.name === 'Interest').reduce((s, p) => s + p.amount, 0);
    // Worked by hand: a 365th of 3.50% on $2,849,566 a midnight, 198 midnights from 25 August 2026 to 10 March 2027,
    // $54,102.71 to the cent below; Chase's penalty for a CD of seven months, in its 6-to-24-month band, 180 days'
    // interest, $49,184.29, under the cap of what was earned (deposit account agreement, 26 September 2026). Kept,
    // $4,918.42, before any tax on it (the Interest posting is what was earned, the tax its own posting).
    const day = (IN_CD * 0.035) / 365;
    const earned = Math.floor(198 * day);
    const penalty = Math.round(180 * day);
    expect([earned, penalty]).toEqual([54_102_71, 49_184_29]);
    expect(earned - penalty).toBe(4_918_42);
    expect(kept).toBe(4_918_42);
    expect(earningsOf(sim.player).years[2027]?.interest).toBe(kept);
    expect((earningsOf(sim.player).months['2027-03'] ?? 0) - before).toBe(kept);
    sim.advanceTo(at(2027, 3, 25, 9));
    expect(earningsOf(sim.player).years[2027]?.interest).toBe(kept);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// health.appeal_decided: upheld, and gone to debt then overturned, on the played marketplace
// ---------------------------------------------------------------------------

/** The enrolled life's first November visit, the claim denied (TEST SETUP: the draws forced), appealed on Papers. */
function deniedAndAppealed(): { sim: Simulation; force: ReturnType<typeof forcing>; billId: string } {
  const sim = thaw(enrolled().snap);
  const force = forcing(sim);
  sim.advanceTo(at(2026, 11, 1, 8));
  force('health.denial', null, [0]);
  forceWeek(sim, force, VISIT);
  const visit = appointmentsOf(sim.player)[0]!;
  sim.advanceTo(visit.at + MS_HOUR);
  const bill = healthOf(sim.player).bills.find((b) => b.at === visit.at)!;
  expect(bill).toMatchObject({ amount: UNINSURED, denied: { share: SHARE } });
  papers(sim);
  expect(press('health.appeal')).toEqual(['Appealed: decided in 60 days.']);
  return { sim, force, billId: bill.id };
}
const billOf = (sim: Simulation, id: string) => healthOf(sim.player).bills.find((b) => b.id === id)!;
const debtOf = (sim: Simulation) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.category === 'medical');

describe('health.appeal_decided, on the marketplace a family’s savings reach (round three)', () => {
  it('PLAYER JOURNEY: paid when due and upheld, the bill stays $183.98, nothing comes back, the notice says the plan kept its denial, and Papers says Denial Upheld', () => {
    const { sim, force, billId } = deniedAndAppealed();
    const decision = pendingOf(sim, APPEAL_KIND)[0]!;
    sim.advanceTo(billOf(sim, billId).dueAt! + MS_HOUR);
    expect(billOf(sim, billId).paid).toBe(true);
    force('health.appeal', null, [0]); // TEST SETUP: the decision's draw forced to uphold
    sim.advanceTo(decision.at + MS_HOUR);
    const bill = billOf(sim, billId);
    expect(bill.denied!.outcome).toBe('upheld');
    expect(bill.amount).toBe(UNINSURED);
    expect(memos(sim, /^Appeal won: /)).toHaveLength(0);
    expect(titled(sim, 'Appeal Upheld').map((n) => n.body)).toEqual([`The plan kept its denial for ${bill.what.charAt(0).toLowerCase()}${bill.what.slice(1)}, so the full bill stands.`]);
    expect(titled(sim, 'Appeal Won')).toHaveLength(0);
    expect(papers(sim).text).toContain('$183.98 Settled Denial Upheld');
    // Nothing about the bill moved money at the decision: no posting at its hour names it.
    expect(sim.universe.transactions.filter((t) => t.at >= decision.at && t.at <= decision.at + MS_HOUR && t.memo.includes(bill.what))).toEqual([]);
  }, 60_000);

  it('PLAYER JOURNEY: savings unlinked and checking moved to savings before the bill falls due, it goes to debt, $183.98; overturned, the debt is the $45 share, and Pay It Off on Papers pays $45.00 and settles it', () => {
    const { sim, force, billId } = deniedAndAppealed();
    const decision = pendingOf(sim, APPEAL_KIND)[0]!;
    const due = billOf(sim, billId).dueAt!;
    sim.must({ kind: 'bank.set_payments', payload: { linkSavings: false } });
    sim.advanceTo(due - MS_HOUR);
    const savings = mine(sim, 'savings')[0]!;
    const held = checking(sim).balance;
    sim.must({ kind: 'bank.transfer', payload: { fromId: checking(sim).id, toId: savings.id, amount: held } });
    sim.advanceTo(due + MS_HOUR);
    expect(billOf(sim, billId)).toMatchObject({ inDebt: true });
    expect(debtOf(sim)!.balance).toBe(-UNINSURED);
    expect(titled(sim, 'A Medical Bill Went Unpaid')).toHaveLength(1);
    expect(papers(sim).text).toContain('$183.98 Owed As Debt Appealed');
    sim.must({ kind: 'bank.transfer', payload: { fromId: savings.id, toId: checking(sim).id, amount: held } });
    force('health.appeal', null, [0.99]); // TEST SETUP: the decision's draw forced to overturn
    sim.advanceTo(decision.at + MS_HOUR);
    expect(billOf(sim, billId).denied!.outcome).toBe('overturned');
    expect(billOf(sim, billId).amount).toBe(SHARE);
    expect(debtOf(sim)!.balance).toBe(-SHARE);
    // What was over the share came off the debt, $138.98; nothing was paid on it, so nothing comes back to the bank.
    expect(memos(sim, /^Appeal won: /).map((t) => [into(t, debtOf(sim)!.id), into(t, payeeAccount(sim, sim.player).id)])).toEqual([[138_98, 0]]);
    expect(titled(sim, 'Appeal Won')[0]!.body).toContain('You owe only your share, $45.00.');
    const text = papers(sim).text;
    expect(text).toContain('$45.00 Owed As Debt Denial Overturned');
    const bank = checking(sim).balance;
    expect(press('health.pay_bill')).toEqual(['Paid off.']);
    expect(checking(sim).balance).toBe(bank - SHARE);
    expect(debtOf(sim)!.balance).toBe(0);
    expect(billOf(sim, billId)).toMatchObject({ paid: true });
    expect(papers(sim).text).toContain('$45.00 Settled Denial Overturned');
  }, 60_000);
});

// ---------------------------------------------------------------------------
// documents.us_status: the marketplace an F-1 buys in her grace, on interest she took
// ---------------------------------------------------------------------------

/**
 * Two Inherited lives at Chase, one born in London (an F-1), one in New York (a citizen), each putting all but $20,000 in
 * the CD on the first morning and taking September's interest on 30 September, withdrawn on 2 October after the fifteenth
 * day of classes and enrolled on Papers the same morning.
 */
const graced = once(() => {
  const lives = (['lp-f1', 'lp-us'] as const).map((seed) => {
    const sim = createSave(1, seed, { ...answers('inherited', seed === 'lp-f1' ? LONDON : {}), bankId: 'us-chase' });
    const cd = intoTheCd(sim);
    sim.advanceTo(at(2026, 9, 30, 12));
    const taken = sim.must<{ paid: number }>({ kind: 'bank.take_term_interest', payload: { accountId: cd } });
    sim.advanceTo(at(2026, 10, 2, 9));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(false);
    papers(sim);
    const toast = press('health.enroll');
    sim.advanceTo(at(2026, 10, 2, 10));
    const asked = openDecisions(sim).map((d) => [d.title, d.dueAt]);
    const oct = freeze(sim);
    sim.advanceTo(at(2026, 12, 2, 9));
    return { taken, toast, asked, oct, dec: freeze(sim) };
  });
  return { f1: lives[0]!, us: lives[1]! };
});

describe('documents.us_status, a marketplace plan bought in the grace (round three)', () => {
  it('PLAYER JOURNEY: the F-1 takes $10,110.10 of September’s interest, over Connecticut’s line, and is given the marketplace in her grace from 1 December; asked “Your US Status Is Ending” for 17 October, out of status that day, her plan ends on the 1 November look without a premium taken, where the citizen who did the same keeps hers and pays $706 on 1 December', () => {
    const { f1, us } = graced();
    for (const life of [f1, us]) {
      expect(life.taken.paid).toBe(10_110_10);
      expect(life.toast).toEqual(['Enrolled in the marketplace, from December 1, 2026.']);
    }
    expect(f1.asked).toEqual([['Your US Status Is Ending', at(2026, 10, 17, 9)]]);
    expect(us.asked).toEqual([]);
    const f = thaw(f1.dec);
    expect(f.player.usOutOfStatus).toBeDefined();
    expect(titled(f, 'Out Of Status').map((n) => n.at)).toEqual([at(2026, 10, 17, 9)]);
    expect(healthOf(f.player).marketplace!.until).toBe(at(2026, 11, 1, 0, 30));
    expect(premiums(f)).toEqual([]);
    expect(coverOn(f.player, f.now)).toBeUndefined();
    expect(f.execute({ kind: 'health.enroll', payload: {} }).error).toBe('The marketplace is only for citizens and people lawfully present, and you’re out of status.');
    const u = thaw(us.dec);
    expect(u.player.usOutOfStatus).toBeUndefined();
    expect(healthOf(u.player).marketplace!.until).toBeUndefined();
    expect(premiums(u)).toEqual([[at(2026, 12, 1, 0, 30), 706_00]]);
    expect(coverOn(u.player, u.now)).toBe('marketplace');
  }, 60_000);

  it('PLAYER JOURNEY: the plan she lost out of status never began, and the 1 November notice says it won’t, as Covered Connecticut’s does, not that it has ended; with Yale Health still covering her that morning, her cover isn’t counted lost', () => {
    const f = thaw(graced().f1.dec);
    const said = f.universe.notifications.filter((n) => /^Your Marketplace Plan/.test(n.title)).map((n) => [n.at, n.title]);
    expect(said).toEqual([[at(2026, 11, 1, 0, 30), 'Your Marketplace Plan Won’t Begin']]);
    // Nor is cover counted lost on 1 November, with Yale Health still covering her that morning (from 2026-10-14).
    const nov = thaw(graced().f1.oct);
    nov.advanceTo(at(2026, 11, 1, 6));
    expect(healthOf(nov.player).marketplace!.until).toBe(at(2026, 11, 1, 0, 30));
    expect(healthOf(nov.player).lostAt).toBeUndefined();
  }, 60_000);

  // From 2026-10-14. Until then the notice gave the day of the look that found her uncovered, 1 December, a month after
  // Yale Health’s thirty days ran out at eight on 1 November (nine on 2 October, the clocks gone back between).
  it('PLAYER JOURNEY: the F-1’s 1 December notice says she’s uncovered from November 1, the day Yale Health ended, not from the look that found it', () => {
    const f = thaw(graced().f1.dec);
    expect(coverOn(f.player, at(2026, 11, 1, 7, 30))).toBe('yale');
    expect(coverOn(f.player, at(2026, 11, 1, 8, 30))).toBeUndefined();
    const ended = titled(f, 'Your Health Cover Ended');
    expect(ended.map((n) => n.at)).toEqual([at(2026, 12, 1, 0, 30)]);
    expect(ended[0]!.body).toMatch(/^You have no health cover from November 1, 2026\. You’re out of status, so neither the marketplace nor /);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// world.tick: a raiser's dated row closed on its date, and kept 180 days; an older build's undated row dated on load
// ---------------------------------------------------------------------------

describe('world.tick, with the undated rule gone (round three)', () => {
  it('PLAYER JOURNEY: the F-1’s “Your US Status Is Ending”, dated 17 October, is closed by the first tick after it, leaves the open list, and is kept 180 days from closing, gone by the 183rd, across a reload', () => {
    const sim = thaw(graced().f1.oct);
    const row = Object.values(sim.universe.decisions).find((d) => d.title === 'Your US Status Is Ending')!;
    expect(row.dueAt).toBe(at(2026, 10, 17, 9));
    sim.advanceTo(row.dueAt - MS_HOUR);
    expect(openDecisions(sim).map((d) => d.id)).toEqual([row.id]);
    sim.advanceTo(row.dueAt + 2 * MS_DAY + MS_HOUR);
    const closed = sim.universe.decisions[row.id]!;
    expect(closed.dismissedAt).toBeUndefined();
    // The tick runs every two days: it closes the row within two days after its date.
    expect(closed.resolvedAt! > row.dueAt && closed.resolvedAt! <= row.dueAt + 2 * MS_DAY).toBe(true);
    expect(openDecisions(sim)).toEqual([]);
    const later = thaw(freeze(sim));
    later.advanceTo(closed.resolvedAt! + 179 * MS_DAY);
    expect(later.universe.decisions[row.id]).toBeDefined();
    later.advanceTo(closed.resolvedAt! + 183 * MS_DAY);
    expect(later.universe.decisions[row.id]).toBeUndefined();
  }, 60_000);

  it('a save an older build left with undated rows (TEST SETUP) loads with the open one dated ninety days from its raising, closed by the tick after that date, and the closed one let go', () => {
    const sim = thaw(graced().f1.oct);
    const row = Object.values(sim.universe.decisions).find((d) => d.title === 'Your US Status Is Ending')!;
    const old = JSON.parse(freeze(sim)) as { decisions: Record<string, Record<string, unknown>> };
    delete old.decisions[row.id]!.dueAt;
    old.decisions['decision_old'] = { ...old.decisions[row.id]!, id: 'decision_old', refId: 'old', resolvedAt: row.createdAt };
    // As a slot is opened (`readSlot`): migrated, then loaded.
    const steps = migrate(old as never).steps;
    expect(steps).toContain('Dated 1 question an older build left undated, ninety days from when each was raised.');
    expect(steps).toContain('Let go 1 closed question with no date.');
    const loaded = loadSave(old as never);
    expect(loaded.universe.decisions['decision_old']).toBeUndefined();
    expect(loaded.universe.decisions[row.id]!.dueAt).toBe(row.createdAt + 90 * MS_DAY);
    loaded.advanceTo(row.createdAt + 90 * MS_DAY - MS_HOUR);
    expect(loaded.universe.decisions[row.id]!.resolvedAt).toBeUndefined();
    loaded.advanceTo(row.createdAt + 92 * MS_DAY + MS_HOUR);
    expect(loaded.universe.decisions[row.id]!.resolvedAt).toBeDefined();
  }, 60_000);
});

// ---------------------------------------------------------------------------
// documents.apply_ssn: a hospital bed reached by the week's draw
// ---------------------------------------------------------------------------

describe('documents.apply_ssn, from a hospital bed the week drew (round three)', () => {
  it('PLAYER JOURNEY: the F-1 admitted by her first health week (TEST SETUP: the draw forced to a stay) is refused “Not from a hospital bed.” where her twin, that evening, is sent to the office; discharged, she applies', () => {
    const make = () => createSave(1, 'lp-ssn', answers('scraping', LONDON));
    const ill = make();
    const force = forcing(ill);
    const week = forceWeek(ill, force, STAY);
    expect(week).toBe(at(2026, 8, 31, 9));
    // That evening, when classes are done for the day.
    const twin = make();
    ill.advanceTo(at(2026, 8, 31, 18));
    twin.advanceTo(at(2026, 8, 31, 18));
    expect(ill.execute({ kind: 'documents.apply_ssn', payload: {} }).error).toBe('Not from a hospital bed.');
    expect(twin.must<{ arrivesAt: Instant }>({ kind: 'documents.apply_ssn', payload: {} }).arrivesAt).toBe(twin.now + 21 * MS_DAY);
    expect(ill.player.ssn).toBeUndefined();
    const until = healthOf(ill.player).inHospitalUntil!;
    expect(until).toBeGreaterThan(ill.now);
    const out = zonedParts(until, ZONE);
    ill.advanceTo(at(out.year, out.month, out.day + 1, 18));
    expect(ill.must<{ arrivesAt: Instant }>({ kind: 'documents.apply_ssn', payload: {} }).arrivesAt).toBe(ill.now + 21 * MS_DAY);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// health.choose_clinic and health.appointment, for a life the screen made with need
// ---------------------------------------------------------------------------

describe('health.choose_clinic, for a family-made life (round three)', () => {
  it('PLAYER JOURNEY: the Scraping family’s student who picks Fair Haven on Your Doctor is booked 24 days on there and billed the uninsured’s $183.98; her twin who picks nothing is booked the next weekday at Yale Health, at $0', () => {
    // Until 2026-10-15 this held that Papers drew no Your Doctor for her, New Haven keeping one practice. From that day a
    // Yale student has Yale Health’s Student Health beside it, and what picking it decides is in tests/scope-health.test.ts.
    const make = () => createSave(1, 'lp-dr', answers('scraping'));
    const chooser = make();
    const plain = make();
    expect(papers(chooser).html).toContain('id="own-doctor"');
    chooser.must({ kind: 'health.choose_clinic', payload: { clinicId: 'us-ct-fhchc-grand' } });
    expect(healthOf(chooser.player).clinicId).toBe('us-ct-fhchc-grand');
    const seen = [chooser, plain].map((sim) => {
      const force = forcing(sim);
      forceWeek(sim, force, VISIT);
      const visit = appointmentsOf(sim.player)[0]!;
      sim.advanceTo(visit.at + MS_HOUR);
      const kept = (healthOf(sim.player).careLog ?? []).filter((c) => c.at === visit.at);
      return [visit.at, visit.clinicId, kept.map((c) => [c.what, c.share])];
    });
    // Until later on 2026-10-15 this held that the two were the same, Thursday 24 September at Fair Haven at $0: Fair
    // Haven was where a visit went with nothing picked, and Yale Health paid a visit there whole. That day Yale Health's
    // own rule was kept ("All care must be obtained at the Yale Health Center at 55 Lock Street unless it is an emergency
    // situation…"): with nothing picked, a member's visit goes to Yale Health the next weekday, and one at Fair Haven isn't
    // Yale Health's to pay. The week of Monday 31 August books the chooser 24 days on, Thursday 24 September at ten, at
    // Fair Haven, billed the uninsured's $183.98 (SLATE's $100 of 2024 grown by the physicians' services index to 2026's
    // $105.13, at 1.75; Fair Haven publishes no fee and SLATE keeps no sliding fee for it); her twin Tuesday 1 September
    // at ten at Yale Health, at $0.
    expect(seen[0]).toEqual([at(2026, 9, 24, 10), 'us-ct-fhchc-grand', [['A doctor’s visit, Fair Haven Community Health Care', UNINSURED]]]);
    expect(seen[1]).toEqual([at(2026, 9, 1, 10), 'us-ct-yalehealth-studenthealth', [['A doctor’s visit, Yale Health Center, Student Health', 0]]]);
    expect(at(2026, 9, 24) - at(2026, 8, 31)).toBe(VISIT_WAIT * MS_DAY);
    expect(at(2026, 9, 1) - at(2026, 8, 31)).toBe(YALE_WAIT * MS_DAY);
  }, 60_000);
});

describe('health.appointment, a visit called off on a family-made life (round three)', () => {
  it('PLAYER JOURNEY: a visit called off is owed on Papers, and the next week the draw sends to the doctor books it; kept, it’s owed no more; a specialist it referred to, called off, is booked by the next such week as the specialist, 31 days on, not as the week’s own visit', () => {
    const sim = createSave(1, 'lp-ap', answers('modest'));
    const force = forcing(sim);
    forceWeek(sim, force, VISIT);
    const first = appointmentsOf(sim.player)[0]!;
    sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: first.id } });
    expect(healthOf(sim.player).owedVisit).toBe(first.what);
    expect(papers(sim).text).toContain(`${first.what}: not yet seen`);
    sim.advanceTo(first.at + MS_HOUR);
    expect((healthOf(sim.player).careLog ?? []).filter((c) => c.at === first.at)).toHaveLength(0);
    const week = forceWeek(sim, force, VISIT);
    const next = appointmentsOf(sim.player)[0]!;
    expect(next).toBeDefined();
    expect(next.at).toBeGreaterThan(week);
    // TEST SETUP: the kept visit's referral draw forced to refer (America's 9.1%, `REFERRAL_SHARE`).
    force('health.referral', [sim.player.id, next.id, next.at], [0]);
    sim.advanceTo(next.at + MS_HOUR);
    expect(healthOf(sim.player).owedVisit).toBeUndefined();
    // Until later on 2026-10-15 it was had at Fair Haven, where a visit went with nothing picked; from then a Yale Health
    // member's goes to Yale Health.
    expect((healthOf(sim.player).careLog ?? []).filter((c) => c.at === next.at).map((c) => c.what)).toEqual([`${first.what}, Yale Health Center, Student Health`]);
    expect(titled(sim, 'A Doctor’s Visit').map((n) => n.at)).toEqual([next.at]);
    // A doctor’s visit owed and one the week draws are the same words at the same wait, so the specialist is what tells
    // them apart: owed, it’s booked as itself at America’s 31 days (`REFERRAL_DAYS`), where the week’s own visit would be
    // “A doctor’s visit” at the wait the first was booked on: Yale Health’s next weekday (until 2026-10-15, New Haven’s
    // 24 days at Fair Haven).
    const specialist = appointmentsOf(sim.player)[0]!;
    expect(specialist.what).toBe(SPECIALIST);
    sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: specialist.id } });
    expect(healthOf(sim.player).owedVisit).toBe(SPECIALIST);
    expect(papers(sim).text).toContain(`${SPECIALIST}: not yet seen`);
    const third = forceWeek(sim, force, VISIT);
    const booked = appointmentsOf(sim.player);
    expect(booked.map((a) => a.what)).toEqual([SPECIALIST]);
    expect(healthOf(sim.player).owedVisit).toBeUndefined();
    const daysOn = (a: { at: Instant }, from: Instant) => Math.round((a.at - from) / MS_DAY);
    // Until later on 2026-10-15 the week's own visit stood VISIT_WAIT, 24 days, on.
    expect([daysOn(booked[0]!, third), daysOn(next, week)]).toEqual([31, YALE_WAIT]);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// The knob row: nine live knobs, receipts gone
// ---------------------------------------------------------------------------

describe('the trait knobs, nine of the row’s ten live (round three)', () => {
  it('Keeps Accounts and Chaotic, held by a life made with them, say on their looks only the knobs they still move; no trait, limit or look carries receipts', () => {
    const sim = createSave(1, 'lp-kn', { ...answers('wealthy'), personalityTraits: ['keeps_accounts', 'chaotic'] });
    expect(sim.player.personalityTraits).toEqual(['keeps_accounts', 'chaotic']);
    const keeps = look(sim, 'trait', 'keeps_accounts');
    expect(keeps).toContain('How hard a slight from a classmate cuts +10%');
    const chaotic = look(sim, 'trait', 'chaotic');
    expect(chaotic).toContain('How fast you stop being clean +30%');
    expect(chaotic).toContain('How much stress a hard hour, a performance’s nerves or an injury adds −8%');
    for (const words of [keeps, chaotic]) expect(words).not.toMatch(/receipt/i);
    expect(Object.keys(KNOB_LIMITS).sort()).toEqual(Object.keys(KNOB_READS).sort());
    expect(Object.keys(KNOB_READS)).not.toContain('receipts');
    expect(PERSONALITY_TRAITS.filter((t) => 'receipts' in (t.systemMods ?? {}))).toEqual([]);
  });
});

