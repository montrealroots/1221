/**
 * The second round of 2026-10-13 for five money rows the first round left partial (round-two batch b04): a term deposit
 * broken, a card locked, a card reported, a hardship plan and the Statements screen. What the first round and its
 * independent check left open is closed here where play can close it, through the command the screen sends or the clock
 * that carries it, each consequence read where the row says it is read, against figures worked out here from the bank's
 * own terms or the rule's own numbers, never from the helper the engine works them out with.
 *
 * - `bank.break_term`: NatWest's notice close at a second bank, both ways, which the first round left to the shared
 *   function alone. A NatWest Fixed-Term Savings held beside a Barclays primary closes by the clock 35 days after Give 35
 *   Days’ Notice is pressed, into the NatWest current account kept beside it, and Barclays sees none of it; with that
 *   account closed, into the Barclays primary at once by Britain's instant payments, where it buys the day's meal an empty
 *   account was refused. The notice's charge, which the first round matched with a pattern, is worked here: the interest
 *   earned to the closing day the screen named, 35 days at 4.11% on £10,000, £39.41, the lower of that and 90 days'.
 * - `card.lock`: the draw of somebody else's use steered to the card left unlocked, which the check found unchecked. With
 *   the US rate set to certain, twins of one life take the same nights: nothing locked, both cards are used; the credit
 *   card locked from Your Cards, every night’s use is the debit card’s; the debit card locked, every night’s is the credit
 *   card’s. Until the third round of 2026-10-13 the debit card locked held its nights lost, the credit card’s being
 *   exactly its unlocked twin’s: the rate is a person’s, and that halved it.
 * - `card.report`: the one gap left, Wells Fargo's and Capital One's rush days that nothing reads. This round decided they
 *   are offered, for no fee, as the banks' pages offer them and SLATE charges no fee a bank doesn't list; the test asserts
 *   that and fails until the engine and the screen read the days. The third round of the same day found Wells Fargo’s is
 *   a credit card’s rush with a fee it doesn’t publish (“additional fees may apply”; a Rush Plastic Fee with no amount):
 *   from then it isn’t sent, and the screen says why; Capital One’s is still sent free.
 * - `card.request_hardship`: a missed payment's count reset by the plan's payment met, which the first round only saw on a
 *   card that had never missed: late once at a due date the bank emptied, then on a plan of $101 (a forty-eighth of $4,830,
 *   a dollar up), and the next due date's $101 paid puts it back to none and the month on time (+3), where a twin emptied
 *   before that due date misses a second and goes on the record. And the Statements page on a plan, which the check found
 *   still said the card's minimum: the 20 October statement says the plan's $101, and the 20 September one, due before the
 *   plan began, the card's $48 (fixed in the working tree the same day by the guide's audit, BankStatements.tsx).
 * - `statements`: the running balance on each line, which the first round's render never read: Chase Savings opened with
 *   the family's $413,043 and moved $1,000 and $250 from, and the card owing after two meals and a $3 payment, each figure
 *   worked here.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in New
 * Haven, from Monday 24 August 2026 at 7:30 AM, at Chase (Total Checking, Savings, the Freedom Unlimited at a $65,217
 * limit and a 795 record), or at the New Haven bank chosen at creation (Capital One, Wells Fargo). One LIFE FIXTURE, said
 * where it's made: a London life at Barclays (`quickSave`, from Monday 5 January 2026), since no New Haven bank asks notice
 * to break a term deposit and NatWest does. The screens are rendered as the player has them (react-dom/server), `useGame`'s
 * `run` the save's own `execute`; a button pressed is the component's own onClick, kept on its way through the JSX runtime.
 *
 * TEST SETUP, said again where it's done: a balance set or emptied by a posting against a test equity line (a bank emptied
 * the minute before a due date, the means to pay come since); purchases put on a card; hunger before a meal; the US's
 * yearly rate of somebody else's use set to certain, and nothing stopped, as `tests/security.test.ts` sets it; and on the
 * Statements screen, the account and period chosen through its own useState, which a static render can't click to.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { TERM_NOTICE_KIND } from '@/engine/systems/accountlife';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { FRAUD_LAW, type FraudLaw } from '@/engine/content/security';
import { stateOf } from '@/engine/systems/credit';
import { periodsOf } from '@/engine/systems/statements';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    const v = h.states.shift();
    return [v === h.keep ? value : v, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

/** Every button a screen draws, with its words, whether it's grayed out, and its own onClick. */
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

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { BankAccountLife } = await import('@/ui/bank/BankAccountLife');
const { BankSecurity } = await import('@/ui/bank/BankSecurity');
const { BankStatements } = await import('@/ui/bank/BankStatements');

