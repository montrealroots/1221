/**
 * The third round of 2026-10-13’s fixes, for the Papers and day items it gave one fixer (defects 50, 51, 52, 53, 67 and
 * 70, and the second round’s loose ends L1, L2, L4 and L7). Most are held where their rows are, in the files that held
 * the defect and were corrected with it: tests/evidence2-b06.test.ts (Your US Status on OPT, Covered Connecticut out of
 * status, SNAP on a claim and to the dollar), tests/evidence-g16-papers.test.ts, tests/assistance.test.ts,
 * tests/evidence-g32-ui.test.ts (a plan missed elsewhere, on its own clock), tests/evidence-g03-life.test.ts (a
 * prescription’s renewal booked over a visit owed) and tests/evidence-g34-ui.test.ts (the undated rule, labelled, until it went on 2026-10-14). What
 * those don’t reach is here, each failing before its fix:
 *
 * - `documents.us_status`: Covered Connecticut begun before the status ends is ended with the month too, and the notice
 *   when her cover ends offers no marketplace to somebody it would refuse.
 * - `documents.apply_idcard`: SAVE’s ten days are federal workdays, Veterans Day not among them (and from 2026-10-17
 *   the card then comes by mail twenty business days on, Thanksgiving not among them: until then on SAVE’s tenth).
 * - `documents.replace_license` and `documents.replace_idcard`: a card past its date, or past it before a new one would
 *   come, isn’t replaced, refused in words on Papers and through the command; a twin that asks in time is.
 * - What Needs You: every question a played life is asked carries a date, so the guide no longer gives a rule for one
 *   without; and the Papers entry says tax owed grows only past its return’s due date, as Home’s alert does.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven from Monday
 * 24 August 2026, born in London (on an F-1) or in New York on 1 October 2000, a birthday creation’s fields offer, which
 * puts her New York license’s eight years at their end on 1 October 2026. A life in Dublin, where a New Haven life never
 * lives, is a `quickSave` life born in 1980, the seed chosen for a passport book that runs out on 28 February 2026, so
 * the passport card it carries does too. Screens are rendered as the player has them (react-dom/server), `useGame`’s
 * `run` being the save’s own `execute`; a pressed button is the component’s own onClick.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { coverOn, healthOf } from '@/engine/systems/health';
import { DAY } from '@/engine/content/guide/day';
import { PAPERS } from '@/engine/content/guide/papers';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  buttons: [] as { text: string; disabled?: boolean; title?: string; onClick?: () => void }[],
  toasts: [] as string[],
}));

/** Every button the screens draw, with its words, whether it’s grayed out, its title, and its own onClick. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepButtons = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, title: props.title as string | undefined, onClick: props.onClick as (() => void) | undefined });
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

// Without the original: it imports the looks, which import it back. `run` is the save’s own execute.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { PassportPane } = await import('@/ui/papers/Documents');

const NY = 'America/New_York';
const DUBLIN = 'Europe/Dublin';
/** An hour of a day on a town’s clock. */
const on = (year: number, month: number, day: number, hour = 12, minute = 0, zone = NY): number => instantFromZoned({ year, month, day, hour, minute }, zone);
const student = (seed: string, home = 'us-ny-newyork', extra: Record<string, unknown> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: home, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra } as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload });
const replaced = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo.endsWith(', replaced'));

/** What the player reads: the markup with every title attribute taken out, then every tag, its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** A screen as the player has it. */
function drawn(sim: Simulation, screen: FunctionComponent) {
  h.sim = sim;
  h.buttons = [];
  h.toasts = [];
  const html = renderToStaticMarkup(createElement(screen));
  const buttons = [...h.buttons];
  const button = (words: string) => {
    const found = buttons.filter((x) => x.text === words);
    expect(found, `one button reading “${words}”`).toHaveLength(1);
    return found[0]!;
  };
  return { html, text: onScreen(html), button };
}

// ---------------------------------------------------------------------------

