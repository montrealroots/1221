/**
 * Five Papers defects found by the triage of 2026-10-12, each held here against the engine and the screen that shows it
 * (from 2026-10-12): Fill A Longer Supply said it filled when the bank couldn't pay, and still spoke of trips the
 * journeys took away on 2026-10-09; a graduate couldn't enroll before Yale Health ended, so August went uninsured;
 * dropping a plan, or leaving its premium unpaid, opened a fresh 60 days to enroll; SNAP's time limit counted an
 * enrolled student's months; and after Yale Health, New Haven had no therapist, though the notice said one outside Yale
 * could take the course on.
 *
 * The screens are rendered to markup (react-dom/server) over real saves, as tests/defects-g8-4.test.ts renders them:
 * `useGame` stands in for the provider and `run` is the save's own `execute`. PLAYER JOURNEYS play through commands;
 * FIXTURES set a state by hand to reach one rule, and say so.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { recordInterest } from '@/engine/systems/earnings';
import { coverOn, healthMonth, healthOf, mayEnroll, yaleUntil } from '@/engine/systems/health';
import { inSaveMoney } from '@/engine/systems/banking';
import { overdraftRoom } from '@/engine/systems/lending';
import { THERAPISTS, sessionPrice, therapistsIn, therapyRefusal } from '@/engine/systems/therapy';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
}));

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
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
    toast: noop,
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** A life in New Haven with no school, as tests/safetynet.test.ts makes one: it starts on 5 January 2026. */
const newHaven = (seed: string, wealth: StartingWealth = 'comfortable') => quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth }, seed);
const lifeIn = (city: string, seed: string, wealth: StartingWealth = 'comfortable') => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth }, seed);
/** Played by somebody who looks after themselves, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** FIXTURE: every account they could pay from emptied, and the current account overdrawn to its limit, as months of no income leave them. */
const broke = (sim: Simulation) => {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal) continue;
    if (a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash')) a.balance = 0;
  }
  const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
  current.balance = -overdraftRoom(sim, sim.player, current);
};

/** A screen as the player has it: its markup, and its text with the tags taken out. */
function drawn(sim: Simulation, screen: FunctionComponent, tabs: Record<string, string> = {}): { html: string; text: string } {
  h.sim = sim;
  h.tabs = tabs;
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/\s+/g, ' ') };
}
const healthTab = { 'tab:/workspace/papers': 'health' };

describe('Fill A Longer Supply pays for what it fills, or fills nothing, and no longer speaks of trips', () => {
  it('PLAYER JOURNEY: refused, and nothing filled, when the bank can’t cover the supply', () => {
    const sim = lifeIn('us-ny-newyork', 'g85-supply-broke', 'modest');
    // FIXTURE: high blood pressure kept up, its first fill not yet made, and a bank with nothing in it.
    healthOf(sim.player).chronic = { hypertension: { treated: true } };
    broke(sim);
    const before = sim.universe.transactions.length;
    const r = sim.execute({ kind: 'health.extra_supply', payload: { days: 90 } });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('It comes to more than the bank can cover.');
    expect(healthOf(sim.player).chronic!.hypertension!.supplyUntil).toBeUndefined();
    expect(sim.universe.transactions.length).toBe(before);
  });

  it('still fills, and charges, when the bank can pay', () => {
    const sim = lifeIn('us-ny-newyork', 'g85-supply-paid', 'wealthy');
    healthOf(sim.player).chronic = { hypertension: { treated: true } };
    const r = sim.must<{ paid: number }>({ kind: 'health.extra_supply', payload: { days: 90 } });
    expect(healthOf(sim.player).chronic!.hypertension!.supplyUntil).toBe(sim.now + 90 * MS_DAY);
    expect(r.paid).toBeGreaterThanOrEqual(0);
  });

  it('the button says what it pays for, and the Fine print no longer sends you to fill one before a trip', () => {
    const sim = newHaven('g85-supply-screen', 'wealthy');
    healthOf(sim.player).chronic = { hypertension: { treated: true } };
    const { html, text } = drawn(sim, PapersWorkspace, healthTab);
    expect(text).toMatch(/Fill A Longer Supply, 90 Days/);
    expect(html).not.toMatch(/Before a trip/);
    expect(text).not.toMatch(/before a trip|until you’re home/);
    expect(html).toMatch(/title="Pays for 90 days at once, at 3 fills’ share"/);
  });
});

