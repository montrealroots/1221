/**
 * Evidence for seven health rows the review of 2026-10-13 left partial (verification group g05-life): an appeal's
 * decision, a doctor's appointment, a medical bill falling due, the health month, a therapy session, the health week and
 * workers' compensation. The gaps it named are closed here where the engine as it stands can close them, through the
 * command the player gives or the clock that runs the scheduled kind, and each consequence is read where the row says
 * it's read, against figures worked out from the rule's own numbers or its published source, never from the helper the
 * engine computes them with.
 *
 * - `health.appeal_decided`: a denied visit on Access Health CT's Standard Silver, its $45 copay against the $183.98
 *   uninsured price the denial notice states. Paid, then overturned: $138.98 back to the payee account, the bill $45,
 *   Papers' Settled and Denial Overturned. Upheld: nothing back, the bill as it was, Denial Upheld. Gone to debt, then
 *   overturned: the debt down to the $45 share, nothing to the bank. Partly paid off, then overturned: what was paid
 *   over the share back, and the bill settled, which the engine didn’t do until 2026-10-13 (a defect, fixed that day;
 *   see below). And the notices held to name the clinic as it’s written, which they didn’t until then (a defect too,
 *   fixed the same day).
 * - `health.appointment`: a visit booked by the health week and kept while a broken bone keeps the student off work and
 *   out of class; a visit booked again after Call It Off, missed in hospital by a stay the week drew, shown on Papers as
 *   not yet seen, and kept when booked again, across a reload. What a kept visit renews and reviews is read by nothing in
 *   New Haven but the next review's date, and a visit owed swallows the week's later draws: neither is tested here, both
 *   waiting on a decision (docs/UNBITTEN.md, tests/defects-g23-1.test.ts).
 * - `health.bill`: a stay's $200 (Yale Health's admission copay) falling due 30 days on: paid from the checking account
 *   and Settled on Papers; unpaid in a drained twin, the Owed For Medical Care account at exactly $200, the notice, the
 *   money trouble, Owed As Debt on Papers, and Pay It Off settling it, across a reload. Therapy's unpaid sessions bring
 *   bills through the clock too, under the two rows after it.
 * - `health.month`: high blood pressure diagnosed by the month and its medicine filled by the next week at Walmart's $4;
 *   a depression's month of care lapsing in a drained twin and the week's morale toll that reads it; HUSKY D ended at
 *   renewal for no work, and what a visit costs on Papers then, against a twin renewed six months for 80 hours of it;
 *   three sessions' $720 of medical debt reported on the first month a year past due, once.
 * - `health.therapy_session`: an unpaid session at Adna Linden's $240 billed and gone to debt; a Yale course ended by
 *   withdrawing; a session missed in hospital and held a week; a course that lifts the depression against one that
 *   doesn't, and the medicine and the morale toll that stop after it.
 * - `health.week`: the flu, a stay and an emergency drawn by the week, each with its days, its toll against a twin, and
 *   what reads it (calling in sick, the classes excused, a piece of work shown ill, the year's frailty band); and
 *   `catching` changing the week's own draw by the published 2.5 and 1.8. The notices are read from the save, not
 *   rendered.
 * - `injury.comp`: a broken bone at an elective front-of-house shift paid a week at a time for every one of its 42 days,
 *   into the payee account, across a reload; its rate, 75% of the $92 week with no FICA taken off, as none was withheld
 *   from it; and a second shift in the week counted in the wage it records. Until 2026-10-13 the rate took off a FICA
 *   never withheld, and the wage was the one shift’s (two defects, fixed that day). Only an elective shift's fall can
 *   pay it: the Saturday crew's mix (a knock, a cut, a back strain, a pulled muscle, a sprain) keeps nobody off work.
 *
 * Defects these tests showed, each failing when written, until the engine was fixed on 2026-10-13:
 * - An appeal overturned on a bill partly paid off as debt kept what was paid over the share (`APPEAL_KIND`, then
 *   health.ts 1394-1398), and the bill read Owed As Debt with nothing owed.
 * - Four notices lowercased the whole of what the care was, so a clinic’s or a hospital’s name read “fair haven
 *   community health care” (then health.ts 1189, 1369, 1401).
 * - Work-study’s injury at work recorded that one shift’s pay as the week’s wage (then school.ts 3057-3058).
 * - Connecticut’s after-tax rate took a year of payroll tax off the wage (`compWeekly`, injury.ts 136) though a
 *   student’s work-study pay bears none (then school.ts 3114-3116), so its compensation was $63.72 a week where it’s
 *   $69.00.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and a first-year at Yale
 * in New Haven from Monday 24 August 2026, every personality axis at the middle as the creation screen can set them, so
 * the illness toll, the stress gain and the mood swing each read 1. Each seed was chosen for a quiet first autumn: no
 * visit, stay or emergency of its own drawn where a test forces one. A life outside Yale Health is reached by Withdraw
 * (`school.withdraw`) in the first fifteen days of classes, which ends its cover. Papers is rendered as the player has it
 * (react-dom/server), `useGame`'s `run` the save's own `execute`, and a Gated button pressed by its own onClick.
 *
 * TEST SETUP, said again where it's done: a draw forced on one save (the week's illness, a denial, an appeal's outcome,
 * an onset, an injury, a course's lift), as the deciders' sweep forces one, numbers given and a "no" to every chance
 * after them; a reloaded save draws its own. Money moved by postings against a test line: a bank drained with its
 * overdraft, or drained again the hour before a bill falls due, of whatever came in since (left alone, a drained
 * student's first $240 bill was paid when it fell due), or funded; August's pay recorded so the marketplace, not HUSKY
 * D, is what's offered; a month's work posted for HUSKY D's renewal; the body's sleep debt and stress set before a
 * week's draw.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Personality } from '@/engine/domain/model';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CARE } from '@/engine/content/safetynet';
import { APPEAL_KIND, HEALTH_MONTH_KIND, HEALTH_WEEK_KIND, coverOn, healthOf, keptUp, medicalDebtOf } from '@/engine/systems/health';
import { APPOINTMENT_KIND, appointmentsOf } from '@/engine/systems/appointments';
import { THERAPY_SESSION_KIND } from '@/engine/systems/therapy';
import { COMP_KIND, laidUp } from '@/engine/systems/injury';
import { payeeAccount } from '@/engine/systems/cash';
import { earningsOf, recordWages } from '@/engine/systems/earnings';
import { overdraftRoom } from '@/engine/systems/lending';
import { troubles } from '@/engine/systems/spending';
import { fluByWeek, weekOfYear } from '@/engine/systems/seasons';

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
const student = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personality: MIDDLE });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/**
 * The seeds, each chosen for what its own first autumn draws, measured through 20 December 2026 with nothing forced:
 * none of them draws a visit, a stay or an emergency of its own before a test's forced one has been had.
 */
const SEED = {
  /** Nothing drawn. */
  quiet: 'g05-upheld',
  /** Nothing drawn. */
  quietToo: 'g05-bill',
  /** A visit of its own booked on 2 November. */
  laidUp: 'g05-laid-up',
  /** Drawn with depression; nothing drawn. */
  depressed: 'g05-flu',
  /** Drawn with depression and asthma; nothing drawn. */
  depressedToo: 'g05-report',
  /** Drawn with depression and asthma; a visit of its own booked on 5 October and a stay on 26 October. */
  depressedLater: 'g05-debt',
  /** Drawn with depression; a visit of its own booked on 9 November. */
  depressedNov: 'g05-catching',
  /** Drawn with depression; a visit of its own booked on 14 December. */
  depressedDec: 'g05-wage',
  /** Drawn with asthma; a visit of its own booked on 2 November. */
  stay: 'g05-stay',
  /** A visit of its own booked on 2 November. */
  renew: 'g05-renew',
  /** Drawn with high blood pressure; visits of its own booked on 7 September and 12 October. */
  comp: 'g05-comp',
} as const;

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
/** The week's draw in `illnessWeek`'s order: a stay, an emergency, a visit, the flu (and whether it's seen at urgent care). */
const WEEK = { stay: [0], emergency: [0.999, 0], visit: [0.999, 0.999, 0], fluSeen: [0.999, 0.999, 0.999, 0, 0], nothing: [0.999] } as const;
const forceWeek = (sim: Simulation, force: ReturnType<typeof forcing>, week: number, draw: readonly number[]) => force('health.illness', [sim.player.id, String(week)], [...draw]);

