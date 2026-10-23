/**
 * The second round of 2026-10-13 for five rows the first round (tests/evidence-g33-ui.test.ts) left partial: Home's
 * three lines of Your Affairs (at the heads of Money, the School and Papers from 2026-10-23, brief 23, and what needs
 * putting right under What Needs You on Home), the person look, and a foreign graduate's status decision. What the review of that day,
 * the first round's own open gaps and the skeptic who checked it left open is closed here through what the player does:
 * the screen drawn as they have it and its buttons pressed, the command a button sends, or the clock; each consequence
 * read where the row says it's read, against figures worked out here from the rule's own numbers.
 *
 * - `h-money`: an overdraft reached by play, where the first round brought one about by hand: debit card coverage opted
 *   into at Chase, the checking's $92,391.00 moved to savings, and the first midnight's $10.00 of groceries reads
 *   "−$10.00" (a hyphen until 2026-10-17) and "Your account is overdrawn." (Chase charges nothing overdrawn by $50 or less), where a twin that
 *   never opted in owes the $10.00 instead and shows no alert. "No account" stays a fixture's: with the savings closed
 *   into the checking and the card closed, the bank refuses the checking, and Money lists it alone; only every account
 *   closed by hand drew Home's "No account: $0.00. Worth $0." and its "Your Bank" button, which went with Your Affairs
 *   on 2026-10-23, and Money says "Worth $0." of it.
 * - `h-school`: Next from nextClasses, which the first round's booked "Classes" couldn't tell apart: at noon on Thursday
 *   26 November, the fall recess, nothing the School books wants her, and Next is Monday 30 November at nine; and after
 *   a fall kept up hour by hour, at noon on 12 December, the spring's first class day, 11 January. A leave pinned to
 *   its standing ("On leave until …", and the concern put right from Home); a first year left to the clock is "Year 2
 *   of 3, academic warning" in its second fall and "Left the School." after it, each put right from Home; and
 *   the place in the class as a literal, sixth of sixteen, from craft records whose means are set so the rule's own
 *   words give it.
 * - `h-papers`: the Unemployment clause played: a fall kept up, a part in the Summer Cabaret's company paid $375 a
 *   week for thirteen Fridays, a withdrawal on 1 September 2027 and a claim on 1 October, "Unemployment, $93 a week.",
 *   Connecticut's 1/26 of the two best quarters' average ($1,500 and $3,375). The tax owed told from the stored balance
 *   by two dollars, $174 against $172, 139 days past due (until 2026-10-16 by four, $176 against $172, 180 days past
 *   due, before the IRS's letters waited for the due date); and Connecticut's half of what's owed, $3.72, all of the $4
 *   Home says since 2026's table came in on 2026-10-14 (until then $3.72 of $111, the IRS owed $107.56). And a
 *   defect, below: filed early and unpaid, the alert said interest and a penalty were "growing each month" before the
 *   due date, when nothing grows; from later on 2026-10-13 it says so only past the due date.
 * - `l-person`: the creation side of the unit split, played through Who Are You Going To Be?: born in London, the
 *   Starting Point asks centimeters and kilograms, and 170 and 65 read back in New Haven as 5 ft 7 in and 143 lb; born
 *   in New York it asks feet, inches and pounds. The injury's "till October 6" held to the clock that mends it,
 *   between 8 and 9 AM that day, inside a broken bone's 42 to 84 days. And why no third person is reached: a played
 *   world holds one Person; only a second put there by hand is spoken of in the third person ("they" until 2026-10-15,
 *   their own pronouns since), with no Your Own Plans.
 * - `n-decision-us-status`: the OPT-offering decision at the F-1's own program end, nothing moved by hand but the
 *   degree: issued for the class of 2029 to 30 July 2029 (31 May and sixty days), the clock raises it on 31 May, due
 *   30 July; pressed on Home on 1 June it pays $470 and leaves a permit pending ninety days, which holds her status
 *   past 30 July and is approved for twelve months. And the refusal form, played: a withdrawal on 1 September 2026
 *   raises it a minute on with nothing to apply for, due the sixteenth, shown on Home without a button, and it lapses
 *   with her status. And a defect, below: premium processing's thirty business days counted through Juneteenth and
 *   Independence Day, so a filing on 1 June 2029 was decided on 13 July, not 17 July, until `businessDaysOn` passed
 *   over federal holidays for it on 2026-10-13.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven from Monday
 * 24 August 2026 at 7:30 AM, born in New York, or in London for the F-1 rows; played by the clock and the commands. A
 * fall "kept up" is played hour by hour by the attentive policy (`tools/policy.ts attentiveHour`), the project's own
 * student, through public commands. Home and Who Are You Going To Be? are the game's own screens rendered with
 * react-dom/server, their buttons, fields and pickers worked through their own handlers; `useGame` stands in for the
 * provider, its `run` the save's own `execute`. Creation's state is kept between renders as React keeps it, in the
 * order its hooks are called, the step's children made afresh when the step moves; a look opens the way React would
 * on the next render, its subject given back as its LookRegion's state.
 *
 * TEST SETUP, said again where it's done: a life's only current account closed by hand; a bank emptied before a return
 * is filed, by a posting against a test equity line; a family with need, which creation didn't offer until 2026-10-14; the class's
 * craft records set so their means are known; a second Person put in the world by hand; and a graduate's degree
 * conferred on the first day by the School's own `setStanding`, which no played life reaches inside a test's minute.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { openDecisions } from '@/engine/world/world';
import { CLASSES_2026_27, SKILLS, SUMMER_CABARET } from '@/engine/content/school';
import { INJURY_KIND } from '@/engine/content/injury';
import { CITIES } from '@/engine/content/geography';
import { troubles } from '@/engine/systems/spending';
import { documentsOf } from '@/engine/systems/documents';
import { f1Of } from '@/engine/systems/permission';
import { setStanding } from '@/engine/systems/school';
import { at as subject } from '@/ui/looks/subject';
import { attentiveHour } from '../tools/policy';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** Where a press navigated, with the title it gave. */
  went: [] as unknown[][],
  /** What each LookRegion holds open, in render order: a press's subject given back as React would on the next render. */
  open: [] as unknown[],
  /** What a press asked a LookRegion to open. */
  opened: [] as unknown[],
  /** The buttons the screen drew, with their own props. */
  buttons: [] as { text: string; props: Record<string, unknown> }[],
  /** The fields, the selects and the components drawn, with their own props. */
  elements: [] as { type: unknown; props: Record<string, unknown> }[],
  /** A screen played over several renders: every `useState` in the order it's called, kept as React keeps it. */
  kept: undefined as unknown[] | undefined,
  cursor: 0,
}));

