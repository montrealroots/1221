/**
 * Brief 27, the series, releases and market cluster (2026-10-25): loop 33's "Possible alternatives: ... Different
 * distributor. Limited release." and Part 12's "Limited and wider releases" and "Territory-specific releases"
 * (`RELEASE_FATE`, `routeOf`, `systems/market.ts`). Held here: the routes at about their chances from what was the on-time
 * share, never another distributor for a series' season and none for a fixed part; a limited release, said, opening in a
 * few cinemas at a share of its wide opening; a release by another distributor, said at its first date with the company
 * and the new date, out at the later one, its premiere and its Actor Awards year the later; and a release abroad first,
 * said, its weeks abroad before its US opening, and the Actor Awards placing it by its run at home, or not at all where the
 * two fall in different years.
 *
 * From the review of 2026-10-25: a limited release widens exactly where audiences score it at the bar, the same film with
 * a weaker part never reaching its wide opening; a week abroad is the week at home's share, so a run's takings abroad keep
 * to its kind's range whether it opened wide, in a few cinemas and widened, or never widened; and a film abroad first shows
 * in Productions And People from its first week abroad. Until then a limited release that never widened took twice its US
 * gross abroad, and nothing tested that a limited release ever stayed small.
 *
 * PLAYER JOURNEYS: a graduate played by the clock to the wrap (tests/fakes/career-world.ts), the offer accepted through the
 * command, then the clock to the release. Each film is found where its production's own draw gives the route, never
 * forced. TEST SETUP, said where it's done: the offer on the record as casting's draws would leave one; a credit built
 * for the rule checks.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, addDays, instantFromZoned, zonedParts } from '@/engine/core/time';
import { PROJECTS } from '@/engine/content/careerwork';
import { productionsOf, seriesOfYear, seriesParts } from '@/engine/systems/slate';
import { premiereOf } from '@/engine/systems/awards';
import { actorCheck } from '@/engine/systems/actorawards';
import { INTERNATIONAL, LIMITED, totalsOf } from '@/engine/systems/charts';
import { FORTUNE, homeOpening, runOf, splitYearsWhy } from '@/engine/systems/market';
import { creditWords, pageOf, projectKey } from '@/engine/systems/reference';
import type { ProCredit } from '@/engine/systems/pro';
import { RELEASE_FATE, releaseFate } from '@/engine/systems/projobs';
import { formatOf } from '@/engine/systems/workflow';
import { graduate, notices } from './fakes/career-world';
import { WEEK, wrappedFilm } from './fakes/b27-series';

const NY = 'America/New_York';

describe('a finished production’s other ways out', () => {
  it('come at about their chances from the on-time share, never another distributor for a series’ season, none for a fixed part', () => {
    const sim = graduate('b27-routes-rule');
    for (const t of PROJECTS) expect(releaseFate(sim, t), t.id).toEqual({ kind: 'on-time' });
    const counts: Record<string, number> = {};
    let n = 0;
    for (let w = 1; w <= 260; w += 1) for (const p of productionsOf(sim, sim.now + w * WEEK)) {
      const t = p.parts[0]!;
      if (formatOf(t).after !== 'theatrical') continue;
      n += 1;
      const k = releaseFate(sim, t).kind;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    expect(n).toBeGreaterThan(300);
    const odds = RELEASE_FATE.theatrical!;
    for (const [k, p] of [['limited', odds.limited!], ['distributor', odds.distributor!], ['territory', odds.territory!], ['shelved', odds.shelved], ['late', odds.late]] as const) expect(Math.abs((counts[k] ?? 0) / n - p), k).toBeLessThan(0.05);
    // A series' season is never taken over by another distributor alone.
    const seriesKinds = seriesOfYear(sim, 2027).flatMap((s) => seriesParts(sim, s, 2027)).map((t) => releaseFate(sim, t).kind);
    expect(seriesKinds.length).toBeGreaterThan(5);
    expect(seriesKinds).not.toContain('distributor');
  });

  it('widen a limited release only where audiences score it at the bar, and keep a run’s takings abroad to its kind’s share of its takings at home, however it opened', () => {
    const sim = graduate('b27-routes-runs');
    const releasedAt = instantFromZoned({ year: 2027, month: 6, day: 4, hour: 12, minute: 0 }, NY);
    const ever = Number.MAX_SAFE_INTEGER;
    // TEST SETUP: a credit for the part, judged as given, with the way out given: the run is read from these alone.
    const credit = (band: 'exceptional' | 'unready', release: NonNullable<ProCredit['release']>): ProCredit => ({ id: 'c', kind: 'screen', project: 'x', role: 'Ivy', company: 'x', year: 2027, medium: 'film', status: 'released', at: 0, band, release });
    let films = 0;
    let straddled = 0;
    let stayedSmall = 0;
    for (let w = 1; w <= 120; w += 1) for (const p of productionsOf(sim, sim.now + w * WEEK)) {
      const t = p.parts.find((x) => x.role.size === 'lead');
      if (!t || formatOf(t).after !== 'theatrical') continue;
      films += 1;
      const [lo, hi] = INTERNATIONAL[t.kind]!;
      const widened: Record<string, boolean> = {};
      for (const band of ['exceptional', 'unready'] as const) {
        const wide = runOf(sim, t, credit(band, { kind: 'on-time' }), releasedAt)!;
        const limited = runOf(sim, t, credit(band, { kind: 'limited', weeks: 3 }), releasedAt)!;
        // Widened exactly where the audience's score reaches the bar, and only then reaching the wide opening.
        widened[band] = limited.limited!.widened;
        expect(limited.limited!.widened).toBe(limited.response!.audience >= FORTUNE.widen);
        const top = Math.max(...limited.weeks.map((x) => x.gross));
        if (limited.limited!.widened) expect(top).toBe(wide.weeks[0]!.gross);
        else { stayedSmall += 1; expect(top).toBeLessThan(wide.weeks[0]!.gross * LIMITED.share * 2); }
        // Abroad, the kind's share of the run at home, however it opened.
        for (const run of [wide, limited]) {
          const total = totalsOf(run, ever);
          expect(total.international! / total.domestic, `${t.id} ${band}`).toBeGreaterThanOrEqual(lo - 0.005);
          expect(total.international! / total.domestic, `${t.id} ${band}`).toBeLessThanOrEqual(hi + 0.005);
        }
      }
      // The falsifiability twin: the same film, the part judged Exceptional and Unready, one side of the bar each.
      if (widened.exceptional && !widened.unready) straddled += 1;
    }
    expect(films).toBeGreaterThan(30);
    expect(straddled).toBeGreaterThan(0);
    expect(stayedSmall).toBeGreaterThan(0);
  });

  it('places a film released abroad first by its run at home, and not at all where the two fall in different years', () => {
    const c = (days: number): ProCredit => ({ id: 'c', kind: 'screen', project: 'The Errand', role: 'Ivy', company: 'x', year: 2027, medium: 'film', status: 'shot', at: 0, release: { kind: 'territory', days, first: 'the United Kingdom' } });
    const dec = instantFromZoned({ year: 2027, month: 12, day: 10, hour: 12, minute: 0 }, NY);
    expect(homeOpening(dec, c(14))).toBe(addDays(dec, 14, NY));
    expect(splitYearsWhy(dec, c(14))).toBeUndefined();
    expect(splitYearsWhy(dec, c(28))).toBe('It opened in the United Kingdom in 2027 and in the US in 2028. The rules ask for a first showing and a qualifying run in the same year, so the game doesn’t place it in either.');
    expect(homeOpening(dec, { ...c(28), release: { kind: 'on-time' } })).toBe(dec);
  });
});

describe('a release in a few cinemas first, by another distributor, or abroad first', () => {
  it('PLAYER JOURNEY: a limited release is said, and opens in a few cinemas at a share of what its wide opening would be', () => {
    const sim = graduate('b27-routes-limited');
    const { t, c, due } = wrappedFilm(sim, 'limited');
    expect(c!.release!.weeks).toBeGreaterThanOrEqual(2);
    sim.advanceTo(due! + MS_HOUR);
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Is Released | ${t.project} opened in a limited release, in a few cinemas in Los Angeles and New York, so`))).toBe(true);
    const run = c!.run!;
    expect(run.limited?.weeks).toBe(c!.release!.weeks);
    expect(run.limited!.widened).toBe(run.response!.audience >= FORTUNE.widen);
    // The falsifiability twin: the same production released on time, as its run would read, opens wide.
    const wide = runOf(sim, t, { ...c!, release: { kind: 'on-time' }, run: undefined }, c!.releasedAt!)!;
    expect(run.weeks[0]!.gross).toBe(Math.round(wide.weeks[0]!.gross * LIMITED.share));
    expect(run.weeks[0]!.gross).toBeLessThan(wide.weeks[0]!.gross);
    // Its run in Los Angeles County, among the rules' major markets, keeps it eligible for the Actor Awards in its year.
    const check = actorCheck(sim, sim.player, c!);
    if (check.eligible) expect(check.year).toBe(zonedParts(c!.releasedAt!, NY).year);
    expect(creditWords(sim, sim.player, c!)).toContain('A limited release');
  }, 600_000);

  it('PLAYER JOURNEY: another distributor takes a film over: said at its first date with the company and the new date, out at the later one, its premiere the later from the start', () => {
    const sim = graduate('b27-routes-distributor');
    const { t, c, due } = wrappedFilm(sim, 'distributor');
    const fate = c!.release!;
    const later = addDays(due!, fate.days!, NY);
    expect(fate.distributor).toMatch(/^[A-Z][a-z]+( [A-Z][a-z]+)? [A-Z][a-z]+ (Releasing|Pictures|Films)$/);
    expect(premiereOf(sim, sim.player, c!)).toBe(later);
    sim.advanceTo(due! + MS_HOUR);
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Has A New Distributor | ${t.project}’s first distributor gave it up, and ${fate.distributor}, a distributor invented for the game, took it over`))).toBe(true);
    expect(c!.status).toBe('shot');
    expect(creditWords(sim, sim.player, c!)).toBe(`Shot, and taken over by ${fate.distributor}, which moved its release`);
    sim.advanceTo(later + MS_HOUR);
    expect([c!.status, c!.releasedAt]).toEqual(['released', later]);
    expect(notices(sim).some((n) => n.includes(`released by ${fate.distributor}, the distributor that took it over`))).toBe(true);
    const check = actorCheck(sim, sim.player, c!);
    expect(check.year).toBe(zonedParts(later, NY).year);
  }, 600_000);

  it('PLAYER JOURNEY: a film abroad first is out at its date there, comes home its weeks later, and the Actor Awards place it by the run at home; the on-time twin opens at home at once', () => {
    const sim = graduate('b27-routes-territory');
    const { t, c, due } = wrappedFilm(sim, 'territory');
    const fate = c!.release!;
    sim.advanceTo(due! + MS_HOUR);
    expect(c!.releasedAt).toBe(due);
    const run = c!.run!;
    expect(run.before?.length).toBe(fate.days! / 7);
    // Its run at home begins its distributor's days after its first week abroad, and the chart's weeks from then.
    expect(run.opening).toBe(addDays(run.before![0]!.from, fate.days!, NY));
    expect(run.weeks[0]!.from).toBe(run.opening);
    expect(run.opening).toBeGreaterThan(c!.releasedAt! + (fate.days! - 7) * MS_DAY);
    // Shown from its first week abroad, before it opens at home.
    sim.advanceTo(run.before![0]!.to + MS_HOUR);
    const showing = pageOf(sim, sim.player, projectKey(t))!.sections.flatMap((x) => x.facts).find((f) => f.label === 'In Cinemas');
    expect(showing?.words).toMatch(new RegExp(`^Opened in ${fate.first} on .*, and opens in the US on .*: one week abroad so far\\.$`));
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Is Released | ${t.project} opened in ${fate.first} first, and opens in the US on`))).toBe(true);
    const check = actorCheck(sim, sim.player, c!);
    if (!splitYearsWhy(c!.releasedAt, c!)) expect(check.year).toBe(zonedParts(run.opening, NY).year);
    // TEST SETUP: the same credit as if it had opened abroad on December 20, its run at home in the new year: not placed.
    const shifted: ProCredit = { ...c!, releasedAt: instantFromZoned({ year: 2028, month: 12, day: 20, hour: 12, minute: 0 }, NY), run: undefined };
    expect(actorCheck(sim, sim.player, shifted)).toMatchObject({ eligible: false, why: splitYearsWhy(shifted.releasedAt, shifted) });
    expect(splitYearsWhy(shifted.releasedAt, shifted)).toContain('so the game doesn’t place it in either');
    // The twin: a film released on time opens at home the week it's out, with no weeks abroad before.
    const twin = graduate('b27-routes-territory');
    const w = wrappedFilm(twin, 'on-time');
    twin.advanceTo(w.due + MS_HOUR);
    expect(w.c.run!.before).toBeUndefined();
    expect(w.c.run!.opening - w.c.releasedAt!).toBeLessThan(7 * MS_DAY);
  }, 600_000);
});
