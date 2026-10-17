/**
 * Evidence for the seven rows the review of 2026-10-13 left partial in verification group g33-ui: Home's three lines of
 * Your Affairs, the person look and the stress dial's sentence, and two decisions, the year's tax return and a foreign
 * graduate's status. Each gap the review named is closed here through what the player does: Home drawn as they have it
 * and its own buttons pressed, the command a button sends, or the clock; and each consequence is read where the row
 * says it's read, against figures worked out here from the rule's own numbers, never asked of the helper the engine
 * computes them with.
 *
 * - `h-money`: a new student's line is "Chase Total Checking: $92,391.00. Worth $505,434." (the wealthy profile's
 *   85,000 € and 380,000 € at 0.92 € to the dollar, to the whole dollar); overdrawn by $25.00 it reads -$25.00 and
 *   "Your account is overdrawn.", and a Move Money of $1,000.00 from savings takes the alert away with the worth
 *   unmoved, across a reload; the day's spending put on the card adds ", $X of it owed"; its Chase button navigates to
 *   ('/workspace/bank', 'Money'); a guided life shows Money as its LockedPanel until "Money" is read, then Chase as
 *   Locked until "Your Bank" is, pressing it going nowhere and the bank refusing a transfer in the guide's words.
 *   "No account" can't be reached: the bank refuses to close a life's only current account, in its words.
 * - `h-school`: each branch of the line, played: Arriving with the registration booked for 10 AM on 24 August, Year 1
 *   with the next thing booked, a fall played without going to class giving "academic concern" and its alert with
 *   "Next: Classes" the next class day at nine, On Leave with no Next, Left the school with no Next, and a graduate's
 *   "Graduated" said once; the place in the class counted here from the class's 21 skills; its Yale button and its
 *   LockedPanel before "Drama School".
 * - `h-papers`: the 2026 return the tax season raises for an F-1 student, $165.60 (10% of $1,656.00 of work-study, 72
 *   hours at $23), is "$166 to pay"; three days past its day unfiled, "$174 to pay, a late penalty in it" (5% for a
 *   month or part, $8.28); filed on 1 February with nothing in the bank, "$166 of tax owed" until the due date and
 *   "$169" sixty days past it (0.5% a month for two months and 7% a year compounded daily), where the balance last
 *   stored reads $168; "Cover: none." and "You have no health cover." after a withdrawal; the Papers button; and a
 *   claim for unemployment refused in its own words, so the line carries no Unemployment clause.
 * - `l-person`: her name on Home pressed, the person look opens under it: the traits, the body in feet and pounds
 *   where she lives (5 ft 7 in and 143 lb for 170 cm and 65 kg, a body mass index of 22.5) and in centimeters for a
 *   life in London, her pronouns and citizenship, her own terms, her background and films, the eight dials with their
 *   figures, Readiness, Curious leading to the trait, a drawn Depression "Kept up" and, let go, "Left alone", an
 *   injury's "Mending." line and way while it mends and not after, and Your Own Plans.
 * - `l-dial-stress`: opened from Home through her name and Stress, the sentence in all three bands on a played life
 *   kept up hour by hour, stress clearing 0.35 an hour with energy over 15 and climbing 1.25 an hour on empty
 *   (1.6 − 0.35), the band turning when the figure shown reaches 25 and 60; money trouble adding 4 at a midnight; and
 *   a night nobody chose lifting stress to 14 where a chosen night leaves it lower.
 * - `n-decision-tax`: the clock raises "Your 2026 Tax Return" on 1 February with File It; pressed on Home it files and
 *   pays $165.60 from the bank and closes the decision once, across a reload; filed from Papers the decision closes at
 *   the moment of filing; unfiled, it lapses at the first world tick past its day (every two days) and troubles()
 *   carries return_late at $173.88, and a late filing from Papers pays $173.98 with three days' interest; with nothing
 *   in the bank, File It leaves it owed, the IRS's bill (CP14) comes at once and its first reminder five weeks after
 *   the due date (from 2026-10-16: until then five weeks after filing, before the tax was due, and no bill).
 * - `n-decision-us-status`: at a graduate's program end the clock raises "Your US Status Is Ending", due sixty days on,
 *   offering Apply For OPT then Apply For OPT, Premium Processing; pressed, the standard one pays $470 and leaves an OPT
 *   permit pending ninety days, which holds her status past its end and is approved by the clock for twelve months,
 *   once across a reload; applied for from Papers, the decision is answered at that moment; premium pays $2,250 and is
 *   decided in thirty business days, on Thursday 13 May. And a withdrawn F-1, whose grace of fifteen days begins at
 *   once, is raised the decision in it, due the sixteenth with nothing to apply for. Until `statusCheckAt` was fixed on
 *   2026-10-13 she was never raised it at all, and the test below, titled a defect, failed.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven from Monday
 * 24 August 2026 at 7:30 AM, born in New York (the birthplace a player picks on Identity, which `newLifeConfig` leaves
 * empty), or in London for the F-1 rows; played by the clock and the commands, the player left to the clock's own
 * keeping (no dials tended by hand). Home is the game's own screen rendered with react-dom/server, its buttons pressed
 * through their own onClick; `useGame` stands in for the provider, its `run` the save's own `execute`. A look opens the
 * way React would on the next render: the subject a press handed its LookRegion's setter is given back as that region's
 * state. One `quickSave` life lives in London, which a New Haven life doesn't reach, for the units a body is said in.
 * Seeds: the g33-probe-* lives are the ones the figures here were first read on, g33-probe-london for the played F-1
 * tax year and g33-probe-person for a Londoner drawn with depression among them; g09-run-1668 (found by
 * tests/evidence-g09-life.test.ts) for a first morning's run that breaks a bone.
 *
 * TEST SETUP, said again where it's done: an account brought to a balance by a posting against a test equity line (an
 * overdraft, or the bank emptied before a return is filed); a graduate's degree conferred by the School's own
 * `setStanding` with the F-1's program end moved to a chosen day, which no played life reaches inside the three years
 * a degree takes.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import type { Personality } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { openDecisions } from '@/engine/world/world';
import { CHAPTERS } from '@/engine/content/tutorial';
import { SKILLS } from '@/engine/content/school';
import { troubles } from '@/engine/systems/spending';
import { documentsOf } from '@/engine/systems/documents';
import { f1Of } from '@/engine/systems/permission';
import { setStanding } from '@/engine/systems/school';
import { healthOf } from '@/engine/systems/health';
import { at as subject } from '@/ui/looks/subject';

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
}));

// A LookRegion keeps what it has open in a `useState(null)`: given what a press asked for, and its setter recorded.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((init: unknown) => {
    const [value, set] = real.useState(init);
    if (init !== null) return [value, set];
    return [h.open.length > 0 ? h.open.shift() : value, (next: unknown) => { h.opened.push(next); }];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

// The buttons the screen draws, kept with their props as they're made (hoisted with the mocks that use it).
const keep = vi.hoisted(() => {
  const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
  return (real: Record<string, unknown>, into: () => { text: string; props: Record<string, unknown> }[]) => {
    const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
      if (type === 'button' && props) into().push({ text: textOf(props.children), props });
      return make(type, props, ...rest);
    };
    return { ...real, ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}), ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}) };
  };
});
vi.mock('react/jsx-runtime', async (orig) => keep(await orig<Record<string, unknown>>(), () => h.buttons));
vi.mock('react/jsx-dev-runtime', async (orig) => keep(await orig<Record<string, unknown>>(), () => h.buttons));

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

const { Home } = await import('@/ui/screens/Home');

// ---------------------------------------------------------------------------
// Lives, the screen, and figures
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** Ada Cole at Yale, born in New York. */
const life = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** The same, born in London: a British citizen on an F-1. */
const londoner = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation => life(seed, { homeRegionId: 'uk-eng-london', ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const opened = (text: string): Simulation => loadSave(deserialise(text) as never);
/** Every disposition at the middle, as the sliders can set them: each knob a trait doesn't move is 1. */
const MIDDLE: Personality = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 };

/** Home as the player has it: its markup, its words, and Your Affairs' words. */
function drawn(sim: Simulation, open: unknown[] = []): { html: string; text: string; affairs: string } {
  h.sim = sim; h.went = []; h.open = [...open]; h.opened = []; h.buttons = [];
  const html = renderToStaticMarkup(createElement(Home)).replace(/<!-- -->/g, '');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  return { html, text, affairs: text.slice(text.indexOf('Your Affairs')) };
}
/** The one button drawn with these words. */
function button(words: string): { text: string; props: Record<string, unknown> } {
  const found = h.buttons.filter((b) => b.text === words);
  expect(found.map((b) => b.text), `one “${words}” button`).toEqual([words]);
  return found[0]!;
}
const press = (words: string) => (button(words).props.onClick as () => void)();

const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const own = (sim: Simulation, kind: Account['kind']): Account => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === kind && !a.closedAt)!;
/** TEST SETUP: an account brought to a balance by a posting against a test equity line. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'opening', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test Setup').id, amount: -by }] });
}
/** Cents written as the line writes a balance, and as it writes a worth, to the whole dollar. */
const cents = (n: number) => `${n < 0 ? '-' : ''}$${(Math.abs(n) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dollars = (n: number) => `$${Math.round(n / 100).toLocaleString('en-US')}`;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const memoed = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo);
/** What a transaction took from the player's own accounts. */
const fromPlayer = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).reduce((n, p) => n + p.amount, 0);
/** Reads the guide's chapters not yet read, in order, through its own command, up to and including one. */
function readTo(sim: Simulation, last: string): void {
  for (const chapter of CHAPTERS) {
    if (!sim.universe.tutorial!.read.includes(chapter.id)) sim.must({ kind: 'tutorial.read', payload: { chapterId: chapter.id } });
    if (chapter.id === last) return;
  }
}
/** The place in the class counted here: one more than the classmates whose mean over the 21 skills is above hers. */
const meanOf = (craft: object) => SKILLS.reduce((n, s) => n + (craft as Record<string, number>)[s.id]!, 0) / SKILLS.length;
const rankOf = (sim: Simulation) => 1 + sim.player.school!.classmates.filter((m) => meanOf(m.craft) > meanOf(sim.player.craft!)).length;

/**
 * PLAYER JOURNEY: Ada, born in London, on an F-1, played by the clock from Monday 24 August 2026 to noon on Monday
 * 1 February 2027, the tax season's day. Played once, kept as a save, and opened afresh for each test that needs it.
 */
let feb1Text: string | undefined;
function feb1(): Simulation {
  if (!feb1Text) {
    const sim = londoner('g33-probe-london');
    sim.advanceTo(at(2027, 2, 1, 12));
    feb1Text = serialise(sim.universe);
  }
  return opened(feb1Text);
}
/** Its 2026 return's due date: a 1040-NR with wages, 15 April 2027, to the minute before midnight in New York. */
const DUE = at(2027, 4, 15, 23, 59);

// ---------------------------------------------------------------------------
// h-money
// ---------------------------------------------------------------------------

describe('h-money', () => {
  it('PLAYER JOURNEY: a new student’s Money line is Chase Total Checking at $92,391.00 and a worth of $505,434, with no alert, and its Chase button opens the bank screen', () => {
    const sim = life('g33-money');
    const { affairs } = drawn(sim);
    // The wealthy profile's 85,000 € and 380,000 € at SLATE's 0.92 € to the dollar, to the whole dollar: $92,391 and
    // $413,043, with nothing on the card, so a worth of $505,434 and no "of it owed".
    expect(affairs).toContain('Money Chase Total Checking: $92,391.00. Worth $505,434. Chase How This Works School');
    expect(affairs).not.toMatch(/overdrawn|of it owed/);
    expect(button('Chase').props.className).toBe('btn btn-sm');
    press('Chase');
    expect(h.went).toEqual([['/workspace/bank', 'Money']]);
  });

  it('overdrawn by $25.00 it reads -$25.00 and “Your account is overdrawn.”; a Move Money of $1,000.00 from savings takes the alert away with the worth unmoved, and a reload keeps it so', () => {
    const sim = life('g33-money-over');
    const checking = primary(sim);
    // TEST SETUP: the checking brought to -$25.00, $92,416.00 out of the worth.
    setBalance(sim, checking, -25_00);
    // $413,043 in savings less the $25.00 overdrawn: $413,018.
    expect(drawn(sim).affairs).toContain('Money Chase Total Checking: -$25.00. Worth $413,018. Your account is overdrawn. Chase How This Works');
    const moved = sim.must<{ moved: number }>({ kind: 'bank.transfer', payload: { fromId: own(sim, 'savings').id, toId: checking.id, amount: 1_000_00 } });
    expect(moved.moved).toBe(1_000_00);
    const after = drawn(sim).affairs;
    expect(after).toContain('Money Chase Total Checking: $975.00. Worth $413,018. Chase How This Works');
    expect(after).not.toContain('Your account is overdrawn.');
    const kept = drawn(reload(sim)).affairs;
    expect(kept).toContain('Money Chase Total Checking: $975.00. Worth $413,018. Chase How This Works');
    expect(kept).not.toContain('Your account is overdrawn.');
  });

  it('with the day’s spending put on the card, the worth counts what the card owes and the line says “, $X of it owed”', () => {
    const sim = life('g33-money-card');
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    sim.advanceTo(at(2026, 8, 26, 7, 30));
    const owed = -own(sim, 'credit_card').balance;
    expect(owed).toBeGreaterThan(0);
    const checking = primary(sim).balance;
    const savings = own(sim, 'savings').balance;
    // The worth is what the accounts hold less what the card owes, to the whole dollar.
    expect(drawn(sim).affairs).toContain(`Money Chase Total Checking: ${cents(checking)}. Worth ${dollars(checking + savings - owed)}, ${dollars(owed)} of it owed. Chase How This Works`);
  });

  it('PLAYER JOURNEY, guided: Money is its LockedPanel until “Money” is read; then Chase is Locked until “Your Bank” is, a press goes nowhere and the bank refuses a transfer in the guide’s words, across a reload; read, Chase opens the bank screen', () => {
    const sim = life('g33-money-guided', { tutorial: true });
    const before = drawn(sim).affairs;
    expect(before).toContain('Money Locked Opens with “Money” in the guide: everything you have and owe, at a glance. Read About It');
    expect(before).not.toContain('Chase Total Checking');
    readTo(sim, 'documents');
    expect(drawn(sim).affairs).toContain('Money Locked Opens with “Money” in the guide');
    readTo(sim, 'money');
    expect(drawn(sim).affairs).toContain('Money Chase Total Checking: $92,391.00. Worth $505,434. Chase Locked How This Works');
    const locked = button('ChaseLocked');
    expect(locked.props.title).toBe('Read “Your Bank” in the guide first.');
    expect(locked.props.className).toBe('btn btn-sm is-locked');
    press('ChaseLocked');
    expect(h.went).toEqual([]);
    expect(sim.execute({ kind: 'bank.transfer', payload: { fromId: own(sim, 'savings').id, toId: primary(sim).id, amount: 1_00 } }).error).toBe('Read “Your Bank” in the guide first.');
    const kept = reload(sim);
    expect(drawn(kept).affairs).toContain('Chase Locked How This Works');
    kept.must({ kind: 'tutorial.read', payload: { chapterId: 'bank' } });
    drawn(kept);
    expect(button('Chase').props.className).toBe('btn btn-sm');
    press('Chase');
    expect(h.went).toEqual([['/workspace/bank', 'Money']]);
  });

  it('“No account” can’t be reached: the bank refuses to close a life’s only current account, in its words, and the line still names it', () => {
    const sim = life('g33-money-close');
    expect(sim.execute({ kind: 'bank.close_current', payload: { accountId: primary(sim).id } }).error)
      .toBe('It’s your only current account. Open another first: SLATE keeps every life a current account to be paid into.');
    expect(drawn(sim).affairs).toContain('Money Chase Total Checking: $92,391.00.');
  });
});

// ---------------------------------------------------------------------------
// h-school
// ---------------------------------------------------------------------------

describe('h-school', () => {
  it('PLAYER JOURNEY: a new student is “Arriving, good standing”, her place counted from the class’s skills, “Next: Registration And Your Account, August 24, 2026 at 10:00 AM.”; its Yale button opens the School screen', () => {
    const sim = life('g33-school');
    // Fifteen classmates and her, sixteen; the 21 skills the School screen lists.
    expect(sim.player.school!.classmates).toHaveLength(15);
    expect(SKILLS).toHaveLength(21);
    const { affairs } = drawn(sim);
    expect(affairs).toContain(`School Arriving, good standing, ${rankOf(sim)} of 16 in the class. Next: Registration And Your Account, August 24, 2026 at 10:00 AM. Yale How This Works`);
    expect(affairs).not.toContain('Your standing is');
    press('Yale');
    expect(h.went).toEqual([['/workspace/school', 'Your School']]);
  });

  it('a day in, “Year 1, good standing”, and Next is the next thing booked: “Meeting The Acting Faculty, August 26, 2026 at 10:00 AM.”', () => {
    const sim = life('g33-school-year');
    sim.advanceTo(at(2026, 8, 25, 12));
    expect(drawn(sim).affairs).toContain(`School Year 1, good standing, ${rankOf(sim)} of 16 in the class. Next: Meeting The Acting Faculty, August 26, 2026 at 10:00 AM. Yale How This Works`);
  });

  it('PLAYER JOURNEY: a fall played without going to class ends in the faculty’s concern, and the line says so with its alert; Next is the next class day at nine, Tuesday 2 February at noon on the Monday; a reload keeps it', () => {
    const sim = feb1();
    expect(sim.player.school!.standing).toBe('concern');
    expect(titled(sim, 'A Notice Of Academic Concern')).toHaveLength(1);
    // Classes run nine to three on the class days: at noon on Monday 1 February, Monday's began at nine.
    const line = `School Year 1, academic concern, ${rankOf(sim)} of 16 in the class. Next: Classes, February 2, 2027 at 9:00 AM. Your standing is academic concern: the School screen says why. Yale How This Works`;
    expect(drawn(sim).affairs).toContain(line);
    expect(drawn(reload(sim)).affairs).toContain(line);
  });

  it('PLAYER JOURNEY: a personal leave asked on 13 January 2027 and begun on its decision is “On Leave”, with no Next', () => {
    const sim = life('g33-school-leave');
    sim.advanceTo(at(2027, 1, 13, 12));
    const asked = sim.must<{ decideAt: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    expect(asked.startsNow).toBe(true);
    sim.advanceTo(asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave!.status).toBe('on');
    const { affairs } = drawn(sim);
    expect(affairs).toMatch(new RegExp(`School On Leave, [a-z ]+, ${rankOf(sim)} of 16 in the class\\.( Your standing is [a-z ]+: the School screen says why\\.)? Yale How This Works`));
    expect(affairs).not.toContain('Next:');
  });

  it('PLAYER JOURNEY: withdrawn on 1 September 2026, “Left the school, withdrawn”, with no Next and no alert, across a reload', () => {
    const sim = life('g33-school-withdraw');
    sim.advanceTo(at(2026, 9, 1, 12));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    for (const one of [sim, reload(sim)]) {
      const { affairs } = drawn(one);
      expect(affairs).toContain(`School Left the school, withdrawn, ${rankOf(one)} of 16 in the class. Yale How This Works`);
      expect(affairs).not.toMatch(/Next:|Your standing is/);
    }
  });

  it('a graduate’s line says Graduated once, not “Graduated, graduated”, with no Next', () => {
    const sim = life('g33-school-graduate');
    // TEST SETUP: the degree conferred by the School's own setStanding, three years early.
    setStanding(sim, sim.player, 'graduated', 'TEST SETUP: the degree conferred by hand.');
    const { affairs } = drawn(sim);
    expect(affairs).toContain(`School Graduated, ${rankOf(sim)} of 16 in the class. Yale How This Works`);
    expect(affairs).not.toMatch(/Graduated, graduated|Next:|Your standing is/);
  });

  it('PLAYER JOURNEY, guided: School is its LockedPanel until “Drama School” is read, and the line once it is', () => {
    const sim = life('g33-school-guided', { tutorial: true });
    readTo(sim, 'weather');
    const before = drawn(sim).affairs;
    expect(before).toContain('School Locked Opens with “Drama School” in the guide: where your life as an actor begins. Read About It');
    expect(before).not.toContain('Arriving');
    readTo(sim, 'school');
    expect(drawn(sim).affairs).toContain(`School Arriving, good standing, ${rankOf(sim)} of 16 in the class. Next: Registration And Your Account`);
  });
});

// ---------------------------------------------------------------------------
// h-papers
// ---------------------------------------------------------------------------

describe('h-papers', () => {
  it('PLAYER JOURNEY: the return the tax season raised is “due April 15, 2027, $166 to pay”: 10% of the $1,656.00 of work-study, 72 hours at $23; the Papers button opens Papers', () => {
    const sim = feb1();
    const wages = sim.universe.transactions.filter((t) => /^Work-study wages, \d+ hours/.test(t.memo) && t.at < at(2027, 1, 1, 0));
    expect(wages.reduce((n, t) => n + Number(/(\d+) hours/.exec(t.memo)![1]), 0)).toBe(72);
    expect(wages.reduce((n, t) => n + fromPlayer(sim, t), 0)).toBe(72 * 23_00);
    // A 1040-NR taxes a student's wages from the first dollar, with no standard deduction: 10% of $1,656.00, $165.60.
    expect(sim.player.returns!['2026']!.figures.balance).toBe(165_60);
    const { affairs } = drawn(sim);
    expect(affairs).toContain('Papers Cover: Yale Health. The 2026 return is due April 15, 2027, $166 to pay. Papers How This Works');
    press('Papers');
    expect(h.went).toEqual([['/workspace/papers', 'Papers']]);
  });

  it('three days past its day unfiled: “$174 to pay, a late penalty in it”, $165.60 and 5% for a month or part, $8.28', () => {
    const sim = feb1();
    sim.advanceTo(DUE + 3 * MS_DAY);
    // Three days gone, it “was due”: until 2026-10-14 this held the alert to “is due April 15, 2027”, a date past
    // (tests/evidence3-home.test.ts, h-papers).
    expect(drawn(sim).affairs).toContain('Papers Cover: Yale Health. The 2026 return was due April 15, 2027, $174 to pay, a late penalty in it. Papers How This Works');
    // What Needs You says what weighs once nothing is waiting there: the notices marked read with its own button.
    const mark = h.buttons.filter((b) => /^Mark \d+ Read$/.test(b.text));
    expect(mark).toHaveLength(1);
    (mark[0]!.props.onClick as () => void)();
    expect(drawn(sim).text).toContain('No Decisions Waiting A tax return is past its day, unfiled, $174 with its penalty so far.');
  });

  it('filed on 1 February with nothing in the bank: “$166 of tax owed” to the due date, nothing accruing before it, and $169 sixty days past it, where the balance last stored reads $168; a reload says the same', () => {
    const sim = feb1();
    // TEST SETUP: the bank emptied, so filing can't pay.
    for (const a of [primary(sim), own(sim, 'savings')]) setBalance(sim, a, 0);
    const filed = sim.must<{ paid: boolean; irs: number }>({ kind: 'tax.file', payload: { year: 2026 } });
    expect(filed).toMatchObject({ paid: false, irs: 165_60 });
    // The alert whole: what's owed, and whether it says it's growing. Until 2026-10-13 this read only the amount, under
    // words that said it was growing from the day of filing, before the due date, when nothing grows; they're said only
    // past the due date since (tests/evidence2-b12.test.ts, h-papers).
    const owedAlert = (s: Simulation) => /Papers Cover: Yale Health\. (\$[\d,]+ of tax owed[^.]*)\. Papers How This Works/.exec(drawn(s).affairs)?.[1];
    expect(owedAlert(sim)).toBe('$166 of tax owed');
    expect(drawn(sim).affairs).not.toContain('The 2026 return is due');
    // Interest and the late-payment penalty run from the due date (IRC 6601(a), 6651(a)(2)): the day before, still $165.60.
    sim.advanceTo(DUE - MS_DAY);
    expect(troubles(sim, sim.player).find((t) => t.kind === 'tax')?.amount).toBe(165_60);
    expect(owedAlert(sim)).toBe('$166 of tax owed');
    // Sixty days past: 0.5% a month or part for two months, $1.66, and 7% a year compounded daily on $165.60, $1.92:
    // $169.17.
    sim.advanceTo(DUE + 60 * MS_DAY);
    const live = 165_60 * (1 + 2 * 0.005) + 165_60 * ((1 + 0.07 / 365) ** 60 - 1);
    expect(dollars(live)).toBe('$169');
    const growing = '$169 of tax owed, with its interest and a late penalty growing each month';
    expect(owedAlert(sim)).toBe(growing);
    expect(dollars(troubles(sim, sim.player).find((t) => t.kind === 'tax')!.amount)).toBe('$169');
    // The balance as stored, last brought up to date by the IRS's third letter, a month after the due date.
    expect(dollars(sim.player.returns!['2026']!.owed!)).toBe('$168');
    expect(owedAlert(reload(sim))).toBe(growing);
  });

  it('PLAYER JOURNEY: withdrawn by the fifteenth day of classes, Yale Health is gone: “Cover: none.” and “You have no health cover.”', () => {
    const sim = life('g33-papers-cover');
    sim.advanceTo(at(2026, 9, 1, 12));
    expect(drawn(sim).affairs).toContain('Papers Cover: Yale Health. Papers How This Works');
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    expect(drawn(sim).affairs).toContain('Papers Cover: none. You have no health cover. Papers How This Works');
  });

  it('a claim for unemployment is refused at school and after leaving it, in its own words, so the line has no Unemployment clause', () => {
    const sim = life('g33-papers-claim');
    sim.advanceTo(at(2027, 4, 5, 12));
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).error).toBe('Connecticut treats a full-time student as not available for work (CGS 31-235(b)), so a claim pays only once you’ve left school.');
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).error).toBe('Connecticut asks for base-period wages of 40 times the weekly benefit: $1,800.00 for $45.00. Your base period’s quarters paid $0.00, $0.00, $0.00, $0.00.');
    expect(sim.player.unemployment?.claim).toBeUndefined();
    expect(drawn(sim).affairs).not.toContain('Unemployment');
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

describe('l-person', () => {
  const ada = () => londoner('g33-probe-person', { personalityTraits: ['curious'], heightCm: 170, weightKg: 65, raceEthnicity: ['black', 'other'], raceEthnicityOwn: 'British Caribbean', background: 'Grew up over a chip shop in Peckham.', genres: ['western'] });

  it('PLAYER JOURNEY: her name on Home opens her: the trait, her body in feet and pounds where she lives, her papers, her own terms, her background and films; the eight dials, Readiness, Curious, a drawn Depression kept up, and Your Own Plans', () => {
    const sim = ada();
    // Drawn with the life, not given: kept up, as a condition carried in is.
    expect(healthOf(sim.player).chronic).toEqual({ depression: { treated: true } });
    const { lines, ways } = openedFromHome(sim);
    // 170 cm is 66.93 inches, 5 ft 7 in; 65 kg is 143.30 lb; 65 / 1.70² is 22.49, inside the WHO's 18.5 to 24.9.
    expect(lines).toEqual([
      ['Who you are. ', 'Curious.'],
      // The units' why after the figures, from 2026-10-14 (`bodyUnits`): until then the line ended at the weight's word.
      ['Your body. ', '5 ft 7 in and 143 lb, a body mass index of 22.5: healthy weight. In feet, inches and pounds, the units of the United States, where you live.'],
      ['On your papers. ', 'she/her, a citizen of United Kingdom.'],
      ['In your own terms. ', 'Black Or African, British Caribbean.'],
      ['Where you come from. ', 'Grew up over a chip shop in Peckham.'],
      ['The films you love. ', 'Western.'],
    ]);
    const w = sim.player.wellbeing;
    expect(ways).toEqual([
      ['Energy', `${Math.round(w.energy)}/100, and what the day has left in you`],
      ['Stress', `${Math.round(w.stress)}/100, and what it is doing to your sleep`],
      ['Sleep Debt', `${Math.round(w.sleepDebt)} hours on the books, and what sleep pays back`],
      ['Morale', `${Math.round(w.morale)}/100, and how much of the day’s stress a night clears`],
      ['Condition', `${Math.round(w.condition)}/100, and how much a night puts back, your mood, a sick day, and how likely a year is to be your last`],
      ['Fitness', `${Math.round(w.fitness)}/100, and how far rest can mend you, and what a workout costs`],
      ['Nourishment', `${Math.round(w.nourishment)}/100, and how long since you ate properly`],
      ['Hygiene', `${Math.round(w.hygiene!)}/100, and your mood once it’s low, and readiness a little`],
      ['Readiness', 'What seven of the eight come to: what a class, a lab, a rehearsal, an hour of practice or a workout builds, and the condition judged work meets you in'],
      ['Curious', 'The thing nobody asked you to read gets read: your reading of a scene goes deeper.'],
      ['Depression', 'Kept up, at what the plan leaves'],
      ['Your Own Plans', 'Everything you have put on the calendar yourself'],
    ]);
    // Each way opens what it names.
    h.opened = [];
    press('Curious');
    press('Depression');
    press('Your Own Plans');
    expect(h.opened).toEqual([subject('trait', 'curious'), subject('condition', 'depression'), subject('plans')]);
  });

  it('Let It Go turns Depression’s way to “Left alone, and what that does”, across a reload; Keep It Up turns it back', () => {
    const sim = ada();
    sim.must({ kind: 'health.treat', payload: { condition: 'depression', on: false } });
    const kept = reload(sim);
    expect(openedFromHome(kept).ways.find(([label]) => label === 'Depression')).toEqual(['Depression', 'Left alone, and what that does']);
    kept.must({ kind: 'health.treat', payload: { condition: 'depression', on: true } });
    expect(openedFromHome(kept).ways.find(([label]) => label === 'Depression')).toEqual(['Depression', 'Kept up, at what the plan leaves']);
  });

  it('the units are where she lives: the same 170 cm and 65 kg read “170 cm and 65.0 kg” for a life in London', () => {
    // A life in London, which a New Haven life doesn't reach: quickSave.
    const sim = quickSave({ homeRegionId: 'uk-eng-london', startLocationId: 'uk-eng-london', livesWhereBorn: true, heightCm: 170, weightKg: 65 }, 'g33-person-london');
    const { lines } = personLook(drawn(sim, [subject('person', sim.player.id)]).html);
    // The units' why after the figures, from 2026-10-14 (`bodyUnits`).
    expect(lines.find(([label]) => label === 'Your body. ')).toEqual(['Your body. ', '170 cm and 65.0 kg, a body mass index of 22.5: healthy weight. In centimeters and kilograms, the units of the United Kingdom, where you live.']);
  });

  it('PLAYER JOURNEY: the first morning’s run breaks a bone: “Mending. A Broken Bone, till October 6, 2026, and off work till then.” and An Injury, both gone once it has mended', () => {
    const sim = life('g09-run-1668');
    sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    // The draw's 43 days from 8:30 AM on Monday 24 August.
    const hurt = openedFromHome(sim);
    expect(hurt.lines).toContainEqual(['Mending. ', 'A Broken Bone, till October 6, 2026, and off work till then.']);
    expect(hurt.ways).toContainEqual(['An Injury', 'What it is, till when, and what it keeps you from']);
    const kept = reload(sim);
    expect(openedFromHome(kept).lines).toContainEqual(['Mending. ', 'A Broken Bone, till October 6, 2026, and off work till then.']);
    kept.advanceTo(at(2026, 10, 6, 12));
    const mended = openedFromHome(kept);
    expect(mended.lines.map(([label]) => label)).not.toContain('Mending. ');
    expect(mended.ways.map(([label]) => label)).not.toContain('An Injury');
  });
});

// ---------------------------------------------------------------------------
// l-dial-stress
// ---------------------------------------------------------------------------

/** The stress dial as the player opens it: her name on Home, then Stress in what that opened. */
function stressDial(sim: Simulation): string {
  drawn(sim);
  expect(h.buttons.filter((b) => b.text === 'Stress'), 'How You Are’s Stress').toHaveLength(1);
  drawn(sim, [subject('person', sim.player.id)]);
  // Two now: the person look's way, drawn under the page's head, and How You Are's below it.
  const stress = h.buttons.filter((b) => b.text === 'Stress');
  expect(stress).toHaveLength(2);
  h.opened = [];
  (stress[0]!.props.onClick as () => void)();
  expect(h.opened).toEqual([subject('dial', `${sim.player.id}/stress`)]);
  const { html } = drawn(sim, [subject('person', sim.player.id), h.opened[0]]);
  const found = /<div class="look" data-depth="1">[\s\S]*?<p class="look-summary">([^<]*)<\/p>/.exec(html);
  expect(found, 'the stress dial opened inside the person look').not.toBeNull();
  return found![1]!.replace(/&#x27;/g, '\'');
}
/** The row's three bands, by the figure the dial shows. */
const band = (n: number) => (n < 25 ? `${n}, and not much is adding to it. Running on empty adds to it, and so do money trouble and nights gone badly.`
  : n < 60 ? `${n}. Present, manageable, and slower to clear than it was.` : `${n}. High enough that sleep is going badly and it feeds itself.`);

describe('l-dial-stress', () => {
  it('PLAYER JOURNEY: a new life’s 18, opened from Home through her name and Stress: “18, and not much is adding to it…”, with no sofa in it', () => {
    const sim = life('g33-probe-night', { personality: MIDDLE });
    expect(sim.player.wellbeing.stress).toBe(18);
    const said = stressDial(sim);
    expect(said).toBe('18, and not much is adding to it. Running on empty adds to it, and so do money trouble and nights gone badly.');
    expect(said).not.toMatch(/sofa/);
  });

  it('PLAYER JOURNEY: kept up hour by hour, stress clears 0.35 an hour with energy over 15 and climbs 1.25 on empty; the sentence turns when the figure shown reaches 25, and again at 60, and a reload says the same', () => {
    const sim = life('g33-probe-night', { personality: MIDDLE });
    let clearing = 0;
    let climbing = 0;
    /** Each hour's figure as shown, and the dial's sentence then. */
    const read: { n: number; said: string }[] = [];
    while (read.length < 70 && !read.some(({ n }) => n >= 61)) {
      const before = { stress: sim.player.wellbeing.stress, energy: sim.player.wellbeing.energy };
      sim.advanceTo(sim.now + MS_HOUR);
      const w = sim.player.wellbeing;
      // An hour wholly over the empty line clears 0.35; an hour begun on empty adds 1.6, less the 0.35, 1.25.
      if (w.energy > 15) { expect(w.stress - before.stress).toBeCloseTo(-0.35, 9); clearing += 1; }
      if (before.energy <= 15) { expect(w.stress - before.stress).toBeCloseTo(1.25, 9); climbing += 1; }
      read.push({ n: Math.round(w.stress), said: stressDial(sim) });
    }
    expect(clearing).toBeGreaterThan(15);
    expect(climbing).toBeGreaterThan(30);
    // Every hour's sentence is its figure's band, and each turn comes as the figure shown passes from 24 to 25 and from
    // 59 to 60.
    for (const { n, said } of read) expect(said).toBe(band(n));
    const present = read.findIndex(({ said }) => said.includes('Present, manageable'));
    const high = read.findIndex(({ said }) => said.includes('High enough that sleep is going badly'));
    expect([read[present - 1]!.n, read[present]!.n]).toEqual([24, 25]);
    expect([read[high - 1]!.n, read[high]!.n]).toEqual([59, 60]);
    expect(stressDial(reload(sim))).toBe(read[read.length - 1]!.said);
  });

  it('money trouble: an hour across midnight overdrawn adds 4 to what the hour clears, and the dial reads the figure it made', () => {
    const twin = () => { const sim = life('g33-probe-night', { personality: MIDDLE }); sim.advanceTo(at(2026, 8, 24, 23, 30)); return sim; };
    const clean = twin();
    const worried = twin();
    // TEST SETUP: the checking overdrawn by $25.00.
    setBalance(worried, primary(worried), -25_00);
    const was = clean.player.wellbeing.stress;
    expect(worried.player.wellbeing.stress).toBe(was);
    for (const sim of [clean, worried]) for (let i = 0; i < 2; i += 1) sim.advanceTo(sim.now + MS_HOUR / 2);
    expect(clean.player.wellbeing.stress).toBeCloseTo(was - 0.35, 9);
    expect(worried.player.wellbeing.stress).toBeCloseTo(was - 0.35 + 4, 9);
    expect(stressDial(worried)).toBe(band(Math.round(worried.player.wellbeing.stress)));
    expect(stressDial(clean)).toBe(band(Math.round(clean.player.wellbeing.stress)));
  });

  it('nights gone badly: a night nobody chose lifts stress from 13.45 to 14, where eight hours chosen the same evening leave it lower', () => {
    const evening = () => { const sim = life('g33-probe-night', { personality: MIDDLE }); for (let i = 0; i < 13; i += 1) sim.advanceTo(sim.now + MS_HOUR); return sim; };
    const coasted = evening();
    // Thirteen waking hours at 0.35: 18 − 4.55.
    expect(coasted.player.wellbeing.stress).toBeCloseTo(13.45, 9);
    coasted.advanceTo(at(2026, 8, 25, 6));
    expect(coasted.player.wellbeing.stress).toBe(14);
    expect(stressDial(coasted)).toBe(band(14));
    const slept = evening();
    slept.must({ kind: 'life.sleep', payload: { hours: 8 } });
    slept.advanceTo(at(2026, 8, 25, 6));
    expect(slept.player.wellbeing.stress).toBeLessThan(13.45);
  });
});

// ---------------------------------------------------------------------------
// n-decision-tax
// ---------------------------------------------------------------------------

const returnDecision = (sim: Simulation) => Object.values(sim.universe.decisions).filter((d) => d.refType === 'return' && d.refId === '2026');

describe('n-decision-tax', () => {
  it('PLAYER JOURNEY: the clock raises “Your 2026 Tax Return” at nine on 1 February, File It pressed on Home files it and pays $165.60 from the bank, closing it; nothing of it happens twice, across a reload and past the due date', () => {
    const sim = feb1();
    const [d] = returnDecision(sim);
    expect(returnDecision(sim)).toHaveLength(1);
    expect(d).toMatchObject({
      title: 'Your 2026 Tax Return', createdAt: at(2027, 2, 1, 9), dueAt: DUE,
      detail: 'Form 1040-NR, with Form 8843. You owe $165.60, on $1,656.00 of income. File it by April 15, 2027.',
      actions: [{ label: 'File It', commandKind: 'tax.file', payload: { year: 2026 } }],
    });
    expect(d!.resolvedAt).toBeUndefined();
    drawn(sim);
    press('File It');
    const r = sim.player.returns!['2026']!;
    expect(r.filedAt).toBe(sim.now);
    expect(d!.resolvedAt).toBe(sim.now);
    expect(openDecisions(sim).filter((x) => x.refType === 'return')).toEqual([]);
    const paid = memoed(sim, 'Federal income tax, 2026');
    expect(paid).toHaveLength(1);
    expect(fromPlayer(sim, paid[0]!)).toBe(-165_60);
    expect(drawn(sim).affairs).toContain('Papers Cover: Yale Health. Papers How This Works');
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: d!.id, actionIndex: 0 } }).error).toBe('That’s been done already.');
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).error).toBe('You’ve already filed it. To change it, file an amended return.');
    const kept = reload(sim);
    kept.advanceTo(DUE + 3 * MS_DAY);
    expect(memoed(kept, 'Federal income tax, 2026')).toHaveLength(1);
    expect(memoed(kept, 'Federal income tax, 2026, with late penalties and interest')).toHaveLength(0);
    expect(returnDecision(kept)).toHaveLength(1);
    expect(kept.universe.scheduled.filter((i) => i.kind === 'tax.substitute' && i.status === 'pending')).toEqual([]);
    expect(troubles(kept, kept.player).filter((t) => t.kind === 'tax' || t.kind === 'return_late')).toEqual([]);
  });

  it('filed from Papers with tax.file, the decision closes too, at the moment of filing', () => {
    const sim = feb1();
    sim.advanceTo(at(2027, 3, 1, 12));
    const [d] = returnDecision(sim);
    expect(d!.resolvedAt).toBeUndefined();
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    expect(d!.resolvedAt).toBe(at(2027, 3, 1, 12));
    expect(openDecisions(sim).filter((x) => x.refType === 'return')).toEqual([]);
    drawn(sim);
    expect(h.buttons.filter((b) => b.text === 'File It')).toEqual([]);
  });

  it('unfiled, it lapses at the first world tick past its day, two days at most, troubles() carries return_late at $173.88, and filing late from Papers pays $173.98 with three days’ interest', () => {
    const sim = feb1();
    sim.advanceTo(DUE + 3 * MS_DAY);
    const [d] = returnDecision(sim);
    expect(d!.resolvedAt).toBeGreaterThan(DUE);
    expect(d!.resolvedAt).toBeLessThanOrEqual(DUE + 2 * MS_DAY);
    expect(openDecisions(sim).filter((x) => x.refType === 'return')).toEqual([]);
    // $165.60 and, filed in the first month or part past due, 4.5% for filing and 0.5% for paying: $8.28.
    expect(troubles(sim, sim.player).filter((t) => t.kind === 'return_late')).toEqual([{ kind: 'return_late', amount: 173_88 }]);
    // The IRS's substitute return is on the calendar for a year past the due date.
    expect(sim.universe.scheduled.filter((i) => i.kind === 'tax.substitute' && i.status === 'pending').map((i) => i.at)).toEqual([DUE + 365 * MS_DAY]);
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: d!.id, actionIndex: 0 } }).error).toBe('That’s been done already.');
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    // Three days' interest at 7% a year compounded daily on $165.60: 9.53 cents, 10.
    const paid = memoed(sim, 'Federal income tax, 2026, with late penalties and interest');
    expect(paid).toHaveLength(1);
    expect(fromPlayer(sim, paid[0]!)).toBe(-(165_60 + 8_28 + Math.round(165_60 * ((1 + 0.07 / 365) ** 3 - 1))));
    expect(fromPlayer(sim, paid[0]!)).toBe(-173_98);
    expect(sim.universe.scheduled.filter((i) => i.kind === 'tax.substitute' && i.status === 'pending')).toEqual([]);
    expect(troubles(sim, sim.player).filter((t) => t.kind === 'return_late' || t.kind === 'tax')).toEqual([]);
  });

  it('with nothing in the bank, File It on Home leaves $165.60 owed and collection begins: the IRS’s first reminder five weeks on', () => {
    const sim = feb1();
    // TEST SETUP: the bank emptied, so filing can't pay.
    for (const a of [primary(sim), own(sim, 'savings')]) setBalance(sim, a, 0);
    drawn(sim);
    press('File It');
    const r = sim.player.returns!['2026']!;
    expect(r.filedAt).toBe(sim.now);
    expect(r.owed).toBe(165_60);
    expect(returnDecision(sim)[0]!.resolvedAt).toBe(sim.now);
    // The bill at filing, and the first reminder five weeks after the due date (from 2026-10-16, `nextNotice`: until
    // then five weeks after filing, 8 March, before the tax was due).
    expect(titled(sim, 'A Bill From The IRS').map((n) => n.at)).toEqual([sim.now]);
    const notices = sim.universe.scheduled.filter((i) => i.kind === 'tax.notice' && i.status === 'pending');
    expect(r.due).toBeGreaterThan(sim.now);
    expect(notices.map((i) => i.at)).toEqual([r.due + 35 * MS_DAY]);
    const kept = reload(sim);
    kept.advanceTo(r.due + 35 * MS_DAY - MS_HOUR);
    expect(titled(kept, 'A Reminder From The IRS')).toEqual([]);
    kept.advanceTo(r.due + 35 * MS_DAY + MS_HOUR);
    expect(titled(kept, 'A Reminder From The IRS')).toHaveLength(1);
    expect(titled(kept, 'A Bill From The IRS')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// n-decision-us-status
// ---------------------------------------------------------------------------

/** The program's end, moved by hand: noon on Thursday 1 April 2027. */
const PROGRAM_END = at(2027, 4, 1, 12);
let optText: string | undefined;
/**
 * A graduate on an F-1 at the moment the clock looks at her status. PLAYER JOURNEY to Wednesday 31 March 2027, then
 * TEST SETUP: the F-1's program end moved to noon on Thursday 1 April (the visa running sixty days past it, as the
 * School's F-1 does) and the degree conferred by the School's own `setStanding`, which schedules the look at her status
 * (`scheduleUsStatus`) as the degree does in a third May; then the clock, a minute past the program's end.
 */
function graduate(): Simulation {
  if (!optText) {
    const sim = londoner('g33-probe-opt');
    sim.advanceTo(at(2027, 3, 31, 12));
    f1Of(sim.player)!.expiresAt = PROGRAM_END + 60 * MS_DAY;
    setStanding(sim, sim.player, 'graduated', 'TEST SETUP: the degree conferred by hand.');
    sim.advanceTo(PROGRAM_END + 60_000);
    optText = serialise(sim.universe);
  }
  return opened(optText);
}
const statusDecision = (sim: Simulation) => Object.values(sim.universe.decisions).filter((d) => d.refType === 'us-status');
const optPermits = (sim: Simulation) => documentsOf(sim.player).filter((d) => d.kind === 'permit' && d.name === 'Employment Authorization, OPT');

describe('n-decision-us-status', () => {
  it('the clock raises “Your US Status Is Ending” at the program’s end, due sixty days on, offering Apply For OPT and then Apply For OPT, Premium Processing, on Home', () => {
    const sim = graduate();
    expect(statusDecision(sim)).toHaveLength(1);
    // Sixty days' grace after a degree (8 CFR 214.2(f)(5)(iv)): Monday 31 May at noon.
    expect(statusDecision(sim)[0]).toMatchObject({
      title: 'Your US Status Is Ending', createdAt: PROGRAM_END, dueAt: at(2027, 5, 31, 12), route: '/workspace/papers',
      detail: 'Your permission to work in the United States has ended, and your status ends May 31, 2027. You can still apply for OPT before then. If you’re still here after that, you’ll be out of status. In the game, that means you can’t work here, your US visa is canceled, and the Visa Waiver Program is closed to you from then on.',
      actions: [{ label: 'Apply For OPT', commandKind: 'documents.apply_opt', payload: {} }, { label: 'Apply For OPT, Premium Processing', commandKind: 'documents.apply_opt', payload: { premium: true } }],
    });
    drawn(sim);
    expect(h.buttons.map((b) => b.text)).toEqual(expect.arrayContaining(['Apply For OPT', 'Apply For OPT, Premium Processing']));
  });

  it('PLAYER JOURNEY: Apply For OPT pressed on Home pays $470 for the I-765 filed online, leaves a permit pending ninety days that holds her status past May 31, and the clock approves it on 30 June for twelve months; once, across a reload', () => {
    const sim = graduate();
    const [d] = statusDecision(sim);
    drawn(sim);
    press('Apply For OPT');
    const fee = memoed(sim, 'Form I-765, (c)(3)(B), OPT');
    expect(fee).toHaveLength(1);
    expect(fromPlayer(sim, fee[0]!)).toBe(-470_00);
    expect(memoed(sim, 'Form I-765, (c)(3)(B), OPT, premium processing')).toHaveLength(0);
    expect(optPermits(sim)).toHaveLength(1);
    // SLATE's ninety days for a standard filing, USCIS publishing none: Wednesday 30 June at a minute past noon.
    expect(optPermits(sim)[0]).toMatchObject({ status: 'pending', appliedAt: PROGRAM_END + 60_000, readyAt: at(2027, 6, 30, 12, 1) });
    expect(d!.resolvedAt).toBe(PROGRAM_END + 60_000);
    expect(openDecisions(sim).filter((x) => x.refType === 'us-status')).toEqual([]);
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: d!.id, actionIndex: 1 } }).error).toBe('That’s been done already.');
    expect(sim.execute({ kind: 'documents.apply_opt', payload: {} }).error).toBe('You’ve already applied for OPT.');
    const kept = reload(sim);
    // Past the status's old end, the application pending holds it.
    kept.advanceTo(at(2027, 6, 1, 12));
    expect(kept.player.usOutOfStatus).toBeUndefined();
    expect(titled(kept, 'Out Of Status')).toEqual([]);
    kept.advanceTo(at(2027, 6, 30, 12, 2));
    expect(optPermits(kept)).toHaveLength(1);
    expect(optPermits(kept)[0]).toMatchObject({ status: 'valid', issuedAt: at(2027, 6, 30, 12, 1), expiresAt: at(2028, 6, 30, 12, 1) });
    expect(titled(kept, 'OPT Approved').map((n) => n.body)).toEqual(['You may work in the United States from June 30, 2027 to June 30, 2028, with no more than 90 days without work in total. The game has no work after the degree, so in practice it ends after those 90 days.']);
    expect(memoed(kept, 'Form I-765, (c)(3)(B), OPT')).toHaveLength(1);
    expect(statusDecision(kept)).toHaveLength(1);
  });

  it('applied for from Papers with documents.apply_opt, the decision is answered at that moment', () => {
    const sim = graduate();
    sim.advanceTo(at(2027, 4, 5, 12));
    const [d] = statusDecision(sim);
    expect(d!.resolvedAt).toBeUndefined();
    sim.must({ kind: 'documents.apply_opt', payload: {} });
    expect(d!.resolvedAt).toBe(at(2027, 4, 5, 12));
    expect(openDecisions(sim).filter((x) => x.refType === 'us-status')).toEqual([]);
    drawn(sim);
    expect(h.buttons.filter((b) => b.text.startsWith('Apply For OPT'))).toEqual([]);
  });

  it('Apply For OPT, Premium Processing pays $2,250 ($470 and $1,780) and is decided in thirty business days, Thursday 13 May, approved by the clock that day', () => {
    const sim = graduate();
    drawn(sim);
    press('Apply For OPT, Premium Processing');
    const fee = memoed(sim, 'Form I-765, (c)(3)(B), OPT, premium processing');
    expect(fee).toHaveLength(1);
    expect(fromPlayer(sim, fee[0]!)).toBe(-2_250_00);
    // From Thursday 1 April, Monday to Friday: April's 21 to the 30th, then 3 to 7 and 10 to 13 May, no federal holiday
    // among them.
    expect(optPermits(sim)[0]).toMatchObject({ status: 'pending', readyAt: at(2027, 5, 13, 12, 1) });
    sim.advanceTo(at(2027, 5, 13, 12, 2));
    expect(optPermits(sim)[0]).toMatchObject({ status: 'valid', issuedAt: at(2027, 5, 13, 12, 1), expiresAt: at(2028, 5, 13, 12, 1) });
  });

  it('PLAYER JOURNEY: an F-1 who withdraws on 1 September 2026 is told of fifteen days’ grace, and is out of status on the sixteenth, her F-1 canceled', () => {
    const sim = londoner('g33-probe-withdraw');
    sim.advanceTo(at(2026, 9, 1, 12));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(titled(sim, 'You Withdrew From The School')[0]!.body).toContain('As an F-1 student you have fifteen days’ grace, and OPT isn’t open to you.');
    sim.advanceTo(at(2026, 9, 17, 12));
    expect(sim.player.usOutOfStatus).toBe(at(2026, 9, 16, 12));
    expect(titled(sim, 'Out Of Status')).toHaveLength(1);
    expect(f1Of(sim.player)!.status).toBe('cancelled');
  });

  // Titled “DEFECT:” until 2026-10-13, when `statusCheckAt` began looking a minute into the grace and this passed.
  it('PLAYER JOURNEY: an F-1 who withdraws is raised “Your US Status Is Ending” in her fifteen days’ grace, due the sixteenth, with nothing to apply for', () => {
    const sim = londoner('g33-probe-withdraw');
    sim.advanceTo(at(2026, 9, 1, 12));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    sim.advanceTo(at(2026, 9, 2, 12));
    // Permission ended with the program at the withdrawal, and the grace began: the check is due now, not at its end.
    expect(statusDecision(sim)).toHaveLength(1);
    expect(statusDecision(sim)[0]).toMatchObject({
      title: 'Your US Status Is Ending', dueAt: at(2026, 9, 16, 12), actions: [],
      detail: 'Your permission to work in the United States has ended, and your status ends September 16, 2026. If you’re still here after that, you’ll be out of status. In the game, that means you can’t work here, your US visa is canceled, and the Visa Waiver Program is closed to you from then on.',
    });
  });
});
