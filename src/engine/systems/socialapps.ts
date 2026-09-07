/**
 * SLATE — the photo app and the text app.
 *
 * The contract asked for the same thing here it asked for of the video app:
 * not a panel of numbers, the apps. So this is a world of accounts that were
 * already posting before the player arrived and keep posting while they are
 * away, a feed built out of who you actually follow, stories that are gone in
 * a day, comment sections that are warm on one app and an argument on the
 * other, your own account with everything it can do, and money that arrives
 * the way each app actually pays it.
 *
 * The two apps are kept apart on purpose, all the way down. A photograph with
 * a caption and a three hundred character opinion are not one object with two
 * skins: they are generated differently, they are ranked differently, they are
 * replied to differently, and they pay differently. Instagram pays through
 * subscriptions, gifts and the brands. X pays a share of the advertising
 * against the impressions a Premium account earns.
 *
 * As in the video app, the world is derived rather than stored. A profile
 * keeps a seed, a cadence and a count of what it has put out; its back
 * catalog is computed from those. Only what the player did — their own posts,
 * their likes, their replies, who they follow — is written into the save.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  CreatorPayout, Id, PlatformId, SocialFollow, SocialItem, SocialProfile, SocialRoom, SocialSettings,
} from '../domain/model';
import { clamp } from '../core/rng';
import type { Rng } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_DAY, MS_HOUR, MS_MINUTE, addDays, zonedParts, instantFromZoned } from '../core/time';
import {
  PHOTO_PROFILES, REAL_PROFILES, SOCIAL_TOPICS, SOCIAL_TOPIC_LABEL, TEXT_PROFILES,
  type ProfileSeed, type SocialTopic,
} from '../content/socialworld';
import {
  CLIP_COMMENTS, CLIP_FRAME, CLIP_KITS, CLIP_PROFILES, CLIP_TAGS, pickSound,
} from '../content/clipworld';
import {
  CAPTION_FRAME, CAPTION_KITS, PHOTO_COMMENTS, PLACES, POST_FRAME, POST_KITS, REPLY_LINES,
  TOPIC_COMMENTS, TOPIC_TAGS, makeSocialText,
} from '../content/socialposts';
import { addNotice } from './videoapp';
import type { Money } from '../core/money';
import { formatMoney } from '../core/money';

/** Instagram. The ids are persistence keys and are older than the names. */
export const PHOTO_PLATFORM: PlatformId = 'lumen';
/** X. */
export const TEXT_PLATFORM: PlatformId = 'chatter';
/** TikTok. */
export const CLIP_PLATFORM: PlatformId = 'pulse';

/** Which of the three an account is on, which decides everything about it. */
export function appOf(platform: PlatformId): 'photo' | 'text' | 'clip' {
  if (platform === TEXT_PLATFORM) return 'text';
  if (platform === CLIP_PLATFORM) return 'clip';
  return 'photo';
}

/** How far back a profile's feed goes before it is only a follower count. */
const CATALOG_WINDOW = 30;
/** Cards on a feed at once. */
export const FEED_SIZE = 24;
/** A story is gone this long after it went up. */
export const STORY_HOURS = 24;
/** Replies carried under something somebody else posted. */
const REPLIES_PER_ITEM = 6;
/** What the text app will take in one post. */
export const TEXT_LIMIT = 280;
/** What the photo app will take in one caption. */
export const CAPTION_LIMIT = 2_200;

/** X Premium, which is what turns the advertising share on. */
export const X_PREMIUM_MONTHLY: Money = 8_00;
/** Impressions you need before the share is worth paying out at all. */
export const X_PAYOUT_FLOOR = 500;
/** What a thousand impressions against a text post is worth to the platform. */
export const TEXT_CPM: Money = 240;
/** The creator's half of that. */
export const TEXT_SHARE = 0.5;
/** What somebody pays a month to subscribe to a photo account. */
export const PHOTO_SUB_MONTHLY: Money = 4_99;
/** What reaches the creator once the phone's shop has taken its cut. */
export const PHOTO_SUB_SHARE = 0.7;
/** A gift sent on a reel, in the steps the app offers. */
export const GIFT_STEPS: readonly Money[] = [99, 2_99, 9_99, 24_99, 99_99];
/** The creator's share of a gift. */
export const GIFT_SHARE = 0.55;
/**
 * What a thousand qualified views is worth on the short video app. Only views
 * that stayed past a minute count, which is why the number is small and the
 * qualified share is smaller.
 */
export const CLIP_RPM: Money = 60;
/** The share of views that stay long enough to be paid on at all. */
export const CLIP_QUALIFIED = 0.18;
/** Followers you need before the app will pay anything. */
export const CLIP_FLOOR = 10_000;

/**
 * What an hour on each kind of feed does to a person. The photo app is a
 * pleasant place that quietly makes you want things; the text app is an
 * argument you volunteered for.
 */
export const SOCIAL_EFFECT: Readonly<Record<SocialTopic, { morale: number; energy: number; stress: number }>> = {
  photo: { morale: 4, energy: -1, stress: -3 },
  food: { morale: 4, energy: -1, stress: -3 },
  fashion: { morale: 1, energy: -2, stress: 1 },
  travel: { morale: 2, energy: -1, stress: 0 },
  design: { morale: 3, energy: -1, stress: -2 },
  fitness: { morale: 2, energy: -2, stress: 1 },
  film: { morale: 4, energy: -1, stress: -2 },
  music: { morale: 5, energy: 0, stress: -3 },
  news: { morale: -3, energy: -3, stress: 5 },
  sport: { morale: 3, energy: -1, stress: 1 },
  comedy: { morale: 6, energy: -1, stress: -4 },
  tech: { morale: 1, energy: -2, stress: 1 },
  politics: { morale: -5, energy: -4, stress: 7 },
  books: { morale: 3, energy: -1, stress: -3 },
  business: { morale: 0, energy: -2, stress: 2 },
  street: { morale: 3, energy: -1, stress: -2 },
};

/** Meta Verified on the photo app, which is the other paid badge. */
export const PHOTO_VERIFIED_MONTHLY: Money = 14_99;

const DEFAULT_SETTINGS: SocialSettings = {
  privateAccount: false,
  hideCounts: false,
  notificationsOn: true,
  mutedProfileIds: [],
  blockedProfileIds: [],
  hiddenWords: [],
};

/** How the player has the apps set up, with the defaults filled in. */
export function settingsOf(sim: Simulation): SocialSettings {
  sim.universe.socialSettings ??= { ...DEFAULT_SETTINGS };
  const settings = sim.universe.socialSettings;
  settings.mutedProfileIds ??= [];
  settings.blockedProfileIds ??= [];
  settings.hiddenWords ??= [];
  return settings;
}

export function isMuted(sim: Simulation, profileId: Id): boolean {
  return settingsOf(sim).mutedProfileIds.includes(profileId);
}

export function isBlocked(sim: Simulation, profileId: Id): boolean {
  return settingsOf(sim).blockedProfileIds.includes(profileId);
}

/** Whether a hidden word takes this out of the room before you see it. */
export function isHidden(sim: Simulation, text: string): boolean {
  const words = settingsOf(sim).hiddenWords;
  if (words.length === 0) return false;
  const lower = text.toLowerCase();
  return words.some((word) => word.length > 1 && lower.includes(word.toLowerCase()));
}

/** The key one day of one app's screen time is kept under. */
function screenKey(sim: Simulation, platform: PlatformId, at: Instant): string {
  const parts = zonedParts(at, sim.homeZone);
  return `${platform}:${parts.year}-${parts.month}-${parts.day}`;
}

export function screenTime(sim: Simulation, platform: PlatformId, at = sim.now): number {
  return sim.universe.socialScreenTime?.[screenKey(sim, platform, at)] ?? 0;
}

/** Minutes over the last seven days, which is what the app shows you. */
export function screenTimeWeek(sim: Simulation, platform: PlatformId): number[] {
  const out: number[] = [];
  for (let back = 6; back >= 0; back -= 1) out.push(screenTime(sim, platform, sim.now - back * MS_DAY));
  return out;
}

function spend(sim: Simulation, platform: PlatformId, minutes: number): void {
  sim.universe.socialScreenTime ??= {};
  const key = screenKey(sim, platform, sim.now);
  sim.universe.socialScreenTime[key] = (sim.universe.socialScreenTime[key] ?? 0) + minutes;
}

// ---------------------------------------------------------------------------
// Reading the world
// ---------------------------------------------------------------------------

export function profilesOf(sim: Simulation, platform?: PlatformId): SocialProfile[] {
  const all = Object.values(sim.universe.socialProfiles);
  return platform ? all.filter((p) => p.platform === platform) : all;
}

export function profileById(sim: Simulation, profileId: Id): SocialProfile | undefined {
  return sim.universe.socialProfiles[profileId];
}

export function profileByHandle(sim: Simulation, platform: PlatformId, handle: string): SocialProfile | undefined {
  const wanted = handle.replace(/^@/, '').toLowerCase();
  return profilesOf(sim, platform).find((p) => p.handle.toLowerCase() === wanted);
}

/** The player's own account on one of the two apps, where they have made one. */
export function myProfile(sim: Simulation, platform: PlatformId): SocialProfile | undefined {
  return profilesOf(sim, platform).find((p) => p.ownerId === sim.player.id);
}

export function followsOf(sim: Simulation, personId: Id): SocialFollow[] {
  return Object.values(sim.universe.socialFollows).filter((f) => f.personId === personId);
}

export function isFollowing(sim: Simulation, personId: Id, profileId: Id): boolean {
  return followsOf(sim, personId).some((f) => f.profileId === profileId);
}

/**
 * Who follows you.
 *
 * A follower count that only goes up is a number. These are the accounts that
 * actually chose you, kept as rows so the app can show a list, so a new one
 * can arrive as a notice, and so unfollowing is something that happens to you
 * rather than something you only read about.
 */
export function followersOf(sim: Simulation, profileId: Id): SocialFollow[] {
  return Object.values(sim.universe.socialFollows)
    .filter((f) => f.profileId === profileId && f.byProfileId)
    .sort((a, b) => b.since - a.since);
}

/**
 * Somebody found you. Which accounts is decided by what you post about, so a
 * cooking post brings cooking accounts, and nobody the same twice.
 */
