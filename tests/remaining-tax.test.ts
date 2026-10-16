/**
 * The tax items of the integration pass of 2026-10-16 (docs/verification/integration-2026-10-16/prompts/tax.md), each in
 * docs/verification/remaining/tax-checklist.json before any code changed:
 *
 * - `tax.early_filing_notices`: the IRS's letters on a return filed early and unpaid. Until 2026-10-16 they were counted
 *   from the filing, so the Scraping family's student, who filed her 2027 return on Papers on 1 February 2028 with her
 *   money in a CD, had CP501 on 7 March (“you still owe it, with the interest and penalty since”) and CP503 on 11 April,
 *   before the tax was due on 18 April and with neither charged, her LT11 on 20 June and the levy on 20 July; and no bill
 *   came first. The tax shown on a return is due on the day fixed for filing it (IRC 6151(a)); notice and demand follows
 *   an assessment (6303(a)); a levy waits on ten days after it and thirty days' notice of intent (6331(a), (d)(2));
 *   interest and the failure-to-pay penalty run from the due date (6601(a), 6651(a)(2)); all read at law.cornell.edu on
 *   2026-10-16. The IRS's first letter is its bill (IRS Publication 594, Rev. 1-2026: “If you owe taxes, we will send
 *   you a bill. This is your first bill for tax due”). From that day the bill, Notice CP14, comes at filing and names the
 *   due date, and each reminder, the notice of intent and the final notice wait for the due date (`nextNotice`,
 *   `billed`); a save holding a letter before it has it moved there on opening (`armCollection`). Connecticut's waited
 *   for its own due date from 2026-10-15, its bill thirty days after (Conn. Gen. Stat. 12-35(a), read again 2026-10-16).
 * - `tax.ct_filed_in_error`: Ask For Its Withdrawal As Filed In Error was drawn shut on every lien, and on Connecticut's,
 *   the only state a life files in, no state could open it. From 2026-10-16 it's drawn only on a lien the engine finds
 *   was filed in error, and any other filed lien says why in the engine's words; a Connecticut lien in error, on a
 *   FIXTURE, is withdrawn through the button and the clock.
 * - The rows no student reaches (`tax.amend`, `tax.catch_up_state_plan`, `tax.federal_lien_withdraw`,
 *   `tax.request_waiver`): what their audit rows left untested, each on a FIXTURE life labelled so, since a New Haven
 *   student's filed year never changes, Connecticut ends a plan at the first payment missed, her year never owes the IRS
 *   $10,000, and only Oregon charges the three-year penalty. One defect found: a waiver of Oregon's penalty larger than
 *   what was still owed of it dropped the part already paid; from 2026-10-16 it's credited to the year and the rest
 *   refunded.
 * - The other refusals no journey reaches, each a GUARD: a duplicate filing or payment, a year that doesn't exist, the
 *   IRS's $50,000 and $100,000, the Social Security office's four that its panel never sends.
 *
 * Every figure is worked here from the rule and written as a literal, never asked of the engine's helper: the IRS's 7% a
 * year compounded daily, a 366th of it a day in 2028 (IRC 6622; Rev. Proc. 95-17), brought up at each letter on the tax,
 * the penalty and the interest charged before it; the failure-to-pay penalty, half a percent of the tax for each month or
 * part since the due date (a month is 30.4375 days in this engine); Connecticut's 10% once and 1% a month on the tax
 * (Conn. Gen. Stat. 12-735).
 *
 * PLAYER JOURNEYS: the Scraping family's student of tests/scope-taxpapers.test.ts, Ada Cole, born in New York, at Yale
 * in New Haven from Monday 24 August 2026 (seed r3-tax-scraping), dismissed on 10 December 2027 with her coursework left
 * to the clock, her 2027 return filed on Papers on 1 February 2028 with her savings and checking moved into a Chase CD
 * by the Bank screen's commands: $1,700.39 owed to the IRS and $585.33 to Connecticut. Papers is drawn as the player
 * has it (react-dom/server), its Gated buttons pressed by their own onClick.
 *
 * FIXTURE lives are quick-saves (`quickSave`), each said where it's made, with a return's wages or withholding set by
 * hand (TEST SETUP), where no student's life holds what the rule acts on.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, MS_HOUR, MS_MINUTE, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeConfig, withFamily } from '@/engine/world/bootstrap';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { TAX_NOTICE_KIND, returnsOf, type TaxReturn } from '@/engine/systems/taxreturn';
import { STATE_NOTICE_KIND, assessStateNonFiler, fileState, fileStateLien, reconsiderState, threeYearCheck } from '@/engine/systems/statetax';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** The Gated buttons drawn, each with its feature, words, state and onClick. */
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
  toasts: [] as string[],
}));

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
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
const { StateLienAndPenalty, FederalLien } = await import('@/ui/components/LienPanels');

