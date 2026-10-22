/**
 * The second round of 2026-10-13's evidence for six Papers rows (verification batch b06): what the first round
 * (tests/evidence-g16-papers.test.ts and tests/evidence-g17-papers.test.ts) and the check after it left open. Each row's
 * remaining gaps are closed here through the command its screen sends, pressed on the screen where the row has one, or
 * through the clock, and each consequence is read where the row says it's read, against figures worked out here from
 * the rule's own published numbers, never from the helper the engine computes them with.
 *
 * - `tax.pay`: the London student's 2026 1040-NR, never filed, assessed by the IRS on 12 August 2028 with no setup. On
 *   16 August $200.00 is typed into Pay through the field's own onChange (the first round put the amount into the
 *   component's state by hand) and goes $165.60 to the tax and $34.40 to the penalty; $100.00 more goes all to the
 *   penalty, the interest untouched; blank pays the rest, the penalty's $45.28 before any interest. The penalty is worked
 *   from IRC 6651: the filing addition at its least, the tax itself, and seventeen months of paying late. The levy that
 *   follows an unpaid twin doesn't come. What the IRS assessed is held to the statute too: interest on the filing
 *   addition from the due date (IRC 6601(e)(2)(B)), $376.73 where SLATE assessed $360.59. That test failed, SLATE
 *   charging interest on the tax alone until the assessment, until later on 2026-10-13; the third round of that day
 *   counted leap-year 2028’s days at a 366th of the rate, as the IRS does, and it holds $376.69. That round also held the
 *   paying-late addition to its 21 days after the assessment (IRC 6601(e)(2)(A)): no interest on it paid in ten, and from
 *   the assessment on it paid in thirty.
 * - `documents.permission`: a graduate the clock confers. Three years were played with the coursework done and the life
 *   kept rested (TEST SETUP), where the first round set the degree by hand. She applies for OPT on Papers in March 2029
 *   and graduates at Commencement, whose `setStanding` moves the look at her status. OPT is decided on 3 June, valid
 *   twelve calendar months, and ended by its ninety days without work on 2 September, the day Papers gives for her
 *   status’s end; until the third round of 2026-10-13 it gave the expiry’s sixty days on, 2 August 2030.
 * - `documents.us_status`: the same played graduate, with no OPT. She is asked "Your US Status Is Ending" on the
 *   program's end, by the look her degree rescheduled, and is out of status sixty days on. Her marketplace plan, bought
 *   on a month's pay set by hand, ends with the month; a twin that applies for OPT from the decision keeps hers. A
 *   withdrawn student who took Covered Connecticut in her grace for 1 April loses it at the first month’s look out of
 *   status, before it begins, and is told why. Until 2026-10-13 she kept it to its renewal on 1 October, where she was
 *   told first that her income, the bank’s interest alone, was over what it allows, then that day that she had stayed
 *   past her status; the third round of that day ended it with the month. Unemployment's refusal
 *   is the same in status and out of it: no played life holds OPT out of status.
 * - `benefits.assistance_month`: a graduate on unemployment is paid in literal figures, $306 less 30% of four Sundays'
 *   $93 and the month's interest over $217, rounded up to the dollar, $258, four months and more, a claimant being
 *   exempt from the time limit, where a twin with no claim is held to it; the EBT card's balance the sum of its
 *   postings. Until the third round of 2026-10-13 it was paid to the cent, $258.45, and the claimant was cut off in
 *   her fourth month. A claim made at nine on a January evening is paid on the 31st's evening. That payment must read December,
 *   the calendar month before in New Haven, and SLATE reads January, the month in UTC; the test fails. A student in good
 *   standing plays the Summer Cabaret. Its Friday stipends give her the hours that keep a summer claim open, where a twin
 *   without the company is refused. The months its wages are read pay SLATE's 30% formula, $11-odd or nothing, where
 *   7 U.S.C. 2017(a) gives a one-person household at least its least, $25 in FY2027; that test fails. BC Income
 *   Assistance is paid CAD 560 by the clock, 21 days after applying and every 30 after.
 * - `tax.due`: the 2026 return's least past 60 days is $535 (Rev. Proc. 2025-32, returns required in 2027). A return
 *   owed to New York and Connecticut is told both charge their own. One with the IRS owed exactly nothing is told so.
 *   One with $1,000 owed the IRS, filed 70 days late, is charged $550. A return due a refund has no substitute put on
 *   the calendar at all, done or pending, a year and a day on.
 * - `documents.apply_ssn`: Discover lends to the F-1 student with the number and a month’s wages past $25,000 a year,
 *   and refuses her twin without it, so the lender reads the number. No played life’s wages reach that line. The office’s
 *   New Haven check was reached only with her location set by hand, and went on 2026-10-13: nothing in play moves her.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven from Monday
 * 24 August 2026, born in New York (a citizen) or in London (on an F-1), played on the clock (`advanceTo`) and through
 * commands, never by calling a handler or a reader in their place. A balance or a place a New Haven student never
 * reaches (a New York return of $20,000 or $60,000 of wages, a life in Vancouver) is a `quickSave` life, and said so where
 * it's made. Screens are rendered as the player has them (react-dom/server). `useGame`'s `run` is the save's own
 * `execute`; a pressed button is the component's own onClick; a typed amount goes through the input's own onChange into
 * the component's state, which a render keeps between draws as React keeps it between renders.
 *
 * TEST SETUP, said again where it's done: the life kept rested, fed and awake each six hours, and each open piece of
 * coursework prepared at midnight, which stand in for a player doing the work across three years; the degree conferred by
 * hand for the SNAP claimant (as the first round's); a summer's Cabaret stipends on the earnings record for her claim; a
 * month's wages posted and recorded as payroll records them; a year's wages and withholding recorded for a return, the
 * withholding that leaves the IRS a given part read from a first life's return; where the player is, moved by hand.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, MS_MINUTE, instantFromZoned, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { documentsOf } from '@/engine/systems/documents';
import { f1Of } from '@/engine/systems/permission';
import { TAX_NOTICE_KIND, TAX_SFR_KIND, returnsOf } from '@/engine/systems/taxreturn';
import { STATE_NONFILER_KIND } from '@/engine/systems/statetax';
import { hasSsn } from '@/engine/systems/taxid';
import { healthOf } from '@/engine/systems/health';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { openDecisions } from '@/engine/world/world';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** Each useState's value, in render order, kept between draws of one screen as React keeps it between renders. */
  slots: [] as unknown[],
  cursor: 0,
  buttons: [] as { text: string; disabled?: boolean; title?: string; onClick?: () => void }[],
  inputs: [] as { id?: string; value?: unknown; onChange?: (e: { target: { value: string } }) => void }[],
  toasts: [] as string[],
  results: [] as { ok: boolean; error?: string; value?: unknown }[],
  tabs: {} as Record<string, string>,
}));

