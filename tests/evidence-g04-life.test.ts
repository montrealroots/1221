/**
 * Evidence for seven life rows the review of 2026-10-13 left partial (verification group g04-life): a course of
 * therapy, a condition kept up or let go, a birthday, a plan of your own, the midnight, the end of a life, and the
 * world's tick. Each gap the review named is closed here through the command the row's screen sends, or the clock
 * where the row is a scheduled kind, and each consequence is read where the row says it's read, against figures worked
 * out from the rule's own numbers or its source, never from the helper the engine computes them with.
 *
 * - `health.therapy`: Yale's course of eight played on the clock across a reload, lifted on one student and not on
 *   her twin (the lifted branch had never run in a test; the guide's seed ended "The Course Is Done"), and the health
 *   week's 3 morale taken only from the one not lifted; a course in New York not charged the month's care for
 *   depression on the 1st, against a twin who pays it (until now every course tested was on Yale, whose share is $0,
 *   or had depression untreated); a session in hospital missed and held a week on; one the bank can't pay billed at
 *   $322.50 and owed as debt; Yale's course ended by a withdrawal, said once, and Adna Linden's $240 taking it on;
 *   Begin A Course Of 8 pressed on Papers.
 * - `health.treat`: Keep It Up pressed with nothing to pay with, lapsed, said on Papers, held across a reload, its
 *   morale toll taken, and the 1st's payment ending the lapse; Let It Go on the student taking arthritis's 2 energy
 *   and diabetes's 2 condition against a twin, and Keep It Up filling the medicine at Yale's $10 and stopping it;
 *   asthma's and type 1 diabetes's emergencies come to the twin left alone and not to the one kept up. Until now the
 *   tolls and the emergencies were tested with the treatment set by hand.
 * - `life.birthday`: the student's birthday on the Calendar, once across a reload, its notice, the next one a year
 *   on, the year's band drawn afresh at it, the coming year's end drawn at it (a student born in 1940, the earliest
 *   year creation takes), and 29 February's birthday on the 28th in 2027.
 * - `life.commitment`: a plan slept through on a booked night, missed quietly and said once by the night; plans
 *   written and opened again, one held and its hours refusing sleep, one in New York missed and said once
 *   (plans.test.ts's "comes back off a reload" never reloaded).
 * - `life.day_rollover`: the midnight's injury listener, its 1 morale and 1 stress against an unhurt twin across a
 *   reload, nothing once mended, and an everyday injury drawn by a midnight; the day's eating onto the scale, a meal
 *   ordered in's 134 kcal at Hall's pace; fitness's 0.18 a day, the groceries and hygiene's 82. Until now the row
 *   cited a test of the absence of a charge and a direct call of `settleTheBody`.
 * - `life.end`: the starved end standing through a redraw at the same midnight, by the clock (until now by direct
 *   calls); the end a birthday drew, reached; LifeEnded drawn by GameShell, and the slot's "Died At 24" through the
 *   real save adapter.
 * - `world.tick`: a real raiser's row, the London-born student's 2026 return, closed by the tick after its date and
 *   gone from Home; deletions 180 days on, a dismissed row with its date ahead among them; the timeline's 400 days; the
 *   tick armed once across a reload. Until 2026-10-14 it waved an undated row away after ninety days and kept a
 *   dismissed row to its date, both raised by hand, as no raiser reached either; the owner had both rules go that day.
 *
 * Two of these failed when written, each on an engine defect, until it was fixed on 2026-10-13: a plan come due while
 * the player was in hospital was kept (`registerPlans` never asked), so its hours refused a sleep from the hospital
 * bed; and a birthday on 28 February for somebody born on the 29th said the age they were, since `ageOn` counted the
 * year from 1 March.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actress at Yale in
 * New Haven from Monday 24 August 2026 at 7:30 AM, with what creation lets a player choose: a birthday (30 August,
 * 29 February 2004, 1940), a birthplace (London, so the return's raiser reaches her), a height and weight (172 cm and
 * 35 kg, which creation takes). Seeds named in a test were found by playing it: one whose course lifts, one whose
 * doesn't, one who drew arthritis, one diabetes, one asthma, one type 1 diabetes, one with an everyday injury, one whose
 * birthday draws its end. Where a row's rule is charged in money Yale's cover leaves at nothing, a New York life
 * outside the school (`quickSave`, wealthy, from Monday 5 January 2026) is played, and says so. Screens are rendered as
 * the player has them (react-dom/server) with `useGame`'s `run` as the save's own `execute`; a pressed button is the
 * component's own onClick, kept on its way through the JSX runtime.
 *
 * TEST SETUP, said again where it's done: an account's balance set by a posting against a test equity line (the bank
 * emptied, money back); a hospital stay put on the record over a session or a plan; a sprain put on the record; the
 * body worn to 40 condition so its band moves; a band put out of reach before a birthday so its redraw shows; two
 * Decision Center rows raised by hand, since every raiser in the engine dates its row; a save store in memory under
 * the real adapter.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave, refreshMeta } from '@/engine';
import { LocalSaveAdapter } from '@/engine/persistence/local';
import { openDecisions } from '@/engine/world/world';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { HEALTH_WEEK_KIND, healthOf } from '@/engine/systems/health';
import { overdraftRoom } from '@/engine/systems/lending';
import { THERAPY_SESSION_KIND } from '@/engine/systems/therapy';
import { BIRTHDAY_KIND } from '@/engine/systems/birthdays';
import { END_KIND } from '@/engine/systems/mortality';
import { ceilingAt } from '@/engine/content/lifespan';
import { PLAN_KIND } from '@/engine/world/plans';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  toasts: [] as string[],
}));

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

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back. `run` is the save's own `execute`.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    route: '/home',
    breadcrumbs: [],
    toasts: [],
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { CalendarWorkspace } = await import('@/ui/workspaces/CalendarWorkspace');
const { GameShell } = await import('@/ui/shell/GameShell');
const { SaveSlots } = await import('@/ui/saves/SaveSlots');
const { Home } = await import('@/ui/screens/Home');

// ---------------------------------------------------------------------------
// Lives, and the screens over them
// ---------------------------------------------------------------------------

/** A new life: Ada Cole, born in New York, an actress at Yale in New Haven from Monday 24 August 2026, 7:30 AM. */
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** A New York life outside the school, from Monday 5 January 2026: where a session is charged, as Yale's never is. */
const newYorker = (seed: string): Simulation => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant on the clocks of New York and New Haven, Eastern time worked out here: EDT is UTC−4 to 1 November 2026, EST UTC−5 after. */
const EDT = (y: number, m: number, d: number, hour: number, minute = 0) => Date.UTC(y, m - 1, d, hour + 4, minute);
const EST = (y: number, m: number, d: number, hour: number, minute = 0) => Date.UTC(y, m - 1, d, hour + 5, minute);
const memos = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** What a transaction cost the player: what went to the expense line. */
const charged = (sim: Simulation, memo: string) => memos(sim, memo).map((t) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.nominal).reduce((s, p) => s + p.amount, 0));
/** TEST SETUP: an account's balance set, by a posting against a test equity line, so the ledger still balances. */
function setBalance(sim: Simulation, accountId: string, to: number): void {
  const by = to - sim.universe.accounts[accountId]!.balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/** TEST SETUP: every account they could pay from emptied, as months of no income leave them. */
function emptied(sim: Simulation, overdrawn = false): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.closedAt) continue;
    if (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash') setBalance(sim, a.id, 0);
  }
  const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
  if (overdrawn) setBalance(sim, current.id, -overdraftRoom(sim, sim.player, current));
}
/** What the next health week (Monday, 9 AM) does to a dial at its own instant: the clock stopped a millisecond before it, then on to it. */
function atHealthWeek(sim: Simulation, dial: 'morale' | 'energy' | 'condition'): { at: number; step: number } {
  const week = sim.universe.scheduled.find((i) => i.kind === HEALTH_WEEK_KIND && i.status === 'pending' && i.payload.personId === sim.player.id)!;
  sim.advanceTo(week.at - 1);
  const before = sim.player.wellbeing[dial];
  sim.advanceTo(week.at);
  return { at: week.at, step: Math.round((sim.player.wellbeing[dial] - before) * 1e6) / 1e6 };
}
const sessions = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === THERAPY_SESSION_KIND);

