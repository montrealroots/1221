/**
 * SLATE — Social media and the creator economy.
 *
 * Four platforms with genuinely different mechanics, one audience engine
 * underneath. A post is not "follower count goes up". It is content of a
 * measurable quality, meeting an audience of a measurable size and affinity,
 * at a time, on a platform, against a level of saturation — and then it either
 * finds people or it does not.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  AudienceSegment, BrandDeal, Id, Person, PlatformId, PostFormat, SocialAccount, SocialPost,
} from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, zonedParts, MS_DAY, MS_MINUTE } from '../core/time';
import { applyRate, formatMoney, type Money } from '../core/money';
import { buildFactors } from '../core/audit';
import { modifierFor } from '../domain/attributes';

// ---------------------------------------------------------------------------
// Platforms
// ---------------------------------------------------------------------------

export interface PlatformDef {
  id: PlatformId;
  name: string;
  tagline: string;
  formats: PostFormat[];
  /** How much the algorithm favours new creators over existing reach, 0-1. */
  discoveryBias: number;
  /** How heavily the algorithm rewards consistency. */
  consistencyWeight: number;
  /** Multiplier on the chance a post breaks out beyond the follower base. */
  viralPotential: number;
  /** Effective revenue per thousand monetised impressions, in cents. */
  baseCpm: Money;
  /** Followers needed before monetisation unlocks. */
  monetisationThreshold: number;
  /** How fast a post's reach decays, in days. */
  halfLifeDays: number;
  /** What this platform is actually good at, for the player-facing help. */
  bestFor: string;
}

export const PLATFORMS: readonly PlatformDef[] = [
  {
    id: 'streamtube', name: 'StreamTube', tagline: 'Long-form video, watch time and a real revenue share.',
    formats: ['long_video', 'short_video', 'livestream'],
    discoveryBias: 0.35, consistencyWeight: 0.9, viralPotential: 1.0,
    baseCpm: 480, monetisationThreshold: 1000, halfLifeDays: 21,
    bestFor: 'Depth. Watch time compounds and the back catalogue keeps earning for years.',
  },
  {
    id: 'pulse', name: 'Pulse', tagline: 'Short video, ruthless algorithm, no memory.',
    formats: ['short_video', 'livestream'],
    discoveryBias: 0.88, consistencyWeight: 0.55, viralPotential: 2.4,
    baseCpm: 65, monetisationThreshold: 10000, halfLifeDays: 3,
    bestFor: 'Reach from nothing. A first post can find a million people and the next one can find nobody.',
  },
  {
    id: 'lumen', name: 'Lumen', tagline: 'Photo, story and the place brands actually spend.',
    formats: ['photo', 'carousel', 'reel', 'story', 'livestream'],
    discoveryBias: 0.45, consistencyWeight: 0.75, viralPotential: 1.3,
    baseCpm: 210, monetisationThreshold: 5000, halfLifeDays: 7,
    bestFor: 'Brand partnerships and a public image you control.',
  },
  {
    id: 'chatter', name: 'Chatter', tagline: 'Text, opinion and the industry conversation.',
    formats: ['text', 'thread', 'photo', 'short_video', 'repost'],
    discoveryBias: 0.55, consistencyWeight: 0.6, viralPotential: 1.8,
    baseCpm: 45, monetisationThreshold: 20000, halfLifeDays: 2,
    bestFor: 'Announcements, industry reach and getting into a public argument.',
  },
];

export const PLATFORM_BY_ID: Readonly<Record<PlatformId, PlatformDef>> =
  Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<PlatformId, PlatformDef>;

/** Effort in minutes and quality ceiling by format. */
const FORMAT_PROFILE: Record<PostFormat, { minMinutes: number; maxMinutes: number; qualityCeiling: number; impressionsBias: number }> = {
  long_video: { minMinutes: 180, maxMinutes: 2400, qualityCeiling: 100, impressionsBias: 0.85 },
  short_video: { minMinutes: 25, maxMinutes: 420, qualityCeiling: 88, impressionsBias: 1.55 },
  livestream: { minMinutes: 60, maxMinutes: 300, qualityCeiling: 78, impressionsBias: 0.6 },
  photo: { minMinutes: 10, maxMinutes: 180, qualityCeiling: 82, impressionsBias: 1.0 },
  carousel: { minMinutes: 25, maxMinutes: 240, qualityCeiling: 86, impressionsBias: 1.12 },
  story: { minMinutes: 3, maxMinutes: 30, qualityCeiling: 60, impressionsBias: 0.55 },
  reel: { minMinutes: 35, maxMinutes: 360, qualityCeiling: 92, impressionsBias: 1.45 },
  text: { minMinutes: 2, maxMinutes: 45, qualityCeiling: 74, impressionsBias: 1.0 },
  thread: { minMinutes: 20, maxMinutes: 180, qualityCeiling: 88, impressionsBias: 1.15 },
  repost: { minMinutes: 1, maxMinutes: 5, qualityCeiling: 35, impressionsBias: 0.45 },
};