// ---------------------------------------------------------------------------
// Lives, clocks, the ledger and the screens over them
// ---------------------------------------------------------------------------

/** New Haven's clock, worked out here: Eastern Daylight Time (UTC−4) until 1 November 2026, Eastern Standard (UTC−5) after. */
const edt = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 4, minute);
const est = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 5, minute);
/** London's in January and February: Greenwich Mean Time, UTC itself. */
const gmt = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour, minute);

/** A new life: Ada Cole, born in New York, an actor at Yale in New Haven from Monday 24 August 2026, 7:30 AM. */
const student = (seed: string, bankId?: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...(bankId ? { bankId } : {}) });
/** The same life at 9:01 AM, past the fall term's Yale Health plan, $1,882, out of checking at 9:00. */
function settled(seed: string): Simulation {
  const sim = student(seed);
  sim.advanceTo(edt(8, 24, 9, 1));
  return sim;
}
/** LIFE FIXTURE: a London life banking at Barclays, from Monday 5 January 2026 at 7:30 AM: no New Haven bank asks notice. */
const londoner = (seed: string): Simulation =>
  quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', bankId: 'gb-barclays', wealth: 'wealthy' }, seed);

const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation, kind: Account['kind'], bankId = 'us-chase'): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && a.bankId === bankId && !a.closedAt && a.category !== 'term')!;
const chaseCard = (sim: Simulation) => mine(sim, 'credit_card');

function must<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
const eat = (sim: Simulation) => sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } });

/** What each transaction with a memo moved on an account, in order. */
const moved = (sim: Simulation, account: Account, memo: string) => sim.universe.transactions
  .filter((t) => t.memo === memo).flatMap((t) => t.postings.filter((p) => p.accountId === account.id).map((p) => p.amount));
/** Every transaction that moved two accounts together. */
const between = (sim: Simulation, a: Account, b: Account) => sim.universe.transactions
  .filter((t) => t.postings.some((p) => p.accountId === a.id) && t.postings.some((p) => p.accountId === b.id));
const notes = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

/** TEST SETUP: an account brought to a balance, by a posting against a test equity line. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'opening', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test Setup').id, amount: -by }] });
}
/** TEST SETUP: purchases put on a card, as a month's shopping would put them. */
function purchases(sim: Simulation, card: Account, amount: number): void {
  sim.post({ memo: 'TEST SETUP: purchases', category: 'shopping', postings: [{ accountId: card.id, amount: -amount }, { accountId: sim.nominalAccount('expense', 'Test Setup').id, amount }] });
}
/** TEST SETUP: hungry, so a meal is wanted (a meal is refused at 90 nourishment and over). */
function hungry(sim: Simulation): void {
  sim.player.wellbeing.nourishment = 40;
}

const laws = FRAUD_LAW as Record<string, FraudLaw>;
const kept = new Map<string, FraudLaw>();
/** TEST SETUP: a country's fraud law changed for a test, put back after it. */
function withLaw(iso: string, change: Partial<FraudLaw>) { if (!kept.has(iso)) kept.set(iso, laws[iso]!); laws[iso] = { ...laws[iso]!, ...change }; }
afterEach(() => { for (const [k, v] of kept) laws[k] = v; kept.clear(); });

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/ ([,.:;])/g, '$1');
type Button = { text: string; disabled?: boolean; onClick?: () => void };
/** A screen drawn as the player has it, the states given (TEST SETUP) in its render order, its buttons kept. */
function draw(sim: Simulation, element: ReactElement, states: unknown[] = []): { text: string; all: (label: string) => Button[]; button: (label: string, nth?: number) => Button } {
  h.sim = sim;
  h.buttons = [];
  h.states = [...states];
  const html = renderToStaticMarkup(element);
  expect(h.states, 'every state given was taken').toHaveLength(0);
  const buttons = [...h.buttons];
  const all = (label: string) => buttons.filter((x) => x.text === label);
  return {
    text: onScreen(html), all,
    button: (label, nth = 0) => { const b = all(label)[nth]; expect(b, `“${label}” on screen (drawn: ${buttons.map((x) => x.text).join(' | ')})`).toBeDefined(); return b!; },
  };
}
/** Presses a button that can be pressed. */
function press(b: Button): void {
  expect(b.disabled ?? false, `“${b.text}” can be pressed`).toBe(false);
  b.onClick!();
}