describe('documents.us_status', () => {
  // Until 2026-10-15 this journey's student took Covered Connecticut from 1 February. From that day it isn't hers: from
  // 2027 the premium tax credit it comes with is a citizen's or a green card holder's (`creditAllowed`), so the
  // marketplace is what she takes, in the 60 days from the hour Yale Health ended, and it's the plan that ends out of
  // status. Covered Connecticut begun and ended out of status is reached by no life from then: an F-1 student holds it
  // only in 2026, on income over the poverty line, and none is out of status with it begun.
  it('PLAYER JOURNEY: an F-1 student who withdraws by the fifteenth day of the spring’s classes takes the marketplace from 1 February, Covered Connecticut not being hers in 2027; out of status on the 4th, it ends at the month’s look, and the notice when her cover ends offers her no marketplace', () => {
    const sim = student('d3-cct-begun', 'uk-eng-london');
    // Wednesday 20 January 2027, 11 AM: the spring’s classes began on the 11th, so this is within their first fifteen days,
    // and Yale Health ends today (its spring insurance term begins on 1 February).
    sim.advanceTo(on(2027, 1, 20, 11));
    expect(run(sim, 'school.withdraw', { confirm: true })).toMatchObject({ ok: true, value: { early: true } });
    // In her fifteen days’ grace, lawfully present: federal Medicaid admits no F-1 since 1 October 2026, and Covered
    // Connecticut none from 2027, so Enroll gives the marketplace, within 60 days of the hour Yale Health ended.
    expect(run(sim, 'health.enroll')).toMatchObject({ ok: true, value: { kind: 'marketplace', from: on(2027, 2, 1, 0) } });
    sim.advanceTo(on(2027, 2, 2));
    expect(coverOn(sim.player, sim.now)).toBe('marketplace');
    // Out of status the sixteenth day, 4 February, at the hour she withdrew.
    sim.advanceTo(on(2027, 2, 5));
    expect(sim.player.usOutOfStatus).toBe(on(2027, 2, 4, 11));
    expect(coverOn(sim.player, sim.now)).toBe('marketplace');

    // The month’s look, half past midnight on 1 March: the cover begun is ended, and nothing covers her.
    sim.advanceTo(on(2027, 3, 2));
    const looked = on(2027, 3, 1, 0, 30);
    expect(titled(sim, 'Your Marketplace Plan Has Ended').map((n) => [n.at, n.body])).toEqual([[looked, 'The marketplace is only for citizens and people lawfully present, and you’re out of status.']]);
    expect(healthOf(sim.player).marketplace).toMatchObject({ from: on(2027, 2, 1, 0), until: looked });
    expect(healthOf(sim.player).program).toBeUndefined();
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    expect(titled(sim, 'Your Health Cover Ended').map((n) => [n.at, n.body])).toEqual([[looked, 'You have no health cover from March 1, 2027. You’re out of status, so neither the marketplace nor Covered Connecticut will take you.']]);
    expect(run(sim, 'health.enroll')).toMatchObject({ ok: false, error: 'The marketplace is only for citizens and people lawfully present, and you’re out of status.' });
    expect(titled(sim, 'Your Marketplace Plan Won’t Begin')).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('documents.apply_idcard', () => {
  // Renamed on 2026-10-17 (brief 11's KS-ct-idcard, inputs/renames.json): until then 'PLAYER JOURNEY: an F-1 student’s
  // limited-term card applied for at noon on Thursday 5 November 2026 comes ten federal workdays on, Friday the 20th,
  // Veterans Day not among them', when the card came on SAVE's day, unmailed.
  it('PLAYER JOURNEY: an F-1 student’s limited-term card applied for at noon on Thursday 5 November 2026 is approved by SAVE ten federal workdays on, Friday the 20th, Veterans Day not among them, and comes by mail twenty business days later, Monday 21 December, Thanksgiving not among them', () => {
    const sim = student('d3-save', 'uk-eng-london');
    sim.advanceTo(on(2026, 9, 8, 19));
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(Math.max(ssn.arrivesAt + MS_HOUR, on(2026, 11, 5, 12)));
    expect(sim.now).toBe(on(2026, 11, 5, 12));
    expect(run(sim, 'documents.apply_idcard').ok).toBe(true);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    // 6, 9, 10, 12, 13, 16, 17, 18, 19 and 20 November: Wednesday the 11th is Veterans Day (5 U.S.C. 6103), and SAVE
    // counts federal workdays. Counted Monday to Friday, as until 2026-10-13, the tenth was the 19th. Then the mail's
    // twenty: 23 to 25 and 27 November, Thanksgiving passed, 30 November to 4 December, 7 to 11, 14 to 18 and 21 December.
    // Until 2026-10-17 the card came on SAVE's day, the 20th.
    expect(card.readyAt).toBe(on(2026, 12, 21, 12));
    sim.advanceTo(on(2026, 11, 20, 13));
    expect(card.status).toBe('pending');
    sim.advanceTo(on(2026, 12, 21, 13));
    expect(card.status).toBe('valid');
    expect(titled(sim, 'Non-Driver Identification Card, Limited Term Arrived').map((n) => n.at)).toEqual([on(2026, 12, 21, 12)]);
  }, 60_000);

  // Renamed on 2026-10-17 (brief 11's KS-ct-idcard, inputs/renames.json): until then 'PLAYER JOURNEY: the same card
  // applied for at 9 PM that Thursday, 2 AM on the Friday in UTC, comes at 9 PM on Friday the 20th too, its days counted
  // as New Haven has them', when the card came on SAVE's day, unmailed. With the mail's twenty days after SAVE's ten, a
  // count of New Haven's days and one of UTC's from that Thursday evening land on the same instant, 9 PM on Monday 21
  // December, and the test no longer told them apart (a mutation counting both in UTC survived it); from the Wednesday
  // evening before they don't, so it's asked for then.
  it('PLAYER JOURNEY: the card applied for at 9 PM on Wednesday 4 November, 2 AM on the Thursday in UTC, is approved by SAVE at 9 PM on Thursday the 19th and comes at 9 PM on Friday 18 December, its days counted as New Haven has them', () => {
    const sim = student('d3-save', 'uk-eng-london');
    sim.advanceTo(on(2026, 9, 8, 19));
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(Math.max(ssn.arrivesAt + MS_HOUR, on(2026, 11, 4, 21)));
    expect(sim.now).toBe(on(2026, 11, 4, 21));
    expect(run(sim, 'documents.apply_idcard').ok).toBe(true);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    // SAVE's ten federal workdays, 5, 6, 9, 10, 12, 13 and 16 to 19 November, Veterans Day not among them; then the
    // mail's twenty, 20, 23 to 25 and 27 November, Thanksgiving passed, 30 November to 4 December, 7 to 11 and 14 to 18
    // December. Until the third round of 2026-10-13 each day was the day in UTC, a day after New Haven's at 9 PM, the
    // Sundays counted as Mondays and the Fridays as Saturdays: counted so, this card would come at 9 PM on Sunday 20
    // December.
    expect(card.readyAt).toBe(on(2026, 12, 18, 21));
    sim.advanceTo(on(2026, 12, 18, 20));
    expect(card.status).toBe('pending');
    sim.advanceTo(on(2026, 12, 18, 22));
    expect(card.status).toBe('valid');
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('documents.replace_license', () => {
  /** Born in New York on 1 October 2000: her license, renewed at 18 for eight years, runs out on 1 October 2026. */
  const born2000 = (seed: string) => student(seed, 'us-ny-newyork', { birthYear: 2000, birthMonth: 10, birthDay: 1 });

  it('PLAYER JOURNEY: a license reported lost in force is refused a replacement once a new card would come after its date, and once the date has passed, in words on Papers and through the command, with nothing charged; a twin who asks in time is sent one in force', () => {
    const sim = born2000('d3-license');
    const license = documentsOf(sim.player).find((d) => d.kind === 'license')!;
    expect([license.issuer, license.expiresAt]).toEqual(['us-ny', on(2026, 10, 1, 3)]);
    sim.advanceTo(on(2026, 9, 1));
    expect(run(sim, 'documents.report_lost', { documentId: license.id }).ok).toBe(true);

    // Change the input, the day asked: on 5 September New York’s 21 days bring the card on the 26th, inside its date.
    const twin = born2000('d3-license');
    const theirs = documentsOf(twin.player).find((d) => d.kind === 'license')!;
    twin.advanceTo(on(2026, 9, 1));
    twin.must({ kind: 'documents.report_lost', payload: { documentId: theirs.id } });
    twin.advanceTo(on(2026, 9, 5));
    const sent = twin.must<{ readyAt: number; fee: number }>({ kind: 'documents.replace_license', payload: { documentId: theirs.id } });
    expect(sent).toEqual({ readyAt: on(2026, 9, 26), fee: 17_50 });
    expect(replaced(twin).map((t) => t.memo)).toEqual(['Class D (Operator) driver license, replaced']);
    twin.advanceTo(on(2026, 9, 27));
    expect(documentsOf(twin.player).filter((d) => d.kind === 'license' && d.status === 'valid').map((d) => d.expiresAt)).toEqual([on(2026, 10, 1, 3)]);
    expect(titled(twin, 'Class D (Operator) driver license Arrived').map((n) => n.body)).toEqual(['It’s in your hands and in force from today.']);

    // On 30 September, 21 days would bring it on 21 October, three weeks past its date.
    sim.advanceTo(on(2026, 9, 30));
    const soon = 'It runs out on October 1, 2026, before a new card would come, and a replacement keeps the same date. A license past its date has to be renewed instead, and driving licenses can’t be renewed in the game.';
    const papers = drawn(sim, PassportPane);
    expect(papers.text).toContain(soon);
    expect(papers.button('Replace It')).toMatchObject({ disabled: true, title: soon });
    expect(run(sim, 'documents.replace_license', { documentId: license.id })).toMatchObject({ ok: false, error: soon });
    // On 2 October it has run out.
    sim.advanceTo(on(2026, 10, 2));
    const gone = 'It ran out on October 1, 2026, and a replacement keeps the same date. A license past its date has to be renewed instead, and driving licenses can’t be renewed in the game.';
    expect(drawn(sim, PassportPane).button('Replace It')).toMatchObject({ disabled: true, title: gone });
    expect(run(sim, 'documents.replace_license', { documentId: license.id })).toMatchObject({ ok: false, error: gone });
    expect(replaced(sim)).toEqual([]);
    expect(documentsOf(sim.player).filter((d) => d.kind === 'license').map((d) => d.status)).toEqual(['lost']);
  }, 60_000);
});

describe('documents.replace_idcard', () => {
  /** LIFE FIXTURE: a Dublin life, born in 1980, whose passport book runs out on 28 February 2026. */
  const dubliner = () => {
    const sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'comfortable', birthYear: 1980 } as never, 'd3-ie-35');
    const book = documentsOf(sim.player).find((d) => d.kind === 'passport')!;
    expect(book.expiresAt! - on(2026, 2, 28, 0, 0, DUBLIN)).toBeLessThan(MS_HOUR);
    // The passport card, five years or the book’s date, whichever is sooner: the book’s.
    expect(run(sim, 'documents.apply_idcard')).toMatchObject({ ok: true, value: { expiresAt: book.expiresAt } });
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id } });
    return { sim, card };
  };

  it('LIFE FIXTURE (Dublin): a passport card reported lost is refused a replacement once Ireland’s fourteen days would bring it after its date, and once the date has passed, with nothing charged; a twin who asks in time is sent one', () => {
    const { sim, card } = dubliner();
    const twin = dubliner();
    twin.sim.advanceTo(on(2026, 1, 12, 12, 0, DUBLIN));
    expect(run(twin.sim, 'documents.replace_idcard', { documentId: twin.card.id })).toMatchObject({ ok: true, value: { readyAt: on(2026, 1, 26, 12, 0, DUBLIN) } });
    expect(replaced(twin.sim)).toHaveLength(1);

    // On 20 February, fourteen days would bring it on 6 March, past the 28th.
    sim.advanceTo(on(2026, 2, 20, 12, 0, DUBLIN));
    const soon = 'It runs out on February 28, 2026, before a new card would come, and a replacement keeps the same date, so it can’t be replaced. Apply for a new card instead, if you can.';
    expect(drawn(sim, PassportPane).button('Replace It')).toMatchObject({ disabled: true, title: soon });
    expect(run(sim, 'documents.replace_idcard', { documentId: card.id })).toMatchObject({ ok: false, error: soon });
    sim.advanceTo(on(2026, 3, 1, 12, 0, DUBLIN));
    const gone = 'It ran out on February 28, 2026, and a replacement keeps the same date, so it can’t be replaced. Apply for a new card instead, if you can.';
    expect(run(sim, 'documents.replace_idcard', { documentId: card.id })).toMatchObject({ ok: false, error: gone });
    expect(replaced(sim)).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('What Needs You', () => {
  it('PLAYER JOURNEY: each question an F-1 student is asked carries its date, a withdrawal’s and a tax season’s, and the guide gives no rule for a question without one', () => {
    const sim = student('d3-dated', 'uk-eng-london');
    sim.advanceTo(on(2026, 9, 1, 12));
    expect(run(sim, 'school.withdraw', { confirm: true }).ok).toBe(true);
    sim.advanceTo(on(2027, 2, 2));
    const asked = Object.values(sim.universe.decisions).map((d) => [d.title, d.dueAt !== undefined]);
    expect(asked).toEqual(expect.arrayContaining([['Your US Status Is Ending', true], ['Your 2026 Tax Return', true]]));
    expect(asked.every(([, dated]) => dated)).toBe(true);
    // Until 2026-10-13 What Needs You said a question with no date went quiet 90 days after it was raised.
    const needs = DAY.find((e) => e.id === 'day.needs')!;
    expect(needs.later.some((line) => /no date/.test(line))).toBe(false);
    // It said “A question with a date closes on its date” until 2026-10-14, when every question came to have one, and the
    // save’s keeping a closed question to its date went from the line after.
    expect(needs.later).toContain('Every question has a date. If you don’t answer it, it closes by itself within two days after that date.');
    expect(needs.later).toContain('You can still open a closed question for 180 days after it closes, and SLATE keeps your latest 500 notices.');
  }, 60_000);

  it('the Papers entry gives Home’s tax owed as growing only once its return’s due date has passed, as the alert says it (`growing`, ui/screens/Home.tsx)', () => {
    // Until 2026-10-13 it said tax owed grew each month whenever it was owed (left by that day’s second round).
    const overview = PAPERS.find((e) => e.interpret.some((line) => line.startsWith('The Papers line on Home')))!;
    expect(overview.interpret).toContain('The Papers line on Home shows what needs doing as an alert: “You have no health cover.”, a return that’s due with what filing it would pay, and tax owed, with its interest and a late penalty growing each month once its return’s due date has passed.');
  });
});
