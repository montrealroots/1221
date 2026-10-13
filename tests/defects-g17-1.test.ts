/**
 * Group g17, part 1: the US debit card's two Regulation E clocks (`systems/security.ts`, `content/security.ts`).
 *
 * 12 CFR 1005.6(b) counts the $50 tier in business days from learning of the loss, and the $500 tier's 60 days
 * from the statement's transmittal. Until 2026-10-12 `liabilityFor` counted both in calendar days from learning of
 * it: a charge learned of on a Friday and reported on Monday left the holder $500, not $50; and a charge an alert
 * caught a month before its statement left the holder all of it, reported inside the 60 days from the statement
 * that the dispute itself still accepted.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { FRAUD_LAW, type FraudLaw } from '@/engine/content/security';
import { businessDay } from '@/engine/content/bankdays';
import { cardAccount, somebodyElse } from '@/engine/systems/security';

const laws = FRAUD_LAW as Record<string, FraudLaw>;
const kept = new Map<string, FraudLaw>();
// Nobody else's draw on the days the test moves through: the charge is the one given.
function withLaw(iso: string, change: Partial<FraudLaw>) { if (!kept.has(iso)) kept.set(iso, laws[iso]!); laws[iso] = { ...laws[iso]!, ...change }; }
afterEach(() => { for (const [k, v] of kept) laws[k] = v; kept.clear(); });

const lifeIn = (cityId: string, bankId: string, seed: string) =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);

const AMOUNT = 900_00;

/** The bank's date of a moment, as 'YYYY-MM-DD', and its weekday (0 Sunday). */
function dayOf(sim: Simulation, at: number): { key: string; weekday: number; day: number } {
  const p = zonedParts(at, sim.homeZone);
  const key = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  return { key, weekday: new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay(), day: p.day };
}

/** On to the next moment, a day at a time, at which `ok` holds. */
function advanceUntil(sim: Simulation, ok: (d: ReturnType<typeof dayOf>) => boolean): void {
  for (let guard = 0; guard < 120 && !ok(dayOf(sim, sim.now)); guard += 1) sim.advanceBy(MS_DAY);
  expect(ok(dayOf(sim, sim.now))).toBe(true);
}

/** A stranger's debit card charge today, caught by an alert the same day; its index. */
function chargedToday(sim: Simulation): number {
  sim.player.alerts = { statements: true, largePayment: 1 };
  somebodyElse(sim, sim.player, { which: 'debit', account: cardAccount(sim, sim.player, 'debit')!, amount: AMOUNT, stopped: false });
  const index = sim.player.fraud!.length - 1;
  expect(sim.player.fraud![index]!.learnedAt).toBe(sim.now);
  return index;
}

function dispute(sim: Simulation, index: number): number {
  return sim.must<{ carried: number }>({ kind: 'card.dispute', payload: { index } }).carried;
}

/** A Friday followed by a Monday and a Tuesday the country's banks keep open: the case Regulation E's business days decide. */
const fridayBeforeAnOpenWeek = (iso: string) => (d: ReturnType<typeof dayOf>) => {
  if (d.weekday !== 5) return false;
  const [y, m, dd] = d.key.split('-').map(Number) as [number, number, number];
  const after = (n: number) => new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10);
  return businessDay(iso, after(3)) && businessDay(iso, after(4)) && businessDay(iso, after(5));
};

describe('a US debit card’s first $50 tier, in business days from learning of it', () => {
  it('leaves $50 of a charge learned of on a Friday and reported on Monday, or Tuesday, and $500 on Wednesday', () => {
    for (const [late, carried] of [[3, 50_00], [4, 50_00], [5, 500_00]] as const) {
      withLaw('US', { fraudRate: 0 });
      const sim = lifeIn('us-ny-newyork', 'us-chase', `g17-friday-${late}`);
      advanceUntil(sim, fridayBeforeAnOpenWeek('us'));
      const index = chargedToday(sim);
      sim.advanceBy(late * MS_DAY);
      // Three calendar days and one business day by Monday; four and two by Tuesday; five and three by Wednesday.
      expect(dispute(sim, index)).toBe(carried);
    }
  });
});

describe('a US debit card’s $500 tier, 60 days from the statement', () => {
  it('leaves $500, not all of it, of a charge an alert caught a month before the statement, reported 45 days after it', () => {
    withLaw('US', { fraudRate: 0 });
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'g17-statement');
    // Early in a month, so the statement on the 1st is weeks after the alert.
    advanceUntil(sim, (d) => d.day === 2);
    const index = chargedToday(sim);
    const one = sim.player.fraud![index]!;
    expect(one.statedAt - one.learnedAt).toBeGreaterThan(20 * MS_DAY);
    sim.advanceTo(one.statedAt + 45 * MS_DAY);
    // Over 60 days from the alert, 45 from the statement: inside the window the dispute accepts.
    expect(sim.now - one.learnedAt).toBeGreaterThan(60 * MS_DAY);
    expect(dispute(sim, index)).toBe(500_00);
  });
});

describe('another country’s tiers, in calendar days from learning of it', () => {
  it('leaves a Mexican holder all of a charge learned of on a Friday and reported on Monday', () => {
    withLaw('MX', { fraudRate: 0 });
    const sim = lifeIn('mx-cmx-mexicocity', 'mx-bbva', 'g17-mexico');
    advanceUntil(sim, fridayBeforeAnOpenWeek('mx'));
    const index = chargedToday(sim);
    const amount = sim.player.fraud![index]!.amount;
    sim.advanceBy(3 * MS_DAY);
    // Mexico's 48 hours are calendar ones: three days on, the general dispute's no cap.
    expect(dispute(sim, index)).toBe(amount);
  });
});
