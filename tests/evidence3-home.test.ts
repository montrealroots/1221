/**
 * Round three of 2026-10-14 was for six rows the first two rounds (tests/evidence-g32-ui.test.ts,
 * tests/evidence-g33-ui.test.ts, tests/evidence2-b11.test.ts, tests/evidence2-b12.test.ts) left partial: Home's What
 * Needs You and its three lines of Your Affairs, a foreign graduate's status decision, and the Profile's School Journey.
 * What those rounds reached only by a fixture was reached here by play, once creation offered a family with need
 * (`withFamily`, `FAMILIES`, from 2026-10-14), and a school was played to its degree in slices across reloads.
 *
 * - `h-needs`: the weighing sentences the first round wrote over hand-made debts were each reached by play: "You owe
 *   $1,882 that went unpaid." (the checking moved to savings at 7:30 on the first morning, and the fall's Yale Health
 *   plan billed at nine to nothing); "Your card is nearly at its limit, owing $1,630." (a Scraping family's card carried
 *   to its limit, the autopay bounced, where at $1,423 a month before it wasn't), "$1,999 is with collections." at the
 *   sixth payment missed, gone once Pay was sent; and "You owe $50 for medical care." (a bone broken on the first
 *   morning's run, Yale Health's $50 for the emergency room, the checking moved to savings before the bill's day).
 * - `h-money`: "No account" was reached by no life: the poorest family had a checking and nothing else, and the bank
 *   refused to close it; a card charged off to collections left the checking named.
 * - `h-school`: the Graduated branch was played: a student from London kept up hour by hour by the attentive policy from
 *   24 August 2026 to 22 May 2029, in twenty-six slices of under ten seconds each across reloads, read "Graduated, N of
 *   16 in the class." with no Next and no alert, N counted here from the class's craft.
 * - `h-papers`: Connecticut's part and the IRS's were added on Home on a played life and year where both were owed: a
 *   Scraping family's student in 2027, $1,700.39 to the IRS on 2026's table and $585.33 to Connecticut, both worked here;
 *   her money put in a Chase CD, which the IRS can't draw on, and File It pressed: "$2,286 of tax owed", and the day
 *   past the due date "$2,359", each authority's interest and penalty in it. Left open, her 2027 return "is due April
 *   18, 2028" to the day before and "was due" on it the day past; until 2026-10-14 the alert said "is due" a date gone.
 * - `n-decision-us-status`: the OPT decision on a degree played, not conferred by hand: the played graduate's F-1 was
 *   looked at by the clock on 31 May 2029, Apply For OPT pressed on Home on 1 June, $470, a permit pending to 30 August,
 *   approved by the clock across a reload.
 * - `p-journey-history`: School Journey on the played graduate said every part she played once.
 *
 * Three defects this round found were fixed on 2026-10-14 (5f0cba03), and the tests that held them, titled DEFECT and
 * failing until then, were retitled for what they assert: Home's Papers alert named the first open return by year, so
 * on 1 February 2028 a 2026 return owing nothing, Connecticut's $3.35 taken by levy, was "due April 15, 2027" and the
 * 2027 return's $2,286 wasn't named; School Journey's subtitle for a graduate read "Graduated, graduated" (the words
 * Home's School line lost on 2026-10-13); and an understudy's Rep run that she went on in was never closed (`closeRun`
 * was reached only from a last performance call, which an understudy's run, all on call, had none of), so from The
 * Seagull's last night, 27 March 2027, until the next casting filed it in August, School Journey said "No production
 * yet." with her night as Nina on the record.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`, the family chosen as creation's select chooses it,
 * `withFamily`), Ada Cole, she/her, an actress at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, born in New
 * York, or in London for the graduate on an F-1; played by the clock, the commands the screens send, and for the
 * graduate the attentive policy (`tools/policy.ts attentiveHour`), the project's own student, through public commands.
 * Home and the Profile are the game's own screens rendered with react-dom/server, their buttons pressed through their
 * own onClick; `useGame` stands in for the provider, its `run` the save's own `execute`. Seeds are arbitrary, none
 * picked for what it draws, except g09-run-1668, the first morning's run that breaks a bone in
 * tests/evidence2-b12.test.ts.
 *
 * TEST SETUP: none. Every balance, debt, return and degree here is reached by play.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig, withFamily, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { instantFromZoned, MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { openDecisions } from '@/engine/world/world';
import { SEAGULL_2027, SKILLS } from '@/engine/content/school';
import { CONNECTICUT } from '@/engine/content/safetynet';
import { cardsOf } from '@/engine/systems/credit';
import { documentsOf } from '@/engine/systems/documents';
import { f1Of } from '@/engine/systems/permission';
import { healthOf } from '@/engine/systems/health';
import { attentiveHour } from '../tools/policy';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** Where `navigate` was sent. */
  went: [] as string[],
  /** Each useState in render order: its number this render, what a press set, and what's given back next render. */
  calls: 0,
  sets: [] as { at: number; value: unknown }[],
  given: new Map<number, unknown>(),
  /** The buttons drawn, with their words and their own onClick. */
  buttons: [] as { text: string; onClick?: () => unknown }[],
}));

