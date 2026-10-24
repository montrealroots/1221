/**
 * Evidence for seven health rows the review of 2026-10-13 left partial (verification group g03-life): booking a doctor,
 * choosing a doctor and a pharmacy, Yale's dental plan, enrolling in cover, a longer supply of medicine, and paying off
 * a medical debt. Each row's gaps are closed here, where the engine lets them be, through the command its Papers
 * control sends, and the clock, and each consequence is read where the row says it's read, against figures worked out
 * from the rule's own published numbers (AMN's 23.5 days, Yale Health's $10 generic, Walmart's $4, Yale Delta Dental's
 * $312.72, $50 and 80%, Access Health CT's $706 and $45, Farmacias Similares' MX$60) or from a twin that didn't act,
 * never from the helper the engine computes them with. Two gaps were left open, each needing an engine change: New
 * Haven lists one doctor’s practice, so choosing one decides nothing for the student, which is open still; and until
 * 2026-10-13 a booking moved off a weekend but not off a public holiday, which was fixed that day.
 *
 * - `health.book`: refused in each of its three sentences (nothing owed, an appointment already, no wait published);
 *   a visit the week booked, called off and booked again on Papers, 24 days on and moved off a Sunday, owedVisit
 *   cleared and a second press refused, kept on the clock once across two reloads. Until 2026-10-15 she was booked there
 *   with nothing picked and the visit was Yale Health's $0; from that day Yale Health pays only for a member's care at its
 *   Health Center, so she picks Fair Haven, and the visit is billed the uninsured's $183.98. Its
 *   `renewPrescriptions` is unread in New Haven (`RX.validYears` holds British Columbia alone), so it's followed in
 *   Vancouver, where a renewal booked again is the next fill, and one left owed is booked again by the next week’s fill
 *   (until 2026-10-13 it ran the medicine out for good, and this file held that).
 * - `health.choose_clinic`: its three refusals through the command. New Haven lists one doctor's practice, the one had
 *   with nothing chosen, so the choice is followed where it decides something: in London the practice chosen is where
 *   the week's visit is booked and had, and billed at Bupa's £79 (from 2026-10-13: until then the NHS paid it, to
 *   nothing), and in Mexico City an uninsured visit is billed at its own published price.
 * - `health.choose_pharmacy`: on the student, the first fill of a drawn high blood pressure at Walmart's $4 under
 *   Yale's $10 copay, against a twin at $10, and again after a reload; CVS's $12.50 left at the copay.
 * - `health.dental`: Buy Dental pressed, the year's $312.72 in one posting, its end, its two refusals; a filling the week
 *   brought at the $50 deductible and 80%, and at the $1,000 maximum; refused when the bank can't cover the year. A
 *   January filling is charged no second deductible inside the plan year that began on 1 October; until 2026-10-13 it
 *   was, and its test failed when written; fixed that day.
 * - `health.enroll`: at school refused through the command; withdrawn, Enroll pressed into HUSKY D, refused "You're
 *   enrolled from …" and "You're enrolled." through the command, care then priced at HUSKY D's; with September's wages
 *   over every program's limit, the marketplace, and its $706 premium charged by the clock on the 1st, once a month
 *   across a reload.
 * - `health.extra_supply`: pressed on the student, three fills of $10 in one posting, no refill for twelve weeks
 *   against a twin's monthly fills; two conditions with the second unpayable refused whole and nothing filled; and the
 *   supply read by the health week: a twin out of medicine loses 3 morale, the one holding a supply doesn't.
 * - `health.pay_bill`: Pay It Off pressed, the bill Settled on Papers and gone from Home's worries; a year and a month
 *   on the clock, a twin who didn't pay is reported once, across a reload, and the one who paid never is; paid from a
 *   named savings account. An account named that can’t pay is refused; until 2026-10-13 it was silently swapped for the
 *   current account, and its test failed when written; fixed that day.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York, a first-year at Yale in
 * New Haven from Monday 24 August 2026; `homeRegionId` is given because a new life must name where it was born. The
 * seeds are chosen for what the clock brings them: g03-37 a high blood pressure and a visit booked on 31 August;
 * g03-27 a high blood pressure; g03-65 depression and high blood pressure; g03-6 depression; g03-13 a filling on
 * 7 September; g03-d-1332 fillings on 5 October 2026 and 18 January 2027. LIFE FIXTURES (`quickSave`), where a New Haven
 * life can't reach the rule: Dublin, which publishes no GP wait; Vancouver, the one place a prescription runs out;
 * London, with more than one doctor's practice; Mexico City, for a US citizen IMSS doesn't cover, where a practice
 * publishes its own price. The screens are rendered as the player has them (react-dom/server) with `useGame`'s `run`
 * as the save's own `execute`; a pressed button or a changed select is the component's own handler, kept on its way
 * through the JSX runtime.
 *
 * TEST SETUP, said again where it's done: the body kept fed, rested and awake through the clock (`tended`), as a
 * player's meals and sleep keep it; balances emptied, overdrawn or refilled by postings against a test line, never by
 * setting a balance; a visit owed set by hand where the engine can't make one beside an appointment, or in a town
 * where none is booked; a medical bill raised with `billCare`, as an injury's is; a Vancouver prescription written two
 * years before; the year's earlier fillings toward Yale's maximum; and September's wages over the programs' limits.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { recordWages } from '@/engine/systems/earnings';
import { billCare, healthOf, medicalDebtOf } from '@/engine/systems/health';
import { APPOINTMENT_KIND, appointmentsOf } from '@/engine/systems/appointments';
import { overdraftRoom } from '@/engine/systems/lending';
import { tabKey } from '@/ui/shell/sections';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  selects: [] as { id?: string; onChange?: (e: { target: { value: string } }) => void }[],
  toasts: [] as string[],
}));

/** Every button and select the screens draw, with its words and its own handler. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, onClick: props.onClick as (() => void) | undefined });
    if (type === 'select' && props) h.selects.push({ id: props.id as string | undefined, onChange: props.onChange as ((e: { target: { value: string } }) => void) | undefined });
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));

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
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { Home } = await import('@/ui/screens/Home');

// ---------------------------------------------------------------------------
// Lives, the clock, money, and the screens over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0, zone = NY) => instantFromZoned({ year, month, day, hour, minute }, zone);
const student = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const lifeIn = (city: string, seed: string, born = city): Simulation => quickSave({ startLocationId: city, homeRegionId: born, wealth: 'comfortable' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

const titled = (sim: Simulation, title: string, from = 0) => sim.universe.notifications.filter((n) => n.title === title && n.at >= from);
const memos = (sim: Simulation, memo: string | RegExp, from = 0) => sim.universe.transactions.filter((t) => t.at >= from && (typeof memo === 'string' ? t.memo === memo : memo.test(t.memo)));
/** What a transaction took from the player's own accounts. */
const taken = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => -t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).reduce((s, p) => s + p.amount, 0);
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const savings = (sim: Simulation) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings' && !a.closedAt)!;
const posted = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount(amount > 0 ? 'income' : 'expense', 'Test').id, amount: -amount }] });

