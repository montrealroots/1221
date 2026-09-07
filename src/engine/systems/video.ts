/**
 * SLATE — the video app.
 *
 * The contract asked for the app, not a panel of numbers: "a feed that is
 * generated from channels you actually subscribe to; channels with names,
 * subscriber counts, upload histories and comment sections; your own channel —
 * upload, thumbnail, title, description, tags, schedule; analytics that behave
 * like analytics; comments you can read and reply to, and the ones you should
 * not read; watching something is an activity that costs time and does
 * something to you."
 *
 * So this is a world with two hundred and forty channels in it, each with a
 * back catalog it had before you arrived and a rhythm it keeps uploading on
 * while you are away. The feed is built from what you subscribe to, what you
 * have watched, and what is new, in that order, the way a feed actually is. An
 * hour of cooking leaves you calmer than an hour of news, because it does.
 *
 * Your own channel sits in the same world as everybody else's. An upload is a
 * title, a description, tags, a thumbnail and a time; the thumbnail changes how
 * many people click and the video decides whether they stay. The money side
 * stays where it was, in media.ts, so a video you post is also a post that
 * earns: this system owns the app, that one owns the business.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  Id, PlatformId, VideoChannel, VideoComment, VideoItem, VideoSubscription, WatchRecord,
} from '../domain/model';
import { clamp } from '../core/rng';
import type { Rng } from '../core/rng';
import { MS_DAY, MS_MINUTE, addDays } from '../core/time';
import { BEATS, REAL_CHANNELS, RUNTIMES, TOPIC_EFFECT, TOPIC_LABEL, type Topic } from '../content/channels';
import {
  COMMENT_LINES, THUMBNAILS, THUMBNAIL_BY_ID, makeDescription, makeHandle, makeTitle,
  type CommentBand,
} from '../content/videos';

/** The app is one platform's. The others have their own shapes and come later. */
export const VIDEO_PLATFORM: PlatformId = 'streamtube';

/** How far back a channel's catalog goes before it is just a memory. */
const CATALOG_WINDOW = 40;
/** Videos on the home feed at once. */
export const FEED_SIZE = 24;
/** How many comments a video carries. */
const COMMENTS_PER_VIDEO = 8;
/** Minutes of watching past which the app says something about your evening. */
export const BINGE_MINUTES = 180;

// ---------------------------------------------------------------------------
// Reading the world
// ---------------------------------------------------------------------------

export function channelsOf(sim: Simulation): VideoChannel[] {
  return Object.values(sim.universe.videoChannels);
}

export function videosOf(sim: Simulation, channelId: Id): VideoItem[] {
  const channel = sim.universe.videoChannels[channelId];
  return channel ? catalogOf(sim, channel) : [];
}

/** The player's own channel, if they have made one. */
export function myChannel(sim: Simulation): VideoChannel | undefined {
  return channelsOf(sim).find((c) => c.ownerId === sim.player.id);
}

export function subscriptionsOf(sim: Simulation, personId: Id): VideoSubscription[] {
  return Object.values(sim.universe.videoSubscriptions).filter((s) => s.personId === personId);
}

export function isSubscribed(sim: Simulation, personId: Id, channelId: Id): boolean {
  return subscriptionsOf(sim, personId).some((s) => s.channelId === channelId);
}

export function watchedIds(sim: Simulation, personId: Id): Set<Id> {
  const seen = new Set<Id>();
  for (const record of Object.values(sim.universe.watchHistory)) {
    if (record.personId === personId) seen.add(record.videoId);
  }
  return seen;
}

/** Minutes watched in the last day, which is how an evening disappears. */
export function minutesWatchedSince(sim: Simulation, personId: Id, since: number): number {
  let total = 0;
  for (const record of Object.values(sim.universe.watchHistory)) {
    if (record.personId === personId && record.at >= since) total += record.minutes;
  }
  return total;
}

/**
 * The comment section under a video.
 *
 * Under somebody else's video it is derived, the same way their catalog is: a
 * room full of strangers is not worth writing into a save file. Under your own
 * it is stored, because there the comments matter — whether you have read the
 * unkind ones, and what you replied. Either way anything you said yourself is
 * stored and merged in.
 */
export function commentsOn(sim: Simulation, videoId: Id): VideoComment[] {
  const stored = Object.values(sim.universe.videoComments).filter((c) => c.videoId === videoId);
  const video = videoById(sim, videoId);
  const owned = video ? sim.universe.videoChannels[video.channelId]?.ownerId === sim.player.id : false;
  const hasWorldComments = stored.some((c) => !c.byPlayer);
  const derived = video && !owned && !hasWorldComments ? deriveComments(sim, video) : [];
  return [...derived, ...stored].sort((a, b) => b.likes - a.likes || a.at - b.at);
}

// ---------------------------------------------------------------------------
// Building the world, without storing it
// ---------------------------------------------------------------------------