// What a press sets is given back by the useState's place in the render, as React keeps it.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const i = h.calls++;
    const [value] = real.useState(initial);
    const now = h.given.has(i) ? h.given.get(i) : value;
    const set = (action: unknown) => { h.sets.push({ at: i, value: typeof action === 'function' ? (action as (v: unknown) => unknown)(now) : action }); };
    return [now, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepButtons = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), onClick: props.onClick as (() => unknown) | undefined });
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

// Without the original: it imports the looks, which import it back.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: (to: string) => { h.went.push(to); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

const { Home } = await import('@/ui/screens/Home');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');

// ---------------------------------------------------------------------------
// Lives, the screens over them, and the figures worked out by hand
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
/** An instant of New Haven's wall clock. */
const at = (year: number, month: number, day: number, hour = 12, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** Ada Cole at Yale, born in New York, from the family chosen on creation (a wealthy one unless a test says). */
const ada = (seed: string, family: StartingWealth = 'wealthy', extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...withFamily(newLifeConfig(), family), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const opened = (text: string): Simulation => loadSave(deserialise(text) as never);

/** The words a player reads: titles out, tags out, entities back, and no space before a full stop or a comma. */
const words = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
/** A screen as the player has it, with what a press set given back. */
function drawn(sim: Simulation, screen: FunctionComponent): { html: string; text: string } {
  h.sim = sim;
  h.calls = 0;
  h.sets = [];
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: words(html) };
}
/** A button just drawn, by its words; fails if it isn't there. */
function button(said: string) {
  const found = h.buttons.filter((b) => b.text === said);
  expect(found.map((b) => b.text), `one “${said}” button`).toEqual([said]);
  return found[0]!;
}
/** Pressed: its own onClick, and what it set given back on the next render. */
function press(b: { onClick?: () => unknown }): unknown {
  h.sets = [];
  const out = b.onClick!();
  for (const s of h.sets) h.given.set(s.at, s.value);
  return out;
}
/** The words from one heading to the next. */
function between(text: string, from: string, to?: string): string {
  const i = text.indexOf(from);
  expect(i, `“${from}” on the screen`).toBeGreaterThanOrEqual(0);
  const j = to ? text.indexOf(to, i + from.length) : -1;
  return text.slice(i, j < 0 ? undefined : j).trim();
}
/** Cents written to the whole dollar, as Home writes a sum owed. */
const dollars = (n: number) => `$${Math.round(n / 100).toLocaleString('en-US')}`;
const own = (sim: Simulation, kind: Account['kind']): Account => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === kind && !a.closedAt && a.category !== 'term')!;
const checkingOf = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
/** Move Money: all of the checking into savings. */
const emptyChecking = (sim: Simulation) => {
  const c = checkingOf(sim);
  if (c.balance > 0) sim.must({ kind: 'bank.transfer', payload: { fromId: c.id, toId: own(sim, 'savings').id, amount: c.balance } });
  expect(c.balance).toBe(0);
};
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

beforeEach(() => {
  h.given = new Map();
  h.went = [];
});

// ---------------------------------------------------------------------------
// h-needs and h-money
// ---------------------------------------------------------------------------