const nextPending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[0]!;
const titled = (sim: Simulation, title: string, from = 0) => sim.universe.notifications.filter((n) => n.title === title && n.at >= from);
const memos = (sim: Simulation, memo: string | RegExp) => sim.universe.transactions.filter((t) => (typeof memo === 'string' ? t.memo === memo : memo.test(t.memo)));
/** What a transaction moved into one account (negative out of it). */
const into = (t: { postings: { accountId: string; amount: number }[] }, accountId: string) => t.postings.filter((p) => p.accountId === accountId).reduce((s, p) => s + p.amount, 0);
/** What a transaction moved into the player's own accounts, the medical debt's among them. */
const toPlayer = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).reduce((s, p) => s + p.amount, 0);
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
/** The row of Papers' Care And Its Bills for a bill had on a day, by a word of what it was. */
function billRow(sim: Simulation, word: string, when: number): string {
  const rows = (drawn(sim).html.match(/<tr>.*?<\/tr>/g) ?? []).map(textOf).filter((r) => r.includes(formatDate(when, NY)) && r.toLowerCase().includes(word.toLowerCase()));
  expect(rows, `one row for ${word} on ${formatDate(when, NY)}`).toHaveLength(1);
  return rows[0]!;
}

// ---------------------------------------------------------------------------
// health.appeal_decided
// ---------------------------------------------------------------------------

/** The visit's figures: Access Health CT's Standard Silver copay, 2026, and the uninsured price the denial notice states. */
const SHARE = 45_00;
const UNINSURED = 183_98;
const CLINIC = 'Fair Haven Community Health Care';

/**
 * PLAYER JOURNEY: withdrawn, uninsured from 1 September, enrolled through Papers' Enroll in the marketplace from
 * 1 October; the first week after it draws a visit (TEST SETUP: forced), booked for the wait New Haven has, AMN's
 * fifteen-metro 23.5 days, 24 on the calendar; kept, its claim denied (TEST SETUP: forced); appealed through Papers'
 * Appeal It an hour on. The decision is the clock's, 60 days after.
 */
function deniedOnTheMarketplace() {
  const sim = student(SEED.quiet);
  const force = forcing(sim);
  withdraw(sim);
  // TEST SETUP: August's pay, $3,000, over Covered Connecticut's 175% of 2025's poverty line a month, so the marketplace
  // is what's offered and not HUSKY D.
  recordWages(sim.player, at(2026, 8, 28, 17), NY, { gross: 3_000_00, employer: 'g05-summer-job' });
  sim.advanceTo(at(2026, 9, 1, 8));
  expect(titled(sim, 'Your Health Cover Ended')).toHaveLength(1);
  drawn(sim);
  expect(press('health.enroll')).toEqual(['Enrolled in the marketplace, from October 1, 2026.']);
  sim.advanceTo(at(2026, 10, 1, 8));
  expect(coverOn(sim.player, sim.now)).toBe('marketplace');
  const week = nextPending(sim, HEALTH_WEEK_KIND);
  expect(week.at).toBe(at(2026, 10, 5, 9));
  expect(appointmentsOf(sim.player)).toEqual([]);
  forceWeek(sim, force, week.at, WEEK.visit); // TEST SETUP: the week's draw forced to a visit
  force('health.denial', null, [0]); // TEST SETUP: the claim's draw forced to a denial
  sim.advanceTo(week.at + MS_HOUR);
  const visit = appointmentsOf(sim.player)[0]!;
  expect(visit.at).toBe(at(2026, 10, 29, 10));
  sim.advanceTo(visit.at + MS_HOUR);
  const bill = healthOf(sim.player).bills.find((b) => b.at === visit.at)!;
  expect(bill).toMatchObject({ what: `A doctor’s visit, ${CLINIC}`, amount: UNINSURED, dueAt: visit.at + 30 * MS_DAY, denied: { share: SHARE } });
  expect(titled(sim, 'A Claim Denied')[0]!.body).toContain(', so you owe the full $183.98 unless an appeal overturns it.');
  drawn(sim);
  expect(press('health.appeal')).toEqual(['Appealed: decided in 60 days.']);
  expect(bill.denied!.appealedAt).toBe(sim.now);
  const decision = nextPending(sim, APPEAL_KIND);
  expect(decision.at).toBe(sim.now + 60 * MS_DAY);
  return { sim, bill, force, decidedAt: decision.at };
}
const appealWon = (sim: Simulation) => memos(sim, /^Appeal won: /);
const billPaid = (sim: Simulation) => memos(sim, /^Medical bill: A doctor’s visit/);

describe('health.appeal_decided', () => {
  it('PLAYER JOURNEY: paid, then overturned, gives back the $138.98 paid over the $45 share to the payee account, once, across a reload', () => {
    const { sim, bill, force, decidedAt } = deniedOnTheMarketplace();
    expect(billRow(sim, 'Visit', bill.at)).toContain('$183.98 November 28, 2026 Appealed');
    sim.advanceTo(bill.dueAt + MS_HOUR);
    // Paid at due, from the checking account, the whole of the denied bill.
    expect(bill.paid).toBe(true);
    expect(billPaid(sim).map((t) => into(t, checking(sim)))).toEqual([-UNINSURED]);
    force('health.appeal', null, [0.99]); // TEST SETUP: the decision's draw forced to overturn
    sim.advanceTo(decidedAt + MS_HOUR);
    expect(bill.denied!.outcome).toBe('overturned');
    expect(bill.amount).toBe(SHARE);
    // What was paid over the share, $183.98 less $45, into the account payments are paid into, off the Medical Care line.
    const payee = payeeAccount(sim, sim.player).id;
    expect(appealWon(sim)).toHaveLength(1);
    expect(into(appealWon(sim)[0]!, payee)).toBe(138_98);
    expect(into(appealWon(sim)[0]!, sim.nominalAccount('expense', 'Medical Care').id)).toBe(-138_98);
    // Net, the visit cost the player its share.
    expect([...billPaid(sim), ...appealWon(sim)].reduce((s, t) => s + toPlayer(sim, t), 0)).toBe(-SHARE);
    const won = titled(sim, 'Appeal Won');
    expect(won).toHaveLength(1);
    expect(won[0]!.body).toMatch(/^The plan reversed its denial for a doctor’s visit, .+\. You owe only your share, \$45\.00\.$/);
    expect(titled(sim, 'Appeal Lost')).toEqual([]);
    expect(billRow(sim, 'Visit', bill.at)).toContain('$45.00 Settled Denial Overturned');
    // Reloaded and played on a month: decided once, refunded once.
    const again = reload(sim);
    again.advanceBy(30 * MS_DAY);
    expect(appealWon(again)).toHaveLength(1);
    expect(healthOf(again.player).bills.find((b) => b.id === bill.id)!.denied!.outcome).toBe('overturned');
    expect(again.universe.scheduled.some((i) => i.kind === APPEAL_KIND && i.status === 'pending')).toBe(false);
    expect(titled(again, 'Appeal Won')).toHaveLength(1);
  });

  it('PLAYER JOURNEY: upheld, leaves the bill at $183.98 with nothing back, says Appeal Upheld, and Papers Denial Upheld', () => {
    const { sim, bill, force, decidedAt } = deniedOnTheMarketplace();
    force('health.appeal', null, [0]); // TEST SETUP: the decision's draw forced to uphold
    sim.advanceTo(decidedAt + MS_HOUR);
    expect(bill.denied!.outcome).toBe('upheld');
    expect(bill.amount).toBe(UNINSURED);
    expect(bill.paid).toBe(true);
    expect(appealWon(sim)).toEqual([]);
    expect(billPaid(sim).reduce((s, t) => s + toPlayer(sim, t), 0)).toBe(-UNINSURED);
    expect(titled(sim, 'Appeal Lost')).toHaveLength(1);
    expect(titled(sim, 'Appeal Lost')[0]!.body).toMatch(/^The plan kept its denial for a doctor’s visit, .+\.$/);
    expect(titled(sim, 'Appeal Won')).toEqual([]);
    expect(billRow(sim, 'Visit', bill.at)).toContain('$183.98 Settled Denial Upheld');
  });

  it('PLAYER JOURNEY: gone to debt, then overturned, takes the debt down to the $45 share and puts nothing in the bank', () => {
    const { sim, bill, force, decidedAt } = deniedOnTheMarketplace();
    sim.advanceTo(bill.dueAt - MS_DAY);
    broke(sim); // TEST SETUP
    sim.advanceTo(bill.dueAt + MS_HOUR);
    expect(bill.inDebt).toBe(true);
    expect(bill.paid).toBeFalsy();
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(-UNINSURED);
    force('health.appeal', null, [0.99]); // TEST SETUP: the decision's draw forced to overturn
    sim.advanceTo(decidedAt + MS_HOUR);
    expect(bill.denied!.outcome).toBe('overturned');
    const debt = medicalDebtOf(sim, sim.player)!;
    expect(debt.balance).toBe(-SHARE);
    expect(bill.amount).toBe(SHARE);
    expect(bill.inDebt).toBe(true);
    // The $138.98 went off the debt, and into no other account of theirs.
    expect(appealWon(sim)).toHaveLength(1);
    expect(into(appealWon(sim)[0]!, debt.id)).toBe(138_98);
    expect(appealWon(sim)[0]!.postings.filter((p) => p.accountId !== debt.id && sim.universe.accounts[p.accountId]?.ownerId === sim.player.id)).toEqual([]);
    expect(billRow(sim, 'Visit', bill.at)).toContain('$45.00 Owed As Debt Denial Overturned');
  });

  it('partly paid off as debt, then overturned, gives back what was paid over the share, and the bill is settled', () => {
    const { sim, bill, force, decidedAt } = deniedOnTheMarketplace();
    sim.advanceTo(bill.dueAt - MS_DAY);
    broke(sim); // TEST SETUP
    sim.advanceTo(bill.dueAt + MS_HOUR);
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(-UNINSURED);
    // $100 paid toward the debt, more than the $45 the appeal will leave owed.
    fund(sim, 100_00); // TEST SETUP
    expect(sim.must<{ paid: number }>({ kind: 'health.pay_bill', payload: { amount: 100_00 } }).paid).toBe(100_00);
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(-83_98);
    force('health.appeal', null, [0.99]); // TEST SETUP: the decision's draw forced to overturn
    sim.advanceTo(decidedAt + MS_HOUR);
    expect(bill.denied!.outcome).toBe('overturned');
    expect(bill.amount).toBe(SHARE);
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(0);
    // Paid $100 on a bill that owes $45: the $55 over comes back, as a paid bill's does.
    const payee = payeeAccount(sim, sim.player).id;
    expect(appealWon(sim).reduce((s, t) => s + into(t, payee), 0)).toBe(55_00);
    expect(bill.paid).toBe(true);
    expect(bill.inDebt).toBeFalsy();
  });

  it('the denial’s and the decision’s notices name the clinic as it’s written', () => {
    const { sim, force, decidedAt } = deniedOnTheMarketplace();
    force('health.appeal', null, [0.99]); // TEST SETUP: the decision's draw forced to overturn
    sim.advanceTo(decidedAt + MS_HOUR);
    expect(titled(sim, 'A Claim Denied')[0]!.body).toBe(`Your plan denied the claim for a doctor’s visit, ${CLINIC}, so you owe the full $183.98 unless an appeal overturns it. To appeal, press Appeal It on Papers, under Health Cover, within 180 days.`);
    expect(titled(sim, 'Appeal Won')[0]!.body).toBe(`The plan reversed its denial for a doctor’s visit, ${CLINIC}. You owe only your share, $45.00.`);
  });
});

