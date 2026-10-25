/**
 * Brief 27, the series, releases and market cluster (2026-10-25): Part 13's "Use examples such as 9-1-1 and Slow Horses
 * only with verified starting facts. Generated future offers, characters, renewals, and cancellations must belong
 * explicitly to the simulation" and loop 40's "Use real-series starting facts accurately. Generated roles and future events
 * must be clearly simulated" (`REAL_SERIES`, `content/series.ts`). Held here: the two real series' baselines as the catalog
 * read them; nothing simulated for the baseline season, and every season after it the simulation's, its network's word
 * saying so; 9-1-1's seasons counted on from its tenth, Abbott Elementary's, whose number no page gives, named by their
 * years; a drawn part cast only in a season the game simulates and the network made; Productions And People tagging the
 * baseline Verified and each later season Simulated; and a player who worked in a simulated season told the network's word
 * as the game's.
 *
 * PLAYER JOURNEY: a graduate's Reese Pike on 9-1-1 in the season beginning in 2027, in a save whose network renewed it, the
 * offer accepted through the command and played by the clock, flown to Los Angeles and home; then the clock to the
 * network's next word. TEST SETUP, said where it's done: SAG-AFTRA membership; the clock on unplayed to the season; and the
 * offer on the record as casting's draws would leave one.
 */
import { describe, expect, it } from 'vitest';
import { MS_HOUR, zonedParts } from '@/engine/core/time';
import { projectById } from '@/engine/content/careerwork';
import { productionById } from '@/engine/content/catalog';
import { REAL_SERIES, decisionAt, seasonWindow, seriesById } from '@/engine/content/series';
import { decisionWords, decisionsTo, inProduction, seasonAudience, seasonMade, seasonName, seasonNumber, simulatedSeason } from '@/engine/systems/series';
import { datesOf, seriesPosts } from '@/engine/systems/projobs';
import { ensurePro } from '@/engine/systems/pro';
import { pageOf, refIndex } from '@/engine/systems/reference';
import type { Simulation } from '@/engine/core/simulation';
import { at, graduate, notices, played, student, tended } from './fakes/career-world';
import { offered } from './fakes/b27-series';

const NINE = seriesById('real-nine-one-one')!;
const ABBOTT = seriesById('real-abbott-elementary')!;
const GUEST = projectById('nine-one-one-guest')!;

/** The first save whose network's word on 9-1-1's season beginning in 2027 is `made`. */
function saveWhere(made: boolean, prefix: string): Simulation {
  for (let n = 0; n < 40; n += 1) {
    const sim = student(`${prefix}-${n}`);
    if (seasonMade(sim, NINE, 2027) === made) return sim;
  }
  throw new Error(`no save where 2027 is ${made}`);
}

