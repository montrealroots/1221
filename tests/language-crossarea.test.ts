/**
 * Brief 14's cross-area pass (2026-10-17, the owner's "Complete Player-Facing Language And Tutorial Overhaul"): the
 * functional defects the writing areas found and couldn't settle alone, each fixed here and held
 * (`docs/verification/language-2026-10-17/crossarea/defects.md`).
 *
 * - The live clock, when a tick of it throws, pauses the save, says so, and offers Play; until then it stopped without a
 *   word and the top bar kept offering Pause (frame `defects.md` 1).
 * - The IRS's decision on a payment plan reads the plan's state, never its refusal's words; until then it skipped a
 *   refusal whose words matched /payment plan|application/ (papers `defects.md` 4). Every case of the decision is pinned
 *   here, and held the same on the code before the fix and after it.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actress at Yale in New Haven from Monday
 * 24 August 2026 at 7:30 AM. The page's live clock is the real `GameProvider` in a real React root (react-dom/client),
 * its commits run by React's own `act`, as `tests/evidence2-b01.test.ts` holds it; the top bar is drawn under the real
 * provider (react-dom/server). FIXTURE: the page's window, its document and the element React mounts into, which a node
 * test has none of (`environment: 'node'`), and the page's timers, faked; a fault in a move of the clock, a reactor of
 * time's passing registered to throw (`onPassage`), since no reactor the game has throws on a played life.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { recordWages } from '@/engine/systems/earnings';
import { PLAN, owedAll, planRefusal, returnsOf } from '@/engine/systems/taxreturn';
import { GameProvider, useGame, useWorld, type GameContextValue } from '@/app/game-context';
import { TimeControls } from '@/ui/shell/TimeControls';

const student = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------
// The live clock that throws
// ---------------------------------------------------------------------------

describe('the live clock when a tick throws', () => {
  const page = globalThis as Record<string, unknown>;
  const kept = { window: page.window, document: page.document, act: page.IS_REACT_ACT_ENVIRONMENT };
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
    const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
    // FIXTURE: the page's window and document. React's commit asks the window for the frame element it checks the focus
    // against, and the provider asks it for its timers, its address and its history.
    Object.assign(globalThis, {
      IS_REACT_ACT_ENVIRONMENT: true,
      window: {
        ...listens,
        setInterval: (f: () => void, ms: number) => setInterval(f, ms),
        clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
        setTimeout: (f: () => void, ms: number) => setTimeout(f, ms),
        location: { hash: '' },
        history: { replaceState: () => undefined, pushState: () => undefined, back: () => undefined },
        HTMLIFrameElement: class {},
      },
      document: { ...listens, visibilityState: 'visible', activeElement: null },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    for (const key of ['window', 'document'] as const) {
      if (kept[key] === undefined) delete page[key]; else page[key] = kept[key];
    }
    if (kept.act === undefined) delete page.IS_REACT_ACT_ENVIRONMENT; else page.IS_REACT_ACT_ENVIRONMENT = kept.act;
  });

  /**
   * The real provider over a save in a real React root, as the page holds it; `live` is its value as its children have
   * it, `shown` every toast it has put up, by its id, as a toast is taken down again seven seconds on, and `read` the
   * clock as a screen reads the world (`useWorld`).
   */
  function onPage(sim: Simulation): { live: () => GameContextValue; shown: () => { message: string; tone: string }[]; read: () => number; wait: (ms: number) => void; unmount: () => void } {
    let live: GameContextValue | undefined;
    let read = Number.NaN;
    const shown = new Map<number, { message: string; tone: string }>();
    const Child = () => {
      live = useGame();
      read = useWorld((s) => s.now);
      for (const t of live.toasts) shown.set(t.id, { message: t.message, tone: t.tone });
      return null;
    };
    const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
    const element = { nodeType: 1, tagName: 'DIV', namespaceURI: 'http://www.w3.org/1999/xhtml', textContent: '', ...listens, ownerDocument: { ...listens } };
    const root = createRoot(element as never);
    act(() => root.render(createElement(GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: createElement(Child) })));
    return {
      live: () => live!,
      shown: () => [...shown.values()],
      read: () => read,
      // A second at a time, each tick's render committed before the next, as a browser runs React's work between them.
      wait: (ms: number) => { for (let s = 0; s < ms; s += 1_000) act(() => { vi.advanceTimersByTime(1_000); }); },
      unmount: () => act(() => root.unmount()),
    };
  }
  /** The top bar's words, drawn under the real provider over the save as it stands. */
  const bar = (sim: Simulation) => onScreen(renderToStaticMarkup(createElement(GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: createElement(TimeControls) })));
  const SAID = 'An error in the game stopped the clock, so it’s paused. Anything that happened before it stopped still stands. You can press Play to try again.';

  it('PLAYER JOURNEY: a tick that throws pauses the save, says so once, and the top bar offers Play; Play pressed is one more try, a second failure pauses it again with one more toast and no loop, and a third press runs the clock', () => {
    const sim = student('xarea-clock');
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    // FIXTURE: a reactor of time's passing that throws on the next move of the clock while `faults` is above nothing.
    let faults = 0;
    sim.onPassage('test.fault', () => { if (faults > 0) { faults -= 1; throw new Error('boom'); } });
    const start = sim.now;
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    const held = onPage(sim);
    held.wait(3_000);
    expect(sim.now).toBe(start + 3_000);
    expect(bar(sim)).toMatch(/^Pause Sleep /);

    // The fourth second's move throws, and the fifth second's tick comes before React has drawn the pause: the clock is
    // where the fourth's move left it, the screens read it there, and a minute on it hasn't moved.
    faults = 1;
    act(() => { vi.advanceTimersByTime(2_000); });
    const stoppedAt = sim.now;
    expect(stoppedAt).toBe(start + 4_000);
    expect(held.read()).toBe(stoppedAt);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(held.shown()).toEqual([{ message: SAID, tone: 'negative' }]);
    expect(logged.mock.calls.map((c) => String(c[0]))).toEqual(['Error: boom']);
    held.wait(60_000);
    expect(sim.now).toBe(stoppedAt);
    // The bar says Play, the way to try again, and Pause is gone from it.
    expect(bar(sim)).toMatch(/^Play Sleep /);
    expect(bar(sim)).not.toMatch(/\bPause\b/);

    // Play pressed, and the move throws again: paused again, one toast more, and a minute on, nothing more.
    faults = 1;
    act(() => { held.live().run('world.set_preferences', { timeSpeed: 'live' }, { silent: true }); });
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    held.wait(1_000);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    held.wait(60_000);
    expect(held.shown().map((t) => t.message)).toEqual([SAID, SAID]);
    expect(logged.mock.calls).toHaveLength(2);
    expect(sim.now).toBe(stoppedAt + 1_000);

    // Play pressed with nothing wrong: the clock runs, a second a second, and nothing more is said.
    act(() => { held.live().run('world.set_preferences', { timeSpeed: 'live' }, { silent: true }); });
    held.wait(5_000);
    expect(sim.now).toBe(stoppedAt + 6_000);
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    expect(held.shown().map((t) => t.message)).toEqual([SAID, SAID]);
    held.unmount();
  });
});