function gainFollowers(sim: Simulation, profile: SocialProfile, count: number): number {
  if (count < 1) return 0;
  const already = new Set(followersOf(sim, profile.id).map((f) => f.byProfileId));
  const pool = profilesOf(sim, profile.platform)
    .filter((p) => !p.ownerId && !already.has(p.id))
    .sort((a, b) => a.followers - b.followers);
  if (pool.length === 0) return 0;
  const rng = sim.rng('social.gained', profile.id, sim.counter('social.gained'));
  // Only the first handful are people you can look at; the rest of a big
  // number is the crowd, and the count carries that on its own.
  const named = Math.min(count, 6, pool.length);
  for (let n = 0; n < named; n += 1) {
    const near = pool.filter((p) => p.topic === profile.topic);
    const from = (near.length > 0 && rng.float(0, 1) < 0.7 ? near : pool)[
      rng.int(0, Math.max(0, (near.length > 0 && rng.float(0, 1) < 0.7 ? near : pool).length - 1))
    ];
    if (!from || already.has(from.id)) continue;
    already.add(from.id);
    const follow: SocialFollow = {
      id: sim.nextId('follow'),
      saveId: sim.universe.meta.id,
      byProfileId: from.id,
      profileId: profile.id,
      since: sim.now,
    };
    sim.universe.socialFollows[follow.id] = follow;
  }
  profile.followers += count;
  if (named > 0 && sim.universe.socialSettings?.notificationsOn !== false) {
    const first = profilesOf(sim, profile.platform).find((p) => p.id === [...already][already.size - 1]);
    sim.notify({
      category: 'social',
      title: count === 1 ? 'A New Follower' : `${count.toLocaleString('en-US')} New Followers`,
      body: first ? `${first.name} and ${Math.max(0, count - 1)} others.` : 'Somebody found you.',
      importance: 28, route: '/workspace/phone',
    });
  }
  return count;
}

