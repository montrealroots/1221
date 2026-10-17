/**
 * The guide's worked examples for Papers, played (from 2026-10-12; `src/engine/content/guide/papers.ts`, `taxes.ts`,
 * `documents.ts`). The connected-journey map (docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md §5) promised that
 * every worked example runs on a throwaway save that is never handed to an adapter, and that its figures are checked:
 * each test here makes its own save (`createSave`, as a new life is made), gives the commands the example's steps name
 * (`sim.execute`, `sim.must`), and reads what the engine then holds against the figures the entry's own example says,
 * read from `GUIDE_BY_ID`, so a drift between the text and the engine fails here. The last test holds a separate live
 * save to the byte across all of them.
 *
 * TEST SETUP marks what the engine can't reach by commands inside a test: a degree conferred (three years of classes,
 * which a passive life doesn't pass), a year's wages and withholding sized to the example's balance, a bank emptied or
 * filled at the example's moment (always by postings, never by setting a balance), and the body kept fed, rested and
 * awake as a player's meals and sleep keep it (`tended`).
 *
 * A share an example gives, a referral "about one time in 11" or a course lifting depression "36% of the time", isn't
 * measured by one play. It's held on the engine's own decider (`drawnWithin`): over 2,000 keys, drawn at the odds just
 * under and just over the text's figure, as far as the text rounds it, and at the share the engine reads itself. A key
 * draws the same number whatever the odds (`sim.rng`), so a decider reading any share outside the text's figure fails.
 *
 * The overview's screen is drawn to markup over the example's save, as tests/defects-g8-4.test.ts draws Papers:
 * `useGame` stands in for the provider, `run` is the save's own `execute`, and the kept tab is answered from
 * `drawing.tabs`, since the store it's kept in has no server snapshot to draw from.
 *
 * Played, each entry's example:
 * - papers.overview: the chapter read through I've Read It, then Papers drawn: on Tax Returns at first, Health Cover's
 *   Your Cover reading what covers them this month, then Home and Papers again; the clock unmoved by drawing them, and
 *   the save changed by nothing but the empty records the screens' readers make where none was kept;
 * - papers.health-cover: the degree, the cover's end on 1 August, HUSKY D refused for its work test and Enroll into the
 *   marketplace from 1 September (from 2026-10-15: until then into HUSKY D), care priced on either side of it, and
 *   enrolling ahead from 2 June;
 * - papers.doctor: a Monday's visit booked at the practice and for the wait the step says (from 2026-10-15, Yale
 *   Health's practice the next weekday: until then Fair Haven, 24 days on), slept through, booked again, kept at $0, a
 *   referral's wait, and the referral's share on the engine's decider; and, for its “as every booking is”, a booking
 *   at Fair Haven, picked, from 2 November 2026 whose wait ends on Thanksgiving, put on the Friday;
 * - papers.conditions: a life drawn with depression, Yale's course of eight sessions at $0, how it ends, and the share
 *   that lifts on the engine's decider;
 * - papers.benefits: a claim filed on a summer's stipend, its toast, and the first Sunday's payment with no waiting week;
 * - papers.pensions: two summers' stipends on the record, the credits they earn, and Claim Social Security refused;
 * - taxes.return: the 2026 return filed on its day, and filed 85 days late with its penalties and interest;
 * - taxes.pay: a part paid to the IRS and a part to Connecticut, each split as the example says;
 * - taxes.plan: two years owed, the later filed in February before its due date, the IRS plan applied for and approved
 *   within the minute, its least payment, the penalty's rate on each year, and its first payment;
 * - taxes.lien: Connecticut's bill, its notice of intent and lien, the levy it schedules, payment, the release asked for
 *   and given, and the lien that a payment before it never files;
 * - documents.passport-id: a Connecticut ID card got, reported stolen, reported to the police and replaced, the photo ID
 *   that stands meanwhile, and a bank's refusal without one;
 * - documents.work: OPT applied for on its window's second day, decided, begun, and ended by its days without work, and
 *   the status's end without it;
 * - documents.residence: Mexico's row read on Papers by a student whose savings meet its test and by one a hundred dollars
 *   short, the same words for both, and the route refused in them with nothing moved. Until 2026-10-16 (brief 09's
 *   journeys) it played the savings test at its threshold, the card bought for a year and renewed in its last 30 days,
 *   which nothing outside these papers read; from then the card isn't sold.
 *
 * Not run, and why:
 * - papers.overview's "back from Home, the screen is on Health Cover, where you left it": the tab is kept in the
 *   screen's memory, not the save (`useKept` in `ui/workspaces/PapersWorkspace.tsx`), and the drawing here answers it
 *   from `drawing.tabs`, so nothing the engine holds says which tab comes back.
 * - papers.doctor's "renews your prescriptions": a kept visit does set it (`renewPrescriptions` writes `prescribedAt`
 *   on each condition kept up), but nothing in New Haven reads it. `rxValidUntil` gives a prescription an end only
 *   where `RX.validYears` has one, British Columbia alone, so for a US life a renewal changes no outcome a test could
 *   check.
 * - papers.pensions' "the record stops near there, and Claim Social Security never shows for this life": a claim about
 *   the forty years after school, which no test plays. The clock isn't moved to the third year's fall either: Credits
 *   reads the earnings record alone (`socialSecurityOf`), which the TEST SETUP writes, and a passive life isn't kept in
 *   good standing that long.
 *
 * Corrected later on 2026-10-12, after a second read of these tests against the engine. Until then the overview
 * compared the save with itself across no command, so its check couldn't fail, and its example said the save was as
 * it was, where drawing Tax Returns writes an empty `returns` and `earnings`; the doctor's step held its "24 days on"
 * against `waitDays`, which rounds the same constant the text does, and never read the days from the notice to the
 * booking or that the notice came on a Monday; the specialist's "31 days later", the referral's "one time in 11" and
 * the course's "36% of the time" were each held against the constant the text is built from; the plan's rate was read
 * on the earlier year alone, where the example's claim held, while on the later year, not yet due when the plan began,
 * `payLateRateAt` charged nothing at first, and the example said otherwise; the renewal of prescriptions was left out
 * as having nothing to renew, where the reason was that nothing reads it; and the isolation test replayed any example
 * that had failed and failed with its error, before it read the live save.
 *
 * Corrected on 2026-10-13, after that day’s review made a booking skip a public holiday where you live as well as a
 * weekend (`slot` in `systems/appointments.ts`). Until then no holiday was loaded here, so the holiday half of `slot`
 * read nothing when the doctor’s example was played, `bookedAfter` skipped a weekend alone, and the example’s “moved to
 * the Monday when that’s a weekend, as every booking is” passed, false in the app, which loads them. America’s holidays
 * are loaded as the app loads them, and a booking whose wait ends on Thanksgiving is played.
 */

import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned, zonedParts } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { serialise } from '@/engine/persistence/adapter';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { CHAPTER_FOR } from '@/engine/content/tutorial';
import { READ_KIND, chaptersRead, isOpen, nextChapter } from '@/engine/world/tutorial';
import { POVERTY_LINE, RETURN, byYear } from '@/engine/content/safetynet';
import { SUMMER_CABARET } from '@/engine/content/school';
import { STATE_TAX } from '@/engine/content/statetax';
import { ID_CARDS } from '@/engine/content/identity';
import { WORK_RULES } from '@/engine/content/workrules';
import { exchange } from '@/engine/content/currency';
import { addCountryHolidays, holidaysOn } from '@/engine/content/holidays';
import { careQuote, coverLabel, coverOn, healthOf, keptUp, mayEnroll, uninsuredPrice, yaleUntil } from '@/engine/systems/health';
import { appointmentsOf, mayRefer } from '@/engine/systems/appointments';
import { THERAPISTS, THERAPY, SESSION_HOUR, sessionPrice, therapyLifts } from '@/engine/systems/therapy';
import { basePeriodFor, unemploymentOf } from '@/engine/systems/unemployment';
import { addWithheld, earningsOf, recordWages, yearOf } from '@/engine/systems/earnings';
import { SOCIAL_SECURITY, socialSecurityOf, socialSecurityRefusal } from '@/engine/systems/socialsecurity';
import { PLAN, TAX_NOTICE_KIND, figuresFor, latePenalty, leastMonthly, owedAll, owedOn, partsOn, payLateRateAt, returnsOf } from '@/engine/systems/taxreturn';
import { STATE_NOTICE_KIND, statePartsOn } from '@/engine/systems/statetax';
import { hasSsn } from '@/engine/systems/taxid';
import { documentsOf, photoIdOf } from '@/engine/systems/documents';
import { banksFor } from '@/engine/systems/banking';
import { openRefusal } from '@/engine/systems/bankmoves';
import { programEnd, usStatusEnds } from '@/engine/systems/permission';
import { MEXICAN_RESIDENCE, residenceIn, routeRefusal } from '@/engine/systems/residence';
import { tabKey } from '@/ui/shell/sections';