describe('a real series continued by the simulation', () => {
  it('starts from the catalog’s baseline: 9-1-1’s tenth season, and the Abbott Elementary season on the air, whose number no page gives', () => {
    expect(REAL_SERIES.map((s) => s.id)).toEqual(['real-nine-one-one', 'real-abbott-elementary']);
    const p = productionById(NINE.real!.production)!;
    expect(p.seasons[0]).toMatchObject({ n: NINE.real!.baseline.season });
    expect(p.seasons[0]!.premiere).toMatchObject({ kind: 'read', value: 'October 15, 2026', source: NINE.real!.source });
    expect(NINE.real!.baseline.year).toBe(2026);
    expect(productionById(ABBOTT.real!.production)!.seasons).toEqual([]);
    expect(ABBOTT.real!.baseline.season).toBeUndefined();
    for (const s of REAL_SERIES) {
      expect(s.fictional).toBe(false);
      expect(productionById(s.real!.production)!.companies.some((c) => c.role === 'broadcaster')).toBe(true);
      expect(s.outlet).toBe('broadcast');
      expect(s.orderedThrough).toBe(s.real!.baseline.year);
    }
  });

  it('simulates nothing of the baseline season, and every season after it, its word saying it’s the game’s own; 9-1-1’s counted on from its tenth, Abbott Elementary’s by their years', () => {
    const sim = saveWhere(true, 'b27-real-made');
    expect(simulatedSeason(NINE, 2026)).toBe(false);
    expect(seasonAudience(sim, NINE, 2026)).toBeUndefined();
    expect(seasonAudience(sim, NINE, 2027)).toBeDefined();
    const first = decisionsTo(sim, NINE, 2027)[0]!;
    expect([first.year, first.at, first.what]).toEqual([2027, decisionAt(NINE, 2027), 'renewed']);
    expect(seasonNumber(sim, NINE, 2026)).toBe(10);
    expect(seasonNumber(sim, NINE, 2027)).toBe(11);
    expect(seasonName(sim, NINE, 2027)).toBe('the eleventh season');
    const words = decisionWords(sim, NINE, first);
    expect(words).toBe('On May 15, 2027, in the game’s simulation, the network renewed 9-1-1 for a season beginning in July, its eleventh. It’s the game’s own continuation of the real series, not an announcement.');
    // Abbott Elementary's seasons by their years, never a number its pages don't give.
    expect(seasonName(sim, ABBOTT, 2027)).toBe('the season beginning in 2027');
    const a = decisionsTo(sim, ABBOTT, 2027)[0]!;
    expect(decisionWords(sim, ABBOTT, a)).not.toMatch(/its (first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh)/);
    expect(decisionWords(sim, ABBOTT, a)).toContain('in the game’s simulation');
  });

  it('casts a part drawn from it only in a season the game simulates and the network made', () => {
    const made = saveWhere(true, 'b27-real-cast');
    const canceled = saveWhere(false, 'b27-real-cancel');
    // Posted in the autumn of 2026, its days fall in the real tenth season: never cast.
    const autumn = at(2026, 10, 5);
    expect(inProduction(made, NINE.id, datesOf({ projectId: GUEST.id, postedAt: autumn }), autumn)).toBe(false);
    expect(seriesPosts(made, GUEST, datesOf({ projectId: GUEST.id, postedAt: autumn }), autumn)).toBe(false);
    // Posted for the season beginning in 2027: cast where the network made it, never where it didn't.
    const summer = at(2027, 8, 2);
    const days = datesOf({ projectId: GUEST.id, postedAt: summer });
    expect(zonedParts(days[0]!.from, 'America/New_York').year).toBe(2027);
    expect(days[0]!.from).toBeGreaterThanOrEqual(seasonWindow(NINE, 2027).from);
    expect(seriesPosts(made, GUEST, days, summer)).toBe(true);
    expect(seriesPosts(canceled, GUEST, days, summer)).toBe(false);
  });

  it('is tagged in Productions And People: the baseline Verified, each season after it Simulated, its page linked from the production’s', () => {
    const sim = saveWhere(true, 'b27-real-ref');
    tended(sim, at(2027, 5, 20));
    const prod = pageOf(sim, sim.player, { kind: 'production', id: NINE.real!.production })!;
    const link = prod.sections.flatMap((x) => x.facts).find((f) => f.label === 'Its Seasons In The Game')!;
    expect(link).toMatchObject({ known: 'simulated', to: { kind: 'series', id: NINE.id } });
    expect(link.words).toContain('It’s the game’s own continuation of the real series, not an announcement.');
    const page = pageOf(sim, sim.player, { kind: 'series', id: NINE.id })!;
    const seasons = page.sections.find((x) => x.title === 'Seasons')!.facts;
    expect(seasons[0]).toMatchObject({ label: 'The Tenth Season', known: 'verified' });
    expect(seasons[1]).toMatchObject({ label: 'The Eleventh Season (Simulated)', known: 'simulated' });
    expect(page.what).toContain('every season after it is the game’s simulation, never an announcement');
    expect(pageOf(sim, sim.player, { kind: 'season', id: NINE.id, season: 2026 })).toBeUndefined();
    expect(pageOf(sim, sim.player, { kind: 'season', id: NINE.id, season: 2027 })!.what).toContain('this season is the game’s own continuation of it, not an announcement');
    // Listed with the productions the game read, not among the series it invents.
    expect(refIndex(sim, sim.player).find((g) => g.title === 'Series')!.entries.some((x) => x.key.id === NINE.id)).toBe(false);
  });

  it('PLAYER JOURNEY: a part worked in a simulated season of 9-1-1 hears the network’s next word as the game’s', () => {
    let sim: Simulation | undefined;
    for (let n = 0; n < 40 && !sim; n += 1) {
      const s = graduate(`b27-real-journey-${n}`);
      if (seasonMade(s, NINE, 2027)) sim = s;
    }
    // TEST SETUP: SAG-AFTRA membership, and the clock on unplayed to the season beginning in 2027.
    ensurePro(sim!, sim!.player).sag = { eligibleSince: sim!.now - 60 * 86_400_000, memberSince: sim!.now - 30 * 86_400_000 };
    tended(sim!, at(2027, 8, 2));
    const o = offered(sim!, GUEST, at(2027, 8, 2));
    const id = sim!.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    const e = sim!.player.pro!.engagements.find((x) => x.id === id)!;
    played(sim!, e.days.at(-1)!.to + 3 * 86_400_000);
    expect(e.status).toBe('finished');
    const word = decisionsTo(sim!, NINE, 2028).find((d) => d.year === 2028)!;
    sim!.advanceTo(word.at + MS_HOUR);
    const said = notices(sim!).find((n) => n.startsWith(`9-1-1 Is ${word.what === 'renewed' ? 'Renewed' : 'Canceled'} | `))!;
    expect(said).toContain('in the game’s simulation');
    expect(said).toContain('It’s the game’s own continuation of the real series, not an announcement.');
  }, 900_000);
});