// A LookRegion keeps what it has open in a `useState(null)`: given what a press asked for, and its setter recorded.
// Creation keeps its state between renders: each hook's slot by the order it's called, its own four first (the step,
// the form, whether a draft was restored, a tick) and the step's children after, made afresh when the step moves, as
// React mounts a different step's components afresh.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((init: unknown) => {
    const [value, set] = real.useState(init);
    if (h.kept) {
      const i = h.cursor++;
      if (!(i in h.kept)) h.kept[i] = value;
      return [h.kept[i], (next: unknown) => {
        const was = h.kept![i];
        h.kept![i] = typeof next === 'function' ? (next as (x: unknown) => unknown)(was) : next;
        if (i === 0 && h.kept![0] !== was) h.kept!.length = 4;
      }];
    }
    if (init !== null) return [value, set];
    return [h.open.length > 0 ? h.open.shift() : value, (next: unknown) => { h.opened.push(next); }];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

// The buttons, fields and components the screen draws, kept with their props as they're made.
const keep = vi.hoisted(() => {
  const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
  return (real: Record<string, unknown>, buttons: () => { text: string; props: Record<string, unknown> }[], elements: () => { type: unknown; props: Record<string, unknown> }[]) => {
    const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
      if (type === 'button' && props) buttons().push({ text: textOf(props.children), props });
      if (props && (type === 'input' || type === 'select' || typeof type === 'function')) elements().push({ type, props });
      return make(type, props, ...rest);
    };
    return { ...real, ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}), ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}) };
  };
});
vi.mock('react/jsx-runtime', async (orig) => keep(await orig<Record<string, unknown>>(), () => h.buttons, () => h.elements));
vi.mock('react/jsx-dev-runtime', async (orig) => keep(await orig<Record<string, unknown>>(), () => h.buttons, () => h.elements));

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: (...to: unknown[]) => { h.went.push(to); },
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

const { Home } = await import('@/ui/screens/Home');
const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
const { resolveLook } = await import('@/ui/looks/registry');

// ---------------------------------------------------------------------------
// Lives, the screens, and figures
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** Ada Cole at Yale, born in New York. */
const life = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** The same, born in London: a British citizen on an F-1. */
const londoner = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation => life(seed, { homeRegionId: 'uk-eng-london', ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const opened = (text: string): Simulation => loadSave(deserialise(text) as never);
const words = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** Home, or another screen, as the player has it: its markup and its words. */
function drawn(sim: Simulation, open: unknown[] = [], screen: () => unknown = Home): { html: string; text: string } {
  h.sim = sim; h.went = []; h.open = [...open]; h.opened = []; h.buttons = []; h.elements = []; h.kept = undefined;
  const html = renderToStaticMarkup(createElement(screen as never)).replace(/<!-- -->/g, '');
  return { html, text: words(html) };
}
/**
 * Money's, the School's or Papers' head, from its name to its tabs, where it says where it stands: Home's Your Affairs
 * said it in a line each until 2026-10-23 (brief 23), when the lines went to the heads of their own screens.
 */
function head(sim: Simulation, screen: () => unknown): string {
  const { html } = drawn(sim, [], screen);
  return words(html.slice(0, html.lastIndexOf('<', html.indexOf('tabs-wrap')))).replace(/ ([.,])/g, '$1').trim();
}
const money = (sim: Simulation) => head(sim, BankWorkspace);
const schoolHead = (sim: Simulation) => head(sim, SchoolWorkspace);
const papers = (sim: Simulation) => head(sim, PapersWorkspace);
/** The one button drawn with these words. */
function button(text: string): { text: string; props: Record<string, unknown> } {
  const found = h.buttons.filter((b) => b.text === text);
  expect(found.map((b) => b.text), `one “${text}” button`).toEqual([text]);
  return found[0]!;
}
const press = (text: string) => (button(text).props.onClick as () => void)();

const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const own = (sim: Simulation, kind: Account['kind']): Account => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === kind && !a.closedAt)!;
/** TEST SETUP: an account brought to a balance by a posting against a test equity line. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'opening', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test Setup').id, amount: -by }] });
}
/** Cents written to the whole dollar, as the line writes a worth and a sum owed. */
const dollars = (n: number) => `$${Math.round(n / 100).toLocaleString('en-US')}`;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const memoed = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo);
/** What a transaction took from, or put in, the player's own accounts. */
const fromPlayer = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).reduce((n, p) => n + p.amount, 0);
/** The School's items on the calendar that want her and haven't come yet: what Home's School line calls booked. */
const bookedFor = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.category === 'school' && i.requiresPlayer && i.payload.personId === sim.player.id);

/** A 2026 return's due date: 15 April 2027, to the minute before midnight in New York. */
const DUE = at(2027, 4, 15, 23, 59);

/**
 * PLAYER JOURNEY: Ada, born in New York, her first fall kept up hour by hour by the attentive policy (classes,
 * coursework, sleep and meals, through its commands) from Monday 24 August 2026 to noon on Saturday 12 December, the day
 * after the fall evaluation. Played once (about 35 seconds), kept as a save, and opened afresh by each test that needs it.
 */
let fallText: string | undefined;
function keptUpFall(): Simulation {
  if (!fallText) {
    const sim = life('b12-claim');
    while (sim.now < at(2026, 12, 12, 12)) attentiveHour(sim);
    fallText = serialise(sim.universe);
  }
  return opened(fallText);
}

/** PLAYER JOURNEY: Ada, born in London, on an F-1, played by the clock to noon on Monday 1 February 2027. */
let feb1Text: string | undefined;
function feb1(): Simulation {
  if (!feb1Text) {
    const sim = londoner('g33-probe-london');
    sim.advanceTo(at(2027, 2, 1, 12));
    feb1Text = serialise(sim.universe);
  }
  return opened(feb1Text);
}

// ---------------------------------------------------------------------------
// h-money
// ---------------------------------------------------------------------------