// ---------------------------------------------------------------------------
// bank.break_term
// ---------------------------------------------------------------------------

describe('bank.break_term', () => {
  /** The London life with a NatWest current account beside its Barclays primary and £10,000 put away at NatWest from it. */
  function natwestBeside(seed: string): { sim: Simulation; barclays: Account; select: Account; term: Account } {
    const sim = londoner(seed);
    const barclays = primary(sim);
    expect(barclays.bankId).toBe('gb-barclays');
    const select = sim.universe.accounts[must<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'gb-natwest' }).accountId]!;
    // Britain's banks pay one another at once (Faster Payments): nothing in transit.
    expect(must<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: barclays.id, toId: select.id, amount: 12_000_00 }).arrivesAt).toBe(gmt(1, 5, 7, 30));
    expect(select.balance).toBe(12_000_00);
    sim.advanceBy(MS_DAY);
    const term = sim.universe.accounts[must<{ accountId: string }>(sim, 'bank.open_term', { amount: 10_000_00, bankId: 'gb-natwest' }).accountId]!;
    expect(term).toMatchObject({ bankId: 'gb-natwest', balance: 10_000_00, fixedRate: 0.0411 });
    expect(sim.now).toBe(gmt(1, 6, 7, 30));
    return { sim, barclays, select, term };
  }
  /**
   * NatWest: "a charge equal to the lower of interest earned or 90 days' interest; you never get back less than your
   * deposit". Earned to the closing day the screen names, 10 February, not counting it, as a term broken during a day
   * earns nothing for that day: 6 January to 9 February, 35 days, £10,000 × 4.11% × 35 ÷ 365 = £39.411. Ninety days'
   * would be £101.34, so the lower is the interest, and the deposit comes back whole.
   */
  const CHARGE = Math.floor(10_000_00 * 0.0411 * 35 / 365);

  it('closes a notice given in a save from before the close went on the clock, at its own day, once', () => {
    const { sim, select, term } = natwestBeside('b04-natwest-old');
    press(draw(sim, createElement(BankAccountLife, { bankId: 'gb-natwest' })).button('Give 35 Days’ Notice'));
    // TEST SETUP: the save as a build before 2026-10-13 wrote it, the notice running with nothing on the clock for it.
    const old = JSON.parse(serialise(sim.universe)) as { scheduled: { kind: string; status: string }[] };
    old.scheduled = old.scheduled.filter((i) => i.kind !== TERM_NOTICE_KIND);
    const opened = loadSave(deserialise(JSON.stringify(old)) as never);
    const pending = () => opened.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === TERM_NOTICE_KIND);
    expect(pending().map((i) => i.at)).toEqual([gmt(2, 10, 7, 30)]);
    const s0 = opened.universe.accounts[select.id]!.balance;
    opened.advanceTo(gmt(2, 10, 7, 31));
    expect(opened.universe.accounts[term.id]!.closedAt).toBe(gmt(2, 10, 7, 30));
    expect(opened.universe.accounts[select.id]!.balance - s0).toBe(10_000_00);
    // Opened again after, nothing more is put on the clock.
    expect(loadSave(deserialise(serialise(opened.universe)) as never).universe.scheduled.filter((i) => i.status === 'pending' && i.kind === TERM_NOTICE_KIND)).toEqual([]);
  });

  it('closes a NatWest term held beside a Barclays primary on 35 days’ notice by the clock, into the NatWest account kept beside it, the £10,000.00 whole after the £39.41 charge taken from what it earned, and Barclays sees none of it (a London life: no New Haven bank asks notice)', () => {
    const { sim, barclays, select, term } = natwestBeside('b04-natwest-beside');
    expect(CHARGE).toBe(39_41);
    const first = draw(sim, createElement(BankAccountLife, { bankId: 'gb-natwest' }));
    expect(first.text).toContain('Fixed-Term Savings, £10,000.00 at 4.11%');
    press(first.button('Give 35 Days’ Notice'));
    expect(term.breakAt).toBe(gmt(2, 10, 7, 30));
    const closing = draw(sim, createElement(BankAccountLife, { bankId: 'gb-natwest' }));
    expect(closing.text).toContain('It closes on February 10, 2026, on the notice you gave.');
    expect(closing.button('Give 35 Days’ Notice').disabled).toBe(true);
    const s0 = select.balance;

    sim.advanceTo(gmt(2, 10, 7, 29));
    expect(term.closedAt).toBeUndefined();
    sim.advanceTo(gmt(2, 10, 7, 31));
    // On the day the screen named, the moment the notice runs out: the whole £10,000 into the NatWest account at once.
    // Until 2026-10-13 it closed at the first midnight after, 00:00 on 11 February, a day after the one the screen named.
    expect(term.closedAt).toBe(gmt(2, 10, 7, 30));
    expect(term.balance).toBe(0);
    expect(moved(sim, select, 'Fixed-Term Savings broken early')).toEqual([10_000_00]);
    expect(select.balance - s0).toBe(10_000_00);
    expect(between(sim, term, barclays)).toEqual([]);
    // The £10,000.00 is what arrived, the charge already taken: until 2026-10-13 this held “less £39.41”, which read as
    // £9,960.59 to come (defect 57 of that day’s third round).
    expect(notes(sim, 'Your Fixed-Term Savings Closed').map((n) => n.body)).toEqual([`Your notice period ended: £10,000.00 went to your checking account, after a £${(CHARGE / 100).toFixed(2)} penalty for closing early.`]);
    // No Early Withdrawal Penalty: the charge came out of the interest, none from the deposit.
    expect(moved(sim, sim.nominalAccount('expense', 'Early Withdrawal Penalty'), 'Fixed-Term Savings broken early')).toEqual([]);
    expect(draw(sim, createElement(BankAccountLife, { bankId: 'gb-natwest' })).text).not.toContain('Fixed-Term Savings, £10,000.00');
  });

  it('closes it into the Barclays primary at once, with the NatWest account closed, and the money buys the day: a meal refused on the emptied Barclays account is bought once it lands', () => {
    const { sim, barclays, select, term } = natwestBeside('b04-natwest-across');
    expect(must<{ paid: number; penalty: number; at: number }>(sim, 'bank.break_term', { accountId: term.id })).toEqual({ paid: 0, penalty: 0, at: gmt(2, 10, 7, 30) });
    // Everything at NatWest but the deposit closed by the player, the £2,000 left sent to Barclays.
    must(sim, 'bank.close_current', { accountId: select.id, remainderTo: barclays.id });
    expect(select.closedAt).toBe(gmt(1, 6, 7, 30));
    // Only the debit card pays the day: the Barclaycard locked by the player.
    must(sim, 'card.lock', { which: 'credit', locked: true });
    expect(sim.player.payments?.everyday).toBe('debit');

    sim.advanceTo(gmt(2, 9, 7, 30));
    setBalance(sim, barclays, 0); // TEST SETUP: the Barclays account emptied
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings' && a.category !== 'term' && !a.closedAt) setBalance(sim, a, 0); // TEST SETUP
    hungry(sim); // TEST SETUP
    expect(eat(sim).error).toBe('You can’t afford it.');

    // Still refused at 7:29 AM on 10 February, the day the screen names, and bought at 7:31 once the money is in.
    sim.advanceTo(gmt(2, 10, 7, 29));
    hungry(sim); // TEST SETUP
    expect(eat(sim).error).toBe('You can’t afford it.');
    sim.advanceTo(gmt(2, 10, 7, 31));
    expect(term.closedAt).toBe(gmt(2, 10, 7, 30));
    // In one move from the deposit to Barclays, the moment the notice ran out: nothing in transit, nothing via NatWest.
    expect(between(sim, term, barclays).map((t) => ({ at: t.at, memo: t.memo, amount: t.postings.find((p) => p.accountId === barclays.id)!.amount }))).toEqual([
      { at: gmt(2, 10, 7, 30), memo: 'To Barclays Bank Account at Barclays', amount: 10_000_00 },
    ]);
    expect(between(sim, term, select)).toHaveLength(1); // its opening, from the NatWest account, and nothing since
    expect(barclays.balance).toBe(10_000_00);
    expect(notes(sim, 'Your Fixed-Term Savings Closed').map((n) => n.body)).toEqual([`Your notice period ended: £10,000.00 went to your checking account, after a £${(CHARGE / 100).toFixed(2)} penalty for closing early.`]);
    hungry(sim); // TEST SETUP
    must(sim, 'life.look_after', { action: 'eat' });
    const meal = moved(sim, barclays, 'A meal');
    expect(meal).toHaveLength(1);
    expect(meal[0]!).toBeLessThan(0);
    expect(barclays.balance).toBe(10_000_00 + meal[0]!);
  });
});

