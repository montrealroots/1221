/**
 * The second round of 2026-10-13's evidence, for five rows still partial after the first (batch b02): an appeal's
 * decision, a doctor's appointment, a medical bill falling due, workers' compensation, and hygiene. The first round's
 * tests stand in tests/evidence-g05-life.test.ts and tests/evidence-g06-life.test.ts. This file closes what they, and
 * the check of them, left open: through the command the player gives or the clock that runs the scheduled kind, each
 * consequence read where the row says it's read, against figures worked out here from the rule's own numbers or its
 * published source (BLS's index for physicians' services, CGS 31-295 and 31-307), never from the helper the engine
 * computes them with.
 *
 * - `health.appeal_decided`: Appeal It taken once, and only within 180 days (the twin who waits sees it gone an hour
 *   past the 180th day, and the command refuses in its own words); the uninsured $183.98 a denial bills, worked from
 *   CARE's $100, BLS's 417.930 and 439.389 and the 1.75 markup, where the first round copied it from the notice; paid,
 *   then overturned, the $138.98 back to the account it was paid from and to no other, where the first round asked the
 *   engine's `payeeAccount` which account that was; gone to debt, the decision read by Pay It Off, which pays $183.98
 *   upheld and the $45 share overturned. The outcome is forced each way, so neither branch is skipped as the
 *   `if (outcome === 'overturned')` in tests/claims.test.ts skips one, and the debt is read to the cent where
 *   tests/life-fixes.test.ts reads it only as less than it was.
 * - `health.appointment`: a visit the week books, kept, referred (NAMCS's 9.1%, the draw forced), the specialist booked
 *   AMN's 31 days on, seen, and referring no further, where tests/referrals.test.ts entered through `book()` called
 *   directly. A year of high blood pressure filled thirteen times on a prescription taken as written at its first fill,
 *   which nothing in New Haven reads; renewed by a visit kept; a review kept moving the next to a year after it. All of
 *   it through the appointment's own handler, where tests/defects-g23-1.test.ts called `careFor`, `renewPrescriptions`
 *   and `reviewed` itself. And a visit owed, which swallowed the next one the week drew (a defect, below, fixed).
 * - `health.bill`: an injury's bill, which no test had played to its due date (tests/injury.test.ts counts bills): a
 *   sprain from a workout, uninsured after Withdraw, $699.13 (urgent care's $331.17 and two sessions of physical therapy
 *   at a visit's $183.98), paid from checking 30 days on and Settled on Papers; unpaid in a drained twin, $699.13 of
 *   medical debt, Owed As Debt, and the day's worry it brings at the midnight, 4 of stress and 2 of morale against the
 *   paid twin, where the first round read the worry's reader, `troubles()`, in place of the worry.
 * - `injury.comp`: Connecticut's waiting days through the scheduled kind, which only direct calls had reached until now:
 *   a Resilient student concussed at an elective shift, off six days and paid three, $29.57, against a twin off seven and
 *   paid all seven, $69.00, each to the cent where the first round's journey held the week between two bounds. The
 *   Summer Cabaret's compensation, a week and three days, with the stipend only for the hours not off; and its amount,
 *   which the statute's minimum sets (a defect, below).
 * - `hygiene`: on stage, at the Summer Cabaret's first night, it falls 1.6 an hour, as anywhere awake. model.ts says it
 *   falls twice as fast there (a defect in its words, below).
 *
 * Defects these tests show, each failing as written, each reported with its smallest fix and left for src to make:
 * - The health week dropped a visit it drew while one was owed (health.ts 1350), so a visit called off and not booked
 *   again ended the doctor for good. The test asks only that the week book a doctor, and that seeing one settles it.
 *   From 2026-10-13 the week books the visit owed with the next one it draws, and the test passes.
 * - "A Medical Bill Went Unpaid" for an injury's care reads "a Sprained Ankle: its care": the bill is named for the
 *   injury's notice title, capitals and all (`mayHurt`, injury.ts).
 * - Connecticut's minimum payment is held to 75% of the wage after tax (`compWeekly`, injury.ts), where CGS 31-307(a)
 *   holds it to 75% of the average weekly wage, before deductions. The Summer Cabaret's $375 week pays $252.67 to a
 *   resident and $274.19 to an F-1 student, where it pays $281.25 to both.
 * - model.ts's comment on hygiene says it falls twice as fast on set or on stage (`setGrime`, which exists nowhere in
 *   src) and that rooms notice; the journey shows neither.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, a first-year at Yale in New Haven from
 * Monday 24 August 2026, every personality axis at the middle as the creation screen can set them; born in New York, or
 * in London for the F-1 twin; Resilient where that trait is chosen at creation. The first round's seeds where its lives
 * are played again. Papers is rendered as the player has it (react-dom/server), `useGame`'s `run` the save's own
 * `execute`, a Gated button pressed by its own onClick.
 *
 * TEST SETUP, said again where it's done: a draw forced on one save (the week's illness, a denial, an appeal's outcome,
 * an onset, an injury, a referral), numbers given and a "no" to every chance after them, as the deciders' sweep forces
 * one; a reloaded save draws its own. Money moved by postings against a test line: a bank drained, or funded. August's
 * pay recorded, so the marketplace and not HUSKY D is offered. The Summer Cabaret's good standing, which an idle year's
 * clock leaves at concern, with no coursework turned in.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Personality } from '@/engine/domain/model';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { APPEAL_KIND, HEALTH_MONTH_KIND, HEALTH_WEEK_KIND, coverOn, healthOf, keptUp, medicalDebtOf } from '@/engine/systems/health';
import { APPOINTMENT_KIND, appointmentsOf } from '@/engine/systems/appointments';
import { COMP_KIND } from '@/engine/systems/injury';
import { recordWages } from '@/engine/systems/earnings';
import { overdraftRoom } from '@/engine/systems/lending';
import { troubles } from '@/engine/systems/spending';
import { SUMMER_KIND } from '@/engine/systems/school';
import { nonresidentFor } from '@/engine/systems/taxreturn';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
  toasts: [] as string[],
  buttons: [] as { feature: string; onClick?: (e: never) => void }[],
}));

// The screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A Gated button drawn as it is, its feature and onClick kept so a test can press it as the player would.
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.buttons.push({ feature: props.feature, onClick: props.onClick as never });
      return real.Gated(props);
    },
  };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

// ---------------------------------------------------------------------------
// Lives, the clock, and the screen over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const MIDDLE: Personality = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 };
const student = (seed: string, more: { traits?: string[]; home?: string } = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: more.home ?? 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personality: MIDDLE, personalityTraits: more.traits ?? [] });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/**
 * TEST SETUP: draws forced on one save, as the deciders' sweep forces one: a stream's numbers for one key, or for every
 * key, given in order, and then 0.999, a "no" to every chance after them. A reloaded save draws its own again.
 */