const DEFAULT_SEGMENTS: AudienceSegment[] = [
  { key: 'core_fans', size: 0, affinity: 0.62, churnSensitivity: 0.18 },
  { key: 'casual', size: 0, affinity: 0.16, churnSensitivity: 0.55 },
  { key: 'industry', size: 0, affinity: 0.34, churnSensitivity: 0.30 },
  { key: 'international', size: 0, affinity: 0.20, churnSensitivity: 0.42 },
];

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerMedia(sim: Simulation): void {
  sim.onSchedule('social.publish', (item) => publishPost(sim, item.payload.postId as Id));
  sim.onSchedule('social.decay_tick', () => {
    decayPosts(sim);
    sim.schedule({ at: addDays(sim.now, 1, sim.homeZone), kind: 'social.decay_tick', label: 'Audience Update', category: 'system', priority: 88 });
  });
  sim.onSchedule('social.deal_deadline', (item) => checkDealDeadline(sim, item.payload.dealId as Id));
  sim.onSchedule('social.payout', (item) => payCreatorEarnings(sim, item.payload.accountId as Id));

  sim.onCommand<{ platform: PlatformId; handle: string; displayName?: string; bio?: string; ownerId?: Id; ownerKind?: SocialAccount['ownerKind'] }, { accountId: Id }>(
    'social.create_account',
    (p, { sim: s }) => {
      const platform = PLATFORM_BY_ID[p.platform];
      if (!platform) throw new CommandError('No such platform.');
      const ownerId = p.ownerId ?? s.player.id;
      const existing = Object.values(s.universe.socialAccounts).find((a) => a.ownerId === ownerId && a.platform === p.platform);
      if (existing) throw new CommandError(`You already have a ${platform.name} account.`);
      const handleTaken = Object.values(s.universe.socialAccounts).some((a) => a.platform === p.platform && a.handle.toLowerCase() === p.handle.toLowerCase());
      if (handleTaken) throw new CommandError(`The handle @${p.handle} is taken on ${platform.name}.`);

      const owner = s.universe.people[ownerId];
      const startingFollowers = owner ? Math.round(remap(owner.reputation.publicFame, 0, 100, 0, 240_000)) : 0;

      const account: SocialAccount = {
        id: s.nextId('acct'),
        saveId: s.universe.meta.id,
        ownerId,
        ownerKind: p.ownerKind ?? 'person',
        platform: p.platform,
        handle: p.handle,
        displayName: p.displayName ?? owner?.displayName ?? p.handle,
        bio: p.bio ?? '',
        followers: startingFollowers,
        following: 0,
        verified: (owner?.reputation.publicFame ?? 0) > 55,
        createdAt: s.now,
        momentum: 50,
        recentPostCount: 0,
        segments: DEFAULT_SEGMENTS.map((seg) => ({ ...seg, size: Math.round(startingFollowers * (seg.key === 'core_fans' ? 0.28 : seg.key === 'casual' ? 0.46 : seg.key === 'industry' ? 0.08 : 0.18)) })),
        monetisationEnabled: startingFollowers >= platform.monetisationThreshold,
        effectiveCpm: platform.baseCpm,
        lifetimeEarnings: 0,
        totalViews: 0,
      };
      s.universe.socialAccounts[account.id] = account;

      s.schedule({
        at: addDays(s.now, 30, s.homeZone),
        kind: 'social.payout',
        label: `${platform.name} Payout`,
        category: 'finance',
        payload: { accountId: account.id },
        priority: 66,
        recurrence: { unit: 'month', interval: 1 },
        refType: 'social_account', refId: account.id,
      });

      s.emit('social.account_created', { accountId: account.id, platform: p.platform, handle: p.handle });
      return { accountId: account.id };
    },
  );

  sim.onCommand<{ accountId: Id; format: PostFormat; title: string; body?: string; effortMinutes: number; topic?: string; refType?: string; refId?: Id; scheduledFor?: number; brandDealId?: Id }, { postId: Id; publishesAt: number; projectedQuality: number }>(
    'social.create_post',
    (p, { sim: s }) => {
      const account = s.universe.socialAccounts[p.accountId];
      if (!account) throw new CommandError('No such account.');
      const platform = PLATFORM_BY_ID[account.platform];
      if (!platform.formats.includes(p.format)) {
        throw new CommandError(`${platform.name} does not support ${p.format.replace(/_/g, ' ')}.`);
      }

      const profile = FORMAT_PROFILE[p.format];
      const effort = clamp(p.effortMinutes, profile.minMinutes, profile.maxMinutes);
      const owner = s.universe.people[account.ownerId];
      if (!owner) throw new CommandError('That account has no owner.');

      const quality = computePostQuality(s, owner, p.format, effort);

      const post: SocialPost = {
        id: s.nextId('post'),
        saveId: s.universe.meta.id,
        accountId: account.id,
        platform: account.platform,
        format: p.format,
        title: p.title,
        body: p.body ?? '',
        quality,
        effortMinutes: effort,
        postedAt: p.scheduledFor ?? s.now,
        scheduledFor: p.scheduledFor,
        status: p.scheduledFor && p.scheduledFor > s.now ? 'scheduled' : 'draft',
        topic: p.topic ?? 'general',
        refType: p.refType,
        refId: p.refId,
        metrics: { impressions: 0, views: 0, watchTimeMinutes: 0, completionRate: 0, likes: 0, comments: 0, shares: 0, saves: 0, followersGained: 0 },
        revenue: 0,
        viral: false,
        sentiment: 0,
        brandDealId: p.brandDealId,
        decayDaysRemaining: platform.halfLifeDays * 3,
      };
      s.universe.socialPosts[post.id] = post;

      // Making the thing takes real time out of the player's day.
      if (!p.scheduledFor) {
        s.advanceTo(s.now + effort * MS_MINUTE);
        owner.wellbeing.energy = clamp(owner.wellbeing.energy - effort / 22, 0, 100);
        post.postedAt = s.now;
      }

      const publishesAt = p.scheduledFor ?? s.now;
      s.schedule({
        at: publishesAt,
        kind: 'social.publish',
        label: `${platform.name} Post — ${p.title}`,
        category: 'social',
        payload: { postId: post.id },
        priority: 70,
        refType: 'post', refId: post.id,
      });

      return { postId: post.id, publishesAt, projectedQuality: quality };
    },
  );

  sim.onCommand<{ dealId: Id; accept: boolean }, { status: string }>(
    'social.respond_to_deal',
    (p, { sim: s }) => {
      const deal = s.universe.brandDeals[p.dealId];
      if (!deal || deal.status !== 'offered') throw new CommandError('That offer is no longer open.');
      s.resolveDecision('brand_deal', deal.id);

      if (!p.accept) {
        deal.status = 'declined';
        return { status: deal.status };
      }

      deal.status = 'active';
      const player = s.universe.people[deal.personId];
      const accountId = player?.primaryAccountId;
      const upfront = Math.round(deal.compensation * 0.4);
      if (accountId) {
        s.income(accountId, upfront, `${deal.brandName} — advance`, 'sponsorship', { refType: 'deal', refId: deal.id });
        deal.paidAmount += upfront;
      }

      s.schedule({
        at: deal.deadlineAt,
        kind: 'social.deal_deadline',
        label: `${deal.brandName} Deliverables Due`,
        category: 'career',
        payload: { dealId: deal.id },
        priority: 45,
        refType: 'deal', refId: deal.id,
        requiresPlayer: false,
      });

      s.remember({
        category: 'social',
        title: `Signed with ${deal.brandName}`,
        detail: `${deal.deliverables.map((d) => `${d.count} ${d.format.replace(/_/g, ' ')}`).join(', ')} for ${formatMoney(deal.compensation)}.`,
        refs: [{ type: 'deal', id: deal.id }],
        significance: 40, public: false, amount: deal.compensation,
      });
      s.emit('social.deal_accepted', { dealId: deal.id, brandName: deal.brandName, compensation: deal.compensation });
      return { status: deal.status };
    },
  );

}