/**
 * The world's back catalog is derived rather than saved.
 *
 * Two hundred and forty channels with four years of uploads behind them is
 * fourteen thousand rows, and putting those in every save file made one seven
 * megabytes of videos nobody would ever open. So a channel stores its seed, how
 * many videos it has put out, and when the last one landed; the catalog itself
 * is computed from those, identically every time, and thrown away again. What
 * the player touches — their own uploads, their comments, what they watched —
 * is stored, because that is the part that is theirs.
 */
const CATALOG_CACHE = new Map<string, VideoItem[]>();

/**
 * How many people watched it. Measured against the channel's latest upload
 * rather than against the clock, so a catalog only changes when the channel
 * puts something new out — which is what lets it be derived at all.
 */
function viewsFor(subscribers: number, quality: number, thumbnailBias: number, age: number, rng: Rng): number {
  // Most videos reach a fraction of the subscriber base. A few do not stop.
  const base = subscribers * rng.float(0.03, 0.22) * (0.55 + quality / 140) * thumbnailBias;
  const breakout = rng.chance(0.045) ? rng.float(4, 26) : 1;
  // Old videos have had time to accumulate; new ones have not.
  const maturity = clamp(0.35 + age / (120 * MS_DAY), 0.35, 1);
  return Math.max(12, Math.round(base * breakout * maturity));
}

/**
 * How long a video runs. The subject sets the range and the channel's rhythm
 * narrows it, because a channel that posts every morning posts twelve minutes
 * and a channel that posts every three weeks posts forty.
 */
function lengthFor(topic: Topic, cadenceDays: number, rng: Rng, sourceId?: string): number {
  const fixed = sourceId ? RUNTIMES[sourceId] : undefined;
  if (fixed) return rng.int(fixed[0], fixed[1]);
  const long: Topic[] = ['film', 'history', 'talk', 'science', 'news'];
  const short: Topic[] = ['comedy', 'fashion', 'fitness', 'money'];
  const [low, high] = long.includes(topic) ? [14, 96] : short.includes(topic) ? [4, 24] : [8, 42];
  // A daily channel sits at the bottom of its range; a monthly one at the top.
  const pace = clamp((cadenceDays - 1) / 20, 0, 1);
  const centre = low + (high - low) * (0.18 + pace * 0.72);
  const spread = (high - low) * 0.18;
  return Math.round(clamp(rng.float(centre - spread, centre + spread), low, high));
}

/** What this channel is actually about, where it is about one thing. */
function beatOf(channel: VideoChannel): readonly string[] | undefined {
  return channel.sourceId ? BEATS[channel.sourceId] : undefined;
}

/** The id of the nth video a channel put out. Stable, and readable in a log. */
export function derivedVideoId(channel: VideoChannel, index: number): Id {
  return `${channel.id}:${index}`;
}

/**
 * One video of a channel's catalog. The salt is only ever raised when the
 * title it produced was one the channel had already used, so the newest video
 * is always salt zero and can be derived on its own without the rest.
 */
function deriveVideo(
  sim: Simulation, channel: VideoChannel, index: number, publishedAt: number, salt = 0,
): VideoItem {
  const topic = channel.topic as Topic;
  const rng = sim.rng('video.derive', channel.sourceId ?? channel.id, index, salt);
  const thumbnail = rng.weighted([...THUMBNAILS], (t) => t.clickBias);
  const quality = clamp(channel.craft + rng.int(-18, 12), 5, 100);
  const since = (channel.lastUploadAt ?? channel.createdAt) - publishedAt;
  const views = viewsFor(channel.subscribers, quality, thumbnail.clickBias, since, rng);
  return {
    id: derivedVideoId(channel, index),
    saveId: sim.universe.meta.id,
    channelId: channel.id,
    title: makeTitle(topic, beatOf(channel), rng),
    description: makeDescription(rng, channel.about),
    tags: [TOPIC_LABEL[topic], channel.name],
    publishedAt,
    lengthMinutes: lengthFor(topic, channel.cadenceDays, rng, channel.sourceId),
    topic,
    views,
    likes: Math.round(views * rng.float(0.02, 0.09) * (quality / 80)),
    dislikes: Math.round(views * rng.float(0.0006, 0.006)),
    commentCount: Math.round(views * rng.float(0.001, 0.008)),
    thumbnail: thumbnail.id,
    quality,
    retention: clamp(rng.float(0.24, 0.42) + quality / 320, 0.15, 0.95),
    status: 'published',
  };
}

/**
 * A channel's recent catalog, newest first. The window is what a person would
 * ever scroll; older than that a channel is a subscriber count and a memory.
 */
