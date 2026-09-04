/**
 * SLATE — Marketing, distribution, release and results.
 *
 * A $100 million gross is not $100 million of studio cash. Exhibitors keep
 * roughly half of theatrical, the distributor takes a fee off the top, prints
 * and advertising comes out before anyone sees a profit, and only then does
 * backend participation start to matter.
 *
 * Streaming does not collapse into a fake box-office number. It reports starts,
 * hours viewed, completion and retention, because those are the numbers that
 * actually decide a renewal.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Franchise, Id, MarketingCampaign, Project, Release } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, formatDate, MS_DAY } from '../core/time';
import { applyRate, formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { BUYERS, EXHIBITORS, GENRE_APPETITE } from '../content/industry';
import { runEmbargoWave } from './critics';
import { payOnePartner, NETWORKS } from '../content/networks';
import { advancePhase } from './film';

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const STREAMER_REACH: Readonly<Record<string, number>> = { netflix: 300_000_000, 'amazon-mgm': 200_000_000, apple: 45_000_000 };

export function registerRelease(sim: Simulation): void {
  sim.onSchedule('rel.marketing_beat', (item) => executeBeat(sim, item.payload.campaignId as Id, item.payload.index as number));
  sim.onSchedule('rel.open', (item) => openRelease(sim, item.payload.releaseId as Id));
  sim.onSchedule('rel.box_office_day', (item) => runBoxOfficeDay(sim, item.payload.releaseId as Id, item.payload.day as number));
  sim.onSchedule('rel.streaming_window', (item) => runStreamingWindow(sim, item.payload.releaseId as Id, item.payload.week as number));
  sim.onSchedule('rel.reviews', (item) => runEmbargoWave(sim, item.payload.projectId as Id));
  sim.onSchedule('rel.close', (item) => closeRelease(sim, item.payload.releaseId as Id));

  // --- Marketing -----------------------------------------------------------

  sim.onCommand<{ projectId: Id; budget: Money; positioning: string; targetAudience: string; openingDate: number }, { campaignId: Id; beats: number }>(
    'rel.plan_campaign',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!project.finalQuality) throw new CommandError(`${project.title} is not finished. There is nothing to market yet.`);
      if (Object.values(s.universe.marketingCampaigns).some((c) => c.projectId === project.id)) {
        throw new CommandError('That project already has a campaign.');
      }
      if (p.openingDate <= s.now) throw new CommandError('Pick a release date in the future.');

      const leadDays = Math.round((p.openingDate - s.now) / MS_DAY);
      if (leadDays < 30) throw new CommandError('You need at least thirty days of runway to mount a campaign.');

      const plan: MarketingCampaign['beats'] = [
        { kind: 'announcement', at: s.now, spend: Math.round(p.budget * 0.02), executed: false },
        { kind: 'first_look', at: addDays(p.openingDate, -Math.round(leadDays * 0.75), s.homeZone), spend: Math.round(p.budget * 0.05), executed: false },
        { kind: 'teaser', at: addDays(p.openingDate, -Math.round(leadDays * 0.6), s.homeZone), spend: Math.round(p.budget * 0.10), executed: false },
        { kind: 'poster', at: addDays(p.openingDate, -Math.round(leadDays * 0.5), s.homeZone), spend: Math.round(p.budget * 0.03), executed: false },
        { kind: 'trailer', at: addDays(p.openingDate, -Math.round(leadDays * 0.4), s.homeZone), spend: Math.round(p.budget * 0.22), executed: false },
        { kind: 'clip', at: addDays(p.openingDate, -Math.round(leadDays * 0.25), s.homeZone), spend: Math.round(p.budget * 0.06), executed: false },
        { kind: 'trailer_2', at: addDays(p.openingDate, -Math.round(leadDays * 0.18), s.homeZone), spend: Math.round(p.budget * 0.20), executed: false },
        { kind: 'featurette', at: addDays(p.openingDate, -Math.round(leadDays * 0.12), s.homeZone), spend: Math.round(p.budget * 0.05), executed: false },
        { kind: 'press_tour', at: addDays(p.openingDate, -14, s.homeZone), spend: Math.round(p.budget * 0.12), executed: false },
        { kind: 'premiere', at: addDays(p.openingDate, -3, s.homeZone), spend: Math.round(p.budget * 0.15), executed: false },
      ];

      const campaign: MarketingCampaign = {
        id: s.nextId('campaign'),
        saveId: s.universe.meta.id,
        projectId: project.id,
        budget: p.budget,
        spent: 0,
        positioning: p.positioning,
        targetAudience: p.targetAudience,
        beats: plan,
        awareness: 0,
        intent: 0,
        sentiment: 0,
        socialPostIds: [],
        startedAt: s.now,
      };
      s.universe.marketingCampaigns[campaign.id] = campaign;

      plan.forEach((beat, index) => {
        s.schedule({
          at: Math.max(beat.at, s.now),
          kind: 'rel.marketing_beat',
          label: `${project.title} — ${beat.kind.replace(/_/g, ' ')}`,
          category: 'marketing',
          payload: { campaignId: campaign.id, index },
          priority: 48,
          refType: 'project', refId: project.id,
          requiresPlayer: beat.kind === 'premiere' || beat.kind === 'press_tour',
          durationMinutes: beat.kind === 'premiere' ? 300 : beat.kind === 'press_tour' ? 480 : undefined,
        });
      });

      project.releaseDate = p.openingDate;
      advancePhase(s, project, 'marketing');
      s.emit('rel.campaign_planned', { campaignId: campaign.id, projectId: project.id, budget: p.budget, openingDate: p.openingDate });
      return { campaignId: campaign.id, beats: plan.length };
    },
  );

  // --- Distribution --------------------------------------------------------

  sim.onCommand<{ projectId: Id; strategy: Release['strategy']; distributorName?: string; openingDate: number; theaterCount?: number; territories?: string[] }, { releaseId: Id; theaterCount: number; distributorShare: number }>(
    'rel.set_distribution',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!project.finalQuality) throw new CommandError(`${project.title} is not delivered yet.`);
      if (project.releaseId) throw new CommandError('That project already has a release plan.');

      // Rights gate: you cannot license what you do not hold.
      const rights = project.rightsId ? s.universe.rights[project.rightsId] : undefined;
      if (!rights || rights.status !== 'active') {
        throw new CommandError(`${project.title} has no active chain of title. It cannot be licensed for distribution.`);
      }
      const theatrical = p.strategy.includes('theatrical') || p.strategy === 'day_and_date' || p.strategy === 'platform';
      if (theatrical && !rights.scope.media.includes('theatrical')) {
        throw new CommandError('The rights you hold do not include theatrical exploitation.');
      }
      if (p.strategy === 'streaming_exclusive' && !rights.scope.media.includes('streaming')) {
        throw new CommandError('The rights you hold do not include streaming.');
      }

      const distributor = p.distributorName ?? project.distributorName ?? 'Self-distributed';
      const buyer = (project.studioId ? BUYERS.get(project.studioId) : undefined) ?? (project.networkId ? BUYERS.get(project.networkId) : undefined) ?? BUYERS.all().find((b) => b.name === distributor);
      // After cinemas a film goes where its studio's deal says; a series lives where it was commissioned.
      const partner = project.studioId && (p.strategy !== 'streaming_exclusive' && p.strategy !== 'network') ? payOnePartner(project.studioId) : undefined;
      const network = project.networkId ? NETWORKS.get(project.networkId) : undefined;

      const maxTheaters = p.theaterCount ?? bookingFootprint(project, p.strategy, buyer?.distributionReach ?? 0.4);

      const openingTheaters = p.strategy === 'platform' ? 6 : maxTheaters;

      const release: Release = {
        id: s.nextId('release'),
        saveId: s.universe.meta.id,
        projectId: project.id,
        strategy: p.strategy,
        distributorName: distributor,
        distributorShare: buyer ? 0.15 : 0.25,
        exhibitorShare: 0.5,
        openingDate: p.openingDate,
        theaterCount: openingTheaters,
        maxTheaterCount: maxTheaters,
        territories: p.territories ?? ['domestic', 'international'],
        windows: buildWindows(s, p.strategy, p.openingDate),
        streamingPartnerId: partner?.network.id ?? (network ? network.id : undefined),
        streamingPartnerName: partner?.network.name ?? network?.name,
        dailyBoxOffice: [],
        totalDomestic: 0,
        totalInternational: 0,
        netToDistributor: 0,
        netToProducer: 0,
        status: 'planned',
      };
      s.universe.releases[release.id] = release;
      project.releaseId = release.id;
      project.distributorName = distributor;
      project.releaseDate = p.openingDate;
      project.releaseStrategy = p.strategy;

      s.schedule({
        at: p.openingDate,
        kind: 'rel.open',
        label: `${project.title} Opens`,
        category: 'release',
        payload: { releaseId: release.id },
        priority: 12,
        refType: 'project', refId: project.id,
        requiresPlayer: false,
      });
      advancePhase(s, project, 'distribution');
      s.emit('rel.distribution_set', { releaseId: release.id, projectId: project.id, strategy: p.strategy, theaterCount: openingTheaters });
      return { releaseId: release.id, theaterCount: openingTheaters, distributorShare: release.distributorShare };
    },
  );
}

// ---------------------------------------------------------------------------
// Marketing mechanics
// ---------------------------------------------------------------------------

/**
 * How many screens a release can actually book.
 *
 * Chains do not book everything. A wide release needs the two big circuits to
 * say yes; an arthouse platform release goes to the specialty houses and grows
 * from there. Reach is the distributor's leverage with those circuits.
 */