describe('h-money', () => {
  /** Ada with her $92,391.00 moved to savings by Move Money, debit card coverage opted into or not, played to noon. */
  const emptied = (optIn: boolean) => {
    const sim = life('b12-money-over');
    if (optIn) expect(sim.must({ kind: 'bank.debit_overdraft', payload: { on: true } })).toEqual({ on: true });
    const checking = primary(sim);
    // The wealthy profile's 85,000 € at SLATE's 0.92 € to the dollar.
    expect(checking.balance).toBe(92_391_00);
    expect(sim.must({ kind: 'bank.transfer', payload: { fromId: checking.id, toId: own(sim, 'savings').id, amount: 92_391_00 } })).toMatchObject({ moved: 92_391_00 });
    const from = sim.universe.transactions.length;
    sim.advanceTo(at(2026, 8, 25, 12));
    const onChecking = sim.universe.transactions.slice(from).filter((t) => t.postings.some((p) => p.accountId === checking.id)).map((t) => [t.memo, t.postings.find((p) => p.accountId === checking.id)!.amount]);
    return { sim, checking, onChecking };
  };

  it('PLAYER JOURNEY: debit card coverage opted into and the checking moved to savings, the first midnight’s $10.00 of groceries overdraw it: “−$10.00” and “Your account is overdrawn.” on Money, “Your account is $10 overdrawn.” on Home, across a reload', () => {
    const { sim, checking, onChecking } = emptied(true);
    // The only thing the checking paid since: the groceries, into the overdraft. Chase charges no fee overdrawn by $50
    // or less (Overdraft Assist, content/banks-lending.ts), so the balance is the groceries and nothing more.
    expect(onChecking).toEqual([['Groceries', -10_00]]);
    expect(checking.balance).toBe(-10_00);
    // $92,391 and $413,043 less the fall’s Yale Health plan, $1,882, owed at nine on the first morning for want of money
    // in checking and paid back out of savings at midnight, and the $10.00: $503,542. Until 2026-10-13 this read $505,424:
    // the plan the bank couldn’t pay was dropped (tests/evidence2-b10.test.ts, c-wealth).
    // Home's Your Affairs line until 2026-10-23 (brief 23), “Money Chase Total Checking: −$10.00. Worth $503,542. Your
    // account is overdrawn.”; Money's head, its tile and What Needs You since.
    for (const one of [sim, reload(sim)]) {
      expect(money(one)).toContain('Worth $503,542. Your account is overdrawn.');
      expect(drawn(one, [], BankWorkspace).text).toMatch(/Chase Total Checking .*?Balance −\$10\.00 /);
      expect(drawn(one).text).toContain('Your account is $10 overdrawn. Open Money');
    }
    press('Open Money');
    expect(h.went).toEqual([['/workspace/bank', 'Money']]);
  });

  it('the twin never opted in: Chase won’t pay a debit card purchase into an overdraft, so the $10.00 is owed instead, “$0.00. Worth $503,542, $10 of it owed.”, with no alert', () => {
    const { sim, checking, onChecking } = emptied(false);
    expect(onChecking).toEqual([]);
    expect(checking.balance).toBe(0);
    // The plan owed and paid back out of savings, as the opted-in twin’s was (until 2026-10-13, $505,424, the plan dropped).
    expect(money(sim)).toMatch(/Worth \$503,542, after \$10 owed\.$/);
    expect(drawn(sim, [], BankWorkspace).text).toMatch(/Chase Total Checking .*?Balance \$0 /);
    expect(drawn(sim).text).not.toContain('overdrawn');
  });

  it('“No account” is a fixture’s: the savings closed into the checking and the card closed, the bank refuses the checking, and Money lists it alone; every account closed by hand, Money says “Worth $0.”', () => {
    const sim = life('b12-money-close');
    const checking = primary(sim);
    const savings = own(sim, 'savings');
    expect(sim.must({ kind: 'bank.close_savings', payload: { accountId: savings.id } })).toEqual({ closed: savings.id });
    expect(sim.must({ kind: 'card.close', payload: { accountId: own(sim, 'credit_card').id } })).toEqual({ closing: true });
    expect(sim.execute({ kind: 'bank.close_current', payload: { accountId: checking.id } }).error)
      .toBe('It’s your only checking account, and you always need one for your wages to be paid into. Open another one first.');
    expect(sim.ledger.accountsOf(sim.player.id).map((a) => a.name)).toEqual(['Chase Total Checking']);
    // $92,391.00 and the savings' $413,043.00 (the profile's 380,000 € at 0.92, to the dollar) in one account, written to the
    // dollar from $100,000.
    expect(checking.balance).toBe(505_434_00);
    expect(money(sim)).toBe('Your Bank Chase $505,434 held here, in one account. Worth $505,434.');
    // TEST SETUP: the checking closed by hand, which no command does to a life's only current account. Home's line said
    // “No account: $0.00. Worth $0.” and its “Your Bank” opened the bank screen until 2026-10-23 (brief 23).
    checking.closedAt = sim.now;
    expect(money(sim)).toMatch(/Worth \$0\.$/);
  });
});

// ---------------------------------------------------------------------------
// h-school
// ---------------------------------------------------------------------------