const drawing = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tabs: {} as Record<string, string> }));

// The screen's kept tab: the store it's kept in has no server snapshot to draw from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(drawing.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return drawing.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => drawing.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(drawing.sim) };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { Home } = await import('@/ui/screens/Home');

/** Papers as the player has it over a save, on a tab when one is kept: its markup, and its text with the tags taken out. */
function papersDrawn(sim: Simulation, tab?: string): { html: string; text: string } {
  drawing.sim = sim;
  drawing.tabs = tab ? { [tabKey('/workspace/papers')]: tab } : {};
  const html = renderToStaticMarkup(createElement(PapersWorkspace)).replace(/<!-- -->/g, '');
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/\s+/g, ' ') };
}

// America's holidays, as the app loads them when a save opens (`loadPlacesFor` in `src/engine/index.ts`): a booking
// skips a public one, and a bank keeps them off its business days (from 2026-10-13: until then none was loaded here, so
// the doctor's booking was never played past one).
addCountryHolidays('us', readFileSync('public/holidays/us.tsv', 'utf8'));

const NY = 'America/New_York';
const MONTHS =['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** A figure in dollars as the guide writes it: whole dollars unless there are cents. */
const usd = (cents: number) => formatMoney(cents, 'USD', { cents: cents % 100 !== 0 });
const example = (id: string) => GUIDE_BY_ID[id]!.example;
/** A figure the example writes, found by a pattern's first group. */
function grab(text: string, re: RegExp): string {
  const m = re.exec(text);
  expect(m, `${re} in “${text}”`).not.toBeNull();
  return m![1]!;
}
const centsOf = (s: string) => Math.round(Number(s.replace(/[$,]/g, '')) * 100);
/** A date the example writes, "March 1, 2027", at noon in New Haven. */
function dateOf(s: string): number {
  const [, month, day, year] = /^([A-Z][a-z]+) (\d+), (\d{4})$/.exec(s.trim())!;
  return at(Number(year), MONTHS.indexOf(month!) + 1, Number(day), 12);
}
const day = (t: number) => formatDate(t, NY);
/** The calendar days between two moments in New Haven. */
const dayKey = (t: number) => { const p = zonedParts(t, NY); return Date.UTC(p.year, p.month - 1, p.day); };
const daysBetween = (a: number, b: number) => Math.round((dayKey(b) - dayKey(a)) / MS_DAY);
/**
 * The days on a booking lands: the wait, moved to the next working day where it ends on a Saturday, a Sunday or a
 * public holiday in New Haven (`slot` in `systems/appointments.ts`). Until 2026-10-13 it moved a weekend alone, as the
 * engine did, and no holiday was loaded here for either to read.
 */
function bookedAfter(from: number, wait: number): number {
  let d = wait;
  const off = (t: Date) => [0, 6].includes(t.getUTCDay()) || holidaysOn(at(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), 10), NY, 'us', 'us-ct').some((h) => h.type === 'public');
  while (off(new Date(dayKey(from) + d * MS_DAY))) d += 1;
  return d;
}
const titled = (sim: Simulation, title: string, from = 0) => sim.universe.notifications.filter((n) => n.title === title && n.at >= from);
const memos = (sim: Simulation, re: RegExp, from = 0) => sim.universe.transactions.filter((t) => t.at >= from && re.test(t.memo));
/** What a transaction took from the player's own accounts. */
const taken = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => -t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).reduce((s, p) => s + p.amount, 0);

/**
 * The keys a decider draws at the engine's own share that it wouldn't at a band the text's figure allows, `low` to
 * `high`: drawn at `low` and not at its own, or at its own and not at `high`. Each key draws one number whatever the
 * odds (`sim.rng` is keyed by its stream and keys alone), so none means the share the engine reads lies in the band,
 * to within the 2,000 keys' spacing. A decider that ignored the odds it's given would pass any band: so the first key
 * is drawn at odds of 0 and of 1 too, and must answer no and yes.
 */
function drawnWithin(draw: (key: number, odds?: number) => boolean, low: number, high: number, keys = 2000): string[] {
  expect([draw(0, 0), draw(0, 1)]).toEqual([false, true]);
  const off: string[] = [];
  for (let k = 0; k < keys; k += 1) {
    const own = draw(k);
    if (draw(k, low) && !own) off.push(`key ${k}: drawn at ${low}, and not at the engine’s share`);
    if (own && !draw(k, high)) off.push(`key ${k}: drawn at the engine’s share, and not at ${high}`);
  }
  return off;
}

/** A first-year at Yale in New Haven, as a new life begins (`newLifeConfig`), a US citizen from New York unless said. */
const student = (seed: string, extra: Partial<NewSaveConfig> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

/** TEST SETUP: the degree conferred today, as the School confers it after the last term, which a test can't play to. */
const graduate = (sim: Simulation, when = sim.now) => { Object.assign(sim.player.school!, { standing: 'graduated', endedAt: when }); };

/**
 * TEST SETUP: money arriving in the current account, posted from a test's own income account: enough that it holds the
 * amount, over anything a bank left empty has overdrawn since.
 */
function fund(sim: Simulation, amount: number): void {
  const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
  const deposit = amount + Math.max(0, -current.balance);
  sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: current.id, amount: deposit }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -deposit }] });
}

/** TEST SETUP: every current and savings account of theirs emptied, posted to a test's own expense account. */
function broke(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.closedAt || !(a.kind === 'checking' || a.kind === 'savings') || a.balance <= 0) continue;
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] });
  }
}

/**
 * TEST SETUP: a year's withholding moved so its return leaves the IRS and Connecticut each what the example says. What
 * was withheld changes neither tax, only the balance (`figuresFor`), so the return is otherwise the year as played.
 */
function owing(sim: Simulation, year: number, irs: number, ct: number): void {
  const f = figuresFor(sim.player, year, 'USD');
  const toIrs = f.owedTo!.irs - irs;
  const toCt = (f.owedTo!.states['us-ct'] ?? 0) - ct;
  const y = yearOf(sim.player, year);
  y.withheld += toIrs + toCt;
  addWithheld(y, toIrs + toCt, { 'us-ct': toCt });
  // Nothing withheld below nothing: the year's tax reaches the example's balance with each authority's.
  expect(y.withheldBy!.us).toBeGreaterThanOrEqual(0);
  expect(y.withheldBy!['us-ct'] ?? 0).toBeGreaterThanOrEqual(0);
  const after = figuresFor(sim.player, year, 'USD').owedTo!;
  expect(after.irs).toBe(irs);
  expect(after.states['us-ct'] ?? 0).toBe(ct);
}

/** TEST SETUP: wages a test gives the year, paid in New Haven, so its return has tax to owe. */
const wages = (sim: Simulation, when: number, gross: number) => recordWages(sim.player, when, NY, { gross, employer: 'guide-example' });

// ---------------------------------------------------------------------------
// Each example, played once; the isolation test plays any a filter left out.
// ---------------------------------------------------------------------------

/**
 * Each example begun, whether or not it got to its end: a failure is its own test's to report, and the isolation test
 * plays only what a filter left out. Until later on 2026-10-12 an example was marked only once it passed, so the
 * isolation test played a failed one again and failed with its error before it read the live save.
 */
const played = new Set<string>();
const PLAYS: Record<string, () => void> = {};
const play = (id: string) => { played.add(id); PLAYS[id]!(); };