describe('h-needs', () => {
  const needs = (sim: Simulation) => between(drawn(sim, Home).text, 'What Needs You', 'How You Are');
  const unread = (sim: Simulation) => sim.universe.notifications.filter((n) => !n.read).length;
  /** Mark N Read, pressed on the panel, N counted here from the save. */
  const markRead = (sim: Simulation) => {
    const n = unread(sim);
    if (n === 0) return;
    drawn(sim, Home);
    expect(press(button(`Mark ${n} Read`))).toMatchObject({ ok: true, value: { read: n } });
  };
  const WAITING = 'What Needs You No questions are waiting on you. How This Works No Questions Waiting';
  const ALL_CLEAR = 'What Needs You No questions are waiting on you. How This Works All Clear You owe nobody anything past due, the bank and the card are in order, and the calendar doesn’t clash. Go and do something you want to do.';

  it('PLAYER JOURNEY: the checking moved to savings at 7:30 on the first morning, the fall’s Yale Health plan, $1,882, goes unpaid at nine: “You owe $1,882 that went unpaid.” at noon, across a reload, paid back out of savings at midnight; her twin who kept it is All Clear', () => {
    const played = (move: boolean) => {
      const sim = ada('r3-owed');
      if (move) emptyChecking(sim);
      sim.advanceTo(at(2026, 8, 24, 12));
      expect(openDecisions(sim)).toEqual([]);
      markRead(sim);
      return sim;
    };
    const sim = played(true);
    // The Bulletin's 2026–27 Yale Health plan, $3,764 a year, half of it a term, billed at nine to a checking with
    // nothing in it: owed (until 2026-10-13 a plan the bank couldn't pay was dropped, tests/evidence2-b10.test.ts).
    expect(sim.universe.transactions.filter((t) => t.memo === 'Yale Health plan, the fall term of 2026, unpaid').map((t) => t.at)).toEqual([at(2026, 8, 24, 9)]);
    const said = `${WAITING} You owe $${(3_764 / 2).toLocaleString('en-US')} that went unpaid.`;
    expect(needs(sim)).toBe(said);
    expect(needs(reload(sim))).toBe(said);
    // What's owed is paid back at midnight where the bank has it, savings included (`settleArrears`): the day after,
    // nothing weighs, though the day's groceries went on the card.
    sim.advanceTo(at(2026, 8, 25, 12));
    expect(sim.universe.transactions.filter((t) => t.memo === 'Paid back what was owed').map((t) => t.at)).toEqual([at(2026, 8, 25, 0)]);
    markRead(sim);
    expect(needs(sim)).toBe(ALL_CLEAR);
    expect(needs(played(false))).toBe(ALL_CLEAR);
  });

  it('PLAYER JOURNEY: a Scraping family’s card, its spending put on it and the checking moved to savings before each due date: a payment behind at $1,423, then at its $1,630 limit “nearly at its limit”, then charged off at the sixth: “$1,999 is with collections.”, the checking still named on the Money line, and gone once Pay is sent', () => {
    const sim = ada('r3-coll', 'scraping');
    const card = cardsOf(sim, sim.player)[0]!;
    // The Scraping profile's card: a 1,500 € limit and 840 € owed, at SLATE's 0.92 € to the dollar, to the dollar
    // (tests/need-paths.test.ts): $1,630 and $913.
    expect([card.creditLimit, card.balance]).toEqual([1_630_00, -913_00]);
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    const nextDue = () => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === 'card.due').sort((a, b) => a.at - b.at)[0];
    /** To an hour before the next due date, the checking moved to savings, so the autopay bounces. */
    const toDue = () => {
      for (let d = 0; d < 40 && !nextDue(); d++) sim.advanceTo(sim.now + MS_DAY);
      const due = nextDue()!;
      expect(due).toBeDefined();
      sim.advanceTo(due.at - MS_HOUR);
      emptyChecking(sim);
      return due.at;
    };
    const past = (due: number) => sim.advanceTo(due + 60_000);

    // The first: 48 midnights of $10.00 groceries on the card from 25 August to 11 October, on the $913 carried, and
    // Regulation Z's safe-harbor $30 for a first late payment: $1,423, under nine-tenths of $1,630, $1,467.
    past(toDue());
    markRead(sim);
    expect(-card.balance).toBe(913_00 + 48 * 10_00 + 30_00);
    expect(-card.balance).toBeLessThan(0.9 * 1_630_00);
    expect(needs(sim)).toBe(`${WAITING} Your card is a payment behind, owing $1,423.`);

    // The second, an hour before: the groceries have taken the card to its limit and no further, $1,630, past $1,467.
    const second = toDue();
    markRead(sim);
    expect(-card.balance).toBe(1_630_00);
    expect(needs(sim)).toBe(`${WAITING} Your card is nearly at its limit, owing $1,630. Your card is a payment behind, owing $1,630.`);
    past(second);

    // The third to the sixth missed the same way: at the sixth (CHARGE_OFF_AFTER, the FFIEC's 180 days) the card is
    // closed and what it owed, its balance the hour before and that due date's $40 fee, is with collections.
    for (let k = 3; k <= 6; k++) {
      const due = toDue();
      if (k === 6) {
        const owing = -card.balance;
        past(due);
        expect(titled(sim, 'Your Card Was Charged Off')).toHaveLength(1);
        const debt = sim.ledger.accountsOf(sim.player.id).find((a) => a.category === 'collections')!;
        expect(-debt.balance).toBe(owing + 40_00);
        expect(dollars(owing + 40_00)).toBe('$1,999');
      } else past(due);
    }
    expect(card.closedAt).toBeDefined();
    // The 2026 return raised on 1 February, Connecticut's $3.35, filed from the panel and paid out of savings, so What
    // Needs You has nothing to decide.
    drawn(sim, Home);
    if (openDecisions(sim).some((d) => d.title === 'Your 2026 Tax Return')) expect(press(button('File It'))).toMatchObject({ ok: true });
    expect(openDecisions(sim)).toEqual([]);
    markRead(sim);
    const said = `${WAITING} $1,999 you owe is with a collection agency.`;
    expect(needs(sim)).toBe(said);
    expect(needs(reload(sim))).toBe(said);
    // h-money: the card closed to collections, the checking stays, and the Money line names it.
    expect(between(drawn(sim, Home).text, 'Your Affairs', 'School')).toMatch(/^Your Affairs (How This Works )?Money Chase Total Checking: \$0\.00\. Worth /);
    // Paid from the checking, the money brought back from savings: the debt settled, and the sentence gone.
    const debt = sim.ledger.accountsOf(sim.player.id).find((a) => a.category === 'collections')!;
    const owed = -debt.balance;
    sim.must({ kind: 'bank.transfer', payload: { fromId: own(sim, 'savings').id, toId: checkingOf(sim).id, amount: owed } });
    const paid = sim.must<{ paid: number; left: number }>({ kind: 'bank.pay_collections', payload: { amount: owed } });
    expect([paid.paid, paid.left === 0]).toEqual([owed, true]);
    markRead(sim);
    expect(needs(sim)).not.toContain('with collections');
  });

  it('PLAYER JOURNEY: at Capital One, chosen on creation, a bone broken on the first morning’s run, Yale Health’s $50 for the emergency room billed due in thirty days, the checking moved to savings the hour before: “You owe $50 for medical care.”, across a reload; her twin who kept it is All Clear, and at Chase, which pays an item past zero, she’s $50 overdrawn instead', () => {
    const played = (move: boolean, bankId = 'us-capital-one') => {
      const sim = ada('g09-run-1668', 'wealthy', { bankId });
      sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
      const bills = healthOf(sim.player).bills;
      // A broken bone's care is the emergency room and six sessions of physical therapy (content/injury.ts); Yale Health
      // leaves $50 for the emergency room and nothing for a visit (content/safetynet.ts): $50, due thirty days on.
      expect(bills.map((b) => [b.what, b.amount, (b.dueAt - b.at) / MS_DAY])).toEqual([['A broken bone’s care', 50_00, 30]]);
      sim.advanceTo(bills[0]!.dueAt - MS_HOUR);
      if (move) emptyChecking(sim);
      // Before midnight, so the day's groceries don't come into it.
      sim.advanceTo(bills[0]!.dueAt + 30 * 60_000);
      markRead(sim);
      return sim;
    };
    const sim = played(true);
    expect(healthOf(sim.player).bills[0]!.inDebt).toBe(true);
    const said = `${WAITING} You owe $50 for medical care.`;
    expect(needs(sim)).toBe(said);
    expect(needs(reload(sim))).toBe(said);
    const twin = played(false);
    expect(healthOf(twin.player).bills[0]!.paid).toBe(true);
    expect(needs(twin)).toBe(ALL_CLEAR);
    // Chase pays an item up to $500 past zero (`perItemCover`, SLATE's estimate), so the bill is paid into an overdraft.
    const chase = played(true, 'us-chase');
    expect(healthOf(chase.player).bills[0]!.paid).toBe(true);
    expect(needs(chase)).toBe(`${WAITING} Your account is $50 overdrawn.`);
  });
});

