/**
 * Evidence for five life rows still partial after the first round of 2026-10-13 (batch b03 of the second round, the
 * same day): the holidays, injuries, the body, the end of a life, and the ten knobs of the receipts row. The first
 * round's files (`evidence-g07-life`, `evidence-g08-life`, `evidence-g09-life`) closed most of each row; what's here is
 * what its skeptic found still open, closed through the command a player sends or the clock that carries them, each
 * consequence read where the row says it's read, against figures worked out from the rule's own numbers or a published
 * source and written as literals, never asked of the helper the engine computes them with.
 *
 * - holidays: Connecticut's own Good Friday (26 March 2027, which New York, where she was born, doesn't keep) is on
 *   New Haven's Calendar and no other state's day is; a doctor's visit whose 24-day wait ends on it goes to Monday 29
 *   March (Fair Haven's wait, which she picks: from 2026-10-15 a Yale Health member with nothing picked is booked at its
 *   own practice the next weekday, and her visit at Fair Haven is billed as the uninsured's, $187.20 in 2027), and a meal paid by debit card the day before it posts on that Monday, since a US bank keeps the Federal
 *   Reserve's days and not the state's. Thanksgiving crossed through each reader the first round's correction named and
 *   left untested: a lost debit card replaced in Chase's seven business days (Monday 7 December, not Friday 4), its rush
 *   in two (Monday 30 November); Bank of America's two days of review (Monday 30 November) and Chase's three to send
 *   the opening deposit (Tuesday 1 December); Chase's Overdraft Assist, whose next business day is the Friday, so
 *   Friday’s work-study wages spare the fee, and a deeper overdraft is charged at Friday’s end, not Thursday’s; and
 *   Thanksgiving’s own groceries, which Chase posts on the Friday, at Monday’s end (from the third round of 2026-10-13:
 *   until then at Friday’s, a business day short). Round-ups
 *   at Bank of America wait out Martin Luther King Jr. Day (LIFE FIXTURE, a New Haven life at Bank of America: a
 *   student banks at Chase, which rounds nothing up), and a missed enrolment in London is booked again before Good
 *   Friday and Easter Monday (LIFE FIXTURE and TEST SETUP: nothing has booked a paper visit since 2026-10-09).
 * - injuries: the uninsured sprain's $699.13, worked here from CARE's $180 and $100, the Bureau of Labor Statistics'
 *   physicians' services index (439.389 in August 2026 over 417.93 in 2024) and the 1.75 the uninsured are billed; and a
 *   student refused Canada's EI, which `eiWeek` pays from, in its own words.
 * - body: the weight the game moved read by the end's draw (`bmiHazard`): an 86th birthday's year drawn at the Lancet's
 *   1.13 for a twin fed at BMI 18.55 and 1.51 for her twin five broke days lighter, under 18.5; read by a condition's
 *   onset: diabetes begins on 1 October for a twin at BMI 30.5 and not for her twin a month of broke days took to 29.4;
 *   and twenty days ordered in against twenty eaten in, 134 kcal a day at Hall's pace, his 23.9 a kilogram spent back.
 * - mortality: a redraw reads the body as it is at the midnight: 2.93 times the table for a body worn to nothing and
 *   1.55 for one worn by half, each from the condition the midnight left, and each seed's end at the instant its own
 *   draw names; and the end screen for a life whose birthday drew its end, the end that came being that one, what she
 *   left being every account she held, and her one payslip's six hours at $23.00. One defect, failing when written: a
 *   life ended a month in was counted "1 Months", until `LifeEnded` said "1 Month" on 2026-10-13.
 * - knob:receipts|…: the hour's fit at its edges (11:59 and noon, 4:59 and five) through `school.prepare`; the morning
 *   read by the first class's growth and by the work judged at nine on 8 September, the evening by the first Cabaret
 *   night's; a detached player's slower warmth keeping a co-lead under a Friend where her plain twin's makes one, read by
 *   the cast list's lift, the classmate's look and the first Carlotta night's company; and a slight cut deeper making a
 *   Rival on the look. Receipts stayed open (nothing in play wrote the job costs it multiplied) until 2026-10-14, when
 *   the owner had the knob go.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actress at Yale in
 * New Haven from Monday 24 August 2026 at 7:30 AM, every disposition at the middle, played by the clock to each moment
 * named. The lives an end is drawn for are born in 1940, the earliest year creation's field offers (the first round's
 * were born in 1931, typed past it): 86 at a birthday in August 2026. The onset's twins are born in 1976: fifty. LIFE
 * FIXTURES, said where used: a New Haven life outside the school (`quickSave`, uninsured, or at Bank of America) and a
 * London life. Seeds were chosen by reading the engine's own random stream for the draw a test stands on (`rngFor`, as
 * the engine keys it), and each test asserts the draw it chose for against the rule's chance, worked here.
 *
 * TEST SETUP, said again where it's done: dials set before an action or a moment (condition, energy, stress, sleep,
 * nourishment, morale, hygiene); balances set by a posting against a test equity line, and a card locked by its own
 * command; the calendar cleared of what wants the player before a meal; a doctor's visit owed put on the record; a
 * classmate's bond set before the spring cast list, and set to nothing on a reload before a curtain as the night's
 * control; a London life's visa with its enrolment booked, as a save from before 2026-10-09 has one; the US and UK
 * holiday files read from disk, as the app fetches them when a save opens.
 */
import { describe, expect, it, vi } from 'vitest';
import { attributesOf } from '@/engine/systems/attributes';
import { readFileSync } from 'node:fs';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Personality } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { rngFor } from '@/engine/core/rng';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { healthOf } from '@/engine/systems/health';
import { activity } from '@/engine/systems/statements';
import { overdraftHeadroom } from '@/engine/systems/lending';
import { END_KIND } from '@/engine/systems/mortality';
import { BIRTHDAY_KIND } from '@/engine/systems/birthdays';
import { CABARET_KIND } from '@/engine/systems/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { documentsOf, type PersonDocument } from '@/engine/systems/documents';
import { VISITS, VISIT_KIND } from '@/engine/systems/papervisits';
import { addCountryHolidays } from '@/engine/content/holidays';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value. */
  states: [] as unknown[],
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  exits: 0,
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    return [h.states.shift(), set];
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

// Without the original: it imports the looks, which import it back. Back To The Slots is `exitToMenu`, counted here.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    exitToMenu: () => { h.exits += 1; },
    toast: noop,
    navigate: noop,
    route: '/home',
    breadcrumbs: [],
    toasts: [],
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { CalendarWorkspace } = await import('@/ui/workspaces/CalendarWorkspace');
const { GameShell } = await import('@/ui/shell/GameShell');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
const { at: subject } = await import('@/ui/looks/subject');

// TEST SETUP: the holiday files the app fetches for a save's countries when it opens (`loadPlacesFor`), read from disk.
const US_TSV = readFileSync('public/holidays/us.tsv', 'utf8');
addCountryHolidays('us', US_TSV);
addCountryHolidays('uk', readFileSync('public/holidays/uk.tsv', 'utf8'));

// ---------------------------------------------------------------------------
// Lives, moments, and the screens over them
// ---------------------------------------------------------------------------