/** TEST SETUP: savings emptied and the current account drawn to its overdraft's limit, so nothing more can be paid; `leave` keeps that much payable. */
function broke(sim: Simulation, leave = 0): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId === sim.player.id && !a.nominal && !a.closedAt && a.kind === 'savings' && a.balance > 0) posted(sim, a.id, -a.balance);
  }
  const c = current(sim);
  const move = -overdraftRoom(sim, sim.player, c) + leave - c.balance;
  if (move !== 0) posted(sim, c.id, move);
}

/** A screen as the player has it: its markup, its words, and the buttons and selects it drew. */
function shown(sim: Simulation, screen: FunctionComponent = PapersWorkspace, tab = 'health') {
  h.sim = sim;
  h.tabs = { [tabKey('/workspace/papers')]: tab };
  h.buttons = [];
  h.selects = [];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' '), buttons: [...h.buttons], selects: [...h.selects] };
}
/** The one button with these words, pressed as the player presses it. */
function press(view: ReturnType<typeof shown>, words: string): void {
  const found = view.buttons.filter((b) => b.text === words);
  expect(found.map((b) => b.text), `one “${words}” on the screen`).toEqual([words]);
  expect(found[0]!.disabled ?? false).toBe(false);
  found[0]!.onClick!();
}
/**
 * Home's What Needs You as the player reads it: what needs putting right is said under the questions, each with the way
 * to its screen, whatever is unread. Until 2026-10-23 (brief 23) it was said only once nothing was unread (`Empty` under
 * "No Decisions Waiting"), so Mark N Read was pressed first where it was shown.
 */
function homeSays(sim: Simulation): string {
  const text = shown(sim, Home).text;
  return text.slice(text.indexOf('What Needs You'), text.indexOf('Up Next'));
}
/** The select with this id, changed to a value as the player picks it. */
function pick(view: ReturnType<typeof shown>, id: string, value: string): void {
  const found = view.selects.filter((s) => s.id === id);
  expect(found).toHaveLength(1);
  found[0]!.onChange!({ target: { value } });
}

// ---------------------------------------------------------------------------
// health.book
// ---------------------------------------------------------------------------

