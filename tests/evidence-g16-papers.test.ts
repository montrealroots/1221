/**
 * Evidence for seven Papers rows the review of 2026-10-13 left partial (verification group g16-papers). Each row's gaps
 * are closed here through the command its screen sends, pressed on the screen where the row has one, or through the
 * clock, and each consequence is read where the row says it is read, against figures worked out here from the rule's
 * own published numbers, never from the helper the engine computes them with.
 *
 * - `tax.pay`: the London student's 2026 1040-NR, never filed, is figured and assessed by the IRS on 12 August 2028
 *   with no setup at all, its parts worked here from IRC 6651 and 6621. On 16 August Pay on the Returns tab, half typed
 *   in, takes exactly that from the current account as "Income tax owed, 2026, in part" and puts it to the tax first,
 *   then the penalty; 0 is refused "Pay something.", more than is owed in its words, and an emptied bank "is more than
 *   the bank can cover." with nothing charged; pressed blank it takes the rest, the two payments summing to the Still
 *   Owed the screen showed, cancels the IRS's pending notice, and the Pay button goes; a third payment and a year with
 *   no return are refused "That year is paid."; the payments are kept across a reload, and 200 days on no levy comes,
 *   where a twin that never paid is levied. On 13 August, the day after the assessment, Still Owed charges no 17th
 *   month of paying late the law hasn’t begun; until 2026-10-13 it did, since `payLateRateAt` counted a late return’s
 *   months afresh from its filing, and the month the filing split was charged twice until the due date’s own month
 *   turned. Its test failed when written; fixed that day.
 * - `documents.idcard_arrives`: a student born in New York holding a license and no passport reports it lost and
 *   Capital One turns her away for want of a photo ID; replaced by mail for New York's $17.50, it arrives 21 days on
 *   with `issuedAt` its day, says "Class D (Operator) driver license Arrived" once across a reload, reads In Force on
 *   Papers, and Capital One opens her account. An F-1 student's limited-term Connecticut card, applied for once her
 *   Social Security number has come, arrives ten business days on, runs to her program's end, is said to arrive, and
 *   Wells Fargo takes it as her photo ID once her passport is reported lost.
 * - `documents.permission`: Apply For OPT on Papers is refused before its window in its words, applied on 5 March 2029
 *   for $470 and decided 90 days on: valid twelve calendar months from the decision, "OPT Approved" naming both dates,
 *   the status's look moved to its expiry and held past the degree's sixty days, then ended by its ninety days without
 *   work, the day Papers gives for the status’s end (from 2026-10-13: until then it gave the expiry’s sixty days on,
 *   which no played OPT reaches). With premium processing it is decided in thirty business days and runs twelve months from the program's end.
 *   Refused in its words for a second application, a citizen, a student who withdrew, a life never on an F-1, and once
 *   its window has closed.
 * - `documents.us_status`: a withdrawal on 1 February 2027 keeps fifteen days' status, armed by the School's own
 *   reschedule and kept once across a reload; the sixteenth day she is out of status, her F-1 canceled, told once, and
 *   refused the marketplace, a state ID card and unemployment in their words, and Papers says Out Of Status since the
 *   day. A student who lets classes go is dismissed and out of status the same hour. A graduate is asked "Your US Status
 *   Is Ending" on the program's end, due sixty days on with OPT offered both ways, and is out of status the day it falls
 *   due; a twin that presses Apply For OPT on it keeps her status.
 * - `benefits.assistance_month`: the student born in New York applies for SNAP on Papers on 20 March 2027 and is paid
 *   $306 a month by the clock, the FY2027 maximum less 30% of the month's income over $217 worked here from the ledger
 *   with her work-study left out; the midnight clock buys her groceries on the EBT card; "SNAP Paid", Papers' "N months
 *   paid" and On The EBT Card agree across a reload; and her case closes on the first look of the summer, with no month
 *   paid after. A graduate on unemployment is paid $306 less 30% of the month before's benefit and interest over $217,
 *   rounded up to the dollar, four times and more, her claim exempting her from the time limit; a month with a week’s
 *   pay in it takes a fifth of the pay off before the 30%, $23 on $375. Until 2026-10-13 SNAP was paid to the cent and a
 *   claimant was held to the time limit, the fourth month refused, and this file held both. The month the clock reads
 *   is the calendar month before the payment, as the row and the code’s own comments say; until 2026-10-13 it was the
 *   one fifteen days before, so a payment on the 27th read its own month so far, and its test failed when written;
 *   fixed that day. Ontario Works, in Toronto, is paid CAD 343 by the clock.
 * - `benefits.week`: a graduate with a summer's stipend files a Connecticut claim on Papers for $93 a week; Sunday's
 *   week is posted to her account and her year's income; a week in hospital posts nothing; a week with four hours worked,
 *   $92, posts $93 less two-thirds of it, $31 (until 2026-10-13 a ledger's $75 of pay, $43); across a reload the claim pays to its $2,418 and ends in its words with nothing left
 *   on the calendar, and Papers shows A Week, Paid and the past claim. An F-1 graduate on OPT is paid while it is in
 *   force and nothing once it has ended, her claim ends a year from filing, and her 2029 1040-NR reports exactly what
 *   the clock paid. A student still enrolled is refused a Connecticut claim at filing, and nothing in SLATE returns a
 *   claimant to school, so the week's own student check (`studentUnavailable` on the clock) is a guard no play
 *   reaches: the filing's refusal already settles it.
 * - `tax.season`: the student born in New York, played with no setup, earned $1,670.59 in 2026 and is asked for no
 *   return on 1 February 2027 and given no late notice in April, and Papers’ No Returns Yet names the standard
 *   deduction; until 2026-10-13 it still said any income made a return, and its test failed when written; fixed that
 *   day. An F-1 student is asked for her 1040-NR, Tax Return Due is on the calendar at its
 *   minute, Tax Season is armed for the next February once across a reload; one with no US income files Form 8843 by
 *   15 June; a life in London that earned nothing in the US is asked for none.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven from Monday
 * 24 August 2026 at 7:30 AM, born in New York (a citizen) or in London (on an F-1 visa), played on the clock
 * (`advanceTo`) and through commands, never by calling a handler or a reader in their place. Where a row is about a
 * place a New Haven life never reaches, Ontario Works in Toronto and a life lived in London, a `quickSave` life there,
 * and the test says so. The seeds were chosen for what the life began with: g16-id-1 holds a New York license and no
 * passport. Screens are rendered as the player has them (react-dom/server), `useGame`'s `run` being the save's own
 * `execute`; a pressed button is the component's own onClick, kept on its way through the JSX runtime.
 *
 * TEST SETUP, said again where it's done: the degree conferred (a passive life's standing falls to a concern by its
 * first December, so three years of classes can't be played); a summer with the Yale Summer Cabaret on the earnings
 * record, as its Fridays pay it (the company takes only a student in good standing); a week in hospital; a day's or a
 * week's pay posted as a paycheck posts it, and put on the earnings record where the week's pay is a stipend's;
 * accounts emptied by postings against a test line. FIXTURE: the amount typed into Pay
 * and the screens' kept tab, given through the components' own state, which a static render can't type into or click.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { documentsOf, photoIdOf } from '@/engine/systems/documents';
import { f1Of } from '@/engine/systems/permission';
import { TAX_DUE_KIND, TAX_NOTICE_KIND, TAX_SEASON_KIND, TAX_SFR_KIND, returnsOf } from '@/engine/systems/taxreturn';
import { BENEFIT_WEEK_KIND, unemploymentOf } from '@/engine/systems/unemployment';
import { SHIFT_KIND } from '@/engine/systems/school';
import { openDecisions } from '@/engine/world/world';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** FIXTURE: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  /** While set, each useState's initial value, in render order. */
  trace: undefined as unknown[] | undefined,
  buttons: [] as { text: string; disabled?: boolean; title?: string; onClick?: () => void }[],
  toasts: [] as string[],
  results: [] as { ok: boolean; error?: string; value?: unknown }[],
  tabs: {} as Record<string, string>,
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    h.trace?.push(initial);
    if (h.states.length === 0) return [value, set];
    const v = h.states.shift();
    return [v === h.keep ? value : v, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

/** Every button the screens draw, with its words, whether it's grayed out, its title, and its own onClick. */
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

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back. `run` is the save's own execute, its answer kept.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => { const r = h.sim.execute({ kind, payload }); h.results.push(r); return r; },
    toast: (message: string) => { h.toasts.push(message); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { WorkPane } = await import('@/ui/papers/Documents');

// ---------------------------------------------------------------------------
// Lives, the ledger, and the screens over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const student = (seed: string, home = 'us-ny-newyork'): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: home, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** Dollars as a US screen writes them, worked here: $1,234.56. */
const usd = (cents: number) => `${cents < 0 ? '-' : ''}$${(Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** A figure in dollars read off the screen, in cents. */
const cents = (s: string) => Math.round(Number(s.replace(/[$,]/g, '')) * 100);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const memos = (sim: Simulation, re: RegExp, after = 0) => sim.universe.transactions.filter((t) => re.test(t.memo) && t.at >= after);
/** What a transaction moved in or out of the player's own accounts. */
const own = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) =>
  t.postings.filter((p) => { const a = sim.universe.accounts[p.accountId]; return a !== undefined && a.ownerId === sim.player.id && !a.nominal; }).map((p) => ({ accountId: p.accountId, amount: p.amount }));
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === kind);
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload });

/** TEST SETUP: the degree conferred, as the School confers it after the last term, which a passive life never reaches. */
const graduate = (sim: Simulation, when: number) => { Object.assign(sim.player.school!, { standing: 'graduated', endedAt: when }); };
/**
 * TEST SETUP: a summer with the Yale Summer Cabaret on the earnings record, as its Fridays pay it, $375 a week: four
 * weeks in June and nine in July and August, the guide's own example of a summer's stipend.
 */
function summerWith(sim: Simulation, year: number, june: number, august: number): void {
  recordWages(sim.player, june, NY, { gross: 4 * 375_00, employer: 'yale-summer-cabaret' });
  recordWages(sim.player, august, NY, { gross: 9 * 375_00, employer: 'yale-summer-cabaret' });
  expect(yearOf(sim.player, year).acting).toBe(13 * 375_00);
}
/** TEST SETUP: every current, savings and cash account of theirs emptied, by postings against a test expense line. */
function emptied(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.closedAt || !['checking', 'savings', 'cash'].includes(a.kind) || a.balance <= 0) continue;
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] });
  }
}

/** The calendar month of an instant in New Haven, as `2027-02`. */
const monthOf = (at: number) => { const p = zonedParts(at, NY); return `${p.year}-${String(p.month).padStart(2, '0')}`; };
/** What came in during a month by the ledger, gross: unemployment, interest, work-study wages and other wages. */
function ledgerMonth(sim: Simulation, month: string): { ui: number; interest: number; workStudy: number; wages: number } {
  const out = { ui: 0, interest: 0, workStudy: 0, wages: 0 };
  const gross = (t: { postings: { accountId: string; amount: number }[] }) => -t.postings.filter((p) => sim.universe.accounts[p.accountId]?.kind === 'income').reduce((s, p) => s + p.amount, 0);
  for (const t of sim.universe.transactions) {
    if (monthOf(t.at) !== month || own(sim, t).length === 0) continue;
    if (t.memo.startsWith('Unemployment insurance')) out.ui += gross(t);
    else if (t.category === 'interest') out.interest += gross(t);
    else if (t.memo.startsWith('Work-study wages')) out.workStudy += gross(t);
    else if (t.category === 'salary') out.wages += gross(t);
  }
  return out;
}
/**
 * A month's SNAP for a single adult in Connecticut in FY2027 (USDA, from 1 October 2026): the maximum allotment, $306,
 * less 30% of net income rounded up to the dollar (7 CFR 273.10(e)(2)(ii)(A)), net income being gross income less 20% of
 * earnings and the $217 standard deduction. No shelter cost is counted since the home went. Worked here, not by
 * `snapMonth`: 30% of a sum of cents is three thousandths of it in dollars. Until 2026-10-13 this took the 30% to the
 * cent, as the engine paid it.
 */
const snapFy2027 = (unearned: number, earned = 0) => 306_00 - Math.ceil(3 * Math.max(0, unearned + earned - Math.round(0.2 * earned) - 217_00) / 1000) * 100;

/** What the player reads: the markup with every title attribute taken out, then every tag, its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
/** A table row's words, found by words in it. */
const rowOf = (html: string, words: string): string => {
  const row = [...html.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => onScreen(m[0])).find((r) => r.includes(words));
  expect(row, `a row with “${words}”`).toBeDefined();
  return row!;
};
const PAPERS = 'tab:/workspace/papers';

/** A screen as the player has it, on a Papers tab, with its components' states given (FIXTURE) in render order. */
function drawn(sim: Simulation, screen: FunctionComponent, tab?: string, states: unknown[] = []) {
  h.sim = sim;
  h.buttons = [];
  h.toasts = [];
  h.results = [];
  h.tabs = tab ? { [PAPERS]: tab } : {};
  h.states = [...states];
  const html = renderToStaticMarkup(createElement(screen));
  expect(h.states, 'every state given was taken').toHaveLength(0);
  const buttons = [...h.buttons];
  const button = (words: string) => {
    const found = buttons.filter((x) => x.text === words);
    expect(found, `one button reading “${words}”`).toHaveLength(1);
    return found[0]!;
  };
  const press = (words: string) => {
    const b = button(words);
    h.toasts = [];
    h.results = [];
    b.onClick!();
    return { toasts: [...h.toasts], result: h.results.at(-1) };
  };
  return { html, text: onScreen(html), buttons, button, press, has: (words: string) => buttons.some((x) => x.text === words) };
}

/**
 * The Returns tab with an amount typed into a filed return's Pay field (FIXTURE: ReturnLife's own first useState, found
 * by a render that notes each state's start: its amount and Amend's open state, then its WhoIsOwed's amounts).
 */
function typedPay(sim: Simulation, typed: string) {
  h.trace = [];
  drawn(sim, PapersWorkspace, 'returns');
  const trace = h.trace;
  h.trace = undefined;
  const at = trace.flatMap((v, i) => (v === '' && trace[i + 1] === false && typeof trace[i + 2] === 'object' && trace[i + 2] !== null && Object.keys(trace[i + 2] as object).length === 0 ? [i] : []));
  expect(at, 'one filed return’s Pay field').toHaveLength(1);
  return drawn(sim, PapersWorkspace, 'returns', [...Array<symbol>(at[0]!).fill(h.keep), typed]);
}
/** The Returns tab's Still Owed To The IRS, in cents. */
const stillOwed = (html: string) => cents(rowOf(html, 'Still Owed To The IRS').replace('Still Owed To The IRS, With Interest And Penalty To Date', '').trim());

// ---------------------------------------------------------------------------

describe('tax.pay', () => {
  /** 13 August 2028, noon in New Haven (EDT, UTC−4): the day after the IRS assessed her 2026 return. */
  const DAY_AFTER = Date.UTC(2028, 7, 13, 16);
  /**
   * 16 August 2028, noon: the day she pays. Its 17th month of paying late began at 03:59 UTC on the 15th, 16 months of
   * 30.4375 days from the due date, so from then on the months the IRS counts and the months SLATE charges agree.
   */
  const PAY_DAY = Date.UTC(2028, 7, 16, 16);

  /**
   * The student born in London, at Yale on an F-1 visa, who never files her 2026 1040-NR. No setup: her work-study is
   * taxed at 10%, a nonresident's first bracket with no standard deduction. Unfiled, the IRS figures it a year after its
   * due date (CP2566) and, unanswered, assesses it 120 days later.
   */
  function assessed(day = PAY_DAY) {
    const sim = student('g16-pay', 'uk-eng-london');
    sim.advanceTo(Date.UTC(2027, 1, 1, 17));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.form).toBe('1040-NR');
    expect(r.figures.income).toBeGreaterThan(0);
    const tax = Math.round(r.figures.income * 0.1);
    expect(r.figures.balance).toBe(tax);
    sim.advanceTo(day);
    // Due 15 April 2027 at 23:59 (EDT); figured 365 days on, assessed 120 after that: 12 August 2028 at 23:59.
    expect(r.substitute).toBe(true);
    expect(r.filedAt).toBe(Date.UTC(2027, 3, 16, 3, 59) + 485 * MS_DAY);
    expect(r.filedAt).toBe(Date.UTC(2028, 7, 13, 3, 59));
    // As the IRS assesses it, worked here: the tax; filing more than 60 days late, at least the lesser of the minimum and
    // the whole tax, which on $165-odd is the tax (IRC 6651(a), last sentence); paying late, 0.5% for each month or part
    // of one, 16 from April 2027 to August 2028 (6651(a)(2)); interest at 7% a year compounded daily for the 485 days
    // (6621, 6622) on the tax and on the filing share, the tax again here, which 6601(e)(2)(B) runs from the due date too.
    // Until later on 2026-10-13 this held the interest on the tax alone, as SLATE charged it until then. The 485 days are
    // 260 of 2027 after 15 April and 225 of leap-year 2028, whose days the IRS counts at a 366th of the rate (Rev. Proc. 95-17’s 366-day
    // tables): until the third round of that day this held all of them over 365, $32.28 where the IRS’s count is $32.24.
    const penalty = tax + Math.round(tax * 0.005 * 16);
    const interest = Math.round((tax + tax) * ((1 + 0.07 / 365) ** 260 * (1 + 0.07 / 366) ** 225 - 1));
    expect(r.parts).toEqual({ tax, penalty, interest });
    // Its collection has begun: the first reminder, CP501, five weeks on.
    expect(pendingOf(sim, TAX_NOTICE_KIND).filter((i) => i.payload.year === 2026).map((i) => i.at)).toEqual([Date.UTC(2028, 8, 17, 3, 59)]);
    return { sim, r, tax, penalty, interest };
  }

  it('PLAYER JOURNEY: half typed into Pay on the Returns tab leaves the current account as “Income tax owed, 2026, in part”, all of the tax first, then penalty; blank, it pays the rest the screen showed, the notices stop, and Pay goes', () => {
    const { sim, r, tax, interest } = assessed();
    const papers = drawn(sim, PapersWorkspace, 'returns');
    expect(papers.text).toContain('2026 Return Filed by the IRS August 12, 2028');
    expect(papers.text).toContain(`Tax Unpaid ${usd(tax)}`);
    const shown = stillOwed(papers.html);
    // Seventeen months of paying late by now, 8.5%, beside the filing penalty; and three and a half days' interest at 7%
    // on what was assessed, under 25 cents.
    const owed = tax + (tax + Math.round(tax * 0.005 * 17)) + interest;
    expect(shown).toBeGreaterThanOrEqual(owed);
    expect(shown).toBeLessThanOrEqual(owed + 25);
    const account = current(sim);
    const before = account.balance;
    const half = Math.floor(shown / 2);
    expect(half).toBeGreaterThan(tax);

    const first = typedPay(sim, (half / 100).toFixed(2)).press('Pay');
    expect(first.result).toMatchObject({ ok: true, value: { paid: half, tax, penalty: half - tax, interest: 0 } });
    expect(first.toasts).toEqual([`Paid: ${usd(tax)} to the tax, ${usd(half - tax)} to penalties, ${usd(0)} to interest. ${usd(shown - half)} still owed.`]);
    expect(before - account.balance).toBe(half);
    expect(memos(sim, /^Income tax owed, 2026/).map((t) => [t.memo, t.category, own(sim, t)])).toEqual([['Income tax owed, 2026, in part', 'tax', [{ accountId: account.id, amount: -half }]]]);
    expect(r.parts!.tax).toBe(0);
    expect(r.payments).toEqual([{ at: PAY_DAY, amount: half, tax, penalty: half - tax, interest: 0, how: 'payment' }]);
    const rest = stillOwed(drawn(sim, PapersWorkspace, 'returns').html);
    expect(rest).toBe(shown - half);
    // Still owed, its collection goes on.
    expect(pendingOf(sim, TAX_NOTICE_KIND).filter((i) => i.payload.year === 2026)).toHaveLength(1);

    // Refused in their words, with nothing taken.
    expect(typedPay(sim, '0').press('Pay').result).toMatchObject({ ok: false, error: 'Pay something.' });
    expect(typedPay(sim, ((rest + 1) / 100).toFixed(2)).press('Pay').result).toMatchObject({ ok: false, error: `${usd(rest)} is owed; pay that or less.` });
    expect(account.balance).toBe(before - half);

    // Blank pays it all.
    const second = drawn(sim, PapersWorkspace, 'returns').press('Pay');
    expect(second.toasts).toEqual(['Paid in full.']);
    expect(before - account.balance).toBe(shown);
    expect(memos(sim, /^Income tax owed, 2026/).map((t) => [t.memo, own(sim, t)])).toEqual([
      ['Income tax owed, 2026, in part', [{ accountId: account.id, amount: -half }]],
      ['Income tax owed, 2026', [{ accountId: account.id, amount: -rest }]],
    ]);
    expect(r.owed).toBeUndefined();
    expect(r.parts).toBeUndefined();
    expect(pendingOf(sim, TAX_NOTICE_KIND).filter((i) => i.payload.year === 2026)).toEqual([]);
    const paid = drawn(sim, PapersWorkspace, 'returns');
    expect(paid.text).not.toContain('Still Owed To The IRS');
    expect(paid.has('Pay')).toBe(false);
    expect(paid.text).toContain(`August 16, 2028: ${usd(half)}, paid; to the tax ${usd(tax)}, penalties ${usd(half - tax)}, interest ${usd(0)}.`);

    // A third time, and a year with no return: refused, nothing taken.
    expect(run(sim, 'tax.pay', { year: 2026 })).toMatchObject({ ok: false, error: 'That year is paid.' });
    expect(run(sim, 'tax.pay', { year: 2025 })).toMatchObject({ ok: false, error: 'That year is paid.' });
    expect(before - account.balance).toBe(shown);
  }, 60_000);

  it('refuses a payment the bank can’t cover in its words, charging nothing, and keeps the part paid across a reload', () => {
    const { sim, tax } = assessed();
    const shown = stillOwed(drawn(sim, PapersWorkspace, 'returns').html);
    const half = Math.floor(shown / 2);
    typedPay(sim, (half / 100).toFixed(2)).press('Pay');
    const twin = reload(sim);
    const r = returnsOf(twin.player)['2026']!;
    expect(r.payments).toEqual([{ at: PAY_DAY, amount: half, tax, penalty: half - tax, interest: 0, how: 'payment' }]);
    const papers = drawn(twin, PapersWorkspace, 'returns');
    expect(papers.text).toContain(`August 16, 2028: ${usd(half)}, paid; to the tax ${usd(tax)}, penalties ${usd(half - tax)}, interest ${usd(0)}.`);
    expect(stillOwed(papers.html)).toBe(shown - half);
    emptied(twin); // TEST SETUP
    const short = drawn(twin, PapersWorkspace, 'returns').press('Pay');
    expect(short.result).toMatchObject({ ok: false, error: `${usd(shown - half)} is more than the bank can cover.` });
    expect(short.toasts).toEqual([]);
    expect(memos(twin, /^Income tax owed, 2026/)).toHaveLength(1);
    expect(stillOwed(drawn(twin, PapersWorkspace, 'returns').html)).toBe(shown - half);
    expect(r.payments).toHaveLength(1);
  }, 60_000);

  it('paid in full, plays 200 days across a reload with no levy and no word from the IRS on 2026; a twin that never paid is levied', () => {
    const { sim } = assessed();
    const unpaid = reload(sim);
    drawn(sim, PapersWorkspace, 'returns').press('Pay');
    expect(returnsOf(sim.player)['2026']!.owed).toBeUndefined();
    const later = reload(sim);
    later.advanceTo(PAY_DAY + 200 * MS_DAY);
    expect(memos(later, /^IRS levy, 2026 return$/)).toEqual([]);
    expect(later.universe.notifications.filter((n) => n.at > PAY_DAY && n.body.includes('on your 2026 return'))).toEqual([]);
    expect(pendingOf(later, TAX_NOTICE_KIND).filter((i) => i.payload.year === 2026)).toEqual([]);
    // Change the input: unpaid, the reminders run their course and the LT11's levy takes it from the bank.
    unpaid.advanceTo(PAY_DAY + 200 * MS_DAY);
    expect(['A Reminder From The IRS', 'A Second Reminder From The IRS', 'The IRS Intends To Levy', 'Final Notice Of Intent To Levy'].map((t) => titled(unpaid, t).length)).toEqual([1, 1, 1, 1]);
    expect(memos(unpaid, /^IRS levy, 2026 return$/).length).toBeGreaterThan(0);
  }, 60_000);

  it('the day after the assessment, Still Owed charges no month of paying late not yet begun: sixteen months from the due date to 13 August 2028, not a seventeenth counted afresh from the assessment', () => {
    const { sim, tax, penalty, interest } = assessed(DAY_AFTER);
    // 485.5 days from 15 April 2027: the 16th month, of 30.4375 days or of the calendar, runs to 15 August, so the
    // penalty is still the 8% assessed with it (IRC 6651(a)(2), each month "or fraction thereof" from the due date).
    // Half a day's interest at 7% on what was assessed is under 4 cents.
    const shown = stillOwed(drawn(sim, PapersWorkspace, 'returns').html);
    expect(shown).toBeGreaterThanOrEqual(tax + penalty + interest);
    expect(shown).toBeLessThanOrEqual(tax + penalty + interest + 10);
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('documents.idcard_arrives', () => {
  it('PLAYER JOURNEY: a New York license reported lost leaves no photo ID and Capital One refuses; replaced by mail for $17.50, it arrives 21 days on, is said to, reads In Force, and Capital One opens the account', () => {
    const sim = student('g16-id-1');
    const docs = documentsOf(sim.player);
    // The seed's life: a New York license, and no passport (46% of US citizens hold none).
    expect(docs.map((d) => `${d.kind}:${d.issuer}`)).toEqual(['license:us-ny']);
    const lost = docs[0]!;
    expect(rowOf(drawn(sim, PapersWorkspace, 'passport').html, lost.number)).toContain('In Force');
    expect(run(sim, 'documents.report_lost', { documentId: lost.id }).ok).toBe(true);
    expect(photoIdOf(sim.player, sim.now)).toBeUndefined();
    const refusal = 'Capital One asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each.';
    expect(run(sim, 'bank.open_current', { bankId: 'us-capital-one' })).toMatchObject({ ok: false, error: refusal });

    // Replaced by mail from New Haven on New York's MV-44: $17.50, three weeks.
    const asked = sim.now;
    expect(asked).toBe(Date.UTC(2026, 7, 24, 11, 30));
    const before = current(sim).balance;
    const replaced = run(sim, 'documents.replace_license', { documentId: lost.id });
    expect(replaced).toMatchObject({ ok: true, value: { fee: 17_50, readyAt: Date.UTC(2026, 8, 14, 11, 30) } });
    expect(before - current(sim).balance).toBe(17_50);
    expect(memos(sim, /, replaced$/).map((t) => [t.memo, own(sim, t)])).toEqual([['Class D (Operator) driver license, replaced', [{ accountId: current(sim).id, amount: -17_50 }]]]);
    expect(lost.status).toBe('cancelled');
    const coming = documentsOf(sim.player).find((d) => d.kind === 'license' && d.status === 'pending')!;
    expect(coming.number).not.toBe(lost.number);
    expect(rowOf(drawn(sim, PapersWorkspace, 'passport').html, coming.number)).toContain('Being Decided');
    // Once: the lost one is canceled, and not replaced twice.
    expect(run(sim, 'documents.replace_license', { documentId: lost.id })).toMatchObject({ ok: false, error: 'It isn’t lost: report it lost first.' });
    expect(memos(sim, /, replaced$/)).toHaveLength(1);

    const twin = reload(sim);
    sim.advanceTo(Date.UTC(2026, 8, 14, 10, 30));
    expect(coming.status).toBe('pending');
    expect(titled(sim, 'Class D (Operator) driver license Arrived')).toEqual([]);
    expect(run(sim, 'bank.open_current', { bankId: 'us-capital-one' })).toMatchObject({ ok: false, error: refusal });
    sim.advanceTo(Date.UTC(2026, 8, 14, 12, 30));
    expect(coming.status).toBe('valid');
    expect(coming.issuedAt).toBe(Date.UTC(2026, 8, 14, 11, 30));
    expect(titled(sim, 'Class D (Operator) driver license Arrived').map((n) => [n.at, n.body])).toEqual([[Date.UTC(2026, 8, 14, 11, 30), 'It’s in force from today.']]);
    const row = rowOf(drawn(sim, PapersWorkspace, 'passport').html, coming.number);
    expect(row).toContain('September 14, 2026');
    expect(row).toContain('In Force');
    // What reads it: a bank she doesn't bank with takes it.
    const opened = run(sim, 'bank.open_current', { bankId: 'us-capital-one' });
    expect(opened.ok).toBe(true);
    const account = sim.universe.accounts[(opened.value as { accountId: string }).accountId]!;
    expect([account.bankId, account.ownerId, account.kind]).toEqual(['us-capital-one', sim.player.id, 'checking']);

    // The same across a reload made while it was on its way: arrived once, said once.
    twin.advanceTo(Date.UTC(2026, 8, 14, 12, 30));
    const again = reload(twin);
    again.advanceTo(Date.UTC(2026, 9, 1, 12));
    const theirs = documentsOf(again.player).find((d) => d.id === coming.id)!;
    expect([theirs.status, theirs.issuedAt]).toEqual(['valid', Date.UTC(2026, 8, 14, 11, 30)]);
    expect(titled(again, 'Class D (Operator) driver license Arrived')).toHaveLength(1);
    expect(documentsOf(again.player).filter((d) => d.kind === 'license' && d.status === 'valid')).toHaveLength(1);
    expect(run(again, 'bank.open_current', { bankId: 'us-capital-one' }).ok).toBe(true);
  }, 60_000);

  it('PLAYER JOURNEY: an F-1 student’s limited-term Connecticut card comes ten business days after applying, runs to her program’s end, is said to arrive, and Wells Fargo takes it in place of a lost passport', () => {
    const sim = student('g16-idf1', 'uk-eng-london');
    sim.advanceTo(Date.UTC(2026, 8, 8, 23));
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(ssn.arrivesAt + MS_HOUR);
    const passport = documentsOf(sim.player).find((d) => d.kind === 'passport')!;
    expect(run(sim, 'documents.report_lost', { documentId: passport.id }).ok).toBe(true);
    expect(f1Of(sim.player)!.status).toBe('valid');
    const wells = { bankId: 'us-wells-fargo', fundFrom: current(sim).id, amount: 25_00 };
    expect(run(sim, 'bank.open_current', wells)).toMatchObject({ ok: false, error: 'Wells Fargo asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each.' });

    const asked = sim.now;
    expect(asked).toBe(Date.UTC(2026, 8, 30, 1));
    const applied = run(sim, 'documents.apply_idcard');
    // Connecticut's non-driver ID, $28, to the end of her lawful presence: the program's end, 31 May 2029.
    expect(applied).toMatchObject({ ok: true, value: { fee: 28_00, expiresAt: Date.UTC(2029, 4, 31, 12) } });
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    expect([card.name, card.status]).toEqual(['Non-Driver Identification Card, Limited Term', 'pending']);
    // SAVE’s ten federal workdays from Tuesday 29 September, 9 PM in New Haven: 30 September to 14 October, two weekends
    // and Columbus Day, Monday 12 October, between, so fifteen days to the hour. Until 2026-10-13 SAVE’s days were counted
    // Monday to Friday, Columbus Day among them, and this held fourteen.
    expect(card.readyAt).toBe(asked + 15 * MS_DAY);
    expect(run(sim, 'documents.apply_idcard')).toMatchObject({ ok: false, error: 'One is on its way.' });
    sim.advanceTo(card.readyAt! - MS_HOUR);
    expect(card.status).toBe('pending');
    sim.advanceTo(card.readyAt! + MS_HOUR);
    expect(card.status).toBe('valid');
    expect(card.issuedAt).toBe(asked + 15 * MS_DAY);
    expect(titled(sim, 'Non-Driver Identification Card, Limited Term Arrived').map((n) => n.at)).toEqual([asked + 15 * MS_DAY]);
    const opened = run(sim, 'bank.open_current', wells);
    expect(opened.ok).toBe(true);
    expect(sim.universe.accounts[(opened.value as { accountId: string }).accountId]!.bankId).toBe('us-wells-fargo');
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('documents.permission', () => {
  /** The F-1 graduate of the class of 2029, born in London: her program ends 31 May 2029 at noon UTC. */
  function graduateOf2029(seed: string): Simulation {
    const sim = student(seed, 'uk-eng-london');
    graduate(sim, Date.UTC(2029, 4, 21, 13)); // TEST SETUP
    return sim;
  }
  const APPROVED = 'OPT Approved';

  it('PLAYER JOURNEY: Apply For OPT on Papers, refused before its window in its words, applied on 5 March 2029 for $470, decided 90 days on, valid twelve calendar months, said with both dates; status held past the degree’s sixty days; ended by its ninety days without work', () => {
    const sim = graduateOf2029('g16-opt');
    sim.advanceTo(Date.UTC(2029, 2, 1, 17));
    const shut = drawn(sim, WorkPane);
    expect(shut.text).toContain('Your Program Ends May 31, 2029');
    const early = 'It opens March 2, 2029, 90 days before the program ends.';
    expect(shut.button('Apply For OPT')).toMatchObject({ disabled: true, title: early });
    expect(run(sim, 'documents.apply_opt')).toMatchObject({ ok: false, error: early });

    sim.advanceTo(Date.UTC(2029, 2, 5, 15));
    const before = current(sim).balance;
    const applied = drawn(sim, WorkPane).press('Apply For OPT');
    // USCIS's online fee for Form I-765, $470; SLATE's ninety days to a decision.
    expect(applied.toasts).toEqual(['Applied for OPT, for $470.00. Decided by June 3, 2029.']);
    expect(before - current(sim).balance).toBe(470_00);
    expect(memos(sim, /OPT$/).map((t) => t.memo)).toEqual(['Form I-765, (c)(3)(B), OPT']);
    const twice = drawn(sim, WorkPane);
    expect(twice.button('Apply For OPT')).toMatchObject({ disabled: true, title: 'You’ve applied for OPT already.' });
    expect(run(sim, 'documents.apply_opt')).toMatchObject({ ok: false, error: 'You’ve applied for OPT already.' });
    expect(twice.text).toContain('Your US Status Held While you study, or while an application is decided');

    // Across a reload, decided on its day, once.
    const later = reload(sim);
    later.advanceTo(Date.UTC(2029, 5, 3, 16));
    const opt = documentsOf(later.player).find((d) => d.kind === 'permit')!;
    expect(opt).toMatchObject({ status: 'valid', issuedAt: Date.UTC(2029, 5, 3, 15), idleDays: 0 });
    // Twelve months from the later of the program's end and the approval: the approval, 3 June 2029, to 3 June 2030.
    expect(opt.expiresAt).toBe(Date.UTC(2030, 5, 3, 15));
    expect(titled(later, APPROVED).map((n) => n.body)).toEqual(['You may work in the United States from June 3, 2029 to June 3, 2030, with no more than 90 days between jobs in all.']);
    expect(pendingOf(later, 'documents.opt_week').map((i) => i.at)).toEqual([Date.UTC(2029, 5, 10, 15)]);
    // The status’s look moves to the OPT’s expiry. Papers gives the end its days without work make: thirteen weeks
    // counted, 91 days, on 2 September 2029, with no grace after. Until 2026-10-13 it gave the expiry’s sixty days on,
    // 2 August 2030, which no played OPT reaches, and this test held that date.
    expect(pendingOf(later, 'documents.us_status').map((i) => i.at)).toEqual([Date.UTC(2030, 5, 3, 15)]);
    expect(drawn(later, WorkPane).text).toContain('Your US Status Ends September 2, 2029 When your OPT’s 90 days without work run out, with no grace after; stay past it and you’re out of status');

    // Past the degree's own sixty days, 30 July 2029, she's still in status, her F-1 standing.
    later.advanceTo(Date.UTC(2029, 7, 1, 16));
    expect(later.player.usOutOfStatus).toBeUndefined();
    expect(f1Of(later.player)!.status).toBe('valid');
    expect(titled(later, APPROVED)).toHaveLength(1);
    // Thirteen weeks counted without work, 91 days, past its 90: ended, and the status with it, on 2 September.
    later.advanceTo(Date.UTC(2029, 8, 2, 16));
    expect(opt).toMatchObject({ status: 'cancelled', idleDays: 91, endedAt: Date.UTC(2029, 8, 2, 15) });
    expect(later.player.usOutOfStatus).toBe(Date.UTC(2029, 8, 2, 15));
    expect(titled(later, 'OPT Ended').map((n) => n.at)).toEqual([Date.UTC(2029, 8, 2, 15)]);
  }, 60_000);

  it('with premium processing, $2,250 and thirty business days: decided 16 April, it runs twelve months from the program’s end, not the approval', () => {
    const sim = graduateOf2029('g16-opt');
    sim.advanceTo(Date.UTC(2029, 2, 5, 15));
    const before = current(sim).balance;
    // Thirty business days from Monday 5 March: 6 March to 16 April, six weekends between.
    expect(run(sim, 'documents.apply_opt', { premium: true })).toMatchObject({ ok: true, value: { fee: 2_250_00, readyAt: Date.UTC(2029, 3, 16, 15) } });
    expect(before - current(sim).balance).toBe(2_250_00);
    sim.advanceTo(Date.UTC(2029, 3, 16, 16));
    const opt = documentsOf(sim.player).find((d) => d.kind === 'permit')!;
    expect(opt).toMatchObject({ status: 'valid', issuedAt: Date.UTC(2029, 4, 31, 12), expiresAt: Date.UTC(2030, 4, 31, 12) });
    expect(titled(sim, APPROVED).map((n) => n.body)).toEqual(['You may work in the United States from May 31, 2029 to May 31, 2030, with no more than 90 days between jobs in all.']);
  }, 60_000);

  it('is refused in its words to a citizen, to a student who withdrew, to a life never on an F-1, and once its window has closed', () => {
    const citizen = student('g16-opt-us');
    expect(run(citizen, 'documents.apply_opt')).toMatchObject({ ok: false, error: 'OPT is for a student on an F-1; you’re a citizen.' });
    const left = student('g16-opt-left', 'uk-eng-london');
    left.advanceTo(Date.UTC(2026, 8, 8, 15));
    expect(run(left, 'school.withdraw', { confirm: true }).ok).toBe(true);
    expect(run(left, 'documents.apply_opt')).toMatchObject({ ok: false, error: 'OPT follows a degree completed, and you left without it.' });
    // A life in London that was never a student in the US: a place a New Haven life doesn't live, so a quick save there.
    const never = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true }, 'g16-opt-never');
    expect(run(never, 'documents.apply_opt')).toMatchObject({ ok: false, error: 'OPT is for a student on an F-1, and you haven’t held one.' });
    const late = graduateOf2029('g16-opt-late');
    late.advanceTo(Date.UTC(2029, 6, 31, 16));
    expect(run(late, 'documents.apply_opt')).toMatchObject({ ok: false, error: 'It closed July 30, 2029, 60 days after the program ended.' });
    expect(documentsOf(late.player).filter((d) => d.kind === 'permit')).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('documents.us_status', () => {
  it('PLAYER JOURNEY: withdrawn on 1 February 2027, an F-1 student keeps fifteen days’ status by the School’s own reschedule; on the sixteenth she is out of status, her F-1 canceled, told once, and refused the marketplace, an ID card and unemployment', () => {
    const sim = student('g16-wd', 'uk-eng-london');
    // Armed when the life was made, at the program's end.
    expect(pendingOf(sim, 'documents.us_status').map((i) => i.at)).toEqual([Date.UTC(2029, 4, 31, 12)]);
    // February 2027, not the September 2026 the review's todo named: until 1 October 2026 federal Medicaid took a
    // non-citizen too (`medicaidStatus`), so HUSKY D would have answered before the marketplace's lawful presence did.
    const t0 = Date.UTC(2027, 1, 1, 16);
    sim.advanceTo(t0);
    expect(run(sim, 'school.withdraw', { confirm: true }).ok).toBe(true);
    expect(titled(sim, 'You Withdrew From The School')[0]!.body).toContain('As an F-1 student you have fifteen days’ grace, and OPT isn’t open to you.');
    // Looked at a minute on, inside the grace, where she's told her status is ending; then at its end, fifteen days on,
    // 16 February 2027 at 11 AM in New Haven. Until 2026-10-13 the withdrawal moved the look straight to the grace's end,
    // and this test held that, where she was found out of status without a word.
    const ends = Date.UTC(2027, 1, 16, 16);
    expect(pendingOf(sim, 'documents.us_status').map((i) => i.at)).toEqual([t0 + 60_000]);
    sim.advanceTo(t0 + 2 * 60_000);
    expect(Object.values(sim.universe.decisions).filter((d) => d.title === 'Your US Status Is Ending').map((d) => [d.dueAt, d.actions.length])).toEqual([[ends, 0]]);
    expect(pendingOf(sim, 'documents.us_status').map((i) => i.at)).toEqual([ends]);
    const work = drawn(sim, WorkPane).text;
    expect(work).toContain('Your Program Ends February 1, 2027');
    expect(work).toContain('Your US Status Ends February 16, 2027');

    sim.advanceTo(Date.UTC(2027, 1, 15, 16));
    expect(sim.player.usOutOfStatus).toBeUndefined();
    expect(f1Of(sim.player)!.status).toBe('valid');
    // In status, lawfully present: Covered Connecticut takes her (a twin, so the life itself stays unenrolled).
    expect(run(reload(sim), 'health.enroll')).toMatchObject({ ok: true, value: { kind: 'essential' } });

    const again = reload(sim);
    expect(pendingOf(again, 'documents.us_status').map((i) => i.at)).toEqual([ends]);
    again.advanceTo(ends - MS_HOUR);
    expect(again.player.usOutOfStatus).toBeUndefined();
    again.advanceTo(Date.UTC(2027, 1, 17, 16));
    expect(again.player.usOutOfStatus).toBe(ends);
    expect(f1Of(again.player)!.status).toBe('cancelled');
    expect(titled(again, 'Out Of Status').map((n) => [n.at, n.body])).toEqual([[ends, 'You stayed in the United States past your status. Your US visa is void, and the Visa Waiver Program is closed to you for good.']]);
    expect(pendingOf(again, 'documents.us_status')).toEqual([]);
    // What reads it, each through its own command.
    expect(run(again, 'health.enroll')).toMatchObject({ ok: false, error: 'The marketplace sells to a citizen or somebody lawfully present, and you stayed past your status.' });
    expect(run(again, 'documents.apply_idcard')).toMatchObject({ ok: false, error: 'The DMV checks lawful presence through SAVE, and you stayed past your status.' });
    expect(run(again, 'benefits.claim')).toMatchObject({ ok: false, error: 'Unemployment pays a noncitizen only with permission to work in the US, such as OPT (FUTA 3304(a)(14)).' });
    const out = drawn(again, WorkPane);
    expect(out.text).toContain('Your US Status Out Of Status Since February 16, 2027; the Visa Waiver Program is closed to you');
    expect(rowOf(out.html, 'F-1 Student Visa')).toContain('Canceled');
    // Said once: a further reload and a month on add nothing.
    const month = reload(again);
    month.advanceTo(Date.UTC(2027, 2, 17, 16));
    expect(titled(month, 'Out Of Status')).toHaveLength(1);
    expect(month.player.usOutOfStatus).toBe(ends);
  }, 60_000);

  it('PLAYER JOURNEY: a student who lets her classes go is dismissed, and is out of status the same hour, with no grace', () => {
    const sim = student('g16-pay', 'uk-eng-london');
    sim.advanceTo(Date.UTC(2027, 11, 11, 17));
    const dismissed = titled(sim, 'Dismissed From The School');
    expect(dismissed).toHaveLength(1);
    const at = dismissed[0]!.at;
    expect(sim.player.school!.standing).toBe('dismissed');
    expect(sim.player.school!.endedAt).toBe(at);
    expect(sim.player.usOutOfStatus).toBe(at);
    expect(f1Of(sim.player)!.status).toBe('cancelled');
    expect(titled(sim, 'Out Of Status').map((n) => n.at)).toEqual([at]);
    // No decision offering OPT: a dismissal leaves none, and no grace to ask it in.
    expect(openDecisions(sim).filter((d) => d.title === 'Your US Status Is Ending')).toEqual([]);
  }, 60_000);

  it('the degree: the look armed when the life was made asks “Your US Status Is Ending” on the program’s end, due sixty days on with OPT both ways; out of status the day it falls due, where a twin that presses Apply For OPT keeps hers', () => {
    const sim = student('g16-grad', 'uk-eng-london');
    graduate(sim, Date.UTC(2029, 4, 21, 13)); // TEST SETUP
    sim.advanceTo(Date.UTC(2029, 4, 31, 13));
    const ending = openDecisions(sim).filter((d) => d.title === 'Your US Status Is Ending');
    expect(ending).toHaveLength(1);
    const d = ending[0]!;
    // The program's end, 31 May 2029, and the degree's sixty days: 30 July 2029.
    expect(d.dueAt).toBe(Date.UTC(2029, 6, 30, 12));
    expect(d.detail).toBe('Your permission to work in the United States has ended, and your status ends July 30, 2029. OPT can still be applied for before then. After it, you’re out of status: no work can be had here, a US visa you hold is void, and the Visa Waiver Program is closed to you for good.');
    expect(d.actions).toEqual([
      { label: 'Apply For OPT', commandKind: 'documents.apply_opt', payload: {} },
      { label: 'Apply For OPT, Premium Processing', commandKind: 'documents.apply_opt', payload: { premium: true } },
    ]);
    expect(pendingOf(sim, 'documents.us_status').map((i) => i.at)).toEqual([Date.UTC(2029, 6, 30, 12)]);

    const applied = reload(sim);
    expect(run(applied, 'world.take_decision_action', { decisionId: d.id, actionIndex: 0 }).ok).toBe(true);
    expect(applied.universe.decisions[d.id]!.resolvedAt).toBe(Date.UTC(2029, 4, 31, 13));

    sim.advanceTo(Date.UTC(2029, 6, 30, 11));
    expect(sim.player.usOutOfStatus).toBeUndefined();
    sim.advanceTo(Date.UTC(2029, 6, 30, 13));
    expect(sim.player.usOutOfStatus).toBe(Date.UTC(2029, 6, 30, 12));
    expect(f1Of(sim.player)!.status).toBe('cancelled');
    expect(titled(sim, 'Out Of Status').map((n) => n.at)).toEqual([Date.UTC(2029, 6, 30, 12)]);
    // Change the input: OPT applied for from the decision holds her status while it's decided.
    applied.advanceTo(Date.UTC(2029, 7, 1, 16));
    expect(applied.player.usOutOfStatus).toBeUndefined();
    expect(titled(applied, 'Out Of Status')).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('benefits.assistance_month', () => {
  it('PLAYER JOURNEY: Apply on Papers on 20 March 2027; $306 a month by the clock, her work-study left out; the midnight groceries on the EBT card; “2 months paid” across a reload; closed on the summer’s first look, nothing paid after', () => {
    const sim = student('g16-snap');
    sim.advanceTo(Date.UTC(2027, 2, 20, 16));
    const panel = drawn(sim, PapersWorkspace, 'benefits');
    expect(panel.text).toContain('SNAP Food assistance, onto an EBT card for groceries');
    expect(panel.text).toContain('Claim None Open You can apply now');
    // The FY2027 maximum for one person, from 1 October 2026.
    expect(panel.text).toContain('At Most $306.00');
    const applied = panel.press('Apply');
    expect(applied.toasts).toEqual(['Applied. The first month comes March 27, 2027.']);
    expect(run(sim, 'benefits.assistance')).toMatchObject({ ok: false, error: 'You have a claim open.' });

    sim.advanceTo(Date.UTC(2027, 2, 27, 16, 1));
    const first = memos(sim, /^SNAP, the month/);
    expect(first.map((t) => [t.at, own(sim, t)[0]!.amount])).toEqual([[Date.UTC(2027, 2, 27, 16), 306_00]]);
    const ebt = sim.universe.accounts[own(sim, first[0]!)[0]!.accountId]!;
    expect([ebt.name, ebt.balance]).toEqual(['EBT Card, SNAP', 306_00]);
    // The month before: work-study, which SNAP leaves out (7 CFR 273.9(c)(3)), and a little interest. Counted, the
    // work-study would have cut it.
    const feb = ledgerMonth(sim, '2027-02');
    expect(feb.workStudy).toBeGreaterThan(217_00);
    expect(snapFy2027(feb.interest)).toBe(306_00);
    expect(snapFy2027(feb.interest + feb.workStudy)).toBeLessThan(306_00);
    expect(sim.player.assistance!.months).toBe(1);
    expect(titled(sim, 'SNAP Paid').map((n) => n.body)).toEqual(['$306.00 for the month.']);

    // Midnight: the day's groceries, on the card, by the clock.
    sim.advanceTo(Date.UTC(2027, 2, 28, 4, 1));
    const groceries = memos(sim, /^Groceries, on the EBT card$/);
    expect(groceries.map((t) => t.at)).toEqual([Date.UTC(2027, 2, 28, 4)]);
    const spent = -own(sim, groceries[0]!)[0]!.amount;
    expect(spent).toBeGreaterThan(0);
    expect(ebt.balance).toBe(306_00 - spent);

    const later = reload(sim);
    later.advanceTo(Date.UTC(2027, 3, 26, 16, 1));
    const both = memos(later, /^SNAP, the month/);
    expect(both.map((t) => [t.at, own(later, t)[0]!.amount])).toEqual([[Date.UTC(2027, 2, 27, 16), 306_00], [Date.UTC(2027, 3, 26, 16), 306_00]]);
    const mar = ledgerMonth(later, '2027-03');
    expect(mar.workStudy).toBeGreaterThan(217_00);
    expect(snapFy2027(mar.interest)).toBe(306_00);
    expect(later.player.assistance!.months).toBe(2);
    const card = later.universe.accounts[ebt.id]!;
    const eaten = memos(later, /^Groceries, on the EBT card$/).reduce((s, t) => s - own(later, t)[0]!.amount, 0);
    expect(card.balance).toBe(2 * 306_00 - eaten);
    const open = drawn(later, PapersWorkspace, 'benefits').text;
    expect(open).toContain('Claim Open Since March 20, 2027, 2 months paid');
    expect(open).toContain(`On The EBT Card ${usd(card.balance)} Spent on groceries first`);

    // The summer: no work-study and no hours, so the case closes on the month's look, once, and pays nothing.
    later.advanceTo(Date.UTC(2027, 4, 26, 16, 1));
    expect(titled(later, 'The Summer Is Yours')).toHaveLength(1);
    expect(titled(later, 'Your SNAP Case Closed').map((n) => [n.at, n.body])).toEqual([[Date.UTC(2027, 4, 26, 16), 'A student in the summer without work-study or 20 hours of work a week isn’t eligible for SNAP (7 CFR 273.5). Apply again once that changes.']]);
    expect(later.player.assistance!.closedAt).toBe(Date.UTC(2027, 4, 26, 16));
    later.advanceTo(Date.UTC(2027, 7, 1, 16));
    expect(memos(later, /^SNAP, the month/)).toHaveLength(2);
    expect(titled(later, 'SNAP Paid')).toHaveLength(1);
    expect(later.player.assistance!.months).toBe(2);
    // The card spent to nothing on the summer's groceries, every draw at a midnight.
    const draws = memos(later, /^Groceries, on the EBT card$/);
    expect(draws.reduce((s, t) => s - own(later, t)[0]!.amount, 0)).toBe(2 * 306_00);
    expect(draws.every((t) => zonedParts(t.at, NY).hour === 0)).toBe(true);
    expect(later.universe.accounts[ebt.id]!.balance).toBe(0);
    const closed = drawn(later, PapersWorkspace, 'benefits');
    expect(closed.text).toContain('Claim None Open A student in the summer without work-study or 20 hours of work a week isn’t eligible for SNAP (7 CFR 273.5).');
    expect(closed.has('Apply')).toBe(false);
  }, 60_000);

  /** A graduate of the spring of 2027, a citizen, with a summer's stipend, on a Connecticut claim from 3 January 2028. */
  function claimant(seed: string): Simulation {
    const sim = student(seed);
    sim.advanceTo(Date.UTC(2027, 4, 24, 16));
    graduate(sim, sim.now); // TEST SETUP
    summerWith(sim, 2027, Date.UTC(2027, 5, 25, 21), Date.UTC(2027, 7, 20, 21)); // TEST SETUP
    sim.advanceTo(Date.UTC(2028, 0, 3, 17));
    expect(run(sim, 'benefits.claim')).toMatchObject({ ok: true, value: { weekly: 93_00 } });
    return sim;
  }

  // Until 2026-10-13 this test held a claimant to the time limit: three months counted, and the fourth refused “SNAP
  // Time Limit Reached” on 8 May 2028. Somebody receiving unemployment is exempt from work registration (7 CFR
  // 273.7(b)(1)(v)), and so from the time limit (273.24(c)).
  it('a graduate on unemployment: each month pays $306 less 30% of the month before’s benefit and interest over $217, rounded up to the dollar; on a claim she’s exempt from the time limit, so no month is counted and the fourth is paid too', () => {
    const sim = claimant('g16-abawd');
    sim.advanceTo(Date.UTC(2028, 1, 1, 17));
    expect(run(sim, 'benefits.assistance')).toMatchObject({ ok: true, value: { scheme: 'snap', firstPaymentAt: Date.UTC(2028, 1, 8, 17) } });
    sim.advanceTo(Date.UTC(2028, 4, 8, 18));
    const paid = memos(sim, /^SNAP, the month/).map((t) => [t.at, own(sim, t)[0]!.amount]);
    const expected = (['2028-01', '2028-02', '2028-03', '2028-04'] as const).map((m) => {
      const income = ledgerMonth(sim, m);
      // Four Sundays of $93 in each of January, February and March 2028, and five in April.
      expect(income.ui).toBe((m === '2028-04' ? 5 : 4) * 93_00);
      return snapFy2027(income.ui + income.interest);
    });
    expect(paid).toEqual([[Date.UTC(2028, 1, 8, 17), expected[0]], [Date.UTC(2028, 2, 9, 17), expected[1]], [Date.UTC(2028, 3, 8, 17), expected[2]], [Date.UTC(2028, 4, 8, 17), expected[3]]]);
    expect(paid.every(([, amount]) => amount! % 100 === 0)).toBe(true);
    expect(sim.player.assistance!.months).toBe(4);
    expect(sim.player.assistance!.counted ?? []).toEqual([]);
    expect(titled(sim, 'SNAP Time Limit Reached')).toEqual([]);
  }, 60_000);

  it('a month with a week’s pay in it takes a fifth of the pay off before the 30%: the graduate’s March payment, on February’s benefit, interest and $375 of wages', () => {
    const sim = claimant('g16-earned');
    sim.advanceTo(Date.UTC(2028, 1, 1, 17));
    sim.must({ kind: 'benefits.assistance', payload: {} });
    sim.advanceTo(Date.UTC(2028, 1, 18, 22));
    // TEST SETUP: a week's pay, $375, posted and put on the earnings record as the Summer Cabaret's Friday puts them.
    sim.post({ memo: 'Yale Summer Cabaret stipend, the week', category: 'salary', postings: [{ accountId: current(sim).id, amount: 375_00 }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -375_00 }] });
    recordWages(sim.player, sim.now, NY, { gross: 375_00, employer: 'yale-summer-cabaret' });
    sim.advanceTo(Date.UTC(2028, 2, 9, 18));
    const feb = ledgerMonth(sim, '2028-02');
    expect(feb.wages).toBe(375_00);
    // That Sunday's Connecticut week paid nothing, two-thirds of $375 being over $93: three weeks of February paid.
    expect(feb.ui).toBe(3 * 93_00);
    const paid = memos(sim, /^SNAP, the month/).map((t) => [t.at, own(sim, t)[0]!.amount]);
    expect(paid[1]).toEqual([Date.UTC(2028, 2, 9, 17), snapFy2027(feb.ui + feb.interest, feb.wages)]);
    // Read as unearned, without the fifth off, it would be $23 less: 30% of the $75 more, $22.50, and the 30% rounded up
    // to the dollar each way. Until 2026-10-13, when it was paid to the cent, this held $22.50.
    expect(snapFy2027(feb.ui + feb.interest + feb.wages) - snapFy2027(feb.ui + feb.interest, feb.wages)).toBe(-23_00);
  }, 60_000);

  it('reads the calendar month before the payment: claimed 20 January 2028, the month paid on the 27th is $306, December having brought nothing over $217, not January’s weeks so far', () => {
    const sim = claimant('g16-snapdef');
    sim.advanceTo(Date.UTC(2028, 0, 20, 17));
    sim.must({ kind: 'benefits.assistance', payload: {} });
    sim.advanceTo(Date.UTC(2028, 0, 27, 18));
    const dec = ledgerMonth(sim, '2027-12');
    expect(dec.ui).toBe(0);
    // January so far, three Sundays at $93, is what the payment of the 27th must not read.
    expect(ledgerMonth(sim, '2028-01').ui).toBe(3 * 93_00);
    expect(memos(sim, /^SNAP, the month/).map((t) => own(sim, t)[0]!.amount)).toEqual([snapFy2027(dec.ui + dec.interest)]);
  }, 60_000);

  it('Ontario Works, in Toronto, where a New Haven life never lives: CAD 343 a month by the clock into the account, six days after applying and every thirty after, refused over CAD 10,000 of assets', () => {
    const sim = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'nothing' }, 'g16-ow');
    const asked = sim.now;
    expect(run(sim, 'benefits.assistance')).toMatchObject({ ok: true, value: { scheme: 'ontario-works', firstPaymentAt: asked + 6 * MS_DAY } });
    sim.advanceTo(asked + 37 * MS_DAY);
    // Basic needs for a single adult, CAD 343 (the policy directives, 2026); no shelter, since the home went.
    expect(memos(sim, /^Ontario Works, the month$/).map((t) => [t.at, own(sim, t)])).toEqual([
      [asked + 6 * MS_DAY, [{ accountId: current(sim).id, amount: 343_00 }]],
      [asked + 36 * MS_DAY, [{ accountId: current(sim).id, amount: 343_00 }]],
    ]);
    expect(sim.player.assistance!.months).toBe(2);
    expect(titled(sim, 'Assistance Paid').map((n) => n.body)).toEqual(['C$343.00 for the month.']);
    const rich = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'wealthy' }, 'g16-ow-rich');
    expect(run(rich, 'benefits.assistance')).toMatchObject({ ok: false, error: 'Ontario Works asks liquid assets under CAD 10,000.' });
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('benefits.week', () => {
  it('PLAYER JOURNEY: File A Claim on Papers for $93 a week; Sunday’s week posted to her account and year; nothing for a week in hospital; $31 for a week with four hours worked, $92; across a reload paid to its $2,418 and ended in its words, with Papers showing each', () => {
    const sim = student('g16-ui');
    sim.advanceTo(Date.UTC(2027, 4, 24, 16));
    graduate(sim, sim.now); // TEST SETUP
    summerWith(sim, 2027, Date.UTC(2027, 5, 25, 21), Date.UTC(2027, 7, 20, 21)); // TEST SETUP
    sim.advanceTo(Date.UTC(2028, 0, 3, 17));
    // Connecticut: the two best quarters' average over 26, to the dollar: ($3,375 + $1,500) / 2 / 26 = $93.75, so $93,
    // for 26 weeks, $2,418 at most; the wages over 40 times it.
    const none = drawn(sim, PapersWorkspace, 'benefits');
    expect(none.text).toContain('No Claim Open File A Claim How This Works Filed now, your base period, 2026-4, 2027-1, 2027-2, 2027-3, pays $93.00 a week for up to 26 weeks.');
    expect(none.press('File A Claim').toasts).toEqual(['Filed: $93.00 a week.']);
    const claim = unemploymentOf(sim.player).claim!;
    expect(claim).toMatchObject({ state: 'ct', weekly: 93_00, maxTotal: 26 * 93_00, paid: 0, waited: true, filedAt: Date.UTC(2028, 0, 3, 17), endsAt: Date.UTC(2028, 0, 3, 17) + 365 * MS_DAY });
    expect(run(sim, 'benefits.claim')).toMatchObject({ ok: false, error: 'You have a claim open.' });

    // Sunday 9 January at 8 PM: the first week, with no waiting week in Connecticut.
    sim.advanceTo(Date.UTC(2028, 0, 10, 2));
    const week = memos(sim, /^Unemployment insurance/);
    expect(week.map((t) => [t.at, t.memo, t.category, own(sim, t)])).toEqual([[Date.UTC(2028, 0, 10, 1), 'Unemployment insurance: the week to January 9, 2028', 'benefit', [{ accountId: current(sim).id, amount: 93_00 }]]]);
    expect(claim.paid).toBe(93_00);
    expect(yearOf(sim.player, 2028).unemployment).toBe(93_00);
    expect(titled(sim, 'Your Waiting Week')).toEqual([]);
    const open = drawn(sim, PapersWorkspace, 'benefits').text;
    expect(open).toContain('A Connecticut Claim Filed January 3, 2028');
    expect(open).toContain('A Week $93.00 Connecticut has no waiting week Paid $93.00 Of $2,418.00 at most At Most $2,418.00 Until January 2, 2029');

    // TEST SETUP: in hospital through the next Sunday. Not available, the week pays nothing, and the next is certified.
    sim.player.health!.inHospitalUntil = Date.UTC(2028, 0, 17, 17);
    sim.advanceTo(Date.UTC(2028, 0, 17, 2));
    expect(memos(sim, /^Unemployment insurance/)).toHaveLength(1);
    expect(claim.paid).toBe(93_00);
    expect(pendingOf(sim, BENEFIT_WEEK_KIND).map((i) => i.at)).toEqual([Date.UTC(2028, 0, 24, 1)]);

    // TEST SETUP: four hours worked on Wednesday evening at front of house, $23 an hour, kept on the calendar as the
    // School keeps a shift worked (a graduate has no work, so no play puts one here). Connecticut pays the benefit less
    // two-thirds of the week’s earnings, to the dollar: $93 − $62 (two-thirds of $92, up) = $31. Until 2026-10-13 this
    // posted $75 of pay to the ledger, which the week read as its earnings, and it paid $43; a week reads the work done
    // in it now (`workDoneIn`), and a payment is no work.
    const shift = sim.schedule({ at: Date.UTC(2028, 0, 20, 0), kind: SHIFT_KIND, label: 'Elective Shift: Front Of House, Yale Rep', category: 'school', payload: { personId: sim.player.id, hours: 4, elective: true, worked: 4 } });
    Object.assign(shift, { status: 'done', resolvedAt: shift.at });
    sim.advanceTo(Date.UTC(2028, 0, 24, 2));
    expect(memos(sim, /^Unemployment insurance/).map((t) => own(sim, t)[0]!.amount)).toEqual([93_00, 31_00]);
    expect(claim.paid).toBe(124_00);

    // Across a reload, to the end: 24 more full weeks and $62 left, on Sunday 16 July.
    const later = reload(sim);
    later.advanceTo(Date.UTC(2028, 6, 17, 1));
    const all = memos(later, /^Unemployment insurance/).map((t) => own(later, t)[0]!.amount);
    expect(all).toEqual([93_00, 31_00, ...Array<number>(24).fill(93_00), 62_00]);
    expect(all.reduce((s, x) => s + x, 0)).toBe(2_418_00);
    expect(unemploymentOf(later.player).claim).toBeUndefined();
    expect(unemploymentOf(later.player).past).toMatchObject([{ paid: 2_418_00, closedAt: Date.UTC(2028, 6, 17, 0) }]);
    expect(titled(later, 'Your Unemployment Claim Ended').map((n) => [n.at, n.body])).toEqual([[Date.UTC(2028, 6, 17, 0), 'The claim has paid all it can: $2,418.00.']]);
    expect(pendingOf(later, BENEFIT_WEEK_KIND)).toEqual([]);
    // The year's income, as the return reads it, is what the clock paid.
    expect(yearOf(later.player, 2028).unemployment).toBe(2_418_00);
    const past = drawn(later, PapersWorkspace, 'benefits');
    expect(past.text).toContain('No Claim Open');
    expect(rowOf(past.html, 'January 3, 2028')).toBe('January 3, 2028 2026-4 to 2027-3 July 16, 2028 $93.00 $2,418.00');
    later.advanceTo(Date.UTC(2028, 7, 1, 16));
    expect(memos(later, /^Unemployment insurance/)).toHaveLength(27);
  }, 60_000);

  it('while she is enrolled, a Connecticut claim is refused at filing in its words and Papers offers none; nothing in SLATE returns a claimant to school, so the week’s own student check is never reached', () => {
    const sim = student('g16-ui-enrolled');
    summerWith(sim, 2027, Date.UTC(2027, 5, 25, 21), Date.UTC(2027, 7, 20, 21)); // TEST SETUP
    sim.advanceTo(Date.UTC(2027, 8, 6, 16));
    expect(['good', 'concern', 'warning']).toContain(sim.player.school!.standing);
    const refusal = 'Connecticut takes a full-time student as not available for work (CGS 31-235(b)): a claim pays once you’ve left school.';
    const papers = drawn(sim, PapersWorkspace, 'benefits');
    expect(papers.text).toContain(`No Claim Open How This Works ${refusal}`);
    expect(papers.has('File A Claim')).toBe(false);
    expect(run(sim, 'benefits.claim')).toMatchObject({ ok: false, error: refusal });
    expect(unemploymentOf(sim.player).claim).toBeUndefined();
  }, 60_000);

  it('an F-1 graduate on OPT: paid while it is in force, nothing once it has ended, the claim ended a year from filing; her 2029 1040-NR reports exactly what the clock paid', () => {
    const sim = student('g16-optui', 'uk-eng-london');
    graduate(sim, Date.UTC(2029, 4, 21, 13)); // TEST SETUP
    summerWith(sim, 2028, Date.UTC(2028, 5, 23, 21), Date.UTC(2028, 7, 18, 21)); // TEST SETUP
    sim.advanceTo(Date.UTC(2029, 2, 5, 15));
    sim.must({ kind: 'documents.apply_opt', payload: {} });
    sim.advanceTo(Date.UTC(2029, 5, 4, 16));
    expect(run(sim, 'benefits.claim')).toMatchObject({ ok: true, value: { weekly: 93_00, maxTotal: 2_418_00 } });
    expect(unemploymentOf(sim.player).claim!.basePeriod).toEqual(['2028-1', '2028-2', '2028-3', '2028-4']);
    sim.advanceTo(Date.UTC(2029, 8, 3, 1));
    // Twelve Sundays from 10 June to 26 August; her OPT ended at 11 AM on 2 September, so that evening's week is unpaid.
    expect(memos(sim, /^Unemployment insurance/).map((t) => t.at)).toEqual(Array.from({ length: 12 }, (_, n) => Date.UTC(2029, 5, 11, 0) + n * 7 * MS_DAY));
    expect(sim.player.usOutOfStatus).toBe(Date.UTC(2029, 8, 2, 15));
    expect(unemploymentOf(sim.player).claim!.paid).toBe(12 * 93_00);
    expect(pendingOf(sim, BENEFIT_WEEK_KIND).map((i) => i.at)).toEqual([Date.UTC(2029, 8, 10, 0)]);

    const later = reload(sim);
    later.advanceTo(Date.UTC(2030, 1, 1, 18));
    const r = returnsOf(later.player)['2029']!;
    const paid = memos(later, /^Unemployment insurance/).reduce((s, t) => s + own(later, t)[0]!.amount, 0);
    expect(paid).toBe(1_116_00);
    expect(r.figures.form).toBe('1040-NR');
    expect(r.figures.unemployment).toBe(paid);
    expect(r.figures.income).toBe(paid);
    later.advanceTo(Date.UTC(2030, 5, 10, 1));
    expect(unemploymentOf(later.player).claim).toBeUndefined();
    expect(unemploymentOf(later.player).past).toMatchObject([{ paid: 1_116_00, closedAt: Date.UTC(2030, 5, 10, 0) }]);
    expect(titled(later, 'Your Unemployment Claim Ended').map((n) => n.body)).toEqual(['A year from filing, the benefit year is over.']);
    expect(pendingOf(later, BENEFIT_WEEK_KIND)).toEqual([]);
    expect(memos(later, /^Unemployment insurance/)).toHaveLength(12);
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('tax.season', () => {
  it('PLAYER JOURNEY: a student born in New York earns $1,670.59 in 2026, under any year’s standard deduction, and on 1 February 2027 is asked for no return; April passes with no late notice', () => {
    const sim = student('g16-season');
    sim.advanceTo(Date.UTC(2027, 1, 1, 15));
    // Her 2026 by the ledger: work-study and interest, nothing withheld.
    const months = Array.from({ length: 12 }, (_, n) => ledgerMonth(sim, `2026-${String(n + 1).padStart(2, '0')}`));
    const income = months.reduce((s, m) => s + m.workStudy + m.wages + m.interest + m.ui, 0);
    expect(income).toBe(1_670_59);
    // A single filer's standard deduction, $15,750 for 2025 and more for 2026: far over it.
    expect(income).toBeLessThan(15_750_00);
    expect(returnsOf(sim.player)['2026']).toBeUndefined();
    expect(openDecisions(sim).filter((d) => d.title === 'Your 2026 Tax Return')).toEqual([]);
    expect(pendingOf(sim, TAX_DUE_KIND)).toEqual([]);
    // The season is armed again for 1 February 2028 at 9 AM.
    expect(pendingOf(sim, TAX_SEASON_KIND).map((i) => i.at)).toEqual([Date.UTC(2028, 1, 1, 14)]);
    sim.advanceTo(Date.UTC(2027, 3, 17, 16));
    expect(titled(sim, 'Your 2026 Return Is Late')).toEqual([]);
    expect(pendingOf(sim, TAX_SFR_KIND)).toEqual([]);
  }, 60_000);

  it('Papers’ No Returns Yet doesn’t tell the student with $1,670.59 of income that a year with any income has its return ready', () => {
    const sim = student('g16-season');
    sim.advanceTo(Date.UTC(2027, 1, 1, 15));
    expect(returnsOf(sim.player)['2026']).toBeUndefined();
    const text = drawn(sim, PapersWorkspace, 'returns').text;
    expect(text).toContain('No Returns Yet');
    expect(text).not.toContain('a year with any income');
    expect(text).toMatch(/standard deduction|filing threshold/);
  }, 60_000);

  it('an F-1 student with work-study is asked for her 1040-NR at 10%, due 15 April 2027, Tax Return Due on the calendar at that minute and Tax Season again for 1 February 2028, once each across a reload', () => {
    const sim = student('g16-nr', 'uk-eng-london');
    sim.advanceTo(Date.UTC(2027, 1, 1, 15));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.form).toBe('1040-NR');
    expect(r.figures.balance).toBe(Math.round(r.figures.income * 0.1));
    // 15 April 2027, a Thursday, at 23:59 in New Haven (EDT).
    expect(r.due).toBe(Date.UTC(2027, 3, 16, 3, 59));
    const asked = openDecisions(sim).filter((d) => d.title === 'Your 2026 Tax Return');
    expect(asked.map((d) => [d.dueAt, d.actions])).toEqual([[r.due, [{ label: 'File It', commandKind: 'tax.file', payload: { year: 2026 } }]]]);
    expect(pendingOf(sim, TAX_DUE_KIND).map((i) => [i.at, i.payload.year])).toEqual([[Date.UTC(2027, 3, 16, 3, 59), 2026]]);
    expect(pendingOf(sim, TAX_SEASON_KIND).map((i) => i.at)).toEqual([Date.UTC(2028, 1, 1, 14)]);
    const again = reload(sim);
    expect(pendingOf(again, TAX_DUE_KIND)).toHaveLength(1);
    expect(pendingOf(again, TAX_SEASON_KIND).map((i) => i.at)).toEqual([Date.UTC(2028, 1, 1, 14)]);
    again.advanceTo(Date.UTC(2027, 3, 16, 12));
    expect(titled(again, 'Your 2026 Return Is Late').map((n) => n.at)).toEqual([Date.UTC(2027, 3, 16, 3, 59)]);
  }, 60_000);

  it('an F-1 student with no US income files Form 8843 alone: a return at $0, due 15 June 2027, as a 1040-NR without wages is', () => {
    const sim = student('g16-8843', 'uk-eng-london');
    graduate(sim, Date.UTC(2029, 4, 21, 13)); // TEST SETUP: no work-study, so no US income
    sim.advanceTo(Date.UTC(2027, 1, 1, 15));
    const r = returnsOf(sim.player)['2026']!;
    expect([r.figures.form, r.figures.income, r.figures.balance]).toEqual(['1040-NR', 0, 0]);
    expect(r.due).toBe(Date.UTC(2027, 5, 16, 3, 59));
    expect(openDecisions(sim).filter((d) => d.title === 'Your 2026 Tax Return').map((d) => d.detail)).toEqual(['Form 8843, which every F-1 student files; no income to report. Nothing owed or due back on $0.00 of income. File by June 15, 2027.']);
    expect(pendingOf(sim, TAX_DUE_KIND).map((i) => i.at)).toEqual([Date.UTC(2027, 5, 16, 3, 59)]);
  }, 60_000);

  it('tax.due: the Form 8843 alone left unfiled past 15 June 2027 is told there’s no penalty and it’s still hers to file, not that a refund waits', () => {
    // The notice's branch for a return at $0, added 2026-10-13 and asserted by no test until later that day.
    const sim = student('g16-8843-late', 'uk-eng-london');
    graduate(sim, Date.UTC(2029, 4, 21, 13)); // TEST SETUP: no work-study, so no US income
    sim.advanceTo(Date.UTC(2027, 5, 17, 12));
    const r = returnsOf(sim.player)['2026']!;
    expect([r.figures.balance, r.filedAt]).toEqual([0, undefined]);
    expect(titled(sim, 'Your 2026 Return Is Late').map((n) => [n.at, n.body])).toEqual([[Date.UTC(2027, 5, 16, 3, 59), 'With no tax owed on it and no refund due, there’s no penalty; it’s still yours to file.']]);
    expect(pendingOf(sim, TAX_SFR_KIND)).toEqual([]);
  }, 60_000);

  it('a life in London that earned nothing in the US, a place a New Haven life never lives, is asked for no US return, and the season is armed again', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true }, 'g16-season-uk');
    sim.advanceTo(Date.UTC(2027, 1, 2, 12));
    expect(returnsOf(sim.player)).toEqual({});
    expect(openDecisions(sim).filter((d) => d.title.endsWith('Tax Return'))).toEqual([]);
    expect(pendingOf(sim, TAX_SEASON_KIND).map((i) => i.at)).toEqual([Date.UTC(2028, 1, 1, 14)]);
  }, 60_000);
});
