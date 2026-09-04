/**
 * The world does not repeat itself, and this measures it rather than hoping.
 *
 * Freshness is a claim you can check. These tests commission hundreds of
 * productions and then measure the result: how concentrated the genre
 * combinations are, how much entropy is in the distribution, whether anything
 * comes round again inside the repeat window, and whether two countries
 * actually make different things. A generator that drifts into a rut fails
 * here before anybody has to sit through it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, loadSave, migrate } from '@/engine';
import { createUniverse, defaultConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import type { Project } from '@/engine/domain/model';
import { addDays, MS_DAY } from '@/engine/core/time';
import { MARKET_PROFILES } from '@/engine/content/market-profiles';
import { canonicalGenre, genre } from '@/engine/content/genres';
import { COUNTRIES } from '@/engine/content/geography';
import {
  commissionProject, heatOf, marketMood, marketReport, marketsInPlay, pickGenres, profileOf, risingIn,
} from '@/engine/systems/zeitgeist';

const key = (genres: readonly string[]) => [...genres].sort().join('+');

/** Shannon entropy in bits: how many equally likely outcomes the spread is worth. */
function entropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return -counts.reduce((sum, n) => (n === 0 ? sum : sum + (n / total) * Math.log2(n / total)), 0);
}

function commissionMany(sim: Simulation, countryId: string, count: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < count; i++) {
    const project = commissionProject(sim, countryId, `t-${i}`);
    if (project) out.push(project.genres.map(canonicalGenre));
  }
  return out;
}

describe('what a country makes', () => {
  it('is taken from what it has really made, and every market is distinct', () => {
    expect(Object.keys(MARKET_PROFILES).length).toBeGreaterThanOrEqual(25);
    for (const [countryId, profile] of Object.entries(MARKET_PROFILES)) {
      expect(COUNTRIES.get(countryId), countryId).toBeDefined();
      expect(profile.titles).toBeGreaterThanOrEqual(12);
      expect(profile.perYear).toBeGreaterThan(0);
      for (const [g, share] of Object.entries(profile.genres)) {
        expect(genre(g), `${countryId} lists ${g}`).toBeDefined();
        expect(share).toBeGreaterThan(0);
        expect(share).toBeLessThanOrEqual(1);
      }
      if (profile.budgetMedian !== null) expect(profile.budgetMedian).toBeGreaterThan(0);
    }
    // The national characters the record actually shows.
    const top = (id: string) => Object.entries(MARKET_PROFILES[id]!.genres).sort((a, b) => b[1] - a[1])[0]![0];
    expect(top('kr'), 'Korea leads on drama').toBe('drama');
    expect(top('fr'), 'France leads on comedy').toBe('comedy');
    expect(MARKET_PROFILES['jp']!.genres.animation!, 'Japan makes more animation than most').toBeGreaterThan(0.1);
    expect(MARKET_PROFILES['us']!.perYear, 'America makes more than anywhere').toBeGreaterThan(MARKET_PROFILES['kr']!.perYear);
    expect(MARKET_PROFILES['us']!.budgetMedian!).toBeGreaterThan(MARKET_PROFILES['kr']!.budgetMedian!);
    expect(marketsInPlay()[0]!.countryId).toBe('us');
  });
});

