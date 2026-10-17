/**
 * Evidence for seven Papers rows the review of 2026-10-13 left partial (verification group g15-papers). Each row's
 * action is reached the way a player reaches it, through the command its button sends (pressed here as the button's
 * own handler where the screen is drawn) or through the clock; each consequence is read where the row says it is read,
 * against figures set down here from the rule's own numbers, never asked of the helper the engine computes them with.
 *
 * - `documents.apply_idcard`: Connecticut's $28 (its DMV's fee) leaves the bank; a citizen's card comes by mail twenty
 *   business days on, Tuesday 22 September 2026, Labor Day not among them, and runs to her first birthday at least seven
 *   years on, 14 June 2034 (the DMV's, from 2026-10-17: until then it was in force at once, for SLATE's six years, to 24
 *   August 2032); with every other photo ID reported lost Citi turns the student away, still while the card is on its
 *   way, and, card in hand, opens her account (`photoIdOf` through `bank.open_current`); a second is refused while one is
 *   on its way ("One is on its way.") and once it has come ("You hold one in force."), a Connecticut license holder is
 *   refused ("You hold a license here. It serves as your ID."), a student out of status is refused in SAVE's words, and
 *   a bank that can't cover $28 charges nothing. A British student's Limited Term card waits on SAVE's ten business days,
 *   Monday 19 October to Monday 2 November 2026 (a window with no federal holiday in it), then on the mail's twenty,
 *   Veterans Day and Thanksgiving not among them, to Wednesday 2 December, pending an hour before and in force an hour
 *   after, and runs to the program's end, 31 May 2029.
 * - `documents.apply_opt`: applied for 40 days into the grace, $470 leaves the bank, and the pending application holds
 *   status past the grace's end (permission.ts:151) until OPT is approved 90 days on, for twelve months from the
 *   approval, and then ended by its 91st day without work, with the status. The status's ending, raised by the clock on
 *   the program's last day, files OPT at $470 with no premium when its first action is taken. Premium processing takes
 *   $2,250 and is decided on the thirtieth business day, Tuesday 30 March 2027, counted here on the calendar. Refused in
 *   their own words: a citizen, a first-year before the window, a student who withdrew, a window closed, a second
 *   application, and a bank short of $470.
 * - `documents.replace_idcard`: a card come by mail, then stolen, replaced for $30 in 30 days with a new number; Citi turns the student
 *   away while it's pending and takes it once it has come; a second replacement of the old card, a card applied for
 *   meanwhile, a lost New York card in New Haven and a bank short of $30 are each refused in their words.
 * - `documents.replace_license`: a Connecticut-born student's license replaced for $30 in 30 days, its term and REAL ID
 *   kept; Citi takes it once it has come, and the DMV then refuses her an ID card; a New Yorker's by mail, $17.50 lost
 *   and nothing stolen with the police's report, in 21 days; a Californian refused through the command; a bank short.
 * - `documents.report_lost`: a passport reported stolen and a license lost are marked as said; Citi refuses through
 *   `bank.open_current`; a second report is refused ("That isn’t a document you hold."), across a save and a load; an
 *   F-1 is refused and holds, and a lost passport leaves it valid. On the screen, Report Lost… and Report Stolen… show
 *   only on a card or book in force, its confirm step says what is lost, and Cancel It reports it.
 * - `benefits.assistance`: SNAP from a New Yorker's first morning pays $298 on 31 August and 30 September (USDA's fiscal
 *   2026 maximum for one) and $306 on 30 October (fiscal 2027's), which reads September, its $414 of work-study counted
 *   as nothing (7 CFR 273.9(c)(3)); the
 *   next midnight's groceries come off the EBT card, not the bank; a save and a load in between pays each month once;
 *   the summer recess closes the case, said once, and a new application is refused under 7 CFR 273.5. Ontario Works
 *   pays CAD 343 and BC's Income Assistance CAD 560 a month on quick lives in Toronto and Vancouver, and Ontario's
 *   asset limit refuses a Torontonian with savings.
 * - `benefits.claim`: a summer in the Summer Cabaret's company, its thirteen Fridays at $375 earned by the clock, a
 *   withdrawal in the fall, and a claim on 3 January 2028: Connecticut's $93 a week ((1,500 + 3,375) / 2 / 26, to the
 *   dollar, CGS 31-231a), 26 weeks to $2,418, paid on the first Sunday with no waiting week, once a week across a save and
 *   a load; the 2028 return counts it (its twin, the same save not claiming, owes less federal tax on $2,418 less
 *   income); a week certified in hospital or laid up pays nothing, and a week with three hours worked, $69, $47; a British student
 *   out of status is refused in FUTA's words, with a base period that would pay. A week with work stays a fixture's:
 *   there's no work after school to earn it since the career went.
 * Each row's screen is drawn as the player has it.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, born in New York
 * unless said (Connecticut, California or London where a row is about a license or a status a New Yorker doesn't
 * hold), starting Monday 24 August 2026 at 7:30 AM; played by the clock to where each row is read. Ontario Works and
 * BC's assistance are played on quick lives (`quickSave`) in Toronto and Vancouver, which a life at Yale never reaches,
 * from Monday 5 January 2026. The Papers screen is drawn with react-dom/server: `useGame` stands in for the provider,
 * `run` is the save's own `execute`, the kept tab is answered from `h.tabs`, and each guide gate (`Gated`) is drawn by
 * its own code with its onClick kept, so a test presses the very handler the player's click runs and reads its toast.
 *
 * TEST SETUP, said again where it's done: the body kept fed, rested and awake as the clock moves (`tended`); the degree
 * conferred early by the School's own step (`setStanding`) with the F-1's end moved, since three years of classes can't
 * be played here; good standing set before joining the Summer Cabaret, which a passive spring doesn't keep; a bank
 * emptied by postings to a test account; a lost New York ID card on the record of a student in New Haven, which no life
 * there can come to hold; a license's expiry moved to yesterday; $20,000 of 2028 wages given both twins so the year has
 * a return; a stay in hospital, a concussion and three hours worked on the calendar before a week is certified; and on the
 * screen, the Report Lost… press, which a static render can't make, given as DocumentList's confirming state.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { documentsOf, type PersonDocument } from '@/engine/systems/documents';
import { SHIFT_KIND, setStanding } from '@/engine/systems/school';
import { healthOf } from '@/engine/systems/health';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { unemploymentOf } from '@/engine/systems/unemployment';
import { returnsOf } from '@/engine/systems/taxreturn';
import { tabKey } from '@/ui/shell/sections';

type Pressable = { text: string; feature: string; disabled: boolean; title?: string; onClick?: () => void };

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
  toasts: [] as string[],
  buttons: [] as { text: string; feature: string; disabled: boolean; title?: string; onClick?: () => void }[],
  /** TEST SETUP: DocumentList's confirming state, the Report Lost… press a static render can't make. */
  confirming: undefined as { id: string; stolen: boolean } | undefined,
}));

// The one state on Papers that starts empty is DocumentList's row being confirmed (Documents.tsx:58).
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    return [initial === undefined && h.confirming ? h.confirming : value, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
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

// The screen's kept tab: the store it's kept in has no server snapshot to draw from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// The guide's gate around a command's button, drawn by its own code; its props kept by its words, so a test presses
// the handler the player's click runs.
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const textOf = (n: unknown): string => (n === null || n === undefined || typeof n === 'boolean' ? ''
    : Array.isArray(n) ? n.map(textOf).join('')
      : typeof n === 'object' ? textOf((n as { props?: { children?: unknown } }).props?.children) : String(n));
  const Gated = (props: Parameters<typeof real.Gated>[0]) => {
    h.buttons.push({ text: textOf(props.children), feature: props.feature, disabled: Boolean(props.disabled), title: props.title, onClick: props.onClick as (() => void) | undefined });
    return real.Gated(props);
  };
  return { ...real, Gated };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

// ---------------------------------------------------------------------------
// Lives
// ---------------------------------------------------------------------------

/** Monday 24 August 2026, 7:30 AM in New Haven (EDT, UTC−4): every new life's first moment. */
const START = Date.UTC(2026, 7, 24, 11, 30);
const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12) => instantFromZoned({ year, month, day, hour }, NY);
/** A new life as a player makes one: Ada Cole at Yale, born where `home` says, New York unless said. */
const life = (seed: string, home = 'us-ny-newyork'): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: home, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player keeps it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

