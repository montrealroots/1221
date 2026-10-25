/**
 * Brief 27, offers and auditions (2026-10-25), on the Career screen's Opportunities tab (`src/ui/career/OpportunitiesPane.tsx`),
 * drawn over real saves as tests/pro-opportunities-screen.test.ts draws it: react-dom/server, `useGame` standing in for the
 * provider with `run` the save's own `execute`. Held here, from the cluster's review: Tape It records a take and sends it, so
 * after the day's three takes it's grayed with the day's limit as its reason, as the command refuses it (until the review
 * it read the self-tape's own rules alone and showed enabled); and a part whose playing ages casting changed shows the new
 * ages, said as changed, and the change in casting's words (until then the card printed the part's first range).
 *
 * PLAYER JOURNEYS play through the clock and the commands a player sends (tests/fakes/career-world.ts); TEST SETUP marks
 * state set by hand: the self-tape asked for, as casting's answer sets one, and an offer with its changed requirement, as
 * casting's draws would leave one.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, addDays, instantFromZoned, zonedParts } from '@/engine/core/time';
import { PROJECTS } from '@/engine/content/careerwork';
import type { Opportunity } from '@/engine/systems/pro';
import { TAPE_DUE_KIND, payTermsOf, travels, writtenFor } from '@/engine/systems/projobs';
import { graduate, played } from './fakes/career-world';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? 'opportunities' : initial) as T, () => undefined] as const };
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

const NY = 'America/New_York';
function drawn(sim: Simulation): { html: string; shown: string } {
  h.sim = sim;
  const html = renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '');
  return { html, shown: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
const button = (html: string, label: string) => [...html.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].filter((m) => m[2] === label).map((m) => ({ disabled: m[1]!.includes('disabled=""'), title: /title="([^"]*)"/.exec(m[1]!)?.[1] }));

describe('the Opportunities tab, offers and auditions', () => {
  it('PLAYER JOURNEY: three takes recorded today, Tape It and Record A Take are grayed with the day’s limit as the reason, as the command refuses them; each take is listed with Send This Take', () => {
    const sim = graduate('b27-screen-takes');
    const t = PROJECTS.find((x) => x.stages.audition === 'self-tape' && !travels(sim.player, x) && writtenFor(x, sim.player))!;
    // TEST SETUP: the self-tape asked for, due three weekdays on in the evening, as casting's answer sets one.
    let d = addDays(sim.now, 3, NY);
    while ([0, 6].includes(zonedParts(d, NY).weekday)) d = addDays(d, 1, NY);
    const p = zonedParts(d, NY);
    const due = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 18, minute: 0 }, NY);
    const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'audition', postedAt: sim.now, submitBy: sim.now + 7 * MS_DAY, history: [], counts: {}, rounds: [{ round: 'audition', form: 'self-tape', at: due, status: 'set' }] };
    sim.player.pro!.opportunities.push(o);
    sim.schedule({ at: due, kind: TAPE_DUE_KIND, label: `Self-Tape Due: ${t.role.part}, ${t.project}`, category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id, round: 0 } });
    // The next morning at ten, awake, so the three takes fall on one day.
    const q = zonedParts(addDays(sim.now, 1, NY), NY);
    played(sim, instantFromZoned({ year: q.year, month: q.month, day: q.day, hour: 10, minute: 0 }, NY));
    const before = drawn(sim);
    expect(button(before.html, 'Tape It')[0]!.disabled).toBe(false);
    for (let n = 0; n < 3; n += 1) sim.must({ kind: 'pro.record_take', payload: { opportunityId: o.id } });
    const limit = 'You’ve recorded three takes today, as many as a day allows. Record more tomorrow, or send one.';
    expect(sim.execute({ kind: 'pro.tape_audition', payload: { opportunityId: o.id } }).error).toBe(limit);
    const { html, shown } = drawn(sim);
    expect(button(html, 'Tape It')).toEqual([{ disabled: true, title: limit }]);
    expect(button(html, 'Record A Take')).toEqual([{ disabled: true, title: limit }]);
    expect(shown).toContain(`Not now: ${limit}`);
    expect(button(html, 'Send This Take').map((b) => b.disabled)).toEqual([false, false, false]);
    expect(shown).toMatch(/Take 1, \w+day, \w+ \d+, \d{4} at 10:00 AM: (Unready|Working|Strong|Exceptional), \d+\.\d\./);
  }, 240_000);

  it('PLAYER JOURNEY: an offer for a part whose playing ages casting changed shows the new ages, said as changed, and the change in casting’s words while it’s in the running', () => {
    const sim = graduate('b27-screen-rewrite');
    const t = PROJECTS.find((x) => !travels(sim.player, x) && writtenFor(x, sim.player) && payTermsOf({ projectId: x.id, postedAt: sim.now }).each !== undefined)!;
    const ages: readonly [number, number] = [t.requirements.ages[0] + 8, t.requirements.ages[1] + 8];
    const words = `${t.casting} rewrote ${t.role.part} for actors who play ${ages[0]} to ${ages[1]}, where it had asked for ${t.requirements.ages[0]} to ${t.requirements.ages[1]}.`;
    // TEST SETUP: the part in the running with its requirement changed at the cut, as `rewriteAt` leaves one.
    const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'callback', postedAt: sim.now, submitBy: sim.now + 7 * MS_DAY, history: [], counts: {}, rounds: [{ round: 'audition', form: t.stages.audition, at: sim.now - MS_DAY, status: 'done', band: 'strong', overall: 70, casting: { at: sim.now, chance: 0.5, fit: 0.5, yes: true } }], rewrite: { at: sim.now, ages, words } };
    sim.player.pro!.opportunities.push(o);
    expect(drawn(sim).shown).toContain(words);
    // TEST SETUP: then offered, as casting's draws would leave it.
    const terms = payTermsOf({ projectId: t.id, postedAt: sim.now });
    Object.assign(o, { status: 'offered', offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, amount: terms.each, per: terms.per, units: terms.units } });
    const { shown } = drawn(sim);
    expect(shown).toContain(`Playing ages ${ages[0]} to ${ages[1]}, as casting changed them.`);
    expect(shown).not.toContain(`Playing ages ${t.requirements.ages[0]} to ${t.requirements.ages[1]}.`);
  }, 240_000);
});