describe('the cycle never goes stale', () => {
  it('spreads what it makes: no combination dominates, and the spread is genuinely wide', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'fresh-spread');
    const made = commissionMany(sim, 'us', 240);
    expect(made.length).toBe(240);

    const counts = new Map<string, number>();
    for (const genres of made) counts.set(key(genres), (counts.get(key(genres)) ?? 0) + 1);
    const frequencies = [...counts.values()];
    const share = Math.max(...frequencies) / made.length;
    const bits = entropy(frequencies);

    expect(counts.size, `only ${counts.size} distinct combinations in 240`).toBeGreaterThan(45);
    expect(share, `the commonest combination is ${(share * 100).toFixed(1)}% of everything`).toBeLessThan(0.06);
    expect(bits, `${bits.toFixed(2)} bits of entropy`).toBeGreaterThan(5.2);

    // Every genre used is a real one, and plenty of them get used.
    const distinctGenres = new Set(made.flat());
    expect(distinctGenres.size).toBeGreaterThan(20);
    for (const g of distinctGenres) expect(genre(g), g).toBeDefined();
  });

  it('never brings the same combination round inside the window it promises', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'fresh-window');
    const made = commissionMany(sim, 'us', 200).map(key);
    // The guarantee: fourteen other things get made before a pairing returns.
    const WINDOW = 14;
    for (let i = 0; i < made.length; i++) {
      const window = made.slice(Math.max(0, i - WINDOW), i);
      expect(window, `"${made[i]}" repeated within ${WINDOW} at position ${i}`).not.toContain(made[i]);
    }
  });

  it('gives each country its own character rather than the same world everywhere', () => {
    const markets = ['us', 'kr', 'fr', 'jp', 'in'];
    const leaders = new Map<string, string>();
    const shapes = new Map<string, string[]>();
    for (const countryId of markets) {
      const sim = quickSave({ wealth: 'inherited' }, `fresh-${countryId}`);
      const made = commissionMany(sim, countryId, 120);
      // What a country is is what it leads with. Drama is a component of a
      // third of everything made everywhere — that is true of the real record
      // too — so counting every listed genre measures pairing habits rather
      // than national character. The first genre is what the thing is.
      const counts = new Map<string, number>();
      for (const genres of made) counts.set(genres[0]!, (counts.get(genres[0]!) ?? 0) + 1);
      const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
      leaders.set(countryId, ranked[0]!);
      shapes.set(countryId, ranked.slice(0, 8));
      // A market's own habits show through: what it really makes most is in its top handful.
      const profile = profileOf(countryId)!;
      const nationalTop = Object.entries(profile.genres).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([g]) => g);
      const everything = new Map<string, number>();
      for (const g of made.flat()) everything.set(g, (everything.get(g) ?? 0) + 1);
      const mine = [...everything.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([g]) => g);
      expect(mine.some((g) => nationalTop.includes(g)), `${countryId} makes nothing it is known for`).toBe(true);
    }
    // And they are not all making the same thing.
    expect(new Set(leaders.values()).size, `only ${new Set(leaders.values()).size} distinct leads: ${[...leaders].map(([c, g]) => `${c}=${g}`).join(', ')}`).toBeGreaterThan(2);
    // Nor is any pair of them the same country wearing a different flag.
    for (const a of markets) {
      for (const b of markets) {
        if (a >= b) continue;
        const overlap = shapes.get(a)!.filter((g) => shapes.get(b)!.includes(g)).length;
        expect(overlap, `${a} and ${b} lead with the same eight genres`).toBeLessThan(8);
      }
    }
  });

  it('is the same world twice from the same seed, and a different one from a different seed', () => {
    const a = commissionMany(quickSave({ wealth: 'inherited' }, 'fresh-seed-a'), 'us', 40).map(key);
    const b = commissionMany(quickSave({ wealth: 'inherited' }, 'fresh-seed-a'), 'us', 40).map(key);
    const c = commissionMany(quickSave({ wealth: 'inherited' }, 'fresh-seed-b'), 'us', 40).map(key);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe('heat', () => {
  it('starts from what a country makes and moves when something works', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'heat-seed');
    // Korea's drama heat starts above its western heat, because that is Korea.
    expect(heatOf(sim, 'kr', 'drama')).toBeGreaterThan(heatOf(sim, 'kr', 'western'));
    expect(heatOf(sim, 'fr', 'comedy')).toBeGreaterThan(heatOf(sim, 'fr', 'kaiju'));

    const before = heatOf(sim, 'us', 'horror');
    const project = {
      id: 'p-heat', genres: ['horror'], productionCountryId: 'us',
      budget: 10_000_000_00, totalCost: 10_000_000_00, totalRevenue: 90_000_000_00,
    } as unknown as Project;
    sim.universe.projects[project.id] = project;
    sim.emit('project.results_final', { projectId: project.id, worldGross: 90_000_000_00, profit: 80_000_000_00 });
    expect(heatOf(sim, 'us', 'horror'), 'a hit did not warm its genre').toBeGreaterThan(before);

    const cold = heatOf(sim, 'us', 'musical');
    const flop: Project = { ...project, id: 'p-flop', genres: ['musical'], totalRevenue: 2_000_000_00 } as Project;
    sim.universe.projects[flop.id] = flop;
    sim.emit('project.results_final', { projectId: flop.id, worldGross: 2_000_000_00, profit: -8_000_000_00 });
    expect(heatOf(sim, 'us', 'musical'), 'a flop did not cool its genre').toBeLessThan(cold);
  });

  it('cools what everybody just made, so a pile-on burns itself out', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'heat-saturation');
    const mood = marketMood(sim, 'us');
    // Force a glut of one thing, then let a month pass.
    mood.recentGenres = Array.from({ length: 12 }, () => 'horror');
    const before = mood.heat.horror!;
    mood.heat.horror = 90;
    sim.advanceTo(addDays(sim.now, 40, sim.homeZone));
    expect(mood.heat.horror!, 'saturation did not cool it').toBeLessThan(90);
    void before;
  });

  it('reports what a market is rising on, against its own nature', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'heat-report');
    commissionMany(sim, 'kr', 30);
    const report = marketReport(sim, 'kr');
    expect(report.name).toBe('South Korea');
    expect(report.commissioned, 'a save opens with a little already in production').toBeGreaterThanOrEqual(30);
    expect(report.rising.length).toBe(6);
    expect(report.variety, 'thirty commissions produced almost no variety').toBeGreaterThan(8);
    for (const row of report.rising) {
      expect(row.heat).toBeGreaterThanOrEqual(0);
      expect(row.heat).toBeLessThanOrEqual(100);
      expect(genre(row.genreId)).toBeDefined();
    }
    expect(risingIn(sim, 'kr', 3)).toHaveLength(3);
  });
});