// ---------------------------------------------------------------------------
// The audience engine
// ---------------------------------------------------------------------------

export function computePostQuality(sim: Simulation, owner: Person, format: PostFormat, effortMinutes: number): number {
  const profile = FORMAT_PROFILE[format];

  const relevantSkill = format === 'text' || format === 'thread'
    ? (owner.skills['dialogue'] ?? 0) * 0.5 + (owner.skills['content_strategy'] ?? 0) * 0.5
    : format === 'livestream'
      ? (owner.skills['on_camera_hosting'] ?? 0)
      : (owner.skills['editing_software'] ?? 0) * 0.55 + (owner.skills['content_strategy'] ?? 0) * 0.45;

  const instinct = owner.attributes['social_instinct'] ?? 20;
  const charisma = owner.attributes['charisma'] ?? 20;

  // Equipment the player actually owns raises the ceiling on produced content.
  let gearBonus = 0;
  for (const asset of Object.values(sim.universe.assets)) {
    if (asset.ownerId !== owner.id || asset.soldAt) continue;
    if (asset.tags.includes('content')) gearBonus += 4;
    if (asset.catalogId === 'laptop_pro') gearBonus += 3;
  }
  gearBonus = Math.min(14, gearBonus);

  const effortFactor = remap(
    Math.log10(Math.max(1, effortMinutes)) - Math.log10(profile.minMinutes),
    0, Math.log10(profile.maxMinutes) - Math.log10(profile.minMinutes) || 1,
    0.55, 1.15,
  );

  const base = relevantSkill * 0.34 + instinct * 0.26 + charisma * 0.18 + gearBonus;
  const readinessPenalty = remap(owner.wellbeing.energy, 0, 100, 0.78, 1.05);

  return clamp(Math.round(base * effortFactor * readinessPenalty), 3, profile.qualityCeiling);
}