describe('health.book', () => {
  it('refuses with nothing owed, “There’s nothing to see a doctor about.”, books nothing, and Papers offers no Book An Appointment', () => {
    const sim = student('g03-37');
    const r = sim.execute({ kind: 'health.book', payload: {} });
    expect(r).toMatchObject({ ok: false, error: 'There’s nothing to see a doctor about.' });
    expect(appointmentsOf(sim.player)).toEqual([]);
    expect(titled(sim, 'A Doctor’s Appointment')).toEqual([]);
    expect(shown(sim).buttons.map((b) => b.text)).not.toContain('Book An Appointment');
  });

  it('PLAYER JOURNEY: picking Fair Haven, a visit the week booked, called off and booked again on Papers 24 days on and off the Sunday, owedVisit cleared, a second booking refused, kept once and billed the uninsured’s $183.98 across two reloads', () => {
    let sim = student('g03-37');
    // Until 2026-10-15 she picked nothing and the week booked her at Fair Haven, the town's first practice. That day Yale
    // Health's rule that a member's care is had at its Health Center was kept, and with nothing picked a member is booked
    // at Yale Health's practice the next weekday. This journey's point is Fair Haven's 24-day wait run off a Sunday, so
    // she picks Fair Haven on Papers' Your Doctor, as the player does, before the week books.
    h.toasts = [];
    pick(shown(sim), 'own-doctor', 'us-ct-fhchc-grand');
    expect(h.toasts).toEqual(['Fair Haven Community Health Care is now your doctor.']);
    expect(healthOf(sim.player).clinicId).toBe('us-ct-fhchc-grand');
    // The first health week, Monday 31 August, books a doctor's visit: AMN's 23.5 days for a metro it doesn't survey,
    // rounded, is 24 days on, Thursday 24 September, at the practice's 10 o'clock.
    tended(sim, at(2026, 8, 31, 12));
    expect(appointmentsOf(sim.player)).toEqual([{ id: expect.any(String), at: at(2026, 9, 24, 10), what: 'A doctor’s visit', clinicId: 'us-ct-fhchc-grand' }]);
    // Thursday 3 September: Call It Off, as the player presses it.
    tended(sim, at(2026, 9, 3, 12));
    press(shown(sim), 'Call It Off');
    expect(appointmentsOf(sim.player)).toEqual([]);
    expect(healthOf(sim.player).owedVisit).toBe('A doctor’s visit');
    expect(sim.universe.scheduled.filter((i) => i.kind === APPOINTMENT_KIND && i.status === 'pending')).toEqual([]);
    // Owed, Papers shows it and Book An Appointment; pressed, it's 24 days from today, Sunday 27 September, so Monday.
    const owed = shown(sim);
    expect(owed.text).toContain('A doctor’s visit: not yet seen');
    h.toasts = [];
    press(owed, 'Book An Appointment');
    expect(h.toasts).toEqual(['Booked for September 28, 2026.']);
    const booked = appointmentsOf(sim.player);
    expect(booked).toEqual([{ id: expect.any(String), at: at(2026, 9, 28, 10), what: 'A doctor’s visit', clinicId: 'us-ct-fhchc-grand' }]);
    expect(titled(sim, 'A Doctor’s Appointment', sim.now).map((n) => n.body)).toEqual(['A doctor’s visit: booked at Fair Haven Community Health Care for September 28, 2026, the usual wait where you live. Be there then, or press Call It Off on Papers, under Health Cover.']);
    // The visit is no longer owed: the button is gone, and booking again is refused as owing nothing.
    expect(healthOf(sim.player).owedVisit).toBeUndefined();
    expect(shown(sim).buttons.map((b) => b.text)).not.toContain('Book An Appointment');
    expect(sim.execute({ kind: 'health.book', payload: {} })).toMatchObject({ ok: false, error: 'There’s nothing to see a doctor about.' });
    expect(appointmentsOf(sim.player)).toHaveLength(1);
    // Saved and opened again: the appointment and its place on the calendar.
    sim = reload(sim);
    expect(appointmentsOf(sim.player)).toEqual(booked);
    expect(sim.universe.scheduled.filter((i) => i.kind === APPOINTMENT_KIND && i.status === 'pending').map((i) => [i.at, i.label])).toEqual([[at(2026, 9, 28, 10), 'The Doctor, Fair Haven Community Health Care']]);
    // Kept on the clock: the visit at the practice, and the prescriptions renewed, which nothing in New Haven reads.
    // Until 2026-10-15 it was Yale Health's $0, with no bill and "Nothing to pay."; from that day Yale Health pays none of
    // a member's visit outside its Health Center, and Fair Haven, publishing no fee, bills it as SLATE bills anybody
    // uninsured: $100 of 2024 grown by the physicians' services index to 2026, 10,000 × 439.389 ÷ 417.93 = 10,513.47,
    // 10,513 cents, times 1.75 = 18,397.75, $183.98, due in 30 days, the plan paying none (no `covered`).
    tended(sim, at(2026, 9, 28, 12));
    const kept = titled(sim, 'A Doctor’s Visit', at(2026, 9, 28, 10));
    expect(kept.map((n) => [n.at, n.body])).toEqual([[at(2026, 9, 28, 10), 'You saw a doctor at Fair Haven Community Health Care. Yale Health pays for a visit only at its own Health Center, not here. You owe $183.98. It’s taken from your checking account on October 28, 2026, and if there isn’t enough then, it becomes medical debt.']]);
    expect(healthOf(sim.player).bills.filter((b) => b.at === at(2026, 9, 28, 10)).map((b) => [b.what, b.amount, b.dueAt, b.covered])).toEqual([['A doctor’s visit, Fair Haven Community Health Care', 18_398, at(2026, 10, 28, 10), undefined]]);
    expect(appointmentsOf(sim.player).filter((a) => a.what === 'A doctor’s visit')).toEqual([]);
    expect(healthOf(sim.player).chronic!.hypertension!.prescribedAt).toBe(at(2026, 9, 28, 10));
    // Opened again and played a week: the visit had once.
    sim = reload(sim);
    tended(sim, at(2026, 10, 5, 12));
    expect(titled(sim, 'A Doctor’s Visit', at(2026, 9, 28, 10))).toHaveLength(1);
    // And billed once: one bill for it, not a second after the reload.
    expect(healthOf(sim.player).bills.filter((b) => b.what === 'A doctor’s visit, Fair Haven Community Health Care')).toHaveLength(1);
  });

  it('with an appointment booked, refuses another, “You have an appointment already.”, and books nothing twice', () => {
    const sim = student('g03-37');
    tended(sim, at(2026, 8, 31, 12));
    const before = appointmentsOf(sim.player).map((a) => ({ ...a }));
    expect(before).toHaveLength(1);
    // TEST SETUP: a visit owed beside it, which the engine never leaves together (a missed or called-off appointment
    // is taken off before the visit is owed).
    healthOf(sim.player).owedVisit = 'A doctor’s visit';
    expect(sim.execute({ kind: 'health.book', payload: {} })).toMatchObject({ ok: false, error: 'You have an appointment already.' });
    expect(appointmentsOf(sim.player)).toEqual(before);
    expect(healthOf(sim.player).owedVisit).toBe('A doctor’s visit');
  });

  it('LIFE FIXTURE (Dublin, where no GP wait is published): refuses, “No wait is published where you live; you’re seen when it comes up.”, and the visit stays owed', () => {
    const sim = lifeIn('ie-lei-dublin', 'g03-dublin');
    // TEST SETUP: a visit owed, which a Dublin life never books to miss or call off.
    healthOf(sim.player).owedVisit = 'A doctor’s visit';
    expect(sim.execute({ kind: 'health.book', payload: {} })).toMatchObject({ ok: false, error: 'No waiting time is published where you live, so there’s nothing to book: you’re seen when you need care.' });
    expect(healthOf(sim.player).owedVisit).toBe('A doctor’s visit');
    expect(appointmentsOf(sim.player)).toEqual([]);
    expect(titled(sim, 'A Doctor’s Appointment')).toEqual([]);
  });

  // Until 2026-10-13 the twin who left the renewal owed ran out of medicine for good, the week’s fill passing over a
  // prescription past its date while a visit was owed (`renewalDue`), and this test held that. From that day the fill
  // books the visit owed, one appointment for both, as the health week books one for an illness (found by the second
  // round of that day; fixed by the third).
  it('LIFE FIXTURE (Vancouver, where a prescription runs out after two years): a renewal called off and booked again is kept and the medicine filled again; a twin who left it owed has it booked again by the next week’s fill, kept, and filled again too', () => {
    const play = (book: boolean) => {
      let sim = lifeIn('ca-bc-vancouver', 'g03-van-1');
      expect(Object.keys(healthOf(sim.player).chronic ?? {})).toEqual(['depression']);
      // TEST SETUP: the prescription written on 20 January 2024, so it's good to 20 January 2026 (the College of
      // Pharmacists' two years).
      healthOf(sim.player).chronic!.depression!.prescribedAt = at(2024, 1, 20, 12, 0, 'America/Vancouver');
      // The first fill, on Monday 12 January, is within it: thirty days, to 11 February. On 26 January it's past its
      // date, and the doctor's visit to renew it is booked.
      tended(sim, at(2026, 1, 26, 12, 0, 'America/Vancouver'));
      const supplied = healthOf(sim.player).chronic!.depression!.supplyUntil!;
      expect(supplied).toBe(at(2026, 1, 12) + 30 * MS_DAY);
      expect(titled(sim, 'A Prescription Ran Out').map((n) => n.at)).toEqual([at(2026, 1, 26)]);
      const renewal = appointmentsOf(sim.player);
      expect(renewal.map((a) => a.what)).toEqual(['A prescription to renew']);
      sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: renewal[0]!.id } });
      expect(healthOf(sim.player).owedVisit).toBe('A prescription to renew');
      if (book) {
        const { at: when } = sim.must<{ at: number }>({ kind: 'health.book', payload: {} });
        expect(healthOf(sim.player).owedVisit).toBeUndefined();
        sim = reload(sim);
        tended(sim, at(2026, 2, 24, 12, 0, 'America/Vancouver'));
        // Kept, it renewed the prescription; the health week with a week of supply left filled the medicine again.
        expect(titled(sim, 'A Doctor’s Visit', when).filter((n) => n.body.startsWith('You saw a doctor to renew your prescription'))).toHaveLength(1);
        expect(healthOf(sim.player).chronic!.depression!.prescribedAt).toBe(when);
      } else {
        // Left owed: Monday 2 February’s fill finds the prescription past its date and books the visit owed, and says so
        // again, the same words brought up to then.
        tended(sim, at(2026, 2, 2, 12, 0, 'America/Vancouver'));
        const again = appointmentsOf(sim.player);
        expect(again.map((a) => a.what)).toEqual(['A prescription to renew']);
        expect(healthOf(sim.player).owedVisit).toBeUndefined();
        expect(titled(sim, 'A Prescription Ran Out').map((n) => n.at)).toEqual([at(2026, 2, 2)]);
        const when = again[0]!.at;
        tended(sim, at(2026, 2, 24, 12, 0, 'America/Vancouver'));
        expect(titled(sim, 'A Doctor’s Visit', when).filter((n) => n.body.startsWith('You saw a doctor to renew your prescription'))).toHaveLength(1);
        expect(healthOf(sim.player).chronic!.depression!.prescribedAt).toBe(when);
      }
      return { sim, supplied };
    };
    const renewed = play(true);
    const left = play(false);
    for (const { sim, supplied } of [renewed, left]) {
      expect(sim.player.health!.chronic!.depression!.supplyUntil!).toBeGreaterThan(at(2026, 2, 24, 12, 0, 'America/Vancouver'));
      expect(sim.player.health!.chronic!.depression!.supplyUntil!).toBeGreaterThan(supplied);
      expect(sim.player.health!.owedVisit).toBeUndefined();
      expect(shown(sim).text).toMatch(/Depression: Kept Up · Medicine until /);
    }
  });
});