describe('what the world commissions', () => {
  it('is a real production with somebody behind it', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'commission-shape');
    const project = commissionProject(sim, 'us', 'shape', false)!;
    expect(project).toBeDefined();
    expect(project.worldCommissioned).toBe(true);
    expect(project.createdById).not.toBe(sim.universe.playerId);
    expect(project.phase).toBe('preproduction');
    expect(project.productionCountryId).toBe('us');
    expect(project.budget).toBeGreaterThan(0);
    expect(project.contentRating, 'it carries a certificate').toBeTruthy();
    expect(project.runtime).toBeGreaterThan(0);
    expect(project.studioId ?? project.networkId, 'nobody is making it').toBeTruthy();
    expect(Object.values(sim.universe.roles).filter((r) => r.projectId === project.id)).toHaveLength(0);
  });

  it('is the only place a casting breakdown can come from, and only where you could be seen', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'commission-casting');
    // A save opens with work already casting at home, and every part of it
    // belongs to something the world actually commissioned. Casting invents
    // no films of its own any more.
    const rolesNow = Object.values(sim.universe.roles);
    expect(rolesNow.length, 'nothing is casting at all').toBeGreaterThan(0);
    for (const role of rolesNow) {
      const project = sim.universe.projects[role.projectId];
      expect(project, `role ${role.id} belongs to no project`).toBeDefined();
      expect(
        project!.worldCommissioned || project!.createdById === sim.universe.playerId,
        `${project!.title} is casting but nobody commissioned it`,
      ).toBe(true);
      expect(project!.format, 'a documentary is casting actors').not.toBe('documentary');
    }

    // Somewhere you are not is somewhere you cannot audition, so it does not
    // put a breakdown in front of you.
    const before = Object.keys(sim.universe.roles).length;
    for (let i = 0; i < 12; i++) commissionProject(sim, 'kr', `abroad-${i}`);
    expect(Object.keys(sim.universe.roles).length, 'a production in Seoul is casting you in Los Angeles').toBe(before);

    // One at home does.
    const home = commissionProject(sim, 'us', 'home-cast', true)!;
    const parts = Object.values(sim.universe.roles).filter((r) => r.projectId === home.id);
    expect(parts.length, 'a production at home put nothing out').toBeGreaterThan(0);
    for (const role of parts) {
      expect(role.ageRange[1]).toBeGreaterThan(role.ageRange[0]);
      // A part is either out to be cast, with a room reading for it, or it is
      // already attached to somebody. Nothing sits in between.
      if (role.status === 'casting') {
        expect(role.auditionIds.length, 'a breakdown with nobody reading for it').toBeGreaterThan(0);
      } else {
        expect(role.status, `${role.characterName} is neither open nor filled`).toBe('cast');
        expect(role.castPersonId, 'cast to nobody').toBeTruthy();
        expect(home.castIds).toContain(role.castPersonId);
      }
    }
  });

  it('knows what it is about and who is making it', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'commission-dossier');
    const made = Object.values(sim.universe.projects).filter((p) => p.worldCommissioned);
    expect(made.length).toBeGreaterThan(0);
    for (const project of made) {
      // A premise, not a label. Every one is a sentence with a person in it.
      expect(project.logline.length, `${project.title} has no premise`).toBeGreaterThan(30);
      expect(project.logline, `${project.title} kept the placeholder`).not.toMatch(/^A .* production\.$/);
      expect(project.logline.endsWith('.'), project.logline).toBe(true);
      expect(project.logline, project.logline).not.toMatch(/\bthe (whatever|everybody|everyone|nobody)\b/i);
      expect(project.logline, project.logline).not.toMatch(/\bbefore (nobody|nothing|never)\b/i);

      // Somebody made it, and the billing block says so permanently.
      const director = sim.universe.people[project.directorId ?? ''];
      expect(director, `${project.title} was directed by nobody`).toBeDefined();
      expect(project.producerIds.length, `${project.title} has no producer`).toBeGreaterThan(0);
      expect(project.credits.some((c) => c.role === 'director'), 'no director credit').toBe(true);
      expect(project.createdById, 'the project belongs to nobody real').toBe(project.directorId);
      if (project.format === 'series' || project.format === 'limited_series') {
        expect(project.showrunnerId, `${project.title} is a series with no showrunner`).toBeTruthy();
      }
    }
    // The same people keep working, which is what an industry looks like.
    const directors = new Set(made.map((p) => p.directorId));
    expect(directors.size).toBeLessThanOrEqual(made.length);
  });

  it('runs on its own clock and keeps making things for years without bloating the save', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'commission-clock');
    expect(sim.universe.scheduled.some((s) => s.kind === 'zeit.commission' && s.status === 'pending')).toBe(true);
    expect(sim.universe.scheduled.some((s) => s.kind === 'zeit.tick' && s.status === 'pending')).toBe(true);
    const opening = Object.values(sim.universe.projects).filter((p) => p.worldCommissioned).length;
    expect(opening, 'a save opens with the world already making things').toBeGreaterThan(3);

    sim.advanceTo(addDays(sim.now, 730, sim.homeZone));
    const commissioned = Object.values(sim.universe.projects).filter((p) => p.worldCommissioned);
    expect(commissioned.length, 'the world stopped making things').toBeGreaterThan(40);
    expect(commissioned.length, 'the world made so much the save is unusable').toBeLessThan(900);
    // Several countries are producing, not just one.
    const countries = new Set(commissioned.map((p) => p.productionCountryId));
    expect(countries.size, 'only one country is making anything').toBeGreaterThan(3);
    // And the titles are all still unique.
    const titles = commissioned.map((p) => p.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('picks nothing a format cannot carry', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'commission-format');
    for (let i = 0; i < 60; i++) {
      const genres = pickGenres(sim, 'us', sim.rng('probe', i), 'documentary');
      for (const g of genres) {
        expect((genre(g)!.formats as readonly string[]).includes('documentary'), `${g} is not a documentary genre`).toBe(true);
      }
    }
  });
});

