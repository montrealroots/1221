/**
 * The tax and documents rows of Papers, completed on 2026-10-15 for the current scope (docs/verification/scope/taxpapers-checklist.json,
 * docs/verification/scope/taxpapers-result.json). Until 2026-10-14 a student owed nobody a balance she could be billed for, and every row
 * here was reached by a return or wages put on by hand. From 2026-10-14 creation offers the family, and a student with
 * need owes the IRS $1,700.39 and Connecticut $585.33 on her 2027 return (tests/evidence3-home.test.ts works both by
 * hand), so these rows were played on that life:
 *
 * - `tax.revise_plan` and `tax.catch_up_plan`: the IRS's monthly plan applied for on Papers, $23.62 a month (what's owed
 *   over 72 months), no setup fee at the low-income rate; its first payment missed because her money was in a CD,
 *   Notice CP523; caught up, or revised for the IRS's $6, and kept in force past the date it would have ended, its next
 *   payment taken at the amount it was set to; or left behind, and ended.
 * - `tax.pay_state`, `tax.lien_release`: Connecticut's bill, its notice of intent and its lien by the clock; a part paid
 *   to the penalty, then the interest, then the tax, refused past what's owed or the bank; the rest paid on Papers; the
 *   release asked once, and the lien released 30 days on, no levy after.
 * - `tax.apply_state_plan`: Connecticut's plan asked for on Papers, decided at once, paid to the end; missed, ended at
 *   once; refused outside 2 to 12 months, twice, and while a levied year is still owed.
 * - What no student reaches, shown by play to stay shut: `tax.catch_up_state_plan` (Connecticut ends a plan at its
 *   first missed payment, so none is ever behind), `tax.lien_dispute` (a Connecticut lien always secures tax still
 *   owed), `tax.federal_lien_withdraw` (her LT11 is for $1,746.41, the IRS's notice of lien for $10,000 or more),
 *   `tax.request_waiver` (Oregon's alone) and `tax.amend` (nothing played changes a filed year).
 * - `documents.apply_ssn`: on a London-born student's played 1040-NR, the refund from her scholarship's withholding
 *   held seven weeks more without the card, and the IRS's plan applied for online with it, by Form 9465 without.
 *
 * Three defects were found and fixed on 2026-10-15, each held by a test here that failed before:
 * - Connecticut's collection began at filing, so a return filed on 1 February 2028 unpaid had DRS's bill on 2 March and
 *   its lien and notice of intent to levy on 1 April, before the 18 April due date. Connecticut collects a tax "due
 *   and unpaid" (Conn. Gen. Stat. 12-734) once unpaid "within thirty days from its due date" (12-35(a)); both statutes
 *   were read at codes.findlaw.com on 2026-10-15. Its notices now run from the due date (`stateNextNotice`).
 * - Connecticut refused a plan to anyone it had ever levied: her 2026 return's $3.35 taken by levy in 2027 kept a plan
 *   from her 2027 return's $585.33 in 2028. Only a levied year still owed refuses it now (`statePlanRefusal`).
 * - A save opened while the IRS's plan was behind put an IRS letter on the calendar (`armCollection`), and the plan's
 *   end put a second beside it: two letters coming for one year. A plan pending, in force or behind holds it now.
 *
 * And two more on the same day, after an independent check of these rows:
 * - Connecticut's interest ran in fractions of a cent and the whole was rounded, so a cent of the penalty's rounding went
 *   to the interest: her bill was $649.72, its interest $5.86, where 1% of $585.33 is $5.85. Each month's 1% is to the
 *   cent now (`stateAccrual`), and the bill $649.71.
 * - A state's penalty, interest and collection ran from the federal return's due date, which on a 1040-NR without wages
 *   is 15 June; Connecticut's return is due in mid-April all the same (Conn. Gen. Stat. 12-719(a)). They run from the
 *   state's date now (`stateDueOf`).
 *
 * The IRS's letters still begin five weeks after filing, before the due date for a return filed early: that was left
 * to the owner on 2026-10-15 (`nextNotice`), and nothing here asserts it either way.
 *
 * Every figure is worked here from the rule, never asked of the engine's helper: the IRS's least monthly payment is
 * $1,700.39 over 72 months, rounded up, $23.62 (SLATE's term, said); its low-income fee is $0 by direct debit for income
 * of 2.5 times the poverty line or less (IRS.gov, Payment plans; the engine's 2026 line, $15,960, held for 2027, so
 * $39,900, over her $32,336.56); Connecticut's penalty is 10% of the tax unpaid at the due date, once, and its interest
 * 1% of the tax for each month or part of one from it (Conn. Gen. Stat. 12-735; a month is 30.4375 days in this
 * engine), a payment going to the penalty, then the interest, then the tax (12-39h).
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`, the Scraping family chosen as creation's select
 * chooses it, `withFamily`), Ada Cole, she/her, born in New York, an actress at Yale in New Haven from Monday 24 August
 * 2026, seed r3-tax-scraping (tests/evidence3-home.test.ts's, whose figures it shares). Her coursework is left to the
 * clock, as that test leaves it, so she is dismissed on 10 December 2027 and spends 2028 at home in New Haven with no
 * income, her 2027 return still to settle. Played by the clock, by the
 * commands the screens send, and by Papers rendered as the player has it (react-dom/server), its Gated buttons
 * pressed by their own onClick. Her 2026 return is filed on 1 February 2027, its $3.35 paid at filing, except on the
 * life that leaves it to Connecticut's levy. In February 2028 she moves her savings into her checking and the checking
 * into a Chase CD, the Bank screen's commands, and files 2027 with nothing to pay it from; breaking the CD early is how
 * she pays later.
 *
 * TEST SETUP: one, said where it stands: the 1040-NR's June due date, which no played life with Connecticut owed reaches.
 * Every other balance, plan, notice, refund and lien here is reached by play.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, MS_HOUR, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeConfig, withFamily } from '@/engine/world/bootstrap';
import { TAX_NOTICE_KIND, TAX_PLAN_KIND } from '@/engine/systems/taxreturn';
import { STATE_NOTICE_KIND, statePartsOn } from '@/engine/systems/statetax';
import { STATE_TAX } from '@/engine/content/statetax';
import { earningsOf } from '@/engine/systems/earnings';

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
const { WorkPane } = await import('@/ui/papers/Documents');

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
const cdOf = (sim: Simulation): Account => sim.ledger.accountsOf(sim.player.id).find((a) => a.category === 'term' && !a.closedAt)!;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
const refusal = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload }).error;
/** What a memo's transactions took from her checking, in order. */
const fromChecking = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).map((t) => -t.postings.filter((p) => p.accountId === checkingOf(sim).id).reduce((s, p) => s + p.amount, 0));

