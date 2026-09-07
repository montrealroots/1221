/**
 * SLATE — the rest of the video app, and the money in it.
 *
 * The feed and the watch page are in video.ts. This is everything around them:
 * the lists the app keeps for you, the subscription that takes the ads away,
 * the tips and the memberships and the streams, and the statement at the end
 * of the month that says where the money actually came from.
 *
 * The ad economics are modeled the way they work rather than as one number.
 * An advertiser pays a rate per thousand impressions; the platform keeps its
 * share; what is left is the creator's, and it is only earned on the share of
 * views that carried an ad at all. A viewer on the paid tier sees none of it,
 * and the money they pay is split across the channels they watched instead —
 * which is why a creator's statement has two ad lines and not one.
 *
 * Every figure here is SLATE's calibration. No platform's real revenue share,
 * rate card or payout is published in a form a game could copy, and none is
 * claimed to be.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  ChannelMembership, CommunityPost, CreatorPayout, Id, LiveStream, VideoChannel,
  VideoItem, VideoPlaylist,
} from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY, MS_MINUTE, addDays, instantFromZoned, zonedParts } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { VIDEO_PLATFORM, catalogOf, myChannel, videoById, videosOf } from './video';
import { PLATFORM_BY_ID } from './media';

// ---------------------------------------------------------------------------
// What the numbers are
// ---------------------------------------------------------------------------

/** What an advertiser pays for a thousand impressions, before anybody's cut. */
export const GROSS_CPM: Money = 1_100;
/** The platform's share of the advertising. The creator keeps the rest. */
export const PLATFORM_SHARE = 0.45;
/** The share of views that carry an ad at all. The rest are unsold or blocked. */
export const AD_FILL = 0.62;
/** What the paid tier costs a month. */
export const PREMIUM_MONTHLY: Money = 13_99;
/** The share of a paid subscriber's fee that reaches creators. */
export const PREMIUM_TO_CREATORS = 0.55;
/** What a channel keeps of a membership, after the platform's cut. */
export const MEMBERSHIP_SHARE = 0.70;
/** What a channel keeps of a tip. */
export const TIP_SHARE = 0.70;
/** What people usually put on a tip. */
export const TIP_STEPS: readonly Money[] = [2_00, 5_00, 10_00, 20_00, 50_00];

/** How long an ad break is, and how long before it can be skipped. */
export const AD_SECONDS = 22;
export const SKIP_AFTER_SECONDS = 5;

/** Membership tiers a channel can offer, and what each is called. */
export const MEMBER_TIERS: readonly { id: string; label: string; monthly: Money; perks: string }[] = [
  { id: 'supporter', label: 'Supporter', monthly: 2_99, perks: 'A badge by your name and the custom emoji.' },
  { id: 'regular', label: 'Regular', monthly: 6_99, perks: 'The badge, plus members only posts.' },
  { id: 'patron', label: 'Patron', monthly: 14_99, perks: 'Everything, plus early access and the members stream.' },
];

// ---------------------------------------------------------------------------
// Lists the app keeps
// ---------------------------------------------------------------------------

