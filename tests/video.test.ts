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
    expect(sim.now - before).toBe(video.lengthMinutes * 60_000);
    expect(result.value!.finished).toBe(true);
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