export function catalogOf(sim: Simulation, channel: VideoChannel): VideoItem[] {
  if (channel.ownerId) {
    return Object.values(sim.universe.videos)
      .filter((v) => v.channelId === channel.id && v.status === 'published' && v.publishedAt <= sim.now)
      .sort((a, b) => b.publishedAt - a.publishedAt);
  }
  const key = `${channel.id}|${channel.uploads}|${channel.lastUploadAt ?? 0}|${channel.subscribers}`;
  const cached = CATALOG_CACHE.get(key);
  if (cached) return cached;

  const catalog: VideoItem[] = [];
  const titles = new Set<string>();
  const last = channel.lastUploadAt ?? channel.createdAt;
  let at = last;
  for (let back = 0; back < CATALOG_WINDOW; back += 1) {
    const index = channel.uploads - 1 - back;
    if (index < 0 || at < channel.createdAt) break;
    // Nobody uploads the same title twice. If the generator lands on one this
    // channel has already used, it rolls again rather than shipping a repeat.
    let video = deriveVideo(sim, channel, index, at);
    for (let salt = 1; titles.has(video.title) && salt < 160; salt += 1) {
      video = deriveVideo(sim, channel, index, at, salt);
    }
    titles.add(video.title);
    catalog.push(video);
    const gap = sim.rng('video.gap', channel.sourceId ?? channel.id, index);
    at -= Math.max(1, Math.round(channel.cadenceDays * gap.float(0.7, 1.4))) * MS_DAY;
  }
  // One save's worth of catalogs is small; a very long session is not a leak.
  if (CATALOG_CACHE.size > 4_000) CATALOG_CACHE.clear();
  CATALOG_CACHE.set(key, catalog);
  return catalog;
}

/** The newest thing a channel put out, without deriving the rest of it. */
export function newestOf(sim: Simulation, channel: VideoChannel): VideoItem | undefined {
  if (channel.uploads < 1) return undefined;
  if (channel.ownerId) return catalogOf(sim, channel)[0];
  return deriveVideo(sim, channel, channel.uploads - 1, channel.lastUploadAt ?? channel.createdAt);
}

/**
 * Every video the app could show right now, the world's and the player's. The
 * feed only ever reaches a little way down each channel, so it does not derive
 * four years of everybody to show you twenty four cards.
 */
export function allVideos(sim: Simulation, perChannel = 8): VideoItem[] {
  const out: VideoItem[] = [];
  for (const channel of channelsOf(sim)) {
    let taken = 0;
    for (const video of catalogOf(sim, channel)) {
      if (video.publishedAt > sim.now || video.status !== 'published') continue;
      out.push(video);
      taken += 1;
      if (taken >= perChannel) break;
    }
  }
  return out;
}

/** One video by id, whether it is stored or derived. */
export function videoById(sim: Simulation, videoId: Id): VideoItem | undefined {
  const stored = sim.universe.videos[videoId];
  if (stored) return stored;
  const [channelId, indexText] = videoId.split(':');
  if (!channelId || indexText === undefined) return undefined;
  const channel = sim.universe.videoChannels[channelId];
  if (!channel) return undefined;
  return catalogOf(sim, channel).find((v) => v.id === videoId);
}

/**
 * The channels of the world. Idempotent: a save that already has them is left
 * alone, so opening it twice does not double the internet.
 */
export function ensureChannels(sim: Simulation): void {
  if (Object.keys(sim.universe.videoChannels).length > 0) return;
  for (const seed of REAL_CHANNELS) {
    const rng = sim.rng('video.channel', seed.id);
    const createdAt = sim.now - rng.int(400, 2600) * MS_DAY;
    const lastUploadAt = sim.now - rng.int(0, seed.cadenceDays) * MS_DAY;
    const channel: VideoChannel = {
      id: sim.nextId('chan'),
      saveId: sim.universe.meta.id,
      platform: VIDEO_PLATFORM,
      sourceId: seed.id,
      name: seed.name,
      handle: seed.handle,
      topic: seed.topic,
      about: seed.about,
      subscribers: seed.subscribers,
      verified: seed.subscribers >= 100_000,
      createdAt,
      cadenceDays: seed.cadenceDays,
      craft: seed.craft,
      tone: seed.tone,
      lastUploadAt,
      totalViews: 0,
      // What it has put out since it started, which is what its catalog is
      // counted back from.
      uploads: Math.max(1, Math.round((lastUploadAt - createdAt) / (seed.cadenceDays * MS_DAY))),
    };
    sim.universe.videoChannels[channel.id] = channel;
    channel.totalViews = catalogOf(sim, channel).reduce((sum, v) => sum + v.views, 0);
  }
}

// ---------------------------------------------------------------------------
// The feed
// ---------------------------------------------------------------------------

/** What the player has shown they like, read off what they have watched. */
export function tasteOf(sim: Simulation, personId: Id): Map<string, number> {
  const taste = new Map<string, number>();
  for (const record of Object.values(sim.universe.watchHistory)) {
    if (record.personId !== personId) continue;
    const video = videoById(sim, record.videoId);
    if (!video) continue;
    const weight = record.finished ? 2 : 1;
    taste.set(video.topic, (taste.get(video.topic) ?? 0) + weight);
  }
  return taste;
}