PLAYS['papers.overview'] = () => {
  const ex = example('papers.overview');
  const sim = student('guide-papers-overview', { tutorial: true });
  const chapter = CHAPTER_FOR['ui.papers']!;
  expect(ex.setup).toContain(`“${chapter.title}”`);
  expect(isOpen(sim, 'ui.papers')).toBe(false);
  // The chapters in their order to Papers', each through I've Read It.
  while (!isOpen(sim, 'ui.papers')) sim.must({ kind: READ_KIND, payload: { chapterId: nextChapter(sim)!.id } });
  expect(chaptersRead(sim).at(-1)).toBe(chapter.id);
  const before = serialise(sim.universe);
  const now = sim.now;
  // Papers, drawn with no tab kept: Tax Returns is the tab selected and the pane shown.
  expect(ex.result).toMatch(/^Papers opens on Tax Returns;/);
  const first = papersDrawn(sim).html;
  expect(first).toMatch(/id="papers-tab-returns"[^>]*aria-selected="true"[^>]*>Tax Returns</);
  expect(first).toContain('id="papers-pane-returns"');
  // Health Cover drawn: Your Cover, This Month, names what the engine says covers a first-year this month.
  const shown = grab(ex.result, /Health Cover shows ([^;]+) under Your Cover, This Month;/);
  expect(shown).toBe(coverLabel(sim.player, sim.now));
  const health = papersDrawn(sim, 'health').text;
  expect(health).toContain(` Your Cover How This Works This Month ${shown} `);
  // Home, then Papers again on the tab kept.
  drawing.sim = sim;
  renderToStaticMarkup(createElement(Home));
  papersDrawn(sim, 'health');
  // Drawing them moved no clock, and changed nothing in the world: the save differs only by the empty records the
  // screens' readers make where none was kept (from 2026-10-12: drawn, Tax Returns makes `returns` and `earnings`, through
  // `returnsOf` and `earningsOf`), which every reader takes for none.
  expect(ex.result).toContain('The clock didn’t move, and nothing in the world changed.');
  expect(sim.now).toBe(now);
  expect(changedBesidesEmpty(JSON.parse(before), JSON.parse(serialise(sim.universe)))).toEqual([]);
};