/** TEST SETUP: every current and savings account of theirs emptied, posted to a test's own expense account. */
function broke(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.closedAt || !(a.kind === 'checking' || a.kind === 'savings') || a.balance <= 0) continue;
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] });
  }
}

/**
 * TEST SETUP: the degree conferred today by the School's own step (`setStanding`, which commencement calls), the F-1's
 * end moved so the program ended `ago` days back, its 60 days of grace after it (8 CFR 214.2(f)(5)(iv)).
 */
function graduated(sim: Simulation, ago: number): void {
  const f1 = documentsOf(sim.player).find((d) => d.kind === 'visa' && d.name.startsWith('F-1'))!;
  f1.expiresAt = sim.now - ago * MS_DAY + 60 * MS_DAY;
  setStanding(sim, sim.player, 'graduated', 'TEST SETUP: the degree conferred early.');
}

const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const held = (sim: Simulation, kind: PersonDocument['kind']) => documentsOf(sim.player).filter((d) => d.kind === kind);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const memos = (sim: Simulation, memo: string | RegExp, from = 0) => sim.universe.transactions.filter((t) => t.at >= from && (typeof memo === 'string' ? t.memo === memo : memo.test(t.memo)));
/** What a transaction took from the player's own accounts. */
const taken = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => -t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).reduce((s, p) => s + p.amount, 0);

const CITI_REFUSES = 'Citi asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each.';
/** An account at a New Haven bank she doesn't bank with: Citi, online, for a US citizen, no opening deposit. */
const openAtCiti = (sim: Simulation) => sim.execute<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } });
const APPLY_ID = { kind: 'documents.apply_idcard', payload: {} };
const APPLY_OPT = { kind: 'documents.apply_opt', payload: {} };

// ---------------------------------------------------------------------------
// The screen
// ---------------------------------------------------------------------------

/** What the player reads: the markup with every tag (and so every tooltip) taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** Papers as the player has it on a tab: its markup, its words, and the command buttons drawn on it. */
function papers(sim: Simulation, tab: 'passport' | 'work' | 'benefits', confirming?: { id: string; stolen: boolean }): { html: string; text: string; buttons: Pressable[] } {
  h.sim = sim;
  h.tabs = { [tabKey('/workspace/papers')]: tab };
  h.buttons = [];
  h.confirming = confirming;
  try {
    const html = renderToStaticMarkup(createElement(PapersWorkspace)).replace(/<!-- -->/g, '');
    return { html, text: onScreen(html), buttons: [...h.buttons] };
  } finally {
    h.confirming = undefined;
  }
}
/** The one button with these words. */
function button(shown: { buttons: Pressable[] }, text: string): Pressable {
  const found = shown.buttons.filter((b) => b.text === text);
  expect(found.map((b) => b.text), text).toEqual([text]);
  return found[0]!;
}
/** Pressed as the player presses it: the button's own handler, which runs its command and says its toast. */
function press(b: Pressable): string[] {
  h.toasts = [];
  b.onClick!();
  return [...h.toasts];
}
const count = (text: string, words: string) => text.split(words).length - 1;

// ---------------------------------------------------------------------------
// documents.apply_idcard
// ---------------------------------------------------------------------------

