/**
 * Brief 25's Module 6 played on the screens (from 2026-10-24; `docs/verification/career-world-2026-10-23/criteria.md`,
 * X16): a guest part's episode goes on the air, the player enters it on the Charts And Awards tab, is nominated, watches
 * the ceremony or skips it, and the result is the same; the win is on the Portfolio; the charts read on the same tab.
 * Each stage is saved and loaded. The buttons are pressed through the commands they name.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { projectById } from '@/engine/content/careerwork';
import { ensurePro, type Engagement, type Opportunity } from '@/engine/systems/pro';
import { payTermsOf } from '@/engine/systems/projobs';
import { at, graduate, played, reload, skilled } from './fakes/career-world';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'industry' }));

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

/** A screen's words, every tooltip taken out before the tags. */
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
function drawn(sim: Simulation, tab: 'industry' | 'portfolio'): { html: string; shown: string } {
  h.sim = sim;
  h.tab = tab;
  const html = renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '');
  return { html, shown: words(html) };
}
const button = (html: string, label: string) => [...html.matchAll(/<button([^>]*)>([^<]*?)(?:<span class="lock-word">Locked<\/span>)?<\/button>/g)].filter((m) => m[2] === label).map((m) => ({ disabled: m[1]!.includes('disabled=""'), locked: m[1]!.includes('is-locked') }));

/** TEST SETUP: an offer for a part, written as casting writes one, at the rate's scale. */
function offerFor(sim: Simulation, projectId: string, postedAt: number): Opportunity {
  const t = projectById(projectId)!;
  const terms = payTermsOf({ projectId, postedAt });
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId, via: 'open', status: 'offered', postedAt, submitBy: postedAt + 7 * MS_DAY, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units },
  };
  ensurePro(sim, sim.player).opportunities.push(o);
  return o;
}

/** The part prepared by its own steps, as tests/career-workflows.test.ts does. */
function prepared(sim: Simulation, e: Engagement, steps: readonly string[]): void {
  for (let n = 0; n < 48; n += 1) {
    let any = false;
    let busy = false;
    for (const step of steps) {
      const r = sim.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step } });
      if (r.ok) any = true;
      else if (/^You’re (at|asleep)|^You’re too tired/.test(String(r.error))) busy = true;
      played(sim, sim.now + 30 * 60_000);
    }
    if (busy && !any) { played(sim, sim.now + 2 * MS_HOUR); continue; }
    if (!any) break;
  }
}