const MIDDLE: Personality = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 };
/** A new life: Ada Cole, born in New York, an actress at Yale in New Haven from Monday 24 August 2026, 7:30 AM. */
const student = (seed: string, extra: Partial<NewSaveConfig> = {}, traits: string[] = []): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personality: MIDDLE, personalityTraits: traits, ...extra });
/** The same student born on a day of 1940, the earliest year creation's field offers: 160 cm and 60 kg unless said. */
const elder = (seed: string, month: number, day: number, extra: Partial<NewSaveConfig> = {}): Simulation =>
  student(seed, { birthYear: 1940, birthMonth: month, birthDay: day, heightCm: 160, weightKg: 60, ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const ID = 'person_000001';
/** The engine's own stream for a draw, as it keys it: what a seed was chosen by. */
const draws = (seed: string, stream: string, key: string, n: number): number[] => { const r = rngFor(seed, stream, ID, key); return Array.from({ length: n }, () => r.next()); };
const MS_YEAR = 365.2425 * MS_DAY;
/** An instant in New Haven in 2026 on Eastern Daylight Time (UTC−4), worked out here, not by the engine. */
const EDT = (month: number, day: number, hour: number, minute = 0): number => Date.UTC(2026, month - 1, day, hour + 4, minute);

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: an account's balance set, against a test equity line. */
function setBalance(sim: Simulation, accountId: string, to: number): void {
  const by = to - sim.universe.accounts[accountId]!.balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/**
 * TEST SETUP: nothing left to pay with: every account of hers emptied, the current account's overdraft drawn to its
 * limit, and the credit card locked by its own command.
 */
function broke(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.kind !== 'credit_card' && a.kind !== 'loan' && a.balance > 0) setBalance(sim, a.id, 0);
  setBalance(sim, sim.player.primaryAccountId!, -overdraftHeadroom(sim, sim.player));
  sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: true } });
}
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending');
const mine = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal);
const memo = (sim: Simulation, m: string) => sim.universe.transactions.filter((t) => t.memo === m);
const postedTo = (sim: Simulation, m: string, accountId: string) => memo(sim, m).map((t) => ({ at: t.at, amount: t.postings.find((p) => p.accountId === accountId)?.amount }));

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** A screen as the player has it. */
function drawn(sim: Simulation, screen: FunctionComponent): { text: string; buttons: typeof h.buttons } {
  h.sim = sim;
  h.buttons = [];
  h.states = [];
  const html = renderToStaticMarkup(createElement(screen));
  return { text: onScreen(html), buttons: h.buttons };
}
/** A classmate's look, as the player opens it from the School screen: its one-line summary. */
const classmateSays = (sim: Simulation, i: number): string => { h.sim = sim; return (resolveLook(sim, subject('classmate', String(i))) as { summary: string }).summary; };

// ---------------------------------------------------------------------------
// holidays
// ---------------------------------------------------------------------------

/** Wednesday 25 November 2026, noon in New Haven (EST, UTC−5): the day before Thanksgiving. */
const WEDNESDAY = Date.UTC(2026, 10, 25, 17);