describe('documents.apply_idcard', () => {
  /**
   * Connecticut's card applied for at START, Monday 24 August 2026, 7:30 AM: mailed within twenty business days of the
   * appointment (the DMV's Central Issuance), counted here, Labor Day (Monday 7 September) not among them: 25 to 28
   * August, 31 August to 4 September, 8 to 11, 14 to 18 and 21 and 22 September. It runs to her first birthday at least
   * seven years on (CGS 1-1h(b)(2), "valid for 7 years"): born 14 June 2002, 14 June 2034.
   */
  const COMES = Date.UTC(2026, 8, 22, 11, 30);
  const ENDS = Date.UTC(2034, 5, 14, 7);

  // Renamed on 2026-10-17 (brief 11's KS-ct-idcard, inputs/renames.json): until then 'PLAYER JOURNEY: every other photo
  // ID lost, Citi turns her away; $28 leaves the bank for a card in force at once to 24 August 2032, and Citi then opens
  // her account', when a citizen's card was in force at the counter for SLATE's six years.
  it('PLAYER JOURNEY: every other photo ID lost, Citi turns her away; $28 leaves the bank for a card that comes by mail twenty business days on, Tuesday 22 September 2026, good to her birthday on 14 June 2034; Citi turns her away until it comes and then opens her account, across a save and a load', () => {
    const sim = life('g15-idcard');
    expect(sim.now).toBe(START);
    const lost = documentsOf(sim.player).filter((d) => d.status === 'valid');
    expect(lost.map((d) => d.kind).sort()).toEqual(['license', 'passport']);
    for (const d of lost) sim.must({ kind: 'documents.report_lost', payload: { documentId: d.id } });
    expect(openAtCiti(sim).error).toBe(CITI_REFUSES);
    const before = checking(sim).balance;
    const r = sim.must<{ expiresAt: number; fee: number; readyAt: number }>(APPLY_ID);
    // Connecticut DMV's fee for a non-driver photo ID, $28, from the bank on the day.
    expect(before - checking(sim).balance).toBe(28_00);
    expect(memos(sim, 'Non-Driver Identification Card', START).map((t) => taken(sim, t))).toEqual([28_00]);
    expect(r).toEqual({ fee: 28_00, readyAt: COMES, expiresAt: ENDS });
    expect(held(sim, 'idcard')).toEqual([expect.objectContaining({ issuer: 'us-ct', name: 'Non-Driver Identification Card', status: 'pending', appliedAt: START, readyAt: COMES, expiresAt: ENDS, realId: true })]);
    // Meanwhile she holds the temporary paper credential, which a bank doesn't take alone: Citi turns her away still.
    expect(openAtCiti(sim).error).toBe(CITI_REFUSES);
    const back = reload(sim);
    tended(back, COMES - MS_HOUR);
    expect(openAtCiti(back).error).toBe(CITI_REFUSES);
    tended(back, COMES + MS_HOUR);
    expect(held(back, 'idcard')).toEqual([expect.objectContaining({ status: 'valid', issuedAt: COMES, expiresAt: ENDS, realId: true })]);
    expect(titled(back, 'Non-Driver Identification Card Arrived').map((n) => n.at)).toEqual([COMES]);
    expect(memos(back, 'Non-Driver Identification Card').map((t) => taken(back, t))).toEqual([28_00]);
    // What the card is for: a new bank takes it as the photo ID it asks.
    const opened = openAtCiti(back);
    expect(opened.ok, opened.error).toBe(true);
    expect(back.universe.accounts[opened.value!.accountId]).toMatchObject({ bankId: 'us-citi', kind: 'checking', ownerId: back.player.id });
  });

  // Renamed on 2026-10-17 (brief 11's KS-ct-idcard, inputs/renames.json): until then 'refuses a second card while one is
  // in force, in its words, charges once, and holds it across a save and a load', when the card was in force at once.
  it('refuses a second card while one is on its way and once it has come, in its words, charges once, and holds it across a save and a load', () => {
    const sim = life('g15-idcard-twice');
    sim.must(APPLY_ID);
    expect(sim.execute(APPLY_ID).error).toBe('One is on its way.');
    const back = reload(sim);
    expect(back.execute(APPLY_ID).error).toBe('One is on its way.');
    tended(back, COMES + MS_HOUR);
    expect(back.execute(APPLY_ID).error).toBe('You hold one in force.');
    const again = reload(back);
    expect(again.execute(APPLY_ID).error).toBe('You hold one in force.');
    expect(held(again, 'idcard')).toEqual([expect.objectContaining({ status: 'valid', expiresAt: ENDS })]);
    expect(memos(again, 'Non-Driver Identification Card').map((t) => taken(again, t))).toEqual([28_00]);
    // Loaded, it's still the photo ID a new bank takes.
    for (const d of documentsOf(again.player).filter((x) => x.kind !== 'idcard' && x.status === 'valid')) again.must({ kind: 'documents.report_lost', payload: { documentId: d.id } });
    expect(openAtCiti(again).ok).toBe(true);
  });

  it('refuses a Connecticut-born student holding a Connecticut license: “You hold a license here. It serves as your ID.”', () => {
    // A seed whose life begins with a Connecticut license: asserted, not guarded.
    const sim = life('g15-ct', 'us-ct-newhaven');
    expect(held(sim, 'license')).toEqual([expect.objectContaining({ issuer: 'us-ct', status: 'valid' })]);
    const before = checking(sim).balance;
    expect(sim.execute(APPLY_ID).error).toBe('You hold a license here. It serves as your ID.');
    expect(held(sim, 'idcard')).toEqual([]);
    expect(checking(sim).balance).toBe(before);
  });

  it('refuses a student whose bank can’t cover the $28, and charges nothing', () => {
    const sim = life('g15-idcard-broke');
    broke(sim);
    expect(sim.execute(APPLY_ID).error).toBe('$28.00 is more than the bank can cover.');
    expect(held(sim, 'idcard')).toEqual([]);
    expect(memos(sim, 'Non-Driver Identification Card')).toEqual([]);
  });

  it('refuses a British student who withdrew, first for enrollment and, once she stayed past her fifteen days, in SAVE’s words', () => {
    const sim = life('g15-oos', 'uk-eng-london');
    tended(sim, at(2026, 9, 8));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(sim.execute(APPLY_ID).error).toBe('On an F-1, the DMV asks for your I-20 and proof you’re enrolled, and you’re not at school.');
    tended(sim, at(2026, 9, 25));
    expect(sim.player.usOutOfStatus).toBe(at(2026, 9, 8) + 15 * MS_DAY);
    expect(sim.execute(APPLY_ID).error).toBe('The DMV checks lawful presence through SAVE, and you stayed past your status.');
    expect(held(sim, 'idcard')).toEqual([]);
  });

  // Renamed on 2026-10-17 (brief 11's KS-ct-idcard, inputs/renames.json): until then 'PLAYER JOURNEY: a British
  // student’s Limited Term card, $28, waits on SAVE’s ten business days from Monday 19 October to Monday 2 November 2026,
  // and runs to the program’s end, 31 May 2029', when it came on SAVE's day, unmailed.
  it('PLAYER JOURNEY: a British student’s Limited Term card, $28, waits on SAVE’s ten business days from Monday 19 October to Monday 2 November 2026, then comes by mail twenty business days on, Wednesday 2 December, and runs to the program’s end, 31 May 2029', () => {
    const sim = life('g15-save', 'uk-eng-london');
    tended(sim, at(2026, 9, 8, 19));
    sim.must({ kind: 'documents.apply_ssn', payload: {} });
    expect(sim.execute(APPLY_ID).error).toBe('The DMV asks for your Social Security number, or the SSA’s letter that you can’t have one. Yours is on its way.');
    // Monday 19 October 2026, 10 AM in New Haven: the number has come.
    const applied = Date.UTC(2026, 9, 19, 14);
    tended(sim, applied);
    expect(sim.player.ssn?.status).toBe('issued');
    const before = checking(sim).balance;
    const r = sim.must<{ expiresAt: number; fee: number; readyAt: number }>(APPLY_ID);
    expect(before - checking(sim).balance).toBe(28_00);
    // Ten weekdays on, counted here: 20, 21, 22, 23, 26, 27, 28, 29, 30 October and 2 November, SAVE's approval; then the
    // mail's twenty business days (from 2026-10-17: until then the card came that Monday): 3 to 6, 9, 10, 12, 13, 16 to
    // 20, 23 to 25, 27 and 30 November, 1 and 2 December, Veterans Day and Thanksgiving not among them.
    const decided = Date.UTC(2026, 10, 2, 14);
    const comes = Date.UTC(2026, 11, 2, 14);
    // The program's end: the class of 2029's last day at the School, 31 May 2029, its F-1 running 60 days past it.
    expect(r).toEqual({ fee: 28_00, readyAt: comes, expiresAt: Date.UTC(2029, 4, 31, 12) });
    expect(held(sim, 'idcard')).toEqual([expect.objectContaining({ name: 'Non-Driver Identification Card, Limited Term', status: 'pending', appliedAt: applied, readyAt: comes, expiresAt: Date.UTC(2029, 4, 31, 12) })]);
    expect(sim.execute(APPLY_ID).error).toBe('One is on its way.');
    // Saved and loaded while SAVE decides: past its approval it's still in the mail, and it comes once, on its day.
    tended(sim, Date.UTC(2026, 9, 26, 14));
    const back = reload(sim);
    tended(back, decided + MS_HOUR);
    expect(held(back, 'idcard')[0]!.status).toBe('pending');
    tended(back, comes - MS_HOUR);
    expect(held(back, 'idcard')[0]!.status).toBe('pending');
    tended(back, comes + MS_HOUR);
    expect(held(back, 'idcard')).toEqual([expect.objectContaining({ status: 'valid', issuedAt: comes, expiresAt: Date.UTC(2029, 4, 31, 12) })]);
    expect(titled(back, 'Non-Driver Identification Card, Limited Term Arrived')).toHaveLength(1);
    expect(memos(back, 'Non-Driver Identification Card').map((t) => taken(back, t))).toEqual([28_00]);
    expect(back.execute(APPLY_ID).error).toBe('You hold one in force.');
  });

  // Renamed on 2026-10-17 (brief 11's KS-ct-idcard, inputs/renames.json): until then 'on Passport And ID, Get Non-Driver
  // Identification Card pressed says “$28.00; good until August 24, 2032”, lists the card, and is then shut with the
  // reason; a Connecticut license holder sees why it is shut', when the card was in force at once for six years.
  it('on Passport And ID, Get Non-Driver Identification Card pressed says “$28.00; the card comes September 22, 2026; good until June 14, 2034”, lists the card Being Decided and then In Force, and is shut with the reason each time; a Connecticut license holder sees why it is shut', () => {
    const sim = life('g15-idcard-ui');
    const first = papers(sim, 'passport');
    expect(first.text).toContain('Your ID Non-Driver Identification Card');
    const get = button(first, 'Get Non-Driver Identification Card');
    expect(get).toMatchObject({ feature: 'documents.apply_idcard', disabled: false });
    const before = checking(sim).balance;
    expect(press(get)).toEqual(['Non-Driver Identification Card, for $28.00; the card comes September 22, 2026; good until June 14, 2034.']);
    expect(before - checking(sim).balance).toBe(28_00);
    const after = papers(sim, 'passport');
    expect(button(after, 'Get Non-Driver Identification Card')).toMatchObject({ disabled: true, title: 'One is on its way.' });
    expect(after.text).toMatch(/Non-Driver Identification Card ID\d{8} — June 14, 2034 Being Decided/);
    tended(sim, COMES + MS_HOUR);
    const come = papers(sim, 'passport');
    expect(button(come, 'Get Non-Driver Identification Card')).toMatchObject({ disabled: true, title: 'You hold one in force.' });
    expect(come.text).toMatch(/Non-Driver Identification Card ID\d{8} September 22, 2026 June 14, 2034 In Force/);
    const ct = papers(life('g15-ct', 'us-ct-newhaven'), 'passport');
    expect(button(ct, 'Get Non-Driver Identification Card')).toMatchObject({ disabled: true, title: 'You hold a license here. It serves as your ID.' });
  });
});

// ---------------------------------------------------------------------------
// documents.apply_opt
// ---------------------------------------------------------------------------