// ---------------------------------------------------------------------------
// The life, the clock and the screen
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, NY);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => loadSave(JSON.parse(snap) as never);
const reload = (sim: Simulation): Simulation => thaw(freeze(sim));
function once<T>(play: () => T): () => T {
  let done: { value: T } | undefined;
  return () => (done ??= { value: play() }).value;
}

const own = (sim: Simulation, kind: Account['kind']): Account => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === kind && !a.closedAt && a.category !== 'term')!;
const checkingOf = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
const refusal = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload }).error;
/** Everything the player's own accounts hold. */
const held = (sim: Simulation) => sim.ledger.accountsOf(sim.player.id).reduce((s, a) => s + a.balance, 0);
/** What a refused command must leave as it was: the money, the returns, the calendar and the notices. */
const still = (sim: Simulation) => JSON.stringify([held(sim), sim.player.returns, sim.player.taxPlan ?? null, sim.player.statePlans ?? null, sim.universe.scheduled.filter((i) => i.status === 'pending').length, sim.universe.notifications.length]);

/** Papers as the player has it; the Gated buttons it drew are in `h.clicks`. */
function papers(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(PapersWorkspace as FunctionComponent)));
}
/** A component of Papers drawn alone, as Papers draws it under a year. */
function drawn<P extends object>(sim: Simulation, part: FunctionComponent<P>, props: P): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(part, props)));
}
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);
/** A Gated button pressed by its own onClick: what it toasted. */
function press(feature: string): string[] {
  const found = drew(feature);
  expect(found, `one ${feature} button`).toHaveLength(1);
  h.toasts = [];
  found[0]!.onClick!();
  return h.toasts;
}