/** What the player reads: the markup with every tag taken out. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** A screen as the player has it: its words, and every button on it with its press. */
function drawn(sim: Simulation, screen: FunctionComponent, tabs: Record<string, string> = {}): { text: string; html: string; buttons: typeof h.buttons } {
  h.sim = sim;
  h.tabs = tabs;
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(screen));
  return { text: onScreen(html), html, buttons: h.buttons };
}
const HEALTH_TAB = { 'tab:/workspace/papers': 'health' };
const SESSION = 'The Center for CBT, a session';

// ---------------------------------------------------------------------------

describe('health.therapy', () => {
  it('PLAYER JOURNEY: Yale’s course of eight, across a reload, lifts the depression for one student and not for her twin, and the week’s morale toll goes with it', () => {
    // Seeds found by playing the course: on 'g04-dep-1' it lifts (Cuijpers' 36% for a course outside the NHS), on
    // 'g04-dep-16' it doesn't. Both drew depression at the start of the life, kept up, and let it go by the command
    // Papers' Let It Go sends, so the week's toll on it shows.
    for (const [seed, lifts] of [['g04-dep-1', true], ['g04-dep-16', false]] as const) {
      let sim = student(seed);
      expect(healthOf(sim.player).chronic?.depression?.treated).toBe(true);
      sim.must({ kind: 'health.treat', payload: { condition: 'depression', on: false } });
      const r = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'Yale Mental Health & Counseling' } });
      // A week on, Monday 31 August at five in the afternoon in New Haven.
      expect(r.first).toBe(EDT(2026, 8, 31, 17));
      expect(sim.execute({ kind: 'health.therapy', payload: { therapist: 'Yale Mental Health & Counseling' } }).error).toBe('You’re in a course already.');
      // Four sessions held, then the save written and opened again: the course goes on from where it was, not again.
      sim.advanceTo(EDT(2026, 9, 21, 18));
      expect(sim.player.therapy!.done).toBe(4);
      sim = reload(sim);
      expect(sessions(sim).filter((i) => i.status === 'pending')).toHaveLength(1);
      sim.advanceTo(EDT(2026, 10, 20, 12));
      // Eight Mondays at 5 PM, each held once.
      expect(sessions(sim).filter((i) => i.status === 'done').map((i) => i.at)).toEqual([0, 7, 14, 21, 28, 35, 42, 49].map((d) => EDT(2026, 8, 31, 17) + d * MS_DAY));
      expect(sessions(sim).filter((i) => i.status === 'pending')).toHaveLength(0);
      expect(sim.player.therapy).toBeUndefined();
      // Free on Yale Health: nothing posted for it.
      expect(sim.universe.transactions.filter((t) => t.memo.includes('Yale Mental Health'))).toHaveLength(0);
      // Said once, either way; lifted, the depression is off the record, and not, it's as it was, left alone.
      expect(titled(sim, 'The Depression Has Lifted').map((n) => n.body)).toEqual(lifts ? ['After 8 sessions with Yale Mental Health & Counseling, it no longer weighs on you.'] : []);
      expect(titled(sim, 'The Course Is Done').map((n) => n.body)).toEqual(lifts ? [] : ['8 sessions with Yale Mental Health & Counseling; it hasn’t lifted yet, and another course can be had.']);
      expect(healthOf(sim.player).chronic?.depression).toEqual(lifts ? undefined : { treated: false });
      // The next health week, Monday 26 October: depression left alone takes its 3 morale (SLATE's estimate); lifted, none.
      const week = atHealthWeek(sim, 'morale');
      expect(week.at).toBe(EDT(2026, 10, 26, 9));
      expect(week.step).toBe(lifts ? 0 : -3);
    }
  });

  it('PLAYER JOURNEY: in a course, the month’s care for depression isn’t charged on the 1st as well, where the twin without one pays it', () => {
    // A New York life that drew depression, kept up (`g04-ny-care`): uninsured, so a month's care is two sessions'
    // price, and a course's sessions are The Center for CBT's middle of $260 to $385, $322.50 each.
    const [course, twin] = [newYorker('g04-ny-care'), newYorker('g04-ny-care')];
    for (const sim of [course, twin]) expect(healthOf(sim.player).chronic?.depression).toEqual({ treated: true });
    const r = course.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'The Center for CBT' } });
    // Monday 12 January at 5 PM, a week from Monday the 5th.
    expect(r.first).toBe(EST(2026, 1, 12, 17));
    for (const sim of [course, twin]) sim.advanceTo(EST(2026, 2, 2, 12));
    // The 1st of February: the twin pays the month's care, the course doesn't pay it twice.
    expect(memos(twin, 'Care for depression').map((t) => t.at)).toEqual([EST(2026, 2, 1, 0, 30)]);
    expect(charged(twin, 'Care for depression')[0]).toBeGreaterThan(0);
    expect(memos(course, 'Care for depression')).toHaveLength(0);
    // While its sessions are paid as they're held: 12, 19 and 26 January.
    expect(memos(course, SESSION).map((t) => t.at)).toEqual([12, 19, 26].map((d) => EST(2026, 1, d, 17)));
    expect(charged(course, SESSION)).toEqual([322_50, 322_50, 322_50]);
    expect(memos(twin, SESSION)).toHaveLength(0);
  });

  it('PLAYER JOURNEY: a session come due in hospital is missed and held a week on, unpaid; out of hospital, the next is held and paid', () => {
    const sim = newYorker('g04-ny-care');
    const r = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'The Center for CBT' } });
    sim.advanceTo(r.first - 60_000);
    // TEST SETUP: two days in hospital over the session, as a stay leaves the record.
    healthOf(sim.player).inHospitalUntil = r.first + 2 * MS_DAY;
    sim.advanceTo(r.first + 60_000);
    expect(sessions(sim).find((i) => i.at === r.first)!.status).toBe('missed');
    expect(memos(sim, SESSION)).toHaveLength(0);
    expect(healthOf(sim.player).bills.filter((b) => b.what === SESSION)).toHaveLength(0);
    expect(sim.player.therapy!.done).toBe(0);
    expect(sessions(sim).filter((i) => i.status === 'pending').map((i) => i.at)).toEqual([r.first + 7 * MS_DAY]);
    // A week on, home: held and paid, once.
    sim.advanceTo(r.first + 7 * MS_DAY + 60_000);
    expect(sessions(sim).find((i) => i.at === r.first + 7 * MS_DAY)!.status).toBe('done');
    expect(charged(sim, SESSION)).toEqual([322_50]);
    expect(sim.player.therapy!.done).toBe(1);
  });

  it('PLAYER JOURNEY: a session the bank can’t pay is held and becomes a medical bill of $322.50, due in 30 days, owed as debt when it isn’t paid', () => {
    const sim = newYorker('g04-ny-care');
    const r = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'The Center for CBT' } });
    sim.advanceTo(r.first - 60_000);
    emptied(sim); // TEST SETUP
    sim.advanceTo(r.first + 60_000);
    expect(memos(sim, SESSION)).toHaveLength(0);
    const bill = healthOf(sim.player).bills.find((b) => b.what === SESSION)!;
    expect(bill).toMatchObject({ at: r.first, amount: 322_50, dueAt: r.first + 30 * MS_DAY });
    expect(bill.paid).toBeFalsy();
    // Held all the same: it counts toward the eight.
    expect(sim.player.therapy!.done).toBe(1);
    // Due, and still nothing in the bank: owed as medical debt, at least the session's $322.50.
    sim.advanceTo(bill.dueAt + MS_DAY);
    expect(bill.inDebt).toBe(true);
    const debt = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.category === 'medical' && !a.closedAt)!;
    expect(debt.balance).toBeLessThanOrEqual(-322_50);
  });

  it('PLAYER JOURNEY: a withdrawal ends Yale Health’s cover, and with it the course at Yale, said once; Yale then refuses, and Adna Linden takes it on at $240', () => {
    const sim = student('g04-dep-1');
    const r = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'Yale Mental Health & Counseling' } });
    sim.advanceTo(EDT(2026, 9, 2, 12));
    expect(sim.player.therapy!.done).toBe(1);
    // By the fifteenth day of classes: the cover ends that day.
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    sim.advanceTo(r.first + 7 * MS_DAY + 60_000);
    expect(titled(sim, 'Your Counseling At Yale Ended').map((n) => n.body)).toEqual(['Yale Mental Health & Counseling sees students Yale Health covers, and your cover has ended, after 1 of 8 sessions. A therapist outside Yale can take it on.']);
    expect(sim.player.therapy).toBeUndefined();
    expect(sessions(sim).filter((i) => i.status === 'pending')).toHaveLength(0);
    sim.advanceTo(r.first + 14 * MS_DAY + 60_000);
    expect(titled(sim, 'Your Counseling At Yale Ended')).toHaveLength(1);
    // Refused at Yale in its own words; outside it, taken on, and its sessions charged at the practice's $240.
    expect(sim.execute({ kind: 'health.therapy', payload: { therapist: 'Yale Mental Health & Counseling' } }).error).toBe('Yale Mental Health & Counseling sees students Yale Health covers.');
    expect(sim.execute({ kind: 'health.therapy', payload: { therapist: 'Priory' } }).error).toBe('Choose a therapist where you live.');
    const again = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'Adna Linden Psychotherapy' } });
    sim.advanceTo(again.first + 60_000);
    expect(charged(sim, 'Adna Linden Psychotherapy, a session')).toEqual([240_00]);
  });

  it('PLAYER JOURNEY: Begin A Course Of 8, pressed on Papers, books Yale’s first session and the row then counts the sessions held', () => {
    const sim = student('g04-dep-1');
    h.toasts = [];
    const before = drawn(sim, PapersWorkspace, HEALTH_TAB);
    expect(before.html).toMatch(/<option value="Yale Mental Health &amp; Counseling" selected="">Yale Mental Health &amp; Counseling, Free With Yale Health<\/option>/);
    expect(before.text).toContain('Adna Linden Psychotherapy, $240 A Session');
    const begin = before.buttons.find((b) => b.text === 'Begin A Course Of 8')!;
    expect(begin.disabled).toBe(false);
    begin.onClick!();
    expect(h.toasts).toEqual(['The first session, August 31, 2026.']);
    expect(sim.player.therapy).toMatchObject({ therapist: 'Yale Mental Health & Counseling', done: 0 });
    expect(drawn(sim, PapersWorkspace, HEALTH_TAB).text).toContain('Therapy with Yale Mental Health & Counseling: 0 of 8 sessions');
    sim.advanceTo(EDT(2026, 9, 1, 12));
    const after = drawn(sim, PapersWorkspace, HEALTH_TAB);
    expect(after.text).toContain('Therapy with Yale Mental Health & Counseling: 1 of 8 sessions');
    expect(after.buttons.some((b) => b.text === 'Begin A Course Of 8')).toBe(false);
    // A student who drew no depression ('g04-dep-3') has no course offered, and is refused one in the rule's words.
    const well = student('g04-dep-3');
    expect(healthOf(well.player).chronic?.depression).toBeUndefined();
    expect(drawn(well, PapersWorkspace, HEALTH_TAB).buttons.some((b) => b.text === 'Begin A Course Of 8')).toBe(false);
    expect(well.execute({ kind: 'health.therapy', payload: { therapist: 'Yale Mental Health & Counseling' } }).error).toBe('A course of therapy here is for depression.');
    expect(well.player.therapy).toBeUndefined();
  });
});

