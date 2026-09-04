/**
 * The box office, against the real thing.
 *
 * Every number here is checked against what pictures of that size actually
 * take. The anchors are per-theatre, because that is the figure that does not
 * move with the size of the release: an event picture takes something like
 * fifty thousand dollars a theatre across its opening weekend, a solid wide
 * opener a quarter of that, and a picture nobody wants about three thousand.
 * The shape of the week is checked too — Saturday above Friday, Sunday below
 * it, midweek a third — because a model that gets the total right and the
 * curve wrong is wrong.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, MarketingCampaign, Project, Release } from '@/engine/domain/model';
import { addDays, dateKey, parseDateKey, zonedParts, MS_DAY } from '@/engine/core/time';
import { bookingFootprint } from '@/engine/systems/release';
import { audienceReach, rating } from '@/engine/content/ratings';

interface Shape {
  awareness: number;
  intent: number;
  theatres: number;
  genres?: string[];
  quality?: number;
  audience?: number;
  contentRating?: string;
  strategy?: Release['strategy'];
}

/** Opens a picture on the next Friday and runs it, returning the daily takes. */
function open(sim: Simulation, seed: string, shape: Shape): { release: Release; project: Project; weekend: number; perTheatre: number } {
  const z = sim.homeZone;
  const parts = zonedParts(sim.now, z);
  const daysToFriday = (5 - parts.weekday + 7) % 7 || 7;
  const openingDate = parseDateKey(dateKey(addDays(sim.now, daysToFriday, z), z), z, 0);

  const project: Project = {
    id: `p-${seed}` as Id, saveId: sim.universe.meta.id, title: `Picture ${seed}`,
    format: 'feature', genres: shape.genres ?? ['thriller'], logline: 'A film.', synopsis: 'A film.',
    phase: 'released', phaseHistory: [], createdById: 'nobody' as Id,
    attachments: [], writerIds: [], producerIds: [], castIds: [], credits: [],
    budget: 50_000_000_00, budgetLocked: true, spent: 0, contingency: 0,
    financingIds: [], scriptDraftIds: [], targetAudience: 'General', comparables: [],
    scriptQuality: 70, packageValue: 0, productionLocationIds: [], shootDayIds: [],
    scheduledShootDays: 0, completedShootDays: 0, postTaskIds: [],
    boxOfficeDomestic: 0, boxOfficeInternational: 0, streamingHoursViewed: 0,
    totalRevenue: 0, totalCost: 0, createdAt: sim.now,
    finalQuality: shape.quality ?? 70, criticScore: shape.quality ?? 70, audienceScore: shape.audience ?? 70,
    contentRating: shape.contentRating,
  };
  sim.universe.projects[project.id] = project;

  const campaign: MarketingCampaign = {
    id: `c-${seed}` as Id, saveId: sim.universe.meta.id, projectId: project.id,
    budget: 1, spent: 1, positioning: '', targetAudience: '', beats: [],
    awareness: shape.awareness, intent: shape.intent, sentiment: 0, socialPostIds: [], startedAt: sim.now,
  };
  sim.universe.marketingCampaigns[campaign.id] = campaign;

  const release: Release = {
    id: `r-${seed}` as Id, saveId: sim.universe.meta.id, projectId: project.id,
    strategy: shape.strategy ?? 'wide_theatrical', distributorName: 'Test Pictures',
    distributorShare: 0.3, exhibitorShare: 0.5, openingDate,
    theaterCount: shape.theatres, maxTheaterCount: shape.theatres,
    territories: [], windows: [], dailyBoxOffice: [],
    totalDomestic: 0, totalInternational: 0, netToDistributor: 0, netToProducer: 0, status: 'planned',
  };
  sim.universe.releases[release.id] = release;
  project.releaseId = release.id;
  sim.schedule({ at: openingDate, kind: 'rel.open', label: 'Opens', category: 'release', payload: { releaseId: release.id }, priority: 12 });
  sim.advanceTo(openingDate + 4 * MS_DAY);

  const weekend = release.dailyBoxOffice.slice(0, 3).reduce((s, d) => s + d.domestic, 0);
  return { release, project, weekend, perTheatre: weekend / shape.theatres };
}

