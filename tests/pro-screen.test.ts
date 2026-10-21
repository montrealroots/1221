/**
 * The Career screen (brief 19, criteria F1 to F4, T1, T2): Overview and Portfolio drawn over real saves, as
 * tests/whynot-school.test.ts draws the School screen: react-dom/server, `useGame` standing in for the provider with
 * `run` the save's own `execute`, and the kept tab answered from `h.tab`. Each reason is looked for in the words a player
 * sees, every title attribute taken out first, so a tooltip can't pass for it.
 *
 * PLAYER JOURNEYS play through the clock and the commands a player sends; TEST SETUP marks state set by hand.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CHAPTERS } from '@/engine/content/tutorial';
import { READ_KIND } from '@/engine/world/tutorial';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'overview' }));

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? h.tab : initial) as T, () => undefined] as const };
});

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

const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const student = (seed: string, tutorial = false) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', tutorial });
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};

/** The Career screen at a tab: its markup, and the words a player sees, every tooltip taken out before the tags. */
function drawn(sim: Simulation, tab: 'overview' | 'portfolio'): { html: string; shown: string } {
  h.sim = sim;
  h.tab = tab;
  const html = renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '');
  return { html, shown: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
/** A button by its label: whether it's grayed, and its tooltip. */
const button = (html: string, label: string) => [...html.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].filter((m) => m[2] === label).map((m) => ({ disabled: m[1]!.includes('disabled=""'), title: /title="([^"]*)"/.exec(m[1]!)?.[1], locked: m[1]!.includes('is-locked') }));

describe('the Career screen', () => {
  it('PLAYER JOURNEY: a first-year’s Overview says where they stand and what the portfolio is missing, each in a sentence', () => {
    const sim = student('screen-first-year');
    const { html, shown } = drawn(sim, 'overview');
    expect(shown).toContain('Your Work Career');
    expect(html).toContain('role="tablist" aria-label="Career"');
    expect(html).toContain('aria-selected="true" aria-controls="career-pane-overview"');
    expect(shown).toContain('Training You’re an MFA candidate in Acting at the David Geffen School of Drama at Yale University, in year one of three.');
    expect(shown).toContain('Based In New Haven');
    expect(shown).toContain('Permission To Work You’re a US citizen, so you can work for any employer in the US.');
    expect(shown).toContain('The Way You’re On Completing The Degree');
    expect(shown).toContain('Needed For Any Submission You have no headshots, and every submission starts with one.');
    expect(shown).toContain('Worth Doing You have no reel, and nothing recorded to cut one from yet.');
    expect(shown).toContain('Start with your headshots, on the Portfolio tab.');
    // The problems are a list a screen reader counts.
    expect(html).toMatch(/<ul[^>]*><li>You have no headshots/);
  });

  it('PLAYER JOURNEY: Portfolio draws the profile, each material and its control, grayed with the command’s own reason under it', () => {
    const sim = student('screen-portfolio');
    const { html, shown } = drawn(sim, 'portfolio');
    // A labeled field, and the name it falls back to.
    expect(html).toContain('<label for="pro-name">Professional Name</label>');
    expect(html).toMatch(/<input id="pro-name"[^>]*placeholder="Ada Cole"/);
    expect(button(html, 'Use This Name')).toEqual([{ disabled: true, title: 'You’re already working under your own name.', locked: false }]);
    expect(shown).toContain('None yet. Practice, practice briefs and self-tapes don’t count as credits.');
    // At 7:30 on the first morning: registration is under four hours off, said under the button.
    const why = 'Registration And Your Account starts at 10:00 AM: there isn’t the time before it.';
    expect(button(html, 'Book A Headshot Session (4 Hours, $700.00)')).toEqual([{ disabled: true, title: why, locked: false }]);
    expect(shown).toContain(`Not now: ${why}`);
    expect(button(html, 'Cut A Reel (2 Hours, $250.00)')).toEqual([{ disabled: true, title: 'You have nothing recorded to cut a reel from. Tape a practice brief on the Player Profile first.', locked: false }]);
    expect(shown).toContain('Sources And Estimates');
  });

  it('PLAYER JOURNEY: once made, each material shows where it came from, when, and what’s in it, and the résumé opens line by line', () => {
    const sim = student('screen-made');
    tended(sim, at(2026, 8, 30, 10));
    sim.must({ kind: 'pro.headshots', payload: {} });
    sim.must({ kind: 'pro.update_resume', payload: {} });
    const { html, shown } = drawn(sim, 'portfolio');
    expect(shown).toContain('Taken August 30, 2026, current');
    expect(shown).toContain('Where They Came From A session with a photographer, $700.00 and four hours, both estimated.');
    expect(shown).toContain('What’s In Them Retouched photographs of you as you looked on August 30, 2026, for submissions and your résumé.');
    expect(shown).toContain('Made August 30, 2026, the first');
    expect(shown).toContain('Standing Up to date with your record.');
    expect(html).toMatch(/<details class="small"><summary>What It Says<\/summary><ul[^>]*><li>Ada Cole<\/li><li>Training: MFA in Acting \(candidate, year 1 of 3\)/);
    expect(button(html, 'Update Your Résumé (1 Hour)')[0]).toMatchObject({ disabled: true, title: 'Your résumé from August 30, 2026 already has everything on your record.' });
    const overview = drawn(sim, 'overview').shown;
    expect(overview).not.toContain('Needed For Any Submission');
    expect(overview).toContain('Worth Doing You have no reel');
  });

  it('PLAYER JOURNEY: an older graduate’s save, opened, shows its School credit, its Equity membership and its training as completed', () => {
    const sim = student('screen-graduate');
    tended(sim, at(2026, 9, 1, 18));
    // TEST SETUP: graduated with a part played, as a build before 2026-10-20 left a graduate: no professional record.
    Object.assign(sim.player.school!, { standing: 'graduated', endedAt: at(2026, 9, 1, 12), credits: [{ production: 'Shakespeare Repertory Project I', role: 'Viola', kind: 'shakespeare', year: 2029, wentOn: 4, size: 'lead' }] });
    const u = deserialise(serialise(sim.universe)) as typeof sim.universe;
    delete u.people[u.playerId]!.pro;
    u.opened = u.opened!.filter((x) => x !== 'pro.begun');
    const opened = loadSave(u);
    const { html, shown } = drawn(opened, 'portfolio');
    expect(html).toContain('<li>Viola, Shakespeare Repertory Project I, David Geffen School of Drama at Yale University, 2029</li>');
    expect(shown).toContain('Unions You joined Actors’ Equity Association with the degree on September 1, 2026.');
    expect(shown).toContain('Training You completed the MFA in Acting at the David Geffen School of Drama at Yale University in 2026.');
    expect(drawn(opened, 'overview').shown).toContain('The Way You’re On A Graduate');
  });

  it('PLAYER JOURNEY: in a guided life, Career stays Locked until “Your Career” is read, and opens with its controls then', () => {
    const sim = student('screen-guided', true);
    const shut = drawn(sim, 'overview');
    expect(shut.shown).toContain('Career, Locked');
    expect(shut.shown).toContain('Read “Your Career” in the guide to open it.');
    for (const c of CHAPTERS) {
      sim.must({ kind: READ_KIND, payload: { chapterId: c.id } });
      if (c.id === 'career') break;
    }
    const open = drawn(sim, 'portfolio');
    expect(open.shown).not.toContain('Career, Locked');
    expect(button(open.html, 'Use This Name')[0]!.locked).toBe(false);
    expect(open.html).not.toContain('is-locked');
  });
});