function feedScore(
  sim: Simulation, video: VideoItem, subscribed: Set<Id>, taste: Map<string, number>, seen: Set<Id>,
): number {
  if (seen.has(video.id)) return -1;
  const ageDays = (sim.now - video.publishedAt) / MS_DAY;
  if (ageDays < 0) return -1;
  // Freshness first, then the channels you chose, then the subjects you keep
  // choosing, then whether anybody else watched it.
  const fresh = 1 / (1 + ageDays / 9);
  const mine = subscribed.has(video.channelId) ? 2.6 : 1;
  const liked = 1 + Math.min(1.4, (taste.get(video.topic) ?? 0) * 0.16);
  const popular = 1 + Math.log10(Math.max(10, video.views)) / 9;
  const made = 0.7 + video.quality / 220;
  return fresh * mine * liked * popular * made;
}

/** Nobody wants a page of one channel, however much they like it. */
const MOST_PER_CHANNEL = 2;

/**
 * The home feed: what the app puts in front of you when you open it.
 *
 * Scored on freshness, then on the channels you chose, then on the subjects you
 * keep choosing, then on whether anybody else watched it. Then spread out, so a
 * channel you subscribed to this morning does not become the whole page.
 */
export function homeFeed(sim: Simulation, personId: Id, limit = FEED_SIZE): VideoItem[] {
  const subscribed = new Set(subscriptionsOf(sim, personId).map((s) => s.channelId));
  const taste = tasteOf(sim, personId);
  const seen = watchedIds(sim, personId);
  const ranked = allVideos(sim)
    .map((video) => ({ video, score: feedScore(sim, video, subscribed, taste, seen) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const shown: VideoItem[] = [];
  const held: VideoItem[] = [];
  const perChannel = new Map<Id, number>();
  for (const { video } of ranked) {
    if (shown.length >= limit) break;
    const already = perChannel.get(video.channelId) ?? 0;
    if (already >= MOST_PER_CHANNEL) { held.push(video); continue; }
    perChannel.set(video.channelId, already + 1);
    shown.push(video);
  }
  // The ones held back fill the bottom rather than disappearing.
  for (const video of held) {
    if (shown.length >= limit) break;
    shown.push(video);
  }
  return shown;
}

/** Only the channels you subscribe to, newest first, the way that tab works. */
export function subscriptionFeed(sim: Simulation, personId: Id, limit = FEED_SIZE): VideoItem[] {
  const subscribed = new Set(subscriptionsOf(sim, personId).map((s) => s.channelId));
  return allVideos(sim)
    .filter((v) => subscribed.has(v.channelId))
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, limit);
}

/** Search, over titles, channels and subjects. */
export function searchVideos(sim: Simulation, query: string, limit = 40): VideoItem[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  return allVideos(sim)
    .filter((video) => {
      const channel = sim.universe.videoChannels[video.channelId];
      return video.title.toLowerCase().includes(needle)
        || video.topic.toLowerCase().includes(needle)
        || (channel?.name.toLowerCase().includes(needle) ?? false)
        || (channel?.handle.toLowerCase().includes(needle) ?? false);
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/** What the room sounds like, given how good the video was. */
function bandsFor(quality: number, rng: Rng): CommentBand {
  const good = quality / 100;
  return rng.weighted<CommentBand>(
    ['praise', 'warm', 'pedantic', 'offtopic', 'critical', 'harsh'],
    (band) => {
      switch (band) {
        case 'praise': return 10 * good * good;
        case 'warm': return 14 * good;
        case 'pedantic': return 6;
        case 'offtopic': return 7;
        case 'critical': return 10 * (1.15 - good);
        case 'harsh': return 4 * (1.3 - good);
        default: return 1;
      }
    },
  );
}

const SENTIMENT: Readonly<Record<CommentBand, number>> = {
  praise: 85, warm: 55, pedantic: 5, offtopic: 12, critical: -40, harsh: -88,
};

/** The room under a video, worked out from the video rather than written down. */
function deriveComments(sim: Simulation, video: VideoItem): VideoComment[] {
  const rng = sim.rng('video.comments', video.id);
  const made: VideoComment[] = [];
  for (let i = 0; i < COMMENTS_PER_VIDEO; i += 1) {
    const band = bandsFor(video.quality, rng);
    made.push({
      id: `${video.id}#c${i}`,
      saveId: sim.universe.meta.id,
      videoId: video.id,
      authorName: makeHandle(rng),
      text: rng.pick([...COMMENT_LINES[band]]),
      at: video.publishedAt + rng.int(1, 72) * 3_600_000,
      likes: Math.max(0, Math.round(video.views * rng.float(0, 0.0009))),
      sentiment: SENTIMENT[band],
      harsh: band === 'harsh',
    });
  }
  return made;
}

/**
 * Writes the room down, which is only ever done for your own videos: there you
 * need to know which unkind ones you have already read, and a reply has to
 * stay put. Idempotent, and it never doubles a section.
 */
export function ensureComments(sim: Simulation, video: VideoItem): VideoComment[] {
  const stored = Object.values(sim.universe.videoComments).filter((c) => c.videoId === video.id && !c.byPlayer);
  if (stored.length > 0) return commentsOn(sim, video.id);
  for (const derived of deriveComments(sim, video)) {
    const comment: VideoComment = { ...derived, id: sim.nextId('vcom') };
    sim.universe.videoComments[comment.id] = comment;
  }
  return commentsOn(sim, video.id);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface ChannelAnalytics {
  subscribers: number;
  videos: number;
  totalViews: number;
  /** Views per day for the last 28 days, oldest first. */
  daily: number[];
  viewsLast28: number;
  averageRetention: number;
  /** The one that took off, and the one that did not. */
  best?: VideoItem;
  worst?: VideoItem;
  /** Median views, which is the number that actually describes a channel. */
  median: number;
  lastUploadAt?: number;
}

/**
 * Analytics that behave like analytics: a curve rather than a total, a median
 * beside the mean because one breakout hides everything, and the video that
 * did nothing shown next to the one that did.
 */
export function channelAnalytics(sim: Simulation, channelId: Id): ChannelAnalytics {
  const channel = sim.universe.videoChannels[channelId];
  const videos = videosOf(sim, channelId);
  const daily: number[] = [];
  for (let day = 27; day >= 0; day -= 1) {
    const to = sim.now - day * MS_DAY;
    let views = 0;
    for (const video of videos) {
      if (video.publishedAt > to) continue;
      // A video's views arrive on a decaying curve rather than all at once.
      const ageDays = Math.max(0, (to - video.publishedAt) / MS_DAY);
      const share = Math.exp(-ageDays / 12) / 12;
      views += video.views * share;
    }
    daily.push(Math.round(views));
  }
  const sorted = [...videos].sort((a, b) => a.views - b.views);
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)]!.views : 0;
  return {
    subscribers: channel?.subscribers ?? 0,
    videos: videos.length,
    totalViews: videos.reduce((sum, v) => sum + v.views, 0),
    daily,
    viewsLast28: daily.reduce((sum, v) => sum + v, 0),
    averageRetention: videos.length > 0
      ? videos.reduce((sum, v) => sum + v.retention, 0) / videos.length
      : 0,
    best: sorted[sorted.length - 1],
    worst: sorted[0],
    median,
    lastUploadAt: channel?.lastUploadAt,
  };
}

/**
 * Your own videos get their numbers from the post underneath them.
 *
 * The money side of a video lives in media.ts as a `SocialPost`, and that is
 * where reach is actually modeled: quality, audience, consistency, momentum.
 * Rather than running a second and different model here, the app reads that
 * one and applies the single thing it owns — the thumbnail, which is most of
 * whether anybody clicked in the first place.
 */
export function syncMyVideos(sim: Simulation): void {
  const channel = myChannel(sim);
  if (!channel) return;
  let total = 0;
  for (const video of Object.values(sim.universe.videos)) {
    if (video.channelId !== channel.id) continue;
    const post = video.postId ? sim.universe.socialPosts[video.postId] : undefined;
    if (post) {
      const bias = THUMBNAIL_BY_ID[video.thumbnail]?.clickBias ?? 1;
      video.views = Math.round(post.metrics.views * bias);
      video.likes = Math.round(post.metrics.likes * bias);
      video.commentCount = post.metrics.comments;
    }
    total += video.views;
  }
  channel.totalViews = total;
  const account = channel.accountId ? sim.universe.socialAccounts[channel.accountId] : undefined;
  if (account) channel.subscribers = account.followers;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerVideo(sim: Simulation): void {
  // --- The world keeps uploading while you are not looking -------------------

  sim.onSchedule('video.world_tick', () => {
    for (const channel of channelsOf(sim)) {
      if (channel.ownerId) continue;
      const due = (channel.lastUploadAt ?? channel.createdAt) + channel.cadenceDays * MS_DAY;
      if (due > sim.now) continue;
      channel.uploads += 1;
      channel.lastUploadAt = sim.now;
      const video = newestOf(sim, channel);
      if (!video) continue;
      channel.totalViews += video.views;
      // A channel grows or shrinks a little with each video it puts out.
      const swing = (video.quality - 55) / 100;
      channel.subscribers = Math.max(120, Math.round(channel.subscribers * (1 + swing * 0.004)));
      if (isSubscribed(sim, sim.player.id, channel.id)) {
        const subscription = subscriptionsOf(sim, sim.player.id).find((s) => s.channelId === channel.id);
        if (subscription?.notify) {
          sim.notify({
            title: `${channel.name} Uploaded`,
            body: video.title,
            category: 'personal',
            refType: 'video', refId: video.id,
          });
        }
      }
    }
    syncMyVideos(sim);
    sim.schedule({
      at: addDays(sim.now, 1, sim.homeZone), kind: 'video.world_tick',
      label: 'New Uploads', category: 'system', priority: 94,
    });
  });

  sim.onSchedule('video.publish', (item) => {
    const video = sim.universe.videos[item.payload.videoId as Id];
    if (!video || video.status !== 'scheduled') return;
    video.status = 'published';
    video.publishedAt = sim.now;
    const channel = sim.universe.videoChannels[video.channelId];
    if (channel) channel.lastUploadAt = sim.now;
    sim.notify({
      title: 'Your Video Is Live',
      body: video.title,
      category: 'personal',
      refType: 'video', refId: video.id,
    });
    sim.emit('video.published', { videoId: video.id, title: video.title });
  });

  // --- Subscribing -----------------------------------------------------------

  sim.onCommand<{ channelId: Id; notify?: boolean }, { subscribed: boolean }>(
    'video.subscribe',
    (p, { sim: s }) => {
      const channel = s.universe.videoChannels[p.channelId];
      if (!channel) throw new CommandError('No such channel.');
      if (channel.ownerId === s.player.id) throw new CommandError('You cannot subscribe to yourself.');
      const already = subscriptionsOf(s, s.player.id).find((sub) => sub.channelId === channel.id);
      if (already) {
        already.notify = p.notify ?? already.notify;
        return { subscribed: true };
      }
      const subscription: VideoSubscription = {
        id: s.nextId('vsub'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        channelId: channel.id,
        since: s.now,
        notify: p.notify ?? false,
      };
      s.universe.videoSubscriptions[subscription.id] = subscription;
      channel.subscribers += 1;
      s.emit('video.subscribed', { channelId: channel.id, name: channel.name });
      return { subscribed: true };
    },
  );

  sim.onCommand<{ channelId: Id }, { subscribed: boolean }>(
    'video.unsubscribe',
    (p, { sim: s }) => {
      const subscription = subscriptionsOf(s, s.player.id).find((sub) => sub.channelId === p.channelId);
      if (!subscription) throw new CommandError('You are not subscribed to that.');
      delete s.universe.videoSubscriptions[subscription.id];
      const channel = s.universe.videoChannels[p.channelId];
      if (channel) channel.subscribers = Math.max(0, channel.subscribers - 1);
      s.emit('video.unsubscribed', { channelId: p.channelId });
      return { subscribed: false };
    },
  );

  // --- Watching, which costs you the time ------------------------------------

  sim.onCommand<
    { videoId: Id; minutes?: number; like?: boolean },
    { minutes: number; finished: boolean; note: string; watchedToday: number }
  >(
    'video.watch',
    (p, { sim: s }) => {
      const video = videoById(s, p.videoId);
      if (!video || video.status !== 'published') throw new CommandError('That video is not up.');
      if (video.publishedAt > s.now) throw new CommandError('That is not out yet.');

      const minutes = clamp(Math.round(p.minutes ?? video.lengthMinutes), 1, video.lengthMinutes);
      const finished = minutes >= video.lengthMinutes;
      const person = s.player;
      s.advanceTo(s.now + minutes * MS_MINUTE);

      // An hour of one thing is not an hour of another.
      const effect = TOPIC_EFFECT[video.topic as Topic] ?? { morale: 3, energy: -2, stress: -1, note: 'Time went.' };
      const share = minutes / 60;
      person.wellbeing.morale = clamp(person.wellbeing.morale + effect.morale * share, 0, 100);
      person.wellbeing.energy = clamp(person.wellbeing.energy + effect.energy * share, 0, 100);
      person.wellbeing.stress = clamp(person.wellbeing.stress + effect.stress * share, 0, 100);

      const record: WatchRecord = {
        id: s.nextId('watch'),
        saveId: s.universe.meta.id,
        personId: person.id,
        videoId: video.id,
        at: s.now,
        minutes,
        finished,
        liked: p.like,
      };
      s.universe.watchHistory[record.id] = record;
      // A derived video cannot carry your view; the channel can, and that is
      // where it would show up anyway.
      const channel = s.universe.videoChannels[video.channelId];
      if (channel) channel.totalViews += 1;
      const stored = s.universe.videos[video.id];
      if (stored) {
        stored.views += 1;
        if (p.like) stored.likes += 1;
      }

      const watchedToday = minutesWatchedSince(s, person.id, s.now - MS_DAY);
      let note = effect.note;
      if (watchedToday >= BINGE_MINUTES) {
        note = `${effect.note} That is ${Math.round(watchedToday / 60)} hours of this today.`;
        person.wellbeing.morale = clamp(person.wellbeing.morale - 3, 0, 100);
      }
      s.emit('video.watched', { videoId: video.id, minutes, finished });
      return { minutes, finished, note, watchedToday };
    },
  );

  // --- Saying something ------------------------------------------------------

  sim.onCommand<{ videoId: Id; text: string; replyToId?: Id }, { commentId: Id }>(
    'video.comment',
    (p, { sim: s }) => {
      const video = videoById(s, p.videoId);
      if (!video) throw new CommandError('No such video.');
      const text = p.text.trim();
      if (text.length < 2) throw new CommandError('Write something first.');
      if (text.length > 600) throw new CommandError('That is longer than anybody will read.');
      const comment: VideoComment = {
        id: s.nextId('vcom'),
        saveId: s.universe.meta.id,
        videoId: video.id,
        authorId: s.player.id,
        authorName: s.player.displayName,
        text,
        at: s.now,
        likes: 0,
        sentiment: 0,
        byPlayer: true,
        replyToId: p.replyToId,
        seen: true,
      };
      s.universe.videoComments[comment.id] = comment;
      video.commentCount += 1;
      s.advanceTo(s.now + 3 * MS_MINUTE);
      s.emit('video.commented', { videoId: video.id, commentId: comment.id });
      return { commentId: comment.id };
    },
  );

  /** Reading the ones you were warned about, which is your decision to make. */
  sim.onCommand<{ videoId: Id }, { read: number; worst: number }>(
    'video.read_harsh',
    (p, { sim: s }) => {
      const video = videoById(s, p.videoId);
      if (!video) throw new CommandError('No such video.');
      const channel = s.universe.videoChannels[video.channelId];
      if (channel?.ownerId !== s.player.id) throw new CommandError('Those are not about you.');
      ensureComments(s, video);
      const harsh = commentsOn(s, video.id).filter((c) => c.harsh && !c.seen);
      if (harsh.length === 0) throw new CommandError('There is nothing hidden on this one.');
      let worst = 0;
      for (const comment of harsh) {
        comment.seen = true;
        worst = Math.min(worst, comment.sentiment);
      }
      const person = s.player;
      person.wellbeing.morale = clamp(person.wellbeing.morale - harsh.length * 1.6, 0, 100);
      person.wellbeing.stress = clamp(person.wellbeing.stress + harsh.length * 1.2, 0, 100);
      s.advanceTo(s.now + harsh.length * 2 * MS_MINUTE);
      s.emit('video.read_harsh', { videoId: video.id, count: harsh.length });
      return { read: harsh.length, worst };
    },
  );

  // --- Your own channel ------------------------------------------------------

  sim.onCommand<{ name?: string; handle?: string; topic?: string; about?: string }, { channelId: Id }>(
    'video.create_channel',
    (p, { sim: s }) => {
      const existing = myChannel(s);
      if (existing) throw new CommandError('You already have a channel.');
      const name = (p.name ?? s.player.displayName).trim();
      if (name.length < 2) throw new CommandError('A channel needs a name.');
      const handle = (p.handle ?? name).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (handle.length < 2) throw new CommandError('That handle will not do.');
      if (channelsOf(s).some((c) => c.handle === handle)) throw new CommandError('That handle is taken.');

      // A channel without an account earns nothing, because the money side of
      // a video lives on the account. So making a channel makes the account
      // too, rather than leaving somebody uploading into a void for weeks.
      let account = Object.values(s.universe.socialAccounts)
        .find((a) => a.ownerId === s.player.id && a.platform === VIDEO_PLATFORM);
      if (!account) {
        const opened = s.execute<{ accountId: Id }>({
          kind: 'social.create_account',
          payload: { platform: VIDEO_PLATFORM, handle, displayName: name, bio: p.about ?? '' },
        });
        if (opened.ok) account = s.universe.socialAccounts[opened.value!.accountId];
      }
      const channel: VideoChannel = {
        id: s.nextId('chan'),
        saveId: s.universe.meta.id,
        platform: VIDEO_PLATFORM,
        name,
        handle,
        topic: p.topic ?? 'talk',
        about: p.about ?? 'No description yet.',
        subscribers: account?.followers ?? 0,
        verified: false,
        createdAt: s.now,
        cadenceDays: 7,
        craft: 40,
        tone: 'warm',
        ownerId: s.player.id,
        accountId: account?.id,
        totalViews: 0,
        uploads: 0,
      };
      s.universe.videoChannels[channel.id] = channel;
      s.emit('video.channel_created', { channelId: channel.id, handle });
      return { channelId: channel.id };
    },
  );

  sim.onCommand<
    {
      title: string; description?: string; tags?: string[]; thumbnail?: string;
      lengthMinutes?: number; effortMinutes?: number; publishAt?: number;
    },
    { videoId: Id; status: VideoItem['status']; quality: number; postId?: Id }
  >(
    'video.upload',
    (p, { sim: s }) => {
      const channel = myChannel(s);
      if (!channel) throw new CommandError('You have no channel yet.');
      const title = p.title.trim();
      if (title.length < 3) throw new CommandError('Give it a title.');
      if (title.length > 100) throw new CommandError('That title is too long for the card.');
      const thumbnail = p.thumbnail ?? 'frame';
      if (!THUMBNAIL_BY_ID[thumbnail]) throw new CommandError('That is not one of the thumbnails.');
      const lengthMinutes = clamp(Math.round(p.lengthMinutes ?? 12), 1, 240);
      const effortMinutes = clamp(Math.round(p.effortMinutes ?? 180), 20, 2400);
      if (p.publishAt !== undefined && p.publishAt < s.now) {
        throw new CommandError('You cannot schedule something for the past.');
      }

      const rng = s.rng('video.mine', channel.id, s.counter('video.upload'));
      const craft = clamp(channel.craft + Math.log10(Math.max(10, effortMinutes)) * 8 - 12, 5, 100);
      const quality = clamp(Math.round(craft + rng.int(-10, 10)), 1, 100);
      const scheduled = p.publishAt !== undefined && p.publishAt > s.now;

      const video: VideoItem = {
        id: s.nextId('vid'),
        saveId: s.universe.meta.id,
        channelId: channel.id,
        title,
        description: (p.description ?? '').trim(),
        tags: p.tags?.slice(0, 12) ?? [],
        publishedAt: scheduled ? p.publishAt! : s.now,
        lengthMinutes,
        topic: channel.topic,
        views: 0,
        likes: 0,
        dislikes: 0,
        commentCount: 0,
        thumbnail,
        quality,
        retention: clamp(0.24 + quality / 260, 0.1, 0.95),
        status: scheduled ? 'scheduled' : 'published',
        scheduledFor: scheduled ? p.publishAt : undefined,
      };
      s.universe.videos[video.id] = video;

      if (scheduled) {
        s.schedule({
          at: p.publishAt!, kind: 'video.publish', payload: { videoId: video.id },
          label: `Publishing ${title}`, category: 'personal', priority: 70,
          refType: 'video', refId: video.id,
        });
      } else {
        channel.lastUploadAt = s.now;
      }
      channel.uploads += 1;

      // The money side is media.ts's: a video is also a post, and a post earns.
      // Making it takes the hours out of the day; the post charges them, so
      // this does not charge them a second time.
      let postId: Id | undefined;
      if (channel.accountId) {
        const posted = s.execute<{ postId: Id }>({
          kind: 'social.create_post',
          payload: {
            accountId: channel.accountId,
            format: lengthMinutes > 3 ? 'long_video' : 'short_video',
            title,
            body: video.description,
            effortMinutes,
            topic: channel.topic,
            scheduledFor: scheduled ? p.publishAt : undefined,
          },
        });
        if (posted.ok) {
          postId = posted.value!.postId;
          video.postId = postId;
          // A post is queued to publish the moment it is made. Nudging the
          // clock a minute lets that happen now rather than at the next thing
          // the player does, so the video and the post are never out of step.
          if (!scheduled) s.advanceTo(s.now + MS_MINUTE);
          video.publishedAt = s.now;
        }
      } else {
        // No account behind the channel, so nothing charges the hours but this.
        s.advanceTo(s.now + effortMinutes * MS_MINUTE);
        s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - effortMinutes / 34, 0, 100);
      }

      // Practice tells. A channel gets better at the thing it keeps doing.
      channel.craft = clamp(channel.craft + 0.4, 5, 100);
      s.emit('video.uploaded', { videoId: video.id, title, scheduled });
      return { videoId: video.id, status: video.status, quality, postId };
    },
  );

  sim.onCommand<{ videoId: Id; title?: string; description?: string; thumbnail?: string; tags?: string[] }, { videoId: Id }>(
    'video.edit',
    (p, { sim: s }) => {
      const video = s.universe.videos[p.videoId];
      if (!video) throw new CommandError('No such video.');
      const channel = s.universe.videoChannels[video.channelId];
      if (channel?.ownerId !== s.player.id) throw new CommandError('That is not your video.');
      if (p.title !== undefined) {
        const title = p.title.trim();
        if (title.length < 3) throw new CommandError('Give it a title.');
        video.title = title;
      }
      if (p.description !== undefined) video.description = p.description.trim();
      if (p.thumbnail !== undefined) {
        if (!THUMBNAIL_BY_ID[p.thumbnail]) throw new CommandError('That is not one of the thumbnails.');
        // A new thumbnail on a live video changes what happens next, not what
        // already happened, which is exactly how it works.
        video.thumbnail = p.thumbnail;
      }
      if (p.tags !== undefined) video.tags = p.tags.slice(0, 12);
      s.emit('video.edited', { videoId: video.id });
      return { videoId: video.id };
    },
  );

  /** A video you take down. The views it had are not given back. */
  sim.onCommand<{ videoId: Id }, { videoId: Id }>(
    'video.take_down',
    (p, { sim: s }) => {
      const video = s.universe.videos[p.videoId];
      if (!video) throw new CommandError('No such video.');
      const channel = s.universe.videoChannels[video.channelId];
      if (channel?.ownerId !== s.player.id) throw new CommandError('That is not your video.');
      if (video.status === 'removed') throw new CommandError('That is already down.');
      video.status = 'removed';
      s.emit('video.taken_down', { videoId: video.id });
      return { videoId: video.id };
    },
  );
}

/**
 * The video world exists and its clock is running, applied to a save that may
 * never have had one. Idempotent, and it creates nothing twice.
 */
export function ensureVideoWorld(sim: Simulation): void {
  ensureChannels(sim);
  if (sim.timeline.pending().some((i) => i.kind === 'video.world_tick')) return;
  sim.schedule({
    at: addDays(sim.now, 1, sim.homeZone), kind: 'video.world_tick',
    label: 'New Uploads', category: 'system', priority: 94,
  });
}