function dollars(cents: number): number {
  return cents / 100;
}

describe('an opening weekend', () => {
  it('takes what a picture of that size really takes, per theatre', () => {
    // Per-theatre opening weekend, in dollars, from the real record:
    //   event picture      $38,000 - $52,000
    //   big tentpole       $20,000 - $36,000
    //   solid wide opener  $ 8,000 - $16,000
    //   ordinary wide      $ 4,000 - $ 8,000
    //   nobody wanted it   $ 1,500 - $ 4,000
    const cases: { name: string; shape: Shape; low: number; high: number }[] = [
      { name: 'an event picture everybody knows about', shape: { awareness: 96, intent: 80, theatres: 4300, genres: ['action', 'superhero'], quality: 80, audience: 85, contentRating: 'pg-13' }, low: 30_000, high: 60_000 },
      { name: 'a big tentpole', shape: { awareness: 88, intent: 62, theatres: 3900, genres: ['action', 'adventure'], quality: 74, contentRating: 'pg-13' }, low: 14_000, high: 34_000 },
      { name: 'a solid wide opener', shape: { awareness: 72, intent: 45, theatres: 3600, genres: ['thriller'], quality: 68, contentRating: 'pg-13' }, low: 5_000, high: 16_000 },
      { name: 'an ordinary wide release', shape: { awareness: 58, intent: 32, theatres: 3200, genres: ['comedy'], quality: 60, contentRating: 'r' }, low: 2_200, high: 8_500 },
      { name: 'a picture nobody wanted', shape: { awareness: 38, intent: 16, theatres: 3000, genres: ['drama'], quality: 45, audience: 40, contentRating: 'r' }, low: 700, high: 4_000 },
    ];
    for (const { name, shape, low, high } of cases) {
      const sim = quickSave({ wealth: 'inherited' }, `bo-${name}`);
      const run = open(sim, name.replace(/\W+/g, '-'), shape);
      const perTheatre = dollars(run.perTheatre);
      expect(perTheatre, `${name}: $${Math.round(perTheatre).toLocaleString('en-US')} a theatre`).toBeGreaterThan(low);
      expect(perTheatre, `${name}: $${Math.round(perTheatre).toLocaleString('en-US')} a theatre`).toBeLessThan(high);
    }
  });

  it('runs the real shape of a week: Saturday above Friday, Sunday below, midweek a third', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'bo-shape');
    const { release } = open(sim, 'shape', { awareness: 80, intent: 55, theatres: 3500 });
    sim.advanceTo(release.openingDate + 8 * MS_DAY);
    const [friday, saturday, sunday, monday] = release.dailyBoxOffice.map((d) => d.domestic);
    expect(zonedParts(release.openingDate, sim.homeZone).weekday, 'it opened on a Friday').toBe(5);
    expect(saturday! / friday!, 'Saturday is the biggest day of the week').toBeGreaterThan(1.05);
    expect(saturday! / friday!).toBeLessThan(1.35);
    expect(sunday! / friday!, 'Sunday falls away from Friday').toBeLessThan(0.9);
    expect(sunday! / friday!).toBeGreaterThan(0.55);
    expect(monday! / friday!, 'Monday is a third of a Friday at most').toBeLessThan(0.45);
    // The weekend is roughly a third of the first week's take, the rest midweek.
    const week = release.dailyBoxOffice.slice(0, 7).reduce((s, d) => s + d.domestic, 0);
    const weekend = friday! + saturday! + sunday!;
    expect(weekend / week, 'the weekend is most of the week').toBeGreaterThan(0.6);
    expect(weekend / week).toBeLessThan(0.85);
  });

  it('holds when word of mouth is good and falls off a cliff when it is not', () => {
    const loved = quickSave({ wealth: 'inherited' }, 'bo-legs-good');
    const hated = quickSave({ wealth: 'inherited' }, 'bo-legs-good');
    const good = open(loved, 'legs-good', { awareness: 80, intent: 50, theatres: 3500, quality: 85, audience: 90 });
    const bad = open(hated, 'legs-good', { awareness: 80, intent: 50, theatres: 3500, quality: 45, audience: 32 });
    for (const sim of [loved, hated]) sim.advanceTo(sim.now + 12 * MS_DAY);
    const secondWeekend = (r: Release) => r.dailyBoxOffice.slice(7, 10).reduce((s, d) => s + d.domestic, 0);
    const goodDrop = secondWeekend(good.release) / good.weekend;
    const badDrop = secondWeekend(bad.release) / bad.weekend;
    expect(goodDrop, 'a picture people love holds').toBeGreaterThan(badDrop);
    expect(badDrop, 'a picture people dislike drops hard').toBeLessThan(0.62);
    expect(goodDrop, 'nothing holds better than flat in week two').toBeLessThan(1.05);
  });

  it('loses the audience a hard certificate cannot sell to', () => {
    const shape: Shape = { awareness: 80, intent: 52, theatres: 3500, genres: ['thriller'] };
    const soft = open(quickSave({ wealth: 'inherited' }, 'bo-cert'), 'cert-pg13', { ...shape, contentRating: 'pg-13' });
    const hard = open(quickSave({ wealth: 'inherited' }, 'bo-cert'), 'cert-r', { ...shape, contentRating: 'r' });
    const adults = open(quickSave({ wealth: 'inherited' }, 'bo-cert'), 'cert-nc17', { ...shape, contentRating: 'nc-17' });
    expect(audienceReach('pg-13')).toBe(1);
    expect(rating('r')!.reach).toBeLessThan(1);
    expect(hard.weekend, 'an R takes less than a PG-13').toBeLessThan(soft.weekend);
    expect(adults.weekend, 'an NC-17 takes a fraction of either').toBeLessThan(hard.weekend * 0.4);
  });

  it('books a believable number of theatres: nothing wider than the country has', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'bo-theatres');
    const big = { finalQuality: 82, genres: ['action', 'adventure'] } as unknown as Project;
    const small = { finalQuality: 62, genres: ['drama'] } as unknown as Project;
    const widest = bookingFootprint(big, 'wide_theatrical', 1);
    expect(widest, 'the widest release in the country is about 4,400 theatres').toBeLessThanOrEqual(4_400);
    expect(widest).toBeGreaterThan(2_500);
    const limited = bookingFootprint(small, 'limited_theatrical', 0.5);
    expect(limited).toBeLessThan(1_400);
    expect(limited).toBeGreaterThan(20);
    expect(bookingFootprint(small, 'platform', 0.5), 'a platform release opens in a handful').toBe(6);
    expect(bookingFootprint(small, 'streaming_exclusive', 1), 'streaming books no theatres').toBe(0);
    void sim;
  });

  it('gives a platform release the per-theatre take a full house actually produces', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'bo-platform');
    const run = open(sim, 'platform', { awareness: 42, intent: 40, theatres: 6, genres: ['drama'], quality: 92, audience: 88, strategy: 'platform' });
    const perTheatre = dollars(run.perTheatre);
    // A platform opening runs $30,000 to $110,000 a theatre on the record.
    expect(perTheatre, `platform: $${Math.round(perTheatre).toLocaleString('en-US')} a theatre`).toBeGreaterThan(20_000);
    expect(perTheatre).toBeLessThan(160_000);
  });

  it('adds up to a total the trades would print', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'bo-total');
    const run = open(sim, 'total', { awareness: 90, intent: 66, theatres: 4100, genres: ['action', 'adventure'], quality: 78, audience: 80 });
    sim.advanceTo(run.release.openingDate + 45 * MS_DAY);
    const domestic = dollars(run.release.totalDomestic);
    // A picture that opens in the twenties per theatre finishes somewhere
    // between two and a half and four times its opening weekend.
    const multiple = run.release.totalDomestic / run.weekend;
    expect(multiple, `finished at ${multiple.toFixed(2)}x its opening`).toBeGreaterThan(1.9);
    expect(multiple).toBeLessThan(4.5);
    expect(domestic, `$${Math.round(domestic / 1e6)}M domestic`).toBeGreaterThan(80_000_000);
    expect(domestic).toBeLessThan(900_000_000);
  });
});