// ---------------------------------------------------------------------------
// health.choose_clinic
// ---------------------------------------------------------------------------

describe('health.choose_clinic', () => {
  it('refuses through the command in its own words: no such practice, a practice in another town, a place that isn’t a doctor’s', () => {
    const sim = student('g03-clinic-refused');
    const tries: [string, string][] = [
      ['', 'No such practice.'],
      ['us-ct-nowhere', 'No such practice.'],
      // One Medical's Flatiron practice is New York's, not New Haven's.
      ['us-ny-onemedical-flatiron', 'Your doctor has to be in the town you live in.'],
      // New Haven's urgent care, its hospital's emergency department and its CVS see no one as their doctor.
      ['us-ct-physicianone-newhaven', 'That isn’t a doctor’s practice.'],
      ['us-ct-ynhh-ed', 'That isn’t a doctor’s practice.'],
      ['us-ct-cvs-newhaven', 'That isn’t a doctor’s practice.'],
    ];
    for (const [clinicId, why] of tries) expect(sim.execute({ kind: 'health.choose_clinic', payload: { clinicId } }), clinicId).toMatchObject({ ok: false, error: why });
    expect(healthOf(sim.player).clinicId).toBeUndefined();
  });

  it('LIFE FIXTURE (London, which lists more than one practice): the doctor picked on Your Doctor is where the week’s visit is booked and had; a twin who picked none is seen at Soho Square', () => {
    const play = (choose: boolean) => {
      let sim = lifeIn('uk-eng-london', 'g03-lon-29');
      if (choose) {
        const before = shown(sim);
        expect(before.text).toContain('A doctor’s visit: Soho Square General Practice');
        h.toasts = [];
        pick(before, 'own-doctor', 'uk-ldn-bupa-gp');
        expect(h.toasts).toEqual(['Bupa Private GP (pay-as-you-go) is now your doctor.']);
        expect(healthOf(sim.player).clinicId).toBe('uk-ldn-bupa-gp');
        sim = reload(sim);
        expect(shown(sim).text).toContain('A doctor’s visit: Bupa Private GP (pay-as-you-go)');
      }
      // Monday 19 January's health week books a visit for a week on.
      tended(sim, at(2026, 1, 20, 12, 0, 'Europe/London'));
      const booked = appointmentsOf(sim.player);
      const label = sim.universe.scheduled.find((i) => i.kind === APPOINTMENT_KIND && i.status === 'pending')?.label;
      tended(sim, at(2026, 1, 27, 12, 0, 'Europe/London'));
      return { booked, label, notice: titled(sim, 'A Doctor’s Appointment').map((n) => n.body), kept: titled(sim, 'A Doctor’s Visit').map((n) => n.body) };
    };
    const chose = play(true);
    const didnt = play(false);
    const day = at(2026, 1, 26, 10, 0, 'Europe/London');
    expect(chose.booked).toEqual([{ id: expect.any(String), at: day, what: 'A doctor’s visit', clinicId: 'uk-ldn-bupa-gp' }]);
    expect(didnt.booked).toEqual([{ id: expect.any(String), at: day, what: 'A doctor’s visit', clinicId: 'uk-ldn-sohosquare-gp' }]);
    expect(chose.label).toBe('The Doctor, Bupa Private GP (pay-as-you-go)');
    expect(didnt.label).toBe('The Doctor, Soho Square General Practice');
    expect(chose.notice).toEqual(['A doctor’s visit: booked at Bupa Private GP (pay-as-you-go) for January 26, 2026, the usual wait where you live. Be there then, or press Call It Off on Papers, under Health Cover.']);
    expect(didnt.notice).toEqual(['A doctor’s visit: booked at Soho Square General Practice for January 26, 2026, the usual wait where you live. Be there then, or press Call It Off on Papers, under Health Cover.']);
    // Bupa's pay-as-you-go GP is private, and the NHS doesn't pay it: its 15-minute visit's £79 (`SELF_PAY`). Until
    // 2026-10-13 this held "Nothing to pay." for it, as at Soho Square, the choice moving only the name.
    expect(chose.kept).toEqual(['You saw a doctor at Bupa Private GP (pay-as-you-go). You owe £79.00. It’s taken from your checking account on February 25, 2026, and if there isn’t enough then, it becomes medical debt.']);
    expect(didnt.kept).toEqual(['You saw a doctor at Soho Square General Practice. There’s nothing to pay.']);
  });

  it('LIFE FIXTURE (Mexico City, a US citizen IMSS doesn’t cover): the doctor chosen bills an uninsured visit at its own published MX$60, named on the bill; a twin is billed at IMSS’s practice', () => {
    const play = (choose: boolean) => {
      const sim = lifeIn('mx-cmx-mexicocity', 'g03-mex-38', 'us-ny-newyork');
      if (choose) {
        sim.must({ kind: 'health.choose_clinic', payload: { clinicId: 'mx-cdmx-similares-consultorio' } });
        // Papers quotes it before it's had: Farmacias Similares' consulta, MX$60 (saludiario).
        expect(shown(sim).text).toContain('What it would cost you here now: a doctor’s visit MX$60.00,');
      }
      // Monday 12 January's health week brings a doctor's visit, had at once: no wait is published for them here.
      tended(sim, at(2026, 1, 13, 12));
      return healthOf(sim.player).bills.filter((b) => b.what.startsWith('A doctor’s visit')).map((b) => [b.at, b.what, b.amount]);
    };
    const chose = play(true);
    const didnt = play(false);
    expect(chose).toEqual([[at(2026, 1, 12), 'A doctor’s visit, Farmacias Similares with Dr. Simi consultorio (Consultorio Médico Similares)', 60_00]]);
    expect(didnt).toHaveLength(1);
    expect(didnt[0]![1]).toBe('A doctor’s visit, IMSS Unidad de Medicina Familiar No. 1');
    expect(didnt[0]![2]).toBeGreaterThan(60_00);
  });
});

