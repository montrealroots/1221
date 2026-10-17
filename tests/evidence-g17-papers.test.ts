/**
 * Evidence for five papers rows the review of 2026-10-13 left partial (verification group g17-papers): a return's due
 * date passing unfiled (`tax.due`), the IRS's substitute for it (`tax.substitute`), the IRS's collection on a balance
 * owed (`tax.notice`), its payment plan (`tax.apply_plan`) and an F-1 student's Social Security number
 * (`documents.apply_ssn`). Each row's gaps are closed here through the command its screen sends and the clock, and each
 * consequence is read where the row says it's read, against figures worked out from the rule's own numbers (IRC 6651's
 * 5% and half a point a month, the $525 least past 60 days, the IRS's 7% a year compounded daily, the plan's quarter
 * point, the card's 21 days), never from the helper the engine computes them with.
 *
 * - `tax.due`: the review found the late notice told a domestic student's $0 return that a refund waited, and told an
 *   F-1 student owing $165.60 the least was $525.00; both were fixed on 2026-10-13 (the filing threshold, and the lesser
 *   of $525 and what's owed). Held here: the New York-born student has no return and nothing late; the F-1 student's
 *   notice gives $165.60, a $90,000 return's gives $535.00 (2027's least, Rev. Proc. 2025-32; $525.00, 2026's, until
 *   later on 2026-10-13); a return due a refund is told it waits, and nothing of the
 *   IRS's or a state's follows a year and a day on; an Oregon return gets the IRS's substitute, Oregon's demand and its
 *   three-year check on the calendar at the due date, and a twin filed in time none; once, across a reload.
 * - `tax.substitute`: the F-1 student’s 1040-NR left unfiled, played: CP2566 a year after the due date for $365.13, the
 *   $165.60 with twelve months’ penalty and a year’s interest on the tax and the filing share; assessed 120 days on in its
 *   parts ($165.60, $178.85, $32.24; $353.15 and $16.14 until later on 2026-10-13, interest on the tax alone; $365.15
 *   and $32.28 until the third round of that day, a leap year’s days counted over 365),
 *   collected from the 35th day; Papers says the IRS filed it. The premium tax credit only their own return claims left
 *   out of the IRS's figures (`sfrFigures`), run through the clock. A save from before, holding the unfiled return with
 *   no substitute on the calendar, has it put there on opening, at the year or a day on, never twice.
 * - `tax.notice`: the four notices on the 35th, 70th, 105th and 140th days after filing on the due day (from 2026-10-16
 *   each at the due date's minute: until then the return was filed on 1 February and they ran from it), the levy on
 *   the 170th; a levy that finds $500 takes $500, to the tax, says what's still owed and comes again 91 days on; one that finds nothing
 *   posts nothing and says $0.00 was taken. That last was the review's open question: the IRS's notice of levy (Form
 *   668-A) is served on the bank whatever the account holds, and the taxpayer is sent a copy, so a notice that says what
 *   it took, nothing, is kept as right.
 * - `tax.apply_plan`: Apply on Papers' IRS Payment Plan, pressed, its toast and the panel through the decision; a month
 *   begun under a plan charged the quarter point exactly, where the twin without one is charged the half; an amended
 *   return's tax that adds two payments or less joins the plan, where its twin past two is CP523; and the F-1 student's
 *   own reach, a 1040-NR filed with the bank empty, by Form 9465 in 30 days.
 * - `documents.apply_ssn`: Papers' Social Security Number panel from Not yet to Held, an hour at the office and the card
 *   21 days on; then what reads the number: Wells Fargo opens online with no branch hour, a 1040-NR's refund comes in
 *   21 days with no W-7's seven weeks, and the IRS plan is applied for online and answered in a minute. Refused for a
 *   Call within the hour, a hospital bed and a passport reported lost, in their words. The office's New Haven check
 *   isn't played: nothing in the engine writes where a person is, so only a fixture would reach it. Discover's loan,
 *   which the row named as a consumer, changes only which refusal it gives a student: its $25,000 of income refuses
 *   her with the number or without, so the row's claim is corrected rather than verified.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven from Monday 24
 * August 2026, born in New York (a citizen) or in London (on an F-1), played on the clock (`advanceTo`), never by calling
 * a handler. A balance the student's life never reaches ($90,000 or $60,000 of wages, a return in Oregon) is played on a
 * `quickSave` life in New York or Portland, and said so where it's made. The screens are rendered as the player has them
 * (react-dom/server) with `useGame`'s `run` as the save's own `execute`; a pressed button is the component's own onClick.
 *
 * TEST SETUP, said again where it's done: a year's wages recorded as payroll records them, where the life has none of its
 * own; a year's marketplace premiums recorded as the premium's payment records them; balances emptied or set by a
 * posting against a test line; the substitute's calendar item canceled, as a save from before 2026-09-28 never had one;
 * a corrected W-2's wages added before an amended return; a hospital stay begun through `careFor`, as the week's draw
 * admits one.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, MS_MINUTE, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { earningsOf, recordWages, yearOf } from '@/engine/systems/earnings';
import { careFor, healthOf } from '@/engine/systems/health';
import { STATE_NONFILER_KIND, THREE_YEAR_KIND, rulesOf, stateLateAt } from '@/engine/systems/statetax';
import { TAX_NOTICE_KIND, TAX_PLAN_DEFAULT_KIND, TAX_SFR_KIND, latePenalty, latePenaltyAll, owedOn, partsOn, returnsOf } from '@/engine/systems/taxreturn';
import { SSN_ARRIVES_KIND, hasSsn } from '@/engine/systems/taxid';
import { documentsOf } from '@/engine/systems/documents';
import { registered } from '@/engine/systems/school';
import { courseworkOf } from '@/engine/systems/coursework';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  toasts: [] as string[],
  tabs: {} as Record<string, string>,
}));

/** Every button the screens draw, with its words, whether it's grayed out, and its own onClick. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepButtons = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, onClick: props.onClick as (() => void) | undefined });
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

// Without the original: it imports the looks, which import it back. Nothing is standing at a stop.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { WorkPane } = await import('@/ui/papers/Documents');

// ---------------------------------------------------------------------------
// Lives, money, and the screens over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
/** Noon, or the hour given, of a day on New Haven's clock. */
const on = (year: number, month: number, day: number, hour = 12, minute = 0): number => instantFromZoned({ year, month, day, hour, minute }, NY);
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** The same life born in London: at Yale on an F-1, a nonresident alien for US tax. */
const international = (seed: string): Simulation => student(seed, { homeRegionId: 'uk-eng-london' });
/** A life in a city a New Haven student's never reaches, or at a balance hers never does: a `quickSave` life there. */
const elsewhere = (seed: string, cityId = 'us-ny-newyork'): Simulation => quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** What's on the calendar of a kind for the player, of a return's year where one is named. */
const pending = (sim: Simulation, kind: string, year?: number) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id && (year === undefined || i.payload.year === year));
const memos = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo);
/** Dollars and cents, as the screens write them: worked out here, not by the engine's formatter. */
const usd = (cents: number): string => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/**
 * The IRS’s interest, 7% a year compounded daily (IRC 6621, 6622; the fourth quarter of 2026’s rate), on an amount for
 * days of an ordinary year and days of a leap year, a 366th of the rate a day in a leap year as the IRS’s 366-day factor
 * tables give it (Rev. Proc. 95-17; Rev. Rul. 2024-11’s factor for a day at 0.5%, 0.000013661). Until the third round
 * of 2026-10-13 every day here was a 365th, as SLATE counted them until then.
 */