describe('documents.apply_opt', () => {
  it('PLAYER JOURNEY: applied for 40 days into the grace, $470 leaves the bank, the pending application holds her status past the grace’s end, OPT runs a year from its approval 90 days on, and ends on its 91st day without work', () => {
    const sim = life('g15-opt', 'uk-eng-london');
    graduated(sim, 40);
    const before = checking(sim).balance;
    const r = sim.must<{ readyAt: number; fee: number }>(APPLY_OPT);
    // USCIS's $470 for Form I-765 filed by mail, and SLATE's 90 days for a standard decision.
    expect(before - checking(sim).balance).toBe(470_00);
    expect(memos(sim, 'Form I-765, (c)(3)(B), OPT').map((t) => taken(sim, t))).toEqual([470_00]);
    expect(r).toEqual({ fee: 470_00, readyAt: START + 90 * MS_DAY });
    expect(held(sim, 'permit')).toEqual([expect.objectContaining({ name: 'Employment Authorization, OPT', status: 'pending' })]);
    expect(sim.execute(APPLY_OPT).error).toBe('You’ve applied for OPT already.');
    // The grace after the program ended 40 days ago ends in 20; five days past it, the application holds her status.
    tended(sim, START + 25 * MS_DAY);
    expect(sim.player.usOutOfStatus).toBeUndefined();
    expect(titled(sim, 'Out Of Status')).toEqual([]);
    expect(held(sim, 'visa')).toEqual([expect.objectContaining({ name: 'F-1 Student Visa', status: 'valid' })]);
    // Saved and loaded while it's decided: the window shut behind it, charged once, approved once.
    const back = reload(sim);
    expect(back.execute(APPLY_OPT).error).toBe('It closed September 13, 2026, 60 days after the program ended.');
    tended(back, START + 90 * MS_DAY + MS_HOUR);
    const opt = held(back, 'permit')[0]!;
    expect(opt).toMatchObject({ status: 'valid', issuedAt: START + 90 * MS_DAY, expiresAt: Date.UTC(2027, 10, 22, 11, 30) });
    expect(titled(back, 'OPT Approved').map((n) => n.body)).toEqual(['You may work in the United States from November 22, 2026 to November 22, 2027, with no more than 90 days between jobs in all.']);
    expect(back.player.usOutOfStatus).toBeUndefined();
    expect(memos(back, /OPT/).map((t) => taken(back, t))).toEqual([470_00]);
    // No work after the degree: thirteen weeks idle is 91 days, past OPT's 90, and the status ends with it, no grace.
    tended(back, START + (90 + 92) * MS_DAY);
    expect(opt).toMatchObject({ status: 'cancelled', endedAt: START + (90 + 91) * MS_DAY });
    expect(back.player.usOutOfStatus).toBe(START + (90 + 91) * MS_DAY);
    expect(titled(back, 'Out Of Status')).toHaveLength(1);
  });

  it('PLAYER JOURNEY: the status’s ending, raised by the clock on the program’s last day, offers OPT standard then premium; taking the first files OPT at $470 with no premium, and answers it', () => {
    const sim = life('g15-opt-decision', 'uk-eng-london');
    graduated(sim, -1);
    tended(sim, START + MS_DAY + MS_HOUR);
    const d = Object.values(sim.universe.decisions).find((x) => x.refType === 'us-status' && !x.resolvedAt)!;
    expect(d.title).toBe('Your US Status Is Ending');
    // The program's end tomorrow and its 60 days' grace: 24 October 2026.
    expect(d.detail).toContain('your status ends October 24, 2026. OPT can still be applied for before then.');
    expect(d.actions.map((a) => [a.label, a.commandKind, a.payload])).toEqual([['Apply For OPT', 'documents.apply_opt', {}], ['Apply For OPT, Premium Processing', 'documents.apply_opt', { premium: true }]]);
    const before = checking(sim).balance;
    const now = sim.now;
    sim.must({ kind: 'world.take_decision_action', payload: { decisionId: d.id, actionIndex: 0 } });
    expect(before - checking(sim).balance).toBe(470_00);
    expect(memos(sim, /premium/i)).toEqual([]);
    expect(held(sim, 'permit')).toEqual([expect.objectContaining({ name: 'Employment Authorization, OPT', status: 'pending', readyAt: now + 90 * MS_DAY })]);
    expect(d.resolvedAt).toBe(now);
  });

  it('with premium processing, $2,250 leaves the bank and it is decided on the thirtieth business day, Tuesday 30 March 2027, not before', () => {
    const sim = life('g15-opt-premium', 'uk-eng-london');
    // Tuesday 16 February 2027, 10 AM in New Haven, the day after Presidents' Day: no federal holiday in the next six weeks.
    const applied = Date.UTC(2027, 1, 16, 15);
    tended(sim, applied);
    expect(['good', 'concern', 'warning']).toContain(sim.player.school!.standing);
    graduated(sim, 10);
    const before = checking(sim).balance;
    const r = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
    // $470 and USCIS's $1,780 premium processing fee.
    expect(before - checking(sim).balance).toBe(2_250_00);
    expect(memos(sim, 'Form I-765, (c)(3)(B), OPT, premium processing').map((t) => taken(sim, t))).toEqual([2_250_00]);
    // Thirty weekdays, counted here: 8 in February (17th to 26th), 22 in March (1st to 30th).
    const decided = Date.UTC(2027, 2, 30, 15);
    expect(r).toEqual({ fee: 2_250_00, readyAt: decided });
    tended(sim, decided - MS_HOUR);
    expect(held(sim, 'permit')[0]!.status).toBe('pending');
    tended(sim, decided + MS_HOUR);
    expect(held(sim, 'permit')).toEqual([expect.objectContaining({ status: 'valid', issuedAt: decided })]);
  });

  it('refuses in their own words a citizen, a first-year before the window, a student who withdrew, a window closed, and a bank short of $470, charging nothing and filing nothing', () => {
    const refused = (sim: Simulation, error: string) => {
      const before = checking(sim).balance;
      expect(sim.execute(APPLY_OPT).error).toBe(error);
      expect(held(sim, 'permit')).toEqual([]);
      expect(checking(sim).balance).toBe(before);
    };
    refused(life('g15-opt-citizen'), 'OPT is for a student on an F-1; you’re a citizen.');
    // The class of 2029's program ends 31 May 2029; its window opens 90 days before.
    refused(life('g15-opt-early', 'uk-eng-london'), 'It opens March 2, 2029, 90 days before the program ends.');
    const left = life('g15-opt-left', 'uk-eng-london');
    left.must({ kind: 'school.withdraw', payload: { confirm: true } });
    refused(left, 'OPT follows a degree completed, and you left without it.');
    const late = life('g15-opt-late', 'uk-eng-london');
    graduated(late, 61);
    refused(late, 'It closed August 23, 2026, 60 days after the program ended.');
    const poor = life('g15-opt-poor', 'uk-eng-london');
    graduated(poor, 40);
    broke(poor);
    refused(poor, '$470.00 is more than the bank can cover.');
  });

  it('on Permission To Work, the OPT panel says its fees and Apply For OPT pressed says $470.00 and its day; the status then reads Held while it’s decided, and both buttons are shut with the reason', () => {
    const sim = life('g15-opt-ui', 'uk-eng-london');
    graduated(sim, 40);
    const first = papers(sim, 'work');
    expect(first.text).toContain('Your Program Ends July 15, 2026');
    expect(first.text).toContain('Your US Status Ends September 13, 2026 With its grace after permission ends');
    expect(first.text).toContain('Up to twelve months to work in your field, from the later of the program’s end and the approval');
    expect(first.text).toContain('$470.00; premium processing adds $1,780.00 and decides it in 30 business days.');
    expect(button(first, 'Apply With Premium Processing')).toMatchObject({ feature: 'documents.apply_opt', disabled: false });
    expect(press(button(first, 'Apply For OPT'))).toEqual(['Applied for OPT, for $470.00. Decided by November 22, 2026.']);
    const after = papers(sim, 'work');
    expect(after.text).toContain('Your US Status Held While you study, or while an application is decided');
    expect(after.text).toContain('Employment Authorization, OPT');
    expect(after.text).toContain('Ready November 22, 2026 Being Decided');
    for (const words of ['Apply For OPT', 'Apply With Premium Processing']) expect(button(after, words)).toMatchObject({ disabled: true, title: 'You’ve applied for OPT already.' });
    expect(memos(sim, /OPT/).map((t) => taken(sim, t))).toEqual([470_00]);
  });
});

// ---------------------------------------------------------------------------
// documents.replace_idcard
// ---------------------------------------------------------------------------