// ---------------------------------------------------------------------------
// health.choose_pharmacy
// ---------------------------------------------------------------------------

describe('health.choose_pharmacy', () => {
  const fills = (sim: Simulation) => memos(sim, 'Medicine for high blood pressure').map((t) => [t.at, taken(sim, t)]);

  it('PLAYER JOURNEY: Walmart picked on Your Pharmacy, a drawn high blood pressure is filled at its $4 under Yale’s $10 copay, against $10 for a twin who picked none, and again after a reload', () => {
    const play = (choose: boolean) => {
      let sim = student('g03-37');
      expect(healthOf(sim.player).chronic).toEqual({ hypertension: { treated: true } });
      if (choose) {
        h.toasts = [];
        pick(shown(sim), 'own-pharmacy', 'walmart');
        expect(h.toasts).toEqual(['Walmart Pharmacy is now your pharmacy.']);
        sim = reload(sim);
        expect(healthOf(sim.player).pharmacy).toBe('walmart');
      }
      // The first health week fills thirty days; the next fill comes with a week left, on Monday 28 September.
      tended(sim, at(2026, 9, 29, 12));
      return fills(sim);
    };
    expect(play(true)).toEqual([[at(2026, 8, 31), 4_00], [at(2026, 9, 28), 4_00]]);
    expect(play(false)).toEqual([[at(2026, 8, 31), 10_00], [at(2026, 9, 28), 10_00]]);
  });

  it('a chain dearer than the copay leaves the copay: CVS’s $12.50 generic is filled at Yale’s $10; a chain that isn’t one is refused', () => {
    const sim = student('g03-37');
    expect(sim.execute({ kind: 'health.choose_pharmacy', payload: { chain: 'boots' } })).toMatchObject({ ok: false, error: 'There’s no such pharmacy.' });
    expect(healthOf(sim.player).pharmacy).toBeUndefined();
    sim.must({ kind: 'health.choose_pharmacy', payload: { chain: 'cvs' } });
    tended(sim, at(2026, 8, 31, 12));
    expect(fills(sim)).toEqual([[at(2026, 8, 31), 10_00]]);
  });
});

// ---------------------------------------------------------------------------
// health.dental
// ---------------------------------------------------------------------------

describe('health.dental', () => {
  const fillings = (sim: Simulation) => healthOf(sim.player).bills.filter((b) => b.what === 'The dentist, a filling').map((b) => [b.at, b.amount]);
  /** Yale Delta Dental Basic's share of a filling at a price: the $50 deductible still owed, then 80% of the rest (yalehealth.yale.edu, 2026–27). */
  const leaves = (price: number, deductible: number) => price - Math.round((price - deductible) * 0.8);

  it('PLAYER JOURNEY: Buy Dental pressed on Papers takes the year’s $312.72 in one posting, runs to 1 October 2027 across a reload, and is neither bought twice nor dropped', () => {
    let sim = student('g03-13');
    const view = shown(sim);
    expect(view.text).toContain('A Dental Plan Yale Delta Dental Basic: $312.72 a year');
    const was = current(sim).balance;
    h.toasts = [];
    press(view, 'Buy Dental');
    expect(h.toasts).toEqual(['You’re covered for the dentist from today.']);
    expect(was - current(sim).balance).toBe(312_72);
    const paid = memos(sim, 'Yale Delta Dental Basic, the year');
    expect(paid).toHaveLength(1);
    expect(taken(sim, paid[0]!)).toBe(312_72);
    sim = reload(sim);
    expect(healthOf(sim.player).dental).toMatchObject({ plan: 'yale', from: at(2026, 8, 24, 7, 30), until: at(2027, 10, 1, 0) });
    expect(sim.execute({ kind: 'health.dental', payload: { on: true } })).toMatchObject({ ok: false, error: 'You already have a dental plan.' });
    expect(sim.execute({ kind: 'health.dental', payload: { on: false } })).toMatchObject({ ok: false, error: 'Yale’s dental plan can’t be canceled once paid.' });
    const after = shown(sim);
    expect(after.buttons.map((b) => b.text)).not.toContain('Buy Dental');
    expect(after.buttons.map((b) => b.text)).not.toContain('Drop Dental');
    expect(after.text).toContain('Paid By The Plan This Year $0.00 of $1,000.00');
    expect(memos(sim, 'Yale Delta Dental Basic, the year')).toHaveLength(1);
  });

  it('a filling the week brings is billed at Yale’s terms, the $50 deductible and then 20% of the rest, against the full price a twin with no plan is billed', () => {
    const play = (buy: boolean) => {
      const sim = student('g03-13');
      if (buy) sim.must({ kind: 'health.dental', payload: { on: true } });
      // Monday 7 September's health week brings the dentist, and a filling.
      tended(sim, at(2026, 9, 8, 12));
      return sim;
    };
    const covered = play(true);
    const bare = play(false);
    const [[day, price]] = fillings(bare) as [[number, number]];
    expect(day).toBe(at(2026, 9, 7));
    expect(fillings(covered)).toEqual([[day, leaves(price, 50_00)]]);
    const plan = price - leaves(price, 50_00);
    expect(shown(covered).text).toContain(`Paid By The Plan This Year $${(plan / 100).toFixed(2)} of $1,000.00`);
  });

  it('to the plan’s $1,000 a year: with $990 of it paid, the next filling is paid $10 and the rest is theirs', () => {
    const play = (buy: boolean) => {
      const sim = student('g03-d-1332');
      if (buy) {
        sim.must({ kind: 'health.dental', payload: { on: true } });
        // TEST SETUP: the year's earlier fillings, which paid the deductible and $990 of the maximum.
        Object.assign(healthOf(sim.player).dental!, { deductible: { 2026: 50_00 }, paid: { 2026: 990_00 } });
      }
      // Monday 5 October's health week brings a filling.
      tended(sim, at(2026, 10, 6, 12));
      return sim;
    };
    const covered = play(true);
    const [[day, price]] = fillings(play(false)) as [[number, number]];
    expect(day).toBe(at(2026, 10, 5));
    expect(fillings(covered)).toEqual([[day, price - 10_00]]);
    expect(healthOf(covered.player).dental!.paid[2026]).toBe(1_000_00);
  });

  it('refused in its own words when the bank can’t cover the year, and nothing bought or posted', () => {
    const sim = student('g03-dental-broke');
    broke(sim);
    const before = sim.universe.transactions.length;
    expect(sim.execute({ kind: 'health.dental', payload: { on: true } })).toMatchObject({ ok: false, error: 'Your bank can’t cover $312.72 for the year, so nothing was charged.' });
    expect(healthOf(sim.player).dental).toBeUndefined();
    expect(sim.universe.transactions.length).toBe(before);
  });

  it('a January filling is in the plan year that began on 1 October, so its $50 deductible, paid in October, isn’t charged again', () => {
    const play = (buy: boolean) => {
      const sim = student('g03-d-1332');
      if (buy) sim.must({ kind: 'health.dental', payload: { on: true } });
      // Fillings on Monday 5 October 2026 and Monday 18 January 2027, one plan year (1 October to 30 September).
      tended(sim, at(2027, 1, 19, 12));
      return fillings(sim);
    };
    const covered = play(true);
    const [[october, fall], [january, spring]] = play(false) as [[number, number], [number, number]];
    expect([october, january]).toEqual([at(2026, 10, 5), at(2027, 1, 18)]);
    // October's filling pays the year's deductible; January's, in the same plan year, is 20% of its price alone.
    expect(covered).toEqual([[october, leaves(fall, 50_00)], [january, leaves(spring, 0)]]);
  });
});

