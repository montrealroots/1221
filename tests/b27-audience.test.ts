/**
 * Brief 27, K6 (2026-10-25): a season's audience, the game's simulation and said so (loop 36), read by the network's word
 * on another season (loop 38: "evaluate the project's simulated commercial, creative, contractual, and strategic
 * circumstances ... Do not reduce every renewal decision to one viewer threshold"). Held here: a broadcast series counted
 * in viewers and a streaming one in hours viewed, never the one as the other; the chance of another season moved by the
 * last season's audience, its reviews and the series' age; the network's word following that chance, where the series' own
 * chance alone would have said otherwise; the decision's words saying what was read; and the Charts And Awards tab showing
 * a series the player worked on, each finished season's audience said to be the game's.
 *
 * PLAYER JOURNEY: a graduate's co-star part on The Calloway Files, accepted through the command and played by the clock,
 * then the clock to the season's end. TEST SETUP, said where it's done: the offer on the record as casting writes one.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { projectById } from '@/engine/content/careerwork';
import { SERIES, decisionAt, type SeriesTemplate } from '@/engine/content/series';
import { seriesOfYear } from '@/engine/systems/slate';
import { AUDIENCE, RENEW_WEIGHTS, audienceWords, decisionWords, decisionsTo, outletOf, renewChance, seasonAudience } from '@/engine/systems/series';
import { ensurePro, type Opportunity } from '@/engine/systems/pro';
import { payTermsOf } from '@/engine/systems/projobs';
import { at, graduate, played, student } from './fakes/career-world';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'industry' }));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? h.tab : initial) as T, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
function drawn(sim: Simulation): string {
  h.sim = sim;
  h.tab = 'industry';
  return words(renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })));
}

const CALLOWAY = SERIES[0]!;

describe('a season’s audience', () => {
  it('is counted in viewers for a broadcast series and in hours viewed for a streaming one, the same unit every season, and never a published figure', () => {
    const sim = student('b27-audience-units');
    const streamed: SeriesTemplate = { ...CALLOWAY, id: 'test-streamed', outlet: 'streaming' };
    for (let y = CALLOWAY.firstSeason; y < CALLOWAY.firstSeason + 12; y += 1) {
      expect(seasonAudience(sim, CALLOWAY, y)!.unit).toBe('viewers');
      expect(seasonAudience(sim, streamed, y)!.unit).toBe('hours');
    }
    expect(audienceWords({ unit: 'viewers', average: 6.2, critics: 70 })).toBe('6.2 million viewers an episode');
    expect(audienceWords({ unit: 'hours', average: 18.4, critics: 70 })).toBe('18.4 million hours viewed a week');
    // The slate's series have their outlet by their kind: a serialized series streams.
    const slate = seriesOfYear(sim, 2027);
    expect(slate.length).toBeGreaterThan(0);
    for (const s of slate) expect(outletOf(s)).toBe(s.id.includes('serialized') ? 'streaming' : 'broadcast');
    // A first season within its outlet's range.
    const first = seasonAudience(sim, CALLOWAY, CALLOWAY.firstSeason)!.average;
    expect(first).toBeGreaterThanOrEqual(AUDIENCE.broadcast.first[0]);
    expect(first).toBeLessThanOrEqual(AUDIENCE.broadcast.first[1]);
  });

  it('moves the network’s chance of another season by the last season’s audience, its reviews and the series’ age, within its bounds', () => {
    const sim = student('b27-audience-chance');
    // The falsifiability test: the same series, the same year, its audience and reviews all that differ between twins.
    const twins = Array.from({ length: 30 }, (_, n) => ({ ...CALLOWAY, id: `test-twin-${n}` }));
    const year = 2030;
    const read = twins.map((s) => ({ a: seasonAudience(sim, s, year - 1)!, p: renewChance(sim, s, year) }));
    expect(new Set(read.map((r) => r.p)).size).toBeGreaterThan(10);
    for (const r of read) {
      const audience = Math.max(-1, Math.min(1, r.a.average / AUDIENCE.broadcast.bar - 1));
      const critics = (r.a.critics - AUDIENCE.critics.middle) / (AUDIENCE.critics.most - AUDIENCE.critics.middle);
      const age = Math.max(0, year - CALLOWAY.firstSeason - RENEW_WEIGHTS.age.after) * RENEW_WEIGHTS.age.each;
      expect(r.p).toBeCloseTo(Math.max(RENEW_WEIGHTS.least, Math.min(RENEW_WEIGHTS.most, CALLOWAY.chance.renew + RENEW_WEIGHTS.audience * audience + RENEW_WEIGHTS.critics * critics - age)), 10);
    }
    // A bigger audience, a likelier season: the half watched most is likelier renewed than the half watched least.
    const sorted = [...read].sort((a, b) => a.a.average - b.a.average);
    const mean = (xs: typeof read) => xs.reduce((n, r) => n + r.p, 0) / xs.length;
    expect(mean(sorted.slice(15))).toBeGreaterThan(mean(sorted.slice(0, 15)));
    // And a series long running less likely: the same season's figures read in its fifteenth year.
    const late = renewChance(sim, { ...twins[0]!, firstSeason: year - 15 }, year);
    expect(late).toBeLessThanOrEqual(renewChance(sim, twins[0]!, year));
  });

  it('is what the network’s word follows, where the series’ own chance alone would have said otherwise, and the word says what it read', () => {
    const sim = student('b27-audience-word');
    let differs = 0;
    for (let n = 0; n < 200 && differs < 3; n += 1) {
      const s: SeriesTemplate = { ...CALLOWAY, id: `test-word-${n}`, orderedThrough: 2029 };
      const d = decisionsTo(sim, s, 2030)[0]!;
      const draw = sim.rng('pro.series', s.id, 2030).next();
      expect(d.what).toBe(draw < renewChance(sim, s, 2030) ? 'renewed' : 'canceled');
      if ((draw < s.chance.renew) !== (draw < renewChance(sim, s, 2030))) differs += 1;
    }
    expect(differs).toBeGreaterThan(0);
    const d = decisionsTo(sim, CALLOWAY, 2030)[0]!;
    const a = seasonAudience(sim, CALLOWAY, 2029)!;
    expect(decisionWords(sim, CALLOWAY, d)).toContain(`Its last season averaged ${audienceWords(a)} and critics scored it ${a.critics} of 100, both the game’s estimates.`);
    expect(d.at).toBe(decisionAt(CALLOWAY, 2030));
  });

  it('PLAYER JOURNEY: the Charts And Awards tab shows a series the player worked on, its finished season’s audience and reviews said to be the game’s', () => {
    const sim = graduate('b27-audience-tab');
    ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
    // TEST SETUP: an offer for the co-star part, written as casting writes one.
    const t = projectById('calloway-files')!;
    const postedAt = at(2026, 9, 7);
    const terms = payTermsOf({ projectId: t.id, postedAt });
    const o: Opportunity = { id: sim.nextId('pro'), projectId: t.id, via: 'open', status: 'offered', postedAt, submitBy: postedAt + 7 * MS_DAY, history: [], counts: {}, offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units } };
    sim.player.pro!.opportunities.push(o);
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    // Its seasons before the player's, the seventh the last finished; the eighth, the player's, still to finish.
    const before = drawn(sim);
    expect(before).toContain('Your Series On Screen');
    expect(before).toContain(`Its seventh season: ${audienceWords(seasonAudience(sim, CALLOWAY, 2025)!)}`);
    expect(before).not.toContain('Its eighth season:');
    const e = sim.player.pro!.engagements[0]!;
    played(sim, e.days.at(-1)!.to + MS_HOUR);
    // The eighth season ends in May 2027.
    sim.advanceTo(at(2027, 6, 2));
    const a = seasonAudience(sim, CALLOWAY, 2026)!;
    const shown = drawn(sim);
    expect(shown).toContain(`Its eighth season: ${audienceWords(a)}, critics ${a.critics} of 100.`);
    expect(shown).toContain('the game’s simulation for series it invents, never a published figure');
  }, 240_000);
});