describe('documents.replace_idcard', () => {
  it('PLAYER JOURNEY: a stolen card replaced for $30 with a new number; Citi turns her away while it’s on its way, 30 days, and takes it once it has come, across a save and a load', () => {
    const sim = life('g15-replace-id');
    // Her card comes by mail on Tuesday 22 September (from 2026-10-17: until then it was in force at once, on START).
    const got = sim.must<{ readyAt: number }>(APPLY_ID).readyAt;
    tended(sim, got + MS_HOUR);
    const NOW = got + MS_HOUR;
    const card = held(sim, 'idcard')[0]!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id, stolen: true } });
    sim.must({ kind: 'documents.police_report', payload: { documentId: card.id } });
    for (const d of documentsOf(sim.player).filter((x) => x.status === 'valid')) sim.must({ kind: 'documents.report_lost', payload: { documentId: d.id } });
    const before = checking(sim).balance;
    const r = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.replace_idcard', payload: { documentId: card.id } });
    // Connecticut's duplicate non-driver ID, $30, within 30 days (portal.ct.gov).
    expect(before - checking(sim).balance).toBe(30_00);
    expect(memos(sim, 'Non-Driver Identification Card, replaced').map((t) => taken(sim, t))).toEqual([30_00]);
    expect(r).toEqual({ fee: 30_00, readyAt: NOW + 30 * MS_DAY });
    expect(card).toMatchObject({ status: 'cancelled', stolen: true, policeReport: NOW });
    const copy = held(sim, 'idcard').find((d) => d.id !== card.id)!;
    expect(copy).toMatchObject({ status: 'pending', issuer: 'us-ct', readyAt: NOW + 30 * MS_DAY, expiresAt: card.expiresAt });
    expect(copy.number).not.toBe(card.number);
    expect([copy.stolen, copy.policeReport]).toEqual([undefined, undefined]);
    expect(openAtCiti(sim).error).toBe(CITI_REFUSES);
    // The old card again, and a card applied for meanwhile: each refused in its words.
    expect(sim.execute({ kind: 'documents.replace_idcard', payload: { documentId: card.id } }).error).toBe('It isn’t lost: report it lost first.');
    expect(sim.execute(APPLY_ID).error).toBe('One is on its way.');
    const back = reload(sim);
    tended(back, NOW + 30 * MS_DAY - MS_HOUR);
    expect(openAtCiti(back).error).toBe(CITI_REFUSES);
    tended(back, NOW + 30 * MS_DAY + MS_HOUR);
    expect(held(back, 'idcard').map((d) => [d.status, d.issuedAt])).toEqual([['cancelled', got], ['valid', NOW + 30 * MS_DAY]]);
    expect(titled(back, 'Non-Driver Identification Card Arrived')).toHaveLength(1);
    expect(memos(back, /, replaced$/).map((t) => taken(back, t))).toEqual([30_00]);
    const opened = openAtCiti(back);
    expect(opened.ok, opened.error).toBe(true);
  });

  it('refuses a lost New York card in New Haven: “It’s replaced where it was issued, for someone living there.”', () => {
    const sim = life('g15-replace-ny');
    // TEST SETUP: a New York non-driver ID, reported lost, on a New Haven student's record: no life there comes to hold one.
    documentsOf(sim.player).push({ id: 'ny-card', kind: 'idcard', issuer: 'us-ny', name: 'Non-Driver ID Card', number: 'ID00000001', status: 'lost', issuedAt: START - 400 * MS_DAY, expiresAt: START + 2_000 * MS_DAY });
    const before = checking(sim).balance;
    expect(sim.execute({ kind: 'documents.replace_idcard', payload: { documentId: 'ny-card' } }).error).toBe('It’s replaced where it was issued, for someone living there.');
    expect(held(sim, 'idcard').map((d) => d.status)).toEqual(['lost']);
    expect(checking(sim).balance).toBe(before);
  });

  it('refuses when the bank can’t cover $30, charging nothing and leaving the card lost', () => {
    const sim = life('g15-replace-broke');
    tended(sim, sim.must<{ readyAt: number }>(APPLY_ID).readyAt + MS_HOUR);
    const card = held(sim, 'idcard')[0]!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id } });
    broke(sim);
    expect(sim.execute({ kind: 'documents.replace_idcard', payload: { documentId: card.id } }).error).toBe('$30.00 is more than the bank can cover.');
    expect(held(sim, 'idcard').map((d) => d.status)).toEqual(['lost']);
    expect(memos(sim, /, replaced$/)).toEqual([]);
  });

  it('on Passport And ID, a lost card’s row offers File A Police Report and Replace It, $30; pressed, it says the day it comes, and the row then reads Being Decided', () => {
    const sim = life('g15-replace-ui');
    // Come by mail on Tuesday 22 September, to 14 June 2034 (from 2026-10-17: until then in force at once, to 24 August 2032).
    tended(sim, sim.must<{ readyAt: number }>(APPLY_ID).readyAt + MS_HOUR);
    const card = held(sim, 'idcard')[0]!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id, stolen: true } });
    const first = papers(sim, 'passport');
    expect(first.text).toMatch(/Non-Driver Identification Card ID\d{8} September 22, 2026 June 14, 2034 Reported Lost/);
    expect(button(first, 'File A Police Report')).toMatchObject({ feature: 'documents.police_report', disabled: false, title: 'Online, free, and at once' });
    const replace = button(first, 'Replace It, $30');
    expect(replace).toMatchObject({ feature: 'documents.replace_idcard', disabled: false });
    expect(press(replace)).toEqual(['Replaced; the card comes October 22, 2026.']);
    const after = papers(sim, 'passport');
    expect(after.text).toMatch(/Non-Driver Identification Card ID\d{8} September 22, 2026 June 14, 2034 Being Decided/);
    expect(after.text).toMatch(/Non-Driver Identification Card ID\d{8} September 22, 2026 June 14, 2034 Canceled/);
    expect(after.buttons.filter((b) => b.feature === 'documents.replace_idcard')).toEqual([]);
    expect(button(after, 'Get Non-Driver Identification Card')).toMatchObject({ disabled: true, title: 'One is on its way.' });
  });
});

// ---------------------------------------------------------------------------
// documents.replace_license
// ---------------------------------------------------------------------------