// ---------------------------------------------------------------------------
// card.lock
// ---------------------------------------------------------------------------

describe('card.lock', () => {
  it('steers somebody else’s use to the card left unlocked: the credit card locked from Your Cards, every night’s is the debit card’s; the debit card locked, every night’s is the credit card’s', () => {
    type Use = { at: number; which: string; amount: number; on: string };
    /** One card locked from Your Cards: the debit card's Lock It is drawn first, the credit card's second. */
    const lockFromScreen = (which: 'debit' | 'credit') => (sim: Simulation) => {
      const screen = draw(sim, createElement(BankSecurity, { bankId: 'us-chase' }));
      press(screen.button('Lock It', which === 'debit' ? 0 : 1));
      const after = draw(sim, createElement(BankSecurity, { bankId: 'us-chase' }));
      expect(after.all('Unlock It')).toHaveLength(1);
      expect(after.text.split('Locked: nothing new can go on it until you unlock it.')).toHaveLength(2);
      expect((which === 'debit' ? primary(sim) : chaseCard(sim)).plastic!.locked).toBe(true);
    };
    /** Six nights with the US rate set to certain, 25 to 30 August, after what the player did first. */
    const play = (first: (sim: Simulation) => void = () => undefined): { uses: Use[]; sim: Simulation } => {
      const sim = student('b04-lock-draw');
      first(sim);
      withLaw('US', { fraudRate: 1, preventedShare: 0 }); // TEST SETUP: a use drawn every night, none stopped
      sim.advanceTo(edt(8, 30, 0, 1));
      withLaw('US', { fraudRate: 0 }); // TEST SETUP
      return { sim, uses: (sim.player.fraud ?? []).map((f) => ({ at: f.at, which: f.which, amount: f.amount, on: sim.universe.accounts[f.accountId]!.kind })) };
    };
    const nights = [25, 26, 27, 28, 29, 30].map((d) => edt(8, d, 0, 0));

    const open = play();
    expect(open.uses.map((u) => u.at)).toEqual(nights);
    // Both cards met it: the twin's baseline has nights of each.
    expect(new Set(open.uses.map((u) => u.which))).toEqual(new Set(['credit', 'debit']));
    expect(open.uses.every((u) => (u.which === 'debit' ? u.on === 'checking' : u.on === 'credit_card'))).toBe(true);

    const creditLocked = play(lockFromScreen('credit'));
    expect(creditLocked.uses.map((u) => [u.at, u.which, u.on])).toEqual(nights.map((at) => [at, 'debit', 'checking']));
    expect(moved(creditLocked.sim, chaseCard(creditLocked.sim), 'Card purchase')).toEqual([]);
    expect(moved(creditLocked.sim, primary(creditLocked.sim), 'Card purchase')).toEqual(creditLocked.uses.map((u) => -u.amount));

    // The rate is a person’s, so it falls whole on the card that works. Until 2026-10-13 this held the debit card’s
    // nights lost, only the credit card’s nights of the unlocked twin coming, half the exposure of the credit card locked
    // (defect 61 of that day’s third round).
    const debitLocked = play(lockFromScreen('debit'));
    expect(debitLocked.uses.map((u) => [u.at, u.which, u.on])).toEqual(nights.map((at) => [at, 'credit', 'credit_card']));
    expect(moved(debitLocked.sim, primary(debitLocked.sim), 'Card purchase')).toEqual([]);
    expect(moved(debitLocked.sim, chaseCard(debitLocked.sim), 'Card purchase')).toEqual(debitLocked.uses.map((u) => -u.amount));
  });
});