/** A condition's button on Your Conditions, by the order the panel lists them (the record's own order). */
const conditionButton = (sim: Simulation, index: number) => {
  const { buttons } = drawn(sim, PapersWorkspace, HEALTH_TAB);
  return buttons.filter((b) => b.text === 'Keep It Up' || b.text === 'Let It Go')[index]!;
};

describe('health.treat', () => {
  it('PLAYER JOURNEY: Keep It Up pressed with nothing to pay with leaves depression lapsed, says so on Papers and across a reload, weighs on morale; paid on the 1st, it’s kept up again', () => {
    let sim = newYorker('g04-ny-care');
    expect(Object.keys(healthOf(sim.player).chronic ?? {})).toEqual(['depression', 'asthma']);
    // A condition not carried is refused in its own words, and nothing is paid for it.
    expect(sim.execute({ kind: 'health.treat', payload: { condition: 'arthritis', on: true } }).error).toBe('You don’t have that.');
    expect(memos(sim, 'Care for arthritis')).toHaveLength(0);
    h.toasts = [];
    const letGo = conditionButton(sim, 0);
    expect(letGo.text).toBe('Let It Go');
    letGo.onClick!();
    expect(h.toasts).toEqual(['Left alone.']);
    expect(drawn(sim, PapersWorkspace, HEALTH_TAB).text).toContain('Depression: Left Alone');
    emptied(sim, true); // TEST SETUP: and the current account overdrawn to its limit.
    const keep = conditionButton(sim, 0);
    expect(keep.text).toBe('Keep It Up');
    keep.onClick!();
    expect(h.toasts).toEqual(['Left alone.', 'Kept up from this month.']);
    expect(healthOf(sim.player).chronic!.depression).toMatchObject({ treated: true, lapsed: true });
    expect(memos(sim, 'Care for depression')).toHaveLength(0);
    expect(drawn(sim, PapersWorkspace, HEALTH_TAB).text).toContain('Depression: Kept Up, But This Month’s Care Went Unpaid');
    // Written and opened again, it's still lapsed, and the week reads it so: depression not kept up takes its 3 morale.
    sim = reload(sim);
    expect(healthOf(sim.player).chronic!.depression!.lapsed).toBe(true);
    expect(drawn(sim, PapersWorkspace, HEALTH_TAB).text).toContain('Depression: Kept Up, But This Month’s Care Went Unpaid');
    const lapsedWeek = atHealthWeek(sim, 'morale');
    expect(lapsedWeek.at).toBe(EST(2026, 1, 12, 9));
    expect(lapsedWeek.step).toBe(-3);
    // TEST SETUP: money in the bank again, as a deposit would put it there.
    setBalance(sim, sim.player.primaryAccountId!, 5_000_00);
    sim.advanceTo(EST(2026, 2, 1, 12));
    // The 1st pays the month's care, once, and the lapse is over.
    expect(memos(sim, 'Care for depression').map((t) => t.at)).toEqual([EST(2026, 2, 1, 0, 30)]);
    expect(healthOf(sim.player).chronic!.depression!.lapsed).toBe(false);
    expect(drawn(sim, PapersWorkspace, HEALTH_TAB).text).toMatch(/Depression: Kept Up · Medicine until/);
    const keptWeek = atHealthWeek(sim, 'morale');
    expect(keptWeek.at).toBe(EST(2026, 2, 2, 9));
    expect(keptWeek.step).toBe(0);
  });

  it('PLAYER JOURNEY: on the student, Let It Go takes arthritis’s 2 energy and diabetes’s 2 condition at the health week against a twin who kept it up; Keep It Up fills the medicine at Yale’s $10 the next week and the toll stops', () => {
    // Students who drew one condition each at the start of the life, kept up: arthritis on 'g04-dep-20', type 2
    // diabetes on 'g04-dep-35'. The week's tolls are SLATE's estimate, 2 a week each; Yale Health's generic is $10.
    for (const [seed, condition, dial, label] of [['g04-dep-20', 'arthritis', 'energy', 'Arthritis'], ['g04-dep-35', 'diabetes', 'condition', 'Diabetes, Type 2']] as const) {
      const [kept, left] = [student(seed), student(seed)];
      for (const sim of [kept, left]) expect(Object.keys(healthOf(sim.player).chronic ?? {})).toEqual([condition]);
      expect(drawn(left, PapersWorkspace, HEALTH_TAB).text).toContain(`${label}: Kept Up`);
      conditionButton(left, 0).onClick!();
      expect(healthOf(left.player).chronic![condition]!.treated).toBe(false);
      expect(drawn(left, PapersWorkspace, HEALTH_TAB).text).toContain(`${label}: Left Alone`);
      // Monday 31 August: the toll, against the twin, at the week's own instant.
      const [k1, l1] = [atHealthWeek(kept, dial), atHealthWeek(left, dial)];
      expect(k1.at).toBe(EDT(2026, 8, 31, 9));
      expect(l1.at).toBe(k1.at);
      expect(l1.step - k1.step).toBeCloseTo(-2, 9);
      // The twin's medicine was filled that week, 30 days of it; the one left alone has none.
      expect(memos(kept, `Medicine for ${condition}`).map((t) => t.at)).toEqual([EDT(2026, 8, 31, 9)]);
      expect(memos(left, `Medicine for ${condition}`)).toHaveLength(0);
      // Kept up again from the panel: the next week fills it, at $10, and takes nothing.
      left.advanceTo(EDT(2026, 9, 1, 12));
      kept.advanceTo(EDT(2026, 9, 1, 12));
      const again = conditionButton(left, 0);
      expect(again.text).toBe('Keep It Up');
      again.onClick!();
      const [k2, l2] = [atHealthWeek(kept, dial), atHealthWeek(left, dial)];
      expect(l2.at).toBe(EDT(2026, 9, 7, 9));
      expect(l2.step - k2.step).toBeCloseTo(0, 9);
      expect(charged(left, `Medicine for ${condition}`)).toEqual([10_00]);
      expect(memos(left, `Medicine for ${condition}`).map((t) => t.at)).toEqual([EDT(2026, 9, 7, 9)]);
      expect(drawn(left, PapersWorkspace, HEALTH_TAB).text).toContain(`${label}: Kept Up · Medicine until October 7, 2026`);
    }
  });

  it('PLAYER JOURNEY: asthma let go has an emergency its kept-up twin doesn’t, and type 1 diabetes let go one too; every emergency the twin had, the one left alone had as well', () => {
    // Students who drew asthma ('g04-c-37') and type 1 diabetes ('g04-c-340'), found by playing both twins: left
    // alone the emergency room comes at twice (asthma) and four times (type 1) the rate, and each week's draw is
    // the same for both twins, so what the twin kept up has, the one left alone has too.
    const cases = [
      { seed: 'g04-c-37', condition: 'asthma', drew: { asthma: { treated: true } }, until: EDT(2026, 10, 6, 12), at: EDT(2026, 10, 5, 9) },
      { seed: 'g04-c-340', condition: 'diabetes', drew: { diabetes: { treated: true, typeOne: true } }, until: EST(2026, 11, 3, 12), at: EST(2026, 11, 2, 9) },
    ] as const;
    for (const { seed, condition, drew, until, at } of cases) {
      const [kept, left] = [student(seed), student(seed)];
      expect(healthOf(kept.player).chronic).toMatchObject(drew);
      left.must({ kind: 'health.treat', payload: { condition, on: false } });
      for (const sim of [kept, left]) sim.advanceTo(until);
      const emergencies = (sim: Simulation) => (healthOf(sim.player).careLog ?? []).filter((e) => e.care === 'emergency').map((e) => e.at);
      expect(emergencies(left)).toContain(at);
      expect(emergencies(kept)).not.toContain(at);
      expect(emergencies(left).length).toBeGreaterThan(emergencies(kept).length);
      expect(emergencies(kept).filter((one) => !emergencies(left).includes(one))).toEqual([]);
      expect(titled(left, 'The Emergency Room').filter((n) => n.at === at)).toHaveLength(1);
    }
  });
});

