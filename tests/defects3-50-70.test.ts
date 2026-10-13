/**
 * The third round of 2026-10-13’s fixes, for the Papers and day items it gave one fixer (defects 50, 51, 52, 53, 67 and
 * 70, and the second round’s loose ends L1, L2, L4 and L7). Most are held where their rows are, in the files that held
 * the defect and were corrected with it: tests/evidence2-b06.test.ts (Your US Status on OPT, Covered Connecticut out of
 * status, SNAP on a claim and to the dollar), tests/evidence-g16-papers.test.ts, tests/assistance.test.ts,
 * tests/evidence-g32-ui.test.ts (a plan missed elsewhere, on its own clock), tests/evidence-g03-life.test.ts (a
 * prescription’s renewal booked over a visit owed) and tests/evidence-g34-ui.test.ts (the undated rule, labelled). What
 * those don’t reach is here, each failing before its fix:
 *
 * - `documents.us_status`: Covered Connecticut begun before the status ends is ended with the month too, and the notice
 *   when her cover ends offers no marketplace to somebody it would refuse.
 * - `documents.apply_idcard`: SAVE’s ten days are federal workdays, Veterans Day not among them.
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
  it('PLAYER JOURNEY: an F-1 student who withdraws by the fifteenth day of the spring’s classes takes Covered Connecticut from 1 February; out of status on the 4th, it ends at the month’s look, and the notice when her cover ends offers her no marketplace', () => {
    const sim = student('d3-cct-begun', 'uk-eng-london');
    // Wednesday 20 January 2027, 11 AM: the spring’s classes began on the 11th, so this is within their first fifteen days,
    // and Yale Health ends today (its spring insurance term begins on 1 February).
    sim.advanceTo(on(2027, 1, 20, 11));
    expect(run(sim, 'school.withdraw', { confirm: true })).toMatchObject({ ok: true, value: { early: true } });
    // In her fifteen days’ grace, lawfully present: December’s work-study is far under Covered Connecticut’s 175% of the
    // poverty line, and federal Medicaid admits no F-1 since 1 October 2026.
    expect(run(sim, 'health.enroll')).toMatchObject({ ok: true, value: { kind: 'essential', from: on(2027, 2, 1, 0) } });
    sim.advanceTo(on(2027, 2, 2));
    expect(coverOn(sim.player, sim.now)).toBe('essential');
    // Out of status the sixteenth day, 4 February, at the hour she withdrew.
    sim.advanceTo(on(2027, 2, 5));
    expect(sim.player.usOutOfStatus).toBe(on(2027, 2, 4, 11));
    expect(coverOn(sim.player, sim.now)).toBe('essential');

    // The month’s look, half past midnight on 1 March: the cover begun is ended, and nothing covers her.
    sim.advanceTo(on(2027, 3, 2));
    const looked = on(2027, 3, 1, 0, 30);
    expect(titled(sim, 'Your Public Cover Has Ended').map((n) => [n.at, n.body])).toEqual([[looked, 'Covered Connecticut is for a citizen or a noncitizen lawfully present, and you stayed past your status.']]);
    expect(healthOf(sim.player).program).toMatchObject({ kind: 'essential', from: on(2027, 2, 1, 0), until: looked });
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    expect(titled(sim, 'Your Health Cover Ended').map((n) => [n.at, n.body])).toEqual([[looked, 'You’re uncovered from March 1, 2027. Out of status, neither the marketplace nor Covered Connecticut will take you.']]);
    expect(run(sim, 'health.enroll')).toMatchObject({ ok: false, error: 'The marketplace sells to a citizen or somebody lawfully present, and you stayed past your status.' });
    expect(titled(sim, 'Your Public Cover Won’t Begin')).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------

describe('documents.apply_idcard', () => {
  it('PLAYER JOURNEY: an F-1 student’s limited-term card applied for at noon on Thursday 5 November 2026 comes ten federal workdays on, Friday the 20th, Veterans Day not among them', () => {
    const sim = student('d3-save', 'uk-eng-london');
    sim.advanceTo(on(2026, 9, 8, 19));
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(Math.max(ssn.arrivesAt + MS_HOUR, on(2026, 11, 5, 12)));
    expect(sim.now).toBe(on(2026, 11, 5, 12));
    expect(run(sim, 'documents.apply_idcard').ok).toBe(true);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    // 6, 9, 10, 12, 13, 16, 17, 18, 19 and 20 November: Wednesday the 11th is Veterans Day (5 U.S.C. 6103), and SAVE
    // counts federal workdays. Counted Monday to Friday, as until 2026-10-13, the tenth was the 19th.
    expect(card.readyAt).toBe(on(2026, 11, 20, 12));
    sim.advanceTo(on(2026, 11, 20, 13));
    expect(card.status).toBe('valid');
    expect(titled(sim, 'Non-Driver Identification Card, Limited Term Arrived').map((n) => n.at)).toEqual([on(2026, 11, 20, 12)]);
  }, 60_000);

  it('PLAYER JOURNEY: the same card applied for at 9 PM that Thursday, 2 AM on the Friday in UTC, comes at 9 PM on Friday the 20th too, its days counted as New Haven has them', () => {
    const sim = student('d3-save', 'uk-eng-london');
    sim.advanceTo(on(2026, 9, 8, 19));
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(Math.max(ssn.arrivesAt + MS_HOUR, on(2026, 11, 5, 21)));
    expect(sim.now).toBe(on(2026, 11, 5, 21));
    expect(run(sim, 'documents.apply_idcard').ok).toBe(true);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    // The same ten federal workdays, 6 to 20 November less Veterans Day. Until the third round of 2026-10-13 each day was
    // the day in UTC, a day after New Haven’s at 9 PM: the Sundays the 8th, 15th and 22nd counted as Mondays and the
    // Fridays as Saturdays, and the card came at 9 PM on Sunday 22 November.
    expect(card.readyAt).toBe(on(2026, 11, 20, 21));
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
    expect(titled(twin, 'Class D (Operator) driver license Arrived').map((n) => n.body)).toEqual(['It’s in force from today.']);

    // On 30 September, 21 days would bring it on 21 October, three weeks past its date.
    sim.advanceTo(on(2026, 9, 30));
    const soon = 'It runs out on October 1, 2026, before a new card would come, and a replacement keeps its date: a license past it is renewed, and SLATE renews none since the cars went.';
    const papers = drawn(sim, PassportPane);
    expect(papers.text).toContain(soon);
    expect(papers.button('Replace It')).toMatchObject({ disabled: true, title: soon });
    expect(run(sim, 'documents.replace_license', { documentId: license.id })).toMatchObject({ ok: false, error: soon });
    // On 2 October it has run out.
    sim.advanceTo(on(2026, 10, 2));
    const gone = 'It ran out on October 1, 2026, and a replacement keeps its date: a license past it is renewed, and SLATE renews none since the cars went.';
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
    const soon = 'It runs out on February 28, 2026, before a new card would come, and a replacement keeps its date, so it isn’t replaced.';
    expect(drawn(sim, PassportPane).button('Replace It')).toMatchObject({ disabled: true, title: soon });
    expect(run(sim, 'documents.replace_idcard', { documentId: card.id })).toMatchObject({ ok: false, error: soon });
    sim.advanceTo(on(2026, 3, 1, 12, 0, DUBLIN));
    const gone = 'It ran out on February 28, 2026, and a replacement keeps its date, so it isn’t replaced.';
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
    expect(needs.later).toContain('A question with a date closes on its date, answered or not, at the world’s next look, which comes every 2 days.');
  }, 60_000);

  it('the Papers entry gives Home’s tax owed as growing only once its return’s due date has passed, as the alert says it (`growing`, ui/screens/Home.tsx)', () => {
    // Until 2026-10-13 it said tax owed grew each month whenever it was owed (left by that day’s second round).
    const overview = PAPERS.find((e) => e.interpret.some((line) => line.startsWith('The Papers line on Home')))!;
    expect(overview.interpret).toContain('The Papers line on Home shows what needs doing as an alert: “You have no health cover.”, a return that’s due with what filing it would pay, and tax owed, with its interest and a late penalty growing each month once its return’s due date has passed.');
  });
});