// ---------------------------------------------------------------------------
// card.report
// ---------------------------------------------------------------------------

describe('card.report', () => {
  /*
   * Capital One's page: "Expedited Delivery by FedEx Priority Overnight, 2-3 business days", no fee stated; Wells Fargo's:
   * "as little as 24 hours". The research kept them as rush days, 3 and 1, and no rush fee, and SLATE charges none where
   * a bank lists none (security.ts's header, and the screen's "The bank lists no fee"). This round decided the rush is
   * offered there: until the engine reads those days, card.report refuses it ("has no rush replacement SLATE knows of")
   * and Your Cards doesn't draw the button, so the days are a declared word nothing reads. It fails until then.
   */
  it('rushes a Capital One debit card from Your Cards in its 3 business days for no fee, as its terms list rush days and no rush fee; Wells Fargo, whose rush has a fee it doesn’t publish, draws no rush and refuses one in those words', () => {
    const sim = student('b04-rush-c1', 'us-capital-one');
    const checking = primary(sim);
    expect(checking.bankId).toBe('us-capital-one');
    const before = checking.balance;
    const screen = draw(sim, createElement(BankSecurity, { bankId: 'us-capital-one' }));
    // The debit card's first, then the Platinum card's.
    expect(screen.all('Report It And Rush The New One')).toHaveLength(2);
    press(screen.button('Report It And Rush The New One'));
    // Three business days from Monday 24 August at 7:30: Tuesday, Wednesday, Thursday 27 August.
    expect(checking.plastic).toMatchObject({ stopped: 'lost', replacementAt: edt(8, 27, 7, 30) });
    expect(checking.balance).toBe(before);
    expect(moved(sim, checking, 'Rush replacement card fee')).toEqual([]);
    expect(draw(sim, createElement(BankSecurity, { bankId: 'us-capital-one' })).text).toContain('Lost: stopped. A new one arrives August 27, 2026.');

    // Until the third round of 2026-10-13 this held Wells Fargo’s rush sent free in one business day, Tuesday 25 August.
    // Its page offers it for credit cards, “in as little as 24 hours (additional fees may apply)”, and its card agreement
    // names a Rush Plastic Fee with no amount: SLATE can’t charge what isn’t published, nor send free what’s charged for.
    const wf = student('b04-rush-wf', 'us-wells-fargo');
    const wfChecking = primary(wf);
    expect(wfChecking.bankId).toBe('us-wells-fargo');
    const wfScreen = draw(wf, createElement(BankSecurity, { bankId: 'us-wells-fargo' }));
    expect(wfScreen.all('Report It And Rush The New One')).toHaveLength(0);
    expect(wfScreen.all('Report It').length).toBeGreaterThan(0);
    expect(wfScreen.text).toContain('Wells Fargo can rush a new credit card: “We may be able to replace your card in as little as 24 hours (additional fees may apply)” (wellsfargo.com/help/lost-wallet). Its Active Cash card agreement names a Rush Plastic Fee but gives no amount. With no fee published, the game doesn’t offer a rushed card.');
    for (const which of ['debit', 'credit'] as const) {
      const refused = wf.execute({ kind: 'card.report', payload: { which, why: 'lost', rush: true } });
      expect(refused.error).toBe('Wells Fargo doesn’t publish what it charges to rush a card, so the game can’t send a rushed one.');
    }
    expect(wfChecking.plastic?.stopped).toBeUndefined();
    // Reported without a rush, it comes in Wells Fargo’s five business days: Monday 31 August.
    expect(must(wf, 'card.report', { which: 'debit', why: 'lost' })).toEqual({ fee: 0, arrivesAt: edt(8, 31, 7, 30) });
  });
});