describe('holidays', () => {
  it('PLAYER JOURNEY: New Haven’s Calendar in March 2027 has Connecticut’s Good Friday and no other state’s day, though she was born in New York, which doesn’t keep it', () => {
    // The dataset's Good Friday in 2027 is a public holiday in nine states, Connecticut among them, New York not.
    const goodFriday = US_TSV.split(/\r?\n/).filter((l) => l.startsWith('2027-03-26\tGood Friday\t')).map((l) => l.split('\t')[4]);
    expect(goodFriday).toContain('CT');
    expect(goodFriday).not.toContain('NY');
    const sim = student('b03-hol-cal');
    sim.advanceTo(Date.UTC(2027, 2, 2, 14)); // 9:00 AM EST on Tuesday 2 March 2027, played from August
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    const text = drawn(sim, CalendarWorkspace).text;
    expect(text).toContain('March 2027');
    expect(text).toContain('Good Friday');
    expect(text).toContain('Easter Sunday');
    // Other states' days that month: Illinois', Vermont's, Texas', Massachusetts', Hawaii's, Alaska's, California's.
    for (const elsewhere of ['Casimir Pulaski', 'Town Meeting Day', 'Texas Independence', 'Evacuation Day', 'Kuhio', 'Seward', 'Chávez', 'Chavez']) expect(text, elsewhere).not.toContain(elsewhere);
  });

  it('PLAYER JOURNEY: a doctor’s visit whose 24-day wait ends on Good Friday is booked for Monday 29 March, and kept; a meal paid by debit card the day before posts that Monday, the bank keeping the Federal Reserve’s days', () => {
    const sim = student('b03-hol-gf');
    sim.advanceTo(Date.UTC(2027, 2, 2, 13)); // 8:00 AM EST on Tuesday 2 March 2027
    for (const a of [...(healthOf(sim.player).appointments ?? [])]) sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: a.id } });
    healthOf(sim.player).owedVisit ??= 'A doctor’s visit'; // TEST SETUP
    // Fair Haven picked, as Your Doctor's command sends it. Until 2026-10-15 she was booked there with nothing picked;
    // that day Yale Health's rule that a member's care is had at its Health Center was kept, and with nothing picked a
    // member is booked at Yale Health the next weekday. This journey's point is Fair Haven's 24-day wait, so she picks it.
    sim.must({ kind: 'health.choose_clinic', payload: { clinicId: 'us-ct-fhchc-grand' } });
    // AMN Healthcare's 23.5 days, to 24: Friday 26 March, Good Friday in Connecticut, then the weekend: 10:00 AM EDT
    // on Monday 29 March (clocks went forward on 14 March).
    expect(sim.must<{ at: number }>({ kind: 'health.book', payload: {} }).at).toBe(Date.UTC(2027, 2, 29, 14));
    expect(notices(sim, 'A Doctor’s Appointment').at(-1)!.body).toContain('for March 29, 2027, the usual wait where you live.');
    // Thursday 25 March at 7 PM EDT: a meal by debit card. Chase's two business days: Good Friday is one of them, as the
    // Federal Reserve keeps it as one, then Monday. Were the state's holiday the bank's, it would post on Tuesday 30.
    sim.advanceTo(Date.UTC(2027, 2, 25, 23));
    sim.player.wellbeing.nourishment = 30; // TEST SETUP
    const n = sim.universe.transactions.length;
    sim.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    const meal = sim.universe.transactions.slice(n).find((t) => t.memo === 'A meal')!;
    expect(meal.postsAt).toBe(Date.UTC(2027, 2, 29, 23));
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const line = (s: Simulation) => activity(s, s.universe.accounts[checking.id]!, meal.at, meal.at + 1).lines.find((l) => l.id === meal.id)!;
    sim.advanceTo(Date.UTC(2027, 2, 27, 0)); // Good Friday evening: still pending
    expect(line(sim).pending).toBe(true);
    // The visit: kept on the Monday, across a reload, at the practice it was booked at, and off her list.
    const again = reload(sim);
    again.advanceTo(Date.UTC(2027, 2, 29, 14) + 60_000);
    expect(again.universe.scheduled.filter((i) => i.kind === 'health.appointment' && i.at === Date.UTC(2027, 2, 29, 14)).map((i) => i.status)).toEqual(['done']);
    // Until 2026-10-15 it was Yale Health's $0, "Nothing to pay."; from that day Yale Health pays none of a member's
    // visit outside its Health Center, and Fair Haven, publishing no fee, bills SLATE's uninsured price: $100 of 2024
    // grown by the physicians' services index to 2027, the last print (439.389, 2026) carried on at 1.75% a year:
    // 10,000 × 439.389 × 1.0175 ÷ 417.93 = 10,697.44, 10,697 cents, times 1.75 = 18,719.75, $187.20, due in 30 days.
    expect(notices(again, 'A Doctor’s Visit').filter((x) => x.at === Date.UTC(2027, 2, 29, 14)).map((x) => x.body)).toEqual(['A doctor’s visit, Fair Haven Community Health Care. Yale Health pays for a visit only at its own Health Center, not here. You owe $187.20. It’s taken from your checking account on April 28, 2027, and if there isn’t enough then, it becomes medical debt.']);
    expect(healthOf(again.player).bills.filter((b) => b.at === Date.UTC(2027, 2, 29, 14)).map((b) => [b.amount, b.covered])).toEqual([[187_20, undefined]]);
    expect((healthOf(again.player).appointments ?? []).filter((a) => a.what === 'A doctor’s visit')).toEqual([]);
    again.advanceTo(Date.UTC(2027, 2, 29, 23) + 1000);
    expect(line(again).pending).toBeUndefined();
  });

  it('PLAYER JOURNEY: a debit card reported lost the day before Thanksgiving comes in Chase’s seven business days on Monday 7 December, rushed in two on Monday 30 November, and the card stopped meanwhile pays nothing', () => {
    const standard = student('b03-hol-card');
    const rushed = student('b03-hol-card');
    for (const s of [standard, rushed]) s.advanceTo(WEDNESDAY);
    // Thursday is Thanksgiving: Friday 27, then 30 November and 1, 2, 3, 4 and 7 December. Rushed: Friday and Monday.
    expect(standard.must<{ arrivesAt: number; fee: number }>({ kind: 'card.report', payload: { which: 'debit', why: 'lost' } })).toEqual({ arrivesAt: Date.UTC(2026, 11, 7, 17), fee: 0 });
    expect(rushed.must<{ arrivesAt: number; fee: number }>({ kind: 'card.report', payload: { which: 'debit', why: 'lost', rush: true } })).toEqual({ arrivesAt: Date.UTC(2026, 10, 30, 17), fee: 15_00 });
    const checking = standard.player.primaryAccountId!;
    const credit = mine(standard).find((a) => a.kind === 'credit_card')!.id;
    // Friday 4 December, 6 PM: the card still stopped, a meal goes on the credit card.
    standard.advanceTo(Date.UTC(2026, 11, 4, 23));
    expect(standard.universe.accounts[checking]!.plastic!.stopped).toBe('lost');
    clearCalendar(standard); // TEST SETUP
    standard.player.wellbeing.nourishment = 30; // TEST SETUP
    standard.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(postedTo(standard, 'A meal', credit).filter((m) => m.at === Date.UTC(2026, 11, 4, 23))).toEqual([{ at: Date.UTC(2026, 11, 4, 23), amount: -5_00 }]);
    // The new card arrives on Monday 7 December at noon, across a reload, and the next meal is the debit card's.
    const again = reload(standard);
    again.advanceTo(Date.UTC(2026, 11, 7, 17) - 60_000);
    expect(again.universe.accounts[checking]!.plastic!.stopped).toBe('lost');
    again.advanceTo(Date.UTC(2026, 11, 7, 23));
    expect(again.universe.accounts[checking]!.plastic!.stopped).toBeUndefined();
    clearCalendar(again); // TEST SETUP
    again.player.wellbeing.nourishment = 30; // TEST SETUP
    again.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(postedTo(again, 'A meal', checking).filter((m) => m.at === Date.UTC(2026, 11, 7, 23))).toEqual([{ at: Date.UTC(2026, 11, 7, 23), amount: -5_00 }]);
    rushed.advanceTo(Date.UTC(2026, 10, 30, 17) + 60_000);
    expect(rushed.universe.accounts[checking]!.plastic!.stopped).toBeUndefined();
  });

  it('PLAYER JOURNEY: Bank of America decides an application made the day before Thanksgiving in its two business days, on Monday 30 November, and the $100 sent from Chase arrives in Chase’s three, on Tuesday 1 December', () => {
    const sim = student('b03-hol-boa');
    sim.advanceTo(WEDNESDAY);
    const chase = sim.player.primaryAccountId!;
    const had = sim.universe.accounts[chase]!.balance;
    const opened = sim.must<{ decidedAt: number; arrivesAt: number }>({ kind: 'bank.open_current', payload: { bankId: 'us-bank-of-america', fundFrom: chase, amount: 100_00 } });
    // "Processed in 1 to 2 business days": Friday 27 and Monday 30. Chase's 2-3 business days, the longer: Friday,
    // Monday and Tuesday 1 December. Thanksgiving is neither bank's day.
    expect(opened).toEqual({ decidedAt: Date.UTC(2026, 10, 30, 17), arrivesAt: Date.UTC(2026, 11, 1, 17) });
    expect(sim.universe.accounts[chase]!.balance).toBe(had - 100_00);
    const boa = (s: Simulation) => mine(s).find((a) => a.bankId === 'us-bank-of-america' && a.kind === 'checking');
    sim.advanceTo(Date.UTC(2026, 10, 30, 17) - 60_000);
    expect(boa(sim)).toBeUndefined();
    const again = reload(sim);
    again.advanceTo(Date.UTC(2026, 10, 30, 17) + 60_000);
    expect(boa(again)).toBeDefined();
    expect(boa(again)!.balance).toBe(0);
    expect(notices(again, 'Bank of America Opened Your Account').map((x) => x.at)).toEqual([Date.UTC(2026, 10, 30, 17)]);
    const boaId = boa(again)!.id;
    again.advanceTo(Date.UTC(2026, 11, 1, 17) - 60_000);
    expect(postedTo(again, 'From Chase Total Checking', boaId)).toEqual([]);
    again.advanceTo(Date.UTC(2026, 11, 1, 17) + 60_000);
    expect(postedTo(again, 'From Chase Total Checking', boaId)).toEqual([{ at: Date.UTC(2026, 11, 1, 17), amount: 100_00 }]);
  });

  it('PLAYER JOURNEY: Chase’s Overdraft Assist waits for the end of Friday, the business day after Thanksgiving: Friday’s work-study wages spare the fee, and a deeper overdraft is charged Wednesday’s at Friday’s end, not Thursday’s, and Thanksgiving’s groceries, posted on the Friday, at Monday’s', () => {
    /** Overdrawn on Wednesday at 4 PM by a meal ordered in, from a balance set by hand (TEST SETUP), Debit Card Coverage on. */
    const overdrawn = (from: number) => {
      const sim = student('b03-hol-od');
      sim.advanceTo(Date.UTC(2026, 10, 25, 21));
      clearCalendar(sim); // TEST SETUP
      sim.must({ kind: 'bank.debit_overdraft', payload: { on: true } });
      setBalance(sim, sim.player.primaryAccountId!, from); // TEST SETUP
      sim.player.wellbeing.nourishment = 30; // TEST SETUP
      sim.must({ kind: 'life.look_after', payload: { action: 'order' } });
      return sim;
    };
    const fees = (s: Simulation) => postedTo(s, 'Overdraft fee', s.player.primaryAccountId!);
    // From −$20.00, the $34.65 order leaves her $54.65 overdrawn, past the $50 Chase lets go.
    const shallow = overdrawn(-20_00);
    const checking = shallow.player.primaryAccountId!;
    expect(shallow.universe.accounts[checking]!.balance).toBe(-54_65);
    expect(shallow.universe.accounts[checking]!.pendingItems).toEqual([{ day: '2026-11-25', count: 1 }]);
    // Friday's six hours at the Bulletin's $23.00, paid at 5 PM, bring her back inside $50 before Friday ends.
    shallow.advanceTo(Date.UTC(2026, 10, 28, 5) + 1000);
    expect(postedTo(shallow, 'Work-study wages, 6 hours: David Geffen School of Drama at Yale University', checking).filter((m) => m.at > WEDNESDAY)).toEqual([{ at: Date.UTC(2026, 10, 27, 22), amount: 138_00 }]);
    expect(fees(shallow)).toEqual([]);
    // Thanksgiving’s groceries, which Chase posts in Friday’s processing, and Friday’s own item are Friday’s business
    // day’s, which ended inside $50 too, so nothing is held past it: Chase charges no fee overdrawn by $50 or less at the
    // end of the business day. Until the third round of 2026-10-13 this held Friday’s alone here, Thursday’s having been
    // dated its own day and let go with Wednesday’s (defect 54); and until later that day the two were held here for
    // Monday’s end, the end of their own day not read (found by that day’s loose ends).
    expect(shallow.universe.accounts[checking]!.pendingItems).toBeUndefined();
    // From −$150.00 the wages leave her past $50 still: Wednesday’s item, $34, at midnight into Saturday, when Friday has
    // ended. A bank that counted Thursday would have charged it at midnight into Friday. Thanksgiving’s groceries and
    // Friday’s item, Friday’s business day’s, each $34 at midnight into Tuesday, when Monday has ended still past $50.
    // Until the third round of 2026-10-13 this held Thanksgiving’s charged with Wednesday’s at Friday’s end (defect 54).
    const deep = overdrawn(-150_00);
    deep.advanceTo(Date.UTC(2026, 10, 28, 5) - 1000);
    expect(fees(deep)).toEqual([]);
    const again = reload(deep);
    again.advanceTo(Date.UTC(2026, 10, 29, 12));
    expect(fees(again)).toEqual([{ at: Date.UTC(2026, 10, 28, 5), amount: -34_00 }]);
    expect(again.universe.accounts[checking]!.pendingItems![0]).toEqual({ day: '2026-11-27', count: 2 });
    again.advanceTo(Date.UTC(2026, 11, 1, 5) - 1000);
    expect(fees(again)).toHaveLength(1);
    again.advanceTo(Date.UTC(2026, 11, 1, 5) + 1000);
    expect(again.universe.accounts[checking]!.balance).toBeLessThan(-50_00);
    expect(fees(again)).toEqual([{ at: Date.UTC(2026, 10, 28, 5), amount: -34_00 }, { at: Date.UTC(2026, 11, 1, 5), amount: -34_00 }, { at: Date.UTC(2026, 11, 1, 5), amount: -34_00 }]);
  });

  it('LIFE FIXTURE (a New Haven life at Bank of America): round-ups move at a business day’s end, so Saturday’s to Martin Luther King Jr. Day’s wait for the end of Tuesday 20 January', () => {
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'comfortable', bankId: 'us-bank-of-america', personality: MIDDLE, personalityTraits: [] }, 'b03-hol-ru');
    const checking = sim.player.primaryAccountId!;
    expect(sim.universe.accounts[checking]!.bankId).toBe('us-bank-of-america');
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'debit' } });
    sim.must({ kind: 'bank.set_round_ups', payload: { on: true } });
    // A meal ordered in at 1 PM EST each day from Friday 16 to Tuesday 20 January 2026, $34.65 on the debit card: 35¢
    // to the next dollar each.
    for (const day of [16, 17, 18, 19, 20]) {
      sim.advanceTo(Date.UTC(2026, 0, day, 18));
      sim.player.wellbeing.nourishment = 30; // TEST SETUP
      sim.must({ kind: 'life.look_after', payload: { action: 'order' } });
      expect(postedTo(sim, 'A meal delivered', checking).at(-1)).toEqual({ at: Date.UTC(2026, 0, day, 18), amount: -34_65 });
    }
    sim.advanceTo(Date.UTC(2026, 0, 23, 12));
    // Friday's at the end of Friday; nothing at the ends of Saturday, Sunday and the holiday; four days' at Tuesday's.
    expect(postedTo(sim, 'Round-ups', checking).filter((m) => m.at > Date.UTC(2026, 0, 16))).toEqual([
      { at: Date.UTC(2026, 0, 17, 5), amount: -35 },
      { at: Date.UTC(2026, 0, 21, 5), amount: -4 * 35 },
    ]);
  });

  it('LIFE FIXTURE (London, a visa’s enrolment booked as a save from before 2026-10-09 has it): slept through on 26 March 2026, it’s booked again for Thursday 2 April, the last business day before the warning’s tenth, past Good Friday and Easter Monday', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy', personality: MIDDLE, personalityTraits: [] }, 'b03-hol-ldn');
    sim.advanceTo(Date.UTC(2026, 2, 20, 12));
    // TEST SETUP: a Global Talent visa pending, its UKVCAS enrolment at 10 AM GMT on Thursday 26 March.
    const at = Date.UTC(2026, 2, 26, 10);
    const doc = { id: 'gt-visa', kind: 'visa', issuer: 'GB', name: 'Global Talent Visa', number: 'GT1', status: 'pending', appliedAt: sim.now, readyAt: at, destination: 'GB', visit: { rule: 'uk-enrolment-home', at, cityId: sim.player.currentLocationId } } as PersonDocument;
    documentsOf(sim.player).push(doc);
    sim.schedule({ at, kind: VISIT_KIND, label: VISITS['uk-enrolment-home'].what, category: 'personal', priority: 33, requiresPlayer: true, durationMinutes: 60, locationId: sim.player.currentLocationId, payload: { personId: sim.player.id, documentId: doc.id } });
    // Asleep from 6 AM for six hours, through the ten o'clock.
    sim.advanceTo(Date.UTC(2026, 2, 26, 6));
    sim.player.wellbeing.energy = 20; // TEST SETUP: tired enough to sleep
    sim.must({ kind: 'life.sleep', payload: { hours: 6 } });
    expect(doc.visit!.missed).toBe(1);
    // The Home Office's ten days from the miss end on Sunday 5 April; Easter Monday and Good Friday aren't business
    // days, so the last ten o'clock by then is Thursday 2 April's, in British Summer Time.
    expect(doc.visit!.at).toBe(Date.UTC(2026, 3, 2, 9));
    expect(notices(sim, 'An Appointment Missed').map((n) => n.body)).toEqual(['You missed your biometrics at a UKVCAS service point for your Global Talent Visa. It’s booked again for April 2, 2026, your last chance before the application ends.']);
    const again = reload(sim);
    again.advanceTo(Date.UTC(2026, 3, 2, 9) + 60_000);
    const kept = documentsOf(again.player).find((d) => d.id === 'gt-visa')!;
    expect(kept.visit!.keptAt).toBe(Date.UTC(2026, 3, 2, 9));
    expect(notices(again, 'Biometrics Done')).toHaveLength(1);
    // Its words, the visit named in a sentence with its acronym kept (brief 15, 2026-10-19).
    expect(notices(again, 'Biometrics Done').map((n) => n.body)).toEqual(['You went to your biometrics at a UKVCAS service point for your Global Talent Visa. It’s decided on April 2, 2026.']);
  });
});