describe('an older save', () => {
  it('loses the filler that only existed to fill a casting page, and keeps everything you touched', () => {
    const { universe } = createUniverse(1, 'zeit-migrate', defaultConfig());
    const record = universe as unknown as Record<string, unknown>;
    delete record['zeitgeist'];
    universe.meta.schemaVersion = 17;

    // One filler production nobody touched, and one the player is credited on.
    const filler = {
      id: 'p-filler', saveId: universe.meta.id, title: 'Filler', format: 'feature', genres: ['drama'],
      logline: 'An independent production, casting now.', synopsis: '', phase: 'preproduction', phaseHistory: [],
      createdById: 'someone-else', attachments: [], writerIds: [], producerIds: [], castIds: [], credits: [],
      budget: 0, budgetLocked: false, spent: 0, contingency: 0, financingIds: [], scriptDraftIds: [],
      targetAudience: '', comparables: [], scriptQuality: 0, packageValue: 0, productionLocationIds: [],
      shootDayIds: [], scheduledShootDays: 0, completedShootDays: 0, postTaskIds: [],
      boxOfficeDomestic: 0, boxOfficeInternational: 0, streamingHoursViewed: 0, totalRevenue: 0, totalCost: 0,
      createdAt: universe.now,
    } as unknown as Project;
    universe.projects[filler.id] = filler;
    const mine = { ...filler, id: 'p-mine' } as Project;
    universe.projects[mine.id] = mine;
    const player = universe.people[universe.playerId]!;
    player.creditIds = [...(player.creditIds ?? []), mine.id];

    const result = migrate(universe);
    expect(result.migrated).toBe(true);
    expect(result.steps.some((s) => s.includes('commissions its own films'))).toBe(true);
    expect(universe.projects['p-filler'], 'the filler was kept').toBeUndefined();
    expect(universe.projects['p-mine'], 'a project you are credited on was thrown away').toBeDefined();
    expect(universe.zeitgeist).toEqual({ markets: {}, lastTick: 0, history: [] });

    const sim = loadSave(universe);
    expect(sim.universe.scheduled.filter((s) => s.kind === 'zeit.commission' && s.status === 'pending')).toHaveLength(1);
    void MS_DAY;
  });
});