// ---------------------------------------------------------------------------
// health.enroll
// ---------------------------------------------------------------------------

describe('health.enroll', () => {
  /** Withdrawn on Friday 2 October at midnight, after the fifteenth day of classes: Yale Health runs thirty days more, to 1 November. */
  const withdrawn = (seed: string, setup?: (sim: Simulation) => void) => {
    const sim = student(seed);
    setup?.(sim);
    tended(sim, at(2026, 10, 2, 0));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(false);
    return sim;
  };

  it('at school, refused through the command in Yale Health’s words, and Papers offers no Enroll', () => {
    const sim = student('g03-enroll-school');
    expect(sim.execute({ kind: 'health.enroll', payload: {} })).toMatchObject({ ok: false, error: 'Yale Health covers you while you’re at the School.' });
    const view = shown(sim);
    expect(view.text).toContain('Yale Health covers you while you’re at the School.');
    expect(view.buttons.map((b) => b.text)).not.toContain('Enroll');
    expect(healthOf(sim.player).program).toBeUndefined();
    expect(healthOf(sim.player).marketplace).toBeUndefined();
  });

  it('PLAYER JOURNEY: withdrawn, Enroll pressed puts them in HUSKY D from 1 November; again that day “You’re enrolled from November 1, 2026.”, in November “You’re enrolled.”, and care is HUSKY D’s', () => {
    let sim = withdrawn('g03-enroll-husky');
    const before = shown(sim);
    expect(before.text).toContain('What it would cost you here now: a doctor’s visit $0.00, urgent care $0.00, an emergency $50.00');
    h.toasts = [];
    press(before, 'Enroll');
    expect(h.toasts).toEqual(['Enrolled in HUSKY D, from November 1, 2026.']);
    expect(healthOf(sim.player).program).toMatchObject({ kind: 'medicaid', state: 'ct', from: at(2026, 11, 1, 0) });
    expect(sim.execute({ kind: 'health.enroll', payload: {} })).toMatchObject({ ok: false, error: 'You’re already enrolled, from November 1, 2026.' });
    expect(shown(sim).buttons.map((b) => b.text)).toContain('Drop The Plan');
    sim = reload(sim);
    expect(sim.execute({ kind: 'health.enroll', payload: {} })).toMatchObject({ ok: false, error: 'You’re already enrolled, from November 1, 2026.' });
    tended(sim, at(2026, 11, 2, 12));
    expect(sim.execute({ kind: 'health.enroll', payload: {} })).toMatchObject({ ok: false, error: 'You’re already enrolled.' });
    const after = shown(sim).text;
    expect(after).toContain('This Month HUSKY D');
    // HUSKY D asks no copays: Yale Health's $50 emergency is $0.
    expect(after).toContain('What it would cost you here now: a doctor’s visit $0.00, urgent care $0.00, an emergency $0.00');
    expect(titled(sim, 'Your Health Cover Ended')).toEqual([]);
  });

  it('PLAYER JOURNEY: withdrawn with September’s wages over every program’s limit, Enroll puts them in the marketplace from 1 November; the clock charges Access Health CT’s $706 on 1 November and 1 December, once each across a reload, and a visit is the plan’s $45', () => {
    // TEST SETUP: $3,000 of wages in September, over HUSKY D's 138% of the poverty line and Covered Connecticut's 175%
    // of 2025's ($2,282.29 a month), which a student's own work doesn't reach.
    let sim = withdrawn('g03-enroll-market', (s) => recordWages(s.player, at(2026, 9, 15, 12), NY, { gross: 3_000_00, employer: 'TEST SETUP' }));
    h.toasts = [];
    press(shown(sim), 'Enroll');
    expect(h.toasts).toEqual(['Enrolled in the marketplace, from November 1, 2026.']);
    expect(healthOf(sim.player).marketplace).toMatchObject({ from: at(2026, 11, 1, 0), state: 'ct' });
    expect(sim.execute({ kind: 'health.enroll', payload: {} })).toMatchObject({ ok: false, error: 'You’re already enrolled, from November 1, 2026.' });
    const premiums = () => memos(sim, 'Marketplace health plan premium').map((t) => [t.at, taken(sim, t)]);
    expect(premiums()).toEqual([]);
    tended(sim, at(2026, 11, 2, 12));
    // KFF's 2026 average benchmark silver premium in Connecticut, $706 a month, on the 1st at half past midnight.
    expect(premiums()).toEqual([[at(2026, 11, 1, 0, 30), 706_00]]);
    sim = reload(sim);
    tended(sim, at(2026, 12, 2, 12));
    expect(premiums()).toEqual([[at(2026, 11, 1, 0, 30), 706_00], [at(2026, 12, 1, 0, 30), 706_00]]);
    // Kept for the return's premium tax credit.
    expect(healthOf(sim.player).premiums[2026]).toEqual([706_00, 706_00]);
    const view = shown(sim).text;
    expect(view).toContain('This Month Marketplace Plan');
    // Access Health CT's Standard Silver 2026: $45 a visit, $75 urgent care, $450 an emergency room.
    expect(view).toContain('What it would cost you here now: a doctor’s visit $45.00, urgent care $75.00, an emergency $450.00');
  });
});