/** A day's cell on the month the Calendar shows, by the date its label begins with: what it prints. */
function dayCell(sim: Simulation, date: string): string {
  const { html } = drawn(sim, CalendarWorkspace);
  const cell = html.match(new RegExp(`<button[^>]*aria-label="${date}[^"]*"[^>]*>(.*?)</button>`))?.[1];
  expect(cell, date).toBeDefined();
  return onScreen(cell!);
}
const birthdays = (sim: Simulation, status: string) => sim.universe.scheduled.filter((i) => i.kind === BIRTHDAY_KIND && i.status === status);
/**
 * The year's band by the rule's own figures (the frailty rule's comment in mortality.ts): 0.8 + 2.2 × (the share short
 * of the age's ceiling, from the lifespan table)^1.5, to the nearest quarter. Worked out here, not by `frailty`.
 */
const bandFor = (condition: number, age: number) => Math.round((0.8 + 2.2 * (1 - Math.min(1, condition / ceilingAt(age).condition)) ** 1.5) / 0.25) * 0.25;

describe('life.birthday', () => {
  it('PLAYER JOURNEY: born 30 August 2002, the student’s birthday is on the calendar at 9 AM, comes once across a reload, says she’s 24, puts the next on for a year on, and draws the year’s band afresh', () => {
    // Born on 30 August, a day the creation screen offers: the first birthday is the Sunday of the first week.
    let sim = student('g04-bday', { birthMonth: 8, birthDay: 30 });
    expect(birthdays(sim, 'pending').map((i) => [i.at, i.label])).toEqual([[EDT(2026, 8, 30, 9), 'Your Birthday']]);
    expect(dayCell(sim, 'August 30, 2026')).toContain('Your Birthday');
    sim.advanceTo(EDT(2026, 8, 29, 12));
    sim = reload(sim);
    expect(birthdays(sim, 'pending')).toHaveLength(1);
    sim.advanceTo(EDT(2026, 8, 30, 8, 59));
    // TEST SETUP: the band the year was drawn at put out of reach of any body, so its redraw at the birthday shows.
    healthOf(sim.player).endBand = 99;
    sim.advanceTo(EDT(2026, 8, 30, 9, 1));
    expect(titled(sim, 'Happy Birthday: 24').map((n) => n.body)).toEqual(['You\'re 24 today.']);
    expect(birthdays(sim, 'done').map((i) => i.at)).toEqual([EDT(2026, 8, 30, 9)]);
    expect(birthdays(sim, 'pending').map((i) => [i.at, i.label])).toEqual([[EDT(2027, 8, 30, 9), 'Your Birthday']]);
    // The year's band from the body at the birthday, by the rule's own figures (`bandFor`).
    expect(healthOf(sim.player).endBand).toBe(bandFor(sim.player.wellbeing.condition, 24));
    // A day on, nothing said twice.
    sim.advanceTo(EDT(2026, 8, 31, 12));
    expect(sim.universe.notifications.filter((n) => n.title.startsWith('Happy Birthday'))).toHaveLength(1);
  });

  it('PLAYER JOURNEY: born 29 February 2004, the birthday is on the calendar on 28 February in 2027, fires there, and is put on 29 February in 2028', () => {
    // Born on a 29 February, which creation takes in a leap year: 2027 has none, so the 28th, as birthdays.ts reads it.
    const sim = student('g04-leap', { birthYear: 2004, birthMonth: 2, birthDay: 29 });
    expect(birthdays(sim, 'pending').map((i) => i.at)).toEqual([EST(2027, 2, 28, 9)]);
    sim.advanceTo(EST(2027, 2, 27, 12));
    expect(dayCell(sim, 'February 28, 2027')).toContain('Your Birthday');
    sim.advanceTo(EST(2027, 2, 28, 9, 1));
    expect(birthdays(sim, 'done').map((i) => i.at)).toEqual([EST(2027, 2, 28, 9)]);
    expect(birthdays(sim, 'pending').map((i) => i.at)).toEqual([EST(2028, 2, 29, 9)]);
    expect(sim.universe.notifications.filter((n) => n.title.startsWith('Happy Birthday')).map((n) => n.at)).toEqual([EST(2027, 2, 28, 9)]);
  });

  it('born 29 February 2004, the birthday said on 28 February 2027 is her 23rd, the age she turns that day', () => {
    const sim = student('g04-leap', { birthYear: 2004, birthMonth: 2, birthDay: 29 });
    sim.advanceTo(EST(2027, 2, 28, 9, 1));
    // The day the birthday falls on is the day the age turns: 2027 − 2004 = 23. `ageOn` counted it from 1 March until
    // 2026-10-13; fixed that day.
    expect(sim.universe.notifications.filter((n) => n.title.startsWith('Happy Birthday')).map((n) => [n.title, n.body])).toEqual([['Happy Birthday: 23', 'You\'re 23 today.']]);
  });

  it('PLAYER JOURNEY: a student born in 1940, who turns 86 on the Sunday, has the coming year drawn at the birthday: its end, none before it', () => {
    // Born 30 August 1940, the earliest year creation takes. 'g04-old-49' was found by playing seeds: nothing drawn
    // at arming for the six days to the birthday, and the year from it drawn to end in November.
    const sim = student('g04-old-49', { birthYear: 1940, birthMonth: 8, birthDay: 30 });
    const ends = (status: string) => sim.universe.scheduled.filter((i) => i.kind === END_KIND && i.status === status);
    sim.advanceTo(EDT(2026, 8, 30, 8, 59));
    expect(ends('pending')).toHaveLength(0);
    sim.advanceTo(EDT(2026, 8, 30, 9, 1));
    expect(titled(sim, 'Happy Birthday: 86')).toHaveLength(1);
    const drawnEnd = ends('pending');
    expect(drawnEnd).toHaveLength(1);
    expect(drawnEnd[0]!.at).toBeGreaterThan(EDT(2026, 8, 30, 9));
    expect(drawnEnd[0]!.at).toBeLessThan(EDT(2027, 8, 30, 9));
    // Out of sight, as the end always is: not on the calendar.
    expect(dayCell(sim, 'August 30, 2026')).toContain('Your Birthday');
    expect(drawn(sim, CalendarWorkspace).text).not.toContain('World Simulation');
  });
});