// A component's state, kept by render order: what its own setter set is what the next draw renders.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    real.useState(initial);
    const i = h.cursor++;
    if (!(i in h.slots)) h.slots[i] = typeof initial === 'function' ? (initial as () => unknown)() : initial;
    const set = (v: unknown) => { h.slots[i] = typeof v === 'function' ? (v as (x: unknown) => unknown)(h.slots[i]) : v; };
    return [h.slots[i], set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

/** Every button and input the screens draw, with their words, values and their own handlers. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, title: props.title as string | undefined, onClick: props.onClick as (() => void) | undefined });
    if (type === 'input' && props) h.inputs.push({ id: props.id as string | undefined, value: props.value, onChange: props.onChange as never });
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));

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
/** An hour of a day on New Haven's clock. */
const on = (year: number, month: number, day: number, hour = 12, minute = 0): number => instantFromZoned({ year, month, day, hour, minute }, NY);
const student = (seed: string, home = 'us-ny-newyork'): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: home, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** A life in a city a New Haven student never lives in, or at a balance hers never reaches: a `quickSave` life there. */
const elsewhere = (seed: string, cityId = 'us-ny-newyork', wealth = 'wealthy'): Simulation => quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth } as never, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** A life kept at a moment, and a copy of it to play on, opened as the save is opened. */
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => loadSave(JSON.parse(snap) as never);
function once<T>(make: () => T): () => T {
  let done: { value: T } | undefined;
  return () => (done ??= { value: make() }).value;
}
/** Six hours a step, the stops a player would answer passed by. */
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tend = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** TEST SETUP: the work done each midnight, every open piece's every part prepared, as a player at work on it would. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};

/** Dollars as a US screen writes them, worked here: $1,234.56. */
const usd = (cents: number) => `${cents < 0 ? '-' : ''}$${(Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const cents = (s: string) => Math.round(Number(s.replace(/[$,]/g, '')) * 100);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const memos = (sim: Simulation, re: RegExp, after = 0) => sim.universe.transactions.filter((t) => re.test(t.memo) && t.at >= after);
/** What a transaction moved in or out of the player's own accounts. */
const own = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) =>
  t.postings.filter((p) => { const a = sim.universe.accounts[p.accountId]; return a !== undefined && a.ownerId === sim.player.id && !a.nominal; }).map((p) => ({ accountId: p.accountId, amount: p.amount }));
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === kind && i.payload.personId === sim.player.id);
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload });
/** TEST SETUP: a month's wages paid into the current account, posted and recorded as payroll posts and records them. */
function paidWages(sim: Simulation, gross: number): void {
  sim.post({ memo: 'Wages, the month', category: 'salary', postings: [{ accountId: current(sim).id, amount: gross }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -gross }] });
  recordWages(sim.player, sim.now, NY, { gross });
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

/**
 * A screen as the player has it, on a Papers tab. `kept` draws it again with the state its components were left in, as
 * the screen re-renders after a keystroke; otherwise it's drawn fresh, as on opening it.
 */
function drawn(sim: Simulation, screen: FunctionComponent, tab?: string, kept = false) {
  h.sim = sim;
  h.buttons = [];
  h.inputs = [];
  h.toasts = [];
  h.results = [];
  h.tabs = tab ? { [PAPERS]: tab } : {};
  if (!kept) h.slots = [];
  h.cursor = 0;
  const html = renderToStaticMarkup(createElement(screen));
  const buttons = [...h.buttons];
  const inputs = [...h.inputs];
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
  /** Typed into the input, through its own onChange. */
  const type = (id: string, text: string) => {
    const found = inputs.filter((x) => x.id === id);
    expect(found, `one input #${id}`).toHaveLength(1);
    found[0]!.onChange!({ target: { value: text } });
  };
  return { html, text: onScreen(html), buttons, inputs, button, press, type, has: (words: string) => buttons.some((x) => x.text === words) };
}

/** The Returns tab's Still Owed To The IRS, in cents. */
const stillOwed = (html: string) => cents(rowOf(html, 'Still Owed To The IRS').replace('Still Owed To The IRS, With Interest And Penalty To Date', '').trim());
/** An amount typed into the 2026 return's Pay field on the Returns tab, shown there, and Pay pressed. */
function payTyped(sim: Simulation, typed: string) {
  drawn(sim, PapersWorkspace, 'returns').type('tax-pay-2026', typed);
  const shown = drawn(sim, PapersWorkspace, 'returns', true);
  expect(shown.inputs.filter((i) => i.id === 'tax-pay-2026').map((i) => i.value)).toEqual([typed]);
  return shown.press('Pay');
}

// ---------------------------------------------------------------------------