// ---------------------------------------------------------------------------
// health.appointment
// ---------------------------------------------------------------------------

const VISIT = 'A doctor’s visit';
const appointmentItem = (sim: Simulation, id: string) => sim.universe.scheduled.find((i) => i.kind === APPOINTMENT_KIND && i.payload.appointmentId === id)!;
const visitsLogged = (sim: Simulation) => (healthOf(sim.player).careLog ?? []).filter((c) => c.care === 'visit');
/**
 * Where a Yale Health member with no practice picked is booked, from 2026-10-15, when Yale Health's rule that a member's
 * care is had at its Health Center was kept: its own "same-day or next-day", the next weekday, at ten. Until then she
 * was booked at Fair Haven, New Haven's 24 days on, and these journeys held those dates.
 */
const YALE_CLINIC = 'Yale Health Center, Student Health';

describe('health.appointment', () => {
  it('PLAYER JOURNEY: kept while a broken bone keeps them off work and out of class', () => {
    const sim = student(SEED.laidUp);
    const force = forcing(sim);
    sim.advanceTo(at(2026, 8, 31, 12));
    // An elective evening at Yale Rep, and a fall there (TEST SETUP: the draw forced to a broken bone, 42 days).
    const shift = sim.must<{ at: number }>({ kind: 'school.take_shift', payload: {} });
    force('health.injury', [sim.player.id, `usher-${shift.at}`], [0, 0.8, 0]); // TEST SETUP
    sim.advanceTo(shift.at + 5 * MS_HOUR);
    const injury = healthOf(sim.player).injury!;
    expect(injury.kind).toBe('fracture');
    expect(injury.offWorkUntil).toBe(shift.at + 42 * MS_DAY);
    // Laid up, Wednesday's classes are excused, not attended: the school's presence reads the injury. (Six weeks of it
    // bring Yale Health's welfare assessment and a medical leave, so the classes stop; the doctor's visit doesn't.)
    const tally = { ...sim.player.school!.tally };
    sim.advanceTo(at(2026, 9, 2, 10));
    expect([sim.player.school!.tally.excused - tally.excused, sim.player.school!.tally.attended - tally.attended]).toEqual([1, 0]);
    // The next Monday, 7 September, draws a visit (TEST SETUP: forced), booked at Yale Health the next weekday, Tuesday
    // 8 September at ten. Until 2026-10-15 this held Thursday 1 October, 24 days on at Fair Haven; that day a member with
    // nothing picked was booked where Yale Health's rule has her care. Either way she's still laid up on the day.
    const week = nextPending(sim, HEALTH_WEEK_KIND);
    expect(week.at).toBe(at(2026, 9, 7, 9));
    expect(appointmentsOf(sim.player)).toEqual([]);
    forceWeek(sim, force, week.at, WEEK.visit); // TEST SETUP
    sim.advanceTo(week.at + MS_HOUR);
    const visit = appointmentsOf(sim.player)[0]!;
    expect(visit.at).toBe(at(2026, 9, 8, 10));
    expect(laidUp(sim.player, visit.at)).toBe(true);
    sim.advanceTo(visit.at + MS_HOUR);
    // Kept, though still laid up: the care's presence asks only that they be awake and out of hospital.
    expect(laidUp(sim.player, sim.now)).toBe(true);
    expect(appointmentItem(sim, visit.id).status).toBe('done');
    expect(visitsLogged(sim).map((c) => [c.at, c.share])).toEqual([[visit.at, 0]]);
    expect(healthOf(sim.player).owedVisit).toBeUndefined();
    // Until 2026-10-15 the notice named Fair Haven, where she was booked; from that day, Yale Health's practice, at $0.
    expect(titled(sim, 'A Doctor’s Visit', visit.at).map((n) => n.body)).toEqual([`You saw a doctor at ${YALE_CLINIC}. There’s nothing to pay.`]);
    expect(titled(sim, 'Missed The Doctor')).toEqual([]);
  });

  it('PLAYER JOURNEY: booked again after Call It Off, missed in hospital, shown not yet seen, and kept when booked again, across a reload', () => {
    const sim = student(SEED.quietToo);
    const force = forcing(sim);
    sim.advanceTo(at(2026, 9, 6, 12));
    const week = nextPending(sim, HEALTH_WEEK_KIND);
    expect(week.at).toBe(at(2026, 9, 7, 9));
    forceWeek(sim, force, week.at, WEEK.visit); // TEST SETUP: the week's draw forced to a visit
    // Until 2026-10-15 the week booked Thursday 1 October, 24 days on at Fair Haven, and the journey called it off on
    // Friday 11 September. That day a member with nothing picked was booked at Yale Health's practice the next weekday,
    // Tuesday 8 September at ten, so it's called off the Monday it's booked, at noon, before it comes.
    sim.advanceTo(at(2026, 9, 7, 12));
    const first = appointmentsOf(sim.player)[0]!;
    expect(first.at).toBe(at(2026, 9, 8, 10));
    expect(drawn(sim).text).toContain(`${VISIT}: an appointment September 8, 2026, ${YALE_CLINIC} Call It Off`);
    expect(sim.execute({ kind: 'health.book', payload: {} }).error).toBe('There’s nothing to see a doctor about.');
    sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: first.id } });
    expect(appointmentItem(sim, first.id).status).toBe('cancelled');
    expect(healthOf(sim.player).owedVisit).toBe(VISIT);
    // Owed until Friday 11 September, and booked again then: the next weekday past Saturday and Sunday is Monday 14
    // September at ten. Until 2026-10-15 it was booked on 11 September 24 days on, Monday 5 October.
    sim.advanceTo(at(2026, 9, 11, 12));
    expect(healthOf(sim.player).owedVisit).toBe(VISIT);
    const again = sim.must<{ at: number }>({ kind: 'health.book', payload: {} });
    expect(again.at).toBe(at(2026, 9, 14, 10));
    expect(healthOf(sim.player).owedVisit).toBeUndefined();
    // That Monday's week, at nine, draws a stay (TEST SETUP: forced): three days in hospital, over the visit at ten.
    // Until 2026-10-15 that Monday was 5 October, and the stay ran to Thursday 8 October.
    forceWeek(sim, force, at(2026, 9, 14, 9), WEEK.stay); // TEST SETUP
    sim.advanceTo(again.at + MS_HOUR);
    expect(healthOf(sim.player).inHospitalUntil).toBe(at(2026, 9, 17, 9));
    const second = sim.universe.scheduled.find((i) => i.kind === APPOINTMENT_KIND && i.at === again.at)!;
    expect(second.status).toBe('missed');
    expect(healthOf(sim.player).owedVisit).toBe(VISIT);
    expect(titled(sim, 'Missed The Doctor').map((n) => n.body)).toEqual(['You weren’t there for your doctor’s appointment, so you weren’t seen. To book again, press Book An Appointment on Papers, under Health Cover.']);
    expect(visitsLogged(sim)).toEqual([]);

    // Reloaded, and out of hospital on Thursday 17 September: Papers says it's owed, and Book An Appointment books it at
    // Yale Health the next weekday, Friday 18 September at ten. Until 2026-10-15 this was Thursday 8 October, booked 24
    // days on at Fair Haven, Sunday 1 November, so Monday the 2nd.
    const back = reload(sim);
    back.advanceTo(at(2026, 9, 17, 12));
    const { html, text } = drawn(back);
    expect(text).toContain(`${VISIT}: not yet seen Book An Appointment`);
    expect(html).not.toMatch(/disabled=""[^>]*>Book An Appointment</);
    expect(back.must<{ at: number }>({ kind: 'health.book', payload: {} }).at).toBe(at(2026, 9, 18, 10));
    back.advanceTo(at(2026, 9, 18, 11));
    expect(visitsLogged(back).map((c) => c.at)).toEqual([at(2026, 9, 18, 10)]);
    expect(healthOf(back.player).owedVisit).toBeUndefined();
    expect(titled(back, 'A Doctor’s Visit', at(2026, 9, 18, 10))).toHaveLength(1);
    expect(titled(back, 'Missed The Doctor')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// health.bill
// ---------------------------------------------------------------------------

/** Yale Health's admission copay, 2026–27: $200 an admission, to $1,000 a year. */
const STAY_COPAY = 200_00;

/** PLAYER JOURNEY: the week of 7 September draws a stay in hospital (TEST SETUP: forced), billed at Yale Health's copay, due in 30 days. */
function stayBilled() {
  const sim = student(SEED.quietToo);
  const force = forcing(sim);
  sim.advanceTo(at(2026, 9, 6, 12));
  const week = nextPending(sim, HEALTH_WEEK_KIND);
  forceWeek(sim, force, week.at, WEEK.stay); // TEST SETUP
  sim.advanceTo(week.at + MS_HOUR);
  const bill = healthOf(sim.player).bills.find((b) => b.at === week.at)!;
  expect(bill).toMatchObject({ amount: STAY_COPAY, dueAt: at(2026, 10, 7, 9), hospital: true });
  expect(bill.what).toMatch(/^A stay in hospital, Yale New Haven Hospital/);
  expect(titled(sim, 'In Hospital')[0]!.body).toBe(`You’re in hospital for 3 days at ${bill.what.replace(/^A stay in hospital, /, '')}. Classes you miss while you’re there are excused. You owe $200.00. It’s taken from your checking account on October 7, 2026, and if there isn’t enough then, it becomes medical debt.`);
  return { sim, bill };
}
const billMemo = (what: string) => `Medical bill: ${what}`;

describe('health.bill', () => {
  it('PLAYER JOURNEY: a stay’s $200 falls due and is paid from the checking account, Settled on Papers, once across a reload', () => {
    const { sim, bill } = stayBilled();
    expect(billRow(sim, 'Hospital', bill.at)).toContain('$200.00 October 7, 2026');
    sim.advanceTo(bill.dueAt - MS_HOUR);
    expect(bill.paid).toBeFalsy();
    sim.advanceTo(bill.dueAt + MS_HOUR);
    expect(bill.paid).toBe(true);
    expect(bill.inDebt).toBeUndefined();
    const paid = memos(sim, billMemo(bill.what));
    expect(paid).toHaveLength(1);
    expect(paid[0]!.at).toBe(bill.dueAt);
    expect(into(paid[0]!, checking(sim))).toBe(-STAY_COPAY);
    expect(into(paid[0]!, sim.nominalAccount('expense', 'Medical Care').id)).toBe(STAY_COPAY);
    expect(medicalDebtOf(sim, sim.player)).toBeUndefined();
    expect(titled(sim, 'A Medical Bill Went Unpaid')).toEqual([]);
    expect(billRow(sim, 'Hospital', bill.at)).toContain('$200.00 Settled');
    const again = reload(sim);
    again.advanceBy(40 * MS_DAY);
    expect(memos(again, billMemo(bill.what))).toHaveLength(1);
  });

  it('PLAYER JOURNEY: unpaid in a drained twin, is $200 of medical debt, a money trouble and Owed As Debt, until Pay It Off settles it, across a reload', () => {
    const { sim, bill } = stayBilled();
    sim.advanceTo(bill.dueAt - MS_DAY);
    broke(sim); // TEST SETUP
    sim.advanceTo(bill.dueAt + MS_HOUR);
    expect(bill.paid).toBeFalsy();
    expect(bill.inDebt).toBe(true);
    expect(memos(sim, billMemo(bill.what))).toEqual([]);
    const debt = medicalDebtOf(sim, sim.player)!;
    expect(debt).toMatchObject({ name: 'Owed For Medical Care', kind: 'loan', balance: -STAY_COPAY });
    expect(healthOf(sim.player).debtSince).toBe(bill.dueAt);
    const unpaid = titled(sim, 'A Medical Bill Went Unpaid');
    expect(unpaid).toHaveLength(1);
    expect(unpaid[0]!.body).toMatch(/^Your bank couldn’t cover a \$200\.00 medical bill when it came due, so it’s now medical debt\. The bill was for a stay in hospital, .+\. To clear it, press Pay It Off on Papers, under Health Cover\.$/);
    expect(troubles(sim, sim.player)).toContainEqual({ kind: 'medical', amount: STAY_COPAY });
    expect(drawn(sim).text).toContain('Medical Debt $200.00');
    expect(billRow(sim, 'Hospital', bill.at)).toContain('$200.00 Owed As Debt');

    // Reloaded, money in, and Pay It Off pressed.
    const back = reload(sim);
    fund(back, 300_00); // TEST SETUP
    drawn(back);
    expect(press('health.pay_bill')).toEqual(['Your medical debt is paid off.']);
    const settled = healthOf(back.player).bills.find((b) => b.id === bill.id)!;
    expect(settled.paid).toBe(true);
    expect(settled.inDebt).toBeUndefined();
    expect(healthOf(back.player).debtSince).toBeUndefined();
    expect(medicalDebtOf(back, back.player)!.balance).toBe(0);
    expect(troubles(back, back.player).filter((t) => t.kind === 'medical')).toEqual([]);
    expect(back.execute({ kind: 'health.pay_bill', payload: { amount: 1 } }).error).toBe('You owe nothing for care.');
    expect(billRow(back, 'Hospital', bill.at)).toContain('$200.00 Settled');
    back.advanceBy(30 * MS_DAY);
    expect(titled(back, 'A Medical Bill Went Unpaid')).toHaveLength(1);
  });

  it('A Medical Bill Went Unpaid names the hospital as it’s written', () => {
    const { sim, bill } = stayBilled();
    sim.advanceTo(bill.dueAt - MS_DAY);
    broke(sim); // TEST SETUP
    sim.advanceTo(bill.dueAt + MS_HOUR);
    const name = bill.what.replace(/^A stay in hospital, /, '');
    expect(name).toMatch(/^Yale New Haven Hospital/);
    expect(titled(sim, 'A Medical Bill Went Unpaid')[0]!.body).toBe(`Your bank couldn’t cover a $200.00 medical bill when it came due, so it’s now medical debt. The bill was for a stay in hospital, ${name}. To clear it, press Pay It Off on Papers, under Health Cover.`);
  });
});

// ---------------------------------------------------------------------------
// health.month
// ---------------------------------------------------------------------------

/** TEST SETUP: a month's wages posted as work-study's are, its hours in the memo, which the work test reads. */
function wagesPosted(sim: Simulation, when: number, gross: number, hours: number): void {
  sim.advanceTo(when);
  sim.post({ memo: `TEST SETUP wages, ${hours} hours`, category: 'salary', postings: [{ accountId: checking(sim), amount: gross }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -gross }] });
}

describe('health.month', () => {
  it('PLAYER JOURNEY: diagnoses high blood pressure on the 1st, and the next week fills its medicine at Walmart’s $4, once across a reload', () => {
    const sim = student(SEED.depressed);
    const force = forcing(sim);
    expect(Object.keys(healthOf(sim.player).chronic ?? {})).toEqual(['depression']);
    sim.advanceTo(at(2026, 8, 26, 12));
    sim.must({ kind: 'health.choose_pharmacy', payload: { chain: 'walmart' } });
    const month = nextPending(sim, HEALTH_MONTH_KIND);
    expect(month.at).toBe(at(2026, 9, 1, 0, 30));
    // The month's onset, in ONSET's order: diabetes not, high blood pressure (TEST SETUP: forced).
    force('health.onset', [sim.player.id, String(month.at)], [0.999, 0]); // TEST SETUP
    sim.advanceTo(month.at + MS_HOUR);
    expect(healthOf(sim.player).chronic!.hypertension).toEqual({ treated: true, since: month.at, lapsed: false });
    expect(titled(sim, 'Diagnosed: High Blood Pressure').map((n) => n.body)).toEqual(['A doctor found this month that you have high blood pressure. Its care starts now, and each month you pay what your plan doesn’t cover. You can see the cost, or stop the care with Let It Go, on Papers, under Health Cover.']);
    // The next Monday fills a month of it, 30 days (CMS's retail fill), at Walmart's own $4 generic: `PHARMACY.plans`
    // carries no copay for Yale Health, so a student pays the counter's cash price.
    const week = nextPending(sim, HEALTH_WEEK_KIND);
    expect(week.at).toBe(at(2026, 9, 7, 9));
    sim.advanceTo(week.at + MS_HOUR);
    const fills = memos(sim, 'Medicine for high blood pressure');
    expect(fills.map((t) => [t.at, into(t, checking(sim))])).toEqual([[week.at, -4_00]]);
    expect(healthOf(sim.player).chronic!.hypertension!.supplyUntil).toBe(week.at + 30 * MS_DAY);
    expect(keptUp(healthOf(sim.player).chronic!.hypertension, sim.now)).toBe(true);
    expect(drawn(sim).text).toContain('High Blood Pressure: Kept Up · Medicine until October 7, 2026');
    // Reloaded, the next 1st doesn't diagnose it again.
    const again = reload(sim);
    again.advanceTo(at(2026, 10, 1, 2));
    expect(titled(again, 'Diagnosed: High Blood Pressure')).toHaveLength(1);
    expect(healthOf(again.player).chronic!.hypertension!.since).toBe(month.at);
  });

  it('PLAYER JOURNEY: uninsured, a drained twin’s month of care for depression lapses, and the next week’s toll reads it: 3 of morale', () => {
    const twin = (drain: boolean) => {
      const sim = student(SEED.depressedDec);
      expect(healthOf(sim.player).chronic!.depression).toEqual({ treated: true });
      withdraw(sim);
      sim.advanceTo(at(2026, 9, 30, 12));
      if (drain) broke(sim); // TEST SETUP
      sim.advanceTo(at(2026, 10, 1, 2));
      const week = nextPending(sim, HEALTH_WEEK_KIND);
      expect(week.at).toBe(at(2026, 10, 5, 9));
      sim.advanceTo(week.at - 60_000);
      const before = sim.player.wellbeing.morale;
      sim.advanceTo(week.at + 60_000);
      return { sim, drop: before - sim.player.wellbeing.morale };
    };
    const drained = twin(true);
    const funded = twin(false);
    const care = (sim: Simulation) => memos(sim, 'Care for depression').filter((t) => t.at === at(2026, 10, 1, 0, 30));
    expect(care(funded.sim)).toHaveLength(1);
    expect(into(care(funded.sim)[0]!, checking(funded.sim))).toBeLessThan(0);
    expect(care(drained.sim)).toEqual([]);
    expect(healthOf(drained.sim.player).chronic!.depression!.lapsed).toBe(true);
    expect(healthOf(funded.sim.player).chronic!.depression!.lapsed).toBe(false);
    expect(keptUp(healthOf(drained.sim.player).chronic!.depression, drained.sim.now)).toBe(false);
    expect(keptUp(healthOf(funded.sim.player).chronic!.depression, funded.sim.now)).toBe(true);
    // CHRONIC.untreated: depression left alone costs 3 of morale a week.
    expect(drained.drop - funded.drop).toBeCloseTo(3, 9);
    expect(drawn(drained.sim).text).toContain('Depression: Kept Up, But This Month’s Care Went Unpaid');
  });

  // Its title kept whole inside the new one, for what cites it. Until 2026-10-16 the idle twin's HUSKY D ended at the
  // renewal's own hour. Since then the renewal sends a notice of noncompliance, she's covered through thirty days to
  // answer, it's decided, and said ten days or more ahead it ends with the month (42 USC 1396a(xx)(6); 42 CFR 435.558,
  // 431.211). Renamed later on 2026-10-16 (brief 09's journeys, inputs/renames.json; until then “PLAYER JOURNEY: HUSKY D ends at its renewal on 1 September 2027 for no work, and is renewed six months for 80 hours of it, until 2026-10-16; since then that renewal sends a notice of noncompliance, and HUSKY D ends on 31 October 2027”): HUSKY D
  // begins on the first of the month of application (Connecticut's UPM § 1560.10(B)), so enrolled on 25 August it runs from
  // 1 August, not 1 September, and every date after moves a month, worked again by hand: renewed twelve months on, 1 August
  // 2027; the notice received five days on, 6 August, answered by the thirtieth day from then, 4 September, decided on 5
  // September, and ten days on, 15 September, it ends with September. Her six months before the renewal, February to July
  // 2027, had no work and under $580 of income in each; the working twin's 80 hours are in July.
  it('PLAYER JOURNEY: HUSKY D enrolled on 25 August 2026 runs from 1 August, the month of application; its renewal on 1 August 2027 sends a notice of noncompliance for no work, and it ends on 30 September 2027, where $600 of wages in July (TEST SETUP) renews it six months', () => {
    const twin = (work: boolean) => {
      const sim = student(SEED.renew);
      withdraw(sim);
      drawn(sim);
      expect(press('health.enroll')).toEqual(['Enrolled in HUSKY D, from August 1, 2026.']);
      expect(healthOf(sim.player).program).toMatchObject({ kind: 'medicaid', state: 'ct', from: at(2026, 8, 1, 0), renewAt: at(2027, 8, 1, 0) });
      if (work) wagesPosted(sim, at(2027, 7, 20, 17), 600_00, 80); // TEST SETUP
      sim.advanceTo(at(2027, 7, 31, 12));
      expect(coverOn(sim.player, sim.now)).toBe('medicaid');
      sim.advanceTo(at(2027, 8, 1, 2));
      return sim;
    };
    const idle = twin(false);
    for (const m of ['2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07']) expect(earningsOf(idle.player).months[m] ?? 0).toBeLessThan(580_00);
    expect(coverOn(idle.player, idle.now)).toBe('medicaid');
    expect(healthOf(idle.player).pending).toMatchObject({ kind: 'renewal', noticeAt: at(2027, 8, 1, 0, 30), decideAt: at(2027, 9, 5, 0) });
    expect(titled(idle, 'A Notice Of Noncompliance')).toHaveLength(1);
    idle.advanceTo(at(2027, 9, 30, 12));
    expect(coverOn(idle.player, idle.now)).toBe('medicaid');
    expect(titled(idle, 'Your Public Cover Ends').map((n) => [n.at, n.body])).toEqual([[at(2027, 9, 5, 0), 'HUSKY D still couldn’t find $580.00 of income, time at the School or an exception in any month from February to July 2027, and nothing was shown by September 4, 2027, so HUSKY D ends on September 30, 2027. Losing it gives you 60 days to enroll in the marketplace, but without the premium tax credit while HUSKY D would take you if not for its work rules. You can apply for HUSKY D again in any month after one that meets them.']]);
    idle.advanceTo(at(2027, 10, 1, 2));
    expect(coverOn(idle.player, idle.now)).toBeUndefined();
    expect(healthOf(idle.player).program!.until).toBe(at(2027, 10, 1, 0));
    expect(titled(idle, 'Your Health Cover Ended', at(2027, 8, 1, 0)).map((n) => n.body)).toEqual(['You have no health cover from October 1, 2027. You have 60 days to enroll in the marketplace. Enroll on Papers, under Health Cover.']);
    expect(healthOf(idle.player).covered).toBe(false);
    const idleScreen = drawn(idle).text;
    expect(idleScreen).toContain('Your Cover How This Works This Month None');
    // What care costs now reads the cover the month left: uninsured, a visit isn't free.
    expect(idleScreen).toMatch(/What it would cost you here now: a doctor’s visit \$[1-9]/);

    const working = twin(true);
    expect(coverOn(working.player, working.now)).toBe('medicaid');
    // From 2027 Connecticut renews HUSKY D every six months: next on 1 February 2028.
    expect(healthOf(working.player).program!.renewAt).toBe(at(2028, 2, 1, 0));
    expect(healthOf(working.player).program!.until).toBeUndefined();
    expect(titled(working, 'A Notice Of Noncompliance')).toEqual([]);
    // Until 2026-10-17 “by 80 hours’ work”: since then the hours aren’t read, and the $600 they were paid is (brief 12, health-criteria.md).
    expect(titled(working, 'Your Public Cover Is Renewed').map((n) => n.body)).toEqual(['HUSKY D is renewed. Its next renewal is on February 1, 2028. Last month’s income is within its limit, and you met its work rules in July 2027, with $580.00 or more of income.']);
    const workingScreen = drawn(working).text;
    expect(workingScreen).toContain('Your Cover How This Works This Month HUSKY D');
    // HUSKY D asks no copays.
    expect(workingScreen).toContain('What it would cost you here now: a doctor’s visit $0.00, urgent care $0.00, an emergency $0.00');
  });

  it('PLAYER JOURNEY: three unpaid sessions’ $720 of medical debt is owed past a year and never reported, Connecticut barring it, across a reload', () => {
    const sim = student(SEED.depressedToo);
    expect(healthOf(sim.player).chronic!.depression).toBeDefined();
    sim.advanceTo(at(2026, 8, 31, 12));
    broke(sim); // TEST SETUP
    expect(sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: ADNA } }).first).toBe(at(2026, 9, 7, 17));
    // The first three sessions' bills fall due unpaid on 7, 14 and 21 October (TEST SETUP: the bank drained again before
    // each, whatever came in since); then money in, and the rest are paid as they fall due.
    for (const due of [at(2026, 10, 7, 17), at(2026, 10, 14, 17), at(2026, 10, 21, 17)]) {
      sim.advanceTo(due - MS_HOUR);
      broke(sim);
    }
    sim.advanceTo(at(2026, 10, 21, 18));
    // Each says the same words, so the notice unread is brought up to the last rather than said three times.
    expect(titled(sim, 'A Medical Bill Went Unpaid').map((n) => n.at)).toEqual([at(2026, 10, 21, 17)]);
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(-720_00);
    expect(healthOf(sim.player).debtSince).toBe(at(2026, 10, 7, 17));
    fund(sim, 2_000_00); // TEST SETUP
    sim.advanceTo(at(2026, 11, 30, 12));
    expect(titled(sim, 'A Medical Bill Went Unpaid').map((n) => n.at)).toEqual([at(2026, 10, 21, 17)]);
    const billed = healthOf(sim.player).bills.filter((b) => b.what === `${ADNA}, a session`);
    expect(billed.slice(0, 3).map((b) => [b.at, b.inDebt])).toEqual([[at(2026, 9, 7, 17), true], [at(2026, 9, 14, 17), true], [at(2026, 9, 21, 17), true]]);
    expect(billed.slice(3).every((b) => b.paid === true && !b.inDebt)).toBe(true);
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(-720_00);
    // $500 or more, a year past due: until 2026-10-22 this held it reported on 1 November 2027, the first month's look
    // a year past due, with a 40-point mark. Connecticut has barred reporting it since 1 July 2024 (Public Act 24-6;
    // `MEDICAL_DEBT.barredIn`, brief 20's papers area), so it's never reported, and stays owed.
    sim.advanceTo(at(2027, 10, 1, 2));
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(-720_00);
    expect(titled(sim, 'A Medical Debt Is On Your Record')).toEqual([]);
    expect(healthOf(sim.player).reported).toBeFalsy();
    const again = reload(sim);
    again.advanceTo(at(2027, 12, 1, 2));
    expect(medicalDebtOf(again, again.player)!.balance).toBe(-720_00);
    expect(titled(again, 'A Medical Debt Is On Your Record')).toEqual([]);
    expect(healthOf(again.player).reported).toBeFalsy();
    expect((again.player.credit!.marks ?? []).filter((m) => m.points === 40 && m.at >= at(2027, 10, 1, 0))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// health.therapy_session
// ---------------------------------------------------------------------------

const ADNA = 'Adna Linden Psychotherapy';
const YALE = 'Yale Mental Health & Counseling';
/** Adna Linden's full fee for 60 minutes (adnalinden.com, Fees & Insurance, read 2026-10-12). */
const ADNA_FEE = 240_00;
const sessions = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === THERAPY_SESSION_KIND && i.payload.personId === sim.player.id);

describe('health.therapy_session', () => {
  it('PLAYER JOURNEY: a session the drained bank can’t pay is held, counted, and billed at $240 due in 30 days, then owed as debt', () => {
    const sim = student(SEED.depressedToo);
    sim.advanceTo(at(2026, 8, 31, 12));
    broke(sim); // TEST SETUP
    const first = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: ADNA } }).first;
    expect(first).toBe(at(2026, 9, 7, 17));
    sim.advanceTo(first + MS_HOUR);
    expect(sim.player.therapy!.done).toBe(1);
    expect(memos(sim, `${ADNA}, a session`)).toEqual([]);
    const bills = healthOf(sim.player).bills.filter((b) => b.what === `${ADNA}, a session`);
    expect(bills.map((b) => [b.at, b.amount, b.dueAt])).toEqual([[first, ADNA_FEE, first + 30 * MS_DAY]]);
    expect(billRow(sim, 'Adna', first)).toContain('$240.00 October 7, 2026');
    expect(drawn(sim).text).toContain(`Therapy with ${ADNA}: 1 of 8 sessions`);
    sim.advanceTo(first + 30 * MS_DAY - MS_HOUR);
    broke(sim); // TEST SETUP: drained again, of whatever came in or opened up since
    sim.advanceTo(first + 30 * MS_DAY + MS_HOUR);
    expect(bills[0]!.inDebt).toBe(true);
    // Only the first bill has fallen due: the debt is its $240.
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(-ADNA_FEE);
    expect(titled(sim, 'A Medical Bill Went Unpaid').map((n) => n.body)).toEqual([expect.stringMatching(/^Your bank couldn’t cover a \$240\.00 medical bill when it came due, so it’s now medical debt\. The bill was for .+, a session\. To clear it, press Pay It Off on Papers, under Health Cover\.$/)]);
    expect(billRow(sim, 'Adna', first)).toContain('$240.00 Owed As Debt');
  });

  it('PLAYER JOURNEY: a Yale course ends at the session after Withdraw ends Yale Health, after 2 of 8, and Adna Linden takes it on', () => {
    const sim = student(SEED.depressedNov);
    expect(healthOf(sim.player).chronic!.depression).toBeDefined();
    sim.advanceTo(at(2026, 8, 25, 12));
    expect(sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: YALE } }).first).toBe(at(2026, 9, 1, 17));
    sim.advanceTo(at(2026, 9, 9, 12));
    expect(sim.player.therapy!.done).toBe(2);
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    sim.advanceTo(at(2026, 9, 15, 18));
    expect(sim.player.therapy).toBeUndefined();
    expect(titled(sim, 'Your Counseling At Yale Ended').map((n) => [n.at, n.body])).toEqual([[at(2026, 9, 15, 17), `Your course at ${YALE} stopped after 2 of 8 sessions, because it sees only students Yale Health covers and your cover has ended. A therapist outside Yale can start a new course with you: choose one on Papers, under Health Cover.`]]);
    expect(sessions(sim).filter((i) => i.status === 'pending')).toEqual([]);
    expect(memos(sim, /, a session$/)).toEqual([]);
    const again = reload(sim);
    again.advanceBy(14 * MS_DAY);
    expect(titled(again, 'Your Counseling At Yale Ended')).toHaveLength(1);
    expect(again.execute({ kind: 'health.therapy', payload: { therapist: YALE } }).error).toBe(`${YALE} sees students Yale Health covers.`);
    expect(again.execute({ kind: 'health.therapy', payload: { therapist: ADNA } }).ok).toBe(true);
  });

  it('PLAYER JOURNEY: a session on a Monday in hospital is missed, unpaid, and held to the next Monday, which is kept and paid $240', () => {
    const sim = student(SEED.depressedLater);
    const force = forcing(sim);
    expect(healthOf(sim.player).chronic!.depression).toBeDefined();
    sim.advanceTo(at(2026, 8, 31, 12));
    const first = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: ADNA } }).first;
    expect(first).toBe(at(2026, 9, 7, 17));
    // That Monday's week, at nine, draws a stay (TEST SETUP: forced): in hospital to Thursday.
    forceWeek(sim, force, at(2026, 9, 7, 9), WEEK.stay); // TEST SETUP
    sim.advanceTo(first + MS_HOUR);
    expect(healthOf(sim.player).inHospitalUntil).toBe(at(2026, 9, 10, 9));
    expect(sessions(sim).map((i) => [i.at, i.status])).toEqual([[first, 'missed'], [first + 7 * MS_DAY, 'pending']]);
    expect(sim.player.therapy!.done).toBe(0);
    expect(memos(sim, `${ADNA}, a session`)).toEqual([]);
    expect(healthOf(sim.player).bills.filter((b) => b.what.startsWith(ADNA))).toEqual([]);
    sim.advanceTo(first + 7 * MS_DAY + MS_HOUR);
    expect(sim.player.therapy!.done).toBe(1);
    expect(memos(sim, `${ADNA}, a session`).map((t) => [t.at, into(t, checking(sim))])).toEqual([[first + 7 * MS_DAY, -ADNA_FEE]]);
  });

  it('PLAYER JOURNEY: a course that lifts the depression ends its medicine and its toll, against a twin’s that doesn’t', () => {
    const twin = (lifts: boolean) => {
      const sim = student(SEED.depressed);
      const force = forcing(sim);
      sim.advanceTo(at(2026, 8, 25, 12));
      sim.must({ kind: 'health.therapy', payload: { therapist: YALE } });
      // The course's end, drawn at the last session (TEST SETUP: forced to lift, or not).
      force('health.therapy', null, [lifts ? 0 : 0.999]); // TEST SETUP
      sim.advanceTo(at(2026, 10, 20, 18));
      return sim;
    };
    const lifted = twin(true);
    const kept = twin(false);
    expect(lifted.player.therapy).toBeUndefined();
    expect(titled(lifted, 'The Depression Has Lifted').map((n) => [n.at, n.body])).toEqual([[at(2026, 10, 20, 17), `After 8 sessions with ${YALE}, your depression has lifted. It no longer needs care, and it no longer takes from your morale.`]]);
    expect(titled(kept, 'The Course Is Done').map((n) => n.body)).toEqual([`You’ve finished 8 sessions with ${YALE}. The depression hasn’t lifted yet, and you can start another course on Papers, under Health Cover.`]);
    expect(healthOf(lifted.player).chronic!.depression).toBeUndefined();
    expect(healthOf(kept.player).chronic!.depression).toBeDefined();
    // Five weeks on: the twin's medicine is filled again, the lifted one's never.
    const end = at(2026, 10, 20, 18);
    for (const sim of [lifted, kept]) sim.advanceTo(end + 35 * MS_DAY);
    const fills = (sim: Simulation) => memos(sim, 'Medicine for depression').filter((t) => t.at > end);
    expect(fills(lifted)).toEqual([]);
    expect(fills(kept).length).toBeGreaterThan(0);
    // Left alone, the twin's weighs on the next week; the lifted one has nothing to leave alone.
    expect(lifted.execute({ kind: 'health.treat', payload: { condition: 'depression', on: false } }).error).toBe('You don’t have that condition.');
    kept.must({ kind: 'health.treat', payload: { condition: 'depression', on: false } });
    const drop = (sim: Simulation) => {
      const week = nextPending(sim, HEALTH_WEEK_KIND);
      sim.advanceTo(week.at - 60_000);
      const before = sim.player.wellbeing.morale;
      sim.advanceTo(week.at + 60_000);
      return before - sim.player.wellbeing.morale;
    };
    expect(drop(kept) - drop(lifted)).toBeCloseTo(3, 9);
  });

  // The check of 2026-10-13 found the lift's end of keeping up unshown: at Yale, the month's care for depression costs
  // nothing either way. Uninsured, it's charged on the 1st, and a course that lifts it ends that charge.
  it('PLAYER JOURNEY: uninsured, a course that lifts the depression ends its month of care on the next 1st, against a twin’s that doesn’t', () => {
    const twin = (lifts: boolean) => {
      const sim = student(SEED.depressedDec);
      expect(healthOf(sim.player).chronic!.depression).toEqual({ treated: true });
      withdraw(sim);
      const force = forcing(sim);
      sim.advanceTo(at(2026, 8, 31, 12));
      sim.must({ kind: 'health.therapy', payload: { therapist: ADNA } });
      force('health.therapy', null, [lifts ? 0 : 0.999]); // TEST SETUP: the course's end, drawn at its last session
      sim.advanceTo(at(2026, 11, 1, 2));
      return sim;
    };
    const lifted = twin(true);
    const kept = twin(false);
    expect([lifted.player.therapy, kept.player.therapy]).toEqual([undefined, undefined]);
    expect(healthOf(lifted.player).chronic!.depression).toBeUndefined();
    const november = (sim: Simulation) => memos(sim, 'Care for depression').filter((t) => t.at === at(2026, 11, 1, 0, 30));
    expect(november(kept)).toHaveLength(1);
    expect(into(november(kept)[0]!, checking(kept))).toBeLessThan(0);
    expect(november(lifted)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// health.week
// ---------------------------------------------------------------------------

/** Twins to the next Monday's week, one with a draw forced and one with nothing drawn, both rested and easy (TEST SETUP). */
function weekTwins(seed: string, from: number, draw: readonly number[]) {
  const make = (d: readonly number[]) => {
    const sim = student(seed);
    const force = forcing(sim);
    sim.advanceTo(from);
    const week = nextPending(sim, HEALTH_WEEK_KIND);
    forceWeek(sim, force, week.at, d); // TEST SETUP
    sim.advanceTo(week.at - 60_000);
    Object.assign(sim.player.wellbeing, { sleepDebt: 0, stress: 0 }); // TEST SETUP
    sim.advanceTo(week.at + 60_000);
    return { sim, week: week.at };
  };
  return { ill: make(draw), well: make(WEEK.nothing) };
}

describe('health.week', () => {
  it('PLAYER JOURNEY: the flu, seen at urgent care, is five days, 25 of condition and 30 of energy, a sick day called in and the work shown ill', () => {
    const { ill, well } = weekTwins(SEED.depressed, at(2026, 11, 29, 12), WEEK.fluSeen);
    expect(ill.week).toBe(at(2026, 11, 30, 9));
    // CDC's five days contagious.
    expect(healthOf(ill.sim.player).fluUntil).toBe(ill.week + 5 * MS_DAY);
    expect(healthOf(well.sim.player).fluUntil).toBeUndefined();
    // CARE.toll.flu, at an illness toll of 1.
    expect(well.sim.player.wellbeing.condition - ill.sim.player.wellbeing.condition).toBeCloseTo(25, 9);
    expect(well.sim.player.wellbeing.energy - ill.sim.player.wellbeing.energy).toBeCloseTo(30, 9);
    expect(titled(ill.sim, 'You Have The Flu').map((n) => n.body)).toEqual([expect.stringMatching(/^You saw a doctor for it at .+\. It lasts until December 5, 2026, and it has cost you some condition and energy\. Until it passes you can’t work out, and it holds back your voice and body work\. Each day until then, Call In Sick, on School’s Classes tab, can excuse that day at school\. There’s nothing to pay\.$/)]);
    expect(titled(well.sim, 'You Have The Flu')).toEqual([]);
    // Tuesday before classes: called in sick and excused, where the twin is refused and goes.
    for (const { sim } of [ill, well]) sim.advanceTo(at(2026, 12, 1, 7));
    const tally = (sim: Simulation) => ({ ...sim.player.school!.tally });
    const [ti, tw] = [tally(ill.sim), tally(well.sim)];
    expect(ill.sim.execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(true);
    expect(well.sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe('You’re well enough to go. Staying away would count as an unexcused absence.');
    for (const { sim } of [ill, well]) sim.advanceTo(at(2026, 12, 4, 18));
    expect([ill.sim.player.school!.tally.excused - ti.excused, well.sim.player.school!.tally.excused - tw.excused]).toEqual([1, 0]);
    // The week's work shown while it lasts is shown ill; the twin's isn't.
    const shown = (sim: Simulation) => (sim.player.work ?? []).filter((w) => w.at > ill.week && w.at < ill.week + 5 * MS_DAY);
    expect(shown(ill.sim).length).toBeGreaterThan(0);
    expect(shown(ill.sim).every((w) => (w.inputs.condition as { ill?: boolean }).ill === true)).toBe(true);
    expect(shown(well.sim).some((w) => (w.inputs.condition as { ill?: boolean }).ill === true)).toBe(false);
    // Past it, the sick day is refused again.
    ill.sim.advanceTo(at(2026, 12, 7, 7));
    expect(ill.sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe('You’re well enough to go. Staying away would count as an unexcused absence.');
  });

  it('PLAYER JOURNEY: a stay is three days in hospital, 40 of condition and of energy, $200, and the two days of classes it holds excused', () => {
    // Labor Day, when no class meets at nine to cost the twin in class what the one in hospital is spared.
    const { ill, well } = weekTwins(SEED.stay, at(2026, 9, 6, 12), WEEK.stay);
    expect(ill.week).toBe(at(2026, 9, 7, 9));
    expect(healthOf(ill.sim.player).inHospitalUntil).toBe(at(2026, 9, 10, 9));
    expect(well.sim.player.wellbeing.condition - ill.sim.player.wellbeing.condition).toBeCloseTo(40, 9);
    expect(well.sim.player.wellbeing.energy - ill.sim.player.wellbeing.energy).toBeCloseTo(40, 9);
    expect(titled(ill.sim, 'In Hospital')[0]!.body).toMatch(/^You’re in hospital for 3 days at .+\. Classes you miss while you’re there are excused\. You owe \$200\.00\. It’s taken from your checking account on October 7, 2026, and if there isn’t enough then, it becomes medical debt\.$/);
    expect(healthOf(ill.sim.player).bills.filter((b) => b.at === ill.week).map((b) => b.amount)).toEqual([200_00]);
    const tally = (sim: Simulation) => ({ ...sim.player.school!.tally });
    const [ti, tw] = [tally(ill.sim), tally(well.sim)];
    // The year's odds of the end read the condition at the next midnight (`frailty`, by quarter bands): the stay's 40
    // moves the band the twins shared, and the year is drawn again from it.
    expect(healthOf(ill.sim.player).endBand).toBe(healthOf(well.sim.player).endBand);
    for (const { sim } of [ill, well]) sim.advanceTo(at(2026, 9, 8, 1));
    expect(healthOf(ill.sim.player).endBand!).toBeGreaterThan(healthOf(well.sim.player).endBand!);
    for (const { sim } of [ill, well]) sim.advanceTo(at(2026, 9, 10, 18));
    // Tuesday and Wednesday in hospital, excused; Thursday at nine, out and in class.
    expect([ill.sim.player.school!.tally.excused - ti.excused, ill.sim.player.school!.tally.attended - ti.attended]).toEqual([2, 1]);
    expect([well.sim.player.school!.tally.excused - tw.excused, well.sim.player.school!.tally.attended - tw.attended]).toEqual([0, 3]);
  });

  it('PLAYER JOURNEY: an emergency keeps them Connecticut’s median 189 minutes, 20 of condition and of energy, and $50', () => {
    const { ill, well } = weekTwins(SEED.stay, at(2026, 9, 6, 12), WEEK.emergency);
    expect(ill.week).toBe(at(2026, 9, 7, 9));
    expect(healthOf(ill.sim.player).inHospitalUntil).toBe(ill.week + 189 * 60_000);
    expect(well.sim.player.wellbeing.condition - ill.sim.player.wellbeing.condition).toBeCloseTo(20, 9);
    expect(well.sim.player.wellbeing.energy - ill.sim.player.wellbeing.energy).toBeCloseTo(20, 9);
    expect(titled(ill.sim, 'The Emergency Room')[0]!.body).toMatch(/^You went to the emergency room at .+\. Classes you miss while you’re there are excused\. You owe \$50\.00\. It’s taken from your checking account on October 7, 2026, and if there isn’t enough then, it becomes medical debt\.$/);
    expect(healthOf(ill.sim.player).bills.filter((b) => b.at === ill.week).map((b) => b.amount)).toEqual([50_00]);
  });

  it('the week’s flu draw is 4.5 times likelier at ten hours’ sleep debt and full stress (2.5 × 1.8), as the clock draws it', () => {
    /** The week's chance for a rested, easy body: CDC's 8.9% a season, over this week's share of New Haven's flu (TEST SETUP: the draw's place). */
    const p = (week: number) => { const z = zonedParts(week, NY); return 1 - (1 - CARE.flu) ** fluByWeek('us-ct-newhaven')[weekOfYear(z.month, z.day)]!; };
    const caught = (debt: number, stress: number, times: number) => {
      const sim = student(SEED.depressedNov);
      const force = forcing(sim);
      sim.advanceTo(at(2026, 11, 29, 12));
      const week = nextPending(sim, HEALTH_WEEK_KIND).at;
      expect(p(week)).toBeGreaterThan(0);
      forceWeek(sim, force, week, [0.999, 0.999, 0.999, times * p(week), 0.999]); // TEST SETUP
      sim.advanceTo(week - 60_000);
      Object.assign(sim.player.wellbeing, { sleepDebt: debt, stress }); // TEST SETUP
      sim.advanceTo(week + 60_000);
      return healthOf(sim.player).fluUntil !== undefined;
    };
    // Twelve hours' debt is past the ten where it stops counting more; full stress is 100.
    expect([caught(12, 100, 4.4), caught(12, 100, 4.6)]).toEqual([true, false]);
    expect([caught(0, 0, 0.9), caught(0, 0, 1.1)]).toEqual([true, false]);
  });
});

// ---------------------------------------------------------------------------
// injury.comp
// ---------------------------------------------------------------------------

/**
 * PLAYER JOURNEY: an elective evening front of house at Yale Rep on Tuesday 1 September 2026, the first work of its week,
 * and a fall there (TEST SETUP: the draw forced to a broken bone, its fewest days, 42).
 */
function hurtAtAnElectiveShift() {
  const sim = student(SEED.comp);
  const force = forcing(sim);
  sim.advanceTo(at(2026, 8, 31, 12));
  const shift = sim.must<{ at: number; hours: number }>({ kind: 'school.take_shift', payload: {} });
  expect(shift).toEqual({ at: at(2026, 9, 1, 19), hours: 4 });
  force('health.injury', [sim.player.id, `usher-${shift.at}`], [0, 0.8, 0]); // TEST SETUP
  sim.advanceTo(shift.at + 5 * MS_HOUR);
  const injury = healthOf(sim.player).injury!;
  expect(injury).toMatchObject({ kind: 'fracture', at: shift.at, offWorkUntil: shift.at + 42 * MS_DAY, atWork: { stateId: 'us-ct', weeklyWage: 92_00 } });
  sim.advanceTo(injury.offWorkUntil! + MS_DAY);
  // The week's work-study pay, that Friday, was this shift's four hours at $23, paid whole: a student's pay bears no FICA,
  // and at these hours no federal tax is withheld. It's the week's wage, and the only pay since.
  expect(memos(sim, /^Work-study wages, /).map((t) => [t.memo.slice(0, 26), into(t, checking(sim))])).toEqual([['Work-study wages, 4 hours:', 92_00]]);
  return { sim, shift };
}
const comp = (sim: Simulation) => memos(sim, 'Workers’ compensation');

describe('injury.comp', () => {
  it('PLAYER JOURNEY: a broken bone at an elective shift is paid a week at a time for all 42 days off, into the payee account, once across a reload', () => {
    const { sim, shift } = hurtAtAnElectiveShift();
    // Paid 75% of the whole week’s $92, Connecticut’s least for a week that small. Until 2026-10-13 the notice said “75% of
    // your week’s wage after tax”, which it wasn’t, and this test held that.
    expect(titled(sim, 'A Broken Bone')[0]!.body).toBe('It takes 42 days to mend, until October 13, 2026. You’re laid up until then, kept from classes, work and training. What you miss at school is excused. It happened at work, so workers’ compensation pays for the care, and 75% of your week’s wage while you’re off.');
    // Its care is the employer’s: no bill.
    expect(healthOf(sim.player).bills.filter((b) => b.what.startsWith('A Broken Bone'))).toEqual([]);
    // Off more than Connecticut's six days, no waiting days: every one of the 42, a full week's rate each week.
    const paid = comp(sim);
    expect(paid.map((t) => t.at)).toEqual([1, 2, 3, 4, 5, 6].map((w) => shift.at + w * 7 * MS_DAY));
    // A week's rate is 75% of the $92 after tax: no more than 75% of all of it, $69.00, and no less than 75% of it less the
    // most a $92 week could bear here, FICA's 7.65% and no income tax, $63.72. The test below holds it to the first;
    // until 2026-10-13 it was the second, a defect fixed that day.
    const week = into(paid[0]!, payeeAccount(sim, sim.player).id);
    expect(week).toBeGreaterThanOrEqual(Math.round(0.75 * (92_00 - Math.round(92_00 * 0.0765))));
    expect(week).toBeLessThanOrEqual(Math.round(0.75 * 92_00));
    expect(paid.map((t) => into(t, payeeAccount(sim, sim.player).id))).toEqual(Array(6).fill(week));
    expect(paid.map((t) => into(t, sim.nominalAccount('income', 'Workers’ Compensation').id))).toEqual(Array(6).fill(-week));
    expect(healthOf(sim.player).injury!.atWork!.paidDays).toBe(42);
    expect(sim.universe.scheduled.some((i) => i.kind === COMP_KIND && i.status === 'pending')).toBe(false);
    const again = reload(sim);
    again.advanceBy(21 * MS_DAY);
    expect(comp(again)).toHaveLength(6);
  });

  it('the week’s rate is 75% of the $92 paid with nothing deducted from it, $69.00, not less a FICA that was never withheld', () => {
    const { sim } = hurtAtAnElectiveShift();
    // CGS 31-307: 75% of the average weekly earnings after the deductions for tax and FICA made from the wages. None was
    // made from this $92, as the Friday's posting shows.
    expect(comp(sim).map((t) => into(t, payeeAccount(sim, sim.player).id))).toEqual(Array(6).fill(Math.round(0.75 * 92_00)));
  });

  it('hurt at the second of two elective shifts in a week, the wage it records is the week’s $184, not the shift’s $92', () => {
    const sim = student(SEED.depressedDec);
    const force = forcing(sim);
    sim.advanceTo(at(2026, 8, 31, 12));
    const first = sim.must<{ at: number }>({ kind: 'school.take_shift', payload: {} });
    const second = sim.must<{ at: number }>({ kind: 'school.take_shift', payload: {} });
    expect([first.at, second.at]).toEqual([at(2026, 9, 1, 19), at(2026, 9, 2, 19)]);
    force('health.injury', [sim.player.id, `usher-${second.at}`], [0, 0.8, 0]); // TEST SETUP
    sim.advanceTo(at(2026, 9, 4, 18));
    // That Friday pays the week's eight hours, $184: the week's wage, which the notice promises 75% of after tax.
    expect(memos(sim, /^Work-study wages, 8 hours/).map((t) => into(t, checking(sim)))).toEqual([184_00]);
    expect(healthOf(sim.player).injury!.atWork!.weeklyWage).toBe(184_00);
  });
});