export function playlistsOf(sim: Simulation, personId: Id): VideoPlaylist[] {
  return Object.values(sim.universe.videoPlaylists)
    .filter((list) => list.ownerId === personId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function specialList(sim: Simulation, personId: Id, kind: 'watch_later' | 'liked'): VideoPlaylist | undefined {
  return playlistsOf(sim, personId).find((list) => list.kind === kind);
}

/**
 * The two lists the app makes for you rather than asking you to. Idempotent,
 * so opening a save twice does not give you two Watch Later.
 */
export function ensureLists(sim: Simulation, personId: Id): void {
  for (const [kind, title] of [['watch_later', 'Watch Later'], ['liked', 'Liked Videos']] as const) {
    if (specialList(sim, personId, kind)) continue;
    const list: VideoPlaylist = {
      id: sim.nextId('vlist'),
      saveId: sim.universe.meta.id,
      ownerId: personId,
      title,
      description: '',
      videoIds: [],
      visibility: 'private',
      kind,
      createdAt: sim.now,
      updatedAt: sim.now,
    };
    sim.universe.videoPlaylists[list.id] = list;
  }
}

// ---------------------------------------------------------------------------
// The paid tier
// ---------------------------------------------------------------------------

/** Is the player paying for the ad free tier? */
export function hasPremium(sim: Simulation): boolean {
  return Object.values(sim.universe.channelMemberships).some(
    (m) => m.personId === sim.player.id && m.tier === 'premium' && !m.endedAt,
  );
}

/**
 * Whether this view carries an ad, and how long it costs you.
 *
 * Not every view does. Some inventory goes unsold, and a paying viewer never
 * sees one, which is the whole proposition of the paid tier.
 */
export function adBefore(sim: Simulation, video: VideoItem): { seconds: number; skippable: boolean } | undefined {
  if (hasPremium(sim)) return undefined;
  const rng = sim.rng('video.ad', video.id, Math.floor(sim.now / MS_DAY));
  if (!rng.chance(AD_FILL)) return undefined;
  // A short video gets one skippable pre-roll; a long one can get an unskippable.
  const skippable = video.lengthMinutes < 20 || rng.chance(0.72);
  return { seconds: AD_SECONDS, skippable };
}

// ---------------------------------------------------------------------------
// Memberships and tips
// ---------------------------------------------------------------------------

export function membershipsOf(sim: Simulation, personId: Id): ChannelMembership[] {
  return Object.values(sim.universe.channelMemberships)
    .filter((m) => m.personId === personId && !m.endedAt && m.tier !== 'premium');
}

/** Who is paying to support a channel. The paid tier is not a membership. */
export function membersOf(sim: Simulation, channelId: Id): ChannelMembership[] {
  return Object.values(sim.universe.channelMemberships)
    .filter((m) => m.channelId === channelId && m.tier !== 'premium' && !m.endedAt);
}

// ---------------------------------------------------------------------------
// The statement
// ---------------------------------------------------------------------------

/** The first instant of the month a moment falls in. */
function monthStart(sim: Simulation, at: number): number {
  const parts = zonedParts(at, sim.homeZone);
  return instantFromZoned({ year: parts.year, month: parts.month, day: 1, hour: 0 }, sim.homeZone);
}

export function payoutsOf(sim: Simulation, accountId: Id): CreatorPayout[] {
  return Object.values(sim.universe.creatorPayouts)
    .filter((p) => p.accountId === accountId)
    .sort((a, b) => b.month - a.month);
}

/**
 * What the month paid, and where it came from.
 *
 * Ads are earned on the share of views that carried one, at what is left of the
 * advertiser's rate after the platform's cut. Paid-tier watch time pays
 * separately and at a different rate, which is why a channel with a studious
 * audience earns more per view than its ad rate suggests. Memberships and tips
 * are what the audience chose to pay directly, less the platform's share.
 */
export function buildPayout(sim: Simulation, accountId: Id, month: number): CreatorPayout {
  const account = sim.universe.socialAccounts[accountId];
  const channel = Object.values(sim.universe.videoChannels).find((c) => c.accountId === accountId);
  const from = month;
  const to = addDays(month, 31, sim.homeZone);

  let views = 0;
  let premiumViews = 0;
  for (const video of channel ? videosOf(sim, channel.id) : []) {
    if (video.publishedAt < from - 90 * MS_DAY || video.publishedAt > to) continue;
    // A month's views on a video, spread on the same decaying curve the
    // analytics use rather than counted twice.
    const ageDays = Math.max(0, (to - video.publishedAt) / MS_DAY);
    const share = clamp(Math.exp(-ageDays / 24), 0.02, 1);
    const monthViews = Math.round(video.views * share);
    views += monthViews;
    premiumViews += Math.round(monthViews * 0.11);
  }

  const monetized = Math.round(Math.max(0, views - premiumViews) * AD_FILL);
  const ads = account?.monetisationEnabled
    ? Math.round((monetized / 1000) * GROSS_CPM * (1 - PLATFORM_SHARE))
    : 0;
  const premium = account?.monetisationEnabled
    ? Math.round((premiumViews / 1000) * PREMIUM_MONTHLY * PREMIUM_TO_CREATORS * 0.9)
    : 0;

  const members = channel ? membersOf(sim, channel.id) : [];
  const memberships = Math.round(members.reduce((sum, m) => sum + m.monthly, 0) * MEMBERSHIP_SHARE);

  let tips = 0;
  for (const stream of Object.values(sim.universe.liveStreams)) {
    if (!channel || stream.channelId !== channel.id) continue;
    if (stream.startedAt < from || stream.startedAt > to) continue;
    tips += Math.round(stream.superChatTotal * TIP_SHARE);
  }

  let sponsorship = 0;
  for (const deal of Object.values(sim.universe.brandDeals)) {
    if (deal.personId !== sim.player.id) continue;
    if (deal.status !== 'completed' && deal.status !== 'delivered') continue;
    if (deal.endsAt < from || deal.endsAt > to) continue;
    sponsorship += deal.compensation;
  }

  return {
    id: sim.nextId('payout'),
    saveId: sim.universe.meta.id,
    accountId,
    month,
    ads, premium, memberships, tips, sponsorship,
    total: ads + premium + memberships + tips + sponsorship,
    monetizedViews: monetized,
  };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerCreator(sim: Simulation): void {
  // --- Lists ----------------------------------------------------------------

  sim.onCommand<{ title: string; description?: string; visibility?: VideoPlaylist['visibility'] }, { playlistId: Id }>(
    'video.create_playlist',
    (p, { sim: s }) => {
      const title = p.title.trim();
      if (title.length < 2) throw new CommandError('Give the playlist a name.');
      if (playlistsOf(s, s.player.id).some((l) => l.title.toLowerCase() === title.toLowerCase())) {
        throw new CommandError('You already have a playlist called that.');
      }
      const list: VideoPlaylist = {
        id: s.nextId('vlist'),
        saveId: s.universe.meta.id,
        ownerId: s.player.id,
        title,
        description: p.description ?? '',
        videoIds: [],
        visibility: p.visibility ?? 'private',
        kind: 'playlist',
        createdAt: s.now,
        updatedAt: s.now,
      };
      s.universe.videoPlaylists[list.id] = list;
      s.emit('video.playlist_created', { playlistId: list.id, title });
      return { playlistId: list.id };
    },
  );

  sim.onCommand<{ playlistId?: Id; kind?: 'watch_later' | 'liked'; videoId: Id }, { count: number }>(
    'video.save_to_playlist',
    (p, { sim: s }) => {
      ensureLists(s, s.player.id);
      const list = p.playlistId
        ? s.universe.videoPlaylists[p.playlistId]
        : p.kind ? specialList(s, s.player.id, p.kind) : undefined;
      if (!list || list.ownerId !== s.player.id) throw new CommandError('No such playlist.');
      if (!videoById(s, p.videoId)) throw new CommandError('No such video.');
      if (list.videoIds.includes(p.videoId)) throw new CommandError(`That is already in ${list.title}.`);
      list.videoIds.push(p.videoId);
      list.updatedAt = s.now;
      s.emit('video.saved', { playlistId: list.id, videoId: p.videoId });
      return { count: list.videoIds.length };
    },
  );

  sim.onCommand<{ playlistId: Id; videoId: Id }, { count: number }>(
    'video.remove_from_playlist',
    (p, { sim: s }) => {
      const list = s.universe.videoPlaylists[p.playlistId];
      if (!list || list.ownerId !== s.player.id) throw new CommandError('No such playlist.');
      const before = list.videoIds.length;
      list.videoIds = list.videoIds.filter((id) => id !== p.videoId);
      if (list.videoIds.length === before) throw new CommandError('That is not in this playlist.');
      list.updatedAt = s.now;
      return { count: list.videoIds.length };
    },
  );

  sim.onCommand<{ playlistId: Id }, { title: string }>(
    'video.delete_playlist',
    (p, { sim: s }) => {
      const list = s.universe.videoPlaylists[p.playlistId];
      if (!list || list.ownerId !== s.player.id) throw new CommandError('No such playlist.');
      if (list.kind !== 'playlist') throw new CommandError(`${list.title} is one the app keeps. It cannot be deleted.`);
      delete s.universe.videoPlaylists[list.id];
      return { title: list.title };
    },
  );

  // --- The paid tier --------------------------------------------------------

  sim.onCommand<Record<string, never>, { monthly: Money }>(
    'video.join_premium',
    (_p, { sim: s }) => {
      if (hasPremium(s)) throw new CommandError('You are already on it.');
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < PREMIUM_MONTHLY) {
        throw new CommandError(`It is ${formatMoney(PREMIUM_MONTHLY)} a month and you cannot cover it.`);
      }
      // Premium belongs to nobody's channel. Hanging it on the player's own
      // made their subscription show up as revenue on their own statement.
      const membership: ChannelMembership = {
        id: s.nextId('member'),
        saveId: s.universe.meta.id,
        channelId: '' as Id,
        personId: s.player.id,
        tier: 'premium',
        monthly: PREMIUM_MONTHLY,
        since: s.now,
      };
      s.universe.channelMemberships[membership.id] = membership;
      s.expense(accountId, PREMIUM_MONTHLY, 'YouTube Premium', 'personal');
      s.schedule({
        at: addDays(s.now, 30, s.homeZone), kind: 'video.premium_renew',
        label: 'Premium Renews', category: 'personal', priority: 64,
        payload: { membershipId: membership.id },
      });
      s.emit('video.premium_joined', { monthly: PREMIUM_MONTHLY });
      return { monthly: PREMIUM_MONTHLY };
    },
  );

  sim.onCommand<Record<string, never>, { ended: boolean }>(
    'video.leave_premium',
    (_p, { sim: s }) => {
      const membership = Object.values(s.universe.channelMemberships)
        .find((m) => m.personId === s.player.id && m.tier === 'premium' && !m.endedAt);
      if (!membership) throw new CommandError('You are not on it.');
      membership.endedAt = s.now;
      s.emit('video.premium_left', {});
      return { ended: true };
    },
  );

  sim.onSchedule('video.premium_renew', (item) => {
    const membership = sim.universe.channelMemberships[item.payload.membershipId as Id];
    if (!membership || membership.endedAt) return;
    const accountId = sim.player.primaryAccountId;
    if (!accountId || sim.ledger.availableFunds(accountId) < membership.monthly) {
      membership.endedAt = sim.now;
      sim.notify({
        category: 'personal', title: 'Premium Lapsed',
        body: 'The renewal did not go through, so the ads are back.',
        importance: 40, route: '/workspace/phone',
      });
      return;
    }
    sim.expense(accountId, membership.monthly, 'YouTube Premium', 'personal');
    sim.schedule({
      at: addDays(sim.now, 30, sim.homeZone), kind: 'video.premium_renew',
      label: 'Premium Renews', category: 'personal', priority: 64,
      payload: { membershipId: membership.id },
    });
  });

  // --- Supporting a channel -------------------------------------------------

  sim.onCommand<{ channelId: Id; tier?: string }, { monthly: Money; tier: string }>(
    'video.join_channel',
    (p, { sim: s }) => {
      const channel = s.universe.videoChannels[p.channelId];
      if (!channel) throw new CommandError('No such channel.');
      if (channel.ownerId === s.player.id) throw new CommandError('You cannot join your own channel.');
      if (channel.membershipMonthly === undefined) throw new CommandError(`${channel.name} does not offer memberships.`);
      const already = membershipsOf(s, s.player.id).find((m) => m.channelId === channel.id);
      if (already) throw new CommandError(`You are already a member of ${channel.name}.`);
      const tier = MEMBER_TIERS.find((t) => t.id === (p.tier ?? 'supporter'));
      if (!tier) throw new CommandError('That is not one of the tiers.');
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < tier.monthly) {
        throw new CommandError(`${tier.label} is ${formatMoney(tier.monthly)} a month and you cannot cover it.`);
      }
      const membership: ChannelMembership = {
        id: s.nextId('member'),
        saveId: s.universe.meta.id,
        channelId: channel.id,
        personId: s.player.id,
        tier: tier.id,
        monthly: tier.monthly,
        since: s.now,
      };
      s.universe.channelMemberships[membership.id] = membership;
      channel.members = (channel.members ?? 0) + 1;
      s.expense(accountId, tier.monthly, `${channel.name} Membership`, 'personal');
      s.emit('video.joined_channel', { channelId: channel.id, tier: tier.id });
      return { monthly: tier.monthly, tier: tier.id };
    },
  );

  sim.onCommand<{ channelId: Id }, { ended: boolean }>(
    'video.leave_channel',
    (p, { sim: s }) => {
      const membership = membershipsOf(s, s.player.id).find((m) => m.channelId === p.channelId);
      if (!membership) throw new CommandError('You are not a member of that channel.');
      membership.endedAt = s.now;
      const channel = s.universe.videoChannels[p.channelId];
      if (channel) channel.members = Math.max(0, (channel.members ?? 1) - 1);
      return { ended: true };
    },
  );

  sim.onCommand<{ videoId: Id; amount: Money; message?: string }, { amount: Money }>(
    'video.tip',
    (p, { sim: s }) => {
      const video = videoById(s, p.videoId);
      if (!video) throw new CommandError('No such video.');
      const channel = s.universe.videoChannels[video.channelId];
      if (channel?.ownerId === s.player.id) throw new CommandError('You cannot tip yourself.');
      const amount = Math.round(p.amount);
      if (!TIP_STEPS.includes(amount)) throw new CommandError('That is not one of the amounts.');
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < amount) throw new CommandError('You cannot cover that.');
      s.expense(accountId, amount, `Tip — ${channel?.name ?? 'A Channel'}`, 'personal');
      s.emit('video.tipped', { videoId: video.id, amount });
      return { amount };
    },
  );

  // --- Going live -----------------------------------------------------------

  sim.onCommand<{ title: string; minutes?: number }, { streamId: Id; peak: number; tips: Money }>(
    'video.go_live',
    (p, { sim: s }) => {
      const channel = myChannel(s);
      if (!channel) throw new CommandError('You have no channel yet.');
      if (channel.liveStreamId) throw new CommandError('You are already live.');
      const title = p.title.trim();
      if (title.length < 3) throw new CommandError('Give the stream a title.');
      const minutes = clamp(Math.round(p.minutes ?? 90), 10, 480);

      const rng = s.rng('video.live', channel.id, s.counter('video.live'));
      // A stream reaches a slice of the subscribers who happen to be about.
      const base = Math.max(1, Math.round(channel.subscribers * rng.float(0.001, 0.02)));
      const peak = Math.round(base * rng.float(1.1, 2.2));
      const average = Math.round(base * rng.float(0.5, 0.95));
      const chat = Math.round(average * minutes * rng.float(0.02, 0.14));
      // People who paid to have a message read out.
      const tippers = Math.round(average * rng.float(0.002, 0.02));
      const superChatTotal = tippers * TIP_STEPS[rng.int(0, TIP_STEPS.length - 1)]!;

      const stream: LiveStream = {
        id: s.nextId('stream'),
        saveId: s.universe.meta.id,
        channelId: channel.id,
        title,
        startedAt: s.now,
        minutes,
        peakViewers: peak,
        averageViewers: average,
        chatMessages: chat,
        superChatTotal,
        status: 'ended',
        endedAt: s.now + minutes * MS_MINUTE,
      };
      s.universe.liveStreams[stream.id] = stream;

      s.advanceTo(s.now + minutes * MS_MINUTE);
      const person = s.player;
      person.wellbeing.energy = clamp(person.wellbeing.energy - minutes / 26, 0, 100);
      person.wellbeing.morale = clamp(person.wellbeing.morale + (superChatTotal > 0 ? 5 : 2), 0, 100);
      // A stream brings people in, more when more of them turned up.
      channel.subscribers += Math.round(average * rng.float(0.01, 0.06));

      s.emit('video.streamed', { streamId: stream.id, peak, tips: superChatTotal });
      return { streamId: stream.id, peak, tips: superChatTotal };
    },
  );

  // --- The community tab ----------------------------------------------------

  sim.onCommand<{ text: string; options?: string[] }, { postId: Id }>(
    'video.community_post',
    (p, { sim: s }) => {
      const channel = myChannel(s);
      if (!channel) throw new CommandError('You have no channel yet.');
      const text = p.text.trim();
      if (text.length < 3) throw new CommandError('Write something first.');
      const options = p.options?.map((o) => o.trim()).filter(Boolean) ?? [];
      if (options.length === 1) throw new CommandError('A poll needs at least two options.');

      const rng = s.rng('video.community', channel.id, s.counter('video.community'));
      const reach = Math.max(4, Math.round(channel.subscribers * rng.float(0.01, 0.09)));
      const post: CommunityPost = {
        id: s.nextId('cpost'),
        saveId: s.universe.meta.id,
        channelId: channel.id,
        kind: options.length >= 2 ? 'poll' : 'text',
        text,
        at: s.now,
        likes: Math.round(reach * rng.float(0.02, 0.11)),
        commentCount: Math.round(reach * rng.float(0.002, 0.02)),
        options: options.length >= 2
          ? options.map((label) => ({ label, votes: Math.round(reach * rng.float(0.05, 0.4)) }))
          : undefined,
      };
      s.universe.communityPosts[post.id] = post;
      s.advanceTo(s.now + 6 * MS_MINUTE);
      s.emit('video.community_posted', { postId: post.id, kind: post.kind });
      return { postId: post.id };
    },
  );

  sim.onCommand<{ postId: Id; option: number }, { votes: number }>(
    'video.vote_poll',
    (p, { sim: s }) => {
      const post = s.universe.communityPosts[p.postId];
      if (!post || post.kind !== 'poll' || !post.options) throw new CommandError('That is not a poll.');
      if (post.votedFor !== undefined) throw new CommandError('You have already voted.');
      const option = post.options[p.option];
      if (!option) throw new CommandError('That is not one of the options.');
      option.votes += 1;
      post.votedFor = p.option;
      return { votes: option.votes };
    },
  );

  // --- The statement --------------------------------------------------------

  sim.onSchedule('video.payout_month', () => {
    const channel = myChannel(sim);
    const accountId = channel?.accountId;
    if (accountId) {
      const month = monthStart(sim, sim.now - 15 * MS_DAY);
      const already = payoutsOf(sim, accountId).some((p) => p.month === month);
      if (!already) {
        const payout = buildPayout(sim, accountId, month);
        sim.universe.creatorPayouts[payout.id] = payout;
        // The ad and paid-tier money is paid here; sponsorship was paid on its
        // own terms and memberships and tips arrive with them, so only the
        // platform's own share is settled now.
        const platformMoney = payout.ads + payout.premium + payout.memberships + payout.tips;
        const bank = sim.player.primaryAccountId;
        if (bank && platformMoney > 0) {
          sim.income(bank, platformMoney, `${PLATFORM_BY_ID[VIDEO_PLATFORM].name} — ${new Date(month).getUTCFullYear()}`, 'creator');
          payout.paidAt = sim.now;
          sim.notify({
            category: 'social',
            title: 'The Month Was Paid',
            body: `${formatMoney(platformMoney)} from ${payout.monetizedViews.toLocaleString('en-US')} monetized views, memberships and tips.`,
            importance: 55, route: '/workspace/phone',
          });
        }
      }
    }
    sim.schedule({
      at: addDays(sim.now, 30, sim.homeZone), kind: 'video.payout_month',
      label: 'Creator Payout', category: 'system', priority: 86,
    });
  });
}