/** Papers as the player has it; the Gated buttons it drew are in `h.clicks`. */
function papers(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(PapersWorkspace as FunctionComponent)));
}
/** Papers' Documents pane, its Work panel with the Social Security number, as the player has it. */
function documents(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(WorkPane as FunctionComponent)));
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

/** Her 2027 return filed on Papers with nothing to pay it from: $1,700.39 owed to the IRS and $585.33 to Connecticut. */
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
/** The CD broken early, its money in her checking. */
const breakCd = (sim: Simulation) => { sim.must({ kind: 'bank.break_term', payload: { accountId: cdOf(sim).id } }); expect(checkingOf(sim).balance).toBeGreaterThan(40_000_00); };

// ---------------------------------------------------------------------------
// The IRS's monthly plan: missed, caught up, revised, left behind
// ---------------------------------------------------------------------------

describe('tax.catch_up_plan and tax.revise_plan', () => {
  /** Applied for on Papers on 1 February, its first payment, 2 March, missed: kept on 10 March. */
  const behind = once(() => {
    const sim = thaw(unpaid());
    papers(sim);
    expect(press('tax.apply_plan')).toEqual(['Applied: answered by February 1, 2028.']);
    sim.advanceTo(sim.now + 2 * 60_000);
    const p = sim.player.taxPlan!;
    // $1,700.39 over 72 months, rounded up; no fee, her $32,336.56 under 2.5 times $15,960, by direct debit.
    expect([p.status, p.monthly, p.fee, p.covers]).toEqual(['active', 23_62, 0, 1_700_39]);
    expect(p.nextDue).toBe(at(2028, 2, 1, 12) + 60_000 + 30 * MS_DAY);
    sim.advanceTo(at(2028, 3, 10, 12));
    expect(p.status).toBe('default');
    expect(p.defaultBy).toBe(p.nextDue! + 30 * MS_DAY);
    expect(titled(sim, 'Notice CP523: A Payment Missed').map((n) => n.body)).toEqual(['The bank couldn’t pay $23.62. Catch up by April 1, 2028, on Papers, or the plan ends and collection resumes.']);
    expect(ret(sim).owed).toBe(1_700_39);
    return freeze(sim);
  });

  it('PLAYER JOURNEY: caught up on Papers once the CD is broken: $23.62 paid, the plan in force past 1 April, when it would have ended, and its next payment taken on 9 April, across a reload', () => {
    const sim = thaw(behind());
    const p = sim.player.taxPlan!;
    const oldDefault = p.defaultBy!;
    papers(sim);
    // Her money is in the CD: refused, nothing paid.
    press('tax.catch_up_plan');
    expect(refusal(sim, 'tax.catch_up_plan')).toBe('$23.62 is more than the bank can cover.');
    expect([p.status, ret(sim).owed]).toEqual(['default', 1_700_39]);
    breakCd(sim);
    papers(sim);
    expect(press('tax.catch_up_plan')).toEqual(['Caught up: $23.62 paid.']);
    expect([p.status, p.defaultBy]).toEqual(['active', undefined]);
    // Before the due date nothing has grown: the $23.62 comes off the tax.
    expect(ret(sim).owed).toBe(1_700_39 - 23_62);
    expect(ret(sim).payments!.at(-1)).toMatchObject({ amount: 23_62, tax: 23_62, penalty: 0, interest: 0, how: 'payment' });
    expect(fromChecking(sim, 'IRS payment plan, caught up')).toEqual([23_62]);
    expect(pending(sim, TAX_PLAN_KIND).map((i) => i.at)).toEqual([at(2028, 3, 10, 12) + 30 * MS_DAY]);
    expect(refusal(sim, 'tax.catch_up_plan')).toBe('Your plan isn’t behind.');
    const again = reload(sim);
    again.advanceTo(oldDefault + MS_HOUR);
    expect(again.player.taxPlan!.status).toBe('active');
    expect(titled(again, 'Your IRS Payment Plan Has Ended')).toEqual([]);
    again.advanceTo(at(2028, 4, 9, 13));
    expect(again.player.taxPlan!.history.filter((x) => x.what === 'A payment').map((x) => x.amount)).toEqual([23_62]);
    expect(ret(again).owed).toBe(1_700_39 - 2 * 23_62);
    expect(again.ledger.audit()).toEqual([]);
  });

  it('PLAYER JOURNEY: revised on Papers for the IRS’s $6 once the CD is broken: in force again with the missed $23.62 still owed, past 1 April, and its next payment taken on 9 April at the amount it was revised to; below the least, or with no $6 in the bank, refused', () => {
    const sim = thaw(behind());
    const p = sim.player.taxPlan!;
    const oldDefault = p.defaultBy!;
    expect(refusal(sim, 'tax.revise_plan', { monthly: 23_61 })).toBe('The least a month is $23.62.');
    expect(refusal(sim, 'tax.revise_plan')).toBe('The $6.00 fee is more than the bank can cover.');
    expect([p.status, p.monthly]).toEqual(['default', 23_62]);
    breakCd(sim);
    sim.must({ kind: 'tax.revise_plan', payload: { monthly: 100_00 } });
    expect([p.status, p.defaultBy, p.monthly, p.covers]).toEqual(['active', undefined, 100_00, 1_700_39]);
    expect(fromChecking(sim, 'IRS payment plan revision fee')).toEqual([6_00]);
    // The missed payment isn't made: the revision puts the plan back in force with it still owed.
    expect(ret(sim).owed).toBe(1_700_39);
    expect(pending(sim, TAX_PLAN_KIND).map((i) => i.at)).toEqual([at(2028, 3, 10, 12) + 30 * MS_DAY]);
    // Revised again on Papers, the box left blank: the least a month, $23.62, for $6 more.
    papers(sim);
    expect(press('tax.revise_plan')).toEqual(['Revised to $23.62 a month, for a fee of $6.00.']);
    expect(fromChecking(sim, 'IRS payment plan revision fee')).toEqual([6_00, 6_00]);
    sim.must({ kind: 'tax.revise_plan', payload: { monthly: 100_00 } });
    const again = reload(sim);
    again.advanceTo(oldDefault + MS_HOUR);
    expect(again.player.taxPlan!.status).toBe('active');
    expect(titled(again, 'Your IRS Payment Plan Has Ended')).toEqual([]);
    again.advanceTo(at(2028, 4, 9, 13));
    expect(again.player.taxPlan!.history.filter((x) => x.what === 'A payment').map((x) => x.amount)).toEqual([100_00]);
    expect(ret(again).owed).toBe(1_700_39 - 100_00);
    expect(again.ledger.audit()).toEqual([]);
  });

  it('PLAYER JOURNEY: left behind, it ends on 1 April, 30 days after the missed payment, neither Catch Up nor Revise offered or taken, and one IRS letter coming, though the save was opened while it was behind: until 2026-10-15 two', () => {
    const sim = thaw(behind());
    const p = sim.player.taxPlan!;
    const end = p.defaultBy!;
    sim.advanceTo(end + MS_HOUR);
    expect([p.status, p.why]).toEqual(['ended', 'Ended: not caught up after CP523']);
    expect(titled(sim, 'Your IRS Payment Plan Has Ended')).toHaveLength(1);
    papers(sim);
    expect([drew('tax.catch_up_plan'), drew('tax.revise_plan')]).toEqual([[], []]);
    expect(refusal(sim, 'tax.catch_up_plan')).toBe('Your plan isn’t behind.');
    expect(refusal(sim, 'tax.revise_plan')).toBe('Only a monthly plan in force is revised.');
    // Collection back at the LT11, five weeks on: one letter, though the save was opened while the plan was behind.
    // Until 2026-10-15 opening it put a second on the calendar beside it (`armCollection`).
    expect(pending(sim, TAX_NOTICE_KIND).map((i) => i.at)).toEqual([end + 35 * MS_DAY]);
  });
});