// ---------------------------------------------------------------------------
// The IRS's decision on a payment plan
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
/** TEST SETUP: money into the primary account, by a posting, so the ledger still balances. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: primary(sim).id, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
/** FIXTURE: every account of the player's with money in it emptied, by a posting, so the ledger still balances. */
const empty = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };

/**
 * LIFE FIXTURE (`quickSave`): a New Yorker of wealthy means with $60,000 of 2026 wages, played to 1 February 2027 and her
 * accounts emptied, files her 2026 return, so its balance is owed: past the low-income fee, with a Social Security
 * number, so a plan is decided online a minute after it's asked. Played once and copied for each case.
 */
let owing: string | undefined;
const owingSave = (): Simulation => {
  if (!owing) {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'xarea-plan');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 60_000_00 });
    while (sim.now < at(2027, 2, 1, 12)) sim.advanceTo(Math.min(at(2027, 2, 1, 12), sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true });
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    owing = JSON.stringify(sim.universe);
  }
  return loadSave(JSON.parse(owing) as never);
};

const PLAN_TITLES = new Set(['Your IRS Payment Plan Is Approved', 'The IRS Declined Your Payment Plan']);
/**
 * A plan asked for with $100 in the bank for its fee, what `between` does before the IRS answers, and the answer: the
 * plan's status and why, what the plan's refusal said just before the answer, the notices about it, and the setup fees
 * charged.
 */