// ---------------------------------------------------------------------------
// health.extra_supply
// ---------------------------------------------------------------------------

describe('health.extra_supply', () => {
  it('PLAYER JOURNEY: Fill A Longer Supply pressed fills a drawn high blood pressure for 90 days at three of Yale’s $10 fills, $30 in one posting; no refill for twelve weeks across a reload, where a twin paid $10 a month', () => {
    const play = (fill: boolean) => {
      let sim = student('g03-27');
      expect(healthOf(sim.player).chronic).toEqual({ hypertension: { treated: true } });
      const start = sim.now;
      if (fill) {
        const view = shown(sim);
        expect(view.html).toContain('title="Pays for 90 days at once, at 3 fills’ share"');
        h.toasts = [];
        press(view, 'Fill A Longer Supply, 90 Days');
        expect(h.toasts).toEqual(['90 days of medicine filled.']);
        expect(healthOf(sim.player).chronic!.hypertension!.supplyUntil).toBe(start + 90 * MS_DAY);
        sim = reload(sim);
      }
      // To Tuesday 17 November: twelve health weeks.
      tended(sim, at(2026, 11, 17, 12));
      return memos(sim, 'Medicine for high blood pressure').map((t) => [t.at, taken(sim, t)]);
    };
    // The supply ends 22 November; the health week with a week or less left is Monday 16 November.
    expect(play(true)).toEqual([[at(2026, 8, 24, 7, 30), 30_00], [at(2026, 11, 16), 10_00]]);
    expect(play(false)).toEqual([[at(2026, 8, 31), 10_00], [at(2026, 9, 28), 10_00], [at(2026, 10, 26), 10_00]]);
  });

  it('two conditions, the second unpayable: the whole fill is refused, “It comes to more than the bank can cover.”, and nothing is filled or charged; with enough, both are', () => {
    const sim = student('g03-65');
    expect(Object.keys(healthOf(sim.player).chronic ?? {})).toEqual(['depression', 'hypertension']);
    // TEST SETUP: savings emptied and the current account drawn to $45 short of its overdraft's limit: enough for the
    // first condition's $30 and not the second's.
    broke(sim, 45_00);
    const before = { txns: sim.universe.transactions.length, balance: current(sim).balance };
    expect(sim.execute({ kind: 'health.extra_supply', payload: { days: 90 } })).toMatchObject({ ok: false, error: 'Your bank can’t cover $60.00 for every condition’s fill, so nothing was filled or charged.' });
    expect(healthOf(sim.player).chronic!.depression!.supplyUntil).toBeUndefined();
    expect(healthOf(sim.player).chronic!.hypertension!.supplyUntil).toBeUndefined();
    expect(sim.universe.transactions.length).toBe(before.txns);
    expect(current(sim).balance).toBe(before.balance);
    // TEST SETUP: $1,000 paid in, enough for both.
    posted(sim, current(sim).id, 1_000_00);
    expect(sim.must<{ paid: number }>({ kind: 'health.extra_supply', payload: { days: 90 } }).paid).toBe(60_00);
    expect(memos(sim, /^Medicine for /).map((t) => [t.memo, taken(sim, t)])).toEqual([['Medicine for depression', 30_00], ['Medicine for high blood pressure', 30_00]]);
    expect(healthOf(sim.player).chronic!.hypertension!.supplyUntil).toBe(sim.now + 90 * MS_DAY);
  });

  it('refused in its own words with no medicine taken, and past the longest supply here', () => {
    const none = student('g03-3');
    expect(healthOf(none.player).chronic).toEqual({});
    expect(none.execute({ kind: 'health.extra_supply', payload: { days: 90 } })).toMatchObject({ ok: false, error: 'You don’t take medicine for a long-term condition.' });
    const sim = student('g03-27');
    expect(sim.execute({ kind: 'health.extra_supply', payload: { days: 91 } })).toMatchObject({ ok: false, error: 'You can fill at most 90 days at once here.' });
    expect(healthOf(sim.player).chronic!.hypertension!.supplyUntil).toBeUndefined();
  });

  it('a supply in hand is read by the health week: on 5 October a twin whose medicine ran out on 30 September, its refill unpaid, loses 3 morale; the twin holding 90 days doesn’t', () => {
    const play = (fill: boolean) => {
      const sim = student('g03-6');
      expect(healthOf(sim.player).chronic).toEqual({ depression: { treated: true } });
      if (fill) sim.must({ kind: 'health.extra_supply', payload: { days: 90 } });
      // TEST SETUP: nothing to pay a refill with at either health week after the month's supply, the work-study pay
      // between them taken out again.
      tended(sim, at(2026, 9, 28, 8));
      broke(sim);
      tended(sim, at(2026, 10, 5, 8));
      broke(sim);
      const morale = sim.player.wellbeing.morale;
      sim.advanceTo(at(2026, 10, 5));
      return { sim, drop: morale - sim.player.wellbeing.morale };
    };
    const held = play(true);
    const ran = play(false);
    expect(ran.sim.player.health!.chronic!.depression!.supplyUntil).toBe(at(2026, 8, 31) + 30 * MS_DAY);
    expect(memos(ran.sim, 'Medicine for depression', at(2026, 9, 2))).toEqual([]);
    // Depression left alone weighs 3 morale a week (`CHRONIC.untreated`).
    expect(ran.drop - held.drop).toBeCloseTo(3, 6);
    expect(shown(ran.sim).text).toContain('Depression: Out Of Medicine');
    expect(shown(held.sim).text).toContain('Depression: Kept Up · Medicine until November 22, 2026');
  });
});