// ---------------------------------------------------------------------------
// injuries
// ---------------------------------------------------------------------------

describe('injuries', () => {
  it('LIFE FIXTURE (New Haven, uninsured): an everyday sprain’s care is $699.13, worked from CARE’s $180 and $100 grown by the BLS physicians’ services index and the 1.75 the uninsured are billed, and paid once at its due date', () => {
    const seed = 'g07-ev-287';
    const midnight = Date.UTC(2026, 0, 6, 5);
    // The seed: a fall at the NHIS's 26.11 a thousand a year, drawn on the first midnight.
    expect(draws(seed, 'health.injury', `fall-${midnight}`, 1)[0]).toBeLessThan(26.11 / 1000 / 365);
    // Urgent care and two sessions of therapy, each a commercial price of 2024 (urgent $180, a visit $100) grown to
    // 2026 by CPI-U physicians' services, CUUR0000SEMC01 (417.93, the 2024 average; 439.389, August 2026), to the cent,
    // then the uninsured's 1.75 of it, to the cent: $189.24 → $331.17, and $105.13 → $183.98.
    const priced = (cents: number) => Math.round(Math.round(cents * 439.389 / 417.93) * 1.75);
    expect(priced(180_00)).toBe(331_17);
    expect(priced(100_00)).toBe(183_98);
    const care = priced(180_00) + 2 * priced(100_00);
    expect(care).toBe(699_13);
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'scraping', personality: MIDDLE, personalityTraits: [] }, seed);
    sim.advanceTo(midnight + 1000);
    expect(healthOf(sim.player).injury).toMatchObject({ kind: 'sprain', at: midnight });
    // Named in sentence case, as every other bill is, from 2026-10-13: until then “A Sprained Ankle: its care”.
    expect(healthOf(sim.player).bills.map((b) => ({ what: b.what, amount: b.amount, dueAt: b.dueAt }))).toEqual([{ what: 'A sprained ankle’s care', amount: care, dueAt: midnight + 30 * MS_DAY }]);
    expect(notices(sim, 'A Sprained Ankle')[0]!.body).toBe('It takes 10 days to mend, and you can’t work out until then. You owe $699.13 for its care. It’s taken from your checking account on February 5, 2026, and if there isn’t enough then, it becomes medical debt.');
    const again = reload(sim);
    setBalance(again, again.player.primaryAccountId!, 2_000_00); // TEST SETUP: enough in checking when it falls due
    again.advanceTo(midnight + 31 * MS_DAY);
    expect(postedTo(again, 'Medical bill: A sprained ankle’s care', again.player.primaryAccountId!)).toEqual([{ at: midnight + 30 * MS_DAY, amount: -care }]);
  });

  it('PLAYER JOURNEY: Canada’s EI, which a week laid up would draw on (`eiWeek`), is refused a New Haven student in its own words, nothing registered', () => {
    const sim = student('b03-ei');
    const was = serialise(sim.universe);
    expect(sim.execute({ kind: 'benefits.ei_register', payload: {} }).error).toBe('EI is for someone living in Canada.');
    expect(sim.player.ei).toBeUndefined();
    expect(serialise(sim.universe)).toBe(was);
  });
});