const sleepFor = (sim: Simulation, hours: number) => sim.execute<{ wokeAt: number }>({ kind: 'life.sleep', payload: { hours } });
const plan = (sim: Simulation, payload: Record<string, unknown>) => {
  const made = sim.must<{ ok: boolean; id: string; error?: string }>({ kind: 'calendar.schedule', payload });
  expect(made.ok).toBe(true);
  return made.id;
};

describe('life.commitment', () => {
  it('a plan come due while the player is in hospital is missed, and a sleep from the hospital bed isn’t refused for being at it', () => {
    const sim = student('g04-plan-hosp');
    const gym = plan(sim, { title: 'Gym', at: EDT(2026, 8, 24, 10, 30), durationMinutes: 180 });
    // TEST SETUP: in hospital from now to six in the evening, as a stay leaves the record.
    healthOf(sim.player).inHospitalUntil = EDT(2026, 8, 24, 18);
    sim.advanceTo(EDT(2026, 8, 24, 11));
    expect(sim.timeline.get(gym)!.status).toBe('missed');
    const nap = sleepFor(sim, 1);
    expect(nap.error).toBeUndefined();
    expect(nap.ok).toBe(true);
  });

  it('PLAYER JOURNEY: a plan at 6 AM slept through on a night booked at 11 PM is missed quietly, the night says so once, and its hours don’t hold the morning', () => {
    const sim = student('g04-plan-night');
    const gym = plan(sim, { title: 'Gym', at: EDT(2026, 8, 25, 6), durationMinutes: 180 });
    sim.advanceTo(EDT(2026, 8, 24, 23));
    const night = sleepFor(sim, 8);
    expect(night.value!.wokeAt).toBe(EDT(2026, 8, 25, 7));
    expect(sim.timeline.get(gym)!.status).toBe('missed');
    expect(titled(sim, 'You Slept Through 1 Commitment').map((n) => n.body)).toEqual(['You were asleep for Gym, so you missed it.']);
    expect(titled(sim, 'You Missed Gym')).toHaveLength(0);
    // Missed, its hours to 9 AM aren't spent at it: a nap at 7 isn't refused as "You're at Gym until 9:00 AM."
    const nap = sleepFor(sim, 1);
    expect(nap.error).toBeUndefined();
    expect(nap.ok).toBe(true);
  });

  it('PLAYER JOURNEY: plans written and opened again come due once each: one gone to holds its hours, one in New York is missed and said once', () => {
    let sim = student('g04-plan-reload');
    const gym = plan(sim, { title: 'Gym', at: EDT(2026, 8, 24, 12), durationMinutes: 120 });
    const dinner = plan(sim, { title: 'Dinner', at: EDT(2026, 8, 24, 18), durationMinutes: 60, locationId: 'us-ny-newyork' });
    sim = reload(sim);
    expect(sim.universe.scheduled.filter((i) => i.kind === PLAN_KIND).map((i) => [i.id, i.status])).toEqual([[gym, 'pending'], [dinner, 'pending']]);
    sim.advanceTo(EDT(2026, 8, 24, 12, 30));
    expect(sim.timeline.get(gym)!.status).toBe('done');
    expect(sleepFor(sim, 1).error).toBe('You’re at Gym until 2:00 PM.');
    expect(sim.execute<{ ok: boolean; error?: string }>({ kind: 'calendar.skip', payload: { entryId: gym } }).value).toEqual({ ok: false, error: 'That’s already over: it was kept, missed or called off.' });
    sim.advanceTo(EDT(2026, 8, 24, 19));
    expect(sim.timeline.get(dinner)!.status).toBe('missed');
    expect(titled(sim, 'You Missed Dinner').map((n) => n.body)).toEqual(['It was in New York at 6:00 PM, and you were in New Haven. Missing a plan of your own costs nothing else.']);
    // Done, its hours over: sleep is taken again.
    expect(sleepFor(sim, 1).ok).toBe(true);
    sim = reload(sim);
    sim.advanceTo(EDT(2026, 8, 25, 12));
    expect(titled(sim, 'You Missed Dinner')).toHaveLength(1);
  });
});