/** Whether a value holds nothing: an empty list, or a record whose every field holds nothing. */
const holdsNothing = (v: unknown): boolean => (Array.isArray(v) ? v.length === 0 : v !== null && typeof v === 'object' && Object.values(v).every(holdsNothing));
/** Where a save's JSON changed, other than a record or list not kept before and kept empty after. */
function changedBesidesEmpty(a: unknown, b: unknown, path = '', out: string[] = []): string[] {
  if (JSON.stringify(a) === JSON.stringify(b) || (a === undefined && holdsNothing(b))) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) changedBesidesEmpty((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`, out);
  } else {
    out.push(`${path}: ${JSON.stringify(a)?.slice(0, 120)} became ${JSON.stringify(b)?.slice(0, 120)}`);
  }
  return out;
}

/** A first year played, then the degree in the spring: the setup of the health cover's example. */
function graduateOfTheSpring(seed: string): Simulation {
  const sim = student(seed);
  tended(sim, at(2027, 5, 24));
  graduate(sim);
  return sim;
}

PLAYS['papers.health-cover'] = () => {
  const ex = example('papers.health-cover');
  expect(ex.setup).toContain('graduated in the spring of 2027, with no pay in July');
  const sim = graduateOfTheSpring('guide-papers-cover');
  const ends = yaleUntil(sim.player)!;
  expect(zonedParts(ends, NY)).toMatchObject({ month: 8, day: 1 });
  tended(sim, at(2027, 8, 1, 12));
  // No pay in July: no wages, and no work-study after the degree.
  const july = earningsOf(sim.player).kinds?.['2027-07'];
  expect((july?.wages ?? 0) + (july?.workStudy ?? 0)).toBe(0);
  // On 1 August, the notice.
  expect(ex.steps[0]).toContain('On 1 August a notice says “Your Health Cover Ended”.');
  const ended = titled(sim, 'Your Health Cover Ended', at(2027, 8, 1, 0));
  expect(ended).toHaveLength(1);
  expect(ended[0]!.body).toContain(`You have no health cover from ${day(ends)}.`);
  // Under The Marketplace, the line the example quotes: July's income is under HUSKY D's line, but from 2027 HUSKY D asks
  // an applicant for the month before's work (from 2026-10-15; until then this said HUSKY D took her), and July had
  // none, so the marketplace is what's open, in the 60 days from 1 August.
  const may = mayEnroll(sim.player, sim.now, 'USD', sim);
  expect(may.ok).toBe(true);
  expect(may.program).toBeUndefined();
  // The sentence named income, school at least half-time or an exception from 2026-10-16 (until then “of earnings”), and
  // from 2026-10-17 income, time at the School or an exception, without the 80 hours' work it began with until then
  // (brief 12): July's income of any kind counts toward the $580 since 2026-10-16 (42 CFR 435.552(f)(2)).
  expect((earningsOf(sim.player).months['2027-07'] ?? 0)).toBeLessThan(580_00);
  expect(may.why).toBe('From January 1, 2027, HUSKY D asks for $580.00 of income, time at the School or an exception in the month before you apply, and last month had none of them. The marketplace is open to you, because you’re within 60 days of losing cover.');
  expect(ex.steps[1]).toContain(`Under The Marketplace: “${may.why}”`);
  // Care in August, uncovered: the uninsured price for a visit, the hospital's charity off an emergency.
  expect(coverOn(sim.player, sim.now)).toBeUndefined();
  expect(careQuote(sim, sim.player, 'visit')).toBe(uninsuredPrice(sim, 'visit', sim.now));
  expect(careQuote(sim, sim.player, 'emergency')).toBeLessThan(uninsuredPrice(sim, 'emergency', sim.now));
  expect(ex.result).toContain('Care in August, uncovered, is billed at the uninsured price, less the hospital’s financial assistance on an emergency or a stay.');
  // Enroll, and the toast as the screen words it.
  const enrolled = sim.must<{ from: number; kind: string }>({ kind: 'health.enroll', payload: {} });
  expect(enrolled.kind).toBe('marketplace');
  const toast = `Enrolled in the marketplace, from ${formatDate(enrolled.from, sim.zone)}.`;
  const quoted = grab(ex.result, /The toast says “([^”…]+)…”/);
  expect(toast.startsWith(quoted)).toBe(true);
  expect(zonedParts(enrolled.from, NY)).toMatchObject({ month: 9, day: 1 });
  // From 1 September: the premium taken on the first, and Access Health CT Standard Silver's $45 a visit.
  tended(sim, at(2027, 9, 2, 12));
  expect(coverLabel(sim.player, sim.now)).toBe('Marketplace Plan');
  expect(healthOf(sim.player).premiums['2027']).toHaveLength(1);
  expect(careQuote(sim, sim.player, 'visit')).toBe(45_00);
  expect(ex.result).toContain(`From 1 September its premium is taken on each month’s first, and a visit costs ${usd(45_00)}.`);

  // Enrolled ahead: Enroll shows from the day the example names, and cover then begins 1 August.
  const ahead = graduateOfTheSpring('guide-papers-cover');
  const opens = yaleUntil(ahead.player)! - 60 * MS_DAY;
  const o = zonedParts(opens, NY);
  expect(ex.result).toContain(`Enrolled ahead, from ${o.day} ${MONTHS[o.month - 1]} while Yale Health still covered them, their cover would have begun 1 August.`);
  tended(ahead, opens - 12 * MS_HOUR);
  expect(mayEnroll(ahead.player, ahead.now).why).toContain(`You can enroll from ${day(opens)}`);
  tended(ahead, opens + 12 * MS_HOUR);
  const early = ahead.must<{ from: number }>({ kind: 'health.enroll', payload: {} });
  expect(early.from).toBe(yaleUntil(ahead.player));
  expect(zonedParts(early.from, NY)).toMatchObject({ month: 8, day: 1 });
};

PLAYS['papers.doctor'] = () => {
  const ex = example('papers.doctor');
  // A life whose Monday brings a doctor's visit in its first weeks. Played half a day at a time, the thirty weeks it
  // was: from 2026-10-15 the visit is booked at Yale Health for the next weekday, kept 25 hours after the Monday's
  // booking, and a week at a time, as until then, ran past it (the 24 days at Fair Haven outlasted a week).
  const sim = student('guide-papers-doctor-2');
  for (let half = 0; half < 30 * 14 && !appointmentsOf(sim.player).length; half += 1) tended(sim, sim.now + 12 * MS_HOUR);
  const booked = appointmentsOf(sim.player)[0]!;
  expect(booked.what).toBe('A doctor’s visit');
  const notice = titled(sim, 'A Doctor’s Appointment').at(-1)!;
  // The notice as the example quotes it, its date the "…", on the Monday the setup names, and the booking as many days
  // on as the step says: no weekend moved it.
  expect(notice.body.replace(day(booked.at), '…')).toBe(grab(ex.steps[0]!, /A notice: “([^”]+)”/));
  expect(ex.setup).toContain('whose Monday brought a doctor’s visit');
  expect(zonedParts(notice.at, NY).weekday).toBe(1);
  // Until 2026-10-15 the step said ", 24 days on." and this read the figure from it; from then it says the next weekday,
  // one day on from the Monday.
  expect(grab(ex.steps[0]!, /, ([^,]+)\.$/)).toBe('the next weekday');
  expect(daysBetween(notice.at, booked.at)).toBe(1);
  // The day of it: asleep from half past midnight to half past noon.
  const p = zonedParts(booked.at, NY);
  tended(sim, at(p.year, p.month, p.day, 0, 30));
  expect(ex.steps[1]).toContain(`sleep past ${p.hour % 12 === 0 ? 12 : p.hour % 12}:00 ${p.hour < 12 ? 'AM' : 'PM'}`);
  sim.must({ kind: 'life.sleep', payload: { hours: 12 } });
  expect(titled(sim, 'Missed The Doctor', booked.at)).toHaveLength(1);
  expect(ex.steps[1]).toContain('“Missed The Doctor” follows');
  const owed = healthOf(sim.player).owedVisit!;
  expect(ex.steps[2]).toContain(`beside “${owed}: not yet seen”`);
  // Book An Appointment: the wait again, moved to the next working day where it ends on a weekend or a public holiday.
  const again = sim.must<{ at: number }>({ kind: 'health.book', payload: {} });
  // Until 2026-10-15 the result said "booked again for 24 days on" and this read the figure from it; from then it says
  // the next weekday at Yale Health's practice, one day on, moved as every booking is.
  const [, soon, practice] = /^It’s booked again for (the next weekday) at ([^,]+, [^,]+), moved to the next working day when that’s a Saturday, a Sunday or a public holiday where you live, as every booking is\./.exec(ex.result) ?? [];
  expect(soon).toBe('the next weekday');
  expect(daysBetween(sim.now, again.at)).toBe(bookedAfter(sim.now, 1));
  // Kept: Yale Health leaves nothing to pay, and no bill is made.
  tended(sim, again.at + 2 * MS_HOUR);
  const kept = titled(sim, 'A Doctor’s Visit', again.at);
  expect(kept).toHaveLength(1);
  expect(kept[0]!.body).toMatch(/There’s nothing to pay\.$/);
  // Had at the practice the result names (from 2026-10-15).
  expect(practice).toBe('Yale Health Center, Student Health');
  expect(kept[0]!.body.startsWith(`A doctor’s visit, ${practice}.`)).toBe(true);
  expect(healthOf(sim.player).bills.filter((b) => b.at === again.at)).toEqual([]);
  expect(ex.result).toContain(`Kept, it costs ${usd(0)} on Yale Health`);
  // A referral: TEST SETUP, the draw forced as the deciders' sweep forces it, and the specialist booked as many days
  // after the visit as the example says.
  const [, oneIn, later] = /about one time in (\d+) ends in a referral to a specialist (\d+) days later/.exec(ex.result) ?? [];
  const referred = mayRefer(sim, sim.player, { id: 'guide', at: sim.now, what: 'A doctor’s visit' }, 1)!;
  // Until 2026-10-15 the 31 days fell on a working day and were the days between, exactly. From then the visit booked
  // again is kept at Yale Health on Wednesday 30 September, and 31 days on is Saturday 31 October, so the specialist is
  // booked, as every booking is, for Monday 2 November: 33 days.
  expect(Number(later)).toBe(31);
  expect(daysBetween(sim.now, referred.at)).toBe(bookedAfter(sim.now, Number(later)));
  expect(daysBetween(sim.now, referred.at)).toBe(33);
  // About one kept visit in that many referred, on the engine's decider (`health.referral`): its share rounds to the
  // text's figure, between one in that many and a half more and one in that many and a half less.
  const visit = (k: number) => ({ id: `guide-rate-${k}`, at: sim.now, what: 'A doctor’s visit' });
  const n = Number(oneIn);
  expect(drawnWithin((k, odds) => mayRefer(sim, sim.player, visit(k), odds) !== undefined, 1 / (n + 0.5), 1 / (n - 0.5))).toEqual([]);
};

/**
 * The doctor’s “as every booking is”, on a booking whose wait ends on a public holiday: Book An Appointment on Monday 2
 * November 2026, whose wait ends on Thursday 26 November, Thanksgiving Day. By the rule the example gives it goes to the
 * next working day, Friday 27 November, 25 days on, at 10:00 AM (from 2026-10-13: until then the example said a weekend
 * alone was moved, and no booking here reached a holiday). From 2026-10-15 the 24 days are Fair Haven's, which the
 * student picks on Your Doctor, read from the entry's own words for it: until then they were where a student's visit
 * went with nothing picked, and the example's result gave them; from then it gives Yale Health's next weekday.
 */
function bookedPastAHoliday(): void {
  const ex = example('papers.doctor');
  expect(ex.result).toContain('moved to the next working day when that’s a Saturday, a Sunday or a public holiday where you live, as every booking is.');
  const [, practice, days] = /unless you pick ([^,]+), (\d+) days on at the uninsured price/.exec(GUIDE_BY_ID['papers.doctor']!.short) ?? [];
  expect(practice).toBe('Fair Haven Community Health Care');
  const wait = Number(days);
  const sim = student('guide-papers-doctor-holiday');
  sim.must({ kind: 'health.choose_clinic', payload: { clinicId: 'us-ct-fhchc-grand' } });
  tended(sim, at(2026, 11, 2, 8));
  // From that Monday the example’s wait ends on Thanksgiving, a public holiday in Connecticut.
  expect(daysBetween(sim.now, at(2026, 11, 26))).toBe(wait);
  expect(holidaysOn(at(2026, 11, 26, 10), NY, 'us', 'us-ct').map((h) => [h.name, h.type])).toContainEqual(['Thanksgiving Day', 'public']);
  // TEST SETUP: a visit owed and none booked, as a missed one leaves it.
  for (const a of [...appointmentsOf(sim.player)]) sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: a.id } });
  healthOf(sim.player).owedVisit ??= 'A doctor’s visit';
  const booked = sim.must<{ at: number }>({ kind: 'health.book', payload: {} });
  expect(booked.at).toBe(at(2026, 11, 27, 10));
  expect(daysBetween(sim.now, booked.at)).toBe(25);
  expect(bookedAfter(sim.now, wait)).toBe(25);
}

PLAYS['papers.conditions'] = () => {
  const ex = example('papers.conditions');
  // A first-year whose life began with depression, as one in four does at 18 to 34.
  const sim = student('guide-papers-dep-0');
  const depression = () => healthOf(sim.player).chronic?.depression;
  expect(depression()).toBeDefined();
  tended(sim, sim.now + 8 * MS_DAY);
  expect(keptUp(depression(), sim.now)).toBe(true);
  expect(depression()!.supplyUntil).toBeGreaterThan(sim.now);
  const yale = THERAPISTS.find((t) => t.yale && t.cityId === sim.player.currentLocationId)!;
  expect(ex.steps[1]).toContain(`Choose ${yale.name}, Free With Yale Health, and press Begin A Course Of ${THERAPY.sessions} Sessions.`);
  const begun = sim.now;
  const course = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: yale.name } });
  expect(zonedParts(course.first, NY).hour).toBe(SESSION_HOUR);
  expect(ex.steps[2]).toContain(`${SESSION_HOUR - 12}:00 PM`);
  for (let week = 0; week < 20 && sim.player.therapy; week += 1) tended(sim, sim.now + 7 * MS_DAY);
  expect(sim.player.therapy).toBeUndefined();
  // Each session $0: nothing taken, nothing billed.
  expect(sessionPrice(sim, yale)).toBe(0);
  expect(ex.result).toContain(`Each session costs ${usd(sessionPrice(sim, yale))}.`);
  expect(memos(sim, /a session/, begun)).toEqual([]);
  expect(healthOf(sim.player).bills.filter((b) => b.what.includes(yale.name))).toEqual([]);
  // After the last: lifted, and gone from Your Conditions; or done, and kept.
  const lifted = titled(sim, 'The Depression Has Lifted', begun);
  const done = titled(sim, 'The Course Is Done', begun);
  expect(lifted.length + done.length).toBe(1);
  const ended = [...lifted, ...done][0]!;
  expect(ended.body).toContain(`${THERAPY.sessions} sessions with ${yale.name}`);
  expect(depression() === undefined).toBe(lifted.length === 1);
  if (done.length) expect(ex.result).toContain('otherwise “The Course Is Done”, and another course can begin.');
  // At the share the example gives, on the engine's decider (`health.therapy`) for Yale's course: the course just
  // played ended as that decider drew it at its last session, and over 2,000 more keys its share is the text's, to the
  // tenth of a point the guide writes it to.
  const share = Number(grab(ex.result, /After the last, ([\d.]+)% of the time a notice says “The Depression Has Lifted”/)) / 100;
  const nhs = yale.nhs === true;
  expect(therapyLifts(sim, sim.player, nhs, ended.at)).toBe(lifted.length === 1);
  expect(drawnWithin((k, odds) => therapyLifts(sim, sim.player, nhs, begun + k, odds), share - 0.0005, share + 0.0005)).toEqual([]);
};

PLAYS['papers.benefits'] = () => {
  const ex = example('papers.benefits');
  const stipend = SUMMER_CABARET.stipendWeekly;
  const june = centsOf(grab(ex.setup, /(\$[\d,.]+) in June/));
  const later = centsOf(grab(ex.setup, /(\$[\d,.]+) in July and August/));
  // The example's summer is four Fridays' stipend in June and nine in July and August.
  expect([june / stipend, later / stipend]).toEqual([4, 9]);
  const sim = graduateOfTheSpring('guide-papers-claim');
  // TEST SETUP: the summer after it with the company, as its Fridays pay it: in the quarters a claim filed in January
  // reads, the first four of the last five completed.
  recordWages(sim.player, at(2027, 6, 25, 17), NY, { gross: june, employer: 'yale-summer-cabaret' });
  recordWages(sim.player, at(2027, 8, 20, 17), NY, { gross: later, employer: 'yale-summer-cabaret' });
  tended(sim, at(2028, 1, 3, 12));
  // No Claim Open: what filing now would pay.
  const preview = basePeriodFor(sim.player, 'ct', sim.now, 'USD');
  expect(preview.quarters).toEqual(['2026-4', '2027-1', '2027-2', '2027-3']);
  expect(preview.result.ok).toBe(true);
  const line = `Filed now, your base period, ${preview.quarters.join(', ')}, pays ${preview.result.why}`;
  expect(line.replace(preview.quarters.join(', '), '…').replace(preview.result.why, '…')).toBe(grab(ex.steps[0]!, /No Claim Open reads “([^”]+)”/));
  const filed = sim.must<{ weekly: number; maxTotal: number }>({ kind: 'benefits.claim', payload: {} });
  expect(filed).toMatchObject({ weekly: preview.result.weekly, maxTotal: preview.result.maxTotal });
  // The toast as the screen words it, and the figures the example gives.
  expect(ex.result).toContain(`The toast says “Claim filed: ${formatMoney(filed.weekly, 'USD')} a week.”`);
  expect(ex.result).toContain(`Each Sunday ${usd(filed.weekly)} goes into your account, with no waiting week first, until ${usd(filed.maxTotal)} has been paid or a year has passed`);
  const claim = unemploymentOf(sim.player).claim!;
  expect(claim.endsAt - claim.filedAt).toBe(365 * MS_DAY);
  // Through Sunday evening in New Haven: the first week paid, with no waiting week.
  const filedAt = sim.now;
  for (let d = 0; d < 8 && !memos(sim, /^Unemployment insurance/, filedAt).length; d += 1) tended(sim, sim.now + MS_DAY);
  const paid = memos(sim, /^Unemployment insurance/, filedAt);
  expect(paid).toHaveLength(1);
  expect(zonedParts(paid[0]!.at, NY)).toMatchObject({ weekday: 0, hour: 20 });
  expect(-taken(sim, paid[0]!)).toBe(filed.weekly);
  expect(titled(sim, 'Your Waiting Week', filedAt)).toEqual([]);
  // Income on the return.
  expect(yearOf(sim.player, 2028).unemployment).toBe(filed.weekly);
};

PLAYS['papers.pensions'] = () => {
  const ex = example('papers.pensions');
  const sim = student('guide-papers-pension');
  const stipend = SUMMER_CABARET.stipendWeekly;
  // TEST SETUP: two summers with the company, 2027's and 2028's, on the earnings record as their Fridays pay them.
  for (const year of [2027, 2028]) {
    recordWages(sim.player, at(year, 6, 25, 17), NY, { gross: 4 * stipend, employer: 'yale-summer-cabaret' });
    recordWages(sim.player, at(year, 8, 20, 17), NY, { gross: 9 * stipend, employer: 'yale-summer-cabaret' });
  }
  const record = socialSecurityOf(sim.player, 'USD');
  expect(record.credits).toBe(2 * Math.min(4, Math.floor((13 * stipend) / 100 / SOCIAL_SECURITY.perCredit)));
  expect(ex.result).toContain(`Credits reads ${record.credits}, against the ${SOCIAL_SECURITY.creditsNeeded} that qualify`);
  // Claimed reads Not Yet, and the button's refusal is the line the example quotes.
  expect(sim.player.socialSecurity).toBeUndefined();
  const refused = socialSecurityRefusal(sim, sim.player)!;
  expect(ex.result).toContain(`Claimed reads Not Yet, with “${refused}” under it.`);
  expect(sim.execute({ kind: 'pension.social_security', payload: {} }).error).toBe(refused);
};

PLAYS['taxes.return'] = () => {
  const ex = example('taxes.return');
  const owed = centsOf(grab(ex.setup, /leaves (\$[\d,.]+) owed to the IRS/));
  const due = dateOf(grab(ex.setup, /due ([A-Z][a-z]+ \d+, \d{4})/));
  const late = Number(grab(ex.steps[1]!, /press it (\d+) days late/));
  /** Their 2026 return, ready on 1 February, leaving the IRS the example's balance and Connecticut nothing. */
  const ready = (seed: string) => {
    const sim = student(seed);
    wages(sim, at(2026, 10, 30), 20_000_00);
    tended(sim, at(2027, 1, 31, 12));
    owing(sim, 2026, owed, 0);
    tended(sim, at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.owedTo).toMatchObject({ irs: owed, states: {} });
    expect(day(r.due)).toBe(day(due));
    return { sim, r };
  };
  // On time: the balance, no more.
  const onTime = ready('guide-papers-return');
  tended(onTime.sim, onTime.r.due - MS_HOUR);
  const filedOnTime = onTime.sim.now;
  onTime.sim.must({ kind: 'tax.file', payload: { year: 2026 } });
  expect(onTime.r.penalty).toBe(0);
  const paidOnTime = memos(onTime.sim, /income tax, 2026/, filedOnTime);
  expect(paidOnTime.map((t) => taken(onTime.sim, t))).toEqual([owed]);
  expect(ex.result).toContain(`On time, it costs the ${usd(owed)} and nothing more.`);
  // Late: the penalties as `latePenalty` adds them, and interest from the due date.
  const lateOne = ready('guide-papers-return');
  tended(lateOne.sim, lateOne.r.due + late * MS_DAY);
  const filedLate = lateOne.sim.now;
  lateOne.sim.must({ kind: 'tax.file', payload: { year: 2026 } });
  const penalty = lateOne.r.penalty!;
  expect(penalty).toBe(latePenalty(owed, lateOne.r.due, filedLate));
  const paidLate = memos(lateOne.sim, /income tax, 2026/, filedLate);
  expect(paidLate).toHaveLength(1);
  const total = taken(lateOne.sim, paidLate[0]!);
  const interest = total - owed - penalty;
  const months = Math.ceil(late / 30.4375);
  const payLate = Math.round(Math.min(RETURN.lateCap, RETURN.payLateMonthly * months) * owed);
  expect(ex.result).toContain(`On ${day(filedLate)} the IRS adds ${usd(penalty)} of late penalties, ${usd(penalty - payLate)} for filing late and ${usd(payLate)} for paying late`);
  // Past its days the filing share is at least the minimum, or the whole balance under it: here the balance.
  expect(late).toBeGreaterThan(RETURN.lateMinimumAfterDays);
  expect(owed).toBeLessThan(RETURN.lateMinimum);
  expect(penalty - payLate).toBe(owed);
  expect(ex.result).toContain(`(after ${RETURN.lateMinimumAfterDays} days the filing share is at least ${usd(owed)}, the whole balance, since that’s under ${usd(RETURN.lateMinimum)})`);
  expect(ex.result).toContain(`about ${usd(interest)} of interest: ${usd(total)} in all.`);
};

PLAYS['taxes.pay'] = () => {
  const ex = example('taxes.pay');
  const irs = centsOf(grab(ex.setup, /left (\$[\d,.]+) of tax owed to the IRS/));
  const ct = centsOf(grab(ex.setup, /and (\$[\d,.]+) to Connecticut/));
  const paidOn = dateOf(grab(ex.steps[0]!, /^On ([A-Z][a-z]+ \d+, \d{4}), type/));
  const toIrs = Number(grab(ex.steps[0]!, /type (\d+) in Pay/)) * 100;
  const toCt = Number(grab(ex.steps[1]!, /^Type (\d+) in Pay Connecticut/)) * 100;
  const sim = student('guide-papers-pay');
  wages(sim, at(2026, 10, 30), 40_000_00);
  tended(sim, at(2027, 1, 31, 12));
  owing(sim, 2026, irs, ct);
  // Filed on its day with nothing in the bank: both owed.
  tended(sim, at(2027, 4, 15, 12));
  broke(sim);
  sim.must({ kind: 'tax.file', payload: { year: 2026 } });
  const r = returnsOf(sim.player)['2026']!;
  const sd = r.stateDue!['us-ct']!;
  expect(r.parts).toEqual({ tax: irs, penalty: 0, interest: 0 });
  expect(sd.parts).toEqual({ tax: ct, penalty: 0, interest: 0 });
  // The day the example pays, with money in the bank again.
  tended(sim, paidOn);
  fund(sim, 1_000_00);
  const irsBefore = partsOn(r, sim.now);
  expect(irsBefore.penalty).toBe(Math.round(irs * RETURN.payLateMonthly));
  const toTax = sim.must<{ tax: number; penalty: number; interest: number }>({ kind: 'tax.pay', payload: { year: 2026, amount: toIrs } });
  expect(toTax).toMatchObject({ tax: toIrs, penalty: 0, interest: 0 });
  expect(r.parts!.tax).toBe(irs - toIrs);
  // Each month's penalty from then is a share of the tax left: one whole month on, it has grown by that much.
  const month = 30.4375 * MS_DAY;
  const monthly = partsOn(r, sim.now + month, true).penalty - partsOn(r, sim.now, true).penalty;
  expect(Math.round(monthly)).toBe(Math.round((irs - toIrs) * RETURN.payLateMonthly));
  expect(ex.result).toContain(`All ${usd(toIrs)} goes to the IRS’s tax, leaving ${usd(irs - toIrs)}, so each month’s penalty from then on is ${usd(Math.round(monthly))} instead of ${usd(irsBefore.penalty)}.`);
  // Connecticut's, by then, and its part paid in Connecticut's order.
  const ctBefore = statePartsOn(sd, r.due, sim.now);
  expect(ctBefore.tax).toBe(ct);
  expect(ex.result).toContain(`By then Connecticut has added ${usd(ctBefore.penalty)} of penalty and ${usd(ctBefore.interest)} of interest.`);
  const split = sim.must<{ tax: number; penalty: number; interest: number }>({ kind: 'tax.pay_state', payload: { state: 'us-ct', year: 2026, amount: toCt } });
  const order = STATE_TAX['us-ct'].order;
  expect(order).toEqual(['penalty', 'interest', 'tax']);
  expect(ex.result).toContain(`Its ${usd(toCt)} pays the penalty, then the interest, then the tax: ${usd(split.penalty)}, ${usd(split.interest)} and ${usd(split.tax)}, leaving ${usd(sd.parts!.tax)} of tax.`);
  expect(split.penalty + split.interest + split.tax).toBe(toCt);
};

PLAYS['taxes.plan'] = () => {
  const ex = example('taxes.plan');
  const total = centsOf(grab(ex.setup, /You owe the IRS (\$[\d,.]+) across two years/));
  const lowShare = Number(grab(ex.setup, /income is under (\d+)% of the poverty line/)) / 100;
  expect(lowShare).toBe(PLAN.lowIncomeShare);
  const sim = student('guide-papers-plan');
  // 2026: a balance to the IRS, filed on its day with nothing in the bank.
  wages(sim, at(2026, 10, 30), 20_000_00);
  tended(sim, at(2027, 1, 31, 12));
  owing(sim, 2026, 1_200_00, 0);
  tended(sim, at(2027, 4, 14, 12));
  broke(sim);
  sim.must({ kind: 'tax.file', payload: { year: 2026 } });
  // 2027: its return filed the day after it's ready, its balance what brings the two to the example's.
  wages(sim, at(2027, 10, 29), 20_000_00);
  tended(sim, at(2028, 2, 2, 12));
  const first = returnsOf(sim.player)['2026']!;
  expect(owedOn(first, sim.now)).toBeGreaterThan(0);
  owing(sim, 2027, total - owedOn(first, sim.now), 0);
  broke(sim);
  sim.must({ kind: 'tax.file', payload: { year: 2027 } });
  expect(owedAll(sim.player, sim.now)).toBe(total);
  expect(Object.values(returnsOf(sim.player)).filter((r) => r.owed).map((r) => r.year)).toEqual([2026, 2027]);
  expect(hasSsn(sim.player)).toBe(true);
  const latest = returnsOf(sim.player)['2027']!;
  expect(latest.figures.income).toBeLessThan(lowShare * byYear(POVERTY_LINE, latest.year));
  // The later return filed in the month the setup names, before its due date.
  const filedIn = grab(ex.setup, /the later one in ([A-Z][a-z]+) before it was due/);
  expect(zonedParts(latest.filedAt!, NY).month).toBe(MONTHS.indexOf(filedIn) + 1);
  expect(latest.filedAt!).toBeLessThan(latest.due);
  // Monthly Payments, Each Month at its least, By Direct Debit ticked.
  const applied = sim.now;
  const plan = sim.must<{ decideAt: number; fee: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long', directDebit: true } });
  expect(plan.decideAt - applied).toBeLessThanOrEqual(60_000);
  expect(plan.fee).toBe(PLAN.fee.lowIncomeDebit);
  expect(ex.result).toContain(plan.fee ? `It’s approved within a minute, for a ${usd(plan.fee)} setup fee` : 'It’s approved within a minute, with no setup fee at the low-income rate');
  tended(sim, applied + 2 * 60_000);
  const p = sim.player.taxPlan!;
  expect(p.status).toBe('active');
  expect(p.monthly).toBe(leastMonthly(total));
  expect(p.nextDue! - p.startedAt!).toBe(30 * MS_DAY);
  expect(ex.result).toContain(`${usd(p.monthly!)} a month, the ${usd(total)} over ${PLAN.leastMonths} months, with the first payment 30 days later.`);
  // The letters stop.
  expect(ex.result).toContain('The IRS’s letters stop.');
  expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === TAX_NOTICE_KIND && i.payload.personId === sim.player.id)).toEqual([]);
  const month = 30.4375 * MS_DAY;
  // Each month of the penalty that begins under the plan, on both years' returns, filed on time, at the example's rate
  // where the month already begun stays at the full one. Later on 2026-10-12 `payLateRateAt` was corrected to charge
  // the plan's rate month by month (tests/plan-rate.test.ts). Until then this read the later year's rate as nothing
  // at first, its months before the due date counted against those after, and the example said so; and it read each
  // year at whole months only, where the rate stood a step higher for about half of each month and then fell back.
  const planRate = Number(grab(ex.result, /each month of penalty that begins under the plan is ([\d.]+)% instead of/)) / 100;
  const fullRate = Number(grab(ex.result, /under the plan is [\d.]+% instead of ([\d.]+)%:/)) / 100;
  expect(planRate).toBeCloseTo(PLAN.reducedRate, 12);
  expect(fullRate).toBeCloseTo(RETURN.payLateMonthly, 12);
  expect(ex.result).toContain('On both years’ returns, filed on time,');
  for (const r of [first, latest]) {
    expect(r.filedAt!).toBeLessThanOrEqual(r.due);
    expect(r.reducedFrom).toBe(p.startedAt);
  }
  // The earlier year's return, past its due date when the plan began: the month in progress at the rate the example
  // says it stays at, and the months begun after it at the plan's, the rate never falling between.
  const stays = Number(grab(ex.result, /on the earlier year from its next month \(the month already begun stays at ([\d.]+)%\)/)) / 100;
  expect(first.due).toBeLessThan(p.startedAt!);
  const begun = Math.ceil((p.startedAt! - first.due) / month);
  expect(payLateRateAt(first, p.startedAt!) - payLateRateAt(first, first.due + (begun - 1) * month - MS_HOUR)).toBeCloseTo(stays, 10);
  for (const ahead of [0.1, 0.5, 0.9, 1.5, 5.5]) expect(payLateRateAt(first, first.due + (begun + ahead) * month) - payLateRateAt(first, p.startedAt!), `${ahead} months on`).toBeCloseTo(planRate * Math.ceil(ahead), 10);
  // The later year's, not yet due when the plan began: the plan's rate from its first month past due, a step as each
  // month begins.
  expect(ex.result).toContain('and on the later year from its first month past its due date.');
  expect(p.startedAt!).toBeLessThan(latest.due);
  expect(payLateRateAt(latest, latest.due)).toBe(0);
  for (const past of [0.1, 0.5, 0.9, 1.5, 6.5]) expect(payLateRateAt(latest, latest.due + past * month), `${past} months past due`).toBeCloseTo(planRate * Math.ceil(past), 10);
  // The payment kept in the current account, taken on its day.
  tended(sim, p.nextDue! - MS_HOUR);
  fund(sim, p.monthly!);
  tended(sim, p.nextDue! + MS_HOUR);
  expect(p.history.filter((h) => h.what === 'A payment').map((h) => h.amount)).toEqual([p.monthly]);
};

PLAYS['taxes.lien'] = () => {
  const ex = example('taxes.lien');
  const filedOn = dateOf(grab(ex.setup, /return on ([A-Z][a-z]+ \d+, \d{4}) with/));
  const ct = centsOf(grab(ex.setup, /with (\$[\d,.]+) owed to Connecticut/));
  const rules = STATE_TAX['us-ct'];
  /** Their 2026 return, filed on the example's day with Connecticut's balance and nothing in the bank. */
  const filed = (seed: string) => {
    const sim = student(seed);
    wages(sim, at(2026, 10, 30), 40_000_00);
    tended(sim, at(2027, 1, 31, 12));
    owing(sim, 2026, 0, ct);
    tended(sim, filedOn);
    broke(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const r = returnsOf(sim.player)['2026']!;
    expect(r.stateDue!['us-ct']!.owed).toBe(ct);
    expect(r.owed).toBeUndefined();
    return { sim, r, sd: r.stateDue!['us-ct']! };
  };
  const { sim, r, sd } = filed('guide-papers-lien');
  // Its bill, on its day: counted from the due date, the return filed before it (from 2026-10-15, `stateNextNotice`;
  // until then from filing).
  expect(filedOn).toBeLessThan(r.due);
  tended(sim, r.due + rules.notices[0]!.days * MS_DAY + MS_HOUR);
  const bill = titled(sim, rules.notices[0]!.title, filedOn);
  expect(bill).toHaveLength(1);
  expect(ex.steps[0]).toBe(`${day(bill[0]!.at)}: “${rules.notices[0]!.title}”.`);
  // Its notice of intent, and its lien, for the tax with its penalty and interest by then.
  tended(sim, bill[0]!.at + rules.notices[1]!.days * MS_DAY + MS_HOUR);
  const intent = titled(sim, rules.notices[1]!.title, filedOn);
  expect(intent).toHaveLength(1);
  const lien = sd.lien!;
  expect(lien.status).toBe('filed');
  expect(lien.filedAt).toBe(intent[0]!.at);
  const parts = statePartsOn(sd, r.due, lien.filedAt!);
  expect(lien.amount).toBe(parts.tax + parts.penalty + parts.interest);
  expect(ex.steps[1]).toBe(`${day(lien.filedAt!)}: “${rules.notices[1]!.title}”, and its lien is filed for ${usd(lien.amount)}, the tax with its penalty and interest by then.`);
  // Left unpaid, the levy is on the calendar.
  const levy = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === STATE_NOTICE_KIND && i.payload.personId === sim.player.id && i.payload.state === 'us-ct')!;
  expect(levy.at - lien.filedAt!).toBe(rules.levy.afterDays * MS_DAY);
  expect(ex.result).toContain(`Left unpaid, the levy follows ${rules.levy.afterDays} days after it.`);
  // Paid in full, then asked: released on its date.
  fund(sim, 1_000_00);
  sim.must({ kind: 'tax.pay_state', payload: { state: 'us-ct', year: 2026 } });
  expect(lien.status).toBe('paid');
  const asked = sim.now;
  const release = sim.must<{ releaseDue: number }>({ kind: 'tax.lien_release', payload: { state: 'us-ct', year: 2026 } });
  expect(release.releaseDue - asked).toBe(rules.lien!.releaseDays * MS_DAY);
  expect(ex.result).toContain(`The lien reads Paid: Release To Come, then shows a date ${(release.releaseDue - asked) / MS_DAY} days later, when it reads Released.`);
  tended(sim, release.releaseDue + MS_HOUR);
  expect(lien.status).toBe('released');
  // Paid before its day, none is filed.
  const early = filed('guide-papers-lien');
  tended(early.sim, filedOn + rules.notices[0]!.days * MS_DAY + MS_DAY);
  fund(early.sim, 1_000_00);
  early.sim.must({ kind: 'tax.pay_state', payload: { state: 'us-ct', year: 2026 } });
  tended(early.sim, lien.filedAt! + MS_DAY);
  expect(early.sd.lien).toBeUndefined();
  expect(ex.result).toContain(`Paid before ${day(lien.filedAt!)}, it would never have been filed`);
};

PLAYS['documents.passport-id'] = () => {
  const ex = example('documents.passport-id');
  // A life that began with a passport and a New York license.
  const sim = student('guide-papers-id-0');
  // Connecticut's card, got through Get Non-Driver Identification Card and come by mail (from 2026-10-17: until then in
  // force at the counter).
  const name = ID_CARDS['us-ct']!.name;
  expect(ex.setup).toContain(`holding a Connecticut ${name}`);
  const got = sim.must<{ readyAt: number }>({ kind: 'documents.apply_idcard', payload: {} });
  tended(sim, got.readyAt + MS_HOUR);
  const card = documentsOf(sim.player).find((d) => d.kind === 'idcard' && d.issuer === 'us-ct' && d.status === 'valid')!;
  // Reported stolen, reported to the police online, and replaced.
  sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id, stolen: true } });
  sim.must({ kind: 'documents.police_report', payload: { documentId: card.id } });
  const replaced = sim.now;
  const fresh = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.replace_idcard', payload: { documentId: card.id } });
  expect(memos(sim, /, replaced$/, replaced).map((t) => taken(sim, t))).toEqual([fresh.fee]);
  expect(ex.steps[2]).toBe(`Press Replace It, ${usd(fresh.fee)}.`);
  expect(card.status).toBe('cancelled');
  expect(card.policeReport).toBeDefined();
  const coming = documentsOf(sim.player).find((d) => d.kind === 'idcard' && d.status === 'pending')!;
  expect(coming.number).not.toBe(card.number);
  const days = (fresh.readyAt - replaced) / MS_DAY;
  expect(ex.result).toContain(`The old card is canceled, with the report kept on it. ${usd(fresh.fee)} leaves the bank, and the new card, with a new number, arrives ${days} days later.`);
  // Meanwhile a passport or a license is the photo ID.
  expect(['passport', 'license']).toContain(photoIdOf(sim.player, sim.now)?.kind);
  tended(sim, fresh.readyAt + MS_HOUR);
  expect(coming.status).toBe('valid');
  // Without one, a bank they don't bank with turns them away: every photo ID reported lost.
  const without = student('guide-papers-id-0');
  for (const d of documentsOf(without.player).filter((x) => ['passport', 'license', 'idcard'].includes(x.kind) && x.status === 'valid')) without.must({ kind: 'documents.report_lost', payload: { documentId: d.id } });
  expect(photoIdOf(without.player, without.now)).toBeUndefined();
  const mine = without.universe.accounts[without.player.primaryAccountId!]!.bankId;
  const other = banksFor(without.player.currentLocationId).find((b) => b.id !== mine)!;
  expect(openRefusal(without, without.player, other.id)).toMatch(/needs a valid photo ID from a new customer/);
  expect(ex.result).toContain('Without one, a new bank would turn you away.');
};

PLAYS['documents.work'] = () => {
  const ex = example('documents.work');
  const opt = WORK_RULES.opt;
  // An F-1 student, a British citizen, of the class of 2029.
  const sim = student('guide-papers-opt', { homeRegionId: 'uk-eng-london' });
  const end = programEnd(sim.player)!;
  expect(ex.setup).toContain(`whose program ends ${day(end)}, with no work lined up.`);
  // TEST SETUP: the degree set as conferred on 21 May 2029 from the start, since three years of classes can't be played
  // here; OPT reads the school only for whether it was left without the degree (`optRefusal`).
  graduate(sim, at(2029, 5, 21));
  const applyOn = end - (opt.windowBeforeDays - 1) * MS_DAY;
  expect(ex.steps[0]).toBe(`On ${day(applyOn)}, press Apply For OPT.`);
  tended(sim, applyOn);
  // Without OPT, the status's end: the program's, and its grace.
  const without = usStatusEnds(sim.player)!;
  expect(ex.result).toContain(`Without OPT, your status would have ended on ${day(without)}.`);
  const applied = sim.now;
  const v = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.apply_opt', payload: {} });
  expect(memos(sim, /, OPT$/, applied).map((t) => taken(sim, t))).toEqual([v.fee]);
  tended(sim, v.readyAt + MS_HOUR);
  const permit = documentsOf(sim.player).find((d) => d.kind === 'permit' && d.name.includes('OPT'))!;
  expect(permit.status).toBe('valid');
  expect(permit.issuedAt).toBe(Math.max(end, v.readyAt));
  // Ninety days without work, counted a week at a time.
  for (let week = 0; week < 20 && permit.status === 'valid'; week += 1) tended(sim, sim.now + 7 * MS_DAY);
  expect(permit.status).toBe('cancelled');
  expect(sim.player.usOutOfStatus).toBe(permit.endedAt);
  expect(ex.result).toBe(`${usd(v.fee)} leaves the bank. OPT is decided on ${day(v.readyAt)} and runs from ${day(permit.issuedAt!)}. With no work, it ends on ${day(permit.endedAt!)}, past its ${opt.unemploymentDays} days, and your status ends with it. Without OPT, your status would have ended on ${day(without)}.`);
};

PLAYS['documents.residence'] = () => {
  const ex = example('documents.residence');
  const mx = MEXICAN_RESIDENCE;
  const threshold = Math.round(mx.savingsUma * mx.uma);
  const income = Math.round(mx.incomeUma * mx.uma);
  const pesos = (units: number) => `MXN ${units.toLocaleString('en-US', { minimumFractionDigits: units % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  expect(ex.setup).toContain(`with ${pesos(threshold)}, about ${usd(Math.round(exchange(threshold * 100, 'MXN', 'USD')! / 100) * 100)}, in the bank, which meets Mexico’s savings test.`);
  // The row's words by hand: 11,460 UMA and 680 at MXN 117.31, MXN 1,344,372.6 and 79,770.8, rounded to the peso; the
  // card's MXN 11,140.74 and the visa's US$56 as the guidelines and the Ley Federal de Derechos give them.
  const words = 'Mexico grants temporary residence on savings of MXN 1,344,373 or an income of MXN 79,771 a month over six months, with the card at MXN 11,140.74 a year and the consulate’s visa at US$56. Moving abroad isn’t part of the game, so it grants none of Mexico’s papers.';
  expect([pesos(threshold), pesos(income)]).toEqual(['MXN 1,344,373', 'MXN 79,771']);
  // TEST SETUP: the bank holding the savings test's figure, and a twin a hundred dollars short of it. Until 2026-10-16
  // the first was offered the card and the second refused; from then both read Mexico's rule and the same reason.
  const met = student('guide-papers-mx-threshold');
  broke(met);
  fund(met, Math.ceil(exchange(threshold * 100, 'MXN', 'USD')!));
  const short = student('guide-papers-mx-threshold');
  broke(short);
  fund(short, Math.ceil(exchange(threshold * 100, 'MXN', 'USD')!) - 100_00);
  for (const sim of [met, short]) {
    expect(routeRefusal(sim, sim.player, 'MX')).toBe(words);
    const drawn = papersDrawn(sim, 'work');
    expect(drawn.text).toContain(` Mexico ${words} `);
    // Apply drawn grayed, its title the same words (until 2026-10-16 it was live, and sold the card).
    expect(drawn.html).toContain(`<button type="button" class="btn btn-sm" title="${words}" disabled="">Apply</button>`);
    const before = serialise(sim.universe);
    const r = sim.execute({ kind: 'documents.residence', payload: { country: 'MX' } });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(words);
    expect(serialise(sim.universe)).toBe(before);
    expect(residenceIn(sim.player, 'MX', sim.now)).toBeUndefined();
    expect(memos(sim, /Mexican/)).toEqual([]);
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
  }
  expect(ex.result).toBe(`Mexico’s row gives its rule, savings of ${pesos(threshold)} or an income of ${pesos(income)} a month over six months, and says the game grants none of its papers, because moving abroad isn’t part of the game. Apply is grayed out with those words, nothing leaves the bank, and a student without the savings sees the same row.`);
};

// ---------------------------------------------------------------------------
// The tests
// ---------------------------------------------------------------------------

// The live save, made before any example and held to the byte after them all.
const live = student('guide-papers-live');
tended(live, live.now + 3 * MS_DAY);
const liveBefore = serialise(live.universe);

describe('the guide’s worked examples for Papers, played on throwaway saves', () => {
  it('papers.overview: the chapter read opens Papers, and reading Your Cover changes nothing', () => play('papers.overview'));
  it('papers.health-cover: a spring graduate’s cover ends on 1 August, HUSKY D asks the work July didn’t have, and the marketplace begins 1 September', () => play('papers.health-cover'));
  it('papers.doctor: a visit slept through is booked again, kept at $0, and a referral waits its days', () => play('papers.doctor'));
  it('papers.doctor: as every booking is, a wait ending on Thanksgiving is booked for the Friday, 25 days on', bookedPastAHoliday);
  it('papers.conditions: Yale’s course of eight costs nothing, and ends lifted or done', () => play('papers.conditions'));
  it('papers.benefits: a claim on a summer’s stipend pays its week each Sunday, with no waiting week', () => play('papers.benefits'));
  it('papers.pensions: two summers earn the credits the example says, and the claim waits for 62', () => play('papers.pensions'));
  it('taxes.return: on time costs the balance; late adds the penalties and interest the example gives', () => play('taxes.return'));
  it('taxes.pay: a part to the IRS goes to the tax, and Connecticut’s to its penalty, its interest, then its tax', () => play('taxes.pay'));
  it('taxes.plan: $1,800 over two years, approved within the minute at its least monthly payment', () => play('taxes.plan'));
  it('taxes.lien: Connecticut’s lien is filed at its notice of intent, paid, and released when asked', () => play('taxes.lien'));
  it('documents.passport-id: a stolen ID card reported and replaced, and the photo ID that stands meanwhile', () => play('documents.passport-id'));
  it('documents.work: OPT applied for, decided, begun, and ended by its days without work', () => play('documents.work'));
  // Renamed on 2026-10-16 (brief 09's journeys, inputs/renames.json): it played the card bought and renewed until then.
  it('documents.residence: Mexico’s row says its rule and why SLATE grants none, the same at its savings threshold and a hundred dollars short, and the route is refused in those words with nothing moved', () => play('documents.residence'));
});

describe('isolation', () => {
  it('leaves a separate live save byte for byte as it was, after every example has run', () => {
    // One a filter left out is played here, and how it ends is its own test's to say: here only the live save is read.
    for (const id of Object.keys(PLAYS)) {
      if (played.has(id)) continue;
      try { play(id); } catch { /* reported by the example's own test */ }
    }
    expect(played.size).toBe(Object.keys(PLAYS).length);
    expect(serialise(live.universe)).toBe(liveBefore);
  });
});