// ---------------------------------------------------------------------------
// card.request_hardship
// ---------------------------------------------------------------------------

describe('card.request_hardship', () => {
  /**
   * The life's Chase card owing $4,800, late at its first due date and then on a plan: the statement of 20 September asks
   * $4,800, autopay (the whole statement, as the life starts) asks it on Tuesday 13 October at noon of a bank emptied the
   * minute before, and it bounces (Sunday 11 October, 21 days on, until brief 21, 2026-10-22, when a US card's due date
   * became one day each month, Chase's the 13th). The card's minimum was Chase's 1% and the month's interest (none in the introduction),
   * never under $40: $48. Late once on a US card is the safe harbor's $30 and not yet the record (twice is, thirty days
   * past due). Then the plan: $4,830 over forty-eight months, $100.625, a dollar up, $101; and the means to pay come.
   */
  function lateThenPlan(seed: string): { sim: Simulation; card: Account; checking: Account } {
    const sim = settled(seed);
    const card = chaseCard(sim);
    const checking = mine(sim, 'checking');
    purchases(sim, card, 4_800_00); // TEST SETUP
    sim.advanceTo(edt(9, 20, 9, 1));
    expect(stateOf(sim.player, card).statementBalance).toBe(4_800_00);
    sim.advanceTo(edt(10, 13, 11, 59));
    setBalance(sim, checking, 0); // TEST SETUP: the bank emptied the minute before the due date
    setBalance(sim, mine(sim, 'savings'), 0); // TEST SETUP
    sim.advanceTo(edt(10, 13, 12, 5));
    expect(moved(sim, card, 'Late fee')).toEqual([-30_00]);
    expect(notes(sim, 'A Late Card Payment').map((n) => n.body)).toEqual(['The minimum payment on the Chase Freedom Unlimited, $48.00, was due October 13, 2026, and nothing was paid. That costs a $30.00 late fee. If the payment is still short at the next due date, thirty days late, it goes on your credit record and Chase suspends the card. Pay the card on Money, under Cards.']);
    expect(stateOf(sim.player, card).missed).toBe(1);
    expect(sim.player.credit!.late).toEqual([]);
    expect(sim.player.credit!.score).toBe(795);
    expect(must(sim, 'card.request_hardship', {})).toEqual({ payment: 101_00 });
    setBalance(sim, checking, 1_000_00); // TEST SETUP: the means to pay the plan, come since
    // The statement of 20 October asks the plan's payment, and charges no interest on a plan.
    sim.advanceTo(edt(10, 20, 9, 1));
    expect(notes(sim, 'Statement Ready: Chase Freedom Unlimited').at(-1)!.body).toContain('The statement comes to $4,830.00, due November 13, 2026. The plan’s payment is $101.00. Autopay pays $101.00 from Chase Total Checking that day, if there’s enough in it.');
    expect(moved(sim, card, 'Interest')).toEqual([]);
    return { sim, card, checking };
  }

  it('puts a missed payment back to none once the plan’s $101 is met at the next due date, and the month counts on time; its twin, emptied before that due date, misses a second and goes on the record', () => {
    const met = lateThenPlan('b04-plan-missed');
    const short = lateThenPlan('b04-plan-missed');
    // Due the 13th: Friday 13 November at noon, on Eastern Standard Time (Tuesday 10 November, 21 days after 20 October,
    // until brief 21, 2026-10-22).
    for (const { sim, card } of [met, short]) {
      sim.advanceTo(est(11, 13, 11, 59));
      expect(moved(sim, card, 'Paid Chase Freedom Unlimited')).toEqual([]);
      expect(stateOf(sim.player, card).missed).toBe(1);
    }
    setBalance(short.sim, short.checking, 0); // TEST SETUP: the twin's bank emptied the minute before
    for (const { sim } of [met, short]) sim.advanceTo(est(11, 13, 12, 5));

    // Autopay asks the plan's $101, not the whole $4,830 it's set to, and it's paid: on time, the count back to none.
    expect(moved(met.sim, met.card, 'Paid Chase Freedom Unlimited')).toEqual([101_00]);
    expect(met.card.balance).toBe(-4_729_00);
    expect(stateOf(met.sim.player, met.card).missed).toBe(0);
    expect(moved(met.sim, met.card, 'Late fee')).toEqual([-30_00]);
    // A month paid as agreed, three; $4,729 of $65,217 used is 7%, under the 30% past which the record docks it.
    expect(met.sim.player.credit!.score).toBe(798);
    expect(met.sim.player.credit!.late).toEqual([]);
    expect(stateOf(met.sim.player, met.card).hardship).toEqual({ payment: 101_00, since: edt(10, 13, 12, 5) });

    // The twin: the plan's $101 bounced, a second miss, thirty days past due, on the record. A repeat within six cycles
    // may be the safe harbor's $41, and Chase's card agreement says "up to $40": $40.
    expect(notes(short.sim, 'A Card Payment Bounced').at(-1)!.body).toBe('The Chase Freedom Unlimited’s autopay of $101.00 didn’t go through, because Chase Total Checking couldn’t cover it. The payment is late now, and its late fee is the only fee you’re charged for it. Move money into Chase Total Checking, then pay the card on Money, under Cards.'); // Until 2026-10-16 (brief 09's banking follow-up) this asserted the notice's straight apostrophe (\').
    expect(stateOf(short.sim.player, short.card).missed).toBe(2);
    expect(moved(short.sim, short.card, 'Late fee')).toEqual([-30_00, -40_00]);
    // The record’s mark is that due date’s: 13 November, at its noon (10 November until brief 21). Until the third round of 2026-10-13 this was held
    // to the hour, the due date running at 12:01: `dueAt` passed the 20th plus 21 days unmended to `instantFromZoned`,
    // which took it down its gap path a minute late (defect 48 of that round).
    const second = short.sim.universe.transactions.filter((t) => t.memo === 'Late fee').at(-1)!.at;
    expect(short.sim.player.credit!.late).toEqual([second]);
    expect(second).toBe(est(11, 13, 12, 0));
    expect(notes(short.sim, 'A Late Card Payment').at(-1)!.body).toBe('The plan’s payment on the Chase Freedom Unlimited, $101.00, was due November 13, 2026, and nothing was paid. That costs a $40.00 late fee, and it’s on your credit record now. Pay the card on Money, under Cards.');
  });

  it('is what the Statements page asks on a plan: the 20 October statement the plan’s $101, and the 20 September one, due before the plan began, the card’s $48', () => {
    const { sim, card } = lateThenPlan('b04-plan-page');
    sim.advanceTo(est(11, 13, 12, 5));
    // The life’s first statement, cut by the clock on 20 September, is kept, not rebuilt; the months before it, from
    // before the life began, are drawn back to the card’s opening. Until the third round of 2026-10-13 this held the
    // first one “(Rebuilt)”, with the note that it came from before statements were kept (defect 49).
    expect(periodsOf(sim, card).slice(0, 4).map((p) => [p.label, p.rebuilt ?? false])).toEqual([
      ['Statement Of November 20, 2026, So Far', false], ['Statement Of October 20, 2026', false], ['Statement Of September 20, 2026', false],
      ['Statement Of August 20, 2026 (Rebuilt)', true],
    ]);
    const october = draw(sim, createElement(BankStatements), [card.id, 1]).text;
    expect(october).toContain('Brought Forward $4,800.00 Payments And Credits $0.00 Spending $0.00 Fees $30.00 Interest $0.00 New Balance $4,830.00');
    expect(october).toContain('The plan’s payment is $101.00, due November 13, 2026.');
    const september = draw(sim, createElement(BankStatements), [card.id, 2]).text;
    expect(september).not.toContain('Rebuilt: this statement is from before the game kept card statements');
    expect(september).toContain('New Balance $4,800.00');
    expect(september).toContain('The minimum payment is $48.00, due October 13, 2026.');
    expect(september).not.toContain('the plan’s payment');
  });
});