const interestOn = (amount: number, days: number, leapDays = 0): number => amount * ((1 + 0.07 / 365) ** days * (1 + 0.07 / 366) ** leapDays - 1);
/** Six hours a step, the stops a player would answer passed by. */
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };

/** TEST SETUP: an account's balance set, against a test equity line. */
function setBalance(sim: Simulation, accountId: string, to: number): void {
  const by = to - sim.universe.accounts[accountId]!.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/** TEST SETUP: every current and savings account of theirs with money in it emptied. */
function emptyBank(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) setBalance(sim, a.id, 0);
}
/** TEST SETUP: money put in the current account. */
const fund = (sim: Simulation, amount: number) => setBalance(sim, sim.player.primaryAccountId!, sim.universe.accounts[sim.player.primaryAccountId!]!.balance + amount);

/** What the player reads: the markup with every title attribute taken out, then every tag. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** A screen as the player has it. */
function drawn(sim: Simulation, screen: FunctionComponent, tabs: Record<string, string> = {}) {
  h.sim = sim;
  h.buttons = [];
  h.toasts = [];
  h.tabs = tabs;
  const html = renderToStaticMarkup(createElement(screen));
  const buttons = [...h.buttons];
  const button = (words: string) => buttons.find((x) => x.text === words);
  const press = (words: string) => {
    const b = button(words);
    expect(b, `a button reading “${words}”`).toBeDefined();
    h.toasts = [];
    b!.onClick!();
    return [...h.toasts];
  };
  return { html, text: onScreen(html), buttons, button, press, has: (words: string) => buttons.some((x) => x.text === words) };
}

/**
 * The F-1 student's first February: her 2026 return, a 1040-NR, raised at nine on 1 February 2027 and the clock at
 * noon. A nonresident takes no standard deduction, so all of her work-study is taxed in the first bracket, at 10%; nothing
 * was withheld from it. Her year's work-study, played, came to $1,656.00 on every seed tried, so she owes $165.60.
 */
function f1February(seed: string): Simulation {
  const sim = international(seed);
  sim.advanceTo(on(2027, 2, 1));
  const r = returnsOf(sim.player)['2026']!;
  expect(r.figures.form).toBe('1040-NR');
  expect(r.figures.income).toBe(1_656_00);
  expect(r.figures.balance).toBe(165_60);
  expect(r.figures.owedTo).toEqual({ irs: 165_60, states: {} });
  return sim;
}

/** 11:59 PM on Thursday 15 April 2027, Eastern Daylight Time (UTC−4): the 2026 return's due date, a business day, Emancipation Day falling on the Friday after it. */
const DUE_2026 = Date.UTC(2027, 3, 16, 3, 59);

// ---------------------------------------------------------------------------