/** The next midnight's rollover on the calendar. */
const nextMidnight = (sim: Simulation) => sim.universe.scheduled.find((i) => i.kind === 'life.day_rollover' && i.status === 'pending')!.at;

describe('life.day_rollover', () => {
  it('PLAYER JOURNEY: across a midnight the clock reaches after a reload, a sprain weighs 1 morale and 1 stress against an unhurt twin, once; mended, it weighs nothing', () => {
    let [hurt, twin] = [student('g04-roll'), student('g04-roll')];
    for (const sim of [hurt, twin]) sim.advanceTo(EDT(2026, 8, 24, 23, 50));
    // TEST SETUP: a sprain, five days to mend and none off work, put on the record as an injury leaves it.
    healthOf(hurt.player).injury = { kind: 'sprain', at: hurt.now, until: hurt.now + 5 * MS_DAY };
    [hurt, twin] = [reload(hurt), reload(twin)];
    const midnight = nextMidnight(hurt);
    expect(midnight).toBe(EDT(2026, 8, 25, 0));
    for (const sim of [hurt, twin]) sim.advanceTo(midnight);
    expect(healthOf(twin.player).injury).toBeUndefined();
    // INJURY.weighs, SLATE's estimate: 1 morale and 1 stress a day hurt.
    expect(twin.player.wellbeing.morale - hurt.player.wellbeing.morale).toBeCloseTo(1, 9);
    expect(hurt.player.wellbeing.stress - twin.player.wellbeing.stress).toBeCloseTo(1, 9);
    // Five days on it's mended: the midnight after weighs the same on both.
    for (const sim of [hurt, twin]) sim.advanceTo(EDT(2026, 8, 30, 23, 59));
    const at = nextMidnight(hurt);
    const before = [hurt, twin].map((sim) => ({ ...sim.player.wellbeing }));
    for (const sim of [hurt, twin]) sim.advanceTo(at);
    const [dh, dt] = [hurt, twin].map((sim, i) => ({ morale: sim.player.wellbeing.morale - before[i]!.morale, stress: sim.player.wellbeing.stress - before[i]!.stress }));
    expect(healthOf(hurt.player).injury!.until).toBeLessThan(at);
    expect(dh!.morale - dt!.morale).toBeCloseTo(0, 6);
    expect(dh!.stress - dt!.stress).toBeCloseTo(0, 6);
  });

  it('PLAYER JOURNEY: everyday life’s injury is drawn by a midnight the clock reaches: on this student, a bad knock at midnight on 19 November, said once, five days to mend', () => {
    // 'g04-hurt-4' was found by playing students through their first year: the one everyday injury in it.
    const sim = student('g04-hurt-4');
    sim.advanceTo(EST(2026, 11, 18, 23, 59));
    expect(healthOf(sim.player).injury).toBeUndefined();
    const midnight = nextMidnight(sim);
    expect(midnight).toBe(EST(2026, 11, 19, 0));
    sim.advanceTo(midnight);
    expect(healthOf(sim.player).injury).toEqual({ kind: 'bruise', at: midnight, until: midnight + 5 * MS_DAY });
    // Yale Health leaves nothing to pay for it, so the notice names no bill. Until 2026-10-16 this read '5 days to mend. ',
    // the space the empty second sentence left behind it, which the notice had (brief 09's journeys, injury.ts).
    expect(titled(sim, 'A Bad Knock').map((n) => [n.at, n.body])).toEqual([[midnight, '5 days to mend.']]);
    sim.advanceTo(EST(2026, 11, 25, 12));
    expect(titled(sim, 'A Bad Knock')).toHaveLength(1);
  });

  it('PLAYER JOURNEY: a meal ordered in goes onto the scale at midnight, 134 kcal at Hall’s pace, and only the once', () => {
    const [ordered, twin] = [student('g04-roll'), student('g04-roll')];
    for (const sim of [ordered, twin]) sim.advanceTo(EDT(2026, 8, 24, 21));
    ordered.must({ kind: 'life.look_after', payload: { action: 'order' } });
    const midnight = nextMidnight(ordered);
    for (const sim of [ordered, twin]) sim.advanceTo(midnight);
    // A restaurant's meal is 134 kcal over the same at home (USDA ERS); a day's kcal go into the weight over 23.9 a
    // kilogram a day times 365 / ln 2 days (Hall, Lancet 2011): 0.0106 kg, on a scale kept to the gram.
    const gram = 134 / (23.9 * 365 / Math.LN2);
    const first = ordered.player.body!.weightKg - twin.player.body!.weightKg;
    expect(Math.abs(first - gram)).toBeLessThanOrEqual(0.001);
    // The next midnight weighs a day neither twin ate out: the gap stays as it was, give or take a gram's rounding.
    for (const sim of [ordered, twin]) sim.advanceTo(nextMidnight(ordered));
    expect(Math.abs(ordered.player.body!.weightKg - twin.player.body!.weightKg - first)).toBeLessThanOrEqual(0.001);
  });

  it('PLAYER JOURNEY: each midnight the clock reaches, fitness falls its 0.18 untrained, the day’s groceries are bought then, and hygiene starts the day at 82 or better', () => {
    const sim = student('g04-fit');
    expect(sim.player.wellbeing.fitness).toBe(50);
    for (const want of [49.82, 49.64, 49.46]) {
      const at = nextMidnight(sim);
      sim.advanceTo(at);
      // Mujika & Padilla's detraining, 0.18 a day toward an everyday 35, with no workout to hold it.
      expect(sim.player.wellbeing.fitness).toBeCloseTo(want, 9);
      expect(memos(sim, 'Groceries').filter((t) => t.at === at)).toHaveLength(1);
      expect(sim.player.wellbeing.hygiene).toBeGreaterThanOrEqual(82);
    }
  });
});