/**
 * The lists exist, the statement clock is running, and the channels that would
 * sell memberships do. Idempotent, and it creates nothing twice.
 */
export function ensureCreator(sim: Simulation): void {
  ensureLists(sim, sim.player.id);
  // A channel of any size sells memberships; a small one has not bothered.
  for (const channel of Object.values(sim.universe.videoChannels)) {
    if (channel.ownerId || channel.membershipMonthly !== undefined) continue;
    if (channel.subscribers < 100_000) continue;
    const rng = sim.rng('video.members', channel.sourceId ?? channel.id);
    if (!rng.chance(0.55)) continue;
    channel.membershipMonthly = rng.pick([...MEMBER_TIERS]).monthly;
    channel.members = Math.round(channel.subscribers * rng.float(0.0004, 0.006));
  }
  if (sim.timeline.pending().some((i) => i.kind === 'video.payout_month')) return;
  sim.schedule({
    at: addDays(sim.now, 30, sim.homeZone), kind: 'video.payout_month',
    label: 'Creator Payout', category: 'system', priority: 86,
  });
}

/** Everything a channel put out that is not a video: the community tab. */
export function communityOf(sim: Simulation, channelId: Id): CommunityPost[] {
  return Object.values(sim.universe.communityPosts)
    .filter((post) => post.channelId === channelId)
    .sort((a, b) => b.at - a.at);
}

/** Every stream a channel has done, newest first. */
export function streamsOf(sim: Simulation, channelId: Id): LiveStream[] {
  return Object.values(sim.universe.liveStreams)
    .filter((stream) => stream.channelId === channelId)
    .sort((a, b) => b.startedAt - a.startedAt);
}

/** The videos in a list, in the order they were put there. */
export function videosIn(sim: Simulation, list: VideoPlaylist): VideoItem[] {
  return list.videoIds.map((id) => videoById(sim, id)).filter((v): v is VideoItem => v !== undefined);
}

/** A channel's page: what its tabs would show. */
export function channelPage(sim: Simulation, channel: VideoChannel): {
  videos: VideoItem[]; shorts: VideoItem[]; community: CommunityPost[]; streams: LiveStream[];
} {
  const all = catalogOf(sim, channel);
  return {
    videos: all.filter((v) => v.lengthMinutes > 12),
    shorts: all.filter((v) => v.lengthMinutes <= 12),
    community: communityOf(sim, channel.id),
    streams: streamsOf(sim, channel.id),
  };
}