describe('tax.due', () => {
  it('PLAYER JOURNEY: the student born in New York, her work-study under the filing threshold, has no 2026 return: nothing raised, nothing late on 16 April 2027, nothing for the IRS to file', () => {
    const sim = student('g17-due-domestic');
    sim.advanceTo(on(2027, 2, 2));
    // Her year's income: work-study and the banks' interest, more than nothing and far under a single filer's standard
    // deduction ($14,600 for 2024, $16,100 for 2026), with nothing withheld: no return is asked of her.
    const y = earningsOf(sim.player).years[2026]!;
    expect(y.workStudy + (y.interest ?? 0)).toBeGreaterThan(0);
    expect(y.workStudy + (y.interest ?? 0)).toBeLessThan(14_600_00);
    expect(y.withheld).toBe(0);
    expect(returnsOf(sim.player)['2026']).toBeUndefined();
    expect(Object.values(sim.universe.decisions).filter((d) => d.refType === 'return')).toEqual([]);
    const again = reload(sim);
    again.advanceTo(on(2027, 4, 17));
    expect(titled(again, 'Your 2026 Return Is Late')).toEqual([]);
    expect(pending(again, TAX_SFR_KIND)).toEqual([]);
    expect(pending(again, STATE_NONFILER_KIND)).toEqual([]);
  });

  it('PLAYER JOURNEY: the F-1 student’s 1040-NR left unfiled is late at 11:59 PM on 15 April 2027, and the notice gives the least past 60 days as the $165.60 she owes, not $525; the IRS’s substitute is set a year on, once, across a reload', () => {
    const sim = f1February('g17-due-f1');
    const r = returnsOf(sim.player)['2026']!;
    expect(r.due).toBe(DUE_2026);
    sim.advanceTo(DUE_2026 - MS_MINUTE);
    expect(titled(sim, 'Your 2026 Return Is Late')).toEqual([]);
    expect(pending(sim, TAX_SFR_KIND)).toEqual([]);
    sim.advanceTo(on(2027, 4, 16));
    const late = titled(sim, 'Your 2026 Return Is Late');
    expect(late.map((n) => [n.at, n.body])).toEqual([[DUE_2026, 'Each month it’s late adds 5% of what you owe the IRS, up to a quarter of it, and after 60 days the penalty is at least $165.60. File it on Papers, under Tax Returns.']]);
    // The IRS's substitute a year after the due date; no state is owed, so no state's letters.
    const sfr = pending(sim, TAX_SFR_KIND);
    expect(sfr.map((i) => [i.at, i.payload])).toEqual([[DUE_2026 + 365 * MS_DAY, { personId: sim.player.id, year: 2026, step: 'proposed' }]]);
    expect(pending(sim, STATE_NONFILER_KIND)).toEqual([]);
    // Opened again: nothing said twice, nothing set twice.
    const again = reload(sim);
    again.advanceTo(on(2027, 4, 18));
    expect(titled(again, 'Your 2026 Return Is Late')).toHaveLength(1);
    expect(pending(again, TAX_SFR_KIND).map((i) => i.at)).toEqual([DUE_2026 + 365 * MS_DAY]);
  });

  it('a $90,000 return left unfiled is told the $535 least, the lesser of $535 and what it owes (IRC 6651(a), Rev. Proc. 2025-32 for a return due in 2027) being $535 there; a New York quickSave life, since no student owes that much', () => {
    const sim = elsewhere('g17-due-525');
    // TEST SETUP: a year's wages, as payroll records them, with nothing withheld.
    recordWages(sim.player, on(2026, 5, 1, 9), NY, { gross: 90_000_00 });
    play(sim, on(2027, 4, 17));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.owedTo!.irs).toBeGreaterThan(535_00);
    // New York is owed too, and charges its own (from 2026-10-13: until then the notice didn't say so, and took the $525
    // least against the IRS's part and New York's together).
    expect(r.figures.owedTo!.states['us-ny']).toBeGreaterThan(0);
    expect(titled(sim, 'Your 2026 Return Is Late').map((n) => n.body)).toEqual(['Each month it’s late adds 5% of what you owe the IRS, up to a quarter of it, and after 60 days the penalty is at least $535.00. New York charges its own penalty on what you owe it. File it on Papers, under Tax Returns.']);
  });

  it('gives the least past 60 days on the IRS’s part alone where New York’s takes the whole over $535, as latePenalty charges it; a New York quickSave life', () => {
    const sim = elsewhere('g17-due-irs-part');
    // TEST SETUP: a year's wages, as payroll records them, with $1,300 withheld, all of it the IRS's: the IRS is left
    // owed its income tax and the payroll tax not withheld, less that, and New York all of its own.
    recordWages(sim.player, on(2026, 5, 1, 9), NY, { gross: 17_000_00, withheld: 1_300_00 });
    play(sim, on(2027, 4, 17));
    const r = returnsOf(sim.player)['2026']!;
    const irs = r.figures.owedTo!.irs;
    // The IRS's part under $535 and the whole over it: the two readings give different leasts.
    expect(irs).toBeGreaterThan(0);
    expect(irs).toBeLessThan(535_00);
    expect(r.figures.balance).toBeGreaterThan(535_00);
    expect(titled(sim, 'Your 2026 Return Is Late').map((n) => n.body)).toEqual([`Each month it’s late adds 5% of what you owe the IRS, up to a quarter of it, and after 60 days the penalty is at least ${usd(Math.min(535_00, irs))}. New York charges its own penalty on what you owe it. File it on Papers, under Tax Returns.`]);
    // And what filing it late is charged reads the same part: the IRS's at 5 months and over 60 days is 22.5% of it plus
    // a half point a month, or $535, or all of it, whichever is less; filed now, two days late, neither applies yet.
    expect(latePenaltyAll(sim.player, r, on(2027, 4, 17))).toBe(latePenalty(irs, r.due, on(2027, 4, 17)) + stateLateAt(rulesOf('us-ny')!, r.figures.owedTo!.states['us-ny']!, r.due, on(2027, 4, 17), 'USD'));
  });

  it('tells a return the IRS owes a refund on, with New York owed, that the refund waits and New York charges its own; a New York quickSave life', () => {
    const sim = elsewhere('g17-due-irs-refund');
    // TEST SETUP: a year's wages with $3,000 withheld, all of it the IRS's, as a W-4 over-withholding leaves it.
    recordWages(sim.player, on(2026, 5, 1, 9), NY, { gross: 17_000_00, withheld: 3_000_00 });
    play(sim, on(2027, 4, 17));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.owedTo!.irs).toBeLessThan(0);
    expect(r.figures.owedTo!.states['us-ny']).toBeGreaterThan(0);
    expect(titled(sim, 'Your 2026 Return Is Late').map((n) => n.body)).toEqual(['Your IRS refund waits until you file, with no penalty. New York charges its own penalty on what you owe it. File it on Papers, under Tax Returns.']);
    // The IRS sets no substitute on a refund; New York acts on its own part.
    expect(pending(sim, TAX_SFR_KIND, 2026)).toEqual([]);
  });

  it('PLAYER JOURNEY: a return due a refund left unfiled is told the refund waits with no penalty, and a year and a day on the IRS has filed nothing and no state has written', () => {
    const sim = student('g17-due-refund');
    // TEST SETUP: $120 withheld from $1,000 of work-study, as Yale's payroll records a W-4's withholding: her year stays
    // under the threshold, and the $120 comes back only on a return.
    recordWages(sim.player, on(2026, 10, 1, 9), NY, { gross: 1_000_00, withheld: 120_00, workStudy: true, employer: 'yale-payroll' });
    sim.advanceTo(on(2027, 2, 2));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.balance).toBe(-120_00);
    expect(r.figures.owedTo).toEqual({ irs: -120_00, states: {} });
    sim.advanceTo(on(2027, 4, 16));
    expect(titled(sim, 'Your 2026 Return Is Late').map((n) => [n.at, n.body])).toEqual([[DUE_2026, 'Your refund waits until you file it. There’s no penalty when you’re due a refund.']]);
    expect(pending(sim, TAX_SFR_KIND)).toEqual([]);
    expect(pending(sim, STATE_NONFILER_KIND)).toEqual([]);
    const again = reload(sim);
    again.advanceTo(DUE_2026 + 366 * MS_DAY);
    expect(titled(again, 'The IRS Figured Your 2026 Return')).toEqual([]);
    expect(titled(again, 'The IRS Assessed Your 2026 Return')).toEqual([]);
    expect(pending(again, TAX_SFR_KIND, 2026)).toEqual([]);
    expect(pending(again, STATE_NONFILER_KIND, 2026)).toEqual([]);
    const still = returnsOf(again.player)['2026']!;
    expect(still.filedAt).toBeUndefined();
    expect(still.substitute).toBeUndefined();
    expect(still.owed).toBeUndefined();
    expect(still.lettersSent).toBeUndefined();
  });

  it('an Oregon return owing the IRS and Oregon: at the due date the IRS’s substitute a year on, Oregon’s demand a year on and its three-year check at the extended date, 183 days; its twin filed in February, none (a Portland quickSave life: no student lives there)', () => {
    const make = () => {
      const sim = elsewhere('g17-due-oregon', 'us-or-portland');
      // TEST SETUP: a year's wages, as payroll records them, with nothing withheld.
      recordWages(sim.player, on(2026, 5, 1, 9), NY, { gross: 60_000_00 });
      play(sim, on(2027, 2, 2));
      return sim;
    };
    const sim = make();
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.owedTo!.irs).toBeGreaterThan(0);
    expect(r.figures.owedTo!.states['us-or']).toBeGreaterThan(0);
    expect(r.due).toBe(DUE_2026);
    play(sim, DUE_2026 + MS_HOUR);
    expect(pending(sim, TAX_SFR_KIND).map((i) => i.at)).toEqual([DUE_2026 + 365 * MS_DAY]);
    expect(pending(sim, STATE_NONFILER_KIND).map((i) => [i.at, i.payload.state])).toEqual([[DUE_2026 + 365 * MS_DAY, 'us-or']]);
    // Oregon reads its three-year rule at the extended due date, six months on: 6 × 30.4375 days, 182.625, rounded.
    expect(pending(sim, THREE_YEAR_KIND).map((i) => [i.at, i.payload.state])).toEqual([[DUE_2026 + 183 * MS_DAY, 'us-or']]);
    expect(titled(sim, 'Your 2026 Return Is Late')).toHaveLength(1);

    // Change the input: filed in February, the due date passes with none of it.
    const filed = make();
    filed.must({ kind: 'tax.file', payload: { year: 2026 } });
    play(filed, DUE_2026 + MS_HOUR);
    expect(pending(filed, TAX_SFR_KIND)).toEqual([]);
    expect(pending(filed, STATE_NONFILER_KIND)).toEqual([]);
    expect(pending(filed, THREE_YEAR_KIND)).toEqual([]);
    expect(titled(filed, 'Your 2026 Return Is Late')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('tax.substitute', () => {
  it('PLAYER JOURNEY: the F-1 student’s 1040-NR left unfiled: CP2566 a year after the due date for $365.13, assessed 120 days on in its parts, $376.69, and collected from the 35th day; Papers says the IRS filed it', () => {
    const sim = f1February('g17-sfr-f1');
    const r = () => returnsOf(sim.player)['2026']!;
    const proposedAt = DUE_2026 + 365 * MS_DAY;
    sim.advanceTo(proposedAt - MS_MINUTE);
    expect(titled(sim, 'The IRS Figured Your 2026 Return')).toEqual([]);
    sim.advanceTo(proposedAt + MS_MINUTE);
    // A year late: twelve months begun (365 ÷ 30.4375 = 11.99). Paying late, 0.5% a month: 6% of $165.60 = $9.936.
    // Filing late, 4.5% a month to five: 22.5% = $37.26; past 60 days at least the lesser of $535 and the tax, $165.60.
    // So $9.936 + $165.60 = $175.536, $175.54. A year’s interest on the tax and on the filing share, which IRC
    // 6601(e)(2)(B) runs from the due date too: 260 days of 2027 after 15 April and 105 of leap-year 2028, $331.20 ×
    // ((1 + 0.07/365)^260 × (1 + 0.07/366)^105 − 1) = $23.993, $23.99. Until later on 2026-10-13 this held the interest on the tax alone,
    // $12.01, and CP2566 at $353.15; and until the third round of that day all 365 days over 365, $24.01 and $365.15.
    expect(Math.round(0.005 * 12 * 165_60 + Math.max(0.045 * 5 * 165_60, Math.min(535_00, 165_60)))).toBe(175_54);
    expect(Math.round(interestOn(165_60 + 165_60, 260, 105))).toBe(23_99);
    const proposal = titled(sim, 'The IRS Figured Your 2026 Return');
    expect(proposal.map((n) => [n.at, n.body])).toEqual([[proposedAt, 'Notice CP2566: you didn’t file, so the IRS worked out that you owe $365.13 from what your employers and banks reported, including the late-filing penalty and interest. File your own return within 120 days to replace it.']]);
    // A 1040-NR claims no credit the IRS would leave out.
    expect(r().substituteFigures!.balance).toBe(165_60);
    expect(r().filedAt).toBeUndefined();
    const assessedAt = proposedAt + 120 * MS_DAY;
    expect(pending(sim, TAX_SFR_KIND, 2026).map((i) => [i.at, i.payload.step])).toEqual([[assessedAt, 'assessed']]);

    const again = reload(sim);
    again.advanceTo(assessedAt + MS_MINUTE);
    const a = returnsOf(again.player)['2026']!;
    // 485 days late: sixteen months begun (15.93). Paying late, 8% of $165.60 = $13.248; filing late, $165.60 again:
    // $178.848, $178.85. Interest on the tax and the filing share, 260 days of 2027 and 225 of 2028: $331.20 ×
    // ((1 + 0.07/365)^260 × (1 + 0.07/366)^225 − 1) = $32.24 ($16.14 on the tax alone until later on 2026-10-13, and
    // $360.59 owed; $32.28 and $376.73, all 485 days over 365, until the third round of that day).
    expect(Math.round(interestOn(165_60 + 165_60, 260, 225))).toBe(32_24);
    expect(a.substitute).toBe(true);
    expect(a.filedAt).toBe(assessedAt);
    expect(a.penalty).toBe(178_85);
    expect(a.parts).toEqual({ tax: 165_60, penalty: 178_85, interest: 32_24 });
    expect(a.owed).toBe(376_69);
    expect(a.collection).toBe(0);
    expect(titled(again, 'The IRS Assessed Your 2026 Return').map((n) => [n.at, n.body])).toEqual([[assessedAt, 'You owe $376.69 as the IRS worked it out, and its collection begins. You can still file your own return to replace it.']]);
    expect(titled(again, 'The IRS Figured Your 2026 Return')).toHaveLength(1);
    // Collection from its 35th day (`tax.notice`): CP501 for the $376.69 with 35 days more of interest on all of it, the
    // paying-late share’s from the assessment too, as it’s unpaid past 21 days (IRC 6601(e)(2)(A)), at 2028’s 366th; and
    // two more months begun of paying late, 1% of the tax, the late return's 8% already charged with it.
    expect(pending(again, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([assessedAt + 35 * MS_DAY]);
    const papers = drawn(again, PapersWorkspace);
    expect(papers.text).toContain('2026 Return Filed by the IRS August 12, 2028');
    expect(papers.text).toContain('The IRS filed this return for you from what your employers and banks reported. It assessed $165.60 of tax, without the credits only your own return can claim. If you file your own, the IRS reconsiders');
    expect(papers.has('File Your Own In Its Place')).toBe(true);
    // One File It: the 2027 return's, unfiled too by August 2028; the 2026 return offers only its replacement.
    expect(papers.buttons.filter((b) => b.text === 'File It')).toHaveLength(1);
    again.advanceTo(assessedAt + 35 * MS_DAY + MS_MINUTE);
    const cp501 = Math.round(376_69 + 0.01 * 165_60 + interestOn(376_69, 0, 35));
    expect(titled(again, 'A Reminder From The IRS').map((n) => [n.at, n.body])).toEqual([[assessedAt + 35 * MS_DAY, `Notice CP501: you owe ${usd(cp501)} on your 2026 return. It’s still unpaid, and interest and the late-payment penalty keep adding up. Pay it on Papers, under Tax Returns, or apply for a payment plan there.`]]);
  });

  it('leaves out the premium tax credit only their own return claims: CP2566 on the IRS’s part with the credit added back, and Papers says the tax with no credit (a New York quickSave life on $60,000, a marketplace plan the student’s Yale Health never needs)', () => {
    const sim = elsewhere('g17-sfr-credit');
    // TEST SETUP: a year's wages, as payroll records them, with nothing withheld; and the year's twelve marketplace
    // premiums of $700, as the premium's payment records each (`health.ts`), on the eve of tax season.
    recordWages(sim.player, on(2026, 5, 1, 9), NY, { gross: 60_000_00 });
    play(sim, on(2027, 1, 31));
    healthOf(sim.player).premiums[2026] = Array.from({ length: 12 }, () => 700_00);
    play(sim, on(2027, 2, 2));
    const r = returnsOf(sim.player)['2026']!;
    const credit = r.figures.credit;
    expect(credit).toBeGreaterThan(0);
    const irs = r.figures.owedTo!.irs;
    expect(irs).toBeGreaterThan(0);
    // The IRS's figures: its part with the credit it leaves out, a year late. Twelve months: 6% paying late and 22.5%
    // filing late, past the $535 least here; and a year’s interest on its part and on the filing share (on its part
    // alone until later on 2026-10-13), 260 days of 2027 after 15 April and 105 of leap-year 2028.
    const federal = irs + credit;
    const total = federal + Math.round(0.005 * 12 * federal + 0.045 * 5 * federal) + Math.round(interestOn(federal + Math.round(0.045 * 5 * federal), 260, 105));
    play(sim, DUE_2026 + 365 * MS_DAY + MS_MINUTE);
    expect(titled(sim, 'The IRS Figured Your 2026 Return').map((n) => n.body)).toEqual([`Notice CP2566: you didn’t file, so the IRS worked out that you owe ${usd(total)} from what your employers and banks reported, including the late-filing penalty and interest. File your own return within 120 days to replace it.`]);
    expect(r.substituteFigures!.credit).toBe(0);
    expect(r.substituteFigures!.balance).toBe(r.figures.balance + credit);
    play(sim, DUE_2026 + 485 * MS_DAY + MS_MINUTE);
    expect(r.parts!.tax).toBe(federal);
    expect(drawn(sim, PapersWorkspace).text).toContain(`The IRS filed this return for you from what your employers and banks reported. It assessed ${usd(r.figures.balance + credit)} of tax, without the credits only your own return can claim.`);
  });

  it('a save from before, holding the unfiled 1040-NR past due with no substitute on the calendar, has it put there on opening: at the year after the due date, or a day on once that has passed; never twice', () => {
    const sim = f1February('g17-sfr-arm');
    sim.advanceTo(on(2027, 4, 20));
    const cancel = (s: Simulation) => { for (const one of pending(s, TAX_SFR_KIND, 2026)) s.timeline.cancel(one.id, s.now); };
    // TEST SETUP: no substitute on the calendar, as a save from before 2026-09-28 never had one.
    cancel(sim);
    expect(pending(sim, TAX_SFR_KIND, 2026)).toEqual([]);
    const opened = reload(sim);
    expect(pending(opened, TAX_SFR_KIND, 2026).map((i) => [i.at, i.payload])).toEqual([[DUE_2026 + 365 * MS_DAY, { personId: opened.player.id, year: 2026, step: 'proposed' }]]);
    expect(pending(reload(opened), TAX_SFR_KIND, 2026)).toHaveLength(1);
    // TEST SETUP: canceled again, and the year passed by with nothing on the calendar.
    cancel(opened);
    opened.advanceTo(DUE_2026 + 370 * MS_DAY);
    expect(titled(opened, 'The IRS Figured Your 2026 Return')).toEqual([]);
    const late = reload(opened);
    // The 2027 return's own substitute stands beside it, on its own year: only 2026's is read here.
    expect(pending(late, TAX_SFR_KIND, 2026).map((i) => i.at)).toEqual([DUE_2026 + 371 * MS_DAY]);
    late.advanceTo(DUE_2026 + 371 * MS_DAY + MS_MINUTE);
    expect(titled(late, 'The IRS Figured Your 2026 Return').map((n) => n.at)).toEqual([DUE_2026 + 371 * MS_DAY]);
  });
});

// ---------------------------------------------------------------------------

describe('tax.notice', () => {
  /**
   * A 2026 return filed at noon on its due day, 15 April 2027, with nothing in the bank to pay it: a New York quickSave
   * life, since no student owes the IRS this much ($90,000 of wages, TEST SETUP as payroll records them). Until
   * 2026-10-16 it was filed on 1 February, as retirement.test.ts's is, and the letters ran from that filing, before the
   * tax was due; from then each waits for the due date, 11:59 PM that day (`nextNotice`), so it's filed on the due day,
   * where a day after filing and a day after the due date are the same day. A return filed early is played in
   * tests/remaining-tax.test.ts.
   */
  function owing(seed: string) {
    const sim = elsewhere(seed);
    recordWages(sim.player, on(2026, 5, 1, 9), NY, { gross: 90_000_00 });
    while (sim.now < on(2027, 4, 15)) sim.advanceTo(Math.min(on(2027, 4, 15), sim.now + 6 * MS_HOUR));
    emptyBank(sim);
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(true);
    const filed = sim.now;
    const due = returnsOf(sim.player)['2026']!.due;
    expect(due - filed).toBe(11 * MS_HOUR + 59 * MS_MINUTE);
    /** TEST SETUP: the bank kept empty, each six hours, to a moment. */
    const emptyTo = (s: Simulation, at: number) => { while (s.now < at) { emptyBank(s); s.advanceTo(Math.min(at, s.now + 6 * MS_HOUR)); } emptyBank(s); };
    return { sim, filed, due, emptyTo };
  }

  it('PLAYER JOURNEY: CP501, CP503, CP504 and LT11 on the 35th, 70th, 105th and 140th days after filing; the levy on the 170th finds $500, takes it to the tax, says what is still owed, and comes again 91 days on, once across a reload; Papers lists it', () => {
    const { sim, filed, due, emptyTo } = owing('g17-levy');
    const r = returnsOf(sim.player)['2026']!;
    const irs = r.figures.owedTo!.irs;
    expect(r.owed).toBe(irs);
    // Each on its day after filing, at 11:59 PM, the due date's minute (from 2026-10-16: until then at filing's own).
    const levyAt = due + 170 * MS_DAY;
    emptyTo(sim, levyAt - MS_MINUTE);
    const letters = sim.universe.notifications.filter((n) => /^Notice (CP501|CP503|CP504|LT11): /.test(n.body)).map((n) => [n.title, Math.floor((n.at - filed) / MS_DAY)]);
    expect(sim.universe.notifications.filter((n) => /^Notice (CP501|CP503|CP504|LT11): /.test(n.body)).map((n) => n.at - due)).toEqual([35, 70, 105, 140].map((d) => d * MS_DAY));
    expect(letters).toEqual([['A Reminder From The IRS', 35], ['A Second Reminder From The IRS', 70], ['The IRS Intends To Levy', 105], ['Final Notice Of Intent To Levy', 140]]);
    expect(titled(sim, 'The IRS Levied Your Accounts')).toEqual([]);
    expect(pending(sim, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([levyAt]);
    // TEST SETUP: $500 in the current account at the levy, far less than is owed.
    const current = sim.player.primaryAccountId!;
    setBalance(sim, current, 500_00);
    // What was owed at the levy, read with `owedOn` on a copy taken before it: its 7% compounded daily and half point a
    // month are held against figures worked out by hand at retirement.test.ts:45.
    const owedThen = owedOn(structuredClone(r), levyAt);
    sim.advanceTo(levyAt + MS_MINUTE);
    const levies = memos(sim, 'IRS levy, 2026 return');
    expect(levies).toHaveLength(1);
    expect(levies[0]!.postings.find((p) => p.accountId === current)!.amount).toBe(-500_00);
    expect(sim.universe.accounts[current]!.balance).toBe(0);
    // To the tax first, the IRS's order where the taxpayer names none.
    expect(r.payments).toEqual([{ at: levyAt, amount: 500_00, tax: 500_00, penalty: 0, interest: 0, how: 'levy' }]);
    expect(r.parts!.tax).toBe(irs - 500_00);
    expect(r.owed).toBe(owedThen - 500_00);
    expect(titled(sim, 'The IRS Levied Your Accounts').map((n) => [n.at, n.body])).toEqual([[levyAt, `The IRS took $500.00 from your bank accounts for your 2026 return. You still owe ${usd(r.owed!)}, and it will levy again while you do.`]]);
    expect(pending(sim, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([levyAt + 91 * MS_DAY]);
    const papers = drawn(sim, PapersWorkspace);
    expect(papers.text).toContain('Payments On The Year October 2, 2027: $500.00 taken by levy. $500.00 went to the tax, $0.00 to penalties and $0.00 to interest.');
    expect(papers.text).toContain(`Tax Unpaid ${usd(irs - 500_00)}`);
    const again = reload(sim);
    again.advanceTo(levyAt + 2 * MS_DAY);
    expect(pending(again, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([levyAt + 91 * MS_DAY]);
    expect(memos(again, 'IRS levy, 2026 return')).toHaveLength(1);
    expect(returnsOf(again.player)['2026']!.payments).toHaveLength(1);
  });

  it('a levy that finds the bank empty takes nothing and posts nothing, says $0.00 was taken and what is still owed, and comes again 91 days on', () => {
    const { sim, due, emptyTo } = owing('g17-levy-empty');
    const r = returnsOf(sim.player)['2026']!;
    const levyAt = due + 170 * MS_DAY;
    emptyTo(sim, levyAt - MS_MINUTE);
    sim.advanceTo(levyAt + MS_MINUTE);
    expect(memos(sim, 'IRS levy, 2026 return')).toEqual([]);
    expect(r.payments ?? []).toEqual([]);
    expect(r.collection).toBe(5);
    expect(titled(sim, 'The IRS Levied Your Accounts').map((n) => [n.at, n.body])).toEqual([[levyAt, `The IRS took $0.00 from your bank accounts for your 2026 return. You still owe ${usd(r.owed!)}, and it will levy again while you do.`]]);
    expect(pending(sim, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([levyAt + 91 * MS_DAY]);
    emptyTo(sim, levyAt + 91 * MS_DAY - MS_MINUTE);
    sim.advanceTo(levyAt + 91 * MS_DAY + MS_MINUTE);
    expect(titled(sim, 'The IRS Levied Your Accounts').map((n) => n.at)).toEqual([levyAt, levyAt + 91 * MS_DAY]);
    expect(memos(sim, 'IRS levy, 2026 return')).toEqual([]);
    expect(r.collection).toBe(6);
    expect(pending(sim, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([levyAt + 182 * MS_DAY]);
  });
});

// ---------------------------------------------------------------------------

describe('tax.apply_plan', () => {
  /**
   * A 2026 return filed on time, on 1 February 2027, with nothing in the bank, so its balance is owed: $60,000 of wages
   * (TEST SETUP, as payroll records them), past the low-income fee. A New York quickSave life: no student owes this.
   */
  function owingOnTime(seed: string): Simulation {
    const sim = elsewhere(seed);
    recordWages(sim.player, on(2026, 5, 1, 9), NY, { gross: 60_000_00 });
    play(sim, on(2027, 2, 1));
    emptyBank(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    return sim;
  }

  it('PLAYER JOURNEY: Apply on Papers’ IRS Payment Plan gives one toast, “Applied: answered by February 1, 2027, a fee of $29.00.”; the plan is with the IRS, then in force a minute on at what is owed over 72 months, the fee taken once and collection stopped', () => {
    const sim = owingOnTime('g17-plan-ui');
    const r = returnsOf(sim.player)['2026']!;
    // Filed before the due date: nothing has accrued.
    const owed = r.owed!;
    expect(owedOn(r, sim.now)).toBe(owed);
    expect(pending(sim, TAX_NOTICE_KIND)).toHaveLength(1);
    fund(sim, 100_00); // TEST SETUP: the setup fee's money in the bank.
    const before = drawn(sim, PapersWorkspace);
    expect(before.text).toContain(`IRS Payment Plan ${usd(owed)} owed`);
    // Online with direct debit, $29 (IRS.gov, July 2026), past the low-income line on $60,000.
    expect(before.text).toContain('Setup fee: $29.00.');
    const applied = sim.now;
    expect(before.press('Apply')).toEqual(['Applied. The IRS answers by February 1, 2027, and the setup fee is $29.00.']);
    const plan = sim.player.taxPlan!;
    expect(plan.status).toBe('pending');
    expect(plan.decideAt).toBe(applied + 60_000);
    expect(plan.history.map((x) => x.what)).toEqual(['Applied online']);
    const waiting = drawn(sim, PapersWorkspace);
    expect(waiting.text).toContain('IRS Payment Plan Being decided');
    expect(waiting.text).toContain('Answered By February 1, 2027');
    expect(waiting.has('Apply')).toBe(false);

    sim.advanceTo(applied + 2 * MS_MINUTE);
    expect(plan.status).toBe('active');
    expect(plan.monthly).toBe(Math.ceil(owed / 72));
    expect(memos(sim, 'IRS payment plan setup fee').map((t) => t.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount)).toEqual([-29_00]);
    expect(pending(sim, TAX_NOTICE_KIND)).toEqual([]);
    expect(titled(sim, 'Your IRS Payment Plan Is Approved')).toHaveLength(1);
    const inForce = drawn(sim, PapersWorkspace);
    expect(inForce.text).toContain('IRS Payment Plan In force');
    expect(inForce.text).toContain(`Each Month ${usd(Math.ceil(owed / 72))} By direct debit`);
    expect(inForce.text).toContain('Next Payment March 3, 2027');
    expect(sim.execute({ kind: 'tax.apply_plan', payload: { kind: 'long' } }).error).toBe('You already have a payment plan with the IRS.');
  });

  it('a month of the late-payment penalty that begins under the plan is charged a quarter point of the tax, exactly; its twin with no plan is charged the half point', () => {
    const planned = owingOnTime('g17-plan-rate');
    const bare = owingOnTime('g17-plan-rate');
    const tax = returnsOf(planned.player)['2026']!.owed!;
    expect(returnsOf(bare.player)['2026']!.owed).toBe(tax);
    // Five days past the due date of 15 April: the first month, begun at the due date, is at the full half point.
    for (const s of [planned, bare]) play(s, on(2027, 4, 20, 9));
    setBalance(planned, planned.player.primaryAccountId!, 100_00); // TEST SETUP: the setup fee's money in the bank.
    planned.must({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: 1_000_00 } });
    planned.advanceTo(planned.now + 2 * MS_MINUTE);
    const started = planned.player.taxPlan!.startedAt!;
    expect(planned.player.taxPlan!.status).toBe('active');
    // A day before the first payment: the second month has begun (33.4 days past the due date), under the plan.
    const at = started + 29 * MS_DAY;
    planned.advanceTo(at);
    bare.advanceTo(at);
    expect(returnsOf(planned.player)['2026']!.payments ?? []).toEqual([]);
    expect(partsOn(returnsOf(planned.player)['2026']!, at).penalty).toBe(Math.round(Math.round(0.005 * tax) + 0.0025 * tax));
    expect(partsOn(returnsOf(bare.player)['2026']!, at).penalty).toBe(Math.round(0.01 * tax));
  });

  it('an amended return’s tax that adds two payments or less joins the plan: still in force, “New tax joined the plan” with what it added, no CP523; its twin adding far more is CP523', () => {
    const amendUnder = (seed: string, more: number) => {
      const sim = owingOnTime(seed);
      fund(sim, 100_00); // TEST SETUP: the setup fee's money in the bank.
      sim.must({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: 1_000_00 } });
      sim.advanceTo(sim.now + 2 * MS_MINUTE);
      // TEST SETUP: a corrected W-2, more wages than were on the return.
      yearOf(sim.player, 2026).acting += more;
      const amended = sim.must<{ processAt: number }>({ kind: 'tax.amend', payload: { year: 2026 } });
      fund(sim, 10_000_00); // TEST SETUP: the plan's payments' money in the bank.
      sim.advanceTo(amended.processAt + MS_HOUR);
      return sim;
    };
    const small = amendUnder('g17-plan-join', 1_000_00);
    const a = returnsOf(small.player)['2026']!.amended![0]!;
    const added = a.change + a.interest!;
    expect(added).toBeGreaterThan(0);
    expect(added).toBeLessThanOrEqual(2 * 1_000_00);
    const plan = small.player.taxPlan!;
    expect(plan.status).toBe('active');
    expect(plan.history.filter((x) => x.what === 'New tax joined the plan')).toEqual([{ at: a.processedAt, what: 'New tax joined the plan', amount: added }]);
    expect(titled(small, 'Notice CP523: Your Payment Plan')).toEqual([]);
    expect(pending(small, TAX_PLAN_DEFAULT_KIND)).toEqual([]);

    const large = amendUnder('g17-plan-join', 20_000_00);
    const b = returnsOf(large.player)['2026']!.amended![0]!;
    expect(b.change + b.interest!).toBeGreaterThan(2 * 1_000_00);
    expect(large.player.taxPlan!.status).toBe('default');
    expect(titled(large, 'Notice CP523: Your Payment Plan')).toHaveLength(1);
  });

  it('PLAYER JOURNEY: the F-1 student files her 1040-NR with the bank empty and owes $165.60; with no Social Security number her plan goes by Form 9465, no fee by direct debit at her income, answered 30 days on; in force at $2.30 a month, collection stopped, and the first payment taken', () => {
    const sim = f1February('g17-plan-f1');
    expect(hasSsn(sim.player)).toBe(false);
    emptyBank(sim); // TEST SETUP: nothing in the bank to pay the tax with.
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const r = returnsOf(sim.player)['2026']!;
    expect(r.owed).toBe(165_60);
    expect(pending(sim, TAX_NOTICE_KIND)).toHaveLength(1);
    const applied = sim.now;
    const asked = sim.must<{ status: string; decideAt: number; fee: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long' } });
    // $1,656 of income is under 250% of the poverty line: the low-income direct-debit fee, $0.
    expect(asked).toEqual({ status: 'pending', decideAt: applied + 30 * MS_DAY, fee: 0 });
    expect(sim.player.taxPlan!.history.map((x) => x.what)).toEqual(['Form 9465 mailed: no Social Security number for the online application']);
    sim.advanceTo(applied + 30 * MS_DAY - MS_MINUTE);
    expect(sim.player.taxPlan!.status).toBe('pending');
    sim.advanceTo(applied + 30 * MS_DAY + MS_MINUTE);
    const plan = sim.player.taxPlan!;
    expect(plan.status).toBe('active');
    // What's owed over 72 months: $165.60 ÷ 72 = $2.30.
    expect(plan.monthly).toBe(2_30);
    expect(plan.nextDue).toBe(applied + 60 * MS_DAY);
    expect(pending(sim, TAX_NOTICE_KIND)).toEqual([]);
    fund(sim, 100_00); // TEST SETUP: the payment's money in the bank.
    sim.advanceTo(applied + 60 * MS_DAY + MS_MINUTE);
    expect(plan.history.filter((x) => x.what === 'A payment').map((x) => x.amount)).toEqual([2_30]);
    expect(r.payments!.map((p) => [p.amount, p.tax, p.how])).toEqual([[2_30, 2_30, 'payment']]);
  });
});

// ---------------------------------------------------------------------------

describe('documents.apply_ssn', () => {
  /** On the office's day: Sunday 30 August 2026 at noon, registered at orientation's end, an hour free. */
  const SSN_DAY = (): number => on(2026, 8, 30, 12);

  it('PLAYER JOURNEY: Papers’ Social Security Number panel says Not yet with the button refused until she registers; pressed, an hour at the office and the card 21 days on, the panel saying so and the button gone; Held once it comes, across a reload', () => {
    const sim = international('g17-ssn-panel');
    const first = drawn(sim, WorkPane);
    expect(first.text).toContain('Social Security Number Not yet');
    expect(first.button('Apply At The Social Security Office')!.disabled).toBe(true);
    expect(first.text).toContain('On an F-1, the number needs on-campus work that has begun or starts within 30 days. Register at the School first, and the School’s work-study is yours.');
    expect(sim.execute({ kind: 'documents.apply_ssn', payload: {} }).error).toBe('On an F-1, the number needs on-campus work that has begun or starts within 30 days. Register at the School first, and the School’s work-study is yours.');

    sim.advanceTo(SSN_DAY());
    expect(registered(sim.player.school, courseworkOf(sim, sim.player))).toBe(true);
    const open = drawn(sim, WorkPane);
    expect(open.button('Apply At The Social Security Office')!.disabled).toBe(false);
    // The card in 21 days, the longer end of the SSA's "2 to 3 weeks", from the hour at the office: 1 PM on 30 August.
    expect(open.press('Apply At The Social Security Office')).toEqual(['Applied. The card comes September 20, 2026.']);
    expect(sim.now).toBe(on(2026, 8, 30, 13));
    expect(sim.player.ssn).toEqual({ status: 'applied', appliedAt: on(2026, 8, 30, 13), arrivesAt: on(2026, 9, 20, 13) });
    expect(pending(sim, SSN_ARRIVES_KIND).map((i) => i.at)).toEqual([on(2026, 9, 20, 13)]);
    const applied = drawn(sim, WorkPane);
    expect(applied.text).toContain('Social Security Number Applied for. The card comes September 20, 2026');
    expect(applied.has('Apply At The Social Security Office')).toBe(false);
    expect(sim.execute({ kind: 'documents.apply_ssn', payload: {} }).error).toBe('You’ve already applied, and the card is on its way.');
    expect(sim.now).toBe(on(2026, 8, 30, 13));

    const again = reload(sim);
    again.advanceTo(on(2026, 9, 20, 13) - MS_MINUTE);
    expect(hasSsn(again.player)).toBe(false);
    again.advanceTo(on(2026, 9, 20, 13) + MS_MINUTE);
    expect(hasSsn(again.player)).toBe(true);
    expect(titled(again, 'Your Social Security Card Came').map((n) => [n.at, n.body])).toEqual([[on(2026, 9, 20, 13), 'Give the number to the School’s payroll and your bank. A bank that opens accounts online for people with a number can now open one for you online.']]);
    const held = drawn(again, WorkPane);
    expect(held.text).toContain('Social Security Number Held');
    expect(held.has('Apply At The Social Security Office')).toBe(false);
    expect(again.execute({ kind: 'documents.apply_ssn', payload: {} }).error).toBe('Your Social Security card has already come.');
  });

  it('the bank’s channel: before the card, Wells Fargo opens her account only in a branch, an hour there; once it has come, online, with no hour', () => {
    const applied = (seed: string) => {
      const sim = international(seed);
      sim.advanceTo(SSN_DAY());
      sim.must({ kind: 'documents.apply_ssn', payload: {} });
      return sim;
    };
    const wells = (sim: Simulation) => sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-wells-fargo', fundFrom: sim.player.primaryAccountId, amount: 25_00 } });
    const waiting = applied('g17-ssn-bank');
    // A Saturday evening, a week before the card: in a branch, an hour.
    waiting.advanceTo(on(2026, 9, 12, 19));
    expect(hasSsn(waiting.player)).toBe(false);
    wells(waiting);
    expect(waiting.now).toBe(on(2026, 9, 12, 20));

    const held = applied('g17-ssn-bank');
    // A Saturday evening, a week after it came: online, no hour.
    held.advanceTo(on(2026, 9, 26, 19));
    expect(hasSsn(held.player)).toBe(true);
    const opened = wells(held);
    expect(held.now).toBe(on(2026, 9, 26, 19));
    expect(held.universe.accounts[opened.accountId]!.bankId).toBe('us-wells-fargo');
  });

  it('a 1040-NR filed with the card in hand is processed in the IRS’s 21 days; without it the W-7 holds it seven weeks more, 70', () => {
    const withRefund = (seed: string, ssn: boolean) => {
      const sim = international(seed);
      if (ssn) { sim.advanceTo(SSN_DAY()); sim.must({ kind: 'documents.apply_ssn', payload: {} }); }
      // TEST SETUP: $3,000 more of work-study with $600 withheld, as Yale's payroll records a W-4's withholding.
      recordWages(sim.player, on(2026, 10, 1, 9), NY, { gross: 3_000_00, withheld: 600_00, workStudy: true, employer: 'yale-payroll' });
      sim.advanceTo(on(2027, 2, 1));
      const filed = sim.must<{ irs: number; refundAt: number }>({ kind: 'tax.file', payload: { year: 2026 } });
      return { sim, filed };
    };
    const held = withRefund('g17-ssn-refund', true);
    expect(hasSsn(held.sim.player)).toBe(true);
    const r = returnsOf(held.sim.player)['2026']!;
    // 10% of $4,656.00 is $465.60; $600 was withheld: $134.40 back.
    expect(r.figures.income).toBe(4_656_00);
    expect(held.filed.irs).toBe(-134_40);
    expect(held.filed.refundAt - r.filedAt!).toBe(21 * MS_DAY);
    held.sim.advanceTo(held.filed.refundAt + MS_MINUTE);
    expect(memos(held.sim, 'Federal tax refund, 2026').map((t) => t.postings.find((p) => p.amount > 0 && p.accountId === held.sim.player.primaryAccountId)!.amount)).toEqual([134_40]);

    const without = withRefund('g17-ssn-refund', false);
    expect(hasSsn(without.sim.player)).toBe(false);
    expect(without.filed.irs).toBe(-134_40);
    expect(without.filed.refundAt - returnsOf(without.sim.player)['2026']!.filedAt!).toBe(70 * MS_DAY);
  });

  it('the IRS’s payment plan on her 1040-NR’s $165.60: with the card come, applied for online and answered in a minute; without it, Form 9465 and 30 days', () => {
    const owingPlan = (seed: string, ssn: boolean) => {
      const sim = international(seed);
      if (ssn) { sim.advanceTo(SSN_DAY()); sim.must({ kind: 'documents.apply_ssn', payload: {} }); }
      sim.advanceTo(on(2027, 2, 1));
      emptyBank(sim); // TEST SETUP: nothing in the bank to pay the tax with.
      sim.must({ kind: 'tax.file', payload: { year: 2026 } });
      expect(returnsOf(sim.player)['2026']!.owed).toBe(165_60);
      const at = sim.now;
      const asked = sim.must<{ decideAt: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long' } });
      return { sim, wait: asked.decideAt - at };
    };
    const held = owingPlan('g17-ssn-plan', true);
    expect(hasSsn(held.sim.player)).toBe(true);
    expect(held.wait).toBe(60_000);
    expect(held.sim.player.taxPlan!.history.map((x) => x.what)).toEqual(['Applied online']);
    held.sim.advanceTo(held.sim.now + 2 * MS_MINUTE);
    expect(held.sim.player.taxPlan!.status).toBe('active');

    const without = owingPlan('g17-ssn-plan', false);
    expect(without.wait).toBe(30 * MS_DAY);
    expect(without.sim.player.taxPlan!.history.map((x) => x.what)).toEqual(['Form 9465 mailed: no Social Security number for the online application']);
  });

  it('refuses in its words a Call within the hour, a hospital bed and a passport reported lost, the clock and her number left as they were; and a citizen, who holds one', () => {
    const sim = international('g17-ssn-refused');
    sim.advanceTo(SSN_DAY());
    const call = sim.must<{ ok: boolean; id: string }>({ kind: 'calendar.schedule', payload: { title: 'Call', at: on(2026, 8, 30, 12, 30), durationMinutes: 30 } });
    expect(call.ok).toBe(true);
    const busy = sim.execute({ kind: 'documents.apply_ssn', payload: {} });
    expect(busy.error).toBe('Call starts at 12:30 PM: there isn’t the time before it.');
    expect(sim.now).toBe(SSN_DAY());
    expect(sim.player.ssn).toBeUndefined();
    expect(sim.must<{ ok: boolean }>({ kind: 'calendar.cancel', payload: { entryId: call.id } }).ok).toBe(true);
    // TEST SETUP: a hospital stay begun now, through `careFor` as the week's draw admits one.
    careFor(sim, sim.player, { care: 'stay', what: 'A hospital stay' }, sim.now);
    expect(sim.execute({ kind: 'documents.apply_ssn', payload: {} }).error).toBe('Not from a hospital bed.');
    expect(sim.now).toBe(SSN_DAY());
    expect(sim.player.ssn).toBeUndefined();
    const passport = documentsOf(sim.player).find((d) => d.kind === 'passport' && d.status === 'valid')!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: passport.id } });
    const lost = sim.execute({ kind: 'documents.apply_ssn', payload: {} });
    expect(lost.error).toBe('The office asks for your passport, and you don’t have one in force.');
    expect(sim.player.ssn).toBeUndefined();
    expect(pending(sim, SSN_ARRIVES_KIND)).toEqual([]);
    expect(student('g17-ssn-citizen').execute({ kind: 'documents.apply_ssn', payload: {} }).error).toBe('As a US citizen, you already have a Social Security number.');
  });

  it('Discover, which the row named as reading the number, changes only its words for her: it asks for a number, then, with the card, for $25,000 a year of income; refused either way, no loan opened', () => {
    const sim = international('g17-ssn-discover');
    sim.advanceTo(SSN_DAY());
    const borrow = () => sim.execute({ kind: 'bank.borrow', payload: { amount: 2_500_00, months: 36, bankId: 'us-capital-one' } });
    const loans = () => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && a.kind === 'loan');
    expect(borrow().error).toBe('Discover Personal Loans asks for a Social Security number.');
    const arrives = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} }).arrivesAt;
    sim.advanceTo(arrives + MS_MINUTE);
    expect(hasSsn(sim.player)).toBe(true);
    expect(borrow().error).toBe('Discover Personal Loans lends on $25,000 a year of income or more, and the last 30 days’ wages come to less than that over a year.');
    expect(loans()).toEqual([]);
  });
});