function decided(kind: 'short' | 'long', between: (sim: Simulation) => void = () => undefined) {
  const sim = owingSave();
  fund(sim, 100_00);
  const asked = sim.must<{ decideAt: number }>({ kind: 'tax.apply_plan', payload: { kind } });
  const since = sim.universe.notifications.length;
  between(sim);
  const before = planRefusal(sim, sim.player, kind);
  sim.advanceTo(asked.decideAt + MS_HOUR);
  const p = sim.player.taxPlan!;
  return {
    status: p.status,
    why: p.why,
    before,
    notices: sim.universe.notifications.slice(since).filter((n) => PLAN_TITLES.has(n.title)).map((n) => `${n.title}: ${n.body}`),
    fees: sim.universe.transactions.filter((t) => t.memo === 'IRS payment plan setup fee').length,
  };
}
/** FIXTURE: tax added to the 2026 return by hand, as an amendment processed before the IRS answers would add it. */
const moreTax = (sim: Simulation, amount: number) => {
  const r = returnsOf(sim.player)['2026']!;
  r.parts = { ...r.parts!, tax: r.parts!.tax + amount };
  r.owed = r.owed! + amount;
  r.base = (r.base ?? 0) + amount;
};
const DECLINED = 'The IRS Declined Your Payment Plan: ';
const LETTERS = ' Its letters about what you owe will start again.';

describe('the IRS’s decision on a payment plan', () => {
  it('approves a plan nothing bars, though the plan’s own application is what the refusal names until the answer: a monthly plan, its fee charged once, and a short-term one with none', () => {
    const monthly = decided('long');
    expect(monthly.before).toMatch(/^Your application is already with the IRS\. It answers by /);
    expect(monthly).toMatchObject({ status: 'active', why: undefined, fees: 1 });
    expect(monthly.notices).toHaveLength(1);
    expect(monthly.notices[0]).toMatch(/^Your IRS Payment Plan Is Approved: /);
    const short = decided('short');
    expect(short.before).toMatch(/^Your application is already with the IRS\. It answers by /);
    expect(short).toMatchObject({ status: 'active', why: undefined, fees: 0 });
    expect(short.notices).toEqual([expect.stringMatching(/^Your IRS Payment Plan Is Approved: Pay what you owe by /)]);
  }, 120_000);

  it('refuses one for nothing owed by the answer, a return left unfiled past its due date, a balance past the plan’s limit, and a fee the bank can’t cover, each in its refusal’s words', () => {
    const paid = decided('long', (sim) => { fund(sim, owedAll(sim.player, sim.now)); sim.must({ kind: 'tax.pay', payload: { year: 2026 } }); });
    expect(paid).toEqual({ status: 'refused', why: 'You owe the IRS nothing.', before: paid.before, notices: [`${DECLINED}You owe the IRS nothing.`], fees: 0 });
    // FIXTURE: a 2025 return past its due date and not filed, as defects-g8-7 holds it.
    const unfiled = decided('long', (sim) => { returnsOf(sim.player)['2025'] = { year: 2025, due: sim.now - MS_DAY, figures: { ...returnsOf(sim.player)['2026']!.figures, balance: 0, owedTo: { irs: 0, states: {} } } } as never; });
    const file = 'The IRS needs every return filed first, and your 2025 return isn’t. File it first.';
    expect(unfiled).toEqual({ status: 'refused', why: file, before: unfiled.before, notices: [`${DECLINED}${file}${LETTERS}`], fees: 0 });
    const long = decided('long', (sim) => moreTax(sim, PLAN.longMax));
    const longMax = 'A Simple Payment Plan is for $50,000 or less. A larger balance needs a financial statement, which the game doesn’t offer.';
    expect(long).toEqual({ status: 'refused', why: longMax, before: long.before, notices: [`${DECLINED}${longMax}${LETTERS}`], fees: 0 });
    const short = decided('short', (sim) => moreTax(sim, PLAN.shortMax));
    const shortMax = 'A short-term plan is for less than $100,000.';
    expect(short).toEqual({ status: 'refused', why: shortMax, before: short.before, notices: [`${DECLINED}${shortMax}${LETTERS}`], fees: 0 });
    const broke = decided('long', empty);
    const fee = 'Your bank couldn’t cover the $29.00 setup fee, so the plan wasn’t set up.';
    expect(broke).toEqual({ status: 'refused', why: fee, before: broke.before, notices: [`${DECLINED}${fee}${LETTERS}`], fees: 0 });
    // Each was its own application until the answer.
    for (const one of [paid, unfiled, long, short, broke]) expect(one.before).toMatch(/^Your application is already with the IRS\. /);
  }, 120_000);

  it('answers nothing for a plan that isn’t waiting on it (FIXTURE: its status set by hand)', () => {
    for (const status of ['refused', 'active'] as const) {
      const left = decided('long', (sim) => { sim.player.taxPlan!.status = status; });
      expect(left).toMatchObject({ status, why: undefined, notices: [], fees: 0 });
    }
  }, 120_000);
});
