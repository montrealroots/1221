/**
 * The cut-off Open An Account At Another Bank gives for a transfer, on the clock the player reads (group R5, from
 * 2026-10-12; `ui/bank/BankMoves.tsx`).
 *
 * Earlier on 2026-10-12 the screen began giving a country’s cut-off as well as a bank’s, through a second formatter of
 * its own that wrote both on a 24-hour clock: "arrives the same business day before 15:30, the next after, by Zengin".
 * The house writes a time the player reads on the 12-hour clock, "3:30 PM", as `formatTime` (`core/time.ts`) does, and
 * the guide gives the same cut-offs that way. Both now go through `formatTime`.
 *
 * The falsifiability test: Citi’s and Zengin’s cut-offs are 12:30 PM and 3:30 PM, which a sentence could say without
 * reading them. Each is moved here, and the screen has to move with it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { OPENING, TRANSFERS } from '@/engine/content/bankopening';

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
const screen = (sim: Simulation): string => {
  h.sim = sim;
  return renderToStaticMarkup(createElement(BankMoves)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
};
/** Runs `read` with a cut-off moved to another hour, and puts it back. */
function withCutOff<T>(rules: { sameDayBefore?: number }, hour: number, read: () => T): T {
  const was = rules.sameDayBefore;
  rules.sameDayBefore = hour;
  try { return read(); } finally { rules.sameDayBefore = was; }
}

describe('a cut-off, as the screen gives it', () => {
  it('writes Zengin’s on the 12-hour clock, and moves it when the number moves', () => {
    const sim = lifeIn('jp-13-tokyo', 'jp-mufg', 'r5-zengin');
    const said = screen(sim);
    expect(said).toContain('goes by Zengin, and arrives the same business day if it’s sent before 3:30 PM, or the next business day if later.');
    expect(said).not.toContain('before 15:30');
    expect(withCutOff(TRANSFERS.JP as { sameDayBefore?: number }, 14.25, () => screen(sim)))
      .toContain('goes by Zengin, and arrives the same business day if it’s sent before 2:15 PM, or the next business day if later.');
    expect(withCutOff(TRANSFERS.JP as { sameDayBefore?: number }, 9.5, () => screen(sim)))
      .toContain('goes by Zengin, and arrives the same business day if it’s sent before 9:30 AM, or the next business day if later.');
  }, 120_000);

  it('writes a bank’s own on the 12-hour clock, and moves it when the number moves', () => {
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'r5-citi');
    const chase = sim.player.primaryAccountId!;
    // Applied at Bank of America and opened at Wells Fargo, Citi is the bank the panel shows.
    expect(sim.execute({ kind: 'bank.open_current', payload: { bankId: 'us-bank-of-america', fundFrom: chase, amount: 100_00 } }).ok).toBe(true);
    expect(sim.execute({ kind: 'bank.open_current', payload: { bankId: 'us-wells-fargo', fundFrom: chase, amount: 25_00 } }).ok).toBe(true);
    expect(screen(sim)).toContain('Money it sends to another bank arrives the same business day if it’s sent before 12:30 PM, or the next business day if later.');
    const citi = OPENING['us-citi'] as { sameDayBefore?: number };
    expect(withCutOff(citi, 9.75, () => screen(sim))).toContain('Money it sends to another bank arrives the same business day if it’s sent before 9:45 AM, or the next business day if later.');
    expect(withCutOff(citi, 16, () => screen(sim))).toContain('Money it sends to another bank arrives the same business day if it’s sent before 4:00 PM, or the next business day if later.');
    expect(citi.sameDayBefore).toBe(12.5);
  }, 120_000);
});
