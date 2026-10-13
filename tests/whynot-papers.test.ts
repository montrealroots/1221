/**
 * A shut choice or button on Papers' Your Doctor says why in words on the screen (from 2026-10-12, the completeness
 * critic's item 14 in docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md). Until then Your Doctor, Your Pharmacy,
 * Call It Off, Prepay Three Months and Prepay A Year, and Book An Appointment gave their reason only as a title, which a
 * phone never shows and a keyboard never reaches; each now has a `WhyNot` line under its group, and keeps its title.
 *
 * The screen is rendered to markup (react-dom/server) over real saves, as tests/defects-g8-5.test.ts renders Papers:
 * `useGame` stands in for the provider and `run` is the save's own `execute`. A reason is looked for in the words shown
 * with every title attribute taken out first, so a tooltip alone doesn't pass. PLAYER JOURNEYS play through commands;
 * TEST SETUP sets a state by hand, and says so.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { healthOf, prepayRefusal } from '@/engine/systems/health';
import { READ_KIND, isOpen, lockedBecause, nextChapter } from '@/engine/world/tutorial';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
}));

// The screen's kept tab: the store it's kept in has no server snapshot to render from.
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

const lifeIn = (city: string, seed: string, guided = false) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'comfortable', tutorial: guided }, seed);

/** Papers' Health tab as the player has it: its markup, and the words it shows with every title taken out. */
function shown(sim: Simulation): { html: string; words: string } {
  h.sim = sim;
  h.tabs = { 'tab:/workspace/papers': 'health' };
  const html = renderToStaticMarkup(createElement(PapersWorkspace)).replace(/<!-- -->/g, '');
  const words = html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  return { html, words };
}
const count = (words: string, line: string) => words.split(line).length - 1;
const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

describe('PLAYER JOURNEY: Prepay Three Months and Prepay A Year, shut while a certificate runs, say why under them', () => {
  it('says the engine’s refusal as words once a year is prepaid, and nothing before', () => {
    const sim = lifeIn('uk-eng-london', 'whynot-papers-prepay');
    expect(prepayRefusal(sim, sim.player)).toBeUndefined();
    const before = shown(sim);
    expect(before.words).toContain('Prepay A Year, £114.50');
    expect(before.words).not.toContain('Yours runs more than another month.');

    sim.must({ kind: 'health.prepay', payload: { months: 12 } });
    const why = prepayRefusal(sim, sim.player);
    expect(why).toBe('Yours runs more than another month.');
    expect(sim.execute({ kind: 'health.prepay', payload: { months: 3 } }).error).toBe(why);
    const after = shown(sim);
    // Both buttons are shut for the one reason, so it's said once, unlabeled; and their titles are kept.
    expect(after.words).toContain(`Not now: ${why}`);
    expect(count(after.words, why!)).toBe(1);
    expect(count(after.html, `title="${attr(why!)}"`)).toBe(2);
  });
});

describe('PLAYER JOURNEY: Your Doctor and Your Pharmacy, shut by the guide, say why under them', () => {
  /** Reads the guide's chapters in order, as the player does, until a feature opens. */
  const readUntil = (sim: Simulation, feature: string) => {
    while (!isOpen(sim, feature)) sim.must({ kind: READ_KIND, payload: { chapterId: nextChapter(sim)!.id } });
  };

  it('says the guide’s reason as words while its chapter is unread, and nothing once it’s read', () => {
    const sim = lifeIn('us-ny-newyork', 'whynot-papers-guide', true);
    const why = lockedBecause(sim, 'health.choose_clinic');
    expect(why).toMatch(/^Read “Cover, Benefits And Returns” in the guide first\./);
    expect(lockedBecause(sim, 'health.choose_pharmacy')).toBe(why);
    const locked = shown(sim);
    expect(locked.html).toMatch(/<select id="own-doctor"[^>]* disabled=""/);
    expect(locked.html).toMatch(/<select id="own-pharmacy"[^>]* disabled=""/);
    expect(locked.words).toContain(`Not now: ${why}`);
    expect(count(locked.words, `Not now: ${why}`)).toBe(1);
    expect(count(locked.html, `title="${attr(why!)}"`)).toBeGreaterThanOrEqual(2);

    readUntil(sim, 'health.choose_clinic');
    const open = shown(sim);
    expect(open.html).not.toMatch(/<select id="own-doctor"[^>]* disabled=""/);
    expect(open.words).not.toContain(why!);
    // The lock's own words, not the whole of `why`, whose closing sentence names the next chapter and changes as chapters
    // are read (the verifier of 2026-10-12 found the line above could never fail).
    expect(open.words).not.toContain('Cover, Benefits And Returns” in the guide first');
  });

  it('Book An Appointment and Call It Off, shut by the guide, each say it under their own row too', () => {
    const sim = lifeIn('us-ny-newyork', 'whynot-papers-book', true);
    const why = lockedBecause(sim, 'health.book');
    expect(why).toBe(lockedBecause(sim, 'health.choose_clinic'));
    expect(lockedBecause(sim, 'health.cancel_appointment')).toBe(why);
    const without = count(shown(sim).words, `Not now: ${why}`);
    // TEST SETUP: a visit owed, as a missed or called-off appointment leaves one; the guide refuses Call It Off and
    // Book An Appointment while its chapter is unread, so the commands can't make it here.
    healthOf(sim.player).owedVisit = 'A doctor’s visit';
    const owed = shown(sim);
    expect(owed.words).toContain('A doctor’s visit: not yet seen');
    expect(owed.html).toMatch(/<button[^>]* disabled=""[^>]*>Book An Appointment<\/button>/);
    expect(count(owed.words, `Not now: ${why}`)).toBe(without + 1);
    // TEST SETUP: an appointment booked, as an illness books one, for the same reason.
    delete healthOf(sim.player).owedVisit;
    healthOf(sim.player).appointments = [{ id: 'a1', at: sim.now + 3 * MS_DAY, what: 'A doctor’s visit' }];
    const booked = shown(sim);
    expect(booked.html).toMatch(/<button[^>]* disabled=""[^>]*>Call It Off<\/button>/);
    expect(count(booked.words, `Not now: ${why}`)).toBe(without + 1);
  });
});
