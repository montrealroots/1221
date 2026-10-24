/**
 * Papers' Your ID grayed its Get button with the reason in its tooltip alone, until 2026-10-17: "One is already on its
 * way." while a card was coming and "You already hold one in force." once it had, neither of which a phone shows. Brief
 * 14's document journey (`tools/playthroughs-ui.mjs document`, `docs/verification/language-2026-10-17/journeys/`) found
 * it at both widths, as brief 13's interface criteria read a refusal: grayed, with its reason in words on the screen.
 * The reason now stands beside the button, in `idCardRefusal`'s words.
 *
 * PLAYER JOURNEYS play through commands. The Papers screen is rendered to markup (react-dom/server) over a real save,
 * with `useGame` standing in for the provider, which needs a browser, as `tests/defects-g25-1.test.ts` renders it. The
 * markup's tags are stripped, and a tooltip with them, so only words on the screen count.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { idCardRefusal } from '@/engine/systems/identity';
import { passportRefusal } from '@/engine/systems/documents';
import { optRefusal } from '@/engine/systems/permission';
import '@/ui/looks/all';

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

const { PassportPane, WorkPane } = await import('@/ui/papers/Documents');

/** A New Haven life, a US citizen, with no papers, so Connecticut's card is theirs to get. */
const life = (seed: string) => { const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', wealth: 'wealthy' }, seed); sim.player.documents = []; return sim; };
/** The words Papers' Passport And ID shows, its tags (and so its tooltips) stripped. */
const onScreen = (sim: Simulation, pane: () => ReactNode = PassportPane as () => ReactNode) => { h.sim = sim; return renderToStaticMarkup(createElement(pane)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };
const times = (text: string, words: string) => text.split(words).length - 1;

describe('PLAYER JOURNEY: Connecticut’s ID card applied for, on its way and held, the Get button’s reason on the screen each time', () => {
  it('says “One is already on its way.” while it comes, and “You already hold one in force.” once it has, in words beside the grayed button', () => {
    const sim = life('j14-idcard');
    expect(idCardRefusal(sim.player, sim.now)).toBeUndefined();
    expect(onScreen(sim)).not.toContain('One is already on its way.');
    const applied = sim.must<{ readyAt: number }>({ kind: 'documents.apply_idcard', payload: {} });
    expect(idCardRefusal(sim.player, sim.now)).toBe('One is already on its way.');
    expect(onScreen(sim)).toContain('One is already on its way.');
    // The commitments of a life on the way are let pass, so the clock runs to the card's day.
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
    sim.advanceTo(applied.readyAt + MS_HOUR);
    expect(documentsOf(sim.player).find((d) => d.kind === 'idcard')?.status).toBe('valid');
    expect(idCardRefusal(sim.player, sim.now)).toBe('You already hold one in force.');
    const words = onScreen(sim);
    expect(words).toContain('You already hold one in force.');
    expect(words).not.toContain('One is already on its way.');
  }, 120_000);
});

/**
 * The passport's and OPT's buttons grayed the same way, their reasons in tooltips alone, until 2026-10-17. The journey
 * didn't reach them; the coordinator gave them the ID card's fix. Both passport buttons refuse an application already
 * being decided in the same words, which the screen says once.
 */
describe('PLAYER JOURNEY: a passport applied for and OPT out of reach, the grayed buttons’ reasons on the screen', () => {
  it('says a passport already applied for is being decided, once for both buttons, and why OPT isn’t open, beside the grayed buttons', () => {
    const sim = life('j14-passport');
    expect(passportRefusal(sim.player)).toBeUndefined();
    sim.must({ kind: 'documents.apply_passport', payload: {} });
    const no = passportRefusal(sim.player)!;
    expect(no).toBe('You’ve already applied, and it’s being decided.');
    expect(passportRefusal(sim.player, true)).toBe(no);
    expect(times(onScreen(sim), no)).toBe(1);
    const opt = optRefusal(sim, sim.player)!;
    expect(opt).toBe('OPT is for a student on an F-1, and you’re a US citizen.');
    expect(times(onScreen(sim, WorkPane as () => ReactNode), opt)).toBe(1);
  }, 120_000);
});