function publishPost(sim: Simulation, postId: Id): void {
  const post = sim.universe.socialPosts[postId];
  if (!post || post.status === 'published') return;
  const account = sim.universe.socialAccounts[post.accountId];
  if (!account) return;
  const platform = PLATFORM_BY_ID[account.platform];
  const owner = sim.universe.people[account.ownerId];
  if (!owner) return;

  post.status = 'published';
  post.postedAt = sim.now;
  account.lastPostAt = sim.now;
  account.recentPostCount += 1;

  const profile = FORMAT_PROFILE[post.format];
  const rng = sim.rng('social_post', post.id);

  // --- Reach ---------------------------------------------------------------
  const followerReach = account.segments.reduce((s, seg) => s + seg.size * seg.affinity, 0);
  const cadence = recentCadence(sim, account.id);
  const consistencyFactor = remap(cadence, 0, 5, 0.72, 1.28) * platform.consistencyWeight + (1 - platform.consistencyWeight);
  const momentumFactor = remap(account.momentum, 0, 100, 0.6, 1.5);
  const qualityFactor = remap(post.quality, 0, 100, 0.35, 1.75);
  const timingFactor = postingTimeFactor(sim, post.postedAt);
  const saturation = remap(account.recentPostCount, 0, 30, 1.05, 0.72);
  const fameFactor = 1 + remap(owner.reputation.publicFame, 0, 100, 0, 1.6);

  // Discovery: how many non-followers the algorithm shows it to.
  const discoveryPool = platform.discoveryBias * (10_000 + followerReach * 2.4);
  const discovery = discoveryPool * qualityFactor * timingFactor * rng.float(0.35, 1.45);

  let impressions = Math.round(
    (followerReach * profile.impressionsBias * consistencyFactor * momentumFactor * qualityFactor * timingFactor * saturation
      + discovery) * fameFactor,
  );

  // --- Virality ------------------------------------------------------------
  const viralInstinct = modifierFor(owner, 'viralOdds');
  const socialGrowthTrait = modifierFor(owner, 'socialGrowth');
  const viralProbability = clamp(
    (post.quality / 100) ** 2.4 * 0.16 * platform.viralPotential * viralInstinct * timingFactor,
    0.0005, 0.34,
  );
  const viralRoll = rng.next();
  post.viral = viralRoll < viralProbability;
  if (post.viral) {
    impressions = Math.round(impressions * rng.float(6, 55) * platform.viralPotential);
  }

  // --- Engagement ----------------------------------------------------------
  const engagementRate = clamp(
    remap(post.quality, 0, 100, 0.012, 0.11) * rng.float(0.7, 1.35),
    0.002, 0.20,
  );
  const completion = clamp(remap(post.quality, 0, 100, 0.22, 0.86) * rng.float(0.85, 1.12), 0.05, 0.95);
  const views = post.format === 'text' || post.format === 'thread'
    ? Math.round(impressions * 0.55)
    : Math.round(impressions * clamp(remap(post.quality, 0, 100, 0.18, 0.62), 0.05, 0.8));

  post.metrics.impressions = impressions;
  post.metrics.views = views;
  post.metrics.completionRate = Number(completion.toFixed(3));
  post.metrics.watchTimeMinutes = Math.round(views * completion * (post.format === 'long_video' ? 9 : post.format === 'livestream' ? 22 : 0.6));
  post.metrics.likes = Math.round(views * engagementRate);
  post.metrics.comments = Math.round(post.metrics.likes * rng.float(0.03, 0.14));
  post.metrics.shares = Math.round(post.metrics.likes * rng.float(0.04, 0.22) * (post.viral ? 3 : 1));
  post.metrics.saves = Math.round(post.metrics.likes * rng.float(0.02, 0.16));

  // --- Followers -----------------------------------------------------------
  const conversionRate = clamp(
    remap(post.quality, 0, 100, 0.0008, 0.028) * (post.viral ? 1.8 : 1) * socialGrowthTrait,
    0.0002, 0.06,
  );
  const gained = Math.round(views * conversionRate);
  // A weak post also loses you people.
  const churn = post.quality < 35
    ? Math.round(account.segments.reduce((s, seg) => s + seg.size * seg.churnSensitivity * 0.004, 0))
    : 0;
  const net = gained - churn;

  post.metrics.followersGained = net;
  applyFollowerChange(account, net, post.quality);

  post.sentiment = clamp(Math.round(remap(post.quality, 0, 100, -45, 70) + rng.int(-12, 12) - owner.reputation.controversy * 0.3), -100, 100);

  // --- Momentum ------------------------------------------------------------
  const expected = Math.max(1, followerReach * 0.35);
  const performance = impressions / expected;
  account.momentum = clamp(account.momentum * 0.82 + remap(performance, 0, 3, 20, 96) * 0.18, 0, 100);
  account.totalViews += views;

  if (!account.monetisationEnabled && account.followers >= platform.monetisationThreshold) {
    account.monetisationEnabled = true;
    sim.notify({
      category: 'social', title: `Monetisation unlocked on ${platform.name}`,
      body: `@${account.handle} has passed ${platform.monetisationThreshold.toLocaleString('en-US')} followers.`,
      importance: 62, route: '/workspace/social',
    });
  }

  // --- Revenue -------------------------------------------------------------
  if (account.monetisationEnabled) {
    const cpm = Math.round(platform.baseCpm * remap(post.quality, 0, 100, 0.55, 1.5) * remap(account.segments.find((s) => s.key === 'international')?.size ?? 0, 0, account.followers || 1, 1.15, 0.82));
    account.effectiveCpm = cpm;
    post.revenue = Math.round((impressions / 1000) * cpm);
  }

  // --- Audit ---------------------------------------------------------------
  const { factors } = buildFactors([
    { label: 'Content Quality', detail: `${post.quality} out of 100, from your skill, the effort you put in and the gear you own.`, weight: 0.34, value: post.quality / 100 },
    { label: 'Existing Audience', detail: `${account.followers.toLocaleString('en-US')} followers, of whom the algorithm showed it to a fraction.`, weight: 0.22, value: clamp(followerReach / 200_000, 0, 1) },
    { label: 'Posting Consistency', detail: `${cadence.toFixed(1)} posts a week over the last month.`, weight: 0.14, value: clamp(cadence / 5, 0, 1) },
    { label: 'Momentum', detail: `Recent posts have been performing at ${Math.round(account.momentum)} out of 100.`, weight: 0.12, value: account.momentum / 100 },
    { label: 'Timing', detail: `Posted at ${zonedParts(post.postedAt, sim.homeZone).hour}:00 local.`, weight: 0.08, value: timingFactor / 1.25 },
    { label: 'Your Public Profile', detail: `Fame at ${Math.round(owner.reputation.publicFame)} out of 100 carries reach on its own.`, weight: 0.10, value: owner.reputation.publicFame / 100 },
    { label: 'The Algorithm', detail: 'What else was competing for the same feed slot that day.', weight: 0.16, value: rng.float(0, 1), knowable: false },
  ]);

  sim.audit({
    kind: 'social.post_performance', subjectType: 'post', subjectId: post.id,
    question: 'Why did this post do what it did?',
    summary: post.viral
      ? `It broke out. ${impressions.toLocaleString('en-US')} impressions, well beyond your follower base.`
      : `${impressions.toLocaleString('en-US')} impressions and ${net >= 0 ? `${net.toLocaleString('en-US')} new followers` : `${(-net).toLocaleString('en-US')} followers lost`}.`,
    factors, seed: `social_post|${post.id}`,
    roll: viralRoll, probability: viralProbability, score: post.quality / 100,
    outcome: post.viral ? 'viral' : net > 0 ? 'growth' : 'flat',
  });

  if (post.viral) {
    sim.notify({
      category: 'social', title: `"${post.title}" is going viral`,
      body: `${impressions.toLocaleString('en-US')} impressions and ${net.toLocaleString('en-US')} new followers on ${platform.name}.`,
      importance: 74, route: '/workspace/social',
    });
    owner.reputation.publicFame = clamp(owner.reputation.publicFame + remap(impressions, 100_000, 20_000_000, 0.4, 6), 0, 100);
    sim.remember({
      category: 'social',
      title: `A post broke out on ${platform.name}`,
      detail: `"${post.title}" reached ${impressions.toLocaleString('en-US')} people.`,
      refs: [{ type: 'post', id: post.id }],
      significance: 45, public: true,
    });
  }

  // Brand deliverables count only when they are actually published.
  if (post.brandDealId) {
    const deal = sim.universe.brandDeals[post.brandDealId];
    const line = deal?.deliverables.find((d) => d.format === post.format && d.delivered < d.count);
    if (line) line.delivered += 1;
  }

  sim.emit('social.post_published', {
    postId: post.id, accountId: account.id, platform: account.platform,
    impressions, followersGained: net, viral: post.viral, revenue: post.revenue,
    topic: post.topic, refType: post.refType, refId: post.refId,
  });
}