export function bookingFootprint(
  project: Project, strategy: Release['strategy'], distributorReach: number,
): number {
  if (strategy === 'streaming_exclusive' || strategy === 'network' || strategy === 'direct_to_video' || strategy === 'festival_only') {
    return 0;
  }
  if (strategy === 'platform') return 6;

  const quality = project.finalQuality ?? 50;
  const appeal = project.genres.reduce((s, g) => s + (GENRE_APPETITE[g] ?? 45), 0) / Math.max(1, project.genres.length);

  let screens = 0;
  for (const chain of EXHIBITORS.all()) {
    // A circuit books you in proportion to how commercial you look to them,
    // scaled by how much leverage your distributor has with them.
    const commercialFit = remap(appeal * 0.6 + quality * 0.4, 20, 90, 0.15, 1);
    const specialty = chain.id === 'lantern' ? remap(quality, 40, 95, 0.2, 1.1) : commercialFit;
    const take = clamp(specialty * distributorReach, 0, 1);
    screens += chain.screens * take * (strategy === 'limited_theatrical' ? 0.18 : 1);
  }
  return Math.max(strategy === 'limited_theatrical' ? 120 : 400, Math.round(screens));
}

function buildWindows(sim: Simulation, strategy: Release['strategy'], openingDate: number): Release['windows'] {
  const z = sim.homeZone;
  switch (strategy) {
    case 'wide_theatrical':
    case 'limited_theatrical':
    case 'platform':
      return [
        { kind: 'theatrical', startsAt: openingDate, endsAt: addDays(openingDate, 90, z) },
        { kind: 'premium_home', startsAt: addDays(openingDate, 45, z), endsAt: addDays(openingDate, 120, z) },
        { kind: 'streaming', startsAt: addDays(openingDate, 120, z) },
      ];
    case 'day_and_date':
      return [
        { kind: 'theatrical', startsAt: openingDate, endsAt: addDays(openingDate, 45, z) },
        { kind: 'streaming', startsAt: openingDate },
      ];
    case 'streaming_exclusive':
      return [{ kind: 'streaming', startsAt: openingDate }];
    case 'network':
      return [{ kind: 'linear', startsAt: openingDate }];
    default:
      return [{ kind: 'home', startsAt: openingDate }];
  }
}