describe('h-money', () => {
  it('PLAYER JOURNEY: the poorest family, Nothing, has a checking and nothing else, $43, and the bank refuses to close it: the line names it, and “No account” is reached by no life', () => {
    const sim = ada('r3-nothing', 'nothing');
    // 40 € at 0.92 to the dollar, $43, and no savings or card (tests/need-paths.test.ts).
    expect(sim.ledger.accountsOf(sim.player.id).map((a) => [a.name, a.balance])).toEqual([['Chase Total Checking', 43_00]]);
    expect(sim.execute({ kind: 'bank.close_current', payload: { accountId: checkingOf(sim).id } }).error)
      .toBe('It’s your only checking account, and you always need one for your wages to be paid into. Open another one first.');
    expect(between(drawn(sim, Home).text, 'Your Affairs', 'School')).toMatch(/Money Chase Total Checking: \$43\.00\. Worth \$43\. Chase How This Works/);
  });
});

// ---------------------------------------------------------------------------
// h-papers
// ---------------------------------------------------------------------------

describe('h-papers', () => {
  /** A Scraping family's student, left to the clock to noon on 1 February 2028, her 2027 return raised. */
  const needy = () => {
    const sim = ada('r3-tax-scraping', 'scraping');
    sim.advanceTo(at(2028, 2, 1, 12));
    return sim;
  };
  /** Your Affairs' Papers line, its alerts in it. */
  const papers = (one: Simulation) => between(between(drawn(one, Home).text, 'Your Affairs'), 'Papers Cover', 'Papers How This Works');

  it('PLAYER JOURNEY: on 1 February 2028, her 2026 return unfiled, owing nobody since Connecticut’s levy, and her 2027 return owing $2,286, Home’s alert names the 2027 return and what it would pay', () => {
    const sim = needy();
    expect(sim.player.returns!['2026']!.filedAt).toBeUndefined();
    expect(sim.player.returns!['2027']!.figures.balance).toBe(2_285_72);
    expect(papers(sim)).toContain('The 2027 return is due April 18, 2028, $2,286 to pay.');
  });

  it('PLAYER JOURNEY: her 2027 return left open, it “is due April 18, 2028” on 1 February and on the day before, and the day past it “was due April 18, 2028”, a late penalty in it, across a reload: until 2026-10-14 it still “is due” a date gone', () => {
    const sim = needy();
    const r = sim.player.returns!['2027']!;
    expect(papers(sim)).toContain('The 2027 return is due April 18, 2028, $2,286 to pay.');
    sim.advanceTo(r.due - MS_DAY);
    expect(r.filedAt).toBeUndefined();
    expect(papers(sim)).toContain('The 2027 return is due April 18, 2028,');
    expect(papers(sim)).not.toContain('was due');
    sim.advanceTo(r.due + MS_DAY);
    expect(r.filedAt).toBeUndefined();
    const past = /The 2027 return (\w+) due April 18, 2028, \$[\d,]+ to pay, a late penalty in it\./;
    expect(past.exec(papers(sim))?.[1]).toBe('was');
    expect(past.exec(papers(reload(sim)))?.[1]).toBe('was');
    expect(papers(sim)).not.toContain('is due');
  });

  it('PLAYER JOURNEY: a student with need owes the IRS $1,700.39 and Connecticut $585.33 on 2027; her money put in a Chase CD and File It pressed on Home, it files unpaid: “$2,286 of tax owed”, both parts, and the day past the due date “$2,359”, each with its own interest and penalty, across a reload', () => {
    const sim = needy();
    const r = sim.player.returns!['2027']!;
    const f = r.figures;
    // Her 2027: two terms' taxable scholarship, a year's work-study and cents of interest, nothing withheld.
    expect(f.income).toBe(f.scholarship! + f.workStudy + f.interest!);
    expect(f.withheld).toBe(0);
    // The IRS on 2026's table, held for 2027 (Rev. Proc. 2025-32, §4.01 and §4.14(1)): $16,100 deducted, 10% to $12,400
    // and 12% above.
    const taxable = f.income - 16_100_00;
    const federal = Math.round(0.1 * 12_400_00 + 0.12 * (taxable - 12_400_00));
    // Connecticut's (CT-1040): the $15,000 exemption falls $1,000 for each $1,000 or part over $30,000; 2% to $10,000
    // taxable and 4.5% above; the personal credit 12% for income over $32,300 to $32,800.
    expect(f.income).toBeGreaterThan(32_300_00);
    expect(f.income).toBeLessThanOrEqual(32_800_00);
    const exemption = 15_000_00 - 1_000_00 * Math.ceil((f.income - 30_000_00) / 1_000_00);
    const ct = Math.round((0.02 * 10_000_00 + 0.045 * (f.income - exemption - 10_000_00)) * (1 - 0.12));
    expect(CONNECTICUT.exemption).toBe(15_000_00);
    expect([federal, ct]).toEqual([1_700_39, 585_33]);
    expect(f.owedTo).toEqual({ irs: federal, states: { 'us-ct': ct } });
    // Her 2026 return, never filed, Connecticut's $3.35 taken by levy in the autumn, filed from Papers. Until 2026-10-14
    // that was what let Home's alert name the 2027 return, which it has named since with the 2026 one open (the test above).
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    // Before filing, the alert adds the two for what filing would pay.
    expect(papers(sim)).toContain('The 2027 return is due April 18, 2028, $2,286 to pay.');
    // Everything put where a payment can't reach: the savings into the checking, and the checking into a CD.
    sim.must({ kind: 'bank.transfer', payload: { fromId: own(sim, 'savings').id, toId: checkingOf(sim).id, amount: own(sim, 'savings').balance } });
    sim.must({ kind: 'bank.open_term', payload: { amount: checkingOf(sim).balance } });
    expect([checkingOf(sim).balance, own(sim, 'savings').balance]).toEqual([0, 0]);
    drawn(sim, Home);
    expect(press(button('File It'))).toMatchObject({ ok: true, value: { ok: true } });
    // Filed, and nothing paid: each authority's part owed as filed.
    expect([r.filedAt, r.owed, r.stateDue!['us-ct']!.owed]).toEqual([sim.now, federal, ct]);
    // $1,700.39 and $585.33, $2,285.72: neither alone, $1,700 or $585.
    expect(dollars(federal + ct)).toBe('$2,286');
    expect(papers(sim)).toContain('$2,286 of tax owed.');
    // A day past 18 April 2028's due date: the IRS's 0.5% for a month begun (IRC 6651(a)(2)) and a day's 7% a year
    // compounded daily (6621, 6622); Connecticut's 10% once and 1% for a month begun (Conn. Gen. Stat. 12-735).
    sim.advanceTo(r.due + MS_DAY);
    const irsToday = federal * (1 + 0.005) + federal * ((1 + 0.07 / 365) ** 1 - 1);
    const ctToday = ct * (1 + 0.1 + 0.01);
    expect([dollars(irsToday), dollars(ctToday), dollars(irsToday + ctToday)]).toEqual(['$1,709', '$650', '$2,359']);
    const said = '$2,359 of tax owed, with its interest and a late penalty growing each month.';
    expect(papers(sim)).toContain(said);
    expect(papers(reload(sim))).toContain(said);
  });
});