function forcing(sim: Simulation): (stream: string, key: (string | number)[] | null, values: number[]) => void {
  const forced = new Map<string, number[]>();
  const real = sim.rng.bind(sim);
  const rng = (stream: string, ...keys: (string | number)[]) => {
    const values = forced.get([stream, ...keys].join('|')) ?? forced.get(stream);
    const drawn = real(stream, ...keys);
    if (!values) return drawn;
    let i = 0;
    return { ...drawn, next: () => values[i++] ?? 0.999 };
  };
  Object.assign(sim, { rng });
  return (stream, key, values) => { forced.set(key ? [stream, ...key].join('|') : stream, values); };
}
/** The week's draw in `illnessWeek`'s order: a stay, an emergency, a visit. */
const WEEK = { stay: [0], visit: [0.999, 0.999, 0] } as const;
const forceWeek = (sim: Simulation, force: ReturnType<typeof forcing>, week: number, draw: readonly number[]) => force('health.illness', [sim.player.id, String(week)], [...draw]);

const nextPending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[0]!;
const titled = (sim: Simulation, title: string, from = 0) => sim.universe.notifications.filter((n) => n.title === title && n.at >= from);
const memos = (sim: Simulation, memo: string | RegExp) => sim.universe.transactions.filter((t) => (typeof memo === 'string' ? t.memo === memo : memo.test(t.memo)));
/** What a transaction moved into one account (negative out of it). */
const into = (t: { postings: { accountId: string; amount: number }[] }, accountId: string) => t.postings.filter((p) => p.accountId === accountId).reduce((s, p) => s + p.amount, 0);
/** The player's own accounts a transaction moved, and by how much. */
const ownMoved = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).map((p) => [p.accountId, p.amount] as const);
const checking = (sim: Simulation) => sim.player.primaryAccountId!;

/** TEST SETUP: every current and savings account emptied, and the current account's overdraft drawn to its limit, by postings. */
function broke(sim: Simulation): void {
  const test = sim.nominalAccount('expense', 'Test').id;
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.closedAt || !(a.kind === 'checking' || a.kind === 'savings') || a.balance <= 0) continue;
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: test, amount: a.balance }] });
  }
  const current = sim.universe.accounts[checking(sim)]!;
  const room = overdraftRoom(sim, sim.player, current) - Math.max(0, -current.balance);
  if (room > 0) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: current.id, amount: -room }, { accountId: test, amount: room }] });
}
/** TEST SETUP: money into the current account, enough over what it's overdrawn that it holds the amount. */
function fund(sim: Simulation, amount: number): void {
  const current = sim.universe.accounts[checking(sim)]!;
  const deposit = amount + Math.max(0, -current.balance);
  sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: current.id, amount: deposit }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -deposit }] });
}

/** Withdraw, on Tuesday 25 August 2026, after orientation's registration: in the first fifteen days, so Yale Health ends. */
function withdraw(sim: Simulation): void {
  sim.advanceTo(at(2026, 8, 25, 12));
  expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
  expect(coverOn(sim.player, sim.now)).toBeUndefined();
}

/** The clock moved an hour at a time, as One Hour moves it with the player there, so no night is slept that wasn't chosen. */
function byTheHour(sim: Simulation, until: number): void {
  while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + MS_HOUR));
}

/** What the player reads: the markup's text with the tags taken out. */
const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
/** Papers as the player has it, on its Health Cover tab. */
function drawn(sim: Simulation): { html: string; text: string } {
  h.sim = sim;
  h.tabs = { 'tab:/workspace/papers': 'health' };
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(PapersWorkspace)).replace(/<!-- -->/g, '');
  return { html, text: textOf(html) };
}
/** A Gated button pressed, as the player presses it: what it toasted. */
function press(feature: string): string[] {
  const b = h.buttons.find((x) => x.feature === feature);
  expect(b, `a ${feature} button`).toBeDefined();
  h.toasts = [];
  b!.onClick!(undefined as never);
  return h.toasts;
}
const pressable = (feature: string) => h.buttons.some((x) => x.feature === feature);
/** The row of Papers' Care And Its Bills for a bill had on a day, by a word of what it was. */
function billRow(sim: Simulation, word: string, when: number): string {
  const rows = (drawn(sim).html.match(/<tr>.*?<\/tr>/g) ?? []).map(textOf).filter((r) => r.includes(formatDate(when, NY)) && r.toLowerCase().includes(word.toLowerCase()));
  expect(rows, `one row for ${word} on ${formatDate(when, NY)}`).toHaveLength(1);
  return rows[0]!;
}