function executeBeat(sim: Simulation, campaignId: Id, index: number): void {
  const campaign = sim.universe.marketingCampaigns[campaignId];
  if (!campaign) return;
  const beat = campaign.beats[index];
  if (!beat || beat.executed) return;
  const project = sim.universe.projects[campaign.projectId];
  if (!project) return;

  const accountId = project.financingIds.find((id) => (sim.ledger.tryAccount(id)?.balance ?? 0) > 0)
    ?? (project.ownerCompanyId ? sim.universe.companies[project.ownerCompanyId]?.cashAccountId : undefined)
    ?? sim.universe.people[project.createdById]?.primaryAccountId;

  if (accountId && sim.ledger.availableFunds(accountId) >= beat.spend) {
    sim.expense(accountId, beat.spend, `${project.title} — ${beat.kind.replace(/_/g, ' ')}`, 'marketing', { refType: 'project', refId: project.id });
    campaign.spent += beat.spend;
  } else {
    beat.executed = true;
    beat.reach = 0;
    campaign.beats[index] = beat;
    sim.notify({
      category: 'marketing',
      title: `Marketing beat skipped on ${project.title}`,
      body: `${beat.kind.replace(/_/g, ' ')} could not be funded. Awareness will suffer.`,
      importance: 62, route: '/workspace/projects',
    });
    return;
  }

  const rng = sim.rng('marketing_beat', campaign.id, index);
  const quality = clamp((project.finalQuality ?? 50) * 0.4 + rng.normal(60, 12) * 0.6, 0, 100);

  // Reach scales with spend, sub-linearly, and trailers do the heavy lifting.
  const beatWeight: Record<string, number> = {
    announcement: 0.4, first_look: 0.6, teaser: 1.0, poster: 0.5,
    trailer: 2.0, clip: 0.7, trailer_2: 1.6, featurette: 0.5,
    press_tour: 1.1, premiere: 0.9,
  };
  const weight = beatWeight[beat.kind] ?? 0.6;
  const reach = Math.round(Math.pow(beat.spend / 100, 0.72) * 380 * weight * remap(quality, 0, 100, 0.6, 1.5));

  beat.executed = true;
  beat.reach = reach;
  beat.quality = Math.round(quality);
  campaign.beats[index] = beat;

  campaign.awareness = clamp(campaign.awareness + remap(reach, 0, 40_000_000, 0, 16) * weight, 0, 100);
  campaign.intent = clamp(
    campaign.intent + remap(quality, 0, 100, -2, 7) * weight * remap(campaign.awareness, 0, 100, 0.4, 1.2),
    0, 100,
  );
  campaign.sentiment = clamp(campaign.sentiment * 0.75 + remap(quality, 0, 100, -35, 55) * 0.25, -100, 100);

  // A premiere or press tour is a real event for the people who attend it.
  if (beat.kind === 'premiere' || beat.kind === 'press_tour') {
    for (const personId of [...project.castIds, project.directorId].filter(Boolean) as Id[]) {
      const person = sim.universe.people[personId];
      if (!person) continue;
      const publicityStress = person.isPlayer ? 1 : 0.5;
      person.wellbeing.stress = clamp(person.wellbeing.stress + 8 * publicityStress, 0, 100);
      person.reputation.publicFame = clamp(person.reputation.publicFame + remap(reach, 0, 30_000_000, 0.2, 3.5), 0, 100);
    }
  }

  sim.emit('rel.marketing_beat_executed', {
    campaignId: campaign.id, projectId: project.id, kind: beat.kind,
    spend: beat.spend, reach, awareness: campaign.awareness, intent: campaign.intent,
  });
}

// ---------------------------------------------------------------------------
// Reviews live in systems/critics. The schedule kind below is kept so a
// review date saved before that system existed still fires.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Theatrical
// ---------------------------------------------------------------------------

