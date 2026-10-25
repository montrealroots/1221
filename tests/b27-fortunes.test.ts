/**
 * Brief 27, the series, releases and market cluster (2026-10-25): Part 12's "A strong player performance must matter
 * without guaranteeing a hit" and loop 35's "Project success depends on multiple project-level factors, including but not
 * limited to the player's performance" (`systems/market.ts`, `FORTUNE`). Held here: a part's weight by its size and band;
 * a film's opening and reception moved by it, a lead's more than a co-star's, and never decided by it; a released film's
 * run keeping its US and abroad totals in one currency, with its reception, said as the game's; the falsifiability twin,
 * the same production with a strong and a weak part; a season's audience and the network's chance moved by the player's
 * judged days, posted as they're judged, kept through a save and read only up to the word that follows the season.
 *
 * PLAYER JOURNEYS: a graduate played by the clock to the wrap and the release (tests/fakes/career-world.ts), the offer
 * accepted through the command. TEST SETUP, said where it's done: the offer on the record as casting's draws would leave
 * one; the credit's band set as a judge would have left it, for the twin; and a copy of The Calloway Files whose order runs
 * out in 2026, so the network's next word reads the season the player worked in.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { SERIES, decisionAt } from '@/engine/content/series';
import { FORTUNE, markWork, qualityOf, responseOf, runOf, seasonTerm, termOf } from '@/engine/systems/market';
import { decisionWords, renewChance, seasonAudience, seasonAudienceWith } from '@/engine/systems/series';
import { totalsOf, weeksSoFar } from '@/engine/systems/charts';
import { pageOf, projectKey } from '@/engine/systems/reference';
import type { ProCredit } from '@/engine/systems/pro';
import { graduate, notices, reload } from './fakes/career-world';
import { part, slateFilm, wrapped } from './fakes/b27-series';

const CALLOWAY = SERIES[0]!;
const credit = (band: ProCredit['band']): ProCredit => ({ id: 'c', kind: 'screen', project: 'p', role: 'r', company: 'c', year: 2027, medium: 'film', status: 'released', at: 0, ...(band ? { band } : {}) });

describe('a part’s weight in a release’s fortunes', () => {
  it('weighs a part by its size and its band: a lead’s in full, a co-star’s a quarter, unready work against', () => {
    expect([termOf('lead', 'exceptional'), termOf('supporting', 'exceptional'), termOf('co-star', 'exceptional'), termOf('lead', 'strong'), termOf('lead', 'working'), termOf('lead', 'unready'), termOf('lead', undefined)])
      .toEqual([1, FORTUNE.size.supporting, FORTUNE.size['co-star'], 0.5, 0, -1, 0]);
  });

  it('lifts a film’s opening and its reception with the part, a lead’s more than a co-star’s, and never decides it alone', () => {
    const sim = graduate('b27-fortune-rule');
    const { t } = slateFilm(sim, 'on-time');
    const lead = { ...t, role: { ...t.role, size: 'lead' as const } };
    const costar = { ...t, role: { ...t.role, size: 'co-star' as const } };
    const at = sim.now + 300 * MS_DAY;
    const open = (x: typeof t, band: ProCredit['band']) => runOf(sim, x, credit(band), at)!.weeks[0]!.gross;
    // The same production: only the part differs.
    expect(open(lead, 'exceptional')).toBeGreaterThan(open(lead, 'unready'));
    expect(open(lead, 'exceptional') / open(lead, 'working')).toBeCloseTo(Math.exp(FORTUNE.gross), 2);
    expect(open(costar, 'exceptional') / open(costar, 'working')).toBeCloseTo(Math.exp(FORTUNE.gross * FORTUNE.size['co-star']), 2);
    expect(runOf(sim, lead, credit('exceptional'), at)!.response!.critics).toBeGreaterThan(runOf(sim, lead, credit('unready'), at)!.response!.critics);
    // Never alone: across many productions an exceptional lead's film often opens below another production's unready one.
    let below = 0;
    let n = 0;
    for (let w = 1; w < 120 && n < 40; w += 1) {
      const a = slateFilm(sim, 'on-time', () => true, w);
      const b = slateFilm(sim, 'on-time', (x) => x.slate!.production !== a.t.slate!.production, w + 1);
      if (a.t.kind !== b.t.kind) continue;
      n += 1;
      if (open({ ...a.t, role: { ...a.t.role, size: 'lead' } }, 'exceptional') < open({ ...b.t, role: { ...b.t.role, size: 'lead' } }, 'unready')) below += 1;
    }
    expect(n).toBeGreaterThan(10);
    expect(below).toBeGreaterThan(0);
    expect(below).toBeLessThan(n);
  });

  it('reads the reception from the production’s own quality and the part, each within its bounds', () => {
    const sim = graduate('b27-fortune-response');
    for (let k = 0; k < 30; k += 1) {
      const t = { project: `test-quality-${k}` };
      const q = qualityOf(sim, t);
      expect(Math.abs(q)).toBeLessThanOrEqual(1);
      const r = responseOf(sim, t, 1, q);
      for (const v of [r.critics, r.audience]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
    }
  });
});

describe('a released film in the game’s own chart', () => {
  it('PLAYER JOURNEY: keeps its weeks at home and abroad in US dollars, its worldwide sum and its reception, said as the game’s; and the twin, the same film with a weak part, opens lower', () => {
    const seed = 'b27-fortune-film';
    const sim = graduate(seed);
    const { t, week } = slateFilm(sim, 'on-time');
    const { c, due } = wrapped(sim, t, week);
    // TEST SETUP: the work judged Strong, as a judge would have left it.
    c!.band = 'strong';
    sim.advanceTo(due! + 30 * MS_DAY);
    const run = c!.run!;
    expect(run.currency).toBe('USD');
    expect(run.response).toBeDefined();
    const totals = totalsOf(run, sim.now);
    expect(totals.domestic).toBe(weeksSoFar(run, sim.now).reduce((n, w) => n + w.gross, 0));
    expect(totals.international).toBeGreaterThan(0);
    expect(totals.worldwide).toBe(totals.domestic + totals.international!);
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Is Released | ${t.project} is out in cinemas`))).toBe(true);
    // Where the player reads it: the project's page, each figure tagged as the game's.
    const page = pageOf(sim, sim.player, projectKey(t))!;
    const facts = page.sections.flatMap((x) => x.facts);
    expect(facts.find((f) => f.label === 'Box Office')).toEqual(expect.objectContaining({ known: 'simulated' }));
    expect(facts.find((f) => f.label === 'Box Office')!.words).toContain('all in US dollars, the game’s estimates');
    expect(facts.find((f) => f.label === 'Reception')!.words).toBe(`Critics ${run.response!.critics} of 100, audiences ${run.response!.audience} of 100, the game’s estimates.`);
    // Kept through a save as it was.
    const back = reload(sim);
    expect(back.player.pro!.credits.find((x) => x.id === c!.id)!.run).toEqual(run);
    // The falsifiability twin: the same seed, the same film, the work judged Unready.
    const twin = graduate(seed);
    const again = slateFilm(twin, 'on-time');
    expect(again.t.id).toBe(t.id);
    const w = wrapped(twin, again.t, again.week);
    w.c!.band = 'unready';
    twin.advanceTo(w.due! + 30 * MS_DAY);
    expect(w.c!.run!.weeks[0]!.gross).toBeLessThan(run.weeks[0]!.gross);
    expect(w.c!.run!.response!.critics).toBeLessThan(run.response!.critics);
  }, 600_000);
});

describe('a season’s audience reads the player’s part in it', () => {
  it('PLAYER JOURNEY: posts each judged day of series work, moves the season’s audience and the network’s chance, keeps it through a save, and reads only what came before the next word', () => {
    const sim = graduate('b27-fortune-season');
    const { e } = wrapped(sim, part('calloway-files'), sim.now + 7 * MS_DAY);
    const marks = sim.player.pro!.seasonMarks![CALLOWAY.id]!;
    expect(marks.length).toBe(e.log!.filter((l) => l.band).length);
    expect(marks.every((m) => m.y === 2026)).toBe(true);
    const term = seasonTerm(sim, CALLOWAY, 2026);
    expect(term).toBeCloseTo(marks.reduce((n, m) => n + m.v, 0) / marks.length, 10);
    expect(seasonAudience(sim, CALLOWAY, 2026)).toEqual(seasonAudienceWith(sim, CALLOWAY, 2026, term));
    // The falsifiability twin: the same season with the part judged otherwise moves the audience and the reviews.
    const strong = seasonAudienceWith(sim, CALLOWAY, 2026, 0.25)!;
    const weak = seasonAudienceWith(sim, CALLOWAY, 2026, -0.25)!;
    expect(strong.average).toBeGreaterThan(weak.average);
    expect(strong.critics).toBeGreaterThanOrEqual(weak.critics);
    // TEST SETUP: a copy of the series whose order runs out in 2026, so its word in May 2027 reads the season.
    const copy = { ...CALLOWAY, orderedThrough: 2026 };
    // TEST SETUP: the same days judged Exceptional and then Unready, the postings as the work day would leave them.
    const played = marks.map((m) => ({ ...m }));
    const judgedAs = (v: number) => { marks.splice(0, marks.length, ...played.map((m) => ({ ...m, v }))); return renewChance(sim, copy, 2027); };
    expect(judgedAs(termOf('co-star', 'exceptional'))).toBeGreaterThan(judgedAs(termOf('co-star', 'unready')));
    marks.splice(0, marks.length, ...played);
    expect(decisionWords(sim, copy, { year: 2027, at: decisionAt(copy, 2027), what: 'renewed' })).toContain(`Its last season averaged ${seasonAudience(sim, copy, 2026)!.average.toFixed(1)} million viewers an episode`);
    // A posting after the word that follows the season is never read by it.
    const before = seasonAudience(sim, CALLOWAY, 2026);
    const posted = marks.length;
    markWork(sim.player, { ...e, contract: undefined }, { ...part('calloway-files'), role: { ...part('calloway-files').role, size: 'lead' } }, { at: decisionAt(CALLOWAY, 2027) + MS_HOUR, band: 'exceptional' });
    expect(sim.player.pro!.seasonMarks![CALLOWAY.id]!.length).toBe(posted + 1);
    expect(seasonAudience(sim, CALLOWAY, 2026)).toEqual(before);
    // Kept through a save.
    const back = reload(sim);
    expect(back.player.pro!.seasonMarks).toEqual(sim.player.pro!.seasonMarks);
    expect(seasonAudience(back, CALLOWAY, 2026)).toEqual(before);
  }, 600_000);
});