/**
 * Prices worked out here from their sources, not by the engine: CARE's commercial $100 a doctor's visit and $180 urgent
 * care (measured in 2024), each grown by BLS's index for physicians' services (CUUR0000SEMC01) from its 2024 level,
 * 417.930, to 2026's, 439.389, to the cent; and the 1.75 the uninsured are billed over them.
 */
const grown2026 = (cents: number) => Math.round((cents * 439.389) / 417.93);
const UNINSURED_VISIT = Math.round(grown2026(100_00) * 1.75);
const UNINSURED_URGENT = Math.round(grown2026(180_00) * 1.75);

// ---------------------------------------------------------------------------
// health.appeal_decided
// ---------------------------------------------------------------------------

/** Access Health CT Standard Silver's 2026 copay for a doctor's visit. */
const SHARE = 45_00;
const CLINIC = 'Fair Haven Community Health Care';

/**
 * PLAYER JOURNEY: withdrawn, uninsured from 1 September, enrolled through Papers' Enroll in the marketplace from
 * 1 October; the first week after it draws a visit (TEST SETUP: forced), booked for New Haven's 24 days; kept, its claim
 * denied (TEST SETUP: forced). Not yet appealed.
 */
function deniedOnTheMarketplace() {
  const sim = student('g05-upheld');
  const force = forcing(sim);
  withdraw(sim);
  // TEST SETUP: August's pay, $3,000, over Covered Connecticut's 175% of the poverty line a month, so the marketplace
  // is what's offered and not HUSKY D.
  recordWages(sim.player, at(2026, 8, 28, 17), NY, { gross: 3_000_00, employer: 'b02-summer-job' });
  sim.advanceTo(at(2026, 9, 1, 8));
  drawn(sim);
  expect(press('health.enroll')).toEqual(['Enrolled in the marketplace, from October 1, 2026.']);
  sim.advanceTo(at(2026, 10, 1, 8));
  expect(coverOn(sim.player, sim.now)).toBe('marketplace');
  const week = nextPending(sim, HEALTH_WEEK_KIND);
  expect(week.at).toBe(at(2026, 10, 5, 9));
  forceWeek(sim, force, week.at, WEEK.visit); // TEST SETUP: the week's draw forced to a visit
  force('health.denial', null, [0]); // TEST SETUP: the claim's draw forced to a denial
  sim.advanceTo(week.at + MS_HOUR);
  const visit = appointmentsOf(sim.player)[0]!;
  expect(visit.at).toBe(at(2026, 10, 29, 10));
  sim.advanceTo(visit.at + MS_HOUR);
  const bill = healthOf(sim.player).bills.find((b) => b.at === visit.at)!;
  expect(bill).toMatchObject({ what: `A doctor’s visit, ${CLINIC}`, dueAt: visit.at + 30 * MS_DAY, denied: { share: SHARE } });
  // The uninsured price, from the index and the markup, not from the engine.
  expect(bill.amount).toBe(UNINSURED_VISIT);
  return { sim, bill, force };
}
/** Appeal It pressed on Papers: the decision's instant. */
function appealed(sim: Simulation): number {
  drawn(sim);
  expect(press('health.appeal')).toEqual(['Appealed: decided in 60 days.']);
  return nextPending(sim, APPEAL_KIND).at;
}
const appealWon = (sim: Simulation) => memos(sim, /^Appeal won: /);
const billPaid = (sim: Simulation) => memos(sim, /^Medical bill: A doctor’s visit/);