describe('documents.replace_license', () => {
  it('PLAYER JOURNEY: a Connecticut-born student’s only photo ID, her license, lost and replaced for $30 in 30 days, its term and REAL ID kept; Citi takes it once it has come, and the DMV then refuses her an ID card', () => {
    const sim = life('g15-ct', 'us-ct-newhaven');
    // Her life began with a Connecticut license and nothing else: asserted, not guarded.
    const license = documentsOf(sim.player).find((d) => d.kind === 'license')!;
    expect(documentsOf(sim.player)).toEqual([expect.objectContaining({ kind: 'license', issuer: 'us-ct', status: 'valid' })]);
    sim.must({ kind: 'documents.report_lost', payload: { documentId: license.id } });
    expect(openAtCiti(sim).error).toBe(CITI_REFUSES);
    const before = checking(sim).balance;
    const r = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.replace_license', payload: { documentId: license.id } });
    // Connecticut DMV's duplicate license, $30, within 30 days.
    expect(before - checking(sim).balance).toBe(30_00);
    expect(memos(sim, /, replaced$/).map((t) => taken(sim, t))).toEqual([30_00]);
    expect(r).toEqual({ fee: 30_00, readyAt: START + 30 * MS_DAY });
    const copy = held(sim, 'license').find((d) => d.id !== license.id)!;
    expect(copy).toMatchObject({ status: 'pending', issuer: 'us-ct', expiresAt: license.expiresAt, realId: license.realId });
    expect(copy.number).not.toBe(license.number);
    expect(sim.execute({ kind: 'documents.replace_license', payload: { documentId: license.id } }).error).toBe('It isn’t lost: report it lost first.');
    const back = reload(sim);
    tended(back, START + 30 * MS_DAY - MS_HOUR);
    expect(openAtCiti(back).error).toBe(CITI_REFUSES);
    tended(back, START + 30 * MS_DAY + MS_HOUR);
    expect(held(back, 'license').map((d) => [d.status, d.issuedAt === START + 30 * MS_DAY])).toEqual([['cancelled', false], ['valid', true]]);
    expect(memos(back, /, replaced$/).map((t) => taken(back, t))).toEqual([30_00]);
    expect(back.execute(APPLY_ID).error).toBe('You hold a license here. It serves as your ID.');
    const opened = openAtCiti(back);
    expect(opened.ok, opened.error).toBe(true);
  });

  it('replaces a New Yorker’s license by mail (MV-44): lost, $17.50 leaves the bank; stolen with the police’s report, nothing does; each comes in 21 days', () => {
    const lost = life('g15-ny-license');
    const a = documentsOf(lost.player).find((d) => d.kind === 'license' && d.issuer === 'us-ny')!;
    lost.must({ kind: 'documents.report_lost', payload: { documentId: a.id } });
    const before = checking(lost).balance;
    expect(lost.must({ kind: 'documents.replace_license', payload: { documentId: a.id } })).toEqual({ fee: 17_50, readyAt: START + 21 * MS_DAY });
    expect(before - checking(lost).balance).toBe(17_50);
    const stolen = life('g15-ny-license');
    const b = documentsOf(stolen.player).find((d) => d.kind === 'license' && d.issuer === 'us-ny')!;
    stolen.must({ kind: 'documents.report_lost', payload: { documentId: b.id, stolen: true } });
    stolen.must({ kind: 'documents.police_report', payload: { documentId: b.id } });
    const kept = checking(stolen).balance;
    expect(stolen.must({ kind: 'documents.replace_license', payload: { documentId: b.id } })).toEqual({ fee: 0, readyAt: START + 21 * MS_DAY });
    expect(checking(stolen).balance).toBe(kept);
    expect(memos(stolen, /, replaced$/)).toEqual([]);
    tended(stolen, START + 21 * MS_DAY + MS_HOUR);
    expect(held(stolen, 'license').map((d) => d.status)).toEqual(['cancelled', 'valid']);
  });

  it('refuses a Californian at Yale through the command, in its words, and charges nothing', () => {
    const sim = life('g15-ca', 'us-ca-losangeles');
    const license = documentsOf(sim.player).find((d) => d.kind === 'license')!;
    expect(license).toMatchObject({ issuer: 'us-ca', status: 'valid' });
    sim.must({ kind: 'documents.report_lost', payload: { documentId: license.id } });
    const before = checking(sim).balance;
    expect(sim.execute({ kind: 'documents.replace_license', payload: { documentId: license.id } }).error).toBe('Its issuer replaces it for somebody living there, and SLATE found no way it sends one out of state.');
    expect(held(sim, 'license').map((d) => d.status)).toEqual(['lost']);
    expect(checking(sim).balance).toBe(before);
  });

  it('refuses when the bank can’t cover $30, charging nothing and leaving the license lost', () => {
    const sim = life('g15-ct', 'us-ct-newhaven');
    const license = held(sim, 'license')[0]!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: license.id } });
    broke(sim);
    expect(sim.execute({ kind: 'documents.replace_license', payload: { documentId: license.id } }).error).toBe('$30.00 is more than the bank can cover.');
    expect(held(sim, 'license').map((d) => d.status)).toEqual(['lost']);
  });

  it('on Passport And ID, a lost license offers Replace It at its fee and says the day it comes; a Californian’s says why not, its button shut', () => {
    const sim = life('g15-ct', 'us-ct-newhaven');
    const license = held(sim, 'license')[0]!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: license.id } });
    const replace = button(papers(sim, 'passport'), 'Replace It, $30.00');
    expect(replace).toMatchObject({ feature: 'documents.replace_license', disabled: false });
    expect(press(replace)).toEqual(['Replaced, for $30.00; the card comes September 23, 2026.']);
    expect(papers(sim, 'passport').text).toMatch(/Class D operator's license D\d{8} .+ June 14, 2028 Being Decided/);
    const ca = life('g15-ca', 'us-ca-losangeles');
    ca.must({ kind: 'documents.report_lost', payload: { documentId: held(ca, 'license')[0]!.id } });
    const shown = papers(ca, 'passport');
    expect(shown.text).toContain('Its issuer replaces it for somebody living there, and SLATE found no way it sends one out of state. Replace It');
    expect(button(shown, 'Replace It')).toMatchObject({ disabled: true, title: 'Its issuer replaces it for somebody living there, and SLATE found no way it sends one out of state.' });
  });
});

// ---------------------------------------------------------------------------
// documents.report_lost
// ---------------------------------------------------------------------------

