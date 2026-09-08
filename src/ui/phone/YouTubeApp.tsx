/**
 * SLATE — YouTube, on the phone.
 *
 * The contract asked for the app rather than a panel of numbers, so this is
 * laid out the way the app is laid out: a top bar with the mark, a row of
 * chips, a feed of thumbnail cards, a bottom bar with Home, Shorts, upload,
 * Subscriptions and You. A video opens on a watch page with the player, the
 * title and view count, the action pills, the channel row with a subscribe
 * button, the description, the comments and what is up next.
 *
 * Nothing here is decoration. Pressing play runs `video.watch`, which takes the
 * minutes out of the day and does to you what an hour of that subject does.
 * Subscribing changes what the feed shows tomorrow. Uploading takes an evening,
 * makes a video that people either click or do not depending on the thumbnail
 * you chose, and turns up in your own analytics with the rest.
 *
 * The mark is drawn in CSS. SLATE ships no third party artwork.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { MS_DAY } from '@/engine/core/time';
import { THUMBNAILS, THUMBNAIL_BY_ID } from '@/engine/content/videos';
import { SOUNDS } from '@/engine/content/clipworld';
import {
  BINGE_MINUTES, catalogOf, channelAnalytics, commentsOn, homeFeed, isSubscribed,
  minutesWatchedSince, myChannel, searchVideos, subscriptionFeed, subscriptionsOf,
  videoById, videosOf, watchedIds,
} from '@/engine/systems/video';
import { PLATFORM_BY_ID, accountSummary, sponsorshipRate } from '@/engine/systems/media';
import { formatMoney } from '@/engine/core/money';
import { plural } from '@/engine/core/text';
import { VIDEO_PLATFORM } from '@/engine/systems/video';
import type { BrandDeal, VideoChannel, VideoItem } from '@/engine/domain/model';
import type { PhoneTheme } from './Phone';
import {
  AccountGlyph, ArrowShareGlyph, BackGlyph, BadgeGlyph, BellGlyph, ChartGlyph, ChevronRightGlyph,
  CaptionsGlyph, ClockGlyph, CloseGlyph, CommentGlyph, CreateGlyph, DislikeGlyph, DocGlyph, DownGlyph,
  DownloadGlyph, FamilyGlyph, FlaskGlyph, FlipGlyph, GearGlyph, HdGlyph, HeartGlyph, HelpGlyph,
  HomeGlyph, LikeGlyph, LinkedGlyph, LiveGlyph, LockGlyph, MoreGlyph, MusicGlyph,
  PlayTriangleGlyph, RemixGlyph, SearchGlyph, ShareGlyph, ShieldGlyph, ShortsGlyph, SpeedGlyph,
  SparkleGlyph, SubsGlyph, TagGlyph, TickGlyph, TimerGlyph, TranslateGlyph, TvGlyph, UploadGlyph,
  FeedbackGlyph, InfoGlyph,
} from './Icons';
import {
  ChannelPage, LibraryPage, PremiumPanel, QuickSave, SaveSheet, StudioPage, TipSheet,
} from './YouTubeExtras';
import { hasPremium } from '@/engine/systems/creator';
import {
  QUALITIES, SPEEDS, applyFilters, chaptersOf, hasCaptions, minutesAtSpeed, noticesOf,
  preferences, unseenNotices,
} from '@/engine/systems/videoapp';
import { ImagePicker } from './ImagePicker';
import { EmojiRow } from './EmojiRow';

type Tab = 'home' | 'shorts' | 'subs' | 'you';

/** Shorts are the ones you would actually swipe past. */
const SHORT_MINUTES = 12;

// ---------------------------------------------------------------------------
// Small formatters, the ones the app itself uses
// ---------------------------------------------------------------------------

function views(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return String(count);
}

function ago(now: number, then: number): string {
  const days = Math.floor((now - then) / MS_DAY);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 31) { const w = Math.floor(days / 7); return `${w} week${w === 1 ? '' : 's'} ago`; }
  if (days < 365) { const m = Math.floor(days / 30); return `${m} month${m === 1 ? '' : 's'} ago`; }
  const y = Math.floor(days / 365);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

function duration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}:00` : `${mins}:00`;
}

/** A channel's circle. Its color comes from its name, so it is always the same one. */
function tint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${hash} 46% 42%)`;
}