function applyFollowerChange(account: SocialAccount, delta: number, quality: number): void {
  account.followers = Math.max(0, account.followers + delta);
  if (delta === 0) return;

  // New followers arrive mostly casual; quality content converts core fans.
  const coreShare = clamp(remap(quality, 0, 100, 0.06, 0.42), 0.05, 0.5);
  const distribution: Record<string, number> = {
    core_fans: coreShare,
    casual: 0.52 - coreShare * 0.4,
    industry: 0.06,
    international: 0.42 - coreShare * 0.6,
  };
  for (const segment of account.segments) {
    const share = distribution[segment.key] ?? 0.25;
    segment.size = Math.max(0, Math.round(segment.size + delta * share));
  }
  const total = account.segments.reduce((s, seg) => s + seg.size, 0);
  if (total !== account.followers && account.segments.length > 0) {
    const first = account.segments[0] as AudienceSegment;
    first.size = Math.max(0, first.size + (account.followers - total));
  }
}

function recentCadence(sim: Simulation, accountId: Id): number {
  const from = sim.now - 28 * MS_DAY;
  const count = Object.values(sim.universe.socialPosts).filter(
    (p) => p.accountId === accountId && p.status === 'published' && p.postedAt >= from,
  ).length;
  return count / 4;
}

/** Posting at 3 AM reaches fewer people than posting at 7 PM. */
function postingTimeFactor(sim: Simulation, at: number): number {
  const hour = zonedParts(at, sim.homeZone).hour;
  const curve = [0.55, 0.48, 0.44, 0.42, 0.45, 0.58, 0.74, 0.92, 1.02, 1.0, 0.96, 0.98,
    1.05, 1.02, 0.98, 1.0, 1.08, 1.16, 1.25, 1.24, 1.18, 1.05, 0.86, 0.68];
  return curve[hour] ?? 1;
}