// ---------------------------------------------------------------------------
// body
// ---------------------------------------------------------------------------

/**
 * The US 2024 life table at 86, log-linear between its 85 and 90 (CDC NCHS, United States Life Tables, 2024, as
 * mortality.ts's own rule reads it): 0.078467 × (0.138036 / 0.078467)^(1/5) = 0.08785.
 */
const AT_86 = 0.078467 * (0.138036 / 0.078467) ** (1 / 5);
/** A share of a year's chance for a share of a year: 1 − (1 − q)^share. */
const over = (q: number, from: number, to: number) => 1 - (1 - q) ** ((to - from) / MS_YEAR);

describe('body', () => {
  // Born 30 August 1940, 160 cm and 47.5 kg as creation takes them (BMI 18.55, the Lancet 2016's 18.5–20 band, 1.13):
  // eighty-six at 9 AM EDT on Sunday 30 August 2026, six days in.
  const BIRTHDAY = EDT(8, 30, 9);
  const NEXT = Date.UTC(2027, 7, 30, 13);
  const FED = over(AT_86 * 0.8 * 1.13, BIRTHDAY, NEXT);
  const STARVED = over(AT_86 * 0.8 * 1.51, BIRTHDAY, NEXT);

  it('PLAYER JOURNEY: an 86th birthday draws the year from the weight the game moved: five broke days take a twin under BMI 18.5 to the Lancet’s 1.51, and a seed between the two chances ends only her year', () => {
    /** The twins of a seed: one fed, one broke from the first morning (TEST SETUP), each sound as the birthday comes. */
    const twins = (seed: string) => [false, true].map((poor) => {
      const sim = student(seed, { birthYear: 1940, birthMonth: 8, birthDay: 30, heightCm: 160, weightKg: 47.5 });
      expect(pendingOf(sim, BIRTHDAY_KIND).map((i) => i.at)).toEqual([BIRTHDAY]);
      if (poor) broke(sim); // TEST SETUP
      sim.advanceTo(BIRTHDAY - 60_000);
      expect(sim.universe.meta.endedAt).toBeUndefined();
      const bmi = sim.player.body!.weightKg / 1.6 ** 2;
      sim.player.wellbeing.condition = 100; // TEST SETUP: at her age's best, 0.8 of the table, for both
      sim.advanceTo(BIRTHDAY + 60_000);
      return { bmi, ends: pendingOf(sim, END_KIND).filter((i) => i.at > BIRTHDAY && i.at < NEXT).map((i) => i.at) };
    });
    /** Where the seed's own draw puts the end, if it comes: the second draw's share of the year. */
    const endOf = (seed: string) => { const [, u2] = draws(seed, 'life.end', String(BIRTHDAY), 2) as [number, number]; return BIRTHDAY + Math.floor(u2 * (NEXT - BIRTHDAY)); };
    // Each seed chosen for where its draw falls against the two chances, 0.0794 fed and 0.1061 starved, clear of each
    // by 0.002: under both, between them, or past both.
    const where = (u: number) => (u < FED - 0.002 ? 'both' : u >= FED + 0.002 && u < STARVED - 0.002 ? 'between' : u >= STARVED + 0.002 ? 'neither' : 'too near');
    const seeds = { between: ['b03-bmi-27', 'b03-bmi-49', 'b03-bmi-69'], both: ['b03-bmi-7'], neither: ['b03-bmi-0'] };
    for (const [kind, list] of Object.entries(seeds)) {
      for (const seed of list) {
        expect(where(draws(seed, 'life.end', String(BIRTHDAY), 1)[0]!), seed).toBe(kind);
        const [fed, poor] = twins(seed) as [{ bmi: number; ends: number[] }, { bmi: number; ends: number[] }];
        // Fed, she holds 18.55; five broke midnights (25 to 29 August weighed by the 26th to the 30th) take her under 18.5.
        expect(fed.bmi, seed).toBeGreaterThanOrEqual(18.5);
        expect(poor.bmi, seed).toBeLessThan(18.5);
        expect(poor.ends, seed).toEqual(kind === 'neither' ? [] : [endOf(seed)]);
        expect(fed.ends, seed).toEqual(kind === 'both' ? [endOf(seed)] : []);
      }
    }
  });

  it('PLAYER JOURNEY: a condition’s onset reads the weight a month of broke days moved: diabetes begins on 1 October for a twin at BMI 30.5 and not for her twin at 29.4', () => {
    const seed = 'b03-onset-7548';
    const OCTOBER = Date.UTC(2026, 9, 1, 4, 30); // 12:30 AM EDT, the health month
    // Guh et al.'s ratios against the population's mix (34.15% healthy, 29.15% over, 36.7% obese) on the CDC's 10.1 new
    // diagnoses a thousand at 45 to 64; a month is a twelfth. Diabetes: obese (6.74 + 12.41)/2, over (2.4 + 3.92)/2.
    const month = (rate: number, mine: number, o: number, b: number) => (rate * mine) / (0.3415 + 0.2915 * o + 0.367 * b) / 12;
    const diabetes = { over: month(0.0101, 3.16, 3.16, 9.575), obese: month(0.0101, 9.575, 3.16, 9.575) };
    // High blood pressure at fifty, 1 − 0.54^(1/20) a year (Olmsted County's 46.0% in twenty years); arthritis 3.3 a thousand.
    const hyper = { over: month(1 - 0.54 ** (1 / 20), 1.465, 1.465, 2.13), obese: month(1 - 0.54 ** (1 / 20), 2.13, 1.465, 2.13) };
    const arthritis = { over: month(0.0033, 2.28, 2.28, 3.08), obese: month(0.0033, 3.08, 2.28, 3.08) };
    // The seed: October's diabetes draw between the overweight and the obese chance, and nothing else drawn then or on
    // 1 September, when both were obese.
    const [d, hy, ar] = draws(seed, 'health.onset', String(OCTOBER), 3) as [number, number, number];
    expect(d).toBeGreaterThanOrEqual(diabetes.over);
    expect(d).toBeLessThan(diabetes.obese);
    expect(hy).toBeGreaterThanOrEqual(hyper.over);
    expect(ar).toBeGreaterThanOrEqual(arthritis.over);
    const [sd, sh, sa] = draws(seed, 'health.onset', String(Date.UTC(2026, 8, 1, 4, 30)), 3) as [number, number, number];
    expect(sd).toBeGreaterThanOrEqual(diabetes.obese);
    expect(sh).toBeGreaterThanOrEqual(hyper.obese);
    expect(sa).toBeGreaterThanOrEqual(arthritis.obese);
    // 170 cm and 88.15 kg as creation takes them (BMI 30.5), born in 1976: fifty.
    const fed = student(seed, { heightCm: 170, weightKg: 88.15, birthYear: 1976 });
    const poor = student(seed, { heightCm: 170, weightKg: 88.15, birthYear: 1976 });
    expect(healthOf(fed.player).chronic?.diabetes).toBeUndefined();
    broke(poor); // TEST SETUP
    for (const s of [fed, poor]) s.advanceTo(OCTOBER - 1000);
    expect(fed.player.body!.weightKg / 1.7 ** 2).toBeGreaterThanOrEqual(30);
    expect(poor.player.body!.weightKg / 1.7 ** 2).toBeLessThan(30);
    expect(poor.player.body!.weightKg / 1.7 ** 2).toBeGreaterThanOrEqual(25);
    for (const s of [fed, poor]) s.advanceTo(OCTOBER + 1000);
    expect(healthOf(fed.player).chronic!.diabetes).toMatchObject({ treated: true, since: OCTOBER });
    expect(notices(fed, 'Diagnosed: Diabetes').map((n) => n.at)).toEqual([OCTOBER]);
    expect(healthOf(poor.player).chronic ?? {}).toEqual({});
    expect(poor.universe.notifications.filter((n) => n.title.startsWith('Diagnosed:'))).toEqual([]);
  });

  it('twenty days ordered in leave her heavier than her twin who ate in by Hall’s rule on 134 kcal a day (USDA ERS), 0.209 kg, his 23.9 a kilogram spent back on what she gained', () => {
    const out = student('b03-order', { heightCm: 170, weightKg: 65 });
    const home = student('b03-order', { heightCm: 170, weightKg: 65 });
    for (let d = 0; d < 20; d += 1) {
      for (const s of [out, home]) s.advanceTo(Date.UTC(2026, 7, 24 + d, 23)); // 7 PM EDT
      out.must({ kind: 'life.look_after', payload: { action: 'order' } });
      home.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    }
    // Midnight 13 September has weighed the twentieth day.
    for (const s of [out, home]) s.advanceTo(Date.UTC(2026, 8, 13, 4) + 1000);
    // Hall et al. (Lancet 2011): 23.9 kcal a day a kilogram, half of it in 365 days; a heavier body spends 23.9 a
    // kilogram more. Day by day: the gap grows by (134 − 23.9 × gap) ÷ (23.9 × 365 ÷ ln 2).
    let gap = 0;
    for (let d = 0; d < 20; d += 1) gap += (134 - 23.9 * gap) / (23.9 * 365 / Math.LN2);
    expect(gap).toBeCloseTo(0.20915, 5);
    // Each midnight keeps the weight to the gram; 3 g is 1.9 kcal a day over twenty days, so this pins 134 to within 2.
    expect(Math.abs(out.player.body!.weightKg - home.player.body!.weightKg - gap)).toBeLessThan(0.003);
  });
});

