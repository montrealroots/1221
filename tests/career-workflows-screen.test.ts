/**
 * Brief 25's Module 5 played on the screens (from 2026-10-24; `docs/verification/career-world-2026-10-23/criteria.md`,
 * W13): one life books a voice session, a multicamera week and an action shoot, works each through the clock and the
 * commands, and reads the Work tab and the Opportunities tab at each stage, saved and loaded between them. The choices are
 * the Work tab's buttons, pressed through the commands they name.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { projectById } from '@/engine/content/careerwork';
import { ensurePro, type Engagement, type Opportunity } from '@/engine/systems/pro';
import { payTermsOf } from '@/engine/systems/projobs';
import { at, graduate, played, reload } from './fakes/career-world';

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

/** A screen's words, every tooltip taken out before the tags. */
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
function drawn(sim: Simulation, tab: 'work' | 'opportunities'): { html: string; shown: string } {
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
const accept = (sim: Simulation, o: Opportunity): Engagement => { sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }); return sim.player.pro!.engagements.find((e) => e.opportunityId === o.id)!; };
const engagementIn = (sim: Simulation, id: string): Engagement => sim.player.pro!.engagements.find((x) => x.id === id)!;

describe('W13: three ways of working, played on the screens', () => {
  it('WF-21, WF-24, CONT-01, PLAYER JOURNEY: a voice session, a multicamera week and an action shoot, each read and chosen on the Work tab, prepared on the Opportunities tab, worked through the clock, its days’ reports kept, saved and loaded at each stage', () => {
    let sim = graduate('workflows-screens');
    ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
    // This graduate started without the guide, so every control is open (its gates are tests/tutorial.test.ts's).
    const voice = accept(sim, offerFor(sim, 'lantern-row', at(2026, 9, 7)));
    const week = accept(sim, offerFor(sim, 'half-past-normal', at(2026, 9, 28)));
    const action = accept(sim, offerFor(sim, 'breakwater', at(2026, 10, 26)));

    // Before any of it: each engagement says how its work is done, and its choices are buttons, pressable.
    let screen = drawn(sim, 'work');
    expect(screen.shown).toContain('How The Work Is Done');
    expect(screen.shown).toContain('Voice In The Booth How This Works An Animated Series. An animated series, an episode’s lines recorded in a session every other week.');
    expect(screen.shown).toContain('Multicamera Before A Studio Audience How This Works A Multicamera Comedy.');
    expect(screen.shown).toContain('Action How This Works An Action Feature.');
    expect(screen.shown).toContain('Its own preparation, Find The Voice: The character’s voice found and kept');
    expect(screen.shown).toContain('Refuse Them: If a session asks for screams or other vocally stressful lines it didn’t announce beforehand, you decline them, as the agreement allows.');
    for (const label of ['Refuse Them', 'Play To The House', 'Play To The Cameras', 'Ask For Another Take', 'Do It Yourself']) expect(button(screen.html, label), label).toEqual([{ disabled: false, locked: false }]);
    // The contract's rules, among its terms.
    expect(screen.shown).toContain('Every day of the week is paid from the first rehearsal, the table read included');
    expect(screen.shown).toContain('A stunt is done by you only with your consent, given before it, and with a qualified stunt coordinator there and consulted, as the agreement sets.');
    // On the Opportunities tab, the booked voice part's own preparation, and no lines to learn.
    const opps = drawn(sim, 'opportunities');
    expect(button(opps.html, 'Find The Voice (45 Minutes)')).toHaveLength(1);
    expect(button(opps.html, 'Learn The Lines (60 Minutes)').length).toBe(2);

    // The voice session, Find The Voice done, worked; saved and loaded.
    for (let n = 0; n < 6 && !sim.execute({ kind: 'pro.prepare', payload: { engagementId: voice.id, step: 'special' } }).ok; n += 1) played(sim, sim.now + 2 * MS_HOUR);
    played(sim, voice.days[0]!.to + MS_HOUR);
    sim = reload(sim);
    screen = drawn(sim, 'work');
    expect(screen.shown).toContain('Each Day’s Report (1)');
    expect(screen.shown).toMatch(/Recording Session 1: (The pages were revised the night before: about \d+% of your script changed\. )?Shot in this order: Scene \d+, Scene \d+, Scene \d+ and Scene \d+, in the script’s order\./);
    expect(screen.shown).toMatch(/Your voice’s strain went from 0 to \d+ of 100\./);
    expect(screen.shown).toMatch(/Your voice’s strain now: \d+ of 100\./);

    // The multicamera week, Play To The Cameras pressed; then its five days through the clock, its pages rewritten as a
    // multicamera week's often are, which a day's report says first.
    sim.must({ kind: 'pro.work_choice', payload: { engagementId: week.id, decision: 'audience', option: 'cameras' } });
    played(sim, week.days.at(-1)!.to + MS_HOUR);
    sim = reload(sim);
    const done = engagementIn(sim, week.id);
    expect(done.reports!.map((r) => r.step)).toEqual(['table-read', 'blocking', 'blocking', 'blocking', 'tape-night']);
    expect(done.reports![4]!.choices).toEqual({ audience: 'cameras' });
    screen = drawn(sim, 'work');
    expect(screen.shown).toContain('Each Day’s Report (5)');
    expect(screen.shown).toMatch(/Tape Night: (The pages were revised the night before: about \d+% of your lines changed\. )?Shot in this order: Scene \d+, Scene \d+, Scene \d+ and Scene \d+, in the script’s order\./);
    expect(screen.shown).toMatch(/Table Read: (The pages were revised the night before: about \d+% of your lines changed\. )?A table read: you worked on the breakdown and the lines\./);

    // The action shoot: the fight rehearsed on its own days, the stunts done by the double, as the player hasn't chosen otherwise.
    played(sim, action.days[3]!.to + MS_HOUR);
    sim = reload(sim);
    const shoot = engagementIn(sim, action.id);
    expect(shoot.prep!.special!).toBeGreaterThan(0.5);
    const stunt = shoot.units!.find((u) => u.day === 3 && u.stunt)!;
    expect(stunt.by).toBe('double');
    screen = drawn(sim, 'work');
    expect(screen.shown).toContain('the stunt by the double, your close-ups cut in');
    expect(screen.shown).toMatch(/Fight Rehearsal 1: (The pages were revised the night before: about \d+% of your lines changed\. )?A fight rehearsal: you worked on the blocking and the fights\./);
    expect(screen.shown).toContain('Use The Double, now: The stunt double does the stunts');
  });
});