/** Posts keep earning after they are published; this is where that happens. */
function decayPosts(sim: Simulation): void {
  for (const post of Object.values(sim.universe.socialPosts)) {
    if (post.status !== 'published' || post.decayDaysRemaining <= 0) continue;
    const account = sim.universe.socialAccounts[post.accountId];
    if (!account) continue;
    const platform = PLATFORM_BY_ID[account.platform];

    const ageDays = (sim.now - post.postedAt) / MS_DAY;
    const decayFactor = Math.pow(0.5, ageDays / platform.halfLifeDays);
    const dailyImpressions = Math.round(post.metrics.impressions * decayFactor * 0.09);
    if (dailyImpressions < 5) { post.decayDaysRemaining = 0; continue; }

    post.metrics.impressions += dailyImpressions;
    const extraViews = Math.round(dailyImpressions * 0.4);
    post.metrics.views += extraViews;
    account.totalViews += extraViews;
    post.metrics.likes += Math.round(extraViews * 0.03);

    if (account.monetisationEnabled) {
      post.revenue += Math.round((dailyImpressions / 1000) * account.effectiveCpm);
    }
    const trickle = Math.round(extraViews * 0.004);
    if (trickle > 0) {
      post.metrics.followersGained += trickle;
      applyFollowerChange(account, trickle, post.quality);
    }
    post.decayDaysRemaining -= 1;
  }

  // Accounts that go quiet lose momentum and people.
  for (const account of Object.values(sim.universe.socialAccounts)) {
    const daysSince = account.lastPostAt ? (sim.now - account.lastPostAt) / MS_DAY : 999;
    if (daysSince > 7) {
      account.momentum = clamp(account.momentum - 1.6, 0, 100);
      const churn = Math.round(account.segments.reduce((s, seg) => s + seg.size * seg.churnSensitivity * 0.0009, 0));
      if (churn > 0) applyFollowerChange(account, -churn, 50);
    }
    account.recentPostCount = Object.values(sim.universe.socialPosts).filter(
      (p) => p.accountId === account.id && p.status === 'published' && sim.now - p.postedAt < 30 * MS_DAY,
    ).length;
  }

  maybeOfferBrandDeal(sim);
}