/** TEST SETUP: a save store in memory, under the real adapter the slots read. */
const memoryAdapter = () => {
  const kept = new Map<string, string>();
  return new LocalSaveAdapter({ getItem: async (k) => kept.get(k) ?? null, setItem: async (k, v) => { kept.set(k, v); }, removeItem: async (k) => { kept.delete(k); } });
};

describe('life.end', () => {
  it('PLAYER JOURNEY: a student starved past BMI 12 whose body falls a band the same midnight dies a minute after it: the redraw that night doesn’t call the starved end off, the clock stops for good, and the save keeps it', () => {
    // 172 cm and 35 kg, a body mass index of 35 / 1.72² = 11.8, which creation takes as given (its ranges are 120 to
    // 230 cm and 35 to 250 kg, and nothing more is asked of them).
    const sim = student('g04-starve', { heightCm: 172, weightKg: 35 });
    expect(sim.player.body!.weightKg / 1.72 ** 2).toBeLessThan(12);
    const drawnAt = healthOf(sim.player).endBand!;
    expect(drawnAt).toBe(bandFor(sim.player.wellbeing.condition, 24));
    sim.advanceTo(EDT(2026, 8, 24, 23, 50));
    expect(sim.universe.meta.endedAt).toBeUndefined();
    // TEST SETUP: the body worn to 40 condition, as months of going hungry would leave it, so its band moves tonight.
    sim.player.wellbeing.condition = 40;
    const result = sim.advanceTo(EDT(2026, 8, 26, 12));
    // At midnight the band was drawn again (the condition then, a band and more down), and the starved end stood.
    expect(healthOf(sim.player).endBand).toBe(bandFor(sim.player.wellbeing.condition, 24));
    expect(healthOf(sim.player).endBand).toBeGreaterThan(drawnAt);
    const ends = sim.universe.scheduled.filter((i) => i.kind === END_KIND);
    expect(ends.filter((i) => i.status === 'done').map((i) => [i.at, i.payload.cause])).toEqual([[EDT(2026, 8, 25, 0, 1), 'starved']]);
    expect(sim.universe.meta.endedAt).toBe(EDT(2026, 8, 25, 0, 1));
    expect(sim.universe.meta.endedAge).toBe(24);
    expect(result.to).toBe(EDT(2026, 8, 25, 0, 1));
    expect(sim.now).toBe(EDT(2026, 8, 25, 0, 1));
    expect(titled(sim, 'A Life, Ended').map((n) => n.body)).toEqual(['Ada Cole died at 24.']);
    // Nothing moves it after that, here or in the save opened again.
    expect(sim.advanceBy(30 * MS_DAY).itemsProcessed).toBe(0);
    expect(sim.now).toBe(EDT(2026, 8, 25, 0, 1));
    const back = reload(sim);
    expect(back.universe.meta.endedAt).toBe(EDT(2026, 8, 25, 0, 1));
    back.advanceBy(MS_DAY);
    expect(back.now).toBe(EDT(2026, 8, 25, 0, 1));
    expect(titled(back, 'A Life, Ended')).toHaveLength(1);
  });

  it('PLAYER JOURNEY: the student born in 1940 dies at 86 at the end her birthday drew, and the clock stops there', () => {
    const sim = student('g04-old-49', { birthYear: 1940, birthMonth: 8, birthDay: 30 });
    sim.advanceTo(EDT(2026, 8, 30, 9, 1));
    const end = sim.universe.scheduled.find((i) => i.kind === END_KIND && i.status === 'pending')!;
    const result = sim.advanceTo(EST(2027, 1, 1, 12));
    expect(sim.timeline.get(end.id)!.status).toBe('done');
    expect(sim.universe.meta.endedAt).toBe(end.at);
    expect(result.to).toBe(end.at);
    expect(sim.universe.meta.endedAge).toBe(86);
    expect(titled(sim, 'A Life, Ended').map((n) => n.body)).toEqual(['Ada Cole died at 86.']);
    expect(drawn(sim, GameShell).text).toContain('Aged 86');
  });

  it('PLAYER JOURNEY: a student made at BMI 11.8 dies at her first midnight; the life opens onto LifeEnded and nothing else, and its slot says “Died At 24” and offers how it ended', async () => {
    const sim = student('g04-starve', { heightCm: 172, weightKg: 35 });
    sim.advanceTo(EDT(2026, 8, 25, 12));
    expect(sim.universe.meta.endedAt).toBe(EDT(2026, 8, 25, 0, 1));
    expect(sim.universe.scheduled.filter((i) => i.kind === END_KIND && i.status === 'done').map((i) => i.payload.cause)).toEqual(['starved']);
    const shell = drawn(sim, GameShell);
    expect(shell.text).toContain('A Life, Ended Ada Cole June 14, 2002 – August 25, 2026 · Aged 24 · Actress');
    expect(shell.text).toContain('The clock has stopped for this life.');
    // No clock, no rail, no Home: one way on.
    expect(shell.buttons.map((b) => b.text)).toEqual(['Back To The Slots']);
    // The slot, as the app writes it (`refreshMeta` before every save) and the real adapter lists it.
    refreshMeta(sim);
    expect(sim.universe.meta.careerLabel).toBe('Actress, Yale Drama Year 1, Died At 24');
    const adapter = memoryAdapter();
    await adapter.save(sim.universe);
    const slots = await adapter.listSlots();
    const SlotsScreen = () => createElement(SaveSlots, { adapter, initialSlots: slots, onNew: () => undefined, onContinue: () => undefined });
    const shown = drawn(sim, SlotsScreen);
    expect(shown.text).toContain('Ada Cole Actress, Yale Drama Year 1, Died At 24');
    expect(shown.buttons.map((b) => b.text)).toContain('See How It Ended');
    expect(shown.buttons.map((b) => b.text)).not.toContain('Continue');
  });
});

