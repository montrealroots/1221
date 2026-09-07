/**
 * SLATE — the parts of the app that are settings, threads and the bell.
 *
 * video.ts is the feed and the watch. creator.ts is the money. This is the
 * remaining third: how the player has the app configured, what a comment
 * section does when you reply to somebody in it, where a video breaks into
 * chapters, and the inbox behind the bell.
 *
 * None of it is chrome. Watching at double speed really does take half the
 * time and really does leave you with less of it; captions really do help;
 * autoplay really does start the next one, which is how three hours go.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  Id, VideoComment, VideoItem, VideoNotice, VideoPreferences,
} from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY } from '../core/time';
import { commentsOn, ensureComments, homeFeed, myChannel, videoById } from './video';

/** What the app is set to when nobody has changed anything. */
export const DEFAULT_PREFERENCES: VideoPreferences = {
  speed: 1,
  quality: 'auto',
  autoplay: true,
  captions: false,
  searchSort: 'relevance',
};

/** The speeds the control offers, which are the ones people use. */
export const SPEEDS: readonly number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** What it can be set to play at. */
export const QUALITIES: readonly VideoPreferences['quality'][] = ['auto', '1080p', '720p', '480p', '144p'];

/** How many videos autoplay will chain before it asks whether you are still there. */
export const AUTOPLAY_LIMIT = 4;

export function preferences(sim: Simulation): VideoPreferences {
  sim.universe.videoPreferences ??= { ...DEFAULT_PREFERENCES };
  return sim.universe.videoPreferences;
}

/**
 * What watching at this speed, quality and caption setting is worth.
 *
 * Faster is less. Not proportionally less — most of a video survives being
 * watched at one and a quarter — but past one and a half you are skimming, and
 * a hundred and forty four pixels is not watching a film essay. Captions pull
 * some of that back, which is what they are for.
 */
export function comprehension(prefs: VideoPreferences): number {
  const bySpeed = prefs.speed <= 1 ? 1 : clamp(1.18 - prefs.speed * 0.18, 0.55, 1);
  const byQuality = prefs.quality === '144p' ? 0.72 : prefs.quality === '480p' ? 0.92 : 1;
  const byCaptions = prefs.captions ? 1.08 : 1;
  return clamp(bySpeed * byQuality * byCaptions, 0.4, 1.15);
}

/** How long a video actually takes at the speed it is set to. */
export function minutesAtSpeed(lengthMinutes: number, prefs: VideoPreferences): number {
  return Math.max(1, Math.round(lengthMinutes / clamp(prefs.speed, 0.25, 2)));
}

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

/** The words a chapter is called, by what kind of video it is. */
const CHAPTER_NAMES: readonly string[] = [
  'Intro', 'The Setup', 'What Went Wrong', 'The Method', 'First Attempt', 'The Numbers',
  'A Better Way', 'The Test', 'What I Would Change', 'Questions', 'The Result', 'Outro',
  'Background', 'The Problem', 'The Middle Bit', 'One More Thing', 'The Verdict', 'Thanks',
];

/**
 * Where a video breaks into parts.
 *
 * Derived, like everything else about a video nobody wrote by hand: the same
 * video always breaks in the same places, and a two minute short has no
 * chapters because nobody chapters a two minute short.
 */
export function chaptersOf(sim: Simulation, video: VideoItem): { at: number; title: string }[] {
  if (video.chapters) return video.chapters;
  if (video.lengthMinutes < 8) return [];
  const rng = sim.rng('video.chapters', video.id);
  const count = clamp(Math.round(video.lengthMinutes / rng.int(4, 9)), 2, 9);
  const chapters: { at: number; title: string }[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i += 1) {
    let title = rng.pick([...CHAPTER_NAMES]);
    for (let tries = 0; used.has(title) && tries < 12; tries += 1) title = rng.pick([...CHAPTER_NAMES]);
    used.add(title);
    chapters.push({ at: Math.round((video.lengthMinutes / count) * i), title });
  }
  return chapters;
}

/** Does this one have captions? Most do; the smallest channels have not bothered. */
export function hasCaptions(sim: Simulation, video: VideoItem): boolean {
  if (video.captions !== undefined) return video.captions;
  const channel = sim.universe.videoChannels[video.channelId];
  const rng = sim.rng('video.captions', video.id);
  return rng.chance(channel && channel.subscribers > 250_000 ? 0.92 : 0.55);
}

// ---------------------------------------------------------------------------
// The bell
// ---------------------------------------------------------------------------

export function noticesOf(sim: Simulation, personId: Id): VideoNotice[] {
  return Object.values(sim.universe.videoNotices)
    .filter((n) => n.personId === personId)
    .sort((a, b) => b.at - a.at);
}

export function unseenNotices(sim: Simulation, personId: Id): number {
  return noticesOf(sim, personId).filter((n) => !n.seen).length;
}