describe('documents.report_lost', () => {
  it('PLAYER JOURNEY: a passport reported stolen and a license lost are marked as said; Citi turns her away through bank.open_current, and a second report is refused, across a save and a load', () => {
    const sim = life('g15-lost');
    const passport = held(sim, 'passport')[0]!;
    const license = held(sim, 'license')[0]!;
    expect(sim.must({ kind: 'documents.report_lost', payload: { documentId: passport.id, stolen: true } })).toEqual({ lost: true });
    sim.must({ kind: 'documents.report_lost', payload: { documentId: license.id } });
    expect(passport).toMatchObject({ status: 'lost', stolen: true });
    expect(license.status).toBe('lost');
    expect(license.stolen).toBeUndefined();
    expect(openAtCiti(sim).error).toBe(CITI_REFUSES);
    expect(sim.execute({ kind: 'documents.report_lost', payload: { documentId: passport.id } }).error).toBe('That isn’t a document you hold.');
    const back = reload(sim);
    expect(documentsOf(back.player).map((d) => [d.kind, d.status, d.stolen ?? false])).toEqual([['passport', 'lost', true], ['license', 'lost', false]]);
    expect(openAtCiti(back).error).toBe(CITI_REFUSES);
    expect(back.execute({ kind: 'documents.report_lost', payload: { documentId: license.id, stolen: true } }).error).toBe('That isn’t a document you hold.');
    // What reads a report: the police take one for a document reported lost.
    back.must({ kind: 'documents.police_report', payload: { documentId: passport.id } });
    expect(held(back, 'passport')[0]!.policeReport).toBe(START);
  });

  it('refuses a British student’s F-1 in its words, which holds; her passport reported lost leaves the F-1 in force', () => {
    const sim = life('g15-lost-f1', 'uk-eng-london');
    const f1 = held(sim, 'visa')[0]!;
    expect(sim.execute({ kind: 'documents.report_lost', payload: { documentId: f1.id } }).error).toBe('A status isn’t lost with its paper: it holds.');
    expect(f1.status).toBe('valid');
    sim.must({ kind: 'documents.report_lost', payload: { documentId: held(sim, 'passport')[0]!.id } });
    expect(f1.status).toBe('valid');
    tended(sim, START + 2 * MS_DAY);
    expect(sim.player.usOutOfStatus).toBeUndefined();
    expect(f1.status).toBe('valid');
  });

  it('on Passport And ID, Report Lost… and Report Stolen… show on the passport and the license; the confirm step says it is for good, and Cancel It reports it stolen', () => {
    // The life of the first ID card test, which begins with a passport and a New York license.
    const sim = life('g15-idcard');
    const first = papers(sim, 'passport');
    expect([count(first.text, 'Report Lost…'), count(first.text, 'Report Stolen…')]).toEqual([2, 2]);
    const passport = held(sim, 'passport')[0]!;
    // TEST SETUP: Report Stolen… pressed on the passport, given as the row's confirming state.
    const confirm = papers(sim, 'passport', { id: passport.id, stolen: true });
    expect(confirm.text).toContain('Reported stolen, it’s canceled for good, even if it turns up, with any visa or authorization issued on it (the F-1 status holds). Cancel It Keep It');
    expect([count(confirm.text, 'Report Lost…'), count(confirm.text, 'Report Stolen…')]).toEqual([1, 1]);
    const cancel = button(confirm, 'Cancel It');
    expect(cancel).toMatchObject({ feature: 'documents.report_lost', disabled: false });
    expect(press(cancel)).toEqual(['Passport reported stolen and canceled.']);
    expect(passport).toMatchObject({ status: 'lost', stolen: true });
    const after = papers(sim, 'passport');
    expect(after.text).toMatch(/U\.S\. Passport Book US\d{8} .+ Reported Lost File A Police Report/);
    expect([count(after.text, 'Report Lost…'), count(after.text, 'Report Stolen…')]).toEqual([1, 1]);
  });

  it('shows no Report Lost… on a status, the F-1 on either tab, nor on a license run out', () => {
    const uk = life('g15-lost-f1', 'uk-eng-london');
    const passportTab = papers(uk, 'passport');
    expect(passportTab.text).toContain('F-1 Student Visa');
    expect(count(passportTab.text, 'Report Lost…')).toBe(1);
    const work = papers(uk, 'work');
    expect(work.text).toContain('F-1 Student Visa');
    expect(count(work.text, 'Report Lost…')).toBe(0);
    const ny = life('g15-idcard');
    // TEST SETUP: the license's expiry moved to yesterday, as 22 months of play would bring it.
    held(ny, 'license')[0]!.expiresAt = START - MS_DAY;
    const shown = papers(ny, 'passport');
    expect(shown.text).toMatch(/driver license D\d{8} .+ August 23, 2026 Run Out/);
    expect(count(shown.text, 'Report Lost…')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// benefits.assistance
// ---------------------------------------------------------------------------

/** Each month's SNAP onto the EBT card, in order. */
const snapPaid = (sim: Simulation) => memos(sim, 'SNAP, the month, onto the EBT card').map((t) => [t.at, t.postings.find((p) => p.amount > 0)!.amount]);

describe('benefits.assistance', () => {
  it('PLAYER JOURNEY: applied for on her first morning, SNAP pays $298 on 31 August and 30 September and $306 on 30 October, September’s work-study counted as nothing; the next midnight’s groceries come off the EBT card first; each month once across a save and a load', () => {
    const sim = life('g15-snap');
    const r = sim.must<{ scheme: string; firstPaymentAt: number }>({ kind: 'benefits.assistance', payload: {} });
    expect(r).toEqual({ scheme: 'snap', firstPaymentAt: Date.UTC(2026, 7, 31, 11, 30) });
    expect(sim.execute({ kind: 'benefits.assistance', payload: {} }).error).toBe('You have a claim open.');
    tended(sim, Date.UTC(2026, 7, 31, 12, 30));
    // USDA's maximum allotment for one in fiscal 2026, $298: each month reads the calendar month before, and July, before
    // her life began, held nothing.
    expect(snapPaid(sim)).toEqual([[Date.UTC(2026, 7, 31, 11, 30), 298_00]]);
    const ebt = sim.universe.accounts[sim.player.assistance!.ebtAccountId!]!;
    expect(ebt).toMatchObject({ ownerId: sim.player.id, balance: 298_00 });
    // The day's groceries, bought at each midnight in New Haven (4 AM UTC): from the bank on 31 August, before the card.
    const window = (day: number) => (t: { at: number }) => t.at >= Date.UTC(2026, 7, day, 3) && t.at < Date.UTC(2026, 7, day, 5);
    const day = memos(sim, 'Groceries').filter(window(31)).map((t) => taken(sim, t));
    expect(day).toHaveLength(1);
    expect(day[0]).toBeGreaterThan(0);
    tended(sim, Date.UTC(2026, 8, 1, 5));
    // On 1 September the same day's groceries come off the EBT card, and nothing from the bank.
    expect(memos(sim, 'Groceries, on the EBT card').map((t) => [t.at, -t.postings.find((p) => p.accountId === ebt.id)!.amount])).toEqual([[Date.UTC(2026, 8, 1, 4), day[0]]]);
    expect(memos(sim, 'Groceries', Date.UTC(2026, 8, 1, 3))).toEqual([]);
    expect(ebt.balance).toBe(298_00 - day[0]!);
    tended(sim, Date.UTC(2026, 8, 15, 12));
    const back = reload(sim);
    tended(back, Date.UTC(2026, 9, 30, 12, 30));
    // September's work-study wages, from the ledger: three Fridays' 6 hours, $414, which the 30 October payment reads and
    // counts as nothing (7 CFR 273.9(c)(3)); counted as earnings, (41,739 − 8,280 − 21,700) × 30% would take $35.28 off
    // it, on the month's $417.39 with the 20% earned deduction and $217 standard. On 30 September, August's 79
    // cents of interest was under the $209 standard deduction.
    const september = memos(back, /^Work-study wages/).filter((t) => t.at >= Date.UTC(2026, 8, 1) && t.at < Date.UTC(2026, 9, 1));
    expect(september.map((t) => -taken(back, t)).reduce((a, b) => a + b, 0)).toBe(414_00);
    // Fiscal 2027's maximum from 1 October, $306.
    expect(snapPaid(back)).toEqual([[Date.UTC(2026, 7, 31, 11, 30), 298_00], [Date.UTC(2026, 8, 30, 11, 30), 298_00], [Date.UTC(2026, 9, 30, 11, 30), 306_00]]);
    expect(back.player.assistance).toMatchObject({ scheme: 'snap', months: 3 });
  });

  it('closes the case in the summer recess without 20 hours of work a week, says so once, and refuses a new application under 7 CFR 273.5', () => {
    const sim = life('g15-snap');
    sim.must({ kind: 'benefits.assistance', payload: {} });
    tended(sim, Date.UTC(2027, 5, 2, 12));
    // Nine months paid, 31 August to 28 April; the tenth falls on 28 May, two weeks into the recess.
    expect(snapPaid(sim).map(([, amount]) => amount)).toEqual([298_00, 298_00, 306_00, 306_00, 306_00, 306_00, 306_00, 306_00, 306_00]);
    expect(sim.player.assistance).toMatchObject({ months: 9, closedAt: Date.UTC(2027, 4, 28, 11, 30) });
    expect(titled(sim, 'Your SNAP Case Closed').map((n) => [n.at, n.body])).toEqual([[Date.UTC(2027, 4, 28, 11, 30), 'A student in the summer without work-study or 20 hours of work a week isn’t eligible for SNAP (7 CFR 273.5). Apply again once that changes.']]);
    expect(sim.execute({ kind: 'benefits.assistance', payload: {} }).error).toMatch(/7 CFR 273\.5\)\.$/);
  });

  it('on quick lives in Toronto and Vancouver, which no New Haven life reaches: Ontario Works pays CAD 343 six days on and BC’s Income Assistance CAD 560 after three weeks’ work search, each again a month on; over CAD 10,000 in the bank, Ontario Works is refused', () => {
    // A Canadian with next to nothing (`wealth: 'nothing'`), where a new life at Yale can't live: quickSave, as the row
    // is about a province. Ontario Works' basic needs for a single adult, $343 (O. Reg. 134/98); BC's support for a
    // single adult, $560; no shelter counted, the home having gone on 2026-10-09.
    for (const [city, seed, memo, monthly, days] of [['ca-on-toronto', 'g15-ow', 'Ontario Works, the month', 343_00, 6], ['ca-bc-vancouver', 'g15-bc', 'Income assistance, the month', 560_00, 21]] as const) {
      const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'nothing' }, seed);
      const applied = sim.now;
      const r = sim.must<{ scheme: string; firstPaymentAt: number }>({ kind: 'benefits.assistance', payload: {} });
      expect(r.firstPaymentAt - applied).toBe(days * MS_DAY);
      expect(sim.execute({ kind: 'benefits.assistance', payload: {} }).error).toBe('You have a claim open.');
      sim.advanceTo(applied + (days + 30) * MS_DAY + MS_HOUR);
      // Into her own bank, what came to her: once a month, and nothing more.
      expect(memos(sim, memo).map((t) => [t.at, -taken(sim, t)])).toEqual([[applied + days * MS_DAY, monthly], [applied + (days + 30) * MS_DAY, monthly]]);
      expect(sim.player.assistance).toMatchObject({ months: 2 });
    }
    const comfortable = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'comfortable' }, 'g15-ow-rich');
    expect(comfortable.execute({ kind: 'benefits.assistance', payload: {} }).error).toBe('Ontario Works asks liquid assets under CAD 10,000.');
    expect(comfortable.player.assistance).toBeUndefined();
  });

  it('on Unemployment, the SNAP panel’s Apply pressed says the day the first month comes, and the panel then reads the claim open and the card’s $298', () => {
    const sim = life('g15-snap-ui');
    const first = papers(sim, 'benefits');
    expect(first.text).toContain('SNAP Food assistance, onto an EBT card for groceries Apply');
    expect(first.text).toContain('Claim None Open You can apply now At Most $298.00 A month, less 30% of net income On The EBT Card $0.00');
    const apply = button(first, 'Apply');
    expect(apply.feature).toBe('benefits.assistance');
    expect(press(apply)).toEqual(['Applied. The first month comes August 31, 2026.']);
    tended(sim, Date.UTC(2026, 7, 31, 12, 30));
    const after = papers(sim, 'benefits');
    expect(after.text).toContain('Claim Open Since August 24, 2026, 1 month paid');
    expect(after.text).toContain('On The EBT Card $298.00');
    expect(after.buttons.filter((b) => b.feature === 'benefits.assistance')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// benefits.claim
// ---------------------------------------------------------------------------

/**
 * A first year played, the Summer Cabaret's company joined in the spring and its Fridays paid by the clock, a withdrawal
 * on Wednesday 8 September 2027, and the clock to Monday 3 January 2028 at noon. TEST SETUP: good standing before
 * joining, which the company asks and a passive spring doesn't keep.
 */
function leftAfterTheSummer(seed: string, home = 'us-ny-newyork'): Simulation {
  const sim = life(seed, home);
  tended(sim, at(2027, 3, 20));
  sim.player.school!.standing = 'good';
  sim.must({ kind: 'school.summer_cabaret', payload: {} });
  tended(sim, at(2027, 9, 8));
  sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
  tended(sim, at(2028, 1, 3));
  return sim;
}
const benefitPaid = (sim: Simulation) => memos(sim, /^Unemployment insurance/).map((t) => [t.at, -taken(sim, t)]);
/** Each Sunday at 8 PM in New Haven, as UTC: 9, 16, 23 and 30 January 2028 (EST, UTC−5). */
const SUNDAY = [Date.UTC(2028, 0, 10, 1), Date.UTC(2028, 0, 17, 1), Date.UTC(2028, 0, 24, 1), Date.UTC(2028, 0, 31, 1)];

describe('benefits.claim', () => {
  it('PLAYER JOURNEY: a summer’s stipends earned and school left, File A Claim on 3 January 2028 pays Connecticut’s $93 on the first Sunday with no waiting week, 26 weeks to $2,418 once each across a save and a load, and the 2028 return counts it', () => {
    const sim = leftAfterTheSummer('g15-claim');
    // Thirteen Fridays of the company's $375, 4 June to 27 August 2027, paid by the clock.
    expect(memos(sim, /^Yale Summer Cabaret stipend/).map((t) => -t.postings.find((p) => sim.universe.accounts[p.accountId]?.ownerId !== sim.player.id && p.amount < 0)!.amount)).toEqual(Array(13).fill(375_00));
    // CGS 31-231a: the two best quarters' average over 26, to the dollar: June's 4 × $375 and July to September's 9 × $375,
    // (1,500 + 3,375) / 2 / 26 = 93.75, so $93; 40 times it, $3,720, is under the base period's $4,875; 26 weeks, $2,418.
    const first = papers(sim, 'benefits');
    expect(first.text).toContain('No Claim Open File A Claim How This Works Filed now, your base period, 2026-4, 2027-1, 2027-2, 2027-3, pays $93.00 a week for up to 26 weeks.');
    const twin = reload(sim);
    expect(press(button(first, 'File A Claim'))).toEqual(['Filed: $93.00 a week.']);
    expect(unemploymentOf(sim.player).claim).toMatchObject({ state: 'ct', weekly: 93_00, maxTotal: 2_418_00, basePeriod: ['2026-4', '2027-1', '2027-2', '2027-3'] });
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).error).toBe('You have a claim open.');
    const filed = papers(sim, 'benefits');
    expect(filed.text).toContain('A Connecticut Claim Filed January 3, 2028 How This Works A Week $93.00 Connecticut has no waiting week Paid $0.00 Of $2,418.00 at most At Most $2,418.00 Until January 2, 2029');
    tended(sim, SUNDAY[0]! + MS_HOUR);
    expect(benefitPaid(sim)).toEqual([[SUNDAY[0], 93_00]]);
    expect(titled(sim, 'Your Waiting Week')).toEqual([]);
    expect(yearOf(sim.player, 2028).unemployment).toBe(93_00);
    const back = reload(sim);
    tended(back, Date.UTC(2029, 0, 31, 12));
    const weeks = benefitPaid(back);
    expect(weeks).toHaveLength(26);
    expect(weeks.every(([, amount]) => amount === 93_00)).toBe(true);
    expect(new Set(weeks.map(([when]) => when)).size).toBe(26);
    expect(titled(back, 'Your Unemployment Claim Ended').map((n) => n.body)).toEqual(['The claim has paid all it can: $2,418.00.']);
    // TEST SETUP: $20,000 of 2028 wages in New Haven given both, so the year has a return; the twin never claimed.
    tended(twin, Date.UTC(2029, 0, 31, 12));
    for (const one of [back, twin]) {
      recordWages(one.player, at(2028, 12, 15), NY, { gross: 20_000_00, employer: 'test-setup' });
      tended(one, at(2029, 2, 2));
      one.must({ kind: 'tax.file', payload: { year: 2028 } });
    }
    const mine = returnsOf(back.player)['2028']!.figures;
    const theirs = returnsOf(twin.player)['2028']!.figures;
    expect([mine.unemployment, theirs.unemployment]).toEqual([2_418_00, 0]);
    expect(mine.income - theirs.income).toBe(2_418_00);
    expect(mine.federal).toBeGreaterThan(theirs.federal);
  }, 60_000);

  it('pays nothing for a week certified in hospital, nor for one laid up, the next week whole, and a week with three hours worked, $69, $93 less two-thirds of it, $47', () => {
    const sim = leftAfterTheSummer('g15-claim');
    sim.must({ kind: 'benefits.claim', payload: {} });
    tended(sim, SUNDAY[0]! + MS_HOUR);
    expect(benefitPaid(sim)).toEqual([[SUNDAY[0], 93_00]]);
    // TEST SETUP: in hospital over the second Sunday's certification.
    healthOf(sim.player).inHospitalUntil = SUNDAY[1]! + MS_HOUR;
    tended(sim, SUNDAY[1]! + 2 * MS_HOUR);
    expect(benefitPaid(sim)).toHaveLength(1);
    // TEST SETUP: a concussion that keeps her off work over the third.
    healthOf(sim.player).injury = { kind: 'concussion', at: SUNDAY[1]! + 2 * MS_HOUR, until: SUNDAY[2]! + 5 * MS_DAY, offWorkUntil: SUNDAY[2]! + MS_HOUR };
    tended(sim, SUNDAY[2]! + 2 * MS_HOUR);
    expect(benefitPaid(sim)).toHaveLength(1);
    tended(sim, SUNDAY[3]! + MS_HOUR);
    expect(benefitPaid(sim)).toEqual([[SUNDAY[0], 93_00], [SUNDAY[3], 93_00]]);
    // TEST SETUP: three hours worked on Wednesday evening of the fifth week, $23 an hour, kept on the calendar as the
    // School keeps a shift worked; there’s no work after school to earn it since the career went. Connecticut takes
    // two-thirds of the week’s earnings off the benefit (CGS 31-229, as CONNECTICUT_UI keeps it): $93 − $46 = $47. Until
    // 2026-10-13 this posted $60 of pay to the ledger, which the week read as its earnings, and it paid $53; a week
    // reads the work done in it now (`workDoneIn`), and a payment is no work.
    const shift = sim.schedule({ at: Date.UTC(2028, 1, 3, 0), kind: SHIFT_KIND, label: 'Elective Shift: Front Of House, Yale Rep', category: 'school', payload: { personId: sim.player.id, hours: 3, elective: true, worked: 3 } });
    Object.assign(shift, { status: 'done', resolvedAt: shift.at });
    const fifth = Date.UTC(2028, 1, 7, 1);
    tended(sim, fifth + MS_HOUR);
    expect(benefitPaid(sim)).toEqual([[SUNDAY[0], 93_00], [SUNDAY[3], 93_00], [fifth, 47_00]]);
    expect(unemploymentOf(sim.player).claim).toMatchObject({ paid: 233_00, weekly: 93_00 });
  }, 60_000);

  it('refuses a British student out of status in FUTA’s words, with a base period that would pay, and Unemployment says so with no button', () => {
    const sim = leftAfterTheSummer('g15-claim', 'uk-eng-london');
    // Withdrawn on 8 September 2027, her fifteen days ran out on the 23rd.
    expect(sim.player.usOutOfStatus).toBe(at(2027, 9, 8) + 15 * MS_DAY);
    expect(memos(sim, /^Yale Summer Cabaret stipend/)).toHaveLength(13);
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).error).toBe('Unemployment pays a noncitizen only with permission to work in the US, such as OPT (FUTA 3304(a)(14)).');
    expect(unemploymentOf(sim.player).claim).toBeUndefined();
    const shown = papers(sim, 'benefits');
    expect(shown.text).toContain('No Claim Open How This Works Unemployment pays a noncitizen only with permission to work in the US, such as OPT (FUTA 3304(a)(14)).');
    expect(shown.buttons.filter((b) => b.feature === 'benefits.claim')).toEqual([]);
  }, 60_000);
});