function payCreatorEarnings(sim: Simulation, accountId: Id): void {
  const account = sim.universe.socialAccounts[accountId];
  if (!account || !account.monetisationEnabled) return;
  const owner = sim.universe.people[account.ownerId];
  const depositAccount = owner?.primaryAccountId;
  if (!depositAccount) return;

  const from = sim.now - 30 * MS_DAY;
  let earned = 0;
  for (const post of Object.values(sim.universe.socialPosts)) {
    if (post.accountId !== accountId || post.status !== 'published') continue;
    if (post.postedAt < from - 90 * MS_DAY) continue;
    earned += post.revenue;
    post.revenue = 0;
  }
  if (earned < 100) return;

  const platform = PLATFORM_BY_ID[account.platform];
  sim.income(depositAccount, earned, `${platform.name} creator earnings`, 'creator', { refType: 'social_account', refId: account.id });
  account.lifetimeEarnings += earned;
  sim.emit('social.earnings_paid', { accountId: account.id, amount: earned });
}

// ---------------------------------------------------------------------------
// Brand deals
// ---------------------------------------------------------------------------

const BRANDS = [
  { name: 'Northline Audio', category: 'electronics', budget: 1.0 },
  { name: 'Basewear', category: 'clothing', budget: 0.7 },
  { name: 'Meridian Timepieces', category: 'watch', budget: 2.6 },
  { name: 'Green Row Market', category: 'groceries', budget: 0.5 },
  { name: 'ClearGuard', category: 'automotive', budget: 0.9 },
  { name: 'Circuitline', category: 'electronics', budget: 1.4 },
  { name: 'Everline', category: 'retail', budget: 1.1 },
  { name: 'Form House', category: 'furniture', budget: 0.8 },
  { name: 'Aurelian', category: 'jewelry', budget: 3.4 },
  { name: 'Meridian Performance', category: 'fitness', budget: 0.6 },
];

function maybeOfferBrandDeal(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const accounts = Object.values(sim.universe.socialAccounts).filter((a) => a.ownerId === player.id);
  if (accounts.length === 0) return;

  const totalFollowers = accounts.reduce((s, a) => s + a.followers, 0);
  if (totalFollowers < 4000) return;

  const active = Object.values(sim.universe.brandDeals).filter((d) => d.personId === player.id && ['offered', 'active'].includes(d.status));
  if (active.length >= 3) return;

  const rng = sim.rng('brand_deal', player.id, Math.floor(sim.now / MS_DAY));
  const appeal = modifierFor(player, 'brandDealOdds');
  const bestAccount = accounts.reduce((best, a) => (a.momentum * a.followers > best.momentum * best.followers ? a : best), accounts[0] as SocialAccount);
  const probability = clamp(
    remap(Math.log10(totalFollowers + 1), 3.6, 6.5, 0.005, 0.12) * remap(bestAccount.momentum, 0, 100, 0.4, 1.8) * appeal
    * remap(player.reputation.controversy, 0, 100, 1, 0.35),
    0, 0.2,
  );
  if (!rng.chance(probability)) return;

  const brand = rng.pick(BRANDS);
  const platform = PLATFORM_BY_ID[bestAccount.platform];
  // Rate card: roughly cost-per-thousand engaged followers, by platform.
  const perThousand = platform.id === 'lumen' ? 2_800 : platform.id === 'streamtube' ? 3_600 : platform.id === 'pulse' ? 1_400 : 900;
  const compensation = Math.round((bestAccount.followers / 1000) * perThousand * brand.budget * rng.float(0.75, 1.35));
  if (compensation < 25_000) return;

  const format = rng.pick(platform.formats.filter((f) => f !== 'repost' && f !== 'story'));
  const count = rng.int(1, 3);

  const deal: BrandDeal = {
    id: sim.nextId('deal'),
    saveId: sim.universe.meta.id,
    personId: player.id,
    brandName: brand.name,
    platform: bestAccount.platform,
    compensation,
    performanceBonusCpm: rng.chance(0.4) ? Math.round(perThousand * 0.25) : undefined,
    deliverables: [{ format, count, delivered: 0 }],
    startsAt: sim.now,
    deadlineAt: addDays(sim.now, rng.int(21, 60), sim.homeZone),
    endsAt: addDays(sim.now, 180, sim.homeZone),
    exclusivityCategory: rng.chance(0.55) ? brand.category : undefined,
    usageRightsMonths: rng.pick([3, 6, 12]),
    requiresApproval: rng.chance(0.7),
    status: 'offered',
    paidAmount: 0,
    offeredAt: sim.now,
  };
  sim.universe.brandDeals[deal.id] = deal;

  sim.requireDecision({
    urgency: 58, category: 'career',
    title: `${brand.name} wants to work with you`,
    detail: `${formatMoney(compensation)} for ${count} ${format.replace(/_/g, ' ')}${count === 1 ? '' : 's'} on ${platform.name}, due within ${Math.round((deal.deadlineAt - sim.now) / MS_DAY)} days.${deal.exclusivityCategory ? ` Exclusive in ${deal.exclusivityCategory} for the term.` : ''}`,
    route: '/workspace/social',
    actions: [
      { label: 'Accept', commandKind: 'social.respond_to_deal', payload: { dealId: deal.id, accept: true } },
      { label: 'Decline', commandKind: 'social.respond_to_deal', payload: { dealId: deal.id, accept: false } },
    ],
    dueAt: addDays(sim.now, 7, sim.homeZone),
    refType: 'brand_deal', refId: deal.id,
  });
  sim.emit('social.deal_offered', { dealId: deal.id, brandName: brand.name, compensation });
}

