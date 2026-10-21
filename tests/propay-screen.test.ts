/**
 * The Career screen's Work tab and Papers' Your Work And Your Permission (brief 19, D7 and D8, V14's screens): drawn over
 * real saves as tests/pro-screen.test.ts draws the Career screen, with react-dom/server, `useGame` standing in for the
 * provider and the kept tab answered from `h.tab`. Each line is looked for in the words a player sees, every title
 * attribute taken out first, so a tooltip can't pass for it. Money's statement line is read from the account's own
 * statement (`activity`), as the Statements tab lists it.
 *
 * PLAYER JOURNEYS play through the clock and the commands a player sends; TEST SETUP (tests/fakes/career-work.ts) writes
 * the engagement and the agreement the work and the agent's systems write, built apart from the pay.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { CHAPTERS } from '@/engine/content/tutorial';
import { READ_KIND } from '@/engine/world/tutorial';
import { RATES } from '@/engine/content/careerwork';
import { activity } from '@/engine/systems/statements';
import { negotiatedAmount, schedulePay } from '@/engine/systems/propay';
import { MS_DAY, formatDate } from '@/engine/core/time';
import { f1Of, optRunsOut } from '@/engine/systems/permission';
import { documentsOf } from '@/engine/systems/documents';
import { at, booked, graduate, runDays, signed, student, tended } from './fakes/career-work';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'work' }));

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
const { WorkPane: PapersWork } = await import('@/ui/papers/Documents');

/** A screen's markup, and the words a player sees, every tooltip taken out before the tags. */
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
function drawn(sim: Simulation): { html: string; shown: string } {
  h.sim = sim;
  h.tab = 'work';
  const html = renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '');
  return { html, shown: words(html) };
}
const button = (html: string, label: string) => [...html.matchAll(/<button([^>]*)>([^<]*?)(?:<span class="lock-word">Locked<\/span>)?<\/button>/g)].filter((m) => m[2] === label).map((m) => ({ disabled: m[1]!.includes('disabled=""'), title: /title="([^"]*)"/.exec(m[1]!)?.[1], locked: m[1]!.includes('is-locked') }));

describe('the Work tab', () => {
  it('PLAYER JOURNEY: a graduate with no work booked reads that work appears here, Equity’s bills and SAG-AFTRA’s first step, with Join SAG-AFTRA grayed and why under it', () => {
    const sim = graduate('screen-work-none');
    const { html, shown } = drawn(sim);
    expect(html).toContain('aria-selected="true" aria-controls="career-pane-work"');
    expect(shown).toContain('No work booked. Work you accept appears here with its dates, its calls, its pay and any commission.');
    expect(shown).toContain('You joined Actors’ Equity Association with the degree on September 3, 2026.');
    expect(shown).toContain('Initiation fee, $600.00 down of $1,800.00: $600.00, paid September 3, 2026.');
    expect(shown).toContain('Initiation fee, part 2 of 3: $600.00, due September 3, 2027.');
    expect(shown).toContain('Basic dues, half a year: $88.00, due November 1, 2026.');
    const why = 'You can join SAG-AFTRA once you’ve worked a SAG-AFTRA principal role: a TV, theatrical or Low Budget film part. Ultra Low Budget and student films don’t count toward it.';
    expect(button(html, 'Join SAG-AFTRA ($3,244.07)')).toEqual([{ disabled: true, title: why, locked: false }]);
    expect(shown).toContain(`Not now: ${why}`);
    expect(shown).toContain('Sources And Estimates');
  }, 90_000);

  it('PLAYER JOURNEY: represented SAG-AFTRA work reads promised with its expected commission, then held in trust, then received with the commission on its own line, and Money’s statement shows it land less the commission', () => {
    const sim = graduate('screen-work-sag');
    const a = signed(sim, at(2026, 9, 8));
    const e = booked(sim, { project: 'calloway-files', days: [at(2026, 9, 21), at(2026, 9, 22)], amount: negotiatedAmount(RATES['sag-tv-day'].amount!, 'sag-aftra', true), per: 'day', via: 'agent', agreementId: a.id });
    schedulePay(sim, sim.player, e);
    const promised = drawn(sim).shown;
    expect(promised).toContain('Desk Clerk, The Calloway Files');
    expect(promised).toContain('Who Bright Harbor Television, SAG-AFTRA TV/Theatrical. Fictional, as every project in the game is.');
    expect(promised).toContain('Permission To Work Read September 3, 2026: You’re a US citizen, so you can work for any employer in the US.');
    expect(promised).toContain('The week of September 20, 2026: $2,822.60 promised by Bright Harbor Television, due October 1, 2026. It isn’t paid until then, so it isn’t in your accounts yet.');
    expect(promised).toContain('Commission expected: $256.60. $256.60, what’s paid over scale ($2,566.00), so you keep scale.');
    tended(sim, at(2026, 10, 2));
    const held = drawn(sim).shown;
    expect(held).toContain('Paid into Stewart Talent’s client trust account on October 1, 2026, and passed on to you by October 6, 2026.');
    expect(held).toContain('Commission: $256.60, taken when it’s passed on.');
    tended(sim, at(2026, 10, 7));
    const r = e.pay[0]!.received!;
    const done = drawn(sim).shown;
    expect(done).toContain('Received October 6, 2026, passed on from Stewart Talent’s client trust account.');
    expect(done).toContain(`Gross $2,822.60, withheld for tax $${(r.withheld / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}, to you $${(r.net / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
    expect(done).toContain('Commission: $256.60, taken before it reached you.');
    // In Money, the account's statement: the deposit's line names the commission taken from it.
    const account = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const lines = activity(sim, account, at(2026, 10, 1), sim.now).lines.filter((l) => l.memo.includes('Calloway'));
    expect(lines.map((l) => [l.memo, l.amount])).toEqual([['The Calloway Files, the week of September 20, 2026: paid on from Stewart Talent’s client trust account, less $256.60 commission', r.net]]);
  }, 90_000);

  it('PLAYER JOURNEY: once the agreement has ended, Still Owed After An Agreement Ended lists the payments still to come with the commission each carries', () => {
    const sim = graduate('screen-work-owed');
    const a = signed(sim, at(2026, 9, 8));
    const e = booked(sim, { project: 'calder-street', days: runDays(at(2026, 9, 21), 2), amount: 1_051_00, per: 'week', via: 'agent', agreementId: a.id });
    schedulePay(sim, sim.player, e);
    expect(drawn(sim).shown).not.toContain('Still Owed After An Agreement Ended');
    tended(sim, at(2026, 9, 25));
    // TEST SETUP: the agreement ended by agreement, as the agent's system ends one.
    Object.assign(a, { status: 'ended', endedAt: sim.now, endedHow: 'agreement' });
    const shown = drawn(sim).shown;
    expect(shown).toContain('Still Owed After An Agreement Ended');
    expect(shown).toContain('A House On Calder Street, the week of September 20, 2026: $1,051.00 due October 1, 2026, with $105.10 commission owed to Stewart Talent. 10% of $1,051.00 gross, Equity’s rate on a weekly salary of $1,051.00, over $525.00. It’s still owed after your agreement with Stewart Talent ended, because you made the contract while it ran.');
  }, 90_000);

  it('PLAYER JOURNEY: Papers lists each engagement with what permission to work said for its dates when it was booked', () => {
    const sim = graduate('screen-papers-read');
    const e = booked(sim, { project: 'eastview', days: [at(2026, 9, 14), at(2026, 9, 15)], amount: 125_00, per: 'day' });
    h.sim = sim;
    expect(words(renderToStaticMarkup(createElement(PapersWork)))).not.toContain('Your Work And Your Permission');
    schedulePay(sim, sim.player, e);
    const shown = words(renderToStaticMarkup(createElement(PapersWork)));
    expect(shown).toContain('Your Work And Your Permission');
    expect(shown).toContain('Sam, Last Bus To Eastview, September 14, 2026 to September 15, 2026. Read September 3, 2026: You’re a US citizen, so you can work for any employer in the US.');
  }, 90_000);

  it('PLAYER JOURNEY: on OPT, Papers says the days counted so far and the end of its days without work, which the work booked moves two weeks later', () => {
    const sim = student('screen-papers-opt', { homeRegionId: 'uk-eng-london' });
    // TEST SETUP: the degree conferred on 1 September 2026 and the F-1's program ending 1 October, so OPT is played in
    // months: the F-1's end moved to sixty days past the program's.
    f1Of(sim.player)!.expiresAt = at(2026, 10, 1, 12) + 60 * MS_DAY;
    Object.assign(sim.player.school!, { standing: 'graduated', endedAt: at(2026, 9, 1, 12) });
    tended(sim, at(2026, 9, 2, 10));
    expect(sim.execute({ kind: 'documents.apply_opt', payload: { premium: true } }).ok).toBe(true);
    tended(sim, at(2026, 10, 20, 10));
    const idle = optRunsOut(sim, sim.player)!;
    const e = booked(sim, { project: 'calder-street', days: runDays(at(2026, 10, 26), 2), amount: 1_051_00, per: 'week' });
    schedulePay(sim, sim.player, e);
    expect(optRunsOut(sim, sim.player)! - idle).toBe(14 * MS_DAY);
    tended(sim, at(2026, 11, 14, 10));
    h.sim = sim;
    const shown = words(renderToStaticMarkup(createElement(PapersWork)));
    const opt = documentsOf(sim.player).find((d) => d.name.includes('OPT'))!;
    expect(shown).toContain(`So far your OPT has counted ${opt.idleDays} days without work and 12 days worked.`);
    expect(shown).toContain(`Your US Status Ends ${formatDate(idle + 14 * MS_DAY, 'America/New_York')} When your OPT’s 90 days without work run out.`);
    expect(shown).toContain('On OPT, this is the list of your work and its dates that SEVP’s guidance asks you to keep.');
  }, 90_000);

  it('PLAYER JOURNEY: in a guided life, the Work tab and Join SAG-AFTRA stay shut until “Your Career” is read, which opens both', () => {
    const sim = student('screen-work-guided', { tutorial: true });
    for (const c of CHAPTERS) {
      if (c.id === 'career') break;
      sim.must({ kind: READ_KIND, payload: { chapterId: c.id } });
    }
    const shut = drawn(sim);
    expect(shut.shown).toContain('Career, Locked');
    expect(button(shut.html, 'Join SAG-AFTRA ($3,244.07)')).toEqual([]);
    expect(sim.execute({ kind: 'pro.join_sag', payload: {} }).error).toContain('“Your Career”');
    sim.must({ kind: READ_KIND, payload: { chapterId: 'career' } });
    expect(button(drawn(sim).html, 'Join SAG-AFTRA ($3,244.07)')).toMatchObject([{ locked: false, disabled: true }]);
  });
});