describe('X16: an Emmy year and the charts, played on the screens', () => {
  it('CONT-01, ANON-03, ANON-06, ANON-09, CHART-07, PLAYER JOURNEY: a guest part entered on Charts And Awards, nominated, its ceremony watched by one twin and skipped by the other, the same win on both Portfolios; the charts read on the same tab; saved and loaded at each stage', () => {
    // The seed whose field nominates the part and whose final round gives it the award (its premise, held below).
    let sim = graduate('awards-journey-0');
    skilled(sim);
    ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
    // This graduate started without the guide, so every control is open (its gates are tests/tutorial.test.ts's).
    let screen = drawn(sim, 'industry');
    expect(screen.shown).toContain('None of your work is on television yet. A part in a series or a television movie can be entered once it’s due on the air.');
    expect(screen.shown).toContain('None of your films is in cinemas. When one opens, its weeks show here as the clock reaches them.');
    // September 2026: the charts' weeks are all still to come, so none is shown.
    expect(screen.shown).toContain('The game holds no week of this chart that has ended by today.');
    expect(screen.shown).toContain('Academy Awards , Academy of Motion Picture Arts and Sciences. Its pages refused; the game doesn’t decide it. Both its rules and its key dates pages turned this build away (HTTP 403), so the game doesn’t say whether a film is eligible.');
    expect(screen.shown).toContain('Emmy Awards , Television Academy. Rules read, and the game follows them.');

    const o = offerFor(sim, 'calloway-files', at(2026, 9, 7));
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    prepared(sim, e, ['read', 'lines', 'rehearse']);
    played(sim, e.days.at(-1)!.to + MS_HOUR);
    sim = reload(sim);

    // Wrapped, its release on the clock: eligible, with Enter Yourself and its fee, and what the International Emmys say.
    screen = drawn(sim, 'industry');
    expect(screen.shown).toContain('Desk Clerk, The Calloway Files Eligible for Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards, on the 78th’s rules carried forward: 1 episode of the season’s 13, under half, with 6 of about 40 scenes in an episode.');
    expect(button(screen.html, 'Enter Yourself ($225.00)')).toEqual([{ disabled: false, locked: false }]);
    expect(screen.shown).toContain('The International Emmy Awards take programs produced outside the U.S., and The Calloway Files is made in the U.S.');
    const r = sim.execute({ kind: 'pro.award_enter', payload: { creditId: sim.player.pro!.credits[0]!.id } });
    expect(r.ok).toBe(true);
    sim = reload(sim);
    screen = drawn(sim, 'industry');
    expect(button(screen.html, 'Enter Yourself ($225.00)')).toEqual([]);
    expect(screen.shown).toContain('Entered for Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards; the nominations are announced on July 8, 2027.');

    // November 2026: the charts' weeks have ended, the box office's latest three weeks old, its revision said.
    const nov = reload(sim);
    nov.advanceTo(at(2026, 11, 15, 12));
    screen = drawn(nov, 'industry');
    expect(screen.shown).toContain('Week October 16, 2026 to October 22, 2026');
    expect(screen.shown).toContain('The latest week the game holds. It ended 3 weeks ago, and the game doesn’t fetch newer ones.');
    expect(screen.shown).toContain('first read October 23, 2026 by the dossier (S93), 2 of its ranks, with Street Fighter at $37,177,832 and You Can See Everything at $23,407,485. The figures below are the latest reading.');
    expect(screen.shown).toContain('1 Street Fighter $38,338,634 New to this chart in the game’s record 3,575 theaters; $38,338,634 in all; week 1 of its run');
    expect(screen.shown).toContain('3 Other Mommy $11,179,290 Down from No. 1');

    // The nominations: nominated, its presentation on the calendar, Watch The Ceremony not yet open.
    sim.advanceTo(at(2027, 7, 8, 12));
    sim = reload(sim);
    screen = drawn(sim, 'industry');
    expect(screen.shown).toContain('Nominated for Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards; it’s presented on September 5, 2027.');
    expect(button(screen.html, 'Watch The Ceremony')).toEqual([{ disabled: true, locked: false }]);
    expect(screen.shown).toContain('Watch The Ceremony Not now: The award is presented on September 5, 2027.');
    expect(screen.shown).toContain('makes casting likelier to choose you: a chance 8% better than it would be');

    // The ceremony: one twin watches it, the other doesn't.
    sim.advanceTo(at(2027, 9, 5, 21));
    const skipped = reload(sim);
    screen = drawn(sim, 'industry');
    expect(button(screen.html, 'Watch The Ceremony')).toEqual([{ disabled: false, locked: false }]);
    const lines = sim.must<{ lines: string[] }>({ kind: 'pro.watch_ceremony', payload: { entryId: sim.player.pro!.awards![0]!.id } }).lines;
    expect(lines.at(-1)).toBe('It’s you: you won Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards.');
    sim = reload(sim);
    screen = drawn(sim, 'industry');
    for (const line of lines) expect(screen.shown).toContain(line);
    expect(button(screen.html, 'Watch The Ceremony')).toEqual([]);
    const watchedPortfolio = drawn(sim, 'portfolio').shown;
    const skippedPortfolio = drawn(skipped, 'portfolio').shown;
    const win = 'Recognition You won Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards, for Desk Clerk in The Calloway Files.';
    expect(watchedPortfolio).toContain(win);
    expect(skippedPortfolio).toContain(win);
    // No other entrant is named anywhere on either screen.
    for (const html of [drawn(sim, 'industry').html, drawn(skipped, 'industry').html, drawn(sim, 'portfolio').html]) expect(html).not.toMatch(/2027:guest-drama:\d+/);
  });
});
