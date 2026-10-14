/**
 * Completing the current scope (2026-10-15) for the health rows: choosing a doctor, enrolling, and the appointment.
 *
 * What changed beneath them that day, and what these tests hold:
 * - New Haven gained a second doctor's practice, Yale Health Center's Student Health, read from Yale Health's own pages
 *   on 2026-10-15 (`docs/research/world/research-health-visits.json`): it sees Yale students alone ("Access to Student
 *   Health is available to all Yale undergraduate and graduate students"), free to them (Basic Student Health Services,
 *   "free and automatically provided"), and offers "a same-day or next-day appointment", which SLATE books as the next
 *   weekday. Fair Haven Community Health Care sees anybody in its ten towns and publishes no wait, so New Haven's stands
 *   there: AMN Healthcare's fifteen-metro average, 23.5 days, 24 to the day. Until that day SLATE kept Fair Haven alone
 *   and a played life's choice of doctor decided nothing. Picking Yale Health now decides how soon she's seen, and,
 *   since it sees only those Yale Health covers, it stops when that cover does: on the day of a withdrawal by the
 *   fifteenth day of classes (the Bulletin's rule), when an appointment booked there isn't kept and is owed again.
 * - A plan's part of a bill is written on it (`MedicalBill.covered`) and shown on Papers as Plan Paid. Until that day a
 *   bill said only the patient's share. Access Health CT's Standard Silver leaves a doctor's visit its $45 copay, with no
 *   deductible (its 2026 summary); the visit's price to the plan is SLATE's $100 of 2024 grown by the BLS physicians'
 *   services index from 417.93 (2024) to 439.389 (2026): 10,000 × 439.389 ÷ 417.93 = 10,513.47 cents, $105.13. The plan
 *   pays $105.13 less $45, $60.13. Denied (TEST SETUP: the claim's draw forced), the visit is billed at the uninsured's
 *   1.75 times the price, $183.98, the plan pays nothing, and an appeal overturned leaves the $45 and the plan's $60.13.
 *   And an emergency Yale Health paid, its cover canceled back to the term's start by a withdrawal by the fifteenth day,
 *   is billed again as the uninsured are (`repriceCare`), and the plan paid none of it.
 * - Connecticut's rule for how long a prescription for a medicine that isn't controlled may be filled was read: there is
 *   none (CGS 20-616(b) gives a refill only on the prescriber's order, and the Drug Control Division's compilation of the
 *   statutes and regulations holds no period but a syringe prescription's year, 21a-65(b)). So a kept visit's renewal
 *   changes no New Haven fill. A prescription played here is filled on 27 September 2027, a year and twenty days after
 *   it was taken, with nothing renewing it, and a one-year rule would have refused it (tests/evidence2-b02.test.ts
 *   stopped short of the year). Nothing was implemented for it; the guide and `RX`'s comment say why.
 *
 * Every figure is worked here from the rule's own numbers and written as a literal, never asked of the engine's helper.
 *
 * PLAYER JOURNEYS: a new life made as the creation screen makes it (`createSave` with `newLifeConfig`, the family given
 * by `withFamily`), Ada Cole, born in New York, a student at Yale in New Haven from Monday 24 August 2026, played by the
 * clock (`advanceTo`), through the commands the screens send, and through Papers rendered as the player has it
 * (react-dom/server), its select changed and its buttons pressed by their own handlers. A save is reloaded (`loadSave`
 * of its JSON) where the clock runs on. Seeds are arbitrary: sh-c1, sh-c2, sh-c3, sh-c4, sh-ins, sh-rx.
 *
 * TEST SETUP, said again where it's done: America's holiday file read from disk, as the app fetches it; the week's
 * illness draw forced to nothing but the visit or the emergency a test asks for, as tests/evidence3-lifepapers.test.ts
 * forces it; a kept visit's referral draw forced to none; the claim's draw forced to be paid or denied, and an appeal's
 * to be overturned.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeConfig, newLifeFrom, withFamily, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { HEALTH_MONTH_KIND, HEALTH_WEEK_KIND, coverOn, healthOf, keptUp } from '@/engine/systems/health';
import { APPOINTMENT_KIND, appointmentsOf } from '@/engine/systems/appointments';
import { clinicById, clinicFor, clinicRefusal, seesThem } from '@/engine/systems/clinics';
import { addCountryHolidays } from '@/engine/content/holidays';
import { readFileSync } from 'node:fs';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf } from '@/engine/systems/coursework';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  selects: [] as { id?: string; options: { value: string; text: string }[]; onChange?: (e: { target: { value: string } }) => void }[],
  toasts: [] as string[],
  tabs: {} as Record<string, string>,
}));

/** Every button and select the screens draw, with its words, its options and its own handler, kept on its way through the JSX runtime. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const optionsOf = (c: unknown): { value: string; text: string }[] => (Array.isArray(c) ? c.flatMap(optionsOf) : c && typeof c === 'object' && (c as { type?: unknown }).type === 'option'
  ? [{ value: String((c as { props: { value?: unknown } }).props.value), text: textOf((c as { props: { children?: unknown } }).props.children) }] : []);
const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, onClick: props.onClick as (() => void) | undefined });
    if (type === 'select' && props) h.selects.push({ id: props.id as string | undefined, options: optionsOf(props.children), onChange: props.onChange as ((e: { target: { value: string } }) => void) | undefined });
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

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back. `run` is the save's own execute.
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

// TEST SETUP: the holiday file the app fetches for a save's countries when it opens (`loadPlacesFor`), read from disk.
addCountryHolidays('us', readFileSync('public/holidays/us.tsv', 'utf8'));

// ---------------------------------------------------------------------------
// The lives, the clock and the screen
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const answers = (family: StartingWealth, extra: Partial<NewSaveConfig> = {}): NewSaveConfig =>
  withFamily({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra }, family);
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => loadSave(JSON.parse(snap) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const into = (t: { postings: { accountId: string; amount: number }[] }, accountId: string) => t.postings.filter((p) => p.accountId === accountId).reduce((s, p) => s + p.amount, 0);

/** Papers' Health Cover tab as the player has it: its words, and its buttons and selects with their own handlers. */
function papers(sim: Simulation) {
  h.sim = sim;
  h.buttons = [];
  h.selects = [];
  h.tabs = { 'tab:/workspace/papers': 'health' };
  const html = renderToStaticMarkup(createElement(PapersWorkspace as FunctionComponent)).replace(/<!-- -->/g, '');
  const buttons = [...h.buttons];
  const selects = [...h.selects];
  return {
    html,
    text: onScreen(html),
    select: (id: string) => selects.filter((s) => s.id === id),
    press: (words: string) => {
      const found = buttons.filter((b) => b.text === words);
      expect(found.map((b) => b.text), `one “${words}”`).toEqual([words]);
      expect(found[0]!.disabled ?? false).toBe(false);
      h.toasts = [];
      found[0]!.onClick!();
      return [...h.toasts];
    },
  };
}