export function followedIds(sim: Simulation, personId: Id, platform?: PlatformId): Set<Id> {
  const out = new Set<Id>();
  for (const follow of followsOf(sim, personId)) {
    if (!platform || profileById(sim, follow.profileId)?.platform === platform) out.add(follow.profileId);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Building the world, without storing it
// ---------------------------------------------------------------------------

const CATALOG_CACHE = new Map<string, SocialItem[]>();

/** The id of the nth thing an account put out. Stable, and readable in a log. */
export function derivedItemId(profile: SocialProfile, index: number): Id {
  return `${profile.id}:${index}`;
}

/** The id of the story an account has up today, if it has one. */
export function derivedStoryId(profile: SocialProfile, day: number): Id {
  return `${profile.id}:story:${day}`;
}

/** Which day of the world a moment falls on, counted from the epoch. */
function dayIndex(sim: Simulation, at: Instant): number {
  const parts = zonedParts(at, sim.homeZone);
  return Math.floor(instantFromZoned({ ...parts, hour: 12, minute: 0 }, sim.homeZone) / MS_DAY);
}

/**
 * One caption or one post, in the voice of its app and inside its app's
 * character limit. A framed post that runs over the limit is not truncated,
 * because a truncated sentence is a bug you can read: the plain one is used.
 */
export function sayIt(app: 'photo' | 'text' | 'clip', topic: SocialTopic, rng: Rng): string {
  if (app === 'photo') {
    return makeSocialText(CAPTION_KITS[topic], rng, CAPTION_FRAME, { extra: { tags: TOPIC_TAGS[topic] } });
  }
  if (app === 'clip') {
    return makeSocialText(CLIP_KITS[topic], rng, CLIP_FRAME, { extra: { tags: CLIP_TAGS[topic] } });
  }
  const framed = makeSocialText(POST_KITS[topic], rng, POST_FRAME, { capitalize: true });
  if (framed.length <= TEXT_LIMIT) return framed;
  return makeSocialText(POST_KITS[topic], rng, undefined, { capitalize: true });
}

/** Topics where a photograph is somewhere, rather than of something. */
const PLACED: ReadonlySet<string> = new Set([
  'photo', 'street', 'travel', 'food', 'design', 'fashion', 'sport', 'music', 'film', 'fitness',
]);

/** How many people saw it, from how many follow it and how good it was. */
function reachFor(followers: number, craft: number, viral: number, rng: Rng): number {
  const base = followers * rng.float(0.18, 0.62) * (0.6 + craft / 140);
  return Math.max(12, Math.round(base * viral));
}

/** One thing an account posted. */
function deriveItem(
  sim: Simulation, profile: SocialProfile, index: number, at: Instant, salt = 0,
): SocialItem {
  const app = appOf(profile.platform);
  const photo = app === 'photo';
  const topic = profile.topic as SocialTopic;
  const rng = sim.rng('social.derive', profile.sourceId ?? profile.id, index, salt);
  const kind: SocialItem['kind'] = app === 'photo'
    ? rng.weighted(
      ['photo', 'carousel', 'reel'] as const,
      (k) => (k === 'photo' ? 0.54 : k === 'carousel' ? 0.19 : 0.27),
    )
    : app === 'clip'
      ? 'clip'
      : rng.weighted(['text', 'quote'] as const, (k) => (k === 'text' ? 0.87 : 0.13));

  // Most posts do about what the account's posts do. A few do far more, and
  // that is the whole shape of a feed: it is not a normal distribution. On the
  // short video app the tail is far longer, because that is the app.
  const lucky = app === 'clip' ? 0.16 : 0.07;
  const viral = rng.float(0, 1) < lucky
    ? rng.float(app === 'clip' ? 4 : 2.4, app === 'clip' ? 60 : 14)
    : rng.float(app === 'clip' ? 0.15 : 0.45, 1.35);
  const reach = reachFor(profile.followers, profile.craft, viral, rng);
  const likeRate = photo ? rng.float(0.03, 0.11) : app === 'clip' ? rng.float(0.05, 0.16) : rng.float(0.012, 0.05);
  const likes = Math.max(1, Math.round(reach * likeRate * (0.7 + profile.craft / 200)));

  const text = sayIt(app, topic, rng);

  const item: SocialItem = {
    id: derivedItemId(profile, index),
    saveId: sim.universe.meta.id,
    platform: profile.platform,
    profileId: profile.id,
    kind,
    text,
    at,
    likes,
    comments: Math.max(0, Math.round(likes * rng.float(0.015, 0.09))),
    reposts: app === 'text' ? Math.max(0, Math.round(likes * rng.float(0.04, 0.28)))
      : app === 'clip' ? Math.max(0, Math.round(likes * rng.float(0.02, 0.12)))
        : 0,
    topic,
  };
  if (app === 'clip') item.sound = pickSound(rng);
  if (photo && PLACED.has(topic) && rng.float(0, 1) < 0.42) item.place = rng.pick([...PLACES]);
  if (kind === 'quote') {
    // A quote points at somebody else's newest post, which is what a quote is.
    const others = TEXT_PROFILES;
    const seed = others[rng.int(0, others.length - 1)];
    const target = seed ? profilesOf(sim, TEXT_PLATFORM).find((p) => p.sourceId === seed.id) : undefined;
    if (target && target.id !== profile.id && target.posts > 0) {
      item.parentId = derivedItemId(target, target.posts - 1);
    } else {
      item.kind = 'text';
    }
  }
  return item;
}

/**
 * An account's recent feed, newest first. Derived, cached on the numbers it
 * was derived from, and never written into a save.
 */
export function catalogOf(sim: Simulation, profile: SocialProfile): SocialItem[] {
  if (profile.ownerId) {
    return Object.values(sim.universe.socialItems)
      .filter((i) => i.profileId === profile.id && i.kind !== 'reply' && i.kind !== 'story' && i.at <= sim.now)
      .sort((a, b) => b.at - a.at);
  }
  const key = `${profile.id}|${profile.posts}|${profile.lastPostAt ?? 0}|${profile.followers}`;
  const cached = CATALOG_CACHE.get(key);
  if (cached) return cached;

  const catalog: SocialItem[] = [];
  const said = new Set<string>();
  let at = profile.lastPostAt ?? profile.createdAt;
  for (let back = 0; back < CATALOG_WINDOW; back += 1) {
    const index = profile.posts - 1 - back;
    if (index < 0 || at < profile.createdAt) break;
    // Nobody posts the same sentence twice in a row down their own grid.
    let item = deriveItem(sim, profile, index, at);
    for (let salt = 1; said.has(item.text) && salt < 120; salt += 1) {
      item = deriveItem(sim, profile, index, at, salt);
    }
    said.add(item.text);
    catalog.push(item);
    const gap = sim.rng('social.gap', profile.sourceId ?? profile.id, index);
    at -= Math.max(1, Math.round(profile.cadenceDays * gap.float(0.6, 1.5))) * MS_DAY;
  }
  if (CATALOG_CACHE.size > 4_000) CATALOG_CACHE.clear();
  CATALOG_CACHE.set(key, catalog);
  return catalog;
}

/** The newest thing an account put out, without deriving the rest of it. */
export function newestOf(sim: Simulation, profile: SocialProfile): SocialItem | undefined {
  if (profile.posts < 1) return undefined;
  if (profile.ownerId) return catalogOf(sim, profile)[0];
  return deriveItem(sim, profile, profile.posts - 1, profile.lastPostAt ?? profile.createdAt);
}

/**
 * The story an account has up right now, where it has one. Accounts that post
 * often put a story up most days; accounts that post rarely do not.
 */
export function storyOf(sim: Simulation, profile: SocialProfile): SocialItem | undefined {
  if (profile.platform !== PHOTO_PLATFORM || profile.ownerId) return undefined;
  const day = dayIndex(sim, sim.now);
  const rng = sim.rng('social.story', profile.sourceId ?? profile.id, day);
  const chance = clamp(0.9 - profile.cadenceDays * 0.11, 0.08, 0.85);
  if (rng.float(0, 1) > chance) return undefined;
  const putUpHour = rng.int(7, 21);
  const parts = zonedParts(sim.now, sim.homeZone);
  const at = instantFromZoned({ ...parts, hour: putUpHour, minute: rng.int(0, 59) }, sim.homeZone);
  if (at > sim.now) return undefined;
  const id = derivedStoryId(profile, day);
  return {
    id,
    saveId: sim.universe.meta.id,
    platform: PHOTO_PLATFORM,
    profileId: profile.id,
    kind: 'story',
    text: makeSocialText(CAPTION_KITS[profile.topic as SocialTopic], rng),
    at,
    likes: 0,
    comments: 0,
    reposts: 0,
    expiresAt: at + STORY_HOURS * MS_HOUR,
    // Some of what people put up is for the few rather than for everybody, and
    // it only reaches you where the two of you are close.
    closeOnly: rng.float(0, 1) < 0.2,
    topic: profile.topic,
    seen: sim.universe.socialItems[id]?.seen,
  };
}

/**
 * One thing by id, whether it is stored or derived.
 *
 * Everything the player made is stored and comes back as it is. Everything the
 * world said is derived, and what is stored under its id is only the thin
 * record of what the player did to it, so that has to be put back on rather
 * than handed over in place of the post.
 */
export function itemById(sim: Simulation, itemId: Id): SocialItem | undefined {
  const stored = sim.universe.socialItems[itemId];
  if (stored?.byPlayer) return stored;
  const parts = itemId.split(':');
  const profileId = parts[0];
  if (!profileId) return stored;
  const profile = sim.universe.socialProfiles[profileId];
  if (!profile) return stored;
  if (parts[1] === 'story') return storyOf(sim, profile) ?? stored;
  const index = Number(parts[1]);
  if (!Number.isFinite(index)) return stored;
  const found = catalogOf(sim, profile).find((i) => i.id === itemId);
  if (found) return withPlayerMarks(sim, found);
  // Older than the window a feed reaches, but still linkable from a quote.
  if (index >= 0 && index < profile.posts) {
    const oldest = catalogOf(sim, profile).at(-1);
    const at = (oldest?.at ?? profile.createdAt) - MS_DAY;
    return withPlayerMarks(sim, deriveItem(sim, profile, index, Math.max(profile.createdAt, at)));
  }
  return stored;
}

/**
 * A derived post carries no state of its own, so what the player did to it is
 * kept as a thin stored record under the same id and put back on here.
 */
function withPlayerMarks(sim: Simulation, item: SocialItem): SocialItem {
  const marks = sim.universe.socialItems[item.id];
  if (!marks) return item;
  return {
    ...item,
    liked: marks.liked,
    saved: marks.saved,
    reposted: marks.reposted,
    seen: marks.seen,
    likes: item.likes + (marks.liked ? 1 : 0),
    reposts: item.reposts + (marks.reposted ? 1 : 0),
  };
}

/** The thin record that carries a like, a save or a repost on a derived post. */
function markRecord(sim: Simulation, item: SocialItem): SocialItem {
  const existing = sim.universe.socialItems[item.id];
  if (existing) return existing;
  const record: SocialItem = {
    id: item.id,
    saveId: sim.universe.meta.id,
    platform: item.platform,
    profileId: item.profileId,
    kind: item.kind,
    text: '',
    at: item.at,
    likes: 0,
    comments: 0,
    reposts: 0,
    topic: item.topic,
  };
  sim.universe.socialItems[record.id] = record;
  return record;
}

/**
 * The world's accounts. Idempotent: a save that already has them is left
 * alone, so opening it twice does not double the internet.
 */
export function ensureProfiles(sim: Simulation): void {
  if (Object.keys(sim.universe.socialProfiles).length > 0) return;
  for (const seed of REAL_PROFILES) {
    const photo = PHOTO_PROFILES.some((p) => p.id === seed.id);
    makeWorldProfile(sim, seed, photo ? PHOTO_PLATFORM : TEXT_PLATFORM);
  }
  for (const seed of CLIP_PROFILES) makeWorldProfile(sim, seed, CLIP_PLATFORM);
}

function makeWorldProfile(sim: Simulation, seed: ProfileSeed, platform: PlatformId): SocialProfile {
  const rng = sim.rng('social.profile', seed.id);
  const createdAt = sim.now - rng.int(500, 3_400) * MS_DAY;
  const lastPostAt = sim.now - rng.int(0, Math.max(1, seed.cadenceDays)) * MS_DAY;
  const profile: SocialProfile = {
    id: sim.nextId('profile'),
    saveId: sim.universe.meta.id,
    platform,
    sourceId: seed.id,
    handle: seed.handle,
    name: seed.name,
    bio: seed.bio,
    topic: seed.topic,
    followers: seed.followers,
    following: Math.round(seed.followers ** 0.42) + rng.int(40, 900),
    verified: seed.followers >= 150_000,
    createdAt,
    cadenceDays: seed.cadenceDays,
    craft: seed.craft,
    lastPostAt,
    posts: Math.max(1, Math.round((lastPostAt - createdAt) / (seed.cadenceDays * MS_DAY))),
  };
  sim.universe.socialProfiles[profile.id] = profile;
  return profile;
}

// ---------------------------------------------------------------------------
// The feeds
// ---------------------------------------------------------------------------

/** What the player has shown they like, read off what they follow and liked. */
export function tasteOf(sim: Simulation, personId: Id, platform: PlatformId): Map<string, number> {
  const taste = new Map<string, number>();
  const add = (topic: string, weight: number) => taste.set(topic, (taste.get(topic) ?? 0) + weight);
  for (const follow of followsOf(sim, personId)) {
    const profile = profileById(sim, follow.profileId);
    if (profile?.platform === platform) add(profile.topic, 3);
  }
  for (const mark of Object.values(sim.universe.socialItems)) {
    if (mark.platform !== platform || !mark.liked) continue;
    add(mark.topic, 1);
  }
  return taste;
}

/** Everything the app could put on a feed right now, without deriving years. */
export function recentItems(sim: Simulation, platform: PlatformId, perProfile = 4): SocialItem[] {
  const out: SocialItem[] = [];
  const settings = settingsOf(sim);
  for (const profile of profilesOf(sim, platform)) {
    // Muted and blocked accounts are simply not there. That is the whole point
    // of both, and a setting that only grays something out is not the setting.
    if (settings.mutedProfileIds.includes(profile.id)) continue;
    if (settings.blockedProfileIds.includes(profile.id)) continue;
    let taken = 0;
      for (const item of catalogOf(sim, profile)) {
      if (item.at > sim.now) continue;
      if (isHidden(sim, item.text)) continue;
      out.push(profile.ownerId ? item : withPlayerMarks(sim, item));
      taken += 1;
      if (taken >= perProfile) break;
    }
  }
  return out;
}

/**
 * The feed. What you follow first and in time order, the way both apps once
 * worked and neither does now, then suggestions ranked on what you have shown
 * you like, which is the way both work today.
 */
export function homeFeed(sim: Simulation, platform: PlatformId, limit = FEED_SIZE): SocialItem[] {
  const personId = sim.player.id;
  const following = followedIds(sim, personId, platform);
  const mine = myProfile(sim, platform);
  const taste = tasteOf(sim, personId, platform);
  const all = recentItems(sim, platform, following.size > 0 ? 4 : 2);

  const followed = all
    .filter((i) => following.has(i.profileId) || i.profileId === mine?.id)
    .sort((a, b) => b.at - a.at);

  const suggested = all
    .filter((i) => !following.has(i.profileId) && i.profileId !== mine?.id)
    .map((item) => {
      const age = Math.max(1, (sim.now - item.at) / MS_DAY);
      const liked = (taste.get(item.topic) ?? 0) * 60;
      return { item, score: (item.likes / age) + liked };
    })
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);

  // Never two in a row from the same account, which is the one thing every
  // one of these feeds does and a naive sort never does.
  return spread([...followed, ...suggested]).slice(0, limit);
}

/** Only the accounts you follow, in the order they posted. */
export function followingFeed(sim: Simulation, platform: PlatformId, limit = FEED_SIZE): SocialItem[] {
  const following = followedIds(sim, sim.player.id, platform);
  const mine = myProfile(sim, platform);
  return recentItems(sim, platform, 6)
    .filter((i) => following.has(i.profileId) || i.profileId === mine?.id)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}

/** The grid of people you do not follow, which is where an app goes to grow. */
export function exploreFeed(sim: Simulation, platform: PlatformId, limit = 30): SocialItem[] {
  const following = followedIds(sim, sim.player.id, platform);
  const mine = myProfile(sim, platform);
  const taste = tasteOf(sim, sim.player.id, platform);
  return recentItems(sim, platform, 3)
    .filter((i) => !following.has(i.profileId) && i.profileId !== mine?.id)
    .map((item) => ({ item, score: item.likes * (1 + (taste.get(item.topic) ?? 0) * 0.25) }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item)
    .slice(0, limit);
}

function spread(items: SocialItem[]): SocialItem[] {
  const out: SocialItem[] = [];
  const held: SocialItem[] = [];
  for (const item of items) {
    if (out.length > 0 && out[out.length - 1]!.profileId === item.profileId) held.push(item);
    else out.push(item);
  }
  for (const item of held) {
    const at = out.findIndex((o, i) => o.profileId !== item.profileId && out[i + 1]?.profileId !== item.profileId);
    if (at >= 0) out.splice(at + 1, 0, item);
    else out.push(item);
  }
  return out;
}

/** The stories along the top: yours first, then everybody you follow. */
export function storiesFor(sim: Simulation, personId: Id): SocialItem[] {
  const out: SocialItem[] = [];
  const mine = myProfile(sim, PHOTO_PLATFORM);
  if (mine) {
    const own = Object.values(sim.universe.socialItems)
      .filter((i) => i.profileId === mine.id && i.kind === 'story' && (i.expiresAt ?? 0) > sim.now)
      .sort((a, b) => a.at - b.at);
    out.push(...own);
  }
  for (const id of followedIds(sim, personId, PHOTO_PLATFORM)) {
    const profile = profileById(sim, id);
    if (!profile) continue;
    const story = storyOf(sim, profile);
    if (story) out.push(story);
  }
  // A close friends story is only ever on the tray of a close friend.
  for (let i = out.length - 1; i >= 0; i -= 1) {
    const story = out[i]!;
    if (!story.closeOnly || story.byPlayer) continue;
    const follow = followsOf(sim, personId).find((f) => f.profileId === story.profileId);
    if (!follow?.close) out.splice(i, 1);
  }
  // Unseen first, because that is the order a story tray is in.
  return out.sort((a, b) => Number(a.seen ?? false) - Number(b.seen ?? false) || b.at - a.at);
}

/** What the text app says is happening, counted off what is being posted. */
export interface Trend { topic: SocialTopic; label: string; posts: number; }

export function trends(sim: Simulation, limit = 8): Trend[] {
  const counts = new Map<SocialTopic, number>();
  for (const item of recentItems(sim, TEXT_PLATFORM, 3)) {
    if (item.at < sim.now - 2 * MS_DAY) continue;
    const topic = item.topic as SocialTopic;
    counts.set(topic, (counts.get(topic) ?? 0) + Math.max(1, Math.round(item.likes / 40)));
  }
  return [...counts.entries()]
    .map(([topic, posts]) => ({ topic, label: SOCIAL_TOPIC_LABEL[topic], posts }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, limit);
}

/**
 * The room under a post. Under somebody else's it is derived, warm on the
 * photo app and an argument on the text app; under your own it is stored,
 * because there what was said to you matters. Anything you said is stored
 * either way and merged in.
 */
export function repliesTo(sim: Simulation, itemId: Id): SocialItem[] {
  const stored = Object.values(sim.universe.socialItems)
    .filter((i) => i.parentId === itemId && i.kind === 'reply');
  const item = itemById(sim, itemId);
  if (!item) return stored.sort((a, b) => a.at - b.at);
  const profile = profileById(sim, item.profileId);
  const mine = profile?.ownerId === sim.player.id;
  const hasWorld = stored.some((r) => !r.byPlayer);
  const derived = mine || hasWorld ? [] : deriveReplies(sim, item);
  return [...derived, ...stored]
    .filter((reply) => reply.byPlayer || (!isHidden(sim, reply.text) && !isBlocked(sim, reply.profileId)))
    .sort((a, b) => b.likes - a.likes || a.at - b.at);
}

function deriveReplies(sim: Simulation, item: SocialItem): SocialItem[] {
  const app = appOf(item.platform);
  const photo = app === 'photo';
  const topic = item.topic as SocialTopic;
  // Under a photograph people talk about the thing photographed; under a clip
  // they talk faster and louder; under a post they argue.
  const lines = photo
    ? [...PHOTO_COMMENTS, ...(TOPIC_COMMENTS[topic] ?? [])]
    : app === 'clip' ? CLIP_COMMENTS : REPLY_LINES;
  const count = Math.min(REPLIES_PER_ITEM, Math.max(0, Math.round(Math.log10(Math.max(10, item.comments)) * 2.4)));
  const out: SocialItem[] = [];
  const said = new Set<string>();
  // Whoever replies is usually somebody in the same room, not a stranger from
  // another corner of the app.
  const everyone = profilesOf(sim, item.platform).filter((p) => !p.ownerId);
  const near = everyone.filter((p) => p.topic === item.topic);
  for (let n = 0; n < count; n += 1) {
    const rng = sim.rng('social.reply', item.id, n);
    let text = rng.pick([...lines]);
    for (let salt = 0; said.has(text) && salt < 30; salt += 1) text = rng.pick([...lines]);
    said.add(text);
    const pool = near.length >= 3 && rng.float(0, 1) < 0.65 ? near : everyone;
    const who = pool[rng.int(0, Math.max(0, pool.length - 1))];
    if (!who) break;
    out.push({
      id: `${item.id}:r${n}`,
      saveId: sim.universe.meta.id,
      platform: item.platform,
      profileId: who.id,
      kind: 'reply',
      text,
      at: item.at + rng.int(2, 900) * MS_MINUTE,
      likes: Math.max(0, Math.round(item.likes * rng.float(0.001, 0.03))),
      comments: 0,
      reposts: 0,
      parentId: item.id,
      topic: item.topic,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/**
 * A message thread.
 *
 * Nobody messages you out of nowhere, so the inbox starts empty and fills up
 * with whoever you have actually written to. What comes back depends on who
 * they are: an account with two million followers is not going to write back
 * to a stranger, and a small one usually will.
 */
export interface Thread {
  profile: SocialProfile;
  last: SocialItem;
  unread: number;
  /** True where you wrote first and they have not answered, which is a request. */
  waiting: boolean;
}

export function messagesWith(sim: Simulation, profileId: Id): SocialItem[] {
  return Object.values(sim.universe.socialItems)
    .filter((i) => i.kind === 'message' && (i.withProfileId === profileId || i.profileId === profileId))
    .sort((a, b) => a.at - b.at);
}

export function threadsOf(sim: Simulation): Thread[] {
  const byProfile = new Map<Id, SocialItem[]>();
  for (const item of Object.values(sim.universe.socialItems)) {
    if (item.kind !== 'message') continue;
    const other = item.byPlayer ? item.withProfileId : item.profileId;
    if (!other) continue;
    const list = byProfile.get(other) ?? [];
    list.push(item);
    byProfile.set(other, list);
  }
  const out: Thread[] = [];
  for (const [profileId, list] of byProfile) {
    const profile = profileById(sim, profileId);
    if (!profile) continue;
    list.sort((a, b) => a.at - b.at);
    const last = list[list.length - 1]!;
    out.push({
      profile,
      last,
      unread: list.filter((i) => !i.byPlayer && i.seen !== true).length,
      waiting: list.every((i) => i.byPlayer),
    });
  }
  return out.sort((a, b) => b.last.at - a.last.at);
}

/** How likely somebody is to write back, which is mostly how big they are. */
function willReply(profile: SocialProfile, following: boolean): number {
  const size = clamp(1 - Math.log10(Math.max(10, profile.followers)) / 7, 0.02, 0.9);
  return clamp(size * (following ? 1.6 : 0.5), 0.01, 0.85);
}

/** The line above somebody's picture, which is gone after a day. */
export function noteOf(sim: Simulation, profile: SocialProfile): string | undefined {
  if (!profile.note || !profile.noteAt) return undefined;
  return profile.noteAt + MS_DAY > sim.now ? profile.note : undefined;
}

/** The folders the player has filed saved posts into. */
export function collectionsOf(sim: Simulation): { name: string; items: SocialItem[] }[] {
  const byName = new Map<string, SocialItem[]>();
  for (const mark of Object.values(sim.universe.socialItems)) {
    if (!mark.saved) continue;
    const item = itemById(sim, mark.id);
    if (!item) continue;
    const name = mark.collection ?? 'All Posts';
    const list = byName.get(name) ?? [];
    list.push(item);
    byName.set(name, list);
  }
  return [...byName.entries()]
    .map(([name, items]) => ({ name, items: items.sort((a, b) => b.at - a.at) }))
    .sort((a, b) => (a.name === 'All Posts' ? -1 : b.name === 'All Posts' ? 1 : a.name.localeCompare(b.name)));
}

// ---------------------------------------------------------------------------
// The rooms on the text app
// ---------------------------------------------------------------------------

/**
 * Communities, Lists and Spaces.
 *
 * The communities are the world's, one per subject, and they exist whether or
 * not you join. The lists are yours and start empty. A space is a room that
 * runs for an hour and is then over, which is the only honest way to model a
 * thing that is live.
 */
export function roomsOf(sim: Simulation, kind: SocialRoom['kind']): SocialRoom[] {
  return Object.values(sim.universe.socialRooms)
    .filter((room) => room.kind === kind)
    .sort((a, b) => b.members - a.members);
}

export function roomById(sim: Simulation, roomId: Id): SocialRoom | undefined {
  return sim.universe.socialRooms[roomId];
}

export function ensureRooms(sim: Simulation): void {
  if (roomsOf(sim, 'community').length > 0) return;
  for (const topic of SOCIAL_TOPICS) {
    const people = profilesOf(sim, TEXT_PLATFORM).filter((p) => !p.ownerId && p.topic === topic);
    if (people.length === 0) continue;
    const rng = sim.rng('social.room', topic);
    const room: SocialRoom = {
      id: sim.nextId('sroom'),
      saveId: sim.universe.meta.id,
      platform: TEXT_PLATFORM,
      kind: 'community',
      name: `${SOCIAL_TOPIC_LABEL[topic]} Community`,
      topic,
      profileIds: people.map((p) => p.id),
      members: people.reduce((sum, p) => sum + Math.round(p.followers * 0.01), 0) + rng.int(400, 9_000),
      createdAt: sim.now - rng.int(300, 2_000) * MS_DAY,
    };
    sim.universe.socialRooms[room.id] = room;
  }
}

/** Search, which on both apps looks at accounts and at what they said. */
export function searchSocial(
  sim: Simulation, platform: PlatformId, query: string,
): { profiles: SocialProfile[]; items: SocialItem[] } {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return { profiles: [], items: [] };
  const profiles = profilesOf(sim, platform)
    .filter((p) => !isBlocked(sim, p.id))
    .filter((p) => `${p.name} ${p.handle} ${p.bio}`.toLowerCase().includes(needle))
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 20);
  const items = recentItems(sim, platform, 4)
    .filter((i) => i.text.toLowerCase().includes(needle))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 30);
  return { profiles, items };
}

// ---------------------------------------------------------------------------
// Your own account
// ---------------------------------------------------------------------------

export interface SocialAnalytics {
  platform: PlatformId;
  followers: number;
  posts: number;
  likes: number;
  comments: number;
  reposts: number;
  impressions: number;
  /** Followers gained over the last thirty days. */
  growth: number;
  best?: SocialItem;
  worst?: SocialItem;
  /** Whether the app will pay this account anything at all yet. */
  monetized: boolean;
}

export function socialAnalytics(sim: Simulation, profileId: Id): SocialAnalytics {
  const profile = profileById(sim, profileId);
  const items = profile ? catalogOf(sim, profile) : [];
  const likes = items.reduce((sum, i) => sum + i.likes, 0);
  const comments = items.reduce((sum, i) => sum + i.comments, 0);
  const reposts = items.reduce((sum, i) => sum + i.reposts, 0);
  const impressions = items.reduce((sum, i) => sum + impressionsOf(i), 0);
  const sorted = [...items].sort((a, b) => b.likes - a.likes);
  const recent = items.filter((i) => i.at >= sim.now - 30 * MS_DAY);
  const growth = recent.reduce((sum, i) => sum + Math.round(i.likes * 0.04 + i.comments * 0.6), 0);
  return {
    platform: profile?.platform ?? PHOTO_PLATFORM,
    followers: profile?.followers ?? 0,
    posts: profile?.posts ?? 0,
    likes,
    comments,
    reposts,
    impressions,
    growth,
    best: sorted[0],
    worst: sorted.at(-1),
    monetized: isMonetized(sim, profile),
  };
}

/** What a post was put in front of, which is what the text app pays on. */
export function impressionsOf(item: SocialItem): number {
  const engagement = item.likes + item.comments * 3 + item.reposts * 6;
  return Math.round(engagement * 26 + 40);
}

/** X Premium, which is a subscription the player pays for and a badge. */
export function hasXPremium(sim: Simulation): boolean {
  const profile = myProfile(sim, TEXT_PLATFORM);
  return profile?.verified === true;
}

function isMonetized(sim: Simulation, profile: SocialProfile | undefined): boolean {
  if (!profile || profile.ownerId !== sim.player.id) return false;
  if (profile.platform === TEXT_PLATFORM) return profile.verified && profile.followers >= X_PAYOUT_FLOOR;
  if (profile.platform === CLIP_PLATFORM) return profile.followers >= CLIP_FLOOR;
  return profile.followers >= 1_000;
}

/** How many people pay to subscribe to the player's photo account. */
export function photoSubscribers(sim: Simulation): number {
  const profile = myProfile(sim, PHOTO_PLATFORM);
  if (!profile || !isMonetized(sim, profile)) return 0;
  const rng = sim.rng('social.subs', profile.id, Math.floor(sim.now / (30 * MS_DAY)));
  return Math.round(profile.followers * rng.float(0.0008, 0.006));
}

function monthStart(sim: Simulation, at: Instant): Instant {
  const parts = zonedParts(at, sim.homeZone);
  return instantFromZoned({ ...parts, day: 1, hour: 0, minute: 0 }, sim.homeZone);
}

function accountFor(sim: Simulation, platform: PlatformId): Id | undefined {
  return Object.values(sim.universe.socialAccounts)
    .find((a) => a.ownerId === sim.player.id && a.platform === platform)?.id;
}

/**
 * A month on one of the two apps.
 *
 * X pays a share of the advertising sold against the impressions a Premium
 * account earned; nothing else. Instagram pays nothing for reach at all, and
 * everything it does pay comes from the audience directly or from a brand, so
 * that is what is counted here.
 */
export function buildSocialPayout(sim: Simulation, platform: PlatformId, month: Instant): CreatorPayout {
  const accountId = accountFor(sim, platform) ?? '';
  const profile = myProfile(sim, platform);
  const from = month;
  const to = addDays(month, 31, sim.homeZone);

  let impressions = 0;
  for (const item of profile ? catalogOf(sim, profile) : []) {
    if (item.at < from || item.at > to) continue;
    impressions += impressionsOf(item);
  }

  const paying = isMonetized(sim, profile);
  const ads = paying && platform === TEXT_PLATFORM
    ? Math.round((impressions / 1000) * TEXT_CPM * TEXT_SHARE)
    : paying && platform === CLIP_PLATFORM
      // The short video app pays on qualified views only, which is the slice
      // that stayed past a minute rather than the slice that scrolled by.
      ? Math.round(((impressions * CLIP_QUALIFIED) / 1000) * CLIP_RPM)
      : 0;

  const subscribers = paying && platform === PHOTO_PLATFORM ? photoSubscribers(sim) : 0;
  const memberships = Math.round(subscribers * PHOTO_SUB_MONTHLY * PHOTO_SUB_SHARE);

  let tips = 0;
  if (paying && platform === PHOTO_PLATFORM) {
    const rng = sim.rng('social.gifts', profile?.id ?? '', month);
    const reels = (profile ? catalogOf(sim, profile) : []).filter((i) => i.kind === 'reel' && i.at >= from && i.at <= to);
    for (const reel of reels) {
      const senders = Math.round(reel.likes * rng.float(0, 0.004));
      tips += Math.round(senders * GIFT_STEPS[rng.int(0, GIFT_STEPS.length - 1)]! * GIFT_SHARE);
    }
  }

  let sponsorship = 0;
  for (const deal of Object.values(sim.universe.brandDeals)) {
    if (deal.personId !== sim.player.id) continue;
    if (deal.platform !== platform) continue;
    if (deal.status !== 'completed' && deal.status !== 'delivered') continue;
    if (deal.endsAt < from || deal.endsAt > to) continue;
    sponsorship += deal.compensation;
  }

  return {
    id: sim.nextId('payout'),
    saveId: sim.universe.meta.id,
    accountId,
    month,
    ads,
    premium: 0,
    memberships,
    tips,
    sponsorship,
    total: ads + memberships + tips + sponsorship,
    monetizedViews: impressions,
  };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const KINDS_BY_PLATFORM: Readonly<Record<string, readonly SocialItem['kind'][]>> = {
  [PHOTO_PLATFORM]: ['photo', 'carousel', 'reel'],
  [TEXT_PLATFORM]: ['text'],
  [CLIP_PLATFORM]: ['clip'],
};

/**
 * What somebody writes back in a message. Short, because a reply from a
 * stranger on the internet is short.
 */
const DM_REPLIES: readonly string[] = [
  'Thank you, that is kind of you to say.',
  'Appreciate it.',
  'Ha, thank you.',
  'Sorry, only just seen this.',
  'Yes, go for it.',
  'Send it over and I will have a look.',
  'That one took a while, so thank you.',
  'Not sure I am the right person to ask but I will try.',
  'Any time.',
  'Thanks for the kind words, genuinely.',
  'Working on more of those now.',
  'Message me nearer the time.',
  'Where did you see it?',
  'That is a good question and I do not have an answer.',
  'Will do, thanks for asking.',
  'Yes, that was the one.',
];

/** How long a thing takes to make before it is worth putting up. */
const EFFORT_MINUTES: Readonly<Record<string, number>> = {
  photo: 25, carousel: 45, reel: 90, story: 6, text: 4, reply: 2, repost: 1, quote: 3,
  clip: 70, message: 2, live: 45,
};

/** What the player's own post is worth, from craft and the time put in. */
function playerReach(sim: Simulation, profile: SocialProfile, effortMinutes: number, kind: SocialItem['kind']): number {
  const rng = sim.rng('social.mine', profile.id, sim.counter('social.mine'));
  const put = clamp(effortMinutes / Math.max(1, EFFORT_MINUTES[kind] ?? 20), 0.3, 2.4);
  const viral = rng.float(0, 1) < 0.05 ? rng.float(2, 9) : rng.float(0.4, 1.4);
  return reachFor(Math.max(60, profile.followers), profile.craft, viral * put, rng);
}

export function registerSocialApps(sim: Simulation): void {
  // --- The world keeps posting while you are not looking ---------------------

  sim.onSchedule('feed.world_tick', () => {
    for (const profile of profilesOf(sim)) {
      if (profile.ownerId) continue;
      const due = (profile.lastPostAt ?? profile.createdAt) + profile.cadenceDays * MS_DAY;
      if (due > sim.now) continue;
      profile.posts += 1;
      profile.lastPostAt = sim.now;
      const item = newestOf(sim, profile);
      if (!item) continue;
      // An account grows or shrinks a little with each thing it puts out.
      const swing = (item.likes / Math.max(1, profile.followers)) - 0.035;
      profile.followers = Math.max(90, Math.round(profile.followers * (1 + clamp(swing, -0.01, 0.02))));
      if (isFollowing(sim, sim.player.id, profile.id)) {
        const follow = followsOf(sim, sim.player.id).find((f) => f.profileId === profile.id);
        if (follow?.close) {
          addNotice(sim, {
            kind: 'upload',
            text: `${profile.name} posted`,
          });
        }
      }
    }
    // Somebody finds you between posts, too, in proportion to what is already
    // up rather than out of nowhere.
    for (const platform of [PHOTO_PLATFORM, TEXT_PLATFORM, CLIP_PLATFORM]) {
      const mine = myProfile(sim, platform);
      if (!mine || mine.posts < 1) continue;
      const rng = sim.rng('social.drift', mine.id, Math.floor(sim.now / MS_DAY));
      const drift = Math.round(mine.followers * rng.float(0, 0.004));
      if (drift > 0) gainFollowers(sim, mine, drift);
    }

    // A story is only up for a day, and the ones that are over are cleared.
    for (const item of Object.values(sim.universe.socialItems)) {
      if (item.kind === 'story' && (item.expiresAt ?? 0) <= sim.now) delete sim.universe.socialItems[item.id];
    }
    sim.schedule({
      at: addDays(sim.now, 1, sim.homeZone), kind: 'feed.world_tick',
      label: 'New Posts', category: 'system', priority: 93,
    });
  });

  sim.onSchedule('feed.publish', (item) => {
    const post = sim.universe.socialItems[item.payload.itemId as Id];
    if (!post || post.text === '' ) return;
    if (post.at > sim.now) post.at = sim.now;
    const profile = sim.universe.socialProfiles[post.profileId];
    if (profile) {
      profile.posts += 1;
      profile.lastPostAt = sim.now;
    }
    sim.emit('feed.published', { itemId: post.id, platform: post.platform });
  });

  sim.onSchedule('feed.payout_month', () => {
    for (const platform of [PHOTO_PLATFORM, TEXT_PLATFORM, CLIP_PLATFORM]) {
      const profile = myProfile(sim, platform);
      const accountId = accountFor(sim, platform);
      if (!profile || !accountId) continue;
      const month = monthStart(sim, sim.now - 15 * MS_DAY);
      const already = Object.values(sim.universe.creatorPayouts)
        .some((p) => p.accountId === accountId && p.month === month);
      if (already) continue;
      const payout = buildSocialPayout(sim, platform, month);
      sim.universe.creatorPayouts[payout.id] = payout;
      // Sponsorship was paid on its own terms; only what the app itself owes
      // is settled here, so a brand deal is never paid twice.
      const owed = payout.ads + payout.memberships + payout.tips;
      const bank = sim.player.primaryAccountId;
      if (bank && owed > 0) {
        const from = platform === TEXT_PLATFORM ? 'X — Ads Share'
          : platform === CLIP_PLATFORM ? 'TikTok — Creator Rewards'
            : 'Instagram — Subscriptions';
        sim.income(bank, owed, from, 'creator');
        payout.paidAt = sim.now;
        sim.notify({
          category: 'social',
          title: 'The App Paid Out',
          body: `${formatMoney(owed)} from ${platform === TEXT_PLATFORM ? 'the advertising share'
            : platform === CLIP_PLATFORM ? 'qualified views' : 'subscriptions and gifts'}.`,
          importance: 52, route: '/workspace/phone',
        });
      }
    }
    sim.schedule({
      at: addDays(sim.now, 30, sim.homeZone), kind: 'feed.payout_month',
      label: 'App Payout', category: 'system', priority: 85,
    });
  });

  sim.onSchedule('feed.premium_renew', () => {
    const profile = myProfile(sim, TEXT_PLATFORM);
    if (!profile?.verified) return;
    const accountId = sim.player.primaryAccountId;
    if (accountId && sim.ledger.availableFunds(accountId) >= X_PREMIUM_MONTHLY) {
      sim.expense(accountId, X_PREMIUM_MONTHLY, 'X Premium', 'subscriptions');
      sim.schedule({
        at: addDays(sim.now, 30, sim.homeZone), kind: 'feed.premium_renew',
        label: 'X Premium', category: 'system', priority: 80,
      });
    } else {
      profile.verified = false;
      sim.notify({
        category: 'social', title: 'Premium Lapsed',
        body: 'The subscription could not be taken, so the badge and the ads share are gone.',
        importance: 48, route: '/workspace/phone',
      });
    }
  });

  // --- Making an account -----------------------------------------------------

  sim.onCommand<{ platform: PlatformId; handle?: string; name?: string; bio?: string }, { profileId: Id }>(
    'feed.create_profile',
    (p, { sim: s }) => {
      if (![PHOTO_PLATFORM, TEXT_PLATFORM, CLIP_PLATFORM].includes(p.platform)) {
        throw new CommandError('That is not one of the apps.');
      }
      if (myProfile(s, p.platform)) throw new CommandError('You already have an account there.');
      const name = (p.name ?? s.player.displayName).trim();
      if (name.length < 2) throw new CommandError('An account needs a name.');
      const handle = (p.handle ?? name).toLowerCase().replace(/[^a-z0-9._]/g, '');
      if (handle.length < 2) throw new CommandError('That handle will not do.');
      if (profileByHandle(s, p.platform, handle)) throw new CommandError('That handle is taken.');

      // The money side of a post lives on the account, so making the profile
      // makes the account, rather than leaving somebody posting into a void.
      let accountId = accountFor(s, p.platform);
      if (!accountId) {
        const opened = s.execute<{ accountId: Id }>({
          kind: 'social.create_account',
          payload: { platform: p.platform, handle, displayName: name, bio: p.bio ?? '' },
        });
        if (opened.ok) accountId = opened.value!.accountId;
      }
      const profile: SocialProfile = {
        id: s.nextId('profile'),
        saveId: s.universe.meta.id,
        platform: p.platform,
        handle,
        name,
        bio: p.bio ?? '',
        topic: 'photo',
        followers: 0,
        following: followsOf(s, s.player.id).length,
        verified: false,
        createdAt: s.now,
        cadenceDays: 3,
        craft: 40,
        ownerId: s.player.id,
        accountId,
        posts: 0,
      };
      s.universe.socialProfiles[profile.id] = profile;
      s.emit('feed.profile_created', { profileId: profile.id, platform: p.platform, handle });
      return { profileId: profile.id };
    },
  );

  sim.onCommand<{ profileId?: Id; name?: string; bio?: string; image?: string }, { profileId: Id }>(
    'feed.edit_profile',
    (p, { sim: s }) => {
      const profile = p.profileId ? profileById(s, p.profileId) : undefined;
      if (!profile || profile.ownerId !== s.player.id) throw new CommandError('That is not your account.');
      if (p.name !== undefined) {
        const name = p.name.trim();
        if (name.length < 2) throw new CommandError('An account needs a name.');
        profile.name = name;
      }
      if (p.bio !== undefined) profile.bio = p.bio.slice(0, 160);
      if (p.image !== undefined) profile.avatarImage = p.image || undefined;
      return { profileId: profile.id };
    },
  );

  // --- Following -------------------------------------------------------------

  sim.onCommand<{ profileId: Id }, { following: boolean }>(
    'feed.follow',
    (p, { sim: s }) => {
      const profile = profileById(s, p.profileId);
      if (!profile) throw new CommandError('No such account.');
      if (profile.ownerId === s.player.id) throw new CommandError('You cannot follow yourself.');
      if (isFollowing(s, s.player.id, profile.id)) return { following: true };
      const follow: SocialFollow = {
        id: s.nextId('follow'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        profileId: profile.id,
        since: s.now,
      };
      s.universe.socialFollows[follow.id] = follow;
      profile.followers += 1;
      const mine = myProfile(s, profile.platform);
      if (mine) mine.following += 1;
      s.emit('feed.followed', { profileId: profile.id, handle: profile.handle });
      return { following: true };
    },
  );

  sim.onCommand<{ profileId: Id }, { following: boolean }>(
    'feed.unfollow',
    (p, { sim: s }) => {
      const follow = followsOf(s, s.player.id).find((f) => f.profileId === p.profileId);
      if (!follow) throw new CommandError('You do not follow that account.');
      delete s.universe.socialFollows[follow.id];
      const profile = profileById(s, p.profileId);
      if (profile) profile.followers = Math.max(0, profile.followers - 1);
      const mine = profile ? myProfile(s, profile.platform) : undefined;
      if (mine) mine.following = Math.max(0, mine.following - 1);
      s.emit('feed.unfollowed', { profileId: p.profileId });
      return { following: false };
    },
  );

  /** Close friends, which is the list a story can be limited to. */
  sim.onCommand<{ profileId: Id; close: boolean }, { close: boolean }>(
    'feed.close_friend',
    (p, { sim: s }) => {
      const follow = followsOf(s, s.player.id).find((f) => f.profileId === p.profileId);
      if (!follow) throw new CommandError('You do not follow that account.');
      follow.close = p.close;
      return { close: p.close };
    },
  );

  // --- What you do to a post -------------------------------------------------

  sim.onCommand<{ itemId: Id }, { liked: boolean; likes: number }>(
    'feed.like',
    (p, { sim: s }) => {
      const item = itemById(s, p.itemId);
      if (!item) throw new CommandError('That post is not there.');
      const record = markRecord(s, item);
      record.liked = !record.liked;
      const stored = s.universe.socialItems[p.itemId];
      const base = stored && stored.text !== '' ? stored.likes : item.likes - (item.liked ? 1 : 0);
      if (stored && stored.text !== '') stored.likes = Math.max(0, stored.likes + (record.liked ? 1 : -1));
      s.emit('feed.liked', { itemId: item.id, liked: record.liked });
      return { liked: record.liked === true, likes: base + (record.liked ? 1 : 0) };
    },
  );

  sim.onCommand<{ itemId: Id; collection?: string }, { saved: boolean; collection?: string }>(
    'feed.bookmark',
    (p, { sim: s }) => {
      const item = itemById(s, p.itemId);
      if (!item) throw new CommandError('That post is not there.');
      const record = markRecord(s, item);
      // Naming a folder files it there rather than toggling it off.
      const folder = p.collection?.trim();
      if (folder) {
        record.saved = true;
        record.collection = folder.slice(0, 40);
      } else {
        record.saved = !record.saved;
        if (!record.saved) record.collection = undefined;
      }
      return { saved: record.saved === true, collection: record.collection };
    },
  );

  sim.onCommand<{ itemId: Id }, { reposted: boolean }>(
    'feed.repost',
    (p, { sim: s }) => {
      const item = itemById(s, p.itemId);
      if (!item) throw new CommandError('That post is not there.');
      if (item.platform !== TEXT_PLATFORM) throw new CommandError('That app does not do reposts.');
      const record = markRecord(s, item);
      record.reposted = !record.reposted;
      s.emit('feed.reposted', { itemId: item.id, reposted: record.reposted });
      return { reposted: record.reposted === true };
    },
  );

  sim.onCommand<{ itemId: Id; text: string }, { itemId: Id }>(
    'feed.quote',
    (p, { sim: s }) => {
      const parent = itemById(s, p.itemId);
      if (!parent) throw new CommandError('That post is not there.');
      if (parent.platform !== TEXT_PLATFORM) throw new CommandError('That app does not do quotes.');
      const profile = myProfile(s, TEXT_PLATFORM);
      if (!profile) throw new CommandError('You have no account there yet.');
      const text = p.text.trim();
      if (text.length < 1) throw new CommandError('Say something with it.');
      const quote = putUp(s, profile, 'quote', text, { parentId: parent.id, effortMinutes: EFFORT_MINUTES.quote });
      return { itemId: quote.id };
    },
  );

  sim.onCommand<{ itemId: Id; text: string }, { itemId: Id }>(
    'feed.reply',
    (p, { sim: s }) => {
      const parent = itemById(s, p.itemId);
      if (!parent) throw new CommandError('That post is not there.');
      const profile = myProfile(s, parent.platform);
      if (!profile) throw new CommandError('You have no account there yet.');
      const text = p.text.trim();
      if (text.length < 1) throw new CommandError('Write something first.');
      if (text.length > 500) throw new CommandError('That is longer than the app allows.');
      const reply: SocialItem = {
        id: s.nextId('sitem'),
        saveId: s.universe.meta.id,
        platform: parent.platform,
        profileId: profile.id,
        kind: 'reply',
        text,
        at: s.now,
        likes: 0,
        comments: 0,
        reposts: 0,
        parentId: parent.id,
        topic: parent.topic,
        byPlayer: true,
      };
      s.universe.socialItems[reply.id] = reply;
      s.advanceTo(s.now + EFFORT_MINUTES.reply! * MS_MINUTE);
      const stored = s.universe.socialItems[parent.id];
      if (stored && stored.text !== '') stored.comments += 1;
      s.emit('feed.replied', { itemId: reply.id, parentId: parent.id });
      return { itemId: reply.id };
    },
  );

  sim.onCommand<{ itemId: Id }, { seen: boolean }>(
    'feed.view_story',
    (p, { sim: s }) => {
      const story = itemById(s, p.itemId);
      if (!story || story.kind !== 'story') throw new CommandError('That story is gone.');
      const stored = s.universe.socialItems[p.itemId];
      if (stored) stored.seen = true;
      else {
        const record = markRecord(s, story);
        record.kind = 'story';
        record.seen = true;
        record.expiresAt = story.expiresAt;
      }
      s.advanceTo(s.now + MS_MINUTE);
      return { seen: true };
    },
  );

  // --- Posting ---------------------------------------------------------------

  sim.onCommand<
    {
      platform: PlatformId; kind?: SocialItem['kind']; text: string; images?: string[];
      place?: string; publishAt?: number; effortMinutes?: number;
    },
    { itemId: Id; at: Instant; scheduled: boolean }
  >(
    'feed.post',
    (p, { sim: s }) => {
      const profile = myProfile(s, p.platform);
      if (!profile) throw new CommandError('You have no account there yet.');
      const allowed = KINDS_BY_PLATFORM[p.platform] ?? [];
      const kind = p.kind ?? allowed[0]!;
      if (!allowed.includes(kind)) throw new CommandError('That app does not post that.');
      const text = p.text.trim();
      const limit = p.platform === TEXT_PLATFORM ? TEXT_LIMIT : CAPTION_LIMIT;
      if (p.platform !== PHOTO_PLATFORM && text.length < 1) throw new CommandError('Write something first.');
      if (text.length > limit) throw new CommandError(`That is over the ${limit} character limit.`);
      const images = (p.images ?? []).slice(0, kind === 'carousel' ? 10 : 1);
      if (p.platform === PHOTO_PLATFORM && images.length < 1) throw new CommandError('A post there needs a picture.');

      const effort = clamp(Math.round(p.effortMinutes ?? EFFORT_MINUTES[kind] ?? 20), 1, 480);
      const item = putUp(s, profile, kind, text, {
        images, place: p.place, publishAt: p.publishAt, effortMinutes: effort,
      });
      return { itemId: item.id, at: item.at, scheduled: item.at > s.now };
    },
  );

  sim.onCommand<{ text?: string; images?: string[]; close?: boolean }, { itemId: Id; expiresAt: Instant }>(
    'feed.story',
    (p, { sim: s }) => {
      const profile = myProfile(s, PHOTO_PLATFORM);
      if (!profile) throw new CommandError('You have no account there yet.');
      const images = (p.images ?? []).slice(0, 1);
      if (images.length < 1 && !(p.text ?? '').trim()) throw new CommandError('A story needs a picture or something written.');
      const story: SocialItem = {
        id: s.nextId('sitem'),
        saveId: s.universe.meta.id,
        platform: PHOTO_PLATFORM,
        profileId: profile.id,
        kind: 'story',
        text: (p.text ?? '').slice(0, 200),
        at: s.now,
        likes: 0,
        comments: 0,
        reposts: 0,
        images: images.length > 0 ? images : undefined,
        expiresAt: s.now + STORY_HOURS * MS_HOUR,
        closeOnly: p.close === true,
        topic: profile.topic,
        byPlayer: true,
        seen: true,
      };
      s.universe.socialItems[story.id] = story;
      s.advanceTo(s.now + EFFORT_MINUTES.story! * MS_MINUTE);
      s.emit('feed.story_posted', { itemId: story.id, close: p.close === true });
      return { itemId: story.id, expiresAt: story.expiresAt! };
    },
  );

  sim.onCommand<{ itemId: Id; text?: string; place?: string }, { itemId: Id }>(
    'feed.edit',
    (p, { sim: s }) => {
      const item = s.universe.socialItems[p.itemId];
      if (!item?.byPlayer) throw new CommandError('That is not yours to edit.');
      if (item.platform === TEXT_PLATFORM && item.at < s.now - MS_HOUR) {
        throw new CommandError('That is past the hour the app allows an edit in.');
      }
      if (p.text !== undefined) {
        const limit = item.platform === TEXT_PLATFORM ? TEXT_LIMIT : CAPTION_LIMIT;
        if (p.text.trim().length > limit) throw new CommandError(`That is over the ${limit} character limit.`);
        item.text = p.text.trim();
      }
      if (p.place !== undefined) item.place = p.place || undefined;
      return { itemId: item.id };
    },
  );

  sim.onCommand<{ itemId: Id }, { itemId: Id }>(
    'feed.delete',
    (p, { sim: s }) => {
      const item = s.universe.socialItems[p.itemId];
      if (!item?.byPlayer) throw new CommandError('That is not yours to delete.');
      const profile = s.universe.socialProfiles[item.profileId];
      if (profile && item.kind !== 'reply' && item.kind !== 'story') {
        profile.posts = Math.max(0, profile.posts - 1);
      }
      delete s.universe.socialItems[item.id];
      s.emit('feed.deleted', { itemId: item.id });
      return { itemId: item.id };
    },
  );

  // --- The time it takes off your day ----------------------------------------

  sim.onCommand<{ platform: PlatformId; minutes?: number }, { minutes: number; note: string; saw: number }>(
    'feed.scroll',
    (p, { sim: s }) => {
      if (![PHOTO_PLATFORM, TEXT_PLATFORM, CLIP_PLATFORM].includes(p.platform)) {
        throw new CommandError('That is not one of the apps.');
      }
      const minutes = clamp(Math.round(p.minutes ?? 15), 1, 240);
      const feed = homeFeed(s, p.platform, 40);
      s.advanceTo(s.now + minutes * MS_MINUTE);
      spend(s, p.platform, minutes);

      // What an hour of it does depends on what was on it. A feed of cooking
      // and jokes is not a feed of politics, and the app knows the difference
      // even where the person scrolling does not.
      let morale = 0; let energy = 0; let stress = 0;
      for (const item of feed) {
        const effect = SOCIAL_EFFECT[item.topic as SocialTopic] ?? { morale: 1, energy: -1, stress: 0 };
        morale += effect.morale; energy += effect.energy; stress += effect.stress;
      }
      const count = Math.max(1, feed.length);
      const share = minutes / 60;
      const person = s.player;
      person.wellbeing.morale = clamp(person.wellbeing.morale + (morale / count) * share, 0, 100);
      person.wellbeing.energy = clamp(person.wellbeing.energy + (energy / count) * share - share * 2, 0, 100);
      person.wellbeing.stress = clamp(person.wellbeing.stress + (stress / count) * share, 0, 100);

      const mood = morale / count;
      const note = mood > 2.5
        ? 'A good half hour of it, for once.'
        : mood < -1
          ? 'You put the phone down worse than you picked it up.'
          : 'The time went and you could not say where.';
      s.emit('feed.scrolled', { platform: p.platform, minutes });
      return { minutes, note, saw: feed.length };
    },
  );

  // --- What the apps charge and what they pay --------------------------------

  sim.onCommand<Record<string, never>, { verified: boolean }>(
    'feed.join_premium',
    (_p, { sim: s }) => {
      const profile = myProfile(s, TEXT_PLATFORM);
      if (!profile) throw new CommandError('You have no account there yet.');
      if (profile.verified) throw new CommandError('You already have Premium.');
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < X_PREMIUM_MONTHLY) throw new CommandError('You cannot cover that.');
      s.expense(accountId, X_PREMIUM_MONTHLY, 'X Premium', 'subscriptions');
      profile.verified = true;
      if (!s.timeline.pending().some((i) => i.kind === 'feed.premium_renew')) {
        s.schedule({
          at: addDays(s.now, 30, s.homeZone), kind: 'feed.premium_renew',
          label: 'X Premium', category: 'system', priority: 80,
        });
      }
      s.emit('feed.premium_joined', {});
      return { verified: true };
    },
  );

  sim.onCommand<Record<string, never>, { verified: boolean }>(
    'feed.leave_premium',
    (_p, { sim: s }) => {
      const profile = myProfile(s, TEXT_PLATFORM);
      if (!profile?.verified) throw new CommandError('You are not on Premium.');
      profile.verified = false;
      s.emit('feed.premium_left', {});
      return { verified: false };
    },
  );

  // --- Rooms: communities, lists and spaces ---------------------------------

  sim.onCommand<{ roomId: Id }, { joined: boolean }>(
    'feed.join_room',
    (p, { sim: s }) => {
      const room = roomById(s, p.roomId);
      if (!room) throw new CommandError('No such room.');
      if (room.kind === 'space') throw new CommandError('A space is joined by opening it, not by joining it.');
      room.joined = !room.joined;
      room.members += room.joined ? 1 : -1;
      s.emit('feed.room_joined', { roomId: room.id, joined: room.joined });
      return { joined: room.joined };
    },
  );

  sim.onCommand<{ name: string; profileIds?: Id[] }, { roomId: Id }>(
    'feed.create_list',
    (p, { sim: s }) => {
      const name = p.name.trim();
      if (name.length < 2) throw new CommandError('A list needs a name.');
      if (roomsOf(s, 'list').some((room) => room.name.toLowerCase() === name.toLowerCase())) {
        throw new CommandError('You already have a list called that.');
      }
      const room: SocialRoom = {
        id: s.nextId('sroom'),
        saveId: s.universe.meta.id,
        platform: TEXT_PLATFORM,
        kind: 'list',
        name,
        topic: 'news',
        profileIds: (p.profileIds ?? []).filter((id) => profileById(s, id)),
        joined: true,
        mine: true,
        members: 0,
        createdAt: s.now,
      };
      s.universe.socialRooms[room.id] = room;
      s.emit('feed.list_created', { roomId: room.id, name });
      return { roomId: room.id };
    },
  );

  sim.onCommand<{ roomId: Id; profileId: Id; remove?: boolean }, { members: number }>(
    'feed.edit_list',
    (p, { sim: s }) => {
      const room = roomById(s, p.roomId);
      if (!room || room.kind !== 'list' || !room.mine) throw new CommandError('That is not one of your lists.');
      if (!profileById(s, p.profileId)) throw new CommandError('No such account.');
      room.profileIds = p.remove
        ? room.profileIds.filter((id) => id !== p.profileId)
        : [...room.profileIds.filter((id) => id !== p.profileId), p.profileId];
      return { members: room.profileIds.length };
    },
  );

  sim.onCommand<{ roomId: Id }, { roomId: Id }>(
    'feed.delete_list',
    (p, { sim: s }) => {
      const room = roomById(s, p.roomId);
      if (!room || room.kind !== 'list' || !room.mine) throw new CommandError('That is not one of your lists.');
      delete s.universe.socialRooms[p.roomId];
      return { roomId: p.roomId };
    },
  );

  /**
   * A space runs for the hours you give it and is then over. What it draws is
   * whatever slice of your followers happens to be about, and the hours come
   * out of the day like any other hours.
   */
  sim.onCommand<{ name: string; minutes?: number }, { roomId: Id; peak: number }>(
    'feed.start_space',
    (p, { sim: s }) => {
      const mine = myProfile(s, TEXT_PLATFORM);
      if (!mine) throw new CommandError('You have no account there yet.');
      const name = p.name.trim();
      if (name.length < 3) throw new CommandError('Give the space a name.');
      const minutes = clamp(Math.round(p.minutes ?? 60), 10, 300);
      const rng = s.rng('social.space', mine.id, s.counter('social.space'));
      const peak = Math.max(1, Math.round(mine.followers * rng.float(0.001, 0.02)) + rng.int(0, 40));

      s.advanceTo(s.now + minutes * MS_MINUTE);
      spend(s, TEXT_PLATFORM, minutes);

      const room: SocialRoom = {
        id: s.nextId('sroom'),
        saveId: s.universe.meta.id,
        platform: TEXT_PLATFORM,
        kind: 'space',
        name,
        topic: mine.topic,
        profileIds: [mine.id],
        joined: true,
        mine: true,
        members: peak,
        createdAt: s.now - minutes * MS_MINUTE,
        startedAt: s.now - minutes * MS_MINUTE,
        endedAt: s.now,
        peak,
      };
      s.universe.socialRooms[room.id] = room;
      gainFollowers(s, mine, Math.round(peak * rng.float(0.01, 0.08)));
      s.emit('feed.space_held', { roomId: room.id, peak });
      return { roomId: room.id, peak };
    },
  );

  // --- Going live, on the two apps that do it -------------------------------

  /**
   * Live is the hours, the people who happen to be about, and what they chose
   * to send while you were on. It is not a post: it leaves a record of having
   * happened and nothing on the grid.
   */
  sim.onCommand<
    { platform: PlatformId; title?: string; minutes?: number },
    { itemId: Id; peak: number; gifts: Money }
  >(
    'feed.go_live',
    (p, { sim: s }) => {
      if (p.platform !== PHOTO_PLATFORM && p.platform !== CLIP_PLATFORM) {
        throw new CommandError('That app does not do live.');
      }
      const profile = myProfile(s, p.platform);
      if (!profile) throw new CommandError('You have no account there yet.');
      const minutes = clamp(Math.round(p.minutes ?? 45), 10, 300);
      const rng = s.rng('social.live', profile.id, s.counter('social.live'));
      const peak = Math.max(1, Math.round(profile.followers * rng.float(0.002, 0.03)) + rng.int(0, 25));
      const senders = Math.round(peak * rng.float(0, 0.03));
      const gifts = Math.round(senders * GIFT_STEPS[rng.int(0, GIFT_STEPS.length - 1)]! * GIFT_SHARE);

      s.advanceTo(s.now + minutes * MS_MINUTE);
      spend(s, p.platform, minutes);

      const item: SocialItem = {
        id: s.nextId('sitem'),
        saveId: s.universe.meta.id,
        platform: p.platform,
        profileId: profile.id,
        kind: 'live',
        text: (p.title ?? 'Live').trim().slice(0, 120),
        at: s.now - minutes * MS_MINUTE,
        likes: Math.round(peak * rng.float(0.2, 0.9)),
        comments: Math.round(peak * minutes * rng.float(0.01, 0.09)),
        reposts: 0,
        topic: profile.topic,
        byPlayer: true,
      };
      s.universe.socialItems[item.id] = item;

      const accountId = s.player.primaryAccountId;
      if (accountId && gifts > 0) {
        s.income(accountId, gifts, p.platform === CLIP_PLATFORM ? 'TikTok — Gifts' : 'Instagram — Gifts', 'creator');
      }
      gainFollowers(s, profile, Math.round(peak * rng.float(0.01, 0.1)));
      s.emit('feed.went_live', { platform: p.platform, peak, gifts });
      return { itemId: item.id, peak, gifts };
    },
  );

  // --- A thread, which is one post and then the rest of the thought ---------

  sim.onCommand<{ parts: string[] }, { itemIds: Id[] }>(
    'feed.thread',
    (p, { sim: s }) => {
      const profile = myProfile(s, TEXT_PLATFORM);
      if (!profile) throw new CommandError('You have no account there yet.');
      const parts = p.parts.map((part) => part.trim()).filter(Boolean);
      if (parts.length < 2) throw new CommandError('A thread is two posts or more.');
      if (parts.length > 25) throw new CommandError('That is longer than a thread goes.');
      const over = parts.find((part) => part.length > TEXT_LIMIT);
      if (over) throw new CommandError(`One of those is over the ${TEXT_LIMIT} character limit.`);

      const ids: Id[] = [];
      let parentId: Id | undefined;
      for (const part of parts) {
        const item = putUp(s, profile, 'text', part, {
          parentId,
          effortMinutes: EFFORT_MINUTES.text,
        });
        ids.push(item.id);
        parentId = item.id;
      }
      s.emit('feed.threaded', { count: ids.length });
      return { itemIds: ids };
    },
  );

  // --- How the apps are set up ----------------------------------------------

  sim.onCommand<Partial<SocialSettings>, SocialSettings>(
    'feed.settings',
    (p, { sim: s }) => {
      const settings = settingsOf(s);
      if (p.privateAccount !== undefined) settings.privateAccount = p.privateAccount;
      if (p.hideCounts !== undefined) settings.hideCounts = p.hideCounts;
      if (p.notificationsOn !== undefined) settings.notificationsOn = p.notificationsOn;
      if (p.hiddenWords !== undefined) {
        settings.hiddenWords = p.hiddenWords
          .map((word) => word.trim())
          .filter((word) => word.length > 1)
          .slice(0, 60);
      }
      return settings;
    },
  );

  sim.onCommand<{ profileId: Id; muted?: boolean }, { muted: boolean }>(
    'feed.mute',
    (p, { sim: s }) => {
      if (!profileById(s, p.profileId)) throw new CommandError('No such account.');
      const settings = settingsOf(s);
      const already = settings.mutedProfileIds.includes(p.profileId);
      const next = p.muted ?? !already;
      settings.mutedProfileIds = next
        ? [...settings.mutedProfileIds.filter((id) => id !== p.profileId), p.profileId]
        : settings.mutedProfileIds.filter((id) => id !== p.profileId);
      return { muted: next };
    },
  );

  /**
   * Blocking is not muting. It takes them out of search as well, and it undoes
   * the follow in both directions, which is what blocking somebody does.
   */
  sim.onCommand<{ profileId: Id; blocked?: boolean }, { blocked: boolean }>(
    'feed.block',
    (p, { sim: s }) => {
      const profile = profileById(s, p.profileId);
      if (!profile) throw new CommandError('No such account.');
      if (profile.ownerId === s.player.id) throw new CommandError('You cannot block yourself.');
      const settings = settingsOf(s);
      const already = settings.blockedProfileIds.includes(p.profileId);
      const next = p.blocked ?? !already;
      settings.blockedProfileIds = next
        ? [...settings.blockedProfileIds.filter((id) => id !== p.profileId), p.profileId]
        : settings.blockedProfileIds.filter((id) => id !== p.profileId);
      if (next && isFollowing(s, s.player.id, profile.id)) {
        s.execute({ kind: 'feed.unfollow', payload: { profileId: profile.id } });
      }
      return { blocked: next };
    },
  );

  sim.onCommand<Record<string, never>, { verified: boolean }>(
    'feed.join_verified',
    (_p, { sim: s }) => {
      const profile = myProfile(s, PHOTO_PLATFORM);
      if (!profile) throw new CommandError('You have no account there yet.');
      if (profile.verified) throw new CommandError('You already have it.');
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < PHOTO_VERIFIED_MONTHLY) throw new CommandError('You cannot cover that.');
      s.expense(accountId, PHOTO_VERIFIED_MONTHLY, 'Meta Verified', 'subscriptions');
      profile.verified = true;
      const settings = settingsOf(s);
      settings.photoVerified = true;
      settings.photoVerifiedAt = s.now;
      if (!s.timeline.pending().some((i) => i.kind === 'feed.verified_renew')) {
        s.schedule({
          at: addDays(s.now, 30, s.homeZone), kind: 'feed.verified_renew',
          label: 'Meta Verified', category: 'system', priority: 80,
        });
      }
      return { verified: true };
    },
  );

  sim.onCommand<Record<string, never>, { verified: boolean }>(
    'feed.leave_verified',
    (_p, { sim: s }) => {
      const profile = myProfile(s, PHOTO_PLATFORM);
      if (!profile?.verified) throw new CommandError('You are not subscribed.');
      profile.verified = false;
      settingsOf(s).photoVerified = false;
      return { verified: false };
    },
  );

  sim.onSchedule('feed.verified_renew', () => {
    const profile = myProfile(sim, PHOTO_PLATFORM);
    if (!profile?.verified) return;
    const accountId = sim.player.primaryAccountId;
    if (accountId && sim.ledger.availableFunds(accountId) >= PHOTO_VERIFIED_MONTHLY) {
      sim.expense(accountId, PHOTO_VERIFIED_MONTHLY, 'Meta Verified', 'subscriptions');
      sim.schedule({
        at: addDays(sim.now, 30, sim.homeZone), kind: 'feed.verified_renew',
        label: 'Meta Verified', category: 'system', priority: 80,
      });
    } else {
      profile.verified = false;
      settingsOf(sim).photoVerified = false;
      sim.notify({
        category: 'social', title: 'Verified Lapsed',
        body: 'The subscription could not be taken, so the badge is gone.',
        importance: 46, route: '/workspace/phone',
      });
    }
  });

  // --- Messages -------------------------------------------------------------

  sim.onCommand<{ profileId: Id; text: string }, { itemId: Id }>(
    'feed.message',
    (p, { sim: s }) => {
      const them = profileById(s, p.profileId);
      if (!them) throw new CommandError('No such account.');
      if (them.ownerId === s.player.id) throw new CommandError('You cannot message yourself.');
      const mine = myProfile(s, them.platform);
      if (!mine) throw new CommandError('You have no account there yet.');
      const text = p.text.trim();
      if (text.length < 1) throw new CommandError('Write something first.');
      if (text.length > 1_000) throw new CommandError('That is longer than a message goes.');

      const item: SocialItem = {
        id: s.nextId('sitem'),
        saveId: s.universe.meta.id,
        platform: them.platform,
        profileId: mine.id,
        kind: 'message',
        text,
        at: s.now,
        likes: 0, comments: 0, reposts: 0,
        withProfileId: them.id,
        topic: them.topic,
        byPlayer: true,
        seen: true,
      };
      s.universe.socialItems[item.id] = item;
      s.advanceTo(s.now + 2 * MS_MINUTE);

      // Whether they write back, and how long they take, is decided now and
      // scheduled, rather than appearing the instant you press send.
      const rng = s.rng('social.dm', them.sourceId ?? them.id, s.counter('social.dm'));
      if (rng.float(0, 1) < willReply(them, isFollowing(s, s.player.id, them.id))) {
        s.schedule({
          at: s.now + rng.int(20, 2_600) * MS_MINUTE,
          kind: 'feed.dm_reply',
          payload: { profileId: them.id },
          label: 'A Reply', category: 'personal', priority: 40,
        });
      }
      s.emit('feed.messaged', { profileId: them.id });
      return { itemId: item.id };
    },
  );

  sim.onSchedule('feed.dm_reply', (scheduled) => {
    const them = sim.universe.socialProfiles[scheduled.payload.profileId as Id];
    if (!them) return;
    const rng = sim.rng('social.dm.text', them.sourceId ?? them.id, sim.counter('social.dm.text'));
    const reply: SocialItem = {
      id: sim.nextId('sitem'),
      saveId: sim.universe.meta.id,
      platform: them.platform,
      profileId: them.id,
      kind: 'message',
      text: rng.pick([...DM_REPLIES]),
      at: sim.now,
      likes: 0, comments: 0, reposts: 0,
      topic: them.topic,
    };
    sim.universe.socialItems[reply.id] = reply;
    sim.notify({
      category: 'social',
      title: `${them.name} Replied`,
      body: reply.text,
      importance: 34, route: '/workspace/phone',
    });
  });

  sim.onCommand<{ profileId: Id }, { read: number }>(
    'feed.read_messages',
    (p, { sim: s }) => {
      let read = 0;
      for (const item of messagesWith(s, p.profileId)) {
        if (!item.byPlayer && item.seen !== true) { item.seen = true; read += 1; }
      }
      return { read };
    },
  );

  sim.onCommand<{ text: string }, { note: string }>(
    'feed.set_note',
    (p, { sim: s }) => {
      const mine = myProfile(s, PHOTO_PLATFORM);
      if (!mine) throw new CommandError('You have no account there yet.');
      const text = p.text.trim().slice(0, 60);
      mine.note = text || undefined;
      mine.noteAt = text ? s.now : undefined;
      return { note: text };
    },
  );

  sim.onCommand<{ profileId: Id; amount: Money }, { amount: Money }>(
    'feed.gift',
    (p, { sim: s }) => {
      const profile = profileById(s, p.profileId);
      if (!profile) throw new CommandError('No such account.');
      if (profile.ownerId === s.player.id) throw new CommandError('You cannot send yourself a gift.');
      const amount = Math.round(p.amount);
      if (!GIFT_STEPS.includes(amount)) throw new CommandError('That is not one of the amounts.');
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < amount) throw new CommandError('You cannot cover that.');
      s.expense(accountId, amount, `Gift — ${profile.name}`, 'personal');
      s.emit('feed.gifted', { profileId: profile.id, amount });
      return { amount };
    },
  );
}

/** Puts one of the player's own things up, now or at the time they set. */
function putUp(
  sim: Simulation,
  profile: SocialProfile,
  kind: SocialItem['kind'],
  text: string,
  opts: { images?: string[]; place?: string; publishAt?: number; parentId?: Id; effortMinutes?: number },
): SocialItem {
  const effort = opts.effortMinutes ?? EFFORT_MINUTES[kind] ?? 20;
  // Making it costs the time. Putting it up later does not cost it twice.
  sim.advanceTo(sim.now + effort * MS_MINUTE);
  spend(sim, profile.platform, effort);
  const at = opts.publishAt && opts.publishAt > sim.now ? opts.publishAt : sim.now;
  const reach = playerReach(sim, profile, effort, kind);
  const rng = sim.rng('social.mine.stats', profile.id, sim.counter('social.mine.stats'));
  const likes = Math.max(0, Math.round(reach * rng.float(0.02, 0.1)));
  const item: SocialItem = {
    id: sim.nextId('sitem'),
    saveId: sim.universe.meta.id,
    platform: profile.platform,
    profileId: profile.id,
    kind,
    text,
    at,
    likes,
    comments: Math.max(0, Math.round(likes * rng.float(0.01, 0.08))),
    reposts: profile.platform === TEXT_PLATFORM ? Math.max(0, Math.round(likes * rng.float(0.02, 0.2))) : 0,
    images: opts.images && opts.images.length > 0 ? opts.images : undefined,
    place: opts.place || undefined,
    parentId: opts.parentId,
    topic: profile.topic,
    byPlayer: true,
  };
  sim.universe.socialItems[item.id] = item;
  if (at > sim.now) {
    sim.schedule({
      at, kind: 'feed.publish', payload: { itemId: item.id },
      label: 'Post Goes Up', category: 'personal', priority: 60,
    });
  } else {
    profile.posts += 1;
    profile.lastPostAt = at;
    // Every follower gained is one somebody chose to give, so growth comes off
    // what the post actually did rather than off a curve. A private account is
    // seen by fewer people, so fewer of them arrive. They arrive as accounts on
    // a list rather than as a number going up.
    const seen = sim.universe.socialSettings?.privateAccount ? 0.004 : 0.02;
    gainFollowers(sim, profile, Math.max(0, Math.round(likes * seen)));
    sim.emit('feed.published', { itemId: item.id, platform: item.platform });
  }
  return item;
}

/**
 * The two apps exist and their clocks are running, applied to a save that may
 * never have had them. Idempotent, and it creates nothing twice.
 */
export function ensureSocialApps(sim: Simulation): void {
  ensureProfiles(sim);
  ensureRooms(sim);
  const pending = sim.timeline.pending();
  if (!pending.some((i) => i.kind === 'feed.world_tick')) {
    sim.schedule({
      at: addDays(sim.now, 1, sim.homeZone), kind: 'feed.world_tick',
      label: 'New Posts', category: 'system', priority: 93,
    });
  }
  if (!pending.some((i) => i.kind === 'feed.payout_month')) {
    sim.schedule({
      at: addDays(sim.now, 30, sim.homeZone), kind: 'feed.payout_month',
      label: 'App Payout', category: 'system', priority: 85,
    });
  }
}