describe('a graduate can enroll before Yale Health ends, and the cover starts as it ends', () => {
  /** FIXTURE: the degree conferred in May 2027, as Commencement confers it, so Yale Health covers to 31 July. */
  const graduate = (seed: string) => {
    const sim = student(seed);
    Object.assign(sim.player.school!, { standing: 'graduated', endedAt: at(2027, 5, 24) });
    return sim;
  };

  it('in July, within 60 days of the loss to come, enrollment is open; before 2 June it says when it opens', () => {
    const sim = graduate('g85-enroll-july');
    expect(yaleUntil(sim.player)).toBe(instantFromZoned({ year: 2027, month: 8, day: 1, hour: 0 }, NY));
    expect(mayEnroll(sim.player, at(2027, 7, 10)).ok).toBe(true);
    const may = mayEnroll(sim.player, at(2027, 5, 20));
    expect(may.ok).toBe(false);
    expect(may.why).toMatch(/June 2, 2027/);
    // At the School, with no end in sight, it's still refused.
    expect(mayEnroll(student('g85-enroll-enrolled').player, at(2026, 9, 2)).why).toBe('Yale Health covers you while you’re at the School.');
  });

  it('PLAYER JOURNEY: withdrawn after the fifteenth day of classes, enrolling starts cover the day Yale Health ends, with no gap', () => {
    const sim = student('g85-enroll-withdraw');
    // Thirty days after 2 October at midnight is 1 November at midnight, the first of a month.
    tended(sim, at(2026, 10, 2, 0));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(false);
    const ends = yaleUntil(sim.player)!;
    expect(ends).toBe(at(2026, 11, 1, 0));
    const r = sim.execute<{ from: number; kind: string }>({ kind: 'health.enroll', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.from).toBe(ends);
    expect(coverOn(sim.player, ends + MS_HOUR)).toBeDefined();
    expect(coverOn(sim.player, ends - MS_HOUR)).toBe('yale');
  }, 120_000);

  it('PLAYER JOURNEY: withdrawn on 20 September, Yale Health runs to 20 October, and a plan waits for 1 November, never beside it', () => {
    const sim = student('g85-enroll-withdraw-mid');
    tended(sim, at(2026, 9, 20, 12));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(false);
    expect(yaleUntil(sim.player)).toBe(at(2026, 10, 20, 12));
    const r = sim.must<{ from: number }>({ kind: 'health.enroll', payload: {} });
    expect(r.from).toBe(at(2026, 11, 1, 0));
  }, 120_000);
});

describe('a plan dropped, or its premium left unpaid, opens no special enrollment', () => {
  /** FIXTURE: a marketplace plan held since the life began, and January's income past every program's limit. */
  const insured = (seed: string, wealth: StartingWealth = 'comfortable') => {
    const sim = newHaven(seed, wealth);
    healthOf(sim.player).marketplace = { from: sim.now - MS_DAY, state: 'ct' };
    recordInterest(sim.player, at(2026, 1, 20), NY, 10_000_00);
    return sim;
  };

  it('PLAYER JOURNEY: dropped in January, nothing covers February, and the marketplace waits for open enrollment', () => {
    const sim = insured('g85-drop', 'wealthy');
    sim.must({ kind: 'health.drop', payload: {} });
    sim.advanceTo(at(2026, 2, 2));
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    expect(healthOf(sim.player).lostAt).toBeUndefined();
    const notice = titled(sim, 'Your Health Cover Ended')[0]!;
    expect(notice.body).not.toMatch(/60 days to enroll/);
    expect(notice.body).toMatch(/opens no special enrollment/);
    expect(notice.body).toMatch(/HUSKY D or Covered Connecticut/);
    expect(mayEnroll(sim.player, at(2026, 2, 10)).ok).toBe(false);
  });

  it('PLAYER JOURNEY: a premium the bank can’t pay ends the plan, and opens no special enrollment either', () => {
    const sim = insured('g85-unpaid');
    sim.advanceTo(at(2026, 1, 31, 22));
    broke(sim);
    sim.advanceTo(at(2026, 2, 2));
    expect(healthOf(sim.player).marketplace!.until).toBeDefined();
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    expect(healthOf(sim.player).lostAt).toBeUndefined();
    expect(mayEnroll(sim.player, at(2026, 2, 10)).ok).toBe(false);
  });

  it('a program ended at renewal still opens the 60 days', () => {
    const sim = newHaven('g85-renewal');
    // FIXTURE: HUSKY D held since January and up for renewal on 1 February, January's income past its limit.
    healthOf(sim.player).program = { kind: 'medicaid', state: 'ct', from: sim.now - MS_DAY, band: 'low', renewAt: at(2026, 2, 1, 0) };
    recordInterest(sim.player, at(2026, 1, 20), NY, 10_000_00);
    healthMonth(sim, sim.player, at(2026, 2, 1, 1));
    expect(healthOf(sim.player).program!.until).toBe(at(2026, 2, 1, 1));
    expect(healthOf(sim.player).lostAt).toBe(at(2026, 2, 1, 1));
    expect(mayEnroll(sim.player, at(2026, 2, 10))).toMatchObject({ ok: true, why: 'Within 60 days of losing cover.' });
  });
});

describe('SNAP’s time limit leaves an enrolled student’s months alone', () => {
  it('PLAYER JOURNEY: a student in term with three months counted is still paid, and the month isn’t counted', () => {
    const sim = student('g85-snap-student');
    tended(sim, at(2026, 9, 7));
    sim.must({ kind: 'benefits.assistance', payload: {} });
    // FIXTURE: three months counted against the limit already, as three months on SNAP without work would leave.
    sim.player.assistance!.counted = ['2026-05', '2026-06', '2026-07'];
    tended(sim, at(2026, 9, 16));
    expect(titled(sim, 'SNAP Time Limit Reached')).toHaveLength(0);
    expect(sim.universe.transactions.filter((t) => t.memo === 'SNAP, the month, onto the EBT card')).toHaveLength(1);
    expect(sim.player.assistance!.counted).toEqual(['2026-05', '2026-06', '2026-07']);
  }, 120_000);
});

describe('after Yale Health, New Haven has a therapist who can take a course on', () => {
  const PRIVATE = THERAPISTS.find((t) => t.cityId === 'us-ct-newhaven' && !t.yale);

  it('a private practice in New Haven, at its published fee, takes on somebody Yale Health doesn’t cover', () => {
    expect(PRIVATE).toBeDefined();
    const sim = newHaven('g85-therapy', 'wealthy');
    (healthOf(sim.player).chronic ??= {}).depression = { treated: true };
    expect(therapyRefusal(sim.player, PRIVATE!.name, sim.now)).toBeUndefined();
    expect(sessionPrice(sim, PRIVATE!)).toBe(inSaveMoney(sim, 240_00, 'USD'));
    sim.must({ kind: 'health.therapy', payload: { therapist: PRIVATE!.name } });
    expect(sim.player.therapy?.therapist).toBe(PRIVATE!.name);
  });

  it('the Therapist choice opens on one that will see you', () => {
    const sim = newHaven('g85-therapy-screen', 'wealthy');
    (healthOf(sim.player).chronic ??= {}).depression = { treated: true };
    expect(therapistsIn('us-ct-newhaven')[0]!.yale).toBe(true);
    const { html, text } = drawn(sim, PapersWorkspace, healthTab);
    const chosen = html.match(/<select id="therapist"[\s\S]*?<\/select>/)?.[0].match(/<option value="([^"]*)" selected/)?.[1];
    expect(chosen).toBe(PRIVATE!.name);
    expect(text).not.toMatch(/sees students Yale Health covers/);
  });
});