/** TEST SETUP: draws forced on one save: a stream's numbers for one key, or for every key, in order, then 0.999, a "no". */
function forcing(sim: Simulation): (stream: string, key: (string | number)[] | null, values: number[]) => void {
  const forced = new Map<string, number[]>();
  const real = sim.rng.bind(sim);
  Object.assign(sim, {
    rng: (stream: string, ...keys: (string | number)[]) => {
      const values = forced.get([stream, ...keys].join('|')) ?? forced.get(stream);
      const d = real(stream, ...keys);
      if (!values) return d;
      let i = 0;
      return { ...d, next: () => values[i++] ?? 0.999 };
    },
  });
  return (stream, key, values) => { forced.set(key ? [stream, ...key].join('|') : stream, values); };
}
/** The week's draw in `illnessWeek`'s order: a stay, an emergency, then a doctor's visit; 0.999 after, a "no" to the flu and the rest. */
const VISIT = [0.999, 0.999, 0];
/** TEST SETUP: every week's illness draw a "no", a kept visit's referral a "no", and the claim's draw paid. */
function quiet(sim: Simulation) {
  const force = forcing(sim);
  force('health.illness', null, []);
  force('health.referral', null, []);
  force('health.denial', null, []);
  return force;
}
/** TEST SETUP: the next health week's draw forced to a doctor's visit, and the week played; its Monday. */
function visitWeek(sim: Simulation, force: ReturnType<typeof forcing>): Instant {
  const week = pendingOf(sim, HEALTH_WEEK_KIND)[0]!;
  force('health.illness', [sim.player.id, String(week.at)], VISIT);
  sim.advanceTo(week.at + MS_HOUR);
  return week.at;
}

const FAIR_HAVEN = 'us-ct-fhchc-grand';
const YALE = 'us-ct-yalehealth-studenthealth';
const FAIR_HAVEN_NAME = 'Fair Haven Community Health Care';
const YALE_NAME = 'Yale Health Center, Student Health';
/** AMN Healthcare's fifteen-metro average, 23.5 days, for New Haven, to the day. */
const TOWN_WAIT = 24;
/** Yale Health's "same-day or next-day", the next. */
const YALE_WAIT = 1;

// ---------------------------------------------------------------------------
// health.choose_clinic
// ---------------------------------------------------------------------------