function checkDealDeadline(sim: Simulation, dealId: Id): void {
  const deal = sim.universe.brandDeals[dealId];
  if (!deal || deal.status !== 'active') return;
  const outstanding = deal.deliverables.reduce((s, d) => s + Math.max(0, d.count - d.delivered), 0);
  const player = sim.universe.people[deal.personId];
  const accountId = player?.primaryAccountId;

  if (outstanding === 0) {
    deal.status = 'completed';
    const balance = deal.compensation - deal.paidAmount;
    if (accountId && balance > 0) {
      sim.income(accountId, balance, `${deal.brandName} — final payment`, 'sponsorship', { refType: 'deal', refId: deal.id });
      deal.paidAmount += balance;
    }
    // Performance bonus on what the content actually did.
    if (deal.performanceBonusCpm) {
      const impressions = Object.values(sim.universe.socialPosts)
        .filter((p) => p.brandDealId === deal.id)
        .reduce((s, p) => s + p.metrics.impressions, 0);
      const bonus = Math.round((impressions / 1000) * deal.performanceBonusCpm);
      if (accountId && bonus > 0) {
        sim.income(accountId, bonus, `${deal.brandName} — performance bonus`, 'sponsorship', { refType: 'deal', refId: deal.id });
        deal.paidAmount += bonus;
      }
    }
    sim.emit('social.deal_completed', { dealId: deal.id, paid: deal.paidAmount });
    return;
  }

  deal.status = 'breached';
  if (player) {
    player.reputation.reliability = clamp(player.reputation.reliability - 12, 0, 100);
    player.reputation.professionalReputation = clamp(player.reputation.professionalReputation - 6, 0, 100);
  }
  // The advance is clawed back.
  if (accountId && deal.paidAmount > 0) {
    sim.expense(accountId, deal.paidAmount, `${deal.brandName} — advance returned`, 'sponsorship', { refType: 'deal', refId: deal.id });
  }
  sim.notify({
    category: 'career', title: `You missed the ${deal.brandName} deadline`,
    body: `${outstanding} deliverable${outstanding === 1 ? '' : 's'} were never posted. The advance has been returned and it will be remembered.`,
    importance: 76, route: '/workspace/social',
  });
  sim.emit('social.deal_breached', { dealId: deal.id, outstanding });
}

/** Everything the player needs to see one account at a glance. */
export function accountSummary(sim: Simulation, accountId: Id) {
  const account = sim.universe.socialAccounts[accountId];
  if (!account) return undefined;
  const posts = Object.values(sim.universe.socialPosts)
    .filter((p) => p.accountId === accountId && p.status === 'published')
    .sort((a, b) => b.postedAt - a.postedAt);
  const last30 = posts.filter((p) => sim.now - p.postedAt < 30 * MS_DAY);
  return {
    account,
    platform: PLATFORM_BY_ID[account.platform],
    posts,
    postsLast30: last30.length,
    impressionsLast30: last30.reduce((s, p) => s + p.metrics.impressions, 0),
    followersGainedLast30: last30.reduce((s, p) => s + p.metrics.followersGained, 0),
    pendingRevenue: posts.reduce((s, p) => s + p.revenue, 0),
  };
}

/** Estimated value of one sponsored post, for the deal-evaluation UI. */
export function sponsorshipRate(account: SocialAccount): Money {
  const platform = PLATFORM_BY_ID[account.platform];
  const perThousand = platform.id === 'lumen' ? 2_800 : platform.id === 'streamtube' ? 3_600 : platform.id === 'pulse' ? 1_400 : 900;
  return Math.round((account.followers / 1000) * perThousand * remap(account.momentum, 0, 100, 0.6, 1.5));
}

export function totalFollowers(sim: Simulation, personId: Id): number {
  return Object.values(sim.universe.socialAccounts)
    .filter((a) => a.ownerId === personId)
    .reduce((s, a) => s + a.followers, 0);
}

void applyRate;