// ---------------------------------------------------------------------------
// Connecticut: its collection, a payment, its lien and its release
// ---------------------------------------------------------------------------

describe('tax.pay_state and tax.lien_release', () => {
  it('PLAYER JOURNEY: filed on 1 February unpaid, Connecticut’s bill waits for the 18 April due date and comes 30 days after it, $649.71, and its lien and notice of intent 30 days later, $655.56: until 2026-10-15 they came on 2 March and 1 April, and the bill said $649.72', () => {
    const sim = thaw(unpaid());
    const due = ret(sim).due;
    expect(due).toBe(at(2028, 4, 18, 23, 59));
    expect(pending(sim, STATE_NOTICE_KIND).map((i) => i.at)).toEqual([due + 30 * MS_DAY]);
    sim.advanceTo(due - MS_HOUR);
    expect(titled(sim, 'A Bill From Connecticut DRS')).toEqual([]);
    expect(ct(sim).lien).toBeUndefined();
    sim.advanceTo(due + 30 * MS_DAY + MS_HOUR);
    // A month begun: $585.33, its 10% ($58.533, $58.53) and 1% ($5.8533, $5.85), $649.71. Until 2026-10-15 the engine
    // rounded the whole, $649.7163, to $649.72 and gave the interest the $5.86 left.
    expect(titled(sim, 'A Bill From Connecticut DRS').map((n) => [n.at, n.body])).toEqual([[due + 30 * MS_DAY, 'DRS Bill: $649.71 on your 2027 Connecticut return; the tax, its 10% penalty and 1% a month of interest are due.']]);
    // Read from the bill, three months begun on 2 July: each month's 1% to the cent, $5.85 three times, $17.55, as charged
    // a month at a time on the life that plays to 25 June below. Until 2026-10-15 the same read was $17.57.
    expect(statePartsOn(ct(sim), due, due + 75 * MS_DAY)).toEqual({ tax: 585_33, penalty: 58_53, interest: 17_55 });
    sim.advanceTo(due + 60 * MS_DAY + MS_HOUR);
    // Two months begun: each month's 1%, $5.85, twice, $11.70, $655.56.
    expect(ct(sim).lien).toMatchObject({ status: 'filed', amount: 655_56, filedAt: due + 60 * MS_DAY });
    expect(titled(sim, 'Connecticut DRS Intends To Levy').map((n) => n.at)).toEqual([due + 60 * MS_DAY]);
  });

  it('PLAYER JOURNEY: a part refused in March with her money in the CD; on 25 June, three months begun, $661.41 owed: $100 goes to the $58.53 penalty, the $17.55 interest and $23.92 of tax; more than is owed refused; the rest paid on Papers; the levy pending for 17 July taken off the calendar; the lien’s release asked once and given on 25 July, and no levy, across a reload', () => {
    const sim = thaw(unpaid());
    // In March, before anything of Connecticut's is due, her money is in the CD: a part refused. She breaks the CD.
    sim.advanceTo(at(2028, 3, 10, 12));
    expect(refusal(sim, 'tax.pay_state', { state: 'us-ct', year: 2027, amount: 100_00 })).toBe('$100.00 is more than the bank can cover.');
    breakCd(sim);
    sim.advanceTo(at(2028, 6, 25, 12));
    const sd = ct(sim);
    const lien = sd.lien!;
    papers(sim);
    // Its lien filed on 17 June, and the levy pending 30 days on, 17 July: what paying in full is to stop.
    expect(lien).toMatchObject({ status: 'filed', filedAt: ret(sim).due + 60 * MS_DAY });
    expect(pending(sim, STATE_NOTICE_KIND).map((i) => i.at)).toEqual([ret(sim).due + 90 * MS_DAY]);
    // Shut until it's paid, each with its reason.
    expect(drew('tax.lien_release').map((c) => [c.disabled, c.title])).toEqual([[true, 'It’s released once the balance it secures is paid in full.']]);
    expect(drew('tax.lien_dispute').map((c) => [c.disabled, c.title])).toEqual([[true, 'It secured tax owed when it was filed: it’s released once that’s paid, not withdrawn.']]);
    expect(sim.must({ kind: 'tax.pay_state', payload: { state: 'us-ct', year: 2027, amount: 100_00 } })).toEqual({ paid: 100_00, owed: 561_41, tax: 23_92, penalty: 58_53, interest: 17_55 });
    expect(refusal(sim, 'tax.pay_state', { state: 'us-ct', year: 2027, amount: 561_42 })).toBe('$561.41 is owed to Connecticut DRS; pay that or less.');
    expect(refusal(sim, 'tax.pay_state', { state: 'us-ct', year: 2027, amount: 0 })).toBe('Pay something.');
    papers(sim);
    expect(press('tax.pay_state')).toEqual(['Paid Connecticut DRS in full.']);
    expect(sd.owed).toBeUndefined();
    expect(sd.payments!.map((x) => [x.amount, x.tax, x.penalty, x.interest])).toEqual([[100_00, 23_92, 58_53, 17_55], [561_41, 561_41, 0, 0]]);
    expect([...fromChecking(sim, 'Connecticut income tax owed, 2027, in part'), ...fromChecking(sim, 'Connecticut income tax owed, 2027')]).toEqual([100_00, 561_41]);
    expect(lien.status).toBe('paid');
    expect(titled(sim, 'Ask For Your Connecticut Tax Lien’s Release')).toHaveLength(1);
    // The levy pending for 17 July is off the calendar.
    expect(pending(sim, STATE_NOTICE_KIND)).toEqual([]);
    papers(sim);
    expect(drew('tax.lien_release').map((c) => c.disabled)).toEqual([false]);
    expect(press('tax.lien_release')).toEqual(['Asked: released by July 25, 2028.']);
    expect(lien.releaseDue).toBe(at(2028, 7, 25, 12));
    expect(refusal(sim, 'tax.lien_release', { state: 'us-ct', year: 2027 })).toBe('Asked: it’s released by July 25, 2028.');
    expect(refusal(sim, 'tax.lien_dispute', { state: 'us-ct', year: 2027 })).toBe('It secured tax owed when it was filed: it’s released once that’s paid, not withdrawn.');
    const again = reload(sim);
    again.advanceTo(at(2028, 7, 25, 11));
    expect(ct(again).lien!.status).toBe('paid');
    again.advanceTo(at(2028, 8, 1, 12));
    expect(ct(again).lien).toMatchObject({ status: 'released', releasedAt: at(2028, 7, 25, 12) });
    expect(titled(again, 'Your Connecticut Tax Lien Is Released').map((n) => n.body)).toEqual(['Connecticut DRS released the Connecticut Tax Lien on your 2027 Connecticut return, recorded with the town clerk’s land records and the Secretary of the State’s UCC filings.']);
    // Past 17 July, when the levy was pending before she paid, and none came.
    expect(again.now).toBeGreaterThan(ret(again).due + 90 * MS_DAY);
    expect(titled(again, 'Connecticut DRS Levied Your Accounts')).toEqual([]);
    expect(refusal(again, 'tax.lien_release', { state: 'us-ct', year: 2027 })).toBe('It’s been released.');
    expect(again.ledger.audit()).toEqual([]);
  });
  it('PLAYER JOURNEY: her Connecticut plan in force, its first $48.78 taken on 2 March, the rest paid by Pay on Papers on 15 March: the plan ends paid, and takes nothing more', () => {
    const sim = thaw(unpaid());
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-ct', months: 12 } });
    sim.advanceTo(sim.now + 60_000);
    const p = sim.player.statePlans!['us-ct']!;
    breakCd(sim);
    sim.advanceTo(at(2028, 3, 2, 14));
    // Before the due date nothing has grown: $585.33 less the plan's $48.78.
    expect([p.status, ct(sim).owed]).toEqual(['active', 536_55]);
    sim.advanceTo(at(2028, 3, 15, 12));
    papers(sim);
    expect(press('tax.pay_state')).toEqual(['Paid Connecticut DRS in full.']);
    expect([p.status, p.why]).toEqual(['paid', 'Paid off']);
    expect(ct(sim).owed).toBeUndefined();
    expect(ct(sim).payments!.map((x) => [x.amount, x.how])).toEqual([[48_78, 'plan'], [536_55, 'payment']]);
    expect(fromChecking(sim, 'Connecticut income tax owed, 2027')).toEqual([536_55]);
    const again = reload(sim);
    again.advanceTo(at(2028, 6, 1, 12));
    // Its 1 April and 1 May payments never taken: the one of 2 March alone.
    expect(fromChecking(again, 'Connecticut DRS payment plan')).toEqual([48_78]);
    expect([again.player.statePlans!['us-ct']!.status, pending(again, STATE_NOTICE_KIND), titled(again, 'A Bill From Connecticut DRS')]).toEqual(['paid', [], []]);
    expect(again.ledger.audit()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Connecticut's plan
// ---------------------------------------------------------------------------

describe('tax.apply_state_plan and tax.catch_up_state_plan', () => {
  it('PLAYER JOURNEY: asked for on Papers over 12 months, $48.78 a month, decided at once, its bill off the calendar; paid each 30 days, the third after the due date to its 10% penalty first, and paid off with no letter or lien, across a reload', () => {
    const sim = thaw(unpaid());
    papers(sim);
    expect(press('tax.apply_state_plan')).toEqual(['Asked: $48.78 a month, decided by February 1, 2028.']);
    sim.advanceTo(sim.now + 60_000);
    const p = sim.player.statePlans!['us-ct']!;
    expect([p.status, p.months, p.monthly, p.covers, p.fee]).toEqual(['active', 12, 48_78, 585_33, 0]);
    expect(titled(sim, 'Connecticut DRS Approved Your Plan').map((n) => n.body)).toEqual(['$48.78 a month for 12 months, from March 2, 2028. Interest goes on; collection has stopped.']);
    expect(pending(sim, STATE_NOTICE_KIND)).toEqual([]);
    breakCd(sim);
    sim.advanceTo(at(2028, 3, 2, 14));
    expect(ct(sim).owed).toBe(585_33 - 48_78);
    sim.advanceTo(at(2028, 4, 1, 14));
    expect(ct(sim).owed).toBe(585_33 - 2 * 48_78);
    // 1 May, a month begun past the due date: 10% of the $487.77 then unpaid, $48.777, $48.78, and 1%, $4.8777, $4.88.
    // The payment goes to the penalty first. Until 2026-10-15 the whole, $541.4247, was rounded to $541.42 and the
    // interest given the $4.87 left.
    const again = reload(sim);
    again.advanceTo(at(2028, 5, 1, 14));
    expect(ct(again).parts).toEqual({ tax: 487_77, penalty: 0, interest: 4_88 });
    again.advanceTo(at(2029, 4, 1, 12));
    const q = again.player.statePlans!['us-ct']!;
    expect([q.status, q.why, ct(again).owed]).toEqual(['paid', 'Paid off', undefined]);
    const paid = ct(again).payments!.filter((x) => x.how === 'plan');
    expect(paid.every((x) => x.amount <= 48_78)).toBe(true);
    expect(fromChecking(again, 'Connecticut DRS payment plan')).toEqual(paid.map((x) => x.amount));
    expect(paid.reduce((s, x) => s + x.tax, 0)).toBe(585_33);
    expect([titled(again, 'A Bill From Connecticut DRS'), titled(again, 'A Connecticut Tax Lien Is Filed')]).toEqual([[], []]);
    expect(again.ledger.audit()).toEqual([]);
  });

  it('PLAYER JOURNEY: its first payment missed with her money in the CD, the plan ends at once, with no Catch Up offered or taken; collection resumes at the notice of intent, 30 days after the due date', () => {
    const sim = thaw(unpaid());
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-ct', months: 12 } });
    sim.advanceTo(at(2028, 3, 2, 14));
    const p = sim.player.statePlans!['us-ct']!;
    expect([p.status, p.why]).toEqual(['ended', 'Ended: a payment missed (SLATE’s reading: Connecticut DRS’s rule on a missed payment wasn’t found)']);
    expect(titled(sim, 'Connecticut DRS Ended Your Plan').map((n) => n.body)).toEqual(['The bank couldn’t pay $48.78. Collection resumes on what’s owed to it.']);
    papers(sim);
    expect(drew('tax.catch_up_state_plan')).toEqual([]);
    expect(refusal(sim, 'tax.catch_up_state_plan', { state: 'us-ct' })).toBe('That plan isn’t behind.');
    expect(STATE_TAX['us-ct'].plan.cure).toEqual({ kind: 'none' });
    const due = ret(sim).due;
    expect(pending(sim, STATE_NOTICE_KIND).map((i) => i.at)).toEqual([due + 30 * MS_DAY]);
    sim.advanceTo(due + 30 * MS_DAY + MS_HOUR);
    expect(ct(sim).lien?.status).toBe('filed');
    expect(titled(sim, 'Connecticut DRS Intends To Levy').map((n) => n.at)).toEqual([due + 30 * MS_DAY]);
  });

  it('refuses months outside 2 to 12 and a second plan, in Connecticut’s words, charging nothing', () => {
    const sim = thaw(unpaid());
    expect(refusal(sim, 'tax.apply_state_plan', { state: 'us-ct', months: 13 })).toBe('Connecticut DRS sets a plan over 2 to 12 months.');
    expect(refusal(sim, 'tax.apply_state_plan', { state: 'us-ct', months: 1 })).toBe('Connecticut DRS sets a plan over 2 to 12 months.');
    expect(sim.player.statePlans?.['us-ct']).toBeUndefined();
    sim.must({ kind: 'tax.apply_state_plan', payload: { state: 'us-ct', months: 6 } });
    expect(refusal(sim, 'tax.apply_state_plan', { state: 'us-ct', months: 6 })).toBe('You have a plan with Connecticut DRS.');
  });

  /** Her 2026 return left to Connecticut: assessed, its lien filed, its $3.35 and penalties taken by levy in 2027. */
  const levied = once(() => {
    const sim = createSave(1, 'r3-tax-scraping', { ...withFamily(newLifeConfig(), 'scraping'), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.advanceTo(at(2028, 2, 1, 12));
    const sd26 = sim.player.returns!['2026']!.stateDue!['us-ct']!;
    expect([sd26.collection, sd26.owed, sd26.lien?.status, sd26.payments!.map((x) => x.how)]).toEqual([3, undefined, 'paid', ['levy']]);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    intoTheCd(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2027 } });
    return freeze(sim);
  });

  it('PLAYER JOURNEY: a year Connecticut levied and was paid by the levy doesn’t refuse her a plan on the next: until 2026-10-15 it did, “won’t set up a plan on an account it has levied”', () => {
    const sim = thaw(levied());
    expect(sim.must<{ monthly: number }>({ kind: 'tax.apply_state_plan', payload: { state: 'us-ct', months: 12 } }).monthly).toBe(48_78);
    // That year's lien, filed on DRS's assessment and replaced by her own return, secured tax she owed: no error.
    expect(refusal(sim, 'tax.lien_dispute', { state: 'us-ct', year: 2026 })).toBe('It secured tax owed when it was filed: it’s released once that’s paid, not withdrawn.');
  });

  it('PLAYER JOURNEY: a year levied and still owed does refuse it: her 2027 balance’s levy on 17 July finds nothing to take', () => {
    const sim = thaw(levied());
    sim.advanceTo(at(2028, 7, 20, 12));
    expect(titled(sim, 'Connecticut DRS Levied Your Accounts').at(-1)!.body).toMatch(/^\$0\.00 taken from your bank accounts for your 2027 Connecticut return; \$[\d,.]+ is still owed\.$/);
    expect(refusal(sim, 'tax.apply_state_plan', { state: 'us-ct', months: 12 })).toBe('Connecticut DRS won’t set up a plan on an account it has levied: pay it, or ask by phone, which SLATE doesn’t model.');
  });
});

// ---------------------------------------------------------------------------
// What no student reaches, shown shut by play
// ---------------------------------------------------------------------------

describe('what her life never reaches', () => {
  it('tax.amend: her filed 2026 and 2027 match the record, and a year more on the clock leaves them so', () => {
    const sim = thaw(unpaid());
    const none = 'Your return as filed matches what’s on record: there’s nothing to amend.';
    expect([refusal(sim, 'tax.amend', { year: 2026 }), refusal(sim, 'tax.amend', { year: 2027 })]).toEqual([none, none]);
    const before = JSON.stringify(ret(sim).figures);
    sim.advanceTo(at(2029, 2, 2, 12));
    // The CD's interest, paid at its end on 1 September 2028, went to 2028; under its standard deduction, 2028 has no return.
    expect(earningsOf(sim.player).years['2028']!.interest).toBeGreaterThan(0);
    expect(Object.keys(sim.player.returns!)).toEqual(['2026', '2027']);
    expect([refusal(sim, 'tax.amend', { year: 2026 }), refusal(sim, 'tax.amend', { year: 2027 })]).toEqual([none, none]);
    expect(JSON.stringify(ret(sim).figures)).toBe(before);
  });

  it('tax.federal_lien_withdraw: her LT11 on 20 June is for $1,746.41, under the $10,000 the IRS files its notice at, so none is filed and nothing can be withdrawn', () => {
    const sim = thaw(unpaid());
    sim.advanceTo(at(2028, 6, 21, 12));
    expect(titled(sim, 'Final Notice Of Intent To Levy').map((n) => n.body)).toEqual(['Notice LT11: $1,746.41 on your 2027 return; in 30 days it takes what you owe from your bank accounts.']);
    expect(ret(sim).lien).toBeUndefined();
    expect(refusal(sim, 'tax.federal_lien_withdraw', { year: 2027 })).toBe('There’s no federal tax lien on that year.');
    papers(sim);
    expect(drew('tax.federal_lien_withdraw')).toEqual([]);
  });

  it('tax.request_waiver: only Oregon charges the three-year penalty, and she files in Connecticut alone', () => {
    const sim = thaw(unpaid());
    expect(Object.entries(STATE_TAX).filter(([, r]) => r.threeYear).map(([s]) => s)).toEqual(['us-or']);
    expect(Object.keys(ret(sim).stateDue!)).toEqual(['us-ct']);
    expect(refusal(sim, 'tax.request_waiver', { state: 'us-ct', year: 2027 })).toBe('There’s no three-year penalty on that year.');
    papers(sim);
    expect(drew('tax.request_waiver')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Connecticut's own due date on a 1040-NR
// ---------------------------------------------------------------------------

/** Ada Cole born in London: an F-1 student whose 2026 return is a 1040-NR. */
const londonLife = (family: 'scraping' | 'wealthy') => createSave(1, `scope-tp-${family}`, { ...withFamily(newLifeConfig(), family), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

describe('Connecticut’s due date on a 1040-NR', () => {
  it('a 1040-NR’s 15 June is the IRS’s alone: Connecticut’s bill comes 30 days after its own 15 April, $3.72, as on any return; until 2026-10-15 it waited for 15 July (TEST SETUP: her return’s due date put at a 1040-NR’s without wages)', () => {
    const sim = londonLife('scraping');
    sim.advanceTo(at(2027, 2, 1, 12));
    const r = sim.player.returns!['2026']!;
    // Her $1,656.00 of work-study (72 hours at $23) makes her return due on 15 April 2027, as a resident's.
    expect([r.figures.form, r.figures.workStudy, r.due]).toEqual(['1040-NR', 1_656_00, at(2027, 4, 15, 23, 59)]);
    // TEST SETUP: due on 15 June, as a 1040-NR without wages is (Form 1040-NR instructions). No played life files one
    // with Connecticut owed: Yale's work-study, paid on the clock from the first fall for the shifts kept, put wages on
    // every 1040-NR played (each of the six London-born families had $1,656.00; the skeptic of 2026-10-15 corrected
    // this, which said it was paid to every student with need); a student who keeps no shift has only her scholarship,
    // 2026's $14,014.00, under Connecticut's $15,000 exemption, so owes it nothing; and one who withdraws before it is
    // no longer on an F-1, so has no return for a year without wages (`owesUsReturn`).
    r.due = at(2027, 6, 15, 23, 59);
    intoTheCd(sim);
    // The return's panel says both dates before it's filed (from 2026-10-15: until then only “Due June 15, 2027”).
    expect(papers(sim)).toContain('Due June 15, 2027; Connecticut’s April 15, 2027');
    expect(press('tax.file')).toHaveLength(1);
    const sd = r.stateDue!['us-ct']!;
    // 14% of her $14,014.00 taxable scholarship withheld, $1,961.96, on a tax of $1,632.40 (10% of $12,400, 12% of the
    // $3,270 over it): $329.56 back; Connecticut's $3.35 owed, the bank empty.
    expect([r.refund, sd.owed]).toEqual([329_56, 3_35]);
    // Connecticut's 15 April 2027 (Conn. Gen. Stat. 12-719(a)), the thirty days of its bill from it.
    const ctDue = at(2027, 4, 15, 23, 59);
    expect(pending(sim, STATE_NOTICE_KIND).map((i) => i.at)).toEqual([ctDue + 30 * MS_DAY]);
    sim.advanceTo(ctDue + 30 * MS_DAY + MS_HOUR);
    // A month begun from 15 April: $3.35, its 10% ($0.335, $0.34) and 1% ($0.0335, $0.03), $3.72.
    expect(titled(sim, 'A Bill From Connecticut DRS').map((n) => [n.at, n.body])).toEqual([[ctDue + 30 * MS_DAY, 'DRS Bill: $3.72 on your 2026 Connecticut return; the tax, its 10% penalty and 1% a month of interest are due.']]);
  });
});

// ---------------------------------------------------------------------------
// documents.apply_ssn: what the number changes on a played international life
// ---------------------------------------------------------------------------

describe('documents.apply_ssn on a London-born student', () => {
  /** Her 2026 1040-NR filed on Papers on 1 February 2027, the Social Security office visited on 30 August or never. */
  const filed = (ssn: boolean) => {
    const sim = londonLife('scraping');
    if (ssn) {
      sim.advanceTo(at(2026, 8, 30, 12));
      documents(sim);
      expect(press('documents.apply_ssn')).toEqual(['Applied. The card comes September 20, 2026.']);
      // The visit takes the office's hour on the clock: SSN's `visitMinutes`, 60 (`systems/taxid.ts`, SLATE's estimate),
      // which the guide publishes as “60 minutes at the Social Security office, which the clock moves through”
      // (`content/guide/documents.ts`). Noon on 30 August, then 1 p.m. Until 2026-10-15 no test read it, and a mutation
      // taking the hour off survived; the card's 20 September doesn't show it, 21 days on from either hour.
      expect(sim.now).toBe(at(2026, 8, 30, 13));
      expect(sim.player.ssn?.appliedAt).toBe(at(2026, 8, 30, 13));
    }
    sim.advanceTo(at(2027, 2, 1, 12));
    papers(sim);
    expect(press('tax.file')).toHaveLength(1);
    return { sim, r: sim.player.returns!['2026']! };
  };
  const refunds = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Federal tax refund, 2026').map((t) => t.postings.filter((p) => p.accountId === checkingOf(sim).id).reduce((s, p) => s + p.amount, 0));

  it('PLAYER JOURNEY: her 1040-NR’s $329.56 back, from the 14% withheld on her scholarship, comes in the IRS’s 21 days with the card in hand; without it the W-7 holds it seven weeks more, 70 days', () => {
    const held = filed(true);
    expect(held.sim.player.ssn?.status).toBe('issued');
    // $14,014.00 of taxable scholarship and $1,656.00 of work-study, no deduction on a 1040-NR: $15,670.00. Its tax, 10%
    // of $12,400 and 12% of the $3,270 over it, $1,632.40; the $1,961.96 withheld (14% of $14,014.00) less it, $329.56.
    expect([held.r.figures.form, held.r.figures.income, held.r.refund]).toEqual(['1040-NR', 15_670_00, 329_56]);
    expect(held.r.refundAt).toBe(at(2027, 2, 1, 12) + 21 * MS_DAY);
    held.sim.advanceTo(held.r.refundAt! + MS_HOUR);
    expect(refunds(held.sim)).toEqual([329_56]);

    const without = filed(false);
    expect(without.sim.player.ssn).toBeUndefined();
    expect(without.r.refund).toBe(329_56);
    expect(without.r.refundAt).toBe(at(2027, 2, 1, 12) + 70 * MS_DAY);
    without.sim.advanceTo(at(2027, 2, 1, 12) + 69 * MS_DAY);
    expect(refunds(without.sim)).toEqual([]);
    without.sim.advanceTo(without.r.refundAt! + MS_HOUR);
    expect(refunds(without.sim)).toEqual([329_56]);
  });

  it('PLAYER JOURNEY: the IRS’s plan on the Wealthy family’s 1040-NR, $165.60 owed with her money in a CD: with the card come, applied for online on Papers and answered in a minute; without it, Form 9465 and 30 days', () => {
    const asked = (ssn: boolean) => {
      const sim = londonLife('wealthy');
      if (ssn) { sim.advanceTo(at(2026, 8, 30, 12)); sim.must({ kind: 'documents.apply_ssn', payload: {} }); }
      sim.advanceTo(at(2027, 2, 1, 12));
      intoTheCd(sim);
      papers(sim);
      expect(press('tax.file')).toHaveLength(1);
      // No scholarship: 10% of her $1,656.00 of work-study, $165.60, unpaid.
      expect(sim.player.returns!['2026']!.owed).toBe(165_60);
      papers(sim);
      return { sim, toast: press('tax.apply_plan') };
    };
    const held = asked(true);
    expect(held.sim.player.ssn?.status).toBe('issued');
    expect(held.toast).toEqual(['Applied: answered by February 1, 2027.']);
    expect(held.sim.player.taxPlan!.history.map((x) => x.what)).toEqual(['Applied online']);
    held.sim.advanceTo(held.sim.now + 2 * 60_000);
    expect(held.sim.player.taxPlan!.status).toBe('active');

    const without = asked(false);
    expect(without.toast).toEqual(['Applied: answered by March 3, 2027.']);
    expect(without.sim.player.taxPlan!.history.map((x) => x.what)).toEqual(['Form 9465 mailed: no Social Security number for the online application']);
    expect(without.sim.player.taxPlan!.decideAt).toBe(at(2027, 2, 1, 12) + 30 * MS_DAY);
  });
});