describe('health.appeal_decided', () => {
  it('PLAYER JOURNEY: an appeal is taken once and within 180 days, and decided 60 days on; the 180th day is the last', () => {
    const { sim, bill } = deniedOnTheMarketplace();
    expect(UNINSURED_VISIT).toBe(183_98);
    // A claim not denied, or no claim, can't be appealed.
    expect(sim.execute({ kind: 'health.appeal', payload: { billId: 'no-such-bill' } }).error).toBe('That claim wasn’t denied.');
    // The twin who waits: Appeal It is there an hour before the 180th day is out, and gone an hour after it.
    const late = reload(sim);
    late.advanceTo(bill.at + 180 * MS_DAY - MS_HOUR);
    expect(billRow(late, 'Visit', bill.at)).toContain('$183.98 Settled Appeal It');
    expect(pressable('health.appeal')).toBe(true);
    late.advanceTo(bill.at + 180 * MS_DAY + MS_HOUR);
    expect(billRow(late, 'Visit', bill.at)).toContain('$183.98 Settled Denied');
    expect(pressable('health.appeal')).toBe(false);
    expect(late.execute({ kind: 'health.appeal', payload: { billId: bill.id } }).error).toBe('An appeal is filed within 180 days of the denial.');
    expect(late.universe.scheduled.some((i) => i.kind === APPEAL_KIND)).toBe(false);
    // Appealed the day of the visit: decided 60 days on, and not twice.
    const decidedAt = appealed(sim);
    expect(decidedAt).toBe(sim.now + 60 * MS_DAY);
    expect(sim.execute({ kind: 'health.appeal', payload: { billId: bill.id } }).error).toBe('It’s been appealed.');
    expect(billRow(sim, 'Visit', bill.at)).toContain('$183.98 November 28, 2026 Appealed');
    expect(pressable('health.appeal')).toBe(false);
    expect(sim.universe.scheduled.filter((i) => i.kind === APPEAL_KIND)).toHaveLength(1);
  });

  it('PLAYER JOURNEY: paid, then overturned, gives the $138.98 paid over the share back to the account it was paid from, and nothing to any other', () => {
    const { sim, bill, force } = deniedOnTheMarketplace();
    const decidedAt = appealed(sim);
    sim.advanceTo(bill.dueAt + MS_HOUR);
    // Paid from the account the player pays from: their own current account.
    expect(billPaid(sim)).toHaveLength(1);
    const paidFrom = ownMoved(sim, billPaid(sim)[0]!);
    expect(paidFrom).toHaveLength(1);
    const [from, out] = paidFrom[0]!;
    expect(out).toBe(-183_98);
    expect(sim.universe.accounts[from]!.kind).toBe('checking');
    force('health.appeal', null, [0.99]); // TEST SETUP: the decision's draw forced to overturn
    sim.advanceTo(decidedAt + MS_HOUR);
    expect(bill.denied!.outcome).toBe('overturned');
    expect(appealWon(sim)).toHaveLength(1);
    // $183.98 less the $45 share, back where it came from, and into no other account of theirs.
    expect(ownMoved(sim, appealWon(sim)[0]!)).toEqual([[from, 138_98]]);
    expect(bill.amount).toBe(45_00);
    expect(billRow(sim, 'Visit', bill.at)).toContain('$45.00 Settled Denial Overturned');
    expect(titled(sim, 'Appeal Won').map((n) => n.body)).toEqual([`The plan reversed its denial for a doctor’s visit, ${CLINIC}: you owe its share, $45.00.`]);
  });

  it('PLAYER JOURNEY: gone to debt, the decision is what Pay It Off pays: upheld, all $183.98; overturned, the $45 share', () => {
    const twin = (overturn: boolean) => {
      const { sim, bill, force } = deniedOnTheMarketplace();
      const decidedAt = appealed(sim);
      sim.advanceTo(bill.dueAt - MS_HOUR);
      broke(sim); // TEST SETUP
      sim.advanceTo(bill.dueAt + MS_HOUR);
      expect(bill.inDebt).toBe(true);
      expect(medicalDebtOf(sim, sim.player)!.balance).toBe(-183_98);
      force('health.appeal', null, [overturn ? 0.99 : 0]); // TEST SETUP: the decision's draw forced
      sim.advanceTo(decidedAt + MS_HOUR);
      const row = billRow(sim, 'Visit', bill.at);
      fund(sim, 300_00); // TEST SETUP
      drawn(sim);
      expect(press('health.pay_bill')).toEqual(['Paid off.']);
      const paid = memos(sim, 'Paid toward medical debt');
      expect(paid).toHaveLength(1);
      return { sim, bill, row, paid: into(paid[0]!, checking(sim)) };
    };
    const upheld = twin(false);
    expect(upheld.bill.denied!.outcome).toBe('upheld');
    expect(upheld.row).toContain('$183.98 Owed As Debt Denial Upheld');
    expect(appealWon(upheld.sim)).toEqual([]);
    expect(titled(upheld.sim, 'Appeal Upheld').map((n) => n.body)).toEqual([`The plan kept its denial for a doctor’s visit, ${CLINIC}.`]);
    expect(upheld.paid).toBe(-183_98);

    const overturned = twin(true);
    expect(overturned.bill.denied!.outcome).toBe('overturned');
    expect(overturned.row).toContain('$45.00 Owed As Debt Denial Overturned');
    expect(overturned.paid).toBe(-45_00);
    // Paid off, both bills are settled and nothing is owed.
    for (const { sim, bill } of [upheld, overturned]) {
      expect(bill.paid).toBe(true);
      expect(bill.inDebt).toBeUndefined();
      expect(medicalDebtOf(sim, sim.player)!.balance).toBe(0);
      expect(billRow(sim, 'Visit', bill.at)).toMatch(/Settled Denial (Upheld|Overturned)/);
    }
  });
});

// ---------------------------------------------------------------------------
// health.appointment
// ---------------------------------------------------------------------------

const VISIT = 'A doctor’s visit';
const SPECIALIST = 'A specialist, referred';
const REVIEW = 'A review of your high blood pressure';
const visitsLogged = (sim: Simulation) => (healthOf(sim.player).careLog ?? []).filter((c) => c.care === 'visit');