describe('health.choose_clinic, New Haven’s two practices', () => {
  // Until 2026-10-15 this was 'PLAYER JOURNEY: the student who picks Yale Health on Your Doctor is booked the next weekday
  // there, her twin who didn’t 24 days on at Fair Haven; each is seen where booked, at $0, across a reload'. Later that
  // day Yale Health's rule that a member's care is had at its Health Center was kept: with nothing picked the twin went to
  // Yale Health too, and a visit at Fair Haven stopped being Yale Health's to pay. The twin picks Fair Haven instead, so
  // the two picks still part, now in the bill as well as the wait.
  it('PLAYER JOURNEY: the student who picks Yale Health on Your Doctor is booked the next weekday there, at $0; her twin who picks Fair Haven 24 days on there, billed the uninsured’s $183.98; each is seen where booked, across a reload', () => {
    const make = () => createSave(1, 'sh-c1', answers('modest'));
    const chooser = make();
    const plain = make();
    // Papers offers both practices to a Yale student, each with a visit's price and wait, and while nothing is picked the
    // one her cover sends her to. Until 2026-10-15 the options were 'The Town’s First Practice' and the two names alone,
    // and the line named Fair Haven; that day a member with nothing picked went to Yale Health, and each option said what
    // a visit there costs her: $183.98 at Fair Haven (worked below, UNINSURED) and 24 days, $0 and the next weekday at
    // Yale Health.
    const screen = papers(chooser);
    expect(screen.select('own-doctor').map((s) => s.options)).toEqual([[
      { value: '', text: 'As Your Cover Has It' },
      { value: FAIR_HAVEN, text: `${FAIR_HAVEN_NAME}, A Visit $183.98, A 24-Day Wait` },
      { value: YALE, text: `${YALE_NAME}, A Visit $0.00, The Next Weekday` },
    ]]);
    expect(screen.text).toContain(`A doctor’s visit: ${YALE_NAME}`);
    h.toasts = [];
    screen.select('own-doctor')[0]!.onChange!({ target: { value: YALE } });
    expect(h.toasts).toEqual(['Your doctor, chosen.']);
    expect(healthOf(chooser.player).clinicId).toBe(YALE);
    const again = papers(chooser);
    expect(again.select('own-doctor')[0]!.options.map((o) => o.value)).toEqual([FAIR_HAVEN, YALE]);
    expect(again.text).toContain(`A doctor’s visit: ${YALE_NAME}`);
    // The twin picks Fair Haven on her own Papers.
    papers(plain).select('own-doctor')[0]!.onChange!({ target: { value: FAIR_HAVEN } });
    expect(healthOf(plain.player).clinicId).toBe(FAIR_HAVEN);
    expect(papers(plain).text).toContain(`A doctor’s visit: ${FAIR_HAVEN_NAME}`);

    const booked = [chooser, plain].map((sim) => {
      const force = quiet(sim);
      const monday = visitWeek(sim, force);
      expect(monday).toBe(at(2026, 8, 31, 9));
      return appointmentsOf(sim.player).map((a) => [a.at, a.what, a.clinicId]);
    });
    // Monday 31 August at nine: the next weekday at ten, Tuesday 1 September, and 24 days on, Thursday 24 September.
    expect(booked[0]).toEqual([[at(2026, 9, 1, 10), 'A doctor’s visit', YALE]]);
    expect(booked[1]).toEqual([[at(2026, 9, 24, 10), 'A doctor’s visit', FAIR_HAVEN]]);
    expect(at(2026, 9, 1) - at(2026, 8, 31)).toBe(YALE_WAIT * MS_DAY);
    expect(at(2026, 9, 24) - at(2026, 8, 31)).toBe(TOWN_WAIT * MS_DAY);
    expect(pendingOf(chooser, APPOINTMENT_KIND).map((i) => i.label)).toEqual([`The Doctor, ${YALE_NAME}`]);
    expect(titled(chooser, 'A Doctor’s Appointment').map((n) => n.body)).toEqual([`A doctor’s visit: booked at ${YALE_NAME} for September 1, 2026, the wait where you live.`]);

    // Reloaded, the clock runs to each visit, and each is kept where it was booked.
    const kept = [chooser, plain].map((sim, i) => {
      const back = thaw(freeze(sim));
      quiet(back);
      back.advanceTo((i === 0 ? at(2026, 9, 1, 10) : at(2026, 9, 24, 10)) + MS_HOUR);
      return {
        log: (healthOf(back.player).careLog ?? []).map((c) => [c.at, c.what, c.share]),
        bills: healthOf(back.player).bills.filter((b) => b.what.startsWith('A doctor’s visit')).map((b) => [b.amount, b.covered]),
        said: titled(back, 'A Doctor’s Visit').map((n) => n.body),
      };
    });
    expect(kept[0]).toEqual({ log: [[at(2026, 9, 1, 10), `A doctor’s visit, ${YALE_NAME}`, 0]], bills: [], said: [`A doctor’s visit, ${YALE_NAME}. Nothing to pay.`] });
    // Until 2026-10-15 the twin's visit was logged at $0 with no bill and 'Nothing to pay.': Yale Health paid it. That day
    // its rule was kept, and a member's visit at Fair Haven is billed as the uninsured's, the plan paying none of it.
    expect(kept[1]).toEqual({
      log: [[at(2026, 9, 24, 10), `A doctor’s visit, ${FAIR_HAVEN_NAME}`, 183_98]],
      bills: [[183_98, undefined]],
      said: [`A doctor’s visit, ${FAIR_HAVEN_NAME}. Yale Health pays for a visit at its own Health Center, not here. Your share is $183.98, due in 30 days.`],
    });
  }, 60_000);

  it('PLAYER JOURNEY: withdrawn by the fifteenth day of classes, Yale Health no longer covers her, so it refuses her in its words and Papers offers no Your Doctor, only Fair Haven; her twin still at the School picks it', () => {
    const make = () => createSave(1, 'sh-c2', answers('modest'));
    const gone = make();
    const stays = make();
    for (const sim of [gone, stays]) sim.advanceTo(at(2026, 8, 25, 12));
    expect(gone.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    expect(coverOn(gone.player, gone.now)).toBeUndefined();
    expect(gone.execute({ kind: 'health.choose_clinic', payload: { clinicId: YALE } }).error).toBe('Yale Health sees Yale students it covers, and it doesn’t cover you now.');
    expect(healthOf(gone.player).clinicId).toBeUndefined();
    const screen = papers(gone);
    expect(screen.select('own-doctor')).toEqual([]);
    expect(screen.text).toContain(`A doctor’s visit: ${FAIR_HAVEN_NAME}`);
    // Fair Haven sees anybody living in its towns, and is still hers to pick.
    expect(gone.must<{ clinicId: string }>({ kind: 'health.choose_clinic', payload: { clinicId: FAIR_HAVEN } }).clinicId).toBe(FAIR_HAVEN);
    // The twin at the School is covered and may.
    expect(coverOn(stays.player, stays.now)).toBe('yale');
    expect(stays.must<{ clinicId: string }>({ kind: 'health.choose_clinic', payload: { clinicId: YALE } }).clinicId).toBe(YALE);
  }, 60_000);

  it('PLAYER JOURNEY: booked at Yale Health, then withdrawn the same Monday, she isn’t seen there on Tuesday: “Not Seen At Your Practice”, owed, unbilled; Papers names Fair Haven, and Book An Appointment books it there 24 days on, across a reload', () => {
    const sim = createSave(1, 'sh-c3', answers('modest'));
    sim.must({ kind: 'health.choose_clinic', payload: { clinicId: YALE } });
    const force = quiet(sim);
    visitWeek(sim, force);
    expect(appointmentsOf(sim.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2026, 9, 1, 10), YALE]]);
    sim.advanceTo(at(2026, 8, 31, 12));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    const back = thaw(freeze(sim));
    quiet(back);
    back.advanceTo(at(2026, 9, 1, 12));
    const item = back.universe.scheduled.find((i) => i.kind === APPOINTMENT_KIND && i.at === at(2026, 9, 1, 10))!;
    expect(item.status).toBe('missed');
    expect(healthOf(back.player).owedVisit).toBe('A doctor’s visit');
    expect(titled(back, 'Not Seen At Your Practice').map((n) => n.body)).toEqual([`A doctor’s visit: Yale Health sees Yale students it covers, and it doesn’t cover you now. You weren’t seen at ${YALE_NAME}. Book again, and it’s at ${FAIR_HAVEN_NAME}.`]);
    expect(titled(back, 'A Doctor’s Visit')).toEqual([]);
    expect(healthOf(back.player).careLog ?? []).toEqual([]);
    // Her choice stands, and is read as nothing while Yale Health doesn't see her.
    expect(healthOf(back.player).clinicId).toBe(YALE);
    const screen = papers(back);
    expect(screen.select('own-doctor')).toEqual([]);
    expect(screen.text).toContain(`A doctor’s visit: ${FAIR_HAVEN_NAME}`);
    expect(screen.text).toContain('A doctor’s visit: not yet seen');
    screen.press('Book An Appointment');
    // Tuesday 1 September at noon, 24 days on: Friday 25 September at ten.
    expect(appointmentsOf(back.player).map((a) => [a.at, a.what, a.clinicId])).toEqual([[at(2026, 9, 25, 10), 'A doctor’s visit', FAIR_HAVEN]]);
    expect(healthOf(back.player).owedVisit).toBeUndefined();
  }, 60_000);

  it('PLAYER JOURNEY: a visit booked at Yale Health is had there though Fair Haven is picked before the day; until 2026-10-15 it was had wherever was picked on the day', () => {
    const sim = createSave(1, 'sh-c4', answers('modest'));
    sim.must({ kind: 'health.choose_clinic', payload: { clinicId: YALE } });
    const force = quiet(sim);
    visitWeek(sim, force);
    sim.must({ kind: 'health.choose_clinic', payload: { clinicId: FAIR_HAVEN } });
    sim.advanceTo(at(2026, 9, 1, 11));
    expect((healthOf(sim.player).careLog ?? []).map((c) => c.what)).toEqual([`A doctor’s visit, ${YALE_NAME}`]);
  }, 60_000);

  it('GUARD: a practice for its members isn’t given or chosen with no moment to read the cover at; every engine caller gives one', () => {
    const sim = createSave(1, 'sh-c1', answers('modest'));
    healthOf(sim.player).clinicId = YALE;
    expect(clinicFor(sim.player, 'visit', sim.now)!.id).toBe(YALE);
    expect(clinicFor(sim.player, 'visit')!.id).toBe(FAIR_HAVEN);
    expect(seesThem(sim.player, clinicById(YALE)!)).toBe(false);
    expect(clinicRefusal(sim.player, YALE)).toBe('Yale Health sees Yale students it covers, and it doesn’t cover you now.');
    expect(clinicRefusal(sim.player, YALE, sim.now)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// health.enroll and health.appointment: an approved plan's bill, on the clock
// ---------------------------------------------------------------------------

/** The Inherited student at Capital One withdrawn on 25 August, enrolled on Papers on 1 October: the marketplace from 1 November. */
const enrolled = (() => {
  let snap: string | undefined;
  return () => {
    if (snap) return snap;
    const sim = createSave(1, 'sh-ins', { ...answers('inherited'), bankId: 'us-capital-one' });
    quiet(sim);
    sim.advanceTo(at(2026, 8, 25, 12));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    sim.advanceTo(at(2026, 10, 1, 9));
    expect(papers(sim).press('Enroll')).toEqual(['Enrolled in the marketplace, from November 1, 2026.']);
    snap = freeze(sim);
    return snap;
  };
})();

/** SLATE's $100 visit of 2024 grown by the physicians' index to 2026, 10,000 × 439.389 ÷ 417.93 = 10,513.47 cents. */
const PRICE = 105_13;
/** Access Health CT's Standard Silver: a doctor's visit, $45, with no deductible. */
const COPAY = 45_00;
/** The uninsured are billed 1.75 times the price: 10,513 × 1.75 = 18,397.75 cents. */
const UNINSURED = 183_98;
const WHAT = `A doctor’s visit, ${FAIR_HAVEN_NAME}`;

describe('health.enroll and health.appointment: Access Health CT’s silver plan on a visit the clock bills', () => {
  it('PLAYER JOURNEY: a visit the 2 November week draws is booked for Thanksgiving’s Friday at Fair Haven and kept; the bill is the $45 copay, the plan pays $60.13 of $105.13, no deductible is touched; it’s paid once on its due day from checking to Medical Care, across two reloads, and Papers shows both', () => {
    expect(Math.round(100_00 * 439.389 / 417.93)).toBe(PRICE);
    const sim = thaw(enrolled());
    const force = quiet(sim);
    sim.advanceTo(at(2026, 11, 2, 8));
    expect(coverOn(sim.player, sim.now)).toBe('marketplace');
    const year = healthOf(sim.player);
    const spentBefore = year.spent['2026'] ?? 0;
    const deductibleBefore = year.deductible['2026'] ?? 0;
    expect(visitWeek(sim, force)).toBe(at(2026, 11, 2, 9));
    // 24 days on is Thursday 26 November, Thanksgiving, a public holiday: the Friday.
    expect(appointmentsOf(sim.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2026, 11, 27, 10), FAIR_HAVEN]]);
    sim.advanceTo(at(2026, 11, 27, 11));
    const bills = healthOf(sim.player).bills.filter((b) => b.what === WHAT);
    expect(bills.map((b) => [b.at, b.amount, b.dueAt, b.paid ?? false, b.denied, b.covered])).toEqual([
      [at(2026, 11, 27, 10), COPAY, at(2026, 11, 27, 10) + 30 * MS_DAY, false, undefined, { price: PRICE, planPaid: PRICE - COPAY }],
    ]);
    expect(PRICE - COPAY).toBe(60_13);
    expect(titled(sim, 'A Doctor’s Visit').map((n) => n.body)).toEqual([`${WHAT}. Your share is $45.00, due in 30 days.`]);
    expect((healthOf(sim.player).spent['2026'] ?? 0) - spentBefore).toBe(COPAY);
    expect((healthOf(sim.player).deductible['2026'] ?? 0) - deductibleBefore).toBe(0);
    expect((healthOf(sim.player).careLog ?? []).filter((c) => c.what === WHAT).map((c) => c.share)).toEqual([COPAY]);
    const due = papers(sim).text;
    expect(due).toContain('Plan Paid');
    expect(due).toMatch(/\$45\.00 December 27, 2026\s+\$60\.13/);

    // Reloaded, the clock reaches the due day: paid once, from checking, to the Medical Care line.
    const back = thaw(freeze(sim));
    quiet(back);
    back.advanceTo(at(2026, 12, 27, 12));
    const payments = back.universe.transactions.filter((t) => t.memo === `Medical bill: ${WHAT}`);
    expect(payments).toHaveLength(1);
    const medical = Object.values(back.universe.accounts).find((a) => a.nominal && a.name === 'Medical Care')!;
    expect(into(payments[0]!, checking(back).id)).toBe(-COPAY);
    expect(into(payments[0]!, medical.id)).toBe(COPAY);
    expect(payments[0]!.postings.reduce((s, p) => s + p.amount, 0)).toBe(0);
    expect(payments[0]!.at).toBe(at(2026, 12, 27, 10));
    // What else left checking in that month was the 1 December premium, $706.
    const premium = back.universe.transactions.filter((t) => t.memo === 'Marketplace health plan premium' && t.at > at(2026, 11, 27, 11));
    expect(premium.map((t) => -into(t, checking(back).id))).toEqual([706_00]);
    expect(healthOf(back.player).bills.find((b) => b.what === WHAT)!.paid).toBe(true);
    const settled = papers(back).text;
    expect(settled).toMatch(/\$45\.00 Settled\s+\$60\.13/);
    expect(settled).toContain('Access Health CT Standard Silver:');

    // And reloaded again, the clock running on, nothing is paid twice.
    const later = thaw(freeze(back));
    quiet(later);
    later.advanceTo(at(2027, 1, 4, 12));
    expect(later.universe.transactions.filter((t) => t.memo === `Medical bill: ${WHAT}`)).toHaveLength(1);
    expect(healthOf(later.player).bills.find((b) => b.what === WHAT)!.covered).toEqual({ price: PRICE, planPaid: 60_13 });
  }, 120_000);

  it('PLAYER JOURNEY: the same visit denied (TEST SETUP) is billed $183.98 with nothing paid by the plan; appealed on Papers and overturned, it’s the $45 share and the plan’s $60.13, and what was paid over the share comes back once', () => {
    const sim = thaw(enrolled());
    const force = quiet(sim);
    force('health.denial', null, [0]);
    // TEST SETUP: the appeal's draw a 0.999, over the 56% upheld: overturned.
    force('health.appeal', null, []);
    sim.advanceTo(at(2026, 11, 2, 8));
    visitWeek(sim, force);
    sim.advanceTo(at(2026, 11, 27, 11));
    const bill = () => healthOf(sim.player).bills.find((b) => b.what === WHAT)!;
    expect([bill().amount, bill().denied, bill().covered]).toEqual([UNINSURED, { share: COPAY }, { price: PRICE, planPaid: 0 }]);
    expect(Math.round(PRICE * 1.75)).toBe(UNINSURED);
    expect(papers(sim).text).toMatch(/\$183\.98 December 27, 2026\s+Appeal It\s+\$0\.00/);
    papers(sim).press('Appeal It');
    // Decided 60 days on, 26 January 2027, after it was paid in full on 27 December. TEST SETUP: overturned.
    sim.advanceTo(at(2027, 1, 27, 12));
    expect([bill().amount, bill().denied?.outcome, bill().covered]).toEqual([COPAY, 'overturned', { price: PRICE, planPaid: 60_13 }]);
    const back = sim.universe.transactions.filter((t) => t.memo === `Appeal won: ${WHAT}`);
    expect(back.map((t) => into(t, checking(sim).id))).toEqual([UNINSURED - COPAY]);
    expect(UNINSURED - COPAY).toBe(138_98);
    expect(papers(sim).text).toMatch(/\$45\.00 Settled\s+Denial Overturned\s+\$60\.13/);
  }, 120_000);

  it('PLAYER JOURNEY: an emergency Yale Health paid on 31 August, the plan $3,273.84 of $3,323.84, paid nothing once a withdrawal that day cancels the cover back to 1 August', () => {
    const sim = createSave(1, 'sh-c1', answers('modest'));
    const force = quiet(sim);
    const week = pendingOf(sim, HEALTH_WEEK_KIND)[0]!;
    // TEST SETUP: the week's second chance, an emergency, a "yes".
    force('health.illness', [sim.player.id, String(week.at)], [0.999, 0]);
    sim.advanceTo(week.at + MS_HOUR);
    // SLATE's $2,450 emergency of 2019 grown by the hospital services index, 245,000 × 459.659 ÷ 338.814 = 332,383.99
    // cents, $3,323.84; Yale Health leaves $50 of it.
    expect(Math.round(2_450_00 * 459.659 / 338.814)).toBe(3_323_84);
    const er = () => healthOf(sim.player).bills.filter((b) => b.what.startsWith('The emergency room'));
    expect(er().map((b) => [b.amount, b.covered])).toEqual([[50_00, { price: 3_323_84, planPaid: 3_273_84 }]]);
    sim.advanceTo(at(2026, 8, 31, 18));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    // Billed again as the uninsured are (`repriceCare`): the plan paid none of it now.
    expect(er()[0]!.covered).toEqual({ price: 3_323_84, planPaid: 0 });
  }, 60_000);
});

// ---------------------------------------------------------------------------
// health.appointment: Connecticut's prescription, which doesn't run out
// ---------------------------------------------------------------------------

describe('health.appointment: a New Haven prescription past its first year', () => {
  it('PLAYER JOURNEY: high blood pressure diagnosed on 1 September 2026, its prescription taken at the first fill and renewed by nothing until the review of 30 September 2027, is filled past 7 September 2027 all the same, as Connecticut sets no date it runs out; no “A Prescription Ran Out”, and the review renews it', () => {
    const sim = createSave(1, 'sh-rx', answers('wealthy'));
    const force = quiet(sim);
    // She picks Fair Haven, for its 24 days' wait. Until 2026-10-15 nothing was picked and Fair Haven was given; that day a
    // Yale Health member with nothing picked went to Yale Health, which books the next weekday, and the review below was
    // booked for Tuesday 7 September 2027 and renewed the prescription before the fill this test is about (it failed
    // with prescribedAt 7 September 2027). The point is a fill a year and twenty days after the prescription, which needs
    // the renewal to come later; picking Fair Haven keeps it, and the review there is the uninsured's to pay.
    sim.must({ kind: 'health.choose_clinic', payload: { clinicId: FAIR_HAVEN } });
    sim.advanceTo(at(2026, 8, 26, 12));
    const month = pendingOf(sim, HEALTH_MONTH_KIND)[0]!;
    expect(month.at).toBe(at(2026, 9, 1, 0, 30));
    // TEST SETUP: the month's onset draw, its second chance, high blood pressure, a yes.
    force('health.onset', [sim.player.id, String(month.at)], [0.999, 0]);
    sim.advanceTo(month.at + MS_HOUR);
    const bp = () => healthOf(sim.player).chronic!.hypertension!;
    expect(bp().since).toBe(month.at);
    // Taken as written at the first fill, Monday 7 September 2026; nothing renews it before the review. A year on, a fill
    // on Monday 27 September 2027 is a fill British Columbia's two years would still allow and a one-year rule wouldn't.
    sim.advanceTo(at(2027, 9, 28, 12));
    expect(bp().prescribedAt).toBe(at(2026, 9, 7, 9));
    const fills = () => sim.universe.transactions.filter((t) => t.memo === 'Medicine for high blood pressure').map((t) => t.at);
    expect(fills()).toHaveLength(14);
    expect([fills()[0], ...fills().slice(-2)]).toEqual([at(2026, 9, 7, 9), at(2027, 8, 30, 9), at(2027, 9, 27, 9)]);
    expect(titled(sim, 'A Prescription Ran Out')).toEqual([]);
    // The review, due 365.28 days from the diagnosis and booked by the Monday after, 6 September, for 24 days on, is kept
    // on Thursday 30 September at Fair Haven and renews it.
    sim.advanceTo(at(2027, 10, 5, 12));
    expect((healthOf(sim.player).careLog ?? []).map((c) => [c.at, c.what])).toEqual([[at(2027, 9, 30, 10), `A review of your high blood pressure, ${FAIR_HAVEN_NAME}`]]);
    expect(bp().prescribedAt).toBe(at(2027, 9, 30, 10));
    expect(keptUp(bp(), sim.now)).toBe(true);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// health.choose_clinic: Yale Health's own rule, where a member's care is had
// ---------------------------------------------------------------------------

/**
 * Yale Health's coverage overview for students (yalehealth.yale.edu/more/health-coverage-overview-students-yale-health,
 * read again 2026-10-15): "All care must be obtained at the Yale Health Center at 55 Lock Street unless it is an
 * emergency situation or you have a referral with prior authorization to see an outside clinician for services." Kept
 * from that day: with nothing picked, a member is booked at Yale Health's practice, the next weekday, at $0; a member
 * who picks Fair Haven is billed there as the uninsured are, Yale Health paying none of it. SLATE keeps no referral, so
 * none is honored. Fair Haven publishes no fee, nor its sliding scale's amounts, so the price is SLATE's for any uninsured
 * visit: $100 of 2024 grown by the physicians' services index to 2026, 10,000 × 439.389 ÷ 417.93 = 10,513.47, 10,513
 * cents, times the uninsured's 1.75, 18,397.75, $183.98. Somebody Yale Health doesn't cover is given Fair Haven, as
 * before. An emergency is paid as before: the emergency journey above, Yale Health leaving $50 of it, holds unchanged.
 */
const OUTSIDE = 183_98;
const SAID_OUTSIDE = `A doctor’s visit, ${FAIR_HAVEN_NAME}. Yale Health pays for a visit at its own Health Center, not here. Your share is $183.98, due in 30 days.`;

describe('health.choose_clinic: Yale Health’s rule that a member’s care is had at its Health Center', () => {
  it('PLAYER JOURNEY: a Yale Health member who picks nothing is booked at Yale Health the next weekday and seen there at $0, across a reload', () => {
    expect(Math.round(Math.round(100_00 * 439.389 / 417.93) * 1.75)).toBe(OUTSIDE);
    const sim = createSave(1, 'sh-y1', answers('modest'));
    expect(coverOn(sim.player, sim.now)).toBe('yale');
    expect(healthOf(sim.player).clinicId).toBeUndefined();
    expect(papers(sim).text).toContain(`A doctor’s visit: ${YALE_NAME}`);
    const force = quiet(sim);
    expect(visitWeek(sim, force)).toBe(at(2026, 8, 31, 9));
    // Monday 31 August at nine: the next weekday, Tuesday 1 September, at ten.
    expect(appointmentsOf(sim.player).map((a) => [a.at, a.what, a.clinicId])).toEqual([[at(2026, 9, 1, 10), 'A doctor’s visit', YALE]]);
    expect(pendingOf(sim, APPOINTMENT_KIND).map((i) => i.label)).toEqual([`The Doctor, ${YALE_NAME}`]);
    const back = thaw(freeze(sim));
    quiet(back);
    back.advanceTo(at(2026, 9, 1, 11));
    expect((healthOf(back.player).careLog ?? []).map((c) => [c.at, c.what, c.share])).toEqual([[at(2026, 9, 1, 10), `A doctor’s visit, ${YALE_NAME}`, 0]]);
    expect(healthOf(back.player).bills.filter((b) => b.what.startsWith('A doctor’s visit'))).toEqual([]);
    expect(titled(back, 'A Doctor’s Visit').map((n) => n.body)).toEqual([`A doctor’s visit, ${YALE_NAME}. Nothing to pay.`]);
  }, 60_000);

  it('PLAYER JOURNEY: a member who picks Fair Haven on Your Doctor is billed the uninsured’s $183.98 for the visit the clock keeps there, paid once on its due day across reloads; her twin who picks nothing is seen at Yale Health at $0', () => {
    const make = () => createSave(1, 'sh-y2', answers('modest'));
    const chooser = make();
    const twin = make();
    const screen = papers(chooser);
    h.toasts = [];
    screen.select('own-doctor')[0]!.onChange!({ target: { value: FAIR_HAVEN } });
    expect(h.toasts).toEqual(['Your doctor, chosen.']);
    expect(healthOf(chooser.player).clinicId).toBe(FAIR_HAVEN);
    // Papers now quotes her a visit at what Fair Haven bills her.
    expect(papers(chooser).text).toContain('What it would cost you here now: a doctor’s visit $183.98');
    expect(papers(twin).text).toContain('What it would cost you here now: a doctor’s visit $0.00');
    const spentBefore = healthOf(chooser.player).spent['2026'] ?? 0;
    for (const sim of [chooser, twin]) visitWeek(sim, quiet(sim));
    // Monday 31 August: 24 days on, Thursday 24 September, at Fair Haven; the twin the next weekday at Yale Health.
    expect(appointmentsOf(chooser.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2026, 9, 24, 10), FAIR_HAVEN]]);
    expect(appointmentsOf(twin.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2026, 9, 1, 10), YALE]]);
    const back = thaw(freeze(chooser));
    quiet(back);
    back.advanceTo(at(2026, 9, 24, 11));
    const WHAT_THERE = `A doctor’s visit, ${FAIR_HAVEN_NAME}`;
    const bills = () => healthOf(back.player).bills.filter((b) => b.what === WHAT_THERE);
    expect(bills().map((b) => [b.at, b.amount, b.dueAt, b.paid ?? false, b.covered])).toEqual([[at(2026, 9, 24, 10), OUTSIDE, at(2026, 9, 24, 10) + 30 * MS_DAY, false, undefined]]);
    expect(titled(back, 'A Doctor’s Visit').map((n) => n.body)).toEqual([SAID_OUTSIDE]);
    expect((healthOf(back.player).careLog ?? []).map((c) => [c.what, c.share])).toEqual([[WHAT_THERE, OUTSIDE]]);
    // Yale Health paid none of it, so none of it goes toward Yale Health's out-of-pocket most.
    expect((healthOf(back.player).spent['2026'] ?? 0) - spentBefore).toBe(0);
    // Reloaded again, the clock reaches the due day, Saturday 24 October: paid once, from checking to Medical Care.
    const later = thaw(freeze(back));
    quiet(later);
    later.advanceTo(at(2026, 10, 24, 12));
    const payments = later.universe.transactions.filter((t) => t.memo === `Medical bill: ${WHAT_THERE}`);
    expect(payments).toHaveLength(1);
    const medical = Object.values(later.universe.accounts).find((a) => a.nominal && a.name === 'Medical Care')!;
    expect(into(payments[0]!, checking(later).id)).toBe(-OUTSIDE);
    expect(into(payments[0]!, medical.id)).toBe(OUTSIDE);
    expect(payments[0]!.at).toBe(at(2026, 10, 24, 10));
    later.advanceTo(at(2026, 11, 30, 12));
    expect(later.universe.transactions.filter((t) => t.memo === `Medical bill: ${WHAT_THERE}`)).toHaveLength(1);
    // The twin, seen at Yale Health: nothing billed, nothing paid.
    twin.advanceTo(at(2026, 10, 24, 12));
    expect((healthOf(twin.player).careLog ?? []).map((c) => [c.at, c.what, c.share])).toEqual([[at(2026, 9, 1, 10), `A doctor’s visit, ${YALE_NAME}`, 0]]);
    expect(twin.universe.transactions.filter((t) => t.memo.startsWith('Medical bill: A doctor’s visit'))).toEqual([]);
  }, 120_000);

  it('PLAYER JOURNEY: somebody Yale Health doesn’t cover, withdrawn by the fifteenth day, is given Fair Haven with nothing picked, 24 days on, as before', () => {
    const sim = createSave(1, 'sh-y3', answers('modest'));
    sim.advanceTo(at(2026, 8, 25, 12));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    expect(healthOf(sim.player).clinicId).toBeUndefined();
    expect(papers(sim).text).toContain(`A doctor’s visit: ${FAIR_HAVEN_NAME}`);
    visitWeek(sim, quiet(sim));
    expect(appointmentsOf(sim.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2026, 9, 24, 10), FAIR_HAVEN]]);
    sim.advanceTo(at(2026, 9, 24, 11));
    // Uninsured, the same $183.98 Fair Haven bills a member who picks it; nothing is said of Yale Health.
    expect(titled(sim, 'A Doctor’s Visit').map((n) => n.body)).toEqual([`A doctor’s visit, ${FAIR_HAVEN_NAME}. Your share is $183.98, due in 30 days.`]);
  }, 60_000);

  it('PLAYER JOURNEY: a save an older build wrote, its member booked at Fair Haven by default and her twin by a pick, is opened: the default’s appointment is had at Yale Health on its date at $0, once, the pick’s at Fair Haven at $183.98; the same appointment in a save this build wrote stays at Fair Haven', () => {
    const make = () => createSave(1, 'sh-y4', answers('modest'));
    const byDefault = make();
    const byPick = make();
    byPick.must({ kind: 'health.choose_clinic', payload: { clinicId: FAIR_HAVEN } });
    for (const sim of [byDefault, byPick]) visitWeek(sim, quiet(sim));
    // TEST SETUP: the save as a build before 2026-10-15 wrote it. That build gave a member with nothing picked Fair Haven,
    // and booked the 31 August week's visit there 24 days on, Thursday 24 September at ten, its calendar entry so named;
    // it kept no pick for her (Your Doctor wasn't drawn in New Haven, so health.clinicId was never set). The appointment
    // and its entry are rewritten to that in the save's JSON, and the steps an opening has taken are taken off it: that build
    // kept none (`SaveUniverse.opened`, from 2026-10-15). The twin's pick is recorded, as it is today.
    type Older = { opened?: string[]; people: Record<string, { health: { appointments: { id: string; at: number; clinicId?: string }[]; clinicId?: string } }>; scheduled: { kind: string; status: string; at: number; label: string; payload: { appointmentId?: string } }[]; playerId: string };
    const older = JSON.parse(freeze(byDefault)) as Older;
    const her = older.people[older.playerId]!.health;
    expect(her.clinicId).toBeUndefined();
    expect(her.appointments).toHaveLength(1);
    her.appointments[0]!.at = at(2026, 9, 24, 10);
    her.appointments[0]!.clinicId = FAIR_HAVEN;
    const entry = older.scheduled.find((i) => i.kind === APPOINTMENT_KIND && i.status === 'pending' && i.payload.appointmentId === her.appointments[0]!.id)!;
    entry.at = at(2026, 9, 24, 10);
    entry.label = `The Doctor, ${FAIR_HAVEN_NAME}`;
    // Change the input, the save's age: the same JSON as this build writes it, the step named, is had where it was booked.
    expect(older.opened).toEqual(['followTheCover']);
    const current = loadSave(JSON.parse(JSON.stringify(older)) as never);
    expect(appointmentsOf(current.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2026, 9, 24, 10), FAIR_HAVEN]]);
    delete older.opened;
    const opened = loadSave(older as never);
    // The step taken, and named, so the next opening doesn't take it again.
    expect(opened.universe.opened).toEqual(['followTheCover']);
    quiet(opened);
    // Opened: had at Yale Health, its date kept, its entry renamed.
    expect(appointmentsOf(opened.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2026, 9, 24, 10), YALE]]);
    expect(pendingOf(opened, APPOINTMENT_KIND).map((i) => [i.at, i.label])).toEqual([[at(2026, 9, 24, 10), `The Doctor, ${YALE_NAME}`]]);
    opened.advanceTo(at(2026, 9, 24, 11));
    expect((healthOf(opened.player).careLog ?? []).map((c) => [c.at, c.what, c.share])).toEqual([[at(2026, 9, 24, 10), `A doctor’s visit, ${YALE_NAME}`, 0]]);
    // The recorded pick stays where it was booked, and is billed there.
    const picked = thaw(freeze(byPick));
    quiet(picked);
    expect(appointmentsOf(picked.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2026, 9, 24, 10), FAIR_HAVEN]]);
    picked.advanceTo(at(2026, 9, 24, 11));
    expect(titled(picked, 'A Doctor’s Visit').map((n) => n.body)).toEqual([SAID_OUTSIDE]);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// A booking with nothing picked across a change of cover, and a reload (from 2026-10-15)
