/**
 * What Open An Account At Another Bank says about sending money, against what a transfer does (group g20, from
 * 2026-10-12).
 *
 * Until 2026-10-12 the screen’s line read the bank’s own cut-off (Citi’s, written out as "12:30" whatever the number),
 * then the bank’s own days, then the country’s instant scheme or its days, and never the country’s cut-off. A transfer
 * (`arrivalOf`, `systems/bankmoves.ts`) reads the country’s cut-off where the bank sets none: Japan’s Zengin lands money
 * the same business day before 3:30 PM and the next after. So for a Japanese bank the screen said "takes 3 business
 * days, SLATE’s estimate", and the money arrived the same day.
 *
 * For part of 2026-10-12 the fix wrote both cut-offs on a 24-hour clock ("before 15:30"), and this file held it there.
 * The house writes a time the player reads on the 12-hour clock (`formatTime`, `core/time.ts`), so the file asserts
 * "before 3:30 PM" now and reads the cut-off back off the screen on that clock (group R5). That the cut-off follows its number, and
 * not only the sentence, is held in `tests/defects-r5-1.test.ts`.
 *
 * PLAYER JOURNEYS play through the commands the screen gives. The panel is rendered as the player has it, and the
 * cut-off it shows is the one the transfer is then sent either side of.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { businessDay, businessDaysBetween, daysOfAccount } from '@/engine/content/bankdays';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

// Without the original: it imports the looks, which import it back, and would get the original’s hooks.
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

const { BankMoves } = await import('@/ui/bank/BankMoves');

const lifeIn = (cityId: string, bankId: string, seed: string) => quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
/** The bank screen’s Your Banks and Open An Account At Another Bank, as text. */
const screen = (sim: Simulation): string => {
  h.sim = sim;
  return renderToStaticMarkup(createElement(BankMoves)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
};
/** The cut-off a screen gives, read back off its 12-hour clock: "3:30 PM" as 15.5. */
const cutOffIn = (text: string): number => {
  const [, hh, mm, half] = /arrives the same business day before (\d+):(\d\d) (AM|PM)/.exec(text)!;
  return (Number(hh) % 12) + (half === 'PM' ? 12 : 0) + Number(mm) / 60;
};
const keyOf = (sim: Simulation, at: number) => { const p = zonedParts(at, sim.homeZone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
/** The next date from tomorrow that’s a business day at a bank in the country, at an hour of that day. */
const nextBusinessDayAt = (sim: Simulation, countryId: string, hour: number): number => {
  for (let at = sim.now + MS_DAY; ; at += MS_DAY) {
    const p = zonedParts(at, sim.homeZone);
    if (businessDay(countryId, keyOf(sim, at))) return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: Math.floor(hour), minute: Math.round((hour % 1) * 60) }, sim.homeZone);
  }
};

describe('PLAYER JOURNEY: a Tokyo life at MUFG, opening an account at SMBC', () => {
  it('says what Zengin does, and a transfer either side of the cut-off it gives lands as it says', () => {
    const sim = lifeIn('jp-13-tokyo', 'jp-mufg', 'g20-zengin');
    const mufg = primary(sim).id;
    const text = screen(sim);
    expect(text).toContain('SMBC');
    // The scheme’s rule, not SLATE’s three-day estimate for a bank that publishes nothing.
    expect(text).not.toMatch(/Money it sends to another bank takes 3 business days/);
    expect(text).toContain('Money between banks here arrives the same business day before 3:30 PM, the next after, by Zengin.');
    // No time on a 24-hour clock: not the cut-off, and not the source quoted under Sources And Estimates (`TRANSFERS`
    // in `content/bankopening.ts`, which gave Zengin’s hours as "8:30 to 15:30" until later on 2026-10-12).
    expect(text).not.toMatch(/\b(1[3-9]|2[0-3]):\d\d\b/);
    const cutOff = cutOffIn(text);
    expect(cutOff).toBe(15.5);

    const smbc = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'jp-smbc' }).accountId;
    // Before the cut-off the screen gave, on a business day: there by the day’s end.
    sim.advanceTo(nextBusinessDayAt(sim, 'jp', cutOff - 0.5));
    const before = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: mufg, toId: smbc, amount: 10_000_00 });
    expect(keyOf(sim, before.arrivesAt)).toBe(keyOf(sim, sim.now));
    // After it, the next business day.
    sim.advanceTo(nextBusinessDayAt(sim, 'jp', cutOff + 0.5));
    const sentOn = keyOf(sim, sim.now);
    const after = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: mufg, toId: smbc, amount: 10_000_00 });
    expect(keyOf(sim, after.arrivesAt)).not.toBe(sentOn);
    expect(after.arrivesAt - sim.now).toBeLessThanOrEqual(4 * MS_DAY);
    expect(businessDay('jp', keyOf(sim, after.arrivesAt))).toBe(true);
  }, 120_000);
});

describe('PLAYER JOURNEY: a New York life at Chase, with Wells Fargo and then Citi next on the list', () => {
  it('gives the estimate where a bank publishes nothing, Wells Fargo’s own days, and Citi’s own cut-off on the 12-hour clock', () => {
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'g20-citi');
    const chase = primary(sim).id;
    // Bank of America is first on the list, and publishes no time for a transfer to another bank, so the line is
    // SLATE’s estimate. Until 2026-10-12 this comment called the days the bank’s own, which they never were.
    expect(screen(sim)).toMatch(/Bank of America.*Money it sends to another bank takes 3 business days, SLATE’s estimate: the bank doesn’t say\./);
    // Applied at Bank of America, Wells Fargo is the bank the panel shows, with the 2 business days it publishes. Until
    // 2026-10-12 no assertion here rendered a bank’s own days.
    run(sim, 'bank.open_current', { bankId: 'us-bank-of-america', fundFrom: chase, amount: 100_00 });
    const wellsText = screen(sim);
    expect(wellsText).toMatch(/Wells Fargo.*Money it sends to another bank takes 2 business days\./);
    expect(wellsText).not.toMatch(/Money it sends to another bank takes \d+ business days, SLATE’s estimate/);
    const days = Number(/Money it sends to another bank takes (\d+) business days\./.exec(wellsText)![1]);
    // Once the opening deposit is there, money sent from Wells Fargo takes the days the screen gave.
    const wells = run<{ accountId: string; arrivesAt: number }>(sim, 'bank.open_current', { bankId: 'us-wells-fargo', fundFrom: chase, amount: 25_00 });
    sim.advanceTo(wells.arrivesAt + MS_DAY);
    const account = sim.universe.accounts[wells.accountId]!;
    expect(account.balance).toBeGreaterThanOrEqual(10_00);
    const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: wells.accountId, toId: chase, amount: 10_00 });
    const kept = daysOfAccount(account, sim.player);
    expect(businessDaysBetween(sim.now, sent.arrivesAt, kept.countryId, sim.homeZone, kept.regionId)).toBe(days);
    // Opened at Wells Fargo, Citi is the bank the panel shows, with its own cut-off.
    const text = screen(sim);
    expect(text).toContain('Money it sends to another bank arrives the same business day before 12:30 PM, the next after.');
    expect(cutOffIn(text)).toBe(12.5);
    expect(text).not.toContain('by Zengin');
  }, 120_000);
});