describe('health.appointment', () => {
  it('PLAYER JOURNEY: a visit the week books, kept, ends in a referral, a specialist booked 31 days on, seen, and referring no further', () => {
    const sim = student('g05-upheld');
    const force = forcing(sim);
    sim.advanceTo(at(2026, 9, 6, 12));
    const week = nextPending(sim, HEALTH_WEEK_KIND);
    expect(week.at).toBe(at(2026, 9, 7, 9));
    forceWeek(sim, force, week.at, WEEK.visit); // TEST SETUP: the week's draw forced to a visit
    force('health.referral', null, [0]); // TEST SETUP: every visit's referral draw forced to refer
    sim.advanceTo(week.at + MS_HOUR);
    const visit = appointmentsOf(sim.player)[0]!;
    expect(visit).toMatchObject({ what: VISIT, at: at(2026, 10, 1, 10) });
    sim.advanceTo(visit.at + MS_HOUR);
    // Kept: the visit, and NAMCS's referral, the specialist seen after AMN's 31 days: Sunday 1 November, so Monday the 2nd.
    expect(visitsLogged(sim).map((c) => c.at)).toEqual([visit.at]);
    const specialist = appointmentsOf(sim.player);
    expect(specialist.map((a) => [a.what, a.at])).toEqual([[SPECIALIST, at(2026, 11, 2, 10)]]);
    expect(titled(sim, 'A Referral').map((n) => n.body)).toEqual(['Referred after a doctor’s visit: a specialist, booked for November 2, 2026, the wait where you live.']);
    expect(drawn(sim).text).toContain(`${SPECIALIST}: an appointment November 2, 2026, ${CLINIC} Call It Off`);
    // Seen, and a specialist refers no further, though the draw is still forced to.
    sim.advanceTo(at(2026, 11, 2, 11));
    expect(visitsLogged(sim).map((c) => [c.at, c.what])).toEqual([[visit.at, `${VISIT}, ${CLINIC}`], [at(2026, 11, 2, 10), `${SPECIALIST}, ${CLINIC}`]]);
    expect(appointmentsOf(sim.player)).toEqual([]);
    expect(titled(sim, 'A Referral')).toHaveLength(1);
    expect(sim.universe.scheduled.filter((i) => i.kind === APPOINTMENT_KIND).map((i) => i.status)).toEqual(['done', 'done']);
  });

  it('PLAYER JOURNEY: in New Haven a prescription a year old is filled all the same; a visit kept renews it, and a review kept moves the next one to a year after it', () => {
    const sim = student('g05-flu');
    const force = forcing(sim);
    sim.advanceTo(at(2026, 8, 26, 12));
    sim.must({ kind: 'health.choose_pharmacy', payload: { chain: 'walmart' } });
    const month = nextPending(sim, HEALTH_MONTH_KIND);
    expect(month.at).toBe(at(2026, 9, 1, 0, 30));
    force('health.onset', [sim.player.id, String(month.at)], [0.999, 0]); // TEST SETUP: high blood pressure diagnosed
    sim.advanceTo(month.at + MS_HOUR);
    const bp = () => healthOf(sim.player).chronic!.hypertension!;
    expect(bp().since).toBe(month.at);
    // The prescription is taken as written at the first fill, Monday 7 September 2026, and nothing renews it for a year:
    // the medicine is filled every four or five weeks all the same, thirteen times to Monday 30 August 2027. In British
    // Columbia a year-old prescription isn't filled (`RX.validYears`); in Connecticut nothing reads its date.
    sim.advanceTo(at(2027, 9, 2, 9));
    expect(bp().prescribedAt).toBe(at(2026, 9, 7, 9));
    const fills = memos(sim, 'Medicine for high blood pressure');
    expect(fills).toHaveLength(13);
    expect([fills[0]!.at, fills.at(-1)!.at]).toEqual([at(2026, 9, 7, 9), at(2027, 8, 30, 9)]);
    expect(keptUp(bp(), sim.now)).toBe(true);
    // The seed's own visit, drawn by the week of 9 August and kept at ten on 2 September, writes it, and reviews nothing.
    expect(appointmentsOf(sim.player).map((a) => [a.what, a.at])).toEqual([[VISIT, at(2027, 9, 2, 10)]]);
    sim.advanceTo(at(2027, 9, 2, 11));
    expect(bp().prescribedAt).toBe(at(2027, 9, 2, 10));
    expect(bp().reviewedAt).toBe(month.at);
    // REVIEW_MONTHS: twelve months of 30.44 days (365.28) from the diagnosis is 7:13 AM on Wednesday 1 September 2027;
    // the Monday after, 6 September, books it for New Haven's 24 days, Thursday the 30th.
    expect(appointmentsOf(sim.player)).toEqual([]);
    sim.advanceTo(at(2027, 9, 6, 10));
    const review = appointmentsOf(sim.player)[0]!;
    expect(review).toMatchObject({ what: REVIEW, at: at(2027, 9, 30, 10) });
    sim.advanceTo(review.at + MS_HOUR);
    expect(bp().reviewedAt).toBe(review.at);
    expect(bp().prescribedAt).toBe(review.at);
    // The next review reads the one kept: 365.28 days from ten on 30 September 2027 is 4:43 PM on Friday
    // 29 September 2028 (a leap year's 366 days to the 30th), so none is booked or had before then, and the Monday after, 2 October, books it for the 26th.
    const reviews = () => visitsLogged(sim).filter((c) => c.what.startsWith(REVIEW)).map((c) => c.at);
    sim.advanceTo(at(2028, 9, 25, 10));
    expect(reviews()).toEqual([review.at]);
    expect(appointmentsOf(sim.player).filter((a) => a.what === REVIEW)).toEqual([]);
    sim.advanceTo(at(2028, 10, 2, 10));
    expect(appointmentsOf(sim.player).filter((a) => a.what === REVIEW).map((a) => a.at)).toEqual([at(2028, 10, 26, 10)]);
  });

  it('a visit owed and never booked again doesn’t swallow the next one the week draws: that week books a doctor', () => {
    const sim = student('g05-bill');
    const force = forcing(sim);
    sim.advanceTo(at(2026, 9, 6, 12));
    forceWeek(sim, force, at(2026, 9, 7, 9), WEEK.visit); // TEST SETUP: the week's draw forced to a visit
    sim.advanceTo(at(2026, 9, 11, 12));
    const first = appointmentsOf(sim.player)[0]!;
    expect(first.at).toBe(at(2026, 10, 1, 10));
    // Called off on Papers, and not booked again.
    sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: first.id } });
    expect(healthOf(sim.player).owedVisit).toBe(VISIT);
    // The next Monday draws another (TEST SETUP: forced): a doctor is booked for it, 24 days on, Thursday 8 October.
    forceWeek(sim, force, at(2026, 9, 14, 9), WEEK.visit); // TEST SETUP
    sim.advanceTo(at(2026, 9, 14, 10));
    expect(appointmentsOf(sim.player).map((a) => a.at)).toEqual([at(2026, 10, 8, 10)]);
    sim.advanceTo(at(2026, 10, 8, 11));
    expect(visitsLogged(sim).map((c) => c.at)).toEqual([at(2026, 10, 8, 10)]);
    expect(healthOf(sim.player).owedVisit).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// health.bill
// ---------------------------------------------------------------------------

/** A sprained ankle's care uninsured: urgent care and two sessions of physical therapy at a visit's price. */
const SPRAIN_CARE = UNINSURED_URGENT + 2 * UNINSURED_VISIT;
/** What the bill is for, in either case: the defect below is its capitals. */
const SPRAIN_BILL = /^A sprained ankle: its care$/i;

/**
 * PLAYER JOURNEY: withdrawn, uninsured from 1 September; a workout at eight on Wednesday 2 September through Look After
 * Yourself, and a sprain from it (TEST SETUP: the workout's own injury draw forced, a sprain, five days), billed at its
 * care's uninsured price, due 30 days on. Kept as a save at 7 AM on the day it falls due.
 */
let sprainSave: string | undefined;
function sprainBilled(): Simulation {
  if (!sprainSave) {
    const sim = student('g05-bill');
    const force = forcing(sim);
    withdraw(sim);
    sim.advanceTo(at(2026, 9, 2, 8));
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    const ends = sim.now + MS_HOUR;
    force('health.injury', [sim.player.id, `run-${ends}`], [0, 0.7, 0]); // TEST SETUP: a run's mix, strain 0.5 then sprain 0.4
    force('health.injury', [sim.player.id, `gym-${ends}`], [0, 0.95, 0]); // TEST SETUP: a gym's, strain 0.5, back 0.4, then sprain
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    expect(healthOf(sim.player).injury).toMatchObject({ kind: 'sprain', at: ends, until: ends + 5 * MS_DAY });
    const bill = healthOf(sim.player).bills.find((b) => b.at === ends)!;
    expect(bill.what).toMatch(SPRAIN_BILL);
    expect(bill.dueAt).toBe(ends + 30 * MS_DAY);
    expect(titled(sim, 'A Sprained Ankle').map((n) => n.body)).toEqual(['5 days to mend. Its care comes to $699.13, due in 30 days.']);
    sim.advanceTo(bill.dueAt - 2 * MS_HOUR);
    expect(bill.paid).toBeFalsy();
    sprainSave = serialise(sim.universe);
  }
  return loadSave(deserialise(sprainSave) as never);
}
const sprainBill = (sim: Simulation) => healthOf(sim.player).bills.find((b) => SPRAIN_BILL.test(b.what))!;

describe('health.bill', () => {
  it('PLAYER JOURNEY: a sprain’s $699.13 of care, uninsured, falls due 30 days on and is paid from the checking account, Settled on Papers', () => {
    const sim = sprainBilled();
    const bill = sprainBill(sim);
    expect(SPRAIN_CARE).toBe(699_13);
    expect(bill.amount).toBe(SPRAIN_CARE);
    expect(billRow(sim, 'Sprained', bill.at)).toContain('$699.13 October 2, 2026');
    sim.advanceTo(bill.dueAt + MS_HOUR);
    expect(bill.paid).toBe(true);
    const paid = memos(sim, /^Medical bill: A sprained ankle: its care$/i);
    expect(paid.map((t) => [t.at, into(t, checking(sim)), into(t, sim.nominalAccount('expense', 'Medical Care').id)])).toEqual([[bill.dueAt, -699_13, 699_13]]);
    expect(medicalDebtOf(sim, sim.player)).toBeUndefined();
    expect(billRow(sim, 'Sprained', bill.at)).toContain('$699.13 Settled');
    expect(titled(sim, 'A Medical Bill Went Unpaid')).toEqual([]);
  });

  it('PLAYER JOURNEY: unpaid in a drained twin, the sprain’s care is $699.13 of medical debt and Owed As Debt, and the midnight’s worry costs 4 of stress and 2 of morale against the paid twin', () => {
    const [owing, paying] = [sprainBilled(), sprainBilled()];
    const bill = sprainBill(owing);
    broke(owing); // TEST SETUP
    for (const sim of [owing, paying]) sim.advanceTo(bill.dueAt + MS_HOUR);
    expect(sprainBill(owing).inDebt).toBe(true);
    expect(sprainBill(paying).paid).toBe(true);
    expect(medicalDebtOf(owing, owing.player)).toMatchObject({ name: 'Owed For Medical Care', balance: -699_13 });
    expect(healthOf(owing.player).debtSince).toBe(bill.dueAt);
    expect(billRow(owing, 'Sprained', bill.at)).toContain('$699.13 Owed As Debt');
    expect(drawn(owing).text).toContain('Medical Debt $699.13');
    // TEST SETUP: money back in the current account, so the medical debt is the only trouble left.
    fund(owing, 1_000_00);
    expect(troubles(owing, owing.player)).toEqual([{ kind: 'medical', amount: 699_13 }]);
    expect(troubles(paying, paying.player)).toEqual([]);
    // Both kept up through the midnight, an hour at a time: the day's worry is the debt's.
    for (const sim of [owing, paying]) byTheHour(sim, at(2026, 10, 2, 23, 59));
    const before = [{ ...owing.player.wellbeing }, { ...paying.player.wellbeing }];
    for (const sim of [owing, paying]) byTheHour(sim, at(2026, 10, 3, 0, 1));
    const jump = (sim: Simulation, i: number) => ({ stress: sim.player.wellbeing.stress - before[i]!.stress, morale: sim.player.wellbeing.morale - before[i]!.morale });
    expect(jump(owing, 0).stress - jump(paying, 1).stress).toBeCloseTo(4, 9);
    expect(jump(owing, 0).morale - jump(paying, 1).morale).toBeCloseTo(-2, 9);
  });

  it('A Medical Bill Went Unpaid says what the injury was in the sentence’s own case', () => {
    const sim = sprainBilled();
    broke(sim); // TEST SETUP
    sim.advanceTo(sprainBill(sim).dueAt + MS_HOUR);
    expect(titled(sim, 'A Medical Bill Went Unpaid').map((n) => n.body)).toEqual(['$699.13 for a sprained ankle: its care is a medical debt now.']);
  });
});

// ---------------------------------------------------------------------------
// injury.comp
// ---------------------------------------------------------------------------

/**
 * PLAYER JOURNEY: a Resilient student (the trait chosen at creation) at an elective evening front of house at Yale Rep,
 * Tuesday 1 September 2026, the first work of its week, $92 for four hours at $23; a fall there (TEST SETUP: the draw
 * forced to a concussion, and its days).
 */
function concussedAtAShift(daysDraw: number) {
  const sim = student('g05-comp', { traits: ['resilient'] });
  const force = forcing(sim);
  sim.advanceTo(at(2026, 8, 31, 12));
  const shift = sim.must<{ at: number; hours: number }>({ kind: 'school.take_shift', payload: {} });
  expect(shift).toEqual({ at: at(2026, 9, 1, 19), hours: 4 });
  force('health.injury', [sim.player.id, `usher-${shift.at}`], [0, 0.99, daysDraw]); // TEST SETUP: usher's mix, past sprain, bruise and fracture
  sim.advanceTo(shift.at + 5 * MS_HOUR);
  const injury = healthOf(sim.player).injury!;
  expect(injury).toMatchObject({ kind: 'concussion', at: shift.at, atWork: { stateId: 'us-ct', weeklyWage: 92_00 } });
  sim.advanceTo(shift.at + 15 * MS_DAY);
  return { sim, injury, shift };
}
const comp = (sim: Simulation) => memos(sim, 'Workers’ compensation');

/**
 * PLAYER JOURNEY: the Summer Cabaret of 2027, joined in the spring (TEST SETUP: good standing, which an idle year's
 * clock leaves at concern, with no coursework turned in); its first call, a rehearsal at one on Friday 4 June, and a
 * concussion there (TEST SETUP: the call's injury draw forced, the stage's mix past sprain, strain and back, ten days).
 * Kept as a save after the command; each test loads its own.
 */
const cabaretSaves = new Map<string, string>();
function cabaretLife(home: string): Simulation {
  if (!cabaretSaves.has(home)) {
    const sim = student('b02-cabaret', { home });
    sim.advanceTo(at(2027, 4, 20, 12));
    sim.player.school!.standing = 'good'; // TEST SETUP
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    cabaretSaves.set(home, serialise(sim.universe));
  }
  return loadSave(deserialise(cabaretSaves.get(home)!) as never);
}
function concussedOnStage(home: string) {
  const sim = cabaretLife(home);
  const force = forcing(sim);
  const call = nextPending(sim, SUMMER_KIND);
  expect(call.at).toBe(at(2027, 6, 4, 13));
  force('health.injury', [sim.player.id, `stage-${call.at}`], [0, 0.92, 0]); // TEST SETUP
  sim.advanceTo(call.at + MS_HOUR);
  const injury = healthOf(sim.player).injury!;
  expect(injury).toMatchObject({ kind: 'concussion', at: call.at, offWorkUntil: call.at + 10 * MS_DAY, atWork: { stateId: 'us-ct', weeklyWage: 375_00 } });
  sim.advanceTo(at(2027, 6, 18, 18));
  return { sim, injury };
}
const wagesOn = (sim: Simulation, when: number) => memos(sim, 'Yale Summer Cabaret stipend, the week').filter((t) => t.at === when).reduce((s, t) => s - into(t, sim.nominalAccount('income', 'Wages').id), 0);

describe('injury.comp', () => {
  it('PLAYER JOURNEY: off six days, the first three are Connecticut’s waiting days and three are paid, $29.57; off seven, all seven are, $69.00', () => {
    const six = concussedAtAShift(0);
    const seven = concussedAtAShift(0.1);
    // Resilient mends the concussion’s ten days in six, or seven a little further into its range.
    expect(six.injury.offWorkUntil).toBe(six.shift.at + 6 * MS_DAY);
    expect(seven.injury.offWorkUntil).toBe(seven.shift.at + 7 * MS_DAY);
    // A week of $92 is paid 75% of the whole, Connecticut’s least for it. Until 2026-10-13 the notice said “75% of your
    // week’s wage after tax”, which it wasn’t, and this test held that.
    expect(titled(six.sim, 'A Concussion').map((n) => n.body)).toEqual(['6 days to mend, and off work for them. It happened at work, so workers’ compensation pays the care and 75% of your week’s wage while you’re off.']);
    // CGS 31-295(a): more than three days but less than seven, paid from the fourth; seven, from the first. A week’s rate
    // is 75% of the $92, with no tax or FICA deducted from it; a day’s a seventh of that.
    expect(comp(six.sim).map((t) => [t.at, into(t, checking(six.sim))])).toEqual([[six.shift.at + 7 * MS_DAY, Math.round((0.75 * 92_00 * 3) / 7)]]);
    expect(comp(seven.sim).map((t) => [t.at, into(t, checking(seven.sim))])).toEqual([[seven.shift.at + 7 * MS_DAY, 69_00]]);
    expect(Math.round((0.75 * 92_00 * 3) / 7)).toBe(29_57);
    expect(healthOf(six.sim.player).injury!.atWork!.paidDays).toBe(3);
    expect(healthOf(seven.sim.player).injury!.atWork!.paidDays).toBe(7);
    for (const { sim } of [six, seven]) expect(sim.universe.scheduled.some((i) => i.kind === COMP_KIND && i.status === 'pending')).toBe(false);
  });

  it('PLAYER JOURNEY: concussed at the Summer Cabaret’s first call, paid a week and three days’ compensation, and the stipend only for the days not off', () => {
    const { sim, injury } = concussedOnStage('us-ny-newyork');
    // The $375 week is paid 75% of the whole, Connecticut’s least for it, $281.25. Until 2026-10-13 the notice said “75%
    // of your week’s wage after tax”, which it wasn’t, and this test held that.
    expect(titled(sim, 'A Concussion').map((n) => n.body)).toEqual(['10 days to mend, and off work for them. It happened at work, so workers’ compensation pays the care and 75% of your week’s wage while you’re off.']);
    // Paid at a week, and at the tenth day for the three after it: three sevenths of the week’s.
    const paid = comp(sim);
    expect(paid.map((t) => t.at)).toEqual([injury.at + 7 * MS_DAY, injury.at + 10 * MS_DAY]);
    const [week, rest] = paid.map((t) => into(t, checking(sim)));
    expect(rest).toBe(Math.round((week! * 3) / 7));
    expect(paid.map((t) => into(t, sim.nominalAccount('income', 'Workers’ Compensation').id))).toEqual([-week!, -rest!]);
    // The stipend, $375 a Friday at five, less the hours of its week kept off: four of the first (one to five on the
    // 4th), all of the second, and 68 of the third (Friday the 11th at five to Monday the 14th at one).
    expect(wagesOn(sim, at(2027, 6, 4, 17))).toBe(Math.round(375_00 * (1 - 4 / 168)));
    expect(wagesOn(sim, at(2027, 6, 11, 17))).toBe(0);
    expect(wagesOn(sim, at(2027, 6, 18, 17))).toBe(Math.round(375_00 * (1 - 68 / 168)));
    expect(sim.universe.scheduled.some((i) => i.kind === COMP_KIND && i.status === 'pending')).toBe(false);
    expect(sim.player.school!.summer!.out).toBeFalsy();
  });

  it('the Summer Cabaret’s $375 week is paid Connecticut’s minimum, 75% of it, $281.25, to a resident and to an F-1 student alike', () => {
    // CGS 31-307(a): no less than 20% of the maximum, $1,776 × 0.2 = $355.20, "provided the minimum payment shall not
    // exceed seventy-five per cent of the employee's average weekly wage" (31-310's, before deductions): $281.25.
    const floor = Math.min(Math.round(1_776_00 * 0.2), Math.round(0.75 * 375_00));
    expect(floor).toBe(281_25);
    const resident = concussedOnStage('us-ny-newyork');
    const f1 = concussedOnStage('uk-eng-london');
    expect([nonresidentFor(resident.sim.player, 2027), nonresidentFor(f1.sim.player, 2027)]).toEqual([false, true]);
    // A week, and the three days after it, to each.
    const paid = [resident, f1].map(({ sim }) => comp(sim).map((t) => into(t, checking(sim))));
    expect(paid).toEqual([[floor, Math.round((floor * 3) / 7)], [floor, Math.round((floor * 3) / 7)]]);
  });
});

// ---------------------------------------------------------------------------
// hygiene
// ---------------------------------------------------------------------------

describe('hygiene', () => {
  it('PLAYER JOURNEY: on stage, at the Summer Cabaret’s first night, it falls 1.6 an hour as it does anywhere awake, not twice that', () => {
    const sim = cabaretLife('us-ny-newyork');
    const night = at(2027, 6, 25, 20);
    sim.advanceTo(night - 2 * MS_HOUR);
    byTheHour(sim, night);
    const call = sim.universe.scheduled.find((i) => i.kind === SUMMER_KIND && i.at === night)!;
    expect(call.payload.call).toBe('performance');
    const start = sim.player.wellbeing.hygiene;
    expect(start).toBeGreaterThan(50);
    byTheHour(sim, night + 150 * 60_000);
    expect(call.status).toBe('done');
    expect(sim.player.school!.summer!.played[0]).toBe(1);
    // Two and a half hours on stage: 1.6 an hour at a hygiene drift of 1, 4; "twice as fast" would have been 8.
    expect(start - sim.player.wellbeing.hygiene).toBeCloseTo(1.6 * 2.5, 9);
  });

  it('model.ts says no more of hygiene than the engine does: not twice as fast on stage, and no room that notices', () => {
    // The defect is in the words, so the words are what's read: the dial's own comment, which says in the present tense
    // what the journey above shows no code doing. Said in the past tense, as what it once said, it passes.
    const source = readFileSync(new URL('../src/engine/domain/model.ts', import.meta.url), 'utf8');
    const comment = /\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*hygiene: number;/.exec(source);
    expect(comment).not.toBeNull();
    const says = comment![1]!.replace(/\n\s*\*\s?/g, ' ').replace(/\s+/g, ' ').trim();
    expect(says).toMatch(/^0-100, where 100 is clean/);
    expect(says).not.toContain('Falls through the day, and twice as fast on set or on stage');
    expect(says).not.toContain('Rooms notice.');
  });
});