// ---------------------------------------------------------------------------

/** TEST SETUP: the coursework prepared each midnight, as tests/scope-cover.test.ts plays a student to a leave. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tend = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** An Inherited family's student, as the creation screen's draft makes her, on a personal leave from 20 January 2027 without Affiliate cover. */
function onLeave(seed: string): Simulation {
  const sim = working(createSave(1, seed, newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'inherited', bankId: 'us-capital-one' } as Partial<NewSaveConfig>)));
  quiet(sim);
  tend(sim, at(2027, 1, 12, 12));
  const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
  tend(sim, asked.decideAt + MS_HOUR);
  expect(sim.player.school!.leave).toMatchObject({ status: 'on', kind: 'personal' });
  expect(coverOn(sim.player, sim.now)).toBeUndefined();
  return sim;
}
/** Opened again from its JSON, with the test's draws and work put back. */
const reopened = (snap: string): Simulation => { const back = working(thaw(snap)); quiet(back); return back; };
const careOf = (sim: Simulation) => (healthOf(sim.player).careLog ?? []).map((c) => [c.at, c.what, c.share]);
/**
 * Fair Haven bills the uninsured's 1.75 times SLATE's price, $100 of 2024 grown by the physicians' services index: 2027
 * reads 2026's 439.389 grown by its 1.75% a year, 447.0783, so 10,000 × 447.0783 ÷ 417.93 = 10,697.44, 10,697 cents,
 * times 1.75 = 18,719.75, $187.20.
 */