const decisionTitled = (sim: Simulation, title: string) => Object.values(sim.universe.decisions).find((d) => d.title === title);
const pendingTicks = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === 'world.tick' && i.status === 'pending');

describe('world.tick', () => {
  it('PLAYER JOURNEY: a London-born student’s 2026 return, raised on 1 February, is on Home until its date; the tick after closes it, Home drops it, and it’s gone a season and a half on', () => {
    // Born in London, an F-1 student files every year (Form 8843 at least), so the return's raiser reaches her; a
    // New York-born student with no income has none to file.
    let sim = student('g04-tick', { homeRegionId: 'uk-eng-london' });
    sim.advanceTo(EST(2027, 2, 2, 12));
    const ret = decisionTitled(sim, 'Your 2026 Tax Return')!;
    expect(ret.createdAt).toBe(EST(2027, 2, 1, 9));
    // The IRS's 15 April, to the minute before midnight.
    expect(ret.dueAt).toBe(EDT(2027, 4, 15, 23, 59));
    const open = drawn(sim, Home);
    expect(open.text).toContain('Your 2026 Tax Return');
    expect(open.buttons.map((b) => b.text)).toContain('File It');
    sim = reload(sim);
    expect(pendingTicks(sim)).toHaveLength(1);
    sim.advanceTo(EDT(2027, 4, 18, 12));
    const closed = sim.universe.decisions[ret.id]!;
    // Closed by the first tick after its date (the tick runs every two days), not waved away.
    expect(closed.resolvedAt! - ret.dueAt!).toBeGreaterThan(0);
    expect(closed.resolvedAt! - ret.dueAt!).toBeLessThanOrEqual(2 * MS_DAY);
    expect(closed.dismissedAt).toBeUndefined();
    expect(drawn(sim, Home).text).not.toContain('Your 2026 Tax Return');
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: ret.id, actionIndex: 0 } }).error).toBe('That question is already settled: it was answered, or its date passed.');
    // Kept 180 days after it closed, gone at the tick after.
    sim.advanceTo(closed.resolvedAt! + 179 * MS_DAY);
    expect(sim.universe.decisions[ret.id]).toBeDefined();
    sim.advanceTo(closed.resolvedAt! + 183 * MS_DAY);
    expect(sim.universe.decisions[ret.id]).toBeUndefined();
  });

  it('PLAYER JOURNEY: a row dismissed with its date 300 days ahead is forgotten 180 days on; a day’s done items go after 400 days, across a reload', () => {
    let sim = student('g04-tick2');
    const start = sim.now;
    // TEST SETUP: a row raised as a raiser raises one, dated past the 180 days no raiser in the engine reaches. Until
    // 2026-10-14 an undated row was raised beside it by hand, to be waved away after ninety days, and this one was kept
    // to its date; the owner had both rules go that day.
    sim.requireDecision({ urgency: 40, category: 'test', title: 'A Dated Question', detail: 'Raised in the test.', dueAt: start + 300 * MS_DAY, refType: 'test', refId: 'dated' });
    const dated = decisionTitled(sim, 'A Dated Question')!.id;
    sim.must({ kind: 'world.dismiss_decision', payload: { decisionId: dated } });
    expect(openDecisions(sim)).toHaveLength(0);
    expect(drawn(sim, Home).text).not.toContain('A Dated Question');
    const firstNight = sim.universe.scheduled.find((i) => i.kind === 'life.day_rollover')!;
    expect(firstNight.at).toBe(EDT(2026, 8, 25, 0));
    sim = reload(sim);
    expect(pendingTicks(sim)).toHaveLength(1);
    sim.advanceTo(start + 179 * MS_DAY);
    expect(sim.universe.decisions[dated]).toBeDefined();
    sim.advanceTo(start + 183 * MS_DAY);
    expect(sim.universe.decisions[dated]).toBeUndefined();
    // The timeline keeps what's been done for 400 days: the first midnight goes, one five nights later stays.
    const fifthNight = sim.universe.scheduled.find((i) => i.kind === 'life.day_rollover' && i.at === EDT(2026, 8, 30, 0))!;
    expect(fifthNight.status).toBe('done');
    sim.advanceTo(firstNight.at + 403 * MS_DAY);
    expect(sim.universe.scheduled.some((i) => i.id === firstNight.id)).toBe(false);
    expect(sim.universe.scheduled.some((i) => i.id === fifthNight.id)).toBe(true);
    expect(pendingTicks(sim)).toHaveLength(1);
  });
});