describe('tax.pay', () => {
  /** 11:59 PM on Thursday 15 April 2027 in New Haven (EDT): the 2026 1040-NR's due date. */
  const DUE = Date.UTC(2027, 3, 16, 3, 59);
  /** Figured a year after it (CP2566) and, unanswered, assessed 120 days later: 11:59 PM on 12 August 2028. */
  const ASSESSED = DUE + 485 * MS_DAY;
  /** Noon on 16 August 2028: its seventeenth month of paying late began on the 15th, by the calendar or by 30.4375 days. */
  const PAY_DAY = Date.UTC(2028, 7, 16, 16);

  /** The student born in London never files her 2026 1040-NR: played with no setup to the minute before the assessment. */
  const unfiled = once(() => {
    const sim = student('g16-pay', 'uk-eng-london');
    sim.advanceTo(ASSESSED - MS_MINUTE);
    const r = returnsOf(sim.player)['2026']!;
    // Her work-study, $1,656.00, taxed at a nonresident's 10% with no standard deduction: $165.60, nothing withheld.
    expect([r.figures.form, r.figures.income, r.figures.balance, r.due, r.filedAt]).toEqual(['1040-NR', 1_656_00, 165_60, DUE, undefined]);
    return freeze(sim);
  });

  it('PLAYER JOURNEY: $200.00 typed into Pay goes to the tax, then the penalty; $100.00 more all to the penalty; blank pays the penalty’s $45.28 before any interest; the notices stop, Pay goes, and no levy follows where an unpaid twin is levied', () => {
    const sim = thaw(unfiled());
    sim.advanceTo(PAY_DAY);
    const r = returnsOf(sim.player)['2026']!;
    expect([r.substitute, r.filedAt]).toEqual([true, ASSESSED]);
    // The penalty, IRC 6651 worked here: filing late, five months' 4.5% (22.5%, $37.26) or past 60 days the lesser of
    // $535 and the tax, so the tax itself, $165.60; paying late, 0.5% a month or part of one from the due date on the tax
    // unpaid, sixteen months by the assessment ($13.248), seventeen now ($14.076). $165.60 + $14.076 = $179.676.
    const penalty = 179_68;
    expect(Math.round(16_560 + 0.005 * 17 * 16_560)).toBe(penalty);
    const papers = drawn(sim, PapersWorkspace, 'returns');
    expect(papers.text).toContain('2026 Return Filed by the IRS August 12, 2028');
    expect(papers.text).toContain(`Tax Unpaid ${usd(165_60)} Penalties ${usd(penalty)}`);
    const shown = stillOwed(papers.html);
    const account = current(sim);
    const before = account.balance;

    // $200.00, typed: all of the tax, then $34.40 of the penalty, none to the interest.
    const first = payTyped(sim, '200.00');
    expect(first.result).toMatchObject({ ok: true, value: { paid: 200_00, tax: 165_60, penalty: 34_40, interest: 0 } });
    expect(first.toasts).toEqual([`Paid the IRS: $165.60 to the tax, $34.40 to penalties and $0.00 to interest. You still owe ${usd(shown - 200_00)}.`]);
    expect(before - account.balance).toBe(200_00);
    expect(r.parts).toMatchObject({ tax: 0, penalty: penalty - 34_40 });
    const interest = r.parts!.interest;

    // $100.00 more: the tax is paid, so all of it to the penalty, the interest left as it was.
    const second = payTyped(sim, '100.00');
    expect(second.result).toMatchObject({ ok: true, value: { paid: 100_00, tax: 0, penalty: 100_00, interest: 0 } });
    expect(r.parts).toEqual({ tax: 0, penalty: penalty - 134_40, interest });
    // Nothing, typed: refused, nothing taken.
    expect(payTyped(sim, '0').result).toMatchObject({ ok: false, error: 'Enter an amount above zero.' });
    expect(before - account.balance).toBe(300_00);

    // Blank: the rest, the penalty's $45.28 first, then the interest.
    const rest = drawn(sim, PapersWorkspace, 'returns').press('Pay');
    expect(rest.toasts).toEqual(['Paid the IRS in full.']);
    expect(rest.result).toMatchObject({ ok: true, value: { paid: shown - 300_00, tax: 0, penalty: 45_28, interest: shown - 300_00 - 45_28 } });
    expect(interest).toBe(shown - 300_00 - 45_28);
    expect(before - account.balance).toBe(shown);
    expect(memos(sim, /^Income tax owed, 2026/).map((t) => [t.memo, t.category, own(sim, t)])).toEqual([
      ['Income tax owed, 2026, in part', 'tax', [{ accountId: account.id, amount: -200_00 }]],
      ['Income tax owed, 2026, in part', 'tax', [{ accountId: account.id, amount: -100_00 }]],
      ['Income tax owed, 2026', 'tax', [{ accountId: account.id, amount: -(shown - 300_00) }]],
    ]);
    expect(r.payments!.map((p) => [p.amount, p.tax, p.penalty, p.interest])).toEqual([[200_00, 165_60, 34_40, 0], [100_00, 0, 100_00, 0], [shown - 300_00, 0, 45_28, interest]]);
    expect(r.owed).toBeUndefined();
    expect(pendingOf(sim, TAX_NOTICE_KIND).filter((i) => i.payload.year === 2026)).toEqual([]);
    const paid = drawn(sim, PapersWorkspace, 'returns');
    expect(paid.text).not.toContain('Still Owed To The IRS');
    expect(paid.has('Pay')).toBe(false);
    expect(run(sim, 'tax.pay', { year: 2026 })).toMatchObject({ ok: false, error: 'That year is already paid.' });

    // What reads it: 200 days on, across a reload, no word from the IRS on 2026 and no levy; a twin left unpaid at the
    // same moment is reminded four times and levied.
    const unpaid = thaw(unfiled());
    const later = reload(sim);
    later.advanceTo(PAY_DAY + 200 * MS_DAY);
    expect(memos(later, /^IRS levy, 2026 return$/)).toEqual([]);
    expect(later.universe.notifications.filter((n) => n.at > PAY_DAY && n.body.includes('on your 2026 return'))).toEqual([]);
    unpaid.advanceTo(PAY_DAY + 200 * MS_DAY);
    expect(['A Reminder From The IRS', 'A Second Reminder From The IRS', 'The IRS Intends To Levy', 'Final Notice Of Intent To Levy'].map((t) => titled(unpaid, t).length)).toEqual([1, 1, 1, 1]);
    expect(memos(unpaid, /^IRS levy, 2026 return$/).length).toBeGreaterThan(0);
  }, 60_000);

  it('DEFECT: assessed, the IRS charges interest from the due date on the filing addition as on the tax (IRC 6601(e)(2)(B)), a leap year’s days at a 366th: $376.69, which Still Owed, and so Pay in full, carries', () => {
    const sim = thaw(unfiled());
    sim.advanceTo(ASSESSED + MS_MINUTE);
    const r = returnsOf(sim.player)['2026']!;
    // 485 days at 7% a year compounded daily (IRC 6621, 6622) on the tax and on the filing addition, which 6601(e)(2)(B)
    // runs from the return's due date; the paying-late addition only from notice and demand, so none yet. 260 of the
    // days are 2027’s, after 15 April, at a 365th of the rate, and 225 leap-year 2028’s, at a 366th, as the IRS’s
    // 366-day factor tables count them (Rev. Proc. 95-17; Rev. Rul. 2024-11 gives a day at 0.5% as 0.000013661, a 366th):
    // ($165.60 + $165.60) × ((1 + 0.07/365)^260 × (1 + 0.07/366)^225 − 1) = $32.238. Until the third round of
    // 2026-10-13 this held all 485 days over 365, $32.28 and $376.73, as SLATE counted them (defect 55 of that round).
    const interest = Math.round(33_120 * ((1 + 0.07 / 365) ** 260 * (1 + 0.07 / 366) ** 225 - 1));
    expect(interest).toBe(32_24);
    expect(r.parts).toEqual({ tax: 165_60, penalty: 178_85, interest: 32_24 });
    expect(titled(sim, 'The IRS Assessed Your 2026 Return').map((n) => n.body)).toEqual(['You owe $376.69 as the IRS worked it out, and its collection begins. You can still file your own return to replace it.']);
    expect(stillOwed(drawn(sim, PapersWorkspace, 'returns').html)).toBe(376_69);
  }, 60_000);

  /*
   * The assessment is the IRS’s notice and demand for the paying-late addition, sixteen months’ 0.5% of $165.60, $13.25
   * (IRC 6651(a)(2)): interest on it is charged only if it’s unpaid 21 calendar days on, and then from the notice
   * (6601(e)(2)(A)). Ten days on, the rest has drawn ten days of 2028’s 366th on $363.44 ($165.60 + $178.85 − $13.25 +
   * $32.24) and the addition none; thirty days on, all $376.69 has drawn thirty days from the assessment. Both paid in
   * full by Pay with nothing typed, the seventeenth month of paying late begun on the 15th, $0.83 more. Until the third
   * round of 2026-10-13 the addition drew interest from the assessment at once, $378.24 ten days on (loose end L13).
   */
  it('charges no interest on the paying-late addition paid within 21 days of the assessment, and from the assessment on one paid after (IRC 6601(e)(2)(A))', () => {
    const daily = 1 + 0.07 / 366;
    const penalty = 178_85 + 0.005 * 165_60;
    const early = Math.round(165_60 + penalty + 32_24 + (165_60 + 178_85 - 13_25 + 32_24) * (daily ** 10 - 1));
    const late = Math.round(165_60 + penalty + 32_24 + (165_60 + 178_85 + 32_24) * (daily ** 30 - 1));
    expect([early, late]).toEqual([378_21, 379_69]);
    for (const [days, owed] of [[10, early], [30, late]] as const) {
      const sim = thaw(unfiled());
      sim.advanceTo(ASSESSED + days * MS_DAY);
      const r = returnsOf(sim.player)['2026']!;
      expect(stillOwed(drawn(sim, PapersWorkspace, 'returns').html)).toBe(owed);
      const paid = drawn(sim, PapersWorkspace, 'returns').press('Pay');
      expect(paid.toasts).toEqual(['Paid the IRS in full.']);
      expect(paid.result).toMatchObject({ ok: true, value: { paid: owed, tax: 165_60, penalty: Math.round(penalty) } });
      expect(r.owed).toBeUndefined();
    }
  }, 60_000);
});