function initials(name: string): string {
  const words = name.replace(/^@/, '').replace(/^The /, '').split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

function Avatar({ name, size = 36, image }: { name: string; size?: number; image?: string }) {
  return (
    <span
      className="ph-avatar"
      style={{ background: tint(name), width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {image ? <img src={image} alt="" /> : initials(name)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// The app
// ---------------------------------------------------------------------------

export function YouTubeApp({ theme }: { theme: PhoneTheme }) {
  void theme;
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('home');
  const [openId, setOpenId] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [screen, setScreen] = useState<'app' | 'library' | 'studio' | 'notices' | 'settings' | 'appsettings'>('app');
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  // A remix opens Create on the camera with the sound already loaded.
  const [remixSound, setRemixSound] = useState<string | undefined>();
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const now = useWorld((s) => s.now);
  const open = useWorld((s) => (openId ? videoById(s, openId) : undefined));
  const channel = useWorld((s) => (channelId ? s.universe.videoChannels[channelId] : undefined));
  const unseen = useWorld((s) => unseenNotices(s, s.player.id));
  // The dot on Subscriptions is the app saying somebody you follow has posted
  // today. It is read off the feed rather than decoration.
  const fresh = useWorld((s) => subscriptionFeed(s, s.player.id, 12)
    .filter((one) => s.now - one.publishedAt < MS_DAY).length);
  const premium = useWorld(hasPremium);
  const mine = useWorld(myChannel);

  const say = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((current) => (current === text ? null : current)), 4200);
  };

  const watch = (video: VideoItem, minutes?: number, like?: boolean) => {
    const result = run<{ note: string; minutes: number }>('video.watch', { videoId: video.id, minutes, like });
    if (result.ok) say(`${result.value!.minutes} minutes. ${result.value!.note}`);
  };

  const row = (video: VideoItem) => <RowCard video={video} now={now} onOpen={setOpenId} />;

  return (
    <div className="ph-app-screen">
      {channel ? (
        <ChannelPage
          channel={channel}
          now={now}
          onBack={() => setChannelId(null)}
          say={say}
          renderRow={row}
        />
      ) : screen === 'library' ? (
        <LibraryPage onBack={() => setScreen('app')} say={say} renderRow={row} />
      ) : screen === 'studio' ? (
        <StudioPage onBack={() => setScreen('app')} say={say} />
      ) : screen === 'notices' ? (
        <NoticesPage now={now} onBack={() => setScreen('app')} onOpen={setOpenId} onChannel={setChannelId} />
      ) : screen === 'settings' ? (
        <PlaybackSettings onBack={() => setScreen('app')} />
      ) : screen === 'appsettings' ? (
        <AppSettings
          onBack={() => setScreen('app')}
          onPlayback={() => setScreen('settings')}
          onLibrary={() => setScreen('library')}
          say={say}
        />
      ) : open ? (
        <WatchPage
          video={open}
          now={now}
          onBack={() => setOpenId(null)}
          onOpen={setOpenId}
          onChannel={(id) => { setOpenId(null); setChannelId(id); }}
          onSettings={() => setScreen('settings')}
          onWatch={watch}
          say={say}
        />
      ) : searching ? (
        <SearchPage
          query={query}
          setQuery={setQuery}
          now={now}
          onClose={() => setSearching(false)}
          onOpen={(id) => { setSearching(false); setOpenId(id); }}
        />
      ) : uploading ? (
        <UploadPage onClose={() => { setUploading(false); setRemixSound(undefined); }} say={say} remixSound={remixSound} />
      ) : (
        <>
          {tab !== 'shorts' && (
          <div className="ph-yt-top">
            {tab === 'you' ? (
              <button type="button" className="ph-yt-accounts" onClick={() => say(`Signed in as ${sim.player.displayName}. SLATE keeps one life, so there is nothing to switch to.`)}>
                Accounts <DownGlyph size={13} />
              </button>
            ) : (
              <span className="ph-yt-word">
                <span className="ph-play" aria-hidden="true" />
                <b>{premium ? 'Premium' : 'YouTube'}</b>
              </span>
            )}
            <span className="ph-yt-actions">
              <button
                type="button"
                className="ph-iconbtn"
                aria-label="Comments On Your Videos"
                onClick={() => setScreen('notices')}
              >
                <CommentGlyph size={23} />
              </button>
              <button
                type="button"
                className="ph-iconbtn"
                aria-label={unseen > 0 ? `Notifications, ${unseen} new` : 'Notifications'}
                onClick={() => setScreen('notices')}
                style={{ position: 'relative' }}
              >
                <BellGlyph size={23} />
                {unseen > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute', top: -3, right: -5, minWidth: 15, height: 15,
                      borderRadius: 8, background: 'var(--ph-red)', color: '#fff',
                      fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', padding: '0 3px',
                    }}
                  >
                    {unseen > 9 ? '9+' : unseen}
                  </span>
                )}
              </button>
              <button type="button" className="ph-iconbtn" aria-label="Search" onClick={() => setSearching(true)}>
                <SearchGlyph size={23} />
              </button>
              {tab === 'you' && (
                <button type="button" className="ph-iconbtn" aria-label="Settings" onClick={() => setScreen('appsettings')}>
                  <GearGlyph size={22} />
                </button>
              )}
            </span>
          </div>
          )}

          {tab === 'home' && <HomeTab now={now} onOpen={setOpenId} />}
          {tab === 'shorts' && (
            <ShortsTab
              now={now}
              onWatch={watch}
              onOpen={setOpenId}
              onChannel={setChannelId}
              say={say}
              onRemix={(sound) => { setRemixSound(sound); setUploading(true); }}
            />
          )}
          {tab === 'subs' && <SubscriptionsTab now={now} onOpen={setOpenId} onChannel={setChannelId} />}
          {tab === 'you' && (
            <YouTab
              now={now}
              onOpen={setOpenId}
              onUpload={() => setUploading(true)}
              onLibrary={() => setScreen('library')}
              onStudio={() => setScreen('studio')}
              onChannel={setChannelId}
              say={say}
            />
          )}

          <nav className="ph-nav">
            <NavButton on={tab === 'home'} label="Home" onClick={() => setTab('home')}>
              <HomeGlyph size={22} filled={tab === 'home'} />
            </NavButton>
            <NavButton on={tab === 'shorts'} label="Shorts" onClick={() => setTab('shorts')}>
              <ShortsGlyph size={22} filled={tab === 'shorts'} />
            </NavButton>
            <button type="button" onClick={() => setUploading(true)} aria-label="Create">
              <span className="ph-glyph"><CreateGlyph size={26} /></span>
            </button>
            <NavButton on={tab === 'subs'} label="Subscriptions" onClick={() => setTab('subs')} dot={fresh > 0}>
              <SubsGlyph size={22} filled={tab === 'subs'} />
            </NavButton>
            <NavButton on={tab === 'you'} label="You" onClick={() => setTab('you')}>
              <Avatar name={sim.player.displayName} size={24} image={mine?.avatarImage} />
            </NavButton>
          </nav>
        </>
      )}

      {toast && <div className="ph-toast">{toast}</div>}
    </div>
  );
}

function NavButton({
  on, label, onClick, children, dot,
}: { on: boolean; label: string; onClick: () => void; children: React.ReactNode; dot?: boolean }) {
  return (
    <button type="button" className={on ? 'ph-on' : undefined} onClick={onClick}>
      <span className="ph-glyph">
        {children}
        {dot && <span className="ph-nav-dot" aria-hidden="true" />}
      </span>
      {label}
    </button>
  );
}

function Thumb({ video }: { video: VideoItem }) {
  const channel = useWorld((s) => s.universe.videoChannels[video.channelId]);
  const thumbnail = THUMBNAIL_BY_ID[video.thumbnail];
  const name = channel?.name ?? '?';
  const base = tint(name);
  return (
    <div
      className="ph-thumb"
      style={{ background: `linear-gradient(140deg, ${base}, ${tint(video.title)})` }}
    >
      {video.thumbnailImage ? (
        <img src={video.thumbnailImage} alt="" />
      ) : (
        <>
          <span className="ph-thumb-mark" aria-hidden="true">{initials(name)}</span>
          <span className="ph-thumb-style">{thumbnail?.label ?? 'A Frame From It'}</span>

        </>
      )}
      <span className="ph-dur">{duration(video.lengthMinutes)}</span>
    </div>
  );
}

function FeedCard({ video, now, onOpen }: { video: VideoItem; now: number; onOpen: (id: string) => void }) {
  const channel = useWorld((s) => s.universe.videoChannels[video.channelId]);
  return (
    <button type="button" className="ph-card" onClick={() => onOpen(video.id)}>
      <Thumb video={video} />
      <div className="ph-card-row">
        <Avatar name={channel?.name ?? '?'} size={36} image={channel?.avatarImage} />
        <span className="ph-card-text">
          <span className="ph-card-title">{video.title}</span>
          <span className="ph-card-meta">
            {channel?.name}
            {channel?.verified && <span className="ph-yt-tick" aria-label="Verified"><TickGlyph size={9} /></span>}
            <span className="ph-yt-play" aria-hidden="true"><PlayTriangleGlyph size={11} /></span>
          </span>
          <span className="ph-card-meta">{views(video.views)}&nbsp;&nbsp; {ago(now, video.publishedAt)}</span>
        </span>
        <span className="ph-card-more"><MoreGlyph size={19} /></span>
      </div>
    </button>
  );
}

function RowCard({ video, now, onOpen }: { video: VideoItem; now: number; onOpen: (id: string) => void }) {
  const channel = useWorld((s) => s.universe.videoChannels[video.channelId]);
  return (
    <button type="button" className="ph-row" onClick={() => onOpen(video.id)}>
      <span className="ph-row-thumb"><Thumb video={video} /></span>
      <span className="ph-row-text">
        <span className="ph-card-title">{video.title}</span>
        <span className="ph-card-meta">{channel?.name}</span>
        <span className="ph-card-meta">{views(video.views)} views · {ago(now, video.publishedAt)}</span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

function HomeTab({ now, onOpen }: { now: number; onOpen: (id: string) => void }) {
  const feed = useWorld((s) => homeFeed(s, s.player.id, 40));
  const shown = useMemo(() => feed.slice(0, 24), [feed]);

  if (shown.length === 0) {
    return (
      <div className="ph-body">
        <div className="ph-empty">
          <b>Nothing Here Yet</b>
          Try another subject, or watch something so the feed learns what you like.
        </div>
      </div>
    );
  }
  return (
    <div className="ph-body">
      <ShortsShelf now={now} onOpen={onOpen} />
      {shown.map((video) => (
        <FeedCard key={video.id} video={video} now={now} onOpen={onOpen} />
      ))}
    </div>
  );
}

/**
 * The shelf of shorts at the head of the feed.
 *
 * Its own heading with the mark and a menu, then two tall tiles side by side,
 * the cover filling each one, a New flag on anything published today, a menu
 * in the corner and the title over the bottom — which is where the app puts
 * all four.
 */
function ShortsShelf({ now, onOpen }: { now: number; onOpen: (id: string) => void }) {
  const shorts = useWorld((s) => homeFeed(s, s.player.id, 40).filter((v) => v.lengthMinutes <= SHORT_MINUTES).slice(0, 2));
  const channels = useWorld((s) => s.universe.videoChannels);
  if (shorts.length < 2) return null;
  return (
    <section className="ph-yt-shelf-block">
      <header className="ph-yt-shelf-head">
        <span className="ph-yt-shorts-mark" aria-hidden="true" />
        <b>Shorts</b>
        <span className="ph-yt-shelf-more"><MoreGlyph size={20} /></span>
      </header>
      <div className="ph-yt-shelf">
        {shorts.map((video) => {
          const channel = channels[video.channelId];
          return (
            <button
              key={video.id}
              type="button"
              className="ph-yt-shelf-tile"
              onClick={() => onOpen(video.id)}
              style={{ background: `linear-gradient(150deg, ${tint(channel?.name ?? '?')}, ${tint(video.title)})` }}
            >
              {video.thumbnailImage && <img src={video.thumbnailImage} alt="" />}
              {now - video.publishedAt < MS_DAY && <span className="ph-yt-new">New</span>}
              <span className="ph-card-more" aria-hidden="true"><MoreGlyph size={18} /></span>
              <span className="ph-yt-shelf-title">{video.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Shorts
// ---------------------------------------------------------------------------

/**
 * The Shorts player, laid out the way the app lays it out: the clip fills the
 * screen, the rail down the right is Like, Dislike, Comments, Share, Remix and
 * the sound, and along the bottom is the channel with Subscribe beside it, the
 * title, and what the sound is. Tapping the clip moves on to the next one and
 * the minutes come out of the day.
 */
function ShortsTab({
  now, onWatch, onOpen, onChannel, say, onRemix,
}: {
  now: number;
  onWatch: (video: VideoItem, minutes?: number, like?: boolean) => void;
  onOpen: (id: string) => void;
  onChannel: (id: string) => void;
  say: (text: string) => void;
  onRemix: (sound: string) => void;
}) {
  const { run } = useGame();
  const shorts = useWorld((s) => homeFeed(s, s.player.id, 120).filter((v) => v.lengthMinutes <= SHORT_MINUTES));
  const [index, setIndex] = useState(0);
  const video = shorts[Math.min(index, Math.max(0, shorts.length - 1))];
  const channel = useWorld((s) => (video ? s.universe.videoChannels[video.channelId] : undefined));
  const subscribed = useWorld((s) => (channel ? isSubscribed(s, s.player.id, channel.id) : false));
  // The number beside Remix is how many shorts in this save were cut to the
  // same sound, counted rather than decorative.
  const remixes = useWorld((s) => (video?.sound
    ? Object.values(s.universe.videos).filter((one) => one.sound === video.sound).length
    : 1));

  if (!video) {
    return (
      <div className="ph-body">
        <div className="ph-empty"><b>No Shorts</b>Nothing short enough right now.</div>
      </div>
    );
  }

  const next = () => setIndex((i) => (shorts.length > 0 ? (i + 1) % shorts.length : 0));

  return (
    <div className="ph-shorts">
      {void now}
      <div className="ph-short">
        {video.thumbnailImage && (
          <span className="ph-short-cover" aria-hidden="true"><img src={video.thumbnailImage} alt="" /></span>
        )}
        <button type="button" className="ph-short-stage" onClick={next} aria-label="Next Short" />

        <div className="ph-short-top">
          <button type="button" className="ph-iconbtn" aria-label="Search" onClick={() => say('Search is on the tab above.')}>
            <SearchGlyph size={23} />
          </button>
          <button
            type="button"
            className="ph-iconbtn"
            aria-label="More"
            onClick={() => say('Not interested is noted. It changes nothing about the short and everything about your feed.')}
          >
            <MoreGlyph size={23} />
          </button>
        </div>

        <div className="ph-short-rail">
          <button type="button" onClick={() => onWatch(video, video.lengthMinutes, true)} aria-label="Like">
            <span className="ph-glyph"><HeartGlyph size={30} /></span>{views(video.likes)}
          </button>
          <button type="button" onClick={() => onOpen(video.id)} aria-label="Comments">
            <span className="ph-glyph"><CommentGlyph size={29} /></span>{video.commentCount.toLocaleString('en-US')}
          </button>
          <button
            type="button"
            onClick={() => say('Nothing leaves the game. SLATE never sends anything anywhere.')}
            aria-label="Share"
          >
            <span className="ph-glyph"><ArrowShareGlyph size={29} /></span>Share
          </button>
          <button
            type="button"
            onClick={() => onRemix(video.sound ?? `${channel?.name ?? 'this channel'} original audio`)}
            aria-label="Remix"
          >
            <span className="ph-glyph"><RemixGlyph size={28} /></span>{remixes.toLocaleString('en-US')}
          </button>
          <button
            type="button"
            className="ph-short-disc"
            aria-label="Sound"
            onClick={() => say(video.sound ?? `${channel?.name ?? 'This channel'} · original audio`)}
          >
            {channel?.avatarImage
              ? <img src={channel.avatarImage} alt="" />
              : <span className="ph-short-disc-mark" aria-hidden="true"><MusicGlyph size={15} /></span>}
          </button>
        </div>

        <div className="ph-short-foot">
          <span className="ph-short-who">
            <button type="button" onClick={() => onChannel(video.channelId)} aria-label={channel?.name ?? 'Channel'}>
              <Avatar name={channel?.name ?? 'Channel'} size={34} image={channel?.avatarImage} />
              <b>@{channel?.handle ?? 'channel'}</b>
            </button>
            <button
              type="button"
              className={`ph-short-sub${subscribed ? ' ph-on' : ''}`}
              onClick={() => {
                if (!channel) return;
                const result = run(subscribed ? 'video.unsubscribe' : 'video.subscribe', { channelId: channel.id }, { silent: true });
                if (result.ok) say(subscribed ? `Unsubscribed from ${channel.name}.` : `Subscribed to ${channel.name}.`);
                else say(result.error ?? 'That did not work.');
              }}
            >
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </span>
          <p className="ph-short-title">
            {video.title}
            {video.topic && <b> #{video.topic}</b>}
          </p>
        </div>
        <span className="ph-short-progress" aria-hidden="true">
          <i style={{ width: `${Math.round(((index % 5) + 1) * 18)}%` }} />
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

const SUB_LANES = ['all', 'today', 'videos', 'shorts', 'watched', 'unwatched'] as const;
const SUB_LABEL: Readonly<Record<string, string>> = {
  all: 'All', today: 'Today', videos: 'Videos', shorts: 'Shorts',
  watched: 'Continue Watching', unwatched: 'Unwatched',
};

function SubscriptionsTab({
  now, onOpen, onChannel,
}: { now: number; onOpen: (id: string) => void; onChannel: (id: string) => void }) {
  const subs = useWorld((s) => subscriptionsOf(s, s.player.id)
    .map((sub) => s.universe.videoChannels[sub.channelId])
    .filter((c): c is VideoChannel => c !== undefined));
  const feed = useWorld((s) => subscriptionFeed(s, s.player.id, 40));
  const seen = useWorld((s) => watchedIds(s, s.player.id));
  const [lane, setLane] = useState<(typeof SUB_LANES)[number]>('all');
  const shown = feed.filter((video) => {
    if (lane === 'today') return video.publishedAt >= now - MS_DAY;
    if (lane === 'videos') return video.lengthMinutes > SHORT_MINUTES;
    if (lane === 'shorts') return video.lengthMinutes <= SHORT_MINUTES;
    if (lane === 'watched') return seen.has(video.id);
    if (lane === 'unwatched') return !seen.has(video.id);
    return true;
  });

  if (subs.length === 0) {
    return (
      <div className="ph-body">
        <div className="ph-empty">
          <b>No Subscriptions</b>
          Open a channel and subscribe to it. This tab is only ever what you chose.
        </div>
      </div>
    );
  }

  return (
    <div className="ph-body">
      <div className="ph-chips" style={{ paddingTop: 10 }}>
        {subs.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className="ph-yt-sub"
            onClick={() => onChannel(channel.id)}
            aria-label={channel.name}
          >
            <span className="ph-yt-sub-ring">
              <Avatar name={channel.name} size={46} image={channel.avatarImage} />
            </span>
            <span>{channel.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      <div className="ph-chips" style={{ paddingTop: 4 }}>
        {SUB_LANES.map((option) => (
          <button
            key={option}
            type="button"
            className={`ph-chip${lane === option ? ' ph-on' : ''}`}
            onClick={() => setLane(option)}
          >
            {SUB_LABEL[option]}
          </button>
        ))}
      </div>
      <div className="ph-sep" />
      {shown.length === 0 && <p className="ph-empty">Nothing under that yet.</p>}
      {shown.map((video) => <RowCard key={video.id} video={video} now={now} onOpen={onOpen} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// You
// ---------------------------------------------------------------------------

/**
 * One row of the library.
 *
 * The app draws these as a stack: the cover of the newest thing in the list
 * with a second card peeking out behind it, then the name and what the list
 * is. An empty list gets the stack without a cover, which is what the app
 * shows too.
 */
function LibraryRow({
  label, note, cover, tint: colour, onClick,
}: {
  label: string; note: string; cover?: VideoItem; tint?: string; onClick: () => void;
}) {
  return (
    <button type="button" className="ph-yt-lib" onClick={onClick}>
      <span className="ph-yt-lib-stack">
        <span
          className="ph-yt-lib-card"
          style={{ background: colour ?? (cover ? tint(cover.title) : 'var(--ph-raised)') }}
        >
          {cover?.thumbnailImage && <img src={cover.thumbnailImage} alt="" />}
        </span>
      </span>
      <span className="ph-yt-lib-text">
        <b>{label}</b>
        <i>{note}</i>
      </span>
      <span className="ph-card-more"><MoreGlyph size={19} /></span>
    </button>
  );
}

function YouTab({
  now, onOpen, onUpload, onLibrary, onStudio, onChannel, say,
}: {
  now: number; onOpen: (id: string) => void; onUpload: () => void;
  onLibrary: () => void; onStudio: () => void; onChannel: (id: string) => void;
  say: (text: string) => void;
}) {
  const { sim, run } = useGame();
  const channel = useWorld(myChannel);
  const history = useWorld((s) => Object.values(s.universe.watchHistory)
    .filter((r) => r.personId === s.player.id)
    .sort((a, b) => b.at - a.at)
    .slice(0, 12)
    .map((r) => ({ record: r, video: videoById(s, r.videoId) })));
  const todayMinutes = useWorld((s) => minutesWatchedSince(s, s.player.id, s.now - MS_DAY));
  const mine = useWorld((s) => (channel ? videosOf(s, channel.id) : []));
  const stats = useWorld((s) => (channel ? channelAnalytics(s, channel.id) : undefined));
  const account = useWorld((s) => (channel?.accountId ? s.universe.socialAccounts[channel.accountId] : undefined));
  const summary = useWorld((s) => (account ? accountSummary(s, account.id) : undefined));
  const deals = useWorld((s) => Object.values(s.universe.brandDeals)
    .filter((d) => d.personId === s.player.id && ['offered', 'active'].includes(d.status))
    .sort((a, b) => b.offeredAt - a.offeredAt));
  const platform = PLATFORM_BY_ID[VIDEO_PLATFORM];
  const paying = useWorld(hasPremium);
  // The cover on a library row is the newest thing actually in that list.
  const liked = useWorld((s) => Object.values(s.universe.watchHistory)
    .filter((r) => r.personId === s.player.id && r.liked)
    .sort((a, b) => b.at - a.at)
    .map((r) => videoById(s, r.videoId))
    .filter((v): v is VideoItem => v !== undefined));
  // Watch Later shows what was started and left unfinished, which is the
  // record the save actually keeps rather than a list nobody wrote.
  const later = useWorld((s) => Object.values(s.universe.watchHistory)
    .filter((r) => r.personId === s.player.id && !r.finished)
    .sort((a, b) => b.at - a.at)
    .map((r) => videoById(s, r.videoId))
    .filter((v): v is VideoItem => v !== undefined));

  return (
    <div className="ph-body">
      <div className="ph-yt-me">
        <Avatar name={sim.player.displayName} size={64} image={channel?.avatarImage} />
        <div>
          <div className="ph-yt-me-name">{sim.player.displayName}</div>
          <div className="ph-yt-me-handle">
            {channel ? `@${channel.handle}` : 'No Channel Yet'}
            {paying && <span>Premium Member</span>}
          </div>
        </div>
      </div>

      <div className="ph-yt-me-buttons">
        <button
          type="button"
          className="ph-yt-pill ph-on"
          onClick={() => (channel ? onChannel(channel.id) : say('Make a channel first.'))}
        >
          View Channel
        </button>
        <button type="button" className="ph-yt-pill" onClick={onLibrary}>
          {paying ? 'Premium Benefits' : 'Library'}
        </button>
      </div>

      {channel && <ChannelPictures channel={channel} say={say} />}

      <button type="button" className="ph-section-head ph-yt-more" onClick={onLibrary}>
        History <span aria-hidden="true">›</span>
      </button>
      <div className="ph-follow-cards" style={{ padding: '0 12px 8px' }}>
        {history.slice(0, 8).map(({ record, video }) => (
          video ? (
            <button key={record.id} type="button" className="ph-yt-hist" onClick={() => onOpen(video.id)}>
              <span className="ph-yt-hist-thumb" style={{ background: `linear-gradient(140deg, ${tint(video.title)}, ${tint(video.id)})` }}>
                {video.thumbnailImage && <img src={video.thumbnailImage} alt="" />}
                <span className="ph-dur">{duration(video.lengthMinutes)}</span>
              </span>
              <b>{video.title}</b>
            </button>
          ) : null
        ))}
        {history.length === 0 && <p className="ph-card-meta">Nothing watched yet.</p>}
      </div>

      <div className="ph-section-head">Library</div>
      <div className="ph-yt-library">
        <LibraryRow
          label="Liked Videos"
          note="Private"
          cover={liked[0]}
          onClick={onLibrary}
        />
        <LibraryRow
          label="Downloads"
          note={paying ? 'Available' : 'With Premium'}
          cover={history[0]?.video}
          onClick={() => say(paying
            ? 'Downloads need a device to keep them on. This handset streams.'
            : 'Downloads come with Premium.')}
        />
        <LibraryRow
          label="Badges"
          note={channel ? `${plural(mine.length, 'Upload')}` : 'No Channel'}
          tint="#5b53c9"
          onClick={() => say(`${stats ? views(stats.totalViews) : 0} views across everything you have put up.`)}
        />
        <LibraryRow
          label="Watch Later"
          note="Private"
          cover={later[0]}
          onClick={onLibrary}
        />
        {channel && (
          <LibraryRow
            label="Your Studio"
            note="Analytics And Money"
            cover={mine[0]}
            onClick={onStudio}
          />
        )}
      </div>

      <PremiumPanel say={say} />

      {!channel && (
        <div className="ph-panel">
          <h4>Start A Channel</h4>
          <p>It takes a name and nothing else. Everything after that is uploads.</p>
          <button
            type="button"
            className="ph-pill ph-on"
            style={{ marginTop: 10 }}
            onClick={() => {
              const result = run('video.create_channel', {});
              if (result.ok) say('Channel created. Nobody knows yet.');
            }}
          >
            Create A Channel
          </button>
        </div>
      )}

      {channel && stats && (
        <>
          <div className="ph-section-head">Your Channel</div>
          <div className="ph-panel">
            <h4>Last 28 Days</h4>
            <div className="ph-spark" aria-label="Views over the last twenty eight days">
              {stats.daily.map((value, index) => (
                <i
                  key={index}
                  style={{ height: `${Math.max(2, (value / Math.max(1, ...stats.daily)) * 100)}%` }}
                />
              ))}
            </div>
            <p style={{ marginTop: 8 }}>
              {views(stats.viewsLast28)} views · {stats.videos} video{stats.videos === 1 ? '' : 's'} ·
              {' '}{Math.round(stats.averageRetention * 100)}% average retention
            </p>
            <p style={{ marginTop: 4 }}>
              Median {views(stats.median)} views. One video does not describe a channel.
            </p>
          </div>
          {stats.best && stats.worst && stats.best.id !== stats.worst.id && (
            <div className="ph-panel">
              <h4>The One That Took Off, And The One That Did Not</h4>
              <p>{stats.best.title} — {views(stats.best.views)} views</p>
              <p>{stats.worst.title} — {views(stats.worst.views)} views</p>
            </div>
          )}
          <button type="button" className="ph-pill ph-on" style={{ margin: '4px 12px 10px' }} onClick={onUpload}>
            Upload Something
          </button>
          {account && (
            <div className="ph-panel">
              <h4>{account.monetisationEnabled ? 'Monetized' : 'Not Monetized Yet'}</h4>
              {account.monetisationEnabled ? (
                <>
                  <p>
                    {formatMoney(account.effectiveCpm)} per thousand monetized views.
                    {' '}{formatMoney(account.lifetimeEarnings)} earned so far, paid into your account.
                  </p>
                  <p style={{ marginTop: 4 }}>
                    A brand would pay about {formatMoney(sponsorshipRate(account))} for a spot in one video.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    {views(account.followers)} of {views(platform.monetisationThreshold)} subscribers.
                    Nothing pays until you are past that.
                  </p>
                  <div className="ph-bar" style={{ marginTop: 8 }}>
                    <i style={{ width: `${Math.min(100, (account.followers / platform.monetisationThreshold) * 100)}%` }} />
                  </div>
                </>
              )}
              {summary && (
                <p style={{ marginTop: 6 }}>
                  {views(summary.impressionsLast30)} impressions in the last thirty days, from
                  {' '}{summary.postsLast30} upload{summary.postsLast30 === 1 ? '' : 's'}.
                  {summary.pendingRevenue > 0 && ` ${formatMoney(summary.pendingRevenue)} still to be paid out.`}
                </p>
              )}
            </div>
          )}

          {deals.length > 0 && (
            <>
              <div className="ph-section-head">Sponsorships</div>
              {deals.map((deal) => <DealRow key={deal.id} deal={deal} say={say} />)}
            </>
          )}

          {mine.map((video) => <MyVideoRow key={video.id} video={video} now={now} onOpen={onOpen} say={say} />)}
          <div className="ph-sep" />
        </>
      )}

      <div className="ph-section-head">History</div>
      {todayMinutes > 0 && (
        <p className="ph-card-meta" style={{ padding: '0 12px 6px' }}>
          {Math.round(todayMinutes)} minutes today
          {todayMinutes >= BINGE_MINUTES ? ', which is a lot of an evening.' : '.'}
        </p>
      )}
      {history.length === 0 ? (
        <div className="ph-empty">Nothing watched yet.</div>
      ) : (
        history.map(({ record, video }) => (
          video ? <RowCard key={record.id} video={video} now={now} onOpen={onOpen} /> : null
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function SearchPage({
  query, setQuery, now, onClose, onOpen,
}: {
  query: string; setQuery: (q: string) => void; now: number;
  onClose: () => void; onOpen: (id: string) => void;
}) {
  const { run } = useGame();
  const [uploaded, setUploaded] = useState<'any' | 'today' | 'week' | 'month' | 'year'>('any');
  const [length, setLength] = useState<'any' | 'short' | 'medium' | 'long'>('any');
  const prefs = useWorld(preferences);
  const results = useWorld((s) => applyFilters(s, searchVideos(s, query, 120), {
    uploaded, duration: length, sort: prefs.searchSort,
  }).slice(0, 40));
  return (
    <>
      <div className="ph-yt-top">
        <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onClose}><BackGlyph size={21} /></button>
        <input
          className="ph-input"
          style={{ margin: '0 8px', borderRadius: 20 }}
          placeholder="Search YouTube"
          value={query}
          aria-label="Search YouTube"
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="ph-chips">
        {(['any', 'today', 'week', 'month', 'year'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`ph-chip${uploaded === option ? ' ph-on' : ''}`}
            onClick={() => setUploaded(option)}
          >
            {option === 'any' ? 'Any Time' : option === 'today' ? 'Today' : `This ${option[0]!.toUpperCase()}${option.slice(1)}`}
          </button>
        ))}
      </div>
      <div className="ph-chips" style={{ paddingTop: 0 }}>
        {(['any', 'short', 'medium', 'long'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`ph-chip${length === option ? ' ph-on' : ''}`}
            onClick={() => setLength(option)}
          >
            {option === 'any' ? 'Any Length' : option === 'short' ? 'Under 4 Minutes' : option === 'medium' ? '4 To 20' : 'Over 20'}
          </button>
        ))}
        {(['relevance', 'date', 'views'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`ph-chip${prefs.searchSort === option ? ' ph-on' : ''}`}
            onClick={() => run('video.set_preferences', { searchSort: option })}
          >
            {option === 'relevance' ? 'Relevance' : option === 'date' ? 'Newest' : 'Most Viewed'}
          </button>
        ))}
      </div>
      <div className="ph-body">
        {query.trim().length < 2 ? (
          <div className="ph-empty">Type at least two letters.</div>
        ) : results.length === 0 ? (
          <div className="ph-empty"><b>No Results</b>Nothing matches that.</div>
        ) : (
          results.map((video) => <RowCard key={video.id} video={video} now={now} onOpen={onOpen} />)
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Watch
// ---------------------------------------------------------------------------

function WatchPage({
  video, now, onBack, onOpen, onChannel, onSettings, onWatch, say,
}: {
  video: VideoItem; now: number;
  onBack: () => void; onOpen: (id: string) => void; onChannel: (id: string) => void;
  onSettings: () => void;
  onWatch: (video: VideoItem, minutes?: number, like?: boolean) => void;
  say: (text: string) => void;
}) {
  const { run } = useGame();
  const [sheet, setSheet] = useState<'none' | 'save' | 'tip'>('none');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const paying = useWorld(hasPremium);
  const prefs = useWorld(preferences);
  const chapters = useWorld((s) => chaptersOf(s, video));
  const captioned = useWorld((s) => hasCaptions(s, video));
  const runtime = minutesAtSpeed(video.lengthMinutes, prefs);
  const channel = useWorld((s) => s.universe.videoChannels[video.channelId]);
  const subscribed = useWorld((s) => (channel ? isSubscribed(s, s.player.id, channel.id) : false));
  const seen = useWorld((s) => watchedIds(s, s.player.id).has(video.id));
  const comments = useWorld((s) => commentsOn(s, video.id));
  const upNext = useWorld((s) => homeFeed(s, s.player.id, 12).filter((v) => v.id !== video.id));
  const mine = channel?.ownerId !== undefined;
  const hidden = comments.filter((c) => c.harsh && !c.seen);
  const [reply, setReply] = useState('');
  const [showAll, setShowAll] = useState(false);

  const visible = comments.filter((c) => !c.harsh || c.seen);

  return (
    <>
      <div className="ph-player">
        <button type="button" className="ph-play-big" aria-label="Play" onClick={() => onWatch(video)} />
        <span className="ph-play-note">
          {seen ? 'Watched. Play it again if you like.' : `${duration(runtime)} of your day at ${prefs.speed}×`}
          {paying ? ' · no ads' : ' · an ad may run first'}
          {captioned ? (prefs.captions ? ' · captions on' : ' · captions available') : ' · no captions'}
        </span>
        <span className="ph-scrub"><i style={{ width: seen ? '100%' : '0%' }} /></span>
      </div>

      <div className="ph-body">
        <div className="ph-watch-title">{video.title}</div>
        <div className="ph-watch-meta">
          {views(video.views)} views · {ago(now, video.publishedAt)}
        </div>

        <div className="ph-actions">
          <button type="button" className="ph-pill" onClick={onSettings}>{prefs.speed}× · {prefs.quality}</button>
          <button
            type="button"
            className={`ph-pill${prefs.captions ? ' ph-on' : ''}`}
            disabled={!captioned}
            onClick={() => run('video.set_preferences', { captions: !prefs.captions })}
          >
            CC
          </button>
          {prefs.autoplay && (
            <button
              type="button"
              className="ph-pill"
              onClick={() => {
                const result = run<{ watched: number; minutes: number; stoppedBecause: string }>(
                  'video.autoplay', { videoId: video.id },
                );
                if (result.ok) {
                  say(`${result.value!.watched} videos, ${result.value!.minutes} minutes. ${result.value!.stoppedBecause}`);
                }
              }}
            >
              Autoplay
            </button>
          )}
          <button type="button" className="ph-pill" onClick={() => onWatch(video, video.lengthMinutes, true)}>
            <LikeGlyph size={16} /> {views(video.likes)}
          </button>
          <button type="button" className="ph-pill" onClick={() => say('Noted. It changes nothing about the video and everything about your feed.')}>
            <DislikeGlyph size={16} />
          </button>
          <button type="button" className="ph-pill" onClick={() => say('Nothing leaves the game. SLATE never sends anything anywhere.')}>
            <ShareGlyph size={16} /> Share
          </button>
          <QuickSave video={video} say={say} />
          <button type="button" className="ph-pill" onClick={() => setSheet(sheet === 'save' ? 'none' : 'save')}>
            Save To
          </button>
          {!mine && (
            <button type="button" className="ph-pill" onClick={() => setSheet(sheet === 'tip' ? 'none' : 'tip')}>
              Thanks
            </button>
          )}
          <button type="button" className="ph-pill" onClick={() => onWatch(video, Math.max(1, Math.round(video.lengthMinutes / 3)))}>
            Skim It
          </button>
          <button type="button" className="ph-pill" onClick={onBack}>
            <BackGlyph size={16} /> Back
          </button>
        </div>

        {sheet === 'save' && <SaveSheet video={video} onClose={() => setSheet('none')} say={say} />}
        {sheet === 'tip' && <TipSheet video={video} onClose={() => setSheet('none')} say={say} />}

        <div className="ph-channel-row">
          <button
            type="button"
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            aria-label={`Open ${channel?.name ?? 'the channel'}`}
            onClick={() => channel && onChannel(channel.id)}
          >
            <Avatar name={channel?.name ?? '?'} size={38} />
          </button>
          <span>
            <span className="ph-name" style={{ display: 'block' }}>
              {channel?.name}{channel?.verified ? ' ✓' : ''}
            </span>
            <span className="ph-subs">{views(channel?.subscribers ?? 0)} subscribers</span>
          </span>
          {!mine && channel && (
            <button
              type="button"
              className={`ph-sub-btn${subscribed ? ' ph-subbed' : ''}`}
              onClick={() => {
                const result = run(subscribed ? 'video.unsubscribe' : 'video.subscribe', { channelId: channel.id });
                if (result.ok) say(subscribed ? `Unsubscribed from ${channel.name}.` : `Subscribed to ${channel.name}.`);
              }}
            >
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>

        {chapters.length > 0 && (
          <div className="ph-panel">
            <h4>Chapters</h4>
            {chapters.map((chapter) => (
              <button
                key={chapter.title}
                type="button"
                className="ph-pill"
                style={{ margin: '4px 6px 0 0' }}
                onClick={() => onWatch(video, Math.max(1, runtime - Math.round(chapter.at / prefs.speed)))}
              >
                {duration(chapter.at)} {chapter.title}
              </button>
            ))}
          </div>
        )}

        {video.description && (
          <div className="ph-panel">
            <h4>{views(video.views)} views · {ago(now, video.publishedAt)}</h4>
            <p>{video.description}</p>
            {video.tags.length > 0 && (
              <p style={{ marginTop: 6 }}>{video.tags.map((t) => `#${t.replace(/\s+/g, '')}`).join(' ')}</p>
            )}
          </div>
        )}

        <div className="ph-section-head">Comments · {views(video.commentCount)}</div>

        {mine && hidden.length > 0 && (
          <div className="ph-panel">
            <h4>{hidden.length} Comments Are Hidden</h4>
            <p>They are the sort you would rather not have read. Nobody is making you.</p>
            <button
              type="button"
              className="ph-pill"
              style={{ marginTop: 10 }}
              onClick={() => {
                const result = run<{ read: number }>('video.read_harsh', { videoId: video.id });
                if (result.ok) say(`You read all ${result.value!.read} of them. That was your choice.`);
              }}
            >
              Read Them Anyway
            </button>
          </div>
        )}

        {(showAll ? visible : visible.slice(0, 4)).map((comment) => (
          <div key={comment.id} className="ph-comment">
            <Avatar name={comment.authorName} size={30} />
            <span className="ph-c-text">
              <span className="ph-c-who">
                {comment.pinned ? 'Pinned · ' : ''}{comment.authorName} · {ago(now, comment.at)}
                {comment.replyToId ? ' · reply' : ''}
              </span>
              <span className="ph-c-body">{comment.text}</span>
              <span className="ph-c-likes">
                <LikeGlyph size={13} /> {views(comment.likes)}
                {comment.hearted && ' · hearted by the channel'}
              </span>
              <span className="ph-actions" style={{ padding: '6px 0 0' }}>
                <button
                  type="button"
                  className="ph-pill"
                  onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyText(''); }}
                >
                  Reply
                </button>
                {mine && (
                  <>
                    <button
                      type="button"
                      className={`ph-pill${comment.pinned ? ' ph-on' : ''}`}
                      onClick={() => run('video.pin_comment', { commentId: comment.id })}
                    >
                      Pin
                    </button>
                    <button
                      type="button"
                      className={`ph-pill${comment.hearted ? ' ph-on' : ''}`}
                      onClick={() => run('video.heart_comment', { commentId: comment.id })}
                    >
                      Heart
                    </button>
                  </>
                )}
              </span>
              {replyTo === comment.id && (
                <span style={{ display: 'block', marginTop: 8 }}>
                  <input
                    className="ph-input"
                    value={replyText}
                    placeholder={`Reply to ${comment.authorName}`}
                    aria-label={`Reply to ${comment.authorName}`}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button
                    type="button"
                    className="ph-pill ph-on"
                    style={{ marginTop: 6 }}
                    onClick={() => {
                      const result = run('video.reply_comment', { commentId: comment.id, text: replyText });
                      if (result.ok) { setReplyTo(null); setReplyText(''); say('Replied.'); }
                    }}
                  >
                    Reply
                  </button>
                </span>
              )}
            </span>
          </div>
        ))}
        {visible.length > 4 && (
          <button type="button" className="ph-pill" style={{ margin: '0 12px 10px' }} onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Show Fewer' : `Show All ${visible.length}`}
          </button>
        )}

        <div style={{ padding: '0 12px 14px' }}>
          <label className="ph-label" htmlFor="ph-reply">Add A Comment</label>
          <EmojiRow app="video" onPick={(emoji) => setReply((text) => text + emoji)} />
          <input
            id="ph-reply"
            className="ph-input"
            value={reply}
            placeholder="Say something"
            onChange={(e) => setReply(e.target.value)}
          />
          <button
            type="button"
            className="ph-pill ph-on"
            style={{ marginTop: 8 }}
            onClick={() => {
              const result = run('video.comment', { videoId: video.id, text: reply });
              if (result.ok) { setReply(''); say('Posted. It is in the world now.'); }
            }}
          >
            Comment
          </button>
        </div>

        <div className="ph-sep" />
        <div className="ph-section-head">Up Next</div>
        {upNext.map((next) => <RowCard key={next.id} video={next} now={now} onOpen={onOpen} />)}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * The camera screen, which is what Create actually opens on for a short.
 *
 * The rail down the right is the app's: flip the camera, set the speed, set
 * the countdown, pick an effect, pick a look. Along the bottom are the three
 * lengths and the record button. Every control here does the thing it says:
 * the countdown counts down, the speed decides how much of your time the take
 * costs, the effect picks the look the cover is drawn in, and the sound is
 * carried onto the short and shown under it.
 */
interface Take {
  seconds: number;
  speed: number;
  facing: 'Back' | 'Front';
  sound: string;
  thumbnail: string;
  photo?: string;
}

// The three lengths the camera offers, cycled by the Duration control.
const TAKE_LENGTHS = [15, 60, 180] as const;
const TAKE_SPEEDS = [0.3, 0.5, 1, 2, 3] as const;

function CameraScreen({
  onShot, startSound, onClose, mode, setMode,
}: {
  onShot: (take: Take) => void;
  startSound?: string;
  onClose: () => void;
  mode: 'video' | 'short' | 'live' | 'post';
  setMode: (mode: 'video' | 'short' | 'live' | 'post') => void;
}) {
  const [facing, setFacing] = useState<'Back' | 'Front'>('Back');
  const [speed, setSpeed] = useState(1);
  const [timer, setTimer] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [thumbnail, setThumbnail] = useState('frame');
  const [sound, setSound] = useState(startSound ?? 'original sound');
  const [photo, setPhoto] = useState<string | undefined>();
  const [panel, setPanel] = useState<'none' | 'speed' | 'timer' | 'effects' | 'sound' | 'gallery'>('none');
  const [count, setCount] = useState(0);
  const [rolling, setRolling] = useState(false);

  const take = { seconds, speed, facing, sound, thumbnail, photo };
  const shotRef = useRef(onShot);
  const takeRef = useRef(take);
  useEffect(() => { shotRef.current = onShot; takeRef.current = take; });

  // The countdown is the countdown. When it runs out the take is in the can.
  useEffect(() => {
    if (!rolling) return undefined;
    if (count > 0) {
      const id = window.setTimeout(() => setCount((n) => n - 1), 1000);
      return () => window.clearTimeout(id);
    }
    setRolling(false);
    shotRef.current(takeRef.current);
    return undefined;
  }, [rolling, count]);

  const record = () => {
    setCount(timer);
    setRolling(true);
  };

  const label = seconds === 15 ? '15s' : seconds === 60 ? '60s' : '3m';

  return (
    <div className="ph-cam">
      <div className="ph-cam-stage" style={{ background: photo ? '#000' : undefined }}>
        {photo && <img src={photo} alt="" />}
        <span className="ph-cam-grab" aria-hidden="true" />

        <div className="ph-cam-top">
          <button type="button" className="ph-cam-round" aria-label="Close" onClick={onClose}>
            <CloseGlyph size={20} />
          </button>
          <button type="button" className="ph-cam-sound" onClick={() => setPanel(panel === 'sound' ? 'none' : 'sound')}>
            <MusicGlyph size={17} />
            {sound === 'original sound' ? 'Add sound' : sound}
          </button>
          <button
            type="button"
            className="ph-cam-round ph-cam-ai"
            aria-label="Effects"
            onClick={() => setPanel(panel === 'effects' ? 'none' : 'effects')}
          >
            <SparkleGlyph size={19} />
          </button>
        </div>

        {rolling && <span className="ph-cam-count">{count > 0 ? count : 'Rolling'}</span>}

        <div className="ph-cam-rail">
          <button type="button" onClick={() => setFacing((was) => (was === 'Back' ? 'Front' : 'Back'))}>
            <i>Flip</i><span className="ph-glyph"><FlipGlyph size={22} /></span>
          </button>
          <button type="button" onClick={() => setPanel(panel === 'timer' ? 'none' : 'timer')}>
            <i>Timer</i><span className="ph-glyph"><TimerGlyph size={22} /></span>
          </button>
          <button
            type="button"
            onClick={() => setSeconds((was) => TAKE_LENGTHS[(TAKE_LENGTHS.indexOf(was as 15 | 60 | 180) + 1) % TAKE_LENGTHS.length]!)}
          >
            <i>Duration</i><span className="ph-glyph ph-cam-value">{label}</span>
          </button>
          <button type="button" onClick={() => setPanel(panel === 'effects' ? 'none' : 'effects')}>
            <i>Effects</i><span className="ph-glyph"><SparkleGlyph size={22} /><em /></span>
          </button>
          <button type="button" onClick={() => setPanel(panel === 'speed' ? 'none' : 'speed')}>
            <i>Speed</i><span className="ph-glyph ph-cam-value">{speed}x</span>
          </button>
          <button type="button" onClick={() => setPanel(panel === 'gallery' ? 'none' : 'gallery')}>
            <i>More</i><span className="ph-glyph"><DownGlyph size={20} /><em /></span>
          </button>
        </div>
      </div>

      {panel !== 'none' && (
        <div className="ph-cam-panel">
          {panel === 'speed' && (
            <>
              <div className="ph-label">Speed</div>
              <div className="ph-chips">
                {TAKE_SPEEDS.map((option) => (
                  <button key={option} type="button" className={`ph-chip${speed === option ? ' ph-on' : ''}`} onClick={() => setSpeed(option)}>
                    {option}x
                  </button>
                ))}
              </div>
              <p className="ph-card-meta">
                A {seconds} second take at {speed}x is {Math.round(seconds / speed)} seconds of standing there.
              </p>
            </>
          )}
          {panel === 'timer' && (
            <>
              <div className="ph-label">Countdown</div>
              <div className="ph-chips">
                {[0, 3, 10].map((option) => (
                  <button key={option} type="button" className={`ph-chip${timer === option ? ' ph-on' : ''}`} onClick={() => setTimer(option)}>
                    {option === 0 ? 'Off' : `${option} Seconds`}
                  </button>
                ))}
              </div>
              <p className="ph-card-meta">It counts down on the screen before the take starts.</p>
            </>
          )}
          {panel === 'effects' && (
            <>
              <div className="ph-label">The Look It Is Cut In</div>
              <div className="ph-chips">
                {THUMBNAILS.map((option) => (
                  <button key={option.id} type="button" className={`ph-chip${thumbnail === option.id ? ' ph-on' : ''}`} onClick={() => setThumbnail(option.id)}>
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="ph-card-meta">{THUMBNAIL_BY_ID[thumbnail]?.note}</p>
            </>
          )}
          {panel === 'sound' && (
            <>
              <div className="ph-label">Sound</div>
              <div className="ph-chips">
                {[...(startSound && !SOUNDS.includes(startSound) ? [startSound] : []), ...SOUNDS.slice(0, 10)].map((option) => (
                  <button key={option} type="button" className={`ph-chip${sound === option ? ' ph-on' : ''}`} onClick={() => setSound(option)}>
                    {option}
                  </button>
                ))}
              </div>
              <p className="ph-card-meta">Whatever you pick is shown under the short, the way it is on the app.</p>
            </>
          )}
          {panel === 'gallery' && (
            <>
              <div className="ph-label">Cover, Which Is The Whole Screen On A Short</div>
              <ImagePicker frame="short" image={photo} label="Cover for this short" onChange={setPhoto} />
            </>
          )}
        </div>
      )}

      <div className="ph-cam-foot">
        <div className="ph-cam-shutter">
          <button
            type="button"
            className="ph-cam-add"
            onClick={() => setPanel(panel === 'gallery' ? 'none' : 'gallery')}
          >
            <span className="ph-cam-add-tile" style={photo ? { backgroundImage: `url(${photo})` } : undefined} />
            Add
          </button>
          <button type="button" className="ph-cam-record" onClick={record} disabled={rolling} aria-label="Record">
            <span />
          </button>
          <span className="ph-cam-add" aria-hidden="true" />
        </div>
        <div className="ph-cam-modes">
          {(['video', 'short', 'live', 'post'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={mode === option ? 'ph-on' : undefined}
              onClick={() => setMode(option)}
            >
              {option === 'video' ? 'Video' : option === 'short' ? 'Short' : option === 'live' ? 'Live' : 'Post'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UploadPage({
  onClose, say, remixSound,
}: { onClose: () => void; say: (text: string) => void; remixSound?: string }) {
  const { run } = useGame();
  const channel = useWorld(myChannel);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnail, setThumbnail] = useState('frame');
  const [lengthMinutes, setLength] = useState(12);
  const [effortMinutes, setEffort] = useState(240);
  const [later, setLater] = useState(false);
  const [days, setDays] = useState(2);
  const [photo, setPhoto] = useState<string | undefined>();
  const [mode, setMode] = useState<'video' | 'short' | 'live' | 'post'>('short');
  const [take, setTake] = useState<Take | undefined>();
  const [sound, setSound] = useState<string | undefined>(remixSound);
  const now = useWorld((s) => s.now);
  const catalog = useWorld((s) => (channel ? catalogOf(s, channel) : []));
  // The camera is its own full screen: it carries the close, the sound and the
  // mode tabs, so the sheet's own header and tab row stand down while it is up.
  const onCamera = mode === 'short' && !take;

  if (!channel) {
    return (
      <>
        <div className="ph-yt-top">
          <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onClose}>←</button>
          <b style={{ fontSize: 17 }}>Upload</b>
          <span />
        </div>
        <div className="ph-body">
          <div className="ph-empty"><b>No Channel Yet</b>Make one on the You tab first.</div>
        </div>
      </>
    );
  }

  return (
    <>
      {!onCamera && (
      <div className="ph-yt-top">
        <button type="button" className="ph-iconbtn" aria-label="Close" onClick={onClose}><BackGlyph size={21} /></button>
        <b style={{ fontSize: 17 }}>Create</b>
        <span />
      </div>
      )}

      {/* Video, Short, Live, Post — the four things the plus actually makes.
          On the camera they sit under the shutter instead, where the app puts
          them, so this row stands down. */}
      {!onCamera && (
      <div className="ph-yt-modes">
        {(['video', 'short', 'live', 'post'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={mode === option ? 'ph-on' : ''}
            onClick={() => {
              setMode(option);
              if (option === 'short') setLength(Math.min(lengthMinutes, SHORT_MINUTES));
              if (option === 'video' && lengthMinutes <= SHORT_MINUTES) setLength(12);
              if (option !== 'short') { setTake(undefined); setSound(undefined); }
            }}
          >
            {option === 'video' ? 'Video' : option === 'short' ? 'Short' : option === 'live' ? 'Live' : 'Post'}
          </button>
        ))}
      </div>
      )}

      {mode === 'live' && (
        <div className="ph-body" style={{ padding: '0 12px 16px' }}>
          <label className="ph-label" htmlFor="ph-live">What You Are Calling It</label>
          <input id="ph-live" className="ph-input" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
          <label className="ph-label" htmlFor="ph-live-mins">How Long, In Minutes</label>
          <input
            id="ph-live-mins"
            className="ph-input"
            type="number"
            min={10}
            max={480}
            value={effortMinutes}
            onChange={(e) => setEffort(Number(e.target.value))}
          />
          <p className="ph-card-meta">
            Going live takes the hours out of the day, brings in a slice of the people who
            happen to be about, and collects whatever they paid to be read out.
          </p>
          <button
            type="button"
            className="ph-pill ph-on"
            style={{ marginTop: 10 }}
            onClick={() => {
              const result = run<{ peak: number; tips: number }>('video.go_live', { title, minutes: effortMinutes }, { silent: true });
              if (result.ok) { say(`${views(result.value!.peak)} watching at the peak. ${formatMoney(result.value!.tips)} in.`); onClose(); }
              else say(result.error ?? 'That did not work.');
            }}
          >
            Go Live
          </button>
        </div>
      )}

      {mode === 'post' && (
        <div className="ph-body" style={{ padding: '0 12px 16px' }}>
          <label className="ph-label" htmlFor="ph-post">Say Something To Your Channel</label>
          <textarea id="ph-post" className="ph-input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          <label className="ph-label" htmlFor="ph-poll">Or Ask Them, With Answers Separated By Commas</label>
          <input id="ph-poll" className="ph-input" value={tags} onChange={(e) => setTags(e.target.value)} />
          <button
            type="button"
            className="ph-pill ph-on"
            style={{ marginTop: 10 }}
            onClick={() => {
              const options = tags.split(',').map((option) => option.trim()).filter(Boolean);
              const result = run('video.community_post', {
                text: description,
                options: options.length >= 2 ? options : undefined,
              }, { silent: true });
              if (result.ok) { say(options.length >= 2 ? 'Posted, with the poll open.' : 'Posted.'); onClose(); }
              else say(result.error ?? 'That did not work.');
            }}
          >
            Post
          </button>
        </div>
      )}

      {mode === 'short' && !take && (
        <CameraScreen
          startSound={remixSound}
          onClose={onClose}
          mode={mode}
          setMode={setMode}
          onShot={(shot) => {
            setTake(shot);
            setSound(shot.sound === 'original sound' ? undefined : shot.sound);
            setThumbnail(shot.thumbnail);
            setPhoto(shot.photo);
            setLength(Math.max(1, Math.round(shot.seconds / 60)));
            setEffort((minutes) => minutes + Math.max(1, Math.round(shot.seconds / shot.speed / 60)));
            say(`${shot.seconds} seconds on the ${shot.facing.toLowerCase()} camera at ${shot.speed}x. Now name it.`);
          }}
        />
      )}

      {(mode === 'video' || (mode === 'short' && take)) && (
      <div className="ph-body" style={{ padding: '0 12px 16px' }}>
        {take && (
          <div className="ph-panel">
            <div className="ph-label">The Take</div>
            <p style={{ margin: 0, fontSize: 13 }}>
              {take.seconds} seconds, {take.facing.toLowerCase()} camera, at {take.speed}x, to {take.sound}.
            </p>
            <div className="ph-chips" style={{ padding: '8px 0 0' }}>
              <button type="button" className="ph-chip" onClick={() => setTake(undefined)}>Shoot It Again</button>
            </div>
          </div>
        )}
        <label className="ph-label" htmlFor="ph-title">Title</label>
        <input id="ph-title" className="ph-input" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />

        <label className="ph-label" htmlFor="ph-desc">Description</label>
        <textarea id="ph-desc" className="ph-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label className="ph-label" htmlFor="ph-tags">Tags, Separated By Commas</label>
        <input id="ph-tags" className="ph-input" value={tags} onChange={(e) => setTags(e.target.value)} />

        <label className="ph-label">
          {lengthMinutes <= SHORT_MINUTES ? 'Cover, Which Is The Whole Screen On A Short' : 'Your Own Thumbnail'}
        </label>
        <ImagePicker
          frame={lengthMinutes <= SHORT_MINUTES ? 'short' : 'thumbnail'}
          image={photo}
          label={lengthMinutes <= SHORT_MINUTES ? 'Cover for this short' : 'Thumbnail for this video'}
          onChange={setPhoto}
        />
        <p className="ph-card-meta">
          Bring your own picture, or pick one of the seven below and the app draws it.
        </p>

        <label className="ph-label">Or A Drawn One</label>
        <div className="ph-chips" style={{ padding: '0 0 8px' }}>
          {THUMBNAILS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`ph-chip${thumbnail === option.id ? ' ph-on' : ''}`}
              onClick={() => setThumbnail(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="ph-card-meta">{THUMBNAIL_BY_ID[thumbnail]?.note}</p>

        <label className="ph-label" htmlFor="ph-len">Length: {lengthMinutes} Minutes</label>
        <input
          id="ph-len" className="ph-input" type="range" min={1} max={120} value={lengthMinutes}
          onChange={(e) => setLength(Number(e.target.value))}
        />

        <label className="ph-label" htmlFor="ph-effort">
          Time On It: {Math.round(effortMinutes / 60)} Hours
        </label>
        <input
          id="ph-effort" className="ph-input" type="range" min={30} max={1800} step={30} value={effortMinutes}
          onChange={(e) => setEffort(Number(e.target.value))}
        />
        <p className="ph-card-meta">
          The hours come out of your day the moment you press upload, whatever happens to it after.
        </p>

        <label className="ph-label">When</label>
        <div className="ph-chips" style={{ padding: '0 0 8px' }}>
          <button type="button" className={`ph-chip${later ? '' : ' ph-on'}`} onClick={() => setLater(false)}>Publish Now</button>
          <button type="button" className={`ph-chip${later ? ' ph-on' : ''}`} onClick={() => setLater(true)}>Schedule It</button>
        </div>
        {later && (
          <>
            <label className="ph-label" htmlFor="ph-days">In {days} Day{days === 1 ? '' : 's'}</label>
            <input
              id="ph-days" className="ph-input" type="range" min={1} max={30} value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </>
        )}

        <button
          type="button"
          className="ph-pill ph-on"
          style={{ marginTop: 14 }}
          onClick={() => {
            const result = run<{ quality: number; status: string; videoId: string }>('video.upload', {
              title,
              description,
              tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
              thumbnail,
              lengthMinutes,
              effortMinutes,
              sound,
              publishAt: later ? now + days * MS_DAY : undefined,
            });
            if (result.ok) {
              if (photo) {
                run('video.set_thumbnail_image', { videoId: result.value!.videoId, image: photo });
              }
              say(result.value!.status === 'scheduled'
                ? 'Scheduled. It goes up on its own.'
                : 'It is up. Now you wait.');
              onClose();
            }
          }}
        >
          {later ? 'Schedule It' : 'Upload'}
        </button>

        {catalog.length > 0 && (
          <p className="ph-card-meta" style={{ marginTop: 12 }}>
            {plural(catalog.length, 'video')} on the channel already.
          </p>
        )}
      </div>
      )}
    </>
  );
}

/** One of your own videos, with what it actually earned on it. */
/**
 * One of your own videos, with the two things you can actually do to it: put
 * the title, the description, the tags and the thumbnail right, or take it
 * down. Both are the app's own, so both are here rather than in a menu that
 * only exists on a desk somewhere.
 */
function MyVideoRow({
  video, now, onOpen, say,
}: { video: VideoItem; now: number; onOpen: (id: string) => void; say: (text: string) => void }) {
  const { run } = useGame();
  const revenue = useWorld((s) => (video.postId ? s.universe.socialPosts[video.postId]?.revenue ?? 0 : 0));
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [tags, setTags] = useState(video.tags.join(', '));
  const [photo, setPhoto] = useState<string | undefined>(video.thumbnailImage);

  return (
    <>
      <div className="ph-row" style={{ alignItems: 'flex-start' }}>
        <button type="button" className="ph-row-thumb" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer' }} onClick={() => onOpen(video.id)} aria-label={video.title}>
          <Thumb video={video} />
        </button>
        <span className="ph-row-text">
          <span className="ph-card-title">{video.title}</span>
          <span className="ph-card-meta">{views(video.views)} views · {ago(now, video.publishedAt)}</span>
          <span className="ph-card-meta">
            {revenue > 0 ? `${formatMoney(revenue)} earned` : 'Nothing yet'}
            {video.status === 'scheduled' ? ' · scheduled' : ''}
          </span>
          <span className="ph-actions" style={{ padding: '6px 0 0' }}>
            <button type="button" className="ph-pill" onClick={() => setEditing((v) => !v)}>
              {editing ? 'Close' : 'Edit'}
            </button>
            <button
              type="button"
              className="ph-pill"
              onClick={() => {
                const result = run('video.take_down', { videoId: video.id }, { silent: true });
                say(result.ok ? 'Taken down. It is gone from the world.' : result.error ?? 'That did not work.');
              }}
            >
              Take It Down
            </button>
          </span>
        </span>
      </div>

      {editing && (
        <div className="ph-panel">
          <label className="ph-label" htmlFor={`t-${video.id}`}>Title</label>
          <input id={`t-${video.id}`} className="ph-input" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
          <label className="ph-label" htmlFor={`d-${video.id}`}>Description</label>
          <textarea id={`d-${video.id}`} className="ph-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          <label className="ph-label" htmlFor={`g-${video.id}`}>Tags, Separated By Commas</label>
          <input id={`g-${video.id}`} className="ph-input" value={tags} onChange={(e) => setTags(e.target.value)} />
          <label className="ph-label">Thumbnail</label>
          <ImagePicker
            frame={video.lengthMinutes <= SHORT_MINUTES ? 'short' : 'thumbnail'}
            image={photo}
            label="Thumbnail for this video"
            onChange={setPhoto}
          />
          <div className="ph-actions">
            <button
              type="button"
              className="ph-pill ph-on"
              onClick={() => {
                const result = run('video.edit', {
                  videoId: video.id,
                  title,
                  description,
                  tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
                }, { silent: true });
                if (!result.ok) { say(result.error ?? 'That did not work.'); return; }
                if (photo !== video.thumbnailImage) {
                  run('video.set_thumbnail_image', { videoId: video.id, image: photo }, { silent: true });
                }
                say('Saved.');
                setEditing(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * A brand deal, on the phone, where a creator would actually see one. The
 * terms are the terms: what they pay, what they want, and by when.
 */
function DealRow({ deal, say }: { deal: BrandDeal; say: (text: string) => void }) {
  const { sim, run } = useGame();
  const due = Math.max(0, Math.ceil((deal.deadlineAt - sim.now) / MS_DAY));
  const wants = deal.deliverables
    .map((d) => `${d.count} ${d.format.replace(/_/g, ' ')}${d.count === 1 ? '' : 's'}`)
    .join(', ');
  return (
    <div className="ph-panel">
      <h4>{deal.brandName} · {formatMoney(deal.compensation)}</h4>
      <p>{wants}, within {due} day{due === 1 ? '' : 's'}.</p>
      {deal.performanceBonusCpm ? (
        <p style={{ marginTop: 4 }}>{formatMoney(deal.performanceBonusCpm)} more per thousand views above the threshold.</p>
      ) : null}
      {deal.exclusivityCategory && (
        <p style={{ marginTop: 4 }}>No other {deal.exclusivityCategory} brand while it runs.</p>
      )}
      {deal.status === 'offered' ? (
        <div className="ph-actions" style={{ padding: '10px 0 0' }}>
          <button
            type="button"
            className="ph-pill ph-on"
            onClick={() => {
              const result = run('social.respond_to_deal', { dealId: deal.id, accept: true });
              if (result.ok) say(`Signed with ${deal.brandName}. The deliverables are yours now.`);
            }}
          >
            Take It
          </button>
          <button
            type="button"
            className="ph-pill"
            onClick={() => {
              const result = run('social.respond_to_deal', { dealId: deal.id, accept: false });
              if (result.ok) say('Turned down. They will remember either way.');
            }}
          >
            Turn It Down
          </button>
        </div>
      ) : (
        <p style={{ marginTop: 6 }}>
          Running. {deal.deliverables.reduce((sum, d) => sum + d.delivered, 0)} of
          {' '}{deal.deliverables.reduce((sum, d) => sum + d.count, 0)} delivered.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The bell, as an inbox
// ---------------------------------------------------------------------------

function NoticesPage({
  now, onBack, onOpen, onChannel,
}: {
  now: number; onBack: () => void;
  onOpen: (id: string) => void; onChannel: (id: string) => void;
}) {
  const { run } = useGame();
  const notices = useWorld((s) => noticesOf(s, s.player.id).slice(0, 40));
  useEffect(() => { run('video.read_notices', {}, { silent: true }); }, [run]);

  return (
    <>
      <div className="ph-yt-top">
        <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onBack}><BackGlyph size={21} /></button>
        <b style={{ fontSize: 17, flex: 1, marginLeft: 10 }}>Notifications</b>
      </div>
      <div className="ph-body">
        {notices.length === 0 ? (
          <div className="ph-empty">
            <b>Nothing Here</b>
            Turn the bell on for a channel and its uploads land here.
          </div>
        ) : notices.map((notice) => (
          <button
            key={notice.id}
            type="button"
            className="ph-row"
            onClick={() => {
              if (notice.videoId) onOpen(notice.videoId);
              else if (notice.channelId) onChannel(notice.channelId);
            }}
          >
            <span className="ph-row-text" style={{ paddingLeft: 2 }}>
              <span className="ph-card-title">{notice.text}</span>
              <span className="ph-card-meta">{ago(now, notice.at)}{notice.seen ? '' : ' · new'}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Playback settings
// ---------------------------------------------------------------------------

function PlaybackSettings({ onBack }: { onBack: () => void }) {
  const { run } = useGame();
  const prefs = useWorld(preferences);
  return (
    <>
      <div className="ph-yt-top">
        <button type="button" className="ph-iconbtn" aria-label="Back" onClick={onBack}><BackGlyph size={21} /></button>
        <b style={{ fontSize: 17, flex: 1, marginLeft: 10 }}>Playback</b>
      </div>
      <div className="ph-body">
        <div className="ph-section-head">Speed</div>
        <div className="ph-chips">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              className={`ph-chip${prefs.speed === speed ? ' ph-on' : ''}`}
              onClick={() => run('video.set_preferences', { speed })}
            >
              {speed}×
            </button>
          ))}
        </div>
        <p className="ph-card-meta" style={{ padding: '0 12px 8px' }}>
          Faster takes less of your day and leaves you with less of the video. Past one and a half
          you are skimming.
        </p>

        <div className="ph-section-head">Quality</div>
        <div className="ph-chips">
          {QUALITIES.map((quality) => (
            <button
              key={quality}
              type="button"
              className={`ph-chip${prefs.quality === quality ? ' ph-on' : ''}`}
              onClick={() => run('video.set_preferences', { quality })}
            >
              {quality === 'auto' ? 'Auto' : quality}
            </button>
          ))}
        </div>

        <div className="ph-section-head">And The Rest</div>
        <div className="ph-set-group">
          <button
            type="button"
            className="ph-set-row"
            onClick={() => run('video.set_preferences', { autoplay: !prefs.autoplay })}
          >
            Autoplay
            <span className="ph-set-value">{prefs.autoplay ? 'On' : 'Off'}</span>
          </button>
          <button
            type="button"
            className="ph-set-row"
            onClick={() => run('video.set_preferences', { captions: !prefs.captions })}
          >
            Captions
            <span className="ph-set-value">{prefs.captions ? 'On' : 'Off'}</span>
          </button>
        </div>
        <p className="ph-card-meta" style={{ padding: '10px 12px' }}>
          Captions only work where the video has them, and most do. With them on you take more in.
        </p>
      </div>
    </>
  );
}

/** The two pictures a channel has, both of them the player's own photos. */
function ChannelPictures({ channel, say }: { channel: VideoChannel; say: (text: string) => void }) {
  const { run } = useGame();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div className="ph-chips" style={{ padding: '0 12px 8px' }}>
        <button type="button" className="ph-chip" onClick={() => setOpen(true)}>Channel Pictures</button>
      </div>
    );
  }
  return (
    <div className="ph-panel">
      <h4>Channel Pictures</h4>
      <label className="ph-label">Banner</label>
      <ImagePicker
        frame="banner"
        image={channel.bannerImage}
        label="Channel banner"
        onChange={(image) => {
          const result = run('video.set_channel_image', { which: 'banner', image });
          if (result.ok) say(image ? 'Banner set.' : 'Banner removed.');
        }}
      />
      <label className="ph-label">Picture</label>
      <ImagePicker
        frame="avatar"
        image={channel.avatarImage}
        label="Channel picture"
        onChange={(image) => {
          const result = run('video.set_channel_image', { which: 'avatar', image });
          if (result.ok) say(image ? 'Picture set.' : 'Picture removed.');
        }}
      />
      <button type="button" className="ph-pill" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>Done</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/**
 * The app's own settings, in the app's own sections and the app's own order.
 *
 * Every row either changes something or says plainly what it cannot change.
 * Quality and playback speed are the ones that change a watch — the day it
 * costs and how much of it you take in — so they are the ones that open onto
 * the picker rather than a toggle.
 */
/** One line of the settings list: a glyph, a label, what it is set to now. */
interface SettingRow {
  key: string;
  head: string;
  label: string;
  icon: (props: { size?: number }) => React.ReactElement;
  value?: string;
  /** Premium wears its own tile rather than an outline glyph, as it does in the app. */
  tile?: boolean;
  onClick?: () => void;
}

/** The glyph column: an outline shape, or the Premium tile where the app puts one. */
function SettingIcon({ row }: { row: SettingRow }) {
  const Glyph = row.icon;
  if (row.tile) return <span className="ph-yset-tile" aria-hidden="true">P</span>;
  return <span className="ph-yset-icon"><Glyph size={24} /></span>;
}

function AppSettings({
  onBack, onPlayback, onLibrary, say,
}: { onBack: () => void; onPlayback: () => void; onLibrary: () => void; say: (text: string) => void }) {
  const { sim, run } = useGame();
  const prefs = useWorld(preferences);
  const paying = useWorld(hasPremium);
  const channel = useWorld(myChannel);
  const watched = useWorld((s) => minutesWatchedSince(s, s.player.id, s.now - MS_DAY));
  const history = useWorld((s) => Object.values(s.universe.watchHistory).filter((r) => r.personId === s.player.id).length);
  const notices = useWorld((s) => noticesOf(s, s.player.id).length);
  const [query, setQuery] = useState('');

  const set = (patch: Record<string, unknown>) => {
    const result = run('video.set_preferences', patch, { silent: true });
    if (!result.ok) say(result.error ?? 'That did not work.');
  };

  const rows: SettingRow[] = [
    { key: 'general', head: 'Account', label: 'General', icon: GearGlyph, value: 'Set By The Phone', onClick: () => say('The look of the phone is in the phone’s own Settings app, which is where it belongs.') },
    { key: 'switch', head: 'Account', label: 'Switch Or Manage Account', icon: AccountGlyph, value: sim.player.displayName, onClick: () => say('SLATE keeps one life, so there is one account and nothing to switch to.') },
    { key: 'family', head: 'Account', label: 'Family Center', icon: FamilyGlyph, onClick: () => say('Nobody else is signed in on this handset.') },
    { key: 'time', head: 'Account', label: 'Time Management', icon: ChartGlyph, value: `${watched} Min Today`, onClick: () => say(`${watched} minutes of watching in the last day. Three hours is where the app starts saying something about it.`) },
    { key: 'notifications', head: 'Account', label: 'Notifications', icon: BellGlyph, value: `${notices} In The Bell`, onClick: () => say('The bell fills when a channel you follow uploads, when your channel passes a round number, and when a month is paid.') },
    { key: 'premium', head: 'Account', label: 'Your Premium Benefits', icon: BadgeGlyph, tile: true, value: paying ? 'Active' : 'Not Subscribed', onClick: onLibrary },
    { key: 'purchases', head: 'Account', label: 'Purchases And Memberships', icon: TagGlyph, onClick: onLibrary },
    { key: 'languages', head: 'Account', label: 'Languages', icon: TranslateGlyph, value: 'English', onClick: () => say('The app is in English. SLATE does not translate itself yet.') },
    { key: 'history', head: 'Account', label: 'Manage All History', icon: ClockGlyph, value: `${history} Watched`, onClick: () => say('Your watch history is what the feed is built from. Nothing here deletes it, because the feed would then be built from nothing.') },
    { key: 'privacy', head: 'Account', label: 'Privacy', icon: ShieldGlyph, onClick: () => say('Nothing you do on this phone leaves the game. There is nothing to send and nowhere to send it.') },
    { key: 'connected', head: 'Account', label: 'Connected Apps', icon: LinkedGlyph, value: channel?.accountId ? 'Your Account' : 'None', onClick: () => say('The channel is tied to the account that carries the money, and nothing else is connected.') },
    { key: 'quality', head: 'Video And Audio Preferences', label: 'Quality', icon: HdGlyph, value: prefs.quality === 'auto' ? 'Auto' : prefs.quality, onClick: onPlayback },
    { key: 'playback', head: 'Video And Audio Preferences', label: 'Playback', icon: SpeedGlyph, value: `${prefs.speed}×`, onClick: onPlayback },
    { key: 'captions', head: 'Video And Audio Preferences', label: 'Captions', icon: CaptionsGlyph, value: prefs.captions ? 'On' : 'Off', onClick: () => set({ captions: !prefs.captions }) },
    { key: 'autoplay', head: 'Video And Audio Preferences', label: 'Autoplay', icon: PlayTriangleGlyph, value: prefs.autoplay ? 'On' : 'Off', onClick: () => set({ autoplay: !prefs.autoplay }) },
    { key: 'downloads', head: 'Video And Audio Preferences', label: 'Background And Downloads', icon: DownloadGlyph, value: paying ? 'With Premium' : 'Not Available', onClick: () => say(paying ? 'Downloads need somewhere to keep them. This handset streams.' : 'Downloads come with Premium.') },
    { key: 'uploads', head: 'Video And Audio Preferences', label: 'Uploads', icon: UploadGlyph, value: channel ? 'Your Channel' : 'No Channel', onClick: onLibrary },
    { key: 'livechat', head: 'Video And Audio Preferences', label: 'Live Chat', icon: LiveGlyph, value: 'On', onClick: () => say('Chat is on while you are live. What it collects is on the statement.') },
    { key: 'tv', head: 'Video And Audio Preferences', label: 'Watch On TV', icon: TvGlyph, onClick: () => say('There is no second screen in the house yet.') },
    { key: 'help', head: 'Help And Policies', label: 'Help', icon: HelpGlyph, onClick: () => say('Everything on this phone is SLATE’s own. The channels are invented and nobody real is named.') },
    { key: 'feedback', head: 'Help And Policies', label: 'Send Feedback', icon: FeedbackGlyph, onClick: () => say('Nothing is sent anywhere. This is a game on your machine.') },
    { key: 'terms', head: 'Help And Policies', label: 'Terms Of Service', icon: DocGlyph, onClick: () => say('There is no service to agree to. This app runs inside SLATE and talks to nothing.') },
    { key: 'policy', head: 'Help And Policies', label: 'Privacy Policy', icon: LockGlyph, onClick: () => say('Your save stays on your machine. Nothing about you is collected, sent or sold, because there is nobody on the other end.') },
    { key: 'experimental', head: 'Help And Policies', label: 'Try Experimental New Features', icon: FlaskGlyph, value: 'None Open', onClick: () => say('Nothing is behind a flag right now. When something is, it will be listed here rather than switched on quietly.') },
    { key: 'about', head: 'Help And Policies', label: 'About', icon: InfoGlyph, value: 'SLATE', onClick: () => say('SLATE’s own video app. No third party artwork, no real creator, no real subscriber count.') },
  ].filter((row) => {
    const needle = query.trim().toLowerCase();
    return needle.length < 2 || row.label.toLowerCase().includes(needle);
  });

  const heads = [...new Set(rows.map((row) => row.head))];

  return (
    <>
      <div className="ph-yset-top">
        <button type="button" className="ph-iconbtn" onClick={onBack} aria-label="Close"><CloseGlyph size={24} /></button>
      </div>
      <div className="ph-body">
        <h2 className="ph-yset-title">Settings</h2>
        <div className="ph-yset-find">
          <SearchGlyph size={18} />
          <input value={query} placeholder="Search Settings" aria-label="Search Settings" onChange={(e) => setQuery(e.target.value)} />
        </div>
        {rows.length === 0 && <p className="ph-empty">Nothing matching that.</p>}
        {heads.map((head) => (
          <Fragment key={head}>
            <div className="ph-yset-head">{head}</div>
            <div className="ph-yset-group">
              {rows.filter((row) => row.head === head).map((row) => (
                <button key={row.key} type="button" className="ph-yset-row" onClick={row.onClick} disabled={!row.onClick}>
                  <SettingIcon row={row} />
                  <span className="ph-yset-label">
                    {row.label}
                    {row.value !== undefined && <i>{row.value}</i>}
                  </span>
                  <span className="ph-yset-go" aria-hidden="true"><ChevronRightGlyph size={16} /></span>
                </button>
              ))}
            </div>
          </Fragment>
        ))}
        <p className="ph-yset-foot">SLATE’s own video app. Everything in it is invented for the game.</p>
      </div>
    </>
  );
}
