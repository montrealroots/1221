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
import { formatMoney } from '@/engine/core/money';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { TAX_NOTICE_KIND, returnsOf, type TaxReturn } from '@/engine/systems/taxreturn';
import { assessStateNonFiler, fileState, fileStateLien, reconsiderState, stateNonFilerStep, threeYearCheck } from '@/engine/systems/statetax';

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
  const BILL = 'Notice CP14: your 2027 return shows $1,700.39 owed to the IRS, due by April 18, 2028. If you pay by then, nothing is added. After that, interest at 7% a year and a penalty for paying late of 0.5% a month are added to what’s unpaid, and the IRS’s reminders begin 5 weeks after the due date. Pay it on Papers, under Tax Returns.';

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
    expect(titled(sim, 'A Bill From Connecticut DRS').map((n) => [n.at, n.body])).toEqual([[DUE + 30 * MS_DAY, 'DRS Bill: you owe $649.71 on your 2027 Connecticut return. The tax, its 10% penalty and 1% a month of interest are due. You can pay it on Papers, under Tax Returns.']]);
    // Each letter 35 days after the last from the due date, its balance brought up then. Worked from the rule: the
    // penalty 0.5% of $1,700.39 for each month or part since the due date, 2, 3, 4 and 5 months begun at 35, 70, 105 and
    // 140 days ($17.00, $25.50, $34.00, $42.50); the interest 7% a year compounded daily, a 366th a day in 2028, on the
    // tax and what was charged before each letter ($11.42, $23.03, $34.78, $46.66).
    sim.advanceTo(DUE + 35 * MS_DAY + MS_HOUR);
    sim = reload(sim);
    sim.advanceTo(DUE + 140 * MS_DAY + MS_HOUR);
    expect(irsLetters(sim).slice(1)).toEqual([
      ['A Reminder From The IRS', DUE + 35 * MS_DAY, 'Notice CP501: you owe $1,728.81 on your 2027 return. It’s still unpaid, and interest and the late-payment penalty keep adding up. Pay it on Papers, under Tax Returns, or apply for a payment plan there.'],
      ['A Second Reminder From The IRS', DUE + 70 * MS_DAY, 'Notice CP503: you owe $1,748.92 on your 2027 return. The IRS hasn’t heard from you and expects it paid. Pay it on Papers, under Tax Returns, or apply for a payment plan there.'],
      ['The IRS Intends To Levy', DUE + 105 * MS_DAY, 'Notice CP504: you owe $1,769.17 on your 2027 return. The IRS may now take a state refund and certain federal payments without further notice. Paying it, or a payment plan, stops collection.'],
      ['Final Notice Of Intent To Levy', DUE + 140 * MS_DAY, 'Notice LT11: you owe $1,789.55 on your 2027 return. In 30 days the IRS takes what you owe from your bank accounts. Paying it, or a payment plan, stops the levy.'],
    ]);
    // The levy 30 days after the LT11 finds her accounts empty, her money in the CD: six months begun, $51.00, and 30
    // days more of interest, $56.96 in all: $1,808.35 still owed.
    sim.advanceTo(DUE + 170 * MS_DAY + MS_HOUR);
    expect(titled(sim, 'The IRS Levied Your Accounts').map((n) => [n.at, n.body])).toEqual([[DUE + 170 * MS_DAY, 'The IRS took $0.00 from your bank accounts for your 2027 return. You still owe $1,808.35, and it will levy again while you do.']]);
    expect(titled(sim, 'A Bill From The IRS')).toHaveLength(1);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('the same letters, on the same days, for the same sums, whether the clock jumps from filing to past the levy at once or a day at a time', () => {
    const jumped = thaw(unpaid());
    jumped.advanceTo(DUE + 171 * MS_DAY);
    const stepped = thaw(unpaid());
    while (stepped.now < DUE + 171 * MS_DAY) stepped.advanceTo(Math.min(DUE + 171 * MS_DAY, stepped.now + MS_DAY));
    expect(irsLetters(stepped)).toEqual(irsLetters(jumped));
    expect(irsLetters(jumped)).toHaveLength(5);
    expect(ret(stepped).owed).toBe(ret(jumped).owed);
    expect(ret(jumped).owed).toBe(1_808_35);
    expect(titled(stepped, 'The IRS Levied Your Accounts').map((n) => n.at)).toEqual([DUE + 170 * MS_DAY]);
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
    expect(titled(sim, 'A Bill From The IRS').map((n) => [n.at, n.body])).toEqual([[filed, 'Notice CP14: you owe $1,790.51 on your 2027 return, including the penalties and interest since its due date. Until it’s paid, interest at 7% a year and a penalty for paying late of 0.5% a month keep adding up, and the IRS’s reminders begin in 5 weeks. Pay it on Papers, under Tax Returns.']]);
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
    expect(sim.player.taxPlan).toMatchObject({ status: 'refused', why: 'Your bank couldn’t cover the $43.00 setup fee, so the plan wasn’t set up.' });
    expect(titled(sim, 'The IRS Declined Your Payment Plan')).toHaveLength(1);
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
  const SECURED = 'It secured tax you owed when it was filed, so it wasn’t filed in error. It’s released once that’s paid, not withdrawn.';

  it('PLAYER JOURNEY: her Connecticut lien, filed by the clock 60 days after the due date: Papers draws no Ask For Its Withdrawal As Filed In Error and says why in the engine’s words, Ask For Its Release beside it; the command sent anyway is refused and moves nothing', () => {
    const sim = thaw(unpaid());
    const due = at(2028, 4, 18, 23, 59);
    sim.advanceTo(due + 60 * MS_DAY + MS_HOUR);
    expect(ct(sim).lien).toMatchObject({ status: 'filed', filedAt: due + 60 * MS_DAY });
    const screen = papers(sim);
    expect(drew('tax.lien_dispute')).toEqual([]);
    expect(drew('tax.lien_release').map((c) => [c.disabled, c.title])).toEqual([[true, 'You can ask for its release once the balance it secures is paid in full.']]);
    expect(screen).toContain(SECURED);
    expect(screen).not.toContain('Because it was filed in error, you can ask for it to be withdrawn');
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
    expect(shown).toContain('Because it was filed in error, you can ask for it to be withdrawn: DRS releases it with a statement that it was filed in error.');
    expect(shown).not.toContain(SECURED);
    expect(drew('tax.lien_dispute').map((c) => [c.label, c.disabled])).toEqual([['Ask For Its Withdrawal As Filed In Error', false]]);
    const asked = sim.now;
    // Connecticut's 30 days, SLATE's (content/statetax.ts: its days weren't published).
    expect(press('tax.lien_dispute')).toEqual([`Asked. Connecticut DRS decides by ${new Date(asked + 30 * MS_DAY).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: NY })}.`]);
    expect(lien()).toMatchObject({ status: 'disputed', decideAt: asked + 30 * MS_DAY });
    expect(refusal(sim, 'tax.lien_dispute', { state: 'us-ct', year: 2001 })).toMatch(/^You’ve already asked\. A decision is due by /);
    const again = reload(sim);
    again.advanceTo(asked + 30 * MS_DAY + MS_HOUR);
    const l = returnsOf(again.player)['2001']!.stateDue!['us-ct']!.lien!;
    expect([l.status, l.withdrawnAt]).toEqual(['withdrawn', asked + 30 * MS_DAY]);
    expect(titled(again, 'Your Connecticut Tax Lien Is Withdrawn')).toHaveLength(1);
    drawn(again, StateLienAndPenalty, { year: 2001, state: 'us-ct' });
    expect(drew('tax.lien_dispute')).toEqual([]);
    expect(refusal(again, 'tax.lien_dispute', { state: 'us-ct', year: 2001 })).toBe('The lien has already been withdrawn.');
    expect(again.ledger.audit()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// FIXTURE lives for what no student reaches
// ---------------------------------------------------------------------------

const quick = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
/** TEST SETUP: their current account and savings emptied by a posting, as liens-and-arrangements.test.ts's `empty`. */
const empty = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };
/** TEST SETUP: money put in their current account by a posting. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
/** A 2026 year with these wages (TEST SETUP, as payroll records them), the clock at noon on 1 February 2027. */
function withWages(city: string, seed: string, gross: number): Simulation {
  const sim = quick(city, seed);
  recordWages(sim.player, at(2026, 5, 1, 9), NY, { gross });
  while (sim.now < at(2027, 2, 1)) sim.advanceTo(Math.min(at(2027, 2, 1), sim.now + 6 * MS_HOUR));
  return sim;
}
const usd = (cents: number) => formatMoney(cents, 'USD');
/** What a memo's postings put into their own accounts. */
const intoOwn = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).map((t) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).reduce((s, p) => s + p.amount, 0));
/** The IRS's interest by the rule, 7% a year compounded daily over 2027's 365 days (IRC 6622), on an amount over a span. */
const irsInterest2027 = (amount: number, from: number, to: number) => Math.round(amount * ((1 + 0.07 / 365) ** ((to - from) / MS_DAY) - 1));

describe('tax.amend (FIXTURE: New Haven quick-saves with a corrected W-2)', () => {
  it('FIXTURE: $5,000 of wages a corrected W-2 adds, amended on 1 July 2027: the 1040-X’s tax added on 9 September with the IRS’s interest from the 15 April due date, Connecticut’s with its 10% and 1% for each month begun, the IRS’s letters from then, once across a reload', () => {
    const sim = withWages('us-ct-newhaven', 'rt-amend-more', 60_000_00);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const r = returnsOf(sim.player)['2026']!;
    expect([r.owed, r.due]).toEqual([undefined, at(2027, 4, 15, 23, 59)]);
    sim.advanceTo(at(2027, 7, 1));
    expect(refusal(sim, 'tax.amend', { year: 2026 })).toBe('Your return as filed matches what’s on record, so there’s nothing to amend.');
    // FIXTURE: a corrected W-2, $5,000 of wages the return didn't carry.
    yearOf(sim.player, 2026).acting += 5_000_00;
    const amended = sim.must<{ change: number; processAt: number; irs: number; states?: Record<string, number> }>({ kind: 'tax.amend', payload: { year: 2026 } });
    // The IRS takes eight to twelve weeks; SLATE's ten.
    expect(amended.processAt).toBe(at(2027, 7, 1) + 70 * MS_DAY);
    expect(amended.irs).toBeGreaterThan(0);
    const again = reload(sim);
    again.advanceTo(amended.processAt + MS_HOUR);
    const year = returnsOf(again.player)['2026']!;
    // 146.5 days from the due date at 11:59 PM to noon on 9 September, a 365th of 7% a day compounded (2027).
    const interest = irsInterest2027(amended.irs, year.due, amended.processAt);
    expect(year.amended![0]!.interest).toBe(interest);
    expect(year.owed).toBe(amended.irs + interest);
    // Connecticut: 10% of the tax added once past the due date, and 1% of it for each of the five months begun.
    const ctTax = amended.states!['us-ct']!;
    const ctOwed = ctTax + Math.round(0.1 * ctTax) + 5 * Math.round(0.01 * ctTax);
    expect(year.stateDue!['us-ct']!.owed).toBe(ctOwed);
    expect(titled(again, 'Connecticut Processed Your Amended 2026 Return').map((n) => n.body)).toEqual([`${usd(ctTax)} more Connecticut tax, plus what it charges from the due date: ${usd(ctOwed)} in all.`]);
    expect(titled(again, 'Your Amended 2026 Return Is Processed')).toHaveLength(1);
    expect(pending(again, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([amended.processAt + 35 * MS_DAY]);
    expect(again.ledger.audit()).toEqual([]);
  });

  it('FIXTURE: a W-2 that overstated the wages by $5,000, corrected and amended: Connecticut’s part, paid at filing, comes back to her as its refund, and the IRS’s with its interest from the due date', () => {
    const sim = withWages('us-ct-newhaven', 'rt-amend-less', 60_000_00);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const r = returnsOf(sim.player)['2026']!;
    expect(r.owed).toBeUndefined();
    sim.advanceTo(at(2027, 7, 1));
    yearOf(sim.player, 2026).acting -= 5_000_00;
    const amended = sim.must<{ processAt: number; irs: number; states?: Record<string, number> }>({ kind: 'tax.amend', payload: { year: 2026 } });
    sim.advanceTo(amended.processAt + MS_HOUR);
    const ctBack = -amended.states!['us-ct']!;
    expect(ctBack).toBeGreaterThan(0);
    expect(intoOwn(sim, 'Connecticut tax refund, amended 2026 return')).toEqual([ctBack]);
    expect(titled(sim, 'Connecticut Processed Your Amended 2026 Return').map((n) => n.body)).toEqual([`${usd(ctBack)} less Connecticut tax. ${usd(ctBack)} is refunded.`]);
    // The IRS's from the later of the due date and the filing, the due date here.
    const irsBack = -amended.irs;
    expect(intoOwn(sim, 'Tax refund, amended 2026 return, with interest')).toEqual([irsBack + irsInterest2027(irsBack, r.due, amended.processAt)]);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('FIXTURE: an amendment’s new tax of two monthly payments or less joins the IRS plan in force: no CP523, the plan kept at its payment, its history saying what joined', () => {
    const sim = withWages('us-ct-newhaven', 'rt-amend-join', 60_000_00);
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    expect(returnsOf(sim.player)['2026']!.owed).toBeGreaterThan(0);
    // TEST SETUP: enough in the bank for the fee, its payments and her living to the amendment.
    fund(sim, 15_000_00);
    const applied = sim.must<{ decideAt: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: 500_00 } });
    sim.advanceTo(applied.decideAt + MS_HOUR);
    expect(sim.player.taxPlan!.status).toBe('active');
    sim.advanceTo(at(2027, 7, 1));
    // FIXTURE: a corrected W-2 with $1,000 more of wages, its tax well under two payments of $500.
    yearOf(sim.player, 2026).acting += 1_000_00;
    const amended = sim.must<{ processAt: number; irs: number }>({ kind: 'tax.amend', payload: { year: 2026 } });
    fund(sim, 5_000_00);
    sim.advanceTo(amended.processAt + MS_HOUR);
    const joined = amended.irs + irsInterest2027(amended.irs, returnsOf(sim.player)['2026']!.due, amended.processAt);
    expect(joined).toBeLessThanOrEqual(2 * 500_00);
    const plan = sim.player.taxPlan!;
    expect([plan.status, plan.monthly]).toEqual(['active', 500_00]);
    expect(plan.history.filter((x) => x.what === 'New tax joined the plan').map((x) => x.amount)).toEqual([joined]);
    expect(titled(sim, 'Notice CP523: Your Payment Plan')).toEqual([]);
  });
});

describe('tax.catch_up_state_plan (FIXTURE: a New York quick-save)', () => {
  /** New York's plan over 12 months, its first payment missed with the bank emptied: behind, to be made up by the next due date. */
  function behind(seed: string) {
    const sim = withWages('us-ny-newyork', seed, 60_000_00);
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-ny', months: 12 } });
    sim.advanceTo(sim.now + MS_HOUR);
    const plan = sim.player.statePlans!['us-ny']!;
    expect(plan.status).toBe('active');
    const missedAt = plan.nextDue!;
    empty(sim);
    sim.advanceTo(missedAt + MS_HOUR);
    expect([plan.status, plan.endsBy]).toEqual(['missed', missedAt + 30 * MS_DAY]);
    return { sim, endsBy: plan.endsBy!, monthly: plan.monthly };
  }

  it('FIXTURE: its payment missed, Catch Up drawn on Papers and pressed: the plan in force past the day it would have ended, its next payment taken, across a reload; its twin left behind ends that day', () => {
    const { sim, endsBy, monthly } = behind('rt-ny-catch');
    papers(sim);
    expect(drew('tax.catch_up_state_plan')).toHaveLength(1);
    // TEST SETUP: the payment's money back in the bank, and a month's living besides.
    fund(sim, 3_000_00 + monthly);
    const caughtAt = sim.now;
    expect(press('tax.catch_up_state_plan')).toEqual([`Caught up: ${usd(monthly)} paid. The plan is back in force.`]);
    const plan = () => again.player.statePlans!['us-ny']!;
    const again = reload(sim);
    expect([plan().status, plan().endsBy]).toEqual(['active', undefined]);
    // GUARD: caught up twice, refused, nothing taken.
    const before = still(again);
    expect(refusal(again, 'tax.catch_up_state_plan', { state: 'us-ny' })).toBe('That plan isn’t behind, so there’s nothing to catch up.');
    expect(still(again)).toBe(before);
    again.advanceTo(endsBy + MS_HOUR);
    expect(plan().status).toBe('active');
    expect(titled(again, 'New York DTF Ended Your Plan')).toEqual([]);
    again.advanceTo(caughtAt + 30 * MS_DAY + MS_HOUR);
    expect(plan().history.filter((x) => x.what === 'A payment' || x.what === 'Caught up').map((x) => [x.what, x.amount])).toEqual([['Caught up', monthly], ['A payment', monthly]]);

    const twin = behind('rt-ny-catch').sim;
    twin.advanceTo(endsBy + MS_HOUR);
    expect(twin.player.statePlans!['us-ny']!).toMatchObject({ status: 'ended', why: 'Ended: not caught up' });
    expect(titled(twin, 'New York DTF Ended Your Plan')).toHaveLength(1);
  });
});

describe('tax.federal_lien_withdraw (FIXTURE: a New York quick-save owing over $10,000)', () => {
  it('FIXTURE: the IRS’s own return assessed for a year never filed, its lien filed at the LT11; her own return in its place shows the withholding paid it all: Ask For Its Release As Erroneous is drawn and pressed at once, released as erroneous 14 days on, across a reload, and not asked twice', () => {
    const sim = quick('us-ny-newyork', 'rt-fed-error');
    recordWages(sim.player, at(2026, 5, 1, 9), NY, { gross: 150_000_00 });
    // Never filed: the IRS's substitute a year after the 15 April 2027 due date, assessed 120 days on, its letters 35
    // days apart, the LT11 140 days after the assessment, which files the notice of lien on over $10,000.
    const due = at(2027, 4, 15, 23, 59);
    const assessedAt = due + (365 + 120) * MS_DAY;
    sim.advanceTo(assessedAt + MS_HOUR);
    const r = () => returnsOf(sim.player)['2026']!;
    expect(r().substitute).toBe(true);
    sim.advanceTo(assessedAt + 140 * MS_DAY + MS_HOUR);
    expect(r().lien).toMatchObject({ status: 'filed', filedAt: assessedAt + 140 * MS_DAY });
    expect(r().lien!.amount).toBeGreaterThanOrEqual(10_000_00);
    drawn(sim, FederalLien, { year: 2026 });
    expect(drew('tax.federal_lien_withdraw').map((c) => [c.label, c.disabled])).toEqual([['Ask For Its Withdrawal (Form 12277)', true]]);
    // GUARD: the IRS's own return isn't amended (Papers draws no Amend The Return… on it), and nothing moves.
    const before = still(sim);
    expect(refusal(sim, 'tax.amend', { year: 2026 })).toBe('The IRS filed this one. File your own return to replace it.');
    expect(still(sim)).toBe(before);
    // TEST SETUP: the withholding her employer reported and the IRS's figures missed, all of the year's tax and more.
    yearOf(sim.player, 2026).withheld += 60_000_00;
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    expect([r().substitute, r().owed]).toEqual([false, undefined]);
    drawn(sim, FederalLien, { year: 2026 });
    expect(drew('tax.federal_lien_withdraw').map((c) => [c.label, c.disabled])).toEqual([['Ask For Its Release As Erroneous', false]]);
    const asked = sim.now;
    expect(press('tax.federal_lien_withdraw')).toEqual([`Asked for its release as erroneous. The IRS decides by ${new Date(asked + 14 * MS_DAY).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: NY })}.`]);
    expect(r().lien).toMatchObject({ status: 'disputed', decideAt: asked + 14 * MS_DAY });
    // GUARD: asked twice.
    expect(refusal(sim, 'tax.federal_lien_withdraw', { year: 2026 })).toMatch(/^You’ve already asked\. The IRS decides by /);
    const again = reload(sim);
    again.advanceTo(asked + 14 * MS_DAY + MS_HOUR);
    const lien = returnsOf(again.player)['2026']!.lien!;
    expect([lien.status, lien.withdrawnAt]).toEqual(['withdrawn', asked + 14 * MS_DAY]);
    expect(titled(again, 'Your Federal Tax Lien Is Withdrawn').map((n) => n.body)).toEqual(['The IRS withdrew the notice of federal tax lien on your 2026 return, because it was filed in error. A withdrawn notice is treated as if it had never been filed.']);
    // The release after payment its own return set in motion doesn't turn it back.
    again.advanceTo(asked + 31 * MS_DAY);
    expect(returnsOf(again.player)['2026']!.lien!.status).toBe('withdrawn');
    expect(refusal(again, 'tax.federal_lien_withdraw', { year: 2026 })).toBe('The lien has already been withdrawn.');
  }, 120_000);
});

describe('tax.request_waiver (FIXTURE: Portland quick-saves, Oregon’s three years)', () => {
  /** Three years, 2001 to 2003, each owing Oregon $1,000 with no return of their own, each due a year apart before now. */
  function threeYears(seed: string) {
    const sim = quick('us-or-portland', seed);
    const rs = [2001, 2002, 2003].map((y) => { const r = { year: y, due: sim.now - (3 - (y - 2001)) * 365 * MS_DAY, figures: { income: 50_000_00, balance: 1_000_00, states: [{ state: 'us-or', tax: 1_000_00, credit: 0 }], owedTo: { irs: 0, states: { 'us-or': 1_000_00 } } } } as unknown as TaxReturn; sim.player.returns = { ...(sim.player.returns ?? {}), [String(y)]: r }; return r; });
    return { sim, rs };
  }

  it('FIXTURE: her own 2001 return filed before any notice, paid at filing: 70% of the three-year penalty waived and refunded to her, $525 of $750', () => {
    const { sim, rs } = threeYears('rt-or-70');
    threeYearCheck(sim, sim.player, 'us-or', 2003, () => 1_000_00);
    // Her own, three years late: 5% for paying late and 20% for filing past three months late, $250 (ORS 314.400(1),
    // (2)), so the 100% has $750 of room under the year's tax.
    fileState(sim, sim.player, rs[0]!, 'us-or', 1_000_00);
    expect(rs[0]!.stateDue!['us-or']!.threeYear!.amount).toBe(750_00);
    expect(rs[0]!.stateDue!['us-or']!.owed).toBeUndefined();
    sim.must({ kind: 'tax.request_waiver', payload: { state: 'us-or', year: 2001 } });
    expect(rs[0]!.stateDue!['us-or']!.threeYear!.waived).toBe(525_00);
    expect(intoOwn(sim, 'Oregon DOR: a penalty waived and refunded')).toEqual([525_00]);
    // GUARD: decided once.
    const before = still(sim);
    expect(refusal(sim, 'tax.request_waiver', { state: 'us-or', year: 2001 })).toBe('Its waiver has already been decided.');
    expect(still(sim)).toBe(before);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('FIXTURE: its Demand To File sent, then her own return, unpaid: 50% waived off the penalty owed, $375 of $750', () => {
    const { sim, rs } = threeYears('rt-or-50');
    empty(sim);
    threeYearCheck(sim, sim.player, 'us-or', 2003, () => 1_000_00);
    // The non-filer's first letter, as the clock sends it.
    stateNonFilerStep(sim, sim.player, rs[0]!, 'us-or', 0, 1_000_00);
    expect(rs[0]!.lettersSent).toEqual({ 'us-or': 1 });
    fileState(sim, sim.player, rs[0]!, 'us-or', 1_000_00);
    const sd = rs[0]!.stateDue!['us-or']!;
    expect([sd.threeYear!.amount, sd.parts!.penalty]).toEqual([750_00, 1_000_00]);
    sim.must({ kind: 'tax.request_waiver', payload: { state: 'us-or', year: 2001 } });
    expect([sd.threeYear!.waived, sd.parts!.penalty]).toEqual([375_00, 625_00]);
  });

  it('FIXTURE: assessed, $990 paid toward its $1,000 of penalties, then 25% of the $500 three-year penalty waived: $10 off what’s still owed of it and the $115 already paid credited to the interest; until 2026-10-16 the $115 was dropped', () => {
    const { sim, rs } = threeYears('rt-or-excess');
    for (const r of rs) assessStateNonFiler(sim, sim.player, r, 'us-or', 1_000_00);
    threeYearCheck(sim, sim.player, 'us-or', 2003, () => 1_000_00);
    reconsiderState(sim, sim.player, rs[0]!, 'us-or', 1_000_00);
    const sd = rs[0]!.stateDue!['us-or']!;
    // The assessment's 5%, 20% and 25% for not filing on demand ($500), and the three-year 100% held to the year's tax,
    // $500 more; the interest charged since the due date.
    expect([sd.parts!.tax, sd.parts!.penalty, sd.threeYear!.amount]).toEqual([1_000_00, 1_000_00, 500_00]);
    const interest = sd.parts!.interest;
    // Oregon takes a payment to the penalty first (ORS 305.265(13)).
    fund(sim, 990_00);
    sim.must({ kind: 'tax.pay_state', payload: { state: 'us-or', year: 2001, amount: 990_00 } });
    expect(sd.parts).toEqual({ tax: 1_000_00, penalty: 10_00, interest });
    const owedBefore = sd.owed!;
    sim.must({ kind: 'tax.request_waiver', payload: { state: 'us-or', year: 2001 } });
    // 25% of $500 waived, after the assessment: $125, of which $10 still owed and $115 paid, credited to the interest.
    expect(sd.threeYear!.waived).toBe(125_00);
    expect(sd.parts).toEqual({ tax: 1_000_00, penalty: 0, interest: interest - 115_00 });
    expect(sd.owed).toBe(owedBefore - 125_00);
    expect(sd.payments!.at(-1)).toMatchObject({ amount: 115_00, tax: 0, penalty: 0, interest: 115_00, how: 'refund offset' });
    expect(titled(sim, 'Oregon DOR Waived Part Of Your Penalty').map((n) => n.body)).toEqual(['$125.00 of the three-year penalty on your 2001 return is waived: 25%, by its schedule. The $115.00 you’d paid toward it goes to what you still owe on the year.']);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// tax.other_refusals: what no screen sends, each a GUARD
// ---------------------------------------------------------------------------

describe('tax.other_refusals', () => {
  it('GUARD: a return filed twice, a year with no return, and one not filed amended: refused in their words, nothing moved, no second bill', () => {
    const sim = thaw(unpaid());
    const before = still(sim);
    // File It is gone from the year once it's filed, and its question answered; a second press is a duplicate.
    papers(sim);
    expect(drew('tax.file')).toEqual([]);
    expect(refusal(sim, 'tax.file', { year: 2027 })).toBe('You’ve already filed it. To change it, file an amended return.');
    expect(refusal(sim, 'tax.file', { year: 2025 })).toBe('There’s no return for that year.');
    expect(still(sim)).toBe(before);
    expect(titled(sim, 'A Bill From The IRS')).toHaveLength(1);
    // Amend The Return… is drawn only on a year filed; the command on one that isn't (her 2027 before 1 February 2028).
    const early = thaw(base());
    const unfiled = still(early);
    expect(refusal(early, 'tax.amend', { year: 2027 })).toBe('It isn’t filed yet. File it first.');
    expect(still(early)).toBe(unfiled);
  });

  it('GUARD: a payment on a year paid, of nothing, and to Connecticut on a year it’s owed nothing: refused, nothing moved', () => {
    const paid = thaw(base());
    // Her 2026 return's $3.35 to Connecticut was paid at filing; the IRS was owed nothing.
    const before = still(paid);
    expect(refusal(paid, 'tax.pay', { year: 2026 })).toBe('That year is already paid.');
    expect(refusal(paid, 'tax.pay_state', { state: 'us-ct', year: 2026 })).toBe('You owe Connecticut DRS nothing on that year.');
    expect(still(paid)).toBe(before);
    const owing = thaw(unpaid());
    const owed = still(owing);
    expect(refusal(owing, 'tax.pay', { year: 2027, amount: 0 })).toBe('Enter an amount above zero.');
    expect(refusal(owing, 'tax.pay', { year: 2027, amount: -1_00 })).toBe('Enter an amount above zero.');
    expect(still(owing)).toBe(owed);
  });

  it('GUARD: the IRS’s plan limits, which no student’s balance reaches (FIXTURE: $400,000 of wages, unpaid): a monthly plan over $50,000 and a short-term one at $100,000 or more refused, nothing set', () => {
    const sim = withWages('us-ny-newyork', 'rt-plan-max', 400_000_00);
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    expect(returnsOf(sim.player)['2026']!.owed).toBeGreaterThan(100_000_00);
    const before = still(sim);
    expect(refusal(sim, 'tax.apply_plan', { kind: 'long' })).toBe('A Simple Payment Plan is for $50,000 or less. A larger balance needs a financial statement, which the game doesn’t offer.');
    expect(refusal(sim, 'tax.apply_plan', { kind: 'short' })).toBe('A short-term plan is for less than $100,000.');
    expect(still(sim)).toBe(before);
    expect(sim.player.taxPlan).toBeUndefined();
  });

  it('GUARD: a revision once more than $50,000 is owed (FIXTURE: an amendment adding $200,000 of wages to a year under a plan): refused, no fee taken', () => {
    const sim = withWages('us-ct-newhaven', 'rt-revise-max', 60_000_00);
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    fund(sim, 15_000_00);
    const applied = sim.must<{ decideAt: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: 500_00 } });
    sim.advanceTo(applied.decideAt + MS_HOUR);
    sim.advanceTo(at(2027, 7, 1));
    yearOf(sim.player, 2026).acting += 200_000_00;
    const amended = sim.must<{ processAt: number }>({ kind: 'tax.amend', payload: { year: 2026 } });
    fund(sim, 5_000_00);
    sim.advanceTo(amended.processAt + MS_HOUR);
    expect(sim.player.taxPlan!.status).toBe('default');
    const before = still(sim);
    expect(refusal(sim, 'tax.revise_plan', { monthly: 5_000_00 })).toBe('You owe more than $50,000 now. A revision would need a financial statement, which the game doesn’t offer.');
    expect(still(sim)).toBe(before);
  });

  it('GUARD: the Social Security office’s four its panel never sends: a citizen, an application on its way, a card come, and someone not on an F-1', () => {
    const citizen = thaw(base());
    expect(refusal(citizen, 'documents.apply_ssn')).toBe('As a US citizen, you already have a Social Security number.');
    const london = createSave(1, 'rt-ssn-guard', { ...withFamily(newLifeConfig(), 'scraping'), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    london.advanceTo(at(2026, 8, 30, 12));
    const applied = london.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    const before = still(london);
    expect(refusal(london, 'documents.apply_ssn')).toBe('You’ve already applied, and the card is on its way.');
    expect(still(london)).toBe(before);
    london.advanceTo(applied.arrivesAt + MS_HOUR);
    expect(refusal(london, 'documents.apply_ssn')).toBe('Your Social Security card has already come.');
    // FIXTURE: a British citizen living in New York, not at school, so on no F-1: no number to apply for.
    const visitor = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'uk-eng-london', livesWhereBorn: false, wealth: 'wealthy' }, 'rt-ssn-visitor');
    expect(refusal(visitor, 'documents.apply_ssn')).toBe('A number is only for someone allowed to work in the US.');
  });
});