// ---------------------------------------------------------------------------

/**
 * An F-1 student born in London played three years to the edge of her OPT window, Monday 5 March 2029 at 10 AM: the work
 * done and the life kept rested (TEST SETUP), the School's evaluations, terms and Commencement all its own.
 */
const toMarch2029 = once(() => {
  const sim = working(student('b06-grad', 'uk-eng-london'));
  tend(sim, Date.UTC(2029, 2, 5, 15));
  expect(sim.player.school).toMatchObject({ standing: 'good', termsBegun: 6 });
  return freeze(sim);
});
/** Commencement, Monday 21 May 2029 at 10 AM; the program's end, 31 May at noon UTC, its F-1 end less sixty days. */
const COMMENCEMENT = Date.UTC(2029, 4, 21, 14);
const PROGRAM_END = Date.UTC(2029, 4, 31, 12);

describe('documents.permission', () => {
  it('PLAYER JOURNEY: a student the clock graduates applies for OPT on Papers before Commencement; the degree moves the look at her status; decided 3 June, valid twelve calendar months, said with both dates; ended by ninety days without work', () => {
    const sim = working(thaw(toMarch2029()));
    // Nothing set by hand about her school: three years played, in good standing, the degree still to come.
    expect(f1Of(sim.player)!.status).toBe('valid');
    const armed = pendingOf(sim, 'documents.us_status');
    expect(armed.map((i) => i.at)).toEqual([PROGRAM_END]);
    const pane = drawn(sim, WorkPane);
    expect(pane.text).toContain('Your Program Ends May 31, 2029');
    expect(pane.button('Apply For OPT').disabled).toBe(false);
    const before = current(sim).balance;
    // USCIS's online fee for Form I-765, $470; ninety days to a decision.
    expect(pane.press('Apply For OPT').toasts).toEqual(['Applied for OPT and paid $470.00. It’s decided by June 3, 2029.']);
    expect(before - current(sim).balance).toBe(470_00);

    // Commencement, by the clock: the degree, and with it the look at her status rescheduled, still at the program's end.
    tend(sim, COMMENCEMENT + MS_HOUR);
    expect(sim.player.school).toMatchObject({ standing: 'graduated', endedAt: COMMENCEMENT });
    expect(titled(sim, 'Your MFA Is Conferred').map((n) => n.at)).toEqual([COMMENCEMENT]);
    expect(sim.universe.scheduled.find((i) => i.id === armed[0]!.id)).toMatchObject({ status: 'cancelled', resolvedAt: COMMENCEMENT });
    const moved = pendingOf(sim, 'documents.us_status');
    expect(moved.map((i) => i.at)).toEqual([PROGRAM_END]);
    expect(moved[0]!.id).not.toBe(armed[0]!.id);

    // Decided on its ninetieth day, after the program's end: twelve calendar months from the approval.
    const later = reload(sim);
    later.advanceTo(Date.UTC(2029, 5, 3, 16));
    const opt = documentsOf(later.player).find((d) => d.kind === 'permit')!;
    expect(opt).toMatchObject({ status: 'valid', issuedAt: Date.UTC(2029, 5, 3, 15), expiresAt: Date.UTC(2030, 5, 3, 15), idleDays: 0 });
    expect(titled(later, 'OPT Approved').map((n) => n.body)).toEqual(['You may work in the United States from June 3, 2029 to June 3, 2030. Each day of professional work you’re booked for counts as a day worked, and OPT ends once you’ve had more than 90 days without work in total.']);
    // The pending application held her status at the program's end: no "Your US Status Is Ending".
    expect(Object.values(later.universe.decisions).filter((d) => d.title === 'Your US Status Is Ending')).toEqual([]);
    expect(pendingOf(later, 'documents.us_status').map((i) => i.at)).toEqual([Date.UTC(2030, 5, 3, 15)]);
    // Papers gives the status’s end as the day the OPT’s days without work will end it: thirteen weeks of them counted
    // from 3 June, 91 days, past its 90, 2 September, with no grace after. Until 2026-10-13 it gave the expiry’s sixty
    // days on, 2 August 2030, which no played OPT reaches (found by that day’s third round; this failed before the fix).
    const status = drawn(later, WorkPane);
    expect(status.text).toContain('Your US Status Ends September 2, 2029 When your OPT’s 90 days without work run out. There’s no grace period after it, and staying past it puts you out of status');
    expect(status.text).not.toContain('August 2, 2030');
    // Past the degree’s own sixty days, 30 July, still in status, and Papers says the same day; ended on its 91st day
    // without work, 2 September, the day Papers gave.
    later.advanceTo(Date.UTC(2029, 7, 1, 16));
    expect(later.player.usOutOfStatus).toBeUndefined();
    expect(drawn(later, WorkPane).text).toContain('Your US Status Ends September 2, 2029');
    later.advanceTo(Date.UTC(2029, 8, 2, 16));
    expect(opt).toMatchObject({ status: 'cancelled', idleDays: 91, endedAt: Date.UTC(2029, 8, 2, 15) });
    expect(later.player.usOutOfStatus).toBe(Date.UTC(2029, 8, 2, 15));
    expect(drawn(later, WorkPane).text).toContain('Your US Status Out Of Status Since September 2, 2029');
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('documents.us_status', () => {
  it('PLAYER JOURNEY: the degree the clock confers moves the look; on the program’s end she is asked “Your US Status Is Ending”, out of status sixty days on, and her marketplace plan ends with the month, where a twin who applies for OPT from the decision keeps hers', () => {
    const sim = working(thaw(toMarch2029()));
    const armed = pendingOf(sim, 'documents.us_status')[0]!;
    tend(sim, Date.UTC(2029, 4, 22, 16));
    expect(sim.player.school).toMatchObject({ standing: 'graduated', endedAt: COMMENCEMENT });
    const look = pendingOf(sim, 'documents.us_status');
    expect(look.map((i) => [i.at, i.id === armed.id])).toEqual([[PROGRAM_END, false]]);
    // TEST SETUP: a month's pay in May, $6,000, over Covered Connecticut's 175% of the poverty line, which no played F-1
    // life's month reaches; so the plan she can buy is the marketplace's.
    paidWages(sim, 6_000_00);

    sim.advanceTo(PROGRAM_END + MS_HOUR);
    const ending = openDecisions(sim).filter((d) => d.title === 'Your US Status Is Ending');
    expect(ending.map((d) => [d.dueAt, d.actions.map((a) => a.label)])).toEqual([[Date.UTC(2029, 6, 30, 12), ['Apply For OPT', 'Apply For OPT, Premium Processing']]]);
    // Within sixty days of Yale Health's end, 31 July: a marketplace plan from 1 August.
    sim.advanceTo(on(2029, 6, 3));
    expect(run(sim, 'health.enroll')).toMatchObject({ ok: true, value: { kind: 'marketplace', from: on(2029, 8, 1, 0) } });
    const twin = reload(sim);
    expect(run(twin, 'world.take_decision_action', { decisionId: ending[0]!.id, actionIndex: 0 }).ok).toBe(true);

    sim.advanceTo(Date.UTC(2029, 6, 30, 11));
    expect(sim.player.usOutOfStatus).toBeUndefined();
    sim.advanceTo(on(2029, 8, 2));
    expect(sim.player.usOutOfStatus).toBe(Date.UTC(2029, 6, 30, 12));
    expect(f1Of(sim.player)!.status).toBe('cancelled');
    expect(titled(sim, 'Out Of Status').map((n) => n.at)).toEqual([Date.UTC(2029, 6, 30, 12)]);
    // The month's look at her cover, half past midnight on 1 August: the plan ends there.
    const ended = on(2029, 8, 1, 0, 30);
    expect(titled(sim, 'Your Marketplace Plan Has Ended').map((n) => [n.at, n.body])).toEqual([[ended, 'The marketplace is only for citizens and people lawfully present, and you’re out of status.']]);
    expect(healthOf(sim.player).marketplace).toMatchObject({ from: on(2029, 8, 1, 0), until: ended });
    // Change the input: the twin's OPT application holds her status, and her plan runs on.
    twin.advanceTo(on(2029, 8, 2));
    expect(twin.player.usOutOfStatus).toBeUndefined();
    expect(titled(twin, 'Your Marketplace Plan Has Ended')).toEqual([]);
    expect(healthOf(twin.player).marketplace!.until).toBeUndefined();
  }, 60_000);

  // Until 2026-10-13 this held Covered Connecticut to its renewal out of status: covering her from 1 April, six weeks after
  // her status ended, to 1 October, when it ended saying she had stayed past her status. Out of status it ends with the
  // month, as a marketplace plan does, and one enrolled in ahead never begins (found by that day’s third round).
  // From 2026-10-15 Covered Connecticut isn't hers in 2027 at all: the premium tax credit it comes with is a citizen's or
  // a green card holder's from then (`creditAllowed`), so she takes the marketplace in her fifteen days, and it's the
  // plan enrolled in ahead that never begins. Covered Connecticut enrolled in ahead and ended out of status is reached
  // only in 2026, by an F-1 student with a month's income over the poverty line (tests/scope-cover.test.ts).
  it('DEFECT: the marketplace, taken in her fifteen days with Covered Connecticut not hers in 2027, never begins once she is out of status: the month’s look ends it before its 1 April and says so, the notice when her cover ends offers her no marketplace, and no premium is ever taken', () => {
    const sim = student('b06-cct', 'uk-eng-london');
    sim.advanceTo(Date.UTC(2027, 1, 1, 16));
    expect(run(sim, 'school.withdraw', { confirm: true }).ok).toBe(true);
    sim.advanceTo(Date.UTC(2027, 1, 15, 16));
    // In status: the marketplace, from 1 April, the first of the month after Yale Health's thirty days.
    expect(run(sim, 'health.enroll')).toMatchObject({ ok: true, value: { kind: 'marketplace', from: on(2027, 4, 1, 0) } });
    expect(healthOf(sim.player).marketplace).toEqual({ from: on(2027, 4, 1, 0), state: 'ct' });
    expect(healthOf(sim.player).program).toBeUndefined();
    // Unemployment refuses her the same in status as out of it: it's the permit she lacks (no played life holds OPT out of status).
    const refusal = 'Unemployment pays a noncitizen only with permission to work in the US, such as OPT (FUTA 3304(a)(14)).';
    expect(run(sim, 'benefits.claim')).toMatchObject({ ok: false, error: refusal });
    sim.advanceTo(Date.UTC(2027, 1, 17, 16));
    expect(sim.player.usOutOfStatus).toBe(Date.UTC(2027, 1, 16, 16));
    expect(run(sim, 'benefits.claim')).toMatchObject({ ok: false, error: refusal });

    // The month’s look, half past midnight on 1 March: out of status, the cover enrolled for 1 April ends before it begins.
    sim.advanceTo(on(2027, 3, 2));
    const looked = on(2027, 3, 1, 0, 30);
    expect(titled(sim, 'Your Marketplace Plan Won’t Begin').map((n) => [n.at, n.body])).toEqual([[looked, 'The marketplace is only for citizens and people lawfully present, and you’re out of status.']]);
    expect(healthOf(sim.player).marketplace).toMatchObject({ from: on(2027, 4, 1, 0), until: looked });
    // Yale Health’s thirty days ran to 3 March; the 1 April look finds nothing covers her, says she’s been uncovered from
    // 3 March, and doesn’t offer the marketplace. Until 2026-10-14 the notice said “from April 1, 2027”, the look’s day,
    // and this test asserted it (found by that day’s third round of evidence).
    sim.advanceTo(on(2027, 4, 2));
    expect(titled(sim, 'Your Health Cover Ended').map((n) => [n.at, n.body])).toEqual([[on(2027, 4, 1, 0, 30), 'You have no health cover from March 3, 2027. You’re out of status, so neither the marketplace nor Covered Connecticut will take you.']]);
    expect(run(sim, 'health.enroll')).toMatchObject({ ok: false, error: 'The marketplace is only for citizens and people lawfully present, and you’re out of status.' });
    // Nothing is taken for it on 1 April or after: no premium, no notice that it ended, and the end stays the March look’s.
    sim.advanceTo(on(2027, 10, 2));
    expect(healthOf(sim.player).premiums['2027'] ?? []).toEqual([]);
    expect(titled(sim, 'Your Marketplace Plan Has Ended')).toEqual([]);
    expect(healthOf(sim.player).marketplace!.until).toBe(looked);
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('benefits.assistance_month', () => {
  /**
   * A graduate of the spring of 2027, a citizen, with a summer's stipend, on a Connecticut claim of $93 a week from
   * 3 January 2028, as the first round's. TEST SETUP: the degree conferred, and the Summer Cabaret's thirteen Fridays on
   * the earnings record.
   */
  const claimant = once(() => {
    const sim = student('b06-snap');
    sim.advanceTo(Date.UTC(2027, 4, 24, 16));
    Object.assign(sim.player.school!, { standing: 'graduated', endedAt: sim.now });
    recordWages(sim.player, Date.UTC(2027, 5, 25, 21), NY, { gross: 4 * 375_00, employer: 'yale-summer-cabaret' });
    recordWages(sim.player, Date.UTC(2027, 7, 20, 21), NY, { gross: 9 * 375_00, employer: 'yale-summer-cabaret' });
    sim.advanceTo(Date.UTC(2028, 0, 3, 17));
    expect(run(sim, 'benefits.claim')).toMatchObject({ ok: true, value: { weekly: 93_00 } });
    return freeze(sim);
  });

  /** The same graduate with no claim filed: the change of input that SNAP’s time limit turns on. */
  const noClaim = once(() => {
    const sim = student('b06-snap');
    sim.advanceTo(Date.UTC(2027, 4, 24, 16));
    Object.assign(sim.player.school!, { standing: 'graduated', endedAt: sim.now });
    sim.advanceTo(Date.UTC(2028, 0, 3, 17));
    return freeze(sim);
  });

  // Until 2026-10-13 this held the claimant to the time limit, three months counted and the fourth refused “SNAP Time
  // Limit Reached” on 8 May 2028, and held the months to the cent: $258.45, $258.52, $258.45. Somebody receiving
  // unemployment is exempt from work registration and so from the time limit (7 CFR 273.7(b)(1)(v), 273.24(c)), and
  // the 30% is rounded up to the dollar (273.10(e)(2)(ii)(A)); both failed before the third round’s fixes of that day.
  it('PLAYER JOURNEY: a graduate on unemployment is paid $306 less 30% of four Sundays’ $372 and the month’s interest over $217, rounded up to the dollar, in literal figures; her claim exempts her from the time limit, so the fourth month is paid where a twin with no claim is cut off; the card holds what was paid less what the groceries took', () => {
    const sim = thaw(claimant());
    sim.advanceTo(Date.UTC(2028, 1, 1, 17));
    expect(run(sim, 'benefits.assistance')).toMatchObject({ ok: true, value: { scheme: 'snap', firstPaymentAt: Date.UTC(2028, 1, 8, 17) } });
    sim.advanceTo(Date.UTC(2028, 4, 8, 18));
    // January, February and March 2028 each had four Sundays at $93, and April five; and the bank’s interest: $3.51,
    // $3.28, $3.51, $3.39 (April's $3.40 until brief 21, 2026-10-22, when Chase's 0.01% APY came to be worked from its
    // nominal rate, 12 × (1.0001^(1/12) − 1), a twenty-thousandth less).
    expect(['2028-01', '2028-02', '2028-03', '2028-04'].map((m) => ledgerMonth(sim, m))).toEqual([
      { ui: 372_00, interest: 3_51, workStudy: 0, wages: 0 },
      { ui: 372_00, interest: 3_28, workStudy: 0, wages: 0 },
      { ui: 372_00, interest: 3_51, workStudy: 0, wages: 0 },
      { ui: 465_00, interest: 3_39, workStudy: 0, wages: 0 },
    ]);
    // FY2027 (USDA, from 1 October 2026): $306 less 30% of the month’s income over the $217 standard deduction, all of it
    // unearned, the 30% rounded up to the dollar. January’s: 30% × ($375.51 − $217) = $47.553, so $48, and $258;
    // February’s: 30% × $158.28 = $47.484, so $48, and $258; March’s as January’s; April’s: 30% × ($468.39 − $217) =
    // $75.417, so $76, and $230.
    const paid = memos(sim, /^SNAP, the month/);
    expect(paid.map((t) => [t.at, own(sim, t)[0]!.amount])).toEqual([[Date.UTC(2028, 1, 8, 17), 258_00], [Date.UTC(2028, 2, 9, 17), 258_00], [Date.UTC(2028, 3, 8, 17), 258_00], [Date.UTC(2028, 4, 8, 17), 230_00]]);
    // Said each time; a notice in the same words while the last is unread is brought up to now, not said twice.
    expect(titled(sim, 'SNAP Paid').map((n) => [n.at, n.body])).toEqual([[Date.UTC(2028, 3, 8, 17), '$258.00 for the month.'], [Date.UTC(2028, 4, 8, 17), '$230.00 for the month.']]);
    // On her claim each month is exempt, so none is counted, and the time limit is never reached.
    expect(sim.player.assistance!.months).toBe(4);
    expect(sim.player.assistance!.counted ?? []).toEqual([]);
    expect(titled(sim, 'SNAP Time Limit Reached')).toEqual([]);
    // The card’s balance is the sum of its postings: what SNAP paid in, less what the midnight groceries drew.
    const card = sim.universe.accounts[sim.player.assistance!.ebtAccountId!]!;
    const eaten = memos(sim, /^Groceries, on the EBT card$/).reduce((s, t) => s - own(sim, t)[0]!.amount, 0);
    expect(eaten).toBeGreaterThan(0);
    expect(card.balance).toBe(3 * 258_00 + 230_00 - eaten);

    // Change the input: the same graduate with no claim. Her months, the bank’s interest alone, are under $217 and pay
    // the $306 maximum; out of school with no claim and no work, each is counted, and the fourth is refused.
    const twin = thaw(noClaim());
    twin.advanceTo(Date.UTC(2028, 1, 1, 17));
    twin.must({ kind: 'benefits.assistance', payload: {} });
    twin.advanceTo(Date.UTC(2028, 4, 8, 18));
    expect(memos(twin, /^SNAP, the month/).map((t) => [t.at, own(twin, t)[0]!.amount])).toEqual([[Date.UTC(2028, 1, 8, 17), 306_00], [Date.UTC(2028, 2, 9, 17), 306_00], [Date.UTC(2028, 3, 8, 17), 306_00]]);
    expect(twin.player.assistance).toMatchObject({ months: 3, counted: ['2028-02', '2028-03', '2028-04'] });
    expect(titled(twin, 'SNAP Time Limit Reached').map((n) => n.at)).toEqual([Date.UTC(2028, 4, 8, 17)]);
    // It says what would lift the limit and she can reach, not work she has no way to take (from 2026-10-17, brief 12).
    expect(titled(twin, 'SNAP Time Limit Reached').map((n) => n.body)).toEqual(['You’ve had three months of SNAP in three years without 80 hours of work a month, so SNAP pays nothing more until an exemption applies, such as studying at least half-time or having an unemployment claim open.']);
  }, 60_000);

  it('DEFECT: a claim made at nine on the evening of 24 January is paid at nine on the 31st, still January in New Haven: it reads December, $306, not January’s weeks, which are the month before only in UTC', () => {
    const sim = thaw(claimant());
    const asked = on(2028, 1, 24, 21);
    sim.advanceTo(asked);
    expect(run(sim, 'benefits.assistance')).toMatchObject({ ok: true, value: { firstPaymentAt: on(2028, 1, 31, 21) } });
    sim.advanceTo(on(2028, 1, 31, 23));
    // December 2027 brought no benefit (the claim was filed on 3 January) and the bank's interest, under $217.
    expect(ledgerMonth(sim, '2027-12')).toMatchObject({ ui: 0, wages: 0, workStudy: 0 });
    expect(ledgerMonth(sim, '2028-01').ui).toBe(372_00);
    expect(memos(sim, /^SNAP, the month/).map((t) => [monthOf(t.at), own(sim, t)[0]!.amount])).toEqual([['2028-01', 306_00]]);
  }, 60_000);

  /** A student born in New York, kept in good standing (TEST SETUP: the work done, rested), on 1 April 2027 in her first spring. */
  const spring = once(() => {
    const sim = working(student('b06-cab'));
    tend(sim, on(2027, 4, 1));
    expect(sim.player.school!.standing).toBe('good');
    return freeze(sim);
  });
  /** The same student in the Summer Cabaret's company, joined on 1 April, played to Saturday 26 June 2027 at noon. */
  const cabaret = once(() => {
    const sim = working(thaw(spring()));
    expect(run(sim, 'school.summer_cabaret').ok).toBe(true);
    tend(sim, on(2027, 6, 26));
    return freeze(sim);
  });

  it('PLAYER JOURNEY: in the Summer Cabaret’s company her Friday stipends are the work that keeps a student’s claim open in the summer; a twin without the company is refused, and her claim isn’t closed through August', () => {
    const sim = working(thaw(cabaret()));
    // Played, not set: $375 each Friday at five from 4 June, the company's first rehearsal week, a week's forty hours.
    const fridays = memos(sim, /^Yale Summer Cabaret stipend, the week$/);
    expect(fridays.map((t) => t.at)).toEqual([on(2027, 6, 4, 17), on(2027, 6, 11, 17), on(2027, 6, 18, 17), on(2027, 6, 25, 17)]);
    expect(yearOf(sim.player, 2027).acting).toBe(4 * 375_00);
    expect(run(sim, 'benefits.assistance')).toMatchObject({ ok: true, value: { scheme: 'snap', firstPaymentAt: on(2027, 7, 3) } });
    // Change the input: the same student without the company, the same day.
    const twin = working(thaw(spring()));
    tend(twin, on(2027, 6, 26));
    expect(memos(twin, /^Yale Summer Cabaret stipend/)).toEqual([]);
    expect(run(twin, 'benefits.assistance')).toMatchObject({ ok: false, error: 'A student in the summer without work-study or 20 hours of work a week isn’t eligible for SNAP (7 CFR 273.5).' });
    // Through the summer the company's hours keep it open: no closure, each month looked at.
    tend(sim, on(2027, 9, 2));
    expect(titled(sim, 'Your SNAP Case Closed')).toEqual([]);
    expect(sim.player.assistance!.closedAt).toBeUndefined();
    expect(pendingOf(sim, 'benefits.assistance_month').map((i) => i.at)).toEqual([on(2027, 10, 1)]);
  }, 60_000);

  it('DEFECT: the months the Cabaret’s wages are read pay a one-person household at least SNAP’s least, $25 in FY2027 (7 U.S.C. 2017(a); USDA’s cost-of-living adjustment of 21 August 2026), not nothing on July’s $1,875 or $11-odd on August’s $1,500', () => {
    const sim = working(thaw(cabaret()));
    sim.must({ kind: 'benefits.assistance', payload: {} });
    tend(sim, on(2027, 9, 2));
    // July's five Fridays, $1,875, and August's four, $1,500, by the ledger; she's eligible each month, gross under
    // Connecticut's 200% of the poverty line and net under 100%: $1,875 − 20% − $217 = $1,283.
    expect(ledgerMonth(sim, '2027-07').wages).toBe(5 * 375_00);
    expect(ledgerMonth(sim, '2027-08').wages).toBe(4 * 375_00);
    // Her 30% formula gives nothing on July ($306 − 30% of $1,283) and $11.10 less 30% of the interest on August
    // ($306 − 30% of $983); a household of one or two that's eligible is paid no less than the least.
    expect(memos(sim, /^SNAP, the month/, on(2027, 7, 4)).map((t) => [t.at, own(sim, t)[0]!.amount])).toEqual([[on(2027, 8, 2), 25_00], [on(2027, 9, 1), 25_00]]);
  }, 60_000);

  it('BC Income Assistance, in Vancouver, where a New Haven life never lives: CAD 560 by the clock into the account, 21 days after applying and every 30 after, refused over CAD 5,000 of assets', () => {
    const sim = elsewhere('b06-bc', 'ca-bc-vancouver', 'nothing');
    const asked = sim.now;
    // A new applicant's three weeks of work search first.
    expect(run(sim, 'benefits.assistance')).toMatchObject({ ok: true, value: { scheme: 'bc-assistance', firstPaymentAt: asked + 21 * MS_DAY } });
    sim.advanceTo(asked + 52 * MS_DAY);
    // A single employable adult's support, CAD 560 (BC's rate table of 1 August 2023); no shelter, since the home went.
    expect(memos(sim, /^Income assistance, the month$/).map((t) => [t.at, own(sim, t)])).toEqual([
      [asked + 21 * MS_DAY, [{ accountId: current(sim).id, amount: 560_00 }]],
      [asked + 51 * MS_DAY, [{ accountId: current(sim).id, amount: 560_00 }]],
    ]);
    expect(sim.player.assistance!.months).toBe(2);
    // Said each month; the same words while the last is unread are brought up to now, not said twice.
    expect(titled(sim, 'Assistance Paid').map((n) => [n.at, n.body])).toEqual([[asked + 51 * MS_DAY, 'C$560.00 for the month.']]);
    expect(run(elsewhere('b06-bc-rich', 'ca-bc-vancouver'), 'benefits.assistance')).toMatchObject({ ok: false, error: 'Income assistance asks for assets under CAD 5,000.' });
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('tax.due', () => {
  /** 11:59 PM on Thursday 15 April 2027, Eastern Daylight Time: the 2026 return's due date. */
  const DUE_2026 = Date.UTC(2027, 3, 16, 3, 59);
  const LATE = 'Your 2026 Return Is Late';

  it('a return owed to New York and Connecticut, with the IRS’s part over $535, is told the $535 least and that both states charge their own, and each state’s letters and the IRS’s substitute are set (a New York quickSave life with work in New Haven)', () => {
    const sim = elsewhere('b06-due-two');
    // TEST SETUP: a year's wages earned in New Haven by a New Yorker, as payroll records them, nothing withheld.
    recordWages(sim.player, on(2026, 5, 1, 9), NY, { gross: 60_000_00, where: 'us-ct-newhaven' });
    play(sim, on(2027, 4, 17));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.owedTo!.irs).toBeGreaterThan(535_00);
    expect(Object.keys(r.figures.owedTo!.states).sort()).toEqual(['us-ct', 'us-ny']);
    // Past 60 days, at least the lesser of $535 and the tax (IRC 6651(a); $535 for returns required to be filed in 2027,
    // Rev. Proc. 2025-32).
    expect(titled(sim, LATE).map((n) => [n.at, n.body])).toEqual([[DUE_2026, 'Each month it’s late adds 5% of what you owe the IRS, up to a quarter of it, and after 60 days the penalty is at least $535.00. New York and Connecticut each charge their own penalty on what you owe them. File it on Papers, under Tax Returns.']]);
    expect(pendingOf(sim, TAX_SFR_KIND).map((i) => i.at)).toEqual([DUE_2026 + 365 * MS_DAY]);
    expect(pendingOf(sim, STATE_NONFILER_KIND).map((i) => i.payload.state).sort()).toEqual(['us-ct', 'us-ny']);
  }, 60_000);

  it('the IRS owed exactly nothing is told so, with New York’s own; owed $1,000, told the $535 least and charged $550 filed seventy days late (New York quickSave lives)', () => {
    const wages = (seed: string, withheld: number) => {
      const sim = elsewhere(seed);
      // TEST SETUP: a year's wages, as payroll records them, with all that was withheld the IRS's.
      recordWages(sim.player, on(2026, 5, 1, 9), NY, { gross: 20_000_00, withheld });
      return sim;
    };
    // The IRS's part with nothing withheld, from a first life; withholding comes off it cent for cent.
    const first = wages('b06-due-irs', 0);
    play(first, on(2027, 2, 2));
    const owed = returnsOf(first.player)['2026']!.figures.owedTo!.irs;
    expect(owed).toBeGreaterThan(1_000_00);

    const none = wages('b06-due-irs', owed);
    play(none, on(2027, 4, 17));
    const r0 = returnsOf(none.player)['2026']!;
    expect(r0.figures.owedTo!.irs).toBe(0);
    expect(r0.figures.owedTo!.states['us-ny']).toBeGreaterThan(0);
    expect(titled(none, LATE).map((n) => n.body)).toEqual(['You owe the IRS nothing on it. New York charges its own penalty on what you owe it. File it on Papers, under Tax Returns.']);
    expect(pendingOf(none, TAX_SFR_KIND)).toEqual([]);
    expect(pendingOf(none, STATE_NONFILER_KIND).map((i) => i.payload.state)).toEqual(['us-ny']);

    const some = wages('b06-due-irs', owed - 1_000_00);
    play(some, on(2027, 4, 17));
    const r = returnsOf(some.player)['2026']!;
    expect(r.figures.owedTo!.irs).toBe(1_000_00);
    expect(titled(some, LATE).map((n) => n.body)).toEqual(['Each month it’s late adds 5% of what you owe the IRS, up to a quarter of it, and after 60 days the penalty is at least $535.00. New York charges its own penalty on what you owe it. File it on Papers, under Tax Returns.']);
    // Filed seventy days late: three months begun. Paying late, 1.5% of $1,000 = $15; filing late, three months' 4.5%,
    // $135, or past 60 days the lesser of $535 and the $1,000, so $535: $550.
    play(some, DUE_2026 + 70 * MS_DAY);
    expect(run(some, 'tax.file', { year: 2026 }).ok).toBe(true);
    expect(r.penalty).toBe(550_00);
  }, 60_000);

  it('PLAYER JOURNEY: a return due a refund left unfiled is told the refund waits, and in the year and a day after its due date nothing of the IRS’s or a state’s is ever put on the calendar for it, pending or done', () => {
    const sim = student('b06-due-refund');
    // TEST SETUP: $120 withheld from $1,000 of work-study, as Yale's payroll records a W-4's withholding.
    recordWages(sim.player, on(2026, 10, 1, 9), NY, { gross: 1_000_00, withheld: 120_00, workStudy: true, employer: 'yale-payroll' });
    sim.advanceTo(on(2027, 4, 16));
    expect(returnsOf(sim.player)['2026']!.figures.owedTo).toEqual({ irs: -120_00, states: {} });
    expect(titled(sim, LATE).map((n) => [n.at, n.body])).toEqual([[DUE_2026, 'Your refund waits until you file it. There’s no penalty when you’re due a refund.']]);
    const again = reload(sim);
    again.advanceTo(DUE_2026 + 366 * MS_DAY);
    // Done items are kept 400 days: one set at the year and run would still be here.
    const ever = (kind: string) => again.universe.scheduled.filter((i) => i.kind === kind && i.payload.personId === again.player.id && i.payload.year === 2026);
    expect(ever(TAX_SFR_KIND)).toEqual([]);
    expect(ever(STATE_NONFILER_KIND)).toEqual([]);
    const still = returnsOf(again.player)['2026']!;
    expect([still.filedAt, still.substitute, still.owed]).toEqual([undefined, undefined, undefined]);
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('documents.apply_ssn', () => {
  it('Discover reads the number: with it and a month’s wages past $25,000 a year it lends $2,500 over 36 months at $78.33; her twin without it is refused for want of it; no played life’s wages reach that line', () => {
    const borrow = (sim: Simulation) => run(sim, 'bank.borrow', { amount: 2_500_00, months: 36, bankId: 'us-capital-one' });
    const loans = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && a.kind === 'loan');
    const held = student('b06-ssn-loan', 'uk-eng-london');
    held.advanceTo(on(2026, 8, 30, 12));
    const card = held.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    held.advanceTo(card.arrivesAt + MS_MINUTE);
    expect(hasSsn(held.player)).toBe(true);
    // Played: her wages are work-study's, under the line; the number lets her past its first ask and no further.
    expect(borrow(held)).toMatchObject({ ok: false, error: 'Discover Personal Loans lends on $25,000 a year of income or more, and the last 30 days’ wages come to less than that over a year.' });
    // TEST SETUP: a month's wages of $2,100, a year of them $25,200, which no played life earns (the Summer Cabaret's
    // most in thirty days is five Fridays, $1,875).
    paidWages(held, 2_100_00);
    const into = current(held).balance;
    // Discover's lowest published APR, 7.99%, where SLATE puts a record of 780 or more; repaid in equal months:
    // $2,500 × r ÷ (1 − (1 + r)^−36), r = 7.99% ÷ 12, $78.329, to the cent above.
    const r = 0.0799 / 12;
    expect(Math.ceil(2_500_00 * r / (1 - (1 + r) ** -36))).toBe(78_33);
    expect(borrow(held)).toMatchObject({ ok: true, value: { apr: 0.0799, payment: 78_33 } });
    expect(loans(held).map((a) => [a.balance, a.loanMonths])).toEqual([[-2_500_00, 36]]);
    expect(current(held).balance - into).toBe(2_500_00);

    // Change the input: the same life that never applied, the same pay, the same day.
    const without = student('b06-ssn-loan', 'uk-eng-london');
    without.advanceTo(card.arrivesAt + MS_MINUTE);
    expect(hasSsn(without.player)).toBe(false);
    paidWages(without, 2_100_00);
    expect(borrow(without)).toMatchObject({ ok: false, error: 'Discover Personal Loans asks for a Social Security number.' });
    expect(loans(without)).toEqual([]);
  }, 60_000);

  // Until 2026-10-13 a test here moved her to New York by hand to reach “The Social Security office is in New Haven, at 150
  // Court Street.”, which went that day: nothing in play moves her since travel went.
});