// ---------------------------------------------------------------------------
// health.pay_bill
// ---------------------------------------------------------------------------

describe('health.pay_bill', () => {
  /** TEST SETUP: a $900 bill on 24 August, as an injury's is raised, and nothing to pay it with when it falls due on 23 September. */
  const inDebt = (seed: string) => {
    const sim = student(seed);
    broke(sim);
    const bill = billCare(sim, sim.player, 'A care bill', 900_00, sim.now);
    tended(sim, at(2026, 9, 24, 12));
    expect(titled(sim, 'A Medical Bill Went Unpaid').map((n) => n.body)).toEqual(['Your bank couldn’t cover a $900.00 medical bill when it came due, so it’s now medical debt. The bill was for a care bill. To clear it, press Pay It Off on Papers, under Health Cover.']);
    expect(-medicalDebtOf(sim, sim.player)!.balance).toBe(900_00);
    return { sim, bill };
  };
  const reports = (sim: Simulation) => titled(sim, 'A Medical Debt Is On Your Record');

  it('PLAYER JOURNEY: Pay It Off pressed settles the bill on Papers and takes it off Home’s worries; a year and a month on the clock a twin who didn’t pay still owes it, across a reload, and neither is reported, Connecticut barring it', () => {
    const play = (pay: boolean) => {
      let { sim } = inDebt('g03-debt');
      // TEST SETUP: $20,000 back in the current account to live on.
      posted(sim, current(sim).id, 20_000_00 - current(sim).balance);
      const owing = shown(sim);
      expect(owing.text).toMatch(/A Care Bill August 24, 2026 \$900\.00 Owed As Debt/);
      const worries = homeSays(sim);
      expect(worries).toContain('You owe $900 for medical care. Open Papers');
      if (pay) {
        const was = current(sim).balance;
        h.toasts = [];
        press(owing, 'Pay It Off');
        expect(h.toasts).toEqual(['Your medical debt is paid off.']);
        expect(was - current(sim).balance).toBe(900_00);
        expect(medicalDebtOf(sim, sim.player)!.balance).toBe(0);
        sim = reload(sim);
        expect(healthOf(sim.player).debtSince).toBeUndefined();
        const paid = shown(sim);
        expect(paid.text).toMatch(/A Care Bill August 24, 2026 \$900\.00 Settled/);
        expect(paid.buttons.map((b) => b.text)).not.toContain('Pay It Off');
        expect(homeSays(sim)).not.toContain('for medical care.');
        expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 1 } })).toMatchObject({ ok: false, error: 'You owe nothing for care.' });
      }
      // A year past 23 September 2026 is 23 September 2027; the 1st after it is when the month's check reads it.
      tended(sim, at(2027, 10, 2, 12));
      const first = reports(sim).map((n) => [n.at, n.body]);
      sim = reload(sim);
      tended(sim, at(2027, 11, 2, 12));
      // The mark a report would put on the record, at its moment: other marks a year brings are other rules'.
      return { first, all: reports(sim).length, marks: (sim.player.credit?.marks ?? []).filter((m) => m.at === at(2027, 10, 1, 0, 30)).length, owing: Math.max(0, -(medicalDebtOf(sim, sim.player)?.balance ?? 0)) };
    };
    // Until 2026-10-22 the twin who didn't pay was reported on 1 October 2027 with a 40-point mark. Connecticut has barred
    // reporting medical debt since 1 July 2024 (Public Act 24-6; `MEDICAL_DEBT.barredIn`, brief 20's papers area): what
    // paying changes is the debt, still owed by the one who didn't.
    const owed = play(false);
    expect(owed).toEqual({ first: [], all: 0, marks: 0, owing: 900_00 });
    const paid = play(true);
    expect(paid).toEqual({ first: [], all: 0, marks: 0, owing: 0 });
  });

  it('paid from a savings account named, which falls by it while the current account doesn’t; each refusal in its own words', () => {
    const { sim } = inDebt('g03-debt-savings');
    // TEST SETUP: $1,000 in savings, and the current account as it was left, drawn to its overdraft's limit.
    posted(sim, savings(sim).id, 1_000_00);
    const was = { current: current(sim).balance, savings: savings(sim).balance };
    expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 0 } })).toMatchObject({ ok: false, error: 'Enter an amount to pay.' });
    // In words that say what to do from 2026-10-16; until then “Chase Total Checking can’t cover it.”
    expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 100_00 } })).toMatchObject({ ok: false, error: 'Chase Total Checking has nothing to pay it with, so nothing was paid. Move money into it first, on your bank’s Move Money.' });
    expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 100_00, fromId: savings(sim).id } })).toMatchObject({ ok: true, value: { paid: 100_00 } });
    expect(-medicalDebtOf(sim, sim.player)!.balance).toBe(800_00);
    expect(healthOf(sim.player).debtSince).toBeDefined();
    expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 950_00, fromId: savings(sim).id } })).toMatchObject({ ok: true, value: { paid: 800_00 } });
    expect(savings(sim).balance).toBe(was.savings - 900_00);
    expect(current(sim).balance).toBe(was.current);
    expect(healthOf(sim.player).bills.find((b) => b.what === 'A care bill')).toMatchObject({ paid: true });
    expect(healthOf(sim.player).bills.find((b) => b.what === 'A care bill')!.inDebt).toBeUndefined();
    expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 1, fromId: savings(sim).id } })).toMatchObject({ ok: false, error: 'You owe nothing for care.' });
  });

  it('an account named that can’t pay a medical debt, their own credit card, is refused, not silently swapped for the current account', () => {
    const { sim } = inDebt('g03-debt-card');
    // TEST SETUP: $2,000 in the current account, so the swap would go through.
    posted(sim, current(sim).id, 2_000_00 - current(sim).balance);
    const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card')!;
    const was = current(sim).balance;
    const r = sim.execute({ kind: 'health.pay_bill', payload: { amount: 900_00, fromId: card.id } });
    expect(r.ok).toBe(false);
    expect(current(sim).balance).toBe(was);
    expect(-medicalDebtOf(sim, sim.player)!.balance).toBe(900_00);
  });
});