/** Ada Cole from the Scraping family, her 2026 return filed on 1 February 2027, kept to noon on 1 February 2028. */
const base = once(() => {
  const sim = createSave(1, 'r3-tax-scraping', { ...withFamily(newLifeConfig(), 'scraping'), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.advanceTo(at(2027, 2, 1, 12));
  sim.must({ kind: 'tax.file', payload: { year: 2026 } });
  sim.advanceTo(at(2028, 2, 1, 12));
  return freeze(sim);
});

/** Her savings into her checking, the checking into a Chase CD, and the Bank screen's commands that do it. */
function intoTheCd(sim: Simulation): void {
  sim.must({ kind: 'bank.transfer', payload: { fromId: own(sim, 'savings').id, toId: checkingOf(sim).id, amount: own(sim, 'savings').balance } });
  sim.must({ kind: 'bank.open_term', payload: { amount: checkingOf(sim).balance } });
  expect([checkingOf(sim).balance, own(sim, 'savings').balance]).toEqual([0, 0]);
}

/** Her 2027 return filed on Papers on 1 February 2028 with nothing to pay it from: $1,700.39 owed to the IRS and $585.33 to Connecticut. */
const unpaid = once(() => {
  const sim = thaw(base());
  intoTheCd(sim);
  papers(sim);
  expect(press('tax.file')).toHaveLength(1);
  const r = sim.player.returns!['2027']!;
  expect([r.filedAt, r.owed, r.stateDue!['us-ct']!.owed]).toEqual([at(2028, 2, 1, 12), 1_700_39, 585_33]);
  return freeze(sim);
});
const ret = (sim: Simulation) => sim.player.returns!['2027']!;
const ct = (sim: Simulation) => ret(sim).stateDue!['us-ct']!;
/** The IRS's letters to her, each [title, moment, words]. */
const irsLetters = (sim: Simulation) => sim.universe.notifications.filter((n) => /^Notice (CP14|CP501|CP503|CP504|LT11): /.test(n.body)).map((n) => [n.title, n.at, n.body]);

// ---------------------------------------------------------------------------
// tax.early_filing_notices
// ---------------------------------------------------------------------------

describe('tax.early_filing_notices', () => {
  // 18 April 2028 at 11:59 PM in New Haven, the deadline after Emancipation Day and a weekend.
  const DUE = at(2028, 4, 18, 23, 59);
  const BILL = 'Notice CP14: your 2027 return shows $1,700.39 owed to the IRS, due by April 18, 2028. Paid by then, nothing is added; from then, interest at 7% a year and a penalty for paying late of 0.5% a month run on what’s unpaid, and its reminders begin 5 weeks after that date.';

  it('PLAYER JOURNEY: filed on Papers on 1 February 2028 unpaid, the IRS’s bill comes at once and names 18 April; no letter before the due date; CP501, CP503, CP504 and the LT11 35 days apart from it, $1,728.81 to $1,789.55, and the levy 30 days on, each once across reloads; Connecticut’s bill 30 days after its due date: until 2026-10-16 CP501 came on 7 March and CP503 on 11 April, with no bill', () => {
    let sim = thaw(unpaid());
    expect(ret(sim).due).toBe(DUE);
    // The bill at filing, $1,700.39 and its due date, nothing added before it.
    expect(irsLetters(sim)).toEqual([['A Bill From The IRS', at(2028, 2, 1, 12), BILL]]);
    expect(pending(sim, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([DUE + 35 * MS_DAY]);
    // Past the days the reminders came on until 2026-10-16, 7 March and 11 April, and to a minute before the due date:
    // nothing more from the IRS, and nothing yet from Connecticut. Saved and opened again on the way.
    sim.advanceTo(at(2028, 3, 8, 12));
    sim = reload(sim);
    sim.advanceTo(DUE - MS_MINUTE);
    expect(irsLetters(sim)).toEqual([['A Bill From The IRS', at(2028, 2, 1, 12), BILL]]);
    expect(titled(sim, 'A Bill From Connecticut DRS')).toEqual([]);
    expect(ret(sim).owed).toBe(1_700_39);
    expect(pending(sim, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([DUE + 35 * MS_DAY]);
    // Connecticut's bill 30 days after its due date: $585.33, its 10% ($58.53) and a month's 1% ($5.85).
    sim.advanceTo(DUE + 30 * MS_DAY + MS_HOUR);
    expect(titled(sim, 'A Bill From Connecticut DRS').map((n) => [n.at, n.body])).toEqual([[DUE + 30 * MS_DAY, 'DRS Bill: $649.71 on your 2027 Connecticut return; the tax, its 10% penalty and 1% a month of interest are due.']]);
    // Each letter 35 days after the last from the due date, its balance brought up then. Worked from the rule: the
    // penalty 0.5% of $1,700.39 for each month or part since the due date, 2, 3, 4 and 5 months begun at 35, 70, 105 and
    // 140 days ($17.00, $25.50, $34.00, $42.50); the interest 7% a year compounded daily, a 366th a day in 2028, on the
    // tax and what was charged before each letter ($11.42, $23.03, $34.78, $46.66).
    sim.advanceTo(DUE + 35 * MS_DAY + MS_HOUR);
    sim = reload(sim);
    sim.advanceTo(DUE + 140 * MS_DAY + MS_HOUR);
    expect(irsLetters(sim).slice(1)).toEqual([
      ['A Reminder From The IRS', DUE + 35 * MS_DAY, 'Notice CP501: $1,728.81 on your 2027 return; you still owe it, with the interest and penalty since.'],
      ['A Second Reminder From The IRS', DUE + 70 * MS_DAY, 'Notice CP503: $1,748.92 on your 2027 return; it has not heard from you, and expects it paid.'],
      ['The IRS Intends To Levy', DUE + 105 * MS_DAY, 'Notice CP504: $1,769.17 on your 2027 return; it may take a state refund and certain federal payments without further notice.'],
      ['Final Notice Of Intent To Levy', DUE + 140 * MS_DAY, 'Notice LT11: $1,789.55 on your 2027 return; in 30 days it takes what you owe from your bank accounts.'],
    ]);
    // The levy 30 days after the LT11 finds her accounts empty, her money in the CD: six months begun, $51.00, and 30
    // days more of interest, $56.96 in all: $1,808.35 still owed.
    sim.advanceTo(DUE + 170 * MS_DAY + MS_HOUR);
    expect(titled(sim, 'The IRS Levied Your Accounts').map((n) => [n.at, n.body])).toEqual([[DUE + 170 * MS_DAY, '$0.00 taken from your bank accounts for your 2027 return; $1,808.35 is still owed, and it levies again while it is.']]);
    expect(titled(sim, 'A Bill From The IRS')).toHaveLength(1);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('a return filed after its due date unpaid has its bill with the penalties charged, and its first reminder 35 days after filing', () => {
    const sim = thaw(base());
    intoTheCd(sim);
    // Filed on 3 May 2028 at 11:59 PM, 15 days late, a month begun: 5% of $1,700.39 for filing and paying late together
    // (4.5% and 0.5%, IRC 6651(a)(1), (a)(2), (c)(1)), $85.02; and 15 days of interest at a 366th of 7% a day, compounded,
    // on the tax and the filing share, $1,776.91, from the due date (6601(e)(2)(B)): $5.10. In all $1,790.51.
    sim.advanceTo(at(2028, 5, 3, 23, 59));
    sim.must({ kind: 'tax.file', payload: { year: 2027 } });
    const filed = sim.now;
    expect(ret(sim).owed).toBe(1_790_51);
    expect(titled(sim, 'A Bill From The IRS').map((n) => [n.at, n.body])).toEqual([[filed, 'Notice CP14: $1,790.51 owed on your 2027 return, with the penalties and interest since its due date. Until it’s paid, interest at 7% a year and a penalty for paying late of 0.5% a month go on, and its reminders begin in 5 weeks.']]);
    expect(pending(sim, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([filed + 35 * MS_DAY]);
  });
});

describe('tax.early_filing_notices: a plan refused, and a save from before', () => {
  it('PLAYER JOURNEY: the IRS’s plan asked for on 1 February 2028 without direct debit and refused a minute on for its $43 fee, $50 having gone to the tax: its letters wait for the 18 April due date, CP501 35 days after it, and none before it; until 2026-10-16 CP501 came on 7 March', () => {
    const sim = thaw(base());
    // Her savings into her checking, all but $50 of it into a CD: filing can't pay its $1,700.39.
    sim.must({ kind: 'bank.transfer', payload: { fromId: own(sim, 'savings').id, toId: checkingOf(sim).id, amount: own(sim, 'savings').balance } });
    sim.must({ kind: 'bank.open_term', payload: { amount: checkingOf(sim).balance - 50_00 } });
    papers(sim);
    expect(press('tax.file')).toHaveLength(1);
    const due = at(2028, 4, 18, 23, 59);
    expect(ret(sim).owed).toBe(1_700_39);
    // Monthly, not by direct debit: its low-income fee $43 (IRS.gov, Payment plans; her $32,336.56 under 2.5 times the
    // engine's $15,960 line), the $50 in her checking covering it as she asks, decided online in a minute.
    sim.must({ kind: 'tax.apply_plan', payload: { kind: 'long', directDebit: false } });
    expect(sim.player.taxPlan).toMatchObject({ status: 'pending', fee: 43_00, decideAt: at(2028, 2, 1, 12) + 60_000 });
    // The $50 paid toward the tax on Papers before the IRS answers: the fee can't be paid, and the plan is refused.
    sim.must({ kind: 'tax.pay', payload: { year: 2027, amount: 50_00 } });
    sim.advanceTo(at(2028, 2, 1, 12) + 2 * 60_000);
    expect(sim.player.taxPlan).toMatchObject({ status: 'refused', why: 'The $43.00 setup fee is more than the bank can cover.' });
    expect(titled(sim, 'The IRS Refused A Payment Plan')).toHaveLength(1);
    expect(pending(sim, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([due + 35 * MS_DAY]);
    sim.advanceTo(due - MS_MINUTE);
    expect(irsLetters(sim).map(([title]) => title)).toEqual(['A Bill From The IRS']);
    sim.advanceTo(due + 35 * MS_DAY + MS_HOUR);
    expect(titled(sim, 'A Reminder From The IRS').map((n) => n.at)).toEqual([due + 35 * MS_DAY]);
  });

  it('OLDER SAVE: a save written before 2026-10-16 holding CP501 for 7 March, before the 18 April due date, has it moved to 35 days after the due date on opening, once, across two openings', () => {
    const due = at(2028, 4, 18, 23, 59);
    const sim = thaw(unpaid());
    // FIXTURE: the letter as a save written before 2026-10-16 holds it, five weeks after the filing, and none else.
    for (const one of pending(sim, TAX_NOTICE_KIND)) sim.timeline.cancel(one.id, sim.now);
    sim.schedule({ at: at(2028, 3, 7, 12), kind: TAX_NOTICE_KIND, label: 'The IRS', category: 'system', priority: 20, payload: { personId: sim.player.id, year: 2027 } });
    const opened = reload(sim);
    expect(pending(opened, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([due + 35 * MS_DAY]);
    const again = reload(opened);
    expect(pending(again, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([due + 35 * MS_DAY]);
    again.advanceTo(due + 35 * MS_DAY + MS_HOUR);
    expect(irsLetters(again).map(([title, when]) => [title, when])).toEqual([['A Bill From The IRS', at(2028, 2, 1, 12)], ['A Reminder From The IRS', due + 35 * MS_DAY]]);
  });
});

// ---------------------------------------------------------------------------
// tax.ct_filed_in_error (and tax.lien_dispute)
// ---------------------------------------------------------------------------

describe('tax.ct_filed_in_error', () => {
  const SECURED = 'It secured tax owed when it was filed: it’s released once that’s paid, not withdrawn.';

  it('PLAYER JOURNEY: her Connecticut lien, filed by the clock 60 days after the due date: Papers draws no Ask For Its Withdrawal As Filed In Error and says why in the engine’s words, Ask For Its Release beside it; the command sent anyway is refused and moves nothing', () => {
    const sim = thaw(unpaid());
    const due = at(2028, 4, 18, 23, 59);
    sim.advanceTo(due + 60 * MS_DAY + MS_HOUR);
    expect(ct(sim).lien).toMatchObject({ status: 'filed', filedAt: due + 60 * MS_DAY });
    const screen = papers(sim);
    expect(drew('tax.lien_dispute')).toEqual([]);
    expect(drew('tax.lien_release').map((c) => [c.disabled, c.title])).toEqual([[true, 'It’s released once the balance it secures is paid in full.']]);
    expect(screen).toContain(SECURED);
    expect(screen).not.toContain('Filed in error, it’s withdrawn on request');
    // GUARD: the command, which the screen no longer sends here.
    const before = still(sim);
    expect(refusal(sim, 'tax.lien_dispute', { state: 'us-ct', year: 2027 })).toBe(SECURED);
    expect(still(sim)).toBe(before);
  });

  it('FIXTURE: a Connecticut lien on DRS’s assessment that her own return, in its place, showed she didn’t owe: the button drawn and pressed, Asked To Be Withdrawn and decided 30 days on, Withdrawn with one notice across a reload, and not asked twice', () => {
    // FIXTURE: a New Haven quick-save, its 2001 return assessed by DRS as a non-filer's for $1,000, its lien filed, then
    // replaced by her own return showing nothing owed (each by calling the engine's functions). DRS assesses from the
    // return's own figures, so no played Connecticut lien is ever in error (the journey above).
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'wealthy' }, 'rt-ct-error');
    const r = { year: 2001, due: sim.now - 500 * MS_DAY, figures: { income: 50_000_00, balance: 1_000_00, states: [{ state: 'us-ct', tax: 1_000_00, credit: 0 }], owedTo: { irs: 0, states: { 'us-ct': 1_000_00 } } } } as unknown as TaxReturn;
    sim.player.returns = { ...(sim.player.returns ?? {}), '2001': r };
    assessStateNonFiler(sim, sim.player, r, 'us-ct', 1_000_00);
    fileStateLien(sim, sim.player, r, 'us-ct', 'collection');
    expect(drawn(sim, StateLienAndPenalty, { year: 2001, state: 'us-ct' })).toContain(SECURED);
    expect(drew('tax.lien_dispute')).toEqual([]);
    // Her own return filed in its place: what was withheld covered it all.
    reconsiderState(sim, sim.player, r, 'us-ct', 0);
    Object.assign(r, { filedAt: sim.now, figures: { ...r.figures, balance: 0, states: [{ state: 'us-ct', tax: 0, credit: 0 }], owedTo: { irs: 0, states: { 'us-ct': 0 } } } });
    const lien = () => returnsOf(sim.player)['2001']!.stateDue!['us-ct']!.lien!;
    expect(lien().status).toBe('paid');
    const shown = drawn(sim, StateLienAndPenalty, { year: 2001, state: 'us-ct' });
    expect(shown).toContain('Filed in error, it’s withdrawn on request: DRS releases it with a statement that it was filed in error.');
    expect(shown).not.toContain(SECURED);
    expect(drew('tax.lien_dispute').map((c) => [c.label, c.disabled])).toEqual([['Ask For Its Withdrawal As Filed In Error', false]]);
    const asked = sim.now;
    // Connecticut's 30 days, SLATE's (content/statetax.ts: its days weren't published).
    expect(press('tax.lien_dispute')).toEqual([`Asked: Connecticut DRS decides by ${new Date(asked + 30 * MS_DAY).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: NY })}.`]);
    expect(lien()).toMatchObject({ status: 'disputed', decideAt: asked + 30 * MS_DAY });
    expect(refusal(sim, 'tax.lien_dispute', { state: 'us-ct', year: 2001 })).toMatch(/^Asked: decided by /);
    const again = reload(sim);
    again.advanceTo(asked + 30 * MS_DAY + MS_HOUR);
    const l = returnsOf(again.player)['2001']!.stateDue!['us-ct']!.lien!;
    expect([l.status, l.withdrawnAt]).toEqual(['withdrawn', asked + 30 * MS_DAY]);
    expect(titled(again, 'Your Connecticut Tax Lien Is Withdrawn')).toHaveLength(1);
    drawn(again, StateLienAndPenalty, { year: 2001, state: 'us-ct' });
    expect(drew('tax.lien_dispute')).toEqual([]);
    expect(refusal(again, 'tax.lien_dispute', { state: 'us-ct', year: 2001 })).toBe('It’s been withdrawn.');
    expect(again.ledger.audit()).toEqual([]);
  });
});