const OUTSIDE_2027 = 187_20;

describe('health.choose_clinic: a booking with nothing picked is had where it was booked, whatever the cover does before its day, reloaded or not', () => {
  // Until 2026-10-15 `followTheCover` ran on every opening: a booking like this one, made at Fair Haven while she was
  // uncovered, was had there and billed $187.20 played straight through, and moved to Yale Health for $0 by a reload
  // before its day (found by play). It's taken once now, on an older build's save alone (`SaveUniverse.opened`).
  it('PLAYER JOURNEY: uncovered on her leave, she’s booked at Fair Haven 24 days on by the 25 January week; she buys Affiliate cover; the visit is had at Fair Haven and billed $187.20, played straight through and reloaded before its day alike; canceled and booked again, it’s Yale Health the next weekday at $0', () => {
    const sim = onLeave('sh-r1');
    expect(healthOf(sim.player).clinicId).toBeUndefined();
    visitWeek(sim, quiet(sim));
    // Monday 25 January, 24 days on: Thursday 18 February at ten, at Fair Haven, the practice with nothing picked for
    // somebody Yale Health doesn't cover.
    expect(appointmentsOf(sim.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2027, 2, 18, 10), FAIR_HAVEN]]);
    sim.must({ kind: 'school.buy_affiliate', payload: { confirm: true } });
    expect(coverOn(sim.player, sim.now)).toBe('yale');
    const before = freeze(sim);

    // Played straight through.
    sim.advanceTo(at(2027, 2, 18, 11));
    // Reloaded as she buys it, again the day before, and played to the day.
    const back = reopened(before);
    back.advanceTo(at(2027, 2, 17, 9));
    const again = reopened(freeze(back));
    expect(appointmentsOf(again.player).map((a) => [a.at, a.clinicId])).toEqual([[at(2027, 2, 18, 10), FAIR_HAVEN]]);
    expect(pendingOf(again, APPOINTMENT_KIND).map((i) => [i.at, i.label])).toEqual([[at(2027, 2, 18, 10), `The Doctor, ${FAIR_HAVEN_NAME}`]]);
    again.advanceTo(at(2027, 2, 18, 11));
    for (const s of [sim, again]) {
      expect(careOf(s)).toEqual([[at(2027, 2, 18, 10), `A doctor’s visit, ${FAIR_HAVEN_NAME}`, OUTSIDE_2027]]);
      expect(titled(s, 'A Doctor’s Visit').map((n) => n.body)).toEqual([`A doctor’s visit, ${FAIR_HAVEN_NAME}. Yale Health pays for a visit at its own Health Center, not here. Your share is $187.20, due in 30 days.`]);
    }

    // Change the input: the booking canceled and booked again once she's covered. Yale Health, the next weekday, at $0.
    const rebooked = reopened(before);
    rebooked.must({ kind: 'health.cancel_appointment', payload: { appointmentId: appointmentsOf(rebooked.player)[0]!.id } });
    rebooked.must({ kind: 'health.book', payload: {} });
    const next = appointmentsOf(rebooked.player);
    expect(next.map((a) => a.clinicId)).toEqual([YALE]);
    rebooked.advanceTo(next[0]!.at + MS_HOUR);
    expect(careOf(rebooked)).toEqual([[next[0]!.at, `A doctor’s visit, ${YALE_NAME}`, 0]]);
  }, 600_000);

  it('PLAYER JOURNEY: uncovered on her leave, she’s booked at Fair Haven 24 days on by the 20 December 2027 week; back at the School on 3 January 2028, Yale Health covers her again, and the visit is had at Fair Haven and billed alike, played straight through and reloaded', () => {
    const sim = onLeave('sh-r2');
    sim.advanceTo(at(2027, 11, 1, 9));
    sim.must({ kind: 'school.return_notice', payload: {} });
    sim.advanceTo(at(2027, 12, 19, 12));
    const monday = visitWeek(sim, quiet(sim));
    expect(monday).toBe(at(2027, 12, 20, 9));
    const booked = appointmentsOf(sim.player).map((a) => [a.at, a.clinicId]);
    // 24 days from Monday 20 December is Thursday 13 January 2028, at ten.
    expect(booked).toEqual([[at(2028, 1, 13, 10), FAIR_HAVEN]]);
    const before = freeze(sim);
    sim.advanceTo(at(2028, 1, 13, 11));
    expect(sim.player.school!.leaves?.at(-1)).toMatchObject({ status: 'returned', returnedAt: at(2028, 1, 3, 9) });
    expect(coverOn(sim.player, at(2028, 1, 13, 10))).toBe('yale');
    const back = reopened(before);
    back.advanceTo(at(2028, 1, 10, 9));
    const again = reopened(freeze(back));
    expect(appointmentsOf(again.player).map((a) => [a.at, a.clinicId])).toEqual(booked);
    again.advanceTo(at(2028, 1, 13, 11));
    expect(careOf(again)).toEqual(careOf(sim));
    // 2028 reads 439.389 grown two years by 1.75%, 454.9022, so 10,000 × 454.9022 ÷ 417.93 = 10,884.65, 10,885 cents, times
    // 1.75 = 19,048.75, $190.49, the uninsured's: Yale Health pays for a visit at its own Health Center alone.
    expect(careOf(sim).filter(([when]) => when === at(2028, 1, 13, 10))).toEqual([[at(2028, 1, 13, 10), `A doctor’s visit, ${FAIR_HAVEN_NAME}`, 190_49]]);
  }, 600_000);
});