describe('h-school', () => {
  it('PLAYER JOURNEY: at noon on Thursday 26 November, the fall recess, nothing the School books wants her, so Next is the next class day at nine, “Next: Classes, November 30, 2026 at 9:00 AM.”, across a reload', () => {
    const sim = life('b12-school-recess');
    sim.advanceTo(at(2026, 11, 26, 12));
    // The Bulletin's fall recess, 26 to 29 November, and classes again the day after (content/school.ts).
    expect(CLASSES_2026_27.off).toContainEqual(['2026-11-26', '2026-11-29']);
    // Monday to Wednesday's classes have come; Sunday evening books the next week. Nothing booked wants her.
    expect(bookedFor(sim)).toEqual([]);
    for (const one of [sim, reload(sim)]) {
      expect(schoolHead(one)).toMatch(/Year 1 of 3, good standing\. You’re \d+(?:st|nd|rd|th) of 16 in the class\. Next: Classes, November 30, 2026 at 9:00 AM\.$/);
    }
  });

  it('PLAYER JOURNEY: a fall kept up ends in good standing, “In Good Standing” at the evaluation, and the day after, with nothing booked over the winter, Next is the spring’s first class day: “Next: Classes, January 11, 2027 at 9:00 AM.”', () => {
    const sim = keptUpFall();
    // From 2026-10-16 the fall played this way ends with a classmate's lines run booked for that evening, the twelfth (the
    // growth that reads discipline changed which moments came, `grown`); played on by the same policy to the next noon,
    // past it, nothing is booked over the winter.
    while (sim.now < at(2026, 12, 13, 12)) attentiveHour(sim);
    expect(sim.player.school!.standing).toBe('good');
    expect(titled(sim, 'In Good Standing')).toHaveLength(1);
    expect(bookedFor(sim)).toEqual([]);
    // The spring's classes from 11 January, the Bulletin's.
    expect(CLASSES_2026_27.spring.from).toBe('2027-01-11');
    expect(schoolHead(sim)).toMatch(/Year 1 of 3, good standing\. You’re \d+(?:st|nd|rd|th) of 16 in the class\. Next: Classes, January 11, 2027 at 9:00 AM\.$/);
    expect(drawn(sim).text).not.toContain('Your standing is');
  }, 60_000);

  it('PLAYER JOURNEY: a personal leave begun on its decision after a fall left to the clock is “On leave”, with the concern put right from Home and no Next', () => {
    const sim = life('g33-school-leave');
    sim.advanceTo(at(2027, 1, 13, 12));
    expect(titled(sim, 'A Notice Of Academic Concern')).toHaveLength(1);
    const asked = sim.must<{ decideAt: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    sim.advanceTo(asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave!.status).toBe('on');
    expect(schoolHead(sim)).toMatch(/On leave until [A-Za-z0-9 ]+\. You’re \d+(?:st|nd|rd|th) of 16 in the class\.$/);
    expect(drawn(sim).text).toContain('Your standing is academic concern. The School screen says why. Open School');
  });

  it('PLAYER JOURNEY: a first year left to the clock, its concern unremedied in the spring, is “Year 2 of 3, academic warning” in its second fall, Next the class day after, and the warning put right from Home', () => {
    const sim = life('b12-school-year2');
    sim.advanceTo(at(2027, 9, 1, 12));
    expect(titled(sim, 'A Notice Of Academic Concern')).toHaveLength(1);
    expect(titled(sim, 'Academic Warning')).toHaveLength(1);
    // The second fall's classes from the Monday a week after the fourth Monday of August, 30 August 2027; Wednesday
    // 1 September at noon, the next is Thursday's.
    expect(schoolHead(sim)).toMatch(/Year 2 of 3, academic warning\. You’re \d+(?:st|nd|rd|th) of 16 in the class\. Next: Classes, September 2, 2027 at 9:00 AM\.$/);
    expect(drawn(sim).text).toContain('Your standing is academic warning. The School screen says why. Open School');
  });

  it('PLAYER JOURNEY: left to the clock, the warning unmet, the second fall’s evaluation dismisses her: “Left the School”, the dismissal on Home and no Next, across a reload', () => {
    const sim = life('b12-school-year2');
    sim.advanceTo(at(2027, 12, 20, 12));
    expect(titled(sim, 'Dismissed From The School')).toHaveLength(1);
    expect(bookedFor(sim)).toEqual([]);
    for (const one of [sim, reload(sim)]) {
      expect(schoolHead(one)).toMatch(/Left the School\. You’re \d+(?:st|nd|rd|th) of 16 in the class\.$/);
      expect(drawn(one).text).toContain('Your standing is dismissed. The School screen says why. Open School');
    }
  });

  it('the place in the class is one more than the classmates whose mean over the 21 skills is above hers: four at 60, one at 50 with one skill at 71, one tied at 50 and nine at 40 put her sixth; the tie raised a point in one skill puts her seventh', () => {
    const sim = life('b12-school-rank');
    const school = sim.player.school!;
    expect(school.classmates).toHaveLength(15);
    expect(SKILLS).toHaveLength(21);
    const even = (craft: object, level: number) => { for (const s of SKILLS) (craft as Record<string, number>)[s.id] = level; };
    // TEST SETUP: the craft records set in place, so their means are known.
    even(sim.player.craft!, 50);
    school.classmates.forEach((m, i) => even(m.craft, i < 4 ? 60 : i === 4 || i === 5 ? 50 : 40));
    // One skill 21 points up moves a mean over 21 skills by one: 51, above her 50. The tie, at 50, isn't above her.
    (school.classmates[4]!.craft as unknown as Record<string, number>)[SKILLS[0]!.id] = 71;
    expect(schoolHead(sim)).toContain('Arriving for the fall term. You’re 6th of 16 in the class. Next: Registration And Your Account, August 24, 2026 at 10:00 AM.');
    (school.classmates[5]!.craft as unknown as Record<string, number>)[SKILLS[20]!.id] = 51;
    expect(schoolHead(sim)).toContain('Arriving for the fall term. You’re 7th of 16 in the class.');
  });
});

// ---------------------------------------------------------------------------
// h-papers
// ---------------------------------------------------------------------------

describe('h-papers', () => {
  it('PLAYER JOURNEY: withdrawn at noon on Wednesday 7 July 2027, mid-summer, the Summer Cabaret pays its week on Friday the 9th for the days worked, 115 of its 168 hours, $256.70 of the $375, and no Friday after', () => {
    const sim = keptUpFall();
    sim.advanceTo(at(2027, 1, 5, 12));
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    sim.advanceTo(at(2027, 7, 7, 12));
    const before = memoed(sim, 'Yale Summer Cabaret stipend, the week').length;
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    sim.advanceTo(at(2027, 8, 31, 12));
    const after = memoed(sim, 'Yale Summer Cabaret stipend, the week').slice(before);
    // The week’s seven days end at 5 PM on the Friday; from Friday 2 July at 5 PM to Wednesday at noon is 115 hours of
    // 168: 375 × 115 / 168 = 256.696…, $256.70. Until the loose ends of 2026-10-13 the week was called off with the
    // rest, and nothing came, though the notice said work done is still paid.
    expect(after.map((t) => [t.at, t.postings.find((p) => p.amount < 0 && sim.universe.accounts[p.accountId]?.kind === 'income')!.amount])).toEqual([[at(2027, 7, 9, 17), -256_70]]);
  }, 300_000);

  it('PLAYER JOURNEY: a fall kept up, the Summer Cabaret joined in January and paid $375 for thirteen Fridays, withdrawn on 1 September 2027 and claiming on 1 October: “Unemployment, $93 a week.”, across a reload', () => {
    const sim = keptUpFall();
    sim.advanceTo(at(2027, 1, 5, 12));
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    sim.advanceTo(at(2027, 9, 1, 12));
    // The stipend each Friday from the first rehearsal week to the week after the closing: four in June, nine in July
    // and August, each $375 gross (content/school.ts).
    expect(SUMMER_CABARET.stipendWeekly).toBe(375_00);
    const stipends = memoed(sim, 'Yale Summer Cabaret stipend, the week');
    const day = (t: number) => new Date(t).toLocaleDateString('en-US', { timeZone: NY, month: 'long', day: 'numeric' });
    expect(stipends.map((t) => day(t.at))).toEqual(['June 4', 'June 11', 'June 18', 'June 25', 'July 2', 'July 9', 'July 16', 'July 23', 'July 30', 'August 6', 'August 13', 'August 20', 'August 27']);
    for (const t of stipends) expect(t.postings.find((p) => p.amount < 0)!.amount).toBe(-375_00);
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    // A day on, the base period is the first four of the last five quarters completed, the second of 2026 to the first
    // of 2027: nothing in it.
    sim.advanceTo(at(2027, 9, 2, 12));
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).error).toBe('Connecticut asks for base-period wages of 40 times the weekly benefit: $1,800.00 for $45.00. Your base period’s quarters paid $0.00, $0.00, $0.00, $0.00.');
    // In October the first four of the last five hold June's $1,500 alone, short of 40 times the $45 floor; the last
    // four completed, the alternate base period, hold the summer: $1,500 in the second quarter, $3,375 in the third.
    // 1/26 of the two best quarters' average, to the dollar below (CGS 31-231a): $93.75, $93; 40 times it, $3,720,
    // under the $4,875 earned (31-230); for 26 weeks.
    sim.advanceTo(at(2027, 10, 1, 12));
    const weekly = Math.floor((3_375_00 + 1_500_00) / 2 / 26 / 100) * 100;
    expect(weekly).toBe(93_00);
    expect(sim.must({ kind: 'benefits.claim', payload: {} })).toEqual({ weekly, maxTotal: 26 * weekly });
    expect(sim.player.unemployment!.claim!.basePeriod).toEqual(['2026-4', '2027-1', '2027-2', '2027-3']);
    // Home's Papers line until 2026-10-23 (brief 23); Papers' head since.
    for (const one of [sim, reload(sim)]) expect(papers(one)).toMatch(/Cover: none\. Unemployment, \$93 a week\. You have no health cover\.$/);
  }, 60_000);

  it('filed on 1 February with nothing in the bank, 139 days past its day Home says $174 owed, 0.5% for five months begun and 7% a year compounded daily on $165.60, where the balance as last stored reads $172', () => {
    const sim = feb1();
    // TEST SETUP: the bank emptied, so filing can't pay.
    for (const a of [primary(sim), own(sim, 'savings')]) setBalance(sim, a, 0);
    expect(sim.must<{ paid: boolean; irs: number }>({ kind: 'tax.file', payload: { year: 2026 } })).toMatchObject({ paid: false, irs: 165_60 });
    // The day before the LT11, which brings the balance up to date. Until 2026-10-16 this was 180 days past the due date,
    // Home $176 and the stored $172 brought up in July: the IRS's letters ran from the filing then. From that day they
    // run from the due date (`nextNotice`), the levy brings it up on the 170th day, and the 180th's stored balance was
    // $176 too, so the day was moved to one where the two still differ, as the check of 2026-10-13 asked.
    sim.advanceTo(DUE + 139 * MS_DAY);
    // 16 April to 1 September: five months begun at 0.5% (IRC 6651(a)(2)), $4.14; 139 days at 7% a year compounded daily
    // (IRC 6621, 6622), $4.47: $174.21.
    const live = 165_60 * (1 + 5 * 0.005) + 165_60 * ((1 + 0.07 / 365) ** 139 - 1);
    expect(dollars(live)).toBe('$174');
    expect(papers(sim)).toMatch(/Cover: Yale Health\. \$174 of tax owed, with its interest and a late penalty growing each month\.$/);
    expect(drawn(sim).text).toContain('$174 of tax owed, with its interest and a late penalty growing each month. Open Papers');
    // The balance as stored, last brought up to date by CP504 on the 105th day: four months begun, $3.31, and the interest
    // brought up at each letter, $3.39: $172.31, two dollars short of what's owed today.
    expect(dollars(sim.player.returns!['2026']!.owed!)).toBe('$172');
  });

  it('Connecticut’s half: a student with need owes nothing to the IRS on 2026’s table and $3.35 to Connecticut; filed unpaid, the day past its due date Home says $4, Connecticut’s $3.72 with its 10% and a month’s 1%, where the balance stored would say $3', () => {
    // TEST SETUP: a family with need, which creation didn't offer until 2026-10-14 (`newLifeFrom` made every new life the
    // wealthy family's; since then it's creation's Scraping family): its living scholarship is income no one withholds on.
    const sim = life('b12-needy', { family: undefined, wealth: 'scraping' });
    sim.advanceTo(at(2027, 2, 1, 12));
    // Her 2026 income, $14,014.00 of taxable scholarship, $1,656.00 of work-study and cents of interest, is under 2026's
    // $16,100 standard deduction (Rev. Proc. 2025-32): nothing federal. Until 2026-10-14 the IRS's part was $107.00, on
    // 2024's table, 10% of what was over $14,600; the day past the due date Home said $111, $107.56 of it the IRS's.
    expect(sim.player.returns!['2026']!.figures.owedTo).toEqual({ irs: 0, states: { 'us-ct': 3_35 } });
    // TEST SETUP: the bank emptied, so filing can't pay.
    for (const a of [primary(sim), own(sim, 'savings')]) setBalance(sim, a, 0);
    expect(sim.must({ kind: 'tax.file', payload: { year: 2026 } })).toMatchObject({ paid: false, irs: 0, states: { 'us-ct': 3_35 } });
    sim.advanceTo(DUE + MS_DAY);
    const r = sim.player.returns!['2026']!;
    // Connecticut: 10% once and 1% for a month begun on the tax (Conn. Gen. Stat. 12-735), $3.35 and $0.34 and $0.03,
    // $3.72; the IRS's nothing grows nothing.
    const ct = 3_35 + Math.round(3_35 * 0.1) + Math.round(3_35 * 0.01);
    expect(ct).toBe(3_72);
    expect(dollars(ct)).toBe('$4');
    expect(dollars((r.owed ?? 0) + r.stateDue!['us-ct']!.owed!)).toBe('$3');
    expect(papers(sim)).toMatch(/\$4 of tax owed, with its interest and a late penalty growing each month\.$/);
    expect(drawn(sim).text).toContain('$4 of tax owed, with its interest and a late penalty growing each month. Open Papers');
  });

  it('filed early and left unpaid, Home says the tax owed without “growing each month” on the day it’s filed and the day before the due date, nothing accruing before it, and says it once the date has passed', () => {
    // Until later on 2026-10-13 Home said it on the day of filing (defect 42), and this was titled as that defect.
    const sim = feb1();
    // TEST SETUP: the bank emptied, so filing can't pay.
    for (const a of [primary(sim), own(sim, 'savings')]) setBalance(sim, a, 0);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const before = drawn(sim).text;
    expect(before).toContain('$166 of tax owed. Open Papers');
    expect(before).not.toContain('growing each month');
    // Interest and the late-payment penalty run from the due date (IRC 6601(a), 6651(a)(2)): the day before, $165.60.
    sim.advanceTo(DUE - MS_DAY);
    expect(troubles(sim, sim.player).find((t) => t.kind === 'tax')?.amount).toBe(165_60);
    expect(drawn(sim).text).not.toContain('growing each month');
    sim.advanceTo(DUE + MS_DAY);
    expect(drawn(sim).text).toContain('of tax owed, with its interest and a late penalty growing each month. Open Papers');
  });
});