function openRelease(sim: Simulation, releaseId: Id): void {
  const release = sim.universe.releases[releaseId];
  if (!release || release.status !== 'planned') return;
  const project = sim.universe.projects[release.projectId];
  if (!project) return;

  release.status = 'in_release';
  advancePhase(sim, project, 'released');

  if (release.strategy === 'streaming_exclusive' || release.strategy === 'day_and_date') {
    release.streamingResults = { starts: 0, hoursViewed: 0, completionRate: 0, peakRank: 99, retentionCurve: [], territoryTop10: [] };
    for (let week = 0; week < 8; week++) {
      sim.schedule({
        at: addDays(release.openingDate, week * 7, sim.homeZone),
        kind: 'rel.streaming_window',
        label: `${project.title} — Streaming Week ${week + 1}`,
        category: 'release',
        payload: { releaseId: release.id, week },
        priority: 74,
        refType: 'project', refId: project.id,
      });
    }
  }

  if (release.theaterCount > 0) {
    for (let day = 0; day < 42; day++) {
      sim.schedule({
        at: addDays(release.openingDate, day, sim.homeZone),
        kind: 'rel.box_office_day',
        label: `${project.title} — Box Office Day ${day + 1}`,
        category: 'release',
        payload: { releaseId: release.id, day },
        priority: 76,
        refType: 'project', refId: project.id,
      });
    }
  }

  sim.schedule({
    at: addDays(release.openingDate, 95, sim.homeZone),
    kind: 'rel.close',
    label: `${project.title} — Run Closes`,
    category: 'release',
    payload: { releaseId: release.id },
    priority: 40,
    refType: 'project', refId: project.id,
  });

  sim.notify({
    category: 'release',
    title: `${project.title} is out`,
    body: release.theaterCount > 0
      ? `Opening in ${release.theaterCount.toLocaleString('en-US')} theatres.`
      : `Streaming on ${release.distributorName}.`,
    importance: 88, route: '/workspace/projects',
  });
  sim.emit('project.released', {
    projectId: project.id, releaseId: release.id,
    strategy: release.strategy, theaterCount: release.theaterCount,
  });
}

function runBoxOfficeDay(sim: Simulation, releaseId: Id, day: number): void {
  const release = sim.universe.releases[releaseId];
  if (!release || release.status !== 'in_release') return;
  const project = sim.universe.projects[release.projectId];
  if (!project) return;

  const campaign = Object.values(sim.universe.marketingCampaigns).find((c) => c.projectId === project.id);
  const rng = sim.rng('box_office', release.id, day);

  const quality = project.finalQuality ?? 50;
  const critics = project.criticScore ?? quality;
  const audience = project.audienceScore ?? quality;
  const appetite = project.genres.reduce((s, g) => s + (GENRE_APPETITE[g] ?? 45), 0) / Math.max(1, project.genres.length);

  // Opening is driven by awareness and intent. Legs are driven by word of mouth.
  const awareness = campaign?.awareness ?? 25;
  const intent = campaign?.intent ?? 15;

  const starPower = project.castIds.reduce((s, id) => s + (sim.universe.people[id]?.reputation.publicFame ?? 0), 0) / Math.max(1, project.castIds.length);

  if (day === 0) {
    // Opening day admissions.
    // A series people want more of opens bigger than a standalone; one they
    // are tired of opens smaller, however good this entry happens to be.
    const perTheatre = remap(awareness, 0, 100, 120, 2600)
      * remap(intent, 0, 100, 0.35, 1.9)
      * remap(appetite, 0, 100, 0.6, 1.35)
      * remap(starPower, 0, 100, 0.85, 1.35)
      * franchiseLift(sim, project)
      * rng.float(0.82, 1.22);
    const admissions = Math.round(release.theaterCount * perTheatre / 10);
    const ticketPrice = 1_150;
    const gross = admissions * ticketPrice;
    recordBoxOfficeDay(sim, release, project, day, gross, rng);
    return;
  }

  const previous = release.dailyBoxOffice[day - 1];
  if (!previous) return;

  // Word of mouth: the gap between what people expected and what they got.
  const wordOfMouth = remap(audience - intent * 0.55, -40, 40, 0.72, 1.16);
  const weekday = (day % 7);
  const weekdayFactor = weekday === 5 ? 1.55 : weekday === 6 ? 1.35 : weekday === 0 ? 0.98 : 0.62;
  const decay = Math.pow(0.86 * wordOfMouth, 1) * (day < 7 ? 1 : 0.94);

  // Platform releases expand rather than contract in the early weeks.
  if (release.strategy === 'platform' && day > 6 && release.theaterCount < release.maxTheaterCount) {
    const expansion = critics > 72 ? 4.5 : critics > 58 ? 2.4 : 1.15;
    release.theaterCount = Math.min(release.maxTheaterCount, Math.round(release.theaterCount * expansion));
  } else if (day > 21) {
    release.theaterCount = Math.round(release.theaterCount * 0.82);
  }

  const base = previous.domestic / Math.max(0.4, weekdayFactorOf(day - 1));
  const gross = Math.max(0, Math.round(base * decay * weekdayFactor * rng.float(0.9, 1.1)));
  recordBoxOfficeDay(sim, release, project, day, gross, rng);
}

function weekdayFactorOf(day: number): number {
  const weekday = day % 7;
  return weekday === 5 ? 1.55 : weekday === 6 ? 1.35 : weekday === 0 ? 0.98 : 0.62;
}

