/**
 * The photo app and the text app.
 *
 * These hold the parts of the promise a test can hold: a world of accounts
 * that was posting before the player arrived, two generators that do not
 * sound like each other, a feed built out of who you actually follow, a
 * scroll that costs the minutes and does something different for comedy than
 * for politics, stories that are gone in a day, comment sections warm on one
 * app and an argument on the other, an account of your own with posting,
 * scheduling, editing and deleting, and money that arrives the way each app
 * actually pays it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { PHOTO_PROFILES, REAL_PROFILES, SOCIAL_TOPICS, TEXT_PROFILES } from '@/engine/content/socialworld';
import { CAPTION_FRAME, CAPTION_KITS, POST_FRAME, POST_KITS, textSpace } from '@/engine/content/socialposts';
import {
  GIFT_STEPS, PHOTO_PLATFORM, PHOTO_VERIFIED_MONTHLY, STORY_HOURS, TEXT_LIMIT, TEXT_PLATFORM,
  X_PREMIUM_MONTHLY, buildSocialPayout, catalogOf, exploreFeed, followedIds, followingFeed,
  homeFeed, impressionsOf, isBlocked, isFollowing, isHidden, isMuted, itemById, messagesWith,
  myProfile, newestOf, noteOf, profileByHandle, profilesOf, recentItems, repliesTo, screenTime,
  searchSocial, settingsOf, socialAnalytics, storiesFor, storyOf, threadsOf, trends,
} from '@/engine/systems/socialapps';
import type { Simulation } from '@/engine/core/simulation';
import type { PlatformId, SocialProfile } from '@/engine/domain/model';

const DAY = 86_400_000;
const HOUR = 3_600_000;

function handle(sim: Simulation, platform: PlatformId, name: string): SocialProfile {
  const found = profileByHandle(sim, platform, name);
  if (!found) throw new Error(`no account called @${name}`);
  return found;
}

function makeMine(sim: Simulation, platform: PlatformId, name = 'yourname') {
  return sim.execute<{ profileId: string }>({
    kind: 'feed.create_profile',
    payload: { platform, handle: name, name: 'You', bio: 'Testing.' },
  });
}

describe('a world that was already posting', () => {
  it('has every account on the roster, with a feed behind each one', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-world');
    const all = profilesOf(sim);
    expect(all.length).toBe(REAL_PROFILES.length);
    expect(all.length).toBeGreaterThanOrEqual(240);
    expect(profilesOf(sim, PHOTO_PLATFORM).length).toBe(PHOTO_PROFILES.length);
    expect(profilesOf(sim, TEXT_PLATFORM).length).toBe(TEXT_PROFILES.length);

    for (const profile of all) {
      expect(profile.posts).toBeGreaterThan(0);
      expect(catalogOf(sim, profile).length).toBeGreaterThan(0);
      expect(newestOf(sim, profile)).toBeDefined();
    }
  });

  it('keeps the world out of the save file', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-size');
    // The accounts are stored. What they said is derived, so a fresh save
    // holds no posts at all.
    expect(Object.keys(sim.universe.socialProfiles).length).toBe(REAL_PROFILES.length);
    expect(Object.keys(sim.universe.socialItems).length).toBe(0);
  });

  it('gives the same account the same feed twice', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-stable');
    const profile = profilesOf(sim, PHOTO_PLATFORM)[0]!;
    const first = catalogOf(sim, profile).map((i) => i.text);
    const second = catalogOf(sim, profile).map((i) => i.text);
    expect(second).toEqual(first);
  });

  it('does not let one account repeat itself down its own grid', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-dupes');
    for (const profile of profilesOf(sim).slice(0, 60)) {
      const said = catalogOf(sim, profile).map((i) => i.text);
      expect(new Set(said).size).toBe(said.length);
    }
  });

  it('does not sound the same on both apps', () => {
    for (const topic of SOCIAL_TOPICS) {
      const captions = new Set(CAPTION_KITS[topic].patterns);
      for (const line of POST_KITS[topic].patterns) expect(captions.has(line)).toBe(false);
      expect(textSpace(CAPTION_KITS[topic], CAPTION_FRAME)).toBeGreaterThan(2_000);
      expect(textSpace(POST_KITS[topic], POST_FRAME)).toBeGreaterThan(400);
    }
  });

  it('keeps a post on the text app inside the limit', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-limit');
    for (const item of recentItems(sim, TEXT_PLATFORM, 6)) {
      expect(item.text.length).toBeLessThanOrEqual(TEXT_LIMIT);
      // Every one of them starts with a capital, wherever the frame put it.
      expect(item.text[0]).toBe(item.text[0]!.toUpperCase());
    }
  });

  it('keeps posting while you are away', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-tick');
    const profile = profilesOf(sim, TEXT_PLATFORM).find((p) => p.cadenceDays <= 2)!;
    const before = profile.posts;
    sim.advanceTo(sim.now + 30 * DAY);
    expect(profile.posts).toBeGreaterThan(before);
  });
});

describe('the feed', () => {
  it('puts who you follow above who you do not', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-feed');
    const target = handle(sim, PHOTO_PLATFORM, 'thebreadproof');
    sim.execute({ kind: 'feed.follow', payload: { profileId: target.id } });
    expect(isFollowing(sim, sim.player.id, target.id)).toBe(true);

    const feed = homeFeed(sim, PHOTO_PLATFORM, 24);
    const first = feed.findIndex((i) => i.profileId === target.id);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(6);

    const only = followingFeed(sim, PHOTO_PLATFORM, 24);
    expect(only.length).toBeGreaterThan(0);
    for (const item of only) expect(item.profileId).toBe(target.id);
  });

  it('never puts two from the same account next to each other', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-spread');
    const feed = homeFeed(sim, TEXT_PLATFORM, 24);
    for (let i = 1; i < feed.length; i += 1) {
      expect(feed[i]!.profileId).not.toBe(feed[i - 1]!.profileId);
    }
  });

  it('keeps who you follow out of Explore', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-explore');
    const target = handle(sim, PHOTO_PLATFORM, 'northlight');
    sim.execute({ kind: 'feed.follow', payload: { profileId: target.id } });
    for (const item of exploreFeed(sim, PHOTO_PLATFORM, 30)) {
      expect(item.profileId).not.toBe(target.id);
    }
  });

  it('counts what is being talked about', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-trends');
    const list = trends(sim, 8);
    expect(list.length).toBeGreaterThan(3);
    expect(list[0]!.posts).toBeGreaterThanOrEqual(list[list.length - 1]!.posts);
  });

  it('searches accounts and what they said', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-search');
    const found = searchSocial(sim, TEXT_PLATFORM, 'desk');
    expect(found.profiles.length).toBeGreaterThan(0);
    expect(searchSocial(sim, TEXT_PLATFORM, 'a').profiles.length).toBe(0);
  });
});

describe('the room under a post', () => {
  it('is warm on one app and an argument on the other', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-replies');
    const photo = recentItems(sim, PHOTO_PLATFORM, 2).find((i) => i.comments > 200)!;
    const text = recentItems(sim, TEXT_PLATFORM, 2).find((i) => i.comments > 200)!;
    const warm = repliesTo(sim, photo.id);
    const argument = repliesTo(sim, text.id);
    expect(warm.length).toBeGreaterThan(0);
    expect(argument.length).toBeGreaterThan(0);
    const warmText = new Set(warm.map((r) => r.text));
    for (const reply of argument) expect(warmText.has(reply.text)).toBe(false);
  });

  it('keeps what you said', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-reply-mine');
    makeMine(sim, TEXT_PLATFORM);
    const post = recentItems(sim, TEXT_PLATFORM, 1)[0]!;
    const before = sim.now;
    const result = sim.execute({ kind: 'feed.reply', payload: { itemId: post.id, text: 'Not sure that follows.' } });
    expect(result.ok).toBe(true);
    expect(sim.now).toBeGreaterThan(before);
    expect(repliesTo(sim, post.id).some((r) => r.byPlayer)).toBe(true);
  });
});

describe('what you do to a post', () => {
  it('likes and unlikes, and the count moves with it', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-like');
    const post = recentItems(sim, PHOTO_PLATFORM, 1)[0]!;
    const before = post.likes;
    sim.execute({ kind: 'feed.like', payload: { itemId: post.id } });
    expect(itemById(sim, post.id)!.likes).toBe(before + 1);
    expect(itemById(sim, post.id)!.liked).toBe(true);
    sim.execute({ kind: 'feed.like', payload: { itemId: post.id } });
    expect(itemById(sim, post.id)!.likes).toBe(before);
  });

  it('will not repost on the app that has no reposts', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-repost');
    const photo = recentItems(sim, PHOTO_PLATFORM, 1)[0]!;
    expect(sim.execute({ kind: 'feed.repost', payload: { itemId: photo.id } }).ok).toBe(false);
    const text = recentItems(sim, TEXT_PLATFORM, 1)[0]!;
    expect(sim.execute({ kind: 'feed.repost', payload: { itemId: text.id } }).ok).toBe(true);
    expect(itemById(sim, text.id)!.reposted).toBe(true);
  });

  it('bookmarks without touching anybody else', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-save');
    const post = recentItems(sim, TEXT_PLATFORM, 1)[0]!;
    sim.execute({ kind: 'feed.bookmark', payload: { itemId: post.id } });
    expect(itemById(sim, post.id)!.saved).toBe(true);
    expect(itemById(sim, post.id)!.likes).toBe(post.likes);
  });
});

describe('following', () => {
  it('adds one to their count and one to yours', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-follow');
    makeMine(sim, PHOTO_PLATFORM);
    const mine = myProfile(sim, PHOTO_PLATFORM)!;
    const target = handle(sim, PHOTO_PLATFORM, 'kerbside');
    const theirs = target.followers;
    sim.execute({ kind: 'feed.follow', payload: { profileId: target.id } });
    expect(target.followers).toBe(theirs + 1);
    expect(mine.following).toBe(1);
    sim.execute({ kind: 'feed.unfollow', payload: { profileId: target.id } });
    expect(target.followers).toBe(theirs);
    expect(mine.following).toBe(0);
  });

  it('will not follow twice', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-follow-twice');
    const target = handle(sim, TEXT_PLATFORM, 'courtnotes');
    sim.execute({ kind: 'feed.follow', payload: { profileId: target.id } });
    const after = target.followers;
    sim.execute({ kind: 'feed.follow', payload: { profileId: target.id } });
    expect(target.followers).toBe(after);
    expect(followedIds(sim, sim.player.id, TEXT_PLATFORM).size).toBe(1);
  });

  it('keeps a close friends list', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-close');
    const target = handle(sim, PHOTO_PLATFORM, 'northlight');
    sim.execute({ kind: 'feed.follow', payload: { profileId: target.id } });
    expect(sim.execute({ kind: 'feed.close_friend', payload: { profileId: target.id, close: true } }).ok).toBe(true);
    const follow = Object.values(sim.universe.socialFollows).find((f) => f.profileId === target.id);
    expect(follow?.close).toBe(true);
  });
});

describe('stories', () => {
  it('are up for a day and then gone', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-story');
    makeMine(sim, PHOTO_PLATFORM);
    const result = sim.execute<{ itemId: string; expiresAt: number }>({
      kind: 'feed.story',
      payload: { text: 'Out on the water.' },
    });
    expect(result.ok).toBe(true);
    const at = result.value!.expiresAt;
    expect(at - sim.now).toBeLessThanOrEqual(STORY_HOURS * HOUR);
    expect(storiesFor(sim, sim.player.id).some((s) => s.id === result.value!.itemId)).toBe(true);
    sim.advanceTo(sim.now + 2 * DAY);
    expect(sim.universe.socialItems[result.value!.itemId]).toBeUndefined();
  });

  it('go gray once read', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-story-seen');
    const target = profilesOf(sim, PHOTO_PLATFORM).find((p) => storyOf(sim, p))!;
    sim.execute({ kind: 'feed.follow', payload: { profileId: target.id } });
    const story = storyOf(sim, target)!;
    expect(story.seen).not.toBe(true);
    sim.execute({ kind: 'feed.view_story', payload: { itemId: story.id } });
    expect(storyOf(sim, target)!.seen).toBe(true);
  });
});

describe('an account of your own', () => {
  it('is made once and not twice', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-mine');
    expect(makeMine(sim, PHOTO_PLATFORM).ok).toBe(true);
    expect(makeMine(sim, PHOTO_PLATFORM, 'other').ok).toBe(false);
    const mine = myProfile(sim, PHOTO_PLATFORM)!;
    expect(mine.followers).toBe(0);
    expect(mine.accountId).toBeDefined();
  });

  it('will not take a handle somebody already has', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-handle');
    expect(makeMine(sim, PHOTO_PLATFORM, 'northlight').ok).toBe(false);
  });

  it('charges the evening it takes to make the thing', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-post');
    makeMine(sim, PHOTO_PLATFORM);
    const before = sim.now;
    const result = sim.execute({
      kind: 'feed.post',
      payload: { platform: PHOTO_PLATFORM, kind: 'reel', text: 'Four hours for ninety seconds.', images: ['x'] },
    });
    expect(result.ok).toBe(true);
    const spent = (sim.now - before) / 60_000;
    expect(spent).toBeGreaterThan(60);
    expect(spent).toBeLessThan(180);
    expect(myProfile(sim, PHOTO_PLATFORM)!.posts).toBe(1);
  });

  it('will not put a photograph up without a photograph', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-no-photo');
    makeMine(sim, PHOTO_PLATFORM);
    expect(sim.execute({ kind: 'feed.post', payload: { platform: PHOTO_PLATFORM, text: 'No picture.' } }).ok).toBe(false);
  });

  it('holds the text app to its character limit', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-over');
    makeMine(sim, TEXT_PLATFORM);
    const long = 'a'.repeat(TEXT_LIMIT + 1);
    expect(sim.execute({ kind: 'feed.post', payload: { platform: TEXT_PLATFORM, text: long } }).ok).toBe(false);
  });

  it('schedules a post and puts it up on its own', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-later');
    makeMine(sim, TEXT_PLATFORM);
    const result = sim.execute<{ itemId: string; scheduled: boolean }>({
      kind: 'feed.post',
      payload: { platform: TEXT_PLATFORM, text: 'Going up on Thursday.', publishAt: sim.now + 3 * DAY },
    });
    expect(result.value!.scheduled).toBe(true);
    expect(myProfile(sim, TEXT_PLATFORM)!.posts).toBe(0);
    sim.advanceTo(sim.now + 4 * DAY);
    expect(myProfile(sim, TEXT_PLATFORM)!.posts).toBe(1);
  });

  it('edits inside the hour and not after it', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-edit');
    makeMine(sim, TEXT_PLATFORM);
    const result = sim.execute<{ itemId: string }>({
      kind: 'feed.post',
      payload: { platform: TEXT_PLATFORM, text: 'First go.' },
    });
    const id = result.value!.itemId;
    expect(sim.execute({ kind: 'feed.edit', payload: { itemId: id, text: 'Second go.' } }).ok).toBe(true);
    expect(sim.universe.socialItems[id]!.text).toBe('Second go.');
    sim.advanceTo(sim.now + 3 * HOUR);
    expect(sim.execute({ kind: 'feed.edit', payload: { itemId: id, text: 'Third go.' } }).ok).toBe(false);
  });

  it('deletes what is yours and nothing that is not', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-delete');
    makeMine(sim, TEXT_PLATFORM);
    const mine = sim.execute<{ itemId: string }>({
      kind: 'feed.post', payload: { platform: TEXT_PLATFORM, text: 'Taking this down.' },
    }).value!.itemId;
    expect(sim.execute({ kind: 'feed.delete', payload: { itemId: mine } }).ok).toBe(true);
    expect(myProfile(sim, TEXT_PLATFORM)!.posts).toBe(0);
    const theirs = recentItems(sim, TEXT_PLATFORM, 1)[0]!;
    expect(sim.execute({ kind: 'feed.delete', payload: { itemId: theirs.id } }).ok).toBe(false);
  });

  it('quotes somebody', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-quote');
    makeMine(sim, TEXT_PLATFORM);
    const target = recentItems(sim, TEXT_PLATFORM, 1)[0]!;
    const result = sim.execute<{ itemId: string }>({
      kind: 'feed.quote', payload: { itemId: target.id, text: 'This is the bit that matters.' },
    });
    expect(result.ok).toBe(true);
    expect(sim.universe.socialItems[result.value!.itemId]!.parentId).toBe(target.id);
  });
});

describe('the time it takes off your day', () => {
  it('takes the minutes and leaves you differently for comedy than for politics', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-scroll');
    const before = sim.now;
    const result = sim.execute<{ minutes: number }>({
      kind: 'feed.scroll', payload: { platform: PHOTO_PLATFORM, minutes: 45 },
    });
    expect(result.ok).toBe(true);
    expect((sim.now - before) / 60_000).toBe(45);

    // An hour of the photo app and an hour of the text app are not the same
    // hour, because the text app is mostly news and argument.
    const calm = quickSave({ wealth: 'comfortable' }, 'social-calm');
    const rough = quickSave({ wealth: 'comfortable' }, 'social-rough');
    calm.player.wellbeing.stress = 50;
    rough.player.wellbeing.stress = 50;
    calm.execute({ kind: 'feed.scroll', payload: { platform: PHOTO_PLATFORM, minutes: 120 } });
    rough.execute({ kind: 'feed.scroll', payload: { platform: TEXT_PLATFORM, minutes: 120 } });
    expect(rough.player.wellbeing.stress).toBeGreaterThan(calm.player.wellbeing.stress);
  });
});

describe('the money', () => {
  it('pays nothing to an account nobody reads', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-broke');
    makeMine(sim, TEXT_PLATFORM);
    const payout = buildSocialPayout(sim, TEXT_PLATFORM, sim.now - 30 * DAY);
    expect(payout.ads).toBe(0);
    expect(payout.total).toBe(0);
  });

  it('takes Premium every month and lapses when it cannot', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-premium');
    makeMine(sim, TEXT_PLATFORM);
    const account = sim.player.primaryAccountId!;
    expect(sim.execute({ kind: 'feed.join_premium', payload: {} }).ok).toBe(true);
    expect(myProfile(sim, TEXT_PLATFORM)!.verified).toBe(true);
    const paid = () => Object.values(sim.universe.transactions)
      .filter((t) => /Premium/.test(t.memo ?? '')).length;
    const first = paid();
    sim.advanceTo(sim.now + 35 * DAY);
    expect(paid()).toBeGreaterThan(first);

    // With nothing to take it from it lapses, rather than running up a debt on
    // a subscription or quietly staying on for free.
    const due = sim.timeline.pending().find((i) => i.kind === 'feed.premium_renew')!;
    expect(due).toBeDefined();
    sim.player.primaryAccountId = undefined;
    sim.advanceTo(due.at + HOUR);
    expect(myProfile(sim, TEXT_PLATFORM)!.verified).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'Premium Lapsed')).toBe(true);
    void account;
  });

  it('pays the advertising share on impressions, and only with Premium', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-share');
    makeMine(sim, TEXT_PLATFORM);
    const mine = myProfile(sim, TEXT_PLATFORM)!;
    mine.followers = 40_000;
    for (let n = 0; n < 6; n += 1) {
      sim.execute({ kind: 'feed.post', payload: { platform: TEXT_PLATFORM, text: `Post number ${n}.` } });
    }
    const month = sim.now - 1 * DAY;
    expect(buildSocialPayout(sim, TEXT_PLATFORM, month).ads).toBe(0);
    sim.execute({ kind: 'feed.join_premium', payload: {} });
    const withIt = buildSocialPayout(sim, TEXT_PLATFORM, month);
    expect(withIt.ads).toBeGreaterThan(0);
    expect(withIt.monetizedViews).toBeGreaterThan(0);
  });

  it('pays the photo app through the audience, not through reach', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-subs');
    makeMine(sim, PHOTO_PLATFORM);
    const mine = myProfile(sim, PHOTO_PLATFORM)!;
    mine.followers = 400_000;
    for (let n = 0; n < 4; n += 1) {
      sim.execute({ kind: 'feed.post', payload: { platform: PHOTO_PLATFORM, kind: 'reel', text: `Reel ${n}.`, images: ['x'] } });
    }
    const payout = buildSocialPayout(sim, PHOTO_PLATFORM, sim.now - 1 * DAY);
    expect(payout.ads).toBe(0);
    expect(payout.memberships).toBeGreaterThan(0);
  });

  it('will not send a gift that is not one of the amounts', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-gift');
    const target = handle(sim, PHOTO_PLATFORM, 'thepastryhour');
    expect(sim.execute({ kind: 'feed.gift', payload: { profileId: target.id, amount: 137 } }).ok).toBe(false);
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    expect(sim.execute({ kind: 'feed.gift', payload: { profileId: target.id, amount: GIFT_STEPS[1] } }).ok).toBe(true);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - GIFT_STEPS[1]!);
  });

  it('counts a Premium subscription as a cost and not as somebody else earning', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-premium-cost');
    makeMine(sim, TEXT_PLATFORM);
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    sim.execute({ kind: 'feed.join_premium', payload: {} });
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - X_PREMIUM_MONTHLY);
  });
});

describe('analytics', () => {
  it('reads off what you actually put up', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-analytics');
    makeMine(sim, PHOTO_PLATFORM);
    const mine = myProfile(sim, PHOTO_PLATFORM)!;
    mine.followers = 12_000;
    sim.execute({ kind: 'feed.post', payload: { platform: PHOTO_PLATFORM, text: 'One.', images: ['x'] } });
    sim.execute({ kind: 'feed.post', payload: { platform: PHOTO_PLATFORM, text: 'Two.', images: ['x'] } });
    const stats = socialAnalytics(sim, mine.id);
    expect(stats.posts).toBe(2);
    expect(stats.impressions).toBeGreaterThan(0);
    expect(stats.best).toBeDefined();
    expect(impressionsOf(stats.best!)).toBeGreaterThan(0);
  });
});

describe('how the apps are set up', () => {
  it('takes a muted account off the feed and leaves it in search', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-mute');
    const target = handle(sim, TEXT_PLATFORM, 'thewire');
    expect(sim.execute({ kind: 'feed.mute', payload: { profileId: target.id } }).ok).toBe(true);
    expect(isMuted(sim, target.id)).toBe(true);
    for (const item of homeFeed(sim, TEXT_PLATFORM, 40)) expect(item.profileId).not.toBe(target.id);
    expect(searchSocial(sim, TEXT_PLATFORM, 'thewire').profiles.length).toBeGreaterThan(0);
  });

  it('takes a blocked account off search as well, and undoes the follow', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-block');
    const target = handle(sim, PHOTO_PLATFORM, 'northlight');
    sim.execute({ kind: 'feed.follow', payload: { profileId: target.id } });
    expect(sim.execute({ kind: 'feed.block', payload: { profileId: target.id } }).ok).toBe(true);
    expect(isBlocked(sim, target.id)).toBe(true);
    expect(isFollowing(sim, sim.player.id, target.id)).toBe(false);
    expect(searchSocial(sim, PHOTO_PLATFORM, 'northlight').profiles.length).toBe(0);
  });

  it('keeps a hidden word out of the room', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-hidden');
    const post = recentItems(sim, TEXT_PLATFORM, 1).find((i) => i.comments > 200)!;
    const before = repliesTo(sim, post.id);
    expect(before.length).toBeGreaterThan(0);
    const word = before[0]!.text.split(' ')[0]!;
    sim.execute({ kind: 'feed.settings', payload: { hiddenWords: [word] } });
    expect(isHidden(sim, before[0]!.text)).toBe(true);
    expect(repliesTo(sim, post.id).some((r) => r.text === before[0]!.text)).toBe(false);
  });

  it('grows a private account more slowly than a public one', () => {
    const post = (label: string, isPrivate: boolean) => {
      const sim = quickSave({ wealth: 'comfortable' }, label);
      makeMine(sim, PHOTO_PLATFORM);
      if (isPrivate) sim.execute({ kind: 'feed.settings', payload: { privateAccount: true } });
      const mine = myProfile(sim, PHOTO_PLATFORM)!;
      mine.followers = 10_000;
      for (let n = 0; n < 5; n += 1) {
        sim.execute({ kind: 'feed.post', payload: { platform: PHOTO_PLATFORM, text: `One ${n}.`, images: ['x'] } });
      }
      return mine.followers;
    };
    expect(post('social-private', true)).toBeLessThan(post('social-public', false));
  });

  it('counts the minutes the app actually took', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-screen');
    expect(screenTime(sim, PHOTO_PLATFORM)).toBe(0);
    sim.execute({ kind: 'feed.scroll', payload: { platform: PHOTO_PLATFORM, minutes: 40 } });
    expect(screenTime(sim, PHOTO_PLATFORM)).toBe(40);
    expect(screenTime(sim, TEXT_PLATFORM)).toBe(0);
  });

  it('charges for the verified badge and lets it go', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-verified');
    makeMine(sim, PHOTO_PLATFORM);
    const account = sim.player.primaryAccountId!;
    const before = sim.ledger.availableFunds(account);
    expect(sim.execute({ kind: 'feed.join_verified', payload: {} }).ok).toBe(true);
    expect(myProfile(sim, PHOTO_PLATFORM)!.verified).toBe(true);
    expect(sim.ledger.availableFunds(account)).toBe(before - PHOTO_VERIFIED_MONTHLY);
    expect(sim.execute({ kind: 'feed.leave_verified', payload: {} }).ok).toBe(true);
    expect(settingsOf(sim).photoVerified).toBe(false);
  });
});

describe('messages', () => {
  it('costs the couple of minutes and opens a thread', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-dm');
    makeMine(sim, PHOTO_PLATFORM);
    const target = handle(sim, PHOTO_PLATFORM, 'thedarkroomdoor');
    const before = sim.now;
    expect(sim.execute({ kind: 'feed.message', payload: { profileId: target.id, text: 'That print is wonderful.' } }).ok).toBe(true);
    expect(sim.now).toBeGreaterThan(before);
    expect(messagesWith(sim, target.id).length).toBe(1);
    const threads = threadsOf(sim);
    expect(threads.length).toBe(1);
    expect(threads[0]!.waiting).toBe(true);
  });

  it('will not message yourself, and needs an account first', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-dm-guard');
    const target = handle(sim, PHOTO_PLATFORM, 'kerbside');
    expect(sim.execute({ kind: 'feed.message', payload: { profileId: target.id, text: 'Hello.' } }).ok).toBe(false);
    makeMine(sim, PHOTO_PLATFORM);
    const mine = myProfile(sim, PHOTO_PLATFORM)!;
    expect(sim.execute({ kind: 'feed.message', payload: { profileId: mine.id, text: 'Hello.' } }).ok).toBe(false);
  });

  it('sometimes gets an answer, and it arrives later', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-dm-reply');
    makeMine(sim, PHOTO_PLATFORM);
    // Small accounts are the ones that write back, so try enough of them that
    // at least one does rather than asserting on a single roll.
    const small = profilesOf(sim, PHOTO_PLATFORM)
      .filter((p) => !p.ownerId && p.followers < 120_000)
      .slice(0, 12);
    for (const profile of small) {
      sim.execute({ kind: 'feed.follow', payload: { profileId: profile.id } });
      sim.execute({ kind: 'feed.message', payload: { profileId: profile.id, text: 'Loved the last one.' } });
    }
    sim.advanceTo(sim.now + 3 * DAY);
    const answered = threadsOf(sim).filter((t) => !t.waiting);
    expect(answered.length).toBeGreaterThan(0);
    expect(answered[0]!.unread).toBeGreaterThan(0);
    sim.execute({ kind: 'feed.read_messages', payload: { profileId: answered[0]!.profile.id } });
    expect(threadsOf(sim).find((t) => t.profile.id === answered[0]!.profile.id)!.unread).toBe(0);
  });

  it('keeps a note for a day and then drops it', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'social-note');
    makeMine(sim, PHOTO_PLATFORM);
    const mine = myProfile(sim, PHOTO_PLATFORM)!;
    sim.execute({ kind: 'feed.set_note', payload: { text: 'Out on the water.' } });
    expect(noteOf(sim, mine)).toBe('Out on the water.');
    sim.advanceTo(sim.now + 2 * DAY);
    expect(noteOf(sim, mine)).toBeUndefined();
  });
});