// ---------------------------------------------------------------------------
// statements
// ---------------------------------------------------------------------------

describe('statements', () => {
  it('writes each line’s balance after it, as worked here: Chase Savings’ $413,043 less $1,000 and $250 moved out, and the card owing $5, $10 and then $7 after two meals and a $3 payment', () => {
    const sim = student('b04-lines');
    const checking = primary(sim);
    const savings = mine(sim, 'savings');
    // The family's money put in Chase Savings at creation.
    expect(savings.balance).toBe(413_043_00);
    must(sim, 'bank.transfer', { fromId: savings.id, toId: checking.id, amount: 1_000_00 });
    sim.advanceBy(3_600_000);
    must(sim, 'bank.transfer', { fromId: savings.id, toId: checking.id, amount: 250_00 });
    const saved = draw(sim, createElement(BankStatements), [savings.id, 0]).text;
    // Newest first, as a banking app shows them; six figures written without cents, as the screen writes them.
    expect(saved).toContain('Period August 2026, So Far');
    expect(saved).toContain('Opening Balance $0.00 Money In $413,043 Money Out $1,250.00');
    expect(saved).toContain('Available Now $411,793');
    expect(saved).toContain([
      'August 24, 2026 Moved to Chase Total Checking −$250.00 $411,793',
      'August 24, 2026 Moved to Chase Total Checking −$1,000.00 $412,043',
      'August 24, 2026 Opening balance: Chase Savings +$413,043 $413,043',
    ].join(' '));

    // The card: a $5 meal (New Haven's $4 meal at its cost of living, 127, $5.08, to the dollar), twice, and $3 paid.
    must(sim, 'bank.set_payments', { everyday: 'credit' });
    const card = chaseCard(sim);
    expect(card.balance).toBe(0);
    hungry(sim); // TEST SETUP
    must(sim, 'life.look_after', { action: 'eat' });
    sim.advanceBy(5 * 3_600_000);
    hungry(sim); // TEST SETUP
    must(sim, 'life.look_after', { action: 'eat' });
    expect(must(sim, 'finance.pay_card', { amount: 3_00 })).toEqual({ paid: 3_00 });
    const owed = draw(sim, createElement(BankStatements), [card.id, 0]).text;
    expect(owed).toContain('Period Statement Of September 20, 2026, So Far');
    expect(owed).toContain('Brought Forward $0.00 Payments And Credits $3.00 Spending $10.00 Fees $0.00 Interest $0.00 Balance Now $7.00');
    expect(owed).toContain('Date What Charged / Paid Owed After');
    expect(owed).toContain([
      'August 24, 2026 Paid Chase Freedom Unlimited +$3.00 $7.00',
      'August 24, 2026 A meal · Pending, posts August 26, 2026 −$5.00 $10.00',
      'August 24, 2026 A meal · Pending, posts August 26, 2026 −$5.00 $5.00',
    ].join(' '));
  });
});