// ---------------------------------------------------------------------------
// The graduate: a school played to its degree, in slices across reloads
// ---------------------------------------------------------------------------

/**
 * PLAYER JOURNEY: Ada, born in London, on an F-1, kept up hour by hour by the attentive policy from Monday 24 August 2026
 * to noon on 22 May 2029, the day after Commencement. The whole took 191 seconds in one run on this machine on
 * 2026-10-14 (tools/lives.ts's London profile graduates 39 lives of 39), so it is played in slices, each from the save
 * the last one left, reloaded. There were fourteen that day, the longest 20 seconds alone and up to 30 in a loaded full
 * run, against each slice's 60-second limit; they were cut to twenty-six the same day, a month or so of term each and
 * the summers whole: 119 seconds in all alone, the longest 9.6 (1 October to 1 November 2028), so a slice slowed
 * threefold by a loaded run still finishes in half its limit. She graduated at the new cuts, and every test after the
 * slices passed on them.
 */
const SLICES: [number, number, number][] = [
  [2026, 10, 15], [2026, 12, 1], [2027, 1, 15], [2027, 2, 15], [2027, 3, 15], [2027, 4, 15], [2027, 9, 1], [2027, 10, 1],
  [2027, 11, 1], [2027, 12, 1], [2028, 1, 15], [2028, 2, 15], [2028, 3, 15], [2028, 6, 1], [2028, 9, 1], [2028, 10, 1],
  [2028, 11, 1], [2028, 12, 1], [2029, 1, 1], [2029, 2, 1], [2029, 2, 15], [2029, 3, 1], [2029, 3, 15], [2029, 4, 1],
  [2029, 4, 20], [2029, 5, 22],
];
const kept: { text?: string; april2027?: string; graduated?: string } = {};
const statusDecision = (sim: Simulation) => Object.values(sim.universe.decisions).filter((d) => d.refType === 'us-status');
const optPermits = (sim: Simulation) => documentsOf(sim.player).filter((d) => d.kind === 'permit' && d.name === 'Employment Authorization, OPT');
// To the paragraph's closing period before the School button (from 2026-10-17): “Left the School” has the word too.
const journey = (sim: Simulation) => `${between(drawn(sim, ProfileWorkspace).text, 'School Journey', '. School')}.`;

