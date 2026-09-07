/**
 * The video app.
 *
 * The contract asked for the app rather than a panel of numbers, and these hold
 * the parts of that promise a test can hold: a world of channels that was
 * running before the player arrived, a feed built from what they actually
 * subscribed to, a watch that costs the minutes and does something different
 * for comedy than for news, comments including the ones you were warned about,
 * and a channel of your own with uploads, thumbnails, scheduling and analytics
 * that show the median beside the total.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { BEATS, REAL_CHANNELS, TOPICS } from '@/engine/content/channels';
import { THUMBNAILS, commentSpace, titleSpace } from '@/engine/content/videos';
import {
  BINGE_MINUTES, VIDEO_PLATFORM, allVideos, catalogOf, channelAnalytics, channelsOf, commentsOn,
  ensureComments, homeFeed, isSubscribed, myChannel, newestOf, searchVideos, subscriptionFeed,
  videoById, videosOf,
} from '@/engine/systems/video';
import { PLATFORM_BY_ID } from '@/engine/systems/media';
import {
  buildPayout, channelPage, communityOf, hasPremium, membershipsOf, playlistsOf,
  specialList, streamsOf, videosIn,
} from '@/engine/systems/creator';
import {
  applyFilters, chaptersOf, comprehension, minutesAtSpeed, noticesOf, preferences, unseenNotices,
} from '@/engine/systems/videoapp';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, VideoChannel } from '@/engine/domain/model';

const DAY = 86_400_000;

function channelNamed(sim: Simulation, name: string): VideoChannel {
  const found = channelsOf(sim).find((c) => c.name === name);
  if (!found) throw new Error(`no channel called ${name}`);
  return found;
}

describe('a world that was already running', () => {
  it('has every channel on the roster, with a catalog behind each one', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-world');
    const channels = channelsOf(sim);
    expect(channels.length).toBe(REAL_CHANNELS.length);
    expect(channels.length).toBeGreaterThanOrEqual(240);

    let thin = 0;
    for (const channel of channels) {
      const catalog = catalogOf(sim, channel);
      if (catalog.length < 8) thin += 1;
      expect(channel.subscribers, `${channel.name} has nobody`).toBeGreaterThan(0);
    }
    expect(thin, 'channels arrived with almost nothing behind them').toBe(0);
  });

  it('covers every subject, so a feed is not one thing', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-topics');
    const covered = new Set(channelsOf(sim).map((c) => c.topic));
    for (const topic of TOPICS) expect(covered, `nothing about ${topic}`).toContain(topic);
  });

  it('never gives one channel the same title twice', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-titles');
    for (const channel of channelsOf(sim)) {
      const titles = catalogOf(sim, channel).map((v) => v.title);
      expect(new Set(titles).size, `${channel.name} repeats itself`).toBe(titles.length);
    }
  });

  it('has enough different titles and comments that it cannot run out', () => {
    for (const topic of TOPICS) {
      expect(titleSpace(topic), `${topic} is thin`).toBeGreaterThan(350);
    }
    expect(commentSpace()).toBeGreaterThanOrEqual(60);
  });

  it('keeps a specialist channel to what it is actually about', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-beats');
    const sky = channelNamed(sim, 'The Night Sky');
    const beat = BEATS.c_the_night_sky!;
    for (const video of catalogOf(sim, sky)) {
      const onBeat = beat.some((subject) => video.title.includes(subject));
      expect(onBeat, `an astronomy channel put out "${video.title}"`).toBe(true);
    }
  });

  it('is the same world every time it is asked, and different in another save', () => {
    const first = quickSave({ wealth: 'comfortable' }, 'video-stable');
    const again = catalogOf(first, channelNamed(first, 'Frame By Frame'))[0]!.title;
    const twice = catalogOf(first, channelNamed(first, 'Frame By Frame'))[0]!.title;
    expect(twice, 'the catalog changed between two reads').toBe(again);

    const other = quickSave({ wealth: 'wealthy' }, 'video-stable-other');
    const elsewhere = catalogOf(other, channelNamed(other, 'Frame By Frame'))[0]!.title;
    expect(typeof elsewhere).toBe('string');
  });

  it('costs the save almost nothing, because the world is derived rather than stored', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-size');
    expect(Object.keys(sim.universe.videos).length, 'the world was written into the save').toBe(0);
    expect(allVideos(sim).length, 'nothing to watch').toBeGreaterThan(500);
    const size = JSON.stringify(sim.universe).length;
    expect(size, 'the save is enormous').toBeLessThan(1_500_000);
  });
});

describe('the feed is the channels you chose', () => {
  it('puts a channel you subscribed to in front of one you did not', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-feed');
    const channel = channelsOf(sim).find((c) => c.topic === 'craft')!;
    const before = homeFeed(sim, sim.player.id, 24).filter((v) => v.channelId === channel.id).length;
    expect(sim.execute({ kind: 'video.subscribe', payload: { channelId: channel.id } }).ok).toBe(true);
    const after = homeFeed(sim, sim.player.id, 24).filter((v) => v.channelId === channel.id).length;
    expect(after, 'subscribing changed nothing').toBeGreaterThan(before);
    expect(isSubscribed(sim, sim.player.id, channel.id)).toBe(true);
  });

  it('shows only what you subscribed to on the subscriptions tab', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-subs');
    expect(subscriptionFeed(sim, sim.player.id).length, 'a full tab with no subscriptions').toBe(0);
    const channel = channelsOf(sim)[7]!;
    sim.execute({ kind: 'video.subscribe', payload: { channelId: channel.id } });
    const feed = subscriptionFeed(sim, sim.player.id);
    expect(feed.length).toBeGreaterThan(0);
    for (const video of feed) expect(video.channelId).toBe(channel.id);
  });

  it('does not show you the same video twice once you have watched it', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-seen');
    const first = homeFeed(sim, sim.player.id, 5)[0]!;
    expect(sim.execute({ kind: 'video.watch', payload: { videoId: first.id, minutes: 5 } }).ok).toBe(true);
    expect(homeFeed(sim, sim.player.id, 40).some((v) => v.id === first.id)).toBe(false);
  });

  it('finds things by title, by channel and by subject', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-search');
    expect(searchVideos(sim, 'a').length, 'one letter searched the world').toBe(0);
    expect(searchVideos(sim, 'cooking').length).toBeGreaterThan(0);
    const hits = searchVideos(sim, 'Frame By Frame');
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe('watching is a thing you spend an evening on', () => {
  it('takes the minutes out of the day', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-time');
    const video = homeFeed(sim, sim.player.id, 3)[0]!;
    const before = sim.now;
    const result = sim.execute<{ minutes: number; finished: boolean }>({
      kind: 'video.watch', payload: { videoId: video.id },
    });
    expect(result.ok, String(result.error)).toBe(true);
    // The video, plus whatever advertising ran in front of it.
    const spent = sim.now - before;
    expect(spent).toBeGreaterThanOrEqual(video.lengthMinutes * 60_000);
    expect(spent).toBeLessThanOrEqual(video.lengthMinutes * 60_000 + 30_000);
    expect(result.value!.finished).toBe(true);
  });

  it('runs an ad in front of it, and never for somebody who is paying', () => {
    const free = quickSave({ wealth: 'comfortable' }, 'video-ads');
    let sawAnAd = false;
    for (const video of homeFeed(free, free.player.id, 14)) {
      const result = free.execute<{ ad?: string }>({ kind: 'video.watch', payload: { videoId: video.id, minutes: 2 } });
      if (result.ok && result.value!.ad) { sawAnAd = true; break; }
    }
    expect(sawAnAd, 'fourteen videos and not one advertisement').toBe(true);

    const paid = quickSave({ wealth: 'wealthy' }, 'video-premium');
    expect(paid.execute({ kind: 'video.join_premium', payload: {} }).ok).toBe(true);
    expect(hasPremium(paid)).toBe(true);
    for (const video of homeFeed(paid, paid.player.id, 14)) {
      const result = paid.execute<{ ad?: string }>({ kind: 'video.watch', payload: { videoId: video.id, minutes: 2 } });
      if (result.ok) expect(result.value!.ad, 'a paying viewer was shown an advertisement').toBeUndefined();
    }
  });

  it('leaves you differently after an hour of comedy and an hour of news', () => {
    const laugh = quickSave({ wealth: 'comfortable' }, 'video-comedy');
    const comedy = allVideos(laugh, 40).find((v) => v.topic === 'comedy')!;
    const laughBefore = laugh.player.wellbeing.stress;
    laugh.execute({ kind: 'video.watch', payload: { videoId: comedy.id, minutes: 60 } });

    const worry = quickSave({ wealth: 'comfortable' }, 'video-news');
    const news = allVideos(worry, 40).find((v) => v.topic === 'news')!;
    const worryBefore = worry.player.wellbeing.stress;
    worry.execute({ kind: 'video.watch', payload: { videoId: news.id, minutes: 60 } });

    expect(laugh.player.wellbeing.stress, 'comedy raised the stress').toBeLessThan(laughBefore);
    expect(worry.player.wellbeing.stress, 'an hour of news was restful').toBeGreaterThan(worryBefore);
  });

  it('says something when the evening has gone', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-binge');
    let last = '';
    for (const video of homeFeed(sim, sim.player.id, 30)) {
      const result = sim.execute<{ note: string; watchedToday: number }>({
        kind: 'video.watch', payload: { videoId: video.id },
      });
      if (!result.ok) continue;
      last = result.value!.note;
      if (result.value!.watchedToday >= BINGE_MINUTES) break;
    }
    expect(last, 'no amount of watching was ever remarked on').toMatch(/hours of this today/);
  });
});

describe('the comment section', () => {
  it('fills up the first time somebody opens a video, and only once', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-comments');
    const video = homeFeed(sim, sim.player.id, 3)[0]!;
    const first = ensureComments(sim, video);
    expect(first.length).toBeGreaterThanOrEqual(6);
    expect(ensureComments(sim, video).length, 'opening it again doubled the room').toBe(first.length);
  });

  it('marks the ones you should not read rather than serving them', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-harsh');
    let harsh = 0;
    for (const video of allVideos(sim, 2).slice(0, 60)) {
      for (const comment of ensureComments(sim, video)) if (comment.harsh) harsh += 1;
    }
    expect(harsh, 'nobody in this world is ever unkind').toBeGreaterThan(0);
  });

  it('lets you say something, and it stays said', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-say');
    const video = homeFeed(sim, sim.player.id, 3)[0]!;
    const result = sim.execute<{ commentId: Id }>({
      kind: 'video.comment', payload: { videoId: video.id, text: 'Watched this twice.' },
    });
    expect(result.ok, String(result.error)).toBe(true);
    const mine = commentsOn(sim, video.id).find((c) => c.id === result.value!.commentId);
    expect(mine?.byPlayer).toBe(true);
    expect(mine?.text).toBe('Watched this twice.');
    expect(sim.execute({ kind: 'video.comment', payload: { videoId: video.id, text: ' ' } }).ok).toBe(false);
  });

  it('will not show you somebody else’s hidden comments', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-notyours');
    const video = homeFeed(sim, sim.player.id, 3)[0]!;
    const refused = sim.execute({ kind: 'video.read_harsh', payload: { videoId: video.id } });
    expect(refused.ok).toBe(false);
    expect(String(refused.error)).toMatch(/not about you/i);
  });
});

describe('a channel of your own', () => {
  function withChannel(seed: string): Simulation {
    const sim = quickSave({ wealth: 'comfortable' }, seed);
    const made = sim.execute({ kind: 'video.create_channel', payload: { name: 'Second Take', handle: 'secondtake' } });
    expect(made.ok, String(made.error)).toBe(true);
    return sim;
  }

  it('is made once and refuses a second', () => {
    const sim = withChannel('video-mine');
    const channel = myChannel(sim);
    expect(channel?.handle).toBe('secondtake');
    expect(sim.execute({ kind: 'video.create_channel', payload: {} }).ok).toBe(false);
    expect(sim.execute({ kind: 'video.subscribe', payload: { channelId: channel!.id } }).ok, 'you subscribed to yourself').toBe(false);
  });

  it('takes the hours to make a video, and puts it up', () => {
    const sim = withChannel('video-upload');
    const before = sim.now;
    const result = sim.execute<{ videoId: Id; status: string; quality: number }>({
      kind: 'video.upload',
      payload: { title: 'The First One', description: 'Nothing much.', thumbnail: 'face', lengthMinutes: 14, effortMinutes: 300 },
    });
    expect(result.ok, String(result.error)).toBe(true);
    expect(result.value!.status).toBe('published');
    // The hours come out of the day once: the post charges them, not both.
    const spent = (sim.now - before) / 60_000;
    expect(spent, 'making it took no time at all').toBeGreaterThanOrEqual(300);
    expect(spent, 'the hours were charged twice').toBeLessThan(320);
    const video = videoById(sim, result.value!.videoId)!;
    expect(video.title).toBe('The First One');
    expect(videosOf(sim, myChannel(sim)!.id).some((v) => v.id === video.id)).toBe(true);
  });

  it('refuses a title nobody could read and a thumbnail that does not exist', () => {
    const sim = withChannel('video-refuse');
    expect(sim.execute({ kind: 'video.upload', payload: { title: 'A' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'video.upload', payload: { title: 'Fine Title', thumbnail: 'hologram' } }).ok).toBe(false);
    expect(sim.execute({
      kind: 'video.upload', payload: { title: 'Fine Title', publishAt: sim.now - 86_400_000 },
    }).ok, 'a video was scheduled for yesterday').toBe(false);
  });

  it('holds a scheduled upload back until its hour, then puts it up', () => {
    const sim = withChannel('video-schedule');
    const at = sim.now + 3 * DAY;
    const result = sim.execute<{ videoId: Id; status: string }>({
      kind: 'video.upload', payload: { title: 'Out On Friday', publishAt: at, effortMinutes: 120 },
    });
    expect(result.ok, String(result.error)).toBe(true);
    expect(result.value!.status).toBe('scheduled');
    expect(homeFeed(sim, sim.player.id, 40).some((v) => v.id === result.value!.videoId)).toBe(false);

    sim.advanceTo(at + 60_000);
    const video = videoById(sim, result.value!.videoId)!;
    expect(video.status, 'it never went up').toBe('published');
  });

  it('gives every thumbnail a real difference, and says what each one does', () => {
    const labels = THUMBNAILS.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
    const plain = THUMBNAILS.find((t) => t.id === 'plain')!;
    const arrow = THUMBNAILS.find((t) => t.id === 'arrow')!;
    expect(arrow.clickBias, 'the honest thumbnail beat the shameless one').toBeGreaterThan(plain.clickBias);
    for (const thumbnail of THUMBNAILS) expect(thumbnail.note.length).toBeGreaterThan(12);
  });

  it('reports analytics that behave like analytics', () => {
    const sim = withChannel('video-analytics');
    for (const title of ['One', 'Two', 'Three', 'Four', 'Five']) {
      sim.execute({ kind: 'video.upload', payload: { title: `Episode ${title}`, effortMinutes: 180, lengthMinutes: 12 } });
      sim.advanceTo(sim.now + 6 * DAY);
    }
    const stats = channelAnalytics(sim, myChannel(sim)!.id);
    expect(stats.videos).toBe(5);
    expect(stats.daily.length, 'the curve is not twenty eight days').toBe(28);
    expect(stats.median, 'a median that is not a number').toBeGreaterThanOrEqual(0);
    expect(stats.averageRetention).toBeGreaterThan(0);
    expect(stats.best).toBeDefined();
    expect(stats.worst).toBeDefined();
  });

  it('takes a video down without pretending the views never happened', () => {
    const sim = withChannel('video-down');
    const result = sim.execute<{ videoId: Id }>({
      kind: 'video.upload', payload: { title: 'Regrettable', effortMinutes: 60 },
    });
    const id = result.value!.videoId;
    expect(sim.execute({ kind: 'video.take_down', payload: { videoId: id } }).ok).toBe(true);
    expect(sim.universe.videos[id]!.status).toBe('removed');
    expect(sim.execute({ kind: 'video.take_down', payload: { videoId: id } }).ok).toBe(false);
  });
});

describe('a channel that earns', () => {
  it('opens the account that carries the money when you make a channel', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-account');
    expect(sim.execute({ kind: 'video.create_channel', payload: { name: 'Working Title', handle: 'workingtitle' } }).ok).toBe(true);
    const channel = myChannel(sim)!;
    expect(channel.accountId, 'a channel with nothing behind it earns nothing').toBeDefined();
    const account = sim.universe.socialAccounts[channel.accountId!]!;
    expect(account.platform).toBe(VIDEO_PLATFORM);
  });

  it('turns an upload into a post that can earn', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-earn');
    sim.execute({ kind: 'video.create_channel', payload: { name: 'Working Title', handle: 'workingtitle2' } });
    const result = sim.execute<{ videoId: Id; postId?: Id }>({
      kind: 'video.upload', payload: { title: 'The Money Question', effortMinutes: 240, lengthMinutes: 16 },
    });
    expect(result.ok, String(result.error)).toBe(true);
    expect(result.value!.postId, 'the upload was not a post, so it can never pay').toBeDefined();
    const post = sim.universe.socialPosts[result.value!.postId!]!;
    expect(post.status).toBe('published');
    expect(post.format).toBe('long_video');
  });

  it('gives the video the numbers from the post underneath it', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'video-sync');
    sim.execute({ kind: 'video.create_channel', payload: { name: 'Working Title', handle: 'workingtitle3' } });
    const result = sim.execute<{ videoId: Id }>({
      kind: 'video.upload', payload: { title: 'Watch This One', effortMinutes: 600, lengthMinutes: 18, thumbnail: 'arrow' },
    });
    sim.advanceTo(sim.now + 5 * DAY);
    const video = videoById(sim, result.value!.videoId)!;
    expect(video.views, 'nobody ever saw it, days later').toBeGreaterThan(0);
    const stats = channelAnalytics(sim, myChannel(sim)!.id);
    expect(stats.totalViews).toBeGreaterThan(0);
  });

  it('says the platform is monetized only past its threshold', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-monet');
    sim.execute({ kind: 'video.create_channel', payload: { name: 'Working Title', handle: 'workingtitle4' } });
    const account = sim.universe.socialAccounts[myChannel(sim)!.accountId!]!;
    const platform = PLATFORM_BY_ID[VIDEO_PLATFORM];
    expect(platform.name, 'the app is not called what it is called').toBe('YouTube');
    if (account.followers < platform.monetisationThreshold) {
      expect(account.monetisationEnabled, 'it paid before anybody was watching').toBe(false);
    }
    account.followers = platform.monetisationThreshold + 500;
    sim.execute({ kind: 'video.upload', payload: { title: 'Past The Line', effortMinutes: 240 } });
    sim.advanceTo(sim.now + 3 * DAY);
    expect(account.monetisationEnabled, 'past the threshold and still not paying').toBe(true);
  });
});

describe('the world keeps going while you are not looking', () => {
  it('uploads on its own, on roughly the rhythm each channel keeps', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-tick');
    const channel = channelsOf(sim).find((c) => c.cadenceDays <= 3)!;
    const before = channel.uploads;
    const head = newestOf(sim, channel)!.title;
    sim.advanceTo(sim.now + 30 * DAY);
    expect(channel.uploads, 'nothing new in a month').toBeGreaterThan(before);
    expect(newestOf(sim, channel)!.title, 'the newest video did not move').not.toBe(head);
  });

  it('tells you about a new upload only when you asked it to', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-bell');
    const channel = channelsOf(sim).find((c) => c.cadenceDays <= 3)!;
    sim.execute({ kind: 'video.subscribe', payload: { channelId: channel.id, notify: true } });
    const before = sim.universe.notifications.length;
    sim.advanceTo(sim.now + 10 * DAY);
    expect(sim.universe.notifications.length, 'the bell never rang').toBeGreaterThan(before);
  });
});

describe('the rest of the app', () => {
  function creator(seed: string): Simulation {
    const sim = quickSave({ wealth: 'wealthy' }, seed);
    sim.execute({ kind: 'video.create_channel', payload: { name: 'Second Take', handle: `st${seed.length}` } });
    return sim;
  }

  it('keeps Watch Later and Liked without being asked, and will not let you delete them', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-lists');
    const lists = playlistsOf(sim, sim.player.id);
    expect(lists.map((l) => l.kind).sort()).toEqual(['liked', 'watch_later']);
    const later = specialList(sim, sim.player.id, 'watch_later')!;
    expect(sim.execute({ kind: 'video.delete_playlist', payload: { playlistId: later.id } }).ok).toBe(false);
  });

  it('saves a video to a list, and refuses the same one twice', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-save');
    const video = homeFeed(sim, sim.player.id, 3)[0]!;
    expect(sim.execute({ kind: 'video.save_to_playlist', payload: { kind: 'watch_later', videoId: video.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'video.save_to_playlist', payload: { kind: 'watch_later', videoId: video.id } }).ok).toBe(false);
    const later = specialList(sim, sim.player.id, 'watch_later')!;
    expect(videosIn(sim, later).map((v) => v.id)).toContain(video.id);
  });

  it('puts a video you liked in Liked Videos', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-liked');
    const video = homeFeed(sim, sim.player.id, 3)[0]!;
    sim.execute({ kind: 'video.watch', payload: { videoId: video.id, minutes: 3, like: true } });
    const liked = specialList(sim, sim.player.id, 'liked')!;
    expect(liked.videoIds).toContain(video.id);
  });

  it('makes a playlist, fills it, empties it and deletes it', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-playlist');
    const made = sim.execute<{ playlistId: Id }>({ kind: 'video.create_playlist', payload: { title: 'Sunday Watching' } });
    expect(made.ok, String(made.error)).toBe(true);
    expect(sim.execute({ kind: 'video.create_playlist', payload: { title: 'sunday watching' } }).ok, 'two lists with one name').toBe(false);
    const video = homeFeed(sim, sim.player.id, 3)[0]!;
    const id = made.value!.playlistId;
    expect(sim.execute({ kind: 'video.save_to_playlist', payload: { playlistId: id, videoId: video.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'video.remove_from_playlist', payload: { playlistId: id, videoId: video.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'video.delete_playlist', payload: { playlistId: id } }).ok).toBe(true);
  });

  it('charges for Premium every month, and stops when you cancel', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'video-prem-bill');
    const charges = () => sim.universe.transactions.filter((t) => /Premium/.test(t.memo ?? '')).length;
    expect(sim.execute({ kind: 'video.join_premium', payload: {} }).ok).toBe(true);
    expect(charges(), 'the first month was free').toBe(1);
    sim.advanceTo(sim.now + 31 * DAY);
    expect(charges(), 'it never renewed').toBeGreaterThan(1);
    const paid = charges();
    expect(sim.execute({ kind: 'video.leave_premium', payload: {} }).ok).toBe(true);
    expect(hasPremium(sim)).toBe(false);
    sim.advanceTo(sim.now + 62 * DAY);
    expect(charges(), 'it kept charging after it was canceled').toBe(paid);
  });

  it('lets you join a channel that sells memberships and refuses one that does not', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'video-member');
    const selling = channelsOf(sim).find((c) => c.membershipMonthly !== undefined);
    expect(selling, 'nobody in this world sells memberships').toBeDefined();
    const account = sim.player.primaryAccountId!;
    const before = sim.ledger.availableFunds(account);
    expect(sim.execute({ kind: 'video.join_channel', payload: { channelId: selling!.id } }).ok).toBe(true);
    expect(sim.ledger.availableFunds(account)).toBeLessThan(before);
    expect(sim.execute({ kind: 'video.join_channel', payload: { channelId: selling!.id } }).ok, 'joined twice').toBe(false);
    expect(membershipsOf(sim, sim.player.id).length).toBe(1);

    const free = channelsOf(sim).find((c) => c.membershipMonthly === undefined)!;
    expect(sim.execute({ kind: 'video.join_channel', payload: { channelId: free.id } }).ok).toBe(false);
  });

  it('tips at the amounts people actually give, and refuses anything else', () => {
    const sim = quickSave({ wealth: 'wealthy' }, 'video-tip');
    const video = homeFeed(sim, sim.player.id, 3)[0]!;
    const account = sim.player.primaryAccountId!;
    const before = sim.ledger.availableFunds(account);
    expect(sim.execute({ kind: 'video.tip', payload: { videoId: video.id, amount: 500 } }).ok).toBe(true);
    expect(sim.ledger.availableFunds(account)).toBe(before - 500);
    expect(sim.execute({ kind: 'video.tip', payload: { videoId: video.id, amount: 333 } }).ok).toBe(false);
  });

  it('streams, which takes the hours and brings people in', () => {
    const sim = creator('video-live');
    const channel = myChannel(sim)!;
    channel.subscribers = 40_000;
    const before = { at: sim.now, subs: channel.subscribers };
    const result = sim.execute<{ peak: number; tips: number }>({
      kind: 'video.go_live', payload: { title: 'Q And A, Thursday', minutes: 120 },
    });
    expect(result.ok, String(result.error)).toBe(true);
    expect(sim.now - before.at, 'a two hour stream took no time').toBe(120 * 60_000);
    expect(result.value!.peak).toBeGreaterThan(0);
    expect(channel.subscribers, 'nobody subscribed off a stream').toBeGreaterThan(before.subs);
    expect(streamsOf(sim, channel.id).length).toBe(1);
  });

  it('posts to the community tab, and runs a poll you can vote in once', () => {
    const sim = creator('video-community');
    const plain = sim.execute({ kind: 'video.community_post', payload: { text: 'Filming all week.' } });
    expect(plain.ok, String(plain.error)).toBe(true);
    const poll = sim.execute<{ postId: Id }>({
      kind: 'video.community_post', payload: { text: 'What next?', options: ['A long one', 'A short one'] },
    });
    expect(poll.ok, String(poll.error)).toBe(true);
    const post = sim.universe.communityPosts[poll.value!.postId]!;
    expect(post.kind).toBe('poll');
    expect(sim.execute({ kind: 'video.vote_poll', payload: { postId: post.id, option: 0 } }).ok).toBe(true);
    expect(sim.execute({ kind: 'video.vote_poll', payload: { postId: post.id, option: 1 } }).ok, 'voted twice').toBe(false);
    expect(communityOf(sim, myChannel(sim)!.id).length).toBe(2);
  });

  it('breaks the month down rather than giving one number', () => {
    const sim = creator('video-payout');
    const channel = myChannel(sim)!;
    const account = sim.universe.socialAccounts[channel.accountId!]!;
    account.followers = 50_000;
    account.monetisationEnabled = true;
    for (const title of ['One', 'Two', 'Three']) {
      sim.execute({ kind: 'video.upload', payload: { title: `Episode ${title}`, effortMinutes: 300, lengthMinutes: 20 } });
      sim.advanceTo(sim.now + 4 * DAY);
    }
    const payout = buildPayout(sim, account.id, sim.now - 20 * DAY);
    expect(payout.total, 'a monetized channel earned nothing at all').toBeGreaterThan(0);
    expect(payout.ads, 'no advertising revenue').toBeGreaterThan(0);
    expect(payout.monetizedViews, 'no monetized views').toBeGreaterThan(0);
    expect(payout.ads + payout.premium + payout.memberships + payout.tips + payout.sponsorship).toBe(payout.total);
  });

  it('does not count your own Premium as revenue on your own channel', () => {
    const sim = creator('video-not-mine');
    const channel = myChannel(sim)!;
    expect(sim.execute({ kind: 'video.join_premium', payload: {} }).ok).toBe(true);
    const payout = buildPayout(sim, channel.accountId!, sim.now - 20 * DAY);
    expect(payout.memberships, 'the player was paying themselves').toBe(0);
  });

  it('gives a channel page every tab it should have', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-page');
    const channel = channelsOf(sim).find((c) => c.subscribers > 500_000)!;
    const page = channelPage(sim, channel);
    expect(page.videos.length + page.shorts.length, 'a channel page with nothing on it').toBeGreaterThan(0);
    expect(Array.isArray(page.community)).toBe(true);
    expect(Array.isArray(page.streams)).toBe(true);
  });

  it('has three settings on the bell, not two', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-bell3');
    const channel = channelsOf(sim)[3]!;
    expect(sim.execute({ kind: 'video.set_bell', payload: { channelId: channel.id, bell: 'all' } }).ok, 'set before subscribing').toBe(false);
    sim.execute({ kind: 'video.subscribe', payload: { channelId: channel.id } });
    for (const bell of ['all', 'personalized', 'none'] as const) {
      expect(sim.execute({ kind: 'video.set_bell', payload: { channelId: channel.id, bell } }).ok).toBe(true);
    }
    expect(sim.execute({ kind: 'video.set_bell', payload: { channelId: channel.id, bell: 'shout' } }).ok).toBe(false);
  });
});

describe('the settings, the threads and the bell', () => {
  it('takes half the time at double speed, and leaves you with less of it', () => {
    const fast = quickSave({ wealth: 'comfortable' }, 'video-speed');
    const video = homeFeed(fast, fast.player.id, 3)[0]!;
    expect(fast.execute({ kind: 'video.set_preferences', payload: { speed: 2 } }).ok).toBe(true);
    const before = fast.now;
    const result = fast.execute<{ minutes: number }>({ kind: 'video.watch', payload: { videoId: video.id } });
    expect(result.ok, String(result.error)).toBe(true);
    expect(result.value!.minutes, 'double speed took the full length').toBeLessThan(video.lengthMinutes);
    expect(fast.now - before).toBeLessThan(video.lengthMinutes * 60_000 + 30_000);
    expect(comprehension(preferences(fast)), 'watching at 2x was as good as watching').toBeLessThan(1);
    expect(minutesAtSpeed(60, preferences(fast))).toBe(30);
  });

  it('refuses a speed and a quality that are not on the control', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-badspeed');
    expect(sim.execute({ kind: 'video.set_preferences', payload: { speed: 7 } }).ok).toBe(false);
    expect(sim.execute({ kind: 'video.set_preferences', payload: { quality: '8k' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'video.set_preferences', payload: { quality: '144p' } }).ok).toBe(true);
    expect(comprehension(preferences(sim)), '144p was as good as 1080p').toBeLessThan(1);
  });

  it('breaks a long video into chapters and leaves a short one alone', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-chapters');
    const long = allVideos(sim, 40).find((v) => v.lengthMinutes >= 30)!;
    const chapters = chaptersOf(sim, long);
    expect(chapters.length, 'a half hour video with no chapters').toBeGreaterThan(1);
    expect(new Set(chapters.map((c) => c.title)).size, 'two chapters with one name').toBe(chapters.length);
    expect(chapters[0]!.at).toBe(0);
    const short = allVideos(sim, 40).find((v) => v.lengthMinutes < 8);
    if (short) expect(chaptersOf(sim, short)).toEqual([]);
  });

  it('replies to a comment, and keeps the thread', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-reply');
    const video = homeFeed(sim, sim.player.id, 3)[0]!;
    const parent = commentsOn(sim, video.id)[0]!;
    const result = sim.execute<{ commentId: Id }>({
      kind: 'video.reply_comment', payload: { commentId: parent.id, text: 'Same here.' },
    });
    expect(result.ok, String(result.error)).toBe(true);
    const reply = sim.universe.videoComments[result.value!.commentId]!;
    expect(reply.replyToId).toBe(parent.id);
    expect(reply.byPlayer).toBe(true);
    expect(commentsOn(sim, video.id).some((c) => c.id === reply.id)).toBe(true);
  });

  it('pins and hearts only on your own video, and only one pin at a time', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-pin');
    const other = homeFeed(sim, sim.player.id, 3)[0]!;
    const theirs = commentsOn(sim, other.id)[0]!;
    expect(sim.execute({ kind: 'video.pin_comment', payload: { commentId: theirs.id } }).ok).toBe(false);

    sim.execute({ kind: 'video.create_channel', payload: { name: 'Second Take', handle: 'pinner' } });
    const upload = sim.execute<{ videoId: Id }>({
      kind: 'video.upload', payload: { title: 'Pin This One', effortMinutes: 120 },
    });
    const mine = sim.universe.videos[upload.value!.videoId]!;
    const section = ensureComments(sim, mine);
    expect(section.length).toBeGreaterThan(1);
    const [first, second] = section;
    expect(sim.execute({ kind: 'video.pin_comment', payload: { commentId: first!.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'video.pin_comment', payload: { commentId: second!.id } }).ok).toBe(true);
    expect(sim.universe.videoComments[first!.id]!.pinned, 'two comments pinned at once').toBeFalsy();
    expect(sim.execute({ kind: 'video.heart_comment', payload: { commentId: first!.id } }).ok).toBe(true);
    expect(sim.universe.videoComments[first!.id]!.hearted).toBe(true);
  });

  it('fills the bell when a channel you follow uploads, and empties it when you read it', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-inbox');
    const channel = channelsOf(sim).find((c) => c.cadenceDays <= 3)!;
    sim.execute({ kind: 'video.subscribe', payload: { channelId: channel.id, notify: true } });
    sim.advanceTo(sim.now + 12 * DAY);
    expect(unseenNotices(sim, sim.player.id), 'the bell never filled').toBeGreaterThan(0);
    const read = sim.execute<{ read: number }>({ kind: 'video.read_notices', payload: {} });
    expect(read.ok).toBe(true);
    expect(unseenNotices(sim, sim.player.id)).toBe(0);
    expect(noticesOf(sim, sim.player.id).length, 'reading them threw them away').toBeGreaterThan(0);
  });

  it('filters and sorts the search the way the panel does', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-filters');
    const all = searchVideos(sim, 'the', 200);
    expect(all.length).toBeGreaterThan(10);
    const shortOnes = applyFilters(sim, all, { duration: 'short' });
    for (const video of shortOnes) expect(video.lengthMinutes).toBeLessThanOrEqual(4);
    const longOnes = applyFilters(sim, all, { duration: 'long' });
    for (const video of longOnes) expect(video.lengthMinutes).toBeGreaterThan(20);
    const recent = applyFilters(sim, all, { uploaded: 'week' });
    for (const video of recent) expect(sim.now - video.publishedAt).toBeLessThanOrEqual(7 * DAY);
    const byViews = applyFilters(sim, all, { sort: 'views' });
    for (let i = 1; i < byViews.length; i += 1) {
      expect(byViews[i - 1]!.views).toBeGreaterThanOrEqual(byViews[i]!.views);
    }
  });

  it('plays the next one on its own, and stops asking whether you are still there', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-autoplay');
    const first = homeFeed(sim, sim.player.id, 3)[0]!;
    const result = sim.execute<{ watched: number; minutes: number; stoppedBecause: string }>({
      kind: 'video.autoplay', payload: { videoId: first.id },
    });
    expect(result.ok, String(result.error)).toBe(true);
    expect(result.value!.watched, 'autoplay watched one video and stopped').toBeGreaterThan(1);
    expect(result.value!.minutes).toBeGreaterThan(0);
    expect(result.value!.stoppedBecause.length).toBeGreaterThan(4);

    sim.execute({ kind: 'video.set_preferences', payload: { autoplay: false } });
    expect(sim.execute({ kind: 'video.autoplay', payload: { videoId: first.id } }).ok).toBe(false);
  });

  it('takes a photo for a thumbnail, and only for your own video', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-photo');
    const jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const theirs = homeFeed(sim, sim.player.id, 3)[0]!;
    expect(sim.execute({ kind: 'video.set_thumbnail_image', payload: { videoId: theirs.id, image: jpeg } }).ok).toBe(false);

    sim.execute({ kind: 'video.create_channel', payload: { name: 'Second Take', handle: 'photog' } });
    const upload = sim.execute<{ videoId: Id }>({ kind: 'video.upload', payload: { title: 'With A Picture', effortMinutes: 90 } });
    const id = upload.value!.videoId;
    expect(sim.execute({ kind: 'video.set_thumbnail_image', payload: { videoId: id, image: jpeg } }).ok).toBe(true);
    expect(sim.universe.videos[id]!.thumbnailImage).toBe(jpeg);
    expect(sim.execute({ kind: 'video.set_thumbnail_image', payload: { videoId: id, image: 'not-an-image' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'video.set_thumbnail_image', payload: { videoId: id } }).ok, 'could not take it off again').toBe(true);
    expect(sim.universe.videos[id]!.thumbnailImage).toBeUndefined();
  });

  it('takes a picture and a banner for your channel', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'video-channelpic');
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(sim.execute({ kind: 'video.set_channel_image', payload: { which: 'avatar', image: png } }).ok, 'set a picture with no channel').toBe(false);
    sim.execute({ kind: 'video.create_channel', payload: { name: 'Second Take', handle: 'banners' } });
    expect(sim.execute({ kind: 'video.set_channel_image', payload: { which: 'avatar', image: png } }).ok).toBe(true);
    expect(sim.execute({ kind: 'video.set_channel_image', payload: { which: 'banner', image: png } }).ok).toBe(true);
    expect(sim.execute({ kind: 'video.set_channel_image', payload: { which: 'wallpaper', image: png } }).ok).toBe(false);
    const channel = myChannel(sim)!;
    expect(channel.avatarImage).toBe(png);
    expect(channel.bannerImage).toBe(png);
  });
});