// ---------------------------------------------------------------------------
// l-person
// ---------------------------------------------------------------------------

/** The person look as drawn: its lines, label and words, and its ways, label and detail. */
function personLook(html: string): { lines: [string, string][]; ways: [string, string][] } {
  const start = html.indexOf('<div class="look" data-depth="0">');
  expect(start).toBeGreaterThanOrEqual(0);
  const look = html.slice(start, html.indexOf('class="look-provenance"', start));
  return {
    lines: [...look.matchAll(/<p class="small"><span class="dim">([^<]*)<\/span>([^<]*)<\/p>/g)].map((m) => [m[1]!, m[2]!.replace(/&#x27;/g, '\'')]),
    ways: [...look.matchAll(/<div class="look-way"><button[^>]*>([^<]*)<\/button><span class="look-way-detail">([^<]*)<\/span><\/div>/g)].map((m) => [m[1]!, m[2]!]),
  };
}
/** PLAYER JOURNEY: her name pressed on Home, and Home drawn again with what the press opened. */
function openedFromHome(sim: Simulation): ReturnType<typeof personLook> {
  drawn(sim);
  press('Ada');
  expect(h.opened).toEqual([subject('person', sim.player.id)]);
  return personLook(drawn(sim, [h.opened[0]]).html);
}

/**
 * Who Are You Going To Be? as the player goes through it: its fields typed into, its pickers pressed, Continue to the
 * Starting Point, and what that step draws. Each render reads the state the presses before it left.
 */
function creation() {
  let started: NewSaveConfig | undefined;
  const onStart = (config: NewSaveConfig) => { started = config; };
  h.kept = [];
  const draw = () => {
    h.cursor = 0; h.buttons = []; h.elements = [];
    return words(renderToStaticMarkup(createElement(CharacterCreation, { slot: 1, onCancel: () => undefined, onStart })).replace(/<!-- -->/g, ''));
  };
  const field = (id: string) => {
    const found = h.elements.filter((e) => e.props.id === id);
    expect(found.map((e) => e.props.id), `one #${id}`).toEqual([id]);
    return found[0]!.props;
  };
  const type = (id: string, value: string) => { (field(id).onChange as (e: unknown) => void)({ target: { value } }); return draw(); };
  const option = (name: string) => {
    // The town's name, then its region's, run together in the button's words: "LondonEngland · 8,900,000 people".
    const found = h.buttons.filter((b) => b.props.role === 'option' && new RegExp(`^${name}(?=[A-Z])`).test(b.text));
    expect(found, `one “${name}” in the picker`).toHaveLength(1);
    (found[0]!.props.onClick as () => void)();
    return draw();
  };
  const next = (label: 'Continue' | 'Begin') => {
    expect(button(label).props.disabled).toBe(false);
    press(label);
    return draw();
  };
  return { draw, field, type, option, next, started: () => started };
}

describe('l-person', () => {
  // Until 2026-10-14 this asked the London-born student in centimeters and kilograms, the units of where she was born,
  // and her look in New Haven said them back in feet and pounds. Since the owner's rule of that day (`bodyUnits`) both
  // are the units of where she lives, and each says so.
  it('PLAYER JOURNEY: born in London on Identity, the Starting Point asks her body in feet, inches and pounds, the units of New Haven where she’ll live; 5, 7 and 143 begun, her look in New Haven says them back', () => {
    const play = creation();
    play.draw();
    play.type('first', 'Ada');
    play.type('last', 'Cole');
    play.type('pronouns', 'she/her');
    // The country picked from its list, then London from the towns it shows.
    play.type('born-country', CITIES.get('uk-eng-london')!.countryId);
    let page = play.option('London');
    expect(page).toContain('Citizenship United Kingdom');
    play.next('Continue');
    play.next('Continue');
    page = play.next('Continue');
    expect(page).toContain('Your Body Your height and weight on the first morning. In feet, inches and pounds, the units of the United States, where you live.');
    expect(page).toContain('Height (Feet) Inches Weight (Pounds)');
    expect(page).not.toMatch(/Centimeters|Kilograms/);
    play.type('height-ft', '5');
    play.type('height-in', '7');
    // 67 inches at 2.54 cm, 170.18, kept to a tenth; 143 lb at 0.45359237 kg, 64.86, 64.9; 64.9 / 1.702², 22.40.
    expect(play.type('weight-lb', '143')).toContain('That’s a body mass index of 22.4.');
    play.next('Continue');
    play.next('Begin');
    const config = play.started()!;
    expect(config).toMatchObject({ homeRegionId: 'uk-eng-london', startLocationId: 'us-ct-newhaven', heightCm: 170.2, weightKg: 64.9 });
    const sim = createSave(1, 'b12-born-london', config);
    expect(openedFromHome(sim).lines).toContainEqual(['Your body. ', '5 ft 7 in and 143 lb, with a body mass index of 22.4, in the healthy weight range. In feet, inches and pounds, the units of the United States, where you live.']);
  });

  it('born in New York, the same step asks feet, inches and pounds: 5, 7 and 143 are 170.2 cm and 64.9 kg, a body mass index of 22.4, and the look says them back in New Haven', () => {
    const play = creation();
    play.draw();
    play.type('first', 'Ada');
    play.type('last', 'Cole');
    play.type('pronouns', 'she/her');
    play.option('New York');
    play.next('Continue');
    play.next('Continue');
    const page = play.next('Continue');
    expect(page).toContain('Height (Feet) Inches Weight (Pounds)');
    expect(page).not.toMatch(/Centimeters|Kilograms/);
    play.type('height-ft', '5');
    play.type('height-in', '7');
    // 67 inches at 2.54 cm, 170.18, kept to a tenth; 143 lb at 0.45359237 kg, 64.86, 64.9; 64.9 / 1.702², 22.40.
    expect(play.type('weight-lb', '143')).toContain('That’s a body mass index of 22.4.');
    play.next('Continue');
    play.next('Begin');
    const config = play.started()!;
    expect(config).toMatchObject({ homeRegionId: 'us-ny-newyork', heightCm: 170.2, weightKg: 64.9 });
    // The units' why after the figures, from 2026-10-14 (`bodyUnits`).
    expect(openedFromHome(createSave(1, 'b12-born-newyork', config)).lines).toContainEqual(['Your body. ', '5 ft 7 in and 143 lb, with a body mass index of 22.4, in the healthy weight range. In feet, inches and pounds, the units of the United States, where you live.']);
  });

  it('PLAYER JOURNEY: the first morning’s run breaks a bone at 8:30 AM: “till October 6, 2026”, 43 days, inside a broken bone’s 42 to 84; the clock still has it at 8 AM that day and has mended it by 9', () => {
    const sim = life('g09-run-1668');
    sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    expect(INJURY_KIND.fracture.days).toEqual([42, 84]);
    // Monday 24 August and 43 days: 7 to the end of August, 30 in September, 6 in October.
    expect((at(2026, 10, 6, 8, 30) - at(2026, 8, 24, 8, 30)) / MS_DAY).toBe(43);
    const line: [string, string] = ['Mending. ', 'A broken bone, until October 6, 2026, and laid up until then.'];
    expect(openedFromHome(sim).lines).toContainEqual(line);
    sim.advanceTo(at(2026, 10, 6, 8));
    expect(openedFromHome(sim).lines).toContainEqual(line);
    sim.advanceTo(at(2026, 10, 6, 9));
    const mended = openedFromHome(sim);
    expect(mended.lines.map(([label]) => label)).not.toContain('Mending. ');
    expect(mended.ways.map(([label]) => label)).not.toContain('An Injury');
  });

  it('only the player is a Person: after a fall played the world holds her alone, and a person look for anyone else is gone; only a second Person put there by hand draws the look’s third person, in her pronouns, without Your Own Plans', () => {
    const sim = feb1();
    expect(Object.keys(sim.universe.people)).toEqual([sim.player.id]);
    // Her classmates are records on the School, with a look of their own kind.
    expect(sim.player.school!.classmates).toHaveLength(15);
    expect(resolveLook(sim, subject('person', 'someone-else'))).toEqual({ gone: 'This person isn’t in your life any more.' });
    type Seen = { name: string; kind: string; ways?: { label: string }[]; body?: unknown };
    const mine = resolveLook(sim, subject('person', sim.player.id)) as Seen;
    expect(mine.ways!.map((w) => w.label)).toContain('Your Own Plans');
    // TEST SETUP: a second Person put in the world by hand, a copy of her under another id and name.
    const other = { ...structuredClone(sim.player), id: 'person-test-setup', firstName: 'Bea', displayName: 'Bea Lane' };
    sim.universe.people[other.id] = other;
    const them = resolveLook(sim, subject('person', other.id)) as Seen;
    expect([them.name, them.kind]).toEqual(['Bea Lane', 'Somebody']);
    expect(them.ways!.map((w) => w.label)).not.toContain('Your Own Plans');
    const said = words(renderToStaticMarkup(them.body as never));
    // A copy of her, she/her, is spoken of as “her” (from 2026-10-15: until then as “they”, whatever the pronouns, so
    // this read “Their body.” above “On their papers. she/her”; tests/scope-people.test.ts holds all three pronouns).
    expect(said).toContain('Her body. ');
    expect(said).toContain('On her papers. Pronouns she/her. A citizen of the United Kingdom.');
    expect(said).not.toMatch(/Your body|On your papers/);
  });
});

// ---------------------------------------------------------------------------
// n-decision-us-status
// ---------------------------------------------------------------------------

const statusDecision = (sim: Simulation) => Object.values(sim.universe.decisions).filter((d) => d.refType === 'us-status');
const optPermits = (sim: Simulation) => documentsOf(sim.player).filter((d) => d.kind === 'permit' && d.name === 'Employment Authorization, OPT');

/**
 * A graduate on an F-1 the day after the clock looked at her status. PLAYER JOURNEY from Monday 24 August 2026 by the
 * clock to noon on Friday 1 June 2029, after TEST SETUP on the first day: the degree conferred by the School's own
 * `setStanding`, which a played life reaches only by three years of courses passed. Nothing else is moved: the program's
 * end is the F-1's as issued.
 */
function graduate(seed: string): Simulation {
  const sim = londoner(seed);
  // As issued on the first day: the program's end, 31 May 2029 at noon UTC (SLATE's F-1 for the class of 2029), and
  // sixty days' grace after a degree (8 CFR 214.2(f)(5)(iv)).
  expect(f1Of(sim.player)!.expiresAt).toBe(Date.UTC(2029, 6, 30, 12));
  // TEST SETUP: the degree conferred by the School's own setStanding on the first day.
  setStanding(sim, sim.player, 'graduated', 'TEST SETUP: the degree conferred by hand.');
  sim.advanceTo(at(2029, 5, 30, 12));
  expect(statusDecision(sim)).toEqual([]);
  sim.advanceTo(at(2029, 6, 1, 12));
  return sim;
}

describe('n-decision-us-status', () => {
  it('PLAYER JOURNEY: a graduate’s F-1, issued for the class of 2029 to 30 July 2029, is looked at by the clock on 31 May, the program’s end, due 30 July; Apply For OPT pressed on Home on 1 June pays $470 and leaves a permit pending to 30 August, which holds her status past 30 July and is approved for twelve months', () => {
    const sim = graduate('b12-opt');
    expect(statusDecision(sim)).toHaveLength(1);
    const [d] = statusDecision(sim);
    expect(d).toMatchObject({
      title: 'Your US Status Is Ending', createdAt: Date.UTC(2029, 4, 31, 12), dueAt: Date.UTC(2029, 6, 30, 12), route: '/workspace/papers',
      detail: 'Your permission to work in the United States has ended, and your status ends July 30, 2029. You can still apply for OPT before then. If you’re still here after that, you’ll be out of status. In the game, that means you can’t work here, your US visa is canceled, and the Visa Waiver Program is closed to you from then on.',
      actions: [{ label: 'Apply For OPT', commandKind: 'documents.apply_opt', payload: {} }, { label: 'Apply For OPT, Premium Processing', commandKind: 'documents.apply_opt', payload: { premium: true } }],
    });
    drawn(sim);
    press('Apply For OPT');
    const fee = memoed(sim, 'Form I-765, (c)(3)(B), OPT');
    expect(fee).toHaveLength(1);
    // The I-765 filed online, $470 (USCIS fee schedule).
    expect(fromPlayer(sim, fee[0]!)).toBe(-470_00);
    expect(d!.resolvedAt).toBe(at(2029, 6, 1, 12));
    // SLATE's ninety days for a standard filing: Thursday 30 August at noon.
    expect(optPermits(sim)).toHaveLength(1);
    expect(optPermits(sim)[0]).toMatchObject({ status: 'pending', appliedAt: at(2029, 6, 1, 12), readyAt: at(2029, 8, 30, 12) });
    const kept = reload(sim);
    kept.advanceTo(at(2029, 8, 1, 12));
    expect(kept.player.usOutOfStatus).toBeUndefined();
    expect(titled(kept, 'Out Of Status')).toEqual([]);
    kept.advanceTo(at(2029, 8, 30, 13));
    expect(optPermits(kept)[0]).toMatchObject({ status: 'valid', issuedAt: at(2029, 8, 30, 12), expiresAt: at(2030, 8, 30, 12) });
    expect(titled(kept, 'OPT Approved').map((n) => n.body)).toEqual(['You may work in the United States from August 30, 2029 to August 30, 2030. Every day from the first day of a job to its last counts as a day with work, and every other day as one without, the days before a job you’ve booked begins among them. OPT ends once you’ve had more than 90 days without work in total.']);
  });

  it('Apply For OPT, Premium Processing pressed on Home on Friday 1 June 2029 pays $2,250, and is decided in thirty business days with Juneteenth and Independence Day not among them, on Tuesday 17 July', () => {
    // Until later on 2026-10-13 SLATE counted both holidays and decided it Friday 13 July (defect 43), and this was titled
    // as that defect.
    const sim = graduate('b12-opt-premium');
    drawn(sim);
    press('Apply For OPT, Premium Processing');
    const fee = memoed(sim, 'Form I-765, (c)(3)(B), OPT, premium processing');
    expect(fee).toHaveLength(1);
    // $470 for the I-765 and $1,780 for premium processing (USCIS fee schedule).
    expect(fromPlayer(sim, fee[0]!)).toBe(-(470_00 + 1_780_00));
    // Premium processing's clock in business days since the 2024 fee rule: no weekend, and no federal holiday (8 CFR
    // 106.4(f)). From Friday 1 June: 4 to 8 June, 11 to 15, 18 and 20 to 22 (Juneteenth a Tuesday), 25 to 29, 2, 3, 5
    // and 6 July (the Fourth a Wednesday), 9 to 13, and 16 and 17: the thirtieth is Tuesday 17 July.
    expect(optPermits(sim)[0]).toMatchObject({ status: 'pending', appliedAt: at(2029, 6, 1, 12), readyAt: at(2029, 7, 17, 12) });
  });

  it('PLAYER JOURNEY: an F-1 who withdraws on 1 September 2026 is raised “Your US Status Is Ending” a minute on, due the sixteenth, with nothing to apply for; Home shows it without a button; it lapses with her status, across a reload', () => {
    const sim = londoner('b12-withdraw');
    sim.advanceTo(at(2026, 9, 1, 12));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    sim.advanceTo(at(2026, 9, 2, 12));
    expect(statusDecision(sim)).toHaveLength(1);
    // Fifteen days' grace after a withdrawal the school authorizes (8 CFR 214.2(f)(5)(iv)): Wednesday 16 September.
    expect(statusDecision(sim)[0]).toMatchObject({
      title: 'Your US Status Is Ending', createdAt: at(2026, 9, 1, 12, 1), dueAt: at(2026, 9, 16, 12), actions: [],
      detail: 'Your permission to work in the United States has ended, and your status ends September 16, 2026. If you’re still here after that, you’ll be out of status. In the game, that means you can’t work here, your US visa is canceled, and the Visa Waiver Program is closed to you from then on.',
    });
    const { text } = drawn(sim);
    expect(text).toContain('Your US Status Is Ending');
    expect(text).toContain('your status ends September 16, 2026. If you’re still here after that, you’ll be out of status.');
    expect(h.buttons.filter((b) => b.text.startsWith('Apply For OPT'))).toEqual([]);
    const kept = reload(sim);
    kept.advanceTo(at(2026, 9, 19, 12));
    expect(kept.player.usOutOfStatus).toBe(at(2026, 9, 16, 12));
    expect(titled(kept, 'Out Of Status')).toHaveLength(1);
    expect(openDecisions(kept).filter((x) => x.refType === 'us-status')).toEqual([]);
    expect(statusDecision(kept)).toHaveLength(1);
  });
});