function recordBoxOfficeDay(
  sim: Simulation, release: Release, project: Project, day: number, gross: Money, rng: ReturnType<Simulation['rng']>,
): void {
  const rank = clamp(Math.round(remap(gross, 0, 25_000_000_00, 12, 1)), 1, 15);
  release.dailyBoxOffice.push({
    date: addDays(release.openingDate, day, sim.homeZone),
    domestic: gross,
    theaters: release.theaterCount,
    rank,
  });
  release.totalDomestic += gross;
  project.boxOfficeDomestic = release.totalDomestic;

  // International tracks domestic with a genre-dependent multiplier.
  const internationalMultiplier = project.genres.some((g) => ['action', 'adventure', 'science fiction', 'fantasy', 'animation'].includes(g)) ? 1.45 : 0.72;
  const international = Math.round(gross * internationalMultiplier * rng.float(0.85, 1.15));
  release.totalInternational += international;
  project.boxOfficeInternational = release.totalInternational;

  if (day === 2) {
    const openingWeekend = release.dailyBoxOffice.slice(0, 3).reduce((s, d) => s + d.domestic, 0);
    sim.notify({
      category: 'release',
      title: `${project.title} opened to ${formatMoneyCompact(openingWeekend)}`,
      body: `${release.theaterCount.toLocaleString('en-US')} theatres, ${formatMoney(Math.round(openingWeekend / Math.max(1, release.theaterCount)))} per screen.`,
      importance: 84, route: '/workspace/projects',
    });
    sim.remember({
      category: 'project',
      title: `${project.title} opened to ${formatMoneyCompact(openingWeekend)}`,
      detail: `Three-day domestic across ${release.theaterCount.toLocaleString('en-US')} theatres.`,
      refs: [{ type: 'project', id: project.id }],
      significance: 72, public: true, amount: openingWeekend,
    });
    sim.emit('rel.opening_weekend', { projectId: project.id, releaseId: release.id, gross: openingWeekend, theaters: release.theaterCount });
  }
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

function runStreamingWindow(sim: Simulation, releaseId: Id, week: number): void {
  const release = sim.universe.releases[releaseId];
  if (!release || !release.streamingResults) return;
  const project = sim.universe.projects[release.projectId];
  if (!project) return;

  const campaign = Object.values(sim.universe.marketingCampaigns).find((c) => c.projectId === project.id);
  const rng = sim.rng('streaming', release.id, week);
  const quality = project.finalQuality ?? 50;
  const audience = project.audienceScore ?? quality;
  const awareness = campaign?.awareness ?? 30;

  const buyer = (project.studioId ? BUYERS.get(project.studioId) : undefined) ?? BUYERS.all().find((b) => b.name === release.distributorName);
  // Reachable households by service. SLATE's estimates from the services'
  // last published membership figures, not live numbers.
  const subscriberBase = buyer?.type === 'streamer' ? (STREAMER_REACH[buyer.id] ?? 60_000_000) : 40_000_000;

  const starPower = project.castIds.reduce((s, id) => s + (sim.universe.people[id]?.reputation.publicFame ?? 0), 0) / Math.max(1, project.castIds.length);

  // Starts: how many households pressed play at all.
  const weekDecay = Math.pow(0.52, week);
  const startRate = remap(awareness, 0, 100, 0.004, 0.085)
    * remap(starPower, 0, 100, 0.8, 1.6)
    * remap(quality, 0, 100, 0.7, 1.35)
    * weekDecay * rng.float(0.85, 1.2);
  const starts = Math.round(subscriberBase * startRate);

  // Completion: whether they finished it. This is what decides renewals.
  const completion = clamp(remap(audience, 0, 100, 0.28, 0.87) * rng.float(0.92, 1.08), 0.1, 0.95);
  const runtimeHours = project.format === 'feature' ? 1.9 : project.format === 'limited_series' ? 5.5 : 8.2;
  const hours = Math.round(starts * completion * runtimeHours);

  const results = release.streamingResults;
  results.starts += starts;
  results.hoursViewed += hours;
  results.completionRate = Number(((results.completionRate * week + completion) / (week + 1)).toFixed(3));
  results.retentionCurve.push(Number(completion.toFixed(3)));

  const rank = clamp(Math.round(remap(starts, 0, 12_000_000, 12, 1)), 1, 20);
  results.peakRank = Math.min(results.peakRank, rank);
  if (week === 0) {
    results.territoryTop10 = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany']
      .slice(0, clamp(Math.round(remap(starts, 0, 6_000_000, 0, 5)), 0, 5));
  }

  project.streamingHoursViewed = results.hoursViewed;

  if (week === 0) {
    sim.notify({
      category: 'release',
      title: `${project.title} — first week on ${release.distributorName}`,
      body: `${(starts / 1_000_000).toFixed(1)}M starts, ${(hours / 1_000_000).toFixed(1)}M hours viewed, ${Math.round(completion * 100)}% completion. Peaked at number ${rank}.`,
      importance: 80, route: '/workspace/projects',
    });
    sim.remember({
      category: 'project',
      title: `${project.title} launched on ${release.distributorName}`,
      detail: `${(starts / 1_000_000).toFixed(1)} million starts in week one, ${Math.round(completion * 100)}% completion.`,
      refs: [{ type: 'project', id: project.id }],
      significance: 70, public: true,
    });
  }

  sim.emit('rel.streaming_week', {
    projectId: project.id, releaseId: release.id, week,
    starts, hoursViewed: hours, completion, rank,
  });
}

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

function closeRelease(sim: Simulation, releaseId: Id): void {
  const release = sim.universe.releases[releaseId];
  if (!release || release.status === 'closed') return;
  const project = sim.universe.projects[release.projectId];
  if (!project) return;

  release.status = 'closed';

  // --- Theatrical settlement ---------------------------------------------
  // Exhibitors keep their share. The distributor takes a fee off the rentals.
  // Prints and advertising comes off before anything reaches the producer.
  const worldGross = release.totalDomestic + release.totalInternational;
  const rentals = applyRate(release.totalDomestic, 1 - release.exhibitorShare)
    + applyRate(release.totalInternational, 1 - 0.6);
  const distributionFee = applyRate(rentals, release.distributorShare);
  const campaign = Object.values(sim.universe.marketingCampaigns).find((c) => c.projectId === project.id);
  const pAndA = campaign?.spent ?? 0;

  // --- Streaming settlement ----------------------------------------------
  // A streaming original is bought for a fee plus an overage, not a share.
  let streamingRevenue = 0;
  if (release.streamingResults) {
    const perHour = 6; // cents per hour viewed, calibrated
    streamingRevenue = Math.round(release.streamingResults.hoursViewed * perHour)
      + (release.strategy === 'streaming_exclusive' ? applyRate(project.budget, 1.12) : 0);
  }

  const netToDistributor = Math.max(0, rentals - distributionFee - pAndA) + streamingRevenue;
  const netToProducer = Math.max(0, netToDistributor);

  release.netToDistributor = netToDistributor;
  release.netToProducer = netToProducer;
  project.totalRevenue = netToProducer;
  project.totalCost = (project.totalCost || project.spent) + pAndA;

  // Pay the producer side into a real account.
  const payee = project.ownerCompanyId
    ? sim.universe.companies[project.ownerCompanyId]?.cashAccountId
    : sim.universe.people[project.createdById]?.primaryAccountId;
  if (payee && netToProducer > 0) {
    sim.income(payee, netToProducer, `${project.title} — distributor settlement`, 'royalty', { refType: 'project', refId: project.id });
  }

  // Backend participation, paid only if the picture is actually in profit.
  const contracts = Object.values(sim.universe.contracts).filter(
    (c) => c.projectId === project.id && c.backendPoints && c.status !== 'terminated',
  );
  const profit = project.totalRevenue - project.totalCost;
  for (const contract of contracts) {
    const basis = contract.backendKind === 'gross' ? worldGross
      : contract.backendKind === 'adjusted_gross' ? rentals
        : Math.max(0, profit);
    const share = applyRate(basis, contract.backendPoints ?? 0);
    if (share <= 0) continue;
    const source = payee;
    const recipient = contract.partyBKind === 'company'
      ? sim.universe.companies[contract.partyBId]?.cashAccountId
      : sim.universe.people[contract.partyBId]?.primaryAccountId;
    if (source && recipient && sim.ledger.availableFunds(source) >= share) {
      sim.transfer(source, recipient, share, `${project.title} — backend participation`, 'royalty', { refType: 'contract', refId: contract.id });
    }
  }

  advancePhase(sim, project, 'library');

  const summary = release.theaterCount > 0
    ? `${formatMoneyCompact(worldGross)} worldwide against a ${formatMoneyCompact(project.budget)} budget.`
    : `${((release.streamingResults?.hoursViewed ?? 0) / 1_000_000).toFixed(1)}M hours viewed.`;

  sim.audit({
    kind: 'rel.settlement', subjectType: 'project', subjectId: project.id,
    question: 'Where did the money actually go?',
    summary: `${formatMoneyCompact(worldGross)} gross became ${formatMoneyCompact(netToProducer)} of producer revenue.`,
    factors: [
      { label: 'Worldwide Gross', detail: `${formatMoneyCompact(release.totalDomestic)} domestic and ${formatMoneyCompact(release.totalInternational)} international.`, weight: 1, contribution: worldGross, knowable: true },
      { label: 'Exhibitor Share', detail: `Theatres keep about ${Math.round(release.exhibitorShare * 100)}% of domestic and more internationally. That never reaches the studio.`, weight: 0.5, contribution: -(worldGross - rentals), knowable: true },
      { label: 'Distribution Fee', detail: `${release.distributorName} takes ${Math.round(release.distributorShare * 100)}% of rentals.`, weight: 0.2, contribution: -distributionFee, knowable: true },
      { label: 'Prints And Advertising', detail: `${formatMoneyCompact(pAndA)} of campaign spend is recouped before profit.`, weight: 0.3, contribution: -pAndA, knowable: true },
      ...(streamingRevenue > 0 ? [{ label: 'Streaming', detail: 'Licence fee plus an overage on hours viewed.', weight: 0.4, contribution: streamingRevenue, knowable: true }] : []),
    ],
    outcome: profit >= 0 ? 'profitable' : 'loss',
  });

  sim.remember({
    category: 'project',
    title: profit >= 0 ? `${project.title} turned a profit` : `${project.title} did not recoup`,
    detail: `${summary} Producer revenue ${formatMoneyCompact(netToProducer)} against ${formatMoneyCompact(project.totalCost)} of cost.`,
    refs: [{ type: 'project', id: project.id }],
    significance: 85, public: true, amount: profit,
  });

  applyCareerConsequences(sim, project, profit);
  recordFranchiseEntry(sim, project, profit);
  sim.emit('project.results_final', {
    projectId: project.id, worldGross, netToProducer, profit,
    criticScore: project.criticScore, audienceScore: project.audienceScore,
  });
}

/** A result changes everyone attached to it. */
function applyCareerConsequences(sim: Simulation, project: Project, profit: Money): void {
  const critics = project.criticScore ?? 50;
  const audience = project.audienceScore ?? 50;
  const roi = project.totalCost > 0 ? profit / project.totalCost : 0;

  const commercialSwing = clamp(remap(roi, -1, 2, -14, 20), -14, 20);
  const criticalSwing = clamp(remap(critics, 20, 90, -10, 16), -10, 16);
  const audienceSwing = clamp(remap(audience, 20, 90, -8, 14), -8, 14);
  const exposure = clamp(remap(project.boxOfficeDomestic + project.boxOfficeInternational, 0, 800_000_000_00, 1, 14), 1, 14);

  const people = new Set<Id>([...project.castIds, ...project.writerIds, ...project.producerIds]);
  if (project.directorId) people.add(project.directorId);

  for (const personId of people) {
    const person = sim.universe.people[personId];
    if (!person) continue;
    const isLead = project.attachments.some((a) => a.personId === personId && (a.role === 'lead' || a.role === 'director'));
    const weight = isLead ? 1 : 0.45;

    person.reputation.industryDemand = clamp(person.reputation.industryDemand + commercialSwing * weight, 0, 100);
    person.reputation.professionalReputation = clamp(person.reputation.professionalReputation + criticalSwing * weight, 0, 100);
    person.reputation.audienceAppeal = clamp(person.reputation.audienceAppeal + audienceSwing * weight, 0, 100);
    person.reputation.prestige = clamp(person.reputation.prestige + (critics > 78 ? 8 : critics < 40 ? -5 : 1) * weight, 0, 100);
    person.reputation.publicFame = clamp(person.reputation.publicFame + exposure * weight, 0, 100);

    // Quotes move with results, which is how careers actually compound.
    if (commercialSwing > 6 && isLead) {
      person.quote = Math.round(person.quote * clamp(1 + commercialSwing / 60, 1, 1.6));
    } else if (commercialSwing < -6 && isLead) {
      person.quote = Math.round(person.quote * 0.86);
    }

    if (!person.creditIds.includes(project.id)) person.creditIds.push(project.id);
  }
}

/** Live release state for the workspace UI. */
export function releaseSummary(sim: Simulation, projectId: Id) {
  const project = sim.universe.projects[projectId];
  if (!project?.releaseId) return undefined;
  const release = sim.universe.releases[project.releaseId];
  if (!release) return undefined;
  const campaign = Object.values(sim.universe.marketingCampaigns).find((c) => c.projectId === projectId);
  const reviews = Object.values(sim.universe.reviews).filter((r) => r.projectId === projectId);
  return {
    release, campaign, reviews,
    worldGross: release.totalDomestic + release.totalInternational,
    openingWeekend: release.dailyBoxOffice.slice(0, 3).reduce((s, d) => s + d.domestic, 0),
    profit: project.totalRevenue - project.totalCost,
  };
}

export function formatOpeningDate(sim: Simulation, release: Release): string {
  return formatDate(release.openingDate, sim.homeZone);
}

// ---------------------------------------------------------------------------
// Franchises and the library
// ---------------------------------------------------------------------------

/**
 * A film that worked becomes something a studio wants more of.
 *
 * A franchise is not a label on a project; it is a thing with its own state.
 * Every entry raises the audience's appetite when it lands and spends it when
 * it does not, and every entry raises fatigue whether it lands or not. That is
 * why the third one opens bigger than the first and the sixth does not, and it
 * is what the merchandise arm has always read from.
 */
export function registerFranchises(sim: Simulation): void {
  sim.onCommand<{ projectId: Id; name?: string }, { franchiseId: Id; strength: number }>(
    'film.start_franchise',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (project.franchiseId) {
        throw new CommandError(`${project.title} is already part of ${s.universe.franchises[project.franchiseId]?.name ?? 'a franchise'}.`);
      }
      if (project.phase !== 'library' && project.phase !== 'released') {
        throw new CommandError(`${project.title} has not been released yet. There is nothing to build on.`);
      }

      // You cannot make more of something you do not hold the rights to.
      const rights = project.rightsId ? s.universe.rights[project.rightsId] : undefined;
      if (!rights || rights.status !== 'active') {
        throw new CommandError(`${project.title} has no active chain of title.`);
      }
      if (!rights.scope.sequelRights) {
        throw new CommandError(
          `The rights you hold on ${project.title} do not include sequels. That has to be negotiated before anyone can build a franchise on it.`,
        );
      }

      // And nobody builds a franchise on something nobody watched.
      const reception = receptionOf(project);
      if (reception < 45) {
        throw new CommandError(
          `${project.title} did not land well enough to build on. Reception reads ${Math.round(reception)} out of 100.`,
        );
      }

      const franchise: Franchise = {
        id: s.nextId('franchise'),
        saveId: s.universe.meta.id,
        name: p.name?.trim() || `${project.title} franchise`,
        ownerCompanyId: project.ownerCompanyId,
        projectIds: [project.id],
        strength: clamp(Math.round(reception * 0.7), 0, 100),
        fatigue: 0,
        totalRevenue: project.totalRevenue,
        merchandiseRevenue: 0,
        startedAt: s.now,
      };
      s.universe.franchises[franchise.id] = franchise;
      project.franchiseId = franchise.id;

      s.remember({
        category: 'project',
        title: `${franchise.name} begins`,
        detail: `${project.title} did well enough to build on. Audience appetite starts at ${franchise.strength} out of 100.`,
        refs: [{ type: 'project', id: project.id }, { type: 'franchise', id: franchise.id }],
        significance: 70, public: true,
      });
      s.emit('franchise.started', { franchiseId: franchise.id, projectId: project.id });
      return { franchiseId: franchise.id, strength: franchise.strength };
    },
  );

  sim.onCommand<{ franchiseId: Id; projectId: Id }, { entries: number; strength: number; fatigue: number }>(
    'film.add_to_franchise',
    (p, { sim: s }) => {
      const franchise = s.universe.franchises[p.franchiseId];
      if (!franchise) throw new CommandError('No such franchise.');
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (project.franchiseId === franchise.id) throw new CommandError(`${project.title} is already an entry in it.`);
      if (project.franchiseId) throw new CommandError(`${project.title} belongs to another franchise.`);
      if (project.phase === 'library') {
        throw new CommandError(`${project.title} has already run its course. Add a picture before it is released, not after.`);
      }

      project.franchiseId = franchise.id;
      if (!franchise.projectIds.includes(project.id)) franchise.projectIds.push(project.id);
      s.emit('franchise.entry_added', { franchiseId: franchise.id, projectId: project.id });
      return { entries: franchise.projectIds.length, strength: franchise.strength, fatigue: franchise.fatigue };
    },
  );

  // Appetite recovers with time away, which is the whole reason a series is
  // ever rested rather than run into the ground.
  sim.onSchedule('franchise.cool_off', () => {
    for (const franchise of Object.values(sim.universe.franchises)) {
      franchise.fatigue = clamp(franchise.fatigue - 1.6, 0, 100);
    }
    sim.schedule({
      at: addDays(sim.now, 30, sim.homeZone),
      kind: 'franchise.cool_off',
      label: 'Franchise Appetite',
      category: 'system',
      priority: 94,
    });
  });
}