// ---------------------------------------------------------------------------
// mortality
// ---------------------------------------------------------------------------

/** The save's shell as the player opens it. */
const drawn2 = (sim: Simulation) => drawn(sim, GameShell);

/** Her 86th birthday, 9 AM EDT on Tuesday 25 August 2026, the morning after the first; the next; and the midnight two days on. */
const BIRTHDAY_86 = EDT(8, 25, 9);
const NEXT_86 = Date.UTC(2027, 7, 25, 13);
const MIDNIGHT_27 = EDT(8, 27, 0);
/** `frailty`'s published shape at 86: 0.8 + 2.2 × (1 − condition/55.6)^1.5, 55.6 the most an 86-year-old's condition reaches (the aging table summed). */
const frailtyAt86 = (condition: number) => 0.8 + 2.2 * Math.max(0, 1 - Math.min(1, condition / 55.6)) ** 1.5;

describe('mortality', () => {
  it('PLAYER JOURNEY: the midnight after she’s worn to nothing redraws the year at 2.93 times the table and half worn at 1.55, from the condition then: each seed’s end where its own draw puts it, and the half-worn seed a sound redraw would have spared ends', () => {
    /** Sound at the birthday (TEST SETUP: condition 100 a minute before), then worn to a condition a minute before the second midnight. */
    const worn = (seed: string, condition: number) => {
      const sim = elder(seed, 8, 25);
      sim.advanceTo(BIRTHDAY_86 - 60_000);
      sim.player.wellbeing.condition = 100; // TEST SETUP
      sim.advanceTo(MIDNIGHT_27 - 60_000);
      expect(healthOf(sim.player).endBand).toBe(0.75);
      expect(pendingOf(sim, END_KIND)).toEqual([]);
      sim.player.wellbeing.condition = condition; // TEST SETUP
      sim.advanceTo(MIDNIGHT_27 + 1000);
      return { band: healthOf(sim.player).endBand, condition: sim.player.wellbeing.condition, ends: pendingOf(sim, END_KIND).map((i) => i.at) };
    };
    // Each seed chosen for where the midnight's draw falls: past the half-worn chance and under the worn one; between
    // the sound chance and the half-worn one; under the sound one; past the worn one. None drew an end at the birthday.
    const seeds = { worn: 'b03-redraw-0', half: 'b03-redraw-4', all: 'b03-redraw-2', none: 'b03-redraw-1' };
    const sound = over(AT_86 * 0.8, MIDNIGHT_27, NEXT_86);
    for (const [kind, seed] of Object.entries(seeds)) {
      const birthdayU = draws(seed, 'life.end', String(BIRTHDAY_86), 1)[0]!;
      expect(birthdayU, seed).toBeGreaterThanOrEqual(over(AT_86 * 0.8, BIRTHDAY_86, NEXT_86));
      const [u, u2] = draws(seed, 'life.end', String(MIDNIGHT_27), 2) as [number, number];
      const a = worn(seed, 0);
      const b = worn(seed, 27.8);
      // The bands: three, and 1.5 (0.8 + 2.2 × 0.5^1.5 = 1.578, to the quarter).
      expect(a.band, seed).toBe(3);
      expect(b.band, seed).toBe(1.5);
      // The chance each redraw reads, from the condition the midnight left (a minute's recovery on what was set).
      const chanceA = over(AT_86 * frailtyAt86(a.condition), MIDNIGHT_27, NEXT_86);
      const chanceB = over(AT_86 * frailtyAt86(b.condition), MIDNIGHT_27, NEXT_86);
      // Clear of each chance by 0.004: under the sound one, between it and the half-worn one, between that and the worn one, or past all three.
      const where = u < sound - 0.004 ? 'all' : u >= sound + 0.004 && u < chanceB - 0.004 ? 'half' : u >= chanceB + 0.004 && u < chanceA - 0.004 ? 'worn' : u >= chanceA + 0.004 ? 'none' : 'too near';
      expect(where, seed).toBe(kind);
      const at = MIDNIGHT_27 + Math.floor(u2 * (NEXT_86 - MIDNIGHT_27));
      expect(a.ends, seed).toEqual(kind === 'none' ? [] : [at]);
      expect(b.ends, seed).toEqual(kind === 'half' || kind === 'all' ? [at] : []);
    }
  });

  /** The life whose 86th birthday drew its end for Sunday 13 September, played to it. */
  const ended = (() => {
    let kept: { sim: Simulation; drawn: { id: string; at: number }[]; to: number } | undefined;
    return () => {
      if (kept) return kept;
      const seed = 'b03-end-1239';
      const sim = elder(seed, 8, 25);
      sim.advanceTo(BIRTHDAY_86 - 60_000);
      sim.player.wellbeing.condition = 100; // TEST SETUP
      sim.advanceTo(BIRTHDAY_86 + 60_000);
      const drawn = pendingOf(sim, END_KIND).map((i) => ({ id: i.id, at: i.at }));
      const { to } = sim.advanceTo(NEXT_86 - 60_000);
      kept = { sim, drawn, to };
      return kept;
    };
  })();

  it('PLAYER JOURNEY: the end her 86th birthday drew is the one that comes, and A Life, Ended shows her name, the dates, Aged 86, New Haven, her one payslip’s six hours at $23.00, every account she held, and Back To The Slots', () => {
    const seed = 'b03-end-1239';
    // The seed: the birthday's draw ends the year at 0.8 of the table, and puts the end 19 days on.
    const [u1, u2] = draws(seed, 'life.end', String(BIRTHDAY_86), 2) as [number, number];
    expect(u1).toBeLessThan(over(AT_86 * 0.8, BIRTHDAY_86, NEXT_86));
    const end = BIRTHDAY_86 + Math.floor(u2 * (NEXT_86 - BIRTHDAY_86));
    expect(end).toBeGreaterThan(Date.UTC(2026, 8, 13, 4));
    expect(end).toBeLessThan(Date.UTC(2026, 8, 14, 4));
    const { sim, drawn, to } = ended();
    expect(drawn.map((d) => d.at)).toEqual([end]);
    // The one that came is that one, by its id: not a redraw's and not starvation's.
    const came = sim.universe.scheduled.filter((i) => i.kind === END_KIND && i.status === 'done');
    expect(came.map((i) => ({ id: i.id, at: i.at, cause: i.payload.cause }))).toEqual([{ id: drawn[0]!.id, at: end, cause: undefined }]);
    expect(sim.universe.scheduled.filter((i) => i.kind === END_KIND && i.status === 'cancelled')).toEqual([]);
    expect(to).toBe(end);
    expect(sim.universe.meta.endedAt).toBe(end);
    expect(sim.universe.meta.endedAge).toBe(86);
    // What she earned: one payslip by then, Friday 11 September's, six hours at the Yale Bulletin's $23.00.
    expect(sim.universe.transactions.filter((t) => /^Work-study wages/.test(t.memo)).map((t) => t.memo.split(':')[0])).toEqual(['Work-study wages, 6 hours']);
    // What she left: she held a checking account, savings and a credit card, owing nothing on the card; nothing else
    // of hers has a worth since homes and the rest went in the scope reset of 2026-10-09.
    const held = mine(sim);
    expect(held.map((a) => a.kind).sort()).toEqual(['checking', 'credit_card', 'savings']);
    expect(held.find((a) => a.kind === 'credit_card')!.balance).toBeLessThanOrEqual(0);
    const left = held.reduce((sum, a) => sum + a.balance, 0);
    const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    for (const opened of [sim, reload(sim)]) {
      opened.advanceBy(MS_DAY);
      expect(opened.now).toBe(end);
      h.exits = 0;
      const { text, buttons } = drawn2(opened);
      expect(text).toContain('A Life, Ended');
      expect(text).toContain('Ada Cole');
      expect(text).toContain('August 25, 1940 – September 13, 2026 · Aged 86 · Actress · New Haven');
      expect(text).toContain(`Earned ${dollars(6 * 23_00)} Wages, before tax Left Behind`);
      expect(text).toContain(`Left Behind ${dollars(left)} Their net worth at the end`);
      expect(buttons.map((b) => b.text)).toEqual(['Back To The Slots']);
      buttons[0]!.onClick!();
      expect(h.exits).toBe(1);
    }
  });

  it('DEFECT: a life ended under a year counts its one month as “1 Month”, not “1 Months”', () => {
    const { sim } = ended();
    // From 7:30 AM on 24 August to 13 September: 19.9 days, 0.65 of a month, which the screen rounds to one.
    expect(Math.round(((sim.universe.meta.endedAt! - sim.universe.meta.createdAt) / MS_YEAR) * 12)).toBe(1);
    expect(drawn2(sim).text).toContain('Years In The World 1 Month From the first day to the last');
  });
});

