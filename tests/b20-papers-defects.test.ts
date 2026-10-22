/**
 * Brief 20's papers area, the defects it found (D1) and repaired, each held by a test that failed before the repair.
 *
 * P1, an OPT approved before the program ends said to be in force. OPT runs twelve months "from the later of your
 * program's end and the approval" (Papers' own words), so with premium processing, decided within thirty federal
 * workdays of an application made in the ninety days before the program's end, it's approved weeks before it starts:
 * `documents.permission` makes it valid with its first day, `issuedAt`, at the program's end. Nothing in the engine
 * took it as in force before then (`inForce` reads `issuedAt`, and `usWorkAuthorized` with it), but Papers did: its
 * row on the Work tab read In Force, and its page said "It’s in force until …" over "It no longer lets you work
 * anywhere: it’s out of force.", two sentences that each said what isn't so. Found reading the document look's
 * `whatItDoes`, whose out-of-force words a valid document could reach only by starting later than today.
 *
 * P2, a course of therapy held on a public holiday. A course's first session was put on a weekday at five
 * (`sessionSlot`), and every session after it a week on to the minute, whatever the day: a course begun on Thursday
 * 12 November 2026 at Yale Mental Health & Counseling met on Thanksgiving Day. The doctor's appointments have kept off
 * a public holiday since 2026-10-13 (`appointments.ts`'s `slot`); the therapist's practice is no more open that day.
 * Found by brief 20's papers area looking for impossible scheduling (D1).
 *
 * P3, a medical debt put on a Connecticut student's credit record. A medical debt of $500 or more, a year past due,
 * marked the record (40 points, `MEDICAL_DEBT.recordHit`) and said "A Medical Debt Is On Your Record" outside the states
 * that bar it, which SLATE kept as New York and California. Connecticut has barred it since 1 July 2024: Public Act
 * 24-6, "An Act Concerning the Reporting of Medical Debt", signed on 9 May 2024, forbids a health care provider or a
 * hospital to report any part of a medical debt to a credit rating agency, and voids one so reported (the governor's
 * release, portal.ct.gov, read 2026-10-22). Every life lives in New Haven, so every played life's unpaid care was put on
 * a record the state's law keeps it off. Found by brief 20's papers area reading the rule against its source.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), at Yale in New Haven from Monday 24 August 2026,
 * played by the clock and the commands Papers sends; Papers rendered to markup (react-dom/server) over the save, with
 * `useGame` standing in for the provider, which needs a browser, as tests/defects-g25-1.test.ts does.
 *
 * TEST SETUP: the body kept fed, rested and awake as the clock moves (`tended`); for P1, the F-1's program end moved to
 * Wednesday 4 November 2026 with its sixty days' grace (a life's own is 31 May 2029), so the ninety days before it fall
 * in the first term; the United States' holidays read from public/holidays/us.tsv, as the app fetches them when a save
 * opens (`loadPlacesFor`); for P2, depression on her record from 12 November, as a month's onset would put it there (which
 * month brings it is the draw's, tested apart in tests/evidence-g07-life.test.ts); for P3, the bank emptied and a
 * $900 bill raised on her first morning as an injury's is (`billCare`), and money put back to live on once it's debt,
 * not paid toward it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { documentsOf, inForce } from '@/engine/systems/documents';
import { f1Of, programEnd, usWorkAuthorized } from '@/engine/systems/permission';
import { billCare, healthOf, medicalDebtOf } from '@/engine/systems/health';
import { THERAPY, THERAPY_SESSION_KIND } from '@/engine/systems/therapy';
import { addCountryHolidays, holidaysOn } from '@/engine/content/holidays';
import { readFileSync } from 'node:fs';
import { zonedParts } from '@/engine/core/time';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { WorkPane } = await import('@/ui/papers/Documents');

// TEST SETUP: the holiday file the app fetches for a save's country when it opens (`loadPlacesFor`), read from disk.
addCountryHolidays('us', readFileSync('public/holidays/us.tsv', 'utf8'));

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

const look = (sim: Simulation, id: string): Looked => {
  const found = resolveLook(sim, subject('document', id));
  if (!found || 'gone' in found) throw new Error(`document:${id} didn’t resolve`);
  return found as Looked;
};
/** The look as it reads: its summary, its body's words and its figures' values and notes. */
const page = (sim: Simulation, id: string) => {
  const l = look(sim, id);
  h.sim = sim;
  return `${l.summary} ${renderToStaticMarkup(createElement('div', null, l.body)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')}`;
};
const workTab = (sim: Simulation) => { h.sim = sim; return renderToStaticMarkup(createElement(WorkPane)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };

describe('P1: an OPT approved before the program ends', () => {
  it('PLAYER JOURNEY: approved three weeks ahead, it reads Approved on the Work tab and its page says it starts on the program’s last day, not that it’s in force or out of force; from that day it reads In Force, across a reload', () => {
    const sim = createSave(1, 'b20-papers-opt-early', { ...newLifeConfig(), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    // TEST SETUP: the program's end moved to Wednesday 4 November 2026.
    f1Of(sim.player)!.expiresAt = at(2026, 11, 4, 12) + 60 * MS_DAY;
    const ends = programEnd(sim.player)!;
    tended(sim, at(2026, 9, 1, 18));
    // Apply With Premium Processing, as the OPT panel sends it, inside the ninety days.
    const applied = sim.must<{ readyAt: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
    expect(applied.readyAt).toBeLessThan(ends - 14 * MS_DAY);
    tended(sim, applied.readyAt + MS_HOUR);
    const opt = documentsOf(sim.player).find((d) => d.kind === 'permit' && d.name.includes('OPT'))!;
    // Decided: valid, from the program's end, and not in force before it, as the engine reads it.
    expect([opt.status, opt.issuedAt]).toEqual(['valid', ends]);
    expect(inForce(opt, sim.now)).toBe(false);
    expect(usWorkAuthorized(sim.player, sim.now)).toBe(false);

    const from = formatDate(ends, NY);
    const until = formatDate(opt.expiresAt!, NY);
    for (const s of [sim, reload(sim)]) {
      const words = page(s, opt.id);
      expect(words).not.toContain('It’s in force until');
      expect(words).not.toContain('out of force');
      expect(words).toContain(`It’s approved, and it starts on ${from}. It runs to ${until}, and its number ends`);
      expect(words).toContain('It doesn’t let you work until then.');
      const tab = workTab(s);
      expect(tab).toContain(`${opt.number} ${from} ${until} Approved`);
      expect(tab).not.toContain(`${opt.number} ${from} ${until} In Force`);
    }

    // From the program's end it is in force, and says so.
    tended(sim, ends + MS_HOUR);
    expect(inForce(opt, sim.now)).toBe(true);
    expect(page(sim, opt.id)).toContain(`It’s in force until ${until}, and its number ends`);
    expect(page(sim, opt.id)).toContain('It lets you work in the United States.');
    expect(workTab(sim)).toContain(`${opt.number} ${from} ${until} In Force`);
  }, 60_000);
});

describe('P2: a course of therapy on a public holiday', () => {
  it('PLAYER JOURNEY: a course begun on Thursday 12 November meets Thursdays at five, and the week of Thanksgiving on Friday 27 November instead; no session of the eight falls on a weekend or a public holiday, across a reload', () => {
    const sim = createSave(1, 'b20-papers-therapy', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    tended(sim, at(2026, 11, 12, 12));
    // TEST SETUP: depression on her record, as a month's onset would put it there.
    (healthOf(sim.player).chronic ??= {}).depression = { treated: true, since: sim.now };
    // Begin A Course Of 8, at Yale's counseling, which Yale Health's cover makes free.
    const first = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'Yale Mental Health & Counseling' } }).first;
    expect(first).toBe(at(2026, 11, 19, 17));
    const held: number[] = [];
    let opened: Simulation = sim;
    for (let n = 0; n < THERAPY.sessions; n += 1) {
      const next = opened.universe.scheduled.find((i) => i.kind === THERAPY_SESSION_KIND && i.status === 'pending');
      if (!next) break;
      held.push(next.at);
      tended(opened, next.at + MS_HOUR);
      if (n === 2) opened = reload(opened);
    }
    expect(held).toHaveLength(THERAPY.sessions);
    // Thanksgiving, Thursday 26 November, goes to the Friday; the course keeps a week between sessions from there.
    expect(held.slice(0, 3)).toEqual([at(2026, 11, 19, 17), at(2026, 11, 27, 17), at(2026, 12, 4, 17)]);
    for (const t of held) {
      const p = zonedParts(t, NY);
      expect([0, 6]).not.toContain(p.weekday);
      expect(holidaysOn(t, NY, 'us', 'us-ct').filter((x) => x.type === 'public')).toEqual([]);
      expect(p.hour).toBe(17);
    }
    // Each held once, and the course done.
    expect(opened.universe.scheduled.filter((i) => i.kind === THERAPY_SESSION_KIND && i.status === 'done')).toHaveLength(THERAPY.sessions);
    expect(opened.player.therapy).toBeUndefined();
  }, 60_000);
});

describe('P3: a medical debt and a Connecticut credit record', () => {
  /** TEST SETUP: a posting of a sum into or out of one of her accounts, against a test line. */
  const give = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: -amount }] });
  /** TEST SETUP: every current, savings and cash account of hers emptied. */
  const broke = (sim: Simulation) => {
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && !a.closedAt && ['checking', 'savings', 'cash'].includes(a.kind) && a.balance > 0) give(sim, a.id, -a.balance);
  };

  it('PLAYER JOURNEY: $900 of care unpaid at its due date is owed as debt, and a year and more on it’s still owed, counted, and never put on her credit record or said to be, across a reload', () => {
    const sim = createSave(1, 'b20-papers-ctdebt', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    broke(sim);
    const bill = billCare(sim, sim.player, 'A care bill', 900_00, sim.now);
    tended(sim, bill.dueAt + MS_DAY);
    expect(bill.inDebt).toBe(true);
    expect(-medicalDebtOf(sim, sim.player)!.balance).toBe(900_00);
    // Money to live on, none of it paid toward the debt.
    give(sim, sim.player.primaryAccountId!, 20_000_00);
    const marks = () => (sim.player.credit?.marks ?? []).filter((m) => m.points === 40).length;
    const before = marks();
    tended(sim, at(2027, 6, 1, 12));
    const opened = reload(sim);
    // A year past its due date of 23 September 2026 is 23 September 2027; the month's look on 1 October reads it.
    for (const s of [sim, opened]) {
      tended(s, at(2027, 11, 2, 12));
      expect(-medicalDebtOf(s, s.player)!.balance).toBe(900_00);
      expect(s.universe.notifications.filter((n) => n.title === 'A Medical Debt Is On Your Record')).toEqual([]);
      expect(healthOf(s.player).reported).toBeFalsy();
      expect((s.player.credit?.marks ?? []).filter((m) => m.points === 40).length).toBe(before);
    }
    expect(marks()).toBe(before);
  }, 90_000);
});