describe('the graduate, played', () => {
  for (const [y, m, d] of SLICES) {
    it(`PLAYER JOURNEY: kept up to ${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}, from the save the slice before left`, () => {
      const sim = kept.text ? opened(kept.text) : ada('r3-grad', 'wealthy', { homeRegionId: 'uk-eng-london' });
      if (!kept.text) expect(f1Of(sim.player)!.expiresAt).toBe(Date.UTC(2029, 6, 30, 12));
      const to = at(y, m, d);
      while (sim.now < to) attentiveHour(sim);
      expect(sim.player.school!.standing).not.toMatch(/dismissed|withdrawn|withheld/);
      kept.text = serialise(sim.universe);
      if (y === 2027 && m === 4) kept.april2027 = kept.text;
      if (y === 2029 && m === 5) kept.graduated = kept.text;
      // Each slice measured under ten seconds alone on 2026-10-14: the limit is six times the longest, for a loaded run.
    }, 60_000);
  }

  it('h-school: PLAYER JOURNEY: the degree played, Home says “Graduated, N of 16 in the class.”, N one more than the classmates whose mean over the 21 skills is above hers, with no Next and no alert, across a reload', () => {
    expect(kept.graduated, 'the slices played').toBeDefined();
    const sim = opened(kept.graduated!);
    expect(sim.player.school!.standing).toBe('graduated');
    expect(SKILLS).toHaveLength(21);
    const mean = (c: object) => SKILLS.reduce((a, s) => a + (c as Record<string, number>)[s.id]!, 0) / SKILLS.length;
    const mine = mean(sim.player.craft!);
    const place = 1 + sim.player.school!.classmates.filter((x) => mean(x.craft) > mine).length;
    const line = `School Graduated, ${place}${[11, 12, 13].includes(place % 100) || place % 10 > 3 ? 'th' : ['th', 'st', 'nd', 'rd'][place % 10]} of 16 in the class. Yale How This Works`;
    for (const one of [sim, reload(sim)]) {
      const affairs = between(drawn(one, Home).text, 'Your Affairs');
      expect(affairs).toContain(line);
      expect(affairs).not.toContain('Graduated, graduated');
      expect(affairs).not.toContain('Your standing is');
    }
  });

  it('n-decision-us-status: PLAYER JOURNEY: the played graduate’s F-1 is looked at by the clock on 31 May 2029, due 30 July; Apply For OPT pressed on Home on 1 June pays $470 and leaves a permit pending ninety days, to 30 August, which holds her status past 30 July and is approved for twelve months, across a reload', () => {
    expect(kept.graduated, 'the slices played').toBeDefined();
    const sim = opened(kept.graduated!);
    sim.advanceTo(at(2029, 5, 30, 12));
    expect(statusDecision(sim)).toEqual([]);
    sim.advanceTo(at(2029, 6, 1, 12));
    expect(statusDecision(sim)).toHaveLength(1);
    const [d] = statusDecision(sim);
    // The program's end, 31 May 2029 at noon UTC, and sixty days' grace after a degree (8 CFR 214.2(f)(5)(iv)).
    expect(d).toMatchObject({ title: 'Your US Status Is Ending', createdAt: Date.UTC(2029, 4, 31, 12), dueAt: Date.UTC(2029, 6, 30, 12) });
    expect(d!.actions.map((a) => a.label)).toEqual(['Apply For OPT', 'Apply For OPT, Premium Processing']);
    drawn(sim, Home);
    press(button('Apply For OPT'));
    const fee = sim.universe.transactions.filter((t) => t.memo === 'Form I-765, (c)(3)(B), OPT');
    expect(fee).toHaveLength(1);
    // The I-765 filed online, $470 (USCIS fee schedule), from her own accounts.
    expect(fee[0]!.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).reduce((n, p) => n + p.amount, 0)).toBe(-470_00);
    expect(d!.resolvedAt).toBe(at(2029, 6, 1, 12));
    // Ninety days for a standard filing: Thursday 30 August at noon.
    expect(optPermits(sim)).toHaveLength(1);
    expect(optPermits(sim)[0]).toMatchObject({ status: 'pending', appliedAt: at(2029, 6, 1, 12), readyAt: at(2029, 8, 30, 12) });
    const later = reload(sim);
    later.advanceTo(at(2029, 8, 1, 12));
    expect(later.player.usOutOfStatus).toBeUndefined();
    later.advanceTo(at(2029, 8, 30, 13));
    expect(optPermits(later)[0]).toMatchObject({ status: 'valid', issuedAt: at(2029, 8, 30, 12), expiresAt: at(2030, 8, 30, 12) });
    expect(titled(later, 'OPT Approved').map((n) => n.body)).toEqual(['You may work in the United States from August 30, 2029 to August 30, 2030. Each day of professional work you’re booked for counts as a day worked, and OPT ends once you’ve had more than 90 days without work in total.']);
  });

  it('p-journey-history: PLAYER JOURNEY: the played graduate’s School Journey says every part she was on stage in once, The Seagull’s Nina among them, as her credits keep them', () => {
    expect(kept.graduated, 'the slices played').toBeDefined();
    const sim = opened(kept.graduated!);
    const credits = sim.player.school!.credits!;
    // An understudy goes on the résumé only if they went on: The Seagull's Nina, once.
    expect(credits.find((c) => c.production === SEAGULL_2027.name)).toMatchObject({ role: 'Nina', kind: 'understudy', year: 2027, wentOn: 1 });
    const said = `On stage: ${credits.map((c) => `${c.role} in ${c.production}, ${c.year}`).join('; ')}.`;
    expect(journey(sim)).toContain(said);
    for (const c of credits) expect(journey(sim).split(`${c.role} in ${c.production}`).length - 1, c.role).toBe(1);
  });

  it('p-journey-history: PLAYER JOURNEY: the played graduate’s School Journey says “Graduated”, once, as Home’s School line has since 2026-10-13', () => {
    expect(kept.graduated, 'the slices played').toBeDefined();
    const sim = opened(kept.graduated!);
    expect(journey(sim)).toMatch(/^School Journey Graduated How This Works On stage: /);
  });

  it('p-journey-history: PLAYER JOURNEY: on 15 April 2027, The Seagull closed on 27 March and her night as Nina on the record, School Journey says she was on stage in it, as it says of a School run closed', () => {
    expect(kept.april2027, 'the slices played').toBeDefined();
    const sim = opened(kept.april2027!);
    const rep = sim.player.school!.rep as NonNullable<typeof sim.player.school>['rep'] & { closed?: number };
    // Sent on once, and the run over: the Rep's last performance was 27 March (content/school.ts).
    expect([rep!.production, rep!.role, rep!.kind, rep!.performed]).toEqual(['The Seagull', 'Nina', 'understudy', 1]);
    expect(SEAGULL_2027.run.to).toBe('2027-03-27');
    expect(sim.player.school!.credits ?? []).toEqual([]);
    expect(journey(sim)).toContain('On stage: Nina in The Seagull, 2027.');
  });
});