// ---------------------------------------------------------------------------
// knob:receipts|bondWarmth|bondWound|company|morning|evening|readsAround|drills|skims|revises
// ---------------------------------------------------------------------------

/**
 * The knobs' values, each the trait's number bent inside its knob's limits by hand: exp(L·tanh(ln v / L)), L the log
 * of the limit on v's side (`KNOB_LIMITS`), as the first round worked them.
 */
const K = {
  sharp: 1.0914233737, // 1.1 in [0.8, 1.2]: an early riser's morning, a night owl's evening
  flat: 0.8909476954, // 0.88 in [0.8, 1.2]: a night owl's morning, an early riser's evening
  detached: 0.8544913846, // bondWarmth 0.85 in [0.6, 1.4]
  keepsAccounts: 1.0981123666, // bondWound 1.1 in [0.6, 1.5]
} as const;

describe('knob:receipts|bondWarmth|bondWound|company|morning|evening|readsAround|drills|skims|revises', () => {
  /** TEST SETUP: the same seven dials in every twin, the waking day begun now, so readiness is alike and only the hour's fit differs. */
  const dials = (sim: Simulation) => {
    Object.assign(sim.player.wellbeing, { energy: 80, stress: 20, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 90, condition: 100 });
    sim.player.awakeSince = sim.now;
    sim.player.wokeWithDebt = 0;
    // And the four abilities a step reads at 50, where each speeds it by exactly 1 (`stepSpeed`, from 2026-10-16): until
    // then no step read an ability, and a twin's grew apart a hair by the day the step is taken.
    Object.assign(attributesOf(sim, sim.player), { focus: 50, imagination: 50, adaptability: 50 }); sim.player.craft!.memorization = 50;
  };
  const TWINS = { plain: [], early: ['early_riser'], owl: ['night_owl'] } as const;

  it('PLAYER JOURNEY: the hour’s fit turns at its edges: an early riser’s read at 11:59 AM is 1.0914 of her plain twin’s and at noon the same; a night owl’s at 4:59 PM the same and at five 1.0914', () => {
    /** Read The Scene on Sunday 6 September at an hour, dials alike (TEST SETUP): how far it moved. */
    const readAt = (traits: readonly string[], hour: number, minute: number) => {
      const sim = student('g09-hours', {}, [...traits]);
      sim.advanceTo(EDT(9, 6, hour, minute));
      dials(sim);
      const a = courseworkOf(sim, sim.player)!.assignments[0]!;
      expect(a.prep.familiarity).toBe(0);
      return sim.must<{ moved: number }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } }).moved;
    };
    const at = (hour: number, minute: number) => {
      const plain = readAt(TWINS.plain, hour, minute);
      return { early: readAt(TWINS.early, hour, minute) / plain, owl: readAt(TWINS.owl, hour, minute) / plain };
    };
    const beforeNoon = at(11, 59);
    expect(beforeNoon.early).toBeCloseTo(K.sharp, 9);
    expect(beforeNoon.owl).toBeCloseTo(K.flat, 9);
    expect(at(12, 0)).toEqual({ early: 1, owl: 1 });
    expect(at(16, 59)).toEqual({ early: 1, owl: 1 });
    const five = at(17, 0);
    expect(five.early).toBeCloseTo(K.flat, 9);
    expect(five.owl).toBeCloseTo(K.sharp, 9);
  });

  it('PLAYER JOURNEY: the first class at nine on Monday 31 August grows each skill 1.0914 times as much for an early riser as for her plain twin, and 0.8909 for a night owl', () => {
    const grown = (traits: readonly string[]) => {
      const sim = student('g09-hours', {}, [...traits]);
      sim.advanceTo(EDT(8, 31, 8, 59));
      dials(sim); // TEST SETUP
      const before = { ...sim.player.craft! };
      sim.advanceTo(EDT(8, 31, 9, 1));
      return { before, moved: Object.fromEntries(Object.entries(sim.player.craft!).map(([k, v]) => [k, v - before[k as keyof typeof before]])) as Record<string, number> };
    };
    const plain = grown(TWINS.plain);
    const early = grown(TWINS.early);
    const owl = grown(TWINS.owl);
    // The same craft coming in: a class's gain is focus × the room left, so the room cancels.
    expect(early.before).toEqual(plain.before);
    expect(owl.before).toEqual(plain.before);
    const skills = Object.keys(plain.moved).filter((k) => plain.moved[k]! > 0);
    expect(skills.length).toBeGreaterThanOrEqual(4);
    for (const k of skills) {
      expect(early.moved[k]! / plain.moved[k]!, k).toBeCloseTo(K.sharp, 9);
      expect(owl.moved[k]! / plain.moved[k]!, k).toBeCloseTo(K.flat, 9);
    }
  });

  it('PLAYER JOURNEY: the work judged at nine on 8 September meets an early riser at 1.0914 of her plain twin’s readiness, and the first Cabaret night at eight meets a night owl at 1.0914', () => {
    /** The day's condition each judged piece met at an instant, the dials set alike a minute before (TEST SETUP). */
    const judgedAt = (sim: Simulation, at: number) => {
      sim.advanceTo(at - 60_000);
      dials(sim);
      sim.advanceTo(at + 60_000);
      return (sim.player.work ?? []).filter((w) => w.at === at).map((w) => ({ task: w.task, readiness: w.inputs.condition.readiness }));
    };
    /** Tuesday 8 September's first meeting, nine o'clock: the scene shown and the written work handed in. */
    const atNine = (traits: readonly string[]) => judgedAt(student('g09-hours', {}, [...traits]), EDT(9, 8, 9));
    /** The Summer Cabaret joined on 20 September, and its first performance, Thursday 15 October at eight. */
    const atEight = (traits: readonly string[]) => {
      const sim = student('g08-cab', {}, [...traits]);
      sim.advanceTo(Date.UTC(2026, 8, 20, 13));
      sim.must({ kind: 'school.cabaret', payload: {} });
      const first = pendingOf(sim, CABARET_KIND).filter((i) => i.payload.call === 'performance').map((i) => i.at).sort((x, y) => x - y)[0]!;
      return { first, works: judgedAt(sim, EDT(10, 15, 20)) };
    };
    const morning = { plain: atNine(TWINS.plain), early: atNine(TWINS.early), owl: atNine(TWINS.owl) };
    expect(morning.plain.map((w) => w.task)).toEqual(['scene', 'written']);
    morning.plain.forEach((w, i) => {
      expect(morning.early[i]!.readiness / w.readiness, w.task).toBeCloseTo(K.sharp, 9);
      expect(morning.owl[i]!.readiness / w.readiness, w.task).toBeCloseTo(K.flat, 9);
    });
    const night = { plain: atEight(TWINS.plain), early: atEight(TWINS.early), owl: atEight(TWINS.owl) };
    for (const one of Object.values(night)) expect(one.first).toBe(EDT(10, 15, 20));
    expect(night.plain.works.map((w) => w.task)).toEqual(['performance']);
    expect(night.owl.works[0]!.readiness / night.plain.works[0]!.readiness).toBeCloseTo(K.sharp, 9);
    expect(night.early.works[0]!.readiness / night.plain.works[0]!.readiness).toBeCloseTo(K.flat, 9);
  });

  /** The spring cast list, 9 AM EST on Monday 4 January 2027, and the first Carlotta night, 8 PM EDT on Tuesday 4 May. */
  const CAST = Date.UTC(2027, 0, 4, 14);
  const CURTAIN = Date.UTC(2027, 4, 5, 0);

  it('PLAYER JOURNEY: a co-lead at 15 (TEST SETUP) becomes a Friend at the cast list’s ten for a plain player and stays 23.545 for a detached twin: the list lifts only the plain one a friend’s half point, her look says Friend, and the first Carlotta night lifts her a point', () => {
    // The plain life's spring cast: the Carlotta Festival, Ada in a lead beside Julian Chen and Chloe Park (Marcus Okafor
    // until 2026-10-16, when casting's read came to weigh a night's abilities as the play demands, `BASE_INPUTS`).
    const probe = student('g09-cast');
    probe.advanceTo(CAST + 60_000);
    const leads = probe.player.school!.around!.list.filter((x) => x.name !== 'You' && x.size === 'lead' && x.production === 'Carlotta Festival Of New Plays').map((x) => x.name);
    expect(leads).toEqual(['Julian Chen', 'Chloe Park']);
    const julian = probe.player.school!.classmates.findIndex((m) => m.name === 'Julian Chen');
    const life = (traits: string[], preset: number | undefined) => {
      const sim = student('g09-cast', {}, traits);
      sim.advanceTo(CAST - 1);
      expect(sim.player.school!.classmates[julian]!.bond).toBeUndefined();
      if (preset !== undefined) sim.player.school!.classmates[julian]!.bond = preset; // TEST SETUP
      const morale = sim.player.wellbeing.morale;
      sim.advanceTo(CAST);
      return { sim, listLift: sim.player.wellbeing.morale - morale };
    };
    const plain = life([], 15);
    const plainAlone = life([], undefined);
    const detached = life(['detached'], 15);
    const detachedAlone = life(['detached'], undefined);
    // Ten for a production shared (`BONDS.shared`), the detached by her warmth.
    expect(plain.sim.player.school!.classmates[julian]!.bond).toBe(25);
    expect(detached.sim.player.school!.classmates[julian]!.bond).toBeCloseTo(15 + 10 * K.detached, 9);
    // The cast list's read: her own lead's 2 to each, and a Friend's lead half a point more to the plain one alone.
    expect(plain.listLift - plainAlone.listLift).toBeCloseTo(0.5, 9);
    expect(detached.listLift - detachedAlone.listLift).toBeCloseTo(0, 9);
    expect(classmateSays(plain.sim, julian)).toMatch(/ Friend\.$/);
    expect(classmateSays(detached.sim, julian)).not.toMatch(/Friend/);
    // The first night: the same life saved and loaded the moment before the curtain, and again with Julian's bond at
    // nothing (TEST SETUP), so the rest of the night cancels: a friend in the cast is a point at company 1.
    const night = (sim: Simulation) => {
      sim.advanceTo(CURTAIN - 1);
      const [as, control] = [reload(sim), reload(sim)];
      control.player.school!.classmates[julian]!.bond = 0;
      const lift = (s: Simulation) => { const m = s.player.wellbeing.morale; s.advanceTo(CURTAIN + 1); expect(s.player.school!.casting!.performed).toBe(1); return s.player.wellbeing.morale - m; };
      return { bond: as.player.school!.classmates[julian]!.bond, lift: lift(as) - lift(control) };
    };
    expect(night(plain.sim)).toEqual({ bond: 25, lift: 1 });
    const apart = night(detached.sim);
    expect(apart.bond).toBeCloseTo(15 + 10 * K.detached, 9);
    expect(apart.lift).toBeCloseTo(0, 9);
  });

  it('PLAYER JOURNEY: a classmate at −17.9 (TEST SETUP) whose lead she took is cut 2 by the cast list to −19.9 for a plain player and 2.196 to −20.096 for one who keeps accounts, a Rival on her look', () => {
    const life = (traits: string[]) => {
      const sim = student('g09-cast', {}, traits);
      sim.advanceTo(CAST - 1);
      sim.player.school!.classmates[0]!.bond = -17.9; // TEST SETUP
      sim.advanceTo(CAST + 60_000);
      return sim;
    };
    const plain = life([]);
    const keeps = life(['keeps_accounts']);
    // Ten for the production shared, twelve back for the lead written for her that went to Ada (`BONDS.leadTaken`).
    expect(plain.player.school!.classmates[0]!.bond).toBeCloseTo(-19.9, 9);
    expect(keeps.player.school!.classmates[0]!.bond).toBeCloseTo(-17.9 - 2 * K.keepsAccounts, 9);
    expect(classmateSays(keeps, 0)).toMatch(/ Rival\.$/);
    expect(classmateSays(plain, 0)).not.toMatch(/Rival/);
  });
});