export function addNotice(
  sim: Simulation,
  spec: { kind: VideoNotice['kind']; text: string; channelId?: Id; videoId?: Id },
): VideoNotice {
  const notice: VideoNotice = {
    id: sim.nextId('vnotice'),
    saveId: sim.universe.meta.id,
    personId: sim.player.id,
    kind: spec.kind,
    text: spec.text,
    at: sim.now,
    seen: false,
    channelId: spec.channelId,
    videoId: spec.videoId,
  };
  sim.universe.videoNotices[notice.id] = notice;
  // The bell is an inbox, not a hoard: the oldest go once there are too many.
  const mine = noticesOf(sim, sim.player.id);
  if (mine.length > 120) {
    for (const old of mine.slice(120)) delete sim.universe.videoNotices[old.id];
  }
  return notice;
}

// ---------------------------------------------------------------------------
// Search, filtered the way the app filters it
// ---------------------------------------------------------------------------

export interface SearchFilters {
  uploaded?: 'any' | 'today' | 'week' | 'month' | 'year';
  duration?: 'any' | 'short' | 'medium' | 'long';
  sort?: VideoPreferences['searchSort'];
}

/** The filter panel, applied. */
export function applyFilters(
  sim: Simulation, results: VideoItem[], filters: SearchFilters,
): VideoItem[] {
  const windows: Record<string, number> = { today: 1, week: 7, month: 31, year: 365 };
  const days = filters.uploaded && filters.uploaded !== 'any' ? windows[filters.uploaded] : undefined;
  const filtered = results.filter((video) => {
    if (days !== undefined && sim.now - video.publishedAt > days * MS_DAY) return false;
    if (filters.duration === 'short' && video.lengthMinutes > 4) return false;
    if (filters.duration === 'medium' && (video.lengthMinutes <= 4 || video.lengthMinutes > 20)) return false;
    if (filters.duration === 'long' && video.lengthMinutes <= 20) return false;
    return true;
  });
  const sort = filters.sort ?? 'relevance';
  if (sort === 'date') return [...filtered].sort((a, b) => b.publishedAt - a.publishedAt);
  if (sort === 'views') return [...filtered].sort((a, b) => b.views - a.views);
  return filtered;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerVideoApp(sim: Simulation): void {
  // --- Settings -------------------------------------------------------------

  sim.onCommand<Partial<VideoPreferences>, VideoPreferences>(
    'video.set_preferences',
    (p, { sim: s }) => {
      const prefs = preferences(s);
      if (p.speed !== undefined) {
        if (!SPEEDS.includes(p.speed)) throw new CommandError('That is not one of the speeds.');
        prefs.speed = p.speed;
      }
      if (p.quality !== undefined) {
        if (!QUALITIES.includes(p.quality)) throw new CommandError('That is not one of the qualities.');
        prefs.quality = p.quality;
      }
      if (p.autoplay !== undefined) prefs.autoplay = p.autoplay;
      if (p.captions !== undefined) prefs.captions = p.captions;
      if (p.searchSort !== undefined) prefs.searchSort = p.searchSort;
      return { ...prefs };
    },
  );

  // --- Threads --------------------------------------------------------------

  sim.onCommand<{ commentId: Id; text: string }, { commentId: Id }>(
    'video.reply_comment',
    (p, { sim: s }) => {
      const parent = Object.values(s.universe.videoComments).find((c) => c.id === p.commentId)
        ?? findDerivedComment(s, p.commentId);
      if (!parent) throw new CommandError('No such comment.');
      const text = p.text.trim();
      if (text.length < 2) throw new CommandError('Write something first.');
      const reply: VideoComment = {
        id: s.nextId('vcom'),
        saveId: s.universe.meta.id,
        videoId: parent.videoId,
        authorId: s.player.id,
        authorName: s.player.displayName,
        text,
        at: s.now,
        likes: 0,
        sentiment: 0,
        byPlayer: true,
        replyToId: parent.id,
        seen: true,
      };
      s.universe.videoComments[reply.id] = reply;
      const video = videoById(s, parent.videoId);
      if (video) video.commentCount += 1;
      s.emit('video.replied', { videoId: parent.videoId, commentId: reply.id });
      return { commentId: reply.id };
    },
  );

  sim.onCommand<{ commentId: Id }, { pinned: boolean }>(
    'video.pin_comment',
    (p, { sim: s }) => {
      const comment = s.universe.videoComments[p.commentId];
      if (!comment) throw new CommandError('That comment cannot be pinned.');
      const video = videoById(s, comment.videoId);
      const channel = video ? s.universe.videoChannels[video.channelId] : undefined;
      if (channel?.ownerId !== s.player.id) throw new CommandError('You can only pin on your own video.');
      // Only one at a time, the way the real one works.
      for (const other of commentsOn(s, comment.videoId)) {
        const stored = s.universe.videoComments[other.id];
        if (stored && stored.id !== comment.id) stored.pinned = false;
      }
      comment.pinned = !comment.pinned;
      return { pinned: comment.pinned === true };
    },
  );

  sim.onCommand<{ commentId: Id }, { hearted: boolean }>(
    'video.heart_comment',
    (p, { sim: s }) => {
      const comment = s.universe.videoComments[p.commentId];
      if (!comment) throw new CommandError('That comment cannot be hearted.');
      const video = videoById(s, comment.videoId);
      const channel = video ? s.universe.videoChannels[video.channelId] : undefined;
      if (channel?.ownerId !== s.player.id) throw new CommandError('Only the channel can heart a comment.');
      comment.hearted = !comment.hearted;
      if (comment.hearted) comment.likes += 1;
      return { hearted: comment.hearted === true };
    },
  );

  // --- The bell -------------------------------------------------------------

  sim.onCommand<Record<string, never>, { read: number }>(
    'video.read_notices',
    (_p, { sim: s }) => {
      const unseen = noticesOf(s, s.player.id).filter((n) => !n.seen);
      for (const notice of unseen) notice.seen = true;
      return { read: unseen.length };
    },
  );

  // --- Photos ---------------------------------------------------------------

  sim.onCommand<{ videoId: Id; image?: string }, { videoId: Id }>(
    'video.set_thumbnail_image',
    (p, { sim: s }) => {
      const video = s.universe.videos[p.videoId];
      if (!video) throw new CommandError('That is not your video.');
      const channel = s.universe.videoChannels[video.channelId];
      if (channel?.ownerId !== s.player.id) throw new CommandError('That is not your video.');
      if (p.image !== undefined && !p.image.startsWith('data:image/')) {
        throw new CommandError('That is not an image.');
      }
      video.thumbnailImage = p.image;
      s.emit('video.thumbnail_set', { videoId: video.id, custom: Boolean(p.image) });
      return { videoId: video.id };
    },
  );

  sim.onCommand<{ which: 'avatar' | 'banner'; image?: string }, { which: string }>(
    'video.set_channel_image',
    (p, { sim: s }) => {
      const channel = myChannel(s);
      if (!channel) throw new CommandError('You have no channel yet.');
      if (p.image !== undefined && !p.image.startsWith('data:image/')) {
        throw new CommandError('That is not an image.');
      }
      if (p.which === 'avatar') channel.avatarImage = p.image;
      else if (p.which === 'banner') channel.bannerImage = p.image;
      else throw new CommandError('There is no picture there to change.');
      return { which: p.which };
    },
  );

  // --- Autoplay -------------------------------------------------------------

  /**
   * Watches this one and then keeps going, which is how an evening actually
   * disappears. It stops when the app would stop asking: after four, or when
   * the day has had enough of it.
   */
  sim.onCommand<{ videoId: Id; limit?: number }, { watched: number; minutes: number; stoppedBecause: string }>(
    'video.autoplay',
    (p, { sim: s }) => {
      const prefs = preferences(s);
      if (!prefs.autoplay) throw new CommandError('Autoplay is off.');
      let current = videoById(s, p.videoId);
      if (!current) throw new CommandError('No such video.');
      const limit = clamp(Math.round(p.limit ?? AUTOPLAY_LIMIT), 1, AUTOPLAY_LIMIT);

      let watched = 0;
      let minutes = 0;
      let stoppedBecause = 'You closed it.';
      for (let i = 0; i < limit && current; i += 1) {
        const result = s.execute<{ minutes: number }>({
          kind: 'video.watch', payload: { videoId: current.id },
        });
        if (!result.ok) { stoppedBecause = String(result.error); break; }
        watched += 1;
        minutes += result.value!.minutes;
        const next = homeFeed(s, s.player.id, 6).find((v) => v.id !== current!.id);
        if (!next) { stoppedBecause = 'Nothing left it wanted to show you.'; break; }
        current = next;
        if (i === limit - 1) stoppedBecause = 'It asked whether you were still watching.';
      }
      return { watched, minutes, stoppedBecause };
    },
  );
}

/** A derived comment, found by walking the section it belongs to. */
function findDerivedComment(sim: Simulation, commentId: Id): VideoComment | undefined {
  const videoId = commentId.split('#')[0];
  if (!videoId) return undefined;
  const video = videoById(sim, videoId);
  if (!video) return undefined;
  return commentsOn(sim, video.id).find((c) => c.id === commentId);
}

/**
 * The settings exist and the bell has been wired to the world. Idempotent.
 */
export function ensureVideoApp(sim: Simulation): void {
  preferences(sim);
}

/** Puts a comment section in a state where it can be replied to and pinned. */
export function openSection(sim: Simulation, video: VideoItem): VideoComment[] {
  const channel = sim.universe.videoChannels[video.channelId];
  if (channel?.ownerId === sim.player.id) return ensureComments(sim, video);
  return commentsOn(sim, video.id);
}