/** How well a finished picture was received, on one 0-100 scale. */
function receptionOf(project: Project): number {
  return (project.finalQuality ?? 0) * 0.5
    + (project.criticScore ?? 0) * 0.25
    + (project.audienceScore ?? 0) * 0.25;
}

/**
 * What being part of a franchise is worth to a new entry, as a multiplier on
 * its opening. Appetite helps; fatigue takes it back.
 */
export function franchiseLift(sim: Simulation, project: Project): number {
  const franchise = project.franchiseId ? sim.universe.franchises[project.franchiseId] : undefined;
  if (!franchise) return 1;
  const entries = franchise.projectIds.length;
  if (entries <= 1) return 1;
  return clamp(1 + franchise.strength / 130 - franchise.fatigue / 90, 0.55, 1.75);
}

/**
 * Folds a finished entry back into the franchise. A hit buys appetite for the
 * next one; a disappointment spends it. Every entry costs some novelty either
 * way, so a series that never rests wears out however good it is.
 */
export function recordFranchiseEntry(sim: Simulation, project: Project, profit: Money): void {
  const franchise = project.franchiseId ? sim.universe.franchises[project.franchiseId] : undefined;
  if (!franchise) return;

  const reception = receptionOf(project);
  const roi = project.totalCost > 0 ? profit / project.totalCost : 0;
  const landed = reception * 0.6 + clamp(roi, -1, 2) * 20;

  const before = { strength: franchise.strength, fatigue: franchise.fatigue };
  franchise.strength = clamp(franchise.strength + remap(landed, 10, 80, -14, 12), 0, 100);
  franchise.fatigue = clamp(franchise.fatigue + remap(reception, 30, 85, 16, 6), 0, 100);
  franchise.totalRevenue += project.totalRevenue;
  if (!franchise.projectIds.includes(project.id)) franchise.projectIds.push(project.id);

  sim.audit({
    kind: 'franchise.entry_recorded', subjectType: 'franchise', subjectId: franchise.id,
    question: 'What did this one do to the series?',
    summary: `${project.title} moved appetite from ${Math.round(before.strength)} to ${Math.round(franchise.strength)} `
      + `and fatigue from ${Math.round(before.fatigue)} to ${Math.round(franchise.fatigue)}.`,
    factors: [
      { label: 'How It Was Received', detail: `Reception reads ${Math.round(reception)} out of 100.`, weight: 0.6, contribution: reception, knowable: true },
      { label: 'What It Returned', detail: `${(roi * 100).toFixed(0)}% on cost.`, weight: 0.4, contribution: roi * 100, knowable: true },
      { label: 'Novelty Spent', detail: 'Every entry costs some appetite, however well it does. Time away is what brings it back.', weight: 0.3, contribution: 0, knowable: true },
    ],
    outcome: franchise.strength >= before.strength ? 'strengthened' : 'weakened',
  });
  sim.emit('franchise.entry_recorded', {
    franchiseId: franchise.id, projectId: project.id,
    strength: franchise.strength, fatigue: franchise.fatigue,
  });
}
